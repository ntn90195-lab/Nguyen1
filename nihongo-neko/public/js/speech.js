// Phát âm tiếng Nhật (speechSynthesis) và nhận giọng nói (SpeechRecognition).
// Chất lượng giọng đọc phụ thuộc vào trình duyệt/thiết bị. Chrome và Edge thường cho kết quả tốt nhất.
(function () {
  const synth = window.speechSynthesis || null;
  let voice = null;
  let enabled = true;

  function pickVoice() {
    if (!synth) return;
    const voices = synth.getVoices();
    const ja = voices.filter(v => /^ja[-_]?/i.test(v.lang));
    // ưu tiên giọng chất lượng cao (Google / Microsoft / Kyoko / Otoya)
    voice = ja.find(v => /google|natural|online/i.test(v.name)) ||
            ja.find(v => /kyoko|otoya|nanami|haruka|sayaka/i.test(v.name)) ||
            ja[0] || null;
  }
  if (synth) {
    pickVoice();
    if (typeof synth.onvoiceschanged !== 'undefined') synth.onvoiceschanged = pickVoice;
  }

  function speak(text, opts) {
    if (!synth || !enabled || !text) return false;
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = 'ja-JP';
      u.rate = (opts && opts.rate) || 0.85;
      u.pitch = 1.05;
      if (voice) u.voice = voice;
      synth.speak(u);
      return true;
    } catch (e) { return false; }
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  // Nghe một lần; trả về Promise<{ok, texts[], error}>
  function listen() {
    return new Promise(resolve => {
      if (!SR) return resolve({ ok: false, error: 'unsupported', texts: [] });
      let done = false;
      const rec = new SR();
      rec.lang = 'ja-JP';
      rec.interimResults = false;
      rec.maxAlternatives = 5;
      const finish = r => { if (!done) { done = true; try { rec.stop(); } catch (_) {} resolve(r); } };
      rec.onresult = e => {
        const texts = [];
        for (const res of e.results) for (let i = 0; i < res.length; i++) texts.push(res[i].transcript);
        finish({ ok: true, texts });
      };
      rec.onerror = e => finish({ ok: false, error: e.error || 'error', texts: [] });
      rec.onnomatch = () => finish({ ok: true, texts: [] });
      rec.onend = () => finish({ ok: true, texts: [] });
      try { rec.start(); } catch (e) { finish({ ok: false, error: 'start-failed', texts: [] }); }
      setTimeout(() => finish({ ok: true, texts: [] }), 9000);
    });
  }

  window.Speech = {
    speak,
    listen,
    setEnabled(v) { enabled = !!v; if (!v && synth) synth.cancel(); },
    canSpeak() { return !!synth; },
    hasJapaneseVoice() { return !!voice; },
    // Có thể nghe được tiếng Nhật không? (bài "nghe chọn" chỉ dùng khi có giọng đọc)
    usable() { return !!synth && enabled && !!voice; },
    canListen() { return !!SR; }
  };
})();
