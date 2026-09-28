// Checks the question makers of every training (many times at every level), the rank limits,
// the songs, and the save data rules.
// usage: node tools/verify.js
'use strict';
global.Trainings = require('../js/trainings.js');
global.Data = require('../js/data.js');
const Data = global.Data;
const C = require('../js/core.js');
const IDS = ['keisan', 'ookii', 'junban', 'patto', 'nannin', 'sakki', 'janken', 'jump', 'tori', 'kotoba', 'piano', 'sudoku', 'nanika', 'hako'];
IDS.forEach(id => require('../js/tr/' + id + '.js'));
const T = global.Trainings, U = T.U;

let bad = 0, checks = 0;
function check(ok, msg) { checks++; if (!ok) { bad++; if (bad < 60) console.log('  NG ' + msg); } }
const RUNS = 300;
function levelsOf(tr) { return Object.keys(tr.levels).filter(l => l !== 'practice'); }
function params(tr, lv, practice) {
  const p = Object.assign({}, tr.levels[lv]);
  if (practice) Object.assign(p, tr.levels.practice || {}, { practice: true });
  p.adult = lv === 'a' || lv === 'testA';
  return p;
}
function eachParams(tr, fn) {
  levelsOf(tr).forEach(lv => { fn(params(tr, lv, false), lv); if (tr.levels.practice) fn(params(tr, lv, true), lv + '+practice'); });
}
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// ---------------------------------------------------------------- the list, levels and rank limits
console.log('trainings and ranks');
Data.TRAININGS.forEach(t => check(!!T.byId[t.id], 'missing training ' + t.id));
Data.CHECK.forEach(c => c.tests.forEach(id => check(!!T.byId[id] && T.byId[id].levels.test && T.byId[id].levels.testA, 'check test ' + id + ' needs test and testA levels')));
T.list.forEach(tr => {
  check(['time', 'count'].includes(tr.kind), tr.id + ' kind');
  check(typeof tr.icon === 'function', tr.id + ' icon');
  if (!tr.versusOnly) check(typeof tr.start === 'function', tr.id + ' start');
  Object.keys(tr.ranks).forEach(lv => {
    const c = tr.ranks[lv];
    check(c.length === 6, tr.id + ' ' + lv + ' needs 6 limits');
    for (let i = 1; i < 6; i++) check(tr.kind === 'time' ? c[i] > c[i - 1] : c[i] <= c[i - 1], tr.id + ' ' + lv + ' limits out of order');
    check(!!tr.levels[lv], tr.id + ' ranks for a level it does not have: ' + lv);
  });
  if (!tr.versusOnly) levelsOf(tr).forEach(lv => check(!!tr.ranks[lv], tr.id + ' level ' + lv + ' has no ranks'));
  if (!tr.checkOnly && !tr.versusOnly) ['e', 'n', 'h', 'a'].forEach(lv => check(!!tr.levels[lv], tr.id + ' misses level ' + lv));
});

// ---------------------------------------------------------------- every question maker
function run(id, fn) {
  const tr = T.byId[id];
  console.log(id);
  eachParams(tr, (p, lv) => { for (let s = 1; s <= RUNS; s++) fn(tr, p, lv, U.rng(s * 7919 + lv.length)); });
}

run('keisan', (tr, p, lv, r) => {
  const qs = tr.gen(p, r);
  check(qs.length === p.n, `keisan ${lv} count`);
  qs.forEach((q, i) => {
    const v = q.op === '＋' ? q.a + q.b : q.op === '−' ? q.a - q.b : q.a * q.b;
    check(v === q.ans, `keisan ${lv} wrong answer ${q.a}${q.op}${q.b}=${q.ans}`);
    if (p.adult) check(q.ans >= 1 && q.ans <= 99, `keisan ${lv} grown-up answer ${q.ans}`);
    else {
      check(q.ans >= 1 && q.ans <= 10 && q.ans <= p.max, `keisan ${lv} answer ${q.ans} out of range`);
      check(q.a >= 1 && q.b >= 1, `keisan ${lv} uses 0`);
      if (p.ops === '+') check(q.op === '＋', `keisan ${lv} subtraction at a plus-only level`);
    }
    if (i) check(!(qs[i - 1].a === q.a && qs[i - 1].b === q.b && qs[i - 1].op === q.op), `keisan ${lv} same sum twice in a row`);
  });
});

