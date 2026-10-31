import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { CHAPTERS, PASSPORT } from '../data/chapters.js';
import { BOSSES } from '../data/bosses.js';
import { state, save } from '../state.js';
import { setTheme } from '../ui/theme.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { Button } from '../ui/Button.js';
import { drawPanel } from '../ui/frames.js';
import { iconStar } from '../ui/icons.js';
import { sfx, vibrate } from '../ui/feedback.js';
import { chapterById, isCleared, nextChapterId, startChapter } from '../flow.js';
import { updateBand } from '../ui/bands.js';
import { canOfferInstall, offerInstall } from '../ui/helpers7.js';

// 여행 지도 = 블루나비 여권 (concept-v2 5절). 나라마다 한 쪽, 깬 장에는 입국 도장이 '쾅'.
// 도장 속 별 칸 = 그 장의 별, 도장 옆 스티커 = 친구가 된 보스. 깬 도장을 톡 → 그 장 다시 하기.
const INK = {
  korea: 0x2f7bff, china: 0xd2473a, japan: 0xd9708a, usa: 0x4f6d8f, canada: 0xc0563a,
};
const PAGE = { x: 40, y: 150, w: 640, h: 860 };

export class MapScene extends Phaser.Scene {
  constructor() { super('Map'); }

  init(data) {
    this.justCleared = data.justCleared ?? null;
  }

