import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { TILE, EXT } from '../game/engine.js';
import { mat, Box, cylGeo, SW, makeCoords } from './common.jsx';
import { mulberry32, plasterTexture, signTexture, textTexture, flagTexture } from './textures.js';
import { Baked } from './bake.jsx';

const WALLS = ['#f3e3b3', '#e9c46a', '#f4f1de', '#cfe3d4', '#f2cfc2', '#d9e4f2', '#f7d9a0', '#e8e1d0', '#c9d8b6', '#f0b8a0', '#ffffff', '#d7c4e8'];
const AWNINGS = ['#1f5fbf', '#d62b2b', '#2a8f7f', '#f2a20c', '#6b3fa0'];
const FLOOR_H = 3.3;
const DEPTH = 14;

const ROOFS = ['#b5452f', '#a3402a', '#c0563a', '#3c6fb0', '#5c7f9a', '#8a8f94'];

// Mái dốc hai bên (nóc chạy song song mặt đường)
function Roof({ w, depth, wallH, color, z0 = 0 }) {
  const pitch = 0.42;
  const half = depth / 2 + 0.3;
  const slope = half / Math.cos(pitch);
  const rise = Math.tan(pitch) * half;
  const m = mat(color, { roughness: 0.75 });
  const zc = z0 - depth / 2;
  return (
    <group>
      <Box s={[w + 0.3, 0.08, slope]} p={[0, wallH + rise / 2, zc + half / 2]} r={[pitch, 0, 0]} m={m} cast receive />
      <Box s={[w + 0.3, 0.08, slope]} p={[0, wallH + rise / 2, zc - half / 2]} r={[-pitch, 0, 0]} m={m} cast receive />
      <Box s={[w + 0.32, 0.14, 0.2]} p={[0, wallH + rise + 0.02, zc]} m={mat(color === '#3c6fb0' || color === '#5c7f9a' || color === '#8a8f94' ? '#6f7478' : '#7f2f1f')} />
      {/* đầu hồi */}
      <mesh position={[w / 2 - 0.02, wallH, zc]} rotation={[0, Math.PI / 2, 0]}>
        <shapeGeometry args={[gable(half, rise)]} />
        <meshStandardMaterial color="#e8dfcc" side={2} />
      </mesh>
      <mesh position={[-w / 2 + 0.02, wallH, zc]} rotation={[0, Math.PI / 2, 0]}>
        <shapeGeometry args={[gable(half, rise)]} />
        <meshStandardMaterial color="#e8dfcc" side={2} />
      </mesh>
    </group>
  );
}
const gableCache = new Map();
function gable(half, rise) {
  const k = half.toFixed(2) + ':' + rise.toFixed(2);
  if (!gableCache.has(k)) {
    const sh = new THREE.Shape();
    sh.moveTo(-half + 0.3, 0);
    sh.lineTo(half - 0.3, 0);
    sh.lineTo(0, rise - 0.1);
    sh.closePath();
    gableCache.set(k, sh);
  }
  return gableCache.get(k);
}

