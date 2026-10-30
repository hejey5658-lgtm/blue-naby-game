// 장 순서와 장별 정보 (컨셉 v2: 한국 3장 + 중국·일본·미국·캐나다 = 7장, docs/concept-v2.md)
// theme = 화면 여백 색, frame = 그 장의 '창틀' 모양 (docs/design-brief.md "창문이 넓어진다")
// stamp = 여권 페이지(나라)와 도장 이름, starSec = 별을 받는 미로 기준 시간(초)
// 대사 키 규칙: intro, `${id}_boss`, `${id}_friend` (보스가 둘이면 `${id}_boss2`, `${id}_friend2`),
// 진화는 `evo_${형태}_pre` / `evo_${형태}_post`
export const CHAPTERS = [
  { id: 'ch1', country: 'korea',  place: '집',          form: 'caterpillar', intro: 'prologue',  bosses: ['dustmong'],          reward: 'sparkle', evolveTo: null,        item: 'leaf',     patrolKind: 'vacuum',     theme: '#e9d8b4', frame: 'woodWindow', starSec: 120, stamp: '우리 집' },
  { id: 'ch2', country: 'korea',  place: '밤 골목',     form: 'caterpillar', intro: 'ch2_intro', bosses: ['silsili'],           reward: 'scarf',   evolveTo: null,        item: 'moondust', dark: true,                theme: '#23254d', frame: 'litWindow',  starSec: 140, stamp: '밤 골목' },
  { id: 'ch3', country: 'korea',  place: '아침 시장',   form: 'caterpillar', intro: 'ch3_intro', bosses: ['jjakjjak'],          reward: null,      evolveTo: 'moth',      item: 'seed',     patrolKind: 'cart',       theme: '#f6c48f', frame: 'awning',     starSec: 150, stamp: '아침 시장' },
  { id: 'ch4', country: 'china',  place: '대나무 숲',   form: 'moth',        intro: 'ch4_intro', bosses: ['bbangbbang'],        reward: 'flute',   evolveTo: null,        item: 'bambooLeaf', patrolKind: 'shoot',    theme: '#cfe8b8', frame: 'moonGate',   starSec: 150, stamp: '중국' },
  { id: 'ch5', country: 'japan',  place: '벚꽃 정원',   form: 'moth',        intro: 'ch5_intro', bosses: ['sappuni'],           reward: 'umbrella', evolveTo: 'butterfly', item: 'petal',   splash: 'koi',            theme: '#fbe0e6', frame: 'lattice',    starSec: 160, stamp: '일본' },
  { id: 'ch6', country: 'usa',    place: '센트럴파크',  form: 'butterfly',   intro: 'ch6_intro', bosses: ['dotori'],            reward: null,      evolveTo: null,        item: 'acorn',    patrolKind: 'skateboard', splash: 'fountain', theme: '#d9ecc8', frame: 'cityGlass', starSec: 160, stamp: '미국' },
  { id: 'ch7', country: 'canada', place: '단풍 숲과 튤립 꽃밭', form: 'butterfly', intro: 'ch7_intro', bosses: ['damdam', 'buzzboss'], reward: null, evolveTo: null,   item: 'nectar',   splash: 'sprinkler',      theme: '#fde3c8', frame: 'cloud',      starSec: 180, stamp: '캐나다' },
];

// 여권 페이지 (여행 지도). 한국 페이지에는 1~3장 도장이 함께 찍힌다.
export const PASSPORT = [
  { country: 'korea',  name: '한국',   chapters: ['ch1', 'ch2', 'ch3'] },
  { country: 'china',  name: '중국',   chapters: ['ch4'] },
  { country: 'japan',  name: '일본',   chapters: ['ch5'] },
  { country: 'usa',    name: '미국',   chapters: ['ch6'] },
  { country: 'canada', name: '캐나다', chapters: ['ch7'] },
];
