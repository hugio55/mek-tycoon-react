"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface BlockedUserLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  onContactSupport: () => void;
}

export default function BlockedUserLightbox({
  isOpen,
  onClose,
  onContactSupport,
}: BlockedUserLightboxProps) {
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center px-4"
      onClick={onClose}
      style={{ animation: 'fadeIn 300ms ease-out' }}
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
              transform: translate3d(0, 20px, 0);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }
        `
      }} />

      {/* Backdrop - Space Age blur */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md"
        style={{
          animation: 'slideUp 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glass Card */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
          }}
        >
          {/* Content */}
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              {/* Yellow Warning Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-yellow-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-3">
                Unable to Send Message
              </h2>
              <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed">
                We apologize, but this user has blocked you. If you believe this player has wronged you, please{' '}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onContactSupport();
                  }}
                  className="text-cyan-400 underline hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  reach out to support
                </button>
                .
              </p>
            </div>

            {/* Understood Button */}
            <button
              onClick={onClose}
              className="w-full py-3 sm:py-4 text-base font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 touch-manipulation shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
              style={{
                minHeight: '48px',
              }}
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
