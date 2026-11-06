import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { setTheme } from '../ui/theme.js';
import { drawPanel } from '../ui/frames.js';
import { Button } from '../ui/Button.js';
import { sfx, vibrate, unlockAudio } from '../ui/feedback.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { state } from '../state.js';
import { POP } from '../data/popgame.js';
import { SERIES, useSeries } from '../series.js';
import { nickname } from '../social/social.js';
import { matchById, createMatch, sendInvite, sendResult, stageName, amHost, opponentName, scoreText, verdict, GAME_NAME } from '../social/match.js';

// 각자 폰 대결 화면 (design-brief 12절). scene.start('Match', { id }) = 대결 카드, { step: 'box' } = 대결함.
// 대결 카드: 나와 친구 기록을 나란히. 아직 안 했으면 [시작하기], 했으면 [결과 보내기].
// 친구 기록이 먼저 와 있어도 내가 끝내기 전에는 가려 둔다 (공평하게).
const CREAM = 0xf3e3c3;
const SUB = { width: 300, height: 88, fontSize: 28, color: 0xfffaf0, shade: 0xd8c8a8, textColor: '#2b2d5a' };

function crown(g, x, y, s = 1) {
  const pts = [[-46, 20], [-36, -24], [-16, 2], [0, -34], [16, 2], [36, -24], [46, 20]].map(([px, py]) => ({ x: x + px * s, y: y + py * s }));
  g.fillStyle(0xffd84a, 1).fillPoints(pts, true).lineStyle(3, 0x2b2d5a, 1).strokePoints(pts, true);
}

export class MatchScene extends Phaser.Scene {
  constructor() { super('Match'); }

  init(data) {
    this.step = data.step ?? 'view';
    this.m = data.id ? matchById(data.id) : null;
    if (this.step === 'view' && !this.m) this.step = 'box';
  }

