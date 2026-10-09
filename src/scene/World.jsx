import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { useGame } from '../ui/store.js';
import { BuildingRow } from './Buildings.jsx';
import { Road, Sidewalk, Planter, PowerLine, SidewalkProps, CrossingSign, Ground } from './Street.jsx';
import { Vehicles, Signals, KidActor, CameraRig, Sun, GoalMarker, FlashTile } from './Dynamic.jsx';
import { makeCoords } from './common.jsx';
import { Baked } from './bake.jsx';
import { QUALITY } from '../quality.js';
import { BikeActor, ParkedCars } from './BikeScene.jsx';
import { ParentActor, BusStop, EventProps } from './EventScene.jsx';

function EngineDriver({ engine }) {
  useFrame((_, dt) => engine.update(Math.min(dt, 0.05)));
  return null;
}

function StaticWorld({ engine }) {
  const { wx, wz } = makeCoords(engine);
  const rows = engine.grid.map((row, r) => ({ r, kind: row.some((t) => t === 'r' || t === 'z') ? 'road' : row[0] === 'B' ? 'B' : row.includes('p') ? 'p' : '.' }));
  return (
    <Baked>
      <Ground />
      {engine.roads.map((road) => (
        <Road key={'road' + road.index} engine={engine} road={road} />
      ))}
      {rows.map(({ r, kind }) => {
        if (kind === 'B') return <BuildingRow key={r} engine={engine} row={r} />;
        if (kind === 'p')
          return (
            <group key={r}>
              <Sidewalk engine={engine} row={r} />
              <Planter engine={engine} row={r} />
            </group>
          );
        if (kind === '.') {
          const roadAbove = rows[r - 1]?.kind === 'road';
          const roadBelow = rows[r + 1]?.kind === 'road';
          return (
            <group key={r}>
              <Sidewalk engine={engine} row={r} />
              <SidewalkProps engine={engine} row={r} />
              {/* cột điện chỉ dựng ở vỉa hè phía xa (bài đi bộ) để không che tầm nhìn của camera */}
              {(roadBelow || (roadAbove && engine.bike)) && <PowerLine engine={engine} row={r} side={roadAbove ? wz(r) + 0.35 : wz(r + 1) - 0.35} />}
            </group>
          );
        }
        return null;
      })}
      {engine.roads
        .filter((road) => !road.signaled && road.zc >= 0)
        .map((road) => (
          <group key={'sign' + road.index}>
            <CrossingSign x={wx(road.zc) - 0.4} z={wz(road.rows[1] + 1) + 0.45} faceZ={1} />
            <CrossingSign x={wx(road.zc + 1) + 0.4} z={wz(road.rows[0]) - 0.45} faceZ={-1} />
          </group>
        ))}
    </Baked>
  );
}

export function World({ engine }) {
  const levelVersion = useGame((s) => s.levelVersion);
  return (
    <>
      <EngineDriver engine={engine} />
      {QUALITY.sky ? (
        <Sky sunPosition={[60, 45, 30]} turbidity={5} rayleigh={1.0} mieCoefficient={0.005} mieDirectionalG={0.85} />
      ) : (
        <color attach="background" args={['#bcd8ee']} />
      )}
      <fog attach="fog" args={['#cfe0ec', 38, 120]} />
      {/* ánh sáng buổi sáng: trời xanh nhạt, mặt đất ấm; không có bóng thật thì tăng ánh sáng trời cho đỡ phẳng */}
      <hemisphereLight args={['#d8eaff', '#9c8366', QUALITY.shadows ? 0.95 : 1.25]} />
      <ambientLight intensity={0.12} />
      <group key={levelVersion}>
        <Sun engine={engine} />
        <StaticWorld engine={engine} />
        <Signals engine={engine} />
        <Vehicles engine={engine} />
        {engine.bike ? (
          <>
            <BikeActor engine={engine} />
            <ParkedCars engine={engine} />
          </>
        ) : (
          <KidActor engine={engine} />
        )}
        {engine.parent && <ParentActor engine={engine} />}
        {engine.bus && <BusStop engine={engine} />}
        {engine.events.length > 0 && <EventProps engine={engine} />}
        <GoalMarker engine={engine} />
        <FlashTile engine={engine} />
        <CameraRig engine={engine} />
      </group>
    </>
  );
}
