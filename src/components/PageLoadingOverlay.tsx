'use client';

import { useState, useEffect } from 'react';
import { useLoaderContext, LoadingOverlay } from '@/features/page-loader';

export function PageLoadingOverlay() {
  const { isLoading, setIsLoading } = useLoaderContext();
  const [showOverlay, setShowOverlay] = useState(true);
  const [percentage, setPercentage] = useState(0);
  const [stage, setStage] = useState('Initializing...');

  useEffect(() => {
    console.log('[PAGE LOADING] Starting automatic page load sequence');

    // Simulate loading stages
    const stages = [
      { delay: 0, percent: 0, text: 'Initializing...' },
      { delay: 300, percent: 25, text: 'Loading resources...' },
      { delay: 600, percent: 50, text: 'Preparing interface...' },
      { delay: 900, percent: 75, text: 'Almost ready...' },
      { delay: 1200, percent: 100, text: 'Complete!' },
    ];

    const timers: NodeJS.Timeout[] = [];

    stages.forEach(({ delay, percent, text }) => {
      const timer = setTimeout(() => {
        setPercentage(percent);
        setStage(text);

        if (percent === 100) {
          console.log('[PAGE LOADING] Load complete, triggering fade-in');
          // Wait a moment at 100% before fading out overlay
          setTimeout(() => {
            setIsLoading(false);
            setTimeout(() => setShowOverlay(false), 2000);
          }, 300);
        }
      }, delay);
      timers.push(timer);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [setIsLoading]);

  if (!showOverlay) {
    return null;
  }

  return (
    <LoadingOverlay
      percentage={percentage}
      stage={stage}
      isComplete={percentage === 100}
      onComplete={() => {
        console.log('[PAGE LOADING] Overlay onComplete called');
      }}
    />
  );
}
