// 장 순서와 장별 정보. theme = 화면 위아래·양옆 여백 색.
// frame = 그 장의 '창틀' 모양 (docs/design-brief.md 3절: 창문이 넓어진다)
export const CHAPTERS = [
  { id: 'ch1', place: '집',       style: 'house',   form: 'caterpillar', intro: 'prologue',  boss: 'dustmong', reward: 'sparkle', evolveTo: 'moth',      item: 'leaf',     patrolKind: 'vacuum', theme: '#e9d8b4', frame: 'woodWindow' },
  { id: 'ch2', place: '마을',     style: 'village', form: 'moth',        intro: 'ch2_intro', boss: 'silsili',  reward: 'scarf',   evolveTo: null,        item: 'moondust', dark: true,           theme: '#23254d', frame: 'litWindow' },
  { id: 'ch3', place: '시장',     style: 'market',  form: 'moth',        intro: 'ch3_intro', boss: 'jjakjjak', reward: null,      evolveTo: 'butterfly', item: 'seed',     patrolKind: 'cart',   theme: '#f6c48f', frame: 'awning' },
  { id: 'ch4', place: '세계여행', style: 'garden',  form: 'butterfly',   intro: 'ch4_intro', boss: 'buzzboss', reward: null,      evolveTo: null,        item: 'nectar',   sprinkle: true,       theme: '#bfe8a8', frame: 'cloud' },
];
// 대사 키 규칙: intro, `${id}_boss`, `${id}_friend`, 진화는 `evo_${형태}_pre` / `evo_${형태}_post`
