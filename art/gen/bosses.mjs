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

const BOSSES = { dustmong };

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
export const BOSS_FACE_BOX = { dustmong: [14, 28, 172] };
export const BOSS_KEYS = Object.keys(BOSSES);
