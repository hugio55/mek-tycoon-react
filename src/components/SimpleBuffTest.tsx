'use client';

import { useMutation } from "convex/react";
import { api } from "@/../../convex/_generated/api";
import { Id } from "@/../../convex/_generated/dataModel";
import { useState } from "react";

interface SimpleBuffTestProps {
  userId: Id<"users">;
}

export default function SimpleBuffTest({ userId }: SimpleBuffTestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const seedBuffTypes = useMutation(api.buffManager.seedBuffTypes);
  const giveTemporaryBuff = useMutation(api.buffManager.giveTemporaryBuff);
  
  const handleQuickTest = async () => {
    try {
      // Try to seed buff types first (will skip if already exists)
      try {
        const seedResult = await seedBuffTypes();
        console.log('Seed result:', seedResult);
        if (seedResult.created) {
          console.log('Created buff types:', seedResult.created);
        } else if (seedResult.existing) {
          console.log('Existing buff types:', seedResult.existing);
        }
      } catch (e) {
        console.error('Error seeding buff types:', e);
      }
      
      // Wait a moment for DB to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Then give a test buff
      const buffResult = await giveTemporaryBuff({
        userId,
        buffName: "Gold Boost",
        durationMinutes: 5,
      });
      
      console.log('Buff result:', buffResult);
      alert('Gold Boost buff added for 5 minutes! Check top-right for active buffs.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding buff. Check console for details.');
    }
  };
  
  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-2xl font-bold text-lg transform hover:scale-105"
        style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 9999 }}
      >
        🧪 Buffs
      </button>
      
      {isOpen && (
        <div className="fixed bottom-24 right-8 w-64 bg-black/95 backdrop-blur-md rounded-lg border-2 border-purple-500 p-4 shadow-2xl" style={{ zIndex: 9998 }}>
          <h3 className="text-purple-400 font-bold mb-3">Quick Buff Test</h3>
          <button
            onClick={handleQuickTest}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded mb-2"
          >
            Add Gold Boost (5 min)
          </button>
          <p className="text-xs text-gray-400">
            Click to add a test buff. Check top-right corner for active buffs display.
          </p>
        </div>
      )}
    </>
  );
}