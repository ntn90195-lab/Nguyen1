// Mèo Neko: vẽ bằng SVG, có thể mặc mũ, áo, kính, phụ kiện và đổi hình nền.
(function () {
  const INK = '#2b2d5b';
  const FUR = '#fff8f0';
  const PATCH = '#f5a05c';
  let uid = 0;

  // ---------- hình nền ----------
  const BG = {
    bg_sakura: id => `
      <defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe3ec"/><stop offset="1" stop-color="#fff6f8"/></linearGradient></defs>
      <rect width="200" height="220" rx="24" fill="url(#g${id})"/>
      <path d="M-10 30 C40 22 70 46 120 30 S190 20 215 34" fill="none" stroke="#7a4a3a" stroke-width="5" stroke-linecap="round"/>
      ${[[30,26],[56,38],[84,32],[120,28],[150,24],[178,30],[20,52],[160,46],[196,48],[70,60]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${5+(i%3)}" fill="#ffb3c7"/><circle cx="${x}" cy="${y}" r="2" fill="#ff7aa0"/>`).join('')}
      ${[[40,120],[170,100],[22,170],[182,160],[150,70]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="4" ry="2.5" fill="#ffb3c7" transform="rotate(30 ${x} ${y})"/>`).join('')}`,
    bg_fuji: id => `
      <defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3ff"/><stop offset="1" stop-color="#ffe6ee"/></linearGradient></defs>
      <rect width="200" height="220" rx="24" fill="url(#g${id})"/>
      <circle cx="150" cy="52" r="20" fill="#e0402f"/>
      <path d="M-10 190 L80 70 L170 190 Z" fill="#5b6fb0"/>
      <path d="M58 100 L80 70 L102 100 L92 96 L80 104 L68 96 Z" fill="#fff"/>
      <rect x="0" y="180" width="200" height="40" fill="#8bc7a1" opacity=".55"/>`,
    bg_night: id => `
      <defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14123a"/><stop offset="1" stop-color="#3a2a6a"/></linearGradient></defs>
      <rect width="200" height="220" rx="24" fill="url(#g${id})"/>
      ${[[50,50,'#ffd166'],[150,40,'#ff6b6b'],[110,80,'#7bdff2']].map(([x,y,c])=>
        Array.from({length:10},(_,i)=>{const a=i*Math.PI/5;return `<line x1="${x}" y1="${y}" x2="${(x+Math.cos(a)*16).toFixed(1)}" y2="${(y+Math.sin(a)*16).toFixed(1)}" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>`}).join('')+`<circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`).join('')}
      ${[[20,20],[180,90],[30,110],[176,16],[90,24]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.6" fill="#fff"/>`).join('')}
      <rect x="0" y="190" width="200" height="30" fill="#0e0c2b" opacity=".6"/>`,
    bg_torii: id => `
      <defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9b3"/><stop offset="1" stop-color="#fff2e2"/></linearGradient></defs>
      <rect width="200" height="220" rx="24" fill="url(#g${id})"/>
      <rect x="34" y="60" width="14" height="140" fill="#d6382e"/><rect x="152" y="60" width="14" height="140" fill="#d6382e"/>
      <path d="M16 54 Q100 70 184 54 L190 40 Q100 56 10 40 Z" fill="#1e1e2f"/>
      <rect x="26" y="74" width="148" height="10" fill="#d6382e"/>`
  };

  // ---------- mũ ----------
  const HAT = {
    hat_straw: `<ellipse cx="100" cy="60" rx="56" ry="12" fill="#e8c27a" stroke="${INK}" stroke-width="3"/>
      <path d="M66 60 Q100 14 134 60 Z" fill="#f2d594" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M68 54 Q100 44 132 54" fill="none" stroke="#d6382e" stroke-width="6"/>`,
    hat_kabuto: `<path d="M54 66 Q100 -2 146 66 Q100 54 54 66 Z" fill="#4b4f86" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M100 22 Q84 6 70 14 M100 22 Q116 6 130 14" fill="none" stroke="#f2a900" stroke-width="5" stroke-linecap="round"/>
      <circle cx="100" cy="40" r="6" fill="#f2a900" stroke="${INK}" stroke-width="2"/>
      <path d="M54 66 Q100 76 146 66" fill="none" stroke="#f2a900" stroke-width="4"/>`,
    hat_ribbon: `<g transform="translate(60 54) rotate(-18)"><path d="M0 0 L-22 -14 L-22 14 Z" fill="#e0402f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M0 0 L22 -14 L22 14 Z" fill="#e0402f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <circle r="6" fill="#ff7a6b" stroke="${INK}" stroke-width="3"/></g>`,
    hat_party: `<path d="M100 2 L74 64 L126 64 Z" fill="#ff8fb1" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M90 28 L110 28 M84 44 L116 44" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <circle cx="100" cy="4" r="7" fill="#ffd166" stroke="${INK}" stroke-width="3"/>`,
    hat_crown: `<path d="M68 66 L70 28 L86 46 L100 20 L114 46 L130 28 L132 66 Z" fill="#f2c200" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="100" cy="52" r="5" fill="#e0402f" stroke="${INK}" stroke-width="2"/><circle cx="84" cy="56" r="3.5" fill="#4aa8ff"/><circle cx="116" cy="56" r="3.5" fill="#4aa8ff"/>`
  };

  // ---------- kính ----------
  const GLASSES = {
    glasses_round: `<circle cx="80" cy="100" r="15" fill="rgba(255,255,255,.35)" stroke="${INK}" stroke-width="3.5"/>
      <circle cx="120" cy="100" r="15" fill="rgba(255,255,255,.35)" stroke="${INK}" stroke-width="3.5"/>
      <path d="M95 100 Q100 95 105 100 M65 100 L52 96 M135 100 L148 96" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
    glasses_sun: `<rect x="62" y="88" width="36" height="24" rx="9" fill="#1d1d2e" stroke="${INK}" stroke-width="3"/>
      <rect x="102" y="88" width="36" height="24" rx="9" fill="#1d1d2e" stroke="${INK}" stroke-width="3"/>
      <path d="M98 98 L102 98 M62 96 L52 92 M138 96 L148 92" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M68 94 L76 94 M108 94 L116 94" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>`,
    glasses_heart: `<path d="M80 114 C62 102 62 88 72 88 C77 88 80 92 80 95 C80 92 83 88 88 88 C98 88 98 102 80 114 Z" fill="#ff6f91" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M120 114 C102 102 102 88 112 88 C117 88 120 92 120 95 C120 92 123 88 128 88 C138 88 138 102 120 114 Z" fill="#ff6f91" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M92 98 L108 98" stroke="${INK}" stroke-width="3"/>`
  };

  // ---------- áo ----------
  const OUTFIT = {
    outfit_kimono: `<path d="M58 150 Q100 134 142 150 L148 198 Q100 214 52 198 Z" fill="#ff9bb5" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M86 142 L100 172 L114 142" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="54" y="170" width="92" height="16" rx="3" fill="#f2c200" stroke="${INK}" stroke-width="3"/>
      ${[[70,160],[132,162],[66,198],[136,196]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.5" fill="#fff" opacity=".9"/>`).join('')}`,
    outfit_happi: `<path d="M56 150 Q100 134 144 150 L150 198 Q100 212 50 198 Z" fill="#2d4a8a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M88 142 L96 200 M112 142 L104 200" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <text x="100" y="186" text-anchor="middle" font-size="20" font-weight="700" fill="#fff" font-family="serif">祭</text>
      <path d="M50 198 Q100 212 150 198" fill="none" stroke="#fff" stroke-width="4"/>`,
    outfit_hoodie: `<path d="M56 150 Q100 134 144 150 L148 198 Q100 212 52 198 Z" fill="#5aa9e6" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M70 146 Q100 168 130 146" fill="none" stroke="${INK}" stroke-width="3"/>
      <path d="M92 156 L92 176 M108 156 L108 176" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <path d="M70 186 Q100 176 130 186 L126 200 Q100 208 74 200 Z" fill="#4a97d4" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    outfit_ninja: `<path d="M56 150 Q100 134 144 150 L148 198 Q100 212 52 198 Z" fill="#2a2a3d" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M74 150 L126 200" stroke="#3d3d58" stroke-width="5"/>
      <rect x="54" y="176" width="92" height="9" fill="#e0402f" stroke="${INK}" stroke-width="2.5"/>`
  };
  // đồ phụ trên đầu theo áo (ninja có băng đô)
  const OUTFIT_HEAD = {
    outfit_ninja: `<path d="M46 80 Q100 62 154 80 L154 92 Q100 76 46 92 Z" fill="#2a2a3d" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="86" y="72" width="28" height="14" rx="3" fill="#cfd3e6" stroke="${INK}" stroke-width="2.5" transform="rotate(-2 100 79)"/>
      <text x="100" y="83" text-anchor="middle" font-size="10" font-weight="700" fill="${INK}" font-family="serif">忍</text>`
  };

  // ---------- phụ kiện ----------
  const ACC_NECK = {
    acc_scarf: `<path d="M60 140 Q100 162 140 140 L142 154 Q100 176 58 154 Z" fill="#d6382e" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M124 158 L132 188 L146 184 L140 154 Z" fill="#d6382e" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    acc_bell: `<path d="M64 142 Q100 160 136 142" fill="none" stroke="#d6382e" stroke-width="7" stroke-linecap="round"/>
      <circle cx="100" cy="158" r="9" fill="#f2c200" stroke="${INK}" stroke-width="3"/>
      <path d="M92 158 L108 158" stroke="${INK}" stroke-width="2.5"/><circle cx="100" cy="163" r="2" fill="${INK}"/>`
  };
  const ACC_HELD = {
    acc_fan: `<g transform="translate(152 168) rotate(18)"><path d="M0 24 L-30 -26 A40 40 0 0 1 30 -26 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="0" cy="-16" r="10" fill="#e0402f"/><path d="M-12 -30 L0 24 M12 -30 L0 24 M0 -34 L0 24" stroke="${INK}" stroke-width="1.5" opacity=".5"/></g>`,
    acc_dango: `<g transform="translate(46 168) rotate(-24)"><rect x="-2.5" y="-34" width="5" height="70" rx="2" fill="#c89a5b" stroke="${INK}" stroke-width="2"/>
      <circle cy="-24" r="11" fill="#ffb3c7" stroke="${INK}" stroke-width="3"/><circle cy="-2" r="11" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cy="20" r="11" fill="#9ed98a" stroke="${INK}" stroke-width="3"/></g>`
  };

  // ---------- khuôn mặt ----------
  function face(mood) {
    let eyes, mouth, extra = '';
    if (mood === 'happy' || mood === 'cheer') {
      eyes = `<path d="M72 104 Q80 91 88 104" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
              <path d="M112 104 Q120 91 128 104" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
      mouth = `<path d="M89 117 Q100 135 111 117 Z" fill="#c64a5e" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
               <path d="M95 126 Q100 130 105 126" fill="#ff8fa3"/>`;
    } else if (mood === 'sad') {
      eyes = `<ellipse cx="80" cy="102" rx="6.5" ry="8.5" fill="${INK}"/><ellipse cx="120" cy="102" rx="6.5" ry="8.5" fill="${INK}"/>
              <circle cx="82" cy="99" r="2.4" fill="#fff"/><circle cx="122" cy="99" r="2.4" fill="#fff"/>
              <path d="M68 88 L90 94 M132 88 L110 94" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
      mouth = `<path d="M91 124 Q100 114 109 124" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
      extra = `<path d="M86 112 Q82 120 86 124 Q90 120 86 112 Z" fill="#6ec1ff" stroke="#3a8fd6" stroke-width="1.5"/>`;
    } else {
      eyes = `<ellipse cx="80" cy="100" rx="6.5" ry="8.5" fill="${INK}"/><ellipse cx="120" cy="100" rx="6.5" ry="8.5" fill="${INK}"/>
              <circle cx="82" cy="97" r="2.4" fill="#fff"/><circle cx="122" cy="97" r="2.4" fill="#fff"/>`;
      mouth = `<path d="M100 116 Q94 124 88 119 M100 116 Q106 124 112 119" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`;
    }
    return `
      <ellipse cx="128" cy="90" rx="22" ry="20" fill="${PATCH}" opacity=".95"/>
      <ellipse cx="128" cy="90" rx="22" ry="20" fill="none"/>
      ${eyes}
      <ellipse cx="66" cy="113" rx="8" ry="5" fill="#ffb6c1" opacity=".75"/><ellipse cx="134" cy="113" rx="8" ry="5" fill="#ffb6c1" opacity=".75"/>
      <path d="M96 109 L104 109 L100 114.5 Z" fill="#f28ca0" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
      ${mouth}${extra}
      <path d="M52 106 L26 99 M52 112 L26 113 M148 106 L174 99 M148 112 L174 113" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
  }

  function svg(opts) {
    opts = opts || {};
    const eq = opts.equipped || {};
    const mood = opts.mood || 'normal';
    const id = ++uid;
    const bgFn = BG[eq.bg];
    const bg = bgFn ? bgFn(id)
      : opts.plainBg === false ? ''
      : `<rect width="200" height="220" rx="24" fill="var(--accent-soft)"/><circle cx="100" cy="120" r="84" fill="var(--paper-2)" opacity=".7"/>`;
    const outfit = OUTFIT[eq.outfit] || '';
    const outfitHead = OUTFIT_HEAD[eq.outfit] || '';
    const neck = ACC_NECK[eq.accessory] || '';
    const held = ACC_HELD[eq.accessory] || '';
    const hat = HAT[eq.hat] || '';
    const glasses = GLASSES[eq.glasses] || '';
    const cls = 'cat' + (opts.className ? ' ' + opts.className : '') + ' mood-' + mood;
    const label = opts.label || 'Mèo Neko';
    return `<svg class="${cls}" viewBox="0 0 200 220" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">
      ${bg}
      <g class="cat-body">
        <g class="cat-tail"><path d="M146 184 C190 184 196 130 170 112" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>
          <path d="M146 184 C190 184 196 130 170 112" fill="none" stroke="${PATCH}" stroke-width="13" stroke-linecap="round"/></g>
        <ellipse cx="100" cy="172" rx="47" ry="37" fill="${FUR}" stroke="${INK}" stroke-width="3"/>
        <ellipse cx="78" cy="206" rx="17" ry="9" fill="${FUR}" stroke="${INK}" stroke-width="3"/>
        <ellipse cx="122" cy="206" rx="17" ry="9" fill="${FUR}" stroke="${INK}" stroke-width="3"/>
        ${outfit}${neck}
        <path d="M50 80 L46 32 L88 58 Z" fill="${FUR}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M150 80 L154 32 L112 58 Z" fill="${PATCH}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M55 70 L52 44 L76 58 Z" fill="#ffc2cf"/><path d="M145 70 L148 44 L124 58 Z" fill="#ffc2cf"/>
        <ellipse cx="100" cy="100" rx="56" ry="46" fill="${FUR}" stroke="${INK}" stroke-width="3"/>
        ${face(mood)}
        ${outfitHead}${glasses}${hat}${held}
      </g>
    </svg>`;
  }

  // Trả về phần hình vẽ của một món đồ (dùng làm icon trong cửa hàng).
  function part(id) {
    if (HAT[id]) return HAT[id];
    if (GLASSES[id]) return GLASSES[id];
    if (OUTFIT[id]) return OUTFIT[id];
    if (ACC_NECK[id]) return ACC_NECK[id];
    if (ACC_HELD[id]) return ACC_HELD[id];
    if (BG[id]) return BG[id]('i' + (++uid));
    return '';
  }

  window.Cat = { svg, part };
})();
