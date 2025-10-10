'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface ActivityLogViewerProps {
  walletAddress: string;
  onClose: () => void;
}

export default function ActivityLogViewer({ walletAddress, onClose }: ActivityLogViewerProps) {
  const logs = useQuery(api.auditLogs.getWalletLogs, { stakeAddress: walletAddress, limit: 100 });

  if (!logs) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg p-8 max-w-4xl w-full mx-4">
          <div className="text-gray-400">Loading activity logs...</div>
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatLogEntry = (log: any) => {
    switch (log.type) {
      case 'mekUpgrade':
        return {
          icon: '⬆️',
          title: `${log.assetName || 'Mek'} upgraded to Level ${log.newLevel}`,
          details: [
            `Gold Spent: ${log.upgradeCost?.toLocaleString() || 0}`,
            log.goldBefore !== undefined && log.goldAfter !== undefined
              ? `Total Gold: ${log.goldBefore.toLocaleString()} → ${log.goldAfter.toLocaleString()}`
              : null,
            log.cumulativeGoldBefore !== undefined && log.cumulativeGoldAfter !== undefined
              ? `Cumulative Gold: ${log.cumulativeGoldBefore.toLocaleString()} → ${log.cumulativeGoldAfter.toLocaleString()}`
              : null,
            log.totalGoldPerHour !== undefined
              ? `Gold/hr: ${log.totalGoldPerHour.toFixed(2)}`
              : null,
            `New Gold/hr: ${log.newGoldPerHour?.toFixed(2) || 0}`,
            `Boost: +${log.boostAmount?.toFixed(2) || 0}/hr`,
            log.upgradedBy !== log.mekOwner ? `Upgraded by: ${log.upgradedBy?.substring(0, 12)}...` : null
          ].filter(Boolean),
          color: 'text-green-400'
        };

      case 'verification':
        return {
          icon: log.verified ? '✓' : '✗',
          title: log.verified ? 'Wallet Verified' : 'Verification Failed',
          details: [
            `Source: ${log.source}`,
            `Wallet Count: ${log.walletCount}`,
            `Blockchain Count: ${log.blockchainCount}`
          ],
          color: log.verified ? 'text-green-400' : 'text-red-400'
        };

      case 'walletConnection':
        return {
          icon: '🔗',
          title: 'Wallet Connected',
          details: [
            `Wallet: ${log.walletName}`,
            `Signature: ${log.signatureVerified ? 'Verified' : 'Failed'}`
          ],
          color: 'text-blue-400'
        };

      case 'rateChange':
        return {
          icon: '🔄',
          title: `Mek #${log.mekNumber || '???'} Rate Changed`,
          details: [
            `Old Rate: ${log.oldRate?.toFixed(2) || 0}/hr`,
            `New Rate: ${log.newRate?.toFixed(2) || 0}/hr`,
            `Changed By: ${log.changedBy}`,
            log.reason ? `Reason: ${log.reason}` : null
          ].filter(Boolean),
          color: 'text-yellow-400'
        };

      case 'goldCheckpoint':
        return {
          icon: '💾',
          title: 'Gold Checkpoint Created',
          details: [
            `Gold Amount: ${log.goldAmount?.toLocaleString() || 0}`,
            `Block Height: ${log.blockHeight || 'N/A'}`,
            `Merkle Root: ${log.merkleRoot?.substring(0, 12)}...`
          ],
          color: 'text-purple-400'
        };

      default:
        return {
          icon: '📝',
          title: `${log.type} Event`,
          details: [],
          color: 'text-gray-400'
        };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Activity Log - {walletAddress.substring(0, 12)}...
          </h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700 rounded transition-colors"
          >
            Close
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No activity logs found for this wallet
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <div className="space-y-3">
              {logs.map((log: any) => {
                const formatted = formatLogEntry(log);
                const timestamp = log.timestamp || log.createdAt;

                return (
                  <div
                    key={log._id}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0 mt-1">
                        {formatted.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className={`font-semibold ${formatted.color} text-base`}>
                            {formatted.title}
                          </h3>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatTimestamp(timestamp)}
                          </span>
                        </div>
                        {formatted.details.length > 0 && (
                          <div className="space-y-1">
                            {formatted.details.map((detail, idx) => (
                              <div key={idx} className="text-sm text-gray-300">
                                {detail}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-gray-800/30 rounded border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Events:</span>
                  <span className="ml-2 text-white font-semibold">{logs.length}</span>
                </div>
                <div>
                  <span className="text-gray-400">Mek Upgrades:</span>
                  <span className="ml-2 text-green-400 font-semibold">
                    {logs.filter((log: any) => log.type === 'mekUpgrade').length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Verifications:</span>
                  <span className="ml-2 text-blue-400 font-semibold">
                    {logs.filter((log: any) => log.type === 'verification').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
