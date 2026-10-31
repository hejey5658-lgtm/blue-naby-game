// 친구와 함께 (systems.md 10절): 닉네임, 기록 카드(그림), 도전 링크(#c=C1-…), 도전장함.
// 모든 정보는 플레이어가 직접 공유한 링크·그림 안에만 담기고, 어디에도 자동으로 보내지 않는다.
import { CHAPTERS } from '../data/chapters.js';
import { MAZES } from '../data/mazes.js';
import { FORMS } from '../data/forms.js';
import { state, save } from '../state.js';
import { platform } from '../platform.js';
import { pack, unpack } from './codec.js';
import { openBox } from '../ui/htmlBox.js';
import { shareCanvas } from '../ui/photo.js';

const PREFIX = 'C1-';
const MAX_INBOX = 5;
export const ANON = '익명의 블루나비';
export const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const fmtLong = (sec) => (sec >= 60 ? `${Math.floor(sec / 60)}분 ${Math.floor(sec % 60)}초` : `${Math.floor(sec)}초`);
const PUBLIC_URL = 'https://blue-naby-game.web.app';
const baseUrl = () => (platform.isFile || /localhost|127\.0\.0\.1/.test(location.hostname) ? PUBLIC_URL : location.origin);

// ── 닉네임: 처음 공유할 때 한 번 묻는다 (최대 8글자, 건너뛰면 "익명의 블루나비") ──
export const nickname = () => (state.nickname || '').slice(0, 8) || ANON;

export function askNickname({ force = false } = {}) {
  return new Promise((resolve) => {
    if (state.nickname && !force) { resolve(nickname()); return; }
    openBox({
      title: '닉네임',
      text: '기록 카드와 도전장에 들어갈 이름이에요 (8글자까지). 이 폰에만 저장되고, 내가 보낸 링크·그림에만 들어가요.',
      field: 'input',
      maxLength: 8,
      value: state.nickname || '',
      placeholder: ANON,
      buttons: [
        { label: '정했어', onClick: (b) => { state.nickname = b.value().trim().slice(0, 8); save(); b.close(); resolve(nickname()); } },
        { label: '건너뛰기', sub: true, onClick: (b) => { b.close(); resolve(nickname()); } },
      ],
    });
  });
}

// ── 너무 짧은 기록 거르기: 그 미로의 최단 길을 가장 빠른 모습으로 지나는 시간보다 짧으면 표시하지 않는다 ──
const minCache = {};
export function minMazeSec(id) {
  if (minCache[id] != null) return minCache[id];
  const m = MAZES[id];
  const g = m.grid;
  const hop = FORMS[m.form].canHop;
  const find = (ch) => g.flatMap((r, y) => [...r].map((c, x) => (c === ch ? [x, y] : null))).filter(Boolean);
  const S = find('S')[0];
  const E = find('E')[0];
  const dist = new Map([[S.join(), 0]]);
  const q = [S];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = g[y + dy]?.[x + dx];
      const k = `${x + dx},${y + dy}`;
      if (!c || c === '#' || (c === 'b' && !hop) || dist.has(k)) continue;
      dist.set(k, dist.get(`${x},${y}`) + 1);
      q.push([x + dx, y + dy]);
    }
  }
  minCache[id] = ((dist.get(E.join()) ?? 0) * FORMS[m.form].stepMs) / 1000;
  return minCache[id];
}
export const believable = (id, sec) => sec > 0 && sec >= minMazeSec(id) * 0.9;

// ── 도전 코드: [닉네임, 장별 미로 시간(초, 없으면 0), 장별 별] ──
export function myTimes() {
  return CHAPTERS.map((c) => state.records[c.id]?.mazeSec ?? 0);
}
export function makeChallengeLink() {
  const code = pack(PREFIX, [nickname(), myTimes(), CHAPTERS.map((c) => state.stars[c.id] ?? 0).join('')]);
  return `${baseUrl()}/#c=${code}`;
}

export function readChallenge(raw) {
  const d = unpack(PREFIX, raw);
  if (!Array.isArray(d) || !Array.isArray(d[1])) return null;
  const nick = String(d[0] || ANON).slice(0, 8);
  const times = {};
  CHAPTERS.forEach((c, i) => { const t = Number(d[1][i]) || 0; if (believable(c.id, t)) times[c.id] = t; });
  if (!Object.keys(times).length) return null;
  return { nick, times, stars: String(d[2] || ''), code: String(raw).trim(), at: Date.now() };
}

