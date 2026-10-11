// Luật chơi: tim, xu, chuỗi ngày học, nhiệm vụ, cửa hàng, bảng xếp hạng, bạn bè.
const config = require('../config');
const shop = require('../content/shop');
const farmCfg = require('../content/farm');
const { db, save } = require('./db');

const SHOP_BY_ID = Object.fromEntries(shop.map(i => [i.id, i]));

// ---------- Ngày / tuần (theo giờ máy chạy server) ----------
function dayKey(ts) {
  const d = new Date(ts || Date.now());
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function daysBetween(a, b) { // số ngày từ a đến b (chuỗi yyyy-mm-dd)
  const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
  const ta = Date.UTC(pa[0], pa[1] - 1, pa[2]), tb = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((tb - ta) / 86400000);
}
function weekKey(ts) { // ngày thứ Hai của tuần
  const d = new Date(ts || Date.now());
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return dayKey(d.getTime());
}

// ---------- Tim ----------
function refreshHearts(u) {
  const now = Date.now();
  const interval = config.HEART_REGEN_MINUTES * 60000;
  if (u.hearts >= config.MAX_HEARTS) { u.heartsUpdatedAt = now; return; }
  const gained = Math.floor((now - u.heartsUpdatedAt) / interval);
  if (gained > 0) {
    u.hearts = Math.min(config.MAX_HEARTS, u.hearts + gained);
    u.heartsUpdatedAt = u.hearts >= config.MAX_HEARTS ? now : u.heartsUpdatedAt + gained * interval;
  }
}
function loseHeart(u) {
  refreshHearts(u);
  if (u.hearts >= config.MAX_HEARTS) u.heartsUpdatedAt = Date.now(); // bắt đầu đếm hồi từ lúc mất tim
  u.hearts = Math.max(0, u.hearts - 1);
  save();
  return u.hearts;
}
function addHearts(u, n) {
  refreshHearts(u);
  u.hearts = Math.min(config.MAX_HEARTS, u.hearts + n);
  if (u.hearts >= config.MAX_HEARTS) u.heartsUpdatedAt = Date.now();
}
function nextHeartInSec(u) {
  if (u.hearts >= config.MAX_HEARTS) return 0;
  const interval = config.HEART_REGEN_MINUTES * 60000;
  return Math.max(0, Math.ceil((u.heartsUpdatedAt + interval - Date.now()) / 1000));
}

// ---------- Chuỗi ngày học ----------
function effectiveStreak(u) {
  if (!u.lastStudyDay) return 0;
  const gap = daysBetween(u.lastStudyDay, dayKey());
  if (gap <= 1) return u.streak;
  const need = gap - 1;
  return (u.inventory.freeze || 0) >= need ? u.streak : 0;
}
function touchStreak(u) {
  const today = dayKey();
  if (u.lastStudyDay === today) return { extended: false };
  let extended = false, usedFreeze = 0;
  if (!u.lastStudyDay) { u.streak = 1; extended = true; }
  else {
    const gap = daysBetween(u.lastStudyDay, today);
    if (gap === 1) { u.streak += 1; extended = true; }
    else if (gap > 1) {
      const need = gap - 1;
      if ((u.inventory.freeze || 0) >= need) {
        u.inventory.freeze -= need; usedFreeze = need;
        u.streak += 1; extended = true;
      } else { u.streak = 1; extended = true; }
    }
  }
  u.lastStudyDay = today;
  u.bestStreak = Math.max(u.bestStreak || 0, u.streak);
  return { extended, usedFreeze };
}

// ---------- Nhiệm vụ hằng ngày ----------
const QUEST_POOL = [
  { id: 'lessons2', title: 'Hoàn thành 2 bài học', target: 2, reward: 15, metric: 'lessons' },
  { id: 'lessons3', title: 'Hoàn thành 3 bài học', target: 3, reward: 25, metric: 'lessons' },
  { id: 'xp40',     title: 'Kiếm 40 XP',           target: 40, reward: 15, metric: 'xp' },
  { id: 'xp60',     title: 'Kiếm 60 XP',           target: 60, reward: 25, metric: 'xp' },
  { id: 'correct20', title: 'Trả lời đúng 20 câu', target: 20, reward: 15, metric: 'correct' },
  { id: 'correct30', title: 'Trả lời đúng 30 câu', target: 30, reward: 20, metric: 'correct' },
  { id: 'perfect1', title: 'Làm 1 bài không sai câu nào', target: 1, reward: 20, metric: 'perfect' },
  { id: 'combo5',   title: 'Đạt chuỗi 5 câu đúng liên tiếp', target: 5, reward: 15, metric: 'combo' }
];
function ensureQuests(u) {
  const today = dayKey();
  if (u.quests.day === today && u.quests.list.length) return;
  // chọn 3 nhiệm vụ khác loại, xoay theo ngày
  const seed = today.split('-').reduce((a, b) => a * 31 + Number(b), 7);
  const pool = QUEST_POOL.slice();
  const picked = [], usedMetrics = new Set();
  let s = seed;
  while (picked.length < 3 && pool.length) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const q = pool.splice(s % pool.length, 1)[0];
    if (usedMetrics.has(q.metric)) continue;
    usedMetrics.add(q.metric);
    picked.push({ id: q.id, title: q.title, target: q.target, reward: q.reward, metric: q.metric, progress: 0, claimed: false });
  }
  u.quests = { day: today, list: picked };
}
function bumpQuests(u, stats) {
  ensureQuests(u);
  for (const q of u.quests.list) {
    if (q.metric === 'combo') q.progress = Math.max(q.progress, stats.combo || 0);
    else q.progress += stats[q.metric] || 0;
    if (q.progress > q.target) q.progress = q.target;
  }
}
function claimQuest(u, questId) {
  ensureQuests(u);
  const q = u.quests.list.find(x => x.id === questId);
  if (!q) return { error: 'Không tìm thấy nhiệm vụ.' };
  if (q.claimed) return { error: 'Bạn đã nhận thưởng rồi.' };
  if (q.progress < q.target) return { error: 'Nhiệm vụ chưa hoàn thành.' };
  q.claimed = true;
  u.coins += q.reward;
  save();
  return { ok: true, reward: q.reward };
}

