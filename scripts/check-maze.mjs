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
process.exit(failed ? 1 : 0);