run('ookii', (tr, p, lv, r) => {
  const rounds = tr.gen(p, r);
  check(rounds.length === p.rounds, `ookii ${lv} count`);
  rounds.forEach(rd => {
    const ns = rd.balloons.map(b => b.n);
    check(new Set(ns).size === p.k && ns.length === p.k, `ookii ${lv} numbers not different`);
    check(ns.every(n => n >= 1 && n <= p.max), `ookii ${lv} number out of range`);
    check(rd.answer === Math.max(...ns), `ookii ${lv} answer`);
    rd.balloons.forEach((a, i) => rd.balloons.forEach((b, j) => {
      if (i < j) check(dist(a, b) >= (a.r + b.r) * 0.92, `ookii ${lv} balloons overlap (${Math.round(dist(a, b))} < ${a.r + b.r})`);
    }));
  });
});

run('junban', (tr, p, lv, r) => {
  const boards = tr.gen(p, r);
  check(boards.length === p.boards, `junban ${lv} boards`);
  boards.forEach(b => {
    check(b.length === p.n, `junban ${lv} pads`);
    check(new Set(b.map(q => q.label)).size === p.n, `junban ${lv} labels repeat`);
    b.forEach((a, i) => b.forEach((c, j) => { if (i < j) check(dist(a, c) >= 60, `junban ${lv} pads overlap (${Math.round(dist(a, c))})`); }));
    b.forEach(a => check(a.x >= 40 && a.x <= 320 && a.y >= 146 && a.y <= 556, `junban ${lv} pad outside the pond`));
    check(Math.hypot(b[0].x - 180, b[0].y - 604) > 0, 'junban start');
  });
  if (p.seq === 'alt') check(tr.labels(p).slice(0, 4).join('') === '1あ2い', 'junban alternating labels');
});

run('patto', (tr, p, lv, r) => {
  const rounds = tr.gen(p, r);
  check(rounds.length === p.rounds, `patto ${lv} count`);
  rounds.forEach(rd => {
    check(rd.cells.length === p.k && new Set(rd.cells).size === p.k, `patto ${lv} cells`);
    check(rd.cells.every(c => c >= 0 && c < 20), `patto ${lv} cell range`);
  });
});

run('nannin', (tr, p, lv, r) => {
  const qs = tr.gen(p, r);
  check(qs.length === p.q, `nannin ${lv} count`);
  qs.forEach(q => {
    check(q.events.length > 0, `nannin ${lv} no events`);
    let inside = [];
    const ev = q.events.slice().sort((a, b) => a.at - b.at);
    ev.forEach(e => {
      if (e.dir === 'in') inside.push(e.who);
      else { const k = inside.indexOf(e.who); check(k >= 0, `nannin ${lv} someone leaves who is not inside`); if (k >= 0) inside.splice(k, 1); }
      check(inside.length <= 9, `nannin ${lv} too many inside`);
    });
    check(inside.length === q.answer, `nannin ${lv} answer ${q.answer} but ${inside.length} inside`);
    if (!p.out) check(q.events.every(e => e.dir === 'in'), `nannin ${lv} someone leaves at a level without leaving`);
    check(q.answer <= 10, `nannin ${lv} answer above 10`);
  });
});

