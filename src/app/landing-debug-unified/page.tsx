'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function UnifiedLandingDebugPage() {
  const [activeViewport, setActiveViewport] = useState<'desktop' | 'mobile'>('desktop');

  // Load unified settings from Convex
  const settings = useQuery(api.landingDebugUnified.getUnifiedLandingDebugSettings);
  const updateSettings = useMutation(api.landingDebugUnified.updateUnifiedLandingDebugSettings);
  const resetSettings = useMutation(api.landingDebugUnified.resetUnifiedLandingDebugSettings);
  const migrateFromOld = useMutation(api.landingDebugUnified.migrateFromOldTables);

  // Local state for editing
  const [desktopConfig, setDesktopConfig] = useState(settings?.desktop || {});
  const [mobileConfig, setMobileConfig] = useState(settings?.mobile || {});
  const [sharedConfig, setSharedConfig] = useState(settings?.shared || {});

  // Sync Convex data to local state
  useEffect(() => {
    if (settings) {
      setDesktopConfig(settings.desktop);
      setMobileConfig(settings.mobile);
      setSharedConfig(settings.shared);
    }
  }, [settings]);

  // Auto-detect viewport size for default view
  useEffect(() => {
    const checkViewport = () => {
      setActiveViewport(window.innerWidth >= 1024 ? 'desktop' : 'mobile');
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Save changes to Convex
  const handleSave = async () => {
    await updateSettings({
      desktop: desktopConfig,
      mobile: mobileConfig,
      shared: sharedConfig,
    });
  };

  // Reset to defaults
  const handleReset = async () => {
    if (confirm('Reset all settings to defaults?')) {
      await resetSettings({});
    }
  };

  // Migrate old settings
  const handleMigrate = async () => {
    const result = await migrateFromOld({});
    alert(result.message);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-yellow-400">Unified Landing Page Debug</h1>
          <p className="text-gray-400">One page, responsive controls for desktop and mobile</p>
        </div>

        {/* Viewport Indicator */}
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border-2 border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-400">Current Viewport:</span>
              <span className="ml-2 text-xl font-bold text-yellow-400">
                {activeViewport === 'desktop' ? 'Desktop (≥1024px)' : 'Mobile (<1024px)'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveViewport('desktop')}
                className={`px-4 py-2 rounded transition-all ${
                  activeViewport === 'desktop'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Desktop View
              </button>
              <button
                onClick={() => setActiveViewport('mobile')}
                className={`px-4 py-2 rounded transition-all ${
                  activeViewport === 'mobile'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Mobile View
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-bold hover:bg-yellow-400 transition-all"
          >
            💾 Save Changes
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-500 transition-all"
          >
            🔄 Reset to Defaults
          </button>
          <button
            onClick={handleMigrate}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 transition-all"
          >
            📦 Migrate Old Settings
          </button>
          <a
            href="/landing"
            target="_blank"
            className="px-6 py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 transition-all"
          >
            👁️ View Landing Page
          </a>
        </div>

        {/* Responsive Controls Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Desktop Controls - Hidden on mobile viewport */}
          <div className={activeViewport === 'desktop' ? 'block' : 'hidden'}>
            <div className="bg-gray-900 rounded-lg p-6 border-2 border-blue-500/50">
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Desktop Settings (≥1024px)</h2>

              {/* Desktop Logo Size */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Logo Size</label>
                <input
                  type="range"
                  min="300"
                  max="900"
                  value={desktopConfig.logoSize || 600}
                  onChange={(e) => setDesktopConfig({ ...desktopConfig, logoSize: Number(e.target.value) })}
                  className="w-full"
                />
                <span className="text-yellow-400 text-sm">{desktopConfig.logoSize}px</span>
              </div>

              {/* Desktop Description Font Size */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Description Font Size</label>
                <input
                  type="range"
                  min="12"
                  max="32"
                  value={desktopConfig.descriptionFontSize || 18}
                  onChange={(e) => setDesktopConfig({ ...desktopConfig, descriptionFontSize: Number(e.target.value) })}
                  className="w-full"
                />
                <span className="text-yellow-400 text-sm">{desktopConfig.descriptionFontSize}px</span>
              </div>

              {/* Desktop Join Beta Font Size */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Join Beta Button Font Size</label>
                <input
                  type="range"
                  min="20"
                  max="48"
                  value={desktopConfig.joinBetaFontSize || 32}
                  onChange={(e) => setDesktopConfig({ ...desktopConfig, joinBetaFontSize: Number(e.target.value) })}
                  className="w-full"
                />
                <span className="text-yellow-400 text-sm">{desktopConfig.joinBetaFontSize}px</span>
              </div>

              {/* Desktop Star Count */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Background Star Count</label>
                <input
                  type="range"
                  min="0"
                  max="1500"
                  value={desktopConfig.bgStarCount || 800}
                  onChange={(e) => setDesktopConfig({ ...desktopConfig, bgStarCount: Number(e.target.value) })}
                  className="w-full"
                />
                <span className="text-yellow-400 text-sm">{desktopConfig.bgStarCount} stars</span>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                These settings apply when viewport width ≥ 1024px
              </p>
            </div>
          </div>

          {/* Mobile Controls - Hidden on desktop viewport */}
          <div className={activeViewport === 'mobile' ? 'block' : 'hidden'}>
            <div className="bg-gray-900 rounded-lg p-6 border-2 border-green-500/50">
              <h2 className="text-2xl font-bold mb-4 text-green-400">Mobile Settings (&lt;1024px)</h2>

              {/* Mobile Logo Size */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Logo Size</label>
                <input
                  type="range"
                  min="150"
                  max="500"
                  value={mobileConfig.logoSize || 300}
                  onChange={(e) => setMobileConfig({ ...mobileConfig, logoSize: Number(e.target.value) })}
                  className="w-full"
                />
                <span className="text-yellow-400 text-sm">{mobileConfig.logoSize}px</span>
              </div>

              {/* Mobile Description Font Size */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Description Font Size</label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={mobileConfig.descriptionFontSize || 14}
                  onChange={(e) => setMobileConfig({ ...mobileConfig, descriptionFontSize: Number(e.target.value) })}
                  className="w-full h-11"
                />
                <span className="text-yellow-400 text-sm">{mobileConfig.descriptionFontSize}px</span>
              </div>

              {/* Mobile Join Beta Font Size */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Join Beta Button Font Size</label>
                <input
                  type="range"
                  min="16"
                  max="36"
                  value={mobileConfig.joinBetaFontSize || 24}
                  onChange={(e) => setMobileConfig({ ...mobileConfig, joinBetaFontSize: Number(e.target.value) })}
                  className="w-full h-11"
                />
                <span className="text-yellow-400 text-sm">{mobileConfig.joinBetaFontSize}px</span>
              </div>

              {/* Mobile Star Count */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Background Star Count</label>
                <input
                  type="range"
                  min="0"
                  max="800"
                  value={mobileConfig.bgStarCount || 400}
                  onChange={(e) => setMobileConfig({ ...mobileConfig, bgStarCount: Number(e.target.value) })}
                  className="w-full h-11"
                />
                <span className="text-yellow-400 text-sm">{mobileConfig.bgStarCount} stars</span>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                These settings apply when viewport width &lt; 1024px
              </p>
            </div>
          </div>

          {/* Shared Settings - Always Visible */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-lg p-6 border-2 border-purple-500/50">
              <h2 className="text-2xl font-bold mb-4 text-purple-400">Shared Settings (All Viewports)</h2>

              {/* Description Text */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Description Text</label>
                <textarea
                  value={sharedConfig.descriptionText || ''}
                  onChange={(e) => setSharedConfig({ ...sharedConfig, descriptionText: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Font Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Font Family</label>
                <select
                  value={sharedConfig.selectedFont || 'Orbitron'}
                  onChange={(e) => setSharedConfig({ ...sharedConfig, selectedFont: e.target.value })}
                  className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
                >
                  <option value="Orbitron">Orbitron</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Roboto">Roboto</option>
                </select>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                These settings apply to both desktop and mobile viewports
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-gray-900 rounded-lg border-2 border-yellow-500/30">
          <h3 className="text-xl font-bold mb-3 text-yellow-400">How This Works</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Desktop controls appear when viewport ≥ 1024px</li>
            <li>Mobile controls appear when viewport &lt; 1024px</li>
            <li>Resize your browser window to test responsive switching</li>
            <li>Changes save to one unified Convex table</li>
            <li>Landing page uses CSS media queries to apply correct settings</li>
            <li>Toggle manually with buttons above to preview both views</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
