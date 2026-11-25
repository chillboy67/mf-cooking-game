// Sizzle & Serve — tiny synthesized sound effects (WebAudio, no audio files).
// Every sound is an oscillator or filtered noise burst made at run time, so
// the game ships no audio assets and needs no network.

export function makeAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol || 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, vol, filterFreq) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t = c.currentTime;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq || 1200;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol || 0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t);
  }

  const sounds = {
    pickup: () => tone(520, 0.08, 'triangle', 0.1, 760),
    plate: () => { tone(420, 0.07, 'triangle', 0.1); setTimeout(() => tone(640, 0.09, 'triangle', 0.1), 60); },
    chop: () => noise(0.06, 0.16, 2500),
    sizzle: () => noise(0.5, 0.05, 4000),
    ding: () => { tone(880, 0.12, 'sine', 0.12); setTimeout(() => tone(1318, 0.16, 'sine', 0.1), 90); },
    serve: () => { tone(523, 0.1, 'triangle', 0.12); setTimeout(() => tone(659, 0.1, 'triangle', 0.12), 90); setTimeout(() => tone(784, 0.18, 'triangle', 0.12), 180); },
    burn: () => tone(180, 0.4, 'sawtooth', 0.08, 90),
    trash: () => noise(0.15, 0.12, 800),
    walkout: () => { tone(330, 0.15, 'square', 0.06, 220); setTimeout(() => tone(220, 0.25, 'square', 0.06), 140); },
    win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.12), i * 120)),
    lose: () => [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.1), i * 150)),
    click: () => tone(700, 0.05, 'triangle', 0.07),
  };

  return {
    play(name) { if (sounds[name]) sounds[name](); },
    setMuted(m) { muted = m; },
    get muted() { return muted; },
    unlock() { ensure(); },
  };
}
