'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Image from 'next/image';
import BackgroundEffects from '@/components/BackgroundEffects';

// Sample mek images from the 150px folder
const MEK_IMAGES = [
  '000-000-000', '111-111-111', '222-222-222', '333-333-333', '444-444-444',
  '555-555-555', '666-666-666', '777-777-777', '888-888-888', '999-999-999',
  'aa1-aa1-cd1', 'aa1-aa3-hn1', 'aa1-aa4-gk1', 'aa1-ak1-bc2', 'aa1-ak1-de1',
  'ae1-ak1-bc1', 'ae1-ak1-il1', 'ae1-ak2-lg1', 'ae1-ak2-mo1', 'ae1-ak3-br1',
  'ak1-aa2-ji1', 'ak1-aa3-cd1', 'ak1-ak1-aj1', 'ak1-ak1-as1', 'ak1-ak1-da1',
  'am1-aa1-fb1', 'am1-aa2-aj1', 'am1-aa2-hn1', 'am1-aa2-of2', 'am1-ak1-as3',
  'ar1-aa1-eh1', 'ar1-aa2-hn3', 'ar1-aa3-aj2', 'ar1-ak1-aj2', 'ar1-ak3-bc1',
  'bc1-aa1-nm1', 'bc1-aa2-nm1', 'bc1-aa3-nm1', 'bc1-ak1-ji1', 'bc1-ak1-kq1',
  'bc2-aa1-nm1', 'bc2-aa2-nm1', 'bc2-aa3-nm1', 'bc2-ak1-mo1', 'bc2-ak1-nm1',
];

