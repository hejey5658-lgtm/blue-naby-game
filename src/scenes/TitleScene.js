import Phaser from 'phaser';
import { state, save } from '../state.js';

// 'Title' = 처음 화면으로 가는 길목 (2026-11-10~). 19절의 홈 한 화면은 사용자 요청
// ("지구본 화면에서 블루나비·강아지를 톡 하면 바로 게임으로")으로 지구본 입구(Entry)에 합쳤다.
// 여러 화면의 "처음 화면으로"·대결장 링크가 이 이름을 쓰므로 이름만 남겨 두고:
// 대결장 링크로 들어왔으면 대결 카드로, 아니면 지구본 입구로 보낸다.
export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    if (state.pendingMatch) {
      const id = state.pendingMatch;
      state.pendingMatch = null;
      save();
      this.scene.start('Match', { id });
      return;
    }
    this.scene.start('Entry');
  }
}
