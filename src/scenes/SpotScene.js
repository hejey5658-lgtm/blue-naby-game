import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { CHAPTERS, stageLabel, stageNo } from '../data/chapters.js';
import { SPOT, PICTURES } from '../data/spot.js';
import { LOOK } from '../data/mazeLooks.js';
import { drawBackdrop, THEMES } from '../pop/popNature.js';
import { makeProp, hitOf } from '../spot/props.js';
import { state, save } from '../state.js';
import { setTheme } from '../ui/theme.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { drawPanel } from '../ui/frames.js';
import { Button } from '../ui/Button.js';
import { sfx, vibrate } from '../ui/feedback.js';
import { challengeResult, openShareMenu, fmt as fmtShort } from '../social/social.js';
import { saveMyResult, matchById } from '../social/match.js';
import { addExitButton } from '../ui/exitButton.js';
import { SERIES } from '../series.js';
import { josa } from '../ui/josa.js';
import { afterChapter, startChapter } from '../flow.js';

// 틀린그림 찾기 (20절, 2026-11-15 — 미로 대신). 씬 이름은 예전 미로와 같은 'Maze'라서
// 홈 이어하기·단계 흐름(flow.js)·나가기 창(PauseScene)·둘이서(DuoScene)·각자 폰 대결(MatchScene)이 그대로 이어진다.
// 위 = 원래 그림, 아래 = 다른 곳(1단계 5개 · 2단계 7개 · 3단계 9개)이 숨은 그림 (가로 화면은 왼쪽·오른쪽). 위·아래 어느 쪽을 톡 해도 된다.
// scene.start('Maze', { chapter, fresh, duo?: { names, turn, results, remote?, seed? }, resume?: { seed, elapsed, found } })
const INK = 0x2b2d5a;
const fmtTime = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const hashStr = (s) => [...String(s)].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7);
function rng(seed) {
  let a = Math.abs(seed | 0) % 2147483646 + 1;
  return () => { a = (a * 16807) % 2147483647; return (a - 1) / 2147483646; };
}

export class SpotScene extends Phaser.Scene {
  constructor() { super('Maze'); }

  init(data) {
    this.initData = data;
    this.chapter = CHAPTERS.find((c) => c.id === data.chapter) ?? CHAPTERS[0];
    this.pic = PICTURES[this.chapter.id] ?? PICTURES.ch4;
    this.look = LOOK[this.chapter.id] ?? null;
    this.duo = data.duo ?? null;
    this.remote = this.duo?.remote ?? null;
    const r = data.resume ?? null;
    this.seed = r?.seed ?? this.duo?.seed ?? (this.remote ? matchById(this.remote)?.seed : null) ?? Math.floor(Math.random() * 2147483646) + 1;
    if (this.duo && this.duo.seed == null) this.duo = { ...this.duo, seed: this.seed };
    this.elapsed = r?.elapsed ?? 0;
    this.found = new Set(r?.found ?? []);
    // 씬은 다시 쓰이므로 지난 판의 표시를 지운다
    Object.assign(this, { finished: false, resultShown: false, lockUntil: 0, hurry: false, lastTick: -1, startWait: this.duo && !r ? 1300 : 0 });
    this.need = SPOT.findByStage?.[stageNo(this.chapter.id) - 1] ?? SPOT.find; // 단계마다 5·7·9개
    this.pickDiffs();
  }

