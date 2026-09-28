/* ピアノ (the original: 名曲演奏) — play a song by following the notes. The notes sit higher or lower
   by pitch, like a simple score. かんたん lights up the next key; むずかしい shows only the note names.
   When the song is done, the whole song plays by itself as a reward. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var DATA = typeof Data !== 'undefined' ? Data : require('../data.js');
  var KEY_COLORS = ['#ff7a7a', '#ffa552', '#ffd23d', '#8bd86a', '#5fd0c9', '#66a8ff', '#b48cff', '#ff8fc0'];
  var KEY_Y = 420, KEY_H = 206, KEY_W = 45;

  function parse(notes) {
    return notes.trim().split(/\s+/).map(function (tok) {
      var m = tok.split(':');
      return { k: parseInt(m[0], 10), len: m[1] ? parseFloat(m[1]) : 1 };
    });
  }
  function songOf(id) {
    if (id === 'scale') return DATA.SCALE;
    for (var i = 0; i < DATA.SONGS.length; i++) if (DATA.SONGS[i].id === id) return DATA.SONGS[i];
    return DATA.SONGS[0];
  }
  // p: { song, repeat }
  function gen(p) {
    var song = songOf(p.song), notes = parse(song.notes), all = [];
    for (var r = 0; r < (p.repeat || 1); r++) all = all.concat(notes);
    return { song: song, notes: all };
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var g = gen(p), notes = g.notes, i = 0, time = 0, mistakes = 0, phase = 'wait', pt = 0, since = 0, scroll = 0;
    var pressed = [0, 0, 0, 0, 0, 0, 0, 0], shake = [0, 0, 0, 0, 0, 0, 0, 0], auto = null, hak = { mode: 'idle', mt: 0 };

    function noteY(k) { return 300 - k * 21; }
    function play(k) {
      api.piano(k, 0.7);
      pressed[k] = 0.16;
      if (phase !== 'play') return;
      if (k === notes[i].k) {
        i++; since = 0;
        api.burst(110, noteY(k), 5, KEY_COLORS[k]);
        if (i >= notes.length) {
          phase = 'bravo'; pt = 0;
          hak.mode = 'happy'; hak.mt = 0;
          api.word('じょうず！', 180, 200, 50, '#ff8fc0', 1.4);
          api.speak('じょうず！');
        }
      } else {
        mistakes++;
        shake[k] = 0.3;
      }
    }
    function startAuto() {
      phase = 'auto'; pt = 0;
      var beat = 60 / g.song.bpm, at = 0.2;
      auto = notes.map(function (n) { var o = { k: n.k, at: at, len: n.len * beat, done: false }; at += n.len * beat; return o; });
      auto.end = at + 0.6;
    }

    return {
      theme: 2,
      begin: function () { phase = 'play'; api.progress(0, 0); },
      update: function (dt, playing) {
        pt += dt; hak.mt += dt;
        if (hak.mode === 'happy' && hak.mt > 1.2 && phase !== 'auto') hak.mode = 'idle';
        for (var k = 0; k < 8; k++) { pressed[k] = Math.max(0, pressed[k] - dt); shake[k] = Math.max(0, shake[k] - dt); }
        scroll += (i - scroll) * Math.min(1, dt * 10);
        if (!playing) return;
        if (phase === 'play') {
          time += dt; since += dt;
        } else if (phase === 'bravo' && pt > 1.2) startAuto();
        else if (phase === 'auto') {
          auto.forEach(function (n) {
            if (!n.done && pt >= n.at) { n.done = true; api.piano(n.k, Math.min(1.2, n.len * 1.1)); pressed[n.k] = Math.min(0.4, n.len * 0.8); hak.mode = 'happy'; hak.mt = 0; }
          });
          if (pt > auto.end) {
            phase = 'end';
            var score = (time + mistakes * 2) / notes.length;
            api.finish({ score: score, text: 'まちがい ' + mistakes + 'かい・' + U.fmtTime(time), delay: 300 });
          }
        }
      },
      draw: function (c, clock) {
        A.text(c, g.song.name, 180, 84, 22, '#fff', { lw: 6 });
        // the road of notes
        D.roundRect(c, 12, 104, 336, 222, 26); D.paint(c, 'rgba(255,255,255,.82)', D.INK, 3);
        c.save(); D.roundRect(c, 12, 104, 336, 222, 26); c.clip();
        c.strokeStyle = 'rgba(90,56,37,.12)'; c.lineWidth = 2;
        for (var l = 0; l < 5; l++) { c.beginPath(); c.moveTo(12, 140 + l * 36); c.lineTo(348, 140 + l * 36); c.stroke(); }
        var X0 = 110, STEP = 58;
        for (var j = Math.max(0, i - 2); j < Math.min(notes.length, i + 6); j++) {
          var n = notes[j], x = X0 + (j - scroll) * STEP, y = noteY(n.k), past = j < i;
          c.save(); c.globalAlpha = past ? 0.35 : 1;
          D.circle(c, x, y, 21); D.paint(c, p.colors ? KEY_COLORS[n.k] : '#fff', D.INK, 3);
          A.text(c, DATA.KEYS[n.k], x, y + 1, n.k === 3 ? 13 : 17, p.colors ? '#fff' : D.INK, p.colors ? { lw: 4 } : { stroke: false });
          if (n.len >= 2) { c.beginPath(); c.moveTo(x + 22, y); c.lineTo(x + 22 + (n.len - 1) * 16, y); D.paint(c, null, p.colors ? KEY_COLORS[n.k] : D.INK, 5); }
          c.restore();
        }
        c.restore();
        // ケロちゃん points at the next note
        if (phase === 'play' && notes[i]) {
          var ny = noteY(notes[i].k);
          c.save(); c.translate(X0 + (i - scroll) * STEP, ny - 44 + Math.sin(clock * 5) * 3); c.scale(0.28, 0.28);
          D.critter(c, { x: 0, y: -40, t: clock, kind: 'frog', noSeat: true, look: { x: 0, y: 200 }, mode: 'idle' });
          c.restore();
        }
        // keys
        for (var k = 0; k < 8; k++) {
          var kx = k * KEY_W, down = pressed[k] > 0, sx = shake[k] > 0 ? Math.sin(shake[k] * 60) * 3 : 0;
          var glow = p.glow && phase === 'play' && notes[i] && notes[i].k === k;
          D.roundRect(c, kx + 2 + sx, KEY_Y + (down ? 4 : 0), KEY_W - 4, KEY_H, 12);
          D.paint(c, p.colors ? KEY_COLORS[k] : '#ffffff', D.INK, 3);
          D.roundRect(c, kx + 6 + sx, KEY_Y + 8 + (down ? 4 : 0), KEY_W - 12, 60, 8); D.paint(c, 'rgba(255,255,255,.35)');
          if (glow) {
            c.save(); c.globalAlpha = 0.45 + 0.35 * Math.sin(clock * 8);
            D.roundRect(c, kx + 4, KEY_Y + 2, KEY_W - 8, KEY_H - 4, 10); D.paint(c, null, '#fff06a', 7);
            c.restore();
            D.hand(c, kx + KEY_W / 2 + 4, KEY_Y + 110 + Math.sin(clock * 8) * 4, 0.8, false);
          }
          A.text(c, DATA.KEYS[k], kx + KEY_W / 2 + sx, KEY_Y + KEY_H - 26 + (down ? 4 : 0), k === 3 ? 15 : 19, p.colors ? '#fff' : D.INK, p.colors ? { lw: 5 } : { stroke: false });
        }
        c.save(); c.translate(318, 386); c.scale(0.42, 0.42);
        D.critter(c, { x: 0, y: 0, t: clock, kind: 'frog', look: { x: -300, y: 0 }, mode: hak.mode, mt: hak.mt, wear: A.hakase, noSeat: true });
        c.restore();
      },
      down: function (q) {
        if (q.y < KEY_Y - 4) return;
        var k = Math.max(0, Math.min(7, Math.floor(q.x / KEY_W)));
        if (phase === 'play' || phase === 'bravo') play(k);
      },
      peek: function () { return phase === 'play' && notes[i] ? { x: notes[i].k * KEY_W + KEY_W / 2, y: KEY_Y + 100 } : null; },   // for playtesting
      end: function () {}
    };
  }

  T.register({
    id: 'piano', name: 'ピアノ', orig: '名曲演奏', kind: 'time', songs: true,
    help: 'うえの おんぷと おなじ けんばんを\nじゅんばんに おしてね！\nさいごに きょくを ぜんぶ きけるよ',
    levels: {
      e: { glow: true, colors: true },
      n: { glow: false, colors: true },
      h: { glow: false, colors: false },
      a: { glow: false, colors: false, repeat: 2 },
      practice: { song: 'scale', glow: true, colors: true }
    },
    // seconds per note, including 2 seconds for each wrong key
    ranks: {
      e: [0.55, 0.7, 0.9, 1.15, 1.5, 2.0], n: [0.7, 0.9, 1.1, 1.4, 1.8, 2.4],
      h: [0.8, 1.0, 1.25, 1.6, 2.0, 2.7], a: [0.55, 0.7, 0.85, 1.05, 1.3, 1.7]
    },
    gen: gen, parse: parse,
    start: start,
    icon: function (c, t) {
      var D = G.Draw, A = G.Art;
      for (var k = 0; k < 6; k++) {
        var down = Math.floor((t || 0) * 3) % 6 === k;
        D.roundRect(c, 8 + k * 14, 44 + (down ? 3 : 0), 13, 48, 4); D.paint(c, KEY_COLORS[k], D.INK, 2);
      }
      D.circle(c, 30, 26, 8); D.paint(c, KEY_COLORS[2], D.INK, 2);
      D.circle(c, 56, 18, 8); D.paint(c, KEY_COLORS[4], D.INK, 2);
      A.text(c, '♪', 80, 22, 22, '#ff8fc0', { lw: 4 });
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
