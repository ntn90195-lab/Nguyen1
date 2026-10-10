// Tự động tạo bài tập từ nội dung bài học.
// Các dạng bài: choice (trắc nghiệm), listen (nghe chọn), match (ghép cặp), type (gõ romaji),
// order (sắp xếp câu), blank (điền chỗ trống), speak (nói vào mic), teach/explain (thẻ học, không chấm điểm).
const curriculum = require('../content/curriculum');
const grammar = require('../content/grammar');
const { normalize } = require('./romaji');

// ---------- tiện ích ----------
const rand = n => Math.floor(Math.random() * n);
function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = rand(i + 1); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
function sample(a, n) { return shuffle(a).slice(0, n); }
function uniqBy(list, f) {
  const seen = new Set(), out = [];
  for (const x of list) { const k = f(x); if (!seen.has(k)) { seen.add(k); out.push(x); } }
  return out;
}

const sayOf = it => it.kind === 'gram' ? it.tokens.join('')
  : it.kind === 'kanji' ? (it.words[0] ? it.words[0].reading : it.jp) : it.jp;
const showJp = it => it.kind === 'gram' ? it.tokens.join(' ') : it.jp;

// các cặp trợ từ có thể thay thế nhau -> không đưa vào cùng danh sách đáp án
const INTERCHANGEABLE = { 'に': ['へ'], 'へ': ['に'], 'は': ['も', 'が'], 'も': ['は'], 'が': ['は'] };

// kana có cách đọc trùng nhau (じ/ぢ, ず/づ) -> không hỏi "chọn chữ đọc là ..."
const KANA_ALT = { 'ぢ': ['di', 'zi'], 'づ': ['du', 'zu'], 'ヂ': ['di', 'zi'], 'ヅ': ['du', 'zu'], 'を': ['o'], 'ヲ': ['o'] };
function isAmbiguousKana(it) {
  return curriculum.itemsByKind.kana.some(x => x.key !== it.key && x.script === it.script && x.romaji === it.romaji);
}

// danh sách các mục đã học tới bài hiện tại (để làm đáp án nhiễu)
const seenCache = {};
function seenFor(lesson) {
  if (lesson.type === 'review') return lesson.pool;
  if (seenCache[lesson.id]) return seenCache[lesson.id];
  const out = [];
  for (const id of curriculum.order) {
    const l = curriculum.lessons[id];
    if (l.type !== 'review') out.push(...l.teach);
    if (id === lesson.id) break;
  }
  return (seenCache[lesson.id] = out);
}

function distractors(item, seen, field, n) {
  const kindOk = x => x.kind === item.kind && x.key !== item.key && x[field] !== item[field] &&
    (item.kind !== 'kana' || x.script === item.script);
  let cands = uniqBy(seen.filter(kindOk), x => x[field]);
  if (cands.length < n) cands = uniqBy(curriculum.itemsByKind[item.kind].filter(kindOk), x => x[field]);
  return sample(cands, n);
}

function makeOptions(correct, wrongs) {
  const opts = shuffle([correct, ...wrongs]);
  return { options: opts, answer: opts.indexOf(correct) };
}

const optJp = it => ({ t: showJp(it), jp: true });
const optVi = it => ({ t: it.vi });
const optRomaji = it => ({ t: it.romaji });

function base(type, item, extra) {
  return Object.assign({ type, key: item.key, say: sayOf(item) }, extra);
}
function reveal(item) {
  return { jp: showJp(item), romaji: item.romaji, vi: item.vi, hint: item.hint || null };
}

