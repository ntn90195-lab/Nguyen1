// Nuôi thú cưng và trồng cây: dùng xu mua nước, thức ăn, hạt giống; bạn bè tặng quà, tưới giúp, thả sâu, hái trộm.
const F = require('../content/farm');
const { db, save } = require('./db');
const { dayKey } = require('./game');

const HOUR = 3600e3;
const FOODS = ['food', ...Object.keys(F.CROPS).filter(k => F.CROPS[k].feed > 0)];
const GIFTABLE = ['water', 'food', 'fert', ...Object.keys(F.CROPS)];
const STOCK = ['water', 'food', 'fert']; // vật phẩm đếm trực tiếp trong kho

// ---------- Trạng thái của mỗi người (tạo khi dùng lần đầu) ----------
function farmOf(u) {
  if (!u.farm) {
    u.farm = {
      water: F.START_WATER, food: F.START_FOOD, crops: {},
      plotCount: F.PLOT_START, plots: Array(F.PLOT_MAX).fill(null),
      pet: null, petClaimDay: '', act: {}, log: [], fert: 0
    };
  }
  if (u.farm.fert === undefined) u.farm.fert = 0;
  return u.farm;
}
function addLog(target, entry) {
  const f = farmOf(target);
  f.log.unshift({ t: Date.now(), ...entry });
  if (f.log.length > F.LOG_MAX) f.log.length = F.LOG_MAX;
}

// ---------- Cây trồng ----------
function needMs(crop) { return F.CROPS[crop].hours * HOUR; }

function tickPlot(p, now) {
  now = now || Date.now();
  if (!p || p.ready) return;
  if (!p.pest) {
    const dt = Math.max(0, Math.min(now, p.wetUntil) - p.tick);
    p.grown += dt;
  }
  p.tick = now;
  if (p.grown >= needMs(p.crop)) { p.grown = needMs(p.crop); p.ready = true; p.qty = F.CROPS[p.crop].qty; }
}

function plotView(p, now) {
  if (!p) return null;
  tickPlot(p, now);
  const need = needMs(p.crop);
  const pct = Math.min(1, p.grown / need);
  const wetMs = Math.max(0, p.wetUntil - Date.now());
  return {
    crop: p.crop, pct: Math.round(pct * 100), stage: p.ready ? 3 : pct < 0.3 ? 0 : pct < 0.7 ? 1 : 2,
    ready: !!p.ready, pest: !!p.pest, fertilized: !!p.fertilized, qty: p.qty || 0, stolen: !!p.stolen,
    wetSec: Math.ceil(wetMs / 1000), leftSec: Math.ceil((need - p.grown) / 1000),
    thirsty: !p.ready && wetMs <= 0
  };
}

// ---------- Thú cưng ----------
function tickPet(pet, now) {
  now = now || Date.now();
  const hrs = Math.max(0, (now - pet.at) / HOUR);
  pet.food = Math.max(0, pet.food - hrs * F.FOOD_DECAY_PER_HOUR);
  pet.water = Math.max(0, pet.water - hrs * F.WATER_DECAY_PER_HOUR);
  pet.at = now;
}
function petView(f) {
  const pet = f.pet;
  if (!pet) return null;
  tickPet(pet);
  const level = 1 + Math.floor(pet.love / F.LOVE_PER_LEVEL);
  const food = Math.round(pet.food), water = Math.round(pet.water);
  const mood = food < 20 ? 'hungry' : water < 20 ? 'thirsty' : (food >= 60 && water >= 60) ? 'happy' : 'ok';
  const healthy = pet.food >= 30 && pet.water >= 30;
  return {
    kind: pet.kind, name: pet.name, food, water, love: pet.love, level,
    toNext: F.LOVE_PER_LEVEL - (pet.love % F.LOVE_PER_LEVEL), mood,
    reward: Math.min(F.PET_REWARD_MAX, F.PET_REWARD_BASE + level * F.PET_REWARD_PER_LEVEL),
    canClaim: healthy && f.petClaimDay !== dayKey(), claimedToday: f.petClaimDay === dayKey()
  };
}

