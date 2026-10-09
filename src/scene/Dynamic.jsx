import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TILE, LOOK_TIME } from '../game/engine.js';
import { mat, Box, cylGeo, sphereGeo, SW, makeCoords, tileHeight } from './common.jsx';
import { makePedSignalCanvas } from './textures.js';
import { Moto, Car, Bus, Kid, useWheelSpin } from './Models.jsx';
import { bikeCamera, bikePose } from './BikeScene.jsx';
import { BakedModel } from './bake.jsx';
import { BlobShadow } from './Models.jsx';
import { QUALITY } from '../quality.js';

// ---------- xe cộ ----------
function Vehicle({ engine, v }) {
  const ref = useRef();
  const { wx, wz } = makeCoords(engine);
  const lane = v.lane;
  // Bài xe đạp: xe trong làn của bé chạy lệch về phía tim đường để vượt bé an toàn,
  // và lách thêm ra khi đi ngang xe đang đỗ.
  const bikeLane = engine.bike && engine.bike.lane === lane;
  const lateral = bikeLane ? (v.type === 'moto' ? -0.35 - v.seed * 0.3 : -0.45) : v.type === 'moto' ? (v.seed - 0.5) * 1.0 : 0;
  const z = wz(lane.row + 0.5) + lateral;
  const dodge = useRef(0);
  const q = Math.floor(v.seed * 6) / 6 + 0.01; // gom biến thể để dùng lại hình đã gộp
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const x = engine.vx(lane, v) + v.len / 2;
    let want = 0;
    if (bikeLane && engine.bike) {
      const nearParked = engine.bike.parked.some((p) => x + v.len / 2 > p.x - 0.8 && x - v.len / 2 < p.x + p.len + 0.3);
      if (nearParked) want = v.type === 'moto' ? -0.35 : -0.75;
    }
    dodge.current += (want - dodge.current) * Math.min(1, dt * 4);
    g.position.set(wx(x), 0, z + dodge.current);

  });
  return (
    <group ref={ref} rotation={[0, lane.dir === 1 ? 0 : Math.PI, 0]}>
      {/* mỗi loại xe + màu được gộp thành 1-2 khối và dùng chung, nhẹ cho GPU */}
      <BakedModel cacheKey={v.type + ':' + v.color + ':' + q}>
        {v.type === 'moto' && <Moto color={v.color} seed={q} />}
        {v.type === 'car' && <Car color={v.color} seed={q} />}
        {v.type === 'bus' && <Bus color={v.color} />}
        <BlobShadow w={v.len * TILE * 0.95} d={v.type === 'moto' ? 0.8 : v.type === 'car' ? 2.0 : 2.7} />
      </BakedModel>
    </group>
  );
}

export function Vehicles({ engine }) {
  const [list, setList] = useState(() => engine.allVehicles());
  const ver = useRef(engine.vehVersion);
  useFrame(() => {
    if (engine.vehVersion !== ver.current) {
      ver.current = engine.vehVersion;
      setList(engine.allVehicles());
    }
  });
  return list.map((v) => <Vehicle key={v.id} engine={engine} v={v} />);
}