// ---------- mẫu bài tập cho từng loại nội dung ----------
function choiceItemToVi(item, seen) {
  const wr = distractors(item, seen, 'vi', 3);
  if (wr.length < 3) return null;
  const o = makeOptions(optVi(item), wr.map(optVi));
  return base('choice', item, { prompt: item.kind === 'gram' ? 'Câu này nghĩa là gì?' : item.kind === 'kanji' ? 'Chữ Hán này nghĩa là gì?' : 'Từ này nghĩa là gì?',
    question: { jp: showJp(item), romaji: item.romaji }, ...o, reveal: reveal(item) });
}
function choiceViToItem(item, seen) {
  const wr = distractors(item, seen, 'jp', 3);
  if (wr.length < 3) return null;
  const o = makeOptions(optJp(item), wr.map(optJp));
  return base('choice', item, { prompt: 'Chọn đáp án tiếng Nhật đúng', question: { text: item.vi }, ...o, reveal: reveal(item) });
}
function listenToJp(item, seen) {
  const wr = distractors(item, seen, 'jp', 3);
  if (wr.length < 3) return null;
  const o = makeOptions(optJp(item), wr.map(optJp));
  return base('listen', item, { prompt: 'Nghe và chọn đáp án đúng', ...o, reveal: reveal(item) });
}
function listenToVi(item, seen) {
  const wr = distractors(item, seen, 'vi', 3);
  if (wr.length < 3) return null;
  const o = makeOptions(optVi(item), wr.map(optVi));
  return base('listen', item, { prompt: 'Nghe và chọn nghĩa đúng', ...o, reveal: reveal(item) });
}
function typeRomaji(item) {
  const accept = [normalize(item.romaji)];
  for (const a of KANA_ALT[item.jp] || []) accept.push(normalize(a));
  return base('type', item, {
    prompt: item.kind === 'kana' ? 'Gõ cách đọc (romaji)' : 'Gõ cách đọc bằng romaji',
    question: { jp: item.jp, text: item.kind === 'vocab' ? item.vi : null },
    accept: uniqBy(accept, x => x).filter(Boolean), reveal: reveal(item)
  });
}
function speakItem(item) {
  return base('speak', item, { prompt: 'Hãy đọc to', question: { jp: showJp(item), romaji: item.romaji, text: item.vi },
    target: sayOf(item), optional: true, reveal: reveal(item) });
}

// --- kana ---
function kanaChoiceRomaji(item, seen) {
  const wr = distractors(item, seen, 'romaji', 3);
  if (wr.length < 3) return null;
  const o = makeOptions(optRomaji(item), wr.map(optRomaji));
  return base('choice', item, { prompt: 'Chữ này đọc là gì?', question: { jp: item.jp }, ...o, reveal: reveal(item) });
}
function kanaChoiceKana(item, seen) {
  if (isAmbiguousKana(item)) return null;
  const wr = distractors(item, seen, 'jp', 5).filter(x => !isAmbiguousKana(x) || x.romaji !== item.romaji).slice(0, 3);
  if (wr.length < 3) return null;
  const o = makeOptions(optJp(item), wr.map(optJp));
  return base('choice', item, { prompt: 'Chọn chữ đọc là "' + item.romaji + '"', question: { text: item.romaji }, ...o, reveal: reveal(item) });
}
function kanaListen(item, seen) {
  if (isAmbiguousKana(item)) return null;
  return listenToJp(item, seen);
}

// --- kanji ---
function kanjiWordReading(item, seen) {
  const w = item.words[rand(item.words.length)];
  if (!w || w.jp === item.jp && w.reading === item.jp) return null;
  const pool = uniqBy([].concat(...seen.filter(x => x.kind === 'kanji' && x.key !== item.key).map(x => x.words))
    .filter(x => x.reading !== w.reading), x => x.reading);
  const wr = sample(pool, 3);
  if (wr.length < 3) return null;
  const o = makeOptions({ t: w.reading, jp: true }, wr.map(x => ({ t: x.reading, jp: true })));
  return { type: 'choice', key: item.key, say: w.reading, prompt: 'Cách đọc của chữ này là gì?',
    question: { jp: w.jp, text: w.vi }, ...o,
    reveal: { jp: w.jp, romaji: w.romaji, vi: w.vi + ' (' + w.reading + ')', hint: null } };
}
function kanjiTypeWord(item) {
  const w = item.words[rand(item.words.length)];
  if (!w) return null;
  return { type: 'type', key: item.key, say: w.reading, prompt: 'Gõ cách đọc bằng romaji',
    question: { jp: w.jp, text: w.vi }, accept: [normalize(w.romaji)],
    reveal: { jp: w.jp, romaji: w.romaji, vi: w.vi + ' (' + w.reading + ')', hint: null } };
}
function kanjiListenWord(item, seen) {
  const w = item.words[rand(item.words.length)];
  if (!w) return null;
  const pool = uniqBy([].concat(...seen.filter(x => x.kind === 'kanji' && x.key !== item.key).map(x => x.words))
    .filter(x => x.jp !== w.jp && x.reading !== w.reading), x => x.jp);
  const wr = sample(pool, 3);
  if (wr.length < 3) return null;
  const o = makeOptions({ t: w.jp, jp: true }, wr.map(x => ({ t: x.jp, jp: true })));
  return { type: 'listen', key: item.key, say: w.reading, prompt: 'Nghe và chọn chữ đúng', ...o,
    reveal: { jp: w.jp, romaji: w.romaji, vi: w.vi + ' (' + w.reading + ')', hint: null } };
}

