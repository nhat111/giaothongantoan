// Âm thanh tổng hợp bằng WebAudio, không cần file âm thanh.
let ctx = null;
let ambient = null;

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    startAmbient();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

// tiếng còi xe máy "bíp bíp"
export function honk() {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  [0, 0.22].forEach((d) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0 + d);
    g.gain.linearRampToValueAtTime(0.18, t0 + d + 0.02);
    g.gain.setValueAtTime(0.18, t0 + d + 0.15);
    g.gain.linearRampToValueAtTime(0, t0 + d + 0.18);
    g.connect(ctx.destination);
    [415, 523].forEach((f) => {
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = f;
      o.connect(g);
      o.start(t0 + d);
      o.stop(t0 + d + 0.2);
    });
  });
}

// tiếng ồn phố xá rất nhỏ (tiếng động cơ xa)
function startAmbient() {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  const g = ctx.createGain();
  g.gain.value = 0.25;
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start();
  ambient = g;
}

export function setMuted(m) {
  if (ambient) ambient.gain.value = m ? 0 : 0.25;
}
