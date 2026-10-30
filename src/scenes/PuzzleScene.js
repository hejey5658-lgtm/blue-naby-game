import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { waitForAssets } from './PreloadScene.js';
import { PUZZLES } from '../data/puzzles.js';
import { PUZZLE_DIALOGUE } from '../data/dialogue.js';
import { state, save } from '../state.js';
import { setTheme } from '../ui/theme.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { Button } from '../ui/Button.js';
import { drawPanel } from '../ui/frames.js';
import { sfx, vibrate } from '../ui/feedback.js';
import { ensurePuzzlePictures, PICTURE_DEPENDS, PIC_W, PIC_H } from '../puzzle/pictures.js';

// 블록 퍼즐 판 (systems.md 11절): 아래 바구니의 조각을 끌어 판 위 제자리에 놓는다.
// 제자리에서 한 칸의 42% 안이면 딱 붙고, 아니면 바구니로 돌아간다. 조각은 회전하지 않는다.
// 다 맞추면: 이음선이 사라짐 → 액자에 담겨 튀어나옴 → 빛줄기 → '완성!' 도장 → 친구 한 줄 대사 → 결과
const BOARD = { x: 60, y: 130, w: PIC_W, h: PIC_H };
const BASKET = { x: 20, y: 856, w: 680, h: 300 };
const SNAP = 0.42;
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export class PuzzleScene extends Phaser.Scene {
  constructor() { super('Puzzle'); }

  init(data) {
    this.initData = data;
    this.p = PUZZLES.find((x) => x.id === data.id) ?? PUZZLES[0];
    this.index = PUZZLES.indexOf(this.p);
    this.pieces = [];
    this.placed = 0;
    this.moves = 0;
    this.sec = 0;
    this.done = false;
    this.hintOn = false;
  }

  create() {
    if (waitForAssets(this, PICTURE_DEPENDS, this.initData)) return;
    ensurePuzzlePictures(this);
    setTheme('#ffe9c4', '#ffe9c4');
    this.insets = getSafeInsets(this.game);
    this.key = `puzzle_${this.p.id}`;
    this.add.rectangle(0, 0, UI.width, UI.height, 0xffe9c4).setOrigin(0);
    this.cw = BOARD.w / this.p.cols;
    this.ch = BOARD.h / this.p.rows;
    this.makeFrames();
    this.drawBoard();
    this.makeHud();
    this.makePieces();
    this.layoutBasket(false);
    this.setupDrag();
  }

  // 조각마다 그림의 한 부분을 프레임으로 등록 (그림 파일이 크면 비율대로)
  makeFrames() {
    const tex = this.textures.get(this.key);
    const src = tex.getSourceImage();
    this.ratio = (src.width || PIC_W) / PIC_W;
    this.p.pieces.forEach(([x, y, w, h], i) => {
      const name = `piece_${i}`;
      if (!tex.has(name)) tex.add(name, 0, x * this.cw * this.ratio, y * this.ch * this.ratio, w * this.cw * this.ratio, h * this.ch * this.ratio);
    });
  }

  drawBoard() {
    const g = this.add.graphics();
    g.fillStyle(0x2b2d5a, 0.12).fillRoundedRect(BOARD.x - 10, BOARD.y - 6, BOARD.w + 24, BOARD.h + 24, 18);
    g.fillStyle(0xfffaf0, 1).fillRoundedRect(BOARD.x - 12, BOARD.y - 12, BOARD.w + 24, BOARD.h + 24, 18);
    // 조각 프레임을 더하면 그림의 기본 프레임이 바뀌므로, 그림 전체는 '__BASE'로 지정한다
    this.hint = this.add.image(BOARD.x, BOARD.y, this.key, '__BASE').setOrigin(0).setDisplaySize(BOARD.w, BOARD.h).setAlpha(0);
    // 남은 조각 자리: 점선
    this.slots = this.add.graphics();
    this.drawSlots();
  }

  drawSlots() {
    const g = this.slots.clear();
    this.p.pieces.forEach(([x, y, w, h], i) => {
      if (this.pieces[i]?.placed) return;
      const px = BOARD.x + x * this.cw;
      const py = BOARD.y + y * this.ch;
      const pw = w * this.cw;
      const ph = h * this.ch;
      g.lineStyle(3, 0xb98a5e, 0.7);
      const dash = (x1, y1, x2, y2) => {
        const len = Math.hypot(x2 - x1, y2 - y1);
        for (let t = 0; t < len; t += 18) {
          const a = t / len; const b = Math.min(1, (t + 10) / len);
          g.lineBetween(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a, x1 + (x2 - x1) * b, y1 + (y2 - y1) * b);
        }
      };
      dash(px + 4, py + 4, px + pw - 4, py + 4); dash(px + pw - 4, py + 4, px + pw - 4, py + ph - 4);
      dash(px + pw - 4, py + ph - 4, px + 4, py + ph - 4); dash(px + 4, py + ph - 4, px + 4, py + 4);
    });
  }

  makeHud() {
    const top = this.insets.top;
    const back = this.add.container(64, 60 + top);
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 1).fillCircle(0, 0, 34);
    bg.fillStyle(0x2b2d5a, 1).fillTriangle(-12, 0, 8, -14, 8, 14);
    back.add(bg).setSize(96, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => { sfx('tap'); this.scene.start('PuzzleList'); });
    this.add.text(UI.width / 2, 44 + top, `${this.index + 1}단계 · ${this.p.title} 퍼즐`, { fontFamily: UI.fontTitle, fontSize: '32px', color: '#2b2d5a' }).setOrigin(0.5);
    this.info = this.add.text(UI.width / 2, 84 + top, '', { fontFamily: UI.font, fontSize: '22px', color: '#5a5c88' }).setOrigin(0.5);
    // 눈 버튼: 판 위에 그림을 흐리게 보여 주기
    const eye = this.add.container(UI.width - 64, 60 + top);
    const eg = this.add.graphics();
    const drawEye = () => {
      eg.clear();
      eg.fillStyle(this.hintOn ? 0x2f7bff : 0xffffff, 1).fillCircle(0, 0, 34);
      const c = this.hintOn ? 0xffffff : 0x2b2d5a;
      eg.lineStyle(4, c, 1).strokeEllipse(0, 0, 40, 24);
      eg.fillStyle(c, 1).fillCircle(0, 0, 7);
    };
    drawEye();
    eye.add(eg).setSize(96, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      this.hintOn = !this.hintOn;
      sfx('toggle');
      drawEye();
      this.tweens.add({ targets: this.hint, alpha: this.hintOn ? 0.28 : 0, duration: 200 });
    });
    this.updateInfo();
  }

  updateInfo() {
    this.info?.setText(`${this.placed} / ${this.p.pieces.length}조각 · ${fmt(this.sec)} · 옮긴 횟수 ${this.moves}`);
  }

  makePieces() {
    this.p.pieces.forEach(([x, y, w, h], i) => {
      const pw = w * this.cw;
      const ph = h * this.ch;
      const c = this.add.container(0, 0);
      const img = this.add.image(0, 0, this.key, `piece_${i}`).setDisplaySize(pw, ph);
      const edge = this.add.graphics();
      edge.lineStyle(4, 0xffffff, 1).strokeRect(-pw / 2, -ph / 2, pw, ph);
      edge.lineStyle(2, 0x2b2d5a, 0.25).strokeRect(-pw / 2 + 3, -ph / 2 + 3, pw - 6, ph - 6);
      c.add([img, edge]).setSize(pw, ph);
      c.setInteractive({ draggable: true, useHandCursor: true });
      const piece = { i, c, edge, w: pw, h: ph, home: { x: BOARD.x + x * this.cw + pw / 2, y: BOARD.y + y * this.ch + ph / 2 }, placed: false };
      c.piece = piece;
      this.pieces.push(piece);
    });
  }

  // 바구니: 남은 조각을 줄 맞춰 작게 놓는다 (남은 수에 맞춰 자동 정렬)
  layoutBasket(animate = true) {
    const left = this.pieces.filter((p) => !p.placed && !p.dragging);
    if (!left.length) return;
    const by = BASKET.y - Math.min(this.insets.bottom, 60);
    let scale = 0.7;
    const fits = (s) => {
      let x = 0; let y = 0; let rowH = 0;
      for (const p of left) {
        const w = p.w * s + 14; const h = p.h * s + 14;
        if (x + w > BASKET.w) { x = 0; y += rowH; rowH = 0; }
        x += w; rowH = Math.max(rowH, h);
      }
      return y + rowH <= BASKET.h;
    };
    while (scale > 0.2 && !fits(scale)) scale -= 0.03;
    let x = 0; let y = 0; let rowH = 0;
    const rows = [];
    let row = [];
    for (const p of left) {
      const w = p.w * scale + 14; const h = p.h * scale + 14;
      if (x + w > BASKET.w) { rows.push({ row, width: x, h: rowH }); row = []; x = 0; y += rowH; rowH = 0; }
      row.push({ p, x, y, w, h });
      x += w; rowH = Math.max(rowH, h);
    }
    rows.push({ row, width: x, h: rowH });
    for (const r of rows) {
      const off = BASKET.x + (BASKET.w - r.width) / 2;
      for (const it of r.row) {
        const tx = off + it.x + it.w / 2;
        const ty = by + it.y + it.h / 2;
        it.p.basketScale = scale;
        if (animate) this.tweens.add({ targets: it.p.c, x: tx, y: ty, scale, duration: 220, ease: 'Quad.easeOut' });
        else it.p.c.setPosition(tx, ty).setScale(scale);
      }
    }
  }

  setupDrag() {
    this.input.on('dragstart', (ptr, c) => {
      if (this.done || !c.piece || c.piece.placed) return;
      c.piece.dragging = true;
      this.children.bringToTop(c);
      this.tweens.add({ targets: c, scale: 1, duration: 120 });
      sfx('tap');
    });
    this.input.on('drag', (ptr, c, dx, dy) => {
      if (!c.piece || c.piece.placed) return;
      c.setPosition(dx, dy);
    });
    this.input.on('dragend', (ptr, c) => {
      const pc = c.piece;
      if (!pc || pc.placed) return;
      pc.dragging = false;
      this.moves++;
      const d = Phaser.Math.Distance.Between(c.x, c.y, pc.home.x, pc.home.y);
      if (d <= SNAP * Math.min(this.cw, this.ch)) {
        this.place(pc);
      } else {
        const onBoard = c.x > BOARD.x && c.x < BOARD.x + BOARD.w && c.y > BOARD.y && c.y < BOARD.y + BOARD.h;
        if (onBoard) this.say('거기가 아니야!');
        this.layoutBasket(true);
      }
      this.updateInfo();
    });
  }

  place(pc) {
    pc.placed = true;
    pc.c.disableInteractive();
    this.placed++;
    this.tweens.add({ targets: pc.c, x: pc.home.x, y: pc.home.y, scale: 1, duration: 120, ease: 'Back.easeOut' });
    this.drawSlots();
    vibrate('collect');
    sfx('next');
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const s = this.add.star(pc.home.x, pc.home.y, 5, 4, 9, 0xffd84a).setDepth(20);
      this.tweens.add({ targets: s, x: pc.home.x + Math.cos(a) * 60, y: pc.home.y + Math.sin(a) * 60, alpha: 0, duration: 380, onComplete: () => s.destroy() });
    }
    this.layoutBasket(true);
    if (this.placed === this.p.pieces.length) this.time.delayedCall(250, () => this.complete());
  }

  say(text) {
    const t = this.add.text(UI.width / 2, BOARD.y + BOARD.h / 2, text, { fontFamily: UI.fontTitle, fontSize: '36px', color: '#ffffff', backgroundColor: '#2b2d5acc', padding: { x: 18, y: 10 } }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, delay: 700, duration: 300, onComplete: () => t.destroy() });
  }

  update(time, delta) {
    if (this.done || !this.info) return;
    this.sec += Math.min(this.game.loop.rawDelta, 250) / 1000;
    if (Math.floor(this.sec) !== this.lastSec) { this.lastSec = Math.floor(this.sec); this.updateInfo(); }
  }

  // ── 완성 연출 (약 2.6초) ─────────────────────────
  complete() {
    this.done = true;
    const sec = Math.floor(this.sec);
    const prev = state.puzzle?.best?.[this.p.id];
    const isNew = prev == null || sec < prev;
    state.puzzle = state.puzzle ?? { cleared: {}, best: {} };
    state.puzzle.cleared = { ...(state.puzzle.cleared ?? {}), [this.p.id]: true };
    state.puzzle.best = { ...(state.puzzle.best ?? {}), [this.p.id]: isNew ? sec : prev };
    save();
    vibrate('special');
    // 1) 이음선이 스르르 사라짐
    this.tweens.add({ targets: this.pieces.map((p) => p.edge), alpha: 0, duration: 450 });
    this.time.delayedCall(500, () => {
      // 2) 어두워지고 햇살이 돌며, 그림이 하얀 액자에 담겨 튀어나옴
      const dim = this.add.rectangle(0, 0, UI.width, UI.height, 0x2b2d5a, 0).setOrigin(0).setDepth(40);
      this.tweens.add({ targets: dim, fillAlpha: 0.6, duration: 300 });
      const rays = this.add.graphics().setDepth(41).setPosition(UI.width / 2, 520).setAlpha(0);
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        rays.fillStyle(0xffe9a8, 0.35).fillTriangle(0, 0, Math.cos(a - 0.12) * 700, Math.sin(a - 0.12) * 700, Math.cos(a + 0.12) * 700, Math.sin(a + 0.12) * 700);
      }
      this.tweens.add({ targets: rays, alpha: 1, duration: 400 });
      this.tweens.add({ targets: rays, angle: 360, duration: 16000, repeat: -1 });
      const frame = this.add.container(UI.width / 2, 520).setDepth(42).setScale(0.5);
      const fw = 470; const fh = fw * (PIC_H / PIC_W);
      const fg = this.add.graphics();
      fg.fillStyle(0x2b2d5a, 0.3).fillRoundedRect(-fw / 2 - 18, -fh / 2 - 12, fw + 36, fh + 36, 14);
      fg.fillStyle(0xffffff, 1).fillRoundedRect(-fw / 2 - 20, -fh / 2 - 20, fw + 40, fh + 40, 14);
      const pic = this.add.image(0, 0, this.key, '__BASE').setDisplaySize(fw, fh);
      frame.add([fg, pic]);
      this.tweens.add({ targets: frame, scale: 1, duration: 520, ease: 'Back.easeOut' });
      for (let k = 0; k < 28; k++) {
        const a = Math.random() * Math.PI * 2;
        const s = this.add.star(UI.width / 2, 520, 5, 6, 13, k % 2 ? 0xffd84a : 0xffffff).setDepth(43);
        this.tweens.add({ targets: s, x: UI.width / 2 + Math.cos(a) * 380, y: 520 + Math.sin(a) * 380, alpha: 0, angle: 200, duration: 1100, onComplete: () => s.destroy() });
      }
      // 3) 반짝 빛줄기가 대각선으로 쓱
      this.time.delayedCall(600, () => {
        const shine = this.add.rectangle(-fw / 2, 0, 40, fh * 1.4, 0xffffff, 0.55).setAngle(20);
        frame.add(shine);
        this.tweens.add({ targets: shine, x: fw / 2, alpha: 0, duration: 650, ease: 'Sine.easeInOut', onComplete: () => shine.destroy() });
        const title = this.add.text(UI.width / 2, 130, `${this.p.title} 그림 완성!`, { fontFamily: UI.fontTitle, fontSize: '50px', color: '#ffffff', stroke: '#2b2d5a', strokeThickness: 10 }).setOrigin(0.5).setDepth(44).setAlpha(0);
        this.tweens.add({ targets: title, alpha: 1, y: 150, duration: 400 });
      });
      // 4) 빨간 '완성!' 도장이 날아와 액자 오른쪽 아래에 꾹
      this.time.delayedCall(1300, () => {
        const st = this.add.container(UI.width / 2 + fw / 2 - 30, 520 + fh / 2 - 30).setDepth(45).setAngle(-14);
        const sg = this.add.graphics();
        sg.lineStyle(8, 0xe8584a, 1).strokeCircle(0, 0, 70);
        sg.lineStyle(3, 0xe8584a, 1).strokeCircle(0, 0, 58);
        st.add([sg, this.add.text(0, 0, '완성!', { fontFamily: UI.fontTitle, fontSize: '42px', color: '#e8584a' }).setOrigin(0.5)]);
        st.setScale(3).setAlpha(0);
        this.tweens.add({
          targets: st, scale: 1, alpha: 1, duration: 260, ease: 'Quad.easeIn',
          onComplete: () => { this.cameras.main.shake(160, 0.008); vibrate('stamp'); sfx('open'); },
        });
      });
      this.time.delayedCall(2600, () => {
        this.game.events.once('dialogue-done', () => this.result(sec, isNew));
        this.scene.launch('Dialogue', { key: `puzzle_${this.p.id}_friend`, lines: PUZZLE_DIALOGUE[this.p.id], frame: 'cloud', form: ['caterpillar', 'moth', 'moth', 'butterfly', 'butterfly'][this.index] });
      });
    });
  }

  result(sec, isNew) {
    const layer = this.add.container(0, 0).setDepth(60);
    const g = this.add.graphics();
    drawPanel(g, 60, 860, 600, 380, 'cloud');
    layer.add([g,
      this.add.text(UI.width / 2, 920, `걸린 시간 ${fmt(sec)}${isNew ? '  새 기록!' : ''}`, { fontFamily: UI.fontTitle, fontSize: '34px', color: '#2f7bff' }).setOrigin(0.5),
      this.add.text(UI.width / 2, 970, `옮긴 횟수 ${this.moves}번`, { fontFamily: UI.font, fontSize: '26px', color: '#2b2d5a' }).setOrigin(0.5),
    ]);
    const next = PUZZLES[this.index + 1];
    if (next) {
      layer.add(new Button(this, UI.width / 2, 1060, { width: 480, height: 96, fontSize: 30, label: `다음: ${next.title} 퍼즐`, color: 0xffb347, shade: 0xd98a2b, textColor: '#2b2d5a', onPress: () => this.scene.start('Puzzle', { id: next.id }) }));
    } else {
      layer.add(this.add.text(UI.width / 2, 1060, '모든 퍼즐 완성! 대단해!', { fontFamily: UI.fontTitle, fontSize: '34px', color: '#e8584a' }).setOrigin(0.5));
    }
    layer.add(new Button(this, UI.width / 2 - 135, 1170, { width: 250, height: 90, fontSize: 28, label: '다시 하기', onPress: () => this.scene.start('Puzzle', { id: this.p.id }) }));
    layer.add(new Button(this, UI.width / 2 + 135, 1170, { width: 250, height: 90, fontSize: 28, label: '퍼즐 목록', color: 0xfdf7ea, shade: 0xc9c0ae, textColor: '#2b2d5a', onPress: () => this.scene.start('PuzzleList') }));
    layer.alpha = 0;
    this.tweens.add({ targets: layer, alpha: 1, duration: 260 });
  }
}
