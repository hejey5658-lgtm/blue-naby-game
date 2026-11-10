// 대사 음성 (2026-11-10 "해설은 빼고 음성으로 통일"): 모든 대사를 폰에 들어 있는 한국어 음성으로 읽는다(글도 함께).
// 말하는 이마다 목소리 높이·빠르기를 조금씩 달리한다(VOICE).
// 서버·파일 없음(브라우저 음성 합성). [소리] 설정이 꺼져 있거나 음성이 없는 브라우저(일부 인앱 등)는 조용히 글만.
// 아이폰 사파리는 첫 읽기가 손가락 터치 안에서 시작돼야 하므로, 첫 터치 때 빈 말로 풀어 둔다(unlockSpeech).
import { platform } from '../platform.js';
import { state } from '../state.js';
import { duckMusic } from './music.js';

let voices = [];
const loadVoices = () => {
  try { voices = window.speechSynthesis.getVoices().filter((v) => /^ko/i.test(v.lang)); } catch { voices = []; }
};
if (platform.can.speech) {
  loadVoices();
  try { window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices); } catch { /* 무시 */ }
}

// 자연스러운 한국어 목소리 먼저 (아이폰 '유나', 안드로이드·크롬 구글 한국어 등)
function pickVoice() {
  if (!voices.length) loadVoices();
  const score = (v) => (/yuna|유나/i.test(v.name) ? 4 : 0) + (/google|siri|enhanced|premium|natural/i.test(v.name) ? 2 : 0) + (v.localService ? 1 : 0);
  return [...voices].sort((a, b) => score(b) - score(a))[0] ?? null;
}

let unlocked = false;
export function unlockSpeech() {
  if (unlocked || !platform.can.speech) return;
  unlocked = true;
  try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; window.speechSynthesis.speak(u); } catch { /* 무시 */ }
}

// 말하는 이별 목소리 (pitch 0~2, rate 0.1~10). 없는 이(친구들)는 friend.
const VOICE = {
  guide: { pitch: 1.0, rate: 1.0 },
  blue: { pitch: 1.35, rate: 1.02 },
  bluenabi: { pitch: 1.3, rate: 1.0 },
  dot: { pitch: 0.85, rate: 0.95 },
  flower: { pitch: 1.1, rate: 0.88 },
  friend: { pitch: 1.18, rate: 1.0 },
};

// 읽을 글 다듬기: 괄호·말줄임·물결은 소리 내지 않는다
const clean = (t) => String(t).replace(/[()~]/g, '').replace(/…+/g, ', ').replace(/\n/g, ' ');

// 읽기 시작. 읽으면 true (화면에 스피커 표시), 못 읽으면 false. who = 말하는 이(speaker 키)
export function speak(text, onEnd, who = 'guide') {
  if (!platform.can.speech || !state.settings.sound) return false;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean(text));
    u.lang = 'ko-KR';
    const v = pickVoice();
    if (v) u.voice = v;
    const vo = VOICE[who] ?? VOICE.friend;
    u.rate = vo.rate;
    u.pitch = vo.pitch;
    const done = () => { duckMusic(false); onEnd?.(); };
    u.onend = done;
    u.onerror = done;
    duckMusic(true);
    window.speechSynthesis.speak(u);
    return true;
  } catch { duckMusic(false); return false; }
}

export function stopSpeaking() {
  try { if (platform.can.speech) window.speechSynthesis.cancel(); } catch { /* 무시 */ }
  duckMusic(false);
}
