// Hướng dẫn viết theo nét: xem hoạt hình thứ tự nét, viết theo nét mờ, tự viết từ trí nhớ.
// Dữ liệu nét lấy từ KanjiVG (https://kanjivg.tagaini.net, CC BY-SA 3.0), xem public/data/strokes-*.json.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const N_SAMPLE = 48, N_CMP = 24;
  const cache = {}, prepared = {};
  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- dữ liệu ----------
  const kindOf = ch => ch.codePointAt(0) < 0x3100 ? 'kana' : 'kanji';
  function load(kind) {
    if (!cache[kind]) cache[kind] = fetch('data/strokes-' + kind + '.json').then(r => r.ok ? r.json() : {}).catch(() => { delete cache[kind]; return {}; });
    return cache[kind];
  }
  async function get(ch) { const d = await load(kindOf(ch)); return d[ch] || null; }
  function preload(kind) { load(kind || 'kana'); }

  const svgEl = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); return e; };

  function resample(pts, n) {
    const d = [0];
    for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const L = d[d.length - 1];
    if (L < 1e-6) return Array.from({ length: n }, () => ({ x: pts[0].x, y: pts[0].y }));
    const out = []; let j = 1;
    for (let k = 0; k < n; k++) {
      const t = L * k / (n - 1);
      while (j < d.length - 1 && d[j] < t) j++;
      const f = (t - d[j - 1]) / ((d[j] - d[j - 1]) || 1);
      out.push({ x: pts[j - 1].x + (pts[j].x - pts[j - 1].x) * f, y: pts[j - 1].y + (pts[j].y - pts[j - 1].y) * f });
    }
    return out;
  }
  const pathLen = pts => pts.reduce((a, p, i) => i ? a + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0, 0);

  // đo các nét (độ dài, điểm mẫu) bằng một thẻ svg tạm
  function prepare(ch, ds) {
    if (prepared[ch]) return prepared[ch];
    const tmp = svgEl('svg', { viewBox: '0 0 109 109', width: 0, height: 0, 'aria-hidden': 'true' });
    tmp.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden';
    document.body.append(tmp);
    const out = ds.map(d => {
      const p = svgEl('path', { d }); tmp.append(p);
      const len = p.getTotalLength(), raw = [];
      for (let i = 0; i <= N_SAMPLE; i++) { const q = p.getPointAtLength(len * i / N_SAMPLE); raw.push({ x: q.x, y: q.y }); }
      return { d, len, raw, rs: resample(raw, N_CMP), start: raw[0], end: raw[raw.length - 1] };
    });
    tmp.remove();
    return (prepared[ch] = out);
  }

  // ---------- chấm một nét vẽ ----------
  function judge(drawn, st, tight) {
    const dl = pathLen(drawn);
    if (dl < 2.5 && st.len > 12) return { tap: true };            // chạm nhẹ, bỏ qua
    const rs = resample(drawn, N_CMP);
    const mean = (a, b) => a.reduce((s, p, i) => s + Math.hypot(p.x - b[i].x, p.y - b[i].y), 0) / a.length;
    const fwd = mean(rs, st.rs), rev = mean(rs, st.rs.slice().reverse());
    const tol = (tight ? 12 : 15) + Math.min(8, st.len * 0.06);
    const ratio = dl / Math.max(st.len, 1);
    const startD = Math.hypot(rs[0].x - st.start.x, rs[0].y - st.start.y);
    const endD = Math.hypot(rs[N_CMP - 1].x - st.end.x, rs[N_CMP - 1].y - st.end.y);
    const lenOk = st.len < 18 || (ratio > 0.45 && ratio < 2.2);
    if (fwd < tol && startD < tol * 1.8 && endD < tol * 2 && lenOk) return { ok: true };
    return { ok: false, reversed: rev < tol * 0.9 && fwd >= rev };
  }

  // ---------- thẻ vẽ ----------
  // mode: 'view' (chỉ xem) | 'trace' (viết theo nét mờ) | 'write' (tự viết, không có nét mờ)
  function create(ch, ds, o) {
    o = o || {};
    const strokes = prepare(ch, ds), n = strokes.length;
    const mode = o.mode || 'view';
    const svg = svgEl('svg', { viewBox: '0 0 109 109', class: 'stroke-pad ' + mode, role: 'img', 'aria-label': 'Khung viết chữ ' + ch });
    const line = { stroke: 'currentColor', 'stroke-width': 0.6, 'stroke-dasharray': '2 3', opacity: 0.25 };
    svg.append(svgEl('rect', { x: 0.5, y: 0.5, width: 108, height: 108, rx: 7, class: 'pad-bg' }),
      svgEl('line', Object.assign({ x1: 54.5, y1: 4, x2: 54.5, y2: 105 }, line)),
      svgEl('line', Object.assign({ x1: 4, y1: 54.5, x2: 105, y2: 54.5 }, line)));
    const ghost = svgEl('g', { class: 'g-ghost' }), done = svgEl('g', { class: 'g-done' }), anim = svgEl('g', { class: 'g-anim' }),
      mark = svgEl('g', { class: 'g-mark' }), user = svgEl('g', { class: 'g-user' });
    svg.append(ghost, done, anim, mark, user);
    strokes.forEach(s => ghost.append(svgEl('path', { d: s.d })));
    if (mode === 'write') ghost.style.display = 'none';

    const pad = { el: svg, idx: 0, total: n, misses: 0, assisted: false, finished: false };
    let playToken = 0, locked = false, missRun = 0, drawn = null, poly = null, hintOn = false;

    const badge = (i, cls) => {
      const g = svgEl('g', { class: 'badge ' + (cls || ''), transform: 'translate(' + strokes[i].start.x + ',' + strokes[i].start.y + ')' });
      g.append(svgEl('circle', { r: 5.2 }), Object.assign(svgEl('text', { y: 1.9, 'text-anchor': 'middle' }), { textContent: i + 1 }));
      return g;
    };

    // --- hoạt hình thứ tự nét ---
    function stopPlay() { playToken++; anim.replaceChildren(); if (mode === 'view') mark.replaceChildren(); }
    async function play(opts) {
      opts = opts || {};
      const tok = ++playToken;
      const alive = () => tok === playToken && svg.isConnected;
      const wait = ms => new Promise(r => setTimeout(r, ms));
      do {
        anim.replaceChildren(); mark.replaceChildren();
        if (reduceMotion()) {
          strokes.forEach((s, i) => { anim.append(svgEl('path', { d: s.d, class: 'ink' })); mark.append(badge(i)); });
          return;
        }
        for (let i = 0; i < n; i++) {
          if (!alive()) return;
          const s = strokes[i];
          const p = svgEl('path', { d: s.d, class: 'ink' });
          p.style.strokeDasharray = s.len + 1; p.style.strokeDashoffset = s.len + 1;
          anim.append(p); mark.append(badge(i));
          const dur = 380 + s.len * 13;
          const a = p.animate ? p.animate([{ strokeDashoffset: s.len + 1 }, { strokeDashoffset: 0 }], { duration: dur, easing: 'ease-in-out', fill: 'forwards' }) : null;
          if (!a) p.style.strokeDashoffset = 0;
          await wait(dur + 260);
        }
        if (!opts.loop) {
          if (mode !== 'view') { await wait(700); if (alive()) { anim.replaceChildren(); paintNext(); } }
          return;
        }
        await wait(1700);
      } while (opts.loop && alive());
    }

    // --- viết ---
    const clientToSvg = e => {
      const r = svg.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * 109, y: (e.clientY - r.top) / r.height * 109 };
    };
    function paintNext() {
      mark.replaceChildren();
      if (pad.finished || mode === 'view') return;
      if (mode === 'trace' || hintOn) {
        const s = strokes[pad.idx];
        const hl = svgEl('path', { d: s.d, class: 'hl' });
        mark.append(hl, badge(pad.idx, 'now'));
      }
    }
    function accept(i, assisted) {
      const p = svgEl('path', { d: strokes[i].d, class: 'ink' });
      done.append(p);
      if (p.animate && !reduceMotion()) {
        p.style.strokeDasharray = strokes[i].len + 1;
        p.animate([{ strokeDashoffset: strokes[i].len + 1 }, { strokeDashoffset: 0 }], { duration: 240, fill: 'forwards' });
      }
      if (assisted) { pad.assisted = true; p.classList.add('assist'); }
      pad.idx++; missRun = 0;
      if (o.onStroke) o.onStroke(pad.idx, n);
      if (pad.idx >= n) {
        pad.finished = true; locked = true; mark.replaceChildren(); ghost.style.opacity = 0.35;
        if (mode === 'write') ghost.style.display = 'none';
        if (o.onDone) o.onDone({ misses: pad.misses, assisted: pad.assisted });
      } else paintNext();
    }
    function flashHint(i) {
      const hl = svgEl('path', { d: strokes[i].d, class: 'hl flash' });
      mark.append(hl, badge(i, 'now'));
      setTimeout(() => { if (!pad.finished && pad.idx === i) paintNext(); }, 1600);
    }
    function miss(res) {
      pad.misses++; missRun++;
      if (o.onMiss) o.onMiss(res.reversed ? 'reverse' : 'off', missRun);
      const i = pad.idx;
      if (missRun >= (mode === 'write' ? 5 : 4)) { pad.assisted = true; accept(i, true); return; }   // giúp viết nét này
      if (missRun >= (mode === 'write' ? 3 : 2)) { pad.assisted = true; flashHint(i); }
    }
    function down(e) {
      if (mode === 'view' || locked || pad.finished) return;
      e.preventDefault();
      stopPlay();
      try { svg.setPointerCapture(e.pointerId); } catch (_) {}
      drawn = [clientToSvg(e)];
      poly = svgEl('polyline', { class: 'user-line', points: drawn[0].x + ',' + drawn[0].y });
      user.replaceChildren(poly);
    }
    function move(e) {
      if (!drawn) return;
      e.preventDefault();
      const p = clientToSvg(e), l = drawn[drawn.length - 1];
      if (Math.hypot(p.x - l.x, p.y - l.y) < 0.6) return;
      drawn.push(p);
      poly.setAttribute('points', drawn.map(q => q.x.toFixed(1) + ',' + q.y.toFixed(1)).join(' '));
    }
    function up() {
      if (!drawn) return;
      const pts = drawn, line = poly; drawn = null; poly = null;
      if (pad.finished) { user.replaceChildren(); return; }
      const res = judge(pts, strokes[pad.idx], mode === 'trace');
      if (res.tap) { user.replaceChildren(); return; }
      if (res.ok) { user.replaceChildren(); accept(pad.idx, false); }
      else {
        line.classList.add('bad');
        setTimeout(() => { if (line.parentNode) line.remove(); }, 450);
        miss(res);
      }
    }
    svg.addEventListener('pointerdown', down);
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);

    Object.assign(pad, {
      play, stopPlay,
      hint() {   // gợi ý: hiện nét mờ và nét tiếp theo
        if (mode === 'view' || pad.finished) return;
        hintOn = true; pad.assisted = true; ghost.style.display = ''; paintNext();
      },
      reset() {
        stopPlay(); done.replaceChildren(); user.replaceChildren(); mark.replaceChildren();
        pad.idx = 0; pad.misses = 0; pad.assisted = false; pad.finished = false; locked = false; missRun = 0; hintOn = false;
        ghost.style.opacity = ''; if (mode === 'write') ghost.style.display = 'none';
        paintNext();
      },
      showAll() { done.replaceChildren(); strokes.forEach(s => done.append(svgEl('path', { d: s.d, class: 'ink' }))); }
    });
    paintNext();
    return pad;
  }

  window.Strokes = { get, preload, create, prepare };
})();
