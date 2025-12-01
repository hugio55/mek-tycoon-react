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
  twinkleAmount: 0,
  twinkleSpeed: 1,
  sizeRandomness: 0,
  starScale2: 1,
  starSpeed2: 10,
  starFrequency2: 100,
  lineLength2: 2,
  twinkleAmount2: 0,
  twinkleSpeed2: 1,
  sizeRandomness2: 0,
  starScale3: 1,
  starSpeed3: 10,
  starFrequency3: 100,
  lineLength3: 2,
  spawnDelay3: 50,
  twinkleAmount3: 0,
  twinkleSpeed3: 1,
  sizeRandomness3: 0,
  bgStarTwinkleAmount: 30,
  bgStarTwinkleSpeed: 0.5,
  bgStarSizeRandomness: 50,
  bgStarCount: 800,
  bgStarMinBrightness: 0.1,
  bgStarMaxBrightness: 0.4,
  logoSize: 600,
  logoYPosition: 0, // Now percentage offset from center (-50 to +50)
  selectedFont: 'Orbitron',
  descriptionFontSize: 18,
  descriptionText: 'A futuristic idle tycoon game featuring collectible Mek NFTs. Build your empire through resource management, strategic crafting, and automated gold generation.',
  descriptionXOffset: 0,
  descriptionYOffset: 0,
  bgYPosition: 0,
  motionBlurEnabled: true,
  blurIntensity: 50,
  descriptionColor: 'text-yellow-400/90',
  designVariation: 'modern' as 'modern' | 'industrial' | 'neon',
  phaseHeaderFont: 'Orbitron',
  phaseHeaderFontSize: 48,
  phaseHeaderColor: 'text-white/70',
  phaseDescriptionFont: 'Arial',
  phaseDescriptionFontSize: 16,
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
  speakerIconStyle: 'minimal' as 'minimal' | 'geometric' | 'bars' | 'hologram' | 'pulse',
  // PhaseCarousel Controls
  phaseImageDarkening: 30,
  phaseBlurAmount: 20,
  phaseBlurAmountSelected: 5,
  phaseColumnHeight: 288,
  phaseFadePosition: 50,
  phaseImage1: '',
  phaseImage2: '',
  phaseImage3: '',
  phaseImage4: '',
  phaseImageBlendMode: 'normal' as 'normal' | 'screen' | 'lighten' | 'lighter',
  phaseHoverDarkeningIntensity: 90,
  phaseIdleBackdropBlur: 0,
  phaseColumnYOffset: 0,
  phaseCardOpacity: 40, // Card background opacity (0-100)
  // Description glass card controls
  descriptionCardBlur: 40,
  descriptionCardDarkness: 40,
  descriptionCardBorder: true,
};

type ConfigType = typeof DEFAULT_CONFIG;

