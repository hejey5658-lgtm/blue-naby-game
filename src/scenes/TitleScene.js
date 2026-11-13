import Phaser from 'phaser';
import { UI, landView } from '../data/ui.js';
import { VERSION, IS_TEST_BUILD } from '../data/version.js';
import { Button } from '../ui/Button.js';
import { getSafeInsets } from '../ui/safeArea.js';
import { platform, requestFullscreen } from '../platform.js';
import { state, save } from '../state.js';
import { nextChapterId, prepareChapter } from '../flow.js';
import { unlockAudio, sfx, vibrate } from '../ui/feedback.js';
import { iconGear } from '../ui/icons.js';
import { updateBand, inAppBand, challengeBand } from '../ui/bands.js';
import { setTheme } from '../ui/theme.js';
import { drawSkyline } from '../maze/seoulCity.js';
import { SERIES, DATA, useSeries } from '../series.js';

// 홈 「블루나비와 포포의 여행」 (design-brief 19절, 2026-11-10~): 1탄·2탄 타이틀을 한 화면으로 합쳤다.
// 지구본 입구에서 무엇을 눌러도 여기로 온다. 버튼 [1탄 세계여행] [2탄 사계절 서울] [같이 하기].
// 배경은 썸네일과 같은 그림(하늘·튤립 꽃밭 언덕·서울 빌딩과 남산 타워). 파일 없이 그린다(첫 화면 가볍게).
// 씬 이름은 'Title' 그대로 — 여러 화면의 "처음 화면으로"가 모두 여기로 온다.
const C = { ink: 0x2b2d5a, blue: 0x2f7bff, pink: 0xff7fa3, orange: 0xffb347, sky: 0x8ccbff, sky2: 0xd6efff, hill: 0x7fcf6a, grass: 0x6cc35a, grass2: 0x5fb84e };

const SERIES_BTN = {
  1: { label: '1탄 세계여행', color: C.blue, shade: 0x1f5fd6, textColor: '#ffffff' },
  2: { label: '2탄 사계절 서울', color: C.pink, shade: 0xe0557a, textColor: '#ffffff' },
};

// 탄마다의 진행 (지금 탄은 state 맨 위, 다른 탄은 state.other)
function progressOf(n) {
  return (state.series === 2 ? 2 : 1) === n ? state : state.other;
}

