import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { TILE, STEP_TIME } from '../game/engine.js';
import { mat, Box, cylGeo, sphereGeo, SW, makeCoords, tileHeight } from './common.jsx';
import { Kid, Moto, Wheel } from './Models.jsx';
import { textTexture } from './textures.js';

const ease = (t) => t * t * (3 - 2 * t);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// ---------- mẹ của bé (bài mẫu giáo) ----------
export function ParentActor({ engine }) {
  const group = useRef();
  const legs = [useRef(), useRef()];
  const arms = [useRef(), useRef()];
  const head = useRef();
  const yaw = useRef(0);
  const walk = useRef(0);
  const { wx, wz } = makeCoords(engine);
  useFrame((_, dt) => {
    const p = engine.parent;
    const k = engine.kid;
    const g = group.current;
    if (!p || !g) return;
    let x, z, y;
    if (engine.holding) {
      // đi cạnh bé, phía bên trái của bé
      const e = ease(k.t);
      const c = k.pc + (k.c - k.pc) * e, r = k.pr + (k.r - k.pr) * e;
      const ky = k.yaw;
      x = wx(c + 0.5) + Math.cos(ky) * 0.48;
      z = wz(r + 0.5) - Math.sin(ky) * 0.48;
      const h0 = tileHeight(engine.tile(k.pc, k.pr)), h1 = tileHeight(engine.tile(k.c, k.r));
      y = h0 + (h1 - h0) * e;
    } else {
      const e = ease(p.t);
      const c = p.pc + (p.c - p.pc) * e, r = p.pr + (p.r - p.pr) * e;
      x = wx(c + 0.5) - 0.3;
      z = wz(r + 0.5) + 0.3;
      const h0 = tileHeight(engine.tile(p.pc, p.pr)), h1 = tileHeight(engine.tile(p.c, p.r));
      y = h0 + (h1 - h0) * e;
    }
    const moving = (engine.holding ? k.t : p.t) < 1;
    if (moving) walk.current += dt;
    g.position.set(x, y, z);
    let d = k.yaw - yaw.current;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    yaw.current += d * 0.2;
    g.rotation.y = yaw.current;
    const amp = moving ? 0.5 : 0;
    const ph = walk.current * 12;
    legs.forEach((l, i) => l.current && (l.current.rotation.x = (i ? -1 : 1) * Math.sin(ph) * amp));
    if (arms[0].current) arms[0].current.rotation.set(0, 0, engine.holding ? 0.45 : 0);
    if (arms[1].current) arms[1].current.rotation.x = Math.sin(ph) * amp * 0.6;
  });
  return (
    <group ref={group} scale={1.38}>
      <Kid legs={legs} arms={arms} head={head} shirtColor="#c94f7c" pantsColor="#2b2b33" scarf={false} bag={false} nonLa longHair />
    </group>
  );
}

// ---------- trạm xe buýt ----------
export function BusStop({ engine }) {
  const { wx, wz } = makeCoords(engine);
  let start = null;
  engine.grid.forEach((row, r) => row.forEach((t, c) => t === 'A' && (start = { c, r })));
  const sign = useMemo(() => textTexture('busstop', 'TRẠM XE BUÝT', { w: 512, h: 128, bg: '#1559b5', fg: '#fff', font: 56, sub: 'Tuyến 05' }), []);
  if (!start) return null;
  const x = wx(start.c + 0.5);
  const z = wz(start.r + 1) - 0.45; // sát dãy nhà
  const steel = mat('#8e959c', { metalness: 0.7, roughness: 0.35 });
  return (
    <group position={[x, SW, z]}>
      {[-1.1, 1.1].map((dx) => (
        <mesh key={dx} geometry={cylGeo(0.05, 0.05, 2.5, 8)} position={[dx, 1.25, 0]} material={steel} castShadow />
      ))}
      <Box s={[2.8, 0.08, 1.0]} p={[0, 2.5, -0.1]} r={[0.1, 0, 0]} m={mat('#1559b5')} cast />
      <Box s={[2.4, 0.06, 0.4]} p={[0, 0.45, 0.1]} m={mat('#c7cdd3', { metalness: 0.4 })} />
      <Box s={[2.4, 1.3, 0.03]} p={[0, 1.4, 0.35]} m={mat('#bcd7ea', { transparent: true, opacity: 0.35 })} />
      <mesh position={[0, 2.25, -0.55]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.6, 0.4]} />
        <meshStandardMaterial map={sign} />
      </mesh>
    </group>
  );
}

