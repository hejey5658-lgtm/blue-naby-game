import Phaser from 'phaser';
import { UI, landView } from '../data/ui.js';
import { CHAPTERS, stageLabel } from '../data/chapters.js';
import { BOSSES } from '../data/bosses.js';
import { state, save } from '../state.js';
import { setTheme } from '../ui/theme.js';
import { drawPanel } from '../ui/frames.js';
import { Button } from '../ui/Button.js';
import { sfx, vibrate } from '../ui/feedback.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { chapterById, isCleared, nextChapterId, startChapter } from '../flow.js';
import { SERIES } from '../series.js';

// 2탄 여행 지도 = 사계절 앨범 (docs/concept-2.md, design-brief 13절). 계절마다 한 쪽: 폴라로이드 사진 한 장 + 친구 스티커.
// 별 칸·숫자는 없다 (사용자 결정). 깬 계절 사진을 톡 → 다시 하기. 막 깬 계절은 '찰칵' 하고 사진이 내려온다.
// scene.start('Album', { justCleared })
const SKY = { spring: [0xfde3ea, 0xffc2d6], summer: [0xd6efff, 0x7fc7ff], autumn: [0xfbe7c2, 0xf2a23a], winter: [0xe6f0fa, 0xffffff] };
const PHOTO = { x: 110, y: 300, w: 500, h: 520 };

export class AlbumScene extends Phaser.Scene {
  constructor() { super('Album'); }

  init(data) {
    this.justCleared = data.justCleared ?? null;
    const target = this.justCleared ?? nextChapterId() ?? CHAPTERS[CHAPTERS.length - 1].id;
    this.page = data.page ?? Math.max(0, CHAPTERS.findIndex((c) => c.id === target));
  }

