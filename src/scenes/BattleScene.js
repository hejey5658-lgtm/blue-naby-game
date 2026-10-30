import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { CHAPTERS } from '../data/chapters.js';
import { FORMS } from '../data/forms.js';
import { BOSSES } from '../data/bosses.js';
import { ITEMS } from '../data/items.js';
import { BATTLE } from '../data/battle.js';
import { state, save } from '../state.js';
import { setTheme } from '../ui/theme.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { drawPanel } from '../ui/frames.js';
import { Button } from '../ui/Button.js';
import { sfx, vibrate } from '../ui/feedback.js';
import { josa } from '../ui/josa.js';
import { iconPlay, iconGuard, iconStar, iconLeaf, iconBossMove } from '../ui/icons.js';

// 대결: 턴제. 블루나비 차례에 아래 큰 버튼 4개 중 하나 → 보스 차례 자동.
// 보스는 HP 대신 '심술', 0이 되면 심술이 풀려 친구가 된다. 블루나비 '기운'이 0이 되면 쉬었다가 다시(게임오버 없음).
// (systems.md 4절, 화면 배치 9절: 보스 y 120–560, 블루나비 y 560–800, 버튼 y 820–1240)
const BTN = { w: 330, h: 190, gap: 20, top: 830 };
const BLUE_FRAME = { idle: 0, play: 2, guard: 3, special: 4, tired: 5, joy: 6 };
const BOSS_FRAME = { angry: 0, sad: 2, happy: 3, skill: 5 };

export class BattleScene extends Phaser.Scene {
  constructor() { super('Battle'); }

  init(data) {
    this.chapter = CHAPTERS.find((c) => c.id === (data.chapter ?? 'ch1'));
    this.bossIndex = data.bossIndex ?? 0;
    this.bossKey = this.chapter.bosses[this.bossIndex];
    this.boss = BOSSES[this.bossKey];
    this.form = FORMS[this.chapter.form];
    this.skipIntro = !!data.retry;
  }

  create() {
    setTheme(this.chapter.theme, this.chapter.theme);
    this.insets = getSafeInsets(this.game);
    this.add.rectangle(0, 0, UI.width, UI.height, Phaser.Display.Color.HexStringToColor(this.chapter.theme).color).setOrigin(0);
    this.drawStage();

    // 수치
    this.maxHp = this.form.maxHp;
    this.hp = this.maxHp;
    this.maxGrumpy = this.boss.grumpy;
    this.grumpy = this.maxGrumpy;
    this.atk = this.form.atk + (BATTLE.allCollectedBonus ?? 1); // 미로에서 다 모아야 출구가 열리므로 늘 +1
    this.turn = 0;
    this.patternIdx = 0;
    this.specialReadyTurn = 0;
    this.snacks = BATTLE.snacksPerBattle;
    this.bossHide = false;
    this.blueWrapped = false;
    this.healed = false;
    this.busy = true;

    this.makeHud();
    this.makeFighters();
    this.makeButtons();
    this.makeMessage();
    this.setupKeys();
    this.updateBars(false);
    this.showNextMove();

    state.step = `${this.chapter.id}_boss`;
    state.bossIndex = this.bossIndex;
    save();

    const onHidden = () => this.openPause();
    this.game.events.on('app-hidden', onHidden);
    this.events.once('shutdown', () => this.game.events.off('app-hidden', onHidden));

    if (this.skipIntro) this.startTurn();
    else this.playIntro();
  }

  // ── 무대 ───────────────────────────────────────
  drawStage() {
    const g = this.add.graphics();
    // 바닥 무대: 둥근 러그 두 장(보스 자리·블루나비 자리)
    g.fillStyle(0x2b2d5a, 0.08).fillEllipse(470, 545, 360, 66);
    g.fillStyle(0xf3e3c3, 1).fillEllipse(470, 536, 340, 56);
    g.fillStyle(0x2b2d5a, 0.08).fillEllipse(200, 772, 280, 50);
    g.fillStyle(0xf3e3c3, 1).fillEllipse(200, 764, 260, 44);
  }

