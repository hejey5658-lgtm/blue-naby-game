// 효과음·진동. 설정과 기기 지원 여부를 여기서 확인한다.
// 소리 파일 없이 Web Audio로 짧은 소리·멜로디를 직접 만든다 (TONES).
import { state } from '../state.js';
import { platform, vibrate as rawVibrate } from '../platform.js';
import { UI } from '../data/ui.js';

let ctx = null;

// 폰 브라우저는 사용자가 한 번 탭하기 전에는 소리를 못 낸다. 첫 탭(시작 버튼)에서 부른다.
export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
}

export function suspendAudio() {
  try { ctx?.suspend(); } catch { /* 무시 */ }
}

// 한 음: [주파수, 길이(초), 파형, 끝 주파수(미끄러짐)?]
// 짧은 멜로디: { notes: [[주파수, 시작(초), 길이, 파형, 크기?, 끝 주파수?], …] } — 소리 파일 없이 Web Audio로 만든다.
const TONES = {
  tap: [660, 0.05, 'triangle'],
  next: [520, 0.04, 'sine'],
  open: [440, 0.18, 'sine', 880],
  toggle: [740, 0.05, 'triangle'],
  // 퐁!(비눗방울 터짐) / 뾰롱(다시 나타남)
  pop: { notes: [[920, 0, 0.09, 'sine', 0.24, 300], [1400, 0.02, 0.05, 'triangle', 0.08]] },
  respawn: { notes: [[523, 0, 0.08, 'sine'], [784, 0.07, 0.08, 'sine'], [1047, 0.14, 0.16, 'sine']] },
  // 여권 도장 쾅 + 별마다 띵 / 진화 반짝
  stamp: { notes: [[150, 0, 0.16, 'square', 0.12, 70], [90, 0, 0.2, 'sine', 0.26, 50]] },
  ding: { notes: [[1568, 0, 0.18, 'triangle', 0.12]] },
  evolve: { notes: [[523, 0, 0.1, 'triangle'], [659, 0.08, 0.1, 'triangle'], [784, 0.16, 0.1, 'triangle'], [1047, 0.24, 0.1, 'triangle'], [1319, 0.32, 0.1, 'triangle'], [1568, 0.4, 0.3, 'sine']] },
  // 둘이서 하기: 차례 바뀜 딩동 / 승리 팡파르
  turn: { notes: [[784, 0, 0.2, 'sine', 0.2], [523, 0.2, 0.32, 'sine', 0.2]] },
  win: { notes: [[523, 0, 0.12, 'triangle'], [659, 0.12, 0.12, 'triangle'], [784, 0.24, 0.12, 'triangle'], [1047, 0.36, 0.4, 'triangle', 0.2]] },
  // 기념품 퐁퐁: 퐁(연쇄일수록 높게)·연쇄 띠리링·구름 몽글
  pop1: { notes: [[700, 0, 0.08, 'sine', 0.2, 360]] },
  pop2: { notes: [[820, 0, 0.08, 'sine', 0.2, 420]] },
  pop3: { notes: [[960, 0, 0.08, 'sine', 0.2, 480]] },
  pop4: { notes: [[1120, 0, 0.08, 'sine', 0.2, 560]] },
  pop5: { notes: [[1300, 0, 0.08, 'sine', 0.2, 650]] },
  chain: { notes: [[1047, 0, 0.07, 'triangle'], [1319, 0.06, 0.07, 'triangle'], [1568, 0.12, 0.12, 'triangle']] },
  cloud: { notes: [[330, 0, 0.18, 'sine', 0.16, 260], [392, 0.12, 0.2, 'sine', 0.12, 300]] },
  // 나라에 도착할 때 인사 소리: 장마다 음색·높이를 달리한 짧은 소리 (특정 나라 음악을 흉내 내지 않는다)
  arrive_ch1: { notes: [[1047, 0, 0.16, 'triangle', 0.12], [1319, 0.15, 0.16, 'triangle', 0.12], [1568, 0.3, 0.3, 'triangle', 0.12]] },
  arrive_ch2: { notes: [[392, 0, 0.5, 'sine', 0.16], [523, 0.32, 0.6, 'sine', 0.14]] },
  arrive_ch3: { notes: [[587, 0, 0.08, 'triangle'], [740, 0.09, 0.08, 'triangle'], [880, 0.18, 0.08, 'triangle'], [740, 0.27, 0.14, 'triangle']] },
  arrive_ch4: { notes: [[659, 0, 0.18, 'sine'], [784, 0.17, 0.18, 'sine'], [988, 0.34, 0.34, 'sine']] },
  arrive_ch5: { notes: [[880, 0, 0.16, 'triangle'], [784, 0.15, 0.16, 'triangle'], [1047, 0.3, 0.32, 'triangle']] },
  arrive_ch6: { notes: [[523, 0, 0.1, 'square', 0.06], [659, 0.1, 0.1, 'square', 0.06], [784, 0.2, 0.1, 'square', 0.06], [1047, 0.3, 0.26, 'square', 0.06]] },
  arrive_ch7: { notes: [[392, 0, 0.16, 'sine'], [523, 0.15, 0.16, 'sine'], [659, 0.3, 0.16, 'sine'], [784, 0.45, 0.4, 'sine']] },
};

function note(freq, start, dur, type, level = 0.18, to = null) {
  const at = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, at + dur);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(level, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

export function sfx(name) {
  if (!state.settings.sound || !ctx || ctx.state !== 'running') return;
  const t = TONES[name];
  if (!t) return;
  try {
    if (Array.isArray(t)) { const [freq, dur, type, to] = t; note(freq, 0, dur, type, 0.18, to); return; }
    for (const [freq, start, dur, type, level, to] of t.notes) note(freq, start, dur, type, level ?? 0.16, to);
  } catch { /* 소리가 안 나도 게임은 계속 */ }
}

export function vibrate(name) {
  if (!state.settings.vibrate || !platform.can.vibrate) return;
  rawVibrate(UI.vibrate[name] ?? name);
}
