'use client';

import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { DEFAULT_CONFIG, STORAGE_KEY } from '../config/default-config';
import type { LandingPageConfig } from '../types/landing-config';

interface DebugSidebarProps {
  onClose: () => void;
}

export default function DebugSidebar({ onClose }: DebugSidebarProps) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convex hooks
  const dbSettings = useQuery(api.landingDebugUnified.getUnifiedLandingDebugSettings);
  const updateSettings = useMutation(api.landingDebugUnified.updateUnifiedLandingDebugSettings);

  // Load from database
  useEffect(() => {
    if (dbSettings?.shared) {
      console.log('[🔄SIDEBAR] Loading config from database');
      setConfig(prev => ({ ...prev, ...dbSettings.shared }));
    }
  }, [dbSettings]);

  // Auto-save with debounce
  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveState('saving');

    // Save after 500ms of inactivity
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateSettings({ shared: { [key]: value } });
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch (error) {
        console.error('[❌SIDEBAR] Save failed:', error);
        setSaveState('idle');
      }
    }, 500);
  };

  const resetToDefaults = async () => {
    if (!confirm('Reset all settings to defaults?')) return;
    setConfig(DEFAULT_CONFIG);
    await updateSettings({ shared: DEFAULT_CONFIG });
  };

  return (
    <div
      className="w-96 h-screen bg-gray-900 border-l border-gray-700 overflow-y-auto flex-shrink-0 z-[10001] relative"
      style={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 z-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-yellow-400">🛠️ Debug Controls</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-sm hover:bg-gray-600"
          >
            Close
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetToDefaults}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs hover:bg-gray-600"
          >
            Reset to Defaults
          </button>
          {saveState === 'saved' && (
            <div className="px-2 py-1 bg-green-900/30 border border-green-700/50 rounded text-green-300 text-xs">
              ✓ Saved
            </div>
          )}
          {saveState === 'saving' && (
            <div className="px-2 py-1 bg-yellow-900/30 border border-yellow-700/50 rounded text-yellow-300 text-xs">
              Saving...
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-6">

        {/* Star System */}
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <h3 className="text-sm font-semibold text-blue-400 mb-3">⭐ Star System</h3>

          {/* Layer 1 */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={config.layer1Enabled}
                onChange={(e) => updateConfig('layer1Enabled', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs text-gray-300 font-semibold">Layer 1 (Regular Stars)</span>
            </label>

            <div className="space-y-2 ml-6">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Speed: {config.starSpeed.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={config.starSpeed}
                  onChange={(e) => updateConfig('starSpeed', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Density: {config.starFrequency}</label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={config.starFrequency}
                  onChange={(e) => updateConfig('starFrequency', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Size: {config.starScale.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={config.starScale}
                  onChange={(e) => updateConfig('starScale', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Background Stars */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={config.bgStarEnabled}
                onChange={(e) => updateConfig('bgStarEnabled', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs text-gray-300 font-semibold">Background Stars</span>
            </label>

            <div className="space-y-2 ml-6">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Count: {config.bgStarCount}</label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={config.bgStarCount}
                  onChange={(e) => updateConfig('bgStarCount', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Size: {config.bgStarSize.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={config.bgStarSize}
                  onChange={(e) => updateConfig('bgStarSize', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <h3 className="text-sm font-semibold text-purple-400 mb-3">🎨 Logo</h3>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Size: {config.logoSize}px</label>
            <input
              type="range"
              min="200"
              max="1000"
              step="10"
              value={config.logoSize}
              onChange={(e) => updateConfig('logoSize', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mt-2">
            <label className="block text-xs text-gray-400 mb-1">Y Position: {config.logoYPosition}%</label>
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              value={config.logoYPosition}
              onChange={(e) => updateConfig('logoYPosition', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Phase Carousel */}
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <h3 className="text-sm font-semibold text-green-400 mb-3">📊 Phase Carousel</h3>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Column Height: {config.phaseColumnHeight}px</label>
            <input
              type="range"
              min="200"
              max="500"
              step="8"
              value={config.phaseColumnHeight}
              onChange={(e) => updateConfig('phaseColumnHeight', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mt-2">
            <label className="block text-xs text-gray-400 mb-1">Blur Amount: {config.phaseBlurAmount}px</label>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={config.phaseBlurAmount}
              onChange={(e) => updateConfig('phaseBlurAmount', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mt-2">
            <label className="block text-xs text-gray-400 mb-1">Darkening: {config.phaseImageDarkening}%</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={config.phaseImageDarkening}
              onChange={(e) => updateConfig('phaseImageDarkening', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <h3 className="text-sm font-semibold text-yellow-400 mb-3">🔗 Footer</h3>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Height: {config.footerHeight}px</label>
            <input
              type="range"
              min="80"
              max="200"
              step="10"
              value={config.footerHeight}
              onChange={(e) => updateConfig('footerHeight', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mt-2">
            <label className="block text-xs text-gray-400 mb-1">Blur: {config.footerBlurAmount}px</label>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={config.footerBlurAmount}
              onChange={(e) => updateConfig('footerBlurAmount', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
