import Phaser from 'phaser';
import { UI } from '../data/ui.js';
import { DIALOGUE, SPEAKER_NAMES } from '../data/dialogue.js';
import { state } from '../state.js';
import { drawPanel } from '../ui/frames.js';
import { iconSkip, iconNext } from '../ui/icons.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { sfx } from '../ui/feedback.js';

// 대사창. 다른 씬 위에 띄운다: scene.launch('Dialogue', { key, frame, from })
// 화면 아무 데나 톡 → 글자가 나오는 중이면 한 번에 다 보이고, 다 보였으면 다음 대사.
// 오른쪽 위 [건너뛰기]로 끝까지 넘긴다. 끝나면 game.events 'dialogue-done' (key) 를 보낸다.
const BOX = { x: 20, w: 680, h: 300, bottom: 1250 };
const TEXT_PAD = 44;
const MAX_LINES = 3;
const SPEED = { normal: 32, fast: 12 }; // 글자 하나 나오는 시간(ms)

// 블루나비 얼굴 칸: 0 기쁨 · 1 놀람 · 2 졸림 · 3 시무룩. 대사에 mood가 없으면 글에서 짐작한다.
const MOOD_FRAME = { joy: 0, surprise: 1, sleepy: 2, sad: 3 };
function guessMood(text) {
  if (/졸려|쿨쿨/.test(text)) return 'sleepy';
  if (/아야|…\s*$|이상해/.test(text)) return 'sad';
  if (/\?|어\?|뭐야/.test(text)) return 'surprise';
  return 'joy';
}

export class DialogueScene extends Phaser.Scene {
  constructor() { super('Dialogue'); }

  init(data) {
    this.key = data.key;
    this.lines = Array.isArray(data.lines) ? data.lines : DIALOGUE[data.key] ?? [];
    this.frame = data.frame ?? 'woodWindow';
    this.form = data.form ?? state.form;
    this.index = -1;
    this.pages = [];
    this.page = 0;
    this.typing = null;
    // 씬은 다시 쓰이므로 지난번 대사창의 '끝남' 표시를 지운다 (안 지우면 두 번째 대사부터 넘어가지 않음)
    this.finished = false;
  }

