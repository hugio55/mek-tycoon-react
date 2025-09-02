"use client";

import { useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface CraftingSession {
  _id: Id<"craftingSessions">;
  userId: Id<"users">;
  recipeId: Id<"craftingRecipes">;
  startedAt: number;
  completesAt: number;
  status: "crafting" | "completed" | "claimed" | "failed";
  slotNumber: number;
  recipe?: {
    name: string;
    outputVariation: string;
    outputType: string;
  };
}

interface CraftingSlotsProps {
  slots: number;
  activeSessions: CraftingSession[];
  onStartCrafting: (slotNumber: number) => void;
  onClaimCrafting: (sessionId: Id<"craftingSessions">) => void;
  onSpeedUp: (sessionId: Id<"craftingSessions">) => void;
  selectedRecipe: Id<"craftingRecipes"> | null;
}

export default function CraftingSlots({
  slots,
  activeSessions,
  onStartCrafting,
  onClaimCrafting,
  onSpeedUp,
  selectedRecipe,
}: CraftingSlotsProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const getSessionForSlot = (slotNumber: number) => {
    return activeSessions.find(
      (session) => session.slotNumber === slotNumber && session.status === "crafting"
    );
  };
  
  const formatTime = (milliseconds: number) => {
    if (milliseconds <= 0) return "Ready!";
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  const getProgress = (session: CraftingSession) => {
    const total = session.completesAt - session.startedAt;
    const elapsed = currentTime - session.startedAt;
    return Math.min(100, (elapsed / total) * 100);
  };
  
  const calculateSpeedUpCost = (session: CraftingSession) => {
    const remainingTime = Math.max(0, session.completesAt - currentTime);
    return Math.ceil(remainingTime / 60000); // 1 gold per minute
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: Math.max(5, slots) }, (_, i) => i + 1).map((slotNumber) => {
        const session = getSessionForSlot(slotNumber);
        const isLocked = slotNumber > slots;
        const isReady = session && currentTime >= session.completesAt;
        const isCrafting = session && !isReady;
        
        return (
          <div
            key={slotNumber}
            className={`
              relative rounded-lg border-2 p-4 transition-all
              ${isLocked 
                ? "border-gray-700 bg-gray-900/50 opacity-60" 
                : session
                  ? isReady
                    ? "border-green-500 bg-green-900/20 animate-pulse"
                    : "border-yellow-500 bg-yellow-900/10"
                  : selectedRecipe
                    ? "border-yellow-500/50 bg-gray-800/30 hover:bg-gray-700/50 cursor-pointer"
                    : "border-gray-600 bg-gray-800/30"
              }
            `}
          >
            {/* Slot Number Badge */}
            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gray-800 border-2 border-yellow-500 flex items-center justify-center text-sm font-bold">
              {slotNumber}
            </div>
            
            {isLocked ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">🔒</div>
                <div className="text-sm text-gray-500">Slot Locked</div>
                <div className="text-xs text-gray-600 mt-1">
                  Cost: {100 * Math.pow(2, slotNumber - 1)} gold
                </div>
              </div>
            ) : session ? (
              <div>
                <div className="font-semibold text-sm mb-1">
                  {session.recipe?.name || "Crafting..."}
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  {session.recipe?.outputVariation}
                </div>
                
                {/* Progress Bar */}
                <div className="relative h-6 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div
                    className={`absolute h-full transition-all duration-1000 ${
                      isReady ? "bg-green-500" : "bg-yellow-500"
                    }`}
                    style={{ width: `${getProgress(session)}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                    {formatTime(Math.max(0, session.completesAt - currentTime))}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  {isReady ? (
                    <button
                      onClick={() => onClaimCrafting(session._id)}
                      className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold transition-colors"
                    >
                      ✨ Claim
                    </button>
                  ) : (
                    <button
                      onClick={() => onSpeedUp(session._id)}
                      className="flex-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-semibold transition-colors"
                    >
                      ⚡ Speed Up ({calculateSpeedUpCost(session)}g)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => selectedRecipe && onStartCrafting(slotNumber)}
                disabled={!selectedRecipe}
                className={`w-full py-4 text-center transition-all ${
                  selectedRecipe
                    ? "hover:bg-yellow-900/20 cursor-pointer"
                    : "cursor-not-allowed opacity-50"
                }`}
              >
                <div className="text-3xl mb-2">➕</div>
                <div className="text-sm">
                  {selectedRecipe ? "Start Crafting" : "Select Recipe First"}
                </div>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}