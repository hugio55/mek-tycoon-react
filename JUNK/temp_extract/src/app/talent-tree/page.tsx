'use client';

// import TalentTree from '@/components/TalentTree';

export default function TalentTreePage() {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-yellow-400">
          Mek Talent Tree
        </h1>
        
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/20">
          {/* <TalentTree /> */}
          <p className="text-center text-gray-400">Talent Tree component coming soon...</p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-600/30">
            <h3 className="text-purple-400 font-bold mb-2">Gold Path</h3>
            <p className="text-sm text-gray-400">
              Focus on wealth generation, trading bonuses, and economic advantages.
            </p>
          </div>
          
          <div className="bg-gray-900/20 p-4 rounded-lg border border-gray-600/30">
            <h3 className="text-gray-300 font-bold mb-2">Essence Path</h3>
            <p className="text-sm text-gray-400">
              Enhance core mechanics, essence generation, and capacity upgrades.
            </p>
          </div>
          
          <div className="bg-red-900/20 p-4 rounded-lg border border-red-600/30">
            <h3 className="text-red-400 font-bold mb-2">Looter Path</h3>
            <p className="text-sm text-gray-400">
              Improve drop rates, item rarity, and combat rewards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}