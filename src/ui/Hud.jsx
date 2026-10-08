import { useEffect, useState } from 'react';
import { engine } from '../game/engine.js';
import { LEVELS } from '../game/levels.js';
import { useGame } from './store.js';
import { unlockAudio as unlockSound } from './sound.js';
import { speak, stopSpeech, primeSpeech, setSpeechOn, speechSupported, hasVietnameseVoice } from './speech.js';

function unlockAudio() {
  unlockSound();
  primeSpeech();
}

// Nút loa nhỏ: chạm để nghe đọc to đoạn chữ bên cạnh
function Say({ text, label = 'Nghe đọc', big = false }) {
  if (!speechSupported) return null;
  return (
    <button
      type="button"
      className={big ? 'say big' : 'say'}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        unlockAudio();
        speak(text, { force: true });
      }}
    >
      🔊{big && <span>{label}</span>}
    </button>
  );
}

// Tự đọc khi màn hình hiện ra (nếu trình duyệt cho phép, tức là bé đã chạm màn hình trước đó)
function useAutoSpeak(text, deps) {
  useEffect(() => {
    const active = navigator.userActivation ? navigator.userActivation.hasBeenActive : false;
    if (active) {
      const t = setTimeout(() => speak(text), 350);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function Stars({ n, big }) {
  return (
    <span className={big ? 'stars big' : 'stars'} aria-label={`${n} trên 3 sao`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? 'on' : 'off'}>
          ★
        </span>
      ))}
    </span>
  );
}

export function TopBar() {
  const { levelIdx, stars, speechOn } = useGame();
  const [open, setOpen] = useState(() => window.innerWidth > 720);
  const L = LEVELS[levelIdx];
  return (
    <>
      <header className="topbar">
        <div className="brand">
          Bé Đi Học <span>An Toàn</span>
        </div>
        <div className="hud">
          <span className="pill">
            {L.name} / {LEVELS.length}
          </span>
          <Stars n={stars} />
          {speechSupported && (
            <button
              className={'ghost sound ' + (speechOn ? 'on' : 'off')}
              aria-pressed={speechOn}
              aria-label={speechOn ? 'Tắt đọc to' : 'Bật đọc to'}
              title={speechOn ? 'Đang đọc to. Chạm để tắt.' : 'Đang tắt đọc to. Chạm để bật.'}
              onClick={() => {
                unlockAudio();
                const on = !speechOn;
                setSpeechOn(on);
                useGame.setState({ speechOn: on });
                if (on) speak('Đã bật đọc to.');
              }}
            >
              {speechOn ? '🔊' : '🔇'}
            </button>
          )}
          <button
            className="ghost"
            onClick={() => {
              unlockAudio();
              const st = useGame.getState();
              if (st.overlay === 'menu') return;
              engine.pause();
              useGame.setState({ overlay: 'menu', menuFrom: st.overlay });
            }}
          >
            Chọn bài
          </button>
          <button className="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            Luật
          </button>
        </div>
      </header>
      {open && (
        <aside className="rules">
          <span className="label">Luật của bài</span>
          <h3>
            {L.title} <Say text={L.title + '. ' + L.rules.join(' ')} label="Nghe luật" />
          </h3>
          <ol>
            {L.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </aside>
      )}
    </>
  );
}

export function Toast() {
  const toast = useGame((s) => s.toast);
  const [shown, setShown] = useState(null);
  useEffect(() => {
    if (!toast) return setShown(null);
    setShown(toast);
    // để thông báo hiện đủ lâu cho giọng đọc đọc hết
    const ms = Math.max((toast.dur || 3.6) * 1000, toast.text.length * 85);
    const t = setTimeout(() => setShown((s) => (s && s.id === toast.id ? null : s)), ms);
    return () => clearTimeout(t);
  }, [toast]);
  if (!shown) return null;
  return (
    <div
      className={'toast ' + (shown.kind || '')}
      role="status"
      key={shown.id}
      onClick={() => {
        unlockAudio();
        speak(shown.text, { force: true });
      }}
      title="Chạm để nghe lại"
    >
      <span className="toast-icon" aria-hidden="true">
        {shown.kind === 'bad' ? '✋' : shown.kind === 'good' ? '👍' : '💬'}
      </span>
      <span>{shown.text}</span>
    </div>
  );
}

const DIRS = [
  ['u', 0, -1, '▲', 'Đi lên'],
  ['l', -1, 0, '◀', 'Sang trái'],
  ['r', 1, 0, '▶', 'Sang phải'],
  ['d', 0, 1, '▼', 'Đi xuống']
];
const BIKE_DIRS = [
  ['u', 0, -1, '▲', 'Ra giữa làn', 'Ra giữa'],
  ['l', -1, 0, '◀', 'Bóp phanh', 'Phanh'],
  ['r', 1, 0, '▶', 'Đạp xe', 'Đạp'],
  ['d', 0, 1, '▼', 'Vào sát lề hoặc rẽ vào', 'Vào lề']
];

export function Controls() {
  const levelIdx = useGame((s) => s.levelIdx);
  const L = LEVELS[levelIdx];
  const bike = L.mode === 'bike';
  useEffect(() => {
    const keys = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    const down = (e) => {
      unlockAudio();
      if (e.key === ' ') {
        e.preventDefault();
        engine.doLook();
        return;
      }
      if (e.key === 'x' || e.key === 'X') {
        engine.signal();
        return;
      }
      const k = keys[e.key] || keys[e.key.toLowerCase()];
      if (!k) return;
      e.preventDefault();
      if (e.repeat) return;
      engine.press(k[0], k[1]);
    };
    const up = (e) => {
      const k = keys[e.key] || keys[e.key.toLowerCase()];
      if (k) engine.release(k[0], k[1]);
    };
    const blur = () => engine.release();
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    addEventListener('blur', blur);
    return () => {
      removeEventListener('keydown', down);
      removeEventListener('keyup', up);
      removeEventListener('blur', blur);
    };
  }, []);
  return (
    <div className="controls">
      <div className="dpad" aria-label="Di chuyển">
        {(bike ? BIKE_DIRS : DIRS).map(([cls, dx, dy, ch, label, cap]) => (
          <button
            key={cls}
            className={cls}
            aria-label={label}
            onPointerDown={(e) => {
              e.preventDefault();
              unlockAudio();
              engine.press(dx, dy);
            }}
            onPointerUp={() => engine.release(dx, dy)}
            onPointerLeave={() => engine.release(dx, dy)}
            onPointerCancel={() => engine.release(dx, dy)}
            onContextMenu={(e) => e.preventDefault()}
          >
            {ch}
            {cap && <small>{cap}</small>}
          </button>
        ))}
      </div>
      <div className="side">
        <button
          className="look"
          onClick={() => {
            unlockAudio();
            engine.doLook();
          }}
        >
          <span className="ico" aria-hidden="true">👀</span>
          Quan sát
          <small>{bike ? 'nhìn phía sau' : 'nhìn trái, nhìn phải'}</small>
        </button>
        {bike && L.turnIntoGate && (
          <button className="signal" onClick={() => engine.signal()}>
            <span className="ico" aria-hidden="true">✋</span>
            Xin rẽ phải
            <small>giơ tay phải</small>
          </button>
        )}
        <button className="ghost small" onClick={() => engine.load(engine.levelIdx)}>
          Chơi lại bài
        </button>
      </div>
    </div>
  );
}

// Bé chọn những việc nên làm trước khi đi xe đạp
function PrepIntro({ L }) {
  const [sel, setSel] = useState(() => new Set());
  // trộn thứ tự cố định để mục đúng và sai xen kẽ nhau
  const order = [0, 2, 1, 3].filter((i) => i < L.prep.length);
  const toggle = (i) => {
    unlockAudio();
    const willSelect = !sel.has(i);
    speak((willSelect ? 'Bé chọn: ' : 'Bỏ chọn: ') + L.prep[i].text);
    setSel((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };
  const intro =
    L.title + '. ' + L.goal + ' Trước khi lên xe, bé chọn những việc nên làm. ' +
    order.map((i, k) => 'Thẻ ' + (k + 1) + ': ' + L.prep[i].text + '.').join(' ') +
    ' Chọn xong thì bấm nút Lên xe màu xanh.';
  useAutoSpeak(intro, [L]);
  return (
    <div className="overlay">
      <div className="sheet">
        <span className="label">{L.name} · Đi xe đạp</span>
        <Say text={intro} label="Nghe hướng dẫn" big />
        <h2>{L.title}</h2>
        <p>{L.goal}</p>
        <div className="prep">
          <strong>Trước khi lên xe, bé chọn những việc nên làm:</strong>
          {order.map((i) => (
            <label key={i} className={sel.has(i) ? 'on' : ''}>
              <input type="checkbox" checked={sel.has(i)} onChange={() => toggle(i)} />
              <span className="pic" aria-hidden="true">{L.prep[i].icon}</span>
              <span>{L.prep[i].text}</span>
            </label>
          ))}
        </div>
        <ol>
          {L.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
        <p className="keys">
          Máy tính: → đạp, ← phanh, ↑ ra giữa làn, ↓ vào sát lề{L.turnIntoGate ? ' / rẽ vào cổng' : ''}, Space quan sát phía sau
          {L.turnIntoGate ? ', X xin rẽ phải' : ''}. Điện thoại: dùng các nút trên màn hình.
        </p>
        <button
          className="primary"
          onClick={() => {
            unlockAudio();
            stopSpeech();
            useGame.setState({ overlay: null });
            engine.startBike(sel);
          }}
        >
          Lên xe
        </button>
      </div>
    </div>
  );
}

const PARENT_NOTE = 'Lưu ý cho bố mẹ: ngoài đời, trẻ dưới 7 tuổi khi qua đường phải có người lớn dắt tay.';

function WalkIntro({ L }) {
  const intro = L.title + '. ' + L.goal + ' ' + L.rules.join(' ') + ' Bấm nút Bắt đầu màu xanh để chơi.';
  useAutoSpeak(intro, [L]);
  return (
    <div className="overlay">
      <div className="sheet">
        <span className="label">{L.name}</span>
        <Say text={intro} label="Nghe hướng dẫn" big />
        <h2>{L.title}</h2>
        <p>{L.goal}</p>
        <ol>
          {L.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
        <p className="keys">{PARENT_NOTE}</p>
        <p className="keys">
          Máy tính: phím mũi tên để đi, phím cách (Space) để quan sát. Điện thoại, máy tính bảng: dùng các nút ở góc dưới màn hình.
        </p>
        <button
          className="primary"
          autoFocus
          onClick={() => {
            unlockAudio();
            stopSpeech();
            useGame.setState({ overlay: null });
            engine.start();
          }}
        >
          Bắt đầu
        </button>
      </div>
    </div>
  );
}

function WinSheet({ win, levelIdx }) {
  const head =
    win.stars === 3
      ? 'Giỏi quá! Bé đi đúng luật suốt cả đoạn đường.'
      : win.stars > 0
      ? 'Bé đã đến trường. Lần sau nhớ thêm:'
      : 'Bé đã đến trường, nhưng cần luyện thêm. Nhớ nhé:';
  const said =
    'Đến trường rồi! Bé được ' + win.stars + ' sao. ' + head + ' ' + win.lessons.join(' ') +
    (win.last ? ' Tổng cộng ' + win.total + ' trên ' + win.max + ' sao.' : ' Bấm nút màu xanh để chơi bài tiếp theo.');
  useAutoSpeak(said, [win]);
  return (
    <div className="overlay">
      <div className="sheet">
        <Say text={said} label="Nghe lại" big />
        <h2>Đến trường rồi!</h2>
        <Stars n={win.stars} big />
        <p>{head}</p>
        {win.lessons.length > 0 && (
          <ul>
            {win.lessons.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        )}
        {win.last && (
          <p>
            <strong>
              Tổng cộng: {win.total} / {win.max} sao.
            </strong>{' '}
            Bé đã học xong cách đi bộ và đi xe đạp an toàn đến trường.
          </p>
        )}
        <button
          className="primary"
          autoFocus
          onClick={() => {
            unlockAudio();
            engine.load(win.last ? 0 : levelIdx + 1);
          }}
        >
          {win.last ? 'Chơi lại từ đầu' : 'Bài tiếp theo'}
        </button>
        <button className="ghost" onClick={() => engine.load(levelIdx)}>
          Chơi lại bài này
        </button>
        <button
          className="ghost"
          onClick={() => {
            unlockAudio();
            useGame.setState({ overlay: 'menu', menuFrom: 'win' });
          }}
        >
          Chọn bài khác
        </button>
      </div>
    </div>
  );
}

export function VoiceHint() {
  const speechOn = useGame((s) => s.speechOn);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (!speechSupported) return;
    const t = setTimeout(() => setMissing(!hasVietnameseVoice()), 1500);
    return () => clearTimeout(t);
  }, []);
  if (!speechOn || !missing) return null;
  return (
    <div className="voice-hint">
      Máy này chưa có giọng đọc tiếng Việt nên có thể đọc sai hoặc không đọc. Điện thoại: vào Cài đặt, mục Trợ năng (hoặc Chuyển văn bản thành giọng nói),
      tải giọng Tiếng Việt.
      <button className="ghost small" onClick={() => setMissing(false)}>
        Đã hiểu
      </button>
    </div>
  );
}

const cardTitle = (t) => {
  const x = t.replace(/^Đi xe đạp:\s*/, '');
  return x.charAt(0).toUpperCase() + x.slice(1);
};

// Danh sách bài: bé chọn bài nào cũng được, không phải chơi lần lượt
function LevelMenu() {
  const { levelIdx, menuFrom, levelVersion } = useGame();
  const best = engine.totalStars;
  const said =
    'Bé chọn bài muốn chơi. ' + LEVELS.map((L, i) => L.name + ': ' + (L.mode === 'bike' ? 'đi xe đạp, ' : 'đi bộ, ') + L.title + '.').join(' ');
  useAutoSpeak(said, [levelVersion]);
  const canClose = menuFrom !== undefined && menuFrom !== 'menu' && levelVersion > 1;
  return (
    <div className="overlay">
      <div className="sheet menu">
        <div className="menu-head">
          <h2>Chọn bài</h2>
          <Say text={said} label="Nghe danh sách bài" />
        </div>
        <div className="levels">
          {LEVELS.map((L, i) => (
            <button
              key={i}
              className={'level-card' + (i === levelIdx && canClose ? ' current' : '')}
              onClick={() => {
                unlockAudio();
                stopSpeech();
                engine.load(i);
              }}
            >
              <span className="lv-ico" aria-hidden="true">{L.mode === 'bike' ? '🚲' : '🚶'}</span>
              <span className="lv-text">
                <span className="lv-name">
                  {L.name} · {L.mode === 'bike' ? 'Đi xe đạp' : 'Đi bộ'}
                </span>
                <span className="lv-title">{cardTitle(L.title)}</span>
              </span>
              <Stars n={best[i] || 0} />
            </button>
          ))}
        </div>
        {canClose && (
          <button
            className="ghost"
            onClick={() => {
              unlockAudio();
              useGame.setState({ overlay: menuFrom || null });
              engine.resume();
            }}
          >
            Quay lại bài đang chơi
          </button>
        )}
      </div>
    </div>
  );
}

export function Overlay() {
  const { overlay, win, levelIdx } = useGame();
  if (!overlay) return null;
  if (overlay === 'menu') return <LevelMenu />;
  const L = LEVELS[levelIdx];
  if (overlay === 'intro' && L.mode === 'bike') return <PrepIntro key={levelIdx + ':' + useGame.getState().levelVersion} L={L} />;
  if (overlay === 'intro') return <WalkIntro key={levelIdx + ':' + useGame.getState().levelVersion} L={L} />;
  return <WinSheet win={win} levelIdx={levelIdx} />;
}
