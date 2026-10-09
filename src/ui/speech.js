// Đọc to cho bé.
// 1. Ưu tiên giọng thu sẵn (file mp3 giọng đọc tự nhiên trong public/voice, tạo bằng `npm run voice`).
// 2. Câu nào chưa có file thì dùng giọng tiếng Việt có sẵn trên máy (Web Speech API).

import { splitSentences, sentenceId } from './voiceText.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voice = null;
let enabled = true;
try {
  enabled = localStorage.getItem('speech') !== 'off';
} catch {
  /* bỏ qua */
}

// ---------- giọng thu sẵn ----------
let manifest = null; // { id: true }
const audio = typeof Audio !== 'undefined' ? new Audio() : null;
let queue = [];
let playing = false;

if (typeof fetch !== 'undefined') {
  fetch('/voice/manifest.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then((m) => {
      if (m && m.ids) manifest = new Set(m.ids);
    })
    .catch(() => {});
}

export function hasRecordedVoice() {
  return !!(manifest && manifest.size);
}

function playNext() {
  if (!audio) return;
  const id = queue.shift();
  if (!id) {
    playing = false;
    return;
  }
  playing = true;
  audio.src = '/voice/' + id + '.mp3';
  audio.play().catch(() => {
    playing = false;
    queue = [];
  });
}
if (audio) {
  audio.preload = 'auto';
  audio.addEventListener('ended', () => setTimeout(playNext, 120));
  audio.addEventListener('error', () => setTimeout(playNext, 0));
}

// ---------- giọng của máy ----------
function pickVoice() {
  if (!synth) return;
  const voices = synth.getVoices();
  voice =
    voices.find((v) => v.lang === 'vi-VN' && /linh|hoaimy|google/i.test(v.name)) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('vi')) ||
    null;
}
if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

export const speechSupported = !!synth || !!audio;
export function hasVietnameseVoice() {
  pickVoice();
  return !!voice;
}
export function isSpeechOn() {
  return enabled && speechSupported;
}
export function setSpeechOn(on) {
  enabled = on;
  try {
    localStorage.setItem('speech', on ? 'on' : 'off');
  } catch {
    /* bỏ qua */
  }
  if (!on) stopSpeech();
}

// iOS chỉ cho phát tiếng sau khi người dùng chạm màn hình: gọi hàm này trong sự kiện chạm.
// Phát một đoạn im lặng ngắn trên đúng thẻ audio sẽ dùng về sau để "mở khoá" nó.
const SILENCE =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
let primed = false;
export function primeSpeech() {
  if (primed) return;
  primed = true;
  try {
    if (audio && !playing) {
      audio.src = SILENCE;
      audio.play().catch(() => {});
    }
    if (synth) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      synth.speak(u);
    }
  } catch {
    /* bỏ qua */
  }
}

export function stopSpeech() {
  queue = [];
  playing = false;
  try {
    audio?.pause();
    synth?.cancel();
  } catch {
    /* bỏ qua */
  }
}

export function speak(text, { interrupt = true, force = false } = {}) {
  if ((!enabled && !force) || !text) return;
  try {
    const parts = splitSentences(text);
    if (!parts.length) return;
    if (interrupt) stopSpeech();
    const ids = parts.map(sentenceId);
    // đủ file thu sẵn cho cả đoạn thì phát file, tránh lẫn hai giọng khác nhau trong một đoạn
    if (audio && manifest && ids.every((id) => manifest.has(id))) {
      queue.push(...ids);
      if (!playing) playNext();
      return;
    }
    if (!synth) return;
    parts.forEach((p) => {
      const u = new SpeechSynthesisUtterance(p);
      u.lang = 'vi-VN';
      if (voice) u.voice = voice;
      u.rate = 0.95;
      u.pitch = 1;
      synth.speak(u);
    });
  } catch (e) {
    // giọng đọc lỗi thì bỏ qua, không được làm hỏng trò chơi
    console.warn('speech', e);
  }
}
