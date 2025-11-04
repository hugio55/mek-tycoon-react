"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@/contexts/UserContext";

export default function TenureDiagnosticPage() {
  const { userId } = useUser();

  console.log('[🔍 DIAGNOSTIC-PAGE] userId from context:', userId);

  const diagnostic = useQuery(
    api.essence.diagnosticCheckSlottedMeksInMeksTable,
    userId ? { walletAddress: userId } : "skip"
  );

  console.log('[🔍 DIAGNOSTIC-PAGE] Diagnostic result:', diagnostic);

  if (!userId) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Tenure Diagnostic Tool</h1>
          <p className="text-red-400">No wallet connected. Please connect wallet first.</p>
        </div>
      </div>
    );
  }

  if (!diagnostic) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Tenure Diagnostic Tool</h1>
          <p className="text-gray-400">Loading diagnostic data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Tenure Diagnostic Tool</h1>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-gray-400 text-sm">Total Slotted Meks</div>
              <div className="text-2xl font-bold text-yellow-400">{diagnostic.totalSlottedMeks}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">In Meks Table</div>
              <div className="text-2xl font-bold text-green-400">{diagnostic.summary.inMeksTable}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Missing from Meks Table</div>
              <div className="text-2xl font-bold text-red-400">{diagnostic.summary.notInMeksTable}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-gray-400 text-sm">Properly Configured for Tenure</div>
            <div className="text-2xl font-bold text-blue-400">{diagnostic.summary.properlyConfigured}</div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Detailed Results</h2>
          {diagnostic.results.length === 0 ? (
            <p className="text-gray-400">No slotted Meks found.</p>
          ) : (
            <div className="space-y-4">
              {diagnostic.results.map((result: any) => (
                <div
                  key={result.slotNumber}
                  className={`border rounded-lg p-4 ${
                    result.diagnosis.startsWith("✅")
                      ? "border-green-600 bg-green-900/20"
                      : result.diagnosis.startsWith("⚠️")
                      ? "border-yellow-600 bg-yellow-900/20"
                      : "border-red-600 bg-red-900/20"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm text-gray-400">Slot {result.slotNumber}</div>
                      <div className="font-mono text-xs text-gray-500">{result.mekAssetId}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        <span className={result.existsInMeksTable ? "text-green-400" : "text-red-400"}>
                          {result.existsInMeksTable ? "✓" : "✗"} Meks Table
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className={result.existsInGoldMining ? "text-green-400" : "text-red-400"}>
                          {result.existsInGoldMining ? "✓" : "✗"} GoldMining
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 text-sm font-semibold">{result.diagnosis}</div>

                  {result.mekRecordData && (
                    <div className="bg-black/40 rounded p-3 text-sm space-y-1">
                      <div><span className="text-gray-400">Asset Name:</span> {result.mekRecordData.assetName}</div>
                      <div><span className="text-gray-400">Owner:</span> <span className="font-mono text-xs">{result.mekRecordData.owner?.slice(0, 20)}...</span></div>
                      <div><span className="text-gray-400">Is Slotted:</span> {String(result.mekRecordData.isSlotted)}</div>
                      <div><span className="text-gray-400">Tenure Points:</span> {result.mekRecordData.tenurePoints ?? "undefined"}</div>
                      <div><span className="text-gray-400">Last Tenure Update:</span> {result.mekRecordData.lastTenureUpdate ? new Date(result.mekRecordData.lastTenureUpdate).toLocaleString() : "undefined"}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
          <h3 className="font-bold mb-2">How to Fix Issues:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
            <li>If Meks are missing from meks table: Run migration to sync from goldMining.ownedMeks</li>
            <li>If isSlotted=false: Re-slot the Mek to trigger tenure tracking</li>
            <li>If lastTenureUpdate not set: Unslot and re-slot the Mek</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
