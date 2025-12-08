'use client';

import { useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface UseActivityTrackingOptions {
  walletAddress: string | null;
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Track user activity and update lastLogin timestamp
 * Phase II: Uses userData.updateLastActive instead of goldMining
 */
export function useActivityTracking({
  walletAddress,
  enabled = true,
  debounceMs = 30000 // Update max once per 30 seconds
}: UseActivityTrackingOptions) {
  // Phase II: Use userData.updateLastActive instead of goldMining
  const updateLastActive = useMutation(api.userData.updateLastActive);
  const lastActivityTime = useRef<number>(0);
  const activityTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!walletAddress || !enabled) {
      return;
    }

    const recordActivity = () => {
      const now = Date.now();

      // Debounce: Only update if enough time has passed since last update
      if (now - lastActivityTime.current < debounceMs) {
        return;
      }

      // Clear any pending timeout
      if (activityTimeout.current) {
        clearTimeout(activityTimeout.current);
      }

      // Schedule the update
      activityTimeout.current = setTimeout(() => {
        lastActivityTime.current = now;
        updateLastActive({ walletAddress }).catch(err =>
          console.error('[Activity] Failed to update:', err)
        );
      }, 100); // Small delay to batch rapid actions
    };

    // Track genuine user interactions
    const handleMouseMove = () => recordActivity();
    const handleClick = () => recordActivity();
    const handleScroll = () => recordActivity();
    const handleKeyDown = () => recordActivity();
    const handleTouchStart = () => recordActivity();

    // Throttle mouse movement (it fires very frequently)
    let mouseMoveThrottle: NodeJS.Timeout | null = null;
    const throttledMouseMove = () => {
      if (!mouseMoveThrottle) {
        mouseMoveThrottle = setTimeout(() => {
          recordActivity();
          mouseMoveThrottle = null;
        }, 2000); // Mouse movement updates max every 2 seconds
      }
    };

    // Add event listeners for activity detection
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('mousemove', throttledMouseMove, { passive: true });

    // Track page visibility - pause when tab is hidden
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible - this alone is NOT activity
        // Wait for actual user interaction
        console.log('[Activity] Tab visible, waiting for user interaction');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('mousemove', throttledMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (activityTimeout.current) {
        clearTimeout(activityTimeout.current);
      }
      if (mouseMoveThrottle) {
        clearTimeout(mouseMoveThrottle);
      }
    };
  }, [walletAddress, enabled, debounceMs, updateLastActive]);
}
