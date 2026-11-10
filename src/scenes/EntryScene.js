import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { VERSION, IS_TEST_BUILD } from '../data/version.js';
import { state } from '../state.js';
import { journeyTarget } from '../flow.js';
import { Button } from '../ui/Button.js';
import { updateBand, inAppBand, challengeBand } from '../ui/bands.js';
import { setTheme } from '../ui/theme.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { iconGear } from '../ui/icons.js';
import { sfx, vibrate, unlockAudio } from '../ui/feedback.js';
import { platform, requestFullscreen } from '../platform.js';

// 게임 입구 = 처음 화면 (design-brief 16절, 2026-11-10 바뀜): 책상 위에 펼친 옛 세계지도 + 가운데 지구본 모형.
// 지구본 옆 블루나비(1탄)·강아지 포포(2탄)나 아래 이름표 카드를 톡 → 그 탄 게임으로 바로 (이어하기면 이어서).
// 아래 [같이 하기] → 같이 하기 화면(19절). 대결장·도전장·새 버전·인앱 안내 띠도 여기에.
// 그림은 파일 없이 모두 Graphics로 그린다(첫 화면이라 가볍게). 지도는 한 장으로 구워 둔다(entry_map).
// 나라 경계선·국기는 그리지 않는다(6절 나라 표현 규칙). 대륙은 둥근 덩어리.
const C = {
  desk: 0x8f6440, deskDark: 0x6e4a2e, paper: 0xf6ead0, paperEdge: 0xe2cfa4, fold: 0xd9c393,
  sea: 0xdcebe2, wave: 0xbdd6cc, land: 0xe3c98f, landEdge: 0xc9a86a, ink: 0x2b2d5a,
  ocean: 0x7ec8ff, oceanDeep: 0x2f7bff, green: 0x6cc35a, greenLight: 0x9edc7c, gold: 0xe0a93a, goldLight: 0xffd84a,
  wood: 0xb98a5e, woodDark: 0x8f6440, blue: 0x2f7bff, sky: 0x7ec8ff, pink: 0xff9fb8, cream: 0xfffaf0, brown: 0xc98a5a,
};
const GLOBE = { x: 360, y: 520, r: 200 };
// 지구본 대륙: 경도(라디안)·위도(-1~1)·크기 덩어리 (실제 모양이 아니라 둥근 장난감 지구본 느낌)
const LANDS = [
  [0.0, -0.35, 0.9], [0.35, -0.45, 0.7], [0.55, -0.2, 0.55], [0.2, 0.05, 0.5], [0.75, 0.25, 0.35],       // 아시아
  [-0.7, -0.3, 0.55], [-0.85, 0.1, 0.65], [-0.6, 0.4, 0.4],                                              // 유럽·아프리카
  [2.3, -0.45, 0.75], [2.05, -0.15, 0.6], [2.45, -0.1, 0.45], [2.6, 0.35, 0.4], [2.75, 0.6, 0.35],        // 아메리카
  [1.15, 0.55, 0.45], [1.3, 0.6, 0.3],                                                                    // 오세아니아
];

export class EntryScene extends Phaser.Scene {
  constructor() { super('Entry'); }