  makeHud() {
    const top = this.insets.top;
    const g = this.add.graphics();
    g.fillStyle(0x8f6440, 1).fillRoundedRect(8, 8 + top, UI.width - 16, 100, 26);
    g.fillStyle(0xb98a5e, 1).fillRoundedRect(12, 10 + top, UI.width - 24, 90, 24);
    g.fillStyle(0xd2a679, 1).fillRoundedRect(28, 14 + top, UI.width - 56, 6, 3);
    const pb = this.add.container(64, 58 + top);
    const pg = this.add.graphics();
    pg.fillStyle(0xfffaf0, 1).fillCircle(0, 0, 34);
    pg.fillStyle(0x2b2d5a, 1).fillRoundedRect(-12, -14, 8, 28, 3).fillRoundedRect(4, -14, 8, 28, 3);
    pb.add(pg).setSize(96, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => this.openPause());
    this.add.text(UI.width / 2, 58 + top, `${josa(this.boss.name, '과', '와')} 놀기`, {
      fontFamily: UI.fontTitle, fontSize: '34px', color: '#fffaf0',
    }).setOrigin(0.5);
    this.turnText = this.add.text(UI.width - 40, 58 + top, '', { fontFamily: UI.font, fontSize: '22px', color: '#ffe9a8' }).setOrigin(1, 0.5);
  }

