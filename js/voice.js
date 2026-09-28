/* ケロちゃん あたま ぐんぐん — ケロはかせ's voice.
   The fixed lines are recorded voice clips made with VOICEVOX (VOICEVOX:ずんだもん), listed in
   js/voice-clips.js (made by tools/voice/make.js). A line is said as a list of parts, e.g.
   ['はなこちゃん、', 'こんにちは！']: each part plays its clip, one after another; a part without a clip
   (a nickname) is read by the phone's own text-to-speech, slowly. The clips play through Web Audio
   (js/sound.js), which also turns the music down while ケロはかせ talks. */
var Voice = (function () {
  'use strict';
  // Silent on the PC (localhost) like the sound effects, unless the address has ?sound=1.
  var quiet = (function () {
    try {
      var q = location.search, h = location.hostname;
      if (/[?&]sound=1/.test(q)) return false;
      return /[?&]mute=1/.test(q) || h === 'localhost' || h === '127.0.0.1';
    } catch (e) { return false; }
  }());
  var clips = typeof VOICE_CLIPS !== 'undefined' ? VOICE_CLIPS : { files: {} };
  var sound = typeof Sound !== 'undefined' ? Sound : null;
  var synth = typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis : null;
  var voice = null, on = true, primed = false, gen = 0, src = null;
  var bytes = {};    // clip file → its bytes (small; decoded again each time it is said)
  var misses = {};   // parts that had no clip (for checking that only names are read by the phone)
  var canPlay = (function () {
    try { return !!document.createElement('audio').canPlayType(clips.type || 'audio/ogg; codecs="opus"'); } catch (e) { return false; }
  }());

  function pickVoice() {
    if (!synth) return;
    var vs = [];
    try { vs = synth.getVoices() || []; } catch (e) { vs = []; }
    var ja = vs.filter(function (v) { return /^ja/i.test(v.lang || ''); });
    voice = ja.filter(function (v) { return v.localService; })[0] || ja[0] || null;
  }
  if (synth) {
    pickVoice();
    try { synth.addEventListener('voiceschanged', pickVoice); } catch (e) { synth.onvoiceschanged = pickVoice; }
  }

  // The key of a line: spaces and line breaks made even, marks that are not read left out.
  function norm(text) {
    return String(text).replace(/[★☆●○×♪〜～]/g, ' ').replace(/[\s　]+/g, ' ').trim();
  }
  function clipOf(text) { return clips.files[norm(text)] || null; }

  // The phone's voice, slower and at its natural pitch (for names).
  function tts(text, done, my) {
    if (!synth || quiet) { done(); return; }
    try {
      var u = new SpeechSynthesisUtterance(norm(text));
      u.lang = 'ja-JP';
      if (voice) u.voice = voice;
      u.rate = 0.85; u.pitch = 1.0; u.volume = 1;
      var finished = false;
      var end = function () { if (!finished) { finished = true; if (my === gen) done(); } };
      u.onend = end; u.onerror = end;
      synth.speak(u);
      setTimeout(end, 600 + norm(text).length * 260);   // in case the phone never reports the end
    } catch (e) { done(); }
  }
  function load(url) {
    if (!bytes[url]) {
      bytes[url] = fetch(url).then(function (r) { if (!r.ok) throw new Error('clip ' + r.status); return r.arrayBuffer(); });
      bytes[url].catch(function () { delete bytes[url]; });
    }
    return bytes[url];
  }
  // A recorded clip; if it cannot be played, the phone reads the line instead.
  function play(url, text, done, my) {
    if (quiet) { done(); return; }
    var instead = function () { if (my === gen) tts(text, done, my); };
    if (!sound || !sound.ready()) { instead(); return; }
    load(url).then(function (b) { return sound.decode(b.slice(0)); }).then(function (buf) {
      if (my !== gen) return;
      src = sound.voice(buf, function () { if (my === gen) { src = null; done(); } });
      if (!src) instead();
    }).catch(instead);
  }

  // parts: a string or a list of strings, said in order (what was being said before stops).
  function say(parts) {
    var list = (Array.isArray(parts) ? parts : [parts]).map(norm).filter(function (t) { return t; });
    list.forEach(function (t) { if (!clips.files[t]) misses[t] = true; });
    if (!on || !list.length) return;
    stop();
    var my = gen;
    (function next(i) {
      if (my !== gen || i >= list.length) return;
      var url = clipOf(list[i]);
      if (url && canPlay) play(url, list[i], function () { next(i + 1); }, my);
      else tts(list[i], function () { next(i + 1); }, my);
    }(0));
  }

  function stop() {
    gen++;
    if (src) { try { src.stop(); } catch (e) { /* ignore */ } src = null; }
    if (synth) { try { synth.cancel(); } catch (e) { /* ignore */ } }
  }

  // Chrome only lets a page speak after the player has touched it once.
  function prime() {
    if (primed || quiet) return;
    primed = true;
    pickVoice();
    if (synth) { try { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch (e) { /* ignore */ } }
  }

  function set(value) { on = !!value; if (!on) stop(); }
  function supported() { return !!synth || canPlay; }
  function available() { if (!voice) pickVoice(); return canPlay && Object.keys(clips.files).length > 0 || (!!synth && !!voice); }
  // The phone's own voice, for names: 'ok', 'none' (no Japanese voice installed) or 'no' (not in this browser).
  function nameVoice() { if (!voice) pickVoice(); return !synth ? 'no' : voice ? 'ok' : 'none'; }

  return {
    say: say, stop: stop, prime: prime, set: set, supported: supported, available: available, nameVoice: nameVoice, quiet: quiet,
    norm: norm, hasClip: function (t) { return !!clipOf(t); }, misses: misses, credit: clips.credit || ''
  };
}());
