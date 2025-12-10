'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getMediaUrl } from "@/lib/media-url";

interface Mek {
  id: string;
  number: number;
  rank: string;
  rarityRank: number; // 1-4000, lower = rarer
  image: string;
}

// Real mek images from the folder
const mekImages = [
  '000-000-000', '111-111-111', '222-222-222', '333-333-333',
  '444-444-444', '555-555-555', '666-666-666', '777-777-777',
  '888-888-888', '999-999-999', 'aa1-aa1-cd1', 'aa1-aa3-hn1',
  'aa1-aa4-gk1', 'aa1-ak1-bc2', 'aa1-ak1-de1', 'aa1-ak1-ji2',
  'aa1-ak1-kq2', 'aa1-ak1-mo1', 'aa1-ak1-nm1', 'aa1-ak2-lg1',
  'bc2-dm1-ap1', 'bc2-dm1-as3', 'bc2-dm1-aw2', 'bc2-dm1-il2',
  'bc2-dm2-eh2', 'bc2-dm2-fb1', 'bc2-dm2-of1', 'bc2-ds1-as3',
  'bc2-ds1-ji1', 'bc2-ds2-de1', 'bc2-ee1-bc1', 'bc2-ee1-ey1',
  'bc2-ee1-mo1', 'bc2-er1-bc1', 'bc2-er1-mt1', 'bc2-er3-aj2',
  'bc2-er3-eh1', 'bc2-ev1-eh1', 'bc2-ev1-hn1', 'bc2-fd2-lg1',
  'dp2-bf4-il2', 'dp2-bf4-nm1', 'dp2-bi2-fb2', 'dp2-bi2-ji2',
  'dp2-bj1-hn1', 'dp2-bj2-da1', 'dp2-bj2-eh2', 'dp2-bl1-bc1',
  'dp2-bl3-mo1', 'dp2-bl4-br2', 'dp2-bq1-bc1', 'dp2-bq1-nm1',
  'dp2-bq3-de3', 'dp2-bq3-eh1', 'dp2-cb1-fb2', 'dp2-cb2-gk2',
  'dp2-dc2-gk3', 'dp2-dh2-fb2', 'dp2-dh2-lg1', 'dp2-dm1-aw1',
  'hb1-gn1-hn1', 'hb1-gn2-ji1', 'hb1-gn2-nm1', 'hb1-gn2-of1',
  'hb1-hp1-aj1', 'hb1-hp3-ap1', 'hb1-io1-ap1', 'hb1-io1-cd1',
  'hb1-io2-ev1', 'hb1-jg1-il2', 'hb1-jg1-lg1', 'hb1-jg2-bc1',
  'hb1-jg2-br3', 'hb1-jg2-de1', 'hb1-jg3-mo1', 'hb1-jg3-nm1',
  'hb1-ky1-hn3', 'hb1-ky1-nm1', 'hb2-aa1-gk2', 'hb2-aa1-ji1'
];

const generateRandomMeks = (count: number): Mek[] => {
  const ranks = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
  const shuffledImages = [...mekImages].sort(() => Math.random() - 0.5);
  
  return Array.from({ length: count }, (_, i) => {
    const imageIndex = i % shuffledImages.length;
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    return {
      id: `mek-${i}`,
      number: 1000 + Math.floor(Math.random() * 8999),
      rank: rank,
      rarityRank: rank === 'Mythic' ? 1 + Math.floor(Math.random() * 50) :
                  rank === 'Legendary' ? 50 + Math.floor(Math.random() * 200) :
                  rank === 'Epic' ? 250 + Math.floor(Math.random() * 500) :
                  rank === 'Rare' ? 750 + Math.floor(Math.random() * 1000) :
                  1750 + Math.floor(Math.random() * 2250),
      image: shuffledImages[imageIndex]
    };
  });
};

