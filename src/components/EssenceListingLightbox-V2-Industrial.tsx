"use client";

import { useState } from "react";

// VERSION 2: INDUSTRIAL FRAME
// Yellow borders, angled corners, mechanical aesthetic

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

export default function EssenceListingLightboxV2Industrial({
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
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Angled frame container */}
      <div
        className="relative bg-black border-2 border-yellow-500/60 max-w-md w-full p-6"
        style={{
          clipPath:
            "polygon(0 12px, 12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px))",
        }}
      >
        {/* Corner accents */}
        <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-yellow-500" />
        <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-yellow-500" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-yellow-500" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-yellow-500" />

        {/* Header */}
        <div className="mb-6 pb-3 border-b-2 border-yellow-500/30">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-yellow-500" />
            <h2 className="text-2xl font-bold text-yellow-400 uppercase tracking-wider">
              Market Listing
            </h2>
          </div>
        </div>

        <div className="space-y-5">
          {/* Essence Selection */}
          <div>
            <label className="block text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">
              ▸ Essence Type
            </label>
            <select
              value={selectedVariation}
              onChange={(e) => setSelectedVariation(e.target.value)}
              className="w-full px-3 py-2 bg-black border-2 border-yellow-500/40 text-yellow-400 uppercase tracking-wide focus:border-yellow-500 focus:outline-none"
            >
              <option value="">Select...</option>
              {ownedEssenceVariations.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.amount.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">
              ▸ Quantity
            </label>
            <input
              type="number"
              value={essenceAmount}
              onChange={(e) => setEssenceAmount(e.target.value)}
              min="0.1"
              step="0.1"
              className="w-full px-3 py-2 bg-black border-2 border-yellow-500/40 text-yellow-400 focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Price with Combination Lock Controls */}
          <div>
            <label className="block text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">
              ▸ Unit Price
            </label>

            {/* Price Display */}
            <div className="mb-3 text-center py-3 bg-yellow-500/5 border-2 border-yellow-500/30">
              <div className="text-3xl font-bold text-yellow-400 font-mono tracking-wider">
                {priceNum.toLocaleString()}
                <span className="text-lg text-yellow-500/60 ml-2">GOLD</span>
              </div>
            </div>

            {/* Digit Controls - Combination Lock Style */}
            <div className="flex justify-center gap-2">
              {["10000", "1000", "100", "10", "1"].map((place, idx) => (
                <div key={place} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateDigit(idx, true)}
                    className="w-12 h-8 flex items-center justify-center bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/50 text-yellow-400 transition-colors"
                  >
                    ▲
                  </button>

                  <div className="w-12 h-12 flex items-center justify-center bg-black border-2 border-yellow-500/50 text-2xl font-mono font-bold text-yellow-400">
                    {digits[idx]}
                  </div>

                  <button
                    type="button"
                    onClick={() => updateDigit(idx, false)}
                    className="w-12 h-8 flex items-center justify-center bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/50 text-yellow-400 transition-colors"
                  >
                    ▼
                  </button>

                  <div className="text-[10px] font-bold text-yellow-500/60 uppercase">
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
            <label className="block text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">
              ▸ Duration
            </label>
            <div className="grid grid-cols-5 gap-2">
              {durationOptions.map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setSelectedDuration(opt.days)}
                  className={`py-2 text-sm font-bold uppercase border-2 transition-colors ${
                    selectedDuration === opt.days
                      ? "bg-yellow-500 text-black border-yellow-400"
                      : "bg-black text-yellow-500/60 border-yellow-500/30 hover:border-yellow-500/60"
                  }`}
                >
                  {opt.days}D
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400 uppercase tracking-wide">
              Fee: <span className="text-yellow-500 font-bold">{listingFee}g</span>
            </div>
          </div>

          {/* Summary */}
          {pricePerUnit && essenceAmount && (
            <div className="bg-yellow-500/5 border-2 border-yellow-500/30 p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400 uppercase text-xs">Total:</span>
                <span className="text-yellow-400 font-bold font-mono">
                  {(parseInt(pricePerUnit) * parseFloat(essenceAmount)).toLocaleString()}g
                </span>
              </div>
              <div className="flex justify-between border-t border-yellow-500/20 pt-1">
                <span className="text-gray-400 uppercase text-xs">Fee:</span>
                <span className="text-red-400 font-bold">-{listingFee}g</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider transition-colors"
            >
              Deploy
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-black hover:bg-gray-900 border-2 border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300 font-bold uppercase tracking-wider transition-colors"
            >
              Abort
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
