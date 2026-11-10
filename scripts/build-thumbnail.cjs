// 게임 썸네일·카카오톡 미리보기 그림 만들기 (2026-11-10): art/thumbnail/thumbnail.html 을 브라우저로 찍는다.
//   docs/presentation/thumbnail.png (1920×1080) · thumbnail-1280.png (1280×720) — 게임 주소 + QR
//   public/og-image-v2.png (1200×630) — 카카오톡·SNS 링크 미리보기 (QR 없음, 카드를 톡 하면 게임으로)
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
  await shot('#og', 1280, 672, 1, 'public/og-image-v2.png');
  await b.close();
  // og 는 1200×630 으로 줄이고, 모두 용량 줄이기
  execFileSync('python3', ['-c', `
from PIL import Image
im=Image.open('public/og-image-v2.png').convert('RGB').resize((1200,630),Image.LANCZOS); im.save('public/og-image-v2.png',optimize=True)
for f in ['docs/presentation/thumbnail.png','docs/presentation/thumbnail-1280.png']:
  Image.open(f).convert('RGB').save(f,optimize=True)
`], { cwd: root, stdio: 'inherit' });
  console.log('썸네일: docs/presentation/thumbnail*.png, 공유 그림: public/og-image-v2.png');
})();
