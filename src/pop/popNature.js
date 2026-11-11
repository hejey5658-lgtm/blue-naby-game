// 기념품 퐁퐁 배경 = 그 나라의 귀여운 자연 풍경 (2026-11-11 "국가 자연 이미지를 귀엽게, 빈 곳이 없게").
// 보이는 칸 전체(세로·길쭉한 폰·가로)를 하늘 → 먼 산 → 언덕 → 들판 → 물가 → 나무·꽃으로 채우고 한 장으로 굽는다.
// 나라 표현 규칙(CLAUDE.md 6절): 자연·명소·동물·꽃만, 국기·정치 상징 없음. 그림은 파일 없이 Graphics(캔버스·WebGL 같게).
// 나라마다 색·산 모양·소품은 아래 THEMES에서 고친다.

const INK = 0x2b2d5a;

export const THEMES = {
  // 중국: 계림 같은 둥근 봉우리 + 만리장성 언덕 + 대나무 숲·판다·연꽃 연못
  cn: {
    sky: [0xcfeedb, 0xf2f9ea], far: 'karst', farColor: [0x8fc3a0, 0xaed6b8], mid: [0xa9d68c, 0x93c878], wall: true,
    ground: 0xc6e4a2, tuft: 0x9fcf7c, water: 0x9fd8d2, onWater: 'lotus',
    props: ['bamboo', 'bush', 'bamboo', 'pine', 'panda', 'bamboo', 'rock', 'bamboo', 'pine', 'bush', 'bamboo'],
  },
  // 일본: 눈 덮인 큰 산 + 벚나무·돌등·잉어 연못
  jp: {
    sky: [0xfde0e8, 0xfff5f1], far: 'fuji', farColor: [0x9ab4dc, 0xbccbe6], mid: [0xbfe0a8, 0xa8d391],
    ground: 0xd3eab8, tuft: 0xb0d898, water: 0xa6d6ee, onWater: 'koi',
    props: ['cherry', 'bush', 'cherry', 'lantern', 'cherry', 'rock', 'cherry', 'bush', 'cherry'],
  },
  // 미국: 붉은 협곡 바위산 + 큰 참나무·소나무·해바라기·오리 연못
  us: {
    sky: [0xcde7ff, 0xeef7ff], far: 'mesa', farColor: [0xe5a27a, 0xd0855e], mid: [0xa3d68c, 0x8cc877],
    ground: 0xc2e4a2, tuft: 0x9fd07f, water: 0x9fd0f0, onWater: 'duck', sun: true,
    props: ['oak', 'sunflower', 'pine', 'oak', 'sunflower', 'bush', 'oak'],
  },
  // 캐나다: 눈 덮인 로키 봉우리 + 침엽수 숲 + 단풍나무·튤립 밭·카누 호수
  ca: {
    sky: [0xd1e5ff, 0xf3f8ff], far: 'rocky', farColor: [0x8ea6cb, 0xb2c3df], mid: [0x6fae7a, 0x5d9c69], forest: true,
    ground: 0xdbe9ac, tuft: 0xbcd88c, water: 0x8fc6ec, onWater: 'canoe', sun: true,
    props: ['maple', 'tulips', 'pine', 'maple', 'tulips', 'maple', 'pine'],
  },
};

export function hasNature(id) { return !!THEMES[id]; }