export default function LandingDebugPage() {
  // Initialize config from localStorage synchronously to prevent race condition
  const [config, setConfig] = useState<ConfigType>(() => {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_CONFIG;

      const parsed = JSON.parse(stored);
      // Defensive merge: only copy defined values that exist in DEFAULT_CONFIG
      const merged: ConfigType = { ...DEFAULT_CONFIG };
      for (const key in parsed) {
        if (key in DEFAULT_CONFIG && parsed[key] !== undefined) {
          (merged as any)[key] = parsed[key];
        }
      }
      console.log('[AUTO-SAVE] Settings loaded from localStorage:', merged);
      return merged;
    } catch (e) {
      console.error('[AUTO-SAVE] Failed to load settings, using defaults:', e);
      return DEFAULT_CONFIG;
    }
  });
  const [viewMode, setViewMode] = useState<'controls-only' | 'split-view'>('controls-only');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSaveTime, setLastSaveTime] = useState<string>('');
  const [selectedTypographyElement, setSelectedTypographyElement] = useState<'description' | 'phaseHeader' | 'phaseDescription' | 'soundLabel'>('description');

  // Phase card management
  const phaseCards = useQuery(api.phaseCards.getAllPhaseCards);
  const createPhaseCard = useMutation(api.phaseCards.createPhaseCard);
  const updatePhaseCard = useMutation(api.phaseCards.updatePhaseCard);
  const deletePhaseCard = useMutation(api.phaseCards.deletePhaseCard);
  const reorderPhaseCards = useMutation(api.phaseCards.reorderPhaseCards);
  const initializeDefaultPhaseCards = useMutation(api.phaseCards.initializeDefaultPhaseCards);

  const [editingPhaseId, setEditingPhaseId] = useState<Id<"phaseCards"> | null>(null);
  const [newPhaseForm, setNewPhaseForm] = useState<{
    title: string;
    description: string;
    locked: boolean;
  }>({
    title: '',
    description: '',
    locked: false,
  });

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

  // Auto-save config to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      const saveTime = new Date().toLocaleTimeString();
      console.log('[AUTO-SAVE] Settings auto-saved at', saveTime);
      setLastSaveTime(saveTime);

      // Dispatch storage event for other tabs/windows
      window.dispatchEvent(new Event('storage'));

      // Dispatch custom event for same tab
      window.dispatchEvent(new Event('mek-landing-config-updated'));

      // Post message to iframe if present
      const iframe = document.querySelector('iframe[title="Landing Page Preview"]') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'mek-landing-config-updated',
          config
        }, '*');
      }
    } catch (e) {
      console.error('[AUTO-SAVE] Failed to save settings:', e);
    }
  }, [config]);

  // Helper function to convert Windows absolute paths to web-relative paths
  const convertToWebPath = (path: string): string => {
    // Remove quotes if present
    let cleanPath = path.trim().replace(/^["']|["']$/g, '');

    // If it's already a web path (starts with / or http), return as-is
    if (cleanPath.startsWith('/') || cleanPath.startsWith('http')) {
      return cleanPath;
    }

    // Convert Windows path to web path
    // Extract everything after "public\" or "public/"
    const publicIndex = cleanPath.toLowerCase().lastIndexOf('public\\');
    const publicIndexForward = cleanPath.toLowerCase().lastIndexOf('public/');

    if (publicIndex !== -1) {
      // Found "public\" - extract path after it and convert backslashes to forward slashes
      const webPath = '/' + cleanPath.substring(publicIndex + 7).replace(/\\/g, '/');
      return webPath;
    } else if (publicIndexForward !== -1) {
      // Found "public/" - extract path after it
      const webPath = '/' + cleanPath.substring(publicIndexForward + 7);
      return webPath;
    }

    // If no "public" found, return the original (might be relative path)
    return cleanPath;
  };

  const updateConfig = <K extends keyof ConfigType>(key: K, value: ConfigType[K]) => {
    // Auto-convert image paths for phase image fields
    if ((key === 'phaseImage1' || key === 'phaseImage2' || key === 'phaseImage3' || key === 'phaseImage4') && typeof value === 'string') {
      const convertedPath = convertToWebPath(value);
      setConfig(prev => ({ ...prev, [key]: convertedPath as ConfigType[K] }));
    } else {
      setConfig(prev => ({ ...prev, [key]: value }));
    }

    // Debug log for phaseIdleBackdropBlur changes
    if (key === 'phaseIdleBackdropBlur') {
      console.log('[🔍BLUR] Slider changed in landing-debug:', value);
    }
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const handleSave = () => {
    // Trigger save state animation
    setSaveState('saving');

    // Ensure config is saved to localStorage (already happens automatically, but this is explicit)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    // Dispatch custom event to notify components in same tab
    window.dispatchEvent(new Event('mek-landing-config-updated'));
    // Also dispatch storage event for other tabs (standard behavior)
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

  // Phase card management functions
  const handleCreatePhase = async () => {
    if (!newPhaseForm.title.trim()) return;

    const nextOrder = phaseCards ? phaseCards.length + 1 : 1;

    await createPhaseCard({
      title: newPhaseForm.title,
      description: newPhaseForm.description || undefined,
      locked: newPhaseForm.locked,
      order: nextOrder,
    });

    setNewPhaseForm({ title: '', description: '', locked: false });
  };

  const handleUpdatePhase = async (id: Id<"phaseCards">, updates: { title?: string; description?: string; locked?: boolean }) => {
    await updatePhaseCard({ id, ...updates });
    setEditingPhaseId(null);
  };

  const handleDeletePhase = async (id: Id<"phaseCards">) => {
    if (!confirm('Are you sure you want to delete this phase card?')) return;
    await deletePhaseCard({ id });
  };

  const handleMovePhaseUp = async (id: Id<"phaseCards">, currentOrder: number) => {
    if (!phaseCards || currentOrder <= 1) return;

    const phaseToSwap = phaseCards.find(p => p.order === currentOrder - 1);
    if (!phaseToSwap) return;

    await reorderPhaseCards({
      cardOrders: [
        { id, order: currentOrder - 1 },
        { id: phaseToSwap._id, order: currentOrder },
      ],
    });
  };

  const handleMovePhaseDown = async (id: Id<"phaseCards">, currentOrder: number) => {
    if (!phaseCards || currentOrder >= phaseCards.length) return;

    const phaseToSwap = phaseCards.find(p => p.order === currentOrder + 1);
    if (!phaseToSwap) return;

    await reorderPhaseCards({
      cardOrders: [
        { id, order: currentOrder + 1 },
        { id: phaseToSwap._id, order: currentOrder },
      ],
    });
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('Initialize default phase cards? This only works if no cards exist yet.')) return;
    const result = await initializeDefaultPhaseCards();
    alert(result.message);
  };

  return (
    <div className={`min-h-screen ${viewMode === 'split-view' ? 'flex' : 'bg-gray-900 p-3'}`}>
      <div className={viewMode === 'split-view' ? 'w-1/2 bg-gray-800 p-3 overflow-y-auto border-r border-gray-700' : 'max-w-5xl mx-auto'}>
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-semibold text-gray-100">
              Landing Page Debug Controls
            </h1>
            {lastSaveTime && (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Auto-saved at {lastSaveTime}
              </div>
            )}
          </div>
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
            <button
              onClick={() => {
                // Trigger audio consent lightbox in landing page via localStorage
                localStorage.setItem('mek-debug-trigger', JSON.stringify({
                  action: 'show-audio-consent',
                  timestamp: Date.now()
                }));

                // Also dispatch storage event for same-tab updates
                window.dispatchEvent(new Event('storage'));

                // If in split-view mode, also send postMessage to iframe
                const iframe = document.querySelector('iframe[title="Landing Page Preview"]') as HTMLIFrameElement;
                if (iframe && iframe.contentWindow) {
                  iframe.contentWindow.postMessage({
                    type: 'mek-debug-trigger',
                    action: 'show-audio-consent'
                  }, '*');
                }
              }}
              className="px-2 py-1 bg-yellow-700 border border-yellow-600 rounded text-yellow-200 text-xs hover:bg-yellow-600"
            >
              Show Audio Consent
            </button>
          </div>

          {/* Audio Consent Layout Selector */}
          <div className="mt-2 flex gap-1 flex-wrap">
            <span className="text-xs text-gray-400 mr-2">Layout:</span>
            {['minimal', 'compact', 'card', 'fullscreen', 'centered'].map((layoutOption) => (
              <button
                key={layoutOption}
                onClick={() => {
                  localStorage.setItem('mek-audio-consent-layout', layoutOption);

                  // Dispatch custom event for same-tab updates
                  window.dispatchEvent(new CustomEvent('mek-layout-change', {
                    detail: { layout: layoutOption }
                  }));
                }}
                className={`px-2 py-1 border rounded text-xs transition-colors ${
                  localStorage.getItem('mek-audio-consent-layout') === layoutOption
                    ? 'bg-yellow-700 border-yellow-600 text-yellow-200'
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {layoutOption.charAt(0).toUpperCase() + layoutOption.slice(1)}
              </button>
            ))}
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
                max="1500"
                step="10"
                value={config.starFrequency}
                onChange={(e) => updateConfig('starFrequency', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.starFrequency} stars
              </div>
            </div>

            {/* Twinkle Amount */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Twinkle Amount
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.twinkleAmount}
                onChange={(e) => updateConfig('twinkleAmount', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.twinkleAmount}%
              </div>
            </div>

            {/* Twinkle Speed */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Twinkle Speed
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={config.twinkleSpeed}
                onChange={(e) => updateConfig('twinkleSpeed', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.twinkleSpeed.toFixed(1)}x
              </div>
            </div>

            {/* Size Randomness */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Size Randomness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.sizeRandomness}
                onChange={(e) => updateConfig('sizeRandomness', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.sizeRandomness}%
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

            {/* Twinkle Amount 2 */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Twinkle Amount
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.twinkleAmount2}
                onChange={(e) => updateConfig('twinkleAmount2', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.twinkleAmount2}%
              </div>
            </div>

            {/* Twinkle Speed 2 */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Twinkle Speed
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={config.twinkleSpeed2}
                onChange={(e) => updateConfig('twinkleSpeed2', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.twinkleSpeed2.toFixed(1)}x
              </div>
            </div>

            {/* Size Randomness 2 */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Size Randomness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.sizeRandomness2}
                onChange={(e) => updateConfig('sizeRandomness2', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.sizeRandomness2}%
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

            {/* Spawn Delay 3 */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Spawn Delay (time between stars)
              </label>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={config.spawnDelay3}
                onChange={(e) => updateConfig('spawnDelay3', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.spawnDelay3}ms
              </div>
            </div>

            {/* Twinkle Amount 3 */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Twinkle Amount
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.twinkleAmount3}
                onChange={(e) => updateConfig('twinkleAmount3', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.twinkleAmount3}%
              </div>
            </div>

            {/* Twinkle Speed 3 */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Twinkle Speed
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={config.twinkleSpeed3}
                onChange={(e) => updateConfig('twinkleSpeed3', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.twinkleSpeed3.toFixed(1)}x
              </div>
            </div>

            {/* Size Randomness 3 */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Size Randomness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.sizeRandomness3}
                onChange={(e) => updateConfig('sizeRandomness3', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.sizeRandomness3}%
              </div>
            </div>
          </div>

          {/* Background Static Stars Controls Section */}
          <div className="bg-gray-800 border border-blue-500 rounded p-3">
            <h2 className="text-sm font-semibold text-blue-400 mb-2 pb-1 border-b border-blue-700">
              Background Static Stars
            </h2>

            {/* Star Count */}
            <div className="mb-2">
              <label className="block text-xs text-blue-300 mb-1">
                Star Count
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={config.bgStarCount}
                onChange={(e) => updateConfig('bgStarCount', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-blue-400 text-center mt-0.5">
                {config.bgStarCount} stars
              </div>
            </div>

            {/* Min Brightness */}
            <div className="mb-2">
              <label className="block text-xs text-blue-300 mb-1">
                Min Brightness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.bgStarMinBrightness * 100}
                onChange={(e) => updateConfig('bgStarMinBrightness', parseFloat(e.target.value) / 100)}
                className="w-full"
              />
              <div className="text-xs text-blue-400 text-center mt-0.5">
                {(config.bgStarMinBrightness * 100).toFixed(0)}%
              </div>
            </div>

            {/* Max Brightness */}
            <div className="mb-2">
              <label className="block text-xs text-blue-300 mb-1">
                Max Brightness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.bgStarMaxBrightness * 100}
                onChange={(e) => updateConfig('bgStarMaxBrightness', parseFloat(e.target.value) / 100)}
                className="w-full"
              />
              <div className="text-xs text-blue-400 text-center mt-0.5">
                {(config.bgStarMaxBrightness * 100).toFixed(0)}%
              </div>
            </div>

            {/* Twinkle Amount */}
            <div className="mb-2">
              <label className="block text-xs text-blue-300 mb-1">
                Twinkle Amount
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.bgStarTwinkleAmount}
                onChange={(e) => updateConfig('bgStarTwinkleAmount', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-blue-400 text-center mt-0.5">
                {config.bgStarTwinkleAmount}%
              </div>
            </div>

            {/* Twinkle Speed */}
            <div className="mb-2">
              <label className="block text-xs text-blue-300 mb-1">
                Twinkle Speed
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={config.bgStarTwinkleSpeed}
                onChange={(e) => updateConfig('bgStarTwinkleSpeed', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-blue-400 text-center mt-0.5">
                {config.bgStarTwinkleSpeed.toFixed(1)}x
              </div>
            </div>

            {/* Size Randomness */}
            <div className="mb-2">
              <label className="block text-xs text-blue-300 mb-1">
                Size Randomness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.bgStarSizeRandomness}
                onChange={(e) => updateConfig('bgStarSizeRandomness', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-blue-400 text-center mt-0.5">
                {config.bgStarSizeRandomness}%
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
                Logo Vertical Position (% from center)
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={config.logoYPosition}
                onChange={(e) => updateConfig('logoYPosition', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.logoYPosition > 0 ? '+' : ''}{config.logoYPosition}% from center
                {config.logoYPosition > 0 ? ' (higher)' : config.logoYPosition < 0 ? ' (lower)' : ' (centered)'}
              </div>
            </div>

            {/* Background Y Position */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Background Vertical Position
              </label>
              <input
                type="range"
                min="-200"
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
                onChange={(e) => setSelectedTypographyElement(e.target.value as 'description' | 'phaseHeader' | 'phaseDescription' | 'soundLabel')}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-gray-500"
              >
                <option value="description">Description Text</option>
                <option value="phaseHeader">Phase Header</option>
                <option value="phaseDescription">Phase Description</option>
                <option value="soundLabel">Sound Label</option>
              </select>
            </div>

            {/* Font Family */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Font Family
              </label>
              <select
                value={
                  selectedTypographyElement === 'description' ? config.selectedFont :
                  selectedTypographyElement === 'phaseHeader' ? config.phaseHeaderFont :
                  selectedTypographyElement === 'phaseDescription' ? config.phaseDescriptionFont :
                  config.soundLabelFont
                }
                onChange={(e) => updateConfig(
                  selectedTypographyElement === 'description' ? 'selectedFont' :
                  selectedTypographyElement === 'phaseHeader' ? 'phaseHeaderFont' :
                  selectedTypographyElement === 'phaseDescription' ? 'phaseDescriptionFont' :
                  'soundLabelFont',
                  e.target.value
                )}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-gray-500"
                style={{
                  fontFamily: selectedTypographyElement === 'description' ? config.selectedFont :
                             selectedTypographyElement === 'phaseHeader' ? config.phaseHeaderFont :
                             selectedTypographyElement === 'phaseDescription' ? config.phaseDescriptionFont :
                             config.soundLabelFont
                }}
              >
                {fonts.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Text (Description Only) */}
            {selectedTypographyElement === 'description' && (
              <div className="mb-2">
                <label className="block text-xs text-gray-300 mb-1">
                  Description Text
                </label>
                <textarea
                  value={config.descriptionText}
                  onChange={(e) => updateConfig('descriptionText', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-gray-200 text-xs focus:outline-none focus:border-gray-500 resize-none"
                  rows={4}
                  placeholder="Enter landing page description..."
                />
                <div className="text-xs text-gray-400 mt-1">
                  {config.descriptionText.length} characters
                </div>
              </div>
            )}

            {/* Font Size */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Font Size
              </label>
              <input
                type="range"
                min="10"
                max="72"
                step="1"
                value={
                  selectedTypographyElement === 'description' ? config.descriptionFontSize :
                  selectedTypographyElement === 'phaseHeader' ? config.phaseHeaderFontSize :
                  selectedTypographyElement === 'phaseDescription' ? config.phaseDescriptionFontSize :
                  config.soundLabelSize
                }
                onChange={(e) => updateConfig(
                  selectedTypographyElement === 'description' ? 'descriptionFontSize' :
                  selectedTypographyElement === 'phaseHeader' ? 'phaseHeaderFontSize' :
                  selectedTypographyElement === 'phaseDescription' ? 'phaseDescriptionFontSize' :
                  'soundLabelSize',
                  parseInt(e.target.value)
                )}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {selectedTypographyElement === 'description' ? config.descriptionFontSize :
                 selectedTypographyElement === 'phaseHeader' ? config.phaseHeaderFontSize :
                 selectedTypographyElement === 'phaseDescription' ? config.phaseDescriptionFontSize :
                 config.soundLabelSize}px
              </div>
            </div>

            {/* Color */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Color
              </label>
              <select
                value={
                  selectedTypographyElement === 'description' ? config.descriptionColor :
                  selectedTypographyElement === 'phaseHeader' ? config.phaseHeaderColor :
                  config.soundLabelColor
                }
                onChange={(e) => updateConfig(
                  selectedTypographyElement === 'description' ? 'descriptionColor' :
                  selectedTypographyElement === 'phaseHeader' ? 'phaseHeaderColor' :
                  'soundLabelColor',
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

            {/* Horizontal Offset (Description Only) */}
            {selectedTypographyElement === 'description' && (
              <>
                <div className="mb-2">
                  <label className="block text-xs text-gray-300 mb-1">
                    Horizontal Offset (X)
                  </label>
                  <input
                    type="range"
                    min="-500"
                    max="500"
                    step="5"
                    value={config.descriptionXOffset}
                    onChange={(e) => updateConfig('descriptionXOffset', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center mt-0.5">
                    {config.descriptionXOffset}px
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block text-xs text-gray-300 mb-1">
                    Vertical Offset (Y)
                  </label>
                  <input
                    type="range"
                    min="-500"
                    max="500"
                    step="5"
                    value={config.descriptionYOffset}
                    onChange={(e) => updateConfig('descriptionYOffset', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center mt-0.5">
                    {config.descriptionYOffset}px
                  </div>
                </div>
              </>
            )}

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
                  {config.descriptionText}
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

          {/* Description Glass Card Controls Section */}
          <div className="bg-gray-800 border border-green-500 rounded p-3">
            <h2 className="text-sm font-semibold text-green-400 mb-2 pb-1 border-b border-green-700">
              Description Card Glass Effect
            </h2>

            {/* Blur Slider */}
            <div className="mb-2">
              <label className="block text-xs text-green-300 mb-1">
                Description Card Blur
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={config.descriptionCardBlur}
                onChange={(e) => updateConfig('descriptionCardBlur', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-green-400 text-center mt-0.5">
                {config.descriptionCardBlur}px
              </div>
            </div>

            {/* Darkness Slider */}
            <div className="mb-2">
              <label className="block text-xs text-green-300 mb-1">
                Description Card Darkness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.descriptionCardDarkness}
                onChange={(e) => updateConfig('descriptionCardDarkness', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-green-400 text-center mt-0.5">
                {config.descriptionCardDarkness}%
              </div>
            </div>

            {/* Border Toggle */}
            <div className="mb-2">
              <label className="block text-xs text-green-300 mb-1">
                Description Card Border
              </label>
              <button
                onClick={() => updateConfig('descriptionCardBorder', !config.descriptionCardBorder)}
                className={`w-full px-2 py-1 text-xs rounded ${
                  config.descriptionCardBorder
                    ? 'bg-green-900/50 border border-green-700 text-green-200'
                    : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {config.descriptionCardBorder ? 'Enabled' : 'Disabled'}
              </button>
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
                min="-1000"
                max="1000"
                step="10"
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

            {/* Speaker Icon Style */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Speaker Icon Style
              </label>
              <select
                value={config.speakerIconStyle}
                onChange={(e) => updateConfig('speakerIconStyle', e.target.value as any)}
                className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-gray-300"
              >
                <option value="minimal">Minimal Wave</option>
                <option value="geometric">Geometric</option>
                <option value="bars">Sound Bars</option>
                <option value="hologram">Futuristic</option>
                <option value="pulse">Pulse Ring</option>
              </select>
            </div>
          </div>

          {/* PhaseCarousel Visual Controls Section */}
          <div className="bg-gray-800 border border-cyan-500 rounded p-3">
            <h2 className="text-sm font-semibold text-cyan-400 mb-2 pb-1 border-b border-cyan-700">
              Phase Carousel Visual Controls
            </h2>

            {/* Image Darkening */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Image Darkening (overlay)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.phaseImageDarkening}
                onChange={(e) => updateConfig('phaseImageDarkening', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseImageDarkening}% darkness
              </div>
            </div>

            {/* Blur Amount - Non-Selected Cards */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Blur Amount (non-selected cards)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={config.phaseBlurAmount}
                onChange={(e) => updateConfig('phaseBlurAmount', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseBlurAmount}px blur
              </div>
            </div>

            {/* Blur Amount - Selected Card */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Blur Amount (selected/center card)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={config.phaseBlurAmountSelected}
                onChange={(e) => updateConfig('phaseBlurAmountSelected', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseBlurAmountSelected}px blur
              </div>
            </div>

            {/* Column Height */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Card Height
              </label>
              <input
                type="range"
                min="200"
                max="800"
                step="8"
                value={config.phaseColumnHeight}
                onChange={(e) => updateConfig('phaseColumnHeight', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseColumnHeight}px
              </div>
            </div>

            {/* Card Background Opacity */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Card Background Opacity
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.phaseCardOpacity}
                onChange={(e) => updateConfig('phaseCardOpacity', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseCardOpacity}% opacity
              </div>
            </div>

            {/* Opacity Fade Position */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Fade Start Position (vertical)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.phaseFadePosition}
                onChange={(e) => updateConfig('phaseFadePosition', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseFadePosition}% from top
              </div>
            </div>

            {/* Image Blend Mode */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Image Blend Mode
              </label>
              <div className="grid grid-cols-2 gap-1">
                {(['normal', 'screen', 'lighten', 'lighter'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateConfig('phaseImageBlendMode', mode)}
                    className={`px-2 py-1 text-xs rounded ${
                      config.phaseImageBlendMode === mode
                        ? 'bg-cyan-900/50 border border-cyan-700 text-cyan-200'
                        : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {mode === 'lighter' ? 'Add' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              <div className="text-xs text-cyan-400 text-center mt-1">
                Current: {config.phaseImageBlendMode === 'lighter' ? 'Add' : config.phaseImageBlendMode}
              </div>
            </div>

            {/* Hover Darkening Intensity */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Hover Darkening (gradient intensity)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.phaseHoverDarkeningIntensity}
                onChange={(e) => updateConfig('phaseHoverDarkeningIntensity', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseHoverDarkeningIntensity}% opacity
              </div>
            </div>

            {/* Idle Backdrop Blur */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Idle Backdrop Blur (background behind column)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={config.phaseIdleBackdropBlur}
                onChange={(e) => updateConfig('phaseIdleBackdropBlur', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseIdleBackdropBlur}px blur
              </div>
            </div>

            {/* Column Vertical Offset */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Column Vertical Position
              </label>
              <input
                type="range"
                min="-5000"
                max="5000"
                step="50"
                value={config.phaseColumnYOffset}
                onChange={(e) => updateConfig('phaseColumnYOffset', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseColumnYOffset > 0 ? '+' : ''}{config.phaseColumnYOffset}px
              </div>
            </div>
          </div>

          {/* Description Glass Card Controls Section */}
          <div className="bg-gray-800 border border-green-500 rounded p-3">
            <h2 className="text-sm font-semibold text-green-400 mb-2 pb-1 border-b border-green-700">
              Description Glass Card
            </h2>

            {/* Blur Amount */}
            <div className="mb-2">
              <label className="block text-xs text-green-300 mb-1">
                Backdrop Blur
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={config.descriptionCardBlur}
                onChange={(e) => updateConfig('descriptionCardBlur', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-green-400 text-center mt-0.5">
                {config.descriptionCardBlur}px
              </div>
            </div>

            {/* Darkening/Opacity */}
            <div className="mb-2">
              <label className="block text-xs text-green-300 mb-1">
                Background Darkness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.descriptionCardDarkness}
                onChange={(e) => updateConfig('descriptionCardDarkness', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-green-400 text-center mt-0.5">
                {config.descriptionCardDarkness}%
              </div>
            </div>

            {/* Border Toggle */}
            <div className="mb-2">
              <label className="block text-xs text-green-300 mb-1">
                Border Stroke
              </label>
              <button
                onClick={() => updateConfig('descriptionCardBorder', !config.descriptionCardBorder)}
                className={`w-full px-2 py-1 text-xs rounded ${
                  config.descriptionCardBorder
                    ? 'bg-green-900/50 border border-green-700 text-green-200'
                    : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {config.descriptionCardBorder ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* Phase Image URLs Section */}
          <div className="bg-gray-800 border border-cyan-500 rounded p-3">
            <h2 className="text-sm font-semibold text-cyan-400 mb-2 pb-1 border-b border-cyan-700">
              Phase Background Images
            </h2>
            <p className="text-xs text-cyan-300/70 mb-2">
              Paste Windows paths or URLs - auto-converts to web paths
            </p>

            {/* Phase I */}
            <div className="mb-3">
              <label className="block text-xs text-cyan-300 mb-1">
                Phase I Image URL
              </label>
              <input
                type="text"
                value={config.phaseImage1}
                onChange={(e) => updateConfig('phaseImage1', e.target.value)}
                placeholder="C:\Users\...\public\mek-images\1000px\image.webp"
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-cyan-500 mb-1"
              />
              {config.phaseImage1 && (
                <div className="mt-1 p-2 bg-gray-900 rounded border border-gray-700">
                  <p className="text-[10px] text-gray-500 mb-1">Preview:</p>
                  <div className="relative w-full h-20 bg-gray-950 rounded overflow-hidden">
                    <img
                      src={config.phaseImage1}
                      alt="Phase I preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const errorText = e.currentTarget.nextElementSibling as HTMLElement;
                        if (errorText) errorText.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-xs text-red-400 p-2">Failed to load image</div>
                  </div>
                  <p className="text-[10px] text-cyan-400 mt-1 break-all">{config.phaseImage1}</p>
                </div>
              )}
            </div>

            {/* Phase II */}
            <div className="mb-3">
              <label className="block text-xs text-cyan-300 mb-1">
                Phase II Image URL
              </label>
              <input
                type="text"
                value={config.phaseImage2}
                onChange={(e) => updateConfig('phaseImage2', e.target.value)}
                placeholder="C:\Users\...\public\mek-images\1000px\image.webp"
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-cyan-500 mb-1"
              />
              {config.phaseImage2 && (
                <div className="mt-1 p-2 bg-gray-900 rounded border border-gray-700">
                  <p className="text-[10px] text-gray-500 mb-1">Preview:</p>
                  <div className="relative w-full h-20 bg-gray-950 rounded overflow-hidden">
                    <img
                      src={config.phaseImage2}
                      alt="Phase II preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const errorText = e.currentTarget.nextElementSibling as HTMLElement;
                        if (errorText) errorText.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-xs text-red-400 p-2">Failed to load image</div>
                  </div>
                  <p className="text-[10px] text-cyan-400 mt-1 break-all">{config.phaseImage2}</p>
                </div>
              )}
            </div>

            {/* Phase III */}
            <div className="mb-3">
              <label className="block text-xs text-cyan-300 mb-1">
                Phase III Image URL
              </label>
              <input
                type="text"
                value={config.phaseImage3}
                onChange={(e) => updateConfig('phaseImage3', e.target.value)}
                placeholder="C:\Users\...\public\mek-images\1000px\image.webp"
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-cyan-500 mb-1"
              />
              {config.phaseImage3 && (
                <div className="mt-1 p-2 bg-gray-900 rounded border border-gray-700">
                  <p className="text-[10px] text-gray-500 mb-1">Preview:</p>
                  <div className="relative w-full h-20 bg-gray-950 rounded overflow-hidden">
                    <img
                      src={config.phaseImage3}
                      alt="Phase III preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const errorText = e.currentTarget.nextElementSibling as HTMLElement;
                        if (errorText) errorText.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-xs text-red-400 p-2">Failed to load image</div>
                  </div>
                  <p className="text-[10px] text-cyan-400 mt-1 break-all">{config.phaseImage3}</p>
                </div>
              )}
            </div>

            {/* Phase IV */}
            <div className="mb-3">
              <label className="block text-xs text-cyan-300 mb-1">
                Phase IV Image URL
              </label>
              <input
                type="text"
                value={config.phaseImage4}
                onChange={(e) => updateConfig('phaseImage4', e.target.value)}
                placeholder="C:\Users\...\public\mek-images\1000px\image.webp"
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-cyan-500 mb-1"
              />
              {config.phaseImage4 && (
                <div className="mt-1 p-2 bg-gray-900 rounded border border-gray-700">
                  <p className="text-[10px] text-gray-500 mb-1">Preview:</p>
                  <div className="relative w-full h-20 bg-gray-950 rounded overflow-hidden">
                    <img
                      src={config.phaseImage4}
                      alt="Phase IV preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const errorText = e.currentTarget.nextElementSibling as HTMLElement;
                        if (errorText) errorText.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-xs text-red-400 p-2">Failed to load image</div>
                  </div>
                  <p className="text-[10px] text-cyan-400 mt-1 break-all">{config.phaseImage4}</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Phase Cards Management Section */}
        <div className="mt-6 bg-gray-800 border border-yellow-500 rounded p-4">
          <h2 className="text-lg font-semibold text-yellow-400 mb-3 pb-2 border-b border-yellow-500/30">
            Phase Cards Management
          </h2>

          <div className="mb-4">
            <button
              onClick={handleInitializeDefaults}
              className="px-3 py-2 bg-blue-700 border border-blue-600 rounded text-white text-sm hover:bg-blue-600"
            >
              Initialize Default Phase Cards
            </button>
          </div>

          {/* Add New Phase Card Form */}
          <div className="bg-gray-900 border border-gray-700 rounded p-3 mb-4">
            <h3 className="text-sm font-semibold text-gray-100 mb-2">Add New Phase Card</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={newPhaseForm.title}
                  onChange={(e) => setNewPhaseForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Phase VI"
                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">Description (optional)</label>
                <textarea
                  value={newPhaseForm.description}
                  onChange={(e) => setNewPhaseForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Phase description..."
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newPhaseLocked"
                  checked={newPhaseForm.locked}
                  onChange={(e) => setNewPhaseForm(prev => ({ ...prev, locked: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="newPhaseLocked" className="text-xs text-gray-300">
                  Locked (coming soon)
                </label>
              </div>
              <button
                onClick={handleCreatePhase}
                disabled={!newPhaseForm.title.trim()}
                className="w-full px-3 py-2 bg-green-700 border border-green-600 rounded text-white text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Phase Card
              </button>
            </div>
          </div>

          {/* Existing Phase Cards List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-100 mb-2">Existing Phase Cards</h3>
            {!phaseCards ? (
              <div className="text-gray-400 text-sm">Loading phase cards...</div>
            ) : phaseCards.length === 0 ? (
              <div className="text-gray-400 text-sm">No phase cards yet. Add one above or initialize defaults.</div>
            ) : (
              phaseCards.map((phase) => (
                <div key={phase._id} className="bg-gray-900 border border-gray-700 rounded p-3">
                  {editingPhaseId === phase._id ? (
                    // Edit mode
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Title</label>
                        <input
                          type="text"
                          defaultValue={phase.title}
                          id={`edit-title-${phase._id}`}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Description</label>
                        <textarea
                          defaultValue={phase.description || ''}
                          id={`edit-description-${phase._id}`}
                          rows={2}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`edit-locked-${phase._id}`}
                          defaultChecked={phase.locked}
                          className="rounded"
                        />
                        <label htmlFor={`edit-locked-${phase._id}`} className="text-xs text-gray-300">
                          Locked
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const title = (document.getElementById(`edit-title-${phase._id}`) as HTMLInputElement).value;
                            const description = (document.getElementById(`edit-description-${phase._id}`) as HTMLTextAreaElement).value;
                            const locked = (document.getElementById(`edit-locked-${phase._id}`) as HTMLInputElement).checked;
                            handleUpdatePhase(phase._id, { title, description, locked });
                          }}
                          className="flex-1 px-2 py-1 bg-green-700 border border-green-600 rounded text-white text-xs hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPhaseId(null)}
                          className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-gray-100">{phase.title}</h4>
                            {phase.locked && (
                              <span className="px-1.5 py-0.5 bg-red-900/50 border border-red-700 rounded text-red-300 text-[10px]">
                                LOCKED
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 bg-blue-900/50 border border-blue-700 rounded text-blue-300 text-[10px]">
                              Order: {phase.order}
                            </span>
                          </div>
                          {phase.description && (
                            <p className="text-xs text-gray-400 mt-1">{phase.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => setEditingPhaseId(phase._id)}
                          className="px-2 py-1 bg-blue-700 border border-blue-600 rounded text-white text-xs hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleMovePhaseUp(phase._id, phase.order)}
                          disabled={phase.order === 1}
                          className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↑ Up
                        </button>
                        <button
                          onClick={() => handleMovePhaseDown(phase._id, phase.order)}
                          disabled={!phaseCards || phase.order === phaseCards.length}
                          className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↓ Down
                        </button>
                        <button
                          onClick={() => handleDeletePhase(phase._id)}
                          className="px-2 py-1 bg-red-700 border border-red-600 rounded text-white text-xs hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
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
