'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TriangleKaleidoscope } from './TriangleKaleidoscope';
import { PercentageDisplay } from './PercentageDisplay';
import { TIMING } from '../config/constants';
import { useLoaderContext } from '../context/LoaderContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

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

  // Load settings from database
  const savedSettings = useQuery(api.loaderSettings.getLoaderSettings);

  // Use saved settings or defaults
  const fontSize = savedSettings?.fontSize ?? 15;
  const spacing = savedSettings?.spacing ?? 8;
  const horizontalOffset = savedSettings?.horizontalOffset ?? 0;
  const fontFamily = savedSettings?.fontFamily ?? 'Saira';
  const chromaticOffset = savedSettings?.chromaticOffset ?? 0;
  const triangleSize = savedSettings?.triangleSize ?? 0.75;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isComplete && !isFadingOut) {
      setIsFadingOut(true);

      // Wait for loader to completely fade out before showing page content
      setTimeout(() => {
        setIsLoading(false);
        if (onComplete) {
          onComplete();
        }
      }, TIMING.FADE_DURATION);
    }
  }, [isComplete, isFadingOut, onComplete, setIsLoading]);

  // Don't render until both mounted AND settings have loaded
  if (!mounted || savedSettings === undefined) return null;

  const overlayContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
      style={{
        opacity: isFadingOut ? 0 : 1,
        transition: `opacity ${TIMING.FADE_DURATION}ms ease-out`,
        background: 'transparent',
      }}
    >

      {/* Center Content Container */}
      <div className="relative z-10 flex flex-col items-center gap-0 w-full max-w-xl px-4">
        {/* Triangle Kaleidoscope Spinner */}
        <div
          className="w-48 h-48 md:w-64 md:h-64"
          style={{
            transform: `scale(${triangleSize})`,
          }}
        >
          <TriangleKaleidoscope chromaticOffset={chromaticOffset} scale={triangleSize} />
        </div>

        {/* Percentage Display */}
        <PercentageDisplay
          percentage={percentage}
          fontSize={fontSize}
          spacing={spacing}
          horizontalOffset={horizontalOffset}
          fontFamily={fontFamily}
        />
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
}
