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

// [같이 하기] (design-brief 19절, 2026-11-15 바뀜): 한 화면, 모두 작은 징검다리 돌로 고른다.
//  몇 명이서? (혼자·2명 — 3명은 2026-11-15 뺌)
//  무엇을? 돌 두 개 [미로 여행]·[기념품 퐁퐁] (혼자는 퐁퐁만 — 미로 돌 흐림)
//  어디서? 징검다리 두 줄: 1탄 길(중국 → 일본 → 미국 → 캐나다)·2탄 길(봄 → 여름 → 가을 → 겨울), 돌 사이 조약돌
//  어떻게? (2명 = 한 폰으로·각자 폰) → [시작하기] / [대결장 보내기]
// 예전의 첫 화면(큰 돌·미로/퐁퐁 그림을 톡 → 다음 화면)과 네모 연못 칸은 2026-11-15 뺌.
// 고른 것은 scene.restart 로 다시 그린다 (data = { players, game, pick: 'n:i', how }).
// (옛 3명 대결장 링크 D2-…는 match.js 가 그대로 읽는다 — 같이 하기에서 새로 만들지만 않음)
const CREAM = 0xf3e3c3, INK = 0x2b2d5a;
const SUB = { width: 300, height: 88, fontSize: 28, color: 0xfffaf0, shade: 0xd8c8a8, textColor: '#2b2d5a' };

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

// 돌 색: 고르지 않은 돌(회색 돌) · 고른 돌(1탄 파랑 / 2탄 분홍 / 놀이 주황)
const STONE = { rim: 0x8a8474, top: 0xddd6c2 };
const PICKED = { 1: [0x1f5fd6, 0x2f7bff, '#ffffff'], 2: [0xd65a80, 0xff7fa3, '#ffffff'], game: [0xd98a2b, 0xffb347, '#2b2d5a'] };

export class TogetherScene extends Phaser.Scene {
  constructor() { super('Together'); }

  init(data) {
    this.players = (data.players ?? 2) === 1 ? 1 : 2; // 3명은 2026-11-15 뺌
    this.game_ = this.players === 1 ? 'pop' : data.game ?? 'maze';
    this.how = this.players === 1 ? 'solo' : data.how === 'remote' ? 'remote' : 'local';
    const list = stagesFor(this.game_, this.players);
    this.pick = list.find((s) => `${s.n}:${s.i}` === data.pick && s.open) ?? list.find((s) => s.open);
    this.busy = false;
  }

  snapshot() { return { players: this.players, game: this.game_, pick: `${this.pick.n}:${this.pick.i}`, how: this.how }; }

  redraw(change) { sfx('toggle'); this.scene.restart({ ...this.snapshot(), ...change }); }

  // 가로 (18·19절): 왼쪽 칸(몇 명·무엇을·대결함) · 오른쪽 칸(어디서·어떻게·시작)
  landscapeView() { return landView(0.78, 720, 440); }

