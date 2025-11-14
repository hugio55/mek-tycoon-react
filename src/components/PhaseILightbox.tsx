'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PhaseILightboxProps {
  isVisible: boolean;
  onClose: () => void;
  phaseDescriptionFont?: string;
  phaseDescriptionFontSize?: number;
  lightboxContent?: string;
  textFont?: string;
  textFontSize?: number;
  textColor?: string;
  videoScale?: number;
  videoPositionX?: number;
  videoPositionY?: number;
  backdropBlur?: number;
}

export default function PhaseILightbox({
  isVisible,
  onClose,
  phaseDescriptionFont = 'Arial',
  phaseDescriptionFontSize = 16,
  lightboxContent = '',
  textFont = 'Arial',
  textFontSize = 16,
  textColor = 'text-white/80',
  videoScale = 100,
  videoPositionX = 0,
  videoPositionY = 0,
  backdropBlur = 8
}: PhaseILightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [savedScrollY, setSavedScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isVisible && mounted) {
      const scrollY = window.scrollY;
      setSavedScrollY(scrollY);
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
      window.scrollTo(0, savedScrollY);
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
    };
  }, [isVisible, mounted, savedScrollY]);

  const handleClose = () => {
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!mounted || !isVisible) return null;

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 sm:px-6 md:px-8"
      onClick={handleBackdropClick}
      style={{
        animation: 'fadeIn 300ms ease-out',
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translate3d(0, 30px, 0);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }
        `
      }} />

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45"
        style={{
          backdropFilter: `blur(${backdropBlur}px)`,
          WebkitBackdropFilter: `blur(${backdropBlur}px)`,
        }}
        onClick={handleBackdropClick}
      />

      {/* Lightbox Card */}
      <div
        className="relative w-full max-w-6xl"
        style={{
          animation: 'slideUp 800ms cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform, opacity',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glass Card - matching BetaSignupLightbox style */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Close Button - Top Right */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white/80 transition-colors z-10 touch-manipulation"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Debug Toggle Button */}
          <button
            onClick={() => setShowDebugControls(!showDebugControls)}
            className="absolute top-4 left-4 text-white/50 hover:text-white/80 transition-colors z-10 touch-manipulation text-xs"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="Toggle Debug Controls"
          >
            {showDebugControls ? '⚙️' : '🔧'}
          </button>

          {/* Content */}
          <div className="p-6 sm:p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-wide mb-4">
                Phase I: Foundation
              </h2>
              <p className="text-lg sm:text-xl text-white/70 font-light tracking-wide mb-2">
                The Beginning
              </p>
            </div>

            {/* Two-column layout (text left, video right) on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Left Column - Text Content */}
              <div
                className={`leading-relaxed space-y-4 ${textColor}`}
                style={{
                  fontFamily: textFont,
                  fontSize: `${textFontSize}px`,
                }}
              >
                {lightboxContent.split('\n').map((paragraph, index) => {
                  // Handle bullet points
                  if (paragraph.trim().startsWith('•')) {
                    return (
                      <div key={index} className="pl-4">
                        <div className="flex gap-2">
                          <span>•</span>
                          <span>{paragraph.trim().substring(1).trim()}</span>
                        </div>
                      </div>
                    );
                  }
                  // Handle empty lines
                  if (paragraph.trim() === '') {
                    return <div key={index} className="h-2" />;
                  }
                  // Handle regular paragraphs
                  return <p key={index}>{paragraph}</p>;
                })}
              </div>

              {/* Right Column - Video */}
              <div className="flex items-center justify-center">
                <div className="w-full overflow-hidden rounded-lg">
                  <video
                    src="/Phase 1 video/p1 vid webm 15q.webm"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto"
                    style={{
                      transform: `scale(${videoScale / 100}) translate(${videoPositionX}px, ${videoPositionY}px)`,
                      transition: 'transform 0.2s ease-out',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Debug Controls Card */}
            {showDebugControls && (
              <div className="mt-8 p-6 rounded-lg border border-yellow-500/30 bg-black/40">
                <h3 className="text-yellow-400 text-lg font-semibold mb-4">Debug Controls</h3>

                <div className="space-y-4">
                  {/* Video Scale */}
                  <div>
                    <label className="text-white/70 text-sm block mb-2">
                      Video Scale: {videoScale.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.05"
                      value={videoScale}
                      onChange={(e) => setVideoScale(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Video Translate X */}
                  <div>
                    <label className="text-white/70 text-sm block mb-2">
                      Video X Position: {videoTranslateX}px
                    </label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      step="5"
                      value={videoTranslateX}
                      onChange={(e) => setVideoTranslateX(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Video Translate Y */}
                  <div>
                    <label className="text-white/70 text-sm block mb-2">
                      Video Y Position: {videoTranslateY}px
                    </label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      step="5"
                      value={videoTranslateY}
                      onChange={(e) => setVideoTranslateY(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Backdrop Blur */}
                  <div>
                    <label className="text-white/70 text-sm block mb-2">
                      Backdrop Blur: {backdropBlur}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={backdropBlur}
                      onChange={(e) => setBackdropBlur(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Typography Font */}
                  <div>
                    <label className="text-white/70 text-sm block mb-2">
                      Font Family
                    </label>
                    <select
                      value={debugFont}
                      onChange={(e) => setDebugFont(e.target.value)}
                      className="w-full bg-black/60 text-white border border-white/20 rounded px-3 py-2"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Inter">Inter</option>
                      <option value="Orbitron">Orbitron</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>

                  {/* Typography Size */}
                  <div>
                    <label className="text-white/70 text-sm block mb-2">
                      Font Size: {debugFontSize}px
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="24"
                      step="1"
                      value={debugFontSize}
                      onChange={(e) => setDebugFontSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={() => {
                      setVideoScale(1);
                      setVideoTranslateX(0);
                      setVideoTranslateY(0);
                      setBackdropBlur(8);
                      setDebugFont(phaseDescriptionFont);
                      setDebugFontSize(phaseDescriptionFontSize);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
