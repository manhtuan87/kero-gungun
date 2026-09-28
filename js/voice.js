/* ケロちゃん あたま ぐんぐん — ケロはかせ's voice, using the phone's own text-to-speech
   (Web Speech API). No audio files. It works offline when the phone has a Japanese voice installed;
   without one the game simply stays silent (the words are always on screen too). */
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
  var synth = !quiet && typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis : null;
  var voice = null, on = true, primed = false;

  function pickVoice() {
    if (!synth) return;
    var vs = [];
    try { vs = synth.getVoices() || []; } catch (e) { vs = []; }
    var ja = vs.filter(function (v) { return /^ja/i.test(v.lang || ''); });
    // prefer a voice on the phone itself (works offline)
    voice = ja.filter(function (v) { return v.localService; })[0] || ja[0] || null;
  }
  if (synth) {
    pickVoice();
    try { synth.addEventListener('voiceschanged', pickVoice); } catch (e) { synth.onvoiceschanged = pickVoice; }
  }

  // Letters that should not be read out.
  function clean(text) {
    return String(text).replace(/[★☆●○×♪〜～]/g, ' ').replace(/\n+/g, '、').replace(/\s+/g, ' ').trim();
  }

  function say(text, opts) {
    if (!synth || !on || !text) return;
    opts = opts || {};
    try {
      if (!opts.queue) synth.cancel();
      var u = new SpeechSynthesisUtterance(clean(text));
      u.lang = 'ja-JP';
      if (voice) u.voice = voice;
      u.rate = opts.rate || 1.05;
      u.pitch = opts.pitch || 1.25;
      u.volume = 1;
      synth.speak(u);
    } catch (e) { /* speech is best-effort */ }
  }

  function stop() { if (synth) { try { synth.cancel(); } catch (e) { /* ignore */ } } }

  // Chrome only lets a page speak after the player has touched it once.
  function prime() {
    if (!synth || primed) return;
    primed = true;
    pickVoice();
    try { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch (e) { /* ignore */ }
  }

  function set(value) { on = !!value; if (!on) stop(); }
  function supported() { return !!synth; }
  function available() { if (!voice) pickVoice(); return !!synth && !!voice; }

  return { say: say, stop: stop, prime: prime, set: set, supported: supported, available: available, quiet: quiet };
}());
