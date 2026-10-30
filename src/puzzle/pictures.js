// 블록 퍼즐 그림 5장 (600×700). 공개용 그림 파일 puzzle_p1~p5가 있으면 그것을 쓰고,
// 없으면 게임 안 캐릭터 그림으로 나라 장면을 그려 텍스처로 만든다 (systems.md 11절 "그림 만들기").
import Phaser from 'phaser';

export const PIC_W = 600;
export const PIC_H = 700;

// 장면별 그리기: g = Graphics(배경), chars = [[텍스처, 프레임, x, y, 크기]]
const SCENES = {
  // 한국: 위는 밤 골목, 가운데는 아침 시장 차양, 아래는 우리 집 창가 화분
  p1: (g) => {
    band(g, 0, 240, [0x1f2147, 0x3a3d74]);
    for (let i = 0; i < 10; i++) g.fillStyle(0xffffff, 0.8).fillCircle((i * 83) % 600, 20 + (i * 37) % 90, 2);
    g.fillStyle(0x2b2e5e, 1).fillRect(0, 130, 600, 110);
    for (let i = 0; i < 6; i++) g.fillStyle(0xffe9a8, 1).fillRect(30 + i * 100, 160, 36, 30);
    g.fillStyle(0xf7e8d2, 1).fillRect(0, 240, 600, 220);
    for (let i = 0; i < 12; i++) g.fillStyle(i % 2 ? 0xffffff : 0xe8584a, 1).fillRect(i * 50, 240, 50, 60);
    for (let i = 0; i < 12; i++) g.fillStyle(i % 2 ? 0xffffff : 0xe8584a, 1).fillCircle(i * 50 + 25, 300, 25);
    for (const [x, c] of [[90, 0xff6b5b], [170, 0xffd84a], [430, 0x6cc35a], [510, 0xff9fb8]]) g.fillStyle(0xa8664a, 1).fillRect(x - 40, 390, 80, 50).fillStyle(c, 1).fillCircle(x - 18, 386, 16).fillCircle(x + 14, 384, 18);
    g.fillStyle(0xe9d8b4, 1).fillRect(0, 460, 600, 240);
    g.fillStyle(0x8fd3ff, 1).fillRect(60, 470, 480, 150);
    g.lineStyle(22, 0xb98a5e, 1).strokeRect(60, 470, 480, 150);
    g.fillStyle(0x8f6440, 1).fillRect(30, 620, 540, 30);
    g.fillStyle(0xc96a4a, 1).fillRect(330, 560, 120, 64);
  },
  // 중국: 먼 산 위 구불구불 긴 성벽, 앞은 대나무 숲
  p2: (g) => {
    band(g, 0, 700, [0xbfe3ff, 0xe8f4d4]);
    g.fillStyle(0x9ac38a, 1).fillEllipse(140, 330, 420, 260).fillEllipse(470, 320, 400, 240);
    g.lineStyle(14, 0xc9a35a, 1);
    g.beginPath(); g.moveTo(0, 300); g.lineTo(120, 230); g.lineTo(230, 280); g.lineTo(360, 210); g.lineTo(480, 270); g.lineTo(600, 220); g.strokePath();
    for (const x of [120, 360]) g.fillStyle(0xb08a48, 1).fillRect(x - 16, 196 + (x === 120 ? 20 : 0), 32, 30);
    g.fillStyle(0xdcecc4, 1).fillRect(0, 430, 600, 270);
    for (let i = 0; i < 9; i++) {
      const x = 20 + i * 70;
      g.fillStyle(i % 2 ? 0x4f9f4c : 0x3a7a38, 1).fillRect(x, 300 + (i % 3) * 20, 22, 400);
      for (let y = 340; y < 700; y += 70) g.fillStyle(0x7cc56a, 1).fillRect(x - 2, y, 26, 6);
      g.fillStyle(0x6cc35a, 1).fillEllipse(x + 30, 330 + (i % 3) * 20, 40, 12);
    }
  },
  // 일본: 분홍 하늘, 벚꽃 나무, 연못
  p3: (g) => {
    band(g, 0, 700, [0xffe3ec, 0xfbf3f5]);
    g.fillStyle(0xcfe8b8, 1).fillRect(0, 420, 600, 280);
    for (const [x, y] of [[90, 200], [300, 150], [520, 210]]) {
      g.fillStyle(0x8f6a55, 1).fillRect(x - 12, y, 24, 260);
      for (let k = 0; k < 7; k++) g.fillStyle(k % 2 ? 0xffb7c9 : 0xffd3df, 1).fillCircle(x + Math.cos(k) * 70, y + Math.sin(k * 1.7) * 40, 50);
    }
    g.fillStyle(0x7fc7c9, 1).fillEllipse(300, 600, 440, 130);
    g.fillStyle(0xffffff, 0.5).fillEllipse(240, 585, 120, 22);
    for (const [x, c] of [[220, 0xff8a3a], [380, 0xffffff]]) g.fillStyle(c, 1).fillEllipse(x, 610, 40, 16);
    for (let i = 0; i < 25; i++) g.fillStyle(0xffb7c9, 1).fillCircle((i * 97) % 600, (i * 53) % 420, 5);
  },
  // 미국: 빌딩 숲 속 초록 공원, 분수
  p4: (g) => {
    band(g, 0, 700, [0x9fd2ff, 0xe3f2ff]);
    for (let i = 0; i < 9; i++) {
      const h = 160 + ((i * 73) % 140);
      const x = i * 68;
      g.fillStyle(i % 2 ? 0xc9714f : 0x8ea3bd, 1).fillRect(x, 360 - h, 60, h + 40);
      for (let y = 380 - h; y < 380; y += 26) for (let k = 0; k < 3; k++) g.fillStyle(0xe3edf7, 0.9).fillRect(x + 8 + k * 17, y, 10, 14);
    }
    g.fillStyle(0x6cc35a, 1).fillRect(0, 380, 600, 320);
    g.fillStyle(0x4f9f4c, 1).fillCircle(60, 400, 60).fillCircle(540, 410, 70).fillCircle(160, 380, 40);
    g.fillStyle(0xd9c7a8, 1).fillEllipse(300, 560, 600, 120);
    g.fillStyle(0xb8b8c8, 1).fillEllipse(300, 560, 220, 70);
    g.fillStyle(0x7fb2ff, 1).fillEllipse(300, 556, 190, 54);
    g.fillStyle(0xffffff, 0.8).fillRect(294, 470, 12, 80).fillCircle(300, 470, 14);
  },
  // 캐나다: 단풍 숲과 튤립 꽃밭
  p5: (g) => {
    band(g, 0, 700, [0x7fc3ff, 0xd6efff]);
    const maples = [0xc0563a, 0xe8794f, 0xd9643f, 0xf0a04b];
    for (let i = 0; i < 14; i++) g.fillStyle(maples[i % 4], 1).fillCircle(i * 48 - 10, 300 + (i % 3) * 14, 50 + (i % 2) * 12);
    g.fillStyle(0x5fb84f, 1).fillRect(0, 330, 600, 370);
    const tulips = [0xff6b5b, 0xffd84a, 0xff9fb8, 0xffffff];
    for (let row = 0; row < 9; row++) {
      const y = 350 + row * row * 4 + row * 12;
      const r = 6 + row * 2;
      for (let x = (row % 2) * r * 1.6; x < 620; x += r * 3.2) {
        g.fillStyle(0x3f8f3c, 1).fillRect(x - 1, y, 3, r);
        g.fillStyle(tulips[row % 4], 1).fillEllipse(x, y, r * 1.4, r * 1.7);
      }
    }
  },
};

