"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Image from "next/image";

interface MekBubble {
  id: number;
  number: number;
  name: string;
  image: string;
  largeImage: string;
  rarity: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  targetSize: number;
}

export default function MekSelectorGridPage() {
  const [selectedMek, setSelectedMek] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const [mekBubbles, setMekBubbles] = useState<MekBubble[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();
  const [hoveredMek, setHoveredMek] = useState<number | null>(null);

  // Generate array of real mek numbers that exist in 150px folder
  const realMekNumbers = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480, 520, 560, 600,
    640, 680, 720, 760, 800, 840, 880, 920, 960, 1000, 1040, 1080, 1120, 1160,
    1200, 1240, 1280, 1320, 1360, 1400, 1440, 1480, 1520, 1560, 1600, 1640,
    1680, 1720, 1760, 1800, 1840, 1880, 1920, 1960, 2000, 2040, 2080, 2120,
    2160, 2200, 2240, 2280, 2320, 2360, 2400, 2440, 2480, 2520, 2560, 2600,
    2640, 2680, 2720, 2760, 2800, 2840, 2880, 2920, 2960, 3000, 3040, 3080,
    3120, 3160, 3200, 3240, 3280, 3320, 3360, 3400, 3440, 3480, 3520, 3560,
    3600, 3640, 3680, 3720, 3760, 3800, 3840, 3880, 3920, 3960, 4000
  ];

  // Initialize mek bubbles
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const bubbles: MekBubble[] = realMekNumbers.slice(0, 80).map((mekNumber, i) => {
      const size = 80 + Math.random() * 40; // 80-120px size
      return {
        id: i,
        number: mekNumber,
        name: `Mek #${mekNumber}`,
        image: `/meks/150px/${mekNumber}.png`,
        largeImage: `/meks/500px/${mekNumber}.png`,
        rarity: Math.floor(Math.random() * 1000) + 1,
        x: Math.random() * (window.innerWidth - size),
        y: Math.random() * (window.innerHeight - size),
        vx: (Math.random() - 0.5) * 0.5, // Slower movement
        vy: (Math.random() - 0.5) * 0.5,
        size: size,
        targetSize: size,
      };
    });
    setMekBubbles(bubbles);
  }, []);

  // Check collision between two bubbles
  const checkCollision = (bubble1: MekBubble, bubble2: MekBubble) => {
    const dx = bubble1.x + bubble1.size/2 - (bubble2.x + bubble2.size/2);
    const dy = bubble1.y + bubble1.size/2 - (bubble2.y + bubble2.size/2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = (bubble1.size + bubble2.size) / 2 * 0.85; // Allow 15% overlap
    return distance < minDistance;
  };

  // Resolve collision between two bubbles
  const resolveCollision = (bubble1: MekBubble, bubble2: MekBubble) => {
    const dx = bubble1.x + bubble1.size/2 - (bubble2.x + bubble2.size/2);
    const dy = bubble1.y + bubble1.size/2 - (bubble2.y + bubble2.size/2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) {
      // Prevent division by zero
      bubble1.vx = Math.random() - 0.5;
      bubble1.vy = Math.random() - 0.5;
      return;
    }
    
    // Normalize collision vector
    const nx = dx / distance;
    const ny = dy / distance;
    
    // Relative velocity
    const dvx = bubble1.vx - bubble2.vx;
    const dvy = bubble1.vy - bubble2.vy;
    
    // Relative velocity in collision normal direction
    const dvn = dvx * nx + dvy * ny;
    
    // Do not resolve if velocities are separating
    if (dvn > 0) return;
    
    // Apply impulse
    const impulse = 0.5 * dvn;
    bubble1.vx -= impulse * nx;
    bubble1.vy -= impulse * ny;
    bubble2.vx += impulse * nx;
    bubble2.vy += impulse * ny;
    
    // Separate bubbles
    const minDistance = (bubble1.size + bubble2.size) / 2 * 0.85;
    const overlap = minDistance - distance;
    const separationX = nx * overlap * 0.5;
    const separationY = ny * overlap * 0.5;
    bubble1.x += separationX;
    bubble1.y += separationY;
    bubble2.x -= separationX;
    bubble2.y -= separationY;
  };

  // Animation loop for bubble movement
  const animate = useCallback(() => {
    setMekBubbles(prevBubbles => {
      const newBubbles = [...prevBubbles];
      
      // Update positions
      newBubbles.forEach((bubble, i) => {
        // Apply velocity
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
        
        // Bounce off walls
        if (bubble.x <= 0 || bubble.x + bubble.size >= window.innerWidth) {
          bubble.vx *= -0.9; // Dampen on bounce
          bubble.x = Math.max(0, Math.min(window.innerWidth - bubble.size, bubble.x));
        }
        if (bubble.y <= 0 || bubble.y + bubble.size >= window.innerHeight) {
          bubble.vy *= -0.9;
          bubble.y = Math.max(0, Math.min(window.innerHeight - bubble.size, bubble.y));
        }
        
        // Add slight random movement
        bubble.vx += (Math.random() - 0.5) * 0.02;
        bubble.vy += (Math.random() - 0.5) * 0.02;
        
        // Limit velocity
        const maxSpeed = 1;
        const speed = Math.sqrt(bubble.vx * bubble.vx + bubble.vy * bubble.vy);
        if (speed > maxSpeed) {
          bubble.vx = (bubble.vx / speed) * maxSpeed;
          bubble.vy = (bubble.vy / speed) * maxSpeed;
        }
        
        // Update size (smooth transition)
        if (bubble.size !== bubble.targetSize) {
          bubble.size += (bubble.targetSize - bubble.size) * 0.1;
        }
      });
      
      // Check collisions
      for (let i = 0; i < newBubbles.length; i++) {
        for (let j = i + 1; j < newBubbles.length; j++) {
          if (checkCollision(newBubbles[i], newBubbles[j])) {
            resolveCollision(newBubbles[i], newBubbles[j]);
          }
        }
      }
      
      return newBubbles;
    });
    
    frameRef.current = requestAnimationFrame(animate);
  }, []);

  // Start animation loop
  useEffect(() => {
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [animate]);

  const startSelection = () => {
    if (animating) return;
    
    setAnimating(true);
    setShowCongrats(false);
    let currentIndex = 0;
    let speed = 50; // Start fast
    const totalDuration = 12000; // 12 seconds total
    const startTime = Date.now();
    
    const animateSelection = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < totalDuration) {
        // Gradually slow down
        speed = 50 + (elapsed / totalDuration) * 450; // From 50ms to 500ms
        
        currentIndex = (currentIndex + 1) % mekBubbles.length;
        setHighlightedIndex(currentIndex);
        
        // Make highlighted bubble grow
        setMekBubbles(prev => prev.map((bubble, i) => ({
          ...bubble,
          targetSize: i === currentIndex ? bubble.size * 1.3 : 80 + Math.random() * 40
        })));
        
        animationRef.current = setTimeout(animateSelection, speed);
      } else {
        // Animation complete - select final mek
        const finalIndex = Math.floor(Math.random() * mekBubbles.length);
        setHighlightedIndex(finalIndex);
        setSelectedMek(finalIndex);
        setAnimating(false);
        
        // Show modal after brief delay
        setTimeout(() => {
          setShowModal(true);
          setShowCongrats(true);
        }, 500);
      }
    };
    
    animateSelection();
  };

  const closeModal = () => {
    setShowModal(false);
    setShowCongrats(false);
    setHighlightedIndex(null);
    setSelectedMek(null);
    // Reset bubble sizes
    setMekBubbles(prev => prev.map(bubble => ({
      ...bubble,
      targetSize: 80 + Math.random() * 40
    })));
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  const handleMekClick = (index: number) => {
    if (!animating) {
      setSelectedMek(index);
      setShowModal(true);
      setShowCongrats(true);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Starfield Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0f 100%),
            linear-gradient(180deg, #0a0a0f 0%, #16213e 100%)
          `,
        }}
      >
        {/* Static stars */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="stars" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="1" fill="white" opacity="0.8" />
              <circle cx="50" cy="25" r="0.5" fill="white" opacity="0.6" />
              <circle cx="75" cy="60" r="1" fill="white" opacity="0.7" />
              <circle cx="125" cy="15" r="0.8" fill="white" opacity="0.9" />
              <circle cx="150" cy="80" r="0.6" fill="white" opacity="0.5" />
              <circle cx="25" cy="125" r="1.2" fill="white" opacity="0.8" />
              <circle cx="180" cy="150" r="0.7" fill="white" opacity="0.6" />
              <circle cx="95" cy="175" r="0.9" fill="white" opacity="0.7" />
              <circle cx="35" cy="190" r="0.5" fill="white" opacity="0.8" />
              <circle cx="165" cy="45" r="0.8" fill="white" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#stars)" />
        </svg>

        {/* Animated twinkling stars */}
        <div className="absolute inset-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                opacity: 0.3 + Math.random() * 0.6,
              }}
            />
          ))}
        </div>

        {/* Yellow accent stars */}
        <div className="absolute inset-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`yellow-${i}`}
              className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                opacity: 0.3 + Math.random() * 0.4,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-8">
        <h1 className="text-5xl font-bold text-yellow-400 text-center mb-8 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
          MEK SELECTOR
        </h1>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={startSelection}
            disabled={animating}
            className={`px-12 py-4 text-2xl font-bold rounded-lg transition-all transform ${
              animating
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed scale-95'
                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500 hover:scale-105 shadow-lg hover:shadow-green-500/50'
            }`}
          >
            {animating ? 'SELECTING...' : 'RANDOM SELECT!'}
          </button>
          <button
            onClick={() => {
              // Add more bubbles
              const newBubbles = realMekNumbers.slice(mekBubbles.length, mekBubbles.length + 10).map((mekNumber, i) => {
                const size = 80 + Math.random() * 40;
                return {
                  id: mekBubbles.length + i,
                  number: mekNumber,
                  name: `Mek #${mekNumber}`,
                  image: `/meks/150px/${mekNumber}.png`,
                  largeImage: `/meks/500px/${mekNumber}.png`,
                  rarity: Math.floor(Math.random() * 1000) + 1,
                  x: Math.random() * (window.innerWidth - size),
                  y: Math.random() * (window.innerHeight - size),
                  vx: (Math.random() - 0.5) * 0.5,
                  vy: (Math.random() - 0.5) * 0.5,
                  size: size,
                  targetSize: size,
                };
              });
              setMekBubbles(prev => [...prev, ...newBubbles]);
            }}
            disabled={mekBubbles.length >= realMekNumbers.length}
            className="px-8 py-4 text-xl font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Add More Meks ({mekBubbles.length}/{realMekNumbers.length})
          </button>
        </div>

        {/* Mek Bubbles Container */}
        <div ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 5 }}>
          {mekBubbles.map((mek, index) => (
            <div
              key={mek.id}
              className={`absolute rounded-full overflow-hidden transition-all cursor-pointer pointer-events-auto ${
                highlightedIndex === index
                  ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/50'
                  : hoveredMek === index
                  ? 'ring-2 ring-yellow-400/50'
                  : ''
              }`}
              style={{
                left: `${mek.x}px`,
                top: `${mek.y}px`,
                width: `${mek.size}px`,
                height: `${mek.size}px`,
                transform: highlightedIndex === index ? 'scale(1.1)' : 'scale(1)',
                transition: 'width 0.3s, height 0.3s, transform 0.3s',
                zIndex: highlightedIndex === index ? 1000 : hoveredMek === index ? 100 : 10,
              }}
              onMouseEnter={() => setHoveredMek(index)}
              onMouseLeave={() => setHoveredMek(null)}
              onClick={() => handleMekClick(index)}
            >
              <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800/90 to-gray-900/90" />
                <img
                  src={mek.image}
                  alt={mek.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/meks/placeholder.png';
                  }}
                />
                {(highlightedIndex === index || hoveredMek === index) && (
                  <div className="absolute inset-0 bg-yellow-400/20 animate-pulse" />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                  <p className="text-xs text-white text-center font-bold drop-shadow-lg">
                    #{mek.number}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selection Modal */}
      {showModal && selectedMek !== null && mekBubbles[selectedMek] && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border-4 border-yellow-400 shadow-2xl shadow-yellow-400/30 max-w-2xl">
            {showCongrats && (
              <div className="text-center mb-6">
                <h2 className="text-4xl font-bold text-yellow-400 mb-2 animate-pulse">
                  CONGRATULATIONS!
                </h2>
                <p className="text-xl text-white">
                  You've selected {mekBubbles[selectedMek].name}!
                </p>
              </div>
            )}
            
            <div className="flex gap-8">
              <div className="flex-shrink-0">
                <img
                  src={mekBubbles[selectedMek].largeImage}
                  alt={mekBubbles[selectedMek].name}
                  className="w-[400px] h-[400px] object-cover rounded-lg border-2 border-yellow-400/50"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = mekBubbles[selectedMek].image;
                  }}
                />
              </div>
              
              <div className="flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-yellow-400 mb-4">
                  {mekBubbles[selectedMek].name}
                </h3>
                <div className="space-y-2 text-white">
                  <p><span className="text-gray-400">ID:</span> #{mekBubbles[selectedMek].number}</p>
                  <p><span className="text-gray-400">Rarity:</span> {mekBubbles[selectedMek].rarity}/1000</p>
                  <p><span className="text-gray-400">Status:</span> Ready for Assignment</p>
                </div>
                
                <div className="mt-6 space-y-3">
                  <button
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:from-green-400 hover:to-green-500 transition-all"
                  >
                    Assign to Employee Slot
                  </button>
                  <button
                    onClick={closeModal}
                    className="w-full px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-all"
                  >
                    Select Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}