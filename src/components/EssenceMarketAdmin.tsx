'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ALL_VARIATIONS_FLAT } from '@/lib/variationsReferenceData';

type View = 'stats' | 'aggregated' | 'detailed' | 'createListing';

export default function EssenceMarketAdmin() {
  const [activeView, setActiveView] = useState<View>('stats');
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Create Listing form state
  const [listingVariation, setListingVariation] = useState('');
  const [listingQuantity, setListingQuantity] = useState<number>(1);
  const [listingPrice, setListingPrice] = useState<number>(100);
  const [listingDuration, setListingDuration] = useState<number>(30);

  // Queries
  const marketStats = useQuery(api.adminMarketplace.getMarketStats);
  const essenceSummary = useQuery(api.adminMarketplace.getEssenceMarketSummary);
  const detailedListings = useQuery(api.adminMarketplace.getEssenceListingsDetailed,
    selectedVariation ? { variationFilter: selectedVariation } : {}
  );

  // Mutations
  const deleteListing = useMutation(api.adminMarketplace.adminDeleteListing);
  const clearAllListings = useMutation(api.seedMarketplace.clearMarketplaceListings);
  const createCompanyListing = useMutation(api.adminMarketplace.adminCreateCompanyListing);

  const handleCreateListing = async () => {
    if (!listingVariation || listingQuantity <= 0 || listingPrice <= 0 || listingDuration <= 0) {
      alert('Please fill in all fields with positive values');
      return;
    }

    try {
      const result = await createCompanyListing({
        variationName: listingVariation,
        quantity: listingQuantity,
        pricePerUnit: listingPrice,
        durationDays: listingDuration,
      });

      alert(result.message);
      // Reset form
      setListingVariation('');
      setListingQuantity(1);
      setListingPrice(100);
      setListingDuration(30);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteListing = async (listingId: string, returnEssence: boolean) => {
    if (!confirm(`Are you sure you want to delete this listing?${returnEssence ? ' Essence will be returned to the seller.' : ' Essence will NOT be returned.'}`)) {
      return;
    }

    try {
      await deleteListing({ listingId: listingId as any, returnEssence });
      alert('Listing deleted successfully');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleClearAllListings = async () => {
    if (!confirm('⚠️ WARNING: This will DELETE ALL marketplace listings (essence, chips, OE items, frames, OEM - EVERYTHING). This cannot be undone. Are you absolutely sure?')) {
      return;
    }

    if (!confirm('FINAL CONFIRMATION: You are about to permanently delete ALL marketplace data. Continue?')) {
      return;
    }

    try {
      const result = await clearAllListings({});
      alert(result.message);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Filter summary by search
  const filteredSummary = essenceSummary?.filter(item =>
    item.variationName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveView('stats')}
          className={`px-4 py-2 rounded-t text-xs font-bold transition-colors ${
            activeView === 'stats'
              ? 'bg-yellow-600/30 border-2 border-yellow-500 text-yellow-300'
              : 'bg-black/30 border border-gray-600 text-gray-400 hover:text-gray-300'
          }`}
        >
          📊 Stats
        </button>
        <button
          onClick={() => setActiveView('aggregated')}
          className={`px-4 py-2 rounded-t text-xs font-bold transition-colors ${
            activeView === 'aggregated'
              ? 'bg-blue-600/30 border-2 border-blue-500 text-blue-300'
              : 'bg-black/30 border border-gray-600 text-gray-400 hover:text-gray-300'
          }`}
        >
          📋 Aggregated
        </button>
        <button
          onClick={() => setActiveView('detailed')}
          className={`px-4 py-2 rounded-t text-xs font-bold transition-colors ${
            activeView === 'detailed'
              ? 'bg-green-600/30 border-2 border-green-500 text-green-300'
              : 'bg-black/30 border border-gray-600 text-gray-400 hover:text-gray-300'
          }`}
        >
          🔍 Detailed
        </button>
        <button
          onClick={() => setActiveView('createListing')}
          className={`px-4 py-2 rounded-t text-xs font-bold transition-colors ${
            activeView === 'createListing'
              ? 'bg-purple-600/30 border-2 border-purple-500 text-purple-300'
              : 'bg-black/30 border border-gray-600 text-gray-400 hover:text-gray-300'
          }`}
        >
          ➕ Create Listing
        </button>
      </div>

      {/* Stats View */}
      {activeView === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {marketStats?.totalListings || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">Total Listings</div>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">
                {marketStats?.totalEssenceQuantity?.toFixed(1) || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">Total Essence</div>
            </div>
            <div className="bg-green-900/20 border border-green-500/30 rounded p-4 text-center">
              <div className="text-3xl font-bold text-green-400">
                {marketStats?.uniqueVariations || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">Unique Variations</div>
            </div>
            <div className="bg-orange-900/20 border border-orange-500/30 rounded p-4 text-center">
              <div className="text-3xl font-bold text-orange-400">
                {marketStats?.totalValue?.toLocaleString() || 0}G
              </div>
              <div className="text-xs text-gray-400 mt-1">Total Market Value</div>
            </div>
          </div>

          {/* Dangerous Actions */}
          <div className="bg-red-900/20 border-2 border-red-500/50 rounded-lg p-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-red-400">⚠️ Dangerous Actions</h4>
                <p className="text-xs text-gray-400 mt-1">Clear all mock data before adding real listings</p>
              </div>
              <button
                onClick={handleClearAllListings}
                className="bg-red-600/30 hover:bg-red-600/50 border-2 border-red-500 text-red-300 px-6 py-2 rounded font-bold text-sm transition-colors"
              >
                🗑️ Clear All Listings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aggregated View */}
      {activeView === 'aggregated' && (
        <div className="space-y-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search variations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/50 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:border-yellow-500 focus:outline-none"
          />

          {/* Table */}
          <div className="bg-black/30 border border-gray-700 rounded overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-900/50 sticky top-0">
                  <tr className="text-left text-gray-400">
                    <th className="p-2 border-b border-gray-700">Variation</th>
                    <th className="p-2 border-b border-gray-700 text-right">Total Qty</th>
                    <th className="p-2 border-b border-gray-700 text-right">Listings</th>
                    <th className="p-2 border-b border-gray-700 text-right">Low Price</th>
                    <th className="p-2 border-b border-gray-700 text-right">High Price</th>
                    <th className="p-2 border-b border-gray-700 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummary.map((item) => (
                    <tr key={item.variationName} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-2 border-b border-gray-800 text-yellow-300 font-medium">
                        {item.variationName}
                      </td>
                      <td className="p-2 border-b border-gray-800 text-right text-blue-300">
                        {item.totalQuantity.toFixed(1)}
                      </td>
                      <td className="p-2 border-b border-gray-800 text-right text-gray-300">
                        {item.listingCount}
                      </td>
                      <td className="p-2 border-b border-gray-800 text-right text-green-300">
                        {item.lowestPrice}G
                      </td>
                      <td className="p-2 border-b border-gray-800 text-right text-red-300">
                        {item.highestPrice}G
                      </td>
                      <td className="p-2 border-b border-gray-800 text-center">
                        <button
                          onClick={() => {
                            setSelectedVariation(item.variationName);
                            setActiveView('detailed');
                          }}
                          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded text-blue-300 text-[10px]"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSummary.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        No essence listings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detailed View */}
      {activeView === 'detailed' && (
        <div className="space-y-3">
          {/* Filter Controls */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Filter by variation..."
              value={selectedVariation || ''}
              onChange={(e) => setSelectedVariation(e.target.value || null)}
              className="flex-1 bg-black/50 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:border-yellow-500 focus:outline-none"
            />
            {selectedVariation && (
              <button
                onClick={() => setSelectedVariation(null)}
                className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded text-red-300 text-xs"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-black/30 border border-gray-700 rounded overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-900/50 sticky top-0">
                  <tr className="text-left text-gray-400">
                    <th className="p-2 border-b border-gray-700">Seller</th>
                    <th className="p-2 border-b border-gray-700">Variation</th>
                    <th className="p-2 border-b border-gray-700 text-right">Quantity</th>
                    <th className="p-2 border-b border-gray-700 text-right">Price/Unit</th>
                    <th className="p-2 border-b border-gray-700 text-right">Total Value</th>
                    <th className="p-2 border-b border-gray-700 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedListings?.map((listing) => (
                    <tr key={listing._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-2 border-b border-gray-800">
                        <div className="text-blue-300 font-medium cursor-pointer hover:underline" title={listing.sellerWallet}>
                          {listing.sellerDisplayName}
                        </div>
                        <div className="text-[10px] text-gray-500">{listing.sellerWallet.slice(0, 12)}...</div>
                      </td>
                      <td className="p-2 border-b border-gray-800 text-yellow-300">
                        {listing.itemVariation}
                      </td>
                      <td className="p-2 border-b border-gray-800 text-right text-blue-300">
                        {listing.quantity.toFixed(1)}
                      </td>
                      <td className="p-2 border-b border-gray-800 text-right text-green-300">
                        {listing.pricePerUnit}G
                      </td>
                      <td className="p-2 border-b border-gray-800 text-right text-orange-300">
                        {(listing.quantity * listing.pricePerUnit).toFixed(0)}G
                      </td>
                      <td className="p-2 border-b border-gray-800 text-center space-x-1">
                        <button
                          onClick={() => handleDeleteListing(listing._id, true)}
                          className="px-2 py-1 bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/50 rounded text-orange-300 text-[10px]"
                          title="Delete and return essence"
                        >
                          ↩ Del
                        </button>
                        <button
                          onClick={() => handleDeleteListing(listing._id, false)}
                          className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded text-red-300 text-[10px]"
                          title="Delete without returning"
                        >
                          ✕ Del
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!detailedListings || detailedListings.length === 0) && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        No listings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Listing View */}
      {activeView === 'createListing' && (
        <div className="space-y-4">
          <div className="bg-purple-900/20 border border-purple-500/30 rounded p-4 space-y-4">
            {/* Company Info */}
            <div className="bg-purple-900/30 border border-purple-500/50 rounded p-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-purple-400 text-2xl">∞</span>
                <div>
                  <div className="text-purple-300 font-bold text-sm">Over Exposed (Company)</div>
                  <div className="text-gray-400 text-xs">Infinite essence source - All listings will show this as the seller</div>
                </div>
              </div>
            </div>

            {/* Variation Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">1. Select Essence Variation</label>
              <select
                value={listingVariation}
                onChange={(e) => setListingVariation(e.target.value)}
                className="w-full bg-black/50 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:border-purple-500 focus:outline-none"
              >
                <option value="">-- Select a variation --</option>
                {ALL_VARIATIONS_FLAT.map((variation) => (
                  <option key={variation.id} value={variation.name}>
                    {variation.name} ({variation.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">2. Enter Quantity</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={listingQuantity}
                onChange={(e) => setListingQuantity(parseFloat(e.target.value) || 0)}
                className="w-full bg-black/50 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:border-purple-500 focus:outline-none"
                placeholder="e.g., 10.5"
              />
            </div>

            {/* Price Per Unit */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">3. Enter Price Per Unit (Gold)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={listingPrice}
                onChange={(e) => setListingPrice(parseInt(e.target.value) || 0)}
                className="w-full bg-black/50 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:border-purple-500 focus:outline-none"
                placeholder="e.g., 500"
              />
              {listingQuantity > 0 && listingPrice > 0 && (
                <div className="mt-1 text-xs text-gray-400">
                  Total value: <span className="text-yellow-400 font-bold">{(listingQuantity * listingPrice).toFixed(0)}G</span>
                </div>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">4. Select Duration</label>
              <select
                value={listingDuration}
                onChange={(e) => setListingDuration(parseInt(e.target.value))}
                className="w-full bg-black/50 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:border-purple-500 focus:outline-none"
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>

            {/* Preview */}
            {listingVariation && listingQuantity > 0 && listingPrice > 0 && listingDuration > 0 && (
              <div className="bg-black/30 border border-gray-700 rounded p-3">
                <div className="text-xs text-gray-400 mb-2">Preview:</div>
                <div className="text-sm">
                  <span className="text-yellow-300 font-bold">{listingQuantity}</span>
                  {' × '}
                  <span className="text-purple-300 font-bold">{listingVariation}</span>
                  {' @ '}
                  <span className="text-green-300 font-bold">{listingPrice}G</span>
                  {' each (expires in '}
                  <span className="text-blue-300">{listingDuration} {listingDuration === 1 ? 'day' : 'days'}</span>
                  {')'}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleCreateListing}
              disabled={!listingVariation || listingQuantity <= 0 || listingPrice <= 0 || listingDuration <= 0}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded transition-colors"
            >
              5. Create Marketplace Listing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
