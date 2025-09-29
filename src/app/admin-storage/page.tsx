"use client";

import StorageMonitoringDashboard from "@/components/StorageMonitoringDashboard";

export default function AdminStoragePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-500 uppercase tracking-wider font-['Orbitron'] mb-2">
            Storage Monitoring
          </h1>
          <p className="text-gray-400">
            Real-time tracking of Convex database storage usage and growth projections
          </p>
        </div>

        <StorageMonitoringDashboard />

        <div className="mt-8 bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 uppercase">Storage Strategy</h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-start gap-3">
              <div className="text-green-500 mt-1">✓</div>
              <div>
                <strong>6-Hour Snapshots (mekOwnershipHistory):</strong> Kept forever for exploit-proof audit trail and retroactive rate adjustments
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-green-500 mt-1">✓</div>
              <div>
                <strong>Hourly Snapshots (goldSnapshots):</strong> Capped at 100 per wallet with automatic cleanup
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-green-500 mt-1">✓</div>
              <div>
                <strong>Cost Efficiency:</strong> At current scale (~14 MB/month per 100 wallets), storage costs are negligible vs. audit trail benefits
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-yellow-500 mt-1">⚠</div>
              <div>
                <strong>Future Optimization:</strong> If storage exceeds 5 GB or costs exceed $5/year, consider implementing 90-day detailed + aggregated summary strategy
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}