  makeFighters() {
    // 보스 (오른쪽 위)
    const bk = this.textures.exists(`boss_${this.bossKey}`) ? `boss_${this.bossKey}` : null;
    this.bossSprite = bk
      ? this.add.sprite(470, 540, bk, 0).setOrigin(0.5, 0.92).setDisplaySize(300, 300)
      : this.add.circle(470, 380, 120, 0xb8b8c8).setStrokeStyle(6, 0x2b2d5a);
    this.bossBase = { x: this.bossSprite.x, y: this.bossSprite.y, scale: this.bossSprite.scale };
    this.bossBob = this.tweens.add({ targets: this.bossSprite, y: this.bossBase.y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // 심술 게이지 (먹구름이 줄어든다)
    this.grumpyLabel = this.add.text(40, 162, '심술', { fontFamily: UI.fontTitle, fontSize: '28px', color: '#2b2d5a' }).setOrigin(0, 0.5);
    this.grumpyBar = this.add.graphics();
    this.grumpyText = this.add.text(596, 162, '', { fontFamily: UI.font, fontSize: '22px', color: '#5a5c88' }).setOrigin(0, 0.5);

    // 다음 기술 말풍선 (보스 머리 위)
    this.nextMove = this.add.container(470, 236).setDepth(3);

    // 블루나비 (왼쪽 아래, 보스 쪽을 바라봄)
    const key = `blue_${this.chapter.form}_battle`;
    this.blue = this.add.sprite(200, 770, key, 0).setOrigin(0.5, 0.92);
    this.blueSize = this.form.battleSize;
    this.blue.setDisplaySize(this.blueSize, this.blueSize);
    this.blueScale = this.blue.scale;
    if (this.anims.exists(`${key}_idle`)) this.blue.play(`${key}_idle`);

    this.hpLabel = this.add.text(340, 640, '기운', { fontFamily: UI.fontTitle, fontSize: '28px', color: '#2b2d5a' }).setOrigin(0, 0.5);
    this.hpBar = this.add.graphics();
    this.hpText = this.add.text(340, 676, '', { fontFamily: UI.font, fontSize: '22px', color: '#5a5c88' }).setOrigin(0, 0.5);
  }

  updateBars(animate = true) {
    const draw = (g, x, y, w, ratio, color, cloud) => {
      g.clear();
      g.fillStyle(0x2b2d5a, 0.12).fillRoundedRect(x, y, w, 24, 12);
      const fw = Math.max(0, w * ratio);
      if (fw > 0) {
        g.fillStyle(color, 1).fillRoundedRect(x, y, Math.max(24, fw), 24, 12);
        g.fillStyle(0xffffff, 0.35).fillRoundedRect(x + 8, y + 4, Math.max(8, fw - 16), 6, 3);
      }
      if (cloud) {
        // 게이지 끝의 작은 먹구름 (심술이 줄면 같이 작아짐)
        const cx = x + Math.max(24, fw);
        const r = 10 + 10 * ratio;
        g.fillStyle(0x8e8ea3, 1).fillCircle(cx, y + 12, r).fillCircle(cx - r * 0.8, y + 16, r * 0.7).fillCircle(cx + r * 0.8, y + 16, r * 0.7);
      }
    };
    draw(this.grumpyBar, 120, 150, 420, this.grumpy / this.maxGrumpy, 0x9a8bb5, true);
    this.grumpyText.setText(`${Math.ceil(this.grumpy)} / ${this.maxGrumpy}`);
    draw(this.hpBar, 420, 628, 240, this.hp / this.maxHp, this.hp / this.maxHp > 0.3 ? 0x6cc35a : 0xffb347, false);
    this.hpText.setText(`${Math.ceil(this.hp)} / ${this.maxHp}`);
    this.updateBossFace();
    if (!animate) return;
  }

  updateBossFace(override) {
    if (!(this.bossSprite instanceof Phaser.GameObjects.Sprite)) return;
    const r = this.grumpy / this.maxGrumpy;
    const mood = override ?? (r > 0.66 ? 'angry' : r > 0.33 ? 'sad' : 'happy');
    this.bossSprite.setFrame(BOSS_FRAME[mood]);
  }

  // 보스가 다음에 쓸 기술을 머리 위에 미리 보여 준다
  peekMove() {
    const b = this.boss;
    if (b.healOnceBelow && !this.healed && this.grumpy / this.maxGrumpy <= b.healOnceBelow) return 'heal';
    return b.pattern[this.patternIdx % b.pattern.length];
  }

  showNextMove() {
    const move = this.peekMove();
    this.nextMove.removeAll(true);
    const label = this.boss.labels[move] ?? '';
    const t = this.add.text(18, 0, label, { fontFamily: UI.fontTitle, fontSize: '24px', color: '#2b2d5a' }).setOrigin(0, 0.5);
    const w = t.width + 76;
    const g = this.add.graphics();
    g.fillStyle(0x2b2d5a, 0.12).fillRoundedRect(-w / 2 + 2, -26 + 4, w, 52, 26);
    g.fillStyle(0xffffff, 1).fillRoundedRect(-w / 2, -26, w, 52, 26);
    g.fillTriangle(-10, 24, 10, 24, 0, 40);
    const ic = this.add.graphics();
    iconBossMove(ic, -w / 2 + 30, 0, 32, move);
    t.setX(-w / 2 + 54);
    this.nextMove.add([g, ic, t]);
    this.nextMove.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: this.nextMove, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
  }

  // ── 버튼 2×2 ───────────────────────────────────
  makeButtons() {
    const bottom = this.insets.bottom;
    const x0 = (UI.width - BTN.w * 2 - BTN.gap) / 2;
    const y0 = BTN.top - Math.min(bottom, 40);
    const defs = [
      { key: 'play', label: '놀자!', icon: iconPlay, color: 0x2f7bff, shade: 0x1f5fd6 },
      { key: 'guard', label: '꼬옥 버티기', icon: iconGuard, color: 0x6cc35a, shade: 0x4f9f4c },
      { key: 'special', label: '특기', icon: iconStar, color: 0xffb347, shade: 0xd98a2b },
      { key: 'snack', label: '냠냠 간식', icon: iconLeaf, color: 0xff9fb8, shade: 0xe67f9b },
    ];
    this.buttons = {};
    defs.forEach((d, i) => {
      const x = x0 + (i % 2) * (BTN.w + BTN.gap) + BTN.w / 2;
      const y = y0 + Math.floor(i / 2) * (BTN.h + BTN.gap) + BTN.h / 2;
      const b = new Button(this, x, y, { width: BTN.w, height: BTN.h - 12, label: d.label, fontSize: 34, color: d.color, shade: d.shade, textColor: d.key === 'play' ? '#ffffff' : '#2b2d5a', onPress: () => this.choose(d.key) });
      b.text.setY(24);
      const ic = this.add.graphics();
      d.icon(ic, 0, -36, 54, d.key === 'play' ? 0xffffff : 0x2b2d5a);
      b.face.add(ic);
      b.sub = this.add.text(0, 62, '', { fontFamily: UI.font, fontSize: '20px', color: d.key === 'play' ? '#ffffff' : '#2b2d5a' }).setOrigin(0.5);
      b.face.add(b.sub);
      if (!this.sys.game.device.input.touch || this.sys.game.device.os.desktop) {
        b.face.add(this.add.text(-BTN.w / 2 + 22, -BTN.h / 2 + 26, String(i + 1), { fontFamily: UI.fontTitle, fontSize: '22px', color: '#2b2d5a' }).setAlpha(0.5));
      }
      this.buttons[d.key] = b;
    });
    this.buttons.special.sub.setText(this.form.special);
    this.refreshButtons();
  }

  refreshButtons() {
    const can = this.available();
    for (const [k, b] of Object.entries(this.buttons)) {
      const on = !this.busy && can[k];
      b.setAlpha(on ? 1 : 0.45);
      b.input.enabled = on;
    }
    const left = this.specialReadyTurn - this.turn;
    this.buttons.special.sub.setText(left > 0 ? `${left}턴 뒤에 쓸 수 있어` : this.form.special);
    this.buttons.snack.sub.setText(`남은 간식 ${this.snacks}개`);
  }

  available() {
    return {
      play: true,
      guard: true,
      special: this.turn >= this.specialReadyTurn,
      snack: this.snacks > 0 && this.hp < this.maxHp,
    };
  }

  makeMessage() {
    this.msg = this.add.text(UI.width / 2, 800 - Math.min(this.insets.bottom, 40), '', {
      fontFamily: UI.font, fontSize: '28px', color: '#2b2d5a', align: 'center',
    }).setOrigin(0.5);
  }

  say(text) {
    this.msg.setText(text).setAlpha(0);
    this.tweens.add({ targets: this.msg, alpha: 1, duration: 160 });
  }

  setupKeys() {
    const kb = this.input.keyboard;
    if (!kb) return;
    ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((n, i) => kb.on(`keydown-${n}`, () => {
      const key = ['play', 'guard', 'special', 'snack'][i];
      if (this.buttons[key].input.enabled) this.choose(key);
    }));
    kb.on('keydown-ESC', () => this.openPause());
    kb.on('keydown-SPACE', () => this.onTap());
    kb.on('keydown-ENTER', () => this.onTap());
    this.input.on('pointerdown', (p, over) => { if (!over.length) this.onTap(); });
  }

  // 화면을 톡: 특기 타이밍 막대 멈추기 / 보스 차례 빨리 감기
  onTap() {
    if (this.timing) { this.stopTiming(); return; }
    if (this.bossActing) this.tweens.timeScale = this.time.timeScale = 3;
  }

  // ── 등장 연출 (약 2.2초) ─────────────────────────
  playIntro() {
    const b = this.bossSprite;
    b.y = -200;
    this.bossBob.pause();
    this.nextMove.setAlpha(0);
    this.blue.setScale(this.blueScale * 0.32).setFrame(BLUE_FRAME.special);
    this.blue.anims.stop();
    this.say(`앗, ${josa(this.boss.name, '이', '가')} 나타났다!`);
    this.tweens.add({
      targets: b, y: this.bossBase.y, duration: 700, ease: 'Bounce.easeOut',
      onComplete: () => { this.cameras.main.shake(180, 0.008); vibrate('bump'); },
    });
    this.time.delayedCall(1000, () => {
      this.burst(this.blue.x, this.blue.y - 90, 24);
      sfx('open');
      vibrate('collect');
      this.tweens.add({ targets: this.blue, scale: this.blueScale, duration: 520, ease: 'Back.easeOut' });
      this.band('블루나비도 쑥쑥 커졌다!');
    });
    this.time.delayedCall(2200, () => {
      this.bossBob.resume();
      this.blue.setFrame(BLUE_FRAME.idle);
      const idle = `blue_${this.chapter.form}_battle_idle`;
      if (this.anims.exists(idle)) this.blue.play(idle);
      this.game.events.once('dialogue-done', () => {
        this.tweens.add({ targets: this.nextMove, alpha: 1, duration: 200 });
        this.startTurn();
      });
      const key = this.bossIndex === 0 ? `${this.chapter.id}_boss` : `${this.chapter.id}_boss${this.bossIndex + 1}`;
      this.scene.launch('Dialogue', { key, frame: this.chapter.frame, form: this.chapter.form });
    });
  }

  band(text) {
    const c = this.add.container(UI.width / 2, 600).setDepth(10);
    const g = this.add.graphics();
    g.fillStyle(0x2f7bff, 1).fillRoundedRect(-280, -40, 560, 80, 40);
    const t = this.add.text(0, 0, text, { fontFamily: UI.fontTitle, fontSize: '36px', color: '#ffffff' }).setOrigin(0.5);
    c.add([g, t]).setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut', hold: 900, yoyo: true, onComplete: () => c.destroy() });
  }

  // 반짝이 별 (한 번에 30개 이하)
  burst(x, y, n, color = 0xffd84a) {
    for (let i = 0; i < Math.min(n, 30); i++) {
      const a = (i / n) * Math.PI * 2;
      const d = this.add.star(x, y, 5, 5, 11, color).setDepth(9);
      this.tweens.add({ targets: d, x: x + Math.cos(a) * 160, y: y + Math.sin(a) * 160, angle: 180, alpha: 0, scale: 0.4, duration: 600, ease: 'Quad.easeOut', onComplete: () => d.destroy() });
    }
  }

  floatNumber(x, y, text, color) {
    const t = this.add.text(x, y, text, { fontFamily: UI.fontTitle, fontSize: '44px', color, stroke: '#ffffff', strokeThickness: 8 }).setOrigin(0.5).setDepth(9);
    this.tweens.add({ targets: t, y: y - 80, alpha: 0, duration: 900, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }

  // ── 턴 진행 ─────────────────────────────────────
  startTurn() {
    this.tweens.timeScale = this.time.timeScale = 1;
    this.bossActing = false;
    this.guarding = false;
    this.turnText.setText(`${this.turn + 1}턴`);
    if (this.blueWrapped) {
      this.blueWrapped = false;
      this.busy = true;
      this.refreshButtons();
      this.say('실에 감겨서 이번 차례는 꼼짝 못 해!');
      this.time.delayedCall(1100, () => this.bossTurn());
      return;
    }
    this.busy = false;
    this.say('어떻게 놀아 줄까?');
    this.refreshButtons();
  }

  choose(key) {
    if (this.busy) return;
    this.busy = true;
    this.refreshButtons();
    sfx('tap');
    if (key === 'special') { this.startTiming(); return; }
    if (key === 'play') this.blueAct('play', this.atk, '놀자!');
    if (key === 'guard') {
      this.guarding = true;
      this.blue.anims.stop();
      this.blue.setFrame(BLUE_FRAME.guard);
      this.say('꼬옥 버티기! 이번엔 덜 흔들려.');
      this.time.delayedCall(700, () => this.bossTurn());
    }
    if (key === 'snack') {
      this.snacks--;
      const heal = Math.round(this.maxHp * BATTLE.snackHealRatio);
      this.hp = Math.min(this.maxHp, this.hp + heal);
      this.blue.anims.stop();
      this.blue.setFrame(BLUE_FRAME.joy);
      this.floatNumber(this.blue.x, this.blue.y - 220, `+${heal}`, '#4f9f4c');
      this.say('냠냠! 기운이 났어!');
      this.updateBars();
      this.time.delayedCall(800, () => this.bossTurn());
    }
  }

  // 블루나비의 놀자·특기
  blueAct(kind, power, text) {
    let dmg = power;
    if (this.bossHide) { dmg = Math.ceil(dmg / 2); this.bossHide = false; }
    this.blue.anims.stop();
    this.blue.setFrame(BLUE_FRAME[kind]);
    this.say(text);
    // (onYoyo는 움직이는 속성마다 한 번씩 불려서 두 번 닿게 되므로, 닿는 순간은 시간으로 맞춘다)
    this.tweens.add({ targets: this.blue, x: this.blue.x + 70, y: this.blue.y - 40, duration: 200, yoyo: true, ease: 'Quad.easeOut' });
    this.time.delayedCall(200, () => {
        this.grumpy = Math.max(0, this.grumpy - dmg);
        this.floatNumber(this.bossSprite.x, this.bossBase.y - 300, `-${dmg}`, '#2f7bff');
        this.tweens.add({ targets: this.bossSprite, angle: 6, duration: 70, yoyo: true, repeat: 1 });
        this.updateBars();
        if (kind === 'special') this.burst(this.bossSprite.x, this.bossBase.y - 150, 16, 0x8fc2ff);
    });
    this.time.delayedCall(800, () => {
      if (this.grumpy <= 0) this.win();
      else this.bossTurn();
    });
  }

  // 특기: 하트가 좌우로 오가는 막대, 가운데에서 톡 하면 ×1.5 (빗나가도 기본 효과)
  startTiming() {
    this.specialReadyTurn = this.turn + BATTLE.specialEvery;
    const c = this.add.container(UI.width / 2, 600).setDepth(10);
    const g = this.add.graphics();
    g.fillStyle(0x2b2d5a, 0.15).fillRoundedRect(-262, -34, 524, 68, 34);
    g.fillStyle(0xffffff, 1).fillRoundedRect(-260, -36, 520, 68, 34);
    g.fillStyle(0xffd84a, 1).fillRoundedRect(-BATTLE.timingWindow * 260, -30, BATTLE.timingWindow * 520, 56, 20);
    const t = this.add.text(0, -66, '가운데에서 톡!', { fontFamily: UI.fontTitle, fontSize: '30px', color: '#2b2d5a' }).setOrigin(0.5);
    const heart = this.add.graphics();
    heart.fillStyle(0xff7f9c, 1).fillCircle(-9, -4, 11).fillCircle(9, -4, 11).fillTriangle(-19, 1, 19, 1, 0, 22);
    heart.x = -230;
    c.add([g, t, heart]);
    this.timing = { c, heart, tw: this.tweens.add({ targets: heart, x: 230, duration: BATTLE.timingMs / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }) };
    this.say('특기 준비!');
  }

  stopTiming() {
    const { c, heart, tw } = this.timing;
    this.timing = null;
    tw.stop();
    const good = Math.abs(heart.x) <= BATTLE.timingWindow * 260;
    let power = this.atk * 2;
    if (good) { power = Math.round(power * 1.5); vibrate('special'); this.band('딱 맞았어!'); } else vibrate('collect');
    this.time.delayedCall(300, () => {
      c.destroy();
      this.blueAct('special', power, `${this.form.special}!`);
    });
  }

  // ── 보스 차례 ───────────────────────────────────
  bossTurn() {
    this.bossActing = true;
    const move = this.peekMove();
    if (move !== 'heal') this.patternIdx++;
    else this.healed = true;
    const b = this.boss;
    const label = b.labels[move] ?? '';
    this.say(`${b.name}의 ${label}!`);
    this.updateBossFace('skill');
    this.tweens.add({ targets: this.nextMove, alpha: 0, duration: 120 });

    const hit = (mult) => {
      let dmg = Math.round(b.atk * mult);
      if (this.guarding) dmg = Math.ceil(dmg / 2);
      this.tweens.add({ targets: this.bossSprite, x: this.bossSprite.x - 90, y: this.bossSprite.y + 60, duration: 220, yoyo: true, ease: 'Quad.easeIn' });
      this.time.delayedCall(220, () => {
          this.hp = Math.max(0, this.hp - dmg);
          this.floatNumber(this.blue.x, this.blue.y - 230, `-${dmg}`, '#e8584a');
          this.blue.anims.stop();
          this.blue.setFrame(BLUE_FRAME.tired);
          this.tweens.add({ targets: this.blue, x: this.blue.x - 12, duration: 60, yoyo: true, repeat: 2 });
          vibrate('bump');
          this.updateBars();
      });
    };
    if (move === 'attack') hit(1);
    else if (move === 'rush') hit(1.5);
    else if (move === 'hide') {
      this.bossHide = true;
      this.tweens.add({ targets: this.bossSprite, scaleY: this.bossBase.scale * 0.8, duration: 200, yoyo: true });
      this.time.delayedCall(450, () => this.say(`${josa(b.name, '이', '가')} 숨어서 다음엔 덜 닿을 거야!`));
    } else if (move === 'wrap') {
      this.blueWrapped = true;
      hit(0.5);
      this.time.delayedCall(500, () => this.say('블루나비가 실에 감겼어!'));
    } else if (move === 'heal') {
      this.grumpy = Math.min(this.maxGrumpy, this.grumpy + b.healAmount);
      this.floatNumber(this.bossSprite.x, this.bossBase.y - 300, `+${b.healAmount}`, '#9a8bb5');
      this.updateBars();
    }

    this.time.delayedCall(1300, () => {
      this.updateBossFace();
      if (this.hp <= 0) { this.lose(); return; }
      const idle = `blue_${this.chapter.form}_battle_idle`;
      if (this.anims.exists(idle)) this.blue.play(idle);
      this.turn++;
      this.showNextMove();
      this.startTurn();
    });
  }

  // ── 끝 ──────────────────────────────────────────
  lose() {
    this.tweens.timeScale = this.time.timeScale = 1;
    this.busy = true;
    this.refreshButtons();
    this.blue.setFrame(BLUE_FRAME.tired);
    this.say('조금 쉬었다가 다시 해 보자!');
    this.time.delayedCall(900, () => this.panel(
      '조금 쉬었다가 다시 해 보자!',
      [`${this.boss.name}도 아직 심술이 ${Math.ceil(this.grumpy)} 남았어.`, '간식이랑 꼬옥 버티기를 써 봐!'],
      [['다시 하기', () => this.scene.restart({ chapter: this.chapter.id, bossIndex: this.bossIndex, retry: true })]],
    ));
  }

  win() {
    this.tweens.timeScale = this.time.timeScale = 1;
    this.busy = true;
    this.refreshButtons();
    this.bossBob.stop();
    this.tweens.add({ targets: this.nextMove, alpha: 0, duration: 120 });
    this.bossSprite.setFrame(BOSS_FRAME.happy);
    this.blue.setFrame(BLUE_FRAME.joy);
    this.burst(this.bossSprite.x, this.bossBase.y - 160, 28, 0xff9fb8);
    this.band('심술이 풀렸다!');
    sfx('open');
    vibrate('special');
    if (this.bossSprite.anims) this.tweens.add({ targets: this.bossSprite, y: this.bossBase.y - 30, duration: 300, yoyo: true, repeat: 2 });

    const id = this.chapter.id;
    const turns = this.turn + 1;
    const rec = state.records[id] || {};
    rec.battleTurns = rec.battleTurns == null ? turns : Math.min(rec.battleTurns, turns);
    state.records[id] = rec;
    if (!state.friends.includes(this.bossKey)) state.friends.push(this.bossKey);
    const lastBoss = this.bossIndex >= this.chapter.bosses.length - 1;
    if (lastBoss) {
      const stars = 1 + (state.mazeTimeStar?.[id] ? 1 : 0) + (this.hp >= this.maxHp / 2 ? 1 : 0);
      state.stars[id] = Math.max(state.stars[id] ?? 0, stars);
      if (this.chapter.reward && !state.items.includes(this.chapter.reward)) state.items.push(this.chapter.reward);
      state.step = `${id}_done`;
    } else {
      state.step = `${id}_boss`;
      state.bossIndex = this.bossIndex + 1;
    }
    save();

    this.time.delayedCall(1800, () => {
      const key = this.bossIndex === 0 ? `${id}_friend` : `${id}_friend${this.bossIndex + 1}`;
      this.game.events.once('dialogue-done', () => this.result(turns, lastBoss));
      this.scene.launch('Dialogue', { key, frame: this.chapter.frame, form: this.chapter.form });
    });
  }

  result(turns, lastBoss) {
    const id = this.chapter.id;
    const stars = state.stars[id] ?? 1;
    const reward = lastBoss && this.chapter.reward ? ITEMS[this.chapter.reward] : null;
    const lines = [
      `${turns}턴 만에 심술을 풀었어!`,
      reward ? `받은 선물: ${reward.name}` : '',
      lastBoss ? '다음 장(밤 골목)은 5단계에서 만나요!' : '',
    ].filter(Boolean);
    this.panel(`${josa(this.boss.name, '과', '와')} 친구가 됐어!`, lines, [
      ['대결 다시', () => this.scene.restart({ chapter: id, bossIndex: this.bossIndex, retry: true })],
      ['타이틀로', () => this.scene.start('Title')],
    ], lastBoss ? stars : null);
  }

  panel(title, lines, buttons, stars = null) {
    const layer = this.add.container(0, 0).setDepth(20);
    const dim = this.add.rectangle(0, 0, UI.width, UI.height, 0x2b2d5a, 0.45).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    const y = 300;
    const h = stars != null ? 640 : 560;
    drawPanel(g, 50, y, 620, h, this.chapter.frame);
    layer.add([dim, g]);
    layer.add(this.add.text(UI.width / 2, y + 86, title, { fontFamily: UI.fontTitle, fontSize: '40px', color: '#2b2d5a', align: 'center', wordWrap: { width: 540, useAdvancedWrap: true } }).setOrigin(0.5));
    let ly = y + 170;
    if (stars != null) {
      for (let i = 0; i < 3; i++) {
        const s = this.add.graphics();
        iconStar(s, UI.width / 2 + (i - 1) * 90, ly + 10, 70, i < stars ? 0xffd84a : 0xd8c8a8);
        layer.add(s);
      }
      ly += 90;
    }
    for (const l of lines) {
      layer.add(this.add.text(UI.width / 2, ly, l, { fontFamily: UI.font, fontSize: '28px', color: '#2b2d5a', align: 'center' }).setOrigin(0.5));
      ly += 52;
    }
    const by = y + h - 100;
    buttons.forEach(([label, fn], i) => {
      const bx = buttons.length === 1 ? UI.width / 2 : UI.width / 2 + (i === 0 ? -140 : 140);
      const blue = i === 0;
      layer.add(new Button(this, bx, by, { width: buttons.length === 1 ? 360 : 250, height: 100, fontSize: 30, label, color: blue ? 0x2f7bff : 0xffb347, shade: blue ? 0x1f5fd6 : 0xd98a2b, textColor: blue ? '#ffffff' : '#2b2d5a', onPress: () => { sfx('tap'); fn(); } }));
    });
    layer.alpha = 0;
    this.tweens.add({ targets: layer, alpha: 1, duration: 240 });
  }

  openPause() {
    if (!this.scene.isActive() || this.scene.isActive('Dialogue')) return;
    this.scene.launch('Pause', { chapter: this.chapter.id, frame: this.chapter.frame, under: 'Battle', restartLabel: '대결 처음부터', restartData: { chapter: this.chapter.id, bossIndex: this.bossIndex, retry: true } });
    this.scene.pause();
  }
}
