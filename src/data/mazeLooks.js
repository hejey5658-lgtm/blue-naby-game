// 장별 미로 모습: 색·벽 무늬·생동감(바깥 풍경·바닥 질감·벽 소품·움직임). 기획자가 직접 고쳐도 된다.
// 색은 art-guide.md 3절 팔레트. scenery는 src/maze/scenery.js 가 그린다 (kind: home·alley·market·bamboo·garden·park·maple). 개수는 움직이는 조각 수.
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
  ch2: {
    floor: 0x3a3d74, floor2: 0x35386b, wall: 0x2b2e5e, wallTop: 0x3d417a, wallFront: 0x1a1c40, low: 0xc96a4a, deco: 'window', hud: [0x15173a, 0x2b2e5e, 0xffe9a8],
    // 밤 골목: 보도블록, 벽돌 담장, 창문 불빛(어둠 위로 보이고 몇 개는 천천히 켜졌다 꺼짐), 바깥 밤하늘·달, 반딧불이(블루나비 둘레 빛 안에서만)
    scenery: { kind: 'alley', seam: 0x2f3266, mortar: 0x3d417a, cap: 0x4a4f8c, frame: 0x15173a, light: 0xffe9a8, windows: 10, blinking: 4, stars: 18, twinkle: 4, fireflies: 6 },
  },
  ch3: {
    floor: 0xf7e8d2, floor2: 0xf1dfc3, wall: 0xa8664a, wallTop: 0xe8584a, wallFront: 0x7a4532, low: 0xe0a050, deco: 'awning', hud: [0x7a4532, 0xa8664a, 0xe8584a],
    // 아침 시장: 돌바닥, 가판대(과일 상자·줄무늬 차양), 바깥 줄 깃발·차양 지붕, 김 모락모락
    scenery: { kind: 'market', seam: 0xe6d3b0, crate: 0xc98a5a, fruit: [0xe8584a, 0xf59a3b, 0xffd84a], awning: [0xe8584a, 0xfffaf0], flags: [0x2f7bff, 0xffd84a, 0xe8584a, 0x6cc35a, 0xfffaf0], flagCount: 10, steam: 4 },
  },
  ch4: {
    floor: 0xdcecc4, floor2: 0xd1e5b6, wall: 0x4f9f4c, wallTop: 0x7cc56a, wallFront: 0x3a7a38, low: 0x9a7a52, deco: 'bamboo', hud: [0x8a3b2e, 0xb5523b, 0xe9b38a],
    // 중국 대나무 숲: 이끼 낀 돌길, 대나무 줄기 벽, 바깥 먼 산·만리장성, 흔들리는 대나무, 흐르는 안개 (떨어지는 잎은 수집품과 헷갈려 쓰지 않음)
    scenery: { kind: 'bamboo', stone: 0xc9dcb0, moss: 0xa8c98a, stalks: [0x5fb84f, 0x4f9f4c, 0x7cc56a], node: 0x3a7a38, hills: [0xb9d8a3, 0xa3c98c], wallColor: 0x9fb889, fog: 3, sway: 4 },
  },
  ch5: {
    floor: 0xfbeef1, floor2: 0xf6e3e8, wall: 0x6fa86a, wallTop: 0x8cc08a, wallFront: 0x4f7f4c, low: 0xb8b8c8, deco: 'blossom', wind: 0xf4b6c8, water: 0x7fc7c9, hud: [0x7a5a3e, 0xa98463, 0xf4b6c8],
    // 일본 벚꽃 정원: 자갈 정원 결, 생울타리, 바깥 벚꽃 가지·연못(잉어·물결), 꽃잎은 바깥 여백에만 (수집품 벚꽃잎과 헷갈리지 않게)
    scenery: { kind: 'garden', rake: 0xeedde2, blossom: [0xffffff, 0xffd0dc], branch: 0x8f6a55, pond: 0x7fc7c9, pad: 0x8cc08a, koi: [0xf59a3b, 0xfffaf0], koiCount: 2, ripples: 2, petals: 6 },
  },
  ch6: {
    floor: 0xd9ecc8, floor2: 0xcfe4bc, wall: 0xc9714f, wallTop: 0x7cc56a, wallFront: 0x9a523a, low: 0x8a6a4a, deco: 'windows', water: 0x7fb2ff, hud: [0x5d6f86, 0x8ea3bd, 0xe3edf7],
    // 미국 센트럴파크: 잔디, 벽돌 화단 위 덤불, 바깥 빌딩 숲·구름, 판 위를 지나는 구름 그림자, 비눗방울
    scenery: { kind: 'park', tuft: 0xc3dcae, bush: [0x7cc56a, 0x5fb84f, 0x9bd383], brick: 0xc9714f, mortar: 0xe0957a, city: [0xb8c9dc, 0xa3b6cc], cityWindow: 0xe3edf7, cloudShadows: 2, bubbles: 5, clouds: 2 },
  },
  ch7: {
    floor: 0xe8f4d4, floor2: 0xdcedc6, wall: 0xc0563a, wallTop: 0xe8794f, wallFront: 0x8e3b28, low: 0x8a5a3a, deco: 'tulip', wind: 0xe8794f, water: 0x7fb2ff, hud: [0x4f8dff, 0x2f7bff, 0xffffff],
    // 캐나다: 작은 꽃이 핀 풀밭, 단풍 덤불·통나무, 바깥 단풍 산·호수·탁 트인 하늘, 천천히 떨어지는 단풍잎
    scenery: { kind: 'maple', tuft: 0xcfe4b8, flowers: [0xffffff, 0xffd84a], bush: [0xe8794f, 0xc0563a, 0xf2a23a], log: [0xa8673c, 0xe0aa7e], lake: 0x9fd0ff, peaks: [0xd98a5a, 0xc0563a], leaves: 8, clouds: 2 },
  },
};
