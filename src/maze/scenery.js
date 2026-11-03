// 미로 생동감 (design-brief 8절): 바깥 풍경 · 바닥 질감 · 벽 소품 · 움직임.
// 세 층 원칙: 바깥은 자유롭게, 벽은 나라 소품, 바닥(길)은 은은하게 — 길·벽 구분은 그대로 또렷해야 한다.
// 움직이지 않는 것은 MazeScene이 한 장의 그림으로 구워 매 프레임 다시 그리지 않는다.
// 캔버스·WebGL 둘 다 같게 보이도록 그라데이션 대신 반투명 도형을 겹친다.
import { UI } from '../data/ui.js';
import { platform } from '../platform.js';

// 칸마다 늘 같은 값이 나오는 작은 난수 (소품 자리가 매번 같게)
const hash = (x, y, k = 0) => {
  let h = (x * 73856093) ^ (y * 19349663) ^ (k * 83492791);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// ── 바깥 풍경 ──────────────────────────────────────
export function drawBackdrop(scene, g) {
  const sc = scene.look.scenery;
  if (sc?.kind === 'home') drawHomeBackdrop(scene, g, sc);
}

// 1장: 작은 꽃무늬 벽지, 아래에 창 한 조각과 창턱 위 화분 (블루나비가 태어난 그 화분)
function drawHomeBackdrop(scene, g, sc) {
  const { width: W, height: H } = UI;
  g.fillStyle(sc.wallpaper, 1).fillRect(0, 0, W, H);
  for (let y = 24; y < H; y += 56) {
    for (let x = (y / 56) % 2 ? 52 : 24; x < W; x += 56) {
      g.fillStyle(sc.wallpaperDot, 1);
      for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; g.fillCircle(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3); }
      g.fillStyle(0xf3e3c3, 1).fillCircle(x, y, 2);
    }
  }
  const bottom = scene.oy + scene.rows * scene.cell;
  // 창 한 조각 (오른쪽 끝에서 잘린 창): 하늘 + 창살
  const wx = W - 96, wy = bottom + 34, ww = 140, wh = H - wy - 46;
  g.fillStyle(0x8f6440, 1).fillRoundedRect(wx - 12, wy - 12, ww + 24, wh + 24, 14);
  g.fillStyle(0xbfe3ff, 1).fillRect(wx, wy, ww, wh);
  g.fillStyle(0xffffff, 0.8).fillEllipse(wx + 44, wy + wh * 0.38, 52, 20).fillEllipse(wx + 66, wy + wh * 0.32, 40, 18);
  g.fillStyle(0x8f6440, 1).fillRect(wx + 40, wy, 8, wh).fillRect(wx, wy + wh / 2 - 4, ww, 8);
  // 창턱 (화면 맨 아래)
  const sy = H - 46;
  g.fillStyle(sc.sill[1], 1).fillRect(0, sy + 10, W, 46);
  g.fillStyle(sc.sill[0], 1).fillRoundedRect(0, sy, W, 18, { tl: 0, tr: 0, bl: 6, br: 6 });
  g.fillStyle(0xffffff, 0.35).fillRect(0, sy + 2, W, 3);
  // 창턱 위 작은 화분 두 개
  pot(g, W - 150, sy, 0.8);
  pot(g, W - 64, sy, 0.62);
}

function pot(g, x, baseY, s) {
  g.fillStyle(0x2b2d5a, 0.12).fillEllipse(x, baseY + 2, 70 * s, 12 * s);
  g.fillStyle(0xc96a4a, 1).fillTriangle(x - 30 * s, baseY - 50 * s, x + 30 * s, baseY - 50 * s, x, baseY + 6 * s);
  g.fillStyle(0xc96a4a, 1).fillRect(x - 22 * s, baseY - 50 * s, 44 * s, 50 * s);
  g.fillStyle(0xe0895f, 1).fillRoundedRect(x - 34 * s, baseY - 62 * s, 68 * s, 16 * s, 6 * s);
  g.fillStyle(0xffffff, 0.3).fillRect(x - 18 * s, baseY - 44 * s, 6 * s, 30 * s);
  // 새싹 (둥근 떡잎 두 장)
  g.fillStyle(0x4f9f4c, 1).fillRect(x - 2 * s, baseY - 92 * s, 4 * s, 32 * s);
  g.fillStyle(0x6cc35a, 1).fillEllipse(x - 14 * s, baseY - 94 * s, 26 * s, 14 * s).fillEllipse(x + 14 * s, baseY - 98 * s, 26 * s, 14 * s);
}

