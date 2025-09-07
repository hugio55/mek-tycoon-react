'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { successMultipliers } from '../constants/missionData';
import { generateSampleMeks } from '../utils/helpers';
import ModalPortal from './ModalPortal';

interface MekRecruitmentModalProps {
  showMekModal: string | null;
  selectedMekSlot: { missionId: string; slotIndex: number } | null;
  onClose: () => void;
  onMekSelection: (mek: any, matchedTraits: any[], hasMatch: boolean) => void;
  mekCount: number;
}

// OPTION 1: User Specification - Industrial/Modern with Sharp Edges
export default function MekRecruitmentModalV1({
  showMekModal,
  selectedMekSlot,
  onClose,
  onMekSelection,
  mekCount,
}: MekRecruitmentModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeBuffFilters, setActiveBuffFilters] = useState<string[]>([]);
  const [showOnlyMatches, setShowOnlyMatches] = useState(false);
  const [allMeks] = useState(() => generateSampleMeks(mekCount));
  const [hoveredMekIndex, setHoveredMekIndex] = useState<number | null>(null);
  const [hoveredVariation, setHoveredVariation] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!showMekModal || !selectedMekSlot) return null;
  
  const missionId = selectedMekSlot.missionId;
  const isGlobal = missionId === 'global';
  const missionMultipliers = isGlobal 
    ? successMultipliers.slice(0, 10) // Max 10 bubbles
    : successMultipliers.slice(0, 5);
  
  const toggleBuffFilter = (buffId: string) => {
    setActiveBuffFilters(prev => 
      prev.includes(buffId) 
        ? prev.filter(id => id !== buffId)
        : [...prev, buffId]
    );
  };

  // Filter meks
  const filteredMeks = allMeks.filter(mek => {
    if (activeBuffFilters.length > 0) {
      const hasFilteredBuff = mek.traits.some(trait => 
        activeBuffFilters.includes(trait)
      );
      if (!hasFilteredBuff) return false;
    }
    
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const matchesNumber = mek.name.toLowerCase().includes(query);
      const matchesStyle = mek.style.toLowerCase().includes(query);
      const matchesVariation = mek.traits.some(t => t.toLowerCase().includes(query));
      
      if (!matchesNumber && !matchesStyle && !matchesVariation) return false;
    }
    
    return true;
  });
  
  const meksToDisplay = filteredMeks.map((mek, index) => {
    const matchedTraits = mek.traits.filter(t => 
      missionMultipliers.some(m => m.id === t)
    ).map(t => missionMultipliers.find(m => m.id === t));
    
    const hasMatch = matchedTraits.length > 0;
    const totalBonus = matchedTraits.reduce((acc, t) => 
      acc + parseInt(t?.bonus.replace("+", "").replace("%", "") || "0"), 0
    );
    
    return { mek, matchedTraits, hasMatch, totalBonus, index };
  });

  const displayMeks = showOnlyMatches 
    ? meksToDisplay.filter(item => item.hasMatch)
    : meksToDisplay;

  // Sort by match status and bonus
  displayMeks.sort((a, b) => {
    if (a.hasMatch && !b.hasMatch) return -1;
    if (!a.hasMatch && b.hasMatch) return 1;
    return b.totalBonus - a.totalBonus;
  });

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div 
          className="w-full max-w-7xl mx-4 my-8 bg-black border-4 border-yellow-400/80 shadow-2xl shadow-yellow-400/20"
          style={{ minWidth: '800px', maxHeight: '85vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Industrial style with sharp edges */}
          <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b-2 border-yellow-400/50 p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-yellow-400 tracking-wider" 
                    style={{ fontFamily: "'Orbitron', 'Bebas Neue', sans-serif" }}>
                  MEK RECRUITMENT INTERFACE
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {displayMeks.filter(m => m.hasMatch).length} MATCHES FOUND | {displayMeks.length} TOTAL MEKS
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 bg-red-900/50 hover:bg-red-600 border-2 border-red-500 text-white transition-all flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Body */}
          <div className="overflow-y-auto bg-gradient-to-b from-gray-950 to-black" 
               style={{ maxHeight: 'calc(85vh - 80px)' }}>
            
            {/* Controls Section */}
            <div className="p-4 border-b-2 border-gray-800">
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  placeholder="SEARCH MEKS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-black border-2 border-gray-700 text-yellow-400 px-4 py-2 text-sm font-mono tracking-wider focus:border-yellow-500 focus:outline-none placeholder-gray-600"
                />
                <button
                  onClick={() => setShowOnlyMatches(!showOnlyMatches)}
                  className={`px-6 py-2 font-bold tracking-wider transition-all border-2 ${
                    showOnlyMatches 
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/30' 
                      : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  MATCHES ONLY
                </button>
              </div>

              {/* Variation Bubbles - Center aligned, max 10 */}
              <div className="flex justify-center items-center gap-2 flex-wrap">
                {missionMultipliers.map(mult => {
                  const isActive = activeBuffFilters.includes(mult.id);
                  const isHovered = hoveredVariation === mult.id;
                  
                  return (
                    <button
                      key={mult.id}
                      onClick={() => toggleBuffFilter(mult.id)}
                      onMouseEnter={() => setHoveredVariation(mult.id)}
                      onMouseLeave={() => setHoveredVariation(null)}
                      className="group relative"
                    >
                      <div className={`
                        w-20 h-20 bg-black border-3 overflow-hidden transition-all
                        ${isActive ? 'border-yellow-400 shadow-xl shadow-yellow-400/40 scale-110' : 'border-gray-700 hover:border-gray-500'}
                        ${isHovered ? 'ring-4 ring-yellow-400/30' : ''}
                      `}>
                        <Image
                          src={mult.image}
                          alt={mult.id}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                        {isActive && (
                          <div className="absolute inset-0 bg-yellow-400/20 animate-pulse" />
                        )}
                      </div>
                      <div className="text-center mt-1">
                        <div className={`text-xs font-bold ${isActive ? 'text-yellow-400' : 'text-gray-500'}`}>
                          {mult.name.toUpperCase()}
                        </div>
                        <div className={`text-sm font-black ${isActive ? 'text-white' : 'text-gray-600'}`}>
                          {mult.bonus}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mek Grid - Fixed width to prevent cutoff */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {displayMeks.map(({ mek, matchedTraits, hasMatch, totalBonus, index }) => (
                  <div
                    key={mek.name}
                    onClick={() => onMekSelection(mek, matchedTraits, hasMatch)}
                    onMouseEnter={() => {
                      setHoveredMekIndex(index);
                      if (matchedTraits.length > 0) {
                        setHoveredVariation(matchedTraits[0].id);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredMekIndex(null);
                      setHoveredVariation(null);
                    }}
                    className={`
                      relative cursor-pointer transition-all duration-200 border-4
                      ${hasMatch 
                        ? 'bg-gradient-to-b from-yellow-900/30 to-black border-yellow-400 shadow-2xl shadow-yellow-400/30 scale-105 z-10' 
                        : 'bg-gray-950 border-gray-800 hover:border-gray-600 opacity-75 hover:opacity-100'
                      }
                      hover:scale-110 hover:z-20
                    `}
                    style={{ minWidth: '180px' }}
                  >
                    {/* Match Indicator - VERY OBVIOUS */}
                    {hasMatch && (
                      <>
                        <div className="absolute -top-3 -right-3 bg-yellow-400 text-black text-lg font-black px-3 py-1 z-30 animate-pulse">
                          +{totalBonus}%
                        </div>
                        <div className="absolute inset-0 border-2 border-yellow-400 animate-pulse pointer-events-none" />
                      </>
                    )}
                    
                    {/* Mek Image */}
                    <div className="relative w-full aspect-square bg-black/50 overflow-hidden">
                      <Image
                        src={mek.image}
                        alt={mek.name}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                      {hasMatch && (
                        <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/30 to-transparent" />
                      )}
                    </div>
                    
                    {/* Mek Info */}
                    <div className="p-2 bg-black/80">
                      <div className="text-sm font-bold text-center mb-2">
                        <span className={hasMatch ? 'text-yellow-400' : 'text-gray-400'}>
                          {mek.name}
                        </span>
                        <span className="text-white ml-1">Lv.{mek.level || 1}</span>
                      </div>
                      
                      {/* Chip Slots - Fixed width with tooltips */}
                      <div className="flex justify-center gap-1">
                        {mek.traits.slice(0, 3).map((trait, i) => {
                          const isMatched = matchedTraits.some(mt => mt?.id === trait);
                          const isHoveredTrait = hoveredVariation === trait;
                          
                          return (
                            <div 
                              key={i}
                              className="relative group"
                              title={trait}
                            >
                              <div className={`
                                w-10 h-10 border-2 flex items-center justify-center
                                ${isMatched 
                                  ? 'bg-yellow-400 border-yellow-600 text-black' 
                                  : 'bg-gray-800 border-gray-700 text-gray-500'
                                }
                                ${isHoveredTrait ? 'ring-2 ring-yellow-400' : ''}
                              `}>
                                <span className="text-xs font-bold">
                                  {trait.substring(0, 3).toUpperCase()}
                                </span>
                              </div>
                              
                              {/* Tooltip on hover */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-yellow-400 text-yellow-400 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                                {trait}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}