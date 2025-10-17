"use client";

import { useEffect, useState, useRef } from 'react';

interface MissionCountdownProps {
  endTime: number; // Timestamp when mission ends
  onComplete?: () => void;
}

export default function MissionCountdown({ endTime, onComplete }: MissionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const totalDuration = useRef<number>(0);
  const startTime = useRef<number>(0);

  // Initialize total duration when component mounts or endTime changes
  useEffect(() => {
    const now = Date.now();
    totalDuration.current = Math.max(0, endTime - now);
    startTime.current = now;
  }, [endTime]);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);

      if (remaining === 0 && onComplete) {
        onComplete();
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endTime, onComplete]);

  // Convert milliseconds to time components
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="text-center">
      <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">
        MISSION IN PROGRESS
      </div>
      <div className="text-xl font-bold text-cyan-400" style={{ fontFamily: 'Roboto Mono, monospace' }}>
        {formatTime(timeLeft)}
      </div>
      <div className="mt-1">
        <div className="w-full bg-black/50 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-1000"
            style={{
              width: `${totalDuration.current > 0 ? Math.max(0, Math.min(100, ((totalDuration.current - timeLeft) / totalDuration.current) * 100)) : 0}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}