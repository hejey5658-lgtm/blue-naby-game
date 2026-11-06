import { UI } from '../data/ui.js';

// 노치·홈 바가 게임 화면과 겹치는 만큼을 게임 좌표(720 기준)로 돌려준다.
// 화면이 9:16보다 길쭉하면 캔버스 위아래에 여백이 생기므로, 실제로 겹치는 만큼만 안쪽으로 민다.
// full = 캔버스 전체(fullHeight)를 쓰는 화면(미로·입구). 아니면 가운데 1280 칸 기준으로(위아래 offY 만큼 이미 떨어져 있음).
export function getSafeInsets(game, full = false) {
  const css = getComputedStyle(document.documentElement);
  const top = parseFloat(css.getPropertyValue('--sat')) || 0;
  const bottom = parseFloat(css.getPropertyValue('--sab')) || 0;
  const rect = game.canvas.getBoundingClientRect();
  const scale = UI.fullWidth / rect.width;
  const overlapTop = Math.max(0, top - rect.top);
  const overlapBottom = Math.max(0, bottom - (window.innerHeight - rect.bottom));
  const off = full ? 0 : UI.offY;
  // 가로: 노치·홈 바가 왼쪽·오른쪽·아래에 온다. 가로 배치 화면은 보이는 곳(view)의 가장자리 기준이라 그대로 돌려준다.
  const left = (parseFloat(css.getPropertyValue('--sal')) || 0) * scale;
  const right = (parseFloat(css.getPropertyValue('--sar')) || 0) * scale;
  if (UI.landscape) return { top: overlapTop * scale, bottom: overlapBottom * scale, left, right };
  return { top: Math.max(0, overlapTop * scale - off), bottom: Math.max(0, overlapBottom * scale - (full ? 0 : UI.fullHeight - UI.height - UI.offY)), left: 0, right: 0 };
}
