"use client";

/**
 * EnvironmentDebugPanel - DUAL DATABASE MODE
 *
 * Shows both Trout (staging) and Sturgeon (production) database status.
 */

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { ConvexHttpClient } from "convex/browser";
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

  // Database URLs
  const troutUrl = process.env.NEXT_PUBLIC_CONVEX_URL || '';
  const sturgeonUrl = process.env.NEXT_PUBLIC_STURGEON_URL || '';

  // HTTP clients for testing connections
  const [troutClient] = useState(() => troutUrl ? new ConvexHttpClient(troutUrl) : null);
  const [sturgeonClient] = useState(() => sturgeonUrl ? new ConvexHttpClient(sturgeonUrl) : null);

  // Connection status states
  const [troutStatus, setTroutStatus] = useState<'connecting' | 'online' | 'error'>('connecting');
  const [sturgeonStatus, setSturgeonStatus] = useState<'connecting' | 'online' | 'error' | 'not-configured'>('connecting');
  const [troutUserCount, setTroutUserCount] = useState<number | null>(null);
  const [sturgeonUserCount, setSturgeonUserCount] = useState<number | null>(null);

  // Test query for main connection
  const userGold = useQuery(api.users.getUserGold);
  const users = useQuery(api.users.getAllUsers);

  // Test connections to both databases
  useEffect(() => {
    async function testConnections() {
      // Test Trout
      if (troutClient) {
        try {
          const users = await troutClient.query(api.users.getAllUsers);
          setTroutStatus('online');
          setTroutUserCount(users?.length || 0);
        } catch {
          setTroutStatus('error');
        }
      }

      // Test Sturgeon
      if (sturgeonClient) {
        try {
          const users = await sturgeonClient.query(api.users.getAllUsers);
          setSturgeonStatus('online');
          setSturgeonUserCount(users?.length || 0);
        } catch {
          setSturgeonStatus('error');
        }
      } else {
        setSturgeonStatus('not-configured');
      }
    }

    if (isVisible) {
      testConnections();
    }
  }, [isVisible, troutClient, sturgeonClient]);

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

  const troutDeployment = troutUrl.split("//")[1]?.split(".")[0] || "unknown";
  const sturgeonDeployment = sturgeonUrl?.split("//")[1]?.split(".")[0] || "not-configured";

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
          {/* Dual Database Status */}
          <section>
            <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <span>🐟</span> Dual Database Status
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Trout (Staging) */}
              <div className="bg-yellow-900/20 border border-yellow-600/50 rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-yellow-400 font-bold">STAGING (Trout)</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      troutStatus === 'online' ? 'bg-green-400' :
                      troutStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
                    }`} />
                    <span className={`text-xs font-mono ${
                      troutStatus === 'online' ? 'text-green-400' :
                      troutStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {troutStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="text-gray-400">Deployment: <span className="text-yellow-300 font-mono">{troutDeployment}</span></div>
                  <div className="text-gray-400">Users: <span className="text-yellow-300 font-mono">{troutUserCount ?? 'Loading...'}</span></div>
                  <div className="text-gray-400 text-xs break-all mt-2">{troutUrl}</div>
                </div>
              </div>

              {/* Sturgeon (Production) */}
              <div className="bg-green-900/20 border border-green-600/50 rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-green-400 font-bold">PRODUCTION (Sturgeon)</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      sturgeonStatus === 'online' ? 'bg-green-400' :
                      sturgeonStatus === 'error' ? 'bg-red-400' :
                      sturgeonStatus === 'not-configured' ? 'bg-gray-400' : 'bg-yellow-400 animate-pulse'
                    }`} />
                    <span className={`text-xs font-mono ${
                      sturgeonStatus === 'online' ? 'text-green-400' :
                      sturgeonStatus === 'error' ? 'text-red-400' :
                      sturgeonStatus === 'not-configured' ? 'text-gray-400' : 'text-yellow-400'
                    }`}>
                      {sturgeonStatus === 'not-configured' ? 'NOT CONFIGURED' : sturgeonStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="text-gray-400">Deployment: <span className="text-green-300 font-mono">{sturgeonDeployment}</span></div>
                  <div className="text-gray-400">Users: <span className="text-green-300 font-mono">{sturgeonUserCount ?? (sturgeonStatus === 'not-configured' ? 'N/A' : 'Loading...')}</span></div>
                  <div className="text-gray-400 text-xs break-all mt-2">{sturgeonUrl || 'Add NEXT_PUBLIC_STURGEON_URL to .env.local'}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Main Connection Status */}
          <section>
            <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <span>🔌</span> Main Connection Status
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
                <span className="text-gray-400">User Count (via hook):</span>
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
                <span className="font-mono text-sm font-bold text-cyan-400">
                  DUAL DATABASE (Trout + Sturgeon)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Main Client:</span>
                <span className="font-mono text-sm text-yellow-400">
                  {troutDeployment} (Staging)
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
