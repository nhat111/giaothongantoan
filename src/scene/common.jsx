import * as THREE from 'three';
import { TILE } from '../game/engine.js';

export const SW = 0.16; // chiều cao vỉa hè (mét)

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts, (k, v) => (v && v.isTexture ? v.uuid : v));
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...opts });
  matCache.set(key, m);
  return m;
}

// toạ độ: cột c -> trục x, hàng r -> trục z (hàng 0 ở phía bắc = -z)
export function makeCoords(engine) {
  const { COLS, ROWS } = engine;
  return {
    wx: (c) => (c - COLS / 2) * TILE,
    wz: (r) => (r - ROWS / 2) * TILE
  };
}

export function tileHeight(t) {
  return t === 'r' || t === 'z' ? 0 : SW;
}

const geoCache = new Map();
export function boxGeo(w, h, d) {
  const key = `b${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.BoxGeometry(w, h, d));
  return geoCache.get(key);
}
export function cylGeo(rt, rb, h, seg = 12) {
  const key = `c${rt}_${rb}_${h}_${seg}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.CylinderGeometry(rt, rb, h, seg));
  return geoCache.get(key);
}
export function sphereGeo(r, w = 16, h = 12) {
  const key = `s${r}_${w}_${h}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.SphereGeometry(r, w, h));
  return geoCache.get(key);
}

// Hộp đơn giản: <Box s={[w,h,d]} p={[x,y,z]} m={material} />
export function Box({ s, p = [0, 0, 0], r, m, cast = false, receive = false, ...rest }) {
  return (
    <mesh geometry={boxGeo(...s)} position={p} rotation={r} material={m} castShadow={cast} receiveShadow={receive} {...rest} />
  );
}
