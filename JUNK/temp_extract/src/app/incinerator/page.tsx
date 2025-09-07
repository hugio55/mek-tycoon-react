"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

const essenceTypes = [
  { id: "stone", name: "Stone", color: "#8B8B8B", rarity: 1 },
  { id: "disco", name: "Disco", color: "#B452CD", rarity: 2 },
  { id: "paul", name: "Paul", color: "#4169E1", rarity: 3 },
  { id: "cartoon", name: "Cartoon", color: "#FF69B4", rarity: 4 },
  { id: "candy", name: "Candy", color: "#FF6B6B", rarity: 5 },
  { id: "tiles", name: "Tiles", color: "#CD853F", rarity: 6 },
  { id: "moss", name: "Moss", color: "#90EE90", rarity: 7 },
  { id: "bullish", name: "Bullish", color: "#FFB347", rarity: 8 },
  { id: "journalist", name: "Journalist", color: "#D3D3D3", rarity: 9 },
  { id: "laser", name: "Laser", color: "#00CED1", rarity: 10 },
  { id: "flashbulb", name: "Flashbulb", color: "#F0E68C", rarity: 11 },
  { id: "accordion", name: "Accordion", color: "#DDA0DD", rarity: 12 },
  { id: "turret", name: "Turret", color: "#4682B4", rarity: 13 },
  { id: "drill", name: "Drill", color: "#8B4513", rarity: 14 },
  { id: "security", name: "Security", color: "#DC143C", rarity: 15 }
];

const mockItems = [
  { 
    id: "1", 
    name: "Rusty Gear", 
    quantity: 12,
    essencePool: ["stone", "disco", "paul", "cartoon", "candy"] 
  },
  { 
    id: "2", 
    name: "Broken Circuit", 
    quantity: 8,
    essencePool: ["disco", "paul", "cartoon", "candy", "tiles", "moss"] 
  },
  { 
    id: "3", 
    name: "Energy Cell", 
    quantity: 5,
    essencePool: ["candy", "tiles", "moss", "bullish", "journalist", "laser"] 
  },
  { 
    id: "4", 
    name: "Power Core", 
    quantity: 2,
    essencePool: ["moss", "bullish", "journalist", "laser", "flashbulb", "accordion", "turret"] 
  },
  { 
    id: "5", 
    name: "Quantum Drive", 
    quantity: 1,
    essencePool: ["journalist", "laser", "flashbulb", "accordion", "turret", "drill", "security"] 
  }
];