// ---------- đèn tín hiệu ----------
function PedSignal({ engine, road, x, z, faceZ }) {
  const sig = useMemo(() => makePedSignalCanvas(), []);
  useFrame(() => {
    const st = engine.lightState(road);
    sig.draw(st.ped, st.count, Math.floor(engine.time * 3) % 2 === 0);
  });
  const metal = mat('#6c7278', { metalness: 0.6, roughness: 0.4 });
  return (
    <group position={[x, SW, z]} rotation={[0, faceZ > 0 ? 0 : Math.PI, 0]}>
      <mesh geometry={cylGeo(0.07, 0.08, 3.2, 10)} position={[0, 1.6, 0]} material={metal} castShadow />
      <group position={[0, 2.75, 0.12]}>
        <Box s={[0.46, 0.68, 0.2]} m={mat('#1d2125', { metalness: 0.4 })} cast />
        <mesh position={[0, 0, 0.101]}>
          <planeGeometry args={[0.4, 0.62]} />
          <meshStandardMaterial map={sig.tex} emissiveMap={sig.tex} emissive="#ffffff" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function CarSignal({ engine, road, x, z, faceX }) {
  const lamps = useMemo(
    () => ({
      red: new THREE.MeshStandardMaterial({ color: '#3a0d0d', emissive: '#ff2a1a', emissiveIntensity: 0 }),
      yellow: new THREE.MeshStandardMaterial({ color: '#3a300d', emissive: '#ffb31a', emissiveIntensity: 0 }),
      green: new THREE.MeshStandardMaterial({ color: '#0d3a1a', emissive: '#1aff6a', emissiveIntensity: 0 })
    }),
    []
  );
  useFrame(() => {
    const st = engine.lightState(road).car;
    Object.entries(lamps).forEach(([k, m]) => (m.emissiveIntensity = k === st ? 2.4 : 0));
  });
  const metal = mat('#6c7278', { metalness: 0.6, roughness: 0.4 });
  return (
    <group position={[x, SW, z]} rotation={[0, faceX > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
      <mesh geometry={cylGeo(0.09, 0.11, 4.6, 10)} position={[0, 2.3, 0]} material={metal} castShadow />
      <group position={[0, 4.1, 0.15]}>
        <Box s={[0.38, 1.05, 0.25]} m={mat('#1d2125', { metalness: 0.4 })} cast />
        {['red', 'yellow', 'green'].map((k, i) => (
          <mesh key={k} geometry={sphereGeo(0.12, 14, 10)} position={[0, 0.32 - i * 0.32, 0.1]} material={lamps[k]} />
        ))}
      </group>
    </group>
  );
}

export function Signals({ engine }) {
  const { wx, wz } = makeCoords(engine);
  return engine.roads
    .filter((r) => r.signaled)
    .map((road, i) => {
      const zN = wz(road.rows[0]) - 0.55; // vỉa hè phía bắc, sát mép
      const zS = wz(road.rows[1] + 1) + 0.55;
      return (
        <group key={i}>
          {/* đèn người đi bộ đặt ở bên kia đường, nhìn về phía người đang chờ */}
          <PedSignal engine={engine} road={road} x={wx(road.zc + 1) + 0.35} z={zS} faceZ={-1} />
          <PedSignal engine={engine} road={road} x={wx(road.zc) - 0.35} z={zN} faceZ={1} />
          {/* đèn cho xe: làn dưới chạy sang phải (+x), làn trên chạy sang trái (-x) */}
          <CarSignal engine={engine} road={road} x={wx(road.zc) - 1.0} z={zS} faceX={-1} />
          <CarSignal engine={engine} road={road} x={wx(road.zc + 1) + 1.0} z={zN} faceX={1} />
        </group>
      );
    });
}

// ---------- bé ----------
const ease = (t) => t * t * (3 - 2 * t);

export function KidActor({ engine }) {
  const group = useRef();
  const legs = [useRef(), useRef()];
  const arms = [useRef(), useRef()];
  const head = useRef();
  const yaw = useRef(engine.kid.yaw);
  const { wx, wz } = makeCoords(engine);
  useFrame(() => {
    const k = engine.kid;
    const g = group.current;
    if (!g) return;
    const e = ease(k.t);
    const c = k.pc + (k.c - k.pc) * e;
    const r = k.pr + (k.r - k.pr) * e;
    const h0 = tileHeight(engine.tile(k.pc, k.pr));
    const h1 = tileHeight(engine.tile(k.c, k.r));
    let x = wx(c + 0.5);
    const since = engine.time - (k.shake ?? -9);
    if (since < 0.5) x += Math.sin(since * 45) * 0.08 * (1 - since / 0.5);
    g.position.set(x, h0 + (h1 - h0) * e, wz(r + 0.5));
    let d = k.yaw - yaw.current;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    yaw.current += d * 0.25;
    g.rotation.y = yaw.current;
    const moving = k.t < 1;
    const ph = k.walk * 15;
    const amp = moving ? 0.6 : 0;
    legs.forEach((l, i) => l.current && (l.current.rotation.x += ((i ? -1 : 1) * Math.sin(ph) * amp - l.current.rotation.x) * 0.4));
    arms.forEach((a, i) => a.current && (a.current.rotation.x += ((i ? 1 : -1) * Math.sin(ph) * amp * 0.8 - a.current.rotation.x) * 0.4));
    // quay đầu khi quan sát (nhìn từ góc thứ ba khi camera chưa vào góc mắt)
    const lv = engine.lookView;
    let hy = 0;
    if (lv) {
      const lt = engine.time - lv.start;
      if (lt < LOOK_TIME) hy = lookYaw(lt);
    }
    if (head.current) head.current.rotation.y += (hy - head.current.rotation.y) * 0.3;
    g.visible = !(lv && engine.time - lv.start < LOOK_TIME - 0.3);
  });
  return (
    <group>
      <Kid ref={group} legs={legs} arms={arms} head={head} />
      <BlobFollow target={group} />
    </group>
  );
}

// góc quay đầu (radian, dương = sang trái) theo thời gian quan sát
export function lookYaw(t) {
  const L = 1.25;
  const k = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));
  if (t < 0.5) return L * ease(k(0, 0.5, t));
  if (t < 1.2) return L;
  if (t < 1.8) return L - 2 * L * ease(k(1.2, 1.8, t));
  if (t < 2.6) return -L;
  return -L + L * ease(k(2.6, 3.1, t));
}

// ---------- camera ----------
export function CameraRig({ engine }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3());
  const pos = useRef(new THREE.Vector3());
  const first = useRef(true);
  const { wx, wz } = makeCoords(engine);
  useFrame((_, dt) => {
    const k = engine.kid;
    const e = ease(k.t);
    const c = k.pc + (k.c - k.pc) * e;
    const r = k.pr + (k.r - k.pr) * e;
    const px = wx(c + 0.5), pz = wz(r + 0.5);
    const py = tileHeight(engine.tile(k.c, k.r));
    // điện thoại cầm dọc: mở rộng góc nhìn để thấy hai bên đường
    const wantFov = size.width < size.height * 0.9 ? 66 : 50;
    if (Math.abs(camera.fov - wantFov) > 0.1) {
      camera.fov = wantFov;
      camera.updateProjectionMatrix();
    }
    let camPos, target, rate = 3.5;
    if (engine.bike) {
      const out = { pos: new THREE.Vector3(), target: new THREE.Vector3(), rate: 4 };
      bikeCamera(engine, out);
      if (first.current) {
        pos.current.copy(out.pos);
        look.current.copy(out.target);
        first.current = false;
      }
      const f = 1 - Math.exp(-dt * out.rate);
      pos.current.lerp(out.pos, f);
      look.current.lerp(out.target, f);
      camera.position.copy(pos.current);
      camera.lookAt(look.current);
      return;
    }
    const lv = engine.lookView;
    const lt = lv ? engine.time - lv.start : 99;
    if (lv && lt < LOOK_TIME) {
      // góc nhìn của bé: quay trái, rồi quay phải
      const fz = lv.fz;
      const a = lookYaw(lt);
      // hướng trước mặt (0,0,fz); bên trái = (fz,0,0) với giao thông bên phải
      const dirX = Math.sin(a) * fz;
      const dirZ = Math.cos(a) * fz;
      camPos = new THREE.Vector3(px - 0 * dirX, py + 1.2, pz - fz * 0.05);
      target = new THREE.Vector3(px + dirX * 10, py + 1.0, pz + dirZ * 10);
      rate = 9;
    } else {
      // góc nhìn thứ ba: phía sau - trên cao, hướng về phía đường cần đi
      const back = engine.kid.r > engine.goal.r ? 1 : -1;
      // màn hình dọc (điện thoại): lùi xa và cao hơn để thấy cả con đường phía trước
      const portrait = size.width < size.height * 0.9;
      camPos = portrait ? new THREE.Vector3(px, py + 13, pz + back * 9.5) : new THREE.Vector3(px, py + 11, pz + back * 9.2);
      target = portrait ? new THREE.Vector3(px, py + 0.2, pz - back * 4.8) : new THREE.Vector3(px, py + 0.4, pz - back * 3.6);
    }
    if (first.current) {
      pos.current.copy(camPos);
      look.current.copy(target);
      first.current = false;
    }
    const f = 1 - Math.exp(-dt * rate);
    pos.current.lerp(camPos, f);
    look.current.lerp(target, f);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  });
  useEffect(() => {
    first.current = true;
  }, [engine.levelVersion]);
  return null;
}

// ---------- mặt trời bám theo bé để bóng đổ luôn sắc nét quanh bé ----------
export function Sun({ engine }) {
  const light = useRef();
  const { scene } = useThree();
  const target = useMemo(() => new THREE.Object3D(), []);
  const { wx, wz } = makeCoords(engine);
  useEffect(() => {
    scene.add(target);
    return () => scene.remove(target);
  }, [scene, target]);
  useFrame(() => {
    const k = engine.kid;
    let x = wx(k.c + 0.5), z = wz(k.r + 0.5);
    if (engine.bike) {
      const p = bikePose(engine);
      x = p.x + 8;
      z = p.z;
    }
    target.position.set(x, 0, z);
    if (light.current) {
      light.current.position.set(x + 18, 32, z + 12);
      light.current.target = target;
    }
  });
  return (
    <directionalLight
      ref={light}
      intensity={QUALITY.shadows ? 2.5 : 2.1}
      color="#ffe8c2"
      castShadow={QUALITY.shadows}
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-34}
      shadow-camera-right={34}
      shadow-camera-top={34}
      shadow-camera-bottom={-34}
      shadow-camera-near={1}
      shadow-camera-far={90}
      shadow-bias={-0.0004}
      shadow-normalBias={0.03}
    />
  );
}

