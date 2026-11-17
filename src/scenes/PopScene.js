import Phaser from 'phaser';
import { UI, landView } from '../data/ui.js';
import { POP, PONG } from '../data/popgame.js';
import { LOOK } from '../data/mazeLooks.js';
import { SPOT, PICTURES } from '../data/spot.js';
import { state, save } from '../state.js';
import { setTheme } from '../ui/theme.js';
import { Button } from '../ui/Button.js';
import { sfx, vibrate, unlockAudio } from '../ui/feedback.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { waitForAssets } from './PreloadScene.js';
import { makePopIcons } from '../pop/icons.js';
import { hasNature, drawNature, drawBackdrop } from '../pop/popNature.js';
import { makeProp } from '../spot/props.js';
import { matchById, saveMyResult, seededRandom } from '../social/match.js';
import { SERIES } from '../series.js';
import { addExitButton } from '../ui/exitButton.js';
import { setMusicTempo } from '../ui/music.js';

// 퐁퐁 (design-brief 21절, 2026-11-17~ — 예전 '기념품 퐁퐁'의 떨어지는 묶음 놀이를 바꿈)
// 아래 귀여운 조이스틱을 끌어 겨누고 손을 떼면 기념품 공이 퐁 날아간다. 내려오는 기념품 무리 중 같은 그림에 맞으면
// 그 무리에 붙고, 같은 그림이 PONG.need개(1판 2개 · 2·3판 3개) 모이면 퐁! 그림 조각 하나가 위 그림 판에 쏙.
// 다른 그림에 맞으면 공이 튕겨 나가고 남은 시간 -3초. 조각을 다 채우면 블루나비(1탄)·포포(2탄) 사진 완성.
// scene.start('Pop', { step: 'solo' | 'duo' | 'remote' | 'menu', stage, duo: { names, turn, results, seed }, match })
const STAGES = POP.stages;
const INK = 0x2b2d5a;
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
// 1탄 블루나비(나비)·2탄 포포(그 계절 옷) — 사진 속 주인공 그림
const HERO2 = { s1: 'blue_popoSpring', s2: 'blue_popoSummer', s3: 'blue_popoAutumn', s4: 'blue_popoWinter' };
const heroKey = (chapter) => (SERIES.n === 2 ? HERO2[chapter] ?? 'home_popo' : 'home_bluenabi');

export class PopScene extends Phaser.Scene {
  constructor() { super('Pop'); }

  init(data) {
    this.initData = data;
    this.stage = null; // 그림을 받는 동안(waitForAssets)에는 update가 쉰다
    this.step = data.step ?? 'menu';
    this.stageIdx = Math.max(0, Math.min(STAGES.length - 1, data.stage ?? 0));
    this.duo = data.duo ?? null;
    this.match = data.match ? matchById(data.match) : null;
    if (this.step === 'remote' && !this.match) this.step = 'menu';
    if (this.step === 'duo' && !this.duo) this.step = 'solo';
    if (this.match) this.stageIdx = Math.max(0, Math.min(STAGES.length - 1, this.match.stage));
    this.ended = false;
    this.running = false;
    this.elapsed = 0;
    this.hurry = false; // 남은 10초: 배경음을 조금 빠르게
    setMusicTempo(1);
    this.penalty = 0;
    this.clusters = [];
    this.ball = null;
    this.queue = [];
    this.covers = [];
    this.filled = 0;
    this.aim = null;
    this.joyId = null;
    this.hintGone = false;
    this.seed = this.duo?.seed ?? this.match?.seed ?? Math.floor(Math.random() * 2147483646) + 1;
    this.rand = seededRandom(this.seed);
  }

  create() {
    // 예전 '처음 화면'은 같이 하기 화면이 대신한다 (2026-11-15~)
    if (this.step === 'menu') { this.scene.start('Together', { players: 1, game: 'pop' }); return; }
    this.top = getSafeInsets(this.game).top;
    this.bottom = getSafeInsets(this.game).bottom;
    this.stage = STAGES[this.stageIdx];
    const icons = this.stage.types.map((t) => t.icon);
    if (waitForAssets(this, [...icons, heroKey(this.stage.chapter)], this.initData)) { this.stage = null; return; }
    makePopIcons(this);
    this.idx = this.stageIdx;
    this.need = PONG.need[Math.min(this.idx, PONG.need.length - 1)];
    this.kinds = Math.min(this.stage.types.length, PONG.kinds[Math.min(this.idx, PONG.kinds.length - 1)]);
    this.onScreen = PONG.onScreen[Math.min(this.idx, PONG.onScreen.length - 1)];
    this.fallSec = PONG.fallSec[Math.min(this.idx, PONG.fallSec.length - 1)];
    this.pairChance = PONG.pairChance[Math.min(this.idx, PONG.pairChance.length - 1)];
    [this.cols, this.rows] = PONG.grid[Math.min(this.idx, PONG.grid.length - 1)];
    this.pieces = this.cols * this.rows;
    this.look = LOOK[this.stage.chapter] ?? {};
    this.layout();
    this.drawBack();
    this.drawHud();
    this.makePicture();
    this.drawSide();
    this.makeLauncher();
    this.makeJoystick();
    this.setupInput();
    const onHidden = () => this.openPause();
    this.game.events.on('app-hidden', onHidden);
    this.events.once('shutdown', () => this.game.events.off('app-hidden', onHidden));
    sfx(`arrive_${this.stage.chapter}`);
    // 처음 하늘을 조금 채워 두고 시작
    for (let i = 0; i < this.onScreen; i++) this.spawn(this.L.fieldTop + 40 + (i * (this.L.lineY - this.L.fieldTop - 160)) / this.onScreen);
    this.reload(true);
    if (this.step === 'solo') this.readyGo(900); else this.countdown();
  }

