// 기념품 퐁퐁 (design-brief 10절): 떨어지는 기념품 두 개 묶음, 같은 그림 3개 이상 이어지면 퐁!
// 지도 순서(중국 → 일본 → 미국 → 캐나다)대로 떨어지는 속도가 빨라진다. 기획자가 직접 고쳐도 된다.
// icon: 그림 키 (item_*·face_*·enemy_*는 게임 그림, pop_*는 src/pop/icons.js가 그린다), frame: 시트의 칸 번호
// bg: 기념품 밑 동그라미 색 — 나라 안에서 네 가지가 색으로도 모양으로도 구분되게
export const POP = {
  cols: 6,
  rows: 12,
  minGroup: 3,          // 이만큼 이어지면 퐁
  softDropMs: 50,       // 아래 키를 누르고 있을 때 한 칸 내려오는 시간
  scorePerPop: 10,      // 기념품 하나 퐁 = 10점 × 연쇄 수
  // 둘이서 대결: 상대에게 보내는 구름 블록 수 = (한 번에 4개 이상 퐁이면 퐁 수의 절반) + (연쇄 - 1) × 3, 최대 12
  cloud: { minPops: 4, perChain: 3, max: 12 },
  // 각자 폰 대결: 같은 순서로 떨어지는 기념품, 이 시간(초) 동안 점수 겨루기. 구름 블록 없음, 꼭대기에 닿으면 위쪽 절반이 퐁 비워지고 이어서
  remoteSec: 120,
  // 귀여운 나무망치 (2026-11-11): 이 번째 묶음 대신 망치 하나가 떨어진다. 쓱 옮겨 떨어뜨리면 내려앉은 자리 바로 밑 그림 하나가 콩! 사라진다.
  // 혼자·둘이서·각자 폰 모두 같은 차례에 나온다 (각자 폰 대결도 공평하게).
  hammer: { at: [8, 20] },
  stages: [
    {
      id: 'cn', chapter: 'ch4', name: '중국', dropMs: 800, goal: 30,
      types: [
        { icon: 'item_bambooLeaf', bg: 0xc9ecb4 },
        { icon: 'face_bbangbbang', frame: 1, bg: 0xfffaf0 },
        { icon: 'pop_lantern', bg: 0xffc9b8 },
        { icon: 'pop_dumpling', bg: 0xffe9a8 },
      ],
    },
    {
      id: 'jp', chapter: 'ch5', name: '일본', dropMs: 650, goal: 34,
      types: [
        { icon: 'item_petal', bg: 0xffe3ec },
        { icon: 'face_sappuni', frame: 1, bg: 0xf3e0c8 },
        { icon: 'pop_umbrella', bg: 0xcfe2ff },
        { icon: 'pop_koi', bg: 0xc4ecec },
      ],
    },
    {
      id: 'us', chapter: 'ch6', name: '미국', dropMs: 500, goal: 38,
      types: [
        { icon: 'item_acorn', bg: 0xf3dcc0 },
        { icon: 'face_dotori', frame: 1, bg: 0xfff3c4 },
        { icon: 'enemy_skateboard', bg: 0xcfe0ff },
        { icon: 'pop_bubble', bg: 0xd8f0e4 },
      ],
    },
    {
      id: 'ca', chapter: 'ch7', name: '캐나다', dropMs: 380, goal: 42,
      types: [
        { icon: 'item_nectar', bg: 0xfff0b8 },
        { icon: 'face_damdam', frame: 1, bg: 0xead8c8 },
        { icon: 'pop_maple', bg: 0xffd3c4 },
        { icon: 'pop_tulip', bg: 0xf0dcf4 },
      ],
    },
  ],
};
