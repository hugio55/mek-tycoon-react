"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface NoMekanismsLightboxProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NoMekanismsLightbox({ isOpen, onClose }: NoMekanismsLightboxProps) {
  const [mounted, setMounted] = useState(false);

  // Mount portal and lock body scroll
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Industrial Frame */}
        <div className="relative bg-black/90 border-2 border-yellow-500/50 rounded-sm shadow-2xl">
          {/* Yellow corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-500" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-500" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500" />

          {/* Content */}
          <div className="p-8">
            {/* Warning Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-yellow-500 bg-yellow-500/10 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 border-4 border-yellow-500/30 animate-pulse" />
              </div>
            </div>

            {/* Title */}
            <h2
              className="text-2xl font-bold text-yellow-500 text-center mb-4 uppercase tracking-wider"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                textShadow: '0 0 20px rgba(251, 191, 36, 0.5)'
              }}
            >
              No Mekanisms Detected
            </h2>

            {/* Message */}
            <p className="text-gray-300 text-center mb-6 leading-relaxed">
              You need at least <span className="text-white font-bold">1 Mekanism</span> in order to initiate your corporation.
            </p>

            {/* Aftermarket Link Button */}
            <div className="flex flex-col items-center gap-3">
              <a
                href="https://www.jpg.store/collection/overexposedmekanism"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all rounded font-mono uppercase tracking-wider text-xs sm:text-sm"
              >
                Aftermarket Mekanisms →
              </a>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-300 transition-colors text-sm uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>

          {/* Hazard stripes decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-2 overflow-hidden opacity-30">
            <div
              className="h-full"
              style={{
                background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #fbbf24 10px, #fbbf24 20px)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen || !mounted) return null;

  return createPortal(modalContent, document.body);
}
