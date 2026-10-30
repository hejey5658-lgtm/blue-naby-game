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

// 잎사귀 (1장 수집품): 통통한 초록 잎 + 잎맥 + 하이라이트
function drawLeaf(g, s) {
  g.fillStyle(PAL.ink, 0.14).fillEllipse(50 * s, 88 * s, 46 * s, 8 * s);
  g.fillStyle(PAL.ink, 1).fillEllipse(50 * s, 50 * s, 56 * s, 76 * s);
  g.fillStyle(0x3f8f3c, 1).fillEllipse(50 * s, 50 * s, 48 * s, 68 * s);
  g.fillStyle(0x6cc35a, 1).fillEllipse(46 * s, 46 * s, 38 * s, 58 * s);
  g.lineStyle(3 * s, 0x3f8f3c, 1).lineBetween(50 * s, 22 * s, 50 * s, 82 * s);
  g.lineBetween(50 * s, 44 * s, 38 * s, 34 * s).lineBetween(50 * s, 58 * s, 62 * s, 48 * s);
  g.lineStyle(4 * s, PAL.ink, 1).lineBetween(50 * s, 84 * s, 54 * s, 94 * s);
  g.fillStyle(PAL.white, 0.8).fillEllipse(40 * s, 34 * s, 8 * s, 14 * s);
}

// 윙윙 청소기 (1장 순찰): 둥근 로봇청소기, 초록 불빛, 졸린 듯 귀여운 눈
function drawVacuum(g, s) {
  g.fillStyle(PAL.ink, 0.16).fillEllipse(50 * s, 86 * s, 80 * s, 12 * s);
  g.fillStyle(PAL.ink, 1).fillCircle(50 * s, 52 * s, 40 * s);
  g.fillStyle(0x8e8ea3, 1).fillCircle(50 * s, 52 * s, 36 * s);
  g.fillStyle(0xc9c9d6, 1).fillCircle(48 * s, 48 * s, 31 * s);
  g.fillStyle(0xe6e6ee, 1).fillCircle(44 * s, 42 * s, 12 * s);
  g.fillStyle(0x6cd36a, 1).fillCircle(50 * s, 30 * s, 6 * s);
  g.fillStyle(PAL.white, 0.9).fillCircle(48 * s, 28 * s, 2 * s);
  g.fillStyle(PAL.ink, 1).fillEllipse(40 * s, 54 * s, 6 * s, 8 * s).fillEllipse(60 * s, 54 * s, 6 * s, 8 * s);
  g.fillStyle(PAL.cheek, 0.8).fillEllipse(33 * s, 62 * s, 8 * s, 5 * s).fillEllipse(67 * s, 62 * s, 8 * s, 5 * s);
}

// 도트 (무당벌레 길잡이): 빨간 등, 검은 점, 노란 안경
function drawDot(g, s) {
  g.fillStyle(PAL.ink, 1).fillCircle(50 * s, 58 * s, 36 * s);
  g.fillStyle(0xff4d4d, 1).fillCircle(50 * s, 58 * s, 32 * s);
  g.fillStyle(0xff8080, 1).fillCircle(42 * s, 50 * s, 12 * s);
  g.fillStyle(PAL.ink, 1).fillCircle(36 * s, 66 * s, 6 * s).fillCircle(64 * s, 66 * s, 6 * s).fillCircle(50 * s, 80 * s, 5 * s);
  g.lineStyle(3 * s, PAL.ink, 1).lineBetween(50 * s, 40 * s, 50 * s, 90 * s);
  // 머리
  g.fillStyle(PAL.ink, 1).fillCircle(50 * s, 30 * s, 20 * s);
  g.lineStyle(3.5 * s, 0xffd84a, 1).strokeCircle(42 * s, 28 * s, 7 * s).strokeCircle(58 * s, 28 * s, 7 * s);
  g.fillStyle(PAL.white, 1).fillCircle(42 * s, 28 * s, 3 * s).fillCircle(58 * s, 28 * s, 3 * s);
  g.lineStyle(3 * s, PAL.ink, 1).lineBetween(42 * s, 12 * s, 36 * s, 4 * s).lineBetween(58 * s, 12 * s, 64 * s, 4 * s);
}

// 고치: 연두빛 흰 타원 + 실 감은 줄무늬 + 하이라이트
function drawCocoon(g, s) {
  g.fillStyle(PAL.ink, 0.14).fillEllipse(50 * s, 94 * s, 40 * s, 6 * s);
  g.lineStyle(3 * s, PAL.ink, 1).lineBetween(50 * s, 2 * s, 50 * s, 12 * s);
  g.fillStyle(PAL.ink, 1).fillEllipse(50 * s, 52 * s, 56 * s, 84 * s);
  g.fillStyle(0xd9efc4, 1).fillEllipse(50 * s, 52 * s, 50 * s, 78 * s);
  g.fillStyle(0xf4fbe9, 1).fillEllipse(46 * s, 46 * s, 34 * s, 60 * s);
  g.lineStyle(2.4 * s, 0xb7d99a, 1);
  for (let i = 0; i < 6; i++) {
    const y = (24 + i * 11) * s;
    g.beginPath(); g.arc(50 * s, y - 10 * s, 24 * s, 0.25 * Math.PI, 0.75 * Math.PI); g.strokePath();
  }
  g.fillStyle(PAL.white, 0.85).fillEllipse(38 * s, 30 * s, 8 * s, 16 * s);
}

