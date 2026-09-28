/* For checking the game in a browser without touching it: a pretend player that answers every training.
   Load it into the page from the console:
     var s = document.createElement('script'); s.src = 'tools/autoplay.js'; document.head.appendChild(s);
   then e.g.  TT.start('keisan', 'n'); TT.play(60);  (the page must be on localhost, where the game is silent). */
window.TT = {
  press: function (v) {
    var b = Array.prototype.find.call(document.querySelectorAll('.nkey'), function (x) { return x.textContent === String(v); });
    if (b) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  },
  cho: function (i) {
    var b = document.querySelectorAll('.cho')[i];
    if (b) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  },
  // one right answer, if the training is waiting for one
  act: function () {
    var r = GUNGUN.run;
    if (!r || r.done || r.state !== 'play' || !r.session.peek) return false;
    var v = r.session.peek(), id = r.tr.id;
    if (v == null) return false;
    if (id === 'keisan' || id === 'nannin' || id === 'tori') { if (r.params.adult) String(v).split('').forEach(TT.press); else TT.press(v); }
    else if (id === 'janken' || id === 'sakki' || id === 'kotoba') TT.cho(v);
    else if (id === 'jump') { if (v.jump) r.session.jump(); else GUNGUN.tap(v.x, v.y); }
    else if (id === 'sudoku') { GUNGUN.tap(v.x, v.y); TT.cho(v.egg); }
    else if (id === 'nanika') { if (v.skip) r.session.skip(); else GUNGUN.tap(v.x, v.y); }
    else GUNGUN.tap(v.x, v.y);
    return true;
  },
  // plays for up to `sec` game seconds, thinking `think` seconds before each answer
  play: function (sec, think) {
    think = think || 0.6;
    var t = 0;
    while (t < sec && GUNGUN.run && !GUNGUN.run.done) {
      var r = GUNGUN.run, v = r.state === 'play' && r.session.peek && r.session.peek();
      if (v != null && v !== false) { GUNGUN.tick(think); t += think; TT.act(); }
      GUNGUN.tick(0.2); t += 0.2;
    }
    return [GUNGUN.screen, GUNGUN.run && GUNGUN.run.tr.id, !GUNGUN.run || GUNGUN.run.done, Math.round(t)];
  },
  // opens a training (skipping its practice) and runs the countdown
  start: function (id, lv, opts) {
    var s = GUNGUN.save;
    s.data[s.cur].seen[id] = true;
    document.getElementById('overlay').classList.remove('on');
    GUNGUN.go('list');
    GUNGUN.openIntro(GUNGUN.T.byId[id]);
    GUNGUN.startRun(GUNGUN.T.byId[id], lv, opts || {});
    GUNGUN.tick(2.4);
    return GUNGUN.run.state;
  },
  // until the training asks something
  until: function (max) { var n = 0; while (GUNGUN.run && GUNGUN.run.session.peek && GUNGUN.run.session.peek() == null && n++ < (max || 300)) GUNGUN.tick(0.1); return n; },
  result: function () { GUNGUN.tick(1.5); return [GUNGUN.screen, document.getElementById('r-title').textContent, document.getElementById('r-detail').textContent]; }
};