  create() {
    setTheme('#f3e3c3', '#f3e3c3');
    this.add.rectangle(-2000, -2000, 4720, 5280, CREAM).setOrigin(0);
    const top = this.top = getSafeInsets(this.game).top;
    const L = UI.landscape;
    // 자리: 세로는 한 줄로 위에서 아래, 가로는 왼쪽(A)·오른쪽(B) 칸. x0 = 칸 가운데
    const A = L ? { x0: 300, title: 70, q1: 170, chips: 232, q2: 330, games: 405 } : { x0: UI.width / 2, title: 100, q1: 178, chips: 242, q2: 322, games: 392 };
    const B = L ? { x0: 1080, q3: 130, lane1: 245, lane2: 390, q4: 475 } : { x0: UI.width / 2, q3: 472, lane1: 584, lane2: 724, q4: 818 };
    const qx = (x0) => x0 - 300; // 칸 왼쪽 끝 (질문 글자 자리)
    const q = (x0, y, s) => this.add.text(qx(x0), y + top, s, { fontFamily: UI.fontTitle, fontSize: '32px', color: '#2b2d5a' }).setOrigin(0, 0.5);

    // ◀ 여행 중 (= 홈, 왼쪽 위) · 제목
    this.backButton('◀ 여행 중', () => this.scene.start('Title'));
    this.add.text(A.x0, A.title + top, '같이 하기', { fontFamily: UI.fontTitle, fontSize: '64px', color: '#2b2d5a' }).setOrigin(0.5);

    // 몇 명이서?
    q(A.x0, A.q1, '몇 명이서?');
    this.chips(A.chips, [[1, '혼자'], [2, '2명']], this.players, (v) => this.redraw({ players: v }), { dx: A.x0 - UI.width / 2 });

    // 무엇을? — 작은 징검다리 돌 두 개 (사이 조약돌)
    q(A.x0, A.q2, '무엇을? 돌을 톡!');
    const gp = [[A.x0 - 150, A.games + top], [A.x0 + 150, A.games + top - 10]];
    this.pebbles(gp[0], gp[1], 3);
    [['maze', '틀린그림'], ['pop', '기념품 퐁퐁']].forEach(([g, name], k) => {
      const off = this.players === 1 && g === 'maze';
      this.stone(gp[k][0], gp[k][1], 236, name, {
        on: this.game_ === g, open: !off, color: PICKED.game, k,
        onPick: () => this.redraw({ game: g }),
        why: '혼자 틀린그림은 홈의 1탄·2탄 여행으로!',
      });
    });

    // 어디서? — 징검다리 두 줄 (1탄 길 · 2탄 길), 줄 앞에 탄 알약
    q(B.x0, B.q3, '어디서? 돌을 톡!');
    const list = stagesFor(this.game_, this.players);
    const ZIG = [0, -14, 6, -10];
    [[1, B.lane1], [2, B.lane2]].forEach(([n, ly]) => {
      const y = ly + top;
      const items = list.filter((s) => s.n === n);
      this.add.text(qx(B.x0) + 34, y, `${n}탄`, { fontFamily: UI.fontTitle, fontSize: '26px', color: '#ffffff', backgroundColor: n === 1 ? '#2f7bff' : '#e0557a', padding: { x: 10, y: 6 } }).setOrigin(0.5);
      const x1 = qx(B.x0) + 132, step = 146;
      const pos = items.map((_, i) => [x1 + i * step, y + ZIG[i % ZIG.length]]);
      for (let i = 0; i + 1 < pos.length; i++) this.pebbles(pos[i], pos[i + 1], 2);
      items.forEach((s, i) => this.stone(pos[i][0], pos[i][1], 124, s.name, {
        on: s.n === this.pick.n && s.i === this.pick.i, open: s.open, color: PICKED[n], k: i + n * 4,
        hero: n === 1 ? 'home_bluenabi' : 'home_popo',
        onPick: () => this.redraw({ pick: `${s.n}:${s.i}` }),
        why: this.game_ === 'pop' ? '혼자 하기는 앞 나라를 깨면 열려요' : '이야기를 더 진행하면 열려요',
      }));
    });

    // 어떻게? (2명만)
    let yEnd = B.lane2 + 50;
    if (this.players > 1) {
      q(B.x0, B.q4, '어떻게?');
      this.chips(B.q4 + 62, [['local', '한 폰으로'], ['remote', '각자 폰']], this.how, (v) => this.redraw({ how: v }), { dx: B.x0 - UI.width / 2 });
      const help = this.how === 'remote'
        ? '대결장 링크를 친구에게 보내 각자 폰으로 겨뤄요'
        : this.game_ === 'maze' ? '한 폰으로 번갈아 같은 그림, 더 빨리 다 찾은 사람이 이겨요' : '한 화면을 반씩 나눠 동시에 겨뤄요';
      this.add.text(B.x0, B.q4 + 122 + top, help, { fontFamily: UI.font, fontSize: '24px', color: '#5a5c88', align: 'center' }).setOrigin(0.5);
      yEnd = B.q4 + 122;
    }

    // 시작 · 대결함
    const yStart = L ? Math.max(660, yEnd + 90) : Math.min(1040, yEnd + 98);
    const label = this.how === 'remote' ? '대결장 보내기' : '시작하기';
    this.startBtn = new Button(this, B.x0, yStart, { label, onPress: () => this.start() });
    this.toastText = this.add.text(B.x0, B.lane2 + 58 + top, '', { fontFamily: UI.font, fontSize: '24px', color: '#c0563a', backgroundColor: '#f3e3c3' }).setOrigin(0.5).setDepth(5);
    new Button(this, L ? A.x0 : UI.width / 2, L ? 620 : 1188, { ...SUB, label: '대결함', onPress: () => this.scene.start('Match', { step: 'box' }) });

    if (L) {
      const v = this.landscapeView();
      const ins = getSafeInsets(this.game);
      this.backChip.setPosition(v.left + 106 + ins.left / v.zoom, v.top + 56 + ins.top / v.zoom);
    }
  }

