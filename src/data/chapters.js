// 단계 순서와 단계별 정보 (2026-11-04: 나라마다 1단계 — 한국·중국·일본·미국·캐나다 = 5단계, docs/design-brief.md 11절)
// 속 id(ch1, ch4~ch7)는 대사·미로·그림·저장 키라서 그대로 둔다. 화면에는 "N단계 · 나라"(stageLabel)로 보인다.
// 한국(ch1)은 한 판에 집·밤 골목·아침 시장 구역이 있고, 구역마다 친구가 숨어 있다(먼지몽 · 실실이 · 짹짹이).
// theme = 화면 여백 색, frame = 그 단계의 '창틀' 모양 (docs/design-brief.md "창문이 넓어진다")
// stamp = 여권 도장 이름, starSec = 별을 받는 미로 기준 시간(초). 2026-11-06 미로 1.5배 빠르게 하면서 약 2/3로, 숨바꼭질이 생기며 늘림
// rewards = 친구가 되면 받는 아이템 (친구 순서대로, 없으면 null, 여럿이면 배열)
// bosses = 미로 안에 숨은 친구들(숨바꼭질, design-brief 17절). hideZones = 친구마다 숨는 줄 범위(없으면 판 전체)
// drift = 길 위를 천천히 왔다 갔다 하는 웅덩이(닿으면 퐁!)·거미줄(닿으면 느려짐) 개수와 한 칸 가는 시간(ms)
// 대사 키 규칙: intro, `${id}_boss`(숨바꼭질 시작), `${id}_friend`(출구에서 친구 되기) (친구가 여럿이면 `${id}_boss2`, `${id}_friend2` …),
// 진화는 `evo_${형태}_pre` / `evo_${형태}_post`
export const CHAPTERS = [
  { id: 'ch1', country: 'korea',  name: '한국',   place: '집 · 밤 골목 · 아침 시장', form: 'caterpillar', intro: 'prologue',  bosses: ['dustmong', 'silsili', 'jjakjjak'], rewards: ['sparkle', 'scarf', 'bike'], hideZones: [[0, 5], [6, 10], [11, 16]], evolveTo: 'moth',      item: 'seed',       theme: '#e9d8b4', frame: 'woodWindow', starSec: 175, stamp: '한국',   drift: { puddle: 1, web: 3, stepMs: 1200 } },
  { id: 'ch4', country: 'china',  name: '중국',   place: '대나무 숲',             form: 'moth',        intro: 'ch4_intro', bosses: ['bbangbbang'],        rewards: ['flute'],          evolveTo: null,        item: 'bambooLeaf', patrolKind: 'shoot',      theme: '#cfe8b8', frame: 'moonGate',   starSec: 125, stamp: '중국',   drift: { puddle: 2, web: 2, stepMs: 1100 } },
  { id: 'ch5', country: 'japan',  name: '일본',   place: '벚꽃 정원',             form: 'moth',        intro: 'ch5_intro', bosses: ['sappuni'],           rewards: ['umbrella'],       evolveTo: 'butterfly', item: 'petal',      splash: 'koi',            theme: '#fbe0e6', frame: 'lattice',    starSec: 135, stamp: '일본',   drift: { puddle: 2, web: 3, stepMs: 1000 } },
  { id: 'ch6', country: 'usa',    name: '미국',   place: '센트럴파크',            form: 'butterfly',   intro: 'ch6_intro', bosses: ['dotori'],            rewards: ['bubble'],         evolveTo: null,        item: 'acorn',      patrolKind: 'skateboard', splash: 'fountain', theme: '#d9ecc8', frame: 'cityGlass', starSec: 130, stamp: '미국',   drift: { puddle: 3, web: 2, stepMs: 900 } },
  { id: 'ch7', country: 'canada', name: '캐나다', place: '단풍 숲과 튤립 꽃밭',   form: 'butterfly',   intro: 'ch7_intro', bosses: ['damdam', 'buzzboss'], rewards: ['honey', null],    evolveTo: null,        item: 'nectar',     splash: 'sprinkler',      theme: '#fde3c8', frame: 'cloud',      starSec: 150, stamp: '캐나다', drift: { puddle: 3, web: 3, stepMs: 800 } },
];

// 예전(7장) 순서. 옛 저장·저장 코드(BB1)·도전장(C1)을 읽을 때만 쓴다. 절대 바꾸지 않는다.
export const LEGACY_IDS = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7'];
// 옛 장 번호(1~7) → 새 단계 번호(1~5): 한국 1~3장은 모두 1단계
export const legacyStage = (n) => (n <= 3 ? 1 : n - 2);

// 단계 번호(1부터)와 화면 이름
export const stageNo = (id) => CHAPTERS.findIndex((c) => c.id === id) + 1;
export const stageLabel = (ch) => `${stageNo(ch.id)}단계 · ${ch.name}`;

// 여권 페이지 (여행 지도): 나라마다 도장 하나
export const PASSPORT = CHAPTERS.map((c) => ({ country: c.country, name: c.name, chapters: [c.id] }));