// ---------- xe cứu thương ----------
function Ambulance({ lights }) {
  const white = mat('#f7f7f5', { roughness: 0.35, metalness: 0.2 });
  return (
    <group>
      <RoundedBox args={[5.2, 2.2, 2.0]} radius={0.15} smoothness={3} position={[0, 1.45, 0]} material={white} castShadow />
      <Box s={[5.22, 0.25, 2.02]} p={[0, 1.2, 0]} m={mat('#d62b2b')} />
      <Box s={[0.05, 0.9, 1.7]} p={[2.61, 1.85, 0]} m={mat('#22303b', { roughness: 0.15, metalness: 0.4 })} />
      <Box s={[0.6, 0.6, 0.02]} p={[0, 1.75, 1.01]} m={mat('#d62b2b')} />
      <Box s={[0.2, 0.6, 0.03]} p={[0, 1.75, 1.02]} m={mat('#ffffff')} />
      <Box s={[0.6, 0.2, 0.03]} p={[0, 1.75, 1.02]} m={mat('#ffffff')} />
      <mesh position={[1.6, 2.65, 0.45]} material={lights[0]}>
        <boxGeometry args={[0.5, 0.18, 0.3]} />
      </mesh>
      <mesh position={[1.6, 2.65, -0.45]} material={lights[1]}>
        <boxGeometry args={[0.5, 0.18, 0.3]} />
      </mesh>
      {[[1.7, 0.95], [1.7, -0.95], [-1.7, 0.95], [-1.7, -0.95]].map(([x, z], i) => (
        <Wheel key={i} r={0.38} w={0.25} p={[x, 0.38, z]} />
      ))}
    </group>
  );
}

// ---------- chú chó ----------
function Dog() {
  const fur = mat('#a0682f', { roughness: 0.9 });
  return (
    <group>
      <Box s={[0.6, 0.28, 0.24]} p={[0, 0.42, 0]} m={fur} cast />
      <Box s={[0.26, 0.24, 0.22]} p={[0.36, 0.6, 0]} m={fur} cast />
      <Box s={[0.12, 0.1, 0.12]} p={[0.53, 0.56, 0]} m={mat('#6e4520')} />
      <Box s={[0.05, 0.12, 0.08]} p={[0.36, 0.76, 0.08]} m={mat('#6e4520')} />
      <Box s={[0.05, 0.12, 0.08]} p={[0.36, 0.76, -0.08]} m={mat('#6e4520')} />
      {[[0.2, 0.08], [0.2, -0.08], [-0.2, 0.08], [-0.2, -0.08]].map(([x, z], i) => (
        <Box key={i} s={[0.07, 0.3, 0.07]} p={[x, 0.15, z]} m={fur} />
      ))}
      <Box s={[0.25, 0.05, 0.05]} p={[-0.38, 0.6, 0]} r={[0, 0, 0.6]} m={fur} />
    </group>
  );
}

