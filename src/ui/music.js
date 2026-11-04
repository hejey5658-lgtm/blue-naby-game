// 배경음 연주기: src/data/music.js 의 악보를 Web Audio로 연주한다 (소리 파일 없음).
// 효과음과 같은 오디오(feedback.js)를 쓰고, [소리] 설정 하나로 함께 켜고 끈다 (사용자 결정).
// 박자가 흔들리지 않게 0.15초 앞까지 미리 예약하는 방식(lookahead). 곡을 바꾸면 0.6초 동안 서로 겹쳐 넘어간다.
import { state } from '../state.js';
import { SONGS } from '../data/music.js';
import { audioContext } from './feedback.js';

const MASTER = 0.32; // 효과음보다 작게
const AHEAD = 0.15;
const NAMES = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const freq = (n) => {
  const m = /^([A-G][#b]?)(\d)$/.exec(n);
  return m ? 440 * 2 ** ((NAMES[m[1]] + (Number(m[2]) + 1) * 12 - 69) / 12) : null;
};
// "C5 - E5 ." → [{ f, len }, null, …] (한 칸 = 8분음표, '-'만큼 길게)
function parse(line) {
  const t = line.trim().split(/\s+/);
  return t.map((tok, i) => {
    const f = freq(tok);
    if (!f) return null;
    let len = 1;
    while (t[i + len] === '-') len++;
    return { f, len };
  });
}

let cur = null; // { key, out, mel, bass, drums, stepDur, step, next, song }
let timer = null;
let noise = null;

function noiseBuffer(ctx) {
  if (noise) return noise;
  noise = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

function tone(ctx, out, f, at, dur, type, level) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(level, at + 0.015);
  g.gain.exponentialRampToValueAtTime(level * 0.6, at + dur * 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(out);
  o.start(at);
  o.stop(at + dur + 0.02);
}

function drum(ctx, out, kind, at) {
  if (kind === 'k' || kind === 'x') {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(140, at);
    o.frequency.exponentialRampToValueAtTime(45, at + 0.12);
    g.gain.setValueAtTime(0.5, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    o.connect(g).connect(out);
    o.start(at);
    o.stop(at + 0.18);
  }
  if (kind === 's' || kind === 'h' || kind === 'x') {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = kind === 's' ? 1400 : 7000;
    const g = ctx.createGain();
    const len = kind === 's' ? 0.12 : 0.035;
    g.gain.setValueAtTime(kind === 's' ? 0.22 : 0.07, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    src.connect(hp).connect(g).connect(out);
    src.start(at);
    src.stop(at + len + 0.02);
  }
}

function tick() {
  const ctx = audioContext();
  if (!cur || !ctx || ctx.state !== 'running') return;
  // 다른 앱에 갔다 오면 밀린 박자를 한꺼번에 치지 않게 지금부터 다시
  if (cur.next < ctx.currentTime - 0.3) cur.next = ctx.currentTime + 0.05;
  while (cur.next < ctx.currentTime + AHEAD) {
    const { mel, bass, drums, stepDur, step, song, out } = cur;
    const at = cur.next;
    const m = mel[step % mel.length];
    if (m) tone(ctx, out, m.f, at, m.len * stepDur * 0.95, song.lead, 0.16);
    const b = bass[step % bass.length];
    if (b) tone(ctx, out, b.f, at, b.len * stepDur * 0.9, song.bass, 0.2);
    const d = drums[step % drums.length];
    if (d && d !== '.') drum(ctx, out, d, at);
    cur.step++;
    cur.next += stepDur;
  }
}

// 곡 틀기 (같은 곡이면 그대로 이어서). 소리 꺼짐·오디오 잠김이면 조용히 건너뛴다.
export function playMusic(key) {
  const ctx = audioContext();
  const song = SONGS[key];
  if (!song || !state.settings.sound || !ctx) { if (!state.settings.sound) stopMusic(); return; }
  if (cur?.key === key) return;
  try {
    stopMusic(0.6);
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, ctx.currentTime);
    out.gain.exponentialRampToValueAtTime(MASTER * (song.level ?? 0.8), ctx.currentTime + 0.6);
    out.connect(ctx.destination);
    cur = {
      key, song, out, step: 0, next: ctx.currentTime + 0.08,
      stepDur: 60 / song.bpm / 2,
      mel: parse(song.melody), bass: parse(song.bassline), drums: [...song.drums],
    };
    timer ??= setInterval(tick, 25);
    tick();
  } catch { cur = null; }
}

export function stopMusic(fade = 0.3) {
  const ctx = audioContext();
  if (cur && ctx) {
    const out = cur.out;
    try {
      out.gain.cancelScheduledValues(ctx.currentTime);
      out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), ctx.currentTime);
      out.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + fade);
      setTimeout(() => { try { out.disconnect(); } catch { /* 무시 */ } }, fade * 1000 + 300);
    } catch { /* 무시 */ }
  }
  cur = null;
}

// 소리 설정을 바꾼 뒤: 꺼졌으면 멈추고, 켜졌으면 마지막 곡을 다시
let wanted = null;
export function wantMusic(key) { wanted = key; playMusic(key); }
export function refreshMusic() { if (state.settings.sound) { const k = wanted; cur = null; if (k) playMusic(k); } else stopMusic(); }
export const nowPlaying = () => cur?.key ?? null;
