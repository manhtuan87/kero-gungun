/* さっきの え (the original: 直前写真) — pictures come one at a time; tap the one shown just before.
   かんたん: remember the picture you just saw. むずかしい: the picture on screen is among the choices too.
   Grown-ups: the picture from two before. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var CARD = { x: 95, y: 104, w: 170, h: 176 };

  function pool() { return G.Pics ? G.Pics.ids : require('../data.js').PICS.map(function (x) { return x.id; }); }

  /* p: { mode: 'now' | 'prev' | 'prev2', q, k (choices), trick }
     Returns { seq, back, qs: [{ cur, answer, choices: [ids], right (index) }] } */
  function gen(p, r, ids) {
    ids = ids || pool();
    var back = p.mode === 'prev2' ? 2 : p.mode === 'prev' ? 1 : 0, seq = [];
    while (seq.length < p.q + back) {
      var id = U.pick(r, ids);
      if (seq.slice(-3).indexOf(id) >= 0) continue;
      seq.push(id);
    }
    var qs = [];
    for (var j = 0; j < p.q; j++) {
      var cur = seq[j + back], ans = seq[j], ch = [ans];
      if (p.trick && cur !== ans) ch.push(cur);
      while (ch.length < p.k) {
        var d = U.pick(r, ids);
        if (ch.indexOf(d) < 0 && d !== cur) ch.push(d);
      }
      ch = U.shuffle(r, ch);
      qs.push({ cur: cur, answer: ans, choices: ch, right: ch.indexOf(ans) });
    }
    return { seq: seq, back: back, qs: qs };
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art, P = G.Pics;
    var g = gen(p, api.rnd), j = -1, shownI = -1, phase = 'wait', pt = 0, correct = 0, since = 0, flip = 0, slide = 1;
    var blank = { draw: function () {} };
    var items = [];
    for (var b = 0; b < p.k; b++) items.push(blank);
    var ch = api.choices(items, tap, { top: 440, h: p.k > 3 ? 92 : 110, cols: p.k, gap: 8 });
    ch.enable(false);

    function setChoices(q) {
      q.choices.forEach(function (id, i) {
        ch.set(i, { draw: function (c, w, h) { P.draw(c, id, w / 2, h / 2, Math.min(w, h) * 0.8, 0); } });
      });
      ch.clear();
      ch.enable(true);
    }
    function showCard(i) { shownI = i; slide = 0; flip = 0; api.sfx('whoosh'); }

    function next() {
      j++;
      api.hand(null);
      if (j >= g.qs.length) {
        phase = 'end';
        api.finish({ score: correct, acc: correct / g.qs.length, text: U.res.right(correct, g.qs.length) });
        return;
      }
      if (p.mode === 'now') { showCard(j); phase = 'look'; pt = 0; ch.enable(false); }
      else { showCard(j + g.back); phase = 'ask'; pt = 0; since = 0; setChoices(g.qs[j]); }
      api.progress(j, g.qs.length);
    }
    function tap(i) {
      if (phase !== 'ask') return;
      var q = g.qs[j];
      ch.enable(false);
      if (i === q.right) { correct++; ch.mark(i, 'ok'); api.ok(180, CARD.y + CARD.h / 2, 70); }
      else { ch.mark(i, 'ng'); ch.mark(q.right, 'hint'); api.ng(180, CARD.y + CARD.h / 2, 60); }
      phase = 'after'; pt = 0;
      api.progress(j + 1, g.qs.length);
    }

    return {
      theme: 0,
      begin: function () {
        if (p.mode === 'now') { next(); return; }
        showCard(0); phase = 'intro'; pt = 0;
        api.speak(L('この えを おぼえてね'));
      },
      update: function (dt, playing) {
        pt += dt;
        slide = Math.min(1, slide + dt * 5);
        if (phase === 'hide') flip = Math.min(1, flip + dt * 4);
        if (!playing) return;
        if (phase === 'intro') {
          if (pt > 1.8) {
            if (shownI < g.back - 1) { showCard(shownI + 1); pt = 0; }
            else { j = -1; next(); api.speak(L(g.back === 2 ? 'ふたつ まえの え は どれ？' : 'ひとつ まえの え は どれ？')); }
          }
        } else if (phase === 'look' && pt > (p.show || 2)) {
          phase = 'hide'; pt = 0; api.sfx('flip');
        } else if (phase === 'hide' && flip >= 1) {
          phase = 'ask'; pt = 0; since = 0; setChoices(g.qs[j]);
        } else if (phase === 'ask') {
          since += dt;
          if (p.practice && since > 2.2) ch.hint(g.qs[j].right);
        } else if (phase === 'after' && pt > 0.7) next();
      },
      draw: function (c, clock) {
        var q = g.qs[Math.max(0, j)], ask = L(p.mode === 'now' ? 'いまの え は どれ？' : g.back === 2 ? 'ふたつ まえの え は どれ？' : 'ひとつ まえの え は どれ？');
        if (phase === 'intro') A.text(c, L('この えを おぼえてね'), 180, 80, 23, '#fff', { lw: 6 });
        else if (phase === 'look') A.text(c, L('よく みてね'), 180, 80, 23, '#fff', { lw: 6 });
        else if (phase !== 'wait') A.text(c, ask, 180, 80, 22, '#fff', { lw: 6 });
        if (shownI < 0) return;
        var id = g.seq[shownI], s = Math.abs(Math.cos(flip * Math.PI)), dx = (1 - slide) * 240;
        c.save(); c.translate(180 + dx, CARD.y + CARD.h / 2); c.scale(Math.max(0.04, s), 1);
        A.card(c, -CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, '#ffd0e4');
        if (flip < 0.5) P.draw(c, id, 0, 0, 132, clock);
        else {
          c.save(); D.roundRect(c, -CARD.w / 2 + 12, -CARD.h / 2 + 12, CARD.w - 24, CARD.h - 24, 12); c.clip();
          c.fillStyle = '#ffc2da'; c.fillRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h);
          for (var i = -4; i <= 4; i++) { D.heart(c, i * 22, (i % 2) * 22, 7, '#fff'); D.heart(c, i * 22 + 11, 40 + (i % 2) * 22, 7, '#fff'); D.heart(c, i * 22 + 11, -44 + (i % 2) * 22, 7, '#fff'); }
          c.restore();
          A.text(c, '？', 0, 4, 64, '#fff', { lw: 10 });
        }
        c.restore();
        // ケロはかせ keeps an eye on the cards
        c.save(); c.translate(56, 360); c.scale(0.5, 0.5);
        D.critter(c, { x: 0, y: 0, t: clock, kind: 'frog', look: { x: 240, y: -200 }, mode: phase === 'after' && q && ch.btns[q.right].classList.contains('ok') ? 'happy' : 'idle', mt: pt, wear: A.hakase });
        c.restore();
      },
      peek: function () { return phase === 'ask' ? g.qs[j].right : null; },   // for playtesting
      end: function () {}
    };
  }

  T.register({
    id: 'sakki', name: 'さっきの え', orig: '直前写真', kind: 'count',
    help: 'えが 1まいずつ でてくるよ\nひとつ まえに でた えを\nしたから えらんでね！',
    levels: {
      e: { mode: 'now', q: 10, k: 3, show: 2.0 },
      n: { mode: 'prev', q: 10, k: 3 },
      h: { mode: 'prev', q: 10, k: 4, trick: true },
      a: { mode: 'prev2', q: 12, k: 4, trick: true },
      practice: { q: 3 }
    },
    ranks: { e: [10, 9, 8, 7, 5, 3], n: [10, 9, 8, 7, 5, 3], h: [10, 9, 8, 7, 5, 3], a: [12, 11, 10, 8, 6, 4] },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art, P = G.Pics, k = Math.sin((t || 0) * 2) * 3;
      c.save(); c.translate(30, 54); c.rotate(-0.18);
      A.card(c, -24, -30, 48, 56); P.draw(c, 'apple', 0, -2, 38, 0);
      c.restore();
      c.save(); c.translate(66 + k, 48); c.rotate(0.12);
      A.card(c, -24, -30, 48, 56); P.draw(c, 'chick', 0, -2, 38, t || 0);
      c.restore();
      A.text(c, '？', 30, 86, 20, '#ff8fc0', { lw: 5 });
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
