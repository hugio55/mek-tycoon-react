'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ComponentType } from '../types';
import { getVariationImagePath, getComponentIcon } from '../utils';
import RarityBiasChart from './RarityBiasChart';
import RecipeRequirements from './RecipeRequirements';
import CraftButton from './CraftButton';

interface RecipeDisplayProps {
  selectedFinal: string;
  selectedType: ComponentType;
  selectedVariation: string;
  selectedStyle: string;
  onBack: () => void;
  onCraftSuccess: (item: { name: string; type: ComponentType }) => void;
}

export default function RecipeDisplay({
  selectedFinal,
  selectedType,
  selectedVariation,
  selectedStyle,
  onBack,
  onCraftSuccess
}: RecipeDisplayProps) {
  const [isCrafting, setIsCrafting] = useState(false);
  const [craftSuccess, setCraftSuccess] = useState(false);

  const handleCraft = async () => {
    setIsCrafting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsCrafting(false);
    setCraftSuccess(true);
    onCraftSuccess({ name: selectedFinal, type: selectedType });
  };

  const componentName = selectedType === 'heads' ? 'Head' : selectedType === 'bodies' ? 'Body' : 'Trait';

  return (
    <div className="relative">
      {/* Back Button */}
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-lg transition-all border border-gray-700 hover:border-yellow-500"
        >
          ← Back to Selection
        </button>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto">
        {/* Header with Title and Collection Stats */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">
            {selectedFinal} {componentName}
          </h1>
          <div className="text-lg text-gray-400">
            {selectedVariation} → {selectedStyle} → {selectedFinal}
          </div>
          
          {/* Collection Stats */}
          <div className="mt-4 flex justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">247</div>
              <div className="text-sm text-gray-500">In Collection</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">2.4%</div>
              <div className="text-sm text-gray-500">Of Total Supply</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">Rank B</div>
              <div className="text-sm text-gray-500">Rarity Tier</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center mb-6">
          
          {/* Left Panel - Item Details */}
          <div>
            <div 
              className="p-6 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.6) 0%, rgba(42, 42, 42, 0.6) 100%)',
                border: '2px solid #6b7280',
                boxShadow: '0 4px 20px rgba(107, 114, 128, 0.3)',
              }}
            >
              <h3 className="text-2xl font-bold text-yellow-400 mb-3">{selectedFinal} {componentName}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Meks with this slot:</span>
                  <Link 
                    href={`/profile?filter=${selectedFinal}`}
                    className="text-green-400 font-semibold hover:text-green-300 underline cursor-pointer"
                  >
                    3
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Slots filled:</span>
                  <span className="text-yellow-400 font-semibold">2/3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel - Large Variation Image with Effects */}
          <div className="relative flex items-center justify-center">
            {/* Spinning Underglow Effect */}
            <div 
              className="absolute rounded-full"
              style={{
                width: '320px',
                height: '320px',
                background: `
                  conic-gradient(from 0deg at 50% 50%,
                    rgba(250, 182, 23, 0.4) 0deg,
                    rgba(236, 72, 153, 0.3) 60deg,
                    rgba(147, 51, 234, 0.3) 120deg,
                    rgba(59, 130, 246, 0.3) 180deg,
                    rgba(147, 51, 234, 0.3) 240deg,
                    rgba(236, 72, 153, 0.3) 300deg,
                    rgba(250, 182, 23, 0.4) 360deg
                  )`,
                filter: 'blur(30px)',
                animation: 'spinGlow 10s linear infinite',
              }}
            />
            
            {/* Magic Sand Particles */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: '3px',
                  height: '3px',
                  background: `radial-gradient(circle, rgba(250, 182, 23, 1) 0%, rgba(250, 182, 23, 0) 70%)`,
                  animationName: 'magicParticle',
                  animationDuration: `${2 + Math.random() * 2}s`,
                  animationTimingFunction: 'ease-out',
                  animationIterationCount: 'infinite',
                  animationDelay: `${i * 0.1}s`,
                  left: '50%',
                  top: '50%',
                  '--angle': `${i * 18}deg`,
                  '--turbulence': `${Math.random() * 20 - 10}px`,
                } as React.CSSProperties}
              />
            ))}
            
            {/* Variation Image Container */}
            <div className="relative z-10 w-64 h-64">
              <div className="w-full h-full bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-full border-4 border-yellow-400/50 shadow-2xl flex items-center justify-center overflow-hidden">
                <img 
                  src={getVariationImagePath(selectedFinal)}
                  alt={selectedFinal}
                  className="w-full h-full object-cover scale-110"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="text-6xl hidden">
                  {getComponentIcon(selectedType)}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Variation Details & Buffs */}
          <div>
            <div 
              className="p-6 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.6) 0%, rgba(42, 42, 42, 0.6) 100%)',
                border: '2px solid #22c55e',
                boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
              }}
            >
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Variation Bonuses</h3>
              <div className="space-y-2">
                <div className="flex justify-between pb-2 border-b border-gray-700">
                  <span className="text-gray-400">Bonus Gold Rate</span>
                  <span className="text-white font-semibold">+3.5/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bank Interest Rate</span>
                  <span className="text-green-400">+0.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">CiruTree Gold Discount</span>
                  <span className="text-green-400">-0.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Market Listing Fee</span>
                  <span className="text-green-400">-3%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recipe Requirements */}
        <RecipeRequirements />

        {/* Rarity Bias Graph */}
        <RarityBiasChart />

        {/* Craft Button */}
        <CraftButton 
          selectedFinal={selectedFinal}
          selectedType={selectedType}
          craftSuccess={craftSuccess}
          isCrafting={isCrafting}
          onCraft={handleCraft}
        />
      </div>
    </div>
  );
}