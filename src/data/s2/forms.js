// 포포의 계절 옷 (모습). 얼굴·몸은 같고 옷만 바뀐다. 뒤 계절일수록 조금 빠르고 튼튼해진다 (보스 균형).
// stepMs: 2026-11-07 사용자 요청으로 처음(220·200·180·165ms)의 2.5배 빠르게
export const FORMS = {
  popoSpring: { name: '꽃 모자 포포',     stepMs: 88,  canHop: false, maxHp: 26, atk: 5, special: '꽃잎 꼬리 흔들기', battleSize: 220 },
  popoSummer: { name: '물놀이 튜브 포포', stepMs: 80,  canHop: false, maxHp: 32, atk: 6, special: '튜브 통통 튀기',   battleSize: 224 },
  popoAutumn: { name: '목도리 포포',      stepMs: 72,  canHop: false, maxHp: 38, atk: 7, special: '낙엽 뒹굴뒹굴',    battleSize: 232 },
  popoWinter: { name: '털모자 포포',      stepMs: 66,  canHop: false, maxHp: 45, atk: 9, special: '눈밭 멍멍 달리기', battleSize: 240 },
};
