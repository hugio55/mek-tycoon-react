'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PhaseReadMoreLightboxProps {
  isVisible: boolean;
  onClose: () => void;
  phaseTitle: string;
  fullDescription: string;
}

export default function PhaseReadMoreLightbox({
  isVisible,
  onClose,
  phaseTitle,
  fullDescription
}: PhaseReadMoreLightboxProps) {
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
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
        className="relative w-full max-w-md"
        style={{
          animation: 'slideUp 800ms cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform, opacity',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glass Card */}
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
            onClick={onClose}
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
                {phaseTitle}
              </h2>
            </div>

            {/* Full Description */}
            <div className="text-sm md:text-base text-gray-300/60 font-light tracking-wide leading-relaxed space-y-4">
              {fullDescription.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