run('sakki', (tr, p, lv, r) => {
  const g = tr.gen(p, r, Data.PICS.map(x => x.id));
  check(g.qs.length === p.q, `sakki ${lv} count`);
  g.qs.forEach((q, j) => {
    check(q.choices.length === p.k && new Set(q.choices).size === p.k, `sakki ${lv} choices`);
    check(q.choices[q.right] === q.answer && q.choices.filter(c => c === q.answer).length === 1, `sakki ${lv} right answer`);
    check(q.answer === g.seq[j] && q.cur === g.seq[j + g.back], `sakki ${lv} sequence`);
    if (p.trick && q.cur !== q.answer) check(q.choices.includes(q.cur), `sakki ${lv} trick missing`);
    if (!p.trick && q.cur !== q.answer) check(!q.choices.includes(q.cur), `sakki ${lv} shows the current picture`);
    if (g.back) check(q.cur !== q.answer, `sakki ${lv} the same picture twice in a row`);
  });
});

run('janken', (tr, p, lv, r) => {
  const rs = tr.gen(p, r);
  check(rs.length === p.q, `janken ${lv} count`);
  rs.forEach((x, i) => {
    check(x.ans === tr.answerFor(x.hand, x.ask), `janken ${lv} answer`);
    if (p.seq === 'win') check(x.ask === 'win', `janken ${lv} not win`);
    if (p.seq === 'wl') check(x.ask === (i < Math.ceil(p.q / 2) ? 'win' : 'lose'), `janken ${lv} win-then-lose order`);
    if (i >= 2) check(!(rs[i - 1].hand === x.hand && rs[i - 2].hand === x.hand), `janken ${lv} the same hand 3 times`);
  });
});
{ // the rules of janken themselves
  const jt = T.byId.janken, beats = (a, b) => (a === 0 && b === 1) || (a === 1 && b === 2) || (a === 2 && b === 0);
  for (let h = 0; h < 3; h++) {
    check(beats(jt.answerFor(h, 'win'), h), 'janken: the win answer must beat the hand');
    check(beats(h, jt.answerFor(h, 'lose')), 'janken: the lose answer must lose to the hand');
    check(jt.answerFor(h, 'draw') === h, 'janken: draw');
  }
}

run('jump', (tr, p, lv, r) => {
  const sets = tr.gen(p, r);
  sets.forEach(s => {
    check(s.length === p.k && new Set(s).size === p.k, `jump ${lv} numbers`);
    check(s.every(n => n >= 1 && n <= p.max), `jump ${lv} range`);
  });
});

run('tori', (tr, p, lv, r) => {
  const qs = tr.gen(p, r);
  check(qs.length === p.q, `tori ${lv} count`);
  qs.forEach(q => {
    const birds = q.things.filter(t => t.bird).length;
    check(birds === q.answer, `tori ${lv} answer`);
    check(q.answer >= p.birds[0] && q.answer <= p.birds[1], `tori ${lv} bird count range`);
    check(q.things.length === q.answer + p.others, `tori ${lv} others`);
    q.things.forEach((a, i) => q.things.forEach((b, j) => { if (i < j) check(dist(a, b) >= 30, `tori ${lv} creatures on top of each other`); }));
    if (!p.adult) check(q.answer <= 10, `tori ${lv} answer above 10`);
  });
});

run('kotoba', (tr, p, lv, r) => {
  const qs = tr.gen(p, r);
  check(qs.length === p.q, `kotoba ${lv} count (${qs.length})`);
  check(new Set(qs.map(q => q.id)).size === qs.length, `kotoba ${lv} the same word twice`);
  qs.forEach(q => {
    check(q.word.length >= p.len[0] && q.word.length <= p.len[1], `kotoba ${lv} word length`);
    check(q.tiles.length === q.word.length + p.dummy, `kotoba ${lv} tiles`);
    const rest = q.tiles.slice();
    q.word.split('').forEach(ch => { const k = rest.indexOf(ch); check(k >= 0, `kotoba ${lv} letter missing`); if (k >= 0) rest.splice(k, 1); });
    rest.forEach(ch => check(!q.word.includes(ch), `kotoba ${lv} dummy letter in the word`));
    check(!/[ゃゅょっー]/.test(q.word), `kotoba ${lv} small letters in ${q.word}`);
  });
});
check(Data.PICS.every(x => /^[ぁ-ん]+$/.test(x.name)), 'picture names must be hiragana');
check(new Set(Data.PICS.map(x => x.id)).size === Data.PICS.length, 'picture ids repeat');

