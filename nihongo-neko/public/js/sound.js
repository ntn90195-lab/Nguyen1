// Âm thanh hiệu ứng và nhạc nền, tạo bằng Web Audio (không cần file âm thanh).
(function () {
  let ctx = null, master = null, musicBus = null;
  let enabled = true;      // hiệu ứng
  let musicWanted = false; // nhạc nền (người dùng bật)
  let musicTimer = null, noteIdx = 4, beat = 0;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.5; musicBus.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // freq: Hz; slide: tần số cuối (tuỳ chọn) để tạo tiếng trượt
  function tone(freq, start, dur, type, vol, slide) {
    const c = ac(); if (!c || !enabled) return;
    const t0 = c.currentTime + start;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  // tiếng ồn ngắn (nước bắn, sột soạt)
  function noise(start, dur, vol, freq) {
    const c = ac(); if (!c || !enabled) return;
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1800; f.Q.value = 0.8;
    const g = c.createGain(); g.gain.value = vol || 0.12;
    s.connect(f); f.connect(g); g.connect(master);
    s.start(c.currentTime + start);
  }
  const seq = (notes, step, dur, type, vol) => notes.forEach((f, i) => tone(f, i * step, dur, type, vol));

  // ---------- nhạc nền: giọng đàn pentatonic nhẹ nhàng kiểu Nhật ----------
  const SCALE = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99, 880.0]; // D E G A B D E G A
  function pluck(freq, vol) {
    const c = ctx; if (!c) return;
    const t0 = c.currentTime;
    const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    f.type = 'lowpass'; f.frequency.setValueAtTime(2600, t0); f.frequency.exponentialRampToValueAtTime(500, t0 + 1.4);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
    o.connect(f); f.connect(g); g.connect(musicBus);
    o.start(t0); o.stop(t0 + 1.7);
  }
  function musicStep() {
    musicTimer = null;
    if (!musicWanted || !enabled || document.hidden || !ctx) { if (musicWanted) musicTimer = setTimeout(musicStep, 1500); return; }
    // đi bộ ngẫu nhiên trên thang âm
    noteIdx = Math.max(0, Math.min(SCALE.length - 1, noteIdx + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
    pluck(SCALE[noteIdx], 0.07);
    if (beat % 4 === 0) pluck(SCALE[Math.max(0, noteIdx - 4)] / 2, 0.05); // nốt trầm
    if (Math.random() < 0.3) setTimeout(() => musicWanted && pluck(SCALE[Math.min(SCALE.length - 1, noteIdx + 2)], 0.04), 260);
    beat++;
    musicTimer = setTimeout(musicStep, 1100 + Math.random() * 1300);
  }
  function startMusic() { if (musicTimer || !musicWanted || !ac()) return; musicTimer = setTimeout(musicStep, 300); }
  function stopMusic() { if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; } }

  window.Sound = {
    setEnabled(v) { enabled = !!v; if (!enabled) stopMusic(); else if (musicWanted && ctx) startMusic(); },
    isEnabled() { return enabled; },
    setMusic(v) { musicWanted = !!v; if (musicWanted) { if (ctx) startMusic(); } else stopMusic(); },
    unlock() { ac(); if (musicWanted) startMusic(); },

    // học bài
    correct() { tone(660, 0, 0.12, 'triangle'); tone(880, 0.1, 0.2, 'triangle'); },
    wrong() { tone(220, 0, 0.18, 'sawtooth', 0.1); tone(165, 0.14, 0.25, 'sawtooth', 0.1); },
    combo(n) { const b = 660 * Math.pow(1.0595, Math.min(12, n)); seq([b, b * 1.26, b * 1.5], 0.07, 0.16, 'triangle', 0.12); },
    done() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.25, 'triangle', 0.14)); },
    stamp() { tone(110, 0, 0.18, 'sine', 0.3); tone(80, 0.02, 0.25, 'triangle', 0.2); },
    fail() { [392, 330, 262].forEach((f, i) => tone(f, i * 0.16, 0.3, 'triangle', 0.12)); },
    // giao diện chung
    tap() { tone(520, 0, 0.05, 'sine', 0.08); },
    click() { tone(700, 0, 0.04, 'triangle', 0.06); },
    pop() { tone(400, 0, 0.09, 'sine', 0.1, 800); },
    good() { tone(784, 0, 0.1, 'sine', 0.07); tone(1047, 0.08, 0.14, 'sine', 0.07); },
    bad() { tone(247, 0, 0.14, 'square', 0.05); tone(196, 0.1, 0.18, 'square', 0.05); },
    coin() { tone(988, 0, 0.08, 'square', 0.07); tone(1318, 0.07, 0.18, 'square', 0.07); },
    equip() { noise(0, 0.12, 0.1, 3000); tone(600, 0.02, 0.1, 'triangle', 0.08, 900); },
    levelup() { seq([523, 659, 784, 1047, 1319], 0.09, 0.3, 'triangle', 0.14); tone(1568, 0.5, 0.5, 'sine', 0.1); },
    secret() { seq([1047, 1319, 1568, 2093, 1568, 2093], 0.07, 0.25, 'sine', 0.09); noise(0, 0.5, 0.04, 6000); },
    // vườn và thú cưng
    splash() { noise(0, 0.28, 0.14, 1500); tone(500, 0.05, 0.12, 'sine', 0.08, 900); tone(650, 0.14, 0.12, 'sine', 0.07, 1100); },
    plant() { tone(130, 0, 0.12, 'sine', 0.25); noise(0, 0.1, 0.1, 500); tone(400, 0.12, 0.2, 'triangle', 0.08, 800); },
    harvest() { seq([523, 659, 784], 0.07, 0.15, 'triangle', 0.12); tone(1175, 0.24, 0.2, 'square', 0.05); },
    munch() { [0, 0.12, 0.24].forEach(t => { noise(t, 0.07, 0.14, 900); tone(180, t, 0.06, 'triangle', 0.1); }); },
    pet() { [880, 1175, 988, 1319].forEach((f, i) => tone(f, i * 0.07, 0.09, 'sine', 0.09)); },
    buzz() { tone(150, 0, 0.35, 'sawtooth', 0.07); tone(160, 0, 0.35, 'sawtooth', 0.05, 220); },
    sneak() { seq([392, 370, 349, 330], 0.12, 0.18, 'triangle', 0.08); },
    // cộng đồng
    gift() { seq([1319, 1568, 1319, 2093], 0.09, 0.2, 'sine', 0.09); },
    request() { tone(880, 0, 0.18, 'sine', 0.1); tone(660, 0.16, 0.3, 'sine', 0.1); },
    nudge() { tone(740, 0, 0.08, 'triangle', 0.1); tone(740, 0.14, 0.08, 'triangle', 0.1); },
    cheer() { seq([523, 659, 784, 1047], 0.08, 0.2, 'triangle', 0.1); }
  };

  // âm thanh bấm cho mọi nút ngoài màn hình bài học (bài học có âm thanh riêng)
  document.addEventListener('click', e => {
    const first = !ctx;
    if (first) window.Sound.unlock(); // trình duyệt chỉ cho phát sau lần chạm đầu tiên
    const el = e.target.closest && e.target.closest('button, .tab, .chip-tab, .seg-btn, .lb-row, .item, .seed, .adopt, .friend-chip');
    if (!el || el.disabled || el.closest('.lesson') || el.hasAttribute('data-nosound')) return;
    window.Sound.click();
  }, true);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && musicWanted && ctx) startMusic(); });
})();
