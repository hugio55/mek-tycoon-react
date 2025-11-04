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

  const minDisplayTime = config?.minDisplayTime ?? TIMING.MIN_DISPLAY_TIME;
  const totalTimeout = config?.totalTimeout ?? TIMING.TOTAL_TIMEOUT;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bypass = localStorage.getItem(BYPASS_STORAGE_KEY);
      if (bypass === 'true') {
        console.log('[PAGE LOADER] Bypassed via localStorage');
        setIsComplete(true);
        setCanShow(false);
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

        if (!completeTimeoutRef.current) {
          completeTimeoutRef.current = setTimeout(() => {
            console.log('[PAGE LOADER] Complete');
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
      clearInterval(interval);
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
      }
    };
  }, [
    startTime,
    getLoadedCount,
    getTotalCount,
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
  }, [getLoadedCount, getTotalCount, startTime, minDisplayTime]);

  const stage = getStageMessage(progress, config?.messages);

  return {
    percentage: progress,
    stage,
    isComplete,
    canShow,
  };
}
