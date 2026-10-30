// 바람 미로 검사: 바람에 실제로 밀리는 규칙(벽까지 최대 N칸, 도착한 칸이 또 바람이면 다시 밀림)을 흉내 내어
// 시작점에서 모든 수집품과 출구에 갈 수 있는지, 어느 칸에서도 갇히지 않는지 확인한다. (systems.md 3절)
// 사용법: node scripts/check-wind.mjs   (실 목도리 있을 때 1칸 / 없을 때 3칸 둘 다)
import { MAZES } from '../src/data/mazes.js';

const CAN_HOP = { caterpillar: false, moth: true, butterfly: true };
const D = { '>': [1, 0], '<': [-1, 0], '^': [0, -1], 'v': [0, 1] };
let failed = false;
for (const [id, m] of Object.entries(MAZES)) {
  const g = m.grid;
  if (!g.some((r) => /[<>^v]/.test(r))) continue;
  const hop = CAN_HOP[m.form];
  const open = (x, y, exitOpen) => {
    const c = g[y]?.[x];
    if (!c || c === '#') return false;
    if (c === 'b') return hop;
    if (c === 'E') return exitOpen;
    return true;
  };
  for (const max of [3, 1]) {
    // 한 칸 들어간 뒤 바람이면 밀려난 최종 칸 (연쇄, 무한 반복 막기)
    const land = (x, y, exitOpen) => {
      const seen = new Set();
      while (D[g[y][x]] && !seen.has(`${x},${y}`)) {
        seen.add(`${x},${y}`);
        const [dx, dy] = D[g[y][x]];
        let n = 0;
        while (n < max && open(x + dx, y + dy, exitOpen)) { x += dx; y += dy; n++; }
        if (!n) break;
      }
      return [x, y];
    };
    const reach = (sx, sy, exitOpen) => {
      const seen = new Set([`${sx},${sy}`]);
      const q = [[sx, sy]];
      while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy] of Object.values(D)) {
          if (!open(x + dx, y + dy, exitOpen)) continue;
          const [lx, ly] = land(x + dx, y + dy, exitOpen);
          const k = `${lx},${ly}`;
          if (!seen.has(k)) { seen.add(k); q.push([lx, ly]); }
        }
      }
      return seen;
    };
    const S = g.flatMap((r, y) => [...r].map((c, x) => (c === 'S' ? [x, y] : null))).find(Boolean);
    const Ls = g.flatMap((r, y) => [...r].map((c, x) => (c === 'L' ? `${x},${y}` : null))).filter(Boolean);
    const E = g.flatMap((r, y) => [...r].map((c, x) => (c === 'E' ? `${x},${y}` : null))).find(Boolean);
    const r1 = reach(S[0], S[1], false);
    const missL = Ls.filter((k) => !r1.has(k));
    const r2 = reach(S[0], S[1], true);
    const errors = [];
    if (missL.length) errors.push(`못 가는 수집품 ${missL.join(' ')}`);
    if (!r2.has(E)) errors.push('출구에 못 감');
    // 갇힘: 갈 수 있는 모든 칸에서 시작점으로 돌아올 수 있어야 함
    for (const k of r1) {
      const [x, y] = k.split(',').map(Number);
      if (!reach(x, y, false).has(`${S[0]},${S[1]}`)) { errors.push(`(${k})에서 갇힘`); break; }
    }
    if (errors.length) { failed = true; console.log(`✗ ${id} 바람 ${max}칸: ${errors.join(' / ')}`); }
    else console.log(`✓ ${id} 바람 ${max}칸: 모든 수집품·출구에 갈 수 있고 갇히는 곳 없음`);
  }
}
process.exit(failed ? 1 : 0);
