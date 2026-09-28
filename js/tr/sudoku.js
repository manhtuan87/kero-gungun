/* えあわせ すうどく (the original: 数独) — a 4 x 4 grid of eggs; grown-ups play the original's 9 x 9 with numbers
   (おとな かんたん・ふつう・むずかしい = 初級・中級・上級, by the number of empty cells).
   Every row, column and box holds each colour (number) once. Tap an empty cell, then the egg for it.
   Only puzzles with exactly one answer are used. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};

  function boxOf(size) { return size === 9 ? { w: 3, h: 3 } : size === 6 ? { w: 3, h: 2 } : { w: 2, h: 2 }; }
  function okAt(g, size, bx, idx, v) {
    var r = Math.floor(idx / size), c = idx % size;
    for (var k = 0; k < size; k++) { if (g[r * size + k] === v || g[k * size + c] === v) return false; }
    var r0 = r - r % bx.h, c0 = c - c % bx.w;
    for (var dr = 0; dr < bx.h; dr++) for (var dc = 0; dc < bx.w; dc++) if (g[(r0 + dr) * size + c0 + dc] === v) return false;
    return true;
  }
  // Fills the grid (0 = empty) randomly; returns false if impossible.
  function fill(g, size, bx, r) {
    var idx = g.indexOf(0);
    if (idx < 0) return true;
    var vals = U.shuffle(r, U.range(1, size));
    for (var i = 0; i < vals.length; i++) {
      if (okAt(g, size, bx, idx, vals[i])) { g[idx] = vals[i]; if (fill(g, size, bx, r)) return true; g[idx] = 0; }
    }
    return false;
  }
  // Number of solutions, counting at most `limit` (the empty cell with the fewest choices first, so 9 x 9 is quick too).
  function count(g, size, bx, limit) {
    var best = -1, vals = null;
    for (var idx = 0; idx < g.length; idx++) {
      if (g[idx] !== 0) continue;
      var can = [];
      for (var v = 1; v <= size; v++) if (okAt(g, size, bx, idx, v)) can.push(v);
      if (!can.length) return 0;
      if (!vals || can.length < vals.length) { best = idx; vals = can; if (can.length === 1) break; }
    }
    if (best < 0) return 1;
    var n = 0;
    for (var i = 0; i < vals.length && n < limit; i++) { g[best] = vals[i]; n += count(g, size, bx, limit - n); }
    g[best] = 0;
    return n;
  }
  function puzzle(size, blanks, r) {
    var bx = boxOf(size);
    for (var tries = 0; tries < 40; tries++) {
      var sol = []; for (var i = 0; i < size * size; i++) sol.push(0);
      fill(sol, size, bx, r);
      var grid = sol.slice(), order = U.shuffle(r, U.range(0, size * size - 1)), made = 0;
      for (var k = 0; k < order.length && made < blanks; k++) {
        var at = order[k], keep = grid[at];
        grid[at] = 0;
        if (count(grid.slice(), size, bx, 2) === 1) made++; else grid[at] = keep;
      }
      if (made === blanks) return { size: size, box: bx, sol: sol, grid: grid };
    }
    return null;
  }
  // p: { q, size, blanks }
  function gen(p, r) { var out = []; for (var i = 0; i < p.q; i++) out.push(puzzle(p.size, U.span(r, p.blanks), r)); return out; }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var qs = gen(p, api.rnd), qi = -1, Q = null, grid = null, sel = -1, held = 0, time = 0, mistakes = 0, phase = 'wait', pt = 0, since = 0;
    var blanks = qs.reduce(function (n, q) { return n + q.grid.filter(function (v) { return v === 0; }).length; }, 0);   // cells to fill
    var pops = {}, clock = 0, chicks = [];
    var size = p.size, nums = size === 9, cell = nums ? 36 : size === 6 ? 50 : 70, gx = (360 - cell * size) / 2, gy = 104;
    var items = [];
    for (var v = 1; v <= size; v++) {
      (function (val) {
        items.push(nums ? { label: String(val), size: 30 } : { draw: function (c, w, h) { D.egg(c, val - 1, w / 2, h / 2, Math.min(w, h) * 0.34, 0, 0); } });
      }(v));
    }
    var pal = api.choices(items, pick, nums ? { top: 446, h: 60, cols: 5, gap: 8, left: 16, right: 16 } :
      { top: size === 6 ? 440 : 470, h: size === 6 ? 70 : 84, cols: size === 6 ? 3 : 4, gap: 10, left: 22, right: 22 });

    function next() {
      qi++;
      api.hand(null);
      if (qi >= qs.length) {
        phase = 'end';
        api.finish({ score: time + mistakes * 5, acc: U.acc(mistakes, blanks), text: U.res.time(time, mistakes) });
        return;
      }
      Q = qs[qi]; grid = Q.grid.slice(); sel = firstEmpty(); held = 0; phase = 'play'; pt = 0; since = 0; pops = {};
      api.progress(qi, qs.length);
    }
    function firstEmpty() { return grid.indexOf(0); }
    function place(idx, val) {
      if (grid[idx] !== 0) return;
      if (Q.sol[idx] === val) {
        grid[idx] = val; pops[idx] = 0; since = 0; held = 0; pal.hint(-1);
        api.sfx('place');
        if (grid.indexOf(0) < 0) {
          phase = 'done'; pt = 0;
          api.ok(180, gy + cell * size / 2, 80);
          for (var k = 0; k < grid.length; k++) {
            if (nums && k % 7) continue;   // (9 x 9: a few chicks, not 81)
            var cx = gx + (k % size + 0.5) * cell, cy = gy + (Math.floor(k / size) + 0.5) * cell;
            chicks.push({ x: cx, y: cy, vy: -80 - Math.random() * 60, t: -Math.random() * 0.4, shell: (grid[k] - 1) % 6 });
          }
          api.sfx('crack', 3);
          api.progress(qi + 1, qs.length);
        } else sel = firstEmpty();   // the next empty cell is ready to fill
      } else {
        mistakes++;
        api.ng(gx + (idx % size + 0.5) * cell, gy + (Math.floor(idx / size) + 0.5) * cell, cell * 0.38);
        pal.shake(val - 1);
      }
    }
    function pick(i) {
      if (phase !== 'play') return;
      if (sel >= 0 && grid[sel] === 0) place(sel, i + 1);
      else { held = i + 1; api.sfx('select'); }
    }

    return {
      theme: 4,
      begin: next,
      update: function (dt, playing) {
        clock += dt; pt += dt;
        Object.keys(pops).forEach(function (k) { pops[k] += dt; });
        chicks.forEach(function (ch) { ch.t += dt; if (ch.t > 0) { ch.y += ch.vy * dt; ch.vy -= 30 * dt; } });
        chicks = chicks.filter(function (ch) { return ch.t < 1.6; });
        if (!playing) return;
        if (phase === 'play') {
          time += dt; since += dt;
          if (p.practice && since > 2.2) {
            var idx = sel >= 0 && grid[sel] === 0 ? sel : firstEmpty();
            if (idx >= 0) { sel = idx; pal.hint(Q.sol[idx] - 1); }
          }
        } else if (phase === 'done' && pt > 1.6) next();
      },
      draw: function (c) {
        A.text(c, L(nums ? 'たて・よこ・へやに おなじ すうじは 1つ！' : 'たて・よこ・へやに おなじ たまごは 1つ！'), 180, 84, 17, '#fff', { lw: 5 });
        if (!Q) return;
        var W2 = cell * size;
        D.roundRect(c, gx - 6, gy - 6, W2 + 12, W2 + 12, 16); D.paint(c, '#fffdf5', D.INK, 4);
        for (var k = 0; k < grid.length; k++) {
          var r0 = Math.floor(k / size), c0 = k % size, x = gx + c0 * cell, y = gy + r0 * cell;
          var given = Q.grid[k] !== 0;
          var pad = nums ? 1.5 : 3, rad = nums ? 5 : 10;
          D.roundRect(c, x + pad, y + pad, cell - pad * 2, cell - pad * 2, rad);
          D.paint(c, given ? '#f3ecdf' : k === sel && phase === 'play' ? '#fff3a6' : '#ffffff');
          if (k === sel && phase === 'play') { c.save(); c.globalAlpha = 0.6 + 0.4 * Math.sin(clock * 6); D.roundRect(c, x + pad, y + pad, cell - pad * 2, cell - pad * 2, rad); D.paint(c, null, '#ffb347', nums ? 3 : 4); c.restore(); }
          if (grid[k] && nums) {   // (grown-ups: the given numbers in brown, the ones filled in in blue)
            var pn = pops[k] != null ? Math.min(1, pops[k] / 0.2) : 1;
            A.text(c, String(grid[k]), x + cell / 2, y + cell / 2 + 1, cell * (0.5 + 0.12 * Math.sin(pn * Math.PI)), given ? D.INK : '#2f7fd6', { stroke: false });
          } else if (grid[k] && phase !== 'done') {
            var pk = pops[k] != null ? Math.min(1, pops[k] / 0.2) : 1, s = 0.5 + 0.5 * pk + Math.sin(pk * Math.PI) * 0.15;
            c.save(); c.translate(x + cell / 2, y + cell / 2); c.scale(s, s);
            D.egg(c, grid[k] - 1, 0, 0, cell * 0.33, clock, 0);
            c.restore();
          } else if (grid[k] && phase === 'done') {
            D.eggHalf(c, grid[k] - 1, x + cell / 2, y + cell / 2 + 6, cell * 0.33, 0, false, clock);
          }
        }
        // the lines between boxes
        c.strokeStyle = D.INK; c.lineWidth = nums ? 2.5 : 3.5; c.lineCap = 'round';
        for (var bxI = Q.box.w; bxI < size; bxI += Q.box.w) { c.beginPath(); c.moveTo(gx + bxI * cell, gy); c.lineTo(gx + bxI * cell, gy + W2); c.stroke(); }
        for (var byI = Q.box.h; byI < size; byI += Q.box.h) { c.beginPath(); c.moveTo(gx, gy + byI * cell); c.lineTo(gx + W2, gy + byI * cell); c.stroke(); }
        chicks.forEach(function (ch) { if (ch.t > 0) D.chick(c, ch.x, ch.y, size === 6 ? 0.6 : 0.8, clock, { fly: true, flap: ch.t * 26, shell: ch.shell, happy: true }); });
        if (held && phase === 'play') A.text(c, L('あいてる マスを タッチ！'), 180, gy + W2 + 26, 18, '#fff', { lw: 5 });
      },
      down: function (q) {
        if (phase !== 'play') return;
        var c0 = Math.floor((q.x - gx) / cell), r0 = Math.floor((q.y - gy) / cell);
        if (c0 < 0 || r0 < 0 || c0 >= size || r0 >= size) return;
        var idx = r0 * size + c0;
        if (grid[idx] !== 0) return;
        if (held) { place(idx, held); return; }
        sel = idx; api.sfx('select');
      },
      peek: function () {   // for playtesting: the cell to fill and the egg for it
        if (phase !== 'play') return null;
        var idx = sel >= 0 && grid[sel] === 0 ? sel : firstEmpty();
        return { cell: idx, x: gx + (idx % size + 0.5) * cell, y: gy + (Math.floor(idx / size) + 0.5) * cell, egg: Q.sol[idx] - 1 };
      },
      end: function () {}
    };
  }

  T.register({
    id: 'sudoku', name: 'えあわせ すうどく', orig: '数独', kind: 'time',
    help: 'たて・よこ・へやに\nおなじ たまごが 1つずつ はいるように\nあいてる マスを うめてね！',
    levels: {
      e: { q: 2, size: 4, blanks: 4 },
      n: { q: 2, size: 4, blanks: 7 },
      h: { q: 2, size: 4, blanks: 10 },
      ae: { q: 1, size: 9, blanks: [40, 44] },
      a: { q: 1, size: 9, blanks: [46, 50] },
      ah: { q: 1, size: 9, blanks: [52, 55] },
      practice: { q: 1, size: 4, blanks: 2 }
    },
    ranks: {
      e: [16, 22, 30, 40, 55, 75], n: [30, 40, 52, 68, 90, 120], h: [45, 60, 78, 100, 130, 170],
      ae: [240, 330, 450, 600, 800, 1100], a: [360, 480, 630, 840, 1100, 1500], ah: [540, 720, 960, 1260, 1680, 2280]
    },
    gen: gen, puzzle: puzzle, count: count, okAt: okAt, boxOf: boxOf,
    start: start,
    icon: function (c, t) {
      var D = G.Draw, g = [0, 1, 2, 3, 2, 3, 0, 1, 1, 0, 3, 2, 3, 2, 1, 0];
      D.roundRect(c, 10, 10, 80, 80, 10); D.paint(c, '#fffdf5', D.INK, 3);
      for (var k = 0; k < 16; k++) {
        if (k === 5 || k === 10) continue;
        D.egg(c, g[k], 20 + (k % 4) * 20, 20 + Math.floor(k / 4) * 20, 7, t || 0, 0);
      }
      c.strokeStyle = D.INK; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(50, 12); c.lineTo(50, 88); c.moveTo(12, 50); c.lineTo(88, 50); c.stroke();
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