console.log('piano');
Data.SONGS.concat([Data.SCALE]).forEach(g => {
  const notes = T.byId.piano.parse(g.notes);
  check(notes.length >= 8, `song ${g.id} too short`);
  check(notes.every(n => Number.isInteger(n.k) && n.k >= 0 && n.k <= 7 && n.len > 0), `song ${g.id} bad note`);
  check(g.bpm > 40 && g.bpm < 200, `song ${g.id} tempo`);
});
check(Data.SONGS.filter(g => g.unlock === 0).length === 3, 'three songs from the start');

run('sudoku', (tr, p, lv, r) => {
  if (r() > 0.2) return;   // puzzles take a moment: check a fifth of the runs
  const qs = tr.gen(p, r);
  check(qs.length === p.q && qs.every(Boolean), `sudoku ${lv} made no puzzle`);
  qs.forEach(q => {
    if (!q) return;
    const n = q.size, bx = tr.boxOf(n);
    for (let i = 0; i < n * n; i++) {
      const v = q.sol[i], g = q.sol.slice(); g[i] = 0;
      check(v >= 1 && v <= n && tr.okAt(g, n, bx, i, v), `sudoku ${lv} solution breaks the rules`);
      if (q.grid[i]) check(q.grid[i] === v, `sudoku ${lv} given egg differs from the solution`);
    }
    const blanks = q.grid.filter(v => v === 0).length, want = p.blanks;
    check(Array.isArray(want) ? blanks >= want[0] && blanks <= want[1] : blanks === want, `sudoku ${lv} blanks ${blanks}`);
    check(tr.count(q.grid.slice(), n, bx, 2) === 1, `sudoku ${lv} more than one answer`);
  });
});

run('nanika', (tr, p, lv, r) => {
  const g = tr.gen(p, r, Data.PICS.map(x => x.id));
  check(g.targets.length === p.show && g.grid.length === p.total && new Set(g.grid).size === p.total, `nanika ${lv} sizes`);
  check(g.targets.every(t => g.grid.includes(t)), `nanika ${lv} targets missing`);
});

run('hako', (tr, p, lv, r) => {
  const piles = tr.gen(p, r);
  piles.forEach(pl => {
    check(pl.answer === pl.heights.reduce((a, b) => a + b, 0), `hako ${lv} answer`);
    check(pl.answer >= p.blocks[0] && pl.answer <= p.blocks[1], `hako ${lv} block count`);
    check(pl.heights.every(h => h >= 1 && h <= p.tall), `hako ${lv} heights`);
  });
});

