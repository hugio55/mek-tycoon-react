'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PhaseILightboxProps {
  isVisible: boolean;
  onClose: () => void;
  phaseDescriptionFont?: string;
  phaseDescriptionFontSize?: number;
}

export default function PhaseILightbox({
  isVisible,
  onClose,
  phaseDescriptionFont = 'Arial',
  phaseDescriptionFontSize = 16
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
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={handleBackdropClick}
      />

      {/* Lightbox Card */}
      <div
        className="relative w-full max-w-2xl"
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

            {/* Description Content */}
            <div
              className="text-white/80 leading-relaxed space-y-4"
              style={{
                fontFamily: phaseDescriptionFont,
                fontSize: `${phaseDescriptionFontSize}px`,
              }}
            >
              <p>
                Project inception and initial concept development. The vision for Mek Tycoon begins to take shape.
              </p>

              <p>
                In this foundational phase, we established the core vision and mechanics that would define the Mek Tycoon universe. Our team carefully crafted the initial designs, gameplay concepts, and technical architecture that would serve as the bedrock for all future development.
              </p>

              <p>
                Key achievements during Phase I included:
              </p>

              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Conceptualization of the Mek NFT collection and variation system</li>
                <li>Design of the core gameplay loop and resource management mechanics</li>
                <li>Development of the initial art style and visual identity</li>
                <li>Technical planning for blockchain integration on Cardano</li>
                <li>Formation of the core development team and community foundation</li>
              </ul>

              <p>
                This phase laid the groundwork for everything that followed, establishing the principles of strategic depth, artistic excellence, and community engagement that define Mek Tycoon today.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
