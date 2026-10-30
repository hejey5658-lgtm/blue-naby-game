// 보스 그림(SVG). 블루나비 캐릭터 시트 v1과 같은 그림체: 200×200 단위, 외곽선 6, 왼쪽 위가 밝은 방사형 그라데이션,
// 흰 하이라이트, 바닥 그림자, 볼터치. 화난 표정도 볼이 부푼 정도까지만(art-guide.md 3절).
// 표정: angry(화남) · sad(시무룩) · happy(웃음) · skill(기술 쓰는 중)

const LINE = 6;

function grad(id, light, mid, dark) {
  return `<radialGradient id="${id}" cx="35%" cy="30%" r="75%">
    <stop offset="0" stop-color="${light}"/><stop offset="0.55" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/>
  </radialGradient>`;
}

const cheekDef = (P) => `<radialGradient id="bcheek" cx="50%" cy="50%" r="50%">
  <stop offset="0" stop-color="${P.cheek}" stop-opacity="0.95"/><stop offset="1" stop-color="${P.cheek}" stop-opacity="0"/></radialGradient>`;

// 졸린 눈(먼지몽의 특징): 흰자 위를 몸 색 눈꺼풀이 반쯤 덮는다
function sleepyEye(x, y, mood, P, side, lidColor) {
  if (mood === 'happy') {
    return `<path d="M${x - 11} ${y + 4} Q${x} ${y - 10} ${x + 11} ${y + 4}" fill="none" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>`;
  }
  const lid = mood === 'skill' ? 0.55 : mood === 'sad' ? 0.35 : 0.45;
  const brow = mood === 'angry' || mood === 'skill'
    // 화남: 눈썹 안쪽(가운데 쪽)이 내려감 / 시무룩: 안쪽이 올라감
    ? `<path d="M${x - 13 * side} ${y - 12} L${x + 12 * side} ${y - 21}" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round"/>`
    : mood === 'sad'
      ? `<path d="M${x - 12 * side} ${y - 21} L${x + 12 * side} ${y - 13}" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>`
      : '';
  const ry = 13;
  return `
    <ellipse cx="${x}" cy="${y}" rx="11" ry="${ry}" fill="#fff" stroke="${P.ink}" stroke-width="3.2"/>
    <ellipse cx="${x + side}" cy="${y + 3}" rx="7" ry="8.5" fill="${P.ink}"/>
    <circle cx="${x + side - 2.5}" cy="${y + 1}" r="2.6" fill="#fff"/>
    <rect x="${x - 13}" y="${y - ry - 2}" width="26" height="${ry * 2 * lid + 2}" fill="${lidColor}"/>
    <path d="M${x - 12} ${y - ry - 2 + ry * 2 * lid} L${x + 12} ${y - ry - 2 + ry * 2 * lid}" stroke="${P.ink}" stroke-width="3.6" stroke-linecap="round"/>
    ${brow}`;
}

function bossMouth(x, y, mood, P) {
  switch (mood) {
    case 'happy':
      return `<path d="M${x - 10} ${y - 2} Q${x} ${y + 14} ${x + 10} ${y - 2} Z" fill="${P.ink}"/>
        <path d="M${x - 5} ${y + 5} Q${x} ${y + 1} ${x + 5} ${y + 5} Q${x} ${y + 10} ${x - 5} ${y + 5} Z" fill="#ff7f9c"/>`;
    case 'skill':
      return `<ellipse cx="${x}" cy="${y + 4}" rx="6" ry="7" fill="${P.ink}"/>`;
    case 'sad':
      return `<path d="M${x - 8} ${y + 6} Q${x - 4} ${y} ${x} ${y + 4} Q${x + 4} ${y} ${x + 8} ${y + 6}" fill="none" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round"/>`;
    default: // angry: 삐죽
      return `<path d="M${x - 9} ${y + 6} Q${x} ${y - 2} ${x + 9} ${y + 6}" fill="none" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>`;
  }
}

