/* ケロちゃん あたま ぐんぐん — ふたりで (two players on one phone, like the original's "みんなで").
   The phone lies on a table between the players; the top half of the screen is upside down for the
   player across. Both get the same question; the first right answer scores. A wrong answer sits out
   the rest of that round. A grown-up waits a few seconds before answering (the handicap). */
var Versus = (function () {
  'use strict';
  var D = Draw, A = Art, S = Sound, T = Trainings, U = T.U;
  var host = null, W = 360, HALF = 320, ROUNDS = 5;
  var $ = function (id) { return document.getElementById(id); };
  var GAMES = [
    { id: 'tori', name: 'とり かぞえ', ask: 'ことりは なんわ？' },
    { id: 'hako', name: 'はこ かぞえ', ask: 'つみきは いくつ？' },
    { id: 'janken', name: 'あとだし じゃんけん', ask: '' }
  ];
  var TORI = { e: { birds: [2, 4], others: 2, move: 0 }, n: { birds: [3, 6], others: 4, move: 1 }, h: { birds: [4, 8], others: 5, move: 2 } };
  var TORI_BOX = { x0: 40, y0: 44, x1: 320, y1: 156 };
  var ASKS = { e: ['win'], n: ['win', 'lose'], h: ['win', 'lose', 'draw'] };
  var ASK_TEXT = { win: 'かって！', lose: 'まけて！', draw: 'あいこ！' }, ASK_COLOR = { win: '#ffb347', lose: '#7cc8ff', draw: '#8bd86a' };
  var SIDES = [{ id: 'bottom', name: 'みどり', color: '#86d65c' }, { id: 'top', name: 'ピンク', color: '#ff8fc0' }];

  var setup = { game: 'tori', level: 'e', types: { bottom: 'kid', top: 'adult' } };
  var play = null;

  // ---------------------------------------------------------------- setup screen

  function open() {
    var card = $('vs-card');
    setup.wait = host.save.handicap;
    card.innerHTML =
      '<div class="vs-title">なにで あそぶ？</div><div class="vs-games" id="vs-games"></div>' +
      row('むずかしさ', 'vs-level', [['e', 'かんたん'], ['n', 'ふつう'], ['h', 'むずかしい']]) +
      row('うえ（ピンク）', 'vs-top-type', [['kid', 'こども'], ['adult', 'おとな']]) +
      row('した（みどり）', 'vs-bottom-type', [['kid', 'こども'], ['adult', 'おとな']]) +
      row('おとなが まつ びょう', 'vs-wait', [['0', '0'], ['1', '1'], ['2', '2'], ['3', '3']]) +
      '<button id="vs-start" class="btn big"><span data-icon="next"></span>はじめる</button>' +
      '<p class="vs-note">スマホを つくえに おいて<br>むかいあって あそんでね</p>';
    var gbox = $('vs-games');
    GAMES.forEach(function (g) {
      var b = document.createElement('button');
      b.className = 'vs-game' + (setup.game === g.id ? ' on' : '');
      b.appendChild(host.iconCanvas(T.byId[g.id], 52));
      b.insertAdjacentHTML('beforeend', '<span>' + g.name + '</span>');
      b.addEventListener('click', function () { S.play('select'); setup.game = g.id; open(); });
      gbox.appendChild(b);
    });
    wireSeg('vs-level', setup.level, function (v) { setup.level = v; });
    wireSeg('vs-top-type', setup.types.top, function (v) { setup.types.top = v; });
    wireSeg('vs-bottom-type', setup.types.bottom, function (v) { setup.types.bottom = v; });
    wireSeg('vs-wait', String(setup.wait), function (v) { setup.wait = +v; host.save.handicap = +v; host.store(); });
    host.setIcons(card);
    $('vs-start').addEventListener('click', function () { S.play('click'); host.forward(start); });
    host.show('vs');
  }
  function row(label, id, opts) {
    return '<div class="vs-row"><span>' + label + '</span><div class="seg small" id="' + id + '">' +
      opts.map(function (o) { return '<button data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
  }
  function wireSeg(id, cur, set) {
    var btns = document.querySelectorAll('#' + id + ' button');
    btns.forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-v') === cur);
      b.addEventListener('click', function () {
        S.play('select'); set(b.getAttribute('data-v'));
        btns.forEach(function (x) { x.classList.toggle('on', x === b); });
      });
    });
  }

  // ---------------------------------------------------------------- playing

  function start() {
    play = {
      game: setup.game, level: setup.level, round: 0, state: 'ready', t: 0, clock: 0, q: null, winner: null,
      players: {}
    };
    SIDES.forEach(function (sd) {
      play.players[sd.id] = { side: sd, type: setup.types[sd.id], score: 0, locked: false, wait: 0, mark: null, markT: 0 };
    });
    buildHalf('bottom'); buildHalf('top');
    host.show('vsplay');
    host.requestWake();
    newRound();
  }

  function buildHalf(id) {
    var el = $(id === 'top' ? 'vs-top' : 'vs-bottom'), pl = play.players[id];
    el.innerHTML = '<div class="vs-score" style="--c:' + pl.side.color + '"><i></i><b>' + pl.side.name + '</b> <span class="pts">0</span>てん</div>' +
      '<div class="vs-wait-cover" hidden><b>まってね</b><span class="n">2</span></div>' +
      '<div class="vs-end" hidden></div>';
    var box = document.createElement('div');
    if (play.game === 'janken') {
      box.className = 'vs-hands';
      [0, 1, 2].forEach(function (h) {
        var b = document.createElement('button');
        b.className = 'cho';
        var cv = host.makeCanvas(96, 96), g = cv.getContext('2d');
        g.scale(2, 2); A.jankenHand(g, h, 48, 44, 0.66); A.text(g, ['グー', 'チョキ', 'パー'][h], 48, 86, 13, D.INK, { stroke: false });
        b.appendChild(cv);
        b.addEventListener('pointerdown', function (e) { e.preventDefault(); host.press(b); answer(id, h, b); });
        box.appendChild(b);
      });
    } else {
      box.className = 'vs-pad';
      [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10]].forEach(function (keys) {
        var r = document.createElement('div'); r.className = 'krow';
        keys.forEach(function (k) {
          var b = document.createElement('button');
          b.className = 'nkey' + (k === 10 ? ' ten' : '');
          b.textContent = k;
          b.addEventListener('pointerdown', function (e) { e.preventDefault(); host.press(b); answer(id, k, b); });
          r.appendChild(b);
        });
        box.appendChild(r);
      });
    }
    el.appendChild(box);
    pl.el = el;
  }

  function newRound() {
    play.round++;
    play.state = 'ready'; play.t = 0; play.winner = null;
    var lv = play.level, r = Math.random;
    if (play.game === 'tori') play.q = T.byId.tori.scene(TORI[lv], r, TORI_BOX, 40);
    else if (play.game === 'hako') play.q = T.byId.hako.pile(T.byId.hako.levels[lv], r);
    else {
      var hand = U.int(r, 0, 2), ask = U.pick(r, ASKS[lv]);
      play.q = { hand: hand, ask: ask, answer: T.byId.janken.answerFor(hand, ask) };
    }
    SIDES.forEach(function (sd) {
      var pl = play.players[sd.id];
      pl.locked = false; pl.mark = null;
      pl.wait = pl.type === 'adult' ? setup.wait : 0;
      pl.el.querySelectorAll('.cho, .nkey').forEach(function (b) { b.classList.remove('ok', 'ng', 'dim'); });
    });
  }

  function answer(id, v, btn) {
    var pl = play && play.players[id];
    if (!pl || play.state !== 'show' || pl.locked || pl.wait > 0) return;
    if (v === play.q.answer) {
      pl.score++; pl.mark = 'ok'; pl.markT = 0;
      btn.classList.add('ok');
      play.winner = id;
      S.play('ok');
      reveal();
    } else {
      pl.locked = true; pl.mark = 'ng'; pl.markT = 0;
      btn.classList.add('ng');
      pl.el.querySelectorAll('.cho, .nkey').forEach(function (b) { if (b !== btn) b.classList.add('dim'); });
      S.play('ng');
      if (SIDES.every(function (sd) { return play.players[sd.id].locked; })) reveal();
    }
  }
  function reveal() {
    play.state = 'reveal'; play.t = 0;
    SIDES.forEach(function (sd) { var pl = play.players[sd.id]; pl.el.querySelector('.pts').textContent = pl.score; });
    if (play.winner) {
      var w = play.players[play.winner];
      host.burst(W / 2, play.winner === 'bottom' ? 470 : 170, 14, w.side.color);
    }
  }
  function finish() {
    play.state = 'end'; play.t = 0;
    var b = play.players.bottom.score, tp = play.players.top.score;
    S.play(b === tp ? 'soft' : 'fanfare');
    host.confetti(60);
    host.speak(b === tp ? 'ひきわけ！' : (b > tp ? 'みどり' : 'ピンク') + 'の かち！');
    SIDES.forEach(function (sd) {
      var pl = play.players[sd.id], other = play.players[sd.id === 'top' ? 'bottom' : 'top'];
      var end = pl.el.querySelector('.vs-end');
      end.hidden = false;
      end.innerHTML = '<div class="vs-end-title">' + (pl.score === other.score ? 'ひきわけ！' : pl.score > other.score ? 'かち！' : 'まけ… つぎは がんばろう') + '</div>' +
        '<div class="vs-end-score">' + pl.score + ' − ' + other.score + '</div>' +
        '<div class="panel-row"><button class="btn vs-again">もういちど</button><button class="btn vs-exit">おわる</button></div>';
      end.querySelector('.vs-again').addEventListener('click', function () { S.play('click'); start(); });
      end.querySelector('.vs-exit').addEventListener('click', function () { S.play('click'); history.back(); });
    });
  }

  // ---------------------------------------------------------------- each frame

  function frame(dt, c) {
    host.drawBackground(1);
    host.worldTransform(c);
    if (!play) return;
    play.t += dt; play.clock += dt;
    var t = play.t;
    if (play.state === 'ready' && t > 1.0) {
      play.state = 'show'; play.t = 0;
      S.play('go');
      host.speak(play.game === 'janken' ? ASK_TEXT[play.q.ask] : GAMES.filter(function (g) { return g.id === play.game; })[0].ask);
    } else if (play.state === 'show') {
      SIDES.forEach(function (sd) { var pl = play.players[sd.id]; if (pl.wait > 0) pl.wait = Math.max(0, pl.wait - dt); });
      if (t > 20) reveal();
    } else if (play.state === 'reveal' && t > 2.0) {
      if (play.round >= ROUNDS) finish(); else newRound();
    }
    SIDES.forEach(function (sd) {
      var pl = play.players[sd.id], cover = pl.el.querySelector('.vs-wait-cover');
      var waiting = play.state === 'show' && pl.wait > 0;
      cover.hidden = !waiting;
      if (waiting) cover.querySelector('.n').textContent = Math.ceil(pl.wait);
      pl.markT += dt;
    });
    // the two halves: the top one is drawn upside down
    c.save(); c.translate(0, HALF); drawHalf(c, 'bottom'); c.restore();
    c.save(); c.translate(W, HALF); c.rotate(Math.PI); drawHalf(c, 'top'); c.restore();
    // the line in between
    D.roundRect(c, -10, HALF - 3, W + 20, 6, 3); D.paint(c, 'rgba(90,56,37,.35)');
    host.drawFx(c);
  }

  function drawHalf(c, id) {
    var pl = play.players[id], q = play.q, t = play.t, clock = play.clock;
    c.save();
    c.beginPath(); c.rect(0, 4, W, HALF - 4); c.clip();
    D.roundRect(c, 12, 14, W - 24, 152, 22); D.paint(c, 'rgba(255,255,255,.75)', D.INK, 3);
    if (play.state === 'ready') {
      A.text(c, 'よーい…', 180, 90, 34, '#fff', { lw: 7 });
      A.text(c, play.round + ' / ' + ROUNDS, 180, 136, 18, D.INK, { stroke: false });
    } else if (play.state !== 'end') {
      if (play.game === 'tori') {
        T.byId.tori.drawForest(c, D, 18, 20, 342, 160);
        var tori = T.byId.tori, n = 0;
        q.things.forEach(function (th) {
          var at = play.state === 'show' ? (th.last = tori.place(th, t, TORI[play.level].move, TORI_BOX)) : (th.last || th);
          c.save(); c.translate(at.x, at.y); c.scale(0.8, 0.8); c.translate(-at.x, -at.y);
          tori.drawThing(c, A, th, at, clock);
          c.restore();
          if (play.state === 'reveal' && th.bird) {
            n++;
            D.circle(c, at.x, at.y - 20, 9); D.paint(c, '#fff', D.INK, 2);
            A.text(c, String(n), at.x, at.y - 19, 12, D.INK, { stroke: false });
          }
        });
      } else if (play.game === 'hako') {
        var hako = T.byId.hako, show = hako.levels[play.level].show;
        hako.drawPile(c, q, 180, 150, 26);
        if (play.state === 'show' && t > show) {
          // a cloth over the blocks
          c.save(); c.beginPath(); c.moveTo(70, 156); c.quadraticCurveTo(80, 24, 180, 26); c.quadraticCurveTo(280, 24, 290, 156); c.closePath();
          D.paint(c, '#b48cff', D.INK, 3); c.restore();
          D.circle(c, 180, 30, 8); D.paint(c, '#ffd23d', D.INK, 2);
        }
      } else {
        D.circle(c, 104, 90, 62); D.paint(c, '#fffdf5', D.INK, 3.5);
        A.jankenHand(c, q.hand, 104, 94, 0.95, '#9ee07a');
        c.save(); c.translate(258, 90);
        D.roundRect(c, -72, -28, 144, 56, 28); D.paint(c, ASK_COLOR[q.ask], D.INK, 3.5);
        A.text(c, ASK_TEXT[q.ask], 0, 2, 30, '#fff', { lw: 7 });
        c.restore();
      }
      if (play.state === 'reveal') {
        var ans = play.game === 'janken' ? ['グー', 'チョキ', 'パー'][q.answer] : String(q.answer);
        D.roundRect(c, 110, 170, 140, 30, 15); D.paint(c, '#fffdf5', D.INK, 2.5);
        A.text(c, 'こたえ：' + ans, 180, 186, 16, D.INK, { stroke: false });
        if (play.winner === id) { A.maru(c, 300, 60, 34, Math.min(1, pl.markT * 4)); A.text(c, '+1', 300, 120, 22, '#ff8fc0', { lw: 5 }); }
      } else if (pl.mark === 'ng') {
        A.batsu(c, 300, 60, 30, 0.85);
      }
    }
    c.restore();
  }

  function quit() {
    if (!play) { host.go('title'); return; }
    play = null;
    host.releaseWake();
    open();
  }

  function init(h) {
    host = h;
    $('vs-quit').addEventListener('click', function () { S.play('click'); history.back(); });
  }

  // for playtesting: the right answer while a question is up
  function peek() { return play && play.state === 'show' ? play.q.answer : null; }

  return { init: init, open: open, frame: frame, quit: quit, pause: function () {}, down: function () {}, peek: peek };
}());
