"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Comprehensive environment debugging panel
 * Shows ALL environment variables, connection status, and database info
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
  const isStaging = deploymentName === 'wry-trout-962';
  const isProduction = deploymentName === 'fabulous-sturgeon-691';

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
                      <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                      <span className="text-red-400 font-mono text-sm">ERROR</span>
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
                <span className="text-gray-400">Detected Environment:</span>
                <span className={`font-mono text-sm font-bold ${isStaging ? 'text-green-400' : isProduction ? 'text-red-400' : 'text-yellow-400'}`}>
                  {isStaging ? 'STAGING (Safe to break)' : isProduction ? 'PRODUCTION (LIVE DATA)' : 'UNKNOWN'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Expected Port:</span>
                <span className="text-white font-mono text-sm">
                  {isStaging ? '3200' : isProduction ? '3100' : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Port Match:</span>
                <span className={`font-mono text-sm ${
                  (isStaging && detectedPort === 3200) || (isProduction && detectedPort === 3100)
                    ? 'text-green-400'
                    : 'text-yellow-400'
                }`}>
                  {(isStaging && detectedPort === 3200) || (isProduction && detectedPort === 3100)
                    ? '✓ Correct'
                    : '⚠ Unexpected port'}
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
                <span className="text-gray-400">Database Type:</span>
                <span className={`font-mono text-sm ${isStaging ? 'text-green-400' : 'text-red-400'}`}>
                  {isStaging ? 'wry-trout-962 (Staging)' : 'fabulous-sturgeon-691 (Production)'}
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

          {/* Expected Configuration */}
          <section>
            <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <span>📋</span> Expected Configuration
            </h3>
            <div className="bg-gray-800/50 rounded border border-gray-700 p-4 space-y-4">
              <div>
                <div className="text-green-400 font-bold mb-2">🟢 STAGING (wry-trout-962)</div>
                <div className="ml-4 space-y-1 text-sm">
                  <div className="text-gray-300 font-mono">Port: 3200</div>
                  <div className="text-gray-300 font-mono">URL: https://wry-trout-962.convex.cloud</div>
                  <div className="text-gray-400">Safe to break, experiment, reset data</div>
                </div>
              </div>
              <div>
                <div className="text-red-400 font-bold mb-2">🔴 PRODUCTION (fabulous-sturgeon-691)</div>
                <div className="ml-4 space-y-1 text-sm">
                  <div className="text-gray-300 font-mono">Port: 3100</div>
                  <div className="text-gray-300 font-mono">URL: https://fabulous-sturgeon-691.convex.cloud</div>
                  <div className="text-gray-400">LIVE DATA - Used by Vercel deployment</div>
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
