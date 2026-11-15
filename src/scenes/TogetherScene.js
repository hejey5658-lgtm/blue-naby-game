import Phaser from 'phaser';
import { UI, landView } from '../data/ui.js';
import { setTheme } from '../ui/theme.js';
import { Button } from '../ui/Button.js';
import { sfx, unlockAudio } from '../ui/feedback.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { platform } from '../platform.js';
import { state } from '../state.js';
import { DATA, useSeries } from '../series.js';
import { createMatch, sendInvite } from '../social/match.js';

// [같이 하기] (design-brief 19절, 2026-11-15 바뀜): 두 화면.
//  ① 징검다리 (view 'stones'): 몇 명? (혼자·2명 — 3명은 2026-11-15 뺌) + 물 위 징검다리 돌 두 개
//     [미로 여행 돌]·[기념품 퐁퐁 돌]을 톡 → 바로 그 놀이의 고르기 화면으로. 혼자는 퐁퐁 돌만.
//  ② 고르기 (view 'setup', 왼쪽 위 [◀ 뒤로] = 징검다리로): 어디서? (1탄 나라·2탄 계절, 열린 곳) → 어떻게? (2명 = 한 폰으로·각자 폰) → [시작하기] / [대결장 보내기].
// 고른 것은 scene.restart 로 다시 그린다 (data = { view, players, game, pick: 'n:i', how }).
// (옛 3명 대결장 링크 D2-…는 match.js 가 그대로 읽는다 — 같이 하기에서 새로 만들지만 않음)
const CREAM = 0xf3e3c3, INK = 0x2b2d5a;
const SUB = { width: 300, height: 88, fontSize: 28, color: 0xfffaf0, shade: 0xd8c8a8, textColor: '#2b2d5a' };
const GAME_NAME = { maze: '미로 여행', pop: '기념품 퐁퐁' };

// 탄마다의 진행 (지금 탄은 state 맨 위, 다른 탄은 state.other)
const progressOf = (n) => ((state.series === 2 ? 2 : 1) === n ? state : state.other) ?? {};

// 고를 수 있는 판 목록: [{ n, i, name, open }]
function stagesFor(game, players) {
  const out = [];
  for (const n of [1, 2]) {
    const p = progressOf(n);
    if (game === 'maze') {
      const opened = Math.max(1, p.chapter ?? 1);
      DATA[n].CHAPTERS.forEach((c, i) => out.push({ n, i, id: c.id, name: c.name, open: i < opened }));
    } else {
      // 혼자 퐁퐁은 앞 나라를 깨야 다음이 열리고, 같이 하는 대결은 모두 OK (지금 규칙 그대로)
      const reached = p.pop?.reached ?? 0;
      DATA[n].STAGES.forEach((s, i) => out.push({ n, i, id: i, name: s.name, open: players > 1 || i <= reached }));
    }
  }
  return out;
}

export class TogetherScene extends Phaser.Scene {
  constructor() { super('Together'); }

  init(data) {
    this.players = (data.players ?? 2) === 1 ? 1 : 2; // 3명은 2026-11-15 뺌
    this.game_ = this.players === 1 ? 'pop' : data.game ?? 'maze';
    this.view = data.view === 'setup' ? 'setup' : 'stones';
    this.how = this.players === 1 ? 'solo' : data.how === 'remote' ? 'remote' : 'local';
    const list = stagesFor(this.game_, this.players);
    this.pick = list.find((s) => `${s.n}:${s.i}` === data.pick && s.open) ?? list.find((s) => s.open);
    this.busy = false;
  }

  snapshot() { return { view: this.view, players: this.players, game: this.game_, pick: `${this.pick.n}:${this.pick.i}`, how: this.how }; }

  redraw(change) { sfx('toggle'); this.scene.restart({ ...this.snapshot(), ...change }); }