// Nhà cấp 4 mái ngói / mái tôn (dãy nhà phía camera)
function LowHouse({ h }) {
  const wallH = 3.1;
  const depth = 9;
  const wall = mat(h.color, { map: plasterTexture(), roughness: 0.9 });
  return (
    <group position={[h.x, 0, 0]}>
      <Box s={[h.w - 0.1, wallH, depth]} p={[0, wallH / 2, -depth / 2]} m={wall} cast receive />
      <Box s={[1.1, 2.2, 0.06]} p={[-h.w * 0.18, 1.1 + SW, 0.02]} m={mat(h.door)} />
      <Box s={[1.0, 0.9, 0.05]} p={[h.w * 0.22, 1.7, 0.02]} m={mat('#33495a', { roughness: 0.2, metalness: 0.4 })} />
      <Box s={[1.1, 0.06, 0.12]} p={[h.w * 0.22, 2.2, 0.05]} m={mat('#e8e4da')} />
      <Roof w={h.w - 0.1} depth={depth} wallH={wallH} color={h.roof} />
      {h.tank && (
        <mesh geometry={cylGeo(0.45, 0.45, 1.3, 14)} position={[h.w * 0.2, wallH + 1.9, -6]} rotation={[0, 0, Math.PI / 2]} material={mat('#d7dbe0', { metalness: 0.9, roughness: 0.25 })} castShadow />
      )}
      {h.plant && (
        <group position={[h.w / 2 - 0.5, SW, 0.45]}>
          <mesh geometry={cylGeo(0.22, 0.17, 0.4, 10)} position={[0, 0.2, 0]} material={mat('#a0522d')} />
          <mesh position={[0, 0.65, 0]}>
            <icosahedronGeometry args={[0.38, 1]} />
            <meshStandardMaterial color="#4c8a3a" roughness={1} />
          </mesh>
        </group>
      )}
      {h.clothes && (
        <group position={[0, 2.5, -depth - 0.5]}>
          {[-0.9, -0.3, 0.3, 0.9].map((dx, k) => (
            <Box key={k} s={[0.4, 0.55, 0.02]} p={[dx, 0, 0]} m={mat(['#e36a8f', '#f2f2f2', '#2f6db5', '#f2c230'][k])} />
          ))}
        </group>
      )}
    </group>
  );
}

// Nhà của bé ở dãy phía camera: cổng + sân trước, nhà lùi vào trong để không che bé
function HomeYard({ x, w }) {
  const wall = mat('#f4d58d', { map: plasterTexture(), roughness: 0.9 });
  const fence = mat('#f2e6c8');
  const label = useMemo(() => textTexture('home', 'NHÀ BÉ AN', { w: 512, h: 128, bg: '#2f6fd6', fg: '#ffffff', font: 60 }), []);
  const yard = 3.4;
  const gateW = 1.8;
  return (
    <group position={[x, 0, 0]}>
      <Box s={[w, SW, yard]} p={[0, SW / 2, -yard / 2]} m={mat('#cfc6b6', { roughness: 0.7 })} receive />
      {[-1, 1].map((sg) => (
        <group key={sg}>
          <Box s={[(w - gateW) / 2, 1.0, 0.18]} p={[sg * (gateW / 2 + (w - gateW) / 4), 0.5 + SW, -0.1]} m={fence} cast />
          <Box s={[0.3, 1.8, 0.3]} p={[sg * (gateW / 2 + 0.15), 0.9 + SW, -0.1]} m={mat('#e9dcb8')} cast />
        </group>
      ))}
      <Box s={[0.18, 1.0, yard]} p={[-w / 2 + 0.09, 0.5 + SW, -yard / 2]} m={fence} />
      <Box s={[0.18, 1.0, yard]} p={[w / 2 - 0.09, 0.5 + SW, -yard / 2]} m={fence} />
      {/* chậu cây trong sân */}
      {[-1, 1].map((sg) => (
        <group key={'p' + sg} position={[sg * (w / 2 - 0.6), SW, -yard + 0.6]}>
          <mesh geometry={cylGeo(0.25, 0.2, 0.45, 10)} position={[0, 0.22, 0]} material={mat('#a0522d')} />
          <mesh position={[0, 0.75, 0]}>
            <icosahedronGeometry args={[0.42, 1]} />
            <meshStandardMaterial color={sg > 0 ? '#c2185b' : '#4c8a3a'} roughness={1} />
          </mesh>
        </group>
      ))}
      <group position={[0, 0, -yard]}>
        <Box s={[w, 3.1, 9]} p={[0, 1.55, -4.5]} m={wall} cast receive />
        <Box s={[1.4, 2.3, 0.06]} p={[0, 1.15 + SW, 0.02]} m={mat('#7a4b2a')} />
        <mesh position={[0, 2.75, 0.04]}>
          <planeGeometry args={[1.8, 0.45]} />
          <meshStandardMaterial map={label} />
        </mesh>
        <Roof w={w} depth={9} wallH={3.1} color="#b5452f" />
      </group>
    </group>
  );
}

