/* いちばん おおきい かず (the original: 最高数字テスト) — balloons with numbers float up;
   pop the one with the biggest number. From ふつう on, the balloon sizes do not match the numbers. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var BOX = { x0: 62, y0: 150, x1: 298, y1: 500 };

  // p: { rounds, k (balloons), max, sizes (sizes vary, often misleading), move }
  function gen(p, r) {
    var out = [];
    for (var i = 0; i < p.rounds; i++) {
      var nums = U.sample(r, U.range(1, p.max), p.k);
      var radii = nums.map(function () { return p.sizes ? U.int(r, 30, 46) : 38; });
      if (p.sizes && r() < 0.65) {
        // the biggest number gets a small balloon, a smaller number the biggest one
        var top = nums.indexOf(Math.max.apply(null, nums)), other = (top + 1 + U.int(r, 0, p.k - 2)) % p.k;
        radii[top] = U.int(r, 28, 32); radii[other] = 46;
      }
      var pts = U.scatter(r, p.k, BOX, 98) || U.scatter(r, p.k, BOX, 80);
      out.push({
        balloons: nums.map(function (n, j) {
          return { n: n, r: radii[j], x: pts[j].x, y: pts[j].y, color: j % 6, seed: r() * 6 };
        }),
        answer: Math.max.apply(null, nums)
      });
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var rounds = gen(p, api.rnd), ri = -1, cur = null, phase = 'wait', pt = 0, time = 0, mistakes = 0, since = 0;

    function next() {
      ri++;
      api.hand(null);
      if (ri >= rounds.length) {
        phase = 'end';
        api.finish({ score: time + mistakes * 2, text: U.fmtTime(time) + (mistakes ? '・まちがい ' + mistakes : '') });
        return;
      }
      cur = rounds[ri];
      cur.balloons.forEach(function (b) { b.popped = false; b.wob = 0; b.off = 0; });
      phase = 'in'; pt = 0; since = 0;
      api.progress(ri, rounds.length);
    }
    function pos(b) {
      var rise = phase === 'in' ? (1 - Math.min(1, pt / 0.35)) * 300 : 0;
      var away = phase === 'out' ? -Math.pow(pt / 0.4, 2) * 420 : 0;
      var dx = 0, dy = 0;
      if (p.move) { dx = Math.sin(clockT * 0.9 + b.seed) * 16; dy = Math.cos(clockT * 0.7 + b.seed * 1.3) * 12; }
      return { x: b.x + dx + b.wob, y: b.y + dy + rise + (b.popped ? 0 : away) };
    }
    var clockT = 0;

    return {
      theme: 0,
      begin: next,
      update: function (dt, playing) {
        pt += dt; clockT += dt;
        if (cur) cur.balloons.forEach(function (b) { if (b.shake > 0) { b.shake -= dt; b.wob = Math.sin(b.shake * 50) * 6; } else b.wob = 0; });
        if (!playing) return;
        if (phase === 'in' && pt > 0.35) { phase = 'play'; pt = 0; }
        else if (phase === 'play') {
          time += dt; since += dt;
          if (p.practice && since > 2.2) {
            cur.balloons.forEach(function (b) { if (b.n === cur.answer) { var q = pos(b); api.hand(q.x + 6, q.y + 10); } });
          }
        } else if (phase === 'out' && pt > 0.45) next();
      },
      draw: function (c, clock) {
        A.text(c, 'いちばん おおきい かずは どれ？', 180, 100, 21, '#fff', { lw: 6 });
        if (!cur) return;
        cur.balloons.forEach(function (b) {
          if (b.popped) return;
          var q = pos(b);
          A.balloon(c, q.x, q.y, b.r, A.BALLOONS[b.color], clock, b.n, { still: !!p.move });
        });
      },
      down: function (q) {
        if (phase !== 'play') return;
        for (var k = cur.balloons.length - 1; k >= 0; k--) {
          var b = cur.balloons[k], at = pos(b), dx = (q.x - at.x) / (b.r * 0.9 + 6), dy = (q.y - at.y) / (b.r + 6);
          if (dx * dx + dy * dy > 1) continue;
          if (b.n === cur.answer) {
            b.popped = true;
            api.sfx('pop');
            api.burst(at.x, at.y, 12, A.BALLOONS[b.color], 'dot');
            api.burst(at.x, at.y, 6, '#fff6a8');
            api.ok(at.x, at.y, b.r + 8);
            phase = 'out'; pt = 0;
            api.progress(ri + 1, rounds.length);
          } else {
            mistakes++;
            b.shake = 0.3;
            api.ng(at.x, at.y, b.r);
          }
          return;
        }
      },
      peek: function () {   // for playtesting
        if (phase !== 'play') return null;
        for (var k = 0; k < cur.balloons.length; k++) if (cur.balloons[k].n === cur.answer) return pos(cur.balloons[k]);
        return null;
      }
    };
  }

  T.register({
    id: 'ookii', name: 'いちばん おおきい かず', orig: '最高数字テスト', kind: 'time',
    help: 'ふうせんの なかで\nいちばん おおきい かずを タッチ！\nふうせんの おおきさに だまされないでね',
    levels: {
      e: { rounds: 10, k: 3, max: 9, sizes: false, move: false },
      n: { rounds: 10, k: 4, max: 9, sizes: true, move: false },
      h: { rounds: 10, k: 5, max: 20, sizes: true, move: true },
      a: { rounds: 15, k: 6, max: 99, sizes: true, move: true },
      test: { rounds: 10, k: 4, max: 9, sizes: true, move: false },
      testA: { rounds: 12, k: 6, max: 99, sizes: true, move: true },
      practice: { rounds: 3 }
    },
    ranks: {
      e: [9, 12, 15, 19, 25, 34], n: [11, 14, 18, 23, 30, 40], h: [14, 18, 23, 29, 37, 50],
      a: [14, 17, 21, 26, 32, 42], test: [11, 14, 18, 23, 30, 40], testA: [12, 15, 18, 22, 28, 36]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art;
      A.balloon(c, 30, 42, 17, A.BALLOONS[2], t || 0, 3, { still: true });
      A.balloon(c, 72, 36, 13, A.BALLOONS[0], t || 0, 9, { still: true });
      A.balloon(c, 52, 64, 19, A.BALLOONS[1], t || 0, 5, { still: true });
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
