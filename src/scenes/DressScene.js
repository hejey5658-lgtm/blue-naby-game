import Phaser from 'phaser';
import { afterDialogue } from '../ui/afterDialogue.js';
import { UI } from '../data/ui.js';
import { FORMS } from '../data/forms.js';
import { ITEMS } from '../data/items.js';
import { setTheme } from '../ui/theme.js';
import { Button } from '../ui/Button.js';
import { sfx, vibrate } from '../ui/feedback.js';
import { josa } from '../ui/josa.js';
import { chapterById } from '../flow.js';
import { waitForAssets } from './PreloadScene.js';

// 2탄 '옷 갈아입기' (1탄 진화 자리, design-brief 13절): 대사 → 친구 선물이 반짝 날아와 입혀짐 → "포포가 ○○을 입었어요!" → 대사 → 앨범.
// 게임오버·다치는 표현 없음. scene.start('Dress', { chapter })
const NEXT_SKY = { popoSummer: 0xd6efff, popoAutumn: 0xfbe7c2, popoWinter: 0xe6f0fa };

export class DressScene extends Phaser.Scene {
  constructor() { super('Dress'); }

  init(data) {
    this.initData = data;
    this.chapter = chapterById(data.chapter);
    this.from = this.chapter.form;
    this.to = this.chapter.dressTo;
    this.revealed = false;
  }

  create() {
    if (waitForAssets(this, [`blue_${this.from}_battle`, `blue_${this.to}_battle`], this.initData)) return;
    setTheme(this.chapter.theme, this.chapter.theme);
    this.bg = this.add.rectangle(0, 0, UI.width, UI.height, Phaser.Display.Color.HexStringToColor(this.chapter.theme).color).setOrigin(0);
    this.popo = this.add.image(UI.width / 2, 640, `blue_${this.from}_battle`, 0).setDisplaySize(380, 380);
    afterDialogue(this, () => this.dress());
    this.time.delayedCall(300, () => this.scene.launch('Dialogue', { key: `dress_${this.to}_pre`, frame: this.chapter.frame, form: this.from }));
  }

  dress() {
    const gift = [].concat(this.chapter.rewards?.[this.chapter.bosses.length - 1] ?? this.chapter.rewards?.[0] ?? [])[0]; // 첫 선물 = 계절 옷
    // 선물이 반짝이 고리를 그리며 포포에게
    const ring = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const d = this.add.circle(UI.width / 2 + Math.cos(a) * 240, 640 + Math.sin(a) * 240, 10, [0xffd84a, 0xffffff, 0xff9fb8][i % 3]);
      ring.push(d);
      this.tweens.add({ targets: d, x: UI.width / 2, y: 640, scale: 0.3, duration: 900, delay: i * 40, ease: 'Quad.easeIn' });
    }
    sfx('evolve');
    this.time.delayedCall(1100, () => {
      ring.forEach((d) => d.destroy());
      const flash = this.add.rectangle(0, 0, UI.width, UI.height, 0xffffff, 1).setOrigin(0).setDepth(5);
      this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });
      this.bg.setFillStyle(NEXT_SKY[this.to] ?? 0xffffff);
      this.popo.setTexture(`blue_${this.to}_battle`, 6);
      this.tweens.add({ targets: this.popo, y: 610, duration: 260, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
      vibrate('special');
      const name = gift ? ITEMS[gift]?.name : FORMS[this.to].name;
      this.add.text(UI.width / 2, 250, `포포가 ${josa(name, '을', '를')} 입었어요!`, { fontFamily: UI.fontTitle, fontSize: '50px', color: '#2b2d5a', stroke: '#ffffff', strokeThickness: 8 }).setOrigin(0.5);
      this.revealed = true;
      this.time.delayedCall(1400, () => {
        afterDialogue(this, () => this.showButton());
        this.scene.launch('Dialogue', { key: `dress_${this.to}_post`, frame: this.chapter.frame, form: this.to });
      });
    });
  }

  showButton() {
    const b = new Button(this, UI.width / 2, 1130, { label: '앨범 보기', onPress: () => { sfx('tap'); this.scene.start('Album', { justCleared: this.chapter.id }); } });
    this.input.keyboard?.once('keydown-ENTER', () => b.trigger());
  }
}
