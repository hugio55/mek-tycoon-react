"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

export default function AdminSyncHealthPage() {
  const [scanningAll, setScanningAll] = useState(false);
  const [verifyingWallet, setVerifyingWallet] = useState<string | null>(null);
  const [fixingWallet, setFixingWallet] = useState<string | null>(null);
  const [walletInput, setWalletInput] = useState("");
  const [scanResults, setScanResults] = useState<any>(null);
  const [verificationResults, setVerificationResults] = useState<any>(null);

  // Get all desynced wallets
  const desyncedWallets = useQuery(api.syncChecksums.getDesyncedWallets, {});

  // Actions
  const scanAllWallets = useAction(api.syncChecksums.scanAllWalletsForDesyncs);
  const verifyWallet = useAction(api.syncChecksums.verifyWalletSync);
  const fixWallet = useAction(api.syncChecksums.fixDesyncedWallet);
  const adminForceResync = useAction(api.adminSyncFix.adminForceResync);

  const handleScanAll = async (checkBlockchain: boolean) => {
    setScanningAll(true);
    setScanResults(null);

    try {
      const results = await scanAllWallets({
        checkBlockchain,
        limit: 100,
      });
      setScanResults(results);
    } catch (error: any) {
      alert(`Scan failed: ${error.message}`);
    } finally {
      setScanningAll(false);
    }
  };

  const handleVerifyWallet = async (walletAddress: string, checkBlockchain: boolean) => {
    setVerifyingWallet(walletAddress);
    setVerificationResults(null);

    try {
      const results = await verifyWallet({
        walletAddress,
        checkBlockchain,
      });
      setVerificationResults(results);
    } catch (error: any) {
      alert(`Verification failed: ${error.message}`);
    } finally {
      setVerifyingWallet(null);
    }
  };

  const handleFixWallet = async (walletAddress: string) => {
    if (!confirm(`Fix desynced wallet ${walletAddress}? This will re-sync from blockchain using admin bypass.`)) {
      return;
    }

    setFixingWallet(walletAddress);

    try {
      // Use admin force resync (bypasses authentication)
      const results = await adminForceResync({ stakeAddress: walletAddress });

      if (results.success) {
        alert(`✓ ${results.message}`);
        // Refresh the page
        window.location.reload();
      } else {
        alert(`✗ ${results.message || results.error}`);
      }
    } catch (error: any) {
      alert(`Fix failed: ${error.message}`);
    } finally {
      setFixingWallet(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-yellow-500">NFT Sync Health Dashboard</h1>

      {/* Quick Actions */}
      <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-yellow-500">Quick Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Scan All Wallets */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-300">Scan All Wallets</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleScanAll(false)}
                disabled={scanningAll}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm"
              >
                {scanningAll ? "Scanning..." : "Scan (DB Only)"}
              </button>
              <button
                onClick={() => handleScanAll(true)}
                disabled={scanningAll}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm"
              >
                {scanningAll ? "Scanning..." : "Scan (With Blockchain)"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Scans first 100 wallets for sync issues
            </p>
          </div>

          {/* Verify Single Wallet */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-300">Verify Single Wallet</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                placeholder="stake1u..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
              />
              <button
                onClick={() => handleVerifyWallet(walletInput, true)}
                disabled={!walletInput || verifyingWallet !== null}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scan Results */}
      {scanResults && (
        <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-yellow-500">Scan Results</h2>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-2xl font-bold">{scanResults.totalScanned}</div>
              <div className="text-sm text-gray-400">Total Scanned</div>
            </div>
            <div className="bg-green-900/30 p-4 rounded">
              <div className="text-2xl font-bold text-green-400">{scanResults.synced}</div>
              <div className="text-sm text-gray-400">Synced</div>
            </div>
            <div className="bg-red-900/30 p-4 rounded">
              <div className="text-2xl font-bold text-red-400">{scanResults.desynced}</div>
              <div className="text-sm text-gray-400">Desynced</div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-2xl font-bold text-gray-400">{scanResults.unknown}</div>
              <div className="text-sm text-gray-400">Unknown</div>
            </div>
          </div>

          {scanResults.desyncedWallets && scanResults.desyncedWallets.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-red-400">Desynced Wallets:</h3>
              <div className="space-y-2">
                {scanResults.desyncedWallets.map((wallet: any) => (
                  <div key={wallet.walletAddress} className="bg-gray-800 p-3 rounded flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-mono text-sm">{wallet.walletAddress}</div>
                      {wallet.companyName && (
                        <div className="text-sm text-gray-400">{wallet.companyName}</div>
                      )}
                      <div className="text-sm mt-1">
                        <span className="text-blue-400">DB: {wallet.dbMekCount}</span>
                        {" → "}
                        <span className="text-yellow-400">Blockchain: {wallet.blockchainMekCount}</span>
                      </div>
                      {wallet.discrepancies && wallet.discrepancies.length > 0 && (
                        <ul className="text-xs text-gray-400 mt-1 list-disc list-inside">
                          {wallet.discrepancies.map((d: string, i: number) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button
                      onClick={() => handleFixWallet(wallet.walletAddress)}
                      disabled={fixingWallet === wallet.walletAddress}
                      className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm ml-4"
                    >
                      {fixingWallet === wallet.walletAddress ? "Fixing..." : "Fix"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verification Results */}
      {verificationResults && (
        <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-yellow-500">Verification Results</h2>

          <div className={`p-4 rounded mb-4 ${
            verificationResults.status === "synced" ? "bg-green-900/30 border border-green-500/30" :
            verificationResults.status === "desynced" ? "bg-red-900/30 border border-red-500/30" :
            "bg-gray-800 border border-gray-700"
          }`}>
            <div className="text-lg font-bold mb-2">
              Status: <span className={
                verificationResults.status === "synced" ? "text-green-400" :
                verificationResults.status === "desynced" ? "text-red-400" :
                "text-gray-400"
              }>{verificationResults.status.toUpperCase()}</span>
            </div>
            <div className="text-sm text-gray-300">{verificationResults.message}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-2xl font-bold text-blue-400">{verificationResults.dbMekCount}</div>
              <div className="text-sm text-gray-400">Database Meks</div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-2xl font-bold text-yellow-400">{verificationResults.blockchainMekCount}</div>
              <div className="text-sm text-gray-400">Blockchain Meks</div>
            </div>
          </div>

          {verificationResults.discrepancies && verificationResults.discrepancies.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-red-400">Discrepancies:</h3>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                {verificationResults.discrepancies.map((d: string, i: number) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {verificationResults.missingInDb && verificationResults.missingInDb.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2 text-yellow-400">Missing in Database:</h3>
              <div className="text-xs text-gray-300 font-mono">
                {verificationResults.missingInDb.join(", ")}
              </div>
            </div>
          )}

          {verificationResults.extraInDb && verificationResults.extraInDb.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2 text-blue-400">Extra in Database:</h3>
              <div className="text-xs text-gray-300 font-mono">
                {verificationResults.extraInDb.join(", ")}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Currently Desynced Wallets */}
      <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-yellow-500">Currently Desynced Wallets</h2>

        {!desyncedWallets ? (
          <div className="text-gray-400">Loading...</div>
        ) : desyncedWallets.length === 0 ? (
          <div className="text-green-400">✓ All wallets are in sync!</div>
        ) : (
          <div className="space-y-2">
            {desyncedWallets.map((wallet) => (
              <div key={wallet._id} className="bg-gray-800 p-3 rounded flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-mono text-sm">{wallet.walletAddress}</div>
                  <div className="text-sm text-gray-400">
                    {wallet.mekCount} Meks • Checksum: {wallet.checksum}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last sync: {new Date(wallet.lastSyncTime).toLocaleString()}
                  </div>
                  {wallet.discrepancies && wallet.discrepancies.length > 0 && (
                    <ul className="text-xs text-red-400 mt-1 list-disc list-inside">
                      {wallet.discrepancies.map((d: string, i: number) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerifyWallet(wallet.walletAddress, true)}
                    disabled={verifyingWallet === wallet.walletAddress}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
                  >
                    {verifyingWallet === wallet.walletAddress ? "Verifying..." : "Verify"}
                  </button>
                  <button
                    onClick={() => handleFixWallet(wallet.walletAddress)}
                    disabled={fixingWallet === wallet.walletAddress}
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
                  >
                    {fixingWallet === wallet.walletAddress ? "Fixing..." : "Fix"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documentation */}
      <div className="mt-6 bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-bold mb-3 text-gray-300">How It Works</h2>
        <div className="text-sm text-gray-400 space-y-2">
          <p>
            <strong className="text-yellow-500">Checksums:</strong> Each wallet's NFT list has a unique checksum calculated from sorted asset IDs.
          </p>
          <p>
            <strong className="text-yellow-500">Sync Status:</strong> Wallets are marked "synced", "desynced", or "unknown" based on checksum comparison.
          </p>
          <p>
            <strong className="text-yellow-500">Scan (DB Only):</strong> Fast scan that only checks database checksums (no blockchain calls).
          </p>
          <p>
            <strong className="text-yellow-500">Scan (With Blockchain):</strong> Full verification that fetches current blockchain state and compares.
          </p>
          <p>
            <strong className="text-yellow-500">Fix:</strong> Re-syncs wallet from blockchain using atomic Saga pattern with rollback protection.
          </p>
        </div>
      </div>
    </div>
  );
}