const shadowOf = (g, s, w = 50) => g.fillStyle(PAL.ink, 0.14).fillEllipse(50 * s, 90 * s, w * s, 8 * s);

// 달빛가루 (밤 골목): 은색 반짝 별 가루
function drawMoondust(g, s) {
  shadowOf(g, s, 36);
  const star = (cx, cy, r, c) => {
    const pts = [];
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2; const rr = i % 2 ? r * 0.42 : r; pts.push({ x: (cx + Math.cos(a) * rr) * s, y: (cy + Math.sin(a) * rr) * s }); }
    g.fillStyle(c, 1).fillPoints(pts, true);
  };
  star(50, 48, 36, PAL.ink); star(50, 48, 30, 0xe6ecff); star(50, 48, 14, 0xffffff);
  star(78, 24, 10, 0xffe9a8); star(24, 74, 8, 0xffe9a8);
}

// 꽃씨 (시장): 싹 난 둥근 씨앗
function drawSeed(g, s) {
  shadowOf(g, s, 40);
  g.fillStyle(PAL.ink, 1).fillEllipse(50 * s, 62 * s, 50 * s, 40 * s);
  g.fillStyle(0xa8673c, 1).fillEllipse(50 * s, 62 * s, 44 * s, 34 * s);
  g.fillStyle(0xc98a5a, 1).fillEllipse(46 * s, 58 * s, 26 * s, 16 * s);
  g.lineStyle(4 * s, 0x3f8f3c, 1).lineBetween(50 * s, 44 * s, 50 * s, 26 * s);
  g.fillStyle(0x6cc35a, 1).fillEllipse(38 * s, 24 * s, 22 * s, 12 * s).fillEllipse(62 * s, 20 * s, 22 * s, 12 * s);
}

// 대나무 잎 (중국): 길쭉한 잎 두 장
function drawBambooLeaf(g, s) {
  shadowOf(g, s, 46);
  for (const [cx, cy, rot] of [[42, 48, -0.5], [60, 54, 0.5]]) {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20; const a = t * Math.PI * 2;
      const x = Math.cos(a) * 30; const y = Math.sin(a) * 9;
      pts.push({ x: (cx + x * Math.cos(rot) - y * Math.sin(rot)) * s, y: (cy + x * Math.sin(rot) + y * Math.cos(rot)) * s });
    }
    g.fillStyle(PAL.ink, 1).fillPoints(pts.map((p) => ({ x: p.x + (p.x - cx * s) * 0.12, y: p.y + (p.y - cy * s) * 0.3 })), true);
    g.fillStyle(0x5fb84f, 1).fillPoints(pts, true);
  }
  g.fillStyle(PAL.white, 0.7).fillEllipse(36 * s, 40 * s, 12 * s, 4 * s);
}

// 벚꽃잎 (일본): 하트 비슷한 분홍 꽃잎
function drawPetal(g, s) {
  shadowOf(g, s, 36);
  g.fillStyle(PAL.ink, 1).fillCircle(38 * s, 42 * s, 20 * s).fillCircle(62 * s, 42 * s, 20 * s).fillTriangle(20 * s, 50 * s, 80 * s, 50 * s, 50 * s, 86 * s);
  g.fillStyle(0xffb7c9, 1).fillCircle(38 * s, 42 * s, 16 * s).fillCircle(62 * s, 42 * s, 16 * s).fillTriangle(25 * s, 50 * s, 75 * s, 50 * s, 50 * s, 80 * s);
  g.fillStyle(0xff8fab, 1).fillTriangle(44 * s, 30 * s, 56 * s, 30 * s, 50 * s, 44 * s);
  g.fillStyle(PAL.white, 0.8).fillEllipse(36 * s, 38 * s, 8 * s, 6 * s);
}

// 도토리 (미국)
function drawAcorn(g, s) {
  shadowOf(g, s, 40);
  g.fillStyle(PAL.ink, 1).fillEllipse(50 * s, 60 * s, 46 * s, 54 * s);
  g.fillStyle(0xc98a5a, 1).fillEllipse(50 * s, 60 * s, 40 * s, 48 * s);
  g.fillStyle(PAL.ink, 1).fillEllipse(50 * s, 38 * s, 56 * s, 30 * s);
  g.fillStyle(0x8a5a3a, 1).fillEllipse(50 * s, 37 * s, 50 * s, 24 * s);
  g.lineStyle(4 * s, PAL.ink, 1).lineBetween(50 * s, 24 * s, 54 * s, 14 * s);
  g.fillStyle(PAL.white, 0.6).fillEllipse(40 * s, 60 * s, 8 * s, 14 * s);
}