// Một căn nhà ống. Gốc toạ độ: giữa mặt tiền, mặt tiền nhìn về +z, nhà kéo dài về -z.
function ShopHouse({ h }) {
  const plaster = plasterTexture();
  const wall = mat(h.color, { map: plaster, roughness: 0.9 });
  const height = h.floors * FLOOR_H;
  const w = h.w;
  const glassM = mat('#33495a', { roughness: 0.15, metalness: 0.5 });
  const rail = mat(h.railColor, { roughness: 0.5, metalness: 0.5 });
  const dark = mat('#1d1a18', { roughness: 1 });
  const sign = h.sign >= 0 ? signTexture(h.sign) : null;
  return (
    <group position={[h.x, 0, 0]}>
      {/* khối nhà */}
      <Box s={[w - 0.08, height, DEPTH]} p={[0, height / 2, -DEPTH / 2]} m={wall} cast receive />
      {/* tầng trệt: cửa hàng mở */}
      {h.open ? (
        <group>
          <Box s={[w * 0.86, 2.35, 0.06]} p={[0, 1.175 + SW, 0.02]} m={dark} />
          {/* kệ hàng bên trong */}
          {[0, 1, 2].map((i) => (
            <Box key={i} s={[0.5, 0.35, 0.05]} p={[-w * 0.3 + i * w * 0.3, 0.9 + SW + (i % 2) * 0.5, 0.06]} m={mat(['#e9c46a', '#e76f51', '#2a9d8f'][i])} />
          ))}
          <Box s={[w * 0.6, 0.85, 0.5]} p={[0, 0.42 + SW, 0.3]} m={mat('#8a6a4a')} cast />
        </group>
      ) : (
        <Box s={[w * 0.86, 2.35, 0.06]} p={[0, 1.175 + SW, 0.02]} m={mat('#8e9399', { metalness: 0.6, roughness: 0.45 })} />
      )}
      {/* cửa cuốn đã kéo lên */}
      <Box s={[w * 0.9, 0.22, 0.26]} p={[0, 2.62, 0.13]} m={mat('#7d8288', { metalness: 0.6, roughness: 0.4 })} />
      {/* biển hiệu */}
      {sign && (
        <group position={[0, 3.0, 0.08]}>
          <Box s={[w * 0.94, 0.66, 0.1]} p={[0, 0, -0.06]} m={mat('#333')} />
          <mesh>
            <planeGeometry args={[w * 0.92, 0.6]} />
            <meshStandardMaterial map={sign} roughness={0.5} emissiveMap={sign} emissive="#ffffff" emissiveIntensity={0.12} />
          </mesh>
        </group>
      )}
      {/* mái hiên di động */}
      {h.awning && (
        <Box s={[w * 0.92, 0.04, 1.5]} p={[0, 2.45, 0.75]} r={[0.28, 0, 0]} m={mat(h.awning, { roughness: 0.8 })} cast />
      )}
      {/* các tầng trên */}
      {Array.from({ length: h.floors - 1 }, (_, i) => {
        const y = (i + 1) * FLOOR_H;
        return (
          <group key={i} position={[0, y, 0]}>
            <Box s={[w - 0.1, 0.16, 0.95]} p={[0, 0.08, 0.47]} m={wall} cast />
            <Box s={[w - 0.2, 0.95, 0.04]} p={[0, 0.62, 0.92]} m={rail} />
            <Box s={[w * 0.6, 2.2, 0.06]} p={[0, 1.25, 0.03]} m={glassM} />
            <Box s={[w * 0.64, 0.12, 0.1]} p={[0, 2.4, 0.05]} m={mat('#e8e4da')} />
            {h.ac[i] && <Box s={[0.75, 0.5, 0.3]} p={[w / 2 - 0.55, 2.55, 0.2]} m={mat('#f1f1ee')} cast />}
            {h.plants[i] && (
              <group position={[-w / 2 + 0.5, 0.2, 0.7]}>
                <Box s={[0.35, 0.3, 0.3]} p={[0, 0.15, 0]} m={mat('#a0522d')} />
                <mesh position={[0, 0.55, 0]}>
                  <icosahedronGeometry args={[0.3, 0]} />
                  <meshStandardMaterial color="#3f7a33" flatShading />
                </mesh>
              </group>
            )}
            {h.clothes[i] && (
              <group position={[0, 1.9, 0.75]}>
                {[-0.6, -0.2, 0.25, 0.6].map((dx, k) => (
                  <Box key={k} s={[0.3, 0.45, 0.02]} p={[dx, 0, 0]} m={mat(['#e36a8f', '#f2f2f2', '#2f6db5', '#f2c230'][k])} />
                ))}
              </group>
            )}
          </group>
        );
      })}
      {/* lan can mái */}
      <Box s={[w - 0.06, 0.7, 0.18]} p={[0, height + 0.35, -0.05]} m={wall} cast />
      {/* bồn nước inox trên mái */}
      {h.tank && (
        <group position={[w * 0.15, height + 0.8, -2.5]}>
          <mesh geometry={cylGeo(0.5, 0.5, 1.5, 16)} rotation={[0, 0, Math.PI / 2]} material={mat('#d7dbe0', { metalness: 0.9, roughness: 0.25 })} castShadow />
          <Box s={[1.4, 0.3, 0.8]} p={[0, -0.55, 0]} m={mat('#55595e', { metalness: 0.5 })} />
        </group>
      )}
      {h.roof && (
        <Box s={[w - 0.1, 0.06, 5]} p={[0, height + 1.4, -6]} r={[0.25, 0, 0]} m={mat(h.roof, { metalness: 0.4, roughness: 0.6 })} cast />
      )}
    </group>
  );
}

