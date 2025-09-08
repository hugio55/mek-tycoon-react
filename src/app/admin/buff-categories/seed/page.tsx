"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";
import Link from "next/link";

export default function SeedBuffCategoriesPage() {
  const seedBuffCategories = useMutation(api.seedBuffCategories.seedAll);
  const clearBuffCategories = useMutation(api.buffCategories.clearAll);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      // Clear existing categories first
      const clearResult = await clearBuffCategories();
      // Then seed new ones
      const response = await seedBuffCategories();
      setResult(`Cleared ${clearResult.deleted} existing categories. ${response.message}`);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-500 uppercase tracking-wider mb-8">
          Seed Buff Categories
        </h1>

        <div className="bg-gray-900/50 border-2 border-yellow-500/50 rounded-lg p-6">
          <p className="text-gray-300 mb-6">
            This will add all the predefined buff categories to the database:
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <h3 className="text-yellow-500 font-bold mb-2">Gold Buffs:</h3>
              <ul className="text-gray-400 space-y-1">
                <li>• Gold Flat</li>
                <li>• Gold Rate Mek</li>
                <li>• Interest Rate Bank</li>
                <li>• Auction House Fee Reduction</li>
                <li>• CircuTree Gold Cost Reduction</li>
                <li>• Discount on OE Items</li>
                <li>• Scrapyard Gold Reward Increase</li>
                <li>• Crafting Fee Reduction</li>
              </ul>
            </div>

            <div>
              <h3 className="text-yellow-500 font-bold mb-2">Essence Buffs:</h3>
              <ul className="text-gray-400 space-y-1">
                <li>• CircuTree Essence Cost Reduction</li>
                <li>• Essence Rate Global</li>
                <li>• Essence Rate Specific</li>
                <li>• Scrapyard Essence Reward Increase</li>
                <li>• Flat Rewards of Essence</li>
                <li>• Essence Bar Cap Increase</li>
                <li>• Crafting Essence Cost Reduction</li>
              </ul>
            </div>

            <div>
              <h3 className="text-yellow-500 font-bold mb-2">Looter Buffs:</h3>
              <ul className="text-gray-400 space-y-1">
                <li>• Scrap Yard Loot Chance Increase</li>
                <li>• Rarity Bias</li>
                <li>• Fight Cooldown Timer Reduction</li>
                <li>• Various Fight Mechanics Perks</li>
                <li>• XP Gain Bank</li>
                <li>• XP Gain Scrap Yard</li>
                <li>• Glyph Duration</li>
              </ul>
            </div>

            <div>
              <h3 className="text-yellow-500 font-bold mb-2">Misc Buffs:</h3>
              <ul className="text-gray-400 space-y-1">
                <li>• Mek Slots</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleSeed}
            disabled={loading}
            className="bg-yellow-500 text-black font-bold px-6 py-3 rounded hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Seeding..." : "Seed All Buff Categories"}
          </button>

          {result && (
            <div className={`mt-4 p-4 rounded ${result.includes("Error") ? "bg-red-900/30 text-red-400" : "bg-green-900/30 text-green-400"}`}>
              {result}
            </div>
          )}

          <div className="mt-6">
            <Link href="/admin/buff-categories" className="text-yellow-500 hover:text-yellow-400">
              ← Back to Buff Categories
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}