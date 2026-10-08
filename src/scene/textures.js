import * as THREE from 'three';

const cache = new Map();

export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function canvasTex(key, w, h, draw, repeat = false) {
  if (cache.has(key)) return cache.get(key);
  const c = makeCanvas(w, h);
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  cache.set(key, t);
  return t;
}

function noise(ctx, w, h, n, colors, size = [1, 3], rnd = Math.random) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[Math.floor(rnd() * colors.length)];
    const s = size[0] + rnd() * (size[1] - size[0]);
    ctx.fillRect(rnd() * w, rnd() * h, s, s);
  }
}

export function asphaltTexture(repX, repY) {
  const base = canvasTex(
    'asphalt',
    512,
    512,
    (ctx, w, h) => {
      const rnd = mulberry32(7);
      ctx.fillStyle = '#4b4e53';
      ctx.fillRect(0, 0, w, h);
      noise(ctx, w, h, 9000, ['#3f4246', '#55585d', '#5e6166', '#45484c', '#36383c'], [1, 3], rnd);
      // vết vá, vết dầu
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = `rgba(30,30,32,${0.08 + rnd() * 0.12})`;
        ctx.beginPath();
        ctx.ellipse(rnd() * w, rnd() * h, 20 + rnd() * 50, 8 + rnd() * 25, rnd() * 3, 0, 7);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(25,25,28,.45)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        let x = rnd() * w, y = rnd() * h;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let k = 0; k < 6; k++) {
          x += (rnd() - 0.5) * 40;
          y += (rnd() - 0.5) * 40;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
    true
  );
  const t = base.clone();
  t.needsUpdate = true;
  t.repeat.set(repX, repY);
  return t;
}

// gạch lát vỉa hè kiểu terrazzo đỏ - xám thường thấy ở phố Việt Nam
export function sidewalkTexture(repX, repY) {
  const base = canvasTex(
    'sidewalk',
    512,
    512,
    (ctx, w, h) => {
      const rnd = mulberry32(11);
      const n = 8, s = w / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const red = (i + j) % 2 === 0;
          const tone = Math.floor(rnd() * 14);
          ctx.fillStyle = red ? `rgb(${168 + tone},${92 + tone},${78 + tone})` : `rgb(${188 + tone},${180 + tone},${166 + tone})`;
          ctx.fillRect(i * s, j * s, s, s);
                for (let k = 0; k < 60; k++) {
            ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.12)';
            ctx.fillRect(i * s + rnd() * s, j * s + rnd() * s, 2, 2);
          }
        }
      ctx.strokeStyle = 'rgba(70,60,50,.55)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= n; i++) {
        ctx.beginPath(); ctx.moveTo(i * s, 0); ctx.lineTo(i * s, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * s); ctx.lineTo(w, i * s); ctx.stroke();
      }
      // vết bẩn
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = `rgba(60,50,40,${0.05 + rnd() * 0.08})`;
        ctx.beginPath();
        ctx.ellipse(rnd() * w, rnd() * h, 10 + rnd() * 40, 6 + rnd() * 20, rnd() * 3, 0, 7);
        ctx.fill();
      }
    },
    true
  );
  const t = base.clone();
  t.needsUpdate = true;
  t.repeat.set(repX, repY);
  return t;
}

export function plasterTexture() {
  return canvasTex(
    'plaster',
    256,
    256,
    (ctx, w, h) => {
      const rnd = mulberry32(3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      noise(ctx, w, h, 3000, ['#f1f1f1', '#e6e6e6', '#fafafa', '#dcdcdc'], [1, 3], rnd);
      // vệt ố do mưa
      for (let i = 0; i < 8; i++) {
        const x = rnd() * w;
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, 'rgba(90,85,75,.18)');
        g.addColorStop(1, 'rgba(90,85,75,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, 4 + rnd() * 10, h * (0.3 + rnd() * 0.6));
      }
    },
    true
  );
}

export const SHOP_SIGNS = [
  ['PHỞ BÒ', 'Gia truyền Nam Định', '#c0261c', '#ffe14d'],
  ['TẠP HÓA', 'Minh Anh', '#1f5fbf', '#ffffff'],
  ['CÀ PHÊ', 'Sáng Sớm', '#3b2316', '#f5d9a8'],
  ['NHÀ THUỐC', 'Tâm An', '#0e7a46', '#ffffff'],
  ['SỬA XE MÁY', 'Vá vỏ - Thay nhớt', '#f2c230', '#1b1b1b'],
  ['BÁNH MÌ', 'Ba Lan', '#e85d0c', '#ffffff'],
  ['VĂN PHÒNG PHẨM', 'Sách vở - Đồ dùng học tập', '#1d4e9e', '#ffef5a'],
  ['MÌ QUẢNG', 'Bà Mua', '#b3121b', '#ffffff'],
  ['BÚN CHẢ CÁ', 'Đà Nẵng', '#0c6d8c', '#fff6c2'],
  ['TIỆM TÓC', 'Thanh Thủy', '#8e2a7c', '#ffffff'],
  ['ĐIỆN THOẠI', 'Sửa chữa - Phụ kiện', '#d6102d', '#ffffff'],
  ['TRÀ SỮA', 'Mây', '#6b3fa0', '#ffffff'],
  ['ĐIỆN NƯỚC', 'Hòa Phát', '#173f7a', '#ffd200'],
  ['QUẦN ÁO', 'Trẻ em', '#e2457a', '#ffffff']
];

export function signTexture(idx) {
  const [title, sub, bg, fg] = SHOP_SIGNS[idx % SHOP_SIGNS.length];
  return canvasTex('sign' + idx, 640, 104, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = fg;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.globalAlpha = 1;
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 50px "Be Vietnam Pro", Arial, sans-serif';
    ctx.fillText(title, w / 2, h * 0.4, w - 30);
    ctx.font = '600 21px "Be Vietnam Pro", Arial, sans-serif';
    ctx.fillText(sub + '  •  ĐT: 0905 ' + String(100 + idx * 37).slice(0, 3) + ' ' + String(400 + idx * 53).slice(0, 3), w / 2, h * 0.8, w - 30);
  });
}

