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

  // [🔍MEKNAME] Track prop changes
  useEffect(() => {
    console.log('[🔍MEKNAME] Component received props:', {
      assetId: mekData.assetId,
      customName: mekData.customName,
      assetName: mekData.assetName,
      displayName: displayName,
      timestamp: new Date().toISOString()
    });
  }, [mekData.customName, mekData.assetId, displayName]);

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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-auto p-4" onClick={onClose}>
      {/* Backdrop - industrial dark with blur */}
      <div className="fixed inset-0 bg-black/40" style={{ backdropFilter: 'blur(2px)' }} onClick={onClose} />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="bg-black/20 backdrop-blur-md border-2 border-yellow-500/50 rounded-lg overflow-hidden shadow-2xl"
          style={{
            boxShadow: '0 0 40px rgba(250, 182, 23, 0.2)'
          }}
        >
          {/* Industrial Header with hazard stripes */}
          <div className="relative overflow-hidden bg-gradient-to-b from-black via-black to-transparent">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #fab617 0, #fab617 10px, transparent 10px, transparent 20px)',
              }} />
            </div>
            <div className="px-6 py-4">
              <h2 className="text-3xl font-bold font-orbitron tracking-wider text-center">
                <span className="text-yellow-400">MEK</span>{" "}
                <span className="text-gray-400">MANAGEMENT</span>
              </h2>
            </div>
          </div>

          {/* Content with crosshatch pattern overlay */}
          <div className="relative p-6">
            {/* Crosshatch pattern background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255, 255, 255, 0.01) 35px, rgba(255, 255, 255, 0.01) 70px),
                                  repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(255, 255, 255, 0.01) 35px, rgba(255, 255, 255, 0.01) 70px)`
              }}
            />

            {/* Mek Image */}
            <div className="relative mb-6 p-4 bg-black/40 border-2 border-yellow-500/30 rounded-lg" style={{
              background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255, 255, 255, 0.02) 10px, rgba(255, 255, 255, 0.02) 20px)',
            }}>
              <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(0deg, rgba(250, 182, 23, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(250, 182, 23, 0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
              <img
                src={imagePath}
                alt={mekData.customName || mekData.assetName || "Mek"}
                className="relative z-10 w-full h-auto max-w-[384px] mx-auto"
                onError={(e) => {
                  e.currentTarget.src = `/mek-images/150px/${cleanSourceKey}.webp`;
                }}
              />
            </div>

            {/* Name Display/Edit Section */}
            {!isEditingName ? (
              // View Mode
              <div className="text-center mb-6">
                <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-2 font-bold">Employee Name</div>
                <div className="text-yellow-400 text-2xl font-bold mb-3 font-orbitron tracking-wider" style={{
                  textShadow: '0 0 15px rgba(250, 182, 23, 0.4)'
                }}>
                  {displayName || mekData.customName || "UNNAMED"}
                </div>
                <button
                  onClick={handleStartEdit}
                  className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-bold uppercase tracking-wider rounded hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all"
                >
                  Edit Name
                </button>
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-3 font-bold block text-center">
                    EMPLOYEE NAME
                  </label>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    maxLength={20}
                    placeholder="Enter a name (1-20 characters)"
                    className="w-full px-4 py-3 bg-black/80 border-2 border-yellow-500/30 rounded text-yellow-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors text-center"
                    style={{
                      backdropFilter: 'blur(10px)'
                    }}
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-gray-400 text-center font-mono">
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
                  <div className="bg-red-900/40 backdrop-blur-sm border-2 border-red-500/50 rounded p-3">
                    <p className="text-red-400 text-sm text-center font-medium">{error}</p>
                  </div>
                )}

                {/* Save/Cancel Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-gray-800/60 border-2 border-gray-600/50 rounded text-gray-300 text-sm font-bold uppercase tracking-wider hover:bg-gray-700/60 hover:border-gray-500 transition-all disabled:opacity-50"
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
                    className="flex-1 px-4 py-3 bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-400 text-sm font-bold uppercase tracking-wider rounded hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {/* Slot Display */}
            <div className="text-center mb-6">
              <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-2 font-bold">Deployed To</div>
              <div className="inline-block px-6 py-2 bg-yellow-500/10 border-2 border-yellow-500/40 rounded">
                <div className="text-yellow-400 text-xl font-bold font-orbitron tracking-wider" style={{
                  textShadow: '0 0 15px rgba(250, 182, 23, 0.4)'
                }}>
                  SLOT {slotNumber}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSwap}
                className="flex-1 px-6 py-3 bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-400 text-sm font-bold uppercase tracking-wider rounded hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all"
              >
                Swap
              </button>
              <button
                onClick={() => setShowTerminateConfirm(true)}
                className="flex-1 px-6 py-3 bg-red-500/10 border-2 border-red-500/30 text-red-400 text-sm font-bold uppercase tracking-wider rounded hover:bg-red-500/20 hover:border-red-500/50 transition-all"
              >
                Terminate
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 flex items-center justify-center hover:scale-110 transition-transform"
            >
              <span className="text-yellow-400 text-3xl font-bold" style={{ textShadow: '0 0 10px rgba(250, 182, 23, 0.5)' }}>×</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terminate Confirmation */}
      {showTerminateConfirm && (
        <ConfirmationLightbox
          isOpen={showTerminateConfirm}
          title="TERMINATE MEK"
          message={`Are you sure you want to terminate ${displayName || mekData.customName || "this Mek"}? This will empty Slot ${slotNumber}.`}
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
