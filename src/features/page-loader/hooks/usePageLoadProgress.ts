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
  const hasTriggeredCompletion = useRef(false);  // NEW: Track if completion was triggered
  const hookIdRef = useRef(Math.random().toString(36).substring(7));

  // Track function reference changes
  const prevGetLoadedCountRef = useRef(getLoadedCount);
  const prevGetTotalCountRef = useRef(getTotalCount);

  if (prevGetLoadedCountRef.current !== getLoadedCount) {
    console.log(`[🔄LOOP-DEBUG] Hook ${hookIdRef.current} - getLoadedCount function reference CHANGED`);
    prevGetLoadedCountRef.current = getLoadedCount;
  }

  if (prevGetTotalCountRef.current !== getTotalCount) {
    console.log(`[🔄LOOP-DEBUG] Hook ${hookIdRef.current} - getTotalCount function reference CHANGED`);
    prevGetTotalCountRef.current = getTotalCount;
  }

  console.log(`[🔄LIFECYCLE] usePageLoadProgress hook ID ${hookIdRef.current} mounted`);

  const minDisplayTime = config?.minDisplayTime ?? TIMING.MIN_DISPLAY_TIME;
  const totalTimeout = config?.totalTimeout ?? TIMING.TOTAL_TIMEOUT;

  useEffect(() => {
    // CRITICAL FIX: If completion was already triggered, don't restart the effect
    if (hasTriggeredCompletion.current) {
      console.log(`[🔄LOOP-DEBUG] Hook ${hookIdRef.current} - Completion already triggered, skipping effect`);
      return;
    }

    if (typeof window !== 'undefined') {
      const bypass = localStorage.getItem(BYPASS_STORAGE_KEY);
      if (bypass === 'true') {
        console.log('[PAGE LOADER] Bypassed via localStorage');
        setIsComplete(true);
        setCanShow(false);
        hasTriggeredCompletion.current = true;  // Mark as completed
        return;
      }
    }

    const updateProgress = () => {
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
      const noQueriesTracked = totalCount === 0 && elapsed >= 800; // No queries after 0.8s = fall back to simple timer
      const minTimeElapsed = elapsed >= minDisplayTime;
      const timedOut = elapsed >= totalTimeout;

      if ((allQueriesLoaded && minTimeElapsed) || noQueriesTracked || timedOut) {
        if (timedOut) {
          console.log('[PAGE LOADER] Timeout reached, completing');
        }
        setProgress(100);

        if (!completeTimeoutRef.current && !hasTriggeredCompletion.current) {
          hasTriggeredCompletion.current = true;  // Mark completion as triggered BEFORE timeout
          completeTimeoutRef.current = setTimeout(() => {
            console.log(`[🔄LIFECYCLE] Hook ${hookIdRef.current} - Setting isComplete to TRUE`);
            setIsComplete(true);
          }, 300);
        }
      }
    };

    if (getTotalCount() > 0 && !hasShownLoader.current) {
      console.log('[PAGE LOADER] Tracking', getTotalCount(), 'queries');
      hasShownLoader.current = true;
    }

    const interval = setInterval(updateProgress, TIMING.PROGRESS_UPDATE_INTERVAL);
    updateProgress();

    return () => {
      console.log(`[🔄LIFECYCLE] Hook ${hookIdRef.current} - Main effect CLEANUP running`);
      clearInterval(interval);
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    startTime,
    isWalletLoaded,
    minDisplayTime,
    totalTimeout,
  ]);

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

  // Track isComplete changes
  useEffect(() => {
    console.log(`[🔄LIFECYCLE] Hook ${hookIdRef.current} - isComplete changed to: ${isComplete}`);
  }, [isComplete]);

  const stage = getStageMessage(progress, config?.messages);

  return {
    percentage: progress,
    stage,
    isComplete,
    canShow,
  };
}
