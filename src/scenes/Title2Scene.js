import Phaser from 'phaser';
import { afterDialogue } from '../ui/afterDialogue.js';
import { UI, landView } from '../data/ui.js';
import { CHAPTERS } from '../data/chapters.js';
import { VERSION } from '../data/version.js';
import { Button } from '../ui/Button.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { requestFullscreen } from '../platform.js';
import { state, save, hasProgress } from '../state.js';
import { unlockAudio, sfx, vibrate } from '../ui/feedback.js';
import { iconGear } from '../ui/icons.js';
import { updateBand, inAppBand } from '../ui/bands.js';
import { setTheme } from '../ui/theme.js';
import { waitForAssets } from './PreloadScene.js';

// 2탄 타이틀: 포포네 마당 (docs/design-brief.md 13절). 나무 울타리·개나리 화분·빨랫줄, 울타리 위를 팔랑이는 블루나비.
// 왼쪽 위 [◀ 지구본]으로 게임 입구로 (진행 기록은 탄마다 따로).
const C = { sky: 0xcfeaff, sky2: 0xe6f5ff, grass: 0xa8dd8f, grass2: 0x8cc97a, fence: 0xe0aa7e, fenceDark: 0xa8673c, ink: 0x2b2d5a };

export class Title2Scene extends Phaser.Scene {
  constructor() { super('Title2'); }

  init(data) { this.initData = data; this.opening = false; }

