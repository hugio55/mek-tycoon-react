'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// Debug control configuration storage key
const STORAGE_KEY = 'mek-landing-debug-config';

// Default values matching landing page
const DEFAULT_CONFIG = {
  starScale: 1,
  starSpeed: 3,
  starFrequency: 200,
  starScale2: 1,
  starSpeed2: 10,
  starFrequency2: 100,
  lineLength2: 2,
  starScale3: 1,
  starSpeed3: 10,
  starFrequency3: 100,
  lineLength3: 2,
  logoSize: 600,
  logoYPosition: 50,
  selectedFont: 'Orbitron',
  descriptionFontSize: 18,
  bgYPosition: 0,
  motionBlurEnabled: true,
  blurIntensity: 50,
  descriptionColor: 'text-yellow-400/90',
  designVariation: 'modern' as 'modern' | 'industrial' | 'neon',
  soundLabelFont: 'Orbitron',
  soundLabelSize: 16,
  soundLabelColor: 'text-yellow-400/90',
  soundLabelVerticalOffset: 0,
  soundLabelHorizontalOffset: 0,
  motionBlurEnabled2: false,
  blurIntensity2: 50,
  powerButtonScale: 1,
  powerButtonVerticalOffset: 0,
  powerButtonHorizontalOffset: 0,
  powerButtonGlowEnabled: true,
};

