// 2탄 주인공 포포(아기 강아지) 그림(SVG). 200×200 단위, 1탄 블루나비와 같은 그림체:
// 둥근 모양, 외곽선 #2b2d5a 6, 왼쪽 위가 밝은 방사형 그라데이션, 흰 하이라이트, 바닥 그림자, 같은 눈·볼터치.
// 하얀 털 + 귀 끝만 연한 갈색, 파란 목걸이(블루나비 친구 표시). 계절 옷: spring 꽃 모자 · summer 튜브 · autumn 목도리 · winter 털모자.
import { grad, commonDefs, shadow, shine, eye } from './blue.mjs';

const LINE = 6;

function muzzleMouth(x, y, mood, P) {
  if (mood === 'joy') {
    return `<path d="M${x - 10} ${y} Q${x} ${y + 16} ${x + 10} ${y} Z" fill="${P.ink}"/>
      <path d="M${x - 6} ${y + 7} Q${x} ${y + 3} ${x + 6} ${y + 7} Q${x} ${y + 12} ${x - 6} ${y + 7} Z" fill="#ff7f9c"/>`;
  }
  if (mood === 'surprise') return `<ellipse cx="${x}" cy="${y + 5}" rx="5" ry="6" fill="${P.ink}"/>`;
  if (mood === 'sad') return `<path d="M${x - 8} ${y + 7} Q${x} ${y} ${x + 8} ${y + 7}" fill="none" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round"/>`;
  // 강아지 입: ω
  return `<path d="M${x - 11} ${y + 1} Q${x - 5.5} ${y + 9} ${x} ${y + 1} Q${x + 5.5} ${y + 9} ${x + 11} ${y + 1}" fill="none" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function popo(P, mood = 'normal', outfit = 'base', o = {}) {
  const C = P.popo;
  const wag = o.wag ?? 0;
  // 늘어진 귀: 머리 옆에 붙어 내려오고, 위는 하얗고 끝으로 갈수록 연한 갈색
  const ear = (dir) => {
    const x = 100 + dir * 54;
    const r = dir * (6 + (o.ear ?? 0));
    return `<g transform="rotate(${r} ${100 + dir * 44} 46)">
      <path d="M${x - dir * 12} 44 C ${x + dir * 10} 38, ${x + dir * 20} 78, ${x + dir * 12} 100 C ${x + dir * 6} 116, ${x - dir * 10} 116, ${x - dir * 12} 98 C ${x - dir * 14} 80, ${x - dir * 16} 60, ${x - dir * 12} 44 Z" fill="url(#popoEarL)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/></g>`;
  };
  const paw = (x) => `<ellipse cx="${x}" cy="176" rx="15" ry="10" fill="url(#popoFur)" stroke="${P.ink}" stroke-width="4.5"/>
    <path d="M${x - 5} 172 v6 M${x + 5} 172 v6" stroke="${C.furShade}" stroke-width="2.4" stroke-linecap="round"/>`;
  let back = '';
  let front = '';
  if (outfit === 'summer') {
    // 물놀이 튜브: 몸통을 감싼 줄무늬 고리 (뒤쪽 반은 몸 뒤, 앞쪽 반은 몸 앞)
    const S = C.summer;
    const top = 'M36 150 A64 20 0 0 1 164 150', bot = 'M36 150 A64 20 0 0 0 164 150';
    const ring = (d) => `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="30" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="${S.tube}" stroke-width="18" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="${S.tube2}" stroke-width="18" stroke-dasharray="12 26"/>`;
    back = ring(top);
    front = `${ring(bot)}<path d="M52 162 Q76 172 100 173" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`;
  }
  const scarf = outfit === 'autumn' ? (() => {
    const A = C.autumn;
    return `<path d="M60 126 Q100 146 140 126 L142 140 Q100 160 58 140 Z" fill="${A.scarf}" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <path d="M78 136 l4 14 M100 142 l0 14 M122 136 l-4 14" stroke="${A.scarf2}" stroke-width="5" stroke-linecap="round"/>
      <path d="M124 138 L136 176 L118 178 L112 144 Z" fill="${A.scarf}" stroke="${P.ink}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M120 156 l12 -2 M123 166 l12 -2" stroke="${A.scarf2}" stroke-width="4" stroke-linecap="round"/>`;
  })() : `<path d="M66 132 Q100 148 134 132" fill="none" stroke="${C.collar}" stroke-width="9" stroke-linecap="round"/>
      <circle cx="100" cy="146" r="8" fill="${C.tag}" stroke="${P.ink}" stroke-width="3.5"/><circle cx="98" cy="144" r="2.2" fill="#fff"/>`;
  let hat = '';
  if (outfit === 'spring') {
    const S = C.spring;
    const fl = (x, y, r, c) => { let s = ''; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; s += `<circle cx="${x + Math.cos(a) * r}" cy="${y + Math.sin(a) * r}" r="${r * 0.78}" fill="${c}" stroke="${P.ink}" stroke-width="2.6"/>`; } return s + `<circle cx="${x}" cy="${y}" r="${r * 0.55}" fill="#fff6c8" stroke="${P.ink}" stroke-width="2.4"/>`; };
    hat = `<path d="M56 60 Q100 30 144 60" fill="none" stroke="${S.leaf}" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="70" cy="48" rx="9" ry="5" fill="${S.leaf}" stroke="${P.ink}" stroke-width="2.6" transform="rotate(-30 70 48)"/>
      ${fl(62, 58, 9, S.flower)}${fl(100, 38, 11, S.flower2)}${fl(138, 58, 9, S.flower)}${fl(82, 43, 7, S.flower)}${fl(119, 43, 7, S.flower2)}`;
  } else if (outfit === 'winter') {
    const W = C.winter;
    hat = `<path d="M52 66 Q56 18 100 16 Q144 18 148 66 Z" fill="${W.hat}" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <path d="M74 26 L80 60 M100 20 L100 60 M126 26 L120 60" stroke="${W.hatDeep}" stroke-width="3" opacity="0.6"/>
      <rect x="46" y="56" width="108" height="20" rx="10" fill="${W.band}" stroke="${P.ink}" stroke-width="5"/>
      <circle cx="100" cy="14" r="13" fill="${W.pom}" stroke="${P.ink}" stroke-width="5"/>
      ${shine(76, 34, 8, 4)}`;
  }
  const body = `
    ${shadow(100, 186, 70, P)}
    ${back}
    <g transform="rotate(${wag} 146 150)">
      <path d="M140 150 Q168 140 164 118 Q176 130 166 150 Q156 164 140 160 Z" fill="url(#popoFur)" stroke="${P.ink}" stroke-width="5" stroke-linejoin="round"/>
    </g>
    <ellipse cx="100" cy="152" rx="48" ry="34" fill="url(#popoFur)" stroke="${P.ink}" stroke-width="${LINE}"/>
    <ellipse cx="100" cy="160" rx="26" ry="16" fill="#fff" opacity="0.9"/>
    ${paw(80)}${paw(120)}
    ${front}
    <circle cx="100" cy="88" r="55" fill="url(#popoFur)" stroke="${P.ink}" stroke-width="${LINE}"/>
    ${shine(74, 56, 13, 8)}
    ${ear(-1)}${ear(1)}
    ${scarf}
    <ellipse cx="66" cy="106" rx="10" ry="6.5" fill="url(#cheek)"/>
    <ellipse cx="134" cy="106" rx="10" ry="6.5" fill="url(#cheek)"/>
    ${eye(80, 86, mood, P, -1)}
    ${eye(120, 86, mood, P, 1)}
    <ellipse cx="100" cy="112" rx="21" ry="14" fill="#fff" stroke="${C.furShade}" stroke-width="2"/>
    <path d="M91 103 Q100 99 109 103 Q108 111 100 113 Q92 111 91 103 Z" fill="${P.ink}"/>
    <ellipse cx="96.5" cy="104" rx="3" ry="1.8" fill="#fff" opacity="0.8"/>
    ${muzzleMouth(100, 114, mood, P)}
    ${hat}`;
  const defs = grad('popoFur', C.fur, C.furMid, C.furShade)
    + `<linearGradient id="popoEarL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.furMid}"/><stop offset="0.45" stop-color="${C.furMid}"/><stop offset="0.75" stop-color="${C.ear}"/><stop offset="1" stop-color="${C.earDeep}"/></linearGradient>`;
  return { defs, body };
}

export const OUTFITS = ['base', 'spring', 'summer', 'autumn', 'winter'];
export const OUTFIT_NAMES = { base: '기본 포포', spring: '봄 · 꽃 모자', summer: '여름 · 물놀이 튜브', autumn: '가을 · 줄무늬 목도리', winter: '겨울 · 털모자' };

export function popoSvg(P, outfit = 'base', mood = 'normal', pose = {}) {
  const { defs, body } = popo(P, mood, outfit, pose);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -6 200 206" width="200" height="206"><defs>${commonDefs(P)}${defs}</defs>${body}</svg>`;
}

export function popoFrame(P, outfit, pose = {}) {
  const { defs, body } = popo(P, pose.mood ?? 'normal', outfit, pose);
  const t = `translate(0 ${pose.dy ?? 0}) rotate(${pose.rot ?? 0} 100 150) translate(100 190) scale(${pose.sx ?? 1} ${pose.sy ?? 1}) translate(-100 -190)`;
  return { defs: commonDefs(P) + defs, body: `<g transform="${t}">${body}</g>` };
}
