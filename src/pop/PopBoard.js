// 기념품 퐁퐁 판 하나: 두 개 묶음이 떨어지고, 같은 기념품 3개 이상 이어지면 퐁! (연쇄 가능)
// 둘이서 대결이면 판이 두 개. 상대가 보낸 구름 블록은 다음 묶음이 나오기 전에 위에서 내려온다.
// 그리기는 판 하나를 담은 container 안에서, 좌표는 칸 단위 (r = 줄, c = 칸).
import { POP } from '../data/popgame.js';
import { sfx } from '../ui/feedback.js';

const INK = 0x2b2d5a;
const CHILD = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // 돌림 방향별로 짝이 붙는 자리 (위·오른쪽·아래·왼쪽)
const CLOUD = -1;

export class PopBoard {
  // opts: { x, y, cell, stage, onPop(count, chain), onTurnEnd() → false면 다음 묶음을 내지 않음, onTopOut(), onNext(pair) }
  constructor(scene, opts) {
    Object.assign(this, opts);
    this.scene = scene;
    this.cols = POP.cols;
    this.rows = POP.rows;
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
    this.sprites = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
    this.pending = 0;
    this.mode = 'idle'; // falling(조작 가능) · resolving(퐁·떨어지는 중) · over · frozen
    this.soft = false;
    this.acc = 0;
    this.layer = scene.add.container(this.x, this.y).setDepth(3);
    this.drawFrame();
    this.next = this.randomPair();
  }

  drawFrame() {
    const { cell } = this;
    const w = this.cols * cell, h = this.rows * cell;
    const g = this.scene.add.graphics();
    g.fillStyle(INK, 0.18).fillRoundedRect(-8, -2, w + 16, h + 16, 22);
    g.fillStyle(INK, 1).fillRoundedRect(-10, -10, w + 20, h + 20, 24);
    g.fillStyle(0xfffaf0, 0.94).fillRoundedRect(-4, -4, w + 8, h + 8, 20);
    g.fillStyle(INK, 0.07);
    for (let r = 1; r < this.rows; r++) for (let c = 1; c < this.cols; c++) g.fillCircle(c * cell, r * cell, 2);
    this.layer.add(g);
  }

  randomPair() {
    const n = this.stage.types.length;
    const rnd = this.rng ?? Math.random; // 각자 폰 대결은 같은 시드의 수열 → 두 폰에 같은 순서
    return [Math.floor(rnd() * n), Math.floor(rnd() * n)];
  }

  // 기념품 하나: 색 동그라미 + 그림 (구름은 구름 그림만)
  token(type) {
    const { scene, cell } = this;
    const c = scene.add.container(0, 0);
    if (type === CLOUD) {
      c.add(scene.add.image(0, 0, 'pop_cloud').setDisplaySize(cell * 0.96, cell * 0.96));
    } else {
      const t = this.stage.types[type];
      const g = scene.add.graphics();
      g.fillStyle(INK, 1).fillCircle(0, 0, cell * 0.46);
      g.fillStyle(t.bg, 1).fillCircle(0, 0, cell * 0.42);
      g.fillStyle(0xffffff, 0.5).fillEllipse(-cell * 0.16, -cell * 0.2, cell * 0.22, cell * 0.12);
      const tex = scene.textures.get(t.icon);
      const frame = t.frame != null && tex.has(t.frame) ? t.frame : (tex.has(0) ? 0 : '__BASE');
      c.add([g, scene.add.image(0, 0, t.icon, frame).setDisplaySize(cell * 0.74, cell * 0.74)]);
    }
    this.layer.add(c);
    return c;
  }

  at(r, c) { return { x: c * this.cell + this.cell / 2, y: r * this.cell + this.cell / 2 }; }

  free(r, c) { return c >= 0 && c < this.cols && r < this.rows && (r < 0 || this.grid[r][c] === null); }

  cells(p = this.piece) {
    const [dr, dc] = CHILD[p.rot];
    return [[p.r, p.c, p.a, p.sa], [p.r + dr, p.c + dc, p.b, p.sb]];
  }

  fits(p) { return this.cells(p).every(([r, c]) => this.free(r, c)); }

  place() {
    for (const [r, c, , s] of this.cells()) { const q = this.at(r, c); s.setPosition(q.x, q.y).setVisible(r >= 0); }
  }

  // ── 차례 ──
  start() { this.spawn(); }

  spawn() {
    const [a, b] = this.next;
    this.next = this.randomPair();
    this.onNext?.(this.next);
    const p = { r: 0, c: 2, rot: 0, a, b };
    if (!this.fits(p)) { this.topOut(); return; }
    p.sa = this.token(a);
    p.sb = this.token(b);
    this.piece = p;
    this.place();
    this.acc = 0;
    this.mode = 'falling';
  }

  update(dt) {
    if (this.mode !== 'falling') return;
    this.acc += dt;
    const every = this.soft ? POP.softDropMs : this.stage.dropMs;
    while (this.acc >= every && this.mode === 'falling') {
      this.acc -= every;
      if (!this.shift(1, 0)) this.lock();
    }
  }

  shift(dr, dc) {
    const p = { ...this.piece, r: this.piece.r + dr, c: this.piece.c + dc };
    if (!this.fits(p)) return false;
    Object.assign(this.piece, { r: p.r, c: p.c });
    this.place();
    return true;
  }

  move(dc) { if (this.mode === 'falling' && this.shift(0, dc)) sfx('tap'); }

  // 톡: 시계 방향으로 돌린다. 벽에 막히면 옆으로 한 칸 비켜서 다시 해 본다.
  rotate() {
    if (this.mode !== 'falling') return;
    const rot = (this.piece.rot + 1) % 4;
    for (const dc of [0, -1, 1]) {
      const p = { ...this.piece, rot, c: this.piece.c + dc };
      if (this.fits(p)) { Object.assign(this.piece, { rot, c: p.c }); this.place(); sfx('toggle'); return; }
    }
  }

