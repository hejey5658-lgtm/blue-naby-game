// 게임 진행 상태 + 저장/불러오기. 저장 형식이 바뀌면 migrate()에서 옛 저장을 새 형식으로 바꾼다.
// 자세한 저장(미로 위치·저장 코드)은 6단계에서 채운다.
import { platform } from './platform.js';

const KEY = 'blueButterfly.save';
const SAVE_VERSION = 1;

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
    mazeTimeStar: {},
    nickname: '',
    settings: { ...DEFAULT_SETTINGS },
    puzzle: { cleared: {}, best: {} },
    cleared: false,
    savedAt: null,
  };
}

function migrate(data) {
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
  const keep = { settings: state.settings, nickname: state.nickname, puzzle: state.puzzle };
  Object.assign(state, fresh(), keep);
  save();
}
