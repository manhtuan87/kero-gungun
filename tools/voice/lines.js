// Every fixed line ケロはかせ says, as { text, read }: `text` is exactly what the game passes to Voice.say
// (the key of the clip), `read` is what the voice engine reads (kanji give a more natural accent than
// plain hiragana). Names are not here: the game reads them with the phone's own voice.
'use strict';
global.Trainings = require('../../js/trainings.js');
global.Data = require('../../js/data.js');
const Data = global.Data;
['keisan', 'ookii', 'junban', 'patto', 'nannin', 'sakki', 'janken', 'jump', 'tori', 'kotoba', 'piano', 'sudoku', 'nanika', 'hako']
  .forEach(id => require('../../js/tr/' + id + '.js'));
const T = global.Trainings, L = Data.LINES;

// the same as Voice.norm in js/voice.js
function norm(text) { return String(text).replace(/[★☆●○×♪〜～]/g, ' ').replace(/[\s　]+/g, ' ').trim(); }

const out = [], seen = {};
function add(text, read) {
  const key = norm(text);
  if (!key || seen[key]) return;
  seen[key] = true;
  out.push({ text: key, read: read || key.replace(/ /g, '') });
}

// ---------------------------------------------------------------- names read more naturally in kanji
const TRAINING_READ = {
  keisan: '計算', ookii: '一番大きいかず', junban: '順番ぴょんぴょん', patto: 'ぱっと覚えて', nannin: '何人いるかな？',
  sakki: 'さっきの絵', janken: '後出しじゃんけん', jump: 'ジャンプでタッチ', tori: 'とりかぞえ', kotoba: '言葉づくり',
  piano: 'ピアノ', sudoku: '絵合わせ数独', nanika: '何があった？', hako: 'はこかぞえ'
};
const HELP_READ = {
  keisan: '式を見て、答えの数字をタッチしてね！',
  ookii: '風船の中で、一番大きいかずをタッチ！ 風船の大きさに、だまされないでね。',
  junban: '葉っぱの数字を、1から順番にタッチすると、ぴょんぴょん跳んでいくよ！',
  patto: '卵の数字を、ぱっと覚えて、1から順番にタッチしてね！',
  nannin: 'おうちに、はいったり、出たり。最後に、おうちの中に何人いるか、答えてね！',
  sakki: '絵が1枚ずつ出てくるよ。一つ前に出た絵を、下から選んでね！',
  janken: 'ケロはかせの手を見て、「勝って」なら勝つ手、「負けて」なら負ける手を、早く出してね！',
  jump: '石が来たらジャンプ！ 同じ時に、下の大きいかずをタッチしてね。二つ一緒にできるかな？',
  tori: '森の中にいる、小鳥だけを数えてね！ 蝶々や虫は、数えないよ。',
  kotoba: '絵を見て、名前の文字を、順番にタッチしてね！',
  piano: '上の音符と同じ鍵盤を、順番に押してね！ 最後に、曲を全部聴けるよ。',
  sudoku: '縦、横、部屋に、同じ卵が一つずつ入るように、あいてるマスを埋めてね！',
  nanika: '絵をよく覚えてね！ そのあと、たくさんの絵の中から、見た絵を選ぶよ。',
  hako: '積み木が、少しだけ見えるよ。いくつあったかな？'
};
// おに: the twist of each training, said when おに is chosen (A: the grown-ups' one, where it differs)
const ONI_HELP_READ = {
  keisan: '三つの数の、式だよ。前から順番に、計算してね！',
  ookii: '「一番大きい」か、「一番小さい」か、毎回変わるよ。よく聞いてね！',
  junban: '葉っぱが、ゆっくり動くよ。順番にタッチしてね！',
  patto: '卵が裏返った後、入れ替わるよ。目で追いかけてね！',
  nannin: 'おうちが、二つあるよ。最後に、どっちのおうちか聞くよ！',
  sakki: '二つ前の絵を、選んでね！ 間の絵に、だまされないでね。',
  janken: 'ケロはかせの手は、すぐ隠れるよ。覚えて出してね！ ボタンの場所も変わるよ。',
  jump: '鳥も飛んでくるよ。鳥の時は、ジャンプしないでね！',
  tori: '小鳥と蝶々を、どっちも数えてね！ 虫は数えないよ。',
  kotoba: '文字をタッチするたびに、文字の場所が変わるよ！',
  piano: '楽譜は、少し見たら消えるよ。覚えて弾いてね！',
  sudoku: '六かける六の、大きい数独だよ！ 卵は六種類。部屋は横長だよ。'
};
const ONI_HELP_A_READ = {
  keisan: '二桁の掛け算や、割り算も出るよ。できるだけ速く、答えてね！',
  sakki: '三つ前の絵を、選んでね！ 間の絵に、だまされないでね。',
  sudoku: '一番難しい数独だよ！ あいてるマスが、とても多いよ。'
};
const ANIMAL_READ = { かたつむり: 'かたつむり', かめ: '亀', ペンギン: 'ペンギン', カンガルー: 'カンガルー', うま: '馬', チーター: 'チーター', はやぶさ: 'はやぶさ' };
const WORD_READ = {
  いぬ: '犬', ねこ: '猫', かさ: '傘', くつ: '靴', ほし: '星', はな: '花', かに: '蟹', もも: '桃',
  りんご: 'りんご', いちご: '苺', たまご: '卵', ひよこ: 'ひよこ', かえる: 'カエル', うさぎ: 'うさぎ', すいか: 'スイカ',
  ぶどう: 'ぶどう', みかん: 'みかん', さかな: 'さかな', ぼうし: '帽子', くるま: '車', おにぎり: 'おにぎり', ふうせん: '風船',
  ひまわり: 'ひまわり', てぶくろ: '手袋', えんぴつ: '鉛筆', かたつむり: 'かたつむり', さくらんぼ: 'さくらんぼ',
  くま: '熊', うし: '牛', かめ: '亀', さる: '猿', ぞう: '象', つき: '月', くも: '雲', いえ: 'いえ',
  ふね: '船', たこ: 'タコ', ぱん: 'パン', こま: 'コマ', にじ: '虹', きのこ: 'キノコ', めがね: 'メガネ', ばなな: 'バナナ',
  れもん: 'レモン', とまと: 'トマト', ねずみ: 'ネズミ', ぱんだ: 'パンダ', きりん: 'キリン', たいこ: '太鼓', えほん: '絵本', はさみ: 'ハサミ',
  おばけ: 'おばけ', ひこうき: '飛行機', らいおん: 'ライオン', ぺんぎん: 'ペンギン', ふくろう: 'フクロウ', どんぐり: 'どんぐり', にんじん: 'にんじん', おうかん: '王冠',
  ゆきだるま: '雪だるま', かぶとむし: 'カブトムシ', とうもろこし: 'トウモロコシ', てんとうむし: 'てんとう虫'
};
const SONG_READ = {
  kira: 'きらきら星', kaeru: 'かえるの歌', mary: 'メリーさんの羊', chou: 'ちょうちょう', joy: '喜びの歌',
  london: 'ロンドン橋', jingle: 'ジングルベル', farm: '愉快な牧場', boat: 'こげこげボート',
  chime: '学校のチャイム', hotcross: 'ホットクロスバンズ', saints: '聖者の行進', susanna: 'おお、スザンナ', ieji: '家路', lullaby: '子守唄'
};

