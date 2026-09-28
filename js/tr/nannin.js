/* なんにん いるかな？ (the original: 人数数え) — friends walk into ケロちゃん's house and out again.
   At the end, how many are inside? The roof opens to show the answer. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var WHO = ['chick', 'rabbit', 'cat', 'dog'];
  var DOOR = { x: 180, y: 430 };

  /* One question: events in time order. p: { start: [a, b], events: [a, b], out, speed, multi }
     Each event: { at (seconds), dir: 'in' | 'out', who, side: -1 | 1 } */
  function question(p, r) {
    for (var tries = 0; tries < 50; tries++) {
      var ev = [], inside = [], t = 0.3, step = 1.25 / p.speed, s = U.span(r, p.start), n = U.span(r, p.events);
      for (var i = 0; i < s; i++) {           // the first ones go in quickly, one after another
        var w0 = U.pick(r, WHO);
        ev.push({ at: t, dir: 'in', who: w0, side: r() < 0.5 ? -1 : 1 });
        inside.push(w0); t += step * 0.7;
      }
      if (s) t += step * 0.4;
      var ok = true;
      for (var e = 0; e < n; e++) {
        var group = p.multi && r() < 0.35 ? 2 : 1;
        for (var g = 0; g < group; g++) {
          var out = p.out && inside.length > 0 && (inside.length >= 8 || r() < 0.45);
          if (out) {
            var k = U.int(r, 0, inside.length - 1);
            ev.push({ at: t + g * 0.18, dir: 'out', who: inside[k], side: r() < 0.5 ? -1 : 1 });
            inside.splice(k, 1);
          } else {
            if (inside.length >= 9) { ok = false; break; }
            var w = U.pick(r, WHO);
            ev.push({ at: t + g * 0.18, dir: 'in', who: w, side: r() < 0.5 ? -1 : 1 });
            inside.push(w);
          }
        }
        if (!ok) break;
        t += step;
      }
      if (!ok) continue;
      return { events: ev, answer: inside.length, inside: inside, end: t + 1.0 / p.speed };
    }
    return { events: [], answer: 0, inside: [], end: 1 };
  }
  function gen(p, r) { var out = []; for (var i = 0; i < p.q; i++) out.push(question(p, r)); return out; }

  function drawWho(c, D, who, x, y, s, t, walk) {
    var hop = walk ? Math.abs(Math.sin(t * 9)) * 5 : 0;
    if (who === 'chick') { D.chick(c, x, y - 16 - hop, 0.95 * s, t, { run: walk }); return; }
    c.save(); c.translate(x, y - hop); c.scale(0.34 * s, 0.34 * s);
    D.critter(c, { x: 0, y: -52, t: t, kind: who, noSeat: true, look: null, mode: 'idle' });
    c.restore();
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var qs = gen(p, api.rnd), qi = -1, Q = null, phase = 'wait', pt = 0, correct = 0, clock = 0;
    var walkers = [], door = 0, roof = 0, verdict = null;
    var pad = api.answerPad({ expect: function () { return Q ? Q.answer : 0; }, onAnswer: answer });
    pad.enable(false);

    function next() {
      qi++;
      if (qi >= qs.length) {
        phase = 'end';
        api.finish({ score: correct, text: correct + 'もん せいかい（' + qs.length + 'もん）' });
        return;
      }
      Q = qs[qi];
      walkers = Q.events.map(function (e) { return { e: e, k: -1 }; });
      phase = 'watch'; pt = 0; roof = 0; verdict = null;
      pad.enable(false);
      api.progress(qi, qs.length);
    }
    function answer(v) {
      if (phase !== 'ask') return;
      pad.enable(false);
      phase = 'reveal'; pt = 0;
      verdict = v === Q.answer;
      if (verdict) { correct++; api.ok(180, 300, 64); }
      else { api.ng(180, 300, 54); api.say('こたえは ' + Q.answer + 'にん だよ', false); }
      api.progress(qi + 1, qs.length);
    }

    // Where a walker is: k = 0..1 along its walk (in: from the side to the door; out: the other way).
    function where(w) {
      var k = w.e.dir === 'in' ? w.k : 1 - w.k, sx = DOOR.x + w.e.side * 230;
      return { x: sx + (DOOR.x - sx) * k, y: DOOR.y, scale: k > 0.86 ? Math.max(0.2, 1 - (k - 0.86) / 0.14 * 0.8) : 1 };
    }

    return {
      theme: 5,
      begin: next,
      update: function (dt, playing) {
        clock += dt; pt += dt;
        var busy = false;
        walkers.forEach(function (w) {
          if (!playing && phase === 'watch') return;
          if (w.k < 0 && pt >= w.e.at) { w.k = 0; api.sfx('step'); }
          if (w.k >= 0 && w.k < 1) {
            w.k = Math.min(1, w.k + dt * p.speed / 1.1);
            if (w.k > 0.8 && w.k < 1) busy = true;
            if (w.k >= 1 && w.e.dir === 'in') api.sfx('door');
          }
          if (w.e.dir === 'out' && w.k >= 0 && w.k < 0.25) busy = true;
        });
        door += ((busy ? 1 : 0) - door) * Math.min(1, dt * 10);
        if (phase === 'reveal' || phase === 'next') roof = Math.min(1, roof + dt * 2.5);
        else roof = Math.max(0, roof - dt * 3);
        if (!playing) return;
        if (phase === 'watch' && pt > Q.end) {
          phase = 'ask'; pt = 0;
          pad.enable(true);
          api.speak('おうちの なかに なんにん いるかな？');
          if (p.practice) pad.hint(Q.answer);
        } else if (phase === 'reveal' && pt > 2.2) { pad.hint(null); api.hush(); next(); }
      },
      draw: function (c) {
        // grass and path
        D.roundRect(c, -40, 440, 440, 40, 0); D.paint(c, '#9fdc7c');
        D.ellipse(c, 180, 438, 170, 10); D.paint(c, 'rgba(255,255,255,.45)');
        var insideNow = [];
        if (Q) walkers.forEach(function (w) { if ((w.e.dir === 'in' && w.k >= 1) || (w.e.dir === 'out' && w.k < 0)) insideNow.push(w.e.who); });
        A.house(c, 180, 440, 1, door, roof, roof > 0.02 ? function (h) {
          var list = Q && (phase === 'reveal' || phase === 'next') ? Q.inside : insideNow;
          list.forEach(function (who, i) {
            var col = i % 5, row = Math.floor(i / 5), n = Math.min(5, list.length - row * 5);
            drawWho(h, D, who, (col - (n - 1) / 2) * 29, -12 - row * 46, 0.85, clock + i, false);
          });
        } : null);
        walkers.forEach(function (w) {
          if (w.k < 0 || w.k >= 1) return;
          var q = where(w);
          drawWho(c, D, w.e.who, q.x, q.y, q.scale, clock, true);
        });
        if (phase === 'ask') A.text(c, 'おうちの なかに なんにん？', 180, 116, 24, '#fff', { lw: 7 });
        else if (phase === 'reveal') A.text(c, 'こたえは ' + Q.answer + 'にん', 180, 116, 28, verdict ? '#ff8fc0' : '#6cc6ff', { lw: 7 });
        else if (phase === 'watch') A.text(c, 'よく みててね！', 180, 116, 24, '#fff', { lw: 7 });
      },
      peek: function () { return phase === 'ask' ? Q.answer : null; },   // for playtesting
      end: function () {}
    };
  }

  T.register({
    id: 'nannin', name: 'なんにん いるかな？', orig: '人数数え', kind: 'count',
    help: 'おうちに はいったり でたり…\nさいごに おうちの なかに\nなんにん いるか こたえてね！',
    levels: {
      e: { q: 5, start: [0, 0], events: [3, 4], out: false, speed: 0.8, multi: false },
      n: { q: 5, start: [1, 3], events: [5, 6], out: true, speed: 1.0, multi: false },
      h: { q: 5, start: [2, 4], events: [7, 9], out: true, speed: 1.3, multi: true },
      a: { q: 5, start: [2, 5], events: [10, 14], out: true, speed: 1.8, multi: true },
      practice: { q: 2, start: [0, 0], events: [2, 3], out: false, speed: 0.8, multi: false }
    },
    ranks: { e: [5, 5, 4, 3, 2, 1], n: [5, 5, 4, 3, 2, 1], h: [5, 5, 4, 3, 2, 1], a: [5, 5, 4, 3, 2, 1] },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art, D = G.Draw, k = ((t || 0) * 0.5) % 1;
      c.save(); c.translate(50, 86); c.scale(0.42, 0.42); c.translate(-50, -86);
      A.house(c, 50, 86, 1, k > 0.6 ? 1 : 0, 0);
      c.restore();
      D.chick(c, 14 + k * 30, 76 - Math.abs(Math.sin((t || 0) * 9)) * 3, 0.55, t || 0, { run: true });
      A.text(c, '？', 84, 26, 22, '#ff8fc0', { lw: 5 });
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
