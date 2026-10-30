import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { CHAPTERS } from '../data/chapters.js';
import { VERSION, IS_TEST_BUILD } from '../data/version.js';
import { Button } from '../ui/Button.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { platform, requestFullscreen, vibrate } from '../platform.js';
import { setTheme } from '../ui/theme.js';

// 타이틀: 화면 위쪽은 창가(나무 창틀이 화면의 틀), 유리창 너머로 바깥 세상이 보이고
// 화분 위의 애벌레 블루나비가 창밖을 본다. 시작을 누르면 창문이 열린다.
// (docs/design-brief.md 3·6절 "창문이 넓어진다")
const C = {
  wall: 0xe9d8b4,
  floor: 0xf3e3c3,
  wood: 0xb98a5e,
  woodDark: 0x8f6440,
  woodLight: 0xd2a679,
  skyTop: 0x8fd3ff,
  skyBottom: 0xd6efff,
  hillFar: 0x7cc56a,
  hillNear: 0x4f9f4c,
  curtain: 0xff9fb8,
  curtainShade: 0xe67f9b,
  pot: 0xc96a4a,
  potShade: 0xa4523a,
  soil: 0x6b4630,
  leaf: 0x4f9f4c,
  ink: 0x2b2d5a,
};

const WIN = { x: 70, y: 96, w: 580, h: 600, frame: 34 };

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    setTheme(CHAPTERS[0].theme, '#f3e3c3');
    this.drawRoom();
    this.drawOutside();
    this.drawPanes();
    this.drawFrame();
    this.drawSill();
    this.drawLogo();
    this.drawControls();
    this.layoutSafeArea();
    this.scale.on('resize', this.layoutSafeArea, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layoutSafeArea, this));
  }

  drawRoom() {
    const g = this.add.graphics();
    g.fillStyle(C.wall, 1).fillRect(0, 0, UI.width, UI.height);
    // 벽지 세로 줄무늬 (아주 옅게)
    g.fillStyle(C.wood, 0.08);
    for (let x = 24; x < UI.width; x += 72) g.fillRect(x, 0, 24, 780);
    g.fillStyle(C.floor, 1).fillRect(0, 780, UI.width, UI.height - 780);
    g.fillStyle(C.wood, 0.25).fillRect(0, 780, UI.width, 10);
  }

  drawOutside() {
    const { x, y, w, h } = WIN;
    const g = this.add.graphics();
    // 바깥 풍경은 유리창 안에만 보이게
    const clip = this.make.graphics({}, false);
    clip.fillStyle(0xffffff).fillRect(x, y, w, h);
    g.setMask(clip.createGeometryMask());
    g.fillGradientStyle(C.skyTop, C.skyTop, C.skyBottom, C.skyBottom, 1).fillRect(x, y, w, h);
    // 해와 구름
    g.fillStyle(0xffd84a, 1).fillCircle(x + w - 110, y + 120, 44);
    g.fillStyle(0xffffff, 0.95);
    [[x + 120, y + 300, 34], [x + 160, y + 290, 44], [x + 205, y + 304, 30]].forEach(([cx, cy, r]) => g.fillCircle(cx, cy, r));
    // 언덕과 꽃 (바깥 세상)
    g.fillStyle(C.hillFar, 1).fillEllipse(x + w * 0.25, y + h - 40, w * 0.9, 260);
    g.fillStyle(C.hillNear, 1).fillEllipse(x + w * 0.8, y + h - 10, w * 0.9, 240);
    const flowers = [[x + 90, y + h - 120, 0xff6b5b], [x + 170, y + h - 150, 0xffd84a], [x + 380, y + h - 90, 0xff9fb8], [x + 470, y + h - 130, 0xff6b5b], [x + 300, y + h - 60, 0xffd84a]];
    for (const [fx, fy, col] of flowers) {
      g.fillStyle(col, 1);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        g.fillCircle(fx + Math.cos(a) * 8, fy + Math.sin(a) * 8, 7);
      }
      g.fillStyle(0xffffff, 1).fillCircle(fx, fy, 5);
    }
    // 멀리 나는 파란 나비 (블루나비가 될 꿈)
    this.dream = this.add.graphics({ x: x + 420, y: y + 230 });
    this.dream.fillStyle(0x2f7bff, 1).fillEllipse(-9, -4, 16, 20).fillEllipse(9, -4, 16, 20);
    this.dream.fillStyle(0x8fc2ff, 1).fillEllipse(-7, 8, 11, 12).fillEllipse(7, 8, 11, 12);
    this.dream.fillStyle(C.ink, 1).fillRoundedRect(-2, -10, 4, 22, 2);
    this.tweens.add({ targets: this.dream, x: '+=60', y: '-=40', duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.dream, scaleX: 0.55, duration: 160, yoyo: true, repeat: -1 });
  }

  // 유리창 두 짝: 왼쪽 짝은 왼쪽 경첩, 오른쪽 짝은 오른쪽 경첩을 축으로 열린다.
  drawPanes() {
    const { x, y, w, h } = WIN;
    const half = w / 2;
    const mk = (hingeX, dir) => {
      const c = this.add.container(hingeX, y);
      const g = this.add.graphics();
      const left = dir > 0 ? 0 : -half;
      g.fillStyle(0xffffff, 0.16).fillRect(left, 0, half, h);
      g.fillStyle(0xffffff, 0.35);
      g.fillTriangle(left + 40, 40, left + 80, 40, left + 30, 160);
      g.fillTriangle(left + 100, 40, left + 116, 40, left + 70, 130);
      g.fillStyle(C.wood, 1).fillRect(left, h / 2 - 8, half, 16);
      g.fillStyle(C.wood, 1).fillRect(dir > 0 ? half - 10 : left, 0, 10, h);
      c.add(g);
      return c;
    };
    this.paneL = mk(x, 1);
    this.paneR = mk(x + w, -1);
  }

  drawFrame() {
    const { x, y, w, h, frame: f } = WIN;
    const g = this.add.graphics();
    g.fillStyle(C.woodDark, 1).fillRoundedRect(x - f, y - f, w + f * 2, h + f * 2, 18);
    g.fillStyle(C.wood, 1).fillRoundedRect(x - f + 6, y - f + 4, w + f * 2 - 12, h + f * 2 - 12, 14);
    g.fillStyle(C.woodLight, 1).fillRoundedRect(x - f + 12, y - f + 8, w + f * 2 - 24, 8, 4);
    // 유리창 구멍을 다시 비워 바깥이 보이게: 틀은 네 변만 그린다
    const mask = this.make.graphics({}, false);
    mask.fillStyle(0xffffff).fillRect(x, y, w, h);
    const bm = mask.createGeometryMask();
    bm.setInvertAlpha(true);
    g.setMask(bm);
    // 커튼 자락 (양옆)
    const curtain = this.add.graphics();
    const drawCurtain = (cx, dir) => {
      curtain.fillStyle(C.curtainShade, 1);
      curtain.fillRoundedRect(cx - 46, y - f - 30, 92, h + f + 70, { tl: 20, tr: 20, bl: 46, br: 46 });
      curtain.fillStyle(C.curtain, 1);
      curtain.fillRoundedRect(cx - 40 + dir * 4, y - f - 30, 70, h + f + 60, { tl: 18, tr: 18, bl: 40, br: 40 });
      curtain.fillStyle(C.curtainShade, 1).fillRoundedRect(cx - 50, y + h * 0.55, 100, 22, 11);
    };
    drawCurtain(x - f - 4, 1);
    drawCurtain(x + w + f + 4, -1);
    // 커튼봉
    curtain.fillStyle(C.woodDark, 1).fillRoundedRect(10, y - f - 44, UI.width - 20, 16, 8);
    curtain.fillStyle(C.woodDark, 1).fillCircle(14, y - f - 36, 14).fillCircle(UI.width - 14, y - f - 36, 14);
  }

  drawSill() {
    const { y, h, frame: f } = WIN;
    const sillY = y + h + f - 6;
    const g = this.add.graphics();
    g.fillStyle(C.woodDark, 1).fillRoundedRect(20, sillY, UI.width - 40, 40, 10);
    g.fillStyle(C.woodLight, 1).fillRoundedRect(24, sillY, UI.width - 48, 12, 6);

    // 화분
    const px = 470;
    const top = sillY - 92;
    g.fillStyle(C.potShade, 1).fillPoints([{ x: px - 70, y: top + 16 }, { x: px + 70, y: top + 16 }, { x: px + 52, y: sillY }, { x: px - 52, y: sillY }], true);
    g.fillStyle(C.pot, 1).fillPoints([{ x: px - 70, y: top + 16 }, { x: px + 56, y: top + 16 }, { x: px + 40, y: sillY }, { x: px - 52, y: sillY }], true);
    g.fillStyle(C.potShade, 1).fillRoundedRect(px - 82, top, 164, 26, 10);
    g.fillStyle(C.pot, 1).fillRoundedRect(px - 82, top, 156, 20, 10);
    g.fillStyle(C.soil, 1).fillEllipse(px, top + 4, 140, 14);
    // 새싹 잎 두 장
    g.fillStyle(C.leaf, 1).fillEllipse(px - 40, top - 30, 54, 26).fillEllipse(px + 34, top - 46, 60, 28);
    g.lineStyle(5, C.leaf, 1).lineBetween(px, top, px - 6, top - 50);

    // 화분 테두리 위의 블루나비 (창밖을 보는 중)
    this.blue = this.add.sprite(px - 60, top + 10, 'blue_caterpillar_battle', 0).setOrigin(0.5, 0.92).setScale(0.46).setFlipX(true);
    if (this.anims.exists('blue_caterpillar_battle_idle')) this.blue.play('blue_caterpillar_battle_idle');
  }

  drawLogo() {
    // 유리창에 붙인 스티커 같은 제목
    const c = this.add.container(UI.width / 2 - 70, 250).setAngle(-4);
    const g = this.add.graphics();
    g.fillStyle(C.ink, 0.18).fillRoundedRect(-180, -88, 372, 192, 34);
    g.fillStyle(0xffffff, 1).fillRoundedRect(-186, -96, 372, 192, 34);
    g.lineStyle(4, C.ink, 1).strokeRoundedRect(-186, -96, 372, 192, 34);
    const small = this.add.text(0, -40, '블루나비의', { fontFamily: UI.fontTitle, fontSize: '46px', color: '#2f7bff' }).setOrigin(0.5);
    const big = this.add.text(0, 30, '세계여행', { fontFamily: UI.fontTitle, fontSize: `${UI.fontSize.title + 12}px`, color: '#2b2d5a' }).setOrigin(0.5);
    c.add([g, small, big]);
    this.logo = c;
  }

  drawControls() {
    this.startBtn = new Button(this, UI.width / 2, 1010, {
      label: '여행 시작하기',
      onPress: () => this.onStart(),
    });
    this.hint = this.add.text(UI.width / 2, 1150, '', {
      fontFamily: UI.font, fontSize: `${UI.fontSize.small + 4}px`, color: '#2b2d5a', align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    const tag = IS_TEST_BUILD ? `테스트 버전 ${VERSION}` : `v${VERSION}`;
    this.version = this.add.text(UI.width - 24, UI.height - 20, tag, {
      fontFamily: UI.font, fontSize: `${UI.fontSize.small}px`, color: '#2b2d5a',
    }).setOrigin(1, 1).setAlpha(0.6);

    if (!platform.can.storage) {
      this.add.text(UI.width / 2, 1190, '이 브라우저에서는 기록이 저장되지 않아요', {
        fontFamily: UI.font, fontSize: `${UI.fontSize.small}px`, color: '#a4523a',
      }).setOrigin(0.5);
    }

    this.input.keyboard?.on('keydown-ENTER', () => this.startBtn.trigger());
    this.input.keyboard?.on('keydown-SPACE', () => this.startBtn.trigger());
  }

  layoutSafeArea() {
    const { bottom } = getSafeInsets(this.game);
    this.version.y = UI.height - 20 - bottom;
  }

  onStart() {
    if (this.opened) return;
    this.opened = true;
    requestFullscreen();
    vibrate(UI.vibrate.collect);
    // 창문이 활짝 열린다 — 바깥 세상으로 나가는 첫 장면
    this.tweens.add({ targets: [this.paneL, this.paneR], scaleX: 0.08, duration: 700, ease: 'Back.easeIn' });
    this.tweens.add({ targets: this.logo, y: '-=24', alpha: 0.9, duration: 500, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: this.blue, x: '+=10', y: '-=26', duration: 260, yoyo: true, ease: 'Quad.easeOut' });
    this.hint.setText('창문이 열렸어요!\n프롤로그는 다음 단계에서 이어져요').setAlpha(0);
    this.tweens.add({ targets: this.hint, alpha: 1, duration: 400, delay: 500 });
  }
}
