"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import CraftingSlots from "@/components/CraftingSlots";
import RecipeSelector from "@/components/RecipeSelector";
import UserResources from "@/components/UserResources";

export default function CraftingPage() {
  const [selectedRecipe, setSelectedRecipe] = useState<Id<"craftingRecipes"> | null>(null);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  
  // For demo purposes, we'll create/get a user on mount
  // In production, this would come from wallet authentication
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
  useEffect(() => {
    const initUser = async () => {
      // Use a fixed demo wallet for testing
      const user = await getOrCreateUser({ 
        walletAddress: "demo_wallet_123" 
      });
      if (user) {
        setUserId(user._id as Id<"users">);
      }
    };
    initUser();
  }, [getOrCreateUser]);
  
  // Get user profile with real-time updates
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );
  
  // Get available recipes
  const recipes = useQuery(api.crafting.getRecipes, { userId: userId || undefined });
  
  // Get active crafting sessions
  const activeSessions = useQuery(
    api.crafting.getActiveSessions,
    userId ? { userId } : "skip"
  );
  
  // Mutations
  const startCrafting = useMutation(api.crafting.startCrafting);
  const claimCrafting = useMutation(api.crafting.claimCrafting);
  const speedUpCrafting = useMutation(api.crafting.speedUpCrafting);
  
  const handleStartCrafting = async (slotNumber: number) => {
    if (!userId || !selectedRecipe) {
      alert("Please select a recipe first!");
      return;
    }
    
    try {
      await startCrafting({
        userId,
        recipeId: selectedRecipe,
        slotNumber,
      });
      setSelectedRecipe(null);
    } catch (error: any) {
      alert(error.message);
    }
  };
  
  const handleClaimCrafting = async (sessionId: Id<"craftingSessions">) => {
    if (!userId) return;
    
    try {
      const result = await claimCrafting({ sessionId, userId });
      if (result.success) {
        alert(`Successfully crafted: ${result.item}!`);
      } else {
        alert("Crafting failed! Better luck next time.");
      }
    } catch (error: any) {
      alert(error.message);
    }
  };
  
  const handleSpeedUp = async (sessionId: Id<"craftingSessions">) => {
    if (!userId) return;
    
    try {
      const result = await speedUpCrafting({ sessionId, userId });
      alert(`Spent ${result.cost} gold to speed up crafting!`);
    } catch (error: any) {
      alert(error.message);
    }
  };
  
  if (!userId || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-yellow-400 text-2xl animate-pulse">
          Loading Mek Tycoon...
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="border-b border-yellow-500/30 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-yellow-400">
              🔨 Mek Crafting Station
            </h1>
            <UserResources user={userProfile} />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recipe Selection */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 rounded-lg border-2 border-yellow-500/30 p-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">
                📜 Select Recipe
              </h2>
              <RecipeSelector
                recipes={recipes || []}
                selectedRecipe={selectedRecipe}
                onSelectRecipe={setSelectedRecipe}
                userEssence={userProfile.totalEssence}
                userGold={userProfile.gold}
              />
            </div>
          </div>
          
          {/* Crafting Slots */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 rounded-lg border-2 border-yellow-500/30 p-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">
                ⚙️ Crafting Slots
              </h2>
              <CraftingSlots
                slots={userProfile.craftingSlots}
                activeSessions={activeSessions || []}
                onStartCrafting={handleStartCrafting}
                onClaimCrafting={handleClaimCrafting}
                onSpeedUp={handleSpeedUp}
                selectedRecipe={selectedRecipe}
              />
            </div>
            
            {/* Stats */}
            <div className="mt-6 bg-gray-800/50 rounded-lg border-2 border-yellow-500/30 p-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">📊 Your Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {userProfile.stats.totalMeks}
                  </div>
                  <div className="text-sm text-gray-400">Total Meks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {userProfile.stats.inventoryItems}
                  </div>
                  <div className="text-sm text-gray-400">Inventory Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {userProfile.stats.activeCrafting}
                  </div>
                  <div className="text-sm text-gray-400">Active Crafting</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {userProfile.stats.achievementsUnlocked}
                  </div>
                  <div className="text-sm text-gray-400">Achievements</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}