/* とり かぞえ (the original: 野鳥数え) — a forest full of little creatures; count only the birds.
   Grown-ups see the forest for 5 seconds only. The same questions are used by ふたりで (two players). */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var OTHERS = ['butterfly', 'ladybug', 'bee'];
  var BOX = { x0: 34, y0: 136, x1: 326, y1: 420 };

  // p: { birds: [a, b], others, move (0 still, 1 drifting, 2 flying) }
  function scene(p, r, box, minD) {
    box = box || BOX;
    var n = U.span(r, p.birds), m = p.others, pts = U.scatter(r, n + m, box, minD || 46);
    var things = [];
    for (var i = 0; i < n + m; i++) {
      things.push({
        bird: i < n, kind: i < n ? 'bird' : U.pick(r, OTHERS), x: pts[i].x, y: pts[i].y,
        color: U.int(r, 0, 3), dir: r() < 0.5 ? -1 : 1, seed: r() * 6, vx: (r() - 0.5) * 70, vy: (r() - 0.5) * 50
      });
    }
    return { things: U.shuffle(r, things), answer: n };
  }
  function gen(p, r) { var out = []; for (var i = 0; i < p.q; i++) out.push(scene(p, r)); return out; }

  // Where a creature is at time t (moving ones wander or fly around inside the box).
  function place(th, t, move, box) {
    box = box || BOX;
    if (!move) return { x: th.x, y: th.y };
    if (move === 1) return { x: th.x + Math.sin(t * 0.8 + th.seed) * 14, y: th.y + Math.cos(t * 0.6 + th.seed) * 9 };
    var w = box.x1 - box.x0, h = box.y1 - box.y0;
    var x = th.x - box.x0 + th.vx * t, y = th.y - box.y0 + th.vy * t;
    x = ((x % (2 * w)) + 2 * w) % (2 * w); y = ((y % (2 * h)) + 2 * h) % (2 * h);
    return { x: box.x0 + (x > w ? 2 * w - x : x), y: box.y0 + (y > h ? 2 * h - y : y), flip: (th.vx * t) };
  }

  function drawForest(c, D, x0, y0, x1, y1) {
    D.roundRect(c, x0, y0, x1 - x0, y1 - y0, 30); D.paint(c, '#d9f5c4', '#7fbf5f', 4);
    c.save(); D.roundRect(c, x0, y0, x1 - x0, y1 - y0, 30); c.clip();
    c.fillStyle = 'rgba(120,180,90,.35)';
    [[x0 + 20, y0 + 40, 60], [x1 - 30, y0 + 70, 70], [x0 + 60, y1 - 10, 55], [x1 - 70, y1 + 10, 60]].forEach(function (b) { D.circle(c, b[0], b[1], b[2]); c.fill(); });
    c.fillStyle = 'rgba(160,110,60,.25)';
    c.fillRect(x0 + 14, y0 + 60, 10, y1 - y0); c.fillRect(x1 - 26, y0 + 90, 10, y1 - y0);
    c.restore();
  }
  function drawThing(c, A, th, q, t) {
    var fly = th.kind === 'bird' && th.moving;
    if (th.kind === 'bird') A.bird(c, q.x, q.y, 1.05, t, { color: A.BIRDS[th.color], dir: th.dir, flap: fly ? t * 22 + th.seed : null });
    else if (th.kind === 'butterfly') A.butterfly(c, q.x, q.y, 1.1, t + th.seed, ['#ffb347', '#b58cff', '#ff8fc0', '#6cc6ff'][th.color]);
    else if (th.kind === 'ladybug') A.ladybug(c, q.x, q.y, 1.1);
    else A.bee(c, q.x, q.y, 1.0, t + th.seed);
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var qs = gen(p, api.rnd), qi = -1, Q = null, phase = 'wait', pt = 0, correct = 0, clock = 0, counted = 0, verdict = null;
    var pad = api.answerPad({ expect: function () { return Q ? Q.answer : 0; }, onAnswer: answer });
    pad.enable(false);

    function next() {
      qi++;
      if (qi >= qs.length) {
        phase = 'end';
        api.finish({ score: correct, text: U.res.right(correct, qs.length) });
        return;
      }
      Q = qs[qi];
      Q.things.forEach(function (th) { th.moving = p.move === 2; });
      phase = 'look'; pt = 0; counted = 0; verdict = null;
      pad.enable(true);
      api.speak('ことりは なんわ？');
      api.progress(qi, qs.length);
      if (p.practice) pad.hint(Q.answer);
    }
    function answer(v) {
      if (phase !== 'look' && phase !== 'hidden') return;
      pad.enable(false); pad.hint(null);
      verdict = v === Q.answer;
      if (verdict) { correct++; api.ok(180, 280, 70); } else api.ng(180, 280, 60);
      phase = 'count'; pt = 0;
      api.progress(qi + 1, qs.length);
    }

    return {
      theme: 4,
      begin: next,
      update: function (dt, playing) {
        clock += dt; pt += dt;
        if (!playing) return;
        if (phase === 'look' && p.hideAfter && pt > p.hideAfter) { phase = 'hidden'; pt = 0; }
        if (phase === 'count') {
          var want = Math.min(Q.answer, Math.floor(pt / 0.22));
          if (want > counted) { counted = want; api.sfx('peep'); }
          if (pt > Q.answer * 0.22 + 1.6) next();
        }
      },
      draw: function (c) {
        drawForest(c, D, 20, 118, 340, 438);
        if (!Q) { A.text(c, L('ことりは なんわ？'), 180, 90, 24, '#fff', { lw: 7 }); return; }
        var t = clock, n = 0;
        Q.things.forEach(function (th) {
          // while counting, everybody stays where they were
          var q = phase === 'count' ? (th.last || { x: th.x, y: th.y }) : (th.last = place(th, pt, p.move));
          drawThing(c, A, th, q, t);
          if (phase === 'count' && th.bird) {
            n++;
            if (n <= counted) {
              D.circle(c, q.x, q.y - 26, 11); D.paint(c, '#fff', D.INK, 2.4);
              A.text(c, String(n), q.x, q.y - 25, 14, D.INK, { stroke: false });
            }
          }
        });
        if (phase === 'hidden') {
          c.save(); D.roundRect(c, 20, 118, 320, 320, 30); c.clip();
          c.fillStyle = '#7fcf62'; c.fillRect(20, 118, 320, 320);
          c.fillStyle = '#96dc7a';
          for (var i = 0; i < 16; i++) { D.circle(c, 30 + (i % 4) * 100 + (Math.floor(i / 4) % 2) * 50, 130 + Math.floor(i / 4) * 90, 58); c.fill(); }
          c.restore();
        }
        var head = phase === 'count' ? L('こたえは {n}わ', { n: Q.answer }) : L('ことりは なんわ？');
        A.text(c, head, 180, 90, phase === 'count' ? 28 : 24, phase === 'count' ? (verdict ? '#ff8fc0' : '#6cc6ff') : '#fff', { lw: 7 });
      },
      peek: function () { return phase === 'look' || phase === 'hidden' ? Q.answer : null; },   // for playtesting
      end: function () {}
    };
  }

  T.register({
    id: 'tori', name: 'とり かぞえ', orig: '野鳥数え', kind: 'count',
    help: 'もりの なかに いる\nことりだけを かぞえてね！\nちょうちょや むしは かぞえないよ',
    levels: {
      e: { q: 5, birds: [2, 5], others: 3, move: 0 },
      n: { q: 5, birds: [3, 8], others: 6, move: 1 },
      h: { q: 5, birds: [4, 10], others: 8, move: 2 },
      a: { q: 5, birds: [6, 14], others: 12, move: 2, hideAfter: 5 },
      practice: { q: 2, birds: [2, 3], others: 2, move: 0 }
    },
    ranks: { e: [5, 5, 4, 3, 2, 1], n: [5, 5, 4, 3, 2, 1], h: [5, 5, 4, 3, 2, 1], a: [5, 5, 4, 3, 2, 1] },
    gen: gen, scene: scene, place: place, drawForest: drawForest, drawThing: drawThing,
    start: start,
    icon: function (c, t) {
      var A = G.Art, D = G.Draw;
      drawForest(c, D, 6, 12, 94, 92);
      A.bird(c, 32, 40, 0.9, t || 0, { color: A.BIRDS[0] });
      A.bird(c, 68, 62, 0.9, t || 0, { color: A.BIRDS[1], dir: -1, flap: (t || 0) * 20 });
      A.butterfly(c, 68, 30, 0.8, t || 0);
      A.ladybug(c, 30, 72, 0.8);
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