// ---------------------------------------------------------------- save data and rules
console.log('save data');
{
  const f = C.sanitize(null);
  check(f.users.length === 1 && f.data[f.cur], 'fresh save');
  [undefined, 5, 'x', [], { v: 1 }, { v: 1, users: 'x' }, { v: 1, users: [{ id: 3 }], data: 9 }, { v: 1, users: [{ id: 'u1', name: 42 }], data: { u1: { days: 'x', rec: [1] } } }].forEach((s, i) => {
    let out = null;
    try { out = C.sanitize(s); } catch (e) { check(false, 'sanitize throws on case ' + i); }
    check(out && out.users.length >= 1 && out.data[out.cur], 'sanitize case ' + i);
  });
  const store = { v: null, getItem() { return this.v; }, setItem(k, v) { this.v = v; } };
  store.v = '{broken json';
  check(C.load(store).users.length === 1, 'broken json loads as fresh');

  const s = C.fresh(), cuts = T.byId.keisan.ranks.n;
  check(C.rankOf('time', cuts, 1) === 7 && C.rankOf('time', cuts, 999) === 1, 'time ranks');
  check(C.rankOf('count', [8, 7, 6, 5, 4, 2], 8) === 7 && C.rankOf('count', [8, 7, 6, 5, 4, 2], 0) === 1, 'count ranks');
  let prev = 8;
  for (let sc = 0; sc < 100; sc += 0.5) { const r = C.rankOf('time', cuts, sc); check(r <= prev, 'ranks go down as time grows'); prev = r; }
  const a = C.addRun(s, { id: 'keisan', level: 'n', kind: 'time', cuts, score: 40, text: 'x', today: '2026-10-01' });
  check(a.stampNew && a.firstPlay && a.stamps === 1, 'first run gives a stamp');
  check(a.opened.trainings.includes('nannin'), 'first stamp opens なんにん いるかな？');
  const b = C.addRun(s, { id: 'keisan', level: 'n', kind: 'time', cuts, score: 30, text: 'y', today: '2026-10-01' });
  check(!b.stampNew && b.newBest && !b.firstOfDay && b.runsToday === 2, 'second run the same day');
  check(C.udata(s).rec.keisan.n.hist.length === 1, 'graph keeps the first run of the day');
  C.addRun(s, { id: 'keisan', level: 'n', kind: 'time', cuts, score: 50, text: 'z', today: '2026-10-02' });
  check(C.udata(s).rec.keisan.n.best === 30 && C.udata(s).rec.keisan.n.hist.length === 2, 'best stays, graph grows');
  check(C.stampCount(C.udata(s)) === 2, 'two stamps');
  check(C.isOpen(s, 'ookii') && !C.isOpen(s, 'kotoba'), 'unlocks by stamps');
  const ck = C.addCheck(s, { ranks: [7, 7, 7], tests: ['keisan', 'patto', 'janken'], today: '2026-10-02' });
  check(ck.recorded && ck.rank === 7 && ck.age == null, 'check for a child');
  check(!C.addCheck(s, { ranks: [1, 1, 1], tests: ['keisan', 'patto', 'janken'], today: '2026-10-02' }).recorded, 'second check of a day is practice');
  check(C.brainAge(1) === 20 && C.brainAge(0) === 80, 'brain age range');
  const u = C.addUser(s, 'パパ', 'adult');
  check(u && s.users.length === 2, 'add user');
  s.cur = u.id;
  check(C.isAdult(s) && C.stampCount(C.udata(s)) === 0, 'users have their own data');
  check(C.addCheck(s, { ranks: [4, 4, 4], tests: ['a', 'b', 'c'], today: '2026-10-03' }).age === C.brainAge(0.5), 'grown-ups get a brain age');
  check(C.removeUser(s, u.id) && s.users.length === 1 && s.cur === 'u1', 'remove user');
  check(!C.removeUser(s, 'u1'), 'the last user stays');
  check(C.wallet(C.udata(s)) === C.starsEarned(C.udata(s)), 'wallet');
  const back = C.sanitize(JSON.parse(JSON.stringify(s)));
  check(JSON.stringify(back.data.u1.rec) === JSON.stringify(s.data.u1.rec), 'save survives a round trip');
  // 20 days in a row open everything
  const s2 = C.fresh();
  for (let d = 1; d <= 20; d++) C.addRun(s2, { id: 'keisan', level: 'e', kind: 'time', cuts, score: 50, text: '', today: '2026-11-' + String(d).padStart(2, '0') });
  check(Data.TRAININGS.every(t => C.isOpen(s2, t.id)) && Data.SONGS.every(g => C.songOpen(s2, g)) && !C.nextUnlock(s2), 'everything opens by 20 stamps');
  check(C.stampDays(C.udata(s2)).filter(x => x.big).length === 4, 'every 5th stamp is はなまる');
}

console.log(`\n${checks} checks, ${bad ? bad + ' NG' : 'all OK'}`);
process.exit(bad ? 1 : 0);
