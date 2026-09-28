/* ぱっと おぼえて (the original: 瞬間記憶) — eggs with numbers appear for a moment, then turn around.
   Tap them from 1 upward; each right egg hatches a chick. Tapping early hides the numbers at once. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var COLS = 4, ROWS = 5, CELL = 78, X0 = 24, Y0 = 112;

  function cellXY(k) { return { x: X0 + (k % COLS + 0.5) * CELL, y: Y0 + (Math.floor(k / COLS) + 0.5) * CELL }; }

  // p: { rounds, k (eggs), show (seconds) }. cells[j] holds the number j + 1.
  function gen(p, r) {
    var out = [];
    for (var i = 0; i < p.rounds; i++) {
      var cells = U.sample(r, U.range(0, COLS * ROWS - 1), p.k);
      out.push({ cells: cells, colors: cells.map(function () { return U.int(r, 0, 5); }) });
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var rounds = gen(p, api.rnd), ri = -1, phase = 'wait', pt = 0, nextN = 1, cleared = 0, since = 0;
    var eggs = [], chicks = [];

    function startRound() {
      ri++;
      api.hand(null);
      if (ri >= rounds.length) {
        phase = 'end';
        api.finish({ score: cleared, acc: cleared / rounds.length, text: U.res.right(cleared, rounds.length) });
        return;
      }
      var R = rounds[ri];
      nextN = 1; phase = 'appear'; pt = 0; since = 0;
      eggs = R.cells.map(function (cell, j) {
        var q = cellXY(cell);
        return { n: j + 1, x: q.x, y: q.y, kind: R.colors[j], state: 'egg', flip: 0, target: 0, pop: -j * 0.06, hatchT: 0 };
      });
      api.progress(ri, rounds.length);
      api.sfx('pop');
    }
    function hideAll() {
      eggs.forEach(function (e) { if (e.state === 'egg') e.target = 1; });
      api.sfx('flip');
    }
    function eggNo(n) { for (var k = 0; k < eggs.length; k++) if (eggs[k].n === n) return eggs[k]; return null; }
    function tapEgg(e) {
      if (phase === 'show') { phase = 'input'; pt = 0; hideAll(); }
      if (phase !== 'input' || e.state !== 'egg') return;
      if (e.n === nextN) {
        e.state = 'hatched'; e.hatchT = 0;
        chicks.push({ x: e.x, y: e.y - 6, vy: -110, t: 0, shell: e.kind });
        api.sfx('crack', nextN);
        api.burst(e.x, e.y, 6, '#fff6a8');
        nextN++; since = 0; api.hand(null);
        if (nextN > eggs.length) {
          cleared++;
          phase = 'good'; pt = 0;
          api.ok(180, 300, 64);
          api.progress(ri + 1, rounds.length);
        }
      } else {
        api.ng(e.x, e.y, 32);
        e.state = 'wrong';
        eggs.forEach(function (x) { if (x.state !== 'hatched') x.target = 0; });
        phase = 'bad'; pt = 0;
        api.progress(ri + 1, rounds.length);
      }
    }

    return {
      theme: 0,
      begin: startRound,
      update: function (dt, playing) {
        pt += dt;
        eggs.forEach(function (e) {
          e.pop = Math.min(1, e.pop + dt * 5);
          e.flip += (e.target - e.flip) * Math.min(1, dt * 11);
          if (e.state === 'hatched') e.hatchT += dt;
        });
        chicks.forEach(function (ch) { ch.t += dt; ch.y += ch.vy * dt; ch.vy -= 40 * dt; });
        chicks = chicks.filter(function (ch) { return ch.t < 1.5; });
        if (!playing) return;
        if (phase === 'appear' && pt > 0.35) { phase = 'show'; pt = 0; }
        else if (phase === 'show' && pt > p.show) { phase = 'input'; pt = 0; hideAll(); }
        else if (phase === 'input') {
          since += dt;
          if (p.practice && since > 2.2) { var e = eggNo(nextN); if (e) api.hand(e.x + 6, e.y + 8); }
        }
        else if (phase === 'good' && pt > 0.9) startRound();
        else if (phase === 'bad' && pt > 1.5) startRound();
      },
      draw: function (c, clock) {
        c.save();
        c.fillStyle = 'rgba(255,255,255,.35)';
        for (var k = 0; k < COLS * ROWS; k++) {
          var q = cellXY(k);
          D.roundRect(c, q.x - CELL / 2 + 4, q.y - CELL / 2 + 4, CELL - 8, CELL - 8, 16); c.fill();
        }
        c.restore();
        if (phase === 'show' || phase === 'appear') {
          var left = phase === 'show' ? Math.max(0, 1 - pt / p.show) : 1;
          A.text(c, L('おぼえてね！'), 180, 84, 24, '#fff', { lw: 6 });
          D.roundRect(c, 60, 535, 240, 16, 8); D.paint(c, 'rgba(255,255,255,.7)', D.INK, 2.5);
          if (left > 0.02) { D.roundRect(c, 62, 537, 236 * left, 12, 6); D.paint(c, '#ffb347'); }
        } else if (phase === 'input') {
          A.text(c, L('1から じゅんばんに タッチ！'), 180, 84, 21, '#fff', { lw: 6 });
        } else if (phase === 'bad') {
          A.text(c, L('ざんねん！ こたえは これ'), 180, 84, 21, '#fff', { lw: 6 });
        }
        eggs.forEach(function (e) {
          if (e.pop <= 0) return;
          if (e.state === 'hatched') {
            c.save(); c.globalAlpha = Math.max(0, 1 - e.hatchT * 1.5);
            D.eggHalf(c, e.kind, e.x, e.y + 8, 30, 0, false, clock);
            c.restore();
            return;
          }
          c.save(); c.translate(e.x, e.y);
          var s = e.pop < 1 ? 0.4 + 0.6 * e.pop + Math.sin(e.pop * Math.PI) * 0.15 : 1;
          c.scale(s, s);
          if (e.state === 'wrong') { D.circle(c, 0, 0, 38); D.paint(c, 'rgba(79,141,255,.25)'); }
          A.numberEgg(c, e.kind, 0, 0, 30, e.n, e.flip, clock);
          c.restore();
        });
        chicks.forEach(function (ch) { D.chick(c, ch.x, ch.y, 0.9, clock, { fly: true, flap: ch.t * 26, shell: ch.shell, happy: true }); });
      },
      peek: function () {   // for playtesting: where the next egg is
        if (phase !== 'show' && phase !== 'input') return null;
        var e = eggNo(nextN);
        return e ? { x: e.x, y: e.y } : null;
      },
      down: function (pt2) {
        for (var k = 0; k < eggs.length; k++) {
          var e = eggs[k], dx = pt2.x - e.x, dy = pt2.y - e.y;
          if (dx * dx + dy * dy < 36 * 36 && e.state === 'egg') { tapEgg(e); return; }
        }
      }
    };
  }

  T.register({
    id: 'patto', name: 'ぱっと おぼえて', orig: '瞬間記憶', kind: 'count',
    help: 'たまごの すうじを ぱっと おぼえて\n1から じゅんばんに タッチしてね！',
    levels: {
      e: { rounds: 8, k: 3, show: 3.0 },
      n: { rounds: 8, k: 4, show: 2.5 },
      h: { rounds: 8, k: 5, show: 2.0 },
      a: { rounds: 8, k: 7, show: 1.5 },
      test: { rounds: 6, k: 4, show: 2.5 },
      testA: { rounds: 6, k: 6, show: 1.5 },
      practice: { rounds: 2, k: 2, show: 4 }
    },
    ranks: {
      e: [8, 7, 6, 5, 4, 2], n: [8, 7, 6, 5, 4, 2], h: [8, 7, 6, 5, 4, 2],
      a: [8, 7, 6, 5, 3, 2], test: [6, 5, 4, 3, 2, 1], testA: [6, 5, 4, 3, 2, 1]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art, b = Math.sin((t || 0) * 3);
      A.numberEgg(c, 0, 26, 64, 19, 1, 0, 0);
      A.numberEgg(c, 2, 74, 62, 19, 2, 0, 0);
      A.numberEgg(c, 3, 50, 30 + b * 2, 19, 3, Math.max(0, b) * 0.4, 0);
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