// ---------- Tính xu ----------
function comboBonus(results) {
  let combo = 0, bonus = 0, maxCombo = 0;
  for (const ok of results) {
    if (ok) {
      combo++;
      maxCombo = Math.max(maxCombo, combo);
      if (combo % config.COMBO_BONUS_EVERY === 0) {
        bonus += config.COMBO_BONUS_COINS * (combo / config.COMBO_BONUS_EVERY);
      }
    } else combo = 0;
  }
  return { bonus: Math.min(bonus, config.COMBO_BONUS_CAP), maxCombo };
}

// ---------- Tuần (bảng xếp hạng) ----------
function rollWeek(u) {
  const wk = weekKey();
  if (u.weekKey !== wk) { u.weekKey = wk; u.weekXp = 0; }
}

// ---------- Hoàn thành bài ----------
function completeLesson(u, lesson, payload, { practice } = {}) {
  refreshHearts(u);
  const results = Array.isArray(payload.results) ? payload.results.slice(0, 60).map(Boolean) : [];
  const total = results.length;
  const correct = results.filter(Boolean).length;
  const { bonus, maxCombo } = comboBonus(results);
  const perfect = total > 0 && correct === total;
  const pct = total ? correct / total : 0;
  const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : 1;

  rollWeek(u);
  const streakInfo = touchStreak(u);
  let coinsEarned = 0, xpEarned = 0, firstTime = false, baseCoins = 0, bonusCoins = 0;

  if (practice) {
    xpEarned = config.PRACTICE_XP + correct * config.XP_PER_CORRECT;
  } else {
    const prev = u.completed[lesson.id];
    firstTime = !prev;
    let base = lesson.pack ? config.COINS_PER_BONUS_LESSON : config.COINS_PER_LESSON;
    if (!firstTime) base = Math.round(base * config.REPLAY_COIN_PERCENT / 100);
    baseCoins = base;
    bonusCoins = firstTime ? bonus : Math.round(bonus * config.REPLAY_COIN_PERCENT / 100);
    coinsEarned = baseCoins + bonusCoins;
    xpEarned = config.XP_PER_LESSON + correct * config.XP_PER_CORRECT;
    u.completed[lesson.id] = {
      stars: Math.max(prev ? prev.stars : 0, stars),
      bestScore: Math.max(prev ? prev.bestScore : 0, Math.round(pct * 100)),
      times: (prev ? prev.times : 0) + 1,
      last: Date.now()
    };
  }
  let boosted = false;
  if (coinsEarned > 0 && u.boosts.coinBoostUntil > Date.now()) { coinsEarned *= 2; boosted = true; }

  u.coins += coinsEarned;
  u.xp += xpEarned;
  u.weekXp += xpEarned;

  // ghi nhận câu sai để ôn lại; câu đúng thì giảm dần
  const wrongKeys = Array.isArray(payload.wrongKeys) ? payload.wrongKeys.slice(0, 60).map(String) : [];
  const rightKeys = Array.isArray(payload.rightKeys) ? payload.rightKeys.slice(0, 60).map(String) : [];
  for (const k of wrongKeys) u.mistakes[k] = (u.mistakes[k] || 0) + 1;
  for (const k of rightKeys) {
    if (u.mistakes[k]) { u.mistakes[k] -= 1; if (u.mistakes[k] <= 0) delete u.mistakes[k]; }
  }

  bumpQuests(u, { lessons: practice ? 0 : 1, xp: xpEarned, correct, perfect: perfect ? 1 : 0, combo: maxCombo });
  save();
  return { coinsEarned, baseCoins, bonusCoins, xpEarned, bonus: practice ? 0 : bonus, stars, correct, total, maxCombo, perfect,
           boosted, firstTime, streak: u.streak, streakExtended: streakInfo.extended, usedFreeze: streakInfo.usedFreeze || 0 };
}

