/* つみき かぞえ — used by ふたりで (two players): a pile of blocks shows for a
   moment, then a cloth covers it. How many blocks were there? Every block can be seen
   (the original also counts blocks hidden behind others; that is left out for young children). */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var COLORS = ['#ff9fb8', '#8bd86a', '#66c3ff', '#ffd23d', '#b48cff', '#ffa552'];

  // p: { blocks: [a, b], cols: [a, b], tall, show }  ->  { heights: [...], colors: [[...]], answer }
  function pile(p, r) {
    for (var tries = 0; tries < 100; tries++) {
      var n = U.span(r, p.blocks), cols = U.span(r, p.cols), h = [];
      for (var i = 0; i < cols; i++) h.push(1);
      var left = n - cols;
      if (left < 0) continue;
      while (left > 0) {
        var k = U.int(r, 0, cols - 1);
        if (h[k] < p.tall) { h[k]++; left--; }
        else if (h.every(function (x) { return x >= p.tall; })) break;
      }
      if (left > 0) continue;
      return { heights: h, colors: h.map(function (x) { var cs = []; for (var j = 0; j < x; j++) cs.push(U.int(r, 0, COLORS.length - 1)); return cs; }), answer: n };
    }
    return { heights: [1, 1, 1], colors: [[0], [1], [2]], answer: 3 };
  }
  function gen(p, r) { var out = []; for (var i = 0; i < (p.q || 5); i++) out.push(pile(p, r)); return out; }

  // Draws a pile standing on the ground at (x, y) (x = centre).
  function drawPile(c, pl, x, y, size) {
    var A = G.Art, cols = pl.heights.length, w = cols * size;
    pl.heights.forEach(function (hh, i) {
      for (var j = 0; j < hh; j++) A.cube(c, x - w / 2 + i * size, y - j * size, size, COLORS[pl.colors[i][j]]);
    });
  }

  T.register({
    id: 'hako', name: 'つみき かぞえ', kind: 'count', versusOnly: true,
    help: 'つみきが すこしだけ みえるよ\nいくつ あったかな？',
    levels: {
      e: { blocks: [3, 5], cols: [2, 3], tall: 2, show: 3 },
      n: { blocks: [5, 8], cols: [3, 4], tall: 3, show: 2 },
      h: { blocks: [7, 10], cols: [3, 4], tall: 4, show: 1.5 }
    },
    ranks: {},
    gen: gen, pile: pile, drawPile: drawPile,
    icon: function (c) {
      drawPile(c, { heights: [1, 2, 1], colors: [[0], [1, 2], [3]] }, 44, 76, 22);
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
