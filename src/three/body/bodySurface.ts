import * as THREE from 'three';
import type { BodyMeasurements } from '../../models/measurements';
import { bodyHipLineY, bodyTorsoProfile, type RingProfile } from './geometry';

export type BodySurface = {
  geometry: THREE.BufferGeometry;
  signedDistance: (x: number, y: number, z: number) => number;
  bounds: { x: number; y: number; z: number };
};

type Capsule = { ax: number; ay: number; az: number; bx: number; by: number; bz: number; ra: number; rb: number };

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function smoothMin(a: number, b: number, radius: number): number {
  if (radius <= 0) return Math.min(a, b);
  const h = Math.max(radius - Math.abs(a - b), 0) / radius;
  return Math.min(a, b) - h * h * radius * 0.25;
}

function sdEllipsoid(x: number, y: number, z: number, cx: number, cy: number, cz: number, rx: number, ry: number, rz: number): number {
  const px = x - cx; const py = y - cy; const pz = z - cz;
  const k0 = Math.sqrt(px * px / (rx * rx) + py * py / (ry * ry) + pz * pz / (rz * rz));
  const k1 = Math.sqrt(px * px / (rx * rx * rx * rx) + py * py / (ry * ry * ry * ry) + pz * pz / (rz * rz * rz * rz));
  return k1 > 1e-8 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz);
}

function sdCapsule(capsule: Capsule, x: number, y: number, z: number): number {
  const abx = capsule.bx - capsule.ax; const aby = capsule.by - capsule.ay; const abz = capsule.bz - capsule.az;
  const apx = x - capsule.ax; const apy = y - capsule.ay; const apz = z - capsule.az;
  const lengthSquared = abx * abx + aby * aby + abz * abz;
  const t = clamp01((apx * abx + apy * aby + apz * abz) / Math.max(1e-8, lengthSquared));
  const dx = apx - abx * t; const dy = apy - aby * t; const dz = apz - abz * t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (capsule.ra + (capsule.rb - capsule.ra) * t);
}

function sampleSorted(profile: RingProfile[], y: number): { width: number; depth: number; centerZ: number } {
  if (y <= profile[0].y) return { width: profile[0].width, depth: profile[0].depth, centerZ: profile[0].centerZ ?? 0 };
  const last = profile[profile.length - 1];
  if (y >= last.y) return { width: last.width, depth: last.depth, centerZ: last.centerZ ?? 0 };
  let hi = 1;
  while (y > profile[hi].y) hi += 1;
  const lo = hi - 1;
  const t = (y - profile[lo].y) / (profile[hi].y - profile[lo].y);
  const a = profile[Math.max(0, lo - 1)]; const b = profile[lo]; const c = profile[hi]; const d = profile[Math.min(profile.length - 1, hi + 1)];
  const cubic = (key: 'width' | 'depth' | 'centerZ') => {
    const av = key === 'centerZ' ? a.centerZ ?? 0 : a[key];
    const bv = key === 'centerZ' ? b.centerZ ?? 0 : b[key];
    const cv = key === 'centerZ' ? c.centerZ ?? 0 : c[key];
    const dv = key === 'centerZ' ? d.centerZ ?? 0 : d[key];
    return 0.5 * ((2 * bv) + (-av + cv) * t + (2 * av - 5 * bv + 4 * cv - dv) * t * t + (-av + 3 * bv - 3 * cv + dv) * t * t * t);
  };
  return { width: cubic('width'), depth: cubic('depth'), centerZ: cubic('centerZ') };
}

