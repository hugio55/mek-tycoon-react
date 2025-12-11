"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmationLightboxProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmationLightbox({
  isOpen,
  onConfirm,
  onCancel,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel"
}: ConfirmationLightboxProps) {
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

  // Convert title from ALL CAPS to Title Case for Space Age style
  const formatTitle = (text: string) => {
    // If it's all caps, convert to title case
    if (text === text.toUpperCase()) {
      return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return text;
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center px-4"
      onClick={onCancel}
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
              <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-3">
                {formatTitle(title)}
              </h2>
              <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed">
                {message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 sm:py-4 text-base font-medium tracking-wide rounded-xl transition-all duration-300 touch-manipulation active:scale-[0.98] hover:bg-white/15 hover:border-white/25"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }}
              >
                {cancelText}
              </button>

              <button
                onClick={onConfirm}
                className="flex-1 py-3 sm:py-4 text-base font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 touch-manipulation shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
                style={{
                  minHeight: '48px',
                }}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
