// Trình phát bài học: hàng đợi bài tập, chấm điểm, trừ tim, màn kết quả.
(function () {
  const { h, toast, sheet } = UI;
  const PRAISE = ['Chính xác!', 'Tuyệt vời!', 'Giỏi lắm!', 'Đúng rồi!', 'Quá đỉnh!', 'Hay lắm!'];
  const UNSCORED = ['teach', 'explain', 'speak', 'intro', 'strokes', 'trace', 'write'];
  const isScored = e => !UNSCORED.includes(e.type);
  const PHASES = ['', 'Bước 1/3 · Xem nét và viết theo', 'Bước 2/3 · Tự viết từ trí nhớ', 'Bước 3/3 · Nhớ lại'];

  // o: { title, exercises, me, complete(payload) -> Promise<{result, me}> }
  function run(o) {
    return new Promise(resolveRaw => {
      let ctl = null; // controller của bài hiện tại
      // phím tắt: Enter = nút chính, 1–4 = chọn đáp án
      const onKey = e => {
        const tag = (e.target && e.target.tagName) || '';
        if (e.key === 'Enter') {
          const b = document.querySelector('.lesson-foot .btn');
          if (b && !b.disabled && !b.hidden) { e.preventDefault(); e.stopPropagation(); b.click(); }
        } else if (/^[1-9]$/.test(e.key) && tag !== 'INPUT' && ctl && ctl.pick) {
          ctl.pick(Number(e.key) - 1);
        }
      };
      document.addEventListener('keydown', onKey, true);
      const resolve = v => { document.removeEventListener('keydown', onKey, true); resolveRaw(v); };
      const root = document.getElementById('app');
      const queue = o.exercises.slice();
      const total = Math.max(1, queue.filter(isScored).length);
      let done = 0, idx = 0, locked = false, finished = false;
      let hearts = o.me.hearts;
      const maxHearts = o.me.maxHearts;
      let combo = 0, bestCombo = 0;
      const results = [], wrongKeys = [], rightKeys = [];
      let cur = null, firstAttempt = true;

      // ----- khung giao diện -----
      const bar = h('i', { style: { width: '0%' } });
      const heartEl = h('span', { class: 'stat hearts' }, h('span', { 'aria-hidden': 'true' }, '❤️'), h('span', { class: 'hn' }, hearts));
      const comboEl = h('span', { class: 'combo', hidden: true }, '');
      const body = h('main', { class: 'lesson-body' });
      const fbText = h('div', { class: 'fb-text' });
      const btn = h('button', { class: 'btn block big', type: 'button' }, 'Kiểm tra');
      const foot = h('footer', { class: 'lesson-foot' }, h('div', { class: 'foot-inner' }, fbText, btn));
      const closeBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Thoát bài học', onclick: exitAsk }, '✕');
      const view = h('div', { class: 'lesson' },
        h('header', { class: 'lesson-top' }, closeBtn, h('div', { class: 'bar grow' }, bar), comboEl, heartEl),
        body, foot);
      root.innerHTML = '';
      root.append(view);
      Sound.unlock();

      function updateHearts() {
        heartEl.querySelector('.hn').textContent = hearts;
        heartEl.classList.toggle('off', hearts === 0);
      }
      function updateCombo() {
        comboEl.hidden = combo < 2;
        comboEl.replaceChildren(...Icons.rich('🔥 ' + combo));
      }
      function setProgress() { bar.style.width = Math.min(100, Math.round(done / total * 100)) + '%'; }

      // ----- API cho các dạng bài -----
      const api = {
        equipped: o.me.equipped,
        changed() { if (!locked) btn.disabled = !(ctl && ctl.ready()); },
        primary() { if (!btn.disabled) btn.click(); },
        async heartLost() {
          Sound.wrong();
          try {
            const r = await API.post('/api/heart/lose');
            hearts = r.hearts; o.me = r.me;
          } catch (e) { hearts = Math.max(0, hearts - 1); }
          updateHearts();
          if (hearts <= 0) outOfHearts();
        },
        // dùng cho match và speak (tự kết thúc)
        manualDone(ok, bonus, msg) {
          if (locked) return;
          locked = true;
          const ex = cur;
          if (ex.type === 'match' || bonus) {
            if (!ex._retry) { results.push(ok); (ok ? ex.keys || [ex.key] : ex.keys || [ex.key]).forEach(k => (ok ? rightKeys : wrongKeys).push(k)); }
            if (ok) { combo++; bestCombo = Math.max(bestCombo, combo); } else combo = 0;
            updateCombo();
          }
          if (isScored(ex)) { done++; setProgress(); }
          if (ok) Sound.correct();
          showFeedback(ok, ok ? (msg || PRAISE[Math.floor(Math.random() * PRAISE.length)]) : 'Cố lên, lần sau sẽ nhớ!', null, ex);
        }
      };

      // ----- hiển thị bài tập hiện tại -----
      function showExercise() {
        if (idx >= queue.length) return finish();
        cur = queue[idx];
        locked = false; firstAttempt = !cur._retry;
        body.innerHTML = '';
        foot.className = 'lesson-foot';
        fbText.innerHTML = '';
        btn.className = 'btn block big';
        btn.onclick = onPrimary;
        ctl = LessonEx.render(cur, body, api);
        if (PHASES[cur.phase]) body.prepend(h('div', { class: 'phase p' + cur.phase }, PHASES[cur.phase]));
        window.scrollTo(0, 0);
        btn.hidden = false;
        if (ctl.info) { btn.disabled = false; btn.textContent = 'Tiếp tục'; }
        else if (ctl.manual) {
          btn.disabled = false; btn.textContent = 'Bỏ qua';
          btn.className = 'btn block big ghost';
          if (cur.type === 'match') btn.hidden = true; // phải ghép xong mới đi tiếp
        } else { btn.disabled = true; btn.textContent = 'Kiểm tra'; }
      }

      function onPrimary() {
        Sound.unlock();
        if (cur && ctl && ctl.info) { idx++; return showExercise(); }
        if (locked) { idx++; return showExercise(); }
        if (ctl.manual) { // bỏ qua (match chưa xong hoặc speak)
          if (cur.type === 'speak' || cur.type === 'trace' || cur.type === 'write') { idx++; return showExercise(); }
          return; // match: phải ghép xong
        }
        if (!ctl.ready()) return;
        check();
      }

      async function check() {
        locked = true;
        const ex = cur;
        const r = ctl.check();
        if (firstAttempt) {
          results.push(r.correct);
          (r.correct ? rightKeys : wrongKeys).push(ex.key);
        }
        if (r.correct) {
          combo++; bestCombo = Math.max(bestCombo, combo);
          done++; setProgress(); if (combo >= 3) Sound.combo(combo); else Sound.correct();
        } else {
          combo = 0;
          // làm lại ở cuối hàng đợi
          queue.push(Object.assign({}, ex, { _retry: true }));
          await api.heartLost();
          Sound.wrong();
        }
        updateCombo();
        showFeedback(r.correct, r.correct ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : 'Đáp án đúng:', r.correct ? null : r.correctText, ex);
      }

      function showFeedback(ok, title, answerText, ex) {
        foot.classList.add(ok ? 'good' : 'bad');
        fbText.innerHTML = '';
        fbText.append(h('div', { class: 'fb-title' }, (ok ? '✔ ' : '✘ ') + title));
        if (answerText) fbText.append(h('div', { class: 'fb-answer jp' }, answerText));
        const rv = ex.reveal;
        if (rv) {
          const bits = [];
          if (rv.jp && rv.vi) bits.push(rv.jp + (rv.romaji ? ' (' + rv.romaji + ')' : '') + ' = ' + rv.vi);
          if (!ok && rv.hint) bits.push('💡 ' + rv.hint);
          if (bits.length && (!ok || ex.type === 'type' || ex.type === 'listen')) fbText.append(h('div', { class: 'fb-note' }, bits.join('  ·  ')));
        }
        btn.hidden = false;
        btn.disabled = false;
        btn.className = 'btn block big ' + (ok ? 'good' : 'bad');
        btn.textContent = 'Tiếp tục';
        btn.focus();
      }

      // ----- hết tim -----
      function outOfHearts() {
        if (finished) return;
        finished = true; locked = true;
        Sound.fail();
        setTimeout(() => {
          const s = sheet([
            h('div', { class: 'center', html: Cat.svg({ equipped: o.me.equipped, mood: 'sad', className: 'medium' }) }),
            h('h2', { class: 'center' }, 'Hết tim rồi!'),
            h('p', { class: 'center' }, 'Tim sẽ tự hồi 1 cái sau mỗi ' + 20 + ' phút. Bạn cũng có thể dùng xu để hồi ngay.'),
            h('div', { class: 'row' },
              h('button', { class: 'btn ghost', onclick: () => { s.close(); resolve({ status: 'exit' }); } }, 'Để sau'),
              h('button', { class: 'btn gold', onclick: async () => {
                try {
                  const r = await API.post('/api/shop/buy', { id: 'heart_1' });
                  o.me = r.me; hearts = r.me.hearts; updateHearts(); finished = false; s.close();
                  toast('Đã hồi 1 tim (-30 xu)', 'good');
                  idx++; showExercise();
                } catch (e) { toast(e.message, 'bad'); }
              } }, 'Hồi 1 tim · 30 🪙'))
          ], { locked: true, center: true });
        }, 500);
      }

      async function exitAsk() {
        const ok = await UI.confirmBox('Thoát bài học?', 'Tiến độ của bài này sẽ không được lưu.', 'Thoát', 'Học tiếp');
        if (ok) { finished = true; resolve({ status: 'exit' }); }
      }

      // ----- kết thúc bài -----
      async function finish() {
        if (finished) return;
        finished = true;
        body.innerHTML = ''; fbText.innerHTML = '';
        body.append(h('p', { class: 'center muted', style: { marginTop: '30vh' } }, 'Đang tính điểm…'));
        btn.disabled = true;
        try {
          const data = await o.complete({ results, wrongKeys, rightKeys });
          showResult(data);
        } catch (e) {
          toast(e.message, 'bad');
          resolve({ status: 'exit' });
        }
      }

      function showResult(data) {
        const r = data.result;
        view.innerHTML = '';
        view.className = 'lesson result';
        Sound.done();
        const stars = h('div', { class: 'stars', 'aria-label': r.stars + ' sao' },
          [1, 2, 3].map(i => h('span', { class: 'star' + (i <= r.stars ? ' on' : ''), style: { animationDelay: (0.9 + i * 0.18) + 's' } }, '★')));
        const stamp = h('div', { class: 'hanko-big', 'aria-hidden': 'true' }, h('span', { class: 'mincho' }, r.perfect ? '満点' : '合格'));
        setTimeout(() => Sound.stamp(), 620);
        const rows = [];
        const coinRow = (label, val, icon) => h('div', { class: 'res-row' }, h('span', {}, icon + ' ' + label), h('b', {}, val));
        if (o.practice) {
          rows.push(coinRow('XP nhận được', '+' + r.xpEarned, '⭐'));
        } else {
          rows.push(coinRow('Xu hoàn thành bài' + (r.firstTime ? '' : ' (học lại)'), '+' + r.baseCoins, '🪙'));
          if (r.bonusCoins > 0) rows.push(coinRow('Thưởng chuỗi đúng liên tiếp (dài nhất ' + r.maxCombo + ' câu)', '+' + r.bonusCoins, '🔥'));
          if (r.boosted) rows.push(coinRow('Bùa nhân đôi xu', '×2', '🧧'));
          rows.push(coinRow('Tổng xu', '+' + r.coinsEarned, '💰'));
          rows.push(coinRow('XP nhận được', '+' + r.xpEarned, '⭐'));
        }
        rows.push(coinRow('Trả lời đúng ngay lần đầu', r.correct + '/' + r.total, '🎯'));
        if (r.streakExtended) rows.push(coinRow('Chuỗi ngày học', r.streak + ' ngày', '🔥'));
        if (r.usedFreeze) rows.push(coinRow('Khiên đã giữ chuỗi của bạn', '-' + r.usedFreeze, '🛡️'));
        const msg = r.perfect ? 'Hoàn hảo! Không sai câu nào.' : r.stars >= 2 ? 'Làm tốt lắm!' : 'Hoàn thành bài rồi, ôn lại sẽ nhớ hơn nhé.';
        view.append(h('main', { class: 'lesson-body result-body' },
          h('div', { class: 'res-cat', html: Cat.svg({ equipped: data.me.equipped, mood: 'cheer', className: 'medium' }) }),
          stamp, h('h1', { class: 'mincho res-title' }, msg), stars,
          h('div', { class: 'res-list card' }, rows)),
          h('footer', { class: 'lesson-foot' }, h('div', { class: 'foot-inner' },
            h('button', { class: 'btn block big', type: 'button', onclick: () => resolve({ status: 'done', data }) }, 'Tiếp tục'))));
      }

      showExercise();
    });
  }

  window.Lesson = { run };
})();
