'use client';

import React from 'react';

interface TitleCardProps {
  chapter: string;
  colorScheme?: 'hazard' | 'carbon' | 'circuit' | 'military' | 'cinematic';
}

// Space Station Display with 5 Yellow/Black Variations
export const SpaceStationTitle: React.FC<TitleCardProps> = ({ chapter, colorScheme = 'hazard' }) => {
  // Render different variations based on colorScheme
  switch (colorScheme) {
    case 'hazard':
      // Yellow/Black with hazard stripes and warning lights
      return (
        <div className="sticky top-0 z-50 h-24 bg-gradient-to-b from-gray-900 to-black border-b-4 border-yellow-500/80">
          <div className="max-w-[1600px] mx-auto pl-5 pr-5">
            <div className="relative h-24">
              {/* Hazard stripe pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    #fab617,
                    #fab617 10px,
                    #000000 10px,
                    #000000 20px
                  )`
                }}></div>
              </div>

              {/* Enhanced grid texture */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 10px,
                    rgba(250, 182, 23, 0.1) 10px,
                    rgba(250, 182, 23, 0.1) 12px
                  ), repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 10px,
                    rgba(250, 182, 23, 0.1) 10px,
                    rgba(250, 182, 23, 0.1) 12px
                  )`
                }}></div>
              </div>

              {/* Main display panel */}
              <div className="relative h-full flex items-center justify-center">
                <div className="relative">
                  {/* Outer frame */}
                  <div className="bg-gradient-to-b from-black/90 to-gray-900/90 backdrop-blur-md border-2 border-yellow-500/60 px-16 py-4">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-400"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-400"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-400"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-400"></div>

                    {/* Title content */}
                    <h1 className="text-2xl font-orbitron font-bold uppercase tracking-[0.4em] flex items-center gap-6">
                      <span className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,182,23,0.8)]">
                        STORY MODE
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-1 h-4 bg-yellow-400/60"></span>
                        <span className="w-1 h-4 bg-yellow-400/80"></span>
                        <span className="w-1 h-4 bg-yellow-400"></span>
                      </span>
                      <span className="text-lg text-yellow-600/90 tracking-[0.3em]">
                        {chapter}
                      </span>
                    </h1>
                  </div>

                  {/* Status lights - Left side */}
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_#fab617] animate-pulse"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_#fab617] animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_#fab617] animate-pulse delay-300"></div>
                  </div>
                  {/* Status lights - Right side */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_#fab617] animate-pulse"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_#fab617] animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_#fab617] animate-pulse delay-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'carbon':
      // Carbon fiber texture with yellow accents
      return (
        <div className="sticky top-0 z-50 h-24 bg-gradient-to-b from-gray-900 to-black border-b-4 border-yellow-600" style={{ borderStyle: 'double' }}>
          <div className="max-w-[1600px] mx-auto pl-5 pr-5">
            <div className="relative h-24">
              {/* Carbon fiber pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(
                    0deg,
                    rgba(250, 182, 23, 0.05) 0px,
                    transparent 1px,
                    transparent 2px,
                    rgba(250, 182, 23, 0.05) 3px
                  ), repeating-linear-gradient(
                    90deg,
                    rgba(250, 182, 23, 0.05) 0px,
                    transparent 1px,
                    transparent 2px,
                    rgba(250, 182, 23, 0.05) 3px
                  )`,
                  backgroundSize: '4px 4px'
                }}></div>
              </div>

              {/* Larger grid overlay */}
              <div className="absolute inset-0 opacity-15">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 20px,
                    rgba(250, 182, 23, 0.2) 20px,
                    rgba(250, 182, 23, 0.2) 22px
                  ), repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 20px,
                    rgba(250, 182, 23, 0.2) 20px,
                    rgba(250, 182, 23, 0.2) 22px
                  )`
                }}></div>
              </div>

              {/* Main display panel */}
              <div className="relative h-full flex items-center justify-center">
                <div className="relative">
                  {/* Outer frame with carbon texture */}
                  <div className="bg-gradient-to-b from-zinc-800/80 to-zinc-900/80 backdrop-blur-md border-2 border-yellow-600/50 px-16 py-4 rounded-sm shadow-[inset_0_0_20px_rgba(250,182,23,0.1)]">
                    {/* Rivet details */}
                    <div className="absolute top-1 left-2 w-2 h-2 bg-yellow-600 rounded-full shadow-inner"></div>
                    <div className="absolute top-1 right-2 w-2 h-2 bg-yellow-600 rounded-full shadow-inner"></div>
                    <div className="absolute bottom-1 left-2 w-2 h-2 bg-yellow-600 rounded-full shadow-inner"></div>
                    <div className="absolute bottom-1 right-2 w-2 h-2 bg-yellow-600 rounded-full shadow-inner"></div>

                    {/* Title content */}
                    <h1 className="text-2xl font-orbitron font-bold uppercase tracking-[0.4em] flex items-center gap-6">
                      <span className="text-yellow-500 drop-shadow-[0_0_15px_rgba(250,182,23,0.6)]">
                        STORY MODE
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-1 h-4 bg-amber-400/60"></span>
                        <span className="w-1 h-4 bg-amber-400/80"></span>
                        <span className="w-1 h-4 bg-amber-400"></span>
                      </span>
                      <span className="text-lg text-amber-200/90 tracking-[0.3em]">
                        {chapter}
                      </span>
                    </h1>
                  </div>

                  {/* Status lights - Vertical on sides */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                    <div className="w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_10px_#fbbf24] animate-pulse"></div>
                    <div className="w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_10px_#fbbf24] animate-pulse delay-150"></div>
                    <div className="w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_10px_#fbbf24] animate-pulse delay-300"></div>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                    <div className="w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_10px_#fbbf24] animate-pulse"></div>
                    <div className="w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_10px_#fbbf24] animate-pulse delay-150"></div>
                    <div className="w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_10px_#fbbf24] animate-pulse delay-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'circuit':
      // Circuit board pattern with tech lines
      return (
        <div className="sticky top-0 z-50 h-24 bg-gradient-to-b from-black via-gray-900 to-black border-b-2 border-yellow-400">
          <div className="max-w-[1600px] mx-auto pl-5 pr-5">
            <div className="relative h-24">
              {/* Circuit board pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    linear-gradient(90deg, transparent 0%, transparent 49%, rgba(250, 182, 23, 0.2) 50%, transparent 51%, transparent 100%),
                    linear-gradient(0deg, transparent 0%, transparent 49%, rgba(250, 182, 23, 0.2) 50%, transparent 51%, transparent 100%)
                  `,
                  backgroundSize: '30px 30px'
                }}></div>
                {/* Circuit traces */}
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    linear-gradient(45deg, transparent 48%, rgba(250, 182, 23, 0.1) 49%, rgba(250, 182, 23, 0.1) 51%, transparent 52%),
                    linear-gradient(-45deg, transparent 48%, rgba(250, 182, 23, 0.1) 49%, rgba(250, 182, 23, 0.1) 51%, transparent 52%)
                  `,
                  backgroundSize: '50px 50px'
                }}></div>
              </div>

              {/* Main display panel */}
              <div className="relative h-full flex items-center justify-center">
                <div className="relative">
                  {/* Tech frame */}
                  <div className="bg-black/90 backdrop-blur-sm border border-yellow-400/60 px-16 py-4" style={{
                    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
                  }}>
                    {/* Circuit nodes */}
                    <div className="absolute top-2 left-4 w-1 h-1 bg-yellow-400 rounded-full"></div>
                    <div className="absolute top-2 right-4 w-1 h-1 bg-yellow-400 rounded-full"></div>
                    <div className="absolute bottom-2 left-4 w-1 h-1 bg-yellow-400 rounded-full"></div>
                    <div className="absolute bottom-2 right-4 w-1 h-1 bg-yellow-400 rounded-full"></div>

                    {/* Title content */}
                    <h1 className="text-2xl font-orbitron font-bold uppercase tracking-[0.4em] flex items-center gap-6">
                      <span className="text-yellow-300 drop-shadow-[0_0_20px_rgba(250,182,23,0.9)]">
                        STORY MODE
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-300 rounded-full"></span>
                        <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                        <span className="w-2 h-2 bg-yellow-300 rounded-full"></span>
                      </span>
                      <span className="text-lg text-yellow-200/80 tracking-[0.3em]">
                        {chapter}
                      </span>
                    </h1>
                  </div>

                  {/* Tech status indicators - Vertical arrangement */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                    <div className="w-1 h-6 bg-yellow-300 shadow-[0_0_10px_#fde047]"></div>
                    <div className="w-1 h-6 bg-yellow-400 shadow-[0_0_10px_#facc15]"></div>
                    <div className="w-1 h-6 bg-yellow-500 shadow-[0_0_10px_#eab308]"></div>
                  </div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                    <div className="w-1 h-6 bg-yellow-300 shadow-[0_0_10px_#fde047]"></div>
                    <div className="w-1 h-6 bg-yellow-400 shadow-[0_0_10px_#facc15]"></div>
                    <div className="w-1 h-6 bg-yellow-500 shadow-[0_0_10px_#eab308]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'military':
      // Military stencil style with tactical elements
      return (
        <div className="sticky top-0 z-50 h-24 bg-gradient-to-b from-zinc-900 via-black to-zinc-900 border-b-4 border-yellow-600/70">
          <div className="max-w-[1600px] mx-auto pl-5 pr-5">
            <div className="relative h-24">
              {/* Military camo pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 30%, rgba(250, 182, 23, 0.2) 0%, transparent 20%),
                    radial-gradient(circle at 60% 60%, rgba(250, 182, 23, 0.15) 0%, transparent 15%),
                    radial-gradient(circle at 80% 20%, rgba(250, 182, 23, 0.2) 0%, transparent 20%),
                    radial-gradient(circle at 40% 80%, rgba(250, 182, 23, 0.15) 0%, transparent 15%)
                  `
                }}></div>
              </div>

              {/* Tactical grid */}
              <div className="absolute inset-0 opacity-25">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    repeating-linear-gradient(90deg, rgba(250, 182, 23, 0.3) 0px, transparent 1px, transparent 15px, rgba(250, 182, 23, 0.3) 16px),
                    repeating-linear-gradient(0deg, rgba(250, 182, 23, 0.3) 0px, transparent 1px, transparent 15px, rgba(250, 182, 23, 0.3) 16px)
                  `
                }}></div>
              </div>

              {/* Main display panel */}
              <div className="relative h-full flex items-center justify-center">
                <div className="relative">
                  {/* Military frame with stencil cut */}
                  <div className="bg-gradient-to-b from-zinc-800/95 to-black/95 backdrop-blur-sm px-16 py-4"
                    style={{
                      border: '3px solid',
                      borderImage: 'linear-gradient(135deg, #fab617 0%, #854d0e 50%, #fab617 100%) 1',
                      boxShadow: 'inset 0 0 30px rgba(250, 182, 23, 0.1)'
                    }}>
                    {/* Military markers */}
                    <div className="absolute -top-1 left-8 w-8 h-2 bg-yellow-600/80"></div>
                    <div className="absolute -top-1 right-8 w-8 h-2 bg-yellow-600/80"></div>
                    <div className="absolute -bottom-1 left-8 w-8 h-2 bg-yellow-600/80"></div>
                    <div className="absolute -bottom-1 right-8 w-8 h-2 bg-yellow-600/80"></div>

                    {/* Title content - Military stencil style */}
                    <h1 className="text-2xl font-orbitron font-black uppercase tracking-[0.5em] flex items-center gap-6">
                      <span className="text-yellow-500" style={{
                        textShadow: '2px 2px 0px rgba(0,0,0,0.8), 0 0 20px rgba(250,182,23,0.5)'
                      }}>
                        STORY MODE
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-1 bg-yellow-500"></span>
                        <span className="w-3 h-1 bg-yellow-600"></span>
                        <span className="w-3 h-1 bg-yellow-500"></span>
                      </span>
                      <span className="text-lg text-yellow-600/80 tracking-[0.4em] font-bold">
                        {chapter}
                      </span>
                    </h1>
                  </div>

                  {/* Tactical indicators - Vertical bars */}
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                    <div className="w-2 h-8 bg-gradient-to-b from-yellow-600 to-yellow-700"></div>
                    <div className="w-2 h-8 bg-gradient-to-b from-yellow-500 to-yellow-600"></div>
                    <div className="w-2 h-8 bg-gradient-to-b from-yellow-600 to-yellow-700"></div>
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                    <div className="w-2 h-8 bg-gradient-to-b from-yellow-600 to-yellow-700"></div>
                    <div className="w-2 h-8 bg-gradient-to-b from-yellow-500 to-yellow-600"></div>
                    <div className="w-2 h-8 bg-gradient-to-b from-yellow-600 to-yellow-700"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'cinematic':
      // Cinematic widescreen with dramatic lighting
      return (
        <div className="sticky top-0 z-50 h-24 bg-black border-t-2 border-b-2 border-yellow-400/50">
          <div className="max-w-[1600px] mx-auto pl-5 pr-5">
            <div className="relative h-24">
              {/* Cinematic light rays */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  background: `
                    linear-gradient(90deg, transparent 0%, rgba(250, 182, 23, 0.1) 20%, transparent 40%),
                    linear-gradient(-90deg, transparent 0%, rgba(250, 182, 23, 0.1) 20%, transparent 40%)
                  `
                }}></div>
              </div>

              {/* Film grain effect */}
              <div className="absolute inset-0 opacity-40">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    repeating-linear-gradient(
                      0deg,
                      transparent,
                      transparent 2px,
                      rgba(250, 182, 23, 0.03) 2px,
                      rgba(250, 182, 23, 0.03) 4px
                    )
                  `
                }}></div>
              </div>

              {/* Dramatic vignette */}
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)'
              }}></div>

              {/* Main display panel */}
              <div className="relative h-full flex items-center justify-center">
                <div className="relative">
                  {/* Cinematic letterbox frame */}
                  <div className="bg-black/80 backdrop-blur-xl px-20 py-5" style={{
                    border: '1px solid rgba(250, 182, 23, 0.3)',
                    boxShadow: `
                      0 0 50px rgba(250, 182, 23, 0.2),
                      inset 0 0 30px rgba(250, 182, 23, 0.05)
                    `
                  }}>
                    {/* Film markers */}
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>

                    {/* Title content - Cinematic style */}
                    <h1 className="text-3xl font-orbitron font-light uppercase tracking-[0.6em] flex items-center gap-8">
                      <span className="text-yellow-400" style={{
                        textShadow: `
                          0 0 40px rgba(250, 182, 23, 0.8),
                          0 0 80px rgba(250, 182, 23, 0.4),
                          0 0 120px rgba(250, 182, 23, 0.2)
                        `
                      }}>
                        STORY MODE
                      </span>
                      <span className="text-2xl text-yellow-600/60">•</span>
                      <span className="text-xl text-yellow-300/70 tracking-[0.4em] font-light">
                        {chapter}
                      </span>
                    </h1>
                  </div>

                  {/* Cinematic side lights */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                    <div className="w-1 h-12 bg-gradient-to-b from-transparent via-yellow-400 to-transparent opacity-60"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full blur-sm"></div>
                    <div className="w-1 h-12 bg-gradient-to-b from-transparent via-yellow-400 to-transparent opacity-60"></div>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                    <div className="w-1 h-12 bg-gradient-to-b from-transparent via-yellow-400 to-transparent opacity-60"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full blur-sm"></div>
                    <div className="w-1 h-12 bg-gradient-to-b from-transparent via-yellow-400 to-transparent opacity-60"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

// Main wrapper component - passes colorScheme through
export const StoryModeTitleCard: React.FC<TitleCardProps> = ({ chapter, colorScheme }) => {
  return <SpaceStationTitle chapter={chapter} colorScheme={colorScheme} />;
};