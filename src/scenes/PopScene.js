import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { POP } from '../data/popgame.js';
import { LOOK } from '../data/mazeLooks.js';
import { state, save } from '../state.js';
import { setTheme } from '../ui/theme.js';
import { drawPanel } from '../ui/frames.js';
import { Button } from '../ui/Button.js';
import { sfx, vibrate, unlockAudio } from '../ui/feedback.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { waitForAssets } from './PreloadScene.js';
import { drawBackdrop, addAmbient } from '../maze/scenery.js';
import { makePopIcons } from '../pop/icons.js';
import { PopBoard } from '../pop/PopBoard.js';
import { matchById, createMatch, sendInvite, saveMyResult, seededRandom } from '../social/match.js';
import { SERIES } from '../series.js';
import { platform } from '../platform.js';

// 기념품 퐁퐁 (design-brief 10·12절). scene.start('Pop', { step: 'menu' | 'solo' | 'duo' | 'remote', stage, match })
// 혼자 하기: 중국 → 일본 → 미국 → 캐나다, 나라마다 목표만큼 퐁 하면 도장 쾅 → 다음 나라(더 빨라짐).
// 둘이서 대결: 한 화면 두 판(왼쪽 1P · 오른쪽 2P) 동시에, 많이 퐁 하면 상대 판에 구름 블록. 먼저 꼭대기에 닿으면 진다.
// 각자 폰 대결(remote): 대결장의 시드로 두 폰에 같은 순서, POP.remoteSec 동안 점수 겨루기 → 대결 화면(Match)으로.
const STAGES = POP.stages;
// 지금 탄의 퐁퐁 판에 나오는 친구 얼굴 그림 (탄을 바꾸면 STAGES 내용이 바뀐다)
const faces = () => STAGES.flatMap((s) => s.types.map((t) => t.icon)).filter((k) => k.startsWith('face_') || (SERIES.n === 2 && k.startsWith('item_')));
const SWIPE = 40;

export class PopScene extends Phaser.Scene {
  constructor() { super('Pop'); }

  init(data) {
    this.initData = data;
    this.step = data.step ?? 'menu';
    this.stageIdx = Math.max(0, Math.min(STAGES.length - 1, data.stage ?? 0));
    this.boards = [];
    this.ended = false;
    this.overlay = null;
    this.match = data.match ? matchById(data.match) : null;
    if (this.step === 'remote' && !this.match) this.step = 'menu';
    if (this.match) this.stageIdx = this.match.stage;
  }

  create() {
    this.top = getSafeInsets(this.game).top;
    if (this.step === 'menu') { this.drawMenu(); return; }
    if (waitForAssets(this, faces(), this.initData)) return;
    makePopIcons(this);
    this.stage = STAGES[this.stageIdx];
    if (this.step === 'duo') this.startDuo(); else if (this.step === 'remote') this.startRemote(); else this.startSolo();
    this.setupInput();
    const onHidden = () => this.openPause();
    this.game.events.on('app-hidden', onHidden);
    this.events.once('shutdown', () => this.game.events.off('app-hidden', onHidden));
    this.time.delayedCall(250, () => sfx(`arrive_${this.stage.chapter}`));
  }

