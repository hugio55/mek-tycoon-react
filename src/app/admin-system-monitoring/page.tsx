"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

export default function SystemMonitoringPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");

  // TODO: Replace with actual wallet connection
  const stakeAddress = null;

  // Get recent events (requires authentication)
  const recentEvents = useQuery(
    api.monitoring.getRecentEvents,
    stakeAddress ? { stakeAddress, limit: 100 } : "skip"
  );

  // Get latest summaries (requires authentication)
  const summaries = useQuery(
    api.monitoring.getLatestSummaries,
    stakeAddress ? { stakeAddress, limit: 20 } : "skip"
  );

  // Get current summary (requires authentication)
  const currentSummary = useQuery(
    api.monitoring.getSummary,
    stakeAddress ? { stakeAddress } : "skip"
  );

  // Filter events
  const filteredEvents = recentEvents?.filter(event => {
    if (selectedFilter !== "all" && event.category !== selectedFilter) return false;
    if (selectedSeverity !== "all" && event.severity !== selectedSeverity) return false;
    return true;
  });

  // Show authentication required message if not logged in
  if (!stakeAddress) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-yellow-500 mb-8">
            System Monitoring Dashboard
          </h1>
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Authentication Required</h2>
            <p className="text-gray-300">Please connect your wallet to view system monitoring data.</p>
            <p className="text-gray-400 mt-4 text-sm">
              Tip: Access monitoring from Admin Master → Wallet Management → System Monitoring tab
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-500 mb-8">
          System Monitoring Dashboard
        </h1>

        {/* Current Health Overview */}
        {currentSummary && (
          <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">
              System Health (Last 24 Hours)
            </h2>

            <div className={`inline-block px-6 py-3 rounded-lg text-xl font-bold mb-6 ${
              currentSummary.systemHealth === "healthy" ? "bg-green-500/20 text-green-400 border-2 border-green-500" :
              currentSummary.systemHealth === "warning" ? "bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500" :
              "bg-red-500/20 text-red-400 border-2 border-red-500"
            }`}>
              {currentSummary.systemHealth.toUpperCase()}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/50 p-4 rounded border border-gray-700">
                <div className="text-gray-400 text-sm">Total Events</div>
                <div className="text-2xl font-bold text-white">{currentSummary.totalEvents}</div>
              </div>
              <div className="bg-black/50 p-4 rounded border border-gray-700">
                <div className="text-gray-400 text-sm">Errors</div>
                <div className="text-2xl font-bold text-red-400">{currentSummary.errorCount}</div>
              </div>
              <div className="bg-black/50 p-4 rounded border border-gray-700">
                <div className="text-gray-400 text-sm">Critical</div>
                <div className="text-2xl font-bold text-red-500">{currentSummary.criticalErrorCount}</div>
              </div>
              <div className="bg-black/50 p-4 rounded border border-gray-700">
                <div className="text-gray-400 text-sm">Snapshots</div>
                <div className="text-2xl font-bold text-blue-400">{currentSummary.snapshotCount}</div>
              </div>
            </div>

            {currentSummary.criticalEvents && currentSummary.criticalEvents.length > 0 && (
              <div className="mt-6 bg-red-500/10 border border-red-500 rounded p-4">
                <h3 className="text-red-400 font-bold mb-2">Critical Events</h3>
                {currentSummary.criticalEvents.map((event: any, i: number) => (
                  <div key={i} className="text-red-300 text-sm mb-1">
                    {new Date(event.timestamp).toLocaleTimeString()}: {event.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summaries Timeline */}
        <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">
            Monitoring Summaries (15-min intervals)
          </h2>

          <div className="space-y-2">
            {summaries && summaries.length > 0 ? (
              summaries.map((summary: any) => (
                <div
                  key={summary._id}
                  className={`p-4 rounded-lg border-2 ${
                    summary.systemHealth === "healthy" ? "bg-green-500/10 border-green-500/30" :
                    summary.systemHealth === "warning" ? "bg-yellow-500/10 border-yellow-500/30" :
                    "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-6">
                      <span className="text-gray-400">
                        {new Date(summary.endTime).toLocaleString()}
                      </span>
                      <span className={`font-bold ${
                        summary.systemHealth === "healthy" ? "text-green-400" :
                        summary.systemHealth === "warning" ? "text-yellow-400" :
                        "text-red-400"
                      }`}>
                        {summary.systemHealth.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span className="text-gray-300">Events: {summary.totalEvents}</span>
                      {summary.errorCount > 0 && (
                        <span className="text-red-400">Errors: {summary.errorCount}</span>
                      )}
                      {summary.criticalErrorCount > 0 && (
                        <span className="text-red-500 font-bold">Critical: {summary.criticalErrorCount}</span>
                      )}
                      {summary.snapshotCount > 0 && (
                        <span className="text-blue-400">Snapshots: {summary.snapshotCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">No summaries available yet</div>
            )}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Recent Events</h2>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="bg-black border border-gray-700 text-white px-4 py-2 rounded"
            >
              <option value="all">All Categories</option>
              <option value="snapshot">Snapshots</option>
              <option value="auth">Authentication</option>
              <option value="gold">Gold System</option>
              <option value="leaderboard">Leaderboard</option>
              <option value="cron">Cron Jobs</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-black border border-gray-700 text-white px-4 py-2 rounded"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Events List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredEvents && filteredEvents.length > 0 ? (
              filteredEvents.map((event: any) => (
                <div
                  key={event._id}
                  className={`p-3 rounded border-l-4 ${
                    event.severity === "critical" ? "bg-red-500/10 border-red-500" :
                    event.severity === "high" ? "bg-orange-500/10 border-orange-500" :
                    event.severity === "medium" ? "bg-yellow-500/10 border-yellow-500" :
                    "bg-gray-800 border-gray-600"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex gap-3 items-center mb-1">
                        <span className="text-xs text-gray-400">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          event.eventType === "critical_error" ? "bg-red-500 text-white" :
                          event.eventType === "error" ? "bg-red-400/80 text-white" :
                          event.eventType === "warning" ? "bg-yellow-500/80 text-black" :
                          event.eventType === "snapshot" ? "bg-blue-500/80 text-white" :
                          "bg-gray-700 text-white"
                        }`}>
                          {event.eventType}
                        </span>
                        <span className="text-xs text-gray-500">{event.category}</span>
                        {event.functionName && (
                          <span className="text-xs text-gray-600">{event.functionName}</span>
                        )}
                      </div>
                      <div className="text-white">{event.message}</div>
                      {event.walletAddress && (
                        <div className="text-xs text-gray-500 mt-1">
                          Wallet: {event.walletAddress.substring(0, 20)}...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">No events found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