// 꽃꿀 (캐나다): 노란 꿀방울
function drawNectar(g, s) {
  shadowOf(g, s, 40);
  g.fillStyle(PAL.ink, 1).fillCircle(50 * s, 60 * s, 26 * s).fillTriangle(30 * s, 52 * s, 70 * s, 52 * s, 50 * s, 14 * s);
  g.fillStyle(0xffc23a, 1).fillCircle(50 * s, 60 * s, 22 * s).fillTriangle(34 * s, 52 * s, 66 * s, 52 * s, 50 * s, 20 * s);
  g.fillStyle(0xffe08a, 1).fillCircle(44 * s, 56 * s, 9 * s);
  g.fillStyle(PAL.white, 0.9).fillCircle(42 * s, 52 * s, 4 * s);
}

// 장바구니 수레 (시장 순찰)
function drawCart(g, s) {
  shadowOf(g, s, 76);
  g.fillStyle(PAL.ink, 1).fillRoundedRect(14 * s, 30 * s, 72 * s, 46 * s, 10 * s);
  g.fillStyle(0xe8584a, 1).fillRoundedRect(18 * s, 34 * s, 64 * s, 38 * s, 8 * s);
  g.fillStyle(0xffffff, 0.5).fillRect(24 * s, 44 * s, 52 * s, 4 * s).fillRect(24 * s, 56 * s, 52 * s, 4 * s);
  g.fillStyle(0xff6b5b, 1).fillCircle(34 * s, 28 * s, 10 * s); g.fillStyle(0xffd84a, 1).fillCircle(54 * s, 26 * s, 11 * s); g.fillStyle(0x6cc35a, 1).fillCircle(70 * s, 30 * s, 8 * s);
  g.fillStyle(PAL.ink, 1).fillCircle(30 * s, 82 * s, 9 * s).fillCircle(70 * s, 82 * s, 9 * s);
  g.fillStyle(0xb8b8c8, 1).fillCircle(30 * s, 82 * s, 4 * s).fillCircle(70 * s, 82 * s, 4 * s);
}

// 굴러오는 죽순 (중국 순찰): 뾰족 귀여운 죽순
function drawShoot(g, s) {
  shadowOf(g, s, 56);
  g.fillStyle(PAL.ink, 1).fillTriangle(50 * s, 6 * s, 18 * s, 86 * s, 82 * s, 86 * s);
  g.fillStyle(0xc9a35a, 1).fillTriangle(50 * s, 14 * s, 24 * s, 82 * s, 76 * s, 82 * s);
  g.fillStyle(0x9a7a3a, 1).fillTriangle(50 * s, 40 * s, 30 * s, 82 * s, 50 * s, 82 * s);
  g.fillStyle(0x7cc56a, 1).fillTriangle(50 * s, 10 * s, 42 * s, 30 * s, 58 * s, 30 * s);
  g.fillStyle(PAL.ink, 1).fillCircle(42 * s, 60 * s, 4 * s).fillCircle(58 * s, 60 * s, 4 * s);
  g.fillStyle(PAL.cheek, 0.8).fillEllipse(36 * s, 68 * s, 7 * s, 4 * s).fillEllipse(64 * s, 68 * s, 7 * s, 4 * s);
}

// 스케이트보드 (미국 순찰)
function drawSkateboard(g, s) {
  shadowOf(g, s, 80);
  g.fillStyle(PAL.ink, 1).fillRoundedRect(8 * s, 46 * s, 84 * s, 20 * s, 10 * s);
  g.fillStyle(0x2f7bff, 1).fillRoundedRect(12 * s, 49 * s, 76 * s, 14 * s, 7 * s);
  g.fillStyle(0xffd84a, 1).fillRect(40 * s, 50 * s, 20 * s, 12 * s);
  g.fillStyle(PAL.ink, 1).fillCircle(26 * s, 74 * s, 8 * s).fillCircle(74 * s, 74 * s, 8 * s);
  g.fillStyle(0xff9fb8, 1).fillCircle(26 * s, 74 * s, 4 * s).fillCircle(74 * s, 74 * s, 4 * s);
}

export function createPlaceholders(scene) {
  makeTexture(scene, 'item_moondust', 128, drawMoondust);
  makeTexture(scene, 'item_seed', 128, drawSeed);
  makeTexture(scene, 'item_bambooLeaf', 128, drawBambooLeaf);
  makeTexture(scene, 'item_petal', 128, drawPetal);
  makeTexture(scene, 'item_acorn', 128, drawAcorn);
  makeTexture(scene, 'item_nectar', 128, drawNectar);
  makeTexture(scene, 'enemy_cart', 128, drawCart);
  makeTexture(scene, 'enemy_shoot', 128, drawShoot);
  makeTexture(scene, 'enemy_skateboard', 128, drawSkateboard);
  makeTexture(scene, 'cocoon', 256, drawCocoon);
  makeTexture(scene, 'item_leaf', 128, drawLeaf);
  makeTexture(scene, 'enemy_vacuum', 128, drawVacuum);
  makeTexture(scene, 'npc_dot', 128, drawDot);
  makeTexture(scene, 'blue_caterpillar', 128, drawCaterpillar);
  makeTexture(scene, 'blue_caterpillar_battle', 480, drawCaterpillar);
}
