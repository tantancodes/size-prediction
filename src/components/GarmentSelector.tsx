import { PackageCheck, Shirt, Sparkles } from 'lucide-react';
import type { Garment } from '../models/garment';

type Props = { garments: Garment[]; selectedId: string; onSelect: (id: string) => void };

export function GarmentSelector({ garments, selectedId, onSelect }: Props) {
  return (
    <div className="garment-selector" role="group" aria-label="Choose a garment">
      <span className="selector-label">GARMENT</span>
      <div className="garment-tabs">
        {garments.map((garment, index) => (
          <button key={garment.id} onClick={() => onSelect(garment.id)} className={`garment-tab ${selectedId === garment.id ? 'active' : ''}`} aria-pressed={selectedId === garment.id}>
            <span className="garment-tab-icon" style={{ backgroundColor: garment.color }}>{index === 3 ? <PackageCheck size={15} /> : index === 2 ? <Sparkles size={15} /> : <Shirt size={15} />}</span>
            <span>{garment.category}</span>
          </button>
        ))}
      </div>
      <span className="sample-label">ILLUSTRATIVE CHART</span>
    </div>
  );
}
