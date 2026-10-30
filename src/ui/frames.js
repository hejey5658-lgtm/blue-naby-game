// 장마다 다른 '창틀' 판 (docs/design-brief.md "창문이 넓어진다", concept-v2 5절).
// 장이 갈수록 틀이 얇아지고 넓어지다 캐나다(cloud)에서는 틀 없이 구름 판이 된다.
// 대사창·일시정지·설정 같은 판은 모두 여기서 그린다.
const INK = 0x2b2d5a;

export const FRAME_STYLE = {
  woodWindow: { border: 18, outer: 0x8f6440, mid: 0xb98a5e, light: 0xd2a679, fill: 0xfffaf0, text: '#2b2d5a', name: 0xb98a5e },
  litWindow:  { border: 14, outer: 0x1f2147, mid: 0x3a3d74, light: 0xffe9a8, fill: 0xfdf6e3, text: '#2b2d5a', name: 0x3a3d74 },
  awning:     { border: 10, outer: 0xa8664a, mid: 0xe8584a, light: 0xffffff, fill: 0xfffaf0, text: '#2b2d5a', name: 0xe8584a },
  moonGate:   { border: 10, outer: 0x8a3b2e, mid: 0xb5523b, light: 0xe9b38a, fill: 0xfbf7ee, text: '#2b2d5a', name: 0xb5523b },
  lattice:    { border: 7,  outer: 0x7a5a3e, mid: 0xa98463, light: 0xe8d3bd, fill: 0xfffdf8, text: '#2b2d5a', name: 0xd9708a },
  cityGlass:  { border: 4,  outer: 0x5d6f86, mid: 0x8ea3bd, light: 0xe3edf7, fill: 0xf7fbff, text: '#2b2d5a', name: 0x4f6d8f },
  cloud:      { border: 0,  outer: 0xffffff, mid: 0xffffff, light: 0xffffff, fill: 0xffffff, text: '#2b2d5a', name: 0x2f7bff },
};

// g: Phaser Graphics. (x, y) 왼쪽 위, w×h 판 크기.
export function drawPanel(g, x, y, w, h, frame = 'woodWindow') {
  const st = FRAME_STYLE[frame] ?? FRAME_STYLE.woodWindow;
  const b = st.border;
  const r = 28;
  // 바닥 그림자 (부드럽게 두 겹)
  g.fillStyle(INK, 0.08).fillRoundedRect(x + 4, y + 12, w, h, r + 4);
  g.fillStyle(INK, 0.1).fillRoundedRect(x + 2, y + 7, w, h, r);

  switch (frame) {
    case 'cloud': {
      // 틀 없는 구름 판: 위쪽이 몽글몽글
      g.fillStyle(0xffffff, 1);
      for (let cx = x + 50; cx < x + w - 30; cx += 70) g.fillCircle(cx, y + 8, 34 + ((cx / 70) % 2) * 8);
      g.fillRoundedRect(x, y, w, h, 40);
      return st;
    }
    case 'awning': {
      g.fillStyle(st.outer, 1).fillRoundedRect(x, y, w, h, r);
      g.fillStyle(st.fill, 1).fillRoundedRect(x + b, y + b, w - b * 2, h - b * 2, r - 6);
      // 위쪽 줄무늬 차양 끝단 (물결)
      const stripe = 48;
      for (let i = 0; i * stripe < w; i++) {
        g.fillStyle(i % 2 ? 0xffffff : st.mid, 1);
        const sx = x + i * stripe;
        const sw = Math.min(stripe, x + w - sx);
        g.fillRect(sx, y - 18, sw, 26);
        g.fillCircle(sx + sw / 2, y + 8, sw / 2);
      }
      g.lineStyle(3, st.outer, 1).lineBetween(x + 8, y - 18, x + w - 8, y - 18);
      return st;
    }
    case 'moonGate': {
      // 둥근 정원 문: 판 위쪽 가운데가 동그랗게 열린 모양
      g.fillStyle(st.outer, 1).fillRoundedRect(x, y, w, h, 46);
      g.fillStyle(st.mid, 1).fillRoundedRect(x + 3, y + 3, w - 6, h - 8, 44);
      g.fillStyle(st.fill, 1).fillRoundedRect(x + b, y + b, w - b * 2, h - b * 2, 38);
      g.lineStyle(3, st.light, 1).strokeCircle(x + w / 2, y + b - 2, 26);
      g.fillStyle(st.mid, 1).fillCircle(x + w / 2, y + b - 2, 22);
      g.fillStyle(st.light, 1).fillCircle(x + w / 2, y + b - 2, 10);
      return st;
    }
    case 'lattice': {
      g.fillStyle(st.outer, 1).fillRoundedRect(x, y, w, h, 18);
      g.fillStyle(st.fill, 1).fillRoundedRect(x + b, y + b, w - b * 2, h - b * 2, 14);
      // 위쪽 얇은 나무 격자 띠
      g.lineStyle(2, st.mid, 0.55);
      for (let lx = x + b + 40; lx < x + w - b; lx += 40) g.lineBetween(lx, y + b, lx, y + b + 22);
      g.lineBetween(x + b, y + b + 22, x + w - b, y + b + 22);
      return st;
    }
    case 'cityGlass': {
      g.fillStyle(st.outer, 1).fillRoundedRect(x, y, w, h, 16);
      g.fillStyle(st.fill, 1).fillRoundedRect(x + b, y + b, w - b * 2, h - b * 2, 13);
      // 유리 반사 빗금
      g.fillStyle(st.light, 0.9);
      g.fillTriangle(x + w - 120, y + b, x + w - 90, y + b, x + w - 150, y + h * 0.5);
      g.fillTriangle(x + w - 80, y + b, x + w - 70, y + b, x + w - 110, y + h * 0.35);
      return st;
    }
    case 'litWindow': {
      g.fillStyle(st.outer, 1).fillRoundedRect(x, y, w, h, r);
      g.lineStyle(4, st.light, 0.9).strokeRoundedRect(x + b * 0.5, y + b * 0.5, w - b, h - b, r - 6);
      g.fillStyle(st.fill, 1).fillRoundedRect(x + b, y + b, w - b * 2, h - b * 2, r - 8);
      return st;
    }
    default: {
      // 나무 창틀: 진한 바깥 → 나무 → 위쪽 밝은 결
      g.fillStyle(st.outer, 1).fillRoundedRect(x, y, w, h, r);
      g.fillStyle(st.mid, 1).fillRoundedRect(x + 4, y + 3, w - 8, h - 9, r - 2);
      g.fillStyle(st.light, 1).fillRoundedRect(x + 14, y + 6, w - 28, 6, 3);
      g.fillStyle(st.fill, 1).fillRoundedRect(x + b, y + b, w - b * 2, h - b * 2, r - 10);
      return st;
    }
  }
}
