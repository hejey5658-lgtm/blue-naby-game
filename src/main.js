import Phaser from 'phaser';
import { UI, measureLayout, applyLayout } from './data/ui.js';
import { platform } from './platform.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { DialogueScene } from './scenes/DialogueScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { EntryScene } from './scenes/EntryScene.js';
import { MazeScene } from './scenes/MazeScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { MapScene } from './scenes/MapScene.js';
import { EvolutionScene } from './scenes/EvolutionScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { EndingScene } from './scenes/EndingScene.js';
import { DuoScene } from './scenes/DuoScene.js';
import { PopScene } from './scenes/PopScene.js';
import { MatchScene } from './scenes/MatchScene.js';
import { Title2Scene } from './scenes/Title2Scene.js';
import { AlbumScene } from './scenes/AlbumScene.js';
import { DressScene } from './scenes/DressScene.js';
import { Ending2Scene } from './scenes/Ending2Scene.js';
import { state, save } from './state.js';
import { initSeries, SERIES } from './series.js';
import { setupPWA } from './pwa.js';
import { readChallengeFromUrl } from './social/social.js';
import { readMatchFromUrl } from './social/match.js';
import { suspendAudio, unlockAudio } from './ui/feedback.js';
import { wantMusic, refreshMusic, nowPlaying } from './ui/music.js';
import { unlockSpeech } from './ui/narrator.js';
import { SCENE_SONG } from './data/music.js';

// 마지막에 하던 탄(1탄 블루나비 / 2탄 포포)의 데이터로
initSeries();
// 도전 링크(#c=…)로 들어왔으면 도전장함에 넣는다
readChallengeFromUrl();
// 각자 폰 대결 링크(#d=…)로 들어왔으면 대결함에 넣는다 (타이틀이 바로 대결 화면을 연다)
readMatchFromUrl();

const game = new Phaser.Game({
  // 주소 끝에 ?canvas 를 붙이면 WebGL 대신 캔버스로 그린다(자동 화면 확인·오래된 기기 확인용)
  type: new URLSearchParams(location.search).has('canvas') ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  transparent: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // 실제 캔버스 크기 (세로 폰 720×길게, 가로 폰 길게×720 — ui.js measureLayout)
    width: UI.fullWidth,
    height: UI.fullHeight,
  },
  input: { activePointers: 2 },
  render: { antialias: true, powerPreference: 'high-performance' },
  scene: [BootScene, PreloadScene, EntryScene, TitleScene, MazeScene, MapScene, EvolutionScene, EndingScene, PopScene, DuoScene, MatchScene, Title2Scene, AlbumScene, DressScene, Ending2Scene, DialogueScene, PauseScene, SettingsScene],
});
// 하는 탄 그림만 받기 (모바일 최적화): PreloadScene·waitForAssets 가 registry 'series'를 본다
game.registry.set('series', state.series === 2 ? 2 : 1);
SERIES.game = game;

// 배경음 (나라·계절마다 다른 곡, [소리] 설정 하나로): 화면이 열릴 때 그 화면 곡으로. 미로는 그 단계(속 id) 곡.
game.events.once('ready', () => {
  const keys = new Set([...Object.keys(SCENE_SONG[1]), ...Object.keys(SCENE_SONG[2]), 'Maze']);
  for (const key of keys) {
    const sc = game.scene.getScene(key);
    sc?.events.on('create', () => {
      if (key === 'Maze') { if (sc.chapter) wantMusic(sc.chapter.id); return; }
      const song = SCENE_SONG[SERIES.n][key] ?? SCENE_SONG[1][key];
      if (song) wantMusic(song);
    });
  }
});
// 캔버스가 화면 비율대로 길어졌으므로(ui.js fullHeight): 미로·입구는 전체 높이로 배치하고, 나머지 화면은 1280 칸을 가운데에 그린다
const FULL_SCENES = new Set(['Maze', 'Entry']);
game.events.once('ready', () => {
  for (const sc of game.scene.scenes) {
    sc.events.on('create', () => {
      const cam = sc.cameras.main;
      // 기준 720×1280 칸을 가운데로: 카메라를 (offX, offY) 만큼 옮겨 본다(가로에선 위아래가 잘리고 양옆이 넓어짐).
      // 바탕·어둡게 덮는 판은 (-offX, -offY)부터 fullWidth×fullHeight 로 끝까지 칠한다.
      // 가로에서 화면이 landscapeView()(landView)를 주면 그 배율·가운데로 본다 (그림을 조금 줄이고 버튼을 옆으로 옮긴 배치)
      const lv = UI.landscape && !FULL_SCENES.has(sc.scene.key) ? sc.landscapeView?.() : null;
      cam.setZoom(lv ? lv.zoom : 1);
      if (FULL_SCENES.has(sc.scene.key)) cam.setScroll(0, 0);
      else if (lv) cam.centerOn(lv.x, lv.y);
      else cam.setScroll(-UI.offX, -UI.offY);
    });
  }
});
// 폰은 첫 탭 전에는 소리를 못 낸다 → 아무 데나 처음 톡 하면 오디오를 열고 지금 화면 곡을 시작
window.addEventListener('pointerdown', () => { unlockAudio(); if (!nowPlaying()) setTimeout(refreshMusic, 50); }, { passive: true });
// 해설 음성: 아이폰은 손가락을 뗄 때(터치 끝) 첫 읽기를 풀어 둬야 나중에 읽힌다
for (const ev of ['touchend', 'click']) window.addEventListener(ev, unlockSpeech, { passive: true, once: true });

