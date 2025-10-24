'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function AdminEssenceDuplicatesPage() {
  const [walletAddress, setWalletAddress] = useState('stake1u8zevs2wn9fhef7p5nrqceu0rhfxmsqmpudd5zttfm3kksqh43rw4');
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);

  // Query all wallets with essence data
  const allWallets = useQuery(api.diagnosticAllEssenceWallets.findAllEssenceWallets);

  // Only run diagnostic when button is clicked
  const diagnostic = useQuery(
    api.diagnosticNothingDuplicates.findNothingDuplicates,
    showDiagnostic ? { walletAddress } : "skip"
  );

  const fixDuplicates = useMutation(api.fixNothingDuplicates.fixNothingDuplicates);

  const handleDiagnostic = () => {
    setShowDiagnostic(true);
    setFixResult(null);
  };

  const handleFix = async () => {
    try {
      const result = await fixDuplicates({ walletAddress });
      setFixResult(result);
      // Re-run diagnostic after fix
      setShowDiagnostic(false);
      setTimeout(() => setShowDiagnostic(true), 500);
    } catch (error) {
      setFixResult({ error: String(error) });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-yellow-400">
          Admin: Essence Duplicates Diagnostic
        </h1>

        {/* All Wallets Overview */}
        {allWallets && allWallets.totalWallets > 0 && (
          <div className="mb-6 bg-gray-900 border border-blue-500/30 rounded-lg p-6">
            <h2 className="text-xl font-bold text-blue-400 mb-4">
              All Wallets with Essence Data ({allWallets.totalWallets})
            </h2>

            {allWallets.walletsWithMultipleNothings.length > 0 && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded">
                <div className="font-bold text-red-400">
                  ⚠️ {allWallets.walletsWithMultipleNothings.length} wallet(s) with multiple "Nothing" entries detected!
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allWallets.wallets.map((wallet: any) => {
                const isSelected = walletAddress === wallet.walletAddress;
                return (
                  <div
                    key={wallet.walletAddress}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-yellow-900/30 border-2 border-yellow-500'
                        : wallet.hasMultipleNothings
                        ? 'bg-red-900/20 border border-red-500/50 hover:bg-red-900/30'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      setWalletAddress(wallet.walletAddress);
                      setShowDiagnostic(false);
                      setFixResult(null);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-mono text-xs text-gray-300 break-all">
                          {wallet.walletAddress}
                        </div>
                      <div className="flex gap-4 mt-1 text-xs text-gray-400">
                        <span>{wallet.totalBalances} balances</span>
                        <span>{wallet.slottedMeks} slotted</span>
                        {wallet.nothingCount > 0 && (
                          <span className={wallet.hasMultipleNothings ? 'text-red-400 font-bold' : ''}>
                            {wallet.nothingCount} "Nothing"
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs">
                      {wallet.isActive ? (
                        <span className="text-green-400">● Active</span>
                      ) : wallet.isInitialized ? (
                        <span className="text-yellow-400">● Initialized</span>
                      ) : (
                        <span className="text-gray-500">○ Not Init</span>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}

        {/* Wallet Input */}
        <div className="mb-6 bg-gray-900 border border-yellow-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-400">
              Wallet Address (Stake Address)
            </label>
            {allWallets && allWallets.walletsWithMultipleNothings.length > 0 && (
              <button
                onClick={() => {
                  const problematicWallet = allWallets.walletsWithMultipleNothings[0];
                  setWalletAddress(problematicWallet.walletAddress);
                  setShowDiagnostic(false);
                  setFixResult(null);
                }}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors"
              >
                Load Problematic Wallet
              </button>
            )}
          </div>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => {
              setWalletAddress(e.target.value);
              setShowDiagnostic(false);
              setFixResult(null);
            }}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-500 font-mono text-sm"
            placeholder="stake1u..."
          />
        </div>

        {/* Actions */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={handleDiagnostic}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors"
          >
            Run Diagnostic
          </button>

          {diagnostic && diagnostic.nothingCount > 1 && (
            <button
              onClick={handleFix}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded transition-colors"
            >
              Fix Duplicates
            </button>
          )}
        </div>

        {/* Fix Result */}
        {fixResult && (
          <div className="mb-6 bg-gray-900 border-2 border-green-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-400 mb-4">Fix Result</h2>
            <pre className="bg-black/50 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(fixResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Diagnostic Results */}
        {diagnostic && (
          <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-6">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">Diagnostic Results</h2>

            {/* Initialization Status */}
            <div className={`mb-6 p-4 rounded border ${
              diagnostic.isInitialized
                ? 'bg-green-900/20 border-green-500/30'
                : 'bg-red-900/30 border-red-500'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold">
                    {diagnostic.isInitialized ? '✓ Essence System Initialized' : '✗ Essence System NOT Initialized'}
                  </span>
                  {diagnostic.isInitialized && (
                    <span className="ml-4 text-sm">
                      (Active: {diagnostic.isActive ? 'Yes' : 'No'})
                    </span>
                  )}
                </div>
                {!diagnostic.isInitialized && (
                  <div className="text-sm text-red-400">
                    Visit the home page and slot a Mek to initialize
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded">
                <div className="text-sm text-gray-400">Stored Balances (DB)</div>
                <div className="text-2xl font-bold text-white">{diagnostic.totalBalances}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded">
                <div className="text-sm text-gray-400">Slotted Meks</div>
                <div className="text-2xl font-bold text-white">{diagnostic.totalSlottedMeks}</div>
              </div>
              <div className={`p-4 rounded ${diagnostic.nothingCount > 1 || diagnostic.nothingFromSlots > 1 ? 'bg-red-900/30 border border-red-500' : 'bg-gray-800'}`}>
                <div className="text-sm text-gray-400">"Nothing" Issues</div>
                <div className="text-2xl font-bold text-white">
                  {diagnostic.nothingCount} DB / {diagnostic.nothingFromSlots} Slots
                </div>
                {(diagnostic.nothingCount > 1 || diagnostic.nothingFromSlots > 1) && (
                  <div className="text-xs text-red-400 mt-1">⚠️ Multiple detected!</div>
                )}
              </div>
            </div>

            {/* Slotted Meks with Nothing */}
            {diagnostic.slottedMeksWithNothing && diagnostic.slottedMeksWithNothing.length > 0 && (
              <div className="mt-6 mb-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-yellow-400 mb-3">Slotted Meks with "Nothing" Trait</h3>
                <div className="space-y-3">
                  {diagnostic.slottedMeksWithNothing.map((mek: any, idx: number) => (
                    <div key={idx} className="bg-gray-800 rounded p-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-400">Slot:</span>{' '}
                          <span className="text-white font-bold">{mek.slotNumber}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Mek Asset ID:</span>{' '}
                          <span className="text-gray-300 font-mono text-xs">{mek.mekAssetId}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-400">Variations:</span>{' '}
                          <span className="text-blue-400">{mek.headVariationName}</span>
                          {' / '}
                          <span className="text-green-400">{mek.bodyVariationName}</span>
                          {' / '}
                          <span className="text-purple-400">{mek.itemVariationName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nothing Details */}
            {diagnostic.nothingBalances.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-300 mb-3">"Nothing" Variations in Database</h3>
                <div className="space-y-4">
                  {diagnostic.nothingBalances.map((balance: any) => (
                    <div
                      key={balance._id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-400">ID:</span>{' '}
                          <span className="text-white font-mono">{balance._id}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Variation ID:</span>{' '}
                          <span className={`font-bold ${balance.variationId === 288 ? 'text-green-400' : 'text-red-400'}`}>
                            {balance.variationId} {balance.variationId === 288 ? '✓' : '✗ (should be 288)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Name:</span>{' '}
                          <span className="text-white">{balance.variationName}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Type:</span>{' '}
                          <span className="text-purple-400 uppercase">{balance.variationType}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Amount:</span>{' '}
                          <span className="text-yellow-400 font-bold">{balance.accumulatedAmount.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Last Updated:</span>{' '}
                          <span className="text-gray-300 text-xs">
                            {new Date(balance.lastUpdated).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Data */}
            <details className="mt-6">
              <summary className="cursor-pointer text-gray-400 hover:text-white mb-2">
                Raw Diagnostic Data
              </summary>
              <pre className="bg-black/50 p-4 rounded overflow-auto text-xs text-gray-300">
                {JSON.stringify(diagnostic, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-400 mb-3">How This Works</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <strong>1. Run Diagnostic:</strong> Click "Run Diagnostic" to scan for duplicate "Nothing" essence entries
            </li>
            <li>
              <strong>2. Review Results:</strong> Check if there are multiple "Nothing" variations (there should only be 1)
            </li>
            <li>
              <strong>3. Fix Duplicates:</strong> If duplicates exist, click "Fix Duplicates" to merge them
            </li>
            <li className="text-yellow-400">
              <strong>Note:</strong> The correct "Nothing" variation should have ID 288 and type "item" (displays as "trait")
            </li>
            <li className="text-gray-400">
              The fix will preserve the total accumulated amount across all duplicates
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
