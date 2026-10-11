// Tạo dữ liệu thứ tự nét từ KanjiVG (https://kanjivg.tagaini.net, giấy phép CC BY-SA 3.0).
// Cách dùng: node tools/build-strokes.js <thư mục chứa các file .svg của KanjiVG>
// Kết quả: public/data/strokes-kana.json và public/data/strokes-kanji.json  { "あ": ["M..", "M..", ".."], ... }
const fs = require('fs');
const path = require('path');
const curriculum = require('../content/curriculum');

const dir = process.argv[2];
if (!dir) { console.error('Thiếu đường dẫn thư mục KanjiVG'); process.exit(1); }

const kana = new Set(), kanji = new Set();
for (const it of Object.values(curriculum.allItems)) {
  if (it.kind === 'kana' && Array.from(it.jp).length === 1) kana.add(it.jp);
  if (it.kind === 'kanji') kanji.add(it.jp);
}
for (const ch of 'ゃゅょっぁぃぅぇぉゎャュョッ') kana.add(ch);

const round = d => d.replace(/-?\d+\.?\d*/g, n => String(Math.round(parseFloat(n) * 10) / 10));
function strokesOf(ch) {
  const file = path.join(dir, ch.codePointAt(0).toString(16).padStart(5, '0') + '.svg');
  if (!fs.existsSync(file)) return null;
  const svg = fs.readFileSync(file, 'utf8');
  const out = [];
  const re = /<path [^>]*?\bd="([^"]+)"/g;
  let m;
  while ((m = re.exec(svg))) out.push(round(m[1]));
  return out;
}
function build(set, name) {
  const data = {}, missing = [];
  for (const ch of [...set].sort()) { const s = strokesOf(ch); if (s && s.length) data[ch] = s; else missing.push(ch); }
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'data', name), JSON.stringify(data));
  console.log(name + ':', Object.keys(data).length, 'chữ', missing.length ? '· thiếu: ' + missing.join('') : '');
}
build(kana, 'strokes-kana.json');
build(kanji, 'strokes-kanji.json');
