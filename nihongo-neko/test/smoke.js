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
  const ZZ_SELF = (await api('GET', '/api/friends', null, T)).body.code;
  const r2 = await api('POST', '/api/register', { username: 'tanaka', password: 'matkhau456' });
  const T2 = r2.body.token;
  const code2 = (await api('GET', '/api/friends', null, T2)).body.code;
  r = await api('POST', '/api/friends/add', { code: 'ZZZZZZ' }, T);
  ok(r.status === 400, 'mã bạn bè sai bị từ chối');
  r = await api('POST', '/api/friends/add', { code: code2 }, T);
  ok(r.status === 200 && r.body.accepted === false && r.body.friends.length === 0 && r.body.outgoing.length === 1, 'gửi lời mời kết bạn (chưa thành bạn ngay)');
  r = await api('POST', '/api/friends/add', { code: code2 }, T);
  ok(r.status === 400, 'không gửi lời mời trùng');
  r = await api('POST', '/api/friends/add', { code: ZZ_SELF }, T);
  ok(r.status === 400, 'không tự kết bạn với mình');
  r = await api('GET', '/api/friends', null, T2);
  ok(r.body.incoming.length === 1 && r.body.incoming[0].user.username === 'haruka', 'người kia thấy lời mời');
  r = await api('GET', '/api/me', null, T2);
  ok(r.body.me.pending === 1, 'có số lời mời chờ để hiện chấm đỏ');
  r = await api('POST', '/api/friends/respond', { id: 'khongco', accept: true }, T2);
  ok(r.status === 400, 'lời mời không tồn tại bị từ chối');
  r = await api('POST', '/api/friends/respond', { id: (await api('GET', '/api/friends', null, T2)).body.incoming[0].id, accept: true }, T2);
  ok(r.status === 200 && r.body.friends.length === 1 && r.body.incoming.length === 0, 'chấp nhận lời mời thì thành bạn');
  r = await api('GET', '/api/friends', null, T);
  ok(r.body.friends.length === 1 && r.body.outgoing.length === 0, 'hai bên đều thấy nhau trong danh sách');
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

  console.log('Cộng đồng và hồ sơ');
  r = await api('GET', '/api/profile?id=' + idB, null, T);
  ok(r.status === 200 && r.body.relation === 'friend' && r.body.badges.length > 5 && r.body.user.level >= 1, 'xem hồ sơ bạn bè có huy hiệu và cấp');
  r = await api('GET', '/api/profile', null, T);
  ok(r.body.relation === 'self' && r.body.badges.find(b => b.id === 'pet').got === true && r.body.badges.find(b => b.id === 'first').got === true, 'hồ sơ của mình: huy hiệu theo số liệu thật');
  r = await api('GET', '/api/profile?id=' + idC, null, T);
  ok(r.body.relation === 'none', 'hồ sơ người lạ: chưa là bạn');
  r = await api('POST', '/api/friends/add', { username: 'NGUOILA' }, T);
  ok(r.status === 200 && r.body.outgoing.length === 1, 'gửi lời mời bằng tên đăng nhập (không phân biệt hoa thường)');
  r = await api('GET', '/api/profile?id=' + idC, null, T);
  ok(r.body.relation === 'outgoing', 'hồ sơ hiện đã gửi lời mời');
  r = await api('POST', '/api/friends/cancel', { id: r.body.requestId }, T);
  ok(r.status === 200 && r.body.outgoing.length === 0, 'huỷ lời mời');
  r = await api('POST', '/api/friends/add', { username: 'haruka' }, r3.body.token);
  r = await api('POST', '/api/friends/add', { username: 'nguoila' }, T);
  ok(r.status === 200 && r.body.accepted === true, 'hai bên cùng mời nhau thì tự thành bạn');
  r = await api('POST', '/api/friends/remove', { id: idC }, T);
  ok(r.status === 200 && r.body.friends.length === 1, 'xoá bạn');
  r = await api('GET', '/api/friends', null, r3.body.token);
  ok(r.body.friends.length === 0, 'xoá bạn là xoá cả hai phía');
  users()[idB].lastStudyDay = require('../lib/game').dayKey();
  r = await api('POST', '/api/friends/nudge', { id: idB }, T);
  ok(r.status === 400, 'bạn đã học hôm nay thì không cần nhắc');
  users()[idB].lastStudyDay = '2000-01-01';
  r = await api('POST', '/api/friends/nudge', { id: idB }, T);
  ok(r.status === 200, 'nhắc bạn chưa học hôm nay');
  r = await api('POST', '/api/friends/nudge', { id: idB }, T);
  ok(r.status === 400, 'mỗi ngày chỉ nhắc một lần');
  r = await api('GET', '/api/friends', null, T2);
  ok(r.body.inbox[0].type === 'nudge' && r.body.inbox[0].from === 'haruka', 'bạn nhận được lời nhắc');
  r = await api('POST', '/api/friends/nudge', { id: idC }, T);
  ok(r.status === 400, 'không nhắc được người không phải bạn');
  r = await api('POST', '/api/settings', { bio: '  Xin   chào!  ' + 'x'.repeat(200), allowHarm: false }, T2);
  ok(r.body.me.bio.length === 80 && r.body.me.bio.startsWith('Xin chào!') && r.body.me.allowHarm === false, 'lưu giới thiệu (gọn, tối đa 80 ký tự) và tắt chế độ trêu');
  users()[idB].farm.plots[0] = { crop: 'carrot', grown: 0, tick: Date.now(), wetUntil: 0, pest: false, ready: false, qty: 0, stolen: false };
  r = await api('POST', '/api/farm/social', { id: idB, action: 'pest', plot: 0 }, T);
  ok(r.status === 400 && /tắt/.test(r.body.error), 'bạn đã tắt trêu chọc thì không thả sâu được');
  users()[idA].farm.water += 3;
  r = await api('POST', '/api/farm/social', { id: idB, action: 'help', plot: 0 }, T);
  ok(r.status === 200, 'nhưng vẫn tưới giúp được', r.body);
  r = await api('POST', '/api/account/password', { oldPassword: 'sai', newPassword: 'matkhaumoi1' }, T2);
  ok(r.status === 400, 'đổi mật khẩu: sai mật khẩu cũ bị từ chối');
  r = await api('POST', '/api/account/password', { oldPassword: 'matkhau456', newPassword: '123' }, T2);
  ok(r.status === 400, 'đổi mật khẩu: mật khẩu mới quá ngắn');
  r = await api('POST', '/api/account/password', { oldPassword: 'matkhau456', newPassword: 'matkhaumoi1' }, T2);
  ok(r.status === 200, 'đổi mật khẩu thành công');
  r = await api('POST', '/api/login', { username: 'tanaka', password: 'matkhaumoi1' });
  ok(r.status === 200, 'đăng nhập bằng mật khẩu mới');
  r = await api('GET', '/api/me', null, T2);
  ok(r.status === 200, 'phiên hiện tại vẫn dùng được sau khi đổi mật khẩu');
  r = await api('POST', '/api/account/delete', { password: 'sai' }, r3.body.token);
  ok(r.status === 400, 'xoá tài khoản cần đúng mật khẩu');
  r = await api('POST', '/api/account/delete', { password: 'matkhau123' }, r3.body.token);
  ok(r.status === 200, 'xoá tài khoản');
  r = await api('GET', '/api/me', null, r3.body.token);
  ok(r.status === 401, 'tài khoản đã xoá không đăng nhập được nữa');
  ok(!users()[idC] && !users()[idA].friends.includes(idC), 'dữ liệu và quan hệ bạn bè của tài khoản đã xoá được dọn');

  console.log('Bài ẩn và bài mua');
  const rb = await api('POST', '/api/register', { username: 'bonususer', password: 'matkhau123' });
  const TB = rb.body.token, idBn = await idOf(TB);
  r = await api('GET', '/api/bonus', null, TB);
  const secretAnimals = r.body.packs.find(p => p.id === 'x_animals');
  ok(secretAnimals.state === 'locked' && secretAnimals.title === '???' && secretAnimals.lessons.length === 0, 'bài ẩn chưa đạt điều kiện: chỉ hiện ??? và gợi ý');
  ok(r.body.packs.filter(p => p.mode === 'shop').every(p => p.state === 'buyable'), 'bài mua hiện để mua');
  r = await api('GET', '/api/lesson/v_animals', null, TB);
  ok(r.status === 403, 'chưa mở thì không học được bài ẩn');
  r = await api('GET', '/api/lesson/v_sushi', null, TB);
  ok(r.status === 403, 'chưa mua thì không học được bài mua');
  r = await api('POST', '/api/bonus/buy', { id: 'x_animals' }, TB);
  ok(r.status === 400, 'bài ẩn không mua được');
  users()[idBn].coins = 70;
  r = await api('POST', '/api/bonus/buy', { id: 's_sushi' }, TB);
  ok(r.status === 400, 'không đủ xu thì không mua được');
  users()[idBn].coins = 300;
  r = await api('POST', '/api/bonus/buy', { id: 's_sushi' }, TB);
  ok(r.status === 200 && r.body.me.coins === 220 && r.body.packs.find(p => p.id === 's_sushi').state === 'open', 'mua bài bằng xu');
  r = await api('POST', '/api/bonus/buy', { id: 's_sushi' }, TB);
  ok(r.status === 400, 'không mua lần hai');
  r = await api('GET', '/api/lesson/v_sushi', null, TB);
  ok(r.status === 200 && r.body.exercises.length >= 8 && r.body.exercises[0].type === 'teach', 'học bài đã mua');
  const bonusCoinsBefore = (await api('GET', '/api/me', null, TB)).body.me.coins;
  r = await api('POST', '/api/lesson/v_sushi/complete', { results: [true, true, true, true, true, true, true, true], rightKeys: [], wrongKeys: [] }, TB);
  ok(r.status === 200 && r.body.result.baseCoins === config.COINS_PER_BONUS_LESSON && r.body.me.coins === bonusCoinsBefore + r.body.result.coinsEarned, 'bài đặc biệt thưởng xu nhiều hơn');
  users()[idBn].bestStreak = 3;
  r = await api('GET', '/api/curriculum', null, TB);
  ok(r.body.bonus.fresh.length === 1 && r.body.bonus.fresh[0].id === 'x_animals', 'đạt điều kiện thì bài ẩn mở và được báo');
  r = await api('GET', '/api/curriculum', null, TB);
  ok(r.body.bonus.fresh.length === 0 && r.body.bonus.packs.find(p => p.id === 'x_animals').state === 'open', 'chỉ báo bài ẩn mới mở một lần');
  r = await api('GET', '/api/lesson/v_animals', null, TB);
  ok(r.status === 200, 'học được bài ẩn đã mở');
  ok(Object.keys(users()[idBn].completed).includes('v_sushi'), 'tiến độ bài đặc biệt được lưu');
  r = await api('GET', '/api/curriculum', null, TB);
  ok(!JSON.stringify(r.body.units).includes('v_sushi'), 'bài đặc biệt không lẫn vào lộ trình chính');

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
