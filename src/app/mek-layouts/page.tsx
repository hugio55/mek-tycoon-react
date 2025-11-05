'use client';

import { useState } from 'react';

export default function MekLayoutsPage() {
  const [selectedLayout, setSelectedLayout] = useState<1 | 2 | 3>(1);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      {/* Layout Selector */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-4">Mek Layout Wireframes</h1>
        <p className="text-gray-400 mb-6">
          Select a layout option to preview different responsive structures
        </p>

        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setSelectedLayout(1)}
            className={`px-6 py-3 border-2 transition-colors ${
              selectedLayout === 1
                ? 'border-yellow-500 bg-yellow-500/20 text-yellow-500'
                : 'border-gray-600 hover:border-gray-400'
            }`}
          >
            Layout 1: Traditional Top-Down
          </button>
          <button
            onClick={() => setSelectedLayout(2)}
            className={`px-6 py-3 border-2 transition-colors ${
              selectedLayout === 2
                ? 'border-yellow-500 bg-yellow-500/20 text-yellow-500'
                : 'border-gray-600 hover:border-gray-400'
            }`}
          >
            Layout 2: Sidebar Focus
          </button>
          <button
            onClick={() => setSelectedLayout(3)}
            className={`px-6 py-3 border-2 transition-colors ${
              selectedLayout === 3
                ? 'border-yellow-500 bg-yellow-500/20 text-yellow-500'
                : 'border-gray-600 hover:border-gray-400'
            }`}
          >
            Layout 3: Grid Masonry
          </button>
        </div>
      </div>

      {/* Layout 1: Traditional Top-Down */}
      {selectedLayout === 1 && <Layout1 />}

      {/* Layout 2: Sidebar Focus */}
      {selectedLayout === 2 && <Layout2 />}

      {/* Layout 3: Grid Masonry */}
      {selectedLayout === 3 && <Layout3 />}
    </div>
  );
}

// Layout 1: Traditional Top-Down
function Layout1() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="border-2 border-gray-600 bg-gray-900/50 p-6 mb-6">
        <div className="text-sm text-gray-400 mb-2">HERO SECTION</div>
        <div className="h-32 md:h-48 flex items-center justify-center text-gray-500">
          Mek Name, Image, Level, XP Bar
        </div>
      </div>

      {/* Stats Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border-2 border-gray-600 bg-gray-900/50 p-4">
          <div className="text-sm text-gray-400 mb-2">STATS PANEL 1</div>
          <div className="h-24 flex items-center justify-center text-gray-500">
            Attack, Defense, Speed
          </div>
        </div>
        <div className="border-2 border-gray-600 bg-gray-900/50 p-4">
          <div className="text-sm text-gray-400 mb-2">STATS PANEL 2</div>
          <div className="h-24 flex items-center justify-center text-gray-500">
            HP, Energy, Shields
          </div>
        </div>
        <div className="border-2 border-gray-600 bg-gray-900/50 p-4">
          <div className="text-sm text-gray-400 mb-2">STATS PANEL 3</div>
          <div className="h-24 flex items-center justify-center text-gray-500">
            Buffs, Effects, Status
          </div>
        </div>
      </div>

      {/* Variation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border-2 border-yellow-600 bg-yellow-900/20 p-4">
          <div className="text-sm text-yellow-400 mb-2">HEAD VARIATION</div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="text-xs text-gray-500">Rarity, Tier, Stats, Bonuses</div>
          </div>
        </div>
        <div className="border-2 border-yellow-600 bg-yellow-900/20 p-4">
          <div className="text-sm text-yellow-400 mb-2">BODY VARIATION</div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="text-xs text-gray-500">Rarity, Tier, Stats, Bonuses</div>
          </div>
        </div>
        <div className="border-2 border-yellow-600 bg-yellow-900/20 p-4">
          <div className="text-sm text-yellow-400 mb-2">TRAIT VARIATION</div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="text-xs text-gray-500">Rarity, Tier, Stats, Bonuses</div>
          </div>
        </div>
      </div>

      {/* Abilities Tree */}
      <div className="border-2 border-blue-600 bg-blue-900/20 p-6">
        <div className="text-sm text-blue-400 mb-4">ABILITIES TREE</div>
        <div className="h-96 flex items-center justify-center text-gray-500">
          Large talent tree / skill graph area
        </div>
      </div>
    </div>
  );
}

