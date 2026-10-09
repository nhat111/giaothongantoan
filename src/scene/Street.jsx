import { useMemo } from 'react';
import * as THREE from 'three';
import { TILE, EXT } from '../game/engine.js';
import { mat, Box, SW, cylGeo, sphereGeo, makeCoords } from './common.jsx';
import { asphaltTexture, sidewalkTexture, mulberry32, crossingSignTexture } from './textures.js';
import { Moto } from './Models.jsx';

const PAD = 6; // thêm vài ô ở hai đầu cho đẹp
const HALF = (cols) => (cols / 2 + EXT + PAD) * TILE;

// ---------- lòng đường ----------
export function Road({ engine, road }) {
  const { wx, wz } = makeCoords(engine);
  const half = HALF(engine.COLS);
  const len = half * 2;
  const z0 = wz(road.rows[0]);
  const zMid = wz(road.rows[1]);
  const z1 = wz(road.rows[1] + 1);
  const width = z1 - z0;
  const tex = useMemo(() => asphaltTexture(len / 6, width / 6), [len, width]);
  const white = mat('#f1f0ea', { roughness: 0.6 });
  const yellow = mat('#f2c230', { roughness: 0.6 });
  const zx0 = wx(road.zc), zx1 = wx(road.zc + 1);

  const hasZebra = road.zc >= 0;
  const dashes = [];
  for (let x = -half; x < half; x += 3.2) {
    if (hasZebra && x + 1.8 > zx0 - 0.8 && x < zx1 + 0.8) continue;
    dashes.push(x + 0.9);
  }
  const stripes = [];
  if (hasZebra) for (let z = z0 + 0.35; z < z1 - 0.2; z += 0.9) stripes.push(z + 0.22);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (z0 + z1) / 2]} receiveShadow>
        <planeGeometry args={[len, width]} />
        <meshStandardMaterial map={tex} roughness={0.95} />
      </mesh>
      {dashes.map((x, i) => (
        <Box key={i} s={[1.8, 0.01, 0.12]} p={[x, 0.006, zMid]} m={yellow} receive />
      ))}
      {/* vạch mép đường */}
      {[z0 + 0.3, z1 - 0.3].map((z, i) => (
        <Box key={'e' + i} s={[len, 0.01, 0.1]} p={[0, 0.005, z]} m={white} receive />
      ))}
      {/* vạch kẻ đường cho người đi bộ */}
      {stripes.map((z, i) => (
        <Box key={'z' + i} s={[zx1 - zx0 - 0.3, 0.012, 0.45]} p={[(zx0 + zx1) / 2, 0.007, z]} m={white} receive />
      ))}
      {/* vạch dừng xe */}
      {hasZebra && <Box s={[0.3, 0.012, zMid - z0 - 0.3]} p={[zx1 + 0.35, 0.007, (z0 + zMid) / 2]} m={white} />}
      {hasZebra && <Box s={[0.3, 0.012, z1 - zMid - 0.3]} p={[zx0 - 0.35, 0.007, (zMid + z1) / 2]} m={white} />}
      {/* nắp cống */}
      {[-14, 9, 22].map((x, i) => (
        <mesh key={'m' + i} position={[x, 0.008, zMid + (i % 2 ? 0.8 : -0.8)]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.35, 16]} />
          <primitive object={mat('#2a2b2d', { metalness: 0.6, roughness: 0.5 })} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

// ---------- vỉa hè ----------
export function Sidewalk({ engine, row }) {
  const { wz } = makeCoords(engine);
  const half = HALF(engine.COLS);
  const z0 = wz(row), z1 = wz(row + 1);
  const tex = useMemo(() => sidewalkTexture((half * 2) / 3.2, (z1 - z0) / 3.2), [half, z0, z1]);
  const curb = mat('#c9c4b8', { roughness: 0.85 });
  const above = engine.grid[row - 1]?.[0];
  const below = engine.grid[row + 1]?.[0];
  const roadAbove = engine.grid[row - 1]?.some((t) => t === 'r' || t === 'z');
  const roadBelow = engine.grid[row + 1]?.some((t) => t === 'r' || t === 'z');
  return (
    <group>
      <mesh position={[0, SW / 2, (z0 + z1) / 2]} receiveShadow>
        <boxGeometry args={[half * 2, SW, z1 - z0]} />
        <meshStandardMaterial attach="material-0" color="#bdb6a8" />
        <meshStandardMaterial attach="material-1" color="#bdb6a8" />
        <meshStandardMaterial attach="material-2" map={tex} roughness={0.9} />
        <meshStandardMaterial attach="material-3" color="#bdb6a8" />
        <meshStandardMaterial attach="material-4" color="#bdb6a8" />
        <meshStandardMaterial attach="material-5" color="#bdb6a8" />
      </mesh>
      {roadAbove && <Box s={[half * 2, SW + 0.02, 0.22]} p={[0, (SW + 0.02) / 2, z0 + 0.11]} m={curb} receive />}
      {roadBelow && <Box s={[half * 2, SW + 0.02, 0.22]} p={[0, (SW + 0.02) / 2, z1 - 0.11]} m={curb} receive />}
      {void above}
      {void below}
    </group>
  );
}

// ---------- dải cây xanh ----------
export function Planter({ engine, row }) {
  const { wx, wz } = makeCoords(engine);
  const z0 = wz(row), z1 = wz(row + 1);
  const cells = engine.grid[row];
  const half = HALF(engine.COLS);
  // gom các đoạn 'p' liên tiếp, kéo dài ra ngoài bản đồ
  const segs = [];
  let start = null;
  for (let c = -EXT - PAD; c <= engine.COLS + EXT + PAD; c++) {
    const t = c < 0 ? cells[0] : c >= engine.COLS ? cells[engine.COLS - 1] : cells[c];
    if (t === 'p' && start === null) start = c;
    if ((t !== 'p' || c === engine.COLS + EXT + PAD) && start !== null) {
      segs.push([start, c]);
      start = null;
    }
  }
  const rnd = mulberry32(row * 31 + 7);
  const trees = [];
  segs.forEach(([a, b]) => {
    for (let c = a; c < b; c += 2) trees.push({ x: wx(c + 0.5 + rnd() * 0.6), s: 0.85 + rnd() * 0.4, seed: rnd() });
  });
  return (
    <group>
      {segs.map(([a, b], i) => {
        const x0 = Math.max(wx(a), -half), x1 = Math.min(wx(b), half);
        return (
          <group key={i}>
            <Box s={[x1 - x0 - 0.1, 0.45, z1 - z0 - 0.3]} p={[(x0 + x1) / 2, 0.225, (z0 + z1) / 2]} m={mat('#a8a296')} receive />
            <Box s={[x1 - x0 - 0.4, 0.06, z1 - z0 - 0.6]} p={[(x0 + x1) / 2, 0.46, (z0 + z1) / 2]} m={mat('#5d8a3a', { roughness: 1 })} receive />
            {/* bụi cây thấp */}
            <Box s={[x1 - x0 - 0.8, 0.5, 0.6]} p={[(x0 + x1) / 2, 0.72, z0 + 0.6]} m={mat('#3f7a33', { roughness: 1 })} cast />
            <Box s={[x1 - x0 - 0.8, 0.5, 0.6]} p={[(x0 + x1) / 2, 0.72, z1 - 0.6]} m={mat('#3f7a33', { roughness: 1 })} cast />
          </group>
        );
      })}
      {trees.map((t, i) => (
        <Tree key={i} x={t.x} z={(z0 + z1) / 2} y={0.45} s={t.s} seed={t.seed} />
      ))}
    </group>
  );
}

// ---------- cây xanh (cây sao / cây bàng) ----------
export function Tree({ x, z, y = SW, s = 1, seed = 0.5 }) {
  const rnd = mulberry32(Math.floor(seed * 1e6));
  const greens = ['#3d6e2e', '#4a7d33', '#355f28', '#567f37'];
  const blobs = Array.from({ length: 6 }, () => [
    (rnd() - 0.5) * 2.2,
    5.6 + rnd() * 1.4,
    (rnd() - 0.5) * 2.2,
    0.9 + rnd() * 0.7,
    greens[Math.floor(rnd() * greens.length)]
  ]);
  return (
    <group position={[x, y, z]} scale={s}>
      <mesh geometry={cylGeo(0.13, 0.2, 6, 8)} position={[0, 3, 0]} material={mat('#5b4636', { roughness: 1 })} castShadow />
      {/* gốc cây quét vôi trắng */}
      <mesh geometry={cylGeo(0.205, 0.215, 0.9, 8)} position={[0, 0.45, 0]} material={mat('#efefe8')} />
      {blobs.map(([bx, by, bz, r, c], i) => (
        <mesh key={i} position={[bx, by, bz]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={c} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// ---------- cột điện + dây điện ----------
function Pole({ x, z }) {
  const concrete = mat('#a9a69e', { roughness: 0.9 });
  return (
    <group position={[x, SW, z]}>
      <mesh geometry={cylGeo(0.1, 0.17, 8.5, 8)} position={[0, 4.25, 0]} material={concrete} castShadow />
      <Box s={[0.12, 0.12, 1.4]} p={[0, 7.8, 0]} m={concrete} />
      <Box s={[0.12, 0.12, 1.0]} p={[0, 6.9, 0]} m={concrete} />
      {/* hộp công tơ / bó dây */}
      <Box s={[0.35, 0.5, 0.25]} p={[0.2, 4.2, 0]} m={mat('#d9d6cc')} />
      <mesh geometry={cylGeo(0.25, 0.25, 0.6, 10)} position={[0, 6.2, 0.35]} material={mat('#6d6d6d')} />
    </group>
  );
}

function wireGeo(pts, r) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, 10, r, 3, false);
}

function sag(a, b, drop, n = 10) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - drop * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t]);
  }
  return pts;
}

export function PowerLine({ engine, row, side }) {
  // side: z của mép vỉa hè giáp đường
  const { wx } = makeCoords(engine);
  const rnd = mulberry32(row * 13 + 1);
  const zc = engine.roads.map((r) => r.zc);
  const xs = [];
  for (let c = -EXT - 2; c <= engine.COLS + EXT + 2; c += 4) {
    let cc = c;
    if (zc.some((z) => Math.abs(cc - z) <= 1)) cc += 2;
    xs.push(wx(cc + 0.15));
  }
  const z = side;
  const wires = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1];
    [
      [7.8, -0.6, 0.5],
      [7.8, 0.6, 0.5],
      [6.9, -0.4, 0.7],
      [6.9, 0.4, 0.7],
      [6.0, 0.1, 1.1 + rnd() * 0.6],
      [5.8, 0.25, 1.3 + rnd() * 0.8],
      [5.6, -0.2, 1.5 + rnd() * 0.8]
    ].forEach(([h, dz, d], k) => wires.push({ pts: sag([a, h + SW, z + dz], [b, h + SW, z + dz], d), k }));
  }
  return (
    <group>
      {xs.map((x, i) => (
        <Pole key={i} x={x} z={z} />
      ))}
      {/* dây điện: ống mảnh (được gộp chung với cả con phố nên gần như không tốn thêm lệnh vẽ) */}
      {wires.map((w, i) => (
        <mesh key={i} geometry={wireGeo(w.pts, w.k > 3 ? 0.022 : 0.014)} material={mat(w.k > 3 ? '#1a1a1a' : '#2b2b2b')} />
      ))}
    </group>
  );
}

