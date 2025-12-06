"use client";

/**
 * EnvironmentDebugPanel - SIMPLIFIED FOR SINGLE DATABASE
 *
 * Previously showed dual-database (Trout/Sturgeon) configuration.
 * Now shows single production database (Sturgeon) status.
 */

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Comprehensive environment debugging panel
 * Shows environment variables, connection status, and database info
 * Access via window.showEnvDebug() in console
 */
export default function EnvironmentDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [detectedPort, setDetectedPort] = useState<number | null>(null);
  const [detectedHost, setDetectedHost] = useState<string>("");

  // Test query to verify connection
  const userGold = useQuery(api.users.getUserGold);
  const users = useQuery(api.users.getAllUsers);

  useEffect(() => {
    // Expose toggle function to window
    if (typeof window !== "undefined") {
      (window as any).showEnvDebug = () => setIsVisible(true);
      (window as any).hideEnvDebug = () => setIsVisible(false);
      (window as any).toggleEnvDebug = () => setIsVisible(prev => !prev);

      // Detect current environment
      setDetectedPort(parseInt(window.location.port) || (window.location.protocol === 'https:' ? 443 : 80));
      setDetectedHost(window.location.hostname);

      // Collect all NEXT_PUBLIC_ environment variables
      const publicEnvVars: Record<string, string> = {};
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('NEXT_PUBLIC_')) {
          publicEnvVars[key] = process.env[key] || '';
        }
      });
      setEnvVars(publicEnvVars);

      console.log('%c🔍 Environment Debug Panel Available', 'color: #10b981; font-size: 14px; font-weight: bold;');
      console.log('%cRun window.showEnvDebug() to open debug panel', 'color: #6b7280; font-size: 12px;');
    }
  }, []);

  if (!isVisible) return null;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || '';
  const deploymentName = convexUrl.split("//")[1]?.split(".")[0] || "unknown";
  const isProduction = deploymentName === 'fabulous-sturgeon-691';
  const isStaging = deploymentName === 'wry-trout-962';
  const databaseLabel = isProduction ? 'Sturgeon (Production)' : isStaging ? 'Trout (Staging)' : deploymentName;

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setIsVisible(false)}
    >
      <div
        className="bg-gray-900 border-2 border-yellow-500/50 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-yellow-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔍</div>
            <div>
              <h2 className="text-xl font-bold text-yellow-400 uppercase tracking-wider">
                Environment Debug Panel
              </h2>
              <p className="text-xs text-gray-400 mt-1">Complete environment and connection diagnostics</p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Connection Status */}
          <section>
            <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <span>🔌</span> Connection Status
            </h3>
            <div className="bg-gray-800/50 rounded border border-gray-700 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Convex Connected:</span>
                <div className="flex items-center gap-2">
                  {userGold === undefined ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                      <span className="text-yellow-400 font-mono text-sm">CONNECTING...</span>
                    </>
                  ) : userGold === null ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 font-mono text-sm">ONLINE (no wallet)</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 font-mono text-sm">ONLINE</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">User Count:</span>
                <span className="text-white font-mono text-sm">
                  {users === undefined ? 'Loading...' : users === null ? 'Error' : users.length}
                </span>
              </div>
            </div>
          </section>

          {/* Environment Detection */}
          <section>
            <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <span>🌍</span> Environment Detection
            </h3>
            <div className="bg-gray-800/50 rounded border border-gray-700 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Current URL:</span>
                <span className="text-white font-mono text-sm">{detectedHost}:{detectedPort}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Database Mode:</span>
                <span className={`font-mono text-sm font-bold ${isProduction ? 'text-green-400' : 'text-yellow-400'}`}>
                  SINGLE DATABASE ({isProduction ? 'Production' : 'Staging'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Deployment:</span>
                <span className={`font-mono text-sm ${isProduction ? 'text-green-400' : 'text-yellow-400'}`}>
                  {isProduction ? 'fabulous-sturgeon-691 (Sturgeon)' : deploymentName}
                </span>
              </div>
            </div>
          </section>

          {/* Convex Configuration */}
          <section>
            <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <span>📦</span> Convex Configuration
            </h3>
            <div className="bg-gray-800/50 rounded border border-gray-700 p-4 space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-gray-400">NEXT_PUBLIC_CONVEX_URL:</span>
                <span className="text-white font-mono text-sm text-right break-all ml-4">
                  {convexUrl || <span className="text-red-400">NOT SET</span>}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Deployment Name:</span>
                <span className="text-white font-mono text-sm">{deploymentName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Database:</span>
                <span className={`font-mono text-sm ${isProduction ? 'text-green-400' : 'text-yellow-400'}`}>
                  {databaseLabel} (Single Database Mode)
                </span>
              </div>
            </div>
          </section>

          {/* All Environment Variables */}
          <section>
            <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <span>⚙️</span> All NEXT_PUBLIC_ Variables
            </h3>
            <div className="bg-gray-800/50 rounded border border-gray-700 p-4">
              {Object.keys(envVars).length === 0 ? (
                <p className="text-gray-500 text-sm">No public environment variables found</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(envVars).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-4 text-sm">
                      <span className="text-gray-400 font-mono min-w-[200px]">{key}:</span>
                      <span className="text-white font-mono break-all flex-1">
                        {value || <span className="text-gray-600 italic">empty</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Configuration Info */}
          <section>
            <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <span>📋</span> Database Configuration
            </h3>
            <div className="bg-gray-800/50 rounded border border-gray-700 p-4">
              <div className={`${isProduction ? 'bg-green-900/30 border-green-600/50' : 'bg-yellow-900/30 border-yellow-600/50'} border rounded p-4`}>
                <div className={`${isProduction ? 'text-green-400' : 'text-yellow-400'} font-bold mb-2`}>
                  🐟 {isProduction ? 'PRODUCTION' : 'STAGING'} ({deploymentName})
                </div>
                <div className="ml-4 space-y-1 text-sm">
                  <div className="text-gray-300 font-mono">URL: {convexUrl}</div>
                  <div className="text-gray-400">Single database mode - code uses this database only</div>
                </div>
              </div>
            </div>
          </section>

          {/* Console Commands */}
          <section>
            <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <span>💻</span> Console Commands
            </h3>
            <div className="bg-gray-800/50 rounded border border-gray-700 p-4 space-y-2 text-sm">
              <div className="font-mono text-gray-300">
                <span className="text-green-400">window.showEnvDebug()</span> - Show this panel
              </div>
              <div className="font-mono text-gray-300">
                <span className="text-green-400">window.hideEnvDebug()</span> - Hide this panel
              </div>
              <div className="font-mono text-gray-300">
                <span className="text-green-400">window.toggleEnvDebug()</span> - Toggle this panel
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
