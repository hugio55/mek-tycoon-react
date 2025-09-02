"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import BackgroundEffects from "@/components/BackgroundEffects";

// Generate more essence types with varying quantities (using deterministic values)
const generateEssenceData = () => {
  const essenceNames = [
    "Stone", "Disco", "Paul", "Cartoon", "Candy", "Tiles", "Moss", "Bullish",
    "Journalist", "Laser", "Flashbulb", "Accordion", "Turret", "Drill", "Security",
    "Bumblebee", "Camera", "Metal", "Crystal", "Flame", "Ice", "Nature", "Thunder",
    "Shadow", "Light", "Water", "Earth", "Wind", "Void", "Chaos", "Order",
    "Digital", "Analog", "Neon", "Retro", "Future", "Past", "Present", "Quantum",
    "Plasma", "Energy", "Matter", "Space", "Time", "Reality", "Dream", "Nightmare",
    "Joy", "Sorrow", "Rage", "Peace", "War", "Love", "Hate", "Fear",
    "Courage", "Wisdom", "Power", "Mind", "Soul", "Body", "Spirit", "Heart",
    "Gold", "Silver", "Bronze", "Platinum", "Diamond", "Ruby", "Emerald", "Sapphire",
    "Amethyst", "Topaz", "Opal", "Pearl", "Coral", "Jade", "Obsidian", "Quartz",
    "Marble", "Granite", "Sandstone", "Limestone", "Basalt", "Shale", "Coal", "Iron",
    "Copper", "Tin", "Lead", "Zinc", "Nickel", "Aluminum", "Titanium", "Mercury",
    "Uranium", "Plutonium", "Radium", "Helium", "Krypton", "Argon", "Xenon", "Radon"
  ];

  // Use deterministic values based on index
  return essenceNames.map((name, index) => ({
    name,
    quantity: Math.max(1, Math.floor(50 * Math.exp(-index / 20))), // Exponential decay for quantities
    rate: 0.5 - (index * 0.005),
    individualBuff: index % 3 === 0 ? 0.1 + (index % 10) * 0.02 : 0, // Every 3rd essence has a buff
    icon: ["🔮", "💎", "⚡", "🌟", "🔥", "❄️", "🌿", "💫", "✨", "🌊"][index % 10]
  }));
};

const getEssenceColor = (index: number) => {
  const colors = [
    "#8B8B8B", "#B452CD", "#4169E1", "#FF69B4", "#FF6B6B", 
    "#CD853F", "#90EE90", "#FFB347", "#D3D3D3", "#00CED1",
    "#F0E68C", "#DDA0DD", "#2F4F4F", "#CD853F", "#000080",
    "#FFD700", "#C0C0C0", "#CD7F32", "#E5E4E2", "#B9F2FF"
  ];
  return colors[index % colors.length];
};

