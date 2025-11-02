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
import SuccessMeterV2 from '@/components/SuccessMeterV2';
import { DifficultyConfig } from '@/lib/difficultyModifiers';
import { VARIATIONS_BY_TYPE } from '@/lib/completeVariationRarity';

interface MekRecruitmentModalV4Props {
  showMekModal: string | null;
  selectedMekSlot: { missionId: string; slotIndex: number } | null;
  onClose: () => void;
  onMekSelection: (mek: any, matchedTraits: any[], hasMatch: boolean) => void;
  mekCount: number;
  mekCardStyle: number;
  traitCircleStyle: number;
  mekFrameStyle: number;
  difficultyConfig?: DifficultyConfig;
}

// Theme locked to glass-dirty-vignette with reduced blur for floating effect
const theme = {
  name: 'Dirty Glass - Vignette',
  backdrop: 'bg-black/10', // Reduced from /18 to /10 for more transparency
  containerBg: 'bg-gradient-to-br from-gray-900/20 via-gray-800/12 to-gray-900/20 backdrop-blur-none bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.12)_70%,rgba(0,0,0,0.20)_100%)]', // Changed backdrop-blur-sm to backdrop-blur-none
  frameBg: 'bg-gradient-to-b from-gray-800/15 to-gray-900/22 backdrop-blur-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.1)_65%,rgba(0,0,0,0.15)_90%)] border border-gray-600/15', // Changed backdrop-blur-sm to backdrop-blur-none
  headerBg: 'bg-gradient-to-b from-gray-800/20 to-gray-900/28',
  cardBg: 'from-gray-800/15 to-gray-900/22',
  matchCardBg: 'from-yellow-600/32 to-amber-800/42',
};

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
  difficultyConfig,
}: MekRecruitmentModalV4Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeBuffFilters, setActiveBuffFilters] = useState<string[]>([]);
  const [showOnlyMatches, setShowOnlyMatches] = useState(false);
  const [maxMeksToShow, setMaxMeksToShow] = useState<1 | 5 | 10 | 50 | 100>(5);
  const [sampleMekCount, setSampleMekCount] = useState<1 | 5 | 10 | 50 | 100>(5);
  // Generate meks based on the selected count
  const [allMeks, setAllMeks] = useState(() => generateSampleMeks(5));

  // Regenerate meks when count changes
  useEffect(() => {
    setAllMeks(generateSampleMeks(sampleMekCount));
    setMaxMeksToShow(sampleMekCount);
  }, [sampleMekCount]);
  const [hoveredMekIndex, setHoveredMekIndex] = useState<number | null>(null);
  const [hoveredVariation, setHoveredVariation] = useState<string | null>(null);
  const [currentStyle, setCurrentStyle] = useState<keyof typeof uiStyles>('gradient');
  const [variationCount, setVariationCount] = useState<1 | 5 | 10>(5);
  const [sortByMatch, setSortByMatch] = useState(true);
  const [hoveredMekBonus, setHoveredMekBonus] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isZoomedOut, setIsZoomedOut] = useState(false);
  const [percentageStyle, setPercentageStyle] = useState<'tab' | 'badge' | 'pill' | 'flag' | 'chip'>('tab');

  // Frame texture locked to corrupted-data
  const frameTexture = 'corrupted-data';

  // Helper function to get variation name from ID
  const getVariationName = (traitId: string): string => {
    // First try to match with heads
    const headVariation = VARIATIONS_BY_TYPE.heads.find(h => {
      // Convert ID to 3-digit string format (e.g., 1 -> "001")
      const formattedId = String(h.id).padStart(3, '0');
      return formattedId === traitId || h.name.toLowerCase().replace(/[^a-z0-9]/g, '') === traitId.toLowerCase();
    });
    if (headVariation) return headVariation.name;

    // Then try bodies
    const bodyVariation = VARIATIONS_BY_TYPE.bodies.find(b => {
      const formattedId = String(b.id).padStart(3, '0');
      return formattedId === traitId || b.name.toLowerCase().replace(/[^a-z0-9]/g, '') === traitId.toLowerCase();
    });
    if (bodyVariation) return bodyVariation.name;

    // Then try items/traits
    const itemVariation = VARIATIONS_BY_TYPE.traits.find(i => {
      const formattedId = String(i.id).padStart(3, '0');
      return formattedId === traitId || i.name.toLowerCase().replace(/[^a-z0-9]/g, '') === traitId.toLowerCase();
    });
    if (itemVariation) return itemVariation.name;

    // If still not found, return the original ID
    return traitId;
  };

  // Texture pattern for corrupted-data effect
  const texturePattern = 'bg-[repeating-linear-gradient(0deg,transparent,transparent_10px,rgba(255,0,0,0.03)_10px,rgba(255,0,0,0.03)_11px,transparent_11px,transparent_20px),repeating-linear-gradient(90deg,transparent,transparent_15px,rgba(0,255,255,0.03)_15px,rgba(0,255,255,0.03)_16px)]';



  // Percentage font locked to Roboto
  const percentageFont = 'roboto';
  const percentageFontStyles = {
    className: 'font-bold',
    fontFamily: 'Roboto, sans-serif'
  };

  // State for number of buffs to display (locked to 3)
  const buffCount = 3;

  // Debug states for success meter
  const [debugSuccessRate, setDebugSuccessRate] = useState(35);
  const [debugGoalpost, setDebugGoalpost] = useState(50);
  const [debugMode, setDebugMode] = useState(false);

  // Determine success likelihood term and color (from SuccessMeterV2)
  const getSuccessLikelihoodData = (currentPercent: number, greenLinePercent: number) => {
    if (currentPercent >= greenLinePercent) return { term: 'CERTAIN', color: '#10b981' }; // green-400
    if (greenLinePercent === 0) return { term: 'CERTAIN', color: '#10b981' };
    const relativePercent = (currentPercent / greenLinePercent) * 100;

    if (relativePercent === 0) return { term: 'IMPOSSIBLE', color: '#dc2626' }; // red-600 - more vivid red
    if (relativePercent <= 5) return { term: 'EXTREMELY UNLIKELY', color: '#ea580c' }; // orange-600
    if (relativePercent < 20) return { term: 'VERY UNLIKELY', color: '#f97316' }; // orange-500
    if (relativePercent < 35) return { term: 'UNLIKELY', color: '#fb923c' }; // orange-400
    if (relativePercent < 45) return { term: 'DOUBTFUL', color: '#fbbf24' }; // amber-400
    if (relativePercent < 55) return { term: 'UNCERTAIN', color: '#fde047' }; // yellow-300
    if (relativePercent < 65) return { term: 'POSSIBLE', color: '#facc15' }; // yellow-400
    if (relativePercent < 80) return { term: 'LIKELY', color: '#a3e635' }; // lime-400
    if (relativePercent < 90) return { term: 'VERY LIKELY', color: '#84cc16' }; // lime-500
    if (relativePercent < 95) return { term: 'HIGHLY LIKELY', color: '#22c55e' }; // green-500
    return { term: 'EXTREMELY LIKELY', color: '#10b981' }; // green-400
  };

  // Calculate actual success rate and overshoot
  const actualSuccessRate = debugMode ? debugSuccessRate : (35 + (hoveredMekBonus || 0));
  // Use difficulty config green line if available, otherwise default to 50
  const actualGoalpost = debugMode ? debugGoalpost : (difficultyConfig?.successGreenLine || 50);
  const hasReachedGoal = actualSuccessRate >= actualGoalpost;
  const overshootAmount = hasReachedGoal ? (actualSuccessRate - actualGoalpost) : 0;
  const percentToGoalpost = actualGoalpost - actualSuccessRate;
  const likelihoodData = getSuccessLikelihoodData(actualSuccessRate, actualGoalpost);

  // Calculate rewards with overshoot bonus (simplified version)
  const overshootBonus = overshootAmount * 0.5; // 0.5% bonus per 1% overshoot
  const goldBase = 674;
  const xpBase = 67;
  const essenceBase = 1.2;
  const goldWithBonus = Math.round(goldBase * (1 + overshootBonus / 100));
  const xpWithBonus = Math.round(xpBase * (1 + overshootBonus / 100));
  const essenceWithBonus = (essenceBase * (1 + overshootBonus / 100)).toFixed(1);

  // Glass effect locked to 'none' (clean)
  const glassEffect = 'none';
  const glassEffectStyle = ''; // No glass effect

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showMekModal) {
      document.body.classList.add('modal-open');
      const scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      
      return () => {
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showMekModal]);

  // Reset page when changing max meks to show
  useEffect(() => {
    setCurrentPage(1);
  }, [maxMeksToShow]);

  if (!showMekModal || !selectedMekSlot) return null;

  // Calculate pagination values - always use pagination
  const itemsPerPage = isZoomedOut ? 42 : 12; // 7 columns x 6 rows for zoom out
  const columnsPerRow = isZoomedOut ? 7 : 4;

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

      {/* Debug Controls - Floating at top, outside main content */}
      <div className="fixed top-4 left-4 z-[10001] flex flex-col gap-2">
        {/* Mek Count Selector */}
        <select
          value={sampleMekCount}
          onChange={(e) => setSampleMekCount(Number(e.target.value) as 1 | 5 | 10 | 50 | 100)}
          className="px-3 py-1.5 bg-gray-800/90 border border-gray-600 rounded text-sm text-gray-200 hover:bg-gray-700 focus:outline-none focus:border-yellow-500"
        >
          <option value="1">1 Sample Mek</option>
          <option value="5">5 Sample Meks</option>
          <option value="10">10 Sample Meks</option>
          <option value="50">50 Sample Meks</option>
          <option value="100">100 Sample Meks</option>
        </select>

        {/* Percentage Style Selector (only show in zoom out mode) */}
        {isZoomedOut && (
          <select
            value={percentageStyle}
            onChange={(e) => setPercentageStyle(e.target.value as 'tab' | 'badge' | 'pill' | 'flag' | 'chip')}
            className="px-3 py-1.5 bg-gray-800/90 border border-gray-600 rounded text-sm text-gray-200 hover:bg-gray-700 focus:outline-none focus:border-yellow-500"
          >
            <option value="tab">Tab Style</option>
            <option value="badge">Badge Style</option>
            <option value="pill">Pill Style</option>
            <option value="flag">Flag Style</option>
            <option value="chip">Chip Style</option>
          </select>
        )}

        {/* Debug Mode Toggle */}
        <button
          onClick={() => setDebugMode(!debugMode)}
          className={`px-3 py-1.5 rounded text-sm font-bold transition-all ${
            debugMode
              ? 'bg-green-600 text-white border-2 border-green-400'
              : 'bg-gray-800/90 text-gray-200 border border-gray-600 hover:bg-gray-700'
          }`}
        >
          {debugMode ? '🐛 Debug ON' : '🐛 Debug OFF'}
        </button>
      </div>

      {/* Debug Panel - Shows when debug mode is on */}
      {debugMode && (
        <div className="fixed top-4 right-4 z-[10001] bg-black/95 border-2 border-yellow-500 rounded-lg p-4 shadow-2xl"
             style={{ width: '300px' }}>
          <h3 className="text-yellow-400 font-bold text-sm mb-4 uppercase tracking-wider">Success Meter Debug</h3>

          {/* Success Rate Slider */}
          <div className="mb-4">
            <label className="text-gray-300 text-xs font-medium block mb-2">
              Success Rate: <span className="text-yellow-400 font-bold">{debugSuccessRate}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={debugSuccessRate}
              onChange={(e) => {
                const value = Number(e.target.value);
                setDebugSuccessRate(value);
              }}
              onMouseMove={(e) => {
                if (e.buttons === 1) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                  const clamped = Math.max(0, Math.min(100, percent));
                  setDebugSuccessRate(clamped);
                }
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer debug-slider"
              style={{
                background: `linear-gradient(to right, #facc15 0%, #facc15 ${debugSuccessRate}%, #374151 ${debugSuccessRate}%, #374151 100%)`
              }}
            />
            <div className="flex justify-between text-gray-500 text-[10px] mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Goalpost Position Slider */}
          <div className="mb-4">
            <label className="text-gray-300 text-xs font-medium block mb-2">
              Goalpost Position: <span className="text-green-400 font-bold">{debugGoalpost}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={debugGoalpost}
              onChange={(e) => {
                const value = Number(e.target.value);
                setDebugGoalpost(value);
              }}
              onMouseMove={(e) => {
                if (e.buttons === 1) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                  const clamped = Math.max(0, Math.min(100, percent));
                  setDebugGoalpost(clamped);
                }
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer debug-slider"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${debugGoalpost}%, #374151 ${debugGoalpost}%, #374151 100%)`
              }}
            />
            <div className="flex justify-between text-gray-500 text-[10px] mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Info Display */}
          <div className="bg-gray-900/50 rounded p-2 mt-3">
            <div className="text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="font-bold" style={{ color: getSuccessLikelihoodData(debugSuccessRate, debugGoalpost).color }}>
                  {getSuccessLikelihoodData(debugSuccessRate, debugGoalpost).term}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Overshoot:</span>
                <span className={debugSuccessRate > debugGoalpost ? 'text-green-400 font-bold' : 'text-gray-500'}>
                  {debugSuccessRate > debugGoalpost ? `+${debugSuccessRate - debugGoalpost}%` : '0%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Distance to Goal:</span>
                <span className="text-gray-300">
                  {Math.abs(debugSuccessRate - debugGoalpost)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced backdrop with animated particles - click outside to close */}
      <div
        className={`fixed inset-0 ${theme.backdrop} z-[9999] flex items-start justify-center pt-12 overflow-y-auto overflow-x-hidden`}
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
            <div className={`absolute inset-0 ${theme.containerBg}`} />
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
          <div className="relative bg-black/20 backdrop-blur-xl border-2 border-yellow-500/50 rounded-lg overflow-hidden max-w-full">
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-amber-950/20 via-transparent to-transparent pointer-events-none" />
            
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-yellow-400/50" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-yellow-400/50" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-yellow-400/50" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-yellow-400/50" />
            
            
            {/* Industrial header */}
            <div className={`relative ${theme.headerBg} backdrop-blur-md border-b-2 border-yellow-500/40 p-4 overflow-hidden max-w-full`}>
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent" />
              </div>
              
              <div className="flex justify-between items-center relative z-10">
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 tracking-wider uppercase"
                      style={{
                        fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
                        letterSpacing: '0.15em',
                        textShadow: '0 0 8px rgba(250, 204, 21, 0.25), 0 2px 4px rgba(0, 0, 0, 0.5)'
                      }}>
                    MEK RECRUITMENT
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-yellow-400/80 text-xs font-medium uppercase tracking-wider">
                      {displayMeks.filter((m: any) => m.hasMatch).length} MATCHES • {displayMeks.length} AVAILABLE
                    </span>
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
              
              {/* Success Meter - Full Width (Bar Only) */}
              <div className="px-6 pb-3" style={{ paddingTop: '31px' }}>
                {/* SUCCESS METER Title */}
                <div className="relative" style={{ marginBottom: '29px' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-96 h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
                  </div>
                  <div className="relative text-center">
                    <h2 className="text-3xl font-black uppercase tracking-[0.6em]"
                        style={{
                          fontFamily: 'Orbitron, monospace',
                          background: 'linear-gradient(180deg, #fff 0%, #facc15 50%, #f59e0b 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          filter: 'drop-shadow(0 4px 8px rgba(250, 204, 21, 0.4))'
                        }}>
                      SUCCESS METER
                    </h2>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl animate-pulse"></div>
                  </div>
                </div>

                {/* Success Meter Bar */}
                <div className="[&>*>div:last-child]:hidden">
                  <SuccessMeterV2
                    successRate={debugMode ? debugSuccessRate : (35 + (hoveredMekBonus || 0))}
                    greenLine={debugMode ? debugGoalpost : (difficultyConfig?.successGreenLine || 50)}
                    showTitle={false}
                    barHeight={58}
                    baseRewards={{
                      gold: 250000,
                      xp: 5000
                    }}
                    difficultyConfig={{
                      goldMultiplier: 1,
                      xpMultiplier: 1,
                      essenceAmountMultiplier: 1,
                      overshootBonusRate: 0.5,
                      maxOvershootBonus: 50
                    }}
                    cardLayout={1}
                  />
                </div>
              </div>

              {/* Combined Variation Selection and Mission Status */}
              <div className="p-4 mx-4 relative" style={{ marginTop: '-10px', marginBottom: '12px' }}>
                {/* Theme-specific background for the floating card */}
                <div className={`absolute inset-0 rounded-lg ${theme.frameBg}`} />
                {/* Corrupted-data texture overlay */}
                <div className={`absolute inset-0 rounded-lg ${texturePattern}`} />
                <div className="absolute inset-0 border border-yellow-500/20 rounded-lg" />

                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-yellow-400/40 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-yellow-400/40 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-yellow-400/40 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-yellow-400/40 rounded-br-lg" />

                <div className="relative flex gap-4 px-4 items-center" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
                  {/* Left Side - Variation Buffs */}
                  <div className="flex-1" style={{ marginLeft: '-17px' }}>
                    <div className="mb-2">
                      <div className="text-yellow-500 font-black uppercase tracking-[0.2em] text-center"
                           style={{
                             fontSize: '17.5px',
                             fontFamily: 'Orbitron, monospace',
                             textShadow: '0 0 10px rgba(250, 204, 21, 0.3)',
                           }}>
                        VARIATION BUFFS
                      </div>
                      <div className="text-gray-400 text-center mt-1.5 font-medium tracking-wide"
                           style={{ fontSize: '12.5px' }}>
                        Match these traits for bonus rewards
                      </div>
                    </div>
                    <div className="flex gap-3 justify-center">
                    {missionMultipliers.slice(0, buffCount).map((mult) => {
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
                              relative w-[89px] h-[89px] p-[2px] rounded-full
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
                                  sizes="89px"
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
                            <div className={`font-bold mt-1.5 uppercase tracking-wider text-center transition-all
                              ${isActive ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(250,182,23,0.8)]' : 
                                mekHasThisTrait ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 
                                'text-gray-600 group-hover:text-gray-500'}
                            `}
                            style={{ fontSize: '10.3px' }}>
                              {mult.name}
                            </div>

                            {/* Bonus display with animation - fixed height container */}
                            <div className="h-6 flex items-center justify-center">
                              <div className={`font-black transition-all
                                ${isActive ? 'text-yellow-400 animate-pulse' :
                                  mekHasThisTrait ? 'text-green-400 animate-[flash_0.3s_ease-in-out_infinite]' :
                                  'text-gray-700 group-hover:text-gray-600'}
                              `}
                              style={{
                                fontSize: '16.9px',
                                transform: mekHasThisTrait ? 'scale(1.11)' : 'scale(1)',
                                transformOrigin: 'center',
                                filter: mekHasThisTrait ? 'drop-shadow(0 0 12px rgba(52, 211, 153, 0.9))' : 'none',
                                lineHeight: '1'
                              }}>
                                {mult.bonus}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    </div>
                  </div>

                  {/* Right Side - Mission Status */}
                  <div className="flex items-center" style={{ width: '360px' }}>
                    <div className="relative bg-black/90 border-2 border-yellow-500/50 shadow-2xl overflow-hidden w-full">
                      <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: `linear-gradient(135deg, transparent 25%, rgba(250, 204, 21, 0.1) 25%, rgba(250, 204, 21, 0.1) 50%, transparent 50%, transparent 75%, rgba(250, 204, 21, 0.1) 75%, rgba(250, 204, 21, 0.1))`,
                        backgroundSize: '20px 20px'
                      }}></div>

                      <div className="relative z-10">
                        <div className="bg-gradient-to-b from-yellow-500/10 to-transparent px-4 py-3 flex items-center justify-between">
                          <div className="text-left">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">MISSION STATUS</div>
                            <div className="font-bold font-['Orbitron'] uppercase text-xl" style={{ color: likelihoodData.color }}>
                              {likelihoodData.term}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-[10px] font-bold uppercase tracking-wider ${
                              hasReachedGoal ? 'text-green-500' : 'text-gray-500'
                            }`}>OVERSHOOT</div>
                            <div className={`text-2xl font-black tabular-nums ${
                              hasReachedGoal ? 'text-green-400' : 'text-gray-600'
                            }`} style={{
                              fontFamily: 'Roboto Mono, monospace',
                              ...(hasReachedGoal ? {
                                textShadow: '0 0 10px rgba(34, 197, 94, 0.8)',
                                filter: 'brightness(1.2)'
                              } : {})
                            }}>
                              {overshootAmount.toFixed(0)}%
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-yellow-500/20"></div>

                        <div className="relative">
                          <div className={`px-4 py-3 space-y-2.5 ${!hasReachedGoal ? 'opacity-40' : ''}`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs uppercase font-bold ${hasReachedGoal ? 'text-yellow-500' : 'text-gray-500'}`}>
                              Gold:
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs tabular-nums ${hasReachedGoal ? 'text-gray-500' : 'text-gray-600'}`}>
                                {goldBase.toLocaleString()}
                              </span>
                              <span className={`text-xs ${hasReachedGoal ? 'text-yellow-500' : 'text-gray-600'}`}>→</span>
                              <span className={`text-sm font-bold tabular-nums ${hasReachedGoal ? 'text-yellow-400' : 'text-gray-500'}`}>
                                {goldWithBonus.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className={`text-xs uppercase font-bold ${hasReachedGoal ? 'text-blue-500' : 'text-gray-500'}`}>
                              XP:
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs tabular-nums ${hasReachedGoal ? 'text-gray-500' : 'text-gray-600'}`}>
                                {xpBase}
                              </span>
                              <span className={`text-xs ${hasReachedGoal ? 'text-blue-500' : 'text-gray-600'}`}>→</span>
                              <span className={`text-sm font-bold tabular-nums ${hasReachedGoal ? 'text-blue-400' : 'text-gray-500'}`}>
                                {xpWithBonus}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className={`text-xs uppercase font-bold ${hasReachedGoal ? 'text-green-500' : 'text-gray-500'}`}>
                              Essence:
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs tabular-nums ${hasReachedGoal ? 'text-gray-500' : 'text-gray-600'}`}>
                                {essenceBase}x
                              </span>
                              <span className={`text-xs ${hasReachedGoal ? 'text-green-500' : 'text-gray-600'}`}>→</span>
                              <span className={`text-sm font-bold tabular-nums ${hasReachedGoal ? 'text-green-400' : 'text-gray-500'}`}>
                                {essenceWithBonus}x
                              </span>
                            </div>
                          </div>
                          </div>

                          {!hasReachedGoal && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/40 via-yellow-500/40 to-orange-500/40 blur animate-pulse"></div>
                                <div className="relative bg-black/90 px-3 py-2" style={{
                                  clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)'
                                }}>
                                  <div className="text-center">
                                    <div className="text-sm text-yellow-400 font-bold italic tracking-wide font-['Roboto']" style={{
                                      fontSize: '14.4px',
                                      textShadow: '0 0 10px rgba(250, 204, 21, 0.7), 0 2px 4px rgba(0, 0, 0, 0.9)'
                                    }}>
                                      OVERSHOOT IN {Math.abs(percentToGoalpost).toFixed(0)}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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

                  {/* Sample Display Info */}
                  <div className="px-3 py-2 bg-black/40 border border-yellow-500/30 text-yellow-400 text-xs uppercase tracking-wider"
                       style={{ fontFamily: "'Orbitron', monospace" }}>
                    4 Sample Meks
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
                
                <div className={`grid ${isZoomedOut ? 'grid-cols-7 gap-2.5' : 'grid-cols-4 gap-3'} transition-all duration-500`}>
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
                          group relative cursor-pointer transition-all duration-300
                          ${
                            matchedTraits.length === 3
                              ? `border-2 bg-gradient-to-b ${theme.matchCardBg} border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]`
                              : matchedTraits.length === 2
                                ? `border-2 bg-gradient-to-b ${theme.matchCardBg} border-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.5)]`
                                : matchedTraits.length === 1
                                  ? `border-2 bg-gradient-to-b ${theme.matchCardBg} border-gray-400 shadow-[0_0_15px_rgba(156,163,175,0.4)]`
                                  : `bg-gradient-to-b ${theme.cardBg} border border-gray-700/30 hover:border-yellow-600/40`
                          }
                          ${isZoomedOut ? 'hover:scale-110 mb-3' : 'hover:scale-105'} hover:z-20
                        `}
                      >
                        {/* Industrial shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-400/0 to-transparent group-hover:via-yellow-400/10 transition-all duration-500 pointer-events-none" />
                        
                        {/* Match indicator glow - color coded by match count */}
                        {hasMatch && (
                          <div className={`absolute -inset-1 opacity-50 blur-lg ${
                            matchedTraits.length === 3
                              ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500'
                              : matchedTraits.length === 2
                                ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400'
                                : 'bg-gradient-to-r from-gray-300 via-white to-gray-300'
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
                        </div>

                        {/* Percentage display variations for zoomed out view - extending from bottom */}
                        {isZoomedOut && (
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-10">
                            {/* Tab Style - Clean minimal pill */}
                            {percentageStyle === 'tab' && (
                              <div className="bg-black/95 backdrop-blur-sm rounded-b-md px-3 py-0.5 shadow-lg border-x border-b border-gray-600">
                                <div className="text-[11px] font-bold" style={{ fontFamily: 'Roboto Mono, monospace' }}>
                                  <span className="text-white">20%</span>
                                  {hasMatch && (
                                    <span className="text-lime-400 ml-1">+{totalBonus}%</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Badge Style - Gradient pill */}
                            {percentageStyle === 'badge' && (
                              <div className="bg-gradient-to-r from-gray-800/95 via-gray-700/95 to-gray-800/95 backdrop-blur-sm rounded-b-lg px-3 py-0.5 shadow-md border-x border-b border-gray-500">
                                <div className="text-[11px] font-bold" style={{ fontFamily: 'Roboto Mono, monospace' }}>
                                  <span className="text-yellow-300">20%</span>
                                  {hasMatch && (
                                    <span className="text-green-400 ml-1">+{totalBonus}%</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Pill Style - Dark pill with tech font */}
                            {percentageStyle === 'pill' && (
                              <div className="bg-gray-900/95 backdrop-blur-sm rounded-b px-3.5 py-0.5 shadow-inner border-x border-b border-gray-700">
                                <div className="text-[11px] font-black" style={{ fontFamily: 'Orbitron, monospace', letterSpacing: '0.05em' }}>
                                  <span className="text-gray-300">20%</span>
                                  {hasMatch && (
                                    <span className="text-cyan-400 ml-1">+{totalBonus}%</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Flag Style - Angled pill */}
                            {percentageStyle === 'flag' && (
                              <div className="bg-black/90 backdrop-blur-sm px-3 py-0.5 shadow-lg border-x border-b border-yellow-600/50"
                                   style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}>
                                <div className="text-[11px] font-bold uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                  <span className="text-yellow-400">20%</span>
                                  {hasMatch && (
                                    <span className="text-emerald-400 ml-0.5">+{totalBonus}%</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Chip Style - Tech pill with glow line */}
                            {percentageStyle === 'chip' && (
                              <div className="relative bg-gradient-to-b from-gray-800/95 to-black/95 backdrop-blur-sm rounded-b px-3 py-0.5 border-x border-b border-cyan-500/30 shadow-[inset_0_-2px_4px_rgba(6,182,212,0.2)]">
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                                <div className="text-[10px] font-black uppercase tracking-wider" style={{ fontFamily: 'Orbitron, monospace' }}>
                                  <span className="text-cyan-400">20%</span>
                                  {hasMatch && (
                                    <span className="text-yellow-300 ml-0.5">+{totalBonus}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Mek Info Panel - Only show in normal view */}
                        {!isZoomedOut && (
                          <div className="relative p-2 pb-3 bg-gradient-to-b from-black/60 to-black/80">
                            {/* Data lines decoration */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />

                            <div className="flex items-center justify-between mb-2">
                              {/* MEK name and level - left aligned */}
                              <div className="text-left">
                                <div className={`text-[11px] font-bold tracking-wider uppercase ${
                                  hasMatch ? 'text-yellow-300' : 'text-gray-400'
                                }`}>
                                  {mek.name}
                                </div>
                                <div className="text-yellow-500/70 text-xs font-mono">
                                  LV.{mek.level || 1}
                                </div>
                              </div>

                              {/* Percentage display - right aligned */}
                              <div
                                className="relative bg-gradient-to-br from-black/90 to-black/80 border-2 border-yellow-500/40 rounded-sm px-3 py-1 overflow-hidden"
                                style={{
                                  minWidth: '95px',
                                  boxShadow: 'inset 0 1px 2px rgba(250,182,23,0.1), 0 2px 4px rgba(0,0,0,0.5)'
                                }}
                              >
                                {/* Glass effect overlay - removed, locked to clean */}
                                <div className={`text-[14px] ${percentageFontStyles.className} uppercase tracking-wider text-center`}
                                     style={{
                                       fontFamily: percentageFontStyles.fontFamily
                                     }}>
                                  <span
                                    className="text-white"
                                    style={{
                                      textShadow: `
                                        1px 1px 2px rgba(0, 0, 0, 1),
                                        -1px -1px 2px rgba(0, 0, 0, 0.8),
                                        0 2px 4px rgba(0, 0, 0, 0.9)
                                      `,
                                      letterSpacing: '0.05em'
                                    }}
                                  >
                                    20%
                                  </span>
                                  {hasMatch && (
                                    <span
                                      className="text-emerald-400 ml-1.5"
                                      style={{
                                        textShadow: `
                                          0 0 5px rgba(52, 211, 153, 0.9),
                                          0 0 15px rgba(52, 211, 153, 0.5),
                                          1px 1px 2px rgba(0, 0, 0, 1),
                                          -1px -1px 2px rgba(0, 0, 0, 0.8),
                                          0 2px 4px rgba(0, 0, 0, 0.9)
                                        `,
                                        letterSpacing: '0.05em'
                                      }}
                                    >
                                      +{totalBonus}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Enhanced Chip Slots */}
                            <div className="flex items-center justify-center">
                              <div className="flex gap-1.5">
                                {mek.traits.slice(0, 3).map((trait: string, i: number) => {
                                  const isMatched = matchedTraits.some((mt: any) => mt?.id === trait);
                                  const traitName = getVariationName(trait);

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
                                            alt={traitName}
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
                                          {traitName}
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
