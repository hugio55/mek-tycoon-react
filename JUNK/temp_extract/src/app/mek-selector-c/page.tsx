'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Image from 'next/image';

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

export default function MekSelectorC() {
  const allMeks = useQuery(api.meks.getAllMeksWithSourceKeys, { limit: 500 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [gridSize, setGridSize] = useState(30); // Default to 30 meks
  const [isAnimating, setIsAnimating] = useState(false);
  const [feedback, setFeedback] = useState<'perfect' | 'undershoot' | 'overshoot' | null>(null);
  const [angle, setAngle] = useState(0);
  const [radius, setRadius] = useState(140); // Distance from center
  const [isRotating, setIsRotating] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [targetRadius, setTargetRadius] = useState(140);
  const [isMovingInward, setIsMovingInward] = useState(true);
  
  // Background particles and stars
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
  const radarRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef(0);
  const targetIndexRef = useRef(0);
  const currentIndexRef = useRef(0);
  const selectorAnimRef = useRef<number>();
  
  // Sort meks by rank (lowest to highest) and limit to gridSize
  const sortedMeks = allMeks?.sort((a, b) => (a.rarityRank || 9999) - (b.rarityRank || 9999)).slice(0, gridSize) || [];
  const totalMeks = sortedMeks.length;

  // Animation effect
  useEffect(() => {
    if (!isRotating) return;
    
    let lastTime = 0;
    let currentAngle = angle;
    let currentRadius = radius;
    let timeElapsed = 0;
    
    const animate = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      timeElapsed += deltaTime;
      
      // Calculate radius with sine wave for smooth in/out
      const baseRadius = 80 + Math.sin(timeElapsed * 2) * 50; // Oscillates between 30 and 130
      const jitter = (Math.random() - 0.5) * 10;
      currentRadius = Math.max(20, Math.min(140, baseRadius + jitter));
      
      // Speed based on distance from center
      const distanceRatio = (140 - currentRadius) / 140;
      const speed = 1 + distanceRatio * 4; // 1x to 5x speed
      
      // Update angle
      currentAngle = (currentAngle + speed * deltaTime * 100) % 360;
      
      // Apply state updates
      setAngle(currentAngle);
      setRadius(currentRadius);
      setRotationSpeed(speed);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRotating]);

  // Start rotation
  const startRotation = () => {
    if (isAnimating) return;
    setIsRotating(true);
    setRotationSpeed(1);
    lastTimeRef.current = 0;
  };

  // Stop rotation and calculate result
  const stopRotation = () => {
    if (!isRotating) return;
    setIsRotating(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Calculate which zone we landed in based on RADIUS (distance from center)
    let targetPosition = 0;
    
    // Define concentric zones:
    // Center (0-30): Red center zone (major overshoot)
    // Inner ring (30-60): Green zone (perfect!)  
    // Middle ring (60-90): Red middle zone (moderate overshoot)
    // Outer ring (90-140): Black/safe zone (undershoot)
    
    if (radius >= 30 && radius <= 60) {
      // GREEN ZONE - Perfect! Land on last few meks
      targetPosition = totalMeks - 1 - Math.floor(Math.random() * 2);
      setFeedback('perfect');
    } else if (radius < 30) {
      // RED CENTER - Major overshoot, wrap to beginning
      targetPosition = Math.floor(Math.random() * 3); // First 3 meks
      setFeedback('overshoot');
    } else if (radius > 60 && radius <= 90) {
      // RED MIDDLE - Moderate overshoot, middle of pack
      targetPosition = Math.floor(totalMeks * 0.3 + Math.random() * totalMeks * 0.2);
      setFeedback('overshoot');
    } else {
      // BLACK OUTER - Didn't make it far enough
      targetPosition = Math.floor(Math.random() * totalMeks * 0.25);
      setFeedback('undershoot');
    }
    
    // Animate to target
    targetIndexRef.current = targetPosition;
    currentIndexRef.current = selectedIndex;
    animateMekSelection();
    
    // Clear feedback after 3 seconds
    setTimeout(() => setFeedback(null), 3000);
  };

  // Animate mek selection
  const animateMekSelection = () => {
    const distance = targetIndexRef.current - currentIndexRef.current;
    
    if (Math.abs(distance) > 0.1) {
      // Move towards target
      currentIndexRef.current += distance * 0.1;
      
      // Update visible selection
      let displayIndex = Math.round(currentIndexRef.current);
      if (displayIndex < 0) displayIndex = 0;
      if (displayIndex >= totalMeks) displayIndex = totalMeks - 1;
      setSelectedIndex(displayIndex);
      
      selectorAnimRef.current = requestAnimationFrame(animateMekSelection);
    } else {
      // Snap to final
      setSelectedIndex(targetIndexRef.current);
      setIsAnimating(false);
    }
  };

  // Handle click
  const handleRadarClick = () => {
    if (isRotating) {
      stopRotation();
      setIsAnimating(true);
    } else {
      startRotation();
    }
  };

  // Reset function
  const handleReset = () => {
    setSelectedIndex(0);
    setAngle(0);
    setRadius(140);
    setIsRotating(false);
    setRotationSpeed(1);
    setIsAnimating(false);
    setIsMovingInward(true);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (selectorAnimRef.current) {
      cancelAnimationFrame(selectorAnimRef.current);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (selectorAnimRef.current) {
        cancelAnimationFrame(selectorAnimRef.current);
      }
    };
  }, []);

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
      className="min-h-screen text-white relative overflow-hidden select-none"
      style={{ 
        background: 'radial-gradient(ellipse at center, #1a1f35 0%, #0d0f1c 50%, #000000 100%)'
      }}
    >
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-pulse"
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
              opacity: 0.3
            }}
          />
        ))}
      </div>
      
      {/* Star field */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {stars.map(s => (
          <div
            key={s.id}
            className={`absolute rounded-full bg-white ${s.twinkle ? 'animate-pulse' : ''}`}
            style={{
              left: s.left,
              top: s.top,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              animationDuration: s.twinkle ? `${Math.random() * 3 + 2}s` : undefined
            }}
          />
        ))}
      </div>
      
      <div className="max-w-7xl mx-auto pt-32">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Radar Selector</h1>
          <p className="text-gray-400">Click to start the radar, click again when the dot is in the green zone!</p>
          
          {/* Current Selection Info */}
          <div className="mt-4">
            <p className="text-xl text-yellow-400">
              Mek #{selectedIndex + 1} of {totalMeks} | Rank: {currentMek?.rarityRank || 'N/A'}
            </p>
            {isRotating && (
              <div>
                <p className="text-green-400">
                  Speed: {((140 - radius) / 140 * 5 + 1).toFixed(1)}x
                </p>
                <p className="text-yellow-400">
                  Distance: {radius.toFixed(0)}
                </p>
              </div>
            )}
          </div>
          
          {/* Result Feedback */}
          {feedback && (
            <div className={`mt-4 p-3 rounded-lg text-center font-bold animate-pulse inline-block ${
              feedback === 'perfect' ? 'bg-green-600/30 text-green-400 border-2 border-green-400' :
              feedback === 'undershoot' ? 'bg-yellow-600/30 text-yellow-400 border-2 border-yellow-400' :
              'bg-red-600/30 text-red-400 border-2 border-red-400'
            }`}>
              {feedback === 'perfect' ? '🎯 PERFECT! You hit the green zone!' :
               feedback === 'undershoot' ? '📉 Too weak! Landed in safe zone!' :
               '💥 OVERSHOOT! Hit the red zone!'}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Reset
          </button>
          
          {/* Grid Size Selector */}
          <div className="flex gap-2">
            <span className="text-gray-400 py-2">Grid Size:</span>
            {[10, 30, 50].map(size => (
              <button
                key={size}
                onClick={() => {
                  setGridSize(size);
                  handleReset();
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
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

        {/* Radar Display */}
        <div className="flex justify-center mb-8">
          <div 
            ref={radarRef}
            className="relative w-80 h-80 cursor-pointer"
            onClick={handleRadarClick}
          >
            {/* Outer circle */}
            <div className="absolute inset-0 rounded-full border-4 border-red-600 bg-gray-900/50">
              {/* Concentric zone rings */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320">
                {/* Black outer zone (radius 90-150) */}
                <circle
                  cx="160"
                  cy="160"
                  r="140"
                  fill="rgba(30, 30, 30, 0.8)"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1"
                />
                
                {/* Red middle zone (radius 60-90) */}
                <circle
                  cx="160"
                  cy="160"
                  r="90"
                  fill="rgba(239, 68, 68, 0.3)"
                  stroke="rgba(239, 68, 68, 0.8)"
                  strokeWidth="2"
                />
                
                {/* Green zone (radius 30-60) */}
                <circle
                  cx="160"
                  cy="160"
                  r="60"
                  fill="rgba(34, 197, 94, 0.4)"
                  stroke="rgba(34, 197, 94, 1)"
                  strokeWidth="2"
                />
                
                {/* Red center zone (radius 0-30) */}
                <circle
                  cx="160"
                  cy="160"
                  r="30"
                  fill="rgba(239, 68, 68, 0.5)"
                  stroke="rgba(239, 68, 68, 1)"
                  strokeWidth="2"
                />
              </svg>
              
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full shadow-lg shadow-red-600/50" />
              
              {/* Rotating dot - positioned based on angle and radius */}
              <div 
                className="absolute top-1/2 left-1/2 pointer-events-none"
                style={{
                  transform: `translate(-50%, -50%)`,
                }}
              >
                <div 
                  className="absolute w-4 h-4 bg-green-400 rounded-full shadow-lg shadow-green-400/50 animate-pulse"
                  style={{
                    transform: `translate(
                      ${Math.cos((angle - 90) * Math.PI / 180) * radius}px,
                      ${Math.sin((angle - 90) * Math.PI / 180) * radius}px
                    ) translate(-50%, -50%)`,
                  }}
                />
              </div>
              
              {/* Click instruction */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {!isRotating && !isAnimating && (
                  <span className="text-yellow-400 font-bold text-lg animate-pulse">
                    CLICK TO START
                  </span>
                )}
                {isRotating && (
                  <span className="text-green-400 font-bold text-lg">
                    CLICK TO STOP!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mek Grid */}
        <div className="max-w-6xl mx-auto">
          <div 
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${Math.min(10, Math.ceil(Math.sqrt(gridSize)))}, minmax(0, 1fr))` }}
          >
            {sortedMeks.map((mek, index) => {
              const isSelected = index === selectedIndex;
              const mekImage = MEK_IMAGES[index % MEK_IMAGES.length];
              
              return (
                <div
                  key={mek._id}
                  className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                    isSelected 
                      ? 'ring-4 ring-yellow-400 scale-110 z-10 duration-100' 
                      : 'ring-1 ring-gray-700 opacity-50 duration-300'
                  }`}
                >
                  <Image
                    src={`/mek-images/150px/${mekImage}.webp`}
                    alt={mek.assetName || `Mek #${mek.assetId}`}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                    onError={(e) => {
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
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                    <p className="text-xs text-center">Rank {mek.rarityRank || index + 1}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}