export default function IncineratorPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [selectedItem, setSelectedItem] = useState<typeof mockItems[0] | null>(null);
  const [isIncinerating, setIsIncinerating] = useState(false);
  const [biasScore, setBiasScore] = useState(50);
  const [resultEssence, setResultEssence] = useState<string | null>(null);
  
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
  
  const calculateProbabilities = (essencePool: string[]) => {
    const mean = biasScore / 100 * (essencePool.length - 1);
    const stdDev = essencePool.length / 4;
    
    return essencePool.map((essenceId, index) => {
      const x = index;
      const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
      const probability = Math.exp(exponent) / (stdDev * Math.sqrt(2 * Math.PI));
      return {
        essenceId,
        probability: probability * 100,
        normalizedProb: 0
      };
    });
  };
  
  const getProbabilityData = () => {
    if (!selectedItem) return [];
    
    const probs = calculateProbabilities(selectedItem.essencePool);
    const maxProb = Math.max(...probs.map(p => p.probability));
    
    return probs.map(p => ({
      ...p,
      normalizedProb: (p.probability / maxProb) * 100
    }));
  };
  
  const handleIncinerate = async () => {
    if (!selectedItem) return;
    
    setIsIncinerating(true);
    
    const probData = getProbabilityData();
    const totalProb = probData.reduce((sum, p) => sum + p.probability, 0);
    let random = Math.random() * totalProb;
    
    let selectedEssence = probData[0].essenceId;
    for (const prob of probData) {
      random -= prob.probability;
      if (random <= 0) {
        selectedEssence = prob.essenceId;
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsIncinerating(false);
    setResultEssence(selectedEssence);
    
    setTimeout(() => {
      setResultEssence(null);
      setSelectedItem(null);
    }, 3000);
  };
  
  const probData = getProbabilityData();
  
  return (
    <div className="text-white py-8">
      <h1 className="text-3xl font-bold text-yellow-400 mb-2 text-center">
        INCINERATOR
      </h1>
      <p className="text-gray-500 mb-6 text-center text-sm">
        Burn items to extract essence based on your bias score
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        <div>
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-bold text-yellow-400 mb-4">Select Item</h2>
            
            <div className="space-y-2">
              {mockItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`
                    w-full p-3 rounded-lg border-2 transition-all text-left
                    ${selectedItem?.id === item.id
                      ? "border-yellow-400 bg-gray-800/80" 
                      : "border-gray-800 bg-gray-900/30 hover:border-gray-600"
                    }
                  `}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-gray-400">x{item.quantity}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.essencePool.length} possible essences
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mt-4">
            <h3 className="text-sm font-bold text-gray-400 mb-3">Bias Score</h3>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={biasScore}
                onChange={(e) => setBiasScore(Number(e.target.value))}
                className="w-full accent-yellow-400"
              />
              <div className="text-center text-2xl font-bold text-yellow-400">
                {biasScore}%
              </div>
              <div className="text-xs text-gray-500 text-center">
                Higher bias = rarer essence
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-yellow-400 mb-4">
              Essence Distribution
            </h2>
            
            {selectedItem ? (
              <>
                <div className="relative h-64 bg-black/30 rounded-lg p-4 mb-4 flex items-end justify-center gap-2">
                  {isIncinerating && (
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-600/30 via-red-600/20 to-transparent animate-pulse rounded-lg" />
                  )}
                  
                  {resultEssence && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center animate-fadeIn">
                        <div className="text-green-400 font-bold text-lg mb-2">
                          Essence Extracted!
                        </div>
                        <div className="text-2xl font-bold" style={{ 
                          color: essenceTypes.find(e => e.id === resultEssence)?.color 
                        }}>
                          {essenceTypes.find(e => e.id === resultEssence)?.name}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!isIncinerating && !resultEssence && probData.map((prob, index) => {
                    const essence = essenceTypes.find(e => e.id === prob.essenceId);
                    if (!essence) return null;
                    
                    return (
                      <div key={essence.id} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full transition-all duration-300 rounded-t"
                          style={{
                            height: `${prob.normalizedProb}%`,
                            backgroundColor: essence.color,
                            opacity: 0.7
                          }}
                        />
                        <div className="mt-2">
                          <div 
                            className="w-10 h-10 rounded-full border-2"
                            style={{ 
                              borderColor: essence.color,
                              backgroundColor: `${essence.color}20`
                            }}
                          />
                        </div>
                        <div className="text-xs mt-1 text-gray-400">
                          {essence.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {prob.probability.toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-900/30 border border-gray-800 p-3 rounded">
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Item Selected</div>
                    <div className="text-lg font-bold mt-1">{selectedItem.name}</div>
                  </div>
                  <div className="bg-gray-900/30 border border-gray-800 p-3 rounded">
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Essence Range</div>
                    <div className="text-lg font-bold mt-1">
                      {selectedItem.essencePool[0]} → {selectedItem.essencePool[selectedItem.essencePool.length - 1]}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleIncinerate}
                  disabled={isIncinerating}
                  className={`
                    w-full py-3 px-4 font-bold rounded-lg transition-all
                    ${!isIncinerating
                      ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white"
                      : "bg-gray-800 text-gray-600 cursor-not-allowed"
                    }
                  `}
                >
                  {isIncinerating ? "INCINERATING..." : "INCINERATE"}
                </button>
              </>
            ) : (
              <div className="h-64 bg-black/30 rounded-lg flex items-center justify-center text-gray-600">
                Select an item to see essence probabilities
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}