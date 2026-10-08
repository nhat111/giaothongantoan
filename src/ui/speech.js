// Đọc to bằng giọng tiếng Việt có sẵn trên máy (Web Speech API), không cần mạng hay file âm thanh.
// iPhone/iPad: giọng "Linh". Android: giọng Google tiếng Việt. Windows/Mac: cần cài giọng tiếng Việt.

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voice = null;
let enabled = true;
try {
  enabled = localStorage.getItem('speech') !== 'off';
} catch {
  /* bỏ qua */
}

function pickVoice() {
  if (!synth) return;
  const voices = synth.getVoices();
  voice =
    voices.find((v) => v.lang === 'vi-VN' && /linh|google|hoaimy|an\b/i.test(v.name)) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('vi')) ||
    null;
}
if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

export const speechSupported = !!synth;
export function hasVietnameseVoice() {
  pickVoice();
  return !!voice;
}
export function isSpeechOn() {
  return enabled && !!synth;
}
export function setSpeechOn(on) {
  enabled = on;
  try {
    localStorage.setItem('speech', on ? 'on' : 'off');
  } catch {
    /* bỏ qua */
  }
  if (!on) synth?.cancel();
}

// Đổi ký hiệu thành chữ để đọc cho tự nhiên
function clean(text) {
  return text
    .replace(/▲/g, 'nút Ra giữa')
    .replace(/▼/g, 'nút Vào lề')
    .replace(/▶/g, 'nút Đạp')
    .replace(/◀/g, 'nút Phanh')
    .replace(/\s*\/\s*/g, ' trên ')
    .replace(/\.\.\./g, ', ')
    .replace(/[★•]/g, ' ');
}

// iOS chỉ cho đọc sau khi người dùng chạm màn hình: gọi hàm này trong sự kiện chạm đầu tiên.
let primed = false;
export function primeSpeech() {
  if (!synth || primed) return;
  primed = true;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  synth.speak(u);
}

export function speak(text, { interrupt = true, force = false } = {}) {
  if (!synth || (!enabled && !force) || !text) return;
  try {
    speakNow(text, interrupt);
  } catch (e) {
    // giọng đọc lỗi thì bỏ qua, không được làm hỏng trò chơi
    console.warn('speech', e);
  }
}

function speakNow(text, interrupt) {
  if (interrupt) synth.cancel();
  const parts = clean(text)
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  // chia theo câu: một số máy cắt ngang câu dài
  parts.forEach((p) => {
    const u = new SpeechSynthesisUtterance(p);
    u.lang = 'vi-VN';
    if (voice) u.voice = voice;
    u.rate = 0.92;
    u.pitch = 1.1;
    synth.speak(u);
  });
}

export function stopSpeech() {
  synth?.cancel();
}
