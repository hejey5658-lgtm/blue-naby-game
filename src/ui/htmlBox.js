// 글자를 다뤄야 하는 곳(저장 코드 복사·붙여 넣기)만 HTML 상자로 띄운다.
// 캔버스에서는 글자 선택·붙여 넣기가 안 되기 때문. 브라우저 동작 막기의 예외(data-allow-touch).
const CSS = `
.bbx-dim{position:fixed;inset:0;z-index:20;background:rgba(43,45,90,.55);display:flex;align-items:center;justify-content:center;padding:16px}
.bbx{background:#fffaf0;border:6px solid #b98a5e;border-radius:28px;max-width:520px;width:100%;padding:22px;box-sizing:border-box;color:#2b2d5a;font:18px/1.5 'Gowun Dodum',system-ui,sans-serif}
.bbx h2{font:28px 'Jua',system-ui,sans-serif;margin:0 0 8px}
.bbx p{margin:0 0 12px}
.bbx textarea{width:100%;box-sizing:border-box;min-height:96px;font:16px ui-monospace,monospace;border:2px solid #d2a679;border-radius:14px;padding:10px;color:#2b2d5a;background:#fff;user-select:text;-webkit-user-select:text}
.bbx textarea:focus{outline:3px solid #2f7bff;outline-offset:2px}
.bbx .row{display:flex;gap:10px;margin-top:14px}
.bbx .row.col{flex-direction:column}
.bbx input{width:100%;box-sizing:border-box;font:22px 'Gowun Dodum',system-ui,sans-serif;border:2px solid #d2a679;border-radius:14px;padding:12px;color:#2b2d5a;background:#fff}
.bbx input:focus{outline:3px solid #2f7bff;outline-offset:2px}
.bbx button{flex:1;min-height:56px;border:0;border-radius:18px;font:22px 'Jua',system-ui,sans-serif;color:#fff;background:#2f7bff;box-shadow:0 4px 0 #1f5fd6}
.bbx button.sub{background:#e6dcc8;color:#2b2d5a;box-shadow:0 4px 0 #c9bba0}
.bbx button:focus-visible{outline:3px solid #2b2d5a;outline-offset:2px}
.bbx .msg{min-height:1.5em;font-weight:700;color:#4f9f4c;margin-top:8px}
.bbx .msg.err{color:#c0563a}`;

function ensureStyle() {
  if (document.getElementById('bbx-style')) return;
  const st = document.createElement('style');
  st.id = 'bbx-style';
  st.textContent = CSS;
  document.head.appendChild(st);
}

// opts: { title, text, value, readonly, placeholder, field: 'area'|'input'|'none', maxLength, column, buttons: [{ label, sub, onClick(box) }] }
export function openBox(opts) {
  ensureStyle();
  const dim = document.createElement('div');
  dim.className = 'bbx-dim';
  dim.setAttribute('data-allow-touch', '');
  const box = document.createElement('div');
  box.className = 'bbx';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  const h = document.createElement('h2');
  h.textContent = opts.title;
  const p = document.createElement('p');
  p.textContent = opts.text ?? '';
  const field = opts.field ?? 'area';
  const ta = document.createElement(field === 'input' ? 'input' : 'textarea');
  if (field === 'input') { ta.type = 'text'; ta.maxLength = opts.maxLength ?? 40; ta.autocomplete = 'off'; }
  ta.value = opts.value ?? '';
  ta.readOnly = !!opts.readonly;
  ta.placeholder = opts.placeholder ?? '';
  ta.setAttribute('aria-label', opts.title);
  const msg = document.createElement('div');
  msg.className = 'msg';
  msg.setAttribute('aria-live', 'polite');
  const row = document.createElement('div');
  row.className = opts.column ? 'row col' : 'row';
  const api = {
    value: () => ta.value,
    say: (t, err = false) => { msg.textContent = t; msg.className = err ? 'msg err' : 'msg'; },
    close: () => dim.remove(),
    textarea: ta,
  };
  for (const b of opts.buttons) {
    const btn = document.createElement('button');
    btn.textContent = b.label;
    if (b.sub) btn.className = 'sub';
    btn.addEventListener('click', () => b.onClick(api));
    row.appendChild(btn);
  }
  if (field === 'none') box.append(h, p, msg, row);
  else box.append(h, p, ta, msg, row);
  dim.appendChild(box);
  dim.addEventListener('click', (e) => { if (e.target === dim) api.close(); });
  // 상자를 누른 손가락이 아래 게임까지 전달되지 않게 (Phaser는 window에서 손 뗌을 듣는다)
  for (const ev of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click']) {
    dim.addEventListener(ev, (e) => e.stopPropagation());
  }
  document.body.appendChild(dim);
  if (field !== 'none') setTimeout(() => (opts.readonly ? ta.select() : ta.focus()), 50);
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && field === 'input') opts.buttons[0]?.onClick(api); });
  return api;
}
