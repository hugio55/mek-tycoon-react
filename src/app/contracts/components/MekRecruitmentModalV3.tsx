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

// OPTION 3: Data-Focused Clean - Maximum clarity, professional, color-coded
export default function MekRecruitmentModalV3({
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    
    // Color coding based on match quality
    let matchQuality = 'none';
    if (hasMatch) {
      if (matchedTraits.length >= 3) matchQuality = 'perfect';
      else if (matchedTraits.length === 2) matchQuality = 'good';
      else matchQuality = 'partial';
    }
    
    return { mek, matchedTraits, hasMatch, totalBonus, index, matchQuality };
  });

  const displayMeks = showOnlyMatches 
    ? meksToDisplay.filter(item => item.hasMatch)
    : meksToDisplay;

  // Sort by match quality then bonus
  displayMeks.sort((a, b) => {
    const qualityOrder = { perfect: 0, good: 1, partial: 2, none: 3 };
    const qualityDiff = qualityOrder[a.matchQuality] - qualityOrder[b.matchQuality];
    if (qualityDiff !== 0) return qualityDiff;
    return b.totalBonus - a.totalBonus;
  });

  const getMatchColor = (quality: string) => {
    switch(quality) {
      case 'perfect': return { border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-500', badge: 'bg-green-500' };
      case 'good': return { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500', badge: 'bg-blue-500' };
      case 'partial': return { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-500', badge: 'bg-yellow-500' };
      default: return { border: 'border-gray-700', bg: 'bg-gray-900/50', text: 'text-gray-500', badge: 'bg-gray-700' };
    }
  };

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 bg-gray-950/95 backdrop-blur-sm z-[9999] flex items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div 
          className="w-full max-w-7xl mx-4 my-8 bg-white border border-gray-300 shadow-xl"
          style={{ minWidth: '900px', maxHeight: '90vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Clean professional */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Mek Selection Interface
                </h2>
                <div className="flex gap-6 mt-1">
                  <span className="text-sm text-gray-600">
                    Total Available: <strong className="text-gray-900">{displayMeks.length}</strong>
                  </span>
                  <span className="text-sm text-gray-600">
                    Perfect Matches: <strong className="text-green-600">{displayMeks.filter(m => m.matchQuality === 'perfect').length}</strong>
                  </span>
                  <span className="text-sm text-gray-600">
                    Good Matches: <strong className="text-blue-600">{displayMeks.filter(m => m.matchQuality === 'good').length}</strong>
                  </span>
                  <span className="text-sm text-gray-600">
                    Partial Matches: <strong className="text-yellow-600">{displayMeks.filter(m => m.matchQuality === 'partial').length}</strong>
                  </span>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 hover:text-gray-900 transition-all flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Body */}
          <div className="overflow-y-auto bg-gray-50" 
               style={{ maxHeight: 'calc(90vh - 76px)' }}>
            
            {/* Controls Section */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Search by name, style, or variation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-white border border-gray-300 text-gray-900 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  onClick={() => setShowOnlyMatches(!showOnlyMatches)}
                  className={`px-6 py-2 font-medium transition-all border ${
                    showOnlyMatches 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {showOnlyMatches ? 'Showing Matches' : 'Show All'}
                </button>
                <div className="flex border border-gray-300">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
                  >
                    List
                  </button>
                </div>
              </div>

              {/* Variation Filters - Clean badges */}
              <div className="flex justify-center items-center gap-2 flex-wrap">
                {missionMultipliers.map(mult => {
                  const isActive = activeBuffFilters.includes(mult.id);
                  
                  return (
                    <button
                      key={mult.id}
                      onClick={() => toggleBuffFilter(mult.id)}
                      className={`
                        flex items-center gap-2 px-3 py-2 border transition-all
                        ${isActive 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="w-8 h-8 overflow-hidden">
                        <Image
                          src={mult.image}
                          alt={mult.id}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-medium">{mult.name}</div>
                        <div className="text-sm font-bold">{mult.bonus}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Match Quality Legend */}
              <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500"></div>
                  <span className="text-xs text-gray-600">Perfect Match (3 traits)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500"></div>
                  <span className="text-xs text-gray-600">Good Match (2 traits)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500"></div>
                  <span className="text-xs text-gray-600">Partial Match (1 trait)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400"></div>
                  <span className="text-xs text-gray-600">No Match</span>
                </div>
              </div>
            </div>

            {/* Mek Display */}
            <div className="p-6">
              {viewMode === 'grid' ? (
                // Grid View
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {displayMeks.map(({ mek, matchedTraits, hasMatch, totalBonus, index, matchQuality }) => {
                    const colors = getMatchColor(matchQuality);
                    
                    return (
                      <div
                        key={mek.name}
                        onClick={() => onMekSelection(mek, matchedTraits, hasMatch)}
                        onMouseEnter={() => setHoveredMekIndex(index)}
                        onMouseLeave={() => setHoveredMekIndex(null)}
                        className={`
                          relative cursor-pointer transition-all duration-200 bg-white border-2
                          ${colors.border} ${hasMatch ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}
                          hover:scale-105
                        `}
                        style={{ minWidth: '200px' }}
                      >
                        {/* Match Quality Badge */}
                        {hasMatch && (
                          <div className={`absolute -top-2 -right-2 ${colors.badge} text-white text-xs font-bold px-2 py-1 z-10`}>
                            +{totalBonus}% ({matchedTraits.length}/3)
                          </div>
                        )}
                        
                        {/* Mek Image */}
                        <div className={`relative w-full aspect-square ${colors.bg}`}>
                          <Image
                            src={mek.image}
                            alt={mek.name}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Mek Info */}
                        <div className="p-3 border-t border-gray-200">
                          <div className="font-medium text-gray-900 text-sm mb-1">
                            {mek.name}
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            Level {mek.level || 1} • {mek.rarity}
                          </div>
                          
                          {/* Trait Chips */}
                          <div className="flex gap-1">
                            {mek.traits.slice(0, 3).map((trait, i) => {
                              const isMatched = matchedTraits.some(mt => mt?.id === trait);
                              
                              return (
                                <div 
                                  key={i}
                                  className={`
                                    flex-1 py-1 text-center text-xs font-medium border
                                    ${isMatched 
                                      ? `${colors.border} ${colors.bg} ${colors.text}` 
                                      : 'border-gray-300 bg-gray-50 text-gray-500'
                                    }
                                  `}
                                  title={trait}
                                >
                                  {trait.substring(0, 4)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // List View
                <div className="space-y-2">
                  {displayMeks.map(({ mek, matchedTraits, hasMatch, totalBonus, index, matchQuality }) => {
                    const colors = getMatchColor(matchQuality);
                    
                    return (
                      <div
                        key={mek.name}
                        onClick={() => onMekSelection(mek, matchedTraits, hasMatch)}
                        onMouseEnter={() => setHoveredMekIndex(index)}
                        onMouseLeave={() => setHoveredMekIndex(null)}
                        className={`
                          flex items-center gap-4 p-3 bg-white border-2 cursor-pointer transition-all
                          ${colors.border} hover:shadow-md
                        `}
                      >
                        {/* Mek Image */}
                        <div className="w-16 h-16 flex-shrink-0">
                          <Image
                            src={mek.image}
                            alt={mek.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Mek Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{mek.name}</span>
                            <span className="text-sm text-gray-600">Level {mek.level || 1}</span>
                            {hasMatch && (
                              <span className={`${colors.badge} text-white text-xs font-bold px-2 py-0.5`}>
                                +{totalBonus}%
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-1">
                            {mek.traits.map((trait, i) => {
                              const isMatched = matchedTraits.some(mt => mt?.id === trait);
                              return (
                                <span 
                                  key={i}
                                  className={`
                                    text-xs px-2 py-0.5 border
                                    ${isMatched ? `${colors.border} ${colors.bg} ${colors.text}` : 'border-gray-300 text-gray-500'}
                                  `}
                                >
                                  {trait}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Match Status */}
                        <div className="text-right">
                          <div className={`font-medium ${colors.text}`}>
                            {matchQuality === 'perfect' && 'Perfect Match'}
                            {matchQuality === 'good' && 'Good Match'}
                            {matchQuality === 'partial' && 'Partial Match'}
                            {matchQuality === 'none' && 'No Match'}
                          </div>
                          {hasMatch && (
                            <div className="text-xs text-gray-600">
                              {matchedTraits.length} of 3 traits
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}