// Layout 2: Sidebar Focus
function Layout2() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          {/* Hero Section */}
          <div className="border-2 border-gray-600 bg-gray-900/50 p-4">
            <div className="text-sm text-gray-400 mb-2">HERO</div>
            <div className="h-48 flex items-center justify-center text-gray-500">
              Mek Image
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
            </div>
          </div>

          {/* Stats Panels Stacked */}
          <div className="border-2 border-gray-600 bg-gray-900/50 p-4">
            <div className="text-sm text-gray-400 mb-2">STATS 1</div>
            <div className="h-20 flex items-center justify-center text-gray-500">Stats</div>
          </div>
          <div className="border-2 border-gray-600 bg-gray-900/50 p-4">
            <div className="text-sm text-gray-400 mb-2">STATS 2</div>
            <div className="h-20 flex items-center justify-center text-gray-500">Stats</div>
          </div>
          <div className="border-2 border-gray-600 bg-gray-900/50 p-4">
            <div className="text-sm text-gray-400 mb-2">STATS 3</div>
            <div className="h-20 flex items-center justify-center text-gray-500">Stats</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* Variation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-yellow-600 bg-yellow-900/20 p-4">
              <div className="text-sm text-yellow-400 mb-2">HEAD</div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-700 rounded"></div>
                <div className="h-6 bg-gray-700 rounded"></div>
                <div className="h-6 bg-gray-700 rounded"></div>
                <div className="h-6 bg-gray-700 rounded"></div>
              </div>
            </div>
            <div className="border-2 border-yellow-600 bg-yellow-900/20 p-4">
              <div className="text-sm text-yellow-400 mb-2">BODY</div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-700 rounded"></div>
                <div className="h-6 bg-gray-700 rounded"></div>
                <div className="h-6 bg-gray-700 rounded"></div>
                <div className="h-6 bg-gray-700 rounded"></div>
              </div>
            </div>
            <div className="border-2 border-yellow-600 bg-yellow-900/20 p-4">
              <div className="text-sm text-yellow-400 mb-2">TRAIT</div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-700 rounded"></div>
                <div className="h-6 bg-gray-700 rounded"></div>
                <div className="h-6 bg-gray-700 rounded"></div>
                <div className="h-6 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>

          {/* Abilities Tree */}
          <div className="border-2 border-blue-600 bg-blue-900/20 p-6">
            <div className="text-sm text-blue-400 mb-4">ABILITIES TREE</div>
            <div className="h-96 lg:h-[600px] flex items-center justify-center text-gray-500">
              Large talent tree / skill graph area
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Layout 3: Grid Masonry
function Layout3() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-max">
        {/* Hero - Spans 2 columns on desktop */}
        <div className="md:col-span-2 border-2 border-gray-600 bg-gray-900/50 p-6">
          <div className="text-sm text-gray-400 mb-2">HERO SECTION</div>
          <div className="h-48 md:h-64 flex items-center justify-center text-gray-500">
            Mek Name, Image, Level, XP
          </div>
        </div>

        {/* Stats Panels - 2 columns, stack on mobile */}
        <div className="border-2 border-gray-600 bg-gray-900/50 p-4">
          <div className="text-sm text-gray-400 mb-2">STATS 1</div>
          <div className="h-32 flex items-center justify-center text-gray-500">Attack/Def</div>
        </div>
        <div className="border-2 border-gray-600 bg-gray-900/50 p-4">
          <div className="text-sm text-gray-400 mb-2">STATS 2</div>
          <div className="h-32 flex items-center justify-center text-gray-500">HP/Energy</div>
        </div>

        {/* Head Variation - Tall card */}
        <div className="md:row-span-2 border-2 border-yellow-600 bg-yellow-900/20 p-4">
          <div className="text-sm text-yellow-400 mb-2">HEAD VARIATION</div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="text-xs text-gray-500 mt-4">Detailed variation data</div>
          </div>
        </div>

        {/* Body Variation - Tall card */}
        <div className="md:row-span-2 border-2 border-yellow-600 bg-yellow-900/20 p-4">
          <div className="text-sm text-yellow-400 mb-2">BODY VARIATION</div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="text-xs text-gray-500 mt-4">Detailed variation data</div>
          </div>
        </div>

        {/* Stats Panel 3 */}
        <div className="border-2 border-gray-600 bg-gray-900/50 p-4">
          <div className="text-sm text-gray-400 mb-2">STATS 3</div>
          <div className="h-32 flex items-center justify-center text-gray-500">Buffs/Status</div>
        </div>

        {/* Trait Variation - Tall card */}
        <div className="md:row-span-2 border-2 border-yellow-600 bg-yellow-900/20 p-4">
          <div className="text-sm text-yellow-400 mb-2">TRAIT VARIATION</div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="text-xs text-gray-500 mt-4">Detailed variation data</div>
          </div>
        </div>

        {/* Abilities Tree - Spans full width */}
        <div className="md:col-span-2 lg:col-span-4 border-2 border-blue-600 bg-blue-900/20 p-6">
          <div className="text-sm text-blue-400 mb-4">ABILITIES TREE</div>
          <div className="h-96 md:h-[500px] flex items-center justify-center text-gray-500">
            Large talent tree / skill graph area
          </div>
        </div>
      </div>
    </div>
  );
}
