import Phaser from 'phaser';
import { afterDialogue } from '../ui/afterDialogue.js';
import { UI } from '../data/ui.js';
import { waitForAssets } from './PreloadScene.js';
import { CHAPTERS, stageNo, stageLabel } from '../data/chapters.js';
import { MAZES } from '../data/mazes.js';
import { FORMS } from '../data/forms.js';
import { COLLECTIBLES } from '../data/items.js';
import { state, save } from '../state.js';
import { setTheme } from '../ui/theme.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { drawPanel } from '../ui/frames.js';
import { Button } from '../ui/Button.js';
import { sfx, vibrate } from '../ui/feedback.js';
import { josa } from '../ui/josa.js';
import { activeChallenge, challengeResult, fmt as fmtShort } from '../social/social.js';
import { LOOK } from '../data/mazeLooks.js';
import { drawBackdrop, drawFloor, drawWallScenery, addAmbient } from '../maze/scenery.js';
import { placeDrifters, patrolPath } from '../maze/drift.js';
import { saveMyResult } from '../social/match.js';
import { ITEMS } from '../data/items.js';
import { SERIES } from '../series.js';

// 미로: 쓱 밀면 그 방향으로 벽·갈림길·수집품까지 미끄러져 간다. 톡 누르면 멈춘다.
// 수집품을 다 모으면 출구가 열린다. 순찰하는 방해물·떨어지는 물방울·움직이는 웅덩이에 닿으면 퐁! → [다시 시작] → 체크포인트.
// 움직이는 거미줄에 닿으면 잠깐 느려진다 (design-brief 11절).
// (systems.md 3절, 화면 배치 9절: 상태 줄 y 0–110, 미로 y 120–1080, 아래 영역 y 1090–1280)
const AREA = { x: 8, y: 120, w: 704, h: 960 };
const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };
const PATROL_STEP_MS = 400;
const HELP_AFTER_SEC = 30;

const LAMP_PULL_MS = 1000; // 등불이 1초마다 1칸 끌어당김
const WATER_CYCLE = 4000;  // 물방울: 4초마다
const WATER_ON = 1000;     // 1초 동안 떨어짐 (0.5초 전 그림자로 예고)