// ---------- Hiển thị ----------
function publicFarm(u) {
  const f = farmOf(u);
  return {
    water: f.water, food: f.food, fert: f.fert, crops: f.crops,
    plotCount: f.plotCount, plots: f.plots.slice(0, f.plotCount).map(p => plotView(p)),
    nextPlotCost: f.plotCount < F.PLOT_MAX ? F.PLOT_COSTS[f.plotCount] : null,
    pet: petView(f),
    log: f.log.slice(0, 12),
    config: {
      waterPrice: F.WATER_PRICE, foodPrice: F.FOOD_PRICE, fertPrice: F.FERT_PRICE, crops: F.CROPS, pets: F.PETS,
      limits: { gift: F.GIFT_PER_DAY, help: F.HELP_PER_DAY, harm: F.HARM_PER_DAY }
    }
  };
}

function friendView(me, other) {
  const f = farmOf(other);
  const used = actOf(me, other.id);
  return {
    friend: { id: other.id, username: other.username, equipped: other.equipped },
    plots: f.plots.slice(0, f.plotCount).map(p => plotView(p)),
    pet: petView(f),
    left: { gift: F.GIFT_PER_DAY - used.gift, help: F.HELP_PER_DAY - used.help, harm: F.HARM_PER_DAY - used.harm },
    mine: { water: farmOf(me).water, food: farmOf(me).food, fert: farmOf(me).fert, crops: farmOf(me).crops }
  };
}

// ---------- Mua ----------
function buy(u, what, n) {
  const f = farmOf(u);
  n = Math.max(1, Math.min(20, Math.floor(Number(n) || 1)));
  const price = what === 'water' ? F.WATER_PRICE : what === 'food' ? F.FOOD_PRICE : what === 'fert' ? F.FERT_PRICE : 0;
  if (!price) return { error: 'Không có món này.' };
  if (u.coins < price * n) return { error: 'Bạn chưa đủ xu.' };
  u.coins -= price * n;
  f[what] += n;
  save();
  return { ok: true };
}

function sell(u, crop, n) {
  const f = farmOf(u);
  const c = F.CROPS[crop];
  if (!c) return { error: 'Không có loại này.' };
  n = Math.max(1, Math.floor(Number(n) || 1));
  if ((f.crops[crop] || 0) < n) return { error: 'Bạn không có đủ để bán.' };
  f.crops[crop] -= n;
  u.coins += c.sell * n;
  save();
  return { ok: true, coins: c.sell * n };
}

// ---------- Ô đất của mình ----------
function plot(u, body) {
  const f = farmOf(u);
  const action = body.action;
  if (action === 'unlock') {
    if (f.plotCount >= F.PLOT_MAX) return { error: 'Bạn đã mở hết các ô đất.' };
    const cost = F.PLOT_COSTS[f.plotCount];
    if (u.coins < cost) return { error: 'Bạn chưa đủ xu.' };
    u.coins -= cost; f.plotCount += 1; save();
    return { ok: true };
  }
  const i = Number(body.plot);
  if (!Number.isInteger(i) || i < 0 || i >= f.plotCount) return { error: 'Ô đất không hợp lệ.' };
  const p = f.plots[i];
  const now = Date.now();
  if (action === 'plant') {
    const c = F.CROPS[body.crop];
    if (!c) return { error: 'Không có loại cây này.' };
    if (p) return { error: 'Ô đất này đang có cây.' };
    if (u.coins < c.seed) return { error: 'Bạn chưa đủ xu mua hạt giống.' };
    u.coins -= c.seed;
    f.plots[i] = { crop: body.crop, grown: 0, tick: now, wetUntil: 0, pest: false, ready: false, qty: 0, stolen: false };
    save();
    return { ok: true };
  }
  if (!p) return { error: 'Ô đất đang trống.' };
  tickPlot(p, now);
  if (action === 'water') {
    if (p.ready) return { error: 'Cây đã chín rồi, hãy thu hoạch.' };
    if (f.water < 1) return { error: 'Bạn hết nước. Hãy mua thêm nhé.' };
    if (p.wetUntil - now >= F.WATER_STACK_HOURS * HOUR) return { error: 'Cây đang đủ nước rồi.' };
    p.wetUntil = Math.max(now, p.wetUntil) + HOUR;
    f.water -= 1; save();
    return { ok: true };
  }
  if (action === 'harvest') {
    if (!p.ready) return { error: 'Cây chưa chín.' };
    f.crops[p.crop] = (f.crops[p.crop] || 0) + p.qty;
    f.harvested = (f.harvested || 0) + p.qty;
    const got = p.qty, crop = p.crop;
    f.plots[i] = null; save();
    return { ok: true, got, crop };
  }
  if (action === 'fertilize') {
    if (p.ready) return { error: 'Cây đã chín rồi.' };
    if (p.pest) return { error: 'Cây đang có sâu, hãy bắt sâu trước.' };
    if (p.fertilized) return { error: 'Cây này đã bón phân rồi.' };
    if (f.fert < 1) return { error: 'Bạn hết phân bón. Hãy mua thêm nhé.' };
    f.fert -= 1;
    p.grown += (needMs(p.crop) - p.grown) * F.FERT_SPEEDUP;
    p.fertilized = true;
    tickPlot(p, now);
    save();
    return { ok: true };
  }
  if (action === 'clear_pest') {
    if (!p.pest) return { error: 'Không có sâu.' };
    p.pest = false; p.tick = now; save();
    return { ok: true };
  }
  if (action === 'remove') {
    f.plots[i] = null; save();
    return { ok: true };
  }
  return { error: 'Thao tác không hợp lệ.' };
}

