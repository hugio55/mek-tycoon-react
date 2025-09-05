"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContractsPage() {
  const router = useRouter();
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const [particles, setParticles] = useState<Array<{id: number, left: string, top: string, delay: string, duration: string}>>([]);
  const [stars, setStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number, twinkle: boolean}>>([]);

  useEffect(() => {
    // Generate background effects
    const generatedParticles = [...Array(20)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${5 + Math.random() * 5}s`,
    }));
    setParticles(generatedParticles);
    
    const generatedStars = [...Array(60)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() > 0.5,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Gradient orbs */}
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
        
        {/* Pattern overlay */}
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
        
        {/* Stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: star.twinkle ? `starTwinkle ${2 + Math.random() * 2}s ease-in-out infinite` : 'none',
              animationDelay: star.twinkle ? `${Math.random() * 2}s` : '0s',
            }}
          />
        ))}
        
        {/* Floating particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
            style={{
              left: particle.left,
              top: particle.top,
              animation: `floatParticle ${particle.duration} ease-in-out infinite`,
              animationDelay: particle.delay,
              boxShadow: '0 0 6px rgba(250, 182, 23, 0.6)',
            }}
          />
        ))}
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="max-w-6xl mx-auto w-full">
          
          {/* Title */}
          <div className="text-center mb-16">
            <h1 
              style={{
                fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
                fontSize: '56px',
                fontWeight: '900',
                letterSpacing: '2px',
                textShadow: '0 0 30px rgba(250, 182, 23, 0.6)',
                background: 'linear-gradient(135deg, #fab617 0%, #ffdd00 50%, #fab617 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '16px'
              }}
            >
              CONTRACTS SYSTEM
            </h1>
            <p className="text-gray-400 text-lg">Choose your mission type</p>
          </div>

          {/* Mode Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
            
            {/* Story Mode Card */}
            <div
              className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
              onMouseEnter={() => setHoveredMode('story')}
              onMouseLeave={() => setHoveredMode(null)}
              onClick={() => router.push('/contracts/chapters')}
            >
              <div 
                className="relative rounded-xl overflow-hidden"
                style={{
                  background: hoveredMode === 'story' 
                    ? 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)'
                    : 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
                  border: '2px solid',
                  borderColor: hoveredMode === 'story' ? '#fab617' : '#666',
                  boxShadow: hoveredMode === 'story' 
                    ? '0 0 40px rgba(250, 182, 23, 0.6)' 
                    : '0 0 20px rgba(250, 182, 23, 0.2)',
                  padding: '32px',
                  height: '400px',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Animated border glow */}
                {hoveredMode === 'story' && (
                  <div 
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                      background: 'linear-gradient(105deg, transparent 40%, rgba(250, 182, 23, 0.3) 50%, transparent 60%)',
                      animation: 'shimmer 2s infinite',
                    }}
                  />
                )}
                
                <div className="relative z-10 h-full flex flex-col">
                  {/* Icon */}
                  <div className="text-6xl mb-6 text-center">📚</div>
                  
                  {/* Title */}
                  <h2 
                    className="text-3xl font-bold mb-4 text-center"
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      color: hoveredMode === 'story' ? '#fab617' : '#fff',
                      textShadow: hoveredMode === 'story' ? '0 0 20px rgba(250, 182, 23, 0.6)' : 'none',
                    }}
                  >
                    STORY MODE
                  </h2>
                  
                  {/* Description */}
                  <p className="text-gray-400 text-center mb-6 flex-grow">
                    Embark on an epic journey through 10 chapters of choose-your-own-adventure gameplay. 
                    Battle through 400 nodes per chapter and shape your destiny.
                  </p>
                  
                  {/* Features */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-400 mr-2">▸</span>
                      <span className="text-gray-300">10 Epic Chapters</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-400 mr-2">▸</span>
                      <span className="text-gray-300">4,000 Total Nodes</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-400 mr-2">▸</span>
                      <span className="text-gray-300">Progressive Unlocking</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Single Mission Mode Card */}
            <div
              className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
              onMouseEnter={() => setHoveredMode('single')}
              onMouseLeave={() => setHoveredMode(null)}
              onClick={() => router.push('/contracts/layout-option-11')}
            >
              <div 
                className="relative rounded-xl overflow-hidden"
                style={{
                  background: hoveredMode === 'single' 
                    ? 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)'
                    : 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
                  border: '2px solid',
                  borderColor: hoveredMode === 'single' ? '#fab617' : '#666',
                  boxShadow: hoveredMode === 'single' 
                    ? '0 0 40px rgba(250, 182, 23, 0.6)' 
                    : '0 0 20px rgba(250, 182, 23, 0.2)',
                  padding: '32px',
                  height: '400px',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Animated border glow */}
                {hoveredMode === 'single' && (
                  <div 
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                      background: 'linear-gradient(105deg, transparent 40%, rgba(250, 182, 23, 0.3) 50%, transparent 60%)',
                      animation: 'shimmer 2s infinite',
                    }}
                  />
                )}
                
                <div className="relative z-10 h-full flex flex-col">
                  {/* Icon */}
                  <div className="text-6xl mb-6 text-center">⚔️</div>
                  
                  {/* Title */}
                  <h2 
                    className="text-3xl font-bold mb-4 text-center"
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      color: hoveredMode === 'single' ? '#fab617' : '#fff',
                      textShadow: hoveredMode === 'single' ? '0 0 20px rgba(250, 182, 23, 0.6)' : 'none',
                    }}
                  >
                    SINGLE MISSIONS
                  </h2>
                  
                  {/* Description */}
                  <p className="text-gray-400 text-center mb-6 flex-grow">
                    Jump straight into action with standalone contracts. 
                    Choose your difficulty, complete objectives, and earn rewards instantly.
                  </p>
                  
                  {/* Features */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-400 mr-2">▸</span>
                      <span className="text-gray-300">Quick Battles</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-400 mr-2">▸</span>
                      <span className="text-gray-300">Instant Rewards</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-400 mr-2">▸</span>
                      <span className="text-gray-300">No Prerequisites</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-yellow-400 rounded-lg transition-all text-gray-400 hover:text-white"
            >
              Back to Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}