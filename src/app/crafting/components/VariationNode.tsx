'use client';

import React, { useState } from 'react';
import { getVariationImagePath, hasRecipeForVariation, getComponentIcon } from '../utils';
import { ComponentType } from '../types';

interface VariationNodeProps {
  variation: string;
  onSelect: (variation: string) => void;
  showImage?: boolean;
  selectedType?: ComponentType;
}

export default function VariationNode({ 
  variation, 
  onSelect, 
  showImage = true,
  selectedType 
}: VariationNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hasRecipe = hasRecipeForVariation(variation);

  const handleClick = (e: React.MouseEvent) => {
    if (hasRecipe) {
      onSelect(variation);
    } else {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const getVariationLabel = () => {
    if (!hasRecipe) return null;
    
    if (variation === 'Accordion' || variation === 'Turret') return 'CAMERA TYPE';
    if (variation === 'Cartoon' || variation === 'Luxury') return 'BODY STYLE';
    if (variation === 'Wings' || variation === 'Weapons') return 'TRAIT CLASS';
    return 'VARIATION';
  };

  return (
    <>
      <div
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={(e) => {
          if (!hasRecipe) {
            setMousePos({ x: e.clientX, y: e.clientY });
          }
        }}
        onMouseLeave={() => setIsHovered(false)}
        className={`group ${hasRecipe ? 'cursor-pointer' : 'cursor-not-allowed'} transform transition-all duration-300 ${hasRecipe ? 'hover:scale-105' : 'hover:scale-95'}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          opacity: hasRecipe ? 1 : 0.6,
        }}
      >
        {showImage && (
          <div className="relative mb-3">
            <div 
              className={`w-32 h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 transition-all duration-300 bg-gradient-to-br ${hasRecipe ? 'from-gray-700 to-gray-800' : 'from-gray-800 to-gray-900'} ${hasRecipe ? 'group-hover:border-green-400' : ''}`}
              style={{
                borderColor: hasRecipe 
                  ? (isHovered ? 'rgba(34, 197, 94, 1)' : 'rgba(34, 197, 94, 0.4)') 
                  : 'rgba(107, 114, 128, 0.5)',
                boxShadow: hasRecipe 
                  ? (isHovered 
                    ? '0 0 40px rgba(34, 197, 94, 0.8), 0 0 80px rgba(34, 197, 94, 0.4), inset 0 0 30px rgba(34, 197, 94, 0.3)' 
                    : '0 0 25px rgba(34, 197, 94, 0.4), 0 0 50px rgba(34, 197, 94, 0.2)')
                  : '0 4px 12px rgba(0, 0, 0, 0.3)',
                filter: hasRecipe 
                  ? 'none' 
                  : (isHovered ? 'grayscale(70%) brightness(0.6)' : 'grayscale(70%)'),
              }}
            >
              <img 
                src={getVariationImagePath(variation)}
                alt={variation}
                className="w-full h-full object-cover"
                style={{
                  filter: hasRecipe ? 'none' : 'brightness(0.7)',
                }}
                onError={(e) => {
                  const parent = e.currentTarget.parentElement;
                  if (parent && selectedType) {
                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-5xl" style="filter: ${hasRecipe ? 'none' : 'brightness(0.5)'}">${
                      getComponentIcon(selectedType)
                    }</div>`;
                  }
                }}
              />
            </div>
            {hasRecipe && (
              <>
                <div 
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at center, transparent 60%, rgba(34, 197, 94, 0.2) 100%)',
                    animation: 'pulse 3s ease-in-out infinite',
                  }}
                />
                {isHovered && (
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: -1 }}>
                    {[...Array(24)].map((_, i) => {
                      const randomAngle = (Math.random() * 360) * Math.PI / 180;
                      const startX = 50 + 48 * Math.cos(randomAngle);
                      const startY = 50 + 48 * Math.sin(randomAngle);
                      const duration = 2 + Math.random() * 2;
                      const delay = Math.random() * 2;
                      
                      return (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-green-400/60 rounded-full"
                          style={{
                            left: `${startX}%`,
                            top: `${startY}%`,
                            '--angle': `${randomAngle * 180 / Math.PI}deg`,
                            '--endX': `${Math.cos(randomAngle) * 100}px`,
                            '--endY': `${Math.sin(randomAngle) * 100}px`,
                            animation: `radiateFromEdge ${duration}s ease-out infinite`,
                            animationDelay: `${delay}s`,
                          } as React.CSSProperties}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        <div className={`transition-all duration-300 ${hasRecipe ? 'text-gray-300 group-hover:text-yellow-400' : 'text-gray-600'}`}>
          <div className="text-base font-bold uppercase tracking-wider" style={{
            fontFamily: 'Rajdhani, sans-serif',
            letterSpacing: '0.08em',
            textShadow: hasRecipe && isHovered ? '0 0 10px rgba(250, 204, 21, 0.3)' : 'none'
          }}>
            {variation}
          </div>
          {hasRecipe && (
            <div className="text-xs mt-1 text-gray-500 group-hover:text-gray-400 transition-colors text-center">
              {getVariationLabel()}
            </div>
          )}
        </div>
      </div>
      
      {/* Tooltip for unavailable nodes */}
      {isHovered && !hasRecipe && (
        <div 
          className="fixed pointer-events-none z-50 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm border border-red-500/50"
          style={{
            left: `${mousePos.x + 10}px`,
            top: `${mousePos.y - 30}px`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          ❌ You do not own any recipes down this path
        </div>
      )}
    </>
  );
}