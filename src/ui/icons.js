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

// ── 대결 버튼 아이콘 ──
// 놀자: 마주 잡은 두 동그란 손
export function iconPlay(g, cx, cy, s, color = INK) {
  g.fillStyle(color, 1);
  g.fillCircle(cx - s * 0.2, cy, s * 0.22).fillCircle(cx + s * 0.2, cy, s * 0.22);
  g.fillRoundedRect(cx - s * 0.2, cy - s * 0.12, s * 0.4, s * 0.24, s * 0.1);
  g.fillCircle(cx, cy - s * 0.32, s * 0.08);
}

// 꼬옥 버티기: 둥근 방패
export function iconGuard(g, cx, cy, s, color = INK) {
  g.fillStyle(color, 1);
  g.fillPoints([
    { x: cx - s * 0.36, y: cy - s * 0.36 }, { x: cx + s * 0.36, y: cy - s * 0.36 },
    { x: cx + s * 0.32, y: cy + s * 0.08 }, { x: cx, y: cy + s * 0.42 }, { x: cx - s * 0.32, y: cy + s * 0.08 },
  ], true);
  g.fillStyle(0xffffff, 0.5).fillRoundedRect(cx - s * 0.06, cy - s * 0.26, s * 0.12, s * 0.48, s * 0.05);
}

// 특기·별
export function iconStar(g, cx, cy, s, color = INK) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? s * 0.2 : s * 0.46;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  g.fillStyle(color, 1).fillPoints(pts, true);
}

// 냠냠 간식: 잎사귀
export function iconLeaf(g, cx, cy, s, color = INK) {
  g.fillStyle(color, 1).fillEllipse(cx, cy, s * 0.5, s * 0.8);
  g.lineStyle(s * 0.06, 0xffffff, 0.7).lineBetween(cx, cy - s * 0.3, cx, cy + s * 0.36);
}

// 보스 다음 기술 표시
export function iconBossMove(g, cx, cy, s, move) {
  const c = { attack: 0x8e8ea3, rush: 0xe8584a, hide: 0x9a8bb5, wrap: 0xa77bd6, heal: 0xff9fb8 }[move] ?? INK;
  g.fillStyle(c, 1);
  if (move === 'attack') {
    g.fillCircle(cx - s * 0.18, cy + s * 0.05, s * 0.2).fillCircle(cx + s * 0.16, cy + s * 0.05, s * 0.22).fillCircle(cx, cy - s * 0.14, s * 0.22);
  } else if (move === 'rush') {
    for (const o of [-0.18, 0.12]) g.fillTriangle(cx + s * (o - 0.14), cy - s * 0.3, cx + s * (o - 0.14), cy + s * 0.3, cx + s * (o + 0.2), cy);
  } else if (move === 'hide') {
    g.fillCircle(cx, cy, s * 0.36);
    g.fillStyle(0xffffff, 0.8).fillRect(cx - s * 0.2, cy - s * 0.04, s * 0.4, s * 0.08);
  } else if (move === 'wrap') {
    g.lineStyle(s * 0.1, c, 1);
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 4;
      const r = s * 0.04 + (i / 40) * s * 0.34;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.strokePath();
  } else if (move === 'heal') {
    g.fillCircle(cx - s * 0.16, cy - s * 0.08, s * 0.2).fillCircle(cx + s * 0.16, cy - s * 0.08, s * 0.2);
    g.fillTriangle(cx - s * 0.36, cy, cx + s * 0.36, cy, cx, cy + s * 0.4);
  }
}
