'use client';

import { useState } from 'react';

export default function MekLayoutsPage() {
  const [activeLayout, setActiveLayout] = useState<1 | 2 | 3>(1);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <h1 className="text-3xl font-bold mb-4 text-center">Mek Detail Page - Wireframe Options</h1>

        {/* Layout Toggle Buttons */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setActiveLayout(1)}
            className={`px-6 py-3 rounded ${
              activeLayout === 1
                ? 'bg-yellow-500 text-black font-bold'
                : 'bg-gray-800 text-white border border-gray-600'
            }`}
          >
            Layout 1: Three-Column (Sidebars)
          </button>
          <button
            onClick={() => setActiveLayout(2)}
            className={`px-6 py-3 rounded ${
              activeLayout === 2
                ? 'bg-yellow-500 text-black font-bold'
                : 'bg-gray-800 text-white border border-gray-600'
            }`}
          >
            Layout 2: Two-Column Asymmetric
          </button>
          <button
            onClick={() => setActiveLayout(3)}
            className={`px-6 py-3 rounded ${
              activeLayout === 3
                ? 'bg-yellow-500 text-black font-bold'
                : 'bg-gray-800 text-white border border-gray-600'
            }`}
          >
            Layout 3: Current (Full-Width Stack)
          </button>
        </div>

        {/* Render Active Layout */}
        {activeLayout === 1 && <ThreeColumnLayout />}
        {activeLayout === 2 && <TwoColumnAsymmetricLayout />}
        {activeLayout === 3 && <FullWidthStackLayout />}

      </div>
    </div>
  );
}

// LAYOUT 1: Three-Column with Sidebars (Like the screenshot)
function ThreeColumnLayout() {
  return (
    <div className="space-y-8">
      {/* Top Section: Three Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* LEFT SIDEBAR */}
        <div className="lg:col-span-3 space-y-4">
          {/* Designation */}
          <div className="border-2 border-yellow-500 bg-gray-900/50 p-4">
            <div className="text-xs text-yellow-500 font-bold mb-2">DESIGNATION</div>
            <div className="text-white font-bold">Mekanism #1234</div>
          </div>

          {/* Rank */}
          <div className="border-2 border-yellow-500 bg-gray-900/50 p-4">
            <div className="text-xs text-yellow-500 font-bold mb-2">RANK</div>
            <div className="text-white text-2xl font-bold">2985</div>
          </div>

          {/* Operator/Corporation */}
          <div className="border-2 border-yellow-500 bg-gray-900/50 p-4">
            <div className="text-xs text-yellow-500 font-bold mb-2">OPERATOR</div>
            <div className="text-white text-sm">staked9...egjf8r</div>
          </div>

          {/* Active Status */}
          <div className="border-2 border-cyan-500 bg-gray-900/50 p-4">
            <div className="text-xs text-cyan-500 font-bold mb-2">IDLE</div>
            <div className="text-white">Toggle Switch</div>
          </div>

          {/* Active Modifiers */}
          <div className="border-2 border-green-500 bg-gray-900/50 p-4">
            <div className="text-xs text-green-500 font-bold mb-2">ACTIVE MODIFIERS</div>
            <div className="text-sm space-y-1">
              <div className="text-green-400">+2.5 gold/hr</div>
              <div className="text-green-400">+5% gold rate</div>
              <div className="text-green-400">+1% bank interest</div>
            </div>
          </div>
        </div>

        {/* CENTER - MEK IMAGE */}
        <div className="lg:col-span-6 flex items-start justify-center">
          <div className="border-4 border-blue-500 bg-gray-900/50 p-8 w-full">
            <div className="text-xs text-blue-500 font-bold mb-4 text-center">MEK IMAGE AREA</div>
            <div className="w-full aspect-square max-w-md mx-auto border-2 border-gray-600 bg-gray-800 flex items-center justify-center">
              <span className="text-gray-500">Large Mek Image<br/>400x400</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="lg:col-span-3 space-y-4">
          {/* Level Progress */}
          <div className="border-2 border-purple-500 bg-gray-900/50 p-4">
            <div className="text-xs text-purple-500 font-bold mb-2">LEVEL PROGRESS</div>
            <div className="flex justify-between text-sm mb-1">
              <span>LEVEL 1</span>
              <span>LEVEL 2</span>
            </div>
            <div className="w-full h-4 border border-gray-600 bg-gray-800 mb-2">
              <div className="h-full w-3/4 bg-yellow-500"></div>
            </div>
            <div className="text-xs text-gray-400 text-center">6,720 / 10,000 XP</div>
          </div>

          {/* Gold Generation */}
          <div className="border-2 border-green-500 bg-gray-900/50 p-4">
            <div className="text-xs text-green-500 font-bold mb-2">GOLD GENERATION</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-400">BASE</div>
                <div className="text-white">20.0/hr</div>
              </div>
              <div>
                <div className="text-xs text-green-400 font-bold">EFFECTIVE</div>
                <div className="text-green-400 font-bold">24.0/hr</div>
              </div>
            </div>
          </div>

          {/* Gold Produced */}
          <div className="border-2 border-yellow-500 bg-gray-900/50 p-4">
            <div className="text-xs text-yellow-500 font-bold mb-2">GOLD PRODUCED</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-400">CURRENT OWNER</div>
                <div className="text-white">12,869.015</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">ALL TIME</div>
                <div className="text-white">458,414.324</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Variation Cards */}
      <div className="border-2 border-purple-500 bg-gray-900/50 p-4">
        <div className="text-xs text-purple-500 font-bold mb-3">VARIATION CARDS</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <VariationCard title="HEAD VARIATION" />
          <VariationCard title="BODY VARIATION" />
          <VariationCard title="TRAIT VARIATION" />
        </div>
      </div>

      {/* Abilities Tree */}
      <div className="border-2 border-red-500 bg-gray-900/50 p-4">
        <div className="text-xs text-red-500 font-bold mb-3">ABILITIES TREE</div>
        <div className="w-full h-96 border-2 border-gray-600 bg-gray-800 flex items-center justify-center">
          <span className="text-gray-500">Node Tree / Talent Tree Area</span>
        </div>
      </div>
    </div>
  );
}

