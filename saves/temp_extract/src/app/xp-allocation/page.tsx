"use client";

import { useState, useEffect, useRef } from "react";
import BackgroundEffects from "@/components/BackgroundEffects";
import MekImage from "@/components/MekImage";

type Mek = {
  id: string;
  name: string;
  level: number;
  currentXP: number;
  xpToNext: number;
  maxXP: number;
  status: string;
  goldRate: number;
  rarity?: string;
};

type UndoState = {
  pooledXP: number;
  mek: Mek;
};

const SORT_OPTIONS = [
  { id: "level_asc", name: "Level: Low to High" },
  { id: "level_desc", name: "Level: High to Low" },
  { id: "gold_asc", name: "Gold/hr: Low to High" },
  { id: "gold_desc", name: "Gold/hr: High to Low" },
  { id: "name", name: "Name" },
];

const XP_AMOUNTS = [10, 100, 1000, 10000];
const MEKS_PER_PAGE = 10;

export default function XPAllocationPage() {
  const [pooledXP, setPooledXP] = useState(15000);
  const [displayedXP, setDisplayedXP] = useState(15000);
  const [mekUndoStacks, setMekUndoStacks] = useState<Record<string, UndoState[]>>({});
  const [showLevelUpModal, setShowLevelUpModal] = useState<{ mek: Mek; newLevel: number } | null>(null);
  const [selectedAmounts, setSelectedAmounts] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorTarget, setErrorTarget] = useState<{ x: number; y: number } | null>(null);
  const animationRef = useRef<number | null>(null);
  const [showMekBlock, setShowMekBlock] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("level_desc");
  const [showMaxLevel, setShowMaxLevel] = useState(true);
  const [selectedBlockMek, setSelectedBlockMek] = useState<string | null>(null);
  
  // Folded/Unfolded state - track which mek is currently expanded
  const [expandedMekId, setExpandedMekId] = useState<string | null>(null);
  
  const [meks, setMeks] = useState<Mek[]>([
    {
      id: '7890',
      name: 'Mek #7890',
      level: 10,
      currentXP: 45000,
      xpToNext: 0,
      maxXP: 45000,
      status: 'Max Level',
      goldRate: 25.0,
      rarity: 'legendary'
    },
    {
      id: '3456',
      name: 'Mek #3456',
      level: 7,
      currentXP: 14500,
      xpToNext: 7500,
      maxXP: 22000,
      status: 'Active',
      goldRate: 18.2,
      rarity: 'epic'
    },
    {
      id: '1234',
      name: 'Mek #1234',
      level: 5,
      currentXP: 6200,
      xpToNext: 3800,
      maxXP: 10000,
      status: 'Active',
      goldRate: 15.5,
      rarity: 'rare'
    },
    {
      id: '5678',
      name: 'Mek #5678',
      level: 3,
      currentXP: 2400,
      xpToNext: 1600,
      maxXP: 4000,
      status: 'Active',
      goldRate: 10.0,
      rarity: 'uncommon'
    },
    {
      id: '9012',
      name: 'Mek #9012',
      level: 2,
      currentXP: 1200,
      xpToNext: 1800,
      maxXP: 3000,
      status: 'Active',
      goldRate: 6.5,
      rarity: 'common'
    }
  ]);

  // Animate XP counter with bezier curve
  useEffect(() => {
    if (displayedXP !== pooledXP) {
      const startTime = Date.now();
      const startValue = displayedXP;
      const endValue = pooledXP;
      const difference = endValue - startValue;
      const duration = 1500; // 1.5 seconds

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Bezier curve for easing (fast start, slow end)
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = startValue + (difference * easeOutCubic);
        setDisplayedXP(Math.floor(currentValue));
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayedXP(endValue);
        }
      };
      
      animate();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [pooledXP, displayedXP]);

  const calculateMaxXP = (level: number) => level * level * 1000;

  const saveStateForMek = (mekId: string) => {
    const mek = meks.find(m => m.id === mekId);
    if (!mek) return;
    
    const state: UndoState = {
      pooledXP: pooledXP,
      mek: JSON.parse(JSON.stringify(mek))
    };
    
    setMekUndoStacks(prev => {
      const stacks = { ...prev };
      if (!stacks[mekId]) stacks[mekId] = [];
      stacks[mekId].push(state);
      if (stacks[mekId].length > 50) stacks[mekId].shift();
      return stacks;
    });
  };

  const undoLastActionForMek = (mekId: string) => {
    const stacks = mekUndoStacks[mekId];
    if (!stacks || stacks.length === 0) return;
    
    const previousState = stacks[stacks.length - 1];
    setPooledXP(previousState.pooledXP);
    
    setMeks(prevMeks => prevMeks.map(m => 
      m.id === mekId ? previousState.mek : m
    ));
    
    setMekUndoStacks(prev => {
      const newStacks = { ...prev };
      newStacks[mekId] = newStacks[mekId].slice(0, -1);
      return newStacks;
    });
  };

  const hasUnsavedChanges = (mekId: string) => {
    return mekUndoStacks[mekId] && mekUndoStacks[mekId].length > 0;
  };

  const showError = (message: string, event?: React.MouseEvent) => {
    setErrorMessage(message);
    if (event) {
      setErrorTarget({ x: event.clientX, y: event.clientY });
    }
    setTimeout(() => {
      setErrorMessage(null);
      setErrorTarget(null);
    }, 3000);
  };

  const allocateXP = (mekId: string, amount: number, event?: React.MouseEvent) => {
    if (pooledXP < amount) {
      showError(`Need ${amount.toLocaleString()} XP!`, event);
      return;
    }
    
    const mek = meks.find(m => m.id === mekId);
    if (!mek || mek.level >= 10) return;
    
    saveStateForMek(mekId);
    
    const newPooledXP = pooledXP - amount;
    const updatedMek = { ...mek };
    updatedMek.currentXP += amount;
    
    const initialLevel = updatedMek.level;
    
    while (updatedMek.currentXP >= updatedMek.maxXP && updatedMek.level < 10) {
      const overflow = updatedMek.currentXP - updatedMek.maxXP;
      updatedMek.level++;
      updatedMek.currentXP = overflow;
      updatedMek.maxXP = calculateMaxXP(updatedMek.level);
      updatedMek.xpToNext = updatedMek.maxXP - updatedMek.currentXP;
      updatedMek.goldRate += 2.0;
      
      if (updatedMek.level >= 10) {
        updatedMek.status = 'Max Level';
        updatedMek.xpToNext = 0;
      }
    }
    
    if (updatedMek.level < 10) {
      updatedMek.xpToNext = updatedMek.maxXP - updatedMek.currentXP;
    }
    
    setPooledXP(newPooledXP);
    setMeks(prevMeks => prevMeks.map(m => 
      m.id === mekId ? updatedMek : m
    ));
    
    if (updatedMek.level > initialLevel) {
      setShowLevelUpModal({ mek: updatedMek, newLevel: updatedMek.level });
    }
  };

  const allocateToNextLevel = (mekId: string, event?: React.MouseEvent) => {
    const mek = meks.find(m => m.id === mekId);
    if (!mek || mek.level >= 10) return;
    
    if (pooledXP < mek.xpToNext) {
      showError(`Need ${mek.xpToNext.toLocaleString()} XP!`, event);
      return;
    }
    
    allocateXP(mekId, Math.min(mek.xpToNext, pooledXP));
  };

  const allocateAll = (mekId: string, event?: React.MouseEvent) => {
    const mek = meks.find(m => m.id === mekId);
    if (!mek) return;
    
    if (pooledXP < 1) {
      showError("No XP available!", event);
      return;
    }
    
    allocateXP(mekId, pooledXP);
  };

  const goToMekProfile = (mekId: string) => {
    window.location.href = `/mek/${mekId}`;
  };

  // Filter and sort Meks
  const filteredMeks = meks.filter(mek => {
    // Filter by search term
    if (searchTerm && !mek.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !mek.id.includes(searchTerm)) {
      return false;
    }
    
    // Filter max level
    if (!showMaxLevel && mek.level >= 10) {
      return false;
    }
    
    return true;
  });

  // Sort Meks
  const sortedMeks = [...filteredMeks].sort((a, b) => {
    switch (sortBy) {
      case "level_asc":
        return a.level - b.level;
      case "level_desc":
        return b.level - a.level;
      case "gold_asc":
        return a.goldRate - b.goldRate;
      case "gold_desc":
        return b.goldRate - a.goldRate;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
  
  // Paginate Meks
  const totalPages = Math.ceil(sortedMeks.length / MEKS_PER_PAGE);
  const paginatedMeks = sortedMeks.slice(
    currentPage * MEKS_PER_PAGE,
    (currentPage + 1) * MEKS_PER_PAGE
  );
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, sortBy, showMaxLevel]);

  return (
    <div className="min-h-screen p-5 relative text-white">
      <BackgroundEffects />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with XP Available in top center */}
        <div className="mb-8">
          {/* XP Available - Centered at top */}
          <div className="flex justify-center mb-6">
            <div className="relative bg-gray-900/80 border-2 border-yellow-500/50 rounded-lg px-8 py-4 shadow-2xl">
              {/* Animated background */}
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/20 via-transparent to-yellow-900/20 animate-pulse" />
              </div>
              
              <div className="relative flex flex-col items-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Available XP</div>
                <div className="text-4xl font-bold text-yellow-400 font-mono tracking-tight">
                  {displayedXP.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                  <div className="text-xs text-gray-500">Ready to Allocate</div>
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Page Title */}
          <h1 
            style={{
              fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
              fontSize: '42px',
              fontWeight: 900,
              color: '#fab617',
              letterSpacing: '0.15em',
              textShadow: '0 0 20px rgba(250, 182, 23, 0.6)',
              textAlign: 'center'
            }}
          >
            XP ALLOCATION
          </h1>
        </div>

        {/* Error Tooltip */}
        {errorMessage && errorTarget && (
          <div 
            className="fixed z-50 px-3 py-2 bg-red-900/90 border border-red-500 rounded-lg text-red-200 text-sm pointer-events-none animate-bounce"
            style={{
              left: `${errorTarget.x}px`,
              top: `${errorTarget.y - 40}px`,
              transform: 'translateX(-50%)'
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 bg-gray-900/20 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex flex-col gap-3">
            {/* Search Bar */}
            <div className="flex gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or ID..."
                className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-gray-600 focus:outline-none transition-all"
              />
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 focus:border-gray-600 focus:outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show Max Level Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMaxLevel}
                  onChange={(e) => setShowMaxLevel(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-yellow-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-xs text-gray-400">Show max level</span>
              </label>
              
              {/* Mek Block Button */}
              <button
                onClick={() => setShowMekBlock(!showMekBlock)}
                className={`px-3 py-1 text-xs rounded transition-all ${
                  showMekBlock
                    ? 'bg-yellow-500 text-black font-bold'
                    : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600'
                }`}
              >
                Mek Block
              </button>
            </div>
          </div>
          
          {/* Mek Block - Expandable Grid */}
          {showMekBlock && (
            <div className="mt-4 p-4 bg-gray-900/40 backdrop-blur-sm border border-gray-700 rounded-lg">
              <div className="grid grid-cols-8 gap-2">
                {sortedMeks.map(mek => (
                  <div
                    key={mek.id}
                    onClick={() => {
                      setSelectedBlockMek(mek.id);
                      // Find the page this Mek is on
                      const mekIndex = sortedMeks.findIndex(m => m.id === mek.id);
                      const targetPage = Math.floor(mekIndex / MEKS_PER_PAGE);
                      setCurrentPage(targetPage);
                      setShowMekBlock(false);
                    }}
                    className={`relative cursor-pointer rounded overflow-hidden border-2 transition-all transform hover:scale-110 hover:z-10 ${
                      selectedBlockMek === mek.id
                        ? 'border-yellow-500 ring-2 ring-yellow-400'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <MekImage
                      assetId={mek.id}
                      size={64}
                      alt={mek.name}
                      className="w-full h-full"
                    />
                    {/* Level indicator */}
                    <div className="absolute bottom-0 right-0 bg-black/80 text-xs text-yellow-400 px-1 rounded-tl">
                      {mek.level}
                    </div>
                    {/* Max level indicator */}
                    {mek.level >= 10 && (
                      <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/30 to-transparent pointer-events-none" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mek List */}
        <div className="space-y-2">
          {paginatedMeks.map(mek => {
            const isMaxLevel = mek.level >= 10;
            const xpPercent = (mek.currentXP / mek.maxXP) * 100;
            const hasUndo = hasUnsavedChanges(mek.id);
            const selectedAmount = selectedAmounts[mek.id] || 100;
            const isExpanded = expandedMekId === mek.id;

            return (
              <div
                key={mek.id}
                className={`relative border rounded-lg backdrop-blur-sm transition-all cursor-pointer ${
                  isMaxLevel 
                    ? 'bg-gradient-to-r from-yellow-900/15 via-yellow-800/20 to-yellow-900/15 border-yellow-600/40' 
                    : isExpanded
                    ? 'bg-gray-900/60 border-yellow-500/50 shadow-lg'
                    : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                }`}
                onClick={(e) => {
                  // Only toggle if clicking on the main container, not buttons
                  if ((e.target as HTMLElement).closest('button')) return;
                  setExpandedMekId(isExpanded ? null : mek.id);
                }}
              >
                {/* Golden racing border for max level */}
                {isMaxLevel && (
                  <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                    <div className="absolute inset-0">
                      {/* Top border */}
                      <div className="absolute top-0 left-0 h-0.5 w-20 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-borderRace" />
                      {/* Right border */}
                      <div className="absolute top-0 right-0 w-0.5 h-20 bg-gradient-to-b from-transparent via-yellow-400 to-transparent animate-borderRaceVertical" />
                      {/* Bottom border */}
                      <div className="absolute bottom-0 right-0 h-0.5 w-20 bg-gradient-to-l from-transparent via-yellow-400 to-transparent animate-borderRaceReverse" />
                      {/* Left border */}
                      <div className="absolute bottom-0 left-0 w-0.5 h-20 bg-gradient-to-t from-transparent via-yellow-400 to-transparent animate-borderRaceVerticalReverse" />
                    </div>
                  </div>
                )}
                
                {/* Folded State - Thin bar showing only essential info */}
                {!isExpanded ? (
                  <div className="flex items-center h-16 px-4">
                    {/* Mek Image */}
                    <div 
                      className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded overflow-hidden"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToMekProfile(mek.id);
                      }}
                    >
                      <MekImage
                        assetId={mek.id}
                        size={48}
                        alt={mek.name}
                        className="w-full h-full"
                      />
                    </div>
                    
                    {/* Mek Name */}
                    <div className="ml-3 flex-shrink-0 w-32">
                      <div className="text-gray-300 font-medium text-sm truncate">{mek.name}</div>
                    </div>
                    
                    {/* Gold Rate */}
                    <div className="ml-4 flex items-center gap-1">
                      <div className="text-yellow-500 text-sm font-mono">{mek.goldRate}</div>
                      <div className="text-gray-500 text-xs">/hr</div>
                    </div>
                    
                    {/* Level */}
                    <div className="ml-auto flex items-center gap-4">
                      <div className="text-gray-400 text-sm">
                        Level <span className="text-white font-bold">{mek.level}</span>
                      </div>
                      
                      {/* XP Progress Bar (mini) */}
                      {!isMaxLevel && (
                        <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
                            style={{ width: `${xpPercent}%` }}
                          />
                        </div>
                      )}
                      
                      {/* Max Level Badge */}
                      {isMaxLevel && (
                        <div className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 text-xs font-bold">
                          MAX
                        </div>
                      )}
                      
                      {/* Expand Indicator */}
                      <div className="text-gray-500 text-xs">
                        ▼
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Unfolded State - Full controls */
                  <div className="flex items-stretch h-28">
                    {/* Left Section - Mek Image and Info */}
                    <div className="flex items-center gap-3 px-4 border-r border-gray-800/50">
                      <div 
                        className="flex-shrink-0 w-14 h-14 bg-gray-800 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-yellow-500/50 transition-all transform hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToMekProfile(mek.id);
                        }}
                      >
                        <MekImage
                          assetId={mek.id}
                          size={56}
                          alt={mek.name}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="text-sm w-24">
                        <div 
                          className="text-gray-300 font-medium truncate cursor-pointer transition-all hover:text-yellow-400 hover:drop-shadow-[0_0_8px_rgba(250,182,23,0.8)]"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToMekProfile(mek.id);
                          }}
                        >
                          {mek.name}
                        </div>
                        <div className="text-gray-500 text-xs">Lv.{mek.level} • {mek.goldRate}/hr</div>
                      </div>
                    </div>
                    
                    {/* Main Content Section */}
                    <div className="flex-1 px-4 py-3">
                      {isMaxLevel ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-yellow-500 font-bold text-lg uppercase tracking-wider animate-pulse">
                            MAX LEVEL
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col justify-between">
                          {/* Button Controls - Above XP Bar */}
                          <div className="flex items-center gap-2 mb-2">
                            {/* XP Amount Toggle */}
                            <div className="flex gap-2">
                              {XP_AMOUNTS.map((amount) => (
                                <button
                                  key={amount}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAmounts(prev => ({ ...prev, [mek.id]: amount }));
                                  }}
                                  className={`px-3 py-1 text-xs font-mono rounded transition-all ${
                                    selectedAmount === amount
                                      ? 'bg-yellow-500 text-black font-bold'
                                      : 'bg-transparent border border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                                  }`}
                                >
                                  {amount >= 1000 ? `${amount/1000}K` : amount}
                                </button>
                              ))}
                            </div>
                            
                            {/* Spacer */}
                            <div className="flex-1" />
                            
                            {/* Action Buttons */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                allocateXP(mek.id, selectedAmount, e);
                              }}
                              disabled={pooledXP < selectedAmount}
                              className="px-4 py-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-xs rounded hover:from-yellow-400 hover:to-yellow-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 transition-all shadow-md"
                            >
                              Apply
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                allocateToNextLevel(mek.id, e);
                              }}
                              disabled={pooledXP < 1 || mek.xpToNext === 0}
                              className="px-3 py-1 bg-transparent border border-yellow-500 text-yellow-400 text-xs rounded hover:bg-yellow-500/20 disabled:border-gray-600 disabled:text-gray-600 transition-colors"
                              title="Allocate to next level"
                            >
                              Level Up
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                allocateAll(mek.id, e);
                              }}
                              disabled={pooledXP < 1}
                              className="px-3 py-1 bg-transparent border border-yellow-500 text-yellow-400 text-xs rounded hover:bg-yellow-500/20 disabled:border-gray-600 disabled:text-gray-600 transition-colors"
                              title="Use all XP"
                            >
                              Use All
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                undoLastActionForMek(mek.id);
                              }}
                              disabled={!hasUndo}
                              className={`px-3 py-1 bg-transparent border text-xs rounded transition-colors ${
                                hasUndo 
                                  ? 'border-yellow-500 text-yellow-400 hover:bg-yellow-500/20 cursor-pointer' 
                                  : 'border-gray-600 text-gray-600 cursor-not-allowed'
                              }`}
                              title="Undo last action"
                            >
                              ↶ Undo
                            </button>
                          </div>
                          
                          {/* XP Bar - Below Buttons */}
                          <div className="relative h-5 bg-gray-800 rounded-lg overflow-hidden shadow-inner">
                            {/* Animated background pattern */}
                            <div className="absolute inset-0 opacity-20">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent animate-pulse" />
                            </div>
                            
                            {/* XP Bar Fill */}
                            <div 
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 transition-all duration-500 ease-out"
                              style={{ 
                                width: `${xpPercent}%`,
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 3s linear infinite'
                              }}
                            >
                              {/* Shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                            </div>
                            
                            {/* Border glow effect */}
                            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
                          </div>
                          
                          {/* XP Text below bar */}
                          <div className="text-xs text-gray-400 mt-1 text-center font-mono">
                            {mek.currentXP.toLocaleString()} / {mek.maxXP.toLocaleString()} XP
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sortedMeks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-2xl mb-2">No Meks found</div>
            <div className="text-sm">Try adjusting your search or filters</div>
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1 bg-gray-800/50 border border-gray-700 rounded text-gray-400 hover:border-gray-600 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ←
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-8 h-8 rounded transition-all ${
                    currentPage === i
                      ? 'bg-yellow-500 text-black font-bold'
                      : 'bg-gray-800/50 border border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-3 py-1 bg-gray-800/50 border border-gray-700 rounded text-gray-400 hover:border-gray-600 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              →
            </button>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => window.location.href = '/hub'}
          className="mt-6 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded border border-gray-700 hover:border-gray-600 transition-all transform hover:translate-x-[-2px]"
        >
          ← Back to Hub
        </button>
      </div>

      {/* Level Up Modal */}
      {showLevelUpModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full animate-slideUp">
            <div className="text-2xl font-bold text-yellow-400 text-center mb-3">LEVEL UP!</div>
            <div className="text-center mb-4">
              <div className="text-gray-300 mb-2">{showLevelUpModal.mek.name}</div>
              <div className="text-3xl font-bold text-white">Level {showLevelUpModal.newLevel}</div>
            </div>
            
            <div className="bg-gray-800 rounded p-3 mb-4">
              <div className="text-sm text-gray-400 text-center">
                Your Mek has grown stronger!
              </div>
            </div>
            
            <button
              onClick={() => setShowLevelUpModal(null)}
              className="w-full px-4 py-2 bg-gray-700 text-gray-200 font-medium rounded hover:bg-gray-600 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Add animations to global styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 100% 0; }
        }
        
        @keyframes borderRace {
          0% { left: -20%; }
          100% { left: 120%; }
        }
        
        @keyframes borderRaceReverse {
          0% { right: -20%; }
          100% { right: 120%; }
        }
        
        @keyframes borderRaceVertical {
          0% { top: -20%; }
          100% { top: 120%; }
        }
        
        @keyframes borderRaceVerticalReverse {
          0% { bottom: -20%; }
          100% { bottom: 120%; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-borderRace {
          animation: borderRace 4s linear infinite;
        }
        
        .animate-borderRaceReverse {
          animation: borderRaceReverse 4s linear infinite;
          animation-delay: 2s;
        }
        
        .animate-borderRaceVertical {
          animation: borderRaceVertical 4s linear infinite;
          animation-delay: 1s;
        }
        
        .animate-borderRaceVerticalReverse {
          animation: borderRaceVerticalReverse 4s linear infinite;
          animation-delay: 3s;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}