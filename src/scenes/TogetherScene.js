import Phaser from 'phaser';
import { UI, landView } from '../data/ui.js';
import { setTheme } from '../ui/theme.js';
import { Button } from '../ui/Button.js';
import { sfx, unlockAudio } from '../ui/feedback.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { state } from '../state.js';
import { DATA, useSeries } from '../series.js';
import { createMatch, sendInvite } from '../social/match.js';

// [같이 하기] (design-brief 19절): 예전 타이틀의 [기념품 퐁퐁]·[둘이서 하기]를 한 화면으로. 지구본 입구의 [같이 하기]에서 온다.
// 위에서 아래로 고른다: 1 몇 명? (혼자·2명·3명) → 2 무엇을? (미로 여행·기념품 퐁퐁) → 3 어디서? (1탄 나라·2탄 계절)
// → 4 어떻게? (한 폰으로·각자 폰) → [시작하기] / [대결장 보내기]. 혼자는 퐁퐁만, 3명은 각자 폰(대결장 링크)만.
// 고른 것은 scene.restart 로 다시 그린다 (data = { players, game, pick: 'n:i', how }).
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

export class TogetherScene extends Phaser.Scene {
  constructor() { super('Together'); }

  init(data) {
    this.players = data.players ?? 2;
    this.game_ = this.players === 1 ? 'pop' : data.game ?? 'maze';
    this.how = this.players === 3 ? 'remote' : this.players === 1 ? 'solo' : data.how ?? 'local';
    const list = stagesFor(this.game_, this.players);
    this.pick = list.find((s) => `${s.n}:${s.i}` === data.pick && s.open) ?? list.find((s) => s.open);
    this.busy = false;
  }

  snapshot() { return { players: this.players, game: this.game_, pick: `${this.pick.n}:${this.pick.i}`, how: this.how }; }

  redraw(change) { sfx('toggle'); this.scene.restart({ ...this.snapshot(), ...change }); }

  create() {
    setTheme('#f3e3c3', '#f3e3c3');
    this.add.rectangle(-2000, -2000, 4720, 5280, CREAM).setOrigin(0);
    const top = this.top = getSafeInsets(this.game).top;
    const L = UI.landscape;
    // 가로: 왼쪽 칸(1·2) · 오른쪽 칸(3·4·시작) — 오른쪽 칸 조각은 dx·dy 만큼 옮겨 그린다
    const R = L ? { dx: 720, dy: -220 } : { dx: 0, dy: 0 };
    const Lft = L ? 50 : 0; // 가로 왼쪽 칸은 조금 아래로
    const title = (y, s) => this.add.text(UI.width / 2, y + top, s, { fontFamily: UI.fontTitle, fontSize: '64px', color: '#2b2d5a' }).setOrigin(0.5);
    const q = (y, s, o = { dx: 0, dy: 0 }) => this.add.text(60 + o.dx, y + top + o.dy, s, { fontFamily: UI.fontTitle, fontSize: '32px', color: '#2b2d5a' }).setOrigin(0, 0.5);

    title(L ? 140 : 100, '같이 하기');
    // ◀ 홈 (왼쪽 위)
    const back = this.add.container(130, 64 + top);
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.95).fillRoundedRect(-106, -30, 212, 60, 30).lineStyle(3, INK, 0.2).strokeRoundedRect(-106, -30, 212, 60, 30);
    back.add([bg, this.add.text(0, 0, '◀ 지구본', { fontFamily: UI.fontTitle, fontSize: '26px', color: '#2b2d5a' }).setOrigin(0.5)]);
    back.setSize(180, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => { sfx('tap'); this.scene.start('Title'); });
    this.backChip = back;

    // 1. 몇 명?
    const y1 = 180 + Lft;
    q(y1, '1. 몇 명?');
    this.chips(y1 + 65, [[1, '혼자'], [2, '2명'], [3, '3명']], this.players, (v) => this.redraw({ players: v }));

    // 2. 무엇을?
    const y2 = y1 + 150;
    q(y2, '2. 무엇을?');
    this.chips(y2 + 65, [['maze', '미로 여행'], ['pop', '기념품 퐁퐁']], this.game_, (v) => this.redraw({ game: v }), (v) => this.players === 1 && v === 'maze');
    if (this.players === 1) this.note(y2 + 120, '혼자 하는 미로는 지구본에서 블루나비·포포를 톡!');

    // 3. 어디서? (1탄 파랑 · 2탄 분홍, 열린 곳만)
    const y3 = this.players === 1 ? 500 : 470; // 혼자면 아래 안내 줄 자리만큼
    q(y3, '3. 어디서?', R);
    const list = stagesFor(this.game_, this.players);
    const per = 3, cw = 196, ch = 70;
    list.forEach((s, k) => {
      const x = UI.width / 2 + ((k % per) - 1) * (cw + 14) + R.dx, y = y3 + 60 + Math.floor(k / per) * (ch + 14) + top + R.dy;
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

    // 4. 어떻게? (혼자는 없음)
    const y4 = yAfter3 + 40;
    if (this.players > 1) {
      q(y4, '4. 어떻게?', R);
      this.chips(y4 + 64, [['local', '한 폰으로'], ['remote', '각자 폰']], this.how, (v) => this.redraw({ how: v }), (v) => this.players === 3 && v === 'local', R);
      const help = this.how === 'remote'
        ? (this.players === 3 ? '대결장 링크를 단톡방에 올려 셋이 각자 폰으로 겨뤄요' : '대결장 링크를 친구에게 보내 각자 폰으로 겨뤄요')
        : this.game_ === 'maze' ? '한 폰으로 번갈아 같은 미로, 더 빨리 나온 사람이 이겨요' : '한 화면을 반씩 나눠 동시에 겨뤄요';
      this.note(y4 + 120, help, R);
    }

    // 시작 + 대결함 · 홈으로
    const yStart = L ? 800 : 1050;
    const label = this.how === 'remote' ? '대결장 보내기' : '시작하기';
    this.startBtn = new Button(this, UI.width / 2 + R.dx, yStart, { label, onPress: () => this.start() });
    const yb = L ? 650 : 1188;
    new Button(this, UI.width / 2 - 160, yb, { ...SUB, label: '대결함', onPress: () => this.scene.start('Match', { step: 'box' }) });
    new Button(this, UI.width / 2 + 160, yb, { ...SUB, label: '처음 화면', onPress: () => this.scene.start('Title') });
    this.toastText = this.add.text(UI.width / 2 + R.dx, yStart - 92, '', { fontFamily: UI.font, fontSize: '24px', color: '#c0563a' }).setOrigin(0.5);
    if (L) {
      const v = this.landscapeView();
      const ins = getSafeInsets(this.game);
      back.setPosition(v.left + 126 + ins.left / v.zoom, v.top + 56 + ins.top / v.zoom);
    }
  }

  // 가로 (18·19절): 왼쪽 칸 1·2, 오른쪽 칸 3·4·시작
  landscapeView() { return landView(0.78, 720, 440); }

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
        if (on) return;
        if (off) { this.say(v === 'local' ? '3명은 각자 폰으로 겨뤄요' : '혼자는 기념품 퐁퐁만 할 수 있어요'); return; }
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
      const m = createMatch(this.game_, s.id, this.players);
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
