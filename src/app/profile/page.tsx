"use client";

import { useState } from "react";
import BackgroundEffects from "@/components/BackgroundEffects";
import MekImage from "@/components/MekImage";
import EssenceChart, { type EssenceData } from "@/components/EssenceChart";

type Mek = {
  id: string;
  number: number;
  level: number;
  goldPerHour: number;
  equipped: {
    head?: any;
    body?: any;
    accessory?: any;
  };
};


type OfferModal = {
  type: 'essence' | null;
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
  const [inventorySubTab, setInventorySubTab] = useState<'universal_chips' | 'mek_chips' | 'various'>('universal_chips');
  const [mekSortBy, setMekSortBy] = useState<'level' | 'goldPerHour'>('level');
  const [prestigeLevel, setPrestigeLevel] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const meksPerPage = 8;
  
  // Generate 40 mock meks
  const generateMockMeks = () => {
    const meks = [];
    for (let i = 1; i <= 40; i++) {
      meks.push({
        id: `mek${i}`,
        number: 1000 + i,
        level: Math.floor(Math.random() * 10) + 1,
        goldPerHour: Math.floor(Math.random() * 400) + 100,
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
    equipment: [],
    meks: generateMockMeks(),
    frames: [
      { id: 'f1', number: 101, level: 5, goldPerHour: 150, name: 'Electro Frame', description: 'Reach 500 gold/hr' },
      { id: 'f2', number: 202, level: 3, goldPerHour: 100, name: 'Speed Frame', description: 'Complete 10 battles' },
      { id: 'f3', number: 303, level: 8, goldPerHour: 250, name: 'Champion Frame', description: 'Win tournament' },
    ]
  };
  
  // Filter and sort meks based on search and sort option
  const filteredMeks = userData.meks.filter(mek => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return mek.number.toString().includes(term);
  }).sort((a, b) => {
    if (mekSortBy === 'level') {
      return b.level - a.level;
    } else {
      return b.goldPerHour - a.goldPerHour;
    }
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

  const handleMakeOffer = (item: any, type: 'essence') => {
    if (!isOwnProfile) {
      setOfferModal({ type, item });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Mission Card Style Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 20% 20%, rgba(250, 182, 23, 0.03) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 80%, rgba(250, 182, 23, 0.02) 0%, transparent 50%),
              linear-gradient(180deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 1) 100%)
            `
          }}
        />
      </div>
      
      <div className="relative z-10 p-5">
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
            {/* Style N Card - Ancient Space Glass */}
            <div className="relative rounded-lg overflow-hidden group"
              style={{
                background: 'rgba(255, 255, 255, 0.005)',
                backdropFilter: 'blur(1px)',
                border: '1px solid rgba(255, 255, 255, 0.015)',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.2) inset',
              }}>
              {/* Micro cracks on edges */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,20 L8,15 L12,22 L18,18" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none"/>
                <path d="M0,80 L6,82 L10,78 L15,83" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" fill="none"/>
                <path d="M385,10 L380,12 L383,8 L378,6" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" transform="translate(-280, 0)"/>
                <path d="M385,90 L382,85 L388,88 L384,92" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" fill="none" transform="translate(-280, 0)"/>
              </svg>
              <div 
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  background: `
                    radial-gradient(circle at 15% 20%, rgba(250, 182, 23, 0.02) 0%, transparent 20%),
                    radial-gradient(circle at 85% 80%, rgba(147, 51, 234, 0.015) 0%, transparent 20%),
                    radial-gradient(circle at 50% 50%, transparent 30%, rgba(255, 255, 255, 0.005) 70%, transparent 100%)`,
                  filter: 'blur(3px)',
                }}
              />
              <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence baseFrequency='1.5' numOctaves='3' seed='2' /%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noiseFilter)' opacity='0.01'/%3E%3C/svg%3E")`,
                }}
              />
              
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
                
                {/* Prestige Level Sleek Frame - Always show */}
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
                      <div className={`text-lg font-bold bg-gradient-to-r ${prestigeLevel > 0 ? prestigeStyle.text : 'from-gray-300 to-gray-400'} bg-clip-text text-transparent`}>
                        {prestigeRoman}
                      </div>
                    </div>
                  </div>
                </div>
                
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
            {/* Tab Navigation - Connected to main frame */}
            <div className="flex gap-0">
              <button
                onClick={() => setActiveTab('meks')}
                className={`px-6 py-3 font-bold transition-all ${
                  activeTab === 'meks'
                    ? 'bg-gray-900/60 border-t-2 border-l-2 border-r-2 border-yellow-500/50 text-yellow-400 relative z-10'
                    : 'bg-gray-900/30 border border-gray-800 text-gray-400 hover:text-gray-300'
                }`}
              >
                Meks
              </button>
              <button
                onClick={() => setActiveTab('essence')}
                className={`px-6 py-3 font-bold transition-all ${
                  activeTab === 'essence'
                    ? 'bg-gray-900/60 border-t-2 border-l-2 border-r-2 border-yellow-500/50 text-yellow-400 relative z-10'
                    : 'bg-gray-900/30 border border-gray-800 text-gray-400 hover:text-gray-300'
                }`}
              >
                Essence
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-6 py-3 font-bold transition-all ${
                  activeTab === 'inventory'
                    ? 'bg-gray-900/60 border-t-2 border-l-2 border-r-2 border-yellow-500/50 text-yellow-400 relative z-10'
                    : 'bg-gray-900/30 border border-gray-800 text-gray-400 hover:text-gray-300'
                }`}
              >
                Inventory
              </button>
              <button
                onClick={() => setActiveTab('frames')}
                className={`px-6 py-3 font-bold transition-all ${
                  activeTab === 'frames'
                    ? 'bg-gray-900/60 border-t-2 border-l-2 border-r-2 border-yellow-500/50 text-yellow-400 relative z-10'
                    : 'bg-gray-900/30 border border-gray-800 text-gray-400 hover:text-gray-300'
                }`}
              >
                Frames
              </button>
            </div>

            {/* Style K Card - Streaked Glass */}
            <div className="relative border border-gray-600/20 overflow-hidden p-4 min-h-[600px] -mt-[2px]"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(4px) contrast(1.1)',
                borderTop: '2px solid rgba(250, 182, 23, 0.5)',
                borderLeft: '2px solid rgba(250, 182, 23, 0.5)',
                borderRight: '2px solid rgba(250, 182, 23, 0.5)',
                borderBottom: '2px solid rgba(250, 182, 23, 0.5)',
              }}>
              {/* Streak effects */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.01) 50%, transparent 70%),
                    linear-gradient(-45deg, transparent 30%, rgba(255, 255, 255, 0.01) 50%, transparent 70%)`,
                }}
              />
              {/* Glow spots */}
              <div 
                className="absolute -inset-1 opacity-20"
                style={{
                  background: `
                    radial-gradient(ellipse at top left, rgba(250, 182, 23, 0.15) 0%, transparent 40%),
                    radial-gradient(ellipse at bottom right, rgba(147, 51, 234, 0.1) 0%, transparent 40%),
                    radial-gradient(circle at 30% 60%, rgba(255, 255, 255, 0.05) 0%, transparent 20%),
                    radial-gradient(circle at 70% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 20%)`,
                  filter: 'blur(8px)',
                }}
              />
              
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
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-yellow-400">Owned Meks</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMekSortBy('level')}
                          className={`px-3 py-1 text-xs rounded transition-all ${
                            mekSortBy === 'level'
                              ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                              : 'bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          Sort by Level
                        </button>
                        <button
                          onClick={() => setMekSortBy('goldPerHour')}
                          className={`px-3 py-1 text-xs rounded transition-all ${
                            mekSortBy === 'goldPerHour'
                              ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                              : 'bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          Sort by Gold/Hr
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {paginatedMeks.map(mek => (
                        <div
                          key={mek.id}
                          className="relative group cursor-pointer"
                          onClick={() => window.location.href = `/mek/${mek.id}`}
                        >
                          {/* Clean image display */}
                          <div className="relative overflow-hidden rounded-lg bg-gray-900/50">
                            <MekImage
                              assetId={mek.id}
                              size={200}
                              alt={`Mek #${mek.number}`}
                              className="w-full aspect-square transition-transform group-hover:scale-110"
                            />
                            
                            {/* Hover overlay with info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                              <div className="text-yellow-400 font-bold text-sm mb-1">
                                Mek #{mek.number}
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-300">Lvl {mek.level}</span>
                                <span className="text-green-400">{mek.goldPerHour} g/hr</span>
                              </div>
                              {/* Item indicators */}
                              <div className="flex gap-1 mt-2 justify-center">
                                {['head', 'body', 'accessory'].map((slot, idx) => {
                                  const hasItem = mek.equipped[slot as keyof typeof mek.equipped];
                                  return (
                                    <div
                                      key={idx}
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        hasItem ? 'bg-yellow-400' : 'bg-gray-600'
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
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
                  {/* Inventory Sub-tabs */}
                  <div className="flex gap-1 bg-black/40 p-1 rounded-lg backdrop-blur-sm">
                    {[
                      { key: 'universal_chips', label: 'Universal Chips' },
                      { key: 'mek_chips', label: 'Mek Chips' },
                      { key: 'various', label: 'Various' }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setInventorySubTab(tab.key as any)}
                        className={`px-4 py-2 rounded-md font-medium transition-all ${
                          inventorySubTab === tab.key
                            ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Universal Chips Sub-tab */}
                  {inventorySubTab === 'universal_chips' && (
                    <div>
                      <h3 className="text-xl font-bold text-yellow-400 mb-4">Universal Chips</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {/* Mock chip data */}
                        {[
                          { id: 'chip1', name: 'Common Power Chip', rarity: 'common', quantity: 12, icon: '💾' },
                          { id: 'chip2', name: 'Rare Power Chip', rarity: 'rare', quantity: 3, icon: '💎' },
                          { id: 'chip3', name: 'Epic Memory Core', rarity: 'epic', quantity: 1, icon: '🧠' },
                        ].map(chip => (
                          <div
                            key={chip.id}
                            className="relative overflow-hidden transition-all hover:shadow-lg"
                            style={{
                              background: `
                                linear-gradient(135deg, 
                                  rgba(255, 255, 255, 0.02) 0%, 
                                  rgba(255, 255, 255, 0.05) 50%, 
                                  rgba(255, 255, 255, 0.02) 100%)`,
                              backdropFilter: 'blur(6px)',
                              boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(250, 182, 23, 0.3)',
                            }}
                          >
                            <div 
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background: `
                                  radial-gradient(circle at 20% 30%, rgba(250, 182, 23, 0.08) 0%, transparent 30%),
                                  radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 25%),
                                  radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 40%)`,
                                mixBlendMode: 'screen',
                              }}
                            />
                            <div 
                              className="absolute inset-0 pointer-events-none opacity-30"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                              }}
                            />
                            <div className="relative p-4 text-center">
                              <div className="text-3xl mb-2">{chip.icon}</div>
                              <div className="font-medium text-gray-200 text-sm mb-1">{chip.name}</div>
                              <div className={`text-xs mb-2 ${
                                chip.rarity === 'epic' ? 'text-purple-400' :
                                chip.rarity === 'rare' ? 'text-blue-400' :
                                'text-gray-400'
                              }`}>{chip.rarity}</div>
                              <div className="text-lg font-bold text-yellow-400">×{chip.quantity}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mek Chips Sub-tab */}
                  {inventorySubTab === 'mek_chips' && (
                    <div>
                      <h3 className="text-xl font-bold text-yellow-400 mb-4">Mek Chips</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {/* Mock Mek chip data */}
                        {[
                          { id: 'mchip1', name: 'Speed Boost Chip', mekType: 'Camera', quantity: 5, icon: '⚡' },
                          { id: 'mchip2', name: 'Defense Matrix', mekType: 'Musical', quantity: 2, icon: '🛡️' },
                          { id: 'mchip3', name: 'Gold Amplifier', mekType: 'Any', quantity: 1, icon: '💰' },
                        ].map(chip => (
                          <div
                            key={chip.id}
                            className="relative overflow-hidden transition-all hover:shadow-lg"
                            style={{
                              background: `
                                linear-gradient(135deg, 
                                  rgba(255, 255, 255, 0.02) 0%, 
                                  rgba(255, 255, 255, 0.05) 50%, 
                                  rgba(255, 255, 255, 0.02) 100%)`,
                              backdropFilter: 'blur(6px)',
                              boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(250, 182, 23, 0.3)',
                            }}
                          >
                            <div 
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background: `
                                  radial-gradient(circle at 20% 30%, rgba(250, 182, 23, 0.08) 0%, transparent 30%),
                                  radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 25%),
                                  radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 40%)`,
                                mixBlendMode: 'screen',
                              }}
                            />
                            <div 
                              className="absolute inset-0 pointer-events-none opacity-30"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                              }}
                            />
                            <div className="relative p-4 text-center">
                              <div className="text-3xl mb-2">{chip.icon}</div>
                              <div className="font-medium text-gray-200 text-sm mb-1">{chip.name}</div>
                              <div className="text-xs text-purple-400 mb-2">{chip.mekType} Mek</div>
                              <div className="text-lg font-bold text-yellow-400">×{chip.quantity}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Various Sub-tab */}
                  {inventorySubTab === 'various' && (
                    <div>
                      <h3 className="text-xl font-bold text-yellow-400 mb-4">Over Exposed Signature Items</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Mock various items */}
                        {[
                          { id: 'var1', name: 'Vintage Camera', description: 'From the golden age of photography', icon: '📷', rarity: 'legendary' },
                          { id: 'var2', name: 'Crystal Shard', description: 'Mysterious energy source', icon: '💎', rarity: 'epic' },
                          { id: 'var3', name: 'Ancient Scroll', description: 'Contains forgotten knowledge', icon: '📜', rarity: 'rare' },
                        ].map(item => (
                          <div
                            key={item.id}
                            className="relative border border-gray-600/20 overflow-hidden transition-all hover:shadow-lg"
                            style={{
                              background: 'rgba(255, 255, 255, 0.02)',
                              backdropFilter: 'blur(4px) contrast(1.1)',
                            }}
                          >
                            <div 
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background: `
                                  linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.01) 50%, transparent 70%),
                                  linear-gradient(-45deg, transparent 30%, rgba(255, 255, 255, 0.01) 50%, transparent 70%)`,
                              }}
                            />
                            <div 
                              className="absolute -inset-1 opacity-20"
                              style={{
                                background: `
                                  radial-gradient(ellipse at top left, rgba(250, 182, 23, 0.15) 0%, transparent 40%),
                                  radial-gradient(ellipse at bottom right, rgba(147, 51, 234, 0.1) 0%, transparent 40%),
                                  radial-gradient(circle at 30% 60%, rgba(255, 255, 255, 0.05) 0%, transparent 20%),
                                  radial-gradient(circle at 70% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 20%)`,
                                filter: 'blur(8px)',
                              }}
                            />
                            <div className="relative p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{item.icon}</span>
                                <div>
                                  <div className="font-medium text-gray-200">{item.name}</div>
                                  <div className={`text-xs ${
                                    item.rarity === 'legendary' ? 'text-orange-400' :
                                    item.rarity === 'epic' ? 'text-purple-400' :
                                    'text-blue-400'
                                  }`}>{item.rarity}</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-400">{item.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                        className="relative p-4 overflow-hidden hover:scale-105 transition-transform"
                        style={{
                          background: `
                            linear-gradient(135deg, 
                              rgba(255, 255, 255, 0.02) 0%, 
                              rgba(255, 255, 255, 0.05) 50%, 
                              rgba(255, 255, 255, 0.02) 100%)`,
                          backdropFilter: 'blur(6px)',
                          boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(250, 182, 23, 0.3)',
                        }}
                      >
                        {/* Smudge effects */}
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `
                              radial-gradient(circle at 20% 30%, rgba(250, 182, 23, 0.08) 0%, transparent 30%),
                              radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 25%),
                              radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 40%)`,
                            mixBlendMode: 'screen',
                          }}
                        />
                        {/* Pattern overlay */}
                        <div 
                          className="absolute inset-0 pointer-events-none opacity-30"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
    </div>
  );
}