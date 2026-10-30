// 화면 위아래(또는 양옆) 여백을 지금 장의 테마 색으로 칠한다.
// bottom을 주면 위쪽 여백과 아래쪽 여백을 다른 색으로(예: 벽과 바닥) 칠한다.
export function setTheme(color, bottom = color) {
  const root = document.documentElement.style;
  root.setProperty('--theme', color);
  root.setProperty('--theme-bottom', bottom);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}
