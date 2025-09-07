'use client';

import React from 'react';
import { ComponentType } from '../types';
import { getComponentIcon } from '../utils';

interface CraftButtonProps {
  selectedFinal: string;
  selectedType: ComponentType;
  craftSuccess: boolean;
  isCrafting: boolean;
  onCraft: () => void;
}

export default function CraftButton({
  selectedFinal,
  selectedType,
  craftSuccess,
  isCrafting,
  onCraft
}: CraftButtonProps) {
  return (
    <div className="text-center">
      <div className="mb-4 p-4 bg-gray-900/50 rounded-lg inline-block">
        <div className="grid grid-cols-2 gap-8">
          {/* Required Column */}
          <div className="text-left">
            <h4 className="text-sm text-gray-400 mb-3 font-semibold uppercase tracking-wider">Required</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🪙</span>
                <span className="text-yellow-400 font-bold">2,500</span>
                <span className="text-gray-400">Gold</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                <span className="text-yellow-400 font-bold">5</span>
                <span className="text-gray-400">Clean Essence</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="text-yellow-400 font-bold">3</span>
                <span className="text-gray-400">Accordion Essence</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔧</span>
                <span className="text-yellow-400 font-bold">1</span>
                <span className="text-gray-400">Mixed Essence</span>
              </div>
            </div>
          </div>
          
          {/* Rewards Column */}
          <div className="text-left">
            <h4 className="text-sm text-gray-400 mb-3 font-semibold uppercase tracking-wider">Rewards</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getComponentIcon(selectedType)}</span>
                <span className="text-green-400 font-bold">{selectedFinal}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400">•</span>
                <span className="text-purple-400">+150 XP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">•</span>
                <span className="text-blue-400">+1 Mek Slot</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">•</span>
                <span className="text-yellow-400">Scrapyard Essence: +2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        {craftSuccess ? (
          <div className="text-2xl font-bold text-green-500 animate-pulse">
            ✨ Crafting Successful! ✨
          </div>
        ) : (
          <button 
            className={`btn-particles ${isCrafting ? 'disabled' : ''}`}
            onClick={(e) => {
              if (!isCrafting) {
                onCraft();
                e.currentTarget.classList.add('clicked');
                setTimeout(() => e.currentTarget.classList.remove('clicked'), 600);
              }
            }}
            disabled={isCrafting}
          >
            <div className="particles-bg"></div>
            <span className="particles-text">{isCrafting ? 'CRAFTING...' : 'CRAFT'}</span>
            <div className="particle-container">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="particle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    '--x': `${(Math.random() - 0.5) * 200}px`,
                    '--y': `${(Math.random() - 0.5) * 200}px`,
                    '--duration': `${3 + Math.random() * 3}s`,
                    animationDelay: `${Math.random() * 6}s`
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}