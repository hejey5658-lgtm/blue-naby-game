import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { VERSION } from '../data/version.js';
import { state, save, resetProgress, hasProgress } from '../state.js';
import { platform } from '../platform.js';
import { drawPanel } from '../ui/frames.js';
import { iconClose } from '../ui/icons.js';
import { sfx, vibrate } from '../ui/feedback.js';

// 설정: 다른 씬 위에 띄운다. scene.launch('Settings', { frame, from })
// 소리 · 진동(지원 기기만) · 미로 조작 · 대사 속도 · 만든 사람들 · 처음부터 다시 하기
// (저장 코드·홈 화면 안내·개인정보·의견 보내기는 6·7단계에서 이 화면에 더한다)
const PANEL = { x: 30, y: 150, w: 660, h: 980 };
const ROW_H = 120;

export class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }

  init(data) {
    this.frame = data.frame ?? 'woodWindow';
    this.from = data.from;
    this.closing = false; // 씬은 다시 쓰이므로 지난번 상태를 지운다
  }

  create() {
    // 뒤를 살짝 어둡게, 판 밖을 누르면 닫힘
    this.add.rectangle(0, 0, UI.width, UI.height, 0x2b2d5a, 0.45).setOrigin(0)
      .setInteractive().on('pointerup', () => this.close());

    const root = this.add.container(0, 0);
    this.root = root;
    const g = this.add.graphics();
    drawPanel(g, PANEL.x, PANEL.y, PANEL.w, PANEL.h, this.frame);
    // 판 자체는 눌러도 닫히지 않게
    const block = this.add.zone(PANEL.x, PANEL.y, PANEL.w, PANEL.h).setOrigin(0).setInteractive();
    root.add([g, block]);

    root.add(this.add.text(UI.width / 2, PANEL.y + 78, '설정', { fontFamily: UI.fontTitle, fontSize: '48px', color: '#2b2d5a' }).setOrigin(0.5));
    this.makeClose(root);

    let y = PANEL.y + 170;
    const rows = [
      { label: '소리', key: 'sound', options: [[true, '켜기'], [false, '끄기']] },
      platform.can.vibrate && { label: '진동', key: 'vibrate', options: [[true, '켜기'], [false, '끄기']] },
      { label: '미로 조작', key: 'control', options: [['swipe', '쓱 밀기'], ['dpad', '방향 버튼']] },
      { label: '대사 속도', key: 'textSpeed', options: [['normal', '보통'], ['fast', '빠르게']] },
    ].filter(Boolean);
    for (const row of rows) { this.makeToggleRow(root, y, row); y += ROW_H; }

    root.add(this.add.text(UI.width / 2, y - 6, '소리가 안 나면 폰의 무음 모드를 확인해 주세요', {
      fontFamily: UI.font, fontSize: '22px', color: '#5a5c88',
    }).setOrigin(0.5));
    y += 60;

    this.makeLinkRow(root, y, '만든 사람들', () => this.showCredits());
    y += 104;
    if (hasProgress()) this.makeLinkRow(root, y, '처음부터 다시 하기', () => this.confirmReset(), '#a4523a');

    root.add(this.add.text(UI.width / 2, PANEL.y + PANEL.h - 40, `블루나비의 세계여행 · ${VERSION}`, {
      fontFamily: UI.font, fontSize: '20px', color: '#8a8cae',
    }).setOrigin(0.5));

    this.input.keyboard?.on('keydown-ESC', () => this.close());

    root.y = 30; root.alpha = 0;
    this.tweens.add({ targets: root, y: 0, alpha: 1, duration: 240, ease: 'Back.easeOut' });
  }

  makeClose(root) {
    const x = PANEL.x + PANEL.w - 64;
    const y = PANEL.y + 78;
    const g = this.add.graphics();
    g.fillStyle(0x2b2d5a, 0.08).fillCircle(x, y, 38);
    iconClose(g, x, y, 40);
    const hit = this.add.zone(x, y, 96, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => this.close());
    root.add([g, hit]);
  }

  // 두 가지 중 하나를 고르는 알약 모양 버튼
  makeToggleRow(root, y, row) {
    root.add(this.add.text(PANEL.x + 56, y, row.label, { fontFamily: UI.fontTitle, fontSize: '32px', color: '#2b2d5a' }).setOrigin(0, 0.5));
    const w = 320;
    const h = 84;
    const x0 = PANEL.x + PANEL.w - 48 - w;
    const g = this.add.graphics();
    const labels = row.options.map(([, text], i) => this.add.text(x0 + w / 4 + (i * w) / 2, y, text, {
      fontFamily: UI.fontTitle, fontSize: '28px', color: '#2b2d5a',
    }).setOrigin(0.5));
    const draw = () => {
      g.clear();
      g.fillStyle(0x2b2d5a, 0.08).fillRoundedRect(x0, y - h / 2, w, h, h / 2);
      const sel = row.options.findIndex(([v]) => v === state.settings[row.key]);
      g.fillStyle(0x2f7bff, 1).fillRoundedRect(x0 + 6 + (sel * w) / 2, y - h / 2 + 6, w / 2 - 12, h - 12, (h - 12) / 2);
      labels.forEach((t, i) => t.setColor(i === sel ? '#ffffff' : '#2b2d5a'));
    };
    draw();
    root.add([g, ...labels]);
    row.options.forEach(([value], i) => {
      const hit = this.add.zone(x0 + (i * w) / 2, y - 48, w / 2, 96).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => {
        if (state.settings[row.key] === value) return;
        state.settings[row.key] = value;
        save();
        draw();
        sfx('toggle');
        if (row.key === 'vibrate' && value) vibrate('collect');
      });
      root.add(hit);
    });
  }

  makeLinkRow(root, y, label, onPress, color = '#2b2d5a') {
    const g = this.add.graphics();
    g.fillStyle(0x2b2d5a, 0.06).fillRoundedRect(PANEL.x + 40, y - 44, PANEL.w - 80, 88, 26);
    const t = this.add.text(UI.width / 2, y, label, { fontFamily: UI.fontTitle, fontSize: '30px', color }).setOrigin(0.5);
    const hit = this.add.zone(PANEL.x + 40, y - 48, PANEL.w - 80, 96).setOrigin(0).setInteractive({ useHandCursor: true })
      .on('pointerup', () => { sfx('tap'); onPress(); });
    root.add([g, t, hit]);
  }

  // 판 위에 겹쳐 띄우는 작은 안내판
  popup(title, body, buttons) {
    const layer = this.add.container(0, 0);
    const dim = this.add.rectangle(0, 0, UI.width, UI.height, 0x2b2d5a, 0.35).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    const h = 520;
    const y = (UI.height - h) / 2;
    drawPanel(g, 70, y, 580, h, this.frame);
    const tt = this.add.text(UI.width / 2, y + 80, title, { fontFamily: UI.fontTitle, fontSize: '38px', color: '#2b2d5a' }).setOrigin(0.5);
    const bt = this.add.text(UI.width / 2, y + 230, body, {
      fontFamily: UI.font, fontSize: '27px', color: '#2b2d5a', align: 'center', lineSpacing: 12, wordWrap: { width: 480, useAdvancedWrap: true },
    }).setOrigin(0.5);
    layer.add([dim, g, tt, bt]);
    const bw = buttons.length === 1 ? 300 : 220;
    buttons.forEach(([label, color, fn], i) => {
      const bx = UI.width / 2 + (buttons.length === 1 ? 0 : (i === 0 ? -125 : 125));
      const by = y + h - 90;
      const b = this.add.graphics();
      b.fillStyle(color, 1).fillRoundedRect(bx - bw / 2, by - 44, bw, 88, 44);
      const bl = this.add.text(bx, by, label, { fontFamily: UI.fontTitle, fontSize: '30px', color: '#ffffff' }).setOrigin(0.5);
      const hit = this.add.zone(bx - bw / 2, by - 48, bw, 96).setOrigin(0).setInteractive({ useHandCursor: true })
        .on('pointerup', () => { sfx('tap'); layer.destroy(); fn?.(); });
      layer.add([b, bl, hit]);
    });
    layer.alpha = 0;
    this.tweens.add({ targets: layer, alpha: 1, duration: 180 });
  }

  showCredits() {
    this.popup('만든 사람들', '기획·이야기·캐릭터\n블루나비의 세계여행 기획자\n\n그림·개발  Claude Code\n글꼴  주아 · 고운돋움 (OFL)', [['닫기', 0x2f7bff]]);
  }

  confirmReset() {
    this.popup('처음부터 다시 할까요?', '지금까지의 여행 기록이 지워져요.\n설정과 닉네임은 그대로예요.', [
      ['그만두기', 0x8a8cae],
      ['처음부터', 0xe8584a, () => { resetProgress(); this.close(true); }],
    ]);
  }

  close(reset = false) {
    if (this.closing) return;
    this.closing = true;
    this.tweens.add({
      targets: this.root, alpha: 0, y: 20, duration: 160,
      onComplete: () => {
        this.game.events.emit('settings-closed', { reset });
        this.scene.stop();
      },
    });
  }
}
