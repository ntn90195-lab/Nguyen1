// Ghép ngữ pháp và tạo đối tượng câu (có romaji tự động, xử lý は/へ làm trợ từ).
const { toRomaji } = require('../lib/romaji');
const list = require('./grammar1').concat(require('./grammar2'));

function sentenceRomaji(tokens) {
  return tokens.map(t => t === 'は' ? 'wa' : t === 'へ' ? 'e' : toRomaji(t)).join(' ');
}

const lessons = {};
for (const g of list) {
  lessons[g.id] = {
    id: g.id,
    title: g.title,
    explain: g.explain,
    pool: g.pool,
    items: g.sentences.map(([text, vi], i) => {
      const tokens = text.split(' ');
      return {
        key: 'gram:' + g.id + ':' + i,
        kind: 'gram',
        jp: tokens.join(''),
        tokens,
        reading: tokens.join(''),
        romaji: sentenceRomaji(tokens),
        vi,
        lesson: g.id
      };
    })
  };
}

module.exports = { lessons };
