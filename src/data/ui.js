// 화면 배치·크기 수치 (기준 화면 720×1280). 기획자가 직접 고쳐도 된다.
export const UI = {
  width: 720,
  height: 1280,
  minTouch: 96,
  gap: 16,
  fontSize: { dialogue: 34, button: 36, hud: 30, title: 72, small: 22 },
  swipeMinPx: 40,
  vibrate: { collect: 15, bump: 40, special: [30, 40, 30], cocoon: 20, stamp: 40 },
  // 임시 글꼴. 글꼴이 정해지면(주아·고운돋움 제안) 여기만 바꾼다.
  font: '"Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif',
};