  create() {
    const { top, bottom } = getSafeInsets(this.game);
    const boxY = BOX.bottom - bottom - BOX.h;
    this.boxY = boxY;

    // 화면 전체를 받는 투명 판 (톡 = 다음)
    this.add.zone(0, 0, UI.width, UI.height).setOrigin(0).setInteractive()
      .on('pointerup', () => this.advance());

    // 대사창 판 (그 장의 창틀 모양)
    const panel = this.add.graphics();
    this.style = drawPanel(panel, BOX.x, boxY, BOX.w, BOX.h, this.frame);
    this.panel = panel;

    this.body = this.add.text(BOX.x + TEXT_PAD, boxY + 62, '', {
      fontFamily: UI.font, fontSize: `${UI.fontSize.dialogue}px`, color: this.style.text,
      lineSpacing: 14, wordWrap: { width: BOX.w - TEXT_PAD * 2, useAdvancedWrap: true },
    });
    // 이름표와 얼굴
    this.nameTag = this.add.container(0, 0);
    this.face = this.add.sprite(BOX.x + 90, boxY - 6, '__DEFAULT').setVisible(false);
    this.next = this.add.graphics();
    this.tweens.add({ targets: this.next, y: 6, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // 건너뛰기 (엄지에서 먼 오른쪽 위: 실수로 눌리지 않게)
    this.makeSkip(top);

    this.input.keyboard?.on('keydown-SPACE', () => this.advance());
    this.input.keyboard?.on('keydown-ENTER', () => this.advance());
    this.input.keyboard?.on('keydown-ESC', () => this.finish());

    // 판이 아래에서 톡 올라온다
    const parts = [panel, this.body, this.nameTag, this.face, this.next];
    parts.forEach((p) => { p.y += 40; p.alpha = 0; });
    this.tweens.add({ targets: parts, y: '-=40', alpha: 1, duration: 260, ease: 'Back.easeOut' });

    this.showLine(0);
  }

  makeSkip(top) {
    const c = this.add.container(UI.width - 110, 64 + top);
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.92).fillRoundedRect(-92, -34, 184, 68, 34);
    bg.lineStyle(3, 0x2b2d5a, 0.25).strokeRoundedRect(-92, -34, 184, 68, 34);
    const label = this.add.text(-18, 0, '건너뛰기', { fontFamily: UI.fontTitle, fontSize: '26px', color: '#2b2d5a' }).setOrigin(0.5);
    const icon = this.add.graphics();
    iconSkip(icon, 54, 0, 30);
    c.add([bg, label, icon]);
    c.setSize(200, 96).setInteractive({ useHandCursor: true })
      .on('pointerup', (p, x, y, e) => { e?.stopPropagation(); sfx('tap'); this.finish(); });
  }

  showLine(i) {
    if (i >= this.lines.length) { this.finish(); return; }
    this.index = i;
    const line = this.lines[i];
    this.drawSpeaker(line);
    // 3줄씩 쪽으로 나눈다
    const wrapped = this.body.getWrappedText(line.text);
    this.pages = [];
    for (let p = 0; p < wrapped.length; p += MAX_LINES) this.pages.push(wrapped.slice(p, p + MAX_LINES).join('\n'));
    this.page = 0;
    this.typePage();
  }

  drawSpeaker(line) {
    const sp = line.speaker;
    const boxY = this.boxY;
    this.nameTag.removeAll(true);
    this.face.setVisible(false);
    const narrator = sp === 'narrator';
    const guide = sp === 'guide';
    this.body.setFontStyle(narrator ? 'italic' : 'normal');
    this.body.setColor(narrator ? '#4a4c78' : this.style.text);

    // 얼굴: 지금은 블루나비 얼굴 그림만 있다(다른 친구 얼굴은 그림 트랙 A3에서 추가)
    let tagX = BOX.x + 36;
    const faceKey = sp === 'blue' ? `face_blue_${this.form}` : `face_${sp}`;
    if (this.textures.exists(faceKey)) {
      const tex = this.textures.get(faceKey);
      // 블루나비 얼굴은 4칸(기쁨·놀람·졸림·시무룩), 친구들 얼굴은 2칸(화남·웃음): 친구가 된 뒤와 엔딩은 웃는 얼굴
      const frame = sp === 'blue'
        ? MOOD_FRAME[line.mood ?? guessMood(line.text)] ?? 0
        : line.mood === 'happy' || /friend|ending/.test(this.key) ? 1 : 0;
      this.face.setTexture(faceKey, tex.has(frame) ? frame : undefined).setDisplaySize(140, 140).setVisible(true);
      this.face.setPosition(BOX.x + 96, boxY - 34);
      this.tweens.add({ targets: this.face, scale: this.face.scale * 1.06, duration: 120, yoyo: true });
      tagX = BOX.x + 180;
    }
    if (narrator) return;
    const name = guide ? '안내' : SPEAKER_NAMES[sp] ?? '';
    const color = guide ? 0x4f9f4c : sp === 'blue' ? 0x2f7bff : this.style.name;
    const t = this.add.text(0, 0, name, { fontFamily: UI.fontTitle, fontSize: '28px', color: '#ffffff' }).setOrigin(0, 0.5);
    const w = t.width + 40;
    const bg = this.add.graphics();
    bg.fillStyle(color, 1).fillRoundedRect(0, -24, w, 48, 24);
    t.setX(20);
    this.nameTag.add([bg, t]);
    this.nameTag.setPosition(tagX, boxY + 2);
  }

  typePage() {
    const full = this.pages[this.page];
    this.next.clear();
    this.typing?.remove();
    let n = 0;
    const ms = SPEED[state.settings.textSpeed] ?? SPEED.normal;
    this.body.setText('');
    this.typing = this.time.addEvent({
      delay: ms,
      repeat: full.length - 1,
      callback: () => {
        n++;
        this.body.setText(full.slice(0, n));
        if (n >= full.length) this.doneTyping();
      },
    });
  }

  doneTyping() {
    this.typing?.remove();
    this.typing = null;
    this.body.setText(this.pages[this.page]);
    this.next.clear();
    iconNext(this.next, BOX.x + BOX.w - 44, this.boxY + BOX.h - 40, 22, 0x2b2d5a);
  }

  advance() {
    if (this.finished) return;
    if (this.typing) { this.doneTyping(); return; }
    sfx('next');
    if (this.page < this.pages.length - 1) { this.page++; this.typePage(); return; }
    this.showLine(this.index + 1);
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.typing?.remove();
    const parts = [this.panel, this.body, this.nameTag, this.face, this.next];
    this.tweens.add({
      targets: parts, alpha: 0, y: '+=30', duration: 200, ease: 'Quad.easeIn',
      onComplete: () => {
        this.game.events.emit('dialogue-done', this.key);
        this.scene.stop();
      },
    });
  }
}