// 길쭉한 폰(20:9 등): 남는 위아래 여백 중 아래쪽을 줄여 게임을 엄지 쪽으로 조금 내린다 (홈 바 안전 영역은 남김, 모바일 최적화 14절)
function nudgeCanvas() {
  const c = game.canvas;
  if (!c) return;
  const h = c.getBoundingClientRect().height;
  const free = window.innerHeight - h;
  if (free < 24) return;
  const sab = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sab')) || 0;
  c.style.marginTop = `${Math.round(Math.max(0, Math.min(free * 0.72, free - sab)))}px`;
  // 캔버스 위치가 바뀌었음을 Phaser에 알려야 손가락 위치가 맞는다 (안 하면 긴 폰에서 버튼이 안 눌림)
  game.scale.updateBounds();
}
game.scale.on('resize', () => requestAnimationFrame(nudgeCanvas));
game.events.once('ready', () => requestAnimationFrame(nudgeCanvas));

// 느린 폰: 초당 그림 수가 5초 넘게 40 아래면 배경 움직임(햇살·꽃잎·눈 등)을 줄인다. 다음 화면부터 적용.
let slowSince = 0;
game.events.on('step', (time) => {
  if (platform.reducedMotion) return;
  if (game.loop.actualFps < 40) {
    slowSince ||= time;
    if (time - slowSince > 5000) { platform.reducedMotion = true; console.info('느린 기기: 배경 움직임을 줄였어요'); }
  } else slowSince = 0;
});

// 게임이 이미 열린 탭에서 대결·도전 링크를 열면 주소의 # 부분만 바뀌고 새로 읽히지 않는다 → 그때도 읽어서 대결 화면으로
window.addEventListener('hashchange', () => {
  readChallengeFromUrl();
  const m = readMatchFromUrl();
  if (!m) return;
  state.pendingMatch = null;
  save();
  // 대결 화면을 보던 중이면 그 화면을 다시 그리고(같은 씬을 같은 순간에 멈췄다 켜면 안 켜진다), 아니면 대결 화면으로
  for (const sc of game.scene.getScenes(true)) if (sc.scene.key !== 'Preload' && sc.scene.key !== 'Match') sc.scene.stop();
  const match = game.scene.getScene('Match');
  if (match.scene.isActive()) match.scene.restart({ id: m.id });
  else game.scene.start('Match', { id: m.id });
});

// 브라우저 기본 동작 막기: 당겨서 새로고침, 두 번 탭 확대, 길게 눌러 메뉴, 핀치 확대.
// 글자를 입력하는 칸(저장 코드 등)은 예외.
const allowNative = (e) => e.target.closest?.('input, textarea, [data-allow-touch]');
document.addEventListener('touchmove', (e) => { if (!allowNative(e)) e.preventDefault(); }, { passive: false });
document.addEventListener('contextmenu', (e) => { if (!allowNative(e)) e.preventDefault(); });
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

// 세로·가로 자유롭게 (design-brief 18절): 방향이 바뀌면 캔버스 크기를 바꾸고 지금 화면을 새 배치로 다시 그린다.
// 하던 것은 각 화면의 snapshot()(없으면 처음 받은 데이터)으로 이어 간다. 대사·일시정지·설정 창이 떠 있거나
// 화면이 canRelayout() 으로 '지금은 안 돼'(진화 연출·퐁퐁 게임 중 등)라고 하면 끝날 때까지 기다린다(그동안은 예전 배치로 맞춰 보임).
const OVERLAYS = ['Dialogue', 'Pause', 'Settings'];
let pendingLayout = null;
function checkOrientation() {
  const m = measureLayout();
  const changed = m.landscape !== UI.landscape
    || Math.abs(m.fullWidth - UI.fullWidth) > 60 || Math.abs(m.fullHeight - UI.fullHeight) > 60; // 주소창이 나타났다 사라지는 정도는 무시
  pendingLayout = changed ? m : null;
  if (!document.hidden) game.loop.wake();
}
function canRelayoutNow() {
  const act = game.scene.getScenes(true);
  if (act.some((s) => s.scene.key === 'Boot' || OVERLAYS.includes(s.scene.key))) return false;
  const main = act.find((s) => s.scene.key !== 'Preload');
  return !!main && (main.canRelayout?.() ?? true);
}
game.events.on('step', () => {
  if (!pendingLayout || !canRelayoutNow()) return;
  const m = pendingLayout;
  pendingLayout = null;
  const scenes = game.scene.getScenes(true).filter((s) => s.scene.key !== 'Preload');
  const snaps = scenes.map((s) => [s, s.snapshot?.() ?? s.sys.settings.data ?? {}]);
  applyLayout(m);
  game.scale.setGameSize(UI.fullWidth, UI.fullHeight);
  for (const [s, data] of snaps) s.scene.restart(data);
  requestAnimationFrame(nudgeCanvas);
});

// 주소창이 나타났다 사라지며 화면 크기가 바뀌므로, 잠시 뒤 화면 맞춤을 다시 하고 방향을 본다.
let resizeTimer = 0;
function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    game.scale.refresh();
    checkOrientation();
  }, 150);
}
(window.visualViewport || window).addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);

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

setupPWA(game);
// 자동 시험용: 개발 중이거나 ?canvas 주소일 때만 (실제 플레이에는 영향 없음)
if (import.meta.env.DEV || new URLSearchParams(location.search).has('canvas')) window.__game = game;