  // 가로 (18절): 왼쪽 = 완성할 그림, 가운데 = 하늘·발사대, 오른쪽 = 조이스틱 — 기준 좌표 그대로(배율 1)
  landscapeView() { return landView(1, 640, 360); }
  canRelayout() { return !!this.ended; }

  // ── 자리 잡기 (세로: 720×1280 기준 / 가로: 보이는 칸 전체) ──
  layout() {
    const top = this.top;
    if (UI.landscape) {
      const V = this.landscapeView();
      const left = V.left + 16, right = V.right - 16;
      const picW = 300, picH = Math.round((picW * SPOT.H) / SPOT.W);
      const fx0 = left + picW + 30, fx1 = right - 230;
      this.L = {
        land: true, hx0: left, hx1: right, hy: 6 + top, hh: 84,
        picX: left + 4, picY: 110 + top, picW, picH,
        sideX: left + 4, sideY: 110 + top + picH + 20, sideW: picW,
        fx0, fx1, fieldTop: 104 + top, lineY: 600, launchX: (fx0 + fx1) / 2, launchY: 650,
        joyX: right - 115, joyY: 560, joyR: 92,
      };
    } else {
      const picW = 400, picH = Math.round((picW * SPOT.H) / SPOT.W);
      const bot = 1280 - Math.max(this.bottom, 8);
      this.L = {
        land: false, hx0: 8, hx1: 712, hy: 8 + top, hh: 100,
        picX: 24, picY: 128 + top, picW, picH,
        sideX: 444, sideY: 140 + top, sideW: 252,
        fx0: 0, fx1: 720, fieldTop: 128 + top + picH + 20, lineY: bot - 300, launchX: 360, launchY: bot - 244,
        joyX: 360, joyY: bot - 96, joyR: 86,
      };
    }
  }

