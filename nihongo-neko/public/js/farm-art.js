// Hình vẽ SVG cho vườn: cây theo giai đoạn, thú cưng, nước, thức ăn.
(function () {
  const INK = '#2b2d5b';
  const S = `stroke="${INK}" stroke-linejoin="round" stroke-linecap="round"`;
  const svg = (inner, cls, vb) => `<svg class="fa ${cls || ''}" viewBox="${vb || '0 0 100 100'}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  // ---------- đất + cây ----------
  const SOIL = `<ellipse cx="50" cy="86" rx="42" ry="11" fill="#8a5a36" ${S} stroke-width="2.4"/>
    <ellipse cx="50" cy="82" rx="35" ry="8" fill="#b98557"/>
    <circle cx="30" cy="83" r="1.6" fill="#8a5a36"/><circle cx="68" cy="84" r="1.6" fill="#8a5a36"/><circle cx="55" cy="87" r="1.4" fill="#8a5a36"/>`;
  const leaf = (x, y, rot, c) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="4.6" fill="${c || '#5fbf5f'}" ${S} stroke-width="2" transform="rotate(${rot} ${x} ${y})"/>`;

  function plantBody(crop, stage) {
    if (stage === 0) return `<ellipse cx="50" cy="77" rx="6" ry="4" fill="#e8c27a" ${S} stroke-width="2"/><path d="M50 74 L50 70" ${S} stroke-width="2.4" fill="none"/>`;
    if (stage === 1) return `<path d="M50 80 L50 60" ${S} stroke-width="3" fill="none"/>${leaf(42, 62, -30)}${leaf(58, 60, 30)}`;
    if (stage === 2) {
      const stem = `<path d="M50 80 L50 40" ${S} stroke-width="3.2" fill="none"/>`;
      if (crop === 'carrot') return stem + leaf(40, 52, -35) + leaf(60, 50, 35) + leaf(42, 40, -50) + leaf(58, 38, 50) + leaf(50, 30, -90);
      if (crop === 'tomato') return stem + leaf(38, 58, -30) + leaf(62, 56, 30) + leaf(40, 44, -40) + leaf(60, 42, 40) + `<circle cx="42" cy="66" r="5" fill="#8fd16a" ${S} stroke-width="2"/><circle cx="60" cy="64" r="4.4" fill="#8fd16a" ${S} stroke-width="2"/>`;
      return stem + leaf(40, 56, -35) + leaf(60, 54, 35) + `<circle cx="42" cy="38" r="5" fill="#ffd1dc" ${S} stroke-width="2"/><circle cx="58" cy="34" r="5" fill="#ffd1dc" ${S} stroke-width="2"/><circle cx="50" cy="28" r="5.4" fill="#ffd1dc" ${S} stroke-width="2"/>`;
    }
    // chín
    if (crop === 'carrot') return leaf(38, 52, -40) + leaf(62, 50, 40) + leaf(44, 40, -60) + leaf(56, 38, 60) + leaf(50, 30, -90)
      + `<path d="M50 55 L50 68" ${S} stroke-width="3" fill="none"/>` + `<path d="M38 70 C38 64 62 64 62 70 C62 76 54 80 50 80 C46 80 38 76 38 70 Z" fill="#ff8a1f" ${S} stroke-width="2.4"/><path d="M44 71 L49 71 M52 74 L57 74" ${S} stroke-width="1.8" fill="none" opacity=".6"/>`;
    if (crop === 'tomato') return `<path d="M50 80 L50 40" ${S} stroke-width="3.2" fill="none"/>` + leaf(36, 46, -30) + leaf(64, 44, 30) + leaf(50, 32, -90)
      + [[38, 62, 9], [62, 60, 9], [50, 72, 8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ef476f" ${S} stroke-width="2.4"/><path d="M${x - 4} ${y - r + 1} L${x} ${y - r - 3} L${x + 4} ${y - r + 1}" fill="#3a9d4a" ${S} stroke-width="1.6"/><circle cx="${x - 3}" cy="${y - 2}" r="1.8" fill="#fff" opacity=".7"/>`).join('');
    return `<path d="M50 80 L50 46 M50 56 L36 44 M50 52 L64 38" ${S} stroke-width="3.2" fill="none"/>` + leaf(60, 64, 25) + leaf(40, 66, -25)
      + [[50, 34], [36, 40], [64, 32], [42, 50], [58, 48]].map(([x, y]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-5" rx="3.6" ry="5.4" fill="#ffb3c7" ${S} stroke-width="1.4" transform="rotate(${a})"/>`).join('')}<circle r="2.3" fill="#ffd166"/></g>`).join('');
  }

  function plant(crop, stage, extra) {
    return svg(SOIL + plantBody(crop, stage) + (extra || ''), 'plant');
  }
  const PEST = `<g transform="translate(66 56)"><ellipse rx="7" ry="5" fill="#7a4fd3" ${S} stroke-width="2"/><path d="M-3 -5 L-5 -9 M3 -5 L5 -9" ${S} stroke-width="1.6" fill="none"/><circle cx="-2.4" cy="-1" r="1.3" fill="#fff"/><circle cx="2.4" cy="-1" r="1.3" fill="#fff"/></g>`;
  const SPARK = [[18, 40], [80, 34], [24, 66], [78, 62]].map(([x, y], i) => `<path d="M${x} ${y - 5} L${x + 1.6} ${y - 1.6} L${x + 5} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 5} L${x - 1.6} ${y + 1.6} L${x - 5} ${y} L${x - 1.6} ${y - 1.6} Z" fill="#ffd43b" ${S} stroke-width="1.2"/>`).join('');
  function plotArt(p) {
    if (!p) return svg(SOIL, 'plant empty');
    return plant(p.crop, p.stage, (p.pest ? PEST : '') + (p.fertilized && !p.ready ? SPARK : ''));
  }

  // ---------- thú cưng ----------
  function face(mood, y) {
    const eyes = mood === 'happy'
      ? `<path d="M36 ${y} Q40 ${y - 6} 44 ${y}" ${S} stroke-width="2.6" fill="none"/><path d="M56 ${y} Q60 ${y - 6} 64 ${y}" ${S} stroke-width="2.6" fill="none"/>`
      : `<circle cx="40" cy="${y}" r="3.4" fill="${INK}"/><circle cx="60" cy="${y}" r="3.4" fill="${INK}"/><circle cx="41.2" cy="${y - 1.2}" r="1.1" fill="#fff"/><circle cx="61.2" cy="${y - 1.2}" r="1.1" fill="#fff"/>`;
    const extra = mood === 'thirsty' ? `<path d="M66 ${y + 6} C69 ${y + 11} 69 ${y + 14} 66 ${y + 15} C63 ${y + 14} 63 ${y + 11} 66 ${y + 6} Z" fill="#6cc4ff" ${S} stroke-width="1.6"/>`
      : mood === 'hungry' ? `<path d="M30 ${y - 12} L34 ${y - 8} M70 ${y - 12} L66 ${y - 8}" ${S} stroke-width="2" fill="none"/>` : '';
    return eyes + extra;
  }
  const mouth = (mood, y) => mood === 'happy' ? `<path d="M44 ${y} Q50 ${y + 7} 56 ${y}" ${S} stroke-width="2.2" fill="#ff8aa0"/>`
    : (mood === 'hungry' || mood === 'thirsty') ? `<path d="M45 ${y + 4} Q50 ${y - 2} 55 ${y + 4}" ${S} stroke-width="2.2" fill="none"/>`
    : `<path d="M45 ${y} Q50 ${y + 4} 55 ${y}" ${S} stroke-width="2.2" fill="none"/>`;

  function pet(kind, mood) {
    mood = mood || 'ok';
    if (kind === 'rabbit') return svg(`
      <ellipse cx="50" cy="86" rx="24" ry="12" fill="#fff" ${S} stroke-width="2.4"/>
      <ellipse cx="38" cy="26" rx="8" ry="22" fill="#fff" ${S} stroke-width="2.4" transform="rotate(-8 38 26)"/><ellipse cx="38" cy="28" rx="3.6" ry="14" fill="#ffc2d1" transform="rotate(-8 38 28)"/>
      <ellipse cx="62" cy="26" rx="8" ry="22" fill="#fff" ${S} stroke-width="2.4" transform="rotate(8 62 26)"/><ellipse cx="62" cy="28" rx="3.6" ry="14" fill="#ffc2d1" transform="rotate(8 62 28)"/>
      <circle cx="50" cy="58" r="27" fill="#fff" ${S} stroke-width="2.4"/>
      <circle cx="33" cy="64" r="5" fill="#ffd1dc" opacity=".8"/><circle cx="67" cy="64" r="5" fill="#ffd1dc" opacity=".8"/>
      ${face(mood, 56)}<path d="M47 63 L53 63 L50 67 Z" fill="#ff7a96" ${S} stroke-width="1.4"/>${mouth(mood, 69)}`, 'pet');
    if (kind === 'chick') return svg(`
      <ellipse cx="50" cy="60" rx="32" ry="30" fill="#ffd84d" ${S} stroke-width="2.4"/>
      <path d="M46 31 Q44 22 40 24 M50 31 Q50 20 50 20 M54 31 Q56 22 60 24" ${S} stroke-width="2.4" fill="none"/>
      <path d="M20 62 Q10 56 14 72 Q22 70 24 66 Z" fill="#ffc22e" ${S} stroke-width="2"/><path d="M80 62 Q90 56 86 72 Q78 70 76 66 Z" fill="#ffc22e" ${S} stroke-width="2"/>
      <circle cx="32" cy="64" r="5" fill="#ffab5e" opacity=".7"/><circle cx="68" cy="64" r="5" fill="#ffab5e" opacity=".7"/>
      ${face(mood, 54)}<path d="M44 62 L56 62 L50 69 Z" fill="#ff8a1f" ${S} stroke-width="2"/>
      <path d="M42 90 L42 96 M58 90 L58 96" ${S} stroke-width="3" fill="none"/>`, 'pet');
    // shiba
    return svg(`
      <ellipse cx="50" cy="88" rx="24" ry="11" fill="#f2a65a" ${S} stroke-width="2.4"/>
      <path d="M22 44 L20 16 L42 30 Z" fill="#f2a65a" ${S} stroke-width="2.4"/><path d="M78 44 L80 16 L58 30 Z" fill="#f2a65a" ${S} stroke-width="2.4"/>
      <path d="M25 38 L24 24 L35 31 Z" fill="#ffd1dc"/><path d="M75 38 L76 24 L65 31 Z" fill="#ffd1dc"/>
      <circle cx="50" cy="58" r="30" fill="#f2a65a" ${S} stroke-width="2.4"/>
      <path d="M26 62 C26 78 74 78 74 62 C68 70 32 70 26 62 Z" fill="#fff4e0"/><ellipse cx="50" cy="66" rx="17" ry="12" fill="#fff4e0"/>
      <path d="M50 38 L50 46" stroke="#fff4e0" stroke-width="6" stroke-linecap="round"/>
      ${face(mood, 54)}<ellipse cx="50" cy="62" rx="4.6" ry="3.4" fill="${INK}"/>${mouth(mood, 68)}`, 'pet');
  }

  // ---------- biểu tượng nhỏ ----------
  const ICON = {
    water: svg(`<path d="M16 3.5 C21 11 26 15.5 26 20.6 C26 25.4 21.6 29 16 29 C10.4 29 6 25.4 6 20.6 C6 15.5 11 11 16 3.5 Z" fill="#6cc4ff" ${S} stroke-width="2.2"/><path d="M11 20 Q11.6 24 15 25.4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`, 'ico', '0 0 32 32'),
    food: svg(`<path d="M4 15 L28 15 C28 23.4 23 27.5 16 27.5 C9 27.5 4 23.4 4 15 Z" fill="#e0402f" ${S} stroke-width="2.2"/><path d="M8 15 C8 8 13 6 16 6 C19 6 24 8 24 15 Z" fill="#c98a50" ${S} stroke-width="2.2"/><circle cx="12" cy="11" r="1.6" fill="#8a5a36"/><circle cx="17" cy="9.4" r="1.6" fill="#8a5a36"/><circle cx="20.4" cy="12.4" r="1.6" fill="#8a5a36"/>`, 'ico', '0 0 32 32'),
    carrot: svg(`<path d="M16 9 L12 4 M16 9 L16 3 M16 9 L20 4" fill="none" stroke="#3a9d4a" stroke-width="2.6" stroke-linecap="round"/><path d="M9 11 C9 8.6 23 8.6 23 11 C23 18 18 28 16 29 C14 28 9 18 9 11 Z" fill="#ff8a1f" ${S} stroke-width="2.2"/><path d="M12 14 L15 14 M17 19 L20 19" ${S} stroke-width="1.6" fill="none" opacity=".6"/>`, 'ico', '0 0 32 32'),
    tomato: svg(`<circle cx="16" cy="18" r="11" fill="#ef476f" ${S} stroke-width="2.2"/><path d="M10 9 L16 12 L22 9 L19 13 L16 11 L13 13 Z" fill="#3a9d4a" ${S} stroke-width="1.6"/><path d="M16 8 L16 4" ${S} stroke-width="2" fill="none"/><circle cx="11.6" cy="16" r="2" fill="#fff" opacity=".7"/>`, 'ico', '0 0 32 32'),
    sakura: svg([0, 72, 144, 216, 288].map(a => `<path d="M16 16 C11.4 13.4 11.6 6.4 16 4.4 C20.4 6.4 20.6 13.4 16 16 Z" fill="#ffb3c7" ${S} stroke-width="1.8" transform="rotate(${a} 16 16)"/>`).join('') + `<circle cx="16" cy="16" r="3" fill="#ffd166" ${S} stroke-width="1.6"/>`, 'ico', '0 0 32 32'),
    bug: svg(`<ellipse cx="16" cy="18" rx="9" ry="7" fill="#7a4fd3" ${S} stroke-width="2.2"/><path d="M12 11 L9 6 M20 11 L23 6" ${S} stroke-width="2" fill="none"/><circle cx="12.4" cy="16" r="2" fill="#fff"/><circle cx="19.6" cy="16" r="2" fill="#fff"/>`, 'ico', '0 0 32 32'),
    fert: svg(`<path d="M9 9 L23 9 L26 28 L6 28 Z" fill="#b98557" ${S} stroke-width="2.2"/><path d="M11 9 C11 5 14 3 16 3 C18 3 21 5 21 9" fill="none" ${S} stroke-width="2.2"/><path d="M16 24 L16 17" fill="none" stroke="#3a9d4a" stroke-width="2.4" stroke-linecap="round"/><path d="M16 18 C16 14 13 13 10.5 13 C10.5 16.5 12.5 18 16 18 Z M16 20 C16 16.6 18.4 15 21.5 15 C21.5 18.4 19.6 20 16 20 Z" fill="#7bc77b" ${S} stroke-width="1.5"/>`, 'ico', '0 0 32 32'),
    gift: svg(`<rect x="5" y="12" width="22" height="16" rx="2.5" fill="#ef476f" ${S} stroke-width="2.2"/><rect x="3.5" y="8" width="25" height="6" rx="2" fill="#ff7a96" ${S} stroke-width="2.2"/><path d="M16 8 L16 28" ${S} stroke-width="2.2"/><path d="M16 8 C12 2 7 6 11 8 Z M16 8 C20 2 25 6 21 8 Z" fill="#ffd166" ${S} stroke-width="1.8"/>`, 'ico', '0 0 32 32'),
    sprout: svg(`<path d="M16 28 L16 14" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/><path d="M16 15 C16 8 11 5 5 5 C5 12 9 15 16 15 Z M16 19 C16 12.5 20.5 9.5 27 9.5 C27 16 23 19 16 19 Z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/><path d="M8 28.5 L24 28.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>`, 'ico', '0 0 32 32')
  };

  window.FarmArt = { plotArt, pet, icon: k => ICON[k] || '', plant, ICON };
})();
