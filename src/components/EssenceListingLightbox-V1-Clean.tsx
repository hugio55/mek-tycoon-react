"use client";

import { useState } from "react";

// VERSION 1: CLEAN & MINIMAL
// Simple, uncluttered design with subtle borders and clean typography

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

export default function EssenceListingLightboxV1Clean({
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-1">
            List Essence
          </h2>
          <p className="text-sm text-gray-400">
            Create a new marketplace listing
          </p>
        </div>

        <div className="space-y-5">
          {/* Essence Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Essence Variation
            </label>
            <select
              value={selectedVariation}
              onChange={(e) => setSelectedVariation(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-yellow-400 focus:border-yellow-500 focus:outline-none"
            >
              <option value="">Select essence...</option>
              {ownedEssenceVariations.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.amount.toFixed(2)} owned)
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={essenceAmount}
              onChange={(e) => setEssenceAmount(e.target.value)}
              min="0.1"
              step="0.1"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-yellow-400 focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Price with Combination Lock Controls */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price Per Unit (Gold)
            </label>

            {/* Price Display */}
            <div className="mb-3 text-center py-3 bg-gray-800 border border-gray-600 rounded">
              <div className="text-3xl font-bold text-yellow-400 font-mono">
                {priceNum.toLocaleString()}
                <span className="text-lg text-gray-500 ml-1">g</span>
              </div>
            </div>

            {/* Digit Controls - Combination Lock Style */}
            <div className="flex justify-center gap-2">
              {["10000", "1000", "100", "10", "1"].map((place, idx) => (
                <div key={place} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => updateDigit(idx, true)}
                    className="w-10 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-t text-gray-300 hover:text-yellow-400 transition-colors"
                  >
                    ▲
                  </button>

                  <div className="w-10 h-10 flex items-center justify-center bg-gray-800 border-x border-gray-600 text-xl font-mono text-yellow-400">
                    {digits[idx]}
                  </div>

                  <button
                    type="button"
                    onClick={() => updateDigit(idx, false)}
                    className="w-10 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-b text-gray-300 hover:text-yellow-400 transition-colors"
                  >
                    ▼
                  </button>

                  <div className="text-xs text-gray-500 mt-1">
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Listing Duration
            </label>
            <div className="grid grid-cols-5 gap-2">
              {durationOptions.map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setSelectedDuration(opt.days)}
                  className={`py-2 px-1 rounded text-sm font-medium transition-colors ${
                    selectedDuration === opt.days
                      ? "bg-yellow-500 text-black"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {opt.days}d
                </button>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Listing fee: <span className="text-yellow-500">{listingFee}g</span>
            </div>
          </div>

          {/* Summary */}
          {pricePerUnit && essenceAmount && (
            <div className="bg-gray-800 border border-gray-600 rounded p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total value:</span>
                <span className="text-yellow-400 font-bold">
                  {(parseInt(pricePerUnit) * parseFloat(essenceAmount)).toLocaleString()}g
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Listing fee:</span>
                <span className="text-red-400">-{listingFee}g</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded transition-colors"
            >
              Create Listing
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
