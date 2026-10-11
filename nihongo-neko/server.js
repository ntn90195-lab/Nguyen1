// Máy chủ web: phục vụ giao diện (thư mục public) và các API của app.
// Không cần cài thêm thư viện nào, chỉ cần Node.js.
const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const auth = require('./lib/auth');
const game = require('./lib/game');
const farm = require('./lib/farm');
const social = require('./lib/social');
const dbModule = require('./lib/db');
const { db, save } = dbModule;
const curriculum = require('./content/curriculum');
const exercises = require('./lib/exercises');

const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.webmanifest': 'application/manifest+json'
};

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 200000) { req.destroy(); reject(new Error('too big')); } });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}
function getToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

function lessonStatus(u) {
  // mở khóa dần: bài đầu luôn mở; các bài sau mở khi bài trước đã hoàn thành
  const out = {};
  curriculum.order.forEach((id, i) => {
    const done = !!u.completed[id];
    const prevDone = i === 0 || !!u.completed[curriculum.order[i - 1]];
    out[id] = { done, unlocked: done || prevDone, stars: done ? u.completed[id].stars : 0 };
  });
  return out;
}

// Chặn dò mật khẩu: tối đa 8 lần sai trong 10 phút cho mỗi (địa chỉ máy + tên đăng nhập); đăng ký tối đa 30 lần/giờ mỗi địa chỉ.
const failLog = new Map();
function tooMany(key, max, windowMs) {
  const now = Date.now();
  const arr = (failLog.get(key) || []).filter(t => now - t < windowMs);
  failLog.set(key, arr);
  return arr.length >= max;
}
function noteHit(key) { (failLog.get(key) || failLog.set(key, []).get(key)).push(Date.now()); }
setInterval(() => { const now = Date.now(); for (const [k, v] of failLog) if (!v.some(t => now - t < 3600e3)) failLog.delete(k); }, 600e3).unref();