// ---------- Cửa hàng ----------
function shopList(u) {
  return shop.map(i => ({
    ...i,
    owned: i.kind === 'gear' ? (i.price === 0 || !!u.inventory[i.id]) : (u.inventory[i.id] || 0),
    equipped: i.kind === 'gear' && (i.slot === 'theme' ? ('theme_' + u.equipped.theme) === i.id : u.equipped[i.slot] === i.id)
  }));
}
function buy(u, itemId) {
  const it = SHOP_BY_ID[itemId];
  if (!it) return { error: 'Không có món này.' };
  if (it.kind === 'gear' && (it.price === 0 || u.inventory[it.id])) return { error: 'Bạn đã có món này rồi.' };
  if (u.coins < it.price) return { error: 'Bạn chưa đủ xu.' };
  if (it.id === 'freeze' && (u.inventory.freeze || 0) >= config.STREAK_FREEZE_MAX) {
    return { error: 'Bạn chỉ giữ tối đa ' + config.STREAK_FREEZE_MAX + ' khiên.' };
  }
  if (it.id === 'heart_1' || it.id === 'heart_full') {
    refreshHearts(u);
    if (u.hearts >= config.MAX_HEARTS) return { error: 'Tim của bạn đã đầy rồi.' };
  }
  u.coins -= it.price;
  if (it.kind === 'gear') {
    u.inventory[it.id] = 1;
    save();
    return { ok: true, item: it };
  }
  // đồ dùng một lần: dùng ngay với tim và bùa, khiên thì cất vào túi
  if (it.id === 'heart_1') addHearts(u, 1);
  else if (it.id === 'heart_full') addHearts(u, config.MAX_HEARTS);
  else if (it.id === 'coin_boost') {
    const base = Math.max(Date.now(), u.boosts.coinBoostUntil || 0);
    u.boosts.coinBoostUntil = base + 60 * 60000;
  } else u.inventory[it.id] = (u.inventory[it.id] || 0) + 1;
  save();
  return { ok: true, item: it };
}
function equip(u, itemId, on) {
  const it = SHOP_BY_ID[itemId];
  if (!it || it.kind !== 'gear') return { error: 'Món này không mặc được.' };
  if (!(it.price === 0 || u.inventory[it.id])) return { error: 'Bạn chưa mua món này.' };
  if (it.slot === 'theme') u.equipped.theme = it.id.replace('theme_', '');
  else u.equipped[it.slot] = on === false ? null : it.id;
  save();
  return { ok: true };
}

// ---------- Cấp độ (theo tổng XP) ----------
function levelInfo(xp) {
  const level = 1 + Math.floor(Math.sqrt(xp / 40));
  const lo = 40 * (level - 1) * (level - 1), hi = 40 * level * level;
  return { level, pct: Math.round((xp - lo) / (hi - lo) * 100), toNext: hi - xp };
}

