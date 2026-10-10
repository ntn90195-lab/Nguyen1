// Các màn hình: cửa hàng, nhiệm vụ, bảng xếp hạng/bạn bè, hồ sơ.
(function () {
  const { h, toast, sheet } = UI;
  const Screens = window.Screens;

  // ---------- Cửa hàng ----------
  const SHOP_TABS = [
    ['use', 'Vật phẩm', '🎒'], ['hat', 'Mũ', '👒'], ['outfit', 'Áo', '👘'], ['glasses', 'Kính', '🕶️'],
    ['accessory', 'Phụ kiện', '🔔'], ['bg', 'Hình nền', '🌸'], ['theme', 'Giao diện', '🎨']
  ];

  Screens.shop = async function (app) {
    let data = await API.get('/api/shop');
    app.setMe(data.me);
    let tab = app.shopTab || 'use';
    let tryOn = {}; // thử đồ trước khi mua
    const root = h('div', {});

    function draw() {
      const me = app.me;
      const preview = Object.assign({}, me.equipped, tryOn);
      root.innerHTML = '';
      root.append(
        h('h1', { class: 'page-title' }, 'Cửa hàng'),
        h('div', { class: 'shop-preview card' },
          h('div', { class: 'sp-cat', html: Cat.svg({ equipped: preview, mood: 'happy', className: 'large' }) }),
          h('div', { class: 'sp-info' },
            h('div', { class: 'sp-coins' }, '🪙 ', h('b', {}, me.coins), ' xu'),
            h('p', { class: 'muted' }, Object.keys(tryOn).length ? 'Đang thử đồ. Mua hoặc mặc để giữ lại.' : 'Chạm vào món đồ để thử lên mèo trước khi mua.'),
            Object.keys(tryOn).length ? h('button', { class: 'btn small ghost', onclick: () => { tryOn = {}; draw(); } }, 'Bỏ thử đồ') : null)),
        h('div', { class: 'chips', role: 'tablist' }, SHOP_TABS.map(([id, name, ico]) =>
          h('button', { class: 'chip-tab' + (tab === id ? ' on' : ''), role: 'tab', 'aria-selected': tab === id, type: 'button',
            onclick: () => { tab = app.shopTab = id; draw(); } }, ico + ' ' + name))),
        h('div', { class: 'shop-grid' }, data.items.filter(i => i.slot === tab).map(itemCard)));
    }

    function itemCard(it) {
      const me = app.me;
      const gear = it.kind === 'gear';
      const owned = gear ? !!it.owned : it.owned;
      const canPay = me.coins >= it.price;
      let action;
      if (gear && owned) {
        action = it.equipped
          ? (it.slot === 'theme' ? h('button', { class: 'btn small ghost', disabled: true }, 'Đang dùng')
            : h('button', { class: 'btn small ghost', onclick: () => equip(it, false) }, 'Tháo ra'))
          : h('button', { class: 'btn small good', onclick: () => equip(it, true) }, it.slot === 'theme' ? 'Dùng' : 'Mặc vào');
      } else {
        action = h('button', { class: 'btn small gold', disabled: canPay ? null : true, onclick: () => buy(it) },
          canPay ? 'Mua · ' + it.price + ' 🪙' : 'Cần ' + it.price + ' 🪙');
      }
      const note = !gear ? (it.id === 'freeze' ? 'Đang có: ' + (owned || 0) : it.id === 'coin_boost' && me.coinBoostLeftSec > 0 ? 'Còn ' + Math.ceil(me.coinBoostLeftSec / 60) + ' phút' : '') : '';
      return h('div', { class: 'item card' + (it.equipped ? ' equipped' : ''), onclick: e => {
        if (e.target.closest('button')) return;
        if (gear) { tryOn = Object.assign({}, tryOn); if (it.slot === 'theme') return; tryOn[it.slot] = tryOn[it.slot] === it.id ? undefined : it.id; if (!tryOn[it.slot]) delete tryOn[it.slot]; draw(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      } },
        h('div', { class: 'item-ico', 'aria-hidden': 'true', html: Icons.item(it.id) }),
        h('div', { class: 'item-name' }, it.name),
        h('div', { class: 'item-desc' }, it.desc),
        note ? h('div', { class: 'item-note' }, note) : null,
        action);
    }

    async function buy(it) {
      try {
        const r = await API.post('/api/shop/buy', { id: it.id });
        data.items = r.items; app.setMe(r.me); app.refreshTopbar();
        Sound.coin();
        toast('Đã mua: ' + it.name, 'good');
        if (it.kind === 'gear') { try { const e = await API.post('/api/shop/equip', { id: it.id, on: true }); data.items = e.items; app.setMe(e.me); } catch (_) {} delete tryOn[it.slot]; }
        draw();
      } catch (e) { toast(e.message, 'bad'); }
    }
    async function equip(it, on) {
      try {
        const r = await API.post('/api/shop/equip', { id: it.id, on });
        data.items = r.items; app.setMe(r.me); delete tryOn[it.slot]; draw();
        Sound.tap();
      } catch (e) { toast(e.message, 'bad'); }
    }
    draw();
    return root;
  };

  // ---------- Nhiệm vụ ----------
  Screens.quests = async function (app) {
    const r = await API.get('/api/me');
    app.setMe(r.me);
    const root = h('div', {});
    function draw() {
      const me = app.me;
      root.innerHTML = '';
      root.append(
        h('h1', { class: 'page-title' }, 'Nhiệm vụ'),
        h('div', { class: 'streak-card card' },
          h('div', { class: 'flame' + (me.streak ? ' lit' : ''), 'aria-hidden': 'true' }, '🔥'),
          h('div', {},
            h('div', { class: 'streak-n' }, me.streak + ' ngày'),
            h('p', { class: 'muted' }, me.studiedToday ? 'Hôm nay bạn đã học rồi. Giỏi lắm!' : me.streak ? 'Học 1 bài hôm nay để giữ chuỗi.' : 'Học 1 bài để bắt đầu chuỗi ngày.'),
            h('p', { class: 'muted small' }, 'Kỷ lục: ' + me.bestStreak + ' ngày · Khiên giữ chuỗi: ' + me.freezes))),
        h('div', { class: 'xp-row' },
          h('div', { class: 'card xp' }, h('b', {}, me.xp), h('span', {}, 'XP tổng')),
          h('div', { class: 'card xp' }, h('b', {}, me.weekXp), h('span', {}, 'XP tuần này')),
          h('div', { class: 'card xp' }, h('b', {}, Object.keys(me.completed).length), h('span', {}, 'Bài đã xong'))),
        h('h2', { class: 'sec-title' }, 'Nhiệm vụ hôm nay'),
        h('div', { class: 'quest-list' }, me.quests.map(q => {
          const done = q.progress >= q.target;
          return h('div', { class: 'quest card' + (q.claimed ? ' claimed' : '') },
            h('div', { class: 'q-main' },
              h('div', { class: 'q-title' }, q.title),
              h('div', { class: 'bar' }, h('i', { style: { width: Math.round(q.progress / q.target * 100) + '%' } })),
              h('div', { class: 'q-prog muted' }, Math.min(q.progress, q.target) + '/' + q.target)),
            q.claimed ? h('span', { class: 'q-done' }, '✔ Đã nhận')
              : h('button', { class: 'btn small ' + (done ? 'gold' : 'ghost'), disabled: done ? null : true, onclick: async () => {
                try { const c = await API.post('/api/quests/claim', { id: q.id }); app.setMe(c.me); app.refreshTopbar(); Sound.coin(); toast('+' + c.reward + ' xu', 'good'); draw(); }
                catch (e) { toast(e.message, 'bad'); }
              } }, done ? 'Nhận ' + q.reward + ' 🪙' : q.reward + ' 🪙'));
        })),
        h('p', { class: 'muted center small' }, 'Nhiệm vụ làm mới mỗi ngày.'));
    }
    draw();
    return root;
  };

  // ---------- Bảng xếp hạng và bạn bè ----------
  Screens.board = async function (app) {
    let scope = app.boardScope || 'all';
    const root = h('div', {});
    async function draw() {
      const [lb, fr] = await Promise.all([API.get('/api/leaderboard?scope=' + scope), API.get('/api/friends')]);
      root.innerHTML = '';
      const codeInput = h('input', { class: 'input', placeholder: 'Nhập mã bạn bè (6 ký tự)', maxlength: 8, 'aria-label': 'Mã bạn bè', style: { textTransform: 'uppercase' } });
      root.append(
        h('h1', { class: 'page-title' }, 'Xếp hạng'),
        h('div', { class: 'seg', role: 'tablist' }, [['all', 'Tất cả'], ['friends', 'Bạn bè']].map(([id, name]) =>
          h('button', { class: 'seg-btn' + (scope === id ? ' on' : ''), role: 'tab', 'aria-selected': scope === id, type: 'button',
            onclick: () => { scope = app.boardScope = id; draw(); } }, name))),
        h('p', { class: 'muted small' }, 'Xếp theo XP kiếm được trong tuần này.'),
        h('ol', { class: 'lb' }, lb.list.map((p, i) => h('li', { class: 'lb-row card' + (p.id === lb.meId ? ' me' : '') },
          h('span', { class: 'lb-rank' }, i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1),
          h('span', { class: 'lb-cat', html: Cat.svg({ equipped: Object.assign({}, p.equipped, { bg: null }), plainBg: false, className: 'tiny' }) }),
          h('span', { class: 'lb-name' }, p.username + (p.id === lb.meId ? ' (bạn)' : ''),
            h('small', {}, '🔥 ' + p.streak + ' ngày')),
          h('span', { class: 'lb-xp' }, p.weekXp + ' XP')))),
        scope === 'friends' && lb.list.length <= 1 ? h('p', { class: 'muted center' }, 'Bạn chưa có bạn bè nào. Thêm bạn bằng mã bên dưới nhé!') : '',
        h('div', { class: 'card friend-box' },
          h('h2', { class: 'sec-title' }, 'Kết bạn'),
          h('p', {}, 'Mã của bạn: ', h('b', { class: 'friend-code' }, fr.code), ' ',
            h('button', { class: 'btn small ghost', type: 'button', onclick: async () => {
              try { await navigator.clipboard.writeText(fr.code); toast('Đã sao chép mã', 'good'); } catch (_) { toast('Mã của bạn: ' + fr.code); }
            } }, 'Sao chép')),
          h('div', { class: 'row-gap' }, codeInput,
            h('button', { class: 'btn', type: 'button', onclick: async () => {
              try { const r = await API.post('/api/friends/add', { code: codeInput.value }); toast('Đã kết bạn với ' + r.friend.username, 'good'); draw(); }
              catch (e) { toast(e.message, 'bad'); }
            } }, 'Thêm bạn'))));
    }
    await draw();
    return root;
  };

  // ---------- Hồ sơ ----------
  Screens.profile = async function (app) {
    const r = await API.get('/api/me');
    app.setMe(r.me);
    const root = h('div', {});
    function draw() {
      const me = app.me;
      const nameInput = h('input', { class: 'input', value: me.mascotName, maxlength: 14, 'aria-label': 'Tên mèo' });
      const hourSel = h('select', { class: 'input', 'aria-label': 'Giờ nhắc học', onchange: async e => {
        const v = e.target.value === '' ? null : Number(e.target.value);
        if (v !== null && 'Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (_) {} }
        save({ reminderHour: v });
      } },
        h('option', { value: '' }, 'Tắt'),
        Array.from({ length: 24 }, (_, i) => h('option', { value: i, selected: me.settings.reminderHour === i ? true : null }, String(i).padStart(2, '0') + ':00')));
      const toggle = (key, label, desc) => h('label', { class: 'toggle' },
        h('span', {}, h('b', {}, label), h('small', {}, desc)),
        h('input', { type: 'checkbox', checked: me.settings[key] ? true : null, onchange: e => save({ [key]: e.target.checked }) }),
        h('span', { class: 'switch', 'aria-hidden': 'true' }));
      async function save(patch) {
        try { const s = await API.post('/api/settings', patch); app.setMe(s.me); draw(); } catch (e) { toast(e.message, 'bad'); }
      }
      root.innerHTML = '';
      root.append(
        h('h1', { class: 'page-title' }, 'Hồ sơ'),
        h('div', { class: 'card prof-card' },
          h('div', { class: 'prof-cat', html: Cat.svg({ equipped: me.equipped, mood: 'happy', className: 'large' }) }),
          h('p', { class: 'muted center' }, 'Tài khoản: ' + me.username),
          h('div', { class: 'field' }, h('label', {}, 'Tên của mèo'),
            h('div', { class: 'row-gap' }, nameInput, h('button', { class: 'btn small', type: 'button', onclick: () => save({ mascotName: nameInput.value }) }, 'Lưu'))),
          h('button', { class: 'btn block ghost', type: 'button', onclick: () => app.navigate('shop') }, '👘 Thay đồ cho mèo')),
        h('div', { class: 'card' },
          h('h2', { class: 'sec-title' }, 'Cài đặt'),
          toggle('sound', 'Âm thanh hiệu ứng', 'Tiếng đúng, sai, hoàn thành bài'),
          toggle('tts', 'Giọng đọc tiếng Nhật', Speech.canSpeak() ? (Speech.hasJapaneseVoice() ? 'Đã tìm thấy giọng tiếng Nhật' : 'Máy chưa có giọng tiếng Nhật, âm thanh có thể không phát') : 'Trình duyệt này không hỗ trợ'),
          h('div', { class: 'field', style: { marginTop: '12px' } }, h('label', {}, 'Nhắc học mỗi ngày lúc'), hourSel,
            h('small', { class: 'muted' }, 'Nhắc khi trang web đang mở trong trình duyệt.'))),
        h('button', { class: 'btn block ghost', type: 'button', onclick: async () => { await app.logout(); } }, 'Đăng xuất'));
    }
    draw();
    return root;
  };
})();
