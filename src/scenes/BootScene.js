import Phaser from 'phaser';
import { ASSETS, ASSET_VERSION } from '../data/assets.js';
import { UI } from '../data/ui.js';
import { createPlaceholders } from '../art/placeholders.js';

// 처음(boot)과 1장 그림만 받고 바로 타이틀로. 받는 동안 애벌레가 진행 막대를 따라 기어간다.
// 없는 그림·실패한 그림은 임시 그림으로 대신한다.
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const { width, height } = UI;
    const barW = 440;
    const x0 = (width - barW) / 2;
    const y = height / 2 + 40;

    const track = this.add.graphics();
    track.fillStyle(0x2b2d5a, 0.12).fillRoundedRect(x0, y - 10, barW, 20, 10);
    const fill = this.add.graphics();
    // 진행 막대의 애벌레는 텍스처가 아직 없으므로 동그라미 세 개로 그린다.
    const crawler = this.add.graphics();
    const drawCrawler = (cx) => {
      crawler.clear();
      [[-22, 9], [-8, 11], [10, 15]].forEach(([dx, r]) => {
        crawler.fillStyle(0x2b2d5a, 1).fillCircle(cx + dx, y - 26, r + 3);
        crawler.fillStyle(0x7ec8ff, 1).fillCircle(cx + dx, y - 26, r);
      });
    };
    drawCrawler(x0 + 24);

    this.load.on('progress', (p) => {
      fill.clear();
      fill.fillStyle(0x7ec8ff, 1).fillRoundedRect(x0, y - 10, Math.max(20, barW * p), 20, 10);
      drawCrawler(x0 + 24 + (barW - 40) * p);
    });
    this.load.on('loaderror', (file) => {
      console.warn(`그림을 불러오지 못해 임시 그림을 씁니다: ${file.key}`);
    });

    for (const a of ASSETS.filter((a) => a.group === 'boot' || a.group === 'ch1')) {
      const url = `${a.file}?v=${ASSET_VERSION}`;
      if (a.frameWidth) this.load.spritesheet(a.key, url, { frameWidth: a.frameWidth, frameHeight: a.frameHeight });
      else this.load.image(a.key, url);
    }
  }

  create() {
    createPlaceholders(this);
    // 캔버스 글자는 글꼴이 준비된 뒤에 그려야 기본 글꼴로 그려지지 않는다. 느린 망에서는 3초까지만 기다린다.
    const fonts = document.fonts
      ? Promise.all([document.fonts.load('40px "Jua"', '블루나비'), document.fonts.load('34px "Gowun Dodum"', '블루나비')])
      : Promise.resolve();
    const timeout = new Promise((r) => setTimeout(r, 3000));
    Promise.race([fonts, timeout]).catch(() => {}).then(() => this.scene.start('Title'));
  }
}