function makeCapsules(body: BodyMeasurements): Capsule[] {
  const h = body.height / 100;
  const arm = body.armLength / 100;
  const shoulderHalf = Math.max(body.shoulder / 200, h * 0.105);
  const hipY = bodyHipLineY(body);
  const legShift = hipY - h * 0.51;
  const thighRadius = THREE.MathUtils.clamp(body.hips / 100 * 0.084, 0.071, 0.105);
  const capsules: Capsule[] = [];
  for (const side of [-1, 1]) {
    const shoulder = { x: side * shoulderHalf * 0.88, y: h * 0.785, z: -h * 0.006 };
    const elbow = { x: side * (shoulderHalf + arm * 0.13), y: h * 0.785 - arm * 0.49, z: h * 0.002 };
    const wrist = { x: side * (shoulderHalf + arm * 0.21), y: h * 0.785 - arm * 0.94, z: h * 0.016 };
    capsules.push({ ax: shoulder.x, ay: shoulder.y, az: shoulder.z, bx: elbow.x, by: elbow.y, bz: elbow.z, ra: h * 0.039, rb: h * 0.031 });
    capsules.push({ ax: elbow.x, ay: elbow.y, az: elbow.z, bx: wrist.x, by: wrist.y, bz: wrist.z, ra: h * 0.031, rb: h * 0.021 });
    capsules.push({ ax: wrist.x, ay: wrist.y, az: wrist.z, bx: side * (wrist.x * side + h * 0.022), by: wrist.y - h * 0.052, bz: wrist.z + h * 0.012, ra: h * 0.022, rb: h * 0.017 });

    const hip = { x: side * h * 0.055, y: hipY - h * 0.035, z: h * 0.008 };
    const knee = { x: side * h * 0.061, y: h * 0.275 + legShift * 0.55, z: h * 0.008 };
    const ankle = { x: side * h * 0.055, y: h * 0.075, z: h * 0.012 };
    capsules.push({ ax: hip.x, ay: hip.y, az: hip.z, bx: knee.x, by: knee.y, bz: knee.z, ra: thighRadius, rb: thighRadius * 0.69 });
    capsules.push({ ax: knee.x, ay: knee.y, az: knee.z, bx: ankle.x, by: ankle.y, bz: ankle.z, ra: thighRadius * 0.68, rb: h * 0.032 });
    capsules.push({ ax: side * h * 0.055, ay: h * 0.03, az: -h * 0.035, bx: side * h * 0.055, by: h * 0.032, bz: h * 0.12, ra: h * 0.038, rb: h * 0.039 });
  }
  return capsules;
}

function makeDistance(body: BodyMeasurements): { distance: BodySurface['signedDistance']; bounds: BodySurface['bounds'] } {
  const h = body.height / 100;
  const profile = bodyTorsoProfile(body).sort((a, b) => a.y - b.y);
  const capsules = makeCapsules(body);
  const neck = { x: Math.max(body.neck / 100 * 0.145, h * 0.043), z: Math.max(body.neck / 100 * 0.12, h * 0.038) };
  const bounds = { x: Math.max(0.53, body.shoulder / 100 * 0.5 + body.armLength / 100 * 0.28), y: h, z: 0.32 };

  const distance = (x: number, y: number, z: number) => {
    const section = sampleSorted(profile, Math.max(profile[0].y, Math.min(profile[profile.length - 1].y, y)));
    const rx = Math.max(0.008, section.width * 0.5);
    const rz = Math.max(0.008, section.depth * 0.5);
    const ellipseRadius = Math.sqrt(x * x / (rx * rx) + (z - section.centerZ) * (z - section.centerZ) / (rz * rz));
    const radial = (ellipseRadius - 1) * Math.min(rx, rz);
    const vertical = Math.max(profile[0].y - y, y - profile[profile.length - 1].y);
    let result = Math.max(radial, vertical);
    result = smoothMin(result, sdEllipsoid(x, y, z, 0, h * 0.867, -h * 0.002, neck.x, h * 0.058, neck.z), h * 0.035);
    result = smoothMin(result, sdEllipsoid(x, y, z, 0, h * 0.918, -h * 0.006, h * 0.052, h * 0.076, h * 0.051), h * 0.025);
    for (const capsule of capsules) result = smoothMin(result, sdCapsule(capsule, x, y, z), h * 0.032);
    return result;
  };
  return { distance, bounds };
}