async function handleApi(req, res, url) {
  const route = req.method + ' ' + url.pathname;
  let body = {};
  if (req.method === 'POST') {
    try { body = await readBody(req); } catch (e) { return send(res, 400, { error: 'Dữ liệu gửi lên không hợp lệ.' }); }
  }

  // ----- không cần đăng nhập -----
  const ip = (req.socket && req.socket.remoteAddress) || '?';
  if (route === 'POST /api/register') {
    if (tooMany('reg:' + ip, 30, 3600e3)) return send(res, 429, { error: 'Bạn thao tác quá nhiều lần. Hãy thử lại sau ít phút.' });
    noteHit('reg:' + ip);
    const r = auth.register(body.username, body.password);
    if (r.error) return send(res, 400, r);
    return send(res, 200, { token: r.token, me: game.publicUser(r.user) });
  }
  if (route === 'POST /api/login') {
    const lk = 'login:' + ip + ':' + String(body.username || '').toLowerCase();
    if (tooMany(lk, 8, 600e3)) return send(res, 429, { error: 'Đăng nhập sai quá nhiều lần. Hãy thử lại sau 10 phút.' });
    const r = auth.login(body.username, body.password);
    if (r.error) { noteHit(lk); return send(res, 401, r); }
    return send(res, 200, { token: r.token, me: game.publicUser(r.user) });
  }

  // ----- cần đăng nhập -----
  const token = getToken(req);
  const u = auth.userFromToken(token);
  if (!u) return send(res, 401, { error: 'Bạn cần đăng nhập.', needLogin: true });
  u.lastSeen = Date.now();

  switch (route) {
    case 'POST /api/logout':
      auth.logout(token);
      return send(res, 200, { ok: true });

    case 'GET /api/me':
      return send(res, 200, { me: game.publicUser(u) });

    case 'GET /api/curriculum':
      return send(res, 200, { units: curriculum.publicUnits(), status: lessonStatus(u), me: game.publicUser(u) });

    case 'POST /api/heart/lose': {
      const hearts = game.loseHeart(u);
      return send(res, 200, { hearts, me: game.publicUser(u) });
    }

    case 'GET /api/practice': {
      game.refreshHearts(u);
      if (u.hearts <= 0) return send(res, 403, { error: 'Bạn hết tim rồi.', outOfHearts: true, me: game.publicUser(u) });
      const keys = Object.keys(u.mistakes);
      if (!keys.length) return send(res, 200, { empty: true, exercises: [] });
      const list = exercises.buildPractice(keys, config.EXERCISES_PER_LESSON);
      return send(res, 200, { lesson: { id: 'practice', title: 'Ôn lại chỗ hay sai', type: 'practice' }, exercises: list });
    }
    case 'POST /api/practice/complete': {
      const r = game.completeLesson(u, { id: 'practice' }, body, { practice: true });
      return send(res, 200, { result: r, me: game.publicUser(u) });
    }

    case 'POST /api/quests/claim': {
      const r = game.claimQuest(u, body.id);
      if (r.error) return send(res, 400, r);
      return send(res, 200, { ...r, me: game.publicUser(u) });
    }

    case 'GET /api/shop':
      return send(res, 200, { items: game.shopList(u), me: game.publicUser(u) });
    case 'POST /api/shop/buy': {
      const r = game.buy(u, body.id);
      if (r.error) return send(res, 400, r);
      return send(res, 200, { ...r, items: game.shopList(u), me: game.publicUser(u) });
    }
    case 'POST /api/shop/equip': {
      const r = game.equip(u, body.id, body.on);
      if (r.error) return send(res, 400, r);
      return send(res, 200, { ...r, items: game.shopList(u), me: game.publicUser(u) });
    }

    case 'GET /api/leaderboard':
      return send(res, 200, { list: game.leaderboard(u, url.searchParams.get('scope')), meId: u.id });
    case 'GET /api/friends':
      return send(res, 200, social.friendsData(u));
    case 'POST /api/friends/add': {
      const r = social.sendRequest(u, body);
      if (r.error) return send(res, 400, r);
      return send(res, 200, { ...r, ...social.friendsData(u), me: game.publicUser(u) });
    }
    case 'POST /api/friends/respond': case 'POST /api/friends/cancel': case 'POST /api/friends/remove': case 'POST /api/friends/nudge': {
      const fn = route.split('/').pop();
      const r = fn === 'respond' ? social.respond(u, body.id, !!body.accept) : fn === 'cancel' ? social.cancel(u, body.id)
        : fn === 'remove' ? social.removeFriend(u, body.id) : social.nudge(u, body.id);
      if (r.error) return send(res, 400, r);
      return send(res, 200, { ...r, ...social.friendsData(u), me: game.publicUser(u) });
    }
    case 'GET /api/profile': {
      const r = social.profile(u, url.searchParams.get('id') || u.id);
      if (r.error) return send(res, 404, r);
      return send(res, 200, r);
    }
    case 'POST /api/account/password': {
      const pk = 'pw:' + u.id;
      if (tooMany(pk, 8, 600e3)) return send(res, 429, { error: 'Thử quá nhiều lần. Hãy đợi ít phút.' });
      const r = auth.changePassword(u, body.oldPassword, body.newPassword, token);
      if (r.error) { noteHit(pk); return send(res, 400, r); }
      return send(res, 200, r);
    }
    case 'POST /api/account/delete': {
      const pk = 'pw:' + u.id;
      if (tooMany(pk, 8, 600e3)) return send(res, 429, { error: 'Thử quá nhiều lần. Hãy đợi ít phút.' });
      const r = auth.deleteAccount(u, body.password);
      if (r.error) { noteHit(pk); return send(res, 400, r); }
      return send(res, 200, r);
    }

    case 'GET /api/farm':
      return send(res, 200, { farm: farm.publicFarm(u), me: game.publicUser(u) });
    case 'GET /api/farm/visit': {
      const other = db().users[url.searchParams.get('id')];
      if (!other || other.id === u.id || !u.friends.includes(other.id)) return send(res, 400, { error: 'Chỉ thăm được vườn của bạn bè.' });
      return send(res, 200, farm.friendView(u, other));
    }
    case 'POST /api/farm/buy': case 'POST /api/farm/sell': case 'POST /api/farm/plot':
    case 'POST /api/farm/pet': case 'POST /api/farm/social': {
      const fn = route.split('/').pop();
      const r = farm[fn === 'buy' ? 'buy' : fn === 'sell' ? 'sell' : fn === 'plot' ? 'plot' : fn === 'pet' ? 'pet' : 'social'](
        u, ...(fn === 'buy' ? [body.what, body.n] : fn === 'sell' ? [body.crop, body.n] : [body]));
      if (r.error) return send(res, 400, r);
      const out = { ...r, me: game.publicUser(u) };
      if (fn === 'social') { const o = db().users[body.id]; out.view = farm.friendView(u, o); } else out.farm = farm.publicFarm(u);
      return send(res, 200, out);
    }

    case 'POST /api/settings': {
      const s = u.settings;
      if (typeof body.sound === 'boolean') s.sound = body.sound;
      if (typeof body.tts === 'boolean') s.tts = body.tts;
      if (body.reminderHour === null || (Number.isInteger(body.reminderHour) && body.reminderHour >= 0 && body.reminderHour <= 23)) {
        s.reminderHour = body.reminderHour;
      }
      if (typeof body.allowHarm === 'boolean') s.allowHarm = body.allowHarm;
      if (typeof body.bio === 'string') u.bio = body.bio.trim().replace(/\s+/g, ' ').slice(0, 80);
      if (typeof body.mascotName === 'string') {
        const n = body.mascotName.trim().slice(0, 14);
        if (n) u.mascotName = n;
      }
      save();
      return send(res, 200, { me: game.publicUser(u) });
    }
  }

  // ----- bài học: /api/lesson/:id và /api/lesson/:id/complete -----
  const m = url.pathname.match(/^\/api\/lesson\/([\w-]+)(\/complete)?$/);
  if (m) {
    const lesson = curriculum.findLesson(m[1]);
    if (!lesson) return send(res, 404, { error: 'Không tìm thấy bài học.' });
    const st = lessonStatus(u)[lesson.id];
    if (!st.unlocked) return send(res, 403, { error: 'Bài này chưa mở khóa. Hãy hoàn thành bài trước nhé.' });
    if (req.method === 'GET' && !m[2]) {
      game.refreshHearts(u);
      if (u.hearts <= 0) return send(res, 403, { error: 'Bạn hết tim rồi.', outOfHearts: true, me: game.publicUser(u) });
      return send(res, 200, { lesson: curriculum.publicLesson(lesson), exercises: exercises.buildLesson(lesson, config.EXERCISES_PER_LESSON) });
    }
    if (req.method === 'POST' && m[2]) {
      const r = game.completeLesson(u, lesson, body);
      return send(res, 200, { result: r, me: game.publicUser(u), status: lessonStatus(u) });
    }
  }

  return send(res, 404, { error: 'Không tìm thấy đường dẫn này.' });
}

function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, p));
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) {
      // thử trả index.html cho các đường dẫn khác (app một trang)
      if (!path.extname(p)) {
        return fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, d2) => {
          if (e2) { res.writeHead(404); return res.end('Not found'); }
          res.writeHead(200, { 'Content-Type': MIME['.html'] });
          res.end(d2);
        });
      }
      res.writeHead(404); return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    handleApi(req, res, url).catch(err => {
      console.error('Lỗi API:', err);
      send(res, 500, { error: 'Máy chủ gặp lỗi, thử lại nhé.' });
    });
  } else serveStatic(req, res, url);
});

if (require.main === module) {
  dbModule.init().then(() => {
    server.listen(config.PORT, () => {
      console.log('\n  🐱 Nihongo Neko đang chạy!');
      console.log('  Mở trình duyệt và vào:  http://localhost:' + config.PORT + '\n');
      console.log('  (Nhấn Ctrl + C để tắt)\n');
    });
  }).catch(e => {
    console.error('\n  Không khởi động được:', e.message, '\n');
    process.exit(1);
  });
}
module.exports = { server };
