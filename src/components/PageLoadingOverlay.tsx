'use client';

import { useState, useEffect, useRef } from 'react';
import { useLoaderContext, LoadingOverlay, usePageLoadProgress } from '@/features/page-loader';

export function PageLoadingOverlay() {
  const componentId = useRef(Math.random().toString(36).substring(7));
  console.log(`[🔄LIFECYCLE] PageLoadingOverlay component ID ${componentId.current} rendered`);

  const { setIsLoading } = useLoaderContext();
  const [showOverlay, setShowOverlay] = useState(true);

  // Track component mount/unmount
  useEffect(() => {
    console.log(`[🔄LIFECYCLE] Component ${componentId.current} MOUNTED`);
    return () => {
      console.log(`[🔄LIFECYCLE] Component ${componentId.current} UNMOUNTING`);
    };
  }, []);

  const { percentage, stage, isComplete, canShow } = usePageLoadProgress({
    messages: [
      'Initializing...',
      'Loading resources...',
      'Preparing interface...',
      'Almost ready...',
    ],
  });

  useEffect(() => {
    console.log(`[🔄LIFECYCLE] Component ${componentId.current} - isComplete effect triggered: ${isComplete}`);
    if (isComplete) {
      console.log(`[🔄LIFECYCLE] Component ${componentId.current} - Starting fade-out timers`);
      setTimeout(() => {
        console.log(`[🔄LIFECYCLE] Component ${componentId.current} - Setting isLoading to false`);
        setIsLoading(false);
        setTimeout(() => {
          console.log(`[🔄LIFECYCLE] Component ${componentId.current} - Hiding overlay`);
          setShowOverlay(false);
        }, 2000);
      }, 1500);
    }
  }, [isComplete, setIsLoading]);

  useEffect(() => {
    console.log(`[🔄LIFECYCLE] Component ${componentId.current} - showOverlay: ${showOverlay}, canShow: ${canShow}`);
  }, [showOverlay, canShow]);

  if (!showOverlay || !canShow) {
    console.log(`[🔄LIFECYCLE] Component ${componentId.current} - Returning null (showOverlay: ${showOverlay}, canShow: ${canShow})`);
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
