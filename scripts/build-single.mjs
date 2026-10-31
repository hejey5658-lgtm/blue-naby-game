// 한 파일 버전 만들기 (web-release 12절). 사용법: npm run build:single
//   release/blue_butterfly_game.html  — 게임 전체(코드·그림·글꼴)가 든 HTML 한 장. 인터넷 없이 파일로 열어도 된다.
//   release/eunyoug_3st_index.html    — 게임장 첫 화면. 게임 HTML을 base64 글자로 품고 있다가
//                                       [블루나비의 세계여행 이동하기]를 누르면 iframe(srcdoc)으로 띄운다(옆 파일을 찾지 않아 404가 안 남).
// 먼저 `vite build --mode single`이 dist-single/ 에 코드 한 덩어리를 만들어 둔다(package.json 의 build:single).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { ASSETS } = await import(pathToFileURL(path.resolve('src/data/assets.js')).href);
const { VERSION } = await import(pathToFileURL(path.resolve('src/data/version.js')).href);

const MIME = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', woff2: 'font/woff2' };
const dataUri = (file) => {
  const ext = path.extname(file).slice(1).toLowerCase();
  const buf = fs.readFileSync(file);
  return ext === 'svg'
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buf.toString('utf8'))}`
    : `data:${MIME[ext]};base64,${buf.toString('base64')}`;
};
// <script> 안에 넣을 글자: 중간에 </script> 가 있으면 HTML이 거기서 끊기므로 바꿔 둔다
const scriptSafe = (s) => s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

let html = fs.readFileSync('dist-single/index.html', 'utf8');

// 글꼴·아이콘: 파일 주소 대신 data URI. 미리 받기(preload)·홈 화면 아이콘은 파일 버전에 필요 없음.
html = html
  .replace(/\s*<link rel="preload"[^>]*>/g, '')
  .replace(/\s*<link rel="apple-touch-icon"[^>]*>/g, '')
  .replace(/\s*<link rel="icon" href="\/icons\/favicon-32\.png"[^>]*>/g, '')
  .replace('href="/icons/favicon.svg"', `href="${dataUri('public/icons/favicon.svg')}"`)
  .replace(/url\('\/fonts\/([\w-]+\.woff2)'\)/g, (_, f) => `url('${dataUri(`public/fonts/${f}`)}')`);

// 그림: window.BB_FILES = { 'assets/char/…png': 'data:…' } (PreloadScene 의 assetUrl 이 먼저 찾는다)
const files = {};
for (const a of ASSETS) {
  const full = path.join('public', a.file);
  if (fs.existsSync(full)) files[a.file] = dataUri(full);
}

// 코드: <script type="module" src="./assets/index-….js"> → 안에 직접
const m = html.match(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/);
if (!m) throw new Error('dist-single/index.html 에서 게임 코드 스크립트를 찾지 못했어요. 먼저 vite build --mode single');
const code = fs.readFileSync(path.join('dist-single', m[1]), 'utf8');
html = html.replace(m[0], () => '');
html = html.replace('</body>', () => `<script>window.BB_FILES=${scriptSafe(JSON.stringify(files))};</script>
<script type="module">${scriptSafe(code)}</script>
</body>`);
if (/(?:src|href)="\/(?!\/)/.test(html)) console.warn('⚠ 아직 파일 주소(/…)가 남아 있어요:', html.match(/(?:src|href)="\/[^"]*"/g));

fs.mkdirSync('release', { recursive: true });
fs.writeFileSync('release/blue_butterfly_game.html', html);

// ── 게임장 ──────────────────────────────────────────
// 게임 머리에 BB_EMBED 를 넣어 [← 게임장] 버튼이 첫 화면으로 돌아오게 한다(postMessage bb-close).
const embedded = html.replace('<head>', '<head>\n<script>window.BB_EMBED = true;</script>');
const b64 = Buffer.from(embedded, 'utf8').toString('base64');
const icon = dataUri('public/icons/icon-192.png');

const hub = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#e9d8b4">
<title>게임장</title>
<link rel="icon" href="${dataUri('public/icons/favicon.svg')}" type="image/svg+xml">
<style>
  @font-face { font-family: 'Jua'; src: url('${dataUri('public/fonts/Jua-subset.woff2')}') format('woff2'); }
  html, body { margin: 0; height: 100%; background: #e9d8b4; color: #2b2d5a; font: 18px/1.6 'Jua', system-ui, sans-serif; word-break: keep-all; }
  body.playing { overflow: hidden; overscroll-behavior: none; }
  main { min-height: 100%; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px;
    padding: max(16px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom)); text-align: center; }
  h1 { font-size: 34px; margin: 0; }
  .card { width: 100%; max-width: 420px; box-sizing: border-box; background: #fffaf0; border: 6px solid #b98a5e; border-radius: 28px; padding: 22px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .card img { width: 120px; height: 120px; border-radius: 28px; }
  .card p { margin: 0; font-size: 17px; color: #5a5c88; }
  button { width: 100%; min-height: 64px; padding: 8px 12px; border: 0; border-radius: 22px; font: 22px 'Jua', system-ui, sans-serif; color: #fff; background: #2f7bff; box-shadow: 0 5px 0 #1f5fd6; cursor: pointer; }
  button:active { transform: translateY(3px); box-shadow: 0 2px 0 #1f5fd6; }
  button:focus-visible { outline: 3px solid #2b2d5a; outline-offset: 3px; }
  .ver { font-size: 14px; opacity: .6; }
  #wait { display: none; }
  #frame { position: fixed; inset: 0; width: 100%; height: 100%; border: 0; background: #e9d8b4; z-index: 5; }
</style>
</head>
<body>
<main>
  <h1>게임장</h1>
  <div class="card">
    <img src="${icon}" alt="">
    <strong style="font-size:26px">블루나비의 세계여행</strong>
    <p>파란 애벌레 블루나비가 한국에서 캐나다까지 여행하며 나비가 되는 모험</p>
    <button id="go" type="button">블루나비의 세계여행 이동하기</button>
    <p id="wait">여는 중이에요…</p>
  </div>
  <p class="ver">v${VERSION} · 인터넷 없이도 돼요</p>
</main>
<script type="text/plain" id="bb-game">${b64}</script>
<script>
(function () {
  var frame = null, html = null;
  function decode() {
    if (html) return html;
    var bin = atob(document.getElementById('bb-game').textContent.trim());
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    html = new TextDecoder('utf-8').decode(bytes);
    return html;
  }
  function open() {
    if (frame) return;
    document.getElementById('wait').style.display = 'block';
    setTimeout(function () {
      frame = document.createElement('iframe');
      frame.id = 'frame';
      frame.title = '블루나비의 세계여행';
      frame.setAttribute('allow', 'fullscreen; clipboard-read; clipboard-write; autoplay');
      frame.srcdoc = decode();
      document.body.appendChild(frame);
      document.body.classList.add('playing');
      document.getElementById('wait').style.display = 'none';
      try { history.pushState({ bb: 1 }, ''); } catch (e) {}
      frame.focus();
    }, 30);
  }
  function close() {
    if (!frame) return;
    frame.remove();
    frame = null;
    document.body.classList.remove('playing');
    document.getElementById('go').focus();
  }
  document.getElementById('go').addEventListener('click', open);
  // 폰 뒤로 가기 = 게임 닫기
  window.addEventListener('popstate', close);
  // 게임 안 [← 게임장]
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'bb-close' || !frame || e.source !== frame.contentWindow) return;
    if (history.state && history.state.bb) history.back(); else close();
  });
})();
</script>
</body>
</html>
`;
fs.writeFileSync('release/eunyoug_3st_index.html', hub);
const mb = (f) => (fs.statSync(f).size / 1048576).toFixed(1);
console.log(`release/blue_butterfly_game.html ${mb('release/blue_butterfly_game.html')}MB · release/eunyoug_3st_index.html ${mb('release/eunyoug_3st_index.html')}MB (v${VERSION})`);
