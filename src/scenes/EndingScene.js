import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { waitForAssets } from './PreloadScene.js';
import { CHAPTERS } from '../data/chapters.js';
import { state, save } from '../state.js';
import { setTheme } from '../ui/theme.js';
import { Button } from '../ui/Button.js';
import { iconStar } from '../ui/icons.js';
import { sfx, vibrate } from '../ui/feedback.js';
import { takePhoto } from '../ui/photo.js';
import { sendFeedback } from '../ui/helpers7.js';

// 엔딩 (scenario 9절, concept-v2 3절): 캐나다 튤립 꽃밭 한가운데 가장 큰 파란 꽃(꽃님).
// 블루나비가 날아와 꽃 위에 앉고, 대사가 이어질 때마다 친구들이 하나씩 꽃 주위에 나타난다.
// "창문이 넓어진다"의 끝 — 화면 틀이 없다. 마지막 화면: "블루나비의 세계여행 — 끝", 장별 기록, 사진 남기기.
const FRIEND_SPOTS = {
  dustmong: [92, 610], silsili: [628, 610], jjakjjak: [560, 720], bbangbbang: [160, 720],
  sappuni: [628, 830], dotori: [92, 830], damdam: [200, 900], buzzboss: [520, 900],
};
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export class EndingScene extends Phaser.Scene {
  constructor() { super('Ending'); }

  init(data) {
    this.initData = data;
    this.shown = new Set();
    this.done = false;
  }

  create() {
    if (waitForAssets(this, ['npc_flower', 'blue_butterfly_battle', 'boss_buzzboss'], this.initData)) return;
    setTheme('#8fd3ff', '#5fb84f');
    this.drawField();
    // 꽃님
    this.flower = this.add.sprite(UI.width / 2, 900, 'npc_flower', 0).setOrigin(0.5, 0.95).setDisplaySize(460, 460).setDepth(2);
    this.tweens.add({ targets: this.flower, angle: 2, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // 블루나비가 왼쪽 위에서 날아와 꽃 위에 앉는다
    this.blue = this.add.sprite(-80, 200, 'blue_butterfly_battle', 0).setOrigin(0.5, 0.9).setDisplaySize(190, 190).setDepth(4);
    if (this.anims.exists('blue_butterfly_battle_idle')) this.blue.play('blue_butterfly_battle_idle');
    const path = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(-80, 200), new Phaser.Math.Vector2(140, 80), new Phaser.Math.Vector2(UI.width / 2, 640));
    const follower = { t: 0 };
    this.tweens.add({
      targets: follower, t: 1, duration: 2200, ease: 'Sine.easeInOut',
      onUpdate: () => { const p = path.getPoint(follower.t); this.blue.setPosition(p.x, p.y); },
      onComplete: () => {
        vibrate('collect');
        this.sparkle(UI.width / 2, 600, 18);
        this.time.delayedCall(500, () => this.talk());
      },
    });

    state.cleared = true;
    save();
    this.input.keyboard?.on('keydown-ENTER', () => this.homeBtn?.trigger());
  }

  drawField() {
    const g = this.add.graphics();
    // 하늘 (띠로 그라데이션)
    const top = Phaser.Display.Color.ValueToColor(0x7fc3ff);
    const bot = Phaser.Display.Color.ValueToColor(0xd6efff);
    for (let i = 0; i < 12; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bot, 11, i);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1).fillRect(0, i * 46, UI.width, 47);
    }
    g.fillStyle(0xffe9a8, 1).fillCircle(600, 140, 56);
    g.fillStyle(0xffffff, 0.9).fillCircle(150, 170, 34).fillCircle(190, 160, 44).fillCircle(232, 174, 30);
    // 먼 단풍 숲
    const maples = [0xc0563a, 0xe8794f, 0xd9643f, 0xf0a04b];
    for (let i = 0; i < 16; i++) g.fillStyle(maples[i % 4], 1).fillCircle(i * 50 - 10, 520 + (i % 3) * 10, 46 + (i % 2) * 12);
    // 튤립 꽃밭: 아래로 갈수록 크게 (원근)
    g.fillStyle(0x5fb84f, 1).fillRect(0, 540, UI.width, UI.height - 540);
    const tulips = [0xff6b5b, 0xffd84a, 0xff9fb8, 0xffffff, 0xe8584a];
    for (let row = 0; row < 11; row++) {
      const y = 570 + row * row * 6.4 + row * 10;
      const r = 6 + row * 2.2;
      const gap = r * 3.2;
      const col = tulips[row % tulips.length];
      for (let x = (row % 2) * gap * 0.5; x < UI.width + gap; x += gap) {
        g.fillStyle(0x3f8f3c, 1).fillRect(x - 1.5, y, 3, r * 1.2);
        g.fillStyle(col, 1).fillEllipse(x, y, r * 1.4, r * 1.7);
      }
    }
  }

  sparkle(x, y, n) {
    for (let i = 0; i < Math.min(n, 30); i++) {
      const a = (i / n) * Math.PI * 2;
      const d = this.add.star(x, y, 5, 5, 11, i % 2 ? 0xffd84a : 0xffffff).setDepth(9);
      this.tweens.add({ targets: d, x: x + Math.cos(a) * 170, y: y + Math.sin(a) * 170, alpha: 0, angle: 160, duration: 900, ease: 'Quad.easeOut', onComplete: () => d.destroy() });
    }
  }

  talk() {
    const onLine = ({ key, speaker }) => {
      if (key !== 'ending') return;
      if (FRIEND_SPOTS[speaker]) this.showFriend(speaker);
      if (speaker === 'dot') this.showDot();
    };
    this.game.events.on('dialogue-line', onLine);
    this.events.once('shutdown', () => this.game.events.off('dialogue-line', onLine));
    this.game.events.once('dialogue-done', () => {
      // 대사를 건너뛰었으면 남은 친구들도 다 나온다
      Object.keys(FRIEND_SPOTS).forEach((k, i) => this.time.delayedCall(i * 90, () => this.showFriend(k)));
      this.showDot();
      this.time.delayedCall(1000, () => this.finale());
    });
    this.scene.launch('Dialogue', { key: 'ending', frame: 'cloud', form: 'butterfly' });
  }

  showFriend(key) {
    if (this.shown.has(key) || !this.textures.exists(`boss_${key}`)) return;
    this.shown.add(key);
    const [x, y] = FRIEND_SPOTS[key];
    const sp = this.add.sprite(x, y, `boss_${key}`, 4).setOrigin(0.5, 0.92).setDisplaySize(150, 150).setDepth(3);
    const sc = sp.scale;
    sp.setScale(0).setAlpha(0);
    this.tweens.add({ targets: sp, scale: sc, alpha: 1, duration: 420, ease: 'Back.easeOut' });
    this.tweens.add({ targets: sp, y: y - 10, duration: 700, yoyo: true, repeat: -1, delay: 420, ease: 'Sine.easeInOut' });
    this.sparkle(x, y - 70, 8);
    sfx('tap');
  }

  showDot() {
    if (this.shown.has('dot')) return;
    this.shown.add('dot');
    const d = this.add.sprite(470, 470, 'npc_dot', 1).setDisplaySize(96, 96).setDepth(5).setAlpha(0);
    this.tweens.add({ targets: d, alpha: 1, y: 500, duration: 400 });
    this.tweens.add({ targets: d, y: 490, duration: 900, yoyo: true, repeat: -1, delay: 400, ease: 'Sine.easeInOut' });
  }

  // 마지막 화면: 제목, 장별 기록, 사진 남기기
  finale() {
    if (this.done) return;
    this.done = true;
    sfx('open');
    vibrate('special');
    this.blue.anims.stop();
    this.blue.setFrame(6);
    const t = this.add.text(UI.width / 2, 120, '블루나비의 세계여행', { fontFamily: UI.fontTitle, fontSize: '56px', color: '#ffffff', stroke: '#2b2d5a', strokeThickness: 10 }).setOrigin(0.5).setDepth(10).setAlpha(0);
    const t2 = this.add.text(UI.width / 2, 192, '— 끝 —', { fontFamily: UI.fontTitle, fontSize: '40px', color: '#ffe9a8', stroke: '#2b2d5a', strokeThickness: 8 }).setOrigin(0.5).setDepth(10).setAlpha(0);
    this.tweens.add({ targets: [t, t2], alpha: 1, y: '+=10', duration: 700, ease: 'Sine.easeOut' });

    // 장별 기록 카드
    const card = this.add.container(0, 0).setDepth(10).setAlpha(0);
    const g = this.add.graphics();
    g.fillStyle(0x2b2d5a, 0.15).fillRoundedRect(44, 966, 632, 168, 28);
    g.fillStyle(0xffffff, 0.94).fillRoundedRect(40, 958, 640, 168, 28);
    card.add(g);
    const total = CHAPTERS.reduce((n, c) => n + (state.stars[c.id] ?? 0), 0);
    const totalSec = CHAPTERS.reduce((n, c) => n + (state.records[c.id]?.mazeSec ?? 0), 0);
    card.add(this.add.text(70, 990, `모은 별 ${total} / ${CHAPTERS.length * 3}`, { fontFamily: UI.fontTitle, fontSize: '28px', color: '#2b2d5a' }).setOrigin(0, 0.5));
    card.add(this.add.text(650, 990, `미로 시간 합계 ${fmt(totalSec)}`, { fontFamily: UI.font, fontSize: '22px', color: '#5a5c88' }).setOrigin(1, 0.5));
    CHAPTERS.forEach((c, i) => {
      const x = 92 + i * 89;
      card.add(this.add.text(x, 1036, `${i + 1}장`, { fontFamily: UI.fontTitle, fontSize: '22px', color: '#2b2d5a' }).setOrigin(0.5));
      const sg = this.add.graphics();
      for (let k = 0; k < 3; k++) iconStar(sg, x + (k - 1) * 22, 1070, 22, k < (state.stars[c.id] ?? 0) ? 0xffd84a : 0xd8c8a8);
      card.add(sg);
      const sec = state.records[c.id]?.mazeSec;
      card.add(this.add.text(x, 1100, sec != null ? fmt(sec) : '-', { fontFamily: UI.font, fontSize: '18px', color: '#5a5c88' }).setOrigin(0.5));
    });
    this.tweens.add({ targets: card, alpha: 1, duration: 500, delay: 400 });

    const by = 1200;
    const buttons = this.add.container(0, 0).setDepth(11).setAlpha(0);
    buttons.add(new Button(this, 200, by, {
      width: 300, height: 100, fontSize: 30, label: '사진 남기기', color: 0xffd84a, shade: 0xd9a92b, textColor: '#2b2d5a',
      onPress: async () => {
        buttons.setVisible(false);
        await new Promise((r) => this.time.delayedCall(60, r));
        const res = await takePhoto(this.game, 'bluenabi-ending.png');
        buttons.setVisible(true);
        this.toast(res === 'shared' ? '사진을 보냈어요!' : res === 'downloaded' ? '사진을 저장했어요!' : '이 브라우저에선 사진 저장이 안 돼요');
      },
    }));
    this.homeBtn = new Button(this, 520, by, { width: 300, height: 100, fontSize: 30, label: '처음 화면으로', onPress: () => this.scene.start('Title') });
    buttons.add(this.homeBtn);
    if (window.BB_EMBED) {
      buttons.add(new Button(this, UI.width / 2, by - 120, {
        width: 300, height: 90, fontSize: 28, label: '← 게임장', color: 0xfdf7ea, shade: 0xc9c0ae, textColor: '#2b2d5a',
        onPress: () => { try { parent.postMessage({ type: 'bb-close' }, '*'); } catch { /* 무시 */ } },
      }));
    }
    // 의견 보내기 (오른쪽 위 작은 버튼)
    const fb = this.add.container(UI.width - 100, 46).setDepth(11);
    const fg = this.add.graphics();
    fg.fillStyle(0xffffff, 0.95).fillRoundedRect(-88, -26, 176, 52, 26);
    fb.add([fg, this.add.text(0, 0, '의견 보내기', { fontFamily: UI.fontTitle, fontSize: '22px', color: '#2f7bff' }).setOrigin(0.5)]);
    fb.setSize(180, 80).setInteractive({ useHandCursor: true }).on('pointerup', () => { sfx('tap'); sendFeedback(); });
    buttons.add(fb);
    this.tweens.add({ targets: buttons, alpha: 1, duration: 400, delay: 900 });
  }

  toast(msg) {
    const t = this.add.text(UI.width / 2, 1110, msg, { fontFamily: UI.font, fontSize: '26px', color: '#ffffff', backgroundColor: '#2b2d5acc', padding: { x: 16, y: 8 } }).setOrigin(0.5).setDepth(12);
    this.tweens.add({ targets: t, alpha: 0, delay: 1800, duration: 400, onComplete: () => t.destroy() });
  }
}
