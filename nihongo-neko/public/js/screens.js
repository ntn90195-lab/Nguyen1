// Các màn hình: đăng nhập, lộ trình học (trang chủ).
(function () {
  const { h, toast, sheet } = UI;
  const TYPE_NAME = { kana: 'Chữ cái', vocab: 'Từ vựng', kanji: 'Kanji', gram: 'Ngữ pháp', review: 'Ôn tập' };
  const TYPE_HELP = {
    kana: 'Học cách đọc và nhận mặt chữ cái.',
    vocab: 'Học từ mới, nghe phát âm và luyện nhớ.',
    kanji: 'Học chữ Hán, nghĩa và cách đọc trong từ thật.',
    gram: 'Học mẫu câu, sắp xếp và điền từ.',
    review: 'Ôn lại những gì đã học trong chương.'
  };

  const Screens = window.Screens = {};

  // ---------- Đăng nhập / đăng ký ----------
  Screens.auth = function (app) {
    let mode = 'login';
    const err = h('p', { class: 'auth-err', role: 'alert' });
    const user = h('input', { class: 'input', id: 'au', autocomplete: 'username', maxlength: 20, placeholder: 'Ví dụ: haruka_vn' });
    const pass = h('input', { class: 'input', id: 'ap', type: 'password', autocomplete: 'current-password', placeholder: 'Ít nhất 6 ký tự' });
    const submit = h('button', { class: 'btn block big', type: 'submit' }, 'Đăng nhập');
    const switchBtn = h('button', { class: 'link-btn', type: 'button' }, 'Chưa có tài khoản? Tạo tài khoản mới');

    function setMode(m) {
      mode = m; err.textContent = '';
      submit.textContent = m === 'login' ? 'Đăng nhập' : 'Tạo tài khoản';
      switchBtn.textContent = m === 'login' ? 'Chưa có tài khoản? Tạo tài khoản mới' : 'Đã có tài khoản? Đăng nhập';
      pass.autocomplete = m === 'login' ? 'current-password' : 'new-password';
    }
    switchBtn.onclick = () => setMode(mode === 'login' ? 'register' : 'login');

    const form = h('form', { class: 'auth-form', onsubmit: async e => {
      e.preventDefault(); err.textContent = ''; submit.disabled = true;
      try {
        const r = await API.post(mode === 'login' ? '/api/login' : '/api/register', { username: user.value, password: pass.value });
        API.setToken(r.token);
        app.setMe(r.me);
        app.showMain('home');
        if (mode === 'register') toast('Chào mừng bạn! Tặng bạn ' + r.me.coins + ' xu khởi đầu 🪙', 'good');
      } catch (ex) { err.textContent = ex.message; }
      submit.disabled = false;
    } },
      h('div', { class: 'field' }, h('label', { for: 'au' }, 'Tên đăng nhập'), user),
      h('div', { class: 'field' }, h('label', { for: 'ap' }, 'Mật khẩu'), pass),
      err, submit, switchBtn);

    return h('div', { class: 'auth' },
      h('div', { class: 'auth-hero' },
        h('div', { class: 'auth-cat', html: Cat.svg({ equipped: { hat: 'hat_ribbon' }, mood: 'happy', className: 'hero' }) }),
        h('h1', { class: 'mincho auth-title' }, 'Nihongo Neko'),
        h('p', { class: 'auth-sub jp' }, 'にほんご ・ ネコ'),
        h('p', { class: 'auth-tag' }, 'Học tiếng Nhật N5 từ bảng chữ cái đến Kanji, kiếm xu và thay đồ cho mèo.')),
      h('div', { class: 'card auth-card' }, form));
  };

  // ---------- Trang chủ: lộ trình ----------
  const OFFSETS = [0, 38, 62, 38, 0, -38, -62, -38];

  Screens.home = async function (app) {
    const data = await API.get('/api/curriculum');
    app.setMe(data.me);
    app.units = data.units; app.status = data.status;
    const me = data.me;

    // bài hiện tại = bài mở khóa đầu tiên chưa hoàn thành
    let currentId = null;
    for (const u of data.units) for (const l of u.lessons) { if (!currentId && !data.status[l.id].done) currentId = l.id; }

    const top = [];
    if (me.mistakeCount > 0) {
      top.push(h('button', { class: 'practice-card', type: 'button', onclick: () => app.startPractice() },
        h('span', { class: 'pc-ico', 'aria-hidden': 'true' }, '🎯'),
        h('span', { class: 'pc-text' }, h('b', {}, 'Ôn lại chỗ hay sai'), h('span', {}, me.mistakeCount + ' mục cần luyện thêm')),
        h('span', { class: 'pc-go' }, 'Luyện')));
    }
    if (me.hearts === 0) {
      top.push(h('div', { class: 'notice bad' }, 'Bạn hết tim. Tim hồi 1 cái sau ' + UI.fmtTime(me.nextHeartInSec) + ', hoặc mua ở Cửa hàng.'));
    }
    if (me.coinBoostLeftSec > 0) {
      top.push(h('div', { class: 'notice gold' }, '🧧 Bùa nhân đôi xu còn ' + Math.ceil(me.coinBoostLeftSec / 60) + ' phút.'));
    }

    const path = h('div', { class: 'path' }, top);
    let nodeNo = 0;
    for (const u of data.units) {
      const doneCount = u.lessons.filter(l => data.status[l.id].done).length;
      const section = h('section', { class: 'unit', style: { '--unit': u.color } },
        h('div', { class: 'unit-banner' },
          h('div', { class: 'unit-glyph jp', 'aria-hidden': 'true' }, u.icon),
          h('div', { class: 'unit-text' }, h('h2', { class: 'mincho' }, u.title), h('p', {}, u.desc)),
          h('div', { class: 'unit-count', 'aria-label': doneCount + ' trên ' + u.lessons.length + ' bài' }, doneCount + '/' + u.lessons.length)));
      path.append(section);
      const col = h('div', { class: 'nodes', style: { '--unit': u.color } });
      u.lessons.forEach(l => {
        const st = data.status[l.id];
        const cls = st.done ? 'done' : l.id === currentId ? 'current' : st.unlocked ? 'open' : 'locked';
        const dx = OFFSETS[nodeNo % OFFSETS.length]; nodeNo++;
        const rot = ((nodeNo * 37) % 9) - 4;
        const node = h('button', { class: 'node ' + cls, type: 'button', style: { '--rot': rot + 'deg' },
          'aria-label': l.title + (st.done ? ', đã hoàn thành ' + st.stars + ' sao' : st.unlocked ? '' : ', chưa mở khóa'),
          onclick: () => Screens.lessonSheet(app, l, st, cls) },
          h('span', { class: 'node-ico jp' }, st.unlocked ? l.icon : '🔒'));
        const wrap = h('div', { class: 'node-wrap', style: { transform: 'translateX(' + dx + 'px)' }, 'data-id': l.id },
          cls === 'current' ? h('div', { class: 'start-tip' }, 'Bắt đầu') : null,
          node,
          st.done ? h('div', { class: 'node-stars' }, '★'.repeat(st.stars) + '☆'.repeat(3 - st.stars)) : null);
        col.append(wrap);
      });
      section.append(col);
    }
    // bài đặc biệt: bài ẩn và bài đã mua
    const bn = data.bonus;
    (bn.fresh || []).forEach((f, i) => setTimeout(() => { Sound.secret(); toast('Bài ẩn mới mở khoá: ' + f.title + '!', 'good'); }, 600 + i * 900));
    const visible = bn.packs.filter(p => p.state !== 'buyable').sort((a, b) => (a.state === 'locked') - (b.state === 'locked'));
    const buyable = bn.packs.filter(p => p.state === 'buyable').length;
    if (bn.packs.length) {
      const sec = h('section', { class: 'bonus' },
        h('div', { class: 'bonus-head' }, h('h2', { class: 'mincho' }, 'Bài đặc biệt'),
          h('p', {}, 'Bài ẩn tự mở khi bạn đạt điều kiện bí mật. Bài khác mua bằng xu ở Cửa hàng.')),
        h('div', { class: 'bonus-grid' }, visible.map(p => {
          if (p.state === 'locked') return h('div', { class: 'bpack locked' },
            h('div', { class: 'bpack-ico', html: Icons.svg('lock') }), h('b', {}, '???'), h('small', {}, p.desc));
          const l = p.lessons[0], doneAll = p.lessons.every(x => x.done);
          return h('button', { class: 'bpack open' + (doneAll ? ' done' : ''), type: 'button',
            onclick: () => p.lessons.length === 1 ? Screens.lessonSheet(app, p.lessons[0], { unlocked: true, done: p.lessons[0].done, stars: p.lessons[0].stars }, 'open')
              : Screens.lessonSheet(app, p.lessons.find(x => !x.done) || p.lessons[0], { unlocked: true, done: false, stars: 0 }, 'open') },
            h('div', { class: 'bpack-ico jp' }, l.icon), h('b', {}, p.title), h('small', {}, p.desc),
            h('span', { class: 'bpack-state' }, doneAll ? '★'.repeat(Math.min(...p.lessons.map(x => x.stars)) || 1) : p.mode === 'secret' ? 'Mới mở khoá' : 'Đã mua'));
        })),
        buyable ? h('button', { class: 'btn ghost block', type: 'button', onclick: () => { app.shopTab = 'lesson'; app.navigate('shop'); } }, 'Xem ' + buyable + ' bài có thể mua ở Cửa hàng') : null);
      path.append(sec);
    }
    path.append(h('p', { class: 'center muted path-end' }, 'Bạn đã đi hết lộ trình N5 hiện có. Hãy ôn lại và giữ chuỗi ngày học nhé!'));

    const root = h('div', {}, path);
    setTimeout(() => {
      const cur = root.querySelector('.node-wrap .node.current');
      if (cur) cur.scrollIntoView({ block: 'center', behavior: 'auto' });
    }, 50);
    return root;
  };

  Screens.lessonSheet = function (app, l, st, cls) {
    if (!st.unlocked) { toast('Hãy hoàn thành bài trước để mở khóa bài này.'); return; }
    const s = sheet([
      h('div', { class: 'ls-head' },
        h('div', { class: 'ls-seal jp' }, l.icon),
        h('div', {}, h('h2', {}, l.title), h('p', { class: 'muted' }, TYPE_NAME[l.type] + (l.count ? ' · ' + l.count + ' mục mới' : '')))),
      h('p', {}, TYPE_HELP[l.type]),
      st.done ? h('p', { class: 'ls-stars' }, 'Kết quả tốt nhất: ' + '★'.repeat(st.stars) + '☆'.repeat(3 - st.stars)) : null,
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost', onclick: () => s.close() }, 'Để sau'),
        h('button', { class: 'btn', onclick: () => { s.close(); app.startLesson(l.id); } }, st.done ? 'Học lại' : 'Bắt đầu'))
    ]);
  };
})();