  // 나라·계절 자연 풍경 (예전 퐁퐁 배경 그대로)
  drawBack() {
    setTheme('#f3e3c3', '#f3e3c3');
    this.add.rectangle(-2000, -2000, 6000, 6000, this.look.floor ?? 0xf3e3c3).setOrigin(0);
    if (hasNature(this.stage.id)) {
      const V = UI.landscape ? this.landscapeView() : UI.view;
      drawNature(this, V, this.stage.id, 1);
    }
    // 하늘 칸을 살짝 밝게 + 발사대 줄(점선)
    const L = this.L;
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0xffffff, 0.42).fillRoundedRect(L.fx0 + 6, L.fieldTop, L.fx1 - L.fx0 - 12, L.lineY - L.fieldTop + 40, 26); // 풍경 위에 기념품이 또렷하게
    for (let x = L.fx0 + 24; x < L.fx1 - 20; x += 26) g.fillStyle(0xffffff, 0.75).fillCircle(x, L.lineY + 40, 3);
  }

  text(x, y, s, size = 30, color = '#fffaf0', font = UI.fontTitle) {
    return this.add.text(x, y, s, { fontFamily: font, fontSize: `${size}px`, color }).setDepth(20);
  }

  // ── 위 상태 줄: ‖ · 나가기 · "퐁퐁 1/3 · 중국" · 남은 시간 + 시간 막대 ──
  drawHud() {
    const L = this.L;
    const [h0, h1] = this.look.hud ?? [0x8f6440, 0xa8784f];
    const g = this.add.graphics().setDepth(19);
    g.fillStyle(h0, 1).fillRoundedRect(L.hx0, L.hy, L.hx1 - L.hx0, L.hh, 26);
    g.fillStyle(h1, 1).fillRoundedRect(L.hx0 + 4, L.hy + 2, L.hx1 - L.hx0 - 8, L.hh - 8, 24);
    const cy = L.hy + L.hh / 2 - 2;
    const pb = this.add.container(L.hx0 + 52, cy).setDepth(20);
    const pg = this.add.graphics();
    pg.fillStyle(0xfffaf0, 1).fillCircle(0, 0, 32);
    pg.fillStyle(INK, 1).fillRoundedRect(-11, -13, 8, 26, 3).fillRoundedRect(3, -13, 8, 26, 3);
    pb.add(pg).setSize(96, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => this.openPause());
    addExitButton(this, L.hx0 + 142, cy, () => this.openPause({ title: '홈으로 나갈까?', sub: '', firstLabel: this.step !== 'solo' ? '처음부터 다시' : null, prevLabel: this.step === 'solo' && this.stageIdx >= 1 ? '전 단계로 되돌아가기' : null }), { depth: 20 });
    const mid = (L.hx0 + L.hx1) / 2 + 40;
    const who = this.step === 'remote' ? '각자 폰 대결 · ' : this.step === 'duo' ? `${this.duo.names[this.duo.turn - 1]} 차례 · ` : '';
    this.text(mid, cy - 16, `${who}퐁퐁 ${this.stageIdx + 1}/${STAGES.length} · ${this.stage.name}`, L.land ? 28 : 30).setOrigin(0.5);
    this.timeText = this.text(L.hx1 - 26, cy, fmt(PONG.timeSec), 38).setOrigin(1, 0.5);
    this.barW = L.land ? 300 : 250;
    this.barX = mid - this.barW / 2;
    this.barY = cy + 18;
    this.add.rectangle(this.barX, this.barY, this.barW, 10, INK, 0.35).setOrigin(0, 0.5).setDepth(20);
    this.bar = this.add.rectangle(this.barX, this.barY, this.barW, 10, 0x8ee07a).setOrigin(0, 0.5).setDepth(20);
  }

  // ── 완성할 그림: 그 나라·계절 풍경 + 블루나비/포포 + 소품, 위에 조각 덮개(?) ──
  makePicture() {
    const L = this.L;
    const pic = PICTURES[this.stage.chapter] ?? PICTURES.ch4;
    const bgKey = `pong_bg_${this.stage.chapter}`;
    if (!this.textures.exists(bgKey)) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      drawBackdrop(g, SPOT.W, SPOT.H, pic.theme, pic.hz ?? 0.46);
      g.generateTexture(bgKey, SPOT.W, SPOT.H);
      g.destroy();
    }
    const sc = L.picW / SPOT.W;
    const c = this.add.container(L.picX, L.picY).setScale(sc).setDepth(10);
    c.add(this.add.image(0, 0, bgKey).setOrigin(0));
    // 소품 (주인공은 빼고 — 사진 가운데에 크게 다시 그린다)
    for (const p of pic.props) if (p.k !== 'hero') c.add(makeProp(this, p));
    const hk = heroKey(this.stage.chapter);
    if (this.textures.exists(hk)) {
      const tex = this.textures.get(hk);
      const hero = this.add.image(SPOT.W / 2, SPOT.H * 0.66, hk, tex.has(0) ? 0 : '__BASE');
      const d = 250;
      hero.setScale(d / Math.max(hero.width, hero.height));
      c.add(hero);
      this.tweens.add({ targets: hero, y: hero.y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // 판 밖으로 나간 소품은 가린다 (캔버스·WebGL 모두 되는 도형 마스크)
    const mg = this.make.graphics({ x: 0, y: 0 }, false);
    mg.fillStyle(0xffffff, 1).fillRect(L.picX, L.picY, L.picW, L.picH);
    c.setMask(mg.createGeometryMask());
    this.picture = c;
    // 조각 덮개
    const cw = SPOT.W / this.cols, ch = SPOT.H / this.rows;
    this.cellW = cw; this.cellH = ch;
    for (let r = 0; r < this.rows; r++) for (let q = 0; q < this.cols; q++) {
      const cv = this.add.container(q * cw + cw / 2, r * ch + ch / 2);
      const g = this.add.graphics();
      g.fillStyle(0xfff6e2, 1).fillRect(-cw / 2, -ch / 2, cw, ch);
      g.lineStyle(4, 0xd8c8a8, 1).strokeRect(-cw / 2 + 2, -ch / 2 + 2, cw - 4, ch - 4);
      cv.add([g, this.add.text(0, 0, '?', { fontFamily: UI.fontTitle, fontSize: '64px', color: '#d8c8a8' }).setOrigin(0.5)]);
      c.add(cv);
      this.covers.push(cv);
    }
    // 테두리
    const f = this.add.graphics().setDepth(11);
    f.lineStyle(5, INK, 1).strokeRoundedRect(L.picX - 3, L.picY - 3, L.picW + 6, L.picH + 6, 12);
    this.frameG = f;
  }

  // 그림 옆(세로) / 아래(가로): 조각 n/N · 막대 · 규칙 한 줄
  drawSide() {
    const L = this.L;
    const x = L.sideX, y = L.sideY;
    const box = this.add.graphics().setDepth(12);
    const h = L.land ? 150 : L.picH - 20;
    box.fillStyle(0xfffaf0, 0.92).fillRoundedRect(x, y, L.sideW, h, 20);
    box.lineStyle(3, INK, 0.85).strokeRoundedRect(x, y, L.sideW, h, 20);
    this.text(x + 18, y + 16, SERIES.n === 2 ? '포포 사진' : '블루나비 사진', 24, '#5a5c88');
    this.pieceText = this.text(x + 18, y + 46, `조각 0/${this.pieces}`, 36, '#2b2d5a');
    this.pbarW = L.sideW - 36;
    this.add.rectangle(x + 18, y + 102, this.pbarW, 12, INK, 0.15).setOrigin(0, 0.5).setDepth(20);
    this.pbar = this.add.rectangle(x + 18, y + 102, 1, 12, 0xffb347).setOrigin(0, 0.5).setDepth(20);
    if (!L.land) this.text(x + 18, y + 124, `같은 그림 ${this.need}개가\n모이면 퐁! 한 조각`, 24, '#2b2d5a', UI.font).setLineSpacing(6);
    else this.text(x + 18, y + 118, `같은 그림 ${this.need}개 모이면 퐁!`, 22, '#2b2d5a', UI.font);
  }

  // ── 기념품 그림 하나 (비눗방울 + 그림) ──
  bubble(type, r) {
    const ty = this.stage.types[type];
    const c = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(ty.bg, 1).fillCircle(0, 0, r);
    g.fillStyle(0xffffff, 0.45).fillEllipse(-r * 0.35, -r * 0.42, r * 0.7, r * 0.42);
    g.lineStyle(4, INK, 0.9).strokeCircle(0, 0, r);
    const tex = this.textures.get(ty.icon);
    const fr = ty.frame != null && tex.has(ty.frame) ? ty.frame : (tex.has(0) ? 0 : '__BASE');
    const im = this.add.image(0, 0, ty.icon, fr);
    im.setScale((r * 1.36) / Math.max(im.width, im.height));
    c.add([g, im]);
    return c;
  }

  // ── 내려오는 기념품 무리 ──
  spawn(y0) {
    const L = this.L, R = PONG.bubbleR;
    const size = this.need > 2 && this.rand() < this.pairChance ? 2 : 1;
    const type = Math.floor(this.rand() * this.kinds);
    const half = size === 2 ? R * 2 : R;
    let x = 0;
    for (let k = 0; k < 10; k++) {
      x = L.fx0 + 30 + half + this.rand() * (L.fx1 - L.fx0 - 60 - half * 2);
      if (this.clusters.every((c) => Math.abs(c.y - (y0 ?? L.fieldTop)) > 150 || Math.abs(c.baseX - x) > 140)) break;
    }
    const cont = this.add.container(x, y0 ?? L.fieldTop - 10).setDepth(5);
    const cl = { type, members: [], baseX: x, y: cont.y, phase: this.rand() * Math.PI * 2, cont, dots: null };
    const offs = size === 2 ? [[-R * 0.96, 0], [R * 0.96, 0]] : [[0, 0]];
    for (const [dx, dy] of offs) this.addMember(cl, dx, dy);
    if (y0 == null) { cont.setAlpha(0).setScale(0.6); this.tweens.add({ targets: cont, alpha: 1, scale: 1, duration: 260, ease: 'Back.easeOut' }); }
    this.clusters.push(cl);
    return cl;
  }

  addMember(cl, dx, dy) {
    const b = this.bubble(cl.type, PONG.bubbleR);
    b.setPosition(dx, dy);
    cl.cont.add(b);
    cl.members.push({ dx, dy, obj: b });
    // 모인 개수 점 (●● / ●●●) — 하나짜리는 안 보임
    cl.dots?.destroy();
    cl.dots = null;
    if (cl.members.length >= 2) {
      const maxY = Math.max(...cl.members.map((m) => m.dy));
      const cx = cl.members.reduce((s, m) => s + m.dx, 0) / cl.members.length;
      cl.dots = this.add.text(cx, maxY + PONG.bubbleR + 14, '●'.repeat(cl.members.length) + '○'.repeat(Math.max(0, this.need - cl.members.length)), { fontFamily: UI.font, fontSize: '22px', color: '#2b2d5a', stroke: '#fffaf0', strokeThickness: 5 }).setOrigin(0.5);
      cl.cont.add(cl.dots);
    }
  }

  removeCluster(cl, burst) {
    this.clusters = this.clusters.filter((c) => c !== cl);
    if (burst) {
      this.tweens.add({ targets: cl.cont, scale: 1.3, alpha: 0, duration: 220, onComplete: () => cl.cont.destroy() });
    } else {
      this.tweens.add({ targets: cl.cont, alpha: 0, scale: 0.7, duration: 200, onComplete: () => cl.cont.destroy() });
    }
  }

  // ── 발사대: 지금 공 + 다음 공 ──
  makeLauncher() {
    const L = this.L;
    const g = this.add.graphics().setDepth(6);
    g.fillStyle(INK, 0.18).fillEllipse(L.launchX, L.launchY + 46, 150, 30);
    this.nextLabel = this.text(L.launchX + 118, L.launchY - 44, '다음 · 톡 바꾸기', 20, '#2b2d5a').setOrigin(0.5).setStroke('#fffaf0', 6);
    this.guide = this.add.graphics().setDepth(7);
  }

  pickType() {
    const here = [...new Set(this.clusters.filter((c) => c.y > this.L.fieldTop - 20).map((c) => c.type))];
    const pool = here.length ? here : [...Array(this.kinds).keys()];
    return pool[Math.floor(this.rand() * pool.length)];
  }

  // 다음 공을 발사대에 (지금 하늘에 없는 그림이면 있는 그림으로 바꿔 줌 — 언제나 맞힐 곳이 있게)
  reload(first = false) {
    if (first) this.queue = [this.pickType(), this.pickType()];
    else this.queue = [this.queue[1], this.pickType()];
    if (!this.clusters.some((c) => c.type === this.queue[0])) this.queue[0] = this.pickType();
    const L = this.L;
    this.curBall?.destroy();
    this.nextBall?.destroy();
    this.curBall = this.bubble(this.queue[0], PONG.ballR).setPosition(L.launchX, L.launchY).setDepth(8);
    this.curBall.add(this.add.graphics().lineStyle(5, INK, 1).strokeCircle(0, 0, PONG.ballR));
    this.nextBall = this.bubble(this.queue[1], 26).setPosition(L.launchX + 118, L.launchY).setDepth(8).setAlpha(0.95);
    // 지금 공·다음 공을 톡 하면 서로 바꾸기 (맞힐 곳이 막혔을 때)
    for (const o of [this.curBall, this.nextBall]) o.setSize(96, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => this.swap());
    if (!first) { this.curBall.setScale(0.4); this.tweens.add({ targets: this.curBall, scale: 1, duration: 160, ease: 'Back.easeOut' }); }
  }

  // ── 귀여운 조이스틱: 1탄 블루나비 얼굴 공 · 2탄 포포 발바닥 공 ──
  makeJoystick() {
    const L = this.L;
    const base = this.add.container(L.joyX, L.joyY).setDepth(9);
    const g = this.add.graphics();
    g.fillStyle(INK, 1).fillCircle(0, 6, L.joyR + 6);
    g.fillStyle(0xfffaf0, 1).fillCircle(0, 0, L.joyR);
    g.lineStyle(5, INK, 1).strokeCircle(0, 0, L.joyR);
    // 받침 위 작은 화살표 네 개
    g.fillStyle(0xd8c8a8, 1);
    for (const a of [0, 90, 180, 270]) {
      const r = Phaser.Math.DegToRad(a), ex = Math.sin(r), ey = -Math.cos(r), px = -ey, py = ex, d = L.joyR - 16;
      g.fillTriangle(ex * d, ey * d, ex * (d - 14) + px * 9, ey * (d - 14) + py * 9, ex * (d - 14) - px * 9, ey * (d - 14) - py * 9);
    }
    base.add(g);
    const knob = this.add.container(0, 0);
    const kg = this.add.graphics();
    const kr = 46;
    if (SERIES.n === 2) {
      // 강아지 발바닥: 분홍 공 + 큰 젤리 하나 + 작은 젤리 넷
      kg.fillStyle(0xffd1dc, 1).fillCircle(0, 0, kr).lineStyle(5, INK, 1).strokeCircle(0, 0, kr);
      kg.fillStyle(0xff8fae, 1).fillEllipse(0, 10, 40, 32);
      [[-24, -14], [-9, -25], [9, -25], [24, -14]].forEach(([x, y]) => kg.fillCircle(x, y, 8));
    } else {
      // 블루나비 얼굴: 파란 공 + 더듬이 + 눈·볼
      kg.lineStyle(4, INK, 1).lineBetween(-12, -kr + 4, -20, -kr - 14).lineBetween(12, -kr + 4, 20, -kr - 14);
      kg.fillStyle(INK, 1).fillCircle(-20, -kr - 16, 5).fillCircle(20, -kr - 16, 5);
      kg.fillStyle(0x7ec8ff, 1).fillCircle(0, 0, kr).lineStyle(5, INK, 1).strokeCircle(0, 0, kr);
      kg.fillStyle(0xffffff, 0.5).fillEllipse(-14, -20, 26, 14);
      kg.fillStyle(INK, 1).fillEllipse(-15, -2, 12, 16).fillEllipse(15, -2, 12, 16);
      kg.fillStyle(0xffffff, 1).fillCircle(-12, -6, 3).fillCircle(18, -6, 3);
      kg.fillStyle(0xff9fb8, 0.9).fillEllipse(-28, 14, 16, 9).fillEllipse(28, 14, 16, 9);
      kg.lineStyle(3, INK, 1).beginPath().arc(0, 10, 9, 0.2, Math.PI - 0.2).strokePath();
    }
    knob.add(kg);
    base.add(knob);
    this.joyBase = base;
    this.knob = knob;
    this.hint = (L.land
      ? this.text(L.joyX, L.joyY - L.joyR - 46, '끌어서 겨누고\n손을 떼면 퐁!', 22, '#2b2d5a', UI.font).setOrigin(0.5)
      : this.text(L.joyX - L.joyR - 24, L.joyY, '끌어서 겨누고\n손을 떼면 퐁!', 24, '#2b2d5a', UI.font).setOrigin(1, 0.5)).setAlign('center').setStroke('#fffaf0', 6).setDepth(21);
  }

  // ── 손가락: 조이스틱 둘레를 누르면 겨누기 시작, 놓으면 발사 ──
  setupInput() {
    this.input.addPointer(2);
    const L = this.L;
    this.input.on('pointerdown', (p, over) => {
      if (over.length || this.ended || this.joyId != null) return;
      if (Phaser.Math.Distance.Between(p.worldX, p.worldY, L.joyX, L.joyY) > L.joyR * 1.9) return;
      this.joyId = p.id;
      this.moveKnob(p.worldX - L.joyX, p.worldY - L.joyY);
    });
    this.input.on('pointermove', (p) => {
      if (p.id !== this.joyId || !p.isDown) return;
      this.moveKnob(p.worldX - L.joyX, p.worldY - L.joyY);
    });
    const up = (p) => {
      if (p.id !== this.joyId) return;
      this.joyId = null;
      const a = this.aim;
      this.aim = null;
      this.guide.clear();
      this.tweens.add({ targets: this.knob, x: 0, y: 0, duration: 140, ease: 'Back.easeOut' });
      if (a != null) this.shoot(a);
    };
    this.input.on('pointerup', up);
    this.input.on('pointerupoutside', up);
  }

  moveKnob(dx, dy) {
    const R = this.L.joyR - 30;
    const len = Math.hypot(dx, dy);
    const k = len > R ? R / len : 1;
    this.knob.setPosition(dx * k, dy * k);
    if (len < PONG.aimMin) { this.aim = null; this.guide.clear(); return; }
    // 손잡이가 가리키는 쪽으로 겨눔 (아래를 가리키면 옆으로 눕힌 각도로)
    let ang = Math.atan2(dx, -dy);
    const max = Phaser.Math.DegToRad(PONG.maxAngle);
    if (ang > max) ang = max;
    if (ang < -max) ang = -max;
    this.aim = ang;
    this.drawGuide(ang);
    if (this.hint && !this.hintGone) { this.hintGone = true; this.tweens.add({ targets: this.hint, alpha: 0, duration: 300 }); }
  }

  // 겨눈 길: 점선, 양옆 벽에서 튕기는 길까지
  drawGuide(ang) {
    const L = this.L, r = PONG.ballR;
    const g = this.guide.clear();
    let x = L.launchX, y = L.launchY, vx = Math.sin(ang), vy = -Math.cos(ang);
    let travelled = 0, bounces = 0, k = 0;
    while (travelled < 1300 && y > L.fieldTop - 10 && bounces < 3) {
      x += vx * 8; y += vy * 8; travelled += 8;
      if (x < L.fx0 + r) { x = L.fx0 + r; vx = -vx; bounces++; }
      if (x > L.fx1 - r) { x = L.fx1 - r; vx = -vx; bounces++; }
      if (++k % 4 === 0 && travelled > 50) g.fillStyle(INK, 0.55 * (1 - travelled / 1500)).fillCircle(x, y, 5);
    }
  }

  // 지금 공 ↔ 다음 공
  swap() {
    if (this.ended || this.ball || !this.curBall) return;
    this.queue = [this.queue[1], this.queue[0]];
    const L = this.L;
    this.curBall.destroy();
    this.nextBall.destroy();
    this.curBall = this.bubble(this.queue[0], PONG.ballR).setPosition(L.launchX, L.launchY).setDepth(8);
    this.curBall.add(this.add.graphics().lineStyle(5, INK, 1).strokeCircle(0, 0, PONG.ballR));
    this.nextBall = this.bubble(this.queue[1], 26).setPosition(L.launchX + 118, L.launchY).setDepth(8).setAlpha(0.95);
    for (const o of [this.curBall, this.nextBall]) o.setSize(96, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => this.swap());
    sfx('toggle');
  }

  // 공 쏘기 (자동 시험도 이 함수를 부른다)
  shoot(ang) {
    if (this.ended || !this.running || this.ball || !this.curBall) return false;
    unlockAudio();
    const L = this.L;
    const b = this.curBall;
    this.curBall = null;
    b.setDepth(8);
    this.ball = { obj: b, x: L.launchX, y: L.launchY, vx: Math.sin(ang) * PONG.ballSpeed, vy: -Math.cos(ang) * PONG.ballSpeed, type: this.queue[0], done: false };
    sfx('tap');
    vibrate('collect');
    return true;
  }

  // ── 매 장면 ──
  update(time, delta) {
    if (!this.stage || this.ended) return;
    const dt = Math.min(delta, 50) / 1000;
    if (this.running) {
      this.elapsed += dt;
      const left = this.leftSec();
      this.timeText.setText(fmt(Math.ceil(left)));
      this.bar.width = Math.max(0, this.barW * (left / PONG.timeSec));
      this.bar.setFillStyle(left <= 10 ? 0xff7f6e : 0x8ee07a);
      if (left <= 10 && !this.hurry) { this.hurry = true; setMusicTempo(1.15); }
      if (left <= 0) { this.timeUp(); return; }
    }
    this.moveClusters(dt, time);
    if (this.ball) this.moveBall(dt);
  }

  leftSec() { return Math.max(0, PONG.timeSec - this.elapsed - this.penalty); }

  moveClusters(dt, time) {
    const L = this.L, R = PONG.bubbleR;
    const speed = (L.lineY - L.fieldTop) / this.fallSec;
    for (const cl of [...this.clusters]) {
      cl.y += speed * dt;
      const ext = Math.max(...cl.members.map((m) => Math.abs(m.dx))) + R;
      const sway = Math.sin(cl.phase + time / 900) * 16;
      cl.cont.x = Phaser.Math.Clamp(cl.baseX + sway, L.fx0 + ext + 8, L.fx1 - ext - 8);
      cl.cont.y = cl.y;
      const low = cl.y + Math.max(...cl.members.map((m) => m.dy)) + R;
      if (low > L.lineY + 40) this.removeCluster(cl, false); // 발사대 줄에 닿으면 뽁 (벌 없음)
    }
    let n = this.clusters.length;
    while (n < this.onScreen) { this.spawn(); n++; }
  }

  moveBall(dt) {
    const L = this.L, b = this.ball, r = PONG.ballR, R = PONG.bubbleR;
    const steps = 4;
    for (let s = 0; s < steps && !b.done; s++) {
      b.x += (b.vx * dt) / steps;
      b.y += (b.vy * dt) / steps;
      if (b.x < L.fx0 + r) { b.x = L.fx0 + r; b.vx = Math.abs(b.vx); }
      if (b.x > L.fx1 - r) { b.x = L.fx1 - r; b.vx = -Math.abs(b.vx); }
      if (b.vy > 0) continue; // 튕겨 나가는 공은 아무것도 안 맞힘
      for (const cl of this.clusters) {
        for (const m of cl.members) {
          const mx = cl.cont.x + m.dx, my = cl.cont.y + m.dy;
          if (Phaser.Math.Distance.Between(b.x, b.y, mx, my) < r + R - 8) { this.hit(cl, m, mx, my); break; }
        }
        if (b.done) break;
      }
    }
    if (!b.done) {
      b.obj.setPosition(b.x, b.y);
      if (b.y < L.fieldTop - 60 || b.y > L.launchY + 60) this.endBall(); // 아무것도 안 맞고 하늘로 / 튕긴 공이 아래로
    }
  }

  endBall() {
    const b = this.ball;
    if (!b) return;
    b.done = true;
    this.tweens.add({ targets: b.obj, alpha: 0, duration: 150, onComplete: () => b.obj.destroy() });
    this.ball = null;
    if (!this.ended) this.reload();
  }

  hit(cl, m, mx, my) {
    const b = this.ball;
    if (cl.type !== b.type) {
      // 다른 그림: 통 튕겨 나가고 -3초
      b.vy = Math.abs(b.vy) * 0.6;
      b.vx = (b.x - mx) * 6;
      this.penalty += PONG.wrongSec;
      sfx('respawn');
      this.tweens.add({ targets: m.obj, scale: 1.12, duration: 90, yoyo: true });
      this.float(mx, my - 50, `-${PONG.wrongSec}초`, '#e0557a');
      return;
    }
    b.done = true;
    this.ball = null;
    if (cl.members.length + 1 >= this.need) {
      // 같은 그림이 다 모였다 → 퐁! 조각 하나
      b.obj.destroy();
      const cx = cl.cont.x, cy = cl.cont.y;
      this.removeCluster(cl, true);
      sfx(`pop${Math.min(5, this.need)}`);
      vibrate('collect');
      this.float(cx, cy - 40, '퐁!', '#ff7fa3', 44);
      this.sparkle(cx, cy);
      this.addPiece(cx, cy);
    } else {
      // 같은 그림이지만 아직 모자람 → 무리에 붙는다
      const ang = Math.atan2(b.y - my, b.x - mx);
      const d = PONG.bubbleR * 1.92;
      b.obj.destroy();
      this.addMember(cl, m.dx + Math.cos(ang) * d, m.dy + Math.sin(ang) * d);
      sfx('toggle');
      this.tweens.add({ targets: cl.cont, scale: 1.08, duration: 90, yoyo: true });
    }
    if (!this.ended) this.reload();
  }

  float(x, y, s, color, size = 34) {
    const t = this.text(x, y, s, size, color).setOrigin(0.5).setStroke('#fffaf0', 8).setDepth(22);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 800, delay: 200, onComplete: () => t.destroy() });
  }

  sparkle(x, y) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const s = this.add.star(x, y, 5, 5, 11, i % 2 ? 0xffd84a : 0xffffff).setDepth(21);
      this.tweens.add({ targets: s, x: x + Math.cos(a) * 80, y: y + Math.sin(a) * 80, alpha: 0, scale: 0.4, duration: 420, onComplete: () => s.destroy() });
    }
  }

  // 조각 하나가 날아가 빈칸에 쏙
  addPiece(x, y) {
    const open = this.covers.map((c, i) => (c.active && !c.taken ? i : -1)).filter((i) => i >= 0);
    if (!open.length) return;
    const i = open[Math.floor(this.rand() * open.length)];
    const cv = this.covers[i];
    cv.taken = true;
    const sc = this.picture.scaleX;
    const tx = this.picture.x + cv.x * sc, ty = this.picture.y + cv.y * sc;
    const w = this.cellW * sc, h = this.cellH * sc;
    const fly = this.add.container(x, y).setDepth(23);
    const g = this.add.graphics();
    g.fillStyle(0xffe9a8, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 8).lineStyle(4, 0xffb347, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    fly.add(g).setScale(0.5);
    this.filled++;
    const done = this.filled >= this.pieces;
    this.tweens.add({
      targets: fly, x: tx, y: ty, scale: 1, duration: 480, ease: 'Cubic.easeInOut',
      onComplete: () => {
        fly.destroy();
        this.tweens.add({ targets: cv, scale: 0, alpha: 0, duration: 180, onComplete: () => cv.destroy() });
        sfx('ding');
        this.pieceText.setText(`조각 ${Math.min(this.filled, this.pieces)}/${this.pieces}`);
        this.pbar.width = Math.max(1, this.pbarW * (this.filled / this.pieces));
        if (done) this.complete();
      },
    });
    if (done) this.running = false; // 마지막 조각이 날아가는 동안 시간은 멈춤
  }

  // ── 시작 신호 ──
  readyGo(ms) {
    const L = this.L;
    const t = this.text((L.fx0 + L.fx1) / 2, (L.fieldTop + L.lineY) / 2, `같은 그림 ${this.need}개를 모아요!`, 40, '#2f7bff').setOrigin(0.5).setStroke('#fffaf0', 10).setDepth(24);
    this.time.delayedCall(ms, () => { this.running = true; this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, duration: 300, onComplete: () => t.destroy() }); });
  }

  countdown() {
    const L = this.L;
    const t = this.text((L.fx0 + L.fx1) / 2, (L.fieldTop + L.lineY) / 2, '', 140, '#2f7bff').setOrigin(0.5).setDepth(24).setStroke('#fffaf0', 14);
    ['셋', '둘', '하나', '출발!'].forEach((w, i) => this.time.delayedCall(i * 800, () => {
      t.setText(w).setScale(0.6).setAlpha(1);
      this.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.easeOut' });
      sfx(i < 3 ? 'tap' : 'ding');
    }));
    this.time.delayedCall(3200, () => { this.tweens.add({ targets: t, alpha: 0, duration: 250, onComplete: () => t.destroy() }); this.running = true; });
  }

  // ── 끝: 그림 완성 ──
  complete() {
    if (this.ended) return;
    this.ended = true;
    setMusicTempo(1);
    this.running = false;
    const sec = Math.round((this.elapsed + this.penalty) * 10) / 10;
    if (this.step === 'duo') { this.finishDuo(sec, 0, true); return; }
    if (this.step === 'remote') { this.finishRemote(sec, 0, true); return; }
    // 기록
    state.pop = state.pop ?? { reached: 0, best: {} };
    state.pop.bestSec = state.pop.bestSec ?? {};
    const prev = state.pop.bestSec[this.stage.id];
    const isBest = prev == null || sec < prev;
    if (isBest) state.pop.bestSec[this.stage.id] = sec;
    state.pop.reached = Math.max(state.pop.reached ?? 0, Math.min(STAGES.length - 1, this.stageIdx + 1));
    save();
    sfx('win');
    vibrate('special');
    const last = this.stageIdx === STAGES.length - 1;
    const who = SERIES.n === 2 ? '포포' : '블루나비';
    const where = SERIES.n === 2 ? `${this.stage.name} 서울에서` : `${this.stage.name}에서`;
    this.showPhoto(`${who}, ${where} 찰칵!`, `걸린 시간 ${fmt(sec)}${isBest ? ' · 새 기록!' : ` · 최고 ${fmt(prev)}`}`, [
      last ? ['처음 판부터 다시', () => this.scene.start('Pop', { step: 'solo', stage: 0 })] : [`다음 ${SERIES.n === 2 ? '계절' : '나라'}로 · ${STAGES[this.stageIdx + 1].name}`, () => this.scene.start('Pop', { step: 'solo', stage: this.stageIdx + 1 })],
      ['다시 하기', () => this.scene.start('Pop', { step: 'solo', stage: this.stageIdx }), 'sub'],
      ['홈으로', () => this.scene.start('Title'), 'plain'],
    ]);
  }

  // 시간이 다 됐다 (게임오버 없음)
  timeUp() {
    if (this.ended) return;
    this.ended = true;
    setMusicTempo(1);
    this.running = false;
    const missing = this.pieces - this.filled;
    if (this.step === 'duo') { this.finishDuo(PONG.timeSec + missing * PONG.missPieceSec, missing, false); return; }
    if (this.step === 'remote') { this.finishRemote(PONG.timeSec + missing * PONG.missPieceSec, missing, false); return; }
    sfx('respawn');
    this.showPhoto('아깝다! 다시 도전?', `조각 ${this.filled}/${this.pieces}까지 채웠어요`, [
      ['다시 도전', () => this.scene.start('Pop', { step: 'solo', stage: this.stageIdx })],
      ['나가기', () => this.scene.start('Title'), 'sub'],
    ], false);
  }

  finishDuo(sec, missing, done) {
    const { names, turn } = this.duo;
    const results = [...(this.duo.results ?? [])];
    results[turn - 1] = { sec, rolls: missing };
    sfx(done ? 'win' : 'respawn');
    this.showPhoto(done ? `${names[turn - 1]} 그림 완성!` : `${names[turn - 1]} 시간 끝!`, done ? `걸린 시간 ${fmt(sec)}` : `조각 ${this.filled}/${this.pieces} · 기록 ${fmt(sec)}`, [], done);
    const next = turn === 1 ? { step: 'turn', turn: 2 } : { step: 'result' };
    this.time.delayedCall(2000, () => this.scene.start('Duo', { ...next, game: 'pop', stage: this.stageIdx, names, results, seed: this.seed }));
  }

  finishRemote(sec, missing, done) {
    saveMyResult(this.match.id, sec, missing);
    sfx(done ? 'win' : 'respawn');
    this.showPhoto(done ? '그림 완성!' : '시간 끝!', done ? `걸린 시간 ${fmt(sec)}` : `조각 ${this.filled}/${this.pieces} · 기록 ${fmt(sec)}`, [
      ['결과 보기', () => this.scene.start('Match', { id: this.match.id })],
    ], done);
  }

  // 완성한 사진(또는 채운 만큼)을 가운데 크게 + 제목 + 버튼
  showPhoto(title, body, buttons, flash = true) {
    this.guide.clear();
    this.clusters.forEach((c) => this.tweens.add({ targets: c.cont, alpha: 0, duration: 300 }));
    const V = UI.landscape ? this.landscapeView() : UI.view;
    const layer = this.add.container(0, 0).setDepth(40);
    layer.add(this.add.rectangle(-2000, -2000, 6000, 6000, INK, 0.5).setOrigin(0).setInteractive());
    if (flash) {
      const f = this.add.rectangle(-2000, -2000, 6000, 6000, 0xffffff, 1).setOrigin(0).setDepth(60);
      this.tweens.add({ targets: f, alpha: 0, duration: 450, onComplete: () => f.destroy() });
      sfx('stamp');
    }
    // 사진: 그림 판을 가운데로 크게 옮긴다
    const land = UI.landscape;
    const pw = land ? 560 : 620;
    const sc = pw / SPOT.W;
    const ph = SPOT.H * sc;
    const cx = land ? V.left + 40 + pw / 2 : 360;
    const py = land ? 130 + this.top : 150 + this.top;
    this.picture.clearMask(true);
    this.picture.setDepth(41);
    this.frameG.setDepth(41).clear();
    this.tweens.add({ targets: this.picture, x: cx - pw / 2, y: py, scaleX: sc, scaleY: sc, duration: 420, ease: 'Cubic.easeOut' });
    const fr = this.add.graphics().setDepth(42).setAlpha(0);
    fr.fillStyle(0xffffff, 1).fillRect(cx - pw / 2 - 14, py - 14, pw + 28, 12).fillRect(cx - pw / 2 - 14, py + ph + 2, pw + 28, 46)
      .fillRect(cx - pw / 2 - 14, py - 2, 12, ph + 4).fillRect(cx + pw / 2 + 2, py - 2, 12, ph + 4);
    fr.lineStyle(4, INK, 1).strokeRect(cx - pw / 2 - 14, py - 14, pw + 28, ph + 62);
    this.tweens.add({ targets: fr, alpha: 1, duration: 300, delay: 300 });
    const tx = land ? V.right - 300 : 360;
    let ty = land ? 200 + this.top : py + ph + 110;
    const t1 = this.add.text(tx, ty, title, { fontFamily: UI.fontTitle, fontSize: title.length > 14 ? '40px' : '48px', color: '#fffaf0', stroke: '#2b2d5a', strokeThickness: 10, align: 'center', wordWrap: { width: land ? 520 : 660 } }).setOrigin(0.5).setDepth(43);
    const t2 = this.add.text(tx, ty + 66, body, { fontFamily: UI.font, fontSize: '28px', color: '#fffaf0', stroke: '#2b2d5a', strokeThickness: 7, align: 'center' }).setOrigin(0.5).setDepth(43);
    layer.add([t1, t2]);
    ty += 170;
    this.endButtons = buttons.map(([label, fn, kind], i) => {
      const style = kind === 'sub' ? { width: 400, height: 96, fontSize: 30, color: 0xffb347, shade: 0xd98a2b, textColor: '#2b2d5a' }
        : kind === 'plain' ? { width: 320, height: 86, fontSize: 28, color: 0xfffaf0, shade: 0xd8c8a8, textColor: '#2b2d5a' }
          : { width: 480, height: 104, fontSize: 32 };
      const b = new Button(this, tx, ty + i * 124, { ...style, label, onPress: () => { sfx('tap'); fn(); } });
      b.setDepth(44);
      return b;
    });
  }

  // [나가기] 창의 [처음부터 다시] (둘이서·각자 폰은 같은 판 처음부터)
  restartFromFirst() {
    if (this.step === 'remote') this.scene.start('Pop', { step: 'remote', stage: this.stageIdx, match: this.match?.id });
    else if (this.step === 'duo') this.scene.start('Pop', { step: 'duo', stage: this.stageIdx, duo: this.duo });
    else this.scene.start('Pop', { step: 'solo', stage: 0 });
  }

  // [전 단계로 되돌아가기] → 바로 앞 나라·계절
  restartPrev() { this.scene.start('Pop', { step: 'solo', stage: Math.max(0, this.stageIdx - 1) }); }

  openPause(confirmExit = false) {
    if (this.ended || !this.scene.isActive() || !this.stage) return;
    this.scene.launch('Pause', { under: 'Pop', frame: 'woodWindow', confirmExit, restartLabel: '이 판 처음부터', restartData: { step: this.step, stage: this.stageIdx, match: this.match?.id, duo: this.duo } });
    this.scene.pause();
  }
}
