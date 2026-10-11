// Bộ icon SVG đồng bộ phong cách Nhật (nét mực chàm, màu phẳng).
// Mọi emoji trong giao diện được tự động đổi sang icon ở đây (xem Icons.rich).
// Muốn dùng ảnh riêng: đặt ảnh vào public/img/icons/<tên>.png (hoặc .svg) và khai báo trong CUSTOM bên dưới.
(function () {
  const INK = '#2b2d5b';
  const S = 'stroke="' + INK + '" stroke-linejoin="round" stroke-linecap="round"';

  // Ảnh riêng do người dùng cung cấp: { coin: 'img/icons/coin.png', heart: 'img/icons/heart.svg' }
  const CUSTOM = {};

  // ---------- icon giao diện (viewBox 32x32) ----------
  const UI_ICONS = {
    coin: `<circle cx="16" cy="16" r="13" fill="#f6b93b" ${S} stroke-width="2.2"/>
      <circle cx="16" cy="16" r="9.6" fill="none" stroke="#c98a12" stroke-width="1.4"/>
      <rect x="12" y="12" width="8" height="8" rx="1.2" fill="#fff4d6" ${S} stroke-width="1.8"/>
      <path d="M8.5 11.5 Q10.5 7.8 14.5 7" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>`,
    heart: `<path d="M16 28 C4 20 3 11 8.6 7.6 C12 5.7 15 7.6 16 10 C17 7.6 20 5.7 23.4 7.6 C29 11 28 20 16 28 Z" fill="#ef476f" ${S} stroke-width="2.2"/>
      <path d="M8.6 11.2 Q9.6 9 12 8.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`,
    flame: `<path d="M16 3 C17 9 24 11.5 24 19.5 C24 25.2 20.4 29 16 29 C11.6 29 8 25.2 8 19.5 C8 15.5 10.4 13.4 11.6 11 C13.4 13 13.6 14.4 14.4 14.6 C15.4 11.8 14.2 7 16 3 Z" fill="#ff7a1a" ${S} stroke-width="2.2"/>
      <path d="M16 17 C17.4 19 20 20.4 20 23.4 C20 25.4 18.2 26.8 16 26.8 C13.8 26.8 12 25.4 12 23.4 C12 21 14.8 19.8 16 17 Z" fill="#ffd43b"/>`,
    star: `<path d="M16 3.5 L19.7 11.4 L28.3 12.5 L22 18.4 L23.7 27 L16 22.8 L8.3 27 L10 18.4 L3.7 12.5 L12.3 11.4 Z" fill="#ffc933" ${S} stroke-width="2.2"/>
      <path d="M12.5 11.8 L15.2 7.4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`,
    shield: `<path d="M16 3 L27 7 L27 16 C27 22 22.4 26.6 16 29.2 C9.6 26.6 5 22 5 16 L5 7 Z" fill="#5aa9e6" ${S} stroke-width="2.2"/>
      <path d="M16 3 L16 29.2 C9.6 26.6 5 22 5 16 L5 7 Z" fill="#4a97d4" opacity=".55"/>
      <path d="M16 10.5 C16.6 13 19.6 14 19.6 17.4 C19.6 19.7 18 21.2 16 21.2 C14 21.2 12.4 19.7 12.4 17.4 C12.4 15.7 13.4 14.8 13.9 13.6 C14.8 14.5 14.9 15.1 15.3 15.2 C15.7 13.8 15.2 12.2 16 10.5 Z" fill="#fff"/>`,
    charm: `<rect x="6" y="3.5" width="20" height="25" rx="3.5" fill="#e0402f" ${S} stroke-width="2.2"/>
      <rect x="6" y="3.5" width="20" height="7" rx="3.5" fill="#f2c200" ${S} stroke-width="2.2"/>
      <circle cx="16" cy="19" r="5.6" fill="#fff4d6" ${S} stroke-width="1.8"/>
      <path d="M13.6 17.2 L18.4 21 M18.4 17.2 L13.6 21" ${S} stroke-width="1.8" fill="none"/>`,
    target: `<circle cx="16" cy="16" r="12.5" fill="#fff" ${S} stroke-width="2.2"/>
      <circle cx="16" cy="16" r="8.4" fill="#ef476f" ${S} stroke-width="1.8"/>
      <circle cx="16" cy="16" r="4.2" fill="#fff" ${S} stroke-width="1.8"/>
      <circle cx="16" cy="16" r="1.5" fill="${INK}"/>`,
    bulb: `<path d="M16 3.5 C10.5 3.5 7.5 7.6 7.5 11.6 C7.5 15.2 9.6 16.8 11 19 L21 19 C22.4 16.8 24.5 15.2 24.5 11.6 C24.5 7.6 21.5 3.5 16 3.5 Z" fill="#ffd43b" ${S} stroke-width="2.2"/>
      <rect x="11.6" y="21" width="8.8" height="5" rx="2" fill="#cfd3e6" ${S} stroke-width="2"/>
      <path d="M12 10 Q13 7.6 15.4 7" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`,
    lock: `<path d="M10.5 14 L10.5 10.5 C10.5 7.4 12.8 5.5 16 5.5 C19.2 5.5 21.5 7.4 21.5 10.5 L21.5 14" fill="none" ${S} stroke-width="2.6"/>
      <rect x="6.5" y="13.5" width="19" height="14" rx="3.4" fill="#9aa0c4" ${S} stroke-width="2.2"/>
      <circle cx="16" cy="19.6" r="2.2" fill="${INK}"/><path d="M16 20 L16 23.4" ${S} stroke-width="2"/>`,
    speaker: `<path d="M5 12.5 L10.5 12.5 L17 7 L17 25 L10.5 19.5 L5 19.5 Z" fill="currentColor" ${S} stroke-width="1.6"/>
      <path d="M21 11.5 Q24 16 21 20.5 M24.6 8.5 Q29.6 16 24.6 23.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
    turtle: `<path d="M6 20 C6 12.5 11 9 16.5 9 C22 9 26.5 12.5 26.5 20 Z" fill="#7bc77b" ${S} stroke-width="2.2"/>
      <path d="M12 20 L14 12.5 M19 20 L18 12.5 M9.5 16 L24 16" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
      <path d="M26.5 17 C29 16 30.5 17.5 30 19.5 C29.6 20.4 28.4 20.4 26.5 20 Z" fill="#9ed98a" ${S} stroke-width="1.8"/>
      <rect x="9" y="20" width="5" height="4" rx="1.6" fill="#9ed98a" ${S} stroke-width="1.8"/><rect x="19" y="20" width="5" height="4" rx="1.6" fill="#9ed98a" ${S} stroke-width="1.8"/>`,
    mic: `<rect x="11.5" y="3.5" width="9" height="16" rx="4.5" fill="currentColor" ${S} stroke-width="1.6"/>
      <path d="M7.5 15 C7.5 20.2 11 23.6 16 23.6 C21 23.6 24.5 20.2 24.5 15 M16 23.6 L16 28.5 M11.5 28.5 L20.5 28.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
    cat: `<path d="M6.5 14 L6.5 4.5 L13 9.2 Q16 8.4 19 9.2 L25.5 4.5 L25.5 14 C27 16 27.4 18 27 20.4 C26.2 25.6 21.8 28.5 16 28.5 C10.2 28.5 5.8 25.6 5 20.4 C4.6 18 5 16 6.5 14 Z" fill="#fff8f0" ${S} stroke-width="2.2"/>
      <path d="M19.5 9.5 L25.5 4.5 L25.5 14 C24.6 11.6 22.4 10 19.5 9.5 Z" fill="#f5a05c"/>
      <circle cx="11.6" cy="17.6" r="1.9" fill="${INK}"/><circle cx="20.4" cy="17.6" r="1.9" fill="${INK}"/>
      <path d="M14.8 21 L17.2 21 L16 22.4 Z" fill="#f28ca0" ${S} stroke-width="1"/><path d="M16 22.4 Q14.6 24.2 13.2 23.2 M16 22.4 Q17.4 24.2 18.8 23.2" fill="none" ${S} stroke-width="1.5"/>`,
    sakura: `${[0, 72, 144, 216, 288].map(a => `<path d="M16 16 C11.4 13.4 11.6 6.4 16 4.4 C20.4 6.4 20.6 13.4 16 16 Z" fill="#ffb3c7" ${S} stroke-width="1.8" transform="rotate(${a} 16 16)"/>`).join('')}
      <circle cx="16" cy="16" r="3" fill="#ffd166" ${S} stroke-width="1.6"/>`,
    bag: `<path d="M7 12 L25 12 L27 28 L5 28 Z" fill="#7bc77b" ${S} stroke-width="2.2"/>
      <path d="M11.5 12 C11.5 6.2 20.5 6.2 20.5 12" fill="none" ${S} stroke-width="2.4"/>
      <path d="M7 12 L25 12" ${S} stroke-width="2.2"/>
      <path d="M11 18 L16 22 L21 18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`,
    palette: `<path d="M16 4 C8.6 4 3.5 9.4 3.5 15.6 C3.5 22.6 9.4 27.5 15.2 27.5 C18.6 27.5 18.4 24.4 16.8 22.8 C15.2 21.2 16 19 18.6 19 L22.6 19 C26 19 28.5 17 28.5 14 C28.5 8.4 23 4 16 4 Z" fill="#ffe8c2" ${S} stroke-width="2.2"/>
      <circle cx="10" cy="13" r="2.5" fill="#ef476f"/><circle cx="15.5" cy="9" r="2.5" fill="#ffd43b"/><circle cx="22" cy="10.5" r="2.5" fill="#5aa9e6"/><circle cx="9.6" cy="19.6" r="2.5" fill="#7bc77b"/>`,
    tick: `<circle cx="16" cy="16" r="13" fill="#3aa76d" ${S} stroke-width="2.2"/><path d="M9.6 16.6 L14 21 L22.4 11.6" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
    medal1: `<path d="M9 3 L16 14 L23 3" fill="#e0402f" ${S} stroke-width="2"/><circle cx="16" cy="20.5" r="8.6" fill="#f6c343" ${S} stroke-width="2.2"/><text x="16" y="25" text-anchor="middle" font-size="12" font-weight="800" fill="${INK}" font-family="sans-serif">1</text>`,
    medal2: `<path d="M9 3 L16 14 L23 3" fill="#5aa9e6" ${S} stroke-width="2"/><circle cx="16" cy="20.5" r="8.6" fill="#dfe3ee" ${S} stroke-width="2.2"/><text x="16" y="25" text-anchor="middle" font-size="12" font-weight="800" fill="${INK}" font-family="sans-serif">2</text>`,
    medal3: `<path d="M9 3 L16 14 L23 3" fill="#7bc77b" ${S} stroke-width="2"/><circle cx="16" cy="20.5" r="8.6" fill="#e0a266" ${S} stroke-width="2.2"/><text x="16" y="25" text-anchor="middle" font-size="12" font-weight="800" fill="${INK}" font-family="sans-serif">3</text>`
  };

  // ---------- icon điều hướng: nét đơn sắc theo màu chữ (viewBox 32x32) ----------
  const L = 'fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"';
  const NAV_ICONS = {
    sprout: `<path d="M16 28 L16 14 M8 28.5 L24 28.5" ${L}/><path d="M16 15 C16 8 11 5 5 5 C5 12 9 15 16 15 Z M16 19 C16 12.5 20.5 9.5 27 9.5 C27 16 23 19 16 19 Z" ${L}/>`,
    home: `<path d="M3.5 12 Q16 8.6 28.5 12 M7 14 L25 14 M9 14 L9 25 M23 14 L23 25 M5 25.5 L27 25.5 M16 14 L16 25 M10.5 8.4 Q16 3.5 21.5 8.4" ${L}/>`,
    quest: `<path d="M9 5 L24 5 C25.6 5 26.5 6 26.5 7.5 L26.5 24 C26.5 26 25.2 27 23.5 27 L10 27 C7.8 27 6.5 25.6 6.5 23.5 L6.5 8.6" ${L}/><path d="M6.5 8.6 C6.5 6.6 7.6 5.5 9.4 5.5 M11 12 L22 12 M11 16.6 L22 16.6 M11 21 L18 21" ${L}/>`,
    shop: `<path d="M6.5 11 L25.5 11 L26.8 27 L5.2 27 Z" ${L}/><path d="M11.5 11 L11.5 8.8 C11.5 5 20.5 5 20.5 8.8 L20.5 11" ${L}/><path d="M12 17 C12 21.4 20 21.4 20 17" ${L}/>`,
    trophy: `<path d="M10 4.5 L22 4.5 L21.2 14 C20.8 17.4 18.8 19 16 19 C13.2 19 11.2 17.4 10.8 14 Z" ${L}/><path d="M10.2 7 L5.5 7 C5.5 12 7.6 14 11 14.6 M21.8 7 L26.5 7 C26.5 12 24.4 14 21 14.6 M16 19 L16 23.5 M10.5 27.5 L21.5 27.5 M12 23.5 L20 23.5 L21.5 27.5 L10.5 27.5 Z" ${L}/>`,
    chat: `<path d="M5.5 6.5 L26.5 6.5 C27.6 6.5 28.5 7.4 28.5 8.5 L28.5 19.5 C28.5 20.6 27.6 21.5 26.5 21.5 L15 21.5 L9.5 26.5 L9.5 21.5 L5.5 21.5 C4.4 21.5 3.5 20.6 3.5 19.5 L3.5 8.5 C3.5 7.4 4.4 6.5 5.5 6.5 Z" ${L}/><path d="M9.5 12 L22.5 12 M9.5 16 L17.5 16" ${L}/>`,
    friends: `<circle cx="12" cy="10.5" r="4.6" ${L}/><path d="M3.5 26 C3.5 20.5 7.2 17.8 12 17.8 C16.8 17.8 20.5 20.5 20.5 26 Z" ${L}/><path d="M21 6.4 C24.6 6.4 26.2 9 24.6 11.8 C23.8 13.2 22.5 13.8 21.4 13.9 M23.5 18.2 C27.2 18.8 29 21.6 29 26 L24.2 26" ${L}/>`,
    cat: `<path d="M6.5 13.5 L6.5 4.5 L13 9 Q16 8.2 19 9 L25.5 4.5 L25.5 13.5 C27 15.6 27.4 17.8 27 20.2 C26.2 25.4 21.8 28 16 28 C10.2 28 5.8 25.4 5 20.2 C4.6 17.8 5 15.6 6.5 13.5 Z" ${L}/><path d="M11.4 17.4 L11.4 17.8 M20.6 17.4 L20.6 17.8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M16 21.4 Q14.4 23.6 12.6 22.6 M16 21.4 Q17.6 23.6 19.4 22.6" ${L}/>`
  };

  // ---------- đồ trong cửa hàng (viewBox riêng cho từng món) ----------
  const ITEM_VB = {
    hat_straw: '42 14 116 56', hat_kabuto: '48 -4 104 82', hat_ribbon: '32 28 56 52', hat_party: '66 -8 68 80', hat_crown: '64 16 72 52',
    glasses_round: '48 82 104 36', glasses_sun: '48 84 104 32', glasses_heart: '58 84 84 34',
    outfit_kimono: '44 132 112 86', outfit_happi: '44 132 112 86', outfit_hoodie: '44 132 112 86', outfit_ninja: '44 132 112 86',
    acc_scarf: '50 134 100 60', acc_bell: '56 136 88 38', acc_fan: '118 126 70 76', acc_dango: '16 124 66 94'
  };

  const THEMES = {
    theme_sakura: ['#ffe3ec', '#e0402f', '#ffb3c7'],
    theme_matcha: ['#e3f0cf', '#5b8a2a', '#b9d98a'],
    theme_night: ['#23224a', '#ff6b5b', '#c9a4ff'],
    theme_indigo: ['#dbe7fb', '#2563c9', '#8fb3ee']
  };

  function themeIcon(id) {
    const [bg, ac, sk] = THEMES[id] || THEMES.theme_sakura;
    return `<svg class="ic gear" viewBox="0 0 32 32" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="26" height="26" rx="7" fill="${bg}" ${S} stroke-width="2.2"/>
      <rect x="7" y="8" width="18" height="5" rx="2.5" fill="${ac}"/>
      <circle cx="10" cy="21" r="3.4" fill="${sk}"/><circle cx="17.5" cy="21" r="3.4" fill="${ac}" opacity=".85"/><circle cx="24" cy="21" r="2.2" fill="${sk}"/>
    </svg>`;
  }

  function wrap(inner, vb, cls, label) {
    return `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="${vb}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'} xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }

  // Trả về chuỗi SVG (hoặc thẻ <img> nếu có ảnh riêng) của một icon giao diện.
  function svg(name, cls) {
    if (CUSTOM[name]) return `<img class="ic${cls ? ' ' + cls : ''}" src="${CUSTOM[name]}" alt="" aria-hidden="true">`;
    if (UI_ICONS[name]) return wrap(UI_ICONS[name], '0 0 32 32', cls);
    if (NAV_ICONS[name]) return wrap(NAV_ICONS[name], '0 0 32 32', 'nav' + (cls ? ' ' + cls : ''));
    return '';
  }

  // Icon của món trong cửa hàng (dùng đúng hình đã vẽ trên mèo để khớp 100%).
  function item(id, cls) {
    if (CUSTOM[id]) return `<img class="ic gear${cls ? ' ' + cls : ''}" src="${CUSTOM[id]}" alt="" aria-hidden="true">`;
    if (id.startsWith('theme_')) return themeIcon(id);
    const map = { heart_1: 'heart', heart_full: 'heart', freeze: 'shield', coin_boost: 'charm' };
    if (map[id]) {
      if (id === 'heart_full') {
        return wrap(`<g transform="translate(-1.5 1.5) scale(.9)">${UI_ICONS.heart}</g><path d="M25.5 3.5 L26.8 7.2 L30.5 8.5 L26.8 9.8 L25.5 13.5 L24.2 9.8 L20.5 8.5 L24.2 7.2 Z" fill="#ffd43b" ${S} stroke-width="1.4"/>`, '0 0 32 32', 'gear' + (cls ? ' ' + cls : ''));
      }
      return wrap(UI_ICONS[map[id]], '0 0 32 32', 'gear' + (cls ? ' ' + cls : ''));
    }
    if (window.Cat && Cat.part) {
      const p = Cat.part(id);
      if (p) return wrap(p, ITEM_VB[id] || '0 0 200 220', 'gear' + (cls ? ' ' + cls : ''));
    }
    return '';
  }

  // Các emoji được tự động đổi thành icon.
  const EMOJI = {
    '🪙': 'coin', '❤️': 'heart', '❤': 'heart', '🔥': 'flame', '⭐': 'star', '🛡️': 'shield', '🛡': 'shield', '🧧': 'charm',
    '🎯': 'target', '💡': 'bulb', '🔒': 'lock', '🔊': 'speaker', '🐢': 'turtle', '🎤': 'mic', '🐱': 'cat',
    '🏯': 'home', '📜': 'quest', '🛍️': 'shop', '🛍': 'shop', '🏆': 'trophy', '🥇': 'medal1', '🥈': 'medal2', '🥉': 'medal3',
    '💰': 'coin', '🎒': 'bag', '🎨': 'palette', '🌸': 'sakura'
  };
  const ITEM_EMOJI = { '👒': 'hat_straw', '👘': 'outfit_kimono', '🕶️': 'glasses_sun', '🕶': 'glasses_sun', '🔔': 'acc_bell' };
  const ALL = Object.assign({}, EMOJI, ITEM_EMOJI);
  const KEYS = Object.keys(ALL).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const RE = new RegExp('(' + KEYS.join('|') + ')', 'g');
  const TEST = new RegExp(KEYS.join('|'));

  function node(name) {
    const tpl = document.createElement('template');
    tpl.innerHTML = ITEM_EMOJI_NAMES.has(name) ? item(name) : svg(name);
    return tpl.content.firstElementChild || document.createTextNode('');
  }
  const ITEM_EMOJI_NAMES = new Set(Object.values(ITEM_EMOJI));

  // Đổi một chuỗi có emoji thành danh sách nút (chữ + icon). Trả về null nếu không có emoji.
  function rich(str) {
    str = String(str);
    if (!TEST.test(str)) return null;
    const out = [];
    str.split(RE).forEach(part => {
      if (!part) return;
      if (ALL[part]) out.push(node(ALL[part])); else out.push(document.createTextNode(part));
    });
    return out;
  }

  function nav(name) { return wrap(NAV_ICONS[name] || '', '0 0 32 32', 'nav'); }

  window.Icons = { svg, item, nav, rich, CUSTOM };
})();
