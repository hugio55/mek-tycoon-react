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

// OPTION 2: High Contrast Industrial - Neon accents, glowing borders, dark theme
export default function MekRecruitmentModalV2({
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
        className="fixed inset-0 bg-black z-[9999] flex items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%),
            linear-gradient(to bottom, #000000, #0a0a0a)
          `
        }}
      >
        <div 
          className="w-full max-w-7xl mx-4 my-8 bg-black border border-cyan-400 shadow-2xl"
          style={{ 
            minWidth: '900px', 
            maxHeight: '90vh',
            boxShadow: '0 0 60px rgba(34, 211, 238, 0.5), inset 0 0 30px rgba(139, 92, 246, 0.2)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Cyberpunk style */}
          <div className="relative bg-black border-b border-cyan-400 p-5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-cyan-400/10 to-purple-600/10 animate-pulse" />
            <div className="relative flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-black tracking-widest" 
                    style={{ 
                      fontFamily: "'Orbitron', sans-serif",
                      color: '#00ffff',
                      textShadow: '0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(139, 92, 246, 0.5)'
                    }}>
                  NEURAL LINK INTERFACE
                </h2>
                <div className="flex gap-4 mt-2">
                  <span className="text-cyan-400 text-sm font-mono">
                    ▸ MATCHES: {displayMeks.filter(m => m.hasMatch).length}
                  </span>
                  <span className="text-purple-400 text-sm font-mono">
                    ▸ AVAILABLE: {displayMeks.length}
                  </span>
                  <span className="text-green-400 text-sm font-mono animate-pulse">
                    ▸ STATUS: ONLINE
                  </span>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-12 h-12 bg-black border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-all flex items-center justify-center"
                style={{ boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}
              >
                <span className="text-2xl font-bold">✕</span>
              </button>
            </div>
          </div>
          
          {/* Body */}
          <div className="overflow-y-auto bg-black" 
               style={{ maxHeight: 'calc(90vh - 100px)' }}>
            
            {/* Controls Section */}
            <div className="p-4 border-b border-purple-900/50">
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="NEURAL SEARCH..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black border border-cyan-400/50 text-cyan-400 px-4 py-3 font-mono tracking-wider focus:border-cyan-400 focus:outline-none placeholder-gray-600"
                    style={{ boxShadow: 'inset 0 0 10px rgba(34, 211, 238, 0.2)' }}
                  />
                  <div className="absolute right-3 top-3 text-cyan-400 animate-pulse">⚡</div>
                </div>
                <button
                  onClick={() => setShowOnlyMatches(!showOnlyMatches)}
                  className={`px-8 py-3 font-bold tracking-wider transition-all ${
                    showOnlyMatches 
                      ? 'bg-gradient-to-r from-cyan-400 to-purple-600 text-black border border-white' 
                      : 'bg-black text-gray-500 border border-gray-800 hover:border-gray-600'
                  }`}
                  style={{
                    boxShadow: showOnlyMatches ? '0 0 30px rgba(34, 211, 238, 0.6)' : 'none'
                  }}
                >
                  {showOnlyMatches ? '◉ FILTERED' : '○ SHOW ALL'}
                </button>
              </div>

              {/* Variation Bubbles - Neon style */}
              <div className="flex justify-center items-center gap-3 flex-wrap">
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
                        w-24 h-24 bg-black border-2 overflow-hidden transition-all relative
                        ${isActive 
                          ? 'border-cyan-400 scale-110' 
                          : 'border-gray-800 hover:border-purple-600'
                        }
                      `}
                      style={{
                        boxShadow: isActive 
                          ? '0 0 30px rgba(34, 211, 238, 0.8), inset 0 0 20px rgba(139, 92, 246, 0.4)' 
                          : isHovered 
                            ? '0 0 20px rgba(139, 92, 246, 0.6)' 
                            : 'none'
                      }}>
                        <Image
                          src={mult.image}
                          alt={mult.id}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                        {isActive && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/40 to-transparent" />
                            <div className="absolute top-1 right-1 w-3 h-3 bg-cyan-400 animate-pulse" />
                          </>
                        )}
                      </div>
                      <div className="text-center mt-2">
                        <div className={`text-xs font-mono ${isActive ? 'text-cyan-400' : 'text-gray-600'}`}>
                          {mult.name.toUpperCase()}
                        </div>
                        <div className={`text-lg font-black ${isActive ? 'text-white' : 'text-gray-700'}`}
                             style={{ textShadow: isActive ? '0 0 10px rgba(34, 211, 238, 0.8)' : 'none' }}>
                          {mult.bonus}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mek Grid - Cyberpunk style */}
            <div className="p-6 bg-gradient-to-b from-black to-gray-950">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
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
                      relative cursor-pointer transition-all duration-300 border bg-black
                      ${hasMatch 
                        ? 'border-cyan-400 scale-105 z-20' 
                        : 'border-gray-900 hover:border-purple-600 opacity-60 hover:opacity-100'
                      }
                      hover:scale-110 hover:z-30
                    `}
                    style={{ 
                      minWidth: '180px',
                      boxShadow: hasMatch 
                        ? '0 0 40px rgba(34, 211, 238, 0.6), inset 0 0 20px rgba(139, 92, 246, 0.3)' 
                        : hoveredMekIndex === index 
                          ? '0 0 20px rgba(139, 92, 246, 0.4)' 
                          : 'none'
                    }}
                  >
                    {/* Match Indicator - Glowing animation */}
                    {hasMatch && (
                      <>
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-cyan-400 to-purple-600 text-black text-lg font-black px-3 py-1 z-30">
                          +{totalBonus}%
                        </div>
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute inset-0 border border-cyan-400 animate-ping" />
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent animate-pulse" />
                        </div>
                      </>
                    )}
                    
                    {/* Mek Image */}
                    <div className="relative w-full aspect-square bg-gray-950 overflow-hidden">
                      <Image
                        src={mek.image}
                        alt={mek.name}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                        style={{ filter: hasMatch ? 'brightness(1.2) contrast(1.1)' : 'brightness(0.8)' }}
                      />
                      {hasMatch && (
                        <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/30 via-transparent to-purple-600/20" />
                      )}
                    </div>
                    
                    {/* Mek Info */}
                    <div className="p-2 bg-black border-t border-gray-900">
                      <div className="text-sm font-bold text-center mb-2">
                        <span className={hasMatch ? 'text-cyan-400' : 'text-gray-500'}
                              style={{ textShadow: hasMatch ? '0 0 10px rgba(34, 211, 238, 0.6)' : 'none' }}>
                          {mek.name}
                        </span>
                        <span className="text-purple-400 ml-1 font-mono">L{mek.level || 1}</span>
                      </div>
                      
                      {/* Chip Slots - Neon indicators */}
                      <div className="flex justify-center gap-2">
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
                                w-12 h-4 border flex items-center justify-center overflow-hidden
                                ${isMatched 
                                  ? 'bg-gradient-to-r from-cyan-400 to-purple-600 border-white' 
                                  : 'bg-gray-900 border-gray-800'
                                }
                              `}
                              style={{
                                boxShadow: isMatched ? '0 0 15px rgba(34, 211, 238, 0.6)' : 'none'
                              }}>
                                {isMatched && (
                                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                )}
                              </div>
                              
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black border border-cyan-400 text-cyan-400 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50"
                                   style={{ boxShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}>
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