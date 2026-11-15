// 틀린그림 찾기 (20절, 2026-11-15 — 미로 대신). 기획자가 코드 없이 고치는 곳.
// 그림 한 쌍 = 같은 풍경 두 장(위 원래 그림 · 아래 다른 곳이 숨은 그림). 판마다 diffs 후보 중 find 개를 골라 쓴다.
// 소품 { k, x, y, s, n, c, w, h, img, d } — 좌표는 그림 칸(W×H) 기준, (x, y) = 밑동(하늘에 뜬 것은 가운데). 그리기는 src/spot/props.js
// 다른 곳 { t: 'hide' 없어짐 | 'color' 색 바뀜(c) | 'size' 크기 바뀜(s) | 'flip' 좌우 뒤집힘 | 'add' 하나 더 생김(p), i = 소품 번호 }
export const SPOT = {
  W: 680, H: 470,      // 그림 칸 크기 (화면에 맞춰 줄여 보인다)
  timeSec: 90,         // 제한 시간
  find: 5,             // 찾을 곳 수 (후보 중에서 고름)
  lockMs: 1000,        // 아닌 곳을 톡 하면 이만큼 톡이 쉰다
  hurrySec: 10,        // 남은 시간이 이만큼이면 막대가 빨갛게
  missPenaltySec: 10,  // 둘이서·각자 폰: 시간이 다 됐을 때 못 찾은 곳 하나당 더하는 시간(순위용)
};

const RED = 0xe8584a, BLUE = 0x2f7bff, YELLOW = 0xffd84a, PINK = 0xff8fae, PURPLE = 0xb57be8, SKY = 0x7ec8ff, GREEN = 0x6cc35a, ORANGE = 0xf59a3b;

export const PICTURES = {
  // ── 1탄 1단계 · 중국: 대나무 숲 · 만리장성 언덕 · 판다 · 연꽃 연못 ──
  ch4: {
    theme: 'cn',
    props: [
      { k: 'kite', x: 560, y: 84, c: RED },
      { k: 'bird', x: 140, y: 70, s: 0.9, c: YELLOW },
      { k: 'bird', x: 236, y: 112, s: 0.7, c: SKY },
      { k: 'bamboo', x: 252, y: 300, s: 0.5, n: 2 },
      { k: 'pine', x: 430, y: 292, s: 0.5 },
      { k: 'bush', x: 120, y: 330, s: 0.7 },
      { k: 'lamp', x: 330, y: 168, c: RED },
      { k: 'lamp', x: 404, y: 156, c: RED },
      { k: 'bamboo', x: 60, y: 452, s: 0.95, n: 0 },
      { k: 'bamboo', x: 628, y: 456, s: 1.0, n: 1 },
      { k: 'pond', x: 480, y: 404, w: 170, h: 56, c: 0x9fd8d2 },
      { k: 'lotus', x: 480, y: 404, w: 170, h: 56, n: 0 },
      { k: 'hero', img: 'home_bluenabi', x: 352, y: 332, d: 92 },
      { k: 'panda', x: 208, y: 432 },
      { k: 'flower', x: 306, y: 456, c: PINK },
      { k: 'rock', x: 572, y: 454, s: 0.9 },
    ],
    diffs: [
      { t: 'hide', i: 7 },
      { t: 'color', i: 0, c: BLUE },
      { t: 'hide', i: 2 },
      { t: 'size', i: 13, s: 0.7 },
      { t: 'color', i: 14, c: PURPLE },
      { t: 'hide', i: 15 },
      { t: 'add', p: { k: 'flower', x: 404, y: 458, c: YELLOW } },
      { t: 'add', p: { k: 'balloon', x: 116, y: 196, s: 0.9, c: PINK } },
      { t: 'hide', i: 4 },
      { t: 'color', i: 1, c: GREEN },
    ],
  },
};

export const COLORS = { RED, BLUE, YELLOW, PINK, PURPLE, SKY, GREEN, ORANGE };
