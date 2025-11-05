'use client';

export default function MekLayoutsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Title */}
        <h1 className="text-3xl font-bold mb-8 text-center">Mek Detail Page - Wireframe</h1>

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
    </div>
  );
}
