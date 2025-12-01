"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { ConvexReactClient } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COMPLETE_VARIATION_RARITY } from "@/lib/completeVariationRarity";
import { Id } from "@/convex/_generated/dataModel";

interface BuffManagementProps {
  walletAddress: string;
  client: ConvexReactClient | null;
  selectedDatabase: 'trout' | 'sturgeon';
  onClose: () => void;
}

type BuffCategory = "gold-rate" | "essence-cap" | "essence-generation";

export default function BuffManagement({ walletAddress, client, selectedDatabase, onClose }: BuffManagementProps) {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<BuffCategory>("gold-rate");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [buffValueInput, setBuffValueInput] = useState("0");
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [existingBuffs, setExistingBuffs] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);

  // Mount portal and lock body scroll
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Query data from selected database
  useEffect(() => {
    if (!client) return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        const [buffs, company] = await Promise.all([
          client.query(api.essence.getPlayerBuffs, { walletAddress }),
          client.query(api.goldMining.getCompanyName, { walletAddress })
        ]);

        if (!cancelled) {
          setExistingBuffs(buffs);
          setCompanyData(company);
        }
      } catch (error) {
        console.error('[BuffManagement] Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [client, walletAddress]);

  // Mutation helpers using client
  const addCapBuff = async (args: any) => {
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.essence.addCapBuff, args);
  };

  const addGlobalCapBuff = async (args: any) => {
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.essence.addGlobalCapBuff, args);
  };

  const removeCapBuff = async (args: any) => {
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.essence.removeCapBuff, args);
  };

  // Search through all 291 variations
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || activeCategory === "gold-rate") return [];

    const query = searchQuery.toLowerCase();
    return COMPLETE_VARIATION_RARITY
      .filter(v => v.name.toLowerCase().includes(query))
      .slice(0, 10)
      .sort((a, b) => {
        const aStart = a.name.toLowerCase().startsWith(query);
        const bStart = b.name.toLowerCase().startsWith(query);
        if (aStart && !bStart) return -1;
        if (!aStart && bStart) return 1;
        return a.rank - b.rank;
      });
  }, [searchQuery, activeCategory]);

  const selectedVariationData = useMemo(() => {
    if (!selectedVariation) return null;
    return COMPLETE_VARIATION_RARITY.find(v => v.rank === selectedVariation);
  }, [selectedVariation]);

  // Handler to apply GLOBAL cap buff (all 291 variations)
  const handleApplyGlobalBuff = async () => {
    const bonus = parseFloat(buffValueInput);
    if (isNaN(bonus) || bonus <= 0) {
      setStatusMessage({ type: 'error', message: 'Please enter a valid bonus amount (greater than 0)' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    if (!confirm(`Apply +${bonus} cap buff to ALL 291 variations? This will affect every essence type.`)) {
      return;
    }

    try {
      setStatusMessage({ type: 'success', message: 'Applying global buff to 291 variations...' });
      const result = await addGlobalCapBuff({
        walletAddress,
        capBonus: bonus,
      });
      setStatusMessage({ type: 'success', message: `Applied +${bonus} cap to ${result.totalVariations} variations (${result.created} created, ${result.updated} updated)` });
      setBuffValueInput("0");
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to apply global buff' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Handler to apply cap buff for individual variation
  const handleApplyIndividualBuff = async () => {
    if (!selectedVariation) {
      setStatusMessage({ type: 'error', message: 'Please select a variation first' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const bonus = parseFloat(buffValueInput);
    if (isNaN(bonus) || bonus < 0) {
      setStatusMessage({ type: 'error', message: 'Please enter a valid bonus amount' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    try {
      await addCapBuff({
        walletAddress,
        variationId: selectedVariation,
        capBonus: bonus,
        source: `Admin: Manual buff for variation #${selectedVariation}`,
      });
      setStatusMessage({ type: 'success', message: `Applied +${bonus} cap buff to variation #${selectedVariation}` });
      setSelectedVariation(null);
      setBuffValueInput("0");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to apply buff' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Handler to remove a buff
  const handleRemoveBuff = async (buffId: Id<"essencePlayerBuffs">) => {
    if (!confirm('Are you sure you want to remove this buff?')) return;

    try {
      await removeCapBuff({ buffId });
      setStatusMessage({ type: 'success', message: 'Buff removed successfully' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to remove buff' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Handler to remove all buffs
  const handleRemoveAllBuffs = async () => {
    if (!existingBuffs || existingBuffs.length === 0) return;

    if (!confirm(`Are you sure you want to remove ALL ${existingBuffs.length} buffs? This cannot be undone.`)) {
      return;
    }

    try {
      setStatusMessage({ type: 'success', message: `Removing ${existingBuffs.length} buffs...` });

      for (const buff of existingBuffs) {
        await removeCapBuff({ buffId: buff._id });
      }

      setStatusMessage({ type: 'success', message: `Successfully removed ${existingBuffs.length} buffs` });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to remove all buffs' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Only render portal on client-side after mount
  if (!mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto p-4" onClick={onClose}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Lightbox Container */}
      <div className="relative w-[1200px] max-w-[95vw] h-[90vh] bg-gray-900 border-2 border-yellow-500 rounded-lg overflow-hidden shadow-2xl my-auto flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Buff Management - {companyData?.companyName || "Loading..."}
          </h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700 rounded transition-colors"
          >
            Close
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`px-4 py-3 text-center font-semibold text-sm ${
            statusMessage.type === 'success'
              ? 'bg-green-900/30 text-green-400 border-b border-green-700'
              : 'bg-red-900/30 text-red-400 border-b border-red-700'
          }`}>
            {statusMessage.message}
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-800/50">
          <button
            onClick={() => {
              setActiveCategory("gold-rate");
              setSearchQuery("");
              setSelectedVariation(null);
            }}
            className={`px-6 py-3 text-sm font-semibold transition-colors ${
              activeCategory === "gold-rate"
                ? "bg-gray-700 text-yellow-400 border-b-2 border-yellow-500"
                : "text-gray-400 hover:text-yellow-400 hover:bg-gray-800/50"
            }`}
          >
            Gold Rate
          </button>
          <button
            onClick={() => {
              setActiveCategory("essence-cap");
              setSearchQuery("");
              setSelectedVariation(null);
            }}
            className={`px-6 py-3 text-sm font-semibold transition-colors ${
              activeCategory === "essence-cap"
                ? "bg-gray-700 text-yellow-400 border-b-2 border-yellow-500"
                : "text-gray-400 hover:text-yellow-400 hover:bg-gray-800/50"
            }`}
          >
            Essence Cap
          </button>
          <button
            onClick={() => {
              setActiveCategory("essence-generation");
              setSearchQuery("");
              setSelectedVariation(null);
            }}
            className={`px-6 py-3 text-sm font-semibold transition-colors ${
              activeCategory === "essence-generation"
                ? "bg-gray-700 text-yellow-400 border-b-2 border-yellow-500"
                : "text-gray-400 hover:text-yellow-400 hover:bg-gray-800/50"
            }`}
          >
            Essence Generation
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeCategory === "gold-rate" && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-400 text-lg mb-2">Gold Rate Buffs</p>
                <p className="text-gray-500 text-sm">Coming soon...</p>
              </div>
            </div>
          )}

          {activeCategory === "essence-cap" && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Global Cap Section */}
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">
                  Global Max Cap Bonus
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Increase the maximum capacity for ALL essence types (all 291 variations). This is a rare, late-game buff.
                </p>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-gray-400 text-xs font-semibold uppercase mb-2">
                      Global Cap Bonus
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={buffValueInput}
                      onChange={(e) => setBuffValueInput(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-yellow-400 font-mono focus:outline-none focus:border-yellow-500 transition-colors"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Base cap: 10 → New cap: {(10 + parseFloat(buffValueInput || "0")).toFixed(2)}</p>
                  </div>
                  <button
                    onClick={handleApplyGlobalBuff}
                    className="px-6 py-2 bg-yellow-900/30 border border-yellow-600 rounded text-yellow-400 font-semibold hover:bg-yellow-900/50 transition-colors"
                  >
                    Apply Global Buff
                  </button>
                </div>
              </div>

              {/* Individual Variation Section */}
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-400 mb-3">
                  Individual Variation Max Cap
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Increase the maximum capacity for a specific essence variation. Base cap is 10, adjustable in 0.05 increments.
                </p>

                {/* Search Bar */}
                <div className="mb-4">
                  <label className="block text-gray-400 text-xs font-semibold uppercase mb-2">
                    Search Variation (291 total)
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name (e.g., Bumblebee, Rust, Camera)..."
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Search Results */}
                {searchQuery && searchResults.length > 0 && (
                  <div className="mb-4 bg-gray-800 border border-gray-600 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    {searchResults.map((variation) => (
                      <button
                        key={variation.rank}
                        onClick={() => {
                          setSelectedVariation(variation.rank);
                          setSearchQuery("");
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700/50 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-white font-medium">{variation.name}</span>
                            <span className="text-gray-500 text-xs ml-2">({variation.type})</span>
                          </div>
                          <div className="text-right">
                            <div className="text-blue-400 text-xs">Rank #{variation.rank}</div>
                            <div className="text-gray-400 text-xs">{variation.percentage}%</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Variation */}
                {selectedVariationData && (
                  <div className="bg-gray-800 border border-blue-500 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-base font-semibold text-blue-400">{selectedVariationData.name}</h4>
                        <p className="text-gray-500 text-xs uppercase">{selectedVariationData.type} • Rank #{selectedVariationData.rank}</p>
                      </div>
                      <button
                        onClick={() => setSelectedVariation(null)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-gray-400 text-xs font-semibold uppercase mb-2">
                          Cap Bonus Amount
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={buffValueInput}
                          onChange={(e) => setBuffValueInput(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-blue-400 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Base cap: 10 → New cap: {(10 + parseFloat(buffValueInput || "0")).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={handleApplyIndividualBuff}
                        className="px-6 py-2 bg-blue-900/30 border border-blue-600 rounded text-blue-400 font-semibold hover:bg-blue-900/50 transition-colors"
                      >
                        Apply Buff
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Buffs List */}
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-300">
                    Active Max Cap Buffs
                  </h3>
                  {existingBuffs && existingBuffs.length > 0 && (
                    <button
                      onClick={handleRemoveAllBuffs}
                      className="px-4 py-1.5 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm font-semibold hover:bg-red-900/50 transition-colors"
                    >
                      Remove All ({existingBuffs.length})
                    </button>
                  )}
                </div>
                {existingBuffs && existingBuffs.length > 0 ? (
                  <div className="space-y-2">
                    {existingBuffs.map((buff: any) => {
                      const variation = COMPLETE_VARIATION_RARITY.find(v => v.rank === buff.variationId);
                      return (
                        <div
                          key={buff._id}
                          className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded p-3 hover:bg-gray-700/50 transition-colors"
                        >
                          <div>
                            <span className="text-white font-medium">
                              {variation ? variation.name : `Variation #${buff.variationId}`}
                            </span>
                            <span className="text-gray-500 text-xs ml-2">
                              {variation && `(${variation.type}) • `}+{buff.capBonus} cap
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveBuff(buff._id)}
                            className="px-3 py-1 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm hover:bg-red-900/50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-sm">No active cap buffs for this wallet.</p>
                )}
              </div>
            </div>
          )}

          {activeCategory === "essence-generation" && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-400 text-lg mb-2">Essence Generation Rate Buffs</p>
                <p className="text-gray-500 text-sm">Coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
