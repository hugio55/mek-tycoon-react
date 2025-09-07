"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export default function BuffsPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  
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
  
  // Seed buff types if needed
  const seedBuffTypes = useMutation(api.buffs.seedBuffTypes);
  
  // Get all buff types
  const buffTypes = useQuery(api.buffs.getAllBuffTypes);
  
  // Get user's active buffs
  const userBuffs = useQuery(
    api.buffs.getUserBuffs,
    userId ? { userId } : "skip"
  );
  
  // Get calculated buff totals
  const buffTotals = useQuery(
    api.buffs.calculateUserBuffTotals,
    userId ? { userId } : "skip"
  );
  
  // Grant buff mutation
  const grantBuff = useMutation(api.buffs.grantBuff);
  
  // Remove buff mutation
  const removeBuff = useMutation(api.buffs.removeBuff);
  
  const handleSeedBuffs = async () => {
    const result = await seedBuffTypes();
    alert(result.message);
  };
  
  const handleGrantBuff = async (buffTypeId: Id<"buffTypes">) => {
    if (!userId) return;
    
    const result = await grantBuff({
      userId,
      buffTypeId,
      source: "manual_test",
      duration: 60000 * 5, // 5 minutes for testing
    });
    
    alert(result.message);
  };
  
  const handleRemoveBuff = async (buffId: Id<"activeBuffs">) => {
    await removeBuff({ buffId });
  };
  
  const formatBuffValue = (value: number, valueType: string) => {
    return valueType === "percentage" ? `${value}%` : `+${value}`;
  };
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "text-gray-400";
      case "uncommon": return "text-green-400";
      case "rare": return "text-blue-400";
      case "epic": return "text-purple-400";
      case "legendary": return "text-yellow-400";
      default: return "text-white";
    }
  };
  
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-yellow-400 text-2xl animate-pulse">
          Loading Buff System...
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-white py-8 relative z-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">
          🎯 Buff System Demo
        </h1>
        <p className="text-gray-400">
          This is a demonstration of the buff system. Buffs can come from talents, items, achievements, etc.
        </p>
      </div>
      
      {/* Seed Button */}
      {(!buffTypes || buffTypes.length === 0) && (
        <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-yellow-500/30">
          <p className="mb-4">No buff types found. Click to add sample buffs:</p>
          <button
            onClick={handleSeedBuffs}
            className="px-6 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition-colors"
          >
            Initialize Buff Types
          </button>
        </div>
      )}
      
      {/* Active Buff Totals */}
      {buffTotals && Object.keys(buffTotals).length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">📊 Total Active Buffs</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(buffTotals).map(([buffType, values]) => (
              <div key={buffType} className="p-4 bg-gray-800/50 rounded-lg border border-yellow-500/20">
                <div className="text-sm text-gray-400 mb-1">
                  {buffType.replace(/_/g, " ").toUpperCase()}
                </div>
                <div className="text-xl font-bold text-yellow-400">
                  {values.flat > 0 && `+${values.flat} `}
                  {values.percentage > 0 && `+${values.percentage}%`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* User's Active Buffs */}
      {userBuffs && userBuffs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">⚡ Your Active Buffs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userBuffs.map((buff) => (
              <div
                key={buff._id}
                className="p-4 bg-gray-800/50 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{buff.buffType?.icon}</span>
                      <h3 className={`font-bold ${getRarityColor(buff.buffType?.rarity || "common")}`}>
                        {buff.buffType?.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {buff.buffType?.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveBuff(buff._id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="text-yellow-400">
                    {formatBuffValue(buff.value, buff.buffType?.valueType || "flat")}
                    {buff.stacks > 1 && ` x${buff.stacks}`}
                  </div>
                  <div className="text-gray-400">
                    Source: {buff.source}
                  </div>
                </div>
                {buff.expiresAt && (
                  <div className="mt-2 text-xs text-gray-500">
                    Expires: {new Date(buff.expiresAt).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Available Buff Types */}
      {buffTypes && buffTypes.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">📜 Available Buff Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buffTypes.map((buffType) => (
              <div
                key={buffType._id}
                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-yellow-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{buffType.icon}</span>
                    <div>
                      <h3 className={`font-bold ${getRarityColor(buffType.rarity)}`}>
                        {buffType.name}
                      </h3>
                      <span className={`text-xs uppercase ${getRarityColor(buffType.rarity)}`}>
                        {buffType.rarity}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-3">{buffType.description}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-yellow-400">
                    Base: {formatBuffValue(buffType.baseValue, buffType.valueType)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Max Stacks: {buffType.maxStacks}
                  </span>
                </div>
                <button
                  onClick={() => handleGrantBuff(buffType._id)}
                  className="w-full px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors text-sm font-semibold"
                >
                  Grant Buff (5 min)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}