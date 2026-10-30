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

export function queueAssets(load, textures, filter) {
  let n = 0;
  for (const a of ASSETS.filter(filter)) {
    if (textures.exists(a.key)) continue;
    const url = `${a.file}?v=${ASSET_VERSION}`;
    if (a.frameWidth) load.spritesheet(a.key, url, { frameWidth: a.frameWidth, frameHeight: a.frameHeight });
    else load.image(a.key, url);
    n++;
  }
  return n;
}

export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  create() {
    this.load.on('loaderror', (file) => console.warn(`그림을 불러오지 못했어요: ${file.key}`));
    // 장 순서대로 받는다 (다음에 쓸 그림부터)
    const order = (g) => (g === 'boot' ? 0 : Number(String(g).replace('ch', '')) || 99);
    const groups = [...new Set(ASSETS.map((a) => a.group))].sort((a, b) => order(a) - order(b));
    for (const g of groups) queueAssets(this.load, this.textures, (a) => a.group === g);
    this.load.once('complete', () => {
      createAnims(this);
      this.game.registry.set('assetsReady', true);
      this.game.events.emit('assets-ready');
    });
    this.load.start();
  }
}

// 이 씬에 필요한 그림이 아직 없으면 "그림 가져오는 중"을 보여 주고, 다 받으면 씬을 다시 시작한다.
export function waitForAssets(scene, keys, data) {
  const missing = keys.filter((k) => k && !scene.textures.exists(k));
  if (!missing.length || scene.game.registry.get('assetsReady')) return false;
  scene.add.rectangle(0, 0, 720, 1280, 0xe9d8b4).setOrigin(0);
  scene.add.text(360, 640, '다음 여행지 그림을 가져오는 중…', { fontFamily: '"Gowun Dodum", sans-serif', fontSize: '30px', color: '#2b2d5a' }).setOrigin(0.5);
  scene.game.events.once('assets-ready', () => scene.scene.restart(data));
  return true;
}
