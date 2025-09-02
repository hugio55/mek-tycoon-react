'use client';

import { useMutation } from "convex/react";
import { api } from "@/../../convex/_generated/api";
import { Id } from "@/../../convex/_generated/dataModel";
import { useState } from "react";

interface BuffTestPanelProps {
  userId: Id<"users"> | null;
}

export default function BuffTestPanel({ userId }: BuffTestPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const seedBuffTypes = useMutation(api.buffManager.seedBuffTypes);
  const giveTemporaryBuff = useMutation(api.buffManager.giveTemporaryBuff);
  
  
  const testBuffs = [
    { name: "Gold Boost", duration: 5, icon: "💰", color: "yellow" },
    { name: "Speed Boost", duration: 10, icon: "⚡", color: "blue" },
    { name: "XP Amplifier", duration: 15, icon: "⭐", color: "purple" },
    { name: "Essence Finder", duration: 20, icon: "🔮", color: "pink" },
    { name: "Lucky Crafter", duration: 30, icon: "🍀", color: "green" },
    { name: "Gold Rush", duration: 60, icon: "🏆", color: "orange" },
  ];
  
  const handleSeedBuffs = async () => {
    try {
      const result = await seedBuffTypes();
      alert(result.message);
    } catch (error) {
      console.error("Error seeding buffs:", error);
      alert("Buff types may already exist");
    }
  };
  
  const handleGiveBuff = async (buffName: string, duration: number) => {
    if (!userId) {
      alert("No user ID available");
      return;
    }
    
    try {
      // Try to seed buff types first (will skip if already exists)
      try {
        await seedBuffTypes();
      } catch (e) {
        // Ignore error - buff types might already exist
      }
      
      const result = await giveTemporaryBuff({
        userId,
        buffName,
        durationMinutes: duration,
      });
      
      if (result.success) {
        alert(`${buffName} added for ${duration} minutes!`);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error giving buff:", error);
      alert(`Failed to add ${buffName}. Check console for details.`);
    }
  };
  
  if (!userId) return null;
  
  return (
    <>
      {/* Toggle Button - moved to right side for better visibility */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-[9999] px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-2xl transition-all font-bold text-lg transform hover:scale-105"
        style={{ zIndex: 9999 }}
      >
        🧪 Test Buffs
      </button>
      
      {/* Test Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-8 z-[9998] w-80 bg-black/95 backdrop-blur-md rounded-lg border-2 border-purple-500 p-4 shadow-2xl">
          <h3 className="text-purple-400 font-bold mb-3">Buff Test Panel</h3>
          
          {/* Seed Button */}
          <button
            onClick={handleSeedBuffs}
            className="w-full mb-3 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded text-sm text-purple-300 transition-all"
          >
            🌱 Initialize Buff Types (Run Once)
          </button>
          
          <div className="border-t border-purple-500/20 pt-3">
            <p className="text-xs text-gray-400 mb-2">Click to add temporary buffs:</p>
            
            <div className="grid grid-cols-2 gap-2">
              {testBuffs.map((buff) => (
                <button
                  key={buff.name}
                  onClick={() => handleGiveBuff(buff.name, buff.duration)}
                  className={`p-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-${buff.color}-500 rounded text-xs transition-all`}
                >
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">{buff.icon}</span>
                    <div className="text-left">
                      <p className="font-semibold text-white">{buff.name}</p>
                      <p className="text-gray-400">{buff.duration}min</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-purple-500/20">
            <p className="text-xs text-gray-500">
              Buffs will appear in the top-right corner when active.
              Collect gold to see XP and buff effects!
            </p>
          </div>
        </div>
      )}
    </>
  );
}