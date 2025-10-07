'use client';

import React, { useState } from 'react';
import { MekCard } from '@/components/MekCard';
import { getMekImageUrl } from '@/lib/mekNumberToVariation';
import { MekAsset } from '@/components/MekCard/types';

export default function BrowserStackTestPage() {
  const [scenario, setScenario] = useState<'normal' | 'withBonus' | 'maxLevel' | 'cantAfford'>('normal');

  // Mock MekAsset data for different test scenarios
  const createMockMek = (
    mekNumber: number,
    level: number,
    baseGoldRate: number,
    bonusGoldRate: number,
    sourceKey: string
  ): MekAsset => ({
    assetId: `mock_asset_${mekNumber}`,
    policyId: 'mock_policy',
    assetName: `Mek #${mekNumber}`,
    goldPerHour: baseGoldRate + bonusGoldRate,
    baseGoldPerHour: baseGoldRate,
    levelBoostAmount: bonusGoldRate,
    currentLevel: level,
    mekNumber,
    sourceKey,
  });

  const scenarios = {
    normal: {
      mek: createMockMek(1234, 5, 45.2, 0, 'aa1-aa4-gh1'),
      currentGold: 5000,
    },
    withBonus: {
      mek: createMockMek(5678, 7, 21.6, 14.8, 'bc2-dm1-ap1'),
      currentGold: 12000,
    },
    maxLevel: {
      mek: createMockMek(9999, 10, 108.5, 35.2, 'cc3-fm2-kl5'),
      currentGold: 50000,
    },
    cantAfford: {
      mek: createMockMek(3333, 3, 12.4, 3.1, 'dd4-gm3-mn6'),
      currentGold: 250,
    },
  };

  const currentScenario = scenarios[scenario];

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <h1 className="text-2xl font-black text-yellow-400 mb-2" style={{
          fontFamily: 'Orbitron, monospace',
          textShadow: '0 0 20px rgba(250, 182, 23, 0.5)'
        }}>
          MEK TYCOON - MOBILE TEST
        </h1>
        <p className="text-sm text-gray-400">
          BrowserStack Testing Page - Auto-syncs with main app UI
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-3">
          <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Test Scenarios</h2>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {Object.entries(scenarios).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setScenario(key as keyof typeof scenarios)}
                className={`
                  p-2 rounded-lg border transition-all duration-200 text-xs
                  ${scenario === key
                    ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400'
                  }
                `}
              >
                <div className="font-bold uppercase mb-1">
                  {key === 'normal' && 'Normal Card'}
                  {key === 'withBonus' && 'With Bonus'}
                  {key === 'maxLevel' && 'Max Level'}
                  {key === 'cantAfford' && "Can't Afford"}
                </div>
                <div className="text-[10px] opacity-70">
                  Lv {config.mek.currentLevel} • {config.mek.baseGoldPerHour}
                  {(config.mek.levelBoostAmount || 0) > 0 && ` +${config.mek.levelBoostAmount}`} g/hr
                </div>
              </button>
            ))}
          </div>

          {/* Current Test Values */}
          <div className="pt-3 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Mek:</span>
                <span className="text-yellow-400 ml-1 font-bold">#{currentScenario.mek.mekNumber}</span>
              </div>
              <div>
                <span className="text-gray-500">Level:</span>
                <span className="text-white ml-1 font-bold">{currentScenario.mek.currentLevel}/10</span>
              </div>
              <div>
                <span className="text-gray-500">Gold:</span>
                <span className="text-yellow-400 ml-1 font-bold">{currentScenario.currentGold.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Rate:</span>
                <span className="text-white ml-1 font-bold">
                  {currentScenario.mek.goldPerHour.toFixed(1)} g/hr
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MekCard Display - Single Card for Mobile Focus */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-3">
            MekCard Component (Live from Main App)
          </h3>

          <MekCard
            key={`${scenario}-${currentScenario.mek.mekNumber}`}
            mek={currentScenario.mek}
            getMekImageUrl={getMekImageUrl}
            currentGold={currentScenario.currentGold}
            onUpgrade={(mek, upgradeCost, newLevel) => {
              console.log('[BrowserStack Test] Upgrade clicked for Mek #', mek.mekNumber);
              alert(`Upgrade clicked for Mek #${mek.mekNumber}\nCost: ${upgradeCost} gold\nNew Level: ${newLevel}`);
            }}
          />
        </div>
      </div>

      {/* Height Verification Grid - All Cards Side by Side */}
      <div className="max-w-2xl mx-auto mt-6">
        <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-3">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3">
            Height Alignment Test - All Scenarios
          </h3>
          <p className="text-[10px] text-gray-500 mb-3">
            Verify MAX LVL card height matches others exactly
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(scenarios).map(([key, config]) => (
              <div key={key} className="relative">
                <div className="absolute -top-2 left-2 bg-gray-900 px-2 py-0.5 text-[10px] text-gray-400 uppercase z-10 rounded">
                  {key}
                </div>
                <MekCard
                  mek={config.mek}
                  getMekImageUrl={getMekImageUrl}
                  currentGold={config.currentGold}
                  onUpgrade={() => {}}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* UI Elements Test Section */}
      <div className="max-w-2xl mx-auto mt-6">
        <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-3">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3">
            Industrial Design System Elements
          </h3>

          {/* Buttons */}
          <div className="mb-4">
            <p className="text-[10px] text-gray-500 mb-2">Button Styles:</p>
            <div className="flex flex-wrap gap-2">
              <button className="bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 px-4 py-2 rounded text-sm font-bold hover:bg-yellow-500/30 transition-all">
                Primary Action
              </button>
              <button className="bg-gray-800/50 border border-gray-600 text-gray-300 px-4 py-2 rounded text-sm hover:border-gray-500 transition-all">
                Secondary Action
              </button>
            </div>
          </div>

          {/* Gold Display */}
          <div className="mb-4">
            <p className="text-[10px] text-gray-500 mb-2">Gold Display:</p>
            <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-3">
              <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Current Gold</div>
              <div className="text-3xl font-black text-yellow-400" style={{
                fontFamily: 'Orbitron, monospace',
                textShadow: '0 0 20px rgba(250, 182, 23, 0.5)'
              }}>
                {currentScenario.currentGold.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <p className="text-[10px] text-gray-500 mb-2">Progress Bar:</p>
            <div className="bg-gray-900/50 rounded-full h-3 overflow-hidden border border-gray-700">
              <div
                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-300"
                style={{ width: `${((currentScenario.mek.currentLevel || 1) / 10) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Level {currentScenario.mek.currentLevel} / 10
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Viewport Info */}
      <div className="max-w-2xl mx-auto mt-6 mb-4">
        <div className="bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
          <h3 className="text-xs text-cyan-400 font-bold mb-2">📱 Mobile Testing Guide</h3>
          <ul className="text-[10px] text-gray-400 space-y-1">
            <li>• This page imports actual components from main app</li>
            <li>• Any UI changes made to main page auto-sync here</li>
            <li>• No wallet connection required - uses mock data</li>
            <li>• Test responsive behavior at different screen sizes</li>
            <li>• Verify card heights match exactly (especially MAX LVL)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
