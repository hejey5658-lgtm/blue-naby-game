// 게임 진행 상태 + 저장/불러오기. 저장 형식이 바뀌면 migrate()에서 옛 저장을 새 형식으로 바꾼다.
// 자세한 저장(미로 위치·저장 코드)은 6단계에서 채운다.
import { platform } from './platform.js';
import { legacyStage } from './data/chapters.js';

const KEY = 'blueButterfly.save';
const SAVE_VERSION = 2; // 2 = 5단계(나라마다 1단계, 2026-11-04)

export const DEFAULT_SETTINGS = { sound: true, vibrate: true, control: 'swipe', textSpeed: 'normal' };

function fresh() {
  return {
    version: SAVE_VERSION,
    chapter: 1,
    step: 'new',
    form: 'caterpillar',
    items: [],
    friends: [],
    stars: {},
    records: {},
    mazeState: null,
    bossIndex: 0,
    playing: null,
    challenges: [],
    activeChallenge: 0,
    newChallenge: false,
    mazeTimeStar: {},
    nickname: '',
    settings: { ...DEFAULT_SETTINGS },
    puzzle: { cleared: {}, best: {} }, // 옛 그림 퍼즐 기록 (지금은 화면에서 안 씀, 저장 코드 호환용)
    pop: { reached: 0, best: {} },      // 기념품 퐁퐁: 혼자 하기로 열린 나라 번호, 나라별 최고 점수
    cleared: false,
    savedAt: null,
  };
}

// 예전 7장 별 → 5단계 별: 한국 1~3장을 모두 깼으면 셋 중 가장 적은 별, 아니면 한국 단계는 다시 (저장 코드 BB1도 이것으로)
const OLD_KOREA = ['ch1', 'ch2', 'ch3'];
export function mergeKoreaStars(stars = {}) {
  const out = { ...stars };
  const k = OLD_KOREA.map((id) => Number(stars[id]) || 0);
  OLD_KOREA.forEach((id) => delete out[id]);
  if (k.every((v) => v > 0)) out.ch1 = Math.min(...k);
  return out;
}

// 저장 1판(7장) → 2판(5단계). 한국 미로가 새로 바뀌어서 한국 기록·미로 위치는 지우고, 친구·아이템·별(중국~)은 그대로.
function upgradeV1(d) {
  const koreaDone = (Number(d.stars?.ch3) || 0) > 0;
  d.stars = mergeKoreaStars(d.stars);
  d.chapter = koreaDone ? legacyStage(d.chapter ?? 1) : 1;
  for (const k of ['records', 'mazeTimeStar']) if (d[k]) OLD_KOREA.forEach((id) => delete d[k][id]);
  d.challenges = (d.challenges ?? []).map((c) => {
    const times = { ...(c.times ?? {}) };
    OLD_KOREA.forEach((id) => delete times[id]);
    return { ...c, times };
  }).filter((c) => Object.keys(c.times).length);
  d.activeChallenge = 0;
  const inKorea = /^ch[123]_/.test(d.step ?? '') || OLD_KOREA.includes(d.playing);
  if (d.step && d.step !== 'new' && (!koreaDone || inKorea)) {
    Object.assign(d, { step: 'map', playing: null, mazeState: null, bossIndex: 0 });
    if (!koreaDone) d.form = 'caterpillar';
  }
  return d;
}

function migrate(data) {
  if ((data.version ?? 1) < 2) upgradeV1(data);
  const base = fresh();
  return { ...base, ...data, settings: { ...base.settings, ...(data.settings || {}) }, version: SAVE_VERSION };
}

function read() {
  if (!platform.can.storage) return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? migrate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export const state = read() || fresh();

// 진행 기록이 있는지 (타이틀의 [이어하기])
export function hasProgress() {
  return state.step !== 'new';
}

export function save() {
  if (!platform.can.storage) return false;
  try {
    state.savedAt = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

// 처음부터 다시: 설정과 닉네임은 남기고 진행만 지운다.
export function resetProgress() {
  const keep = { settings: state.settings, nickname: state.nickname, puzzle: state.puzzle, pop: state.pop };
  Object.assign(state, fresh(), keep);
  save();
}
