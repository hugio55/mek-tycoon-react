"use client";

import { useState, useEffect, useRef } from 'react';
import { calculateCurrentEssence } from '@/convex/lib/essenceCalculations';

interface UseEssenceAccumulationProps {
  baseAmount: number;          // Backend snapshot value (accumulatedAmount)
  lastSnapshotTime: number;    // When snapshot was taken (timestamp)
  ratePerDay: number;          // Essence generation rate per day
  essenceCap: number;          // Maximum capacity
  variationId: number;         // Unique ID (prevents resets when switching variations)
}

/**
 * Real-time essence accumulation hook
 *
 * Mirrors gold system's requestAnimationFrame pattern for smooth, accurate display.
 *
 * Uses a stable ref to store backend data, preventing resets when:
 * - User hovers over different essence types
 * - Convex query re-runs
 * - Component re-renders
 *
 * Only resets calculation when variationId changes (switching to different essence type).
 *
 * @example
 * ```tsx
 * const { currentAmount } = useEssenceAccumulation({
 *   baseAmount: backendBalance.accumulatedAmount,
 *   lastSnapshotTime: backendBalance.lastSnapshotTime,
 *   ratePerDay: effectiveRate * variationCount,
 *   essenceCap: config.essenceCap + buffs,
 *   variationId: backendBalance.variationId
 * });
 *
 * // Display with high precision
 * <div>{currentAmount.toFixed(12)}</div>
 * ```
 */
export function useEssenceAccumulation({
  baseAmount,
  lastSnapshotTime,
  ratePerDay,
  essenceCap,
  variationId
}: UseEssenceAccumulationProps) {
  const [currentAmount, setCurrentAmount] = useState(baseAmount);

  // Store backend data in ref (stable, doesn't reset on re-render)
  // This is CRITICAL - prevents resets when Convex query re-runs
  const dataRef = useRef({ baseAmount, lastSnapshotTime, ratePerDay, essenceCap });

  // Update ref when backend data changes (but don't reset animation)
  useEffect(() => {
    dataRef.current = { baseAmount, lastSnapshotTime, ratePerDay, essenceCap };
  }, [baseAmount, lastSnapshotTime, ratePerDay, essenceCap]);

  // Animation loop - only depends on variationId
  useEffect(() => {
    let animationFrameId: number;
    let lastUpdateTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const timeSinceUpdate = now - lastUpdateTime;

      // Update state every 33ms (30 FPS - smooth without excessive renders)
      // Mirrors gold system's throttled update pattern
      if (timeSinceUpdate >= 33) {
        const data = dataRef.current;

        // Use shared calculation utility (same formula as backend)
        const calculated = calculateCurrentEssence({
          accumulatedAmount: data.baseAmount,
          ratePerDay: data.ratePerDay,
          lastSnapshotTime: data.lastSnapshotTime,
          essenceCap: data.essenceCap
        });

        setCurrentAmount(calculated);
        lastUpdateTime = now;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation loop
    animationFrameId = requestAnimationFrame(animate);

    // Cleanup on unmount or variationId change
    return () => cancelAnimationFrame(animationFrameId);
  }, [variationId]); // Only restart when variationId changes (switching essence type)

  return { currentAmount };
}

/**
 * Simplified hook for when you just need the current calculated amount
 * without animation (for displays that don't need 60 FPS updates)
 */
export function useEssenceAmount({
  baseAmount,
  lastSnapshotTime,
  ratePerDay,
  essenceCap
}: Omit<UseEssenceAccumulationProps, 'variationId'>) {
  return calculateCurrentEssence({
    accumulatedAmount: baseAmount,
    ratePerDay,
    lastSnapshotTime,
    essenceCap
  });
}
