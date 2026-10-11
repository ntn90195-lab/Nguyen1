// Kiểm tra: tạo bài tập cho mọi bài học nhiều lần và xác minh cấu trúc hợp lệ.
const curriculum = require('../content/curriculum');
const ex = require('../lib/exercises');

let errors = 0, total = 0;
const typeCount = {};
function bad(l, e, msg) { errors++; if (errors < 25) console.log('LỖI', l.id, e.type, msg); }

for (const id of Object.keys(curriculum.lessons)) {
  const l = curriculum.lessons[id];
  for (let rep = 0; rep < 12; rep++) {
    const list = ex.buildLesson(l, 10);
    const scored = list.filter(e => e.type !== 'teach' && e.type !== 'explain');
    if (scored.length < 6) bad(l, { type: 'lesson' }, 'quá ít bài tập: ' + scored.length);
    for (const e of list) {
      total++; typeCount[e.type] = (typeCount[e.type] || 0) + 1;
      if (e.type === 'choice' || e.type === 'listen' || e.type === 'blank') {
        if (!Array.isArray(e.options) || e.options.length < (e.prompt === 'Đúng hay sai?' ? 2 : 3)) bad(l, e, 'thiếu đáp án');
        else {
          const texts = e.options.map(o => o.t);
          if (new Set(texts).size !== texts.length) bad(l, e, 'đáp án trùng: ' + texts.join('|'));
          if (!e.options[e.answer]) bad(l, e, 'chỉ số đáp án sai');
          if (texts.some(t => !t)) bad(l, e, 'đáp án rỗng');
        }
      }
      if (e.type === 'order' && e.answerTokens.some(t => !e.tokens.includes(t))) bad(l, e, 'thiếu từ trong order');
      if (e.type === 'blank' && !e.tokens.includes(null)) bad(l, e, 'blank không có chỗ trống');
      if (e.type === 'type' && !(e.accept && e.accept.length)) bad(l, e, 'type không có đáp án');
      if (e.type === 'match') {
        const L = e.pairs.map(p => p.left), R = e.pairs.map(p => p.right);
        if (new Set(L).size !== L.length || new Set(R).size !== R.length) bad(l, e, 'match trùng');
      }
    }
  }
}
console.log('Đã kiểm tra', Object.keys(curriculum.lessons).length, 'bài học,', total, 'bài tập.');
console.log('Phân bố dạng bài:', JSON.stringify(typeCount));
console.log(errors ? ('Có ' + errors + ' lỗi') : 'Không có lỗi nào.');
process.exit(errors ? 1 : 0);
