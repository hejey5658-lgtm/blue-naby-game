// 7단계 친구 테스트용 도우미: 홈 화면 설치 안내, 카카오톡 등 인앱 브라우저 안내, 의견 보내기 (web-release 3·5·7절)
import { platform } from '../platform.js';
import { state } from '../state.js';
import { VERSION } from '../data/version.js';
import { CHAPTERS } from '../data/chapters.js';
import { openBox } from './htmlBox.js';

// ── 홈 화면 설치 ──
export function canOfferInstall() {
  return !platform.standalone && !platform.inApp && !platform.isFile;
}

export function offerInstall() {
  const prompt = platform.installPrompt;
  if (prompt) {
    try { prompt.prompt(); prompt.userChoice?.finally?.(() => {}); return; } catch { /* 아래 안내로 */ }
  }
  const ios = platform.isIOS;
  openBox({
    title: '홈 화면에 블루나비 데려가기',
    text: ios
      ? '사파리 아래쪽 [공유] 버튼 → [홈 화면에 추가]를 눌러 주세요. 아이폰은 홈 화면 앱과 사파리의 기록이 따로라서, 먼저 저장 코드를 복사해 두면 홈 화면 앱에서 이어서 할 수 있어요.'
      : '브라우저 오른쪽 위 메뉴(점 세 개) → [홈 화면에 추가] 또는 [앱 설치]를 눌러 주세요. 주소창 없이 꽉 찬 화면으로 할 수 있어요.',
    value: ios ? '' : location.origin,
    readonly: true,
    buttons: ios
      ? [{ label: '저장 코드 복사', onClick: async (b) => {
          const { makeSaveCode } = await import('../saveCode.js');
          const code = makeSaveCode();
          b.textarea.value = code;
          try { await navigator.clipboard.writeText(code); b.say('복사했어요! 홈 화면 앱의 설정 → 저장 코드 넣기에 붙여 넣으세요.'); } catch { b.textarea.select(); b.say('글자를 길게 눌러 복사해 주세요', true); }
        } }, { label: '닫기', sub: true, onClick: (b) => b.close() }]
      : [{ label: '알겠어요', onClick: (b) => b.close() }],
  });
}

// ── 인앱 브라우저 (카카오톡 등) ──
export function shouldShowInAppBand() {
  if (!platform.inApp) return false;
  try { return localStorage.getItem('bb.inappBandClosed') !== '1'; } catch { return true; }
}
export function closeInAppBand() {
  try { localStorage.setItem('bb.inappBandClosed', '1'); } catch { /* 저장 막힘 */ }
}
export function openInBrowser() {
  const url = location.href.split('#')[0];
  if (platform.inApp === 'kakao') {
    // 카카오톡이 제공하는 "다른 브라우저로 열기" 주소. 안 되면 아래 안내를 보여 준다.
    location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
    setTimeout(() => showMenuHelp(url), 1200);
    return;
  }
  showMenuHelp(url);
}
function showMenuHelp(url) {
  if (document.hidden) return; // 외부 브라우저로 넘어갔으면 안내 필요 없음
  openBox({
    title: '다른 브라우저로 열기',
    text: '오른쪽 위(또는 아래) 메뉴 → [다른 브라우저로 열기]를 눌러 주세요. 안 되면 아래 주소를 복사해서 크롬이나 삼성 인터넷에 붙여 넣으세요.',
    value: url,
    readonly: true,
    buttons: [
      { label: '주소 복사', onClick: async (b) => { try { await navigator.clipboard.writeText(url); b.say('복사했어요!'); } catch { b.textarea.select(); b.say('글자를 길게 눌러 복사해 주세요', true); } } },
      { label: '닫기', sub: true, onClick: (b) => b.close() },
    ],
  });
}

// ── 의견 보내기: 버전·어디까지·기기가 채워진 글을 공유 창(카카오톡)으로. 서버로 보내지 않는다 ──
function deviceLabel() {
  const ua = navigator.userAgent;
  const dev = platform.isIOS ? '아이폰' : platform.isAndroid ? (/SM-|Samsung/i.test(ua) ? '갤럭시' : '안드로이드') : 'PC';
  let br = '브라우저';
  if (platform.inApp === 'kakao') br = '카카오톡 브라우저';
  else if (platform.inApp) br = `${platform.inApp} 앱 브라우저`;
  else if (platform.standalone) br = '홈 화면 앱';
  else if (/SamsungBrowser/i.test(ua)) br = '삼성 인터넷';
  else if (/CriOS|Chrome/i.test(ua)) br = '크롬';
  else if (/Safari/i.test(ua)) br = '사파리';
  return `${dev} · ${br}`;
}

export async function sendFeedback() {
  const ch = CHAPTERS.find((c) => c.id === (state.playing ?? `ch${state.chapter}`)) ?? CHAPTERS[0];
  const where = state.cleared ? '엔딩까지 봄' : `${ch.id.slice(2)}장 ${ch.place}`;
  const text = `[블루나비 의견] 버전 ${VERSION} / ${where} / ${deviceLabel()}\n재밌었던 점: \n어려웠던 점: \n이상했던 점: \n`;
  try {
    if (platform.can.share) { await navigator.share({ title: '블루나비 의견', text }); return; }
  } catch (e) { if (e?.name === 'AbortError') return; }
  openBox({
    title: '의견 보내기',
    text: '아래 글을 복사해서 카카오톡으로 만든 사람에게 보내 주세요. 고마워요!',
    value: text,
    buttons: [
      { label: '복사하기', onClick: async (b) => { try { await navigator.clipboard.writeText(b.value()); b.say('복사했어요!'); } catch { b.textarea.select(); b.say('글자를 길게 눌러 복사해 주세요', true); } } },
      { label: '닫기', sub: true, onClick: (b) => b.close() },
    ],
  });
}

