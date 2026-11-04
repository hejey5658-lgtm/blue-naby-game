// 2탄 친구(보스) 5명. 1탄 bosses.js 와 같은 규칙 (심술 게이지, 기술 attack·rush·hide·wrap·heal).
export const BOSSES = {
  kkakkak: { name: '깍깍이', country: 'spring', grumpy: 32, atk: 3, pattern: ['attack', 'attack', 'hide'], labels: { attack: '깍깍 부리 톡톡', hide: '벚나무 위로 포르르' } },
  gaegul:  { name: '개굴이', country: 'summer', grumpy: 48, atk: 4, pattern: ['attack', 'rush', 'hide'], labels: { attack: '물 뿌리기', rush: '폴짝 개구리 점프', hide: '연잎 뒤에 쏙' } },
  bamtol:  { name: '밤톨이', country: 'autumn', grumpy: 62, atk: 5, pattern: ['attack', 'hide', 'rush'], labels: { attack: '가시 콕콕', hide: '동글 밤송이 변신', rush: '데굴데굴 굴러오기' } },
  mungchi: { name: '뭉치',   country: 'winter', grumpy: 60, atk: 6, pattern: ['attack', 'wrap', 'attack'], labels: { attack: '눈덩이 던지기', wrap: '눈보라 휘잉' } },
  gomsil:  { name: '곰실이', country: 'winter', grumpy: 80, atk: 7, pattern: ['attack', 'rush'], healOnceBelow: 0.5, healAmount: 10, labels: { attack: '곰발 토닥', rush: '꾸벅꾸벅 박치기', heal: '꿀 한 숟가락' } },
};
