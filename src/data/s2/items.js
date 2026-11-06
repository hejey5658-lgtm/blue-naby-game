// 2탄 선물(계절 옷 + 15절 아이템). sparkle(꽃 모자 버튼)은 2026-11-06 뺐다 — 저장 코드 칸 순서 때문에 키만 남김. 키 이름이 1탄과 같은 것은 미로에서 같은 효과: sparkle = 8초 무적, scarf = 바람(회오리)에 1칸만.
export const ITEMS = {
  sparkle: { name: '꽃 모자',       short: '꽃 모자',  from: 'bluenabi', effect: '미로마다 1번, 8초 동안 반짝반짝 — 무엇에 닿아도 괜찮아요' },
  tube:    { name: '물놀이 튜브',   from: 'kkakkak',  effect: '웅덩이에 닿으면 퐁! 대신 둥둥 잠깐 느려져요' },
  scarf:   { name: '줄무늬 목도리', from: 'gaegul',   effect: '낙엽 회오리에 1칸만 밀려요' },
  knitHat: { name: '털모자',        from: 'bamtol',   effect: '미끄러운 얼음에서 1칸만 미끄러져요' },
  bike:    { name: '씽씽 킥보드',   short: '킥보드',   from: 'kkakkak',  effect: '미로마다 1번, 10초 동안 2배 빠르게! 그동안 에너지가 줄지 않아요' },
  honey:   { name: '꿀 도시락',     short: '꿀 도시락', from: 'gaegul',  effect: '미로마다 1번, 에너지를 가득 채워요' },
  bubble:  { name: '비눗방울 막대', short: '비눗방울', from: 'bamtol',   effect: '미로마다 1번, 둘레 3칸 안의 방해물이 비눗방울에 싸여 둥실 날아가요' },
};
export const COLLECTIBLES = { forsythia: '개나리꽃', watermelon: '수박 조각', ginkgo: '은행잎', snowflake: '눈송이' };
