'use client';

import { useState } from 'react';

interface TimelineItem {
  phase: string;
  title: string;
  description: string;
  imageUrl: string;
}

const timelineData: TimelineItem[] = [
  {
    phase: 'Phase I',
    title: 'Foundation',
    description: 'Project inception and initial concept development. The vision for Mek Tycoon begins to take shape.',
    imageUrl: '/timeline/2023.webp',
  },
  {
    phase: 'Phase II',
    title: 'Development',
    description: 'Building the core ecosystem. Smart contracts, game mechanics, and NFT infrastructure come to life.',
    imageUrl: '/timeline/2024.webp',
  },
  {
    phase: 'Phase III',
    title: 'Launch',
    description: 'Going live with the mainnet. The Mek Tycoon universe opens its doors to the community.',
    imageUrl: '/timeline/2025.webp',
  },
  {
    phase: 'Phase IV',
    title: 'Expansion',
    description: 'Growing the community. New features, partnerships, and gameplay experiences emerge.',
    imageUrl: '/timeline/2026.webp',
  },
];

export default function HorizontalTimeline() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="w-full h-[60vh] min-h-[400px] relative overflow-hidden">
      {/* Mek Background Image with Fade Effect */}
      <div
        className="absolute inset-0 bg-cover bg-bottom"
        style={{
          backgroundImage: 'url(/mek-images/1000px/ae1-er3-lg2.webp)',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0) 100%)',
        }}
      />

      <div className="absolute inset-0 flex">
        {timelineData.map((item, index) => {
          const isHovered = hoveredIndex === index;
          const isAnyHovered = hoveredIndex !== null;

          let widthClass = 'w-1/4';
          if (isAnyHovered) {
            if (isHovered) {
              widthClass = 'w-[30%]';
            } else {
              widthClass = 'w-[23.33%]';
            }
          }

          return (
            <div
              key={index}
              className={`
                ${widthClass}
                relative
                transition-all duration-500 ease-in-out
                overflow-hidden
                cursor-pointer
              `}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                style={{
                  backgroundImage: `url(${item.imageUrl})`,
                  filter: isHovered ? 'grayscale(0%)' : 'grayscale(100%)',
                }}
              />

              {/* Dark Gradient Overlay - appears on hover */}
              <div
                className={`
                  absolute inset-0
                  bg-gradient-to-t from-black/80 via-black/40 to-transparent
                  transition-opacity duration-500
                  ${isHovered ? 'opacity-100' : 'opacity-0'}
                `}
              />

              {/* Phase Label - always visible, centered */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <h2
                  className="
                    text-4xl md:text-5xl
                    font-bold
                    text-white/70
                    font-['Orbitron']
                    tracking-wider
                    transition-all duration-500
                    pointer-events-none
                  "
                  style={{
                    textShadow: '0 0 40px rgba(0, 0, 0, 0.8)',
                  }}
                >
                  {item.phase}
                </h2>
              </div>

              {/* Content - fades in from bottom on hover */}
              <div
                className={`
                  absolute bottom-0 left-0 right-0
                  p-8 md:p-12
                  transition-all duration-500
                  z-20
                  ${isHovered
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
                  }
                `}
              >
                <h3
                  className="
                    text-2xl md:text-3xl
                    font-bold
                    text-[#1779cf]
                    mb-4
                    font-['Orbitron']
                    tracking-wide
                  "
                >
                  {item.title}
                </h3>
                <p className="text-white/90 text-base md:text-lg leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
