"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AdminGoldRepairPage() {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [fixResults, setFixResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = useMutation(api.diagnosticCorruptedGold.findCorruptedGoldRecords);
  const runFix = useMutation(api.fixCorruptedGold.fixCorruptedCumulativeGold);

  const handleDiagnostic = async () => {
    setIsRunning(true);
    try {
      const results = await runDiagnostic({});
      setDiagnosticResults(results);
    } catch (error: any) {
      console.error("Diagnostic failed:", error);
      alert("Diagnostic failed: " + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleFix = async () => {
    if (!confirm("Are you sure you want to fix all corrupted gold records? This will update the database.")) {
      return;
    }

    setIsRunning(true);
    try {
      const results = await runFix({});
      setFixResults(results);
      // Re-run diagnostic to confirm fix
      const newDiagnostic = await runDiagnostic({});
      setDiagnosticResults(newDiagnostic);
    } catch (error: any) {
      console.error("Fix failed:", error);
      alert("Fix failed: " + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-yellow-500">
          Admin: Gold Repair Tool
        </h1>

        <div className="space-y-6">
          {/* Diagnostic Section */}
          <div className="bg-gray-800 border border-yellow-500/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">1. Diagnostic Scan</h2>
            <p className="text-gray-300 mb-4">
              Scan all gold mining records to find any with corrupted cumulative gold values.
            </p>
            <button
              onClick={handleDiagnostic}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? "Scanning..." : "Run Diagnostic"}
            </button>

            {diagnosticResults && (
              <div className="mt-6 p-4 bg-gray-900 rounded border border-yellow-500/20">
                <h3 className="text-xl font-bold mb-2">Diagnostic Results:</h3>
                <div className="space-y-2 text-sm">
                  <p>Total Records: <span className="text-yellow-500">{diagnosticResults.totalRecords}</span></p>
                  <p>Corrupted Records: <span className={diagnosticResults.corruptedCount > 0 ? "text-red-500" : "text-green-500"}>
                    {diagnosticResults.corruptedCount}
                  </span></p>

                  {diagnosticResults.corruptedCount > 0 && (
                    <div className="mt-4">
                      <h4 className="font-bold mb-2">Corrupted Wallets:</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {diagnosticResults.corruptedRecords.map((record: any, idx: number) => (
                          <div key={idx} className="bg-gray-800 p-2 rounded text-xs">
                            <p><span className="text-gray-400">Wallet:</span> {record.wallet}</p>
                            <p><span className="text-gray-400">Accumulated:</span> {record.accumulated.toFixed(2)}</p>
                            <p><span className="text-gray-400">Cumulative:</span> {record.cumulative.toFixed(2)}</p>
                            <p><span className="text-gray-400">Spent:</span> {record.spent.toFixed(2)}</p>
                            <p><span className="text-red-400">Deficit:</span> {record.deficit.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fix Section */}
          <div className="bg-gray-800 border border-yellow-500/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">2. Repair Corrupted Records</h2>
            <p className="text-gray-300 mb-4">
              Fix all corrupted records by setting totalCumulativeGold = accumulatedGold + totalSpent.
              This ensures the gold invariant is maintained.
            </p>
            <button
              onClick={handleFix}
              disabled={isRunning || (diagnosticResults && diagnosticResults.corruptedCount === 0)}
              className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? "Fixing..." : "Fix Corrupted Records"}
            </button>

            {fixResults && (
              <div className="mt-6 p-4 bg-gray-900 rounded border border-green-500/20">
                <h3 className="text-xl font-bold mb-2 text-green-500">Fix Results:</h3>
                <div className="space-y-2 text-sm">
                  <p>Total Records: <span className="text-yellow-500">{fixResults.totalRecords}</span></p>
                  <p>Fixed Records: <span className="text-green-500">{fixResults.fixedCount}</span></p>

                  {fixResults.fixedCount > 0 && (
                    <div className="mt-4">
                      <h4 className="font-bold mb-2">Fixed Wallets:</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {fixResults.fixedWallets.map((record: any, idx: number) => (
                          <div key={idx} className="bg-gray-800 p-2 rounded text-xs">
                            <p><span className="text-gray-400">Wallet:</span> {record.wallet}</p>
                            <p><span className="text-gray-400">Old Cumulative:</span> {record.oldCumulative.toFixed(2)}</p>
                            <p><span className="text-green-400">New Cumulative:</span> {record.newCumulative.toFixed(2)}</p>
                            <p><span className="text-yellow-400">Deficit Fixed:</span> +{record.deficit.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="bg-gray-800 border border-blue-500/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">What This Does</h2>
            <div className="text-gray-300 space-y-2 text-sm">
              <p>
                <strong>The Gold Invariant:</strong> totalCumulativeGold ≥ accumulatedGold + totalSpent
              </p>
              <p>
                This invariant ensures that the total gold ever earned is always greater than or equal to
                the sum of current gold plus gold spent on upgrades.
              </p>
              <p className="mt-4">
                <strong>Why it breaks:</strong> Database initialization bugs, incomplete migrations, or
                manual database edits can cause cumulative gold to be less than it should be.
              </p>
              <p className="mt-4">
                <strong>How the fix works:</strong> Sets totalCumulativeGold to the minimum valid value
                (accumulatedGold + totalSpent) for any corrupted records. This prevents errors while
                preserving the integrity of gold tracking.
              </p>
              <p className="mt-4 text-yellow-500">
                <strong>Note:</strong> The auto-fix in calculateGoldIncrease() will now prevent new
                corruption, but existing corrupted records need to be repaired using this tool.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
