'use client';

import { useRouter } from 'next/navigation';

interface ChipTypeSelectorProps {
  onSelectMekChips: () => void;
}

export default function ChipTypeSelector({ onSelectMekChips }: ChipTypeSelectorProps) {
  const router = useRouter();

  const chipTypes = [
    {
      id: 'uni-chips',
      name: 'Uni-Chips',
      icon: '💾',
      description: 'Universal chips that can be equipped in any slot on any Mek',
      subtext: 'Cross-compatible enhancement modules',
      color: 'from-purple-600 to-blue-600',
      borderColor: 'border-purple-400',
      glowColor: 'rgba(147, 51, 234, 0.3)',
      onClick: () => router.push('/uni-chips')
    },
    {
      id: 'mek-chips',
      name: 'Mek-Chips',
      icon: '🔧',
      description: 'Specialized chips tied to specific Mekanism attributes',
      subtext: 'Heads, Bodies, and Traits',
      color: 'from-yellow-600 to-orange-600',
      borderColor: 'border-yellow-400',
      glowColor: 'rgba(250, 182, 23, 0.3)',
      onClick: onSelectMekChips
    }
  ];

  return (
    <div className="text-center">
      <h1 className="text-5xl font-bold text-yellow-400 mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        Chip Crafting Station
      </h1>
      <p className="text-gray-400 mb-10 text-lg">
        Choose your crafting path
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {chipTypes.map(type => (
          <div
            key={type.id}
            onClick={type.onClick}
            className={`group cursor-pointer transform transition-all duration-500 hover:scale-105 ${type.borderColor}`}
            style={{
              background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(15, 15, 15, 0.8) 100%)',
              backdropFilter: 'blur(20px)',
              border: '3px solid',
              borderRadius: '24px',
              padding: '48px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 0 30px ${type.glowColor}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 0 50px ${type.glowColor}, inset 0 0 30px ${type.glowColor}`;
              e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = `0 0 30px ${type.glowColor}`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {/* Background Gradient Effect */}
            <div 
              className={`absolute inset-0 opacity-10 bg-gradient-to-br ${type.color}`}
              style={{ mixBlendMode: 'overlay' }}
            />
            
            {/* Icon */}
            <div className="text-7xl mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
              {type.icon}
            </div>
            
            {/* Title */}
            <h3 className="text-3xl font-bold mb-3 relative z-10 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {type.name}
            </h3>
            
            {/* Description */}
            <p className="text-gray-300 text-base mb-2 relative z-10 leading-relaxed">
              {type.description}
            </p>
            
            {/* Subtext */}
            <p className="text-gray-500 text-sm relative z-10 italic">
              {type.subtext}
            </p>
            
            {/* Hover Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-yellow-400 text-sm font-semibold">Click to Enter →</span>
            </div>
            
            {/* Corner Accent */}
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${type.color} opacity-20 rounded-bl-full`} />
          </div>
        ))}
      </div>
      
      {/* Info Footer */}
      <div className="mt-12 text-gray-500 text-sm max-w-2xl mx-auto">
        <p>
          <span className="text-purple-400">Uni-Chips</span> provide flexible enhancements that work across all Meks, 
          while <span className="text-yellow-400">Mek-Chips</span> offer specialized bonuses tied to specific components.
        </p>
      </div>
    </div>
  );
}