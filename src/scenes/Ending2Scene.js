import Phaser from 'phaser';
import { afterDialogue } from '../ui/afterDialogue.js';
import { UI, landView } from '../data/ui.js';
import { drawSkyline, drawRoad, addCars } from '../maze/seoulCity.js';
import { CHAPTERS } from '../data/chapters.js';
import { BOSSES } from '../data/bosses.js';
import { state, save } from '../state.js';
import { setTheme } from '../ui/theme.js';
import { Button } from '../ui/Button.js';
import { sfx, vibrate } from '../ui/feedback.js';
import { takePhoto } from '../ui/photo.js';
import { sendRecordCard } from '../social/social.js';
import { waitForAssets } from './PreloadScene.js';

// 2탄 엔딩: 다시 돌아온 봄, 포포네 마당. 친구 5명 + 블루나비가 모이고 "블루나비와 포포의 여행 — 2탄 사계절 서울 끝". 별 없음, 계절별 미로 시간만.
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const FRIENDS = ['kkakkak', 'gaegul', 'bamtol', 'mungchi', 'gomsil'];

export class Ending2Scene extends Phaser.Scene {
  constructor() { super('Ending2'); }

  init(data) { this.initData = data; this.done = false; }

  create() {
    if (waitForAssets(this, ['blue_popoSpring_battle', ...FRIENDS.map((f) => `boss_${f}`)], this.initData)) return;
    setTheme('#fde3ea', '#a8dd8f');
    state.cleared = true;
    state.step = 'map';
    save();
    const g = this.add.graphics();
    // 가로·길쭉한 화면에서도 빈 곳 없이 하늘·마당을 넉넉히
    g.fillStyle(0xfde3ea, 1).fillRect(-1500, -1500, UI.width + 3000, 2120).fillStyle(0xa8dd8f, 1).fillRect(-1500, 620, UI.width + 3000, UI.height - 620 + 1500);
    // 다시 돌아온 봄의 서울: 빌딩 숲 + 남산 타워 + 찻길
    drawSkyline(g, { x0: -1500, x1: UI.width + 1500, baseY: 594, maxH: 230, season: 'spring', seed: 9 });
    drawRoad(g, -1500, UI.width + 1500, 594, 28);
    for (let i = -20; i < 29; i++) g.fillStyle(0xffd84a, 1).fillCircle(40 + i * 82, 640, 14);
    // 마당 풀잎·꽃 몇 송이 (양옆 넓은 곳에도)
    for (let i = 0; i < 70; i++) {
      const x = -1100 + ((i * 197) % 2920), y = 700 + ((i * 113) % 900);
      if (x > 20 && x < 700 && y < 1000) continue;
      g.fillStyle(0x7fc36b, 1).fillTriangle(x, y, x + 6, y - 16, x + 12, y);
      if (i % 4 === 0) g.fillStyle([0xffd84a, 0xff9fb8, 0xffffff][i % 3], 1).fillCircle(x + 20, y - 6, 7);
    }
    addCars(this, { x0: -1500, x1: UI.width + 1500, y: 594, count: 8, scale: 1, seed: 31 });
    this.popo = this.add.image(UI.width / 2, 700, 'blue_popoSpring_battle', 6).setDisplaySize(300, 300);
    FRIENDS.forEach((f, i) => {
      const x = 90 + i * 135, y = i % 2 ? 500 : 470;
      if (this.textures.exists(`boss_${f}`)) {
        const im = this.add.image(x, y, `boss_${f}`, 3).setDisplaySize(150, 150).setAlpha(0);
        this.tweens.add({ targets: im, alpha: 1, y: y - 10, duration: 500, delay: 400 + i * 220 });
      }
    });
    if (this.textures.exists('blue_butterfly')) {
      const bn = this.add.sprite(560, 330, 'blue_butterfly', 0).setDisplaySize(110, 110);
      if (this.anims.exists('blue_butterfly_move')) bn.play('blue_butterfly_move');
      this.tweens.add({ targets: bn, x: 600, y: 300, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    afterDialogue(this, () => this.finale());
    this.time.delayedCall(1600, () => this.scene.launch('Dialogue', { key: 'ending2', frame: 'spring', form: 'popoSpring' }));
  }

  finale() {
    sfx('win');
    vibrate('special');
    const t = this.add.text(UI.width / 2, 130, '블루나비와 포포의 여행', { fontFamily: UI.fontTitle, fontSize: '60px', color: '#ffffff', stroke: '#2b2d5a', strokeThickness: 10 }).setOrigin(0.5).setAlpha(0);
    const t2 = this.add.text(UI.width / 2, 206, '— 2탄 사계절 서울 끝 —', { fontFamily: UI.fontTitle, fontSize: '40px', color: '#2b2d5a', stroke: '#ffffff', strokeThickness: 8 }).setOrigin(0.5).setAlpha(0);
    const land = UI.landscape;
    // 가로: 가운데 마당은 그대로, 제목은 왼쪽 칸, 기록 카드·버튼은 오른쪽 칸
    if (land) { t.setPosition(-230, 520).setFontSize(46); t2.setPosition(-230, 600); }
    this.tweens.add({ targets: [t, t2], alpha: 1, duration: 700 });
    // 계절별 미로 시간 + 사귄 친구 수 (별 없음)
    const card = this.add.container(0, 0).setAlpha(0);
    const cg = this.add.graphics();
    cg.fillStyle(0x2b2d5a, 0.15).fillRoundedRect(44, 916, 632, 170, 28).fillStyle(0xffffff, 0.95).fillRoundedRect(40, 908, 640, 170, 28);
    card.add(cg);
    const friends = Object.keys(BOSSES).filter((b) => state.friends.includes(b)).length;
    card.add(this.add.text(70, 942, `사귄 친구 ${friends}명`, { fontFamily: UI.fontTitle, fontSize: '28px', color: '#2b2d5a' }).setOrigin(0, 0.5));
    CHAPTERS.forEach((c, i) => {
      const x = 120 + i * 160;
      card.add(this.add.text(x, 996, c.name, { fontFamily: UI.fontTitle, fontSize: '26px', color: '#2b2d5a' }).setOrigin(0.5));
      const sec = state.records[c.id]?.mazeSec;
      card.add(this.add.text(x, 1040, sec != null ? fmt(sec) : '-', { fontFamily: UI.font, fontSize: '24px', color: '#5a5c88' }).setOrigin(0.5));
    });
    if (land) {
      // 오른쪽 칸 폭에 맞춰 카드 크기 (넓은 폰일수록 크게)
      const v = this.landscapeView();
      const k = Math.min(0.85, Math.max(0.6, (v.right - 800) / 700));
      this.rightX = Math.min(950 + (k - 0.68) * 300, (760 + v.right) / 2 - 20);
      card.setScale(k).setPosition(this.rightX - 360 * k, 520 - 993 * k);
    }
    this.tweens.add({ targets: card, alpha: 1, duration: 500, delay: 300 });
    const by = 1190;
    const row = this.add.container(0, 0).setAlpha(0);
    row.add(new Button(this, 130, by, { width: 220, height: 96, fontSize: 26, label: '사진 남기기', color: 0xffd84a, shade: 0xd9a92b, textColor: '#2b2d5a',
      onPress: async () => { row.setVisible(false); await new Promise((r) => this.time.delayedCall(60, r)); await takePhoto(this.game, 'popo-ending.png'); row.setVisible(true); } }));
    row.add(new Button(this, 360, by, { width: 220, height: 96, fontSize: 26, label: '기록 자랑', color: 0xff9fb8, shade: 0xe07a96, textColor: '#2b2d5a', onPress: () => sendRecordCard(this.game) }));
    row.add(new Button(this, 590, by, { width: 220, height: 96, fontSize: 26, label: '홈으로', onPress: () => this.scene.start('Title') }));
    if (land) row.list.forEach((b, i) => b.setPosition(this.rightX, 720 + i * 112));
    this.tweens.add({ targets: row, alpha: 1, duration: 400, delay: 800 });
    this.done = true;
  }

  // 가로 (18절): 연출 화면이라 전체가 보이게 줄여서 보고, 연출 중에는 다시 그리지 않는다(다음 화면부터 새 배치)
  landscapeView() { return landView(0.78, 360, 620); }

  canRelayout() { return false; }
}
