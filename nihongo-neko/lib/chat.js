// Phòng chat công khai: gửi tin, báo cáo, xoá tin của mình. Chặn người dùng nằm ở lib/social.js.
const { db, save } = require('./db');
const game = require('./game');

const ROOMS = [
  { id: 'global', name: 'Thế giới',        icon: '🌏', desc: 'Trò chuyện chung với mọi người học tiếng Nhật' },
  { id: 'vi',     name: 'Người Việt',      icon: '🏮', desc: 'Phòng nói chuyện bằng tiếng Việt' },
  { id: 'ja',     name: '日本語',           icon: 'あ', desc: 'Luyện viết tiếng Nhật với nhau' },
  { id: 'en',     name: 'English',         icon: 'Aa', desc: 'Chat in English, learners from everywhere' },
  { id: 'help',   name: 'Hỏi đáp bài học', icon: '💡', desc: 'Hỏi từ vựng, ngữ pháp, kanji' }
];
const ROOM_IDS = new Set(ROOMS.map(r => r.id));

const MAX_LEN = 200;          // ký tự mỗi tin
const KEEP = 150;             // số tin giữ lại mỗi phòng
const SHOW = 60;              // số tin gửi về mỗi lần
const MIN_GAP_MS = 1200;      // giãn cách giữa 2 tin
const MAX_PER_MIN = 12;
const HIDE_AT = 3;            // đủ 3 người báo cáo thì ẩn tin
const STRIKES_TO_MUTE = 3;    // 3 tin bị ẩn trong 24 giờ thì bị tắt tiếng
const MUTE_MS = 30 * 60e3;
const URL_RE = /(https?:\/\/|www\.|\b[a-z0-9-]{2,}\.(com|net|org|vn|jp|io|xyz|me|co|info|ly|gg|tv|app|dev|link|club|shop|top|site|online)\b)/i;

const hits = new Map(); // userId -> [thời điểm gửi tin gần đây] (chỉ lưu trong bộ nhớ)

function st() {
  const d = db();
  if (!d.chat) d.chat = {};
  const c = d.chat;
  if (!c.seq) c.seq = 0;
  if (!c.rooms) c.rooms = {};
  if (!c.muted) c.muted = {};
  if (!c.strikes) c.strikes = {};
  return c;
}
const roomList = id => (st().rooms[id] = st().rooms[id] || []);
const userById = id => db().users[id] || null;
const blockedBy = (u, id) => (u.blocked || []).includes(id);
const visible = (u, m) => m.rep.length < HIDE_AT && !blockedBy(u, m.uid);

function view(u, m) {
  const a = userById(m.uid);
  return {
    id: m.id, uid: m.uid, name: a ? a.username : m.name, level: a ? game.levelInfo(a.xp).level : 1,
    at: m.at, text: m.text, mine: m.uid === u.id, reported: m.rep.includes(u.id)
  };
}

function rooms(u) {
  const now = Date.now();
  const online = Object.values(db().users).filter(x => now - (x.lastSeen || 0) < 5 * 60e3).length;
  return {
    rooms: ROOMS.map(r => {
      const last = roomList(r.id).filter(m => visible(u, m)).slice(-1)[0];
      return { ...r, last: last ? { name: view(u, last).name, text: last.text.slice(0, 60), at: last.at } : null };
    }),
    online
  };
}

function messages(u, roomId) {
  if (!ROOM_IDS.has(roomId)) return { error: 'Không có phòng này.' };
  const list = roomList(roomId).filter(m => visible(u, m)).slice(-SHOW).map(m => view(u, m));
  const muted = st().muted[u.id] || 0;
  return { room: ROOMS.find(r => r.id === roomId), messages: list, mutedSec: muted > Date.now() ? Math.ceil((muted - Date.now()) / 1000) : 0 };
}

function send(u, roomId, text) {
  if (!ROOM_IDS.has(roomId)) return { error: 'Không có phòng này.' };
  const now = Date.now();
  const muted = st().muted[u.id] || 0;
  if (muted > now) return { error: 'Bạn đang bị tắt tiếng thêm ' + Math.ceil((muted - now) / 60000) + ' phút vì nhiều tin bị báo cáo.' };
  text = String(text || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return { error: 'Hãy nhập nội dung tin nhắn.' };
  if (text.length > MAX_LEN) return { error: 'Tin nhắn tối đa ' + MAX_LEN + ' ký tự.' };
  if (URL_RE.test(text)) return { error: 'Phòng chat chưa cho gửi đường link.' };
  const recent = (hits.get(u.id) || []).filter(t => now - t < 60e3);
  if (recent.length && now - recent[recent.length - 1] < MIN_GAP_MS) return { error: 'Bạn gõ nhanh quá, chờ một chút nhé.' };
  if (recent.length >= MAX_PER_MIN) return { error: 'Bạn gửi quá nhiều tin trong một phút. Nghỉ chút nhé.' };
  const mine = roomList(roomId).filter(m => m.uid === u.id).slice(-1)[0];
  if (mine && mine.text === text && now - mine.at < 60e3) return { error: 'Tin này bạn vừa gửi rồi.' };
  recent.push(now); hits.set(u.id, recent);
  const m = { id: ++st().seq, uid: u.id, name: u.username, at: now, text, rep: [] };
  const list = roomList(roomId);
  list.push(m);
  if (list.length > KEEP) list.splice(0, list.length - KEEP);
  save();
  return { ok: true, message: view(u, m) };
}

function report(u, roomId, id) {
  if (!ROOM_IDS.has(roomId)) return { error: 'Không có phòng này.' };
  const m = roomList(roomId).find(x => x.id === id);
  if (!m) return { error: 'Tin nhắn không còn nữa.' };
  if (m.uid === u.id) return { error: 'Không thể tự báo cáo tin của mình.' };
  if (m.rep.includes(u.id)) return { error: 'Bạn đã báo cáo tin này rồi.' };
  m.rep.push(u.id);
  let hidden = false;
  if (m.rep.length === HIDE_AT) {
    hidden = true;
    const now = Date.now(), c = st();
    const arr = (c.strikes[m.uid] || []).filter(t => now - t < 24 * 3600e3);
    arr.push(now); c.strikes[m.uid] = arr;
    if (arr.length >= STRIKES_TO_MUTE) { c.muted[m.uid] = now + MUTE_MS; c.strikes[m.uid] = []; }
  }
  save();
  return { ok: true, hidden };
}

function remove(u, roomId, id) {
  if (!ROOM_IDS.has(roomId)) return { error: 'Không có phòng này.' };
  const list = roomList(roomId), i = list.findIndex(x => x.id === id && x.uid === u.id);
  if (i < 0) return { error: 'Chỉ xoá được tin của chính bạn.' };
  list.splice(i, 1);
  save();
  return { ok: true };
}

// Khi xoá tài khoản: xoá luôn các tin đã gửi
function purgeUser(id) {
  const c = st();
  for (const k of Object.keys(c.rooms)) c.rooms[k] = c.rooms[k].filter(m => m.uid !== id);
  delete c.muted[id]; delete c.strikes[id]; hits.delete(id);
}

module.exports = { ROOMS, rooms, messages, send, report, remove, purgeUser, MAX_LEN };
