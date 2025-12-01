"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AdminRequestAnalysisPage() {
  const analysis = useQuery(api.diagnosticRequestAnalysis.getRequestAnalysis);
  const userActivity = useQuery(api.diagnosticRequestAnalysis.getUserActivityBreakdown, { hours: 24 });

  if (!analysis || !userActivity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-yellow-500">
            Request Analysis
          </h1>
          <div className="text-gray-400">Loading analysis...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold mb-8 text-yellow-500">
          Convex Request Analysis
        </h1>

        {/* Summary Stats */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-yellow-500/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-black/50 p-4 rounded">
              <div className="text-gray-400 text-sm">Total Users</div>
              <div className="text-3xl font-bold">{analysis.summary.totalUsers}</div>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <div className="text-gray-400 text-sm">Active Last 24h</div>
              <div className="text-3xl font-bold text-green-400">
                {analysis.summary.activeUsersLast24h}
              </div>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <div className="text-gray-400 text-sm">Active Sessions</div>
              <div className="text-3xl font-bold text-blue-400">
                {analysis.summary.activeSessionsLast24h}
              </div>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <div className="text-gray-400 text-sm">Estimated Daily Requests</div>
              <div className="text-3xl font-bold text-yellow-400">
                {analysis.summary.estimatedDailyRequests.toLocaleString()}
              </div>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <div className="text-gray-400 text-sm">Requests/User/Day</div>
              <div className="text-3xl font-bold">{analysis.summary.requestsPerActiveUser}</div>
            </div>
          </div>
        </div>

        {/* User Activity Breakdown */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-yellow-500/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">
            User Activity (Last 24 Hours)
          </h2>
          <div className="space-y-4">
            <div className="bg-black/50 p-4 rounded border border-green-500/30">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-green-400 font-bold">Very Active:</span>
                  <span className="text-gray-400 text-sm ml-2">
                    {userActivity.userActivity.veryActive.description}
                  </span>
                </div>
                <span className="text-2xl font-bold">{userActivity.userActivity.veryActive.count}</span>
              </div>
              {userActivity.userActivity.veryActive.users.length > 0 && (
                <div className="mt-2 space-y-1">
                  {userActivity.userActivity.veryActive.users.map((user: any, idx: number) => (
                    <div key={idx} className="text-xs text-gray-500 font-mono">
                      {user.wallet} - {user.hoursSinceActivity}h ago
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-black/50 p-4 rounded border border-blue-500/30">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-blue-400 font-bold">Active:</span>
                  <span className="text-gray-400 text-sm ml-2">
                    {userActivity.userActivity.active.description}
                  </span>
                </div>
                <span className="text-2xl font-bold">{userActivity.userActivity.active.count}</span>
              </div>
            </div>

            <div className="bg-black/50 p-4 rounded border border-gray-500/30">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-gray-400 font-bold">Inactive:</span>
                  <span className="text-gray-400 text-sm ml-2">
                    {userActivity.userActivity.inactive.description}
                  </span>
                </div>
                <span className="text-2xl font-bold">{userActivity.userActivity.inactive.count}</span>
              </div>
            </div>

            <div className="bg-black/50 p-4 rounded border border-gray-700/30">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-gray-600 font-bold">Dormant:</span>
                  <span className="text-gray-400 text-sm ml-2">
                    {userActivity.userActivity.dormant.description}
                  </span>
                </div>
                <span className="text-2xl font-bold">{userActivity.userActivity.dormant.count}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-yellow-900/20 border border-yellow-500/50 rounded p-3">
            <div className="text-yellow-300 font-bold mb-2">Estimated Hourly Load:</div>
            <div className="text-sm text-gray-300">
              Very Active Users: {userActivity.estimatedLoad.veryActive} req/hr
              <br />
              Active Users: {userActivity.estimatedLoad.active} req/hr
              <br />
              <span className="text-yellow-400 font-bold">
                Total: ~{userActivity.estimatedLoad.total} requests/hour
              </span>
            </div>
          </div>
        </div>

        {/* Request Breakdown */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-yellow-500/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">
            Request Breakdown (Per Active User)
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between bg-black/50 p-3 rounded">
              <span>Initial Page Load Queries</span>
              <span className="font-bold">{analysis.breakdown.initialPageLoadQueries}</span>
            </div>
            <div className="flex justify-between bg-black/50 p-3 rounded">
              <span>Checkpoint Mutations (per day)</span>
              <span className="font-bold">{analysis.breakdown.checkpointMutations}</span>
            </div>
            <div className="flex justify-between bg-black/50 p-3 rounded">
              <span>Reactivity Updates (estimated)</span>
              <span className="font-bold">{analysis.breakdown.estimatedReactivityUpdates}</span>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-bold mb-3 text-yellow-300">Cron Jobs (Global)</h3>
            <div className="space-y-2">
              <div className="flex justify-between bg-black/50 p-2 rounded text-sm">
                <span>Leaderboard Updates</span>
                <span>{analysis.breakdown.cronJobs.leaderboardUpdates}/day (every 5 min)</span>
              </div>
              <div className="flex justify-between bg-black/50 p-2 rounded text-sm">
                <span>Nonce Cleanup</span>
                <span>{analysis.breakdown.cronJobs.nonceCleanu}/day (every 15 min)</span>
              </div>
              <div className="flex justify-between bg-black/50 p-2 rounded text-sm">
                <span>Snapshot Checks</span>
                <span>{analysis.breakdown.cronJobs.snapshotChecks}/day (every 6 hrs)</span>
              </div>
              <div className="flex justify-between bg-black/50 p-2 rounded text-sm">
                <span>Gold Backups</span>
                <span>{analysis.breakdown.cronJobs.goldBackups}/day (every 6 hrs)</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Activity */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-yellow-500/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">System Activity</h2>
          <div className="space-y-2">
            <div className="flex justify-between bg-black/50 p-3 rounded">
              <span>Snapshot Frequency</span>
              <span className="font-mono">{analysis.systemActivity.snapshotFrequency}</span>
            </div>
            <div className="flex justify-between bg-black/50 p-3 rounded">
              <span>Last Leaderboard Update</span>
              <span className="font-mono text-sm">{analysis.systemActivity.lastLeaderboardUpdate}</span>
            </div>
          </div>
        </div>

        {/* Potential Issues */}
        {analysis.potentialIssues.length > 0 && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-400">⚠️ Potential Issues</h2>
            <ul className="space-y-2">
              {analysis.potentialIssues.map((issue, idx) => (
                <li key={idx} className="text-red-300">• {issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">💡 Recommendations</h2>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="text-blue-300">• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