// ---------- đích + ô báo lỗi ----------
export function GoalMarker({ engine }) {
  const ring = useRef();
  const arrow = useRef();
  const { wx, wz } = makeCoords(engine);
  let x = wx(engine.goal.c + 0.5), z = wz(engine.goal.r + 0.5);
  if (engine.bike && !engine.bike.turn) z = wz(engine.bike.row + 0.5) + 0.85; // dừng xe sát lề trước cổng
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (ring.current) ring.current.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
    if (arrow.current) {
      arrow.current.position.y = 3.0 + Math.sin(t * 2.5) * 0.2;
      arrow.current.rotation.y = t;
    }
  });
  return (
    <group position={[x, 0.12, z]}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.95, 40]} />
        <meshBasicMaterial color="#ffd23f" transparent opacity={0.85} toneMapped={false} />
      </mesh>
      <mesh ref={arrow} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.32, 0.6, 4]} />
        <meshStandardMaterial color="#ffd23f" emissive="#ffb000" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

export function FlashTile({ engine }) {
  const ref = useRef();
  const until = useRef(0);
  const { wx, wz } = makeCoords(engine);
  useEffect(
    () =>
      engine.on((type, p) => {
        if (type !== 'flash' || !ref.current) return;
        ref.current.position.set(wx(p.c + 0.5), 0.03, wz(p.r + 0.5));
        until.current = engine.time + 1;
      }),
    [engine, wx, wz]
  );
  useFrame(() => {
    if (!ref.current) return;
    const left = until.current - engine.time;
    ref.current.visible = left > 0;
    ref.current.material.opacity = Math.max(0, left) * 0.55;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <planeGeometry args={[TILE * 0.95, TILE * 0.95]} />
      <meshBasicMaterial color="#ff2d2d" transparent opacity={0.5} depthWrite={false} />
    </mesh>
  );
}

// bóng mềm bám theo một nhân vật (đặt ngoài nhân vật để không bị ẩn cùng khi camera nhìn qua mắt bé)
export function BlobFollow({ target, size = 0.7 }) {
  const ref = useRef();
  useFrame(() => {
    const t = target.current;
    if (!t || !ref.current) return;
    ref.current.position.set(t.position.x, t.position.y, t.position.z);
  });
  return (
    <group ref={ref}>
      <BlobShadow w={size} d={size} />
    </group>
  );
}
