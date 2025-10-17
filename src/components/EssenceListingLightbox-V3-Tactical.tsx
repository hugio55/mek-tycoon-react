"use client";

import { useState } from "react";

// VERSION 3: DARK TACTICAL
// Sleek, modern, military-inspired with minimal accent colors

interface Props {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: {
    variation: string;
    amount: string;
    price: string;
    duration: number;
  }) => void;
  ownedEssenceVariations: Array<{ name: string; amount: number }>;
  durationOptions: Array<{ days: number; label: string; cost: number }>;
}

export default function EssenceListingLightboxV3Tactical({
  show,
  onClose,
  onSubmit,
  ownedEssenceVariations,
  durationOptions,
}: Props) {
  const [selectedVariation, setSelectedVariation] = useState("");
  const [essenceAmount, setEssenceAmount] = useState("1");
  const [pricePerUnit, setPricePerUnit] = useState("0");
  const [selectedDuration, setSelectedDuration] = useState(7);

  if (!show) return null;

  // Parse price into individual digits (5 places max)
  const priceNum = parseInt(pricePerUnit) || 0;
  const digits = priceNum.toString().padStart(5, "0").split("").map(Number);

  const updateDigit = (index: number, increment: boolean) => {
    const newDigits = [...digits];
    if (increment) {
      newDigits[index] = (newDigits[index] + 1) % 10;
    } else {
      newDigits[index] = newDigits[index] === 0 ? 9 : newDigits[index] - 1;
    }
    const newPrice = parseInt(newDigits.join(""));
    setPricePerUnit(String(newPrice));
  };

  const handleSubmit = () => {
    onSubmit({
      variation: selectedVariation,
      amount: essenceAmount,
      price: pricePerUnit,
      duration: selectedDuration,
    });
  };

  const listingFee =
    durationOptions.find((d) => d.days === selectedDuration)?.cost || 0;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur flex items-center justify-center z-50 p-4">
      {/* Main container with subtle glow */}
      <div className="relative bg-gradient-to-br from-gray-950 to-black border border-gray-800 shadow-2xl max-w-md w-full">
        {/* Subtle top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-200 tracking-tight">
                New Listing
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Market deployment protocol
              </p>
            </div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          </div>

          <div className="space-y-4">
            {/* Essence Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                ESSENCE TYPE
              </label>
              <select
                value={selectedVariation}
                onChange={(e) => setSelectedVariation(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-800 text-gray-300 text-sm focus:border-blue-600 focus:outline-none transition-colors"
              >
                <option value="">Select essence type...</option>
                {ownedEssenceVariations.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} · {v.amount.toFixed(2)} units
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                QUANTITY
              </label>
              <input
                type="number"
                value={essenceAmount}
                onChange={(e) => setEssenceAmount(e.target.value)}
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-800 text-gray-300 text-sm focus:border-blue-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Price with Combination Lock Controls */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                UNIT PRICE (GOLD)
              </label>

              {/* Price Display */}
              <div className="mb-3 text-center py-4 bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800">
                <div className="text-3xl font-bold text-gray-100 font-mono tracking-wide">
                  {priceNum.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 mt-1">GOLD PER UNIT</div>
              </div>

              {/* Digit Controls - Combination Lock Style */}
              <div className="flex justify-center gap-1.5">
                {["10000", "1000", "100", "10", "1"].map((place, idx) => (
                  <div key={place} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => updateDigit(idx, true)}
                      className="w-11 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 border-t border-x border-gray-700 text-gray-400 hover:text-blue-400 transition-all text-xs"
                    >
                      ▴
                    </button>

                    <div className="w-11 h-11 flex items-center justify-center bg-gray-950 border-x border-gray-700 text-xl font-mono font-bold text-gray-200">
                      {digits[idx]}
                    </div>

                    <button
                      type="button"
                      onClick={() => updateDigit(idx, false)}
                      className="w-11 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 border-b border-x border-gray-700 text-gray-400 hover:text-blue-400 transition-all text-xs"
                    >
                      ▾
                    </button>

                    <div className="text-[10px] text-gray-600 mt-1.5 font-medium">
                      {place === "10000"
                        ? "10k"
                        : place === "1000"
                        ? "1k"
                        : place === "100"
                        ? "100"
                        : place === "10"
                        ? "10"
                        : "1"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                LISTING DURATION
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {durationOptions.map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setSelectedDuration(opt.days)}
                    className={`py-2.5 text-xs font-medium border transition-all ${
                      selectedDuration === opt.days
                        ? "bg-blue-600 text-white border-blue-500"
                        : "bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-700 hover:text-gray-400"
                    }`}
                  >
                    {opt.days}D
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Listing fee:{" "}
                <span className="text-blue-400 font-medium">{listingFee}g</span>
              </div>
            </div>

            {/* Summary */}
            {pricePerUnit && essenceAmount && (
              <div className="bg-gray-950 border border-gray-800 p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Value</span>
                  <span className="text-gray-200 font-mono font-medium">
                    {(
                      parseInt(pricePerUnit) * parseFloat(essenceAmount)
                    ).toLocaleString()}
                    g
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-800 pt-1.5">
                  <span className="text-gray-500">Listing Fee</span>
                  <span className="text-red-400 font-medium">-{listingFee}g</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                Deploy Listing
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Subtle bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      </div>
    </div>
  );
}
