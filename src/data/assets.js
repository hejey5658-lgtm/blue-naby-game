// 그림 파일 목록. 파일이 없거나 불러오기에 실패한 키는 임시 그림(src/art/placeholders.js)으로 대신한다.
// group: 언제 받을지 (boot = 처음, chN = N장을 하는 동안 다음에 쓸 그림을 미리). release: true = 공개 전 필수.
// 블루나비 그림은 npm run build:art 로 만든다 (art/gen/blue.mjs, 캐릭터 시트 v1 승인 2026-10-30).
const blue = (form, group) => [
  { key: `blue_${form}`, file: `assets/char/blue_${form}.png`, width: 768, height: 128, frameWidth: 128, frameHeight: 128, release: true, group },
  { key: `blue_${form}_battle`, file: `assets/char/blue_${form}_battle.png`, width: 3360, height: 480, frameWidth: 480, frameHeight: 480, release: true, group },
  { key: `face_blue_${form}`, file: `assets/face/face_blue_${form}.png`, width: 1120, height: 280, frameWidth: 280, frameHeight: 280, release: true, group },
];

const boss = (key, group) => [
  { key: `boss_${key}`, file: `assets/char/boss_${key}.png`, width: 2880, height: 480, frameWidth: 480, frameHeight: 480, release: true, group },
  { key: `face_${key}`, file: `assets/face/face_${key}.png`, width: 560, height: 280, frameWidth: 280, frameHeight: 280, release: true, group },
];

const npc = (key, size, group) => [
  { key: `npc_${key}`, file: `assets/char/npc_${key}.png`, width: size * 2, height: size, frameWidth: size, frameHeight: size, release: true, group },
  { key: `face_${key}`, file: `assets/face/face_${key}.png`, width: 560, height: 280, frameWidth: 280, frameHeight: 280, release: true, group },
];

// 수집품·방해물·고치 (art/gen/props.mjs). 작아서(합쳐 0.2MB 안쪽) 처음에 모두 받는다 —
// 임시 그림이 Boot에서 먼저 만들어지면 나중에 받은 파일이 덮어쓰지 못하기 때문.
const prop = (key, size = 128) => ({ key, file: `assets/${key.startsWith('item_') ? 'item' : 'char'}/${key}.png`, width: size, height: size, release: true, group: 'boot' });
const PROPS = ['leaf', 'moondust', 'seed', 'bambooLeaf', 'petal', 'acorn', 'nectar'].map((k) => prop(`item_${k}`))
  .concat(['vacuum', 'cart', 'shoot', 'skateboard'].map((k) => prop(`enemy_${k}`)), prop('cocoon', 256));

export const ASSETS = [
  ...PROPS,
  ...npc('dot', 128, 'boot'),
  ...npc('flower', 480, 'ch7'),
  ...boss('dustmong', 'ch1'),
  ...boss('silsili', 'ch2'),
  ...boss('jjakjjak', 'ch3'),
  ...boss('bbangbbang', 'ch4'),
  ...boss('sappuni', 'ch5'),
  ...boss('dotori', 'ch6'),
  ...boss('damdam', 'ch7'),
  ...boss('buzzboss', 'ch7'),
  ...blue('caterpillar', 'boot'),
  ...blue('moth', 'ch3'),       // 3장 끝에 나방으로 진화
  ...blue('butterfly', 'ch5'),  // 5장 끝에 나비로 진화
];
// 그림을 바꾸면 올려서 브라우저 캐시를 피한다.
export const ASSET_VERSION = 6;

// 애니메이션 (프레임 번호는 art-guide.md 4절 칸 순서: 미로 = 대기 2 + 이동 4, 대결 = 대기 2·놀자·버티기·특기·지침·기쁨)
const blueAnims = (form) => [
  { key: `blue_${form}_idle`, texture: `blue_${form}`, frames: [0, 1], fps: 3, repeat: -1 },
  { key: `blue_${form}_move`, texture: `blue_${form}`, frames: [2, 3, 4, 5], fps: 10, repeat: -1 },
  { key: `blue_${form}_battle_idle`, texture: `blue_${form}_battle`, frames: [0, 1], fps: 3, repeat: -1 },
];
export const ANIMS = ['caterpillar', 'moth', 'butterfly'].flatMap(blueAnims);
