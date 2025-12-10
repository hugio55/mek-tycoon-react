"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DisconnectConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DisconnectConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
}: DisconnectConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsProcessing(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    // Brief delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 400));
    onConfirm();
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

      {/* Backdrop */}
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
            {isProcessing ? (
              // Processing state
              <div className="text-center py-4">
                <div className="mb-4">
                  <svg className="animate-spin h-10 w-10 mx-auto text-yellow-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <p className="text-white/60 font-light">Disconnecting...</p>
              </div>
            ) : (
              // Confirmation state
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-3">
                    Disconnect Wallet
                  </h2>
                  <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed">
                    This will log you out and you'll need to reconnect your wallet to access Mek Tycoon again.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    className="flex-1 py-3 sm:py-4 text-base font-medium tracking-wide rounded-xl transition-all duration-300 touch-manipulation active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-3 sm:py-4 text-base font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 touch-manipulation shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
                    style={{
                      minHeight: '48px',
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
