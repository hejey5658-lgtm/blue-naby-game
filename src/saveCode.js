// 저장 코드 (systems.md 7절): 진행 기록을 짧은 글자로 바꿔 다른 브라우저(카카오톡 안 → 크롬, 사파리 → 홈 화면 앱)로 옮긴다.
// 코드 = "BB2-" + 꼭 필요한 값(단계·모습·아이템·친구·별·퍼즐·설정)을 JSON → base64url + "-" + 확인 문자 4자리.
// BB2 = 5단계 순서(2026-11-04~). 예전 BB1(7장 순서) 코드도 읽어서 5단계로 바꾼다.
// 미로 위치는 넣지 않는다(장 처음부터 이어 하기). 비밀 정보가 아니며 어디로도 보내지 않는다.
import { CHAPTERS, LEGACY_IDS, legacyStage, stageLabel } from './data/chapters.js';
import { BOSSES } from './data/bosses.js';
import { ITEMS } from './data/items.js';
import { PUZZLES } from './data/puzzles.js';
import { state, save, mergeKoreaStars } from './state.js';
import { DATA, SERIES, META, useSeries } from './series.js';
import { pack, unpack } from './social/codec.js';

const FORMS_OF = { 1: ['caterpillar', 'moth', 'butterfly'], 2: ['popoSpring', 'popoSummer', 'popoAutumn', 'popoWinter'] };
// 탄마다 앞글자가 다르다: 1탄 BB2-(예전 BB1-), 2탄 PP1-. 목록은 그 탄의 데이터로 (지금 하는 탄이 아니어도 읽을 수 있게)
const keysOf = (n) => ({ items: Object.keys(DATA[n].ITEMS), friends: Object.keys(DATA[n].BOSSES), ids: DATA[n].CHAPTERS.map((c) => c.id) });
const LEGACY_PREFIX = 'BB1-';
void ITEMS; void BOSSES;

const bits = (keys, have) => keys.reduce((n, k, i) => (have.includes(k) ? n | (1 << i) : n), 0);
const unbits = (keys, n) => keys.filter((_, i) => n & (1 << i));

export function makeSaveCode() {
  const st = state.settings;
  const data = [
    state.chapter,
    Math.max(0, FORMS_OF[SERIES.n].indexOf(state.form)),
    bits(keysOf(SERIES.n).items, state.items),
    bits(keysOf(SERIES.n).friends, state.friends),
    CHAPTERS.map((c) => state.stars[c.id] ?? 0).join(''),
    bits(PUZZLES.map((p) => p.id), Object.keys(state.puzzle?.cleared ?? {}).filter((k) => state.puzzle.cleared[k])),
    (st.sound ? 1 : 0) | (st.vibrate ? 2 : 0) | (st.control === 'dpad' ? 4 : 0) | (st.textSpeed === 'fast' ? 8 : 0),
    state.cleared ? 1 : 0,
  ];
  return pack(SERIES.meta.saveCode, data);
}

// 코드를 읽어 내용만 돌려준다 (틀리면 null). 적용은 applySaveCode.
export function readSaveCode(raw) {
  try {
    let series = 1;
    let data = unpack(META[1].saveCode, raw);
    let legacy = false;
    if (!data) { data = unpack(META[2].saveCode, raw); series = 2; }
    if (!data) { data = unpack(LEGACY_PREFIX, raw); legacy = true; series = 1; }
    const K = keysOf(series);
    if (!Array.isArray(data)) return null;
    let [chapter, form, items, friends, stars, puzzles, settings, cleared] = data;
    const ids = legacy ? LEGACY_IDS : K.ids;
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > ids.length) return null;
    void stageLabel;
    let starMap = Object.fromEntries(ids.map((id, i) => [id, Number(String(stars)[i] ?? 0)]).filter(([, v]) => v > 0));
    if (legacy) {
      const koreaDone = (starMap.ch3 ?? 0) > 0;
      starMap = mergeKoreaStars(starMap);
      chapter = koreaDone ? legacyStage(chapter) : 1;
      if (!koreaDone && form > 0) form = 0;
    }
    return {
      chapter,
      form: FORMS_OF[series][form] ?? FORMS_OF[series][0],
      series,
      items: unbits(K.items, items),
      friends: unbits(K.friends, friends),
      stars: starMap,
      puzzleCleared: Object.fromEntries(unbits(PUZZLES.map((p) => p.id), puzzles).map((k) => [k, true])),
      settings: { sound: !!(settings & 1), vibrate: !!(settings & 2), control: settings & 4 ? 'dpad' : 'swipe', textSpeed: settings & 8 ? 'fast' : 'normal' },
      cleared: !!cleared,
    };
  } catch {
    return null;
  }
}

export function applySaveCode(d) {
  useSeries(d.series ?? 1);
  Object.assign(state, {
    chapter: d.chapter,
    form: d.form,
    items: d.items,
    friends: d.friends,
    stars: d.stars,
    settings: { ...state.settings, ...d.settings },
    puzzle: { ...(state.puzzle ?? {}), cleared: d.puzzleCleared, best: state.puzzle?.best ?? {} },
    cleared: d.cleared,
    step: Object.keys(d.stars).length || d.friends.length || d.chapter > 1 ? 'map' : 'new',
    playing: null,
    mazeState: null,
    bossIndex: 0,
  });
  save();
}

// "2단계 · 중국 · 나방 블루나비" 같은 짧은 설명 (확인 창용)
export function describe(d) {
  const n = d.series ?? 1;
  const list = DATA[n].CHAPTERS;
  const ch = list[Math.min(d.chapter, list.length) - 1];
  const label = `${list.indexOf(ch) + 1}단계 · ${ch.name}`;
  if (n === 2) return `2탄 포포 · ${label} · 친구 ${d.friends.length}명`;
  const formName = { caterpillar: '애벌레', moth: '나방', butterfly: '나비' }[d.form];
  const stars = Object.values(d.stars).reduce((a, b) => a + b, 0);
  return `${label} · ${formName} 블루나비 · 별 ${stars}개`;
}