  create() {
    setTheme('#f3e3c3', '#f3e3c3');
    this.add.rectangle(0, -UI.offY, UI.width, UI.fullHeight, CREAM).setOrigin(0);
    this.top = getSafeInsets(this.game).top;
    if (this.step === 'box') this.drawBox(); else this.drawView();
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('Title'));
  }

  text(x, y, s, size, color = '#2b2d5a', font = UI.fontTitle, extra = {}) {
    return this.add.text(x, y, s, { fontFamily: font, fontSize: `${size}px`, color, align: 'center', ...extra }).setOrigin(0.5);
  }

  // ── 대결 카드 ──
  drawView() {
    const { m } = this;
    const top = this.top;
    const v = verdict(m);
    const opp = opponentName(m);
    const title = v === null ? `${GAME_NAME[m.game]} 대결` : v === 1 ? '내가 이겼어!' : v === -1 ? `${opp} 승리!` : '비겼어! 둘 다 멋져';
    this.text(UI.width / 2, 120 + top, title, title.length > 9 ? 54 : 64);
    this.text(UI.width / 2, 196 + top, `${stageName(m)} · ${GAME_NAME[m.game]} · 각자 폰`, 28, '#2f7bff');
    if (!amHost(m) && !m.mine) this.text(UI.width / 2, 246 + top, `${m.host}의 대결장이 도착했어요!`, 26, '#5a5c88', UI.font);

    // 두 사람 카드
    const rows = [
      { name: `${nickname()} (나)`, color: 0x7ec8ff, rec: m.mine, win: v === 1, hidden: false, wait: '아직 안 했어요' },
      { name: opp, color: 0xff9fb8, rec: m.theirs, win: v === -1, hidden: !!m.theirs && !m.mine, wait: '결과를 기다리는 중' },
    ];
    rows.forEach((r, i) => {
      const y = 380 + top + i * 180;
      const g = this.add.graphics();
      g.fillStyle(0x2b2d5a, 0.1).fillRoundedRect(86, y - 66, 548, 146, 34);
      g.fillStyle(r.color, 1).fillRoundedRect(80, y - 74, 548, 146, 34);
      if (r.win) crown(g, 150, y - 4, 0.8);
      this.add.text(r.win ? 210 : 120, y - 22, r.name, { fontFamily: UI.fontTitle, fontSize: '34px', color: '#2b2d5a' }).setOrigin(0, 0.5);
      let main = r.wait, sub = '';
      if (r.rec && r.hidden) { main = '기록 도착!'; sub = '내가 끝내면 보여요'; }
      else if (r.rec) { main = scoreText(m, r.rec); sub = m.game === 'maze' ? `퐁 ${r.rec.rolls}번` : `퐁 ${r.rec.rolls}개`; }
      this.add.text(r.win ? 210 : 120, y + 24, sub, { fontFamily: UI.font, fontSize: '22px', color: '#2b2d5a' }).setOrigin(0, 0.5);
      this.add.text(604, y, main, { fontFamily: UI.fontTitle, fontSize: r.rec && !r.hidden ? '50px' : '28px', color: '#2b2d5a' }).setOrigin(1, 0.5);
    });

    // 다음에 할 일 안내
    let hint;
    if (!m.mine) hint = amHost(m) ? '대결장을 보냈어요! 친구도 각자 폰에서 같은 판을 해요.\n나도 지금 해 볼까요?' : '내 폰에서 같은 판을 해요.\n끝나면 결과를 친구에게 보내 주세요.';
    else if (!m.theirs) hint = '결과 링크를 친구에게 보내 주세요.\n친구 결과 링크가 오면 열어 보세요.';
    else hint = m.game === 'maze' ? '더 빨리 나온 사람이 이겨요 (같으면 퐁이 적은 쪽)' : `${POP.remoteSec / 60}분 동안 점수가 높은 사람이 이겨요`;
    this.text(UI.width / 2, 770 + top, hint, 25, '#5a5c88', UI.font, { lineSpacing: 8 });

    if (v !== null) { sfx(v === 1 ? 'win' : 'respawn'); vibrate('special'); }

    // 버튼: 위 = 지금 할 일, 가운데 = 대결장 다시/새 대결장, 아래 = 대결함 · 처음 화면
    if (!m.mine) {
      this.mainBtn = new Button(this, UI.width / 2, 930, { label: '시작하기', onPress: () => this.play() });
      if (amHost(m)) new Button(this, UI.width / 2, 1062, { ...SUB, width: 400, label: '대결장 다시 보내기', onPress: () => sendInvite(m) });
    } else {
      this.mainBtn = new Button(this, UI.width / 2, 930, { label: '결과 보내기', onPress: () => sendResult(m) });
      new Button(this, UI.width / 2, 1062, {
        ...SUB, width: 400, label: '새 대결장 보내기',
        onPress: async () => { const n = createMatch(m.game, m.stage); await sendInvite(n); this.scene.start('Match', { id: n.id }); },
      });
    }
    new Button(this, UI.width / 2 - 160, 1190, { ...SUB, label: '대결함', onPress: () => this.scene.start('Match', { step: 'box' }) });
    new Button(this, UI.width / 2 + 160, 1190, { ...SUB, label: '처음 화면으로', onPress: () => this.scene.start(SERIES.meta.titleScene) });
    this.input.keyboard?.on('keydown-ENTER', () => this.mainBtn.trigger());
  }

  play() {
    unlockAudio();
    const { m } = this;
    // 2탄 대결장이면 2탄 데이터로 바꿔서 (진행 기록은 탄마다 따로라 이야기에는 영향 없음)
    if ((m.series === 2 ? 2 : 1) !== SERIES.n) useSeries(m.series === 2 ? 2 : 1);
    if (m.game === 'maze') {
      this.scene.start('Maze', { chapter: m.stage, fresh: true, intro: false, duo: { remote: m.id, names: [nickname()], turn: 1, results: [] } });
    } else {
      this.scene.start('Pop', { step: 'remote', match: m.id });
    }
  }

  // ── 대결함: 최근 대결 5개 ──
  drawBox() {
    const top = this.top;
    this.text(UI.width / 2, 120 + top, '대결함', 64);
    this.text(UI.width / 2, 196 + top, '각자 폰으로 한 대결 (최근 5개)', 26, '#5a5c88', UI.font);
    const list = state.matches ?? [];
    if (!list.length) {
      const g = this.add.graphics();
      drawPanel(g, 80, 360 + top, 560, 300, 'woodWindow');
      this.text(UI.width / 2, 510 + top, '아직 대결이 없어요.\n둘이서 하기 → 각자 폰으로,\n또는 기념품 퐁퐁 → 각자 폰 대결에서\n대결장을 보내 보세요!', 26, '#2b2d5a', UI.font, { lineSpacing: 8 });
    }
    list.forEach((m, i) => {
      const y = 320 + top + i * 140;
      const v = verdict(m);
      const status = v === null ? (m.mine ? '친구 결과 기다리는 중' : '아직 안 했어요') : v === 1 ? '내가 이김' : v === -1 ? '친구가 이김' : '비김';
      const c = this.add.container(UI.width / 2, y);
      const g = this.add.graphics();
      g.fillStyle(0x2b2d5a, 0.1).fillRoundedRect(-284, -52, 576, 116, 28);
      g.fillStyle(0xfffaf0, 1).fillRoundedRect(-290, -58, 576, 116, 28);
      g.lineStyle(3, v === 1 ? 0xffd84a : 0xd2a679, 1).strokeRoundedRect(-290, -58, 576, 116, 28);
      if (v === 1) crown(g, -240, -2, 0.55);
      const x0 = v === 1 ? -195 : -256;
      c.add([g,
        this.add.text(x0, -20, `${GAME_NAME[m.game]} · ${stageName(m)}`, { fontFamily: UI.fontTitle, fontSize: '28px', color: '#2b2d5a' }).setOrigin(0, 0.5),
        this.add.text(x0, 22, `vs ${opponentName(m)} · ${status}`, { fontFamily: UI.font, fontSize: '22px', color: '#5a5c88' }).setOrigin(0, 0.5),
        this.add.text(262, 0, '보기', { fontFamily: UI.fontTitle, fontSize: '26px', color: '#2f7bff' }).setOrigin(1, 0.5),
      ]);
      c.setSize(576, 116).setInteractive({ useHandCursor: true }).on('pointerup', () => { sfx('tap'); this.scene.start('Match', { id: m.id }); });
    });
    new Button(this, UI.width / 2 - 160, 1190, { ...SUB, label: '둘이서 하기', onPress: () => this.scene.start('Duo', { step: 'setup', mode: 'remote' }) });
    new Button(this, UI.width / 2 + 160, 1190, { ...SUB, label: '처음 화면으로', onPress: () => this.scene.start('Title') });
  }
}
