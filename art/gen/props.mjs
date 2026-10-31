// 수집품·순찰 방해물·고치 그림(SVG). 블루나비 캐릭터 시트 v1과 같은 그림체:
// 200×200 단위, 외곽선 6(#2b2d5a), 왼쪽 위가 밝은 방사형 그라데이션, 흰 하이라이트, 바닥 그림자, 볼터치.
// 움직이는 방해물도 무섭지 않게 얼굴(눈·볼)을 단다.
const LINE = 6;

const grad = (id, light, mid, dark) => `<radialGradient id="${id}" cx="35%" cy="30%" r="75%">
  <stop offset="0" stop-color="${light}"/><stop offset="0.55" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`;
const cheekDef = (P) => `<radialGradient id="pcheek" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${P.cheek}" stop-opacity="0.95"/><stop offset="1" stop-color="${P.cheek}" stop-opacity="0"/></radialGradient>`;
const shadow = (P, rx = 60, cy = 186) => `<ellipse cx="100" cy="${cy}" rx="${rx}" ry="8" fill="${P.ink}" opacity="0.14"/>`;
const shine = (x, y, rx = 10, ry = 6, rot = -30) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="0.8" transform="rotate(${rot} ${x} ${y})"/>`;
// 작고 순한 얼굴 (방해물용)
const miniFace = (cx, cy, P, gap = 26) => `
  <ellipse cx="${cx - gap / 2}" cy="${cy}" rx="5" ry="6.5" fill="${P.ink}"/><ellipse cx="${cx + gap / 2}" cy="${cy}" rx="5" ry="6.5" fill="${P.ink}"/>
  <circle cx="${cx - gap / 2 - 1.5}" cy="${cy - 2}" r="1.8" fill="#fff"/><circle cx="${cx + gap / 2 - 1.5}" cy="${cy - 2}" r="1.8" fill="#fff"/>
  <ellipse cx="${cx - gap * 0.95}" cy="${cy + 9}" rx="8" ry="5" fill="url(#pcheek)"/><ellipse cx="${cx + gap * 0.95}" cy="${cy + 9}" rx="8" ry="5" fill="url(#pcheek)"/>
  <path d="M${cx - 5} ${cy + 9} Q${cx} ${cy + 14} ${cx + 5} ${cy + 9}" fill="none" stroke="${P.ink}" stroke-width="3" stroke-linecap="round"/>`;

const PROPS = {
  // ── 수집품 ──
  item_leaf: (P) => ({
    defs: grad('g', '#9be07f', '#5fb84f', '#3f8f3c'),
    body: `${shadow(P, 46)}
      <path d="M100 30 C150 50 160 120 100 170 C40 120 50 50 100 30 Z" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <path d="M100 44 L100 160 M100 80 L78 64 M100 104 L124 86 M100 128 L80 112" stroke="#3f8f3c" stroke-width="4" stroke-linecap="round"/>
      <path d="M100 168 L106 186" stroke="${P.ink}" stroke-width="6" stroke-linecap="round"/>${shine(80, 68, 8, 14, 20)}`,
  }),
  item_moondust: (P) => {
    const star = (cx, cy, r, f) => {
      const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r * 0.45 : r; return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`; }).join(' ');
      return `<polygon points="${pts}" fill="${f}" stroke="${P.ink}" stroke-width="${r > 30 ? LINE : 4}" stroke-linejoin="round"/>`;
    };
    return { defs: grad('g', '#ffffff', '#e6ecff', '#b8c4f0'), body: `${shadow(P, 40)}${star(100, 104, 62, 'url(#g)')}${star(158, 50, 18, '#ffe9a8')}${star(46, 156, 14, '#ffe9a8')}${shine(84, 84, 9, 6)}` };
  },
  item_seed: (P) => ({
    defs: grad('g', '#e0aa7e', '#c98a5a', '#a8673c'),
    body: `${shadow(P, 50)}
      <ellipse cx="100" cy="128" rx="54" ry="44" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}"/>
      <path d="M100 86 Q96 60 100 40" stroke="${P.ink}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M100 86 Q96 60 100 40" stroke="#5fb84f" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="76" cy="40" rx="24" ry="13" fill="#6cc35a" stroke="${P.ink}" stroke-width="4.5" transform="rotate(-20 76 40)"/>
      <ellipse cx="124" cy="34" rx="24" ry="13" fill="#6cc35a" stroke="${P.ink}" stroke-width="4.5" transform="rotate(20 124 34)"/>${shine(80, 112)}`,
  }),
  item_bambooLeaf: (P) => ({
    defs: grad('g', '#9be07f', '#5fb84f', '#3f8f3c'),
    body: `${shadow(P, 56)}
      <path d="M40 140 C70 60 130 40 170 50 C150 90 100 140 40 140 Z" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <path d="M30 160 C70 120 130 110 176 130 C140 160 80 176 30 160 Z" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <path d="M50 134 L160 56 M40 158 L168 132" stroke="#3f8f3c" stroke-width="3.5" stroke-linecap="round"/>${shine(108, 80, 10, 5, -35)}`,
  }),
  item_petal: (P) => ({
    defs: grad('g', '#ffe3ec', '#ffb7c9', '#ff8fab'),
    body: `${shadow(P, 44)}
      <path d="M100 172 C40 130 36 70 74 50 C88 44 96 54 100 66 C104 54 112 44 126 50 C164 70 160 130 100 172 Z" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <path d="M100 70 L100 140" stroke="#ff8fab" stroke-width="4" stroke-linecap="round"/>${shine(76, 76, 9, 6)}`,
  }),
  item_acorn: (P) => ({
    defs: grad('g', '#e0aa7e', '#c98a5a', '#a8673c') + grad('h', '#b08060', '#8a5a3a', '#6e4630'),
    body: `${shadow(P, 46)}
      <ellipse cx="100" cy="122" rx="46" ry="54" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}"/>
      <path d="M44 84 Q100 30 156 84 Q100 104 44 84 Z" fill="url(#h)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <path d="M64 76 L136 76 M74 66 L126 66" stroke="#6e4630" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
      <path d="M100 46 Q104 30 114 24" stroke="${P.ink}" stroke-width="7" fill="none" stroke-linecap="round"/>${shine(80, 118, 8, 14, 15)}`,
  }),
  item_nectar: (P) => ({
    defs: grad('g', '#fff0b0', '#ffc23a', '#e0a020'),
    body: `${shadow(P, 44)}
      <path d="M100 30 C120 70 152 100 152 132 C152 162 128 180 100 180 C72 180 48 162 48 132 C48 100 80 70 100 30 Z" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      ${shine(82, 116, 10, 18, 15)}<circle cx="78" cy="88" r="5" fill="#fff" opacity="0.9"/>`,
  }),
  // ── 순찰 방해물 (얼굴이 있는 순한 모습) ──
  enemy_vacuum: (P) => ({
    defs: grad('g', '#ececf4', '#c9c9d6', '#8e8ea3') + cheekDef(P),
    body: `${shadow(P, 76)}
      <circle cx="100" cy="112" r="72" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}"/>
      <circle cx="100" cy="112" r="54" fill="none" stroke="#a8a8bc" stroke-width="4"/>
      <circle cx="100" cy="52" r="10" fill="#6cd36a" stroke="${P.ink}" stroke-width="4"/>${shine(70, 74, 14, 8)}
      ${miniFace(100, 118, P, 32)}`,
  }),
  enemy_cart: (P) => ({
    defs: grad('g', '#ff8a7a', '#e8584a', '#b8402f') + cheekDef(P),
    body: `${shadow(P, 80, 190)}
      <circle cx="58" cy="78" r="20" fill="#ff6b5b" stroke="${P.ink}" stroke-width="4.5"/><circle cx="100" cy="70" r="22" fill="#ffd84a" stroke="${P.ink}" stroke-width="4.5"/><circle cx="142" cy="80" r="18" fill="#6cc35a" stroke="${P.ink}" stroke-width="4.5"/>
      <path d="M26 92 L174 92 L160 158 L40 158 Z" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <path d="M40 112 L160 112 M44 132 L156 132" stroke="#fff" stroke-width="4" opacity="0.6"/>
      <circle cx="62" cy="174" r="14" fill="#b8b8c8" stroke="${P.ink}" stroke-width="${LINE}"/><circle cx="138" cy="174" r="14" fill="#b8b8c8" stroke="${P.ink}" stroke-width="${LINE}"/>
      ${miniFace(100, 124, P, 34)}`,
  }),
  enemy_shoot: (P) => ({
    defs: grad('g', '#e8c98a', '#c9a35a', '#9a7a3a') + cheekDef(P),
    body: `${shadow(P, 56)}
      <path d="M100 14 C130 70 152 130 148 172 L52 172 C48 130 70 70 100 14 Z" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <path d="M72 110 Q100 96 128 110 M64 140 Q100 126 136 140" stroke="#9a7a3a" stroke-width="4" fill="none"/>
      <path d="M100 16 L88 50 L112 50 Z" fill="#7cc56a" stroke="${P.ink}" stroke-width="4" stroke-linejoin="round"/>${shine(86, 70, 7, 14, 15)}
      ${miniFace(100, 128, P, 30)}`,
  }),
  enemy_skateboard: (P) => ({
    defs: grad('g', '#7fb2ff', '#2f7bff', '#1f5fd6') + cheekDef(P),
    body: `${shadow(P, 84, 182)}
      <rect x="16" y="100" width="168" height="40" rx="20" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}"/>
      <path d="M70 110 L130 110" stroke="#ffd84a" stroke-width="8" stroke-linecap="round"/>
      <circle cx="52" cy="160" r="16" fill="#ff9fb8" stroke="${P.ink}" stroke-width="${LINE}"/><circle cx="148" cy="160" r="16" fill="#ff9fb8" stroke="${P.ink}" stroke-width="${LINE}"/>
      ${shine(48, 110, 12, 5, 0)}${miniFace(100, 124, P, 26)}`,
  }),
  // ── 고치 ──
  cocoon: (P) => ({
    defs: grad('g', '#ffffff', '#e4f3d4', '#b7d99a'),
    body: `${shadow(P, 44, 192)}
      <path d="M100 4 L100 26" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="100" cy="106" rx="56" ry="82" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}"/>
      ${[52, 74, 96, 118, 140, 162].map((y) => `<path d="M${54 + Math.abs(y - 106) * 0.12} ${y - 6} Q100 ${y + 8} ${146 - Math.abs(y - 106) * 0.12} ${y - 6}" fill="none" stroke="#b7d99a" stroke-width="4" stroke-linecap="round"/>`).join('')}
      ${shine(78, 62, 10, 20, 15)}`,
  }),
};

export const PROP_KEYS = Object.keys(PROPS);
export function propSvg(P, key) {
  const { defs, body } = PROPS[key](P);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 212 212" width="212" height="212"><defs>${defs}${cheekDef(P)}</defs>${body}</svg>`;
}
