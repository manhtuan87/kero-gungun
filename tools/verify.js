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
// (practice, practiceO and practiceAO are the practice runs of the levels, not levels of their own)
function levelsOf(tr) { return Object.keys(tr.levels).filter(l => !/^practice/.test(l)); }
const ONI = ['o', 'ao'];
function params(tr, lv, practice) {
  const p = Object.assign({}, tr.levels[lv]), oni = ONI.includes(lv);
  const pr = oni ? (lv === 'ao' && tr.levels.practiceAO) || tr.levels.practiceO : tr.levels.practice;
  if (practice) Object.assign(p, pr || tr.levels.practice || {}, { practice: true });
  p.adult = ['ae', 'a', 'ah', 'ao', 'testA'].indexOf(lv) >= 0;
  p.oni = oni;
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
  if (!tr.checkOnly && !tr.versusOnly) ['e', 'n', 'h', 'o', 'ae', 'a', 'ah', 'ao', 'practiceO'].forEach(lv => check(!!tr.levels[lv], tr.id + ' misses level ' + lv));
  if (!tr.checkOnly && !tr.versusOnly) check(typeof tr.oniHelp === 'string' && tr.oniHelp.length > 10, tr.id + ' needs the explanation of its おに');
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
    const f = (x, op, y) => op === '＋' ? x + y : op === '−' ? x - y : op === '×' ? x * y : x / y;
    const m = f(q.a, q.op, q.b), v = q.c != null ? f(m, q.op2, q.c) : m;
    check(v === q.ans, `keisan ${lv} wrong answer ${q.a}${q.op}${q.b}${q.c != null ? q.op2 + q.c : ''}=${q.ans}`);
    check(!p.oni || (p.adult ? p.hard : p.three), `keisan ${lv}: おに has its own sums`);
    if (p.three) {   // (おに, children: three numbers, every step from 0 to 10)
      check(q.c != null && m >= 0 && m <= 10 && q.ans >= 0 && q.ans <= 10 && [q.a, q.b, q.c].every(x => x >= 1 && x <= 9), `keisan ${lv} three numbers ${q.a}${q.op}${q.b}${q.op2}${q.c}`);
    } else if (p.hard) {   // (おに, grown-ups: carries, borrows, two-digit times one-digit, even divisions)
      check(Number.isInteger(q.ans) && q.ans >= 1 && q.ans <= 999, `keisan ${lv} hard answer ${q.ans}`);
      if (q.op === '＋') check(q.a % 10 + q.b % 10 >= 10 && q.a >= 10 && q.b >= 10, `keisan ${lv} a sum without a carry`);
      if (q.op === '−') check(q.a % 10 < q.b % 10 && q.b >= 10, `keisan ${lv} a take-away without a borrow`);
      if (q.op === '×') check(q.a >= 10 && q.b >= 2 && q.b <= 9, `keisan ${lv} times`);
      if (q.op === '÷') check(q.a % q.b === 0 && q.b >= 2, `keisan ${lv} division`);
    } else if (p.adult) check(q.ans >= 1 && q.ans <= 99, `keisan ${lv} grown-up answer ${q.ans}`);
    else {
      check(q.ans >= 1 && q.ans <= 10 && q.ans <= p.max, `keisan ${lv} answer ${q.ans} out of range`);
      check(q.a >= 1 && q.b >= 1, `keisan ${lv} uses 0`);
      if (p.ops === '+') check(q.op === '＋', `keisan ${lv} subtraction at a plus-only level`);
    }
    if (i) check(!(qs[i - 1].a === q.a && qs[i - 1].b === q.b && qs[i - 1].op === q.op && qs[i - 1].c === q.c && qs[i - 1].op2 === q.op2), `keisan ${lv} same sum twice in a row`);
  });
});

run('ookii', (tr, p, lv, r) => {
  const rounds = tr.gen(p, r);
  check(rounds.length === p.rounds, `ookii ${lv} count`);
  rounds.forEach(rd => {
    const ns = rd.balloons.map(b => b.n);
    check(new Set(ns).size === p.k && ns.length === p.k, `ookii ${lv} numbers not different`);
    check(ns.every(n => n >= 1 && n <= p.max), `ookii ${lv} number out of range`);
    check(rd.answer === (rd.small ? Math.min(...ns) : Math.max(...ns)), `ookii ${lv} answer`);
    check(!rd.small || p.flip, `ookii ${lv} the smallest is asked below おに`);
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
    // (pads are 29 px round; a drifting board has a little less room, so its pads may come to 59.8 px)
    b.forEach((a, i) => b.forEach((c, j) => { if (i < j) check(dist(a, c) >= (p.drift ? 59.5 : 60), `junban ${lv} pads overlap (${Math.round(dist(a, c))})`); }));
    b.forEach(a => check(a.x >= 40 + (p.drift || 0) && a.x <= 320 - (p.drift || 0) && a.y >= 146 + (p.drift || 0) && a.y <= 556 - (p.drift || 0), `junban ${lv} pad (with its drift) outside the pond`));
    check(!p.oni || p.drift > 0, `junban ${lv}: おに drifts`);
    check(Math.hypot(b[0].x - 180, b[0].y - 604) > 0, 'junban start');
  });
  if (p.seq === 'alt') check(tr.labels(p).slice(0, 4).join('') === '1あ2い', 'junban alternating labels');
});

