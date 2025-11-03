'use client';

import { useState, useEffect } from 'react';

interface TenureCellProps {
  assetId: string;
  savedTenure: number;
  isSlotted: boolean;
  tenureRate: number;
}

export default function TenureCell({
  assetId,
  savedTenure,
  isSlotted,
  tenureRate
}: TenureCellProps) {
  const [currentTenure, setCurrentTenure] = useState(savedTenure);

  // Real-time tenure accumulation for slotted Meks
  useEffect(() => {
    if (!isSlotted) {
      setCurrentTenure(savedTenure);
      return;
    }

    // Update every second
    const interval = setInterval(() => {
      setCurrentTenure(prev => prev + tenureRate);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSlotted, savedTenure, tenureRate]);

  // STATE 1: Slotted & Accumulating (Green, Active)
  if (isSlotted && tenureRate > 0) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-green-400 font-semibold">
            {currentTenure.toFixed(1)}
          </span>
          <span className="hidden sm:inline text-xs text-gray-500">tenure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-green-500">
            +{tenureRate.toFixed(1)}/sec
          </span>
          <span className="text-green-400 animate-spin inline-block" style={{ animationDuration: '2s' }}>
            🔄
          </span>
        </div>
      </div>
    );
  }

  // STATE 2: Unslotted (Frozen) - Has tenure but not accumulating
  if (savedTenure > 0) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-gray-400 font-semibold">
            {savedTenure.toFixed(1)}
          </span>
          <span className="hidden sm:inline text-xs text-gray-600">tenure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">
            (frozen)
          </span>
          <span className="text-gray-500">
            🧊
          </span>
        </div>
      </div>
    );
  }

  // STATE 3: Never Slotted - Zero tenure
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-gray-600 font-semibold">
          0
        </span>
        <span className="hidden sm:inline text-xs text-gray-700">tenure</span>
      </div>
      <div className="text-xs text-gray-600 italic">
        (not started)
      </div>
    </div>
  );
}
