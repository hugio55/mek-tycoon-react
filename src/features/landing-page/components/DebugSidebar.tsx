'use client';

import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { DEFAULT_CONFIG, STORAGE_KEY } from '../config/default-config';

interface DebugSidebarProps {
  onClose: () => void;
}

type ConfigType = typeof DEFAULT_CONFIG;

export default function DebugSidebar({ onClose }: DebugSidebarProps) {
  const [config, setConfig] = useState<ConfigType>(DEFAULT_CONFIG);
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
  const updateConfig = (key: keyof ConfigType, value: any) => {
    console.log('[📝SIDEBAR] Config change:', key, '=', value);
    setConfig(prev => ({ ...prev, [key]: value }));

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveState('saving');

    // Save after 500ms of inactivity
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('[💾SIDEBAR] Saving to database:', { shared: { [key]: value } });
        const result = await updateSettings({ shared: { [key]: value } });
        console.log('[✅SIDEBAR] Save successful:', result);
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

  // Color options for text elements
  const colorOptions = [
    { name: 'White', class: 'text-white' },
    { name: 'Light Gray', class: 'text-gray-300' },
    { name: 'Medium Gray', class: 'text-gray-400' },
    { name: 'Dark Gray', class: 'text-gray-500' },
    { name: 'Yellow', class: 'text-yellow-400/90' },
    { name: 'Yellow 70%', class: 'text-yellow-400/70' },
    { name: 'White 70%', class: 'text-white/70' },
    { name: 'White 80%', class: 'text-white/80' },
  ];

  // Font options
  const fonts = [
    'Orbitron',
    'Rajdhani',
    'Exo 2',
    'Electrolize',
    'Audiowide',
    'Michroma',
    'Saira',
    'Play',
    'Quantico',
    'Arial',
    'Helvetica',
    'Courier New',
    'Georgia',
    'Times New Roman'
  ];

  // Speaker icon styles
  const speakerIconStyles: Array<'minimal' | 'geometric' | 'bars' | 'hologram' | 'pulse'> = [
    'minimal',
    'geometric',
    'bars',
    'hologram',
    'pulse'
  ];

  // Phase image blend modes
  const blendModes: Array<'normal' | 'screen' | 'lighten' | 'lighter'> = [
    'normal',
    'screen',
    'lighten',
    'lighter'
  ];

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

        {/* ⭐ Star System */}
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <h3 className="text-sm font-semibold text-blue-400 mb-3">⭐ Star System</h3>

          {/* Master Enable */}
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={config.starsEnabled}
              onChange={(e) => updateConfig('starsEnabled', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-xs text-gray-300 font-semibold">Enable Stars</span>
          </label>

          {/* Background Stars */}
          <div className="mb-4 border-t border-gray-700 pt-3">
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

              <div>
                <label className="block text-xs text-gray-400 mb-1">Min Brightness: {config.bgStarMinBrightness.toFixed(1)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.bgStarMinBrightness}
                  onChange={(e) => updateConfig('bgStarMinBrightness', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Max Brightness: {config.bgStarMaxBrightness.toFixed(1)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.bgStarMaxBrightness}
                  onChange={(e) => updateConfig('bgStarMaxBrightness', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Twinkle Amount: {config.bgStarTwinkleAmount}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={config.bgStarTwinkleAmount}
                  onChange={(e) => updateConfig('bgStarTwinkleAmount', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Twinkle Speed: {config.bgStarTwinkleSpeed.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={config.bgStarTwinkleSpeed}
                  onChange={(e) => updateConfig('bgStarTwinkleSpeed', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Speed Randomness: {config.bgStarTwinkleSpeedRandomness}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={config.bgStarTwinkleSpeedRandomness}
                  onChange={(e) => updateConfig('bgStarTwinkleSpeedRandomness', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Size Randomness: {config.bgStarSizeRandomness}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={config.bgStarSizeRandomness}
                  onChange={(e) => updateConfig('bgStarSizeRandomness', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Layer 1 (Regular Stars) */}
          <div className="mb-4 border-t border-gray-700 pt-3">
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
                <label className="block text-xs text-gray-400 mb-1">Density: {config.starFrequency} stars</label>
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

          {/* Layer 2 (Fast Streaks) */}
          <div className="mb-4 border-t border-gray-700 pt-3">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={config.layer2Enabled}
                onChange={(e) => updateConfig('layer2Enabled', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs text-gray-300 font-semibold">Layer 2 (Fast Streaks)</span>
            </label>

            <div className="space-y-2 ml-6">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Speed: {config.starSpeed2.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="200"
                  step="1"
                  value={config.starSpeed2}
                  onChange={(e) => updateConfig('starSpeed2', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Density: {config.starFrequency2} stars</label>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="10"
                  value={config.starFrequency2}
                  onChange={(e) => updateConfig('starFrequency2', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Size: {config.starScale2.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={config.starScale2}
                  onChange={(e) => updateConfig('starScale2', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Line Length: {config.lineLength2.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={config.lineLength2}
                  onChange={(e) => updateConfig('lineLength2', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>


          {/* Star Fade Settings */}
          <div className="border-t border-gray-700 pt-3">
            <h4 className="text-xs text-gray-300 font-semibold mb-2">Fade Settings</h4>

            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Fade Position: {config.starFadePosition}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={config.starFadePosition}
                  onChange={(e) => updateConfig('starFadePosition', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Feather Size: {config.starFadeFeatherSize}px</label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={config.starFadeFeatherSize}
                  onChange={(e) => updateConfig('starFadeFeatherSize', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 🎨 Logo */}
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

        {/* 📝 Description */}
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <h3 className="text-sm font-semibold text-cyan-400 mb-3">📝 Description</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Font</label>
              <select
                value={config.selectedFont}
                onChange={(e) => updateConfig('selectedFont', e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs"
              >
                {fonts.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Font Size: {config.descriptionFontSize}px</label>
              <input
                type="range"
                min="12"
                max="32"
                step="1"
                value={config.descriptionFontSize}
                onChange={(e) => updateConfig('descriptionFontSize', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Color</label>
              <select
                value={config.descriptionColor}
                onChange={(e) => updateConfig('descriptionColor', e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs"
              >
                {colorOptions.map(opt => (
                  <option key={opt.class} value={opt.class}>{opt.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">X Offset: {config.descriptionXOffset}px</label>
              <input
                type="range"
                min="-200"
                max="200"
                step="5"
                value={config.descriptionXOffset}
                onChange={(e) => updateConfig('descriptionXOffset', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Y Offset: {config.descriptionYOffset}px</label>
              <input
                type="range"
                min="-200"
                max="200"
                step="5"
                value={config.descriptionYOffset}
                onChange={(e) => updateConfig('descriptionYOffset', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Card Blur: {config.descriptionCardBlur}px</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.descriptionCardBlur}
                onChange={(e) => updateConfig('descriptionCardBlur', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Card Darkness: {config.descriptionCardDarkness}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.descriptionCardDarkness}
                onChange={(e) => updateConfig('descriptionCardDarkness', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.descriptionCardBorder}
                onChange={(e) => updateConfig('descriptionCardBorder', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs text-gray-300">Show Border</span>
            </label>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Text</label>
              <textarea
                value={config.descriptionText}
                onChange={(e) => updateConfig('descriptionText', e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* 💨 Motion Blur */}
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <h3 className="text-sm font-semibold text-pink-400 mb-3">💨 Motion Blur</h3>

          <div className="mb-3">
            <h4 className="text-xs text-gray-300 font-semibold mb-2">Layer 1</h4>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={config.motionBlurEnabled}
                onChange={(e) => updateConfig('motionBlurEnabled', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs text-gray-300">Enable</span>
            </label>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Intensity: {config.blurIntensity}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.blurIntensity}
                onChange={(e) => updateConfig('blurIntensity', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="border-t border-gray-700 pt-3">
            <h4 className="text-xs text-gray-300 font-semibold mb-2">Layer 2</h4>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={config.motionBlurEnabled2}
                onChange={(e) => updateConfig('motionBlurEnabled2', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs text-gray-300">Enable</span>
            </label>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Intensity: {config.blurIntensity2}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.blurIntensity2}
                onChange={(e) => updateConfig('blurIntensity2', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 📊 Phase Carousel */}
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <h3 className="text-sm font-semibold text-green-400 mb-3">📊 Phase Carousel</h3>

          <div className="space-y-3">
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

            <div>
              <label className="block text-xs text-gray-400 mb-1">Column Y Offset: {config.phaseColumnYOffset}px</label>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={config.phaseColumnYOffset}
                onChange={(e) => updateConfig('phaseColumnYOffset', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
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

            <div>
              <label className="block text-xs text-gray-400 mb-1">Selected Blur: {config.phaseBlurAmountSelected}px</label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={config.phaseBlurAmountSelected}
                onChange={(e) => updateConfig('phaseBlurAmountSelected', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Image Darkening: {config.phaseImageDarkening}%</label>
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

            <div>
              <label className="block text-xs text-gray-400 mb-1">Hover Darkening: {config.phaseHoverDarkeningIntensity}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.phaseHoverDarkeningIntensity}
                onChange={(e) => updateConfig('phaseHoverDarkeningIntensity', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Idle Backdrop Blur: {config.phaseIdleBackdropBlur}px</label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={config.phaseIdleBackdropBlur}
                onChange={(e) => updateConfig('phaseIdleBackdropBlur', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Fade Position: {config.phaseFadePosition}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.phaseFadePosition}
                onChange={(e) => updateConfig('phaseFadePosition', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Blend Mode</label>
              <select
                value={config.phaseImageBlendMode}
                onChange={(e) => updateConfig('phaseImageBlendMode', e.target.value as any)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs"
              >
                {blendModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Header Font</label>
              <select
                value={config.phaseHeaderFont}
                onChange={(e) => updateConfig('phaseHeaderFont', e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs"
              >
                {fonts.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Header Font Size: {config.phaseHeaderFontSize}px</label>
              <input
                type="range"
                min="24"
                max="72"
                step="2"
                value={config.phaseHeaderFontSize}
                onChange={(e) => updateConfig('phaseHeaderFontSize', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Header Color</label>
              <select
                value={config.phaseHeaderColor}
                onChange={(e) => updateConfig('phaseHeaderColor', e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs"
              >
                {colorOptions.map(opt => (
                  <option key={opt.class} value={opt.class}>{opt.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Description Font</label>
              <select
                value={config.phaseDescriptionFont}
                onChange={(e) => updateConfig('phaseDescriptionFont', e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs"
              >
                {fonts.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Description Font Size: {config.phaseDescriptionFontSize}px</label>
              <input
                type="range"
                min="12"
                max="24"
                step="1"
                value={config.phaseDescriptionFontSize}
                onChange={(e) => updateConfig('phaseDescriptionFontSize', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 🎵 Audio Controls */}
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <h3 className="text-sm font-semibold text-yellow-400 mb-3">🎵 Audio Controls</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Logo Fade Duration: {config.logoFadeDuration}ms</label>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={config.logoFadeDuration}
                onChange={(e) => updateConfig('logoFadeDuration', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Backdrop Darkness: {config.lightboxBackdropDarkness}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.lightboxBackdropDarkness}
                onChange={(e) => updateConfig('lightboxBackdropDarkness', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Toggle Size: {config.audioToggleSize}px</label>
              <input
                type="range"
                min="48"
                max="200"
                step="8"
                value={config.audioToggleSize}
                onChange={(e) => updateConfig('audioToggleSize', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Toggle Scale: {config.audioToggleScale.toFixed(1)}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={config.audioToggleScale}
                onChange={(e) => updateConfig('audioToggleScale', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Toggle Text Gap: {config.toggleTextGap}px</label>
              <input
                type="range"
                min="0"
                max="48"
                step="4"
                value={config.toggleTextGap}
                onChange={(e) => updateConfig('toggleTextGap', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Proceed Button Size: {config.proceedButtonSize.toFixed(1)}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={config.proceedButtonSize}
                onChange={(e) => updateConfig('proceedButtonSize', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Consent Fade: {config.audioConsentFadeDuration}ms</label>
              <input
                type="range"
                min="0"
                max="2000"
                step="100"
                value={config.audioConsentFadeDuration}
                onChange={(e) => updateConfig('audioConsentFadeDuration', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Sound Label Font</label>
              <select
                value={config.soundLabelFont}
                onChange={(e) => updateConfig('soundLabelFont', e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs"
              >
                {fonts.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Sound Label Size: {config.soundLabelSize}px</label>
              <input
                type="range"
                min="12"
                max="32"
                step="1"
                value={config.soundLabelSize}
                onChange={(e) => updateConfig('soundLabelSize', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Sound Label Color</label>
              <select
                value={config.soundLabelColor}
                onChange={(e) => updateConfig('soundLabelColor', e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs"
              >
                {colorOptions.map(opt => (
                  <option key={opt.class} value={opt.class}>{opt.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Label Vertical Offset: {config.soundLabelVerticalOffset}px</label>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={config.soundLabelVerticalOffset}
                onChange={(e) => updateConfig('soundLabelVerticalOffset', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Label Horizontal Offset: {config.soundLabelHorizontalOffset}px</label>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={config.soundLabelHorizontalOffset}
                onChange={(e) => updateConfig('soundLabelHorizontalOffset', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Power Button Scale: {config.powerButtonScale.toFixed(1)}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={config.powerButtonScale}
                onChange={(e) => updateConfig('powerButtonScale', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Power Button Vertical: {config.powerButtonVerticalOffset}px</label>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={config.powerButtonVerticalOffset}
                onChange={(e) => updateConfig('powerButtonVerticalOffset', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Power Button Horizontal: {config.powerButtonHorizontalOffset}px</label>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={config.powerButtonHorizontalOffset}
                onChange={(e) => updateConfig('powerButtonHorizontalOffset', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.powerButtonGlowEnabled}
                onChange={(e) => updateConfig('powerButtonGlowEnabled', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs text-gray-300">Power Button Glow</span>
            </label>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Speaker Icon Style</label>
              <select
                value={config.speakerIconStyle}
                onChange={(e) => updateConfig('speakerIconStyle', e.target.value as any)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs"
              >
                {speakerIconStyles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Description Text</label>
              <textarea
                value={config.audioDescriptionText}
                onChange={(e) => updateConfig('audioDescriptionText', e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* 🎯 Join Beta Button */}
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <h3 className="text-sm font-semibold text-orange-400 mb-3">🎯 Join Beta Button</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Font</label>
              <select
                value={config.joinBetaFont}
                onChange={(e) => updateConfig('joinBetaFont', e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs"
              >
                {fonts.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Font Size: {config.joinBetaFontSize}px</label>
              <input
                type="range"
                min="16"
                max="64"
                step="2"
                value={config.joinBetaFontSize}
                onChange={(e) => updateConfig('joinBetaFontSize', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Color</label>
              <select
                value={config.joinBetaColor}
                onChange={(e) => updateConfig('joinBetaColor', e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs"
              >
                {colorOptions.map(opt => (
                  <option key={opt.class} value={opt.class}>{opt.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Horizontal Offset: {config.joinBetaHorizontalOffset}px</label>
              <input
                type="range"
                min="-200"
                max="200"
                step="5"
                value={config.joinBetaHorizontalOffset}
                onChange={(e) => updateConfig('joinBetaHorizontalOffset', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Vertical Offset: {config.joinBetaVerticalOffset}px</label>
              <input
                type="range"
                min="-200"
                max="200"
                step="5"
                value={config.joinBetaVerticalOffset}
                onChange={(e) => updateConfig('joinBetaVerticalOffset', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 🔗 Footer */}
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <h3 className="text-sm font-semibold text-yellow-400 mb-3">🔗 Footer</h3>

          <div className="space-y-3">
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

            <div>
              <label className="block text-xs text-gray-400 mb-1">Image Vertical Position: {config.footerImageVerticalPosition}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.footerImageVerticalPosition}
                onChange={(e) => updateConfig('footerImageVerticalPosition', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
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

            <div>
              <label className="block text-xs text-gray-400 mb-1">Edge Feathering: {config.footerEdgeFeathering}px</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.footerEdgeFeathering}
                onChange={(e) => updateConfig('footerEdgeFeathering', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">OE Logo Scale: {config.oeLogoScale.toFixed(1)}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={config.oeLogoScale}
                onChange={(e) => updateConfig('oeLogoScale', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Social Icon Scale: {config.socialIconScale.toFixed(1)}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={config.socialIconScale}
                onChange={(e) => updateConfig('socialIconScale', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Social Icon Gap: {config.socialIconGap}px</label>
              <input
                type="range"
                min="8"
                max="64"
                step="4"
                value={config.socialIconGap}
                onChange={(e) => updateConfig('socialIconGap', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Social Icon Vertical: {config.socialIconVerticalPosition}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.socialIconVerticalPosition}
                onChange={(e) => updateConfig('socialIconVerticalPosition', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Padding Top: {config.socialIconPaddingTop}px</label>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={config.socialIconPaddingTop}
                onChange={(e) => updateConfig('socialIconPaddingTop', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Padding Bottom: {config.socialIconPaddingBottom}px</label>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={config.socialIconPaddingBottom}
                onChange={(e) => updateConfig('socialIconPaddingBottom', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 📱 Mobile Settings */}
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <h3 className="text-sm font-semibold text-teal-400 mb-3">📱 Mobile Settings</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Breakpoint: {config.mobileBreakpoint}px</label>
              <input
                type="range"
                min="640"
                max="1280"
                step="64"
                value={config.mobileBreakpoint}
                onChange={(e) => updateConfig('mobileBreakpoint', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Phase/Footer Spacing: {config.mobilePhaseFooterSpacing}px</label>
              <input
                type="range"
                min="0"
                max="100"
                step="8"
                value={config.mobilePhaseFooterSpacing}
                onChange={(e) => updateConfig('mobilePhaseFooterSpacing', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Phase Button Max Width: {config.mobilePhaseButtonMaxWidth}px</label>
              <input
                type="range"
                min="300"
                max="800"
                step="50"
                value={config.mobilePhaseButtonMaxWidth}
                onChange={(e) => updateConfig('mobilePhaseButtonMaxWidth', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Background Y Position */}
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">🌌 Background</h3>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Y Position: {config.bgYPosition}px</label>
            <input
              type="range"
              min="-500"
              max="500"
              step="10"
              value={config.bgYPosition}
              onChange={(e) => updateConfig('bgYPosition', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
