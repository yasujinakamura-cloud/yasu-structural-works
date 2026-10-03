// Original NY jazz-funk groove, synthesized locally; no sampled commercial recording.
(() => {
  const button = document.querySelector('[data-sound-toggle]');
  const volume = document.querySelector('[data-sound-volume]');
  const status = document.querySelector('[data-sound-status]');
  if (!button || !volume) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    button.disabled = true;
    if (status) status.textContent = 'Sound is unavailable in this browser.';
    return;
  }

  let context, master, noise, timer, stopTimer;
  let enabled = false;
  let busy = false;
  const level = () => Number(volume.value) / 100;

  const BPM = 112;
  const STEP = 60 / BPM / 4;
  // Original voicings and syncopations, rather than a transcription of a recording.
  const harmony = [
    { root: 38, third: 3, notes: [62, 65, 69, 72, 76] },
    { root: 43, third: 4, notes: [65, 69, 71, 76] },
    { root: 36, third: 4, notes: [64, 67, 71, 74] },
    { root: 45, third: 3, notes: [60, 64, 67, 71] },
  ];
  const frequency = midi => 440 * Math.pow(2, (midi - 69) / 12);
  let stepTime = 0;
  let stepNumber = 0;

  function buildEngine() {
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = 0;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -18;
    limiter.knee.value = 12;
    limiter.ratio.value = 4;
    limiter.attack.value = 0.008;
    limiter.release.value = 0.18;
    master.connect(limiter).connect(context.destination);
    noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const channel = noise.getChannelData(0);
    for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1;
    stepTime = context.currentTime + 0.04;
  }

  function envelope(gain, at, duration, peak, attack = 0.004) {
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(peak, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  }

  function percussion(at, duration, cutoff, peak, highpass = false, pan = 0) {
    const source = context.createBufferSource();
    source.buffer = noise;
    const filter = context.createBiquadFilter();
    filter.type = highpass ? 'highpass' : 'bandpass';
    filter.frequency.value = cutoff;
    filter.Q.value = 0.7;
    const gain = context.createGain();
    envelope(gain, at, duration, peak);
    const position = context.createStereoPanner();
    position.pan.value = pan;
    source.connect(filter).connect(gain).connect(position).connect(master);
    source.onended = () => [source, filter, gain, position].forEach(node => node.disconnect());
    source.start(at);
    source.stop(at + duration + 0.015);
  }

  function tone(at, midi, duration, peak, kind = 'keys', pan = 0) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const position = context.createStereoPanner();
    const hz = frequency(midi);
    oscillator.frequency.value = hz;
    position.pan.value = pan;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(kind === 'bass' ? 1250 : kind === 'guitar' ? 2000 : 3700, at);
    filter.frequency.exponentialRampToValueAtTime(kind === 'bass' ? 320 : 1100, at + duration);
    oscillator.type = kind === 'bass' ? 'triangle' : kind === 'guitar' ? 'sawtooth' : 'sine';
    envelope(gain, at, duration, peak, kind === 'keys' ? 0.007 : 0.003);
    oscillator.connect(filter).connect(gain).connect(position).connect(master);
    let modulator, modulation;
    if (kind === 'keys') {
      // A rounded FM electric-piano attack, with a warm, decaying tine.
      modulator = context.createOscillator();
      modulation = context.createGain();
      modulator.frequency.value = hz * 2;
      modulation.gain.setValueAtTime(hz * 0.9, at);
      modulation.gain.exponentialRampToValueAtTime(hz * 0.04, at + duration * 0.6);
      modulator.connect(modulation).connect(oscillator.frequency);
      modulator.start(at);
      modulator.stop(at + duration + 0.02);
    }
    oscillator.onended = () => [oscillator, filter, gain, position, modulator, modulation].filter(Boolean).forEach(node => node.disconnect());
    oscillator.start(at);
    oscillator.stop(at + duration + 0.025);
  }

  function kick(at, peak = 0.36) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.setValueAtTime(140, at);
    oscillator.frequency.exponentialRampToValueAtTime(46, at + 0.085);
    envelope(gain, at, 0.23, peak, 0.002);
    oscillator.connect(gain).connect(master);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(at);
    oscillator.stop(at + 0.25);
    percussion(at, 0.016, 2300, 0.022);
  }

  function playStep(number, at) {
    const step = number % 16;
    const bar = Math.floor(number / 16) % 16;
    const chord = harmony[Math.floor(bar / 2) % harmony.length];
    const nextChord = harmony[Math.floor((bar + 1) / 2) % harmony.length];
    // Slightly late sixteenths and backbeat give the loop a relaxed strut.
    const time = at + (step % 2 ? 0.009 : 0);
    if ([0, 6, 10].includes(step) || (bar % 2 && step === 14)) kick(time, step === 0 ? 0.36 : 0.27);
    if (step === 4 || step === 12) {
      percussion(time + 0.005, 0.14, 2100, 0.19);
      tone(time + 0.005, 55, 0.08, 0.07, 'bass');
    } else if (step === 3 || (bar % 2 && step === 11)) percussion(time, 0.042, 1800, 0.028);
    percussion(time, step === 14 && bar % 2 ? 0.16 : 0.042, 6800, step % 2 ? 0.024 : 0.044, true, 0.23);

    const bass = { 0: 0, 3: 7, 6: 12, 8: 0, 10: chord.third, 13: 7 };
    if (Object.prototype.hasOwnProperty.call(bass, step)) tone(time, chord.root + bass[step], step === 0 ? 0.30 : 0.18, 0.22, 'bass');
    if (step === 15) tone(time, nextChord.root - 1, 0.11, 0.10, 'bass');
    if ([2, 7, 10, 14].includes(step)) {
      chord.notes.forEach((note, i) => tone(time + i * 0.002, note, step === 7 ? 0.55 : 0.36, 0.025, 'keys', -0.22));
    }
    if ([1, 5, 9, 13].includes(step)) {
      tone(time, chord.root + 24, 0.07, 0.022, 'guitar', 0.38);
      tone(time + 0.002, chord.root + 31, 0.065, 0.012, 'guitar', 0.38);
    }
    // Sparse original keyboard responses; an extra percussion fill every 8 bars.
    if (bar >= 8 && [3, 11].includes(step)) tone(time, chord.notes[(bar + step) % chord.notes.length] + 12, 0.21, 0.015, 'keys', 0.12);
    if (bar % 8 === 7 && step >= 13) percussion(time, 0.085, 900 + (step - 13) * 400, 0.05, false, -0.15);
  }

  function schedule() {
    if (!enabled || document.hidden || context.state !== 'running') return;
    const now = context.currentTime;
    if (stepTime < now) stepTime = now + 0.025;
    while (stepTime < now + 0.18) {
      playStep(stepNumber++, stepTime);
      stepTime += STEP;
    }
  }

  function updateControl() {
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Turn off New York jazz-funk sound' : 'Play New York jazz-funk sound');
    button.textContent = enabled ? 'SOUND ON  Ⅱ' : 'SOUND OFF  ▶';
    volume.setAttribute('aria-valuetext', volume.value + '%');
  }

  button.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    button.setAttribute('aria-busy', 'true');
    clearTimeout(stopTimer);
    try {
      if (!context) buildEngine();
      if (!enabled) {
        await context.resume();
        enabled = true;
        master.gain.setTargetAtTime(level(), context.currentTime, 0.08);
        schedule();
        timer = window.setInterval(schedule, 25);
      } else {
        enabled = false;
        clearInterval(timer);
        master.gain.setTargetAtTime(0, context.currentTime, 0.025);
        stopTimer = window.setTimeout(() => context.suspend().catch(() => {}), 180);
      }
      if (status) status.textContent = '';
    } catch {
      enabled = false;
      clearInterval(timer);
      if (context) { master.gain.value = 0; context.suspend().catch(() => {}); }
      if (status) status.textContent = 'Sound could not start. Please try again.';
    } finally {
      busy = false;
      button.removeAttribute('aria-busy');
      updateControl();
    }
  });
  volume.addEventListener('input', () => {
    if (context && enabled) master.gain.setTargetAtTime(level(), context.currentTime, 0.04);
    updateControl();
  });
  document.addEventListener('visibilitychange', () => {
    if (!context || !enabled) return;
    if (document.hidden) context.suspend().catch(() => {});
    else context.resume().then(schedule).catch(() => {});
  });
  window.addEventListener('pagehide', () => {
    clearInterval(timer);
    clearTimeout(stopTimer);
    context?.suspend().catch(() => {});
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted || !enabled || !context) return;
    context.resume().then(() => { schedule(); timer = window.setInterval(schedule, 25); }).catch(() => {});
  });
  updateControl();
})();