  // ── 처음 화면: 혼자 하기 · 둘이서 대결 + 나라 고르기 ──
  drawMenu() {
    setTheme('#f3e3c3', '#f3e3c3');
    this.add.rectangle(0, 0, UI.width, UI.height, 0xf3e3c3).setOrigin(0);
    makePopIcons(this);
    // 둥둥 떠 있는 기념품 몇 개
    STAGES.flatMap((s) => s.types.slice(2).map((t) => t.icon)).concat(STAGES.map((s) => s.types[0].icon)).slice(0, 6).filter((k) => this.textures.exists(k)).forEach((k, i) => {
      const im = this.add.image(90 + i * 108, 120 + this.top + (i % 2) * 34, k).setDisplaySize(70, 70);
      this.tweens.add({ targets: im, y: im.y - 12, duration: 1400 + i * 160, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    this.add.text(UI.width / 2, 250 + this.top, '기념품 퐁퐁', { fontFamily: UI.fontTitle, fontSize: '78px', color: '#2b2d5a' }).setOrigin(0.5);
    this.add.text(UI.width / 2, 345 + this.top, '같은 기념품 3개를 이으면 퐁!\n쓱 밀어 옮기고, 톡 눌러 돌려요', { fontFamily: UI.font, fontSize: '30px', color: '#5a5c88', align: 'center', lineSpacing: 10 }).setOrigin(0.5);
    this.add.text(UI.width / 2, 465 + this.top, SERIES.n === 2 ? '어느 계절부터 할까요?' : '어느 나라부터 할까요?', { fontFamily: UI.fontTitle, fontSize: '32px', color: '#2b2d5a' }).setOrigin(0.5);
    const reached = state.pop?.reached ?? 0;
    this.chips = STAGES.map((s, i) => {
      const x = UI.width / 2 + (i % 2 ? 160 : -160), y = 550 + this.top + Math.floor(i / 2) * 100;
      const c = this.add.container(x, y);
      const g = this.add.graphics();
      const t = this.add.text(0, -6, `${i + 1} · ${s.name}`, { fontFamily: UI.fontTitle, fontSize: '32px', color: '#2b2d5a' }).setOrigin(0.5);
      const sub = this.add.text(0, 26, i <= reached ? `한 칸 ${(s.dropMs / 1000).toFixed(2)}초` : '혼자 하기는 앞 나라를 깨면', { fontFamily: UI.font, fontSize: '22px', color: '#2b2d5a' }).setOrigin(0.5).setAlpha(0.75);
      c.add([g, t, sub]).setSize(300, 88).setInteractive({ useHandCursor: true }).on('pointerup', () => { sfx('toggle'); this.stageIdx = i; this.paintChips(); });
      return { i, g, t, sub, locked: i > reached };
    });
    this.paintChips();
    this.toastText = this.add.text(UI.width / 2, 790 + this.top, '', { fontFamily: UI.font, fontSize: '24px', color: '#c0563a' }).setOrigin(0.5);
    this.soloBtn = new Button(this, UI.width / 2, 900, {
      label: '혼자 하기',
      onPress: () => {
        unlockAudio();
        if (this.stageIdx > reached) { this.toastText.setText('혼자 하기는 앞 나라를 깨면 열려요. 둘이서 대결은 모든 나라 OK!'); return; }
        this.scene.start('Pop', { step: 'solo', stage: this.stageIdx });
      },
    });
    // 둘이서: 한 화면에서 같이 · 각자 폰으로 (대결장 링크 보내기)
    this.duoBtn = new Button(this, UI.width / 2 - 158, 1040, {
      width: 300, height: 110, fontSize: 30, label: '한 화면 대결', color: 0xff9fb8, shade: 0xe07a96, textColor: '#2b2d5a',
      onPress: () => { unlockAudio(); this.scene.start('Pop', { step: 'duo', stage: this.stageIdx }); },
    });
    this.remoteBtn = new Button(this, UI.width / 2 + 158, 1040, {
      width: 300, height: 110, fontSize: 30, label: '각자 폰 대결', color: 0x7ec8ff, shade: 0x4f9fe0, textColor: '#2b2d5a',
      onPress: async () => {
        unlockAudio();
        const m = createMatch('pop', this.stageIdx);
        await sendInvite(m);
        this.scene.start('Match', { id: m.id });
      },
    });
    new Button(this, UI.width / 2, 1180, {
      width: 320, height: 84, fontSize: 28, label: '처음 화면으로', color: 0xfffaf0, shade: 0xd8c8a8, textColor: '#2b2d5a', onPress: () => this.scene.start('Title'),
    });
    this.input.keyboard?.on('keydown-ENTER', () => this.soloBtn.trigger());
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('Title'));
  }

  paintChips() {
    for (const ch of this.chips) {
      const on = ch.i === this.stageIdx;
      ch.g.clear().fillStyle(on ? 0x2f7bff : 0xfffaf0, 1).fillRoundedRect(-150, -44, 300, 88, 26);
      if (!on) ch.g.lineStyle(3, 0xd2a679, 1).strokeRoundedRect(-150, -44, 300, 88, 26);
      ch.t.setColor(on ? '#ffffff' : '#2b2d5a');
      ch.sub.setColor(on ? '#ffffff' : '#2b2d5a');
    }
  }

  // ── 그 나라 배경 (새 미로 배경을 그대로): 판 자리를 알려 주고 바깥 풍경을 한 장으로 굽는다 ──
  backdrop(cols, rows, cell, ox, oy) {
    this.look = LOOK[this.stage.chapter];
    Object.assign(this, { cols, rows, cell, ox, oy });
    this.tile = () => '.';
    setTheme('#f3e3c3', '#f3e3c3');
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    drawBackdrop(this, g);
    if (this.textures.exists('pop_bg')) this.textures.remove('pop_bg');
    g.generateTexture('pop_bg', UI.width, UI.height);
    g.destroy();
    this.add.image(0, 0, 'pop_bg').setOrigin(0);
    addAmbient(this);
  }

  hudBar() {
    const top = this.top;
    const g = this.add.graphics().setDepth(8);
    const [h0, h1, h2] = this.look.hud;
    g.fillStyle(h0, 1).fillRoundedRect(8, 8 + top, UI.width - 16, 100, 26);
    g.fillStyle(h1, 1).fillRoundedRect(12, 10 + top, UI.width - 24, 90, 24);
    g.fillStyle(h2, 1).fillRoundedRect(28, 14 + top, UI.width - 56, 6, 3);
    const pb = this.add.container(64, 58 + top).setDepth(8);
    const pg = this.add.graphics();
    pg.fillStyle(0xfffaf0, 1).fillCircle(0, 0, 34);
    pg.fillStyle(0x2b2d5a, 1).fillRoundedRect(-12, -14, 8, 28, 3).fillRoundedRect(4, -14, 8, 28, 3);
    pb.add(pg).setSize(96, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => this.openPause());
    this.pauseBtn = pb;
  }

  text(x, y, s, size = 30, color = '#fffaf0', font = UI.fontTitle) {
    return this.add.text(x, y, s, { fontFamily: font, fontSize: `${size}px`, color }).setDepth(8);
  }

  // 다음 묶음 미리 보기 (작은 동그라미 두 개)
  preview(x, y, size) {
    const c = this.add.container(x, y).setDepth(8);
    const box = this.add.graphics();
    box.fillStyle(0x2b2d5a, 0.85).fillRoundedRect(-size * 0.7, -size * 1.25, size * 1.4, size * 2.5, 18);
    c.add(box);
    c.items = [];
    c.show = (pair) => {
      c.items.forEach((o) => o.destroy());
      c.items = pair.map((t, i) => {
        const ty = this.stage.types[t];
        const g = this.add.graphics();
        g.fillStyle(ty.bg, 1).fillCircle(0, (i ? 1 : -1) * size * 0.55, size * 0.5);
        const tex = this.textures.get(ty.icon);
        const im = this.add.image(0, (i ? 1 : -1) * size * 0.55, ty.icon, ty.frame != null && tex.has(ty.frame) ? ty.frame : (tex.has(0) ? 0 : '__BASE')).setDisplaySize(size * 0.8, size * 0.8);
        const pair2 = this.add.container(0, 0, [g, im]);
        c.add(pair2);
        return pair2;
      }).reverse();
    };
    return c;
  }

  // ── 혼자 하기 ──
  startSolo() {
    const cell = 72, ox = (UI.width - POP.cols * cell) / 2, oy = 236 + this.top;
    this.backdrop(POP.cols, POP.rows, cell, ox, oy);
    this.hudBar();
    const top = this.top;
    this.text(UI.width / 2, 40 + top, `${this.stageIdx + 1}/4 · ${this.stage.name}`, 32).setOrigin(0.5);
    this.scoreText = this.text(UI.width - 36, 44 + top, '0', 34).setOrigin(1, 0.5);
    this.goalText = this.text(UI.width / 2, 82 + top, '', 20, '#ffe9a8', UI.font).setOrigin(0.5);
    this.text(UI.width - 36, 82 + top, `최고 ${state.pop?.best?.[this.stage.id] ?? 0}`, 18, '#ffe9a8', UI.font).setOrigin(1, 0.5);
    // 목표 막대
    this.bar = this.add.graphics().setDepth(8);
    this.score = 0;
    this.popped = 0;
    const next = this.preview(ox + POP.cols * cell + 62, oy + 90, 40);
    this.text(ox + POP.cols * cell + 62, oy + 4, '다음', 20, '#2b2d5a').setOrigin(0.5);
    this.chainText = this.text(UI.width / 2, oy + 300, '', 64, '#2f7bff').setOrigin(0.5).setAlpha(0).setStroke('#fffaf0', 10);
    const board = new PopBoard(this, {
      x: ox, y: oy, cell, stage: this.stage,
      onNext: (p) => next.show(p),
      onPop: (n, chain) => {
        this.score += n * POP.scorePerPop * chain;
        this.popped += n;
        vibrate('collect');
        if (chain >= 2) this.flashChain(this.chainText, chain);
        this.updateSolo();
      },
      onTurnEnd: () => {
        if (this.popped < this.stage.goal) return true;
        this.stageClear();
        return false;
      },
      onTopOut: () => this.soloOver(),
    });
    next.show(board.next);
    this.boards = [board];
    this.updateSolo();
    board.start();
  }

  updateSolo() {
    this.scoreText.setText(String(this.score));
    const left = Math.max(0, this.stage.goal - this.popped);
    this.goalText.setText(left ? `목표까지 퐁 ${left}개` : '목표 달성!');
    const w = 260, x = UI.width / 2 - w / 2, y = 100 + this.top;
    this.bar.clear().fillStyle(0x2b2d5a, 0.35).fillRoundedRect(x, y, w, 8, 4)
      .fillStyle(0xffd84a, 1).fillRoundedRect(x, y, Math.max(8, w * Math.min(1, this.popped / this.stage.goal)), 8, 4);
  }

  flashChain(t, chain) {
    t.setText(`${chain}연쇄!`).setAlpha(1).setScale(0.6);
    this.tweens.killTweensOf(t);
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, delay: 700, duration: 300 });
    sfx('chain');
  }

  saveBest() {
    state.pop = state.pop ?? { reached: 0, best: {} };
    state.pop.best = state.pop.best ?? {};
    state.pop.best[this.stage.id] = Math.max(state.pop.best[this.stage.id] ?? 0, this.score);
    save();
  }

  stageClear() {
    if (this.ended) return;
    this.ended = true;
    this.saveBest();
    state.pop.reached = Math.max(state.pop.reached ?? 0, Math.min(STAGES.length - 1, this.stageIdx + 1));
    save();
    const last = this.stageIdx === STAGES.length - 1;
    const panel = this.panel(last ? SERIES.meta.popDone[0] : `${this.stage.name} 도장 쾅!`, last ? `${SERIES.meta.popDone[1]}\n이번 판 점수 ${this.score}` : `점수 ${this.score}\n다음 나라는 조금 더 빨라져요`, { stamp: true, buttons: 2 });
    this.stamp(panel);
    if (!last) this.overlayBtn(panel, 0, `다음 나라로 · ${STAGES[this.stageIdx + 1].name}`, () => this.scene.start('Pop', { step: 'solo', stage: this.stageIdx + 1 }));
    else this.overlayBtn(panel, 0, '다시 하기', () => this.scene.start('Pop', { step: 'menu' }));
    this.overlayBtn(panel, 1, '처음 화면으로', () => this.scene.start('Title'), true);
  }

  soloOver() {
    if (this.ended) return;
    this.ended = true;
    this.saveBest();
    sfx('pop');
    const panel = this.panel('조금 쉬었다가 다시 해 보자!', `점수 ${this.score} · 퐁 ${this.popped}개`, { buttons: 2 });
    this.overlayBtn(panel, 0, '이 나라부터 다시', () => this.scene.start('Pop', { step: 'solo', stage: this.stageIdx }));
    this.overlayBtn(panel, 1, '처음 화면으로', () => this.scene.start('Title'), true);
  }

  // ── 각자 폰 대결: 판 하나, 같은 순서, 2분 점수 ──
  startRemote() {
    const cell = 72, ox = (UI.width - POP.cols * cell) / 2, oy = 236 + this.top;
    this.backdrop(POP.cols, POP.rows, cell, ox, oy);
    this.hudBar();
    const top = this.top;
    this.text(UI.width / 2, 40 + top, `각자 폰 대결 · ${this.stage.name}`, 30).setOrigin(0.5);
    this.scoreText = this.text(UI.width - 36, 44 + top, '0', 34).setOrigin(1, 0.5);
    this.goalText = this.text(UI.width / 2, 84 + top, '', 24, '#ffe9a8').setOrigin(0.5);
    this.score = 0;
    this.popped = 0;
    this.leftMs = POP.remoteSec * 1000;
    this.running = false;
    const next = this.preview(ox + POP.cols * cell + 62, oy + 90, 40);
    this.text(ox + POP.cols * cell + 62, oy + 4, '다음', 20, '#2b2d5a').setOrigin(0.5);
    this.chainText = this.text(UI.width / 2, oy + 300, '', 64, '#2f7bff').setOrigin(0.5).setAlpha(0).setStroke('#fffaf0', 10);
    const board = new PopBoard(this, {
      x: ox, y: oy, cell, stage: this.stage, rng: seededRandom(this.match.seed),
      onNext: (p) => next.show(p),
      onPop: (n, chain) => {
        this.score += n * POP.scorePerPop * chain;
        this.popped += n;
        vibrate('collect');
        if (chain >= 2) this.flashChain(this.chainText, chain);
        this.updateRemote();
      },
      onTurnEnd: () => this.leftMs > 0,
      onTopOut: () => { this.flashChain(this.chainText, 0); this.chainText.setText('퐁! 다시 이어서'); board.clearTop(); },
    });
    next.show(board.next);
    this.boards = [board];
    this.updateRemote();
    this.countdown(() => { this.running = true; board.start(); });
  }

  updateRemote() {
    this.scoreText.setText(String(this.score));
    const s = Math.ceil(Math.max(0, this.leftMs) / 1000);
    this.goalText.setText(`남은 시간 ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
  }

  // 셋, 둘, 하나, 출발! (두 폰에서 소리 내어 같이 누르면 같이 시작)
  countdown(done) {
    const t = this.text(UI.width / 2, 640, '', 140, '#2f7bff').setOrigin(0.5).setDepth(20).setStroke('#fffaf0', 14);
    ['셋', '둘', '하나', '출발!'].forEach((w, i) => this.time.delayedCall(i * 800, () => {
      t.setText(w).setScale(0.6).setAlpha(1);
      this.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.easeOut' });
      sfx(i < 3 ? 'tap' : 'ding');
    }));
    this.time.delayedCall(3200, () => { this.tweens.add({ targets: t, alpha: 0, duration: 250, onComplete: () => t.destroy() }); done(); });
  }

  remoteOver() {
    if (this.ended) return;
    this.ended = true;
    this.boards.forEach((b) => { b.mode = 'frozen'; });
    saveMyResult(this.match.id, this.score, this.popped);
    sfx('win');
    vibrate('special');
    const panel = this.panel('시간 끝!', `점수 ${this.score} · 퐁 ${this.popped}개`, { buttons: 1 });
    this.overlayBtn(panel, 0, '결과 보기', () => this.scene.start('Match', { id: this.match.id }));
  }

  // ── 둘이서 대결 ──
  startDuo() {
    const cell = 52, gap = 40, w = POP.cols * cell;
    const ox = (UI.width - (w * 2 + gap)) / 2, oy = 262 + this.top;
    this.backdrop(Math.round((w * 2 + gap) / cell), POP.rows, cell, ox, oy);
    this.hudBar();
    const top = this.top;
    this.text(UI.width / 2, 40 + top, `${this.stage.name} · 한 칸 ${(this.stage.dropMs / 1000).toFixed(2)}초`, 28).setOrigin(0.5);
    this.duoScore = [0, 0];
    this.duoText = [0, 1].map((i) => this.text(i ? UI.width - 36 : 140, 82 + top, '', 22, '#ffe9a8', UI.font).setOrigin(i ? 1 : 0, 0.5));
    const names = ['1P', '2P'];
    this.chainTexts = [];
    this.boards = [0, 1].map((i) => {
      const bx = ox + i * (w + gap);
      const tag = this.add.graphics().setDepth(8);
      tag.fillStyle(i ? 0xff9fb8 : 0x7ec8ff, 1).fillRoundedRect(bx, oy - 92, 92, 52, 18);
      this.text(bx + 46, oy - 66, names[i], 32, '#2b2d5a').setOrigin(0.5);
      const next = this.preview(bx + w - 26, oy - 66, 22);
      next.list[0].clear().fillStyle(0x2b2d5a, 0.85).fillRoundedRect(-44, -22, 88, 44, 14);
      next.show = ((orig) => (pair) => {
        next.items.forEach((o) => o.destroy());
        next.items = pair.map((t, k) => {
          const ty = this.stage.types[t];
          const g = this.add.graphics().fillStyle(ty.bg, 1).fillCircle((k ? 1 : -1) * 20, 0, 18);
          const tex = this.textures.get(ty.icon);
          const im = this.add.image((k ? 1 : -1) * 20, 0, ty.icon, ty.frame != null && tex.has(ty.frame) ? ty.frame : (tex.has(0) ? 0 : '__BASE')).setDisplaySize(30, 30);
          const cc = this.add.container(0, 0, [g, im]);
          next.add(cc);
          return cc;
        });
        void orig;
      })(next.show);
      this.chainTexts[i] = this.text(bx + w / 2, oy + 240, '', 44, '#2f7bff').setOrigin(0.5).setAlpha(0).setStroke('#fffaf0', 8);
      const b = new PopBoard(this, {
        x: bx, y: oy, cell, stage: this.stage,
        onNext: (p) => next.show(p),
        onPop: (n, chain) => {
          this.duoScore[i] += n * POP.scorePerPop * chain;
          if (chain >= 2) this.flashChain(this.chainTexts[i], chain);
          const send = Math.min(POP.cloud.max, (n >= POP.cloud.minPops ? Math.floor(n / 2) : 0) + (chain - 1) * POP.cloud.perChain);
          if (send > 0) {
            const other = this.boards[1 - i];
            other.pending += send;
            this.cloudNote(1 - i);
          }
          this.updateDuo();
        },
        onTopOut: () => this.duoOver(1 - i),
      });
      next.show(b.next);
      return b;
    });
    // 조작 안내: 폰이면 터치 한 줄, PC면 키보드 두 줄 (폰에서 작은 글자로 길게 쓰지 않게, 모바일 최적화 14절)
    const tip = (y, s) => this.add.text(UI.width / 2, oy + POP.rows * cell + y, s, { fontFamily: UI.font, fontSize: '22px', color: '#2b2d5a', backgroundColor: '#fffaf0cc', padding: { x: 10, y: 4 } }).setOrigin(0.5).setDepth(8);
    if (platform.isTouch) tip(56, '각자 자기 판 쪽을 쓱 밀고 톡 누르기');
    else { tip(46, '1P: A·D 옮기기 · W 돌리기 · S 내리기'); tip(86, '2P: ← → 옮기기 · ↑ 돌리기 · ↓ 내리기'); }
    this.updateDuo();
    this.boards.forEach((b) => b.start());
  }

  updateDuo() {
    this.duoText.forEach((t, i) => t.setText(`${i + 1}P ${this.duoScore[i]}점`));
  }

  cloudNote(i) {
    const b = this.boards[i];
    const t = this.text(b.x + (POP.cols * b.cell) / 2, b.y + 40, '구름이 놀러 왔어요!', 24, '#2b2d5a', UI.fontTitle).setOrigin(0.5).setBackgroundColor('#fffaf0').setPadding(10, 4, 10, 4);
    this.tweens.add({ targets: t, y: t.y + 30, alpha: 0, delay: 900, duration: 400, onComplete: () => t.destroy() });
  }

  duoOver(winner) {
    if (this.ended) return;
    this.ended = true;
    this.boards.forEach((b) => b.freeze());
    sfx('win');
    vibrate('special');
    const panel = this.panel(`${winner + 1}P 승리!`, `1P ${this.duoScore[0]}점 · 2P ${this.duoScore[1]}점`, { crown: true, buttons: this.stageIdx < STAGES.length - 1 ? 3 : 2 });
    let row = 0;
    if (this.stageIdx < STAGES.length - 1) this.overlayBtn(panel, row++, `다음 나라로 · ${STAGES[this.stageIdx + 1].name} (더 빨라요)`, () => this.scene.start('Pop', { step: 'duo', stage: this.stageIdx + 1 }));
    this.overlayBtn(panel, row++, '다시 겨루기', () => this.scene.start('Pop', { step: 'duo', stage: this.stageIdx }), row > 1);
    this.overlayBtn(panel, row, '처음 화면으로', () => this.scene.start('Title'), true);
  }

  // ── 결과 판: 왕관·도장·버튼 수에 맞춰 판 높이를 정한다 ──
  panel(title, body, { crown = false, stamp = false, buttons = 2 } = {}) {
    const layer = this.add.container(0, 0).setDepth(30);
    const dim = this.add.rectangle(0, 0, UI.width, UI.height, 0x2b2d5a, 0.45).setOrigin(0).setInteractive();
    let y = 300;
    const titleY = y + (crown ? 170 : 100);
    const bodyY = titleY + 82;
    const stampY = bodyY + 150;
    const btnY = (stamp ? stampY + 150 : bodyY + 130);
    const h = btnY - y + buttons * 120;
    y = Math.max(100, (UI.height - h) / 2 - 20);
    const shift = y - 300;
    const g = this.add.graphics();
    drawPanel(g, 50, y, 620, h, this.look.scenery?.kind === 'bamboo' ? 'moonGate' : 'woodWindow');
    layer.add([dim, g]);
    if (crown) {
      const cg = this.add.graphics();
      const cx = UI.width / 2, cy = y + 90;
      const pts = [{ x: cx - 60, y: cy + 20 }, { x: cx - 46, y: cy - 34 }, { x: cx - 18, y: cy }, { x: cx, y: cy - 44 }, { x: cx + 18, y: cy }, { x: cx + 46, y: cy - 34 }, { x: cx + 60, y: cy + 20 }];
      cg.fillStyle(0xffd84a, 1).fillPoints(pts, true).lineStyle(4, 0x2b2d5a, 1).strokePoints(pts, true);
      layer.add(cg);
    }
    layer.add(this.add.text(UI.width / 2, titleY + shift, title, { fontFamily: UI.fontTitle, fontSize: title.length > 12 ? '42px' : '50px', color: '#2b2d5a', align: 'center' }).setOrigin(0.5));
    layer.add(this.add.text(UI.width / 2, bodyY + shift, body, { fontFamily: UI.font, fontSize: '28px', color: '#5a5c88', align: 'center', lineSpacing: 8 }).setOrigin(0.5));
    layer.stampY = stampY + shift;
    layer.btnY = btnY + shift;
    layer.buttons = [];
    layer.setAlpha(0);
    this.tweens.add({ targets: layer, alpha: 1, duration: 220 });
    this.overlay = layer;
    this.input.keyboard?.once('keydown-ENTER', () => layer.buttons[0]?.trigger());
    return layer;
  }

  // 도장 쾅 (나라 이름이 든 동그란 입국 도장)
  stamp(layer) {
    const c = this.add.container(UI.width / 2, layer.stampY);
    const g = this.add.graphics();
    g.lineStyle(8, 0xc0563a, 1).strokeCircle(0, 0, 70).lineStyle(3, 0xc0563a, 1).strokeCircle(0, 0, 58);
    c.add([g, this.add.text(0, 0, this.stage.name, { fontFamily: UI.fontTitle, fontSize: '34px', color: '#c0563a' }).setOrigin(0.5)]);
    c.setAngle(-10).setScale(2).setAlpha(0);
    layer.add(c);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 260, delay: 300, ease: 'Quad.easeIn', onComplete: () => { this.cameras.main.shake(120, 0.005); sfx('stamp'); vibrate('stamp'); } });
  }

  overlayBtn(layer, row, label, onPress, sub = false) {
    const y = layer.btnY + row * 120;
    const b = new Button(this, UI.width / 2, y, sub
      ? { width: 380, height: 90, fontSize: 28, label, color: 0xfffaf0, shade: 0xd8c8a8, textColor: '#2b2d5a', onPress }
      : { width: 500, height: 100, fontSize: 30, label, onPress });
    b.setDepth(31);
    layer.add(b);
    layer.buttons.push(b);
    return b;
  }

  // ── 조작: 판마다 쓱(옮기기·아래로 내리기)·톡(돌리기), 키보드 ──
  boardAt(x) { return this.boards.length === 1 ? this.boards[0] : this.boards[x < UI.width / 2 ? 0 : 1]; }

  setupInput() {
    this.input.addPointer(2);
    this.touches = new Map();
    this.input.on('pointerdown', (p, over) => {
      if (over.length || this.ended) return;
      this.touches.set(p.id, { x: p.x, y: p.y, board: this.boardAt(p.x), moved: false, dropped: false });
    });
    this.input.on('pointermove', (p) => {
      const t = this.touches.get(p.id);
      if (!t || !p.isDown || t.dropped) return;
      const dx = p.x - t.x, dy = p.y - t.y;
      if (dy > SWIPE * 1.6 && Math.abs(dy) > Math.abs(dx)) { t.board.drop(); t.dropped = true; t.moved = true; return; }
      if (Math.abs(dx) >= SWIPE) { t.board.move(dx > 0 ? 1 : -1); t.x = p.x; t.moved = true; }
    });
    this.input.on('pointerup', (p) => {
      const t = this.touches.get(p.id);
      this.touches.delete(p.id);
      if (t && !t.moved && !this.ended) t.board.rotate();
    });
    const kb = this.input.keyboard;
    if (!kb) return;
    const bind = (key, fn) => kb.on(`keydown-${key}`, () => { if (!this.ended) fn(); });
    const [a, b] = [this.boards[0], this.boards[1] ?? this.boards[0]];
    const solo = this.boards.length === 1;
    // 혼자: 방향키·WASD 모두 / 둘이서: 1P = WASD, 2P = 방향키
    bind('A', () => a.move(-1)); bind('D', () => a.move(1)); bind('W', () => a.rotate()); bind('S', () => a.drop());
    bind('LEFT', () => b.move(-1)); bind('RIGHT', () => b.move(1)); bind('UP', () => b.rotate());
    if (solo) {
      kb.on('keydown-DOWN', () => { a.soft = true; });
      kb.on('keyup-DOWN', () => { a.soft = false; });
      bind('SPACE', () => a.drop());
    } else bind('DOWN', () => b.drop());
    kb.on('keydown-ESC', () => this.openPause());
  }

  update(time, delta) {
    if (this.step === 'menu' || this.ended) return;
    if (this.step === 'remote') {
      if (!this.running) return;
      this.leftMs -= Math.min(delta, 100);
      this.updateRemote();
      if (this.leftMs <= 0) { this.remoteOver(); return; }
    }
    for (const b of this.boards) b.update(Math.min(delta, 100));
  }

  openPause() {
    if (this.ended || !this.scene.isActive() || this.step === 'menu') return;
    this.scene.launch('Pause', { under: 'Pop', frame: 'woodWindow', restartLabel: '이 나라 처음부터', restartData: { step: this.step, stage: this.stageIdx, match: this.match?.id } });
    this.scene.pause();
  }
}
