"use client";

import { useState } from "react";
import BackgroundEffects from "@/components/BackgroundEffects";
import MekImage from "@/components/MekImage";
import EssenceChart, { type EssenceData } from "@/components/EssenceChart";

type Equipment = {
  id: string;
  name: string;
  equipped: boolean;
  rarity: string;
  icon: string;
  slot: 'head' | 'body' | 'accessory';
};

type Mek = {
  id: string;
  number: number;
  rank: string;
  level: number;
  goldPerHour: number;
  equipped: {
    head?: Equipment;
    body?: Equipment;
    accessory?: Equipment;
  };
};

type Frame = {
  id: string;
  number: number;
  rank: string;
  level: number;
  goldPerHour: number;
};

type OfferModal = {
  type: 'essence' | 'equipment' | null;
  item?: any;
};

// Generate mock essence data
const generateEssenceData = (): EssenceData[] => {
  const essenceNames = [
    "Fire", "Water", "Earth", "Air", "Lightning", "Ice", "Nature", "Shadow",
    "Light", "Crystal", "Metal", "Void", "Chaos", "Order", "Energy", "Matter"
  ];
  
  return essenceNames.map((name, index) => ({
    name,
    quantity: Math.max(1, Math.floor(100 * Math.exp(-index / 5))),
    rate: 0.5 - (index * 0.02),
    individualBuff: index % 3 === 0 ? 0.1 + (index % 5) * 0.02 : 0,
    icon: ["🔥", "💧", "🌍", "💨", "⚡", "❄️", "🌿", "🌑", 
           "✨", "💎", "⚙️", "🌌", "🌀", "⚖️", "⚡", "🔮"][index]
  }));
};

