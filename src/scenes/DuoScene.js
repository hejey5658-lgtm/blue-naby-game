import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { CHAPTERS, stageLabel } from '../data/chapters.js';
import { state } from '../state.js';
import { setTheme } from '../ui/theme.js';
import { drawPanel } from '../ui/frames.js';
import { Button } from '../ui/Button.js';
import { openBox } from '../ui/htmlBox.js';
import { sfx, vibrate, unlockAudio } from '../ui/feedback.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { nickname, askNickname } from '../social/social.js';
import { createMatch, sendInvite } from '../social/match.js';

// 둘이서 하기 (design-brief 9-2·12): [한 폰으로] 1P·2P가 같은 미로를 번갈아 하고, 더 빨리 나온 사람이 이긴다.
// [각자 폰으로] 대결장 링크를 보내고 각자 폰에서 같은 미로 → 결과 링크를 주고받는다 (MatchScene).
// 이야기 진행·저장·별·여권과는 따로 논다 (MazeScene은 duo 데이터가 있으면 저장하지 않는다).
// scene.start('Duo', { step: 'setup' | 'turn' | 'result', mode: 'local' | 'remote', names, chapter, turn, results })
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const opened = () => CHAPTERS.slice(0, Math.max(1, Math.min(CHAPTERS.length, state.chapter || 1)));
const label = (c) => stageLabel(c);

export class DuoScene extends Phaser.Scene {
  constructor() { super('Duo'); }

  init(data) {
    this.step = data.step ?? 'setup';
    this.mode = data.mode ?? 'local';
    this.names = data.names ?? ['1P', '2P'];
    this.chapterId = data.chapter ?? opened()[0].id;
    this.turn = data.turn ?? 1;
    this.results = data.results ?? [];
  }

