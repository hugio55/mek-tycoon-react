"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COMPLETE_VARIATION_RARITY } from "@/lib/completeVariationRarity";
import { Id } from "@/convex/_generated/dataModel";

interface EssenceBuffManagementProps {
  walletAddress: string;
  onClose: () => void;
}

type BuffTab = "max-cap" | "generation-rate";

export default function EssenceBuffManagement({ walletAddress, onClose }: EssenceBuffManagementProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<BuffTab>("max-cap");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [capBonusInput, setCapBonusInput] = useState("0");
  const [isGlobal, setIsGlobal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Mount portal and lock body scroll
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Query existing buffs for this wallet
  const existingBuffs = useQuery(
    api.essence.getPlayerBuffs,
    { walletAddress }
  );

  // Mutations
  const addCapBuff = useMutation(api.essence.addCapBuff);
  const addGlobalCapBuff = useMutation(api.essence.addGlobalCapBuff);
  const removeCapBuff = useMutation(api.essence.removeCapBuff);

  // Search through all 288 variations
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

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
  }, [searchQuery]);

  const selectedVariationData = useMemo(() => {
    if (!selectedVariation) return null;
    return COMPLETE_VARIATION_RARITY.find(v => v.rank === selectedVariation);
  }, [selectedVariation]);

  // Handler to apply GLOBAL cap buff (all 288 variations)
  const handleApplyGlobalBuff = async () => {
    const bonus = parseFloat(capBonusInput);
    if (isNaN(bonus) || bonus <= 0) {
      setStatusMessage({ type: 'error', message: 'Please enter a valid bonus amount (greater than 0)' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    if (!confirm(`Apply +${bonus} cap buff to ALL 288 variations? This will affect every essence type.`)) {
      return;
    }

    try {
      setStatusMessage({ type: 'success', message: 'Applying global buff to 288 variations...' });
      const result = await addGlobalCapBuff({
        walletAddress,
        capBonus: bonus,
      });
      setStatusMessage({ type: 'success', message: `Applied +${bonus} cap to ${result.totalVariations} variations (${result.created} created, ${result.updated} updated)` });
      setCapBonusInput("0");
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

    const bonus = parseFloat(capBonusInput);
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
      setCapBonusInput("0");
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

  // Only render portal on client-side after mount
  if (!mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto p-4" onClick={onClose}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Lightbox Container */}
      <div className="relative w-[1200px] max-w-[95vw] h-[90vh] bg-black/95 border-4 border-yellow-500/50 rounded-lg overflow-hidden shadow-2xl my-auto" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center bg-black/80 border-2 border-yellow-500/50 rounded hover:bg-yellow-500/20 hover:border-yellow-500 transition-all"
        >
          <span className="text-yellow-400 text-2xl font-bold">×</span>
        </button>

        {/* Header */}
        <div className="w-full bg-gradient-to-b from-black via-gray-900/50 to-transparent border-b-2 border-yellow-500/30">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-4xl font-bold font-orbitron tracking-wider text-center mb-2">
              <span className="text-yellow-400">ESSENCE</span>{" "}
              <span className="text-gray-400">BUFF MANAGEMENT</span>
            </h1>
            <p className="text-center text-gray-500 uppercase tracking-[0.3em] text-xs">
              Wallet: {walletAddress.substring(0, 20)}...
            </p>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`px-4 py-3 text-center font-bold ${
            statusMessage.type === 'success'
              ? 'bg-green-900/50 text-green-400 border-b-2 border-green-500/50'
              : 'bg-red-900/50 text-red-400 border-b-2 border-red-500/50'
          }`}>
            {statusMessage.message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b-2 border-yellow-500/30 bg-black/80">
          <button
            onClick={() => setActiveTab("max-cap")}
            className={`flex-1 px-6 py-4 text-lg font-bold uppercase tracking-wider transition-all ${
              activeTab === "max-cap"
                ? "bg-yellow-500/20 text-yellow-400 border-b-4 border-yellow-500"
                : "text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10"
            }`}
          >
            Max Cap Buffs
          </button>
          <button
            onClick={() => setActiveTab("generation-rate")}
            className={`flex-1 px-6 py-4 text-lg font-bold uppercase tracking-wider transition-all ${
              activeTab === "generation-rate"
                ? "bg-yellow-500/20 text-yellow-400 border-b-4 border-yellow-500"
                : "text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10"
            }`}
          >
            Generation Rate Buffs
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-220px)] overflow-y-auto p-6">
          {activeTab === "max-cap" && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Global Cap Section */}
              <div className="bg-gradient-to-br from-yellow-900/20 to-black/60 border-2 border-yellow-500/40 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4 uppercase tracking-wider">
                  Global Max Cap Bonus
                </h2>
                <p className="text-gray-400 mb-4">
                  Increase the maximum capacity for ALL essence types (all 288 variations). This is a rare, late-game buff.
                </p>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-gray-400 text-sm uppercase tracking-wider mb-2">
                      Global Cap Bonus
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={capBonusInput}
                      onChange={(e) => setCapBonusInput(e.target.value)}
                      className="w-full px-4 py-2 bg-black/80 border-2 border-yellow-500/30 rounded text-yellow-400 font-mono text-lg focus:outline-none focus:border-yellow-500/60 transition-all"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Base cap: 10 → New cap: {(10 + parseFloat(capBonusInput || "0")).toFixed(2)}</p>
                  </div>
                  <button
                    onClick={handleApplyGlobalBuff}
                    className="px-6 py-2 bg-yellow-500/20 border-2 border-yellow-500/50 rounded text-yellow-400 font-bold uppercase tracking-wider hover:bg-yellow-500/30 hover:border-yellow-500 transition-all"
                  >
                    Apply Global Buff
                  </button>
                </div>
              </div>

              {/* Individual Variation Section */}
              <div className="bg-gradient-to-br from-cyan-900/20 to-black/60 border-2 border-cyan-500/40 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4 uppercase tracking-wider">
                  Individual Variation Max Cap
                </h2>
                <p className="text-gray-400 mb-4">
                  Increase the maximum capacity for a specific essence variation. Base cap is 10, adjustable in 0.05 increments.
                </p>

                {/* Search Bar */}
                <div className="mb-4">
                  <label className="block text-gray-400 text-sm uppercase tracking-wider mb-2">
                    Search Variation (288 total)
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name (e.g., Bumblebee, Rust, Camera)..."
                    className="w-full px-4 py-2 bg-black/80 border-2 border-cyan-500/30 rounded text-white focus:outline-none focus:border-cyan-500/60 transition-all"
                  />
                </div>

                {/* Search Results */}
                {searchQuery && searchResults.length > 0 && (
                  <div className="mb-4 bg-black/60 border border-cyan-500/30 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    {searchResults.map((variation) => (
                      <button
                        key={variation.rank}
                        onClick={() => {
                          setSelectedVariation(variation.rank);
                          setSearchQuery("");
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-cyan-500/20 transition-colors border-b border-gray-800/50 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-white font-medium">{variation.name}</span>
                            <span className="text-gray-500 text-xs ml-2">({variation.type})</span>
                          </div>
                          <div className="text-right">
                            <div className="text-cyan-400 text-xs">Rank #{variation.rank}</div>
                            <div className="text-gray-400 text-xs">{variation.percentage}%</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Variation */}
                {selectedVariationData && (
                  <div className="bg-black/60 border-2 border-cyan-500/40 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-cyan-400">{selectedVariationData.name}</h3>
                        <p className="text-gray-500 text-sm uppercase">{selectedVariationData.type} • Rank #{selectedVariationData.rank}</p>
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
                        <label className="block text-gray-400 text-sm uppercase tracking-wider mb-2">
                          Cap Bonus Amount
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={capBonusInput}
                          onChange={(e) => setCapBonusInput(e.target.value)}
                          className="w-full px-4 py-2 bg-black/80 border-2 border-cyan-500/30 rounded text-cyan-400 font-mono text-lg focus:outline-none focus:border-cyan-500/60 transition-all"
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Base cap: 10 → New cap: {(10 + parseFloat(capBonusInput || "0")).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={handleApplyIndividualBuff}
                        className="px-6 py-2 bg-cyan-500/20 border-2 border-cyan-500/50 rounded text-cyan-400 font-bold uppercase tracking-wider hover:bg-cyan-500/30 hover:border-cyan-500 transition-all"
                      >
                        Apply Buff
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Buffs List */}
              <div className="bg-gradient-to-br from-gray-900/20 to-black/60 border-2 border-gray-500/40 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-400 mb-4 uppercase tracking-wider">
                  Active Max Cap Buffs
                </h2>
                {existingBuffs && existingBuffs.length > 0 ? (
                  <div className="space-y-2">
                    {existingBuffs.map((buff: any) => (
                      <div
                        key={buff._id}
                        className="flex items-center justify-between bg-black/40 border border-gray-600 rounded p-3"
                      >
                        <div>
                          <span className="text-white font-medium">Variation #{buff.variationId}</span>
                          <span className="text-gray-500 text-xs ml-2">+{buff.capBonus} cap</span>
                        </div>
                        <button
                          onClick={() => handleRemoveBuff(buff._id)}
                          className="px-3 py-1 bg-red-600/20 border border-red-500/50 rounded text-red-400 text-sm hover:bg-red-600/30 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 italic">No active cap buffs for this wallet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "generation-rate" && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800/50 border-2 border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-400 text-lg">Generation Rate buffs coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
