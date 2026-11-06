// 보상 아이템 (친구가 되면 받음). short = 미로 아이템 버튼 아래 짧은 이름
// 버튼으로 쓰는 것(미로마다 1번): flute·bike·bubble·honey. 늘 켜진 것: scarf·umbrella
// sparkle(반짝가루)은 2026-11-06 아이템에서 뺐다 — 저장 코드 칸 순서 때문에 키만 남겨 둔다(아무도 주지 않음)
export const ITEMS = {
  sparkle:  { name: '반짝가루',    short: '반짝가루', from: 'dustmong',   effect: '미로마다 1번, 8초 동안 반짝반짝 — 방해물·웅덩이·거미줄에 닿아도 괜찮아요' },
  scarf:    { name: '실 목도리',   from: 'silsili',    effect: '바람에 덜 밀려요 (일본 꽃잎 바람·캐나다 단풍잎 회오리에서 최대 1칸)' },
  flute:    { name: '대나무 피리', short: '피리', from: 'bbangbbang', effect: '미로마다 1번, 가장 가까운 수집품 쪽으로 바람 소리가 길을 알려 줘요' },
  umbrella: { name: '작은 우산',   from: 'sappuni',    effect: '물방울·분수·스프링클러·웅덩이에 닿아도 퐁! 하지 않아요' },
  bike:     { name: '씽씽 자전거', short: '자전거',   from: 'jjakjjak', effect: '미로마다 1번, 10초 동안 2배 빠르게! 그동안 에너지가 줄지 않아요' },
  bubble:   { name: '비눗방울 막대', short: '비눗방울', from: 'dotori',  effect: '미로마다 1번, 둘레 3칸 안의 방해물이 비눗방울에 싸여 둥실 날아가요' },
  honey:    { name: '꿀 도시락',   short: '꿀 도시락', from: 'damdam',  effect: '미로마다 1번, 에너지를 가득 채워요' },
};
// 장별 수집품 이름
export const COLLECTIBLES = {
  leaf: '잎사귀', moondust: '달빛가루', seed: '꽃씨', bambooLeaf: '대나무 잎', petal: '벚꽃잎', acorn: '도토리', nectar: '꽃꿀',
};