export default function ProfilePage() {
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState('1234');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [offerModal, setOfferModal] = useState<OfferModal>({ type: null });
  const [activeTab, setActiveTab] = useState<'meks' | 'essence' | 'inventory' | 'frames'>('meks');
  const [prestigeLevel, setPrestigeLevel] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const meksPerPage = 8;
  
  // Generate 40 mock meks
  const generateMockMeks = () => {
    const meks = [];
    const variations = ['Camera', 'Musical', 'Material', 'Gaming', 'Cyber', 'Retro', 'Neon', 'Crystal'];
    for (let i = 1; i <= 40; i++) {
      meks.push({
        id: `mek${i}`,
        number: 1000 + i,
        rank: i <= 5 ? 'S' : i <= 15 ? 'A' : i <= 30 ? 'B' : 'C',
        level: Math.floor(Math.random() * 10) + 1,
        goldPerHour: Math.floor(Math.random() * 400) + 100,
        variation: variations[Math.floor(Math.random() * variations.length)],
        equipped: i === 1 ? { 
          head: { id: 'h1', name: 'Battle Helm', equipped: true, rarity: 'rare', icon: '🎩', slot: 'head' as const },
          body: { id: 'b1', name: 'War Armor', equipped: true, rarity: 'epic', icon: '🎮', slot: 'body' as const }
        } : {}
      });
    }
    return meks;
  };
  
  // Mock user data
  const userData = {
    username: isOwnProfile ? 'YourUsername' : 'OtherPlayer123',
    achievementPoints: 2847,
    totalGold: 125420,
    joinDate: '2024-01-15',
    essences: generateEssenceData(),
    equipment: [
      { id: 'sword1', name: 'Flame Sword', equipped: true, rarity: 'epic', icon: '🗡️', slot: 'body' as const },
      { id: 'armor1', name: 'Dragon Scale Armor', equipped: false, rarity: 'legendary', icon: '🛡️', slot: 'body' as const },
      { id: 'ring1', name: 'Ring of Power', equipped: true, rarity: 'rare', icon: '💍', slot: 'accessory' as const },
      { id: 'boots1', name: 'Speed Boots', equipped: false, rarity: 'uncommon', icon: '👢', slot: 'accessory' as const },
      { id: 'helm1', name: 'Crystal Helm', equipped: true, rarity: 'epic', icon: '⛑️', slot: 'head' as const },
    ],
    meks: generateMockMeks(),
    frames: [
      { id: 'f1', number: 101, rank: 'A', level: 5, goldPerHour: 150, name: 'Electro Frame', description: 'Reach 500 gold/hr' },
      { id: 'f2', number: 202, rank: 'B', level: 3, goldPerHour: 100, name: 'Speed Frame', description: 'Complete 10 battles' },
      { id: 'f3', number: 303, rank: 'S', level: 8, goldPerHour: 250, name: 'Champion Frame', description: 'Win tournament' },
    ]
  };
  
  // Filter meks based on search
  const filteredMeks = userData.meks.filter(mek => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return mek.number.toString().includes(term) || 
           mek.variation?.toLowerCase().includes(term);
  });
  
  // Pagination
  const totalPages = Math.ceil(filteredMeks.length / meksPerPage);
  const paginatedMeks = filteredMeks.slice(
    (currentPage - 1) * meksPerPage,
    currentPage * meksPerPage
  );
  
  // Get prestige styling
  const getPrestigeStyle = (level: number) => {
    const styles = [
      { border: 'from-gray-600 via-gray-500 to-gray-600', text: 'from-gray-300 to-gray-400', glow: 'rgba(156, 163, 175, 0.3)', intensity: 0.1 },
      { border: 'from-green-700 via-green-500 to-green-700', text: 'from-green-300 to-green-400', glow: 'rgba(34, 197, 94, 0.4)', intensity: 0.2 },
      { border: 'from-blue-700 via-blue-500 to-blue-700', text: 'from-blue-300 to-blue-400', glow: 'rgba(59, 130, 246, 0.4)', intensity: 0.3 },
      { border: 'from-purple-700 via-purple-500 to-purple-700', text: 'from-purple-300 to-purple-400', glow: 'rgba(147, 51, 234, 0.5)', intensity: 0.4 },
      { border: 'from-pink-700 via-pink-500 to-pink-700', text: 'from-pink-300 to-pink-400', glow: 'rgba(236, 72, 153, 0.5)', intensity: 0.5 },
      { border: 'from-red-700 via-orange-500 to-red-700', text: 'from-orange-300 to-red-400', glow: 'rgba(239, 68, 68, 0.6)', intensity: 0.6 },
      { border: 'from-yellow-600 via-amber-400 to-yellow-600', text: 'from-amber-300 to-yellow-400', glow: 'rgba(245, 158, 11, 0.6)', intensity: 0.7 },
      { border: 'from-yellow-400 via-purple-500 to-yellow-400', text: 'from-yellow-300 to-purple-400', glow: 'rgba(250, 182, 23, 0.7)', intensity: 0.8 },
    ];
    return styles[level] || styles[0];
  };
  
  const prestigeStyle = getPrestigeStyle(prestigeLevel);
  const prestigeRoman = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][prestigeLevel];

  const handleMakeOffer = (item: any, type: 'essence' | 'equipment') => {
    if (!isOwnProfile) {
      setOfferModal({ type, item });
    }
  };

  return (
    <div className="min-h-screen p-5 relative text-white">
      <BackgroundEffects />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Dev Toggles */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3 bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-400">View as:</span>
            <button
              onClick={() => setIsOwnProfile(true)}
              className={`px-3 py-1 rounded text-sm transition-all ${
                isOwnProfile
                  ? 'bg-yellow-500 text-black font-bold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Own Profile
            </button>
            <button
              onClick={() => setIsOwnProfile(false)}
              className={`px-3 py-1 rounded text-sm transition-all ${
                !isOwnProfile
                  ? 'bg-yellow-500 text-black font-bold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Other Player
            </button>
          </div>
          
          {/* Prestige Toggle */}
          <div className="flex items-center gap-2 bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-400">Prestige:</span>
            {[0, 1, 2, 3, 4, 5, 6, 7].map(level => (
              <button
                key={level}
                onClick={() => setPrestigeLevel(level)}
                className={`px-2 py-1 rounded text-xs transition-all ${
                  prestigeLevel === level
                    ? 'bg-yellow-500 text-black font-bold'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column - Profile & Stats */}
          <div className="col-span-4">
            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden">
              
              {/* Large Avatar - No padding */}
              <div className="relative">
                <div className="w-full aspect-square bg-gray-800 overflow-hidden">
                  <MekImage
                    assetId={selectedAvatar}
                    size={400}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Edit Avatar Button - Removed from inside image */}
                </div>
              </div>
              
              {/* Change Avatar Button */}
              {isOwnProfile && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setShowAvatarSelector(true)}
                    className="text-[10px] text-gray-500 hover:text-gray-400 transition-colors"
                  >
                    Change Avatar
                  </button>
                </div>
              )}
              
              {/* Username & Prestige */}
              <div className="text-center mb-4 px-6 pt-4">
                <h1 className="text-3xl font-bold text-yellow-400 mb-3">{userData.username}</h1>
                
                {/* Prestige Level Sleek Frame */}
                {prestigeLevel > 0 && (
                <div className="inline-block relative">
                  {/* Outer glow effect - intensity based on level */}
                  <div className={`absolute inset-0 blur-lg bg-gradient-to-r ${prestigeStyle.border} ${prestigeLevel > 5 ? 'animate-pulse' : ''}`} 
                       style={{ opacity: prestigeStyle.intensity }}></div>
                  
                  {/* Sleek frame container */}
                  <div className="relative bg-gradient-to-br from-gray-900/90 via-black to-gray-900/90 p-[1px] rounded-md overflow-hidden">
                    {/* Animated border gradient */}
                    {prestigeLevel > 3 && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${prestigeStyle.border} opacity-80`} 
                         style={{
                           backgroundSize: '200% 100%',
                           animation: prestigeLevel > 5 ? 'shimmer 2s linear infinite' : 'none'
                         }}>
                    </div>
                    )}
                    
                    {/* Inner content - thinner design */}
                    <div className="relative bg-black/90 px-4 py-1 rounded">
                      <div className="text-[8px] text-gray-400 uppercase tracking-widest">Prestige</div>
                      <div className={`text-lg font-bold bg-gradient-to-r ${prestigeStyle.text} bg-clip-text text-transparent`}>
                        {prestigeRoman}
                      </div>
                    </div>
                  </div>
                </div>
                )}
                
                <div className="text-xs text-gray-500 mt-3">Joined {userData.joinDate}</div>
              </div>
              
              {/* Stats - Reordered */}
              <div className="space-y-3 px-6 pb-6 pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Gold</span>
                  <span className="text-xl font-bold text-yellow-400">
                    {userData.totalGold.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Gold/Hour</span>
                  <span className="text-xl font-bold text-yellow-400">
                    {(userData.meks.reduce((sum, m) => sum + m.goldPerHour, 0) + 
                      userData.frames.reduce((sum, f) => sum + f.goldPerHour, 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Essence Owned</span>
                  <span className="text-xl font-bold text-purple-400">
                    {userData.essences.reduce((sum, e) => sum + e.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Essence/hr</span>
                  <span className="text-xl font-bold text-purple-400">
                    {userData.essences.reduce((sum, e) => sum + e.rate, 0).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Meks Owned</span>
                  <span className="text-xl font-bold text-cyan-400">
                    {userData.meks.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Frames Owned</span>
                  <span className="text-xl font-bold text-green-400">
                    {userData.frames.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Content Tabs */}
          <div className="col-span-8">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('meks')}
                className={`px-6 py-3 rounded-t-lg font-bold transition-all ${
                  activeTab === 'meks'
                    ? 'bg-gray-900/60 border border-b-0 border-gray-800 text-yellow-400'
                    : 'bg-gray-900/30 border border-gray-800 text-gray-400 hover:text-gray-300'
                }`}
              >
                Meks
              </button>
              <button
                onClick={() => setActiveTab('essence')}
                className={`px-6 py-3 rounded-t-lg font-bold transition-all ${
                  activeTab === 'essence'
                    ? 'bg-gray-900/60 border border-b-0 border-gray-800 text-yellow-400'
                    : 'bg-gray-900/30 border border-gray-800 text-gray-400 hover:text-gray-300'
                }`}
              >
                Essence
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-6 py-3 rounded-t-lg font-bold transition-all ${
                  activeTab === 'inventory'
                    ? 'bg-gray-900/60 border border-b-0 border-gray-800 text-yellow-400'
                    : 'bg-gray-900/30 border border-gray-800 text-gray-400 hover:text-gray-300'
                }`}
              >
                Inventory
              </button>
              <button
                onClick={() => setActiveTab('frames')}
                className={`px-6 py-3 rounded-t-lg font-bold transition-all ${
                  activeTab === 'frames'
                    ? 'bg-gray-900/60 border border-b-0 border-gray-800 text-yellow-400'
                    : 'bg-gray-900/30 border border-gray-800 text-gray-400 hover:text-gray-300'
                }`}
              >
                Frames
              </button>
            </div>

            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-lg rounded-tl-none p-6 min-h-[600px]">
              
              {/* Meks Tab */}
              {activeTab === 'meks' && (
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by Mek # or variation..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  {/* Meks Section */}
                  <div>
                    <h3 className="text-xl font-bold text-yellow-400 mb-4">Owned Meks</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {paginatedMeks.map(mek => (
                        <div
                          key={mek.id}
                          className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:bg-gray-700/50 transition-all cursor-pointer"
                        >
                          {/* Mek Image */}
                          <div className="relative mb-2">
                            <MekImage
                              assetId={mek.id}
                              size={150}
                              alt={`Mek #${mek.number}`}
                              className="w-full aspect-square bg-gray-700 rounded"
                            />
                            
                            {/* Item Slot Indicators */}
                            <div className="absolute bottom-2 right-2 flex gap-1 bg-black/50 p-1 rounded">
                              {['head', 'body', 'accessory'].map((slot, idx) => {
                                const hasItem = mek.equipped[slot as keyof typeof mek.equipped];
                                return (
                                  <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full ${
                                      hasItem ? 'bg-yellow-400' : 'bg-gray-600'
                                    }`}
                                    title={slot}
                                  />
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Mek Info */}
                          <div className="space-y-0.5">
                            <div className="font-bold text-yellow-400 text-sm">
                              Mek #{mek.number}
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Rank {mek.rank}</span>
                              <span className="text-gray-400">Lvl {mek.level}</span>
                            </div>
                            <div className="text-xs text-green-400 font-semibold">
                              {mek.goldPerHour} g/hr
                            </div>
                            {mek.variation && (
                              <div className="text-xs text-gray-500">
                                {mek.variation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 text-sm"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = idx + 1;
                          } else if (currentPage <= 3) {
                            pageNum = idx + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + idx;
                          } else {
                            pageNum = currentPage - 2 + idx;
                          }
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-2 py-1 rounded text-sm ${
                                currentPage === pageNum 
                                  ? "bg-yellow-400 text-black" 
                                  : "bg-gray-700 hover:bg-gray-600"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 text-sm"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Essence Tab */}
              {activeTab === 'essence' && (
                <EssenceChart 
                  essenceData={userData.essences}
                  viewCount={30}
                  clickable={!isOwnProfile}
                  onEssenceClick={(essence) => handleMakeOffer(essence, 'essence')}
                />
              )}

              {/* Inventory Tab */}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  
                  {/* Equipment Section */}
                  <div>
                    <h3 className="text-xl font-bold text-yellow-400 mb-4">Equipment (Gear)</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {userData.equipment.map(item => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            item.equipped
                              ? 'bg-green-900/20 border-green-600'
                              : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                          } ${!isOwnProfile && !item.equipped ? 'cursor-pointer hover:shadow-lg' : ''}`}
                          onClick={() => !isOwnProfile && !item.equipped && handleMakeOffer(item, 'equipment')}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <div>
                              <div className="font-medium text-gray-200">{item.name}</div>
                              <div className={`text-xs ${
                                item.rarity === 'legendary' ? 'text-orange-400' :
                                item.rarity === 'epic' ? 'text-purple-400' :
                                item.rarity === 'rare' ? 'text-blue-400' :
                                item.rarity === 'uncommon' ? 'text-green-400' :
                                'text-gray-400'
                              }`}>{item.rarity} • {item.slot}</div>
                            </div>
                          </div>
                          {item.equipped && (
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Equipped</span>
                          )}
                          {!isOwnProfile && !item.equipped && (
                            <span className="text-xs text-gray-400">Click to offer</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>


                  {/* Other Items Section */}
                  <div>
                    <h3 className="text-xl font-bold text-yellow-400 mb-4">Other Items</h3>
                    <div className="text-gray-400">No other items in inventory</div>
                  </div>
                </div>
              )}
              
              {/* Frames Tab */}
              {activeTab === 'frames' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-yellow-400 mb-4">Frame Collection</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {userData.frames.map(frame => (
                      <div
                        key={frame.id}
                        className="relative p-4 rounded-lg overflow-hidden hover:scale-105 transition-transform"
                        style={{
                          background: 'rgba(255, 255, 255, 0.005)',
                          backdropFilter: 'blur(1px)',
                          border: '1px solid rgba(255, 255, 255, 0.015)',
                          boxShadow: '0 0 20px rgba(0, 0, 0, 0.2) inset',
                        }}
                      >
                        {/* Ultra-thin dirty glass noise texture */}
                        <div 
                          className="absolute inset-0 pointer-events-none opacity-20"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E")`,
                          }}
                        />
                        
                        <div className="relative z-10 text-center">
                          <div className="text-sm text-gray-400">Frame</div>
                          <div className="text-lg font-bold text-yellow-400">#{frame.number}</div>
                          <div className="text-xs font-medium text-gray-300 mt-1">
                            {frame.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {frame.description}
                          </div>
                        </div>
                        
                        <div className="relative z-10 mt-3 pt-3 border-t border-gray-800/50 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Rank:</span>
                            <span className={`font-bold ${
                              frame.rank === 'S' ? 'text-yellow-400' :
                              frame.rank === 'A' ? 'text-purple-400' :
                              frame.rank === 'B' ? 'text-blue-400' :
                              'text-gray-400'
                            }`}>{frame.rank}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Level:</span>
                            <span className="text-white">{frame.level}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Gold/hr:</span>
                            <span className="text-green-400">{frame.goldPerHour}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Avatar Selector Modal */}
        {showAvatarSelector && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Select Profile Avatar</h3>
              <div className="grid grid-cols-5 gap-3">
                {userData.meks.map(mek => (
                  <button
                    key={mek.id}
                    onClick={() => {
                      setSelectedAvatar(mek.id);
                      setShowAvatarSelector(false);
                    }}
                    className={`border-2 rounded-lg p-2 transition-all ${
                      selectedAvatar === mek.id
                        ? 'border-yellow-500 bg-yellow-500/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <MekImage
                      assetId={mek.id}
                      size={100}
                      alt={`Mek #${mek.number}`}
                      className="w-full rounded"
                    />
                    <div className="text-xs mt-1 text-gray-400">Mek #{mek.number}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAvatarSelector(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Offer Modal */}
        {offerModal.type && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">
                Make Offer
              </h3>
              
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                {offerModal.type === 'essence' ? (
                  <div>
                    <div className="font-bold text-lg">{offerModal.item.name} Essence</div>
                    <div className="text-sm text-gray-400">Quantity: {offerModal.item.quantity}</div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{offerModal.item.icon}</span>
                    <div>
                      <div className="font-bold">{offerModal.item.name}</div>
                      <div className="text-sm text-gray-400">{offerModal.item.rarity}</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Offer Amount (Gold)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="Enter amount"
                  />
                </div>
                
                {offerModal.type === 'essence' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none"
                      placeholder="How many essence"
                      max={offerModal.item.quantity}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded hover:from-yellow-400 hover:to-yellow-500 transition-all"
                >
                  Submit Offer
                </button>
                <button
                  onClick={() => setOfferModal({ type: null })}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}