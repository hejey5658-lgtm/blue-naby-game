// 블루나비의 세 모습. 한국 1~3장은 애벌레, 중국·일본은 나방, 미국·캐나다는 나비.
export const FORMS = {
  caterpillar: { name: '애벌레', stepMs: 240, canHop: false, maxHp: 20, atk: 4, special: '데구르르 구르기', battleSize: 200 },
  moth:        { name: '나방',   stepMs: 190, canHop: true,  maxHp: 30, atk: 6, special: '보송보송 날갯가루', battleSize: 224 },
  butterfly:   { name: '나비',   stepMs: 150, canHop: true,  maxHp: 45, atk: 9, special: '반짝반짝 날갯짓', battleSize: 248 },
};
