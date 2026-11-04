import Phaser from 'phaser';
import { ASSETS, ASSET_VERSION, ANIMS } from '../data/assets.js';

// 화면 없이 뒤에서 나머지 장 그림을 미리 받는다 (tech-spec 8절 나눠 받기).
// 처음엔 타이틀·1장 그림만 Boot에서 받고, 나머지는 여기서 플레이하는 동안 받는다.
export function createAnims(scene) {
  for (const a of ANIMS) {
    const tex = scene.textures.exists(a.texture) && scene.textures.get(a.texture);
    if (!tex || scene.anims.exists(a.key) || !a.frames.every((f) => tex.has(f))) continue;
    scene.anims.create({ key: a.key, frames: scene.anims.generateFrameNumbers(a.texture, { frames: a.frames }), frameRate: a.fps, repeat: a.repeat });
  }
}

// 한 파일 버전(blue_butterfly_game.html)은 그림을 window.BB_FILES 에 data URI로 넣어 둔다 (scripts/build-single.mjs)
const assetUrl = (file) => window.BB_FILES?.[file] ?? `${file}?v=${ASSET_VERSION}`;

export function queueAssets(load, textures, filter) {
  let n = 0;
  for (const a of ASSETS.filter(filter)) {
    if (textures.exists(a.key)) continue;
    const url = assetUrl(a.file);
    if (a.frameWidth) load.spritesheet(a.key, url, { frameWidth: a.frameWidth, frameHeight: a.frameHeight });
    else load.image(a.key, url);
    n++;
  }
  return n;
}

// 탄마다 필요한 그림 (모바일 최적화 14절: 하는 탄 그림만 받는다). 2탄은 안내 친구 블루나비(나비) 그림도 쓴다.
// 탄 번호는 저장(state.series)에서 읽는다 — series.js 를 여기서 부르면 서로 부르는 고리가 생겨서.
export const forSeries = (n) => (a) => a.group === 'boot'
  || (n === 2 ? a.group === 's2' || a.key.endsWith('blue_butterfly') || a.key.startsWith('blue_butterfly') : a.group !== 's2');

export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  create() {
    this.load.on('loaderror', (file) => console.warn(`그림을 불러오지 못했어요: ${file.key}`));
    // 장 순서대로 받는다 (다음에 쓸 그림부터). 지금 하는 탄 그림만.
    const want = forSeries(this.game.registry.get('series') ?? 1);
    const order = (g) => (g === 'boot' ? 0 : Number(String(g).replace('ch', '')) || 99);
    const groups = [...new Set(ASSETS.filter(want).map((a) => a.group))].sort((a, b) => order(a) - order(b));
    for (const g of groups) queueAssets(this.load, this.textures, (a) => a.group === g && want(a));
    this.load.once('complete', () => {
      createAnims(this);
      this.game.registry.set('assetsReady', true);
      this.game.events.emit('assets-ready');
    });
    this.load.start();
  }
}

// 이 씬에 필요한 그림이 아직 없으면 "그림 가져오는 중"을 보여 주고, 다 받으면 씬을 다시 시작한다.
// 뒤에서 받는 중이면 그걸 기다리고, 이미 끝났는데 없으면(탄을 바꾼 경우) 그 탄 그림을 이 씬에서 바로 받는다.
export function waitForAssets(scene, keys, data) {
  const missing = keys.filter((k) => k && !scene.textures.exists(k));
  if (!missing.length) return false;
  scene.add.rectangle(0, 0, 720, 1280, 0xe9d8b4).setOrigin(0);
  scene.add.text(360, 640, '다음 여행지 그림을 가져오는 중…', { fontFamily: '"Gowun Dodum", sans-serif', fontSize: '30px', color: '#2b2d5a' }).setOrigin(0.5);
  if (!scene.game.registry.get('assetsReady')) {
    scene.game.events.once('assets-ready', () => scene.scene.restart(data));
    return true;
  }
  const n = scene.game.registry.get('series') ?? 1;
  const want = forSeries(n);
  const queued = queueAssets(scene.load, scene.textures, (a) => want(a) || missing.includes(a.key));
  if (!queued) return false; // 받을 파일이 없으면(이미 실패한 그림) 그냥 그린다
  scene.load.once('complete', () => { createAnims(scene); scene.scene.restart(data); });
  scene.load.start();
  return true;
}