// --- ngữ pháp ---
function gramPool(item) { const g = grammar.lessons[item.lesson]; return g ? g.pool : []; }

function gramOrder(item) {
  const extra = sample(gramPool(item).filter(t => !item.tokens.includes(t)), item.tokens.length > 4 ? 1 : 2)
    .filter(t => !(INTERCHANGEABLE[t] || []).some(x => item.tokens.includes(x)));
  const tokens = shuffle([...item.tokens, ...extra]);
  // tránh trường hợp xáo trộn ra đúng thứ tự gốc
  if (tokens.join(' ') === item.tokens.join(' ') && tokens.length > 1) tokens.reverse();
  return base('order', item, { prompt: 'Sắp xếp thành câu đúng', question: { text: item.vi },
    tokens, answerTokens: item.tokens, reveal: reveal(item) });
}
function gramBlank(item) {
  const pool = gramPool(item);
  const idxs = item.tokens.map((t, i) => pool.includes(t) ? i : -1).filter(i => i >= 0);
  if (!idxs.length) return null;
  const idx = idxs[rand(idxs.length)];
  const correct = item.tokens[idx];
  const bad = new Set([correct, ...(INTERCHANGEABLE[correct] || [])]);
  const wr = sample(pool.filter(t => !bad.has(t)), 3);
  if (wr.length < 2) return null;
  const o = makeOptions({ t: correct, jp: true }, wr.map(t => ({ t, jp: true })));
  return base('blank', item, { prompt: 'Điền vào chỗ trống', question: { text: item.vi },
    tokens: item.tokens.map((t, i) => i === idx ? null : t), ...o, reveal: reveal(item) });
}

const TEMPLATES = {
  kana:  [kanaChoiceRomaji, kanaChoiceKana, kanaListen, typeRomaji],
  vocab: [choiceItemToVi, choiceViToItem, listenToJp, typeRomaji, listenToVi],
  kanji: [choiceItemToVi, choiceViToItem, kanjiWordReading, kanjiListenWord, kanjiTypeWord],
  gram:  [gramOrder, gramBlank, choiceItemToVi, listenToVi, gramOrder]
};
const RANK = { choice: 1, listen: 2, match: 2, blank: 2, order: 3, type: 3, speak: 5 };

// ---------- ghép cặp ----------
function matchExercise(items) {
  const kind = items[0].kind;
  if (kind === 'gram' || items.length < 4) return null;
  const pick = uniqBy(sample(items, 5), x => kind === 'kana' ? x.romaji : x.vi).filter(x => kind !== 'kana' || !isAmbiguousKana(x));
  if (pick.length < 4) return null;
  const rightOf = x => kind === 'kana' ? x.romaji : x.vi;
  return { type: 'match', key: pick[0].key, keys: pick.map(x => x.key), prompt: 'Ghép các cặp tương ứng',
    pairs: pick.map(x => ({ left: x.jp, right: rightOf(x), say: sayOf(x) })),
    reveal: null };
}

