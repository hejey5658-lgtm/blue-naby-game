// 서비스 워커 등록과 새 버전 안내. 플레이 중에는 갑자기 새로고침하지 않고,
// 타이틀·여권에서만 "새 버전이 있어요" 띠를 보여 준다 (web-release 5절).
import { platform } from './platform.js';

let updateSW = null;

export function setupPWA(game) {
  if (platform.isFile || !('serviceWorker' in navigator) || import.meta.env.DEV) return;
  import('virtual:pwa-register').then(({ registerSW }) => {
    updateSW = registerSW({
      onNeedRefresh() {
        game.registry.set('updateReady', true);
        game.events.emit('update-ready');
      },
    });
  }).catch(() => { /* 서비스 워커가 안 돼도 게임은 그대로 */ });
}

export function applyUpdate() {
  try {
    if (updateSW) updateSW(true);
    else location.reload();
  } catch { location.reload(); }
}
