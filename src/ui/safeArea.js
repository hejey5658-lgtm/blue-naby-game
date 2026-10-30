import { UI } from '../data/ui.js';

// 노치·홈 바가 게임 화면과 겹치는 만큼을 게임 좌표(720 기준)로 돌려준다.
// 화면이 9:16보다 길쭉하면 캔버스 위아래에 여백이 생기므로, 실제로 겹치는 만큼만 안쪽으로 민다.
export function getSafeInsets(game) {
  const css = getComputedStyle(document.documentElement);
  const top = parseFloat(css.getPropertyValue('--sat')) || 0;
  const bottom = parseFloat(css.getPropertyValue('--sab')) || 0;
  const rect = game.canvas.getBoundingClientRect();
  const scale = UI.width / rect.width;
  const overlapTop = Math.max(0, top - rect.top);
  const overlapBottom = Math.max(0, bottom - (window.innerHeight - rect.bottom));
  return { top: overlapTop * scale, bottom: overlapBottom * scale };
}