// ── 바닥 ────────────────────────────────────────────
// 바닥이 있으면 true (없으면 MazeScene의 바둑판)
export function drawFloor(scene, g) {
  const sc = scene.look.scenery;
  if (sc?.kind !== 'home') return false;
  const { cell, ox, oy, rows, cols, look } = scene;
  const W = cols * cell, H = rows * cell;
  g.fillStyle(look.floor, 1).fillRect(ox, oy, W, H);
  // 마룻바닥: 반 칸 높이 판자, 줄마다 이음매가 어긋나게, 군데군데 옹이
  const ph = cell / 2, pl = cell * 3;
  for (let r = 0; r * ph < H; r++) {
    const y = oy + r * ph;
    if (r % 2) g.fillStyle(sc.plank, 0.4).fillRect(ox, y, W, ph);
    g.fillStyle(sc.knot, 0.45).fillRect(ox, y, W, 2);
    for (let x = ((r * 37) % 3) * cell - pl; x < W; x += pl) if (x > 0) g.fillRect(ox + x, y, 2, ph);
    for (let k = 0; k < cols; k++) {
      if (hash(k, r, 1) > 0.9) g.fillStyle(sc.knot, 0.8).fillEllipse(ox + (k + hash(k, r, 2)) * cell, y + ph / 2, cell * 0.16, cell * 0.08);
    }
  }
  // 러그: 판자 위에 깔린 옅은 천 (벽 아래로 들어가 가구 밑에 깔린 것처럼 보인다)
  for (const rug of sc.rugs ?? []) {
    const x = ox + rug.x * cell + cell * 0.12, y = oy + rug.y * cell + cell * 0.12;
    const w = rug.w * cell - cell * 0.24, h = rug.h * cell - cell * 0.24;
    g.fillStyle(rug.color, 0.85).fillRoundedRect(x, y, w, h, cell * 0.3);
    g.lineStyle(3, rug.edge, 0.9).strokeRoundedRect(x + 8, y + 8, w - 16, h - 16, cell * 0.22);
    g.lineStyle(2, rug.edge, 0.9);
    for (let i = x + 12; i < x + w - 8; i += 10) { g.lineBetween(i, y - 6, i, y + 2); g.lineBetween(i, y + h - 2, i, y + h + 6); }
  }
  return true;
}

// ── 벽 소품 ─────────────────────────────────────────
// 벽 한 칸을 그 장의 소품으로 그리면 true
export function drawWallScenery(scene, g, x, y, px, py, front) {
  const sc = scene.look.scenery;
  if (sc?.kind !== 'home') return false;
  const { cell, look } = scene;
  const r = cell * 0.18;
  const topH = front ? cell * 0.72 : cell;
  // 서랍장·책장: 윗판(나뭇결) + 앞판
  g.fillStyle(look.wallFront, 1).fillRoundedRect(px, py, cell, cell, front ? { tl: 0, tr: 0, bl: r, br: r } : 0);
  g.fillStyle(look.wall, 1).fillRect(px, py, cell, topH);
  g.fillStyle(look.wallTop, 1).fillRect(px + 3, py + 3, cell - 6, cell * 0.12);
  g.fillStyle(0x8f6440, 0.18).fillRect(px + 6, py + topH * 0.45, cell - 12, 2).fillRect(px + 10, py + topH * 0.7, cell - 24, 2);
  const edge = x === 0 || y === 0 || x === scene.cols - 1 || y === scene.rows - 1;
  if (front) {
    const fy = py + topH, fh = cell - topH;
    if (hash(x, y, 3) < 0.5) {
      // 책장: 색색의 책등
      let bx = px + 5;
      for (let i = 0; bx < px + cell - 8; i++) {
        const bw = 6 + Math.floor(hash(x, y, 10 + i) * 5);
        const bh = fh * (0.62 + hash(x, y, 20 + i) * 0.3);
        g.fillStyle(sc.books[Math.floor(hash(x, y, 30 + i) * sc.books.length)], 1).fillRect(bx, fy + fh - bh - 2, bw, bh);
        bx += bw + 2;
      }
    } else {
      // 서랍: 손잡이 하나
      g.fillStyle(0x7a5236, 1).fillRoundedRect(px + 6, fy + 3, cell - 12, fh - 7, 4);
      g.fillStyle(0xffd84a, 1).fillCircle(px + cell / 2, fy + fh / 2 - 1, 3.4);
    }
  }
  // 윗판 위 소품 (가장자리 벽은 비워 둔다): 쿠션이나 책 더미
  if (!edge) {
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
  }
  return true;
}

