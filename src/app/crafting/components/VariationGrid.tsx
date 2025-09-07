'use client';

import { useState } from 'react';
import VariationNode from './VariationNode';
import { ComponentType } from '../types';
import { useClickSound } from '@/lib/useClickSound';

interface VariationGridProps {
  variations: string[];
  onSelect: (variation: string) => void;
  showImages?: boolean;
  selectedType?: ComponentType;
  searchable?: boolean;
}

export default function VariationGrid({ 
  variations, 
  onSelect, 
  showImages = true,
  selectedType,
  searchable = false
}: VariationGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const playClickSound = useClickSound();

  const filtered = searchable && searchTerm 
    ? variations.filter(v => v.toLowerCase().includes(searchTerm.toLowerCase()))
    : variations;

  const handleSelect = (variation: string) => {
    playClickSound();
    onSelect(variation);
  };

  return (
    <>
      {searchable && (
        <div className="mb-6 flex justify-end">
          <input
            type="text"
            placeholder="Search variations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none w-64"
          />
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
        {filtered.map(variation => (
          <VariationNode
            key={variation}
            variation={variation}
            onSelect={handleSelect}
            showImage={showImages}
            selectedType={selectedType}
          />
        ))}
      </div>
    </>
  );
}