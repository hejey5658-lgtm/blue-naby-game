// 직접 그린 아이콘 (이모지·특수문자 대신). 크기 s는 아이콘 한 변 길이.
const INK = 0x2b2d5a;

export function iconSkip(g, cx, cy, s, color = INK) {
  const h = s * 0.5;
  g.fillStyle(color, 1);
  g.fillTriangle(cx - s * 0.45, cy - h / 2 - 2, cx - s * 0.45, cy + h / 2 + 2, cx - s * 0.02, cy);
  g.fillTriangle(cx + s * 0.02, cy - h / 2 - 2, cx + s * 0.02, cy + h / 2 + 2, cx + s * 0.45, cy);
}

export function iconGear(g, cx, cy, s, color = INK) {
  const r = s * 0.32;
  g.fillStyle(color, 1);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.fillCircle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, s * 0.11);
  }
  g.fillCircle(cx, cy, r);
  g.fillStyle(0xffffff, 1).fillCircle(cx, cy, r * 0.42);
}

export function iconClose(g, cx, cy, s, color = INK) {
  g.lineStyle(s * 0.14, color, 1);
  const d = s * 0.3;
  g.lineBetween(cx - d, cy - d, cx + d, cy + d);
  g.lineBetween(cx + d, cy - d, cx - d, cy + d);
}

// 대사창 오른쪽 아래 '톡' 표시 (다음 대사가 있음)
export function iconNext(g, cx, cy, s, color = INK) {
  g.fillStyle(color, 1).fillTriangle(cx - s / 2, cy - s / 3, cx + s / 2, cy - s / 3, cx, cy + s / 3);
}

export function iconPuzzle(g, cx, cy, s, color = INK) {
  const q = s * 0.36;
  g.fillStyle(color, 1);
  g.fillRoundedRect(cx - q, cy - q, q * 2, q * 2, s * 0.08);
  g.fillCircle(cx, cy - q, s * 0.13);
  g.fillCircle(cx + q, cy, s * 0.13);
  g.fillStyle(0xffffff, 1).fillCircle(cx - q, cy, s * 0.12);
}