const CHARS = {
  p1: [['blue_caterpillar_battle', 6, 300, 600, 190], ['npc_dot', 1, 470, 610, 80]],
  p2: [['boss_bbangbbang', 4, 380, 650, 260], ['blue_moth_battle', 6, 170, 560, 200]],
  p3: [['boss_sappuni', 4, 430, 640, 230], ['blue_moth_battle', 6, 170, 500, 190]],
  p4: [['boss_dotori', 4, 470, 690, 210], ['blue_butterfly_battle', 6, 200, 470, 220]],
  p5: [['npc_flower', 1, 300, 690, 360], ['blue_butterfly_battle', 6, 300, 400, 170], ['boss_buzzboss', 4, 500, 520, 150], ['boss_damdam', 4, 110, 690, 170]],
};

function band(g, y0, h, [c0, c1]) {
  const a = Phaser.Display.Color.ValueToColor(c0);
  const b = Phaser.Display.Color.ValueToColor(c1);
  for (let i = 0; i < 10; i++) {
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 9, i);
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1).fillRect(0, y0 + (h / 10) * i, PIC_W, h / 10 + 1);
  }
}

// 퍼즐에 쓰는 그림 키들 (불러오기를 기다릴 때 씀)
export const PICTURE_DEPENDS = [...new Set(Object.values(CHARS).flat().map((c) => c[0]))];

export function ensurePuzzlePictures(scene) {
  for (const id of Object.keys(SCENES)) {
    const key = `puzzle_${id}`;
    if (scene.textures.exists(key)) continue;
    const rt = scene.make.renderTexture({ x: 0, y: 0, width: PIC_W, height: PIC_H }, false);
    const g = scene.make.graphics({}, false);
    SCENES[id](g);
    rt.draw(g);
    for (const [tex, frame, x, y, size] of CHARS[id]) {
      if (!scene.textures.exists(tex)) continue;
      const sp = scene.make.image({ key: tex, frame }, false).setOrigin(0.5, 0.92).setDisplaySize(size, size);
      rt.draw(sp, x, y);
      sp.destroy();
    }
    rt.saveTexture(key);
    g.destroy();
  }
}