export default function EssencePage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [viewCount, setViewCount] = useState<5 | 30 | 60 | 100>(30);
  const [showBuffsModal, setShowBuffsModal] = useState(false);
  const [essenceData] = useState(generateEssenceData());
  const [hoveredEssence, setHoveredEssence] = useState<string | null>(null);
  const [buffSearchQuery, setBuffSearchQuery] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  
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
  
  // Get user profile
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );
  
  // Sort and slice essence data
  const sortedEssences = [...essenceData].sort((a, b) => b.quantity - a.quantity);
  const displayedEssences = sortedEssences.slice(0, viewCount);
  
  // Calculate sizes based on quantity with more dramatic variation
  const maxQuantity = Math.max(...displayedEssences.map(e => e.quantity));
  const minQuantity = Math.min(...displayedEssences.map(e => e.quantity));
  const minSize = viewCount === 5 ? 30 : viewCount === 30 ? 15 : viewCount === 60 ? 12 : 10;
  const maxSize = viewCount === 5 ? 180 : viewCount === 30 ? 90 : viewCount === 60 ? 60 : 45;
  
  const getSquareSize = (quantity: number) => {
    // Use logarithmic scale for more dramatic differences
    const normalizedValue = (Math.log(quantity + 1) - Math.log(minQuantity + 1)) / 
                           (Math.log(maxQuantity + 1) - Math.log(minQuantity + 1));
    // Apply power curve for even more dramatic scaling
    const curvedValue = Math.pow(normalizedValue, 1.5);
    return minSize + (maxSize - minSize) * curvedValue;
  };
  
  // Calculate individual buffs
  const individualBuffs = essenceData.filter(e => e.individualBuff > 0);
  const totalIndividualBuff = individualBuffs.reduce((sum, e) => sum + e.individualBuff, 0);
  
  return (
    <div className="min-h-screen bg-black relative">
      <BackgroundEffects />
      
      <div className="relative z-10 text-white py-8">
        {/* Full Width Essence Rate Header */}
        <div className="w-full bg-gray-900/30 backdrop-blur-md border-y border-gray-800/50 mb-6">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-3 items-center">
              {/* Left Info */}
              <div className="text-left">
                <div className="text-sm text-gray-400 mb-1">Total Essence Types</div>
                <div className="text-2xl font-bold text-yellow-400">{essenceData.length}</div>
                <div className="text-xs text-gray-500 mt-1">Collected: {essenceData.filter(e => e.quantity > 0).length}</div>
              </div>
              
              {/* Center - Global Rate */}
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 font-orbitron">0.115</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider mt-1">Global Essence Rate / Day</div>
              </div>
              
              {/* Right Info - Individual Buffs */}
              <div className="text-right">
                <button 
                  onClick={() => setShowBuffsModal(true)}
                  className="group hover:scale-105 transition-transform inline-block"
                >
                  <div className="text-sm text-gray-400 mb-1 group-hover:text-yellow-400 transition-colors">
                    Individual Buffs Active
                  </div>
                  <div className="text-2xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                    +{totalIndividualBuff.toFixed(3)}/day
                  </div>
                  <div className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                    {individualBuffs.length} essence types buffed
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* View Toggle */}
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-400 mr-2">Show:</span>
            {[5, 30, 60, 100].map(count => (
              <button
                key={count}
                onClick={() => setViewCount(count as typeof viewCount)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  viewCount === count
                    ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/30'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 border border-gray-700'
                }`}
              >
                Top {count}
              </button>
            ))}
          </div>
        </div>
        
        {/* Dynamic Essence Grid */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gray-900/20 backdrop-blur-md border border-gray-800/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-yellow-400 mb-4 text-center font-orbitron">
              ESSENCE AT A GLANCE
            </h2>
            
            {/* Essence Squares Grid */}
            <div className="flex flex-wrap justify-center items-center gap-2 p-4">
              {displayedEssences.map((essence, index) => {
                const size = getSquareSize(essence.quantity);
                const color = getEssenceColor(index);
                const isHovered = hoveredEssence === essence.name;
                
                return (
                  <div
                    key={essence.name}
                    className="relative group transition-all hover:z-10"
                    onMouseEnter={() => setHoveredEssence(essence.name)}
                    onMouseLeave={() => setHoveredEssence(null)}
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                    }}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-3 whitespace-nowrap">
                          <div className="font-bold text-sm" style={{ color }}>
                            {essence.name}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Quantity: {essence.quantity}
                          </div>
                          <div className="text-xs text-gray-400">
                            Rate: {essence.rate.toFixed(3)}/day
                          </div>
                          {essence.individualBuff > 0 && (
                            <div className="text-xs text-green-400 mt-1">
                              +{essence.individualBuff.toFixed(3)}/day buff
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Essence Square */}
                    <div
                      className="w-full h-full rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-110 relative"
                      style={{
                        backgroundColor: color + '40',
                        border: `2px solid ${color}`,
                        boxShadow: isHovered 
                          ? `0 0 20px ${color}, inset 0 0 10px ${color}60`
                          : `0 0 10px ${color}40`,
                      }}
                    >
                      {size > 40 && (
                        <div className="text-white text-lg mb-1">{essence.icon}</div>
                      )}
                      <div className="text-white font-bold" style={{
                        fontSize: size > 50 ? '14px' : '10px'
                      }}>
                        {essence.quantity}
                      </div>
                      {size > 60 && (
                        <div className="text-xs text-gray-300 mt-1">
                          {essence.name.substring(0, 8)}
                        </div>
                      )}
                      
                      {/* Buff indicator */}
                      {essence.individualBuff > 0 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Summary Stats */}
            <div className="mt-6 pt-4 border-t border-gray-700/50 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-400">
                  {displayedEssences.reduce((sum, e) => sum + e.quantity, 0)}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Total Essence</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {(0.115 + totalIndividualBuff).toFixed(3)}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Combined Rate/Day</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {viewCount}/{essenceData.length}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Shown/Total</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Individual Essence Bars */}
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-gray-900/20 backdrop-blur-md border border-gray-800/50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-yellow-400 mb-4 text-center font-orbitron">
              ESSENCE DETAILS
            </h3>
            <div className="space-y-3">
              {displayedEssences.slice(0, 15).map((essence, index) => {
                const color = getEssenceColor(index);
                const percentage = (essence.quantity / 50) * 100; // Max 50 for bar display
                
                return (
                  <div key={essence.name} className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 p-4 rounded-lg transition-all hover:bg-gray-900/40">
                    <div className="flex items-center gap-4">
                      {/* Essence Icon/Image - Animated GIF */}
                      <div className="w-12 h-12 rounded-lg flex-shrink-0 relative overflow-hidden">
                        <img 
                          src={`/essence-images/bumb.gif?t=${Date.now() + index * 100}`} // Unique timestamp to force separate GIF instances with offset
                          alt={essence.name}
                          className="w-full h-full object-cover"
                          style={{
                            filter: `hue-rotate(${index * 30}deg) saturate(1.2)` // Vary color per essence
                          }}
                        />
                        {/* Buff indicator on icon */}
                        {essence.individualBuff > 0 && (
                          <div className="absolute -top-1 -right-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" 
                                 title="Speed Buffed" />
                          </div>
                        )}
                      </div>
                      
                      {/* Progress Section */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{essence.name}</span>
                            {essence.individualBuff > 0 && (
                              <span className="text-xs text-green-400 bg-green-400/20 px-1.5 py-0.5 rounded">
                                +{(essence.individualBuff * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {essence.rate.toFixed(3)}/day
                            {essence.individualBuff > 0 && (
                              <span className="text-green-400 ml-1">
                                (+{essence.individualBuff.toFixed(3)})
                              </span>
                            )}
                          </span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="relative h-6 bg-gray-900/50 rounded overflow-hidden border border-gray-700/30">
                          {/* Divider lines */}
                          <div className="absolute inset-0 flex">
                            {Array.from({ length: 10 }, (_, i) => (
                              <div
                                key={i}
                                className="border-r border-gray-700/20"
                                style={{ 
                                  width: '10%',
                                }}
                              />
                            ))}
                          </div>
                          
                          {/* Filled portion */}
                          <div
                            className="absolute inset-y-0 left-0 transition-all duration-500"
                            style={{
                              width: `${Math.min(100, percentage)}%`,
                              background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                              boxShadow: `inset 0 0 20px ${color}60, 0 0 10px ${color}40`
                            }}
                          />
                          
                          {/* Quantity display */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white font-bold text-sm" style={{
                              textShadow: '0 0 4px rgba(0,0,0,0.8)'
                            }}>
                              {essence.quantity} / 50
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {displayedEssences.length > 15 && (
              <div className="text-center mt-4">
                <button className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                  View All {displayedEssences.length} Essences →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Individual Buffs Modal - Industrial Yellow/Black Theme */}
      {showBuffsModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full max-h-[80vh] overflow-hidden" style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
            border: '2px solid #fab617',
            borderRadius: '12px',
            boxShadow: '0 0 30px rgba(250, 182, 23, 0.4), inset 0 0 20px rgba(250, 182, 23, 0.1)'
          }}>
            {/* Header with yellow accent */}
            <div className="p-6 border-b-2 border-yellow-400/30 bg-gradient-to-r from-black to-gray-900/50">
              <h3 className="text-2xl font-bold font-orbitron" style={{
                color: '#fab617',
                textShadow: '0 0 20px rgba(250, 182, 23, 0.6)',
                letterSpacing: '0.1em'
              }}>
                BUFFED ESSENCE TYPES
              </h3>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Active speed bonuses only</p>
              
              {/* Search Bar with Industrial Styling */}
              <div className="relative mt-4">
                <input
                  type="text"
                  value={buffSearchQuery}
                  onChange={(e) => setBuffSearchQuery(e.target.value)}
                  placeholder="Search buffed essences..."
                  className="w-full px-4 py-3 pr-10 bg-black/50 text-yellow-400 placeholder-gray-600 focus:outline-none transition-all"
                  style={{
                    border: '1px solid rgba(250, 182, 23, 0.3)',
                    borderRadius: '8px',
                    fontFamily: "'Consolas', 'Monaco', monospace",
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = '1px solid rgba(250, 182, 23, 0.8)';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(250, 182, 23, 0.3), inset 0 2px 4px rgba(0, 0, 0, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = '1px solid rgba(250, 182, 23, 0.3)';
                    e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.5)';
                  }}
                />
                {buffSearchQuery && (
                  <button
                    onClick={() => setBuffSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400/50 hover:text-yellow-400 transition-colors text-xl"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            {/* Content Area with Industrial Theme */}
            <div className="p-6 overflow-y-auto max-h-[45vh] bg-black/30">
              <div className="space-y-3">
                {(() => {
                  // Only search within buffed essences
                  const filteredBuffs = buffSearchQuery 
                    ? individualBuffs.filter(e => e.name.toLowerCase().includes(buffSearchQuery.toLowerCase()))
                    : individualBuffs;
                  
                  return filteredBuffs.length > 0 ? (
                    filteredBuffs.map((essence) => {
                      const essenceIndex = essenceData.findIndex(e => e.name === essence.name);
                      return (
                        <div 
                          key={essence.name} 
                          className="flex items-center justify-between p-4 transition-all hover:scale-[1.02]"
                          style={{
                            background: 'linear-gradient(90deg, rgba(250, 182, 23, 0.05) 0%, rgba(250, 182, 23, 0.02) 100%)',
                            border: '1px solid rgba(250, 182, 23, 0.2)',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.border = '1px solid rgba(250, 182, 23, 0.5)';
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(250, 182, 23, 0.2), 0 2px 4px rgba(0, 0, 0, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.border = '1px solid rgba(250, 182, 23, 0.2)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                              style={{ 
                                background: `linear-gradient(135deg, ${getEssenceColor(essenceIndex)}40, ${getEssenceColor(essenceIndex)}20)`,
                                border: `2px solid ${getEssenceColor(essenceIndex)}`,
                                boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.3)`
                              }}
                            >
                              {essence.icon}
                            </div>
                            <div className="font-bold text-yellow-400" style={{
                              fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
                              letterSpacing: '0.05em'
                            }}>
                              {essence.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-bold text-lg" style={{
                              textShadow: '0 0 10px rgba(74, 222, 128, 0.5)'
                            }}>
                              +{essence.individualBuff.toFixed(3)}/day
                            </div>
                            <div className="text-xs text-gray-500">
                              Total: {(essence.rate + essence.individualBuff).toFixed(3)}/day
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-yellow-400/50 text-lg mb-2">
                        {buffSearchQuery 
                          ? `No buffed essence matching "${buffSearchQuery}"` 
                          : "No Individual Buffs Active"}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {buffSearchQuery 
                          ? "Try a different search term" 
                          : "Upgrade your essence to activate speed bonuses"}
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {individualBuffs.length > 0 && !buffSearchQuery && (
                <div className="mt-6 p-4 rounded-lg" style={{
                  background: 'linear-gradient(135deg, rgba(250, 182, 23, 0.1) 0%, rgba(250, 182, 23, 0.05) 100%)',
                  border: '1px solid rgba(250, 182, 23, 0.3)'
                }}>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400/70 text-sm uppercase tracking-wider">Total Buff Amount:</span>
                    <span className="text-2xl font-bold text-green-400" style={{
                      textShadow: '0 0 15px rgba(74, 222, 128, 0.6)',
                      fontFamily: "'Orbitron', sans-serif"
                    }}>
                      +{totalIndividualBuff.toFixed(3)}/day
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer with Close Button */}
            <div className="p-6 border-t-2 border-yellow-400/30 bg-gradient-to-r from-black to-gray-900/50">
              <button
                onClick={() => {
                  setShowBuffsModal(false);
                  setBuffSearchQuery("");
                }}
                className="w-full px-6 py-3 font-bold text-black transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #fab617 0%, #ffd700 100%)',
                  borderRadius: '8px',
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: '0.1em',
                  boxShadow: '0 4px 15px rgba(250, 182, 23, 0.4)',
                  textTransform: 'uppercase'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(250, 182, 23, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(250, 182, 23, 0.4)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}