run('patto', (tr, p, lv, r) => {
  const rounds = tr.gen(p, r);
  check(rounds.length === p.rounds, `patto ${lv} count`);
  rounds.forEach(rd => {
    const m = p.grow ? Math.min(20, p.k + p.rounds - 1) : p.k;   // (grown-ups: enough eggs for the most a round can have)
    check(rd.cells.length === m && new Set(rd.cells).size === m, `patto ${lv} cells`);
    check(rd.cells.every(c => c >= 0 && c < 20), `patto ${lv} cell range`);
    if (p.nums) check(rd.nums.length === m && new Set(rd.nums).size === m && rd.nums.every(v => v >= 1 && v <= p.nums), `patto ${lv} numbers`);
    if (p.swaps) check(new Set(rd.colors).size === 1, `patto ${lv}: eggs that change places must all have one colour`);
    check(!p.oni || p.swaps > 0, `patto ${lv}: おに changes places`);
  });
});

run('nannin', (tr, p, lv, r) => {
  const qs = tr.gen(p, r);
  check(qs.length === p.q, `nannin ${lv} count`);
  qs.forEach(q => {
    check(q.events.length > 0, `nannin ${lv} no events`);
    const two = p.houses === 2, inside = two ? [[], []] : [[]];
    const ev = q.events.slice().sort((a, b) => a.at - b.at);
    ev.forEach(e => {
      const ins = inside[e.house || 0];
      check(two ? e.house === 0 || e.house === 1 : !e.house, `nannin ${lv} a house that is not there`);
      if (two) check(e.side === (e.house ? 1 : -1), `nannin ${lv} a friend of one house comes from the other side`);
      if (e.dir === 'in') ins.push(e.who);
      else { const k = ins.indexOf(e.who); check(k >= 0, `nannin ${lv} someone leaves who is not inside`); if (k >= 0) ins.splice(k, 1); }
      check(ins.length <= (two ? 6 : 9), `nannin ${lv} too many inside`);
    });
    check(inside[q.ask || 0].length === q.answer, `nannin ${lv} answer ${q.answer} but ${inside[q.ask || 0].length} inside`);
    check(!p.oni || two, `nannin ${lv}: おに has two houses`);
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
    if (p.trick2 && g.back === 3) check(q.choices.includes(g.seq[j + 1]) || g.seq[j + 1] === q.cur, `sakki ${lv} the picture in between is not a choice`);
  });
});

check(T.byId.sakki.levels.o.mode === 'prev2' && T.byId.sakki.levels.ao.mode === 'prev3', 'sakki: おに is two before (children) and three before (grown-ups)');
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
    check(q.things.length === q.answer + (q.flies || 0) + p.others, `tori ${lv} others`);
    if (p.flies) {   // (おに: the butterflies are counted too; then the others are ladybugs and bees only)
      check(q.things.filter(t => t.kind === 'butterfly').length === q.flies && q.flies >= p.flies[0] && q.flies <= p.flies[1], `tori ${lv} butterflies`);
      check(q.things.filter(t => !t.bird && !t.fly).every(t => t.kind === 'ladybug' || t.kind === 'bee'), `tori ${lv} a butterfly among the ones not counted`);
      if (!p.adult) check(q.flies <= 10, `tori ${lv} butterflies above 10`);
    } else check(q.flies == null, `tori ${lv} butterflies counted below おに`);
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

