"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface MekNamingLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  mekAssetId: string;
  mekImage?: string;
  currentName?: string | null;
}

export default function MekNamingLightbox({
  isOpen,
  onClose,
  walletAddress,
  mekAssetId,
  mekImage,
  currentName
}: MekNamingLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [mekName, setMekName] = useState(currentName || "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setMekNameMutation = useMutation(api.goldMining.setMekName);

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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMekName(currentName || "");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, currentName]);

  const handleSubmit = async () => {
    setError(null);

    // Client-side validation
    const trimmedName = mekName.trim();

    if (!trimmedName) {
      setError("Mek name cannot be empty");
      return;
    }

    if (trimmedName.length > 20) {
      setError("Mek name must be 20 characters or less");
      return;
    }

    const allowedCharsRegex = /^[a-zA-Z0-9\s\-'.]+$/;
    if (!allowedCharsRegex.test(trimmedName)) {
      setError("Name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await setMekNameMutation({
        walletAddress,
        mekAssetId,
        newName: trimmedName
      });

      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to set Mek name");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mek-card-industrial mek-border-sharp-gold overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-yellow-500/30 bg-black/40">
            <h2 className="mek-text-industrial text-xl text-yellow-400">
              NAME YOUR MEK
            </h2>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Mek Preview Image */}
            {mekImage && (
              <div className="flex justify-center mb-4">
                <img
                  src={mekImage}
                  alt="Mek"
                  className="w-80 h-80 object-contain border-2 border-yellow-500/30 rounded-lg bg-black/40"
                />
              </div>
            )}

            {/* Input Field */}
            <div>
              <label className="mek-label-uppercase mb-2 text-gray-400">
                MEK NAME
              </label>
              <input
                type="text"
                value={mekName}
                onChange={(e) => setMekName(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={20}
                placeholder="Enter a name (1-20 characters)"
                className="w-full px-4 py-3 bg-black/60 border-2 border-yellow-500/30 rounded text-yellow-100 placeholder-gray-600 focus:outline-none focus:border-yellow-500"
                disabled={isSubmitting}
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                {mekName.length}/20 characters
              </p>
            </div>

            {/* Allowed Characters Info */}
            <div className="text-xs text-gray-500 bg-black/40 border border-gray-700 rounded p-3">
              <p className="mb-1 text-gray-400 font-semibold">Allowed characters:</p>
              <p>Letters, numbers, spaces, hyphens (-), apostrophes ('), and periods (.)</p>
              <p className="mt-2 text-yellow-500/70">Names must be unique globally across all players</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 mek-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !mekName.trim()}
                className="flex-1 mek-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : currentName ? 'Update Name' : 'Set Name'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen || !mounted) return null;

  return createPortal(modalContent, document.body);
}
