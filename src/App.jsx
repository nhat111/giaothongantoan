import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { QUALITY } from './quality.js';
import * as THREE from 'three';
import { engine } from './game/engine.js';
import { World } from './scene/World.jsx';
import { TopBar, Toast, Controls, Overlay, VoiceHint } from './ui/Hud.jsx';
import './ui/store.js';

// Giới hạn số khung hình mỗi giây và dừng vẽ khi trang bị ẩn: máy đỡ nóng, đỡ tốn pin.
function FrameLimiter({ fps }) {
  const invalidate = useThree((st) => st.invalidate);
  useEffect(() => {
    let raf, last = 0;
    const step = 1000 / fps;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      if (now - last >= step - 2) {
        last = now;
        invalidate();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fps, invalidate]);
  return null;
}

export default function App() {
  return (
    <div className="app">
      <Canvas
        shadows={QUALITY.shadows ? 'percentage' : false}
        dpr={QUALITY.dpr}
        frameloop="demand"
        camera={{ fov: 55, near: 0.1, far: 400, position: [0, 8, 20] }}
        gl={{ antialias: QUALITY.antialias, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        onCreated={({ gl, scene }) => { window.__gl = gl; window.__scene = scene; }}
      >
        <Suspense fallback={null}>
          <World engine={engine} />
        </Suspense>
        <FrameLimiter fps={QUALITY.fps} />
      </Canvas>
      <TopBar />
      <Toast />
      <Controls />
      <Overlay />
      <VoiceHint />
    </div>
  );
}
