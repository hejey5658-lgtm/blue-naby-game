// 보스: HP 대신 '심술(grumpy)'. 0이 되면 심술이 풀려 친구가 된다.
// 기술 종류: attack(공격) · rush(공격×1.5) · hide(다음 턴 블루나비 공격 절반)
//           wrap(다음 턴 블루나비 행동 못 함, 3턴마다) · heal(심술 +healAmount, 심술이 healOnceBelow 아래일 때 1번)
// 균형(2026-10-30): 한국 2·3장이 애벌레가 되면서 실실이·짹짹이 공격을 3으로, 나머지도 '놀자+특기+간식'으로 깰 수 있게 조정
// labels = 대사창에 나오는 기술 이름 ("○○의 (기술 이름)!")
export const BOSSES = {
  dustmong:   { name: '먼지몽',     country: 'korea',  grumpy: 30, atk: 3, pattern: ['attack', 'attack', 'hide'], labels: { attack: '먼지 폭풍', hide: '데굴데굴 숨기' } },
  silsili:    { name: '실실이',     country: 'korea',  grumpy: 40, atk: 3, pattern: ['wrap', 'attack', 'attack'], labels: { wrap: '실 감기', attack: '실뭉치 던지기' } },
  jjakjjak:   { name: '짹짹이',     country: 'korea',  grumpy: 45, atk: 3, pattern: ['attack', 'hide', 'rush'], labels: { attack: '콕콕 쪼기', hide: '포르르 날아오르기', rush: '짹짹 돌진' } },
  bbangbbang: { name: '빵빵이',     country: 'china',  grumpy: 60, atk: 5, pattern: ['attack', 'rush', 'hide'], labels: { attack: '대나무 톡톡', rush: '데굴데굴 구르기', hide: '쿨쿨 낮잠' } },
  sappuni:    { name: '사뿐이',     country: 'japan',  grumpy: 70, atk: 5, pattern: ['attack', 'hide', 'rush'], labels: { attack: '뿔 콩콩', hide: '꾸벅 인사', rush: '깡충 돌진' } },
  dotori:     { name: '도토리대장', country: 'usa',    grumpy: 75, atk: 6, pattern: ['attack', 'rush'], healOnceBelow: 0.5, healAmount: 10, labels: { attack: '도토리 던지기', rush: '휘리릭 달리기', heal: '볼 빵빵 도토리 먹기' } },
  damdam:     { name: '댐댐이',     country: 'canada', grumpy: 60, atk: 7, pattern: ['attack', 'hide', 'rush'], labels: { attack: '꼬리 철썩', hide: '나뭇가지 댐 쌓기', rush: '통나무 굴리기' } },
  buzzboss:   { name: '붕붕대장',   country: 'canada', grumpy: 85, atk: 7, pattern: ['attack', 'rush'], healOnceBelow: 0.5, healAmount: 10, labels: { attack: '붕붕 박치기', rush: '붕붕 돌진', heal: '꿀 먹기' } },
};
