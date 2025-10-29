"use client";

import { useState, useEffect, useRef } from "react";

// VERSION 6: FULL MARKET MATCH
// Matches essence market page aesthetic:
// - Transparent glass-morphic cards (Ultra Bright Glass style)
// - Cyan SIPHON-style buttons
// - Industrial uppercase typography
// - STOCK/PRICE card layouts

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

export default function EssenceListingLightboxV6FullMarketMatch({
  show,
  onClose,
  onSubmit,
  ownedEssenceVariations,
  durationOptions,
}: Props) {
  const [selectedVariation, setSelectedVariation] = useState("");
  const [essenceAmount, setEssenceAmount] = useState("0");
  const [pricePerUnit, setPricePerUnit] = useState("0");
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const stockDisplayStyle = 6; // LOCKED to option 6
  const priceDisplayStyle = 4; // LOCKED to option 4
  const commaStyle = 2; // LOCKED to option 2
  const tableStyle = 1; // LOCKED to option 1
  const numberFontStyle = 4; // LOCKED to option 4
  const wheelFontStyle = 7; // LOCKED to option 7
  const titleFontStyle = 1; // LOCKED to option 1

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Helper to sanitize variation name to match bottle filenames
  const sanitizeVariationName = (name: string): string => {
    return name
      .replace(/\s+essence$/i, '') // Remove " Essence" suffix
      .replace(/'/g, '')
      .replace(/\./g, '')
      .replace(/&/g, 'and')
      .replace(/\?/g, '')
      .replace(/\//g, '-')
      .replace(/\\/g, '-')
      .replace(/:/g, '')
      .replace(/\*/g, '')
      .replace(/"/g, '')
      .replace(/</g, '')
      .replace(/>/g, '')
      .replace(/\|/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
  };

  if (!show) return null;

  // Parse price into individual digits (7 places for options 2-4, 5 for option 1)
  const priceNum = parseInt(pricePerUnit) || 0;
  const numDigits = priceDisplayStyle === 1 ? 5 : 7;
  const digits = priceNum.toString().padStart(numDigits, "0").split("").map(Number);

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

  // Helper to determine if a digit should be greyed (leading zero)
  const isLeadingZero = (digitIndex: number): boolean => {
    if (priceDisplayStyle === 1) return false; // Option 1 never greys
    if (priceNum === 0) return true; // All digits grey when price is 0
    const placeValue = 10 ** (numDigits - 1 - digitIndex);
    return priceNum < placeValue;
  };

  // Helper to get font class for numbers based on selected style
  const getNumberFontClass = (size: 'small' | 'medium' | 'large') => {
    const baseClasses = 'font-normal transition-all';

    switch (numberFontStyle) {
      case 1: // Default - Sans-serif, clean
        return `${baseClasses} ${size === 'small' ? 'text-sm' : size === 'medium' ? 'text-base' : 'text-xl'}`;
      case 2: // Thin - Light weight
        return `${baseClasses} font-light ${size === 'small' ? 'text-sm' : size === 'medium' ? 'text-base' : 'text-xl'}`;
      case 3: // Mono - Monospace
        return `${baseClasses} font-mono ${size === 'small' ? 'text-sm' : size === 'medium' ? 'text-base' : 'text-xl'}`;
      case 4: // Medium - Slightly heavier
        return `${baseClasses} font-medium ${size === 'small' ? 'text-sm' : size === 'medium' ? 'text-base' : 'text-xl'}`;
      case 5: // Condensed - Tighter spacing
        return `${baseClasses} ${size === 'small' ? 'text-sm' : size === 'medium' ? 'text-base' : 'text-xl'} tracking-tighter`;
    }
  };

  // Helper to get font style for wheel digits (locked to option 7)
  const getWheelFontStyle = () => {
    return { fontFamily: "'Roboto', sans-serif", fontWeight: 100 };
  };

  // Helper to get font style for title text (locked to option 1)
  const getTitleFontStyle = () => {
    return { fontFamily: 'system-ui, -apple-system' };
  };

  const handleSubmit = () => {
    const priceNum = parseInt(pricePerUnit) || 0;

    if (priceNum < 1) {
      alert('Minimum price is 1 gold. Please set a price of at least 1 gold per essence.');
      return;
    }

    if (selectedDuration === null) {
      alert('Please select a listing duration.');
      return;
    }

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

  // Only show fees if selling at least 0.1 AND price is set
  const showFees = sellingAmount >= 0.1 && priceNum > 0;
  const displayDurationFee = showFees ? listingFee : 0;
  const displayMarketFee = showFees ? marketFee : 0;
  const displayFeeTotal = showFees ? listingFee + marketFee : 0;
  const netProfit = totalValue - displayFeeTotal;

  const shouldPulseThumb = selectedVariation && sellingAmount === 0;
  const shouldPulseArrows = sellingAmount >= 0.1 && priceNum === 0;
  const shouldPulseDuration = priceNum > 0 && selectedDuration === null;

  // Filter and sort essence variations for dropdown
  const filteredAndSortedEssence = ownedEssenceVariations
    .filter(v => v.amount >= 0.1) // Only show if at least 0.1
    .sort((a, b) => b.amount - a.amount); // Sort descending by amount

  return (
    <>
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        {/* Global style for slider pulse animation */}
        <style dangerouslySetInnerHTML={{__html: `
        @keyframes sliderPulseCyan {
          0%, 100% {
            opacity: 0.6;
            box-shadow: 0 0 20px 8px rgba(34, 211, 238, 0.8);
            transform: scale(1);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 40px 15px rgba(34, 211, 238, 1);
            transform: scale(1.4);
          }
        }
        .pulse-indicator-cyan {
          animation: sliderPulseCyan 0.8s ease-in-out infinite;
        }
        @keyframes arrowPulse {
          0%, 100% {
            background-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 0 8px rgba(34, 211, 238, 0.4);
          }
          50% {
            background-color: rgba(34, 211, 238, 0.3);
            box-shadow: 0 0 15px rgba(34, 211, 238, 0.8);
          }
        }
        .pulse-arrows {
          animation: arrowPulse 1s ease-in-out infinite;
        }
        @keyframes durationPulse {
          0%, 100% {
            border-color: rgba(255, 255, 255, 0.2);
            box-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
          }
          50% {
            border-color: rgba(34, 211, 238, 0.6);
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.7);
          }
        }
        .pulse-duration {
          animation: durationPulse 1.2s ease-in-out infinite;
        }
      `}} />

      {/* Main container with Ultra Bright Glass style from market */}
      <div
        className="relative max-w-md w-full rounded-lg overflow-hidden"
        style={{
          background: `linear-gradient(105deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.10) 40%, rgba(255, 255, 255, 0.06) 100%)`,
          backdropFilter: 'blur(4px) brightness(1.25)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent with white gradient (like market cards) */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="p-6">
          {/* Compact header with essence selection */}
          <div className="space-y-2.5">
            {/* NEW LISTING Title - Above dropdown, aligned left */}
            <h2 className="text-base font-bold text-white tracking-wider uppercase">
              New Listing
            </h2>

            {/* Two-column layout: Dropdown + Stock on left, Bottle on right */}
            <div className="flex gap-3">
              {/* Left Column: Dropdown and Stock Card */}
              <div className="flex-1" style={{maxWidth: '65%'}}>
                {/* Essence Dropdown */}
                <div className="mb-2.5">
                  <label className="block text-[10px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
                    Choose Essence
                  </label>

                  <div ref={dropdownRef} className="relative">
                    {/* Selected Value Display - Just show name */}
                    <div
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full px-3 py-2.5 cursor-pointer flex items-center justify-between text-sm uppercase tracking-wide focus:outline-none transition-all ${
                        !selectedVariation
                          ? "border-cyan-500 animate-pulse shadow-lg shadow-cyan-500/40"
                          : "border-white/20"
                      }`}
                      style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(4px)',
                        border: !selectedVariation ? '1px solid rgb(6, 182, 212)' : '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      <span className="text-white">
                        {selectedVariation ? selectedVariation.toUpperCase() : 'Select essence type...'}
                      </span>
                      <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Dropdown Options - Names with amounts */}
                    {isDropdownOpen && (
                      <div
                        className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto z-50"
                        style={{
                          background: 'rgba(10, 10, 10, 0.95)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                        }}
                      >
                        {filteredAndSortedEssence.map((v) => (
                          <div
                            key={v.name}
                            onClick={() => {
                              setSelectedVariation(v.name);
                              setEssenceAmount("0");
                              setIsDropdownOpen(false);
                            }}
                            className="px-3 py-2.5 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between"
                          >
                            <span className="text-white text-sm uppercase tracking-wide">
                              {v.name.toUpperCase()}
                            </span>
                            <span
                              className="text-cyan-400 font-bold text-sm"
                              style={{ textShadow: '0 0 8px rgba(34, 211, 238, 0.6)' }}
                            >
                              {v.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* STOCK Card - Market Style with 6 Display Options */}
                <div
                  className={`rounded-lg p-2.5 transition-opacity ${!selectedVariation ? 'opacity-30 pointer-events-none' : ''}`}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    backdropFilter: 'blur(3px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >

                  {/* OPTION 1: Original Split Layout (Current) */}
                  {stockDisplayStyle === 1 && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-white/50 uppercase tracking-wider">Selling:</span>
                          <span className="text-lg font-bold text-cyan-400">
                            {sellingAmount.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-white/50 uppercase tracking-wider">Remaining:</span>
                          <span className="text-lg font-bold text-white/80">
                            {remainingAmount.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Slider with +/- buttons */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => adjustAmount(false)}
                          disabled={!selectedVariation || sellingAmount <= 0}
                          className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base font-bold"
                        >
                          −
                        </button>

                        <div className="flex-1 relative">
                          {shouldPulseThumb && (
                            <div className="absolute left-0 w-4 h-4 bg-cyan-500 rounded-full pulse-indicator-cyan pointer-events-none z-30" style={{ top: '1px' }} />
                          )}
                          <input
                            type="range"
                            min="0"
                            max={maxAmount || 0}
                            step="0.1"
                            value={essenceAmount}
                            onChange={(e) => setEssenceAmount(e.target.value)}
                            disabled={!selectedVariation}
                            style={{ margin: '0 -8px', width: 'calc(100% + 16px)' }}
                            className={`h-2 bg-gradient-to-r from-black/50 via-cyan-900/40 to-cyan-600/60 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed relative z-20
                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/50
                              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-cyan-500/50
                              ${shouldPulseThumb ? '[&::-webkit-slider-thumb]:opacity-0 [&::-moz-range-thumb]:opacity-0' : ''}`}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => adjustAmount(true)}
                          disabled={!selectedVariation || sellingAmount >= maxAmount}
                          className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OPTION 2: Dual Stacked Bars (Selling fills up, Remaining depletes) */}
                  {stockDisplayStyle === 2 && (
                    <div>
                  {/* Two stacked bars with labels */}
                  <div className="mb-3 space-y-2.5">
                    {/* Selling Bar - Fills from left to right */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-white/50 uppercase tracking-wider">Selling</span>
                        <span className="text-cyan-400 font-bold text-base">{sellingAmount.toFixed(1)}</span>
                      </div>
                      <div className="h-3 bg-black/40 rounded-lg overflow-hidden border border-white/20 relative">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                          style={{
                            width: `${maxAmount > 0 ? (sellingAmount / maxAmount) * 100 : 0}%`,
                            transformOrigin: 'left',
                            willChange: 'width'
                          }}
                        />
                      </div>
                    </div>

                    {/* Remaining Bar - Depletes from right to left */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-white/50 uppercase tracking-wider">Remaining</span>
                        <span className="text-white/80 font-bold text-base">{remainingAmount.toFixed(1)}</span>
                      </div>
                      <div className="h-3 bg-black/40 rounded-lg overflow-hidden border border-white/20 relative">
                        <div
                          className="h-full bg-gradient-to-r from-white/30 to-white/20"
                          style={{
                            width: `${maxAmount > 0 ? (remainingAmount / maxAmount) * 100 : 100}%`,
                            transformOrigin: 'left',
                            willChange: 'width'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slider with +/- buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustAmount(false)}
                      disabled={!selectedVariation || sellingAmount <= 0}
                      className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-lg font-bold"
                    >
                      −
                    </button>

                    <div className="flex-1 relative">
                      {shouldPulseThumb && (
                        <div className="absolute left-0 w-4 h-4 bg-cyan-500 rounded-full pulse-indicator-cyan pointer-events-none z-30" style={{ top: '1px' }} />
                      )}
                      <input
                        type="range"
                        min="0"
                        max={maxAmount || 0}
                        step="0.1"
                        value={essenceAmount}
                        onChange={(e) => setEssenceAmount(e.target.value)}
                        disabled={!selectedVariation}
                        style={{ margin: '0 -8px', width: 'calc(100% + 16px)' }}
                        className={`h-2 bg-gradient-to-r from-black/50 via-cyan-900/40 to-cyan-600/60 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed relative z-20
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/50
                          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-cyan-500/50
                          ${shouldPulseThumb ? '[&::-webkit-slider-thumb]:opacity-0 [&::-moz-range-thumb]:opacity-0' : ''}`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => adjustAmount(true)}
                      disabled={!selectedVariation || sellingAmount >= maxAmount}
                      className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* OPTION 3: Compact Stacked with Connected Container */}
              {stockDisplayStyle === 3 && (
                <div>
                  {/* Unified container with both values */}
                  <div className="mb-3 bg-black/40 border border-white/10 p-2.5 rounded-lg">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                        <span className="text-[9px] text-white/50 uppercase tracking-wider">Selling</span>
                        <span className="text-xl font-bold text-cyan-400" style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}>
                          {sellingAmount.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-white/50 uppercase tracking-wider">Remaining</span>
                        <span className="text-xl font-bold text-white/70">
                          {remainingAmount.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Slider with +/- buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustAmount(false)}
                      disabled={!selectedVariation || sellingAmount <= 0}
                      className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-lg font-bold"
                    >
                      −
                    </button>

                    <div className="flex-1 relative">
                      {shouldPulseThumb && (
                        <div className="absolute left-0 w-4 h-4 bg-cyan-500 rounded-full pulse-indicator-cyan pointer-events-none z-30" style={{ top: '1px' }} />
                      )}
                      <input
                        type="range"
                        min="0"
                        max={maxAmount || 0}
                        step="0.1"
                        value={essenceAmount}
                        onChange={(e) => setEssenceAmount(e.target.value)}
                        disabled={!selectedVariation}
                        style={{ margin: '0 -8px', width: 'calc(100% + 16px)' }}
                        className={`h-2 bg-gradient-to-r from-black/50 via-cyan-900/40 to-cyan-600/60 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed relative z-20
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/50
                          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-cyan-500/50
                          ${shouldPulseThumb ? '[&::-webkit-slider-thumb]:opacity-0 [&::-moz-range-thumb]:opacity-0' : ''}`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => adjustAmount(true)}
                      disabled={!selectedVariation || sellingAmount >= maxAmount}
                      className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* OPTION 4: Condensed dual bars - labels above/below, tight spacing */}
              {stockDisplayStyle === 4 && (
                <div>
                  {/* Condensed dual bars */}
                  <div className="mb-3 space-y-1">
                    {/* Selling label above bar */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-white/50 uppercase tracking-wider">Selling</span>
                      <span className="text-cyan-400 font-bold text-base">{sellingAmount.toFixed(1)}</span>
                    </div>
                    {/* Selling bar */}
                    <div className="h-3 bg-black/40 rounded-lg overflow-hidden border border-white/20 relative">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                        style={{
                          width: `${maxAmount > 0 ? (sellingAmount / maxAmount) * 100 : 0}%`,
                          transformOrigin: 'left',
                          willChange: 'width'
                        }}
                      />
                    </div>

                    {/* Remaining bar (no label above) */}
                    <div className="h-3 bg-black/40 rounded-lg overflow-hidden border border-white/20 relative">
                      <div
                        className="h-full bg-gradient-to-r from-white/30 to-white/20"
                        style={{
                          width: `${maxAmount > 0 ? (remainingAmount / maxAmount) * 100 : 100}%`,
                          transformOrigin: 'left',
                          willChange: 'width'
                        }}
                      />
                    </div>
                    {/* Remaining label below bar */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-white/50 uppercase tracking-wider">Remaining</span>
                      <span className="text-white/80 font-bold text-base">{remainingAmount.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Slider with +/- buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustAmount(false)}
                      disabled={!selectedVariation || sellingAmount <= 0}
                      className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-lg font-bold"
                    >
                      −
                    </button>

                    <div className="flex-1 relative">
                      {shouldPulseThumb && (
                        <div className="absolute left-0 w-4 h-4 bg-cyan-500 rounded-full pulse-indicator-cyan pointer-events-none z-30" style={{ top: '1px' }} />
                      )}
                      <input
                        type="range"
                        min="0"
                        max={maxAmount || 0}
                        step="0.1"
                        value={essenceAmount}
                        onChange={(e) => setEssenceAmount(e.target.value)}
                        disabled={!selectedVariation}
                        style={{ margin: '0 -8px', width: 'calc(100% + 16px)' }}
                        className={`h-2 bg-gradient-to-r from-black/50 via-cyan-900/40 to-cyan-600/60 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed relative z-20
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/50
                          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-cyan-500/50
                          ${shouldPulseThumb ? '[&::-webkit-slider-thumb]:opacity-0 [&::-moz-range-thumb]:opacity-0' : ''}`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => adjustAmount(true)}
                      disabled={!selectedVariation || sellingAmount >= maxAmount}
                      className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* OPTION 5: Thicker bars (h-5) with normal spacing */}
              {stockDisplayStyle === 5 && (
                <div>
                  {/* Two stacked bars with labels - thicker bars */}
                  <div className="mb-3 space-y-2.5">
                    {/* Selling Bar - Fills from left to right */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-white/50 uppercase tracking-wider">Selling</span>
                        <span className="text-cyan-400 font-bold text-base">{sellingAmount.toFixed(1)}</span>
                      </div>
                      <div className="h-5 bg-black/40 rounded-lg overflow-hidden border border-white/20 relative">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                          style={{
                            width: `${maxAmount > 0 ? (sellingAmount / maxAmount) * 100 : 0}%`,
                            transformOrigin: 'left',
                            willChange: 'width'
                          }}
                        />
                      </div>
                    </div>

                    {/* Remaining Bar - Depletes from right to left */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-white/50 uppercase tracking-wider">Remaining</span>
                        <span className="text-white/80 font-bold text-base">{remainingAmount.toFixed(1)}</span>
                      </div>
                      <div className="h-5 bg-black/40 rounded-lg overflow-hidden border border-white/20 relative">
                        <div
                          className="h-full bg-gradient-to-r from-white/30 to-white/20"
                          style={{
                            width: `${maxAmount > 0 ? (remainingAmount / maxAmount) * 100 : 100}%`,
                            transformOrigin: 'left',
                            willChange: 'width'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slider with +/- buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustAmount(false)}
                      disabled={!selectedVariation || sellingAmount <= 0}
                      className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-lg font-bold"
                    >
                      −
                    </button>

                    <div className="flex-1 relative">
                      {shouldPulseThumb && (
                        <div className="absolute left-0 w-4 h-4 bg-cyan-500 rounded-full pulse-indicator-cyan pointer-events-none z-30" style={{ top: '1px' }} />
                      )}
                      <input
                        type="range"
                        min="0"
                        max={maxAmount || 0}
                        step="0.1"
                        value={essenceAmount}
                        onChange={(e) => setEssenceAmount(e.target.value)}
                        disabled={!selectedVariation}
                        style={{ margin: '0 -8px', width: 'calc(100% + 16px)' }}
                        className={`h-2 bg-gradient-to-r from-black/50 via-cyan-900/40 to-cyan-600/60 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed relative z-20
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/50
                          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-cyan-500/50
                          ${shouldPulseThumb ? '[&::-webkit-slider-thumb]:opacity-0 [&::-moz-range-thumb]:opacity-0' : ''}`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => adjustAmount(true)}
                      disabled={!selectedVariation || sellingAmount >= maxAmount}
                      className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* OPTION 6: Thicker selling bar + minimal spacing + labels above/below */}
              {stockDisplayStyle === 6 && (
                <div>
                  {/* Bars with tight spacing and alternate label positioning */}
                  <div className="mb-3">
                    {/* Selling label above */}
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] text-white uppercase tracking-wider">selling</span>
                      <span className="text-cyan-400 font-bold text-lg" style={{ textShadow: '0 0 12px rgba(34, 211, 238, 0.8), 0 0 24px rgba(34, 211, 238, 0.4)' }}>
                        {sellingAmount.toFixed(1)}
                      </span>
                    </div>
                    {/* Selling bar - thicker */}
                    <div className="h-5 bg-black/40 rounded-lg overflow-hidden border border-white/20 relative mb-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                        style={{
                          width: `${maxAmount > 0 ? (sellingAmount / maxAmount) * 100 : 0}%`,
                          transformOrigin: 'left',
                          willChange: 'width'
                        }}
                      />
                    </div>

                    {/* Remaining bar - thinner (half height) */}
                    <div className="h-2.5 bg-black/40 rounded overflow-hidden border border-white/20 relative mb-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-white/30 to-white/20"
                        style={{
                          width: `${maxAmount > 0 ? (remainingAmount / maxAmount) * 100 : 100}%`,
                          transformOrigin: 'left',
                          willChange: 'width'
                        }}
                      />
                    </div>
                    {/* Remaining label below */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-white/40 uppercase tracking-wider">remaining</span>
                      <span className="text-white/60 font-medium text-sm">{remainingAmount.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Slider with +/- buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustAmount(false)}
                      disabled={!selectedVariation || sellingAmount <= 0}
                      className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-lg font-bold"
                    >
                      −
                    </button>

                    <div className="flex-1 relative">
                      {shouldPulseThumb && (
                        <div className="absolute left-0 w-4 h-4 bg-cyan-500 rounded-full pulse-indicator-cyan pointer-events-none z-30" style={{ top: '6px' }} />
                      )}
                      <input
                        type="range"
                        min="0"
                        max={maxAmount || 0}
                        step="0.1"
                        value={essenceAmount}
                        onChange={(e) => setEssenceAmount(e.target.value)}
                        disabled={!selectedVariation}
                        style={{ margin: '0 -8px', width: 'calc(100% + 16px)' }}
                        className={`h-2 bg-gradient-to-r from-black/50 via-cyan-900/40 to-cyan-600/60 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed relative z-20
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/50
                          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-cyan-500/50
                          ${shouldPulseThumb ? '[&::-webkit-slider-thumb]:opacity-0 [&::-moz-range-thumb]:opacity-0' : ''}`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => adjustAmount(true)}
                      disabled={!selectedVariation || sellingAmount >= maxAmount}
                      className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
                </div>
              </div>

              {/* Right Column: Bottle Image */}
              <div className="flex items-center justify-center" style={{flex: '0 0 35%'}}>
                <div className="w-30 h-30 flex items-center justify-center">
                  <img
                    src={selectedVariation ? `/essence-images/named-bottles-1k/${sanitizeVariationName(selectedVariation)}.png` : "/essence-images/gifs/bumble big gif.gif"}
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
            </div>

            {/* PRICE Card - Market Style with Combination Lock */}
            <div
              className={`rounded-lg p-2 transition-opacity ${!selectedVariation || sellingAmount < 0.1 ? 'opacity-30 pointer-events-none' : ''}`}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(3px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >

              {/* OPTION 1: Original with 5 wheels and large display */}
              {priceDisplayStyle === 1 && (
                <>
                  {/* Price Display */}
                  <div className="mb-2.5 text-center py-2.5 bg-black/40 border border-white/10">
                    <div className="text-3xl font-bold text-white font-mono tracking-wide">
                      {priceNum.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">Gold Per Unit</div>
                  </div>

                  {/* Digit Controls - 5 Wheels */}
                  <div className="flex justify-center gap-1.5">
                    {["10000", "1000", "100", "10", "1"].map((place, idx) => (
                      <div key={place} className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => updateDigit(idx, true)}
                          className="w-11 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 border-t border-x border-white/20 text-white/70 hover:text-white transition-all text-xs"
                        >
                          ▴
                        </button>

                        <div className="w-11 h-11 flex items-center justify-center bg-black/60 border-x border-white/20 text-xl font-bold text-white" style={getWheelFontStyle()}>
                          {digits[idx]}
                        </div>

                        <button
                          type="button"
                          onClick={() => updateDigit(idx, false)}
                          className="w-11 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 border-b border-x border-white/20 text-white/70 hover:text-white transition-all text-xs"
                        >
                          ▾
                        </button>

                        <div className="text-[10px] text-white/40 mt-1.5 font-medium uppercase">
                          {place === "10000" ? "10k" : place === "1000" ? "1k" : place === "100" ? "100" : place === "10" ? "10" : "1"}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* OPTION 2: Two-column layout with wheels on left and math table on right */}
              {priceDisplayStyle === 2 && (
                <>
                  <div className="text-center text-[9px] text-white/40 uppercase tracking-wider mb-2">
                    Gold per 1 essence
                  </div>
                  <div className="flex gap-4">
                    {/* Left column: Wheels */}
                    <div className="flex-1 flex justify-center gap-0">
                      {["1000000", "100000", "10000", "1000", "100", "10", "1"].map((place, idx) => {
                        const isGrey = isLeadingZero(idx);
                        return (
                          <div key={place} className="flex flex-col items-center">
                            <button
                              type="button"
                              onClick={() => updateDigit(idx, true)}
                              className="w-7 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 border-t border-x border-white/20 text-white/70 hover:text-white transition-all text-xs"
                            >
                              ▴
                            </button>

                            <div className={`w-7 h-12 flex items-center justify-center bg-black/60 border-x border-white/20 text-2xl font-bold transition-colors ${
                              isGrey ? 'text-white/20' : 'text-white'
                            }`} style={getWheelFontStyle()}>
                              {digits[idx]}
                            </div>

                            <button
                              type="button"
                              onClick={() => updateDigit(idx, false)}
                              className="w-7 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 border-b border-x border-white/20 text-white/70 hover:text-white transition-all text-xs"
                            >
                              ▾
                            </button>

                            <div className="text-[8px] text-white/40 mt-1 font-medium uppercase">
                              {place === "1000000" ? "1M" : place === "100000" ? "100k" : place === "10000" ? "10k" : place === "1000" ? "1k" : place === "100" ? "100" : place === "10" ? "10" : "1"}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right column: Math table */}
                    <div className="flex flex-col justify-center gap-2 min-w-[140px] bg-black/40 border border-white/10 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-white/50 uppercase tracking-wide">gold/1E</span>
                        <span className="text-base font-bold text-white">
                          {priceNum.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-white/50 uppercase tracking-wide">Essence Total</span>
                        <span className="text-base font-bold text-white">
                          {sellingAmount.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/10 pt-2">
                        <span className="text-[10px] text-white/60 uppercase tracking-wide font-bold">Total Value</span>
                        <span className="text-xl font-bold text-cyan-400">
                          {totalValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* OPTION 3: Standard narrower wheels with leading zero greying */}
              {priceDisplayStyle === 3 && (
                <>
                  <div className="text-center text-[9px] text-white/40 uppercase tracking-wider mb-1.5">
                    Price per 1 essence
                  </div>
                  <div className="flex justify-center gap-0.5">
                    {["1000000", "100000", "10000", "1000", "100", "10", "1"].map((place, idx) => {
                      const isGrey = isLeadingZero(idx);
                      return (
                        <div key={place} className="flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => updateDigit(idx, true)}
                            className="w-8 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 border-t border-x border-white/20 text-white/70 hover:text-white transition-all text-xs"
                          >
                            ▴
                          </button>

                          <div className={`w-8 h-9 flex items-center justify-center bg-black/60 border-x border-white/20 text-lg font-bold transition-colors ${
                            isGrey ? 'text-white/20' : 'text-white'
                          }`} style={getWheelFontStyle()}>
                            {digits[idx]}
                          </div>

                          <button
                            type="button"
                            onClick={() => updateDigit(idx, false)}
                            className="w-8 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 border-b border-x border-white/20 text-white/70 hover:text-white transition-all text-xs"
                          >
                            ▾
                          </button>

                          <div className="text-[9px] text-white/40 mt-1 font-medium uppercase">
                            {place === "1000000" ? "1M" : place === "100000" ? "100k" : place === "10000" ? "10k" : place === "1000" ? "1k" : place === "100" ? "100" : place === "10" ? "10" : "1"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* OPTION 4: Two-column layout with 5 comma style variations and 4 table designs */}
              {priceDisplayStyle === 4 && (
                <>
                  <div className="flex gap-4">
                    {/* Left column: Wheels with title above and reset button below */}
                    <div className="flex-1 flex flex-col items-center">
                      {/* Title directly over wheels */}
                      <div className="text-center text-sm text-white uppercase tracking-wide mb-1.5 font-bold" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)', ...getTitleFontStyle() }}>
                        Gold Per One Essence
                      </div>

                      {/* Wheels with comma separators */}
                      <div className="flex justify-center items-center">
                        {["1000000", "100000", "10000", "1000", "100", "10", "1"].map((place, idx) => {
                          const isGrey = isLeadingZero(idx);
                          const isCommaAfter = idx === 0 || idx === 3; // After millions and thousands

                          return (
                            <div key={place} className="flex items-center">
                              <div className="flex flex-col items-center">
                                <button
                                  type="button"
                                  onClick={() => updateDigit(idx, true)}
                                  className={`w-7 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 border-t border-x border-white/20 text-white/70 hover:text-white transition-all text-xs ${shouldPulseArrows ? 'pulse-arrows' : ''}`}
                                >
                                  ▴
                                </button>

                                <div className={`w-7 h-12 flex items-center justify-center bg-black/60 border-x border-white/20 text-2xl font-bold transition-colors ${
                                  isGrey ? 'text-white/20' : 'text-white'
                                }`} style={getWheelFontStyle()}>
                                  {digits[idx]}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => updateDigit(idx, false)}
                                  className={`w-7 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 border-b border-x border-white/20 text-white/70 hover:text-white transition-all text-xs ${shouldPulseArrows ? 'pulse-arrows' : ''}`}
                                >
                                  ▾
                                </button>
                              </div>

                              {/* Comma separators between groups */}
                              {isCommaAfter && (
                                <>
                                  {/* Style 1: Thin vertical line */}
                                  {commaStyle === 1 && (
                                    <div className="w-px h-12 bg-yellow-500/40 mx-0.5" />
                                  )}

                                  {/* Style 2: Floating comma above - colored based on active number */}
                                  {commaStyle === 2 && (() => {
                                    const isMillionsComma = idx === 0;
                                    const isThousandsComma = idx === 3;
                                    const commaIsActive = (isMillionsComma && priceNum >= 1000000) || (isThousandsComma && priceNum >= 1000);

                                    return (
                                      <div className="relative w-2 h-12">
                                        <div className={`absolute top-4 left-1/2 -translate-x-1/2 text-2xl font-bold transition-colors ${
                                          commaIsActive ? 'text-white' : 'text-white/20'
                                        }`} style={{ fontFamily: 'Georgia, serif' }}>
                                          ,
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Style 3: Small gap with centered comma */}
                                  {commaStyle === 3 && (
                                    <div className="flex items-center justify-center w-2 h-12">
                                      <span className="text-white/50 text-base">,</span>
                                    </div>
                                  )}

                                  {/* Style 4: Superscript comma */}
                                  {commaStyle === 4 && (
                                    <div className="relative w-1 h-12">
                                      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-yellow-500/70 text-xs">,</div>
                                    </div>
                                  )}

                                  {/* Style 5: Minimal dot separator */}
                                  {commaStyle === 5 && (
                                    <div className="flex items-center justify-center w-1.5 h-12">
                                      <div className="w-1 h-1 rounded-full bg-white/40" />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Reset text link under wheels */}
                      <div
                        onClick={() => setPricePerUnit("0")}
                        className="mt-1.5 text-xs text-white/40 hover:text-white/70 cursor-pointer transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="inline-block" style={{ transform: 'scaleX(-1)' }}>↻</span>
                        <span>Reset</span>
                      </div>
                    </div>

                    {/* Right column: Math table - 4 different designs */}
                    <div className="w-[160px] flex items-center">
                      {/* TABLE STYLE 1: Standard card with backing */}
                      {tableStyle === 1 && (
                        <div className="w-full flex flex-col justify-center gap-2 bg-black/40 border border-white/10 p-3 rounded">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/50 uppercase tracking-wide">G/E</span>
                            <span className={`${getNumberFontClass('medium')} text-white`}>
                              {priceNum.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-cyan-400/70 uppercase tracking-wide">Essence</span>
                            <span className={`${getNumberFontClass('medium')} text-cyan-400`}>
                              {sellingAmount.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-1">
                            <span className="text-[11px] text-white/60 uppercase tracking-wide font-bold">Total</span>
                            <div className="min-h-[28px] flex items-center">
                              <span className={`${totalValue >= 1000000 ? getNumberFontClass('medium') : getNumberFontClass('large')} text-yellow-500`} style={{ textShadow: '0 0 10px rgba(234, 179, 8, 0.5)' }}>
                                {totalValue.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TABLE STYLE 2: NO backing card - just text */}
                      {tableStyle === 2 && (
                        <div className="w-full flex flex-col justify-center gap-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">G/E</span>
                            <span className={`${getNumberFontClass('medium')} text-white`}>
                              {priceNum.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-cyan-400/50 uppercase tracking-widest font-bold">ESSENCE</span>
                            <span className={`${getNumberFontClass('medium')} text-cyan-400`} style={{ textShadow: '0 0 8px rgba(34, 211, 238, 0.5)' }}>
                              {sellingAmount.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t-2 border-yellow-500/30">
                            <span className="text-xs text-yellow-400/70 uppercase tracking-widest font-bold">TOTAL</span>
                            <div className="min-h-[32px] flex items-center">
                              <span className={`${totalValue >= 1000000 ? 'text-lg' : 'text-2xl'} ${getNumberFontClass('large')} text-yellow-500`} style={{ textShadow: '0 0 12px rgba(234, 179, 8, 0.6)' }}>
                                {totalValue.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TABLE STYLE 3: Compact stacked with individual borders */}
                      {tableStyle === 3 && (
                        <div className="w-full flex flex-col gap-1.5">
                          <div className="bg-black/40 border border-white/10 px-3 py-2 rounded flex justify-between items-center">
                            <span className="text-[9px] text-white/40 uppercase tracking-wider">G/E</span>
                            <span className={`${getNumberFontClass('small')} text-white`}>
                              {priceNum.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-cyan-900/20 border border-cyan-400/20 px-3 py-2 rounded flex justify-between items-center">
                            <span className="text-[9px] text-cyan-400/60 uppercase tracking-wider">Essence</span>
                            <span className={`${getNumberFontClass('small')} text-cyan-400`}>
                              {sellingAmount.toFixed(1)}
                            </span>
                          </div>
                          <div className="bg-yellow-900/20 border-2 border-yellow-500/40 px-3 py-2.5 rounded flex justify-between items-center min-h-[52px]">
                            <span className="text-[10px] text-yellow-400/80 uppercase tracking-wider font-bold">Total</span>
                            <div className="min-h-[28px] flex items-center">
                              <span className={`${totalValue >= 1000000 ? getNumberFontClass('medium') : getNumberFontClass('large')} text-yellow-500`} style={{ textShadow: '0 0 10px rgba(234, 179, 8, 0.5)' }}>
                                {totalValue.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TABLE STYLE 4: Vertical card with large total emphasis */}
                      {tableStyle === 4 && (
                        <div className="w-full bg-gradient-to-b from-black/50 to-black/30 border border-white/10 rounded p-3 flex flex-col gap-3">
                          <div className="text-center space-y-1">
                            <div className="text-[8px] text-white/30 uppercase tracking-widest">Price</div>
                            <div className={`${getNumberFontClass('small')} text-white`}>
                              {priceNum.toLocaleString()}
                            </div>
                            <div className="text-[8px] text-white/30 uppercase">G/E</div>
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                          <div className="text-center space-y-1">
                            <div className="text-[8px] text-cyan-400/40 uppercase tracking-widest">Amount</div>
                            <div className={`${getNumberFontClass('medium')} text-cyan-400`}>
                              {sellingAmount.toFixed(1)}
                            </div>
                            <div className="text-[8px] text-cyan-400/40 uppercase">Essence</div>
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
                          <div className="text-center space-y-1 bg-yellow-500/5 border border-yellow-500/20 rounded py-2 min-h-[64px] flex flex-col justify-center">
                            <div className="text-[9px] text-yellow-400/60 uppercase tracking-widest font-bold">Total Value</div>
                            <div className="min-h-[32px] flex items-center justify-center">
                              <div className={`${totalValue >= 1000000 ? 'text-xl' : 'text-2xl'} ${getNumberFontClass('large')} text-yellow-500`} style={{ textShadow: '0 0 12px rgba(234, 179, 8, 0.6)' }}>
                                {totalValue.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* OPTION 5: Condensed font with tight spacing */}
              {priceDisplayStyle === 5 && (
                <>
                  <div className="text-center text-[9px] text-white/40 uppercase tracking-wider mb-1.5">
                    Price per 1 essence
                  </div>
                  <div className="flex justify-center" style={{ gap: '1px' }}>
                    {["1000000", "100000", "10000", "1000", "100", "10", "1"].map((place, idx) => {
                      const isGrey = isLeadingZero(idx);
                      return (
                        <div key={place} className="flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => updateDigit(idx, true)}
                            className="w-7 h-5 flex items-center justify-center bg-white/10 hover:bg-white/20 border-t border-x border-white/20 text-white/70 hover:text-white transition-all text-[10px]"
                          >
                            ▴
                          </button>

                          <div
                            className={`w-7 h-10 flex items-center justify-center bg-black/60 border-x border-white/20 text-xl font-bold transition-colors ${
                              isGrey ? 'text-white/20' : 'text-white'
                            }`}
                            style={getWheelFontStyle()}
                          >
                            {digits[idx]}
                          </div>

                          <button
                            type="button"
                            onClick={() => updateDigit(idx, false)}
                            className="w-7 h-5 flex items-center justify-center bg-white/10 hover:bg-white/20 border-b border-x border-white/20 text-white/70 hover:text-white transition-all text-[10px]"
                          >
                            ▾
                          </button>

                          <div className="text-[8px] text-white/40 mt-0.5 font-medium uppercase">
                            {place === "1000000" ? "1M" : place === "100000" ? "100k" : place === "10000" ? "10k" : place === "1000" ? "1k" : place === "100" ? "100" : place === "10" ? "10" : "1"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Duration */}
            <div className={`transition-opacity ${priceNum === 0 ? 'opacity-30 pointer-events-none' : ''}`}>
              <label className="block text-[10px] font-bold text-white/70 mb-1.5 uppercase tracking-wider">
                Listing Duration
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {durationOptions.map((opt) => (
                  <div key={opt.days} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedDuration(opt.days)}
                      className={`w-full py-2.5 text-xs font-bold uppercase tracking-wider border transition-all ${
                        selectedDuration === opt.days
                          ? "bg-cyan-500 text-white border-cyan-400/30 shadow-lg shadow-cyan-500/30"
                          : "bg-white/5 text-white/60 border-white/20 hover:border-white/40 hover:text-white/80"
                      } ${shouldPulseDuration ? 'pulse-duration' : ''}`}
                    >
                      {opt.days}D
                    </button>
                    {/* Locked to Style 2: Gold-yellow, medium size, lowercase g */}
                    <div className="mt-1 text-[11px] text-yellow-500 font-medium tracking-wide">
                      {opt.cost}g
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div
              className={`rounded-lg p-2.5 space-y-1.5 transition-opacity ${!selectedVariation || sellingAmount < 0.1 ? 'opacity-30 pointer-events-none' : ''}`}
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(3px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm font-bold uppercase tracking-wide">Total Value</span>
                <span className="text-cyan-400 font-medium text-lg">
                  {totalValue.toLocaleString()}g
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/10 pt-1.5">
                <span className="text-white/50 uppercase text-xs tracking-wide">Duration Fee</span>
                <span className="text-gray-400 font-medium">
                  {displayDurationFee > 0 ? `-${displayDurationFee.toLocaleString()}g` : '0g'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50 uppercase text-xs tracking-wide">Market Fee (2%)</span>
                <span className="text-gray-400 font-medium">
                  {displayMarketFee > 0 ? `-${Math.round(displayMarketFee).toLocaleString()}g` : '0g'}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/10 pt-1.5 font-bold">
                <span className="text-white/60 uppercase text-xs tracking-wide">Fee Total</span>
                <span className={displayFeeTotal > 0 ? "text-red-400" : "text-white/70"}>
                  {displayFeeTotal > 0 ? `-${Math.round(displayFeeTotal).toLocaleString()}g` : '0g'}
                </span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-white/20 pt-1.5 mt-1.5">
                <span className={`text-sm font-bold uppercase tracking-wide ${netProfit >= 1 ? 'text-green-400' : 'text-white/70'}`}>
                  Net Profit
                </span>
                <span
                  className={`font-bold text-2xl ${
                    netProfit >= 1 ? 'text-green-400' : 'text-white/70'
                  }`}
                  style={{
                    textShadow: netProfit >= 1
                      ? '0 0 10px rgba(74, 222, 128, 0.6), 0 0 20px rgba(74, 222, 128, 0.3)'
                      : 'none'
                  }}
                >
                  {Math.round(netProfit).toLocaleString()}g
                </span>
              </div>
            </div>

            {/* Actions - LIST Button Style */}
            <div className={`flex gap-2 pt-2 transition-opacity ${!selectedVariation || sellingAmount < 0.1 || selectedDuration === null ? 'opacity-30' : ''}`}>
              <button
                onClick={handleSubmit}
                disabled={!selectedVariation || sellingAmount < 0.1 || selectedDuration === null}
                className="flex-1 py-3 px-4 font-bold uppercase tracking-[0.3em] text-base rounded-lg bg-cyan-500 border border-cyan-400/30 text-white hover:bg-cyan-600 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  textShadow: '0 0 7px rgba(255,255,255,0.6), 0 0 14px rgba(255,255,255,0.4)'
                }}
              >
                LIST
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-bold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </div>
    </>
  );
}
