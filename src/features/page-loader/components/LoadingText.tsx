'use client';

import React, { useState, useEffect } from 'react';
import { LOADING_MESSAGES, MESSAGE_ROTATION_INTERVAL } from '../config/constants';

interface LoadingTextProps {
  customMessages?: string[];
  currentStage?: string;
}

export function LoadingText({ customMessages, currentStage }: LoadingTextProps) {
  const messages = customMessages || LOADING_MESSAGES;
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
      }, 300);
    }, MESSAGE_ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [messages.length]);

  const displayText = currentStage || messages[messageIndex];
  const isReady = displayText === 'READY';

  return (
    <div className="relative h-8 flex items-center justify-center">
      <div
        className={`${isReady ? 'text-green-400' : 'text-yellow-400'} text-sm uppercase tracking-widest font-mono transition-opacity duration-300`}
        style={{
          opacity: isVisible ? 1 : 0,
          textShadow: isReady
            ? '0 0 20px rgba(74, 222, 128, 0.8), 0 0 40px rgba(74, 222, 128, 0.4)'
            : '0 0 10px rgba(250, 182, 23, 0.5)',
        }}
      >
        {displayText}
      </div>

      {/* Scanning line effect */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
        style={{
          animation: 'scanLine 2s ease-in-out infinite',
        }}
      />

      <style jsx global>{`
        @keyframes scanLine {
          0%, 100% {
            opacity: 0.2;
            transform: scaleX(0.5);
          }
          50% {
            opacity: 1;
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  );
}
