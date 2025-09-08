"use client";

import { useState } from "react";
import EssenceDonutChart from "@/components/essence-donut-chart";

// Sample essence data with realistic distribution
const sampleEssenceData = [
  {
    id: "chrome",
    name: "Chrome Essence",
    amount: 1250,
    currentValue: 45,
    maxAmount: 2000,
    image: "/variation-images/chrome.png",
    rarity: "common" as const,
  },
  {
    id: "bumblebee",
    name: "Bumblebee Essence",
    amount: 890,
    currentValue: 120,
    maxAmount: 1500,
    image: "/variation-images/bumblebee.png",
    rarity: "uncommon" as const,
  },
  {
    id: "paul",
    name: "Paul Essence",
    amount: 675,
    currentValue: 280,
    maxAmount: 1000,
    image: "/variation-images/paul.png",
    rarity: "rare" as const,
  },
  {
    id: "acid",
    name: "Acid Essence",
    amount: 450,
    currentValue: 550,
    maxAmount: 800,
    icon: "🧪",
    rarity: "epic" as const,
  },
  {
    id: "nova",
    name: "Nova Essence",
    amount: 325,
    currentValue: 750,
    maxAmount: 500,
    icon: "✨",
    rarity: "epic" as const,
  },
  {
    id: "void",
    name: "Void Essence",
    amount: 210,
    currentValue: 1200,
    maxAmount: 300,
    icon: "🌀",
    rarity: "legendary" as const,
  },
  {
    id: "plasma",
    name: "Plasma Essence",
    amount: 180,
    currentValue: 900,
    maxAmount: 250,
    icon: "⚡",
    rarity: "epic" as const,
  },
  {
    id: "quantum",
    name: "Quantum Essence",
    amount: 95,
    currentValue: 2500,
    maxAmount: 100,
    icon: "🔮",
    rarity: "legendary" as const,
  },
];

export default function EssenceChartDemo() {
  const [chartSize, setChartSize] = useState(400);
  const [innerRadiusRatio, setInnerRadiusRatio] = useState(0.6);
  const [showCenterStats, setShowCenterStats] = useState(true);
  const [animationDuration, setAnimationDuration] = useState(1000);
  const [dataSubset, setDataSubset] = useState(8);

  const currentData = sampleEssenceData.slice(0, dataSubset);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      <div 
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 35px,
              rgba(250, 182, 23, 0.1) 35px,
              rgba(250, 182, 23, 0.1) 70px
            )
          `
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mek-card-industrial mek-border-sharp-gold mb-8 p-6">
          <h1 className="mek-text-industrial text-3xl text-yellow-400 mb-2">
            ESSENCE DISTRIBUTION SYSTEM
          </h1>
          <p className="text-gray-400">
            Industrial sci-fi donut chart visualization for resource management
          </p>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Chart display */}
          <div className="flex justify-center items-start">
            <EssenceDonutChart
              data={currentData}
              size={chartSize}
              innerRadiusRatio={innerRadiusRatio}
              showCenterStats={showCenterStats}
              animationDuration={animationDuration}
            />
          </div>

          {/* Controls panel */}
          <div className="space-y-6">
            {/* Configuration controls */}
            <div className="mek-card-industrial mek-border-sharp-gold p-6">
              <h2 className="mek-text-industrial text-xl text-yellow-400 mb-4">
                CHART CONFIGURATION
              </h2>
              
              <div className="space-y-4">
                {/* Chart size */}
                <div>
                  <label className="mek-label-uppercase block mb-2">
                    Chart Size: {chartSize}px
                  </label>
                  <input
                    type="range"
                    min="200"
                    max="600"
                    value={chartSize}
                    onChange={(e) => setChartSize(Number(e.target.value))}
                    className="w-full accent-yellow-400"
                  />
                </div>

                {/* Inner radius */}
                <div>
                  <label className="mek-label-uppercase block mb-2">
                    Inner Radius: {(innerRadiusRatio * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="0.8"
                    step="0.05"
                    value={innerRadiusRatio}
                    onChange={(e) => setInnerRadiusRatio(Number(e.target.value))}
                    className="w-full accent-yellow-400"
                  />
                </div>

                {/* Animation duration */}
                <div>
                  <label className="mek-label-uppercase block mb-2">
                    Animation: {animationDuration}ms
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="100"
                    value={animationDuration}
                    onChange={(e) => setAnimationDuration(Number(e.target.value))}
                    className="w-full accent-yellow-400"
                  />
                </div>

                {/* Data points */}
                <div>
                  <label className="mek-label-uppercase block mb-2">
                    Data Points: {dataSubset}
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="8"
                    value={dataSubset}
                    onChange={(e) => setDataSubset(Number(e.target.value))}
                    className="w-full accent-yellow-400"
                  />
                </div>

                {/* Toggle center stats */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCenterStats}
                      onChange={(e) => setShowCenterStats(e.target.checked)}
                      className="w-5 h-5 accent-yellow-400"
                    />
                    <span className="mek-label-uppercase">Show Center Stats</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Data display */}
            <div className="mek-card-industrial mek-border-sharp-gold p-6">
              <h2 className="mek-text-industrial text-xl text-yellow-400 mb-4">
                ESSENCE INVENTORY
              </h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {currentData.map((essence) => (
                  <div 
                    key={essence.id}
                    className="flex items-center gap-3 p-3 bg-black/40 rounded border border-gray-800 hover:border-yellow-500/30 transition-all"
                  >
                    {/* Icon/Image */}
                    {essence.icon ? (
                      <div className="w-10 h-10 rounded bg-yellow-400/10 flex items-center justify-center text-xl">
                        {essence.icon}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-gradient-to-br from-yellow-900/20 to-black/60" />
                    )}
                    
                    {/* Info */}
                    <div className="flex-1">
                      <div className="font-medium text-gray-300">{essence.name}</div>
                      <div className="text-xs text-gray-500 uppercase">
                        {essence.rarity || 'common'}
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="text-right">
                      <div className="mek-value-primary text-sm">{essence.amount}</div>
                      <div className="text-xs text-green-400">{essence.currentValue}G</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="mek-card-industrial mek-border-sharp-gray p-4">
            <h3 className="mek-text-industrial text-sm text-yellow-400 mb-2">INTERACTIVE</h3>
            <p className="text-xs text-gray-400">
              Hover over slices to see detailed tooltips with essence stats, values, and progress bars
            </p>
          </div>
          
          <div className="mek-card-industrial mek-border-sharp-gray p-4">
            <h3 className="mek-text-industrial text-sm text-yellow-400 mb-2">ANIMATED</h3>
            <p className="text-xs text-gray-400">
              Smooth entrance animations with configurable duration and easing functions
            </p>
          </div>
          
          <div className="mek-card-industrial mek-border-sharp-gray p-4">
            <h3 className="mek-text-industrial text-sm text-yellow-400 mb-2">INDUSTRIAL</h3>
            <p className="text-xs text-gray-400">
              Styled with hazard stripes, metal textures, and yellow/black theme matching the design system
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}