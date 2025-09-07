"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

// 5 essence types for the distribution graph
const essenceTypes = [
  { id: "stone", name: "Stone", color: "#8B8B8B", rarity: 1, image: "/variation-images/stone.png" },
  { id: "paul", name: "Paul", color: "#4169E1", rarity: 3, image: "/variation-images/paul.png" },
  { id: "cartoon", name: "Cartoon", color: "#FF69B4", rarity: 5, image: "/variation-images/cartoon.png" },
  { id: "moss", name: "Moss", color: "#90EE90", rarity: 7, image: "/variation-images/ring_green.png" },
  { id: "laser", name: "Laser", color: "#00CED1", rarity: 10, image: "/variation-images/neon_flamingo.png" },
];

interface ChipItem {
  id: string;
  name: string;
  category: 'uni' | 'mek'; // uni-chips or mek-specific chips
  slot?: 'head' | 'body' | 'trait'; // For mek-specific chips
  quantity: number;
  power: number; // Similar to xp, affects bias
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image?: string;
}

export default function IncineratorPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [selectedChip, setSelectedChip] = useState<ChipItem | null>(null);
  const [isIncinerating, setIsIncinerating] = useState(false);
  const [biasScore, setBiasScore] = useState(150);
  const [resultEssence, setResultEssence] = useState<string | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryTab, setInventoryTab] = useState<'uni' | 'mek'>('uni');
  
  // Generate stars for background
  const stars = useMemo(() => [...Array(30)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.8 + 0.2,
  })), []);
  
  const fineStars = useMemo(() => [...Array(50)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
  })), []);
  
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
  
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );
  
  // Mock chip inventory - in real app, this would come from the database
  const mockChipInventory: ChipItem[] = useMemo(() => [
    // Uni-chips (can be used in any slot)
    { id: "uni_power_1", name: "Power Chip", category: 'uni', quantity: 5, power: 50, rarity: 'common' },
    { id: "uni_speed_1", name: "Speed Chip", category: 'uni', quantity: 3, power: 75, rarity: 'common' },
    { id: "uni_defense_1", name: "Defense Chip", category: 'uni', quantity: 2, power: 100, rarity: 'rare' },
    { id: "uni_quantum_1", name: "Quantum Chip", category: 'uni', quantity: 1, power: 200, rarity: 'epic' },
    { id: "uni_neural_1", name: "Neural Chip", category: 'uni', quantity: 1, power: 300, rarity: 'legendary' },
    { id: "uni_energy_1", name: "Energy Chip", category: 'uni', quantity: 8, power: 40, rarity: 'common' },
    { id: "uni_boost_1", name: "Boost Chip", category: 'uni', quantity: 4, power: 60, rarity: 'common' },
    { id: "uni_mega_1", name: "Mega Chip", category: 'uni', quantity: 0, power: 500, rarity: 'legendary' },
    
    // Mek-specific chips (trait slot only)
    { id: "mek_laser_1", name: "Laser Trait Chip", category: 'mek', slot: 'trait', quantity: 3, power: 150, rarity: 'rare' },
    { id: "mek_flame_1", name: "Flame Trait Chip", category: 'mek', slot: 'trait', quantity: 2, power: 175, rarity: 'rare' },
    { id: "mek_ice_1", name: "Ice Trait Chip", category: 'mek', slot: 'trait', quantity: 1, power: 225, rarity: 'epic' },
    { id: "mek_thunder_1", name: "Thunder Trait Chip", category: 'mek', slot: 'trait', quantity: 1, power: 250, rarity: 'epic' },
    { id: "mek_poison_1", name: "Poison Trait Chip", category: 'mek', slot: 'trait', quantity: 4, power: 125, rarity: 'rare' },
    { id: "mek_holy_1", name: "Holy Trait Chip", category: 'mek', slot: 'trait', quantity: 0, power: 400, rarity: 'legendary' },
    { id: "mek_dark_1", name: "Dark Trait Chip", category: 'mek', slot: 'trait', quantity: 1, power: 350, rarity: 'legendary' },
  ], []);
  
  // Filter chips based on selected tab
  const filteredChips = useMemo(() => {
    return mockChipInventory.filter(chip => chip.category === inventoryTab);
  }, [mockChipInventory, inventoryTab]);
  
  // Calculate essence distribution probabilities using bell curve
  const calculateBellCurvePosition = (bias: number): number => {
    if (bias <= 0) return 0;
    
    // Map 0-1000 bias to 0-4 position (5 essences indexed 0-4)
    const maxPosition = 4;
    const minPosition = 0;
    const maxBias = 1000;
    
    // Use square root for non-linear progression
    const sqrtProgress = Math.sqrt(bias / maxBias);
    const bellPosition = minPosition + (maxPosition - minPosition) * sqrtProgress;
    
    return bellPosition;
  };
  
  const calculateProbabilities = () => {
    const sigma = 0.8; // Tighter distribution for 5 items
    const bellCenter = calculateBellCurvePosition(biasScore);
    
    const probs = essenceTypes.map((essence, index) => {
      const distance = index - bellCenter;
      const prob = Math.exp(-0.5 * Math.pow(distance / sigma, 2));
      return prob;
    });
    
    // Normalize to percentages
    const total = probs.reduce((a, b) => a + b, 0);
    return probs.map(p => (p / total) * 100);
  };
  
  const percentageProbs = calculateProbabilities();
  
  // Calculate bar heights for visual display
  const maxBarHeight = 120; // Maximum bar height in pixels
  const barHeights = percentageProbs.map(prob => {
    // Scale based on the highest probability
    const maxProb = Math.max(...percentageProbs);
    return Math.max(10, (prob / maxProb) * maxBarHeight); // Min 10px for visibility
  });
  
  const handleIncinerate = async () => {
    if (!selectedChip || selectedChip.quantity === 0) return;
    
    setIsIncinerating(true);
    
    // Simulate incineration animation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Determine result based on probabilities
    const random = Math.random() * 100;
    let accumulated = 0;
    let selectedEssence = essenceTypes[0].id;
    
    for (let i = 0; i < percentageProbs.length; i++) {
      accumulated += percentageProbs[i];
      if (random <= accumulated) {
        selectedEssence = essenceTypes[i].id;
        break;
      }
    }
    
    setIsIncinerating(false);
    setResultEssence(selectedEssence);
    
    // Clear result after showing
    setTimeout(() => {
      setResultEssence(null);
      setSelectedChip(null);
    }, 3000);
  };
  
  // Gold cost calculation
  const goldCost = selectedChip ? Math.floor(selectedChip.power * 2) : 0;
  
  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'common': return 'text-gray-400 border-gray-600';
      case 'rare': return 'text-blue-400 border-blue-600';
      case 'epic': return 'text-purple-400 border-purple-600';
      case 'legendary': return 'text-yellow-400 border-yellow-600';
      default: return 'text-gray-400 border-gray-600';
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Yellow gradient orbs */}
        <div 
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 10% 20%, rgba(250, 182, 23, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 90% 80%, rgba(250, 182, 23, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(250, 182, 23, 0.05) 0%, transparent 70%)
            `
          }}
        />
        
        {/* Fine stars */}
        {fineStars.map((star) => (
          <div
            key={`fine-${star.id}`}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: '1px',
              height: '1px',
              opacity: 0.6,
            }}
          />
        ))}
        
        {/* Stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 p-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 tracking-wider uppercase mb-2">
              INCINERATOR
            </h1>
            <p className="text-gray-400 font-inter">
              Destroy items to extract valuable essence
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Item Selection */}
            <div className="space-y-4">
              {/* Central Selection Box */}
              <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-yellow-500/20">
                <h2 className="text-lg font-bold text-yellow-400 mb-4" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>Select Chip to Burn</h2>
                
                {/* Big Selection Button/Slot */}
                <button
                  onClick={() => setShowInventoryModal(true)}
                  className="w-full aspect-square max-w-[250px] mx-auto bg-black/60 border-2 border-dashed border-gray-600 rounded-lg hover:border-yellow-500/50 transition-all flex flex-col items-center justify-center gap-4 group"
                >
                  {selectedChip ? (
                    // Show selected chip
                    <>
                      <div className={`w-20 h-20 rounded-lg flex items-center justify-center border-2 ${getRarityColor(selectedChip.rarity)}`}>
                        <span className="text-3xl">💾</span>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold ${getRarityColor(selectedChip.rarity).split(' ')[0]}`}>
                          {selectedChip.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {selectedChip.category === 'uni' ? 'Universal' : 'Mek-Specific'}
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          Owned: {selectedChip.quantity}
                        </div>
                      </div>
                    </>
                  ) : (
                    // Empty state
                    <>
                      <div className="text-6xl text-gray-600 group-hover:text-gray-500 transition-colors">
                        +
                      </div>
                      <div className="text-gray-500 group-hover:text-gray-400 transition-colors">
                        Click to Select Chip
                      </div>
                    </>
                  )}
                </button>
                
                {selectedChip && (
                  <button
                    onClick={() => setSelectedChip(null)}
                    className="mt-4 w-full py-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
              
              {/* Bias Control */}
              <div className="bg-black/40 backdrop-blur-md rounded-lg p-4 border border-yellow-500/20">
                <h3 className="text-sm font-inter text-gray-400 uppercase tracking-wider mb-3">
                  Rarity Bias
                </h3>
                <div className="space-y-3">
                  <div 
                    className="text-yellow-400 text-center"
                    style={{ 
                      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                      fontSize: '48px',
                      fontWeight: 200,
                      letterSpacing: '1px',
                      lineHeight: '1',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {biasScore}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={biasScore}
                    onChange={(e) => setBiasScore(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #8B8B8B 0%, #4169E1 25%, #FF69B4 50%, #90EE90 75%, #00CED1 100%)`
                    }}
                  />
                  <div className="text-xs text-gray-500 text-center">
                    Higher bias = rarer essence
                  </div>
                </div>
              </div>
              
              {/* Cost Display */}
              <div className="bg-black/40 backdrop-blur-md rounded-lg p-4 border border-yellow-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400 font-inter">Incineration Cost</span>
                  <span className="text-2xl font-bold text-yellow-400" style={{ fontFamily: "'Consolas', 'Monaco', monospace" }}>
                    {goldCost.toLocaleString()} G
                  </span>
                </div>
              </div>
            </div>
            
            {/* Right Panel - Essence Distribution */}
            <div className="lg:col-span-2">
              <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-yellow-500/20">
                <h2 className="text-lg font-bold text-yellow-400 mb-6" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
                  Essence Distribution
                </h2>
                
                {/* Distribution Graph */}
                <div className="relative h-72 bg-gradient-to-br from-black/60 to-black/40 rounded-lg p-4 mb-6">
                  {isIncinerating && (
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-600/30 via-red-600/20 to-transparent animate-pulse rounded-lg" />
                  )}
                  
                  {resultEssence && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-green-400 font-bold text-lg mb-2">
                          Essence Extracted!
                        </div>
                        <div className="text-3xl font-bold" style={{ 
                          color: essenceTypes.find(e => e.id === resultEssence)?.color,
                          fontFamily: "'Consolas', 'Monaco', monospace"
                        }}>
                          {essenceTypes.find(e => e.id === resultEssence)?.name}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!isIncinerating && !resultEssence && (
                    <div className="flex items-end justify-center h-full gap-4 px-8 pb-16">
                      {essenceTypes.map((essence, index) => {
                        const height = barHeights[index];
                        const percentage = percentageProbs[index];
                        
                        return (
                          <div key={essence.id} className="flex-1 flex flex-col items-center justify-end relative">
                            <div className="text-xs text-gray-400 mb-1 opacity-80">
                              {percentage.toFixed(1)}%
                            </div>
                            <div 
                              className="w-full transition-all duration-300 rounded-t hover:brightness-125"
                              style={{
                                height: `${height}px`,
                                minHeight: '10px',
                                background: `linear-gradient(to top, ${essence.color}88, ${essence.color})`,
                                boxShadow: `0 0 8px ${essence.color}55`,
                              }}
                            />
                            <div className="mt-2 text-center absolute -bottom-14">
                              <img 
                                src={essence.image}
                                alt={essence.name}
                                className="w-10 h-10 mx-auto mb-1 object-contain"
                                style={{ filter: `drop-shadow(0 0 4px ${essence.color}88)` }}
                              />
                              <div className="text-xs font-semibold" style={{ color: essence.color }}>
                                {essence.name}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Incinerate Button */}
                <button
                  onClick={handleIncinerate}
                  disabled={!selectedChip || selectedChip.quantity === 0 || isIncinerating}
                  className={`
                    w-full py-4 px-6 font-bold text-lg rounded-lg transition-all
                    ${selectedChip && selectedChip.quantity > 0 && !isIncinerating
                      ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg"
                      : "bg-gray-800 text-gray-600 cursor-not-allowed"
                    }
                  `}
                >
                  {isIncinerating ? "INCINERATING..." : selectedChip && selectedChip.quantity === 0 ? "NO CHIPS" : "INCINERATE"}
                </button>
                
                {/* Info Text */}
                {!selectedChip && (
                  <div className="mt-4 text-center text-gray-500 font-inter">
                    Select a chip to see essence probabilities
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chip Inventory Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg border border-yellow-500/30 max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-yellow-400">Select Chip to Incinerate</h2>
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="text-gray-400 hover:text-white transition-colors text-2xl"
                >
                  ×
                </button>
              </div>
              
              {/* Tab Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setInventoryTab('uni')}
                  className={`px-4 py-2 rounded font-medium transition-all ${
                    inventoryTab === 'uni'
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Uni-Chips
                </button>
                <button
                  onClick={() => setInventoryTab('mek')}
                  className={`px-4 py-2 rounded font-medium transition-all ${
                    inventoryTab === 'mek'
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Mek Chips
                </button>
              </div>
            </div>
            
            {/* Chip Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredChips.map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => {
                      if (chip.quantity > 0) {
                        setSelectedChip(chip);
                        setShowInventoryModal(false);
                        // Update bias based on chip power
                        setBiasScore(Math.min(1000, chip.power * 3));
                      }
                    }}
                    disabled={chip.quantity === 0}
                    className={`p-3 rounded-lg border transition-all ${
                      chip.quantity === 0
                        ? 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'
                        : 'bg-black/40 hover:bg-black/60 cursor-pointer'
                    } ${getRarityColor(chip.rarity).split(' ')[1]}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-2xl">💾</div>
                      <div className={`text-sm font-medium ${getRarityColor(chip.rarity).split(' ')[0]}`}>
                        {chip.name}
                      </div>
                      {chip.category === 'mek' && chip.slot && (
                        <div className="text-xs text-gray-500">
                          {chip.slot} slot
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        Power: {chip.power}
                      </div>
                      <div className={`text-sm font-bold ${
                        chip.quantity > 0 ? 'text-yellow-400' : 'text-gray-600'
                      }`}>
                        x{chip.quantity}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {filteredChips.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No chips in this category
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}