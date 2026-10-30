import Phaser from 'phaser';
import { UI } from '../data/ui.js';

// 큰 둥근 버튼. 아래쪽에 한 단계 진한 면이 있고, 누르면 그 면 쪽으로 쑥 내려간다.
export class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { width = 440, height = 128, label, color = 0x2f7bff, shade = 0x1f5fd6, textColor = '#ffffff', fontSize = UI.fontSize.button, onPress }) {
    super(scene, x, y);
    const depth = 10;
    const r = Math.min(height / 2, 40);
    this.onPress = onPress;
    this.depthPx = depth;

    const under = scene.add.graphics();
    under.fillStyle(shade, 1).fillRoundedRect(-width / 2, -height / 2 + depth, width, height, r);
    this.face = scene.add.container(0, 0);
    const top = scene.add.graphics();
    top.fillStyle(color, 1).fillRoundedRect(-width / 2, -height / 2, width, height, r);
    top.fillStyle(0xffffff, 0.22).fillRoundedRect(-width / 2 + 18, -height / 2 + 10, width - 36, height * 0.28, r * 0.6);
    this.text = scene.add.text(0, 0, label, {
      fontFamily: UI.fontTitle, fontSize: `${fontSize}px`, color: textColor,
    }).setOrigin(0.5);
    this.face.add([top, this.text]);
    this.add([under, this.face]);

    this.setSize(width, height + depth);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => this.press());
    this.on('pointerup', () => this.release(true));
    this.on('pointerout', () => this.release(false));
    scene.add.existing(this);
  }

  press() {
    this.pressed = true;
    this.face.y = this.depthPx * 0.7;
  }

  release(fire) {
    if (!this.pressed) return;
    this.pressed = false;
    this.scene.tweens.add({ targets: this.face, y: 0, duration: 220, ease: 'Back.easeOut' });
    if (fire && this.onPress) this.onPress();
  }

  // 키보드(Enter/Space)로 누를 때
  trigger() {
    this.press();
    this.scene.time.delayedCall(90, () => this.release(true));
  }
}
