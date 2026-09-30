/* ジャンプで タッチ (the original: 二重課題) — two things at once: the partner runs along the top,
   press ジャンプ to hop over rocks and mushrooms, and at the same time touch the biggest number below.
   Bumping into a rock only makes the partner trip; the game always lasts the same time.
   おに: birds fly in too, just above the partner's head — jumping then bumps into the bird (stay down and it flies over). */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var GROUND = 300, HERO_X = 96, GRAV = 1400, JUMP_V = 520;
  var SPOTS = { 2: [[205, 470], [305, 470]], 3: [[200, 420], [305, 420], [252, 530]] };

  // Number sets for the touch half. p: { k, max }
  function numbers(p, r) { return U.sample(r, U.range(1, p.max), p.k); }
  function gen(p, r) { var out = []; for (var i = 0; i < 80; i++) out.push(numbers(p, r)); return out; }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var sets = gen(p, api.rnd), si = 0, cur = null, t = 0, phase = 'wait', pt = 0, clock = 0;
    var hero = { y: 0, vy: 0, trip: 0 }, obs = [], spawn = 1.2, gapT = -1, stats = { over: 0, touch: 0, hit: 0, miss: 0 }, pops = [];
    var jumpBtn = api.bigButton(L('ジャンプ'), jump, { x: 14, y: 426, w: 150, h: 170, size: 26 });

    function newSet() { cur = { nums: sets[si++ % sets.length], t: 0, shake: -1 }; }
    function jump() {
      if (phase !== 'play' || hero.y < -1 || hero.trip > 0) return;
      hero.vy = -JUMP_V; api.sfx('jump');
    }
    function finish() {
      phase = 'end';
      var score = Math.max(0, stats.over + stats.touch - stats.hit - stats.miss);
      // how much was right: the jumping half and the touching half count the same
      var acc = (U.acc(stats.hit, stats.over + stats.hit) + U.acc(stats.miss, stats.touch)) / 2;
      api.finish({ score: score, acc: acc, text: U.res.jump(stats.over, stats.touch, stats.hit + stats.miss), delay: 400 });
    }

    return {
      theme: 5,
      begin: function () { phase = 'play'; newSet(); api.progress(0, 0); },
      update: function (dt, playing) {
        clock += dt; pt += dt;
        pops.forEach(function (q) { q.t += dt; });
        pops = pops.filter(function (q) { return q.t < 0.4; });
        if (!playing || phase !== 'play') return;
        t += dt;
        if (cur) cur.t += dt;
        if (gapT >= 0) { gapT -= dt; if (gapT < 0) newSet(); }
        // the runner
        hero.vy += GRAV * dt; hero.y = Math.min(0, hero.y + hero.vy * dt);
        if (hero.y >= 0) hero.vy = 0;
        hero.trip = Math.max(0, hero.trip - dt);
        spawn -= dt;
        if (spawn <= 0) {
          // (おに: now and then a bird, never two in a row)
          var last = obs[obs.length - 1], bird = p.birds && Math.random() < p.birds && !(last && last.kind === 'bird');
          obs.push({ x: 390, kind: bird ? 'bird' : Math.random() < 0.5 ? 'rock' : 'mushroom', hit: false, passed: false, seed: Math.random() * 6 });
          spawn = p.gap * (0.8 + Math.random() * 0.4);
        }
        obs.forEach(function (o) {
          o.x -= p.speed * dt;
          var near = o.x - HERO_X < 22 && o.x - HERO_X > -8;   // (landing just behind a rock that was jumped over is fine)
          // a rock or a mushroom trips the partner on the ground; a bird bumps into it in the air
          var bump = o.kind === 'bird' ? hero.y < -26 : hero.y > -26;
          if (near && !o.hit && bump) { o.hit = true; stats.hit++; hero.trip = 0.6; api.sfx('bump'); api.mark('batsu', HERO_X, GROUND - 40, 18); }
          if (!o.passed && o.x < HERO_X - 22) { o.passed = true; if (!o.hit) { stats.over++; api.burst(HERO_X, GROUND - 30, 5, '#fff6a8'); } }
        });
        obs = obs.filter(function (o) { return o.x > -40; });
        // hints while practising
        if (p.practice) {
          var danger = obs.some(function (o) { return !o.passed && o.kind !== 'bird' && o.x - HERO_X < 120 && o.x > HERO_X; });
          jumpBtn.hint(danger);
          if (!danger && cur && cur.t > 1.5) {
            var big = Math.max.apply(null, cur.nums), idx = cur.nums.indexOf(big), sp = SPOTS[cur.nums.length][idx];
            api.hand(sp[0] + 8, sp[1] + 10);
          } else api.hand(null);
        }
        if (t >= p.dur) { api.hand(null); jumpBtn.hint(false); finish(); }
      },
      draw: function (c) {
        // time left
        var left = Math.max(0, 1 - t / p.dur);
        D.roundRect(c, 60, 84, 240, 14, 7); D.paint(c, 'rgba(255,255,255,.75)', D.INK, 2.5);
        if (left > 0.01) { D.roundRect(c, 62, 86, 236 * left, 10, 5); D.paint(c, '#86d65c'); }
        // track
        D.roundRect(c, 10, 112, 340, 212, 24); D.paint(c, 'rgba(255,255,255,.55)', D.INK, 3);
        c.save(); D.roundRect(c, 10, 112, 340, 212, 24); c.clip();
        c.fillStyle = '#a4e384'; c.fillRect(10, GROUND, 340, 30);
        c.strokeStyle = 'rgba(90,150,60,.5)'; c.lineWidth = 3;
        for (var gx = -((t * p.speed) % 40); gx < 360; gx += 40) { c.beginPath(); c.moveTo(gx + 10, GROUND + 10); c.lineTo(gx + 22, GROUND + 10); c.stroke(); }
        obs.forEach(function (o) {
          if (o.kind === 'rock') A.rock(c, o.x, GROUND, 1);
          else if (o.kind === 'bird') A.bird(c, o.x, GROUND - 84 + Math.sin(clock * 5 + o.seed) * 4, 1.3, clock, { color: A.BIRDS[1], dir: -1, flap: clock * 22 + o.seed });
          else A.mushroom(c, o.x, GROUND, 0.9);
        });
        var bob = hero.y === 0 && hero.trip === 0 ? -Math.abs(Math.sin(clock * 12)) * 4 : 0;
        c.save(); c.translate(HERO_X, GROUND + hero.y + bob); c.rotate(hero.trip > 0 ? Math.sin(hero.trip * 20) * 0.3 : 0); c.scale(0.4, 0.4);
        D.critter(c, { x: 0, y: -52, t: clock, kind: api.partner, noSeat: true, look: { x: 300, y: 0 }, mode: hero.trip > 0 ? 'sad' : 'idle', mt: 0.2 });
        c.restore();
        c.restore();
        // the numbers
        A.text(c, L('おおきい かずを タッチ！'), 250, 364, 17, '#fff', { lw: 5, max: 200 });
        if (cur && phase !== 'wait') {
          cur.nums.forEach(function (n, i) {
            var sp = SPOTS[cur.nums.length][i], sx = cur.shake === i ? Math.sin(cur.t * 60) * 4 : 0;
            D.circle(c, sp[0] + sx, sp[1], 42); D.paint(c, '#fffdf5', D.INK, 3.5);
            A.text(c, String(n), sp[0] + sx, sp[1] + 2, n > 9 ? 36 : 44, D.INK, { stroke: false });
          });
        }
        pops.forEach(function (q) { c.save(); c.globalAlpha = 1 - q.t / 0.4; D.circle(c, q.x, q.y, 42 + q.t * 60); D.paint(c, null, '#ffd23d', 5); c.restore(); });
      },
      down: function (q) {
        if (phase !== 'play' || !cur || q.x < 150 || q.y < 360) return;
        for (var i = 0; i < cur.nums.length; i++) {
          var sp = SPOTS[cur.nums.length][i], dx = q.x - sp[0], dy = q.y - sp[1];
          if (dx * dx + dy * dy > 46 * 46) continue;
          if (cur.nums[i] === Math.max.apply(null, cur.nums)) {
            stats.touch++; api.sfx('ok'); api.mark('maru', sp[0], sp[1], 30); pops.push({ x: sp[0], y: sp[1], t: 0 });
            cur = null; gapT = 0.3;   // a short breath before the next numbers
          } else {
            stats.miss++; api.ng(sp[0], sp[1], 26); cur.shake = i; cur.t = 0;
          }
          return;
        }
      },
      peek: function () {   // for playtesting: jump when a rock is close, otherwise touch the biggest number
        if (phase !== 'play') return null;
        var danger = obs.some(function (o) { return !o.passed && o.kind !== 'bird' && o.x - HERO_X < 70 && o.x - HERO_X > 30; });
        if (danger) return { jump: true };   // (a bird: just keep running)
        if (!cur) return null;
        var idx = cur.nums.indexOf(Math.max.apply(null, cur.nums)), sp = SPOTS[cur.nums.length][idx];
        return { x: sp[0], y: sp[1] };
      },
      jump: jump,
      end: function () {}
    };
  }

  T.register({
    id: 'jump', name: 'ジャンプで タッチ', orig: '二重課題', kind: 'count',
    help: 'いしが きたら ジャンプ！\nおなじ ときに したの おおきい かずを\nタッチしてね。ふたつ いっしょに できるかな？',
    oniHelp: 'とりも とんで くるよ。\nとりの ときは ジャンプしないでね！',
    levels: {
      e: { dur: 40, gap: 4.0, k: 2, max: 5, speed: 120 },
      n: { dur: 40, gap: 3.0, k: 3, max: 9, speed: 135 },
      h: { dur: 40, gap: 2.2, k: 3, max: 20, speed: 150 },
      ae: { dur: 40, gap: 2.2, k: 3, max: 99, speed: 150 },
      a: { dur: 40, gap: 1.8, k: 3, max: 99, speed: 170 },
      ah: { dur: 40, gap: 1.5, k: 3, max: 999, speed: 190 },
      practice: { dur: 18 },
      o: { dur: 40, gap: 2.2, k: 3, max: 20, speed: 150, birds: 0.3 },
      ao: { dur: 40, gap: 1.5, k: 3, max: 999, speed: 190, birds: 0.35 },
      practiceO: { dur: 18, birds: 0.4 }
    },
    ranks: {
      e: [22, 19, 16, 13, 10, 6], n: [22, 19, 16, 13, 10, 6], h: [24, 21, 17, 14, 10, 6], o: [24, 21, 17, 14, 10, 6],
      ae: [30, 26, 22, 17, 12, 7], a: [34, 29, 24, 19, 14, 8], ah: [38, 32, 27, 21, 15, 9], ao: [38, 32, 27, 21, 15, 9]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art, D = G.Draw, k = ((t || 0) * 0.9) % 1, y = -Math.sin(k * Math.PI) * 26;
      D.roundRect(c, 4, 56, 92, 8, 4); D.paint(c, '#a4e384', D.INK, 2);
      A.rock(c, 60, 58, 0.6);
      c.save(); c.translate(34, 58 + y); c.scale(0.22, 0.22);
      D.critter(c, { x: 0, y: -52, t: t || 0, kind: 'frog', noSeat: true, look: null, mode: 'idle' });
      c.restore();
      D.circle(c, 30, 84, 11); D.paint(c, '#fffdf5', D.INK, 2); A.text(c, '3', 30, 85, 13, D.INK, { stroke: false });
      D.circle(c, 70, 84, 11); D.paint(c, '#fffdf5', D.INK, 2); A.text(c, '7', 70, 85, 13, D.INK, { stroke: false });
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
