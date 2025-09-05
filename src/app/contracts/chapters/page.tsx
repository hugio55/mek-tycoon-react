"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  nodeCount: number;
  unlocked: boolean;
  completed: boolean;
  progress: number; // 0-100
  image: string;
  rewards: {
    gold: number;
    essence: number;
    powerChips: number;
  };
}

export default function ChaptersPage() {
  const router = useRouter();
  const [hoveredChapter, setHoveredChapter] = useState<number | null>(null);
  const [layoutOption, setLayoutOption] = useState<number>(3); // Start with Circuit Board
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [particles, setParticles] = useState<Array<{id: number, left: string, top: string, delay: string, duration: string}>>([]);
  const [stars, setStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number, twinkle: boolean}>>([]);

  // Random mek images for chapters
  const mekImages = [
    "111-111-111.webp",
    "222-222-222.webp", 
    "333-333-333.webp",
    "444-444-444.webp",
    "555-555-555.webp",
    "666-666-666.webp",
    "777-777-777.webp",
    "888-888-888.webp",
    "999-999-999.webp",
    "aa1-aa1-cd1.webp"
  ];

  const chapters: Chapter[] = [
    {
      id: 1,
      title: "The Awakening",
      subtitle: "Chapter I",
      description: "Your journey begins as a Mek collector in the outer colonies",
      nodeCount: 400,
      unlocked: true,
      completed: false,
      progress: 65,
      image: mekImages[0],
      rewards: { gold: 50000, essence: 25, powerChips: 2 }
    },
    {
      id: 2,
      title: "First Contact",
      subtitle: "Chapter II",
      description: "Mysterious signals lead you to an abandoned research station",
      nodeCount: 400,
      unlocked: false,
      completed: false,
      progress: 0,
      image: mekImages[1],
      rewards: { gold: 75000, essence: 35, powerChips: 3 }
    },
    {
      id: 3,
      title: "The Schism",
      subtitle: "Chapter III",
      description: "Choose your allegiance in the great faction war",
      nodeCount: 400,
      unlocked: false,
      completed: false,
      progress: 0,
      image: mekImages[2],
      rewards: { gold: 100000, essence: 50, powerChips: 4 }
    },
    {
      id: 4,
      title: "Into the Void",
      subtitle: "Chapter IV",
      description: "Venture into uncharted space seeking ancient technology",
      nodeCount: 400,
      unlocked: false,
      completed: false,
      progress: 0,
      image: mekImages[3],
      rewards: { gold: 150000, essence: 75, powerChips: 5 }
    },
    {
      id: 5,
      title: "Betrayal",
      subtitle: "Chapter V",
      description: "Uncover a conspiracy that threatens everything you know",
      nodeCount: 400,
      unlocked: false,
      completed: false,
      progress: 0,
      image: mekImages[4],
      rewards: { gold: 200000, essence: 100, powerChips: 6 }
    },
    {
      id: 6,
      title: "The Resistance",
      subtitle: "Chapter VI",
      description: "Lead the uprising against the corrupt Mek overlords",
      nodeCount: 400,
      unlocked: false,
      completed: false,
      progress: 0,
      image: mekImages[5],
      rewards: { gold: 300000, essence: 150, powerChips: 8 }
    },
    {
      id: 7,
      title: "Nexus Point",
      subtitle: "Chapter VII",
      description: "Discover the true origin of Mek technology",
      nodeCount: 400,
      unlocked: false,
      completed: false,
      progress: 0,
      image: mekImages[6],
      rewards: { gold: 500000, essence: 200, powerChips: 10 }
    },
    {
      id: 8,
      title: "Convergence",
      subtitle: "Chapter VIII",
      description: "Unite the fractured colonies against a common threat",
      nodeCount: 400,
      unlocked: false,
      completed: false,
      progress: 0,
      image: mekImages[7],
      rewards: { gold: 750000, essence: 300, powerChips: 12 }
    },
    {
      id: 9,
      title: "The Final Stand",
      subtitle: "Chapter IX",
      description: "Face the ultimate enemy in an epic showdown",
      nodeCount: 400,
      unlocked: false,
      completed: false,
      progress: 0,
      image: mekImages[8],
      rewards: { gold: 1000000, essence: 500, powerChips: 15 }
    },
    {
      id: 10,
      title: "Ascension",
      subtitle: "Chapter X - Finale",
      description: "Defeat Wren and unlock the secrets of Mek evolution",
      nodeCount: 400,
      unlocked: false,
      completed: false,
      progress: 0,
      image: mekImages[9],
      rewards: { gold: 2000000, essence: 1000, powerChips: 20 }
    }
  ];

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

  const handleChapterClick = (chapter: Chapter) => {
    if (chapter.unlocked) {
      router.push(`/contracts/chapters/${chapter.id}/nodes`);
    }
  };

  const navigateCarousel = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
    } else if (direction === 'next' && currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(250, 182, 23, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(250, 182, 23, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(250, 182, 23, 0.08) 0%, transparent 70%)
            `,
          }}
        />
        
        {/* Grid pattern overlay */}
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
      
      {/* Main content */}
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 
              style={{
                fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
                fontSize: '48px',
                fontWeight: 900,
                letterSpacing: '2px',
                textShadow: '0 0 30px rgba(250, 182, 23, 0.6)',
                background: 'linear-gradient(135deg, #fab617 0%, #ffdd00 50%, #fab617 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px'
              }}
            >
              STORY MODE CHAPTERS
            </h1>
            <p className="text-gray-400">Choose your chapter • 400 nodes each • Progressive unlocking</p>
          </div>
          
          {/* Controls */}
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => router.push('/contracts')}
              className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-yellow-400 rounded-lg transition-all text-gray-400 hover:text-white"
            >
              ← Back to Mode Selection
            </button>
            
            <select
              value={layoutOption}
              onChange={(e) => setLayoutOption(Number(e.target.value))}
              className="px-4 py-2 bg-black/60 border border-yellow-500/40 rounded-lg text-yellow-400 focus:border-yellow-500 focus:outline-none"
            >
              <option value={3}>Zigzag Timeline</option>
              <option value={11}>Card Carousel</option>
            </select>
          </div>
          
          {/* Layout Option 3: Original Zigzag Timeline */}
          {layoutOption === 3 && (
            <div className="relative flex justify-center" style={{ minHeight: '1200px' }}>
              {/* Vertical Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-500/20 via-yellow-500/60 to-yellow-500/20" style={{ zIndex: 1 }}></div>
              
              {/* Hexagons along timeline */}
              <div className="relative" style={{ width: '600px' }}>
                {chapters.map((chapter, index) => {
                  const isLeft = index % 2 === 0;
                  const xPos = isLeft ? 100 : 340;
                  const yPos = index * 110;
                  
                  const pos = { x: xPos, y: yPos };
                  
                  return (
                    <div
                      key={chapter.id}
                      className={`absolute ${chapter.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      style={{ 
                        left: `${pos.x}px`,
                        top: `${pos.y}px`,
                        zIndex: 2
                      }}
                      onMouseEnter={() => setHoveredChapter(chapter.id)}
                      onMouseLeave={() => setHoveredChapter(null)}
                      onClick={() => handleChapterClick(chapter)}
                    >
                      {/* Hexagon */}
                      <div
                        className={`relative transition-all duration-300 ${
                          chapter.unlocked ? 'transform hover:scale-110' : 'opacity-50 grayscale'
                        }`}
                        style={{
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                          background: chapter.unlocked
                            ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)'
                            : 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                          width: '160px',
                          height: '180px',
                          border: '3px solid #666',
                          boxShadow: hoveredChapter === chapter.id && chapter.unlocked
                            ? '0 0 30px rgba(250, 182, 23, 0.8)'
                            : '0 0 10px rgba(0, 0, 0, 0.5)'
                        }}
                      >
                        {/* Background Image */}
                        <div className="absolute inset-0">
                          <img
                            src={`/mek-images/150px/${chapter.image}`}
                            alt={chapter.title}
                            className="w-full h-full object-cover"
                            style={{
                              opacity: 0.3,
                              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                            }}
                          />
                        </div>
                        {/* Content */}
                        <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
                          <div className="text-2xl font-bold text-yellow-400 mb-1">{chapter.id}</div>
                          <h3 className="text-xs font-bold text-white mb-1">{chapter.title}</h3>
                          {chapter.unlocked && (
                            <div className="text-xs text-gray-400">{chapter.progress}%</div>
                          )}
                          {!chapter.unlocked && (
                            <div className="text-2xl mt-1">🔒</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Tooltip */}
                      {hoveredChapter === chapter.id && (
                        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-black/95 border border-yellow-400/50 rounded-lg p-3 min-w-[200px] z-50 pointer-events-none">
                          <h4 className="text-yellow-400 font-bold text-sm mb-1">{chapter.title}</h4>
                          <p className="text-gray-400 text-xs mb-2">{chapter.description}</p>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Nodes:</span>
                              <span className="text-white">{chapter.nodeCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Progress:</span>
                              <span className={chapter.progress > 0 ? 'text-yellow-400' : 'text-gray-600'}>
                                {chapter.progress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Card Carousel Layout */}
          {layoutOption === 11 && (
            <div className="relative" style={{ height: '500px' }}>
              {/* Navigation Arrows */}
              <button
                onClick={() => navigateCarousel('prev')}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 p-4 ${
                  currentChapterIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'
                } transition-all`}
                disabled={currentChapterIndex === 0}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="#fab617" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button
                onClick={() => navigateCarousel('next')}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 p-4 ${
                  currentChapterIndex === chapters.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'
                } transition-all`}
                disabled={currentChapterIndex === chapters.length - 1}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="#fab617" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {/* Cards Container */}
              <div className="relative h-full flex items-center justify-center overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-out gap-6 absolute"
                  style={{
                    transform: `translateX(${-currentChapterIndex * 400 + 0}px)`,
                    left: '50%',
                    marginLeft: '-200px'
                  }}
                >
                  {chapters.map((chapter, index) => {
                    const isCenter = index === currentChapterIndex;
                    const isAdjacent = Math.abs(index - currentChapterIndex) === 1;
                    const isVisible = Math.abs(index - currentChapterIndex) <= 2;
                    
                    return (
                      <div
                        key={chapter.id}
                        className={`flex-shrink-0 transition-all duration-500 ${
                          chapter.unlocked && isCenter ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}
                        style={{
                          width: '380px',
                          height: '450px',
                          opacity: isCenter ? 1 : isAdjacent ? 0.4 : 0,
                          transform: isCenter ? 'scale(1)' : 'scale(0.85)',
                          pointerEvents: isVisible ? 'auto' : 'none',
                        }}
                        onClick={() => isCenter && handleChapterClick(chapter)}
                      >
                        {/* Card Style variations based on layoutOption */}
                        <div
                          className="relative w-full h-full rounded-2xl overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)`,
                            border: chapter.unlocked && isCenter ? '3px solid #fab617' : '3px solid #333',
                            boxShadow: chapter.unlocked && isCenter 
                              ? '0 0 40px rgba(250, 182, 23, 0.6), inset 0 0 20px rgba(250, 182, 23, 0.1)'
                              : '0 10px 30px rgba(0, 0, 0, 0.8)'
                          }}
                        >
                          {/* Background Image */}
                          <div className="absolute inset-0">
                            <img
                              src={`/mek-images/150px/${chapter.image}`}
                              alt={chapter.title}
                              className="w-full h-full object-cover"
                              style={{
                                opacity: chapter.unlocked ? 0.3 : 0.1,
                                filter: chapter.unlocked ? 'none' : 'grayscale(100%)'
                              }}
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                          </div>
                          
                          {/* Content */}
                          <div className="relative h-full flex flex-col justify-between p-8">
                            {/* Top Section */}
                            <div>
                              <div className="text-yellow-400 text-sm font-bold mb-2">{chapter.subtitle}</div>
                              <h2 className="text-3xl font-bold text-white mb-3">{chapter.title}</h2>
                              <p className="text-gray-400 text-sm">{chapter.description}</p>
                            </div>
                            
                            {/* Middle Section - Lock Status */}
                            <div className="flex-1 flex items-center justify-center">
                              {!chapter.unlocked && (
                                <div className="text-center">
                                  <div className="text-6xl mb-4">🔒</div>
                                  <div className="bg-black/80 rounded-lg p-4">
                                    <p className="text-yellow-400 text-sm font-bold">LOCKED</p>
                                    <p className="text-gray-400 text-xs mt-2">
                                      Complete Chapter {chapter.id - 1} to unlock
                                    </p>
                                  </div>
                                </div>
                              )}
                              {chapter.unlocked && (
                                <div className="text-center">
                                  {chapter.progress > 0 && (
                                    <div className="mb-4">
                                      <div className="text-yellow-400 text-2xl font-bold">{chapter.progress}%</div>
                                      <div className="text-gray-400 text-xs">PROGRESS</div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Bottom Section - Rewards */}
                            <div className="bg-black/60 rounded-lg p-4">
                              <div className="text-xs text-gray-400 mb-2">REWARDS</div>
                              <div className="flex justify-around">
                                <div className="text-center">
                                  <div className="text-yellow-400 font-bold">{chapter.rewards.gold.toLocaleString()}</div>
                                  <div className="text-xs text-gray-500">Gold</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-cyan-400 font-bold">{chapter.rewards.essence}</div>
                                  <div className="text-xs text-gray-500">Essence</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-purple-400 font-bold">{chapter.rewards.powerChips}</div>
                                  <div className="text-xs text-gray-500">Chips</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Play Button for unlocked center card */}
                            {chapter.unlocked && isCenter && (
                              <button className="mt-4 w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg">
                                ENTER CHAPTER
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Chapter Indicators */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2 pb-4">
                {chapters.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentChapterIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentChapterIndex 
                        ? 'w-8 bg-yellow-400' 
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(10px) translateX(-10px); }
          75% { transform: translateY(-10px) translateX(5px); }
        }
      `}</style>
    </div>
  );
}