const fmtTime = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export class MazeScene extends Phaser.Scene {
  constructor() { super('Maze'); }

  init(data) {
    this.initData = data;
    this.chapter = CHAPTERS.find((c) => c.id === (data.chapter ?? 'ch1'));
    this.maze = MAZES[this.chapter.id];
    this.form = FORMS[this.chapter.form];
    this.look = LOOK[this.chapter.id] ?? LOOK.ch1;
    // 둘이서 하기 (DuoScene): 저장·대사·별·도전장 없이 미로만, 끝나면 Duo로 돌아간다.
    // duo.remote = 각자 폰 대결 번호: 공평하게 아이템 없이, 카운트다운 뒤 출발, 끝나면 대결 화면(Match)으로
    this.duo = data.duo ?? null;
    this.remote = this.duo?.remote ?? null;
    this.hasItem = (k) => !this.remote && state.items.includes(k);
    this.fresh = !!data.fresh || !!this.duo;
    this.intro = !!data.intro && !this.duo;
    // 씬은 다시 쓰이므로 지난번 미로의 상태를 지운다
    Object.assign(this, { lampTold: false, scarfTold: false, umbrellaTold: false, slowUntil: 0, shineUntil: 0, lastPull: 0, locked: false, rolling: false, heldDir: null, stopRequested: false, itemBtns: [], shineGlow: null, swipeFrom: null, lastAutoSave: -1, popped: false, restartBtn: null });
  }

  create() {
    // 하는 탄 그림만 받으므로(모바일 최적화) 이 미로가 쓰는 그림이 다 있는지 확인한다
    const kinds = [this.chapter.patrolKind, ...(this.maze.patrols ?? []).map((p) => p.kind)].filter(Boolean).map((k) => `enemy_${k}`);
    if (waitForAssets(this, [`blue_${this.chapter.form}`, `face_blue_${this.chapter.form}`, `item_${this.chapter.item}`, SERIES.meta.helperTex, ...kinds], this.initData)) return;
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
    this.makeDuoTag();
    this.makePatrols();
    this.makeDrifters();
    // 상태 줄·아래 영역은 미로 위에
    const before = this.children.list.length;
    this.makeHud();
    this.makeBottom();
    this.children.list.slice(before).forEach((o) => { if (!o.depth) o.setDepth(8); });
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
    // 움직이는 웅덩이·물방울 박자는 미로가 열린 순간부터 잰다 (각자 폰 대결에서 두 폰이 같게)
    this.t0 = this.time.now;
    if (this.remote) this.countdown();
    // 나라에 도착한 인사 소리 (장마다 다름)
    this.time.delayedCall(250, () => sfx(`arrive_${this.chapter.id}`));
    const hint = () => {
      if (this.collected.size === 0 && this.sec === 0) {
        this.time.delayedCall(500, () => this.say(`${josa(COLLECTIBLES[this.chapter.item], '을', '를')} 모두 모으면 출구가 열려!`));
      }
    };
    // 장 도입 대사 (2장부터). 대사가 끝날 때까지 미로와 시간은 멈춰 있다.
    if (this.intro) {
      this.locked = true;
      afterDialogue(this, () => { this.locked = false; hint(); });
      this.time.delayedCall(350, () => this.scene.launch('Dialogue', { key: this.chapter.intro, frame: this.chapter.frame, form: this.chapter.form }));
    } else hint();
  }

  // 각자 폰 대결: 셋, 둘, 하나, 출발! 동안은 움직이지 않고 시간도 멈춰 있다
  countdown() {
    this.locked = true;
    const t = this.add.text(UI.width / 2, 600, '', { fontFamily: UI.fontTitle, fontSize: '140px', color: '#2f7bff', stroke: '#fffaf0', strokeThickness: 14 }).setOrigin(0.5).setDepth(20);
    ['셋', '둘', '하나', '출발!'].forEach((w, i) => this.time.delayedCall(i * 800, () => {
      t.setText(w).setScale(0.6);
      this.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.easeOut' });
      sfx(i < 3 ? 'tap' : 'ding');
    }));
    this.time.delayedCall(3200, () => {
      this.locked = false;
      this.tweens.add({ targets: t, alpha: 0, duration: 250, onComplete: () => t.destroy() });
    });
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
    if (this.duo) return;
    state.chapter = Math.max(state.chapter, stageNo(this.chapter.id));
    state.playing = this.chapter.id;
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
    // 움직이지 않는 바깥 풍경·바닥·벽은 한 장의 그림으로 구워 둔다 (매 프레임 다시 그리지 않게)
    const bg = this.make.graphics({ x: 0, y: 0 }, false);
    drawBackdrop(this, bg);
    // 바닥: 장마다 질감이 있으면 그것으로, 없으면 러그처럼 옅은 바둑판
    if (!drawFloor(this, bg)) {
      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          bg.fillStyle((x + y) % 2 ? look.floor2 : look.floor, 1).fillRect(this.ox + x * cell, this.oy + y * cell, cell, cell);
        }
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
        if (drawWallScenery(this, bg, x, y, px, py, front)) continue;
        bg.fillStyle(look.wallFront, 1).fillRoundedRect(px, py, cell, cell, front ? { tl: 0, tr: 0, bl: r, br: r } : 0);
        bg.fillStyle(look.wall, 1).fillRect(px, py, cell, front ? cell * 0.72 : cell);
        bg.fillStyle(look.wallTop, 1).fillRect(px + 3, py + 3, cell - 6, cell * 0.12);
        this.drawDeco(bg, px, py, x, y, front);
      }
    }
    if (this.textures.exists('maze_board')) this.textures.remove('maze_board');
    bg.generateTexture('maze_board', UI.width, UI.height);
    bg.destroy();
    this.add.image(0, 0, 'maze_board').setOrigin(0);
    // 햇살·먼지 같은 배경 움직임 (수집품·블루나비보다 아래)
    addAmbient(this);
    const g = this.add.graphics();
    this.drawSpecialTiles(g);
    // 체크포인트: 동그란 방석
    for (const [x, y] of this.find('C')) {
      g.fillStyle(0x2b2d5a, 0.12).fillEllipse(this.cx(x), this.cy(y) + cell * 0.08, cell * 0.78, cell * 0.5);
      g.fillStyle(0xff9fb8, 1).fillEllipse(this.cx(x), this.cy(y), cell * 0.72, cell * 0.46);
      g.fillStyle(0xffffff, 0.6).fillEllipse(this.cx(x) - cell * 0.12, this.cy(y) - cell * 0.06, cell * 0.2, cell * 0.1);
    }
    this.checkpointMarks = this.find('C');
  }

  // 벽 위 무늬: 장마다 무대가 다르게 보이도록 (밤 골목 창문 불빛, 시장 차양, 대나무 마디, 벚꽃, 빌딩 창, 튤립)
  drawDeco(g, px, py, x, y, front) {
    const { cell, look } = this;
    const h = front ? cell * 0.72 : cell;
    switch (look.deco) {
      case 'window':
        if ((x * 7 + y * 3) % 4 === 0) g.fillStyle(0xffe9a8, 0.9).fillRect(px + cell * 0.3, py + h * 0.35, cell * 0.4, cell * 0.28);
        break;
      case 'awning':
        if (front) for (let i = 0; i < 4; i++) g.fillStyle(i % 2 ? 0xffffff : 0xe8584a, 1).fillRect(px + (cell / 4) * i, py + h - cell * 0.16, cell / 4, cell * 0.16);
        break;
      case 'bamboo':
        g.fillStyle(0x3a7a38, 0.8).fillRect(px + cell * 0.3, py, cell * 0.08, h).fillRect(px + cell * 0.66, py, cell * 0.08, h);
        g.fillStyle(0xa8d98a, 1).fillRect(px + cell * 0.24, py + h * 0.5, cell * 0.2, cell * 0.05).fillRect(px + cell * 0.6, py + h * 0.3, cell * 0.2, cell * 0.05);
        break;
      case 'blossom':
        if ((x + y) % 2 === 0) { g.fillStyle(0xffffff, 0.9).fillCircle(px + cell * 0.3, py + cell * 0.18, cell * 0.08); g.fillStyle(0xff9fb8, 1).fillCircle(px + cell * 0.7, py + cell * 0.2, cell * 0.1); }
        break;
      case 'windows':
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) g.fillStyle(0xe3edf7, 0.9).fillRect(px + cell * (0.2 + i * 0.36), py + cell * (0.22 + j * 0.24), cell * 0.22, cell * 0.14);
        break;
      case 'tulip':
        if ((x * 5 + y) % 3 === 0) { g.fillStyle(0xffd84a, 1).fillCircle(px + cell * 0.5, py + cell * 0.22, cell * 0.12); g.fillStyle(0xff6b5b, 1).fillCircle(px + cell * 0.25, py + cell * 0.3, cell * 0.08); }
        break;
      default:
    }
  }

  // 낮은 장애물·거미줄·등불·바람·물 칸
  drawSpecialTiles(g) {
    const { cell, look } = this;
    this.lamps = [];
    this.waters = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const t = this.tile(x, y);
        const cx = this.cx(x);
        const cy = this.cy(y);
        if (t === 'b') {
          // 낮은 장애물: 둥근 덩어리 (애벌레는 못 넘고 나방·나비는 넘는다)
          g.fillStyle(0x2b2d5a, 0.15).fillEllipse(cx, cy + cell * 0.22, cell * 0.8, cell * 0.24);
          g.fillStyle(0x2b2d5a, 1).fillRoundedRect(cx - cell * 0.36, cy - cell * 0.26, cell * 0.72, cell * 0.56, cell * 0.16);
          g.fillStyle(look.low, 1).fillRoundedRect(cx - cell * 0.32, cy - cell * 0.22, cell * 0.64, cell * 0.48, cell * 0.14);
          g.fillStyle(0xffffff, 0.35).fillRoundedRect(cx - cell * 0.24, cy - cell * 0.18, cell * 0.3, cell * 0.08, cell * 0.04);
        } else if (t === 'w') {
          g.lineStyle(2, 0xffffff, 0.85);
          for (let a = 0; a < 6; a++) {
            const r = (a / 6) * Math.PI * 2;
            g.lineBetween(cx, cy, cx + Math.cos(r) * cell * 0.45, cy + Math.sin(r) * cell * 0.45);
          }
          for (const k of [0.18, 0.32, 0.45]) g.strokeCircle(cx, cy, cell * k);
        } else if (t === 'o') {
          // 등불: 빨간 둥근 등 + 은은한 빛 (나방은 끌려간다)
          g.fillStyle(0xffe9a8, 0.25).fillCircle(cx, cy, cell * 0.9);
          g.fillStyle(0x2b2d5a, 1).fillEllipse(cx, cy, cell * 0.62, cell * 0.72);
          g.fillStyle(0xe8584a, 1).fillEllipse(cx, cy, cell * 0.54, cell * 0.64);
          g.fillStyle(0xffd84a, 1).fillRect(cx - cell * 0.18, cy - cell * 0.36, cell * 0.36, cell * 0.08).fillRect(cx - cell * 0.18, cy + cell * 0.28, cell * 0.36, cell * 0.08);
          g.fillStyle(0xffe9a8, 0.8).fillEllipse(cx - cell * 0.08, cy - cell * 0.08, cell * 0.14, cell * 0.24);
          this.lamps.push([x, y]);
        } else if ('<>^v'.includes(t)) {
          const ang = { '>': 0, 'v': Math.PI / 2, '<': Math.PI, '^': -Math.PI / 2 }[t];
          g.fillStyle(look.wind ?? 0xbfe8a8, 0.45).fillRoundedRect(cx - cell * 0.46, cy - cell * 0.46, cell * 0.92, cell * 0.92, cell * 0.2);
          const pt = (a, r) => [cx + Math.cos(ang + a) * r, cy + Math.sin(ang + a) * r];
          for (const off of [-0.18, 0.14]) {
            const [ax, ay] = [cx + Math.cos(ang) * cell * off, cy + Math.sin(ang) * cell * off];
            const p1 = [ax + Math.cos(ang) * cell * 0.18, ay + Math.sin(ang) * cell * 0.18];
            const p2 = [ax + Math.cos(ang + 2.4) * cell * 0.18, ay + Math.sin(ang + 2.4) * cell * 0.18];
            const p3 = [ax + Math.cos(ang - 2.4) * cell * 0.18, ay + Math.sin(ang - 2.4) * cell * 0.18];
            g.fillStyle(0xffffff, 0.95).fillTriangle(...p1, ...p2, ...p3);
          }
          void pt;
        } else if (t === 'r') {
          // 물: 동그란 물웅덩이(분수·연못·스프링클러 자리). 떨어지기 전 그림자는 따로 그린다.
          g.fillStyle(look.water ?? 0x7fb2ff, 0.55).fillEllipse(cx, cy + cell * 0.1, cell * 0.8, cell * 0.44);
          g.fillStyle(0xffffff, 0.6).fillEllipse(cx - cell * 0.14, cy + cell * 0.04, cell * 0.2, cell * 0.08);
          const shadow = this.add.ellipse(cx, cy, cell * 0.8, cell * 0.5, 0x2b2d5a, 0.25).setVisible(false).setDepth(3);
          const drops = this.add.container(cx, cy).setDepth(6).setVisible(false);
          for (const [dx, dy] of [[-0.2, -0.3], [0.15, -0.1], [-0.05, 0.15], [0.25, 0.25]]) drops.add(this.add.ellipse(dx * cell, dy * cell, cell * 0.1, cell * 0.16, look.water ?? 0x7fb2ff));
          this.waters.push({ x, y, shadow, drops, phase: ((x * 7 + y * 13) % 4) * 1000 });
        }
      }
    }
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
  // 둘이서 하기: 블루나비 머리 위 작은 1P·2P 표시 (update에서 따라다닌다)
  makeDuoTag() {
    if (!this.duo || this.remote) { this.duoTag = null; return; }
    const n = this.duo.turn;
    this.duoTag = this.add.text(0, 0, `${n}P`, { fontFamily: UI.fontTitle, fontSize: `${Math.round(this.cell * 0.36)}px`, color: '#2b2d5a', backgroundColor: n === 1 ? '#7ec8ff' : '#ff9fb8', padding: { x: 6, y: 1 } }).setOrigin(0.5, 1).setDepth(6);
  }

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
    if (this.finished || this.rolling || this.locked) return;
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
    if (t === 'w') this.slowDown();
    if ('<>^v'.includes(t)) { this.blowWind(t); return; }

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

  // 바람 칸: 화살표 방향으로 벽에 닿을 때까지 최대 3칸 (실 목도리가 있으면 1칸)
  blowWind(t) {
    const dir = { '>': 'right', '<': 'left', '^': 'up', 'v': 'down' }[t];
    const max = this.hasItem('scarf') || this.hasItem('knitHat') ? 1 : 3;
    const [dx, dy] = DIRS[dir];
    let [x, y] = this.pos;
    let n = 0;
    while (n < max && this.passable(x + dx, y + dy)) { x += dx; y += dy; n++; }
    if (!n) { this.moving = false; this.playAnim('idle'); return; }
    sfx('tap');
    this.queued = null;
    this.tweens.add({
      targets: this.blue, x: this.cx(x), y: this.cy(y), angle: 360, duration: 120 * n + 80, ease: 'Quad.easeOut',
      onComplete: () => {
        this.blue.angle = 0;
        this.pos = [x, y];
        this.stopRequested = true;
        this.arrive();
      },
    });
    if ((this.hasItem('scarf') || this.hasItem('knitHat')) && !this.scarfTold) { this.scarfTold = true; this.say(`${(ITEMS.scarf ?? ITEMS.knitHat).name} 덕분에 조금만 밀렸어!`, 1800); }
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

  // ── 순찰하는 방해물 (청소기·수레·죽순·스케이트보드). 순찰마다 kind가 있으면 그 그림 ──
  makePatrols() {
    this.patrols = (this.maze.patrols ?? []).map((raw) => {
      const path = patrolPath(raw);
      const key = `enemy_${raw.kind ?? this.chapter.patrolKind}`;
      const sp = this.add.image(this.cx(path[0][0]), this.cy(path[0][1]), this.textures.exists(key) ? key : 'enemy_vacuum')
        .setDisplaySize(this.cell * 0.92, this.cell * 0.92).setDepth(4);
      const p = { path, i: 0, d: 1, sp };
      this.time.addEvent({ delay: PATROL_STEP_MS, loop: true, callback: () => this.patrolStep(p) });
      return p;
    });
  }

  // ── 움직이는 웅덩이·거미줄 (단계마다 chapters.js 의 drift) ──
  // 길 위 곧은 3칸을 천천히 왔다 갔다. 웅덩이는 커졌다 작아졌다 해서 좁은 길에서도 지나갈 틈이 있다.
  makeDrifters() {
    const { cell } = this;
    const water = this.look.water ?? 0x7fb2ff;
    const stepMs = this.chapter.drift?.stepMs ?? 1000;
    const seed = stageNo(this.chapter.id);
    this.drifters = placeDrifters(this.maze, this.chapter.drift, seed).map((d, i) => {
      const [x, y] = d.cells[d.start];
      const c = this.add.container(this.cx(x), this.cy(y)).setDepth(d.type === 'puddle' ? 3 : 4);
      const g = this.add.graphics();
      if (d.type === 'puddle') {
        g.fillStyle(0x2b2d5a, 0.12).fillEllipse(0, cell * 0.08, cell * 0.92, cell * 0.56);
        g.fillStyle(0x2f7bff, 0.55).fillEllipse(0, 0, cell * 0.9, cell * 0.56);
        g.fillStyle(water, 0.95).fillEllipse(0, -cell * 0.02, cell * 0.8, cell * 0.46);
        g.fillStyle(0xffffff, 0.75).fillEllipse(-cell * 0.18, -cell * 0.1, cell * 0.22, cell * 0.08).fillCircle(cell * 0.2, cell * 0.06, cell * 0.04);
        const ring = this.add.ellipse(0, 0, cell * 0.5, cell * 0.28).setStrokeStyle(2, 0xffffff, 0.8);
        this.tweens.add({ targets: ring, scale: 1.5, alpha: 0, duration: 1400, repeat: -1, ease: 'Sine.easeOut' });
        c.add([g, ring]);
      } else {
        const r = cell * 0.44;
        for (const [w, col, a] of [[4, 0x2b2d5a, 0.35], [2, 0xffffff, 0.95]]) {
          g.lineStyle(w, col, a);
          for (let k = 0; k < 6; k++) { const ang = (k / 6) * Math.PI * 2 + 0.3; g.lineBetween(0, 0, Math.cos(ang) * r, Math.sin(ang) * r); }
          for (const f of [0.38, 0.7, 1]) g.strokeCircle(0, 0, r * f);
        }
        c.add(g);
        this.tweens.add({ targets: c, angle: 8, duration: 900 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      const o = { ...d, i: d.start, dir: d.start === 2 ? -1 : 1, sp: c, phase: (i * 977) % 3100, cool: 0 };
      this.time.addEvent({ delay: stepMs, loop: true, startAt: (i * 311) % stepMs, callback: () => this.driftStep(o, stepMs) });
      return o;
    });
  }

  driftStep(o, stepMs) {
    if (o.i + o.dir < 0 || o.i + o.dir > 2) o.dir *= -1;
    o.i += o.dir;
    const [x, y] = o.cells[o.i];
    this.tweens.add({ targets: o.sp, x: this.cx(x), y: this.cy(y), duration: stepMs * 0.8, ease: 'Sine.easeInOut' });
  }

  // 웅덩이 크기: 커져 있는 시간(위험) → 작아짐 → 작은 채로(안전) → 다시 커짐
  updateDrifters() {
    if (!this.drifters.length) return;
    const now = this.time.now;
    const { puddleWetMs: wet, puddleDryMs: dry } = UI.drift;
    const period = wet + dry;
    const safe = this.invulnerable || this.shineUntil > now;
    for (const o of this.drifters) {
      const near = Phaser.Math.Distance.Between(o.sp.x, o.sp.y, this.blue.x, this.blue.y) < this.cell * 0.55;
      if (o.type === 'puddle') {
        const t = (now - this.t0 + o.phase) % period;
        const ease = 250;
        let k = 1;
        if (t > wet) k = t < wet + ease ? 1 - (t - wet) / ease : t > period - ease ? (t - (period - ease)) / ease : 0;
        o.sp.setScale(0.25 + 0.75 * k);
        o.sp.setAlpha(0.45 + 0.55 * k);
        o.wet = k > 0.6;
        if (near && o.wet && !safe) {
          if (this.hasItem('umbrella')) {
            if (!this.umbrellaTold) { this.umbrellaTold = true; this.say('작은 우산 덕분에 웅덩이도 괜찮아!', 1800); }
          } else if (this.hasItem('tube')) {
            // 2탄 물놀이 튜브: 퐁! 대신 둥둥 잠깐 느려짐
            if (!(this.slowUntil > now)) { this.slowUntil = now + UI.drift.slowMs; this.say('튜브 덕분에 둥둥! 잠깐 느려졌어', 1600); }
          } else { this.pop(); return; }
        }
      } else if (near && !safe && now > o.cool && !(this.slowUntil > now)) {
        o.cool = now + UI.drift.slowMs + UI.drift.coolMs;
        this.slowDown();
        this.tweens.add({ targets: o.sp, scale: 1.25, duration: 120, yoyo: true });
      }
    }
  }

  // 거미줄(고정 칸·움직이는 거미줄 공통): 잠깐 느려짐
  slowDown() {
    this.slowUntil = this.time.now + UI.drift.slowMs;
    vibrate('collect');
    this.say('거미줄에 걸려서 잠깐 느려졌어!', 1600);
  }

  patrolStep(p) {
    if (p.path.length < 2) return;
    if (p.i + p.d < 0 || p.i + p.d >= p.path.length) p.d *= -1;
    p.i += p.d;
    const [x, y] = p.path[p.i];
    this.tweens.add({ targets: p.sp, x: this.cx(x), y: this.cy(y), duration: PATROL_STEP_MS, ease: 'Linear' });
    this.tweens.add({ targets: p.sp, angle: p.d * 8, duration: PATROL_STEP_MS / 2, yoyo: true });
  }

  // 방해물·웅덩이에 닿으면 "퐁!" 비눗방울처럼 터져 반짝이로 흩어지고 [다시 시작] 버튼이 뜬다 (design-brief 9-1).
  // 아프거나 깨지는 느낌이 아니라 놀라서 숨은 느낌. 버튼이 떠 있는 동안 시간은 멈춘다(locked).
  pop() {
    if (this.popped || this.finished) return;
    this.popped = true;
    this.invulnerable = true;
    this.rolling = true;
    this.locked = true;
    this.rolls++;
    this.moveTween?.stop();
    this.moving = false;
    this.queued = null;
    this.heldDir = null;
    vibrate('bump');
    sfx('pop');
    const { x, y } = this.blue;
    // 다시 나타날 자리를 먼저 저장해 둔다 (이때 앱을 닫아도 체크포인트에서 이어진다)
    this.pos = [...this.checkpoint];
    this.saveProgress();
    this.tweens.add({
      targets: this.blue, scale: this.blueScale * 1.3, duration: 110, ease: 'Quad.easeOut',
      onComplete: () => {
        this.blue.setVisible(false).setScale(this.blueScale);
        this.burst(x, y, false);
      },
    });
    this.say('앗, 퐁! 조금 쉬었다가 다시 해 보자!');
    this.time.delayedCall(520, () => this.showRestart());
  }

  // 블루나비 색 반짝이 조각 8개: 밖으로 흩어지거나(gather=false) 가운데로 모인다(true)
  burst(x, y, gather) {
    const colors = [0x7ec8ff, 0x2f7bff, 0xffffff, 0xff9fb8];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const far = { x: x + Math.cos(a) * this.cell * 0.9, y: y + Math.sin(a) * this.cell * 0.9 };
      const d = this.add.circle(gather ? far.x : x, gather ? far.y : y, this.cell * (i % 2 ? 0.07 : 0.1), colors[i % colors.length]).setDepth(6);
      this.tweens.add({
        targets: d, x: gather ? x : far.x, y: gather ? y : far.y, alpha: gather ? 1 : 0, scale: gather ? 0.4 : 1.4,
        duration: gather ? 380 : 480, ease: gather ? 'Quad.easeIn' : 'Quad.easeOut', onComplete: () => d.destroy(),
      });
    }
  }

  showRestart() {
    if (this.restartBtn) return;
    this.restartBtn = new Button(this, UI.width / 2, 600, {
      width: 340, height: 112, label: '다시 시작', fontSize: 40,
      onPress: () => this.respawn(),
    }).setDepth(20);
    this.restartBtn.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: this.restartBtn, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
  }

  // 체크포인트(없으면 시작 자리)에 반짝이가 모이며 다시 나타난다. 모은 수집품·시간은 그대로.
  respawn() {
    if (!this.restartBtn) return;
    this.restartBtn.destroy();
    this.restartBtn = null;
    sfx('respawn');
    const [x, y] = this.checkpoint;
    this.blue.setPosition(this.cx(x), this.cy(y)).setAngle(0).setAlpha(1);
    this.burst(this.blue.x, this.blue.y, true);
    this.time.delayedCall(380, () => {
      this.blue.setVisible(true).setScale(this.blueScale * 0.3);
      this.tweens.add({ targets: this.blue, scale: this.blueScale, duration: 260, ease: 'Back.easeOut' });
      this.pos = [x, y];
      this.rolling = false;
      this.locked = false;
      this.popped = false;
      this.playAnim('idle');
      this.tweens.add({ targets: this.blue, alpha: 0.4, duration: 120, yoyo: true, repeat: 3, onComplete: () => { this.invulnerable = false; } });
      this.saveProgress();
    });
  }

  // ── 상태 줄 ────────────────────────────────────
  makeHud() {
    const top = this.insets.top;
    const g = this.add.graphics();
    // 그 장의 창틀 색으로 된 선반
    const [h0, h1, h2] = this.look.hud;
    g.fillStyle(h0, 1).fillRoundedRect(8, 8 + top, UI.width - 16, 100, 26);
    g.fillStyle(h1, 1).fillRoundedRect(12, 10 + top, UI.width - 24, 90, 24);
    g.fillStyle(h2, 1).fillRoundedRect(28, 14 + top, UI.width - 56, 6, 3);

    // 일시정지 (왼쪽 위)
    const pb = this.add.container(64, 58 + top);
    const pg = this.add.graphics();
    pg.fillStyle(0xfffaf0, 1).fillCircle(0, 0, 34);
    pg.fillStyle(0x2b2d5a, 1).fillRoundedRect(-12, -14, 8, 28, 3).fillRoundedRect(4, -14, 8, 28, 3);
    pb.add(pg).setSize(96, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => this.openPause());

    this.add.text(UI.width / 2, 40 + top, stageLabel(this.chapter), {
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
    // 도전 중인 친구 기록이 있으면 타이머 아래에 함께 (systems.md 10절)
    const rival = this.duo ? null : activeChallenge();
    const rivalSec = rival?.times[this.chapter.id];
    const dn = this.duo?.names[this.duo.turn - 1];
    const duoName = this.remote ? '각자 폰 대결' : this.duo && (dn === `${this.duo.turn}P` ? `${dn} 차례` : `${this.duo.turn}P ${dn} 차례`);
    const best = state.records[this.chapter.id]?.mazeSec;
    const goalText = SERIES.meta.stars ? `별 기준 ${fmtTime(this.chapter.starSec)}` : best != null ? `내 기록 ${fmtTime(best)}` : '';
    this.targetText = this.add.text(UI.width - 40, 82 + top, duoName || (rivalSec ? `${rival.nick} ${fmtShort(rivalSec)}` : goalText), {
      fontFamily: UI.font, fontSize: '22px', color: '#ffe9a8',
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
    this.dot = this.add.image(70, by, SERIES.meta.helperTex, SERIES.meta.helperFrame).setDisplaySize(84, 84).setDepth(8).setAlpha(0);
    this.bubble = this.add.container(0, 0).setDepth(8).setAlpha(0);
    this.bubbleG = this.add.graphics();
    this.bubbleText = this.add.text(140, by, '', {
      fontFamily: UI.font, fontSize: '27px', color: '#2b2d5a', wordWrap: { width: 520, useAdvancedWrap: true },
    }).setOrigin(0, 0.5);
    this.bubble.add([this.bubbleG, this.bubbleText]);
    this.bubbleY = by;

    this.makeItemButton(bottom);

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

  // 오른쪽 아래 둥근 아이템 버튼 (미로마다 1번씩): 반짝가루 = UI.sparkleMs 동안 무엇에 닿아도 괜찮음,
  // 대나무 피리 = 가장 가까운 수집품 쪽 길 안내 (피리를 받은 중국 미로는 빼고)
  makeItemButton(bottom) {
    const list = [];
    if (this.hasItem('sparkle')) list.push({ key: 'sparkle', label: ITEMS.sparkle?.name ?? '반짝가루', color: 0xffd84a });
    if (this.hasItem('flute') && this.chapter.id !== 'ch4') list.push({ key: 'flute', label: '대나무 피리', color: 0x7cc56a });
    const y = (this.dpad ? 1036 : 1185) - (this.dpad ? 0 : bottom);
    list.forEach((item, n) => {
      const c = this.add.container(UI.width - 86 - n * 150, y).setDepth(9);
      const g = this.add.graphics();
      g.fillStyle(0x2b2d5a, 0.2).fillCircle(0, 6, 60);
      g.fillStyle(item.color, 1).fillCircle(0, 0, 60);
      g.fillStyle(0xffffff, 0.35).fillEllipse(-16, -24, 40, 18);
      if (item.key === 'sparkle') {
        for (const [dx, dy, r] of [[0, -6, 16], [-22, 14, 9], [20, 16, 8]]) {
          const pts = [];
          for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; const rr = i % 2 ? r * 0.4 : r; pts.push({ x: dx + Math.cos(a) * rr, y: dy + Math.sin(a) * rr }); }
          g.fillStyle(0xffffff, 1).fillPoints(pts, true);
        }
      } else {
        g.fillStyle(0x3a7a38, 1).fillRoundedRect(-36, -8, 72, 16, 8);
        g.fillStyle(0x2b2d5a, 1).fillCircle(-14, 0, 3).fillCircle(0, 0, 3).fillCircle(14, 0, 3);
      }
      const t = this.add.text(0, 78, item.label, { fontFamily: UI.fontTitle, fontSize: '22px', color: '#2b2d5a', backgroundColor: '#ffffffcc', padding: { x: 8, y: 2 } }).setOrigin(0.5);
      c.add([g, t]).setSize(130, 130).setInteractive({ useHandCursor: true });
      this.itemBtns.push(c);
      c.on('pointerup', () => {
        if (c.used || this.locked) return;
        c.used = true;
        sfx('open');
        vibrate('collect');
        c.setAlpha(0.35);
        if (item.key === 'sparkle') this.shine();
        else this.showHelp();
      });
    });
  }

  // 반짝가루: 블루나비가 반짝반짝 빛나는 동안 방해물·웅덩이·거미줄·물방울에 닿아도 괜찮다
  shine() {
    this.shineUntil = this.time.now + UI.sparkleMs;
    this.say(`${ITEMS.sparkle?.name ?? '반짝가루'}! ${UI.sparkleMs / 1000}초 동안 무엇에 닿아도 괜찮아!`, 2000);
    this.shineGlow?.destroy();
    this.shineGlow = this.add.circle(this.blue.x, this.blue.y, this.cell * 0.62, 0xffe9a8, 0.55).setDepth(4.5);
    this.tweens.add({ targets: this.shineGlow, scale: 1.2, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
    this.time.delayedCall(UI.sparkleMs, () => { this.shineGlow?.destroy(); this.shineGlow = null; });
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
    kb.on('keydown-SPACE', () => { if (this.restartBtn) this.restartBtn.trigger(); else if (this.moving) this.stop(); });
    kb.on('keydown-ENTER', () => this.restartBtn?.trigger());
  }

  // ── 매 프레임 ───────────────────────────────────
  update() {
    // 1P·2P 표시는 멈춰 있을 때(퐁·대사)도 블루나비를 따라 숨거나 보인다
    if (this.duoTag) this.duoTag.setPosition(this.blue.x, this.blue.y - this.cell * 0.42).setVisible(this.blue.visible);
    if (this.finished || this.locked) return;
    // 실제 흐른 시간으로 잰다(일시정지·다른 앱 중에는 이 함수가 돌지 않아 멈춘다)
    const dt = Math.min(this.game.loop.rawDelta, 250) / 1000;
    this.sec += dt;
    this.sinceCollect += dt;
    this.timerText.setText(fmtTime(this.sec));
    this.timerText.setColor(!SERIES.meta.stars || this.sec <= this.chapter.starSec ? '#fffaf0' : '#ffd0c0');

    this.updateLamps();
    this.updateWater();
    this.updateDrifters();
    if (this.popped) return;
    this.shineGlow?.setPosition(this.blue.x, this.blue.y);

    if (!this.invulnerable && !(this.shineUntil > this.time.now)) {
      for (const p of this.patrols) {
        if (Phaser.Math.Distance.Between(p.sp.x, p.sp.y, this.blue.x, this.blue.y) < this.cell * 0.6) { this.pop(); break; }
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

  // 등불: 나방은 반경 2칸 안에서 1초마다 등불 쪽으로 1칸 끌려간다. 반대쪽으로 쓱 밀면 벗어난다.
  updateLamps() {
    if (!this.lamps.length || !this.form.canHop || this.moving || this.rolling) return;
    if (this.time.now - (this.lastPull ?? 0) < LAMP_PULL_MS) return;
    const [x, y] = this.pos;
    const lamp = this.lamps.find(([lx, ly]) => Math.abs(lx - x) + Math.abs(ly - y) <= 2 && (lx !== x || ly !== y));
    if (!lamp) return;
    this.lastPull = this.time.now;
    const dir = Math.abs(lamp[0] - x) >= Math.abs(lamp[1] - y)
      ? (lamp[0] > x ? 'right' : 'left')
      : (lamp[1] > y ? 'down' : 'up');
    if (!this.canGo(dir)) return;
    if (!this.lampTold) { this.lampTold = true; this.say('앗, 등불 쪽으로 끌려가! 반대로 쓱 밀어 봐!', 2200); }
    this.dir = dir;
    this.stopRequested = true;
    this.step();
    this.stopRequested = true;
  }

  // 물: 4초마다 1초 동안 물방울 (0.5초 전에 그림자). 맞으면 3초 느려짐, 작은 우산이 있으면 괜찮다.
  updateWater() {
    if (!this.waters.length) return;
    const now = this.time.now;
    for (const w of this.waters) {
      const t = (now - this.t0 + w.phase) % WATER_CYCLE;
      const warn = t >= WATER_CYCLE - WATER_ON - 500 && t < WATER_CYCLE - WATER_ON;
      const on = t >= WATER_CYCLE - WATER_ON;
      w.shadow.setVisible(warn || on);
      w.drops.setVisible(on);
      if (on) w.drops.y = this.cy(w.y) - this.cell * 0.2 + ((t % 300) / 300) * this.cell * 0.3;
      if (on && this.pos[0] === w.x && this.pos[1] === w.y && !(this.slowUntil > now)) {
        if (this.hasItem('umbrella')) {
          if (!this.umbrellaTold) { this.umbrellaTold = true; this.say('작은 우산 덕분에 하나도 안 젖었어!', 1800); }
        } else if (!this.invulnerable && !(this.shineUntil > now)) {
          this.pop();
          return;
        }
      }
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
    this.say(SERIES.meta.helperHint, 2600);
  }

  // ── 일시정지 ────────────────────────────────────
  openPause() {
    if (this.finished || !this.scene.isActive()) return;
    this.saveProgress();
    this.heldDir = null;
    this.scene.launch('Pause', { chapter: this.chapter.id, frame: this.chapter.frame, ...(this.duo ? { restartData: { chapter: this.chapter.id, fresh: true, duo: this.duo } } : {}) });
    this.scene.pause();
  }

  // ── 출구 도착 ───────────────────────────────────
  finish() {
    this.finished = true;
    this.moving = false;
    this.playAnim('idle');
    const sec = Math.floor(this.sec);
    if (this.duo) { this.finishDuo(sec); return; }
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

  finishDuo(sec) {
    const { names, turn } = this.duo;
    const results = [...this.duo.results];
    results[turn - 1] = { sec, rolls: this.rolls };
    sfx('open');
    vibrate('special');
    const c = this.add.container(UI.width / 2, 600).setDepth(20);
    const g = this.add.graphics();
    drawPanel(g, -280, -90, 560, 180, this.chapter.frame);
    c.add([g,
      this.add.text(0, -24, `${names[turn - 1]} 기록 ${fmtTime(sec)}`, { fontFamily: UI.fontTitle, fontSize: '40px', color: '#2f7bff' }).setOrigin(0.5),
      this.add.text(0, 32, `퐁 ${this.rolls}번`, { fontFamily: UI.font, fontSize: '26px', color: '#2b2d5a' }).setOrigin(0.5)]);
    c.setScale(0.7).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    if (this.remote) {
      saveMyResult(this.remote, sec, this.rolls);
      this.time.delayedCall(1800, () => this.scene.start('Match', { id: this.remote }));
      return;
    }
    const next = turn === 1 ? { step: 'turn', turn: 2 } : { step: 'result' };
    this.time.delayedCall(1800, () => this.scene.start('Duo', { ...next, names, chapter: this.chapter.id, results }));
  }

  // 짧게 기록을 보여 주고 바로 대결로 (systems.md 4절: 출구에 닿으면 바로 대결 화면)
  showResult(sec, newRecord) {
    const c = this.add.container(UI.width / 2, 600).setDepth(20);
    const g = this.add.graphics();
    drawPanel(g, -280, -110, 560, 220, this.chapter.frame);
    const star = sec <= this.chapter.starSec;
    c.add([
      g,
      this.add.text(0, -36, `미로 기록 ${fmtTime(sec)}${newRecord ? '  새 기록!' : ''}`, { fontFamily: UI.fontTitle, fontSize: '38px', color: '#2f7bff' }).setOrigin(0.5),
      this.add.text(0, 24, !SERIES.meta.stars ? `${this.chapter.name} 미로 통과!` : star ? `별 기준 ${fmtTime(this.chapter.starSec)} 안에 성공!` : `별 기준 ${fmtTime(this.chapter.starSec)} — 다음엔 더 빨리!`, { fontFamily: UI.font, fontSize: '26px', color: '#2b2d5a' }).setOrigin(0.5),
      this.add.text(0, 62, `퐁 ${this.rolls}번`, { fontFamily: UI.font, fontSize: '22px', color: '#5a5c88' }).setOrigin(0.5),
    ]);
    // 친구 도전 결과: 이기면 축하, 져도 "아깝다! 다시 도전?" (놀리는 말 없이)
    const ch = challengeResult(this.chapter.id, sec);
    let wait = 1900;
    if (ch) {
      wait = 3200;
      const cg = this.add.graphics();
      drawPanel(cg, -280, 124, 560, 120, 'cloud');
      const txt = ch.win
        ? `${josa(ch.nick, '을', '를')} 이겼어요! (${fmtShort(ch.theirs)})\n여권 → 자랑하기에서 결과를 보내 봐요`
        : `아깝다! ${ch.nick} ${fmtShort(ch.theirs)}\n여권에서 이 단계를 다시 도전할 수 있어요`;
      c.add([cg, this.add.text(0, 184, txt, { fontFamily: UI.font, fontSize: '24px', color: ch.win ? '#c0563a' : '#2b2d5a', align: 'center', lineSpacing: 6 }).setOrigin(0.5)]);
      if (ch.win) vibrate('special');
    }
    c.setScale(0.7).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    this.time.delayedCall(wait, () => {
      this.cameras.main.fadeOut(280, 233, 216, 180);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Battle', { chapter: this.chapter.id, bossIndex: 0 }));
    });
  }
}
