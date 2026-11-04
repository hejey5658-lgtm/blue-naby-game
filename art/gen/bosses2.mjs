// 2탄 「포포의 사계절 서울」 친구(보스) 5명 그림(SVG). 1탄 보스와 같은 그림체·같은 얼굴 함수를 쓴다.
// 표정: angry(심술) · sad(시무룩) · happy(웃음) · skill(기술 쓰는 중) — 화난 표정도 볼이 부푼 정도까지만.
import { grad, face, blobC, blobE, shine, groundShadow, defs } from './bosses.mjs';

const LINE = 6;

const C2 = {
  magpie: { body: '#2f3350', light: '#4a5078', shade: '#1f2238', white: '#ffffff', wing: '#3f7fd6', beak: '#2b2d5a', flower: '#ffc2d6' },
  frog: { body: '#7cc56a', light: '#a8dd8f', shade: '#4f9f4c', belly: '#e8f6c8', ring: '#ff9f43' },
  hedgehog: { body: '#f0d9b5', light: '#fbecd2', shade: '#d9b98a', spike: '#a8673c', spikeLight: '#c98a5a', leaf: '#ffd84a' },
  snowman: { body: '#ffffff', light: '#ffffff', shade: '#d6e6f5', scarf: '#2f7bff', scarf2: '#8fc2ff', nose: '#f59a3b', twig: '#8f6440', hat: '#e8584a' },
  bear: { body: '#a8673c', light: '#c98a5a', shade: '#7a4532', muzzle: '#f0d2ad', muff: '#ff9fb8', band: '#e07a96' },
};

// ── 깍깍이: 까치 (검정·흰 배·파란 날개 끝), 봄 벚꽃 한 송이 ──
function kkakkak(P, mood) {
  const C = C2.magpie;
  const flap = mood === 'skill' ? -26 : mood === 'happy' ? -12 : 0;
  const wing = (d) => `<g transform="rotate(${d * flap} ${100 + d * 52} 118)">
      <path d="M${100 + d * 48} 100 Q${100 + d * 90} 116 ${100 + d * 78} 160 Q${100 + d * 60} 150 ${100 + d * 46} 140 Z" fill="${C.body}" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <path d="M${100 + d * 76} 140 Q${100 + d * 80} 152 ${100 + d * 76} 158" stroke="${C.wing}" stroke-width="7" stroke-linecap="round"/></g>`;
  return {
    defs: defs(P, grad('mgBody', C.light, C.body, C.shade)),
    body: `${groundShadow(P, 60)}
      <path d="M118 168 L150 186 L140 168 Z" fill="${C.body}" stroke="${P.ink}" stroke-width="5" stroke-linejoin="round"/>
      ${wing(-1)}${wing(1)}
      ${blobE(100, 112, 58, 66, 'url(#mgBody)', P)}
      <ellipse cx="100" cy="140" rx="34" ry="34" fill="${C.white}"/>
      ${shine(76, 72)}
      <path d="M92 186 v-10 M108 186 v-10" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="100" cy="98" rx="38" ry="26" fill="${C.white}" opacity="0.18"/>
      ${face(100, 90, mood, P, 38, 11, 42)}
      <path d="M92 106 L100 119 L108 106 Z" fill="${C.beak}" stroke="${P.ink}" stroke-width="3" stroke-linejoin="round"/>
      <g transform="translate(126 52)"><circle cx="0" cy="-8" r="7" fill="${C.flower}" stroke="${P.ink}" stroke-width="2.6"/><circle cx="8" cy="0" r="7" fill="${C.flower}" stroke="${P.ink}" stroke-width="2.6"/><circle cx="-8" cy="0" r="7" fill="${C.flower}" stroke="${P.ink}" stroke-width="2.6"/><circle cx="0" cy="8" r="7" fill="${C.flower}" stroke="${P.ink}" stroke-width="2.6"/><circle cx="0" cy="0" r="5" fill="#ffd84a" stroke="${P.ink}" stroke-width="2"/></g>`,
  };
}

