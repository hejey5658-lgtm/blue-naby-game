import { UI } from '../data/ui.js';
import { SERIES } from '../series.js';
import { sfx } from './feedback.js';

// 게임 화면(미로·기념품 퐁퐁)의 [나가기] 버튼 (2026-11-11): 1탄 = 귀여운 파란 애벌레, 2탄 = 작은 강아지 발바닥.
// 누르면 onPress (보통 "홈으로 나갈까?" 확인 창 → PauseScene { confirmExit: true }). 손가락 칸 96×96.
const INK = 0x2b2d5a;

export function addExitButton(scene, x, y, onPress, { depth } = {}) {
  const c = scene.add.container(x, y);
  if (depth != null) c.setDepth(depth);
  const g = scene.add.graphics();
  if (SERIES.n === 2) drawPaw(g); else drawCaterpillar(g);
  const label = scene.add.text(0, 30, '나가기', { fontFamily: UI.fontTitle, fontSize: '22px', color: '#2b2d5a', stroke: '#fffaf0', strokeThickness: 6 }).setOrigin(0.5);
  c.add([g, label]);
  c.setSize(96, 96).setInteractive({ useHandCursor: true });
  c.on('pointerdown', () => c.setScale(0.92));
  c.on('pointerout', () => c.setScale(1));
  c.on('pointerup', () => { c.setScale(1); sfx('tap'); onPress(); });
  // 살짝 꼼지락
  scene.tweens.add({ targets: g, angle: { from: -4, to: 4 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return c;
}

// 파란 애벌레: 몸 마디 3개 + 큰 머리(웃는 얼굴·볼터치·더듬이), 가운데가 (0, -6)
function drawCaterpillar(g) {
  const y = -4;
  g.fillStyle(0x000000, 0.12).fillEllipse(0, y + 18, 78, 10);
  [[-30, 3, 11], [-17, -1, 13], [-2, 2, 14]].forEach(([dx, dy, r], i) => {
    g.fillStyle(INK, 1).fillCircle(dx, y + dy, r + 3);
    g.fillStyle(i % 2 ? 0x4fa3e6 : 0x7ec8ff, 1).fillCircle(dx, y + dy, r);
    g.fillStyle(0xffffff, 0.45).fillCircle(dx - r * 0.3, y + dy - r * 0.35, r * 0.28);
  });
  // 머리
  const hx = 18, hy = y - 6;
  g.lineStyle(3, INK, 1);
  g.beginPath(); g.moveTo(hx - 5, hy - 14); g.lineTo(hx - 9, hy - 26); g.strokePath();
  g.beginPath(); g.moveTo(hx + 6, hy - 14); g.lineTo(hx + 11, hy - 26); g.strokePath();
  g.fillStyle(0xffd84a, 1).fillCircle(hx - 9, hy - 27, 4).fillCircle(hx + 11, hy - 27, 4);
  g.fillStyle(INK, 1).fillCircle(hx, hy, 19);
  g.fillStyle(0x2f7bff, 1).fillCircle(hx, hy, 16);
  g.fillStyle(0xffffff, 1).fillCircle(hx - 6, hy - 3, 5).fillCircle(hx + 6, hy - 3, 5);
  g.fillStyle(INK, 1).fillCircle(hx - 5, hy - 2, 3).fillCircle(hx + 7, hy - 2, 3);
  g.fillStyle(0xffffff, 1).fillCircle(hx - 4, hy - 3.5, 1.2).fillCircle(hx + 8, hy - 3.5, 1.2);
  g.fillStyle(0xff9fb8, 0.9).fillEllipse(hx - 10, hy + 6, 7, 4).fillEllipse(hx + 11, hy + 6, 7, 4);
  g.lineStyle(2, INK, 1); g.beginPath(); g.arc(hx + 1, hy + 4, 4, 0.3, Math.PI - 0.3); g.strokePath();
}

// 강아지 발바닥: 크림색 발 + 분홍 젤리 (큰 젤리 1 + 작은 젤리 4)
function drawPaw(g) {
  const y = -6;
  g.fillStyle(0x000000, 0.12).fillEllipse(0, y + 24, 60, 9);
  // 발 바탕
  g.fillStyle(INK, 1).fillEllipse(0, y + 6, 54, 46).fillCircle(-20, y - 14, 12).fillCircle(-7, y - 21, 12).fillCircle(7, y - 21, 12).fillCircle(20, y - 14, 12);
  g.fillStyle(0xfff3e0, 1).fillEllipse(0, y + 6, 48, 40).fillCircle(-20, y - 14, 9).fillCircle(-7, y - 21, 9).fillCircle(7, y - 21, 9).fillCircle(20, y - 14, 9);
  // 젤리
  g.fillStyle(0xff9fb8, 1).fillEllipse(0, y + 9, 28, 22);
  g.fillStyle(0xff9fb8, 1).fillEllipse(-20, y - 14, 10, 11).fillEllipse(-7, y - 21, 10, 11).fillEllipse(7, y - 21, 10, 11).fillEllipse(20, y - 14, 10, 11);
  g.fillStyle(0xffffff, 0.6).fillEllipse(-4, y + 4, 8, 4).fillCircle(-22, y - 17, 2).fillCircle(-9, y - 24, 2).fillCircle(5, y - 24, 2).fillCircle(18, y - 17, 2);
}
