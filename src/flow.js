// 단계 흐름: 미로(숨바꼭질) → 출구에서 친구 → (진화) → 여권(여행 지도) → 다음 장 미로 (systems.md 1절, design-brief 17절)
import { CHAPTERS, stageNo } from './data/chapters.js';
import { state, save } from './state.js';
import { platform } from './platform.js';
import { SERIES } from './series.js';

export const chapterById = (id) => CHAPTERS.find((c) => c.id === id);
export const isCleared = (id) => (state.stars?.[id] ?? 0) > 0;

// 지금 갈 수 있는 가장 먼 장 (깬 장 바로 다음)
export function nextChapterId() {
  const next = CHAPTERS.find((c) => !isCleared(c.id));
  return next ? next.id : null;
}

// 장을 깬 뒤: 처음 깬 장이고 진화가 있으면 진화, 아니면 여권으로
export function afterChapter(scene, id) {
  const ch = chapterById(id);
  const nextIdx = CHAPTERS.indexOf(ch) + 1;
  const nextStarted = nextIdx < CHAPTERS.length && (isCleared(CHAPTERS[nextIdx].id) || state.chapter > nextIdx);
  state.step = 'map';
  if (stageNo(id) === 1 && !state.persistAsked && platform.can.persist) {
    state.persistAsked = true;
    try { navigator.storage.persist().catch(() => {}); } catch { /* 브라우저가 정함 */ }
  }
  state.chapter = Math.max(state.chapter, Math.min(nextIdx + 1, CHAPTERS.length));
  save();
  // 마지막 장을 처음 깨면 엔딩
  if (nextIdx >= CHAPTERS.length && !state.cleared) {
    scene.scene.start(SERIES.meta.endingScene);
    return;
  }
  if ((ch.evolveTo || ch.dressTo) && !nextStarted) {
    scene.scene.start(SERIES.meta.dressScene, { chapter: id });
  } else {
    scene.scene.start(SERIES.meta.mapScene, { justCleared: id });
  }
}

// 단계 시작: 도입 대사를 보여 주고 미로로 (한국 도입은 타이틀의 프롤로그)
export function startChapter(scene, id, { replay = false } = {}) {
  state.chapter = replay ? state.chapter : stageNo(id);
  state.playing = id;
  state.mazeState = null;
  save();
  scene.scene.start('Maze', { chapter: id, fresh: true, intro: id !== CHAPTERS[0].id });
}

// 친구가 주는 선물 (rewards 칸이 하나면 그것, 배열이면 여럿)
export const giftsOf = (ch, i) => [].concat(ch.rewards?.[i] ?? []).filter(Boolean);

// 이미 사귄 친구의 선물이 빠져 있으면 넣는다 (15절: 새 아이템이 생기기 전에 친구가 된 저장)
export function syncGifts() {
  let changed = false;
  for (const ch of CHAPTERS) {
    ch.bosses.forEach((key, i) => {
      if (!state.friends.includes(key)) return;
      for (const g of giftsOf(ch, i)) if (!state.items.includes(g)) { state.items.push(g); changed = true; }
    });
  }
  if (changed) save();
}
