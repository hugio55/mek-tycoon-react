'use client';

import { useEffect, useState } from 'react';

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
  logoSize: 600,
  logoYPosition: 50,
  selectedFont: 'Orbitron',
  descriptionFontSize: 18,
  bgYPosition: 0,
  motionBlurEnabled: true,
  blurIntensity: 50,
  descriptionColor: 'text-yellow-400/90',
  designVariation: 'modern' as 'modern' | 'industrial' | 'neon',
};

export default function LandingDebugPage() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [viewMode, setViewMode] = useState<'controls-only' | 'split-view'>('controls-only');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

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
    <div className={`min-h-screen ${viewMode === 'split-view' ? 'flex' : 'bg-gradient-to-br from-black via-gray-900 to-black p-6'}`}>
      <div className={viewMode === 'split-view' ? 'w-1/2 bg-gradient-to-br from-black via-gray-900 to-black p-4 overflow-y-auto border-r-2 border-yellow-500/50' : 'max-w-4xl mx-auto'}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-orbitron uppercase tracking-wider text-yellow-400 mb-1.5">
            Landing Page Debug Controls
          </h1>
          <p className="text-gray-400 text-xs">
            Open <code className="bg-black/50 px-1.5 py-0.5 rounded text-yellow-500">/landing</code> in another tab to see changes in real-time
          </p>
          <div className="mt-3 flex gap-3 flex-wrap">
            <a
              href="/landing"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 font-orbitron text-xs uppercase tracking-wide hover:bg-yellow-500/30 transition-all"
            >
              Open Landing Page
            </a>
            <button
              onClick={() => setViewMode(viewMode === 'controls-only' ? 'split-view' : 'controls-only')}
              className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/50 rounded text-blue-400 font-orbitron text-xs uppercase tracking-wide hover:bg-blue-500/30 transition-all"
            >
              {viewMode === 'controls-only' ? 'Show Preview' : 'Hide Preview'}
            </button>
            <button
              onClick={handleSave}
              disabled={saveState === 'saving'}
              className={`px-3 py-1.5 rounded font-orbitron text-xs uppercase tracking-wide transition-all ${
                saveState === 'saved'
                  ? 'bg-green-500/40 border-2 border-green-400 text-green-300'
                  : saveState === 'saving'
                  ? 'bg-yellow-500/30 border border-yellow-400/70 text-yellow-300 cursor-wait'
                  : 'bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30'
              }`}
            >
              {saveState === 'saved' ? '✓ Settings Saved!' : saveState === 'saving' ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={resetToDefaults}
              className="px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded text-red-400 font-orbitron text-xs uppercase tracking-wide hover:bg-red-500/30 transition-all"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Debug Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Star Controls Section - Layer 1 */}
          <div className="bg-black/40 backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg p-4">
            <h2 className="text-base font-orbitron uppercase text-yellow-400 mb-3 border-b border-yellow-500/30 pb-1.5">
              <span className="text-yellow-500">Layer 1</span> Star Field Controls
            </h2>

            {/* Star Scale */}
            <div className="mb-3">
              <label className="block text-yellow-400/80 font-orbitron text-xs uppercase tracking-wide mb-1.5">
                Star Scale
              </label>
              <input
                type="range"
                min="0.3"
                max="3"
                step="0.1"
                value={config.starScale}
                onChange={(e) => updateConfig('starScale', parseFloat(e.target.value))}
                className="w-full debug-slider"
              />
              <div className="text-yellow-500 text-xs font-mono text-center mt-0.5">
                {config.starScale.toFixed(1)}x
              </div>
            </div>

            {/* Star Speed */}
            <div className="mb-3">
              <label className="block text-yellow-400/80 font-orbitron text-xs uppercase tracking-wide mb-1.5">
                Star Speed
              </label>
              <input
                type="range"
                min="0.5"
                max="30"
                step="0.5"
                value={config.starSpeed}
                onChange={(e) => updateConfig('starSpeed', parseFloat(e.target.value))}
                className="w-full debug-slider"
              />
              <div className="text-yellow-500 text-xs font-mono text-center mt-0.5">
                {config.starSpeed.toFixed(1)}x
              </div>
            </div>

            {/* Star Density */}
            <div className="mb-3">
              <label className="block text-yellow-400/80 font-orbitron text-xs uppercase tracking-wide mb-1.5">
                Star Density
              </label>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={config.starFrequency}
                onChange={(e) => updateConfig('starFrequency', parseInt(e.target.value))}
                className="w-full debug-slider"
              />
              <div className="text-yellow-500 text-xs font-mono text-center mt-0.5">
                {config.starFrequency} stars
              </div>
            </div>

            {/* Motion Blur Toggle */}
            <div className="mb-3">
              <label className="block text-yellow-400/80 font-orbitron text-xs uppercase tracking-wide mb-1.5">
                Motion Blur
              </label>
              <button
                onClick={() => updateConfig('motionBlurEnabled', !config.motionBlurEnabled)}
                className={`w-full px-3 py-1.5 rounded text-xs font-orbitron uppercase tracking-wide transition-all ${
                  config.motionBlurEnabled
                    ? 'bg-yellow-500/30 border-2 border-yellow-500/70 text-yellow-400'
                    : 'bg-black/50 border-2 border-yellow-500/30 text-yellow-500/50'
                }`}
              >
                {config.motionBlurEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            {/* Blur Intensity */}
            {config.motionBlurEnabled && (
              <div className="mb-3">
                <label className="block text-yellow-400/80 font-orbitron text-xs uppercase tracking-wide mb-1.5">
                  Blur Intensity
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={config.blurIntensity}
                  onChange={(e) => updateConfig('blurIntensity', parseInt(e.target.value))}
                  className="w-full debug-slider"
                />
                <div className="text-yellow-500 text-xs font-mono text-center mt-0.5">
                  {config.blurIntensity}%
                </div>
              </div>
            )}
          </div>

          {/* Star Controls Section - Layer 2 */}
          <div className="bg-black/40 backdrop-blur-sm border-2 border-blue-500/50 rounded-lg p-4">
            <h2 className="text-base font-orbitron uppercase text-blue-400 mb-3 border-b border-blue-500/30 pb-1.5">
              <span className="text-blue-500">Layer 2</span> Star Field Controls
            </h2>

            {/* Star Scale 2 */}
            <div className="mb-3">
              <label className="block text-blue-400/80 font-orbitron text-xs uppercase tracking-wide mb-1.5">
                Star Scale
              </label>
              <input
                type="range"
                min="0.3"
                max="3"
                step="0.1"
                value={config.starScale2}
                onChange={(e) => updateConfig('starScale2', parseFloat(e.target.value))}
                className="w-full debug-slider"
              />
              <div className="text-blue-500 text-xs font-mono text-center mt-0.5">
                {config.starScale2.toFixed(1)}x
              </div>
            </div>

            {/* Star Speed 2 */}
            <div className="mb-3">
              <label className="block text-blue-400/80 font-orbitron text-xs uppercase tracking-wide mb-1.5">
                Star Speed
              </label>
              <input
                type="range"
                min="0.5"
                max="75"
                step="0.5"
                value={config.starSpeed2}
                onChange={(e) => updateConfig('starSpeed2', parseFloat(e.target.value))}
                className="w-full debug-slider"
              />
              <div className="text-blue-500 text-xs font-mono text-center mt-0.5">
                {config.starSpeed2.toFixed(1)}x
              </div>
            </div>

            {/* Star Density 2 */}
            <div className="mb-3">
              <label className="block text-blue-400/80 font-orbitron text-xs uppercase tracking-wide mb-1.5">
                Star Density
              </label>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={config.starFrequency2}
                onChange={(e) => updateConfig('starFrequency2', parseInt(e.target.value))}
                className="w-full debug-slider"
              />
              <div className="text-blue-500 text-xs font-mono text-center mt-0.5">
                {config.starFrequency2} stars
              </div>
            </div>
          </div>

          {/* Layout Controls Section */}
          <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-4">
            <h2 className="text-base font-orbitron uppercase text-yellow-400 mb-3 border-b border-yellow-500/30 pb-1.5">
              Layout & Positioning
            </h2>

            {/* Logo Size */}
            <div className="mb-3">
              <label className="block text-yellow-400/80 font-orbitron text-xs uppercase tracking-wide mb-1.5">
                Logo Size
              </label>
              <input
                type="range"
                min="200"
                max="1000"
                step="10"
                value={config.logoSize}
                onChange={(e) => updateConfig('logoSize', parseInt(e.target.value))}
                className="w-full debug-slider"
              />
              <div className="text-yellow-500 text-xs font-mono text-center mt-0.5">
                {config.logoSize}px
              </div>
            </div>

            {/* Logo Y Position */}
            <div className="mb-3">
              <label className="block text-yellow-400/80 font-orbitron text-xs uppercase tracking-wide mb-1.5">
                Logo Vertical Position
              </label>
              <input
                type="range"
                min="20"
                max="80"
                step="1"
                value={config.logoYPosition}
                onChange={(e) => updateConfig('logoYPosition', parseInt(e.target.value))}
                className="w-full debug-slider"
              />
              <div className="text-yellow-500 text-xs font-mono text-center mt-0.5">
                {config.logoYPosition}% from top
              </div>
            </div>

            {/* Background Y Position */}
            <div className="mb-3">
              <label className="block text-yellow-400/80 font-orbitron text-xs uppercase tracking-wide mb-1.5">
                Background Vertical Position
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={config.bgYPosition}
                onChange={(e) => updateConfig('bgYPosition', parseInt(e.target.value))}
                className="w-full debug-slider"
              />
              <div className="text-yellow-500 text-xs font-mono text-center mt-0.5">
                {config.bgYPosition}%
              </div>
            </div>
          </div>

          {/* Typography Controls Section */}
          <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-4">
            <h2 className="text-base font-orbitron uppercase text-yellow-400 mb-3 border-b border-yellow-500/30 pb-1.5">
              Typography
            </h2>

            {/* Font Family */}
            <div className="mb-3">
              <label className="block text-yellow-400/80 font-orbitron text-xs uppercase tracking-wide mb-1.5">
                Font Family
              </label>
              <select
                value={config.selectedFont}
                onChange={(e) => updateConfig('selectedFont', e.target.value)}
                className="w-full bg-black/90 border border-yellow-500/50 rounded px-2 py-1.5 text-yellow-400 text-xs font-orbitron uppercase cursor-pointer hover:border-yellow-400/70 transition-all focus:outline-none focus:border-yellow-400"
                style={{ fontFamily: config.selectedFont }}
              >
                {fonts.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Font Size */}
            <div className="mb-3">
              <label className="block text-yellow-400/80 font-orbitron text-xs uppercase tracking-wide mb-1.5">
                Description Font Size
              </label>
              <input
                type="range"
                min="10"
                max="32"
                step="1"
                value={config.descriptionFontSize}
                onChange={(e) => updateConfig('descriptionFontSize', parseInt(e.target.value))}
                className="w-full debug-slider"
              />
              <div className="text-yellow-500 text-xs font-mono text-center mt-0.5">
                {config.descriptionFontSize}px
              </div>
            </div>

            {/* Description Color */}
            <div className="mb-3">
              <label className="block text-yellow-400/80 font-orbitron text-xs uppercase tracking-wide mb-1.5">
                Description Color
              </label>
              <select
                value={config.descriptionColor}
                onChange={(e) => updateConfig('descriptionColor', e.target.value)}
                className="w-full bg-black/90 border border-yellow-500/50 rounded px-2 py-1.5 text-yellow-400 text-xs font-orbitron uppercase cursor-pointer hover:border-yellow-400/70 transition-all focus:outline-none focus:border-yellow-400"
              >
                {colorOptions.map((color) => (
                  <option key={color.class} value={color.class}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview Text */}
            <div className="mt-4 p-3 bg-black/50 rounded border border-yellow-500/20">
              <p className="text-[10px] text-yellow-500/50 mb-1.5 font-orbitron uppercase">Preview:</p>
              <p
                className={config.descriptionColor}
                style={{
                  fontFamily: config.selectedFont,
                  fontSize: `${config.descriptionFontSize}px`
                }}
              >
                A futuristic idle tycoon game featuring collectible Mek NFTs.
              </p>
            </div>
          </div>

          {/* Phase Carousel Design Section */}
          <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-4">
            <h2 className="text-base font-orbitron uppercase text-yellow-400 mb-3 border-b border-yellow-500/30 pb-1.5">
              Phase Carousel Design
            </h2>

            {/* Design Variation */}
            <div className="mb-3">
              <label className="block text-yellow-400/80 font-orbitron text-xs uppercase tracking-wide mb-2">
                Design Variation
              </label>
              <div className="space-y-1.5">
                {(['modern', 'industrial', 'neon'] as const).map((variation) => (
                  <button
                    key={variation}
                    onClick={() => updateConfig('designVariation', variation)}
                    className={`w-full px-3 py-2 text-xs rounded transition-all font-orbitron uppercase tracking-wide ${
                      config.designVariation === variation
                        ? 'bg-yellow-500/30 border-2 border-yellow-400 text-yellow-300'
                        : 'bg-black/50 border border-yellow-500/30 text-yellow-500/70 hover:bg-yellow-500/10 hover:border-yellow-400/50'
                    }`}
                  >
                    {variation}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Current Config JSON (for debugging) */}
        <div className="mt-6 bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-4">
          <h2 className="text-base font-orbitron uppercase text-yellow-400 mb-3 border-b border-yellow-500/30 pb-1.5">
            Current Configuration
          </h2>
          <pre className="text-[10px] text-gray-400 font-mono overflow-x-auto">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      </div>

      {/* Live Preview Section (Split View Only) */}
      {viewMode === 'split-view' && (
        <div className="w-1/2 bg-gray-900 relative flex flex-col">
          <div className="bg-gray-900/95 backdrop-blur-sm border-b-2 border-yellow-500/50 p-3">
            <h2 className="text-yellow-400 font-orbitron text-base uppercase tracking-wider">
              Live Preview
            </h2>
            <p className="text-yellow-500/60 text-[10px] mt-0.5">
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
