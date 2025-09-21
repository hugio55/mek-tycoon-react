'use client';

import React, { useState } from 'react';

interface FinalBossReward {
  chapterBoss: number;
  name: string;
  goldBase: number;
  xpBase: number;
  guaranteedReward?: string;
  specialDrop?: {
    item: string;
    chance: number;
  };
}

interface MiniBossSpecialReward {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity: number; // How many mini-bosses will get this
}

export default function MiniBossFinalBossRewards() {
  // Final Boss individual rewards (10 bosses)
  const [finalBossRewards, setFinalBossRewards] = useState<FinalBossReward[]>([
    { chapterBoss: 10, name: "Mek-1: The Origin", goldBase: 50000, xpBase: 100000, guaranteedReward: "Origin Core" },
    { chapterBoss: 9, name: "Mek-2: Storm Bringer", goldBase: 40000, xpBase: 80000, guaranteedReward: "Storm Essence x10" },
    { chapterBoss: 8, name: "Mek-3: Crystal Guardian", goldBase: 32000, xpBase: 64000, guaranteedReward: "Crystal Matrix" },
    { chapterBoss: 7, name: "Mek-4: Shadow Weaver", goldBase: 25000, xpBase: 50000, specialDrop: { item: "Shadow Cloak", chance: 50 } },
    { chapterBoss: 6, name: "Mek-5: Flame Titan", goldBase: 20000, xpBase: 40000, specialDrop: { item: "Flame Core", chance: 40 } },
    { chapterBoss: 5, name: "Mek-6: Ice Sovereign", goldBase: 16000, xpBase: 32000, specialDrop: { item: "Frost Shard", chance: 35 } },
    { chapterBoss: 4, name: "Mek-7: Thunder Lord", goldBase: 12000, xpBase: 24000, specialDrop: { item: "Thunder Gem", chance: 30 } },
    { chapterBoss: 3, name: "Mek-8: Wind Dancer", goldBase: 9000, xpBase: 18000, specialDrop: { item: "Wind Feather", chance: 25 } },
    { chapterBoss: 2, name: "Mek-9: Earth Shaker", goldBase: 6000, xpBase: 12000, specialDrop: { item: "Earth Stone", chance: 20 } },
    { chapterBoss: 1, name: "Mek-10: Steel Sentinel", goldBase: 4000, xpBase: 8000, specialDrop: { item: "Steel Plate", chance: 15 } },
  ]);

  // Mini-boss special rewards pool
  const [miniBossSpecialRewards, setMiniBossSpecialRewards] = useState<MiniBossSpecialReward[]>([
    { id: '1', name: "Bonus Gold Cache", description: "+500-2000 gold", rarity: 'common', quantity: 30 },
    { id: '2', name: "XP Boost", description: "+50% XP", rarity: 'common', quantity: 25 },
    { id: '3', name: "Random Chip Pack", description: "1-3 random chips", rarity: 'uncommon', quantity: 20 },
    { id: '4', name: "Essence Bundle", description: "5-10 random essences", rarity: 'uncommon', quantity: 15 },
    { id: '5', name: "Rare Material", description: "Crafting material", rarity: 'rare', quantity: 8 },
    { id: '6', name: "Epic Chip", description: "Guaranteed A-rank chip", rarity: 'epic', quantity: 5 },
    { id: '7', name: "Legendary Fragment", description: "Boss artifact piece", rarity: 'legendary', quantity: 2 },
  ]);

  const [distributionMethod, setDistributionMethod] = useState<'random' | 'tiered' | 'progressive'>('tiered');
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardDescription, setNewRewardDescription] = useState('');
  const [newRewardRarity, setNewRewardRarity] = useState<MiniBossSpecialReward['rarity']>('common');
  const [newRewardQuantity, setNewRewardQuantity] = useState(5);

  const totalMiniBosses = 90; // 9 per chapter × 10 chapters
  const totalAllocated = miniBossSpecialRewards.reduce((sum, reward) => sum + reward.quantity, 0);
  const remainingMiniBosses = totalMiniBosses - totalAllocated;

  const rarityColors = {
    common: 'text-gray-400 border-gray-600',
    uncommon: 'text-green-400 border-green-600',
    rare: 'text-blue-400 border-blue-600',
    epic: 'text-purple-400 border-purple-600',
    legendary: 'text-yellow-400 border-yellow-600',
  };

  const addSpecialReward = () => {
    if (newRewardName && newRewardDescription && newRewardQuantity > 0) {
      const newReward: MiniBossSpecialReward = {
        id: Date.now().toString(),
        name: newRewardName,
        description: newRewardDescription,
        rarity: newRewardRarity,
        quantity: Math.min(newRewardQuantity, remainingMiniBosses),
      };
      setMiniBossSpecialRewards([...miniBossSpecialRewards, newReward]);
      setNewRewardName('');
      setNewRewardDescription('');
      setNewRewardQuantity(5);
    }
  };

  const removeSpecialReward = (id: string) => {
    setMiniBossSpecialRewards(miniBossSpecialRewards.filter(r => r.id !== id));
  };

  const distributeRewards = () => {
    // This would trigger the actual distribution logic
    console.log(`Distributing ${totalAllocated} special rewards across ${totalMiniBosses} mini-bosses using ${distributionMethod} method`);
    alert(`Rewards distributed! ${totalAllocated} special rewards assigned to mini-bosses using ${distributionMethod} distribution.`);
  };

  return (
    <div className="space-y-6">
      {/* Final Bosses Individual Configuration */}
      <div className="bg-black/30 rounded-lg p-4">
        <h5 className="text-yellow-500 text-sm font-bold mb-3">Final Boss Rewards (10 Chapter Bosses)</h5>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {finalBossRewards.map((boss, index) => (
            <div key={boss.chapterBoss} className="bg-black/40 rounded p-3 border border-yellow-600/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-bold text-xs">Chapter {10 - index}</span>
                  <input
                    type="text"
                    value={boss.name}
                    onChange={(e) => {
                      const updated = [...finalBossRewards];
                      updated[index].name = e.target.value;
                      setFinalBossRewards(updated);
                    }}
                    className="px-2 py-1 bg-black/50 border border-yellow-600/30 rounded text-xs text-gray-300 w-40"
                    placeholder="Boss Name"
                  />
                </div>
                <span className="text-red-500 text-xs font-bold">Rank #{boss.chapterBoss}</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="text-gray-500">Gold</label>
                  <input
                    type="number"
                    value={boss.goldBase}
                    onChange={(e) => {
                      const updated = [...finalBossRewards];
                      updated[index].goldBase = parseInt(e.target.value) || 0;
                      setFinalBossRewards(updated);
                    }}
                    className="w-full px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-yellow-400"
                  />
                </div>
                <div>
                  <label className="text-gray-500">XP</label>
                  <input
                    type="number"
                    value={boss.xpBase}
                    onChange={(e) => {
                      const updated = [...finalBossRewards];
                      updated[index].xpBase = parseInt(e.target.value) || 0;
                      setFinalBossRewards(updated);
                    }}
                    className="w-full px-2 py-1 bg-black/50 border border-blue-400/30 rounded text-blue-400"
                  />
                </div>
                <div>
                  <label className="text-gray-500">Guaranteed</label>
                  <input
                    type="text"
                    value={boss.guaranteedReward || ''}
                    onChange={(e) => {
                      const updated = [...finalBossRewards];
                      updated[index].guaranteedReward = e.target.value;
                      setFinalBossRewards(updated);
                    }}
                    className="w-full px-2 py-1 bg-black/50 border border-green-400/30 rounded text-green-400 text-[10px]"
                    placeholder="Item name"
                  />
                </div>
                <div>
                  <label className="text-gray-500">Special ({boss.specialDrop?.chance || 0}%)</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={boss.specialDrop?.item || ''}
                      onChange={(e) => {
                        const updated = [...finalBossRewards];
                        if (!updated[index].specialDrop) {
                          updated[index].specialDrop = { item: '', chance: 25 };
                        }
                        updated[index].specialDrop!.item = e.target.value;
                        setFinalBossRewards(updated);
                      }}
                      className="flex-1 px-1 py-1 bg-black/50 border border-purple-400/30 rounded text-purple-400 text-[10px]"
                      placeholder="Item"
                    />
                    <input
                      type="number"
                      value={boss.specialDrop?.chance || 0}
                      onChange={(e) => {
                        const updated = [...finalBossRewards];
                        if (!updated[index].specialDrop) {
                          updated[index].specialDrop = { item: '', chance: 25 };
                        }
                        updated[index].specialDrop!.chance = parseInt(e.target.value) || 0;
                        setFinalBossRewards(updated);
                      }}
                      className="w-10 px-1 py-1 bg-black/50 border border-purple-400/30 rounded text-purple-400 text-[10px]"
                      placeholder="%"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini-Boss Special Rewards Pool */}
      <div className="bg-black/30 rounded-lg p-4">
        <h5 className="text-orange-400 text-sm font-bold mb-3">Mini-Boss Special Rewards System</h5>

        {/* Distribution Stats */}
        <div className="bg-black/40 rounded p-2 mb-3 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Total Mini-Bosses: <span className="text-orange-400 font-bold">{totalMiniBosses}</span></span>
            <span>Allocated: <span className="text-green-400 font-bold">{totalAllocated}</span></span>
            <span>Remaining: <span className={remainingMiniBosses > 0 ? "text-yellow-400" : "text-red-400"} style={{ fontWeight: 'bold' }}>
              {remainingMiniBosses}
            </span></span>
          </div>
          {remainingMiniBosses < 0 && (
            <div className="text-red-400 mt-1">⚠️ Over-allocated by {Math.abs(remainingMiniBosses)} bosses!</div>
          )}
        </div>

        {/* Distribution Method */}
        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Distribution Method</label>
          <select
            value={distributionMethod}
            onChange={(e) => setDistributionMethod(e.target.value as any)}
            className="w-full px-2 py-1 bg-black/50 border border-orange-500/30 rounded text-sm text-gray-300"
          >
            <option value="random">Random - Scattered across all chapters</option>
            <option value="tiered">Tiered - Rarer rewards in later chapters</option>
            <option value="progressive">Progressive - Increasing with difficulty</option>
          </select>
        </div>

        {/* Current Rewards Pool */}
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {miniBossSpecialRewards.map((reward) => (
            <div key={reward.id} className={`flex items-center justify-between bg-black/40 rounded p-2 border ${rarityColors[reward.rarity].split(' ')[1]}`}>
              <div className="flex-1">
                <span className={`text-xs font-semibold ${rarityColors[reward.rarity].split(' ')[0]}`}>
                  {reward.name}
                </span>
                <span className="text-[10px] text-gray-400 ml-2">{reward.description}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={reward.quantity}
                  onChange={(e) => {
                    const updated = miniBossSpecialRewards.map(r =>
                      r.id === reward.id ? { ...r, quantity: parseInt(e.target.value) || 0 } : r
                    );
                    setMiniBossSpecialRewards(updated);
                  }}
                  className="w-12 px-1 py-0.5 bg-black/50 border border-gray-600 rounded text-xs text-center"
                  min="0"
                  max={totalMiniBosses}
                />
                <button
                  onClick={() => removeSpecialReward(reward.id)}
                  className="text-red-400 hover:text-red-300 text-xs px-2 py-1"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Reward */}
        <div className="bg-black/40 rounded p-2 space-y-2">
          <div className="text-xs text-gray-400 font-semibold">Add Special Reward</div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={newRewardName}
              onChange={(e) => setNewRewardName(e.target.value)}
              placeholder="Reward name"
              className="px-2 py-1 bg-black/50 border border-gray-600 rounded text-xs text-gray-300"
            />
            <input
              type="text"
              value={newRewardDescription}
              onChange={(e) => setNewRewardDescription(e.target.value)}
              placeholder="Description"
              className="px-2 py-1 bg-black/50 border border-gray-600 rounded text-xs text-gray-300"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={newRewardRarity}
              onChange={(e) => setNewRewardRarity(e.target.value as any)}
              className="flex-1 px-2 py-1 bg-black/50 border border-gray-600 rounded text-xs text-gray-300"
            >
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>
            <input
              type="number"
              value={newRewardQuantity}
              onChange={(e) => setNewRewardQuantity(parseInt(e.target.value) || 0)}
              placeholder="Qty"
              className="w-16 px-2 py-1 bg-black/50 border border-gray-600 rounded text-xs text-gray-300"
              min="1"
              max={remainingMiniBosses}
            />
            <button
              onClick={addSpecialReward}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold"
            >
              Add
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => {
              localStorage.setItem('bossRewards', JSON.stringify({ finalBossRewards, miniBossSpecialRewards }));
              alert('Boss rewards saved!');
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-semibold"
          >
            Save Configuration
          </button>
          <button
            onClick={distributeRewards}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-semibold"
            disabled={totalAllocated === 0 || remainingMiniBosses < 0}
          >
            Distribute Rewards
          </button>
        </div>
      </div>
    </div>
  );
}