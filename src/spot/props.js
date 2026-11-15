// 틀린그림 소품 그리기 (20절, 2026-11-15). 그림 데이터는 src/data/spot.js.
// 소품 하나 = { k: 종류, x, y, s(크기), n(모양 번호), c(색), w·h(물 위 소품), img·d(캐릭터 그림) }
// (x, y) = 밑동(땅에 닿는 곳) — 하늘에 뜬 것(풍선·새·연·등불·해)은 가운데.
// 그림 파일 없이 Graphics로 그린다 (캔버스·WebGL 같게, 캔버스는 tint가 안 되므로 색 바꾸기는 c 값으로 다시 그린다).
import { NATURE_PROPS, NATURE_WATER } from '../pop/popNature.js';

const INK = 0x2b2d5a;
const shade = (c, t) => {
  const ch = (s) => Math.max(0, Math.min(255, Math.round(((c >> s) & 255) * t)));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

// 직접 그리는 소품 (색을 받는 것들)
const OWN = {
  // 풍선 (가운데)
  balloon(g, s, c) {
    g.lineStyle(2, INK, 0.6); g.beginPath(); g.moveTo(0, 22 * s); g.lineTo(-4 * s, 52 * s); g.strokePath();
    g.fillStyle(INK, 1).fillEllipse(0, 0, 40 * s, 48 * s);
    g.fillStyle(c, 1).fillEllipse(0, 0, 35 * s, 43 * s);
    g.fillStyle(0xffffff, 0.55).fillEllipse(-7 * s, -9 * s, 9 * s, 14 * s);
    g.fillStyle(c, 1).fillTriangle(-4 * s, 22 * s, 4 * s, 22 * s, 0, 16 * s);
  },
  // 꽃 한 송이 (밑동)
  flower(g, s, c) {
    g.fillStyle(0x5fae55, 1).fillRect(-2 * s, -26 * s, 4 * s, 26 * s);
    g.fillStyle(0x6cc35a, 1).fillEllipse(7 * s, -10 * s, 12 * s, 6 * s);
    g.fillStyle(c, 1);
    for (let a = 0; a < 5; a++) { const t = (a / 5) * Math.PI * 2 - Math.PI / 2; g.fillCircle(Math.cos(t) * 8 * s, -30 * s + Math.sin(t) * 8 * s, 6.5 * s); }
    g.fillStyle(0xffe27a, 1).fillCircle(0, -30 * s, 5 * s);
  },
  // 작은 새 (가운데, 오른쪽을 봄 — 뒤집기 가능)
  bird(g, s, c) {
    g.fillStyle(INK, 1).fillEllipse(0, 0, 40 * s, 30 * s);
    g.fillStyle(c, 1).fillEllipse(0, 0, 35 * s, 25 * s);
    g.fillStyle(shade(c, 0.82), 1).fillEllipse(-5 * s, 2 * s, 18 * s, 11 * s);
    g.fillStyle(0xf59a3b, 1).fillTriangle(16 * s, -3 * s, 16 * s, 4 * s, 25 * s, 0);
    g.fillStyle(INK, 1).fillCircle(8 * s, -4 * s, 2.6 * s);
    g.fillStyle(0xff9fb8, 0.8).fillEllipse(8 * s, 4 * s, 6 * s, 3 * s);
    g.fillStyle(shade(c, 0.82), 1).fillTriangle(-16 * s, -2 * s, -27 * s, -8 * s, -24 * s, 4 * s);
  },
  // 연 (가운데, 꼬리는 왼쪽 아래 — 뒤집기 가능)
  kite(g, s, c) {
    g.lineStyle(2, INK, 0.5); g.beginPath(); g.moveTo(0, 28 * s);
    for (let i = 1; i <= 4; i++) g.lineTo(-i * 9 * s, 28 * s + i * 10 * s + (i % 2 ? 4 : -4) * s);
    g.strokePath();
    g.fillStyle(INK, 1).fillPoints([{ x: 0, y: -32 * s }, { x: 25 * s, y: 0 }, { x: 0, y: 32 * s }, { x: -25 * s, y: 0 }], true);
    g.fillStyle(c, 1).fillPoints([{ x: 0, y: -27 * s }, { x: 21 * s, y: 0 }, { x: 0, y: 27 * s }, { x: -21 * s, y: 0 }], true);
    g.fillStyle(0xffffff, 0.5).fillTriangle(0, -27 * s, 21 * s, 0, 0, 0);
    g.fillStyle(0xffd84a, 1).fillCircle(-18 * s, 44 * s, 4 * s).fillCircle(-36 * s, 62 * s, 4 * s);
  },
  // 우산 (밑동)
  umbrella(g, s, c) {
    g.fillStyle(0x8f6440, 1).fillRect(-2 * s, -52 * s, 4 * s, 52 * s);
    g.fillStyle(INK, 1).fillEllipse(0, -52 * s, 74 * s, 34 * s);
    g.fillStyle(c, 1).fillEllipse(0, -53 * s, 68 * s, 28 * s);
    g.fillStyle(shade(c, 0.85), 1).fillRect(-34 * s, -53 * s, 68 * s, 6 * s);
    g.lineStyle(2, 0xffffff, 0.6);
    for (const dx of [-18, 0, 18]) { g.beginPath(); g.moveTo(0, -66 * s); g.lineTo(dx * s, -50 * s); g.strokePath(); }
    g.fillStyle(INK, 1).fillCircle(0, -68 * s, 3 * s);
  },
  // 매달린 등불 (가운데, 위로 끈)
  lamp(g, s, c) {
    g.lineStyle(2, INK, 0.6); g.beginPath(); g.moveTo(0, -18 * s); g.lineTo(0, -44 * s); g.strokePath();
    g.fillStyle(0xffd84a, 1).fillRect(-8 * s, -20 * s, 16 * s, 5 * s).fillRect(-8 * s, 15 * s, 16 * s, 5 * s);
    g.fillStyle(INK, 1).fillEllipse(0, 0, 38 * s, 34 * s);
    g.fillStyle(c, 1).fillEllipse(0, 0, 33 * s, 29 * s);
    g.lineStyle(2, shade(c, 0.7), 0.8);
    g.beginPath(); g.moveTo(-6 * s, -13 * s); g.lineTo(-6 * s, 13 * s); g.strokePath();
    g.beginPath(); g.moveTo(6 * s, -13 * s); g.lineTo(6 * s, 13 * s); g.strokePath();
    g.fillStyle(0xffd84a, 1).fillRect(-1.5 * s, 20 * s, 3 * s, 10 * s);
  },
  // 물고기 (가운데, 오른쪽을 봄)
  fish(g, s, c) {
    g.fillStyle(c, 1).fillEllipse(0, 0, 34 * s, 16 * s).fillTriangle(-14 * s, 0, -26 * s, -9 * s, -26 * s, 9 * s);
    g.fillStyle(INK, 1).fillCircle(9 * s, -2 * s, 2.2 * s);
  },
  // 공 (밑동)
  ball(g, s, c) {
    g.fillStyle(0x000000, 0.1).fillEllipse(0, 2 * s, 34 * s, 8 * s);
    g.fillStyle(INK, 1).fillCircle(0, -16 * s, 18 * s);
    g.fillStyle(0xffffff, 1).fillCircle(0, -16 * s, 15.5 * s);
    g.fillStyle(c, 1).slice(0, -16 * s, 15.5 * s, -Math.PI / 2, Math.PI / 6, false).fillPath();
    g.fillStyle(c, 1).slice(0, -16 * s, 15.5 * s, Math.PI * 0.83, Math.PI * 1.17, false).fillPath();
  },
  // 해 (가운데)
  sun(g, s, c) {
    g.fillStyle(c, 0.45).fillCircle(0, 0, 40 * s);
    g.fillStyle(c, 1).fillCircle(0, 0, 30 * s);
    g.fillStyle(INK, 1).fillCircle(-9 * s, -3 * s, 2.6 * s).fillCircle(9 * s, -3 * s, 2.6 * s);
    g.lineStyle(2.5 * s, INK, 1); g.beginPath(); g.arc(0, 3 * s, 7 * s, 0.3, Math.PI - 0.3); g.strokePath();
  },
  // 연못 (가운데 — 물 위 소품은 따로 올린다)
  pond(g, s, c, p) {
    const w = p.w ?? 150, h = p.h ?? 50;
    g.fillStyle(shade(c, 0.8), 1).fillEllipse(0, 4, w + 10, h + 8);
    g.fillStyle(c, 1).fillEllipse(0, 0, w, h);
    g.fillStyle(0xffffff, 0.5).fillEllipse(-w * 0.2, -h * 0.18, w * 0.3, 6).fillEllipse(w * 0.18, h * 0.14, w * 0.2, 5);
  },
  // 단풍잎 (가운데)
  leaf(g, s, c) {
    g.fillStyle(c, 1);
    for (let a = 0; a < 5; a++) { const t = (a / 5) * Math.PI * 2 - Math.PI / 2; g.fillTriangle(0, 0, Math.cos(t - 0.35) * 8 * s, Math.sin(t - 0.35) * 8 * s, Math.cos(t) * 18 * s, Math.sin(t) * 18 * s); g.fillTriangle(0, 0, Math.cos(t + 0.35) * 8 * s, Math.sin(t + 0.35) * 8 * s, Math.cos(t) * 18 * s, Math.sin(t) * 18 * s); }
    g.fillStyle(shade(c, 0.7), 1).fillRect(-1 * s, 0, 2 * s, 14 * s);
  },
  // 벤치 (밑동)
  bench(g, s, c) {
    g.fillStyle(0x000000, 0.1).fillEllipse(0, 2, 90 * s, 10 * s);
    g.fillStyle(INK, 1).fillRect(-36 * s, -18 * s, 5 * s, 18 * s).fillRect(31 * s, -18 * s, 5 * s, 18 * s);
    g.fillStyle(c, 1).fillRoundedRect(-42 * s, -24 * s, 84 * s, 8 * s, 3 * s).fillRoundedRect(-42 * s, -44 * s, 84 * s, 8 * s, 3 * s);
    g.fillStyle(shade(c, 0.75), 1).fillRect(-38 * s, -36 * s, 4 * s, 12 * s).fillRect(34 * s, -36 * s, 4 * s, 12 * s);
  },
  // 분수 (밑동)
  fountain(g, s, c) {
    g.fillStyle(0xb2bac8, 1).fillEllipse(0, -8 * s, 96 * s, 26 * s);
    g.fillStyle(c, 1).fillEllipse(0, -12 * s, 82 * s, 16 * s);
    g.fillStyle(0xb2bac8, 1).fillRect(-6 * s, -48 * s, 12 * s, 38 * s).fillEllipse(0, -48 * s, 40 * s, 10 * s);
    g.fillStyle(c, 0.9).fillEllipse(-14 * s, -60 * s, 10 * s, 26 * s).fillEllipse(14 * s, -60 * s, 10 * s, 26 * s).fillEllipse(0, -68 * s, 10 * s, 30 * s);
  },
  // 작은 집 (밑동, 지붕 색 c)
  house(g, s, c) {
    g.fillStyle(0x000000, 0.1).fillEllipse(0, 2, 100 * s, 10 * s);
    g.fillStyle(0xfff3dc, 1).fillRect(-38 * s, -50 * s, 76 * s, 50 * s);
    g.fillStyle(c, 1).fillTriangle(-50 * s, -48 * s, 50 * s, -48 * s, 0, -86 * s);
    g.fillStyle(0x8f6440, 1).fillRoundedRect(-10 * s, -30 * s, 20 * s, 30 * s, 4 * s);
    g.fillStyle(0x7ec8ff, 1).fillRect(-30 * s, -40 * s, 14 * s, 12 * s).fillRect(16 * s, -40 * s, 14 * s, 12 * s);
  },
  // 붕어빵·고구마 같은 간식 (밑동)
  snack(g, s, c) {
    g.fillStyle(0x000000, 0.1).fillEllipse(0, 2, 44 * s, 8 * s);
    g.fillStyle(INK, 1).fillEllipse(0, -12 * s, 44 * s, 26 * s);
    g.fillStyle(c, 1).fillEllipse(0, -12 * s, 39 * s, 21 * s);
    g.fillStyle(0xffffff, 0.4).fillEllipse(-7 * s, -17 * s, 14 * s, 5 * s);
  },
  // 눈송이 (가운데)
  snowflake(g, s, c) {
    g.lineStyle(3 * s, c, 1);
    for (let a = 0; a < 3; a++) { const t = (a / 3) * Math.PI; g.beginPath(); g.moveTo(Math.cos(t) * 14 * s, Math.sin(t) * 14 * s); g.lineTo(-Math.cos(t) * 14 * s, -Math.sin(t) * 14 * s); g.strokePath(); }
    g.fillStyle(c, 1).fillCircle(0, 0, 3 * s);
  },
};

// 맞히는 자리: 밑동에서 가운데까지의 높이(dy, s=1 기준)와 반지름(r)
const HIT = {
  ginkgo: [-95, 46], snowpine: [-65, 40], snowman: [-40, 32], bamboo: [-75, 42], panda: [-42, 36], pine: [-62, 40],
  bush: [-20, 32], rock: [-12, 28], cherry: [-85, 44], lantern: [-45, 28], oak: [-85, 50], sunflower: [-52, 38],
  maple: [-85, 48], tulips: [-30, 38],
  balloon: [0, 30], flower: [-26, 24], bird: [0, 26], kite: [0, 34], umbrella: [-50, 36], lamp: [0, 26], fish: [0, 22],
  ball: [-16, 22], sun: [0, 38], pond: [0, 60], leaf: [0, 22], bench: [-26, 44], fountain: [-40, 46], house: [-46, 50],
  snack: [-12, 26], snowflake: [0, 20], hero: [0, 0],
};

export function hitOf(p) {
  if (p.k === 'hero') { const d = p.d ?? 90; return { x: p.x, y: p.y, r: d * 0.42 }; }
  if (NATURE_WATER[p.k]) return { x: p.x, y: p.y, r: Math.max(30, (p.w ?? 120) * 0.35) };
  const [dy, r] = HIT[p.k] ?? [0, 30];
  const s = p.s ?? 1;
  return { x: p.x, y: p.y + dy * s, r: Math.max(28, r * s) };
}

// 소품 하나를 그린 게임 오브젝트(Graphics 또는 Image)를 돌려준다. flip = 좌우 뒤집기
export function makeProp(scene, p) {
  const s = p.s ?? 1;
  if (p.k === 'hero') {
    const key = p.img && scene.textures.exists(p.img) ? p.img : null;
    if (!key) return scene.add.graphics({ x: p.x, y: p.y });
    const d = p.d ?? 90;
    return scene.add.image(p.x, p.y, key).setDisplaySize(d, d).setFlipX(!!p.flip);
  }
  const g = scene.add.graphics({ x: p.x, y: p.y });
  if (OWN[p.k]) OWN[p.k](g, s, p.c ?? 0xff8fae, p);
  else if (NATURE_PROPS[p.k]) NATURE_PROPS[p.k](g, 0, 0, s, p.n ?? 0);
  else if (NATURE_WATER[p.k]) NATURE_WATER[p.k](g, 0, 0, p.w ?? 120, p.h ?? 44, p.n ?? 0);
  if (p.flip) g.scaleX = -1;
  return g;
}
