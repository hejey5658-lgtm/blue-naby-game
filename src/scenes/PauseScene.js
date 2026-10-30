import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { drawPanel } from '../ui/frames.js';
import { Button } from '../ui/Button.js';
import { sfx, unlockAudio } from '../ui/feedback.js';

// 일시정지: 멈춘 씬(미로·대결) 위에 띄운다. scene.launch('Pause', { chapter, frame })
// 계속하기 · 미로 처음부터 · 설정 · 타이틀로. 다른 앱에 갔다 오면 이 화면이 떠 있다.
export class PauseScene extends Phaser.Scene {
  constructor() { super('Pause'); }

  init(data) {
    this.chapter = data.chapter;
    this.frame = data.frame ?? 'woodWindow';
    this.under = data.under ?? 'Maze';
  }

  create() {
    this.add.rectangle(0, 0, UI.width, UI.height, 0x2b2d5a, 0.5).setOrigin(0).setInteractive();
    const root = this.add.container(0, 0);
    const g = this.add.graphics();
    const y = 270;
    drawPanel(g, 90, y, 540, 720, this.frame);
    root.add([g, this.add.text(UI.width / 2, y + 90, '잠깐 쉬는 중', { fontFamily: UI.fontTitle, fontSize: '46px', color: '#2b2d5a' }).setOrigin(0.5)]);

    const buttons = [
      ['계속하기', 0x2f7bff, 0x1f5fd6, '#ffffff', () => this.resume()],
      ['미로 처음부터', 0xfffaf0, 0xd8c8a8, '#2b2d5a', () => this.restart()],
      ['설정', 0xfffaf0, 0xd8c8a8, '#2b2d5a', () => this.openSettings()],
      ['타이틀로', 0xffb347, 0xd98a2b, '#2b2d5a', () => this.toTitle()],
    ];
    buttons.forEach(([label, color, shade, textColor, fn], i) => {
      root.add(new Button(this, UI.width / 2, y + 220 + i * 128, { width: 400, height: 104, fontSize: 32, label, color, shade, textColor, onPress: () => { sfx('tap'); fn(); } }));
    });

    this.input.keyboard?.on('keydown-ESC', () => this.resume());
    this.input.keyboard?.on('keydown-ENTER', () => this.resume());

    const onSettingsClosed = () => { this.input.enabled = true; };
    this.game.events.on('settings-closed', onSettingsClosed);
    this.events.once('shutdown', () => this.game.events.off('settings-closed', onSettingsClosed));

    root.alpha = 0;
    root.y = 24;
    this.tweens.add({ targets: root, alpha: 1, y: 0, duration: 220, ease: 'Back.easeOut' });
  }

  resume() {
    unlockAudio();
    this.scene.resume(this.under);
    this.scene.stop();
  }

  restart() {
    this.scene.stop(this.under);
    this.scene.start(this.under, { chapter: this.chapter, fresh: true });
  }

  openSettings() {
    this.input.enabled = false;
    this.scene.launch('Settings', { frame: this.frame });
    this.scene.bringToTop('Settings');
  }

  toTitle() {
    this.scene.stop(this.under);
    this.scene.start('Title');
  }
}