export function textTexture(key, text, { w = 1024, h = 160, bg = '#1d4e9e', fg = '#fff', font = 64, sub = '' } = {}) {
  return canvasTex(key, w, h, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${font}px "Be Vietnam Pro", Arial, sans-serif`;
    ctx.fillText(text, w / 2, sub ? h * 0.4 : h / 2, w - 30);
    if (sub) {
      ctx.font = `600 ${font * 0.45}px "Be Vietnam Pro", Arial, sans-serif`;
      ctx.fillText(sub, w / 2, h * 0.78, w - 30);
    }
  });
}

export function flagTexture() {
  return canvasTex('flag', 300, 200, (ctx, w, h) => {
    ctx.fillStyle = '#da251d';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    const cx = w / 2, cy = h / 2, R = h * 0.3, r = R * 0.382;
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? R : r;
      ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    ctx.fill();
  });
}

// biển báo 423 "Đường người đi bộ sang ngang"
export function crossingSignTexture() {
  return canvasTex('sign423', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1559b5';
    ctx.fillRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(w / 2, 40);
    ctx.lineTo(w - 36, h - 50);
    ctx.lineTo(36, h - 50);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#111';
    for (let i = 0; i < 4; i++) ctx.fillRect(70 + i * 30, h - 78, 18, 14);
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
    ctx.beginPath();
    ctx.arc(w / 2 + 4, 98, 11, 0, 7);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w / 2 + 2, 114); ctx.lineTo(w / 2 - 4, 150);
    ctx.moveTo(w / 2 - 4, 150); ctx.lineTo(w / 2 - 20, 180);
    ctx.moveTo(w / 2 - 4, 150); ctx.lineTo(w / 2 + 14, 178);
    ctx.moveTo(w / 2, 124); ctx.lineTo(w / 2 - 20, 140);
    ctx.moveTo(w / 2, 124); ctx.lineTo(w / 2 + 20, 136);
    ctx.stroke();
  });
}

// mặt đèn cho người đi bộ: hình người + số đếm ngược. Vẽ lại mỗi khi trạng thái đổi.
export function makePedSignalCanvas() {
  const c = makeCanvas(128, 200);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  let lastKey = '';
  function draw(state, count, blinkOn) {
    const key = state + count + blinkOn;
    if (key === lastKey) return;
    lastKey = key;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0d0f12';
    ctx.fillRect(0, 0, 128, 200);
    const green = state !== 'red';
    const lit = state !== 'blink' || blinkOn;
    const col = green ? (lit ? '#3dff8a' : '#0f3a22') : '#ff3b30';
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    const cx = 64, cy = 70;
    ctx.beginPath();
    ctx.arc(cx, cy - 42, 11, 0, 7);
    ctx.fill();
    ctx.beginPath();
    if (green) {
      ctx.moveTo(cx, cy - 26); ctx.lineTo(cx - 3, cy + 10);
      ctx.moveTo(cx - 3, cy + 10); ctx.lineTo(cx - 20, cy + 40);
      ctx.moveTo(cx - 3, cy + 10); ctx.lineTo(cx + 16, cy + 40);
      ctx.moveTo(cx, cy - 18); ctx.lineTo(cx - 20, cy);
      ctx.moveTo(cx, cy - 18); ctx.lineTo(cx + 20, cy - 4);
    } else {
      ctx.moveTo(cx, cy - 26); ctx.lineTo(cx, cy + 10);
      ctx.moveTo(cx - 7, cy + 10); ctx.lineTo(cx - 7, cy + 42);
      ctx.moveTo(cx + 7, cy + 10); ctx.lineTo(cx + 7, cy + 42);
      ctx.moveTo(cx - 15, cy - 20); ctx.lineTo(cx - 15, cy + 8);
      ctx.moveTo(cx + 15, cy - 20); ctx.lineTo(cx + 15, cy + 8);
    }
    ctx.stroke();
    ctx.font = '800 54px "Be Vietnam Pro", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = col;
    ctx.fillText(String(count).padStart(2, '0'), 64, 160);
    tex.needsUpdate = true;
  }
  return { tex, draw };
}