// LAYOUT 2: Two-Column Asymmetric
function TwoColumnAsymmetricLayout() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* LEFT COLUMN (2/3 width) - Visual Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mek Image + Basic Info */}
          <div className="border-4 border-yellow-500 bg-gray-900/50 p-6">
            <div className="text-xs text-yellow-500 font-bold mb-4">HERO SECTION</div>

            <div className="w-full max-w-sm mx-auto">
              <div className="w-full aspect-square border-2 border-gray-600 bg-gray-800 flex items-center justify-center mb-4">
                <span className="text-gray-500">Mek Image<br/>300x300</span>
              </div>

              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-white">Mek #1234</div>
                <div className="text-lg text-yellow-500">Corporation Name</div>
                <div className="text-gray-400">Employee ID / Name</div>
              </div>
            </div>
          </div>

          {/* Variation Cards (3 across) */}
          <div className="border-2 border-purple-500 bg-gray-900/50 p-4">
            <div className="text-xs text-purple-500 font-bold mb-3">VARIATIONS</div>
            <div className="grid grid-cols-3 gap-3">
              <VariationCard title="HEAD" compact />
              <VariationCard title="BODY" compact />
              <VariationCard title="TRAIT" compact />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1/3 width) - Stats Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Level */}
          <div className="border-2 border-blue-500 bg-gray-900/50 p-4">
            <div className="text-xs text-blue-500 font-bold mb-2">LEVEL</div>
            <div className="text-2xl font-bold mb-2">25</div>
            <div className="w-full h-4 border border-gray-600 bg-gray-800">
              <div className="h-full w-2/3 bg-blue-500"></div>
            </div>
          </div>

          {/* Gold Production */}
          <div className="border-2 border-green-500 bg-gray-900/50 p-4">
            <div className="text-xs text-green-500 font-bold mb-2">GOLD PRODUCTION</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Current:</span>
                <span className="text-white">50/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Base:</span>
                <span className="text-white">40/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bonus:</span>
                <span className="text-green-400">+10/hr</span>
              </div>
              <div className="flex justify-between border-t border-gray-600 pt-2">
                <span className="text-gray-400">Total:</span>
                <span className="text-white font-bold">50/hr</span>
              </div>
            </div>
          </div>

          {/* Cumulative */}
          <div className="border-2 border-yellow-500 bg-gray-900/50 p-4">
            <div className="text-xs text-yellow-500 font-bold mb-2">CUMULATIVE</div>
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-gray-400 text-xs">Current Corp</div>
                <div className="text-white font-bold">1,250,000</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Lifetime</div>
                <div className="text-white font-bold">5,450,000</div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="border-2 border-cyan-500 bg-gray-900/50 p-4">
            <div className="text-xs text-cyan-500 font-bold mb-2">STATUS</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Active:</span>
                <span className="text-green-400">Yes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Rank:</span>
                <span className="text-white">#452</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Abilities Tree */}
      <div className="border-2 border-red-500 bg-gray-900/50 p-4">
        <div className="text-xs text-red-500 font-bold mb-3">ABILITIES TREE</div>
        <div className="w-full h-96 border-2 border-gray-600 bg-gray-800 flex items-center justify-center">
          <span className="text-gray-500">Node Tree / Talent Tree Area</span>
        </div>
      </div>
    </div>
  );
}

