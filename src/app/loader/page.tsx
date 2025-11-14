'use client';

import React, { useState, useEffect } from 'react';
import { TriangleKaleidoscope } from '@/features/page-loader/components/TriangleKaleidoscope';
import { PercentageDisplay } from '@/features/page-loader/components/PercentageDisplay';
import { LoadingText } from '@/features/page-loader/components/LoadingText';

type LoaderVariant = 'current' | 'sleek-pulse' | 'minimal-rings';

export default function LoaderDebugPage() {
  const [activeLoader, setActiveLoader] = useState<LoaderVariant>('current');
  const [percentage, setPercentage] = useState(0);
  const [stage, setStage] = useState('Initializing...');
  const [isAnimating, setIsAnimating] = useState(false);

  // Percentage Display Controls
  const [fontSize, setFontSize] = useState(48);
  const [spacing, setSpacing] = useState(16);
  const [fontFamily, setFontFamily] = useState('Orbitron');

  const stages = [
    'Initializing...',
    'Loading resources...',
    'Preparing interface...',
    'Almost ready...',
  ];

  const startAnimation = () => {
    setIsAnimating(true);
    setPercentage(0);
    setStage(stages[0]);

    let currentPercentage = 0;
    let currentStageIndex = 0;

    const interval = setInterval(() => {
      currentPercentage += 2;
      setPercentage(currentPercentage);

      if (currentPercentage === 25 || currentPercentage === 50 || currentPercentage === 75) {
        currentStageIndex++;
        setStage(stages[currentStageIndex]);
      }

      if (currentPercentage >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsAnimating(false);
        }, 1000);
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-500 mb-2 font-orbitron tracking-wider">
            LOADER DEBUG STATION
          </h1>
          <p className="text-gray-400">
            Preview and test different loading animations
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex gap-4 items-center flex-wrap">
          <button
            onClick={startAnimation}
            disabled={isAnimating}
            className="px-6 py-3 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isAnimating ? 'Loading...' : 'Start Animation'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveLoader('current')}
              className={`px-4 py-2 rounded border-2 transition-all ${
                activeLoader === 'current'
                  ? 'border-yellow-500 bg-yellow-500/20 text-yellow-500'
                  : 'border-gray-600 text-gray-400 hover:border-gray-500'
              }`}
            >
              Current (Triangle)
            </button>
            <button
              onClick={() => setActiveLoader('sleek-pulse')}
              className={`px-4 py-2 rounded border-2 transition-all ${
                activeLoader === 'sleek-pulse'
                  ? 'border-yellow-500 bg-yellow-500/20 text-yellow-500'
                  : 'border-gray-600 text-gray-400 hover:border-gray-500'
              }`}
            >
              Sleek Pulse
            </button>
            <button
              onClick={() => setActiveLoader('minimal-rings')}
              className={`px-4 py-2 rounded border-2 transition-all ${
                activeLoader === 'minimal-rings'
                  ? 'border-yellow-500 bg-yellow-500/20 text-yellow-500'
                  : 'border-gray-600 text-gray-400 hover:border-gray-500'
              }`}
            >
              Minimal Rings
            </button>
          </div>
        </div>

        {/* Percentage Display Controls */}
        <div className="mb-8 border-2 border-yellow-500/30 rounded-lg p-6 bg-gray-900/50">
          <h2 className="text-yellow-500 font-bold mb-4 text-lg">Percentage Display Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Font Size Control */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-semibold">
                Font Size: {fontSize}px
              </label>
              <input
                type="range"
                min="24"
                max="96"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>24px</span>
                <span>96px</span>
              </div>
            </div>

            {/* Spacing Control */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-semibold">
                Spacing from Triangle: {spacing}px
              </label>
              <input
                type="range"
                min="0"
                max="64"
                value={spacing}
                onChange={(e) => setSpacing(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0px</span>
                <span>64px</span>
              </div>
            </div>

            {/* Font Family Control */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-semibold">
                Font Family
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-yellow-500 focus:outline-none"
              >
                <option value="Orbitron">Orbitron (Default)</option>
                <option value="monospace">Monospace</option>
                <option value="Arial">Arial</option>
                <option value="sans-serif">Sans-serif</option>
                <option value="serif">Serif</option>
                <option value="'Courier New'">Courier New</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="grid grid-cols-1 gap-8">
          {/* Full Preview */}
          <div className="border-2 border-yellow-500/30 rounded-lg overflow-hidden">
            <div className="bg-gray-800/50 px-4 py-2 border-b border-yellow-500/30">
              <h2 className="text-yellow-500 font-semibold">Full Screen Preview</h2>
            </div>
            <div className="relative bg-black aspect-video flex items-center justify-center">
              <div className="flex flex-col items-center gap-8 w-full max-w-xl px-4">
                {/* Loader Component */}
                {activeLoader === 'current' && (
                  <div className="w-48 h-48 md:w-64 md:h-64">
                    <TriangleKaleidoscope />
                  </div>
                )}

                {activeLoader === 'sleek-pulse' && <SleekPulseLoader />}

                {activeLoader === 'minimal-rings' && <MinimalRingsLoader />}

                {/* Percentage Display */}
                <PercentageDisplay
                  percentage={percentage}
                  fontSize={fontSize}
                  spacing={spacing}
                  fontFamily={fontFamily}
                />

                {/* Loading Text */}
                <LoadingText currentStage={stage} />
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison */}
          <div className="grid grid-cols-3 gap-4">
            <LoaderCard
              title="Current (Triangle)"
              active={activeLoader === 'current'}
              onClick={() => setActiveLoader('current')}
            >
              <div className="w-32 h-32">
                <TriangleKaleidoscope />
              </div>
            </LoaderCard>

            <LoaderCard
              title="Sleek Pulse"
              active={activeLoader === 'sleek-pulse'}
              onClick={() => setActiveLoader('sleek-pulse')}
            >
              <div className="scale-75">
                <SleekPulseLoader />
              </div>
            </LoaderCard>

            <LoaderCard
              title="Minimal Rings"
              active={activeLoader === 'minimal-rings'}
              onClick={() => setActiveLoader('minimal-rings')}
            >
              <div className="scale-75">
                <MinimalRingsLoader />
              </div>
            </LoaderCard>
          </div>
        </div>

        {/* Implementation Instructions */}
        <div className="mt-8 border border-yellow-500/30 rounded-lg p-6 bg-gray-900/50">
          <h3 className="text-yellow-500 font-bold mb-3">How to Apply</h3>
          <p className="text-gray-300 mb-2">
            To use a different loader, update{' '}
            <code className="text-yellow-400 bg-black px-2 py-1 rounded">
              src/features/page-loader/components/LoadingOverlay.tsx
            </code>
          </p>
          <p className="text-gray-400 text-sm">
            Replace the current loader component import and usage with your selected variant.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoaderCard({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`border-2 rounded-lg p-6 transition-all bg-black hover:border-yellow-500/50 ${
        active ? 'border-yellow-500' : 'border-gray-700'
      }`}
    >
      <div className="mb-4 flex items-center justify-center h-40">
        {children}
      </div>
      <h3 className={`font-semibold ${active ? 'text-yellow-500' : 'text-gray-400'}`}>
        {title}
      </h3>
    </button>
  );
}

// NEW LOADER VARIANT 1: Sleek Pulse
function SleekPulseLoader() {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full border-2 border-yellow-500/20"
        style={{
          animation: 'sleekPulse 2s ease-in-out infinite',
        }}
      />

      {/* Middle ring */}
      <div
        className="absolute inset-4 rounded-full border-2 border-yellow-500/40"
        style={{
          animation: 'sleekPulse 2s ease-in-out 0.4s infinite',
        }}
      />

      {/* Inner ring */}
      <div
        className="absolute inset-8 rounded-full border-2 border-yellow-500/60"
        style={{
          animation: 'sleekPulse 2s ease-in-out 0.8s infinite',
        }}
      />

      {/* Center glow */}
      <div
        className="w-20 h-20 rounded-full bg-yellow-500"
        style={{
          boxShadow: '0 0 40px rgba(250, 182, 23, 0.8), 0 0 80px rgba(250, 182, 23, 0.4)',
          animation: 'centerGlow 2s ease-in-out infinite',
        }}
      />

      {/* Orbital dots */}
      {[0, 120, 240].map((angle, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 bg-yellow-400 rounded-full"
          style={{
            top: '50%',
            left: '50%',
            transform: `rotate(${angle}deg) translateY(-72px)`,
            boxShadow: '0 0 10px rgba(250, 182, 23, 0.8)',
            animation: `orbit 3s linear infinite ${i * 1}s`,
          }}
        />
      ))}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes sleekPulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.3;
            }
            50% {
              transform: scale(1.1);
              opacity: 1;
            }
          }

          @keyframes centerGlow {
            0%, 100% {
              transform: scale(1);
              opacity: 0.8;
            }
            50% {
              transform: scale(1.15);
              opacity: 1;
            }
          }

          @keyframes orbit {
            from {
              transform: rotate(0deg) translateY(-72px);
            }
            to {
              transform: rotate(360deg) translateY(-72px);
            }
          }
        `
      }} />
    </div>
  );
}

// NEW LOADER VARIANT 2: Minimal Rings
function MinimalRingsLoader() {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Rotating ring segments */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            animation: `ringRotate 2s cubic-bezier(0.4, 0, 0.2, 1) infinite ${i * 0.3}s`,
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle
              cx="50"
              cy="50"
              r={40 - i * 8}
              fill="none"
              stroke="rgba(250, 182, 23, 0.6)"
              strokeWidth="1.5"
              strokeDasharray={`${60 - i * 10} ${140 + i * 20}`}
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(250, 182, 23, 0.6))',
              }}
            />
          </svg>
        </div>
      ))}

      {/* Center subtle glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30"
          style={{
            boxShadow: 'inset 0 0 20px rgba(250, 182, 23, 0.3)',
            animation: 'subtleGlow 3s ease-in-out infinite',
          }}
        />
      </div>

      {/* Scanning line effect */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(transparent 48%, rgba(250, 182, 23, 0.1) 50%, transparent 52%)',
          animation: 'scan 2s linear infinite',
        }}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes ringRotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes subtleGlow {
            0%, 100% {
              opacity: 0.5;
            }
            50% {
              opacity: 1;
            }
          }

          @keyframes scan {
            0% {
              transform: translateY(-100%) rotate(0deg);
            }
            100% {
              transform: translateY(100%) rotate(0deg);
            }
          }
        `
      }} />
    </div>
  );
}
