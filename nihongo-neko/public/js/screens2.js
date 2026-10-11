// Các màn hình: cửa hàng, nhiệm vụ, bảng xếp hạng/bạn bè, hồ sơ.
(function () {
  const { h, toast, sheet } = UI;
  const Screens = window.Screens;

  // ---------- Cửa hàng ----------
  const SHOP_TABS = [
    ['use', 'Vật phẩm', '🎒'], ['hat', 'Mũ', '👒'], ['outfit', 'Áo', '👘'], ['glasses', 'Kính', '🕶️'],
    ['accessory', 'Phụ kiện', '🔔'], ['bg', 'Hình nền', '🌸'], ['theme', 'Giao diện', '🎨'], ['lesson', 'Bài học', '📜']
  ];

  Screens.shop = async function (app) {
    let data = await API.get('/api/shop');
    app.setMe(data.me);
    let bonus = await API.get('/api/bonus');
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
        tab === 'lesson' ? lessonTab() : h('div', { class: 'shop-grid' }, data.items.filter(i => i.slot === tab).map(itemCard)));
    }

    function lessonTab() {
      const packs = bonus.packs.filter(p => p.mode === 'shop');
      const hidden = bonus.packs.filter(p => p.state === 'locked').length;
      return h('div', {},
        h('p', { class: 'muted small' }, 'Mua một lần, học bao nhiêu lần cũng được. Lần đầu hoàn thành mỗi bài đặc biệt nhận 25 xu.'),
        h('div', { class: 'shop-grid' }, packs.map(p => {
          const owned = p.state === 'open', can = app.me.coins >= p.price;
          return h('div', { class: 'item card' },
            h('div', { class: 'item-ico shop-lesson-ico jp', 'aria-hidden': 'true' }, p.lessons[0] ? p.lessons[0].icon : '語'),
            h('div', { class: 'item-name' }, p.title), h('div', { class: 'item-desc' }, p.desc),
            h('div', { class: 'item-note' }, p.count + ' mục'),
            owned ? h('button', { class: 'btn small good', onclick: () => app.navigate('home') }, 'Học ngay')
              : h('button', { class: 'btn small gold', disabled: can ? null : true, onclick: () => buyLesson(p) }, can ? 'Mua · ' + p.price + ' 🪙' : 'Cần ' + p.price + ' 🪙'));
        })),
        hidden ? h('p', { class: 'muted center small', style: { marginTop: '14px' } }, 'Còn ' + hidden + ' bài ẩn chưa mở khoá. Học đều, kết bạn, nuôi pet và trồng cây để tìm ra chúng!') : null);
    }
    async function buyLesson(p) {
      try {
        const r = await API.post('/api/bonus/buy', { id: p.id });
        bonus = { packs: r.packs, fresh: r.fresh }; app.setMe(r.me); app.refreshTopbar(); Sound.coin();
        toast('Đã mua: ' + p.title, 'good'); draw();
      } catch (e) { toast(e.message, 'bad'); }
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
        Sound.equip();
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

})();
