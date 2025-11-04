'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HexagonalSpinner } from './HexagonalSpinner';
import { ProgressBar } from './ProgressBar';
import { LoadingText } from './LoadingText';
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
      setIsLoading(false);

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
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        opacity: isFadingOut ? 0 : 1,
        transition: `opacity ${TIMING.FADE_DURATION}ms ease-out`,
      }}
    >

      {/* Center Content Container */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-xl px-4">
        {/* Hexagonal Spinner */}
        <HexagonalSpinner />

        {/* Progress Bar */}
        <div className="w-full">
          <ProgressBar percentage={percentage} showPercentage={true} />
        </div>

        {/* Loading Text */}
        <LoadingText currentStage={stage} />
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
}
