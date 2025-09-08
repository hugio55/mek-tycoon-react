"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import theme from "@/lib/design-system";

export default function ContractsPage() {
  const router = useRouter();
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  return (
    <div className="min-h-screen text-white overflow-hidden relative">
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col pt-20 px-8">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
          
          {/* Title with Industrial Typography */}
          <div className="text-center mb-8">
            <h1 
              className="mek-text-industrial mek-text-shadow"
              style={{
                fontSize: '56px',
                fontWeight: '900',
                letterSpacing: '4px',
                background: 'linear-gradient(135deg, #fab617 0%, #ffdd00 50%, #fab617 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              CONTRACTS
            </h1>
          </div>

          {/* Mode Selection Cards with Industrial Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 mt-4 mb-16">
            
            {/* Single Contracts Card (Left) */}
            <div
              className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
              onMouseEnter={() => setHoveredMode('single')}
              onMouseLeave={() => setHoveredMode(null)}
              onClick={() => router.push('/contracts/single-missions')}
            >
              <div 
                className={`mek-card-industrial mek-border-sharp-gold relative overflow-hidden ${hoveredMode === 'single' ? 'mek-glow-yellow' : ''}`}
                style={{
                  padding: '32px',
                  height: '400px',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Industrial overlay patterns */}
                <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />
                <div className="absolute inset-0 opacity-10" style={{ background: theme.patterns.diagonalStripes }} />
                
                {/* Animated scan line effect on hover */}
                {hoveredMode === 'single' && (
                  <>
                    <div className="mek-scan-effect" />
                    <div 
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{
                        background: 'linear-gradient(105deg, transparent 40%, rgba(250, 182, 23, 0.4) 50%, transparent 60%)',
                        animation: 'shimmer 2s infinite',
                      }}
                    />
                  </>
                )}
                
                <div className="relative z-10 h-full flex flex-col">
                  {/* Icon with glow */}
                  <div className="text-6xl mb-6 text-center" style={{ filter: hoveredMode === 'single' ? 'drop-shadow(0 0 20px rgba(250, 182, 23, 0.6))' : 'none' }}>⚔️</div>
                  
                  {/* Title */}
                  <h2 
                    className={`text-3xl font-bold mb-4 text-center mek-text-industrial ${hoveredMode === 'single' ? 'text-yellow-400' : 'text-white'}`}
                    style={{
                      textShadow: hoveredMode === 'single' ? '0 0 20px rgba(250, 182, 23, 0.6)' : 'none',
                    }}
                  >
                    SINGLE CONTRACTS
                  </h2>
                  
                  {/* Description with industrial styling */}
                  <p className="text-gray-400 text-center mb-6 flex-grow font-medium">
                    Jump straight into action with standalone contracts. 
                    Choose your difficulty, complete objectives, and earn rewards instantly.
                  </p>
                  
                  {/* Features with hazard stripes */}
                  <div className="space-y-2 p-3 rounded" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-400 mr-2 font-bold">▸</span>
                      <span className="text-gray-300 uppercase tracking-wider text-xs">Quick Contracts</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-400 mr-2 font-bold">▸</span>
                      <span className="text-gray-300 uppercase tracking-wider text-xs">Instant Rewards</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-400 mr-2 font-bold">▸</span>
                      <span className="text-gray-300 uppercase tracking-wider text-xs">No Prerequisites</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Story Mode Card (Right) */}
            <div
              className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
              onMouseEnter={() => setHoveredMode('story')}
              onMouseLeave={() => setHoveredMode(null)}
              onClick={() => router.push('/contracts/chapters')}
            >
              <div 
                className={`mek-card-industrial mek-border-sharp-gold relative overflow-hidden ${hoveredMode === 'story' ? 'mek-glow-yellow' : ''}`}
                style={{
                  padding: '32px',
                  height: '400px',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Industrial overlay patterns */}
                <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />
                <div className="absolute inset-0 opacity-10" style={{ background: theme.patterns.diagonalStripes }} />
                
                {/* Animated scan line effect on hover */}
                {hoveredMode === 'story' && (
                  <>
                    <div className="mek-scan-effect" />
                    <div 
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{
                        background: 'linear-gradient(105deg, transparent 40%, rgba(250, 182, 23, 0.4) 50%, transparent 60%)',
                        animation: 'shimmer 2s infinite',
                      }}
                    />
                  </>
                )}
                
                <div className="relative z-10 h-full flex flex-col">
                  {/* Icon with glow */}
                  <div className="text-6xl mb-6 text-center" style={{ filter: hoveredMode === 'story' ? 'drop-shadow(0 0 20px rgba(250, 182, 23, 0.6))' : 'none' }}>📚</div>
                  
                  {/* Title */}
                  <h2 
                    className={`text-3xl font-bold mb-4 text-center mek-text-industrial ${hoveredMode === 'story' ? 'text-yellow-400' : 'text-white'}`}
                    style={{
                      textShadow: hoveredMode === 'story' ? '0 0 20px rgba(250, 182, 23, 0.6)' : 'none',
                    }}
                  >
                    STORY MODE
                  </h2>
                  
                  {/* Description with industrial styling */}
                  <p className="text-gray-400 text-center mb-6 flex-grow font-medium">
                    Embark on an epic journey through multiple chapters of choose-your-own-adventure gameplay. 
                    Shape your destiny through strategic choices.
                  </p>
                  
                  {/* Features with hazard stripes */}
                  <div className="space-y-2 p-3 rounded" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-400 mr-2 font-bold">▸</span>
                      <span className="text-gray-300 uppercase tracking-wider text-xs">Epic Chapters</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-400 mr-2 font-bold">▸</span>
                      <span className="text-gray-300 uppercase tracking-wider text-xs">Strategic Choices</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-400 mr-2 font-bold">▸</span>
                      <span className="text-gray-300 uppercase tracking-wider text-xs">Progressive Unlocking</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}