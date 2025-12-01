'use client';

/**
 * Tenure Progress Integration Example
 *
 * This component demonstrates how to integrate the tenure progress bar
 * into the slot overlay editor using the useTenureProgress hook.
 *
 * Key Features:
 * - Real-time tenure accumulation (1 tenure/second base rate)
 * - Smooth visual progress (60fps via requestAnimationFrame)
 * - Handles buffs dynamically (rate multipliers)
 * - Syncs across tabs (Convex reactive queries)
 * - Resilient to browser close/reopen
 * - Freezes/resumes on unslot/reslot
 */

import React from 'react';
import TenureProgressBar from '@/components/ui/TenureProgressBar';
import { useTenureProgress, formatTimeToLevelUp } from '@/hooks/useTenureProgress';
import { useMutation } from 'convex/react';
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface TenureProgressExampleProps {
  slotId: Id<"slots">;
  mekName?: string;
  showDetailedInfo?: boolean;
}

export default function TenureProgressExample({
  slotId,
  mekName = "Unknown Mek",
  showDetailedInfo = false
}: TenureProgressExampleProps) {
  // Real-time tenure progress hook
  const tenureProgress = useTenureProgress({ slotId });

  // Mutations
  const levelUpMek = useMutation(api.mekLeveling.levelUp);
  const applyTenureBuff = useMutation(api.slots.applyTenureBuff);
  const unslotMek = useMutation(api.slots.unslotMek);
  const reslotMek = useMutation(api.slots.reslotMek);

  // Handlers
  const handleLevelUp = async () => {
    if (!tenureProgress.isComplete) {
      console.warn('[TENURE] Cannot level up - tenure not complete');
      return;
    }

    try {
      console.log('[TENURE] Leveling up Mek:', { slotId });
      await levelUpMek({ slotId });
      console.log('[TENURE] Level up successful!');
    } catch (error) {
      console.error('[TENURE] Level up failed:', error);
    }
  };

  const handleApplyBuff = async (multiplier: number) => {
    try {
      console.log('[TENURE] Applying buff:', { slotId, multiplier });
      await applyTenureBuff({ slotId, buffMultiplier: multiplier });
      console.log('[TENURE] Buff applied successfully!');
    } catch (error) {
      console.error('[TENURE] Buff application failed:', error);
    }
  };

  const handleUnslot = async () => {
    try {
      console.log('[TENURE] Unslotting Mek:', { slotId });
      await unslotMek({ slotId });
      console.log('[TENURE] Mek unslotted - tenure frozen');
    } catch (error) {
      console.error('[TENURE] Unslot failed:', error);
    }
  };

  const handleReslot = async () => {
    try {
      console.log('[TENURE] Reslotting Mek:', { slotId });
      await reslotMek({ slotId });
      console.log('[TENURE] Mek reslotted - tenure resuming');
    } catch (error) {
      console.error('[TENURE] Reslot failed:', error);
    }
  };

  // Loading state
  if (tenureProgress.isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Tenure Progress Bar */}
      <TenureProgressBar
        currentTenure={tenureProgress.currentTenure}
        maxTenure={tenureProgress.maxTenure}
        onLevelUp={handleLevelUp}
        size="md"
        style="default"
      />

      {/* Detailed Info Panel (Optional) */}
      {showDetailedInfo && (
        <div className="mek-card-industrial mek-border-sharp-gold p-4 space-y-3">
          {/* Mek Name */}
          <div className="text-center">
            <h3 className="text-yellow-400 font-bold text-lg mek-text-industrial">
              {mekName}
            </h3>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Current Tenure */}
            <div className="bg-black/40 p-2 border border-yellow-500/30">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Current Tenure
              </div>
              <div className="text-yellow-400 font-bold font-mono">
                {tenureProgress.currentTenure.toFixed(1)}
              </div>
            </div>

            {/* Max Tenure */}
            <div className="bg-black/40 p-2 border border-yellow-500/30">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Next Level At
              </div>
              <div className="text-white font-bold font-mono">
                {tenureProgress.maxTenure}
              </div>
            </div>

            {/* Base Rate */}
            <div className="bg-black/40 p-2 border border-yellow-500/30">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Base Rate
              </div>
              <div className="text-cyan-400 font-bold font-mono">
                {tenureProgress.ratePerSecond.toFixed(1)}/s
              </div>
            </div>

            {/* Effective Rate */}
            <div className="bg-black/40 p-2 border border-yellow-500/30">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Effective Rate
              </div>
              <div className="text-green-400 font-bold font-mono">
                {tenureProgress.effectiveRate.toFixed(1)}/s
              </div>
            </div>
          </div>

          {/* Time to Level Up */}
          <div className="bg-black/40 p-3 border border-yellow-500/30 text-center">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
              Time to Level Up
            </div>
            <div className={`font-bold text-lg ${
              tenureProgress.isComplete ? 'text-green-400' : 'text-blue-400'
            }`}>
              {formatTimeToLevelUp(tenureProgress.timeToLevelUp)}
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex gap-2 justify-center flex-wrap">
            {/* Slotted Status */}
            <div className={`
              px-3 py-1 text-xs font-bold uppercase tracking-wider
              border ${
                tenureProgress.isSlotted
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : 'bg-gray-500/20 border-gray-500 text-gray-400'
              }
            `}>
              {tenureProgress.isSlotted ? '✓ Slotted' : '✕ Unslotted'}
            </div>

            {/* Complete Status */}
            {tenureProgress.isComplete && (
              <div className="
                px-3 py-1 text-xs font-bold uppercase tracking-wider
                bg-yellow-500/20 border border-yellow-500 text-yellow-400
                animate-pulse
              ">
                ⚡ Ready to Level Up
              </div>
            )}
          </div>

          {/* Debug Controls (Development Only) */}
          <div className="pt-3 border-t border-gray-700">
            <div className="text-gray-500 text-xs uppercase tracking-wider mb-2 text-center">
              Debug Controls
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Buff Controls */}
              <button
                onClick={() => handleApplyBuff(1.5)}
                className="px-3 py-1 text-xs bg-blue-500/20 border border-blue-500/50 text-blue-400
                          hover:bg-blue-500/30 transition-colors"
              >
                Apply +50% Buff
              </button>
              <button
                onClick={() => handleApplyBuff(2.0)}
                className="px-3 py-1 text-xs bg-purple-500/20 border border-purple-500/50 text-purple-400
                          hover:bg-purple-500/30 transition-colors"
              >
                Apply +100% Buff
              </button>
              <button
                onClick={() => handleApplyBuff(1.0)}
                className="px-3 py-1 text-xs bg-gray-500/20 border border-gray-500/50 text-gray-400
                          hover:bg-gray-500/30 transition-colors"
              >
                Remove Buffs
              </button>

              {/* Slot Controls */}
              {tenureProgress.isSlotted ? (
                <button
                  onClick={handleUnslot}
                  className="px-3 py-1 text-xs bg-red-500/20 border border-red-500/50 text-red-400
                            hover:bg-red-500/30 transition-colors"
                >
                  Unslot Mek
                </button>
              ) : (
                <button
                  onClick={handleReslot}
                  className="px-3 py-1 text-xs bg-green-500/20 border border-green-500/50 text-green-400
                            hover:bg-green-500/30 transition-colors"
                >
                  Reslot Mek
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compact Variations for Different Contexts */}
      <div className="space-y-2">
        <div className="text-gray-500 text-xs uppercase tracking-wider">
          Style Variations:
        </div>

        {/* Compact Style */}
        <div className="border border-dashed border-yellow-500/20 p-3">
          <div className="text-gray-600 text-xs mb-2">Compact (for slots)</div>
          <TenureProgressBar
            currentTenure={tenureProgress.currentTenure}
            maxTenure={tenureProgress.maxTenure}
            onLevelUp={handleLevelUp}
            size="sm"
            style="compact"
          />
        </div>

        {/* Detailed Style */}
        <div className="border border-dashed border-yellow-500/20 p-3">
          <div className="text-gray-600 text-xs mb-2">Detailed (for featured displays)</div>
          <TenureProgressBar
            currentTenure={tenureProgress.currentTenure}
            maxTenure={tenureProgress.maxTenure}
            onLevelUp={handleLevelUp}
            size="md"
            style="detailed"
          />
        </div>
      </div>
    </div>
  );
}
