import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { waitForAssets } from './PreloadScene.js';
import { FORMS } from '../data/forms.js';
import { state, save } from '../state.js';
import { setTheme } from '../ui/theme.js';
import { sfx, vibrate } from '../ui/feedback.js';
import { Button } from '../ui/Button.js';
import { chapterById } from '../flow.js';

// 진화 (systems.md 5절, 약 5초, 톡 하면 건너뛰기):
// 대사(졸려…) → 어두워짐 → 고치 → 고치 3번 흔들림 → 흰 빛 → 새 모습 + 반짝이 → "블루나비가 ○○(으)로 진화했다!" → 대사 → 여권
// 나방: 꽃 상자를 타고 배로 건너는 밤바다 / 나비: 화물기를 타고 건너는 태평양 위 새벽 구름
const SCENES = {
  moth: { sky: [0x101a3f, 0x1f2a5c], sea: 0x24366e, glow: 0xffe9a8, ability: '낮은 장애물을 넘어 날 수 있어!', theme: '#101a3f' },
  butterfly: { sky: [0x7fb2ff, 0xffd9b8], sea: 0xffffff, glow: 0xffffff, ability: '훨씬 빨리 날 수 있어!', theme: '#7fb2ff' },
};

export class EvolutionScene extends Phaser.Scene {
  constructor() { super('Evolution'); }

  init(data) {
    this.initData = data;
    this.chapter = chapterById(data.chapter);
    this.from = this.chapter.form;
    this.to = this.chapter.evolveTo;
    this.look = SCENES[this.to];
    // 씬은 다시 쓰이므로 지난번 진화의 상태를 지운다
    this.revealed = false;
    this.skippable = false;
    this.cocoon = null;
    this.dark = null;
  }

  create() {
    if (waitForAssets(this, [`blue_${this.from}_battle`, `blue_${this.to}_battle`, `face_blue_${this.to}`], this.initData)) return;
    setTheme(this.look.theme, this.look.theme);
    this.drawBackdrop();
    const fromKey = `blue_${this.from}_battle`;
    this.blue = this.add.sprite(UI.width / 2, 760, fromKey, 0).setOrigin(0.5, 0.92).setDisplaySize(300, 300);
    this.blueScale = this.blue.scale;
    if (this.anims.exists(`${fromKey}_idle`)) this.blue.play(`${fromKey}_idle`);

    this.game.events.once('dialogue-done', () => this.transform());
    this.time.delayedCall(400, () => this.scene.launch('Dialogue', { key: `evo_${this.to}_pre`, frame: this.chapter.frame, form: this.from }));
  }

