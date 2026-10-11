// Tiện ích giao diện: tạo phần tử, thông báo, hộp thoại, thanh trên cùng.
(function () {
  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv; } }
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c === null || c === undefined || c === false) continue;
      if (c.nodeType) { el.append(c); continue; }
      const parts = window.Icons ? Icons.rich(c) : null;
      if (parts) el.append(...parts); else el.append(document.createTextNode(String(c)));
    }
    return el;
  }

  function toast(msg, kind) {
    const root = document.getElementById('toasts');
    const t = h('div', { class: 'toast' + (kind ? ' ' + kind : '') }, msg);
    if (window.Sound) { if (kind === 'bad') Sound.bad(); else if (kind === 'good') Sound.good(); }
    root.append(t);
    setTimeout(() => { t.style.transition = 'opacity .25s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 260); }, 2600);
  }

  // Hộp thoại dạng sheet. Trả về đối tượng có close().
  function sheet(content, opts) {
    opts = opts || {};
    const root = document.getElementById('overlay-root');
    const ov = h('div', { class: 'overlay' + (opts.center ? ' center' : ''), role: 'dialog', 'aria-modal': 'true' });
    const box = h('div', { class: 'sheet' }, content);
    ov.append(box);
    function close() { ov.remove(); document.removeEventListener('keydown', onKey); if (opts.onClose) opts.onClose(); }
    function onKey(e) { if (e.key === 'Escape' && !opts.locked) close(); }
    ov.addEventListener('click', e => { if (e.target === ov && !opts.locked) close(); });
    document.addEventListener('keydown', onKey);
    root.append(ov);
    if (window.Sound) Sound.pop();
    const first = box.querySelector('button, input');
    if (first && !opts.noFocus) setTimeout(() => first.focus(), 30);
    return { close, el: box };
  }

  function confirmBox(title, text, okLabel, cancelLabel) {
    return new Promise(resolve => {
      let s;
      const done = v => { resolve(v); s.close(); }; // resolve trước: close() sẽ gọi onClose → resolve(false)
      s = sheet([
        h('h2', {}, title), h('p', {}, text),
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost', onclick: () => done(false) }, cancelLabel || 'Huỷ'),
          h('button', { class: 'btn', onclick: () => done(true) }, okLabel || 'Đồng ý'))
      ], { center: true, onClose: () => resolve(false) });
    });
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function topbar(me) {
    if (!me) return h('header', { class: 'topbar' }, h('div', { class: 'brand' }, '🐱 Nihongo Neko'));
    const hearts = h('span', { class: 'stat hearts' + (me.hearts === 0 ? ' off' : ''), title: me.hearts < me.maxHearts ? 'Tim tiếp theo sau ' + fmtTime(me.nextHeartInSec) : 'Tim đầy' },
      h('span', { class: 'ico', 'aria-hidden': 'true' }, '❤️'), h('span', {}, me.hearts));
    const streak = h('span', { class: 'stat streak' + (me.streak === 0 ? ' off' : ''), title: 'Chuỗi ngày học liên tiếp' },
      h('span', { class: 'ico', 'aria-hidden': 'true' }, '🔥'), h('span', {}, me.streak));
    const coins = h('span', { class: 'stat coins', title: 'Số xu của bạn', id: 'coins-stat' },
      h('span', { class: 'ico', 'aria-hidden': 'true' }, '🪙'), h('span', {}, me.coins));
    return h('header', { class: 'topbar' },
      h('div', { class: 'brand' }, h('span', { 'aria-hidden': 'true' }, '🐱'), 'Nihongo Neko'),
      h('div', { class: 'stats' }, streak, hearts, coins));
  }

  window.UI = { h, toast, sheet, confirmBox, topbar, fmtTime };
})();