// ── 움직임 ──────────────────────────────────────────
// 판 바닥 그림 바로 위(수집품·블루나비보다 아래)에 놓인다. 동작 줄이기를 켠 기기에서는 멈춘 모습.
export function addAmbient(scene) {
  const sc = scene.look.scenery;
  if (sc?.kind === 'home') addSunbeam(scene, sc);
}

// 오른쪽 위 창에서 비스듬히 드는 햇살 띠 + 그 안을 떠다니는 먼지 반짝이
function addSunbeam(scene, sc) {
  const { ox, oy, cols, rows, cell } = scene;
  const W = cols * cell, H = rows * cell;
  const g = scene.add.graphics().setAlpha(sc.beam.alpha[1]);
  const band = (x0, w, a) => {
    // 위 가장자리 x0에서 시작해 왼쪽 아래로 기울어진 띠 (판 안으로 잘라 그린다)
    const dx = H * 0.55;
    g.fillStyle(sc.beam.color, a).fillPoints([
      { x: ox + x0, y: oy }, { x: ox + x0 + w, y: oy }, { x: ox + x0 + w - dx, y: oy + H }, { x: ox + x0 - dx, y: oy + H },
    ], true);
  };
  // 겹친 띠로 가장자리를 부드럽게 (그라데이션 대신)
  for (const [x0, w] of [[W * 0.62, W * 0.34], [W * 0.88, W * 0.14]]) {
    band(x0 - 14, w + 28, 0.06);
    band(x0, w, 0.08);
    band(x0 + 12, w - 24, 0.07);
  }
  // 판 밖으로 나간 부분은 가린다 (띠가 바깥 벽지 위로 넘치지 않게)
  const mask = scene.make.graphics({}, false).fillStyle(0xffffff).fillRect(ox, oy, W, H);
  g.setMask(mask.createGeometryMask());
  scene.events.once('shutdown', () => mask.destroy());
  scene.ambient = [g];
  const still = platform.reducedMotion;
  if (!still) scene.tweens.add({ targets: g, alpha: sc.beam.alpha[0], duration: sc.beam.periodMs, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // 먼지 반짝이: 햇살 띠 안에서만
  for (let i = 0; i < sc.motes; i++) {
    const t = (i + 0.5) / sc.motes;
    const y = oy + H * t;
    const x = ox + W * (0.62 + hash(i, 1, 9) * 0.3) - H * 0.55 * t;
    const m = scene.add.circle(x, y, 2 + hash(i, 2, 9) * 2.2, 0xffffff, 0.75);
    scene.ambient.push(m);
    if (still) continue;
    scene.tweens.add({
      targets: m, x: x + (hash(i, 3, 9) - 0.5) * 40, y: y - 20 - hash(i, 4, 9) * 30, alpha: 0.2,
      duration: 3200 + hash(i, 5, 9) * 2800, delay: hash(i, 6, 9) * 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }
}
