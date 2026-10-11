// Cộng đồng: lời mời kết bạn, xoá bạn, nhắc học, hồ sơ công khai, huy hiệu.
const crypto = require('crypto');
const game = require('./game');
const farmLib = require('./farm');
const F = require('../content/farm');
const { db, save } = require('./db');

const MAX_PENDING_OUT = 20;
const MAX_FRIENDS = 100;

const userById = id => db().users[id] || null;
const reqs = () => db().friendRequests;

function findTarget(body) {
  const code = String(body.code || '').trim().toUpperCase();
  const name = String(body.username || '').trim().toLowerCase();
  const all = Object.values(db().users);
  if (code) return all.find(x => x.friendCode === code) || null;
  if (name) return all.find(x => x.username.toLowerCase() === name) || null;
  return null;
}

function makeFriends(a, b) {
  if (!a.friends.includes(b.id)) a.friends.push(b.id);
  if (!b.friends.includes(a.id)) b.friends.push(a.id);
  db().friendRequests = reqs().filter(r => !((r.from === a.id && r.to === b.id) || (r.from === b.id && r.to === a.id)));
}

function sendRequest(u, body) {
  const other = findTarget(body);
  if (!other) return { error: 'Không tìm thấy người này. Hãy kiểm tra lại mã hoặc tên.' };
  if (other.id === u.id) return { error: 'Đây là chính bạn.' };
  if (u.friends.includes(other.id)) return { error: 'Hai bạn đã là bạn bè rồi.' };
  if (u.friends.length >= MAX_FRIENDS) return { error: 'Danh sách bạn bè đã đầy.' };
  if (reqs().some(r => r.from === u.id && r.to === other.id)) return { error: 'Bạn đã gửi lời mời cho ' + other.username + ' rồi.' };
  const back = reqs().find(r => r.from === other.id && r.to === u.id);
  if (back) { makeFriends(u, other); save(); return { ok: true, accepted: true, name: other.username }; }
  if (reqs().filter(r => r.from === u.id).length >= MAX_PENDING_OUT) return { error: 'Bạn đang chờ quá nhiều lời mời.' };
  reqs().push({ id: crypto.randomBytes(5).toString('hex'), from: u.id, to: other.id, at: Date.now() });
  save();
  return { ok: true, accepted: false, name: other.username };
}

function respond(u, id, accept) {
  const r = reqs().find(x => x.id === id && x.to === u.id);
  if (!r) return { error: 'Lời mời không còn nữa.' };
  const other = userById(r.from);
  if (!other) { db().friendRequests = reqs().filter(x => x.id !== id); save(); return { error: 'Người này không còn tồn tại.' }; }
  if (accept) { makeFriends(u, other); }
  else db().friendRequests = reqs().filter(x => x.id !== id);
  save();
  return { ok: true, name: other.username };
}

function cancel(u, id) {
  const before = reqs().length;
  db().friendRequests = reqs().filter(x => !(x.id === id && x.from === u.id));
  if (reqs().length === before) return { error: 'Lời mời không còn nữa.' };
  save();
  return { ok: true };
}

function removeFriend(u, id) {
  const other = userById(id);
  if (!u.friends.includes(id)) return { error: 'Bạn này không có trong danh sách.' };
  u.friends = u.friends.filter(x => x !== id);
  if (other) other.friends = other.friends.filter(x => x !== u.id);
  save();
  return { ok: true };
}

function nudge(u, id) {
  const other = userById(id);
  if (!other || !u.friends.includes(id)) return { error: 'Chỉ nhắc được bạn bè của bạn.' };
  if (other.lastStudyDay === game.dayKey()) return { error: other.username + ' hôm nay đã học rồi.' };
  u.nudged = u.nudged || {};
  if (u.nudged[id] === game.dayKey()) return { error: 'Hôm nay bạn đã nhắc ' + other.username + ' rồi.' };
  u.nudged[id] = game.dayKey();
  other.inbox = other.inbox || [];
  other.inbox.unshift({ t: Date.now(), type: 'nudge', from: u.username });
  if (other.inbox.length > 20) other.inbox.length = 20;
  save();
  return { ok: true, name: other.username };
}

function friendsData(u) {
  const cards = u.friends.map(userById).filter(Boolean).map(x => ({ ...game.cardOf(x), nudged: (u.nudged || {})[x.id] === game.dayKey() }));
  cards.sort((a, b) => b.lastSeen - a.lastSeen);
  const brief = id => { const x = userById(id); return x ? { id: x.id, username: x.username, equipped: x.equipped, level: game.levelInfo(x.xp).level } : null; };
  return {
    friends: cards, code: u.friendCode,
    incoming: reqs().filter(r => r.to === u.id).map(r => ({ id: r.id, at: r.at, user: brief(r.from) })).filter(r => r.user),
    outgoing: reqs().filter(r => r.from === u.id).map(r => ({ id: r.id, at: r.at, user: brief(r.to) })).filter(r => r.user),
    inbox: (u.inbox || []).slice(0, 10)
  };
}

