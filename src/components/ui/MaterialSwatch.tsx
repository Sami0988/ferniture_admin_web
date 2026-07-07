'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ApiMaterialSelection } from '@/types/api';
import { Eye } from 'lucide-react';

interface MaterialSwatchProps {
  material: ApiMaterialSelection;
  onClick?: () => void;
}

export default function MaterialSwatch({ material, onClick }: MaterialSwatchProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex flex-col items-center gap-1.5"
    >
      <div
        className={cn(
          'relative h-12 w-12 rounded-lg border border-border overflow-hidden transition-transform duration-200',
          hovered && 'scale-110 shadow-md ring-2 ring-brand-gold/30'
        )}
        style={{ backgroundColor: material.material?.swatchImageUrl ? undefined : '#888', backgroundImage: material.material?.swatchImageUrl ? `url(${material.material.swatchImageUrl})` : undefined, backgroundSize: 'cover' }}
      >
        {hovered && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <Eye className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
      <span className="text-[10px] text-muted text-center leading-tight max-w-[60px] truncate">
        {material.material?.name}
      </span>
    </button>
  );
}
