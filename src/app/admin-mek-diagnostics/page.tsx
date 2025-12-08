'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

/**
 * MEK DATABASE DIAGNOSTICS
 *
 * Problem: Database shows 4,042 meks but should have 4,000
 * User "Monk" shows 87 meks in admin but wallet has 42
 *
 * This page provides targeted diagnostics to investigate the discrepancy
 */

export default function MekDiagnosticsPage() {
  const [selectedWallet, setSelectedWallet] = useState('stake1u8zevs4clkjlm9s5dw8kkrfzzsj6c4kwvr9d20e7tqughgq076');
  const [showRawData, setShowRawData] = useState(false);

  // Run all diagnostics
  const summaryData = useQuery(api.adminDiagnosticMeks.getMekCountSummary);
  const duplicatesData = useQuery(api.adminDiagnosticMeks.getDuplicateAssetIdDetails);
  const invalidData = useQuery(api.adminDiagnosticMeks.getInvalidAssetIdDetails);
  const orphanedData = useQuery(api.adminDiagnosticMeks.getOrphanedMeks);
  const walletData = useQuery(
    api.adminDiagnosticMeks.investigateWalletMekCount,
    selectedWallet ? { walletAddress: selectedWallet } : 'skip'
  );
  const comprehensiveReport = useQuery(api.adminDiagnosticMeks.getComprehensiveReport);

  const isLoading = !summaryData || !duplicatesData || !invalidData || !orphanedData || !comprehensiveReport;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-2 border-yellow-500/50 bg-black/80 backdrop-blur-sm rounded-lg p-6">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2 uppercase tracking-wider">
            🔍 Mek Database Diagnostics
          </h1>
          <p className="text-gray-400">
            Investigating the discrepancy: Database shows 4,042 meks but should have 4,000
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-6xl">⚙️</div>
            <p className="mt-4 text-gray-400">Running diagnostics...</p>
          </div>
        )}

        {!isLoading && (
          <div className="space-y-6">
            {/* COMPREHENSIVE REPORT */}
            <div className="border-2 border-green-500/50 bg-black/80 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-2xl font-bold text-green-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                📊 Comprehensive Report
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1">Total Records</div>
                  <div className="text-3xl font-bold text-white">{comprehensiveReport?.summary.totalRecords}</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1">Unique Asset IDs</div>
                  <div className="text-3xl font-bold text-blue-400">{comprehensiveReport?.summary.uniqueAssetIds}</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1">Expected Meks</div>
                  <div className="text-3xl font-bold text-green-400">{comprehensiveReport?.summary.expectedMeks}</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded border border-red-700">
                  <div className="text-gray-400 text-sm mb-1">Extra Records</div>
                  <div className="text-3xl font-bold text-red-400">{comprehensiveReport?.summary.extraRecords}</div>
                </div>
              </div>

              <div className="bg-gray-900/50 p-4 rounded border border-yellow-700 mb-6">
                <h3 className="text-lg font-bold text-yellow-400 mb-3">Issue Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duplicate assetIds:</span>
                    <span className="text-white font-bold">{comprehensiveReport?.issueBreakdown.duplicates.assetIdsWithDuplicates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Extra records from duplicates:</span>
                    <span className="text-red-400 font-bold">{comprehensiveReport?.issueBreakdown.duplicates.extraRecordsFromDuplicates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Invalid assetIds (test data):</span>
                    <span className="text-red-400 font-bold">{comprehensiveReport?.issueBreakdown.invalid.meksWithInvalidAssetIds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Orphaned (no owner):</span>
                    <span className="text-red-400 font-bold">{comprehensiveReport?.issueBreakdown.orphaned.meksWithNoOwner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mismatched owner fields:</span>
                    <span className="text-yellow-400 font-bold">{comprehensiveReport?.issueBreakdown.mismatched.meksWithMismatchedOwnerFields}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded">
                <h3 className="text-lg font-bold text-blue-400 mb-2">Recommendation</h3>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">{comprehensiveReport?.recommendation}</pre>
              </div>
            </div>

            {/* SUMMARY */}
            <div className="border-2 border-blue-500/50 bg-black/80 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-2xl font-bold text-blue-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                📋 Quick Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Duplicates" value={summaryData?.duplicateCount || 0} color="red" />
                <StatCard label="Invalid IDs" value={summaryData?.invalidAssetIdCount || 0} color="orange" />
                <StatCard label="No Owner" value={summaryData?.noOwnerCount || 0} color="purple" />
                <StatCard label="Mismatched" value={summaryData?.mismatchedOwnerCount || 0} color="yellow" />
              </div>
            </div>

            {/* WALLET INVESTIGATION */}
            <div className="border-2 border-purple-500/50 bg-black/80 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-2xl font-bold text-purple-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                🔎 Wallet Investigation
              </h2>
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Wallet Address (Monk default)</label>
                <input
                  type="text"
                  value={selectedWallet}
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded px-4 py-2 text-white"
                  placeholder="stake1..."
                />
              </div>

              {walletData && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <StatCard label="By Owner Field" value={walletData.counts.byOwnerField} color="blue" />
                    <StatCard label="By Stake Field" value={walletData.counts.byStakeField} color="green" />
                    <StatCard label="Total (Either)" value={walletData.counts.byEitherField} color="yellow" />
                    <StatCard label="Unique NFTs" value={walletData.counts.uniqueAssetIds} color="purple" />
                  </div>

                  {walletData.issues.hasDuplicates && (
                    <div className="bg-red-900/30 border border-red-500/50 p-4 rounded mb-4">
                      <h3 className="text-lg font-bold text-red-400 mb-2">⚠️ Issues Found</h3>
                      <div className="text-sm text-gray-300">
                        <div>Duplicate count: {walletData.issues.duplicateCount}</div>
                        <div>Invalid count: {walletData.issues.invalidCount}</div>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded mb-4">
                    <h3 className="text-lg font-bold text-blue-400 mb-2">Diagnosis</h3>
                    <p className="text-sm text-gray-300">{walletData.diagnosis}</p>
                  </div>

                  <button
                    onClick={() => setShowRawData(!showRawData)}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded mb-4"
                  >
                    {showRawData ? 'Hide' : 'Show'} Sample Meks ({walletData.sample.length})
                  </button>

                  {showRawData && (
                    <div className="bg-gray-900/50 p-4 rounded border border-gray-700 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left border-b border-gray-700">
                            <th className="p-2">Asset ID</th>
                            <th className="p-2">Asset Name</th>
                            <th className="p-2">Owner</th>
                            <th className="p-2">Owner Stake</th>
                            <th className="p-2">Valid</th>
                          </tr>
                        </thead>
                        <tbody>
                          {walletData.sample.map((mek: any, idx: number) => (
                            <tr key={idx} className="border-b border-gray-800">
                              <td className="p-2 font-mono text-xs">{mek.assetId}</td>
                              <td className="p-2">{mek.assetName}</td>
                              <td className="p-2 font-mono text-xs">{mek.owner}</td>
                              <td className="p-2 font-mono text-xs">{mek.ownerStake}</td>
                              <td className="p-2">
                                {mek.valid ? (
                                  <span className="text-green-400">✓</span>
                                ) : (
                                  <span className="text-red-400">✗</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* DUPLICATES DETAIL */}
            <div className="border-2 border-red-500/50 bg-black/80 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-2xl font-bold text-red-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                🔄 Duplicate Asset IDs
              </h2>
              <div className="bg-red-900/20 border border-red-500/50 p-4 rounded mb-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Asset IDs with duplicates:</span>
                    <span className="text-white font-bold">{duplicatesData?.totalDuplicateAssetIds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Extra records from duplicates:</span>
                    <span className="text-red-400 font-bold">{duplicatesData?.totalExtraRecords}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">{duplicatesData?.recommendation}</p>
              {duplicatesData?.examples && duplicatesData.examples.length > 0 && (
                <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                  <h3 className="text-sm font-bold text-gray-300 mb-2">First 10 Examples:</h3>
                  <div className="space-y-2 text-xs font-mono">
                    {duplicatesData.examples.map((dup: any, idx: number) => (
                      <div key={idx} className="border-b border-gray-800 pb-2">
                        <div className="text-yellow-400">AssetID: {dup.assetId} (Count: {dup.count})</div>
                        {dup.records.map((rec: any, ridx: number) => (
                          <div key={ridx} className="ml-4 text-gray-400">
                            Owner: {rec.owner} | Stake: {rec.ownerStake}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* INVALID ASSET IDs */}
            <div className="border-2 border-orange-500/50 bg-black/80 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-2xl font-bold text-orange-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                ⚠️ Invalid Asset IDs
              </h2>
              <div className="bg-orange-900/20 border border-orange-500/50 p-4 rounded mb-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total invalid meks:</span>
                    <span className="text-white font-bold">{invalidData?.totalInvalid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Owners affected:</span>
                    <span className="text-orange-400 font-bold">{invalidData?.ownersAffected}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">{invalidData?.recommendation}</p>
              {invalidData?.ownerBreakdown && (
                <div className="bg-gray-900/50 p-4 rounded border border-gray-700 mb-4">
                  <h3 className="text-sm font-bold text-gray-300 mb-2">By Owner:</h3>
                  <div className="space-y-1 text-xs">
                    {invalidData.ownerBreakdown.map((owner: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-400 font-mono">{owner.owner}</span>
                        <span className="text-red-400 font-bold">{owner.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {invalidData?.sampleAssetIds && (
                <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                  <h3 className="text-sm font-bold text-gray-300 mb-2">Sample Invalid IDs:</h3>
                  <div className="space-y-1 text-xs font-mono text-red-400">
                    {invalidData.sampleAssetIds.map((id: string, idx: number) => (
                      <div key={idx}>{id}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ORPHANED MEKS */}
            <div className="border-2 border-purple-500/50 bg-black/80 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-2xl font-bold text-purple-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                👻 Orphaned Meks
              </h2>
              <div className="bg-purple-900/20 border border-purple-500/50 p-4 rounded mb-4">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Meks with no owner:</span>
                    <span className="text-white font-bold">{orphanedData?.count}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">{orphanedData?.recommendation}</p>
              {orphanedData?.sample && orphanedData.sample.length > 0 && (
                <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                  <h3 className="text-sm font-bold text-gray-300 mb-2">First 10 Examples:</h3>
                  <div className="space-y-1 text-xs font-mono">
                    {orphanedData.sample.map((mek: any, idx: number) => (
                      <div key={idx} className="text-gray-400">
                        {mek.assetName} ({mek.assetId})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';
}) {
  const colorClasses = {
    red: 'border-red-500/50 bg-red-900/20 text-red-400',
    orange: 'border-orange-500/50 bg-orange-900/20 text-orange-400',
    yellow: 'border-yellow-500/50 bg-yellow-900/20 text-yellow-400',
    green: 'border-green-500/50 bg-green-900/20 text-green-400',
    blue: 'border-blue-500/50 bg-blue-900/20 text-blue-400',
    purple: 'border-purple-500/50 bg-purple-900/20 text-purple-400',
  };

  return (
    <div className={`border p-4 rounded ${colorClasses[color]}`}>
      <div className="text-xs text-gray-400 mb-1 uppercase">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
