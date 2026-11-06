// 화면 배치·크기 수치 (기준 화면 720×1280). 기획자가 직접 고쳐도 된다.
export const UI = {
  width: 720,
  height: 1280,
  minTouch: 96,
  gap: 16,
  fontSize: { dialogue: 34, button: 36, hud: 30, title: 72, small: 22 },
  swipeMinPx: 40,
  vibrate: { collect: 15, bump: 40, special: [30, 40, 30], cocoon: 20, stamp: 40 },
  // 반짝가루: 미로마다 1번, 이 시간 동안 반짝반짝 — 방해물·웅덩이·거미줄·물방울에 닿아도 괜찮다 (2026-11-04, 밤 골목 어둠이 없어져서 바꿈)
  sparkleMs: 8000,
  // 움직이는 웅덩이: 커져 있는 동안만 닿으면 퐁! 작아진 사이에 지나가면 된다 (좁은 길에서도 지나갈 틈이 있게)
  // 거미줄: 닿으면 slowMs 동안 느려지고, 그 뒤 coolMs 동안은 다시 걸리지 않는다
  drift: { puddleWetMs: 1800, puddleDryMs: 1300, slowMs: 3000, coolMs: 1500 },
  // 미로 방해물(순찰·움직이는 웅덩이·거미줄·물방울·등불·바람)이 움직이는 빠르기, 탄마다. 1 = 원래대로.
  // 1탄은 2026-11-06 사용자 요청으로 블루나비와 함께 1.5배 (블루나비 빠르기는 forms.js stepMs)
  hazardSpeed: { 1: 1.5, 2: 1 },
  // 글꼴: 제목·버튼은 주아, 대사·설명은 고운돋움 (public/fonts, 자주 쓰는 한글 2,350자만 담음)
  fontTitle: '"Jua", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
  font: '"Gowun Dodum", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
};
