"use client";

/**
 * EnvironmentIndicator - DUAL DATABASE MODE
 *
 * Shows environment status based on connected database (Trout=Staging, Sturgeon=Production).
 */

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function EnvironmentIndicator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "error" | "loading">("loading");
  const [isMobile, setIsMobile] = useState(false);
  const [convexUrl, setConvexUrl] = useState<string>("");

  // Try to query something simple to verify connection
  const testQuery = useQuery(api.users.getUserGold);

  useEffect(() => {
    // Get Convex URL from environment
    const url = process.env.NEXT_PUBLIC_CONVEX_URL || "";
    setConvexUrl(url);

    // Detect mobile viewport
    if (typeof window !== "undefined") {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  useEffect(() => {
    // Update connection status based on query result
    if (testQuery === undefined) {
      setConnectionStatus("loading");
    } else if (testQuery === null) {
      // null can mean no gold yet - treat as connected
      setConnectionStatus("connected");
    } else {
      setConnectionStatus("connected");
    }
  }, [testQuery]);

  // Extract deployment name from Convex URL
  const deploymentName = convexUrl.split("//")[1]?.split(".")[0] || "unknown";

  // Detect if production (Sturgeon) or staging (Trout) based on URL
  const isProduction = convexUrl.includes('sturgeon');

  // Dynamic environment config based on connected database
  const environment = isProduction ? {
    name: "PRODUCTION",
    database: "Sturgeon",
    color: "text-green-400",
    bgColor: "from-green-900/20 to-green-950/40",
    borderColor: "border-green-500/50",
    glowColor: "rgba(74, 222, 128, 0.3)",
  } : {
    name: "STAGING",
    database: "Trout",
    color: "text-yellow-400",
    bgColor: "from-yellow-900/20 to-yellow-950/40",
    borderColor: "border-yellow-500/50",
    glowColor: "rgba(250, 204, 21, 0.3)",
  };

  // Auto-collapse on outside click for mobile
  useEffect(() => {
    if (!isMobile || !isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-env-indicator]')) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isExpanded, isMobile]);

  return (
    <>
      {/* Mobile: Compact Badge */}
      {isMobile ? (
        <>
          <button
            data-env-indicator
            onClick={() => setIsExpanded(!isExpanded)}
            className={`fixed top-2 right-2 z-[9999] flex items-center gap-1.5 px-2.5 py-1.5 backdrop-blur-md ${environment.borderColor} border-2 transition-all duration-200 active:scale-95 rounded`}
            style={{
              background: `linear-gradient(135deg, ${environment.bgColor})`,
              boxShadow: `0 0 12px ${environment.glowColor}`,
              touchAction: 'manipulation',
            }}
            aria-label="Production environment - Tap for details"
          >
            <div className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' :
              connectionStatus === 'loading' ? 'bg-yellow-400' :
              'bg-red-400'
            } animate-pulse`} />
            <div className={`text-xs font-bold ${environment.color} font-mono`}>{isProduction ? 'PROD' : 'STG'}</div>
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>

          {/* Expanded Details Panel (Mobile) */}
          {isExpanded && (
            <div
              data-env-indicator
              className={`fixed top-14 right-2 z-[9998] w-[260px] backdrop-blur-md ${environment.borderColor} border-2 rounded transition-all duration-200`}
              style={{
                background: `linear-gradient(135deg, ${environment.bgColor})`,
                boxShadow: `0 4px 20px ${environment.glowColor}`,
                maxWidth: 'calc(100vw - 16px)',
              }}
            >
              <div className="relative z-10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Mode:</div>
                  <div className={`text-sm font-bold ${environment.color} font-mono`}>{environment.name}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Database:</div>
                  <div className={`text-sm font-bold ${environment.color} font-mono`}>{environment.database}</div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Status:</div>
                  <div className="flex items-center gap-2">
                    {connectionStatus === "connected" && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs text-green-400 font-bold">ONLINE</span>
                      </>
                    )}
                    {connectionStatus === "loading" && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        <span className="text-xs text-yellow-400 font-bold">CONNECTING</span>
                      </>
                    )}
                    {connectionStatus === "error" && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-xs text-red-400 font-bold">ERROR</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="pt-1">
                  <div className="text-[10px] text-gray-500 font-mono truncate">{deploymentName}</div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Desktop: Condensed Pill with Expand */
        <div
          className="fixed top-4 right-4 z-[9999] transition-all duration-300"
          style={{ width: isExpanded ? "260px" : "auto" }}
        >
          <div
            className={`relative overflow-hidden backdrop-blur-md ${environment.borderColor} border-2 rounded transition-all duration-300`}
            style={{
              background: `linear-gradient(135deg, ${environment.bgColor})`,
              boxShadow: `0 0 20px ${environment.glowColor}`,
            }}
          >
            <div className="relative z-10 p-3">
              {!isExpanded ? (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  aria-label="Expand environment details"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-400' :
                    connectionStatus === 'loading' ? 'bg-yellow-400' :
                    'bg-red-400'
                  } animate-pulse`} />
                  <div className={`text-sm font-bold ${environment.color} font-mono`}>
                    {environment.name}
                  </div>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`text-xs uppercase tracking-wider font-bold ${environment.color}`}>ENVIRONMENT</div>
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                      aria-label="Collapse environment indicator"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Mode:</div>
                    <div className={`text-sm font-bold ${environment.color} font-mono`}>{environment.name}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Database:</div>
                    <div className={`text-sm font-bold ${environment.color} font-mono`}>{environment.database}</div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Status:</div>
                    <div className="flex items-center gap-2">
                      {connectionStatus === "connected" && (
                        <>
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-xs text-green-400 font-bold">ONLINE</span>
                        </>
                      )}
                      {connectionStatus === "loading" && (
                        <>
                          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                          <span className="text-xs text-yellow-400 font-bold">CONNECTING</span>
                        </>
                      )}
                      {connectionStatus === "error" && (
                        <>
                          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                          <span className="text-xs text-red-400 font-bold">ERROR</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="pt-1">
                    <div className="text-[10px] text-gray-500 font-mono">{deploymentName}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
