#!/usr/bin/env node
// Tạo file giọng đọc tự nhiên (mp3) cho mọi câu game sẽ đọc, lưu vào public/voice/.
//
//   npm run voice              tạo các câu còn thiếu
//   npm run voice -- --force   tạo lại tất cả (vd. sau khi đổi giọng)
//   node scripts/gen-voice.mjs --optional   như trên nhưng lỗi mạng thì bỏ qua, không làm hỏng build
//
// Mặc định dùng giọng đọc của Microsoft Edge (miễn phí, cần mạng, không cần tài khoản).
// Muốn dùng dịch vụ chính thức Azure Speech (có gói miễn phí): đặt biến môi trường
//   AZURE_SPEECH_KEY=...  AZURE_SPEECH_REGION=southeastasia
// Đổi giọng: VOICE=vi-VN-NamMinhNeural (nam) hoặc vi-VN-HoaiMyNeural (nữ, mặc định). Tốc độ: RATE=-5%

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'voice');
const args = new Set(process.argv.slice(2));
const OPTIONAL = args.has('--optional');
const FORCE = args.has('--force');
const VOICE = process.env.VOICE || 'vi-VN-HoaiMyNeural';
const RATE = process.env.RATE || '-5%';
const PITCH = process.env.PITCH || '+0%';
const TIME_LIMIT_MS = Number(process.env.VOICE_TIME_LIMIT_MS || 6 * 60 * 1000);

const { LEVELS } = await import(path.join(root, 'src/game/levels.js'));
const { MSG, LESSON } = await import(path.join(root, 'src/game/engine.js'));
const { BIKE_MSG, BIKE_LESSON } = await import(path.join(root, 'src/game/bike.js'));
const V = await import(path.join(root, 'src/ui/voiceText.js'));

// ---------- gom tất cả các câu ----------
const texts = new Set();
const add = (t) => t && texts.add(t);

Object.values(MSG).forEach(add);
Object.values(LESSON).forEach(add);
Object.values(BIKE_MSG).forEach(add);
Object.values(BIKE_LESSON).forEach(add);

LEVELS.forEach((L) => {
  add(L.goal);
  add(V.rulesText(L));
  if (L.mode === 'bike') {
    add(V.bikeIntroText(L));
    L.prep.forEach((it) => {
      add(V.prepToggleText(true, it.text));
      add(V.prepToggleText(false, it.text));
      add((it.good ? 'Bé quên: ' : 'Không nên: ') + it.text.toLowerCase() + '. ' + it.why);
    });
  } else add(V.walkIntroText(L));
});
add(V.menuText(LEVELS));
const max = LEVELS.length * 3;
for (let s = 0; s <= 3; s++) {
  add(V.winText({ stars: s, lessons: [], last: false, total: 0, max }));
  for (let t = 0; t <= max; t++) add(V.winText({ stars: s, lessons: [], last: true, total: t, max }));
}
// câu ghép trong code
add('Đèn cho xe đang đỏ. Bóp phanh, dừng trước vạch trắng.');
add('Đèn cho xe đang vàng. Bóp phanh, dừng trước vạch trắng.');

// mọi chuỗi tiếng Việt viết thẳng trong code (lời nhắc, thông báo)
const VI = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
for (const f of ['src/game/engine.js', 'src/game/bike.js', 'src/ui/Hud.jsx']) {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  for (const m of src.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)) {
    const s = m[1];
    if (VI.test(s) && s.includes(' ') && /[.!?]$/.test(s.trim()) && s.length > 12) add(s);
  }
}

const sentences = new Map();
for (const t of texts) for (const s of V.splitSentences(t)) sentences.set(V.sentenceId(s), s);
console.log(`Có ${sentences.size} câu cần giọng đọc.`);
if (args.has('--list')) {
  for (const s of sentences.values()) console.log('  ' + s);
  process.exit(0);
}

// ---------- tạo âm thanh ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function azureTTS(text) {
  const region = process.env.AZURE_SPEECH_REGION || 'southeastasia';
  const ssml = `<speak version="1.0" xml:lang="vi-VN"><voice name="${VOICE}"><prosody rate="${RATE}" pitch="${PITCH}">${esc(text)}</prosody></voice></speak>`;
  const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'giaothongantoan'
    },
    body: ssml
  });
  if (!r.ok) throw new Error('Azure ' + r.status + ' ' + (await r.text()));
  return Buffer.from(await r.arrayBuffer());
}

