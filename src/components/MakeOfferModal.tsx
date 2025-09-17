import { useState, useEffect } from 'react';
import ShopSystem from '@/lib/shopSystem';

interface MakeOfferModalProps {
  listing: {
    _id: string;
    itemVariation?: string;
    pricePerUnit: number;
    quantity: number;
    rarity?: string;
    marketAverage?: number;
    sellerName?: string;
  };
  userGold: number;
  onClose: () => void;
  onSubmit: (offer: OfferData) => void;
}

interface OfferData {
  listingId: string;
  offerPrice: number;
  quantity: number;
  message?: string;
  expiration: number; // hours
}

export default function MakeOfferModal({ listing, userGold, onClose, onSubmit }: MakeOfferModalProps) {
  const totalListingPrice = listing.pricePerUnit * listing.quantity;
  const suggestedPrice = ShopSystem.calculateSuggestedPrice({
    basePrice: listing.pricePerUnit,
    rarity: listing.rarity || 'common',
    marketAverage: listing.marketAverage
  });

  const [offerAmount, setOfferAmount] = useState(Math.round(totalListingPrice * 0.85));
  const [offerQuantity, setOfferQuantity] = useState(listing.quantity);
  const [message, setMessage] = useState('');
  const [expiration, setExpiration] = useState(24); // Default 24 hours
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate offer percentage
  const offerPercentage = Math.round((offerAmount / totalListingPrice) * 100);
  const canAfford = userGold >= offerAmount;
  const isGoodOffer = offerAmount >= totalListingPrice * 0.75;
  const isLowball = offerAmount < totalListingPrice * 0.5;

  const handleSubmit = () => {
    if (!canAfford || offerAmount <= 0) return;

    onSubmit({
      listingId: listing._id,
      offerPrice: offerAmount,
      quantity: offerQuantity,
      message: message.trim() || undefined,
      expiration
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black/90 border-2 border-yellow-500/50 rounded-lg max-w-lg w-full">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-500/20 to-transparent p-4 border-b border-yellow-500/30">
          <div className="absolute inset-0 mek-overlay-hazard-stripes opacity-20 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <h2 className="text-xl font-bold text-yellow-400 uppercase tracking-wider">Make Offer</h2>
            <button
              onClick={onClose}
              className="text-yellow-500/50 hover:text-yellow-400 transition-colors text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Item Info */}
          <div className="bg-black/50 border border-gray-700/50 rounded p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-xs uppercase">Item</span>
              <span className="text-yellow-400 font-bold">{listing.itemVariation}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs uppercase">Asking Price</span>
              <span className="text-white font-bold">{totalListingPrice.toLocaleString()}g</span>
            </div>
            {listing.marketAverage && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-400 text-xs uppercase">Market Average</span>
                <span className="text-gray-300">{listing.marketAverage.toLocaleString()}g</span>
              </div>
            )}
          </div>

          {/* Offer Amount */}
          <div className="space-y-2">
            <label className="text-yellow-400 text-xs uppercase font-bold">Your Offer</label>
            <div className="relative">
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-black/60 border border-yellow-500/30 text-white rounded focus:border-yellow-500 focus:outline-none"
                placeholder="Enter offer amount..."
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400 font-bold">
                {offerPercentage}%
              </div>
            </div>

            {/* Quick Offer Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setOfferAmount(Math.round(totalListingPrice * 0.5))}
                className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded transition-colors"
              >
                50%
              </button>
              <button
                onClick={() => setOfferAmount(Math.round(totalListingPrice * 0.75))}
                className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded transition-colors"
              >
                75%
              </button>
              <button
                onClick={() => setOfferAmount(Math.round(totalListingPrice * 0.85))}
                className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded transition-colors"
              >
                85%
              </button>
              <button
                onClick={() => setOfferAmount(Math.round(totalListingPrice * 0.95))}
                className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded transition-colors"
              >
                95%
              </button>
              <button
                onClick={() => setOfferAmount(totalListingPrice)}
                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-black text-xs rounded transition-colors font-bold"
              >
                FULL
              </button>
            </div>

            {/* Offer Status */}
            <div className="text-xs">
              {isLowball && (
                <div className="text-red-400">⚠ Low offer - likely to be rejected</div>
              )}
              {!canAfford && (
                <div className="text-red-400">⚠ Insufficient gold</div>
              )}
              {isGoodOffer && canAfford && (
                <div className="text-green-400">✓ Reasonable offer</div>
              )}
            </div>
          </div>

          {/* Advanced Options */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-yellow-400 text-xs hover:text-yellow-300 transition-colors flex items-center gap-1"
          >
            <span>{showAdvanced ? '▼' : '▶'}</span>
            Advanced Options
          </button>

          {showAdvanced && (
            <div className="space-y-3 p-3 bg-black/30 rounded border border-gray-800">
              {/* Quantity */}
              <div className="space-y-1">
                <label className="text-gray-400 text-xs uppercase">Quantity</label>
                <input
                  type="number"
                  value={offerQuantity}
                  onChange={(e) => setOfferQuantity(Math.min(listing.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                  min="1"
                  max={listing.quantity}
                  className="w-full px-3 py-1.5 bg-black/60 border border-gray-700 text-white rounded text-sm focus:border-yellow-500 focus:outline-none"
                />
                <div className="text-gray-500 text-xs">Max: {listing.quantity}</div>
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="text-gray-400 text-xs uppercase">Message (Optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message to the seller..."
                  maxLength={200}
                  rows={3}
                  className="w-full px-3 py-2 bg-black/60 border border-gray-700 text-white rounded text-sm focus:border-yellow-500 focus:outline-none resize-none"
                />
                <div className="text-gray-500 text-xs text-right">{message.length}/200</div>
              </div>

              {/* Expiration */}
              <div className="space-y-1">
                <label className="text-gray-400 text-xs uppercase">Offer Expires In</label>
                <select
                  value={expiration}
                  onChange={(e) => setExpiration(parseInt(e.target.value))}
                  className="w-full px-3 py-1.5 bg-black/60 border border-gray-700 text-white rounded text-sm focus:border-yellow-500 focus:outline-none"
                >
                  <option value={1}>1 Hour</option>
                  <option value={6}>6 Hours</option>
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours</option>
                  <option value={48}>48 Hours</option>
                  <option value={72}>72 Hours</option>
                </select>
              </div>
            </div>
          )}

          {/* Your Balance */}
          <div className="bg-black/50 border border-gray-700/50 rounded p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs uppercase">Your Gold</span>
              <span className={`font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                {userGold.toLocaleString()}g
              </span>
            </div>
            {canAfford && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-500 text-xs">After Offer</span>
                <span className="text-gray-300 text-sm">
                  {(userGold - offerAmount).toLocaleString()}g
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canAfford || offerAmount <= 0}
              className={`flex-1 px-4 py-2 font-bold rounded transition-all ${
                canAfford && offerAmount > 0
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/30'
                  : 'bg-gray-900 text-gray-600 cursor-not-allowed'
              }`}
            >
              SUBMIT OFFER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}