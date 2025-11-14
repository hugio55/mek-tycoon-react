'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TriangleKaleidoscope } from './TriangleKaleidoscope';
import { PercentageDisplay } from './PercentageDisplay';
import { TIMING } from '../config/constants';
import { useLoaderContext } from '../context/LoaderContext';

interface LoadingOverlayProps {
  percentage: number;
  stage: string;
  isComplete: boolean;
  onComplete?: () => void;
}

export function LoadingOverlay({
  percentage,
  stage,
  isComplete,
  onComplete,
}: LoadingOverlayProps) {
  const { setIsLoading } = useLoaderContext();
  const [mounted, setMounted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isComplete && !isFadingOut) {
      setIsFadingOut(true);

      // Delay setting isLoading = false until fade-out is nearly complete (75% done)
      // This prevents page content from fading in while loading overlay is still visible
      const contentFadeDelay = TIMING.FADE_DURATION * 0.75; // 1500ms of 2000ms
      setTimeout(() => {
        setIsLoading(false);
      }, contentFadeDelay);

      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, TIMING.FADE_DURATION);
    }
  }, [isComplete, isFadingOut, onComplete, setIsLoading]);

  if (!mounted) return null;

  const overlayContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
      style={{
        opacity: isFadingOut ? 0 : 1,
        transition: `opacity ${TIMING.FADE_DURATION}ms ease-out`,
      }}
    >

      {/* Center Content Container */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-xl px-4">
        {/* Triangle Kaleidoscope Spinner */}
        <div className="w-48 h-48 md:w-64 md:h-64">
          <TriangleKaleidoscope />
        </div>

        {/* Percentage Display */}
        <PercentageDisplay percentage={percentage} />
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
}
