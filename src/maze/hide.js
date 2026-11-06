// 숨바꼭질 친구 자리 고르기 (design-brief 17절). 화면 없이 계산만 해서 check-maze 에서도 쓴다.
// 친구마다 숨는 곳 3군데(찾을 때마다 다음 곳으로 옮겨 간다). 막다른 길을 먼저 고르고,
// 출발·출구·체크포인트에서 3칸 안, 수집품·순찰 길·움직이는 웅덩이/거미줄 칸은 피한다.
// 시작점에서 걸어서 닿을 수 있는 칸만(출구는 닫힌 채로). 같은 미로면 언제나 같은 자리(시드 고정) — 둘이서·각자 폰 대결도 공평하게.
// zones = 친구마다 숨는 줄 범위 [[위, 아래], …] (한국: 집·밤 골목·시장 구역에 한 명씩). 없으면 판 전체.
import { placeDrifters, patrolPath } from './drift.js';

const hash = (x, y, k) => {
  let h = (x * 2654435761) ^ (y * 40503) ^ (k * 2246822519);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 출구 닫힌 채로 시작점에서 걸어서 닿는 칸들
export function reachable(maze, canHop) {
  const g = maze.grid;
  const ok = (x, y) => {
    const c = g[y]?.[x];
    if (!c || c === '#' || c === 'E') return false;
    return c !== 'b' || canHop;
  };
  const s = g.flatMap((r, y) => [...r].map((c, x) => (c === 'S' ? [x, y] : null))).filter(Boolean)[0];
  const seen = new Set([s.join()]);
  const q = [s];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of D4) {
      const k = `${x + dx},${y + dy}`;
      if (!seen.has(k) && ok(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); }
    }
  }
  return { seen, ok };
}

export function placeFriends(maze, chapter, seed, canHop) {
  const g = maze.grid;
  const keys = chapter.bosses ?? [];
  if (!keys.length) return [];
  const find = (chars) => g.flatMap((r, y) => [...r].map((c, x) => (chars.includes(c) ? [x, y] : null))).filter(Boolean);
  const marks = find('SEC');
  const patrol = new Set((maze.patrols ?? []).flatMap((p) => patrolPath(p).map((c) => c.join())));
  const drift = new Set(placeDrifters(maze, chapter.drift, seed).flatMap((d) => d.cells.map((c) => c.join())));
  const { seen, ok } = reachable(maze, canHop);
  const far = (list, x, y, d) => list.every(([kx, ky]) => Math.abs(kx - x) + Math.abs(ky - y) >= d);
  const cands = [];
  for (let y = 0; y < g.length; y++) {
    for (let x = 0; x < g[0].length; x++) {
      const k = `${x},${y}`;
      if (g[y][x] !== '.' || !seen.has(k) || patrol.has(k) || drift.has(k) || !far(marks, x, y, 3)) continue;
      const deg = D4.filter(([dx, dy]) => ok(x + dx, y + dy)).length;
      cands.push({ x, y, dead: deg <= 1, r: hash(x, y, seed * 31 + 7) });
    }
  }
  cands.sort((a, b) => (a.dead === b.dead ? a.r - b.r : a.dead ? -1 : 1));
  const chosen = [];
  return keys.map((key, i) => {
    const zone = chapter.hideZones?.[i];
    const inZone = (c) => !zone || (c.y >= zone[0] && c.y <= zone[1]);
    const spots = [];
    for (const minD of [6, 5, 4, 3, 2, 1]) {
      for (const c of cands) {
        if (spots.length >= 3) break;
        if (!inZone(c) || !far(chosen, c.x, c.y, minD)) continue;
        spots.push([c.x, c.y]);
        chosen.push([c.x, c.y]);
      }
      if (spots.length >= 3) break;
    }
    return { key, spots };
  });
}