  // 후보 중 find 개를 시드로 고른다 (같은 소품은 한 번만)
  pickDiffs() {
    const all = this.pic.diffs;
    const rand = rng(this.seed + hashStr(this.chapter.id));
    const order = all.map((_, k) => k);
    for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(rand() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
    const used = new Set();
    this.diffs = [];
    for (const k of order) {
      const d = all[k];
      if (d.i != null && used.has(d.i)) continue;
      if (d.i != null) used.add(d.i);
      this.diffs.push(d);
      if (this.diffs.length === this.need) break;
    }
    // 맞히는 자리 (크기가 바뀌면 둘 중 큰 쪽)
    this.hits = this.diffs.map((d) => {
      if (d.t === 'add') return hitOf(d.p);
      const p = this.pic.props[d.i];
      const h = hitOf(p);
      if (d.t === 'size') { const h2 = hitOf({ ...p, s: d.s }); return h2.r > h.r ? h2 : h; }
      return h;
    });
  }

  snapshot() { return { chapter: this.chapter.id, duo: this.duo, resume: { seed: this.seed, elapsed: this.elapsed, found: [...this.found] } }; }

  canRelayout() { return !this.finished; }

  create() {
    const W = UI.fullWidth, H = UI.fullHeight, L = UI.landscape;
    const ins = this.insets = getSafeInsets(this.game, true);
    const T = THEMES[this.pic.theme];
    const bgHex = `#${(T?.sky[1] ?? 0xf3e3c3).toString(16).padStart(6, '0')}`;
    setTheme(bgHex, bgHex);
    this.add.rectangle(0, 0, W, H, T?.sky[1] ?? 0xf3e3c3).setOrigin(0);
    this.add.rectangle(0, H * 0.55, W, H * 0.45, T?.ground ?? 0xd6edbc, 0.55).setOrigin(0);

    // 그림 자리
    const hudH = L ? 108 : 156;
    const gap = 22;
    const avW = W - (L ? 48 : 24) - ins.left - ins.right;
    const avH = H - ins.top - ins.bottom - hudH - 16;
    let sc, A, B;
    if (!L) {
      sc = Math.min(1, avW / SPOT.W, (avH - gap) / 2 / SPOT.H);
      const pw = SPOT.W * sc, ph = SPOT.H * sc;
      const y0 = ins.top + hudH + Math.max(6, (avH - 2 * ph - gap) / 2);
      A = { x: (W - pw) / 2, y: y0 }; B = { x: A.x, y: y0 + ph + gap };
    } else {
      sc = Math.min((avW - gap) / 2 / SPOT.W, avH / SPOT.H);
      const pw = SPOT.W * sc, ph = SPOT.H * sc;
      const x0 = (W - 2 * pw - gap) / 2, y0 = ins.top + hudH + Math.max(4, (avH - ph) / 2);
      A = { x: x0, y: y0 }; B = { x: x0 + pw + gap, y: y0 };
    }
    this.sc = sc;
    this.ensureBackdrop();
    this.picA = this.makePicture(A.x, A.y, sc, false);
    this.picB = this.makePicture(B.x, B.y, sc, true);
    // 이미 찾은 곳(화면을 돌린 뒤 이어서) 다시 표시
    for (const j of this.found) this.markFound(j, false);

    this.makeHud(hudH);
    this.input.on('pointerup', (p, over) => this.onTap(p, over));
    const onHidden = () => this.openPause();
    this.game.events.on('app-hidden', onHidden);
    this.events.once('shutdown', () => this.game.events.off('app-hidden', onHidden));

    if (!this.duo) {
      state.playing = this.chapter.id;
      state.step = `${this.chapter.id}_maze`;
      state.mazeState = null;
      // 진화·옷 갈아입기 장면이 없어져서 그 단계 모습으로 맞춘다 (엔딩·기록 카드 그림)
      if (this.chapter.form) state.form = this.chapter.form;
      save();
    }
    if (this.startWait) this.readyBand();
    sfx(`arrive_${this.chapter.id}`);
  }

  // 그림 바탕(하늘·산·언덕·들판)은 그림마다 한 장으로 구워 둔다
  ensureBackdrop() {
    this.bgKey = `spot_bg_${this.chapter.id}`;
    if (this.textures.exists(this.bgKey)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    drawBackdrop(g, SPOT.W, SPOT.H, this.pic.theme, this.pic.hz ?? 0.46);
    g.generateTexture(this.bgKey, SPOT.W, SPOT.H);
    g.destroy();
  }

  // 그림 한 장: changed = 아래 그림(다른 곳이 들어간 그림)
  makePicture(x, y, sc, changed) {
    const c = this.add.container(x, y).setScale(sc).setDepth(2);
    c.add(this.add.image(0, 0, this.bgKey).setOrigin(0));
    const byIndex = new Map();
    if (changed) for (const d of this.diffs) if (d.i != null) byIndex.set(d.i, d);
    this.pic.props.forEach((p, i) => {
      const d = byIndex.get(i);
      if (d?.t === 'hide') return;
      const q = !d ? p : d.t === 'color' ? { ...p, c: d.c } : d.t === 'size' ? { ...p, s: d.s } : d.t === 'flip' ? { ...p, flip: !p.flip } : p;
      c.add(makeProp(this, q));
    });
    if (changed) for (const d of this.diffs) if (d.t === 'add') c.add(makeProp(this, d.p));
    const f = this.add.graphics();
    f.lineStyle(10, 0xffffff, 1).strokeRoundedRect(-3, -3, SPOT.W + 6, SPOT.H + 6, 20);
    f.lineStyle(5, INK, 1).strokeRoundedRect(-6, -6, SPOT.W + 12, SPOT.H + 12, 22);
    c.add(f);
    c.marks = this.add.container(0, 0);
    c.add(c.marks);
    return c;
  }

  // ── 상태 줄 ──
  makeHud(hudH) {
    const W = UI.fullWidth, L = UI.landscape, top = this.insets.top;
    const [h0, h1] = this.look?.hud ?? [0x8f6440, 0xa8784f];
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(h0, 1).fillRoundedRect(8, 6 + top, W - 16, hudH - 14, 26);
    g.fillStyle(h1, 1).fillRoundedRect(12, 8 + top, W - 24, hudH - 22, 24);
    const pb = this.add.container(58, 52 + top).setDepth(6);
    const pg = this.add.graphics();
    pg.fillStyle(0xfffaf0, 1).fillCircle(0, 0, 32);
    pg.fillStyle(INK, 1).fillRoundedRect(-12, -14, 8, 28, 3).fillRoundedRect(4, -14, 8, 28, 3);
    pb.add(pg).setSize(96, 88).setInteractive({ useHandCursor: true }).on('pointerup', () => this.openPause());
    addExitButton(this, 150, 52 + top, () => this.openPause(this.exitAsk()), { depth: 6 });
    const cx = L ? W / 2 - 40 : W / 2 + 40;
    this.add.text(cx, 34 + top, stageLabel(this.chapter), { fontFamily: UI.fontTitle, fontSize: '34px', color: '#ffffff' }).setOrigin(0.5).setDepth(6);
    const dn = this.duo?.names[this.duo.turn - 1];
    const best = state.records[this.chapter.id]?.mazeSec;
    const sub = this.remote ? '각자 폰 대결' : this.duo ? (dn === `${this.duo.turn}P` ? `${dn} 차례` : `${this.duo.turn}P ${dn} 차례`) : best != null ? `다른 곳 ${this.need}개 · 최고 ${fmtTime(best)}` : `다른 곳 ${this.need}개를 톡!`;
    this.add.text(cx, 68 + top, sub, { fontFamily: UI.font, fontSize: '23px', color: '#fff6e6' }).setOrigin(0.5).setDepth(6);
    this.timeText = this.add.text(W - 40, 40 + top, '', { fontFamily: UI.fontTitle, fontSize: '40px', color: '#ffffff' }).setOrigin(1, 0.5).setDepth(6);
    // 찾은 곳 동그라미
    const dy = L ? 66 + top : 110 + top;
    const dx0 = L ? W - 40 - (this.need - 1) * 36 - 24 : W / 2 - ((this.need - 1) * 44) / 2;
    this.dots = Array.from({ length: this.need }, (_, k) => this.add.circle(dx0 + k * (L ? 36 : 44), dy + (L ? 10 : 0), L ? 12 : 15, 0xffffff, 0.35).setStrokeStyle(3, 0xffffff, 0.9).setDepth(6));
    // 남은 시간 막대
    const by = L ? 92 + top : 138 + top;
    const bx = L ? W / 2 - 300 : 40, bw = L ? 520 : W - 80;
    this.add.rectangle(bx, by, bw, 10, 0x000000, 0.18).setOrigin(0, 0.5).setDepth(6);
    this.bar = this.add.rectangle(bx, by, bw, 10, 0x9be27a, 1).setOrigin(0, 0.5).setDepth(6);
    this.barW = bw;
    for (const j of this.found) this.dots[j]?.setFillStyle(0xffd84a, 1);
    this.toast = this.add.text(W / 2, this.picB.y - 14, '', { fontFamily: UI.fontTitle, fontSize: '26px', color: '#ffffff', backgroundColor: '#2b2d5acc', padding: { x: 12, y: 4 } }).setOrigin(0.5, 1).setDepth(8).setAlpha(0);
    this.updateTime();
  }

  readyBand() {
    const t = this.add.text(UI.fullWidth / 2, UI.fullHeight / 2, '준비…', { fontFamily: UI.fontTitle, fontSize: '64px', color: '#ffffff', stroke: '#2b2d5a', strokeThickness: 10 }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(this.startWait - 400, () => t.setText('시작!'));
    this.tweens.add({ targets: t, alpha: 0, delay: this.startWait, duration: 300, onComplete: () => t.destroy() });
  }

  update(_t, delta) {
    if (this.finished) return;
    if (this.startWait > 0) { this.startWait -= delta; return; }
    this.elapsed += delta / 1000;
    this.updateTime();
    if (this.elapsed >= SPOT.timeSec) this.timeUp();
  }

  updateTime() {
    const left = Math.max(0, SPOT.timeSec - this.elapsed);
    this.timeText.setText(fmtTime(Math.ceil(left)));
    this.bar.width = this.barW * (left / SPOT.timeSec);
    const hurry = left <= SPOT.hurrySec;
    if (hurry !== this.hurry) { this.hurry = hurry; this.bar.setFillStyle(hurry ? 0xff6b5b : 0x9be27a, 1); this.timeText.setColor(hurry ? '#ffd0c8' : '#ffffff'); }
    const sec = Math.ceil(left);
    if (hurry && sec !== this.lastTick && sec > 0) { this.lastTick = sec; sfx('tap'); }
  }

  // ── 톡 ──
  onTap(p, over) {
    if (this.finished || this.startWait > 0 || over?.length || !this.scene.isActive()) return;
    const now = this.time.now;
    for (const pic of [this.picA, this.picB]) {
      const lx = (p.worldX - pic.x) / this.sc, ly = (p.worldY - pic.y) / this.sc;
      if (lx < 0 || ly < 0 || lx > SPOT.W || ly > SPOT.H) continue;
      if (now < this.lockUntil) { this.say('잠깐! 천천히 찾아봐요'); return; }
      let best = -1, bd = Infinity;
      this.hits.forEach((h, j) => {
        if (this.found.has(j)) return;
        const d = Math.hypot(lx - h.x, ly - h.y);
        if (d <= h.r + 12 && d < bd) { bd = d; best = j; }
      });
      if (best >= 0) this.foundOne(best); else this.miss(pic, lx, ly);
      return;
    }
  }

  foundOne(j) {
    this.found.add(j);
    this.markFound(j, true);
    this.dots[j]?.setFillStyle(0xffd84a, 1);
    sfx('ding');
    vibrate('collect');
    if (this.found.size >= this.diffs.length) this.time.delayedCall(450, () => this.complete());
  }

  markFound(j, anim) {
    const h = this.hits[j];
    for (const pic of [this.picA, this.picB]) {
      const g = this.add.graphics({ x: h.x, y: h.y });
      g.lineStyle(12, 0xffffff, 0.9).strokeCircle(0, 0, h.r + 4);
      g.lineStyle(7, 0xff5a3d, 1).strokeCircle(0, 0, h.r + 4);
      pic.marks.add(g);
      if (anim) { g.setScale(0.3); this.tweens.add({ targets: g, scale: 1, duration: 260, ease: 'Back.easeOut' }); }
    }
  }

  miss(pic, lx, ly) {
    this.lockUntil = this.time.now + SPOT.lockMs;
    sfx('toggle');
    vibrate('bump');
    const t = this.add.text(lx, ly, '×', { fontFamily: UI.fontTitle, fontSize: '72px', color: '#e8584a', stroke: '#ffffff', strokeThickness: 8 }).setOrigin(0.5);
    pic.marks.add(t);
    this.tweens.add({ targets: t, alpha: 0, scale: 1.3, delay: 500, duration: 500, onComplete: () => t.destroy() });
  }

  say(msg) {
    this.toast.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.toast);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 900, duration: 300 });
  }