  create() {
    setTheme('#1f3a7a', '#1f3a7a');
    this.insets = getSafeInsets(this.game);
    const top = this.insets.top;
    // 여권 표지 색 바탕 + 은은한 무늬
    this.add.rectangle(0, 0, UI.width, UI.height, 0x1f3a7a).setOrigin(0);
    const bg = this.add.graphics();
    bg.lineStyle(2, 0x2c4c94, 1);
    for (let y = -40; y < UI.height + 40; y += 46) {
      bg.beginPath();
      for (let x = 0; x <= UI.width; x += 20) bg.lineTo(x, y + Math.sin(x / 60) * 10);
      bg.strokePath();
    }
    // 표지 제목
    this.add.text(UI.width / 2, 62 + top, '블루나비 여권', { fontFamily: UI.fontTitle, fontSize: '44px', color: '#ffd84a' }).setOrigin(0.5);
    this.add.text(UI.width / 2, 110 + top, 'BLUE NABI PASSPORT', { fontFamily: UI.font, fontSize: '18px', color: '#c9d6f5' }).setOrigin(0.5);

    const cleared = this.justCleared ?? null;
    const target = cleared ?? nextChapterId() ?? 'ch7';
    this.page = Math.max(0, PASSPORT.findIndex((p) => p.chapters.includes(target)));
    this.pageLayer = this.add.container(0, 0);
    this.drawPage(this.page, cleared);
    this.makeNav();
    this.makeBottom();
    updateBand(this, 1060);
    // 1장을 깬 뒤 홈 화면 설치 안내 (처음 들어오자마자 띄우지 않기)
    if (isCleared('ch1') && canOfferInstall()) {
      const c = this.add.container(UI.width - 92, 64 + top).setDepth(5);
      const g = this.add.graphics();
      g.fillStyle(0xffd84a, 1).fillRoundedRect(-80, -26, 160, 52, 26);
      c.add([g, this.add.text(0, 0, '홈 화면에 추가', { fontFamily: UI.fontTitle, fontSize: '20px', color: '#2b2d5a' }).setOrigin(0.5)]);
      c.setSize(170, 80).setInteractive({ useHandCursor: true }).on('pointerup', () => { sfx('tap'); offerInstall(); });
    }

    // 좌우로 쓱 밀어 쪽 넘기기
    this.input.on('pointerdown', (p) => { this.swipe = { x: p.x, y: p.y }; });
    this.input.on('pointerup', (p) => {
      if (!this.swipe) return;
      const dx = p.x - this.swipe.x;
      this.swipe = null;
      if (Math.abs(dx) > 80) this.turn(dx < 0 ? 1 : -1);
    });
    this.input.keyboard?.on('keydown-LEFT', () => this.turn(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.turn(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.continueBtn?.trigger());
  }

  turn(d) {
    const n = Phaser.Math.Clamp(this.page + d, 0, PASSPORT.length - 1);
    if (n === this.page) return;
    sfx('tap');
    this.tweens.add({
      targets: this.pageLayer, x: -d * 60, alpha: 0, duration: 140,
      onComplete: () => {
        this.page = n;
        this.drawPage(n, null);
        this.pageLayer.x = d * 60;
        this.tweens.add({ targets: this.pageLayer, x: 0, alpha: 1, duration: 180, ease: 'Quad.easeOut' });
        this.updateNav();
      },
    });
  }

  drawPage(i, stampNow) {
    const L = this.pageLayer;
    L.removeAll(true);
    const p = PASSPORT[i];
    const ink = INK[p.country];
    // 여권 속지
    const g = this.add.graphics();
    g.fillStyle(0x0f2456, 0.4).fillRoundedRect(PAGE.x + 6, PAGE.y + 12, PAGE.w, PAGE.h, 28);
    g.fillStyle(0xfdf7ea, 1).fillRoundedRect(PAGE.x, PAGE.y, PAGE.w, PAGE.h, 28);
    g.lineStyle(2, ink, 0.12);
    for (let y = PAGE.y + 40; y < PAGE.y + PAGE.h - 20; y += 30) {
      g.beginPath();
      for (let x = PAGE.x + 20; x <= PAGE.x + PAGE.w - 20; x += 16) g.lineTo(x, y + Math.sin((x + y) / 40) * 6);
      g.strokePath();
    }
    L.add(g);
    L.add(this.add.text(PAGE.x + 40, PAGE.y + 56, p.name, { fontFamily: UI.fontTitle, fontSize: '52px', color: Phaser.Display.Color.IntegerToColor(ink).rgba }).setOrigin(0, 0.5));
    L.add(this.add.text(PAGE.x + PAGE.w - 40, PAGE.y + 60, `${i + 1} / ${PASSPORT.length}쪽`, { fontFamily: UI.font, fontSize: '22px', color: '#8a8cae' }).setOrigin(1, 0.5));

    // 도장 자리
    const n = p.chapters.length;
    const slots = n === 1 ? [[PAGE.x + PAGE.w / 2, PAGE.y + 380]]
      : [[PAGE.x + 190, PAGE.y + 270], [PAGE.x + PAGE.w - 190, PAGE.y + 440], [PAGE.x + 200, PAGE.y + 640]];
    p.chapters.forEach((id, k) => this.drawStamp(L, id, slots[k][0], slots[k][1], n === 1 ? 150 : 110, ink, id === stampNow));
  }

  drawStamp(L, id, x, y, r, ink, animate) {
    const ch = chapterById(id);
    const done = isCleared(id);
    const isNext = id === nextChapterId();
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    if (done) {
      // 입국 도장: 두 겹 동그라미 + 장소 이름 + 별 칸
      g.lineStyle(7, ink, 0.9).strokeCircle(0, 0, r);
      g.lineStyle(3, ink, 0.9).strokeCircle(0, 0, r - 14);
      c.add(g);
      c.add(this.add.text(0, -r * 0.34, ch.stamp, { fontFamily: UI.fontTitle, fontSize: `${Math.round(r * 0.3)}px`, color: Phaser.Display.Color.IntegerToColor(ink).rgba }).setOrigin(0.5));
      c.add(this.add.text(0, r * 0.06, `${ch.id.slice(2)}장 · ${ch.place}`, { fontFamily: UI.font, fontSize: `${Math.round(r * 0.15)}px`, color: Phaser.Display.Color.IntegerToColor(ink).rgba, align: 'center', wordWrap: { width: r * 1.6 } }).setOrigin(0.5));
      const stars = state.stars[id] ?? 0;
      for (let s = 0; s < 3; s++) {
        const sg = this.add.graphics();
        iconStar(sg, (s - 1) * r * 0.34, r * 0.46, r * 0.3, s < stars ? 0xffd84a : 0xd8c8a8);
        c.add(sg);
      }
      c.setAngle(-8 + (id.charCodeAt(2) % 3) * 6);
      // 친구 스티커
      ch.bosses.forEach((b, k) => {
        if (!state.friends.includes(b)) return;
        // 스티커가 둘이면(캐나다) 도장 오른쪽 위·왼쪽 아래에 나눠 붙인다
        const sx = k === 0 ? x + r * 0.95 : x - r * 0.95;
        const sy = k === 0 ? y - r * 0.8 : y + r * 0.75;
        const st = this.add.container(sx, sy).setAngle(k === 0 ? 8 : -8);
        const sg = this.add.graphics();
        sg.fillStyle(0x2b2d5a, 0.15).fillRoundedRect(-52, -48, 108, 132, 24);
        sg.fillStyle(0xffffff, 1).fillRoundedRect(-54, -54, 108, 132, 24);
        st.add(sg);
        if (this.textures.exists(`face_${b}`)) st.add(this.add.image(0, -8, `face_${b}`, 1).setDisplaySize(88, 88));
        st.add(this.add.text(0, 56, BOSSES[b].name, { fontFamily: UI.fontTitle, fontSize: '20px', color: '#2b2d5a' }).setOrigin(0.5));
        L.add(st);
      });
      // 톡 → 다시 하기
      c.setSize(r * 2, r * 2).setInteractive({ useHandCursor: true }).on('pointerup', () => this.askReplay(id));
      if (animate) {
        c.setScale(2.2).setAlpha(0);
        this.tweens.add({
          targets: c, scale: 1, alpha: 1, duration: 260, delay: 350, ease: 'Quad.easeIn',
          onComplete: () => { this.cameras.main.shake(140, 0.006); vibrate('stamp'); sfx('open'); },
        });
      }
    } else {
      g.lineStyle(4, isNext ? ink : 0x8a8cae, isNext ? 0.9 : 0.4);
      for (let a = 0; a < 360; a += 12) {
        const r1 = Phaser.Math.DegToRad(a);
        const r2 = Phaser.Math.DegToRad(a + 6);
        g.beginPath(); g.arc(0, 0, r, r1, r2); g.strokePath();
      }
      c.add(g);
      c.add(this.add.text(0, -10, isNext ? '다음 여행지' : '?', { fontFamily: UI.fontTitle, fontSize: isNext ? `${Math.round(r * 0.24)}px` : `${Math.round(r * 0.6)}px`, color: isNext ? Phaser.Display.Color.IntegerToColor(ink).rgba : '#b8b8c8' }).setOrigin(0.5));
      if (isNext) {
        c.add(this.add.text(0, r * 0.3, `${ch.id.slice(2)}장 · ${ch.place}`, { fontFamily: UI.font, fontSize: `${Math.round(r * 0.15)}px`, color: '#2b2d5a', align: 'center', wordWrap: { width: r * 1.6 } }).setOrigin(0.5));
        this.tweens.add({ targets: c, scale: 1.05, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
    L.add(c);
  }

  makeNav() {
    const y = PAGE.y + PAGE.h + 40;
    this.dots = PASSPORT.map((_, i) => this.add.circle(UI.width / 2 + (i - 2) * 30, y, 8, 0xffffff, 0.35));
    const arrow = (x, d) => {
      const c = this.add.container(x, y);
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.18).fillCircle(0, 0, 34);
      g.fillStyle(0xffffff, 1).fillTriangle(d * 12, 0, -d * 8, -14, -d * 8, 14);
      c.add(g).setSize(96, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => this.turn(d));
      return c;
    };
    this.prevBtn = arrow(90, -1);
    this.nextBtn = arrow(UI.width - 90, 1);
    this.updateNav();
  }

  updateNav() {
    this.dots.forEach((d, i) => d.setFillStyle(0xffffff, i === this.page ? 1 : 0.35).setRadius(i === this.page ? 10 : 8));
    this.prevBtn.setAlpha(this.page > 0 ? 1 : 0.25);
    this.nextBtn.setAlpha(this.page < PASSPORT.length - 1 ? 1 : 0.25);
  }

  makeBottom() {
    const bottom = this.insets.bottom;
    const next = nextChapterId();
    const y = 1180 - bottom;
    if (next) {
      const ch = chapterById(next);
      this.continueBtn = new Button(this, UI.width / 2 + 70, y, {
        width: 440, height: 110, fontSize: 32, label: `여행 계속하기 · ${ch.id.slice(2)}장`, color: 0xffd84a, shade: 0xd9a92b, textColor: '#2b2d5a',
        onPress: () => { sfx('tap'); startChapter(this, next); },
      });
    } else {
      this.continueBtn = new Button(this, UI.width / 2 + 70, y, {
        width: 440, height: 110, fontSize: 32, label: '엔딩 다시 보기', color: 0xffd84a, shade: 0xd9a92b, textColor: '#2b2d5a',
        onPress: () => { sfx('tap'); this.scene.start('Ending'); },
      });
    }
    new Button(this, 110, y, {
      width: 160, height: 110, fontSize: 26, label: '타이틀', color: 0xfdf7ea, shade: 0xc9c0ae, textColor: '#2b2d5a',
      onPress: () => { sfx('tap'); this.scene.start('Title'); },
    });
  }

  askReplay(id) {
    sfx('tap');
    const ch = chapterById(id);
    const layer = this.add.container(0, 0).setDepth(20);
    const dim = this.add.rectangle(0, 0, UI.width, UI.height, 0x0f2456, 0.55).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    drawPanel(g, 70, 420, 580, 420, ch.frame);
    layer.add([dim, g,
      this.add.text(UI.width / 2, 500, `${ch.id.slice(2)}장 · ${ch.place}`, { fontFamily: UI.fontTitle, fontSize: '40px', color: '#2b2d5a' }).setOrigin(0.5),
      this.add.text(UI.width / 2, 590, '이 장을 다시 할까요?\n별을 더 받을 수 있어요.', { fontFamily: UI.font, fontSize: '28px', color: '#2b2d5a', align: 'center', lineSpacing: 8 }).setOrigin(0.5),
    ]);
    layer.add(new Button(this, UI.width / 2 - 130, 750, { width: 230, height: 96, fontSize: 30, label: '그만두기', color: 0xd8d8e4, shade: 0xa8a8bc, textColor: '#2b2d5a', onPress: () => layer.destroy() }));
    layer.add(new Button(this, UI.width / 2 + 130, 750, { width: 230, height: 96, fontSize: 30, label: '다시 하기', onPress: () => { save(); startChapter(this, id, { replay: true }); } }));
  }
}
