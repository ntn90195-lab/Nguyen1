// Điều phối ứng dụng: đăng nhập, điều hướng, bắt đầu bài học, nhắc học.
(function () {
  const { h, toast, sheet } = UI;
  const root = () => document.getElementById('app');

  const TABS = [
    ['home', 'Học', 'home'], ['quests', 'Nhiệm vụ', 'quest'], ['farm', 'Vườn', 'sprout'], ['shop', 'Cửa hàng', 'shop'], ['board', 'Cộng đồng', 'trophy'], ['profile', 'Hồ sơ', 'cat']
  ];

  const App = {
    me: null, tab: 'home', units: null, status: null,
    shell: null, topHost: null, mainEl: null, tabEls: {},
    lastReminderDay: '',

    setMe(me) {
      const prev = this.me;
      this.me = me;
      if (prev && prev.level && me.level && me.level.level > prev.level.level && this.shell) {
        setTimeout(() => { Sound.levelup(); toast('Lên cấp ' + me.level.level + '!', 'good'); }, 900);
      }
      document.documentElement.dataset.theme = (me.equipped && me.equipped.theme) || 'sakura';
      const meta = document.querySelector('meta[name=theme-color]');
      if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#2b2d5b';
      Sound.setEnabled(me.settings.sound);
      Sound.setMusic(me.settings.music);
      Speech.setEnabled(me.settings.tts);
      this.updateDot();
    },

    updateDot() {
      const b = this.tabEls && this.tabEls.board, d = b && b.querySelector('.dot');
      if (d && this.me) { d.textContent = this.me.pending || ''; d.hidden = !this.me.pending; }
    },

    async init() {
      if (API.hasToken()) {
        try {
          const r = await API.get('/api/me');
          this.setMe(r.me);
          this.startReminders();
          return this.showMain('home');
        } catch (e) {
          if (e.network) { root().append(h('div', { class: 'card', style: { margin: '24px' } }, h('h2', {}, 'Chưa kết nối được'), h('p', {}, e.message), h('button', { class: 'btn', onclick: () => location.reload() }, 'Thử lại'))); return; }
          API.setToken('');
        }
      }
      this.showAuth();
    },

    showAuth() {
      this.shell = null;
      document.documentElement.dataset.theme = 'sakura';
      root().innerHTML = '';
      root().append(Screens.auth(this));
    },

    async showMain(tab) {
      this.tab = tab || this.tab || 'home';
      this.startReminders();
      const shell = h('div', { class: 'shell' });
      this.topHost = h('div', { class: 'top-host' }, UI.topbar(this.me));
      this.mainEl = h('main', { class: 'main' });
      this.tabEls = {};
      const nav = h('nav', { class: 'tabbar', 'aria-label': 'Điều hướng chính' }, TABS.map(([id, name, ico]) => {
        const b = h('button', { class: 'tab', type: 'button', onclick: () => this.navigate(id) },
          h('span', { class: 'ti', 'aria-hidden': 'true', html: Icons.nav(ico) }), h('span', {}, name),
          id === 'board' ? h('span', { class: 'dot', hidden: true, 'aria-label': 'Lời mời kết bạn' }) : null);
        this.tabEls[id] = b;
        return b;
      }));
      shell.append(this.topHost, this.mainEl, nav);
      this.shell = shell;
      root().innerHTML = '';
      root().append(shell);
      this.updateDot();
      await this.loadTab();
    },

    navigate(tab) {
      if (!this.shell) { this.showMain(tab); return; }
      this.tab = tab;
      this.loadTab();
    },

    async loadTab() {
      const tab = this.tab;
      for (const [id, el] of Object.entries(this.tabEls)) {
        if (id === tab) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
      }
      this.mainEl.innerHTML = '';
      this.mainEl.append(h('p', { class: 'center muted', style: { marginTop: '20vh' } }, 'Đang tải…'));
      try {
        const node = await Screens[tab](this);
        if (this.tab !== tab) return;
        this.mainEl.replaceChildren(node);
        this.refreshTopbar();
        if (tab !== 'home') window.scrollTo(0, 0);
      } catch (e) {
        if (this.tab !== tab) return;
        this.mainEl.replaceChildren(h('div', { class: 'card center' },
          h('h2', {}, 'Không tải được trang'), h('p', {}, e.message),
          h('button', { class: 'btn', onclick: () => this.loadTab() }, 'Thử lại')));
      }
    },

    refreshTopbar() {
      if (this.topHost) this.topHost.replaceChildren(UI.topbar(this.me));
    },

    // ----- bài học -----
    async startLesson(id) {
      let data;
      try { data = await API.get('/api/lesson/' + id); }
      catch (e) {
        if (e.data && e.data.outOfHearts) { this.setMe(e.data.me); this.refreshTopbar(); return this.outOfHeartsSheet(); }
        return toast(e.message, 'bad');
      }
      const res = await Lesson.run({
        me: this.me, exercises: data.exercises,
        complete: payload => API.post('/api/lesson/' + id + '/complete', payload)
      });
      await this.afterLesson(res);
    },

    async startPractice() {
      let data;
      try { data = await API.get('/api/practice'); }
      catch (e) {
        if (e.data && e.data.outOfHearts) { this.setMe(e.data.me); this.refreshTopbar(); return this.outOfHeartsSheet(); }
        return toast(e.message, 'bad');
      }
      if (data.empty) return toast('Bạn chưa có mục nào cần ôn. Tuyệt vời!', 'good');
      const res = await Lesson.run({
        me: this.me, exercises: data.exercises, practice: true,
        complete: payload => API.post('/api/practice/complete', payload)
      });
      await this.afterLesson(res);
    },

    async afterLesson(res) {
      try {
        if (res.status === 'done') this.setMe(res.data.me);
        else { const r = await API.get('/api/me'); this.setMe(r.me); }
      } catch (_) {}
      await this.showMain('home');
    },

    outOfHeartsSheet() {
      const me = this.me;
      const buy = async (id, label) => {
        try {
          const r = await API.post('/api/shop/buy', { id });
          this.setMe(r.me); this.refreshTopbar(); s.close(); Sound.coin(); toast(label, 'good');
        } catch (e) { toast(e.message, 'bad'); }
      };
      const s = sheet([
        h('div', { class: 'center', html: Cat.svg({ equipped: me.equipped, mood: 'sad', className: 'medium' }) }),
        h('h2', { class: 'center' }, 'Bạn hết tim rồi'),
        h('p', { class: 'center' }, 'Tim hồi 1 cái sau ' + UI.fmtTime(me.nextHeartInSec) + '. Hoặc dùng xu để hồi ngay (bạn có ' + me.coins + ' 🪙).'),
        h('div', { class: 'row' },
          h('button', { class: 'btn gold', disabled: me.coins >= 30 ? null : true, onclick: () => buy('heart_1', 'Đã hồi 1 tim') }, '1 tim · 30 🪙'),
          h('button', { class: 'btn gold', disabled: me.coins >= 90 ? null : true, onclick: () => buy('heart_full', 'Đã hồi đầy tim') }, 'Đầy tim · 90 🪙')),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: () => s.close() }, 'Đợi tim hồi'))
      ], { center: true });
    },

    // ----- tài khoản -----
    async logout() {
      try { await API.post('/api/logout'); } catch (_) {}
      API.setToken(''); this.me = null; this.showAuth();
    },
    onSessionExpired() {
      if (!this.me) return;
      API.setToken(''); this.me = null; toast('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.'); this.showAuth();
    },

    // ----- nhắc học -----
    startReminders() {
      if (this._rem) return;
      this._rem = setInterval(() => {
        const me = this.me;
        if (!me || me.settings.reminderHour === null || me.studiedToday) return;
        const now = new Date();
        const day = now.toDateString();
        if (now.getHours() !== me.settings.reminderHour || this.lastReminderDay === day) return;
        this.lastReminderDay = day;
        const msg = 'Đến giờ học tiếng Nhật rồi! Hôm nay bạn chưa học bài nào.';
        toast('🐱 ' + msg);
        if ('Notification' in window && Notification.permission === 'granted') {
          try { new Notification('Nihongo Neko', { body: msg }); } catch (_) {}
        }
      }, 30000);
    }
  };

  window.App = App;
  window.addEventListener('focus', async () => {
    if (App.me && App.shell && !document.querySelector('.lesson')) {
      try { const r = await API.get('/api/me'); App.setMe(r.me); App.refreshTopbar(); } catch (_) {}
    }
  });
  document.addEventListener('DOMContentLoaded', () => App.init());
})();
