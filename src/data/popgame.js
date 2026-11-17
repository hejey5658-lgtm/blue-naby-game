// 기념품 퐁퐁 (design-brief 10절): 떨어지는 기념품 두 개 묶음, 같은 그림 3개 이상 이어지면 퐁!
// 지도 순서(중국 → 미국 → 캐나다)대로 떨어지는 속도가 빨라진다. 기획자가 직접 고쳐도 된다.
// icon: 그림 키 (item_*·face_*·enemy_*는 게임 그림, pop_*는 src/pop/icons.js가 그린다), frame: 시트의 칸 번호
// bg: 기념품 밑 동그라미 색 — 나라 안에서 네 가지가 색으로도 모양으로도 구분되게
// ── 2026-11-17~ 새 「퐁퐁」 (design-brief 21절): 조이스틱으로 겨눠 기념품 공을 쏘고, 같은 그림이 2개(1판)·3개(2·3판) 모이면 퐁!
//    그림 조각 하나가 채워져 블루나비·포포 사진이 완성된다. 판(단계) 번호 0·1·2 순서로 값을 적는다 (1탄·2탄 같음).
export const PONG = {
  timeSec: 90,          // 제한 시간
  wrongSec: 3,          // 다른 그림 기념품을 맞히면 줄어드는 시간
  missPieceSec: 5,      // 둘이서·각자 폰: 시간이 다 됐을 때 못 채운 조각 하나에 더하는 시간(순위용)
  need: [2, 3, 3],      // 같은 그림이 이만큼 모이면 퐁 (공 포함)
  grid: [[4, 3], [4, 4], [5, 4]], // 완성할 그림 조각 칸 (가로, 세로) → 12 · 16 · 20조각
  kinds: [3, 4, 5],     // 판에 나오는 기념품 종류 수 (판 데이터 types 앞에서부터)
  onScreen: [5, 6, 7],  // 한 번에 떠 있는 기념품 무리 수
  fallSec: [14, 12, 10], // 기념품이 하늘 위에서 발사대 줄까지 내려오는 시간
  pairChance: [0, 0.45, 0.5], // 두 개가 붙은 무리로 내려올 확률
  ballSpeed: 1500,      // 공 빠르기 (기준 좌표 px/초)
  bubbleR: 44,          // 기념품 비눗방울 반지름
  ballR: 40,            // 공 반지름
  aimMin: 16,           // 조이스틱을 이만큼은 끌어야 겨눔·발사 (살짝 건드림은 무시)
  maxAngle: 78,         // 겨눌 수 있는 각도 (위쪽 기준 좌우 도)
};

// (아래 POP은 2026-11-16까지의 떨어지는 묶음 퐁퐁 규칙. 판 목록 stages와 그림(types)은 새 퐁퐁도 그대로 쓴다)
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
  // 폭죽 기념품 (2026-11-13): 이 번째 묶음 대신 폭죽 하나가 떨어진다. 내려앉으면 둘레(가로·세로 radius칸) 그림이 한꺼번에 퐁!
  // 망치처럼 묶음 순서는 그대로(각자 폰 대결도 같은 차례). 터진 그림은 점수·목표·미션에 들어간다.
  firework: { at: [14, 27], radius: 1 },
  // 나라 미션 (2026-11-13, 혼자 하기): 나라마다 정한 그림(types 번호)을 count개 퐁 하면 보너스 점수
  missionBonus: 100,
  // 2026-11-15~ 3판(중국 → 미국 → 캐나다): 일본 판은 뺐다(CUT_STAGES). 빠르기는 3판에 맞춰 고르게.
  stages: [
    {
      id: 'cn', chapter: 'ch4', name: '중국', dropMs: 800, goal: 30, mission: { type: 1, count: 6, name: '빵빵이' },
      types: [
        { icon: 'item_bambooLeaf', bg: 0xc9ecb4 },
        { icon: 'face_bbangbbang', frame: 1, bg: 0xfffaf0 },
        { icon: 'pop_lantern', bg: 0xffc9b8 },
        { icon: 'pop_dumpling', bg: 0xffe9a8 },
      ],
    },
    {
      id: 'us', chapter: 'ch6', name: '미국', dropMs: 580, goal: 36, mission: { type: 1, count: 8, name: '도토리대장' },
      types: [
        { icon: 'item_acorn', bg: 0xf3dcc0 },
        { icon: 'face_dotori', frame: 1, bg: 0xfff3c4 },
        { icon: 'enemy_skateboard', bg: 0xcfe0ff },
        { icon: 'pop_bubble', bg: 0xd8f0e4 },
      ],
    },
    {
      id: 'ca', chapter: 'ch7', name: '캐나다', dropMs: 400, goal: 40, mission: { type: 3, count: 9, name: '튤립' },
      types: [
        { icon: 'item_nectar', bg: 0xfff0b8 },
        { icon: 'face_damdam', frame: 1, bg: 0xead8c8 },
        { icon: 'pop_maple', bg: 0xffd3c4 },
        { icon: 'pop_tulip', bg: 0xf0dcf4 },
        { icon: 'face_buzzboss', frame: 1, bg: 0xfff3b8 }, // 2026-11-17 새 퐁퐁 3판은 5가지
      ],
    },
  ],
};

// 빠진 판 (다시 넣을 때 POP.stages에 옮기면 된다)
export const CUT_STAGES = [
    {
      id: 'jp', chapter: 'ch5', name: '일본', dropMs: 650, goal: 34, mission: { type: 3, count: 7, name: '잉어' },
      types: [
        { icon: 'item_petal', bg: 0xffe3ec },
        { icon: 'face_sappuni', frame: 1, bg: 0xf3e0c8 },
        { icon: 'pop_umbrella', bg: 0xcfe2ff },
        { icon: 'pop_koi', bg: 0xc4ecec },
      ],
    },
];