// ---------- Hiển thị cho client ----------
function publicUser(u) {
  refreshHearts(u);
  ensureQuests(u);
  rollWeek(u);
  return {
    id: u.id, username: u.username, friendCode: u.friendCode, mascotName: u.mascotName,
    coins: u.coins, xp: u.xp, weekXp: u.weekXp,
    hearts: u.hearts, maxHearts: config.MAX_HEARTS, nextHeartInSec: nextHeartInSec(u),
    streak: effectiveStreak(u), bestStreak: u.bestStreak || 0,
    studiedToday: u.lastStudyDay === dayKey(),
    freezes: u.inventory.freeze || 0,
    completed: u.completed,
    mistakeCount: Object.keys(u.mistakes).length,
    inventory: u.inventory, equipped: u.equipped,
    coinBoostLeftSec: Math.max(0, Math.ceil(((u.boosts.coinBoostUntil || 0) - Date.now()) / 1000)),
    quests: u.quests.list, settings: u.settings,
    bio: u.bio || '', level: levelInfo(u.xp), allowHarm: u.settings.allowHarm !== false,
    pending: db().friendRequests.filter(r => r.to === u.id).length
  };
}
function cardOf(x) {
  return { id: x.id, username: x.username, weekXp: (weekKey() === x.weekKey ? x.weekXp : 0), xp: x.xp,
           level: levelInfo(x.xp).level, streak: effectiveStreak(x), equipped: x.equipped, bio: x.bio || '',
           lastSeen: x.lastSeen || 0, studiedToday: x.lastStudyDay === dayKey() };
}
// Bảng xếp hạng nhiều loại: week (XP tuần), xp (tổng XP / level), streak (chuỗi ngày), pet (cấp thú cưng), farm (nông sản thu hoạch)
const RANK_KINDS = ['week', 'xp', 'streak', 'pet', 'farm'];
function petOf(x) {
  const p = x.farm && x.farm.pet;
  return p ? { kind: p.kind, name: p.name, love: p.love, level: 1 + Math.floor(p.love / farmCfg.LOVE_PER_LEVEL) } : null;
}
function rankValue(x, by) {
  switch (by) {
    case 'xp': return [x.xp, 0];
    case 'streak': return [effectiveStreak(x), x.bestStreak || 0];
    case 'pet': { const p = petOf(x); return p ? [p.level, p.love] : null; }
    case 'farm': return [(x.farm && x.farm.harvested) || 0, 0];
    default: return [weekKey() === x.weekKey ? x.weekXp : 0, x.xp];
  }
}
function leaderboard(u, scope, by) {
  by = RANK_KINDS.includes(by) ? by : 'week';
  const pool = scope === 'friends' ? new Set([u.id, ...u.friends]) : null;
  const rows = [];
  for (const x of Object.values(db().users)) {
    if (pool && !pool.has(x.id)) continue;
    const v = rankValue(x, by);
    if (!v) continue;
    const c = cardOf(x), pet = petOf(x);
    rows.push({ ...c, value: v[0], tie: v[1], petKind: pet ? pet.kind : null, petName: pet ? pet.name : '', petLevel: pet ? pet.level : 0 });
  }
  rows.sort((a, b) => b.value - a.value || b.tie - a.tie || b.xp - a.xp || (a.id < b.id ? -1 : 1));
  rows.forEach((r, i) => { r.rank = i + 1; delete r.tie; });
  const meRow = rows.find(r => r.id === u.id) || null;
  return { list: rows.slice(0, 50), meId: u.id, by, total: rows.length, meRank: meRow ? meRow.rank : null, meRow };
}
function friendsList(u) {
  return u.friends.map(id => db().users[id]).filter(Boolean).map(cardOf);
}
function addFriend(u, code) {
  code = String(code || '').trim().toUpperCase();
  const other = Object.values(db().users).find(x => x.friendCode === code);
  if (!other) return { error: 'Không tìm thấy mã bạn bè này.' };
  if (other.id === u.id) return { error: 'Đây là mã của chính bạn.' };
  if (u.friends.includes(other.id)) return { error: 'Hai bạn đã là bạn bè rồi.' };
  u.friends.push(other.id);
  other.friends.push(u.id);
  save();
  return { ok: true, friend: cardOf(other) };
}

module.exports = {
  dayKey, refreshHearts, loseHeart, publicUser, completeLesson, claimQuest,
  shopList, buy, equip, leaderboard, friendsList, addFriend, ensureQuests, cardOf, levelInfo, effectiveStreak
};