// ことば つくり and じゅんばん in the other languages (the words and letters of js/lang-text.js, put into
// the data the way app.js does it)
{
  const fs = require('fs'), path = require('path');
  global.window = { addEventListener() {} };
  global.localStorage = { getItem: () => 'ja' };
  const src = ['lang.js', 'lang-text.js'].map(f => fs.readFileSync(path.join(__dirname, '../js', f), 'utf8')).join('\n');
  const LANGS = new Function(src + '\nreturn GUNGUN_LANG;')();
  const keep = { names: Data.PICS.map(x => x.name), kana: Data.KANA, len: {} };
  const kl = T.byId.kotoba.levels;
  Object.keys(kl).forEach(lv => { keep.len[lv] = kl[lv].len; });
  Object.keys(LANGS).forEach(lang => {
    const K = LANGS[lang];
    check(K.keys.length === 8 && K.week.length === 7 && K.seq.length >= 10, `${lang}: keys, week and seq`);
    Object.keys(K.words).forEach(id => check(Data.PICS.some(x => x.id === id), `${lang}: no picture ${id}`));
    Data.PICS.forEach(x => { x.name = (K.words[x.id] || '').normalize('NFC'); });
    Data.KANA = K.letters.normalize('NFC');
    Object.keys(K.len).forEach(lv => { kl[lv].len = K.len[lv]; });
    check(Object.values(K.words).every(w => w === w.normalize('NFC') && !/\s/.test(w)), `${lang}: words must be NFC without spaces`);
    run('kotoba', (tr, p, lv, r) => {
      const qs = tr.gen(p, r);
      check(qs.length === p.q, `${lang} kotoba ${lv} count (${qs.length})`);
      qs.forEach(q => {
        check(q.word.length >= p.len[0] && q.word.length <= p.len[1] && q.word.length <= 7, `${lang} kotoba ${lv} word length`);
        check(q.tiles.length === q.word.length + p.dummy && q.tiles.length <= (p.oni ? 12 : 10), `${lang} kotoba ${lv} tiles`);   // (おに: up to 3 rows of 5)
        const rest = q.tiles.slice();
        q.word.split('').forEach(ch => { const k = rest.indexOf(ch); check(k >= 0, `${lang} kotoba ${lv} letter missing`); if (k >= 0) rest.splice(k, 1); });
        rest.forEach(ch => check(!q.word.includes(ch), `${lang} kotoba ${lv} dummy letter in the word`));
      });
    });
  });
  Data.PICS.forEach((x, i) => { x.name = keep.names[i]; });
  Data.KANA = keep.kana;
  Object.keys(keep.len).forEach(lv => { kl[lv].len = keep.len[lv]; });
}

console.log('piano');
Data.SONGS.concat([Data.SCALE]).forEach(g => {
  const notes = T.byId.piano.parse(g.notes);
  check(notes.length >= 8, `song ${g.id} too short`);
  check(notes.every(n => Number.isInteger(n.k) && n.k >= 0 && n.k <= 7 && n.len > 0), `song ${g.id} bad note`);
  check(g.bpm > 40 && g.bpm < 200, `song ${g.id} tempo`);
});
check(Data.SONGS.filter(g => g.unlock === 0).length === 3, 'three songs from the start');