  // ── 일시정지·나가기 ──
  openPause(confirmExit = false) {
    if (this.finished || !this.scene.isActive()) return;
    this.scene.launch('Pause', { chapter: this.chapter.id, frame: this.chapter.frame, confirmExit, restartLabel: '처음부터 다시', ...(this.duo ? { restartData: { chapter: this.chapter.id, fresh: true, duo: this.duo } } : {}) });
    this.scene.pause();
  }

  exitAsk() {
    const prev = this.duo ? null : this.prevChapter();
    return { title: '홈으로 나갈까?', sub: '', firstLabel: this.duo ? '처음부터 다시' : null, prevLabel: prev ? '전 단계로 되돌아가기' : null };
  }

  prevChapter() { const i = CHAPTERS.findIndex((c) => c.id === this.chapter.id); return i > 0 ? CHAPTERS[i - 1] : null; }

  restartPrev() {
    const prev = this.prevChapter();
    if (prev) startChapter(this, prev.id, { replay: true }); else this.restartFromFirst();
  }

  restartFromFirst() {
    if (this.duo) { this.scene.start('Maze', { chapter: this.chapter.id, fresh: true, duo: this.duo }); return; }
    startChapter(this, CHAPTERS[0].id, { replay: true });
  }

  // ── 끝 ──
  complete() {
    if (this.finished) return;
    this.finished = true;
    const sec = Math.max(1, Math.floor(this.elapsed));
    sfx('win');
    vibrate('special');
    if (this.duo) { this.finishDuo(sec, 0); return; }
    const ch = this.chapter, id = ch.id;
    const prevBest = state.records[id]?.mazeSec;
    const newRecord = prevBest == null || sec < prevBest;
    state.records[id] = { ...(state.records[id] || {}), mazeSec: newRecord ? sec : prevBest, rolls: 0 };
    state.stars[id] = Math.max(state.stars[id] ?? 0, 1); // 깬 단계 표시 (별 화면은 없음)
    state.step = `${id}_done`;
    state.mazeState = null;
    save();
    this.showResult({ sec, newRecord: newRecord && prevBest != null });
  }

