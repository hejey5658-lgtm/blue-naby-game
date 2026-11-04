// 미로 생동감 (design-brief 8절): 바깥 풍경 · 바닥 질감 · 벽 소품 · 움직임.
// 세 층 원칙: 바깥은 자유롭게, 벽은 나라 소품, 바닥(길)은 은은하게 — 길·벽 구분은 그대로 또렷해야 한다.
// 움직이지 않는 것은 MazeScene이 한 장의 그림으로 구워 매 프레임 다시 그리지 않는다.
// 캔버스·WebGL 둘 다 같게 보이도록 그라데이션 대신 반투명 도형을 겹친다.
// 수집품과 비슷한 모양·색(잎·꽃잎, 체크포인트 분홍 방석)은 판 위 소품·움직임에 쓰지 않는다.
// 장별 색·개수는 src/data/mazeLooks.js 의 scenery.
import { UI } from '../data/ui.js';
import { platform } from '../platform.js';
import { KINDS2 } from './scenery2.js';

// 칸마다 늘 같은 값이 나오는 작은 난수 (소품 자리가 매번 같게)
const hash = (x, y, k = 0) => {
  let h = (x * 73856093) ^ (y * 19349663) ^ (k * 83492791);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const board = (s) => ({ cell: s.cell, ox: s.ox, oy: s.oy, W: s.cols * s.cell, H: s.rows * s.cell, bottom: s.oy + s.rows * s.cell, right: s.ox + s.cols * s.cell });
const isEdge = (s, x, y) => x === 0 || y === 0 || x === s.cols - 1 || y === s.rows - 1;
const still = () => platform.reducedMotion;

// 판 안만 보이게 자르는 마스크 (햇살·안개·구름 그림자가 바깥 풍경 위로 넘치지 않게)
function boardMask(scene) {
  const { ox, oy, W, H } = board(scene);
  const m = scene.make.graphics({}, false).fillStyle(0xffffff).fillRect(ox, oy, W, H);
  scene.events.once('shutdown', () => m.destroy());
  return m.createGeometryMask();
}

// 벽 한 칸의 기본 덩어리: 앞면(아래가 길이면 둥근 아래) + 윗면. 윗면 높이를 돌려준다.
function block(g, scene, px, py, front, colors) {
  const { cell } = scene;
  const r = cell * 0.18;
  const topH = front ? cell * 0.72 : cell;
  g.fillStyle(colors.front, 1).fillRoundedRect(px, py, cell, cell, front ? { tl: 0, tr: 0, bl: r, br: r } : 0);
  g.fillStyle(colors.main, 1).fillRect(px, py, cell, topH);
  return topH;
}

// 구름 하나 (둥근 덩어리 세 개)
function cloud(g, x, y, s, a = 0.9) {
  g.fillStyle(0xffffff, a).fillEllipse(x, y, 60 * s, 26 * s).fillEllipse(x - 22 * s, y + 4 * s, 40 * s, 20 * s).fillEllipse(x + 24 * s, y + 5 * s, 44 * s, 18 * s);
}

// 작은 다섯 잎 꽃 (판 위에서는 아주 작게만)
function flower(g, x, y, r, petal, heart = 0xffd84a) {
  g.fillStyle(petal, 1);
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; g.fillCircle(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8); }
  g.fillStyle(heart, 1).fillCircle(x, y, r * 0.55);
}

// 움직임 하나: 동작 줄이기면 건너뛴다
function tween(scene, cfg) { if (!still()) scene.tweens.add(cfg); }

