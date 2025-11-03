"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import MekNamingLightbox from "./MekNamingLightbox";
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
  const [showRenameInterface, setShowRenameInterface] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  const unslotMekMutation = useMutation(api.essence.unslotMek);

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

            {/* Name Display with Edit Button */}
            <div className="flex items-center justify-center gap-3">
              <div className="mek-value-primary text-3xl">
                {mekData.customName || "UNNAMED"}
              </div>
              <button
                onClick={() => setShowRenameInterface(true)}
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

            {/* Asset ID Info */}
            <div className="text-center text-xs text-gray-500">
              Slot {slotNumber} • Asset ID: {mekData.assetId.slice(0, 8)}...
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

      {/* Rename Interface */}
      {showRenameInterface && (
        <MekNamingLightbox
          isOpen={showRenameInterface}
          onClose={() => setShowRenameInterface(false)}
          walletAddress={walletAddress}
          mekAssetId={mekData.assetId}
          mekImage={imagePath}
          currentName={mekData.customName}
          onSuccess={() => {
            setShowRenameInterface(false);
            // Parent component should refetch data
          }}
        />
      )}

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
