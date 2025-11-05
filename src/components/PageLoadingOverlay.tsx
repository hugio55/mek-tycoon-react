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

  useEffect(() => {
    if (isComplete) {
      setTimeout(() => {
        setIsLoading(false);
        setTimeout(() => {
          setShowOverlay(false);
        }, 2000);
      }, 1500);
    }
  }, [isComplete, setIsLoading]);

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
