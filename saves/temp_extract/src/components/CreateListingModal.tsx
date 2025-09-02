"use client";

import { useState } from "react";
import EssenceBar from "./EssenceBar";

interface CreateListingModalProps {
  show: boolean;
  onClose: () => void;
  onCreate: (data: {
    itemType: string;
    itemVariation: string;
    quantity: number;
    pricePerUnit: number;
  }) => void;
  userEssence?: {
    stone: number;
    disco: number;
    paul: number;
    cartoon: number;
    candy: number;
    tiles: number;
    moss: number;
    bullish: number;
    journalist: number;
    laser: number;
    flashbulb: number;
    accordion: number;
    turret: number;
    drill: number;
    security: number;
  };
  userGold?: number;
}

const LISTING_FEE_PERCENTAGE = 2; // 2% listing fee

const DURATION_OPTIONS = [
  { days: 5, label: "5 Days", multiplier: 1 },
  { days: 10, label: "10 Days", multiplier: 1.2 },
  { days: 15, label: "15 Days", multiplier: 1.5 },
  { days: 30, label: "30 Days", multiplier: 2 },
];

export default function CreateListingModal({
  show,
  onClose,
  onCreate,
  userEssence,
  userGold = 0,
}: CreateListingModalProps) {
  const [listingType, setListingType] = useState<"essence" | "head" | "body" | "trait" | "overexposed">("essence");
  const [selectedEssence, setSelectedEssence] = useState<string>("");
  const [essenceAmount, setEssenceAmount] = useState(0);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [essenceSearch, setEssenceSearch] = useState("");
  const [showAnimation, setShowAnimation] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(5); // Default 5 days

  // Get top 5 essence by amount
  const getTopEssences = () => {
    if (!userEssence) return [];
    
    const essences = Object.entries(userEssence)
      .map(([type, amount]) => ({ type, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    return essences;
  };

  // Get all essences for search
  const getAllEssences = () => {
    if (!userEssence) return [];
    
    const searchLower = essenceSearch.toLowerCase();
    return Object.entries(userEssence)
      .map(([type, amount]) => ({ type, amount }))
      .filter(e => e.type.toLowerCase().includes(searchLower))
      .sort((a, b) => b.amount - a.amount);
  };

  const displayedEssences = essenceSearch ? getAllEssences() : getTopEssences();

  // Calculate listing fee
  const calculateFee = () => {
    const price = parseFloat(pricePerUnit) || 0;
    const qty = listingType === "essence" ? essenceAmount : quantity;
    const totalValue = price * qty;
    const baseFee = totalValue * (LISTING_FEE_PERCENTAGE / 100);
    const durationMultiplier = DURATION_OPTIONS.find(d => d.days === selectedDuration)?.multiplier || 1;
    return Math.ceil(baseFee * durationMultiplier);
  };

  const fee = calculateFee();
  const canAffordFee = userGold >= fee;

  const handleSubmit = () => {
    if (!canAffordFee) {
      alert(`Insufficient gold for listing fee. Need ${fee}g, have ${userGold}g`);
      return;
    }

    // Show animation
    setShowAnimation(true);
    
    setTimeout(() => {
      const data = {
        itemType: listingType,
        itemVariation: listingType === "essence" ? selectedEssence : itemName,
        quantity: listingType === "essence" ? essenceAmount : quantity,
        pricePerUnit: parseInt(pricePerUnit),
      };
      
      onCreate(data);
      
      // Reset form
      setSelectedEssence("");
      setEssenceAmount(0);
      setItemName("");
      setQuantity(1);
      setPricePerUnit("");
      setShowAnimation(false);
      onClose();
    }, 1000);
  };

  const getItemThumbnail = (type: string) => {
    const placeholders: Record<string, string> = {
      head: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      body: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      trait: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      overexposed: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    };
    return placeholders[type] || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border-2 border-yellow-500 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Create New Listing</h2>
          
          <div className="space-y-4">
            {/* Item Type Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Item Type</label>
              <select
                value={listingType}
                onChange={(e) => setListingType(e.target.value as typeof listingType)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
              >
                <option value="essence">Essence</option>
                <option value="head">Head</option>
                <option value="body">Body</option>
                <option value="trait">Trait</option>
                <option value="overexposed">Over Exposed</option>
              </select>
            </div>
            
            {/* Essence Selection */}
            {listingType === "essence" && userEssence && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Select Essence</label>
                  <input
                    type="text"
                    value={essenceSearch}
                    onChange={(e) => setEssenceSearch(e.target.value)}
                    placeholder="Search essence..."
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none mb-3"
                  />
                  
                  <div className="space-y-3">
                    {displayedEssences.map(({ type, amount }) => (
                      <div
                        key={type}
                        className={`p-3 bg-gray-800 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedEssence === type
                            ? 'border-yellow-500 bg-gray-700'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                        onClick={() => {
                          setSelectedEssence(type);
                          setEssenceAmount(0);
                        }}
                      >
                        <EssenceBar
                          essenceType={type}
                          currentAmount={amount}
                          sellingAmount={selectedEssence === type ? essenceAmount : 0}
                          onAmountChange={selectedEssence === type ? setEssenceAmount : undefined}
                          showControls={selectedEssence === type}
                          static={true}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {!essenceSearch && (
                    <div className="text-xs text-gray-500 mt-2">
                      Showing top 5 essence by amount. Search to see all.
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Gold per 1 Essence</label>
                  <input
                    type="number"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value)}
                    min="1"
                    placeholder="e.g., 1000 gold per 1 essence"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
            
            {/* Duration Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Listing Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.days}
                    type="button"
                    onClick={() => setSelectedDuration(option.days)}
                    className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                      selectedDuration === option.days
                        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    <div>{option.label}</div>
                    <div className="text-xs opacity-70">
                      {option.multiplier === 1 ? 'Base' : `${option.multiplier}x fee`}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Non-Essence Items */}
            {listingType !== "essence" && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Item Preview</label>
                  <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                    <div 
                      className="w-16 h-16 rounded-lg"
                      style={{ background: getItemThumbnail(listingType) }}
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder="Enter item name..."
                        className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Price Per Unit (Gold)</label>
                  <input
                    type="number"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value)}
                    min="1"
                    placeholder="Enter price in gold"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              </>
            )}
            
            {/* Fee and Total Summary */}
            {pricePerUnit && (
              <div className="p-4 bg-black/50 rounded-lg border border-yellow-500/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Item Value:</span>
                  <span className="text-white">
                    {((listingType === "essence" ? essenceAmount : quantity) * parseInt(pricePerUnit)).toLocaleString()}g
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">
                    {selectedDuration} days
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Listing Fee ({LISTING_FEE_PERCENTAGE}% × duration):</span>
                  <span className={canAffordFee ? "text-yellow-400" : "text-red-400"}>
                    {fee.toLocaleString()}g
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-2 flex justify-between">
                  <span className="text-gray-400">Total Cost:</span>
                  <span className="text-xl font-bold text-yellow-400">
                    {fee.toLocaleString()}g
                  </span>
                </div>
                {!canAffordFee && (
                  <div className="text-red-400 text-sm">
                    Insufficient gold for listing fee!
                  </div>
                )}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                disabled={
                  !pricePerUnit || 
                  (listingType === "essence" ? (!selectedEssence || essenceAmount <= 0) : !itemName) ||
                  !canAffordFee
                }
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-yellow-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Listing ({fee}g fee)
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-800 text-gray-400 font-bold rounded-lg hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animation Overlay */}
      {showAnimation && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[110]">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-400 animate-pulse flex items-center justify-center">
              <div className="text-4xl font-bold text-black">+</div>
            </div>
            <div className="text-2xl text-yellow-400 font-bold">
              Creating Listing...
            </div>
          </div>
        </div>
      )}
    </>
  );
}