  create() {
    setTheme('#f3e3c3', '#f3e3c3');
    this.add.rectangle(-2000, -2000, 4720, 5280, CREAM).setOrigin(0);
    this.top = getSafeInsets(this.game).top;
    if (this.view === 'setup') this.makeSetup(); else this.makeStones();
    // 아래: 대결함 하나 (가로는 왼쪽 칸 아래). [홈으로] 칸은 2026-11-15 뺌 — 왼쪽 위 [◀ 홈]·[◀ 뒤로]로
    const L = UI.landscape;
    const bx = L ? 260 : UI.width / 2, yb = L ? 650 : 1188;
    new Button(this, bx, yb, { ...SUB, label: '대결함', onPress: () => this.scene.start('Match', { step: 'box' }) });
    if (L) {
      const v = this.landscapeView();
      const ins = getSafeInsets(this.game);
      this.backChip.setPosition(v.left + 106 + ins.left / v.zoom, v.top + 56 + ins.top / v.zoom);
    }
  }

  // 가로 (18·19절): 왼쪽 칸 · 오른쪽 칸
  landscapeView() { return landView(0.78, 720, 440); }

  // 왼쪽 위 작은 알약 버튼 (◀ 홈 / ◀ 징검다리)
  backButton(label, onPress) {
    const back = this.add.container(110, 64 + this.top);
    const bg = this.add.graphics();
    const w = label.length > 4 ? 210 : 172;
    bg.fillStyle(0xffffff, 0.95).fillRoundedRect(-w / 2, -30, w, 60, 30).lineStyle(3, INK, 0.2).strokeRoundedRect(-w / 2, -30, w, 60, 30);
    back.add([bg, this.add.text(0, 0, label, { fontFamily: UI.fontTitle, fontSize: '26px', color: '#2b2d5a' }).setOrigin(0.5)]);
    back.setSize(w + 8, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => { sfx('tap'); onPress(); });
    if (label.length > 4) back.x += (w - 172) / 2;
    this.backChip = back;
  }

  title(x, y, s, size = 64) {
    return this.add.text(x, y + this.top, s, { fontFamily: UI.fontTitle, fontSize: `${size}px`, color: '#2b2d5a' }).setOrigin(0.5);
  }

  // ① 징검다리 화면
  makeStones() {
    const L = UI.landscape, top = this.top;
    this.backButton('◀ 홈', () => this.scene.start('Title'));
    // 왼쪽(세로는 위): 제목 · 몇 명?
    const cx = L ? 260 : UI.width / 2;
    this.title(cx, L ? 150 : 100, '같이 하기');
    this.add.text(cx, (L ? 250 : 180) + top, '몇 명이서 할까?', { fontFamily: UI.fontTitle, fontSize: '32px', color: '#2b2d5a' }).setOrigin(0.5);
    this.chips((L ? 330 : 255), [[1, '혼자'], [2, '2명']], this.players, (v) => this.redraw({ players: v, view: 'stones' }), () => false, { dx: cx - UI.width / 2, dy: 0 });

    // 물과 징검다리 (세로: 가운데 큰 칸 / 가로: 오른쪽 칸)
    const W = L ? { x: 640, y: 90, w: 860, h: 760 } : { x: 40, y: 380, w: 640, h: 690 };
    W.y += L ? 0 : top;
    this.add.text(W.x + W.w / 2, W.y - 34, '어떤 놀이? 징검다리 돌을 톡!', { fontFamily: UI.fontTitle, fontSize: '30px', color: '#2f7bff' }).setOrigin(0.5);
    this.drawWater(W);
    // 돌 자리: 작은 돌로 이어진 길 위에 큰 돌 두 개 (미로 → 퐁퐁)
    const P = L
      ? { maze: [W.x + 250, W.y + 300], pop: [W.x + 620, W.y + 470], small: [[W.x + 90, W.y + 130], [W.x + 440, W.y + 400], [W.x + 790, W.y + 660], [W.x + 470, W.y + 650]] }
      : { maze: [W.x + 210, W.y + 210], pop: [W.x + 430, W.y + 480], small: [[W.x + 470, W.y + 70], [W.x + 340, W.y + 345], [W.x + 200, W.y + 600], [W.x + 590, W.y + 640]] };
    P.small.forEach(([x, y], k) => this.smallStone(x, y, k));
    const soloMaze = this.players === 1;
    this.bigStone(P.maze[0], P.maze[1], 'maze', soloMaze);
    this.bigStone(P.pop[0], P.pop[1], 'pop', false);
    if (soloMaze) this.add.text(P.maze[0], P.maze[1] + 128, '혼자 미로는 홈의 1탄·2탄 여행으로!', { fontFamily: UI.font, fontSize: '22px', color: '#2b2d5a', backgroundColor: '#ffffffcc', padding: { x: 10, y: 4 } }).setOrigin(0.5).setDepth(3);
    this.toastText = this.add.text(W.x + W.w / 2, W.y + W.h + 30, '', { fontFamily: UI.font, fontSize: '24px', color: '#c0563a' }).setOrigin(0.5);
  }

