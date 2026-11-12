import * as THREE from 'three';
import type { BodyMeasurements } from '../../models/measurements';

export type RingProfile = { y: number; width: number; depth: number; centerZ?: number };

/** Convert an approximate torso circumference to ellipse diameters (meters). */
export function circumferenceToEllipse(circumferenceCm: number, depthRatio = 0.74): { width: number; depth: number } {
  const ratio = depthRatio;
  // Ramanujan's ellipse-perimeter approximation, solved for its semi-major axis.
  const perimeterPerSemiMajor = Math.PI * (3 * (1 + ratio) - Math.sqrt((3 + ratio) * (1 + 3 * ratio)));
  const semiMajor = circumferenceCm / 100 / perimeterPerSemiMajor;
  return { width: semiMajor * 2, depth: semiMajor * ratio * 2 };
}

export function bodyHipLineY(measurements: BodyMeasurements): number {
  const h = measurements.height / 100;
  // Let inseam make a modest, bounded adjustment to the crotch/upper-leg landmark.
  // This does not claim to reconstruct leg proportions from one measurement.
  const expectedInseam = h * 46;
  const shift = THREE.MathUtils.clamp((measurements.inseam - expectedInseam) / 100 * 0.35, -0.03, 0.03);
  return h * 0.51 + shift;
}

function catmull(a: number, b: number, c: number, d: number, t: number): number {
  return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
}

function sampleSortedProfile(sorted: RingProfile[], y: number): { width: number; depth: number; centerZ: number } {
  const index = Math.max(0, sorted.findIndex((point, i) => i < sorted.length - 1 && y >= point.y && y <= sorted[i + 1].y));
  if (y <= sorted[0].y) return { width: sorted[0].width, depth: sorted[0].depth, centerZ: sorted[0].centerZ ?? 0 };
  if (y >= sorted.at(-1)!.y) return { width: sorted.at(-1)!.width, depth: sorted.at(-1)!.depth, centerZ: sorted.at(-1)!.centerZ ?? 0 };
  const a = sorted[Math.max(index - 1, 0)];
  const b = sorted[index];
  const c = sorted[index + 1];
  const d = sorted[Math.min(index + 2, sorted.length - 1)];
  const t = (y - b.y) / (c.y - b.y);
  return {
    width: catmull(a.width, b.width, c.width, d.width, t),
    depth: catmull(a.depth, b.depth, c.depth, d.depth, t),
    centerZ: catmull(a.centerZ ?? 0, b.centerZ ?? 0, c.centerZ ?? 0, d.centerZ ?? 0, t),
  };
}

export function sampleProfile(profile: RingProfile[], y: number): { width: number; depth: number } {
  const sampled = sampleSortedProfile([...profile].sort((a, b) => a.y - b.y), y);
  return { width: sampled.width, depth: sampled.depth };
}

/** Create a closed, smoothly shaded elliptical loft from bottom to top. */
export function createLoftGeometry(profile: RingProfile[], radialSegments = 36, verticalSegments = 48, cap = true): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const minY = Math.min(...profile.map((point) => point.y));
  const maxY = Math.max(...profile.map((point) => point.y));
  const sortedProfile = [...profile].sort((a, b) => a.y - b.y);
  for (let row = 0; row <= verticalSegments; row += 1) {
    const y = minY + (maxY - minY) * row / verticalSegments;
    const { width, depth, centerZ } = sampleSortedProfile(sortedProfile, y);
    for (let col = 0; col < radialSegments; col += 1) {
      const angle = col / radialSegments * Math.PI * 2;
      positions.push(Math.cos(angle) * width / 2, y, centerZ + Math.sin(angle) * depth / 2);
    }
  }
  for (let row = 0; row < verticalSegments; row += 1) {
    for (let col = 0; col < radialSegments; col += 1) {
      const a = row * radialSegments + col;
      const b = row * radialSegments + (col + 1) % radialSegments;
      const c = (row + 1) * radialSegments + (col + 1) % radialSegments;
      const d = (row + 1) * radialSegments + col;
      indices.push(a, d, b, b, d, c);
    }
  }
  if (cap) {
    const bottom = positions.length / 3;
    positions.push(0, minY, 0);
    const top = positions.length / 3;
    positions.push(0, maxY, 0);
    for (let col = 0; col < radialSegments; col += 1) {
      indices.push(bottom, (col + 1) % radialSegments, col);
      const rowStart = verticalSegments * radialSegments;
      indices.push(top, rowStart + col, rowStart + (col + 1) % radialSegments);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createLimbGeometry(topRadius: number, bottomRadius: number, length: number, radialSegments = 20): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, length, radialSegments, 8, false);
  // Slight bevels make joint transitions less mechanical while keeping the mesh inexpensive.
  return geometry;
}