// ---------- đồ vật trên vỉa hè ----------
export function SidewalkProps({ engine, row }) {
  const { wx, wz } = makeCoords(engine);
  const z0 = wz(row), z1 = wz(row + 1);
  const roadAbove = engine.grid[row - 1]?.some((t) => t === 'r' || t === 'z');
  const roadBelow = engine.grid[row + 1]?.some((t) => t === 'r' || t === 'z');
  const houseAbove = engine.grid[row - 1]?.[0] === 'B';
  const houseBelow = engine.grid[row + 1]?.[0] === 'B';
  const rnd = mulberry32(row * 97 + engine.levelIdx * 13);
  const zcs = engine.roads.map((r) => r.zc);
  const special = new Set();
  engine.grid.forEach((rw) => rw.forEach((t, c) => (t === 'H' || t === 'S') && special.add(c)));
  const items = [];
  for (let c = -EXT; c < engine.COLS + EXT; c++) {
    const nearZebra = zcs.some((z) => Math.abs(c - z) <= 1);
    const roadZ = roadAbove ? z0 + 0.45 : roadBelow ? z1 - 0.45 : null;
    const houseZ = houseAbove ? z0 + 0.45 : houseBelow ? z1 - 0.45 : null;
    if (roadZ !== null && !nearZebra && rnd() < 0.18) items.push({ k: 'tree', x: wx(c + 0.5), z: roadZ, seed: rnd() });
    if (houseZ !== null && !special.has(c) && rnd() < 0.35) {
      items.push({ k: 'moto', x: wx(c + 0.5), z: houseZ, seed: rnd(), rot: rnd() < 0.5 });
    } else if (houseZ !== null && !special.has(c) && rnd() < 0.2) {
      items.push({ k: 'stools', x: wx(c + 0.5), z: houseZ, seed: rnd() });
    }
  }
  return (
    <group>
      {items.map((it, i) => {
        if (it.k === 'tree') return <Tree key={i} x={it.x} z={it.z} s={0.75 + it.seed * 0.35} seed={it.seed} />;
        if (it.k === 'moto')
          return (
            <group key={i} position={[it.x, SW, it.z]} rotation={[0, it.rot ? Math.PI : 0, 0]} scale={0.95}>
              <Moto color={['#c0392b', '#1d1d1f', '#e8e8e8', '#1f5fbf', '#7a3fa0'][Math.floor(it.seed * 5)]} seed={it.seed} rider={false} />
            </group>
          );
        return <Stools key={i} x={it.x} z={it.z} seed={it.seed} />;
      })}
    </group>
  );
}

