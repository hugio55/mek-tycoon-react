'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Mek {
  id: string;
  number: number;
  rank: string;
  goldPerHour: number;
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
      goldPerHour: rank === 'Mythic' ? 800 + Math.floor(Math.random() * 400) :
                   rank === 'Legendary' ? 400 + Math.floor(Math.random() * 400) :
                   rank === 'Epic' ? 200 + Math.floor(Math.random() * 200) :
                   rank === 'Rare' ? 100 + Math.floor(Math.random() * 100) :
                   50 + Math.floor(Math.random() * 50),
      image: shuffledImages[imageIndex]
    };
  });
};

// Layout variations (not just colors)
const LAYOUT_VARIATIONS = {
  classic: 'Classic Grid',
  carousel: 'Carousel Style',
  honeycomb: 'Honeycomb',
  scattered: 'Scattered Chaos',
  pyramid: 'Pyramid Stack'
};

export default function MekSelector() {
  const [meks, setMeks] = useState<Mek[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gridSize, setGridSize] = useState(10);
  const [rerollUnits, setRerollUnits] = useState(3);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [showLightbox, setShowLightbox] = useState(true);
  const [layoutVariation, setLayoutVariation] = useState<keyof typeof LAYOUT_VARIATIONS>('classic');
  const animationRef = useRef<number>(0);
  const [backgroundStars, setBackgroundStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number}>>([]);
  const [finalMekIndex, setFinalMekIndex] = useState(0);
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [selectedMekPosition, setSelectedMekPosition] = useState({ x: 0, y: 0 });

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
    setIsZooming(false);
    setShowInfoCard(false);
    
    const duration = 5000;
    const startTime = Date.now();
    const loops = gridSize <= 10 ? 3 : gridSize <= 40 ? 4 : 5;
    const totalSteps = meks.length * loops + finalMekIndex;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        setIsAnimating(false);
        setSelectedIndex(finalMekIndex);
        
        // Get position of selected element for smooth animation
        const selectedElement = document.getElementById(`mek-${finalMekIndex}`);
        if (selectedElement) {
          const rect = selectedElement.getBoundingClientRect();
          setSelectedMekPosition({ 
            x: rect.left + rect.width / 2, 
            y: rect.top + rect.height / 2 
          });
        }
        
        setTimeout(() => {
          setIsZooming(true);
          setTimeout(() => setShowInfoCard(true), 800);
        }, 300);
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
    setIsZooming(false);
    setIsAnimating(false);
    setShowInfoCard(false);
    setFinalMekIndex(Math.floor(Math.random() * size));
  };

  const getGridClass = () => {
    switch(gridSize) {
      case 3: return 'grid grid-cols-3';
      case 10: return 'grid grid-cols-5';
      case 40: return 'grid grid-cols-8';
      case 100: return 'grid grid-cols-10';
      default: return 'grid grid-cols-5';
    }
  };

  const getMekSize = () => {
    // Calculate size to fit without scrolling
    switch(gridSize) {
      case 3: return 'w-32 h-32';
      case 10: return 'w-20 h-20';
      case 40: return 'w-12 h-12';
      case 100: return 'w-10 h-10';
      default: return 'w-20 h-20';
    }
  };

  const renderMekGrid = () => {
    if (layoutVariation === 'pyramid' && gridSize <= 10) {
      // Pyramid layout for small grids
      const rows = [
        meks.slice(0, 1),
        meks.slice(1, 3),
        meks.slice(3, 6),
        meks.slice(6, 10)
      ];
      
      return (
        <div className="flex flex-col items-center justify-center h-full">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((mek, index) => {
                const actualIndex = rowIndex === 0 ? 0 :
                                   rowIndex === 1 ? 1 + index :
                                   rowIndex === 2 ? 3 + index :
                                   6 + index;
                return renderMekCard(mek, actualIndex);
              })}
            </div>
          ))}
        </div>
      );
    }
    
    if (layoutVariation === 'scattered') {
      // Scattered random positions
      return (
        <div className="relative w-full h-full">
          {meks.map((mek, index) => {
            const style = {
              position: 'absolute' as const,
              left: `${(index * 37) % 80 + 5}%`,
              top: `${(index * 61) % 80 + 5}%`,
              transform: `rotate(${(index * 13) % 30 - 15}deg)`
            };
            return (
              <div key={mek.id} style={style}>
                {renderMekCard(mek, index)}
              </div>
            );
          })}
        </div>
      );
    }
    
    if (layoutVariation === 'carousel') {
      return (
        <div className="flex overflow-x-auto h-full items-center">
          {meks.map((mek, index) => renderMekCard(mek, index))}
        </div>
      );
    }
    
    // Default grid layout - NO GAPS
    return (
      <div className={`${getGridClass()} w-fit mx-auto`}>
        {meks.map((mek, index) => renderMekCard(mek, index))}
      </div>
    );
  };

  const renderMekCard = (mek: Mek, index: number) => {
    const isSelected = selectedIndex === index;
    const cardSize = getMekSize();
    
    return (
      <div
        id={`mek-${index}`}
        key={mek.id}
        className={`
          relative overflow-hidden ${cardSize} 
          ${isSelected && !isZooming ? 'ring-2 ring-yellow-400 z-30' : ''}
          ${isZooming && isSelected ? 'invisible' : ''}
          ${isZooming && !isSelected ? 'opacity-20' : ''}
          transition-opacity duration-300
          ${layoutVariation === 'honeycomb' ? 'hexagon-clip' : ''}
        `}
      >
        <img 
          src={`/mek-images/150px/${mek.image}.webp`}
          alt={`Mek ${mek.number}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/meks/placeholder.png';
          }}
        />
        {isSelected && !isZooming && (
          <div className="absolute inset-0 ring-2 ring-yellow-400 ring-inset animate-pulse" />
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
          
          <div className="fixed inset-0 flex items-center justify-center z-50 p-8">
            <div 
              className="relative w-full max-w-4xl"
              style={{
                background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(42, 42, 42, 0.98) 50%, rgba(26, 26, 26, 0.98) 100%)',
                border: '2px solid rgba(250, 182, 23, 0.6)',
                boxShadow: '0 0 80px rgba(250, 182, 23, 0.3), inset 0 0 40px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Layout variation dropdown */}
              <div className="absolute top-4 right-4 z-20">
                <select
                  value={layoutVariation}
                  onChange={(e) => setLayoutVariation(e.target.value as keyof typeof LAYOUT_VARIATIONS)}
                  className="bg-black/80 text-yellow-400 border border-yellow-400/50 rounded px-3 py-1 text-xs uppercase tracking-wider"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  {Object.entries(LAYOUT_VARIATIONS).map(([key, name]) => (
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
                  MEK SELECTION LOTTERY
                </h1>
                <div className="text-center text-xs text-gray-500 uppercase tracking-wider mt-1">
                  5 Second Random Selection
                </div>
              </div>
              
              <div className="relative p-5">
                {/* Grid Size Selector */}
                <div className="flex justify-center gap-1 mb-4">
                  {[3, 10, 40, 100].map((size) => (
                    <button
                      key={size}
                      onClick={() => handleGridSizeChange(size)}
                      className={`
                        px-5 py-1.5 text-xs font-bold transition-all uppercase tracking-wider
                        ${gridSize === size 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/60' 
                          : 'bg-black/40 text-gray-500 border border-gray-700 hover:border-gray-500'
                        }
                      `}
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                
                {/* Mek Grid Container - NO SCROLL, FIT ALL */}
                <div className="bg-black/60 p-4 mb-4 border border-gray-800 flex items-center justify-center" 
                     style={{ height: '400px' }}>
                  {renderMekGrid()}
                </div>
                
                {/* Animated Growing Mek - From thumbnail to spotlight */}
                {isZooming && selectedIndex !== null && (
                  <div 
                    className="fixed z-[60] pointer-events-none animate-grow-to-center"
                    style={{
                      left: selectedMekPosition.x,
                      top: selectedMekPosition.y,
                    }}
                  >
                    <img 
                      src={`/mek-images/150px/${meks[selectedIndex].image}.webp`}
                      alt={`Mek ${meks[selectedIndex].number}`}
                      className="w-64 h-64 object-cover rounded-lg shadow-2xl"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/meks/placeholder.png';
                      }}
                    />
                  </div>
                )}
                
                {/* Info Card - Shows after animation */}
                {showInfoCard && selectedIndex !== null && (
                  <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-fade-in">
                    <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-400 rounded-lg p-8 shadow-2xl shadow-yellow-400/30">
                      <div className="flex flex-col items-center gap-6">
                        <img 
                          src={`/mek-images/150px/${meks[selectedIndex].image}.webp`}
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
                          <div className="text-green-400 text-2xl font-semibold">
                            {meks[selectedIndex].goldPerHour} Gold/Hour
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

                {!isAnimating && !isZooming && (
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
        @keyframes grow-to-center {
          from {
            transform: translate(-50%, -50%) scale(1);
          }
          to {
            transform: translate(-50%, -50%) translateX(calc(50vw - var(--x))) translateY(calc(50vh - var(--y))) scale(4);
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
        
        .animate-grow-to-center {
          animation: grow-to-center 0.8s ease-out forwards;
          --x: 0px;
          --y: 0px;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .hexagon-clip {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
      `}</style>
    </div>
  );
}