  timeUp() {
    if (this.finished) return;
    this.finished = true;
    this.elapsed = SPOT.timeSec;
    this.updateTime();
    sfx('turn');
    // 못 찾은 곳을 노란 동그라미로 살짝 보여 준다
    this.hits.forEach((h, j) => {
      if (this.found.has(j)) return;
      for (const pic of [this.picA, this.picB]) {
        const g = this.add.graphics({ x: h.x, y: h.y });
        g.lineStyle(7, 0xffd84a, 1).strokeCircle(0, 0, h.r + 4);
        pic.marks.add(g);
        this.tweens.add({ targets: g, alpha: 0.35, duration: 420, yoyo: true, repeat: -1 });
      }
    });
    const missed = this.diffs.length - this.found.size;
    if (this.duo) { this.time.delayedCall(900, () => this.finishDuo(SPOT.timeSec + missed * SPOT.missPenaltySec, missed)); return; }
    this.time.delayedCall(900, () => this.showRetry());
  }

  panel(h) {
    const W = UI.fullWidth, Hh = UI.fullHeight;
    const layer = this.add.container(0, 0).setDepth(30);
    const dim = this.add.rectangle(0, 0, W, Hh, 0x2b2d5a, 0.45).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    const w = 620, x = (W - w) / 2, y = Math.round((Hh - h) / 2);
    drawPanel(g, x, y, w, h, this.chapter.frame);
    layer.add([dim, g]);
    layer.alpha = 0;
    this.tweens.add({ targets: layer, alpha: 1, duration: 240 });
    return { layer, x, y, w, cx: W / 2 };
  }

