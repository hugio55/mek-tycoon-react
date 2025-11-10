'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AudioConsentLightboxProps {
  onProceed: (audioEnabled: boolean) => void;
  isVisible: boolean;
}

const STORAGE_KEY_LAYOUT = 'mek-audio-consent-layout';

export default function AudioConsentLightbox({ onProceed, isVisible }: AudioConsentLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [layout, setLayout] = useState<'minimal' | 'compact' | 'card' | 'fullscreen' | 'centered'>('minimal');

  useEffect(() => {
    setMounted(true);

    // Load layout preference
    const savedLayout = localStorage.getItem(STORAGE_KEY_LAYOUT);
    if (savedLayout) {
      setLayout(savedLayout as any);
    }

    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isVisible && mounted) {
      document.body.style.overflow = 'hidden';

      // Trigger initial animation
      setTimeout(() => {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 600);
      }, 200);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible, mounted]);

  const handleToggle = () => {
    setAnimating(true);
    setAudioEnabled(!audioEnabled);
    setTimeout(() => setAnimating(false), 600);
  };

  const handleProceed = () => {
    onProceed(audioEnabled);
  };

  if (!mounted || !isVisible) return null;

  // Power button SVG with correct animation
  const PowerButton = () => (
    <button
      onClick={handleToggle}
      className="relative flex items-center justify-center bg-gray-950/50 rounded-lg border border-gray-700 cursor-pointer transition-all duration-300 hover:border-yellow-500/50"
      style={{
        width: layout === 'minimal' ? '120px' : '150px',
        height: layout === 'minimal' ? '120px' : '150px',
      }}
      aria-label={audioEnabled ? 'Disable audio' : 'Enable audio'}
    >
      <svg
        width={layout === 'minimal' ? '60' : '80'}
        height={layout === 'minimal' ? '60' : '80'}
        viewBox="0 0 100 100"
        style={{
          filter: audioEnabled
            ? 'drop-shadow(0 0 16px rgba(251, 191, 36, 0.6))'
            : 'none',
          transition: 'filter 0.6s ease-in-out',
        }}
      >
        {/* Power button circle arc */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke={audioEnabled ? '#fbbf24' : '#4b5563'}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={audioEnabled ? "220" : "165"}
          strokeDashoffset="55"
          style={{
            transform: `rotate(${audioEnabled ? '0' : '-30'}deg)`,
            transformOrigin: '50% 50%',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* Power button line */}
        <line
          x1="50"
          y1={audioEnabled ? "20" : "25"}
          x2="50"
          y2="50"
          stroke={audioEnabled ? '#fbbf24' : '#4b5563'}
          strokeWidth="5"
          strokeLinecap="round"
          style={{
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>

      {/* Status text */}
      <div className="absolute bottom-2 text-center w-full">
        <span
          className={`text-xs font-semibold tracking-wide transition-colors duration-600 ${
            audioEnabled ? 'text-yellow-500' : 'text-gray-600'
          }`}
        >
          {audioEnabled ? 'ON' : 'OFF'}
        </span>
      </div>
    </button>
  );

  // Layout variations
  const layouts = {
    minimal: (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95">
        <div className="flex flex-col items-center gap-6">
          <p className="text-gray-300 text-sm max-w-xs text-center">
            This website uses atmospheric sound. We highly encourage the immersion into the bath of sonic waves.
          </p>
          <PowerButton />
          <button
            onClick={handleProceed}
            className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg transition-all duration-300"
            style={{ fontFamily: 'Orbitron' }}
          >
            PROCEED
          </button>
        </div>
      </div>
    ),

    compact: (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90">
        <div className="bg-gray-900/80 border border-yellow-500/30 rounded-lg p-6 max-w-sm mx-4">
          <p className="text-gray-300 text-sm text-center mb-4">
            This website uses atmospheric sound. We highly encourage the immersion into the bath of sonic waves.
          </p>
          <div className="flex items-center justify-center mb-4">
            <PowerButton />
          </div>
          <button
            onClick={handleProceed}
            className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg transition-all duration-300"
            style={{ fontFamily: 'Orbitron' }}
          >
            PROCEED
          </button>
        </div>
      </div>
    ),

    card: (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85">
        <div className="bg-gray-900 border-2 border-yellow-500/50 rounded-lg p-8 max-w-md mx-4 shadow-2xl">
          <h2 className="text-xl font-bold text-yellow-500 text-center mb-4" style={{ fontFamily: 'Orbitron' }}>
            AUDIO CONSENT
          </h2>
          <p className="text-gray-300 text-sm text-center mb-6">
            This website uses atmospheric sound. We highly encourage the immersion into the bath of sonic waves.
          </p>
          <div className="flex items-center justify-center mb-6">
            <PowerButton />
          </div>
          <button
            onClick={handleProceed}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold text-lg rounded-lg transition-all duration-300"
            style={{ fontFamily: 'Orbitron' }}
          >
            PROCEED
          </button>
        </div>
      </div>
    ),

    fullscreen: (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black">
        <h2 className="text-3xl font-bold text-yellow-500 mb-8" style={{ fontFamily: 'Orbitron' }}>
          AUDIO CONSENT
        </h2>
        <p className="text-gray-300 text-base max-w-md text-center mb-12">
          This website uses atmospheric sound. We highly encourage the immersion into the bath of sonic waves.
        </p>
        <div className="mb-12">
          <PowerButton />
        </div>
        <button
          onClick={handleProceed}
          className="px-12 py-4 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold text-xl rounded-lg transition-all duration-300"
          style={{ fontFamily: 'Orbitron' }}
        >
          PROCEED
        </button>
      </div>
    ),

    centered: (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
        <div className="text-center">
          <p className="text-gray-300 text-sm max-w-sm mx-auto mb-6">
            This website uses atmospheric sound. We highly encourage the immersion into the bath of sonic waves.
          </p>
          <div className="inline-block mb-6">
            <PowerButton />
          </div>
          <div>
            <button
              onClick={handleProceed}
              className="px-10 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg transition-all duration-300"
              style={{ fontFamily: 'Orbitron' }}
            >
              PROCEED
            </button>
          </div>
        </div>
      </div>
    ),
  };

  return createPortal(layouts[layout], document.body);
}
