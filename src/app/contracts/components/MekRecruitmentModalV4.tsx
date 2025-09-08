/* 
BACKUP: Original State Before SciFi Enhancement
================================================
Key Visual Elements:
- Modal Background: bg-black/65 backdrop-blur-sm
- Main Container: bg-gradient-to-br from-amber-950/30 via-stone-950/95 to-black
- Industrial frame: bg-stone-950/60 backdrop-blur-md border-2 border-amber-900/40
- Header: bg-gradient-to-b from-stone-900/80 to-amber-950/40
- Success Rate Bar: Yellow gradient with grid pattern
- Variation Bubbles: 75x75px circles with border-stone-600
- Mek Cards: 5-column grid, bg-black/40 border-stone-700/40
- Matched Cards: bg-gradient-to-b from-amber-950/40 to-black/90
- Chip Slots: 40x40px circles with pulse animation on match
- Typography: Rajdhani/Orbitron fonts, uppercase headers
- Colors: Amber/yellow for matches, stone/gray for defaults
*/

'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [maxMeksToShow, setMaxMeksToShow] = useState<1 | 5 | 20 | 40 | 100>(20);
  // Generate meks based on the maximum we might show (100), not the initial mekCount
  const [allMeks] = useState(() => generateSampleMeks(100));
  const [hoveredMekIndex, setHoveredMekIndex] = useState<number | null>(null);
  const [hoveredVariation, setHoveredVariation] = useState<string | null>(null);
  const [currentStyle, setCurrentStyle] = useState<keyof typeof uiStyles>('gradient');
  const [variationCount, setVariationCount] = useState<1 | 5 | 10>(5);
  const [sortByMatch, setSortByMatch] = useState(true);
  const [hoveredMekBonus, setHoveredMekBonus] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isZoomedOut, setIsZoomedOut] = useState(false);

  if (!showMekModal || !selectedMekSlot) return null;

  // Calculate pagination values - always use pagination
  const itemsPerPage = isZoomedOut ? 48 : 12; // Always paginate regardless of count
  const columnsPerRow = isZoomedOut ? 8 : 4;

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

  // Calculate total pages based on maxMeksToShow
  const totalMeksToDisplay = Math.min(displayMeks.length, maxMeksToShow);
  const totalPages = Math.ceil(totalMeksToDisplay / itemsPerPage);
  
  // Ensure current page is valid
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }
  
  // Get meks for current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalMeksToDisplay);
  const currentPageMeks = displayMeks.slice(startIndex, endIndex);

  // Particle system for background
  const particleCount = 30;
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 10
  }));

  return (
    <ModalPortal>
      
      {/* Enhanced backdrop with animated particles - click outside to close */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9999] flex items-start justify-center pt-12 overflow-y-auto overflow-x-hidden"
        onClick={onClose}
      >
        {/* Animated backdrop blur effect - reduced by 50% */}
        <div className="absolute inset-0 backdrop-blur-sm" />
        
        {/* Floating particle system */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="absolute rounded-full bg-yellow-400/20 blur-sm"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                '--float-x': `${Math.random() * 60 - 30}px`,
                '--float-y': `${Math.random() * -60 - 30}px`,
                animation: `floatParticle ${particle.duration}s ${particle.delay}s infinite ease-out`
              } as any}
            />
          ))}
        </div>
        
        {/* Hexagonal grid overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L45 8.66L45 26.34L30 35L15 26.34L15 8.66L30 0Z' fill='none' stroke='%23fab617' stroke-width='0.5' opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
            animation: 'hexGrid 4s ease-in-out infinite'
          }}
        />
        <div 
          className="w-full max-w-[900px] mx-auto relative scan-line mb-12"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Industrial hazard stripes overlay */}
          <div className="absolute inset-0 hazard-stripes pointer-events-none rounded-lg" />
          
          {/* Tech grid background */}
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-gray-950 to-black" />
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(250, 182, 23, 0.03) 2px, rgba(250, 182, 23, 0.03) 4px),
                  repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(250, 182, 23, 0.03) 2px, rgba(250, 182, 23, 0.03) 4px),
                  repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(250, 182, 23, 0.01) 5px, rgba(250, 182, 23, 0.01) 10px)
                `,
                backgroundSize: '50px 50px, 50px 50px, 100px 100px'
              }}
            />
            
            {/* Animated data streams */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-px h-32 bg-gradient-to-b from-transparent via-yellow-400/30 to-transparent"
                  style={{
                    left: `${20 + i * 20}%`,
                    animation: `dataStream ${8 + i * 2}s ${i * 0.5}s linear infinite`
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Main container with industrial aesthetic */}
          <div className="relative bg-black/80 backdrop-blur-xl border-2 border-yellow-500/50 rounded-lg overflow-hidden max-w-full">
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-amber-950/20 via-transparent to-transparent pointer-events-none" />
            
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-yellow-400/50" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-yellow-400/50" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-yellow-400/50" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-yellow-400/50" />
            
            
            {/* Industrial header */}
            <div className="relative bg-gradient-to-r from-stone-900/90 via-amber-950/50 to-stone-900/90 border-b-2 border-yellow-500/40 p-4 overflow-hidden max-w-full">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent" />
              </div>
              
              <div className="flex justify-between items-center relative z-10">
                <div className="flex-1">
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 tracking-wider uppercase" 
                      style={{ fontFamily: "'Orbitron', 'Rajdhani', sans-serif", letterSpacing: '0.15em' }}>
                    <span className="neon-glow">MEK RECRUITMENT</span>
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-yellow-400/80 text-xs font-medium uppercase tracking-wider">
                      {displayMeks.filter((m: any) => m.hasMatch).length} MATCHES • {displayMeks.length} AVAILABLE
                    </span>
                  </div>
                </div>
                
                {/* Futuristic Success Rate Display */}
                <div className="flex items-center gap-3 mr-4">
                  <div className="flex-1 min-w-[450px]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] text-yellow-400 uppercase tracking-[0.2em] font-bold">
                        SUCCESS PROBABILITY
                      </div>
                      <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400" 
                        style={{ fontFamily: "'Orbitron', monospace" }}>
                        {Math.round(35 + (hoveredMekBonus || 0))}%
                      </div>
                    </div>
                    
                    {/* Industrial progress bar container */}
                    <div className="h-12 bg-black/60 border border-yellow-500/30 relative overflow-hidden rounded-sm">
                      {/* Tech grid background */}
                      <div className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: `repeating-linear-gradient(
                            90deg,
                            transparent,
                            transparent 10px,
                            rgba(250, 182, 23, 0.1) 10px,
                            rgba(250, 182, 23, 0.1) 11px
                          )`
                        }}
                      />
                      
                      {/* Main progress fill with gradient - FIXED: No full-width animation */}
                      <div 
                        className="absolute inset-0 transition-all duration-700 ease-out"
                        style={{ 
                          width: `${35}%`,
                          background: `linear-gradient(90deg, 
                            rgba(250, 182, 23, 0.8) 0%, 
                            rgba(245, 158, 11, 0.9) 50%, 
                            rgba(250, 182, 23, 0.8) 100%)`,
                          boxShadow: 'inset 0 0 20px rgba(250, 182, 23, 0.4), 0 0 30px rgba(250, 182, 23, 0.3)'
                        }}
                      >
                        {/* Shine effect confined to filled portion only */}
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12" 
                               style={{ animation: 'shimmer 4s infinite' }} />
                        </div>
                        
                        {/* Energy particles - FIXED to flow left to right */}
                        <div className="absolute inset-0 overflow-hidden">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-1 h-1 bg-white rounded-full"
                              style={{
                                top: `${25 + i * 25}%`,
                                left: '0',
                                animation: `particleFlow ${2 + i}s ${i * 0.3}s infinite linear`
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Bonus preview on hover - shows even for non-matching meks (3% base) */}
                      {hoveredMekIndex !== null && (
                        <div 
                          className="absolute inset-0 transition-all duration-500"
                          style={{ 
                            left: `${35}%`,
                            width: `${Math.min(65, hoveredMekBonus || 3)}%`,
                            background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.6), rgba(74, 222, 128, 0.4))',
                            boxShadow: '0 0 20px rgba(34, 197, 94, 0.6), inset 0 0 15px rgba(34, 197, 94, 0.3)'
                          }}
                        >
                          <div className="absolute inset-0 animate-pulse opacity-50 bg-gradient-to-r from-transparent via-green-400/30 to-transparent" />
                        </div>
                      )}
                      
                      {/* Industrial border effects */}
                      <div className="absolute inset-0 border border-yellow-400/20 pointer-events-none" />
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
                      
                      {/* Percentage markers */}
                      {[25, 50, 75].map(percent => (
                        <div
                          key={percent}
                          className="absolute top-0 bottom-0 w-px bg-yellow-500/20"
                          style={{ left: `${percent}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Futuristic close button */}
                <button 
                  onClick={onClose} 
                  className="group relative w-10 h-10 bg-black/60 border border-red-500/40 hover:border-red-400 text-red-400 hover:text-red-300 transition-all flex items-center justify-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-red-500/10 scale-0 group-hover:scale-100 transition-transform duration-300" />
                  <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <div className="absolute -inset-1 bg-red-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>

            {/* Fixed Content Container - No Scrolling */}
            <div className="relative z-10">
              
              {/* System Status */}
              <div className="px-6 pb-3 pt-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
                  <p className="text-yellow-400/80 text-xs uppercase tracking-wider font-medium">
                    TRAIT MATCHING SYSTEM
                  </p>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
                </div>
              </div>

              {/* Industrial Variation Selection */}
              <div className="p-4 mx-4 my-3 relative">
                {/* Background effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-stone-950/10 to-black/20 rounded-lg" />
                <div className="absolute inset-0 border border-yellow-500/20 rounded-lg" />
                
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-yellow-400/40 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-yellow-400/40 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-yellow-400/40 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-yellow-400/40 rounded-br-lg" />
                
                <div className="relative flex justify-center p-2">
                  <div className="grid grid-cols-5 gap-3">
                    {missionMultipliers.slice(0, 5).map((mult) => {
                      const isActive = activeBuffFilters.includes(mult.id);
                      const mekHasThisTrait = hoveredMekIndex !== null && 
                        allMeks[hoveredMekIndex]?.traits.includes(mult.id);
                      
                      return (
                        <button
                          key={mult.id}
                          onClick={() => toggleBuffFilter(mult.id)}
                          className="group relative transition-all hover:scale-110 hover:z-10"
                        >
                          <div className="flex flex-col items-center">
                            {/* Industrial frame */}
                            <div className={`
                              relative w-[80px] h-[80px] p-[2px] rounded-full
                              ${isActive ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-500 shadow-[0_0_8px_rgba(250,182,23,0.8)]' :
                                mekHasThisTrait ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 animate-pulse' : 
                                'bg-gradient-to-br from-gray-800 to-gray-900'}
                              transition-all duration-300
                            `}>
                              <div className={`relative w-full h-full rounded-full overflow-hidden ${!isActive && !mekHasThisTrait ? 'bg-black/95' : 'bg-black'}`}>
                                {/* Glow effect */}
                                {(isActive || mekHasThisTrait) && (
                                  <div className={`absolute inset-0 bg-yellow-400/20 blur-xl animate-pulse`} />
                                )}
                                
                                <Image
                                  src="/variation-images/acid.jpg"
                                  alt={mult.id}
                                  fill
                                  className={`rounded-full object-cover transition-all duration-300 ${
                                    isActive ? 'scale-110 brightness-110' : 
                                    mekHasThisTrait ? 'scale-105 brightness-125' : 
                                    'brightness-50 opacity-60 group-hover:brightness-75 group-hover:opacity-80'
                                  }`}
                                  sizes="80px"
                                />
                                
                                {/* Industrial overlay with gleam */}
                                <div className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300 ${
                                  isActive || mekHasThisTrait ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                                }`}>
                                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-yellow-400/20 rounded-full" />
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-full" />
                                </div>
                                
                                {/* Status indicator */}
                                {isActive && (
                                  <div className="absolute top-1 right-1 w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,182,23,0.8)] animate-pulse" />
                                )}
                              </div>
                            </div>
                            
                            {/* Label with glow effect */}
                            <div className={`text-[11px] font-bold mt-2 uppercase tracking-wider text-center transition-all
                              ${isActive ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(250,182,23,0.8)]' : 
                                mekHasThisTrait ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 
                                'text-gray-600 group-hover:text-gray-500'}
                            `}>
                              {mult.name}
                            </div>
                            
                            {/* Bonus display with animation */}
                            <div className={`text-sm font-black transition-all mt-1
                              ${isActive ? 'text-yellow-400 animate-pulse' : 
                                mekHasThisTrait ? 'text-green-400 animate-pulse' : 
                                'text-gray-700 group-hover:text-gray-600'}
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

              {/* Industrial Search Interface */}
              <div className="px-6 pb-4">
                <div className="flex gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1 max-w-xs">
                    <input
                      type="text"
                      placeholder="SEARCH MEKS..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-black/40 border border-yellow-500/30 text-yellow-300 px-3 py-2 pl-10 text-xs uppercase tracking-wider placeholder-yellow-800 focus:border-yellow-400/50 focus:outline-none focus:shadow-[0_0_15px_rgba(250,182,23,0.2)] transition-all"
                      style={{ fontFamily: "'Orbitron', monospace" }}
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-yellow-500/50 hover:text-yellow-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Filter Toggle */}
                  <button
                    onClick={() => setShowOnlyMatches(!showOnlyMatches)}
                    className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all overflow-hidden group ${
                      showOnlyMatches 
                        ? 'text-black' 
                        : 'text-yellow-400 hover:text-yellow-300'
                    }`}
                  >
                    <div className={`absolute inset-0 transition-all ${
                      showOnlyMatches
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                        : 'bg-black/40 group-hover:bg-black/60'
                    }`} />
                    <div className={`absolute inset-0 border transition-all ${
                      showOnlyMatches
                        ? 'border-yellow-300/50'
                        : 'border-yellow-500/30 group-hover:border-yellow-400/50'
                    }`} />
                    {showOnlyMatches && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-[shimmer_3s_infinite]" />
                    )}
                    <span className="relative z-10">MATCHES ONLY</span>
                  </button>

                  {/* Zoom Out Toggle */}
                  <button
                    onClick={() => {
                      setIsZoomedOut(!isZoomedOut);
                      setCurrentPage(1); // Reset to first page when toggling zoom
                    }}
                    className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all overflow-hidden group ${
                      isZoomedOut 
                        ? 'text-black' 
                        : 'text-yellow-400 hover:text-yellow-300'
                    }`}
                  >
                    <div className={`absolute inset-0 transition-all ${
                      isZoomedOut
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                        : 'bg-black/40 group-hover:bg-black/60'
                    }`} />
                    <div className={`absolute inset-0 border transition-all ${
                      isZoomedOut
                        ? 'border-cyan-300/50'
                        : 'border-yellow-500/30 group-hover:border-yellow-400/50'
                    }`} />
                    {isZoomedOut && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-[shimmer_3s_infinite]" />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isZoomedOut ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                        )}
                      </svg>
                      {isZoomedOut ? 'ZOOM IN' : 'ZOOM OUT'}
                    </span>
                  </button>

                  {/* Max Meks Dropdown */}
                  <div className="relative">
                    <select
                      value={maxMeksToShow}
                      onChange={(e) => {
                        setMaxMeksToShow(Number(e.target.value) as 1 | 5 | 20 | 40 | 100);
                        setCurrentPage(1); // Reset to first page when changing max meks
                      }}
                      className="bg-black/40 border border-yellow-500/30 text-yellow-400 px-3 py-2 text-xs uppercase tracking-wider focus:border-yellow-400/50 focus:outline-none appearance-none pr-8 cursor-pointer transition-all hover:border-yellow-400/40"
                      style={{ fontFamily: "'Orbitron', monospace" }}
                    >
                      <option value={1}>1 MEK</option>
                      <option value={5}>5 MEKS</option>
                      <option value={20}>20 MEKS</option>
                      <option value={40}>40 MEKS</option>
                      <option value={100}>100 MEKS</option>
                    </select>
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500/50 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Industrial Mek Grid */}
              <div className="p-6">
                {/* Pagination Controls - Top */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs text-yellow-400/60 uppercase tracking-wider font-bold">
                    SHOWING {startIndex + 1}-{endIndex} OF {totalMeksToDisplay} MEKS
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                        currentPage === 1
                          ? 'text-gray-600 bg-black/20 border border-gray-800 cursor-not-allowed opacity-50'
                          : 'text-yellow-400 bg-black/40 border border-yellow-500/30 hover:border-yellow-400/50 hover:text-yellow-300 hover:bg-black/60'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 text-xs font-bold transition-all ${
                              currentPage === pageNum
                                ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black border border-yellow-300/50'
                                : 'text-yellow-400/60 bg-black/20 border border-yellow-500/20 hover:border-yellow-400/40 hover:text-yellow-300 hover:bg-black/40'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                        currentPage === totalPages || totalPages === 0
                          ? 'text-gray-600 bg-black/20 border border-gray-800 cursor-not-allowed opacity-50'
                          : 'text-yellow-400 bg-black/40 border border-yellow-500/30 hover:border-yellow-400/50 hover:text-yellow-300 hover:bg-black/60'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="text-xs text-yellow-400/60 uppercase tracking-wider font-bold">
                    PAGE {currentPage} OF {totalPages || 1}
                  </div>
                </div>
                
                <div className={`grid ${isZoomedOut ? 'grid-cols-8 gap-2' : 'grid-cols-4 gap-3'} transition-all duration-500`}>
                  {currentPageMeks.map(({ mek, matchedTraits, hasMatch, totalBonus, index }: any) => {
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
                          group relative cursor-pointer transition-all duration-300 overflow-hidden
                          ${hasMatch 
                            ? `border-2 bg-gradient-to-b from-amber-950/30 to-black/80 border-yellow-400 shadow-[0_0_15px_rgba(250,182,23,0.4)]`
                            : 'bg-gradient-to-b from-gray-900/30 to-black/60 border border-gray-700/30 hover:border-yellow-600/40'
                          }
                          ${isZoomedOut ? 'hover:scale-110' : 'hover:scale-105'} hover:z-20 hover:shadow-[0_0_20px_rgba(250,182,23,0.4)]
                        `}
                      >
                        {/* Industrial shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-400/0 to-transparent group-hover:via-yellow-400/10 transition-all duration-500 pointer-events-none" />
                        
                        {/* Match indicator glow - color coded by match count */}
                        {hasMatch && (
                          <div className={`absolute -inset-0.5 opacity-40 blur-md ${
                            matchedTraits.length === 3 
                              ? 'bg-gradient-to-r from-orange-500 via-red-500 to-orange-500'
                              : matchedTraits.length === 2
                                ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500'
                                : 'bg-gradient-to-r from-white via-gray-300 to-white'
                          }`} />
                        )}
                        
                        {/* Mek Image Container */}
                        <div className="relative w-full aspect-square bg-black/70 overflow-hidden">
                          {/* Tech overlay */}
                          <div className="absolute inset-0 pointer-events-none z-10">
                            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
                            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
                          </div>
                          
                          <Image
                            src={mek.image}
                            alt={mek.name}
                            width={150}
                            height={150}
                            className={`w-full h-full object-cover transition-all duration-300 ${
                              hasMatch ? 'scale-105 brightness-110' : 'group-hover:scale-105 group-hover:brightness-105'
                            }`}
                          />
                          
                          {/* Industrial overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-yellow-400/5 pointer-events-none" />
                          
                          {/* Status badge - show percentage only in normal view */}
                          {hasMatch && !isZoomedOut && (
                            <div className="absolute top-1 right-1 px-2 py-1 bg-green-500/90 text-white text-xs font-black uppercase tracking-wider rounded">
                              +{totalBonus}%
                            </div>
                          )}
                        </div>
                        
                        {/* Mek Info Panel - Only show in normal view */}
                        {!isZoomedOut && (
                          <div className="relative p-2 bg-gradient-to-b from-black/60 to-black/80">
                            {/* Data lines decoration */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
                            
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-[11px] font-bold tracking-wider uppercase ${
                                hasMatch ? 'text-yellow-300' : 'text-gray-400'
                              }`}>
                                {mek.name}
                              </span>
                              <span className="text-yellow-500/70 text-[10px] font-mono">
                                LV.{mek.level || 1}
                              </span>
                            </div>
                            
                            {/* Enhanced Chip Slots */}
                            <div className="flex items-center justify-center">
                              <div className="flex gap-1.5">
                                {mek.traits.slice(0, 3).map((trait: string, i: number) => {
                                  const isMatched = matchedTraits.some((mt: any) => mt?.id === trait);
                                  
                                  return (
                                    <div key={`${trait}-${i}`} className="relative group/chip">
                                      {/* Chip container with stronger glow for matches */}
                                      <div className={`
                                        relative w-11 h-11 p-[1px] rounded-full transition-all duration-300
                                        ${isMatched 
                                          ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-500 animate-pulse shadow-[0_0_20px_rgba(250,182,23,0.9),0_0_35px_rgba(250,182,23,0.6)]' 
                                          : 'bg-black opacity-30'
                                        }
                                      `}>
                                        <div className="relative w-full h-full rounded-full bg-black overflow-hidden">
                                          <Image
                                            src="/variation-images/acid.jpg"
                                            alt={trait}
                                            width={44}
                                            height={44}
                                            className={`w-full h-full object-cover rounded-full transition-all ${
                                              isMatched ? 'brightness-125' : 'brightness-[0.3] opacity-50'
                                            }`}
                                          />
                                          
                                          {/* Industrial shine */}
                                          {isMatched && (
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent" 
                                                 style={{ animation: 'shimmer 2s infinite' }} />
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Advanced Tooltip */}
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-black/95 border border-yellow-500/50 text-yellow-300 text-[10px] whitespace-nowrap opacity-0 group-hover/chip:opacity-100 pointer-events-none z-50 transition-all">
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black border-b border-r border-yellow-500/50 rotate-45" />
                                        <div className="font-mono uppercase tracking-wider">
                                          {trait}
                                          {isMatched && (
                                            <span className="text-green-400 ml-2 font-bold">
                                              +{parseInt(matchedTraits.find((mt: any) => mt?.id === trait)?.bonus?.replace('+', '').replace('%', '') || '0')}%
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Bottom accent line */}
                        <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                          hasMatch 
                            ? 'bg-gradient-to-r from-transparent via-yellow-400 to-transparent' 
                            : 'bg-gradient-to-r from-transparent via-gray-600 to-transparent'
                        }`} />
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
