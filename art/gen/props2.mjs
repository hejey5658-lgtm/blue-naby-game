// 2탄 수집품·순찰 방해물(SVG). 1탄 props.mjs 와 같은 그림체: 200×200 단위, 외곽선 6, 방사형 그라데이션, 하이라이트, 그림자.
// 방해물도 무섭지 않게 작은 얼굴(눈·볼)을 단다. 사람은 그리지 않는다(빈 자전거·물총·썰매가 스스로 굴러다니는 느낌).
const LINE = 6;
const grad = (id, light, mid, dark) => `<radialGradient id="${id}" cx="35%" cy="30%" r="75%">
  <stop offset="0" stop-color="${light}"/><stop offset="0.55" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`;
const cheekDef = (P) => `<radialGradient id="pcheek" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${P.cheek}" stop-opacity="0.95"/><stop offset="1" stop-color="${P.cheek}" stop-opacity="0"/></radialGradient>`;
const shadow = (P, rx = 60, cy = 186) => `<ellipse cx="100" cy="${cy}" rx="${rx}" ry="8" fill="${P.ink}" opacity="0.14"/>`;
const shine = (x, y, rx = 10, ry = 6, rot = -30) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="0.8" transform="rotate(${rot} ${x} ${y})"/>`;
const miniFace = (cx, cy, P, gap = 26) => `
  <ellipse cx="${cx - gap / 2}" cy="${cy}" rx="5" ry="6.5" fill="${P.ink}"/><ellipse cx="${cx + gap / 2}" cy="${cy}" rx="5" ry="6.5" fill="${P.ink}"/>
  <circle cx="${cx - gap / 2 - 1.5}" cy="${cy - 2}" r="1.8" fill="#fff"/><circle cx="${cx + gap / 2 - 1.5}" cy="${cy - 2}" r="1.8" fill="#fff"/>
  <ellipse cx="${cx - gap * 0.95}" cy="${cy + 9}" rx="8" ry="5" fill="url(#pcheek)"/><ellipse cx="${cx + gap * 0.95}" cy="${cy + 9}" rx="8" ry="5" fill="url(#pcheek)"/>
  <path d="M${cx - 5} ${cy + 9} Q${cx} ${cy + 14} ${cx + 5} ${cy + 9}" fill="none" stroke="${P.ink}" stroke-width="3" stroke-linecap="round"/>`;

const PROPS2 = {
  // 개나리꽃: 노란 네 잎 꽃 두 송이 + 가지
  item_forsythia: (P) => {
    const fl = (cx, cy, r) => [0, 1, 2, 3].map((i) => {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      const x = cx + Math.cos(a) * r * 0.7, y = cy + Math.sin(a) * r * 0.7;
      return `<ellipse cx="${x}" cy="${y}" rx="${r * 0.62}" ry="${r * 0.36}" fill="url(#g)" stroke="${P.ink}" stroke-width="${r > 30 ? LINE : 4.5}" transform="rotate(${(a * 180) / Math.PI} ${x} ${y})"/>`;
    }).join('') + `<circle cx="${cx}" cy="${cy}" r="${r * 0.26}" fill="#f0a020" stroke="${P.ink}" stroke-width="3.5"/>`;
    return {
      defs: grad('g', '#fff3a0', '#ffd84a', '#f0b52a'),
      body: `${shadow(P, 44)}<path d="M40 176 Q90 140 150 60" fill="none" stroke="${P.ink}" stroke-width="12" stroke-linecap="round"/><path d="M40 176 Q90 140 150 60" fill="none" stroke="#8f6a55" stroke-width="6" stroke-linecap="round"/>
        ${fl(96, 108, 52)}${fl(150, 56, 26)}${shine(76, 86)}`,
    };
  },
  // 수박 조각: 반달 모양, 빨간 속·초록 껍질·까만 씨
  item_watermelon: (P) => ({
    defs: grad('g', '#ffb3a8', '#ff6b5b', '#e0453a'),
    body: `${shadow(P, 66)}
      <path d="M24 70 A76 76 0 0 0 176 70 Z" fill="#4f9f4c" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <path d="M38 70 A62 62 0 0 0 162 70 Z" fill="#e8f6c8"/>
      <path d="M46 70 A54 54 0 0 0 154 70 Z" fill="url(#g)"/>
      <path d="M24 70 L176 70" stroke="${P.ink}" stroke-width="${LINE}" stroke-linecap="round"/>
      ${[[70, 92], [100, 104], [130, 92], [86, 120], [114, 120]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="6.5" fill="${P.ink}"/>`).join('')}
      ${shine(66, 82, 10, 5, 0)}`,
  }),
  // 은행잎: 노란 부채 모양
  item_ginkgo: (P) => ({
    defs: grad('g', '#fff0a0', '#ffd03a', '#e8a820'),
    body: `${shadow(P, 50)}
      <path d="M100 150 C 40 150, 20 80, 34 44 Q100 20 166 44 C 180 80, 160 150, 100 150 Z" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <path d="M100 34 L100 70" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>
      <path d="M100 148 L60 56 M100 148 L82 44 M100 148 L118 44 M100 148 L140 56" stroke="#e0a020" stroke-width="3" stroke-linecap="round"/>
      <path d="M100 150 L104 186" stroke="${P.ink}" stroke-width="7" stroke-linecap="round"/>${shine(62, 66, 12, 7)}`,
  }),
  // 눈송이: 여섯 갈래 + 가운데 동그라미
  item_snowflake: (P) => {
    let arms = '';
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 2;
      const x = 100 + Math.cos(a) * 70, y = 100 + Math.sin(a) * 70;
      const bx = 100 + Math.cos(a) * 44, by = 100 + Math.sin(a) * 44;
      const l = (s) => `${bx + Math.cos(a + s) * 22},${by + Math.sin(a + s) * 22}`;
      arms += `<path d="M100 100 L${x} ${y} M${bx} ${by} L${l(0.8)} M${bx} ${by} L${l(-0.8)}" stroke="${P.ink}" stroke-width="16" stroke-linecap="round"/>
        <path d="M100 100 L${x} ${y} M${bx} ${by} L${l(0.8)} M${bx} ${by} L${l(-0.8)}" stroke="#bfe3ff" stroke-width="8" stroke-linecap="round"/>`;
    }
    return { defs: grad('g', '#ffffff', '#e6f4ff', '#a8d4ff'), body: `${shadow(P, 40)}${arms}<circle cx="100" cy="100" r="24" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}"/>${shine(92, 92, 6, 4)}` };
  },
  // ── 순찰 방해물 ──
  // 자전거: 바퀴 두 개 + 하늘색 몸통, 바구니에 꽃
  enemy_bike: (P) => {
    const wheel = (x) => `<circle cx="${x}" cy="140" r="34" fill="none" stroke="${P.ink}" stroke-width="12"/><circle cx="${x}" cy="140" r="34" fill="none" stroke="#5d6f86" stroke-width="6"/>
      <circle cx="${x}" cy="140" r="7" fill="${P.ink}"/><path d="M${x - 24} 140 L${x + 24} 140 M${x} 116 L${x} 164" stroke="#8ea3bd" stroke-width="3"/>`;
    return {
      defs: grad('g', '#bfe3ff', '#7fb2ff', '#4f8dff'),
      body: `${shadow(P, 80)}${wheel(52)}${wheel(148)}
        <path d="M52 140 L86 92 L132 92 L148 140 M86 92 L104 140 L132 92" fill="none" stroke="${P.ink}" stroke-width="13" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="M52 140 L86 92 L132 92 L148 140 M86 92 L104 140 L132 92" fill="none" stroke="url(#g)" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="M80 80 L100 80" stroke="${P.ink}" stroke-width="10" stroke-linecap="round"/>
        <path d="M132 92 L140 64 L156 62" fill="none" stroke="${P.ink}" stroke-width="7" stroke-linecap="round"/>
        <path d="M148 64 L176 64 L170 90 L152 90 Z" fill="#e0aa7e" stroke="${P.ink}" stroke-width="4.5" stroke-linejoin="round"/>
        <circle cx="158" cy="58" r="7" fill="#ffd84a" stroke="${P.ink}" stroke-width="3"/><circle cx="170" cy="56" r="6" fill="#ffc2d6" stroke="${P.ink}" stroke-width="3"/>
        ${miniFace(162, 78, P, 10)}`,
    };
  },
  // 물총: 통통한 주황 물총, 앞에서 물방울
  enemy_watergun: (P) => ({
    defs: grad('g', '#ffd3a0', '#ff9f43', '#e07a20'),
    body: `${shadow(P, 66)}
      <path d="M40 80 Q40 56 64 56 L150 56 Q170 56 170 76 L170 96 Q170 112 150 112 L104 112 L96 160 Q94 172 80 172 L66 172 Q54 172 58 158 L66 112 L60 112 Q40 112 40 92 Z" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>
      <rect x="170" y="70" width="16" height="20" rx="6" fill="#2f7bff" stroke="${P.ink}" stroke-width="5"/>
      <ellipse cx="96" cy="40" rx="22" ry="16" fill="#7fc7ff" stroke="${P.ink}" stroke-width="5"/>
      <ellipse cx="190" cy="54" rx="6" ry="9" fill="#7fc7ff" stroke="${P.ink}" stroke-width="3"/>
      ${shine(68, 70, 12, 6, -10)}${miniFace(112, 82, P, 24)}`,
  }),
  // 밤송이: 동글동글 가시 공 (가시 끝은 둥글게)
  enemy_chestnut: (P) => {
    let sp = '';
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      sp += `<path d="M${100 + Math.cos(a) * 52} ${108 + Math.sin(a) * 52} L${100 + Math.cos(a) * 76} ${108 + Math.sin(a) * 76}" stroke="${P.ink}" stroke-width="12" stroke-linecap="round"/>
        <path d="M${100 + Math.cos(a) * 52} ${108 + Math.sin(a) * 52} L${100 + Math.cos(a) * 74} ${108 + Math.sin(a) * 74}" stroke="#a8c94a" stroke-width="5" stroke-linecap="round"/>`;
    }
    return { defs: grad('g', '#d8ec9a', '#a8c94a', '#7a9a30'), body: `${shadow(P, 66)}${sp}<circle cx="100" cy="108" r="58" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}"/>
      <path d="M70 112 Q100 70 130 112 Q100 140 70 112 Z" fill="#a8673c" stroke="${P.ink}" stroke-width="4.5"/>${shine(78, 80)}${miniFace(100, 128, P, 30)}` };
  },
  // 눈썰매: 빨간 나무 썰매, 위에 작은 눈덩이
  enemy_sled: (P) => ({
    defs: grad('g', '#ffb3a8', '#e8584a', '#c0453a'),
    body: `${shadow(P, 78)}
      <path d="M24 150 Q24 172 46 172 L170 172 Q186 172 186 156" fill="none" stroke="${P.ink}" stroke-width="12" stroke-linecap="round"/>
      <path d="M24 150 Q24 172 46 172 L170 172 Q186 172 186 156" fill="none" stroke="#c9d6f5" stroke-width="6" stroke-linecap="round"/>
      <path d="M60 172 L64 148 M140 172 L136 148" stroke="${P.ink}" stroke-width="8"/>
      <rect x="34" y="114" width="138" height="38" rx="12" fill="url(#g)" stroke="${P.ink}" stroke-width="${LINE}"/>
      <path d="M58 118 L58 148 M86 118 L86 148 M114 118 L114 148 M142 118 L142 148" stroke="#c0453a" stroke-width="3" opacity="0.6"/>
      <circle cx="100" cy="88" r="30" fill="#ffffff" stroke="${P.ink}" stroke-width="${LINE}"/>
      ${shine(56, 126, 12, 5, 0)}${miniFace(100, 86, P, 22)}`,
  }),
};

export const PROP2_KEYS = Object.keys(PROPS2);
export function prop2Svg(P, key) {
  const { defs, body } = PROPS2[key](P);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 212 212" width="212" height="212"><defs>${defs}${cheekDef(P)}</defs>${body}</svg>`;
}
