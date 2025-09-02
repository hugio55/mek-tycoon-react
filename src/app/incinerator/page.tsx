"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { variationsData } from "@/lib/variationsData";

// 5 essence types for the distribution graph
const essenceTypes = [
  { id: "stone", name: "Stone", color: "#8B8B8B", rarity: 1, image: "/variation-images/stone.png" },
  { id: "paul", name: "Paul", color: "#4169E1", rarity: 3, image: "/variation-images/paul.png" },
  { id: "cartoon", name: "Cartoon", color: "#FF69B4", rarity: 5, image: "/variation-images/cartoon.png" },
  { id: "moss", name: "Moss", color: "#90EE90", rarity: 7, image: "/variation-images/ring_green.png" },
  { id: "laser", name: "Laser", color: "#00CED1", rarity: 10, image: "/variation-images/neon_flamingo.png" },
];

interface VariationItem {
  id: string;
  name: string;
  category: 'heads' | 'bodies' | 'traits';
  quantity: number;
  xp: number;
}

export default function IncineratorPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [selectedItem, setSelectedItem] = useState<VariationItem | null>(null);
  const [isIncinerating, setIsIncinerating] = useState(false);
  const [biasScore, setBiasScore] = useState(150);
  const [resultEssence, setResultEssence] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'heads' | 'bodies' | 'traits'>('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
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
  
  // Mock inventory - in real app, this would come from the database
  const mockInventory: Record<string, number> = {
    "Taser": 3,
    "Log": 1,
    "Kevlar": 0,
    "Nuke": 2,
    "Classic": 1,
    "Lightning": 0,
    "Polished": 4,
    "Royal": 1,
    "Disco": 0,
    "Cream": 2,
    // Add more as needed
  };
  
  // Prepare all variations with inventory data
  const allVariations = useMemo(() => {
    const items: VariationItem[] = [];
    
    // Add heads
    variationsData.heads.forEach(head => {
      items.push({
        id: `head_${head.name}`,
        name: head.name,
        category: 'heads',
        quantity: mockInventory[head.name] || 0,
        xp: head.xp
      });
    });
    
    // Add bodies
    variationsData.bodies.forEach(body => {
      items.push({
        id: `body_${body.name}`,
        name: body.name,
        category: 'bodies',
        quantity: mockInventory[body.name] || 0,
        xp: body.xp
      });
    });
    
    // Add traits
    variationsData.traits.forEach(trait => {
      items.push({
        id: `trait_${trait.name}`,
        name: trait.name,
        category: 'traits',
        quantity: mockInventory[trait.name] || 0,
        xp: trait.xp
      });
    });
    
    return items;
  }, []);
  
  // Filter variations based on search and category
  const filteredVariations = useMemo(() => {
    return allVariations.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).slice(0, 10); // Limit dropdown to 10 items
  }, [allVariations, searchQuery, selectedCategory]);
  
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
    if (!selectedItem || selectedItem.quantity === 0) return;
    
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
      setSelectedItem(null);
      setSearchQuery("");
    }, 3000);
  };
  
  // Gold cost calculation
  const goldCost = selectedItem ? Math.floor(selectedItem.xp * 0.5) : 0;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
              {/* Search and Category Filter */}
              <div className="bg-black/40 backdrop-blur-md rounded-lg p-4 border border-yellow-500/20" ref={searchRef}>
                <h2 className="text-lg font-bold text-yellow-400 mb-4" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>Select Item</h2>
                
                {/* Category Tabs */}
                <div className="flex gap-2 mb-4">
                  {(['all', 'heads', 'bodies', 'traits'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded text-sm font-inter transition-all ${
                        selectedCategory === cat 
                          ? 'bg-yellow-500 text-black font-semibold' 
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
                
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search variations..."
                    className="w-full px-4 py-2 bg-black/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                  />
                  
                  {/* Autocomplete Dropdown */}
                  {showDropdown && searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-h-64 overflow-y-auto z-50">
                      {filteredVariations.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedItem(item);
                            setSearchQuery(item.name);
                            setShowDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors flex items-center justify-between ${
                            item.quantity === 0 ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Placeholder Image */}
                            <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                              <img 
                                src="/images/mek-150px/placeholder.png" 
                                alt={item.name}
                                className="w-8 h-8 object-contain opacity-50"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                            <div>
                              <span className={`font-medium ${item.quantity === 0 ? 'text-gray-500' : 'text-white'}`}>
                                {item.name}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                {item.category}
                              </span>
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${item.quantity > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>
                            ({item.quantity})
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Selected Item Display */}
                {selectedItem && (
                  <div className="mt-4 p-4 bg-black/40 rounded-lg border border-yellow-500/10">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                        <img 
                          src="/images/mek-150px/placeholder.png" 
                          alt={selectedItem.name}
                          className="w-14 h-14 object-contain opacity-60"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-yellow-400">{selectedItem.name}</h3>
                        <p className="text-sm text-gray-400">
                          {selectedItem.category} • Owned: {selectedItem.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
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
                  disabled={!selectedItem || selectedItem.quantity === 0 || isIncinerating}
                  className={`
                    w-full py-4 px-6 font-bold text-lg rounded-lg transition-all
                    ${selectedItem && selectedItem.quantity > 0 && !isIncinerating
                      ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg"
                      : "bg-gray-800 text-gray-600 cursor-not-allowed"
                    }
                  `}
                >
                  {isIncinerating ? "INCINERATING..." : selectedItem && selectedItem.quantity === 0 ? "NO ITEMS" : "INCINERATE"}
                </button>
                
                {/* Info Text */}
                {!selectedItem && (
                  <div className="mt-4 text-center text-gray-500 font-inter">
                    Search and select an item to see essence probabilities
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