// 장별 미로 모습: 색·벽 무늬·생동감(바깥 풍경·바닥 질감·벽 소품·움직임). 기획자가 직접 고쳐도 된다.
// 색은 art-guide.md 3절 팔레트. scenery가 있는 장은 src/maze/scenery.js 가 그린다 (지금은 1장 시안).
export const LOOK = {
  ch1: {
    floor: 0xf3e3c3, floor2: 0xeedab4, wall: 0xb98a5e, wallTop: 0xd2a679, wallFront: 0x8f6440, low: 0xc98a5a, deco: null, hud: [0x8f6440, 0xb98a5e, 0xd2a679],
    // 생동감 (design-brief 8절): 바깥 = 꽃무늬 벽지 + 창턱 화분, 벽 = 서랍장·책장, 바닥 = 마루 + 러그, 움직임 = 햇살 띠 + 먼지 반짝이
    scenery: {
      kind: 'home',
      wallpaper: 0xe9d8b4, wallpaperDot: 0xdcc69b, sill: [0xd2a679, 0x8f6440],
      plank: 0xe8d4ae, knot: 0xd9c094,
      rugs: [{ x: 1, y: 1, w: 3, h: 3, color: 0xc9dcef, edge: 0xe4eef8 }, { x: 5, y: 11, w: 4, h: 3, color: 0xf3e0a8, edge: 0xfaf0d0 }],
      books: [0x7fb2ff, 0xff9fb8, 0xffd84a, 0xe8584a, 0xa98463],
      cushion: [0xc9dcef, 0xf6e2a6], // 분홍은 체크포인트 방석과 헷갈려서 쓰지 않는다
      beam: { color: 0xfff7dc, alpha: [0.55, 1], periodMs: 5200 },
      motes: 9,
    },
  },
  ch2: { floor: 0x3a3d74, floor2: 0x35386b, wall: 0x2b2e5e, wallTop: 0x3d417a, wallFront: 0x1a1c40, low: 0xc96a4a, deco: 'window', hud: [0x15173a, 0x2b2e5e, 0xffe9a8] },
  ch3: { floor: 0xf7e8d2, floor2: 0xf1dfc3, wall: 0xa8664a, wallTop: 0xe8584a, wallFront: 0x7a4532, low: 0xe0a050, deco: 'awning', hud: [0x7a4532, 0xa8664a, 0xe8584a] },
  ch4: { floor: 0xdcecc4, floor2: 0xd1e5b6, wall: 0x4f9f4c, wallTop: 0x7cc56a, wallFront: 0x3a7a38, low: 0x9a7a52, deco: 'bamboo', hud: [0x8a3b2e, 0xb5523b, 0xe9b38a] },
  ch5: { floor: 0xfbeef1, floor2: 0xf6e3e8, wall: 0x8f6a55, wallTop: 0xf4b6c8, wallFront: 0x6e4f3e, low: 0xb8b8c8, deco: 'blossom', wind: 0xf4b6c8, water: 0x7fc7c9, hud: [0x7a5a3e, 0xa98463, 0xf4b6c8] },
  ch6: { floor: 0xd9ecc8, floor2: 0xcfe4bc, wall: 0xc9714f, wallTop: 0xe0957a, wallFront: 0x9a523a, low: 0x8a6a4a, deco: 'windows', water: 0x7fb2ff, hud: [0x5d6f86, 0x8ea3bd, 0xe3edf7] },
  ch7: { floor: 0xe8f4d4, floor2: 0xdcedc6, wall: 0xc0563a, wallTop: 0xe8794f, wallFront: 0x8e3b28, low: 0x8a5a3a, deco: 'tulip', wind: 0xe8794f, water: 0x7fb2ff, hud: [0x4f8dff, 0x2f7bff, 0xffffff] },
};
