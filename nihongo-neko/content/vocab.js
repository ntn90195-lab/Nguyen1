// Ghép các nhóm từ vựng và tạo đối tượng từ (có romaji tự động).
const { toRomaji } = require('../lib/romaji');
const raw = Object.assign({}, require('./vocab1'), require('./vocab2'));

const ROMAJI_OVERRIDE = { 'こんにちは': 'konnichiwa', 'こんばんは': 'konbanwa' };

const groups = {};
for (const [gid, g] of Object.entries(raw)) {
  groups[gid] = {
    id: gid,
    title: g.title,
    items: g.items.map(([kana, vi, kanji]) => ({
      key: 'vocab:' + kana,
      kind: 'vocab',
      jp: kana,
      reading: kana,
      kanji: kanji || null,
      romaji: ROMAJI_OVERRIDE[kana] || toRomaji(kana),
      vi,
      group: gid
    }))
  };
}

module.exports = { groups };
