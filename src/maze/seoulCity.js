// 2탄 「포포의 사계절 서울」 도시 풍경 (2026-11-06 "배경이 허전해 — 건물·자동차 같은 도시적인 그림으로"):
// 아파트·빌딩 숲 + 남산 언덕의 타워 + 찻길 위를 달리는 자동차·버스. 파일 없이 Graphics 로 그린다(캔버스·WebGL 같게).
// 계절마다 색이 바뀐다(봄 분홍빛 · 여름 하늘빛 · 가을 노을빛 · 겨울 지붕에 눈). 1탄 원칙대로 국기·간판 글자는 넣지 않는다.
import { platform } from '../platform.js';

const hash = (x, k = 0) => {
  let h = (x * 73856093) ^ (k * 83492791);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export const CITY = {
  spring: { far: 0xf3cbd8, near: [0xf8e1e8, 0xe9c6d4, 0xdcd0ec, 0xfff1e0], win: 0xfff6c8, hill: 0xb9e0a0, tree: 0xffb7cc, sky: 0xfde3ea },
  summer: { far: 0xb5dbf7, near: [0xe6f4ff, 0xc9e6fb, 0xd6f0e6, 0xfffbe8], win: 0xffffff, hill: 0x8fd07a, tree: 0x6cc35a, sky: 0xd6efff },
  autumn: { far: 0xf0cfa0, near: [0xfbe8c8, 0xf0d2a4, 0xe8c4b0, 0xfff3dc], win: 0xfff3c4, hill: 0xe8a35a, tree: 0xf0a04b, sky: 0xfbe7c2 },
  winter: { far: 0xcbd8ea, near: [0xeef3fa, 0xd6e2f0, 0xe2e0ee, 0xffffff], win: 0xfff6c8, hill: 0xf4f8fc, tree: 0xdfe8f2, sky: 0xe6f0fa, snow: true },
};
const INK = 0x2b2d5a;

// 빌딩 숲: x0~x1, 바닥 baseY, 가장 높은 건물 높이 maxH. seed 로 같은 모양.
export function drawSkyline(g, { x0, x1, baseY, maxH, season = 'spring', seed = 1, tower = true }) {
  const c = CITY[season] ?? CITY.spring;
  if (maxH < 40) return;
  // 먼 줄: 옅은 빌딩 실루엣
  for (let x = x0, i = 0; x < x1; i++) {
    const w = 44 + hash(i, seed) * 60, h = maxH * (0.45 + hash(i, seed + 1) * 0.45);
    g.fillStyle(c.far, 1).fillRect(x, baseY - h, w, h);
    x += w - 4;
  }
  // 남산 언덕과 타워 (한 번)
  if (tower) {
    const tx = x0 + (x1 - x0) * (0.25 + hash(9, seed) * 0.5);
    const hh = Math.min(maxH * 0.55, 90);
    g.fillStyle(c.hill, 1).fillEllipse(tx, baseY, 300, hh * 2);
    const top = baseY - hh - Math.min(maxH * 0.6, 120);
    g.fillStyle(INK, 1).fillRect(tx - 3, top, 6, baseY - hh - top + 4);
    g.fillStyle(0xffffff, 1).fillRoundedRect(tx - 14, top + 26, 28, 18, 8);
    g.lineStyle(3, INK, 1).strokeRoundedRect(tx - 14, top + 26, 28, 18, 8);
    g.fillStyle(0xff6b5b, 1).fillCircle(tx, top - 2, 4);
    if (c.snow) g.fillStyle(0xffffff, 1).fillEllipse(tx, baseY - hh + 6, 200, 26);
  }
  // 가까운 줄: 아파트(창문 격자) · 빌딩(세로 띠 창) · 낮은 상가
  for (let x = x0 - 20, i = 0; x < x1; i++) {
    const kind = Math.floor(hash(i, seed + 2) * 3);
    const w = kind === 2 ? 70 + hash(i, seed + 3) * 40 : 56 + hash(i, seed + 3) * 50;
    const h = kind === 2 ? maxH * (0.25 + hash(i, seed + 4) * 0.15) : maxH * (0.5 + hash(i, seed + 4) * 0.5);
    const col = c.near[i % c.near.length];
    const y = baseY - h;
    g.fillStyle(INK, 0.9).fillRoundedRect(x - 3, y - 3, w + 6, h + 6, 6);
    g.fillStyle(col, 1).fillRoundedRect(x, y, w, h + 3, 4);
    if (kind === 0) {
      // 아파트: 창문 격자
      for (let wy = y + 10; wy < baseY - 12; wy += 16) {
        for (let wx = x + 8; wx < x + w - 10; wx += 14) g.fillStyle(hash(wx * 3 + wy, seed) < 0.6 ? c.win : 0xb8c4d8, 1).fillRect(wx, wy, 8, 8);
      }
    } else if (kind === 1) {
      // 빌딩: 세로 유리 띠 + 옥상 안테나
      for (let wx = x + 8; wx < x + w - 8; wx += 14) g.fillStyle(0x9fc4e8, 0.85).fillRect(wx, y + 10, 7, h - 18);
      g.fillStyle(INK, 1).fillRect(x + w / 2 - 1.5, y - 16, 3, 14);
    } else {
      // 상가: 줄무늬 차양 + 큰 창
      for (let k = 0; k < Math.floor(w / 14); k++) g.fillStyle(k % 2 ? 0xffffff : 0xff8a7a, 1).fillRect(x + k * 14, y + 8, 14, 10);
      g.fillStyle(c.win, 1).fillRect(x + 8, y + 24, w - 16, Math.max(8, h - 34));
    }
    if (c.snow) g.fillStyle(0xffffff, 1).fillRoundedRect(x - 4, y - 6, w + 8, 9, 4);
    x += w + 6 + hash(i, seed + 5) * 10;
  }
  // 가로수
  for (let x = x0 + 20, i = 0; x < x1; x += 90 + hash(i, seed + 6) * 40, i++) {
    g.fillStyle(0x8f6a55, 1).fillRect(x - 3, baseY - 20, 6, 20);
    g.fillStyle(c.tree, 1).fillCircle(x, baseY - 26, 14).fillCircle(x - 10, baseY - 18, 10).fillCircle(x + 10, baseY - 18, 10);
  }
}

// 찻길: 회색 길 + 흰 점선
export function drawRoad(g, x0, x1, y, h = 26) {
  g.fillStyle(0x7d8296, 1).fillRect(x0, y, x1 - x0, h);
  g.fillStyle(0x5f6478, 1).fillRect(x0, y + h - 3, x1 - x0, 3);
  for (let x = x0; x < x1; x += 34) g.fillStyle(0xffffff, 0.85).fillRect(x, y + h / 2 - 1.5, 16, 3);
}

// 자동차 한 대 (버스·택시·승용차)
function car(scene, kind, color, s) {
  const g = scene.add.graphics();
  if (kind === 'bus') {
    g.fillStyle(INK, 1).fillRoundedRect(-36 * s, -20 * s, 72 * s, 22 * s, 6 * s);
    g.fillStyle(color, 1).fillRoundedRect(-34 * s, -18 * s, 68 * s, 18 * s, 5 * s);
    for (let k = 0; k < 5; k++) g.fillStyle(0xdff2ff, 1).fillRect((-30 + k * 13) * s, -15 * s, 9 * s, 7 * s);
  } else {
    g.fillStyle(INK, 1).fillRoundedRect(-22 * s, -12 * s, 44 * s, 14 * s, 6 * s).fillRoundedRect(-13 * s, -21 * s, 26 * s, 12 * s, 5 * s);
    g.fillStyle(color, 1).fillRoundedRect(-20 * s, -10 * s, 40 * s, 10 * s, 5 * s).fillRoundedRect(-11 * s, -19 * s, 22 * s, 10 * s, 4 * s);
    g.fillStyle(0xdff2ff, 1).fillRect(-8 * s, -17 * s, 7 * s, 6 * s).fillRect(1 * s, -17 * s, 7 * s, 6 * s);
    if (kind === 'taxi') g.fillStyle(INK, 1).fillRect(-4 * s, -24 * s, 8 * s, 4 * s);
  }
  const wx = kind === 'bus' ? 24 : 13;
  g.fillStyle(INK, 1).fillCircle(-wx * s, 2 * s, 5 * s).fillCircle(wx * s, 2 * s, 5 * s);
  g.fillStyle(0xd8dce8, 1).fillCircle(-wx * s, 2 * s, 2 * s).fillCircle(wx * s, 2 * s, 2 * s);
  return g;
}

// 찻길 위 자동차들 (두 방향). 동작 줄이기면 멈춰 있는 차만.
export function addCars(scene, { x0, x1, y, count = 5, scale = 1, depth = 0.5, seed = 1 }) {
  const kinds = ['car', 'bus', 'taxi', 'car', 'car'];
  const colors = { car: [0xff6b5b, 0x2f7bff, 0xffffff, 0x6cc35a], bus: [0x4fb04a, 0x2f7bff], taxi: [0xffd84a] };
  const list = [];
  for (let i = 0; i < count; i++) {
    const kind = kinds[i % kinds.length];
    const col = colors[kind][Math.floor(hash(i, seed) * colors[kind].length)];
    const dir = i % 2 ? -1 : 1;
    const lane = dir > 0 ? y + 18 * scale : y + 8 * scale;
    const sx = x0 + (x1 - x0) * hash(i, seed + 1);
    const c = car(scene, kind, col, scale).setPosition(sx, lane).setDepth(depth).setScale(dir, 1);
    list.push(c);
    if (platform.reducedMotion) continue;
    const span = x1 - x0 + 160;
    const speed = (60 + hash(i, seed + 2) * 50) * (kind === 'bus' ? 0.8 : 1);
    const go = () => {
      const from = dir > 0 ? x0 - 80 : x1 + 80, to = dir > 0 ? x1 + 80 : x0 - 80;
      c.x = from;
      scene.tweens.add({ targets: c, x: to, duration: (span / speed) * 1000, onComplete: go });
    };
    const first = dir > 0 ? x1 + 80 : x0 - 80;
    scene.tweens.add({ targets: c, x: first, duration: (Math.abs(first - sx) / speed) * 1000, onComplete: go });
  }
  return list;
}
