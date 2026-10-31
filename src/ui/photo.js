// 사진 남기기: 지금 화면을 그림으로 찍어 공유 창(카카오톡 등)으로, 안 되면 내려받기.
import { platform } from '../platform.js';

export function takePhoto(game, filename = 'bluenabi.png') {
  return new Promise((resolve) => {
    game.renderer.snapshot((img) => {
      try {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        shareCanvas(c, filename).then(resolve);
      } catch { resolve('fail'); }
    });
  });
}

// 캔버스 그림을 공유 창으로(카카오톡 선택 가능), 안 되면 내려받기. 결과: 'shared' | 'downloaded' | 'fail'
export function shareCanvas(c, filename, text = '') {
  return new Promise((resolve) => {
      try {
        c.toBlob(async (blob) => {
          if (!blob) { resolve('fail'); return; }
          const file = new File([blob], filename, { type: 'image/png' });
          try {
            if (platform.can.share && navigator.canShare?.({ files: [file] })) {
              await navigator.share({ files: [file], title: '블루나비의 세계여행', text });
              resolve('shared');
              return;
            }
          } catch { /* 공유를 닫았거나 안 됨 → 내려받기 */ }
          try {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 4000);
            resolve('downloaded');
          } catch { resolve('fail'); }
        }, 'image/png');
      } catch { resolve('fail'); }
  });
}
