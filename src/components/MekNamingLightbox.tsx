"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ConfirmationLightbox from "./ConfirmationLightbox";

interface MekNamingLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  mekAssetId: string;
  mekImage?: string;
  currentName?: string | null;
  onSuccess?: () => void;
}

export default function MekNamingLightbox({
  isOpen,
  onClose,
  walletAddress,
  mekAssetId,
  mekImage,
  currentName,
  onSuccess
}: MekNamingLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [mekName, setMekName] = useState(currentName || "");
  const [debouncedMekName, setDebouncedMekName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameWasSet, setNameWasSet] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Phase II: Use meks.ts instead of goldMining.ts
  const setMekNameMutation = useMutation(api.meks.setMekName);

  // Debounce the name check - only check after 625ms pause in typing
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      setDebouncedMekName(mekName);
      setIsTyping(false);
    }, 625);

    return () => clearTimeout(timer);
  }, [mekName]);

  // Check name availability in real-time (Phase II: meks.ts)
  const checkAvailability = useQuery(
    api.meks.checkMekNameAvailability,
    debouncedMekName.trim().length >= 1 ? {
      mekName: debouncedMekName.trim(),
      currentMekAssetId: mekAssetId
    } : 'skip'
  );

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
      setDebouncedMekName("");
      setError(null);
      setIsSubmitting(false);
      setNameWasSet(false);
      setIsTyping(false);
    }
  }, [isOpen, currentName]);

  // Clear error when name changes
  useEffect(() => {
    if (error && mekName.trim().length >= 1) {
      setError(null);
    }
  }, [mekName, error]);

  const handleSubmit = async () => {
    setError(null);

    // Client-side validation
    const trimmedName = mekName.trim();

    if (!trimmedName) {
      setError("Employee name cannot be empty");
      return;
    }

    if (trimmedName.length > 20) {
      setError("Employee name must be 20 characters or less");
      return;
    }

    const allowedCharsRegex = /^[a-zA-Z0-9\s\-'.]+$/;
    if (!allowedCharsRegex.test(trimmedName)) {
      setError("Name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods");
      return;
    }

    // Check availability one more time before submitting
    if (checkAvailability && !checkAvailability.available) {
      setError(checkAvailability.error || "Name is not available");
      return;
    }

    setIsSubmitting(true);

    try {
      // Phase II: Use stakeAddress instead of walletAddress
      const result = await setMekNameMutation({
        stakeAddress: walletAddress,
        mekAssetId,
        newName: trimmedName
      });

      if (result.success) {
        setNameWasSet(true);
        if (onSuccess) {
          onSuccess();
        }
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
      handleClose();
    }
  };

  const handleClose = () => {
    // If name was set, just close normally
    if (nameWasSet) {
      onClose();
      return;
    }

    // If no name was set, show confirmation lightbox
    setShowConfirmation(true);
  };

  const handleConfirmClose = () => {
    setShowConfirmation(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmation(false);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
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
              NAME YOUR EMPLOYEE
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
                EMPLOYEE NAME
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

              {/* Real-time Availability Feedback */}
              {mekName.trim().length >= 1 && !error && (
                <div className="mt-2 text-sm">
                  {isTyping ? (
                    <div className="text-yellow-400 flex items-center gap-2">
                      <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                      Checking availability...
                    </div>
                  ) : checkAvailability === undefined ? (
                    <div className="text-yellow-400 flex items-center gap-2">
                      <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                      Checking availability...
                    </div>
                  ) : checkAvailability.available ? (
                    <div className="text-green-400">
                      ✓ "{mekName.trim()}" is available
                    </div>
                  ) : (
                    <div className="text-red-400">
                      ✗ {checkAvailability.error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Allowed Characters Info */}
            <div className="text-xs text-gray-500 bg-black/40 border border-gray-700 rounded p-3">
              <p className="mb-1 text-gray-400 font-semibold">Allowed characters:</p>
              <p>Letters, numbers, spaces, hyphens (-), apostrophes ('), and periods (.)</p>
              <p className="mt-2 text-yellow-500/70">Names must be unique across the universe of MekTycoon</p>
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
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 mek-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !mekName.trim() ||
                  (checkAvailability && !checkAvailability.available) ||
                  isTyping ||
                  checkAvailability === undefined
                }
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

  return (
    <>
      {createPortal(modalContent, document.body)}
      <ConfirmationLightbox
        isOpen={showConfirmation}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        title="WARNING"
        message="You have not named your new employee. It will not be slotted. Are you sure?"
        confirmText="Close Anyway"
        cancelText="Go Back"
      />
    </>
  );
}
