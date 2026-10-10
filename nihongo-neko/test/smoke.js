// Kiểm tra nhanh toàn bộ API (chạy: npm test). Dùng cơ sở dữ liệu tạm, không đụng dữ liệu thật.
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

// dùng thư mục dữ liệu tạm
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nneko-'));
process.env.NNEKO_DATA_DIR = tmp;
const dbMod = require('../lib/db');

const config = require('../config');
const { server } = require('../server');

let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; console.log('  ✔', name); } else { fail++; console.log('  ✘', name, extra !== undefined ? JSON.stringify(extra) : ''); }
}

function call(port, method, url, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({ port, method, path: url, headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}) }, res => {
      let s = ''; res.on('data', c => s += c);
      res.on('end', () => { let j = {}; try { j = JSON.parse(s); } catch (_) {} resolve({ status: res.statusCode, body: j, raw: s }); });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const api = (m, u, b, t) => call(port, m, u, b, t);

  console.log('Đăng ký / đăng nhập');
  let r = await api('POST', '/api/register', { username: 'a', password: '123456' });
  ok(r.status === 400, 'tên quá ngắn bị từ chối');
  r = await api('POST', '/api/register', { username: 'haruka', password: '123' });
  ok(r.status === 400, 'mật khẩu quá ngắn bị từ chối');
  r = await api('POST', '/api/register', { username: 'haruka', password: 'matkhau123' });
  ok(r.status === 200 && r.body.token, 'đăng ký thành công');
  ok(r.body.me.coins === config.START_COINS && r.body.me.hearts === config.MAX_HEARTS, 'xu và tim khởi đầu đúng');
  const T = r.body.token;
  r = await api('POST', '/api/register', { username: 'HARUKA', password: 'matkhau123' });
  ok(r.status === 400, 'tên trùng (không phân biệt hoa thường) bị từ chối');
  r = await api('POST', '/api/login', { username: 'haruka', password: 'sai-mat-khau' });
  ok(r.status === 401, 'sai mật khẩu bị từ chối');
  r = await api('POST', '/api/login', { username: 'haruka', password: 'matkhau123' });
  ok(r.status === 200, 'đăng nhập đúng');
  for (let i = 0; i < 8; i++) r = await api('POST', '/api/login', { username: 'trolang', password: 'sai-' + i });
  r = await api('POST', '/api/login', { username: 'trolang', password: 'sai-nua' });
  ok(r.status === 429, 'dò mật khẩu quá nhiều lần thì bị chặn tạm thời');
  r = await api('GET', '/api/me');
  ok(r.status === 401, 'không có token thì bị chặn');

  console.log('Lộ trình và mở khóa');
  r = await api('GET', '/api/curriculum', null, T);
  const units = r.body.units, status = r.body.status;
  const ids = units.flatMap(u => u.lessons.map(l => l.id));
  ok(ids.length > 100, 'có ' + ids.length + ' bài học');
  ok(status[ids[0]].unlocked && !status[ids[1]].unlocked, 'chỉ bài đầu được mở');
  r = await api('GET', '/api/lesson/' + ids[1], null, T);
  ok(r.status === 403, 'bài chưa mở khóa bị chặn');

  console.log('Làm bài và nhận xu');
  r = await api('GET', '/api/lesson/' + ids[0], null, T);
  ok(r.status === 200 && r.body.exercises.length > 8, 'lấy bài tập bài đầu');
  const perfect = Array(10).fill(true);
  r = await api('POST', '/api/lesson/' + ids[0] + '/complete', { results: perfect, wrongKeys: [], rightKeys: ['kana:あ'] }, T);
  const res = r.body.result;
  // 10 câu đúng liên tiếp: mốc 3 (+1), 6 (+2), 9 (+3) = 6 xu thưởng
  ok(res.baseCoins === config.COINS_PER_LESSON, 'xu cố định mỗi bài = ' + config.COINS_PER_LESSON, res);
  ok(res.bonusCoins === 6, 'thưởng chuỗi đúng liên tiếp = 6', res);
  ok(res.coinsEarned === 16 && r.body.me.coins === config.START_COINS + 16, 'tổng xu cộng đúng', r.body.me.coins);
  ok(res.stars === 3 && res.perfect, '3 sao khi không sai câu nào');
  ok(r.body.me.streak === 1, 'chuỗi ngày học = 1');
  ok(r.body.status[ids[1]].unlocked, 'bài tiếp theo được mở khóa');
  const coinsAfter1 = r.body.me.coins;

  // học lại: nhận 50% xu
  r = await api('POST', '/api/lesson/' + ids[0] + '/complete', { results: perfect, wrongKeys: [], rightKeys: [] }, T);
  ok(r.body.result.baseCoins === Math.round(config.COINS_PER_LESSON / 2) && !r.body.result.firstTime, 'học lại chỉ nhận 50% xu', r.body.result);

  // chuỗi bị ngắt: 2 sai xen kẽ
  r = await api('POST', '/api/lesson/' + ids[1] + '/complete', { results: [true, true, false, true, true, false, true, true, true, false], wrongKeys: ['kana:う'], rightKeys: [] }, T);
  ok(r.body.result.bonusCoins === 1, 'chuỗi đúng bị ngắt thì thưởng ít hơn (+1)', r.body.result);
  ok(r.body.result.stars === 2, '70% đúng = 2 sao', r.body.result.stars);

  console.log('Tim');
  let me = (await api('GET', '/api/me', null, T)).body.me;
  ok(me.mistakeCount === 1, 'ghi nhận 1 mục hay sai');
  for (let i = 0; i < config.MAX_HEARTS; i++) r = await api('POST', '/api/heart/lose', {}, T);
  ok(r.body.hearts === 0, 'mất hết tim');
  r = await api('GET', '/api/lesson/' + ids[0], null, T);
  ok(r.status === 403 && r.body.outOfHearts, 'hết tim thì không vào bài được');
  r = await api('GET', '/api/practice', null, T);
  ok(r.status === 403, 'hết tim thì không ôn tập được');

  console.log('Cửa hàng');
  r = await api('GET', '/api/shop', null, T);
  ok(r.body.items.length >= 20, 'cửa hàng có ' + r.body.items.length + ' món');
  const uid = Object.keys(dbMod.db().users).find(k => dbMod.db().users[k].username === 'haruka' || dbMod.db().users[k].usernameLower === 'haruka');
  ok(!!uid, 'tìm thấy tài khoản thử trong dữ liệu tạm');
  dbMod.db().users[uid].coins = 150; // cấp xu để thử mua đồ
  const coinsBefore = 150;
  r = await api('POST', '/api/shop/buy', { id: 'heart_1' }, T);
  ok(r.status === 200 && r.body.me.hearts === 1 && r.body.me.coins === coinsBefore - 30, 'mua bình hồi 1 tim');
  r = await api('POST', '/api/shop/buy', { id: 'hat_crown' }, T);
  ok(r.status === 400, 'không đủ xu thì không mua được vương miện (300 xu)');
  r = await api('POST', '/api/shop/buy', { id: 'hat_ribbon' }, T);
  ok(r.status === 200, 'mua nơ đỏ');
  r = await api('POST', '/api/shop/buy', { id: 'hat_ribbon' }, T);
  ok(r.status === 400, 'không mua trùng đồ');
  r = await api('POST', '/api/shop/equip', { id: 'hat_straw', on: true }, T);
  ok(r.status === 400, 'chưa mua thì không mặc được');
  r = await api('POST', '/api/shop/equip', { id: 'hat_ribbon', on: true }, T);
  ok(r.status === 200 && r.body.me.equipped.hat === 'hat_ribbon', 'mặc nơ đỏ');
  r = await api('POST', '/api/shop/equip', { id: 'hat_ribbon', on: false }, T);
  ok(r.body.me.equipped.hat === null, 'tháo nơ đỏ');
  dbMod.db().users[uid].coins = 300;
  r = await api('POST', '/api/shop/buy', { id: 'freeze' }, T);
  ok(r.status === 200 && r.body.me.freezes === 1, 'mua khiên giữ chuỗi');
  r = await api('POST', '/api/shop/buy', { id: 'coin_boost' }, T);
  ok(r.status === 200 && r.body.me.coinBoostLeftSec > 3000, 'mua bùa nhân đôi xu');

  console.log('Bùa nhân đôi xu');
  me = (await api('GET', '/api/me', null, T)).body.me;
  const c0 = me.coins;
  r = await api('POST', '/api/lesson/' + ids[2] + '/complete', { results: perfect, wrongKeys: [], rightKeys: [] }, T);
  ok(r.body.result.boosted && r.body.result.coinsEarned === 32 && r.body.me.coins === c0 + 32, 'xu được nhân đôi', r.body.result);

  console.log('Ôn tập lỗi sai');
  await api('POST', '/api/shop/buy', { id: 'heart_full' }, T);
  r = await api('GET', '/api/practice', null, T);
  ok(r.status === 200 && r.body.exercises.length > 0, 'có bài ôn tập từ mục hay sai');
  const prevCoins = (await api('GET', '/api/me', null, T)).body.me.coins;
  r = await api('POST', '/api/practice/complete', { results: [true, true, true], wrongKeys: [], rightKeys: ['kana:う'] }, T);
  ok(r.body.result.coinsEarned === 0 && r.body.result.xpEarned > 0 && r.body.me.coins === prevCoins, 'ôn tập có XP nhưng không có xu');
  ok(r.body.me.mistakeCount === 0, 'trả lời đúng thì xoá khỏi danh sách hay sai');

  console.log('Nhiệm vụ');
  me = (await api('GET', '/api/me', null, T)).body.me;
  ok(me.quests.length === 3, '3 nhiệm vụ mỗi ngày');
  const doneQ = me.quests.find(q => q.progress >= q.target);
  if (doneQ) {
    const c1 = me.coins;
    r = await api('POST', '/api/quests/claim', { id: doneQ.id }, T);
    ok(r.status === 200 && r.body.me.coins === c1 + doneQ.reward, 'nhận thưởng nhiệm vụ');
    r = await api('POST', '/api/quests/claim', { id: doneQ.id }, T);
    ok(r.status === 400, 'không nhận thưởng 2 lần');
  } else ok(true, '(chưa có nhiệm vụ nào xong, bỏ qua)');
  const notDone = me.quests.find(q => q.progress < q.target);
  if (notDone) {
    r = await api('POST', '/api/quests/claim', { id: notDone.id }, T);
    ok(r.status === 400, 'nhiệm vụ chưa xong không nhận được');
  }

  console.log('Bạn bè và xếp hạng');
  const r2 = await api('POST', '/api/register', { username: 'tanaka', password: 'matkhau456' });
  const T2 = r2.body.token;
  const code2 = (await api('GET', '/api/friends', null, T2)).body.code;
  r = await api('POST', '/api/friends/add', { code: 'ZZZZZZ' }, T);
  ok(r.status === 400, 'mã bạn bè sai bị từ chối');
  r = await api('POST', '/api/friends/add', { code: code2 }, T);
  ok(r.status === 200 && r.body.friends.length === 1, 'kết bạn bằng mã');
  r = await api('POST', '/api/friends/add', { code: code2 }, T);
  ok(r.status === 400, 'không kết bạn trùng');
  r = await api('GET', '/api/leaderboard?scope=friends', null, T);
  ok(r.body.list.length === 2 && r.body.list[0].username === 'haruka', 'bảng xếp hạng bạn bè đúng thứ tự');
  r = await api('GET', '/api/leaderboard', null, T2);
  ok(r.body.list.length === 2, 'bảng xếp hạng chung có 2 người');

  console.log('Vườn: pet, cây trồng, bạn bè');
  const users = () => dbMod.db().users;
  const idOf = async t => (await api('GET', '/api/me', null, t)).body.me.id;
  const idA = await idOf(T), idB = await idOf(T2);
  users()[idA].coins = 1000; users()[idB].coins = 1000;
  r = await api('GET', '/api/farm', null, T);
  ok(r.body.farm.water === 3 && r.body.farm.food === 2 && r.body.farm.plots.length === 3 && r.body.farm.pet === null, 'mở vườn lần đầu có quà khởi đầu');
  r = await api('POST', '/api/farm/buy', { what: 'water', n: 5 }, T);
  ok(r.status === 200 && r.body.farm.water === 8 && r.body.me.coins === 985, 'mua nước tốn xu');
  r = await api('POST', '/api/farm/buy', { what: 'gold', n: 1 }, T);
  ok(r.status === 400, 'mua món lạ bị từ chối');
  r = await api('POST', '/api/farm/plot', { action: 'plant', plot: 0, crop: 'carrot' }, T);
  ok(r.status === 200 && r.body.me.coins === 977 && r.body.farm.plots[0].stage === 0, 'gieo cà rốt');
  r = await api('POST', '/api/farm/plot', { action: 'plant', plot: 0, crop: 'carrot' }, T);
  ok(r.status === 400, 'không gieo đè lên ô đang có cây');
  r = await api('POST', '/api/farm/plot', { action: 'plant', plot: 5, crop: 'carrot' }, T);
  ok(r.status === 400, 'ô chưa mở không gieo được');
  r = await api('POST', '/api/farm/plot', { action: 'harvest', plot: 0 }, T);
  ok(r.status === 400, 'cây chưa chín không thu hoạch được');
  r = await api('POST', '/api/farm/plot', { action: 'water', plot: 0 }, T);
  ok(r.status === 200 && r.body.farm.plots[0].wetSec > 3000 && r.body.farm.water === 7, 'tưới cây');
  users()[idA].farm.plots[0].tick -= 3600e3; // giả lập đã qua 1 giờ
  r = await api('GET', '/api/farm', null, T);
  ok(r.body.farm.plots[0].ready === true, 'cây chín sau đủ 1 giờ có nước');
  r = await api('POST', '/api/farm/plot', { action: 'harvest', plot: 0 }, T);
  ok(r.status === 200 && r.body.farm.crops.carrot === 2 && r.body.farm.plots[0] === null, 'thu hoạch được 2 quả');
  r = await api('POST', '/api/farm/plot', { action: 'unlock' }, T);
  ok(r.status === 200 && r.body.farm.plotCount === 4 && r.body.me.coins === 937, 'mở thêm ô đất');
  r = await api('POST', '/api/farm/sell', { crop: 'carrot', n: 5 }, T);
  ok(r.status === 400, 'không bán nhiều hơn số đang có');

  r = await api('POST', '/api/farm/pet', { action: 'feed' }, T);
  ok(r.status === 400, 'chưa có thú cưng thì không cho ăn được');
  r = await api('POST', '/api/farm/pet', { action: 'adopt', kind: 'rabbit', name: 'Mochi' }, T);
  ok(r.status === 200 && r.body.farm.pet.name === 'Mochi' && r.body.me.coins === 837, 'nhận nuôi thú cưng');
  r = await api('POST', '/api/farm/pet', { action: 'adopt', kind: 'chick' }, T);
  ok(r.status === 400, 'chỉ nuôi một thú cưng');
  r = await api('POST', '/api/farm/pet', { action: 'claim' }, T);
  ok(r.status === 200 && r.body.me.coins === 837 + r.body.reward, 'bé khoẻ thì tặng quà mỗi ngày');
  r = await api('POST', '/api/farm/pet', { action: 'claim' }, T);
  ok(r.status === 400, 'mỗi ngày nhận quà một lần');
  users()[idA].farm.pet.at -= 30 * 3600e3; // 30 giờ không chăm
  r = await api('GET', '/api/farm', null, T);
  ok(r.body.farm.pet.mood === 'hungry' && r.body.farm.pet.food === 0, 'bỏ đói lâu thì bé đói');
  r = await api('POST', '/api/farm/pet', { action: 'feed', with: 'carrot' }, T);
  ok(r.status === 200 && r.body.farm.pet.food === 30 && r.body.farm.crops.carrot === 1, 'cho ăn cà rốt hồi 30');
  r = await api('POST', '/api/farm/pet', { action: 'drink' }, T);
  ok(r.status === 200 && r.body.farm.pet.water === 35 && r.body.farm.pet.love === 2, 'cho uống và tăng độ thân thiết');

  // bạn bè
  r = await api('POST', '/api/farm/plot', { action: 'plant', plot: 0, crop: 'tomato' }, T2);
  ok(r.status === 200, 'bạn gieo cà chua');
  r = await api('GET', '/api/farm/visit?id=' + idB, null, T);
  ok(r.status === 200 && r.body.plots[0].crop === 'tomato', 'thăm vườn bạn bè');
  r = await api('POST', '/api/farm/social', { id: idB, action: 'help', plot: 0 }, T);
  ok(r.status === 200 && r.body.view.plots[0].wetSec > 0, 'tưới giúp bạn');
  r = await api('POST', '/api/farm/social', { id: idB, action: 'pest', plot: 0 }, T);
  ok(r.status === 200 && r.body.view.plots[0].pest === true, 'thả sâu vào cây của bạn');
  r = await api('POST', '/api/farm/social', { id: idB, action: 'pest', plot: 0 }, T);
  ok(r.status === 400, 'cây đã có sâu không thả thêm');
  r = await api('GET', '/api/farm', null, T2);
  ok(r.body.farm.log.some(e => e.type === 'pest') && r.body.farm.log.some(e => e.type === 'help'), 'bạn thấy ai đã giúp/trêu mình');
  const pB = users()[idB].farm.plots[0];
  pB.tick -= 5 * 3600e3; pB.wetUntil = Date.now() + 5 * 3600e3;
  r = await api('GET', '/api/farm', null, T2);
  ok(r.body.farm.plots[0].pct === 0 && r.body.farm.plots[0].pest, 'có sâu thì cây không lớn');
  r = await api('POST', '/api/farm/plot', { action: 'clear_pest', plot: 0 }, T2);
  ok(r.status === 200 && r.body.farm.plots[0].pest === false, 'bắt sâu');
  pB.tick -= 5 * 3600e3; pB.wetUntil = Date.now() + 5 * 3600e3; pB.tick = Date.now() - 4 * 3600e3;
  r = await api('GET', '/api/farm', null, T2);
  ok(r.body.farm.plots[0].ready === true && r.body.farm.plots[0].qty === 2, 'cây chín sau khi hết sâu');
  r = await api('POST', '/api/farm/social', { id: idB, action: 'steal', plot: 0 }, T);
  ok(r.status === 200 && r.body.view.plots[0].qty === 1, 'hái trộm 1 quả');
  r = await api('GET', '/api/farm', null, T);
  ok(r.body.farm.crops.tomato === 1, 'quả hái trộm vào kho của mình');
  r = await api('POST', '/api/farm/social', { id: idB, action: 'steal', plot: 0 }, T);
  ok(r.status === 400, 'mỗi cây chỉ bị hái trộm một lần');
  r = await api('POST', '/api/farm/social', { id: idB, action: 'gift', what: 'water' }, T);
  ok(r.status === 200, 'tặng nước cho bạn');
  r = await api('GET', '/api/farm', null, T2);
  ok(r.body.farm.water === 4 && r.body.farm.log[0].type === 'gift', 'bạn nhận được quà');
  r = await api('POST', '/api/farm/social', { id: idB, action: 'gift', what: 'coin' }, T);
  ok(r.status === 400, 'không tặng xu trực tiếp');
  for (let i = 0; i < 5; i++) r = await api('POST', '/api/farm/social', { id: idB, action: 'gift', what: 'water' }, T);
  ok(r.status === 400, 'tặng quá giới hạn mỗi ngày thì bị chặn');
  const r3 = await api('POST', '/api/register', { username: 'nguoila', password: 'matkhau123' });
  const idC = await idOf(r3.body.token);
  r = await api('POST', '/api/farm/social', { id: idC, action: 'gift', what: 'water' }, T);
  ok(r.status === 400, 'không đụng được vào người chưa kết bạn');
  r = await api('GET', '/api/farm/visit?id=' + idC, null, T);
  ok(r.status === 400, 'không thăm được vườn người lạ');

  console.log('Cài đặt');
  r = await api('POST', '/api/settings', { sound: false, reminderHour: 20, mascotName: 'Mochi' }, T);
  ok(r.body.me.settings.sound === false && r.body.me.settings.reminderHour === 20, 'lưu cài đặt');
  r = await api('POST', '/api/logout', {}, T);
  r = await api('GET', '/api/me', null, T);
  ok(r.status === 401, 'đăng xuất xong token không còn dùng được');

  console.log('Giao diện tĩnh');
  r = await api('GET', '/', null);
  ok(r.status === 200 && r.raw.includes('Nihongo Neko'), 'trang chủ phục vụ được');
  r = await api('GET', '/../server.js', null);
  ok(r.status !== 200 || !r.raw.includes('createServer'), 'không đọc được file ngoài thư mục public');

  console.log('\nKết quả: ' + pass + ' đạt, ' + fail + ' lỗi');
  server.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
