// 2탄 계절 미로 풍경 (scenery.js 와 같은 네 가지: backdrop · floor · wall · ambient). kind: spring · summer · autumn · winter
// 1탄 원칙 그대로: 바깥은 자유롭게, 벽은 계절 소품, 바닥은 은은하게. 수집품과 비슷한 모양·색은 판 위 소품·움직임에 쓰지 않는다
// (봄 개나리 노랑, 여름 수박 빨강, 가을 은행잎 노란 부채, 겨울 여섯 갈래 눈송이 → 판 위에는 쓰지 않고, 눈은 작은 동그라미로만).
import { UI } from '../data/ui.js';
import { platform } from '../platform.js';

const hash = (x, y, k = 0) => {
  let h = (x * 73856093) ^ (y * 19349663) ^ (k * 83492791);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const board = (s) => ({ cell: s.cell, ox: s.ox, oy: s.oy, W: s.cols * s.cell, H: s.rows * s.cell, bottom: s.oy + s.rows * s.cell, right: s.ox + s.cols * s.cell });
const isEdge = (s, x, y) => x === 0 || y === 0 || x === s.cols - 1 || y === s.rows - 1;
const tween = (scene, cfg) => { if (!platform.reducedMotion) scene.tweens.add(cfg); };
function block(g, scene, px, py, front, colors) {
  const { cell } = scene;
  const r = cell * 0.18;
  const topH = front ? cell * 0.72 : cell;
  g.fillStyle(colors.front, 1).fillRoundedRect(px, py, cell, cell, front ? { tl: 0, tr: 0, bl: r, br: r } : 0);
  g.fillStyle(colors.main, 1).fillRect(px, py, cell, topH);
  return topH;
}
function cloud(g, x, y, s, a = 0.9) {
  g.fillStyle(0xffffff, a).fillEllipse(x, y, 60 * s, 26 * s).fillEllipse(x - 22 * s, y + 4 * s, 40 * s, 20 * s).fillEllipse(x + 24 * s, y + 5 * s, 44 * s, 18 * s);
}
// 판 바깥 위·아래 여백 (움직임은 여기에서만)
const margins = (scene) => { const { oy, bottom } = board(scene); return [[0, scene.hudBottom, UI.fullWidth, Math.max(0, oy - scene.hudBottom)], [0, bottom, UI.fullWidth, UI.fullHeight - bottom]]; };

// ═════ 봄 · 한강 벚꽃길 ═════
const spring = {
  // 연분홍 하늘, 아래로 한강 물결과 다리 실루엣, 강둑 벚나무
  backdrop(scene, g, sc) {
    const { fullWidth: W, fullHeight: H } = UI;
    g.fillStyle(0xfde3ea, 1).fillRect(0, 0, W, H);
    const { bottom } = board(scene);
    const ry = bottom + 70;
    g.fillStyle(0x9fd0ff, 1).fillRect(0, ry, W, H - ry);
    for (let i = 0; i < 6; i++) g.fillStyle(0xffffff, 0.45).fillRoundedRect(30 + i * 118, ry + 30 + (i % 2) * 34, 60, 5, 3);
    g.fillStyle(0xb8c9dc, 1).fillRect(0, ry - 6, W, 10);
    for (let x = 40; x < W; x += 120) g.fillStyle(0xb8c9dc, 1).fillRect(x, ry + 4, 12, 40);
    for (let i = 0; i < 7; i++) {
      const x = 50 + i * 104, y = bottom + 40;
      g.fillStyle(0x8f6a55, 1).fillRect(x - 4, y, 8, 30);
      g.fillStyle(sc.blossom[i % 2], 1).fillCircle(x, y - 6, 26).fillCircle(x - 20, y + 4, 18).fillCircle(x + 20, y + 4, 18);
    }
  },
  // 강변 산책길: 연한 흙길에 작은 분홍 꽃잎 점 (판 위 꽃잎은 아주 작게, 개나리 노랑은 쓰지 않음)
  floor(scene, g, sc) {
    const { cell, ox, oy, W, H } = board(scene);
    g.fillStyle(scene.look.floor, 1).fillRect(ox, oy, W, H);
    for (let y = 0; y < scene.rows; y++) {
      for (let x = 0; x < scene.cols; x++) {
        if ((x + y) % 2) g.fillStyle(scene.look.floor2, 1).fillRect(ox + x * cell, oy + y * cell, cell, cell);
        if (hash(x, y, 201) < 0.35) g.fillStyle(sc.petal, 0.8).fillEllipse(ox + (x + hash(x, y, 202)) * cell, oy + (y + hash(x, y, 203)) * cell, cell * 0.12, cell * 0.08);
      }
    }
  },
  // 벚나무 울타리: 갈색 둥치 위 분홍 꽃 덩어리
  wall(scene, g, x, y, px, py, front, sc) {
    const { cell, look } = scene;
    const topH = block(g, scene, px, py, front, { front: look.wallFront, main: look.wall });
    const c = sc.blossom[Math.floor(hash(x, y, 204) * sc.blossom.length)];
    g.fillStyle(c, 1).fillCircle(px + cell * 0.3, py + topH * 0.4, cell * 0.26).fillCircle(px + cell * 0.7, py + topH * 0.42, cell * 0.26).fillCircle(px + cell * 0.5, py + topH * 0.22, cell * 0.24);
    g.fillStyle(0xffffff, 0.5).fillCircle(px + cell * 0.36, py + topH * 0.28, cell * 0.07);
  },
  // 바깥 여백에서만 살랑 떨어지는 꽃잎
  ambient(scene, sc) {
    margins(scene).forEach(([rx, ry, rw, rh], k) => {
      if (rh < 20) return;
      for (let i = 0; i < sc.petals; i++) {
        const x = rx + hash(i, k, 205) * rw, y = ry + hash(i, k, 206) * rh * 0.5;
        const p = scene.add.ellipse(x, y, 10, 7, sc.blossom[i % 2]).setAlpha(0.9);
        tween(scene, { targets: p, x: x + 40, y: y + rh * 0.45, angle: 160, alpha: 0.2, duration: 4200 + hash(i, k, 207) * 2000, repeat: -1, delay: hash(i, k, 208) * 3000 });
      }
    });
  },
};

// ═════ 여름 · 한강 물놀이장 ═════
const summer = {
  backdrop(scene, g) {
    const { fullWidth: W, fullHeight: H } = UI;
    g.fillStyle(0xd6efff, 1).fillRect(0, 0, W, H);
    const { bottom } = board(scene);
    g.fillStyle(0x7fc7ff, 1).fillRect(0, bottom + 24, W, H - bottom);
    for (let i = 0; i < 8; i++) g.fillStyle(0xffffff, 0.5).fillRoundedRect(20 + i * 92, bottom + 60 + (i % 3) * 38, 50, 6, 3);
    cloud(g, 120, bottom + 8, 0.6); cloud(g, 560, bottom + 14, 0.5);
  },
  // 물놀이장 바닥: 연하늘 타일
  floor(scene, g, sc) {
    const { cell, ox, oy, W, H } = board(scene);
    g.fillStyle(sc.grout, 1).fillRect(ox, oy, W, H);
    const t = cell / 2;
    for (let y = 0; y * t < H; y++) for (let x = 0; x * t < W; x++) g.fillStyle((x + y) % 2 ? scene.look.floor : scene.look.floor2, 1).fillRoundedRect(ox + x * t + 1, oy + y * t + 1, t - 2, t - 2, 3);
  },
  // 수영장 벽: 흰·파랑 줄무늬 앞면, 몇 곳에 튜브·비치볼
  wall(scene, g, x, y, px, py, front, sc) {
    const { cell, look } = scene;
    const topH = block(g, scene, px, py, front, { front: look.wallFront, main: look.wall });
    g.fillStyle(0xffffff, 0.5).fillRect(px + 3, py + 3, cell - 6, cell * 0.1);
    if (front) for (let i = 0; i < 4; i++) g.fillStyle(i % 2 ? 0xffffff : 0x4f8dff, 1).fillRect(px + (cell / 4) * i, py + topH, cell / 4, (cell - topH) * 0.6);
    if (isEdge(scene, x, y)) return;
    const v = hash(x, y, 211);
    const cx = px + cell / 2, cy = py + topH * 0.5;
    if (v < 0.1) { g.fillStyle(sc.ball[0], 1).fillCircle(cx, cy, cell * 0.22); g.fillStyle(sc.ball[1], 1).fillRect(cx - cell * 0.22, cy - cell * 0.05, cell * 0.44, cell * 0.1); }
    else if (v < 0.16) { g.lineStyle(cell * 0.1, 0x7ec8ff, 1).strokeCircle(cx, cy, cell * 0.18); }
  },
  // 바깥 물결 반짝이
  ambient(scene, sc) {
    const { bottom } = board(scene);
    for (let i = 0; i < sc.sparkles; i++) {
      const x = 30 + hash(i, 1, 212) * (UI.fullWidth - 60), y = bottom + 40 + hash(i, 2, 212) * (UI.fullHeight - bottom - 60);
      const s = scene.add.circle(x, y, 3, 0xffffff, 0.9);
      tween(scene, { targets: s, alpha: 0.1, scale: 1.8, duration: 900 + hash(i, 3, 212) * 900, yoyo: true, repeat: -1, delay: hash(i, 4, 212) * 1500 });
    }
  },
};

// ═════ 가을 · 남산 은행나무길 ═════
const autumn = {
  // 남산 언덕과 꼭대기 탑(이름 없는 둥근 전망탑 실루엣), 노란 가로수는 바깥에만
  backdrop(scene, g, sc) {
    const { fullWidth: W, fullHeight: H } = UI;
    g.fillStyle(0xfbe7c2, 1).fillRect(0, 0, W, H);
    const { bottom } = board(scene);
    g.fillStyle(sc.hill, 1).fillEllipse(W * 0.5, bottom + 170, W * 1.3, 220);
    g.fillStyle(0x8ea3bd, 1).fillRect(W * 0.5 - 5, bottom + 20, 10, 60);
    g.fillStyle(0x8ea3bd, 1).fillEllipse(W * 0.5, bottom + 28, 30, 16);
    g.fillStyle(0x8ea3bd, 1).fillRect(W * 0.5 - 1.5, bottom + 2, 3, 20);
    for (let i = 0; i < 8; i++) {
      const x = 30 + i * 94, y = bottom + 120 + (i % 2) * 16;
      g.fillStyle(0x8f6a55, 1).fillRect(x - 4, y, 8, 34);
      g.fillStyle(sc.trees[i % sc.trees.length], 1).fillCircle(x, y - 10, 28).fillCircle(x - 18, y + 4, 18).fillCircle(x + 18, y + 4, 18);
    }
  },
  // 돌길: 둥근 돌 + 작은 갈색 낙엽 점 (노란 부채꼴 은행잎은 쓰지 않음)
  floor(scene, g, sc) {
    const { cell, ox, oy, W, H } = board(scene);
    g.fillStyle(sc.seam, 1).fillRect(ox, oy, W, H);
    for (let y = 0; y < scene.rows; y++) for (let x = 0; x < scene.cols; x++) {
      g.fillStyle(hash(x, y, 221) < 0.5 ? scene.look.floor : scene.look.floor2, 1).fillRoundedRect(ox + x * cell + 2, oy + y * cell + 2, cell - 4, cell - 4, cell * 0.22);
      if (hash(x, y, 222) < 0.3) g.fillStyle(sc.leafDot, 0.85).fillEllipse(ox + (x + 0.2 + hash(x, y, 223) * 0.6) * cell, oy + (y + 0.3 + hash(x, y, 224) * 0.4) * cell, cell * 0.16, cell * 0.09);
    }
  },
  // 돌담: 크고 작은 돌을 쌓은 담 + 기와 지붕선
  wall(scene, g, x, y, px, py, front, sc) {
    const { cell, look } = scene;
    const topH = block(g, scene, px, py, front, { front: look.wallFront, main: look.wall });
    for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) {
      g.fillStyle(hash(x * 2 + k, y * 2 + r, 225) < 0.5 ? sc.stone[0] : sc.stone[1], 1).fillRoundedRect(px + 3 + k * (cell / 2) + (r % 2) * 4, py + 4 + r * (topH / 2), cell / 2 - 8, topH / 2 - 6, 6);
    }
    g.fillStyle(sc.roof, 1).fillRect(px, py, cell, cell * 0.1);
  },
  // 바깥 여백에서 떨어지는 단풍빛 동그라미 잎
  ambient(scene, sc) {
    margins(scene).forEach(([rx, ry, rw, rh], k) => {
      if (rh < 20) return;
      for (let i = 0; i < sc.leaves; i++) {
        const x = rx + hash(i, k, 226) * rw, y = ry + hash(i, k, 227) * rh * 0.4;
        const l = scene.add.ellipse(x, y, 12, 8, sc.fall[i % sc.fall.length]);
        tween(scene, { targets: l, x: x - 50, y: y + rh * 0.5, angle: -200, alpha: 0.2, duration: 4600 + hash(i, k, 228) * 2200, repeat: -1, delay: hash(i, k, 229) * 3000 });
      }
    });
  },
};

