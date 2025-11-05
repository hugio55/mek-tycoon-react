'use client';

import { useState, useEffect } from 'react';
import { useLoaderContext, LoadingOverlay, usePageLoadProgress } from '@/features/page-loader';

export function PageLoadingOverlay() {
  const { setIsLoading } = useLoaderContext();
  const [showOverlay, setShowOverlay] = useState(true);

  const { percentage, stage, isComplete, canShow } = usePageLoadProgress({
    messages: [
      'Initializing...',
      'Loading resources...',
      'Preparing interface...',
      'Almost ready...',
    ],
  });

  // Check if loader is bypassed
  const isBypassed = typeof window !== 'undefined' && localStorage.getItem('disablePageLoader') === 'true';

  useEffect(() => {
    // If bypassed, immediately set loading to false and hide overlay
    if (isBypassed) {
      setIsLoading(false);
      setShowOverlay(false);
      return;
    }

    // Normal loading flow with delays
    if (isComplete) {
      setTimeout(() => {
        setIsLoading(false);
        setTimeout(() => {
          setShowOverlay(false);
        }, 1000);
      }, 750);
    }
  }, [isComplete, isBypassed, setIsLoading]);

  if (!showOverlay || !canShow) {
    return null;
  }

  return (
    <LoadingOverlay
      percentage={percentage}
      stage={stage}
      isComplete={isComplete}
    />
  );
}
