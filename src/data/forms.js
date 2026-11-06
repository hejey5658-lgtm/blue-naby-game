// 블루나비의 세 모습. 한국은 애벌레, 중국·일본은 나방, 미국·캐나다는 나비.
// stepMs = 미로 한 칸 가는 시간. 2026-11-06 사용자 요청으로 1.5배 빠르게 (240·190·150 → 160·127·100).
export const FORMS = {
  caterpillar: { name: '애벌레', stepMs: 160, canHop: false, maxHp: 24, atk: 4, special: '데구르르 구르기', battleSize: 200 },
  moth:        { name: '나방',   stepMs: 127, canHop: true,  maxHp: 30, atk: 6, special: '보송보송 날갯가루', battleSize: 224 },
  butterfly:   { name: '나비',   stepMs: 100, canHop: true,  maxHp: 45, atk: 9, special: '반짝반짝 날갯짓', battleSize: 248 },
};