  create() {
    this.leaving = false;
    this.rot = 0;
    setTheme('#8f6440', '#8f6440');
    // 캔버스 전체 높이(길쭉한 폰)를 쓴다: 책상·지도 종이는 끝까지, 지구본·카드는 남는 높이의 가운데로 (dy)
    this.insets = getSafeInsets(this.game, true);
    // 배치: 세로 = 위 지구본·아래 카드 두 장, 가로(18절) = 왼쪽 지구본·오른쪽 카드 위아래
    const W = UI.fullWidth, land = UI.landscape;
    this.dy = land ? 0 : UI.offY;
    this.titleY = land ? Math.max(48, this.insets.top + 40) : Math.max(92, this.insets.top + 56);
    this.lay = land
      ? { gx: Math.round(W * 0.34), gy: 380, gs: 0.82, cards: [[Math.round(W * 0.74), 220], [Math.round(W * 0.74), 410]], together: [Math.round(W * 0.74), 576], compass: [W - 90 - this.insets.right, 640], mapDX: Math.round(W / 2 - 360), mapDY: -110 }
      : { gx: GLOBE.x, gy: GLOBE.y + this.dy, gs: 1, cards: [[190, 960 + this.dy], [530, 960 + this.dy]], together: [340, 1118 + this.dy], compass: [624, 1128 + this.dy], mapDX: 0, mapDY: this.dy };
    this.drawMap();
    this.globe = this.add.container(this.lay.gx, this.lay.gy).setScale(this.lay.gs);
    this.drawStand();
    this.surface = this.add.graphics();
    this.shine = this.add.graphics();
    this.globe.add([this.surface, this.shine]);
    this.drawRing();
    this.drawShine();
    this.makeFriends();
    this.makeCards();
    this.makeChrome();
    this.drawSurface();
    // 대결장·도전장·새 버전·인앱 안내 띠 (예전 타이틀이 하던 일)
    this.bandX = UI.fullWidth / 2;
    const { top, bottom } = this.insets;
    inAppBand(this, UI.fullHeight - 70 - bottom);
    challengeBand(this, this.titleY + 90, () => this.enter(state.series === 2 ? 2 : 1));
    updateBand(this, this.titleY + 90 + (state.newChallenge ? 96 : 0));
    this.cameras.main.fadeIn(260, 143, 100, 64);
  }

