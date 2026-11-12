import type { Garment } from '../models/garment';

// Deliberately synthetic examples for demonstrating the calculation pipeline. These are not retailer specifications.
export const SAMPLE_GARMENTS: Garment[] = [
  {
    id: 'everyday-tee', name: 'Everyday tee', category: 'T-shirt', description: 'Midweight cotton · straight fit', color: '#b7c4bb', accent: '#e3e9e1',
    sizes: {
      XS: { chest: 92, waist: 90, hips: 94, shoulder: 41, sleeve: 19, length: 63 },
      S: { chest: 98, waist: 96, hips: 100, shoulder: 43, sleeve: 20, length: 66 },
      M: { chest: 104, waist: 102, hips: 106, shoulder: 45, sleeve: 21, length: 69 },
      L: { chest: 112, waist: 110, hips: 114, shoulder: 48, sleeve: 22, length: 72 },
      XL: { chest: 120, waist: 118, hips: 122, shoulder: 51, sleeve: 23, length: 75 },
    },
  },
  {
    id: 'studio-hoodie', name: 'Studio hoodie', category: 'Hoodie', description: 'Brushed fleece · relaxed fit', color: '#b8a99b', accent: '#e0d5c9',
    sizes: {
      XS: { chest: 104, waist: 102, hips: 104, shoulder: 48, sleeve: 54, length: 62 },
      S: { chest: 110, waist: 108, hips: 110, shoulder: 50, sleeve: 56, length: 65 },
      M: { chest: 116, waist: 114, hips: 116, shoulder: 52, sleeve: 58, length: 68 },
      L: { chest: 124, waist: 122, hips: 124, shoulder: 55, sleeve: 60, length: 71 },
      XL: { chest: 132, waist: 130, hips: 132, shoulder: 58, sleeve: 62, length: 74 },
    },
  },
  {
    id: 'essential-crew', name: 'Essential crew', category: 'Sweatshirt', description: 'Loopback cotton · easy fit', color: '#9eabc1', accent: '#d3d9e5',
    sizes: {
      XS: { chest: 100, waist: 98, hips: 100, shoulder: 46, sleeve: 52, length: 61 },
      S: { chest: 106, waist: 104, hips: 106, shoulder: 48, sleeve: 54, length: 64 },
      M: { chest: 112, waist: 110, hips: 112, shoulder: 50, sleeve: 56, length: 67 },
      L: { chest: 120, waist: 118, hips: 120, shoulder: 53, sleeve: 58, length: 70 },
      XL: { chest: 128, waist: 126, hips: 128, shoulder: 56, sleeve: 60, length: 73 },
    },
  },
  {
    id: 'everyday-pant', name: 'Everyday pant', category: 'Pants', description: 'Cotton twill · straight leg', color: '#737f75', accent: '#b5bdb3',
    sizes: {
      XS: { waist: 74, hips: 94, inseam: 74, rise: 25 },
      S: { waist: 80, hips: 100, inseam: 76, rise: 26 },
      M: { waist: 86, hips: 106, inseam: 78, rise: 27 },
      L: { waist: 94, hips: 114, inseam: 80, rise: 28 },
      XL: { waist: 102, hips: 122, inseam: 82, rise: 29 },
    },
  },
];
