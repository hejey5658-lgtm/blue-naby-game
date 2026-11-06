// 화면 배치·크기 수치 (기준 화면 720×1280). 기획자가 직접 고쳐도 된다.
// 화면 맞춤 (2026-11-06 "빈 화면 최소화" + 18절 "세로·가로 자유롭게"):
// - width·height = 세로 기준 화면 720×1280. 대부분의 화면은 이 좌표로 그린다.
// - fullWidth·fullHeight = 실제 캔버스 크기. 세로 화면은 720×(1280~1600), 가로 화면은 (1280~1600)×720.
//   모바일 전용(2026-11-06): PC 창도 폰과 같은 배치(창이 가로면 가로 배치), PC 전용 안내·QR 없음.
// - offX·offY = 기준 화면을 캔버스 가운데에 둘 때의 여백(가로에선 offY가 음수: 기준 화면의 위아래가 잘려 보임).
//   카메라를 (-offX, -offY)만큼 옮겨 보므로, 보이는 곳은 view = { left, top, right, bottom } (기준 좌표).
// - landscape = 가로 배치. 화면마다 UI.landscape 를 보고 view 안에 다시 배치한다.
//   미로·입구는 카메라를 옮기지 않고 캔버스 좌표(0~fullWidth, 0~fullHeight)를 그대로 쓴다.
export function measureLayout() {
  try {
    const w = window.innerWidth, h = window.innerHeight;
    if (!w || !h) return { landscape: false, fullWidth: 720, fullHeight: 1280 };
    const clamp = (v) => Math.round(Math.min(1600, Math.max(1280, v)));
    if (w > h) return { landscape: true, fullWidth: clamp((720 * w) / h), fullHeight: 720 };
    return { landscape: false, fullWidth: 720, fullHeight: clamp((720 * h) / w) };
  } catch { return { landscape: false, fullWidth: 720, fullHeight: 1280 }; }
}

// 가로 배치에서 카메라를 zoom 배로 (cx, cy) 가운데로 볼 때 보이는 곳 (기준 좌표). 화면의 landscapeView() 가 돌려준다.
export function landView(zoom, cx, cy) {
  const w = UI.fullWidth / zoom, h = UI.fullHeight / zoom;
  return { zoom, x: cx, y: cy, left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2, w, h };
}

export function applyLayout(m) {
  Object.assign(UI, m);
  UI.offX = Math.round((m.fullWidth - 720) / 2);
  UI.offY = Math.round((m.fullHeight - 1280) / 2);
  UI.view = { left: -UI.offX, top: -UI.offY, right: 720 + UI.offX, bottom: 1280 + UI.offY, cx: 360, cy: 640, w: m.fullWidth, h: m.fullHeight };
}

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
  // 달리기 에너지 (design-brief 15절): 한 칸 움직이면 step 만큼 줄고, 수집품 +item, 숨은 친구를 찾으면 +find,
  // 체크포인트에 닿으면 적어도 checkpoint 까지. 0이면 tiredSlow 배 느리게 기어간다(멈추지 않음).
  // 단계마다 숨는 곳·수집품을 가까운 순서로 다 돌아도 0이 되지 않게 맞춤 (scripts/check-maze.mjs 가 계산)
  energy: { max: 100, step: 1.2, item: 30, find: 10, checkpoint: 50, tiredSlow: 2 },
  // 씽씽 자전거(킥보드): 이 시간 동안 2배 빠르게, 에너지가 줄지 않음
  bikeMs: 10000,
  // 글꼴: 제목·버튼은 주아, 대사·설명은 고운돋움 (public/fonts, 자주 쓰는 한글 2,350자만 담음)
  fontTitle: '"Jua", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
  font: '"Gowun Dodum", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
};
applyLayout(measureLayout());
