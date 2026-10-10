// Chuyển kana (hiragana/katakana) sang romaji kiểu Hepburn, và chuẩn hóa romaji để so sánh.

const SINGLE = {
  'あ':'a','い':'i','う':'u','え':'e','お':'o',
  'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
  'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
  'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
  'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
  'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
  'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
  'や':'ya','ゆ':'yu','よ':'yo',
  'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
  'わ':'wa','を':'o','ん':'n',
  'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
  'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
  'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do',
  'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
  'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
  'ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o'
};
const DIGRAPH = {
  'きゃ':'kya','きゅ':'kyu','きょ':'kyo','しゃ':'sha','しゅ':'shu','しょ':'sho',
  'ちゃ':'cha','ちゅ':'chu','ちょ':'cho','にゃ':'nya','にゅ':'nyu','にょ':'nyo',
  'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','みゃ':'mya','みゅ':'myu','みょ':'myo',
  'りゃ':'rya','りゅ':'ryu','りょ':'ryo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
  'じゃ':'ja','じゅ':'ju','じょ':'jo','びゃ':'bya','びゅ':'byu','びょ':'byo',
  'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
  // katakana ngoại lai
  'ふぁ':'fa','ふぃ':'fi','ふぇ':'fe','ふぉ':'fo','てぃ':'ti','でぃ':'di','うぃ':'wi','うぇ':'we','うぉ':'wo',
  'しぇ':'she','じぇ':'je','ちぇ':'che'
};

function kataToHira(s) {
  return Array.from(s).map(ch => {
    const c = ch.codePointAt(0);
    return (c >= 0x30A1 && c <= 0x30F6) ? String.fromCodePoint(c - 0x60) : ch;
  }).join('');
}

function toRomaji(text) {
  const s = Array.from(kataToHira(String(text)));
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === 'っ') {
      // gấp đôi phụ âm của âm kế tiếp
      const pair = s[i + 1] && s[i + 2] ? s[i + 1] + s[i + 2] : '';
      const nxt = DIGRAPH[pair] || SINGLE[s[i + 1]] || '';
      if (nxt) out += nxt.startsWith('ch') ? 't' : nxt[0];
      continue;
    }
    if (ch === 'ー') { const m = out.match(/[aiueo]$/); if (m) out += m[0]; continue; }
    const two = s[i + 1] ? ch + s[i + 1] : '';
    if (DIGRAPH[two]) { out += DIGRAPH[two]; i++; continue; }
    if (SINGLE[ch] !== undefined) { out += SINGLE[ch]; continue; }
    out += ch; // dấu câu, chữ Hán... giữ nguyên
  }
  return out;
}

// Chuẩn hóa để chấp nhận các cách gõ khác nhau (si/shi, ti/chi, tu/tsu, hu/fu, zi/ji ...)
function normalize(s) {
  s = String(s).toLowerCase().replace(/[\s'’\-.,!?。、]/g, '');
  const rules = [
    [/sha/g, 'sya'], [/shu/g, 'syu'], [/sho/g, 'syo'], [/shi/g, 'si'],
    [/cha/g, 'tya'], [/chu/g, 'tyu'], [/cho/g, 'tyo'], [/chi/g, 'ti'],
    [/tsu/g, 'tu'], [/fu/g, 'hu'],
    [/ja/g, 'zya'], [/ju/g, 'zyu'], [/jo/g, 'zyo'], [/ji/g, 'zi'],
    [/tch/g, 'tt'], [/ā/g, 'aa'], [/ī/g, 'ii'], [/ū/g, 'uu'], [/ē/g, 'ee'], [/ō/g, 'ou']
  ];
  for (const [re, to] of rules) s = s.replace(re, to);
  return s;
}

module.exports = { toRomaji, normalize, kataToHira };
