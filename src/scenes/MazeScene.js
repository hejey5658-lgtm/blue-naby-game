import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { CHAPTERS } from '../data/chapters.js';
import { MAZES } from '../data/mazes.js';
import { FORMS } from '../data/forms.js';
import { COLLECTIBLES } from '../data/items.js';
import { state, save } from '../state.js';
import { setTheme } from '../ui/theme.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { drawPanel } from '../ui/frames.js';
import { sfx, vibrate } from '../ui/feedback.js';
import { Button } from '../ui/Button.js';
import { josa } from '../ui/josa.js';

// 미로: 쓱 밀면 그 방향으로 벽·갈림길·수집품까지 미끄러져 간다. 톡 누르면 멈춘다.
// 수집품을 다 모으면 출구가 열린다. 순찰하는 방해물에 닿으면 체크포인트로 데구르르.
// (systems.md 3절, 화면 배치 9절: 상태 줄 y 0–110, 미로 y 120–1080, 아래 영역 y 1090–1280)
const AREA = { x: 8, y: 120, w: 704, h: 960 };
const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };
const PATROL_STEP_MS = 400;
const HELP_AFTER_SEC = 30;

// 장별 미로 색 (art-guide.md 3절 팔레트). 그림 파일(tile_*)이 생기면 바꾼다.
const LOOK = {
  ch1: { floor: 0xf3e3c3, floor2: 0xeedab4, wall: 0xb98a5e, wallTop: 0xd2a679, wallFront: 0x8f6440 },
};

