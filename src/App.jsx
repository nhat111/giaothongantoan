import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { engine } from './game/engine.js';
import { World } from './scene/World.jsx';
import { TopBar, Toast, Controls, Overlay, VoiceHint } from './ui/Hud.jsx';
import './ui/store.js';

export default function App() {
  return (
    <div className="app">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 55, near: 0.1, far: 400, position: [0, 8, 20] }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      >
        <Suspense fallback={null}>
          <World engine={engine} />
        </Suspense>
      </Canvas>
      <TopBar />
      <Toast />
      <Controls />
      <Overlay />
      <VoiceHint />
    </div>
  );
}
