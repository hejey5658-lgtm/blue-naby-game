// 각자 폰으로 대결 (design-brief 12절): 서버 없이 링크(#d=D1-…)만 주고받는다.
// 대결장 = [놀이, 나라, 같은 판을 만드는 번호(시드), 보낸 사람], 결과 링크 = 대결장 + 내 기록.
// 결과 링크만 받아도 같은 판을 할 수 있다. 기록은 이 기기의 state.matches(최근 5개, 대결함)에만 남는다.
// 닉네임·기록은 플레이어가 직접 보낸 링크 안에만 들어가고, 어디에도 자동으로 보내지 않는다.
import { DATA, SERIES } from '../series.js';
import { state, save } from '../state.js';
import { platform } from '../platform.js';
import { pack, unpack } from './codec.js';
import { openBox } from '../ui/htmlBox.js';
import { nickname, askNickname, baseUrl, fmt } from './social.js';

const PREFIX = 'D1-';
const MAX = 5;
export const GAME_NAME = { maze: '미로', pop: '기념품 퐁퐁' };

// 이 기기를 알아보는 무작위 글자 (내 링크를 내가 열었을 때 상대 기록으로 착각하지 않게). 개인정보 아님.
function deviceId() {
  if (!state.deviceId) { state.deviceId = Math.random().toString(36).slice(2, 10); save(); }
  return state.deviceId;
}

export const matchById = (id) => (state.matches ?? []).find((m) => m.id === id) ?? null;
// 탄(1탄 블루나비 / 2탄 포포)마다 단계·퐁퐁 판이 다르다. m.series 없으면 1탄
const dataOf = (m) => DATA[m.series === 2 ? 2 : 1];
export const stageName = (m) => {
  const d = dataOf(m);
  if (m.game !== 'maze') return d.STAGES[m.stage]?.name ?? '';
  const i = Math.max(0, d.CHAPTERS.findIndex((c) => c.id === m.stage));
  return `${m.series === 2 ? '2탄 ' : ''}${i + 1}단계 · ${d.CHAPTERS[i].name}`;
};
export const amHost = (m) => m.hostDev === deviceId();
export const opponentName = (m) => m.theirs?.nick ?? (amHost(m) ? '친구' : m.host);
// 기록 글자: 미로 = 시간, 퐁퐁 = 점수
export const scoreText = (m, r) => (m.game === 'maze' ? fmt(r.score) : `${r.score}점`);

// 승패: 1 = 내가 이김, -1 = 친구가 이김, 0 = 비김, null = 아직
export function verdict(m) {
  if (!m.mine || !m.theirs) return null;
  const a = m.mine, b = m.theirs;
  if (m.game === 'maze') {
    if (a.score !== b.score) return a.score < b.score ? 1 : -1;
    if (a.rolls !== b.rolls) return a.rolls < b.rolls ? 1 : -1;
    return 0;
  }
  return a.score === b.score ? 0 : a.score > b.score ? 1 : -1;
}

function keep(m) {
  state.matches = [m, ...(state.matches ?? []).filter((x) => x.id !== m.id)].slice(0, MAX);
  save();
  return m;
}

// 새 대결장 (방 만들기)
export function createMatch(game, stage) {
  return keep({
    id: Math.random().toString(36).slice(2, 8),
    game, stage, series: SERIES.n,
    seed: Math.floor(Math.random() * 2147483646) + 1,
    host: nickname(), hostDev: deviceId(),
    mine: null, theirs: null, at: Date.now(),
  });
}

export function saveMyResult(id, score, rolls) {
  const m = matchById(id);
  if (!m) return null;
  m.mine = { score: Math.round(score), rolls: rolls ?? 0 };
  return keep(m);
}

const linkFor = (m, withResult) => {
  const base = [withResult ? 'r' : 'i', m.id, m.series === 2 ? `${m.game}2` : m.game, m.stage, m.seed, m.host, m.hostDev];
  const data = withResult ? [...base, nickname(), deviceId(), m.mine.score, m.mine.rolls] : base;
  return `${baseUrl()}/#d=${pack(PREFIX, data)}`;
};

export function readMatch(raw) {
  const d = unpack(PREFIX, raw);
  if (!Array.isArray(d) || !['i', 'r'].includes(d[0])) return null;
  const [kind, id, rawGame, stage, seed, host, hostDev, nick, dev, score, rolls] = d;
  const series = String(rawGame).endsWith('2') ? 2 : 1;
  const game = String(rawGame).replace(/2$/, '');
  if (typeof id !== 'string' || !GAME_NAME[game] || !Number.isInteger(seed)) return null;
  if (game === 'maze' && !DATA[series].CHAPTERS.some((c) => c.id === stage)) return null;
  if (game === 'pop' && !(Number.isInteger(stage) && DATA[series].STAGES[stage])) return null;
  const m = matchById(id) ?? { id, game, stage, seed, series, host: String(host || '친구').slice(0, 8), hostDev: String(hostDev || ''), mine: null, theirs: null, at: Date.now() };
  if (kind === 'r' && dev !== deviceId() && Number.isFinite(score)) m.theirs = { nick: String(nick || '친구').slice(0, 8), score: Math.round(score), rolls: Number(rolls) || 0 };
  return keep(m);
}

// 시작할 때 주소의 #d= 를 읽어 대결함에 넣고, 주소창에서는 지운다. 타이틀이 state.pendingMatch를 보고 대결 화면을 연다.
export function readMatchFromUrl() {
  const hit = location.hash.match(/[#&]d=([^&]+)/);
  if (!hit) return null;
  let m = null;
  try { m = readMatch(decodeURIComponent(hit[1])); } catch { m = null; }
  try { history.replaceState(null, '', location.pathname + location.search); } catch { /* 무시 */ }
  if (!m) return null;
  state.pendingMatch = m.id;
  save();
  return m;
}

// 카카오톡 공유 창(되면) → 안 되면 링크 복사 상자
async function share(title, text, url, help) {
  try {
    if (platform.can.share) { await navigator.share({ title, text, url }); return; }
  } catch (e) { if (e?.name === 'AbortError') return; }
  openBox({
    title,
    text: help,
    value: `${text}\n${url}`,
    readonly: true,
    buttons: [
      { label: '복사하기', onClick: async (b) => { try { await navigator.clipboard.writeText(b.value()); b.say('복사했어요! 카카오톡에 붙여 넣어 보내 주세요.'); } catch { b.textarea.select(); b.say('글자를 길게 눌러 복사해 주세요', true); } } },
      { label: '닫기', sub: true, onClick: (b) => b.close() },
    ],
  });
}

export async function sendInvite(m) {
  await askNickname();
  m.host = nickname();
  keep(m);
  await share('블루나비 대결장', `${nickname()}의 대결장! 블루나비 ${GAME_NAME[m.game]} ${stageName(m)}에서 각자 폰으로 겨뤄 보자 🦋`, linkFor(m, false),
    '이 링크를 친구에게 보내 주세요. 친구가 열면 같은 판으로 대결이 시작돼요.');
}

export async function sendResult(m) {
  await askNickname();
  await share('블루나비 대결 결과', `${nickname()}의 ${GAME_NAME[m.game]} ${stageName(m)} 기록 ${scoreText(m, m.mine)}! 열어서 승패를 확인해 봐`, linkFor(m, true),
    '이 링크를 친구에게 보내 주세요. 친구가 열면 두 사람 기록이 나란히 보여요. (친구가 아직 안 했으면 같은 판으로 바로 할 수 있어요)');
}

// 같은 시드 → 같은 수열 (두 폰에서 기념품이 똑같은 순서로 떨어지게)
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
