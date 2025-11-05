"use client";

import { useState } from "react";

interface SyncResult {
  success: boolean;
  syncedAt: number;
  durationMs: number;

  // NMKR Comparison
  nmkrStats: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
  };
  dbStats: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
  };
  discrepancies: Array<{
    nftUid: string;
    nftName: string;
    issue: string;
    dbStatus: string;
    nmkrStatus: string;
  }>;

  // Sync Actions
  updateResults: Array<{
    success: boolean;
    nftName: string;
    oldStatus?: string;
    newStatus?: string;
    error?: string;
  }>;
  updatedCount: number;
  failedCount: number;

  // Webhook Activity
  recentWebhooks: Array<{
    timestamp: number;
    status: string;
    recordsSynced: number;
    errors?: string[];
  }>;

  // Blockchain Verification
  blockchainResults: Array<{
    nftName: string;
    nftUid: string;
    assetId?: string;
    status: "delivered" | "pending_delivery" | "error";
    message: string;
    currentAddresses?: Array<{ address: string; quantity: string }>;
  }>;
  verifiedCount: number;
  pendingCount: number;
  errorCount: number;
}

interface SyncResultsPanelProps {
  result: SyncResult | null;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function SyncResultsPanel({
  result,
  isExpanded,
  onToggle,
}: SyncResultsPanelProps) {
  if (!result) {
    return null;
  }

  const hasDiscrepancies = result.discrepancies.length > 0;
  const hasUpdates = result.updatedCount > 0;
  const hasErrors = result.failedCount > 0;

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-4 border border-yellow-500/30 rounded bg-black/30">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-yellow-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-yellow-500">
            Sync Results
          </span>
          <span className="text-xs text-gray-400">
            (Last synced: {formatTimestamp(result.syncedAt)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasDiscrepancies && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
              ⚠️ {result.discrepancies.length} discrepancies
            </span>
          )}
          {hasUpdates && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
              ✅ {result.updatedCount} updated
            </span>
          )}
          {hasErrors && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
              ❌ {result.failedCount} failed
            </span>
          )}
          <span className="text-gray-400">{isExpanded ? "▼" : "▶"}</span>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* NMKR Comparison */}
          <div className="border-t border-gray-700 pt-3">
            <h4 className="text-sm font-semibold text-white mb-2">
              📊 NMKR Comparison
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* NMKR Stats */}
              <div className="bg-black/50 p-2 rounded">
                <p className="text-xs text-gray-400 mb-1">NMKR Stats:</p>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-white font-semibold">
                      {result.nmkrStats.total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Available:</span>
                    <span className="text-green-400">
                      {result.nmkrStats.available}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Reserved:</span>
                    <span className="text-yellow-400">
                      {result.nmkrStats.reserved}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Sold:</span>
                    <span className="text-red-400">{result.nmkrStats.sold}</span>
                  </div>
                </div>
              </div>

              {/* Database Stats */}
              <div className="bg-black/50 p-2 rounded">
                <p className="text-xs text-gray-400 mb-1">Database Stats:</p>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-white font-semibold">
                      {result.dbStats.total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Available:</span>
                    <span className="text-green-400">
                      {result.dbStats.available}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Reserved:</span>
                    <span className="text-yellow-400">
                      {result.dbStats.reserved}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Sold:</span>
                    <span className="text-red-400">{result.dbStats.sold}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Discrepancies */}
            {hasDiscrepancies && (
              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                <p className="text-xs text-yellow-400 font-semibold mb-1">
                  ⚠️ Discrepancies Found:
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {result.discrepancies.map((disc, idx) => (
                    <div key={idx} className="text-xs text-gray-300">
                      <span className="font-semibold">{disc.nftName}:</span>{" "}
                      {disc.issue} (DB: {disc.dbStatus}, NMKR: {disc.nmkrStatus})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sync Actions */}
          {hasUpdates && (
            <div className="border-t border-gray-700 pt-3">
              <h4 className="text-sm font-semibold text-white mb-2">
                🔄 Sync Actions
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.updateResults.map((update, idx) => (
                  <div
                    key={idx}
                    className={`text-xs p-2 rounded ${
                      update.success
                        ? "bg-green-500/10 text-green-300"
                        : "bg-red-500/10 text-red-300"
                    }`}
                  >
                    {update.success ? "✅" : "❌"}{" "}
                    <span className="font-semibold">{update.nftName}</span>
                    {update.success && update.oldStatus && update.newStatus && (
                      <span>
                        : {update.oldStatus} → {update.newStatus}
                      </span>
                    )}
                    {!update.success && update.error && (
                      <span>: {update.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Webhooks */}
          {result.recentWebhooks.length > 0 && (
            <div className="border-t border-gray-700 pt-3">
              <h4 className="text-sm font-semibold text-white mb-2">
                📡 Recent Webhooks (last 10)
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.recentWebhooks.map((webhook, idx) => (
                  <div
                    key={idx}
                    className="text-xs p-2 rounded bg-black/50 flex justify-between items-center"
                  >
                    <div>
                      <span
                        className={
                          webhook.status === "success"
                            ? "text-green-400"
                            : webhook.status === "partial"
                            ? "text-yellow-400"
                            : "text-red-400"
                        }
                      >
                        {webhook.status === "success"
                          ? "✅"
                          : webhook.status === "partial"
                          ? "⚠️"
                          : "❌"}
                      </span>{" "}
                      <span className="text-gray-300">
                        {formatTimestamp(webhook.timestamp)} - {webhook.recordsSynced}{" "}
                        record{webhook.recordsSynced !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {webhook.errors && webhook.errors.length > 0 && (
                      <span className="text-red-400 text-xs">
                        {webhook.errors.length} error{webhook.errors.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blockchain Verification */}
          {result.blockchainResults.length > 0 && (
            <div className="border-t border-gray-700 pt-3">
              <h4 className="text-sm font-semibold text-white mb-2">
                ⛓️ Blockchain Verification
              </h4>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-green-500/10 p-2 rounded text-center">
                  <p className="text-xs text-gray-400">Delivered</p>
                  <p className="text-lg font-bold text-green-400">
                    {result.verifiedCount}
                  </p>
                </div>
                <div className="bg-yellow-500/10 p-2 rounded text-center">
                  <p className="text-xs text-gray-400">Pending</p>
                  <p className="text-lg font-bold text-yellow-400">
                    {result.pendingCount}
                  </p>
                </div>
                <div className="bg-red-500/10 p-2 rounded text-center">
                  <p className="text-xs text-gray-400">Errors</p>
                  <p className="text-lg font-bold text-red-400">
                    {result.errorCount}
                  </p>
                </div>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.blockchainResults.map((bcResult, idx) => (
                  <div
                    key={idx}
                    className={`text-xs p-2 rounded ${
                      bcResult.status === "delivered"
                        ? "bg-green-500/10 text-green-300"
                        : bcResult.status === "pending_delivery"
                        ? "bg-yellow-500/10 text-yellow-300"
                        : "bg-red-500/10 text-red-300"
                    }`}
                  >
                    <div className="font-semibold">
                      {bcResult.status === "delivered"
                        ? "✅"
                        : bcResult.status === "pending_delivery"
                        ? "⚠️"
                        : "❌"}{" "}
                      {bcResult.nftName}
                    </div>
                    <div className="text-gray-400 mt-1">{bcResult.message}</div>
                    {bcResult.currentAddresses && bcResult.currentAddresses.length > 0 && (
                      <div className="text-gray-500 mt-1 font-mono text-[10px]">
                        Owner: {bcResult.currentAddresses[0].address.substring(0, 20)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Footer */}
          <div className="border-t border-gray-700 pt-3 text-xs text-gray-400">
            Sync completed in {(result.durationMs / 1000).toFixed(2)}s
          </div>
        </div>
      )}
    </div>
  );
}