// ═════ 한국 집 (한국 단계 위 구역) ═════════════════════════════════
const home = {
  // 작은 꽃무늬 벽지, 아래에 창 한 조각과 창턱 위 화분 (블루나비가 태어난 그 화분)
  backdrop(scene, g, sc) {
    const { width: W, height: H } = UI;
    g.fillStyle(sc.wallpaper, 1).fillRect(0, 0, W, H);
    for (let y = 24; y < H; y += 56) {
      for (let x = (y / 56) % 2 ? 52 : 24; x < W; x += 56) {
        g.fillStyle(sc.wallpaperDot, 1);
        for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; g.fillCircle(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3); }
        g.fillStyle(0xf3e3c3, 1).fillCircle(x, y, 2);
      }
    }
    const { bottom } = board(scene);
    const wx = W - 96, wy = bottom + 34, ww = 140, wh = H - wy - 46;
    g.fillStyle(0x8f6440, 1).fillRoundedRect(wx - 12, wy - 12, ww + 24, wh + 24, 14);
    g.fillStyle(0xbfe3ff, 1).fillRect(wx, wy, ww, wh);
    cloud(g, wx + 56, wy + wh * 0.36, 0.8, 0.8);
    g.fillStyle(0x8f6440, 1).fillRect(wx + 40, wy, 8, wh).fillRect(wx, wy + wh / 2 - 4, ww, 8);
    const sy = H - 46;
    g.fillStyle(sc.sill[1], 1).fillRect(0, sy + 10, W, 46);
    g.fillStyle(sc.sill[0], 1).fillRoundedRect(0, sy, W, 18, { tl: 0, tr: 0, bl: 6, br: 6 });
    g.fillStyle(0xffffff, 0.35).fillRect(0, sy + 2, W, 3);
    pot(g, W - 150, sy, 0.8);
    pot(g, W - 64, sy, 0.62);
  },
  // 마룻바닥: 반 칸 높이 판자, 줄마다 이음매가 어긋나게, 군데군데 옹이 + 러그
  floor(scene, g, sc) {
    const { cell, ox, oy, W, H } = board(scene);
    g.fillStyle(scene.look.floor, 1).fillRect(ox, oy, W, H);
    const ph = cell / 2, pl = cell * 3;
    for (let r = 0; r * ph < H; r++) {
      const y = oy + r * ph;
      if (r % 2) g.fillStyle(sc.plank, 0.4).fillRect(ox, y, W, ph);
      g.fillStyle(sc.knot, 0.45).fillRect(ox, y, W, 2);
      for (let x = ((r * 37) % 3) * cell - pl; x < W; x += pl) if (x > 0) g.fillRect(ox + x, y, 2, ph);
      for (let k = 0; k < scene.cols; k++) {
        if (hash(k, r, 1) > 0.9) g.fillStyle(sc.knot, 0.8).fillEllipse(ox + (k + hash(k, r, 2)) * cell, y + ph / 2, cell * 0.16, cell * 0.08);
      }
    }
    for (const rug of sc.rugs ?? []) {
      const x = ox + rug.x * cell + cell * 0.12, y = oy + rug.y * cell + cell * 0.12;
      const w = rug.w * cell - cell * 0.24, h = rug.h * cell - cell * 0.24;
      g.fillStyle(rug.color, 0.85).fillRoundedRect(x, y, w, h, cell * 0.3);
      g.lineStyle(3, rug.edge, 0.9).strokeRoundedRect(x + 8, y + 8, w - 16, h - 16, cell * 0.22);
      g.lineStyle(2, rug.edge, 0.9);
      for (let i = x + 12; i < x + w - 8; i += 10) { g.lineBetween(i, y - 6, i, y + 2); g.lineBetween(i, y + h - 2, i, y + h + 6); }
    }
  },
  // 서랍장·책장: 윗판(나뭇결) + 앞판(책등 또는 서랍), 윗판 위에 가끔 쿠션·책 더미
  wall(scene, g, x, y, px, py, front, sc) {
    const { cell, look } = scene;
    const topH = block(g, scene, px, py, front, { front: look.wallFront, main: look.wall });
    g.fillStyle(look.wallTop, 1).fillRect(px + 3, py + 3, cell - 6, cell * 0.12);
    g.fillStyle(0x8f6440, 0.18).fillRect(px + 6, py + topH * 0.45, cell - 12, 2).fillRect(px + 10, py + topH * 0.7, cell - 24, 2);
    if (front) {
      const fy = py + topH, fh = cell - topH;
      if (hash(x, y, 3) < 0.5) {
        let bx = px + 5;
        for (let i = 0; bx < px + cell - 8; i++) {
          const bw = 6 + Math.floor(hash(x, y, 10 + i) * 5);
          const bh = fh * (0.62 + hash(x, y, 20 + i) * 0.3);
          g.fillStyle(sc.books[Math.floor(hash(x, y, 30 + i) * sc.books.length)], 1).fillRect(bx, fy + fh - bh - 2, bw, bh);
          bx += bw + 2;
        }
      } else {
        g.fillStyle(0x7a5236, 1).fillRoundedRect(px + 6, fy + 3, cell - 12, fh - 7, 4);
        g.fillStyle(0xffd84a, 1).fillCircle(px + cell / 2, fy + fh / 2 - 1, 3.4);
      }
    }
    if (isEdge(scene, x, y)) return;
    const v = hash(x, y, 5);
    const cx = px + cell * 0.5, cy = py + topH * 0.52;
    if (v < 0.1) {
      const c = sc.cushion[Math.floor(hash(x, y, 6) * sc.cushion.length)];
      g.fillStyle(0x2b2d5a, 0.12).fillRoundedRect(cx - cell * 0.26, cy - cell * 0.12, cell * 0.52, cell * 0.32, 8);
      g.fillStyle(c, 1).fillRoundedRect(cx - cell * 0.27, cy - cell * 0.17, cell * 0.54, cell * 0.32, 9);
      g.fillStyle(0xffffff, 0.45).fillRoundedRect(cx - cell * 0.18, cy - cell * 0.12, cell * 0.2, cell * 0.06, 3);
    } else if (v < 0.17) {
      for (let i = 0; i < 2; i++) {
        g.fillStyle(sc.books[(Math.floor(hash(x, y, 7) * 5) + i * 2) % sc.books.length], 1)
          .fillRoundedRect(cx - cell * (0.24 - i * 0.04), cy - cell * (0.02 + i * 0.12), cell * (0.48 - i * 0.08), cell * 0.12, 3);
      }
    }
  },
  // 오른쪽 위 창에서 비스듬히 드는 햇살 띠 + 그 안을 떠다니는 먼지 반짝이
  ambient(scene, sc) {
    const { ox, oy, W, H } = board(scene);
    const g = scene.add.graphics().setAlpha(sc.beam.alpha[1]);
    const band = (x0, w, a) => {
      const dx = H * 0.55;
      g.fillStyle(sc.beam.color, a).fillPoints([
        { x: ox + x0, y: oy }, { x: ox + x0 + w, y: oy }, { x: ox + x0 + w - dx, y: oy + H }, { x: ox + x0 - dx, y: oy + H },
      ], true);
    };
    for (const [x0, w] of [[W * 0.62, W * 0.34], [W * 0.88, W * 0.14]]) {
      band(x0 - 14, w + 28, 0.06);
      band(x0, w, 0.08);
      band(x0 + 12, w - 24, 0.07);
    }
    g.setMask(boardMask(scene));
    tween(scene, { targets: g, alpha: sc.beam.alpha[0], duration: sc.beam.periodMs, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    for (let i = 0; i < sc.motes; i++) {
      const t = (i + 0.5) / sc.motes;
      const y = oy + H * t;
      const x = ox + W * (0.62 + hash(i, 1, 9) * 0.3) - H * 0.55 * t;
      const m = scene.add.circle(x, y, 2 + hash(i, 2, 9) * 2.2, 0xffffff, 0.75);
      tween(scene, {
        targets: m, x: x + (hash(i, 3, 9) - 0.5) * 40, y: y - 20 - hash(i, 4, 9) * 30, alpha: 0.2,
        duration: 3200 + hash(i, 5, 9) * 2800, delay: hash(i, 6, 9) * 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
  },
};

function pot(g, x, baseY, s) {
  g.fillStyle(0x2b2d5a, 0.12).fillEllipse(x, baseY + 2, 70 * s, 12 * s);
  g.fillStyle(0xc96a4a, 1).fillTriangle(x - 30 * s, baseY - 50 * s, x + 30 * s, baseY - 50 * s, x, baseY + 6 * s);
  g.fillStyle(0xc96a4a, 1).fillRect(x - 22 * s, baseY - 50 * s, 44 * s, 50 * s);
  g.fillStyle(0xe0895f, 1).fillRoundedRect(x - 34 * s, baseY - 62 * s, 68 * s, 16 * s, 6 * s);
  g.fillStyle(0xffffff, 0.3).fillRect(x - 18 * s, baseY - 44 * s, 6 * s, 30 * s);
  g.fillStyle(0x4f9f4c, 1).fillRect(x - 2 * s, baseY - 92 * s, 4 * s, 32 * s);
  g.fillStyle(0x6cc35a, 1).fillEllipse(x - 14 * s, baseY - 94 * s, 26 * s, 14 * s).fillEllipse(x + 14 * s, baseY - 98 * s, 26 * s, 14 * s);
}

// ═════ 한국 밤 골목 (가운데 구역) ═════════════════════════════════
// 판은 대부분 어둠에 가려지므로, 창문 불빛·밤하늘은 어둠 위(깊이 7.5)에 따로 놓는다.
const hasWindow = (s, x, y) => !isEdge(s, x, y) && hash(x, y, 40) < 0.32;
const alley = {
  backdrop(scene, g) { g.fillStyle(0x23254d, 1).fillRect(0, 0, UI.width, UI.height); },
  // 보도블록: 1/3칸 높이 벽돌을 어긋나게
  floor(scene, g, sc) {
    const { cell, ox, oy, W, H } = board(scene);
    g.fillStyle(scene.look.floor, 1).fillRect(ox, oy, W, H);
    const bh = cell / 3, bw = cell * 0.66;
    g.fillStyle(sc.seam, 0.9);
    for (let r = 0; r * bh < H; r++) {
      g.fillRect(ox, oy + r * bh, W, 2);
      for (let x = (r % 2) * (bw / 2); x < W; x += bw) g.fillRect(ox + x, oy + r * bh, 2, bh);
    }
  },
  // 벽돌 담장: 줄눈 + 위 갓돌, 군데군데 창틀 (불빛은 ambient)
  wall(scene, g, x, y, px, py, front, sc) {
    const { cell, look } = scene;
    const topH = block(g, scene, px, py, front, { front: look.wallFront, main: look.wall });
    g.fillStyle(sc.mortar, 0.55);
    for (let r = 1; r < 3; r++) g.fillRect(px, py + (topH * r) / 3, cell, 2);
    for (let r = 0; r < 3; r++) for (let k = (r % 2) * 0.5; k < 1; k += 0.5) g.fillRect(px + cell * k + cell * 0.25, py + (topH * r) / 3, 2, topH / 3);
    g.fillStyle(sc.cap, 1).fillRect(px, py, cell, cell * 0.1);
    if (hasWindow(scene, x, y)) {
      const w = cell * 0.46, h = cell * 0.36;
      g.fillStyle(sc.frame, 1).fillRoundedRect(px + (cell - w) / 2, py + topH * 0.5 - h / 2, w, h, 4);
    }
  },
  ambient(scene, sc) {
    const { cell, ox, oy, W, H, bottom } = board(scene);
    // 창문 불빛 (어둠 위): 몇 개는 천천히 꺼졌다 켜진다
    let n = 0;
    for (let y = 0; y < scene.rows && n < sc.windows; y++) {
      for (let x = 0; x < scene.cols && n < sc.windows; x++) {
        if (scene.tile(x, y) !== '#' || !hasWindow(scene, x, y)) continue;
        const front = scene.tile(x, y + 1) !== '#';
        const topH = front ? cell * 0.72 : cell;
        const cx = ox + x * cell + cell / 2, cy = oy + y * cell + topH * 0.5;
        const lit = scene.add.rectangle(cx, cy, cell * 0.38, cell * 0.28, sc.light, 0.85).setDepth(7.5);
        scene.add.rectangle(cx, cy, 2, cell * 0.28, sc.frame, 1).setDepth(7.5);
        if (n < sc.blinking) {
          tween(scene, { targets: lit, alpha: 0.08, duration: 1600, hold: 2400 + hash(x, y, 41) * 3000, delay: 2000 + hash(x, y, 42) * 6000, repeatDelay: 3000 + hash(x, y, 43) * 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        n++;
      }
    }
    // 반딧불이 (어둠 아래 — 블루나비 둘레 빛 안에서만 보인다)
    for (let i = 0; i < sc.fireflies; i++) {
      const x = ox + hash(i, 1, 46) * W, y = oy + hash(i, 2, 46) * H;
      const f = scene.add.circle(x, y, 3.2, 0xd8f58a, 0.9);
      tween(scene, { targets: f, x: x + (hash(i, 3, 46) - 0.5) * cell * 3, y: y + (hash(i, 4, 46) - 0.5) * cell * 3, alpha: 0.3, duration: 4000 + hash(i, 5, 46) * 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if (sc.sky === false) return; // 한국 단계의 골목 구역: 판 바깥 밤하늘 없음
    // 밤하늘 (판 바깥만, 어둠 위): 별·달
    const sky = scene.add.graphics().setDepth(7.5);
    const outer = [[0, 108, UI.width, oy - 108], [0, bottom, UI.width, UI.height - bottom]];
    for (let i = 0; i < sc.stars; i++) {
      const [rx, ry, rw, rh] = outer[i % 2];
      if (rh < 12) continue;
      sky.fillStyle(0xffffff, 0.55 + hash(i, 2, 44) * 0.4).fillCircle(rx + hash(i, 0, 44) * rw, ry + 6 + hash(i, 1, 44) * (rh - 12), 1.2 + hash(i, 3, 44) * 1.4);
    }
    const my = (108 + oy) / 2;
    sky.fillStyle(0xfff3c4, 0.15).fillCircle(UI.width - 70, my, 30);
    sky.fillStyle(0xfff3c4, 1).fillCircle(UI.width - 70, my, 20);
    sky.fillStyle(0xe8dca8, 1).fillCircle(UI.width - 76, my - 5, 4).fillCircle(UI.width - 63, my + 6, 3);
    for (let i = 0; i < sc.twinkle; i++) {
      const [rx, ry, rw, rh] = outer[i % 2];
      const s = scene.add.circle(rx + hash(i, 5, 45) * rw, ry + 8 + hash(i, 6, 45) * Math.max(1, rh - 16), 2.6, 0xffffff, 0.9).setDepth(7.5);
      tween(scene, { targets: s, alpha: 0.2, duration: 1800 + hash(i, 7, 45) * 1500, yoyo: true, repeat: -1, delay: hash(i, 8, 45) * 2000, ease: 'Sine.easeInOut' });
    }
  },
};

// ═════ 한국 아침 시장 (아래 구역) ═════════════════════════════════
const steamer = (s, x, y) => !isEdge(s, x, y) && hash(x, y, 50) < 0.08;
const market = {
  // 아래: 줄무늬 차양 지붕이 이어진 시장 골목, 그 위로 줄 깃발이 걸린 줄
  backdrop(scene, g, sc) {
    const { width: W, height: H } = UI;
    g.fillStyle(0xf6c48f, 1).fillRect(0, 0, W, H);
    const top = H - 74;
    for (let x = 0, i = 0; x < W; x += 48, i++) {
      g.fillStyle(sc.awning[i % 2], 1).fillRect(x, top, 48, 52);
      g.fillCircle(x + 24, top + 52, 24);
    }
    g.fillStyle(0x7a4532, 1).fillRect(0, top - 8, W, 10);
    const { bottom } = board(scene);
    g.lineStyle(3, 0x7a4532, 0.9);
    const y0 = bottom + 30;
    let prev = null;
    for (let x = 0; x <= W; x += 24) {
      const p = { x, y: y0 + Math.sin((x / W) * Math.PI) * 18 };
      if (prev) g.lineBetween(prev.x, prev.y, p.x, p.y);
      prev = p;
    }
  },
  // 돌바닥: 반 칸 높이 돌을 어긋나게 깔고 줄눈을 남긴다
  floor(scene, g, sc) {
    const { cell, ox, oy, W, H } = board(scene);
    g.fillStyle(sc.seam, 1).fillRect(ox, oy, W, H);
    const bh = cell / 2, bw = cell * 0.75;
    for (let r = 0; r * bh < H; r++) {
      for (let x = -((r % 2) * bw) / 2, k = 0; x < W; x += bw, k++) {
        const x0 = Math.max(0, x), x1 = Math.min(W, x + bw);
        g.fillStyle(hash(k, r, 51) < 0.5 ? scene.look.floor : scene.look.floor2, 1).fillRoundedRect(ox + x0 + 1.5, oy + r * bh + 1.5, x1 - x0 - 3, bh - 3, 5);
      }
    }
  },
  // 가판대: 나무 상자에 과일, 몇 곳은 김 나는 찜통, 앞면은 줄무늬 차양
  wall(scene, g, x, y, px, py, front, sc) {
    const { cell, look } = scene;
    const topH = block(g, scene, px, py, front, { front: look.wallFront, main: look.wall });
    g.fillStyle(sc.crate, 1).fillRoundedRect(px + 4, py + 4, cell - 8, topH - 8, 6);
    g.fillStyle(0x7a4532, 0.35).fillRect(px + 6, py + topH * 0.5, cell - 12, 2);
    if (steamer(scene, x, y)) {
      g.fillStyle(0xe0c08a, 1).fillCircle(px + cell / 2, py + topH / 2, cell * 0.3);
      g.lineStyle(2, 0xa8673c, 0.8).strokeCircle(px + cell / 2, py + topH / 2, cell * 0.22);
    } else if (hash(x, y, 52) < 0.38) {
      const k = 3 + Math.floor(hash(x, y, 53) * 3);
      for (let i = 0; i < k; i++) {
        const fx = px + cell * (0.25 + (i % 3) * 0.25), fy = py + topH * (i < 3 ? 0.62 : 0.36);
        g.fillStyle(sc.fruit[Math.floor(hash(x, y, 54 + i) * sc.fruit.length)], 1).fillCircle(fx, fy, cell * 0.11);
        g.fillStyle(0xffffff, 0.5).fillCircle(fx - cell * 0.035, fy - cell * 0.035, cell * 0.03);
      }
    }
    if (front) {
      const fy = py + topH, fh = cell - topH;
      for (let i = 0; i < 4; i++) g.fillStyle(sc.awning[i % 2], 1).fillRect(px + (cell / 4) * i, fy, cell / 4, fh * 0.7);
      for (let i = 0; i < 4; i++) g.fillStyle(sc.awning[i % 2], 1).fillCircle(px + (cell / 4) * (i + 0.5), fy + fh * 0.7, cell / 8);
    }
  },
  ambient(scene, sc) {
    const { cell, ox, oy, bottom } = board(scene);
    const W = UI.width;
    // 줄 깃발: 줄에 매달려 살랑
    for (let i = 0; i < sc.flagCount; i++) {
      const x = (W / sc.flagCount) * (i + 0.5);
      const y = bottom + 30 + Math.sin((x / W) * Math.PI) * 18;
      const f = scene.add.triangle(x, y + 2, -13, 0, 13, 0, 0, 26, sc.flags[i % sc.flags.length]).setOrigin(0.5, 0);
      f.setAngle(-4);
      tween(scene, { targets: f, angle: 5, duration: 1300 + hash(i, 1, 55) * 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: hash(i, 2, 55) * 800 });
    }
    // 찜통 김
    let n = 0;
    for (let y = 0; y < scene.rows && n < sc.steam; y++) {
      for (let x = 0; x < scene.cols && n < sc.steam; x++) {
        if (scene.tile(x, y) !== '#' || !steamer(scene, x, y)) continue;
        const topH = scene.tile(x, y + 1) !== '#' ? cell * 0.72 : cell;
        for (let k = 0; k < 2 && n < sc.steam; k++, n++) {
          const sx = ox + x * cell + cell * (0.4 + k * 0.2), sy = oy + y * cell + topH * 0.4;
          const p = scene.add.circle(sx, sy, cell * 0.12, 0xffffff, 0.55);
          tween(scene, { targets: p, y: sy - cell * 0.9, alpha: 0, scale: 1.8, duration: 2400, delay: k * 1200, repeat: -1, ease: 'Sine.easeOut' });
        }
      }
    }
  },
};

// ═════ 4장 중국 대나무 숲 ═════════════════════════════
const bamboo = {
  // 아래: 먼 산 능선 위 만리장성, 가까운 언덕
  backdrop(scene, g, sc) {
    const { width: W, height: H } = UI;
    g.fillStyle(0xcfe8b8, 1).fillRect(0, 0, W, H);
    const { bottom } = board(scene);
    const ridge = (x) => bottom + 60 + Math.sin(x / 90) * 22 + Math.sin(x / 37) * 8;
    const pts = [{ x: 0, y: H }];
    for (let x = 0; x <= W; x += 12) pts.push({ x, y: ridge(x) });
    pts.push({ x: W, y: H });
    g.fillStyle(sc.hills[0], 1).fillPoints(pts, true);
    // 능선을 따라 이어진 성벽 + 망루 둘
    for (let x = 0; x <= W; x += 12) {
      const y = ridge(x);
      g.fillStyle(sc.wallColor, 1).fillRect(x, y - 10, 13, 10);
      if ((x / 12) % 2 === 0) g.fillRect(x + 2, y - 15, 6, 5);
    }
    for (const tx of [180, 520]) {
      const y = ridge(tx);
      g.fillStyle(sc.wallColor, 1).fillRect(tx - 14, y - 34, 28, 34);
      g.fillStyle(0x8a3b2e, 1).fillTriangle(tx - 20, y - 34, tx + 20, y - 34, tx, y - 50);
    }
    const near = [{ x: 0, y: H }];
    for (let x = 0; x <= W; x += 12) near.push({ x, y: H - 60 + Math.sin(x / 120 + 1) * 16 });
    near.push({ x: W, y: H });
    g.fillStyle(sc.hills[1], 1).fillPoints(near, true);
  },
  // 이끼 낀 돌길: 칸마다 둥근 디딤돌 + 이끼 점
  floor(scene, g, sc) {
    const { cell, ox, oy, W, H } = board(scene);
    g.fillStyle(scene.look.floor, 1).fillRect(ox, oy, W, H);
    for (let y = 0; y < scene.rows; y++) {
      for (let x = 0; x < scene.cols; x++) {
        if (scene.tile(x, y) === '#') continue;
        const cx = ox + (x + 0.5 + (hash(x, y, 60) - 0.5) * 0.12) * cell, cy = oy + (y + 0.5 + (hash(x, y, 61) - 0.5) * 0.12) * cell;
        g.fillStyle(sc.stone, 1).fillEllipse(cx, cy, cell * 0.66, cell * 0.52);
        g.fillStyle(sc.moss, 1).fillCircle(cx + cell * 0.2, cy + cell * 0.1, cell * 0.05).fillCircle(cx - cell * 0.18, cy - cell * 0.12, cell * 0.035);
      }
    }
  },
  // 대나무 줄기: 칸마다 세 줄기, 마디, 가는 잎줄기(수집품 잎 모양은 피함)
  wall(scene, g, x, y, px, py, front, sc) {
    const { cell, look } = scene;
    const topH = block(g, scene, px, py, front, { front: look.wallFront, main: look.wallFront });
    for (let i = 0; i < 3; i++) {
      const sx = px + cell * (0.12 + i * 0.32) + (hash(x, y, 62 + i) - 0.5) * cell * 0.08;
      const sw = cell * 0.17;
      g.fillStyle(sc.stalks[Math.floor(hash(x, y, 65 + i) * sc.stalks.length)], 1).fillRoundedRect(sx, py, sw, topH, sw / 2);
      g.fillStyle(0xffffff, 0.25).fillRect(sx + sw * 0.2, py, sw * 0.18, topH);
      g.fillStyle(sc.node, 0.9);
      for (let k = 0.3 + hash(x, y, 68 + i) * 0.1; k < 1; k += 0.38) g.fillRect(sx - 1, py + topH * k, sw + 2, 2.5);
    }
    if (hash(x, y, 70) < 0.35) {
      g.lineStyle(2, 0xa8d98a, 0.9);
      const lx = px + cell * 0.5, ly = py + topH * 0.4;
      g.lineBetween(lx, ly, lx + cell * 0.22, ly - cell * 0.12);
      g.lineBetween(lx, ly + 4, lx - cell * 0.2, ly - cell * 0.06);
    }
  },
  ambient(scene, sc) {
    const { cell, ox, oy, W, H } = board(scene);
    // 흐르는 안개 띠 (판 안, 수집품보다 아래)
    const mask = boardMask(scene);
    for (let i = 0; i < sc.fog; i++) {
      const w = 320 + hash(i, 1, 71) * 160, y = oy + H * (0.2 + i * 0.3);
      const f = scene.add.ellipse(ox - 40 + hash(i, 2, 71) * W, y, w, cell * 1.1, 0xffffff, 0.16).setMask(mask);
      tween(scene, { targets: f, x: f.x + (i % 2 ? -1 : 1) * W * 0.5, duration: 16000 + hash(i, 3, 71) * 8000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // 판 아래 양쪽 끝에서 살짝 흔들리는 대나무
    const xs = [16, 44, UI.width - 44, UI.width - 16].slice(0, sc.sway);
    xs.forEach((x, i) => {
      const h = 150 + hash(i, 1, 72) * 60;
      const c = scene.add.container(x, UI.height);
      const s = scene.add.graphics();
      s.fillStyle(sc.stalks[i % sc.stalks.length], 1).fillRoundedRect(-6, -h, 12, h, 6);
      s.fillStyle(sc.node, 1);
      for (let k = 40; k < h; k += 44) s.fillRect(-7, -k, 14, 2.5);
      s.lineStyle(2, 0x4f9f4c, 1).lineBetween(0, -h + 20, (i < 2 ? 1 : -1) * 26, -h + 4).lineBetween(0, -h + 34, (i < 2 ? 1 : -1) * 22, -h + 24);
      c.add(s);
      tween(scene, { targets: c, angle: (i % 2 ? 1 : -1) * 2.5, duration: 2400 + hash(i, 2, 72) * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
  },
};

// ═════ 5장 일본 벚꽃 정원 ═════════════════════════════
const POND = { x: UI.width / 2, y: UI.height - 70, w: 760, h: 230 };
const garden = {
  // 위: 벚꽃 가지 / 아래: 연잎이 뜬 연못
  backdrop(scene, g, sc) {
    const { width: W, height: H } = UI;
    g.fillStyle(0xfbe0e6, 1).fillRect(0, 0, W, H);
    const { oy } = board(scene);
    const branch = (pts, w) => { g.lineStyle(w, sc.branch, 1); for (let i = 1; i < pts.length; i++) g.lineBetween(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]); };
    const ty = (108 + oy) / 2;
    branch([[-10, ty + 26], [90, ty + 8], [200, ty + 14], [300, ty - 6]], 9);
    branch([[200, ty + 14], [250, ty + 34]], 5);
    branch([[W + 10, ty + 20], [W - 110, ty + 2], [W - 210, ty + 10]], 8);
    for (let i = 0; i < 16; i++) {
      const left = i < 10;
      const bx = left ? 20 + hash(i, 1, 80) * 280 : W - 220 + hash(i, 1, 80) * 210;
      flower(g, bx, ty - 10 + hash(i, 2, 80) * 34, 6 + hash(i, 3, 80) * 3, sc.blossom[i % 2], 0xff9fb8);
    }
    g.fillStyle(0x6fa86a, 1).fillEllipse(POND.x, POND.y, POND.w + 30, POND.h + 26);
    g.fillStyle(sc.pond, 1).fillEllipse(POND.x, POND.y, POND.w, POND.h);
    g.fillStyle(0xffffff, 0.25).fillEllipse(POND.x - 120, POND.y - 40, 220, 26);
    for (const [px, py, r] of [[90, POND.y - 30, 26], [620, POND.y - 10, 30], [480, POND.y + 50, 22]]) {
      g.fillStyle(sc.pad, 1).fillCircle(px, py, r);
      g.fillStyle(sc.pond, 1).fillTriangle(px, py, px + r, py - r * 0.3, px + r, py + r * 0.3);
    }
  },
  // 자갈 정원: 가로로 고르게 그은 물결 결
  floor(scene, g, sc) {
    const { ox, oy, W, H } = board(scene);
    g.fillStyle(scene.look.floor, 1).fillRect(ox, oy, W, H);
    g.lineStyle(1.6, sc.rake, 1);
    for (let y = oy + 6; y < oy + H; y += 9) {
      let px = ox, py = y;
      for (let x = ox + 12; x <= ox + W; x += 12) { const ny = y + Math.sin(x / 26 + y / 40) * 1.6; g.lineBetween(px, py, x, ny); px = x; py = ny; }
    }
  },
  // 생울타리: 둥근 덤불 윗면 + 가끔 작은 흰·연분홍 꽃 (수집품 꽃잎보다 훨씬 작게)
  wall(scene, g, x, y, px, py, front, sc) {
    const { cell, look } = scene;
    const topH = block(g, scene, px, py, front, { front: look.wallFront, main: look.wall });
    g.fillStyle(look.wallTop, 1);
    for (let i = 0; i < 3; i++) g.fillCircle(px + cell * (0.2 + i * 0.3), py + cell * 0.14, cell * 0.16);
    g.fillStyle(0x4f7f4c, 0.25).fillCircle(px + cell * 0.35, py + topH * 0.6, cell * 0.1).fillCircle(px + cell * 0.72, py + topH * 0.45, cell * 0.08);
    if (hash(x, y, 81) < 0.3) flower(g, px + cell * (0.3 + hash(x, y, 82) * 0.4), py + topH * (0.35 + hash(x, y, 83) * 0.3), cell * 0.06, sc.blossom[Math.floor(hash(x, y, 84) * 2)]);
  },
  ambient(scene, sc) {
    const { oy, bottom } = board(scene);
    // 잉어: 연못 안을 천천히 한 바퀴
    for (let i = 0; i < sc.koiCount; i++) {
      const fish = scene.add.container(0, 0);
      const fg = scene.add.graphics();
      fg.fillStyle(sc.koi[i % 2], 1).fillEllipse(0, 0, 34, 14).fillTriangle(-16, 0, -28, -8, -28, 8);
      fg.fillStyle(i % 2 ? 0xf59a3b : 0xfffaf0, 1).fillCircle(4, -2, 4);
      fish.add(fg);
      const place = (t) => {
        const a = t * Math.PI * 2 + i * Math.PI;
        fish.setPosition(POND.x + Math.cos(a) * POND.w * 0.34, POND.y + Math.sin(a) * POND.h * 0.24);
        fish.setRotation(a + Math.PI / 2);
      };
      place(0);
      if (!still()) scene.tweens.addCounter({ from: 0, to: 1, duration: 22000 + i * 6000, repeat: -1, onUpdate: (tw) => place(tw.getValue()) });
    }
    // 물결
    for (let i = 0; i < sc.ripples; i++) {
      const r = scene.add.circle(POND.x - 150 + i * 260, POND.y + 10 - i * 30, 18).setStrokeStyle(2, 0xffffff, 0.7).setScale(0.3);
      tween(scene, { targets: r, scale: 1.6, alpha: 0, duration: 2600, delay: i * 1300, repeat: -1, repeatDelay: 1200, ease: 'Sine.easeOut' });
    }
    // 꽃잎: 판 바깥 여백(위 가지 아래, 연못 위)에서만 작게
    const zones = [[108, oy - 4], [bottom + 4, POND.y - 40]];
    for (let i = 0; i < sc.petals; i++) {
      const [y0, y1] = zones[i % 2];
      if (y1 - y0 < 20) continue;
      const x = 30 + hash(i, 1, 85) * (UI.width - 60);
      const p = scene.add.ellipse(x, y0, 7, 4.5, 0xffd0dc, 0.85);
      tween(scene, { targets: p, y: y1, x: x + 40, angle: 220, duration: 5200 + hash(i, 2, 85) * 2600, delay: hash(i, 3, 85) * 4000, repeat: -1, ease: 'Sine.easeInOut' });
    }
  },
};

// ═════ 6장 미국 센트럴파크 ═════════════════════════════
const park = {
  // 아래: 빌딩 숲 + 가로수 줄
  backdrop(scene, g, sc) {
    const { width: W, height: H } = UI;
    g.fillStyle(0xd9ecc8, 1).fillRect(0, 0, W, H);
    for (let x = -10, i = 0; x < W; i++) {
      const bw = 52 + hash(i, 1, 90) * 50, bh = 90 + hash(i, 2, 90) * 120;
      g.fillStyle(sc.city[i % 2], 1).fillRect(x, H - bh, bw, bh);
      g.fillStyle(sc.cityWindow, 0.8);
      for (let wy = H - bh + 12; wy < H - 50; wy += 18) for (let wx = x + 8; wx < x + bw - 10; wx += 14) g.fillRect(wx, wy, 6, 8);
      x += bw + 6;
    }
    for (let x = 10; x < W; x += 58) { g.fillStyle(0x5fb84f, 1).fillCircle(x, H - 30, 30); g.fillStyle(0x7cc56a, 1).fillCircle(x - 8, H - 38, 18); }
  },
  // 잔디: 은은한 풀 포기
  floor(scene, g, sc) {
    const { cell, ox, oy, W, H } = board(scene);
    g.fillStyle(scene.look.floor, 1).fillRect(ox, oy, W, H);
    g.lineStyle(2, sc.tuft, 1);
    for (let y = 0; y < scene.rows; y++) {
      for (let x = 0; x < scene.cols; x++) {
        for (let k = 0; k < 2; k++) {
          const tx = ox + (x + hash(x, y, 91 + k)) * cell, ty = oy + (y + hash(x, y, 93 + k)) * cell;
          g.lineBetween(tx, ty, tx - 3, ty - 6); g.lineBetween(tx, ty, tx + 3, ty - 6);
        }
      }
    }
  },
  // 벽돌 화단 위 덤불: 윗면은 둥근 덤불, 앞면은 벽돌
  wall(scene, g, x, y, px, py, front, sc) {
    const { cell, look } = scene;
    const topH = block(g, scene, px, py, front, { front: look.wallFront, main: sc.bush[1] });
    for (let i = 0; i < 3; i++) g.fillStyle(sc.bush[i % 3], 1).fillCircle(px + cell * (0.2 + i * 0.3), py + topH * (0.4 + (i % 2) * 0.2), cell * 0.24);
    g.fillStyle(0xffffff, 0.22).fillCircle(px + cell * 0.25, py + topH * 0.3, cell * 0.08);
    if (front) {
      const fy = py + topH, fh = cell - topH;
      g.fillStyle(sc.brick, 1).fillRect(px, fy, cell, fh - 3);
      g.fillStyle(sc.mortar, 0.8).fillRect(px, fy + fh / 2 - 1, cell, 2);
      for (let k = 0; k < 3; k++) g.fillRect(px + cell * (0.2 + k * 0.33), fy + (k % 2 ? fh / 2 : 0), 2, fh / 2);
    }
  },
  ambient(scene, sc) {
    const { ox, oy, W, H, bottom } = board(scene);
    // 판 위를 천천히 지나가는 구름 그림자
    const mask = boardMask(scene);
    for (let i = 0; i < sc.cloudShadows; i++) {
      const s = scene.add.ellipse(ox - 200 + i * W * 0.6, oy + H * (0.25 + i * 0.4), 340, 200, 0x2b2d5a, 0.06).setMask(mask);
      tween(scene, { targets: s, x: s.x + W * 0.9, y: s.y + 60, duration: 30000 + i * 9000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // 위 여백의 구름
    clouds(scene, sc.clouds, (108 + oy) / 2, oy - 108);
    // 비눗방울: 아래 공원에서 둥실
    for (let i = 0; i < sc.bubbles; i++) {
      const x = 60 + hash(i, 1, 95) * (UI.width - 120);
      const b = scene.add.circle(x, UI.height - 70, 7 + hash(i, 2, 95) * 6).setStrokeStyle(2, 0xffffff, 0.8);
      tween(scene, { targets: b, y: bottom + 16, x: x + (hash(i, 3, 95) - 0.5) * 60, alpha: 0, duration: 5200 + hash(i, 4, 95) * 2500, delay: i * 1100, repeat: -1, ease: 'Sine.easeOut' });
    }
  },
};

// 위 여백(상태 줄과 판 사이)을 천천히 오가는 구름
function clouds(scene, n, y, room) {
  if (room < 30) return;
  for (let i = 0; i < n; i++) {
    const g = scene.add.graphics();
    cloud(g, 0, 0, 0.7 + hash(i, 1, 96) * 0.3, 0.85);
    const x0 = 120 + i * 360;
    g.setPosition(x0, y + (i % 2 ? 4 : -4));
    tween(scene, { targets: g, x: x0 + 120, duration: 14000 + i * 5000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}

// ═════ 7장 캐나다 ═════════════════════════════════
const maple = {
  // 탁 트인 하늘 · 아래 단풍 산과 호수, 단풍 숲
  backdrop(scene, g, sc) {
    const { width: W, height: H } = UI;
    g.fillStyle(0xcfe7ff, 1).fillRect(0, 0, W, H);
    g.fillStyle(0xe2f0ff, 1).fillRect(0, 0, W, H * 0.45);
    const { bottom } = board(scene);
    const base = bottom + 90;
    for (let i = 0; i < 5; i++) {
      const cx = -40 + i * 190, ph = 70 + hash(i, 1, 100) * 60;
      g.fillStyle(sc.peaks[i % 2], 1).fillTriangle(cx - 140, base, cx + 140, base, cx, base - ph);
      g.fillStyle(0xfffaf0, 0.9).fillTriangle(cx - 22, base - ph + 22, cx + 22, base - ph + 22, cx, base - ph);
    }
    g.fillStyle(sc.lake, 1).fillRect(0, base, W, 44);
    g.fillStyle(0xffffff, 0.4).fillRect(40, base + 14, 160, 3).fillRect(420, base + 26, 200, 3);
    for (let x = 0, i = 0; x < W + 40; x += 46, i++) {
      g.fillStyle(sc.bush[i % 3], 1).fillCircle(x, H - 34, 34);
      g.fillStyle(sc.bush[(i + 1) % 3], 1).fillCircle(x + 18, H - 50, 22);
    }
  },
  // 작은 꽃이 핀 풀밭
  floor(scene, g, sc) {
    const { cell, ox, oy, W, H } = board(scene);
    g.fillStyle(scene.look.floor, 1).fillRect(ox, oy, W, H);
    g.lineStyle(2, sc.tuft, 1);
    for (let y = 0; y < scene.rows; y++) {
      for (let x = 0; x < scene.cols; x++) {
        const tx = ox + (x + hash(x, y, 101)) * cell, ty = oy + (y + hash(x, y, 102)) * cell;
        g.lineBetween(tx, ty, tx - 3, ty - 6); g.lineBetween(tx, ty, tx + 3, ty - 6);
        if (scene.tile(x, y) !== '#' && hash(x, y, 103) < 0.16) flower(g, ox + (x + 0.2 + hash(x, y, 104) * 0.6) * cell, oy + (y + 0.25 + hash(x, y, 105) * 0.5) * cell, 2.2, sc.flowers[Math.floor(hash(x, y, 106) * 2)], 0xf2a23a);
      }
    }
  },
  // 단풍 덤불, 가끔 통나무
  wall(scene, g, x, y, px, py, front, sc) {
    const { cell, look } = scene;
    const topH = block(g, scene, px, py, front, { front: look.wallFront, main: look.wall });
    if (front && hash(x, y, 107) < 0.14) {
      g.fillStyle(sc.log[0], 1).fillRoundedRect(px + 3, py + topH * 0.25, cell - 6, topH * 0.5, topH * 0.25);
      g.fillStyle(sc.log[1], 1).fillEllipse(px + cell - 8, py + topH * 0.5, topH * 0.3, topH * 0.46);
      g.lineStyle(1.5, sc.log[0], 0.8).strokeEllipse(px + cell - 8, py + topH * 0.5, topH * 0.16, topH * 0.26);
      return;
    }
    for (let i = 0; i < 4; i++) g.fillStyle(sc.bush[Math.floor(hash(x, y, 108 + i) * 3)], 1).fillCircle(px + cell * (0.18 + (i % 2) * 0.62 + hash(x, y, 112 + i) * 0.06), py + topH * (i < 2 ? 0.32 : 0.68), cell * 0.25);
    g.fillStyle(0xffffff, 0.2).fillCircle(px + cell * 0.25, py + topH * 0.25, cell * 0.07);
  },
  ambient(scene, sc) {
    const { oy } = board(scene);
    clouds(scene, sc.clouds, (108 + oy) / 2, oy - 108);
    // 단풍잎 그림을 색마다 한 번 만들어 두고 여러 장 떨어뜨린다 (캔버스 모드는 색 입히기(tint)가 안 돼서 색을 구워 둔다)
    sc.bush.forEach((color, k) => {
      const key = `maple_leaf_${k}`;
      if (scene.textures.exists(key)) return;
      const g = scene.make.graphics({}, false);
      const pts = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? 6 : 13; pts.push({ x: 14 + Math.cos(a) * r, y: 14 + Math.sin(a) * r }); }
      g.fillStyle(color, 1).fillPoints(pts, true).fillRect(13, 20, 2, 8);
      g.generateTexture(key, 28, 30);
      g.destroy();
    });
    for (let i = 0; i < sc.leaves; i++) {
      const x = 30 + hash(i, 1, 109) * (UI.width - 60);
      const leaf = scene.add.image(x, -30, `maple_leaf_${i % sc.bush.length}`).setAlpha(0.9).setScale(0.8 + hash(i, 2, 109) * 0.5);
      if (still()) { leaf.setPosition(x, 130 + hash(i, 3, 109) * 1000).setAngle(hash(i, 4, 109) * 360); continue; }
      scene.tweens.add({ targets: leaf, y: UI.height + 30, angle: 360 * (i % 2 ? 1 : -1), duration: 11000 + hash(i, 5, 109) * 5000, delay: i * 1500, repeat: -1 });
      scene.tweens.add({ targets: leaf, x: x + 50, duration: 2200 + hash(i, 6, 109) * 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  },
};

// ═════ 한국: 한 판을 구역으로 나눠 위 = 집, 가운데 = 밤 골목, 아래 = 아침 시장 (design-brief 11절) ═════
// 구역마다 그 줄만 가진 작은 판처럼 보이게(oy·rows·look·tile을 바꾼 대리 객체) 해서 기존 그림을 그대로 쓴다.
function zoneScene(scene, z) {
  const [from, to] = z.rows;
  const proxy = Object.create(scene);
  return Object.assign(proxy, { oy: scene.oy + from * scene.cell, rows: to - from + 1, look: z.look, tile: (x, y) => scene.tile(x, y + from), zoneFrom: from });
}
const zoneAt = (sc, y) => sc.zones.find((z) => y >= z.rows[0] && y <= z.rows[1]) ?? sc.zones[0];
const zones = {
  backdrop(scene, g, sc) { const z = sc.zones.find((q) => q.look.scenery.kind === sc.backdrop); KINDS[sc.backdrop].backdrop(zoneScene(scene, z), g, z.look.scenery); },
  floor(scene, g, sc) {
    for (const z of sc.zones) {
      const k = KINDS[z.look.scenery.kind];
      const zs = zoneScene(scene, z);
      if (k.floor) k.floor(zs, g, z.look.scenery);
      else { const b = board(zs); g.fillStyle(z.look.floor, 1).fillRect(b.ox, b.oy, b.W, b.H); }
    }
    // 구역 사이 문턱: 가는 띠 하나로 "다른 곳에 왔다"는 느낌만
    const { ox, W, cell } = board(scene);
    for (const z of sc.zones.slice(1)) g.fillStyle(0xfffaf0, 0.35).fillRect(ox, scene.oy + z.rows[0] * cell - 2, W, 4);
  },
  wall(scene, g, x, y, px, py, front, sc) {
    const z = zoneAt(sc, y);
    const zs = zoneScene(scene, z);
    KINDS[z.look.scenery.kind].wall(zs, g, x, y - z.rows[0], px, py, front, z.look.scenery);
  },
  ambient(scene, sc) {
    for (const z of sc.zones) KINDS[z.look.scenery.kind].ambient?.(zoneScene(scene, z), z.look.scenery);
  },
};

const KINDS = { home, alley, market, bamboo, garden, park, maple, zones, ...KINDS2 };
const kindOf = (scene) => { const sc = scene.look.scenery; return sc && KINDS[sc.kind] ? [KINDS[sc.kind], sc] : [null, null]; };

// ── MazeScene이 부르는 네 가지 ─────────────────────
export function drawBackdrop(scene, g) { const [k, sc] = kindOf(scene); k?.backdrop?.(scene, g, sc); }
// 바닥을 그렸으면 true (아니면 MazeScene의 바둑판)
export function drawFloor(scene, g) { const [k, sc] = kindOf(scene); if (!k?.floor) return false; k.floor(scene, g, sc); return true; }
// 벽 한 칸을 그렸으면 true (아니면 MazeScene의 기본 벽)
export function drawWallScenery(scene, g, x, y, px, py, front) { const [k, sc] = kindOf(scene); if (!k?.wall) return false; k.wall(scene, g, x, y, px, py, front, sc); return true; }
// 움직임: 판 바닥 그림 바로 위(수집품·블루나비보다 아래). 동작 줄이기를 켠 기기에서는 멈춘 모습.
export function addAmbient(scene) { const [k, sc] = kindOf(scene); k?.ambient?.(scene, sc); }
