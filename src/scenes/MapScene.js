import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { PASSPORT, stageNo, stageLabel } from '../data/chapters.js';
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
import { openShareMenu, activeChallenge, fmt as fmtShort } from '../social/social.js';

// 여행 지도 = 블루나비 여권 (concept-v2 5절). 나라마다 한 쪽, 깬 단계에는 입국 도장이 '쾅'.
// 도장 속 별 칸 = 그 단계의 별. 아래는 실제 여권 신원면처럼 친구마다 증명사진 칸 — 친구가 되면 사진 모서리에 '친구' 도장 쾅 (2026-11-06).
// 깬 도장을 톡 → 그 단계 다시 하기.
const INK = {
  korea: 0x2f7bff, china: 0xd2473a, japan: 0xd9708a, usa: 0x4f6d8f, canada: 0xc0563a,
};
const PAGE = { x: 40, y: 150, w: 640, h: 860 };

export class MapScene extends Phaser.Scene {
  constructor() { super('Map'); }

  init(data) {
    this.initData = { ...data, justCleared: null };
    this.justCleared = data.justCleared ?? null;
  }

  create() {
    setTheme('#1f3a7a', '#1f3a7a');
    this.insets = getSafeInsets(this.game);
    const top = this.insets.top;
    // 여권 표지 색 바탕 + 은은한 무늬
    this.add.rectangle(0, -UI.offY, UI.width, UI.fullHeight, 0x1f3a7a).setOrigin(0);
    const bg = this.add.graphics();
    bg.lineStyle(2, 0x2c4c94, 1);
    for (let y = -40; y < UI.height + 40; y += 46) {
      bg.beginPath();
      for (let x = 0; x <= UI.width; x += 20) bg.lineTo(x, y + Math.sin(x / 60) * 10);
      bg.strokePath();
    }
    // 표지 제목
    this.add.text(UI.width / 2, 62 + top, '블루나비 여권', { fontFamily: UI.fontTitle, fontSize: '44px', color: '#ffd84a' }).setOrigin(0.5);
    this.add.text(UI.width / 2, 110 + top, 'BLUE NABI PASSPORT', { fontFamily: UI.font, fontSize: '22px', color: '#c9d6f5' }).setOrigin(0.5);

    const cleared = this.justCleared ?? null;
    const target = cleared ?? nextChapterId() ?? 'ch7';
    this.page = Math.max(0, PASSPORT.findIndex((p) => p.chapters.includes(target)));
    this.pageLayer = this.add.container(0, 0);
    this.drawPage(this.page, cleared);
    this.makeNav();
    this.makeBottom();
    updateBand(this, 1060);
    // 친구와 함께: 기록 카드·도전장·도전장함 (왼쪽 위)
    if (Object.keys(state.stars).length || (state.challenges ?? []).length) {
      const sc = this.add.container(92, 64 + top).setDepth(5);
      const sg = this.add.graphics();
      sg.fillStyle(0xffffff, 1).fillRoundedRect(-80, -26, 160, 52, 26);
      sc.add([sg, this.add.text(0, 0, '자랑하기', { fontFamily: UI.fontTitle, fontSize: '22px', color: '#2f7bff' }).setOrigin(0.5)]);
      sc.setSize(170, 80).setInteractive({ useHandCursor: true }).on('pointerup', () => { sfx('tap'); openShareMenu(this.game, () => this.scene.restart(this.initData)); });
    }
    // 1장을 깬 뒤 홈 화면 설치 안내 (처음 들어오자마자 띄우지 않기)
    if (isCleared('ch1') && canOfferInstall()) {
      const c = this.add.container(UI.width - 92, 64 + top).setDepth(5);
      const g = this.add.graphics();
      g.fillStyle(0xffd84a, 1).fillRoundedRect(-80, -26, 160, 52, 26);
      c.add([g, this.add.text(0, 0, '홈 화면에 추가', { fontFamily: UI.fontTitle, fontSize: '22px', color: '#2b2d5a' }).setOrigin(0.5)]);
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

    // 위: 입국 도장 + 단계 정보, 아래: 친구 증명사진 칸 (실제 여권 신원면처럼, 친구가 되면 '친구' 도장이 사진 모서리에 쾅)
    const id = p.chapters[0];
    const ch = chapterById(id);
    this.drawStamp(L, id, PAGE.x + 150, PAGE.y + 215, 100, ink, id === stampNow);
    this.drawInfo(L, id, PAGE.x + 285, PAGE.y + 150, ink);
    const n = ch.bosses.length;
    const rowH = n >= 3 ? 172 : n === 2 ? 228 : 300;
    const y0 = PAGE.y + 352 + (n === 1 ? 60 : n === 2 ? 20 : 0);
    ch.bosses.forEach((b, k) => this.drawFriend(L, ch, b, k, PAGE.x + 28, y0 + k * rowH, rowH - 16, ink, id === stampNow ? 700 + k * 450 : -1));
  }

  // 입국 도장 오른쪽: 단계·장소·기록
  drawInfo(L, id, x, y, ink) {
    const ch = chapterById(id);
    const done = isCleared(id);
    const rec = state.records[id]?.mazeSec;
    const col = Phaser.Display.Color.IntegerToColor(ink).rgba;
    const rows = [['단계', `${stageNo(id)}단계`], ['장소', ch.place], ['기록', done && rec != null ? fmtShort(rec) : '—']];
    rows.forEach(([k, v], i) => {
      L.add(this.add.text(x, y + i * 46, k, { fontFamily: UI.font, fontSize: '22px', color: '#8a8cae' }).setOrigin(0, 0.5));
      L.add(this.add.text(x + 70, y + i * 46, v, { fontFamily: UI.fontTitle, fontSize: '26px', color: i === 0 ? col : '#2b2d5a', wordWrap: { width: 290, useAdvancedWrap: true } }).setOrigin(0, 0.5));
    });
  }

  // 친구 한 명의 신원 칸: 증명사진(파란 바탕 + 얼굴) · 이름·어떤 친구·만난 곳 · 친구 도장
  drawFriend(L, ch, b, k, x, y, h, ink, stampDelay) {
    const boss = BOSSES[b] ?? {};
    const met = state.friends.includes(b) && isCleared(ch.id);
    const w = PAGE.w - 56;
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(ink, 0.06).fillRoundedRect(0, 0, w, h, 18);
    g.lineStyle(2, ink, 0.25).strokeRoundedRect(0, 0, w, h, 18);
    // 증명사진 틀 (3:4)
    const ph = h - 24, pw = Math.round(ph * 0.78), px = 14, py = 12;
    g.fillStyle(0x2b2d5a, 0.15).fillRect(px + 3, py + 4, pw, ph);
    g.fillStyle(0xffffff, 1).fillRect(px, py, pw, ph);
    g.fillStyle(met ? 0xcfe3f7 : 0xe6e4ee, 1).fillRect(px + 5, py + 5, pw - 10, ph - 10);
    c.add(g);
    if (met && this.textures.exists(`face_${b}`)) {
      // 어깨까지 보이게 아래쪽에 붙인 얼굴 (웃는 얼굴)
      const face = this.add.image(px + pw / 2, py + ph - 6, `face_${b}`, 1).setOrigin(0.5, 1).setDisplaySize(pw - 12, pw - 12);
      c.add(face);
    } else {
      const sg = this.add.graphics();
      sg.fillStyle(0xb8b6c8, 1).fillCircle(px + pw / 2, py + ph * 0.42, pw * 0.22).fillEllipse(px + pw / 2, py + ph - 8, pw * 0.74, ph * 0.42);
      c.add(sg);
      c.add(this.add.text(px + pw / 2, py + ph * 0.42, '?', { fontFamily: UI.fontTitle, fontSize: '34px', color: '#ffffff' }).setOrigin(0.5));
    }
    // 신원 글
    const places = ch.place.split(/ · |과 /);
    const lx = px + pw + 50; // 사진 모서리에 걸친 친구 도장을 비켜서
    const lines = met
      ? [['이름', boss.name], ['어떤 친구', boss.kind ?? ''], ['만난 곳', places[k] ?? ch.place]]
      : [['이름', '???'], ['어떤 친구', '아직 몰라요'], ['만난 곳', '숨바꼭질로 찾아요']];
    const lh = Math.min(42, (h - 20) / 3);
    lines.forEach(([kk, v], i) => {
      const ty = 14 + lh * (i + 0.5);
      c.add(this.add.text(lx, ty, kk, { fontFamily: UI.font, fontSize: '22px', color: '#8a8cae' }).setOrigin(0, 0.5));
      c.add(this.add.text(lx + 100, ty, v, { fontFamily: i === 0 ? UI.fontTitle : UI.font, fontSize: i === 0 ? '30px' : '24px', color: '#2b2d5a' }).setOrigin(0, 0.5));
    });
    // 기계로 읽는 줄 흉내 (여권 아래쪽 <<< 줄)
    if (met) c.add(this.add.text(lx, h - 16, `FRIEND<<${(b.toUpperCase() + '<<<<<<<<<<<<').slice(0, 14)}`, { fontFamily: 'monospace', fontSize: '16px', color: '#b0aec4' }).setOrigin(0, 0.5));
    L.add(c);
    if (!met) return;
    // 친구 도장: 사진 오른쪽 아래 모서리에 걸쳐 쾅 (잉크처럼 조금 투명하게)
    const r = Math.max(44, Math.round(pw * 0.36)); // 사진이 크면 도장도 크게
    const sx = x + px + pw - 8, sy = y + py + ph - r * 0.45;
    const st = this.add.container(sx, sy).setAngle(-14 + ((k * 11) % 9));
    const sg = this.add.graphics();
    sg.lineStyle(5, ink, 1).strokeCircle(0, 0, r);
    sg.lineStyle(2, ink, 1).strokeCircle(0, 0, r - 8);
    for (let a = 0; a < 12; a++) { const t = (a / 12) * Math.PI * 2; sg.fillStyle(ink, 1).fillCircle(Math.cos(t) * (r - 4), Math.sin(t) * (r - 4), 1.6); }
    st.add(sg);
    const col = Phaser.Display.Color.IntegerToColor(ink).rgba;
    st.add(this.add.text(0, -r * 0.2, '친구', { fontFamily: UI.fontTitle, fontSize: `${Math.round(r * 0.64)}px`, color: col }).setOrigin(0.5));
    st.add(this.add.text(0, r * 0.4, ch.stamp, { fontFamily: UI.font, fontSize: `${Math.max(16, Math.round(r * 0.36))}px`, color: col }).setOrigin(0.5));
    st.setAlpha(0.82);
    L.add(st);
    if (stampDelay >= 0) {
      st.setScale(2.4).setAlpha(0);
      this.tweens.add({
        targets: st, scale: 1, alpha: 0.82, duration: 220, delay: stampDelay, ease: 'Quad.easeIn',
        onComplete: () => { vibrate('stamp'); sfx('stamp'); this.cameras.main.shake(90, 0.004); },
      });
    }
  }

  drawStamp(L, id, x, y, r, ink, animate) {
    const ch = chapterById(id);
    const done = isCleared(id);
    const isNext = id === nextChapterId();
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    if (done) {
      // 입국 도장: 두 겹 동그라미 + 나라 이름 + 별 칸
      g.lineStyle(7, ink, 0.9).strokeCircle(0, 0, r);
      g.lineStyle(3, ink, 0.9).strokeCircle(0, 0, r - 14);
      c.add(g);
      c.add(this.add.text(0, -r * 0.34, ch.stamp, { fontFamily: UI.fontTitle, fontSize: `${Math.round(r * 0.34)}px`, color: Phaser.Display.Color.IntegerToColor(ink).rgba }).setOrigin(0.5));
      c.add(this.add.text(0, r * 0.06, '입국', { fontFamily: UI.fontTitle, fontSize: `${Math.round(r * 0.22)}px`, color: Phaser.Display.Color.IntegerToColor(ink).rgba }).setOrigin(0.5));
      const stars = state.stars[id] ?? 0;
      for (let s = 0; s < 3; s++) {
        const sg = this.add.graphics();
        iconStar(sg, (s - 1) * r * 0.36, r * 0.48, r * 0.32, s < stars ? 0xffd84a : 0xd8c8a8);
        c.add(sg);
      }
      c.setAngle(-8 + (id.charCodeAt(2) % 3) * 6);
      // 톡 → 다시 하기
      c.setSize(r * 2, r * 2).setInteractive({ useHandCursor: true }).on('pointerup', () => this.askReplay(id));
      if (animate) {
        c.setScale(2.2).setAlpha(0);
        this.tweens.add({
          targets: c, scale: 1, alpha: 1, duration: 260, delay: 350, ease: 'Quad.easeIn',
          onComplete: () => { this.cameras.main.shake(140, 0.006); vibrate('stamp'); sfx('stamp'); this.dingStars(state.stars[id] ?? 0); },
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
      c.add(this.add.text(0, 0, isNext ? '다음 여행지' : '?', { fontFamily: UI.fontTitle, fontSize: isNext ? `${Math.round(r * 0.26)}px` : `${Math.round(r * 0.6)}px`, color: isNext ? Phaser.Display.Color.IntegerToColor(ink).rgba : '#b8b8c8' }).setOrigin(0.5));
      if (isNext) this.tweens.add({ targets: c, scale: 1.05, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // 도전 중인 친구의 기록 깃발
    const rival = activeChallenge();
    const rt = rival?.times[id];
    if (rt) {
      const f = this.add.container(x - r * 0.15, y + r + 16);
      const fg = this.add.graphics();
      fg.fillStyle(0x2b2d5a, 1).fillRect(-46, -40, 4, 54);
      fg.fillStyle(0xff9fb8, 1).fillTriangle(-42, -40, -42, -14, 0, -27);
      const label = this.add.text(-30, 4, `${rival.nick} ${fmtShort(rt)}`, { fontFamily: UI.fontTitle, fontSize: '22px', color: '#c0563a', backgroundColor: '#ffffffd9', padding: { x: 8, y: 2 } }).setOrigin(0, 0.5);
      f.add([fg, label]);
      L.add(f);
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
        width: 440, height: 110, fontSize: 32, label: `여행 계속하기 · ${ch.name}`, color: 0xffd84a, shade: 0xd9a92b, textColor: '#2b2d5a',
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

  // 도장 쾅 뒤에 별 개수만큼 띵
  dingStars(n) {
    for (let i = 0; i < n; i++) this.time.delayedCall(260 + i * 170, () => sfx('ding'));
  }

  askReplay(id) {
    sfx('tap');
    const ch = chapterById(id);
    const layer = this.add.container(0, 0).setDepth(20);
    const dim = this.add.rectangle(0, -UI.offY, UI.width, UI.fullHeight, 0x0f2456, 0.55).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    drawPanel(g, 70, 420, 580, 420, ch.frame);
    layer.add([dim, g,
      this.add.text(UI.width / 2, 500, stageLabel(ch), { fontFamily: UI.fontTitle, fontSize: '40px', color: '#2b2d5a' }).setOrigin(0.5),
      this.add.text(UI.width / 2, 590, '이 단계를 다시 할까요?\n별을 더 받을 수 있어요.', { fontFamily: UI.font, fontSize: '28px', color: '#2b2d5a', align: 'center', lineSpacing: 8 }).setOrigin(0.5),
    ]);
    layer.add(new Button(this, UI.width / 2 - 130, 750, { width: 230, height: 96, fontSize: 30, label: '그만두기', color: 0xd8d8e4, shade: 0xa8a8bc, textColor: '#2b2d5a', onPress: () => layer.destroy() }));
    layer.add(new Button(this, UI.width / 2 + 130, 750, { width: 230, height: 96, fontSize: 30, label: '다시 하기', onPress: () => { save(); startChapter(this, id, { replay: true }); } }));
  }
}
