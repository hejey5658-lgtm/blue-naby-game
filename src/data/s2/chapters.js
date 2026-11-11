// 2탄 「포포의 사계절 서울」 단계 (docs/concept-2.md, 2026-11-04 승인). 계절마다 1단계 = 4단계, 별 없음.
// 1탄 chapters.js 와 같은 모양이라 같은 미로·대결 화면을 그대로 쓴다 (src/series.js 가 갈아 끼운다).
// form = 그 계절에 입은 옷(포포 모습), dressTo = 친구가 준 다음 계절 옷 → '옷 갈아입기' 장면.
// 방해 요소는 단계마다 최대 2가지 (사용자 수정): 봄 자전거·봄비 웅덩이 / 여름 물총·소나기 웅덩이 / 가을 밤송이·낙엽 회오리 / 겨울 눈썰매·미끄러운 얼음
export const CHAPTERS = [
  { id: 's1', country: 'spring', name: '봄',   place: '한강 벚꽃길',     form: 'popoSpring', intro: 'prologue2', bosses: ['kkakkak'],           rewards: [['tube', 'bike']],   dressTo: 'popoSummer', item: 'forsythia',  patrolKind: 'bike',     theme: '#fde3ea', frame: 'spring', starSec: 150, stamp: '봄',   drift: { puddle: 1, web: 0, stepMs: 1200 }, hazardSpeed: 0.5 },
  { id: 's2', country: 'summer', name: '여름', place: '한강 물놀이장',   form: 'popoSummer', intro: 's2_intro',  bosses: ['gaegul'],            rewards: [['scarf', 'honey']], dressTo: 'popoAutumn', item: 'watermelon', patrolKind: 'watergun', theme: '#d6efff', frame: 'summer', starSec: 160, stamp: '여름', drift: { puddle: 3, web: 0, stepMs: 1000 } },
  { id: 's3', country: 'autumn', name: '가을', place: '남산 은행나무길', form: 'popoAutumn', intro: 's3_intro',  bosses: ['bamtol'],            rewards: [['knitHat', 'bubble']], dressTo: 'popoWinter', item: 'ginkgo',     patrolKind: 'chestnut', theme: '#fbe7c2', frame: 'autumn', starSec: 170, stamp: '가을', drift: null },
  { id: 's4', country: 'winter', name: '겨울', place: '광화문 눈 광장',  form: 'popoWinter', intro: 's4_intro',  bosses: ['mungchi', 'gomsil'], rewards: [null, null],        dressTo: null,         item: 'snowflake',  patrolKind: 'sled',     theme: '#e6f0fa', frame: 'winter', starSec: 190, stamp: '겨울', drift: null },
];
export const PASSPORT = CHAPTERS.map((c) => ({ country: c.country, name: c.name, chapters: [c.id] }));
