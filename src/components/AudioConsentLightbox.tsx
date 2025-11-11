'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AudioConsentLightboxProps {
  onProceed: (audioEnabled: boolean) => void;
  isVisible: boolean;
}

const STORAGE_KEY_AUDIO = 'mek-audio-consent';

export default function AudioConsentLightbox({ onProceed, isVisible }: AudioConsentLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (isVisible && mounted) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible, mounted]);

  const handleToggle = () => {
    const newState = !audioEnabled;
    console.log('[🎵LIGHTBOX] Audio toggle clicked, new state:', newState);
    setAudioEnabled(newState);
  };

  const handleProceed = () => {
    console.log('[🎵LIGHTBOX] Proceed clicked with audioEnabled:', audioEnabled);
    // Store audio preference with timestamp (matches landing page format)
    localStorage.setItem(STORAGE_KEY_AUDIO, JSON.stringify({
      audioEnabled,
      timestamp: Date.now()
    }));
    onProceed(audioEnabled);
  };

  if (!mounted || !isVisible) return null;

  // 3D Power Switch Component
  const PowerSwitch3D = () => (
    <div
      onClick={handleToggle}
      className="relative cursor-pointer group"
    >
      {/* Switch Container */}
      <div className="relative w-32 h-16 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full border-2 border-gray-700 shadow-lg overflow-hidden">
        {/* Switch Track Background */}
        <div className={`absolute inset-0 transition-all duration-500 ${
          audioEnabled
            ? 'bg-gradient-to-r from-green-900/30 to-green-600/30'
            : 'bg-gradient-to-r from-gray-800 to-gray-700'
        }`} />

        {/* Sliding Toggle */}
        <div
          className={`absolute top-1 h-[calc(100%-8px)] w-14 rounded-full shadow-2xl transition-all duration-500 transform ${
            audioEnabled
              ? 'translate-x-[72px] bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/50'
              : 'translate-x-1 bg-gradient-to-br from-gray-600 to-gray-800 shadow-gray-900/50'
          }`}
          style={{
            boxShadow: audioEnabled
              ? '0 0 20px rgba(34, 197, 94, 0.5), inset 0 2px 4px rgba(255,255,255,0.2)'
              : '0 4px 8px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1)'
          }}
        >
          {/* Toggle Highlight */}
          <div className="absolute top-1 left-1 right-1 h-4 bg-white/20 rounded-full" />
        </div>

        {/* ON Label */}
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold transition-all duration-500 ${
          audioEnabled ? 'text-green-400 opacity-100' : 'text-gray-600 opacity-50'
        }`} style={{ fontFamily: 'Orbitron' }}>
          ON
        </div>

        {/* OFF Label */}
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold transition-all duration-500 ${
          audioEnabled ? 'text-gray-600 opacity-50' : 'text-gray-400 opacity-100'
        }`} style={{ fontFamily: 'Orbitron' }}>
          OFF
        </div>
      </div>

      {/* Glow Effect */}
      {audioEnabled && (
        <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl animate-pulse" />
      )}
    </div>
  );

  // Main Lightbox Content
  const lightboxContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={(e) => e.stopPropagation()} />

      {/* Content Container */}
      <div
        className="relative bg-gradient-to-br from-gray-900/90 to-black/90 border-2 border-yellow-500/50 rounded-lg p-8 max-w-md mx-4 shadow-2xl backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 60px rgba(234, 179, 8, 0.3), inset 0 1px 2px rgba(234, 179, 8, 0.2)'
        }}
      >
        {/* Title */}
        <h2
          className="text-2xl font-bold text-yellow-500 text-center mb-3 tracking-wider"
          style={{ fontFamily: 'Orbitron' }}
        >
          WE ENCOURAGE AUDIO
        </h2>

        {/* Subtitle */}
        <p className="text-gray-300 text-sm text-center mb-8">
          For this website
        </p>

        {/* Power Switch */}
        <div className="flex items-center justify-center mb-8">
          <PowerSwitch3D />
        </div>

        {/* Proceed Button */}
        <button
          onClick={handleProceed}
          className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-yellow-500/50"
          style={{ fontFamily: 'Orbitron' }}
        >
          PROCEED
        </button>

        {/* Decorative corner accents */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-yellow-500/30" />
        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-yellow-500/30" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-yellow-500/30" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-yellow-500/30" />
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
