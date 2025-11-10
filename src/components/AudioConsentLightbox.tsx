'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AudioConsentLightboxProps {
  onProceed: (audioEnabled: boolean) => void;
  isVisible: boolean;
}

export default function AudioConsentLightbox({ onProceed, isVisible }: AudioConsentLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isVisible && mounted) {
      // Lock body scroll when lightbox is open
      document.body.style.overflow = 'hidden';

      // Trigger initial "turning on" animation after a short delay
      setTimeout(() => {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 800);
      }, 300);
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
    setTimeout(() => setAnimating(false), 800);
  };

  const handleProceed = () => {
    onProceed(audioEnabled);
  };

  if (!mounted || !isVisible) return null;

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Lightbox Card */}
      <div className="relative w-full max-w-md mx-4 bg-gray-900 border-2 border-yellow-500/50 rounded-lg p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-yellow-500 tracking-wider mb-3" style={{ fontFamily: 'Orbitron' }}>
            POWER SWITCH TOGGLE
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            This website uses atmospheric sound. We highly encourage the immersion into the bath of sonic waves.
          </p>
        </div>

        {/* Power Switch Container */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative mb-2">
            <button
              onClick={handleToggle}
              className="relative w-48 h-48 flex items-center justify-center bg-gray-950 rounded-lg border border-gray-700 cursor-pointer transition-all duration-300 hover:border-yellow-500/50"
              aria-label={audioEnabled ? 'Disable audio' : 'Enable audio'}
            >
              {/* Power Icon */}
              <svg
                width="80"
                height="80"
                viewBox="0 0 100 100"
                className={`transition-all duration-800 ${
                  animating ? 'animate-pulse' : ''
                }`}
                style={{
                  filter: audioEnabled
                    ? 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.8))'
                    : 'drop-shadow(0 0 0px rgba(251, 191, 36, 0))',
                  transition: 'filter 0.8s ease-in-out',
                }}
              >
                {/* Power button circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke={audioEnabled ? '#fbbf24' : '#6b7280'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="165 220"
                  strokeDashoffset="55"
                  className="transition-all duration-800"
                  style={{
                    transform: audioEnabled ? 'rotate(0deg)' : 'rotate(-30deg)',
                    transformOrigin: 'center',
                  }}
                />
                {/* Power button line */}
                <line
                  x1="50"
                  y1="25"
                  x2="50"
                  y2="50"
                  stroke={audioEnabled ? '#fbbf24' : '#6b7280'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="transition-all duration-800"
                />
              </svg>

              {/* Click to Toggle Text */}
              <div className="absolute top-4 left-0 right-0 text-center text-xs text-gray-500 tracking-wider">
                CLICK TO TOGGLE
              </div>

              {/* Status Text */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span
                  className={`text-sm font-semibold tracking-wide transition-colors duration-800 ${
                    audioEnabled ? 'text-yellow-500' : 'text-gray-500'
                  }`}
                >
                  Status: {audioEnabled ? 'ON' : 'OFF'} {audioEnabled ? '' : '(Dim)'}
                </span>
              </div>
            </button>
          </div>

          {/* Helper Text */}
          <p className="text-xs text-gray-400 text-center mt-2">
            {audioEnabled ? 'Click to disable sound' : 'Click to enable sound'}
          </p>
        </div>

        {/* Proceed Button */}
        <button
          onClick={handleProceed}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold text-lg rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/50"
          style={{ fontFamily: 'Orbitron' }}
        >
          PROCEED
        </button>

        {/* Source Attribution */}
        <div className="mt-4 text-center text-[10px] text-gray-600">
          <p>Source: External HTML/CSS/SVG</p>
          <p>Transformed: React/TypeScript/Tailwind v3</p>
          <p>Features: Click animation, line bounce, circle rotation (partial→full), radial glow when ON</p>
          <p>Colors: White → Gold (#fbbf24)</p>
        </div>
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
