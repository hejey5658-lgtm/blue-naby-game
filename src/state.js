// 게임 진행 상태 + 저장/불러오기. 저장 형식이 바뀌면 migrate()에서 옛 저장을 새 형식으로 바꾼다.
// 자세한 저장(미로 위치·저장 코드)은 6단계에서 채운다.
import { platform } from './platform.js';
import { legacyStage, v5Stage } from './data/chapters.js';

const KEY = 'blueButterfly.save';
const SAVE_VERSION = 3; // 2 = 5단계(나라마다 1단계, 2026-11-04), 3 = 1탄 4단계(한국 미로 뺌, 2026-11-13)

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
    matches: [],         // 각자 폰 대결함 (최근 5개, src/social/match.js)
    pendingMatch: null,  // 대결 링크로 들어왔으면 그 대결 번호 (타이틀이 대결 화면을 연다)
    deviceId: '',        // 내 링크를 알아보는 무작위 글자 (개인정보 아님)
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

// 저장 2판(5단계) → 3판(1탄 4단계, 한국 미로 뺌): 1탄 진행만 바꾼다 (1탄 진행은 지금 탄이 1탄이면 맨 위, 2탄이면 state.other)
export function upgradeKoreaGone(p) {
  if (!p) return p;
  p.chapter = v5Stage(p.chapter);
  for (const k of ['stars', 'records', 'mazeTimeStar']) if (p[k]) delete p[k].ch1;
  if (p.playing === 'ch1' || /^ch1_/.test(p.step ?? '')) Object.assign(p, { playing: null, mazeState: null, step: p.step === 'new' ? 'new' : 'map' });
  if (p.form === 'caterpillar' && p.step && p.step !== 'new') p.form = 'moth';
  return p;
}

function migrate(data) {
  if ((data.version ?? 1) < 2) upgradeV1(data);
  if ((data.version ?? 1) < 3) {
    if (data.series === 2) upgradeKoreaGone(data.other); else upgradeKoreaGone(data);
    data.challenges = (data.challenges ?? []).map((c) => { const times = { ...(c.times ?? {}) }; delete times.ch1; return { ...c, times }; }).filter((c) => Object.keys(c.times).length);
  }
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
  const keep = { settings: state.settings, nickname: state.nickname, puzzle: state.puzzle, pop: state.pop, matches: state.matches, deviceId: state.deviceId };
  Object.assign(state, fresh(), keep);
  save();
}
