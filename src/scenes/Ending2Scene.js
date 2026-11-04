import Phaser from 'phaser';
import { afterDialogue } from '../ui/afterDialogue.js';
import { UI } from '../data/ui.js';
import { CHAPTERS } from '../data/chapters.js';
import { BOSSES } from '../data/bosses.js';
import { state, save } from '../state.js';
import { setTheme } from '../ui/theme.js';
import { Button } from '../ui/Button.js';
import { sfx, vibrate } from '../ui/feedback.js';
import { takePhoto } from '../ui/photo.js';
import { sendRecordCard } from '../social/social.js';
import { waitForAssets } from './PreloadScene.js';

// 2탄 엔딩: 다시 돌아온 봄, 포포네 마당. 친구 5명 + 블루나비가 모이고 "포포의 사계절 서울 — 끝". 별 없음, 계절별 미로 시간만.
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const FRIENDS = ['kkakkak', 'gaegul', 'bamtol', 'mungchi', 'gomsil'];

export class Ending2Scene extends Phaser.Scene {
  constructor() { super('Ending2'); }

  init(data) { this.initData = data; this.done = false; }

  create() {
    if (waitForAssets(this, ['blue_popoSpring_battle', ...FRIENDS.map((f) => `boss_${f}`)], this.initData)) return;
    setTheme('#fde3ea', '#a8dd8f');
    state.cleared = true;
    state.step = 'map';
    save();
    const g = this.add.graphics();
    g.fillStyle(0xfde3ea, 1).fillRect(0, 0, UI.width, 620).fillStyle(0xa8dd8f, 1).fillRect(0, 620, UI.width, UI.height - 620);
    for (let i = 0; i < 9; i++) g.fillStyle(0xffd84a, 1).fillCircle(40 + i * 82, 640, 14);
    this.popo = this.add.image(UI.width / 2, 700, 'blue_popoSpring_battle', 6).setDisplaySize(300, 300);
    FRIENDS.forEach((f, i) => {
      const x = 90 + i * 135, y = i % 2 ? 500 : 470;
      if (this.textures.exists(`boss_${f}`)) {
        const im = this.add.image(x, y, `boss_${f}`, 3).setDisplaySize(150, 150).setAlpha(0);
        this.tweens.add({ targets: im, alpha: 1, y: y - 10, duration: 500, delay: 400 + i * 220 });
      }
    });
    if (this.textures.exists('blue_butterfly')) {
      const bn = this.add.sprite(560, 330, 'blue_butterfly', 0).setDisplaySize(110, 110);
      if (this.anims.exists('blue_butterfly_move')) bn.play('blue_butterfly_move');
      this.tweens.add({ targets: bn, x: 600, y: 300, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    afterDialogue(this, () => this.finale());
    this.time.delayedCall(1600, () => this.scene.launch('Dialogue', { key: 'ending2', frame: 'spring', form: 'popoSpring' }));
  }

  finale() {
    sfx('win');
    vibrate('special');
    const t = this.add.text(UI.width / 2, 130, '포포의 사계절 서울', { fontFamily: UI.fontTitle, fontSize: '60px', color: '#ffffff', stroke: '#2b2d5a', strokeThickness: 10 }).setOrigin(0.5).setAlpha(0);
    const t2 = this.add.text(UI.width / 2, 206, '— 끝 —', { fontFamily: UI.fontTitle, fontSize: '40px', color: '#2b2d5a' }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: [t, t2], alpha: 1, duration: 700 });
    // 계절별 미로 시간 + 사귄 친구 수 (별 없음)
    const card = this.add.container(0, 0).setAlpha(0);
    const cg = this.add.graphics();
    cg.fillStyle(0x2b2d5a, 0.15).fillRoundedRect(44, 916, 632, 170, 28).fillStyle(0xffffff, 0.95).fillRoundedRect(40, 908, 640, 170, 28);
    card.add(cg);
    const friends = Object.keys(BOSSES).filter((b) => state.friends.includes(b)).length;
    card.add(this.add.text(70, 942, `사귄 친구 ${friends}명`, { fontFamily: UI.fontTitle, fontSize: '28px', color: '#2b2d5a' }).setOrigin(0, 0.5));
    CHAPTERS.forEach((c, i) => {
      const x = 120 + i * 160;
      card.add(this.add.text(x, 996, c.name, { fontFamily: UI.fontTitle, fontSize: '26px', color: '#2b2d5a' }).setOrigin(0.5));
      const sec = state.records[c.id]?.mazeSec;
      card.add(this.add.text(x, 1040, sec != null ? fmt(sec) : '-', { fontFamily: UI.font, fontSize: '24px', color: '#5a5c88' }).setOrigin(0.5));
    });
    this.tweens.add({ targets: card, alpha: 1, duration: 500, delay: 300 });
    const by = 1190;
    const row = this.add.container(0, 0).setAlpha(0);
    row.add(new Button(this, 130, by, { width: 220, height: 96, fontSize: 26, label: '사진 남기기', color: 0xffd84a, shade: 0xd9a92b, textColor: '#2b2d5a',
      onPress: async () => { row.setVisible(false); await new Promise((r) => this.time.delayedCall(60, r)); await takePhoto(this.game, 'popo-ending.png'); row.setVisible(true); } }));
    row.add(new Button(this, 360, by, { width: 220, height: 96, fontSize: 26, label: '기록 자랑', color: 0xff9fb8, shade: 0xe07a96, textColor: '#2b2d5a', onPress: () => sendRecordCard(this.game) }));
    row.add(new Button(this, 590, by, { width: 220, height: 96, fontSize: 26, label: '앨범으로', onPress: () => this.scene.start('Album') }));
    this.tweens.add({ targets: row, alpha: 1, duration: 400, delay: 800 });
    this.done = true;
  }
}