  showResult({ sec, newRecord }) {
    this.resultShown = true;
    const ch = this.chapter, id = ch.id;
    const lines = [`기록 ${fmtTime(sec)}${newRecord ? '  새 기록!' : ''}`, `다른 곳 ${this.diffs.length}개를 다 찾았어요`];
    const chal = challengeResult(id, sec);
    if (chal) lines.push(chal.win ? `${josa(chal.nick, '을', '를')} 이겼어요! (${fmtShort(chal.theirs)})` : `아깝다! ${chal.nick} ${fmtShort(chal.theirs)} — 다시 도전?`);
    const h = 300 + lines.length * 50;
    const P = this.panel(h);
    P.layer.add(this.add.text(P.cx, P.y + 80, `${ch.name} 그림 다 찾았다!`, { fontFamily: UI.fontTitle, fontSize: '42px', color: '#2b2d5a' }).setOrigin(0.5));
    lines.forEach((l, k) => P.layer.add(this.add.text(P.cx, P.y + 150 + k * 50, l, { fontFamily: UI.font, fontSize: '28px', color: '#2b2d5a' }).setOrigin(0.5)));
    const i = CHAPTERS.findIndex((c) => c.id === id);
    const last = i === CHAPTERS.length - 1;
    const nextLabel = last ? (state.cleared ? '홈으로' : '엔딩 보기') : SERIES.n === 2 ? '다음 계절로' : '다음 나라로';
    const by = P.y + h - 90;
    const btns = [[nextLabel, () => afterChapter(this, id), 0x2f7bff, 0x1f5fd6, '#ffffff'], ['다시 하기', () => startChapter(this, id, { replay: true }), 0xffb347, 0xd98a2b, '#2b2d5a'], ['자랑하기', () => openShareMenu(this.game), 0xfdf7ea, 0xc9c0ae, '#2f7bff']];
    btns.forEach(([label, fn, color, shade, textColor], k) => {
      P.layer.add(new Button(this, P.cx + (k - 1) * 196, by, { width: 180, height: 100, fontSize: label.length > 4 ? 26 : 28, label, color, shade, textColor, onPress: () => { sfx('tap'); fn(); } }));
    });
  }

