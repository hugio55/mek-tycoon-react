"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface EssenceBalance {
  variationId: number;
  variationName: string;
  variationType: "head" | "body" | "item";
  // Display amount - continuously updating
  displayAmount: number;
  // Rate per day (already includes count × base rate)
  ratePerDay: number;
  // How many slotted
  slottedCount: number;
  // Max cap
  maxCap: number;
  // Is at cap?
  isFull: boolean;
}

/**
 * Unified essence accumulation hook
 * Matches the gold system pattern - single animation loop updating all 288 essence types
 */
export function useEssenceAccumulation(walletAddress?: string) {
  const [essenceBalances, setEssenceBalances] = useState<EssenceBalance[]>([]);

  // Query player essence state
  const playerEssenceState = useQuery(
    api.essence.getPlayerEssenceState,
    walletAddress ? { walletAddress } : "skip"
  );

  // Use ref to track latest data without restarting animation loop
  // This is CRITICAL - prevents loop from restarting on every query update
  const essenceStateRef = useRef(playerEssenceState);
  useEffect(() => {
    essenceStateRef.current = playerEssenceState;
  }, [playerEssenceState]);

  // Unified animation loop - updates ALL essence types every frame
  // Only restarts when wallet connection changes, NOT when query updates
  useEffect(() => {
    // Only run if we have a wallet connected and essence is active
    if (!walletAddress || !playerEssenceState?.isActive) {
      setEssenceBalances([]);
      return;
    }

    console.log('[Essence Animation] Starting unified accumulation loop', {
      walletAddress,
      balanceCount: playerEssenceState?.balances?.length || 0,
      isActive: playerEssenceState?.isActive,
      lastCalculationTime: new Date(playerEssenceState?.lastCalculationTime || 0).toISOString()
    });

    let animationFrameId: number;
    let lastStateUpdateTime = Date.now();

    // Animation loop - 60 FPS calculation, 30 FPS state updates (matches gold system)
    const animateEssence = () => {
      const now = Date.now();
      const timeSinceLastStateUpdate = now - lastStateUpdateTime;

      // Get latest data from ref (doesn't cause re-render)
      const latestData = essenceStateRef.current;

      // Update state every 33ms for smooth 30 FPS
      if (latestData && latestData.balances && timeSinceLastStateUpdate >= 33) {
        const { balances, lastCalculationTime, essenceRates, slottedCounts, caps } = latestData;

        // Calculate time elapsed since backend last saved to DB
        const timeSinceBackend = now - lastCalculationTime;
        const daysElapsed = timeSinceBackend / (1000 * 60 * 60 * 24);

        // Update ALL essence balances at once (all 288 variations)
        const updatedBalances: EssenceBalance[] = balances.map((balance: any) => {
          const variationId = balance.variationId;
          const ratePerDay = essenceRates[variationId] || 0;
          const count = slottedCounts[variationId] || 0;
          const maxCap = caps[variationId] || 10;

          // Calculate total rate (base rate × count)
          const totalRatePerDay = ratePerDay * count;

          // Calculate accumulated amount
          // Base amount from DB + time-based accumulation since backend saved
          const accumulatedSinceBackend = totalRatePerDay * daysElapsed;
          const displayAmount = Math.min(
            balance.accumulatedAmount + accumulatedSinceBackend,
            maxCap
          );

          return {
            variationId: balance.variationId,
            variationName: balance.variationName,
            variationType: balance.variationType,
            displayAmount,
            ratePerDay: totalRatePerDay,
            slottedCount: count,
            maxCap,
            isFull: displayAmount >= maxCap
          };
        });

        setEssenceBalances(updatedBalances);
        lastStateUpdateTime = now;
      }

      animationFrameId = requestAnimationFrame(animateEssence);
    };

    // Start animation loop (only restarts when wallet connection changes)
    animationFrameId = requestAnimationFrame(animateEssence);

    return () => {
      console.log('[Essence Animation] Cleaning up animation loop');
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [walletAddress, playerEssenceState?.isActive]); // Only restart on wallet/active changes

  return {
    essenceBalances,
    isActive: playerEssenceState?.isActive || false,
    isLoading: playerEssenceState === undefined,
  };
}
