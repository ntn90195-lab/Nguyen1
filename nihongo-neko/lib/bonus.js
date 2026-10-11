// Bài đặc biệt: bài ẩn (mở khi đạt điều kiện) và bài mua bằng xu.
const curriculum = require('../content/curriculum');
const { save } = require('./db');
const social = require('./social');

const stateOf = u => u.bonus || (u.bonus = { owned: {}, notified: {} });

function condMet(c, s) {
  switch (c.type) {
    case 'streak': return s.bestStreak >= c.n;
    case 'lessons': return s.lessons >= c.n;
    case 'xp': return s.xp >= c.n;
    case 'friends': return s.friends >= c.n;
    case 'pet': return s.hasPet;
    case 'harvested': return s.harvested >= c.n;
    case 'stars': return s.stars >= c.n;
    case 'helped': return s.helped >= c.n;
    default: return false;
  }
}

function isOpen(u, packId) {
  const pack = curriculum.packById[packId];
  if (!pack) return false;
  const st = stateOf(u);
  if (st.owned[packId]) return true;
  if (pack.mode === 'secret' && condMet(pack.cond, social.statsOf(u))) { st.owned[packId] = Date.now(); save(); return true; }
  return false;
}

// notify: trả về danh sách bài ẩn vừa mở lần đầu (và đánh dấu đã báo)
function list(u, { notify } = {}) {
  const st = stateOf(u);
  const fresh = [];
  const packs = curriculum.bonusPacks.map(p => {
    const open = isOpen(u, p.id);
    const base = { id: p.id, mode: p.mode, price: p.price || 0 };
    if (!open && p.mode === 'secret') return { ...base, state: 'locked', title: '???', desc: p.hint, count: 0, lessons: [] };
    const lessons = p.lessons.map(id => {
      const l = curriculum.lessons[id], done = u.completed[id];
      return { ...curriculum.publicLesson(l), done: !!done, stars: done ? done.stars : 0 };
    });
    if (open && p.mode === 'secret' && !st.notified[p.id]) {
      fresh.push({ id: p.id, title: p.title });
      if (notify) st.notified[p.id] = true;
    }
    return { ...base, state: open ? 'open' : 'buyable', title: p.title, desc: p.desc, count: lessons.reduce((a, l) => a + l.count, 0), lessons };
  });
  if (notify && fresh.length) save();
  return { packs, fresh: notify ? fresh : [] };
}

function buy(u, packId) {
  const p = curriculum.packById[packId];
  if (!p || p.mode !== 'shop') return { error: 'Không có bài này để mua.' };
  const st = stateOf(u);
  if (st.owned[packId]) return { error: 'Bạn đã mua bài này rồi.' };
  if (u.coins < p.price) return { error: 'Bạn chưa đủ xu.' };
  u.coins -= p.price;
  st.owned[packId] = Date.now();
  st.notified[packId] = true;
  save();
  return { ok: true, title: p.title };
}

module.exports = { isOpen, list, buy };
