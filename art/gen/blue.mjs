// 블루나비 캐릭터 그림(SVG). 200×200 단위로 그리고, 굽는 스크립트가 원하는 크기로 바꾼다.
// 규칙(art-guide.md 3·7절): 둥근 모양, 외곽선 #2b2d5a 약 3%(200 단위에서 6), 왼쪽 위가 밝은 방사형 그라데이션,
// 흰 하이라이트, 바닥 그림자, 눈 = 흰자 + 그라데이션 눈동자 + 반짝점 2개 + 윗눈꺼풀 선, 볼터치는 퍼지는 분홍.
// 얼굴(눈·볼·입)은 face() 하나로 세 모습이 함께 써서 진화해도 같은 블루나비로 보이게 한다.

const LINE = 6;

function grad(id, light, mid, dark) {
  return `<radialGradient id="${id}" cx="35%" cy="30%" r="75%">
    <stop offset="0" stop-color="${light}"/><stop offset="0.55" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/>
  </radialGradient>`;
}

function commonDefs(P) {
  return `
  <radialGradient id="pupil" cx="40%" cy="35%" r="70%">
    <stop offset="0" stop-color="#5a5fa8"/><stop offset="1" stop-color="${P.ink}"/>
  </radialGradient>
  <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${P.cheek}" stop-opacity="0.95"/><stop offset="1" stop-color="${P.cheek}" stop-opacity="0"/>
  </radialGradient>`;
}

const shadow = (cx, cy, rx, P) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.11}" fill="${P.ink}" opacity="0.14"/>`;
const shine = (cx, cy, rx, ry, rot = -30) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="0.8" transform="rotate(${rot} ${cx} ${cy})"/>`;

// 표정: joy(기쁨) · surprise(놀람) · sleepy(졸림) · sad(시무룩)
function eye(x, y, mood, P, side) {
  const rx = 12.5;
  const ry = 15.5;
  if (mood === 'sleepy') {
    return `<path d="M${x - rx} ${y + 2} Q${x} ${y + 12} ${x + rx} ${y + 2}" fill="none" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round"/>`;
  }
  if (mood === 'joy') {
    return `<path d="M${x - rx} ${y + 4} Q${x} ${y - 14} ${x + rx} ${y + 4}" fill="none" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>`;
  }
  const s = mood === 'surprise' ? 1.12 : 1;
  const pr = 9 * (mood === 'surprise' ? 0.8 : 1);
  const lid = mood === 'sad'
    ? `<path d="M${x - rx - 2} ${y - ry + (side < 0 ? 8 : 0)} L${x + rx + 2} ${y - ry + (side < 0 ? 0 : 8)}" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>`
    : `<path d="M${x - rx * s} ${y - 4} Q${x} ${y - ry * s - 4} ${x + rx * s} ${y - 4}" fill="none" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round"/>`;
  return `
    <ellipse cx="${x}" cy="${y}" rx="${rx * s}" ry="${ry * s}" fill="#fff" stroke="${P.ink}" stroke-width="3.2"/>
    <ellipse cx="${x + side * 1.5}" cy="${y + 2.5}" rx="${pr}" ry="${pr * 1.18}" fill="url(#pupil)"/>
    <circle cx="${x + side * 1.5 - 3.6}" cy="${y - 2.5}" r="3.6" fill="#fff"/>
    <circle cx="${x + side * 1.5 + 3.4}" cy="${y + 6}" r="1.7" fill="#fff"/>
    ${lid}`;
}

function mouth(x, y, mood, P) {
  switch (mood) {
    case 'joy':
      return `<path d="M${x - 9} ${y - 2} Q${x} ${y + 14} ${x + 9} ${y - 2} Z" fill="${P.ink}"/>
        <path d="M${x - 5} ${y + 5} Q${x} ${y + 1} ${x + 5} ${y + 5} Q${x} ${y + 10} ${x - 5} ${y + 5} Z" fill="#ff7f9c"/>`;
    case 'surprise':
      return `<ellipse cx="${x}" cy="${y + 3}" rx="5" ry="6.5" fill="${P.ink}"/>`;
    case 'sleepy':
      return `<path d="M${x - 4} ${y + 3} Q${x} ${y + 6} ${x + 4} ${y + 3}" fill="none" stroke="${P.ink}" stroke-width="3" stroke-linecap="round"/>`;
    case 'sad':
      return `<path d="M${x - 7} ${y + 6} Q${x} ${y - 2} ${x + 7} ${y + 6}" fill="none" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round"/>`;
    default:
      return `<path d="M${x - 7} ${y} Q${x} ${y + 8} ${x + 7} ${y}" fill="none" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round"/>`;
  }
}

