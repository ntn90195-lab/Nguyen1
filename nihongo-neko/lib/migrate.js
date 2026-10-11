// Chuyển dữ liệu người dùng cũ khi lộ trình thay đổi (mỗi người chỉ chạy một lần).
// v1: bài chữ cái cũ gộp 2–5 hàng/bài, nay mỗi bài 1 hàng (3–5 chữ). Ai đã xong bài cũ thì các bài mới tương ứng cũng được tính xong.
const curriculum = require('../content/curriculum');
const { save } = require('./db');

const OLD_KANA = ['a_ka', 'sa_ta', 'na_ha', 'ma_ya', 'ra_wa', 'ga_za', 'da_ba_pa', 'kya_sha_cha_nya_hya', 'mya_rya_gya_ja_bya_pya'];
const rowsOf = id => id.split('_').slice(1);

function migrate(u) {
  if (u.mig >= 1) return;
  u.mig = 1;
  const done = u.completed || (u.completed = {});
  let changed = false;
  for (const script of ['hira', 'kata']) {
    const rows = new Set();
    let sample = null;
    for (const o of OLD_KANA) {
      const id = script + '_' + o;
      if (done[id]) { rowsOf(id).forEach(r => rows.add(r)); sample = sample || done[id]; delete done[id]; changed = true; }
    }
    if (!rows.size) continue;
    for (const id of curriculum.order) {
      const l = curriculum.lessons[id];
      if (l.type === 'kana' && id.startsWith(script + '_') && !done[id] && rowsOf(id).every(r => rows.has(r))) {
        done[id] = { stars: sample.stars || 1, bestScore: sample.bestScore || 0, times: 1 };
      }
    }
  }
  // các bài ôn "vừa học": xong nếu mọi bài chữ cái trước nó (kể từ lần ôn trước) đã xong
  for (const unit of curriculum.units) {
    let window = [];
    for (const id of unit.lessons) {
      const l = curriculum.lessons[id];
      if (l.type === 'review') {
        if (/_recent\d$/.test(id) && window.length && window.every(w => done[w]) && !done[id]) { done[id] = { stars: 1, bestScore: 0, times: 1 }; changed = true; }
        window = [];
      } else window.push(id);
    }
  }
  if (changed) save();
}

module.exports = { migrate };
