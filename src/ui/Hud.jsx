import { useEffect, useState } from 'react';
import { engine } from '../game/engine.js';
import { LEVELS } from '../game/levels.js';
import { useGame } from './store.js';
import { unlockAudio } from './sound.js';

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
  const { levelIdx, stars } = useGame();
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
          <button className="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            Luật
          </button>
        </div>
      </header>
      {open && (
        <aside className="rules">
          <span className="label">Luật của bài</span>
          <h3>{L.title}</h3>
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
    const t = setTimeout(() => setShown((s) => (s && s.id === toast.id ? null : s)), (toast.dur || 3.6) * 1000);
    return () => clearTimeout(t);
  }, [toast]);
  if (!shown) return null;
  return (
    <div className={'toast ' + (shown.kind || '')} role="status" key={shown.id}>
      {shown.text}
    </div>
  );
}

const DIRS = [
  ['u', 0, -1, '▲', 'Đi lên'],
  ['l', -1, 0, '◀', 'Sang trái'],
  ['r', 1, 0, '▶', 'Sang phải'],
  ['d', 0, 1, '▼', 'Đi xuống']
];

export function Controls() {
  useEffect(() => {
    const keys = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    const down = (e) => {
      unlockAudio();
      if (e.key === ' ') {
        e.preventDefault();
        engine.doLook();
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
      if (k && engine.held && engine.held.dx === k[0] && engine.held.dy === k[1]) engine.release();
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
        {DIRS.map(([cls, dx, dy, ch, label]) => (
          <button
            key={cls}
            className={cls}
            aria-label={label}
            onPointerDown={(e) => {
              e.preventDefault();
              unlockAudio();
              engine.press(dx, dy);
            }}
            onPointerUp={() => engine.release()}
            onPointerLeave={() => engine.release()}
            onPointerCancel={() => engine.release()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {ch}
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
          Quan sát
          <small>nhìn trái, nhìn phải</small>
        </button>
        <button className="ghost small" onClick={() => engine.load(engine.levelIdx)}>
          Chơi lại bài
        </button>
      </div>
    </div>
  );
}

export function Overlay() {
  const { overlay, win, levelIdx } = useGame();
  if (!overlay) return null;
  const L = LEVELS[levelIdx];
  if (overlay === 'intro')
    return (
      <div className="overlay">
        <div className="sheet">
          <span className="label">{L.name}</span>
          <h2>{L.title}</h2>
          <p>{L.goal}</p>
          <ol>
            {L.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          <p className="keys">
            Máy tính: phím mũi tên để đi, phím cách (Space) để quan sát. Điện thoại, máy tính bảng: dùng các nút ở góc dưới màn hình.
          </p>
          <button
            className="primary"
            autoFocus
            onClick={() => {
              unlockAudio();
              useGame.setState({ overlay: null });
              engine.start();
            }}
          >
            Bắt đầu
          </button>
        </div>
      </div>
    );
  const head =
    win.stars === 3
      ? 'Giỏi quá! Bé đi đúng luật suốt cả đoạn đường.'
      : win.stars > 0
      ? 'Bé đã đến trường. Lần sau nhớ thêm:'
      : 'Bé đã đến trường, nhưng cần luyện thêm. Nhớ nhé:';
  return (
    <div className="overlay">
      <div className="sheet">
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
            Bé đã học xong cách đi bộ an toàn đến trường.
          </p>
        )}
        <button className="primary" autoFocus onClick={() => engine.load(win.last ? 0 : levelIdx + 1)}>
          {win.last ? 'Chơi lại từ đầu' : 'Bài tiếp theo'}
        </button>
        <button className="ghost" onClick={() => engine.load(levelIdx)}>
          Chơi lại bài này
        </button>
      </div>
    </div>
  );
}
