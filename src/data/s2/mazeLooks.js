// 2탄 계절 미로 모습. scenery는 src/maze/scenery2.js 가 그린다 (kind: spring · summer · autumn · winter).
// wind = 화살표 칸 색 (가을 낙엽 회오리, 겨울 미끄러운 얼음), water = 웅덩이 색.
export const LOOK = {
  s1: { floor: 0xf7ecd8, floor2: 0xf2e4cc, wall: 0x9a7058, wallTop: 0xb98a6e, wallFront: 0x7a5440, low: 0xc98a5a, deco: null, water: 0x7fb2ff, hud: [0xc06a86, 0xe08aa6, 0xffd0dc],
    scenery: { kind: 'spring', blossom: [0xffc2d6, 0xffffff], petal: 0xffc2d6, petals: 6 } },
  s2: { floor: 0xe4f4ff, floor2: 0xd6ecfb, wall: 0x7fb2ff, wallTop: 0xbfe3ff, wallFront: 0x4f8dff, low: 0x8ea3bd, deco: null, water: 0x4f9fff, hud: [0x2f6fd6, 0x4f8dff, 0xbfe3ff],
    scenery: { kind: 'summer', grout: 0xc4dff2, ball: [0xff6b5b, 0xffffff], sparkles: 10 } },
  s3: { floor: 0xefe0c4, floor2: 0xe8d6b6, wall: 0xa89a88, wallTop: 0xc4b6a2, wallFront: 0x7f7262, low: 0x8a6a4a, deco: null, wind: 0xf2a23a, water: 0x7fb2ff, hud: [0x9a5a2a, 0xc0763a, 0xf2c88a],
    scenery: { kind: 'autumn', hill: 0xd9b46a, trees: [0xffd03a, 0xf2a23a, 0xe8794f], seam: 0xd8c4a2, leafDot: 0xc0763a, stone: [0xb8ab98, 0x9c8f7c], roof: 0x5d6f86, fall: [0xe8794f, 0xc0563a, 0xf2a23a], leaves: 6 } },
  s4: { floor: 0xfbfdff, floor2: 0xf0f6fc, wall: 0x9aa8bc, wallTop: 0xc4cedc, wallFront: 0x6e7c92, low: 0x8a6a4a, deco: null, wind: 0x9fd0ff, water: 0x7fb2ff, hud: [0x3f5a86, 0x5d78a6, 0xd6e6f5],
    scenery: { kind: 'winter', roof: 0x4a5878, wallHanok: 0xf3e3c3, lattice: 0xc98a5a, print: 0xc4d4e6, snow: 10 } },
};