// ---------- các cảnh của tình huống bất ngờ ----------
export function EventProps({ engine }) {
  const { wx, wz } = makeCoords(engine);
  const refs = { moto: useRef(), friend: useRef(), ball: useRef(), amb: useRef(), dog: useRef() };
  const friendArms = [useRef(), useRef()];
  const friendLegs = [useRef(), useRef()];
  const friendHead = useRef();
  const lights = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: '#400', emissive: '#ff2020', emissiveIntensity: 0 }),
      new THREE.MeshStandardMaterial({ color: '#004', emissive: '#2050ff', emissiveIntensity: 0 })
    ],
    []
  );
  const evs = engine.events;
  const has = (id) => evs.some((e) => e.id === id);
  const get = (id) => evs.find((e) => e.id === id);

  useFrame(() => {
    const A = engine.eventAnim;
    const now = engine.time;
    const since = (id) => (A && A.id === id ? now - A.start : -1);
    const after = (id) => (A && A.id === id && A.resolved != null ? now - A.resolved : -1);

    // xe máy lùi ra từ cổng nhà
    if (refs.moto.current) {
      const e = get('reverse');
      const g = refs.moto.current;
      const t = since('reverse');
      const x = wx(e.from.c + 0.5);
      const zIn = wz(e.from.r) + 1.6, zOut = wz(e.from.r - 1) + 1.3, zRoad = wz(e.from.r - 2) + 1.6;
      if (t < 0 && !e.done) {
        g.position.set(x, SW, zIn);
        g.rotation.y = -Math.PI / 2;
      } else if (t >= 0) {
        const a = after('reverse');
        if (a < 0) {
          g.position.set(x, SW, zIn + (zOut - zIn) * ease(clamp01(t / 1.4)));
          g.rotation.y = -Math.PI / 2;
        } else {
          const u = clamp01(a / 1.2);
          g.position.set(x + Math.max(0, a - 1.2) * 7, u < 1 ? SW * (1 - u) : 0, zOut + (zRoad - zOut) * ease(u));
          g.rotation.y = -Math.PI / 2 + (Math.PI / 2) * ease(u);
        }
      }
      // xe đã chạy đi (tình huống khác đang diễn ra hoặc đã quá lâu) thì ẩn
      g.visible = !(e.done && t < 0) && !(after('reverse') > 6);
    }

    // bạn vẫy tay bên kia đường
    if (refs.friend.current) {
      const w = Math.sin(now * 8) * 0.4;
      if (friendArms[0].current) friendArms[0].current.rotation.set(0, 0, -2.6 + w);
    }

    // quả bóng lăn ra đường
    if (refs.ball.current) {
      const e = get('ball');
      const t = since('ball');
      const b = refs.ball.current;
      const x = wx(e.c + 0.5) + 0.3;
      const z0 = wz(e.r + 0.5), z1 = wz(e.r - 3) + 0.6;
      if (t < 0 && !e.done) b.visible = false;
      else {
        b.visible = true;
        const u = t < 0 ? 1 : clamp01(t / 2.2);
        const z = z0 + (z1 - z0) * (1 - (1 - u) * (1 - u));
        const y = (z < wz(e.r) && z > wz(e.r - 3) ? 0 : SW) + 0.11;
        b.position.set(x, y, z);
        b.rotation.x = -z / 0.11;
      }
    }

    // xe cứu thương chạy qua
    if (refs.amb.current) {
      const t = since('ambulance');
      const g = refs.amb.current;
      const e = get('ambulance');
      const road = engine.roads[e.road || 0];
      if (t < 0 || t > 9) g.visible = false;
      else {
        g.visible = true;
        g.position.set(wx(-6) + t * 14, 0, wz(road.rows[1]));
        const on = Math.floor(now * 6) % 2;
        lights[0].emissiveIntensity = on ? 3 : 0.2;
        lights[1].emissiveIntensity = on ? 0.2 : 3;
      }
    }

    // chú chó chạy ngang đường
    if (refs.dog.current) {
      const e = get('dog');
      const t = since('dog');
      const g = refs.dog.current;
      if (t < 0) g.visible = false;
      else {
        g.visible = t < 5;
        const zStart = wz(engine.bike.row + 1) + 0.8, zEnd = wz(engine.bike.row - 1) - 1;
        const u = clamp01(t / 3.2);
        const stopAt = 0.45; // dừng lại giữa làn trong lúc bé chọn
        const k = A.resolved == null ? Math.min(u, stopAt) : stopAt + (1 - stopAt) * clamp01((now - A.resolved) / 1.4);
        g.position.set(wx(e.at), k < 0.1 ? SW : 0, zStart + (zEnd - zStart) * k);
        g.rotation.y = Math.PI / 2;
        g.position.y += Math.abs(Math.sin(now * 14)) * 0.06;
      }
    }
  });

  const friend = get('friend');
  const puddle = get('puddle');
  return (
    <group>
      {has('reverse') && (
        <group ref={refs.moto}>
          <Moto color="#1f5fbf" seed={0.33} />
        </group>
      )}
      {friend && (
        <group ref={refs.friend} position={[wx(friend.at.c + 0.5), SW, wz(friend.at.r + 0.5)]}>
          <Kid legs={friendLegs} arms={friendArms} head={friendHead} shirtColor="#fbfbf8" pantsColor="#3b2b5c" longHair />
        </group>
      )}
      {has('ball') && (
        <mesh ref={refs.ball} geometry={sphereGeo(0.11, 16, 12)} castShadow>
          <meshStandardMaterial color="#f7f7f7" roughness={0.5} />
        </mesh>
      )}
      {has('ambulance') && (
        <group ref={refs.amb}>
          <Ambulance lights={lights} />
        </group>
      )}
      {has('dog') && (
        <group ref={refs.dog}>
          <Dog />
        </group>
      )}
      {puddle && engine.bike && (
        <group position={[wx(puddle.at), 0.012, wz(engine.bike.row + 0.5) + 0.7]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1.6, 0.9, 1]}>
            <circleGeometry args={[0.55, 24]} />
            <meshStandardMaterial color="#3d4a52" roughness={0.05} metalness={0.6} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.002, 0.05]} scale={[1.2, 0.6, 1]}>
            <circleGeometry args={[0.45, 24]} />
            <meshStandardMaterial color="#7d98a8" roughness={0.02} metalness={0.8} transparent opacity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export { TILE, STEP_TIME };
