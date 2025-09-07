'use client';

import { ComponentCategory } from '../types';
import { HEADS_VARIATIONS, BODIES_VARIATIONS, TRAITS_VARIATIONS } from '../constants';

interface CategorySelectorProps {
  onSelectCategory: (type: ComponentCategory['type']) => void;
}

const categories: ComponentCategory[] = [
  { 
    type: 'heads', 
    icon: '📷', 
    name: 'Heads', 
    desc: 'Vision & Perception Systems',
    count: HEADS_VARIATIONS.length
  },
  { 
    type: 'bodies', 
    icon: '🤖', 
    name: 'Bodies', 
    desc: 'Core Chassis & Armor',
    count: BODIES_VARIATIONS.length
  },
  { 
    type: 'traits', 
    icon: '⚡', 
    name: 'Traits', 
    desc: 'Special Abilities & Enhancements',
    count: TRAITS_VARIATIONS.length
  }
];

export default function CategorySelector({ onSelectCategory }: CategorySelectorProps) {
  return (
    <>
      <h1 className="text-4xl font-bold text-yellow-400 mb-2">Crafting Station</h1>
      <p className="text-gray-400 mb-8">Forge legendary components for your Mek collection</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {categories.map(category => (
          <div
            key={category.type}
            onClick={() => onSelectCategory(category.type)}
            className="group cursor-pointer transform transition-all duration-500 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.6) 0%, rgba(15, 15, 15, 0.6) 100%)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(255, 204, 0, 0.3)',
              borderRadius: '20px',
              padding: '40px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '2px solid rgba(255, 204, 0, 0.8)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(255, 204, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '2px solid rgba(255, 204, 0, 0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="text-6xl mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300">
              {category.icon}
            </div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-2 relative z-10">{category.name}</h3>
            <p className="text-gray-500 text-sm mb-3 relative z-10">{category.desc}</p>
            <div className="text-xs text-gray-600 relative z-10">{category.count} variations available</div>
          </div>
        ))}
      </div>
    </>
  );
}