  // ── 펼친 세계지도 (한 장으로 구움) ─────────────────
  drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const FH = UI.fullHeight, FW = UI.fullWidth;
    g.fillStyle(C.desk, 1).fillRect(0, 0, FW, FH);
    for (let y = 30; y < FH; y += 64) g.fillStyle(C.deskDark, 0.18).fillRect(0, y, FW, 3);
    const py = this.titleY + (UI.landscape ? 44 : 58);
    const px = 22 + this.insets.left;
    const P = { x: px, y: py, w: FW - px - 22 - this.insets.right, h: FH - (UI.landscape ? 20 : 70) - this.insets.bottom * 0.5 - py };
    g.fillStyle(0x000000, 0.18).fillRoundedRect(P.x + 6, P.y + 10, P.w, P.h, 20);
    g.fillStyle(C.paperEdge, 1).fillRoundedRect(P.x, P.y, P.w, P.h, 20);
    g.fillStyle(C.paper, 1).fillRoundedRect(P.x + 8, P.y + 8, P.w - 16, P.h - 16, 16);
    // 바다 (옅은 청록) + 물결
    g.fillStyle(C.sea, 1).fillRoundedRect(P.x + 30, P.y + 30, P.w - 60, P.h - 60, 14);
    g.lineStyle(3, C.wave, 1);
    for (let i = 0; i < 26; i++) {
      const x = P.x + 60 + ((i * 197) % (P.w - 140));
      const y = P.y + 60 + ((i * 131) % (P.h - 130));
      g.beginPath(); g.arc(x, y, 9, Math.PI, 0); g.arc(x + 18, y, 9, Math.PI, 0, true); g.strokePath();
    }
    // 둥근 대륙 덩어리 (평면 지도) — 길쭉한 폰이면 dy 만큼 아래로
    g.translateCanvas(this.lay.mapDX, this.lay.mapDY);
    const blob = (pts) => {
      for (const [x, y, r] of pts) g.fillStyle(C.landEdge, 1).fillCircle(x, y + 4, r);
      for (const [x, y, r] of pts) g.fillStyle(C.land, 1).fillCircle(x, y, r);
    };
    blob([[110, 300, 70], [170, 270, 60], [150, 360, 45], [200, 420, 40], [240, 470, 30]]);               // 아메리카 북
    blob([[230, 560, 40], [250, 620, 45], [240, 690, 35], [225, 750, 25]]);                                // 아메리카 남
    blob([[350, 260, 45], [395, 300, 40], [370, 380, 40], [390, 450, 55], [410, 520, 45], [400, 580, 30]]); // 유럽·아프리카
    blob([[480, 250, 60], [560, 270, 65], [620, 320, 45], [520, 340, 55], [600, 400, 35], [640, 360, 22]]); // 아시아
    blob([[600, 560, 40], [640, 590, 30]]);                                                                // 오세아니아
    // 블루나비 여행길 (한국 → 중국 → 일본 → 미국 → 캐나다) 점선 — 지구본 뒤로 은은하게 보인다
    const route = [[628, 330], [575, 340], [655, 320], [690, 260], [180, 330], [150, 250]];
    g.fillStyle(C.blue, 0.55);
    for (let i = 0; i < route.length - 1; i++) {
      const [x1, y1] = route[i], [x2, y2] = route[i + 1];
      if (i === 3) continue; // 태평양은 지도 끝을 돌아서 (오른쪽 끝 → 왼쪽 끝)
      const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 16));
      for (let k = 0; k <= n; k++) g.fillCircle(x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n, 3.5);
    }
    for (const [x, y] of route) g.fillStyle(C.blue, 0.8).fillCircle(x, y, 6);
    g.translateCanvas(-this.lay.mapDX, -this.lay.mapDY);
    // 접힌 자국
    g.fillStyle(C.fold, 0.5).fillRect(P.x + P.w / 3, P.y + 12, 3, P.h - 24).fillRect(P.x + (P.w * 2) / 3, P.y + 12, 3, P.h - 24).fillRect(P.x + 12, P.y + P.h / 2, P.w - 24, 3);
    // 나침반 (오른쪽 아래)
    const [cx, cy] = this.lay.compass;
    g.fillStyle(C.paper, 1).fillCircle(cx, cy, 46);
    g.lineStyle(3, C.ink, 0.6).strokeCircle(cx, cy, 46);
    g.fillStyle(0xe8584a, 1).fillTriangle(cx, cy - 40, cx - 10, cy, cx + 10, cy);
    g.fillStyle(C.ink, 0.8).fillTriangle(cx, cy + 40, cx - 10, cy, cx + 10, cy);
    g.fillStyle(C.ink, 0.5).fillTriangle(cx - 40, cy, cx, cy - 8, cx, cy + 8).fillTriangle(cx + 40, cy, cx, cy - 8, cx, cy + 8);
    if (this.textures.exists('entry_map')) this.textures.remove('entry_map');
    g.generateTexture('entry_map', FW, FH);
    g.destroy();
    this.add.image(0, 0, 'entry_map').setOrigin(0);
    this.add.text(this.lay.compass[0], this.lay.compass[1] - 62, 'N', { fontFamily: UI.fontTitle, fontSize: '22px', color: '#2b2d5a' }).setOrigin(0.5);
  }

  // ── 지구본 모형 ────────────────────────────────
  drawStand() {
    const g = this.add.graphics();
    const { r } = GLOBE;
    g.fillStyle(0x000000, 0.18).fillEllipse(6, r + 108, 300, 46);
    g.fillStyle(C.woodDark, 1).fillEllipse(0, r + 98, 280, 56);
    g.fillStyle(C.wood, 1).fillEllipse(0, r + 90, 280, 50);
    g.fillStyle(C.woodDark, 1).fillRoundedRect(-16, r - 6, 32, 100, 10);
    g.fillStyle(C.wood, 1).fillRoundedRect(-11, r - 6, 16, 96, 8);
    this.globe.add(g);
  }

  // 금빛 반원 고리 (앞쪽 위에 겹쳐 보이게 공보다 나중에)
  drawRing() {
    const g = this.add.graphics();
    const R = GLOBE.r + 22;
    g.lineStyle(16, 0x9c6b1e, 1);
    g.beginPath(); g.arc(0, 0, R, -Math.PI * 0.62, Math.PI * 0.62); g.strokePath();
    g.lineStyle(10, C.gold, 1);
    g.beginPath(); g.arc(0, 0, R, -Math.PI * 0.62, Math.PI * 0.62); g.strokePath();
    g.lineStyle(4, C.goldLight, 1);
    g.beginPath(); g.arc(-2, -2, R, -Math.PI * 0.55, Math.PI * 0.2); g.strokePath();
    g.fillStyle(C.gold, 1).fillCircle(0, -R, 12).fillCircle(0, R, 12);
    this.globe.add(g);
  }

  drawShine() {
    const g = this.shine;
    const { r } = GLOBE;
    g.fillStyle(0xffffff, 0.28).fillEllipse(-r * 0.38, -r * 0.42, r * 0.7, r * 0.42);
    g.fillStyle(0xffffff, 0.55).fillEllipse(-r * 0.46, -r * 0.5, r * 0.22, r * 0.12);
  }

  // 공과 대륙: 대륙 덩어리를 경도만큼 옆으로 흘리고, 가장자리로 갈수록 납작하게 (캔버스·WebGL 같게)
  drawSurface() {
    const g = this.surface.clear();
    const { r } = GLOBE;
    g.fillStyle(C.ink, 1).fillCircle(0, 0, r + 6);
    g.fillStyle(C.oceanDeep, 1).fillCircle(0, 0, r);
    g.fillStyle(C.ocean, 1).fillCircle(-r * 0.06, -r * 0.06, r * 0.9);
    for (const [lon, lat, size] of LANDS) {
      const a = lon + this.rot;
      const z = Math.cos(a);
      if (z <= 0.05) continue;
      const k = Math.sqrt(1 - lat * lat * 0.7);
      const x = Math.sin(a) * r * 0.86 * k;
      const y = lat * r * 0.82;
      const w = size * r * 0.62 * z;
      const h = size * r * 0.6;
      g.fillStyle(0x3f8f3a, 0.9).fillEllipse(x, y + 4, w, h);
      g.fillStyle(C.green, 1).fillEllipse(x, y, w, h);
      g.fillStyle(C.greenLight, 0.8).fillEllipse(x - w * 0.12, y - h * 0.16, w * 0.5, h * 0.36);
    }
  }

  // ── 블루나비(1탄)·포포(2탄) = 입구: 지구본 양옆에 서서 통통, 톡 하면 그 탄 게임으로 ──
  makeFriends() {
    const { gx, gy, gs } = this.lay;
    const last = state.series === 2 ? 2 : 1;
    this.pins = {};
    [[1, 'home_bluenabi', -218, 175], [2, 'home_popo', 218, 190]].forEach(([n, key, dx, dyy]) => {
      const x = gx + dx * gs, y = gy + dyy * gs, size = 210 * gs;
      const c = this.add.container(x, y);
      c.add(this.add.ellipse(0, size * 0.42, size * 0.7, size * 0.16, 0x000000, 0.18));
      if (this.textures.exists(key)) c.add(this.add.image(0, 0, key).setDisplaySize(size, size));
      else { const g = this.add.graphics(); if (n === 1) drawButterfly(g, 0, 0, 3); else drawPaw(g, 0, 0, 3); c.add(g); }
      c.setSize(size, size).setInteractive({ useHandCursor: true }).on('pointerup', () => this.enter(n));
      c.on('pointerdown', () => c.setScale(0.94));
      c.on('pointerout', () => c.setScale(1));
      // 마지막에 하던 탄이 더 크게 통통
      this.tweens.add({ targets: c, y: y - (n === last ? 22 : 10), duration: n === last ? 420 : 620, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.pins[n] = c;
    });
  }

  // ── 이름표 카드 (핀이 작아도 여기를 눌러 들어갈 수 있게) ──
  makeCards() {
    [1, 2].forEach((n) => {
      const [x, y] = this.lay.cards[n - 1];
      const c = this.add.container(x, y);
      const g = this.add.graphics();
      const col = n === 1 ? C.blue : C.pink;
      g.fillStyle(0x000000, 0.2).fillRoundedRect(-156, -76, 316, 168, 28);
      g.fillStyle(C.ink, 1).fillRoundedRect(-160, -84, 320, 168, 28);
      g.fillStyle(C.cream, 1).fillRoundedRect(-154, -78, 308, 156, 24);
      g.fillStyle(col, 1).fillRoundedRect(-154, -78, 308, 40, { tl: 24, tr: 24, bl: 0, br: 0 });
      g.fillStyle(C.cream, 1).fillCircle(-98, 18, 44);
      g.lineStyle(4, col, 1).strokeCircle(-98, 18, 44);
      if (n === 1) drawButterfly(g, -98, 18, 1.5); else drawPaw(g, -98, 20, 1.5);
      c.add(g);
      c.add(this.add.text(0, -58, n === 1 ? '1탄' : '2탄', { fontFamily: UI.fontTitle, fontSize: '26px', color: '#ffffff' }).setOrigin(0.5));
      const [a, b] = n === 1 ? ['블루나비의', '세계여행'] : ['포포의', '사계절 서울'];
      c.add(this.add.text(50, 0, a, { fontFamily: UI.fontTitle, fontSize: '30px', color: '#2b2d5a' }).setOrigin(0.5));
      c.add(this.add.text(50, 40, b, { fontFamily: UI.fontTitle, fontSize: '32px', color: n === 1 ? '#2f7bff' : '#d0537a' }).setOrigin(0.5));
      c.setSize(320, 168).setInteractive({ useHandCursor: true }).on('pointerup', () => this.enter(n));
      c.on('pointerdown', () => c.setScale(0.96));
      c.on('pointerout', () => c.setScale(1));
    });
    // 같이 하기 (19절: 2~3명 · 미로 / 기념품 퐁퐁)
    const [tx, ty] = this.lay.together;
    this.togetherBtn = new Button(this, tx, ty, {
      width: 400, height: 104, fontSize: 36, label: '같이 하기', color: 0xffb347, shade: 0xd98a2b, textColor: '#2b2d5a',
      onPress: () => { if (this.leaving) return; sfx('tap'); unlockAudio(); this.scene.start('Together'); },
    });
  }

  makeChrome() {
    const { top, bottom } = this.insets;
    this.add.text(UI.fullWidth / 2, this.titleY, '블루나비와 포포의 여행', { fontFamily: UI.fontTitle, fontSize: '52px', color: '#fffaf0', stroke: '#6e4a2e', strokeThickness: 10 }).setOrigin(0.5);
    const tag = IS_TEST_BUILD ? `테스트 버전 ${VERSION}` : `v${VERSION}`;
    this.add.text(36 + this.insets.left, UI.fullHeight - 26 - bottom, tag, { fontFamily: UI.font, fontSize: '22px', color: '#fffaf0' }).setOrigin(0, 1).setAlpha(0.8);
    // 설정 (오른쪽 아래)
    const gear = this.add.container(UI.fullWidth - 64 - this.insets.right, UI.landscape ? 48 + top : UI.fullHeight - 52 - bottom);
    const gg = this.add.graphics();
    gg.fillStyle(0xffffff, 0.95).fillCircle(0, 0, 34);
    iconGear(gg, 0, 0, 42);
    gear.add(gg).setSize(96, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      sfx('tap'); unlockAudio(); this.input.enabled = false; this.scene.launch('Settings', { frame: 'woodWindow', from: 'Entry' });
    });
    const onClosed = () => { this.input.enabled = true; };
    this.game.events.on('settings-closed', onClosed);
    this.events.once('shutdown', () => this.game.events.off('settings-closed', onClosed));
    // 게임장(한 파일 버전) 안이면 왼쪽 위 [← 게임장]
    if (window.BB_EMBED) {
      const hub = this.add.container(112, 40 + top);
      const hg = this.add.graphics();
      hg.fillStyle(0xffffff, 0.95).fillRoundedRect(-88, -28, 176, 56, 28);
      hub.add([hg, this.add.text(0, 0, '← 게임장', { fontFamily: UI.fontTitle, fontSize: '26px', color: '#2b2d5a' }).setOrigin(0.5)]);
      hub.setSize(180, 80).setInteractive({ useHandCursor: true })
        .on('pointerup', () => { sfx('tap'); try { parent.postMessage({ type: 'bb-close' }, '*'); } catch { /* 무시 */ } });
    }
  }

  update(_, delta) {
    if (platform.reducedMotion && !this.leaving) return;
    this.rot += (delta / 1000) * (this.leaving ? 2.4 : 0.22);
    this.drawSurface();
  }

  // 들어가기: 누른 친구가 폴짝, 지구본이 커지며 그 탄 게임으로 바로 (이어하기면 이어서)
  enter(n) {
    if (this.leaving) return;
    this.leaving = true;
    unlockAudio();
    requestFullscreen();
    sfx('open');
    vibrate('collect');
    const pin = this.pins[n];
    this.tweens.killTweensOf(pin);
    this.tweens.add({ targets: pin, y: pin.y - 40, scale: 1.15, duration: 220, yoyo: true });
    this.tweens.add({ targets: this.globe, scale: this.lay.gs * 1.6, duration: 800, ease: 'Cubic.easeIn' });
    this.time.delayedCall(480, () => this.cameras.main.fadeOut(320, 255, 250, 240));
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const [key, data] = journeyTarget(n);
      this.scene.start(key, data);
    });
  }
}

