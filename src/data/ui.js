// 화면 배치·크기 수치 (기준 화면 720×1280). 기획자가 직접 고쳐도 된다.
export const UI = {
  width: 720,
  height: 1280,
  minTouch: 96,
  gap: 16,
  fontSize: { dialogue: 34, button: 36, hud: 30, title: 72, small: 22 },
  swipeMinPx: 40,
  vibrate: { collect: 15, bump: 40, special: [30, 40, 30], cocoon: 20, stamp: 40 },
  // 2장 밤 골목 어둠: 블루나비 둘레 밝은 칸 수, 반짝가루를 쓰면 넓어지는 칸 수·시간
  // (2026-11-01 친구 의견 "2장 미로가 너무 어렵다"로 2.5칸·5칸·8초에서 넓힘. 달빛가루·출구는 어둠 위로 보인다)
  dark: { radius: 3.5, sparkleRadius: 6, sparkleMs: 12000 },
  // 글꼴: 제목·버튼은 주아, 대사·설명은 고운돋움 (public/fonts, 자주 쓰는 한글 2,350자만 담음)
  fontTitle: '"Jua", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
  font: '"Gowun Dodum", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
};