  // 물: 둥근 연못 + 물결 줄 + 연잎 (Graphics만 — 캔버스에서도 같게)
  drawWater(W) {
    const g = this.add.graphics();
    g.fillStyle(0x7fc8a0, 1).fillRoundedRect(W.x - 14, W.y - 14, W.w + 28, W.h + 28, 54); // 둑 (풀빛)
    g.fillStyle(0x9fdcf2, 1).fillRoundedRect(W.x, W.y, W.w, W.h, 44);
    g.fillStyle(0xb9e8f8, 1).fillRoundedRect(W.x + 18, W.y + 16, W.w - 36, W.h * 0.32, 36); // 위쪽 밝은 물
    g.lineStyle(4, INK, 0.18).strokeRoundedRect(W.x - 14, W.y - 14, W.w + 28, W.h + 28, 54);
    // 물결 (짧은 곡선 대신 낮은 반원 두 개)
    g.lineStyle(3, 0xffffff, 0.7);
    const waves = [[0.18, 0.55], [0.72, 0.22], [0.82, 0.86], [0.3, 0.9], [0.58, 0.62], [0.12, 0.3]];
    for (const [fx, fy] of waves) {
      const x = W.x + W.w * fx, y = W.y + W.h * fy;
      g.beginPath(); g.arc(x - 12, y, 12, Math.PI, 0, false); g.strokePath();
      g.beginPath(); g.arc(x + 12, y, 12, Math.PI, 0, false); g.strokePath();
    }
    // 연잎 (작은 틈이 있는 초록 동그라미)
    const pads = [[0.88, 0.45, 30], [0.08, 0.78, 26], [0.62, 0.08, 22]];
    for (const [fx, fy, r] of pads) {
      const x = W.x + W.w * fx, y = W.y + W.h * fy;
      g.fillStyle(0x5aa95f, 1).slice(x, y, r, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(340), false).fillPath();
      g.fillStyle(0xffffff, 0.25).fillCircle(x - r * 0.3, y - r * 0.3, r * 0.25);
    }
    // 작은 꽃 한 송이
    const fx = W.x + W.w * 0.88, fy = W.y + W.h * 0.45;
    g.fillStyle(0xff9fbb, 1); for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.fillCircle(fx + Math.cos(a) * 8, fy - 6 + Math.sin(a) * 8, 6); }
    g.fillStyle(0xffd84a, 1).fillCircle(fx, fy - 6, 5);
  }

  smallStone(x, y, k) {
    const g = this.add.graphics({ x, y });
    g.lineStyle(3, 0xffffff, 0.55).strokeEllipse(0, 10, 120, 46);
    g.fillStyle(0x000000, 0.12).fillEllipse(0, 12, 96, 36);
    g.fillStyle(0x9a9483, 1).fillEllipse(0, 6, 92, 40);
    g.fillStyle(0xd6cfbb, 1).fillEllipse(0, 0, 86, 34);
    g.fillStyle(0xffffff, 0.35).fillEllipse(-16, -6, 30, 10);
    if (!platform.reducedMotion) this.tweens.add({ targets: g, y: y + 4, duration: 1600 + k * 230, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // 큰 돌 (톡 하면 그 놀이로): 물결 고리 + 돌 + 위에 놀이 그림 + 이름
  bigStone(x, y, game, off) {
    const c = this.add.container(x, y).setDepth(2);
    const g = this.add.graphics();
    g.lineStyle(4, 0xffffff, 0.6).strokeEllipse(0, 34, 340, 120);
    g.lineStyle(3, 0xffffff, 0.35).strokeEllipse(0, 40, 390, 150);
    g.fillStyle(0x000000, 0.14).fillEllipse(0, 40, 300, 110);
    g.fillStyle(0x8a8474, 1).fillEllipse(0, 22, 300, 170);
    g.fillStyle(0xddd6c2, 1).fillEllipse(0, 6, 288, 156);
    g.fillStyle(0xffffff, 0.35).fillEllipse(-62, -46, 96, 26);
    g.fillStyle(0x7fbf6a, 1).fillEllipse(110, 46, 40, 16).fillEllipse(-118, 36, 28, 12); // 이끼
    g.lineStyle(5, INK, 0.85).strokeEllipse(0, 6, 288, 156);
    const icon = this.add.graphics({ x: 0, y: -22 });
    if (game === 'maze') drawMazeIcon(icon); else drawPopIcon(icon);
    const label = this.add.text(0, 50, GAME_NAME[game], { fontFamily: UI.fontTitle, fontSize: '34px', color: '#2b2d5a' }).setOrigin(0.5);
    c.add([g, icon, label]);
    if (off) c.setAlpha(0.45);
    c.setSize(300, 200).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => { if (!off) c.setScale(0.95); });
    c.on('pointerout', () => c.setScale(1));
    c.on('pointerup', () => {
      c.setScale(1);
      if (off) { this.say('혼자는 기념품 퐁퐁만 할 수 있어요'); return; }
      if (this.busy) return;
      this.busy = true;
      sfx('tap');
      // 퐁! 하고 돌이 살짝 뛴 뒤 그 놀이 고르기 화면으로
      this.tweens.add({ targets: c, scale: 1.1, y: y - 16, duration: 140, yoyo: true, ease: 'Quad.easeOut', onComplete: () => this.redraw({ view: 'setup', game }) });
    });
    if (!platform.reducedMotion && !off) this.tweens.add({ targets: c, y: y + 5, duration: 1400 + (game === 'pop' ? 300 : 0), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  // ② 고르기 화면: 어디서? · 어떻게? · 시작
  makeSetup() {
    const L = UI.landscape, top = this.top;
    this.backButton('◀ 뒤로', () => this.redraw({ view: 'stones' }));
    const q = (x, y, s) => this.add.text(x, y + top, s, { fontFamily: UI.fontTitle, fontSize: '32px', color: '#2b2d5a' }).setOrigin(0, 0.5);
    this.title(UI.width / 2 + (L ? 360 : 0), L ? 60 : 100, GAME_NAME[this.game_], 60);
    this.add.text(UI.width / 2 + (L ? 360 : 0), (L ? 118 : 160) + top, this.players === 1 ? '혼자 하기' : '2명이서', { fontFamily: UI.font, fontSize: '26px', color: '#5a5c88' }).setOrigin(0.5);

    // 어디서? (1탄 파랑 · 2탄 분홍, 열린 곳만) — 가로는 왼쪽 칸
    const y3 = L ? 230 : 230;
    q(60, y3, '어디서?');
    const list = stagesFor(this.game_, this.players);
    const per = 3, cw = 196, ch = 70;
    list.forEach((s, k) => {
      const x = UI.width / 2 + ((k % per) - 1) * (cw + 14), y = y3 + 60 + Math.floor(k / per) * (ch + 14) + top;
      const on = s.n === this.pick.n && s.i === this.pick.i;
      const c = this.add.container(x, y);
      const g = this.add.graphics();
      const base = s.n === 1 ? 0xd8e8ff : 0xffdbe5, act = s.n === 1 ? 0x2f7bff : 0xff7fa3;
      g.fillStyle(on ? act : base, s.open ? 1 : 0.45).fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 24);
      g.lineStyle(on ? 5 : 3, INK, s.open ? (on ? 1 : 0.35) : 0.15).strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 24);
      const label = `${s.n}탄 ${s.name}`;
      c.add([g, this.add.text(0, 0, label, { fontFamily: UI.fontTitle, fontSize: label.length > 6 ? '26px' : '28px', color: on ? '#ffffff' : '#2b2d5a' }).setOrigin(0.5).setAlpha(s.open ? 1 : 0.4)]);
      c.setSize(cw, ch + 10).setInteractive({ useHandCursor: true }).on('pointerup', () => {
        if (!s.open) { this.say(this.game_ === 'pop' ? '혼자 하기는 앞 나라를 깨면 열려요' : '이야기를 더 진행하면 열려요'); return; }
        this.redraw({ pick: `${s.n}:${s.i}` });
      });
    });
    const rows = Math.ceil(list.length / per);
    const yAfter3 = y3 + 60 + (rows - 1) * (ch + 14) + ch / 2;

    // 어떻게? (2명만) — 가로는 오른쪽 칸
    const R = L ? { dx: 720, dy: 0 } : { dx: 0, dy: 0 };
    const y4 = L ? 230 : yAfter3 + 50;
    if (this.players > 1) {
      q(60 + R.dx, y4, '어떻게?');
      this.chips(y4 + 64, [['local', '한 폰으로'], ['remote', '각자 폰']], this.how, (v) => this.redraw({ how: v }), () => false, R);
      const help = this.how === 'remote'
        ? '대결장 링크를 친구에게 보내 각자 폰으로 겨뤄요'
        : this.game_ === 'maze' ? '한 폰으로 번갈아 같은 미로, 더 빨리 나온 사람이 이겨요' : '한 화면을 반씩 나눠 동시에 겨뤄요';
      this.note(y4 + 124, help, R);
    }

    // 시작 (세로는 고르기 칸 바로 아래 — 빈 곳 없이)
    const yStart = L ? 470 : Math.min(1040, (this.players > 1 ? y4 + 124 : yAfter3) + 170);
    const label = this.how === 'remote' ? '대결장 보내기' : '시작하기';
    this.startBtn = new Button(this, UI.width / 2 + R.dx, yStart, { label, onPress: () => this.start() });
    this.toastText = this.add.text(UI.width / 2 + R.dx, yStart - 92, '', { fontFamily: UI.font, fontSize: '24px', color: '#c0563a' }).setOrigin(0.5);
  }

  // 고르기 칩 줄: items = [[값, 글]], dim(v) = 고를 수 없음
  chips(y, items, value, onPick, dim = () => false, o = { dx: 0, dy: 0 }) {
    const n = items.length, w = n === 3 ? 196 : 300, gap = 16;
    items.forEach(([v, text], i) => {
      const x = UI.width / 2 + (i - (n - 1) / 2) * (w + gap) + o.dx;
      const on = v === value, off = dim(v);
      const c = this.add.container(x, y + this.top + o.dy);
      const g = this.add.graphics();
      g.fillStyle(on ? 0xffb347 : 0xfffaf0, off ? 0.5 : 1).fillRoundedRect(-w / 2, -44, w, 88, 30);
      g.lineStyle(on ? 5 : 3, INK, off ? 0.2 : on ? 1 : 0.4).strokeRoundedRect(-w / 2, -44, w, 88, 30);
      c.add([g, this.add.text(0, 0, text, { fontFamily: UI.fontTitle, fontSize: '32px', color: '#2b2d5a' }).setOrigin(0.5).setAlpha(off ? 0.35 : 1)]);
      c.setSize(w, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => {
        if (on || off) return;
        onPick(v);
      });
    });
  }

  note(y, s, o = { dx: 0, dy: 0 }) {
    return this.add.text(UI.width / 2 + o.dx, y + this.top + o.dy, s, { fontFamily: UI.font, fontSize: '24px', color: '#5a5c88', align: 'center' }).setOrigin(0.5);
  }

  say(msg) {
    sfx('tap');
    this.toastText.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 2000, duration: 400 });
  }

  // 고른 대로 지금 있는 놀이 화면으로 (그 판의 탄으로 바꾼 뒤)
  async start() {
    if (this.busy) return;
    this.busy = true;
    unlockAudio();
    const s = this.pick;
    useSeries(s.n);
    if (this.how === 'remote') {
      const m = createMatch(this.game_, s.id, 2);
      await sendInvite(m);
      this.scene.start('Match', { id: m.id });
      return;
    }
    if (this.game_ === 'pop') {
      this.scene.start('Pop', { step: this.players === 1 ? 'solo' : 'duo', stage: s.i });
      return;
    }
    this.scene.start('Duo', { step: 'turn', names: ['1P', '2P'], chapter: s.id, turn: 1, results: [] });
  }
}