// 버튼 아래 작은 글: "처음부터" / "이어하기 · 3단계 일본" / "여행 끝! 엔딩 보기"
export function progressLabel(n) {
  const p = progressOf(n);
  if (!p || !p.step || p.step === 'new') return '처음부터';
  if (p.cleared && p.step === 'map') return '여행 끝! 엔딩 보기';
  const ch = DATA[n].CHAPTERS;
  // 미로 중이면 그 단계, 단계 사이(map)면 다음에 할 단계(아직 안 깬 첫 단계)
  let i = p.step === 'map' ? ch.findIndex((c) => !(p.stars?.[c.id] > 0)) : ch.findIndex((c) => c.id === p.playing);
  if (i < 0) i = Math.min(ch.length - 1, Math.max(0, (p.chapter ?? 1) - 1));
  return `이어하기 · ${n === 1 ? `${i + 1}단계 ` : ''}${ch[i].name}`;
}

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  init(data) {
    this.highlight = data?.highlight ?? null;
    this.leaving = false;
  }

  create() {
    setTheme('#8ccbff', '#6cc35a');
    this.drawBackdrop();
    this.drawLogo();
    this.drawFriends();
    this.drawControls();
    this.layout();
    // 카카오톡 등 인앱 브라우저 안내 띠(아래), 도전장·새 버전 띠(위)
    const { top, bottom } = getSafeInsets(this.game);
    this.inApp = inAppBand(this, UI.landscape ? 830 : 1222 - bottom);
    if (this.inApp) this.version.setVisible(false);
    challengeBand(this, 140 + top, () => this.startSeries(SERIES.n));
    updateBand(this, 236 + top);
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
    // 입구에서 누른 탄의 버튼이 한 번 반짝
    if (this.highlight && this.seriesBtns[this.highlight]) {
      const b = this.seriesBtns[this.highlight];
      this.tweens.add({ targets: b, scale: 1.06, duration: 220, yoyo: true, repeat: 1, delay: 250, ease: 'Sine.easeInOut' });
    }
    // 각자 폰 대결 링크로 들어왔으면 바로 그 대결 카드로 (design-brief 12절)
    if (state.pendingMatch) {
      const id = state.pendingMatch;
      state.pendingMatch = null;
      save();
      this.time.delayedCall(30, () => this.scene.start('Match', { id }));
    }
  }

  // 하늘·해·구름, 왼쪽 튤립 꽃밭 언덕(1탄의 끝), 오른쪽 서울 빌딩·남산 타워(2탄), 잔디 — 썸네일과 같은 그림
  drawBackdrop() {
    const g = this.add.graphics();
    const X0 = -1300, XW = UI.width + 2600;
    // 하늘: 띠 10개 (그라데이션 대신 — 캔버스 그리기에서도 같게)
    const top = Phaser.Display.Color.ValueToColor(C.sky), bot = Phaser.Display.Color.ValueToColor(C.sky2);
    g.fillStyle(C.sky, 1).fillRect(X0, -1000, XW, 1000);
    for (let i = 0; i < 10; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bot, 9, i);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1).fillRect(X0, i * 100, XW, 101);
    }
    g.fillStyle(C.sky2, 1).fillRect(X0, 1000, XW, 1400);
    g.fillStyle(0xffe27a, 1).fillCircle(610, 120, 54);
    g.fillStyle(0xffffff, 0.95);
    for (const [x, y, s] of [[90, 110, 1], [470, 70, 0.8], [-240, 260, 1.1], [980, 150, 1], [1350, 90, 0.9], [1760, 230, 1]]) {
      g.fillEllipse(x, y, 150 * s, 50 * s).fillEllipse(x - 30 * s, y - 18 * s, 80 * s, 56 * s).fillEllipse(x + 26 * s, y - 14 * s, 70 * s, 48 * s);
    }
    // 서울 빌딩 숲 + 남산 타워 (오른쪽)
    const city = UI.landscape ? 760 : 1000;
    drawSkyline(g, { x0: 330, x1: 2400, baseY: city, maxH: 220, season: 'spring', seed: 19 });
    // 튤립 꽃밭 언덕 (왼쪽)
    g.fillStyle(C.hill, 1).fillEllipse(80, city + 70, 980, 360);
    const cols = [0xff6b5b, 0xffd84a, 0xff9fb8, 0xffffff];
    for (let r = 0; r < 3; r++) {
      for (let x = -360 + r * 18; x < 470 - r * 60; x += 40) {
        const y = city - 40 + r * 34 + Math.abs(x - 80) * 0.12;
        g.fillStyle(0x3f8f3c, 1).fillRect(x - 1.5, y, 3, 14);
        g.fillStyle(cols[(r + Math.round(x / 40)) % 4], 1).fillEllipse(x, y, 16, 20);
      }
    }
    // 잔디 (아래 끝까지)
    g.fillStyle(C.grass, 1).fillRect(X0, city + 90, XW, 2400);
    g.fillStyle(C.grass2, 1).fillRect(X0, city + 90, XW, 12);
    for (let i = 0; i < 70; i++) {
      const x = X0 + 400 + ((i * 113) % (XW - 800)), y = city + 130 + ((i * 61) % 900);
      g.fillStyle(C.grass2, 1).fillTriangle(x, y, x + 6, y - 16, x + 12, y);
    }
  }

  // 로고 카드: "블루나비와 / 포포의 여행" (블루나비 파랑, 포포 분홍)
  drawLogo() {
    const c = this.add.container(UI.width / 2, 300);
    const g = this.add.graphics();
    const W = 620, H = 300;
    g.fillStyle(C.ink, 0.25).fillRoundedRect(-W / 2, -H / 2 + 12, W, H, 44);
    g.fillStyle(0xfffaf0, 1).fillRoundedRect(-W / 2, -H / 2, W, H, 44);
    g.lineStyle(7, C.ink, 1).strokeRoundedRect(-W / 2, -H / 2, W, H, 44);
    c.add(g);
    const line = (y, parts) => {
      const st = (color) => ({ fontFamily: UI.fontTitle, fontSize: '104px', color });
      const ts = parts.map(([t, col]) => this.add.text(0, y, t, st(col)).setOrigin(0, 0.5));
      const w = ts.reduce((s, t) => s + t.width, 0);
      let x = -w / 2;
      for (const t of ts) { t.setX(x); x += t.width; }
      c.add(ts);
    };
    line(-62, [['블루나비', '#2f7bff'], ['와', '#2b2d5a']]);
    line(66, [['포포', '#e0557a'], ['의 여행', '#2b2d5a']]);
    this.logo = c;
  }

  // 블루나비(왼쪽)·포포(오른쪽)가 서로 보며 통통
  drawFriends() {
    this.friends = [];
    const mk = (key, x, flip, delay) => {
      if (!this.textures.exists(key)) return;
      const s = this.add.image(x, 600, key).setDisplaySize(230, 230).setFlipX(flip);
      this.tweens.add({ targets: s, y: 584, duration: 520, yoyo: true, repeat: -1, delay, ease: 'Sine.easeInOut' });
      this.friends.push(s);
    };
    mk('home_bluenabi', 220, false, 0);
    mk('home_popo', 500, false, 260);
  }

  drawControls() {
    // 큰 버튼 3개: 1탄 · 2탄 · 같이 하기 (아래 작은 글로 진행·설명)
    const mkBtn = (opts, sub) => {
      const b = new Button(this, UI.width / 2, 0, { width: 540, height: 136, fontSize: 44, ...opts });
      b.text.setY(-18);
      b.sub = this.add.text(0, 32, sub, { fontFamily: UI.font, fontSize: '26px', color: opts.textColor ?? '#ffffff' }).setOrigin(0.5);
      b.face.add(b.sub);
      return b;
    };
    this.seriesBtns = {};
    for (const n of [1, 2]) {
      this.seriesBtns[n] = mkBtn({ ...SERIES_BTN[n], onPress: () => this.startSeries(n) }, progressLabel(n));
    }
    this.togetherBtn = mkBtn({
      label: '같이 하기', color: C.orange, shade: 0xd98a2b, textColor: '#2b2d5a',
      onPress: () => { if (this.leaving) return; sfx('tap'); unlockAudio(); this.scene.start('Together'); },
    }, '2~3명 · 미로 / 기념품 퐁퐁');

    // 설정 (오른쪽 위)
    this.gear = this.add.container(UI.width - 64, 64);
    const gg = this.add.graphics();
    gg.fillStyle(0xffffff, 0.95).fillCircle(0, 0, 38);
    gg.lineStyle(3, C.ink, 0.2).strokeCircle(0, 0, 38);
    iconGear(gg, 0, 0, 46);
    this.gear.add(gg).setSize(96, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => this.openSettings());

    // 지구본 입구로 (왼쪽 위, 게임장 버튼이 있으면 그 아래)
    const sw = this.add.container(130, window.BB_EMBED ? 140 : 64);
    const sg = this.add.graphics();
    sg.fillStyle(0xffffff, 0.95).fillRoundedRect(-106, -30, 212, 60, 30).lineStyle(3, C.ink, 0.2).strokeRoundedRect(-106, -30, 212, 60, 30);
    sw.add([sg, this.add.text(0, 0, '◀ 지구본', { fontFamily: UI.fontTitle, fontSize: '26px', color: '#2b2d5a' }).setOrigin(0.5)]);
    sw.setSize(216, 96).setInteractive({ useHandCursor: true }).on('pointerup', () => { sfx('tap'); this.scene.start('Entry'); });
    this.globeChip = sw;

    // 게임장(eunyoug_3st_index.html) 안에서 열렸을 때만: 왼쪽 위 [← 게임장]
    this.hub = null;
    if (window.BB_EMBED) {
      this.hub = this.add.container(112, 64);
      const hg = this.add.graphics();
      hg.fillStyle(0xffffff, 0.95).fillRoundedRect(-88, -30, 176, 60, 30);
      hg.lineStyle(3, C.ink, 0.2).strokeRoundedRect(-88, -30, 176, 60, 30);
      this.hub.add([hg, this.add.text(0, 0, '← 게임장', { fontFamily: UI.fontTitle, fontSize: '26px', color: '#2b2d5a' }).setOrigin(0.5)]);
      this.hub.setSize(180, 96).setInteractive({ useHandCursor: true })
        .on('pointerup', () => { sfx('tap'); try { parent.postMessage({ type: 'bb-close' }, '*'); } catch { /* 무시 */ } });
    }

    this.toastText = this.add.text(UI.width / 2, 1200, '', {
      fontFamily: UI.font, fontSize: `${UI.fontSize.small + 4}px`, color: '#2b2d5a', align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    const tag = IS_TEST_BUILD ? `테스트 버전 ${VERSION}` : `v${VERSION}`;
    this.version = this.add.text(UI.width - 24, UI.height - 20, tag, {
      fontFamily: UI.font, fontSize: `${UI.fontSize.small}px`, color: '#2b2d5a',
    }).setOrigin(1, 1).setAlpha(0.6);

    if (!platform.can.storage) {
      this.add.text(24, UI.height - 20, '이 브라우저에서는 기록이 저장되지 않아요', {
        fontFamily: UI.font, fontSize: `${UI.fontSize.small}px`, color: '#a4523a',
      }).setOrigin(0, 1);
    }

    const onSettingsClosed = () => {
      this.input.enabled = true;
      for (const n of [1, 2]) this.seriesBtns[n].sub.setText(progressLabel(n));
    };
    this.game.events.on('settings-closed', onSettingsClosed);
    this.events.once('shutdown', () => this.game.events.off('settings-closed', onSettingsClosed));
  }

  toast(msg) {
    const ty = UI.landscape ? 760 : 1200;
    this.toastText.setText(msg).setAlpha(0).setY(ty + 14);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 1, y: ty, duration: 220, ease: 'Back.easeOut', hold: 2200, yoyo: true });
  }

  openSettings() {
    sfx('tap');
    unlockAudio();
    this.input.enabled = false;
    this.scene.launch('Settings', { frame: SERIES.n === 2 ? 'spring' : 'woodWindow' });
  }

  // 가로 (18·19절): 왼쪽 반 = 로고 + 블루나비·포포, 오른쪽 반 = 버튼 3개 세로
  landscapeView() { return landView(0.8, 720, 420); }

  layout() {
    const btns = [this.seriesBtns[1], this.seriesBtns[2], this.togetherBtn];
    if (UI.landscape) {
      const v = this.landscapeView();
      const { top, right, left } = getSafeInsets(this.game);
      const z = v.zoom;
      this.logo.setPosition(380, 250);
      this.friends.forEach((f, i) => f.setX(i ? 520 : 240));
      btns.forEach((b, i) => b.setPosition(1110, 230 + i * 180));
      this.gear.setPosition(v.right - 60 - right / z, v.top + 56 + top / z);
      this.version.setPosition(v.right - 24 - right / z, v.bottom - 16);
      this.globeChip.setPosition(v.left + 126 + left / z, v.top + 56 + top / z + (window.BB_EMBED ? 76 : 0));
      if (this.hub) this.hub.setPosition(v.left + 112 + left / z, v.top + 56 + top / z);
      this.toastText.setPosition(1110, 760);
      return;
    }
    const { top, bottom } = getSafeInsets(this.game);
    this.logo.setPosition(UI.width / 2, 300 + top * 0.5);
    btns.forEach((b, i) => b.setPosition(UI.width / 2, 790 + i * 166));
    this.version.y = UI.height - 20 - bottom;
    this.gear.y = 64 + top;
    if (this.hub) this.hub.y = 64 + top;
    this.globeChip.y = (window.BB_EMBED ? 140 : 64) + top;
  }

  // 1탄·2탄 여행: 그 탄으로 바꾸고 이어하기(미로 / 여권·앨범) 또는 처음이면 바로 1단계 미로
  startSeries(n) {
    if (this.leaving) return;
    this.leaving = true;
    unlockAudio();
    requestFullscreen();
    sfx('open');
    vibrate('collect');
    useSeries(n);
    const ch = DATA[n].CHAPTERS;
    const playing = state.playing ?? ch[state.chapter - 1]?.id ?? ch[0].id;
    const go = (key, data) => {
      this.cameras.main.fadeOut(260, 255, 250, 240);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
    };
    if (state.step.endsWith('_maze')) return go('Maze', { chapter: playing });
    // 예전 대결 화면 중이던 저장은 그 단계 미로부터 다시 (17절, 친구·선물은 그대로)
    if (state.step.endsWith('_boss')) return go('Maze', { chapter: playing, fresh: true });
    // 단계 사이(예전 여권·앨범 자리)면 아직 안 깬 첫 단계 미로로, 다 깼으면 엔딩 (2026-11-13~ 여권·앨범 화면 없음)
    if (state.step !== 'new') {
      const nx = nextChapterId();
      return nx ? go('Maze', prepareChapter(nx)) : go(SERIES.meta.endingScene);
    }
    // 1탄은 처음에 진화 장면(애벌레 → 나방, 배 타고 중국으로) 뒤 1단계 미로 (2026-11-13~ 한국 미로 뺌)
    if (n === 1) return go('Evolution', { start: true });
    Object.assign(state, { step: `${ch[0].id}_maze`, chapter: 1, playing: ch[0].id, mazeState: null });
    save();
    return go('Maze', { chapter: ch[0].id, fresh: true });
  }
}
