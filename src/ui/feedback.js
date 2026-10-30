// 효과음·진동. 설정과 기기 지원 여부를 여기서 확인한다.
// 소리 파일이 생기기 전까지는 Web Audio로 짧은 '뿅' 소리를 직접 만든다.
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

const TONES = {
  tap: [660, 0.05, 'triangle'],
  next: [520, 0.04, 'sine'],
  open: [440, 0.18, 'sine', 880],
  toggle: [740, 0.05, 'triangle'],
};

export function sfx(name) {
  if (!state.settings.sound || !ctx || ctx.state !== 'running') return;
  const t = TONES[name];
  if (!t) return;
  try {
    const [freq, dur, type, to] = t;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, now + dur);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  } catch { /* 소리가 안 나도 게임은 계속 */ }
}

export function vibrate(name) {
  if (!state.settings.vibrate || !platform.can.vibrate) return;
  rawVibrate(UI.vibrate[name] ?? name);
}
