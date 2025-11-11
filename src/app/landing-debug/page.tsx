'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'mek-landing-debug-config';

// Default config must match landing/page.tsx
const DEFAULT_CONFIG = {
  // Layer 1 - Slow Moving Stars
  starScale: 1,
  starSpeed: 3,
  starFrequency: 200,
  twinkleAmount: 0,
  twinkleSpeed: 1,
  twinkleSpeedRandomness: 50,
  sizeRandomness: 50,

  // Layer 2 - Fast Moving Streaks
  starScale2: 1,
  starSpeed2: 10,
  starFrequency2: 100,
  lineLength2: 2,
  twinkleAmount2: 0,
  twinkleSpeed2: 1,
  twinkleSpeedRandomness2: 50,
  sizeRandomness2: 50,

  // Layer 3 - Ultra-Fast Streaks
  starScale3: 1,
  starSpeed3: 10,
  starFrequency3: 100,
  lineLength3: 2,
  spawnDelay3: 50,
  twinkleAmount3: 0,
  twinkleSpeed3: 1,
  twinkleSpeedRandomness3: 50,
  sizeRandomness3: 50,

  // Background Static Stars
  bgStarTwinkleAmount: 30,
  bgStarTwinkleSpeed: 0.5,
  bgStarTwinkleSpeedRandomness: 50,
  bgStarSizeRandomness: 50,
  bgStarCount: 800,
  bgStarMinBrightness: 0.1,
  bgStarMaxBrightness: 0.4,
};

