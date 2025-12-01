'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SyncDiscrepancy {
  nftUid: string;
  nftNumber: number;
  name: string;
  nmkrStatus: 'free' | 'reserved' | 'sold';
  convexStatus: 'available' | 'reserved' | 'sold';
  nmkrSoldTo?: string;
  convexSoldTo?: string;
}

interface NMKRSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  discrepancies: SyncDiscrepancy[];
  onSyncAll: () => Promise<void>;
  onSyncSingle: (nftUid: string) => Promise<void>;
  isSyncing: boolean;
}

export default function NMKRSyncModal({
  isOpen,
  onClose,
  campaignName,
  discrepancies,
  onSyncAll,
  onSyncSingle,
  isSyncing,
}: NMKRSyncModalProps) {
  const [mounted, setMounted] = useState(false);
  const [syncingNftUid, setSyncingNftUid] = useState<string | null>(null);

  // Must use useEffect to set mounted state after hydration (for portal to work)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSyncSingle = async (nftUid: string) => {
    setSyncingNftUid(nftUid);
    try {
      await onSyncSingle(nftUid);
    } finally {
      setSyncingNftUid(null);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'sold':
        return 'text-cyan-400';
      case 'reserved':
        return 'text-yellow-400';
      case 'available':
      case 'free':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const statusDisplay = (status: string) => {
    if (status === 'free') return 'AVAILABLE';
    return status.toUpperCase();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-black border-2 border-yellow-500/50 rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-900/30 to-black border-b border-yellow-500/30 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-1">
                NMKR Sync Results
              </h2>
              <p className="text-gray-400 text-sm">
                Campaign: {campaignName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          {discrepancies.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <div className="text-xl font-bold text-green-400 mb-2">
                No Discrepancies Found
              </div>
              <div className="text-gray-400">
                All NFTs in your database match NMKR's records
              </div>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">⚠️</div>
                  <div>
                    <div className="font-bold text-yellow-400">
                      {discrepancies.length} Discrepanc{discrepancies.length === 1 ? 'y' : 'ies'} Found
                    </div>
                    <div className="text-sm text-gray-400">
                      The following NFTs have different statuses in NMKR vs your database
                    </div>
                  </div>
                </div>
              </div>

              {/* Discrepancies Table */}
              <div className="space-y-3">
                {discrepancies.map((discrepancy) => (
                  <div
                    key={discrepancy.nftUid}
                    className="bg-black/50 border border-yellow-500/30 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-white mb-2">
                          {discrepancy.name}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500 text-xs mb-1">
                              NMKR Status
                            </div>
                            <div className={`font-semibold ${statusColor(discrepancy.nmkrStatus)}`}>
                              {statusDisplay(discrepancy.nmkrStatus)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs mb-1">
                              Database Status
                            </div>
                            <div className={`font-semibold ${statusColor(discrepancy.convexStatus)}`}>
                              {statusDisplay(discrepancy.convexStatus)}
                            </div>
                          </div>
                        </div>
                        {discrepancy.nmkrSoldTo && (
                          <div className="mt-2 text-xs text-gray-400">
                            NMKR Sold To: {discrepancy.nmkrSoldTo}
                          </div>
                        )}
                        {discrepancy.convexSoldTo && (
                          <div className="mt-1 text-xs text-gray-400">
                            DB Sold To: {discrepancy.convexSoldTo}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleSyncSingle(discrepancy.nftUid)}
                        disabled={isSyncing || syncingNftUid === discrepancy.nftUid}
                        className="ml-4 px-3 py-1 rounded text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {syncingNftUid === discrepancy.nftUid ? '⏳ Syncing...' : '🔄 Fix This'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {discrepancies.length > 0 && (
          <div className="border-t border-yellow-500/30 p-6 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Click "Fix This" to sync individual NFTs, or sync all at once
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-700/50 text-white hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={onSyncAll}
                disabled={isSyncing}
                className="px-4 py-2 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {isSyncing ? '⏳ Syncing All...' : '🔄 Sync All'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
