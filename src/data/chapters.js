// 단계 순서와 단계별 정보 (2026-11-04: 나라마다 1단계 — 한국·중국·일본·미국·캐나다 = 5단계, docs/design-brief.md 11절)
// 2026-11-13~ 1탄 미로에서 한국을 뺐다(사용자 결정): 중국·일본·미국·캐나다 = 4단계. 블루나비는 한국 창가에서 태어나
// 배를 타며 나방으로 진화(처음 시작할 때 진화 장면)한 뒤 중국 미로부터. 한국 미로 데이터(mazes.js ch1)는 남겨 둠.
// 중국이 새 1단계라서 1단계 규칙(방해물 절반 빠르기, 웅덩이·거미줄 1개씩)을 중국에 옮김.
// 속 id(ch1, ch4~ch7)는 대사·미로·그림·저장 키라서 그대로 둔다. 화면에는 "N단계 · 나라"(stageLabel)로 보인다.
// 한국(ch1)은 한 판에 집·밤 골목·아침 시장 구역이 있고, 구역마다 친구가 숨어 있다(먼지몽 · 실실이 · 짹짹이).
// theme = 화면 여백 색, frame = 그 단계의 '창틀' 모양 (docs/design-brief.md "창문이 넓어진다")
// stamp = 여권 도장 이름, starSec = 별을 받는 미로 기준 시간(초). 2026-11-06 미로 1.5배 빠르게 하면서 약 2/3로, 숨바꼭질이 생기며 늘림, 2026-11-07 2.5배 빠르게 하면서 약 0.65배로
// (2026-11-11~ 피리·자전거·비눗방울은 처음부터 모든 미로에 있어서 선물로 주지 않는다. 한국 숨은 친구는 짹짹이 1명)
// rewards = 친구가 되면 받는 아이템 (친구 순서대로, 없으면 null, 여럿이면 배열)
// bosses = 미로 안에 숨은 친구들(숨바꼭질, design-brief 17절). hideZones = 친구마다 숨는 줄 범위(없으면 판 전체)
// hazardSpeed = 이 단계만 방해물 빠르기 배율 (1단계는 0.5 = 절반, 2026-11-11 "1단계가 너무 어려워")
// drift = 길 위를 천천히 왔다 갔다 하는 웅덩이(닿으면 퐁!)·거미줄(닿으면 느려짐) 개수와 한 칸 가는 시간(ms)
// 대사 키 규칙: intro, `${id}_boss`(숨바꼭질 시작), `${id}_friend`(출구에서 친구 되기) (친구가 여럿이면 `${id}_boss2`, `${id}_friend2` …),
// 진화는 `evo_${형태}_pre` / `evo_${형태}_post`
// 2026-11-15~ 틀린그림 찾기 3단계(사용자 결정 "중국·미국·캐나다 봄·가을·겨울로 단계를 줄여"): 일본(ch5)을 뺐다.
// 일본 데이터는 아래 CUT_CHAPTERS에 남겨 둔다(그림 spot.js ch5·퐁퐁 판 그대로). 4단계(저장 3판·BB3·C3) 순서는 V4_IDS.
export const CHAPTERS = [
  { id: 'ch4', country: 'china',  name: '중국',   place: '대나무 숲',             form: 'moth',        intro: 'ch4_intro', bosses: ['bbangbbang'],        rewards: [null],          evolveTo: null,        item: 'bambooLeaf', patrolKind: 'shoot',      theme: '#cfe8b8', frame: 'moonGate',   starSec: 80,  stamp: '중국',   drift: { puddle: 1, web: 1, stepMs: 1100 }, hazardSpeed: 0.5 },
  { id: 'ch6', country: 'usa',    name: '미국',   place: '센트럴파크',            form: 'butterfly',   intro: 'ch6_intro', bosses: ['dotori'],            rewards: [null],         evolveTo: null,        item: 'acorn',      patrolKind: 'skateboard', splash: 'fountain', theme: '#d9ecc8', frame: 'cityGlass', starSec: 85,  stamp: '미국',   drift: { puddle: 3, web: 2, stepMs: 900 } },
  { id: 'ch7', country: 'canada', name: '캐나다', place: '단풍 숲과 튤립 꽃밭',   form: 'butterfly',   intro: 'ch7_intro', bosses: ['damdam', 'buzzboss'], rewards: [null, null],    evolveTo: null,        item: 'nectar',     splash: 'sprinkler',      theme: '#fde3c8', frame: 'cloud',      starSec: 100, stamp: '캐나다', drift: { puddle: 3, web: 3, stepMs: 800 } },
];

// 빠진 단계 (다시 넣을 때 CHAPTERS에 옮기면 된다)
export const CUT_CHAPTERS = [
  { id: 'ch5', country: 'japan',  name: '일본',   place: '벚꽃 정원',             form: 'moth',        intro: 'ch5_intro', bosses: ['sappuni'],           rewards: ['umbrella'],       evolveTo: 'butterfly', item: 'petal',      splash: 'koi',            theme: '#fbe0e6', frame: 'lattice',    starSec: 90,  stamp: '일본',   drift: { puddle: 2, web: 3, stepMs: 1000 } },
];

// 4단계(중국·일본·미국·캐나다, 2026-11-13~11-15) 순서. 저장 3판·저장 코드 BB3·도전장 C3를 읽을 때만 쓴다.
export const V4_IDS = ['ch4', 'ch5', 'ch6', 'ch7'];
// 2탄 4계절(봄·여름·가을·겨울) 순서. 2탄 저장 3판·PP1·P1을 읽을 때만 쓴다.
export const S4_IDS = ['s1', 's2', 's3', 's4'];
// 4단계 번호 → 3단계 번호 (2번째 단계가 빠짐): 1→1, 2→2(앞 단계를 깼으니 다음 단계), 3→2, 4→3
export const v4Stage = (n) => { n = n ?? 1; return n >= 3 ? n - 1 : Math.max(1, n); };
// 퐁퐁 판 번호(0부터) 4개 → 3개: 0→0, 1→1, 2→1, 3→2
export const v4Pop = (i) => { i = i ?? 0; return i >= 2 ? i - 1 : Math.max(0, i); };

// 예전(7장) 순서. 옛 저장·저장 코드(BB1)·도전장(C1)을 읽을 때만 쓴다. 절대 바꾸지 않는다.
export const LEGACY_IDS = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7'];
// 옛 장 번호(1~7) → 새 단계 번호(1~5): 한국 1~3장은 모두 1단계
export const legacyStage = (n) => (n <= 3 ? 1 : n - 2);
// 5단계(한국 포함, 2026-11-04~11-12) 순서. 저장 2판·저장 코드 BB2·도전장 C2를 읽을 때만 쓴다.
export const V5_IDS = ['ch1', 'ch4', 'ch5', 'ch6', 'ch7'];
// 5단계 번호 → 4단계 번호 (한국이 빠져 하나씩 당겨짐)
export const v5Stage = (n) => Math.max(1, (n ?? 1) - 1);

// 단계 번호(1부터)와 화면 이름
export const stageNo = (id) => CHAPTERS.findIndex((c) => c.id === id) + 1;
export const stageLabel = (ch) => `${stageNo(ch.id)}단계 · ${ch.name}`;

// 여권 페이지 (여행 지도): 나라마다 도장 하나
export const PASSPORT = CHAPTERS.map((c) => ({ country: c.country, name: c.name, chapters: [c.id] }));