// 시작할 때 주소의 #c= 를 읽어 도전장함에 넣고, 주소창에서는 지운다(새로고침해도 띠가 반복되지 않게)
export function readChallengeFromUrl() {
  const m = location.hash.match(/[#&]c=([^&]+)/);
  if (!m) return null;
  let c = null;
  try { c = readChallenge(decodeURIComponent(m[1])); } catch { c = null; }
  try { history.replaceState(null, '', location.pathname + location.search); } catch { /* 무시 */ }
  if (!c) return null; // 깨졌거나 옛 버전이면 조용히 무시
  const inbox = (state.challenges ?? []).filter((x) => x.code !== c.code);
  state.challenges = [c, ...inbox].slice(0, MAX_INBOX);
  state.activeChallenge = 0;
  state.newChallenge = true;
  save();
  return c;
}

export function activeChallenge() {
  return (state.challenges ?? [])[state.activeChallenge ?? 0] ?? null;
}

// 타이틀 띠에 쓸 한 줄: 아직 못 이긴 장 중 하나
export function challengeHeadline(c) {
  const id = CHAPTERS.map((x) => x.id).find((k) => c.times[k] && !(state.records[k]?.mazeSec <= c.times[k])) ?? Object.keys(c.times)[0];
  return `${c.nick}의 도전장! ${id.slice(2)}장 미로 ${fmtLong(c.times[id])}를 넘어 보세요`;
}

// 미로를 끝냈을 때 도전 결과
export function challengeResult(id, sec) {
  const c = activeChallenge();
  if (!c?.times[id]) return null;
  return { nick: c.nick, theirs: c.times[id], win: sec < c.times[id] };
}

// ── 보내기 ──
export async function sendChallenge() {
  await askNickname();
  if (!myTimes().some((t) => t > 0)) {
    openBox({ title: '도전장 보내기', text: '먼저 미로를 하나 끝내야 도전장을 만들 수 있어요!', field: 'none', buttons: [{ label: '알겠어요', onClick: (b) => b.close() }] });
    return;
  }
  const url = makeChallengeLink();
  const text = `블루나비의 세계여행 — ${nickname()}의 도전장! 내 미로 기록을 넘어 봐 🦋`;
  try {
    if (platform.can.share) { await navigator.share({ title: '블루나비 도전장', text, url }); return; }
  } catch (e) { if (e?.name === 'AbortError') return; }
  openBox({
    title: '도전장 링크',
    text: '이 링크를 친구에게 보내면, 친구 화면에 내 기록이 깃발로 떠요.',
    value: `${text}\n${url}`,
    readonly: true,
    buttons: [
      { label: '복사하기', onClick: async (b) => { try { await navigator.clipboard.writeText(b.value()); b.say('복사했어요!'); } catch { b.textarea.select(); b.say('글자를 길게 눌러 복사해 주세요', true); } } },
      { label: '닫기', sub: true, onClick: (b) => b.close() },
    ],
  });
}

// ── 기록 카드 1080×1350 (지금 블루나비 모습, 닉네임, 장별 별과 시간, 제목과 주소) ──
export async function makeRecordCard(game) {
  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  const sky = x.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#8fd3ff');
  sky.addColorStop(0.55, '#d6efff');
  sky.addColorStop(1, '#fdf7ea');
  x.fillStyle = sky;
  x.fillRect(0, 0, W, H);
  // 테두리 (여권 느낌)
  x.strokeStyle = '#2f7bff';
  x.lineWidth = 14;
  x.beginPath(); x.roundRect(28, 28, W - 56, H - 56, 48); x.stroke();
  x.textAlign = 'center';
  x.fillStyle = '#2f7bff';
  x.font = '54px Jua, sans-serif';
  x.fillText('블루나비의 세계여행', W / 2, 130);
  x.fillStyle = '#2b2d5a';
  x.font = '72px Jua, sans-serif';
  x.fillText(`${nickname()}의 여행 기록`, W / 2, 230);
  // 지금 블루나비 모습 (자랑하는 포즈 = 대결 7번째 칸 '기쁨')
  const key = `blue_${state.form}_battle`;
  try {
    const tex = game.textures.get(key);
    const fr = tex.get(6);
    x.drawImage(tex.getSourceImage(), fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, W / 2 - 230, 250, 460, 460);
  } catch { /* 그림이 없으면 건너뜀 */ }
  // 장별 기록
  const total = CHAPTERS.reduce((n, ch) => n + (state.stars[ch.id] ?? 0), 0);
  x.fillStyle = 'rgba(255,255,255,0.92)';
  x.beginPath(); x.roundRect(90, 720, W - 180, 470, 36); x.fill();
  x.fillStyle = '#2b2d5a';
  x.font = '44px Jua, sans-serif';
  x.fillText(`모은 별 ${total} / ${CHAPTERS.length * 3}`, W / 2, 790);
  x.font = '32px "Gowun Dodum", sans-serif';
  CHAPTERS.forEach((ch, i) => {
    const y = 850 + i * 48;
    const st = state.stars[ch.id] ?? 0;
    const sec = state.records[ch.id]?.mazeSec;
    x.textAlign = 'left';
    x.fillStyle = st ? '#2b2d5a' : '#a8a8bc';
    x.fillText(`${i + 1}장 ${ch.place}`, 140, y);
    x.textAlign = 'center';
    x.fillStyle = '#ffb800';
    x.fillText('★'.repeat(st) + '☆'.repeat(3 - st), 700, y);
    x.textAlign = 'right';
    x.fillStyle = '#5a5c88';
    x.fillText(sec != null ? fmt(sec) : '-', W - 140, y);
  });
  x.textAlign = 'center';
  x.fillStyle = '#2b2d5a';
  x.font = '34px Jua, sans-serif';
  x.fillText('나도 해 볼래? 설치 없이 링크로 바로!', W / 2, 1250);
  x.fillStyle = '#2f7bff';
  x.font = '30px "Gowun Dodum", sans-serif';
  x.fillText(PUBLIC_URL.replace('https://', ''), W / 2, 1296);
  return c;
}

export async function sendRecordCard(game) {
  await askNickname();
  const card = await makeRecordCard(game);
  return shareCanvas(card, 'bluenabi-record.png', `${nickname()}의 블루나비 세계여행 기록! ${PUBLIC_URL}`);
}

// ── 도전장함: 받은 도전장 최근 5개, 하나를 골라 '지금 도전 중'으로 ──
export function openInbox(onChange) {
  const list = state.challenges ?? [];
  if (!list.length) {
    openBox({ title: '도전장함', text: '아직 받은 도전장이 없어요. 친구에게 도전장을 보내 달라고 해 보세요!', field: 'none', buttons: [{ label: '닫기', onClick: (b) => b.close() }] });
    return;
  }
  const lines = list.map((c, i) => `${i === (state.activeChallenge ?? 0) ? '▶ ' : '   '}${c.nick} · ${Object.entries(c.times).map(([k, t]) => `${k.slice(2)}장 ${fmt(t)}`).join(', ')}`).join('\n');
  openBox({
    title: '도전장함',
    text: '▶ 표시가 지금 도전 중인 친구예요. 여권과 미로에 그 친구 기록이 깃발로 떠요.',
    value: lines,
    readonly: true,
    buttons: [
      { label: '다음 친구로', onClick: (b) => {
        state.activeChallenge = ((state.activeChallenge ?? 0) + 1) % list.length;
        save();
        b.close();
        onChange?.();
        openInbox(onChange);
      } },
      { label: '닫기', sub: true, onClick: (b) => b.close() },
    ],
  });
}

// 여권 [자랑하기] 메뉴
export function openShareMenu(game, onChange) {
  openBox({
    title: '친구와 함께',
    text: `${nickname()} · 내 기록을 그림으로 보내거나, 도전장을 보내 친구가 내 미로 기록에 도전하게 해 보세요.`,
    field: 'none',
    column: true,
    buttons: [
      { label: '기록 카드 보내기', onClick: async (b) => { b.close(); const r = await sendRecordCard(game); if (r === 'downloaded') openBox({ title: '기록 카드', text: '그림을 저장했어요! 사진첩에서 카카오톡으로 보내 보세요.', field: 'none', buttons: [{ label: '좋아요', onClick: (x) => x.close() }] }); } },
      { label: '도전장 보내기', onClick: (b) => { b.close(); sendChallenge(); } },
      { label: `도전장함 (${(state.challenges ?? []).length})`, onClick: (b) => { b.close(); openInbox(onChange); } },
      { label: '닉네임 바꾸기', sub: true, onClick: (b) => { b.close(); askNickname({ force: true }).then(() => onChange?.()); } },
      { label: '닫기', sub: true, onClick: (b) => b.close() },
    ],
  });
}
