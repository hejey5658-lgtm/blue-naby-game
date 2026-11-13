// 1탄 「블루나비의 세계여행」 ↔ 2탄 「포포의 사계절 서울」 갈아 끼우기 (docs/concept-2.md).
// 미로·대결·둘이서·퐁퐁 화면은 같은 코드를 쓰고, 그 화면들이 읽는 데이터(단계·미로·대사·보스·아이템·모습·퐁퐁 판)만
// 제자리에서 바꾼다 — 다른 파일이 가져간 CHAPTERS 같은 배열·객체가 그대로 새 내용을 보게.
// 진행 기록도 탄마다 따로: 지금 탄의 진행은 state 맨 위, 다른 탄 진행은 state.other 에 넣어 둔다.
import { CHAPTERS, PASSPORT } from './data/chapters.js';
import { MAZES } from './data/mazes.js';
import { LOOK } from './data/mazeLooks.js';
import { DIALOGUE, SPEAKER_NAMES } from './data/dialogue.js';
import { BOSSES } from './data/bosses.js';
import { ITEMS, COLLECTIBLES } from './data/items.js';
import { FORMS } from './data/forms.js';
import { POP } from './data/popgame.js';
import * as S2 from './data/s2/index.js';
import { state, save } from './state.js';

const pick = (o) => ({ ...o });
// 1탄 원본 (바꾸기 전에 한 번 떠 둔다)
const S1 = {
  CHAPTERS: [...CHAPTERS], PASSPORT: [...PASSPORT], MAZES: pick(MAZES), LOOK: pick(LOOK), DIALOGUE: pick(DIALOGUE),
  SPEAKER_NAMES: pick(SPEAKER_NAMES), BOSSES: pick(BOSSES), ITEMS: pick(ITEMS), COLLECTIBLES: pick(COLLECTIBLES), FORMS: pick(FORMS), STAGES: [...POP.stages],
};
export const DATA = { 1: S1, 2: S2.DATA };

// 탄마다 다른 글·화면 이름
export const META = {
  1: { n: 1, title: '블루나비와 포포의 여행 1탄', short: '1탄 블루나비', hero: '블루나비', helperTex: 'npc_dot', helperFrame: 0, helperHint: '에헴, 이쪽으로 가 봐!',
    titleScene: 'Title', endingScene: 'Ending', dressScene: 'Evolution', stars: true,
    popDone: ['세계 일주 완성!', '중국부터 캐나다까지 다 돌았어요'], saveCode: 'BB3-', challenge: 'C3-' }, // BB3·C3 = 4단계(한국 뺌, 2026-11-13~). BB2·BB1·C2·C1도 읽는다
  2: { n: 2, title: '블루나비와 포포의 여행 2탄', short: '2탄 포포', hero: '포포', helperTex: 'face_bluenabi', helperFrame: 1, helperHint: '포포야, 이쪽이야!',
    titleScene: 'Title', endingScene: 'Ending2', dressScene: 'Dress', stars: false,
    popDone: ['사계절 한 바퀴 완성!', '봄부터 겨울까지 다 돌았어요'], saveCode: 'PP1-', challenge: 'P1-' },
};
export const SERIES = { n: 1, meta: META[1], game: null };

// 탄마다 따로 가지는 진행 기록
const PROGRESS_KEYS = ['chapter', 'step', 'form', 'items', 'friends', 'stars', 'records', 'mazeState', 'bossIndex', 'playing', 'cleared', 'mazeTimeStar', 'pop'];
export function freshProgress(n) {
  return {
    chapter: 1, step: 'new', form: n === 2 ? 'popoSpring' : 'caterpillar', items: [], friends: [], stars: {}, records: {},
    mazeState: null, bossIndex: 0, playing: null, cleared: false, mazeTimeStar: {}, pop: { reached: 0, best: {} },
  };
}

const swapArr = (a, b) => { a.length = 0; a.push(...b); };
const swapObj = (a, b) => { for (const k of Object.keys(a)) delete a[k]; Object.assign(a, b); };

function loadData(n) {
  const d = DATA[n];
  swapArr(CHAPTERS, d.CHAPTERS);
  swapArr(PASSPORT, d.PASSPORT);
  swapObj(MAZES, d.MAZES);
  swapObj(LOOK, d.LOOK);
  swapObj(DIALOGUE, d.DIALOGUE);
  swapObj(SPEAKER_NAMES, d.SPEAKER_NAMES);
  swapObj(BOSSES, d.BOSSES);
  swapObj(ITEMS, d.ITEMS);
  swapObj(COLLECTIBLES, d.COLLECTIBLES);
  swapObj(FORMS, d.FORMS);
  swapArr(POP.stages, d.STAGES);
  SERIES.n = n;
  SERIES.meta = META[n];
  SERIES.game?.registry.set('series', n); // PreloadScene 이 하는 탄 그림만 받게
}

// 탄 바꾸기: 데이터를 갈아 끼우고, 진행 기록을 바꿔 넣는다
export function useSeries(n) {
  n = n === 2 ? 2 : 1;
  const cur = state.series === 2 ? 2 : 1;
  if (cur !== n) {
    const mine = Object.fromEntries(PROGRESS_KEYS.map((k) => [k, state[k]]));
    const theirs = state.other ?? freshProgress(n);
    Object.assign(state, freshProgress(n), theirs);
    state.other = mine;
    state.series = n;
    save();
  }
  loadData(n);
}

// 게임을 켤 때 마지막에 하던 탄으로
export function initSeries() { loadData(state.series === 2 ? 2 : 1); }

// 처음부터 다시 하기: 지금 탄 진행만 지운다
export function resetSeriesProgress() { Object.assign(state, freshProgress(SERIES.n)); save(); }
