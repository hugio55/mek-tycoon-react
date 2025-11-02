"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export interface EssenceCapChange {
  variationName: string;
  variationType: "head" | "body" | "item";
  currentCap: number;
  newCap: number;
  currentAmount: number;
  lossAmount: number;
}

interface EssenceCapReductionWarningProps {
  isOpen: boolean;
  changes: EssenceCapChange[];
  actionDescription: string; // e.g., "remove Mek from slot", "buff expiring", etc.
  onConfirm: () => void;
  onCancel: () => void;
}

export default function EssenceCapReductionWarning({
  isOpen,
  changes,
  actionDescription,
  onConfirm,
  onCancel,
}: EssenceCapReductionWarningProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Calculate total essence that will be lost
  const totalLoss = changes.reduce((sum, change) => sum + change.lossAmount, 0);
  const hasLoss = totalLoss > 0;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Warning Box */}
      <div
        className="relative w-[600px] max-w-[95vw] bg-gradient-to-br from-red-950/95 to-black/95 border-4 border-red-500/70 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Header */}
        <div className="bg-gradient-to-r from-red-600/80 to-red-800/80 border-b-2 border-red-500/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center bg-red-500/30 border-2 border-red-400 rounded-full">
              <span className="text-3xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-orbitron tracking-wider text-red-400 uppercase">
                Essence Cap Reduction Warning
              </h2>
              <p className="text-red-300/80 text-sm mt-1">
                You are about to: <span className="font-semibold">{actionDescription}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Warning Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {hasLoss ? (
            <>
              <p className="text-red-300 text-lg font-semibold">
                This action will reduce your essence capacity and cause essence loss:
              </p>

              {/* List of affected essences */}
              <div className="space-y-3">
                {changes.map((change, index) => (
                  <div
                    key={index}
                    className="bg-black/60 border-2 border-red-500/40 rounded p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-red-400 font-bold text-lg">
                          {change.variationName}
                        </span>
                        <span className="text-gray-500 text-sm ml-2">
                          ({change.variationType})
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-400 text-xs uppercase tracking-wider">
                          Cap Change
                        </div>
                        <div className="text-yellow-400 font-mono">
                          {change.currentCap.toFixed(1)} → {change.newCap.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-red-500/30">
                      <div>
                        <div className="text-gray-500 text-xs uppercase">Current</div>
                        <div className="text-cyan-400 font-mono text-lg">
                          {change.currentAmount.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase">New Cap</div>
                        <div className="text-yellow-400 font-mono text-lg">
                          {change.newCap.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-red-400 text-xs uppercase font-bold">
                          WILL LOSE
                        </div>
                        <div className="text-red-500 font-mono text-lg font-bold">
                          -{change.lossAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Loss Summary */}
              <div className="bg-red-900/40 border-2 border-red-500 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-red-300 font-bold text-lg uppercase">
                    Total Essence Loss:
                  </span>
                  <span className="text-red-400 font-mono text-2xl font-bold">
                    -{totalLoss.toFixed(2)}
                  </span>
                </div>
                <p className="text-red-300/70 text-sm mt-2">
                  This essence will be permanently lost and cannot be recovered.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-yellow-300 text-lg font-semibold">
                This action will reduce your essence capacity:
              </p>

              <div className="space-y-2">
                {changes.map((change, index) => (
                  <div
                    key={index}
                    className="bg-black/60 border-2 border-yellow-500/40 rounded p-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-yellow-400 font-bold">
                        {change.variationName}
                      </span>
                      <span className="text-gray-500 text-sm ml-2">
                        ({change.variationType})
                      </span>
                    </div>
                    <div className="text-yellow-400 font-mono">
                      Cap: {change.currentCap.toFixed(1)} → {change.newCap.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-green-900/30 border-2 border-green-500/50 rounded-lg p-4">
                <p className="text-green-400 font-semibold">
                  ✓ No essence will be lost (current amounts are below new caps)
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t-2 border-red-500/30 bg-black/60 p-6 flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-700/50 border-2 border-gray-500 rounded text-gray-300 font-bold uppercase tracking-wider hover:bg-gray-600/50 hover:border-gray-400 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 border-2 rounded font-bold uppercase tracking-wider transition-all ${
              hasLoss
                ? "bg-red-600/50 border-red-500 text-red-300 hover:bg-red-600/70 hover:border-red-400"
                : "bg-yellow-600/50 border-yellow-500 text-yellow-300 hover:bg-yellow-600/70 hover:border-yellow-400"
            }`}
          >
            {hasLoss ? "Continue Anyway" : "Proceed"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
