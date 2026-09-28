/* ケロちゃん あたま ぐんぐん — the new pictures of this game, in the same sticker style as draw.js:
   ケロはかせ's glasses and cap, the seven rank animals, janken hands, stamps, and the things
   the trainings share (balloons, lily pads, the house, little birds and bugs, blocks...).
   Everything is drawn with canvas paths; there are no image files. */
var Art = (function () {
  'use strict';
  var D = Draw, INK = D.INK, TAU = Math.PI * 2;
  var circle = D.circle, ellipse = D.ellipse, paint = D.paint, roundRect = D.roundRect;
  var FONT = '"M PLUS Rounded 1c", "Jua", "Hiragino Maru Gothic ProN", "BIZ UDPGothic", sans-serif';

  // ---------------------------------------------------------------- small helpers

  // A shape given as data: ['c', x, y, r] circle, ['e', x, y, rx, ry, rot] ellipse, ['r', cx, cy, w, h, radius, rot] box.
  function pathOf(ctx, p) {
    if (p[0] === 'c') circle(ctx, p[1], p[2], p[3]);
    else if (p[0] === 'e') ellipse(ctx, p[1], p[2], p[3], p[4], p[5] || 0);
    else if (p[0] === 'r') {
      ctx.save(); ctx.translate(p[1], p[2]); if (p[6]) ctx.rotate(p[6]);
      roundRect(ctx, -p[3] / 2, -p[4] / 2, p[3], p[4], p[5]);
      ctx.restore();
    }
  }
  // Several shapes that read as one body: outline them all first, then fill, so the seams disappear.
  function blob(ctx, parts, fill, lw) {
    ctx.lineJoin = 'round';
    parts.forEach(function (p) { pathOf(ctx, p); paint(ctx, null, INK, lw || 6); });
    parts.forEach(function (p) { pathOf(ctx, p); paint(ctx, fill); });
  }
  function eyeDot(ctx, x, y, r) {
    ellipse(ctx, x, y, r * 0.82, r); paint(ctx, '#2e1d14');
    circle(ctx, x - r * 0.3, y - r * 0.42, r * 0.38); paint(ctx, '#fff');
  }
  function smile(ctx, x, y, w) {
    ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y + w * 0.95, x + w, y);
    ctx.lineCap = 'round'; paint(ctx, null, INK, 2.4);
  }
  function blush(ctx, x, y, r) { ellipse(ctx, x, y, r, r * 0.62); paint(ctx, 'rgba(255,140,170,.75)'); }
  function stroke(ctx, pts, w, color) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; paint(ctx, null, color || INK, w);
  }
  // A thick line with an outline (tails, stalks, stems).
  function tube(ctx, draw, w, fill) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    draw(); paint(ctx, null, INK, w + 5);
    draw(); paint(ctx, null, fill, w);
  }

  // Outlined text in the game's rounded font.
  function text(ctx, str, x, y, size, fill, o) {
    o = o || {};
    ctx.save();
    ctx.font = (o.weight || 800) + ' ' + size + 'px ' + FONT;
    // a text that would not fit (a long one in another language) is drawn smaller: o.max, or 330 wide
    var fit = Math.min(1, (o.max || 330) / Math.max(1, ctx.measureText(str).width));
    if (fit < 1) { size *= fit; ctx.font = (o.weight || 800) + ' ' + size + 'px ' + FONT; if (o.lw) o = Object.assign({}, o, { lw: o.lw * fit }); }
    ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    if (o.stroke !== false) { ctx.lineWidth = o.lw || size * 0.2; ctx.strokeStyle = o.stroke || INK; ctx.strokeText(str, x, y); }
    ctx.fillStyle = fill || '#fff'; ctx.fillText(str, x, y);
    ctx.restore();
  }

  // ---------------------------------------------------------------- ケロはかせ (use as f.wear on the frog)

  function hakase(ctx, kind) {
    if (kind !== 'frog') return;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // round glasses around the eyes
    for (var s = -1; s <= 1; s += 2) {
      circle(ctx, s * 20, -22, 16); paint(ctx, 'rgba(255,255,255,.16)', INK, 3.4);
      ctx.beginPath(); ctx.arc(s * 20, -22, 12.5, -2.6, -1.9); paint(ctx, null, 'rgba(255,255,255,.8)', 2);
    }
    ctx.beginPath(); ctx.moveTo(-5, -25); ctx.quadraticCurveTo(0, -30, 5, -25); paint(ctx, null, INK, 3.2);
    stroke(ctx, [-36, -24, -44, -19], 3.2); stroke(ctx, [36, -24, 44, -19], 3.2);
    // doctor's cap
    ellipse(ctx, -3, -37, 21, 9); paint(ctx, '#3f4466', INK, 3);
    ctx.beginPath(); ctx.moveTo(-40, -44); ctx.lineTo(-3, -57); ctx.lineTo(34, -44); ctx.lineTo(-3, -32); ctx.closePath();
    paint(ctx, '#4b517a', INK, 3);
    ctx.beginPath(); ctx.moveTo(-34, -44); ctx.lineTo(-3, -54); paint(ctx, null, 'rgba(255,255,255,.25)', 2.5);
    circle(ctx, -3, -44, 3.2); paint(ctx, '#ffd23d', INK, 1.8);
    // tassel
    stroke(ctx, [-3, -44, 22, -43, 25, -30], 2.4, '#ffd23d');
    roundRect(ctx, 21.5, -32, 7, 11, 3); paint(ctx, '#ffd23d', INK, 1.8);
    ctx.restore();
  }

  // ---------------------------------------------------------------- the rank animals (feet at y = 0, facing right)

  function snail(ctx, t, run) {
    var k = run ? Math.sin(t * 7) : 0;
    ctx.save(); ctx.scale(1 + k * 0.05, 1 - k * 0.03);
    // eye stalks
    [[50, 44, 0], [58, 64, 0.6]].forEach(function (s) {
      var wob = Math.sin(t * 3 + s[2]) * 2;
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(s[0], -30); ctx.lineTo(s[1] + wob, -52); }, 4, '#ffe29a');
      circle(ctx, s[1] + wob, -54, 6.5); paint(ctx, '#fff', INK, 2.4);
      circle(ctx, s[1] + wob + 1.5, -54, 3.2); paint(ctx, '#2e1d14');
    });
    blob(ctx, [['e', 6, -8, 52, 9], ['e', 52, -22, 13, 17]], '#ffe29a');
    // shell
    circle(ctx, -2, -32, 27); paint(ctx, '#ff9fb8', INK, 3);
    ctx.beginPath();
    for (var a = 0; a < Math.PI * 4.3; a += 0.12) {
      var rr = 22 * (1 - a / (Math.PI * 4.8)), px = -2 + Math.cos(a) * rr, py = -32 + Math.sin(a) * rr;
      if (a) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.lineCap = 'round'; paint(ctx, null, '#e0718f', 3.5);
    ellipse(ctx, -14, -46, 7, 4, -0.6); paint(ctx, 'rgba(255,255,255,.7)');
    smile(ctx, 57, -19, 4.5); blush(ctx, 48, -15, 3.8);
    ctx.restore();
  }

  function turtle(ctx, t, run) {
    var k = run ? Math.sin(t * 8) : 0;
    var legs = [[-28, k], [-8, -k], [16, k], [34, -k]].map(function (l) { return ['e', l[0] + l[1] * 4, -5, 9, 8]; });
    blob(ctx, legs.concat([['c', 56, -26 + k, 15], ['e', -47, -12, 8, 5, -0.3]]), '#a6e08a');
    ctx.beginPath(); ctx.ellipse(0, -12, 46, 38, 0, Math.PI, TAU); ctx.closePath();
    paint(ctx, '#6cc157', INK, 3);
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, -12, 46, 38, 0, Math.PI, TAU); ctx.closePath(); ctx.clip();
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var q = i / 6 * TAU;
      var hx = Math.cos(q) * 13, hy = -30 + Math.sin(q) * 10;
      if (i) ctx.lineTo(hx, hy); else ctx.moveTo(hx, hy);
    }
    ctx.closePath();
    [[-13, -30, -30, -16], [13, -30, 30, -16], [-7, -39, -18, -52], [7, -39, 18, -52]].forEach(function (l) { ctx.moveTo(l[0], l[1]); ctx.lineTo(l[2], l[3]); });
    ctx.lineJoin = 'round'; paint(ctx, null, '#4f9e43', 3);
    ellipse(ctx, -16, -38, 10, 5, -0.4); paint(ctx, 'rgba(255,255,255,.35)');
    ctx.restore();
    roundRect(ctx, -48, -17, 96, 10, 5); paint(ctx, '#58ad4a', INK, 3);
    eyeDot(ctx, 60, -30 + k, 3.4); smile(ctx, 61, -21 + k, 4.5); blush(ctx, 52, -19 + k, 3.8);
  }

  function penguin(ctx, t, run) {
    var w = run ? Math.sin(t * 9) * 0.12 : 0;
    ctx.save(); ctx.rotate(w);
    ellipse(ctx, -6, -3, 11, 5); paint(ctx, '#ffab3d', INK, 2.6);
    ellipse(ctx, 13, -3, 11, 5); paint(ctx, '#ffab3d', INK, 2.6);
    ellipse(ctx, 0, -40, 28, 38); paint(ctx, '#3d4b73', INK, 3);
    ellipse(ctx, 8, -34, 18, 29); paint(ctx, '#fff');
    ellipse(ctx, 13, -58, 12, 10); paint(ctx, '#fff');
    ellipse(ctx, -9, -36, 8, 20, 0.35 + (run ? Math.sin(t * 9) * 0.25 : 0)); paint(ctx, '#34416a', INK, 2.6);
    ctx.beginPath(); ctx.moveTo(22, -59); ctx.lineTo(37, -54); ctx.lineTo(22, -49); ctx.closePath(); paint(ctx, '#ffab3d', INK, 2.4);
    eyeDot(ctx, 14, -61, 3.6); blush(ctx, 17, -50, 4.2);
    ellipse(ctx, -12, -58, 5, 9, 0.3); paint(ctx, 'rgba(255,255,255,.18)');
    ctx.restore();
  }

  function kangaroo(ctx, t, run) {
    var hop = run ? Math.abs(Math.sin(t * 6)) : 0, C = '#d9a066';
    ctx.save(); ctx.translate(0, -hop * 18);
    tube(ctx, function () { ctx.beginPath(); ctx.moveTo(-12, -22); ctx.quadraticCurveTo(-46, -12, -64, 0); }, 11, C);
    blob(ctx, [['e', -2, -18, 19, 16], ['e', 10, -4, 24, 6], ['e', 8, -44, 19, 27, -0.25], ['e', 27, -76, 14, 12], ['e', 40, -73, 10, 7],
      ['e', 21, -95, 5, 13, -0.2], ['e', 31, -94, 5, 13, 0.25]], C);
    ellipse(ctx, 15, -40, 10, 17, -0.25); paint(ctx, '#f5d8b0');
    ellipse(ctx, 21, -95, 2.2, 8, -0.2); paint(ctx, '#e9a9a9');
    ellipse(ctx, 31, -94, 2.2, 8, 0.25); paint(ctx, '#e9a9a9');
    ellipse(ctx, 24, -48, 5, 10, 0.6); paint(ctx, C, INK, 2.4);
    eyeDot(ctx, 31, -79, 3.2);
    circle(ctx, 49, -74, 3); paint(ctx, '#3a2618');
    smile(ctx, 42, -67, 4); blush(ctx, 34, -69, 3.8);
    ctx.restore();
  }

  function legs4(ctx, xs, top, len, g, run, color, hoof) {
    xs.forEach(function (x, i) {
      var a = run ? Math.sin(g + [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5][i]) * 0.5 : 0;
      ctx.save(); ctx.translate(x, top); ctx.rotate(a);
      roundRect(ctx, -4.5, 0, 9, len, 4.5); paint(ctx, color, INK, 2.6);
      if (hoof) { roundRect(ctx, -5, len - 7, 10, 8, 3); paint(ctx, hoof, INK, 2); }
      ctx.restore();
    });
  }

  function horse(ctx, t, run) {
    var g = run ? t * 9 : 0, bob = run ? Math.sin(g * 2) * 2.5 : 0, C = '#c98b56', M = '#6b4226';
    ctx.save(); ctx.translate(0, bob);
    tube(ctx, function () { ctx.beginPath(); ctx.moveTo(-32, -48); ctx.quadraticCurveTo(-52, -42, -50, -20); }, 7, M);
    legs4(ctx, [-24, -12, 20, 31], -38, 38, g, run, C, '#5a3825');
    blob(ctx, [['e', 0, -44, 36, 17], ['e', 31, -61, 10, 22, 0.55], ['e', 46, -77, 18, 10, 0.45]], C);
    ctx.beginPath(); ctx.moveTo(36, -86); ctx.lineTo(40, -99); ctx.lineTo(45, -87); ctx.closePath(); paint(ctx, C, INK, 2.4);
    tube(ctx, function () { ctx.beginPath(); ctx.moveTo(20, -50); ctx.quadraticCurveTo(24, -80, 38, -88); }, 6, M);
    ellipse(ctx, 57, -70, 7, 5, 0.45); paint(ctx, '#e3ad7d');
    circle(ctx, 59, -71, 1.8); paint(ctx, '#3a2618');
    eyeDot(ctx, 46, -82, 3); blush(ctx, 45, -72, 3.5);
    ctx.restore();
  }

  function cheetah(ctx, t, run) {
    var g = run ? t * 12 : 0, bob = run ? Math.sin(g * 2) * 2 : 0, C = '#f7c85a', S = '#6b4a2a';
    ctx.save(); ctx.translate(0, bob);
    tube(ctx, function () { ctx.beginPath(); ctx.moveTo(-34, -40); ctx.quadraticCurveTo(-62, -40, -70, -58); }, 6, C);
    circle(ctx, -70, -58, 3.6); paint(ctx, S);
    legs4(ctx, [-24, -13, 18, 28], -30, 30, g, run, C, null);
    blob(ctx, [['e', 0, -36, 38, 14], ['c', 42, -46, 14], ['c', 34, -58, 5], ['c', 48, -59, 5]], C);
    [[-20, -40], [-8, -32], [4, -42], [16, -34], [-28, -30], [10, -26], [-14, -46]].forEach(function (s) { circle(ctx, s[0], s[1], 2.8); paint(ctx, S); });
    ellipse(ctx, 49, -41, 8, 6); paint(ctx, '#fff4dc');
    stroke(ctx, [44, -46, 46, -38], 2, S);
    eyeDot(ctx, 44, -50, 3); circle(ctx, 55, -44, 2.4); paint(ctx, '#3a2618');
    smile(ctx, 51, -38, 3.5); blush(ctx, 38, -42, 3.4);
    ctx.restore();
  }

  function wing(ctx, x, y, a, color) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(4, 2); ctx.quadraticCurveTo(-8, -26, -46, -40); ctx.quadraticCurveTo(-30, -14, -22, 8); ctx.closePath();
    ctx.lineJoin = 'round'; paint(ctx, color, INK, 2.8);
    stroke(ctx, [-12, -8, -30, -26], 1.8, 'rgba(90,56,37,.35)');
    stroke(ctx, [-8, 0, -24, -12], 1.8, 'rgba(90,56,37,.35)');
    ctx.restore();
  }
  function falcon(ctx, t, run) {
    var f = Math.sin(t * (run ? 12 : 3)), C = '#7d93b8', DK = '#51688f';
    ctx.save(); ctx.translate(0, -44 + f * 3);
    wing(ctx, 0, -6, 0.2 - f * 0.45, DK);
    ctx.beginPath(); ctx.moveTo(-24, -2); ctx.lineTo(-52, -8); ctx.lineTo(-54, 8); ctx.lineTo(-24, 6); ctx.closePath(); paint(ctx, C, INK, 2.6);
    ellipse(ctx, 0, 0, 32, 15, -0.08); paint(ctx, C, INK, 3);
    ellipse(ctx, 6, 5, 20, 8, -0.08); paint(ctx, '#eef2f8');
    [[0, 3], [8, 5], [14, 3]].forEach(function (s) { stroke(ctx, [s[0], s[1], s[0] + 3, s[1] + 3], 1.6, DK); });
    circle(ctx, 30, -6, 13); paint(ctx, C, INK, 3);
    ctx.save(); circle(ctx, 30, -6, 12); ctx.clip(); ellipse(ctx, 27, -15, 15, 9); paint(ctx, DK); ctx.restore();
    stroke(ctx, [31, -3, 29, 5], 3, DK);
    ctx.beginPath(); ctx.moveTo(41, -9); ctx.quadraticCurveTo(51, -8, 47, 1); ctx.lineTo(41, -3); ctx.closePath(); paint(ctx, '#ffd23d', INK, 2.2);
    circle(ctx, 35, -8, 5); paint(ctx, '#ffd23d', INK, 1.8); eyeDot(ctx, 35.5, -8, 2.6);
    blush(ctx, 39, 0, 3);
    wing(ctx, -4, -4, -0.25 + f * 0.6, C);
    ctx.restore();
  }

  var ANIMAL_FN = { snail: snail, turtle: turtle, penguin: penguin, kangaroo: kangaroo, horse: horse, cheetah: cheetah, falcon: falcon };
  // rank 1..7 or an animal id; (x, y) = where the feet touch the ground
  function animal(ctx, which, x, y, s, t, o) {
    o = o || {};
    var id = typeof which === 'number' ? Data.ANIMALS[Math.max(0, Math.min(6, which - 1))].id : which;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    (ANIMAL_FN[id] || snail)(ctx, t || 0, !!o.run);
    ctx.restore();
  }

  // ---------------------------------------------------------------- janken hands (0 グー, 1 チョキ, 2 パー)
  // Drawn like the hand emoji ✊ ✌ ✋: the palm towards us, fingers up, the wrist at the bottom
  // (about 110 units tall, centred on the palm).

  var SKIN = '#ffd8b5';
  // A finger growing from its base (bx, by) at angle a (0 = straight up).
  function finger(ctx, bx, by, a, len, w) {
    ctx.save(); ctx.translate(bx, by); ctx.rotate(a);
    roundRect(ctx, -w / 2, -len, w, len + w / 2, w / 2);
    ctx.restore();
  }
  function nail(ctx, bx, by, a, len, w) {
    ctx.save(); ctx.translate(bx, by); ctx.rotate(a);
    ellipse(ctx, 0, -len + w * 0.6, w * 0.26, w * 0.34); paint(ctx, 'rgba(255,255,255,.6)');
    ctx.restore();
  }
  // Shapes that make one outline: all outlines first, then all fills.
  function oneShape(ctx, shapes, fill) {
    shapes.forEach(function (f) { f(); paint(ctx, null, INK, 6); });
    shapes.forEach(function (f) { f(); paint(ctx, fill); });
  }
  // A thumb lying across the hand, from (x, y) to the right, tilted by a.
  function thumbAcross(ctx, x, y, a, len, c) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    roundRect(ctx, 0, -8.5, len, 17, 8.5); paint(ctx, c, INK, 2.8);
    ellipse(ctx, len - 8, -2, 3.2, 4, 1.57); paint(ctx, 'rgba(255,255,255,.55)');
    ctx.restore();
  }
  var CREASE = 'rgba(90,56,37,.45)';

  function handPaper(ctx, c) {
    var F = [[-18, 0, -0.22, 40, 13], [-5, -3, -0.05, 47, 13.5], [9, -2, 0.12, 43, 13], [21, 4, 0.33, 33, 11.5]];
    var parts = F.map(function (f) { return function () { finger(ctx, f[0], f[1], f[2], f[3], f[4]); }; });
    parts.push(function () { finger(ctx, -21, 26, -1.02, 31, 14); });   // thumb
    parts.push(function () { roundRect(ctx, -26, -8, 52, 52, 19); });      // palm
    parts.push(function () { roundRect(ctx, -15, 36, 30, 22, 6); });       // wrist
    oneShape(ctx, parts, c);
    F.forEach(function (f) { nail(ctx, f[0], f[1], f[2], f[3], f[4]); });
    nail(ctx, -21, 26, -1.02, 31, 14);
    stroke(ctx, [-10, 38, -15, 24, -9, 12], 2.2, CREASE);   // the crease at the thumb
    stroke(ctx, [2, 14, 16, 12], 2, CREASE);
  }
  function handRock(ctx, c) {
    oneShape(ctx, [function () { roundRect(ctx, -30, -16, 60, 56, 20); }, function () { roundRect(ctx, -16, 30, 32, 28, 7); }], c);
    // the four bent fingers, knuckles towards us
    [[-21, -24], [-7, -29], [7, -29], [21, -25]].forEach(function (f) {
      roundRect(ctx, f[0] - 7.5, f[1], 15, 36, 7.5); paint(ctx, c, INK, 2.8);
      stroke(ctx, [f[0] - 3.5, f[1] + 12, f[0] + 3.5, f[1] + 12], 1.8, CREASE);
    });
    thumbAcross(ctx, -33, 14, -0.14, 44, c);
  }
  function handScissors(ctx, c) {
    var parts = [
      function () { finger(ctx, -11, 4, -0.26, 48, 13.5); },   // index
      function () { finger(ctx, 5, 4, 0.18, 50, 13.5); },      // middle
      function () { roundRect(ctx, -26, -6, 52, 50, 19); },     // palm
      function () { roundRect(ctx, -15, 36, 30, 22, 6); }       // wrist
    ];
    oneShape(ctx, parts, c);
    nail(ctx, -11, 4, -0.26, 48, 13.5); nail(ctx, 5, 4, 0.18, 50, 13.5);
    // the ring and little fingers folded into the palm, held down by the thumb
    [[14, 6, 12.5], [24, 10, 11.5]].forEach(function (f) { roundRect(ctx, f[0] - f[2] / 2, f[1], f[2], 24, f[2] / 2); paint(ctx, c, INK, 2.8); });
    thumbAcross(ctx, -30, 26, -0.26, 48, c);
  }

  function jankenHand(ctx, kind, x, y, s, color) {
    var c = color || SKIN;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (kind === 0) handRock(ctx, c);
    else if (kind === 1) handScissors(ctx, c);
    else handPaper(ctx, c);
    ctx.restore();
  }

  // ---------------------------------------------------------------- stamps (はんこ)

  var STAMP = '#e5484d';
  // kind 'kero': ケロちゃん's face; 'hana': はなまる (every 5th stamp)
  function stamp(ctx, x, y, r, kind, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.scale(r / 50, r / 50);
    ctx.globalAlpha = alpha == null ? 0.92 : alpha;
    ctx.strokeStyle = STAMP; ctx.fillStyle = STAMP; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (kind === 'hana') {
      // petals around a spiral
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (var i = 0; i <= 200; i++) {
        var q = i / 200 * TAU, rr = 40 + Math.abs(Math.sin(q * 3.5)) * 8;
        var px = Math.cos(q) * rr, py = Math.sin(q) * rr;
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.stroke();
      ctx.beginPath();
      for (var a = 0; a < Math.PI * 5; a += 0.08) {
        var sr = 30 * (1 - a / (Math.PI * 5.6));
        var sx = Math.cos(a) * sr, sy = Math.sin(a) * sr;
        if (a) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
      }
      ctx.lineWidth = 5.5; ctx.stroke();
    } else {
      ctx.lineWidth = 5;
      circle(ctx, 0, 0, 46); ctx.stroke();
      // the frog face, all in stamp red
      ctx.lineWidth = 4.2;
      circle(ctx, -16, -14, 12); ctx.stroke();
      circle(ctx, 16, -14, 12); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 8, 30, 20, 0, Math.PI * 1.08, Math.PI * 1.92, true); ctx.stroke();
      circle(ctx, -16, -13, 4.5); ctx.fill();
      circle(ctx, 16, -13, 4.5); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-10, 10); ctx.quadraticCurveTo(0, 19, 10, 10); ctx.lineWidth = 3.6; ctx.stroke();
      ellipse(ctx, -22, 7, 5, 3); ctx.fill();
      ellipse(ctx, 22, 7, 5, 3); ctx.fill();
    }
    // worn ink: a few pale specks
    ctx.globalCompositeOperation = 'destination-out';
    var seed = kind === 'hana' ? 3 : 7;
    for (var k = 0; k < 16; k++) {
      seed = (seed * 16807) % 2147483647;
      var ang = seed % 628 / 100, dist = (seed >> 3) % 44;
      circle(ctx, Math.cos(ang) * dist, Math.sin(ang) * dist, 1.2 + (seed % 3) * 0.6); ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- things the trainings share

  var BALLOONS = ['#ff94c2', '#ffd23d', '#66c3ff', '#8bd86a', '#b48cff', '#ffa552'];
  function balloon(ctx, x, y, r, color, t, label, o) {
    o = o || {};
    var sway = o.still ? 0 : Math.sin((t || 0) * 1.4 + x * 0.05) * 3;
    ctx.save(); ctx.translate(x + sway, y);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, r * 1.05); ctx.quadraticCurveTo(-sway + 5, r * 1.8, -sway * 0.6, r * 2.5);
    paint(ctx, null, 'rgba(90,56,37,.45)', 1.8);
    ellipse(ctx, 0, 0, r * 0.88, r); paint(ctx, color, INK, Math.max(2, r * 0.08));
    ctx.beginPath(); ctx.moveTo(-r * 0.14, r + r * 0.16); ctx.lineTo(0, r - r * 0.04); ctx.lineTo(r * 0.14, r + r * 0.16); ctx.closePath();
    paint(ctx, color, INK, Math.max(1.6, r * 0.06));
    ellipse(ctx, -r * 0.36, -r * 0.42, r * 0.2, r * 0.12, -0.7); paint(ctx, 'rgba(255,255,255,.85)');
    if (label != null) text(ctx, String(label), 0, r * 0.04, r * (String(label).length > 1 ? 0.78 : 0.95), '#fff', { lw: r * 0.2 });
    ctx.restore();
  }

  // A lily pad with a number or letter. state: 0 waiting, 1 visited, 2 the next one (for hints)
  function pad(ctx, x, y, r, label, state, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.ellipse(0, 0, r, r * 0.8, 0, -1.25, 4.7); ctx.closePath();
    paint(ctx, state === 1 ? '#bfe7a5' : '#6cc46a', '#2f7d3b', 3);
    ctx.strokeStyle = state === 1 ? 'rgba(90,150,70,.35)' : 'rgba(200,245,180,.6)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (var i = 0; i < 4; i++) {
      var q = 0.1 + i * 1.2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(q) * r * 0.8, Math.sin(q) * r * 0.64); ctx.stroke();
    }
    if (label != null) {
      circle(ctx, 0, 0, r * 0.52); paint(ctx, state === 1 ? 'rgba(255,255,255,.55)' : '#fffdf5', INK, 2.4);
      text(ctx, String(label), 0, 1, r * (String(label).length > 1 ? 0.52 : 0.62), state === 1 ? '#9bb08e' : INK, { stroke: false });
    }
    ctx.restore();
  }

  // ケロちゃん's house. door 0..1 open, roof 0..1 lifted (to peek inside).
  function house(ctx, x, y, s, door, roof, inside) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // walls (y = 0 is the ground)
    roundRect(ctx, -80, -110, 160, 110, 8); paint(ctx, '#fff3dc', INK, 3.5);
    if (inside) { ctx.save(); roundRect(ctx, -76, -106, 152, 102, 6); ctx.clip(); inside(ctx); ctx.restore(); }
    // window
    if (!inside) {
      roundRect(ctx, 26, -88, 36, 32, 6); paint(ctx, '#bfe7ff', INK, 3);
      stroke(ctx, [44, -88, 44, -56], 2.4); stroke(ctx, [26, -72, 62, -72], 2.4);
      roundRect(ctx, -62, -88, 36, 32, 6); paint(ctx, '#bfe7ff', INK, 3);
      stroke(ctx, [-44, -88, -44, -56], 2.4); stroke(ctx, [-62, -72, -26, -72], 2.4);
    }
    // door: a dark doorway, the door swings open toward us (left out while we peek inside)
    if (!inside) {
      roundRect(ctx, -22, -64, 44, 64, 14); paint(ctx, '#5a3825');
      var dw = 44 * (1 - (door || 0) * 0.85);
      roundRect(ctx, -22, -64, dw, 64, 14); paint(ctx, '#e8a15f', INK, 3);
      if (dw > 12) { circle(ctx, -22 + dw - 7, -30, 3); paint(ctx, '#ffd23d', INK, 1.6); }
    }
    // roof
    ctx.save();
    var lift = roof || 0;
    // the roof opens like a lid, hinged at its left eave
    ctx.translate(-98, -104 - 30 * lift); ctx.rotate(-0.42 * lift); ctx.translate(98, 104);
    ctx.beginPath(); ctx.moveTo(-98, -104); ctx.lineTo(0, -170); ctx.lineTo(98, -104); ctx.closePath();
    paint(ctx, '#ff8f9f', INK, 3.5);
    ctx.beginPath(); ctx.moveTo(-60, -130); ctx.lineTo(0, -168); ctx.lineTo(60, -130); paint(ctx, null, 'rgba(255,255,255,.35)', 3);
    roundRect(ctx, 38, -176, 20, 34, 3); paint(ctx, '#d98b57', INK, 3);
    ctx.restore();
    ctx.restore();
  }

  // A little bird (ことり) in side view. o: { flap (phase) | null when perched, dir: 1 right / -1 left, color }
  var BIRDS = ['#6cc6ff', '#ff8fb0', '#ffd23d', '#8bd86a'];
  function bird(ctx, x, y, s, t, o) {
    o = o || {};
    var c = o.color || BIRDS[0];
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.dir === -1 ? -1 : 1), s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (o.flap == null) { stroke(ctx, [-3, 10, -5, 17], 2.4, '#f08a2a'); stroke(ctx, [4, 10, 4, 17], 2.4, '#f08a2a'); }
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-24, -5); ctx.lineTo(-22, 5); ctx.closePath(); paint(ctx, c, INK, 2.2);
    circle(ctx, 0, 0, 13); paint(ctx, c, INK, 2.6);
    ellipse(ctx, 3, 5, 8, 6); paint(ctx, 'rgba(255,255,255,.75)');
    var wa = o.flap != null ? Math.sin(o.flap) * 0.9 : 0;
    ctx.save(); ctx.translate(-3, 1); ctx.rotate(-0.3 - wa);
    ellipse(ctx, -2, -4, 9, 5.5); paint(ctx, c, INK, 2.2);
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(11, -4); ctx.lineTo(19, -1); ctx.lineTo(11, 2); ctx.closePath(); paint(ctx, '#ffab3d', INK, 1.8);
    eyeDot(ctx, 5, -4, 2.4);
    blush(ctx, 7, 2, 2.4);
    ctx.restore();
  }
  function butterfly(ctx, x, y, s, t, color) {
    var f = Math.abs(Math.sin(t * 9)) * 0.7 + 0.3;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineJoin = 'round';
    [[-1, 1], [1, 1]].forEach(function (d) {
      ctx.save(); ctx.scale(d[0] * f, 1);
      ellipse(ctx, 10, -7, 11, 9, -0.5); paint(ctx, color || '#ffb347', INK, 2.2);
      ellipse(ctx, 8, 7, 7, 6, 0.5); paint(ctx, color || '#ffb347', INK, 2.2);
      circle(ctx, 11, -8, 3); paint(ctx, 'rgba(255,255,255,.8)');
      ctx.restore();
    });
    ellipse(ctx, 0, 0, 3, 11); paint(ctx, '#5a3825');
    stroke(ctx, [0, -10, -4, -17], 1.6); stroke(ctx, [0, -10, 4, -17], 1.6);
    ctx.restore();
  }
  function ladybug(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    circle(ctx, 0, -9, 6); paint(ctx, '#3a2618', INK, 2);
    circle(ctx, 0, 2, 12); paint(ctx, '#ff5a5a', INK, 2.4);
    stroke(ctx, [0, -9, 0, 14], 2);
    [[-5, -2], [5, -2], [-6, 7], [6, 7]].forEach(function (p) { circle(ctx, p[0], p[1], 2.4); paint(ctx, '#3a2618'); });
    circle(ctx, -4, -4, 2); paint(ctx, 'rgba(255,255,255,.7)');
    ctx.restore();
  }
  function bee(ctx, x, y, s, t) {
    var f = Math.sin(t * 30) * 0.3;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineJoin = 'round';
    ellipse(ctx, -3, -10, 7, 10, -0.5 + f); paint(ctx, 'rgba(220,240,255,.9)', INK, 2);
    ellipse(ctx, 5, -10, 7, 10, 0.5 - f); paint(ctx, 'rgba(220,240,255,.9)', INK, 2);
    ellipse(ctx, 0, 0, 13, 9); paint(ctx, '#ffd23d', INK, 2.4);
    ctx.save(); ellipse(ctx, 0, 0, 12, 8); ctx.clip();
    ctx.fillStyle = '#3a2618'; ctx.fillRect(-6, -9, 4, 18); ctx.fillRect(1, -9, 4, 18);
    ctx.restore();
    eyeDot(ctx, 8, -2, 1.8);
    ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(-17, 1); paint(ctx, null, INK, 2);
    ctx.restore();
  }

  // A block for はこ かぞえ, drawn from slightly above (size = edge).
  function cube(ctx, x, y, size, color) {
    var h = size * 0.5;
    ctx.save(); ctx.translate(x, y);
    ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(size, -h); ctx.lineTo(size + h * 0.8, -h * 1.6); ctx.lineTo(h * 0.8, -h * 1.6); ctx.closePath();
    paint(ctx, shade(color, 1.18), INK, 2.4);
    ctx.beginPath(); ctx.moveTo(size, -h); ctx.lineTo(size + h * 0.8, -h * 1.6); ctx.lineTo(size + h * 0.8, size - h * 1.6); ctx.lineTo(size, size - h); ctx.closePath();
    paint(ctx, shade(color, 0.82), INK, 2.4);
    roundRect(ctx, 0, -h, size, size, 3); paint(ctx, color, INK, 2.4);
    ctx.restore();
  }
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(v) { return Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) * 2.2 : v * k))); }
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }

  function rock(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-20, 0); ctx.quadraticCurveTo(-22, -20, -6, -26); ctx.quadraticCurveTo(14, -30, 20, -12); ctx.quadraticCurveTo(24, -2, 20, 0); ctx.closePath();
    ctx.lineJoin = 'round'; paint(ctx, '#b8aca0', INK, 3);
    ellipse(ctx, -6, -18, 6, 3, -0.4); paint(ctx, 'rgba(255,255,255,.5)');
    ctx.restore();
  }
  function mushroom(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    roundRect(ctx, -8, -18, 16, 18, 6); paint(ctx, '#fff3dc', INK, 3);
    ctx.beginPath(); ctx.moveTo(-22, -14); ctx.quadraticCurveTo(-22, -38, 0, -38); ctx.quadraticCurveTo(22, -38, 22, -14); ctx.closePath();
    ctx.lineJoin = 'round'; paint(ctx, '#ff6b6b', INK, 3);
    [[-10, -26, 4], [6, -30, 3.5], [12, -20, 3]].forEach(function (p) { circle(ctx, p[0], p[1], p[2]); paint(ctx, '#fff'); });
    ctx.restore();
  }

  // Green chalkboard with a wooden frame.
  function chalkboard(ctx, x, y, w, h) {
    roundRect(ctx, x, y, w, h, 14); paint(ctx, '#c98e57', INK, 3.5);
    roundRect(ctx, x + 10, y + 10, w - 20, h - 20, 8); paint(ctx, '#3f7d5a', INK, 2.5);
    ctx.save(); roundRect(ctx, x + 10, y + 10, w - 20, h - 20, 8); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    for (var i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(x + 40 + i * 70, y + h * 0.3 + (i % 2) * 30, 50, 12, -0.3, 0, TAU); ctx.fill(); }
    ctx.restore();
    roundRect(ctx, x + w * 0.62, y + h - 16, 34, 7, 3.5); paint(ctx, '#fff', INK, 1.6);
  }

  // Frame for the pictures of さっきの え.
  function card(ctx, x, y, w, h, color) {
    roundRect(ctx, x, y, w, h, 18); paint(ctx, '#fffdf7', INK, 3.5);
    roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 12); paint(ctx, null, color || '#ffd0e4', 3);
  }

  // Egg with a number on it (ぱっと おぼえて). flip = 0..1: it turns around and the number is hidden from 0.5 on.
  function numberEgg(ctx, kind, x, y, r, label, flip, t) {
    var sx = Math.abs(Math.cos(flip * Math.PI));
    ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.05, sx), 1);
    D.egg(ctx, kind, 0, 0, r, t || 0, 0);
    if (label != null && flip < 0.5) {
      circle(ctx, 0, r * 0.12, r * 0.55); paint(ctx, '#fffdf5', INK, 2.4);
      text(ctx, String(label), 0, r * 0.14, r * 0.75, INK, { stroke: false });
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- a big ○ and × (quiz style)

  function maru(ctx, x, y, r, a) {
    ctx.save(); ctx.globalAlpha = a == null ? 1 : a;
    circle(ctx, x, y, r); ctx.lineWidth = r * 0.3; ctx.strokeStyle = 'rgba(90,56,37,.35)'; ctx.stroke();
    circle(ctx, x, y, r); ctx.lineWidth = r * 0.22; ctx.strokeStyle = '#ff4f6a'; ctx.stroke();
    ctx.restore();
  }
  function batsu(ctx, x, y, r, a) {
    ctx.save(); ctx.globalAlpha = a == null ? 1 : a;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r);
    ctx.lineWidth = r * 0.36; ctx.strokeStyle = 'rgba(90,56,37,.35)'; ctx.stroke();
    ctx.lineWidth = r * 0.26; ctx.strokeStyle = '#4f8dff'; ctx.stroke();
    ctx.restore();
  }

  return {
    FONT: FONT, BALLOONS: BALLOONS, BIRDS: BIRDS, SKIN: SKIN,
    blob: blob, eyeDot: eyeDot, smile: smile, blush: blush, stroke: stroke, tube: tube, text: text, shade: shade,
    hakase: hakase, animal: animal, jankenHand: jankenHand, stamp: stamp,
    balloon: balloon, pad: pad, house: house, bird: bird, butterfly: butterfly, ladybug: ladybug, bee: bee,
    cube: cube, rock: rock, mushroom: mushroom, chalkboard: chalkboard, card: card, numberEgg: numberEgg,
    maru: maru, batsu: batsu
  };
}());
