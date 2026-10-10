// Âm thanh hiệu ứng tạo bằng Web Audio (không cần file âm thanh).
(function () {
  let ctx = null;
  let enabled = true;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, vol) {
    const c = ac(); if (!c || !enabled) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, c.currentTime + start);
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, c.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.05);
  }

  window.Sound = {
    setEnabled(v) { enabled = !!v; },
    isEnabled() { return enabled; },
    unlock() { ac(); },
    correct() { tone(660, 0, 0.12, 'triangle'); tone(880, 0.1, 0.2, 'triangle'); },
    wrong() { tone(220, 0, 0.18, 'sawtooth', 0.1); tone(165, 0.14, 0.25, 'sawtooth', 0.1); },
    tap() { tone(520, 0, 0.05, 'sine', 0.08); },
    coin() { tone(988, 0, 0.08, 'square', 0.07); tone(1318, 0.07, 0.18, 'square', 0.07); },
    done() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.25, 'triangle', 0.14)); },
    stamp() { tone(110, 0, 0.18, 'sine', 0.3); tone(80, 0.02, 0.25, 'triangle', 0.2); },
    fail() { [392, 330, 262].forEach((f, i) => tone(f, i * 0.16, 0.3, 'triangle', 0.12)); }
  };
})();