export function bodyTorsoProfile(measurements: BodyMeasurements): RingProfile[] {
  const h = measurements.height / 100;
  const hipLineY = bodyHipLineY(measurements);
  const hip = circumferenceToEllipse(measurements.hips, 0.76);
  const waist = circumferenceToEllipse(measurements.waist, 0.72);
  const chest = circumferenceToEllipse(measurements.chest, 0.76);
  const shoulderWidth = Math.max(measurements.shoulder / 100, chest.width * 0.92);
  const shoulderDepth = chest.depth * 0.86;
  const neck = circumferenceToEllipse(measurements.neck, 0.88);
  return [
    { y: hipLineY - h * 0.04, width: hip.width * 0.82, depth: hip.depth * 0.82 },
    { y: hipLineY, width: hip.width, depth: hip.depth },
    { y: h * 0.57, width: hip.width * 0.97, depth: hip.depth * 0.98, centerZ: h * 0.004 },
    { y: h * 0.62, width: waist.width, depth: waist.depth, centerZ: h * 0.011 },
    { y: h * 0.68, width: waist.width * 1.04, depth: waist.depth * 1.03, centerZ: h * 0.016 },
    { y: h * 0.72, width: chest.width * 0.98, depth: chest.depth * 0.98, centerZ: h * 0.009 },
    { y: h * 0.75, width: chest.width, depth: chest.depth, centerZ: h * 0.004 },
    { y: h * 0.79, width: shoulderWidth, depth: shoulderDepth, centerZ: -h * 0.002 },
    { y: h * 0.82, width: shoulderWidth * 0.82, depth: shoulderDepth * 0.88, centerZ: -h * 0.002 },
    { y: h * 0.835, width: neck.width * 1.08, depth: neck.depth * 1.08 },
  ];
}

export function garmentTorsoProfile(measurements: BodyMeasurements, garment: { chest?: number; waist: number; hips: number; shoulder?: number; length?: number }, extraEase = 0): RingProfile[] {
  const h = measurements.height / 100;
  const hip = circumferenceToEllipse(garment.hips + extraEase, 0.76);
  const waist = circumferenceToEllipse(garment.waist + extraEase, 0.74);
  const chest = circumferenceToEllipse((garment.chest ?? garment.waist) + extraEase, 0.78);
  const shoulderWidth = Math.max((garment.shoulder ?? measurements.shoulder + 8) / 100, chest.width * 0.91);
  const topY = h * 0.82;
  const bottomY = h * 0.34;
  const garmentLength = garment.length ?? h * 37;
  const actualBottomY = Math.max(bottomY, topY - garmentLength / 100);
  return [
    { y: actualBottomY, width: hip.width, depth: hip.depth },
    { y: actualBottomY + h * 0.045, width: hip.width * 0.99, depth: hip.depth * 0.99 },
    { y: h * 0.62, width: waist.width, depth: waist.depth },
    { y: h * 0.69, width: waist.width * 1.02, depth: waist.depth * 1.02 },
    { y: h * 0.75, width: chest.width, depth: chest.depth },
    { y: h * 0.79, width: shoulderWidth, depth: chest.depth * 0.94 },
    { y: topY, width: shoulderWidth * 0.72, depth: chest.depth * 0.74 },
  ];
}
