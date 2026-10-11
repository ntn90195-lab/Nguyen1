// Đăng ký / đăng nhập. Mật khẩu được băm bằng scrypt (có sẵn trong Node).
const crypto = require('crypto');
const { db, save } = require('./db');
const config = require('../config');

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const test = crypto.scryptSync(password, salt, 64);
  const real = Buffer.from(hash, 'hex');
  return test.length === real.length && crypto.timingSafeEqual(test, real);
}

function newUser(username, password) {
  const { salt, hash } = hashPassword(password);
  const id = crypto.randomBytes(6).toString('hex');
  return {
    id,
    username,
    salt,
    hash,
    createdAt: Date.now(),
    friendCode: crypto.randomBytes(3).toString('hex').toUpperCase(),
    coins: config.START_COINS,
    xp: 0,
    weekXp: 0,
    weekKey: '',
    hearts: config.MAX_HEARTS,
    heartsUpdatedAt: Date.now(),
    streak: 0,
    bestStreak: 0,
    lastStudyDay: '',
    freezes: 0,
    completed: {},        // { lessonId: { stars, bestScore, times } }
    mistakes: {},         // { itemKey: số lần sai }
    inventory: {},        // { itemId: số lượng } (đồ dùng một lần là số lượng, đồ trang trí là 1)
    equipped: { hat: null, outfit: null, glasses: null, accessory: null, bg: null, theme: 'sakura' },
    boosts: { coinBoostUntil: 0 },
    quests: { day: '', list: [] },
    friends: [],
    settings: { sound: true, tts: true, reminderHour: null },
    mascotName: 'Neko',
    bio: '',
    blocked: [],
    lastSeen: Date.now()
  };
}

function createSession(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  db().sessions[token] = { userId, expires: Date.now() + config.SESSION_DAYS * 86400000 };
  save();
  return token;
}

function userFromToken(token) {
  if (!token) return null;
  const s = db().sessions[token];
  if (!s) return null;
  if (s.expires < Date.now()) { delete db().sessions[token]; save(); return null; }
  return db().users[s.userId] || null;
}

function findByUsername(username) {
  const u = String(username || '').trim().toLowerCase();
  return Object.values(db().users).find(x => x.username.toLowerCase() === u) || null;
}

function register(username, password) {
  username = String(username || '').trim();
  password = String(password || '');
  if (!/^[A-Za-z0-9_À-ỹ ]{3,20}$/.test(username)) {
    return { error: 'Tên đăng nhập dài 3–20 ký tự (chữ, số, dấu gạch dưới).' };
  }
  if (password.length < 6) return { error: 'Mật khẩu cần ít nhất 6 ký tự.' };
  if (findByUsername(username)) return { error: 'Tên này đã có người dùng rồi.' };
  const user = newUser(username, password);
  db().users[user.id] = user;
  const token = createSession(user.id);
  save();
  return { user, token };
}

function login(username, password) {
  const user = findByUsername(username);
  if (!user || !verifyPassword(String(password || ''), user.salt, user.hash)) {
    return { error: 'Sai tên đăng nhập hoặc mật khẩu.' };
  }
  return { user, token: createSession(user.id) };
}

function logout(token) {
  if (token && db().sessions[token]) { delete db().sessions[token]; save(); }
}

function changePassword(u, oldPw, newPw, keepToken) {
  if (!verifyPassword(String(oldPw || ''), u.salt, u.hash)) return { error: 'Mật khẩu hiện tại chưa đúng.' };
  newPw = String(newPw || '');
  if (newPw.length < 6) return { error: 'Mật khẩu mới cần ít nhất 6 ký tự.' };
  const { salt, hash } = hashPassword(newPw);
  u.salt = salt; u.hash = hash;
  // đăng xuất các thiết bị khác
  for (const [t, s] of Object.entries(db().sessions)) if (s.userId === u.id && t !== keepToken) delete db().sessions[t];
  save();
  return { ok: true };
}

function deleteAccount(u, password) {
  if (!verifyPassword(String(password || ''), u.salt, u.hash)) return { error: 'Mật khẩu chưa đúng.' };
  const d = db();
  delete d.users[u.id];
  for (const [t, s] of Object.entries(d.sessions)) if (s.userId === u.id) delete d.sessions[t];
  for (const x of Object.values(d.users)) x.friends = x.friends.filter(id => id !== u.id);
  d.friendRequests = d.friendRequests.filter(r => r.from !== u.id && r.to !== u.id);
  for (const x of Object.values(d.users)) if (x.blocked) x.blocked = x.blocked.filter(id => id !== u.id);
  require('./chat').purgeUser(u.id);
  save();
  return { ok: true };
}

module.exports = { changePassword, deleteAccount, register, login, logout, userFromToken, findByUsername };
