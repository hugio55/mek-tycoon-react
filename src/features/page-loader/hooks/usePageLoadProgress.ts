'use client';

import { useState, useEffect, useRef } from 'react';
import { useLoaderContext } from '../context/LoaderContext';
import {
  calculateQueryProgress,
  calculateTimeBasedProgress,
  calculateMilestoneProgress,
  combineStrategies,
  snapToMilestone,
  getStageMessage,
} from '../utils/progressCalculator';
import { TIMING } from '../config/constants';
import type { LoadingProgress, LoaderConfig } from '../types';

export function usePageLoadProgress(config?: LoaderConfig): LoadingProgress {
  const {
    getLoadedCount,
    getTotalCount,
    isWalletLoaded,
    areCriticalAssetsLoaded,
    startTime,
  } = useLoaderContext();

  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [canShow, setCanShow] = useState(true);
  const hasShownLoader = useRef(false);
  const completeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredCompletion = useRef(false);
  const minimumProgressTime = useRef(1200); // Minimum time to show progress animation (ms)

  const minDisplayTime = config?.minDisplayTime ?? TIMING.MIN_DISPLAY_TIME;
  const totalTimeout = config?.totalTimeout ?? TIMING.TOTAL_TIMEOUT;

  // ARCHITECTURE FIX: Run effect only ONCE on mount
  // The interval polls context state every 100ms, so it naturally picks up changes
  // No need for the effect to re-run when context state changes
  useEffect(() => {
    // Skip if already completed
    if (hasTriggeredCompletion.current) {
      return;
    }

    // Check bypass flag based on environment
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('localhost');

      const settingKey = isLocalhost ? 'disablePageLoaderLocalhost' : 'disablePageLoaderProduction';
      const bypass = localStorage.getItem(settingKey);
      if (bypass === 'true') {
        setIsComplete(true);
        setCanShow(false);
        hasTriggeredCompletion.current = true;
        return;
      }
    }

    // Declare intervalRef so we can clear it from inside updateProgress
    let intervalRef: NodeJS.Timeout | null = null;

    // This runs every 100ms via setInterval
    // It directly calls getLoadedCount(), getTotalCount(), and checks isWalletLoaded
    // So it always gets the latest context state without needing effect re-runs
    const updateProgress = () => {
      if (hasTriggeredCompletion.current) {
        // CRITICAL: Clear the interval when completion is triggered
        if (intervalRef) {
          clearInterval(intervalRef);
        }
        return;
      }

      const elapsed = Date.now() - startTime;
      const loadedCount = getLoadedCount();
      const totalCount = getTotalCount();

      const criticalAssetsLoaded = areCriticalAssetsLoaded();

      const queryProgress = calculateQueryProgress(loadedCount, totalCount);
      const timeProgress = calculateTimeBasedProgress(elapsed);
      const milestoneProgress = calculateMilestoneProgress(
        isWalletLoaded,
        loadedCount > 0,
        loadedCount === totalCount && totalCount > 0,
        criticalAssetsLoaded
      );

      const combined = combineStrategies({
        queryProgress,
        timeProgress,
        milestoneProgress,
      });

      const snapped = snapToMilestone(combined);

      // CRITICAL: Enforce minimum progress time to ensure visible animation
      // Even if everything loads instantly, pace the progress over minimum time
      const minimumTimeProgress = Math.min(
        (elapsed / minimumProgressTime.current) * 90,
        90
      );

      // Don't allow progress to exceed minimum time-based progress until minimum time has elapsed
      let cappedProgress = elapsed < minimumProgressTime.current
        ? Math.min(snapped, minimumTimeProgress)
        : snapped;

      // CRITICAL: Don't let progress reach 100% until critical assets are actually loaded
      // This prevents showing 100% while still downloading logo video, images, etc.
      if (!criticalAssetsLoaded && cappedProgress >= 100) {
        cappedProgress = 90; // Cap at 90% until critical assets load
      }

      setProgress(cappedProgress);

      const allQueriesLoaded = totalCount > 0 && loadedCount === totalCount;
      const noQueriesTracked = totalCount === 0 && elapsed >= 800;
      const minTimeElapsed = elapsed >= minDisplayTime;
      const minimumAnimationTimeElapsed = elapsed >= minimumProgressTime.current;
      const timedOut = elapsed >= totalTimeout;

      // Only allow completion if minimum animation time has elapsed AND critical assets loaded
      if (((allQueriesLoaded || noQueriesTracked) && minTimeElapsed && minimumAnimationTimeElapsed && criticalAssetsLoaded) || timedOut) {
        setProgress(100);

        if (!completeTimeoutRef.current && !hasTriggeredCompletion.current) {
          hasTriggeredCompletion.current = true;

          // CRITICAL: Clear the interval immediately upon completion
          if (intervalRef) {
            clearInterval(intervalRef);
          }

          // Wait for CSS animation to complete (800ms) plus small buffer
          completeTimeoutRef.current = setTimeout(() => {
            setIsComplete(true);
          }, 900);
        }
      }
    };

    if (getTotalCount() > 0 && !hasShownLoader.current) {
      hasShownLoader.current = true;
    }

    intervalRef = setInterval(updateProgress, TIMING.PROGRESS_UPDATE_INTERVAL);
    updateProgress();

    return () => {
      if (intervalRef) {
        clearInterval(intervalRef);
      }
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
      }
    };
    // CRITICAL: Only depend on stable values that don't change during loading
    // Do NOT include getLoadedCount, getTotalCount, or isWalletLoaded
    // The interval naturally polls context state - no need for effect re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, minDisplayTime, totalTimeout]);

  useEffect(() => {
    const totalCount = getTotalCount();
    const loadedCount = getLoadedCount();
    const elapsed = Date.now() - startTime;

    if (
      totalCount > 0 &&
      loadedCount === totalCount &&
      elapsed < minDisplayTime &&
      !hasShownLoader.current
    ) {
      setIsComplete(true);
      setCanShow(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, minDisplayTime]);


  // Only show "READY" when BOTH complete AND progress bar at 100%
  const stage = (isComplete && progress >= 100) ? 'READY' : getStageMessage(progress, config?.messages);

  return {
    percentage: progress,
    stage,
    isComplete,
    canShow,
  };
}