// 얼굴 하나: (cx, cy)는 두 눈 사이 가운데. gap = 두 눈 간격
function face(cx, cy, mood, P, gap = 34) {
  return `
    <ellipse cx="${cx - gap * 0.88}" cy="${cy + 17}" rx="11" ry="7" fill="url(#cheek)"/>
    <ellipse cx="${cx + gap * 0.88}" cy="${cy + 17}" rx="11" ry="7" fill="url(#cheek)"/>
    ${eye(cx - gap / 2, cy, mood, P, -1)}
    ${eye(cx + gap / 2, cy, mood, P, 1)}
    ${mouth(cx, cy + 18, mood, P)}`;
}

// ── 애벌레 ─────────────────────────────────────────
function caterpillar(P, mood, o = {}) {
  const w = o.wave ?? [0, 0];
  const C = P.caterpillar;
  const seg = (x, y, r) => `
    <circle cx="${x}" cy="${y}" r="${r}" fill="url(#catBody)" stroke="${P.ink}" stroke-width="${LINE}"/>
    <circle cx="${x + r * 0.15}" cy="${y + r * 0.35}" r="${r * 0.2}" fill="${C.belly}"/>
    ${shine(x - r * 0.4, y - r * 0.45, r * 0.22, r * 0.13)}`;
  const foot = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="6" fill="${C.shade}" stroke="${P.ink}" stroke-width="4"/>`;
  return {
    defs: grad('catBody', C.light, C.body, C.shade),
    body: `
    ${shadow(100, 182, 84, P)}
    ${foot(40, 176)}${foot(72, 177)}
    ${seg(38, 154 - w[0], 23)}
    ${seg(70, 150 - w[1], 28)}
    <path transform="translate(0 ${-w[0]})" d="M12 132 c-6 -9 4 -17 10 -10 c6 -7 16 1 10 10 l-10 10 z" fill="${P.cheek}" stroke="${P.ink}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M100 58 Q92 30 80 24" fill="none" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>
    <path d="M140 58 Q150 30 164 26" fill="none" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="79" cy="23" r="8" fill="url(#catBody)" stroke="${P.ink}" stroke-width="4.5"/>
    <circle cx="165" cy="25" r="8" fill="url(#catBody)" stroke="${P.ink}" stroke-width="4.5"/>
    <circle cx="120" cy="112" r="56" fill="url(#catBody)" stroke="${P.ink}" stroke-width="${LINE}"/>
    ${shine(92, 80, 13, 8)}
    <circle cx="150" cy="80" r="4" fill="#fff" opacity="0.6"/>
    ${face(124, 112, mood, P)}`,
  };
}

// ── 나방 ───────────────────────────────────────────
function moth(P, mood, o = {}) {
  const flap = (str) => `<g transform="translate(100 0) scale(${o.wing ?? 1} 1) translate(-100 0)">${str}</g>`;
  const M = P.moth;
  const wingUp = `
    <path d="M100 118 C 70 60, 10 52, 12 100 C 14 138, 62 146, 100 132 Z" fill="url(#mothWing)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
    <path d="M96 122 C 72 100, 44 86, 26 92 M96 126 C 70 118, 46 120, 30 126" fill="none" stroke="${M.fur}" stroke-width="2.6" stroke-linecap="round" opacity="0.7"/>
    <circle cx="46" cy="102" r="15" fill="${M.fur}" stroke="${P.ink}" stroke-width="3.5"/>
    <circle cx="46" cy="102" r="7" fill="${M.deep}"/>
    <circle cx="43" cy="99" r="2.4" fill="#fff"/>`;
  const wingLow = `
    <path d="M100 136 C 76 140, 42 158, 50 180 C 58 196, 90 182, 100 152 Z" fill="url(#mothWing)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
    <circle cx="68" cy="168" r="7" fill="${M.fur}" opacity="0.9"/>`;
  const mirror = (s) => `<g transform="translate(200 0) scale(-1 1)">${s}</g>`;
  // 깃털 더듬이: 잎처럼 통통한 깃털 + 가운데 줄기
  const antenna = (dir) => {
    const bx = 100 + dir * 16;
    const tx = 100 + dir * 40;
    return `<path d="M${bx} 56 Q${bx + dir * 6} 36 ${tx} 12" fill="none" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round"/>
    <ellipse cx="${100 + dir * 31}" cy="26" rx="9" ry="20" transform="rotate(${dir * 38} ${100 + dir * 31} 26)" fill="${M.fur}" stroke="${P.ink}" stroke-width="4"/>
    <path d="M${100 + dir * 25} 40 L${100 + dir * 37} 12" stroke="${P.ink}" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>`;
  };
  // 보송한 목털: 작은 동그라미를 둘러 붙인 고리
  let fur = '';
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.08 + (i / 6) * 0.84);
    fur += `<circle cx="${100 + Math.cos(a) * 40}" cy="${126 + Math.sin(a) * 12}" r="14" fill="${M.fur}" stroke="${P.ink}" stroke-width="4"/>`;
  }
  return {
    defs: grad('mothWing', '#a3afef', M.wing, M.deep) + grad('mothBody', '#8d9be6', M.light, M.body),
    body: `
    ${shadow(100, 188, 70, P)}
    ${flap(wingLow + mirror(wingLow) + wingUp + mirror(wingUp))}
    <ellipse cx="100" cy="156" rx="30" ry="32" fill="url(#mothBody)" stroke="${P.ink}" stroke-width="${LINE}"/>
    <path d="M78 160 Q100 168 122 160 M80 172 Q100 180 120 172" fill="none" stroke="${M.fur}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    ${fur}
    ${antenna(-1)}${antenna(1)}
    <circle cx="100" cy="94" r="46" fill="url(#mothBody)" stroke="${P.ink}" stroke-width="${LINE}"/>
    <path d="M62 104 A40 40 0 0 1 128 64" fill="none" stroke="${M.fur}" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
    ${shine(78, 70, 11, 7)}
    ${face(100, 94, mood, P, 32)}`,
  };
}

// ── 나비 ───────────────────────────────────────────
function butterfly(P, mood, o = {}) {
  const flap = (str) => `<g transform="translate(100 0) scale(${o.wing ?? 1} 1) translate(-100 0)">${str}</g>`;
  const B = P.butterfly;
  const C = P.caterpillar;
  const heart = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 4 C -6 -4, -14 2, 0 12 C 14 2, 6 -4, 0 4 Z" fill="${B.heart}"/>`;
  const wingUp = `
    <path d="M102 112 C 96 44, 40 4, 14 36 C -6 62, 26 112, 102 126 Z" fill="url(#bfWing)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
    <path d="M98 114 C 82 82, 58 62, 40 64 C 30 78, 56 104, 98 118 Z" fill="${B.inner}" opacity="0.9"/>
    <path d="M100 116 C 80 80, 52 42, 30 40 M100 120 C 70 106, 40 96, 22 74" fill="none" stroke="${B.deep}" stroke-width="2.4" stroke-linecap="round" opacity="0.6"/>
    <circle cx="26" cy="46" r="4" fill="#fff"/><circle cx="16" cy="62" r="3.4" fill="#fff"/><circle cx="40" cy="28" r="3.4" fill="#fff"/>
    ${heart(46, 50, 1.6)}`;
  const wingLow = `
    <path d="M102 128 C 66 130, 30 150, 42 178 C 54 200, 92 186, 102 146 Z" fill="url(#bfWing)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
    <path d="M98 136 C 74 142, 56 156, 60 170 C 72 176, 92 160, 98 140 Z" fill="${B.inner}" opacity="0.85"/>
    <circle cx="50" cy="178" r="3.4" fill="#fff"/><circle cx="44" cy="164" r="3" fill="#fff"/>`;
  const mirror = (s) => `<g transform="translate(200 0) scale(-1 1)">${s}</g>`;
  const antenna = (dir) => `
    <path d="M${100 + dir * 10} 62 Q${100 + dir * 18} 34 ${100 + dir * 36} 16" fill="none" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="${100 + dir * 37}" cy="15" r="7.5" fill="${B.antennaTip}" stroke="${P.ink}" stroke-width="4"/>`;
  return {
    defs: grad('bfWing', '#7fb2ff', B.wing, B.deep) + grad('bfBody', C.light, C.body, C.shade),
    body: `
    ${shadow(100, 190, 66, P)}
    ${flap(wingLow + mirror(wingLow) + wingUp + mirror(wingUp))}
    <ellipse cx="100" cy="150" rx="19" ry="34" fill="url(#bfBody)" stroke="${P.ink}" stroke-width="${LINE}"/>
    <path d="M86 146 Q100 152 114 146 M87 160 Q100 166 113 160" fill="none" stroke="${C.shade}" stroke-width="3" stroke-linecap="round"/>
    ${antenna(-1)}${antenna(1)}
    <circle cx="100" cy="96" r="42" fill="url(#bfBody)" stroke="${P.ink}" stroke-width="${LINE}"/>
    ${shine(80, 74, 10, 6.5)}
    ${face(100, 96, mood, P, 30)}`,
  };
}