  create() {
    setTheme('#f3e3c3', '#f3e3c3');
    this.add.rectangle(0, 0, UI.width, UI.height, 0xf3e3c3).setOrigin(0);
    this.top = getSafeInsets(this.game).top;
    if (this.step === 'turn') this.drawTurn();
    else if (this.step === 'result') this.drawResult();
    else this.drawSetup();
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('Title'));
  }

  title(text, y) {
    return this.add.text(UI.width / 2, y + this.top, text, { fontFamily: UI.fontTitle, fontSize: '64px', color: '#2b2d5a' }).setOrigin(0.5);
  }

  // ── 준비: 한 폰으로 / 각자 폰으로 + 이름 + 나라 고르기 ──
  drawSetup() {
    const remote = this.mode === 'remote';
    this.title('둘이서 하기', 120);
    // 방식 고르기 칩
    [['local', '한 폰으로'], ['remote', '각자 폰으로']].forEach(([m, text], i) => {
      const on = this.mode === m;
      const c = this.add.container(UI.width / 2 + (i ? 160 : -160), 228 + this.top);
      const g = this.add.graphics();
      g.fillStyle(on ? 0x2b2d5a : 0xfffaf0, 1).fillRoundedRect(-150, -42, 300, 84, 42);
      if (!on) g.lineStyle(3, 0xd2a679, 1).strokeRoundedRect(-150, -42, 300, 84, 42);
      c.add([g, this.add.text(0, 0, text, { fontFamily: UI.fontTitle, fontSize: '32px', color: on ? '#ffffff' : '#2b2d5a' }).setOrigin(0.5)]);
      c.setSize(300, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => {
        if (on) return;
        sfx('toggle');
        this.scene.restart({ step: 'setup', mode: m, names: this.names, chapter: this.chapterId });
      });
    });
    this.add.text(UI.width / 2, 322 + this.top, remote
      ? '친구에게 대결장 링크를 보내고, 각자 폰에서\n같은 미로를 해요. 더 빨리 나온 사람이 이겨요!'
      : '한 폰으로 번갈아 같은 미로를 해요.\n더 빨리 출구에 닿는 사람이 이겨요!', {
      fontFamily: UI.font, fontSize: '27px', color: '#5a5c88', align: 'center', lineSpacing: 8,
    }).setOrigin(0.5);
    if (remote) this.drawMyName(); else this.drawNames();
    this.drawPicks(remote);
  }

  // 각자 폰: 내 닉네임 칩 (대결장에 들어갈 이름)
  drawMyName() {
    const c = this.add.container(UI.width / 2, 440 + this.top);
    const g = this.add.graphics();
    g.fillStyle(0x7ec8ff, 1).fillRoundedRect(-200, -52, 400, 104, 30);
    const t = this.add.text(0, -10, nickname(), { fontFamily: UI.fontTitle, fontSize: '36px', color: '#2b2d5a' }).setOrigin(0.5);
    const hint = this.add.text(0, 28, '내 닉네임 · 톡 눌러 바꾸기', { fontFamily: UI.font, fontSize: '18px', color: '#2b2d5a' }).setOrigin(0.5).setAlpha(0.7);
    c.add([g, t, hint]).setSize(400, 104).setInteractive({ useHandCursor: true }).on('pointerup', async () => {
      sfx('tap');
      await askNickname({ force: true });
      t.setText(nickname());
    });
  }

  // 한 폰: 이름 칩 두 개, 톡 누르면 바꾸기
  drawNames() {
    [0, 1].forEach((i) => {
      const x = UI.width / 2 + (i ? 165 : -165), y = 440 + this.top;
      const c = this.add.container(x, y);
      const g = this.add.graphics();
      g.fillStyle(i ? 0xff9fb8 : 0x7ec8ff, 1).fillRoundedRect(-150, -52, 300, 104, 30);
      const t = this.add.text(0, -10, this.names[i], { fontFamily: UI.fontTitle, fontSize: '36px', color: '#2b2d5a' }).setOrigin(0.5);
      const hint = this.add.text(0, 28, `${i + 1}P · 톡 눌러 이름 바꾸기`, { fontFamily: UI.font, fontSize: '18px', color: '#2b2d5a' }).setOrigin(0.5).setAlpha(0.7);
      c.add([g, t, hint]).setSize(300, 104).setInteractive({ useHandCursor: true }).on('pointerup', () => {
        sfx('tap');
        openBox({
          title: `${i + 1}P 이름`, text: '8글자까지 (비워 두면 ' + `${i + 1}P)`, field: 'input', maxLength: 8, value: this.names[i] === `${i + 1}P` ? '' : this.names[i],
          buttons: [
            { label: '좋아요', onClick: (b) => { this.names[i] = b.value().trim().slice(0, 8) || `${i + 1}P`; t.setText(this.names[i]); b.close(); } },
            { label: '닫기', sub: true, onClick: (b) => b.close() },
          ],
        });
      });
    });
  }

  drawPicks(remote) {
    this.add.text(UI.width / 2, 548 + this.top, '어느 나라에서 겨룰까요?', { fontFamily: UI.fontTitle, fontSize: '34px', color: '#2b2d5a' }).setOrigin(0.5);
    const list = opened();
    this.picks = [];
    list.forEach((c, i) => {
      const x = UI.width / 2 + (i % 2 ? 165 : -165), y = 630 + this.top + Math.floor(i / 2) * 100;
      const box = this.add.container(x, y);
      const g = this.add.graphics();
      const t = this.add.text(0, 0, label(c), { fontFamily: UI.fontTitle, fontSize: '28px', color: '#2b2d5a' }).setOrigin(0.5);
      box.add([g, t]).setSize(310, 86).setInteractive({ useHandCursor: true }).on('pointerup', () => { sfx('toggle'); this.chapterId = c.id; this.paintPicks(); });
      this.picks.push({ id: c.id, g, t });
    });
    if (list.length === 1) this.add.text(UI.width / 2, 710 + this.top, '이야기를 더 진행하면 다른 나라도 열려요', { fontFamily: UI.font, fontSize: '22px', color: '#5a5c88' }).setOrigin(0.5);
    this.paintPicks();

    this.startBtn = new Button(this, UI.width / 2, 1060, remote
      ? { label: '대결장 보내기', onPress: async () => { unlockAudio(); const m = createMatch('maze', this.chapterId); await sendInvite(m); this.scene.start('Match', { id: m.id }); } }
      : { label: '시작하기', onPress: () => { unlockAudio(); this.scene.start('Duo', { step: 'turn', names: this.names, chapter: this.chapterId, turn: 1, results: [] }); } });
    const sub = { width: 300, height: 88, fontSize: 28, color: 0xfffaf0, shade: 0xd8c8a8, textColor: '#2b2d5a' };
    this.backBtn = new Button(this, remote ? UI.width / 2 - 160 : UI.width / 2, 1196, { ...sub, label: '처음 화면으로', onPress: () => this.scene.start('Title') });
    if (remote) new Button(this, UI.width / 2 + 160, 1196, { ...sub, label: '대결함', onPress: () => this.scene.start('Match', { step: 'box' }) });
    this.input.keyboard?.on('keydown-ENTER', () => this.startBtn.trigger());
  }

  paintPicks() {
    for (const p of this.picks) {
      const on = p.id === this.chapterId;
      p.g.clear().fillStyle(on ? 0x2f7bff : 0xfffaf0, 1).fillRoundedRect(-155, -43, 310, 86, 26);
      if (!on) p.g.lineStyle(3, 0xd2a679, 1).strokeRoundedRect(-155, -43, 310, 86, 26);
      p.t.setColor(on ? '#ffffff' : '#2b2d5a');
    }
  }

  // ── 차례 카드: "1P 차례! 폰을 ○○에게 주세요" ──
  drawTurn() {
    const name = this.names[this.turn - 1];
    const ch = CHAPTERS.find((c) => c.id === this.chapterId);
    const g = this.add.graphics();
    drawPanel(g, 70, 300, 580, 560, 'woodWindow');
    const badge = this.add.graphics();
    badge.fillStyle(this.turn === 1 ? 0x7ec8ff : 0xff9fb8, 1).fillCircle(UI.width / 2, 430, 74);
    this.add.text(UI.width / 2, 430, `${this.turn}P`, { fontFamily: UI.fontTitle, fontSize: '64px', color: '#2b2d5a' }).setOrigin(0.5);
    this.add.text(UI.width / 2, 570, `${name} 차례!`, { fontFamily: UI.fontTitle, fontSize: '56px', color: '#2b2d5a' }).setOrigin(0.5);
    this.add.text(UI.width / 2, 650, this.turn === 1 ? `폰을 ${name}에게 주세요` : `폰을 ${name}에게 넘겨 주세요`, { fontFamily: UI.font, fontSize: '30px', color: '#5a5c88' }).setOrigin(0.5);
    this.add.text(UI.width / 2, 720, label(ch), { fontFamily: UI.fontTitle, fontSize: '30px', color: '#2f7bff' }).setOrigin(0.5);
    if (this.turn === 2 && this.results[0]) {
      this.add.text(UI.width / 2, 790, `${this.names[0]} 기록 ${fmt(this.results[0].sec)}`, { fontFamily: UI.font, fontSize: '26px', color: '#2b2d5a' }).setOrigin(0.5);
    }
    sfx('turn');
    vibrate('collect');
    this.readyBtn = new Button(this, UI.width / 2, 1020, {
      label: '준비됐어요!',
      onPress: () => {
        unlockAudio();
        this.scene.start('Maze', { chapter: this.chapterId, fresh: true, intro: false, duo: { names: this.names, turn: this.turn, results: this.results } });
      },
    });
    this.input.keyboard?.on('keydown-ENTER', () => this.readyBtn.trigger());
    this.input.keyboard?.on('keydown-SPACE', () => this.readyBtn.trigger());
  }

  // ── 결과: 두 사람 시간·퐁 횟수, 더 빠른 사람이 이김 ──
  drawResult() {
    const [a, b] = this.results;
    const win = a.sec === b.sec ? 0 : a.sec < b.sec ? 1 : 2;
    this.title(win ? `${this.names[win - 1]} 승리!` : '둘 다 멋졌어!', 170);
    this.add.text(UI.width / 2, 250 + this.top, win ? `${fmt(Math.abs(a.sec - b.sec))} 차이로 먼저 나왔어요` : '똑같은 시간이에요!', { fontFamily: UI.font, fontSize: '28px', color: '#5a5c88' }).setOrigin(0.5);
    [a, b].forEach((r, i) => {
      const y = 400 + this.top + i * 190;
      const g = this.add.graphics();
      g.fillStyle(0x2b2d5a, 0.1).fillRoundedRect(86, y - 70, 548, 150, 34);
      g.fillStyle(i ? 0xff9fb8 : 0x7ec8ff, 1).fillRoundedRect(80, y - 78, 548, 150, 34);
      if (win === i + 1) {
        // 왕관 (직접 그린 그림)
        g.fillStyle(0xffd84a, 1).fillPoints([{ x: 140, y: y - 10 }, { x: 150, y: y - 50 }, { x: 170, y: y - 26 }, { x: 186, y: y - 58 }, { x: 202, y: y - 26 }, { x: 222, y: y - 50 }, { x: 232, y: y - 10 }], true);
        g.lineStyle(3, 0x2b2d5a, 1).strokePoints([{ x: 140, y: y - 10 }, { x: 150, y: y - 50 }, { x: 170, y: y - 26 }, { x: 186, y: y - 58 }, { x: 202, y: y - 26 }, { x: 222, y: y - 50 }, { x: 232, y: y - 10 }], true);
      }
      if (this.names[i] !== `${i + 1}P`) this.add.text(186, y + 30, `${i + 1}P`, { fontFamily: UI.fontTitle, fontSize: '30px', color: '#2b2d5a' }).setOrigin(0.5);
      this.add.text(270, y - 22, this.names[i], { fontFamily: UI.fontTitle, fontSize: '40px', color: '#2b2d5a' }).setOrigin(0, 0.5);
      this.add.text(270, y + 26, `퐁 ${r.rolls}번`, { fontFamily: UI.font, fontSize: '24px', color: '#2b2d5a' }).setOrigin(0, 0.5);
      this.add.text(600, y, fmt(r.sec), { fontFamily: UI.fontTitle, fontSize: '56px', color: '#2b2d5a' }).setOrigin(1, 0.5);
    });
    sfx(win ? 'win' : 'respawn');
    vibrate('special');

    const list = opened();
    const idx = list.findIndex((c) => c.id === this.chapterId);
    const next = list[idx + 1];
    const again = () => this.scene.start('Duo', { step: 'turn', names: this.names, chapter: this.chapterId, turn: 1, results: [] });
    let y = 860;
    if (next) {
      this.nextBtn = new Button(this, UI.width / 2, y, { label: `다음 나라로 · ${next.name}`, fontSize: 32, onPress: () => this.scene.start('Duo', { step: 'turn', names: this.names, chapter: next.id, turn: 1, results: [] }) });
      y += 150;
    }
    this.againBtn = new Button(this, UI.width / 2, y, { width: 400, height: 104, fontSize: 32, label: '다시 겨루기', color: 0xffb347, shade: 0xd98a2b, textColor: '#2b2d5a', onPress: again });
    new Button(this, UI.width / 2, y + 136, { width: 320, height: 88, fontSize: 28, label: '처음 화면으로', color: 0xfffaf0, shade: 0xd8c8a8, textColor: '#2b2d5a', onPress: () => this.scene.start('Title') });
    this.input.keyboard?.on('keydown-ENTER', () => (this.nextBtn ?? this.againBtn).trigger());
  }
}
