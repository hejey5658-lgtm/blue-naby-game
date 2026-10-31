// 화면 아래·위에 띄우는 띠: 새 버전 안내(타이틀·여권만), 인앱 브라우저 안내(타이틀)
import { UI } from '../data/ui.js';
import { applyUpdate } from '../pwa.js';
import { shouldShowInAppBand, closeInAppBand, openInBrowser } from './helpers7.js';
import { sfx } from './feedback.js';

function band(scene, y, color, text, actionLabel, onAction, onClose) {
  const c = scene.add.container(UI.width / 2, y).setDepth(30);
  const g = scene.add.graphics();
  g.fillStyle(0x2b2d5a, 0.18).fillRoundedRect(-344, -38, 692, 84, 28);
  g.fillStyle(color, 1).fillRoundedRect(-346, -42, 692, 84, 28);
  const t = scene.add.text(-322, 0, text, { fontFamily: UI.font, fontSize: '22px', color: '#ffffff', wordWrap: { width: 380, useAdvancedWrap: true } }).setOrigin(0, 0.5);
  const bg = scene.add.graphics();
  bg.fillStyle(0xffffff, 1).fillRoundedRect(84, -30, 196, 60, 30);
  const bt = scene.add.text(182, 0, actionLabel, { fontFamily: UI.fontTitle, fontSize: '24px', color: '#2b2d5a' }).setOrigin(0.5);
  const hit = scene.add.zone(84, -40, 196, 80).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerup', () => { sfx('tap'); onAction(); });
  c.add([g, t, bg, bt, hit]);
  if (onClose) {
    const x = scene.add.text(318, 0, '닫기', { fontFamily: UI.font, fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
    const xh = scene.add.zone(290, -40, 60, 80).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerup', () => { onClose(); c.destroy(); });
    c.add([x, xh]);
  }
  c.setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, duration: 300 });
  return c;
}

// 새 버전이 받아져 있으면 띠를 보여 준다 (플레이 중에는 갑자기 새로고침하지 않음)
export function updateBand(scene, y) {
  const show = () => {
    if (scene.updateBandShown || !scene.sys.isActive()) return;
    scene.updateBandShown = true;
    band(scene, y, 0x2f7bff, '새 버전이 있어요! 새로고침하면 바로 바뀌어요. (진행은 그대로)', '새로고침', () => applyUpdate());
  };
  scene.updateBandShown = false;
  if (scene.game.registry.get('updateReady')) show();
  scene.game.events.on('update-ready', show);
  scene.events.once('shutdown', () => scene.game.events.off('update-ready', show));
}

export function inAppBand(scene, y) {
  if (!shouldShowInAppBand()) return null;
  return band(scene, y, 0x4f9f4c, '브라우저에서 열면 홈 화면에 추가하고 저장도 더 안전해요', '브라우저로 열기', () => openInBrowser(), () => closeInAppBand());
}
