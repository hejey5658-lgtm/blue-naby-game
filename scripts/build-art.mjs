// 벡터 그림(SVG)을 만들고 PNG로 굽는다. 사용법: npm run build:art
// - art/source/<키>.svg : 원본 (art/gen/*.mjs 가 art/palette.json 색으로 만든다)
// - art/out/<키>.png    : 확인용 PNG (승인 후 게임 규격 스프라이트 시트로 public/assets/ 에 넣는다)
// - art/preview.html    : 모든 그림을 밝은·어두운 바탕, 게임 크기·2배 크기로 한눈에 보기
import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { blueSvg, MOODS, FORM_NAMES } from '../art/gen/blue.mjs';

const P = JSON.parse(fs.readFileSync('art/palette.json', 'utf8'));
fs.mkdirSync('art/source', { recursive: true });
fs.mkdirSync('art/out', { recursive: true });

const items = [];
for (const form of Object.keys(FORM_NAMES)) {
  for (const mood of MOODS) {
    const key = mood === 'normal' ? `blue_${form}` : `blue_${form}_${mood}`;
    const svg = blueSvg(P, form, mood);
    fs.writeFileSync(`art/source/${key}.svg`, svg);
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: 256 } }).render().asPng();
    fs.writeFileSync(`art/out/${key}.png`, png);
    items.push({ key, form, mood });
  }
}

const MOOD_NAMES = { normal: '기본', joy: '기쁨', surprise: '놀람', sleepy: '졸림', sad: '시무룩' };
const rows = Object.keys(FORM_NAMES).map((form) => {
  const hero = `<figure class="hero"><img src="source/blue_${form}.svg" width="240" height="240" alt=""><figcaption>${FORM_NAMES[form]}</figcaption></figure>`;
  const moods = MOODS.filter((m) => m !== 'normal').map((m) =>
    `<figure><img src="source/blue_${form}_${m}.svg" width="120" height="120" alt=""><figcaption>${MOOD_NAMES[m]}</figcaption></figure>`).join('');
  const sizes = `<figure class="sizes"><div><img src="source/blue_${form}.svg" width="64" height="64" alt=""><img src="source/blue_${form}.svg" width="32" height="32" alt=""></div><figcaption>미로 크기 64 · 32</figcaption></figure>`;
  return `<section><div class="light">${hero}${moods}${sizes}</div><div class="dark"><img src="source/blue_${form}.svg" width="120" height="120" alt=""><span>밤 바탕</span></div></section>`;
}).join('\n');

fs.writeFileSync('art/preview.html', `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>블루나비 캐릭터 시트</title>
<style>
  @font-face { font-family: 'Jua'; src: url('../public/fonts/Jua-subset.woff2') format('woff2'); }
  @font-face { font-family: 'Gowun Dodum'; src: url('../public/fonts/GowunDodum-subset.woff2') format('woff2'); }
  body { margin: 0; padding: 28px; background: #f3e3c3; color: #2b2d5a; font-family: 'Gowun Dodum', sans-serif; }
  h1 { font: 44px 'Jua', sans-serif; margin: 0 0 4px; }
  p { margin: 0 0 20px; }
  section { display: flex; gap: 16px; margin-bottom: 16px; }
  .light { flex: 1; display: flex; align-items: flex-end; gap: 14px; background: #fffaf0; border-radius: 28px; padding: 18px 22px; }
  .dark { width: 170px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background: #23254d; color: #ffe9a8; border-radius: 28px; }
  figure { margin: 0; text-align: center; }
  figcaption { font-size: 18px; margin-top: 4px; }
  .hero figcaption { font: 30px 'Jua', sans-serif; }
  .sizes div { display: flex; align-items: flex-end; gap: 10px; height: 120px; }
</style></head><body>
<h1>블루나비 캐릭터 시트</h1>
<p>애벌레 → 나방 → 나비. 얼굴(눈·볼·입)은 세 모습이 같은 모양을 써서 진화해도 같은 블루나비로 보이게 했어요.</p>
${rows}
</body></html>
`);
console.log(`그림 ${items.length}장: art/source/*.svg, art/out/*.png, art/preview.html`);
