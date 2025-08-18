"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";

export default function ProfilePage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [selectedMek, setSelectedMek] = useState<any>(null);
  const [showMeksList, setShowMeksList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
  useEffect(() => {
    const initUser = async () => {
      const user = await getOrCreateUser({ 
        walletAddress: "demo_wallet_123" 
      });
      if (user) {
        setUserId(user._id as Id<"users">);
      }
    };
    initUser();
  }, [getOrCreateUser]);
  
  // Mock data for demonstration
  const mockMek = {
    id: "1234",
    name: "Mek #1234",
    level: 5,
    maxLevel: 10,
    xp: 2450,
    xpToNext: 3000,
    goldRate: 15.5,
    isActive: true,
    equipment: {
      head: { name: "Bark Head", rank: "C", bonus: 2.5, equipped: true },
      body: { name: "Cartoon Body", rank: "B", bonus: 3.8, equipped: true },
      trait: { name: "Empty", rank: null, bonus: 0, equipped: false }
    },
    buffs: [
      "+3.5 gold per hour",
      "+5 Focus",
      "No Auction house fee",
      "+1 Employee slot"
    ],
    nextLevelRewards: [
      "+2.0 base gold/hr bonus",
      "+10 Focus",
      "+1 hour max cap time"
    ]
  };
  
  const myMeks = [
    { id: "1234", name: "Mek #1234", level: 5, goldRate: 15.5, active: true },
    { id: "2468", name: "Mek #2468", level: 3, goldRate: 8.2, active: false },
    { id: "3691", name: "Mek #3691", level: 7, goldRate: 22.1, active: true },
  ];
  
  const filteredMeks = myMeks.filter(mek => 
    mek.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mek.id.includes(searchQuery)
  );
  
  if (showMeksList) {
    return (
      <div className="text-white py-8">
        <div className="mb-6">
          <button
            onClick={() => setShowMeksList(false)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors mb-4"
          >
            ← Back to Profile
          </button>
          <h1 className="text-4xl font-bold text-yellow-400">
            👤 Your Meks Collection
          </h1>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-yellow-400">
              🤖 Your Meks ({filteredMeks.length})
            </h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your meks..."
              className="px-4 py-2 bg-gray-900 border-2 border-yellow-500 rounded-lg text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none max-w-xs"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMeks.map(mek => (
            <div
              key={mek.id}
              onClick={() => {
                setSelectedMek(mockMek);
                setShowMeksList(false);
              }}
              className="bg-gray-800/50 border-2 border-gray-700 hover:border-yellow-500 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg hover:shadow-yellow-500/20"
            >
              <div className="text-center mb-4">
                <div className="text-5xl mb-3">🤖</div>
                <h3 className="text-xl font-bold text-yellow-400">{mek.name}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Level:</span>
                  <span className="text-white">{mek.level}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gold Rate:</span>
                  <span className="text-yellow-400">{mek.goldRate}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={mek.active ? "text-green-400" : "text-gray-500"}>
                    {mek.active ? "🟢 Active" : "⚫ Inactive"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (selectedMek) {
    return (
      <div className="text-white py-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8">
          🤖 {selectedMek.name} Profile
        </h1>
        
        {/* Mek Overview */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="text-7xl">🤖</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-yellow-400">{selectedMek.name}</h2>
              <div className="text-gray-400 mt-1">Level {selectedMek.level} / {selectedMek.maxLevel}</div>
              <div className="text-gray-400 text-sm">Owner: You</div>
            </div>
            <button className={`px-6 py-3 font-bold rounded-lg transition-all ${
              selectedMek.isActive 
                ? "bg-green-500 hover:bg-green-400 text-black" 
                : "bg-gray-600 hover:bg-gray-500 text-white"
            }`}>
              {selectedMek.isActive ? "🟢 Active" : "⚫ Inactive"}
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{selectedMek.goldRate}/hr</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Gold Rate</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{selectedMek.xp}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Total XP</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{selectedMek.xpToNext - selectedMek.xp}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">XP to Level {selectedMek.level + 1}</div>
            </div>
          </div>
        </div>
        
        {/* Equipment Slots */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">⚙️ Equipment Slots</h3>
          
          {Object.entries(selectedMek.equipment).map(([slot, item]: [string, any]) => (
            <div key={slot} className={`flex items-center gap-4 p-4 mb-3 rounded-lg border-l-4 ${
              item.equipped ? "bg-gray-900/50 border-yellow-500" : "bg-gray-900/30 border-gray-600"
            }`}>
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-xs font-bold ${
                item.equipped ? "bg-gray-700" : "bg-gray-800"
              }`}>
                {item.equipped ? item.name.split(' ')[0].toUpperCase() : "EMPTY"}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-yellow-400 capitalize">{slot} Slot</div>
                <div className="text-sm text-gray-400">
                  {item.equipped 
                    ? `${item.name} (${item.rank}-Rank) | +${item.bonus} gold/hr`
                    : "Empty | No bonus"
                  }
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm mb-2 ${item.equipped ? "text-green-400" : "text-red-400"}`}>
                  {item.equipped ? "✓ Equipped" : "Empty"}
                </div>
                <button className="px-4 py-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded text-sm transition-colors">
                  {item.equipped ? "Unequip" : "Equip"}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Current Buffs */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">
            🎆 Current Buffs (Level {selectedMek.level})
          </h3>
          <div className="bg-gray-900/50 rounded-lg p-5">
            <div className="space-y-2">
              {selectedMek.buffs.map((buff: string, index: number) => (
                <div key={index} className="text-yellow-400">• {buff}</div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Level Progression */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">📈 Level Progression</h3>
          
          <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden mb-8">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 to-yellow-400"
              style={{ width: `${(selectedMek.xp / selectedMek.xpToNext) * 100}%` }}
            />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold">
              Lvl {selectedMek.level}
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold">
              Lvl {selectedMek.level + 1}
            </div>
          </div>
          
          <div className="text-center text-gray-300 mb-6">
            {selectedMek.xp} / {selectedMek.xpToNext} XP (Level {selectedMek.level + 1})
          </div>
          
          <div>
            <h4 className="text-yellow-400 font-semibold mb-3">Next Level Unlocks:</h4>
            <ul className="space-y-1 text-gray-300 ml-5">
              {selectedMek.nextLevelRewards.map((reward: string, index: number) => (
                <li key={index}>• {reward}</li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Mentorship Requirements */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">🎓 Mentorship Requirements</h3>
          <p className="text-gray-300 mb-4">
            Reach Level 10 to become a mentor and earn gold from other players!
          </p>
          
          {/* Light Bulb Progress Indicator */}
          <div className="flex justify-center items-center gap-3 mb-4">
            {[...Array(10)].map((_, index) => {
              const isLit = index < selectedMek.level;
              return (
                <div
                  key={index}
                  className="relative"
                  style={{
                    animation: isLit ? `bulbPulse ${2 + index * 0.1}s ease-in-out infinite` : 'none',
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  {/* Light bulb container */}
                  <div
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-500 ${
                      isLit 
                        ? 'border-yellow-400 bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg' 
                        : 'border-gray-600 bg-gray-800'
                    }`}
                    style={{
                      boxShadow: isLit 
                        ? '0 0 20px rgba(250, 182, 23, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.3)' 
                        : 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    {/* Glass shine effect */}
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: isLit 
                          ? 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6) 0%, transparent 50%)' 
                          : 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                      }}
                    />
                    
                    {/* Inner filament */}
                    <div 
                      className="absolute inset-2 rounded-full"
                      style={{
                        background: isLit 
                          ? 'radial-gradient(circle, rgba(255, 255, 200, 0.8) 0%, transparent 70%)' 
                          : 'none',
                      }}
                    />
                  </div>
                  
                  {/* Bulb base */}
                  <div 
                    className={`w-4 h-2 mx-auto -mt-1 rounded-b transition-colors ${
                      isLit ? 'bg-yellow-600' : 'bg-gray-700'
                    }`}
                    style={{
                      borderLeft: '1px solid rgba(0, 0, 0, 0.3)',
                      borderRight: '1px solid rgba(0, 0, 0, 0.3)',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  
                  {/* Level number below bulb */}
                  <div className={`text-xs text-center mt-1 ${isLit ? 'text-yellow-400' : 'text-gray-600'}`}>
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-center text-gray-400">
            Level {selectedMek.level} / 10 Required
          </div>
          
          {/* CSS for pulsing animation */}
          <style jsx>{`
            @keyframes bulbPulse {
              0%, 100% {
                transform: scale(1);
                filter: brightness(1);
              }
              50% {
                transform: scale(1.05);
                filter: brightness(1.2);
              }
            }
          `}</style>
        </div>
        
        <div className="mt-6">
          <button
            onClick={() => setSelectedMek(null)}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            ← Back to Profile
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-white py-8">
      <h1 className="text-4xl font-bold text-yellow-400 mb-8">
        🤖 Mek Profile
      </h1>
      
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
        <div className="flex justify-center gap-12">
          <div
            onClick={() => setShowMeksList(true)}
            className="group cursor-pointer text-center p-8 rounded-lg hover:bg-gray-700/50 transition-all"
          >
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">
              👤
            </div>
            <div className="text-xl font-semibold text-yellow-400">Your Meks</div>
          </div>
          
          <Link
            href="/search"
            className="group cursor-pointer text-center p-8 rounded-lg hover:bg-gray-700/50 transition-all"
          >
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">
              🔍
            </div>
            <div className="text-xl font-semibold text-yellow-400">Search All Meks</div>
          </Link>
        </div>
      </div>
    </div>
  );
}