  create() {
    if (waitForAssets(this, ['blue_popoSpring_battle', 'blue_butterfly', 'face_bluenabi', 'face_blue_popoSpring'], this.initData)) return;
    setTheme('#cfeaff', '#a8dd8f');
    const { top, bottom } = getSafeInsets(this.game);
    this.drawYard();
    // 포포 (가운데, 마당 잔디 위)
    this.popo = this.add.sprite(UI.width / 2, 700, 'blue_popoSpring_battle', 0).setDisplaySize(330, 330);
    if (this.anims.exists('blue_popoSpring_battle_idle')) this.popo.play('blue_popoSpring_battle_idle');
    this.tweens.add({ targets: this.popo, y: 690, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // 블루나비: 울타리 위를 팔랑
    this.bn = this.add.sprite(520, 420, 'blue_butterfly', 0).setDisplaySize(110, 110);
    if (this.anims.exists('blue_butterfly_move')) this.bn.play('blue_butterfly_move');
    this.tweens.add({ targets: this.bn, x: 600, y: 380, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // 로고
    this.add.text(UI.width / 2, 170 + top, '포포의 사계절 서울', { fontFamily: UI.fontTitle, fontSize: '70px', color: '#ffffff', stroke: '#2b2d5a', strokeThickness: 12 }).setOrigin(0.5);
    this.add.text(UI.width / 2, 248 + top, '블루나비의 세계여행 2탄', { fontFamily: UI.fontTitle, fontSize: '30px', color: '#2b2d5a' }).setOrigin(0.5);

    this.startBtn = new Button(this, UI.width / 2, 960, { label: hasProgress() ? '여행 이어하기' : '여행 시작하기', onPress: () => this.onStart() });
    this.popBtn = new Button(this, UI.width / 2 - 165, 1110, {
      width: 310, height: 96, label: '기념품 퐁퐁', fontSize: 30, color: 0xffb347, shade: 0xd98a2b, textColor: '#2b2d5a',
      onPress: () => { sfx('tap'); unlockAudio(); this.scene.start('Pop', { step: 'menu' }); },
    });
    this.duoBtn = new Button(this, UI.width / 2 + 165, 1110, {
      width: 310, height: 96, label: '둘이서 하기', fontSize: 30, color: 0xff9fb8, shade: 0xe07a96, textColor: '#2b2d5a',
      onPress: () => { sfx('tap'); unlockAudio(); this.scene.start('Duo', { step: 'setup' }); },
    });

    // 지구본 입구로 (왼쪽 위) — 1탄·2탄은 입구에서 고른다 (16절)
    const sw = this.add.container(130, 64 + top);
    const sg = this.add.graphics();
    sg.fillStyle(0xffffff, 0.95).fillRoundedRect(-106, -30, 212, 60, 30).lineStyle(3, C.ink, 0.2).strokeRoundedRect(-106, -30, 212, 60, 30);
    sw.add([sg, this.add.text(0, 0, '◀ 지구본', { fontFamily: UI.fontTitle, fontSize: '26px', color: '#2b2d5a' }).setOrigin(0.5)]);
    sw.setSize(216, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => { sfx('tap'); this.scene.start('Entry'); });

    // 설정 (오른쪽 위)
    const gear = this.add.container(UI.width - 64, 64 + top);
    const gg = this.add.graphics();
    gg.fillStyle(0xffffff, 0.95).fillCircle(0, 0, 38).lineStyle(3, C.ink, 0.2).strokeCircle(0, 0, 38);
    iconGear(gg, 0, 0, 46);
    gear.add(gg).setSize(96, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      sfx('tap'); unlockAudio(); this.input.enabled = false; this.scene.launch('Settings', { frame: 'spring' });
    });
    const onClosed = ({ reset }) => { this.input.enabled = true; if (reset) this.startBtn.text.setText('여행 시작하기'); };
    this.game.events.on('settings-closed', onClosed);
    this.events.once('shutdown', () => this.game.events.off('settings-closed', onClosed));

    const ver = this.add.text(UI.width - 24, UI.height - 20 - bottom, `v${VERSION}`, { fontFamily: UI.font, fontSize: `${UI.fontSize.small}px`, color: '#2b2d5a' }).setOrigin(1, 1).setAlpha(0.6);
    inAppBand(this, UI.landscape ? 840 : 1222 - bottom);
    // 가로 (18절): 마당 그림을 조금 줄여 왼쪽에, 버튼은 오른쪽에 위아래로
    if (UI.landscape) {
      const v = this.landscapeView();
      const ins = getSafeInsets(this.game);
      this.startBtn.setPosition(1150, 380);
      this.popBtn.setPosition(1150, 540);
      this.duoBtn.setPosition(1150, 670);
      gear.setPosition(v.right - 60 - ins.right / v.zoom, v.top + 56 + ins.top / v.zoom);
      sw.setPosition(v.left + 126 + ins.left / v.zoom, v.top + 56 + ins.top / v.zoom);
      ver.setPosition(v.right - 24, v.bottom - 16);
    }
    updateBand(this, 236 + top);
    this.input.keyboard?.on('keydown-ENTER', () => this.input.enabled && this.startBtn.trigger());
    this.input.keyboard?.on('keydown-SPACE', () => this.input.enabled && this.startBtn.trigger());
  }

  landscapeView() { return landView(0.8, 770, 470); }

  drawYard() {
    const g = this.add.graphics();
    // 가로·길쭉한 화면에서도 끝까지 (X0 ~ X1)
    const X0 = -1200, XW = UI.width + 2400;
    g.fillStyle(C.sky, 1).fillRect(X0, -900, XW, 1460);
    g.fillStyle(C.sky2, 1).fillRect(X0, 300, XW, 260);
    g.fillStyle(0xffffff, 0.95).fillEllipse(140, 360, 120, 44).fillEllipse(110, 370, 80, 34).fillEllipse(560, 320, 110, 40);
    // 빨랫줄 + 작은 손수건
    g.lineStyle(3, C.fenceDark, 0.8).lineBetween(40, 330, 680, 300);
    [[180, 324, 0xffc2d6], [300, 318, 0xbfe3ff], [420, 312, 0xfff3a0]].forEach(([x, y, c]) => g.fillStyle(c, 1).fillRect(x, y, 46, 40));
    // 울타리
    g.fillStyle(C.grass, 1).fillRect(X0, 540, XW, UI.height - 540 + 900);
    g.fillStyle(C.grass2, 1).fillRect(X0, 540, XW, 14);
    g.fillStyle(C.fenceDark, 1).fillRect(X0, 470, XW, 12).fillRect(X0, 510, XW, 12);
    for (let x = 10 - 62 * 20; x < UI.width + 1200; x += 62) {
      g.fillStyle(C.fenceDark, 1).fillRoundedRect(x - 2, 418, 44, 132, { tl: 22, tr: 22, bl: 0, br: 0 });
      g.fillStyle(C.fence, 1).fillRoundedRect(x + 2, 422, 36, 126, { tl: 18, tr: 18, bl: 0, br: 0 });
    }
    // 개나리 화분 (양쪽)
    for (const x of [90, 630]) {
      g.fillStyle(0xc96a4a, 1).fillRect(x - 36, 780, 72, 56);
      g.fillStyle(0xe0895f, 1).fillRoundedRect(x - 44, 770, 88, 18, 6);
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI - Math.PI; g.fillStyle(0xffd84a, 1).fillCircle(x + Math.cos(a) * 44, 764 + Math.sin(a) * 50, 10); }
      g.fillStyle(0x6cc35a, 1).fillRect(x - 3, 720, 6, 50);
    }
    // 잔디 풀잎
    for (let i = 0; i < 60; i++) {
      const x = X0 + 600 + ((i * 97) % (UI.width + 1200)), y = (UI.landscape ? 600 : 860) + ((i * 53) % 360);
      g.fillStyle(C.grass2, 1).fillTriangle(x, y, x + 6, y - 16, x + 12, y);
    }
  }

  onStart() {
    if (this.opening) return;
    this.opening = true;
    unlockAudio();
    requestFullscreen();
    sfx('open');
    vibrate('collect');
    this.time.delayedCall(200, () => {
      this.opening = false;
      const playing = state.playing ?? CHAPTERS[state.chapter - 1]?.id ?? CHAPTERS[0].id;
      if (state.step.endsWith('_maze')) { this.scene.start('Maze', { chapter: playing }); return; }
      if (state.step.endsWith('_boss')) { this.scene.start('Maze', { chapter: playing, fresh: true }); return; } // 예전 대결 중 저장 → 미로부터
      if (hasProgress()) { this.scene.start('Album'); return; }
      this.playPrologue();
    });
  }

  playPrologue() {
    this.input.enabled = false;
    afterDialogue(this, () => {
      const first = CHAPTERS[0];
      Object.assign(state, { step: `${first.id}_maze`, chapter: 1, playing: first.id, mazeState: null });
      save();
      this.cameras.main.fadeOut(300, 207, 234, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Maze', { chapter: first.id, fresh: true }));
    });
    this.scene.launch('Dialogue', { key: CHAPTERS[0].intro, frame: CHAPTERS[0].frame, form: CHAPTERS[0].form });
  }
}
