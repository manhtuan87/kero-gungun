/* なにが あった？ — only in the daily check.
   Look at some pictures for a while, then pick out the ones you saw among more pictures. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};

  function pool() { return G.Pics ? G.Pics.ids : require('../data.js').PICS.map(function (x) { return x.id; }); }
  // p: { show (pictures to remember), total (pictures to choose from), time (seconds to look) }
  function gen(p, r, ids) {
    var all = U.fresh(r, ids || pool(), p.total, p.recent);   // (pictures shown lately come last)
    return { targets: all.slice(0, p.show), grid: U.shuffle(r, all) };
  }
  function layout(n, top, bottom) {
    var cols = n <= 6 ? 3 : n <= 12 ? 4 : 5, rows = Math.ceil(n / cols);
    var size = Math.min((340 - (cols - 1) * 8) / cols, (bottom - top - (rows - 1) * 8) / rows);
    var x0 = 180 - (cols * size + (cols - 1) * 8) / 2, out = [];
    for (var i = 0; i < n; i++) out.push({ x: x0 + (i % cols) * (size + 8), y: top + Math.floor(i / cols) * (size + 8), s: size });
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art, P = G.Pics;
    var g = gen(p, api.rnd), phase = 'wait', pt = 0, chosen = [], hits = 0, wrong = 0, clock = 0;
    var showCells = layout(g.targets.length, 130, 470), gridCells = layout(g.grid.length, 120, 560);
    api.used(g.targets);
    var doneBtn = null;

    function recall() {
      phase = 'recall'; pt = 0;
      if (doneBtn) { doneBtn.remove(); doneBtn = null; }
      api.speak(L('さっき みた えを {n}まい えらんでね', { n: g.targets.length }));
    }
    function finish() {
      phase = 'end';
      var score = Math.max(0, hits - wrong);
      api.finish({ score: score, text: U.res.pick(hits, wrong, g.targets.length), delay: 900 });
    }

    return {
      theme: 0,
      begin: function () {
        phase = 'look'; pt = 0;
        api.speak(L('えを よく おぼえてね'));
        doneBtn = api.bigButton(L('おぼえた！'), function () { if (phase === 'look') recall(); }, { x: 90, y: 540, w: 180, h: 64, size: 24 });
      },
      update: function (dt, playing) {
        clock += dt; pt += dt;
        if (!playing) return;
        if (phase === 'look' && pt >= p.time) recall();
        else if (phase === 'recall' && p.practice && pt > 2.5) {
          var next = -1;
          for (var i = 0; i < g.grid.length; i++) if (g.targets.indexOf(g.grid[i]) >= 0 && chosen.indexOf(i) < 0) { next = i; break; }
          if (next >= 0) api.hand(gridCells[next].x + gridCells[next].s / 2, gridCells[next].y + gridCells[next].s / 2);
        }
      },
      draw: function (c) {
        if (phase === 'wait' || phase === 'look') {
          A.text(c, L('この えを おぼえてね！'), 180, 86, 23, '#fff', { lw: 6 });
          var left = phase === 'look' ? Math.max(0, 1 - pt / p.time) : 1;
          D.roundRect(c, 60, 104, 240, 14, 7); D.paint(c, 'rgba(255,255,255,.75)', D.INK, 2.5);
          if (left > 0.01) { D.roundRect(c, 62, 106, 236 * left, 10, 5); D.paint(c, '#ffb347'); }
          if (phase === 'look') g.targets.forEach(function (id, i) {
            var q = showCells[i];
            A.card(c, q.x, q.y, q.s, q.s, '#c2e8ff');
            P.draw(c, id, q.x + q.s / 2, q.y + q.s / 2, q.s * 0.72, clock);
          });
          return;
        }
        A.text(c, L('みた えを えらんでね（{a} / {b}）', { a: chosen.length, b: g.targets.length }), 180, 86, 20, '#fff', { lw: 6 });
        g.grid.forEach(function (id, i) {
          var q = gridCells[i], on = chosen.indexOf(i) >= 0, hit = g.targets.indexOf(id) >= 0;
          A.card(c, q.x, q.y, q.s, q.s, on ? '#ffd23d' : '#e8e0d6');
          P.draw(c, id, q.x + q.s / 2, q.y + q.s / 2, q.s * 0.72, clock);
          if (phase === 'end') {
            if (on && hit) A.maru(c, q.x + q.s / 2, q.y + q.s / 2, q.s * 0.36, 0.9);
            else if (on) A.batsu(c, q.x + q.s / 2, q.y + q.s / 2, q.s * 0.3, 0.9);
            else if (hit) { c.save(); c.globalAlpha = 0.5; A.maru(c, q.x + q.s / 2, q.y + q.s / 2, q.s * 0.36); c.restore(); }
          } else if (on) {   // (chosen: ○ or × at once)
            if (hit) A.maru(c, q.x + q.s / 2, q.y + q.s / 2, q.s * 0.36, 0.9);
            else A.batsu(c, q.x + q.s / 2, q.y + q.s / 2, q.s * 0.3, 0.9);
          }
        });
      },
      down: function (q) {
        if (phase !== 'recall') return;
        for (var i = 0; i < gridCells.length; i++) {
          var cl = gridCells[i];
          if (q.x < cl.x || q.y < cl.y || q.x > cl.x + cl.s || q.y > cl.y + cl.s) continue;
          var k = chosen.indexOf(i);
          if (k >= 0) return;   // (a choice is final: its sound has told whether it was right)
          chosen.push(i); api.hand(null);
          if (g.targets.indexOf(g.grid[i]) >= 0) { hits++; api.sfx('ok'); } else { wrong++; api.sfx('ng'); }
          if (chosen.length >= g.targets.length) finish();
          return;
        }
      },
      peek: function () {   // for playtesting
        if (phase === 'look') return { skip: true };
        if (phase !== 'recall') return null;
        for (var i = 0; i < g.grid.length; i++) if (g.targets.indexOf(g.grid[i]) >= 0 && chosen.indexOf(i) < 0) return { x: gridCells[i].x + 10, y: gridCells[i].y + 10 };
        return null;
      },
      skip: function () { if (phase === 'look') recall(); },
      end: function () {}
    };
  }

  T.register({
    id: 'nanika', name: 'なにが あった？', kind: 'count', checkOnly: true, pool: 'pics',
    help: 'えを よく おぼえてね！\nそのあと たくさんの えの なかから\nみた えを えらぶよ',
    levels: {
      test: { show: 6, total: 12, time: 15 },
      testA: { show: 10, total: 20, time: 20 },
      practice: { show: 3, total: 6, time: 8 }
    },
    ranks: { test: [6, 5, 4, 3, 2, 1], testA: [10, 9, 8, 6, 4, 2] },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art, P = G.Pics;
      [['star', 12, 14], ['fish', 52, 14], ['apple', 12, 54], ['car', 52, 54]].forEach(function (x, i) {
        A.card(c, x[1], x[2], 36, 36, i === 1 ? '#ffd23d' : '#e8e0d6');
        P.draw(c, x[0], x[1] + 18, x[2] + 18, 26, t || 0);
      });
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