const FORMS = { caterpillar, moth, butterfly };

export function blueSvg(P, form, mood = 'normal') {
  const { defs, body } = FORMS[form](P, mood);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>${commonDefs(P)}${defs}</defs>
  ${body}
</svg>`;
}

// 애니메이션 한 칸. pose: { mood, wing, wave, sx, sy, dy, rot } — 몸 전체는 발밑(100,190)을 기준으로 늘이고 줄인다.
export function blueFrame(P, form, pose = {}) {
  const { defs, body } = FORMS[form](P, pose.mood ?? 'normal', pose);
  const t = `translate(0 ${pose.dy ?? 0}) rotate(${pose.rot ?? 0} 100 150) translate(100 190) scale(${pose.sx ?? 1} ${pose.sy ?? 1}) translate(-100 -190)`;
  return { defs: commonDefs(P) + defs, body: `<g transform="${t}">${body}</g>` };
}

// 얼굴 칸(대사창용)을 자를 영역 [x, y, 크기] (200 단위)
export const FACE_BOX = { caterpillar: [50, 42, 140], moth: [36, 24, 128], butterfly: [38, 28, 124] };

// 스프라이트 시트 포즈 (art-guide.md 4절 칸 순서)
export const MAZE_POSES = {
  caterpillar: [{}, { sy: 0.95, sx: 1.03 }, { wave: [6, 0] }, { wave: [3, 6], dy: -2 }, { wave: [0, 3] }, { wave: [0, 0], sy: 0.97 }],
  moth: [{}, { sy: 0.96, sx: 1.02, wing: 0.9 }, { wing: 0.65, dy: -4 }, { wing: 0.3, dy: -6 }, { wing: 0.65, dy: -4 }, { wing: 1, dy: -1 }],
  butterfly: [{}, { sy: 0.96, sx: 1.02, wing: 0.92 }, { wing: 0.6, dy: -4 }, { wing: 0.25, dy: -7 }, { wing: 0.6, dy: -4 }, { wing: 1, dy: -1 }],
};
// 대결: 대기 2, 놀자 1, 버티기 1, 특기 1, 지침 1, 기쁨 1
export const BATTLE_POSES = [
  {}, { sy: 0.95, sx: 1.03, wing: 0.85 },
  { mood: 'joy', rot: 8, dy: -6 },
  { mood: 'sleepy', sy: 0.88, sx: 1.06, wing: 0.55 },
  { mood: 'surprise', sx: 1.06, sy: 1.06, dy: -10, wing: 0.35 },
  { mood: 'sad', sy: 0.9, sx: 1.04, rot: -6, wing: 0.7 },
  { mood: 'joy', dy: -14, wing: 0.4 },
];
export const FACE_MOODS = ['joy', 'surprise', 'sleepy', 'sad'];

export const MOODS = ['normal', 'joy', 'surprise', 'sleepy', 'sad'];
export const FORM_NAMES = { caterpillar: '애벌레', moth: '나방', butterfly: '나비' };