const fmtTime = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export class MazeScene extends Phaser.Scene {
  constructor() { super('Maze'); }

  init(data) {
    this.chapter = CHAPTERS.find((c) => c.id === (data.chapter ?? 'ch1'));
    this.maze = MAZES[this.chapter.id];
    this.form = FORMS[this.chapter.form];
    this.look = LOOK[this.chapter.id] ?? LOOK.ch1;
    this.fresh = !!data.fresh;
  }

  create() {
    setTheme(this.chapter.theme, this.chapter.theme);
    const g = this.maze.grid;
    this.rows = g.length;
    this.cols = g[0].length;
    this.cell = Math.floor(Math.min(AREA.w / this.cols, AREA.h / this.rows));
    this.ox = AREA.x + (AREA.w - this.cols * this.cell) / 2;
    this.oy = AREA.y + (AREA.h - this.rows * this.cell) / 2;
    this.insets = getSafeInsets(this.game);
    // 바탕 (화면 아래 영역까지 그 장의 색으로)
    this.add.rectangle(0, 0, UI.width, UI.height, Phaser.Display.Color.HexStringToColor(this.chapter.theme).color).setOrigin(0);

    this.items = new Map(); // "x,y" → 스프라이트
    this.start = this.find('S')[0];
    this.exitCell = this.find('E')[0];
    this.restore();

    this.drawMaze();
    this.drawItems();
    this.drawExit();
    this.makeBlue();
    this.makePatrols();
    this.makeHud();
    this.makeBottom();
    this.setupInput();

    this.moving = false;
    this.dir = null;
    this.queued = null;
    this.invulnerable = false;
    this.finished = false;
    this.sinceCollect = 0;

    const onHidden = () => this.openPause();
    this.game.events.on('app-hidden', onHidden);
    this.events.once('shutdown', () => this.game.events.off('app-hidden', onHidden));

    this.saveProgress();
    if (this.collected.size === 0 && this.sec === 0) {
      this.time.delayedCall(500, () => this.say(`${josa(COLLECTIBLES[this.chapter.item], '을', '를')} 모두 모으면 출구가 열려!`));
    }
  }

  // ── 저장·이어하기 ──────────────────────────────
  restore() {
    const ms = !this.fresh && state.step === `${this.chapter.id}_maze` ? state.mazeState : null;
    this.pos = ms?.pos ? [...ms.pos] : [...this.start];
    this.checkpoint = ms?.checkpoint ? [...ms.checkpoint] : [...this.start];
    this.collected = new Set((ms?.collected ?? []).map((c) => c.join()));
    this.sec = ms?.sec ?? 0;
    this.rolls = ms?.rolls ?? 0;
  }

  saveProgress() {
    state.chapter = Number(this.chapter.id.slice(2));
    state.step = `${this.chapter.id}_maze`;
    state.form = this.chapter.form;
    state.mazeState = {
      pos: this.pos,
      checkpoint: this.checkpoint,
      collected: [...this.collected].map((k) => k.split(',').map(Number)),
      sec: Math.floor(this.sec),
      rolls: this.rolls,
    };
    save();
  }

  // ── 미로 그리기 (한 번만 그려 두는 정적 층) ────────
  find(ch) {
    const out = [];
    this.maze.grid.forEach((row, y) => [...row].forEach((c, x) => { if (c === ch) out.push([x, y]); }));
    return out;
  }

  tile(x, y) { return this.maze.grid[y]?.[x] ?? '#'; }

  cx(x) { return this.ox + x * this.cell + this.cell / 2; }

  cy(y) { return this.oy + y * this.cell + this.cell / 2; }

  drawMaze() {
    const { cell, look } = this;
    const g = this.add.graphics();
    // 바닥: 러그처럼 옅은 바둑판
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        g.fillStyle((x + y) % 2 ? look.floor2 : look.floor, 1).fillRect(this.ox + x * cell, this.oy + y * cell, cell, cell);
      }
    }
    // 벽: 위에서 비스듬히 본 가구 블록 — 윗면 밝게, 아래가 길이면 앞면을 진하게
    const r = cell * 0.18;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.tile(x, y) !== '#') continue;
        const px = this.ox + x * cell;
        const py = this.oy + y * cell;
        const front = this.tile(x, y + 1) !== '#';
        g.fillStyle(look.wallFront, 1).fillRoundedRect(px, py, cell, cell, front ? { tl: 0, tr: 0, bl: r, br: r } : 0);
        g.fillStyle(look.wall, 1).fillRect(px, py, cell, front ? cell * 0.72 : cell);
        g.fillStyle(look.wallTop, 1).fillRect(px + 3, py + 3, cell - 6, cell * 0.12);
      }
    }
    // 체크포인트: 동그란 방석
    for (const [x, y] of this.find('C')) {
      g.fillStyle(0x2b2d5a, 0.12).fillEllipse(this.cx(x), this.cy(y) + cell * 0.08, cell * 0.78, cell * 0.5);
      g.fillStyle(0xff9fb8, 1).fillEllipse(this.cx(x), this.cy(y), cell * 0.72, cell * 0.46);
      g.fillStyle(0xffffff, 0.6).fillEllipse(this.cx(x) - cell * 0.12, this.cy(y) - cell * 0.06, cell * 0.2, cell * 0.1);
    }
    this.checkpointMarks = this.find('C');
  }

  drawItems() {
    const key = `item_${this.chapter.item}`;
    for (const [x, y] of this.find('L')) {
      if (this.collected.has(`${x},${y}`)) continue;
      const sp = this.add.image(this.cx(x), this.cy(y), key).setDisplaySize(this.cell * 0.7, this.cell * 0.7);
      this.tweens.add({ targets: sp, y: sp.y - this.cell * 0.08, duration: 700 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.items.set(`${x},${y}`, sp);
    }
  }

  drawExit() {
    const [x, y] = this.exitCell;
    this.exitG = this.add.graphics();
    this.exitGlow = this.add.graphics().setAlpha(0);
    this.updateExit(false);
  }

  get total() { return this.find('L').length; }

  get exitOpen() { return this.collected.size >= this.total; }

  updateExit(animate) {
    const [x, y] = this.exitCell;
    const { cell } = this;
    const px = this.ox + x * cell;
    const py = this.oy + y * cell;
    const g = this.exitG.clear();
    if (this.exitOpen) {
      // 다락방 계단: 위로 올라가는 계단 + 빛
      g.fillStyle(0x8f6440, 1).fillRect(px, py, cell, cell);
      for (let i = 0; i < 4; i++) {
        g.fillStyle(i % 2 ? 0xd2a679 : 0xe9c48f, 1).fillRect(px + 4, py + cell - (i + 1) * cell * 0.22, cell - 8, cell * 0.2);
      }
      this.exitGlow.clear().fillStyle(0xffe9a8, 0.55).fillCircle(this.cx(x), this.cy(y), cell * 0.7);
      if (animate) {
        this.exitGlow.setAlpha(1);
        this.tweens.add({ targets: this.exitGlow, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });
      } else this.exitGlow.setAlpha(0.6);
    } else {
      // 닫힌 나무 문 + 잠금 표시
      g.fillStyle(0x6e4a2e, 1).fillRect(px + 2, py, cell - 4, cell);
      g.fillStyle(0x8f6440, 1).fillRect(px + 8, py + 6, cell - 16, cell - 10);
      g.fillStyle(0xffd84a, 1).fillCircle(px + cell * 0.72, py + cell * 0.55, cell * 0.07);
    }
  }

  // ── 블루나비 ───────────────────────────────────
  makeBlue() {
    const key = `blue_${this.chapter.form}`;
    this.blue = this.add.sprite(this.cx(this.pos[0]), this.cy(this.pos[1]), key, 0)
      .setDisplaySize(this.cell * 1.18, this.cell * 1.18).setDepth(5);
    this.blueScale = this.blue.scale;
    this.playAnim('idle');
  }

  playAnim(kind) {
    const key = `blue_${this.chapter.form}_${kind}`;
    if (this.anims.exists(key) && this.blue.anims.currentAnim?.key !== key) this.blue.play(key);
  }

  passable(x, y, form = this.form) {
    const t = this.tile(x, y);
    if (t === '#') return false;
    if (t === 'b') return form.canHop;
    if (t === 'E') return this.exitOpen;
    return true;
  }

  canGo(dir) {
    const [dx, dy] = DIRS[dir];
    return this.passable(this.pos[0] + dx, this.pos[1] + dy);
  }

  // 방향 입력 (스와이프·방향 버튼·키보드 공통)
  request(dir) {
    if (this.finished || this.rolling) return;
    if (this.moving) { this.queued = dir; return; }
    if (this.canGo(dir)) { this.dir = dir; this.step(); return; }
    const [dx, dy] = DIRS[dir];
    if (this.tile(this.pos[0] + dx, this.pos[1] + dy) === 'E') {
      const left = this.total - this.collected.size;
      this.say(`아직 ${josa(COLLECTIBLES[this.chapter.item], '이', '가')} ${left}개 남았어!`);
      this.nudge(dir);
    } else {
      this.nudge(dir);
    }
  }

  // 못 가는 쪽으로 밀면 살짝 '콩'
  nudge(dir) {
    const [dx, dy] = DIRS[dir];
    if (dx) this.blue.setFlipX(dx < 0);
    this.tweens.add({ targets: this.blue, x: this.blue.x + dx * 6, y: this.blue.y + dy * 6, duration: 70, yoyo: true });
  }

  stop() {
    this.stopRequested = true;
    this.queued = null;
  }

  step() {
    const [dx, dy] = DIRS[this.dir];
    if (dx) this.blue.setFlipX(dx < 0);
    this.moving = true;
    this.stopRequested = false;
    this.playAnim('move');
    const nx = this.pos[0] + dx;
    const ny = this.pos[1] + dy;
    const slow = this.slowUntil && this.time.now < this.slowUntil ? 2 : 1;
    this.moveTween = this.tweens.add({
      targets: this.blue, x: this.cx(nx), y: this.cy(ny), duration: this.form.stepMs * slow,
      onComplete: () => { this.pos = [nx, ny]; this.arrive(); },
    });
  }

  arrive() {
    const [x, y] = this.pos;
    const key = `${x},${y}`;
    const t = this.tile(x, y);
    let stopHere = false;
    if (this.items.has(key)) { this.collect(key); stopHere = true; }
    if (t === 'C' && this.checkpoint.join() !== key) this.reachCheckpoint();
    if (t === 'E') { this.finish(); return; }

    const held = this.heldDir && this.heldDir === this.dir;
    const sides = Object.keys(DIRS).filter((d) => d !== this.dir && d !== OPPOSITE[this.dir] && this.canGo(d));
    if (this.queued && this.canGo(this.queued)) {
      this.dir = this.queued;
      this.queued = null;
      this.step();
      return;
    }
    if (this.heldDir && this.canGo(this.heldDir) && this.heldDir !== this.dir) {
      this.dir = this.heldDir;
      this.step();
      return;
    }
    if (!stopHere && !this.stopRequested && this.canGo(this.dir) && (sides.length === 0 || held)) {
      this.step();
      return;
    }
    this.moving = false;
    this.playAnim('idle');
  }

  collect(key) {
    const sp = this.items.get(key);
    this.items.delete(key);
    this.collected.add(key);
    this.sinceCollect = 0;
    this.tweens.killTweensOf(sp);
    this.tweens.add({ targets: sp, y: sp.y - this.cell * 0.6, scale: sp.scale * 1.5, alpha: 0, duration: 380, ease: 'Quad.easeOut', onComplete: () => sp.destroy() });
    this.sparkle(sp.x, sp.y, 0x6cc35a);
    sfx('tap');
    vibrate('collect');
    this.updateHudItems(true);
    this.saveProgress();
    if (this.exitOpen) {
      this.updateExit(true);
      this.time.delayedCall(250, () => this.say('출구가 열렸어! 어서 가자!'));
    }
  }

  reachCheckpoint() {
    this.checkpoint = [...this.pos];
    this.sparkle(this.blue.x, this.blue.y, 0xff9fb8);
    this.saveProgress();
  }

  // 반짝이 (파티클 대신 작은 원 8개 — 30개 제한 안)
  sparkle(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const d = this.add.circle(x, y, this.cell * 0.07, color).setDepth(6);
      this.tweens.add({ targets: d, x: x + Math.cos(a) * this.cell * 0.7, y: y + Math.sin(a) * this.cell * 0.7, alpha: 0, scale: 0.4, duration: 420, ease: 'Quad.easeOut', onComplete: () => d.destroy() });
    }
  }

  // ── 순찰하는 방해물 (1장 윙윙 청소기) ──────────────
  makePatrols() {
    const key = this.chapter.patrolKind === 'vacuum' ? 'enemy_vacuum' : `enemy_${this.chapter.patrolKind}`;
    this.patrols = (this.maze.patrols ?? []).map((path) => {
      const sp = this.add.image(this.cx(path[0][0]), this.cy(path[0][1]), this.textures.exists(key) ? key : 'enemy_vacuum')
        .setDisplaySize(this.cell * 0.92, this.cell * 0.92).setDepth(4);
      const p = { path, i: 0, d: 1, sp };
      this.time.addEvent({ delay: PATROL_STEP_MS, loop: true, callback: () => this.patrolStep(p) });
      return p;
    });
  }

  patrolStep(p) {
    if (p.path.length < 2) return;
    if (p.i + p.d < 0 || p.i + p.d >= p.path.length) p.d *= -1;
    p.i += p.d;
    const [x, y] = p.path[p.i];
    this.tweens.add({ targets: p.sp, x: this.cx(x), y: this.cy(y), duration: PATROL_STEP_MS, ease: 'Linear' });
    this.tweens.add({ targets: p.sp, angle: p.d * 8, duration: PATROL_STEP_MS / 2, yoyo: true });
  }

  bump() {
    this.invulnerable = true;
    this.rolling = true;
    this.rolls++;
    this.moveTween?.stop();
    this.moving = false;
    this.queued = null;
    vibrate('bump');
    sfx('tap');
    this.say('데구르르~ 체크포인트로 돌아왔어!');
    const [x, y] = this.checkpoint;
    this.tweens.add({
      targets: this.blue, x: this.cx(x), y: this.cy(y), angle: 360, duration: 600, ease: 'Quad.easeInOut',
      onComplete: () => {
        this.blue.angle = 0;
        this.pos = [x, y];
        this.rolling = false;
        this.playAnim('idle');
        this.tweens.add({ targets: this.blue, alpha: 0.4, duration: 100, yoyo: true, repeat: 2, onComplete: () => { this.invulnerable = false; } });
        this.saveProgress();
      },
    });
  }

  // ── 상태 줄 ────────────────────────────────────
  makeHud() {
    const top = this.insets.top;
    const g = this.add.graphics();
    // 그 장의 창틀 색으로 된 선반
    g.fillStyle(0x8f6440, 1).fillRoundedRect(8, 8 + top, UI.width - 16, 100, 26);
    g.fillStyle(0xb98a5e, 1).fillRoundedRect(12, 10 + top, UI.width - 24, 90, 24);
    g.fillStyle(0xd2a679, 1).fillRoundedRect(28, 14 + top, UI.width - 56, 6, 3);

    // 일시정지 (왼쪽 위)
    const pb = this.add.container(64, 58 + top);
    const pg = this.add.graphics();
    pg.fillStyle(0xfffaf0, 1).fillCircle(0, 0, 34);
    pg.fillStyle(0x2b2d5a, 1).fillRoundedRect(-12, -14, 8, 28, 3).fillRoundedRect(4, -14, 8, 28, 3);
    pb.add(pg).setSize(96, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => this.openPause());

    this.add.text(UI.width / 2, 40 + top, `${this.chapter.id.slice(2)}장 · ${this.chapter.place}`, {
      fontFamily: UI.fontTitle, fontSize: '30px', color: '#fffaf0',
    }).setOrigin(0.5);

    // 수집품 칸
    this.hudItems = [];
    const n = this.total;
    const gap = 40;
    for (let i = 0; i < n; i++) {
      const x = UI.width / 2 - ((n - 1) * gap) / 2 + i * gap;
      this.hudItems.push(this.add.image(x, 80 + top, `item_${this.chapter.item}`).setDisplaySize(32, 32));
    }
    this.updateHudItems(false);

    this.timerText = this.add.text(UI.width - 40, 46 + top, '0:00', {
      fontFamily: UI.fontTitle, fontSize: '34px', color: '#fffaf0',
    }).setOrigin(1, 0.5);
    this.targetText = this.add.text(UI.width - 40, 82 + top, `별 기준 ${fmtTime(this.chapter.starSec)}`, {
      fontFamily: UI.font, fontSize: '18px', color: '#ffe9a8',
    }).setOrigin(1, 0.5);
  }

  updateHudItems(pop) {
    const got = this.collected.size;
    this.hudItems.forEach((im, i) => {
      im.setAlpha(i < got ? 1 : 0.3).setTint(i < got ? 0xffffff : 0x2b2d5a);
      if (pop && i === got - 1) this.tweens.add({ targets: im, scale: im.scale * 1.5, duration: 140, yoyo: true });
    });
  }

  // ── 아래 영역: 도트 말풍선, (설정 시) 방향 버튼 ────
  makeBottom() {
    const bottom = this.insets.bottom;
    this.dpad = state.settings.control === 'dpad';
    const by = (this.dpad ? 1036 : 1185) - (this.dpad ? 0 : bottom);
    this.dot = this.add.image(70, by, 'npc_dot').setDisplaySize(84, 84).setDepth(8).setAlpha(0);
    this.bubble = this.add.container(0, 0).setDepth(8).setAlpha(0);
    this.bubbleG = this.add.graphics();
    this.bubbleText = this.add.text(140, by, '', {
      fontFamily: UI.font, fontSize: '27px', color: '#2b2d5a', wordWrap: { width: 520, useAdvancedWrap: true },
    }).setOrigin(0, 0.5);
    this.bubble.add([this.bubbleG, this.bubbleText]);
    this.bubbleY = by;

    if (this.dpad) {
      const y = 1190 - bottom;
      const arrows = [['left', '왼쪽'], ['up', '위'], ['down', '아래'], ['right', '오른쪽']];
      arrows.forEach(([dir], i) => {
        const x = 108 + i * 168;
        const c = this.add.container(x, y);
        const g = this.add.graphics();
        g.fillStyle(0x8f6440, 1).fillRoundedRect(-70, -44, 140, 98, 28);
        g.fillStyle(0xfffaf0, 1).fillRoundedRect(-70, -50, 140, 96, 28);
        g.fillStyle(0x2b2d5a, 1);
        const a = { left: Math.PI, right: 0, up: -Math.PI / 2, down: Math.PI / 2 }[dir];
        const p = (ang, r) => ({ x: Math.cos(a + ang) * r, y: -2 + Math.sin(a + ang) * r });
        const p1 = p(0, 24); const p2 = p(2.4, 22); const p3 = p(-2.4, 22);
        g.fillTriangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        c.add(g).setSize(150, 110).setInteractive();
        c.on('pointerdown', () => { this.heldDir = dir; this.request(dir); });
        c.on('pointerup', () => { if (this.heldDir === dir) this.heldDir = null; });
        c.on('pointerout', () => { if (this.heldDir === dir) this.heldDir = null; });
      });
    }
  }

  say(text, ms = 2400) {
    const g = this.bubbleG.clear();
    this.bubbleText.setText(text);
    const w = Math.min(560, this.bubbleText.width + 48);
    const y = this.bubbleY;
    g.fillStyle(0x2b2d5a, 0.12).fillRoundedRect(118, y - 36 + 5, w, 72, 30);
    g.fillStyle(0xffffff, 1).fillRoundedRect(118, y - 36, w, 72, 30);
    g.fillTriangle(118, y - 6, 118, y + 14, 100, y + 6);
    this.tweens.killTweensOf([this.bubble, this.dot]);
    this.bubble.setAlpha(0);
    this.dot.setAlpha(0);
    this.tweens.add({ targets: [this.bubble, this.dot], alpha: 1, duration: 180 });
    this.tweens.add({ targets: [this.bubble, this.dot], alpha: 0, duration: 260, delay: ms });
  }

  // ── 입력: 화면 어디서나 스와이프, 톡 = 멈춤, 키보드 ──
  setupInput() {
    this.input.on('pointerdown', (p) => { this.swipeFrom = { x: p.x, y: p.y, used: false }; });
    this.input.on('pointermove', (p) => {
      const s = this.swipeFrom;
      if (!s || s.used || !p.isDown) return;
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < UI.swipeMinPx) return;
      s.used = true;
      this.request(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    });
    this.input.on('pointerup', (p, over) => {
      const s = this.swipeFrom;
      this.swipeFrom = null;
      if (!s || s.used || over.length) return;
      if (this.moving) this.stop();
    });

    const kb = this.input.keyboard;
    if (!kb) return;
    const keys = {
      left: ['LEFT', 'A'], right: ['RIGHT', 'D'], up: ['UP', 'W'], down: ['DOWN', 'S'],
    };
    for (const [dir, names] of Object.entries(keys)) {
      for (const n of names) {
        kb.on(`keydown-${n}`, () => { this.heldDir = dir; this.request(dir); });
        kb.on(`keyup-${n}`, () => { if (this.heldDir === dir) this.heldDir = null; });
      }
    }
    kb.on('keydown-ESC', () => this.openPause());
    kb.on('keydown-SPACE', () => this.moving && this.stop());
  }

  // ── 매 프레임 ───────────────────────────────────
  update() {
    if (this.finished) return;
    // 실제 흐른 시간으로 잰다(일시정지·다른 앱 중에는 이 함수가 돌지 않아 멈춘다)
    const dt = Math.min(this.game.loop.rawDelta, 250) / 1000;
    this.sec += dt;
    this.sinceCollect += dt;
    this.timerText.setText(fmtTime(this.sec));
    this.timerText.setColor(this.sec <= this.chapter.starSec ? '#fffaf0' : '#ffd0c0');

    if (!this.invulnerable) {
      for (const p of this.patrols) {
        if (Phaser.Math.Distance.Between(p.sp.x, p.sp.y, this.blue.x, this.blue.y) < this.cell * 0.6) { this.bump(); break; }
      }
    }
    if (this.sinceCollect >= HELP_AFTER_SEC && !this.exitOpen) {
      this.sinceCollect = 0;
      this.showHelp();
    }
    if (Math.floor(this.sec) % 10 === 0 && Math.floor(this.sec) !== this.lastAutoSave) {
      this.lastAutoSave = Math.floor(this.sec);
      this.saveProgress();
    }
  }

  // 30초 동안 못 찾으면 도트가 가장 가까운 수집품 쪽으로 반짝 화살표
  showHelp() {
    const startKey = this.pos.join();
    const prev = new Map([[startKey, null]]);
    const q = [this.pos];
    let goal = null;
    while (q.length && !goal) {
      const [x, y] = q.shift();
      for (const [dx, dy] of Object.values(DIRS)) {
        const k = `${x + dx},${y + dy}`;
        if (prev.has(k) || !this.passable(x + dx, y + dy)) continue;
        prev.set(k, `${x},${y}`);
        if (this.items.has(k)) { goal = k; break; }
        q.push([x + dx, y + dy]);
      }
    }
    if (!goal) return;
    let k = goal;
    while (prev.get(k) !== startKey) k = prev.get(k);
    const [nx, ny] = k.split(',').map(Number);
    const ang = Math.atan2(ny - this.pos[1], nx - this.pos[0]);
    const arrow = this.add.graphics().setDepth(7);
    const r = this.cell * 0.32;
    arrow.fillStyle(0xffd84a, 1).fillTriangle(r, 0, -r * 0.6, -r * 0.7, -r * 0.6, r * 0.7);
    arrow.lineStyle(3, 0x2b2d5a, 1).strokeTriangle(r, 0, -r * 0.6, -r * 0.7, -r * 0.6, r * 0.7);
    arrow.setPosition(this.blue.x + Math.cos(ang) * this.cell * 0.8, this.blue.y + Math.sin(ang) * this.cell * 0.8).setRotation(ang);
    this.tweens.add({ targets: arrow, x: `+=${Math.cos(ang) * 10}`, y: `+=${Math.sin(ang) * 10}`, duration: 300, yoyo: true, repeat: 4, onComplete: () => arrow.destroy() });
    this.say('에헴, 이쪽으로 가 봐!', 2600);
  }

  // ── 일시정지 ────────────────────────────────────
  openPause() {
    if (this.finished || !this.scene.isActive()) return;
    this.saveProgress();
    this.heldDir = null;
    this.scene.launch('Pause', { chapter: this.chapter.id, frame: this.chapter.frame });
    this.scene.pause();
  }

  // ── 출구 도착 ───────────────────────────────────
  finish() {
    this.finished = true;
    this.moving = false;
    this.playAnim('idle');
    const sec = Math.floor(this.sec);
    const id = this.chapter.id;
    const prevBest = state.records[id]?.mazeSec;
    const newRecord = prevBest == null || sec < prevBest;
    state.records[id] = { ...(state.records[id] || {}), mazeSec: newRecord ? sec : prevBest, rolls: this.rolls };
    state.mazeTimeStar = state.mazeTimeStar || {};
    if (sec <= this.chapter.starSec) state.mazeTimeStar[id] = true;
    state.step = `${id}_boss`;
    state.mazeState = null;
    save();
    sfx('open');
    vibrate('special');
    this.tweens.add({ targets: this.blue, y: this.blue.y - this.cell * 0.4, scale: this.blueScale * 1.3, duration: 300, yoyo: true });
    this.time.delayedCall(700, () => this.showResult(sec, newRecord && prevBest != null));
  }

  showResult(sec, newRecord) {
    const layer = this.add.container(0, 0).setDepth(20);
    const dim = this.add.rectangle(0, 0, UI.width, UI.height, 0x2b2d5a, 0.45).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    const y = 300;
    drawPanel(g, 50, y, 620, 620, this.chapter.frame);
    const star = sec <= this.chapter.starSec;
    const lines = [
      this.add.text(UI.width / 2, y + 90, '다락방 계단 도착!', { fontFamily: UI.fontTitle, fontSize: '46px', color: '#2b2d5a' }).setOrigin(0.5),
      this.add.text(UI.width / 2, y + 180, `미로 기록 ${fmtTime(sec)}${newRecord ? '  새 기록!' : ''}`, { fontFamily: UI.fontTitle, fontSize: '36px', color: '#2f7bff' }).setOrigin(0.5),
      this.add.text(UI.width / 2, y + 236, star ? `별 기준 ${fmtTime(this.chapter.starSec)} 안에 성공!` : `별 기준 ${fmtTime(this.chapter.starSec)} — 다음엔 더 빨리!`, { fontFamily: UI.font, fontSize: '26px', color: '#2b2d5a' }).setOrigin(0.5),
      this.add.text(UI.width / 2, y + 280, `데구르르 ${this.rolls}번`, { fontFamily: UI.font, fontSize: '26px', color: '#5a5c88' }).setOrigin(0.5),
      this.add.text(UI.width / 2, y + 356, '먼지몽과의 대결은\n다음 단계(4단계)에서 만나요!', { fontFamily: UI.font, fontSize: '27px', color: '#2b2d5a', align: 'center', lineSpacing: 8 }).setOrigin(0.5),
    ];
    layer.add([dim, g, ...lines]);
    const again = new Button(this, UI.width / 2 - 140, y + 520, { width: 250, height: 100, fontSize: 30, label: '미로 다시', onPress: () => this.scene.start('Maze', { chapter: this.chapter.id, fresh: true }) });
    const home = new Button(this, UI.width / 2 + 140, y + 520, { width: 250, height: 100, fontSize: 30, label: '타이틀로', color: 0xffb347, shade: 0xd98a2b, textColor: '#2b2d5a', onPress: () => this.scene.start('Title') });
    layer.add([again, home]);
    layer.alpha = 0;
    this.tweens.add({ targets: layer, alpha: 1, duration: 260 });
  }
}
