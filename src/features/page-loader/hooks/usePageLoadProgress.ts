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
import { TIMING, BYPASS_STORAGE_KEY } from '../config/constants';
import type { LoadingProgress, LoaderConfig } from '../types';

export function usePageLoadProgress(config?: LoaderConfig): LoadingProgress {
  const {
    getLoadedCount,
    getTotalCount,
    isWalletLoaded,
    startTime,
  } = useLoaderContext();

  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [canShow, setCanShow] = useState(true);
  const hasShownLoader = useRef(false);
  const completeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredCompletion = useRef(false);

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

    // Check bypass flag
    if (typeof window !== 'undefined') {
      const bypass = localStorage.getItem(BYPASS_STORAGE_KEY);
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
          console.log('[PAGE LOADER] Interval cleared after completion');
        }
        return;
      }

      const elapsed = Date.now() - startTime;
      const loadedCount = getLoadedCount();
      const totalCount = getTotalCount();

      const queryProgress = calculateQueryProgress(loadedCount, totalCount);
      const timeProgress = calculateTimeBasedProgress(elapsed);
      const milestoneProgress = calculateMilestoneProgress(
        isWalletLoaded,
        loadedCount > 0,
        loadedCount === totalCount && totalCount > 0
      );

      const combined = combineStrategies({
        queryProgress,
        timeProgress,
        milestoneProgress,
      });

      const snapped = snapToMilestone(combined);

      // Only log on significant progress changes (every 25%)
      if (snapped !== progress && (snapped === 0 || snapped === 25 || snapped === 50 || snapped === 75 || snapped === 100)) {
        console.log('[PAGE LOADER] Progress:', snapped + '%', `(queries: ${loadedCount}/${totalCount})`);
      }

      setProgress(snapped);

      const allQueriesLoaded = totalCount > 0 && loadedCount === totalCount;
      const noQueriesTracked = totalCount === 0 && elapsed >= 800;
      const minTimeElapsed = elapsed >= minDisplayTime;
      const timedOut = elapsed >= totalTimeout;

      if ((allQueriesLoaded && minTimeElapsed) || noQueriesTracked || timedOut) {
        if (timedOut) {
          console.log('[PAGE LOADER] Timeout reached, completing');
        }
        setProgress(100);

        if (!completeTimeoutRef.current && !hasTriggeredCompletion.current) {
          hasTriggeredCompletion.current = true;

          // CRITICAL: Clear the interval immediately upon completion
          if (intervalRef) {
            clearInterval(intervalRef);
            console.log('[PAGE LOADER] Interval cleared at completion trigger');
          }

          completeTimeoutRef.current = setTimeout(() => {
            setIsComplete(true);
          }, 300);
        }
      }
    };

    if (getTotalCount() > 0 && !hasShownLoader.current) {
      console.log('[PAGE LOADER] Tracking', getTotalCount(), 'queries');
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
      console.log('[PAGE LOADER] Fast load detected, skipping loader');
      setIsComplete(true);
      setCanShow(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, minDisplayTime]);


  const stage = getStageMessage(progress, config?.messages);

  return {
    percentage: progress,
    stage,
    isComplete,
    canShow,
  };
}
