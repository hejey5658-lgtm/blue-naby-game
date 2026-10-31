// 홈 화면 아이콘·파비콘·공유 미리보기 그림 만들기 (art-guide.md 11절). 사용법: npm run build:icons
// 원본: 나비 블루나비(캐릭터 시트 v1)를 하늘색 바탕 가운데에. 글자는 아이콘에 넣지 않는다(작으면 안 보임).
import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { blueFrame } from '../art/gen/blue.mjs';
import { npcFrame } from '../art/gen/bosses.mjs';

const P = JSON.parse(fs.readFileSync('art/palette.json', 'utf8'));
fs.mkdirSync('public/icons', { recursive: true });

// 아이콘 원본 1024: 하늘 그라데이션 + 블루나비 (maskable은 가운데 66% 안에)
function iconSvg(inner = 0.8, rounded = false) {
  const f = blueFrame(P, 'butterfly', { mood: 'joy' });
  const s = 1024 * inner;
  const o = (1024 - s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>${f.defs}<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#d6efff"/></linearGradient></defs>
  <rect width="1024" height="1024" rx="${rounded ? 220 : 0}" fill="url(#sky)"/>
  <circle cx="820" cy="210" r="90" fill="#ffe9a8"/>
  <ellipse cx="512" cy="1010" rx="620" ry="190" fill="#7cc56a"/>
  <svg x="${o}" y="${o - 20}" width="${s}" height="${s}" viewBox="-6 -10 212 212">${f.body}</svg>
</svg>`;
}
const png = (svg, size) => new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();

fs.writeFileSync('public/icons/icon-512.png', png(iconSvg(0.86), 512));
fs.writeFileSync('public/icons/icon-192.png', png(iconSvg(0.86), 192));
fs.writeFileSync('public/icons/icon-512-maskable.png', png(iconSvg(0.62), 512));
fs.writeFileSync('public/icons/apple-touch-icon-180.png', png(iconSvg(0.8), 180));
fs.writeFileSync('public/icons/favicon-32.png', png(iconSvg(0.98, true), 32));
fs.writeFileSync('public/icons/favicon.svg', iconSvg(0.98, true));

// 공유 미리보기 1200×630: 카카오톡 카드에서 가장자리가 잘려도 되게 블루나비·제목은 가운데 630×630 안에
const fl = npcFrame(P, 'flower', {});
const bf = blueFrame(P, 'butterfly', { mood: 'joy' });
let tulips = '';
const cols = ['#ff6b5b', '#ffd84a', '#ff9fb8', '#ffffff'];
for (let r = 0; r < 6; r++) for (let x = (r % 2) * 22; x < 1220; x += 44 + r * 6) tulips += `<ellipse cx="${x}" cy="${470 + r * r * 6 + r * 14}" rx="${8 + r * 2}" ry="${10 + r * 2.4}" fill="${cols[r % 4]}"/>`;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>${fl.defs}${bf.defs}<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fc3ff"/><stop offset="1" stop-color="#d6efff"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#sky)"/>
  ${Array.from({ length: 14 }, (_, i) => `<circle cx="${i * 92}" cy="${420 + (i % 3) * 10}" r="${70 + (i % 2) * 16}" fill="${['#c0563a', '#e8794f', '#d9643f', '#f0a04b'][i % 4]}"/>`).join('')}
  <rect y="440" width="1200" height="190" fill="#5fb84f"/>${tulips}
  <svg x="640" y="290" width="300" height="300" viewBox="-6 -10 212 212">${fl.body}</svg>
  <svg x="690" y="160" width="200" height="200" viewBox="-6 -10 212 212">${bf.body}</svg>
  <g font-family="Jua" text-anchor="middle">
    <text x="465" y="190" font-size="56" fill="#2f7bff" stroke="#ffffff" stroke-width="14" paint-order="stroke">블루나비의</text>
    <text x="465" y="280" font-size="92" fill="#2b2d5a" stroke="#ffffff" stroke-width="18" paint-order="stroke">세계여행</text>
    <text x="465" y="340" font-size="30" fill="#2b2d5a" stroke="#ffffff" stroke-width="10" paint-order="stroke">설치 없이 링크로 바로!</text>
  </g>
</svg>`;
fs.writeFileSync('public/og-image.png', new Resvg(og, { font: { fontFiles: ['art/fonts/Jua-og.ttf'], loadSystemFonts: false, defaultFontFamily: 'Jua' } }).render().asPng());
console.log('아이콘: public/icons/*, 공유 그림: public/og-image.png');
