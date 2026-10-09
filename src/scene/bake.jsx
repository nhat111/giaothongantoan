// Gộp nhiều khối nhỏ thành vài khối lớn để giảm số lệnh vẽ (draw call) của GPU.
// Điện thoại nóng máy chủ yếu vì phải vẽ hàng nghìn khối riêng lẻ mỗi khung hình;
// sau khi gộp, cả con phố chỉ còn vài chục lệnh vẽ.
//
// <Baked> vẽ các con bên trong như bình thường một lần, rồi gộp mọi mesh tĩnh thành
// mesh lớn (theo vật liệu) và ẩn các mesh gốc. Mesh nào cần chuyển động riêng thì
// đánh dấu userData.noBake (hoặc nằm trong group có userData.noBake).

import { useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const vcMaterials = {
  matte: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 }),
  shiny: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0.45 }),
  vehicle: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.25 })
};

const tmpColor = new THREE.Color();

function prepare(geo, matrix, color, keepUv) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.applyMatrix4(matrix);
  const keep = keepUv ? ['position', 'normal', 'uv'] : ['position', 'normal'];
  for (const name of Object.keys(g.attributes)) if (!keep.includes(name)) g.deleteAttribute(name);
  if (!g.attributes.normal) g.computeVertexNormals();
  if (keepUv && !g.attributes.uv) return null;
  g.morphAttributes = {};
  if (color) {
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = color.r;
      arr[i * 3 + 1] = color.g;
      arr[i * 3 + 2] = color.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  }
  g.clearGroups();
  return g;
}

function skipped(o, root) {
  for (let p = o; p && p !== root; p = p.parent) if (p.userData?.noBake) return true;
  return false;
}

// Gộp mọi mesh con của root, trả về danh sách mesh mới (toạ độ theo root)
export function bakeObject(root, { single = false } = {}) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map();
  const baked = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.visible) return;
    if (Array.isArray(o.material) || skipped(o, root)) return;
    // bỏ qua mesh nằm trong group đang bị ẩn
    for (let p = o.parent; p && p !== root; p = p.parent) if (!p.visible) return;
    const m = o.material;
    const rel = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    const emissive = m.emissive && m.emissiveIntensity > 0 && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.01;
    let key, mat, color = null, keepUv = false;
    // gộp gọn (xe cộ): đèn xe phát sáng cũng gộp vào khối màu chung, chỉ giữ riêng thứ có texture / trong suốt
    const simple = single && !m.map && !m.transparent && m.color;
    if (!simple && (m.map || m.transparent || emissive || !m.color || m.type === 'MeshBasicMaterial' || m.side !== THREE.FrontSide)) {
      // các vật liệu trông giống nhau (cùng texture, cùng màu, cùng thông số) gộp chung
      key = [
        'm', m.type, m.map?.uuid, m.emissiveMap?.uuid, m.color?.getHexString(), m.emissive?.getHexString(),
        m.emissiveIntensity, m.transparent, m.opacity, m.side, m.roughness, m.metalness, m.toneMapped, m.depthWrite
      ].join('|');
      mat = m;
      keepUv = !!m.map || !!m.emissiveMap;
    } else {
      const shiny = single || (m.metalness ?? 0) > 0.3 || (m.roughness ?? 1) < 0.3;
      key = single ? 'vc:vehicle' : shiny ? 'vc:shiny' : 'vc:matte';
      mat = single ? vcMaterials.vehicle : shiny ? vcMaterials.shiny : vcMaterials.matte;
      color = tmpColor.copy(m.color).clone();
      // phần phát sáng (đèn) thì lấy màu sáng của đèn
      if (emissive) color.copy(m.emissive).multiplyScalar(Math.min(2.5, 1 + m.emissiveIntensity));
    }
    const g = prepare(o.geometry, rel, color, keepUv);
    if (!g) return;
    if (!groups.has(key)) groups.set(key, { mat, geos: [], cast: false, receive: false });
    const gr = groups.get(key);
    gr.geos.push(g);
    gr.cast ||= o.castShadow;
    gr.receive ||= o.receiveShadow;
    baked.push(o);
  });
  const out = [];
  for (const [key, gr] of groups) {
    const merged = mergeGeometries(gr.geos, false);
    gr.geos.forEach((g) => g.dispose());
    if (!merged) continue;
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, gr.mat);
    mesh.castShadow = gr.cast;
    mesh.receiveShadow = gr.receive || key.startsWith('vc:');
    mesh.userData.bakedKey = key;
    out.push(mesh);
  }
  return { meshes: out, baked };
}

// Gộp một cây con tĩnh (con phố, dãy nhà...)
export function Baked({ children, onBaked }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const { meshes, baked } = bakeObject(root);
    baked.forEach((o) => (o.visible = false));
    meshes.forEach((m) => root.add(m));
    onBaked?.(meshes);
    return () => {
      meshes.forEach((m) => {
        root.remove(m);
        m.geometry.dispose();
      });
      baked.forEach((o) => (o.visible = true));
    };
    // chỉ gộp một lần khi gắn vào cảnh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <group ref={ref}>{children}</group>;
}

// Gộp theo mẫu dùng chung: lần đầu dựng mô hình rồi gộp và lưu lại; các lần sau chỉ dùng lại
// hình đã gộp (xe cộ cùng loại, cùng màu).
const modelCache = new Map();
export function BakedModel({ cacheKey, children }) {
  const [cached, setCached] = useState(() => modelCache.get(cacheKey) || null);
  const ref = useRef();
  useLayoutEffect(() => {
    if (cached || !ref.current) return;
    const { meshes } = bakeObject(ref.current, { single: true });
    const entry = meshes.map((m) => ({ geometry: m.geometry, material: m.material, cast: m.castShadow, receive: m.receiveShadow }));
    modelCache.set(cacheKey, entry);
    setCached(entry);
  }, [cached, cacheKey]);
  if (cached)
    return (
      <group>
        {cached.map((c, i) => (
          <mesh key={i} geometry={c.geometry} material={c.material} castShadow={c.cast} receiveShadow={c.receive} />
        ))}
      </group>
    );
  return (
    <group ref={ref} visible={true}>
      {children}
    </group>
  );
}