const rnd = (k) => { const v = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
const mix = (a, b, t) => {
  const ch = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

// V = 보이는 칸(세계 좌표) { left, top, right, bottom }, k = 구울 때 배율(가로는 줄여 보므로 작게 구움)
export function drawNature(scene, V, id, k = 1) {
  const T = THEMES[id];
  const L = Math.floor(V.left) - 4, Tp = Math.floor(V.top) - 4;
  const W = Math.ceil(V.right - V.left) + 8, H = Math.ceil(V.bottom - V.top) + 8;
  const R = L + W, B = Tp + H;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.scaleCanvas(k, k);
  g.translateCanvas(-L, -Tp);
  const land = W > 1000;
  const hz = Math.round(Tp + H * (land ? 0.5 : 0.56)); // 지평선

  // 하늘 (띠로 조금씩 밝게)
  const bands = 7;
  for (let i = 0; i < bands; i++) {
    const y0 = Tp + ((hz - Tp) * i) / bands;
    g.fillStyle(mix(T.sky[0], T.sky[1], i / (bands - 1)), 1).fillRect(L, y0, W, (hz - Tp) / bands + 2);
  }
  if (T.sun && land) sun(g, L + W * 0.1, Tp + H * 0.17, 46);
  // 구름 (얼굴 없이 — 퐁퐁의 구름 블록과 헷갈리지 않게)
  const nc = Math.max(3, Math.round(W / 230));
  for (let i = 0; i < nc; i++) {
    const x = L + ((i + 0.5) * W) / nc + (rnd(i + 3) - 0.5) * 120;
    const y = Tp + H * 0.08 + rnd(i + 17) * (hz - Tp - H * 0.3);
    cloud(g, x, y, 0.7 + rnd(i + 5) * 0.5);
  }
  // 먼 산
  FAR[T.far](g, L, R, hz, T.farColor, H);
  // 가운데 언덕 (둥근 덩어리 두 겹)
  for (let x = L - 120, i = 0; x < R + 160; x += 210, i++) {
    g.fillStyle(T.mid[0], 1).fillEllipse(x, hz + 18, 340 + rnd(i) * 120, 120 + rnd(i + 9) * 50);
  }
  if (T.forest) for (let x = L - 30, i = 0; x < R + 40; x += 34, i++) pine(g, x, hz + 24 + rnd(i + 40) * 10, 0.42 + rnd(i) * 0.12, [0x4f8f5c, 0x3f7d4f]);
  for (let x = L - 60, i = 0; x < R + 160; x += 260, i++) {
    g.fillStyle(T.mid[1], 1).fillEllipse(x, hz + 46, 380 + rnd(i + 2) * 120, 110 + rnd(i + 11) * 40);
  }
  if (T.wall) greatWall(g, L, R, hz);
  // 들판
  g.fillStyle(T.ground, 1).fillRect(L, hz + 50, W, B - hz - 50);
  for (let i = 0; i < Math.round((W * (B - hz)) / 9000); i++) {
    const x = L + rnd(i + 200) * W, y = hz + 70 + rnd(i + 300) * (B - hz - 70);
    tuft(g, x, y, T.tuft);
  }
  // 물가 (연못·호수) — 아래쪽 줄에 띄엄띄엄
  const ponds = [];
  const py = hz + (B - hz) * (land ? 0.62 : 0.8);
  for (let x = L + (land ? 160 : W * 0.5), i = 0; x < R; x += land ? 620 : 99999, i++) {
    const pw = land ? 260 : Math.min(300, W * 0.42), ph = 74;
    ponds.push([x, py, pw, ph]);
    g.fillStyle(mix(T.water, INK, 0.18), 1).fillEllipse(x, py + 5, pw + 10, ph + 10);
    g.fillStyle(T.water, 1).fillEllipse(x, py, pw, ph);
    g.fillStyle(0xffffff, 0.55).fillEllipse(x - pw * 0.2, py - ph * 0.18, pw * 0.3, 8).fillEllipse(x + pw * 0.18, py + ph * 0.12, pw * 0.2, 6);
    WATER[T.onWater](g, x, py, pw, ph, i);
  }
  // 나무·꽃 (먼 줄부터 작게 → 가까운 줄 크게)
  const rows = [[0.16, 0.62], [0.42, 0.82], [0.7, 1.0], [0.95, 1.15]];
  let n = 0;
  rows.forEach(([f, s], ri) => {
    const y = hz + 50 + (B - hz - 50) * f;
    const step = 128 * s;
    for (let x = L + (ri % 2) * step * 0.5 + 20; x < R + 20; x += step) {
      n++;
      const jx = x + (rnd(n) - 0.5) * 40, jy = y + (rnd(n + 50) - 0.5) * 24;
      if (ponds.some(([px, pyy, pw, ph]) => Math.abs(jx - px) < pw / 2 + 40 * s && Math.abs(jy - pyy) < ph / 2 + 60 * s)) continue;
      const kind = T.props[(n * 3 + ri) % T.props.length];
      PROPS[kind](g, jx, jy, s * (0.9 + rnd(n + 9) * 0.2), n);
    }
  });

  const key = 'pop_nature';
  if (scene.textures.exists(key)) scene.textures.remove(key);
  g.generateTexture(key, Math.ceil(W * k), Math.ceil(H * k));
  g.destroy();
  return scene.add.image(L, Tp, key).setOrigin(0).setScale(1 / k);
}

// ── 하늘 ──
function sun(g, x, y, r) {
  g.fillStyle(0xffe58a, 0.5).fillCircle(x, y, r * 1.35);
  g.fillStyle(0xffd84a, 1).fillCircle(x, y, r);
  g.fillStyle(INK, 1).fillCircle(x - r * 0.3, y - r * 0.05, r * 0.08).fillCircle(x + r * 0.3, y - r * 0.05, r * 0.08);
  g.lineStyle(r * 0.07, INK, 1); g.beginPath(); g.arc(x, y + r * 0.1, r * 0.2, 0.3, Math.PI - 0.3); g.strokePath();
  g.fillStyle(0xff9f80, 0.8).fillEllipse(x - r * 0.5, y + r * 0.22, r * 0.22, r * 0.12).fillEllipse(x + r * 0.5, y + r * 0.22, r * 0.22, r * 0.12);
}
function cloud(g, x, y, s) {
  g.fillStyle(0xffffff, 0.92);
  g.fillCircle(x - 34 * s, y + 6 * s, 22 * s).fillCircle(x, y - 8 * s, 30 * s).fillCircle(x + 36 * s, y + 4 * s, 24 * s);
  g.fillRoundedRect(x - 56 * s, y + 4 * s, 116 * s, 26 * s, 13 * s);
}

// ── 먼 산 ──
const FAR = {
  karst(g, L, R, hz, [c1, c2], H) {
    for (let x = L - 60, i = 0; x < R + 80; x += 120, i++) {
      const w = 90 + rnd(i + 70) * 50, h = H * (0.13 + rnd(i + 80) * 0.12);
      g.fillStyle(i % 2 ? c2 : c1, 1).fillRoundedRect(x - w / 2, hz - h, w, h + 30, { tl: w / 2, tr: w / 2, bl: 0, br: 0 });
      g.fillStyle(0xffffff, 0.18).fillEllipse(x - w * 0.18, hz - h + w * 0.35, w * 0.22, w * 0.5);
    }
    for (let x = L, i = 0; x < R; x += 160, i++) g.fillStyle(0xffffff, 0.45).fillEllipse(x, hz - 6, 220, 26); // 안개
  },
  fuji(g, L, R, hz, [c1, c2], H) {
    for (let x = L - 100, i = 0; x < R + 120; x += 240, i++) g.fillStyle(c2, 1).fillEllipse(x, hz, 300, 90 + rnd(i) * 50);
    const W = R - L, cs = W > 1000 ? [L + W * 0.27, L + W * 0.78] : [L + W * 0.1];
    for (const cx of cs) {
      const h = H * 0.24, w = h * 2.6;
      g.fillStyle(c1, 1).fillTriangle(cx - w / 2, hz + 10, cx + w / 2, hz + 10, cx, hz - h);
      g.fillStyle(c1, 1).fillCircle(cx, hz - h + 10, 14);
      // 눈 모자 (아래 끝은 몽글몽글)
      const sh = h * 0.34, sw = (w * sh) / h;
      g.fillStyle(0xffffff, 1).fillTriangle(cx - sw / 2, hz - h + sh, cx + sw / 2, hz - h + sh, cx, hz - h);
      for (let j = 0; j < 4; j++) g.fillCircle(cx - sw / 2 + (sw * (j + 0.5)) / 4, hz - h + sh, sw / 9);
    }
  },
  mesa(g, L, R, hz, [c1, c2], H) {
    for (let x = L - 80, i = 0; x < R + 120; x += 230, i++) {
      const w = 150 + rnd(i + 30) * 90, h = H * (0.08 + rnd(i + 40) * 0.08), top = w * 0.62;
      const pts = [{ x: x - w / 2, y: hz + 20 }, { x: x - top / 2, y: hz - h }, { x: x + top / 2, y: hz - h }, { x: x + w / 2, y: hz + 20 }];
      g.fillStyle(i % 2 ? c1 : c2, 1).fillPoints(pts, true);
      g.fillStyle(0xf6c9a0, 0.6).fillRect(x - top / 2 - (w - top) * 0.16, hz - h * 0.62, top + (w - top) * 0.32, 7);
      g.fillStyle(0xb86a48, 0.35).fillRect(x - top / 2 - (w - top) * 0.3, hz - h * 0.3, top + (w - top) * 0.6, 6);
    }
  },
  rocky(g, L, R, hz, [c1, c2], H) {
    for (let x = L - 80, i = 0; x < R + 120; x += 150, i++) {
      const h = H * (0.12 + rnd(i + 60) * 0.12), w = h * 1.5;
      g.fillStyle(i % 2 ? c2 : c1, 1).fillTriangle(x - w / 2, hz + 20, x + w / 2, hz + 20, x, hz - h);
      const sh = h * 0.3, sw = (w * sh) / h;
      g.fillStyle(0xffffff, 1).fillTriangle(x - sw / 2, hz - h + sh, x + sw / 2, hz - h + sh, x, hz - h);
      g.fillTriangle(x - sw / 2, hz - h + sh - 1, x - sw / 6, hz - h + sh - 1, x - sw / 3, hz - h + sh * 1.3);
      g.fillTriangle(x + sw / 6, hz - h + sh - 1, x + sw / 2, hz - h + sh - 1, x + sw / 3, hz - h + sh * 1.3);
    }
  },
};

// 언덕 위 성벽 (구불구불 + 망루)
function greatWall(g, L, R, hz) {
  const yAt = (x) => hz + 6 + Math.sin(x / 95) * 16;
  for (let x = L; x < R; x += 10) {
    const y = yAt(x);
    g.fillStyle(0xb39f7a, 1).fillRect(x, y - 12, 11, 16);
    g.fillStyle(0xe2d3ae, 1).fillRect(x, y - 14, 11, 5);
    if (Math.round(x / 10) % 2) g.fillStyle(0xe2d3ae, 1).fillRect(x + 2, y - 20, 6, 6);
  }
  for (let x = L + 80; x < R; x += 330) {
    const y = yAt(x);
    g.fillStyle(0xb39f7a, 1).fillRect(x - 15, y - 38, 30, 40);
    g.fillStyle(0xe2d3ae, 1).fillRect(x - 18, y - 42, 36, 7);
    g.fillStyle(0x7a6a52, 1).fillRoundedRect(x - 5, y - 30, 10, 14, 5);
  }
}

function tuft(g, x, y, c) {
  g.fillStyle(c, 1).fillTriangle(x - 7, y, x - 2, y, x - 6, y - 10).fillTriangle(x - 2, y, x + 3, y, x, y - 13).fillTriangle(x + 3, y, x + 8, y, x + 7, y - 9);
}

// ── 물 위 ──
const WATER = {
  lotus(g, x, y, w, h, i) {
    for (let j = 0; j < 4; j++) {
      const px = x + (j - 1.5) * w * 0.22 + (rnd(i * 9 + j) - 0.5) * 12, py = y + (rnd(i * 7 + j) - 0.5) * h * 0.4;
      g.fillStyle(0x7cbf6a, 1).fillEllipse(px, py, 34, 16);
      if (j % 2 === 0) {
        g.fillStyle(0xff9fb8, 1).fillEllipse(px - 6, py - 8, 10, 16).fillEllipse(px + 6, py - 8, 10, 16);
        g.fillStyle(0xffc4d4, 1).fillEllipse(px, py - 10, 10, 18);
      }
    }
  },
  koi(g, x, y, w, h, i) {
    for (let j = 0; j < 3; j++) {
      const px = x + (j - 1) * w * 0.26, py = y + (j % 2 ? 8 : -8), d = j % 2 ? -1 : 1;
      g.fillStyle(j === 1 ? 0xfffaf0 : 0xf59a3b, 1).fillEllipse(px, py, 30, 13);
      g.fillTriangle(px - d * 14, py, px - d * 24, py - 7, px - d * 24, py + 7);
      g.fillStyle(0xe8584a, 1).fillCircle(px + d * 2, py - 2, 3.5);
      g.fillStyle(INK, 1).fillCircle(px + d * 10, py - 2, 2);
    }
    g.fillStyle(0x8cc08a, 1).fillEllipse(x + w * 0.36, y - h * 0.1, 28, 13);
  },
  duck(g, x, y, w, h, i) {
    for (let j = 0; j < 2; j++) {
      const px = x + (j ? 0.18 : -0.2) * w, py = y + (j ? 6 : -4), s = j ? 0.75 : 1;
      g.fillStyle(0xfff3c4, 1).fillEllipse(px, py, 34 * s, 18 * s).fillCircle(px + 12 * s, py - 12 * s, 9 * s);
      g.fillStyle(0xf59a3b, 1).fillTriangle(px + 19 * s, py - 13 * s, px + 27 * s, py - 10 * s, px + 19 * s, py - 8 * s);
      g.fillStyle(INK, 1).fillCircle(px + 14 * s, py - 14 * s, 1.8 * s);
    }
  },
  canoe(g, x, y, w, h, i) {
    g.fillStyle(0xc0563a, 1).fillEllipse(x, y + 2, 92, 20);
    g.fillStyle(0xe8794f, 1).fillEllipse(x, y - 1, 84, 12);
    g.fillStyle(0x8f6440, 1).fillRect(x + 6, y - 22, 4, 30);
    g.fillStyle(0x8f6440, 1).fillEllipse(x + 8, y + 10, 8, 14);
  },
};

// ── 나무·꽃 (x, y = 밑동, s = 크기) ──
const PROPS = {
  bamboo(g, x, y, s, n) {
    const cols = [0x5fb84f, 0x4f9f4c, 0x7cc56a];
    for (let j = 0; j < 3; j++) {
      const bx = x + (j - 1) * 16 * s, h = (120 + ((n + j) % 3) * 26) * s;
      g.fillStyle(cols[j], 1).fillRoundedRect(bx - 5 * s, y - h, 10 * s, h, 4 * s);
      g.fillStyle(0x3a7a38, 1);
      for (let yy = y - 26 * s; yy > y - h + 10 * s; yy -= 28 * s) g.fillRect(bx - 6 * s, yy, 12 * s, 3 * s);
      g.fillStyle(0x6cc35a, 1).fillEllipse(bx + 14 * s, y - h + 14 * s, 26 * s, 9 * s).fillEllipse(bx - 13 * s, y - h + 34 * s, 24 * s, 8 * s);
    }
  },
  panda(g, x, y, s) {
    g.fillStyle(0x000000, 0.12).fillEllipse(x, y + 2, 64 * s, 12 * s);
    g.fillStyle(INK, 1).fillEllipse(x, y - 24 * s, 60 * s, 50 * s);
    g.fillStyle(0xffffff, 1).fillEllipse(x, y - 24 * s, 54 * s, 44 * s);
    g.fillStyle(INK, 1).fillEllipse(x - 20 * s, y - 6 * s, 18 * s, 14 * s).fillEllipse(x + 20 * s, y - 6 * s, 18 * s, 14 * s);
    g.fillStyle(INK, 1).fillCircle(x - 18 * s, y - 72 * s, 9 * s).fillCircle(x + 18 * s, y - 72 * s, 9 * s);
    g.fillStyle(INK, 1).fillCircle(x, y - 56 * s, 25 * s);
    g.fillStyle(0xffffff, 1).fillCircle(x, y - 56 * s, 22 * s);
    g.fillStyle(INK, 1).fillEllipse(x - 9 * s, y - 58 * s, 10 * s, 13 * s).fillEllipse(x + 9 * s, y - 58 * s, 10 * s, 13 * s);
    g.fillStyle(0xffffff, 1).fillCircle(x - 8 * s, y - 60 * s, 2.4 * s).fillCircle(x + 10 * s, y - 60 * s, 2.4 * s);
    g.fillStyle(INK, 1).fillEllipse(x, y - 48 * s, 6 * s, 4 * s);
    g.fillStyle(0xff9fb8, 0.85).fillEllipse(x - 15 * s, y - 47 * s, 7 * s, 4 * s).fillEllipse(x + 15 * s, y - 47 * s, 7 * s, 4 * s);
    g.fillStyle(0x6cc35a, 1).fillRoundedRect(x + 14 * s, y - 44 * s, 6 * s, 34 * s, 3 * s);
    g.fillStyle(INK, 1).fillEllipse(x + 17 * s, y - 26 * s, 14 * s, 18 * s);
  },
  pine(g, x, y, s) { pine(g, x, y, s, [0x4f9f6a, 0x3f8a5a]); },
  bush(g, x, y, s) {
    g.fillStyle(0x000000, 0.1).fillEllipse(x, y + 2, 76 * s, 12 * s);
    g.fillStyle(0x5fae55, 1).fillCircle(x - 20 * s, y - 14 * s, 18 * s).fillCircle(x + 20 * s, y - 14 * s, 18 * s).fillCircle(x, y - 24 * s, 22 * s);
    g.fillStyle(0x7cc56a, 1).fillCircle(x - 6 * s, y - 30 * s, 10 * s);
    g.fillStyle(0xffffff, 1).fillCircle(x - 18 * s, y - 20 * s, 3 * s).fillCircle(x + 16 * s, y - 26 * s, 3 * s).fillCircle(x + 4 * s, y - 12 * s, 3 * s);
  },
  rock(g, x, y, s) {
    g.fillStyle(0x8e97a8, 1).fillEllipse(x, y - 10 * s, 52 * s, 30 * s);
    g.fillStyle(0xb2bac8, 1).fillEllipse(x - 6 * s, y - 15 * s, 30 * s, 14 * s);
    g.fillStyle(0x7cc56a, 1).fillEllipse(x + 14 * s, y - 22 * s, 14 * s, 6 * s);
  },
  cherry(g, x, y, s, n) {
    g.fillStyle(0x000000, 0.1).fillEllipse(x, y + 2, 80 * s, 12 * s);
    g.fillStyle(0x8f6a55, 1).fillRoundedRect(x - 6 * s, y - 70 * s, 12 * s, 70 * s, 5 * s);
    g.fillStyle(0x8f6a55, 1).fillTriangle(x - 2 * s, y - 50 * s, x + 2 * s, y - 42 * s, x + 24 * s, y - 70 * s);
    const pinks = [0xffb7cb, 0xffcadb, 0xff9fb8];
    [[-26, -84, 26], [24, -88, 26], [0, -106, 30], [-8, -78, 22], [12, -72, 20]].forEach(([dx, dy, r], j) => g.fillStyle(pinks[(n + j) % 3], 1).fillCircle(x + dx * s, y + dy * s, r * s));
    g.fillStyle(0xffffff, 0.8).fillCircle(x - 14 * s, y - 104 * s, 4 * s).fillCircle(x + 20 * s, y - 92 * s, 3 * s).fillCircle(x - 28 * s, y - 80 * s, 3 * s);
  },
  lantern(g, x, y, s) {
    const c = 0xb7b9c2, d = 0x8e909c;
    g.fillStyle(d, 1).fillRoundedRect(x - 18 * s, y - 10 * s, 36 * s, 10 * s, 3 * s);
    g.fillStyle(c, 1).fillRect(x - 6 * s, y - 34 * s, 12 * s, 26 * s);
    g.fillStyle(d, 1).fillRoundedRect(x - 16 * s, y - 40 * s, 32 * s, 8 * s, 3 * s);
    g.fillStyle(c, 1).fillRoundedRect(x - 12 * s, y - 62 * s, 24 * s, 22 * s, 4 * s);
    g.fillStyle(0xffe9a8, 1).fillRect(x - 6 * s, y - 56 * s, 12 * s, 10 * s);
    g.fillStyle(d, 1).fillTriangle(x - 24 * s, y - 62 * s, x + 24 * s, y - 62 * s, x, y - 80 * s);
    g.fillStyle(c, 1).fillCircle(x, y - 82 * s, 5 * s);
  },
  oak(g, x, y, s, n) {
    g.fillStyle(0x000000, 0.1).fillEllipse(x, y + 2, 90 * s, 14 * s);
    g.fillStyle(0x9a6a44, 1).fillRoundedRect(x - 8 * s, y - 64 * s, 16 * s, 64 * s, 6 * s);
    const greens = [0x5fae55, 0x6cc35a, 0x4f9f4c];
    [[-30, -80, 30], [30, -82, 30], [0, -110, 36], [-12, -78, 26], [14, -74, 24]].forEach(([dx, dy, r], j) => g.fillStyle(greens[(n + j) % 3], 1).fillCircle(x + dx * s, y + dy * s, r * s));
    g.fillStyle(0x9edc7c, 1).fillCircle(x - 12 * s, y - 116 * s, 9 * s);
  },
  sunflower(g, x, y, s, n) {
    for (let j = 0; j < 3; j++) {
      const fx = x + (j - 1) * 22 * s, h = (54 + ((n + j) % 3) * 12) * s;
      g.fillStyle(0x5fae55, 1).fillRect(fx - 2 * s, y - h, 4 * s, h);
      g.fillStyle(0x6cc35a, 1).fillEllipse(fx + 8 * s, y - h * 0.45, 14 * s, 7 * s);
      g.fillStyle(0xffd84a, 1);
      for (let a = 0; a < 8; a++) { const t = (a / 8) * Math.PI * 2; g.fillCircle(fx + Math.cos(t) * 10 * s, y - h + Math.sin(t) * 10 * s, 6 * s); }
      g.fillStyle(0x9a6a44, 1).fillCircle(fx, y - h, 8 * s);
      g.fillStyle(INK, 1).fillCircle(fx - 3 * s, y - h - 1 * s, 1.4 * s).fillCircle(fx + 3 * s, y - h - 1 * s, 1.4 * s);
    }
  },
  maple(g, x, y, s, n) {
    g.fillStyle(0x000000, 0.1).fillEllipse(x, y + 2, 88 * s, 14 * s);
    g.fillStyle(0x8f5a3a, 1).fillRoundedRect(x - 7 * s, y - 64 * s, 14 * s, 64 * s, 5 * s);
    const reds = [0xe8794f, 0xc0563a, 0xf2a23a, 0xe0603f];
    [[-28, -80, 28], [28, -84, 28], [0, -108, 34], [-12, -76, 24], [14, -72, 22], [-20, -100, 18]].forEach(([dx, dy, r], j) => g.fillStyle(reds[(n + j) % 4], 1).fillCircle(x + dx * s, y + dy * s, r * s));
    g.fillStyle(0xffd27a, 0.9).fillCircle(x - 14 * s, y - 112 * s, 7 * s).fillCircle(x + 22 * s, y - 92 * s, 5 * s);
  },
  tulips(g, x, y, s, n) {
    const cols = [0xff6b8a, 0xffd84a, 0xb57be8, 0xff9f5a, 0xff8fae];
    for (let j = 0; j < 5; j++) {
      const fx = x + (j - 2) * 14 * s, h = (34 + ((n + j) % 2) * 8) * s;
      g.fillStyle(0x5fae55, 1).fillRect(fx - 1.5 * s, y - h, 3 * s, h);
      g.fillStyle(0x6cc35a, 1).fillEllipse(fx - 5 * s, y - h * 0.4, 8 * s, 14 * s);
      const c = cols[(n + j) % cols.length];
      g.fillStyle(c, 1).fillEllipse(fx, y - h, 13 * s, 14 * s);
      g.fillTriangle(fx - 6.5 * s, y - h - 1, fx - 2 * s, y - h - 1, fx - 5 * s, y - h - 11 * s);
      g.fillTriangle(fx - 2.5 * s, y - h - 1, fx + 2.5 * s, y - h - 1, fx, y - h - 12 * s);
      g.fillTriangle(fx + 2 * s, y - h - 1, fx + 6.5 * s, y - h - 1, fx + 5 * s, y - h - 11 * s);
    }
  },
};

function pine(g, x, y, s, [c1, c2]) {
  g.fillStyle(0x8f6440, 1).fillRect(x - 5 * s, y - 20 * s, 10 * s, 20 * s);
  g.fillStyle(c2, 1).fillTriangle(x - 40 * s, y - 16 * s, x + 40 * s, y - 16 * s, x, y - 70 * s);
  g.fillStyle(c1, 1).fillTriangle(x - 32 * s, y - 46 * s, x + 32 * s, y - 46 * s, x, y - 98 * s);
  g.fillStyle(c2, 1).fillTriangle(x - 24 * s, y - 74 * s, x + 24 * s, y - 74 * s, x, y - 122 * s);
  g.fillStyle(0xffffff, 0.25).fillTriangle(x - 4 * s, y - 112 * s, x, y - 122 * s, x - 14 * s, y - 84 * s);
}
