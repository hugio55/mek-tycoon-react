"use client";

import { useState, useMemo } from "react";

// VERSION 5: YELLOW GRADIENT
// Black-to-yellow gradient theme with slider-based quantity selection

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

export default function EssenceListingLightboxV5YellowGradient({
  show,
  onClose,
  onSubmit,
  ownedEssenceVariations,
  durationOptions,
}: Props) {
  const [selectedVariation, setSelectedVariation] = useState("");
  const [essenceAmount, setEssenceAmount] = useState("0");
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

  const adjustAmount = (increment: boolean) => {
    const currentAmount = parseFloat(essenceAmount) || 0;
    const step = 0.1;
    let newAmount = increment ? currentAmount + step : currentAmount - step;

    // Clamp between 0 and maxAmount
    newAmount = Math.max(0, Math.min(newAmount, maxAmount));

    // Round to 1 decimal place to avoid floating point issues
    newAmount = Math.round(newAmount * 10) / 10;

    setEssenceAmount(String(newAmount));
  };

  const listingFee =
    durationOptions.find((d) => d.days === selectedDuration)?.cost || 0;

  // Get the max amount for the selected variation
  const selectedVariationData = ownedEssenceVariations.find(
    (v) => v.name === selectedVariation
  );
  const maxAmount = selectedVariationData?.amount || 0;

  // Calculate remaining amount
  const sellingAmount = parseFloat(essenceAmount) || 0;
  const remainingAmount = maxAmount - sellingAmount;

  // Calculate fees
  const totalValue = priceNum * sellingAmount;
  const marketFee = totalValue * 0.02;

  // Only show fees if selling at least 0.1
  const showFees = sellingAmount >= 0.1;
  const displayDurationFee = showFees ? listingFee : 0;
  const displayMarketFee = showFees ? marketFee : 0;
  const displayFeeTotal = showFees ? listingFee + marketFee : 0;
  const netProfit = totalValue - displayFeeTotal;

  const shouldPulseThumb = selectedVariation && sellingAmount === 0;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* Global style for slider pulse animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sliderPulse {
          0%, 100% {
            opacity: 0.6;
            box-shadow: 0 0 20px 8px rgba(234, 179, 8, 0.8);
            transform: scale(1);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 40px 15px rgba(234, 179, 8, 1);
            transform: scale(1.4);
          }
        }
        .pulse-indicator {
          animation: sliderPulse 0.8s ease-in-out infinite;
        }
      `}} />

      {/* Main container with yellow gradient */}
      <div
        className="relative bg-gradient-to-br from-black via-gray-950 to-yellow-900/20 border border-yellow-600/40 shadow-2xl shadow-yellow-900/20 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent with yellow gradient */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />

        <div className="p-6">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-yellow-200 tracking-tight">
                New Listing
              </h2>
              <p className="text-xs text-yellow-700/70 mt-0.5">
                Market deployment protocol
              </p>
            </div>

            {/* Essence Bottle Image - Floating */}
            <div className="w-20 h-20 flex items-center justify-center">
              <img
                src="/essence-images/1k base.png"
                alt={selectedVariation || "Essence bottle"}
                className={`w-full h-full object-contain ${
                  !selectedVariation ? "brightness-0 invert opacity-20" : ""
                }`}
                style={
                  !selectedVariation
                    ? { filter: "brightness(0) saturate(0) invert(0.4)" }
                    : undefined
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            {/* Essence Selection */}
            <div>
              <label className="block text-xs font-medium text-yellow-600/80 mb-1.5">
                ESSENCE TYPE
              </label>
              <select
                value={selectedVariation}
                onChange={(e) => {
                  setSelectedVariation(e.target.value);
                  setEssenceAmount("0"); // Reset amount when changing variation
                }}
                className={`w-full px-3 py-2.5 bg-black/60 border text-yellow-200 text-sm focus:border-yellow-600 focus:outline-none transition-all ${
                  !selectedVariation
                    ? "border-yellow-500 animate-pulse shadow-lg shadow-yellow-500/40"
                    : "border-yellow-700/40"
                }`}
                style={
                  !selectedVariation
                    ? { animationDuration: "1s" }
                    : undefined
                }
              >
                <option value="">Select essence type...</option>
                {ownedEssenceVariations.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} · {v.amount.toFixed(2)} units
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Slider */}
            <div>
              <label className="block text-xs font-medium text-yellow-600/80 mb-1.5">
                QUANTITY
              </label>

              {/* Visual feedback - Selling/Remaining */}
              <div className="mb-3 flex items-center justify-between px-3 py-2 bg-black/40 border border-yellow-700/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-yellow-700/70">Selling:</span>
                  <span className="text-lg font-bold text-green-400">
                    {sellingAmount.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-yellow-700/70">Remaining:</span>
                  <span className="text-lg font-bold text-red-400">
                    {remainingAmount.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Slider with +/- buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustAmount(false)}
                  disabled={!selectedVariation || sellingAmount <= 0}
                  className="w-8 h-8 flex items-center justify-center bg-gradient-to-b from-yellow-900/30 to-black hover:from-yellow-800/40 hover:to-black border border-yellow-700/40 text-yellow-600/70 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-lg font-bold"
                >
                  −
                </button>

                <div className="flex-1 relative">
                  {/* Pulsing indicator when slider is at 0 - positioned to overlap with slider thumb */}
                  {shouldPulseThumb && (
                    <div className="absolute left-0 w-4 h-4 bg-yellow-500 rounded-full pulse-indicator pointer-events-none z-30" style={{ top: '1px' }} />
                  )}

                  <input
                    type="range"
                    min="0"
                    max={maxAmount || 0}
                    step="0.1"
                    value={essenceAmount}
                    onChange={(e) => setEssenceAmount(e.target.value)}
                    disabled={!selectedVariation}
                    className={`w-full h-2 bg-gradient-to-r from-black via-yellow-900/40 to-yellow-600/60 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed relative z-20
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-yellow-500/50
                      [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-yellow-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-yellow-500/50
                      ${shouldPulseThumb ? '[&::-webkit-slider-thumb]:opacity-0 [&::-moz-range-thumb]:opacity-0' : ''}`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => adjustAmount(true)}
                  disabled={!selectedVariation || sellingAmount >= maxAmount}
                  className="w-8 h-8 flex items-center justify-center bg-gradient-to-b from-yellow-900/30 to-black hover:from-yellow-800/40 hover:to-black border border-yellow-700/40 text-yellow-600/70 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price with Combination Lock Controls */}
            <div>
              <label className="block text-xs font-medium text-yellow-600/80 mb-1.5">
                UNIT PRICE (GOLD/ 1 ESSENCE)
              </label>

              {/* Price Display */}
              <div className="mb-3 text-center py-4 bg-gradient-to-br from-black via-yellow-950/20 to-yellow-900/10 border border-yellow-700/40">
                <div className="text-3xl font-bold text-yellow-300 font-mono tracking-wide">
                  {priceNum.toLocaleString()}
                </div>
                <div className="text-xs text-yellow-700/60 mt-1">GOLD PER UNIT</div>
              </div>

              {/* Digit Controls - Combination Lock Style */}
              <div className="flex justify-center gap-1.5">
                {["10000", "1000", "100", "10", "1"].map((place, idx) => (
                  <div key={place} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => updateDigit(idx, true)}
                      className="w-11 h-7 flex items-center justify-center bg-gradient-to-b from-yellow-900/30 to-black hover:from-yellow-800/40 hover:to-black border-t border-x border-yellow-700/40 text-yellow-600/70 hover:text-yellow-400 transition-all text-xs"
                    >
                      ▴
                    </button>

                    <div className="w-11 h-11 flex items-center justify-center bg-black border-x border-yellow-700/40 text-xl font-mono font-bold text-yellow-300">
                      {digits[idx]}
                    </div>

                    <button
                      type="button"
                      onClick={() => updateDigit(idx, false)}
                      className="w-11 h-7 flex items-center justify-center bg-gradient-to-t from-yellow-900/30 to-black hover:from-yellow-800/40 hover:to-black border-b border-x border-yellow-700/40 text-yellow-600/70 hover:text-yellow-400 transition-all text-xs"
                    >
                      ▾
                    </button>

                    <div className="text-[10px] text-yellow-700/60 mt-1.5 font-medium">
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
              <label className="block text-xs font-medium text-yellow-600/80 mb-1.5">
                LISTING DURATION
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {durationOptions.map((opt) => (
                  <div key={opt.days} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedDuration(opt.days)}
                      className={`w-full py-2.5 text-xs font-medium border transition-all ${
                        selectedDuration === opt.days
                          ? "bg-gradient-to-b from-yellow-600 to-yellow-700 text-black border-yellow-500 shadow-lg shadow-yellow-600/30"
                          : "bg-black/60 text-yellow-700/60 border-yellow-700/30 hover:border-yellow-600/50 hover:text-yellow-600/80"
                      }`}
                    >
                      {opt.days}D
                    </button>
                    <div className="mt-1 text-[10px] text-yellow-600/60 font-medium">
                      {opt.cost}g
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary with Updated Fee Structure */}
            <div className="bg-gradient-to-br from-black to-yellow-950/20 border border-yellow-700/40 p-3 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-yellow-700/70 text-sm font-bold">Total Value</span>
                <span className="text-yellow-300 font-medium text-lg">
                  {totalValue.toLocaleString()}g
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-yellow-900/30 pt-1.5">
                <span className="text-yellow-700/70">Duration Fee</span>
                <span className="text-red-400 font-medium">-{displayDurationFee}g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-700/70">Market Fee (2%)</span>
                <span className="text-red-400 font-medium">-{Math.round(displayMarketFee)}g</span>
              </div>
              <div className="flex justify-between text-sm border-t border-yellow-900/30 pt-1.5 font-bold">
                <span className="text-yellow-600">Fee Total</span>
                <span className="text-red-400">-{Math.round(displayFeeTotal)}g</span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-yellow-700/40 pt-1.5 mt-1.5">
                <span className={`text-sm font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Net Potential Profit
                </span>
                <span
                  className={`font-bold text-2xl ${
                    netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                  style={{
                    textShadow: netProfit >= 0
                      ? '0 0 10px rgba(74, 222, 128, 0.6), 0 0 20px rgba(74, 222, 128, 0.3)'
                      : '0 0 10px rgba(248, 113, 113, 0.6), 0 0 20px rgba(248, 113, 113, 0.3)'
                  }}
                >
                  {Math.round(netProfit).toLocaleString()}g
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 bg-gradient-to-b from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-black font-medium transition-all shadow-lg shadow-yellow-600/20"
              >
                Deploy Listing
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-black/60 hover:bg-black/80 border border-yellow-700/40 hover:border-yellow-600/60 text-yellow-600/80 hover:text-yellow-500 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Bottom accent with yellow gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
      </div>
    </div>
  );
}
