// 미로 검사: 모든 미로에서 시작점(S)부터 모든 수집품(L)과 출구(E)까지 길이 있는지 BFS로 확인한다.
// 사용법: node scripts/check-maze.mjs [mazes.js 경로]   (기본값: src/data/mazes.js)
// mazes.js 는 `export const MAZES = { ch1: { form, grid: [...] }, ... }` 형태여야 한다.
// 바람길(> < ^ v)은 통과 가능한 칸으로만 취급하는 근사 검사이므로, 바람 배치를 바꿨다면 직접 플레이로도 확인할 것.
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const file = path.resolve(process.argv[2] ?? 'src/data/mazes.js');
const { MAZES } = await import(pathToFileURL(file).href);

const CAN_HOP = { caterpillar: false, moth: true, butterfly: true };
let failed = false;

for (const [id, maze] of Object.entries(MAZES)) {
  const g = maze.grid;
  const errors = [];
  const h = g.length, w = g[0].length;
  if (g.some(r => r.length !== w)) errors.push('행 길이가 서로 다름');
  const find = ch => g.flatMap((r, y) => [...r].map((c, x) => (c === ch ? [x, y] : null))).filter(Boolean);
  const starts = find('S'), exits = find('E'), items = find('L');
  if (starts.length !== 1) errors.push(`S 개수 ${starts.length} (1개여야 함)`);
  if (exits.length !== 1) errors.push(`E 개수 ${exits.length} (1개여야 함)`);
  if (items.length === 0) errors.push('수집품 L 없음');

  if (starts.length === 1) {
    const hop = CAN_HOP[maze.form] ?? false;
    const seen = new Set([starts[0].join()]);
    const q = [starts[0]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const c = g[ny][nx];
        if (c === '#' || (c === 'b' && !hop)) continue;
        const k = `${nx},${ny}`;
        if (!seen.has(k)) { seen.add(k); q.push([nx, ny]); }
      }
    }
    for (const [x, y] of [...items, ...exits]) {
      if (!seen.has(`${x},${y}`)) errors.push(`(${x},${y}) '${g[y][x]}' 에 갈 수 없음`);
    }
  }
  if (errors.length) { failed = true; console.log(`✗ ${id}: ${errors.join(' / ')}`); }
  else console.log(`✓ ${id}: 수집품 ${items.length}개, 출구까지 길 있음`);
}
// 움직이는 웅덩이·거미줄 (chapters.js drift): 정한 개수만큼 자리가 나오는지
if (!process.argv[2]) {
  const { CHAPTERS } = await import(pathToFileURL(path.resolve('src/data/chapters.js')).href);
  const { placeDrifters } = await import(pathToFileURL(path.resolve('src/maze/drift.js')).href);
  CHAPTERS.forEach((c, i) => {
    if (!MAZES[c.id]) { failed = true; console.log(`✗ ${c.id}: 미로 없음`); return; }
    const want = (c.drift?.puddle ?? 0) + (c.drift?.web ?? 0);
    const got = placeDrifters(MAZES[c.id], c.drift, i + 1);
    if (got.length < want) { failed = true; console.log(`✗ ${c.id}: 웅덩이·거미줄 자리 ${got.length}/${want}`); }
    else console.log(`✓ ${c.id}: 웅덩이 ${got.filter((d) => d.type === 'puddle').length} · 거미줄 ${got.filter((d) => d.type === 'web').length}`);
  });
}
// 숨바꼭질 친구 (design-brief 17절): 친구마다 숨는 곳 3군데가 나오고 걸어서 닿는지,
// 그리고 수집품·숨는 곳을 가까운 순서로 다 돌고 출구까지 갔을 때 에너지가 0이 되지 않는지 (15절)
{
  const isS2 = !!process.argv[2];
  const base = isS2 ? 'src/data/s2/' : 'src/data/';
  const { CHAPTERS } = await import(pathToFileURL(path.resolve(base + 'chapters.js')).href);
  const { FORMS } = await import(pathToFileURL(path.resolve(base + 'forms.js')).href);
  const { UI } = await import(pathToFileURL(path.resolve('src/data/ui.js')).href);
  const { placeFriends } = await import(pathToFileURL(path.resolve('src/maze/hide.js')).href);
  const E = UI.energy;
  CHAPTERS.forEach((c, i) => {
    const m = MAZES[c.id];
    if (!m) return;
    const g = m.grid;
    const hop = FORMS[c.form]?.canHop ?? false;
    const fr = placeFriends(m, c, i + 1, hop);
    const bad = fr.filter((f) => f.spots.length < 3);
    if (fr.length !== c.bosses.length || bad.length) { failed = true; console.log(`✗ ${c.id}: 숨는 곳 부족 ${bad.map((f) => f.key).join(', ')}`); return; }
    const pass = (x, y, open) => { const t = g[y]?.[x]; return !!t && t !== '#' && (t !== 'b' || hop) && (t !== 'E' || open); };
    const bfs = (s, open) => { const d = new Map([[s.join(), 0]]); const q = [s]; while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = `${x + dx},${y + dy}`; if (!d.has(k) && pass(x + dx, y + dy, open)) { d.set(k, d.get(`${x},${y}`) + 1); q.push([x + dx, y + dy]); } } } return d; };
    const find = (ch) => g.flatMap((r, y) => [...r].map((t, x) => (t === ch ? [x, y] : null))).filter(Boolean);
    let pos = find('S')[0];
    const items = find('L');
    const queues = fr.map((f) => [...f.spots]);
    let steps = 0, energy = E.max, minE = E.max, ok = true;
    while (ok && items.length + queues.reduce((a, q) => a + q.length, 0)) {
      const d = bfs(pos, false);
      const targets = [...items.map((p) => ({ p })), ...queues.filter((q) => q.length).map((q) => ({ p: q[0], q }))]
        .sort((a, b) => (d.get(a.p.join()) ?? 1e9) - (d.get(b.p.join()) ?? 1e9));
      const t = targets[0];
      const n = d.get(t.p.join());
      if (n == null) { ok = false; failed = true; console.log(`✗ ${c.id}: (${t.p}) 에 갈 수 없음`); break; }
      steps += n; energy -= n * E.step; minE = Math.min(minE, energy);
      if (t.q) { t.q.shift(); energy = Math.min(E.max, energy + E.find); } else { items.splice(items.indexOf(t.p), 1); energy = Math.min(E.max, energy + E.item); }
      pos = t.p;
    }
    if (!ok) return;
    const n = bfs(pos, true).get(find('E')[0].join());
    steps += n; energy -= n * E.step; minE = Math.min(minE, energy);
    if (minE <= 0) { failed = true; console.log(`✗ ${c.id}: 가까운 순서로 돌아도 에너지 0 (최저 ${minE.toFixed(0)})`); return; }
    console.log(`✓ ${c.id}: 숨은 친구 ${fr.map((f) => f.key).join('·')} 3곳씩, 가까운 순서 ${steps}걸음 · 에너지 최저 ${minE.toFixed(0)} · 출구 ${energy.toFixed(0)}`);
  });
}
process.exit(failed ? 1 : 0);
