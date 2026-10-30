import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { waitForAssets } from './PreloadScene.js';
import { PUZZLES } from '../data/puzzles.js';
import { state } from '../state.js';
import { setTheme } from '../ui/theme.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { Button } from '../ui/Button.js';
import { sfx } from '../ui/feedback.js';
import { ensurePuzzlePictures, PICTURE_DEPENDS } from '../puzzle/pictures.js';

// 블록 퍼즐 목록 (systems.md 11절): 5개국 5단계, 앞 단계를 완성해야 다음 단계가 열린다.
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export function puzzleOpen(i) {
  return i === 0 || !!state.puzzle?.cleared?.[PUZZLES[i - 1].id];
}

export class PuzzleListScene extends Phaser.Scene {
  constructor() { super('PuzzleList'); }

  init(data) { this.initData = data; }

  create() {
    if (waitForAssets(this, PICTURE_DEPENDS, this.initData)) return;
    setTheme('#ffe9c4', '#ffe9c4');
    ensurePuzzlePictures(this);
    const top = getSafeInsets(this.game).top;
    this.add.rectangle(0, 0, UI.width, UI.height, 0xffe9c4).setOrigin(0);
    // 바탕: 조각 모양 무늬
    const bg = this.add.graphics();
    for (let y = 0; y < UI.height; y += 80) for (let x = (y / 80) % 2 ? 40 : 0; x < UI.width; x += 80) bg.fillStyle(0xffb347, 0.12).fillRoundedRect(x + 8, y + 8, 56, 56, 12);

    this.add.text(UI.width / 2, 70 + top, '블루나비 블록 퍼즐', { fontFamily: UI.fontTitle, fontSize: '46px', color: '#2b2d5a' }).setOrigin(0.5);
    const all = PUZZLES.every((p) => state.puzzle?.cleared?.[p.id]);
    this.add.text(UI.width / 2, 120 + top, all ? '모든 퍼즐 완성! 대단해!' : '그림 조각을 끌어다 제자리에 놓아요', { fontFamily: UI.font, fontSize: '24px', color: all ? '#c0563a' : '#5a5c88' }).setOrigin(0.5);

    PUZZLES.forEach((p, i) => this.card(p, i, 170 + top + i * 186));

    new Button(this, UI.width / 2, 1200 - getSafeInsets(this.game).bottom, {
      width: 320, height: 96, fontSize: 30, label: '타이틀로', color: 0xfdf7ea, shade: 0xc9c0ae, textColor: '#2b2d5a',
      onPress: () => { sfx('tap'); this.scene.start('Title'); },
    });
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('Title'));
  }

  card(p, i, y) {
    const open = puzzleOpen(i);
    const done = !!state.puzzle?.cleared?.[p.id];
    const c = this.add.container(0, y);
    const g = this.add.graphics();
    g.fillStyle(0x2b2d5a, 0.12).fillRoundedRect(44, 8, 632, 166, 28);
    g.fillStyle(open ? 0xffffff : 0xf1e6d2, 1).fillRoundedRect(40, 0, 640, 166, 28);
    c.add(g);
    const thumb = this.add.image(120, 83, `puzzle_${p.id}`, '__BASE').setDisplaySize(118, 138);
    if (!open) thumb.setTint(0x8a8cae).setAlpha(0.5);
    c.add(thumb);
    c.add(this.add.text(204, 48, `${i + 1}단계 · ${p.title}`, { fontFamily: UI.fontTitle, fontSize: '34px', color: open ? '#2b2d5a' : '#8a8cae' }).setOrigin(0, 0.5));
    c.add(this.add.text(204, 98, `${p.pieces.length}조각${done && state.puzzle.best?.[p.id] != null ? ` · 최고 기록 ${fmt(state.puzzle.best[p.id])}` : ''}`, { fontFamily: UI.font, fontSize: '24px', color: '#5a5c88' }).setOrigin(0, 0.5));
    if (!open) {
      c.add(this.add.text(204, 136, `${PUZZLES[i - 1].title} 퍼즐을 맞추면 열려요`, { fontFamily: UI.font, fontSize: '20px', color: '#8a8cae' }).setOrigin(0, 0.5));
      const lock = this.add.graphics();
      lock.lineStyle(8, 0x8a8cae, 1).strokeCircle(612, 70, 18);
      lock.fillStyle(0x8a8cae, 1).fillRoundedRect(588, 74, 48, 40, 8);
      c.add(lock);
    } else if (done) {
      const st = this.add.container(610, 83).setAngle(-12);
      const sg = this.add.graphics();
      sg.lineStyle(5, 0xe8584a, 1).strokeCircle(0, 0, 48);
      st.add([sg, this.add.text(0, 0, '완성!', { fontFamily: UI.fontTitle, fontSize: '28px', color: '#e8584a' }).setOrigin(0.5)]);
      c.add(st);
    } else {
      const pg = this.add.graphics();
      pg.fillStyle(0x2f7bff, 1).fillCircle(612, 83, 40);
      pg.fillStyle(0xffffff, 1).fillTriangle(600, 64, 600, 102, 632, 83);
      c.add(pg);
    }
    if (open) {
      c.setSize(640, 166).setInteractive(new Phaser.Geom.Rectangle(40, 0, 640, 166), Phaser.Geom.Rectangle.Contains);
      c.input.cursor = 'pointer';
      c.on('pointerup', () => { sfx('tap'); this.scene.start('Puzzle', { id: p.id }); });
    }
  }
}
