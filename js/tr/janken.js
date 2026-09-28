/* あとだし じゃんけん (the original: 後出し勝負テスト) — ケロはかせ shows a hand and says
   "かって！" (win) or "まけて！" (lose); answer with the right hand as fast as you can.
   Losing on purpose is the hard part: it trains holding back the hand you want to show. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var HANDS = ['グー', 'チョキ', 'パー'];
  var ASK = {
    win: { text: 'かって！', say: 'かって', color: '#ffb347', dark: '#e07a12' },
    lose: { text: 'まけて！', say: 'まけて', color: '#7cc8ff', dark: '#2f8fd8' },
    draw: { text: 'あいこ！', say: 'あいこ', color: '#8bd86a', dark: '#4ea638' }
  };
  // 0 グー beats 1 チョキ, 1 チョキ beats 2 パー, 2 パー beats 0 グー
  function answerFor(hand, ask) { return ask === 'win' ? (hand + 2) % 3 : ask === 'lose' ? (hand + 1) % 3 : hand; }

  // p: { q, seq: 'win' | 'wl' (win, then lose) | 'mix' }
  function gen(p, r) {
    var out = [], half = Math.ceil(p.q / 2);
    for (var i = 0; i < p.q; i++) {
      var ask = p.seq === 'win' ? 'win' : p.seq === 'wl' ? (i < half ? 'win' : 'lose') : U.pick(r, ['win', 'lose', 'lose', 'draw', 'win']);
      if (p.seq === 'mix' && i >= 2 && out[i - 1].ask === ask && out[i - 2].ask === ask) { i--; continue; }
      var hand = U.int(r, 0, 2);
      if (i >= 2 && out[i - 1].hand === hand && out[i - 2].hand === hand) { i--; continue; }
      out.push({ hand: hand, ask: ask, ans: answerFor(hand, ask) });
    }
    return out;
  }

  function banner(c, A, D, ask, x, y, k) {
    var a = ASK[ask], s = 0.6 + 0.4 * Math.min(1, k * 4);
    c.save(); c.translate(x, y); c.scale(s, s);
    D.roundRect(c, -118, -34, 236, 68, 34); D.paint(c, a.color, D.INK, 4);
    A.text(c, L(a.text), 18, 2, 42, '#fff', { lw: 9, max: 176 });
    // a mark next to the word, so it can be seen without reading
    if (ask === 'win') {
      c.save(); c.translate(-80, 0);
      c.beginPath(); c.moveTo(-18, 10); c.lineTo(-20, -12); c.lineTo(-9, -2); c.lineTo(0, -16); c.lineTo(9, -2); c.lineTo(20, -12); c.lineTo(18, 10); c.closePath();
      D.paint(c, '#ffd23d', D.INK, 3);
      c.restore();
    } else if (ask === 'lose') {
      D.teardrop(c, -80, 4, 11);
    } else {
      c.save(); c.translate(-80, 0);
      D.roundRect(c, -16, -9, 32, 6, 3); D.paint(c, '#fff', D.INK, 2);
      D.roundRect(c, -16, 4, 32, 6, 3); D.paint(c, '#fff', D.INK, 2);
      c.restore();
    }
    c.restore();
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var rounds = gen(p, api.rnd), i = -1, cur = null, mistakes = 0, time = 0, active = false;
    var phase = 'wait', pt = 0, since = 0, switchT = 0;
    var hak = { mode: 'idle', mt: 0 };
    var HX = 180, HY = 238;

    var ch = api.choices([0, 1, 2].map(function (h) {
      return { draw: function (c, w, hh) { A.jankenHand(c, h, w / 2, hh / 2 - 13, Math.min(w, hh) / 134); A.text(c, L(HANDS[h]), w / 2, hh - 12, 17, D.INK, { stroke: false, max: w - 6 }); } };
    }), tap, { top: 478, h: 130, gap: 10 });

    function next() {
      i++;
      ch.clear();
      if (i >= rounds.length) {
        phase = 'end'; active = false;
        api.finish({ score: time + mistakes * 3, text: U.res.time(time, mistakes) });
        return;
      }
      var r = rounds[i], prev = rounds[i - 1];
      // A new instruction (at the start, and when "かって" turns into "まけて"): show it by itself first.
      // In the mixed level it changes all the time, so there it is only shown above the hand.
      if (p.seq !== 'mix' && (!prev || prev.ask !== r.ask)) {
        phase = 'switch'; switchT = 0; cur = r; active = false;
        api.speak(prev ? 'こんどは ' + ASK[r.ask].say + '！' : ASK[r.ask].say + '！');
        return;
      }
      show(r);
    }
    function show(r) {
      cur = r; phase = 'show'; pt = 0; since = 0; active = true;
      api.sfx('pop');
      if (p.seq === 'mix') api.speak(ASK[r.ask].say);
      api.progress(i, rounds.length);
    }
    function tap(h) {
      if (!active || phase !== 'show') return;
      active = false;
      if (h === cur.ans) {
        api.ok(HX, HY, 70);
        ch.mark(h, 'ok');
        hak.mode = 'happy'; hak.mt = 0;
        phase = 'after'; pt = 0;
      } else {
        mistakes++;
        api.ng(HX, HY, 60);
        ch.mark(h, 'ng'); ch.mark(cur.ans, 'hint');
        phase = 'after'; pt = -0.35;
      }
      api.progress(i + 1, rounds.length);
    }

    return {
      theme: 1,
      begin: function () { next(); },
      update: function (dt, playing) {
        hak.mt += dt;
        if (hak.mode === 'happy' && hak.mt > 0.7) hak.mode = 'idle';
        pt += dt;
        if (!playing) return;
        if (phase === 'show' && active) {
          time += dt; since += dt;
          if (p.practice && since > 2.2) ch.hint(cur.ans);
        } else if (phase === 'after' && pt > 0.32) {
          next();
        } else if (phase === 'switch') {
          switchT += dt;
          if (switchT > 1.5) show(cur);
        }
      },
      draw: function (c, clock) {
        // ケロはかせ below the hand
        c.save(); c.translate(180, 408); c.scale(0.78, 0.78);
        D.critter(c, { x: 0, y: 0, t: clock, kind: 'frog', look: { x: 0, y: -200 }, mode: hak.mode, mt: hak.mt, wear: A.hakase });
        c.restore();
        if (!cur) {
          A.text(c, L('じゃん けん…'), 180, 200, 40, '#fff', { lw: 9 });
          return;
        }
        if (phase === 'switch') {
          banner(c, A, D, cur.ask, 180, 200, switchT);
          A.text(c, L(i === 0 ? 'この ことばを みてね' : 'ことばが かわったよ！'), 180, 280, 22, D.INK, { stroke: false });
          return;
        }
        banner(c, A, D, cur.ask, 180, 112, 1);
        // the hand ケロはかせ shows, in a bubble
        var k = Math.min(1, pt / 0.14), s = phase === 'show' ? 0.7 + 0.3 * k : 1;
        D.circle(c, HX, HY, 84); D.paint(c, '#fffdf5', D.INK, 4);
        c.save(); c.beginPath(); c.moveTo(HX - 14, HY + 80); c.lineTo(HX, HY + 104); c.lineTo(HX + 14, HY + 80); c.closePath(); D.paint(c, '#fffdf5', D.INK, 4); c.restore();
        D.circle(c, HX, HY, 80); D.paint(c, '#fffdf5');
        A.jankenHand(c, cur.hand, HX, HY - 4, 1.2 * s, '#9ee07a');
      },
      peek: function () { return phase === 'show' && active ? cur.ans : null; },   // for playtesting
      end: function () {}
    };
  }

  T.register({
    id: 'janken', name: 'あとだし じゃんけん', orig: '後出し勝負テスト', kind: 'time',
    help: 'ケロはかせの てを みて\n「かって」なら かつ て、「まけて」なら まける てを\nはやく だしてね！',
    levels: {
      e: { q: 10, seq: 'win' },
      n: { q: 10, seq: 'wl' },
      h: { q: 12, seq: 'mix' },
      a: { q: 20, seq: 'mix' },
      test: { q: 10, seq: 'wl' },
      testA: { q: 16, seq: 'mix' },
      practice: { q: 4, seq: 'wl' }
    },
    ranks: {
      e: [8, 10, 13, 17, 22, 30], n: [10, 13, 16, 20, 26, 35], h: [14, 17, 21, 26, 33, 45],
      a: [14, 17, 20, 24, 29, 36], test: [10, 13, 16, 20, 26, 35], testA: [12, 14, 17, 20, 24, 30]
    },
    gen: gen, answerFor: answerFor,
    start: start,
    icon: function (c, t) {
      var A = G.Art, w = Math.sin((t || 0) * 4) * 0.08;
      c.save(); c.translate(32, 58); c.rotate(-0.2 + w); A.jankenHand(c, 0, 0, 0, 0.62, '#9ee07a'); c.restore();
      c.save(); c.translate(70, 54); c.rotate(0.2 - w); A.jankenHand(c, 2, 0, 0, 0.58); c.restore();
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
