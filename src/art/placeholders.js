// 임시 그림: 공개용 그림 파일이 없을 때 Phaser Graphics로 그려 텍스처로 만든다.
// 텍스처 키는 art-guide.md 4절 이름 그대로. 같은 이름의 그림 파일을 넣으면 코드 수정 없이 바뀐다.
// 그림 규칙(art-guide.md 3절): 둥근 모양, 캐릭터만 외곽선 #2b2d5a(크기의 약 3%), 아래쪽 그림자 면, 위쪽 하이라이트, 큰 눈+반짝점 2개, 볼터치.

export const PAL = {
  ink: 0x2b2d5a,
  cheek: 0xff9fb8,
  white: 0xffffff,
  caterpillar: { body: 0x7ec8ff, shade: 0x4fa3e6, belly: 0xd6efff },
};

// 100×100 단위로 설계한 그림을 size 픽셀 텍스처로 만든다.
// 그림 파일이 이미 있으면 건너뛴다. 임시 그림은 한 칸짜리지만 프레임 0을 붙여
// 스프라이트 시트와 같은 방식(frame 0)으로 쓸 수 있게 한다.
function makeTexture(scene, key, size, draw) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const s = size / 100;
  draw(g, s);
  g.generateTexture(key, size, size);
  g.destroy();
  scene.textures.get(key).add(0, 0, 0, 0, size, size);
}

// 외곽선 → 그림자 면 → 몸 → 하이라이트 순서로 동그란 마디 하나
function blob(g, s, x, y, r, c) {
  const line = 3.4;
  g.fillStyle(PAL.ink, 1).fillCircle(x * s, y * s, (r + line) * s);
  g.fillStyle(c.shade, 1).fillCircle(x * s, y * s, r * s);
  g.fillStyle(c.body, 1).fillCircle((x - r * 0.06) * s, (y - r * 0.12) * s, r * 0.9 * s);
  g.fillStyle(PAL.white, 0.75).fillCircle((x - r * 0.38) * s, (y - r * 0.42) * s, r * 0.2 * s);
}

function eye(g, s, x, y, r) {
  g.fillStyle(PAL.ink, 1).fillEllipse(x * s, y * s, r * 2 * s, r * 2.3 * s);
  g.fillStyle(PAL.white, 1).fillCircle((x - r * 0.3) * s, (y - r * 0.45) * s, r * 0.42 * s);
  g.fillStyle(PAL.white, 1).fillCircle((x + r * 0.35) * s, (y + r * 0.35) * s, r * 0.2 * s);
}

function drawCaterpillar(g, s) {
  const c = PAL.caterpillar;
  // 바닥 그림자
  g.fillStyle(PAL.ink, 0.14).fillEllipse(50 * s, 90 * s, 80 * s, 10 * s);
  // 꼬리 하트
  g.fillStyle(PAL.cheek, 1);
  g.fillCircle(9 * s, 70 * s, 4 * s).fillCircle(15 * s, 70 * s, 4 * s);
  g.fillTriangle(5.4 * s, 71.5 * s, 18.6 * s, 71.5 * s, 12 * s, 79 * s);
  // 몸 마디 (꼬리 → 머리)
  blob(g, s, 22, 76, 11, c);
  blob(g, s, 38, 72, 13, c);
  blob(g, s, 55, 66, 15, c);
  // 마디 점무늬
  g.fillStyle(c.belly, 1).fillCircle(38 * s, 76 * s, 3 * s).fillCircle(55 * s, 71 * s, 3.4 * s);
  // 더듬이
  g.lineStyle(3 * s, PAL.ink, 1);
  g.lineBetween(64 * s, 26 * s, 60 * s, 12 * s);
  g.lineBetween(80 * s, 26 * s, 86 * s, 12 * s);
  g.fillStyle(PAL.ink, 1).fillCircle(60 * s, 11 * s, 4 * s).fillCircle(86 * s, 11 * s, 4 * s);
  // 머리
  blob(g, s, 72, 44, 22, c);
  eye(g, s, 64, 42, 5.2);
  eye(g, s, 82, 42, 5.2);
  g.fillStyle(PAL.cheek, 0.85).fillEllipse(58 * s, 53 * s, 9 * s, 5.5 * s).fillEllipse(88 * s, 53 * s, 9 * s, 5.5 * s);
  // 웃는 입
  g.lineStyle(2.6 * s, PAL.ink, 1);
  g.beginPath();
  g.arc(73 * s, 51 * s, 4.5 * s, 0.15 * Math.PI, 0.85 * Math.PI, false);
  g.strokePath();
}

export function createPlaceholders(scene) {
  makeTexture(scene, 'blue_caterpillar', 128, drawCaterpillar);
  makeTexture(scene, 'blue_caterpillar_battle', 480, drawCaterpillar);
}
