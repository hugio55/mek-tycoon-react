'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

type PurchaseStatus = "pending" | "confirmed" | "completed" | "failed" | "refunded";

interface PurchaseFilters {
  eventId?: Id<"nftEvents">;
  variationId?: Id<"nftVariations">;
  walletAddress?: string;
  companyName?: string;
  status?: PurchaseStatus;
  dateStart?: number;
  dateEnd?: number;
}

export default function PurchaseDashboard() {
  const [filters, setFilters] = useState<PurchaseFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<Id<"nftPurchases"> | null>(null);
  const pageSize = 20;

  // Queries
  const allEvents = useQuery(api.nftEvents.getAllEvents, {});
  const purchases = useQuery(api.nftPurchases.getPurchases, {
    ...filters,
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  // Filter purchases by search term (client-side)
  const filteredPurchases = purchases?.filter(purchase => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      purchase.walletAddress?.toLowerCase().includes(term) ||
      purchase.companyName?.toLowerCase().includes(term) ||
      purchase.eventName?.toLowerCase().includes(term) ||
      purchase.variationName?.toLowerCase().includes(term) ||
      purchase.transactionHash?.toLowerCase().includes(term)
    );
  });

  const handleFilterChange = (key: keyof PurchaseFilters, value: any) => {
    setFilters({ ...filters, [key]: value === "" || value === "all" ? undefined : value });
    setCurrentPage(0); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setCurrentPage(0);
  };

  const handleExportCSV = () => {
    if (!filteredPurchases || filteredPurchases.length === 0) {
      alert('No purchases to export');
      return;
    }

    const headers = [
      'Date',
      'Event',
      'Variation',
      'Difficulty',
      'Wallet Address',
      'Company Name',
      'Price (ADA)',
      'Transaction Hash',
      'Status',
    ];

    const rows = filteredPurchases.map(p => [
      new Date(p.purchasedAt).toLocaleString(),
      p.eventName || '',
      p.variationName || '',
      p.difficulty || '',
      p.walletAddress,
      p.companyName || 'Unknown',
      p.priceAda.toFixed(2),
      p.transactionHash,
      p.status,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nft-purchases-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCardanoScanUrl = (txHash: string) => {
    return `https://cardanoscan.io/transaction/${txHash}`;
  };

  const statusColors = {
    pending: "bg-yellow-600/30 text-yellow-400 border-yellow-600",
    confirmed: "bg-blue-600/30 text-blue-400 border-blue-600",
    completed: "bg-green-600/30 text-green-400 border-green-600",
    failed: "bg-red-600/30 text-red-400 border-red-600",
    refunded: "bg-gray-600/30 text-gray-400 border-gray-600",
  };

  const difficultyColors = {
    easy: "text-green-400",
    medium: "text-yellow-400",
    hard: "text-red-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 uppercase tracking-wider font-['Orbitron']">
            Purchase Analytics
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            View and analyze all NFT purchases across events
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold uppercase tracking-wider transition-all shadow-lg shadow-green-600/30"
          disabled={!filteredPurchases || filteredPurchases.length === 0}
        >
          📊 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-black/50 border-2 border-yellow-500/30 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-yellow-400 uppercase tracking-wider">
            Filters
          </h3>
          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-400 hover:text-yellow-400 uppercase tracking-wider"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-3">
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search wallet, company, event, variation, or tx hash..."
              className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white text-sm focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Event Filter */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Event
            </label>
            <select
              value={filters.eventId || "all"}
              onChange={(e) => handleFilterChange('eventId', e.target.value)}
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

          {/* Status Filter */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Status
            </label>
            <select
              value={filters.status || "all"}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white text-sm focus:border-yellow-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Company Name Filter */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Company Name
            </label>
            <input
              type="text"
              value={filters.companyName || ""}
              onChange={(e) => handleFilterChange('companyName', e.target.value)}
              placeholder="Filter by company..."
              className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white text-sm focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Date From
            </label>
            <input
              type="date"
              value={filters.dateStart ? new Date(filters.dateStart).toISOString().split('T')[0] : ""}
              onChange={(e) => handleFilterChange('dateStart', e.target.value ? new Date(e.target.value).getTime() : undefined)}
              className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white text-sm focus:border-yellow-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Date To
            </label>
            <input
              type="date"
              value={filters.dateEnd ? new Date(filters.dateEnd).toISOString().split('T')[0] : ""}
              onChange={(e) => handleFilterChange('dateEnd', e.target.value ? new Date(e.target.value).getTime() : undefined)}
              className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white text-sm focus:border-yellow-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {filteredPurchases && (
        <div className="bg-black/30 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-400">
              Showing <span className="text-white font-bold">{filteredPurchases.length}</span> purchases
              {searchTerm && <span className="text-yellow-400"> (filtered by search)</span>}
            </p>
            {filteredPurchases.length > 0 && (
              <p className="text-gray-400">
                Total Revenue: <span className="text-green-400 font-bold">
                  {filteredPurchases.reduce((sum, p) => sum + p.priceAda, 0).toFixed(2)} ₳
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Purchases List */}
      <div className="space-y-3">
        {!filteredPurchases || filteredPurchases.length === 0 ? (
          <div className="bg-black/30 border border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg">
              {searchTerm || Object.keys(filters).length > 0
                ? "No purchases match your filters"
                : "No purchases recorded yet"}
            </p>
          </div>
        ) : (
          filteredPurchases.map((purchase) => (
            <div
              key={purchase._id}
              className="bg-gradient-to-r from-black/80 to-gray-900/80 border-2 border-gray-700 hover:border-yellow-500/60 rounded-lg p-4 transition-all cursor-pointer"
              onClick={() => setSelectedPurchaseId(purchase._id)}
            >
              <div className="flex items-start justify-between">
                {/* Left: Purchase Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    {/* Event Badge */}
                    <div className="bg-blue-500/20 border border-blue-500 rounded px-2 py-1">
                      <span className="text-blue-400 font-bold text-xs">
                        Event #{purchase.eventNumber}
                      </span>
                    </div>

                    {/* Event Name */}
                    <h3 className="text-white font-bold">
                      {purchase.eventName}
                    </h3>

                    {/* Status Badge */}
                    <div className={`px-2 py-1 rounded text-xs font-bold border ${statusColors[purchase.status as PurchaseStatus]}`}>
                      {purchase.status.toUpperCase()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {/* Variation */}
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Variation</div>
                      <div className="text-white">
                        {purchase.variationName}
                        <span className={`ml-2 font-bold ${difficultyColors[purchase.difficulty as keyof typeof difficultyColors]}`}>
                          ({purchase.difficulty})
                        </span>
                      </div>
                    </div>

                    {/* Company */}
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Company</div>
                      <div className="text-yellow-400 font-bold">
                        {purchase.companyName || 'Unknown'}
                      </div>
                    </div>

                    {/* Wallet */}
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Wallet</div>
                      <div className="text-gray-300 font-mono text-xs">
                        {purchase.walletAddress.slice(0, 12)}...{purchase.walletAddress.slice(-8)}
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Date</div>
                      <div className="text-white">
                        {new Date(purchase.purchasedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Price & Transaction */}
                <div className="text-right space-y-2">
                  <div className="text-2xl font-bold text-green-400">
                    {purchase.priceAda.toFixed(2)} ₳
                  </div>
                  <a
                    href={getCardanoScanUrl(purchase.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>View on CardanoScan</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredPurchases && filteredPurchases.length >= pageSize && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-gray-400">
            Page {currentPage + 1}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={filteredPurchases.length < pageSize}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