export default function LandingDebugPage() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [viewMode, setViewMode] = useState<'controls-only' | 'split-view'>('controls-only');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [selectedTypographyElement, setSelectedTypographyElement] = useState<'description' | 'soundLabel'>('description');

  // Available fonts for testing
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

  // Description text color options
  const colorOptions = [
    { name: 'White', class: 'text-white' },
    { name: 'Light Gray', class: 'text-gray-300' },
    { name: 'Medium Gray', class: 'text-gray-400' },
    { name: 'Dark Gray', class: 'text-gray-500' },
    { name: 'Yellow', class: 'text-yellow-400/90' }
  ];

  // Load config from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      } catch (e) {
        console.error('Failed to parse stored config:', e);
      }
    }
  }, []);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Dispatch storage event to notify other tabs
    window.dispatchEvent(new Event('storage'));
  }, [config]);

  const updateConfig = (key: keyof typeof config, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const handleSave = () => {
    // Trigger save state animation
    setSaveState('saving');

    // Ensure config is saved to localStorage (already happens automatically, but this is explicit)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    // Dispatch storage event to notify other tabs
    window.dispatchEvent(new Event('storage'));

    // Brief saving state
    setTimeout(() => {
      setSaveState('saved');

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveState('idle');
      }, 2000);
    }, 300);
  };

  return (
    <div className={`min-h-screen ${viewMode === 'split-view' ? 'flex' : 'bg-gray-900 p-3'}`}>
      <div className={viewMode === 'split-view' ? 'w-1/2 bg-gray-800 p-3 overflow-y-auto border-r border-gray-700' : 'max-w-5xl mx-auto'}>
        {/* Header */}
        <div className="mb-3">
          <h1 className="text-lg font-semibold text-gray-100 mb-1">
            Landing Page Debug Controls
          </h1>
          <p className="text-xs text-gray-400">
            Open <code className="bg-gray-700 px-1 py-0.5 rounded text-gray-200 text-xs">/landing</code> in another tab to see changes in real-time
          </p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <a
              href="/landing"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs hover:bg-gray-600"
            >
              Open Landing Page
            </a>
            <button
              onClick={() => setViewMode(viewMode === 'controls-only' ? 'split-view' : 'controls-only')}
              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs hover:bg-gray-600"
            >
              {viewMode === 'controls-only' ? 'Show Preview' : 'Hide Preview'}
            </button>
            <button
              onClick={handleSave}
              disabled={saveState === 'saving'}
              className={`px-2 py-1 rounded text-xs ${
                saveState === 'saved'
                  ? 'bg-blue-900/50 border border-blue-700 text-blue-200'
                  : saveState === 'saving'
                  ? 'bg-gray-700 border border-gray-600 text-gray-500 cursor-wait'
                  : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {saveState === 'saved' ? 'Settings Saved' : saveState === 'saving' ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={resetToDefaults}
              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs hover:bg-gray-600"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Debug Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

          {/* Star Controls Section - Layer 1 */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Layer 1 Star Field
            </h2>

            {/* Star Scale */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Star Scale
              </label>
              <input
                type="range"
                min="0.3"
                max="3"
                step="0.1"
                value={config.starScale}
                onChange={(e) => updateConfig('starScale', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.starScale.toFixed(1)}x
              </div>
            </div>

            {/* Star Speed */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Star Speed
              </label>
              <input
                type="range"
                min="0.5"
                max="30"
                step="0.5"
                value={config.starSpeed}
                onChange={(e) => updateConfig('starSpeed', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.starSpeed.toFixed(1)}x
              </div>
            </div>

            {/* Star Density */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Star Density
              </label>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={config.starFrequency}
                onChange={(e) => updateConfig('starFrequency', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.starFrequency} stars
              </div>
            </div>
          </div>

          {/* Star Controls Section - Layer 2 */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Layer 2 Star Field
            </h2>

            {/* Star Scale 2 */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Star Scale
              </label>
              <input
                type="range"
                min="0.3"
                max="3"
                step="0.1"
                value={config.starScale2}
                onChange={(e) => updateConfig('starScale2', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.starScale2.toFixed(1)}x
              </div>
            </div>

            {/* Star Speed 2 */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Star Speed
              </label>
              <input
                type="range"
                min="0.5"
                max="75"
                step="0.5"
                value={config.starSpeed2}
                onChange={(e) => updateConfig('starSpeed2', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.starSpeed2.toFixed(1)}x
              </div>
            </div>

            {/* Star Density 2 */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Star Density
              </label>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={config.starFrequency2}
                onChange={(e) => updateConfig('starFrequency2', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.starFrequency2} stars
              </div>
            </div>

            {/* Line Length 2 */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Line Length
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={config.lineLength2}
                onChange={(e) => updateConfig('lineLength2', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.lineLength2.toFixed(1)}x
              </div>
            </div>
          </div>

          {/* Star Controls Section - Layer 3 */}
          <div className="bg-gray-800 border border-purple-500 rounded p-3">
            <h2 className="text-sm font-semibold text-purple-400 mb-2 pb-1 border-b border-purple-700">
              Layer 3 Star Field
            </h2>

            {/* Star Scale 3 */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Star Scale
              </label>
              <input
                type="range"
                min="0.3"
                max="3"
                step="0.1"
                value={config.starScale3}
                onChange={(e) => updateConfig('starScale3', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.starScale3.toFixed(1)}x
              </div>
            </div>

            {/* Star Speed 3 */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Star Speed
              </label>
              <input
                type="range"
                min="0.5"
                max="125"
                step="0.5"
                value={config.starSpeed3}
                onChange={(e) => updateConfig('starSpeed3', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.starSpeed3.toFixed(1)}x
              </div>
            </div>

            {/* Star Density 3 */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Star Density
              </label>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={config.starFrequency3}
                onChange={(e) => updateConfig('starFrequency3', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.starFrequency3} stars
              </div>
            </div>

            {/* Line Length 3 */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Line Length
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={config.lineLength3}
                onChange={(e) => updateConfig('lineLength3', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.lineLength3.toFixed(1)}x
              </div>
            </div>
          </div>

          {/* Layout Controls Section */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Layout & Positioning
            </h2>

            {/* Logo Size */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Logo Size
              </label>
              <input
                type="range"
                min="200"
                max="1000"
                step="10"
                value={config.logoSize}
                onChange={(e) => updateConfig('logoSize', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.logoSize}px
              </div>
            </div>

            {/* Logo Y Position */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Logo Vertical Position
              </label>
              <input
                type="range"
                min="20"
                max="80"
                step="1"
                value={config.logoYPosition}
                onChange={(e) => updateConfig('logoYPosition', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.logoYPosition}% from top
              </div>
            </div>

            {/* Background Y Position */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Background Vertical Position
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={config.bgYPosition}
                onChange={(e) => updateConfig('bgYPosition', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.bgYPosition}%
              </div>
            </div>
          </div>

          {/* Motion Blur Controls Section */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Motion Blur Effects
            </h2>

            {/* Motion Blur Enabled Toggle */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Enable Motion Blur
              </label>
              <button
                onClick={() => updateConfig('motionBlurEnabled', !config.motionBlurEnabled)}
                className={`w-full px-2 py-1 text-xs rounded ${
                  config.motionBlurEnabled
                    ? 'bg-blue-900/50 border border-blue-700 text-blue-200'
                    : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {config.motionBlurEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Blur Intensity */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Blur Intensity
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.blurIntensity}
                onChange={(e) => updateConfig('blurIntensity', parseInt(e.target.value))}
                className="w-full"
                disabled={!config.motionBlurEnabled}
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.blurIntensity}%
              </div>
            </div>
          </div>

          {/* Typography Controls Section */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Typography
            </h2>

            {/* Element Selector Dropdown */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Edit Element
              </label>
              <select
                value={selectedTypographyElement}
                onChange={(e) => setSelectedTypographyElement(e.target.value as 'description' | 'soundLabel')}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-gray-500"
              >
                <option value="description">Description Text</option>
                <option value="soundLabel">Sound Label</option>
              </select>
            </div>

            {/* Font Family */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Font Family
              </label>
              <select
                value={selectedTypographyElement === 'description' ? config.selectedFont : config.soundLabelFont}
                onChange={(e) => updateConfig(
                  selectedTypographyElement === 'description' ? 'selectedFont' : 'soundLabelFont',
                  e.target.value
                )}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-gray-500"
                style={{ fontFamily: selectedTypographyElement === 'description' ? config.selectedFont : config.soundLabelFont }}
              >
                {fonts.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Font Size
              </label>
              <input
                type="range"
                min="10"
                max="32"
                step="1"
                value={selectedTypographyElement === 'description' ? config.descriptionFontSize : config.soundLabelSize}
                onChange={(e) => updateConfig(
                  selectedTypographyElement === 'description' ? 'descriptionFontSize' : 'soundLabelSize',
                  parseInt(e.target.value)
                )}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {selectedTypographyElement === 'description' ? config.descriptionFontSize : config.soundLabelSize}px
              </div>
            </div>

            {/* Color */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Color
              </label>
              <select
                value={selectedTypographyElement === 'description' ? config.descriptionColor : config.soundLabelColor}
                onChange={(e) => updateConfig(
                  selectedTypographyElement === 'description' ? 'descriptionColor' : 'soundLabelColor',
                  e.target.value
                )}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-gray-500"
              >
                {colorOptions.map((color) => (
                  <option key={color.class} value={color.class}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vertical Offset (Sound Label Only) */}
            {selectedTypographyElement === 'soundLabel' && (
              <>
                <div className="mb-2">
                  <label className="block text-xs text-gray-300 mb-1">
                    Vertical Offset
                  </label>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="1"
                    value={config.soundLabelVerticalOffset}
                    onChange={(e) => updateConfig('soundLabelVerticalOffset', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center mt-0.5">
                    {config.soundLabelVerticalOffset}px
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block text-xs text-gray-300 mb-1">
                    Horizontal Offset
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={config.soundLabelHorizontalOffset}
                    onChange={(e) => updateConfig('soundLabelHorizontalOffset', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center mt-0.5">
                    {config.soundLabelHorizontalOffset}px
                  </div>
                </div>
              </>
            )}

            {/* Preview Text */}
            <div className="mt-2 p-2 bg-gray-900 rounded border border-gray-700">
              <p className="text-[10px] text-gray-500 mb-1">Preview:</p>
              {selectedTypographyElement === 'description' ? (
                <p
                  className={config.descriptionColor}
                  style={{
                    fontFamily: config.selectedFont,
                    fontSize: `${config.descriptionFontSize}px`
                  }}
                >
                  A futuristic idle tycoon game featuring collectible Mek NFTs.
                </p>
              ) : (
                <div className="flex justify-center">
                  <p
                    className={`${config.soundLabelColor} uppercase tracking-wider`}
                    style={{
                      fontFamily: config.soundLabelFont,
                      fontSize: `${config.soundLabelSize}px`
                    }}
                  >
                    soundwaves
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Phase Carousel Design Section */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Phase Carousel Design
            </h2>

            {/* Design Variation */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Design Variation
              </label>
              <div className="space-y-1">
                {(['modern', 'industrial', 'neon'] as const).map((variation) => (
                  <button
                    key={variation}
                    onClick={() => updateConfig('designVariation', variation)}
                    className={`w-full px-2 py-1 text-xs rounded ${
                      config.designVariation === variation
                        ? 'bg-blue-900/50 border border-blue-700 text-blue-200'
                        : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {variation}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Power Button & Sound Label Controls Section */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Power Button & Sound Label
            </h2>
            <p className="text-xs text-gray-400 mb-2">
              Fixed top-right corner • Horizontal layout
            </p>

            {/* Power Button Scale */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Button Scale
              </label>
              <input
                type="range"
                min="0.3"
                max="1.5"
                step="0.05"
                value={config.powerButtonScale}
                onChange={(e) => updateConfig('powerButtonScale', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.powerButtonScale.toFixed(2)}x
              </div>
            </div>

            {/* Power Button Vertical Offset */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Button Vertical Offset
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={config.powerButtonVerticalOffset}
                onChange={(e) => updateConfig('powerButtonVerticalOffset', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.powerButtonVerticalOffset}px
              </div>
            </div>

            {/* Power Button Horizontal Offset */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Button Horizontal Offset
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={config.powerButtonHorizontalOffset}
                onChange={(e) => updateConfig('powerButtonHorizontalOffset', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.powerButtonHorizontalOffset}px
              </div>
            </div>

            {/* Flashing Glow Effect Toggle */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Flashing Glow Effect
              </label>
              <button
                onClick={() => updateConfig('powerButtonGlowEnabled', !config.powerButtonGlowEnabled)}
                className={`w-full px-2 py-1 text-xs rounded ${
                  config.powerButtonGlowEnabled
                    ? 'bg-blue-900/50 border border-blue-700 text-blue-200'
                    : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {config.powerButtonGlowEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Live Preview Section (Split View Only) */}
      {viewMode === 'split-view' && (
        <div className="w-1/2 bg-gray-950 relative flex flex-col">
          <div className="bg-gray-800 border-b border-gray-700 p-2">
            <h2 className="text-gray-100 text-sm font-semibold">
              Live Preview
            </h2>
            <p className="text-gray-400 text-[10px] mt-0.5">
              Changes update in real-time via localStorage sync
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              src="/landing"
              className="w-full h-full border-0"
              title="Landing Page Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
