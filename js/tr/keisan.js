/* けいさん (the original: 計算25 / 計算100) — answer the sums on the chalkboard as fast as you can.
   Children tap the answer (0-10); grown-ups type it (25 sums with two-digit numbers and times tables). */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};

  function kidQ(p, r) {
    if (p.ops === '+-' && r() < 0.5) {
      var a = U.int(r, 2, p.max), b = U.int(r, 1, a - 1);
      return { a: a, b: b, op: '−', ans: a - b };
    }
    var s = U.int(r, 2, p.max), a2 = U.int(r, 1, s - 1);
    return { a: a2, b: s - a2, op: '＋', ans: s };
  }
  function adultQ(r) {
    var k = r(), a, b;
    if (k < 0.34) { a = U.int(r, 12, 89); b = Math.min(U.int(r, 3, 9), 99 - a); return { a: a, b: b, op: '＋', ans: a + b }; }
    if (k < 0.67) { a = U.int(r, 21, 99); b = U.int(r, 3, 9); return { a: a, b: b, op: '−', ans: a - b }; }
    a = U.int(r, 2, 9); b = U.int(r, 2, 9);
    return { a: a, b: b, op: '×', ans: a * b };
  }

  // p: { n, ops: '+' | '+-', max, adult }
  function gen(p, r) {
    var qs = [], guard = 0;
    while (qs.length < p.n && guard++ < 5000) {
      var q = p.adult ? adultQ(r) : kidQ(p, r), last = qs[qs.length - 1];
      if (last && last.a === q.a && last.b === q.b && last.op === q.op) continue;
      if (qs.length >= 2 && q.ans === last.ans && q.ans === qs[qs.length - 2].ans) continue;
      qs.push(q);
    }
    return qs;
  }

  function dots(c, D, x, y, n, color) {
    for (var i = 0; i < n; i++) {
      var col = i % 5, row = Math.floor(i / 5), inRow = Math.min(5, n - row * 5);
      D.circle(c, x + (col - (inRow - 1) / 2) * 13, y + row * 13, 5.2);
      D.paint(c, color, 'rgba(255,255,255,.5)', 1.5);
    }
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var qs = gen(p, api.rnd), i = 0, wrong = 0, mistakes = 0, time = 0, active = false, wait = -1, since = 0;
    var shown = null;               // the answer just written on the board
    var hakase = { mode: 'idle', mt: 0 };
    var B = { x: 16, y: 84, w: 328, h: 200 };
    var pad = api.answerPad({ expect: function () { return qs[i].ans; }, onAnswer: answer });

    function answer(v) {
      if (!active) return;
      var q = qs[i];
      if (v === q.ans) {
        api.ok(B.x + B.w - 64, B.y + 118, 40);
        shown = { v: v, t: 0 };
        hakase.mode = 'happy'; hakase.mt = 0;
        active = false; wait = 0.38;
        i++; wrong = 0; since = 0;
        pad.hint(null);
        api.progress(i, qs.length);
      } else {
        mistakes++; wrong++;
        api.ng(B.x + B.w - 64, B.y + 118, 34);
        pad.shake(v);
        hakase.mode = 'idle';
      }
    }

    return {
      theme: 5,
      begin: function () { active = true; api.progress(0, qs.length); },
      update: function (dt, playing) {
        hakase.mt += dt;
        if (hakase.mode === 'happy' && hakase.mt > 0.8) hakase.mode = 'idle';
        if (shown) shown.t += dt;
        if (!playing) return;
        if (active) {
          time += dt; since += dt;
          if (p.practice && since > 2.6 && !p.adult) pad.hint(qs[i].ans);
        }
        if (wait >= 0) {
          wait -= dt;
          if (wait < 0) {
            shown = null;
            if (i >= qs.length) {
              var score = time + mistakes * 3;
              api.finish({ score: score, acc: U.acc(mistakes, qs.length), text: U.res.time(time, mistakes) });
            } else active = true;
          }
        }
      },
      draw: function (c, clock) {
        A.chalkboard(c, B.x, B.y, B.w, B.h);
        var q = qs[Math.min(i, qs.length - 1)], cur = shown ? qs[i - 1] : q;
        if (!cur) return;
        if (!active && !shown && i === 0) {
          A.text(c, L('よーい…'), B.x + B.w / 2, B.y + B.h / 2, 40, 'rgba(255,255,255,.85)', { stroke: false });
        } else {
          var big = String(cur.a).length > 1 || String(cur.b).length > 1, fs = big ? 50 : 60;
          var xs = big ? [62, 136, 196, 246, 300] : [74, 128, 180, 232, 286], y = B.y + 122;
          var chalk = 'rgba(255,255,255,.95)';
          A.text(c, String(cur.a), B.x + xs[0] - 10, y, fs, chalk, { stroke: false });
          A.text(c, cur.op, B.x + xs[1] - 10, y, fs * 0.8, chalk, { stroke: false });
          A.text(c, String(cur.b), B.x + xs[2] - 10, y, fs, chalk, { stroke: false });
          A.text(c, '＝', B.x + xs[3] - 10, y, fs * 0.8, chalk, { stroke: false });
          var ansTxt = shown ? String(shown.v) : (p.adult && pad.buf ? pad.buf : '？');
          A.text(c, ansTxt, B.x + xs[4] - 6, y, fs, shown ? '#ffb3d1' : (pad.buf ? '#fff2a8' : 'rgba(255,255,255,.75)'), { stroke: false });
          var showDots = !p.adult && cur.ans <= 10 && cur.a <= 10 && (p.dots || wrong >= 2 || p.practice);
          if (showDots) {
            dots(c, D, B.x + xs[0] - 10, B.y + 46, cur.a, '#ffe066');
            dots(c, D, B.x + xs[2] - 10, B.y + 46, cur.b, '#9ee0ff');
          }
        }
        c.save(); c.translate(292, 398); c.scale(0.72, 0.72);
        D.critter(c, { x: 0, y: 0, t: clock, kind: 'frog', look: { x: -120, y: -150 }, mode: hakase.mode, mt: hakase.mt, wear: A.hakase });
        c.restore();
      },
      peek: function () { return active && qs[i] ? qs[i].ans : null; },   // for playtesting
      end: function () {}
    };
  }

  T.register({
    id: 'keisan', name: 'けいさん', orig: '計算25', kind: 'time',
    help: 'しきを みて こたえの\nすうじを タッチしてね！',
    levels: {
      e: { n: 10, ops: '+', max: 5, dots: true },
      n: { n: 10, ops: '+', max: 10 },
      h: { n: 10, ops: '+-', max: 10 },
      a: { n: 25 },
      test: { n: 10, ops: '+', max: 10 },
      testA: { n: 20 },
      practice: { n: 3, dots: true }
    },
    ranks: {
      e: [22, 28, 36, 46, 60, 80], n: [20, 26, 34, 44, 58, 80], h: [24, 30, 38, 50, 65, 90],
      a: [30, 38, 46, 56, 70, 90], test: [20, 26, 34, 44, 58, 80], testA: [24, 30, 37, 45, 56, 72]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art;
      A.chalkboard(c, 8, 18, 84, 62);
      A.text(c, '2+3', 50, 50, 26, '#fff', { stroke: false });
      c.save(); c.translate(76, 84); c.rotate(-0.6 + Math.sin((t || 0) * 3) * 0.1);
      G.Draw.roundRect(c, -4, -22, 8, 24, 3); G.Draw.paint(c, '#fff', G.Draw.INK, 2);
      c.restore();
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
