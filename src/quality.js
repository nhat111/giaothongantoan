// Chế độ hình ảnh.
// "pin" (mặc định trên điện thoại, máy tính bảng): 30 khung hình/giây, độ phân giải thấp hơn,
//   không đổ bóng thật (dùng bóng mềm), bầu trời đơn giản. Máy mát hơn, đỡ tốn pin.
// "dep" (mặc định trên máy tính): 60 khung hình/giây, đổ bóng thật, bầu trời đẹp hơn.

const isTouch =
  typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1200));

let saved = null;
try {
  saved = localStorage.getItem('quality');
} catch {
  /* bỏ qua */
}

export const QUALITY_MODE = saved === 'dep' || saved === 'pin' ? saved : isTouch ? 'pin' : 'dep';

export const QUALITY =
  QUALITY_MODE === 'pin'
    ? { mode: 'pin', fps: 30, dpr: [1, 1.3], shadows: false, sky: false, antialias: true }
    : { mode: 'dep', fps: 60, dpr: [1, 2], shadows: true, sky: true, antialias: true };

export function setQualityMode(mode) {
  try {
    localStorage.setItem('quality', mode);
  } catch {
    /* bỏ qua */
  }
  // đổi chế độ cần tạo lại bộ vẽ: tải lại trang cho chắc chắn
  window.location.reload();
}