// LAYOUT 3: Full-Width Stack (Current)
function FullWidthStackLayout() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* HERO SECTION - Dead center at top */}
      <div className="border-4 border-yellow-500 bg-gray-900/50 p-8 mb-8 text-center">
          <div className="text-xs text-yellow-500 font-bold mb-4">HERO SECTION</div>

          {/* Large Mek Image */}
          <div className="w-48 h-48 md:w-64 md:h-64 mx-auto border-2 border-gray-600 bg-gray-800 flex items-center justify-center mb-4">
            <span className="text-gray-500">Large Mek Image</span>
          </div>

          {/* Mek Number */}
          <div className="text-2xl font-bold text-white mb-2">
            Mek #1234
          </div>

          {/* Corporation Name */}
          <div className="text-xl text-yellow-500 mb-1">
            Corporation Name
          </div>

          {/* Employee ID / Mek Name */}
          <div className="text-lg text-gray-400">
            Employee ID / Mek Name
          </div>
        </div>

        {/* LEVEL INFO */}
        <div className="border-2 border-blue-500 bg-gray-900/50 p-4 mb-8">
          <div className="text-xs text-blue-500 font-bold mb-3">LEVEL INFO</div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white">Current Level: 25</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-8 border-2 border-gray-600 bg-gray-800 flex items-center justify-center">
            <span className="text-gray-500">Level Progress Bar</span>
          </div>
        </div>

        {/* GOLD PRODUCTION STATS */}
        <div className="border-2 border-green-500 bg-gray-900/50 p-4 mb-8">
          <div className="text-xs text-green-500 font-bold mb-3">GOLD PRODUCTION STATS</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-gray-600 p-3 bg-gray-800">
              <div className="text-xs text-gray-400 mb-1">Current Rate</div>
              <div className="text-white">50/hr</div>
            </div>
            <div className="border border-gray-600 p-3 bg-gray-800">
              <div className="text-xs text-gray-400 mb-1">Base Rate</div>
              <div className="text-white">40/hr</div>
            </div>
            <div className="border border-gray-600 p-3 bg-gray-800">
              <div className="text-xs text-gray-400 mb-1">Bonus Rate</div>
              <div className="text-white">+10/hr</div>
            </div>
            <div className="border border-gray-600 p-3 bg-gray-800">
              <div className="text-xs text-gray-400 mb-1">Total/Hour</div>
              <div className="text-white font-bold">50/hr</div>
            </div>
          </div>
        </div>

        {/* CUMULATIVE GOLD */}
        <div className="border-2 border-yellow-500 bg-gray-900/50 p-4 mb-8">
          <div className="text-xs text-yellow-500 font-bold mb-3">CUMULATIVE GOLD</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-600 p-3 bg-gray-800">
              <div className="text-xs text-gray-400 mb-1">Gold for Current Corporation</div>
              <div className="text-white text-xl">1,250,000</div>
            </div>
            <div className="border border-gray-600 p-3 bg-gray-800">
              <div className="text-xs text-gray-400 mb-1">Gold Lifetime (All Corporations)</div>
              <div className="text-white text-xl">5,450,000</div>
            </div>
          </div>
        </div>

        {/* THREE VARIATION CARDS */}
        <div className="border-2 border-purple-500 bg-gray-900/50 p-4 mb-8">
          <div className="text-xs text-purple-500 font-bold mb-3">VARIATION CARDS</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Head Variation Card */}
            <div className="border-2 border-gray-600 bg-gray-800 p-4">
              <div className="text-sm text-yellow-500 mb-3 font-bold">HEAD VARIATION</div>

              {/* Variation Image */}
              <div className="w-full h-32 border border-gray-600 bg-gray-700 flex items-center justify-center mb-3">
                <span className="text-gray-500 text-xs">Head Image</span>
              </div>

              {/* Variation Name */}
              <div className="text-white mb-2">Variation Name</div>

              {/* Total Copies */}
              <div className="text-gray-400 text-sm mb-3">3 of 4000</div>

              {/* Essence Stats */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Essence:</span>
                  <span className="text-white">100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bonus Essence:</span>
                  <span className="text-green-400">+25</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-1">
                  <span className="text-gray-400">Total Essence:</span>
                  <span className="text-yellow-500 font-bold">125</span>
                </div>
              </div>
            </div>

            {/* Body Variation Card */}
            <div className="border-2 border-gray-600 bg-gray-800 p-4">
              <div className="text-sm text-yellow-500 mb-3 font-bold">BODY VARIATION</div>

              {/* Variation Image */}
              <div className="w-full h-32 border border-gray-600 bg-gray-700 flex items-center justify-center mb-3">
                <span className="text-gray-500 text-xs">Body Image</span>
              </div>

              {/* Variation Name */}
              <div className="text-white mb-2">Variation Name</div>

              {/* Total Copies */}
              <div className="text-gray-400 text-sm mb-3">1 of 4000</div>

              {/* Essence Stats */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Essence:</span>
                  <span className="text-white">150</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bonus Essence:</span>
                  <span className="text-green-400">+50</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-1">
                  <span className="text-gray-400">Total Essence:</span>
                  <span className="text-yellow-500 font-bold">200</span>
                </div>
              </div>
            </div>

            {/* Trait Variation Card */}
            <div className="border-2 border-gray-600 bg-gray-800 p-4">
              <div className="text-sm text-yellow-500 mb-3 font-bold">TRAIT VARIATION</div>

              {/* Variation Image */}
              <div className="w-full h-32 border border-gray-600 bg-gray-700 flex items-center justify-center mb-3">
                <span className="text-gray-500 text-xs">Trait Image</span>
              </div>

              {/* Variation Name */}
              <div className="text-white mb-2">Variation Name</div>

              {/* Total Copies */}
              <div className="text-gray-400 text-sm mb-3">7 of 4000</div>

              {/* Essence Stats */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Essence:</span>
                  <span className="text-white">80</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bonus Essence:</span>
                  <span className="text-green-400">+15</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-1">
                  <span className="text-gray-400">Total Essence:</span>
                  <span className="text-yellow-500 font-bold">95</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATUS */}
        <div className="border-2 border-cyan-500 bg-gray-900/50 p-4 mb-8">
          <div className="text-xs text-cyan-500 font-bold mb-3">STATUS</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-600 p-3 bg-gray-800">
              <div className="text-xs text-gray-400 mb-1">Active Employee</div>
              <div className="text-white">Yes</div>
            </div>
            <div className="border border-gray-600 p-3 bg-gray-800">
              <div className="text-xs text-gray-400 mb-1">Rank</div>
              <div className="text-white">#452</div>
            </div>
          </div>
        </div>

        {/* ABILITIES SECTION */}
        <div className="border-2 border-red-500 bg-gray-900/50 p-4">
          <div className="text-xs text-red-500 font-bold mb-3">ABILITIES SECTION</div>

          {/* Large Tall Rectangle for Node/Talent Tree */}
          <div className="w-full h-96 md:h-[600px] border-2 border-gray-600 bg-gray-800 flex items-center justify-center">
            <span className="text-gray-500">Node Tree / Talent Tree Area</span>
          </div>
        </div>
    </div>
  );
}

