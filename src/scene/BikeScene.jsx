import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TILE } from '../game/engine.js';
import { LOOKBACK_TIME } from '../game/bike.js';
import { SW, makeCoords } from './common.jsx';
import { Bicycle, Car, Kid, useWheelSpin } from './Models.jsx';

// lệch ngang (mét) so với tim làn: sát lề = +0.85, giữa làn = -0.15
export const EDGE_OFF = 0.85;
export const CENTER_OFF = -0.15;

export function bikeLateral(b) {
  return EDGE_OFF + (CENTER_OFF - EDGE_OFF) * b.latPos;
}

// mức quay đầu nhìn phía sau (0 = nhìn thẳng, 1 = nhìn hẳn ra sau)
export function lookBackAmount(engine) {
  const b = engine.bike;
  const t = engine.time - b.lookStart;
  if (t < 0 || t > LOOKBACK_TIME) return 0;
  const s = (x) => x * x * (3 - 2 * x);
  if (t < 0.35) return s(t / 0.35);
  if (t < 1.35) return 1;
  return 1 - s(Math.min(1, (t - 1.35) / 0.45));
}

// vị trí + hướng của xe đạp trong thế giới (kể cả lúc đang rẽ vào cổng)
export function bikePose(engine) {
  const { wx, wz } = makeCoords(engine);
  const b = engine.bike;
  const roadX = wx(b.x), roadZ = wz(b.row + 0.5) + bikeLateral(b);
  if (!b.turning) return { x: roadX, y: 0, z: roadZ, yaw: 0 };
  const t = b.turnT ?? 0;
  const e = t * t * (3 - 2 * t);
  const gx = wx(engine.goal.c + 0.5), gz = wz(engine.goal.r + 0.5);
  // đường cong bậc hai: từ vị trí trên đường -> góc rẽ -> trong cổng
  const p1x = Math.max(roadX, gx), p1z = roadZ;
  const u = 1 - e;
  const x = u * u * roadX + 2 * u * e * p1x + e * e * gx;
  const z = u * u * roadZ + 2 * u * e * p1z + e * e * gz;
  return { x, y: SW * Math.min(1, Math.max(0, (z - roadZ - 0.5) / 0.5)), z, yaw: -Math.PI / 2 * e };
}

export function BikeActor({ engine }) {
  const group = useRef();
  const rider = useRef();
  const wheels = useWheelSpin();
  const crank = useRef();
  const legs = [useRef(), useRef()];
  const arms = [useRef(), useRef()];
  const head = useRef();
  const [helmet, setHelmet] = useState(!!engine.bike.helmet);
  useFrame(() => {
    const b = engine.bike;
    if (!!b.helmet !== helmet) setHelmet(!!b.helmet);
    const g = group.current;
    if (!g) return;
    const p = bikePose(engine);
    g.position.set(p.x, p.y, p.z);
    g.rotation.y = p.yaw;
    // nghiêng nhẹ khi chuyển làn
    g.rotation.x = (b.lat - b.latPos) * 0.25;
    const ang = (b.dist * TILE) / 0.33;
    wheels.forEach((w) => w.current && (w.current.rotation.z = -ang));
    const crankAng = -ang * 0.45;
    if (crank.current) crank.current.rotation.z = crankAng;
    legs.forEach((l, i) => {
      if (!l.current) return;
      const ph = crankAng + (i ? Math.PI : 0);
      l.current.rotation.x = -1.05 + Math.sin(ph) * 0.4;
    });
    const signalling = engine.time < b.signalUntil && !b.turning;
    arms.forEach((a, i) => {
      if (!a.current) return;
      if (i === 0 && signalling) {
        a.current.rotation.set(0, 0, -Math.PI / 2);
      } else a.current.rotation.set(-1.15, 0, 0);
    });
    const lb = lookBackAmount(engine);
    if (head.current) head.current.rotation.y = lb * 1.9;
    if (rider.current) rider.current.visible = lb < 0.35;
  });
  return (
    <group ref={group}>
      <Bicycle wheelRefs={wheels} crankRef={crank} />
      <group ref={rider} position={[-0.14, 0.18, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Kid legs={legs} arms={arms} head={head} helmet={helmet} />
      </group>
    </group>
  );
}

export function ParkedCars({ engine }) {
  const { wx, wz } = makeCoords(engine);
  const b = engine.bike;
  return b.parked.map((p, i) => (
    <group key={i} position={[wx(p.x + p.len / 2), 0, wz(b.row + 0.5) + 0.62]}>
      <Car color={p.color} seed={0.9 + i * 0.01} />
      {/* đèn cảnh báo nhấp nháy */}
      <Hazard />
    </group>
  ));
}

function Hazard() {
  const mats = useRef(new THREE.MeshStandardMaterial({ color: '#7a4a00', emissive: '#ffa000', emissiveIntensity: 0 }));
  useFrame((s) => {
    mats.current.emissiveIntensity = Math.floor(s.clock.elapsedTime * 2) % 2 ? 2 : 0;
  });
  return [0.6, -0.6].flatMap((z) => [2.21, -2.21].map((x) => (
    <mesh key={x + '' + z} position={[x, 0.66, z * 1.25]} material={mats.current}>
      <boxGeometry args={[0.06, 0.08, 0.12]} />
    </mesh>
  )));
}

// Camera xe đạp: đuổi theo phía sau bên trái, hoặc nhìn qua vai khi quan sát phía sau.
export function bikeCamera(engine, out) {
  const p = bikePose(engine);
  const lb = lookBackAmount(engine);
  const turning = !!engine.bike.turning;
  if (lb > 0.02) {
    const fwd = new THREE.Vector3(1, -0.05, 0);
    const backDir = new THREE.Vector3(-0.93, -0.06, -0.36);
    const dir = fwd.lerp(backDir, lb).normalize();
    out.pos.set(p.x - 0.1, 1.62, p.z);
    out.target.set(p.x + dir.x * 10, 1.62 + dir.y * 10, p.z + dir.z * 10);
    out.rate = 10;
    return;
  }
  if (turning) {
    out.pos.set(p.x - 3.5, 4.6, p.z - 4.5);
    out.target.set(p.x + 0.5, 0.6, p.z + 1.5);
    out.rate = 3;
    return;
  }
  out.pos.set(p.x - 6.2, 3.7, p.z - 1.9);
  out.target.set(p.x + 5, 0.7, p.z + 0.2);
  out.rate = 4;
}
