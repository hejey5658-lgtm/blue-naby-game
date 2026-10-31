// PC처럼 넓은 화면: 세로 게임 왼쪽 빈 곳에 "폰으로 하면 더 재밌어요" + 공개 주소 QR (web-release 6절).
// QR은 외부 서비스를 부르지 않고 이 안에서 만든다(qrcode-generator).
import qrcode from 'qrcode-generator';
import { platform } from './platform.js';

const URL = 'https://blue-naby-game.web.app';

export function setupPcPanel() {
  if (platform.isTouch || platform.isFile) return;
  const qr = qrcode(0, 'M');
  qr.addData(URL);
  qr.make();
  const el = document.createElement('aside');
  el.id = 'pc-panel';
  el.setAttribute('aria-label', '폰으로 하기 안내');
  el.innerHTML = `
    <div class="pc-card">
      <p class="pc-title">폰으로 하면 더 재밌어요</p>
      <div class="pc-qr">${qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true })}</div>
      <p class="pc-sub">폰 카메라로 찍으면 바로 열려요</p>
      <p class="pc-url">${URL.replace('https://', '')}</p>
    </div>`;
  const style = document.createElement('style');
  style.textContent = `
    #pc-panel{position:fixed;left:0;top:0;bottom:0;display:none;align-items:center;justify-content:center;z-index:5;pointer-events:none}
    #pc-panel .pc-card{background:#fffaf0;border:6px solid #b98a5e;border-radius:28px;padding:22px 22px 16px;width:220px;text-align:center;color:#2b2d5a;box-shadow:0 10px 24px rgba(43,45,90,.18);pointer-events:auto}
    #pc-panel .pc-title{font:24px/1.3 'Jua',system-ui,sans-serif;margin:0 0 12px}
    #pc-panel .pc-qr{background:#fff;border-radius:12px;padding:8px}
    #pc-panel .pc-qr svg{width:100%;height:auto;display:block}
    #pc-panel .pc-sub{font:16px/1.4 'Gowun Dodum',system-ui,sans-serif;margin:10px 0 2px}
    #pc-panel .pc-url{font:15px/1.4 'Gowun Dodum',system-ui,sans-serif;color:#2f7bff;margin:0;user-select:text}`;
  document.head.appendChild(style);
  document.body.appendChild(el);
  const place = () => {
    // 세로 게임(9:16)이 가운데에 그려지고 남는 왼쪽 폭
    const gameW = Math.min(window.innerWidth, window.innerHeight * (720 / 1280));
    const side = (window.innerWidth - gameW) / 2;
    el.style.width = `${side}px`;
    el.style.display = side >= 280 ? 'flex' : 'none';
  };
  place();
  window.addEventListener('resize', place);
}