  // 왼쪽 위 작은 알약 버튼
  backButton(label, onPress) {
    const back = this.add.container(110, 64 + this.top);
    const bg = this.add.graphics();
    const w = 172;
    bg.fillStyle(0xffffff, 0.95).fillRoundedRect(-w / 2, -30, w, 60, 30).lineStyle(3, INK, 0.2).strokeRoundedRect(-w / 2, -30, w, 60, 30);
    back.add([bg, this.add.text(0, 0, label, { fontFamily: UI.fontTitle, fontSize: '26px', color: '#2b2d5a' }).setOrigin(0.5)]);
    back.setSize(w + 8, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => { sfx('tap'); onPress(); });
    this.backChip = back;
  }

  // 돌과 돌 사이를 잇는 조약돌 n개
  pebbles([ax, ay], [bx, by], n) {
    const g = this.add.graphics();
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1), x = ax + (bx - ax) * t, y = ay + (by - ay) * t + 8;
      g.fillStyle(0x000000, 0.1).fillEllipse(x, y + 4, 28, 11);
      g.fillStyle(0xcfc8b4, 1).fillEllipse(x, y, 24, 13);
      g.lineStyle(2, INK, 0.3).strokeEllipse(x, y, 24, 13);
    }
  }

  // 징검다리 돌 하나: 고른 돌 = color 색 (+ hero 가 올라섬), 안 열린 돌 = 흐리게(톡 하면 why 안내)
  stone(x, y, w, name, o) {
    const h = 74;
    const c = this.add.container(x, y).setDepth(o.on ? 3 : 2);
    const g = this.add.graphics();
    const [rim, face, ink] = o.on ? o.color : [STONE.rim, STONE.top, '#2b2d5a'];
    g.fillStyle(0x000000, 0.13).fillEllipse(0, 18, w, h - 18);
    g.fillStyle(rim, 1).fillEllipse(0, 9, w, h);
    g.fillStyle(face, 1).fillEllipse(0, 2, w - 8, h - 10);
    g.fillStyle(0xffffff, o.on ? 0.3 : 0.4).fillEllipse(-w * 0.22, -15, w * 0.3, 11);
    g.lineStyle(o.on ? 5 : 3, INK, o.on ? 1 : 0.7).strokeEllipse(0, 2, w - 8, h - 10);
    const label = this.add.text(0, 3, name, { fontFamily: UI.fontTitle, fontSize: name.length > 3 ? '28px' : name.length > 2 ? '26px' : '30px', color: ink }).setOrigin(0.5);
    c.add([g, label]);
    if (o.on && o.hero && this.textures.exists(o.hero)) {
      const hero = this.add.image(0, -44, o.hero).setDisplaySize(60, 60);
      c.add(hero);
      if (!platform.reducedMotion) this.tweens.add({ targets: hero, y: -50, duration: 480, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if (!o.open) c.setAlpha(0.42);
    else if (!platform.reducedMotion) this.tweens.add({ targets: c, y: y + 3, duration: 1500 + (o.k % 5) * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    c.setSize(w + 10, h + 22).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => { if (o.open && !o.on) c.setScale(0.94); });
    c.on('pointerout', () => c.setScale(1));
    c.on('pointerup', () => {
      c.setScale(1);
      if (!o.open) { this.say(o.why); return; }
      if (o.on) return;
      o.onPick();
    });
    return c;
  }

  // 고르기 칩 줄 (몇 명이서? · 어떻게?): items = [[값, 글]]
  chips(y, items, value, onPick, o = { dx: 0 }) {
    const n = items.length, w = 300, gap = 16;
    items.forEach(([v, text], i) => {
      const x = UI.width / 2 + (i - (n - 1) / 2) * (w + gap) + o.dx;
      const on = v === value;
      const c = this.add.container(x, y + this.top);
      const g = this.add.graphics();
      g.fillStyle(on ? 0xffb347 : 0xfffaf0, 1).fillRoundedRect(-w / 2, -44, w, 88, 30);
      g.lineStyle(on ? 5 : 3, INK, on ? 1 : 0.4).strokeRoundedRect(-w / 2, -44, w, 88, 30);
      c.add([g, this.add.text(0, 0, text, { fontFamily: UI.fontTitle, fontSize: '32px', color: '#2b2d5a' }).setOrigin(0.5)]);
      c.setSize(w, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => { if (!on) onPick(v); });
    });
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
