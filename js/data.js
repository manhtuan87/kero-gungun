/* ケロちゃん あたま ぐんぐん — the game's data: ranks, trainings, pictures, songs and ケロはかせ's lines.
   Shared by the browser game and the Node.js tools. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Data = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Result ranks, 1 (slowest) ... 7 (best). They take the place of the original's vehicles.
  var ANIMALS = [
    { id: 'snail', name: 'かたつむり', fact: 'かたつむりは のんびりやさん。つぎは もっと はやく なるかな？' },
    { id: 'turtle', name: 'かめ', fact: 'かめさんは ゆっくり だけど がんばりやさん！' },
    { id: 'penguin', name: 'ペンギン', fact: 'ペンギンは よちよち あるくけど およぐのは はやいんだよ' },
    { id: 'kangaroo', name: 'カンガルー', fact: 'カンガルーは おおきな ジャンプで すすむよ！' },
    { id: 'horse', name: 'うま', fact: 'うまは ぱかぱか はやく はしるよ！' },
    { id: 'cheetah', name: 'チーター', fact: 'チーターは いちばん はやく はしる どうぶつ なんだよ！' },
    { id: 'falcon', name: 'はやぶさ', fact: 'はやぶさは せかいで いちばん はやい とり なんだよ！' }
  ];

  // The four groups of trainings on the list.
  var CATS = [
    { id: 'speed', name: 'はやさ', color: '#ffb347', c1: '#ffdcae', c2: '#fff4e4', theme: 5 },
    { id: 'memory', name: 'きおく', color: '#6cc6ff', c1: '#c2e8ff', c2: '#eff9ff', theme: 0 },
    { id: 'focus', name: 'がまん・しゅうちゅう', color: '#ff8fc0', c1: '#ffcde2', c2: '#fff1f7', theme: 1 },
    { id: 'play', name: 'もじ・おと・パズル', color: '#86d65c', c1: '#ccf1bb', c2: '#f1fbea', theme: 4 }
  ];

  // Trainings in list order. unlock = stamps needed before it opens.
  var TRAININGS = [
    { id: 'keisan', cat: 'speed', unlock: 0 },
    { id: 'ookii', cat: 'speed', unlock: 2 },
    { id: 'junban', cat: 'speed', unlock: 5 },
    { id: 'patto', cat: 'memory', unlock: 0 },
    { id: 'nannin', cat: 'memory', unlock: 1 },
    { id: 'sakki', cat: 'memory', unlock: 4 },
    { id: 'janken', cat: 'focus', unlock: 0 },
    { id: 'jump', cat: 'focus', unlock: 8 },
    { id: 'tori', cat: 'focus', unlock: 7 },
    { id: 'kotoba', cat: 'play', unlock: 3 },
    { id: 'piano', cat: 'play', unlock: 0 },
    { id: 'sudoku', cat: 'play', unlock: 6 }
  ];

  // The daily check: one test from each of the three powers, as in the original's brain age check.
  var CHECK = [
    { id: 'speed', name: 'はやさ', tests: ['keisan', 'ookii', 'junban'], good: 'はやさが とくい だね！' },
    { id: 'memory', name: 'きおく', tests: ['patto', 'nanika'], good: 'きおくが とくい だね！' },
    { id: 'restraint', name: 'がまん', tests: ['janken'], good: 'がまんが とくい だね！' }
  ];

  // The grown-ups' three levels (おとな) are near the original game's stages; only grown-up users see them.
  var LEVELS = [
    { id: 'e', name: 'かんたん', dots: 1 },
    { id: 'n', name: 'ふつう', dots: 2 },
    { id: 'h', name: 'むずかしい', dots: 3 },
    { id: 'ae', name: 'おとな かんたん', short: 'かんたん', dots: 1, adult: true },
    { id: 'a', name: 'おとな ふつう', short: 'ふつう', dots: 2, adult: true },
    { id: 'ah', name: 'おとな むずかしい', short: 'むずかしい', dots: 3, adult: true }
  ];

  // Pictures (drawn in pics.js). The names are the words of ことば つくり.
  var PICS = [
    { id: 'dog', name: 'いぬ' }, { id: 'cat', name: 'ねこ' }, { id: 'umbrella', name: 'かさ' }, { id: 'shoe', name: 'くつ' },
    { id: 'star', name: 'ほし' }, { id: 'flower', name: 'はな' }, { id: 'crab', name: 'かに' }, { id: 'peach', name: 'もも' },
    { id: 'apple', name: 'りんご' }, { id: 'strawberry', name: 'いちご' }, { id: 'egg', name: 'たまご' }, { id: 'chick', name: 'ひよこ' },
    { id: 'frog', name: 'かえる' }, { id: 'rabbit', name: 'うさぎ' }, { id: 'watermelon', name: 'すいか' }, { id: 'grapes', name: 'ぶどう' },
    { id: 'mandarin', name: 'みかん' }, { id: 'fish', name: 'さかな' }, { id: 'hat', name: 'ぼうし' }, { id: 'car', name: 'くるま' },
    { id: 'riceball', name: 'おにぎり' }, { id: 'balloon', name: 'ふうせん' }, { id: 'sunflower', name: 'ひまわり' }, { id: 'mitten', name: 'てぶくろ' },
    { id: 'pencil', name: 'えんぴつ' }, { id: 'snail', name: 'かたつむり' }, { id: 'cherry', name: 'さくらんぼ' }
  ];

  // Letters for the dummy tiles of ことば つくり (plain hiragana, no small letters).
  var KANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわ';

  /* Songs for the piano: public-domain melodies only, no lyrics shown.
     Notes are keys 0-7 (ど れ み ふぁ そ ら し ど); ":n" is the length in beats (default 1). */
  var SONGS = [
    { id: 'kira', name: 'きらきらぼし', unlock: 0, bpm: 100,
      notes: '0 0 4 4 5 5 4:2 3 3 2 2 1 1 0:2 4 4 3 3 2 2 1:2 4 4 3 3 2 2 1:2 0 0 4 4 5 5 4:2 3 3 2 2 1 1 0:2' },
    { id: 'kaeru', name: 'かえるのうた', unlock: 0, bpm: 108,
      notes: '0 1 2 3 2 1 0:2 2 3 4 5 4 3 2:2 0:2 0:2 0:2 0:2 0:.5 0:.5 1:.5 1:.5 2:.5 2:.5 3:.5 3:.5 2 1 0:2' },
    { id: 'mary', name: 'メリーさんの ひつじ', unlock: 0, bpm: 108,
      notes: '2 1 0 1 2 2 2:2 1 1 1:2 2 4 4:2 2 1 0 1 2 2 2 2 1 1 2 1 0:4' },
    { id: 'chou', name: 'ちょうちょう', unlock: 10, bpm: 108,
      notes: '4 2 2:2 3 1 1:2 0 1 2 3 4 4 4:2 4 2 2:2 3 1 1:2 0 2 4 4 2 2 2:2 1 1 1 1 1 2 3:2 2 2 2 2 2 3 4:2 4 2 2:2 3 1 1:2 0 2 4 4 0:3' },
    { id: 'joy', name: 'よろこびの うた', unlock: 12, bpm: 108,
      notes: '2 2 3 4 4 3 2 1 0 0 1 2 2:1.5 1:.5 1:2 2 2 3 4 4 3 2 1 0 0 1 2 1:1.5 0:.5 0:2' },
    { id: 'london', name: 'ロンドンばし', unlock: 14, bpm: 108,
      notes: '4:1.5 5:.5 4 3 2 3 4:2 1 2 3:2 2 3 4:2 4:1.5 5:.5 4 3 2 3 4:2 1:2 4:2 2 0:2' },
    { id: 'jingle', name: 'ジングルベル', unlock: 16, bpm: 120,
      notes: '2 2 2:2 2 2 2:2 2 4 0:1.5 1:.5 2:4 3 3 3:1.5 3:.5 3 2 2 2:.5 2:.5 2 1 1 2 1:2 4:2' },
    { id: 'farm', name: 'ゆかいな まきば', unlock: 18, bpm: 112,
      notes: '4 4 4 1 2 2 1:2 6 6 5 5 4:3 1 4 4 4 1 2 2 1:2 6 6 5 5 4:3' },
    { id: 'boat', name: 'こげ こげ ボート', unlock: 20, bpm: 96,
      notes: '0 0 0:.75 1:.25 2 2:.75 1:.25 2:.75 3:.25 4:2 7:.34 7:.33 7:.33 4:.34 4:.33 4:.33 2:.34 2:.33 2:.33 0:.34 0:.33 0:.33 4:.75 3:.25 2:.75 1:.25 0:2' }
  ];
  // The piano's practice piece: up and down the keys.
  var SCALE = { id: 'scale', name: 'ドレミの かいだん', unlock: 0, bpm: 100, notes: '0 1 2 3 4 5 6 7:2' };
  var KEYS = ['ど', 'れ', 'み', 'ふぁ', 'そ', 'ら', 'し', 'ど'];

  // ケロはかせ's lines.
  var LINES = {
    morning: 'おはよう！', day: 'こんにちは！', night: 'こんばんは！',
    title: ['きょうも あたまの たいそう しよう！', 'まいにち すこしずつ やると あたまが ぐんぐん そだつよ', 'どの トレーニングに する？'],
    first: 'はじめまして！ ケロはかせ だよ。まいにち いっしょに あたまの たいそう しようね！',
    checkFirst: 'まずは きょうの チェックから やってみる？',
    checkDone: 'きょうの チェックは できたね！ トレーニングも やってみよう',
    enough: 'きょうは たくさん がんばったね！ つづきは また あした！',
    newTraining: 'あたらしい トレーニングが ふえたよ！',
    newSong: 'ピアノの あたらしい きょくが ふえたよ！',
    best: ['すごい！ いままでで いちばんだよ！', 'じこベスト！ やったね！'],
    first1: ['はじめての きろく だね！', 'よく できました！'],
    good: ['よく できました！', 'いい ちょうし！', 'がんばったね！', 'すばらしい！'],
    soso: ['だいじょうぶ！ ゆっくりで いいよ', 'つぎは もっと できるよ！', 'まいにち やると ぐんぐん のびるよ'],
    practice: 'はじめてだから れんしゅう しよう！',
    practiceDone: 'じょうず！ つぎは ほんばん だよ！',
    pause: 'ちょっと おやすみ'
  };

  return {
    ANIMALS: ANIMALS, CATS: CATS, TRAININGS: TRAININGS, CHECK: CHECK, LEVELS: LEVELS,
    PICS: PICS, KANA: KANA, SONGS: SONGS, SCALE: SCALE, KEYS: KEYS, LINES: LINES
  };
}));