// ghế nhựa đỏ + bàn thấp của quán cà phê vỉa hè
function Stools({ x, z, seed }) {
  const col = seed < 0.5 ? '#d62b2b' : '#2a63c7';
  const m = mat(col, { roughness: 0.5 });
  const pos = [[-0.45, 0], [0.45, 0.05], [0, 0.4]];
  return (
    <group position={[x, SW, z]}>
      <Box s={[0.45, 0.4, 0.45]} p={[0, 0.2, 0]} m={mat('#3a7bd5', { roughness: 0.5 })} cast />
      {pos.map(([dx, dz], i) => (
        <Box key={i} s={[0.28, 0.26, 0.28]} p={[dx, 0.13, dz]} m={m} cast />
      ))}
      <Box s={[0.12, 0.1, 0.12]} p={[0.1, 0.45, 0.05]} m={mat('#3b2316')} />
    </group>
  );
}

// ---------- biển báo 423 cho đường không có đèn ----------
export function CrossingSign({ x, z, faceZ }) {
  const tex = useMemo(() => crossingSignTexture(), []);
  return (
    <group position={[x, SW, z]} rotation={[0, faceZ > 0 ? 0 : Math.PI, 0]}>
      <mesh geometry={cylGeo(0.04, 0.04, 2.6, 8)} position={[0, 1.3, 0]} material={mat('#9aa0a6', { metalness: 0.6, roughness: 0.4 })} castShadow />
      <mesh position={[0, 2.55, 0.05]}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshStandardMaterial map={tex} />
      </mesh>
      <Box s={[0.6, 0.6, 0.03]} p={[0, 2.55, 0.02]} m={mat('#9aa0a6')} />
    </group>
  );
}

export function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[600, 600]} />
      <meshStandardMaterial color="#7d7a70" roughness={1} />
    </mesh>
  );
}

export { sphereGeo };