  drawBackdrop() {
    const L = this.look;
    const g = this.add.graphics();
    const top = Phaser.Display.Color.ValueToColor(L.sky[0]);
    const bot = Phaser.Display.Color.ValueToColor(L.sky[1]);
    for (let i = 0; i < 16; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bot, 15, i);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1).fillRect(0, (UI.height / 16) * i, UI.width, UI.height / 16 + 1);
    }
    if (this.to === 'moth') {
      // 별, 달, 밤바다와 꽃 상자를 실은 배
      for (let i = 0; i < 40; i++) g.fillStyle(0xffffff, 0.4 + (i % 3) * 0.2).fillCircle((i * 157) % UI.width, (i * 89) % 640, 1.5 + (i % 2));
      g.fillStyle(0xffe9a8, 1).fillCircle(560, 200, 50);
      g.fillStyle(L.sky[0], 1).fillCircle(580, 186, 44);
      g.fillStyle(L.sea, 1).fillRect(0, 900, UI.width, UI.height - 900);
      g.lineStyle(4, 0x3a5196, 1);
      for (let y = 940; y < UI.height; y += 60) {
        g.beginPath();
        for (let x = 0; x <= UI.width; x += 20) g.lineTo(x, y + Math.sin(x / 40 + y) * 6);
        g.strokePath();
      }
      g.fillStyle(0x6e4a2e, 1).fillRoundedRect(150, 860, 420, 70, { tl: 0, tr: 0, bl: 40, br: 40 });
      g.fillStyle(0xc96a4a, 1).fillRoundedRect(250, 770, 220, 100, 12);
      g.fillStyle(0xffd84a, 1).fillCircle(300, 790, 12).fillCircle(420, 790, 12);
    } else {
      // 새벽 구름 위, 비행기 창 밖
      g.fillStyle(0xffffff, 0.9);
      for (let i = 0; i < 8; i++) g.fillCircle((i * 120 + 40) % UI.width, 980 + (i % 2) * 40, 90);
      g.fillRect(0, 1000, UI.width, UI.height - 1000);
      g.fillStyle(0xffe9a8, 1).fillCircle(130, 520, 64);
    }
  }

  transform() {
    this.skippable = true;
    this.input.once('pointerup', () => this.skip());
    const t = this.time;
    // 어두워짐
    this.dark = this.add.rectangle(0, 0, UI.width, UI.height, 0x000000, 0).setOrigin(0).setDepth(1);
    this.tweens.add({ targets: this.dark, fillAlpha: 0.45, duration: 600 });
    this.blue.anims.stop();
    this.blue.setFrame(3).setDepth(2);
    // 고치
    t.delayedCall(700, () => {
      this.cocoon = this.add.image(UI.width / 2, 700, 'cocoon').setDisplaySize(220, 220).setDepth(3).setScale(0);
      this.tweens.add({ targets: this.cocoon, scale: 220 / 256, duration: 500, ease: 'Back.easeOut' });
      this.tweens.add({ targets: this.blue, alpha: 0, duration: 400, delay: 200 });
    });
    [1500, 2100, 2700].forEach((ms) => t.delayedCall(ms, () => {
      if (!this.cocoon) return;
      vibrate('cocoon');
      sfx('tap');
      this.tweens.add({ targets: this.cocoon, angle: 12, duration: 90, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    }));
    t.delayedCall(3300, () => this.reveal());
  }

  skip() {
    if (this.revealed) return;
    this.time.removeAllEvents();
    this.reveal();
  }

  reveal() {
    if (this.revealed) return;
    this.revealed = true;
    state.form = this.to;
    save();
    const flash = this.add.rectangle(0, 0, UI.width, UI.height, 0xffffff, 1).setOrigin(0).setDepth(10);
    this.tweens.add({ targets: flash, alpha: 0, duration: 700, delay: 150, onComplete: () => flash.destroy() });
    this.cocoon?.destroy();
    this.dark?.destroy();
    vibrate('special');
    sfx('open');
    const key = `blue_${this.to}_battle`;
    this.blue.setTexture(key, 6).setAlpha(1).setDisplaySize(380, 380).setPosition(UI.width / 2, 800);
    const sc = this.blue.scale;
    this.blue.setScale(sc * 0.6);
    this.tweens.add({ targets: this.blue, scale: sc, duration: 600, ease: 'Back.easeOut' });
    this.time.delayedCall(700, () => { if (this.anims.exists(`${key}_idle`)) this.blue.play(`${key}_idle`); });
    // 반짝이 (진화 장면만 잠깐 60개까지)
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const d = this.add.star(UI.width / 2, 640, 5, 6, 14, i % 2 ? 0xffd84a : 0x8fc2ff).setDepth(9);
      this.tweens.add({ targets: d, x: UI.width / 2 + Math.cos(a) * 300, y: 640 + Math.sin(a) * 300, angle: 200, alpha: 0, scale: 0.4, duration: 1100, ease: 'Quad.easeOut', onComplete: () => d.destroy() });
    }
    const name = FORMS[this.to].name;
    const title = this.add.text(UI.width / 2, 250, `블루나비가 ${name}${this.to === 'moth' ? '으로' : '로'} 진화했다!`, {
      fontFamily: UI.fontTitle, fontSize: '46px', color: '#ffffff', stroke: '#2b2d5a', strokeThickness: 10,
    }).setOrigin(0.5).setDepth(11).setScale(0.6).setAlpha(0);
    const sub = this.add.text(UI.width / 2, 330, this.look.ability, {
      fontFamily: UI.font, fontSize: '30px', color: '#ffffff', stroke: '#2b2d5a', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(11).setAlpha(0);
    this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 420, delay: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: sub, alpha: 1, duration: 300, delay: 900 });
    this.time.delayedCall(1600, () => {
      new Button(this, UI.width / 2, 1130, {
        width: 400, height: 110, fontSize: 32, label: '계속하기',
        onPress: () => {
          this.game.events.once('dialogue-done', () => this.scene.start('Map', { justCleared: this.chapter.id }));
          this.scene.launch('Dialogue', { key: `evo_${this.to}_post`, frame: this.chapter.frame, form: this.to });
        },
      }).setDepth(12);
    });
  }
}
