import { forwardRef, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { mat, Box, cylGeo, sphereGeo } from './common.jsx';
import { mulberry32, textTexture } from './textures.js';

const SKIN = ['#e9b98f', '#d9a27a', '#c98d63', '#f0c8a2'];
const SHIRTS = ['#f2f2f2', '#2f6db5', '#8a1f2b', '#3e7d4f', '#e8d7b0', '#e36a8f', '#5a5f66', '#a7c7e7'];
const HELMETS = ['#d62b2b', '#f2f2f2', '#1d1d1f', '#f2c230', '#1f5fbf', '#e36a8f', '#2a8f7f'];

const glass = () => mat('#22303b', { roughness: 0.15, metalness: 0.4 });
const tire = () => mat('#151515', { roughness: 0.9 });
const chrome = () => mat('#c9ccd1', { roughness: 0.25, metalness: 0.9 });

export const Wheel = forwardRef(function Wheel({ r, w, p }, ref) {
  return (
    <group position={p} ref={ref}>
      <mesh geometry={cylGeo(r, r, w, 16)} rotation={[Math.PI / 2, 0, 0]} material={tire()} castShadow />
      <mesh geometry={cylGeo(r * 0.55, r * 0.55, w + 0.01, 10)} rotation={[Math.PI / 2, 0, 0]} material={chrome()} />
    </group>
  );
});

function Rider({ rnd, x = -0.12, y = 0, child = false }) {
  const s = child ? 0.75 : 1;
  const shirt = SHIRTS[Math.floor(rnd() * SHIRTS.length)];
  const helmet = HELMETS[Math.floor(rnd() * HELMETS.length)];
  const skin = SKIN[Math.floor(rnd() * SKIN.length)];
  const pants = rnd() < 0.5 ? '#2b3445' : '#4a4038';
  return (
    <group position={[x, y, 0]} scale={s}>
      {/* đùi + cẳng chân */}
      <Box s={[0.42, 0.14, 0.34]} p={[0.12, 0.88, 0]} m={mat(pants)} />
      <Box s={[0.12, 0.42, 0.12]} p={[0.3, 0.64, 0.12]} m={mat(pants)} />
      <Box s={[0.12, 0.42, 0.12]} p={[0.3, 0.64, -0.12]} m={mat(pants)} />
      {/* thân */}
      <Box s={[0.26, 0.56, 0.4]} p={[-0.02, 1.2, 0]} r={[0, 0, -0.12]} m={mat(shirt)} cast />
      {/* tay */}
      <Box s={[0.5, 0.1, 0.1]} p={[0.22, 1.28, 0.2]} r={[0, 0, -0.35]} m={mat(shirt)} />
      <Box s={[0.5, 0.1, 0.1]} p={[0.22, 1.28, -0.2]} r={[0, 0, -0.35]} m={mat(shirt)} />
      {/* đầu + mũ bảo hiểm */}
      <mesh geometry={sphereGeo(0.12)} position={[0.02, 1.6, 0]} material={mat(skin)} />
      <mesh geometry={sphereGeo(0.15, 16, 8)} position={[0.0, 1.64, 0]} scale={[1.05, 0.9, 1]} material={mat(helmet, { roughness: 0.35 })} castShadow />
      <Box s={[0.04, 0.05, 0.22]} p={[0.15, 1.6, 0]} m={glass()} />
    </group>
  );
}

// Xe tay ga / xe số. Hướng đầu xe về +x, dài ~1.95m.
export function Moto({ color, seed, rider = true, wheelRefs }) {
  const rnd = useMemo(() => mulberry32(Math.floor(seed * 1e6)), [seed]);
  const parts = useMemo(() => {
    const r = mulberry32(Math.floor(seed * 1e6) + 5);
    return { passenger: r() < 0.3, childPassenger: r() < 0.5, scooter: r() < 0.6 };
  }, [seed]);
  const body = mat(color, { roughness: 0.35, metalness: 0.3 });
  return (
    <group>
      <Wheel r={0.27} w={0.1} p={[0.66, 0.27, 0]} ref={wheelRefs?.[0]} />
      <Wheel r={0.27} w={0.1} p={[-0.66, 0.27, 0]} ref={wheelRefs?.[1]} />
      <Box s={[1.15, 0.32, 0.34]} p={[-0.1, 0.55, 0]} m={body} cast />
      {parts.scooter ? (
        <Box s={[0.16, 0.7, 0.42]} p={[0.55, 0.78, 0]} r={[0, 0, -0.25]} m={body} cast />
      ) : (
        <Box s={[0.5, 0.22, 0.28]} p={[0.25, 0.78, 0]} m={body} cast />
      )}
      <Box s={[0.55, 0.06, 0.38]} p={[0.12, 0.42, 0]} m={mat('#262626')} />
      <Box s={[0.72, 0.12, 0.3]} p={[-0.22, 0.78, 0]} m={mat('#181818', { roughness: 0.6 })} />
      <Box s={[0.06, 0.06, 0.66]} p={[0.62, 1.12, 0]} m={chrome()} />
      <Box s={[0.05, 0.05, 0.1]} p={[0.76, 0.98, 0]} m={mat('#fffbe0', { emissive: '#fff3b0', emissiveIntensity: 1.2 })} />
      <Box s={[0.04, 0.06, 0.14]} p={[-0.72, 0.72, 0]} m={mat('#ff3030', { emissive: '#a00000', emissiveIntensity: 0.8 })} />
      {/* hộp gương */}
      <Box s={[0.03, 0.18, 0.03]} p={[0.6, 1.24, 0.27]} m={chrome()} />
      <Box s={[0.03, 0.18, 0.03]} p={[0.6, 1.24, -0.27]} m={chrome()} />
      {rider && <Rider rnd={rnd} x={-0.1} />}
      {rider && parts.passenger && <Rider rnd={rnd} x={-0.52} y={parts.childPassenger ? 0.15 : 0} child={parts.childPassenger} />}
    </group>
  );
}

// Ô tô con, dài ~4.5m
export function Car({ color, seed, wheelRefs }) {
  const body = mat(color, { roughness: 0.3, metalness: 0.5 });
  const taxi = useMemo(() => mulberry32(Math.floor(seed * 1e6))() < 0.25, [seed]);
  return (
    <group>
      <RoundedBox args={[4.4, 0.78, 1.78]} radius={0.16} smoothness={3} position={[0, 0.62, 0]} material={body} castShadow />
      <RoundedBox args={[2.3, 0.62, 1.6]} radius={0.14} smoothness={3} position={[-0.25, 1.28, 0]} material={glass()} castShadow />
      <Box s={[2.0, 0.06, 1.5]} p={[-0.3, 1.6, 0]} m={body} />
      {taxi && <Box s={[0.5, 0.18, 0.3]} p={[-0.3, 1.72, 0]} m={mat('#fff6a8', { emissive: '#d9c74a', emissiveIntensity: 0.4 })} />}
      {[[1.4, 0.82], [1.4, -0.82], [-1.4, 0.82], [-1.4, -0.82]].map(([x, z], i) => (
        <Wheel key={i} r={0.33} w={0.22} p={[x, 0.33, z]} ref={wheelRefs?.[i]} />
      ))}
      <Box s={[0.05, 0.14, 0.36]} p={[2.2, 0.78, 0.6]} m={mat('#fffbe8', { emissive: '#fff6c8', emissiveIntensity: 1 })} />
      <Box s={[0.05, 0.14, 0.36]} p={[2.2, 0.78, -0.6]} m={mat('#fffbe8', { emissive: '#fff6c8', emissiveIntensity: 1 })} />
      <Box s={[0.05, 0.14, 0.36]} p={[-2.2, 0.82, 0.6]} m={mat('#ff2a2a', { emissive: '#900', emissiveIntensity: 0.8 })} />
      <Box s={[0.05, 0.14, 0.36]} p={[-2.2, 0.82, -0.6]} m={mat('#ff2a2a', { emissive: '#900', emissiveIntensity: 0.8 })} />
      <Box s={[0.06, 0.16, 0.5]} p={[2.21, 0.5, 0]} m={mat('#d8d8d8')} />
    </group>
  );
}

// Xe buýt, dài ~11m
export function Bus({ color, wheelRefs }) {
  const body = mat(color, { roughness: 0.45, metalness: 0.2 });
  const dest = useMemo(
    () => mat('#111', { map: textTexture('busdest', 'SỐ 05  CHỢ HÀN - LIÊN CHIỂU', { w: 1024, h: 96, bg: '#111', fg: '#ffb020', font: 56 }), emissive: '#ffffff', emissiveIntensity: 0.25 }),
    []
  );
  return (
    <group>
      <RoundedBox args={[11, 2.7, 2.5]} radius={0.2} smoothness={3} position={[0, 1.75, 0]} material={body} castShadow />
      <Box s={[9.4, 1.0, 2.52]} p={[-0.5, 2.25, 0]} m={glass()} />
      <Box s={[0.05, 1.3, 2.2]} p={[5.51, 2.2, 0]} m={glass()} />
      <Box s={[0.04, 0.3, 1.8]} p={[5.53, 2.95, 0]} m={dest} r={[0, Math.PI / 2, 0]} />
      <Box s={[11.02, 0.18, 2.52]} p={[0, 1.15, 0]} m={mat('#ffffff')} />
      {[[3.8, 1.1], [3.8, -1.1], [-2.6, 1.1], [-2.6, -1.1], [-3.8, 1.1], [-3.8, -1.1]].map(([x, z], i) => (
        <Wheel key={i} r={0.5} w={0.3} p={[x, 0.5, z]} ref={wheelRefs?.[i]} />
      ))}
      <Box s={[0.05, 0.2, 0.4]} p={[5.52, 0.8, 0.85]} m={mat('#fffbe8', { emissive: '#fff6c8', emissiveIntensity: 1 })} />
      <Box s={[0.05, 0.2, 0.4]} p={[5.52, 0.8, -0.85]} m={mat('#fffbe8', { emissive: '#fff6c8', emissiveIntensity: 1 })} />
    </group>
  );
}

// Bé học sinh: áo trắng, quần xanh, khăn quàng đỏ, cặp sách. Mặt hướng về +z.
export const Kid = forwardRef(function Kid({ legs, arms, head }, ref) {
  const skin = mat('#f0c39b');
  const shirt = mat('#fbfbf8');
  const pants = mat('#1f2f5c');
  const red = mat('#d81e1e', { roughness: 0.6 });
  return (
    <group ref={ref}>
      {/* chân */}
      {[-0.08, 0.08].map((x, i) => (
        <group key={i} position={[x, 0.6, 0]} ref={legs[i]}>
          <Box s={[0.12, 0.16, 0.13]} p={[0, -0.06, 0]} m={pants} cast />
          <Box s={[0.1, 0.36, 0.1]} p={[0, -0.32, 0]} m={skin} cast />
          <Box s={[0.12, 0.08, 0.2]} p={[0, -0.54, 0.03]} m={mat('#f2f2f2')} cast />
        </group>
      ))}
      <Box s={[0.3, 0.16, 0.18]} p={[0, 0.62, 0]} m={pants} cast />
      {/* thân */}
      <Box s={[0.32, 0.38, 0.2]} p={[0, 0.88, 0]} m={shirt} cast />
      {/* khăn quàng đỏ */}
      <mesh position={[0, 1.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.09, 0.025, 6, 14]} />
        <primitive object={red} attach="material" />
      </mesh>
      <Box s={[0.05, 0.16, 0.03]} p={[-0.03, 0.97, 0.11]} r={[0, 0, 0.25]} m={red} />
      <Box s={[0.05, 0.16, 0.03]} p={[0.03, 0.97, 0.11]} r={[0, 0, -0.25]} m={red} />
      {/* tay */}
      {[-0.21, 0.21].map((x, i) => (
        <group key={i} position={[x, 1.03, 0]} ref={arms[i]}>
          <Box s={[0.1, 0.16, 0.11]} p={[0, -0.06, 0]} m={shirt} cast />
          <Box s={[0.08, 0.24, 0.08]} p={[0, -0.25, 0]} m={skin} cast />
        </group>
      ))}
      {/* cặp sách */}
      <RoundedBox args={[0.3, 0.36, 0.15]} radius={0.04} smoothness={2} position={[0, 0.9, -0.17]} material={mat('#2f6fd6', { roughness: 0.6 })} castShadow />
      <Box s={[0.22, 0.12, 0.03]} p={[0, 0.82, -0.255]} m={mat('#f2c230')} />
      {/* đầu */}
      <group position={[0, 1.24, 0]} ref={head}>
        <mesh geometry={sphereGeo(0.15)} material={skin} castShadow />
        <mesh geometry={sphereGeo(0.158)} position={[0, 0.03, -0.025]} scale={[1, 0.92, 1]} material={mat('#2a1d14', { roughness: 0.9 })} />
        <mesh geometry={sphereGeo(0.02, 8, 6)} position={[-0.05, 0.0, 0.135]} material={mat('#111')} />
        <mesh geometry={sphereGeo(0.02, 8, 6)} position={[0.05, 0.0, 0.135]} material={mat('#111')} />
      </group>
    </group>
  );
});

export function useWheelSpin() {
  return useMemo(() => Array.from({ length: 6 }, () => ({ current: null })), []);
}

export const tmpV = new THREE.Vector3();