// ── 개굴이: 청개구리 (둥근 초록, 배 연두, 머리 위 큰 눈, 주황 튜브 목걸이) ──
function gaegul(P, mood) {
  const C = C2.frog;
  const puff = mood === 'skill' ? 1.12 : 1;
  const eyeBump = (d) => blobC(100 + d * 30, 66, 24, 'url(#frBody)', P);
  return {
    defs: defs(P, grad('frBody', C.light, C.body, C.shade)),
    body: `${groundShadow(P, 72)}
      <ellipse cx="58" cy="180" rx="22" ry="10" fill="${C.body}" stroke="${P.ink}" stroke-width="5"/>
      <ellipse cx="142" cy="180" rx="22" ry="10" fill="${C.body}" stroke="${P.ink}" stroke-width="5"/>
      ${eyeBump(-1)}${eyeBump(1)}
      <g transform="translate(100 128) scale(${puff} 1) translate(-100 -128)">${blobE(100, 128, 70, 56, 'url(#frBody)', P)}</g>
      <ellipse cx="100" cy="148" rx="44" ry="30" fill="${C.belly}"/>
      ${shine(64, 96)}
      <path d="M50 150 Q100 176 150 150" fill="none" stroke="${C.ring}" stroke-width="9" stroke-linecap="round" opacity="0.95"/>
      ${face(100, 70, mood, P, 60, 12, 46)}`,
  };
}

// ── 밤톨이: 고슴도치 (밤송이 같은 등 가시, 머리에 은행잎 하나) ──
function bamtol(P, mood) {
  const C = C2.hedgehog;
  let spikes = '';
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * (0.92 + (i / 10) * 1.16);
    const x = 100 + Math.cos(a) * 68;
    const y = 118 + Math.sin(a) * 60;
    const tx = 100 + Math.cos(a) * (mood === 'skill' ? 100 : 92);
    const ty = 118 + Math.sin(a) * (mood === 'skill' ? 92 : 84);
    const nx = Math.cos(a + Math.PI / 2) * 13;
    const ny = Math.sin(a + Math.PI / 2) * 13;
    spikes += `<path d="M${x - nx} ${y - ny} L${tx} ${ty} L${x + nx} ${y + ny} Z" fill="${i % 2 ? C.spike : C.spikeLight}" stroke="${P.ink}" stroke-width="4.5" stroke-linejoin="round"/>`;
  }
  return {
    defs: defs(P, grad('hhBody', C.light, C.body, C.shade)),
    body: `${groundShadow(P, 74)}
      ${spikes}
      ${blobE(100, 124, 68, 60, 'url(#hhBody)', P)}
      ${shine(70, 92)}
      <ellipse cx="100" cy="136" rx="13" ry="9" fill="${P.ink}"/>
      <ellipse cx="96" cy="133" rx="4" ry="2.4" fill="#fff" opacity="0.8"/>
      ${face(100, 112, mood, P, 44, 11, 36)}
      <ellipse cx="76" cy="182" rx="14" ry="8" fill="${C.shade}" stroke="${P.ink}" stroke-width="4"/>
      <ellipse cx="124" cy="182" rx="14" ry="8" fill="${C.shade}" stroke="${P.ink}" stroke-width="4"/>
      <g transform="translate(132 50) rotate(20)">
        <path d="M0 18 L0 4" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M0 4 C -18 -2 -16 -22 0 -20 C 16 -22 18 -2 0 4 Z" fill="${C.leaf}" stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M0 2 L0 -14 M0 -6 L-8 -12 M0 -6 L8 -12" stroke="#e0a020" stroke-width="2"/></g>`,
  };
}

