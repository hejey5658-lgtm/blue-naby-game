// 브라우저·기기 판별과 기능 지원 여부. 게임 코드는 여기 결과만 쓴다.
// 모든 기능 호출은 can.* 로 확인하고 try/catch 로 감싼다(안 되는 기능 때문에 게임이 멈추지 않게).
const ua = navigator.userAgent || '';

const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(ua);
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const hasFinePointer = safe(() => matchMedia('(pointer: fine)').matches, false);

function detectInApp() {
  if (/KAKAOTALK/i.test(ua)) return 'kakao';
  if (/NAVER\(inapp/i.test(ua) || /NAVER/i.test(ua) && /inapp/i.test(ua)) return 'naver';
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/FBAN|FBAV/i.test(ua)) return 'facebook';
  return null;
}

function safe(fn, fallback) {
  try { return fn(); } catch { return fallback; }
}

const inApp = detectInApp();
const standalone = safe(() => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches, false)
  || navigator.standalone === true;
const inIframe = safe(() => window.self !== window.top, true);
// 파일로 열기(file:)와 게임장 안 iframe(srcdoc → about:)은 웹 주소가 아니다: 서비스 워커·홈 화면 설치를 끈다
const isFile = !/^https?:$/.test(location.protocol);

// 안드로이드 크롬·삼성 인터넷이 "설치할 수 있어요"라고 알려 주면 받아 둔다(설치 안내는 1장을 깬 뒤에 보여 줌).
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  platform.can.install = true;
});

export const platform = {
  isIOS,
  isAndroid,
  isTouch,
  hasFinePointer,
  inApp,
  standalone,
  inIframe,
  isFile,
  can: {
    vibrate: typeof navigator.vibrate === 'function' && !isIOS,
    // 아이폰은 전체 화면이 안 되고, 인앱 브라우저도 대부분 안 된다.
    fullscreen: !isIOS && !inApp && !!document.documentElement.requestFullscreen,
    share: typeof navigator.share === 'function',
    clipboard: !!(navigator.clipboard && navigator.clipboard.writeText),
    persist: !!(navigator.storage && navigator.storage.persist),
    install: false,
    storage: safe(() => {
      const k = '__bb_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    }, false),
  },
  get installPrompt() { return installPrompt; },
};

export function vibrate(pattern) {
  if (!platform.can.vibrate) return;
  safe(() => navigator.vibrate(pattern));
}

export function requestFullscreen() {
  if (!platform.can.fullscreen || document.fullscreenElement) return;
  safe(() => {
    const p = document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    if (p && p.then) {
      p.then(() => safe(() => screen.orientation.lock('portrait').catch(() => {})))
        .catch(() => {});
    }
  });
}