// ---------- Thú cưng của mình ----------
function pet(u, body) {
  const f = farmOf(u);
  const action = body.action;
  if (action === 'adopt') {
    if (f.pet) return { error: 'Bạn đã có thú cưng rồi.' };
    const k = F.PETS[body.kind];
    if (!k) return { error: 'Không có loại thú cưng này.' };
    if (u.coins < k.adopt) return { error: 'Bạn chưa đủ xu.' };
    const name = String(body.name || '').trim().slice(0, 14) || k.name;
    u.coins -= k.adopt;
    f.pet = { kind: body.kind, name, food: 70, water: 70, love: 0, at: Date.now() };
    save();
    return { ok: true };
  }
  if (!f.pet) return { error: 'Bạn chưa có thú cưng.' };
  tickPet(f.pet);
  if (action === 'rename') {
    const name = String(body.name || '').trim().slice(0, 14);
    if (!name) return { error: 'Hãy nhập tên.' };
    f.pet.name = name; save();
    return { ok: true };
  }
  if (action === 'feed') {
    const what = body.with || 'food';
    if (!FOODS.includes(what)) return { error: 'Thú cưng không ăn món này.' };
    const stock = what === 'food' ? f.food : (f.crops[what] || 0);
    if (stock < 1) return { error: 'Bạn không có món này.' };
    if (f.pet.food >= 95) return { error: 'Thú cưng đang no rồi.' };
    const add = what === 'food' ? F.FOOD_PER_ITEM : F.CROPS[what].feed;
    if (what === 'food') f.food -= 1; else f.crops[what] -= 1;
    f.pet.food = Math.min(100, f.pet.food + add);
    f.pet.love += 1; save();
    return { ok: true };
  }
  if (action === 'drink') {
    if (f.water < 1) return { error: 'Bạn hết nước. Hãy mua thêm nhé.' };
    if (f.pet.water >= 95) return { error: 'Thú cưng không khát.' };
    f.water -= 1;
    f.pet.water = Math.min(100, f.pet.water + F.WATER_PER_ITEM);
    f.pet.love += 1; save();
    return { ok: true };
  }
  if (action === 'claim') {
    const v = petView(f);
    if (v.claimedToday) return { error: 'Hôm nay bé đã tặng quà rồi.' };
    if (!v.canClaim) return { error: 'Bé đang đói hoặc khát, hãy chăm bé trước.' };
    f.petClaimDay = dayKey();
    u.coins += v.reward; save();
    return { ok: true, reward: v.reward };
  }
  return { error: 'Thao tác không hợp lệ.' };
}