// Nhà của bé: tầng trệt mở, bé đứng trong phòng khách nhìn ra đường.
function HomeHouse({ x, w }) {
  const wall = mat('#f4d58d', { map: plasterTexture(), roughness: 0.9 });
  const floors = 3;
  const height = floors * FLOOR_H;
  const label = useMemo(() => textTexture('home', 'NHÀ BÉ AN', { w: 512, h: 128, bg: '#2f6fd6', fg: '#ffffff', font: 60 }), []);
  return (
    <group position={[x, 0, 0]}>
      {/* sàn gạch hoa */}
      <Box s={[w - 0.2, SW, 5]} p={[0, SW / 2, -2.5]} m={mat('#d8cfc0', { roughness: 0.6 })} receive />
      <Box s={[0.2, 3.2, 5]} p={[-w / 2 + 0.1, 1.6, -2.5]} m={wall} cast />
      <Box s={[0.2, 3.2, 5]} p={[w / 2 - 0.1, 1.6, -2.5]} m={wall} cast />
      <Box s={[w, 3.2, 0.2]} p={[0, 1.6, -5]} m={wall} />
      <Box s={[w, height - 3.2, DEPTH]} p={[0, 3.2 + (height - 3.2) / 2, -DEPTH / 2]} m={wall} cast />
      <Box s={[w, 3.2, DEPTH - 5]} p={[0, 1.6, -5 - (DEPTH - 5) / 2]} m={wall} />
      {/* bàn ghế phòng khách */}
      <Box s={[1.2, 0.45, 0.6]} p={[-0.4, 0.45, -3.6]} m={mat('#7a4b2a')} cast />
      <Box s={[1.6, 0.5, 0.5]} p={[-0.4, 0.4, -4.55]} m={mat('#5a3a22')} cast />
      {/* bàn thờ / tủ */}
      <Box s={[0.9, 1.6, 0.4]} p={[w / 2 - 0.7, 0.95, -4.6]} m={mat('#8b2e1f')} />
      {/* cửa sắt xếp đã mở */}
      <Box s={[0.25, 2.9, 0.08]} p={[-w / 2 + 0.35, 1.45 + SW, 0.05]} m={mat('#3c4a5a', { metalness: 0.6 })} />
      <Box s={[0.25, 2.9, 0.08]} p={[w / 2 - 0.35, 1.45 + SW, 0.05]} m={mat('#3c4a5a', { metalness: 0.6 })} />
      <group position={[0, 3.6, 0.22]}>
        <mesh>
          <planeGeometry args={[2.2, 0.55]} />
          <meshStandardMaterial map={label} />
        </mesh>
      </group>
      {Array.from({ length: floors - 1 }, (_, i) => (
        <group key={i} position={[0, (i + 1) * FLOOR_H, 0]}>
          <Box s={[w - 0.1, 0.16, 0.95]} p={[0, 0.08, 0.47]} m={wall} cast />
          <Box s={[w - 0.2, 0.95, 0.04]} p={[0, 0.62, 0.92]} m={mat('#ffffff')} />
          <Box s={[w * 0.6, 2.2, 0.06]} p={[0, 1.25, 0.03]} m={mat('#33495a', { roughness: 0.15, metalness: 0.5 })} />
          <group position={[w / 2 - 0.6, 0.2, 0.6]}>
            <mesh position={[0, 0.5, 0]}>
              <icosahedronGeometry args={[0.35, 0]} />
              <meshStandardMaterial color="#c2185b" flatShading />
            </mesh>
          </group>
        </group>
      ))}
      <Box s={[w - 0.06, 0.7, 0.18]} p={[0, height + 0.35, -0.05]} m={wall} cast />
      <group position={[0, height + 0.8, -2.5]}>
        <mesh geometry={cylGeo(0.5, 0.5, 1.5, 16)} rotation={[0, 0, Math.PI / 2]} material={mat('#d7dbe0', { metalness: 0.9, roughness: 0.25 })} castShadow />
      </group>
    </group>
  );
}

