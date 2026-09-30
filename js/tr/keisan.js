/* けいさん (the original: 計算25 / 計算100) — answer the sums on the chalkboard as fast as you can.
   Children tap the answer (0-10); grown-ups type it (25 sums with two-digit numbers and times tables).
   おに: children get three numbers (3 ＋ 4 − 2, worked out from the left, every step from 0 to 10); grown-ups get
   two-digit sums that carry, take-aways that borrow, two-digit times one-digit, and divisions. */
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
  // 計算20 and 計算100 of the original: one-digit numbers (a take-away starts from a sum of two of them)
  function singleQ(r) {
    var k = r(), a = U.int(r, 1, 9), b = U.int(r, 1, 9);
    if (k < 0.34) return { a: a, b: b, op: '＋', ans: a + b };
    if (k < 0.67) return { a: a + b, b: b, op: '−', ans: a };
    return { a: a, b: b, op: '×', ans: a * b };
  }
  // 計算25 of the original: two-digit numbers too, and the times tables
  function adultQ(r) {
    var k = r(), a, b;
    if (k < 0.34) { a = U.int(r, 12, 89); b = Math.min(U.int(r, 3, 9), 99 - a); return { a: a, b: b, op: '＋', ans: a + b }; }
    if (k < 0.67) { a = U.int(r, 21, 99); b = U.int(r, 3, 9); return { a: a, b: b, op: '−', ans: a - b }; }
    a = U.int(r, 2, 9); b = U.int(r, 2, 9);
    return { a: a, b: b, op: '×', ans: a * b };
  }

  // おに (children): a ± b ± c, from the left, every step from 0 to 10
  function threeQ(r) {
    for (var t = 0; t < 200; t++) {
      var a = U.int(r, 1, 9), b = U.int(r, 1, 9), c = U.int(r, 1, 9), o1 = r() < 0.5 ? '＋' : '−', o2 = r() < 0.5 ? '＋' : '−';
      var m = o1 === '＋' ? a + b : a - b, ans = o2 === '＋' ? m + c : m - c;
      if (m < 0 || m > 10 || ans < 0 || ans > 10) continue;
      return { a: a, b: b, c: c, op: o1, op2: o2, ans: ans };
    }
    return { a: 3, b: 4, c: 2, op: '＋', op2: '−', ans: 5 };
  }
  // おに (grown-ups): 47 ＋ 38 (a carry), 83 − 47 (a borrow), 23 × 4, 84 ÷ 7
  function hardQ(r) {
    var k = r(), a, b;
    if (k < 0.25) { do { a = U.int(r, 15, 79); b = U.int(r, 12, 99 - a); } while (a % 10 + b % 10 < 10); return { a: a, b: b, op: '＋', ans: a + b }; }
    if (k < 0.5) { do { a = U.int(r, 31, 98); b = U.int(r, 12, a - 10); } while (a % 10 >= b % 10); return { a: a, b: b, op: '−', ans: a - b }; }
    if (k < 0.75) { a = U.int(r, 12, 49); b = U.int(r, 3, 9); return { a: a, b: b, op: '×', ans: a * b }; }
    b = U.int(r, 3, 9); var q = U.int(r, 4, 19);
    return { a: b * q, b: b, op: '÷', ans: q };
  }

  // p: { n, ops: '+' | '+-', max, adult, single (one-digit numbers only) }; おに: three (children), hard (grown-ups)
  // A sum comes only once in a run while there are others left (the smallest levels have only a few).
  function gen(p, r) {
    var qs = [], guard = 0, seen = {};
    while (qs.length < p.n && guard++ < 5000) {
      var q = p.three ? threeQ(r) : p.hard ? hardQ(r) : p.single ? singleQ(r) : p.adult ? adultQ(r) : kidQ(p, r), last = qs[qs.length - 1];
      var key = q.a + q.op + q.b + (q.c != null ? q.op2 + q.c : '');
      if (last && last.a === q.a && last.b === q.b && last.op === q.op && last.c === q.c) continue;
      if (seen[key] && guard < 3000) continue;
      if (qs.length >= 2 && q.ans === last.ans && q.ans === qs[qs.length - 2].ans) continue;
      qs.push(q); seen[key] = true;
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
        } else if (cur.c != null) {   // (おに: three numbers)
          var xs3 = [46, 92, 138, 184, 230, 272, 312], y3 = B.y + 122, fs3 = 50, ch3 = 'rgba(255,255,255,.95)';
          [String(cur.a), cur.op, String(cur.b), cur.op2, String(cur.c), '＝'].forEach(function (tk, k) {
            A.text(c, tk, B.x + xs3[k] - 10, y3, k % 2 ? fs3 * 0.8 : fs3, ch3, { stroke: false });
          });
          var ans3 = shown ? String(shown.v) : '？';
          A.text(c, ans3, B.x + xs3[6] - 6, y3, fs3, shown ? '#ffb3d1' : 'rgba(255,255,255,.75)', { stroke: false });
          if (!p.adult && (wrong >= 2 || p.practice)) {
            dots(c, D, B.x + xs3[0] - 10, B.y + 46, cur.a, '#ffe066');
            dots(c, D, B.x + xs3[2] - 10, B.y + 46, cur.b, '#9ee0ff');
            dots(c, D, B.x + xs3[4] - 10, B.y + 46, cur.c, '#ffb3d1');
          }
        } else {
          var big = String(cur.a).length > 1 || String(cur.b).length > 1, fs = big ? 50 : 60;
          var xs = big ? [62, 136, 196, 246, 300] : [74, 128, 180, 232, 286], y = B.y + 122;
          var chalk = 'rgba(255,255,255,.95)';
          A.text(c, String(cur.a), B.x + xs[0] - 10, y, fs, chalk, { stroke: false });
          A.text(c, cur.op, B.x + xs[1] - 10, y, fs * 0.8, chalk, { stroke: false });
          A.text(c, String(cur.b), B.x + xs[2] - 10, y, fs, chalk, { stroke: false });
          A.text(c, '＝', B.x + xs[3] - 10, y, fs * 0.8, chalk, { stroke: false });
          var ansTxt = shown ? String(shown.v) : (p.adult && pad.buf ? pad.buf : '？');
          A.text(c, ansTxt, B.x + xs[4] - 6, y, String(ansTxt).length > 2 ? fs * 0.8 : fs, shown ? '#ffb3d1' : (pad.buf ? '#fff2a8' : 'rgba(255,255,255,.75)'), { stroke: false });
          var showDots = !p.adult && cur.ans <= 10 && cur.a <= 10 && (p.dots || wrong >= 2 || p.practice);
          if (showDots) {
            dots(c, D, B.x + xs[0] - 10, B.y + 46, cur.a, '#ffe066');
            dots(c, D, B.x + xs[2] - 10, B.y + 46, cur.b, '#9ee0ff');
          }
        }
        c.save(); c.translate(292, 398); c.scale(0.72, 0.72);
        D.critter(c, { x: 0, y: 0, t: clock, kind: 'frog', look: { x: -120, y: -150 }, mode: hakase.mode, mt: hakase.mt, wear: p.oni ? A.hakaseOni : A.hakase });
        c.restore();
      },
      peek: function () { return active && qs[i] ? qs[i].ans : null; },   // for playtesting
      end: function () {}
    };
  }

  T.register({
    id: 'keisan', name: 'けいさん', orig: '計算25', kind: 'time',
    help: 'しきを みて こたえの\nすうじを タッチしてね！',
    oniHelp: '3つの かずの しきだよ。\nまえから じゅんばんに けいさんしてね！',
    oniHelpA: '2けたの かけざんや わりざんも でるよ。\nできるだけ はやく こたえてね！',
    levels: {
      e: { n: 10, ops: '+', max: 5, dots: true },
      n: { n: 10, ops: '+', max: 10 },
      h: { n: 10, ops: '+-', max: 10 },
      o: { n: 10, three: true },
      ae: { n: 20, single: true },
      a: { n: 25 },
      ah: { n: 100, single: true },
      ao: { n: 25, hard: true },
      test: { n: 10, ops: '+', max: 10 },
      testA: { n: 20 },
      practice: { n: 3, dots: true },
      practiceO: { n: 3, three: true },
      practiceAO: { n: 3, hard: true }
    },
    ranks: {
      e: [22, 28, 36, 46, 60, 80], n: [20, 26, 34, 44, 58, 80], h: [24, 30, 38, 50, 65, 90], o: [34, 42, 54, 70, 92, 125],
      ae: [14, 18, 23, 29, 37, 50], a: [30, 38, 46, 56, 70, 90], ah: [75, 95, 120, 150, 190, 250], ao: [60, 75, 92, 115, 145, 190],
      test: [20, 26, 34, 44, 58, 80], testA: [24, 30, 37, 45, 56, 72]
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