// 돌 위 그림 ① 미로: 작은 생울타리 미로 + 파란 블루나비 점 + 나무 문
function drawMazeIcon(g) {
  const s = 96, h = s / 2;
  g.fillStyle(0xfffaf0, 1).fillRoundedRect(-h, -h, s, s, 16);
  g.lineStyle(4, INK, 0.9).strokeRoundedRect(-h, -h, s, s, 16);
  g.fillStyle(0x6fae5a, 1);
  const bars = [[-h + 8, -h + 8, s - 16, 9], [-h + 8, -h + 8, 9, s - 16], [-h + 8, h - 17, s - 16, 9], [h - 17, -h + 8, 9, s - 34],
    [-h + 26, -h + 28, 40, 9], [-h + 26, -h + 28, 9, 34], [-6, -4, 9, 34], [-h + 26, 18, 30, 9], [14, -12, 26, 9]];
  for (const [x, y, w, hh] of bars) g.fillRoundedRect(x, y, w, hh, 4);
  g.fillStyle(0x8f6440, 1).fillRoundedRect(h - 17, h - 34, 9, 17, 3); // 출구 문
  g.fillStyle(0x2f7bff, 1).fillCircle(-h + 34, -h + 50, 8); // 블루나비
  g.fillStyle(0xffffff, 0.9).fillCircle(-h + 31, -h + 47, 3);
  g.fillStyle(0xff9fbb, 1).fillCircle(22, 8, 6).fillCircle(-12, -22, 5); // 꽃잎 수집품
}

