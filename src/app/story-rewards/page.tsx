"use client";

import { useState, useMemo, useEffect } from "react";
import allMeksData from "@/../../convex/allMeksData.json";
import { variationsData } from "@/lib/variationsData";

interface MekData {
  assetId: string;
  assetName: string;
  owner: string;
  iconUrl: string;
  verified: boolean;
  headGroup: string;
  headVariation: string;
  bodyGroup: string;
  bodyVariation: string;
  itemGroup: string;
  itemVariation: string;
  rarityRank: number;
  rarityTier: string;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  energy: number;
  maxEnergy: number;
  powerScore: number;
  scrapValue: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  inBattle: boolean;
  isStaked: boolean;
  lastUpdated: number;
}

// Ordered by chapter: Chapter 1 = Rank 10, Chapter 10 = Rank 1 (Wren)
const finalBosses = [
  // Chapter 1 - Rank 10 (Note: All top 10 are actually tied at Rank 1, but we'll use them in this order)
  { rank: 10, chapter: 1, assetId: "13", name: "Mekanism #0013", head: "Ellie Mesh", body: "Chrome Ultimate", item: "Vanished" },
  // Chapter 2 - Rank 9
  { rank: 9, chapter: 2, assetId: "3029", name: "Mekanism #3029", head: "Nyan Ultimate", body: "Heatwave Ultimate", item: "Peacock Ultimate" },
  // Chapter 3 - Rank 8  
  { rank: 8, chapter: 3, assetId: "2895", name: "Mekanism #2895", head: "Paul Ultimate", body: "Burnt Ultimate", item: "Null" },
  // Chapter 4 - Rank 7
  { rank: 7, chapter: 4, assetId: "3425", name: "Mekanism #3425", head: "Obliterator", body: "Luxury Ultimate", item: "Golden Guns Ultimate" },
  // Chapter 5 - Rank 6
  { rank: 6, chapter: 5, assetId: "118", name: "Mekanism #0118", head: "Ace of Spades Ultimate", body: "Plush Ultimate", item: "Linkinator 3000" },
  // Chapter 6 - Rank 5
  { rank: 5, chapter: 6, assetId: "923", name: "Mekanism #0923", head: "Frost King", body: "Frost Cage", item: "Nil" },
  // Chapter 7 - Rank 4
  { rank: 4, chapter: 7, assetId: "1582", name: "Mekanism #1582", head: "Pie", body: "Carving Ultimate", item: "Oompah" },
  // Chapter 8 - Rank 3
  { rank: 3, chapter: 8, assetId: "2422", name: "Mekanism #2422", head: "Discomania", body: "X Ray Ultimate", item: "None" },
  // Chapter 9 - Rank 2
  { rank: 2, chapter: 9, assetId: "1288", name: "Mekanism #1288", head: "Projectionist", body: "Cousin Itt", item: "Gone" },
  // Chapter 10 - Rank 1 (The Wren - Source Key 999-999-999)
  { rank: 1, chapter: 10, assetId: "3412", name: "Mekanism #3412 (The Wren)", head: "Derelict", body: "Gatsby Ultimate", item: "Stolen" },
];

