// Cộng đồng (xếp hạng, bạn bè, lời mời, nhắc học) và Hồ sơ cá nhân.
(function () {
  const { h, toast, sheet } = UI;
  const Screens = window.Screens;

  function ago(ts) {
    if (!ts) return 'Chưa từng online';
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 5) return 'Đang online';
    if (m < 60) return m + ' phút trước';
    const hr = Math.floor(m / 60);
    if (hr < 24) return hr + ' giờ trước';
    const d = Math.floor(hr / 24);
    return d < 30 ? d + ' ngày trước' : 'Lâu rồi';
  }
  function sfx(path, body, r) {
    if (path.endsWith('/add')) { if (r.accepted) Sound.cheer(); else Sound.request(); }
    else if (path.endsWith('/respond')) { if (body.accept) Sound.cheer(); else Sound.pop(); }
    else if (path.endsWith('/nudge')) Sound.nudge();
  }
  const catOf = (p, cls) => h('span', { class: 'lb-cat', html: Cat.svg({ equipped: Object.assign({}, p.equipped, { bg: null }), className: cls || 'tiny' }) });
  const lv = n => h('span', { class: 'lv' }, 'Lv.' + n);

  // ---------- thân hồ sơ dùng chung (hồ sơ của mình và của bạn) ----------
  function profileBody(p) {
    const u = p.user, li = u.levelInfo;
    const stat = (n, label) => h('div', { class: 'pstat' }, h('b', {}, n), h('span', {}, label));
    const got = p.badges.filter(b => b.got).length;
    return h('div', {},
      h('div', { class: 'prof-head' },
        h('div', { class: 'prof-cat', html: Cat.svg({ equipped: u.equipped, mood: 'happy', className: 'large' }) }),
        h('div', { class: 'prof-name' }, u.username, ' ', lv(li.level)),
        u.bio ? h('p', { class: 'prof-bio' }, u.bio) : null,
        h('div', { class: 'lvbar' }, h('div', { class: 'bar' }, h('i', { style: { width: li.pct + '%' } })), h('small', {}, 'Còn ' + li.toNext + ' XP lên Lv.' + (li.level + 1)))),
      h('div', { class: 'pstats' },
        stat(u.xp, 'XP tổng'), stat(u.weekXp, 'XP tuần'), stat(u.streak + ' / ' + u.bestStreak, 'Chuỗi / kỷ lục'),
        stat(u.lessons, 'Bài đã xong'), stat(u.stars, 'Sao'), stat(u.friends, 'Bạn bè')),
      u.pet ? h('p', { class: 'muted center small' }, 'Thú cưng: ' + u.pet.name + ' (cấp ' + u.pet.level + ')') : null,
      h('h3', { class: 'sec-title small' }, 'Huy hiệu ', h('small', { class: 'muted' }, got + '/' + p.badges.length)),
      h('div', { class: 'badges' }, p.badges.map(b => h('div', { class: 'badge' + (b.got ? ' got' : ''), title: b.name + ': ' + b.desc },
        h('span', { class: 'badge-ico', html: Icons.svg(b.icon) }), h('b', {}, b.name), h('small', {}, b.desc)))),
      h('p', { class: 'muted center small' }, 'Tham gia ' + new Date(u.joined).toLocaleDateString('vi-VN')));
  }

  // ---------- cửa sổ xem hồ sơ người khác ----------
  async function profileSheet(app, id, onChange) {
    let p;
    try { p = await API.get('/api/profile?id=' + id); } catch (e) { return toast(e.message, 'bad'); }
    const s = sheet('', { noFocus: true });
    function draw() {
      const u = p.user;
      const act = async (path, body, msg) => {
        try { const r = await API.post(path, body); sfx(path, body, r); if (r.me) { app.setMe(r.me); app.refreshTopbar(); } if (msg) toast(typeof msg === 'function' ? msg(r) : msg, 'good'); p = await API.get('/api/profile?id=' + id); draw(); if (onChange) onChange(); }
        catch (e) { toast(e.message, 'bad'); }
      };
      const btns = [];
      if (p.relation === 'friend') {
        btns.push(h('button', { class: 'btn', onclick: () => { s.close(); app.farmTarget = id; app.navigate('farm'); } }, 'Thăm vườn'));
        if (!u.studiedToday) btns.push(h('button', { class: 'btn ghost', disabled: p.nudged ? true : null, onclick: () => act('/api/friends/nudge', { id }, 'Đã nhắc ' + u.username) }, p.nudged ? 'Đã nhắc hôm nay' : 'Nhắc học'));
        btns.push(h('button', { class: 'btn ghost', onclick: async () => { if (await UI.confirmBox('Xoá bạn?', 'Bạn sẽ không còn là bạn bè với ' + u.username + '.', 'Xoá bạn', 'Giữ lại')) { await act('/api/friends/remove', { id }, 'Đã xoá bạn'); s.close(); } } }, 'Xoá bạn'));
      } else if (p.relation === 'none') {
        btns.push(h('button', { class: 'btn', onclick: () => act('/api/friends/add', { username: u.username }, r => r.accepted ? 'Hai bạn đã là bạn bè!' : 'Đã gửi lời mời') }, 'Kết bạn'));
      } else if (p.relation === 'outgoing') {
        btns.push(h('button', { class: 'btn ghost', onclick: () => act('/api/friends/cancel', { id: p.requestId }, 'Đã huỷ lời mời') }, 'Đã gửi lời mời · Huỷ'));
      } else if (p.relation === 'incoming') {
        btns.push(h('button', { class: 'btn good', onclick: () => act('/api/friends/respond', { id: p.requestId, accept: true }, 'Đã thành bạn bè!') }, 'Chấp nhận'),
          h('button', { class: 'btn ghost', onclick: async () => { await act('/api/friends/respond', { id: p.requestId, accept: false }); s.close(); } }, 'Từ chối'));
      }
      s.el.replaceChildren(profileBody(p), h('div', { class: 'row wrap' }, btns), h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: () => s.close() }, 'Đóng')));
    }
    draw();
  }

  // ---------- Cộng đồng ----------
  Screens.board = async function (app) {
    let tab = app.boardTab || 'rank';
    let scope = app.boardScope || 'all';
    const root = h('div', {});

    async function draw() {
      const [fr, lb] = await Promise.all([API.get('/api/friends'), tab === 'rank' ? API.get('/api/leaderboard?scope=' + scope) : Promise.resolve(null)]);
      if (app.me.pending !== fr.incoming.length) { app.me.pending = fr.incoming.length; app.updateDot(); }
      root.innerHTML = '';
      root.append(
        h('h1', { class: 'page-title' }, 'Cộng đồng'),
        h('div', { class: 'seg', role: 'tablist' }, [['rank', 'Xếp hạng'], ['friends', 'Bạn bè']].map(([id, name]) =>
          h('button', { class: 'seg-btn' + (tab === id ? ' on' : ''), role: 'tab', 'aria-selected': tab === id, type: 'button',
            onclick: () => { tab = app.boardTab = id; draw(); } }, name, id === 'friends' && fr.incoming.length ? h('span', { class: 'pill' }, fr.incoming.length) : null))),
        tab === 'rank' ? rankView(lb) : friendsView(fr));
    }

    function rankView(lb) {
      return h('div', {},
        h('div', { class: 'chips' }, [['all', 'Tất cả'], ['friends', 'Chỉ bạn bè']].map(([id, name]) =>
          h('button', { class: 'chip-tab' + (scope === id ? ' on' : ''), type: 'button', onclick: () => { scope = app.boardScope = id; draw(); } }, name))),
        h('p', { class: 'muted small' }, 'Xếp theo XP kiếm được trong tuần này. Chạm vào một người để xem hồ sơ.'),
        h('ol', { class: 'lb' }, lb.list.map((p, i) => h('li', { class: 'lb-row card' + (p.id === lb.meId ? ' me' : ''), tabindex: 0, role: 'button',
          onclick: () => p.id === lb.meId ? app.navigate('profile') : profileSheet(app, p.id, draw),
          onkeydown: e => { if (e.key === 'Enter') e.currentTarget.click(); } },
          h('span', { class: 'lb-rank' }, i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1),
          catOf(p),
          h('span', { class: 'lb-name' }, p.username + (p.id === lb.meId ? ' (bạn)' : ''), ' ', lv(p.level), h('small', {}, '🔥 ' + p.streak + ' ngày')),
          h('span', { class: 'lb-xp' }, p.weekXp + ' XP')))),
        scope === 'friends' && lb.list.length <= 1 ? h('p', { class: 'muted center' }, 'Bạn chưa có bạn bè nào. Sang mục "Bạn bè" để kết bạn nhé!') : '');
    }

    async function act(path, body, msg) {
      try { const r = await API.post(path, body); if (r.me) app.setMe(r.me); sfx(path, body, r); if (msg) toast(typeof msg === 'function' ? msg(r) : msg, 'good'); draw(); }
      catch (e) { toast(e.message, 'bad'); }
    }

    function friendsView(fr) {
      const input = h('input', { class: 'input', placeholder: 'Mã bạn bè hoặc tên đăng nhập', maxlength: 24, 'aria-label': 'Mã hoặc tên bạn bè', autocapitalize: 'off',
        onkeydown: e => { if (e.key === 'Enter') send(); } });
      function send() {
        const v = input.value.trim();
        if (!v) return toast('Hãy nhập mã hoặc tên bạn bè', 'bad');
        const isCode = /^[A-Fa-f0-9]{6}$/.test(v);
        act('/api/friends/add', isCode ? { code: v } : { username: v }, r => r.accepted ? 'Hai bạn đã là bạn bè!' : 'Đã gửi lời mời tới ' + r.name);
      }
      const row = (p, right) => h('div', { class: 'frow card' },
        h('button', { class: 'frow-main', type: 'button', onclick: () => profileSheet(app, p.id, draw) }, catOf(p),
          h('span', { class: 'lb-name' }, p.username, ' ', lv(p.level),
            p.lastSeen !== undefined ? h('small', {}, (p.studiedToday ? '✔ Đã học hôm nay · ' : '') + ago(p.lastSeen)) : null)),
        right);
      return h('div', {},
        h('div', { class: 'card friend-box' },
          h('h2', { class: 'sec-title' }, 'Kết bạn'),
          h('p', {}, 'Mã của bạn: ', h('b', { class: 'friend-code' }, fr.code), ' ',
            h('button', { class: 'btn small ghost', type: 'button', onclick: async () => {
              const text = 'Kết bạn với mình trên Nihongo Neko nhé! Mã của mình: ' + fr.code;
              try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(fr.code); toast('Đã sao chép mã', 'good'); } }
              catch (_) { try { await navigator.clipboard.writeText(fr.code); toast('Đã sao chép mã', 'good'); } catch (e) { toast('Mã của bạn: ' + fr.code); } }
            } }, 'Chia sẻ')),
          h('div', { class: 'row-gap' }, input, h('button', { class: 'btn', type: 'button', onclick: send }, 'Gửi lời mời')),
          h('p', { class: 'muted small' }, 'Bạn bè có thể thăm vườn, tặng quà và nhắc bạn học bài. Lời mời cần được chấp nhận.')),

        fr.incoming.length ? h('div', {}, h('h2', { class: 'sec-title' }, 'Lời mời kết bạn'),
          fr.incoming.map(r => row(r.user, h('div', { class: 'frow-btns' },
            h('button', { class: 'btn small good', onclick: () => act('/api/friends/respond', { id: r.id, accept: true }, 'Đã thành bạn bè với ' + r.user.username) }, 'Chấp nhận'),
            h('button', { class: 'btn small ghost', onclick: () => act('/api/friends/respond', { id: r.id, accept: false }) }, 'Từ chối'))))) : '',

        fr.inbox.length ? h('div', {}, h('h2', { class: 'sec-title' }, 'Lời nhắn từ bạn bè'),
          h('div', { class: 'card' }, fr.inbox.map(e => h('div', { class: 'log' }, h('span', { class: 'log-ico', html: Icons.svg('bulb') }),
            h('span', {}, e.from + ' nhắc bạn học bài hôm nay nhé! (' + ago(e.t) + ')'))),
            h('button', { class: 'btn small block', onclick: () => app.navigate('home') }, 'Đi học ngay'))) : '',

        h('h2', { class: 'sec-title' }, 'Bạn bè (' + fr.friends.length + ')'),
        fr.friends.length ? fr.friends.map(p => row(p, h('div', { class: 'frow-btns' },
          h('button', { class: 'btn small', onclick: () => { app.farmTarget = p.id; app.navigate('farm'); } }, 'Vườn'),
          !p.studiedToday ? h('button', { class: 'btn small ghost', disabled: p.nudged ? true : null, onclick: () => act('/api/friends/nudge', { id: p.id }, 'Đã nhắc ' + p.username) }, p.nudged ? 'Đã nhắc' : 'Nhắc học') : null)))
          : h('p', { class: 'muted' }, 'Chưa có bạn bè. Gửi mã của bạn cho người quen hoặc nhập mã của họ ở trên.'),

        fr.outgoing.length ? h('div', {}, h('h2', { class: 'sec-title' }, 'Đang chờ trả lời'),
          fr.outgoing.map(r => row(r.user, h('button', { class: 'btn small ghost', onclick: () => act('/api/friends/cancel', { id: r.id }, 'Đã huỷ lời mời') }, 'Huỷ')))) : '');
    }

    await draw();
    return root;
  };

  // ---------- Hồ sơ của mình ----------
  Screens.profile = async function (app) {
    const [me0, prof] = await Promise.all([API.get('/api/me'), API.get('/api/profile')]);
    app.setMe(me0.me);
    const root = h('div', {});
    function draw() {
      const me = app.me;
      const nameInput = h('input', { class: 'input', value: me.mascotName, maxlength: 14, 'aria-label': 'Tên mèo' });
      const bioInput = h('textarea', { class: 'input', rows: 2, maxlength: 80, placeholder: 'Viết vài dòng giới thiệu (tối đa 80 ký tự)', 'aria-label': 'Giới thiệu' }, me.bio || '');
      const hourSel = h('select', { class: 'input', 'aria-label': 'Giờ nhắc học', onchange: async e => {
        const v = e.target.value === '' ? null : Number(e.target.value);
        if (v !== null && 'Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (_) {} }
        save({ reminderHour: v });
      } },
        h('option', { value: '' }, 'Tắt'),
        Array.from({ length: 24 }, (_, i) => h('option', { value: i, selected: me.settings.reminderHour === i ? true : null }, String(i).padStart(2, '0') + ':00')));
      const toggle = (key, label, desc, on) => h('label', { class: 'toggle' },
        h('span', {}, h('b', {}, label), h('small', {}, desc)),
        h('input', { type: 'checkbox', checked: on ? true : null, onchange: e => save({ [key]: e.target.checked }) }),
        h('span', { class: 'switch', 'aria-hidden': 'true' }));
      async function save(patch) {
        try { const s = await API.post('/api/settings', patch); app.setMe(s.me); if ('bio' in patch || 'mascotName' in patch) { prof.user.bio = s.me.bio; toast('Đã lưu', 'good'); } draw(); } catch (e) { toast(e.message, 'bad'); }
      }
      root.innerHTML = '';
      root.append(
        h('h1', { class: 'page-title' }, 'Hồ sơ'),
        h('div', { class: 'card prof-card' },
          profileBody(Object.assign({}, prof, { user: Object.assign({}, prof.user, { bio: me.bio, levelInfo: me.level, xp: me.xp, weekXp: me.weekXp, streak: me.streak }) })),
          h('div', { class: 'field' }, h('label', {}, 'Giới thiệu bản thân'), bioInput,
            h('button', { class: 'btn small', type: 'button', onclick: () => save({ bio: bioInput.value }) }, 'Lưu giới thiệu')),
          h('div', { class: 'field' }, h('label', {}, 'Tên của mèo'),
            h('div', { class: 'row-gap' }, nameInput, h('button', { class: 'btn small', type: 'button', onclick: () => save({ mascotName: nameInput.value }) }, 'Lưu'))),
          h('button', { class: 'btn block ghost', type: 'button', onclick: () => app.navigate('shop') }, '👘 Thay đồ cho mèo')),
        h('div', { class: 'card' },
          h('h2', { class: 'sec-title' }, 'Cài đặt'),
          toggle('sound', 'Âm thanh hiệu ứng', 'Tiếng đúng, sai, hoàn thành bài', me.settings.sound),
          toggle('music', 'Nhạc nền', 'Giai điệu đàn nhẹ nhàng kiểu Nhật khi bạn dùng app', me.settings.music),
          toggle('tts', 'Giọng đọc tiếng Nhật', Speech.canSpeak() ? (Speech.hasJapaneseVoice() ? 'Đã tìm thấy giọng tiếng Nhật' : 'Máy chưa có giọng tiếng Nhật, âm thanh có thể không phát') : 'Trình duyệt này không hỗ trợ', me.settings.tts),
          toggle('allowHarm', 'Cho bạn bè trêu vườn', 'Tắt thì bạn bè không thả sâu hay hái trộm được (vẫn tưới giúp và tặng quà)', me.allowHarm),
          h('div', { class: 'field', style: { marginTop: '12px' } }, h('label', {}, 'Nhắc học mỗi ngày lúc'), hourSel,
            h('small', { class: 'muted' }, 'Nhắc khi trang web đang mở trong trình duyệt.'))),
        h('div', { class: 'card' },
          h('h2', { class: 'sec-title' }, 'Tài khoản'),
          h('p', { class: 'muted' }, 'Tên đăng nhập: ' + me.username),
          h('div', { class: 'row-gap wrap' },
            h('button', { class: 'btn small ghost', type: 'button', onclick: passwordSheet }, 'Đổi mật khẩu'),
            h('button', { class: 'btn small bad', type: 'button', onclick: deleteSheet }, 'Xoá tài khoản'))),
        h('button', { class: 'btn block ghost', type: 'button', onclick: async () => { await app.logout(); } }, 'Đăng xuất'));
    }

    function passwordSheet() {
      const o = h('input', { class: 'input', type: 'password', autocomplete: 'current-password', 'aria-label': 'Mật khẩu hiện tại', placeholder: 'Mật khẩu hiện tại' });
      const n = h('input', { class: 'input', type: 'password', autocomplete: 'new-password', 'aria-label': 'Mật khẩu mới', placeholder: 'Mật khẩu mới (ít nhất 6 ký tự)' });
      const s = sheet([h('h2', {}, 'Đổi mật khẩu'), h('div', { class: 'field' }, o), h('div', { class: 'field' }, n),
        h('p', { class: 'muted small' }, 'Các thiết bị khác đang đăng nhập sẽ bị đăng xuất.'),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: () => s.close() }, 'Huỷ'),
          h('button', { class: 'btn', onclick: async () => {
            try { await API.post('/api/account/password', { oldPassword: o.value, newPassword: n.value }); s.close(); toast('Đã đổi mật khẩu', 'good'); } catch (e) { toast(e.message, 'bad'); }
          } }, 'Đổi'))], { center: true });
    }
    function deleteSheet() {
      const pw = h('input', { class: 'input', type: 'password', autocomplete: 'current-password', 'aria-label': 'Mật khẩu', placeholder: 'Nhập mật khẩu để xác nhận' });
      const s = sheet([h('h2', {}, 'Xoá tài khoản?'), h('p', {}, 'Toàn bộ tiến độ, xu, vật phẩm, vườn và thú cưng sẽ mất vĩnh viễn. Không thể khôi phục.'), h('div', { class: 'field' }, pw),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: () => s.close() }, 'Giữ lại'),
          h('button', { class: 'btn bad', onclick: async () => {
            try { await API.post('/api/account/delete', { password: pw.value }); s.close(); API.setToken(''); app.me = null; app.showAuth(); toast('Đã xoá tài khoản'); } catch (e) { toast(e.message, 'bad'); }
          } }, 'Xoá vĩnh viễn'))], { center: true });
    }
    draw();
    return root;
  };
})();