// 돌 위 그림 ② 퐁퐁: 같은 기념품(분홍 하트) 세 개가 나란히 = "3개 이으면 퐁" + 반짝이
function drawPopIcon(g) {
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 40, y = i === 1 ? -8 : 6;
    g.fillStyle(INK, 1).fillCircle(x, y, 22);
    g.fillStyle(0xffe6ee, 1).fillCircle(x, y, 19);
    // 하트 = 동그라미 둘 + 아래 삼각형
    g.fillStyle(0xff6f98, 1).fillCircle(x - 5, y - 2, 6).fillCircle(x + 5, y - 2, 6).fillTriangle(x - 10.5, y, x + 10.5, y, x, y + 11);
    g.fillStyle(0xffffff, 0.85).fillCircle(x - 7, y - 4, 2.2);
  }
  // 반짝이 별 둘
  const star = (x, y, r, c) => {
    g.fillStyle(c, 1).fillTriangle(x, y - r, x - r * 0.3, y, x + r * 0.3, y).fillTriangle(x, y + r, x - r * 0.3, y, x + r * 0.3, y)
      .fillTriangle(x - r, y, x, y - r * 0.3, x, y + r * 0.3).fillTriangle(x + r, y, x, y - r * 0.3, x, y + r * 0.3);
  };
  star(46, -36, 14, 0xffd84a);
  star(-48, -34, 10, 0xff9fbb);
}