// ---------------------------------------------------------------- the title and results (app.js)
add(L.morning); add(L.day); add(L.night);
add(L.title[0], '今日も、頭の体操しよう！');
add(L.title[1], '毎日少しずつやると、頭がぐんぐん育つよ。');
add(L.title[2], 'どのトレーニングにする？');
add(L.first, 'はじめまして！ ケロはかせだよ。毎日一緒に、頭の体操しようね！');
add(L.checkFirst, 'まずは、今日のチェックから、やってみる？');
add(L.enough, '今日はたくさん頑張ったね！ 続きは、また明日！');
add(L.newTraining, '新しいトレーニングが、増えたよ！');
add(L.newOni, '「鬼」で、遊べるようになったよ！ 挑戦してみてね。');
add(L.oniGood[0], '鬼を、乗り越えたね！ すごい！');
add(L.oniGood[1], '鬼も、へっちゃらだね！');
add(L.newSong, 'ピアノの新しい曲が、増えたよ！');
add(L.practiceDone, '上手！ 今度は、本当にやってみよう！');
const COMMON = {
  'すごい！ いままでで いちばんだよ！': 'すごい！ 今までで一番だよ！',
  'じこベスト！ やったね！': '自己ベスト！ やったね！',
  'はじめての きろく だね！': '初めての記録だね！',
  'よく できました！': 'よくできました！',
  'いい ちょうし！': 'いい調子！',
  'がんばったね！': '頑張ったね！',
  'すばらしい！': '素晴らしい！',
  'だいじょうぶ！ ゆっくりで いいよ': '大丈夫！ ゆっくりでいいよ。',
  'つぎは もっと できるよ！': '次はもっとできるよ！',
  'まいにち やると ぐんぐん のびるよ': '毎日やると、ぐんぐん伸びるよ。'
};
[].concat(L.best, L.first1, L.good, L.soso).forEach(t => add(t, COMMON[norm(t)]));
Data.ANIMALS.forEach(a => add(a.name + '！', ANIMAL_READ[a.name] + '！'));
add('スタンプを あつめると あそべるよ', 'スタンプを集めると、遊べるよ。');
add('ケロはかせが しゃべるよ！', 'ケロはかせが、しゃべるよ！');
add('スタンプ ゲット！', 'スタンプ、ゲット！');
add('はなまる スタンプ！', 'はなまるスタンプ！');
['ミミちゃん', 'ニャーちゃん', 'ワンちゃん'].forEach(n => add(n + 'が なかまに なったよ！', n + 'が、仲間になったよ！'));
// training names (new training cards) and song names (new songs)
const SOLO = T.list.filter(tr => tr.start);   // (はこ かぞえ is only played by two)
SOLO.forEach(tr => add(tr.name, TRAINING_READ[tr.id]));
Data.SONGS.forEach(g => add(g.name, SONG_READ[g.id]));
// explanations of the trainings
SOLO.forEach(tr => add(tr.help, HELP_READ[tr.id]));
T.list.forEach(tr => { if (tr.oniHelp) add(tr.oniHelp, ONI_HELP_READ[tr.id]); if (tr.oniHelpA) add(tr.oniHelpA, ONI_HELP_A_READ[tr.id]); });

