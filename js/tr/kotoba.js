/* ことば つくり — look at the picture and put the
   letter blocks in order to make its name. むずかしい adds letters that are not in the word.
   おに: after each right letter, the letters still to use change places (and more letters are not in the word). */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var DATA = typeof Data !== 'undefined' ? Data : require('../data.js');

  // p: { q, len: [a, b], dummy, recent (pictures shown lately: they come last) }; おに: reshuffle
  function gen(p, r) {
    var words = DATA.PICS.filter(function (x) { return x.name.length >= p.len[0] && x.name.length <= p.len[1]; });
    var ids = U.fresh(r, words.map(function (w) { return w.id; }), Math.min(p.q, words.length), p.recent);
    return ids.map(function (id) { return words.filter(function (w) { return w.id === id; })[0]; }).map(function (w) {
      var letters = w.name.split(''), dummies = [];
      while (dummies.length < p.dummy) {
        var ch = DATA.KANA.charAt(U.int(r, 0, DATA.KANA.length - 1));
        if (letters.indexOf(ch) < 0 && dummies.indexOf(ch) < 0) dummies.push(ch);
      }
      return { id: w.id, word: w.name, tiles: U.shuffle(r, letters.concat(dummies)) };
    });
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art, P = G.Pics;
    var qs = gen(p, api.rnd), qi = -1, Q = null, filled = 0, used = [], phase = 'wait', pt = 0, time = 0, mistakes = 0, since = 0;
    var ch = null, maxTiles = 0, letters = 0;
    api.used(qs.map(function (q) { return q.id; }));
    qs.forEach(function (q) { maxTiles = Math.max(maxTiles, q.tiles.length); letters += q.word.length; });
    var cols = maxTiles > 8 ? 5 : maxTiles > 5 ? 4 : maxTiles, rows = Math.ceil(maxTiles / cols);

    function build() {
      if (ch) ch.remove();
      var items = Q.tiles.map(function (t) { return { label: t, size: 38 }; });
      while (items.length < cols * rows) items.push({ label: '', cls: 'gone' });
      ch = api.choices(items, tap, { top: rows > 2 ? 420 : rows > 1 ? 452 : 480, h: rows > 2 ? 62 : 74, cols: cols, gap: 10, left: cols < 4 ? 40 : 16, right: cols < 4 ? 40 : 16 });
    }
    function next() {
      qi++;
      api.hand(null);
      if (qi >= qs.length) {
        phase = 'end';
        api.finish({ score: time + mistakes * 2, acc: U.acc(mistakes, letters), text: U.res.time(time, mistakes) });
        return;
      }
      Q = qs[qi]; filled = 0; used = []; phase = 'play'; pt = 0; since = 0;
      build();
      api.progress(qi, qs.length);
    }
    function hintTile() {
      for (var i = 0; i < Q.tiles.length; i++) if (used.indexOf(i) < 0 && Q.tiles[i] === Q.word.charAt(filled)) return i;
      return -1;
    }
    // おに: the letters still to use change places (at least one of them moves)
    function reshuffle() {
      var free = [];
      for (var k = 0; k < Q.tiles.length; k++) if (used.indexOf(k) < 0) free.push(k);
      if (free.length < 2) return;
      var was = free.map(function (k) { return Q.tiles[k]; }), now = U.shuffle(api.rnd, was);
      if (now.join('') === was.join('')) now.push(now.shift());
      free.forEach(function (k, j) { Q.tiles[k] = now[j]; ch.set(k, { label: now[j], size: 38 }); });
      api.sfx('whoosh');
    }
    function tap(i) {
      if (phase !== 'play' || used.indexOf(i) >= 0 || i >= Q.tiles.length) return;
      if (Q.tiles[i] === Q.word.charAt(filled)) {
        used.push(i); filled++; since = 0;
        ch.mark(i, 'gone'); ch.hint(-1);
        if (filled < Q.word.length) api.sfx('ok');   // (the last letter: api.ok below)
        if (p.reshuffle && filled < Q.word.length) reshuffle();
        if (filled >= Q.word.length) {
          phase = 'done'; pt = 0;
          api.ok(180, 190, 76);
          api.burst(180, 190, 12, '#fff6a8');
          api.speak(L('{word}！', { word: Q.word }));
          api.progress(qi + 1, qs.length);
        }
      } else {
        mistakes++;
        ch.shake(i);
        api.sfx('ng');
      }
    }

    return {
      theme: 4,
      begin: next,
      update: function (dt, playing) {
        pt += dt;
        if (!playing) return;
        if (phase === 'play') {
          time += dt; since += dt;
          if (p.practice && since > 2.2) ch.hint(hintTile());
        } else if (phase === 'done' && pt > 1.1) next();
      },
      draw: function (c, clock) {
        A.text(c, L('えの なまえを つくろう！'), 180, 80, 22, '#fff', { lw: 6 });
        A.card(c, 100, 100, 160, 170, '#c9f0b8');
        if (Q) P.draw(c, Q.id, 180, 185, 124, clock);
        if (!Q) return;
        var n = Q.word.length, gap = 8, size = Math.min(n > 4 ? 52 : 60, Math.floor((340 - (n - 1) * gap) / n)), w = n * size + (n - 1) * gap, x0 = 180 - w / 2, y = 298;
        for (var i = 0; i < n; i++) {
          var x = x0 + i * (size + gap);
          D.roundRect(c, x, y, size, size, 12);
          D.paint(c, i < filled ? '#fff8dc' : 'rgba(255,255,255,.6)', D.INK, 3);
          if (i < filled) A.text(c, Q.word.charAt(i), x + size / 2, y + size / 2 + 1, size * 0.62, D.INK, { stroke: false });
          else if (i === filled && phase === 'play') {
            c.save(); c.globalAlpha = 0.4 + 0.3 * Math.sin(clock * 6);
            D.roundRect(c, x + 4, y + 4, size - 8, size - 8, 9); D.paint(c, null, '#ffb347', 3);
            c.restore();
          }
        }
      },
      peek: function () { return phase === 'play' ? hintTile() : null; },   // for playtesting
      end: function () {}
    };
  }

  T.register({
    id: 'kotoba', name: 'ことば つくり', kind: 'time', pool: 'pics',
    help: 'えを みて なまえの もじを\nじゅんばんに タッチしてね！',
    oniHelp: 'もじを タッチする たびに、\nもじの ばしょが かわるよ！',
    levels: {
      e: { q: 6, len: [2, 2], dummy: 0 },
      n: { q: 6, len: [3, 3], dummy: 1 },
      h: { q: 6, len: [4, 5], dummy: 2 },
      ae: { q: 6, len: [3, 4], dummy: 2 },
      a: { q: 8, len: [3, 5], dummy: 3 },
      ah: { q: 8, len: [4, 6], dummy: 4 },
      practice: { q: 2, len: [2, 2], dummy: 0 },
      o: { q: 6, len: [3, 4], dummy: 3, reshuffle: true },
      ao: { q: 8, len: [4, 6], dummy: 5, reshuffle: true },
      practiceO: { q: 2, len: [2, 2], dummy: 1, reshuffle: true }
    },
    ranks: {
      e: [10, 13, 17, 22, 30, 42], n: [16, 20, 25, 32, 42, 58], h: [24, 30, 38, 48, 62, 85], o: [24, 30, 38, 48, 62, 85],
      ae: [14, 17, 21, 26, 33, 43], a: [20, 24, 29, 35, 43, 55], ah: [28, 34, 41, 50, 62, 80], ao: [36, 44, 53, 64, 78, 100]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art, D = G.Draw, P = G.Pics;
      P.draw(c, 'apple', 50, 34, 46, 0);
      (typeof Lang !== 'undefined' ? Lang.pick({ ja: ['り', 'ん', 'ご'], vi: ['t', 'á', 'o'], en: ['A', 'P', 'P'], ko: ['사', '과'] }) : ['り', 'ん', 'ご']).forEach(function (s, i) {
        var bob = Math.sin((t || 0) * 3 + i) * 2;
        D.roundRect(c, 12 + i * 27, 64 + bob, 24, 24, 6); D.paint(c, '#fff8dc', D.INK, 2.4);
        A.text(c, s, 24 + i * 27, 76 + bob, 16, D.INK, { stroke: false });
      });
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
