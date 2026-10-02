// A synthesized city ambience: no recordings, downloads, or third-party audio.
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
  let nextTraffic = 0, nextHorn = 0, nextSteps = 0, nextTrain = 0;
  const random = (min, max) => min + Math.random() * (max - min);
  const level = () => Number(volume.value) / 100;

  function buildEngine() {
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = 0;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -16;
    limiter.knee.value = 12;
    limiter.ratio.value = 5;
    limiter.attack.value = 0.01;
    limiter.release.value = 0.2;
    master.connect(limiter).connect(context.destination);

    noise = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
    const channel = noise.getChannelData(0);
    for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1;

    // Continuous low traffic bed and the distant body of a subway train.
    const bed = context.createBufferSource();
    bed.buffer = noise;
    bed.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 230;
    const bedGain = context.createGain();
    bedGain.gain.value = 0.28;
    bed.connect(filter).connect(bedGain).connect(master);
    bed.start();
    const rumble = context.createOscillator();
    rumble.frequency.value = 51;
    const rumbleGain = context.createGain();
    rumbleGain.gain.value = 0.015;
    rumble.connect(rumbleGain).connect(master);
    rumble.start();
    nextTraffic = context.currentTime + 0.3;
    nextSteps = context.currentTime + 1;
    nextHorn = context.currentTime + 4.5;
    nextTrain = context.currentTime + 8;
  }

  function envelope(gain, at, duration, peak, attack) {
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(peak, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  }

  function noiseEvent(at, duration, frequency, peak, pan, passing = false) {
    const source = context.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = passing ? 'lowpass' : 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = passing ? 0.6 : 1.5;
    const gain = context.createGain();
    envelope(gain, at, duration, peak, passing ? duration * 0.4 : 0.008);
    const position = context.createStereoPanner();
    position.pan.setValueAtTime(pan, at);
    if (passing) position.pan.linearRampToValueAtTime(-pan, at + duration);
    source.connect(filter).connect(gain).connect(position).connect(master);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); position.disconnect(); };
    source.start(at, random(0, 2));
    source.stop(at + duration + 0.05);
  }

  function horn(at) {
    const duration = random(0.35, 0.65);
    const pan = random(-0.7, 0.7);
    for (const frequency of [349, 440]) {
      const tone = context.createOscillator();
      tone.type = 'triangle';
      tone.frequency.setValueAtTime(frequency + random(-2, 2), at);
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      const gain = context.createGain();
      envelope(gain, at, duration, 0.035, 0.035);
      const position = context.createStereoPanner();
      position.pan.value = pan;
      tone.connect(filter).connect(gain).connect(position).connect(master);
      tone.onended = () => { tone.disconnect(); filter.disconnect(); gain.disconnect(); position.disconnect(); };
      tone.start(at);
      tone.stop(at + duration + 0.05);
    }
  }

  function schedule() {
    if (!enabled || document.hidden || context.state !== 'running') return;
    const now = context.currentTime;
    const horizon = now + 1.5;
    if (nextTraffic < now) nextTraffic = now + 0.1;
    if (nextSteps < now) nextSteps = now + 0.4;
    if (nextHorn < now) nextHorn = now + 2;
    if (nextTrain < now) nextTrain = now + 3;
    while (nextTraffic < horizon) {
      noiseEvent(nextTraffic, random(2.5, 4.5), random(500, 1000), 0.12, Math.random() < 0.5 ? -0.85 : 0.85, true);
      nextTraffic += random(3, 5.5);
    }
    while (nextSteps < horizon) {
      for (let i = 0; i < 6; i++) noiseEvent(nextSteps + i * 0.42, 0.12, random(300, 650), 0.035, i % 2 ? 0.15 : -0.15);
      nextSteps += random(7, 11);
    }
    while (nextHorn < horizon) { horn(nextHorn); nextHorn += random(10, 18); }
    while (nextTrain < horizon) {
      noiseEvent(nextTrain, 5, 330, 0.17, -0.6, true);
      for (let i = 0; i < 14; i++) noiseEvent(nextTrain + i * 0.28, 0.09, 1700, 0.025, -0.35);
      nextTrain += random(21, 29);
    }
  }

  function updateControl() {
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Turn off New York city sound' : 'Play New York city sound');
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
        timer = window.setInterval(schedule, 400);
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
    context.resume().then(() => { schedule(); timer = window.setInterval(schedule, 400); }).catch(() => {});
  });
  updateControl();
})();
