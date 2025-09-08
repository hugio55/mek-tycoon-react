"use client";

import { useState } from "react";
import MekImage from "@/components/MekImage";
import EssenceChart, { type EssenceData } from "@/components/EssenceChart";
import Image from "next/image";

type Mek = {
  id: string;
  number: number;
  level: number;
  goldPerHour: number;
  traits?: string[];
  sourceKey?: string;
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


// Generate mock essence data with deterministic values
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
  const [selectedAvatar, setSelectedAvatar] = useState('aa1-aa1-cd1');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [offerModal, setOfferModal] = useState<OfferModal>({ type: null });
  const [activeTab, setActiveTab] = useState<'meks' | 'essence' | 'inventory' | 'frames'>('meks');
  const [inventorySubTab, setInventorySubTab] = useState<'universal_chips' | 'mek_chips' | 'various'>('universal_chips');
  const [mekSortBy, setMekSortBy] = useState<'level' | 'goldPerHour'>('level');
  const [prestigeLevel, setPrestigeLevel] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const meksPerPage = 20; // 5 columns x 4 rows
  
  // Generate 40 mock meks with deterministic data
  const generateMockMeks = () => {
    const meks = [];
    const traitOptions = ['acid', 'electric', 'fire', 'water', 'earth', 'wind', 'shadow', 'light', 'tech', 'nature'];
    
    // Real source keys that should work with the image system
    const sourceKeys = [
      'aa1-aa1-cd1', 'ab2-ab2-ce2', 'ac3-ac3-cf3', 'ad4-ad4-cg4',
      'ae5-ae5-ch5', 'af6-af6-ci6', 'ag7-ag7-cj7', 'ah8-ah8-ck8',
      'ai9-ai9-cl9', 'aj10-aj10-cm10', 'ak11-ak11-cn11', 'al12-al12-co12',
      'am13-am13-cp13', 'an14-an14-cq14', 'ao15-ao15-cr15', 'ap16-ap16-cs16'
    ];
    
    for (let i = 1; i <= 40; i++) {
      const numTraits = ((i * 7) % 3) + 1;
      const traits = [];
      for (let j = 0; j < numTraits; j++) {
        const traitIndex = (i * 3 + j * 5) % traitOptions.length;
        const trait = traitOptions[traitIndex];
        if (!traits.includes(trait)) {
          traits.push(trait);
        }
      }
      
      const sourceKey = sourceKeys[(i + 7) % sourceKeys.length];
      const mekNumber = 1500 + ((i * 23) % 1000);
      
      meks.push({
        id: `mek${i}`,
        number: mekNumber,
        level: ((i * 3) % 10) + 1,
        goldPerHour: ((i * 17) % 400) + 100,
        traits,
        sourceKey,
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
  
  // Filter and sort meks
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
  
  // Prestige styling
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

  // Render industrial style tooltip
  const renderTooltip = (mek: any) => {
    const baseContent = (
      <>
        <div className="text-center mb-3">
          <div className="text-yellow-400" style={{
            fontWeight: 'bold',
            fontSize: '18px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            MEK #{mek.number}
          </div>
          <div className="flex justify-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Level</span>
              <span className="text-white font-bold">{mek.level}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Gold/Hr</span>
              <span className="text-green-400 font-bold">{mek.goldPerHour}</span>
            </div>
          </div>
        </div>
        
        {/* Trait Bubbles */}
        <div className="flex justify-center gap-2 mb-3">
          {mek.traits?.slice(0, 3).map((trait: string, i: number) => (
            <div
              key={i}
              className="relative w-12 h-12 rounded-full overflow-hidden"
              style={{
                border: '2px solid rgba(250, 182, 23, 0.3)',
                background: 'linear-gradient(to bottom right, #1a1a1a, #000)'
              }}
            >
              <Image
                src="/variation-images/acid.jpg"
                alt={trait}
                width={48}
                height={48}
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-0 left-0 right-0 text-center py-0.5 bg-black" style={{
                fontSize: '8px',
                color: '#fab617',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                opacity: 0.7
              }}>
                {trait.slice(0, 4)}
              </div>
            </div>
          ))}
        </div>
        
        {/* Equipment Status */}
        <div className="flex justify-center gap-3 mb-3">
          {['head', 'body', 'accessory'].map((slot, idx) => {
            const hasItem = mek.equipped[slot as keyof typeof mek.equipped];
            return (
              <div key={idx} className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full ${
                  hasItem ? 'bg-yellow-400' : 'bg-gray-600'
                }`} style={{
                  boxShadow: hasItem ? '0 0 6px #fab617' : 'none'
                }} />
                <span className="text-gray-500 mt-1 uppercase" style={{ fontSize: '8px' }}>
                  {slot.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Click for more info */}
        <div className="text-center pt-2" style={{
          borderTop: '1px solid rgba(250, 182, 23, 0.2)'
        }}>
          <span className="text-xs transition-colors" style={{
            color: 'rgba(250, 182, 23, 0.8)'
          }}>
            Click for more info
          </span>
        </div>
      </>
    );

    // Industrial style tooltip
    return (
      <div className="relative bg-black border-2 border-yellow-500 p-4 backdrop-blur-md" style={{
        background: 'rgba(0, 0, 0, 0.95)',
        borderColor: 'rgba(250, 182, 23, 0.5)',
        boxShadow: '0 0 40px rgba(250, 182, 23, 0.2)',
        minWidth: '200px'
      }}>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 via-transparent to-yellow-500 pointer-events-none opacity-10" />
        <div className="relative z-10">{baseContent}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white overflow-hidden relative">
      <div className="relative p-5">
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Top Controls */}
          <div className="flex justify-between items-center mb-6">
            {/* View Toggle */}
            <div className="flex items-center gap-3 bg-gray-900 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2 bg-opacity-60">
              <span className="text-sm text-gray-400">View as:</span>
              <button
                onClick={() => setIsOwnProfile(true)}
                className={`px-3 py-1 rounded text-sm transition-all ${
                  isOwnProfile ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Own Profile
              </button>
              <button
                onClick={() => setIsOwnProfile(false)}
                className={`px-3 py-1 rounded text-sm transition-all ${
                  !isOwnProfile ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Other Player
              </button>
            </div>
            
            {/* Prestige Toggle */}
            <div className="flex items-center gap-2 bg-gray-900 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2 bg-opacity-60">
              <span className="text-sm text-gray-400">Prestige:</span>
              {[0, 1, 2, 3, 4, 5, 6, 7].map(level => (
                <button
                  key={level}
                  onClick={() => setPrestigeLevel(level)}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    prestigeLevel === level ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
              <div className="relative rounded-lg overflow-hidden group" style={{
                background: 'rgba(255, 255, 255, 0.005)',
                backdropFilter: 'blur(1px)',
                border: '1px solid rgba(255, 255, 255, 0.015)',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.2) inset',
              }}>
                {/* Avatar */}
                <div className="relative">
                  <div className="w-full aspect-square bg-gray-800 overflow-hidden">
                    <MekImage
                      src={selectedAvatar}
                      size={400}
                      alt="Profile Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                {/* Change Avatar */}
                {isOwnProfile && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setShowAvatarSelector(true)}
                      className="text-gray-500 hover:text-gray-400 transition-colors" style={{ fontSize: '10px' }}
                    >
                      Change Avatar
                    </button>
                  </div>
                )}
                
                {/* Username & Prestige */}
                <div className="text-center mb-4 px-6 pt-4">
                  <h1 className="text-3xl font-bold text-yellow-400 mb-3">{userData.username}</h1>
                  
                  {/* Prestige Level */}
                  <div className="inline-block relative">
                    <div className={`absolute inset-0 blur-lg bg-gradient-to-r ${prestigeStyle.border} ${prestigeLevel > 5 ? 'animate-pulse' : ''}`} 
                         style={{ opacity: prestigeStyle.intensity }}></div>
                    
                    <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 p-px rounded-md overflow-hidden bg-opacity-90">
                      {prestigeLevel > 3 && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${prestigeStyle.border} opacity-80`} 
                           style={{
                             backgroundSize: '200% 100%',
                             animation: prestigeLevel > 5 ? 'shimmer 2s linear infinite' : 'none'
                           }}>
                      </div>
                      )}
                      
                      <div className="relative bg-black px-4 py-1 rounded bg-opacity-90">
                        <div className="text-gray-400 uppercase tracking-widest" style={{ fontSize: '8px' }}>Prestige</div>
                        <div className={`text-lg font-bold bg-gradient-to-r ${prestigeLevel > 0 ? prestigeStyle.text : 'from-gray-300 to-gray-400'} bg-clip-text text-transparent`}>
                          {prestigeRoman}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-3">Joined {userData.joinDate}</div>
                </div>
                
                {/* Stats */}
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
                    <span className="text-gray-400">Meks Owned</span>
                    <span className="text-xl font-bold text-cyan-400">
                      {userData.meks.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content Tabs */}
            <div className="col-span-8">
              {/* Tab Navigation */}
              <div className="flex gap-0">
                <button
                  onClick={() => setActiveTab('meks')}
                  className={`px-6 py-3 font-bold transition-all ${
                    activeTab === 'meks'
                      ? 'bg-gray-900 border-t-2 border-l-2 border-r-2 border-yellow-500 text-yellow-400 relative z-10 bg-opacity-60'
                      : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-300 bg-opacity-30'
                  }`}
                >
                  Meks
                </button>
                <button
                  onClick={() => setActiveTab('essence')}
                  className={`px-6 py-3 font-bold transition-all ${
                    activeTab === 'essence'
                      ? 'bg-gray-900 border-t-2 border-l-2 border-r-2 border-yellow-500 text-yellow-400 relative z-10 bg-opacity-60'
                      : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-300 bg-opacity-30'
                  }`}
                >
                  Essence
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`px-6 py-3 font-bold transition-all ${
                    activeTab === 'inventory'
                      ? 'bg-gray-900 border-t-2 border-l-2 border-r-2 border-yellow-500 text-yellow-400 relative z-10 bg-opacity-60'
                      : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-300 bg-opacity-30'
                  }`}
                >
                  Inventory
                </button>
                <button
                  onClick={() => setActiveTab('frames')}
                  className={`px-6 py-3 font-bold transition-all ${
                    activeTab === 'frames'
                      ? 'bg-gray-900 border-t-2 border-l-2 border-r-2 border-yellow-500 text-yellow-400 relative z-10 bg-opacity-60'
                      : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-300 bg-opacity-30'
                  }`}
                >
                  Frames
                </button>
              </div>

              {/* Content Area */}
              <div className="relative border-2 border-yellow-500 overflow-hidden p-4 min-h-[600px] -mt-px" style={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(4px) contrast(1.1)',
                borderColor: 'rgba(250, 182, 23, 0.5)',
              }}>
                
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
                    </div>
                    
                    {/* Sort Options */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-yellow-400">Owned Meks</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMekSortBy('level')}
                          className={`px-3 py-1 text-xs rounded transition-all ${
                            mekSortBy === 'level'
                              ? 'bg-yellow-500 border-2 border-yellow-400 text-black font-bold shadow-lg'
                              : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 bg-opacity-50'
                          }`}
                        >
                          Sort by Level
                        </button>
                        <button
                          onClick={() => setMekSortBy('goldPerHour')}
                          className={`px-3 py-1 text-xs rounded transition-all ${
                            mekSortBy === 'goldPerHour'
                              ? 'bg-yellow-500 border-2 border-yellow-400 text-black font-bold shadow-lg'
                              : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 bg-opacity-50'
                          }`}
                        >
                          Sort by Gold/Hr
                        </button>
                      </div>
                    </div>
                    
                    {/* Mek Grid - Tighter spacing */}
                    <div className="grid grid-cols-5 gap-1">
                      {paginatedMeks.map(mek => (
                        <div
                          key={mek.id}
                          className="relative group cursor-pointer"
                          onClick={() => window.location.href = `/mek/${mek.id}`}
                        >
                          {/* Mek Frame */}
                          <div className="relative overflow-hidden bg-gray-900 border border-gray-700 bg-opacity-50">
                            <MekImage
                              src={mek.sourceKey}
                              size={200}
                              alt={`Mek #${mek.number}`}
                              className="w-full aspect-square transition-transform group-hover:scale-110"
                            />
                          </div>
                          
                          {/* Floating Tooltip */}
                          <div className="absolute left-1/2 bottom-full -translate-x-1/2 mb-3 z-[100] opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 pointer-events-none"
                               style={{ zIndex: 9999 }}>
                            {renderTooltip(mek)}
                            {/* Arrow pointing down */}
                            <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-px">
                              <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8" style={{
                                borderTopColor: 'rgba(250, 182, 23, 0.5)'
                              }}></div>
                              <div className="absolute left-1/2 -translate-x-1/2 -top-[7px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black"></div>
                            </div>
                          </div>
                        </div>
                      ))}
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
                            const pageNum = idx + 1;
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
                    <div className="flex gap-1 bg-black p-1 rounded-lg backdrop-blur-sm bg-opacity-40">
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
                              ? 'bg-yellow-500 border border-yellow-500 text-black bg-opacity-20'
                              : 'text-gray-400 hover:text-gray-200 hover:bg-white hover:bg-opacity-5'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Inventory Content */}
                    {inventorySubTab === 'universal_chips' && (
                      <div>
                        <h3 className="text-xl font-bold text-yellow-400 mb-4">Universal Chips</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { id: 'chip1', name: 'Common Power Chip', rarity: 'common', quantity: 12, icon: '💾' },
                            { id: 'chip2', name: 'Rare Power Chip', rarity: 'rare', quantity: 3, icon: '💎' },
                            { id: 'chip3', name: 'Epic Memory Core', rarity: 'epic', quantity: 1, icon: '🧠' },
                          ].map(chip => (
                            <div key={chip.id} className="relative overflow-hidden transition-all hover:shadow-lg" style={{
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.02) 100%)',
                              backdropFilter: 'blur(6px)',
                              border: '1px solid rgba(250, 182, 23, 0.3)',
                            }}>
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
                  </div>
                )}
                
                {/* Frames Tab */}
                {activeTab === 'frames' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4">Frame Collection</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {userData.frames.map(frame => (
                        <div key={frame.id} className="relative p-4 overflow-hidden hover:scale-105 transition-transform" style={{
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.02) 100%)',
                          backdropFilter: 'blur(6px)',
                          border: '1px solid rgba(250, 182, 23, 0.3)',
                        }}>
                          <div className="relative z-10 text-center">
                            <div className="text-sm text-gray-400">Frame</div>
                            <div className="text-lg font-bold text-yellow-400">#{frame.number}</div>
                            <div className="text-xs font-medium text-gray-300 mt-1">{frame.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{frame.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}