run('sudoku', (tr, p, lv, r) => {
  if (r() > (p.size === 9 ? 0.05 : 0.2)) return;   // puzzles take a moment: check a fifth of the runs (9 x 9: fewer)
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
  // ★: what the animal gives, but ★3 only with no mistakes and ★1 at half or less right
  check(C.starsOf(7) === 3 && C.starsOf(5) === 2 && C.starsOf(2) === 1, '★ from the animal');
  check(C.starsOf(7, 1) === 3 && C.starsOf(7, 7 / 8) === 2 && C.starsOf(7, 0.51) === 2 && C.starsOf(7, 3 / 6) === 1 && C.starsOf(7, 0) === 1, '★ from how much was right');
  check(C.starsOf(4, 1) === 2 && C.starsOf(2, 1) === 1, 'no more ★ than the animal gives');
  check(T.U.acc(0, 10) === 1 && T.U.acc(5, 10) === 0.5 && T.U.acc(30, 10) === 0 && T.U.acc(0, 0) === 1, 'acc: a share less for each mistake');
  {
    const s3 = C.fresh(), c3 = T.byId.keisan.ranks.n;
    const w1 = C.addRun(s3, { id: 'keisan', level: 'n', kind: 'time', cuts: c3, score: 1, acc: 0.9, text: '', today: '2026-10-01' });
    check(w1.rank >= 6 && w1.stars === 2 && C.udata(s3).rec.keisan.n.stars === 2, 'a good run with a mistake gets ★2');
    check(C.addRun(s3, { id: 'keisan', level: 'n', kind: 'time', cuts: c3, score: 1, acc: 1, text: '', today: '2026-10-01' }).stars === 3 && C.udata(s3).rec.keisan.n.stars === 3, 'a run with no mistakes gets ★3');
    check(C.addRun(s3, { id: 'keisan', level: 'n', kind: 'time', cuts: c3, score: 1, acc: 0.5, text: '', today: '2026-10-01' }).stars === 1 && C.udata(s3).rec.keisan.n.stars === 3, 'half right gets ★1 (the best ★ stays)');
  }
  // every training that keeps records says how much of a run was right
  T.list.filter(tr => !tr.checkOnly && !tr.versusOnly).forEach(tr => {
    const code = require('fs').readFileSync(require('path').join(__dirname, '../js/tr/' + tr.id + '.js'), 'utf8'), calls = code.split('api.finish(').slice(1);
    check(calls.length > 0 && calls.every(x => /^\{[^}]*\bacc: /.test(x)), tr.id + ' finishes without acc');
  });
  check(C.wallet(C.udata(s)) === C.starsEarned(C.udata(s)), 'wallet');
  const back = C.sanitize(JSON.parse(JSON.stringify(s)));
  check(JSON.stringify(back.data.u1.rec) === JSON.stringify(s.data.u1.rec), 'save survives a round trip');
  // 20 days in a row open everything
  const s2 = C.fresh();
  for (let d = 1; d <= 20; d++) C.addRun(s2, { id: 'keisan', level: 'e', kind: 'time', cuts, score: 50, text: '', today: '2026-11-' + String(d).padStart(2, '0') });
  check(Data.TRAININGS.every(t => C.isOpen(s2, t.id)) && Data.SONGS.every(g => C.songOpen(s2, g)) && !C.nextUnlock(s2), 'everything opens by 20 stamps');
  check(C.stampDays(C.udata(s2)).filter(x => x.big).length === 4, 'every 5th stamp is はなまる');
  check(Data.TRAININGS.every(t => C.oniOpen(s2, t.id, 'o') && C.oniOpen(s2, t.id, 'ao')), '20 stamps open every おに');
}
{ // おに: ★3 at むずかしい (grown-ups: おとな むずかしい) opens it for that training; 20 stamps or the admin switch open all
  const s4 = C.fresh(), hc = T.byId.patto.ranks.h;
  check(!C.oniOpen(s4, 'patto', 'o') && C.oniOpen(s4, 'patto', 'h'), 'おに is closed at first');
  const w2 = C.addRun(s4, { id: 'patto', level: 'h', kind: 'count', cuts: hc, score: 8, acc: 7 / 8, text: '', today: '2026-10-01' });
  check(w2.stars === 2 && !C.oniOpen(s4, 'patto', 'o') && !w2.opened.oni.length, '★2 at むずかしい does not open おに');
  const w3 = C.addRun(s4, { id: 'patto', level: 'h', kind: 'count', cuts: hc, score: 8, acc: 1, text: '', today: '2026-10-01' });
  check(w3.stars === 3 && w3.opened.oni.length === 1 && w3.opened.oni[0].id === 'patto' && w3.opened.oni[0].lv === 'o' && C.oniOpen(s4, 'patto', 'o'), '★3 at むずかしい opens おに');
  check(!C.oniOpen(s4, 'patto', 'ao') && !C.oniOpen(s4, 'keisan', 'o'), 'only おに of that training (おとな おに waits for おとな むずかしい)');
  const w4 = C.addRun(s4, { id: 'patto', level: 'ah', kind: 'count', cuts: T.byId.patto.ranks.ah, score: 80, acc: 1, text: '', today: '2026-10-01' });
  check(w4.opened.oni.length === 1 && w4.opened.oni[0].lv === 'ao', '★3 at おとな むずかしい opens おとな おに');
  C.addRun(s4, { id: 'patto', level: 'o', kind: 'count', cuts: T.byId.patto.ranks.o, score: 5, acc: 5 / 8, text: '', today: '2026-10-01' });
  check(C.sanitize(JSON.parse(JSON.stringify(s4))).data.u1.rec.patto.o.best === 5, 'the records of おに survive a save');
  const s5 = C.fresh(); s5.all = true;
  check(Data.TRAININGS.every(t => C.oniOpen(s5, t.id, 'o') && C.oniOpen(s5, t.id, 'ao')), 'the admin switch opens every おに');
  const ck = C.addCheck(C.fresh(), { ranks: [4, 4, 4], tests: ['keisan', 'patto', 'janken'], today: '2026-10-01' });
  check(Array.isArray(ck.opened.oni), 'the check tells which おに opened too');
}

console.log(`\n${checks} checks, ${bad ? bad + ' NG' : 'all OK'}`);
process.exit(bad ? 1 : 0);