// ---------- thẻ học ----------
function teachCards(lesson) {
  const cards = [];
  if (lesson.type === 'gram') {
    cards.push({ type: 'explain', title: lesson.grammar.title, lines: lesson.grammar.explain });
  }
  for (const it of lesson.teach) {
    if (it.kind === 'kana') {
      cards.push({ type: 'teach', item: { jp: it.jp, romaji: it.romaji, vi: it.vi, say: it.jp, hint: it.hint, tag: it.script } });
    } else if (it.kind === 'vocab') {
      cards.push({ type: 'teach', item: { jp: it.jp, romaji: it.romaji, vi: it.vi, say: it.jp, kanji: it.kanji } });
    } else if (it.kind === 'kanji') {
      cards.push({ type: 'teach', item: { jp: it.jp, romaji: null, vi: it.vi, say: sayOf(it), reading: it.reading, words: it.words } });
    } else {
      cards.push({ type: 'teach', item: { jp: it.tokens.join(' '), romaji: it.romaji, vi: it.vi, say: sayOf(it) } });
    }
  }
  return cards;
}

// ---------- tạo danh sách bài tập ----------
function generate(focus, seen, count, { allowSpeak } = {}) {
  const kinds = [...new Set(focus.map(x => x.kind))];
  const list = []; // {ex, round}
  const rotor = {};
  const make = (item, round) => {
    const tpls = TEMPLATES[item.kind];
    rotor[item.kind] = (rotor[item.kind] === undefined ? rand(tpls.length) : rotor[item.kind] + 1);
    for (let k = 0; k < tpls.length; k++) {
      const ex = tpls[(rotor[item.kind] + k) % tpls.length](item, seen);
      if (ex) { list.push({ ex, round }); return true; }
    }
    return false;
  };

  // vòng 1: mỗi mục ít nhất một bài
  let round = 1;
  for (const it of shuffle(focus)) make(it, round);
  // ghép cặp (cho từng loại có thể)
  for (const k of kinds) {
    const m = matchExercise(focus.filter(x => x.kind === k));
    if (m) list.push({ ex: m, round: 1.5 });
  }
  // các vòng sau cho đủ số lượng
  while (list.length < count && round < 6) {
    round++;
    for (const it of shuffle(focus)) { if (list.length >= count) break; make(it, round); }
  }

  // sắp xếp: vòng trước trước, trong vòng dễ trước khó; thêm chút ngẫu nhiên
  list.sort((a, b) => (a.round - b.round) || ((RANK[a.ex.type] + Math.random() * 1.6) - (RANK[b.ex.type] + Math.random() * 1.6)));
  let out = list.slice(0, count).map(x => x.ex);

  // tránh hai bài liên tiếp cùng dạng và cùng mục
  for (let i = 1; i < out.length; i++) {
    if (out[i].type === out[i - 1].type && out[i].key === out[i - 1].key) {
      const j = out.findIndex((e, idx) => idx > i && !(e.type === out[i - 1].type && e.key === out[i - 1].key));
      if (j > 0) [out[i], out[j]] = [out[j], out[i]];
    }
  }
  if (allowSpeak && count >= 8) {
    const cands = focus.filter(x => x.kind === 'vocab' || x.kind === 'gram');
    if (cands.length) { out = out.slice(0, count - 1); out.push(speakItem(cands[rand(cands.length)])); }
  }
  return out;
}

function buildLesson(lesson, n) {
  if (lesson.type === 'review') {
    const focus = sample(lesson.pool, Math.min(lesson.pool.length, 10));
    return generate(focus, lesson.pool, Math.max(n, 10), { allowSpeak: true });
  }
  const seen = seenFor(lesson);
  const count = Math.min(14, Math.max(n, lesson.teach.length + 2));
  const body = generate(lesson.teach, seen, count, { allowSpeak: lesson.type === 'vocab' || lesson.type === 'gram' });
  return teachCards(lesson).concat(body);
}

function buildPractice(keys, n) {
  const items = keys.map(k => curriculum.allItems[k]).filter(Boolean);
  if (!items.length) return [];
  const focus = sample(items, Math.min(items.length, 8));
  const seen = [].concat(...Object.values(curriculum.itemsByKind));
  return generate(focus, seen, Math.max(n, Math.min(14, focus.length + 2)), { allowSpeak: false });
}

module.exports = { buildLesson, buildPractice };
