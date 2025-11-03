"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import ConfirmationLightbox from "./ConfirmationLightbox";

interface MekManagementLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  slotNumber: number;
  mekData: {
    assetId: string;
    sourceKey: string;
    customName?: string | null;
    assetName?: string;
  };
  onSwapClick: () => void;
}

export default function MekManagementLightbox({
  isOpen,
  onClose,
  walletAddress,
  slotNumber,
  mekData,
  onSwapClick
}: MekManagementLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  // Inline rename states
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [debouncedTempName, setDebouncedTempName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local display name state (overrides prop after successful rename)
  const [displayName, setDisplayName] = useState<string | null>(null);

  const unslotMekMutation = useMutation(api.essence.unslotMek);
  const setMekNameMutation = useMutation(api.goldMining.setMekName);

  // Debounce the name check - only check after 625ms pause in typing
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      setDebouncedTempName(tempName);
      setIsTyping(false);
    }, 625);

    return () => clearTimeout(timer);
  }, [tempName]);

  // Check name availability in real-time
  const checkAvailability = useQuery(
    api.goldMining.checkMekNameAvailability,
    debouncedTempName.trim().length >= 1 ? {
      mekName: debouncedTempName.trim(),
      currentMekAssetId: mekData.assetId
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

  // Clear error when name changes
  useEffect(() => {
    if (error && tempName.trim().length >= 1) {
      setError(null);
    }
  }, [tempName, error]);

  // Clean the source key for image path
  const cleanSourceKey = mekData.sourceKey
    .replace(/-[A-Z]$/, '')  // Remove suffix like -B, -C
    .toLowerCase();           // Convert to lowercase
  const imagePath = `/mek-images/500px/${cleanSourceKey}.webp`;

  const handleTerminate = async () => {
    try {
      setIsTerminating(true);
      await unslotMekMutation({
        walletAddress,
        slotNumber
      });
      setShowTerminateConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error terminating Mek:', error);
    } finally {
      setIsTerminating(false);
    }
  };

  const handleSwap = () => {
    onClose();
    onSwapClick();
  };

  const handleStartEdit = () => {
    setTempName(mekData.customName || "");
    setIsEditingName(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setTempName("");
    setError(null);
  };

  const handleSaveEdit = async () => {
    setError(null);

    // Client-side validation
    const trimmedName = tempName.trim();

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
      const result = await setMekNameMutation({
        walletAddress,
        mekAssetId: mekData.assetId,
        newName: trimmedName
      });

      if (result.success) {
        // Optimistically update display name immediately
        setDisplayName(trimmedName);
        setIsEditingName(false);
        setTempName("");
        console.log('[🎯RENAME] Name saved successfully, updated display to:', trimmedName);
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
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mek-card-industrial mek-border-sharp-gold overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-yellow-500/30 bg-black/40">
            <h2 className="mek-text-industrial text-xl text-yellow-400">
              MEK MANAGEMENT
            </h2>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Large Mek Image */}
            <div className="flex justify-center">
              <div className="relative w-96 h-96">
                <img
                  src={imagePath}
                  alt={mekData.customName || mekData.assetName || "Mek"}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = `/mek-images/150px/${cleanSourceKey}.webp`;
                  }}
                />
              </div>
            </div>

            {/* Name Display/Edit Section */}
            {!isEditingName ? (
              // View Mode
              <div className="flex items-center justify-center gap-3">
                <div className="mek-value-primary text-3xl">
                  {displayName || mekData.customName || "UNNAMED"}
                </div>
                <button
                  onClick={handleStartEdit}
                  className="p-2 rounded-lg bg-black/50 border border-yellow-500/30 hover:border-yellow-400 hover:bg-yellow-500/10 transition-all"
                  title="Rename Mek"
                >
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-3">
                <div>
                  <label className="mek-label-uppercase mb-2 text-gray-400 block text-center">
                    EMPLOYEE NAME
                  </label>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    maxLength={20}
                    placeholder="Enter a name (1-20 characters)"
                    className="w-full px-4 py-3 bg-black/60 border-2 border-yellow-500/30 rounded text-yellow-100 placeholder-gray-600 focus:outline-none focus:border-yellow-500 text-center"
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-gray-500 text-center">
                    {tempName.length}/20 characters
                  </p>

                  {/* Real-time Availability Feedback */}
                  {tempName.trim().length >= 1 && !error && (
                    <div className="mt-2 text-sm text-center">
                      {isTyping ? (
                        <div className="text-yellow-400 flex items-center justify-center gap-2">
                          <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                          Checking availability...
                        </div>
                      ) : checkAvailability === undefined ? (
                        <div className="text-yellow-400 flex items-center justify-center gap-2">
                          <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                          Checking availability...
                        </div>
                      ) : checkAvailability.available ? (
                        <div className="text-green-400">
                          ✓ "{tempName.trim()}" is available
                        </div>
                      ) : (
                        <div className="text-red-400">
                          ✗ {checkAvailability.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-900/30 border border-red-500/50 rounded p-3">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Save/Cancel Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded text-gray-300 hover:bg-gray-700/50 hover:border-gray-500 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={
                      isSubmitting ||
                      !tempName.trim() ||
                      (checkAvailability && !checkAvailability.available) ||
                      isTyping ||
                      checkAvailability === undefined
                    }
                    className="flex-1 mek-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {/* Slot Display */}
            <div className="text-center">
              <div className="text-base text-yellow-400 font-bold uppercase tracking-wider">
                SLOT {slotNumber}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSwap}
                className="flex-1 mek-button-secondary"
              >
                <span className="text-lg">🔄</span> SWAP MEK
              </button>
              <button
                onClick={() => setShowTerminateConfirm(true)}
                className="flex-1 px-6 py-3 bg-red-900/30 border-2 border-red-500/50 rounded-lg text-red-400 font-bold uppercase tracking-wider hover:bg-red-900/50 hover:border-red-400 transition-all"
              >
                <span className="text-lg">⚠️</span> TERMINATE
              </button>
            </div>

            {/* Close Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={onClose}
                className="px-8 py-2 text-sm text-gray-400 hover:text-yellow-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Terminate Confirmation */}
      {showTerminateConfirm && (
        <ConfirmationLightbox
          isOpen={showTerminateConfirm}
          title="TERMINATE MEK"
          message={`Are you sure you want to terminate ${mekData.customName || "this Mek"}? This will empty Slot ${slotNumber}.`}
          confirmText={isTerminating ? "Terminating..." : "Terminate"}
          cancelText="Cancel"
          onConfirm={handleTerminate}
          onCancel={() => setShowTerminateConfirm(false)}
        />
      )}
    </div>
  );

  if (!isOpen || !mounted) return null;

  return createPortal(modalContent, document.body);
}
