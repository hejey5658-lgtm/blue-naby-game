import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { drawPanel } from '../ui/frames.js';
import { Button } from '../ui/Button.js';
import { sfx, unlockAudio } from '../ui/feedback.js';

// 일시정지: 멈춘 씬(미로·대결) 위에 띄운다. scene.launch('Pause', { chapter, frame })
// 계속하기 · (미로/대결) 처음부터 · 설정 · 타이틀로. 다른 앱에 갔다 오면 이 화면이 떠 있다.
export class PauseScene extends Phaser.Scene {
  constructor() { super('Pause'); }

  init(data) {
    this.chapter = data.chapter;
    this.frame = data.frame ?? 'woodWindow';
    this.under = data.under ?? 'Maze';
    this.restartLabel = data.restartLabel ?? '미로 처음부터';
    this.restartData = data.restartData ?? { chapter: data.chapter, fresh: true };
  }

  create() {
    this.add.rectangle(-2000, -2000, 4720, 5280, 0x2b2d5a, 0.5).setOrigin(0).setInteractive();
    const root = this.add.container(0, 0);
    const g = this.add.graphics();
    // 가로 (18절): 낮고 넓은 판에 버튼 2열
    const land = UI.landscape;
    const y = land ? 400 : 270;
    if (land) drawPanel(g, 360 - 450, y, 900, 480, this.frame);
    else drawPanel(g, 90, y, 540, 720, this.frame);
    root.add([g, this.add.text(UI.width / 2, y + (land ? 76 : 90), '잠깐 쉬는 중', { fontFamily: UI.fontTitle, fontSize: '46px', color: '#2b2d5a' }).setOrigin(0.5)]);

    const buttons = [
      ['계속하기', 0x2f7bff, 0x1f5fd6, '#ffffff', () => this.resume()],
      [this.restartLabel, 0xfffaf0, 0xd8c8a8, '#2b2d5a', () => this.restart()],
      ['설정', 0xfffaf0, 0xd8c8a8, '#2b2d5a', () => this.openSettings()],
      ['타이틀로', 0xffb347, 0xd98a2b, '#2b2d5a', () => this.toTitle()],
    ];
    buttons.forEach(([label, color, shade, textColor, fn], i) => {
      const [bx, by] = land ? [UI.width / 2 + (i % 2 ? 205 : -205), y + 200 + Math.floor(i / 2) * 140] : [UI.width / 2, y + 220 + i * 128];
      root.add(new Button(this, bx, by, { width: 400, height: 104, fontSize: 32, label, color, shade, textColor, onPress: () => { sfx('tap'); fn(); } }));
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
    this.scene.start(this.under, this.restartData);
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
