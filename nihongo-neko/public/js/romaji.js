// Chuẩn hóa romaji để so sánh đáp án gõ (giống phía máy chủ) + so khớp lời nói.
(function () {
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

  function kataToHira(s) {
    return Array.from(String(s)).map(ch => {
      const c = ch.codePointAt(0);
      return (c >= 0x30A1 && c <= 0x30F6) ? String.fromCodePoint(c - 0x60) : ch;
    }).join('');
  }

  function cleanJp(s) {
    return kataToHira(String(s)).replace(/[\s、。，．,.!?！？「」ー〜~]/g, '');
  }

  function lev(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  // độ giống nhau 0..1 giữa lời nói nhận được và câu mục tiêu
  function similarity(heard, targets) {
    const h = cleanJp(heard);
    let best = 0;
    for (const t of targets) {
      const c = cleanJp(t);
      if (!c || !h) continue;
      if (h.includes(c) || c.includes(h) && h.length >= c.length * 0.8) { best = Math.max(best, 1); continue; }
      const d = lev(h, c);
      best = Math.max(best, 1 - d / Math.max(h.length, c.length));
    }
    return best;
  }

  window.Romaji = { normalize, kataToHira, similarity };
})();