  showRetry() {
    this.resultShown = true;
    const P = this.panel(400);
    P.layer.add(this.add.text(P.cx, P.y + 84, '아깝다! 다시 도전?', { fontFamily: UI.fontTitle, fontSize: '44px', color: '#2b2d5a' }).setOrigin(0.5));
    P.layer.add(this.add.text(P.cx, P.y + 156, `찾은 곳 ${this.found.size}/${this.diffs.length} · 노란 동그라미가 남은 곳이에요`, { fontFamily: UI.font, fontSize: '25px', color: '#2b2d5a' }).setOrigin(0.5));
    const by = P.y + 400 - 100;
    P.layer.add(new Button(this, P.cx - 140, by, { width: 250, height: 100, fontSize: 30, label: '다시 도전', onPress: () => { sfx('tap'); startChapter(this, this.chapter.id, { replay: true }); } }));
    P.layer.add(new Button(this, P.cx + 140, by, { width: 250, height: 100, fontSize: 30, label: '나가기', color: 0xffb347, shade: 0xd98a2b, textColor: '#2b2d5a', onPress: () => { sfx('tap'); this.scene.start('Title'); } }));
  }

  // 둘이서(한 폰 번갈아)·각자 폰: 기록을 넘기고 Duo·Match로
  finishDuo(sec, missed) {
    const { names, turn } = this.duo;
    const results = [...(this.duo.results ?? [])];
    results[turn - 1] = { sec, rolls: missed };
    const P = this.panel(220);
    P.layer.add(this.add.text(P.cx, P.y + 80, `${names[turn - 1]} 기록 ${fmtTime(Math.min(sec, SPOT.timeSec))}`, { fontFamily: UI.fontTitle, fontSize: '40px', color: '#2f7bff' }).setOrigin(0.5));
    P.layer.add(this.add.text(P.cx, P.y + 140, `찾은 곳 ${this.diffs.length - missed}/${this.diffs.length}`, { fontFamily: UI.font, fontSize: '28px', color: '#2b2d5a' }).setOrigin(0.5));
    if (this.remote) {
      saveMyResult(this.remote, sec, missed);
      this.time.delayedCall(1800, () => this.scene.start('Match', { id: this.remote }));
      return;
    }
    const next = turn === 1 ? { step: 'turn', turn: 2 } : { step: 'result' };
    this.time.delayedCall(1800, () => this.scene.start('Duo', { ...next, names, chapter: this.chapter.id, results, seed: this.seed }));
  }
}
