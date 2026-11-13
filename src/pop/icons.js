// 기념품 퐁퐁 기념품 그림 (게임 그림 파일이 없는 것만): 둥글고 말랑한 그림체, 외곽선 #2b2d5a.
// 100×100 단위로 그려 96px 텍스처로 굽는다. 캔버스·WebGL 둘 다 같게 (그라데이션 없이 겹친 도형).
import { DRAW2 } from './icons2.js';

const INK = 0x2b2d5a;
const SIZE = 96;

const DRAW = {
  // 빨간 둥근 등불 + 금색 띠·술
  pop_lantern(g, s) {
    g.fillStyle(INK, 1).fillEllipse(50 * s, 52 * s, 66 * s, 70 * s);
    g.fillStyle(0xe8584a, 1).fillEllipse(50 * s, 52 * s, 58 * s, 62 * s);
    g.fillStyle(0xff8a6a, 1).fillEllipse(42 * s, 44 * s, 22 * s, 30 * s);
    g.fillStyle(INK, 1).fillRect(32 * s, 16 * s, 36 * s, 12 * s).fillRect(32 * s, 76 * s, 36 * s, 12 * s);
    g.fillStyle(0xffd84a, 1).fillRect(35 * s, 18 * s, 30 * s, 8 * s).fillRect(35 * s, 78 * s, 30 * s, 8 * s);
    g.fillStyle(0xffd84a, 1).fillRect(47 * s, 86 * s, 6 * s, 10 * s);
    g.fillStyle(0xffffff, 0.7).fillEllipse(38 * s, 40 * s, 8 * s, 14 * s);
  },
  // 통통한 만두 (주름 세 줄)
  pop_dumpling(g, s) {
    g.fillStyle(INK, 0.12).fillEllipse(50 * s, 82 * s, 70 * s, 12 * s);
    g.fillStyle(INK, 1).fillEllipse(50 * s, 56 * s, 80 * s, 58 * s);
    g.fillStyle(0xfff6e0, 1).fillEllipse(50 * s, 56 * s, 72 * s, 50 * s);
    g.fillStyle(0xf3e0bc, 1).fillEllipse(50 * s, 66 * s, 64 * s, 28 * s);
    g.lineStyle(3 * s, 0xd9c094, 1);
    for (const dx of [-14, 0, 14]) g.lineBetween((50 + dx) * s, 32 * s, (50 + dx * 0.6) * s, 46 * s);
    g.fillStyle(0xffffff, 0.8).fillEllipse(36 * s, 46 * s, 12 * s, 8 * s);
  },
  // 작은 파란 우산 (사뿐이가 준 선물)
  pop_umbrella(g, s) {
    g.fillStyle(INK, 1).fillTriangle(8 * s, 52 * s, 92 * s, 52 * s, 50 * s, 10 * s);
    g.fillStyle(INK, 1).fillEllipse(50 * s, 52 * s, 88 * s, 18 * s);
    g.fillStyle(0x7fb2ff, 1).fillTriangle(14 * s, 50 * s, 86 * s, 50 * s, 50 * s, 16 * s);
    g.fillStyle(0xbfe3ff, 1).fillTriangle(30 * s, 50 * s, 50 * s, 50 * s, 50 * s, 18 * s);
    g.fillStyle(INK, 1).fillRect(47 * s, 50 * s, 6 * s, 34 * s);
    g.lineStyle(6 * s, INK, 1).beginPath().arc(40 * s, 84 * s, 10 * s, 0, Math.PI, false).strokePath();
  },
  // 주황·흰 잉어
  pop_koi(g, s) {
    g.fillStyle(INK, 1).fillTriangle(10 * s, 32 * s, 10 * s, 72 * s, 32 * s, 52 * s);
    g.fillStyle(INK, 1).fillEllipse(56 * s, 52 * s, 72 * s, 40 * s);
    g.fillStyle(0xf59a3b, 1).fillTriangle(14 * s, 38 * s, 14 * s, 66 * s, 30 * s, 52 * s);
    g.fillStyle(0xfffaf0, 1).fillEllipse(56 * s, 52 * s, 64 * s, 32 * s);
    g.fillStyle(0xf59a3b, 1).fillEllipse(48 * s, 46 * s, 26 * s, 16 * s).fillEllipse(70 * s, 58 * s, 16 * s, 10 * s);
    g.fillStyle(INK, 1).fillCircle(78 * s, 48 * s, 4 * s);
    g.fillStyle(0xffffff, 1).fillCircle(77 * s, 47 * s, 1.4 * s);
  },
  // 무지갯빛 비눗방울
  pop_bubble(g, s) {
    g.fillStyle(0xbfe3ff, 0.55).fillCircle(50 * s, 50 * s, 36 * s);
    g.lineStyle(5 * s, INK, 1).strokeCircle(50 * s, 50 * s, 38 * s);
    g.lineStyle(4 * s, 0xff9fb8, 0.9).beginPath().arc(50 * s, 50 * s, 30 * s, Math.PI * 0.1, Math.PI * 0.6, false).strokePath();
    g.lineStyle(4 * s, 0x7cc56a, 0.9).beginPath().arc(50 * s, 50 * s, 30 * s, Math.PI * 1.1, Math.PI * 1.5, false).strokePath();
    g.fillStyle(0xffffff, 0.95).fillEllipse(36 * s, 34 * s, 16 * s, 10 * s).fillCircle(64 * s, 66 * s, 4 * s);
  },
  // 단풍잎
  pop_maple(g, s) {
    const pts = (r1, r2) => Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? r2 : r1;
      return { x: (50 + Math.cos(a) * r) * s, y: (46 + Math.sin(a) * r) * s };
    });
    g.fillStyle(INK, 1).fillPoints(pts(44, 22), true);
    g.fillStyle(0xe8584a, 1).fillPoints(pts(38, 18), true);
    g.fillStyle(INK, 1).fillRect(47 * s, 60 * s, 6 * s, 34 * s);
    g.lineStyle(2.5 * s, 0xc0563a, 1).lineBetween(50 * s, 22 * s, 50 * s, 62 * s);
    g.fillStyle(0xffffff, 0.5).fillEllipse(38 * s, 34 * s, 8 * s, 12 * s);
  },
  // 튤립
  pop_tulip(g, s) {
    g.fillStyle(INK, 1).fillRect(46 * s, 50 * s, 8 * s, 44 * s);
    g.fillStyle(0x5fb84f, 1).fillRect(48 * s, 52 * s, 4 * s, 40 * s);
    g.fillStyle(INK, 1).fillEllipse(34 * s, 76 * s, 24 * s, 12 * s);
    g.fillStyle(0x6cc35a, 1).fillEllipse(34 * s, 76 * s, 18 * s, 8 * s);
    g.fillStyle(INK, 1).fillEllipse(50 * s, 38 * s, 50 * s, 50 * s).fillTriangle(25 * s, 30 * s, 37 * s, 6 * s, 45 * s, 30 * s).fillTriangle(55 * s, 30 * s, 63 * s, 6 * s, 75 * s, 30 * s);
    g.fillStyle(0xb57be8, 1).fillEllipse(50 * s, 38 * s, 42 * s, 42 * s).fillTriangle(30 * s, 32 * s, 38 * s, 12 * s, 46 * s, 32 * s).fillTriangle(54 * s, 32 * s, 62 * s, 12 * s, 70 * s, 32 * s);
    g.fillStyle(0xffffff, 0.45).fillEllipse(40 * s, 32 * s, 8 * s, 14 * s);
  },
  // 구름 블록 (둘이서 대결에서 상대에게 보내는 몽글몽글 구름)
  pop_cloud(g, s) {
    g.fillStyle(INK, 1).fillCircle(32 * s, 58 * s, 22 * s).fillCircle(54 * s, 44 * s, 26 * s).fillCircle(72 * s, 60 * s, 20 * s).fillRoundedRect(14 * s, 58 * s, 76 * s, 24 * s, 12 * s);
    g.fillStyle(0xf3f4fb, 1).fillCircle(32 * s, 58 * s, 18 * s).fillCircle(54 * s, 44 * s, 22 * s).fillCircle(72 * s, 60 * s, 16 * s).fillRoundedRect(18 * s, 58 * s, 68 * s, 20 * s, 10 * s);
    g.fillStyle(INK, 1).fillCircle(44 * s, 58 * s, 3.5 * s).fillCircle(62 * s, 58 * s, 3.5 * s);
    g.fillStyle(0xff9fb8, 0.8).fillEllipse(36 * s, 66 * s, 8 * s, 5 * s).fillEllipse(70 * s, 66 * s, 8 * s, 5 * s);
  },
  // 폭죽 기념품 (2026-11-13): 웃는 얼굴 로켓 폭죽 — 내려앉으면 둘레 그림이 펑!
  pop_firework(g, s) {
    g.fillStyle(0xffb347, 1).fillTriangle(40 * s, 82 * s, 50 * s, 98 * s, 60 * s, 82 * s);
    g.fillStyle(0xffd84a, 1).fillTriangle(44 * s, 82 * s, 50 * s, 92 * s, 56 * s, 82 * s);
    g.fillStyle(INK, 1).fillRoundedRect(30 * s, 30 * s, 40 * s, 56 * s, 12 * s);
    g.fillStyle(0xe8584a, 1).fillRoundedRect(34 * s, 33 * s, 32 * s, 50 * s, 10 * s);
    g.fillStyle(0xffd84a, 1).fillRect(34 * s, 42 * s, 32 * s, 6 * s).fillRect(34 * s, 72 * s, 32 * s, 6 * s);
    g.fillStyle(INK, 1).fillTriangle(26 * s, 34 * s, 74 * s, 34 * s, 50 * s, 4 * s);
    g.fillStyle(0x7ec8ff, 1).fillTriangle(32 * s, 31 * s, 68 * s, 31 * s, 50 * s, 9 * s);
    g.fillStyle(0xffffff, 0.5).fillEllipse(43 * s, 20 * s, 6 * s, 12 * s);
    g.fillStyle(INK, 1).fillCircle(44 * s, 58 * s, 3.4 * s).fillCircle(56 * s, 58 * s, 3.4 * s);
    g.fillStyle(0xffffff, 1).fillCircle(45 * s, 57 * s, 1.2 * s).fillCircle(57 * s, 57 * s, 1.2 * s);
    g.lineStyle(2.6 * s, INK, 1); g.beginPath(); g.arc(50 * s, 62 * s, 4 * s, 0.25, Math.PI - 0.25); g.strokePath();
    g.fillStyle(0xffc4d4, 0.9).fillEllipse(39 * s, 65 * s, 6 * s, 3.5 * s).fillEllipse(61 * s, 65 * s, 6 * s, 3.5 * s);
    // 반짝이
    g.fillStyle(0xffd84a, 1).fillTriangle(14 * s, 40 * s, 20 * s, 44 * s, 14 * s, 48 * s).fillTriangle(14 * s, 40 * s, 8 * s, 44 * s, 14 * s, 48 * s);
    g.fillStyle(0xff8fae, 1).fillTriangle(86 * s, 22 * s, 91 * s, 26 * s, 86 * s, 30 * s).fillTriangle(86 * s, 22 * s, 81 * s, 26 * s, 86 * s, 30 * s);
  },
  // 귀여운 나무망치 (웃는 얼굴 머리 + 분홍 줄무늬 손잡이) — 그림 하나를 콩! 없앤다
  pop_hammer(g, s) {
    g.fillStyle(INK, 1).fillRoundedRect(40 * s, 44 * s, 20 * s, 52 * s, 9 * s);
    g.fillStyle(0xe2b57a, 1).fillRoundedRect(44 * s, 46 * s, 12 * s, 46 * s, 6 * s);
    g.fillStyle(0xff9fb8, 1).fillRect(44 * s, 70 * s, 12 * s, 6 * s).fillRect(44 * s, 82 * s, 12 * s, 6 * s);
    g.fillStyle(INK, 1).fillRoundedRect(6 * s, 8 * s, 88 * s, 46 * s, 20 * s);
    g.fillStyle(0xc98a5a, 1).fillRoundedRect(10 * s, 12 * s, 80 * s, 38 * s, 16 * s);
    g.fillStyle(0xe8b07a, 1).fillRoundedRect(22 * s, 12 * s, 56 * s, 38 * s, 10 * s);
    g.fillStyle(INK, 1).fillRect(20 * s, 12 * s, 3 * s, 38 * s).fillRect(77 * s, 12 * s, 3 * s, 38 * s);
    g.fillStyle(0xffffff, 0.45).fillEllipse(36 * s, 19 * s, 22 * s, 6 * s);
    g.fillStyle(INK, 1).fillCircle(40 * s, 30 * s, 4 * s).fillCircle(60 * s, 30 * s, 4 * s);
    g.fillStyle(0xffffff, 1).fillCircle(41.5 * s, 28.5 * s, 1.5 * s).fillCircle(61.5 * s, 28.5 * s, 1.5 * s);
    g.lineStyle(3 * s, INK, 1);
    g.beginPath(); g.arc(50 * s, 35 * s, 5 * s, 0.2, Math.PI - 0.2); g.strokePath();
    g.fillStyle(0xff8fae, 0.85).fillEllipse(31 * s, 39 * s, 9 * s, 5 * s).fillEllipse(69 * s, 39 * s, 9 * s, 5 * s);
  },
};

// 씬이 처음 쓸 때 한 번 굽는다 (같은 이름의 그림 파일이 생기면 그걸 쓴다)
export function makePopIcons(scene) {
  for (const [key, draw] of Object.entries({ ...DRAW, ...DRAW2 })) {
    if (scene.textures.exists(key)) continue;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    draw(g, SIZE / 100);
    g.generateTexture(key, SIZE, SIZE);
    g.destroy();
  }
}
