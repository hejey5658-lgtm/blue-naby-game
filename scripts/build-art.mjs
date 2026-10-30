// 벡터 그림(SVG)을 만들고 PNG로 굽는다. 사용법: npm run build:art
// - art/source/<키>.svg : 원본 (art/gen/*.mjs 가 art/palette.json 색으로 만든다)
// - art/out/<키>.png    : 확인용 PNG (승인 후 게임 규격 스프라이트 시트로 public/assets/ 에 넣는다)
// - art/preview.html    : 모든 그림을 밝은·어두운 바탕, 게임 크기·2배 크기로 한눈에 보기
import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { blueSvg, blueFrame, MOODS, FORM_NAMES, MAZE_POSES, BATTLE_POSES, FACE_MOODS, FACE_BOX } from '../art/gen/blue.mjs';

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

// ── 게임용 스프라이트 시트 (승인된 그림만, public/assets/) ──────────────
// 칸을 가로로 이어 붙인 한 장. 칸마다 여백 4px 이상(200 단위 그림이 칸 안에 들어가게 살짝 줄여 그림).
function sheet(frames, cell, box = [0, 0, 200]) {
  const [bx, by, bs] = box;
  const pad = bs * 0.04;
  // 칸 밖으로 넘친 부분이 옆 칸에 보이지 않게 칸마다 잘라 낸다
  const inner = frames.map((f, i) => `<clipPath id="cell${i}"><rect x="${i * cell}" y="0" width="${cell}" height="${cell}"/></clipPath>
    <g clip-path="url(#cell${i})"><svg x="${i * cell}" y="0" width="${cell}" height="${cell}" viewBox="${bx - pad} ${by - pad} ${bs + pad * 2} ${bs + pad * 2}">
    <defs>${f.defs}</defs>${f.body}</svg></g>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cell * frames.length}" height="${cell}" viewBox="0 0 ${cell * frames.length} ${cell}">${inner}</svg>`;
  return new Resvg(svg, { fitTo: { mode: 'original' } }).render().asPng();
}
const write = (file, png) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, png); };
for (const form of Object.keys(FORM_NAMES)) {
  write(`public/assets/char/blue_${form}.png`, sheet(MAZE_POSES[form].map((p) => blueFrame(P, form, p)), 128, [-2, -8, 204]));
  write(`public/assets/char/blue_${form}_battle.png`, sheet(BATTLE_POSES.map((p) => blueFrame(P, form, p)), 480, [-6, -16, 212]));
  write(`public/assets/face/face_blue_${form}.png`, sheet(FACE_MOODS.map((mood) => blueFrame(P, form, { mood })), 280, FACE_BOX[form]));
}
console.log('게임용 시트: public/assets/char/blue_*.png, public/assets/face/face_blue_*.png');

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
