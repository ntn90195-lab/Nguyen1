// Lộ trình học: các chương (unit) và bài học theo thứ tự cho người mới bắt đầu.
// Bài đầu luôn mở; hoàn thành bài trước thì mở bài kế tiếp.
const kana = require('./kana');
const vocab = require('./vocab');
const kanji = require('./kanji');
const grammar = require('./grammar');

// ---------------- Lộ trình (chỉnh ở đây nếu muốn thay đổi thứ tự) ----------------
const UNIT_DEFS = [
  { id: 'u1', title: 'Chương 1 · Hiragana', desc: 'Bảng chữ cái cơ bản của tiếng Nhật', icon: 'あ', color: '#d6336c', lessons: [
    'hira:a,ka', 'hira:sa,ta', 'hira:na,ha', 'hira:ma,ya', 'hira:ra,wa', 'review:hira-basic',
    'hira:ga,za', 'hira:da,ba,pa', 'hira:kya,sha,cha,nya,hya', 'hira:mya,rya,gya,ja,bya,pya', 'review:unit'
  ]},
  { id: 'u2', title: 'Chương 2 · Katakana', desc: 'Chữ cái dùng cho từ mượn nước ngoài', icon: 'ア', color: '#e8590c', lessons: [
    'kata:a,ka', 'kata:sa,ta', 'kata:na,ha', 'kata:ma,ya', 'kata:ra,wa', 'review:kata-basic',
    'kata:ga,za', 'kata:da,ba,pa', 'kata:kya,sha,cha,nya,hya', 'kata:mya,rya,gya,ja,bya,pya', 'review:unit'
  ]},
  { id: 'u3', title: 'Chương 3 · Chào hỏi và số đếm', desc: 'Những câu đầu tiên và số 1–10', icon: '挨', color: '#1c7ed6', lessons: [
    'vocab:greetings', 'vocab:numbers', 'kanji:kNum1', 'kanji:kNum2', 'review:unit'
  ]},
  { id: 'u4', title: 'Chương 4 · Giới thiệu bản thân', desc: 'Người, nghề nghiệp, quốc gia', icon: '私', color: '#2f9e44', lessons: [
    'vocab:people', 'vocab:jobs', 'gram:desu', 'gram:ka_mo', 'gram:no', 'kanji:kPeople', 'kanji:kSchool', 'review:unit'
  ]},
  { id: 'u5', title: 'Chương 5 · Đồ vật và địa điểm', desc: 'Cái này, cái đó, ở đâu?', icon: '物', color: '#9c36b5', lessons: [
    'vocab:things', 'gram:kore', 'vocab:places', 'vocab:position', 'gram:koko', 'vocab:questions', 'kanji:kPlace', 'review:unit'
  ]},
  { id: 'u6', title: 'Chương 6 · Thời gian và tiền', desc: 'Giờ giấc, ngày tháng, giá cả', icon: '時', color: '#b07d00', lessons: [
    'vocab:timeofday', 'vocab:hours', 'gram:jikan', 'vocab:weekdays', 'kanji:kDays', 'vocab:longtime',
    'kanji:kTime', 'vocab:bignumbers', 'kanji:kMoney', 'review:unit'
  ]},
  { id: 'u7', title: 'Chương 7 · Hành động hằng ngày', desc: 'Động từ, đi đâu, bằng gì', icon: '動', color: '#0c8599', lessons: [
    'vocab:verbs1', 'gram:masu_wo', 'vocab:verbs2', 'gram:ni_e', 'vocab:transport', 'gram:de_to',
    'kanji:kVerbs1', 'kanji:kVerbs2', 'review:unit'
  ]},
  { id: 'u8', title: 'Chương 8 · Miêu tả và quá khứ', desc: 'Tính từ, màu sắc, chuyện hôm qua', icon: '色', color: '#c92a2a', lessons: [
    'vocab:adjI', 'vocab:adjNa', 'gram:keiyoushi', 'vocab:colors', 'kanji:kSize', 'kanji:kColor', 'gram:kako', 'review:unit'
  ]},
  { id: 'u9', title: 'Chương 9 · Cuộc sống và sở thích', desc: 'Ăn uống, thiên nhiên, muốn gì, thích gì', icon: '好', color: '#5f3dc4', lessons: [
    'vocab:food', 'vocab:body', 'kanji:kBody', 'vocab:nature', 'kanji:kNature', 'gram:aru_iru', 'kanji:kPos',
    'vocab:hobby', 'gram:suki', 'gram:tai', 'gram:kudasai', 'review:unit'
  ]}
];

// ---------------- Dựng bài học ----------------
const ROW_LABEL_SUFFIX = { basic: '行', dakuten: '行', yoon: '' };

function findKanaRows(script, rowNames) {
  const tables = kana[script];
  const items = [], labels = [];
  for (const r of rowNames) {
    let found = false;
    for (const t of ['basic', 'dakuten', 'yoon']) {
      if (tables[t][r]) {
        items.push(...tables[t][r]);
        labels.push(tables[t][r][0].jp + ROW_LABEL_SUFFIX[t]);
        found = true; break;
      }
    }
    if (!found) throw new Error('Không có hàng kana: ' + r);
  }
  return { items, labels };
}

