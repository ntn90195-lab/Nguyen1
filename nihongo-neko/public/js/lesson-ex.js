// Giao diện từng dạng bài tập. Mỗi hàm trả về "controller":
//   { ready(): bool, check(): {correct, correctText}, manual?: true }
(function () {
  const { h } = UI;

  function speakerBtn(text, slow) {
    return h('button', { class: 'speaker' + (slow ? ' slow' : ''), type: 'button', 'aria-label': slow ? 'Nghe chậm' : 'Nghe phát âm',
      onclick: e => { e.stopPropagation(); Speech.speak(text, { rate: slow ? 0.5 : 0.85 }); } }, slow ? '🐢' : '🔊');
  }

  function questionBubble(ex, api) {
    const q = ex.question || {};
    const lines = [];
    if (q.jp) {
      lines.push(h('div', { class: 'q-jp jp' + (Array.from(q.jp).length > 6 ? ' long' : '') }, q.jp));
      if (q.romaji) lines.push(h('div', { class: 'q-romaji' }, q.romaji));
    }
    if (q.text) lines.push(h('div', { class: 'q-text' + (q.jp ? ' sub' : '') }, q.text));
    const bubble = h('div', { class: 'bubble' }, h('div', { class: 'bubble-main' }, lines),
      ex.say && q.jp ? speakerBtn(ex.say) : null);
    return h('div', { class: 'q-row' }, h('div', { class: 'q-cat', html: Cat.svg({ equipped: api.equipped, mood: 'normal', plainBg: false, className: 'small' }) }), bubble);
  }

  function optionGrid(ex, ctl, api, onPick) {
    const wrap = h('div', { class: 'options' + (ex.options.some(o => o.jp) ? ' jpopts' : '') });
    const btns = ex.options.map((o, i) => {
      const b = h('button', { class: 'opt' + (o.jp ? ' jp' : ''), type: 'button', 'data-i': i,
        onclick: () => { if (ctl.locked) return; onPick(i); Sound.tap(); } },
        h('span', { class: 'opt-key' }, i + 1), h('span', { class: 'opt-text' }, o.t));
      wrap.append(b);
      return b;
    });
    ctl.btns = btns;
    return wrap;
  }

  // ---------- thẻ học ----------
  function teach(ex, body, api) {
    const it = ex.item;
    const strokeBox = it.strokes ? h('div', { class: 'teach-strokes' }) : null;
    if (strokeBox) {
      Strokes.get(it.jp).then(ds => {
        if (!ds || !strokeBox.isConnected) return;
        const pad = Strokes.create(it.jp, ds, { mode: 'view' });
        strokeBox.append(pad.el, h('div', { class: 'teach-stroke-btns' },
          h('button', { class: 'btn small ghost', type: 'button', onclick: () => pad.play({ loop: false }) }, '↺ Xem nét'),
          h('button', { class: 'btn small', type: 'button', onclick: () => writeSheet(it) }, '✍ Tập viết')));
        pad.play({ loop: false });
      });
    }
    const card = h('div', { class: 'teach-card' },
      it.tag ? h('div', { class: 'tag' }, it.tag) : null,
      h('div', { class: 'teach-jp jp' + (Array.from(it.jp).length > 6 ? ' long' : '') }, it.jp),
      strokeBox,
      it.reading ? h('div', { class: 'teach-reading' }, it.reading) : null,
      it.romaji ? h('div', { class: 'teach-romaji' }, it.romaji) : null,
      h('div', { class: 'teach-vi' }, it.vi),
      it.kanji ? h('div', { class: 'teach-kanji' }, 'Chữ Hán: ', h('span', { class: 'jp' }, it.kanji)) : null,
      it.hint ? h('div', { class: 'teach-hint' }, '💡 ' + it.hint) : null,
      it.words ? h('ul', { class: 'teach-words' }, it.words.map(w =>
        h('li', {}, h('span', { class: 'jp w-jp' }, w.jp), h('span', { class: 'w-read jp' }, w.reading), h('span', { class: 'w-vi' }, w.vi)))) : null,
      h('div', { class: 'teach-actions' }, speakerBtn(it.say), speakerBtn(it.say, true)));
    body.append(h('h2', { class: 'ex-prompt' }, 'Học mục mới'), card);
    setTimeout(() => Speech.speak(it.say), 250);
    return { ready: () => true, check: () => ({ correct: true }), info: true };
  }

  // cửa sổ tập viết tự do (dùng cho chữ Hán trong thẻ học, không tính điểm)
  function writeSheet(it) {
    let mode = 'trace', pad = null;
    const status = h('div', { class: 'pad-status' }, 'Viết theo từng nét');
    const box = h('div', { class: 'pad-box' });
    const modeBtn = h('button', { class: 'btn small ghost', type: 'button' }, 'Thử không nét mờ');
    const clearBtn = h('button', { class: 'btn small ghost', type: 'button' }, '↺ Viết lại');
    const s = UI.sheet([h('h2', {}, 'Tập viết ' + it.jp), box, status, h('div', { class: 'pad-tools' }, modeBtn, clearBtn),
      h('button', { class: 'btn block', type: 'button', onclick: () => s.close() }, 'Xong')], { noFocus: true });
    Strokes.get(it.jp).then(ds => {
      if (!ds) { status.textContent = 'Chữ này chưa có dữ liệu nét.'; return; }
      const make = () => {
        box.replaceChildren();
        pad = Strokes.create(it.jp, ds, { mode,
          onStroke: () => Sound.tap(),
          onMiss: kind => { Sound.bad(); status.textContent = MISS_MSG[kind]; },
          onDone: r => { Sound.good(); status.textContent = r.misses === 0 && !r.assisted ? 'Nét chuẩn!' : 'Tốt lắm, luyện thêm sẽ đẹp hơn!'; } });
        box.append(pad.el);
        modeBtn.textContent = mode === 'trace' ? 'Thử không nét mờ' : 'Viết theo nét mờ';
        status.textContent = mode === 'trace' ? 'Viết theo từng nét' : 'Tự viết từ trí nhớ';
      };
      modeBtn.onclick = () => { mode = mode === 'trace' ? 'write' : 'trace'; make(); };
      clearBtn.onclick = () => pad && pad.reset();
      make();
    });
  }

  function explain(ex, body) {
    body.append(h('h2', { class: 'ex-prompt' }, 'Ngữ pháp mới'),
      h('div', { class: 'explain-card' }, h('h3', { class: 'mincho' }, ex.title),
        h('ul', {}, ex.lines.map(l => h('li', {}, l)))));
    return { ready: () => true, check: () => ({ correct: true }), info: true };
  }

  // ---------- trắc nghiệm / nghe chọn / điền chỗ trống ----------
  function choice(ex, body, api) {
    const ctl = { locked: false, sel: -1 };
    body.append(h('h2', { class: 'ex-prompt' }, ex.prompt));
    if (ex.type === 'listen') {
      body.append(h('div', { class: 'listen-box' },
        h('button', { class: 'big-speaker', type: 'button', 'aria-label': 'Nghe', onclick: () => Speech.speak(ex.say) }, '🔊'),
        speakerBtn(ex.say, true)));
      setTimeout(() => Speech.speak(ex.say), 300);
    } else body.append(questionBubble(ex, api));
    const grid = optionGrid(ex, ctl, api, i => {
      ctl.sel = i;
      ctl.btns.forEach((b, k) => b.classList.toggle('selected', k === i));
      const o = ex.options[i];
      if (ex.type === 'choice' && o.jp && !ex.key.startsWith('kanji:')) Speech.speak(o.t);
      api.changed();
    });
    body.append(grid);
    ctl.ready = () => ctl.sel >= 0;
    ctl.pick = i => { if (!ctl.locked && ex.options[i]) { ctl.btns[i].click(); } };
    ctl.check = () => {
      ctl.locked = true;
      const ok = ctl.sel === ex.answer;
      ctl.btns[ex.answer].classList.add('right');
      if (!ok) ctl.btns[ctl.sel].classList.add('wrong');
      return { correct: ok, correctText: ex.options[ex.answer].t };
    };
    return ctl;
  }

  function blank(ex, body, api) {
    const ctl = { locked: false, sel: -1 };
    body.append(h('h2', { class: 'ex-prompt' }, ex.prompt), questionBubble(ex, api));
    const slot = h('span', { class: 'slot' }, '＿＿');
    const sentence = h('div', { class: 'blank-sentence jp' }, ex.tokens.map(t => t === null ? slot : h('span', { class: 'tok' }, t)));
    body.append(sentence);
    body.append(optionGrid(ex, ctl, api, i => {
      ctl.sel = i; slot.textContent = ex.options[i].t; slot.classList.add('filled');
      ctl.btns.forEach((b, k) => b.classList.toggle('selected', k === i));
      api.changed();
    }));
    ctl.ready = () => ctl.sel >= 0;
    ctl.pick = i => { if (!ctl.locked && ex.options[i]) ctl.btns[i].click(); };
    ctl.check = () => {
      ctl.locked = true;
      const ok = ctl.sel === ex.answer;
      ctl.btns[ex.answer].classList.add('right');
      if (!ok) ctl.btns[ctl.sel].classList.add('wrong');
      slot.classList.add(ok ? 'right' : 'wrong');
      const full = ex.tokens.map(t => t === null ? ex.options[ex.answer].t : t).join(' ');
      if (ok) Speech.speak(full.replace(/ /g, ''));
      return { correct: ok, correctText: full };
    };
    return ctl;
  }

  // ---------- gõ romaji ----------
  function type(ex, body, api) {
    const ctl = { locked: false };
    body.append(h('h2', { class: 'ex-prompt' }, ex.prompt), questionBubble(ex, api));
    const input = h('input', { class: 'input type-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
      placeholder: 'Gõ romaji ở đây…', 'aria-label': 'Câu trả lời bằng romaji',
      oninput: () => api.changed() });
    body.append(input, h('p', { class: 'type-help' }, 'Gõ bằng chữ cái Latinh. Ví dụ: shi hoặc si đều được chấp nhận.'));
    setTimeout(() => input.focus(), 120);
    ctl.ready = () => input.value.trim().length > 0;
    ctl.check = () => {
      ctl.locked = true; input.disabled = true;
      const norm = Romaji.normalize(input.value);
      const ok = ex.accept.includes(norm);
      input.classList.add(ok ? 'right' : 'wrong');
      return { correct: ok, correctText: ex.reveal.romaji };
    };
    return ctl;
  }

  // ---------- sắp xếp câu ----------
  function order(ex, body, api) {
    const ctl = { locked: false };
    const picked = []; // chỉ số token đã chọn theo thứ tự
    body.append(h('h2', { class: 'ex-prompt' }, ex.prompt), questionBubble(ex, api));
    const answer = h('div', { class: 'order-answer jp', 'aria-label': 'Câu của bạn' });
    const bank = h('div', { class: 'order-bank jp' });
    const chips = ex.tokens.map((t, i) => h('button', { class: 'chip', type: 'button', onclick: () => toggle(i) }, t));
    function render() {
      answer.innerHTML = ''; bank.innerHTML = '';
      picked.forEach(i => { const c = chips[i]; c.classList.add('in-answer'); answer.append(c); });
      chips.forEach((c, i) => { if (!picked.includes(i)) { c.classList.remove('in-answer'); bank.append(c); } });
      api.changed();
    }
    function toggle(i) {
      if (ctl.locked) return;
      Sound.tap();
      const at = picked.indexOf(i);
      if (at >= 0) picked.splice(at, 1); else picked.push(i);
      render();
    }
    body.append(answer, bank);
    render();
    ctl.ready = () => picked.length > 0;
    ctl.check = () => {
      ctl.locked = true;
      const got = picked.map(i => ex.tokens[i]);
      const ok = got.length === ex.answerTokens.length && got.every((t, k) => t === ex.answerTokens[k]);
      answer.classList.add(ok ? 'right' : 'wrong');
      if (ok) Speech.speak(ex.say);
      return { correct: ok, correctText: ex.answerTokens.join(' ') };
    };
    return ctl;
  }

  // ---------- ghép cặp ----------
  function match(ex, body, api) {
    const ctl = { locked: false, manual: true, wrongOnce: false };
    body.append(h('h2', { class: 'ex-prompt' }, ex.prompt));
    const pairs = ex.pairs;
    const lefts = pairs.map((p, i) => ({ i, text: p.left }));
    const rights = pairs.map((p, i) => ({ i, text: p.right }));
    for (let k = rights.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [rights[k], rights[j]] = [rights[j], rights[k]]; }
    let selL = null, selR = null, matched = 0;
    const colL = h('div', { class: 'match-col' }), colR = h('div', { class: 'match-col' });
    const lb = lefts.map(l => h('button', { class: 'mbtn jp', type: 'button', onclick: () => pick('L', l.i, lb_btn(l.i)) }, l.text));
    const rb = rights.map(r => h('button', { class: 'mbtn', type: 'button', onclick: () => pick('R', r.i, rb_btn(r.i)) }, r.text));
    const lb_btn = i => lb[lefts.findIndex(l => l.i === i)];
    const rb_btn = i => rb[rights.findIndex(r => r.i === i)];
    lb.forEach(b => colL.append(b)); rb.forEach(b => colR.append(b));
    body.append(h('div', { class: 'match-grid' }, colL, colR));

    function clearSel() { [...lb, ...rb].forEach(b => b.classList.remove('selected')); }
    async function pick(side, i, btn) {
      if (ctl.locked || btn.classList.contains('matched')) return;
      Sound.tap();
      if (side === 'L') { selL = { i, btn }; Speech.speak(pairs[i].say); lb.forEach(b => b.classList.remove('selected')); }
      else { selR = { i, btn }; rb.forEach(b => b.classList.remove('selected')); }
      btn.classList.add('selected');
      if (selL && selR) {
        const a = selL, b = selR; selL = selR = null;
        if (a.i === b.i) {
          Sound.correct();
          a.btn.classList.remove('selected'); b.btn.classList.remove('selected');
          a.btn.classList.add('matched'); b.btn.classList.add('matched');
          a.btn.disabled = b.btn.disabled = true;
          matched++;
          if (matched === pairs.length) api.manualDone(!ctl.wrongOnce);
        } else {
          Sound.wrong();
          a.btn.classList.add('shake', 'bad'); b.btn.classList.add('shake', 'bad');
          setTimeout(() => { [a.btn, b.btn].forEach(x => x.classList.remove('shake', 'bad', 'selected')); }, 450);
          if (!ctl.wrongOnce) { ctl.wrongOnce = true; await api.heartLost(); }
        }
      }
    }
    ctl.ready = () => false;
    return ctl;
  }

  // ---------- nói vào micro (tuỳ chọn, không bị trừ tim) ----------
  function speak(ex, body, api) {
    const ctl = { locked: false, manual: true, optional: true };
    body.append(h('h2', { class: 'ex-prompt' }, ex.prompt), questionBubble(ex, api));
    const status = h('p', { class: 'speak-status' }, Speech.canListen() ? 'Nhấn micro rồi đọc to từ/câu ở trên.' : 'Trình duyệt này chưa hỗ trợ nhận giọng nói (hãy dùng Chrome hoặc Edge). Bạn có thể bỏ qua phần này.');
    const mic = h('button', { class: 'mic', type: 'button', 'aria-label': 'Bắt đầu nói', disabled: !Speech.canListen() ? true : null, onclick: async () => {
      if (ctl.busy) return;
      ctl.busy = true; mic.classList.add('live'); status.textContent = 'Đang nghe… hãy nói!';
      const r = await Speech.listen();
      ctl.busy = false; mic.classList.remove('live');
      if (!r.ok) {
        status.textContent = r.error === 'not-allowed' ? 'Bạn chưa cho phép dùng micro. Hãy bật quyền micro cho trang này hoặc bỏ qua.' : 'Không nghe được. Thử lại hoặc bỏ qua nhé.';
        return;
      }
      if (!r.texts.length) { status.textContent = 'Mình chưa nghe rõ. Thử lại nhé!'; return; }
      const score = Romaji.similarity(r.texts[0], [ex.target, ex.question.jp.replace(/ /g, '')]);
      const best = Math.max(score, ...r.texts.map(t => Romaji.similarity(t, [ex.target, ex.question.jp.replace(/ /g, '')])));
      if (best >= 0.65) { status.textContent = 'Phát âm tốt lắm! Mình nghe được: ' + r.texts[0]; api.manualDone(true, true); }
      else { status.textContent = 'Mình nghe là "' + r.texts[0] + '". Thử lại nhé!'; Sound.wrong(); }
    } }, '🎤');
    body.append(h('div', { class: 'mic-box' }, mic, status));
    ctl.ready = () => false;
    return ctl;
  }

  // Không nghe được (tắt tiếng đọc hoặc máy chưa có giọng Nhật): đổi bài "nghe chọn" thành bài đọc chọn, để không bị mất tim oan.
  function listenFallback(ex) {
    const rv = ex.reveal || {};
    const answerIsJp = !!(ex.options[ex.answer] && ex.options[ex.answer].jp);
    if (answerIsJp) {
      return Object.assign({}, ex, { type: 'choice', prompt: 'Chọn chữ đúng', question: { text: /^đọc là/.test(rv.vi || '') ? rv.romaji : [rv.romaji, rv.vi].filter(Boolean).join(' · ') } });
    }
    return Object.assign({}, ex, { type: 'choice', prompt: 'Chọn nghĩa đúng', question: { jp: rv.jp, romaji: rv.romaji } });
  }

  // ---------- bài chữ cái có hướng dẫn viết ----------
  function intro(ex, body) {
    const steps = [['1', 'Xem nét', 'Xem thứ tự các nét và nghe cách đọc từng chữ'], ['2', 'Viết', 'Viết theo nét mờ, rồi tự viết từ trí nhớ'], ['3', 'Nhớ lại', 'Đọc, nghe và ghép chữ để nhớ lâu']];
    body.append(h('h2', { class: 'ex-prompt' }, 'Bài mới: ' + ex.items.length + ' chữ ' + (ex.script || '')),
      h('div', { class: 'intro-card' },
        h('div', { class: 'intro-chars' }, ex.items.map(c => h('div', { class: 'intro-char' }, h('span', { class: 'jp' }, c.jp), h('small', {}, c.romaji)))),
        h('ol', { class: 'intro-steps' }, steps.map(([n, t, d]) => h('li', {}, h('span', { class: 'step-n' }, n), h('span', {}, h('b', {}, t), h('small', {}, d)))))));
    Strokes.preload('kana');
    return { ready: () => true, check: () => ({ correct: true }), info: true };
  }

  // khung vẽ dùng chung cho strokes / trace / write
  function padBox(ex, body, mode, api, cb) {
    const box = h('div', { class: 'pad-box' });
    const status = h('div', { class: 'pad-status', 'aria-live': 'polite' }, 'Đang tải nét chữ…');
    body.append(box, status);
    const ctl = { ready: () => true, check: () => ({ correct: true }), pad: null };
    Strokes.get(ex.jp || ex.item.jp).then(ds => {
      if (!box.isConnected) return;
      status.textContent = '';
      if (!ds) { status.textContent = 'Chữ này chưa có dữ liệu nét, bạn cứ bỏ qua nhé.'; cb.missing && cb.missing(); return; }
      cb.ready(Strokes.create(ex.jp || ex.item.jp, ds, Object.assign({ mode }, cb.options || {})), box, status);
    });
    return ctl;
  }

  function strokesCard(ex, body, api) {
    const it = ex.item;
    body.append(h('h2', { class: 'ex-prompt' }, 'Chữ mới: cách viết'));
    const info = h('div', { class: 'stroke-info' },
      h('div', { class: 'stroke-romaji' }, h('b', { class: 'jp' }, it.jp), ' đọc là ', h('b', {}, it.romaji)),
      it.hint ? h('div', { class: 'teach-hint' }, '💡 ' + it.hint) : null,
      h('div', { class: 'teach-actions' }, speakerBtn(it.say), speakerBtn(it.say, true)));
    const ctl = padBox(ex, body, 'view', api, { ready(pad, box) {
      box.append(pad.el, h('button', { class: 'btn small ghost replay', type: 'button', onclick: () => pad.play({ loop: false }) }, '↺ Xem lại nét'));
      ctl.pad = pad; pad.play({ loop: true });
    } });
    body.append(info);
    setTimeout(() => Speech.speak(it.say), 250);
    ctl.info = true;
    return ctl;
  }

  const MISS_MSG = { off: 'Chưa đúng, thử lại nhé', reverse: 'Sai chiều nét, hãy bắt đầu từ đầu kia' };
  function drawCard(ex, body, api, mode) {
    const trace = mode === 'trace';
    body.append(h('h2', { class: 'ex-prompt' }, trace ? 'Viết theo từng nét' : 'Tự viết chữ này'),
      h('div', { class: 'write-ask' }, trace ? h('b', { class: 'jp' }, ex.jp) : null, trace ? ' ' : '', 'đọc là ', h('b', {}, ex.romaji), speakerBtn(ex.say)));
    const ctl = { manual: true, ready: () => true, check: () => ({ correct: true }) };
    const hintBtn = h('button', { class: 'btn small ghost', type: 'button' }, trace ? '▶ Xem lại nét' : '💡 Gợi ý');
    const clearBtn = h('button', { class: 'btn small ghost', type: 'button' }, '↺ Viết lại');
    const tools = h('div', { class: 'pad-tools' }, hintBtn, clearBtn);
    const sub = padBox(ex, body, mode, api, {
      options: {
        onStroke: (i, n) => { Sound.tap(); },
        onMiss: (kind, run) => { Sound.bad(); sub.status.textContent = MISS_MSG[kind] + (run >= (trace ? 2 : 3) ? ' · gợi ý nét tiếp theo' : ''); },
        onDone: r => {
          Sound.good();
          sub.status.textContent = '';
          if (!trace) sub.pad.showAll();
          tools.hidden = true;
          api.manualDone(true, false, r.misses === 0 && !r.assisted ? 'Nét chuẩn!' : 'Tốt lắm, luyện thêm sẽ đẹp hơn!');
        }
      },
      ready(pad, box, status) {
        sub.pad = pad; sub.status = status;
        box.append(pad.el, tools);
        hintBtn.onclick = () => trace ? pad.play({ loop: false }) : pad.hint();
        clearBtn.onclick = () => pad.reset();
      }
    });
    sub.status = body.querySelector('.pad-status');
    return Object.assign(ctl, { manual: true });
  }

  function render(ex, body, api) {
    if (ex.type === 'listen' && !(window.Speech && Speech.usable())) ex = listenFallback(ex);
    switch (ex.type) {
      case 'teach': return teach(ex, body, api);
      case 'explain': return explain(ex, body, api);
      case 'choice': case 'listen': return choice(ex, body, api);
      case 'blank': return blank(ex, body, api);
      case 'type': return type(ex, body, api);
      case 'order': return order(ex, body, api);
      case 'match': return match(ex, body, api);
      case 'speak': return speak(ex, body, api);
      case 'intro': return intro(ex, body, api);
      case 'strokes': return strokesCard(ex, body, api);
      case 'trace': return drawCard(ex, body, api, 'trace');
      case 'write': return drawCard(ex, body, api, 'write');
    }
    body.append(h('p', {}, 'Dạng bài không hỗ trợ: ' + ex.type));
    return { ready: () => true, check: () => ({ correct: true }), info: true };
  }

  window.LessonEx = { render };
})();