// 파란 나비 (핀·카드 그림)
function drawButterfly(g, x, y, s) {
  g.fillStyle(C.ink, 1).fillEllipse(x - 10 * s, y - 6 * s, 20 * s, 22 * s).fillEllipse(x + 10 * s, y - 6 * s, 20 * s, 22 * s)
    .fillEllipse(x - 8 * s, y + 9 * s, 15 * s, 15 * s).fillEllipse(x + 8 * s, y + 9 * s, 15 * s, 15 * s);
  g.fillStyle(C.sky, 1).fillEllipse(x - 10 * s, y - 6 * s, 15 * s, 17 * s).fillEllipse(x + 10 * s, y - 6 * s, 15 * s, 17 * s);
  g.fillStyle(C.blue, 1).fillEllipse(x - 8 * s, y + 9 * s, 10 * s, 10 * s).fillEllipse(x + 8 * s, y + 9 * s, 10 * s, 10 * s);
  g.fillStyle(C.ink, 1).fillRoundedRect(x - 2.5 * s, y - 12 * s, 5 * s, 26 * s, 2.5 * s);
  g.lineStyle(2 * s, C.ink, 1).lineBetween(x, y - 12 * s, x - 6 * s, y - 20 * s).lineBetween(x, y - 12 * s, x + 6 * s, y - 20 * s);
}

// 강아지 발바닥
function drawPaw(g, x, y, s) {
  g.fillStyle(C.brown, 1).fillEllipse(x, y + 5 * s, 22 * s, 18 * s);
  g.fillCircle(x - 12 * s, y - 7 * s, 5.5 * s).fillCircle(x - 4 * s, y - 13 * s, 5.5 * s).fillCircle(x + 5 * s, y - 13 * s, 5.5 * s).fillCircle(x + 13 * s, y - 7 * s, 5.5 * s);
  g.fillStyle(C.pink, 1).fillEllipse(x, y + 6 * s, 12 * s, 9 * s);
}