// ── 먼지몽: 회색 솜뭉치, 졸린 눈 ─────────────────────
function dustmong(P, mood) {
  const D = P.dustmong;
  // 몽글몽글 솜털 혹들
  const bumps = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const r = 66 + (i % 2) * 6;
    bumps.push([100 + Math.cos(a) * r, 112 + Math.sin(a) * r * 0.86, 24 + (i % 3) * 4]);
  }
  const puffy = mood === 'angry' || mood === 'skill';
  const outline = bumps.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + LINE / 2}" fill="${P.ink}"/>`).join('')
    + `<ellipse cx="100" cy="112" rx="${72 + LINE / 2}" ry="${64 + LINE / 2}" fill="${P.ink}"/>`;
  const fill = bumps.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - LINE / 2}" fill="url(#dustBody)"/>`).join('')
    + `<ellipse cx="100" cy="112" rx="${72 - LINE / 2}" ry="${64 - LINE / 2}" fill="url(#dustBody)"/>`;
  // 솜털 결
  const fluff = [[56, 70], [138, 66], [44, 140], [150, 150], [96, 52]].map(([x, y]) =>
    `<path d="M${x - 8} ${y} q4 -6 8 0 q4 -6 8 0" fill="none" stroke="${D.light}" stroke-width="3" stroke-linecap="round" opacity="0.9"/>`).join('');
  // 기술 쓸 때 입김 먼지구름
  const breath = mood === 'skill'
    ? [[150, 150, 9], [168, 138, 12], [186, 124, 8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${D.light}" stroke="${P.ink}" stroke-width="3"/>`).join('')
    : '';
  const cheekR = puffy ? 15 : 11;
  return {
    defs: grad('dustBody', D.light, D.body, D.shade) + cheekDef(P),
    body: `
    <ellipse cx="100" cy="190" rx="78" ry="9" fill="${P.ink}" opacity="0.14"/>
    ${outline}${fill}
    <ellipse cx="70" cy="74" rx="14" ry="8" fill="#fff" opacity="0.75" transform="rotate(-30 70 74)"/>
    ${fluff}
    <ellipse cx="66" cy="${132}" rx="${cheekR}" ry="${cheekR * 0.65}" fill="url(#bcheek)"/>
    <ellipse cx="134" cy="${132}" rx="${cheekR}" ry="${cheekR * 0.65}" fill="url(#bcheek)"/>
    ${sleepyEye(82, 112, mood, P, -1, D.body)}
    ${sleepyEye(118, 112, mood, P, 1, D.body)}
    ${bossMouth(100, 138, mood, P)}
    ${breath}`,
  };
}

// ── 공통: 친구들 얼굴 (블루나비와 같은 눈: 흰자 + 그라데이션 눈동자 + 반짝점 2개) ──
const pupilDef = (P) => `<radialGradient id="bpupil" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#5a5fa8"/><stop offset="1" stop-color="${P.ink}"/></radialGradient>`;

function roundEye(x, y, mood, P, side, r = 11, happyStroke = P.ink) {
  if (mood === 'happy') return `<path d="M${x - r} ${y + 4} Q${x} ${y - r} ${x + r} ${y + 4}" fill="none" stroke="${happyStroke}" stroke-width="5" stroke-linecap="round"/>`;
  const brow = mood === 'angry' || mood === 'skill'
    ? `<path d="M${x - (r + 2) * side} ${y - r - 2} L${x + (r + 1) * side} ${y - r - 11}" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round"/>`
    : mood === 'sad'
      ? `<path d="M${x - (r + 1) * side} ${y - r - 11} L${x + (r + 1) * side} ${y - r - 3}" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>`
      : '';
  return `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.2}" fill="#fff" stroke="${P.ink}" stroke-width="3.2"/>
    <ellipse cx="${x + side}" cy="${y + 2}" rx="${r * 0.68}" ry="${r * 0.8}" fill="url(#bpupil)"/>
    <circle cx="${x + side - r * 0.3}" cy="${y - r * 0.25}" r="${r * 0.3}" fill="#fff"/>
    <circle cx="${x + side + r * 0.3}" cy="${y + r * 0.45}" r="${r * 0.14}" fill="#fff"/>${brow}`;
}

function face(cx, cy, mood, P, gap = 36, r = 11, mouthDy = 22, happyStroke = P.ink) {
  const puff = mood === 'angry' || mood === 'skill' ? 14 : 11;
  return `<ellipse cx="${cx - gap * 0.9}" cy="${cy + 16}" rx="${puff}" ry="${puff * 0.65}" fill="url(#bcheek)"/>
    <ellipse cx="${cx + gap * 0.9}" cy="${cy + 16}" rx="${puff}" ry="${puff * 0.65}" fill="url(#bcheek)"/>
    ${roundEye(cx - gap / 2, cy, mood, P, -1, r, happyStroke)}${roundEye(cx + gap / 2, cy, mood, P, 1, r, happyStroke)}
    ${bossMouth(cx, cy + mouthDy, mood, P)}`;
}

const blobC = (cx, cy, r, fill, P, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${P.ink}" stroke-width="${LINE}" ${extra}/>`;
const blobE = (cx, cy, rx, ry, fill, P, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${P.ink}" stroke-width="${LINE}" ${extra}/>`;
const shine = (x, y, rx = 13, ry = 8) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="0.75" transform="rotate(-30 ${x} ${y})"/>`;
const groundShadow = (P, rx = 74) => `<ellipse cx="100" cy="190" rx="${rx}" ry="9" fill="${P.ink}" opacity="0.14"/>`;
const defs = (P, ...g) => cheekDef(P) + pupilDef(P) + g.join('');

// ── 실실이: 동글동글 보라 거미 + 분홍 털모자 ──
function silsili(P, mood) {
  const C = P.silsili;
  let legs = '';
  for (let i = 0; i < 4; i++) {
    const y = 120 + i * 16;
    for (const d of [-1, 1]) legs += `<path d="M${100 + d * 50} ${y} q${d * 22} ${-14} ${d * 40} ${6 + i * 4}" fill="none" stroke="${P.ink}" stroke-width="12" stroke-linecap="round"/>
      <path d="M${100 + d * 50} ${y} q${d * 22} ${-14} ${d * 40} ${6 + i * 4}" fill="none" stroke="${i % 2 ? C.light : C.body}" stroke-width="6" stroke-linecap="round"/>`;
  }
  const yarn = mood === 'skill' ? `<path d="M150 150 q20 -10 30 10 q-10 16 -24 4" fill="none" stroke="${C.hat}" stroke-width="4"/><circle cx="176" cy="158" r="10" fill="${C.hat}" stroke="${P.ink}" stroke-width="3"/>` : '';
  return {
    defs: defs(P, grad('silBody', C.light, C.body, C.shade)),
    body: `${groundShadow(P)}${legs}
      ${blobE(100, 122, 62, 56, 'url(#silBody)', P)}${shine(72, 96)}
      <path d="M48 92 Q100 30 152 92 Z" fill="${C.hat}" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <path d="M50 92 L150 92" stroke="${P.ink}" stroke-width="${LINE}"/>
      <path d="M62 80 l8 -10 M80 70 l6 -12 M100 66 l0 -12 M120 70 l-6 -12 M138 80 l-8 -10" stroke="#fff" stroke-width="3" opacity="0.6" stroke-linecap="round"/>
      ${blobC(100, 40, 12, C.hat, P)}
      ${face(100, 124, mood, P, 38)}${yarn}`,
  };
}

// ── 짹짹이: 갈색 동그란 참새, 크림 배, 주황 부리, 머리 깃털 한 가닥 ──
function jjakjjak(P, mood) {
  const C = P.jjakjjak;
  const wingUp = mood === 'skill' ? -30 : 0;
  return {
    defs: defs(P, grad('jjakBody', C.light, C.body, C.wing)),
    body: `${groundShadow(P, 60)}
      <path d="M150 140 l34 -6 l-10 16 z" fill="${C.wing}" stroke="${P.ink}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="82" y="168" width="8" height="18" rx="4" fill="${C.beak}" stroke="${P.ink}" stroke-width="3"/><rect x="110" y="168" width="8" height="18" rx="4" fill="${C.beak}" stroke="${P.ink}" stroke-width="3"/>
      ${blobC(100, 112, 66, 'url(#jjakBody)', P)}
      <ellipse cx="100" cy="140" rx="40" ry="34" fill="${C.belly}"/>
      <path d="M100 48 q-6 -24 10 -30 q-4 14 2 28" fill="${C.wing}" stroke="${P.ink}" stroke-width="4" stroke-linejoin="round"/>
      <g transform="rotate(${wingUp} 44 120)"><ellipse cx="40" cy="124" rx="18" ry="30" fill="${C.wing}" stroke="${P.ink}" stroke-width="${LINE}"/></g>
      <g transform="rotate(${-wingUp} 156 120)"><ellipse cx="160" cy="124" rx="18" ry="30" fill="${C.wing}" stroke="${P.ink}" stroke-width="${LINE}"/></g>
      ${shine(70, 76)}
      ${face(100, 98, mood, P, 40, 11, 26)}
      <path d="M90 112 L110 112 L100 126 Z" fill="${C.beak}" stroke="${P.ink}" stroke-width="4" stroke-linejoin="round"/>`,
  };
}

// ── 빵빵이: 아기 판다 ──
function bbangbbang(P, mood) {
  const C = P.panda;
  const bamboo = mood === 'skill' ? `<rect x="150" y="70" width="12" height="90" rx="6" fill="#7cc56a" stroke="${P.ink}" stroke-width="4" transform="rotate(20 156 115)"/>` : '';
  return {
    defs: defs(P, grad('pandaBody', '#ffffff', C.body, C.shade)),
    body: `${groundShadow(P, 66)}
      ${blobE(100, 152, 50, 38, C.black, P)}
      ${blobC(52, 52, 20, C.black, P)}${blobC(148, 52, 20, C.black, P)}
      ${blobC(100, 102, 64, 'url(#pandaBody)', P)}${shine(70, 70)}
      <ellipse cx="80" cy="104" rx="16" ry="20" fill="${C.black}" transform="rotate(20 80 104)"/>
      <ellipse cx="120" cy="104" rx="16" ry="20" fill="${C.black}" transform="rotate(-20 120 104)"/>
      ${face(100, 104, mood, P, 40, 9, 24, '#ffffff')}
      <ellipse cx="100" cy="118" rx="7" ry="5" fill="${P.ink}"/>${bamboo}`,
  };
}

// ── 사뿐이: 꽃사슴 (흰 점, 작은 뿔, 큰 귀) ──
function sappuni(P, mood) {
  const C = P.deer;
  const hop = mood === 'skill' ? -8 : 0;
  return {
    defs: defs(P, grad('deerBody', C.light, C.body, C.shade)),
    body: `${groundShadow(P, 56)}
      <g transform="translate(0 ${hop})">
      ${blobE(100, 158, 40, 30, 'url(#deerBody)', P)}
      <circle cx="84" cy="152" r="4" fill="#fff"/><circle cx="110" cy="160" r="4" fill="#fff"/><circle cx="98" cy="146" r="3" fill="#fff"/>
      <path d="M70 46 q-10 -24 4 -32 M70 34 l-12 -8 M130 46 q10 -24 -4 -32 M130 34 l12 -8" fill="none" stroke="#a8673c" stroke-width="7" stroke-linecap="round"/>
      ${blobE(46, 78, 26, 14, C.body, P, 'transform="rotate(-25 46 78)"')}${blobE(154, 78, 26, 14, C.body, P, 'transform="rotate(25 154 78)"')}
      <ellipse cx="48" cy="78" rx="14" ry="6" fill="${P.cheek}" transform="rotate(-25 48 78)"/><ellipse cx="152" cy="78" rx="14" ry="6" fill="${P.cheek}" transform="rotate(25 152 78)"/>
      ${blobC(100, 100, 56, 'url(#deerBody)', P)}${shine(74, 72)}
      <ellipse cx="100" cy="126" rx="26" ry="18" fill="${C.muzzle}"/>
      ${face(100, 96, mood, P, 38, 10, 30)}
      <ellipse cx="100" cy="118" rx="6" ry="4" fill="${P.ink}"/>
      <path d="M78 60 l4 -6 l4 6 M120 64 l4 -6 l4 6" stroke="${P.cheek}" stroke-width="4" fill="none" stroke-linecap="round"/>
      </g>`,
  };
}

// ── 도토리대장: 다람쥐 (큰 꼬리, 도토리) ──
function dotori(P, mood) {
  const C = P.squirrel;
  return {
    defs: defs(P, grad('sqBody', C.light, C.body, C.shade)),
    body: `${groundShadow(P, 62)}
      <path d="M140 170 q60 -10 44 -80 q-10 -40 -40 -30 q30 20 10 60 q-10 30 -20 40 z" fill="url(#sqBody)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <path d="M160 80 q14 20 4 50" fill="none" stroke="${C.belly}" stroke-width="6" stroke-linecap="round"/>
      ${blobE(92, 150, 42, 34, 'url(#sqBody)', P)}<ellipse cx="92" cy="156" rx="24" ry="20" fill="${C.belly}"/>
      ${blobE(60, 46, 12, 18, C.body, P)}${blobE(124, 46, 12, 18, C.body, P)}
      ${blobC(92, 96, 52, 'url(#sqBody)', P)}${shine(66, 70)}
      <ellipse cx="92" cy="118" rx="24" ry="16" fill="${C.belly}"/>
      ${face(92, 94, mood, P, 36, 10, 24)}
      <ellipse cx="92" cy="110" rx="5" ry="4" fill="${P.ink}"/>
      <g transform="translate(${mood === 'skill' ? 30 : 0} ${mood === 'skill' ? -40 : 0})">
        <ellipse cx="92" cy="166" rx="12" ry="14" fill="#c98a5a" stroke="${P.ink}" stroke-width="4"/><ellipse cx="92" cy="154" rx="15" ry="7" fill="#8a5a3a" stroke="${P.ink}" stroke-width="4"/></g>`,
  };
}

// ── 댐댐이: 비버 (앞니, 넓적한 꼬리) ──
function damdam(P, mood) {
  const C = P.beaver;
  const slap = mood === 'skill' ? -25 : 0;
  return {
    defs: defs(P, grad('bvBody', C.light, C.body, C.shade)),
    body: `${groundShadow(P, 70)}
      <g transform="rotate(${slap} 140 168)"><ellipse cx="158" cy="170" rx="30" ry="14" fill="${C.tail}" stroke="${P.ink}" stroke-width="${LINE}"/>
        <path d="M140 166 l36 0 M146 174 l26 0" stroke="${C.shade}" stroke-width="3"/></g>
      ${blobE(98, 150, 50, 36, 'url(#bvBody)', P)}
      ${blobC(58, 54, 12, C.body, P)}${blobC(138, 54, 12, C.body, P)}
      ${blobC(98, 100, 58, 'url(#bvBody)', P)}${shine(70, 72)}
      <ellipse cx="98" cy="122" rx="28" ry="18" fill="${C.muzzle}"/>
      ${face(98, 96, mood, P, 38, 10, 18)}
      <ellipse cx="98" cy="112" rx="7" ry="5" fill="${P.ink}"/>
      <rect x="90" y="124" width="8" height="12" rx="2" fill="#fff" stroke="${P.ink}" stroke-width="3"/><rect x="98" y="124" width="8" height="12" rx="2" fill="#fff" stroke="${P.ink}" stroke-width="3"/>`,
  };
}

// ── 붕붕대장: 꿀벌 (노란 줄무늬, 빨간 대장 모자 + 별, 반투명 날개) ──
function buzzboss(P, mood) {
  const C = P.bee;
  const flap = mood === 'skill' ? 0.7 : 1;
  const wing = (d) => `<ellipse cx="${100 + d * 44}" cy="62" rx="${30 * flap}" ry="40" fill="#e8f4ff" opacity="0.85" stroke="${P.ink}" stroke-width="4" transform="rotate(${d * 30} ${100 + d * 44} 62)"/>`;
  return {
    defs: defs(P, grad('beeBody', C.light, C.body, C.shade)),
    body: `${groundShadow(P, 66)}${wing(-1)}${wing(1)}
      <path d="M100 176 l-8 14 l16 0 z" fill="${P.ink}"/>
      ${blobE(100, 112, 66, 62, 'url(#beeBody)', P)}
      <path d="M40 132 Q100 156 160 132" fill="none" stroke="${P.ink}" stroke-width="12" stroke-linecap="round"/>
      <path d="M50 156 Q100 176 150 156" fill="none" stroke="${P.ink}" stroke-width="10" stroke-linecap="round"/>
      ${shine(68, 80)}
      ${face(100, 98, mood, P, 40, 11, 20)}
      <path d="M58 58 Q100 18 142 58 Z" fill="${C.hat}" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <rect x="50" y="54" width="100" height="12" rx="6" fill="${C.hat}" stroke="${P.ink}" stroke-width="5"/>
      <path d="M100 30 l4 9 l10 1 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 l10 -1 z" fill="#ffd84a" stroke="${P.ink}" stroke-width="2"/>
      <path d="M80 30 q-8 -16 -18 -14 M120 30 q8 -16 18 -14" fill="none" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>`,
  };
}

const BOSSES = { dustmong, silsili, jjakjjak, bbangbbang, sappuni, dotori, damdam, buzzboss };

export function bossFrame(P, key, pose = {}) {
  const { defs, body } = BOSSES[key](P, pose.mood ?? 'angry');
  const t = `translate(0 ${pose.dy ?? 0}) rotate(${pose.rot ?? 0} 100 150) translate(100 190) scale(${pose.sx ?? 1} ${pose.sy ?? 1}) translate(-100 -190)`;
  return { defs, body: `<g transform="${t}">${body}</g>` };
}

// 대결 칸 순서(art-guide.md 4절): 화남 2, 시무룩 1, 웃음 2, 기술 1
export const BOSS_POSES = [
  { mood: 'angry' }, { mood: 'angry', sy: 0.95, sx: 1.04 },
  { mood: 'sad', sy: 0.96 },
  { mood: 'happy' }, { mood: 'happy', dy: -8, sy: 1.02 },
  { mood: 'skill', sx: 1.08, sy: 0.94 },
];
export const BOSS_FACE_MOODS = ['angry', 'happy'];
export const BOSS_FACE_BOX = {
  dustmong: [14, 28, 172], silsili: [20, 20, 160], jjakjjak: [24, 14, 156], bbangbbang: [22, 22, 156],
  sappuni: [18, 10, 164], dotori: [22, 18, 150], damdam: [26, 28, 148], buzzboss: [26, 10, 150],
};
export const BOSS_KEYS = Object.keys(BOSSES);

// ── 도트: 무당벌레 길잡이 (빨간 광택 등껍질, 검은 점, 노란 안경) ──
function dot(P, mood) {
  const m = mood === 'happy' ? 'happy' : 'normal';
  return {
    defs: defs(P, grad('dotShell', '#ff8a8a', '#ff4d4d', '#d63a3a'), grad('dotHead', '#5a5c88', P.ink, '#1c1d3c')),
    body: `${groundShadow(P, 60)}
      ${blobE(100, 132, 62, 52, 'url(#dotShell)', P)}
      <path d="M100 82 L100 184" stroke="${P.ink}" stroke-width="5"/>
      <circle cx="70" cy="122" r="11" fill="${P.ink}"/><circle cx="130" cy="122" r="11" fill="${P.ink}"/>
      <circle cx="78" cy="158" r="9" fill="${P.ink}"/><circle cx="122" cy="158" r="9" fill="${P.ink}"/>
      ${shine(70, 100, 16, 9)}
      <path d="M82 38 q-8 -20 -20 -22 M118 38 q8 -20 20 -22" fill="none" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="61" cy="16" r="6" fill="${P.ink}"/><circle cx="139" cy="16" r="6" fill="${P.ink}"/>
      ${blobC(100, 70, 40, 'url(#dotHead)', P)}
      <ellipse cx="68" cy="84" rx="9" ry="6" fill="url(#bcheek)"/><ellipse cx="132" cy="84" rx="9" ry="6" fill="url(#bcheek)"/>
      ${m === 'happy'
        ? `<path d="M74 70 Q84 58 94 70 M106 70 Q116 58 126 70" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>`
        : `<circle cx="84" cy="68" r="9" fill="#fff"/><circle cx="116" cy="68" r="9" fill="#fff"/><circle cx="86" cy="70" r="5" fill="${P.ink}"/><circle cx="118" cy="70" r="5" fill="${P.ink}"/>`}
      <circle cx="84" cy="68" r="15" fill="none" stroke="#ffd84a" stroke-width="4"/><circle cx="116" cy="68" r="15" fill="none" stroke="#ffd84a" stroke-width="4"/>
      <path d="M99 68 L101 68" stroke="#ffd84a" stroke-width="4"/>
      <path d="M92 88 Q100 ${m === 'happy' ? 98 : 93} 108 88" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`,
  };
}

// ── 꽃님: 세계에서 제일 큰 파란 꽃 (겹꽃잎, 노란 가운데, 따뜻한 얼굴) ──
function flower(P, mood) {
  const F = P.flower;
  let petals = '';
  for (const [n, r, w, col, off] of [[8, 66, 30, F.outer, 0], [8, 46, 24, F.petal, Math.PI / 8]]) {
    for (let i = 0; i < n; i++) {
      const a = off + (i / n) * Math.PI * 2;
      const x = 100 + Math.cos(a) * r * 0.62;
      const y = 92 + Math.sin(a) * r * 0.62;
      petals += `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${r * 0.5}" fill="${col}" stroke="${P.ink}" stroke-width="5" transform="rotate(${(a * 180) / Math.PI + 90} ${x} ${y})"/>`;
    }
  }
  const sway = mood === 'happy' ? 4 : 0;
  return {
    defs: defs(P, grad('flCenter', '#fff3b0', '#ffd84a', '#f0b52a')),
    body: `${groundShadow(P, 50)}
      <path d="M100 150 Q96 172 100 196" stroke="${P.ink}" stroke-width="14" fill="none"/>
      <path d="M100 150 Q96 172 100 196" stroke="#4f9f4c" stroke-width="8" fill="none"/>
      <ellipse cx="72" cy="176" rx="22" ry="10" fill="#6cc35a" stroke="${P.ink}" stroke-width="4" transform="rotate(-20 72 176)"/>
      <ellipse cx="128" cy="172" rx="22" ry="10" fill="#6cc35a" stroke="${P.ink}" stroke-width="4" transform="rotate(20 128 172)"/>
      <g transform="rotate(${sway} 100 150)">${petals}
      ${blobC(100, 92, 34, 'url(#flCenter)', P)}
      <circle cx="88" cy="80" r="2.5" fill="#e0a020"/><circle cx="112" cy="80" r="2.5" fill="#e0a020"/><circle cx="100" cy="74" r="2.5" fill="#e0a020"/>
      <path d="M86 92 Q91 86 96 92 M104 92 Q109 86 114 92" fill="none" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="80" cy="102" rx="7" ry="4.5" fill="url(#bcheek)"/><ellipse cx="120" cy="102" rx="7" ry="4.5" fill="url(#bcheek)"/>
      <path d="M92 104 Q100 112 108 104" fill="none" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round"/></g>`,
  };
}

const NPCS = { dot, flower };
export function npcFrame(P, key, pose = {}) {
  const { defs: d, body } = NPCS[key](P, pose.mood ?? 'normal');
  const t = `translate(0 ${pose.dy ?? 0}) translate(100 190) scale(${pose.sx ?? 1} ${pose.sy ?? 1}) translate(-100 -190)`;
  return { defs: d, body: `<g transform="${t}">${body}</g>` };
}
export const NPC_KEYS = Object.keys(NPCS);
export const NPC_POSES = [{}, { sy: 0.97, sx: 1.02, mood: 'happy' }];
export const NPC_FACE_BOX = { dot: [40, 16, 120], flower: [30, 22, 140] };