  drop() {
    if (this.mode !== 'falling') return;
    while (this.shift(1, 0));
    this.lock();
  }

  lock() {
    const cells = this.cells();
    if (cells.some(([r]) => r < 0)) { this.topOut(); return; }
    for (const [r, c, t, s] of cells) { this.grid[r][c] = t; this.sprites[r][c] = s; }
    this.piece = null;
    this.mode = 'resolving';
    sfx('next');
    this.fall(() => this.resolve(1));
  }

  // 빈칸 아래로 떨어뜨리기 (애니메이션이 끝나면 done)
  fall(done) {
    let longest = 0;
    for (let c = 0; c < this.cols; c++) {
      let w = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c] === null) continue;
        if (r !== w) {
          this.grid[w][c] = this.grid[r][c]; this.sprites[w][c] = this.sprites[r][c];
          this.grid[r][c] = null; this.sprites[r][c] = null;
          const ms = 60 + (w - r) * 30;
          longest = Math.max(longest, ms);
          this.scene.tweens.add({ targets: this.sprites[w][c], y: this.at(w, c).y, duration: ms, ease: 'Quad.easeIn' });
        }
        w--;
      }
    }
    this.scene.time.delayedCall(longest + 20, done);
  }

  // 같은 기념품 무리 찾기 → 3개 이상이면 퐁, 옆에 붙은 구름도 함께 사라진다 → 떨어진 뒤 또 찾기(연쇄)
  resolve(chain) {
    const seen = new Set();
    const pops = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.grid[r][c];
        if (t === null || t === CLOUD || seen.has(r * 99 + c)) continue;
        const group = [];
        const stack = [[r, c]];
        seen.add(r * 99 + c);
        while (stack.length) {
          const [y, x] = stack.pop();
          group.push([y, x]);
          for (const [dy, dx] of CHILD) {
            const ny = y + dy, nx = x + dx;
            if (ny < 0 || ny >= this.rows || nx < 0 || nx >= this.cols || seen.has(ny * 99 + nx) || this.grid[ny][nx] !== t) continue;
            seen.add(ny * 99 + nx);
            stack.push([ny, nx]);
          }
        }
        if (group.length >= POP.minGroup) pops.push(...group);
      }
    }
    if (!pops.length) { this.endTurn(); return; }
    const gone = new Set(pops.map(([r, c]) => r * 99 + c));
    for (const [r, c] of pops) {
      for (const [dy, dx] of CHILD) {
        const ny = r + dy, nx = c + dx;
        if (ny >= 0 && ny < this.rows && nx >= 0 && nx < this.cols && this.grid[ny][nx] === CLOUD) gone.add(ny * 99 + nx);
      }
    }
    sfx(`pop${Math.min(chain, 5)}`);
    for (const k of gone) {
      const r = Math.floor(k / 99), c = k % 99;
      const s = this.sprites[r][c];
      this.grid[r][c] = null; this.sprites[r][c] = null;
      this.scene.tweens.add({ targets: s, scale: 1.3, alpha: 0, duration: 230, ease: 'Quad.easeOut', onComplete: () => s.destroy() });
    }
    this.onPop?.(pops.length, chain);
    this.scene.time.delayedCall(250, () => this.fall(() => this.resolve(chain + 1)));
  }

  endTurn() {
    if (this.mode === 'frozen' || this.mode === 'over') return;
    if (this.onTurnEnd?.() === false) { this.mode = 'frozen'; return; }
    if (this.pending > 0) { this.dropClouds(); return; }
    this.spawn();
  }

  // 받은 구름 블록을 칸마다 고르게 위에서 내려보낸다
  dropClouds() {
    let n = Math.min(this.pending, POP.cloud.max);
    this.pending = 0;
    const start = Math.floor(Math.random() * this.cols);
    sfx('cloud');
    for (let k = 0; n > 0 && k < this.cols * this.rows; k++) {
      const c = (start + k) % this.cols;
      let r = -1;
      for (let y = this.rows - 1; y >= 0; y--) if (this.grid[y][c] === null) { r = y; break; }
      if (r < 0) continue;
      this.grid[r][c] = CLOUD;
      const s = this.token(CLOUD);
      const q = this.at(r, c);
      s.setPosition(q.x, -this.cell);
      this.scene.tweens.add({ targets: s, y: q.y, duration: 260 + r * 24, ease: 'Bounce.easeOut' });
      this.sprites[r][c] = s;
      n--;
    }
    this.scene.time.delayedCall(560, () => { if (this.mode === 'resolving') this.spawn(); });
  }

  // 각자 폰 대결에서 꼭대기에 닿으면: 위쪽 절반을 퐁 비우고 이어서 (게임오버 없음)
  clearTop() {
    this.mode = 'resolving';
    sfx('pop');
    for (let r = 0; r < this.rows / 2; r++) {
      for (let c = 0; c < this.cols; c++) {
        const s = this.sprites[r][c];
        this.grid[r][c] = null; this.sprites[r][c] = null;
        if (s) this.scene.tweens.add({ targets: s, scale: 1.4, alpha: 0, duration: 300, ease: 'Quad.easeOut', onComplete: () => s.destroy() });
      }
    }
    this.scene.time.delayedCall(700, () => { if (this.mode === 'resolving') this.spawn(); });
  }

  topOut() {
    if (this.mode === 'over') return;
    this.mode = 'over';
    this.onTopOut?.();
  }

  freeze() { if (this.mode !== 'over') this.mode = 'frozen'; }
}
