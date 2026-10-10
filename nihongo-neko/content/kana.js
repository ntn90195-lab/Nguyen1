// Bảng chữ cái Hiragana và Katakana.
// Katakana được sinh tự động từ Hiragana (cách nhau đúng 0x60 trong bảng mã Unicode).

// Mỗi hàng: [tên hàng, [ [ký tự hiragana, romaji], ... ]]
const BASIC = {
  a:  [['あ','a'],['い','i'],['う','u'],['え','e'],['お','o']],
  ka: [['か','ka'],['き','ki'],['く','ku'],['け','ke'],['こ','ko']],
  sa: [['さ','sa'],['し','shi'],['す','su'],['せ','se'],['そ','so']],
  ta: [['た','ta'],['ち','chi'],['つ','tsu'],['て','te'],['と','to']],
  na: [['な','na'],['に','ni'],['ぬ','nu'],['ね','ne'],['の','no']],
  ha: [['は','ha'],['ひ','hi'],['ふ','fu'],['へ','he'],['ほ','ho']],
  ma: [['ま','ma'],['み','mi'],['む','mu'],['め','me'],['も','mo']],
  ya: [['や','ya'],['ゆ','yu'],['よ','yo']],
  ra: [['ら','ra'],['り','ri'],['る','ru'],['れ','re'],['ろ','ro']],
  wa: [['わ','wa'],['を','wo'],['ん','n']]
};

const DAKUTEN = {
  ga: [['が','ga'],['ぎ','gi'],['ぐ','gu'],['げ','ge'],['ご','go']],
  za: [['ざ','za'],['じ','ji'],['ず','zu'],['ぜ','ze'],['ぞ','zo']],
  da: [['だ','da'],['ぢ','ji'],['づ','zu'],['で','de'],['ど','do']],
  ba: [['ば','ba'],['び','bi'],['ぶ','bu'],['べ','be'],['ぼ','bo']],
  pa: [['ぱ','pa'],['ぴ','pi'],['ぷ','pu'],['ぺ','pe'],['ぽ','po']]
};

const YOON = {
  kya: [['きゃ','kya'],['きゅ','kyu'],['きょ','kyo']],
  sha: [['しゃ','sha'],['しゅ','shu'],['しょ','sho']],
  cha: [['ちゃ','cha'],['ちゅ','chu'],['ちょ','cho']],
  nya: [['にゃ','nya'],['にゅ','nyu'],['にょ','nyo']],
  hya: [['ひゃ','hya'],['ひゅ','hyu'],['ひょ','hyo']],
  mya: [['みゃ','mya'],['みゅ','myu'],['みょ','myo']],
  rya: [['りゃ','rya'],['りゅ','ryu'],['りょ','ryo']],
  gya: [['ぎゃ','gya'],['ぎゅ','gyu'],['ぎょ','gyo']],
  ja:  [['じゃ','ja'],['じゅ','ju'],['じょ','jo']],
  bya: [['びゃ','bya'],['びゅ','byu'],['びょ','byo']],
  pya: [['ぴゃ','pya'],['ぴゅ','pyu'],['ぴょ','pyo']]
};

function toKatakana(s) {
  return Array.from(s).map(ch => {
    const c = ch.codePointAt(0);
    // ぁ(3041)〜ゖ(3096) -> ァ(30A1)〜ヶ(30F6)
    return (c >= 0x3041 && c <= 0x3096) ? String.fromCodePoint(c + 0x60) : ch;
  }).join('');
}

// Gợi ý cách nhớ bằng tiếng Việt cho vài chữ dễ nhầm (hiện sau khi trả lời sai)
const HINTS = {
  'あ': 'Giống chữ "あ" có hai nét như đang ngáp: "a"',
  'い': 'Hai nét đứng như hai chiếc răng: "i"',
  'う': 'Giống số 5 nghiêng: "u"',
  'え': 'Giống con chim đang bay: "e"',
  'お': 'Giống người đang chạy, "o"',
  'し': 'Giống lưỡi câu: "shi"',
  'ん': 'Giống chữ h viết nghiêng: "n"',
  'は': 'Đọc là "ha", nhưng khi là trợ từ thì đọc "wa"',
  'へ': 'Đọc là "he", nhưng khi là trợ từ thì đọc "e"',
  'を': 'Chỉ dùng làm trợ từ, đọc là "o"',
  'さ': 'Khác "き" ở nét nối phía dưới: "sa"',
  'き': 'Giống cái chìa khóa: "ki"',
  'ぬ': 'Có vòng tròn ở cuối, khác "め": "nu"',
  'め': 'Giống con mắt: "me"',
  'ね': 'Có vòng tròn ở cuối, khác "れ": "ne"',
  'れ': 'Không có vòng tròn, khác "ね": "re"',
  'わ': 'Không có vòng tròn, khác "れ": "wa"',
  'シ': 'Katakana "shi": các nét nằm ngang, khác "ツ"',
  'ツ': 'Katakana "tsu": các nét thẳng đứng, khác "シ"',
  'ソ': 'Katakana "so": nét ngắn nằm bên trái, khác "ン"',
  'ン': 'Katakana "n": nét ngắn nằm ngang, khác "ソ"'
};

function build(table, script) {
  const out = {};
  for (const [row, list] of Object.entries(table)) {
    out[row] = list.map(([h, romaji]) => {
      const jp = script === 'kata' ? toKatakana(h) : h;
      return {
        key: 'kana:' + jp, kind: 'kana', jp, reading: jp, romaji,
        vi: 'đọc là "' + romaji + '"', hint: HINTS[jp] || null,
        script: script === 'kata' ? 'Katakana' : 'Hiragana'
      };
    });
  }
  return out;
}

module.exports = {
  hira: { basic: build(BASIC, 'hira'), dakuten: build(DAKUTEN, 'hira'), yoon: build(YOON, 'hira') },
  kata: { basic: build(BASIC, 'kata'), dakuten: build(DAKUTEN, 'kata'), yoon: build(YOON, 'kata') }
};
