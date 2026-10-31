// 저장 코드 (systems.md 7절): 진행 기록을 짧은 글자로 바꿔 다른 브라우저(카카오톡 안 → 크롬, 사파리 → 홈 화면 앱)로 옮긴다.
// 코드 = "BB1-" + 꼭 필요한 값(장·모습·아이템·친구·별·퍼즐·설정)을 JSON → base64url + "-" + 확인 문자 4자리.
// 미로 위치는 넣지 않는다(장 처음부터 이어 하기). 비밀 정보가 아니며 어디로도 보내지 않는다.
import { CHAPTERS } from './data/chapters.js';
import { BOSSES } from './data/bosses.js';
import { ITEMS } from './data/items.js';
import { PUZZLES } from './data/puzzles.js';
import { state, save } from './state.js';
import { pack, unpack } from './social/codec.js';

const FORMS = ['caterpillar', 'moth', 'butterfly'];
const ITEM_KEYS = Object.keys(ITEMS);
const FRIEND_KEYS = Object.keys(BOSSES);
const PREFIX = 'BB1-';

const bits = (keys, have) => keys.reduce((n, k, i) => (have.includes(k) ? n | (1 << i) : n), 0);
const unbits = (keys, n) => keys.filter((_, i) => n & (1 << i));

export function makeSaveCode() {
  const st = state.settings;
  const data = [
    state.chapter,
    Math.max(0, FORMS.indexOf(state.form)),
    bits(ITEM_KEYS, state.items),
    bits(FRIEND_KEYS, state.friends),
    CHAPTERS.map((c) => state.stars[c.id] ?? 0).join(''),
    bits(PUZZLES.map((p) => p.id), Object.keys(state.puzzle?.cleared ?? {}).filter((k) => state.puzzle.cleared[k])),
    (st.sound ? 1 : 0) | (st.vibrate ? 2 : 0) | (st.control === 'dpad' ? 4 : 0) | (st.textSpeed === 'fast' ? 8 : 0),
    state.cleared ? 1 : 0,
  ];
  return pack(PREFIX, data);
}

// 코드를 읽어 내용만 돌려준다 (틀리면 null). 적용은 applySaveCode.
export function readSaveCode(raw) {
  try {
    const data = unpack(PREFIX, raw);
    if (!Array.isArray(data)) return null;
    const [chapter, form, items, friends, stars, puzzles, settings, cleared] = data;
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > CHAPTERS.length) return null;
    return {
      chapter,
      form: FORMS[form] ?? 'caterpillar',
      items: unbits(ITEM_KEYS, items),
      friends: unbits(FRIEND_KEYS, friends),
      stars: Object.fromEntries(CHAPTERS.map((c, i) => [c.id, Number(String(stars)[i] ?? 0)]).filter(([, v]) => v > 0)),
      puzzleCleared: Object.fromEntries(unbits(PUZZLES.map((p) => p.id), puzzles).map((k) => [k, true])),
      settings: { sound: !!(settings & 1), vibrate: !!(settings & 2), control: settings & 4 ? 'dpad' : 'swipe', textSpeed: settings & 8 ? 'fast' : 'normal' },
      cleared: !!cleared,
    };
  } catch {
    return null;
  }
}

export function applySaveCode(d) {
  Object.assign(state, {
    chapter: d.chapter,
    form: d.form,
    items: d.items,
    friends: d.friends,
    stars: d.stars,
    settings: { ...state.settings, ...d.settings },
    puzzle: { ...(state.puzzle ?? {}), cleared: d.puzzleCleared, best: state.puzzle?.best ?? {} },
    cleared: d.cleared,
    step: Object.keys(d.stars).length ? 'map' : d.chapter > 1 ? 'map' : 'new',
    playing: null,
    mazeState: null,
    bossIndex: 0,
  });
  save();
}

// "3장 · 아침 시장 · 애벌레" 같은 짧은 설명 (확인 창용)
export function describe(d) {
  const ch = CHAPTERS[Math.min(d.chapter, CHAPTERS.length) - 1];
  const formName = { caterpillar: '애벌레', moth: '나방', butterfly: '나비' }[d.form];
  const stars = Object.values(d.stars).reduce((a, b) => a + b, 0);
  return `${ch.id.slice(2)}장 ${ch.place} · ${formName} 블루나비 · 별 ${stars}개`;
}