export default function LandingDebugPage() {
  // Layer 1 controls
  const [starScale, setStarScale] = useState(DEFAULT_CONFIG.starScale);
  const [starSpeed, setStarSpeed] = useState(DEFAULT_CONFIG.starSpeed);
  const [starFrequency, setStarFrequency] = useState(DEFAULT_CONFIG.starFrequency);
  const [twinkleAmount, setTwinkleAmount] = useState(DEFAULT_CONFIG.twinkleAmount);
  const [twinkleSpeed, setTwinkleSpeed] = useState(DEFAULT_CONFIG.twinkleSpeed);
  const [twinkleSpeedRandomness, setTwinkleSpeedRandomness] = useState(DEFAULT_CONFIG.twinkleSpeedRandomness);
  const [sizeRandomness, setSizeRandomness] = useState(DEFAULT_CONFIG.sizeRandomness);

  // Layer 2 controls
  const [starScale2, setStarScale2] = useState(DEFAULT_CONFIG.starScale2);
  const [starSpeed2, setStarSpeed2] = useState(DEFAULT_CONFIG.starSpeed2);
  const [starFrequency2, setStarFrequency2] = useState(DEFAULT_CONFIG.starFrequency2);
  const [lineLength2, setLineLength2] = useState(DEFAULT_CONFIG.lineLength2);
  const [twinkleAmount2, setTwinkleAmount2] = useState(DEFAULT_CONFIG.twinkleAmount2);
  const [twinkleSpeed2, setTwinkleSpeed2] = useState(DEFAULT_CONFIG.twinkleSpeed2);
  const [twinkleSpeedRandomness2, setTwinkleSpeedRandomness2] = useState(DEFAULT_CONFIG.twinkleSpeedRandomness2);
  const [sizeRandomness2, setSizeRandomness2] = useState(DEFAULT_CONFIG.sizeRandomness2);

  // Layer 3 controls
  const [starScale3, setStarScale3] = useState(DEFAULT_CONFIG.starScale3);
  const [starSpeed3, setStarSpeed3] = useState(DEFAULT_CONFIG.starSpeed3);
  const [starFrequency3, setStarFrequency3] = useState(DEFAULT_CONFIG.starFrequency3);
  const [lineLength3, setLineLength3] = useState(DEFAULT_CONFIG.lineLength3);
  const [spawnDelay3, setSpawnDelay3] = useState(DEFAULT_CONFIG.spawnDelay3);
  const [twinkleAmount3, setTwinkleAmount3] = useState(DEFAULT_CONFIG.twinkleAmount3);
  const [twinkleSpeed3, setTwinkleSpeed3] = useState(DEFAULT_CONFIG.twinkleSpeed3);
  const [twinkleSpeedRandomness3, setTwinkleSpeedRandomness3] = useState(DEFAULT_CONFIG.twinkleSpeedRandomness3);
  const [sizeRandomness3, setSizeRandomness3] = useState(DEFAULT_CONFIG.sizeRandomness3);

  // Background stars controls
  const [bgStarTwinkleAmount, setBgStarTwinkleAmount] = useState(DEFAULT_CONFIG.bgStarTwinkleAmount);
  const [bgStarTwinkleSpeed, setBgStarTwinkleSpeed] = useState(DEFAULT_CONFIG.bgStarTwinkleSpeed);
  const [bgStarTwinkleSpeedRandomness, setBgStarTwinkleSpeedRandomness] = useState(DEFAULT_CONFIG.bgStarTwinkleSpeedRandomness);
  const [bgStarSizeRandomness, setBgStarSizeRandomness] = useState(DEFAULT_CONFIG.bgStarSizeRandomness);
  const [bgStarCount, setBgStarCount] = useState(DEFAULT_CONFIG.bgStarCount);
  const [bgStarMinBrightness, setBgStarMinBrightness] = useState(DEFAULT_CONFIG.bgStarMinBrightness);
  const [bgStarMaxBrightness, setBgStarMaxBrightness] = useState(DEFAULT_CONFIG.bgStarMaxBrightness);

  // Load config from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const config = JSON.parse(stored);
        // Layer 1
        setStarScale(config.starScale ?? DEFAULT_CONFIG.starScale);
        setStarSpeed(config.starSpeed ?? DEFAULT_CONFIG.starSpeed);
        setStarFrequency(config.starFrequency ?? DEFAULT_CONFIG.starFrequency);
        setTwinkleAmount(config.twinkleAmount ?? DEFAULT_CONFIG.twinkleAmount);
        setTwinkleSpeed(config.twinkleSpeed ?? DEFAULT_CONFIG.twinkleSpeed);
        setTwinkleSpeedRandomness(config.twinkleSpeedRandomness ?? DEFAULT_CONFIG.twinkleSpeedRandomness);
        setSizeRandomness(config.sizeRandomness ?? DEFAULT_CONFIG.sizeRandomness);
        // Layer 2
        setStarScale2(config.starScale2 ?? DEFAULT_CONFIG.starScale2);
        setStarSpeed2(config.starSpeed2 ?? DEFAULT_CONFIG.starSpeed2);
        setStarFrequency2(config.starFrequency2 ?? DEFAULT_CONFIG.starFrequency2);
        setLineLength2(config.lineLength2 ?? DEFAULT_CONFIG.lineLength2);
        setTwinkleAmount2(config.twinkleAmount2 ?? DEFAULT_CONFIG.twinkleAmount2);
        setTwinkleSpeed2(config.twinkleSpeed2 ?? DEFAULT_CONFIG.twinkleSpeed2);
        setTwinkleSpeedRandomness2(config.twinkleSpeedRandomness2 ?? DEFAULT_CONFIG.twinkleSpeedRandomness2);
        setSizeRandomness2(config.sizeRandomness2 ?? DEFAULT_CONFIG.sizeRandomness2);
        // Layer 3
        setStarScale3(config.starScale3 ?? DEFAULT_CONFIG.starScale3);
        setStarSpeed3(config.starSpeed3 ?? DEFAULT_CONFIG.starSpeed3);
        setStarFrequency3(config.starFrequency3 ?? DEFAULT_CONFIG.starFrequency3);
        setLineLength3(config.lineLength3 ?? DEFAULT_CONFIG.lineLength3);
        setSpawnDelay3(config.spawnDelay3 ?? DEFAULT_CONFIG.spawnDelay3);
        setTwinkleAmount3(config.twinkleAmount3 ?? DEFAULT_CONFIG.twinkleAmount3);
        setTwinkleSpeed3(config.twinkleSpeed3 ?? DEFAULT_CONFIG.twinkleSpeed3);
        setTwinkleSpeedRandomness3(config.twinkleSpeedRandomness3 ?? DEFAULT_CONFIG.twinkleSpeedRandomness3);
        setSizeRandomness3(config.sizeRandomness3 ?? DEFAULT_CONFIG.sizeRandomness3);
        // Background stars
        setBgStarTwinkleAmount(config.bgStarTwinkleAmount ?? DEFAULT_CONFIG.bgStarTwinkleAmount);
        setBgStarTwinkleSpeed(config.bgStarTwinkleSpeed ?? DEFAULT_CONFIG.bgStarTwinkleSpeed);
        setBgStarTwinkleSpeedRandomness(config.bgStarTwinkleSpeedRandomness ?? DEFAULT_CONFIG.bgStarTwinkleSpeedRandomness);
        setBgStarSizeRandomness(config.bgStarSizeRandomness ?? DEFAULT_CONFIG.bgStarSizeRandomness);
        setBgStarCount(config.bgStarCount ?? DEFAULT_CONFIG.bgStarCount);
        setBgStarMinBrightness(config.bgStarMinBrightness ?? DEFAULT_CONFIG.bgStarMinBrightness);
        setBgStarMaxBrightness(config.bgStarMaxBrightness ?? DEFAULT_CONFIG.bgStarMaxBrightness);
      } catch (e) {
        console.error('Failed to load config:', e);
      }
    }
  }, []);

  // Save config to localStorage whenever any value changes
  useEffect(() => {
    try {
      const config = {
        starScale, starSpeed, starFrequency, twinkleAmount, twinkleSpeed, twinkleSpeedRandomness, sizeRandomness,
        starScale2, starSpeed2, starFrequency2, lineLength2, twinkleAmount2, twinkleSpeed2, twinkleSpeedRandomness2, sizeRandomness2,
        starScale3, starSpeed3, starFrequency3, lineLength3, spawnDelay3, twinkleAmount3, twinkleSpeed3, twinkleSpeedRandomness3, sizeRandomness3,
        bgStarTwinkleAmount, bgStarTwinkleSpeed, bgStarTwinkleSpeedRandomness, bgStarSizeRandomness, bgStarCount, bgStarMinBrightness, bgStarMaxBrightness,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

      // Dispatch custom event to notify landing page - defer to avoid blocking React state updates
      setTimeout(() => {
        try {
          window.dispatchEvent(new Event('mek-landing-config-updated'));
        } catch (eventError) {
          console.error('[DEBUG] Error dispatching config update event:', eventError);
        }
      }, 0);
    } catch (error) {
      console.error('[DEBUG] Error saving config:', error);
    }
  }, [
    starScale, starSpeed, starFrequency, twinkleAmount, twinkleSpeed, twinkleSpeedRandomness, sizeRandomness,
    starScale2, starSpeed2, starFrequency2, lineLength2, twinkleAmount2, twinkleSpeed2, twinkleSpeedRandomness2, sizeRandomness2,
    starScale3, starSpeed3, starFrequency3, lineLength3, spawnDelay3, twinkleAmount3, twinkleSpeed3, twinkleSpeedRandomness3, sizeRandomness3,
    bgStarTwinkleAmount, bgStarTwinkleSpeed, bgStarTwinkleSpeedRandomness, bgStarSizeRandomness, bgStarCount, bgStarMinBrightness, bgStarMaxBrightness,
  ]);

  const resetAll = () => {
    // Layer 1
    setStarScale(DEFAULT_CONFIG.starScale);
    setStarSpeed(DEFAULT_CONFIG.starSpeed);
    setStarFrequency(DEFAULT_CONFIG.starFrequency);
    setTwinkleAmount(DEFAULT_CONFIG.twinkleAmount);
    setTwinkleSpeed(DEFAULT_CONFIG.twinkleSpeed);
    setSizeRandomness(DEFAULT_CONFIG.sizeRandomness);
    // Layer 2
    setStarScale2(DEFAULT_CONFIG.starScale2);
    setStarSpeed2(DEFAULT_CONFIG.starSpeed2);
    setStarFrequency2(DEFAULT_CONFIG.starFrequency2);
    setLineLength2(DEFAULT_CONFIG.lineLength2);
    setTwinkleAmount2(DEFAULT_CONFIG.twinkleAmount2);
    setTwinkleSpeed2(DEFAULT_CONFIG.twinkleSpeed2);
    setSizeRandomness2(DEFAULT_CONFIG.sizeRandomness2);
    // Layer 3
    setStarScale3(DEFAULT_CONFIG.starScale3);
    setStarSpeed3(DEFAULT_CONFIG.starSpeed3);
    setStarFrequency3(DEFAULT_CONFIG.starFrequency3);
    setLineLength3(DEFAULT_CONFIG.lineLength3);
    setSpawnDelay3(DEFAULT_CONFIG.spawnDelay3);
    setTwinkleAmount3(DEFAULT_CONFIG.twinkleAmount3);
    setTwinkleSpeed3(DEFAULT_CONFIG.twinkleSpeed3);
    setSizeRandomness3(DEFAULT_CONFIG.sizeRandomness3);
    // Background stars
    setBgStarTwinkleAmount(DEFAULT_CONFIG.bgStarTwinkleAmount);
    setBgStarTwinkleSpeed(DEFAULT_CONFIG.bgStarTwinkleSpeed);
    setBgStarSizeRandomness(DEFAULT_CONFIG.bgStarSizeRandomness);
    setBgStarCount(DEFAULT_CONFIG.bgStarCount);
    setBgStarMinBrightness(DEFAULT_CONFIG.bgStarMinBrightness);
    setBgStarMaxBrightness(DEFAULT_CONFIG.bgStarMaxBrightness);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Starfield Debug Controls</h1>
          <button
            onClick={resetAll}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Reset All to Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Background Static Stars Card */}
          <div className="bg-gray-800 p-6 rounded-lg border-2 border-yellow-500">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">Background Static Stars</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Star Count: {bgStarCount}</label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={bgStarCount}
                  onChange={(e) => setBgStarCount(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Twinkle Amount: {bgStarTwinkleAmount}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={bgStarTwinkleAmount}
                  onChange={(e) => setBgStarTwinkleAmount(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Twinkle Speed: {bgStarTwinkleSpeed.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={bgStarTwinkleSpeed}
                  onChange={(e) => setBgStarTwinkleSpeed(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Size Randomness: {bgStarSizeRandomness}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={bgStarSizeRandomness}
                  onChange={(e) => setBgStarSizeRandomness(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Min Brightness: {bgStarMinBrightness.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={bgStarMinBrightness}
                  onChange={(e) => setBgStarMinBrightness(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Max Brightness: {bgStarMaxBrightness.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={bgStarMaxBrightness}
                  onChange={(e) => setBgStarMaxBrightness(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Layer 1 - Slow Moving Stars */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Layer 1 - Slow Moving Stars</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Star Scale: {starScale.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={starScale}
                  onChange={(e) => setStarScale(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Star Speed: {starSpeed}</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={starSpeed}
                  onChange={(e) => setStarSpeed(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Star Frequency: {starFrequency}</label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={starFrequency}
                  onChange={(e) => setStarFrequency(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Twinkle Amount: {twinkleAmount}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={twinkleAmount}
                  onChange={(e) => setTwinkleAmount(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Twinkle Speed: {twinkleSpeed.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={twinkleSpeed}
                  onChange={(e) => setTwinkleSpeed(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Size Randomness: {sizeRandomness}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={sizeRandomness}
                  onChange={(e) => setSizeRandomness(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Layer 2 - Fast Moving Streaks */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Layer 2 - Fast Moving Streaks</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Star Scale: {starScale2.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={starScale2}
                  onChange={(e) => setStarScale2(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Star Speed: {starSpeed2}</label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={starSpeed2}
                  onChange={(e) => setStarSpeed2(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Star Frequency: {starFrequency2}</label>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="10"
                  value={starFrequency2}
                  onChange={(e) => setStarFrequency2(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Line Length: {lineLength2}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={lineLength2}
                  onChange={(e) => setLineLength2(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Twinkle Amount: {twinkleAmount2}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={twinkleAmount2}
                  onChange={(e) => setTwinkleAmount2(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Twinkle Speed: {twinkleSpeed2.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={twinkleSpeed2}
                  onChange={(e) => setTwinkleSpeed2(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Size Randomness: {sizeRandomness2}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={sizeRandomness2}
                  onChange={(e) => setSizeRandomness2(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Layer 3 - Ultra-Fast Streaks */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Layer 3 - Ultra-Fast Streaks</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Star Scale: {starScale3.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={starScale3}
                  onChange={(e) => setStarScale3(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Star Speed: {starSpeed3}</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={starSpeed3}
                  onChange={(e) => setStarSpeed3(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Star Frequency: {starFrequency3}</label>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="10"
                  value={starFrequency3}
                  onChange={(e) => setStarFrequency3(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Line Length: {lineLength3}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={lineLength3}
                  onChange={(e) => setLineLength3(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Spawn Delay: {spawnDelay3}ms</label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={spawnDelay3}
                  onChange={(e) => setSpawnDelay3(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Twinkle Amount: {twinkleAmount3}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={twinkleAmount3}
                  onChange={(e) => setTwinkleAmount3(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Twinkle Speed: {twinkleSpeed3.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={twinkleSpeed3}
                  onChange={(e) => setTwinkleSpeed3(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Size Randomness: {sizeRandomness3}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={sizeRandomness3}
                  onChange={(e) => setSizeRandomness3(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">
            All changes are automatically saved to localStorage and will sync with the landing page in real-time.
            Open the landing page in another tab to see live updates.
          </p>
        </div>
      </div>
    </div>
  );
}
