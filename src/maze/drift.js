// 움직이는 웅덩이·거미줄 자리 고르기 (design-brief 11절). 화면 없이 계산만 해서 check-maze 에서도 쓴다.
// 길('.') 위 곧은 3칸을 왕복한다. 출발점·출구·체크포인트에서 3칸, 수집품에서 2칸 안에는 놓지 않고,
// 순찰 길과 겹치지 않으며, 서로 3칸 넘게 떨어지게 고른다. 같은 미로면 언제나 같은 자리(시드 고정).
const hash = (x, y, k) => {
  let h = (x * 73856093) ^ (y * 19349663) ^ (k * 83492791);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export const patrolPath = (p) => (Array.isArray(p) ? p : p.path);

export function placeDrifters(maze, drift, seed = 1) {
  if (!drift) return [];
  const want = (drift.puddle ?? 0) + (drift.web ?? 0);
  if (!want) return [];
  const g = maze.grid;
  const tile = (x, y) => g[y]?.[x] ?? '#';
  const find = (chars) => g.flatMap((r, y) => [...r].map((c, x) => (chars.includes(c) ? [x, y] : null))).filter(Boolean);
  const keys = find('SEC');
  const items = find('L');
  const patrol = new Set((maze.patrols ?? []).flatMap((p) => patrolPath(p).map((c) => c.join())));
  const far = (list, x, y, d) => list.every(([kx, ky]) => Math.abs(kx - x) + Math.abs(ky - y) >= d);

  const pick = (itemGap) => {
    const ok = (x, y) => tile(x, y) === '.' && !patrol.has(`${x},${y}`) && far(keys, x, y, 3) && far(items, x, y, itemGap);
    const cands = [];
    for (let y = 1; y < g.length - 1; y++) {
      for (let x = 1; x < g[0].length - 1; x++) {
        for (const [dx, dy, k] of [[1, 0, 1], [0, 1, 2]]) {
          const cells = [0, 1, 2].map((i) => [x + dx * i, y + dy * i]);
          if (cells.every(([cx, cy]) => ok(cx, cy))) cands.push({ cells, r: hash(x, y, seed * 7 + k) });
        }
      }
    }
    cands.sort((a, b) => a.r - b.r);
    const chosen = [];
    for (const c of cands) {
      if (chosen.length >= want) break;
      const clash = chosen.some((o) => o.cells.some(([ax, ay]) => c.cells.some(([bx, by]) => Math.max(Math.abs(ax - bx), Math.abs(ay - by)) < 3)));
      if (!clash) chosen.push(c);
    }
    return chosen;
  };
  let chosen = pick(2);
  if (chosen.length < want) chosen = pick(1);
  // 웅덩이와 거미줄을 번갈아 (한쪽이 다 차면 나머지로)
  let pud = drift.puddle ?? 0;
  let web = drift.web ?? 0;
  return chosen.map((c, i) => {
    const type = (i % 2 === 0 && pud > 0) || web === 0 ? 'puddle' : 'web';
    if (type === 'puddle') pud--; else web--;
    return { type, cells: c.cells, start: Math.floor(c.r * 1000) % 3 };
  });
}