// Trường tiểu học: tường rào, cổng có bảng tên, sân trường, dãy lớp học 3 tầng màu vàng, cột cờ.
function School({ x, w }) {
  const sign = useMemo(
    () => textTexture('schoolsign', 'TRƯỜNG TIỂU HỌC HÒA BÌNH', { w: 1024, h: 180, bg: '#b3121b', fg: '#ffe14d', font: 70, sub: 'Dạy tốt - Học tốt' }),
    []
  );
  const flag = useMemo(() => flagTexture(), []);
  const flagRef = useRef();
  useFrame((s) => {
    if (flagRef.current) flagRef.current.rotation.y = Math.sin(s.clock.elapsedTime * 2) * 0.12;
  });
  const fence = mat('#f2e6c8', { roughness: 0.8 });
  const yellow = mat('#f3c845', { map: plasterTexture(), roughness: 0.85 });
  const gateW = TILE;
  const side = (w - gateW) / 2;
  const bldgZ = -9;
  return (
    <group position={[x, 0, 0]}>
      {/* sân trường */}
      <Box s={[w, 0.1, 10]} p={[0, 0.05, -5]} m={mat('#c8c2b4', { roughness: 0.95 })} receive />
      {/* tường rào 2 bên cổng */}
      {[-1, 1].map((sgn) => (
        <group key={sgn} position={[sgn * (gateW / 2 + side / 2), 0, -0.15]}>
          <Box s={[side, 0.8, 0.3]} p={[0, 0.4, 0]} m={fence} cast />
          {Array.from({ length: Math.floor(side / 0.25) }, (_, i) => (
            <Box key={i} s={[0.05, 1.1, 0.05]} p={[-side / 2 + 0.15 + i * 0.25, 1.35, 0]} m={mat('#2f6e3b', { metalness: 0.5 })} />
          ))}
          <Box s={[side, 0.06, 0.08]} p={[0, 1.88, 0]} m={mat('#2f6e3b', { metalness: 0.5 })} />
        </group>
      ))}
      {/* cổng */}
      {[-1, 1].map((sgn) => (
        <Box key={sgn} s={[0.5, 3.6, 0.5]} p={[sgn * (gateW / 2 + 0.25), 1.8, -0.15]} m={mat('#e9dcb8')} cast />
      ))}
      <group position={[0, 4.0, -0.15]}>
        <Box s={[gateW + 1.6, 0.9, 0.3]} m={mat('#8e0f15')} cast />
        <mesh position={[0, 0, 0.16]}>
          <planeGeometry args={[gateW + 1.5, 0.8]} />
          <meshStandardMaterial map={sign} />
        </mesh>
      </group>
      {/* dãy lớp học */}
      <group position={[0, 0, bldgZ]}>
        <Box s={[w + 4, 10, 6]} p={[0, 5, -3]} m={yellow} cast receive />
        {[0, 1, 2].map((f) => (
          <group key={f} position={[0, f * 3.3, 0]}>
            <Box s={[w + 4, 0.2, 2]} p={[0, 0.1 + (f ? 0 : 0.0), 1]} m={mat('#e9e2cf')} receive />
            {f > 0 && <Box s={[w + 4, 1.0, 0.1]} p={[0, 0.6, 1.95]} m={mat('#f7f1e1')} />}
            {Array.from({ length: Math.floor((w + 4) / 3) }, (_, i) => (
              <group key={i} position={[-(w + 4) / 2 + 1.5 + i * 3, 0, 0.02]}>
                <Box s={[1.4, 1.5, 0.05]} p={[0, 1.9, 0]} m={mat('#3d5a6c', { roughness: 0.2, metalness: 0.4 })} />
                <Box s={[0.9, 2.3, 0.05]} p={[1.0, 1.25, 0]} m={mat('#2f6e3b')} />
              </group>
            ))}
            {/* cột hành lang */}
            {Array.from({ length: Math.floor((w + 4) / 3) + 1 }, (_, i) => (
              <Box key={'c' + i} s={[0.3, 3.3, 0.3]} p={[-(w + 4) / 2 + i * 3, 1.65, 1.85]} m={yellow} cast />
            ))}
          </group>
        ))}
        {/* mái ngói */}
        <Box s={[w + 4.6, 0.25, 8.5]} p={[0, 10.2, -2]} m={mat('#a3402a', { roughness: 0.8 })} cast />
      </group>
      {/* cột cờ */}
      <group position={[-w / 2 + 2, 0, -5]}>
        <mesh geometry={cylGeo(0.06, 0.08, 9, 8)} position={[0, 4.5, 0]} material={mat('#d6d6d6', { metalness: 0.8, roughness: 0.3 })} castShadow />
        <group ref={flagRef} position={[0, 8.2, 0]} userData={{ noBake: true }}>
          <mesh position={[0.75, 0, 0]}>
            <planeGeometry args={[1.5, 1.0]} />
            <meshStandardMaterial map={flag} side={2} />
          </mesh>
        </group>
        <Box s={[1.4, 0.4, 1.4]} p={[0, 0.2, 0]} m={mat('#e9dcb8')} />
      </group>
      {/* cây phượng trong sân */}
      <group position={[w / 2 - 2.5, 0, -5]}>
        <mesh geometry={cylGeo(0.18, 0.3, 3.6, 8)} position={[0, 1.8, 0]} material={mat('#5b4636')} castShadow />
        {[[0, 4, 0, 1.8], [1.4, 3.8, 0.6, 1.3], [-1.3, 3.9, -0.4, 1.4], [0.3, 4.6, -1, 1.2]].map(([bx, by, bz, r], i) => (
          <mesh key={i} position={[bx, by, bz]} castShadow>
            <icosahedronGeometry args={[r, 1]} />
            <meshStandardMaterial color={i % 2 ? '#d93a22' : '#3f7a33'} flatShading roughness={1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Cả dãy nhà của một hàng 'B'. facing = +1: mặt tiền nhìn về +z (dãy phía bắc), -1: nhìn về -z.
export function BuildingRow({ engine, row }) {
  const { wx, wz } = makeCoords(engine);
  const facing = row === 0 ? 1 : -1;
  // Dãy nhà phía camera (bài đi bộ): nhà cấp 4 mái ngói / mái tôn thấp để không che bé
  const low = facing === -1 && !engine.bike;
  const frontZ = facing === 1 ? wz(row + 1) : wz(row);
  const cells = engine.grid[row];
  const houses = useMemo(() => {
    const rnd = mulberry32(engine.levelIdx * 1000 + row * 17 + 3);
    const xMin = wx(-EXT - 6), xMax = wx(engine.COLS + EXT + 6);
    const specials = [];
    cells.forEach((t, c) => {
      if (t === 'H') specials.push({ kind: 'home', x0: wx(c) - 0.6, x1: wx(c + 1) + 0.6 });
      if (t === 'S') specials.push({ kind: 'school', x0: wx(c - 3), x1: wx(c + 4) });
    });
    const list = [];
    let x = xMin, signIdx = Math.floor(rnd() * 14);
    while (x < xMax) {
      const sp = specials.find((s) => x >= s.x0 - 0.01 && x < s.x1);
      if (sp) {
        list.push({ kind: sp.kind, x: (sp.x0 + sp.x1) / 2, w: sp.x1 - sp.x0 });
        x = sp.x1;
        continue;
      }
      let w = 3.8 + rnd() * 1.9;
      const next = specials.find((s) => s.x0 > x && s.x0 < x + w + 3);
      if (next) w = next.x0 - x < 7 ? next.x0 - x : w;
      const floors = 2 + Math.floor(rnd() * 4);
      if (low) {
        list.push({
          kind: 'low',
          x: x + w / 2,
          w,
          color: WALLS[Math.floor(rnd() * WALLS.length)],
          roof: ROOFS[Math.floor(rnd() * ROOFS.length)],
          door: rnd() < 0.5 ? '#6b4a2e' : '#3c4a5a',
          tank: rnd() < 0.5,
          plant: rnd() < 0.5,
          clothes: rnd() < 0.3
        });
        x += w;
        continue;
      }
      list.push({
        kind: 'shop',
        x: x + w / 2,
        w,
        floors,
        color: WALLS[Math.floor(rnd() * WALLS.length)],
        sign: rnd() < 0.8 ? signIdx++ : -1,
        open: rnd() < 0.75,
        awning: rnd() < 0.45 ? AWNINGS[Math.floor(rnd() * AWNINGS.length)] : null,
        railColor: rnd() < 0.5 ? '#2d2f33' : '#e9e9e4',
        ac: Array.from({ length: floors }, () => rnd() < 0.4),
        plants: Array.from({ length: floors }, () => rnd() < 0.4),
        clothes: Array.from({ length: floors }, () => rnd() < 0.15),
        tank: rnd() < 0.7,
        roof: rnd() < 0.35 ? (rnd() < 0.5 ? '#3c6fb0' : '#b5452f') : null
      });
      x += w;
    }
    return list;
  }, [engine, row]);

  // Khi camera ở phía sau dãy nhà (dãy nhà nằm giữa camera và bé), hạ thấp dãy nhà
  // xuống còn nền móng để không che bé, giống kiểu "cắt tường" trong game.
  const ref = useRef();
  useFrame((state, dt) => {
    const g = ref.current;
    if (!g || low) return;
    const camZ = state.camera.position.z;
    const behind = facing === -1 ? camZ > frontZ + 0.3 : camZ < frontZ - 0.3;
    const target = behind && state.camera.position.y > 2.5 ? 0.015 : 1;
    g.scale.y += (target - g.scale.y) * (1 - Math.exp(-dt * 10));
  });

  // Lật trục x khi dãy nhà quay mặt về -z để toạ độ x khớp với bản đồ.
  return (
    <group ref={ref} position={[0, 0, frontZ]} rotation={[0, facing === 1 ? 0 : Math.PI, 0]} userData={{ noBake: true }}>
      <Baked>
      {houses.map((h, i) => {
        const lx = facing === 1 ? h.x : -h.x;
        if (h.kind === 'home') return low ? <HomeYard key={i} x={lx} w={h.w} /> : <HomeHouse key={i} x={lx} w={h.w} />;
        if (h.kind === 'low') return <LowHouse key={i} h={{ ...h, x: lx }} />;
        if (h.kind === 'school') return <School key={i} x={lx} w={h.w} />;
        return <ShopHouse key={i} h={{ ...h, x: lx }} />;
      })}
      </Baked>
    </group>
  );
}
