'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export default function RevenueAnalytics() {
  const [selectedEventId, setSelectedEventId] = useState<Id<"nftEvents"> | undefined>(undefined);
  const [dateStart, setDateStart] = useState<number | undefined>(undefined);
  const [dateEnd, setDateEnd] = useState<number | undefined>(undefined);

  // Queries
  const allEvents = useQuery(api.nftEvents.getAllEvents, {});
  const revenueData = useQuery(api.nftPurchases.getRevenueAnalytics, {
    eventId: selectedEventId,
    dateStart,
    dateEnd,
  });
  const topBuyers = useQuery(api.nftPurchases.getTopBuyers, {
    limit: 10,
    byCompany: true,
  });
  const topBuyersByWallet = useQuery(api.nftPurchases.getTopBuyers, {
    limit: 10,
    byCompany: false,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-yellow-400 uppercase tracking-wider font-['Orbitron']">
          Revenue Analytics
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Track sales performance and revenue across all NFT events
        </p>
      </div>

      {/* Filters */}
      <div className="bg-black/50 border-2 border-yellow-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-yellow-400 uppercase tracking-wider mb-4">
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Event
            </label>
            <select
              value={selectedEventId || "all"}
              onChange={(e) => setSelectedEventId(e.target.value === "all" ? undefined : e.target.value as Id<"nftEvents">)}
              className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white text-sm focus:border-yellow-500 focus:outline-none"
            >
              <option value="all">All Events</option>
              {allEvents?.map((event) => (
                <option key={event._id} value={event._id}>
                  #{event.eventNumber} - {event.eventName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Date From
            </label>
            <input
              type="date"
              value={dateStart ? new Date(dateStart).toISOString().split('T')[0] : ""}
              onChange={(e) => setDateStart(e.target.value ? new Date(e.target.value).getTime() : undefined)}
              className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white text-sm focus:border-yellow-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Date To
            </label>
            <input
              type="date"
              value={dateEnd ? new Date(dateEnd).toISOString().split('T')[0] : ""}
              onChange={(e) => setDateEnd(e.target.value ? new Date(e.target.value).getTime() : undefined)}
              className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white text-sm focus:border-yellow-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {revenueData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-900/30 to-black/50 border-2 border-green-500/30 rounded-lg p-6">
            <div className="text-xs uppercase tracking-wider text-green-400 mb-2 font-bold">
              Total Revenue
            </div>
            <div className="text-3xl font-bold text-green-400">
              {revenueData.totalRevenue.toFixed(2)} ₳
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/30 to-black/50 border-2 border-blue-500/30 rounded-lg p-6">
            <div className="text-xs uppercase tracking-wider text-blue-400 mb-2 font-bold">
              Total Sales
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {revenueData.totalSales}
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-900/30 to-black/50 border-2 border-yellow-500/30 rounded-lg p-6">
            <div className="text-xs uppercase tracking-wider text-yellow-400 mb-2 font-bold">
              Average Price
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              {revenueData.averagePrice.toFixed(2)} ₳
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-black/50 border-2 border-purple-500/30 rounded-lg p-6">
            <div className="text-xs uppercase tracking-wider text-purple-400 mb-2 font-bold">
              Highest Sale
            </div>
            <div className="text-3xl font-bold text-purple-400">
              {revenueData.highestSale.toFixed(2)} ₳
            </div>
          </div>
        </div>
      )}

      {/* Revenue by Date Chart */}
      {revenueData && Object.keys(revenueData.revenueByDate).length > 0 && (
        <div className="bg-black/50 border-2 border-yellow-500/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-yellow-400 uppercase tracking-wider mb-4">
            Revenue by Date
          </h3>
          <div className="space-y-2">
            {Object.entries(revenueData.revenueByDate)
              .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
              .slice(0, 10)
              .map(([date, revenue]) => {
                const maxRevenue = Math.max(...Object.values(revenueData.revenueByDate));
                const percentage = (revenue / maxRevenue) * 100;

                return (
                  <div key={date} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-gray-400">
                      {new Date(date).toLocaleDateString()}
                    </div>
                    <div className="flex-1 bg-gray-800 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-400 h-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-end pr-4">
                        <span className="text-white font-bold text-sm">
                          {revenue.toFixed(2)} ₳
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Top Buyers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Company */}
        <div className="bg-black/50 border-2 border-blue-500/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-400 uppercase tracking-wider mb-4">
            Top Companies
          </h3>
          {topBuyers && topBuyers.length > 0 ? (
            <div className="space-y-3">
              {topBuyers.map((buyer, index) => (
                <div
                  key={buyer.key}
                  className="bg-gradient-to-r from-blue-900/20 to-black/50 border border-blue-500/30 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/20 border-2 border-blue-500 rounded w-10 h-10 flex items-center justify-center">
                        <span className="text-blue-400 font-bold text-lg">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-bold">
                          {buyer.companyName || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {buyer.totalPurchases} purchase{buyer.totalPurchases !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-400">
                        {buyer.totalSpent.toFixed(2)} ₳
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No purchase data yet</p>
          )}
        </div>

        {/* By Wallet */}
        <div className="bg-black/50 border-2 border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-purple-400 uppercase tracking-wider mb-4">
            Top Wallets
          </h3>
          {topBuyersByWallet && topBuyersByWallet.length > 0 ? (
            <div className="space-y-3">
              {topBuyersByWallet.map((buyer, index) => (
                <div
                  key={buyer.key}
                  className="bg-gradient-to-r from-purple-900/20 to-black/50 border border-purple-500/30 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-500/20 border-2 border-purple-500 rounded w-10 h-10 flex items-center justify-center">
                        <span className="text-purple-400 font-bold text-lg">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-mono text-sm">
                          {buyer.walletAddress?.slice(0, 12)}...{buyer.walletAddress?.slice(-8)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {buyer.companyName && <span className="text-yellow-400">{buyer.companyName} • </span>}
                          {buyer.totalPurchases} purchase{buyer.totalPurchases !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-400">
                        {buyer.totalSpent.toFixed(2)} ₳
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No purchase data yet</p>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border-2 border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📊</div>
          <div>
            <h4 className="text-blue-400 font-bold uppercase tracking-wider mb-2">
              Analytics Notes
            </h4>
            <div className="text-sm text-gray-300 space-y-1">
              <p>• Only <strong>completed</strong> purchases are included in revenue calculations</p>
              <p>• Company names are displayed when available from wallet authentication</p>
              <p>• Date filters apply to purchase date (purchasedAt field)</p>
              <p>• Top buyers are ranked by total ADA spent</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
