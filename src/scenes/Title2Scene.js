import Phaser from 'phaser';

// 옛 2탄 타이틀(포포네 마당). 2026-11-10 (design-brief 19절) 1탄·2탄 타이틀을 홈('Title') 한 화면으로 합쳤다.
// 옛 저장·링크가 이 이름을 찾아도 멈추지 않게 이름만 남겨 두고 홈으로 보낸다.
export class Title2Scene extends Phaser.Scene {
  constructor() { super('Title2'); }

  create(data) { this.scene.start('Title', data); }
}
