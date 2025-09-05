import React from 'react';

interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  nodeCount: number;
  unlocked: boolean;
  completed: boolean;
  progress: number;
  image: string;
  rewards: {
    gold: number;
    essence: number;
    powerChips: number;
  };
}

interface TimelineLayoutProps {
  chapters: Chapter[];
  hoveredChapter: number | null;
  setHoveredChapter: (id: number | null) => void;
  handleChapterClick: (chapter: Chapter) => void;
  layoutOption: number;
}

export const TimelineLayouts: React.FC<TimelineLayoutProps> = ({
  chapters,
  hoveredChapter,
  setHoveredChapter,
  handleChapterClick,
  layoutOption
}) => {
  // Layout 1: Classic Hexagon Timeline (keeping original)
  if (layoutOption === 1) {
    return (
      <div className="relative flex justify-center" style={{ minHeight: '1200px' }}>
        <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-500/20 via-yellow-500/60 to-yellow-500/20" style={{ zIndex: 1 }}></div>
        <div className="relative" style={{ width: '600px' }}>
          {chapters.map((chapter, index) => {
            const isLeft = index % 2 === 0;
            const xPos = isLeft ? 100 : 340;
            const yPos = index * 110;
            
            return (
              <div key={chapter.id}>
                <div 
                  className="absolute"
                  style={{
                    left: isLeft ? '240px' : '290px',
                    top: `${yPos + 60}px`,
                    width: '60px',
                    height: '2px',
                    background: chapter.unlocked ? '#fab617' : '#333',
                    zIndex: 2
                  }}
                />
                <div 
                  className="absolute"
                  style={{
                    left: '290px',
                    top: `${yPos + 55}px`,
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: chapter.unlocked ? '#fab617' : '#666',
                    border: '3px solid #000',
                    zIndex: 3
                  }}
                />
                <div
                  className={`absolute ${chapter.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  style={{ left: `${xPos}px`, top: `${yPos}px`, zIndex: 4 }}
                  onMouseEnter={() => setHoveredChapter(chapter.id)}
                  onMouseLeave={() => setHoveredChapter(null)}
                  onClick={() => handleChapterClick(chapter)}
                >
                  <div 
                    className={`relative transition-all duration-300 ${chapter.unlocked ? 'transform hover:scale-110' : 'opacity-50 grayscale'}`}
                    style={{
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                      background: chapter.unlocked ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)' : 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                      width: '140px',
                      height: '160px',
                      border: hoveredChapter === chapter.id && chapter.unlocked ? '3px solid #fab617' : '3px solid #666'
                    }}
                  >
                    <div className="absolute inset-0">
                      <img src={`/mek-images/150px/${chapter.image}`} alt={chapter.title} className="w-full h-full object-cover" style={{ opacity: 0.3, clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                    </div>
                    <div className="relative h-full flex flex-col items-center justify-center p-3 text-center">
                      <div className="text-xl font-bold text-yellow-400">{chapter.id}</div>
                      <h3 className="text-[11px] font-bold text-white mt-1">{chapter.title}</h3>
                      {chapter.unlocked && <div className="text-[10px] text-gray-400 mt-1">{chapter.progress}%</div>}
                      {!chapter.unlocked && <div className="text-xl mt-1">🔒</div>}
                    </div>
                  </div>
                  {hoveredChapter === chapter.id && (
                    <div className={`absolute ${isLeft ? 'left-full ml-2' : 'right-full mr-2'} top-1/2 transform -translate-y-1/2 bg-gray-900 border border-yellow-500/50 rounded-lg p-2 text-xs whitespace-nowrap z-20`}>
                      {chapter.unlocked ? (
                        <div>
                          <div className="font-bold text-yellow-400">{chapter.title}</div>
                          <div className="text-gray-400">{chapter.description}</div>
                          <div className="text-yellow-400 mt-1">Progress: {chapter.progress}%</div>
                        </div>
                      ) : (
                        <div>Complete Chapter {chapter.id - 1} to unlock</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Layout 2: DNA Helix
  if (layoutOption === 2) {
    return (
      <div className="relative flex justify-center" style={{ minHeight: '1200px' }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {chapters.map((_, index) => {
            if (index === chapters.length - 1) return null;
            const y1 = 100 + index * 110;
            const y2 = 100 + (index + 1) * 110;
            const x1 = 300 + Math.sin(index * 0.8) * 100;
            const x2 = 300 + Math.sin((index + 1) * 0.8) * 100;
            return (
              <path
                key={`helix-${index}`}
                d={`M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 + 20} ${x2} ${y2}`}
                stroke="#fab617"
                strokeWidth="2"
                fill="none"
                opacity="0.4"
              />
            );
          })}
        </svg>
        <div className="relative" style={{ width: '600px' }}>
          {chapters.map((chapter, index) => {
            const xPos = 250 + Math.sin(index * 0.8) * 150;
            const yPos = 100 + index * 110;
            
            return (
              <div
                key={chapter.id}
                className={`absolute ${chapter.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                style={{ left: `${xPos}px`, top: `${yPos}px`, zIndex: 2 }}
                onMouseEnter={() => setHoveredChapter(chapter.id)}
                onMouseLeave={() => setHoveredChapter(null)}
                onClick={() => handleChapterClick(chapter)}
              >
                <div 
                  className={`relative transition-all duration-300 ${chapter.unlocked ? 'transform hover:scale-110 hover:rotate-12' : 'opacity-50 grayscale'}`}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: chapter.unlocked 
                      ? `radial-gradient(circle, ${hoveredChapter === chapter.id ? '#fab617' : '#4a4a4a'} 0%, #1a1a1a 100%)`
                      : 'radial-gradient(circle, #2a2a2a 0%, #0a0a0a 100%)',
                    border: '3px solid',
                    borderColor: hoveredChapter === chapter.id && chapter.unlocked ? '#fab617' : '#666',
                    boxShadow: hoveredChapter === chapter.id && chapter.unlocked 
                      ? '0 0 30px rgba(250, 182, 23, 0.8)' 
                      : '0 0 10px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <div className="relative h-full flex flex-col items-center justify-center p-2 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{chapter.id}</div>
                    <h3 className="text-[10px] font-bold text-white">{chapter.title}</h3>
                    {!chapter.unlocked && <div className="text-lg">🔒</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Layout 3: Circuit Board
  if (layoutOption === 3) {
    return (
      <div className="relative flex justify-center" style={{ minHeight: '1200px', background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)' }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {/* Circuit traces */}
          {chapters.map((chapter, index) => {
            const y = 100 + index * 110;
            return (
              <g key={`circuit-${index}`}>
                <line x1="0" y1={y} x2="800" y2={y} stroke="#333" strokeWidth="1" opacity="0.3" />
                <circle cx="300" cy={y} r="3" fill={chapter.unlocked ? '#fab617' : '#666'} />
                {index < chapters.length - 1 && (
                  <line x1="300" y1={y} x2="300" y2={y + 110} stroke={chapter.unlocked ? '#fab617' : '#666'} strokeWidth="2" />
                )}
              </g>
            );
          })}
        </svg>
        <div className="relative" style={{ width: '700px' }}>
          {chapters.map((chapter, index) => {
            const isLeft = index % 2 === 0;
            const xPos = isLeft ? 50 : 450;
            const yPos = 70 + index * 110;
            
            return (
              <div key={chapter.id}>
                {/* CPU Chip Design */}
                <div
                  className={`absolute ${chapter.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  style={{ left: `${xPos}px`, top: `${yPos}px`, zIndex: 2 }}
                  onMouseEnter={() => setHoveredChapter(chapter.id)}
                  onMouseLeave={() => setHoveredChapter(null)}
                  onClick={() => handleChapterClick(chapter)}
                >
                  <div 
                    className={`relative transition-all duration-300 ${chapter.unlocked ? 'transform hover:scale-105' : 'opacity-50 grayscale'}`}
                    style={{
                      width: '180px',
                      height: '60px',
                      background: chapter.unlocked 
                        ? 'linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)'
                        : '#0a0a0a',
                      border: '2px solid',
                      borderColor: hoveredChapter === chapter.id && chapter.unlocked ? '#fab617' : '#666',
                      boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    {/* Circuit pins */}
                    <div className="absolute -top-2 left-0 right-0 flex justify-around">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-1 h-2 bg-gray-600" />
                      ))}
                    </div>
                    <div className="absolute -bottom-2 left-0 right-0 flex justify-around">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-1 h-2 bg-gray-600" />
                      ))}
                    </div>
                    <div className="relative h-full flex items-center justify-between px-3">
                      <div className="text-2xl font-bold text-yellow-400">{chapter.id}</div>
                      <div className="flex-1 mx-2">
                        <h3 className="text-xs font-bold text-white">{chapter.title}</h3>
                        {chapter.unlocked && <div className="text-[10px] text-green-400">ACTIVE</div>}
                      </div>
                      {!chapter.unlocked && <div className="text-xl">🔒</div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Layout 4: Metro Map
  if (layoutOption === 4) {
    return (
      <div className="relative flex justify-center" style={{ minHeight: '1200px' }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {/* Metro lines */}
          <path
            d="M 300 50 L 300 250 Q 300 300 350 300 L 450 300 Q 500 300 500 350 L 500 550 Q 500 600 450 600 L 350 600 Q 300 600 300 650 L 300 1150"
            stroke="#fab617"
            strokeWidth="8"
            fill="none"
            opacity="0.3"
          />
          <path
            d="M 280 50 L 280 1150"
            stroke="#666"
            strokeWidth="2"
            fill="none"
            opacity="0.2"
          />
          <path
            d="M 320 50 L 320 1150"
            stroke="#666"
            strokeWidth="2"
            fill="none"
            opacity="0.2"
          />
        </svg>
        <div className="relative" style={{ width: '700px' }}>
          {chapters.map((chapter, index) => {
            const positions = [
              { x: 200, y: 50 },
              { x: 200, y: 180 },
              { x: 350, y: 250 },
              { x: 450, y: 250 },
              { x: 450, y: 380 },
              { x: 450, y: 510 },
              { x: 300, y: 580 },
              { x: 200, y: 580 },
              { x: 200, y: 710 },
              { x: 200, y: 840 }
            ];
            const pos = positions[index] || { x: 0, y: 0 };
            
            return (
              <div
                key={chapter.id}
                className={`absolute ${chapter.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                style={{ left: `${pos.x}px`, top: `${pos.y}px`, zIndex: 2 }}
                onMouseEnter={() => setHoveredChapter(chapter.id)}
                onMouseLeave={() => setHoveredChapter(null)}
                onClick={() => handleChapterClick(chapter)}
              >
                <div 
                  className={`relative transition-all duration-300 ${chapter.unlocked ? 'transform hover:scale-110' : 'opacity-50 grayscale'}`}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: chapter.unlocked ? '#fff' : '#666',
                    border: '4px solid',
                    borderColor: chapter.unlocked ? '#fab617' : '#333',
                    boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <div className="relative h-full flex items-center justify-center">
                    <div className="text-2xl font-bold" style={{ color: chapter.unlocked ? '#000' : '#999' }}>
                      {chapter.id}
                    </div>
                  </div>
                </div>
                <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 whitespace-nowrap">
                  <div className="text-xs font-bold text-white">{chapter.title}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Layout 5: Constellation
  if (layoutOption === 5) {
    return (
      <div className="relative flex justify-center" style={{ minHeight: '1200px', background: 'radial-gradient(ellipse at center, #0a0a2a 0%, #000 100%)' }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {/* Constellation lines */}
          {chapters.map((chapter, index) => {
            if (index === 0) return null;
            const prevIndex = index - 1;
            const x1 = 300 + Math.cos(prevIndex * 0.7) * (150 + prevIndex * 10);
            const y1 = 100 + prevIndex * 100;
            const x2 = 300 + Math.cos(index * 0.7) * (150 + index * 10);
            const y2 = 100 + index * 100;
            return (
              <line
                key={`star-line-${index}`}
                x1={x1} y1={y1}
                x2={x2} y2={y2}
                stroke={chapter.unlocked ? '#fab617' : '#333'}
                strokeWidth="1"
                opacity="0.5"
                strokeDasharray="2,4"
              />
            );
          })}
        </svg>
        <div className="relative" style={{ width: '700px' }}>
          {chapters.map((chapter, index) => {
            const xPos = 250 + Math.cos(index * 0.7) * (150 + index * 10);
            const yPos = 50 + index * 100;
            const size = 40 + (chapter.unlocked ? 20 : 0);
            
            return (
              <div
                key={chapter.id}
                className={`absolute ${chapter.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                style={{ left: `${xPos}px`, top: `${yPos}px`, zIndex: 2 }}
                onMouseEnter={() => setHoveredChapter(chapter.id)}
                onMouseLeave={() => setHoveredChapter(null)}
                onClick={() => handleChapterClick(chapter)}
              >
                {/* Star glow */}
                {chapter.unlocked && (
                  <div 
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: `${size * 2}px`,
                      height: `${size * 2}px`,
                      background: 'radial-gradient(circle, rgba(250, 182, 23, 0.4) 0%, transparent 70%)',
                      animation: 'pulse 3s ease-in-out infinite'
                    }}
                  />
                )}
                {/* Star shape */}
                <div 
                  className={`relative transition-all duration-300 ${chapter.unlocked ? 'transform hover:scale-125' : 'opacity-50'}`}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                    background: chapter.unlocked 
                      ? `radial-gradient(circle, #fff 0%, #fab617 50%, #d4a017 100%)`
                      : '#333',
                    boxShadow: chapter.unlocked ? '0 0 30px rgba(250, 182, 23, 0.8)' : 'none'
                  }}
                >
                  <div className="relative h-full flex items-center justify-center">
                    <div className="text-sm font-bold" style={{ color: chapter.unlocked ? '#000' : '#666' }}>
                      {chapter.id}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Layout 6: Film Reel
  if (layoutOption === 6) {
    return (
      <div className="relative flex justify-center" style={{ minHeight: '1200px', background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)' }}>
        <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-20 bg-gradient-to-b from-gray-800 via-gray-700 to-gray-800" style={{ zIndex: 1 }}>
          {/* Film perforations */}
          {[...Array(40)].map((_, i) => (
            <div key={i} className="absolute" style={{ left: '5px', top: `${i * 30}px`, width: '10px', height: '15px', background: '#000', borderRadius: '2px' }} />
          ))}
          {[...Array(40)].map((_, i) => (
            <div key={i} className="absolute" style={{ right: '5px', top: `${i * 30}px`, width: '10px', height: '15px', background: '#000', borderRadius: '2px' }} />
          ))}
        </div>
        <div className="relative" style={{ width: '700px' }}>
          {chapters.map((chapter, index) => {
            const yPos = 50 + index * 115;
            
            return (
              <div
                key={chapter.id}
                className={`absolute ${chapter.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                style={{ left: '250px', top: `${yPos}px`, zIndex: 2 }}
                onMouseEnter={() => setHoveredChapter(chapter.id)}
                onMouseLeave={() => setHoveredChapter(null)}
                onClick={() => handleChapterClick(chapter)}
              >
                <div 
                  className={`relative transition-all duration-300 ${chapter.unlocked ? 'transform hover:scale-105' : 'opacity-50 grayscale'}`}
                  style={{
                    width: '200px',
                    height: '100px',
                    background: chapter.unlocked ? '#222' : '#111',
                    border: '3px solid',
                    borderColor: hoveredChapter === chapter.id && chapter.unlocked ? '#fab617' : '#444',
                    boxShadow: '0 0 20px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  {/* Film frame */}
                  <div className="absolute inset-2" style={{ background: `url(/mek-images/150px/${chapter.image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.7 }} />
                  <div className="relative h-full flex flex-col items-center justify-center bg-black/60">
                    <div className="text-3xl font-bold text-yellow-400">SCENE {chapter.id}</div>
                    <h3 className="text-sm font-bold text-white mt-1">{chapter.title}</h3>
                    {!chapter.unlocked && <div className="text-2xl mt-1">🔒</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Layout 7: Crystal Growth
  if (layoutOption === 7) {
    return (
      <div className="relative flex justify-center" style={{ minHeight: '1200px', background: 'radial-gradient(ellipse at center, #1a0a2a 0%, #000 100%)' }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {/* Crystal structure lines */}
          {chapters.map((_, index) => {
            const y = 100 + index * 100;
            const x = 300 + (index % 2 === 0 ? -50 : 50) * Math.sin(index * 0.5);
            return (
              <g key={`crystal-${index}`}>
                <polygon
                  points={`${x},${y-20} ${x+30},${y} ${x+20},${y+30} ${x-20},${y+30} ${x-30},${y}`}
                  stroke="#fab617"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.3"
                />
              </g>
            );
          })}
        </svg>
        <div className="relative" style={{ width: '700px' }}>
          {chapters.map((chapter, index) => {
            const xPos = 250 + (index % 2 === 0 ? -100 : 100) * Math.sin(index * 0.5);
            const yPos = 50 + index * 100;
            const rotation = index * 15;
            
            return (
              <div
                key={chapter.id}
                className={`absolute ${chapter.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                style={{ left: `${xPos}px`, top: `${yPos}px`, zIndex: 2 }}
                onMouseEnter={() => setHoveredChapter(chapter.id)}
                onMouseLeave={() => setHoveredChapter(null)}
                onClick={() => handleChapterClick(chapter)}
              >
                <div 
                  className={`relative transition-all duration-300 ${chapter.unlocked ? 'transform hover:scale-110' : 'opacity-50 grayscale'}`}
                  style={{
                    width: '80px',
                    height: '100px',
                    clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                    background: chapter.unlocked 
                      ? `linear-gradient(135deg, rgba(250, 182, 23, 0.8) 0%, rgba(138, 43, 226, 0.8) 100%)`
                      : 'linear-gradient(135deg, #333 0%, #111 100%)',
                    transform: `rotate(${rotation}deg)`,
                    boxShadow: chapter.unlocked ? '0 0 30px rgba(138, 43, 226, 0.6)' : 'none'
                  }}
                >
                  <div className="relative h-full flex items-center justify-center" style={{ transform: `rotate(-${rotation}deg)` }}>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{chapter.id}</div>
                      {!chapter.unlocked && <div className="text-lg">🔒</div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Layout 8: Book Spine
  if (layoutOption === 8) {
    return (
      <div className="relative flex justify-center" style={{ minHeight: '1200px', background: 'linear-gradient(90deg, #2a1810 0%, #1a0f08 50%, #2a1810 100%)' }}>
        <div className="relative" style={{ width: '800px' }}>
          {chapters.map((chapter, index) => {
            const xPos = 150 + (index % 2) * 300;
            const yPos = 50 + Math.floor(index / 2) * 220;
            const colors = ['#8B4513', '#A0522D', '#D2691E', '#CD853F', '#DEB887'];
            const bookColor = colors[index % colors.length];
            
            return (
              <div
                key={chapter.id}
                className={`absolute ${chapter.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                style={{ left: `${xPos}px`, top: `${yPos}px`, zIndex: 2 }}
                onMouseEnter={() => setHoveredChapter(chapter.id)}
                onMouseLeave={() => setHoveredChapter(null)}
                onClick={() => handleChapterClick(chapter)}
              >
                <div 
                  className={`relative transition-all duration-300 ${chapter.unlocked ? 'transform hover:scale-105 hover:-translate-y-2' : 'opacity-50 grayscale'}`}
                  style={{
                    width: '200px',
                    height: '180px',
                    background: chapter.unlocked ? bookColor : '#333',
                    borderRadius: '0 10px 10px 0',
                    boxShadow: '5px 5px 15px rgba(0, 0, 0, 0.7)',
                    border: '2px solid',
                    borderColor: hoveredChapter === chapter.id && chapter.unlocked ? '#fab617' : '#000',
                    borderLeft: 'none'
                  }}
                >
                  {/* Book spine details */}
                  <div className="absolute top-4 left-4 right-4 h-1 bg-black/30" />
                  <div className="absolute bottom-4 left-4 right-4 h-1 bg-black/30" />
                  <div className="relative h-full flex flex-col items-center justify-center p-4">
                    <div className="text-lg font-bold text-yellow-400 mb-2">VOLUME {chapter.id}</div>
                    <h3 className="text-sm font-bold text-white text-center" style={{ writingMode: 'horizontal-tb' }}>
                      {chapter.title}
                    </h3>
                    {chapter.unlocked && (
                      <div className="text-xs text-yellow-200 mt-2">{chapter.progress}% Read</div>
                    )}
                    {!chapter.unlocked && <div className="text-2xl mt-2">🔒</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Layout 9: Neon Cascade
  if (layoutOption === 9) {
    return (
      <div className="relative flex justify-center" style={{ minHeight: '1200px', background: '#000' }}>
        <div className="relative" style={{ width: '700px' }}>
          {chapters.map((chapter, index) => {
            const xPos = 250 + Math.sin(index * 0.5) * 150;
            const yPos = 50 + index * 110;
            const neonColors = ['#ff00ff', '#00ffff', '#ffff00', '#ff00ff', '#00ff00'];
            const neonColor = neonColors[index % neonColors.length];
            
            return (
              <div key={chapter.id}>
                {/* Neon trail */}
                {index > 0 && (
                  <div
                    className="absolute"
                    style={{
                      left: `${250 + Math.sin((index - 1) * 0.5) * 150 + 50}px`,
                      top: `${50 + (index - 1) * 110 + 50}px`,
                      width: `${Math.abs(xPos - (250 + Math.sin((index - 1) * 0.5) * 150))}px`,
                      height: '110px',
                      background: `linear-gradient(180deg, transparent 0%, ${neonColor}40 50%, transparent 100%)`,
                      filter: 'blur(20px)',
                      zIndex: 0
                    }}
                  />
                )}
                <div
                  className={`absolute ${chapter.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  style={{ left: `${xPos}px`, top: `${yPos}px`, zIndex: 2 }}
                  onMouseEnter={() => setHoveredChapter(chapter.id)}
                  onMouseLeave={() => setHoveredChapter(null)}
                  onClick={() => handleChapterClick(chapter)}
                >
                  <div 
                    className={`relative transition-all duration-300 ${chapter.unlocked ? 'transform hover:scale-110' : 'opacity-50 grayscale'}`}
                    style={{
                      width: '100px',
                      height: '100px',
                      background: chapter.unlocked ? '#111' : '#222',
                      border: '2px solid',
                      borderColor: chapter.unlocked ? neonColor : '#333',
                      borderRadius: '10px',
                      boxShadow: chapter.unlocked 
                        ? `0 0 20px ${neonColor}, inset 0 0 20px ${neonColor}40`
                        : 'none',
                      animation: chapter.unlocked && hoveredChapter === chapter.id ? 'pulse 1s infinite' : 'none'
                    }}
                  >
                    <div className="relative h-full flex flex-col items-center justify-center">
                      <div className="text-3xl font-bold" style={{ color: chapter.unlocked ? neonColor : '#666', textShadow: chapter.unlocked ? `0 0 10px ${neonColor}` : 'none' }}>
                        {chapter.id}
                      </div>
                      <h3 className="text-[10px] font-bold text-white mt-1">{chapter.title}</h3>
                      {!chapter.unlocked && <div className="text-xl mt-1">🔒</div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Layout 10: Portal Network
  if (layoutOption === 10) {
    return (
      <div className="relative flex justify-center" style={{ minHeight: '1200px', background: 'radial-gradient(ellipse at center, #0a0a2a 0%, #000 100%)' }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {/* Portal connections */}
          {chapters.map((_, index) => {
            if (index === chapters.length - 1) return null;
            const y1 = 100 + index * 110;
            const y2 = 100 + (index + 1) * 110;
            return (
              <g key={`portal-${index}`}>
                <ellipse
                  cx="300" cy={y1}
                  rx="100" ry="20"
                  stroke="#fab617"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.3"
                />
                <line
                  x1="300" y1={y1 + 20}
                  x2="300" y2={y2 - 20}
                  stroke="#fab617"
                  strokeWidth="1"
                  opacity="0.5"
                  strokeDasharray="5,5"
                />
              </g>
            );
          })}
        </svg>
        <div className="relative" style={{ width: '700px' }}>
          {chapters.map((chapter, index) => {
            const yPos = 50 + index * 110;
            
            return (
              <div
                key={chapter.id}
                className={`absolute ${chapter.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                style={{ left: '200px', top: `${yPos}px`, zIndex: 2 }}
                onMouseEnter={() => setHoveredChapter(chapter.id)}
                onMouseLeave={() => setHoveredChapter(null)}
                onClick={() => handleChapterClick(chapter)}
              >
                {/* Portal ring */}
                <div 
                  className={`absolute transition-all duration-500 ${chapter.unlocked ? 'opacity-100' : 'opacity-30'}`}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '200px',
                    height: '100px',
                    border: '3px solid',
                    borderColor: chapter.unlocked ? '#fab617' : '#333',
                    borderRadius: '50%',
                    animation: chapter.unlocked ? 'spin 10s linear infinite' : 'none'
                  }}
                />
                {/* Portal center */}
                <div 
                  className={`relative transition-all duration-300 ${chapter.unlocked ? 'transform hover:scale-110' : 'opacity-50 grayscale'}`}
                  style={{
                    width: '180px',
                    height: '80px',
                    borderRadius: '50%',
                    background: chapter.unlocked 
                      ? `radial-gradient(ellipse at center, #fab61780 0%, #8a2be280 50%, #00000000 100%)`
                      : 'radial-gradient(ellipse at center, #333 0%, #000 100%)',
                    boxShadow: chapter.unlocked ? '0 0 50px rgba(138, 43, 226, 0.8)' : 'none'
                  }}
                >
                  <div className="relative h-full flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold text-yellow-400">PORTAL {chapter.id}</div>
                    <h3 className="text-xs font-bold text-white">{chapter.title}</h3>
                    {!chapter.unlocked && <div className="text-xl">🔒</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};