// ── 뭉치: 눈사람 (눈덩이 두 개, 파란 목도리, 당근 코, 나뭇가지 팔, 작은 빨간 모자) ──
function mungchi(P, mood) {
  const C = C2.snowman;
  const arm = (d) => `<path d="M${100 + d * 50} 140 L${100 + d * 84} ${mood === 'skill' ? 104 : 120} M${100 + d * 74} ${mood === 'skill' ? 112 : 124} L${100 + d * 82} ${mood === 'skill' ? 124 : 134}" fill="none" stroke="${C.twig}" stroke-width="6" stroke-linecap="round"/>`;
  return {
    defs: defs(P, grad('snBody', C.light, C.body, C.shade)),
    body: `${groundShadow(P, 70)}
      ${arm(-1)}${arm(1)}
      ${blobE(100, 148, 62, 42, 'url(#snBody)', P)}
      ${blobC(100, 90, 46, 'url(#snBody)', P)}
      ${shine(78, 66)}
      <circle cx="100" cy="146" r="5" fill="${P.ink}"/><circle cx="100" cy="166" r="5" fill="${P.ink}"/>
      <path d="M58 122 Q100 140 142 122 L144 134 Q100 152 56 134 Z" fill="${C.scarf}" stroke="${P.ink}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M126 132 L134 166 L118 166 L114 136 Z" fill="${C.scarf}" stroke="${P.ink}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M78 128 l3 10 M100 134 l0 10 M120 130 l-3 10" stroke="${C.scarf2}" stroke-width="4" stroke-linecap="round"/>
      ${face(100, 80, mood, P, 34, 10, 26)}
      <path d="M100 89 L122 94 L100 99 Z" fill="${C.nose}" stroke="${P.ink}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M78 50 Q80 28 100 26 Q120 28 122 50 Z" fill="${C.hat}" stroke="${P.ink}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="72" y="46" width="56" height="10" rx="5" fill="#fff" stroke="${P.ink}" stroke-width="4"/>`,
  };
}

// ── 곰실이: 아기 곰 (갈색, 분홍 귀마개, 눈 오는 날 졸린 겨울잠 곰) ──
function gomsil(P, mood) {
  const C = C2.bear;
  const ear = (d) => `${blobC(100 + d * 44, 54, 18, 'url(#brBody)', P)}<circle cx="${100 + d * 44}" cy="54" r="8" fill="${C.light}"/>`;
  const muff = (d) => `<circle cx="${100 + d * 56}" cy="88" r="17" fill="${C.muff}" stroke="${P.ink}" stroke-width="5"/><circle cx="${100 + d * 52}" cy="83" r="5" fill="#fff" opacity="0.7"/>`;
  return {
    defs: defs(P, grad('brBody', C.light, C.body, C.shade)),
    body: `${groundShadow(P, 70)}
      ${blobE(100, 152, 56, 38, 'url(#brBody)', P)}
      <ellipse cx="100" cy="158" rx="30" ry="22" fill="${C.muzzle}" opacity="0.8"/>
      <ellipse cx="66" cy="182" rx="16" ry="9" fill="${C.body}" stroke="${P.ink}" stroke-width="4.5"/>
      <ellipse cx="134" cy="182" rx="16" ry="9" fill="${C.body}" stroke="${P.ink}" stroke-width="4.5"/>
      ${ear(-1)}${ear(1)}
      ${blobC(100, 92, 52, 'url(#brBody)', P)}
      ${shine(76, 66)}
      <path d="M44 88 Q100 22 156 88" fill="none" stroke="${C.band}" stroke-width="8" stroke-linecap="round"/>
      ${muff(-1)}${muff(1)}
      <ellipse cx="100" cy="112" rx="22" ry="15" fill="${C.muzzle}" stroke="${P.ink}" stroke-width="3"/>
      <ellipse cx="100" cy="104" rx="8" ry="5.5" fill="${P.ink}"/>
      ${face(100, 88, mood, P, 42, 10, 26)}`,
  };
}

export const BOSSES2 = { kkakkak, gaegul, bamtol, mungchi, gomsil };
export const BOSS2_KEYS = Object.keys(BOSSES2);
export const BOSS2_FACE_BOX = { kkakkak: [24, 20, 152], gaegul: [20, 28, 160], bamtol: [16, 26, 168], mungchi: [32, 22, 136], gomsil: [26, 24, 148] };

export function boss2Frame(P, key, pose = {}) {
  const { defs: d, body } = BOSSES2[key](P, pose.mood ?? 'angry');
  const t = `translate(0 ${pose.dy ?? 0}) rotate(${pose.rot ?? 0} 100 150) translate(100 190) scale(${pose.sx ?? 1} ${pose.sy ?? 1}) translate(-100 -190)`;
  return { defs: d, body: `<g transform="${t}">${body}</g>` };
}
