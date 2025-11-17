'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface UseTenureProgressProps {
  slotId: Id<"slots">;
}

interface TenureProgressState {
  currentTenure: number;
  maxTenure: number;
  percentage: number;
  isComplete: boolean;
  ratePerSecond: number;
  effectiveRate: number;
  isSlotted: boolean;
  timeToLevelUp: number; // seconds
  isLoading: boolean;
}

/**
 * Real-time tenure progress hook with smooth interpolation
 *
 * Pattern:
 * 1. Backend provides baseline (tenure at snapshot time)
 * 2. Frontend interpolates current value using elapsed time
 * 3. useRef prevents resets when Convex re-queries
 * 4. requestAnimationFrame ensures smooth visual updates
 *
 * @example
 * const tenureProgress = useTenureProgress({ slotId });
 *
 * <TenureProgressBar
 *   currentTenure={tenureProgress.currentTenure}
 *   maxTenure={tenureProgress.maxTenure}
 *   onLevelUp={handleLevelUp}
 * />
 */
export function useTenureProgress({ slotId }: UseTenureProgressProps): TenureProgressState {
  // Get slot data from Convex (source of truth)
  const slotData = useQuery(api.slots.getSlotWithTenure, { slotId });

  // Display state (updated every frame)
  const [currentTenure, setCurrentTenure] = useState(0);

  // Refs to store baseline (prevent resets on re-query)
  const baselineRef = useRef({
    tenure: 0,
    timestamp: Date.now(),
    rate: 1,
    buffMultiplier: 1,
    isSlotted: false
  });

  // Track if this is the initial load
  const initialLoadRef = useRef(true);

  // Track previous backend timestamp to detect new snapshots
  const previousBackendTimeRef = useRef(Date.now());

  // Update baseline when Convex sends new data
  useEffect(() => {
    if (!slotData) return;

    const backendTimeChanged = slotData.lastTenureSnapshotTime !== previousBackendTimeRef.current;

    // CRITICAL LOG: Detect when backend sends NEW snapshot data
    if (backendTimeChanged) {
      console.log('[🎯TENURE] *** BACKEND SNAPSHOT UPDATE DETECTED ***', {
        OLD_backendTime: new Date(previousBackendTimeRef.current).toISOString(),
        NEW_backendTime: new Date(slotData.lastTenureSnapshotTime).toISOString(),
        timeDifference_ms: slotData.lastTenureSnapshotTime - previousBackendTimeRef.current,
        timeDifference_seconds: ((slotData.lastTenureSnapshotTime - previousBackendTimeRef.current) / 1000).toFixed(1),
        OLD_tenure: baselineRef.current.tenure.toFixed(2),
        NEW_tenure: slotData.accumulatedTenure.toFixed(2),
        tenureDifference: (slotData.accumulatedTenure - baselineRef.current.tenure).toFixed(2),
        rate: slotData.tenureRatePerSecond,
        buffMultiplier: slotData.tenureRateBuffMultiplier || 1,
        isSlotted: slotData.isSlotted
      });
    } else {
      // Regular baseline update (not a new snapshot, just component re-render)
      console.log('[🎯TENURE] Baseline update (no backend change):', {
        accumulatedTenure: slotData.accumulatedTenure.toFixed(2),
        backendTime: new Date(slotData.lastTenureSnapshotTime).toISOString(),
        backendTimeMs: slotData.lastTenureSnapshotTime,
        rate: slotData.tenureRatePerSecond,
        buffMultiplier: slotData.tenureRateBuffMultiplier || 1
      });
    }

    // Update all refs with new values
    previousBackendTimeRef.current = slotData.lastTenureSnapshotTime;
    baselineRef.current = {
      tenure: slotData.accumulatedTenure,
      timestamp: slotData.lastTenureSnapshotTime,
      rate: slotData.tenureRatePerSecond,
      buffMultiplier: slotData.tenureRateBuffMultiplier || 1,
      isSlotted: slotData.isSlotted
    };

    // On initial load, set display to baseline
    if (initialLoadRef.current) {
      setCurrentTenure(slotData.accumulatedTenure);
      initialLoadRef.current = false;
    }
  }, [slotData]);

  // Animation loop: interpolate current tenure from baseline
  useEffect(() => {
    if (!slotData) return;

    // Don't animate if not slotted
    if (!baselineRef.current.isSlotted) {
      setCurrentTenure(baselineRef.current.tenure);
      return;
    }

    // Don't animate if already at max
    if (baselineRef.current.tenure >= slotData.nextLevelTenure) {
      setCurrentTenure(slotData.nextLevelTenure);
      return;
    }

    let animationFrameId: number;
    let frameCount = 0;

    const animate = () => {
      const now = Date.now();
      const elapsedMs = now - baselineRef.current.timestamp;
      const elapsedSeconds = elapsedMs / 1000;

      const effectiveRate = baselineRef.current.rate * baselineRef.current.buffMultiplier;
      const accumulated = elapsedSeconds * effectiveRate;
      const newTenure = Math.min(
        baselineRef.current.tenure + accumulated,
        slotData.nextLevelTenure
      );

      // Log every 5 seconds (300 frames at 60fps)
      frameCount++;
      if (frameCount % 300 === 0) {
        console.log('[🎯TENURE] Animation frame:', {
          now: new Date(now).toISOString(),
          elapsedMs,
          elapsedSeconds: elapsedSeconds.toFixed(2),
          baseTenure: baselineRef.current.tenure.toFixed(2),
          rate: baselineRef.current.rate,
          buffMultiplier: baselineRef.current.buffMultiplier,
          effectiveRate: effectiveRate.toFixed(2),
          accumulated: accumulated.toFixed(2),
          newTenure: newTenure.toFixed(2),
          maxTenure: slotData.nextLevelTenure
        });
      }

      setCurrentTenure(newTenure);

      // Continue animation loop
      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation
    animationFrameId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [slotData, baselineRef.current.isSlotted]);

  // Return computed state
  if (!slotData) {
    return {
      currentTenure: 0,
      maxTenure: 1000,
      percentage: 0,
      isComplete: false,
      ratePerSecond: 1,
      effectiveRate: 1,
      isSlotted: false,
      timeToLevelUp: 0,
      isLoading: true
    };
  }

  const percentage = Math.min((currentTenure / slotData.nextLevelTenure) * 100, 100);
  const isComplete = currentTenure >= slotData.nextLevelTenure;
  const effectiveRate = slotData.tenureRatePerSecond * (slotData.tenureRateBuffMultiplier || 1);
  const timeToLevelUp = isComplete
    ? 0
    : (slotData.nextLevelTenure - currentTenure) / effectiveRate;

  return {
    currentTenure,
    maxTenure: slotData.nextLevelTenure,
    percentage,
    isComplete,
    ratePerSecond: slotData.tenureRatePerSecond,
    effectiveRate,
    isSlotted: slotData.isSlotted,
    timeToLevelUp,
    isLoading: false
  };
}

/**
 * Format time remaining for display
 *
 * @param seconds - Time in seconds
 * @returns Formatted string (e.g., "5m 30s", "2h 15m", "45s")
 */
export function formatTimeToLevelUp(seconds: number): string {
  if (!isFinite(seconds)) return "∞";
  if (seconds <= 0) return "Ready";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
