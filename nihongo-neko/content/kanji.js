// Ghép các nhóm Kanji và tạo đối tượng chữ Hán.
const { toRomaji } = require('../lib/romaji');
const raw = Object.assign({}, require('./kanji1'), require('./kanji2'));

const groups = {};
for (const [gid, g] of Object.entries(raw)) {
  groups[gid] = {
    id: gid,
    title: g.title,
    items: g.items.map(([ch, on, kun, vi, words]) => ({
      key: 'kanji:' + ch,
      kind: 'kanji',
      jp: ch,
      on, kun,
      // dòng hiển thị cách đọc
      reading: [on && 'On: ' + on, kun && 'Kun: ' + kun].filter(Boolean).join('   '),
      vi,
      words: words.map(([jp, reading, wvi]) => ({ jp, reading, romaji: toRomaji(reading), vi: wvi })),
      group: gid
    }))
  };
}

module.exports = { groups };
