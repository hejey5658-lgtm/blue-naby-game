// 2탄 기념품 퐁퐁 「서울 사계절판」: 봄 → 여름 → 가을 → 겨울 순서로 빨라진다. 규칙·수치는 1탄 POP 그대로, 계절 판만 바꾼다.
// icon: 그림 키 (item_*·face_*·enemy_*는 게임 그림, pop_*는 src/pop/icons.js가 그린다)
export const STAGES = [
  { id: 'sp', chapter: 's1', name: '봄', dropMs: 800, goal: 30,
    types: [{ icon: 'item_forsythia', bg: 0xfff3b8 }, { icon: 'face_kkakkak', frame: 1, bg: 0xe3ecff }, { icon: 'pop_blossom', bg: 0xffe3ec }, { icon: 'pop_kite', bg: 0xd8f0e4 }] },
  { id: 'su', chapter: 's2', name: '여름', dropMs: 650, goal: 34,
    types: [{ icon: 'item_watermelon', bg: 0xffd3cc }, { icon: 'face_gaegul', frame: 1, bg: 0xd8f0c8 }, { icon: 'pop_fan', bg: 0xcfe2ff }, { icon: 'pop_icecream', bg: 0xfff0d8 }] },
  { id: 'au', chapter: 's3', name: '가을', dropMs: 500, goal: 38,
    types: [{ icon: 'item_ginkgo', bg: 0xfff0b8 }, { icon: 'face_bamtol', frame: 1, bg: 0xf3e0c8 }, { icon: 'pop_roastnut', bg: 0xead8c8 }, { icon: 'pop_persimmon', bg: 0xffd8b8 }] },
  { id: 'wi', chapter: 's4', name: '겨울', dropMs: 380, goal: 42,
    types: [{ icon: 'item_snowflake', bg: 0xdcecff }, { icon: 'face_gomsil', frame: 1, bg: 0xf0dcc8 }, { icon: 'pop_bungeo', bg: 0xffe3b8 }, { icon: 'pop_mitten', bg: 0xffd8e0 }] },
];