// Mek frame styles
const FRAME_STYLES = {
  none: 'No borders',
  thin: 'Thin stroke no rounded corners',
  thin_rounded: 'Thin stroke with rounded corners',
  thick: 'Thick stroke no rounded corners',
  thick_rounded: 'Thick stroke with rounded corners',
  contract_plus: 'Contract Plus - Empty slot with + symbol',
  contract_glow: 'Contract Glow - Yellow border with shadow',
  contract_gradient: 'Contract Gradient - Yellow gradient background'
};

export default function MekSelector() {
  const [meks, setMeks] = useState<Mek[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gridSize, setGridSize] = useState(50);
  const [rerollUnits, setRerollUnits] = useState(3);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [showLightbox, setShowLightbox] = useState(true);
  const [frameStyle, setFrameStyle] = useState<keyof typeof FRAME_STYLES>('none');
  const animationRef = useRef<number>(0);
  const [backgroundStars, setBackgroundStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number}>>([]);
  const [finalMekIndex, setFinalMekIndex] = useState(0);
  const [showInfoCard, setShowInfoCard] = useState(false);

  useEffect(() => {
    const newMeks = generateRandomMeks(gridSize);
    setMeks(newMeks);
    setFinalMekIndex(Math.floor(Math.random() * gridSize));
    
    const stars = [...Array(50)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.6 + 0.2,
    }));
    setBackgroundStars(stars);
  }, [gridSize]);

  const startSelection = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSelectedIndex(0);
    setIsFlashing(false);
    setShowInfoCard(false);
    
    const duration = 3600; // 15% faster minimum speed
    const startTime = Date.now();
    const loops = gridSize <= 10 ? 3 : gridSize <= 40 ? 4 : 5;
    const totalSteps = meks.length * loops + finalMekIndex;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        setIsAnimating(false);
        setSelectedIndex(finalMekIndex);
        
        // Flash/glow the selected mek, then show info card
        setTimeout(() => {
          setIsFlashing(true);
          setTimeout(() => setShowInfoCard(true), 500);
        }, 200);
        return;
      }
      
      // Smooth linear deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentStep = Math.floor(totalSteps * easeOut);
      const currentIndex = currentStep % meks.length;
      
      setSelectedIndex(currentIndex);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const handleReroll = () => {
    if (rerollUnits > 0) {
      setRerollUnits(rerollUnits - 1);
      const newMeks = generateRandomMeks(gridSize);
      setMeks(newMeks);
      setFinalMekIndex(Math.floor(Math.random() * gridSize));
      startSelection();
    }
  };

  const handleConfirm = () => {
    if (selectedIndex !== null) {
      console.log('Selected Mek:', meks[selectedIndex]);
      setShowLightbox(false);
    }
  };

  const handleGridSizeChange = (size: number) => {
    setGridSize(size);
    setSelectedIndex(null);
    setIsFlashing(false);
    setIsAnimating(false);
    setShowInfoCard(false);
    setFinalMekIndex(Math.floor(Math.random() * size));
  };

  const calculateOptimalGrid = () => {
    // Calculate optimal columns for responsive layout
    // Aim for a wide rectangular layout that uses full width
    const containerAspectRatio = 3.5; // Wide container (width/height ratio)
    
    // Calculate ideal columns based on count and aspect ratio
    let columns: number;
    let rows: number;
    
    if (gridSize <= 3) {
      columns = gridSize;
      rows = 1;
    } else if (gridSize <= 10) {
      columns = gridSize;
      rows = 1;
    } else {
      // For larger counts, optimize for wide rectangular layout
      // Start with aspect ratio calculation
      rows = Math.ceil(Math.sqrt(gridSize / containerAspectRatio));
      columns = Math.ceil(gridSize / rows);
      
      // Adjust to ensure all meks fit and use width efficiently
      while (rows * columns < gridSize) {
        columns++;
      }
      
      // Prefer wider layouts (more columns, fewer rows)
      if (rows > 1 && (rows - 1) * columns >= gridSize) {
        rows--;
        columns = Math.ceil(gridSize / rows);
      }
    }
    
    return { columns, rows };
  };

  const getMekSize = () => {
    // Return empty - we'll handle sizing differently
    return '';
  };

  const renderMekGrid = () => {
    const { columns, rows } = calculateOptimalGrid();
    
    return (
      <div 
        className="grid gap-0 w-full h-full"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }}
      >
        {meks.map((mek, index) => renderMekCard(mek, index))}
      </div>
    );
  };


  const getFrameClasses = () => {
    switch(frameStyle) {
      case 'thin':
        return 'border border-gray-400';
      case 'thin_rounded':
        return 'border border-gray-400 rounded-lg';
      case 'thick':
        return 'border-2 border-gray-300';
      case 'thick_rounded':
        return 'border-2 border-gray-300 rounded-lg';
      case 'contract_plus':
        return 'border-2 border-gray-700 bg-black/40';
      case 'contract_glow':
        return 'border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,182,23,0.5)]';
      case 'contract_gradient':
        return 'border-2 border-yellow-600/50 bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 hover:shadow-lg hover:shadow-yellow-500/20';
      default:
        return '';
    }
  };

  const renderMekCard = (mek: Mek, index: number) => {
    const isSelected = selectedIndex === index;
    const showPlusIcon = frameStyle === 'contract_plus';
    
    return (
      <div
        id={`mek-${index}`}
        key={mek.id}
        className={`
          relative overflow-hidden w-full h-full
          ${getFrameClasses()}
          ${isSelected && !isFlashing ? 'ring-2 ring-yellow-400 z-30' : ''}
          ${isSelected && isFlashing ? 'animate-flash-glow z-30' : ''}
          transition-opacity duration-300
          ${showPlusIcon ? 'flex items-center justify-center' : ''}
        `}
      >
        {showPlusIcon ? (
          <div className="flex flex-col items-center justify-center text-gray-600 hover:text-yellow-500/60 transition-colors">
            <span className="text-2xl">+</span>
            <span className="text-[8px] uppercase">Empty</span>
          </div>
        ) : (
          <>
            <img
              src={getMediaUrl(`/mek-images/150px/${mek.image}.webp`)}
              alt={`Mek ${mek.number}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/meks/placeholder.png';
              }}
            />
            {isSelected && !isFlashing && (
              <div className="absolute inset-0 ring-2 ring-yellow-400 ring-inset animate-pulse" />
            )}
          </>
        )}
      </div>
    );
  };

  const getRankColor = (rank: string) => {
    switch(rank) {
      case 'Mythic': return 'text-red-400 bg-red-900/20';
      case 'Legendary': return 'text-orange-400 bg-orange-900/20';
      case 'Epic': return 'text-purple-400 bg-purple-900/20';
      case 'Rare': return 'text-blue-400 bg-blue-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-black relative">
      
      {/* Background Page Content */}
      <div className="fixed inset-0 overflow-hidden">
        <div 
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(250, 182, 23, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(250, 182, 23, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(250, 182, 23, 0.08) 0%, transparent 70%)
            `
          }}
        />
        
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 35px,
                rgba(250, 182, 23, 0.03) 35px,
                rgba(250, 182, 23, 0.03) 70px
              )
            `,
          }}
        />
        
        {backgroundStars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity * 0.5,
            }}
          />
        ))}
        
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-5xl font-bold text-yellow-400 mb-8" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              PROFILE
            </h1>
            
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-yellow-500/20 rounded-xl p-6 backdrop-blur">
                <h2 className="text-xl text-yellow-400 mb-4 font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>STATISTICS</h2>
                <div className="space-y-3 text-gray-300">
                  <div className="flex justify-between">
                    <span>Total Meks:</span>
                    <span className="text-yellow-400">145</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gold per Hour:</span>
                    <span className="text-yellow-400">12,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rank:</span>
                    <span className="text-purple-400">Diamond III</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-yellow-500/20 rounded-xl p-6 backdrop-blur">
                <h2 className="text-xl text-yellow-400 mb-4 font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>INVENTORY</h2>
                <div className="space-y-3 text-gray-300">
                  <div className="flex justify-between">
                    <span>Re-roll Units:</span>
                    <span className="text-cyan-400">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Upgrade Tokens:</span>
                    <span className="text-green-400">27</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mystery Boxes:</span>
                    <span className="text-purple-400">5</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-yellow-500/20 rounded-xl p-6 backdrop-blur">
                <h2 className="text-xl text-yellow-400 mb-4 font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>RECENT ACTIVITY</h2>
                <div className="space-y-3 text-gray-300">
                  <p className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Completed Mission #42
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-yellow-400">★</span> Unlocked New Mek
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-purple-400">🏆</span> Achievement Earned
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center py-12">
              <button className="px-12 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all text-lg" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                SLOT MEK
              </button>
              <p className="text-gray-500 mt-4 text-sm">Click to open Mek Selection Lottery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {showLightbox && (
        <>
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-40"
            onClick={() => setShowLightbox(false)}
          />
          
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div 
              className="relative w-[95vw] max-w-[1600px]"
              style={{
                background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(42, 42, 42, 0.98) 50%, rgba(26, 26, 26, 0.98) 100%)',
                border: '2px solid rgba(250, 182, 23, 0.6)',
                boxShadow: '0 0 80px rgba(250, 182, 23, 0.3), inset 0 0 40px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Frame style dropdown */}
              <div className="absolute top-4 right-4 z-20">
                <select
                  value={frameStyle}
                  onChange={(e) => setFrameStyle(e.target.value as keyof typeof FRAME_STYLES)}
                  className="bg-black/80 text-yellow-400 border border-yellow-400/50 rounded px-3 py-1 text-xs uppercase tracking-wider"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  {Object.entries(FRAME_STYLES).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Industrial overlays */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  background: `
                    repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 10px,
                      rgba(0, 0, 0, 0.1) 10px,
                      rgba(0, 0, 0, 0.1) 20px
                    )
                  `,
                }}
              />
              
              {/* Header */}
              <div className="relative p-5 overflow-hidden" style={{
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
                <button
                  onClick={() => setShowLightbox(false)}
                  className="absolute top-4 left-4 text-gray-400 hover:text-yellow-400 text-3xl transition-colors z-10"
                >
                  ×
                </button>
                
                <h1 
                  className="text-center"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '36px',
                    fontWeight: '900',
                    letterSpacing: '3px',
                    textShadow: '0 0 30px rgba(250, 182, 23, 0.6)',
                    color: '#fab617'
                  }}
                >
                  MEK RECRUITMENT LOTTERY
                </h1>
                <div className="text-center text-xs text-gray-500 uppercase tracking-wider mt-1">
                  5 Second Random Selection
                </div>
              </div>
              
              <div className="relative p-5">
                {/* Grid Size Slider */}
                <div className="mb-4 px-8">
                  <div className="flex items-center justify-between mb-2">
                    <label 
                      className="text-yellow-400 text-sm uppercase tracking-wider" 
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      Mek Count: {gridSize}
                    </label>
                    <div className="text-gray-400 text-xs uppercase tracking-wider">
                      {calculateOptimalGrid().columns} × {calculateOptimalGrid().rows} grid
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs font-bold">3</span>
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min="3"
                        max="100"
                        value={gridSize}
                        onChange={(e) => handleGridSizeChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer mek-slider"
                        style={{
                          background: `linear-gradient(to right, #fab617 0%, #fab617 ${((gridSize - 3) / 97) * 100}%, #374151 ${((gridSize - 3) / 97) * 100}%, #374151 100%)`
                        }}
                      />
                    </div>
                    <span className="text-gray-500 text-xs font-bold">100</span>
                  </div>
                </div>
                
                {/* Mek Grid Container - NO SCROLL, FIT ALL */}
                <div className="bg-black/60 mb-4 border border-gray-800 overflow-hidden w-full flex items-center" 
                     style={{ height: '400px', padding: '0' }}>
                  {renderMekGrid()}
                </div>
                
                
                {/* Info Card - Shows after animation */}
                {showInfoCard && selectedIndex !== null && (
                  <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-fade-in">
                    <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-400 rounded-lg p-8 shadow-2xl shadow-yellow-400/30">
                      <div className="flex flex-col items-center gap-6">
                        <img
                          src={getMediaUrl(`/mek-images/150px/${meks[selectedIndex].image}.webp`)}
                          alt={`Mek ${meks[selectedIndex].number}`}
                          className="w-64 h-64 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/meks/placeholder.png';
                          }}
                        />
                        <div className="text-center space-y-3">
                          <h3 className="text-3xl font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                            MEK #{meks[selectedIndex].number}
                          </h3>
                          <div className={`inline-block px-6 py-2 rounded-full text-lg font-bold ${getRankColor(meks[selectedIndex].rank)}`}>
                            {meks[selectedIndex].rank}
                          </div>
                          <div className="text-yellow-400 text-2xl font-semibold">
                            Rank #{meks[selectedIndex].rarityRank}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleReroll}
                    disabled={rerollUnits === 0}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className={`
                      relative px-6 py-2 text-xs uppercase tracking-wider font-bold
                      ${rerollUnits > 0 
                        ? 'bg-black/60 text-gray-300 border border-gray-600 hover:border-gray-400' 
                        : 'bg-black/40 text-gray-600 border border-gray-800 cursor-not-allowed'
                      }
                    `}
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                    }}
                  >
                    <span className="opacity-60">RE-ROLL</span>
                    <span className="ml-2 text-yellow-400">[{rerollUnits}]</span>
                    {showTooltip && rerollUnits === 0 && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-[10px] whitespace-nowrap border border-gray-700">
                        No Re-roll Units
                      </div>
                    )}
                  </button>
                  
                  <button
                    onClick={handleConfirm}
                    disabled={!showInfoCard}
                    className={`
                      px-6 py-2 text-xs uppercase tracking-wider font-bold
                      ${showInfoCard 
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/60 hover:bg-yellow-500/30' 
                        : 'bg-black/40 text-gray-600 border border-gray-800 cursor-not-allowed'
                      }
                    `}
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                    }}
                  >
                    CONFIRM SELECTION
                  </button>
                </div>

                {!isAnimating && !isFlashing && (
                  <button
                    onClick={startSelection}
                    className="mt-4 w-full py-3 font-bold text-black text-sm bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 transition-all uppercase tracking-wider"
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      letterSpacing: '2px',
                    }}
                  >
                    START 5-SECOND LOTTERY
                  </button>
                )}

                {isAnimating && (
                  <div className="mt-4 text-center">
                    <p className="text-yellow-400 text-xs uppercase tracking-wider animate-pulse">Selecting...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      
      <style jsx global>{`        
        @keyframes flash-glow {
          0% {
            box-shadow: 0 0 0 rgba(250, 182, 23, 0);
            border-color: rgba(250, 182, 23, 0.6);
          }
          25% {
            box-shadow: 0 0 20px rgba(250, 182, 23, 0.8), inset 0 0 20px rgba(250, 182, 23, 0.3);
            border-color: rgba(250, 182, 23, 1);
          }
          50% {
            box-shadow: 0 0 40px rgba(250, 182, 23, 1), inset 0 0 30px rgba(250, 182, 23, 0.5);
            border-color: rgba(250, 182, 23, 1);
          }
          75% {
            box-shadow: 0 0 20px rgba(250, 182, 23, 0.8), inset 0 0 20px rgba(250, 182, 23, 0.3);
            border-color: rgba(250, 182, 23, 1);
          }
          100% {
            box-shadow: 0 0 10px rgba(250, 182, 23, 0.6);
            border-color: rgba(250, 182, 23, 0.8);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        .animate-flash-glow {
          animation: flash-glow 1s ease-in-out;
          border: 2px solid rgba(250, 182, 23, 0.8);
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}