// Reusable Variation Card Component
function VariationCard({ title, compact = false }: { title: string; compact?: boolean }) {
  if (compact) {
    return (
      <div className="border-2 border-gray-600 bg-gray-800 p-2">
        <div className="text-xs text-yellow-500 font-bold mb-2">{title}</div>
        <div className="w-full aspect-square border border-gray-600 bg-gray-700 flex items-center justify-center mb-2">
          <span className="text-gray-500 text-xs">Img</span>
        </div>
        <div className="text-xs space-y-1">
          <div className="text-white text-center">Name</div>
          <div className="text-gray-400 text-center">3 of 4000</div>
          <div className="text-gray-400">Base: 100</div>
          <div className="text-green-400">+Bonus: 25</div>
          <div className="text-yellow-500 font-bold">Total: 125</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-600 bg-gray-800 p-4">
      <div className="text-sm text-yellow-500 mb-3 font-bold">{title}</div>

      <div className="w-full h-32 border border-gray-600 bg-gray-700 flex items-center justify-center mb-3">
        <span className="text-gray-500 text-xs">Image</span>
      </div>

      <div className="text-white mb-2">Variation Name</div>
      <div className="text-gray-400 text-sm mb-3">3 of 4000</div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Base Essence:</span>
          <span className="text-white">100</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Bonus Essence:</span>
          <span className="text-green-400">+25</span>
        </div>
        <div className="flex justify-between border-t border-gray-600 pt-1">
          <span className="text-gray-400">Total Essence:</span>
          <span className="text-yellow-500 font-bold">125</span>
        </div>
      </div>
    </div>
  );
}
