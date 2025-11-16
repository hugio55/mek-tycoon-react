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

  // Check if loader is bypassed based on environment
  const isBypassed = typeof window !== 'undefined' && (() => {
    const hostname = window.location.hostname;
    const searchParams = new URLSearchParams(window.location.search);
    const urlParam = searchParams.get('noloader');

    // Consider it localhost if it's:
    // - localhost or 127.0.0.1
    // - Any local IP address (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const isLocalhost = hostname === 'localhost' ||
                       hostname === '127.0.0.1' ||
                       hostname.includes('localhost') ||
                       hostname.startsWith('192.168.') ||
                       hostname.startsWith('10.') ||
                       /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

    const settingKey = isLocalhost ? 'disablePageLoaderLocalhost' : 'disablePageLoaderProduction';

    // URL parameter takes priority and also saves to localStorage
    if (urlParam !== null) {
      const shouldDisable = urlParam === 'true' || urlParam === '';
      localStorage.setItem(settingKey, shouldDisable.toString());
      return shouldDisable;
    }

    // Otherwise check localStorage
    const settingValue = localStorage.getItem(settingKey);
    return settingValue === 'true';
  })();

  useEffect(() => {
    // If bypassed, immediately set loading to false and hide overlay
    if (isBypassed) {
      setIsLoading(false);
      setShowOverlay(false);
      return;
    }
  }, [isBypassed, setIsLoading]);

  // Handle completion callback from LoadingOverlay
  const handleComplete = () => {
    setShowOverlay(false);
  };

  if (!showOverlay || !canShow) {
    return null;
  }

  return (
    <LoadingOverlay
      percentage={percentage}
      stage={stage}
      isComplete={isComplete}
      onComplete={handleComplete}
    />
  );
}