function polygonize(distance: BodySurface['signedDistance'], bounds: BodySurface['bounds'], bodyHeight: number): THREE.BufferGeometry {
  const nx = 45; const ny = Math.max(75, Math.round(bodyHeight / 0.020)); const nz = 29;
  const minX = -bounds.x; const maxX = bounds.x; const minY = 0; const maxY = bodyHeight * 0.99; const minZ = -bounds.z; const maxZ = bounds.z;
  const dx = (maxX - minX) / (nx - 1); const dy = (maxY - minY) / (ny - 1); const dz = (maxZ - minZ) / (nz - 1);
  const values = new Float32Array(nx * ny * nz);
  const node = (x: number, y: number, z: number) => (z * ny + y) * nx + x;
  for (let k = 0; k < nz; k += 1) {
    const z = minZ + k * dz;
    for (let j = 0; j < ny; j += 1) {
      const y = minY + j * dy;
      for (let i = 0; i < nx; i += 1) values[node(i, j, k)] = distance(minX + i * dx, y, z);
    }
  }

  const positions: number[] = [];
  const indices: number[] = [];
  const edgeVertices = new Map<string, number>();
  const cornerOffsets = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] as const;
  const tetrahedra = [[0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6], [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6]] as const;
  const coord = (id: number) => {
    const i = id % nx;
    const yz = (id - i) / nx;
    const j = yz % ny;
    const k = (yz - j) / ny;
    return [minX + i * dx, minY + j * dy, minZ + k * dz] as const;
  };
  const edgeVertex = (a: number, b: number, va: number, vb: number): number => {
    const low = Math.min(a, b); const high = Math.max(a, b); const key = `${low}:${high}`;
    const cached = edgeVertices.get(key);
    if (cached !== undefined) return cached;
    const pa = coord(a); const pb = coord(b);
    const t = Math.max(0, Math.min(1, va / (va - vb)));
    const vertex = positions.length / 3;
    positions.push(pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t, pa[2] + (pb[2] - pa[2]) * t);
    edgeVertices.set(key, vertex);
    return vertex;
  };
  const addTriangle = (a: number, b: number, c: number, inside: readonly number[], outside: readonly number[]) => {
    const ix = inside.reduce((sum, id) => sum + coord(id)[0], 0) / inside.length;
    const iy = inside.reduce((sum, id) => sum + coord(id)[1], 0) / inside.length;
    const iz = inside.reduce((sum, id) => sum + coord(id)[2], 0) / inside.length;
    const ox = outside.reduce((sum, id) => sum + coord(id)[0], 0) / outside.length;
    const oy = outside.reduce((sum, id) => sum + coord(id)[1], 0) / outside.length;
    const oz = outside.reduce((sum, id) => sum + coord(id)[2], 0) / outside.length;
    const ax = positions[b * 3] - positions[a * 3]; const ay = positions[b * 3 + 1] - positions[a * 3 + 1]; const az = positions[b * 3 + 2] - positions[a * 3 + 2];
    const bx = positions[c * 3] - positions[a * 3]; const by = positions[c * 3 + 1] - positions[a * 3 + 1]; const bz = positions[c * 3 + 2] - positions[a * 3 + 2];
    const nx = ay * bz - az * by; const ny = az * bx - ax * bz; const nz = ax * by - ay * bx;
    if (nx * (ox - ix) + ny * (oy - iy) + nz * (oz - iz) < 0) indices.push(a, c, b);
    else indices.push(a, b, c);
  };
  const edge = (tetNodes: number[], valuesForTet: number[], from: number, to: number) => edgeVertex(tetNodes[from], tetNodes[to], valuesForTet[from], valuesForTet[to]);

  for (let k = 0; k < nz - 1; k += 1) for (let j = 0; j < ny - 1; j += 1) for (let i = 0; i < nx - 1; i += 1) {
    const cubeNodes = cornerOffsets.map(([ox, oy, oz]) => node(i + ox, j + oy, k + oz));
    const cubeValues = cubeNodes.map((id) => values[id]);
    if (cubeValues.every((value) => value >= 0) || cubeValues.every((value) => value < 0)) continue;
    for (const tet of tetrahedra) {
      const tetNodes = tet.map((corner) => cubeNodes[corner]);
      const tetValues = tet.map((corner) => cubeValues[corner]);
      const inside = [0, 1, 2, 3].filter((idx) => tetValues[idx] < 0);
      if (inside.length === 0 || inside.length === 4) continue;
      const outside = [0, 1, 2, 3].filter((idx) => tetValues[idx] >= 0);
      if (inside.length === 1) {
        const a = inside[0];
        addTriangle(edge(tetNodes, tetValues, a, outside[0]), edge(tetNodes, tetValues, a, outside[1]), edge(tetNodes, tetValues, a, outside[2]), inside.map((idx) => tetNodes[idx]), outside.map((idx) => tetNodes[idx]));
      } else if (inside.length === 3) {
        const a = outside[0];
        addTriangle(edge(tetNodes, tetValues, a, inside[0]), edge(tetNodes, tetValues, a, inside[1]), edge(tetNodes, tetValues, a, inside[2]), inside.map((idx) => tetNodes[idx]), outside.map((idx) => tetNodes[idx]));
      } else {
        const a = inside[0]; const b = inside[1]; const c = outside[0]; const d = outside[1];
        const ac = edge(tetNodes, tetValues, a, c); const ad = edge(tetNodes, tetValues, a, d);
        const bc = edge(tetNodes, tetValues, b, c); const bd = edge(tetNodes, tetValues, b, d);
        addTriangle(ac, ad, bd, inside.map((idx) => tetNodes[idx]), outside.map((idx) => tetNodes[idx]));
        addTriangle(ac, bd, bc, inside.map((idx) => tetNodes[idx]), outside.map((idx) => tetNodes[idx]));
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Measurement-led implicit surface. The mesh is a rendering approximation; the same signed field also supports garment clearance checks. */
export function createBodySurface(body: BodyMeasurements): BodySurface {
  const { distance, bounds } = makeDistance(body);
  return { geometry: polygonize(distance, bounds, body.height / 100), signedDistance: distance, bounds };
}

/** Reuse the analytic field without extracting a render mesh for quick analysis. */
export function createBodyDistanceField(body: BodyMeasurements): Pick<BodySurface, 'signedDistance' | 'bounds'> {
  return makeDistance(body);
}