  create() {
    setTheme('#fdf7ea', '#fdf7ea');
    this.top = getSafeInsets(this.game).top;
    this.add.rectangle(-2000, -2000, 4720, 5280, 0xf3e3c3).setOrigin(0);
    // 앨범 표지 느낌: 천 무늬 띠
    const g = this.add.graphics();
    g.fillStyle(0xe0aa7e, 1).fillRect(0, 0, 60, UI.height);
    for (let y = 30; y < UI.height; y += 70) g.fillStyle(0xfdf7ea, 1).fillCircle(30, y, 9);
    // 가로 (18절): 사진은 왼쪽, 제목·스티커·버튼은 오른쪽 칸
    this.land = UI.landscape;
    if (this.land) this.top = 0;
    this.add.text(this.land ? 1060 : UI.width / 2 + 30, this.land ? 250 : 110 + this.top, '포포의 사계절 앨범', { fontFamily: UI.fontTitle, fontSize: '54px', color: '#2b2d5a' }).setOrigin(0.5);
    this.layer = this.add.container(0, 0);
    this.drawPage(this.page, this.justCleared);
    this.makeNav();
    this.makeBottom();
    this.input.keyboard?.on('keydown-LEFT', () => this.turn(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.turn(1));
  }

  turn(d) {
    const n = Phaser.Math.Clamp(this.page + d, 0, CHAPTERS.length - 1);
    if (n === this.page) return;
    sfx('tap');
    this.page = n;
    this.drawPage(n, null);
    this.updateNav();
  }

  drawPage(i, snap) {
    const L = this.layer;
    L.removeAll(true);
    const ch = CHAPTERS[i];
    const done = isCleared(ch.id);
    const isNext = ch.id === nextChapterId();
    const top = this.top;
    L.add(this.add.text(this.land ? 1060 : UI.width / 2 + 30, this.land ? 330 : 196 + top, `${stageLabel(ch)} · ${ch.place}`, { fontFamily: UI.fontTitle, fontSize: '32px', color: '#2f7bff' }).setOrigin(0.5));
    const photo = this.add.container(UI.width / 2 + 30, PHOTO.y + PHOTO.h / 2 + top);
    const pg = this.add.graphics();
    const { w, h } = PHOTO;
    pg.fillStyle(0x2b2d5a, 0.15).fillRoundedRect(-w / 2 + 6, -h / 2 + 10, w, h, 10);
    pg.fillStyle(0xffffff, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    photo.add(pg);
    const iw = w - 40, ih = h - 130;
    if (done) {
      // 사진 속: 그 계절 하늘·땅 + 그 계절 옷을 입은 포포 + 친구
      const [sky, accent] = SKY[ch.country] ?? SKY.spring;
      const sg = this.add.graphics();
      sg.fillStyle(sky, 1).fillRect(-iw / 2, -h / 2 + 20, iw, ih);
      sg.fillStyle(accent, 0.8).fillEllipse(0, -h / 2 + 20 + ih, iw * 1.1, ih * 0.5);
      for (let k = 0; k < 6; k++) sg.fillStyle(accent, 0.7).fillCircle(-iw / 2 + 40 + k * (iw / 6), -h / 2 + 60 + (k % 2) * 30, 14);
      photo.add(sg);
      const heroKey = `blue_${ch.form}_battle`;
      if (this.textures.exists(heroKey)) photo.add(this.add.image(-70, -h / 2 + 20 + ih - 120, heroKey, 6).setDisplaySize(210, 210));
      const boss = ch.bosses[0];
      if (this.textures.exists(`boss_${boss}`)) photo.add(this.add.image(110, -h / 2 + 20 + ih - 110, `boss_${boss}`, 3).setDisplaySize(180, 180));
      photo.add(this.add.text(0, h / 2 - 56, `${ch.name}의 포포`, { fontFamily: UI.fontTitle, fontSize: '34px', color: '#2b2d5a' }).setOrigin(0.5));
      const sec = state.records[ch.id]?.mazeSec;
      if (sec != null) photo.add(this.add.text(0, h / 2 - 20, `미로 ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, { fontFamily: UI.font, fontSize: '22px', color: '#5a5c88' }).setOrigin(0.5));
      photo.setSize(w, h).setInteractive({ useHandCursor: true }).on('pointerup', () => this.askReplay(ch.id));
      photo.setAngle(i % 2 ? 2.5 : -2.5);
    } else {
      const eg = this.add.graphics();
      eg.lineStyle(4, isNext ? 0x2f7bff : 0xb8b8c8, 1);
      for (let x = -iw / 2; x < iw / 2; x += 24) eg.lineBetween(x, -h / 2 + 20, Math.min(x + 12, iw / 2), -h / 2 + 20).lineBetween(x, -h / 2 + 20 + ih, Math.min(x + 12, iw / 2), -h / 2 + 20 + ih);
      for (let y = -h / 2 + 20; y < -h / 2 + 20 + ih; y += 24) eg.lineBetween(-iw / 2, y, -iw / 2, Math.min(y + 12, -h / 2 + 20 + ih)).lineBetween(iw / 2, y, iw / 2, Math.min(y + 12, -h / 2 + 20 + ih));
      photo.add(eg);
      photo.add(this.add.text(0, -40, isNext ? '다음 계절' : '?', { fontFamily: UI.fontTitle, fontSize: isNext ? '52px' : '90px', color: isNext ? '#2f7bff' : '#b8b8c8' }).setOrigin(0.5));
      if (isNext) this.tweens.add({ targets: photo, scale: 1.02, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    L.add(photo);
    // 친구 스티커 (사진 아래·옆)
    ch.bosses.forEach((b, k) => {
      if (!state.friends.includes(b)) return;
      const st = this.land
        ? this.add.container(1060 + (ch.bosses.length > 1 ? (k ? 80 : -80) : 0), 520).setAngle(k ? -8 : 8)
        : this.add.container(UI.width / 2 + 30 + (k ? -190 : 190), PHOTO.y + PHOTO.h + top - (k ? 10 : 40)).setAngle(k ? -8 : 8);
      const g = this.add.graphics();
      g.fillStyle(0x2b2d5a, 0.15).fillRoundedRect(-58, -54, 120, 140, 26);
      g.fillStyle(0xffffff, 1).fillRoundedRect(-60, -60, 120, 140, 26);
      st.add(g);
      if (this.textures.exists(`face_${b}`)) st.add(this.add.image(0, -10, `face_${b}`, 1).setDisplaySize(96, 96));
      st.add(this.add.text(0, 58, BOSSES[b].name, { fontFamily: UI.fontTitle, fontSize: '22px', color: '#2b2d5a' }).setOrigin(0.5));
      L.add(st);
    });
    // 막 깬 계절: 흰 빛 '찰칵' → 사진이 위에서 내려온다
    if (snap === ch.id && done) {
      const flash = this.add.rectangle(-2000, -2000, 4720, 5280, 0xffffff, 1).setOrigin(0).setDepth(30);
      this.tweens.add({ targets: flash, alpha: 0, duration: 450, onComplete: () => flash.destroy() });
      photo.y -= 60; photo.setAlpha(0);
      this.tweens.add({ targets: photo, y: photo.y + 60, alpha: 1, duration: 420, delay: 150, ease: 'Back.easeOut' });
      sfx('stamp'); vibrate('stamp');
    }
  }

  makeNav() {
    const y = this.land ? 900 : PHOTO.y + PHOTO.h + this.top + 110;
    this.dots = CHAPTERS.map((_, i) => this.add.circle(UI.width / 2 + 30 + (i - (CHAPTERS.length - 1) / 2) * 30, y, 8, 0x2b2d5a, 0.25));
    const arrow = (x, d) => {
      const c = this.add.container(x, y);
      const g = this.add.graphics();
      g.fillStyle(0x2b2d5a, 0.12).fillCircle(0, 0, 34).fillStyle(0x2b2d5a, 1).fillTriangle(d * 12, 0, -d * 8, -14, -d * 8, 14);
      c.add(g).setSize(96, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => this.turn(d));
      return c;
    };
    this.prevBtn = this.land ? arrow(70, -1).setY(560) : arrow(150, -1);
    this.nextBtn = this.land ? arrow(710, 1).setY(560) : arrow(UI.width - 90, 1);
    this.updateNav();
  }

  updateNav() {
    this.dots.forEach((d, i) => d.setFillStyle(0x2b2d5a, i === this.page ? 0.9 : 0.25).setRadius(i === this.page ? 10 : 8));
    this.prevBtn.setAlpha(this.page > 0 ? 1 : 0.25);
    this.nextBtn.setAlpha(this.page < CHAPTERS.length - 1 ? 1 : 0.25);
  }

  makeBottom() {
    const bottom = getSafeInsets(this.game).bottom;
    const y = this.land ? 760 : 1180 - bottom;
    const next = nextChapterId();
    this.continueBtn = new Button(this, this.land ? 1060 : UI.width / 2 + 100, y, next
      ? { width: 420, height: 110, fontSize: 32, label: `여행 계속하기 · ${chapterById(next).name}`, color: 0xffd84a, shade: 0xd9a92b, textColor: '#2b2d5a', onPress: () => { sfx('tap'); startChapter(this, next); } }
      : { width: 420, height: 110, fontSize: 32, label: '엔딩 다시 보기', color: 0xffd84a, shade: 0xd9a92b, textColor: '#2b2d5a', onPress: () => { sfx('tap'); this.scene.start(SERIES.meta.endingScene); } });
    new Button(this, this.land ? 1060 : 170, this.land ? 900 : y, { width: 180, height: this.land ? 96 : 110, fontSize: 26, label: '타이틀', color: 0xfdf7ea, shade: 0xc9c0ae, textColor: '#2b2d5a', onPress: () => { sfx('tap'); this.scene.start(SERIES.meta.titleScene); } });
    this.input.keyboard?.on('keydown-ENTER', () => this.continueBtn.trigger());
  }

  landscapeView() { return landView(0.8, 560, 600); }

  snapshot() { return { justCleared: null, page: this.page }; }

  askReplay(id) {
    sfx('tap');
    const ch = chapterById(id);
    const layer = this.add.container(0, 0).setDepth(20);
    const dim = this.add.rectangle(-2000, -2000, 4720, 5280, 0x2b2d5a, 0.5).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    drawPanel(g, 70, 420, 580, 400, ch.frame);
    layer.add([dim, g,
      this.add.text(UI.width / 2, 500, stageLabel(ch), { fontFamily: UI.fontTitle, fontSize: '42px', color: '#2b2d5a' }).setOrigin(0.5),
      this.add.text(UI.width / 2, 585, '이 계절을 다시 할까요?', { fontFamily: UI.font, fontSize: '28px', color: '#2b2d5a' }).setOrigin(0.5),
    ]);
    layer.add(new Button(this, UI.width / 2 - 130, 720, { width: 230, height: 96, fontSize: 30, label: '그만두기', color: 0xd8d8e4, shade: 0xa8a8bc, textColor: '#2b2d5a', onPress: () => layer.destroy() }));
    layer.add(new Button(this, UI.width / 2 + 130, 720, { width: 230, height: 96, fontSize: 30, label: '다시 하기', onPress: () => { save(); startChapter(this, id, { replay: true }); } }));
  }
}
