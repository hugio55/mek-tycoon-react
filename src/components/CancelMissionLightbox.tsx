"use client";

import { useEffect } from 'react';

interface CancelMissionLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contractFee?: number;
}

export default function CancelMissionLightbox({ isOpen, onClose, onConfirm, contractFee = 0 }: CancelMissionLightboxProps) {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when lightbox is open
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Lightbox */}
      <div
        className="relative bg-black/95 border-2 border-red-500/50 rounded-lg p-8 max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 50px rgba(239, 68, 68, 0.3)',
        }}
      >
        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-red-400 text-center mb-4 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, monospace' }}>
          Abort Mission?
        </h2>

        {/* Message */}
        <p className="text-gray-300 text-center mb-6">
          Are you sure you'd like to abort this contract?
        </p>

        {contractFee > 0 && (
          <div className="bg-red-900/20 border border-red-500/30 rounded p-4 mb-6">
            <p className="text-red-400 text-center font-semibold">
              You will not be refunded the contract fee of {contractFee.toLocaleString()} gold.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500/20 border-2 border-red-500 text-red-400 font-bold py-3 px-6 rounded hover:bg-red-500/30 transition-colors uppercase tracking-wider"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            Abort Contract
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800/50 border-2 border-gray-600 text-gray-300 font-bold py-3 px-6 rounded hover:bg-gray-700/50 transition-colors uppercase tracking-wider"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            Never Mind
          </button>
        </div>
      </div>
    </div>
  );
}