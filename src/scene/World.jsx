import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { useGame } from '../ui/store.js';
import { BuildingRow } from './Buildings.jsx';
import { Road, Sidewalk, Planter, PowerLine, SidewalkProps, CrossingSign, Ground } from './Street.jsx';
import { Vehicles, Signals, KidActor, CameraRig, Sun, GoalMarker, FlashTile } from './Dynamic.jsx';
import { makeCoords } from './common.jsx';
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
    <group>
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
              {(roadAbove || roadBelow) && <PowerLine engine={engine} row={r} side={roadAbove ? wz(r) + 0.35 : wz(r + 1) - 0.35} />}
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
    </group>
  );
}

export function World({ engine }) {
  const levelVersion = useGame((s) => s.levelVersion);
  return (
    <>
      <EngineDriver engine={engine} />
      <Sky sunPosition={[60, 45, 30]} turbidity={6} rayleigh={1.2} mieCoefficient={0.006} mieDirectionalG={0.85} />
      <fog attach="fog" args={['#cfdbe2', 40, 135]} />
      <hemisphereLight args={['#dbe9ff', '#7a6e5c', 0.9]} />
      <ambientLight intensity={0.15} />
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
