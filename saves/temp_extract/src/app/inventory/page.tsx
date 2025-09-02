"use client";

import { useState } from "react";
import Link from "next/link";

type InventoryTab = 'meks' | 'items' | 'essence' | 'achievements';
type ItemFilter = 'all' | 'heads' | 'bodies' | 'traits';

interface InventoryItem {
  name: string;
  quantity: number;
  rarity: string;
  xp: number;
  type?: string;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('meks');
  const [itemFilter, setItemFilter] = useState<ItemFilter>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMek, setSelectedMek] = useState<string | null>(null);

  // Sample inventory data
  const userMeks = [
    {
      id: '001',
      name: 'Prime Genesis #101',
      head: 'Taser',
      body: 'Grate',
      trait: 'Nothing',
      level: 15,
      power: 8500,
      rarity: 'Legendary',
      imageUrl: '/750x750/101C.png'
    },
    {
      id: '002',
      name: 'Battle Mek #1337',
      head: 'Flashbulb',
      body: 'Drill',
      trait: 'Laser',
      level: 12,
      power: 6200,
      rarity: 'Epic',
      imageUrl: '/750x750/1337B.png'
    },
    {
      id: '003',
      name: 'Scout Unit #2485',
      head: 'Accordion',
      body: 'Maps',
      trait: 'Projector',
      level: 8,
      power: 4100,
      rarity: 'Rare',
      imageUrl: '/750x750/2485A.png'
    },
    {
      id: '004',
      name: 'Tank Destroyer #777',
      head: 'Turret',
      body: 'Gatling',
      trait: 'Paul',
      level: 20,
      power: 9999,
      rarity: 'Legendary',
      imageUrl: '/750x750/777D.png'
    }
  ];

  const userItems = {
    heads: [
      { name: 'Taser Head', quantity: 3, rarity: 'Common', xp: 25 },
      { name: 'Flashbulb Head', quantity: 1, rarity: 'Rare', xp: 150 },
      { name: 'Turret Head', quantity: 2, rarity: 'Epic', xp: 400 },
      { name: 'Accordion Head', quantity: 5, rarity: 'Common', xp: 45 },
    ],
    bodies: [
      { name: 'Drill Body', quantity: 2, rarity: 'Uncommon', xp: 80 },
      { name: 'Gatling Body', quantity: 1, rarity: 'Epic', xp: 350 },
      { name: 'Maps Body', quantity: 4, rarity: 'Common', xp: 30 },
    ],
    traits: [
      { name: 'Laser Trait', quantity: 1, rarity: 'Legendary', xp: 800 },
      { name: 'Paul Trait', quantity: 2, rarity: 'Epic', xp: 500 },
      { name: 'Projector Trait', quantity: 3, rarity: 'Rare', xp: 200 },
    ]
  };

  const userEssence = [
    { type: 'Stone', amount: 1250, icon: '🪨', color: '#8B7355' },
    { type: 'Disco', amount: 823, icon: '🎵', color: '#FF1493' },
    { type: 'Paul', amount: 456, icon: '👤', color: '#4169E1' },
    { type: 'Cartoon', amount: 2100, icon: '🎨', color: '#FF6347' },
    { type: 'Candy', amount: 3500, icon: '🍬', color: '#FF69B4' },
    { type: 'Tiles', amount: 890, icon: '🔲', color: '#708090' },
    { type: 'Moss', amount: 1680, icon: '🌿', color: '#228B22' },
    { type: 'Bullish', amount: 320, icon: '🐂', color: '#DC143C' },
    { type: 'Journalist', amount: 510, icon: '📰', color: '#2F4F4F' },
    { type: 'Laser', amount: 95, icon: '⚡', color: '#00CED1' },
    { type: 'Flashbulb', amount: 440, icon: '💡', color: '#FFD700' },
    { type: 'Accordion', amount: 780, icon: '🎹', color: '#8B4513' },
    { type: 'Turret', amount: 150, icon: '🔫', color: '#696969' },
    { type: 'Drill', amount: 290, icon: '🔩', color: '#CD853F' },
    { type: 'Security', amount: 180, icon: '🔒', color: '#191970' },
  ];

  const achievements = [
    { id: '1', name: 'First Steps', description: 'Complete your first crafting', progress: 100, icon: '🏆' },
    { id: '2', name: 'Mek Collector', description: 'Own 10 different Meks', progress: 40, icon: '🤖' },
    { id: '3', name: 'Essence Master', description: 'Collect 1000 of each essence', progress: 65, icon: '🧪' },
    { id: '4', name: 'Battle Veteran', description: 'Win 100 battles', progress: 78, icon: '⚔️' },
    { id: '5', name: 'Crafting Expert', description: 'Craft 50 items', progress: 32, icon: '⚙️' },
  ];

  const filteredItems = () => {
    let items: InventoryItem[] = [];
    
    if (itemFilter === 'all' || itemFilter === 'heads') {
      items = [...items, ...userItems.heads.map(i => ({ ...i, type: 'head' }))];
    }
    if (itemFilter === 'all' || itemFilter === 'bodies') {
      items = [...items, ...userItems.bodies.map(i => ({ ...i, type: 'body' }))];
    }
    if (itemFilter === 'all' || itemFilter === 'traits') {
      items = [...items, ...userItems.traits.map(i => ({ ...i, type: 'trait' }))];
    }
    
    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return items;
  };

  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'Common': return '#b0b0b0';
      case 'Uncommon': return '#4fc14f';
      case 'Rare': return '#4c8bf5';
      case 'Epic': return '#a335ee';
      case 'Legendary': return '#ff8000';
      default: return '#fff';
    }
  };

  return (
    <div className="min-h-screen p-5 relative z-10">
      <div className="max-width-container">
        <h1 className="text-5xl font-bold text-yellow-400 text-center mb-8">
          📦 Inventory
        </h1>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
            <button
              onClick={() => setActiveTab('meks')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                activeTab === 'meks' 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              🤖 My Meks ({userMeks.length})
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                activeTab === 'items' 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              ⚙️ Items
            </button>
            <button
              onClick={() => setActiveTab('essence')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                activeTab === 'essence' 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              🧪 Essence
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                activeTab === 'achievements' 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              🏆 Achievements
            </button>
          </div>
        </div>

        {/* Meks Tab */}
        {activeTab === 'meks' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {userMeks.map(mek => (
                <div
                  key={mek.id}
                  onClick={() => setSelectedMek(mek.id === selectedMek ? null : mek.id)}
                  className="relative bg-gray-900 rounded-xl border-2 border-gray-700 hover:border-yellow-500 transition-all cursor-pointer overflow-hidden group"
                >
                  {/* Rarity Glow */}
                  <div 
                    className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
                    style={{
                      background: `radial-gradient(circle at center, ${getRarityColor(mek.rarity)}, transparent)`
                    }}
                  />
                  
                  {/* Mek Image */}
                  <div className="relative h-48 bg-gray-800 flex items-center justify-center">
                    <div className="text-6xl">🤖</div>
                    {/* In production, use: <img src={mek.imageUrl} alt={mek.name} className="w-full h-full object-cover" /> */}
                  </div>
                  
                  {/* Mek Info */}
                  <div className="relative p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-yellow-400">{mek.name}</h3>
                      <span 
                        className="text-xs px-2 py-1 rounded font-bold"
                        style={{ 
                          backgroundColor: getRarityColor(mek.rarity) + '33',
                          color: getRarityColor(mek.rarity)
                        }}
                      >
                        {mek.rarity}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>Head: <span className="text-white">{mek.head}</span></div>
                      <div>Body: <span className="text-white">{mek.body}</span></div>
                      <div>Trait: <span className="text-white">{mek.trait}</span></div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between">
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Level</div>
                        <div className="text-lg font-bold text-yellow-400">{mek.level}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Power</div>
                        <div className="text-lg font-bold text-orange-400">{mek.power.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    {selectedMek === mek.id && (
                      <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors">
                          Battle
                        </button>
                        <button className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-colors">
                          Upgrade
                        </button>
                        <button className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold transition-colors">
                          Sell
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Empty State */}
            {userMeks.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">No Meks Yet</h3>
                <p className="text-gray-500 mb-6">Start crafting or purchase Meks from the shop!</p>
                <div className="flex justify-center gap-4">
                  <Link href="/crafting" className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-bold hover:bg-yellow-400 transition-colors">
                    Start Crafting
                  </Link>
                  <Link href="/shop" className="px-6 py-3 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600 transition-colors">
                    Visit Shop
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <div>
            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setItemFilter('all')}
                  className={`px-4 py-3 rounded-lg font-bold transition-all ${
                    itemFilter === 'all' 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setItemFilter('heads')}
                  className={`px-4 py-3 rounded-lg font-bold transition-all ${
                    itemFilter === 'heads' 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  Heads
                </button>
                <button
                  onClick={() => setItemFilter('bodies')}
                  className={`px-4 py-3 rounded-lg font-bold transition-all ${
                    itemFilter === 'bodies' 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  Bodies
                </button>
                <button
                  onClick={() => setItemFilter('traits')}
                  className={`px-4 py-3 rounded-lg font-bold transition-all ${
                    itemFilter === 'traits' 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  Traits
                </button>
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredItems().map((item, index) => (
                <div 
                  key={index}
                  className="bg-gray-900 rounded-lg border border-gray-700 hover:border-yellow-500 transition-all p-4 cursor-pointer group"
                >
                  <div className="text-3xl text-center mb-2">
                    {item.type === 'head' ? '📏' : item.type === 'body' ? '🔧' : '⚡'}
                  </div>
                  <h4 
                    className="text-sm font-bold text-center mb-1"
                    style={{ color: getRarityColor(item.rarity) }}
                  >
                    {item.name}
                  </h4>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{item.quantity}</div>
                    <div className="text-xs text-gray-500">Owned</div>
                  </div>
                  <div className="text-xs text-center text-gray-400 mt-2">
                    {item.xp} XP
                  </div>
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-full px-2 py-1 bg-yellow-500 text-black rounded text-xs font-bold hover:bg-yellow-400 transition-colors">
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems().length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-bold text-gray-400">No items found</h3>
              </div>
            )}
          </div>
        )}

        {/* Essence Tab */}
        {activeTab === 'essence' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {userEssence.map((essence, index) => (
                <div 
                  key={index}
                  className="bg-gray-900 rounded-lg border-2 border-gray-700 hover:border-yellow-500 transition-all p-6 text-center group cursor-pointer"
                  style={{
                    borderColor: essence.amount > 1000 ? essence.color + '66' : undefined
                  }}
                >
                  <div className="text-4xl mb-3">{essence.icon}</div>
                  <h4 className="font-bold text-lg mb-2" style={{ color: essence.color }}>
                    {essence.type}
                  </h4>
                  <div className="text-3xl font-bold text-yellow-400">
                    {essence.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Units</div>
                  
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity space-y-2">
                    <button className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors">
                      Convert
                    </button>
                    <button className="w-full px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-colors">
                      Sell
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-gray-900 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Essence Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-400">Total Types</div>
                  <div className="text-2xl font-bold text-yellow-400">15</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Total Units</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {userEssence.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Most Abundant</div>
                  <div className="text-2xl font-bold text-yellow-400">Candy</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Rarest</div>
                  <div className="text-2xl font-bold text-yellow-400">Laser</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            {achievements.map(achievement => (
              <div 
                key={achievement.id}
                className="bg-gray-900 rounded-lg border border-gray-700 p-6 hover:border-yellow-500 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-yellow-400 mb-1">{achievement.name}</h3>
                    <p className="text-gray-400 text-sm mb-3">{achievement.description}</p>
                    <div className="relative w-full h-6 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500"
                        style={{ width: `${achievement.progress}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                        {achievement.progress}%
                      </div>
                    </div>
                  </div>
                  {achievement.progress === 100 && (
                    <div className="text-green-400 text-2xl">✓</div>
                  )}
                </div>
              </div>
            ))}
            
            <div className="text-center py-8 text-gray-500">
              <p>Complete achievements to earn rewards and unlock new features!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}