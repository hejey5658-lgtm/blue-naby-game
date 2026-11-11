import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { VERSION, IS_TEST_BUILD } from '../data/version.js';
import { state } from '../state.js';
import { useSeries } from '../series.js';
import { setTheme } from '../ui/theme.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { iconGear } from '../ui/icons.js';
import { sfx, vibrate, unlockAudio } from '../ui/feedback.js';
import { platform } from '../platform.js';

// 게임 입구 (design-brief 16절, 2026-11-10 바뀜): 책상 위에 펼친 옛 세계지도 + 가운데 큰 지구본 모형.
// 지구본 양옆의 블루나비(1탄)·강아지 포포(2탄)를 톡 → 지구본이 커지며 홈(19절, 'Title')으로 — 누른 탄 버튼이 반짝.
// (핀·이름표 카드는 2026-11-10 사용자 요청으로 블루나비·포포 그림으로 바꾸고 없앰)
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
      ? { gx: Math.round(W / 2), gy: 372, gs: 0.98, fs: 0.62, fx: 84, fy: 14, mapDX: Math.round(W / 2 - 360), mapDY: -110 }
      : { gx: GLOBE.x, gy: GLOBE.y + 40 + this.dy, gs: 1.22, fs: 0.76, fx: 104, fy: 18, mapDX: 0, mapDY: this.dy };
    this.drawMap();
    this.globe = this.add.container(this.lay.gx, this.lay.gy).setScale(this.lay.gs);
    this.drawStand();
    this.surface = this.add.graphics();
    this.shine = this.add.graphics();
    this.globe.add([this.surface, this.shine]);
    this.drawRing();
    this.drawShine();
    // 썸네일·카카오 미리보기와 같은 한 장면 (2026-11-11 "카카오 미리보기·처음 화면·썸네일을 동일하게"):
    // 아래(가로는 오른쪽)에 "블루나비와 포포를 톡! 여행을 시작해봐요" + 주소 + 만든 사람, 그 자리는 물품을 비운다.
    const band = this.makeBanner();
    this.makeItems({ step: 112, base: 0.5, vary: 0.1, gap: 8, max: 80, mix: 1.9, shrink: true, edge: 50, ...band });
    this.makeFriends();
    this.makeChrome();
    this.drawSurface();
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
    this.paper = P; // 여행 물품을 흩어 놓을 자리 (makeItems)
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
    if (this.textures.exists('entry_map')) this.textures.remove('entry_map');
    g.generateTexture('entry_map', FW, FH);
    g.destroy();
    this.add.image(0, 0, 'entry_map').setOrigin(0);
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

  // ── 주변 빈 곳을 채우는 귀여운 여행 물품 (배낭·물병·나침반, 파일 없이 그림, 2026-11-10) ──
  // 지도 종이의 빈 곳(지구본·블루나비·포포·제목을 피해서)에 물품을 흩어 놓는다 — 세로·가로·길쭉한 폰 모두 채워지게.
  // 자리는 고른 격자 + 조금씩 어긋나게(시드 고정), 크기·기울기도 조금씩 달리해 책상 위에 놓인 듯 자연스럽게.
  // opts(썸네일처럼 빽빽하게 채울 때): step 칸 간격, base·vary 크기, gap 지구본과 틈, bottom 이 아래는 비워 둠, max 개수
  makeItems(opts = {}) {
    this.items?.forEach((g) => g.destroy());
    const P = this.paper, { gx, gy, gs } = this.lay, land = UI.landscape;
    const R = GLOBE.r * gs;
    const step = opts.step ?? (land ? 150 : 172);
    const gap = opts.gap ?? 40, base = opts.base ?? (land ? 0.52 : 0.6), vary = opts.vary ?? 0.14;
    const bottom = opts.bottom ?? Infinity, max = opts.max ?? 22;
    const KINDS = ['backpack', 'camera', 'bottle', 'ticket', 'compass', 'hat', 'suitcase', 'passport'];
    const DRAW = { backpack: drawBackpack, bottle: drawBottle, compass: drawCompass, suitcase: drawSuitcase, camera: drawCamera, hat: drawHat, passport: drawPassport, ticket: drawTicket };
    const rnd = (k) => { const v = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
    const blocked = (x, y, r) => {
      if (y + r > bottom) return true;                                                             // 비워 둘 아래 띠
      if (opts.avoid?.some((a) => x + r > a.x1 && x - r < a.x2 && y + r > a.y1 && y - r < a.y2)) return true; // 글자 자리
      if (Math.hypot(x - gx, y - gy) < R + gap + r) return true;                                  // 지구본
      if (Math.abs(x - gx) < 160 * gs + r * 0.7 && y > gy && y < gy + 330 * gs + r * 0.6) return true; // 받침
      return false;
    };
    const spots = [];
    let k = 0;
    for (let y = P.y + 80; y < P.y + P.h - 60; y += step * 0.86) {
      const row = Math.round((y - P.y) / step);
      for (let x = P.x + (opts.edge ?? 78) + (row % 2) * step * 0.5; x < P.x + P.w - 40; x += step) {
        k++;
        const jx = x + (rnd(k) - 0.5) * 34, jy = y + (rnd(k + 99) - 0.5) * 30;
        // 좁은 틈이면(opts.shrink) 조금 작게 해서라도 채운다
        for (const f of opts.shrink ? [1, 0.78, 0.62] : [1]) {
          const sc = (base + rnd(k + 7) * vary) * f;
          const r = 72 * sc;
          if (jx - r < P.x + 26 || jx + r > P.x + P.w - 26 || jy - r < P.y + 24 || jy + r > P.y + P.h - 22) continue;
          if (blocked(jx, jy, r)) continue;
          spots.push([jx, jy, sc, k]);
          break;
        }
      }
    }
    // 지구본에 가까운 자리부터 채운다 (지구본 중심으로)
    spots.sort((a, b) => Math.hypot(a[0] - gx, a[1] - gy) - Math.hypot(b[0] - gx, b[1] - gy));
    // 골고루 섞기: 가까운(약 1.7칸 안) 물품과 겹치지 않는 종류 중 지금까지 덜 쓴 것부터
    const placed = [], used = Object.fromEntries(KINDS.map((kd) => [kd, 0]));
    const pick = (x, y, kk) => {
      const near = new Set(placed.filter((q) => Math.hypot(q.x - x, q.y - y) < step * (opts.mix ?? 1.7)).map((q) => q.kind));
      const order = KINDS.map((kd, n) => ({ kd, w: used[kd] + rnd(kk + n * 31) * 0.9 })).sort((a, b) => a.w - b.w);
      const kind = (order.find((o) => !near.has(o.kd)) ?? order[0]).kd;
      used[kind]++;
      placed.push({ x, y, kind });
      return kind;
    };
    this.items = spots.slice(0, max).map(([x, y, sc, kk], i) => {
      const g = this.add.graphics({ x, y }).setScale(sc).setAngle((rnd(kk + 3) - 0.5) * 22);
      DRAW[pick(x, y, kk)](g);
      if (!platform.reducedMotion) this.tweens.add({ targets: g, angle: g.angle + (i % 2 ? 4 : -4), duration: 1400 + (i % 5) * 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: (i % 4) * 300 });
      return g;
    });
  }


  // ── 썸네일과 같은 글자 띠: 한마디 + 주소 + 만든 사람 (톡 하는 곳은 아님) ──
  // 세로 = 지도 아래쪽 가운데, 가로 = 지구본 오른쪽. 물품이 비켜 갈 자리({ bottom } 또는 { avoid })를 돌려준다.
  makeBanner() {
    const land = UI.landscape, P = this.paper, F = UI.fontTitle;
    const c = this.add.container(0, 0).setDepth(2);
    const word = (t, color, size, font = F) => this.add.text(0, 0, t, { fontFamily: font, fontSize: `${size}px`, color }).setOrigin(0, 0.5);
    const line = (parts, y) => {
      const ts = parts.map(([t, col]) => word(t, col, 31));
      const w = ts.reduce((a, t) => a + t.width, 0);
      let x = -w / 2;
      ts.forEach((t) => { t.setPosition(x, y); x += t.width; c.add(t); });
      return w;
    };
    const BLUE = '#2f7bff', PINK = '#e0557a', INK = '#2b2d5a';
    let y = 0, kw;
    if (land) {
      kw = Math.max(line([['블루나비', BLUE], ['와 ', INK], ['포포', PINK], ['를 톡!', INK]], y), line([['여행을 시작해봐요', INK]], y + 44));
      y += 44 + 72;
    } else {
      kw = line([['블루나비', BLUE], ['와 ', INK], ['포포', PINK], ['를 톡! 여행을 시작해봐요', INK]], y);
      y += 74;
    }
    // 주소 알약 (흰 바탕·남색 테·빨간 재생 동그라미)
    const url = word('blue-naby-game.web.app', INK, 37);
    const lw = 10 + 51 + 12 + url.width + 27, lh = 70;
    const lg = this.add.graphics();
    lg.fillStyle(0x2b2d5a, 1).fillRoundedRect(-lw / 2, y - lh / 2 + 6, lw, lh, lh / 2);
    lg.fillStyle(0x2b2d5a, 1).fillRoundedRect(-lw / 2, y - lh / 2, lw, lh, lh / 2);
    lg.fillStyle(0xffffff, 1).fillRoundedRect(-lw / 2 + 5, y - lh / 2 + 5, lw - 10, lh - 10, (lh - 10) / 2);
    const cx = -lw / 2 + 10 + 25;
    lg.fillStyle(0xff6b5b, 1).fillCircle(cx, y, 25);
    lg.fillStyle(0xffffff, 1).fillTriangle(cx - 6, y - 12, cx - 6, y + 12, cx + 14, y);
    url.setPosition(cx + 25 + 12, y - 2);
    c.add([lg, url]);
    y += lh / 2 + 6 + 48;
    // 만든 사람 (남색 알약)
    const small = word('만든 사람', '#cfe3ff', 23, UI.font), name = word('장은영(블루나비)', '#ffffff', 32);
    const bw = 27 + small.width + 10 + name.width + 27, bh = 56;
    const bg = this.add.graphics();
    bg.fillStyle(0x2b2d5a, 1).fillRoundedRect(-bw / 2, y - bh / 2, bw, bh, bh / 2);
    small.setPosition(-bw / 2 + 27, y);
    name.setPosition(-bw / 2 + 27 + small.width + 10, y - 1);
    c.add([bg, small, name]);
    const h = y + bh / 2 + 22; // 위(한마디 가운데)부터 아래 끝까지
    const w = Math.max(kw, lw, bw);
    if (land) {
      // 지구본 고리 오른쪽 빈 칸 가운데
      const x1 = this.lay.gx + (GLOBE.r + 30) * this.lay.gs + 16, x2 = P.x + P.w - 30;
      const sc = Math.min(1, (x2 - x1) / (w + 20));
      const top = this.lay.gy - (h * sc) / 2 + 20 * sc;
      c.setPosition((x1 + x2) / 2, top).setScale(sc);
      return { avoid: [{ x1: (x1 + x2) / 2 - (w * sc) / 2 - 10, x2: (x1 + x2) / 2 + (w * sc) / 2 + 10, y1: top - 30 * sc, y2: top + h * sc }] };
    }
    // 세로: 만든 사람 알약이 지도 아래 끝에 걸치게 (썸네일과 같게)
    const base = P.y + P.h - 16 - (y);
    c.setPosition(UI.fullWidth / 2, base);
    return { bottom: base - 22 };
  }

  // ── 블루나비(1탄)·포포(2탄) = 입구: 지구본 양옆에 서서 통통, 톡 하면 그 탄 게임으로 ──
  makeFriends() {
    const { gx, gy, fs, fx, fy } = this.lay;
    const last = state.series === 2 ? 2 : 1;
    this.pins = {};
    [[1, 'home_bluenabi', -1, 0], [2, 'home_popo', 1, 12]].forEach(([n, key, side, dyy]) => {
      // 지구본 가운데에 둘이 나란히 (2026-11-10 "블루나비·포포를 지구본 가운데 배치")
      const size = 300 * fs;
      const x = gx + side * fx, y = gy + fy + dyy * fs;
      const c = this.add.container(x, y);
      c.add(this.add.ellipse(0, size * 0.42, size * 0.7, size * 0.16, 0x000000, 0.18));
      if (this.textures.exists(key)) c.add(this.add.image(0, 0, key).setDisplaySize(size, size));
      else { const g = this.add.graphics(); if (n === 1) drawButterfly(g, 0, 0, 3); else drawPaw(g, 0, 0, 3); c.add(g); }
      // 누구인지 작은 이름 (상자 없이)
      c.add(this.add.text(0, size * 0.56, n === 1 ? '1탄 세계여행' : '2탄 사계절 서울', { fontFamily: UI.fontTitle, fontSize: `${Math.round(30 * fs)}px`, color: n === 1 ? '#2f7bff' : '#d0537a', stroke: '#fffaf0', strokeThickness: 8 }).setOrigin(0.5));
      c.setSize(size, size * 1.3).setInteractive({ useHandCursor: true }).on('pointerup', () => this.enter(n));
      c.on('pointerdown', () => c.setScale(0.94));
      c.on('pointerout', () => c.setScale(1));
      // 마지막에 하던 탄이 더 크게 통통
      this.tweens.add({ targets: c, y: y - (n === last ? 22 : 10), duration: n === last ? 420 : 620, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.pins[n] = c;
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

  // 들어가기: 누른 친구가 폴짝, 지구본이 커지며 홈으로 (누른 탄 버튼이 반짝, 19절)
  enter(n) {
    if (this.leaving) return;
    this.leaving = true;
    unlockAudio();
    sfx('open');
    vibrate('collect');
    useSeries(n);
    const pin = this.pins[n];
    this.tweens.killTweensOf(pin);
    this.tweens.add({ targets: pin, y: pin.y - 40, scale: 1.15, duration: 220, yoyo: true });
    this.tweens.add({ targets: this.globe, scale: this.lay.gs * 1.6, duration: 800, ease: 'Cubic.easeIn' });
    this.time.delayedCall(480, () => this.cameras.main.fadeOut(320, 255, 250, 240));
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title', { highlight: n }));
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

// ── 귀여운 여행 물품 (가운데가 0,0, 크기 약 170). 남색 외곽선 + 볼터치 얼굴 — 캐릭터들과 같은 그림체 ──
const INKC = 0x2b2d5a, CHEEK = 0xff9fb8;
function face(g, x, y, s = 1) {
  g.fillStyle(INKC, 1).fillCircle(x - 14 * s, y, 4.5 * s).fillCircle(x + 14 * s, y, 4.5 * s);
  g.fillStyle(0xffffff, 1).fillCircle(x - 12.5 * s, y - 1.5 * s, 1.6 * s).fillCircle(x + 15.5 * s, y - 1.5 * s, 1.6 * s);
  g.lineStyle(3 * s, INKC, 1);
  g.beginPath(); g.arc(x, y + 5 * s, 6 * s, 0.2, Math.PI - 0.2); g.strokePath();
  g.fillStyle(CHEEK, 0.85).fillEllipse(x - 24 * s, y + 9 * s, 12 * s, 7 * s).fillEllipse(x + 24 * s, y + 9 * s, 12 * s, 7 * s);
}

// 배낭: 주황 몸통 + 덮개 + 앞주머니 + 손잡이
function drawBackpack(g) {
  g.fillStyle(0x000000, 0.16).fillEllipse(6, 84, 140, 22);
  g.lineStyle(9, INKC, 1); g.beginPath(); g.arc(0, -66, 26, Math.PI, 0); g.strokePath();         // 손잡이
  g.lineStyle(5, 0xc56b2c, 1); g.beginPath(); g.arc(0, -66, 26, Math.PI, 0); g.strokePath();
  g.fillStyle(INKC, 1).fillRoundedRect(-66, -70, 132, 156, 38);
  g.fillStyle(0xf0a04b, 1).fillRoundedRect(-60, -64, 120, 144, 33);
  g.fillStyle(0xffffff, 0.3).fillRoundedRect(-50, -56, 30, 70, 14);                                 // 반짝
  g.fillStyle(INKC, 1).fillRoundedRect(-62, -66, 124, 52, { tl: 34, tr: 34, bl: 18, br: 18 });      // 덮개
  g.fillStyle(0xd9792e, 1).fillRoundedRect(-56, -60, 112, 42, { tl: 30, tr: 30, bl: 14, br: 14 });
  g.fillStyle(0xffd84a, 1).fillRoundedRect(-9, -24, 18, 20, 5);                                     // 버클
  g.lineStyle(3, INKC, 1).strokeRoundedRect(-9, -24, 18, 20, 5);
  g.fillStyle(INKC, 1).fillRoundedRect(-42, 26, 84, 50, 18);                                        // 앞주머니
  g.fillStyle(0xffc27a, 1).fillRoundedRect(-37, 31, 74, 40, 14);
  face(g, 0, 8, 0.85);
}

// 물병: 하늘색 병 + 물결 + 분홍 뚜껑 + 끈
function drawBottle(g) {
  g.fillStyle(0x000000, 0.16).fillEllipse(4, 86, 96, 18);
  g.lineStyle(6, INKC, 1); g.beginPath(); g.arc(-34, -40, 30, Math.PI * 0.6, Math.PI * 1.45); g.strokePath(); // 끈
  g.fillStyle(INKC, 1).fillRoundedRect(-44, -54, 88, 140, 34);
  g.fillStyle(0xe8f6ff, 1).fillRoundedRect(-38, -48, 76, 128, 29);
  g.fillStyle(0x7ec8ff, 1).fillRoundedRect(-38, 0, 76, 80, { tl: 6, tr: 6, bl: 29, br: 29 });       // 물
  g.fillStyle(0xbfe6ff, 1).fillEllipse(-14, 2, 30, 8).fillEllipse(16, 2, 26, 8);
  g.fillStyle(0xffffff, 0.6).fillRoundedRect(-28, -38, 12, 60, 6);
  g.fillStyle(INKC, 1).fillRoundedRect(-30, -86, 60, 40, 14);                                       // 뚜껑
  g.fillStyle(0xff9fb8, 1).fillRoundedRect(-25, -81, 50, 30, 11);
  g.fillStyle(0xffffff, 0.45).fillRoundedRect(-19, -77, 16, 8, 4);
  face(g, 0, 34, 0.7);
}

// 나침반: 금빛 테두리 + 크림 판 + 빨강·남색 바늘 + 위 고리
function drawCompass(g) {
  g.fillStyle(0x000000, 0.16).fillEllipse(6, 80, 130, 20);
  g.lineStyle(7, INKC, 1).strokeCircle(0, -80, 13);
  g.lineStyle(4, 0xe0a93a, 1).strokeCircle(0, -80, 13);
  g.fillStyle(INKC, 1).fillCircle(0, 0, 74);
  g.fillStyle(0xe0a93a, 1).fillCircle(0, 0, 68);
  g.fillStyle(0xffd84a, 1).fillCircle(-6, -6, 60);
  g.fillStyle(INKC, 1).fillCircle(0, 0, 54);
  g.fillStyle(0xfffaf0, 1).fillCircle(0, 0, 49);
  g.fillStyle(INKC, 0.35);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.fillCircle(Math.cos(a) * 40, Math.sin(a) * 40, k % 2 ? 2.5 : 4); }
  g.fillStyle(0xe8584a, 1).fillTriangle(0, -38, -11, 0, 11, 0);
  g.fillStyle(INKC, 1).fillTriangle(0, 38, -11, 0, 11, 0);
  g.fillStyle(0xffd84a, 1).fillCircle(0, 0, 7);
  g.lineStyle(3, INKC, 1).strokeCircle(0, 0, 7);
  g.fillStyle(CHEEK, 0.8).fillEllipse(-30, 18, 12, 7).fillEllipse(30, 18, 12, 7);
}

// 여행 가방(캐리어): 민트 몸통 + 손잡이 + 줄무늬 + 바퀴
function drawSuitcase(g) {
  g.fillStyle(0x000000, 0.16).fillEllipse(4, 90, 130, 20);
  g.lineStyle(8, INKC, 1).strokeRoundedRect(-22, -96, 44, 34, 12);
  g.fillStyle(INKC, 1).fillRoundedRect(-62, -70, 124, 154, 26).fillCircle(-38, 86, 11).fillCircle(38, 86, 11);
  g.fillStyle(0x9edcc8, 1).fillRoundedRect(-56, -64, 112, 142, 21);
  g.fillStyle(0xffffff, 0.3).fillRoundedRect(-48, -56, 20, 80, 10);
  g.fillStyle(0x6cbfa7, 1).fillRect(-56, -26, 112, 12).fillRect(-56, 40, 112, 12);
  g.fillStyle(0xffd84a, 1).fillCircle(-38, 86, 5).fillCircle(38, 86, 5);
  face(g, 0, 10, 0.85);
}

// 카메라: 노란 몸통 + 큰 렌즈 + 셔터
function drawCamera(g) {
  g.fillStyle(0x000000, 0.16).fillEllipse(4, 62, 150, 20);
  g.fillStyle(INKC, 1).fillRoundedRect(-44, -66, 40, 26, 8).fillRoundedRect(-74, -48, 148, 100, 24);
  g.fillStyle(0xffd27a, 1).fillRoundedRect(-68, -42, 136, 88, 19).fillRoundedRect(-39, -61, 30, 18, 5);
  g.fillStyle(0xe8584a, 1).fillCircle(48, -30, 8);
  g.fillStyle(INKC, 1).fillCircle(0, 4, 40);
  g.fillStyle(0x7ec8ff, 1).fillCircle(0, 4, 32);
  g.fillStyle(0x2f7bff, 1).fillCircle(0, 4, 20);
  g.fillStyle(0xffffff, 0.85).fillCircle(-9, -6, 8);
  g.fillStyle(CHEEK, 0.8).fillEllipse(-52, 26, 12, 7).fillEllipse(52, 26, 12, 7);
}

// 밀짚모자: 넓은 챙 + 둥근 머리 + 파란 리본
function drawHat(g) {
  g.fillStyle(0x000000, 0.14).fillEllipse(4, 40, 170, 30);
  g.fillStyle(INKC, 1).fillEllipse(0, 20, 178, 64);
  g.fillStyle(0xf3d38a, 1).fillEllipse(0, 18, 166, 52);
  g.fillStyle(INKC, 1).fillEllipse(0, -8, 104, 92);
  g.fillStyle(0xf6dd9c, 1).fillEllipse(0, -10, 92, 80);
  g.fillStyle(0x2f7bff, 1).fillRect(-46, 6, 92, 14);
  g.fillStyle(0xffffff, 0.35).fillEllipse(-18, -26, 34, 16);
  g.fillStyle(0xff9fb8, 1).fillCircle(30, 12, 9);
}

// 여권: 남색 수첩 + 금빛 지구 무늬 (글자 없이)
function drawPassport(g) {
  g.fillStyle(0x000000, 0.16).fillEllipse(6, 72, 110, 18);
  g.fillStyle(INKC, 1).fillRoundedRect(-50, -70, 100, 140, 14);
  g.fillStyle(0x3d4f9f, 1).fillRoundedRect(-44, -64, 88, 128, 10);
  g.fillStyle(0xfffaf0, 1).fillRect(36, -60, 6, 120);
  g.lineStyle(4, 0xffd84a, 1).strokeCircle(-4, -8, 22);
  g.lineStyle(3, 0xffd84a, 1).lineBetween(-26, -8, 18, -8).lineBetween(-4, -30, -4, 14);
  g.beginPath(); g.arc(-4, -8, 22, -Math.PI / 2, Math.PI / 2); g.strokePath();
  g.fillStyle(0xffd84a, 1).fillRoundedRect(-26, 32, 44, 6, 3).fillRoundedRect(-20, 44, 32, 5, 3);
}

// 비행기표: 크림 표 + 양쪽 홈 + 작은 비행기 + 점선
function drawTicket(g) {
  g.fillStyle(0x000000, 0.14).fillEllipse(4, 46, 160, 18);
  g.fillStyle(INKC, 1).fillRoundedRect(-80, -42, 160, 84, 14);
  g.fillStyle(0xfffaf0, 1).fillRoundedRect(-74, -36, 148, 72, 10);
  g.fillStyle(0xff9fb8, 1).fillRoundedRect(-74, -36, 148, 18, { tl: 10, tr: 10, bl: 0, br: 0 });
  g.fillStyle(0xdcebe2, 1).fillCircle(-80, 6, 10).fillCircle(80, 6, 10);
  g.fillStyle(INKC, 0.5);
  for (let y = -12; y < 32; y += 9) g.fillRect(30, y, 3, 5);
  g.fillStyle(0x2f7bff, 1).fillEllipse(-22, 6, 54, 12).fillTriangle(-30, 6, -8, 6, -18, -14).fillTriangle(-30, 6, -8, 6, -18, 26).fillTriangle(-50, 6, -40, 6, -50, -6);
  g.fillStyle(INKC, 0.35).fillRoundedRect(42, -6, 22, 6, 3).fillRoundedRect(42, 6, 16, 6, 3);
}