// ═════ 겨울 · 광화문 눈 광장 · 북촌 한옥 ═════
const winter = {
  // 회청색 하늘, 아래로 눈 쌓인 기와지붕 줄
  backdrop(scene, g, sc) {
    const { fullWidth: W, fullHeight: H } = UI;
    g.fillStyle(0xe6f0fa, 1).fillRect(0, 0, W, H);
    const { bottom } = board(scene);
    for (let i = 0; i < 5; i++) {
      const x = i * 160 - 20, y = bottom + 70 + (i % 2) * 24;
      g.fillStyle(sc.roof, 1).fillTriangle(x, y + 40, x + 90, y - 10, x + 180, y + 40);
      g.fillStyle(0xffffff, 1).fillEllipse(x + 90, y + 2, 160, 26);
      g.fillStyle(sc.wallHanok, 1).fillRect(x + 20, y + 40, 140, H - y);
      g.fillStyle(sc.lattice, 1).fillRect(x + 60, y + 60, 60, 40);
    }
  },
  // 눈길: 흰 바닥 + 콩콩 발자국
  floor(scene, g, sc) {
    const { cell, ox, oy, W, H } = board(scene);
    g.fillStyle(scene.look.floor, 1).fillRect(ox, oy, W, H);
    for (let y = 0; y < scene.rows; y++) for (let x = 0; x < scene.cols; x++) {
      if ((x + y) % 2) g.fillStyle(scene.look.floor2, 1).fillRect(ox + x * cell, oy + y * cell, cell, cell);
      if (hash(x, y, 231) < 0.12) {
        const fx = ox + (x + 0.35) * cell, fy = oy + (y + 0.5) * cell;
        g.fillStyle(sc.print, 0.7).fillEllipse(fx, fy, cell * 0.12, cell * 0.16).fillEllipse(fx + cell * 0.26, fy - cell * 0.12, cell * 0.12, cell * 0.16);
      }
    }
  },
  // 눈 쌓인 담: 회색 돌담 위 두툼한 눈
  wall(scene, g, x, y, px, py, front, sc) {
    const { cell, look } = scene;
    const topH = block(g, scene, px, py, front, { front: look.wallFront, main: look.wall });
    g.fillStyle(0xffffff, 1).fillRoundedRect(px - 1, py - 2, cell + 2, topH * 0.5, cell * 0.2);
    g.fillStyle(0xd6e6f5, 1).fillRect(px + 2, py + topH * 0.44, cell - 4, 3);
    if (!isEdge(scene, x, y) && hash(x, y, 232) < 0.08) g.fillStyle(0xe8584a, 1).fillCircle(px + cell * 0.5, py + topH * 0.24, cell * 0.08);
  },
  // 바깥 여백에서 천천히 내리는 눈 (작은 동그라미)
  ambient(scene, sc) {
    margins(scene).forEach(([rx, ry, rw, rh], k) => {
      if (rh < 20) return;
      for (let i = 0; i < sc.snow; i++) {
        const x = rx + hash(i, k, 233) * rw, y = ry + hash(i, k, 234) * rh * 0.3;
        const f = scene.add.circle(x, y, 2.5 + hash(i, k, 235) * 2.5, 0xffffff, 0.95);
        tween(scene, { targets: f, x: x + (hash(i, k, 236) - 0.5) * 40, y: y + rh * 0.65, alpha: 0.3, duration: 5000 + hash(i, k, 237) * 2500, repeat: -1, delay: hash(i, k, 238) * 3000 });
      }
    });
  },
};

export const KINDS2 = { spring, summer, autumn, winter };