export default function StoryRewardsPage() {
  const [minGold, setMinGold] = useState(50); // For rank 4000
  const [maxGold, setMaxGold] = useState(10000); // For rank 11
  const [xpMultiplier, setXpMultiplier] = useState(0.5); // XP as percentage of gold
  const [selectedRank, setSelectedRank] = useState<number>(1000);
  const [bossRewards, setBossRewards] = useState<{[key: string]: {gold: number, xp: number, specialItems: string, buffs: string, achievements: string}}>({});
  
  // Create a map of rank to mek for quick lookup
  const meksByRank = useMemo(() => {
    const rankMap = new Map<number, MekData>();
    (allMeksData as MekData[]).forEach(mek => {
      rankMap.set(mek.rarityRank, mek);
    });
    return rankMap;
  }, []);

  // Get selected mek
  const selectedMek = useMemo(() => {
    return meksByRank.get(selectedRank);
  }, [selectedRank, meksByRank]);

  // Calculate rewards based on rank
  const calculateRewards = useMemo(() => {
    if (selectedRank < 1 || selectedRank > 4000) {
      return { gold: 0, xp: 0, type: "Invalid" };
    }

    // Special cases
    if (selectedRank <= 10) {
      // Final bosses (ranks 1-10) - not included in normal rewards
      return { 
        gold: Math.round(maxGold * 5), // 5x the max for final bosses
        xp: Math.round(maxGold * 5 * xpMultiplier),
        type: "Final Boss"
      };
    }

    if (selectedRank <= 110) {
      // Mini-bosses (ranks 11-110) - enhanced rewards
      const miniBossMultiplier = 1 + ((110 - selectedRank) / 99) * 2; // 1x to 3x multiplier
      const baseGold = interpolateGold(selectedRank);
      return {
        gold: Math.round(baseGold * miniBossMultiplier),
        xp: Math.round(baseGold * miniBossMultiplier * xpMultiplier),
        type: "Mini-Boss"
      };
    }

    // Normal meks (ranks 111-4000)
    const gold = Math.round(interpolateGold(selectedRank));
    return {
      gold,
      xp: Math.round(gold * xpMultiplier),
      type: "Normal"
    };
  }, [selectedRank, minGold, maxGold, xpMultiplier]);

  // Interpolate gold rewards (more linear with slight curve)
  function interpolateGold(rank: number): number {
    // Use a more linear interpolation with slight curve
    // Ranks 11-4000 map to maxGold-minGold
    const normalizedRank = (4000 - rank) / (4000 - 11); // 0 to 1 (0 at rank 4000, 1 at rank 11)
    const linearFactor = Math.pow(normalizedRank, 1.3); // Slight curve (1.3 instead of 2)
    return minGold + (maxGold - minGold) * linearFactor;
  }

  // Calculate essence drop details based on variation rarity
  const essenceDrops = useMemo(() => {
    if (!selectedMek) return null;

    // Get copy counts for each variation
    const headVar = variationsData.heads.find(h => h.name === selectedMek.headVariation);
    const bodyVar = variationsData.bodies.find(b => b.name === selectedMek.bodyVariation);
    const traitVar = variationsData.traits.find(t => t.name === selectedMek.itemVariation);

    const headCopies = headVar?.copies || 50;
    const bodyCopies = bodyVar?.copies || 50;
    const traitCopies = (selectedMek.itemGroup !== "None" && selectedMek.itemGroup !== "Gone" && traitVar) ? traitVar.copies : 0;

    // Calculate total copies to determine percentages
    const totalCopies = headCopies + bodyCopies + traitCopies;

    // If no trait, redistribute between head and body
    if (traitCopies === 0) {
      const headBodyTotal = headCopies + bodyCopies;
      return {
        head: {
          group: selectedMek.headGroup,
          variation: selectedMek.headVariation,
          copies: headCopies,
          chance: (headCopies / headBodyTotal) * 100
        },
        body: {
          group: selectedMek.bodyGroup,
          variation: selectedMek.bodyVariation,
          copies: bodyCopies,
          chance: (bodyCopies / headBodyTotal) * 100
        },
        item: {
          group: selectedMek.itemGroup,
          variation: selectedMek.itemVariation,
          copies: 0,
          chance: 0
        }
      };
    }

    // All three variations present
    return {
      head: {
        group: selectedMek.headGroup,
        variation: selectedMek.headVariation,
        copies: headCopies,
        chance: (headCopies / totalCopies) * 100
      },
      body: {
        group: selectedMek.bodyGroup,
        variation: selectedMek.bodyVariation,
        copies: bodyCopies,
        chance: (bodyCopies / totalCopies) * 100
      },
      item: {
        group: selectedMek.itemGroup,
        variation: selectedMek.itemVariation,
        copies: traitCopies,
        chance: (traitCopies / totalCopies) * 100
      }
    };
  }, [selectedMek]);

  // Stats for overview
  const stats = useMemo(() => {
    const totalMeks = meksByRank.size;
    const finalBosses = Array.from(meksByRank.keys()).filter(r => r >= 1 && r <= 10).length;
    const miniBosses = Array.from(meksByRank.keys()).filter(r => r >= 11 && r <= 110).length;
    const normalMeks = totalMeks - finalBosses - miniBosses;

    return {
      total: totalMeks,
      finalBosses,
      miniBosses,
      normalMeks
    };
  }, [meksByRank]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 font-orbitron">
          Story Mode Rewards System
        </h1>

        {/* Stats Overview */}
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-yellow-400/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">{stats.total}</div>
              <div className="text-sm text-gray-400">Total Meks</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">{stats.finalBosses}</div>
              <div className="text-sm text-gray-400">Final Bosses (1-10)</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.miniBosses}</div>
              <div className="text-sm text-gray-400">Mini-Bosses (11-110)</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-500/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-300">{stats.normalMeks}</div>
              <div className="text-sm text-gray-400">Normal Meks (111-4000)</div>
            </div>
          </div>
          
          {/* Rarity Tier Cutoffs */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-2">Rarity Tier Cutoffs:</h3>
            <div className="flex gap-4 text-xs">
              <span><span className="text-red-400 font-bold">God Tier:</span> 1-10</span>
              <span><span className="text-purple-400">Legendary:</span> 11-100</span>
              <span><span className="text-blue-400">Epic:</span> 101-250</span>
              <span><span className="text-green-400">Rare:</span> 251-1000</span>
              <span><span className="text-yellow-400">Uncommon:</span> 1001-2000</span>
              <span><span className="text-gray-400">Common:</span> 2001-4000</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="bg-gray-900/50 backdrop-blur-sm border-2 border-yellow-400/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Reward Configuration</h2>
            
            {/* Gold Range */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Gold Reward Range</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Min Gold (Rank 4000)</label>
                  <input
                    type="number"
                    value={minGold}
                    onChange={(e) => setMinGold(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-black/50 border border-yellow-400/30 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Gold (Rank 11)</label>
                  <input
                    type="number"
                    value={maxGold}
                    onChange={(e) => setMaxGold(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-black/50 border border-yellow-400/30 rounded text-white"
                  />
                </div>
              </div>
            </div>

            {/* XP Multiplier */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Experience Settings</h3>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  XP as % of Gold ({(xpMultiplier * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={xpMultiplier * 100}
                  onChange={(e) => setXpMultiplier(parseInt(e.target.value) / 100)}
                  className="w-full"
                />
              </div>
            </div>


            {/* Rank Selector */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Test Mek Rank</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="4000"
                  value={selectedRank}
                  onChange={(e) => setSelectedRank(parseInt(e.target.value) || 1)}
                  className="flex-1 px-3 py-2 bg-black/50 border border-yellow-400/30 rounded text-white"
                  placeholder="Enter rank (1-4000)"
                />
                <button
                  onClick={() => setSelectedRank(Math.floor(Math.random() * 4000) + 1)}
                  className="px-4 py-2 bg-yellow-400/20 border border-yellow-400/50 rounded text-yellow-400 hover:bg-yellow-400/30 transition-colors"
                >
                  Random
                </button>
              </div>
            </div>
          </div>

          {/* Mek Details Panel */}
          <div className="bg-gray-900/50 backdrop-blur-sm border-2 border-yellow-400/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">
              Mek #{selectedRank} Details
            </h2>
            
            {selectedMek ? (
              <div>
                {/* Mek Info */}
                <div className="mb-6">
                  <div className="flex items-start gap-4">
                    <img 
                      src={selectedMek.iconUrl} 
                      alt={selectedMek.assetName}
                      className="w-24 h-24 rounded-lg border-2 border-yellow-400/50"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{selectedMek.assetName}</h3>
                      <div className="text-sm text-gray-400 mt-1">
                        <div>Head: {selectedMek.headVariation} ({selectedMek.headGroup})</div>
                        <div>Body: {selectedMek.bodyVariation} ({selectedMek.bodyGroup})</div>
                        <div>Item: {selectedMek.itemVariation} ({selectedMek.itemGroup})</div>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          calculateRewards.type === "Final Boss" ? "bg-purple-600" :
                          calculateRewards.type === "Mini-Boss" ? "bg-blue-600" :
                          "bg-gray-600"
                        }`}>
                          {calculateRewards.type}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                          Tier: {selectedMek.rarityTier}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-gray-400">No mek found at rank #{selectedRank}</div>
            )}
          </div>
        </div>

        {/* Rewards Display */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gold & XP Rewards */}
          <div className="bg-gray-900/50 backdrop-blur-sm border-2 border-yellow-400/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Mission Rewards</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Gold Reward:</span>
                <span className="text-3xl font-bold text-yellow-400">
                  {calculateRewards.gold.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">XP Reward:</span>
                <span className="text-3xl font-bold text-blue-400">
                  {calculateRewards.xp.toLocaleString()}
                </span>
              </div>
              {calculateRewards.type !== "Normal" && (
                <div className="pt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-400">
                    {calculateRewards.type === "Final Boss" 
                      ? "Final Boss: 5x maximum gold reward"
                      : "Mini-Boss: Enhanced rewards with multiplier"}
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Essence Drops */}
          {essenceDrops && selectedMek && (
            <div className="bg-gray-900/50 backdrop-blur-sm border-2 border-yellow-400/30 rounded-xl p-6 lg:col-span-2">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Essence Drop Chances</h3>
              
              {/* Visual representation using circles */}
              <div className="flex justify-center gap-4 mb-6">
                {/* Head Essence Circle */}
                <div className="text-center">
                  <div className="relative w-20 h-20 mb-2">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-700"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - essenceDrops.head.chance / 100)}`}
                        className="text-purple-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {essenceDrops.head.chance.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">Head</div>
                  <div className="text-xs font-semibold text-gray-300">{essenceDrops.head.variation}</div>
                  <div className="text-xs text-gray-500">
                    {essenceDrops.head.copies} copies
                  </div>
                </div>

                {/* Body Essence Circle */}
                <div className="text-center">
                  <div className="relative w-20 h-20 mb-2">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-700"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - essenceDrops.body.chance / 100)}`}
                        className="text-blue-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {essenceDrops.body.chance.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">Body</div>
                  <div className="text-xs font-semibold text-gray-300">{essenceDrops.body.variation}</div>
                  <div className="text-xs text-gray-500">
                    {essenceDrops.body.copies} copies
                  </div>
                </div>

                {/* Item Essence Circle */}
                {essenceDrops.item.chance > 0 && (
                  <div className="text-center">
                    <div className="relative w-20 h-20 mb-2">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-gray-700"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 36}`}
                          strokeDashoffset={`${2 * Math.PI * 36 * (1 - essenceDrops.item.chance / 100)}`}
                          className="text-green-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {essenceDrops.item.chance.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">Item</div>
                    <div className="text-xs font-semibold text-gray-300">{essenceDrops.item.variation}</div>
                    <div className="text-xs text-gray-500">
                      {essenceDrops.item.copies} copies
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-black/30 rounded">
                <p className="text-xs text-gray-400">
                  <strong>Note:</strong> Drops always total 100%. You always get essence.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Final Boss Rewards Configuration */}
        <div className="mt-8 bg-gray-900/50 backdrop-blur-sm border-2 border-red-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-red-400 mb-4">God Tier Boss Rewards (Top 10 Meks)</h3>
          <div className="text-xs text-gray-400 mb-4">Chapter progression: Ch1 = Rank 10 → Ch10 = Rank 1 (The Wren - Source Key 999-999-999)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finalBosses.map((boss, index) => (
              <div key={boss.assetId} className="bg-black/30 rounded-lg p-4 border border-red-500/20">
                <div className="mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold text-red-300">Chapter {boss.chapter} Boss</div>
                      <div className="text-xs text-gray-400">{boss.name}</div>
                    </div>
                    <div className="text-xs text-red-400 font-bold">Rank #{boss.rank}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <div>Head: {boss.head}</div>
                    <div>Body: {boss.body}</div>
                    <div>Item: {boss.item}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-gray-400">Gold</label>
                    <input
                      type="number"
                      value={bossRewards[boss.assetId]?.gold || Math.round(maxGold * (6 - boss.chapter * 0.1))}
                      onChange={(e) => setBossRewards({
                        ...bossRewards,
                        [boss.assetId]: {
                          ...bossRewards[boss.assetId],
                          gold: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full px-2 py-1 bg-black/50 border border-red-500/30 rounded text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">XP</label>
                    <input
                      type="number"
                      value={bossRewards[boss.assetId]?.xp || Math.round(maxGold * (6 - boss.chapter * 0.1) * xpMultiplier)}
                      onChange={(e) => setBossRewards({
                        ...bossRewards,
                        [boss.assetId]: {
                          ...bossRewards[boss.assetId],
                          xp: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full px-2 py-1 bg-black/50 border border-red-500/30 rounded text-xs text-white"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div>
                    <label className="text-xs text-gray-400">Special Items</label>
                    <input
                      type="text"
                      value={bossRewards[boss.assetId]?.specialItems || ""}
                      onChange={(e) => setBossRewards({
                        ...bossRewards,
                        [boss.assetId]: {
                          ...bossRewards[boss.assetId],
                          specialItems: e.target.value
                        }
                      })}
                      placeholder="e.g., Ultimate Key, Boss Token..."
                      className="w-full px-2 py-1 bg-black/50 border border-red-500/30 rounded text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Buffs/Effects</label>
                    <input
                      type="text"
                      value={bossRewards[boss.assetId]?.buffs || ""}
                      onChange={(e) => setBossRewards({
                        ...bossRewards,
                        [boss.assetId]: {
                          ...bossRewards[boss.assetId],
                          buffs: e.target.value
                        }
                      })}
                      placeholder="e.g., +50% XP for 1hr..."
                      className="w-full px-2 py-1 bg-black/50 border border-red-500/30 rounded text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Achievements</label>
                    <input
                      type="text"
                      value={bossRewards[boss.assetId]?.achievements || ""}
                      onChange={(e) => setBossRewards({
                        ...bossRewards,
                        [boss.assetId]: {
                          ...bossRewards[boss.assetId],
                          achievements: e.target.value
                        }
                      })}
                      placeholder="e.g., Chapter Master..."
                      className="w-full px-2 py-1 bg-black/50 border border-red-500/30 rounded text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reward Curve Visualization */}
        <div className="mt-8 bg-gray-900/50 backdrop-blur-sm border-2 border-yellow-400/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">Gold Reward Distribution</h3>
          <div className="grid grid-cols-5 gap-4 text-sm">
            {[4000, 3000, 2000, 1000, 500, 110, 50, 11].map(rank => {
              const rewards = calculateRewardsForRank(rank);
              return (
                <div key={rank} className="text-center">
                  <div className="text-gray-400 mb-1">Rank #{rank}</div>
                  <div className="text-yellow-400 font-bold">
                    {rewards.gold.toLocaleString()} gold
                  </div>
                  <div className="text-blue-400 text-xs">
                    {rewards.xp.toLocaleString()} xp
                  </div>
                  <div className={`text-xs mt-1 ${
                    rewards.type === "Final Boss" ? "text-purple-400" :
                    rewards.type === "Mini-Boss" ? "text-blue-400" :
                    "text-gray-500"
                  }`}>
                    {rewards.type}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  function calculateRewardsForRank(rank: number) {
    if (rank < 1 || rank > 4000) {
      return { gold: 0, xp: 0, type: "Invalid" };
    }

    if (rank <= 10) {
      return { 
        gold: Math.round(maxGold * 5),
        xp: Math.round(maxGold * 5 * xpMultiplier),
        type: "Final Boss"
      };
    }

    if (rank <= 110) {
      const miniBossMultiplier = 1 + ((110 - rank) / 99) * 2;
      const baseGold = interpolateGold(rank);
      return {
        gold: Math.round(baseGold * miniBossMultiplier),
        xp: Math.round(baseGold * miniBossMultiplier * xpMultiplier),
        type: "Mini-Boss"
      };
    }

    const gold = Math.round(interpolateGold(rank));
    return {
      gold,
      xp: Math.round(gold * xpMultiplier),
      type: "Normal"
    };
  }
}