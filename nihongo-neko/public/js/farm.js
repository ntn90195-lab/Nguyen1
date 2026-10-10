// Màn hình Vườn: thú cưng, ô đất trồng cây, kho, và thăm vườn bạn bè.
(function () {
  const { h, toast, sheet } = UI;
  const FA = window.FarmArt;
  const coin = () => Icons.svg('coin');
  const lbl = (ico, text) => [h('span', { class: 'fi', html: FA.icon(ico) }), text];

  function fmtDur(sec) {
    sec = Math.max(0, sec);
    if (sec < 60) return 'dưới 1 phút';
    const m = Math.round(sec / 60);
    if (m < 60) return m + ' phút';
    const hh = Math.floor(m / 60), mm = m % 60;
    return hh + ' giờ' + (mm ? ' ' + mm + ' phút' : '');
  }
  const CROP_ICON = c => FA.icon(c);
  const WHAT_NAME = { water: 'nước', food: 'thức ăn', carrot: 'cà rốt', tomato: 'cà chua', sakura: 'hoa anh đào' };

  function logText(e) {
    const crop = e.crop ? (WHAT_NAME[e.crop] || e.crop) : '';
    if (e.type === 'gift') return e.from + ' tặng bạn 1 ' + (WHAT_NAME[e.what] || e.what) + '.';
    if (e.type === 'help') return e.from + ' đã tưới giúp ' + crop + ' của bạn.';
    if (e.type === 'pest') return e.from + ' đã thả sâu vào ' + crop + ' của bạn!';
    if (e.type === 'steal') return e.from + ' đã hái trộm 1 ' + crop + ' của bạn!';
    return '';
  }

  Screens.farm = async function (app) {
    let data = await API.get('/api/farm');
    app.setMe(data.me);
    let farm = data.farm;
    let visiting = null; app.farmVisit = null;   // id bạn đang thăm
    let view = null;                        // dữ liệu vườn bạn
    const root = h('div', {});

    // làm mới định kỳ khi vẫn đang xem trang này
    const timer = setInterval(() => { if (!root.isConnected) return clearInterval(timer); if (!document.querySelector('.overlay')) refresh(true); }, 60000);

    async function refresh(quiet) {
      try {
        if (visiting) view = await API.get('/api/farm/visit?id=' + visiting);
        else { const r = await API.get('/api/farm'); farm = r.farm; app.setMe(r.me); app.refreshTopbar(); }
        draw();
      } catch (e) { if (!quiet) toast(e.message, 'bad'); }
    }

    async function act(path, body, okMsg) {
      try {
        const r = await API.post(path, body);
        if (r.me) { app.setMe(r.me); app.refreshTopbar(); }
        if (r.farm) farm = r.farm;
        if (r.view) view = r.view;
        if (okMsg) toast(typeof okMsg === 'function' ? okMsg(r) : okMsg, 'good');
        draw();
        return r;
      } catch (e) { toast(e.message, 'bad'); }
    }

    // ---------- khối dùng chung ----------
    function bar(label, value, cls) {
      return h('div', { class: 'need' }, h('span', {}, label), h('div', { class: 'bar ' + cls }, h('i', { style: { width: value + '%' } })), h('b', {}, value));
    }
    function petCard(p, mine) {
      const mood = { happy: 'Bé đang rất vui', ok: 'Bé ổn', hungry: 'Bé đói rồi', thirsty: 'Bé khát nước rồi' }[p.mood];
      return h('div', { class: 'pet-card card' },
        h('div', { class: 'pet-art ' + p.mood, html: FA.pet(p.kind, p.mood) }),
        h('div', { class: 'pet-info' },
          h('div', { class: 'pet-name' }, p.name, ' ', h('small', {}, 'Cấp ' + p.level)),
          h('p', { class: 'muted small' }, mood + '. ' + (mine ? 'Còn ' + p.toNext + ' lần chăm nữa để lên cấp.' : '')),
          bar('Đói', p.food, 'food'), bar('Khát', p.water, 'water')));
    }

    function plotTile(p, i, mine) {
      const tile = h('div', { class: 'plot' + (p && p.ready ? ' ready' : '') + (p && p.pest ? ' pest' : '') });
      tile.append(h('div', { class: 'plot-art', html: FA.plotArt(p) }));
      if (!p) {
        tile.append(h('div', { class: 'plot-state' }, 'Ô trống'));
        if (mine) tile.append(h('button', { class: 'btn small', onclick: () => plantSheet(i) }, 'Gieo hạt'));
        else tile.append(h('div', { class: 'plot-state muted' }, '—'));
        return tile;
      }
      const name = farm && farm.config ? farm.config.crops[p.crop].name : (WHAT_NAME[p.crop] || p.crop);
      tile.append(h('div', { class: 'plot-name' }, name));
      let state;
      if (p.ready) state = 'Đã chín (' + p.qty + ' quả)';
      else if (p.pest) state = 'Có sâu!';
      else if (p.thirsty) state = 'Đang khát nước';
      else state = 'Còn ' + fmtDur(p.leftSec);
      tile.append(h('div', { class: 'plot-state' }, state), h('div', { class: 'bar small' }, h('i', { style: { width: p.pct + '%' } })));
      const btns = h('div', { class: 'plot-btns' });
      if (mine) {
        if (p.ready) btns.append(h('button', { class: 'btn small good', onclick: () => act('/api/farm/plot', { action: 'harvest', plot: i }, r => '+' + r.got + ' ' + WHAT_NAME[r.crop]) }, 'Thu hoạch'));
        else if (p.pest) btns.append(h('button', { class: 'btn small bad', onclick: () => act('/api/farm/plot', { action: 'clear_pest', plot: i }, 'Đã bắt sâu') }, 'Bắt sâu'));
        else btns.append(h('button', { class: 'btn small', onclick: () => act('/api/farm/plot', { action: 'water', plot: i }, 'Đã tưới') }, ...lbl('water', 'Tưới')));
      } else {
        if (p.ready) { if (!p.stolen && p.qty >= 2) btns.append(h('button', { class: 'btn small bad', onclick: () => friendAct('steal', i, 'Bạn đã hái trộm 1 quả!') }, 'Hái trộm')); }
        else {
          btns.append(h('button', { class: 'btn small', onclick: () => friendAct('help', i, 'Đã tưới giúp bạn') }, ...lbl('water', 'Tưới giúp')));
          if (!p.pest) btns.append(h('button', { class: 'btn small ghost', onclick: () => friendAct('pest', i, 'Đã thả sâu!') }, ...lbl('bug', 'Thả sâu')));
        }
      }
      tile.append(btns);
      return tile;
    }

    function friendAct(action, plot, msg) { return act('/api/farm/social', { id: visiting, action, plot }, msg); }

    // ---------- chọn hạt giống ----------
    function plantSheet(i) {
      const s = sheet([
        h('h2', {}, 'Gieo hạt gì?'),
        h('div', { class: 'seed-list' }, Object.entries(farm.config.crops).map(([id, c]) =>
          h('button', { class: 'seed card', disabled: app.me.coins < c.seed ? true : null, onclick: async () => { s.close(); await act('/api/farm/plot', { action: 'plant', plot: i, crop: id }, 'Đã gieo ' + c.name); } },
            h('span', { class: 'seed-ico', html: CROP_ICON(id) }),
            h('span', { class: 'seed-info' }, h('b', {}, c.name),
              h('small', {}, 'Chín sau ' + c.hours + ' giờ tưới đủ nước · ' + c.qty + ' quả/lần')),
            h('span', { class: 'seed-price' }, c.seed, h('span', { html: coin() }))))),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: () => s.close() }, 'Đóng'))
      ]);
    }

    // ---------- cho thú cưng ăn ----------
    function feedSheet() {
      const options = [['food', 'Thức ăn', farm.food, 35]].concat(['carrot', 'tomato'].map(c => [c, farm.config.crops[c].name, farm.crops[c] || 0, farm.config.crops[c].feed]));
      const s = sheet([
        h('h2', {}, 'Cho ăn gì?'),
        h('div', { class: 'seed-list' }, options.map(([id, name, n, pts]) =>
          h('button', { class: 'seed card', disabled: n < 1 ? true : null, onclick: async () => { s.close(); await act('/api/farm/pet', { action: 'feed', with: id }, 'Bé ăn ngon lành!'); } },
            h('span', { class: 'seed-ico', html: id === 'food' ? FA.icon('food') : CROP_ICON(id) }),
            h('span', { class: 'seed-info' }, h('b', {}, name), h('small', {}, 'Hồi ' + pts + ' đói · bạn có ' + n))))),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: () => s.close() }, 'Đóng'))
      ]);
    }

    function adoptSheet(kind) {
      const k = farm.config.pets[kind];
      const input = h('input', { class: 'input', maxlength: 14, placeholder: 'Tên bé (có thể để trống)', 'aria-label': 'Tên thú cưng' });
      const s = sheet([
        h('div', { class: 'center pet-big', html: FA.pet(kind, 'happy') }),
        h('h2', { class: 'center' }, 'Nhận nuôi ' + k.name),
        h('div', { class: 'field' }, input),
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost', onclick: () => s.close() }, 'Để sau'),
          h('button', { class: 'btn gold', disabled: app.me.coins < k.adopt ? true : null, onclick: async () => { s.close(); await act('/api/farm/pet', { action: 'adopt', kind, name: input.value }, 'Chào mừng bé về nhà!'); } }, 'Nhận · ' + k.adopt, h('span', { html: coin() })))
      ], { center: true });
    }

    function renameSheet() {
      const input = h('input', { class: 'input', maxlength: 14, value: farm.pet.name, 'aria-label': 'Tên thú cưng' });
      const s = sheet([h('h2', {}, 'Đổi tên cho bé'), h('div', { class: 'field' }, input),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: () => s.close() }, 'Huỷ'),
          h('button', { class: 'btn', onclick: async () => { s.close(); await act('/api/farm/pet', { action: 'rename', name: input.value }, 'Đã đổi tên'); } }, 'Lưu'))], { center: true });
    }

    // ---------- trang vườn của mình ----------
    async function drawMine() {
      let friends = [];
      try { friends = (await API.get('/api/friends')).friends; } catch (_) {}
      const cropsHave = Object.keys(farm.config.crops).filter(c => (farm.crops[c] || 0) > 0);
      root.innerHTML = '';
      root.append(
        h('h1', { class: 'page-title' }, 'Vườn của bạn'),
        h('div', { class: 'stock card' },
          h('div', { class: 'stock-row' },
            h('span', { class: 'stock-item' }, h('span', { html: FA.icon('water') }), h('b', {}, farm.water), ' nước'),
            h('span', { class: 'stock-item' }, h('span', { html: FA.icon('food') }), h('b', {}, farm.food), ' thức ăn')),
          h('div', { class: 'buy-row' },
            h('button', { class: 'btn small gold', disabled: app.me.coins < farm.config.waterPrice ? true : null, onclick: () => act('/api/farm/buy', { what: 'water', n: 1 }, 'Đã mua 1 nước') }, 'Mua nước · ' + farm.config.waterPrice, h('span', { html: coin() })),
            h('button', { class: 'btn small gold', disabled: app.me.coins < farm.config.foodPrice ? true : null, onclick: () => act('/api/farm/buy', { what: 'food', n: 1 }, 'Đã mua 1 thức ăn') }, 'Mua thức ăn · ' + farm.config.foodPrice, h('span', { html: coin() })))),
        // thú cưng
        h('h2', { class: 'sec-title' }, 'Thú cưng'),
        farm.pet ? h('div', {}, petCard(farm.pet, true),
          h('div', { class: 'pet-btns' },
            h('button', { class: 'btn small', onclick: feedSheet }, ...lbl('food', 'Cho ăn')),
            h('button', { class: 'btn small', onclick: () => act('/api/farm/pet', { action: 'drink' }, 'Bé uống nước') }, ...lbl('water', 'Cho uống')),
            h('button', { class: 'btn small ghost', onclick: renameSheet }, 'Đổi tên')),
          h('button', { class: 'btn block ' + (farm.pet.canClaim ? 'gold' : 'ghost'), disabled: farm.pet.canClaim ? null : true,
            onclick: () => act('/api/farm/pet', { action: 'claim' }, r => 'Bé tặng bạn ' + r.reward + ' xu!') },
            ...lbl('gift', farm.pet.claimedToday ? 'Hôm nay bé đã tặng quà rồi' : farm.pet.canClaim ? 'Nhận quà của bé · ' + farm.pet.reward + ' xu' : 'Chăm bé no và đủ nước để nhận quà')))
          : h('div', { class: 'card' }, h('p', {}, 'Bạn chưa có thú cưng. Chọn một bé để nhận nuôi nhé!'),
            h('div', { class: 'adopt-grid' }, Object.entries(farm.config.pets).map(([k, v]) =>
              h('button', { class: 'adopt card', onclick: () => adoptSheet(k) }, h('span', { html: FA.pet(k, 'happy') }), h('b', {}, v.name), h('small', {}, v.adopt, h('span', { html: coin() })))))),
        // vườn
        h('h2', { class: 'sec-title' }, 'Vườn rau'),
        h('div', { class: 'plots' }, farm.plots.map((p, i) => plotTile(p, i, true)),
          farm.nextPlotCost !== null ? h('button', { class: 'plot locked', disabled: app.me.coins < farm.nextPlotCost ? true : null, onclick: () => act('/api/farm/plot', { action: 'unlock' }, 'Đã mở thêm 1 ô đất') },
            h('span', { class: 'plot-art', html: Icons.svg('lock') }), h('span', {}, 'Mở ô đất'), h('b', {}, farm.nextPlotCost, h('span', { html: coin() }))) : null),
        // kho
        h('h2', { class: 'sec-title' }, 'Kho nông sản'),
        h('div', { class: 'card' }, cropsHave.length ? cropsHave.map(c => h('div', { class: 'crop-row' },
          h('span', { class: 'crop-ico', html: CROP_ICON(c) }), h('b', {}, farm.config.crops[c].name), h('span', { class: 'muted' }, '× ' + farm.crops[c]),
          h('button', { class: 'btn small gold', onclick: () => act('/api/farm/sell', { crop: c, n: farm.crops[c] }, r => '+' + r.coins + ' xu') }, 'Bán hết · ' + farm.config.crops[c].sell * farm.crops[c], h('span', { html: coin() }))))
          : h('p', { class: 'muted' }, 'Chưa có nông sản. Thu hoạch cây để cho thú cưng ăn, tặng bạn bè hoặc bán lấy xu.')),
        // tin tức
        farm.log.length ? h('div', {}, h('h2', { class: 'sec-title' }, 'Tin từ bạn bè'),
          h('div', { class: 'card' }, farm.log.map(e => h('div', { class: 'log ' + e.type }, h('span', { class: 'log-ico', html: FA.icon(e.type === 'gift' ? 'gift' : e.type === 'help' ? 'water' : 'bug') }), h('span', {}, logText(e)))))) : '',
        // bạn bè
        h('h2', { class: 'sec-title' }, 'Thăm vườn bạn bè'),
        friends.length ? h('div', { class: 'friend-list' }, friends.map(f => h('button', { class: 'friend-chip card', onclick: () => { visiting = app.farmVisit = f.id; view = null; draw(); } },
          h('span', { class: 'lb-cat', html: Cat.svg({ equipped: Object.assign({}, f.equipped, { bg: null }), className: 'tiny' }) }), h('b', {}, f.username))))
          : h('p', { class: 'muted' }, 'Chưa có bạn bè. Thêm bạn ở tab Xếp hạng để cùng chơi nhé!'));
    }

    // ---------- trang vườn của bạn ----------
    async function drawFriend() {
      if (!view) { try { view = await API.get('/api/farm/visit?id=' + visiting); } catch (e) { toast(e.message, 'bad'); visiting = app.farmVisit = null; return draw(); } }
      const v = view;
      const cfg = farm.config;
      const giftBtn = (what, ico, name, have) => h('button', { class: 'btn small ghost', disabled: have < 1 || v.left.gift < 1 ? true : null,
        onclick: () => act('/api/farm/social', { id: visiting, action: 'gift', what }, 'Đã tặng 1 ' + name) }, h('span', { class: 'fi', html: ico }), name + ' (' + have + ')');
      root.innerHTML = '';
      root.append(
        h('button', { class: 'btn small ghost', onclick: () => { visiting = app.farmVisit = null; view = null; draw(); } }, '← Về vườn của mình'),
        h('h1', { class: 'page-title' }, 'Vườn của ' + v.friend.username),
        v.pet ? petCard(v.pet, false) : h('div', { class: 'card muted' }, 'Bạn này chưa có thú cưng.'),
        h('h2', { class: 'sec-title' }, 'Cây trồng'),
        h('div', { class: 'plots' }, v.plots.map((p, i) => plotTile(p, i, false))),
        h('p', { class: 'muted small' }, 'Hôm nay còn: tưới giúp ' + v.left.help + ' · trêu ' + v.left.harm + ' · tặng quà ' + v.left.gift + '. Bạn bè sẽ thấy ai đã giúp hoặc trêu họ.'),
        h('h2', { class: 'sec-title' }, 'Tặng quà'),
        h('div', { class: 'gift-row' },
          giftBtn('water', FA.icon('water'), 'nước', v.mine.water),
          giftBtn('food', FA.icon('food'), 'thức ăn', v.mine.food),
          Object.keys(cfg.crops).map(c => giftBtn(c, CROP_ICON(c), cfg.crops[c].name.toLowerCase(), v.mine.crops[c] || 0))));
    }

    function draw() { return visiting ? drawFriend() : drawMine(); }
    await draw();
    return root;
  };
})();
