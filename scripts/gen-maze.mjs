// 새 미로 만들기 (시드 고정이라 같은 값이면 늘 같은 미로).
// 사용법: node scripts/gen-maze.mjs <가로> <세로> <시드> <수집품> <순환길> [옵션 JSON]
// 옵션 예: '{"hop":true,"low":3,"lamp":3,"wind":4,"splash":3,"web":0,"patrols":2,"checkpoints":2}'
// 결과를 src/data/mazes.js 에 붙여 넣고 반드시 npm run check:maze 로 검사한다.
const [W, H, SEED, ITEMS, LOOPS] = process.argv.slice(2, 7).map(Number);
const opt = JSON.parse(process.argv[7] ?? '{}');

let s = SEED >>> 0;
const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const g = Array.from({ length: H }, () => Array(W).fill('#'));
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// 깊이 우선으로 길 파기
const stack = [[1, 1]];
g[1][1] = '.';
while (stack.length) {
  const [x, y] = stack[stack.length - 1];
  const next = shuffle(D4.map(([dx, dy]) => [x + dx * 2, y + dy * 2, x + dx, y + dy]))
    .find(([nx, ny]) => nx > 0 && ny > 0 && nx < W - 1 && ny < H - 1 && g[ny][nx] === '#');
  if (!next) { stack.pop(); continue; }
  const [nx, ny, mx, my] = next;
  g[my][mx] = '.'; g[ny][nx] = '.';
  stack.push([nx, ny]);
}
// 순환길: 두 길 사이 벽 허물기
let loops = 0;
for (let tries = 0; loops < LOOPS && tries < 5000; tries++) {
  const x = 1 + Math.floor(rnd() * (W - 2));
  const y = 1 + Math.floor(rnd() * (H - 2));
  if (g[y][x] !== '#') continue;
  const h = g[y][x - 1] === '.' && g[y][x + 1] === '.' && g[y - 1][x] === '#' && g[y + 1][x] === '#';
  const v = g[y - 1][x] === '.' && g[y + 1][x] === '.' && g[y][x - 1] === '#' && g[y][x + 1] === '#';
  if (h || v) { g[y][x] = '.'; loops++; }
}
const open = (x, y) => g[y]?.[x] !== undefined && g[y][x] !== '#';
const bfs = (sx, sy) => {
  const dist = new Map([[`${sx},${sy}`, 0]]);
  const prev = new Map();
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of D4) {
      const k = `${x + dx},${y + dy}`;
      if (open(x + dx, y + dy) && !dist.has(k)) { dist.set(k, dist.get(`${x},${y}`) + 1); prev.set(k, `${x},${y}`); q.push([x + dx, y + dy]); }
    }
  }
  return { dist, prev };
};
g[1][1] = 'S';
g[H - 1][W - 2] = 'E';
g[H - 2][W - 2] = '.';
const { dist, prev } = bfs(1, 1);
// 출구까지 최단 경로
const path = [];
for (let k = `${W - 2},${H - 1}`; k; k = prev.get(k)) path.unshift(k.split(',').map(Number));
const onPath = new Set(path.map((p) => p.join()));
// 체크포인트: 최단 경로의 35%·70%
const cps = opt.checkpoints ?? 1;
for (let i = 1; i <= cps; i++) {
  const [x, y] = path[Math.floor(path.length * (cps === 1 ? 0.5 : i === 1 ? 0.35 : 0.7))];
  g[y][x] = 'C';
}
// 수집품: 막다른 길 중 시작점에서 멀고 서로 떨어진 곳
const deadEnds = [];
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
  if (g[y][x] !== '.') continue;
  if (D4.filter(([dx, dy]) => open(x + dx, y + dy)).length === 1) deadEnds.push([x, y]);
}
deadEnds.sort((a, b) => dist.get(b.join()) - dist.get(a.join()));
const items = [];
// 막다른 길이 모자라면 시작점에서 먼 길 칸에서 고른다
const farCells = [];
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (g[y][x] === '.' && !onPath.has(`${x},${y}`)) farCells.push([x, y]);
farCells.sort((a, b) => dist.get(b.join()) - dist.get(a.join()));
for (const pool of [deadEnds, farCells]) {
  for (const d of pool) {
    if (items.length >= ITEMS) break;
    if (dist.get(d.join()) < 6) continue;
    if (items.every(([ix, iy]) => Math.abs(ix - d[0]) + Math.abs(iy - d[1]) >= 4)) items.push(d);
  }
}
for (const [x, y] of items) g[y][x] = 'L';
// 방해 요소: 시작·출구 근처와 최단 경로 일부를 피해 길 칸에 놓기
const free = () => shuffle([...Array(W * H).keys()].map((i) => [i % W, Math.floor(i / W)])
  .filter(([x, y]) => g[y][x] === '.' && Math.abs(x - 1) + Math.abs(y - 1) > 3 && Math.abs(x - (W - 2)) + Math.abs(y - (H - 1)) > 2));
const put = (ch, n, ok = () => true) => { let c = 0; for (const [x, y] of free()) { if (c >= n) break; if (ok(x, y)) { g[y][x] = typeof ch === 'function' ? ch(x, y) : ch; c++; } } };
// 낮은 장애물은 지름길(최단 경로 밖)에만 — 못 넘는 모습이어도 막히지 않게
if (opt.low) put('b', opt.low, (x, y) => !onPath.has(`${x},${y}`));
if (opt.lamp) put('o', opt.lamp);
if (opt.web) put('w', opt.web);
if (opt.splash) put('r', opt.splash);
if (opt.wind) put((x, y) => {
  const dirs = D4.filter(([dx, dy]) => open(x + dx, y + dy) && open(x + dx * 2, y + dy * 2));
  const [dx, dy] = dirs[Math.floor(rnd() * dirs.length)];
  return dx === 1 ? '>' : dx === -1 ? '<' : dy === 1 ? 'v' : '^';
}, opt.wind, (x, y) => D4.some(([dx, dy]) => open(x + dx, y + dy) && open(x + dx * 2, y + dy * 2)));
// 순찰: 곧게 뻗은 길(5칸 이상)
const patrols = [];
for (let y = 1; y < H - 1 && patrols.length < (opt.patrols ?? 0); y += 2) {
  for (let x = 1; x < W - 5; x++) {
    let n = 0; while (x + n < W - 1 && g[y][x + n] === '.') n++;
    if (n >= 5 && x + y > 6 && y < H - 3) { patrols.push(Array.from({ length: n }, (_, i) => [x + i, y])); break; }
  }
}
console.log(JSON.stringify({ grid: g.map((r) => r.join('')), patrols }));
