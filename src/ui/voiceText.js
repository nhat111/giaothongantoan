// Các câu được đọc to. File này không dùng DOM để script tạo giọng đọc (scripts/gen-voice.mjs)
// dùng chung đúng các câu mà game sẽ đọc.

// Đổi ký hiệu thành chữ để đọc cho tự nhiên
export function cleanForSpeech(text) {
  return text
    .replace(/▲/g, 'nút Ra giữa')
    .replace(/▼/g, 'nút Vào lề')
    .replace(/▶/g, 'nút Đạp')
    .replace(/◀/g, 'nút Phanh')
    .replace(/\s*\/\s*/g, ' trên ')
    .replace(/\.\.\./g, ',')
    .replace(/[★•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .normalize('NFC');
}

// Tách thành từng câu: mỗi câu là một file âm thanh
export function splitSentences(text) {
  return cleanForSpeech(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => /[\p{L}\p{N}]/u.test(s));
}

// FNV-1a 32 bit: tên file âm thanh cho mỗi câu
export function sentenceId(s) {
  let h = 0x811c9dc5;
  for (const ch of s) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function walkIntroText(L) {
  return L.title + '. ' + L.goal + ' ' + L.rules.join(' ') + ' Bấm nút Bắt đầu màu xanh để chơi.';
}

export const PREP_ORDER = [0, 2, 1, 3];

export function bikeIntroText(L) {
  const order = PREP_ORDER.filter((i) => i < L.prep.length);
  return (
    L.title + '. ' + L.goal + ' Trước khi lên xe, bé chọn những việc nên làm. ' +
    order.map((i, k) => 'Thẻ ' + (k + 1) + ': ' + L.prep[i].text + '.').join(' ') +
    ' Chọn xong thì bấm nút Lên xe màu xanh.'
  );
}

export function prepToggleText(selected, text) {
  return (selected ? 'Bé chọn: ' : 'Bỏ chọn: ') + text + '.';
}

export function rulesText(L) {
  return L.title + '. ' + L.rules.join(' ');
}

export function menuText(levels) {
  return (
    'Bé chọn bài muốn chơi. ' +
    levels.map((L) => L.name + ': ' + (L.mode === 'bike' ? 'đi xe đạp, ' : 'đi bộ, ') + L.title.replace(/^Đi xe đạp:\s*/, '') + '.').join(' ')
  );
}

export function winHead(stars) {
  return stars === 3
    ? 'Giỏi quá! Bé đi đúng luật suốt cả đoạn đường.'
    : stars > 0
    ? 'Bé đã đến trường. Lần sau nhớ thêm những điều này nhé.'
    : 'Bé đã đến trường, nhưng cần luyện thêm. Bé nhớ những điều này nhé.';
}

export function winText(win) {
  return (
    'Đến trường rồi! Bé được ' + win.stars + ' sao. ' + winHead(win.stars) + ' ' + win.lessons.join(' ') +
    (win.last ? ' Tổng cộng ' + win.total + ' trên ' + win.max + ' sao.' : ' Bấm nút màu xanh để chơi bài tiếp theo.')
  );
}

export function eventText(def) {
  return def.prompt + ' ' + def.choices.map((c, k) => 'Cách ' + (k + 1) + ': ' + c.text + '.').join(' ');
}