function chunk(items, max) {
  const n = Math.ceil(items.length / max);
  const size = Math.ceil(items.length / n);
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// Đọc một mô tả bài ("vocab:food", "kanji:kNum1"...) thành danh sách bài (có thể chia nhỏ nếu nhiều mục).
function parseSpec(spec) {
  const [kind, arg] = spec.split(':');
  const specs = [];
  if (kind === 'hira' || kind === 'kata') {
    const script = kind === 'hira' ? 'hira' : 'kata';
    const { items, labels } = findKanaRows(script, arg.split(','));
    specs.push({ id: kind + '_' + arg.replace(/,/g, '_'), type: 'kana',
                 title: (script === 'hira' ? 'Hiragana ' : 'Katakana ') + labels.join('・'), teach: items });
  } else if (kind === 'vocab') {
    const g = vocab.groups[arg];
    if (!g) throw new Error('Không có nhóm từ vựng: ' + arg);
    const parts = chunk(g.items, 7);
    parts.forEach((p, i) => specs.push({
      id: 'v_' + arg + (parts.length > 1 ? '_' + (i + 1) : ''), type: 'vocab',
      title: 'Từ vựng: ' + g.title + (parts.length > 1 ? ' (' + (i + 1) + '/' + parts.length + ')' : ''), teach: p
    }));
  } else if (kind === 'kanji') {
    const g = kanji.groups[arg];
    if (!g) throw new Error('Không có nhóm kanji: ' + arg);
    const parts = chunk(g.items, 7);
    parts.forEach((p, i) => specs.push({
      id: 'k_' + arg + (parts.length > 1 ? '_' + (i + 1) : ''), type: 'kanji',
      title: g.title + (parts.length > 1 ? ' (' + (i + 1) + '/' + parts.length + ')' : ''), teach: p
    }));
  } else if (kind === 'gram') {
    const g = grammar.lessons[arg];
    if (!g) throw new Error('Không có bài ngữ pháp: ' + arg);
    specs.push({ id: 'g_' + arg, type: 'gram', title: 'Ngữ pháp: ' + g.title, teach: g.items, grammar: g });
  } else throw new Error('Loại bài không hợp lệ: ' + spec);
  return specs;
}

const units = [];
const lessons = {};
const order = [];
const allItems = {};             // key -> item
const itemsByKind = { kana: [], vocab: [], kanji: [], gram: [] };

function register(items) {
  for (const it of items) {
    if (!allItems[it.key]) { allItems[it.key] = it; itemsByKind[it.kind].push(it); }
  }
}

for (const ud of UNIT_DEFS) {
  const unit = { id: ud.id, title: ud.title, desc: ud.desc, icon: ud.icon, color: ud.color, lessons: [] };
  const unitItems = [];
  const specs = [];

  for (const spec of ud.lessons) {
    const [kind, arg] = spec.split(':');
    if (kind === 'review') specs.push({ id: null, type: 'review', arg, title: 'Ôn tập', teach: [] });
    else specs.push(...parseSpec(spec));
  }

  let reviewCount = 0;
  const seenKana = { hira: [], kata: [] };
  for (const s of specs) {
    if (s.type !== 'review') {
      register(s.teach);
      unitItems.push(...s.teach);
    }
  }
  let pastInUnit = [];
  for (const s of specs) {
    let id = s.id;
    if (s.type === 'review') {
      reviewCount++;
      id = s.arg === 'unit' ? 'r_' + ud.id : 'r_' + s.arg;
      if (s.arg === 'hira-basic') s.pool = Object.values(kana.hira.basic).flat();
      else if (s.arg === 'kata-basic') s.pool = Object.values(kana.kata.basic).flat();
      else s.pool = pastInUnit.slice();
      s.title = s.arg === 'unit' ? 'Ôn tập chương' : 'Ôn tập chữ cái cơ bản';
      register(s.pool);
    }
    const lesson = {
      id, unitId: ud.id, type: s.type, title: s.title,
      teach: s.teach, grammar: s.grammar || null, pool: s.pool || null,
      icon: { kana: 'あ', vocab: '語', kanji: '字', gram: '文', review: '★' }[s.type]
    };
    if (lessons[id]) throw new Error('Trùng id bài học: ' + id);
    lessons[id] = lesson;
    unit.lessons.push(id);
    order.push(id);
    if (s.type !== 'review') pastInUnit.push(...s.teach);
  }
  units.push(unit);
}

// ---------------- Bài đặc biệt (bài ẩn / bài mua) ----------------
const bonusPacks = [];
const ICONS = { kana: 'あ', vocab: '語', kanji: '字', gram: '文', review: '★' };
for (const def of require('./bonus')) {
  const pack = { ...def, lessons: [] };
  for (const spec of def.specs) {
    for (const s of parseSpec(spec)) {
      if (lessons[s.id]) throw new Error('Trùng id bài học: ' + s.id);
      register(s.teach);
      lessons[s.id] = { id: s.id, unitId: 'bonus', pack: def.id, type: s.type, title: s.title, teach: s.teach,
                        grammar: s.grammar || null, pool: null, icon: ICONS[s.type] };
      pack.lessons.push(s.id);
    }
  }
  bonusPacks.push(pack);
}
const packById = Object.fromEntries(bonusPacks.map(p => [p.id, p]));

// ---------------- API ----------------
function findLesson(id) { return lessons[id] || null; }

function publicLesson(l) {
  return { id: l.id, unitId: l.unitId, type: l.type, title: l.title, icon: l.icon, count: l.teach.length };
}
function publicUnits() {
  return units.map(u => ({
    id: u.id, title: u.title, desc: u.desc, icon: u.icon, color: u.color,
    lessons: u.lessons.map(id => publicLesson(lessons[id]))
  }));
}

module.exports = { bonusPacks, packById, units, lessons, order, allItems, itemsByKind, findLesson, publicLesson, publicUnits };
