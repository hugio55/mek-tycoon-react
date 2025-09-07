'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { successMultipliers } from '../constants/missionData';
import { generateSampleMeks } from '../utils/helpers';
import ModalPortal from './ModalPortal';

interface MekRecruitmentModalV4Props {
  showMekModal: string | null;
  selectedMekSlot: { missionId: string; slotIndex: number } | null;
  onClose: () => void;
  onMekSelection: (mek: any, matchedTraits: any[], hasMatch: boolean) => void;
  mekCount: number;
  mekCardStyle: number;
  traitCircleStyle: number;
  mekFrameStyle: number;
}

// 5 UI Style Variations
const uiStyles = {
  minimal: {
    name: "Minimal Clean",
    borderWidth: "border",
    borderColor: "border-gray-600",
    matchBorderColor: "border-yellow-400",
    matchBorderWidth: "border",
    bgCard: "bg-gray-950",
    bgCardMatch: "bg-gray-900",
    chipBg: "bg-gray-800",
    chipBgMatch: "bg-yellow-400",
    spacing: "gap-3",
  },
  thin: {
    name: "Thin Lines",
    borderWidth: "border",
    borderColor: "border-gray-700/50",
    matchBorderColor: "border-yellow-400/70",
    matchBorderWidth: "border",
    bgCard: "bg-black",
    bgCardMatch: "bg-black",
    chipBg: "bg-gray-900",
    chipBgMatch: "bg-yellow-500",
    spacing: "gap-2",
  },
  thick: {
    name: "Bold Frames",
    borderWidth: "border-2",
    borderColor: "border-gray-700",
    matchBorderColor: "border-yellow-400",
    matchBorderWidth: "border-4",
    bgCard: "bg-gray-950",
    bgCardMatch: "bg-gray-900",
    chipBg: "bg-gray-800",
    chipBgMatch: "bg-yellow-400",
    spacing: "gap-4",
  },
  gradient: {
    name: "Gradient Borders",
    borderWidth: "border",
    borderColor: "border-gray-700/50",
    matchBorderColor: "border-gray-600",
    matchBorderWidth: "border-2",
    bgCard: "bg-gradient-to-br from-gray-950 to-black",
    bgCardMatch: "bg-gradient-to-br from-yellow-950/20 to-black",
    chipBg: "bg-gray-800",
    chipBgMatch: "bg-gradient-to-br from-yellow-400 to-yellow-600",
    spacing: "gap-3",
  },
  double: {
    name: "Double Lines",
    borderWidth: "ring-1 ring-gray-600",
    borderColor: "border border-gray-800",
    matchBorderColor: "border-yellow-400 ring-yellow-500",
    matchBorderWidth: "border ring-2",
    bgCard: "bg-black",
    bgCardMatch: "bg-black",
    chipBg: "bg-gray-900",
    chipBgMatch: "bg-yellow-400",
    spacing: "gap-4",
  },
};

