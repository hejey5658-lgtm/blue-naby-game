import Phaser from 'phaser';
import { UI } from './data/ui.js';
import { platform } from './platform.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { DialogueScene } from './scenes/DialogueScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { MazeScene } from './scenes/MazeScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { save } from './state.js';
import { suspendAudio, unlockAudio } from './ui/feedback.js';

const game = new Phaser.Game({
  // 주소 끝에 ?canvas 를 붙이면 WebGL 대신 캔버스로 그린다(자동 화면 확인·오래된 기기 확인용)
  type: new URLSearchParams(location.search).has('canvas') ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  transparent: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: UI.width,
    height: UI.height,
  },
  input: { activePointers: 2 },
  render: { antialias: true, powerPreference: 'high-performance' },
  scene: [BootScene, TitleScene, MazeScene, DialogueScene, PauseScene, SettingsScene],
});

// 브라우저 기본 동작 막기: 당겨서 새로고침, 두 번 탭 확대, 길게 눌러 메뉴, 핀치 확대.
// 글자를 입력하는 칸(저장 코드 등)은 예외.
const allowNative = (e) => e.target.closest?.('input, textarea, [data-allow-touch]');
document.addEventListener('touchmove', (e) => { if (!allowNative(e)) e.preventDefault(); }, { passive: false });
document.addEventListener('contextmenu', (e) => { if (!allowNative(e)) e.preventDefault(); });
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

// 폰을 가로로 들면 덮개를 보여 주고 게임을 멈춘다. 태블릿·PC(짧은 변 600px 이상)는 그대로.
const rotate = document.getElementById('rotate');
function checkOrientation() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const sideways = w > h && Math.min(w, h) < 600 && platform.isTouch;
  rotate.classList.toggle('show', sideways);
  if (sideways) game.loop.sleep();
  else if (!document.hidden) game.loop.wake();
}

// 주소창이 나타났다 사라지며 화면 높이가 바뀌므로, 잠시 뒤 화면 맞춤을 다시 한다.
let resizeTimer = 0;
function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    game.scale.refresh();
    checkOrientation();
  }, 100);
}
(window.visualViewport || window).addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
checkOrientation();

// 다른 앱·탭으로 가면 멈추고, 돌아오면 이어서 (저장·일시정지 메뉴는 6단계)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.events.emit('app-hidden');
    save();
    suspendAudio();
    game.loop.sleep();
  } else {
    unlockAudio();
    checkOrientation();
  }
});
window.addEventListener('pagehide', () => save());
window.addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  game.events.emit('app-hidden');
  checkOrientation();
});

if (import.meta.env.DEV) window.__game = game;
