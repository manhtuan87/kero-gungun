/* じゅんばん ぴょんぴょん (the original: 順番線引テスト) — lily pads with numbers (and hiragana) are
   scattered on a pond; tap them in order and the partner hops from pad to pad.
   むずかしい alternates numbers and letters: 1 → あ → 2 → い ..., like the original's 1 → A → 2 → B. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var DATA = typeof Data !== 'undefined' ? Data : require('../data.js');
  var KANA = 'あいうえおかきくけこ';   // (in another language, its first letters: DATA.SEQ, set by app.js)
  var POND_Y = 116;                                   // the pond starts below the row that shows the whole order
  var BOX = { x0: 46, y0: 150, x1: 314, y1: 552 };
  var START = { x: 180, y: 606 };

  function labels(p) {
    var out = [];
    var letters = DATA.SEQ || KANA;
    for (var i = 0; i < p.n; i++) out.push(p.seq === 'alt' ? (i % 2 ? letters.charAt((i - 1) / 2) : String(i / 2 + 1)) : String(i + 1));
    return out;
  }
  // p: { boards, seq: 'num' | 'alt', n }
  function gen(p, r) {
    var out = [], labs = labels(p);
    for (var b = 0; b < p.boards; b++) {
      var pts = U.scatter(r, p.n, BOX, 72);
      out.push(labs.map(function (l, i) { return { label: l, x: pts[i].x, y: pts[i].y }; }));
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var boards = gen(p, api.rnd), bi = -1, pads = [], nextI = 0, time = 0, mistakes = 0, phase = 'wait', pt = 0, since = 0;
    var hero = { x: START.x, y: START.y, fx: START.x, fy: START.y, k: 1, mode: 'idle', mt: 0 };

    function nextBoard() {
      bi++;
      api.hand(null);
      if (bi >= boards.length) {
        phase = 'end';
        api.finish({ score: time + mistakes * 2, text: U.res.time(time, mistakes) });
        return;
      }
      pads = boards[bi].map(function (q, i) { return { label: q.label, x: q.x, y: q.y, i: i, done: false, shake: 0 }; });
      nextI = 0; phase = 'play'; pt = 0; since = 0;
      hero.x = hero.fx = START.x; hero.y = hero.fy = START.y; hero.k = 1;
      api.progress(0, pads.length);
    }
    function hop(to) {
      hero.fx = hero.x; hero.fy = hero.y;
      hero.x = to.x; hero.y = to.y; hero.k = 0;
      hero.mode = 'happy'; hero.mt = 0;
      api.sfx('hop');
    }
    // The whole order at the top (two rows when it is long): the done ones turn green, the next one glows.
    function drawOrder(c, clock) {
      var n = pads.length;
      if (!n) return;
      var perRow = n > 12 ? Math.ceil(n / 2) : n, rows = Math.ceil(n / perRow);
      var step = Math.min(28, 328 / perRow), r = Math.min(12, step * 0.43);
      for (var i = 0; i < n; i++) {
        var row = Math.floor(i / perRow), col = i % perRow, inRow = Math.min(perRow, n - row * perRow);
        var x = 180 + (col - (inRow - 1) / 2) * step, y = (rows > 1 ? 75 : 88) + row * 26;
        var done = i < nextI, next = i === nextI && phase === 'play', lab = pads[i].label;
        var rr = next ? r * (1.18 + 0.06 * Math.sin(clock * 6)) : r;
        if (next) { D.circle(c, x, y, rr + 4); D.paint(c, 'rgba(255,240,106,.85)'); }
        D.circle(c, x, y, rr); D.paint(c, done ? '#9fdc7c' : next ? '#fff06a' : '#fffdf5', D.INK, 2.2);
        A.text(c, lab, x, y + 1, lab.length > 1 ? rr * 0.95 : rr * 1.2, done ? 'rgba(90,56,37,.45)' : D.INK, { stroke: false });
      }
    }

    return {
      theme: 0,
      begin: nextBoard,
      update: function (dt, playing) {
        pt += dt;
        hero.mt += dt;
        if (hero.k < 1) { hero.k = Math.min(1, hero.k + dt / 0.26); if (hero.k >= 1) api.sfx('land'); }
        if (hero.mode === 'happy' && hero.mt > 0.6) hero.mode = 'idle';
        pads.forEach(function (q) { if (q.shake > 0) q.shake -= dt; });
        if (!playing) return;
        if (phase === 'play') {
          time += dt; since += dt;
          if (p.practice && since > 2) { var q = pads[nextI]; if (q) api.hand(q.x + 6, q.y + 8); }
        } else if (phase === 'clear' && pt > 0.9) nextBoard();
      },
      draw: function (c, clock) {
        // the pond
        D.roundRect(c, 14, POND_Y, 332, 632 - POND_Y, 40); D.paint(c, '#9edcff', '#6bb8e6', 4);
        c.save(); D.roundRect(c, 14, POND_Y, 332, 632 - POND_Y, 40); c.clip();
        c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; c.lineCap = 'round';
        for (var w = 0; w < 7; w++) {
          var wy = 160 + w * 68, wx = 40 + ((w * 97) % 220);
          c.beginPath(); c.arc(wx + Math.sin(clock + w) * 6, wy, 16, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
        }
        c.restore();
        drawOrder(c, clock);
        // the path already hopped
        var done = pads.filter(function (q) { return q.done; });
        if (done.length) {
          c.save(); c.setLineDash([2, 12]); c.lineCap = 'round'; c.lineWidth = 6; c.strokeStyle = 'rgba(255,255,255,.9)';
          c.beginPath(); c.moveTo(START.x, START.y);
          done.forEach(function (q) { c.lineTo(q.x, q.y); });
          c.stroke(); c.restore();
        }
        D.ellipse(c, START.x, START.y + 14, 40, 12); D.paint(c, '#6cc46a', '#2f7d3b', 3);
        pads.forEach(function (q) {
          var sx = q.shake > 0 ? Math.sin(q.shake * 50) * 5 : 0;
          A.pad(c, q.x + sx, q.y, 29, q.label, q.done ? 1 : 0, clock);
        });
        // the partner, hopping
        var k = hero.k, x = hero.fx + (hero.x - hero.fx) * k, y = hero.fy + (hero.y - hero.fy) * k - Math.sin(k * Math.PI) * 46;
        c.save(); c.translate(x, y - 6); c.scale(0.4, 0.4);
        D.critter(c, { x: 0, y: -40, t: clock, kind: api.partner, noSeat: true, look: pads[nextI] ? { x: (pads[nextI].x - x) * 2.5, y: (pads[nextI].y - y) * 2.5 } : null, mode: hero.mode, mt: hero.mt });
        c.restore();
      },
      down: function (q) {
        if (phase !== 'play') return;
        for (var k = 0; k < pads.length; k++) {
          var pd = pads[k], dx = q.x - pd.x, dy = q.y - pd.y;
          if (dx * dx + dy * dy > 33 * 33) continue;
          if (pd.done) return;
          if (pd.i === nextI) {
            pd.done = true; nextI++; since = 0; api.hand(null);
            hop(pd);
            api.progress(nextI, pads.length);
            if (nextI >= pads.length) { phase = 'clear'; pt = 0; api.ok(180, 330, 70); api.burst(pd.x, pd.y, 10, '#fff6a8'); }
          } else {
            mistakes++;
            pd.shake = 0.3;
            api.ng(pd.x, pd.y, 26);
          }
          return;
        }
      },
      peek: function () { return phase === 'play' && pads[nextI] ? { x: pads[nextI].x, y: pads[nextI].y } : null; }   // for playtesting
    };
  }

  T.register({
    id: 'junban', name: 'じゅんばん ぴょんぴょん', orig: '順番線引テスト', kind: 'time',
    help: 'はっぱの すうじを\n1から じゅんばんに タッチすると\nぴょんぴょん とんでいくよ！',
    levels: {
      e: { boards: 2, seq: 'num', n: 8 },
      n: { boards: 2, seq: 'num', n: 12 },
      h: { boards: 2, seq: 'alt', n: 10 },
      a: { boards: 2, seq: 'alt', n: 16 },
      test: { boards: 1, seq: 'num', n: 12 },
      testA: { boards: 1, seq: 'alt', n: 16 },
      practice: { boards: 1, seq: 'num', n: 5 }
    },
    ranks: {
      e: [14, 18, 23, 29, 37, 50], n: [22, 28, 35, 44, 56, 75], h: [26, 33, 42, 53, 68, 90],
      a: [22, 27, 33, 40, 50, 65], test: [11, 14, 18, 23, 29, 38], testA: [11, 14, 17, 21, 26, 34]
    },
    gen: gen, labels: labels,
    start: start,
    icon: function (c, t) {
      var A = G.Art, D = G.Draw;
      D.roundRect(c, 6, 10, 88, 84, 20); D.paint(c, '#9edcff', '#6bb8e6', 3);
      A.pad(c, 26, 72, 14, 1, 1, 0); A.pad(c, 70, 64, 14, 2, 0, 0); A.pad(c, 40, 32, 14, 3, 0, 0);
      var k = ((t || 0) * 0.8) % 1, x = 26 + (70 - 26) * k, y = 62 - 8 * k - Math.sin(k * Math.PI) * 18;
      c.save(); c.translate(x, y); c.scale(0.2, 0.2);
      D.critter(c, { x: 0, y: -40, t: t || 0, kind: 'frog', noSeat: true, look: null, mode: 'idle' });
      c.restore();
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