// ---------------------------------------------------------------- the daily check
add('きょうの あたまチェック！ 3つの テストを するよ', '今日の、頭チェック！ 三つのテストをするよ。');
add('きょうは もう チェック したよ。 れんしゅうで やってみよう', '今日はもう、チェックしたよ。練習で、やってみよう。');
Data.CHECK.forEach(c => c.tests.forEach(id => add('よく できました！ つぎは ' + T.byId[id].name, 'よくできました！ 次は、' + TRAINING_READ[id])));
Data.ANIMALS.forEach(a => add('きょうの あたまは ' + a.name + '！', '今日の頭は、' + ANIMAL_READ[a.name] + '！'));
for (let age = 20; age <= 80; age++) add('のうねんれいは ' + age + 'さい！', '脳年齢は、' + age + '歳！');
add(Data.CHECK[0].good, '速さが、得意だね！');
add(Data.CHECK[1].good, '記憶が、得意だね！');
add(Data.CHECK[2].good, '我慢が、得意だね！');
add('ぜんぶ すごいね！', '全部すごいね！');

// ---------------------------------------------------------------- inside the trainings
add('かって！', '勝って！'); add('まけて！', '負けて！'); add('あいこ！', 'あいこ！');
add('かって', '勝って'); add('まけて', '負けて'); add('あいこ', 'あいこ');
add('こんどは かって！', '今度は、勝って！'); add('こんどは まけて！', '今度は、負けて！'); add('こんどは あいこ！', '今度は、あいこ！');
add('おうちの なかに なんにん いるかな？', 'おうちの中に、何人いるかな？');
for (let n = 0; n <= 14; n++) add('こたえは ' + n + 'にん だよ', '答えは、' + (n === 0 ? 'ゼロ人' : n + '人') + 'だよ');
add('ことりは なんわ？', '小鳥は、何羽？');
add('この えを おぼえてね', 'この絵を、覚えてね');
add('ひとつ まえの え は どれ？', '一つ前の絵は、どれ？');
add('ふたつ まえの え は どれ？', '二つ前の絵は、どれ？');
// (おに)
add('みっつ まえの え は どれ？', '三つ前の絵は、どれ？');
add('いちばん おおきい かず！', '一番大きい数！');
add('いちばん ちいさい かず！', '一番小さい数！');
add('ひだりの おうちには なんにん？', '左のおうちには、何人？');
add('みぎの おうちには なんにん？', '右のおうちには、何人？');
add('ちょうちょは なんびき？', '蝶々は、何匹？');
Data.PICS.forEach(p => add(p.name + '！', (WORD_READ[p.name] || p.name) + '！'));
add('じょうず！', '上手！');
add('えを よく おぼえてね', '絵を、よく覚えてね');
[3, 6, 10].forEach(n => add('さっき みた えを ' + n + 'まい えらんでね', 'さっき見た絵を、' + n + '枚、選んでね'));

// ---------------------------------------------------------------- two players (versus.js)
add('つみきは いくつ？', '積み木は、いくつ？');
add('ひきわけ！', '引き分け！');
add('みどりの かち！', '緑の勝ち！');
add('ピンクの かち！', 'ピンクの勝ち！');

module.exports = { lines: out, norm: norm };

if (require.main === module) {
  out.forEach(l => console.log(l.text + '  →  ' + l.read));
  console.log(out.length + ' lines');
}