// ---------- Huy hiệu (tính từ số liệu hiện có, không cần lưu) ----------
function statsOf(x) {
  const f = x.farm || {};
  const petLevel = f.pet ? 1 + Math.floor(f.pet.love / F.LOVE_PER_LEVEL) : 0;
  const done = Object.values(x.completed || {});
  return {
    lessons: done.length, stars: done.reduce((a, c) => a + (c.stars || 0), 0), xp: x.xp, bestStreak: x.bestStreak || 0,
    friends: x.friends.length, petLevel, hasPet: !!f.pet, harvested: f.harvested || 0, helped: f.helped || 0
  };
}
const BADGES = [
  { id: 'first',   name: 'Bước đầu tiên',   desc: 'Hoàn thành 1 bài học',        icon: 'star',   ok: s => s.lessons >= 1 },
  { id: 'ten',     name: 'Chăm chỉ',        desc: 'Hoàn thành 10 bài học',       icon: 'quest',  ok: s => s.lessons >= 10 },
  { id: 'fifty',   name: 'Học bá',          desc: 'Hoàn thành 50 bài học',       icon: 'trophy', ok: s => s.lessons >= 50 },
  { id: 'stars30', name: 'Ngôi sao',        desc: 'Có 30 sao trên các bài',      icon: 'target', ok: s => s.stars >= 30 },
  { id: 'streak3', name: 'Giữ lửa',         desc: 'Chuỗi học 3 ngày',            icon: 'flame',  ok: s => s.bestStreak >= 3 },
  { id: 'streak7', name: 'Một tuần liền',   desc: 'Chuỗi học 7 ngày',            icon: 'flame',  ok: s => s.bestStreak >= 7 },
  { id: 'streak30', name: 'Kiên trì',       desc: 'Chuỗi học 30 ngày',           icon: 'shield', ok: s => s.bestStreak >= 30 },
  { id: 'xp500',   name: '500 XP',          desc: 'Kiếm tổng cộng 500 XP',       icon: 'bulb',   ok: s => s.xp >= 500 },
  { id: 'xp3000',  name: '3000 XP',         desc: 'Kiếm tổng cộng 3000 XP',      icon: 'medal1', ok: s => s.xp >= 3000 },
  { id: 'friends3', name: 'Có bạn có bè',   desc: 'Có 3 người bạn',              icon: 'cat',    ok: s => s.friends >= 3 },
  { id: 'pet',     name: 'Người nuôi pet',  desc: 'Nhận nuôi một thú cưng',      icon: 'heart',  ok: s => s.hasPet },
  { id: 'pet3',    name: 'Bạn thân của bé', desc: 'Thú cưng đạt cấp 3',          icon: 'heart',  ok: s => s.petLevel >= 3 },
  { id: 'farmer',  name: 'Nhà nông',        desc: 'Thu hoạch 10 nông sản',       icon: 'sakura', ok: s => s.harvested >= 10 },
  { id: 'helper',  name: 'Hàng xóm tốt',    desc: 'Tưới giúp vườn bạn 5 lần',    icon: 'sprout', ok: s => s.helped >= 5 }
];
function badgesOf(x) { const s = statsOf(x); return BADGES.map(b => ({ id: b.id, name: b.name, desc: b.desc, icon: b.icon, got: !!b.ok(s) })); }

function profile(u, id) {
  const x = id && id !== u.id ? userById(id) : u;
  if (!x) return { error: 'Không tìm thấy người này.' };
  const s = statsOf(x);
  let relation = 'self', requestId = null;
  if (x.id !== u.id) {
    if (u.friends.includes(x.id)) relation = 'friend';
    else {
      const inc = reqs().find(r => r.from === x.id && r.to === u.id), out = reqs().find(r => r.from === u.id && r.to === x.id);
      relation = inc ? 'incoming' : out ? 'outgoing' : 'none';
      requestId = (inc || out || {}).id || null;
    }
  }
  const lv = game.levelInfo(x.xp);
  return {
    user: { ...game.cardOf(x), joined: x.createdAt, mascotName: x.mascotName, levelInfo: lv, bestStreak: x.bestStreak || 0,
            lessons: s.lessons, stars: s.stars, friends: s.friends,
            pet: x.farm && x.farm.pet ? { kind: x.farm.pet.kind, name: x.farm.pet.name, level: s.petLevel } : null },
    badges: badgesOf(x), relation, requestId,
    nudged: x.id !== u.id && (u.nudged || {})[x.id] === game.dayKey()
  };
}

module.exports = { sendRequest, respond, cancel, removeFriend, nudge, friendsData, profile, badgesOf };