// ---------- Với bạn bè ----------
function actOf(u, targetId) {
  const f = farmOf(u);
  const today = dayKey();
  let a = f.act[targetId];
  if (!a || a.day !== today) a = f.act[targetId] = { day: today, gift: 0, help: 0, harm: 0 };
  return a;
}

function social(u, body) {
  const other = db().users[body.id];
  if (!other || other.id === u.id || !u.friends.includes(other.id)) return { error: 'Chỉ làm được với bạn bè của bạn.' };
  const mine = farmOf(u), theirs = farmOf(other);
  const a = actOf(u, other.id);
  const action = body.action;
  const now = Date.now();

  if (action === 'gift') {
    const what = body.what;
    if (!GIFTABLE.includes(what)) return { error: 'Không tặng được món này.' };
    if (a.gift >= F.GIFT_PER_DAY) return { error: 'Hôm nay bạn đã tặng bạn này đủ rồi.' };
    const has = STOCK.includes(what) ? mine[what] : (mine.crops[what] || 0);
    if (has < 1) return { error: 'Bạn không có món này để tặng.' };
    if (STOCK.includes(what)) { mine[what] -= 1; theirs[what] += 1; }
    else { mine.crops[what] -= 1; theirs.crops[what] = (theirs.crops[what] || 0) + 1; }
    a.gift += 1;
    addLog(other, { type: 'gift', from: u.username, what });
    save();
    return { ok: true };
  }

  const i = Number(body.plot);
  if (!Number.isInteger(i) || i < 0 || i >= theirs.plotCount) return { error: 'Ô đất không hợp lệ.' };
  const p = theirs.plots[i];
  if (!p) return { error: 'Ô đất đang trống.' };
  tickPlot(p, now);

  if (action === 'help') {
    if (a.help >= F.HELP_PER_DAY) return { error: 'Hôm nay bạn đã giúp bạn này đủ rồi.' };
    if (p.ready) return { error: 'Cây đã chín rồi.' };
    if (mine.water < 1) return { error: 'Bạn hết nước. Hãy mua thêm nhé.' };
    if (p.wetUntil - now >= F.WATER_STACK_HOURS * HOUR) return { error: 'Cây đang đủ nước rồi.' };
    p.wetUntil = Math.max(now, p.wetUntil) + HOUR;
    mine.water -= 1; a.help += 1; mine.helped = (mine.helped || 0) + 1;
    addLog(other, { type: 'help', from: u.username, crop: p.crop });
    save();
    return { ok: true };
  }
  if ((action === 'pest' || action === 'steal') && other.settings && other.settings.allowHarm === false) return { error: other.username + ' đã tắt chế độ trêu chọc vườn.' };
  if (action === 'pest') {
    if (a.harm >= F.HARM_PER_DAY) return { error: 'Hôm nay bạn đã trêu bạn này đủ rồi.' };
    if (p.ready) return { error: 'Cây đã chín, không thả sâu được.' };
    if (p.pest) return { error: 'Cây này có sâu rồi.' };
    p.pest = true; p.tick = now; a.harm += 1;
    addLog(other, { type: 'pest', from: u.username, crop: p.crop });
    save();
    return { ok: true };
  }
  if (action === 'steal') {
    if (a.harm >= F.HARM_PER_DAY) return { error: 'Hôm nay bạn đã trêu bạn này đủ rồi.' };
    if (!p.ready) return { error: 'Cây chưa chín.' };
    if (p.stolen || p.qty < 2) return { error: 'Cây này đã bị hái bớt rồi.' };
    p.qty -= 1; p.stolen = true; a.harm += 1;
    mine.crops[p.crop] = (mine.crops[p.crop] || 0) + 1;
    addLog(other, { type: 'steal', from: u.username, crop: p.crop });
    save();
    return { ok: true, crop: p.crop };
  }
  return { error: 'Thao tác không hợp lệ.' };
}

module.exports = { farmOf, publicFarm, friendView, buy, sell, plot, pet, social, tickPlot };
