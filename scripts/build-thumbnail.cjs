// 게임 썸네일·카카오톡 미리보기 그림 만들기 (2026-11-10): art/thumbnail/thumbnail.html 을 브라우저로 찍는다.
//   docs/presentation/thumbnail.png (1920×1080) · thumbnail-1280.png (1280×720) — 게임 주소 + QR
//   docs/presentation/thumbnail-tall.png·.jpg (1080×2340, 9:19.5 세로, 약 1MB) — 실제 게임 입구 화면 + 게임 이름·주소·만든 사람
//     (바탕 art/thumbnail/entry_clean.png = 게임 입구 화면을 글자·버튼 숨기고 찍은 것)
//   docs/presentation/thumbnail-tall-2.png·.jpg — 같은 세로 썸네일, 게임명 "블루나비와 포포의 여행" (art/thumbnail/thumbnail-tall-2.html)
//   public/og-image-v4.png (1200×630) — 카카오톡·SNS 링크 미리보기 (2026-11-10~ 세로 썸네일과 같은 모습: 게임 입구 가로 화면 + 게임명·주소·만든 사람)
//     (원본 art/thumbnail/og.html, 바탕 entry_land.png = 가로 입구 화면에서 글자·카드·버튼 숨김)
// 실행: node scripts/build-thumbnail.cjs  (Playwright 크로미움 필요)
const path = require('path');
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const page = 'file://' + path.join(root, 'art/thumbnail/thumbnail.html');
(async () => {
  const b = await chromium.launch();
  const shot = async (hash, w, h, scale, out) => {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
    await p.goto(page + hash);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(root, out) });
    await p.close();
  };
  await shot('', 1280, 720, 1.5, 'docs/presentation/thumbnail.png');
  await shot('', 1280, 720, 1, 'docs/presentation/thumbnail-1280.png');
  {
    const p = await b.newPage({ viewport: { width: 1372, height: 720 } });
    await p.goto('file://' + path.join(root, 'art/thumbnail/og.html'));
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(root, 'public/og-image-v4.png') });
    await p.close();
  }
  const shotTall = async (src = 'thumbnail-tall', out = 'thumbnail-tall') => {
    const p = await b.newPage({ viewport: { width: 1080, height: 2340 } });
    await p.goto('file://' + path.join(root, `art/thumbnail/${src}.html`));
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(root, `docs/presentation/${out}.png`) });
    await p.close();
  };
  await shotTall();
  await shotTall('thumbnail-tall-2', 'thumbnail-tall-2');
  await b.close();
  // og 는 1200×630 으로 줄이고, 모두 용량 줄이기
  execFileSync('python3', ['-c', `
from PIL import Image
im=Image.open('public/og-image-v4.png').convert('RGB').resize((1200,630),Image.LANCZOS); im.save('public/og-image-v4.png',optimize=True)
for n in ['thumbnail-tall','thumbnail-tall-2']:
  Image.open('docs/presentation/'+n+'.png').convert('RGB').save('docs/presentation/'+n+'.jpg',quality=92,optimize=True)
for f in ['docs/presentation/thumbnail.png','docs/presentation/thumbnail-1280.png','docs/presentation/thumbnail-tall.png','docs/presentation/thumbnail-tall-2.png']:
  Image.open(f).convert('RGB').save(f,optimize=True)
`], { cwd: root, stdio: 'inherit' });
  console.log('썸네일: docs/presentation/thumbnail*.png, 공유 그림: public/og-image-v4.png');
})();
