// 장 흐름: 미로 → 대결 → 친구 → (진화) → 여권(여행 지도) → 다음 장 미로 (systems.md 1절, tech-spec 4절)
import { CHAPTERS } from './data/chapters.js';
import { state, save } from './state.js';
import { platform } from './platform.js';

export const chapterById = (id) => CHAPTERS.find((c) => c.id === id);
export const chapterNo = (id) => Number(id.slice(2));
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
  if (id === 'ch1' && !state.persistAsked && platform.can.persist) {
    state.persistAsked = true;
    try { navigator.storage.persist().catch(() => {}); } catch { /* 브라우저가 정함 */ }
  }
  state.chapter = Math.max(state.chapter, Math.min(nextIdx + 1, CHAPTERS.length));
  save();
  // 마지막 장을 처음 깨면 엔딩
  if (nextIdx >= CHAPTERS.length && !state.cleared) {
    scene.scene.start('Ending');
    return;
  }
  if (ch.evolveTo && !nextStarted) {
    scene.scene.start('Evolution', { chapter: id });
  } else {
    scene.scene.start('Map', { justCleared: id });
  }
}

// 장 시작: 도입 대사를 보여 주고 미로로 (1장 도입은 타이틀의 프롤로그)
export function startChapter(scene, id, { replay = false } = {}) {
  state.chapter = replay ? state.chapter : chapterNo(id);
  state.playing = id;
  state.mazeState = null;
  save();
  scene.scene.start('Maze', { chapter: id, fresh: true, intro: id !== 'ch1' });
}