const edges = [];
async function edgeTTS(text, w = 0) {
  if (!edges[w]) {
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
    const t = new MsEdgeTTS();
    await t.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    edges[w] = t;
  }
  const res = await edges[w].toStream(esc(text), { rate: RATE, pitch: PITCH });
  const stream = res.audioStream;
  return await new Promise((resolve, reject) => {
    const chunks = [];
    const timer = setTimeout(() => reject(new Error('quá thời gian chờ')), 30000);
    stream.on('data', (c) => chunks.push(c));
    const done = () => {
      clearTimeout(timer);
      const buf = Buffer.concat(chunks);
      buf.length > 500 ? resolve(buf) : reject(new Error('âm thanh rỗng'));
    };
    stream.on('end', done);
    stream.on('close', done);
    stream.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

const baseSynth = process.env.AZURE_SPEECH_KEY ? azureTTS : edgeTTS;
// thư viện có thể ném lỗi mạng ngoài promise: bắt lại để không làm hỏng build
let lastAsyncError = null;
process.on('uncaughtException', (e) => {
  lastAsyncError = e;
  console.warn('  lỗi mạng: ' + (e.code || e.message));
});
process.on('unhandledRejection', (e) => {
  lastAsyncError = e;
});
const synth = (text, w) =>
  Promise.race([
    baseSynth(text, w),
    new Promise((_, reject) => setTimeout(() => reject(lastAsyncError || new Error('quá thời gian chờ')), 20000)),
    new Promise((_, reject) => {
      const iv = setInterval(() => {
        if (lastAsyncError) {
          clearInterval(iv);
          const e = lastAsyncError;
          lastAsyncError = null;
          reject(e);
        }
      }, 200);
      setTimeout(() => clearInterval(iv), 20500);
    })
  ]);

fs.mkdirSync(outDir, { recursive: true });
const started = Date.now();
const todo = [...sentences].filter(([id]) => FORCE || !fs.existsSync(path.join(outDir, id + '.mp3')));
console.log(`Cần tạo ${todo.length} câu (giọng ${VOICE}${process.env.AZURE_SPEECH_KEY ? ', Azure' : ', Edge'}).`);

let made = 0, failed = 0, consecutiveFail = 0, stop = false;
const WORKERS = Number(process.env.VOICE_WORKERS || 4);
async function worker(w) {
  while (!stop && todo.length) {
    if (Date.now() - started > TIME_LIMIT_MS) {
      if (!stop) console.warn('Hết thời gian cho phép, dừng lại. Chạy lại lệnh để tạo tiếp.');
      stop = true;
      break;
    }
    const [id, s] = todo.shift();
    try {
      let buf;
      for (let attempt = 0; ; attempt++) {
        try {
          buf = await synth(s, w);
          break;
        } catch (e) {
          if (attempt >= 2 || /ENOTFOUND|EAI_AGAIN/.test(e.message)) throw e;
          edges[w] = null; // mở lại kết nối
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
      fs.writeFileSync(path.join(outDir, id + '.mp3'), buf);
      made++;
      consecutiveFail = 0;
      if (made % 20 === 0) console.log(`  đã tạo ${made}`);
    } catch (e) {
      failed++;
      consecutiveFail++;
      console.warn(`  lỗi câu "${s.slice(0, 50)}": ${e.message}`);
      if (consecutiveFail >= 5 || /ENOTFOUND|EAI_AGAIN/.test(e.message)) {
        if (!stop) console.warn('Lỗi liên tục, có thể không có mạng. Dừng lại.');
        stop = true;
      }
    }
  }
}
await Promise.all(Array.from({ length: process.env.AZURE_SPEECH_KEY ? 2 : WORKERS }, (_, w) => worker(w)));
try {
  edges.forEach((t) => t?.close?.());
} catch {
  /* bỏ qua */
}

// xoá file của câu không còn dùng, ghi danh sách
for (const f of fs.readdirSync(outDir)) {
  const id = f.replace(/\.mp3$/, '');
  if (f.endsWith('.mp3') && !sentences.has(id)) fs.unlinkSync(path.join(outDir, f));
}
const ids = [...sentences.keys()].filter((id) => fs.existsSync(path.join(outDir, id + '.mp3'))).sort();
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ voice: VOICE, ids }) + '\n');
console.log(`Xong: tạo mới ${made}, lỗi ${failed}, có sẵn ${ids.length}/${sentences.size} câu.`);
process.exit(failed && !OPTIONAL && ids.length < sentences.size ? 1 : 0);
