export type GarmentCategory = 'T-shirt' | 'Hoodie' | 'Sweatshirt' | 'Pants';
export type SizeLabel = 'XS' | 'S' | 'M' | 'L' | 'XL';

export type GarmentSize = {
  chest?: number;
  waist: number;
  hips: number;
  shoulder?: number;
  sleeve?: number;
  length?: number;
  inseam?: number;
  rise?: number;
};

export type Garment = {
  id: string;
  name: string;
  category: GarmentCategory;
  description: string;
  color: string;
  accent: string;
  sizes: Record<SizeLabel, GarmentSize>;
};

export type GarmentRegion = 'chest' | 'waist' | 'hips' | 'shoulder' | 'sleeve' | 'length' | 'inseam' | 'rise';

export const SIZES: SizeLabel[] = ['XS', 'S', 'M', 'L', 'XL'];
