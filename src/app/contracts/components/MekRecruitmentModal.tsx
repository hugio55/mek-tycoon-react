'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { successMultipliers } from '../constants/missionData';
import { generateSampleMeks } from '../utils/helpers';
import { getMekCardStyle, getTraitCircleStyle } from '../utils/styleHelpers';
import ModalPortal from './ModalPortal';
import { getMediaUrl } from '@/lib/media-url';

interface MekRecruitmentModalProps {
  showMekModal: string | null;
  selectedMekSlot: { missionId: string; slotIndex: number } | null;
  onClose: () => void;
  onMekSelection: (mek: any, matchedTraits: any[], hasMatch: boolean) => void;
  mekCount: number;
  mekCardStyle: number;
  traitCircleStyle: number;
  mekFrameStyle: number;
}

export default function MekRecruitmentModal({
  showMekModal,
  selectedMekSlot,
  onClose,
  onMekSelection,
  mekCount,
  mekCardStyle,
  traitCircleStyle,
  mekFrameStyle,
}: MekRecruitmentModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeBuffFilters, setActiveBuffFilters] = useState<string[]>([]);
  const [showOnlyMatches, setShowOnlyMatches] = useState(false);
  const [allMeks] = useState(() => generateSampleMeks(mekCount));

  if (!showMekModal || !selectedMekSlot) return null;
  
  const missionId = selectedMekSlot.missionId;
  const isGlobal = missionId === 'global';
  const missionMultipliers = isGlobal 
    ? successMultipliers.slice(0, 15)
    : successMultipliers.slice(0, 5);
  
  const toggleBuffFilter = (buffId: string) => {
    setActiveBuffFilters(prev => 
      prev.includes(buffId) 
        ? prev.filter(id => id !== buffId)
        : [...prev, buffId]
    );
  };

  // Filter meks based on search, buff filters, and match criteria
  const filteredMeks = allMeks.filter(mek => {
    // Apply buff filter
    if (activeBuffFilters.length > 0) {
      const hasFilteredBuff = mek.traits.some(trait => 
        activeBuffFilters.includes(trait)
      );
      if (!hasFilteredBuff) return false;
    }
    
    // Apply search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const matchesNumber = mek.name.toLowerCase().includes(query);
      const matchesStyle = mek.style.toLowerCase().includes(query);
      const matchesVariation = mek.traits.some(t => t.toLowerCase().includes(query));
      
      if (!matchesNumber && !matchesStyle && !matchesVariation) return false;
    }
    
    return true;
  });
  
  const meksToDisplay = filteredMeks.map(mek => {
    const matchedTraits = mek.traits.filter(t => 
      missionMultipliers.some(m => m.id === t)
    ).map(t => missionMultipliers.find(m => m.id === t));
    
    const hasMatch = matchedTraits.length > 0;
    
    // Generate power chip states (3 chips per mek)
    const powerChips = Array.from({ length: 3 }, (_, i) => {
      if (i === 0) return hasMatch ? 'buffed' : 'active'; // First chip
      if (i === 1) return hasMatch && matchedTraits.length > 1 ? 'buffed' : mek.power > 75 ? 'active' : 'empty'; // Second chip
      return hasMatch && matchedTraits.length > 2 ? 'buffed' : mek.rarity === 'legendary' || mek.rarity === 'rare' ? 'active' : 'empty'; // Third chip
    });
    
    return { mek, matchedTraits, hasMatch, powerChips };
  });

  const displayMeks = showOnlyMatches 
    ? meksToDisplay.filter(item => item.hasMatch)
    : meksToDisplay;

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center overflow-y-auto" style={{ paddingTop: '120px', paddingBottom: '40px' }}>
        <div className="w-full my-auto" style={{ maxWidth: '1152px', padding: '0 24px' }}>
        <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-yellow-400/50 rounded-xl overflow-hidden" style={{
          maxHeight: mekCount <= 10 ? '70vh' : mekCount <= 40 ? '75vh' : '80vh'
        }}>
          {/* Modal Header */}
          <div className="relative overflow-hidden" style={{
            background: `
              repeating-linear-gradient(
                45deg,
                rgba(0, 0, 0, 0.9),
                rgba(0, 0, 0, 0.9) 10px,
                rgba(250, 182, 23, 0.15) 10px,
                rgba(250, 182, 23, 0.15) 20px
              ),
              linear-gradient(to right, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8))
            `
          }}>
            <div className="p-4 border-b border-yellow-500/30">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-yellow-400 tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  MEK RECRUITMENT
                </h2>
                <button onClick={onClose} className="text-gray-500 hover:text-yellow-400 transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Modal Body */}
          <div className="p-4 overflow-y-auto bg-black/40" style={{
            maxHeight: mekCount <= 10 ? 'calc(70vh - 100px)' : mekCount <= 40 ? 'calc(75vh - 100px)' : 'calc(80vh - 100px)'
          }}>
            {/* Help Description */}
            <div className="bg-gray-800/30 border border-yellow-400/20 rounded-lg p-3 mb-3">
              <p className="text-gray-300 text-sm leading-relaxed">
                Select a Mek from your collection to assign to this contract slot. Meks with matching variation buffs 
                <span className="text-yellow-400 font-semibold"> increase success chance</span>. Power chips below each Mek indicate:
                <span className="text-green-400"> ● Active</span>,
                <span className="text-yellow-400"> ● Buffed</span>,
                <span className="text-gray-600"> ● Empty</span>.
              </p>
            </div>

            {/* Controls */}
            <div className="mb-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search meks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-gray-900/80 border border-gray-700 text-yellow-400 px-3 py-2 rounded focus:border-yellow-500 focus:outline-none"
                />
                <button
                  onClick={() => setShowOnlyMatches(!showOnlyMatches)}
                  className={`px-4 py-2 rounded font-medium transition-all ${
                    showOnlyMatches 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Show Matches Only
                </button>
              </div>

              {/* Buff Filters - Circular style matching main mission card */}
              <div className="flex flex-wrap gap-3">
                {missionMultipliers.map(mult => {
                  const isActive = activeBuffFilters.includes(mult.id);
                  
                  return (
                    <button
                      key={mult.id}
                      onClick={() => toggleBuffFilter(mult.id)}
                      className="group transition-all hover:scale-110"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`
                          relative w-[70px] h-[70px] rounded-full bg-black/60 border-2 overflow-hidden
                          ${isActive ? 'border-yellow-400 shadow-lg shadow-yellow-400/30' : 'border-gray-700'}
                          transition-all
                        `}>
                          <Image
                            src={mult.image}
                            alt={mult.id}
                            fill
                            className="rounded-full object-cover"
                            sizes="70px"
                          />
                        </div>
                        <div className={`text-[11px] font-medium mt-1 ${isActive ? 'text-white' : 'text-gray-400'} uppercase tracking-wider text-center`}>
                          {mult.name}
                        </div>
                        <div className={`text-xs font-bold ${isActive ? 'text-yellow-400 drop-shadow-[0_0_4px_rgba(250,182,23,0.5)]' : 'text-gray-500'}`}>
                          {mult.bonus}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {activeBuffFilters.length > 0 && (
                  <button
                    onClick={() => setActiveBuffFilters([])}
                    className="px-3 py-1 bg-red-900/50 text-red-400 rounded-full text-xs font-medium hover:bg-red-900/70"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Mek Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {displayMeks.map(({ mek, matchedTraits, hasMatch, powerChips }) => {
                const cardClass = getMekCardStyle(mekCardStyle, hasMatch, matchedTraits);
                
                return (
                  <div
                    key={mek.name}
                    onClick={() => onMekSelection(mek, matchedTraits, hasMatch)}
                    className={`
                      ${cardClass}
                      cursor-pointer group relative overflow-hidden
                      hover:scale-105 transition-all duration-200
                    `}
                    style={{
                      background: `
                        radial-gradient(circle at 20% 30%, rgba(250, 182, 23, 0.08) 0%, transparent 30%),
                        radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 25%),
                        radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 40%),
                        linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(0, 0, 0, 0.98) 50%, rgba(17, 24, 39, 0.95) 100%)`
                    }}
                  >
                    {/* Mek Display */}
                    <div className="p-1">
                      {/* Bonus indicator */}
                      {hasMatch && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
                          +{matchedTraits.reduce((acc, t) => acc + parseInt(t?.bonus.replace("+", "").replace("%", "") || "0"), 0)}%
                        </div>
                      )}
                      
                      {/* Mek Image */}
                      <div className="relative w-full aspect-square overflow-hidden rounded bg-black/40 mb-1">
                        <Image
                          src={mek.image}
                          alt={mek.name}
                          width={150}
                          height={150}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = getMediaUrl(`/mek-images/150px/mek${String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0')}.png`);
                          }}
                        />
                      </div>
                      
                      {/* Mek Name and Level */}
                      <div className="text-[10px] text-center text-gray-300 mb-1 truncate">
                        {mek.name} <span className="text-yellow-400 font-bold">Lv.{mek.level || 1}</span>
                      </div>
                      
                      {/* Trait Indicators */}
                      <div className={`flex ${traitCircleStyle === 10 ? 'flex-col gap-1' : 'justify-center gap-1'} px-1`}>
                        {mek.traits.slice(0, 3).map((trait, i) => {
                          const isMatched = matchedTraits.some(mt => mt?.id === trait);
                          const style = getTraitCircleStyle(traitCircleStyle, trait, isMatched);
                          
                          return (
                            <div 
                              key={i}
                              className={style.container}
                              title={`${trait}: ${isMatched ? 'Matched!' : 'No match'}`}
                            >
                              {style.content}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}