export default function MekRecruitmentModalV4({
  showMekModal,
  selectedMekSlot,
  onClose,
  onMekSelection,
  mekCount,
}: MekRecruitmentModalV4Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeBuffFilters, setActiveBuffFilters] = useState<string[]>([]);
  const [showOnlyMatches, setShowOnlyMatches] = useState(false);
  const [allMeks] = useState(() => generateSampleMeks(mekCount));
  const [hoveredMekIndex, setHoveredMekIndex] = useState<number | null>(null);
  const [hoveredVariation, setHoveredVariation] = useState<string | null>(null);
  const [currentStyle, setCurrentStyle] = useState<keyof typeof uiStyles>('gradient');
  const [variationCount, setVariationCount] = useState<1 | 5 | 10>(5);
  const [sortByMatch, setSortByMatch] = useState(true);
  const [hoveredMekBonus, setHoveredMekBonus] = useState<number>(0);

  if (!showMekModal || !selectedMekSlot) return null;

  const style = uiStyles[currentStyle];
  const missionId = selectedMekSlot.missionId;
  const isGlobal = missionId === 'global';
  
  // Variable variation count (1, 5, or 10)
  const missionMultipliers = successMultipliers.slice(0, variationCount);

  const toggleBuffFilter = (buffId: string) => {
    setActiveBuffFilters(prev => {
      const newFilters = prev.includes(buffId) 
        ? prev.filter(id => id !== buffId)
        : [...prev, buffId];
      // Auto-sort when filter is applied
      if (!prev.includes(buffId)) {
        setSortByMatch(true);
      }
      return newFilters;
    });
  };

  // Check which variations should pulsate (have matches but not filtered)
  const getUnfilteredMatchingVariations = () => {
    const matchingVariations = new Set<string>();
    allMeks.forEach(mek => {
      mek.traits.forEach((trait: string) => {
        if (missionMultipliers.some(m => m.id === trait) && !activeBuffFilters.includes(trait)) {
          matchingVariations.add(trait);
        }
      });
    });
    return matchingVariations;
  };

  const unfilteredMatches = getUnfilteredMatchingVariations();

  // Filter meks
  const filteredMeks = allMeks.filter(mek => {
    if (activeBuffFilters.length > 0) {
      const hasFilteredBuff = mek.traits.some((trait: string) => 
        activeBuffFilters.includes(trait)
      );
      if (!hasFilteredBuff) return false;
    }
    
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const matchesNumber = mek.name.toLowerCase().includes(query);
      const matchesStyle = mek.style.toLowerCase().includes(query);
      const matchesVariation = mek.traits.some((t: string) => t.toLowerCase().includes(query));
      
      if (!matchesNumber && !matchesStyle && !matchesVariation) return false;
    }
    
    return true;
  });

  const displayMeks = filteredMeks.map((mek: any, index: number) => {
    const matchedTraits = mek.traits.filter((t: string) => 
      missionMultipliers.some(m => m.id === t)
    ).map((t: string) => missionMultipliers.find(m => m.id === t));
    
    const hasMatch = matchedTraits.length > 0;
    const totalBonus = matchedTraits.reduce((sum: number, trait: any) => 
      sum + parseInt(trait?.bonus?.replace('+', '').replace('%', '') || '0'), 0
    );
    
    if (showOnlyMatches && !hasMatch) return null;
    
    return { mek, matchedTraits, hasMatch, totalBonus, index };
  }).filter(Boolean);

  // Sort matched meks first if sortByMatch is true
  if (sortByMatch) {
    displayMeks.sort((a: any, b: any) => {
      if (a.hasMatch && !b.hasMatch) return -1;
      if (!a.hasMatch && b.hasMatch) return 1;
      return b.totalBonus - a.totalBonus;
    });
  }

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[9999] flex items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div 
          className="w-full max-w-[800px] mx-auto my-8 relative"
          style={{ maxHeight: '90vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Industrial textured background with warm tones */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/30 via-stone-950/95 to-black">
            <div className="absolute inset-0 opacity-30" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
                mixBlendMode: 'overlay'
              }}
            />
          </div>
          
          {/* Main container with industrial frame style J */}
          <div className="relative bg-stone-950/60 backdrop-blur-md border-2 border-amber-900/40 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-amber-950/20 via-transparent to-transparent pointer-events-none" />
            
            
            {/* Industrial header with warm tones */}
            <div className="relative bg-gradient-to-b from-stone-900/80 to-amber-950/40 border-b-2 border-amber-900/30 p-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h2 className="text-xl font-black text-gray-100 tracking-wider uppercase" 
                      style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif", letterSpacing: '0.1em' }}>
                    Mek Recruitment
                  </h2>
                  <p className="text-stone-500 text-xs mt-1 font-medium">
                    {displayMeks.filter((m: any) => m.hasMatch).length} MATCHES • {displayMeks.length} TOTAL
                  </p>
                </div>
                
                {/* Epic Success Rate Progress Bar */}
                <div className="flex items-center gap-3 mr-4">
                  <div className="w-48">
                    <div className="text-[11px] text-gray-400 uppercase tracking-wider font-bold mb-1">Success Rate</div>
                    <div className="h-8 bg-black border-2 border-amber-900/50 relative overflow-hidden">
                      {/* Industrial grid pattern background */}
                      <div className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: `repeating-linear-gradient(
                            90deg,
                            transparent,
                            transparent 2px,
                            #78350f 2px,
                            #78350f 3px
                          ),
                          repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 2px,
                            #78350f 2px,
                            #78350f 3px
                          )`
                        }}
                      />
                      
                      {/* Main progress fill */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400 transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, (displayMeks.filter((m: any) => m.hasMatch).length / Math.max(1, displayMeks.length)) * 100)}%`,
                          clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)'
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                      
                      {/* Ghost preview on hover */}
                      {hoveredMekBonus > 0 && (
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-green-600/30 to-green-400/30 transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, ((displayMeks.filter((m: any) => m.hasMatch).length / Math.max(1, displayMeks.length)) * 100) + hoveredMekBonus)}%`,
                            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)',
                            left: `${Math.min(100, (displayMeks.filter((m: any) => m.hasMatch).length / Math.max(1, displayMeks.length)) * 100)}%`
                          }}
                        />
                      )}
                      
                      {/* Percentage display */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
                          style={{ fontFamily: "'Orbitron', 'Bebas Neue', monospace" }}>
                          {Math.round((displayMeks.filter((m: any) => m.hasMatch).length / Math.max(1, displayMeks.length)) * 100)}%
                          {hoveredMekBonus > 0 && (
                            <span className="text-green-400 text-sm ml-1">+{hoveredMekBonus}%</span>
                          )}
                        </span>
                      </div>
                      
                      {/* Industrial border highlights */}
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
                    </div>
                  </div>
                </div>
                
                {/* Close button */}
                <button 
                  onClick={onClose} 
                  className="w-8 h-8 bg-red-900/30 hover:bg-red-600/50 border border-red-800/50 hover:border-red-500 text-stone-400 hover:text-white transition-all flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto relative z-10" style={{ maxHeight: 'calc(85vh - 100px)' }}>
              
              {/* Compact description */}
              <div className="px-4 pb-2 pt-3">
                <p className="text-stone-400 text-xs text-center">
                  Meks with matching traits 
                  <span className="text-green-400 font-semibold"> boost success</span>
                </p>
              </div>

              {/* Variation Bubbles - No glow/pulsate by default, only on hover */}
              <div className="p-3 mx-3 my-2 bg-amber-950/20 border border-amber-900/30 backdrop-blur-sm">
                <div className="flex justify-center">
                  <div className="grid grid-cols-5 gap-2">
                    {missionMultipliers.slice(0, 5).map((mult) => {
                      const isActive = activeBuffFilters.includes(mult.id);
                      const isHovered = hoveredVariation === mult.id;
                      const mekHasThisTrait = hoveredMekIndex !== null && 
                        allMeks[hoveredMekIndex]?.traits.includes(mult.id);
                      
                      return (
                        <button
                          key={mult.id}
                          onClick={() => toggleBuffFilter(mult.id)}
                          className="group transition-all hover:scale-105"
                        >
                          <div className="flex flex-col items-center">
                            <div className={`
                              relative w-[60px] h-[60px] rounded-full bg-black/60 border-2 overflow-hidden
                              transition-all duration-200
                              ${isActive ? 'border-yellow-400 shadow-lg shadow-yellow-400/30' :
                                mekHasThisTrait ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,182,23,0.6),0_0_25px_rgba(250,182,23,0.3)]' : 
                                'border-stone-600 hover:border-stone-500'}
                            `}>
                              <Image
                                src="/variation-images/acid.jpg"
                                alt={mult.id}
                                fill
                                className="rounded-full object-cover"
                                sizes="60px"
                              />
                            </div>
                            <div className={`text-[10px] font-medium mt-1 uppercase tracking-wider text-center
                              ${isActive ? 'text-white' : 
                                mekHasThisTrait ? 'text-yellow-400' : 'text-stone-500'}
                            `}>
                              {mult.name}
                            </div>
                            <div className={`text-xs font-bold
                              ${isActive ? 'text-yellow-400' : 
                                mekHasThisTrait ? 'text-green-400' : 'text-stone-600'}
                            `}>
                              {mult.bonus}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Search Bar - Compact */}
              <div className="px-4 pb-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-black/50 border border-amber-900/40 text-stone-300 px-2 py-1.5 text-xs focus:border-amber-800/60 focus:outline-none"
                  />
                  <button
                    onClick={() => setShowOnlyMatches(!showOnlyMatches)}
                    className={`px-3 py-1.5 text-xs font-medium transition-all ${
                      showOnlyMatches 
                        ? 'bg-yellow-500/80 text-black' 
                        : 'bg-stone-800/50 text-stone-400 hover:bg-stone-700/50'
                    }`}
                  >
                    Matches
                  </button>
                </div>
              </div>

              {/* Mek Grid - 5 column layout */}
              <div className="p-4">
                <div className="grid grid-cols-5 gap-2">
                  {displayMeks.map(({ mek, matchedTraits, hasMatch, totalBonus, index }: any) => {
                    const actualIndex = allMeks.findIndex((m: any) => m.name === mek.name);
                    return (
                      <div
                        key={mek.name}
                        onClick={() => onMekSelection(mek, matchedTraits, hasMatch)}
                        onMouseEnter={() => {
                          setHoveredMekIndex(actualIndex);
                          setHoveredMekBonus(totalBonus);
                          if (matchedTraits.length > 0) {
                            setHoveredVariation(matchedTraits[0].id);
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredMekIndex(null);
                          setHoveredVariation(null);
                          setHoveredMekBonus(0);
                        }}
                        className={`
                          relative cursor-pointer transition-all duration-200 overflow-hidden
                          ${hasMatch 
                            ? `bg-gradient-to-b from-amber-950/40 to-black/90 border border-amber-900/40 shadow-xl shadow-yellow-400/20` 
                            : `bg-black/40 border border-stone-700/40 hover:border-stone-600`
                          }
                          hover:scale-105 hover:z-10
                        `}
                      >
                        
                        {/* Mek Image */}
                        <div className="relative w-full aspect-square bg-black/50 overflow-hidden">
                          <Image
                            src={mek.image}
                            alt={mek.name}
                            width={150}
                            height={150}
                            className="w-full h-full object-cover"
                          />
                          {/* Subtle gradient overlay for depth */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        </div>
                        
                        {/* Mek Info */}
                        <div className="p-1.5 bg-black/60">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-[10px] font-bold ${hasMatch ? 'text-yellow-400' : 'text-stone-400'}`}>
                              {mek.name}
                            </span>
                            <span className="text-stone-300 text-[10px] font-semibold">Lv.{mek.level || 1}</span>
                          </div>
                          
                          {/* Chip Slots - smaller and more compact */}
                          <div className="flex items-center justify-center">
                            <div className="flex gap-1">
                              {mek.traits.slice(0, 3).map((trait: string, i: number) => {
                                const isMatched = matchedTraits.some((mt: any) => mt?.id === trait);
                                const traitData = successMultipliers.find(m => m.id === trait);
                                
                                return (
                                  <div 
                                    key={i}
                                    className="relative group"
                                  >
                                    <div className={`
                                      w-10 h-10 rounded-full border overflow-hidden transition-all
                                      ${isMatched 
                                        ? `bg-yellow-400 border-yellow-600 animate-pulse shadow-[0_0_4px_rgba(250,182,23,0.6)]` 
                                        : `bg-stone-700 border-stone-600 opacity-80`
                                      }
                                    `}>
                                      <Image
                                        src="/variation-images/acid.jpg"
                                        alt={trait}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover rounded-full"
                                      />
                                    </div>
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black/90 border border-stone-600 text-stone-300 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                                      {trait}
                                      {isMatched && <span className="text-green-400 ml-1">+{matchedTraits.find((mt: any) => mt?.id === trait)?.bonus}</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
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
      </div>
    </ModalPortal>
  );
}