export default function MekSelectorB() {
  const allMeks = useQuery(api.meks.getAllMeksWithSourceKeys, { limit: 500 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectorPosition, setSelectorPosition] = useState(50); // 0-100 position on bar
  const [isSelectorRunning, setIsSelectorRunning] = useState(false);
  const [selectorVelocity, setSelectorVelocity] = useState(0);
  const [timeInZone, setTimeInZone] = useState(0);
  const [gridSize, setGridSize] = useState(30); // Default to 30 meks
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Background particles and stars - must be declared before any returns
  const [particles] = useState(() => 
    [...Array(20)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${5 + Math.random() * 5}s`,
    }))
  );
  
  const [stars] = useState(() =>
    [...Array(60)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() > 0.5,
    }))
  );
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(0);
  const targetIndexRef = useRef(0);
  const animationSpeed = useRef(0);
  const selectorSpeed = useRef(1);
  const targetPosition = useRef(50);
  const lastUpdateTime = useRef(0);
  const totalDistanceTraveled = useRef(0);
  const selectorAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedIndex = useRef(-1);
  
  // Sort meks by rank (lowest to highest) and limit to gridSize
  const sortedMeks = allMeks?.sort((a, b) => (a.rarityRank || 9999) - (b.rarityRank || 9999)).slice(0, gridSize) || [];
  // Fixed column counts for each grid size
  const gridCols = gridSize <= 3 ? 3 : gridSize <= 10 ? 5 : gridSize <= 30 ? 6 : 10;
  const totalMeks = sortedMeks.length;
  
  // Center is perfect (50), edges are weakest
  const centerPosition = 50;

  // Initialize selector sound
  useEffect(() => {
    selectorAudioRef.current = new Audio('/sounds/selector.wav');
    selectorAudioRef.current.volume = 0.3;
    selectorAudioRef.current.preload = 'auto';
  }, []);

  // Play sound when index changes during animation
  const playSelectSound = useCallback(() => {
    if (selectorAudioRef.current) {
      selectorAudioRef.current.currentTime = 0;
      selectorAudioRef.current.play().catch(() => {});
    }
  }, []);

  // Animate the selection movement with Wheel of Fortune physics
  const animate = useCallback(() => {
    // Continue until speed is very low AND we're close to target
    const distanceToTarget = targetIndexRef.current - currentIndexRef.current;
    const absDistance = Math.abs(distanceToTarget);
    
    if (animationSpeed.current > 0.01 || absDistance > 0.5) {
      // Move the selector
      currentIndexRef.current += animationSpeed.current;
      
      // Update visible selection (wrap around if needed)
      let displayIndex = Math.floor(currentIndexRef.current);
      while (displayIndex < 0) displayIndex += totalMeks;
      while (displayIndex >= totalMeks) displayIndex -= totalMeks;
      
      // Play sound when jumping to a new mek
      if (displayIndex !== lastPlayedIndex.current) {
        playSelectSound();
        lastPlayedIndex.current = displayIndex;
      }
      
      setSelectedIndex(displayIndex);
      
      // Gradual friction - like Wheel of Fortune
      // Starts at 0.985 (very little friction) and increases as we slow down
      const minSpeed = 0.016; // ~1 mek per second at 60fps
      const frictionBase = 0.985;
      const frictionIncrease = Math.max(0, (minSpeed * 10 - animationSpeed.current) / (minSpeed * 10)) * 0.015;
      animationSpeed.current *= (frictionBase - frictionIncrease);
      
      // When getting very slow, gently guide to target
      if (animationSpeed.current < minSpeed && absDistance < 5) {
        // Add a tiny correction towards target
        const correction = distanceToTarget * 0.001;
        animationSpeed.current += correction;
        // Ensure minimum speed until very close
        if (absDistance > 1) {
          animationSpeed.current = Math.max(animationSpeed.current, minSpeed * 0.5);
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Animation complete - snap to final position
      let finalIndex = Math.round(targetIndexRef.current);
      while (finalIndex < 0) finalIndex += totalMeks;
      while (finalIndex >= totalMeks) finalIndex -= totalMeks;
      setSelectedIndex(finalIndex);
      setIsAnimating(false);
      animationSpeed.current = 0;
    }
  }, [totalMeks, playSelectSound]);

  // Animate the selector with erratic movement
  useEffect(() => {
    if (!isSelectorRunning) return;
    
    let animationId: number;
    let timeElapsed = 0;
    
    const animateSelector = (timestamp: number) => {
      if (!lastUpdateTime.current) lastUpdateTime.current = timestamp;
      const deltaTime = (timestamp - lastUpdateTime.current) / 1000;
      lastUpdateTime.current = timestamp;
      timeElapsed += deltaTime;
      
      setSelectorPosition(prev => {
        // Calculate distance from center
        const distanceFromCenter = Math.abs(prev - centerPosition);
        const normalizedDistance = distanceFromCenter / 50; // 0 at center, 1 at edges
        
        // Exponential speed increase near center
        const speedMultiplier = 1 + Math.pow(1 - normalizedDistance, 3) * 10; // Up to 11x speed at center
        
        // Erratic movement pattern
        // Choose new target position randomly, but prefer edges
        if (Math.random() < 0.03 || Math.abs(prev - targetPosition.current) < 1) {
          // 3% chance to change direction or when reaching target
          const edgeBias = Math.random();
          if (edgeBias < 0.6) {
            // 60% chance to go to edges (0-5 or 95-100)
            targetPosition.current = Math.random() < 0.5 ? Math.random() * 5 : 95 + Math.random() * 5;
          } else if (edgeBias < 0.85) {
            // 25% chance for mid-range
            targetPosition.current = 10 + Math.random() * 80;
          } else if (edgeBias < 0.98) {
            // 13% chance to dart through center area
            targetPosition.current = 35 + Math.random() * 30;
          } else {
            // 2% chance to hit exact center
            targetPosition.current = 50;
          }
        }
        
        // Move towards target with variable speed and smoothing
        const direction = targetPosition.current > prev ? 1 : -1;
        const distanceToTarget = Math.abs(targetPosition.current - prev);
        const baseSpeed = 35; // Base units per second
        // Smooth deceleration near target
        const smoothingFactor = Math.min(1, distanceToTarget / 10);
        const actualSpeed = baseSpeed * speedMultiplier * deltaTime * smoothingFactor;
        
        let newPosition = prev + direction * actualSpeed;
        
        // Keep within bounds
        newPosition = Math.max(0, Math.min(100, newPosition));
        
        // Store current speed for display
        selectorSpeed.current = speedMultiplier;
        
        return newPosition;
      });
      
      animationId = requestAnimationFrame(animateSelector);
    };
    
    animationId = requestAnimationFrame(animateSelector);
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      lastUpdateTime.current = 0;
    };
  }, [isSelectorRunning]);

  // Handle tap to start/stop selector
  const handleSelectorTap = () => {
    if (isAnimating) return; // Don't allow during animation
    
    if (isSelectorRunning) {
      // Stop the selector and launch
      setIsSelectorRunning(false);
      launchMekSelector();
    } else {
      // Start the selector
      setIsSelectorRunning(true);
      // Start at a random edge position
      const startPos = Math.random() < 0.5 ? Math.random() * 10 : 90 + Math.random() * 10;
      setSelectorPosition(startPos);
      targetPosition.current = 50;
      lastUpdateTime.current = 0;
    }
  };

  // Launch the mek selector based on selector position
  const launchMekSelector = () => {
    // Calculate power based on distance from center
    const distanceFromCenter = Math.abs(selectorPosition - centerPosition);
    const normalizedPower = 1 - (distanceFromCenter / 50); // 1 at center, 0 at edges
    
    // Calculate target and initial velocity
    let targetPos;
    let initialVelocity;
    
    if (normalizedPower > 0.99) {
      // Perfect hit! Green zone (within 1% of center - matches visual green line)
      targetPos = totalMeks - 1; // Rarest mek
      initialVelocity = 0.8; // Moderate speed for clean landing
    } else if (normalizedPower > 0.94) {
      // Red zones right next to green - MASSIVE overshoot!
      // The closer to green, the more violent the overshoot
      const overPower = 3 + (normalizedPower - 0.94) * 20; // 3x to 4x loops minimum
      targetPos = totalMeks * overPower;
      initialVelocity = 2.0 + (normalizedPower - 0.94) * 5; // Very fast launch
    } else if (normalizedPower > 0.8) {
      // Orange zones - strong overshoot
      const overPower = 1.5 + (normalizedPower - 0.8) * 5; // 1.5x to 2.2x loops
      targetPos = totalMeks * overPower;
      initialVelocity = 1.2 + (normalizedPower - 0.8) * 2;
    } else if (normalizedPower > 0.6) {
      // Yellow zones - moderate power
      targetPos = totalMeks * 0.5 + totalMeks * normalizedPower * 0.4;
      initialVelocity = 0.8;
    } else {
      // Blue zones - weak power
      targetPos = Math.floor(totalMeks * normalizedPower * 0.5);
      initialVelocity = 0.3 + normalizedPower * 0.5;
    }
    
    // Add slight variance for realism
    const variance = (Math.random() - 0.5) * 2; // +/- 1 position
    targetPos = targetPos + variance;
    
    targetIndexRef.current = targetPos;
    
    // Start animation with initial velocity
    setIsAnimating(true);
    currentIndexRef.current = selectedIndex;
    animationSpeed.current = initialVelocity; // Set initial speed based on power
    animationRef.current = requestAnimationFrame(animate);
  };

  // Clean up animations on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Reset function
  const handleReset = () => {
    setSelectedIndex(0);
    currentIndexRef.current = 0;
    animationSpeed.current = 0;
    setIsAnimating(false);
    setIsSelectorRunning(false);
    setSelectorPosition(50);
    targetPosition.current = 50;
    lastPlayedIndex.current = -1;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  if (!allMeks) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-yellow-400">Loading Meks...</p>
      </div>
    );
  }

  const currentMek = sortedMeks[selectedIndex];

  return (
    <div 
      ref={containerRef}
      className="min-h-screen text-white relative overflow-hidden select-none bg-black"
    >
      <BackgroundEffects />
      
      <div className="max-w-7xl mx-auto pt-20 px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 
            className="text-6xl font-black text-yellow-400 mb-4 tracking-wider"
            style={{
              fontFamily: "'Orbitron', 'Bebas Neue', 'Impact', sans-serif",
              textShadow: '0 0 30px rgba(250, 182, 23, 0.8), 0 0 60px rgba(250, 182, 23, 0.4)'
            }}
          >
            MEK SELECTOR
          </h1>
          
        </div>


        {/* Power Meter Section */}
        <div className="w-full mb-8 flex flex-col items-center">
          {/* Glowing Round Button */}
          <div className="relative mb-4">
            {/* Spinning Underglow Effect - matching crafting page exactly */}
            <div 
              className="absolute rounded-full"
              style={{
                width: '160px',
                height: '160px',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: `
                  conic-gradient(from 0deg at 50% 50%,
                    rgba(250, 182, 23, 0.4) 0deg,
                    rgba(236, 72, 153, 0.3) 60deg,
                    rgba(147, 51, 234, 0.3) 120deg,
                    rgba(59, 130, 246, 0.3) 180deg,
                    rgba(147, 51, 234, 0.3) 240deg,
                    rgba(236, 72, 153, 0.3) 300deg,
                    rgba(250, 182, 23, 0.4) 360deg
                  )`,
                filter: 'blur(30px)',
                animation: isSelectorRunning ? 'spinGlow 2s linear infinite' : 'spinGlow 10s linear infinite',
              }}
            />
            
            {/* Magic Sand Particles - from crafting page */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: '3px',
                  height: '3px',
                  background: `radial-gradient(circle, rgba(250, 182, 23, 1) 0%, rgba(250, 182, 23, 0) 70%)`,
                  animationName: 'magicParticle',
                  animationDuration: `${2 + Math.random() * 2}s`,
                  animationTimingFunction: 'ease-out',
                  animationIterationCount: 'infinite',
                  animationDelay: `${i * 0.1}s`,
                  left: '50%',
                  top: '50%',
                  '--angle': `${i * 18}deg`,
                  '--turbulence': `${Math.random() * 20 - 10}px`,
                } as React.CSSProperties}
              />
            ))}
            
            <button
              onClick={handleSelectorTap}
              disabled={isAnimating}
              className="relative w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full 
                         shadow-lg shadow-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/70 
                         disabled:from-gray-600 disabled:to-gray-700 disabled:shadow-gray-600/30
                         transition-all transform hover:scale-105 active:scale-95"
              style={{
                boxShadow: isSelectorRunning 
                  ? '0 0 40px rgba(250, 182, 23, 0.8), 0 0 80px rgba(250, 182, 23, 0.4)' 
                  : undefined
              }}
            >
              <div className="text-sm font-bold text-black">
                {!isSelectorRunning && !isAnimating && 'TAP'}
                {isSelectorRunning && 'STOP'}
                {isAnimating && '...'}
              </div>
            </button>
          </div>
          
          <div className="w-full h-24 bg-gray-900 rounded-lg border-2 border-gray-600 relative overflow-hidden">
            {/* Zone colors from center outward */}
            <div className="absolute inset-0 flex">
              {/* Left side zones (mirror of right) */}
              <div className="w-[10%] bg-blue-900/30" /> {/* Weakest */}
              <div className="w-[10%] bg-blue-800/30" />
              <div className="w-[10%] bg-yellow-900/30" />
              <div className="w-[10%] bg-yellow-800/30" />
              <div className="w-[8%] bg-orange-900/40" />
              <div className="w-[2%] bg-red-900/50" /> {/* Near center */}
              
              {/* Center green zone */}
              <div className="w-[1%] bg-green-500/70" />
              
              {/* Right side zones (mirror of left) */}
              <div className="w-[2%] bg-red-900/50" /> {/* Near center */}
              <div className="w-[8%] bg-orange-900/40" />
              <div className="w-[10%] bg-yellow-800/30" />
              <div className="w-[10%] bg-yellow-900/30" />
              <div className="w-[10%] bg-blue-800/30" />
              <div className="w-[9%] bg-blue-900/30" /> {/* Weakest */}
            </div>
            
            {/* Center marker line */}
            <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-green-400" />
            
            {/* Moving selector */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg shadow-white/50"
              style={{ 
                left: `${selectorPosition}%`,
                transform: 'translateX(-50%)',
                transition: isSelectorRunning ? 'none' : 'left 0.05s ease-out'
              }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-white" />
              </div>
            </div>
            
            {/* Zone labels */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 pointer-events-none">
              <span className="text-[8px] text-green-400 font-bold"></span>
            </div>
            
          </div>
          
        </div>

        {/* Mek Grid */}
        <div className="mb-8 flex justify-center">
          <div 
            className="grid gap-0"
            style={{ 
              gridTemplateColumns: `repeat(${gridCols}, minmax(0, max-content))`,
              width: 'fit-content'
            }}
          >
            {sortedMeks.map((mek, index) => {
              const isSelected = index === selectedIndex;
              // Use actual mek image from 150px folder
              const mekImage = MEK_IMAGES[index % MEK_IMAGES.length];
              
              return (
                <div
                  key={mek._id}
                  className={`relative aspect-square rounded overflow-hidden transition-all ${
                    isSelected 
                      ? 'ring-2 ring-yellow-400 scale-105 z-10 duration-100' 
                      : 'ring-1 ring-gray-700 opacity-40 duration-300'
                  }`}
                  style={{
                    maxWidth: gridSize <= 3 ? '180px' : gridSize <= 10 ? '120px' : gridSize <= 30 ? '80px' : '60px',
                    maxHeight: gridSize <= 3 ? '180px' : gridSize <= 10 ? '120px' : gridSize <= 30 ? '80px' : '60px'
                  }}
                >
                  <Image
                    src={`/mek-images/150px/${mekImage}.webp`}
                    alt={mek.assetName || `Mek #${mek.assetId}`}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image doesn't exist
                      const img = e.target as HTMLImageElement;
                      const parent = img.parentElement;
                      if (parent) {
                        img.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center';
                        fallback.innerHTML = `<span class="text-xs text-gray-500">#${mek.assetId}</span>`;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Controls - Now at bottom */}
        <div className="flex justify-center gap-4 mt-8">
          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
          >
            Reset
          </button>
          
          {/* Grid Size Selector */}
          <div className="flex gap-2 items-center">
            <span className="text-gray-400">Grid Size:</span>
            {[3, 10, 30, 100].map(size => (
              <button
                key={size}
                onClick={() => {
                  setGridSize(size);
                  handleReset();
                }}
                className={`px-4 py-2 rounded-lg transition-colors font-semibold ${
                  gridSize === size 
                    ? 'bg-yellow-400 text-black' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}