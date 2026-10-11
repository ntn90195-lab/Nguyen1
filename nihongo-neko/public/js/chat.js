// Tab Cộng đồng: phòng chat công khai (quốc tế) và các bảng xếp hạng.
(function () {
  const { h, toast, sheet } = UI;
  const { ago, catOf, lv, profileSheet } = window.Community;

  const hhmm = ts => { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  function when(ts) {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return 'vừa xong';
    if (m < 60) return m + ' phút';
    return m < 1440 ? Math.floor(m / 60) + ' giờ' : Math.floor(m / 1440) + ' ngày';
  }
  const HUES = [8, 28, 48, 120, 170, 200, 230, 275, 320];
  const hue = id => HUES[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  const avatar = (id, name) => h('span', { class: 'av', style: { background: 'hsl(' + hue(id) + ' 62% 86%)', color: 'hsl(' + hue(id) + ' 45% 28%)' } }, [...String(name)][0].toUpperCase());

  // ---------- phòng chat ----------
  function roomView(app, roomInfo, back) {
    const root = h('div', { class: 'chat' });
    let sig = '', lastId = 0, busy = false, alive = true, timer = null;
    const list = h('div', { class: 'chat-list', role: 'log', 'aria-live': 'polite', 'aria-label': 'Tin nhắn' });
    const input = h('input', { class: 'input', placeholder: 'Nhắn gì đó…', maxlength: 200, 'aria-label': 'Nội dung tin nhắn', autocomplete: 'off',
      onkeydown: e => { if (e.key === 'Enter' && !e.isComposing) send(); } });
    const sendBtn = h('button', { class: 'btn', type: 'button', onclick: send }, 'Gửi');
    const note = h('p', { class: 'chat-note' });
    const count = h('small', { class: 'chat-count' });
    input.addEventListener('input', () => { count.textContent = input.value.length >= 150 ? input.value.length + '/200' : ''; });

    root.append(
      h('div', { class: 'chat-head' },
        h('button', { class: 'btn small ghost', type: 'button', onclick: () => { stop(); back(); } }, '‹ Các phòng'),
        h('div', { class: 'chat-title' }, h('b', {}, roomInfo.name), h('small', {}, roomInfo.desc))),
      h('p', { class: 'chat-rules' }, 'Hãy lịch sự và không gửi link. Chạm vào tin nhắn của người khác để xem hồ sơ, báo cáo hoặc chặn.'),
      list, note,
      h('div', { class: 'chat-box' }, input, sendBtn, count));

    function stop() { alive = false; clearInterval(timer); }

    function msgNode(m) {
      const node = h('div', { class: 'msg' + (m.mine ? ' mine' : '') },
        m.mine ? '' : avatar(m.uid, m.name),
        h('div', { class: 'msg-body' },
          h('div', { class: 'msg-meta' }, m.mine ? 'Bạn' : m.name, ' ', lv(m.level), h('small', {}, hhmm(m.at))),
          h('button', { class: 'bubble', type: 'button', onclick: () => actions(m) }, m.text)));
      return node;
    }

    function actions(m) {
      const s = sheet('', { noFocus: true });
      const close = () => s.close();
      const items = [h('p', { class: 'bubble-quote' }, m.text)];
      if (m.mine) {
        items.push(h('button', { class: 'btn block bad', onclick: async () => {
          try { await API.post('/api/chat/delete', { room: roomInfo.id, id: m.id }); close(); toast('Đã xoá tin nhắn', 'good'); refresh(); } catch (e) { toast(e.message, 'bad'); }
        } }, 'Xoá tin này'));
      } else {
        items.push(h('button', { class: 'btn block', onclick: () => { close(); profileSheet(app, m.uid, refresh); } }, 'Xem hồ sơ ' + m.name));
        items.push(h('button', { class: 'btn block ghost', disabled: m.reported ? true : null, onclick: async () => {
          try { await API.post('/api/chat/report', { room: roomInfo.id, id: m.id }); close(); toast('Đã gửi báo cáo, cảm ơn bạn', 'good'); refresh(); } catch (e) { toast(e.message, 'bad'); }
        } }, m.reported ? 'Đã báo cáo tin này' : 'Báo cáo tin nhắn'));
        items.push(h('button', { class: 'btn block ghost', onclick: async () => {
          if (!await UI.confirmBox('Chặn ' + m.name + '?', 'Bạn sẽ không thấy tin của người này nữa, hai bạn huỷ kết bạn và không gửi được lời mời cho nhau. Có thể bỏ chặn trong Hồ sơ.', 'Chặn', 'Thôi')) return;
          try { await API.post('/api/block', { id: m.uid }); Sound.bad(); close(); toast('Đã chặn ' + m.name, 'good'); refresh(); } catch (e) { toast(e.message, 'bad'); }
        } }, 'Chặn ' + m.name));
      }
      items.push(h('button', { class: 'btn block ghost', onclick: close }, 'Đóng'));
      s.el.replaceChildren(...items);
    }

    function paint(r, force) {
      const msgs = r.messages;
      const newSig = msgs.map(m => m.id + (m.reported ? 'r' : '')).join(',');
      note.textContent = r.mutedSec ? 'Bạn đang bị tắt tiếng thêm ' + Math.ceil(r.mutedSec / 60) + ' phút vì nhiều tin bị báo cáo.' : '';
      input.disabled = sendBtn.disabled = !!r.mutedSec;
      if (!force && newSig === sig) return;
      const nearEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
      const fresh = msgs.filter(m => m.id > lastId && !m.mine);
      if (lastId && fresh.length) Sound.tap();
      sig = newSig; lastId = msgs.length ? Math.max(lastId, msgs[msgs.length - 1].id) : lastId;
      list.replaceChildren(...(msgs.length ? msgs.map(msgNode) : [h('p', { class: 'muted center', style: { margin: 'auto' } }, 'Chưa có tin nhắn nào. Hãy là người chào đầu tiên!')]));
      if (nearEnd || force || !lastId) list.scrollTop = list.scrollHeight;
    }

    async function refresh(force) {
      if (busy || !alive) return;
      busy = true;
      try { const r = await API.get('/api/chat?room=' + roomInfo.id); if (alive) paint(r, force === true); } catch (_) {}
      busy = false;
    }

    async function send() {
      const text = input.value.trim();
      if (!text || sendBtn.disabled) return;
      sendBtn.disabled = true;
      try {
        await API.post('/api/chat/send', { room: roomInfo.id, text });
        input.value = ''; count.textContent = ''; Sound.pop();
        busy = false; await refresh(true);
      } catch (e) { Sound.bad(); toast(e.message, 'bad'); }
      sendBtn.disabled = false; input.focus();
    }

    refresh(true);
    timer = setInterval(() => {
      if (!root.isConnected) return stop();
      if (!document.hidden) refresh();
    }, 4000);
    return root;
  }

  // ---------- bảng xếp hạng ----------
  const KINDS = [
    { id: 'week', name: 'XP tuần', desc: 'Xếp theo XP kiếm được trong tuần này, làm lại từ thứ Hai.', unit: 'XP' },
    { id: 'xp', name: 'Level', desc: 'Xếp theo tổng XP từ trước đến nay. Level càng cao càng giỏi.', unit: 'XP' },
    { id: 'streak', name: 'Chuỗi ngày', desc: 'Xếp theo số ngày học liên tiếp hiện tại.', unit: 'ngày' },
    { id: 'pet', name: 'Thú cưng', desc: 'Xếp theo cấp của thú cưng. Chăm cho ăn, uống nước để bé lên cấp.', unit: '' },
    { id: 'farm', name: 'Nhà nông', desc: 'Xếp theo số nông sản đã thu hoạch.', unit: 'nông sản' }
  ];

  function rankView(app) {
    const root = h('div', {});
    let by = app.rankBy || 'week', scope = app.rankScope || 'all';

    async function draw() {
      let lb;
      try { lb = await API.get('/api/leaderboard?scope=' + scope + '&by=' + by); } catch (e) { return toast(e.message, 'bad'); }
      const k = KINDS.find(x => x.id === by);
      const row = p => h('li', { class: 'lb-row card' + (p.id === lb.meId ? ' me' : ''), tabindex: 0, role: 'button',
        onclick: () => p.id === lb.meId ? app.navigate('profile') : profileSheet(app, p.id, draw),
        onkeydown: e => { if (e.key === 'Enter') e.currentTarget.click(); } },
        h('span', { class: 'lb-rank' }, p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : p.rank),
        by === 'pet' ? h('span', { class: 'lb-cat pet-mini', html: FarmArt.pet(p.petKind, 'happy') }) : catOf(p),
        h('span', { class: 'lb-name' }, p.username + (p.id === lb.meId ? ' (bạn)' : ''), ' ',
          by === 'pet' ? h('small', {}, p.petName + ' · chủ: Lv.' + p.level) : [lv(p.level), h('small', {}, by === 'streak' ? 'Đã học hôm nay: ' + (p.studiedToday ? 'rồi' : 'chưa') : '🔥 ' + p.streak + ' ngày')]),
        h('span', { class: 'lb-xp' }, by === 'pet' ? 'Cấp ' + p.value : by === 'xp' ? p.value + ' XP' : p.value + ' ' + k.unit));
      const inTop = lb.list.some(p => p.id === lb.meId);
      root.replaceChildren(
        h('div', { class: 'chips' }, KINDS.map(x => h('button', { class: 'chip-tab' + (by === x.id ? ' on' : ''), type: 'button', onclick: () => { by = app.rankBy = x.id; draw(); } }, x.name))),
        h('div', { class: 'seg slim' }, [['all', 'Tất cả mọi người'], ['friends', 'Chỉ bạn bè']].map(([id, name]) =>
          h('button', { class: 'seg-btn' + (scope === id ? ' on' : ''), type: 'button', onclick: () => { scope = app.rankScope = id; draw(); } }, name))),
        h('p', { class: 'muted small' }, k.desc + ' Chạm vào một người để xem hồ sơ.'),
        h('div', { class: 'card rank-me' }, lb.meRank
          ? h('span', {}, 'Hạng của bạn: ', h('b', {}, '#' + lb.meRank), ' / ' + lb.total + ' người')
          : h('span', {}, by === 'pet' ? 'Bạn chưa có thú cưng. Nhận nuôi ở tab Vườn để vào bảng này nhé!' : 'Chưa có thứ hạng.')),
        lb.list.length ? h('ol', { class: 'lb' }, lb.list.map(row), !inTop && lb.meRow ? [h('li', { class: 'lb-gap', 'aria-hidden': 'true' }, '⋮'), row(lb.meRow)] : '')
          : h('p', { class: 'muted center' }, 'Chưa có ai trong bảng này.'),
        scope === 'friends' && lb.total <= 1 ? h('p', { class: 'muted center' }, 'Bạn chưa có bạn bè nào. Sang tab "Bạn bè" để kết bạn nhé!') : '');
    }
    draw();
    return root;
  }

  // ---------- màn hình Cộng đồng ----------
  Screens.board = async function (app) {
    const root = h('div', {});
    let tab = app.commTab || 'chat';

    async function roomsView() {
      const box = h('div', {});
      const data = await API.get('/api/chat/rooms');
      box.append(
        h('p', { class: 'muted small' }, data.online + ' người đang online. Chọn một phòng để trò chuyện cùng người học tiếng Nhật khắp nơi.'),
        ...data.rooms.map(r => h('button', { class: 'card room', type: 'button', onclick: () => { app.chatRoom = r.id; draw(); } },
          h('span', { class: 'room-ico' }, r.icon),
          h('span', { class: 'room-main' }, h('b', {}, r.name), h('small', {}, r.last ? r.last.name + ': ' + r.last.text : r.desc)),
          h('span', { class: 'room-time' }, r.last ? when(r.last.at) : ''))));
      return box;
    }

    async function draw() {
      root.replaceChildren(
        h('h1', { class: 'page-title' }, 'Cộng đồng'),
        h('div', { class: 'seg', role: 'tablist' }, [['chat', 'Chat'], ['rank', 'Xếp hạng']].map(([id, name]) =>
          h('button', { class: 'seg-btn' + (tab === id ? ' on' : ''), role: 'tab', 'aria-selected': tab === id, type: 'button',
            onclick: () => { tab = app.commTab = id; app.chatRoom = null; draw(); } }, name))));
      try {
        if (tab === 'rank') { root.append(rankView(app)); return; }
        if (app.chatRoom) {
          const info = (await API.get('/api/chat/rooms')).rooms.find(r => r.id === app.chatRoom);
          if (info) { root.append(roomView(app, info, () => { app.chatRoom = null; draw(); })); return; }
          app.chatRoom = null;
        }
        root.append(await roomsView());
      } catch (e) { root.append(h('div', { class: 'card center' }, h('p', {}, e.message), h('button', { class: 'btn', onclick: draw }, 'Thử lại'))); }
    }

    await draw();
    return root;
  };
})();
