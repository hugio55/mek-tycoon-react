"use client";

import React, { useState } from 'react';
import SuccessBar from '@/components/SuccessBar';
import { DifficultyConfig } from '@/lib/difficultyModifiers';

export default function SimpleTestPage() {
  const [meterVariant, setMeterVariant] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [successRate, setSuccessRate] = useState(85); // Set above green line

  const testConfig: DifficultyConfig = {
    difficulty: 'medium' as const,
    displayName: 'Medium',
    successGreenLine: 75,
    goldMultiplier: 1.5,
    xpMultiplier: 1.3,
    essenceAmountMultiplier: 1.2,
    overshootBonusRate: 2.5,
    maxOvershootBonus: 50
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Success Meter Test</h1>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="mb-4">
            <label className="block text-white mb-2">Success Rate: {successRate}%</label>
            <input
              type="range"
              min="0"
              max="120"
              value={successRate}
              onChange={(e) => setSuccessRate(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-white mb-2">Meter Variant:</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setMeterVariant(v as 1 | 2 | 3 | 4 | 5)}
                  className={`px-3 py-1 rounded ${meterVariant === v ? 'bg-green-500' : 'bg-gray-600'} text-white`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-300 mt-1">
              {['Current', 'Tactical', 'Holographic', 'Military', 'Cinematic'][meterVariant - 1]}
            </div>
          </div>
        </div>

        {/* Success Bar */}
        <div className="bg-gray-900 rounded-lg p-6">
          <SuccessBar
            currentSuccess={successRate}
            difficultyConfig={testConfig}
            meterVariant={meterVariant}
            showDetails={false}
            baseRewards={{ gold: 100000, xp: 5000 }}
          />
        </div>

        {/* Status */}
        <div className="mt-4 text-center text-white">
          <p>Success: {successRate}% | Goal: {testConfig.successGreenLine}%</p>
          <p className={successRate > testConfig.successGreenLine ? 'text-green-400' : 'text-red-400'}>
            {successRate > testConfig.successGreenLine ? 'OVERSHOOT ACTIVE' : 'Below Goal'}
          </p>
        </div>
      </div>
    </div>
  );
}