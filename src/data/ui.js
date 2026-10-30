// 화면 배치·크기 수치 (기준 화면 720×1280). 기획자가 직접 고쳐도 된다.
export const UI = {
  width: 720,
  height: 1280,
  minTouch: 96,
  gap: 16,
  fontSize: { dialogue: 34, button: 36, hud: 30, title: 72, small: 22 },
  swipeMinPx: 40,
  vibrate: { collect: 15, bump: 40, special: [30, 40, 30], cocoon: 20, stamp: 40 },
  // 글꼴: 제목·버튼은 주아, 대사·설명은 고운돋움 (public/fonts, 자주 쓰는 한글 2,350자만 담음)
  fontTitle: '"Jua", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
  font: '"Gowun Dodum", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
};
