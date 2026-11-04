// 2탄 기념품 퐁퐁 「서울 사계절판」 그림: 1탄 icons.js 와 같은 그림체(100 단위, 외곽선 #2b2d5a, 그라데이션 없이 겹친 도형).
const INK = 0x2b2d5a;
export const DRAW2 = {
  // 벚꽃 한 송이 (분홍 다섯 잎)
  pop_blossom(g, s) {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      g.fillStyle(INK, 1).fillCircle((50 + Math.cos(a) * 24) * s, (52 + Math.sin(a) * 24) * s, 20 * s);
    }
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      g.fillStyle(0xffc2d6, 1).fillCircle((50 + Math.cos(a) * 24) * s, (52 + Math.sin(a) * 24) * s, 16 * s);
    }
    g.fillStyle(0xffe9a8, 1).fillCircle(50 * s, 52 * s, 10 * s);
    g.fillStyle(0xffffff, 0.7).fillEllipse(40 * s, 30 * s, 10 * s, 6 * s);
  },
  // 방패연 (가운데 동그란 구멍, 꼬리 끈)
  pop_kite(g, s) {
    g.fillStyle(INK, 1).fillRoundedRect(20 * s, 12 * s, 60 * s, 66 * s, 8 * s);
    g.fillStyle(0xfffaf0, 1).fillRoundedRect(25 * s, 17 * s, 50 * s, 56 * s, 6 * s);
    g.fillStyle(0x2f7bff, 1).fillRect(25 * s, 17 * s, 50 * s, 10 * s);
    g.fillStyle(0xe8584a, 1).fillRect(25 * s, 63 * s, 50 * s, 10 * s);
    g.fillStyle(INK, 1).fillCircle(50 * s, 45 * s, 11 * s);
    g.fillStyle(0xd6efff, 1).fillCircle(50 * s, 45 * s, 8 * s);
    g.lineStyle(3 * s, INK, 1).lineBetween(50 * s, 78 * s, 42 * s, 96 * s);
  },
  // 부채 (파란 반원 + 손잡이)
  pop_fan(g, s) {
    g.fillStyle(INK, 1).fillRect(46 * s, 56 * s, 8 * s, 36 * s);
    g.fillStyle(0xc98a5a, 1).fillRect(48 * s, 58 * s, 4 * s, 32 * s);
    g.fillStyle(INK, 1).fillCircle(50 * s, 50 * s, 38 * s);
    g.fillStyle(0x7fc7ff, 1).fillCircle(50 * s, 50 * s, 33 * s);
    g.fillStyle(0xffffff, 1).fillCircle(50 * s, 50 * s, 16 * s);
    g.fillStyle(0xe8584a, 1).fillCircle(50 * s, 50 * s, 9 * s);
    g.fillStyle(0xffffff, 0.6).fillEllipse(34 * s, 32 * s, 12 * s, 7 * s);
  },
  // 아이스크림 콘
  pop_icecream(g, s) {
    g.fillStyle(INK, 1).fillTriangle(28 * s, 48 * s, 72 * s, 48 * s, 50 * s, 96 * s);
    g.fillStyle(0xe0aa7e, 1).fillTriangle(33 * s, 51 * s, 67 * s, 51 * s, 50 * s, 89 * s);
    g.fillStyle(INK, 1).fillCircle(50 * s, 38 * s, 26 * s);
    g.fillStyle(0xffc2d6, 1).fillCircle(50 * s, 38 * s, 22 * s);
    g.fillStyle(0xffffff, 0.7).fillEllipse(40 * s, 28 * s, 10 * s, 6 * s);
    g.fillStyle(0xe8584a, 1).fillCircle(56 * s, 16 * s, 6 * s);
  },
  // 군밤 (갈색 밤 + 노란 속살 틈)
  pop_roastnut(g, s) {
    g.fillStyle(INK, 0.12).fillEllipse(50 * s, 86 * s, 60 * s, 10 * s);
    g.fillStyle(INK, 1).fillEllipse(50 * s, 54 * s, 70 * s, 64 * s);
    g.fillStyle(0xa8673c, 1).fillEllipse(50 * s, 54 * s, 62 * s, 56 * s);
    g.fillStyle(0xffd84a, 1).fillEllipse(50 * s, 40 * s, 30 * s, 12 * s);
    g.fillStyle(0xe0aa7e, 1).fillEllipse(50 * s, 72 * s, 44 * s, 14 * s);
    g.fillStyle(0xffffff, 0.6).fillEllipse(36 * s, 44 * s, 8 * s, 12 * s);
  },
  // 감 (주황 동그라미 + 초록 꼭지)
  pop_persimmon(g, s) {
    g.fillStyle(INK, 1).fillCircle(50 * s, 56 * s, 36 * s);
    g.fillStyle(0xf59a3b, 1).fillCircle(50 * s, 56 * s, 31 * s);
    g.fillStyle(INK, 1).fillEllipse(50 * s, 26 * s, 40 * s, 14 * s);
    g.fillStyle(0x6cc35a, 1).fillEllipse(50 * s, 26 * s, 34 * s, 9 * s);
    g.fillStyle(INK, 1).fillRect(47 * s, 12 * s, 6 * s, 12 * s);
    g.fillStyle(0xffffff, 0.6).fillEllipse(36 * s, 44 * s, 10 * s, 14 * s);
  },
  // 붕어빵 (금빛 물고기 모양 빵)
  pop_bungeo(g, s) {
    g.fillStyle(INK, 1).fillEllipse(44 * s, 52 * s, 70 * s, 46 * s);
    g.fillStyle(INK, 1).fillTriangle(70 * s, 52 * s, 96 * s, 30 * s, 96 * s, 74 * s);
    g.fillStyle(0xe8a850, 1).fillEllipse(44 * s, 52 * s, 62 * s, 38 * s);
    g.fillStyle(0xe8a850, 1).fillTriangle(72 * s, 52 * s, 91 * s, 36 * s, 91 * s, 68 * s);
    g.lineStyle(2.5 * s, 0xc0763a, 1);
    for (const x of [40, 50, 60]) g.strokeCircle(x * s, 54 * s, 6 * s);
    g.fillStyle(INK, 1).fillCircle(24 * s, 46 * s, 4 * s);
    g.fillStyle(0xffffff, 0.6).fillEllipse(30 * s, 38 * s, 12 * s, 5 * s);
  },
  // 벙어리장갑 (빨강 + 흰 털 손목)
  pop_mitten(g, s) {
    g.fillStyle(INK, 1).fillRoundedRect(26 * s, 14 * s, 46 * s, 62 * s, 22 * s);
    g.fillStyle(INK, 1).fillEllipse(72 * s, 44 * s, 24 * s, 30 * s);
    g.fillStyle(0xe8584a, 1).fillRoundedRect(30 * s, 18 * s, 38 * s, 56 * s, 19 * s);
    g.fillStyle(0xe8584a, 1).fillEllipse(71 * s, 44 * s, 17 * s, 23 * s);
    g.fillStyle(INK, 1).fillRoundedRect(22 * s, 70 * s, 54 * s, 22 * s, 10 * s);
    g.fillStyle(0xffffff, 1).fillRoundedRect(26 * s, 73 * s, 46 * s, 16 * s, 8 * s);
    g.fillStyle(0xffffff, 0.6).fillEllipse(40 * s, 30 * s, 8 * s, 14 * s);
  },
};
