"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type Environment = {
  name: string;
  database: string;
  port: number;
  color: string; // Tailwind color class
  bgColor: string; // Background gradient
  borderColor: string;
  glowColor: string;
  warning: boolean;
};

// Both production and staging use the same database (Trout)
// Environment is determined by port number
const PORT_ENVIRONMENTS: Record<number, Omit<Environment, 'port'>> = {
  3100: {
    name: "PRODUCTION",
    database: "Trout DB",
    color: "text-red-400",
    bgColor: "from-red-900/20 to-red-950/40",
    borderColor: "border-red-500/50",
    glowColor: "rgba(248, 113, 113, 0.3)",
    warning: true,
  },
  3200: {
    name: "STAGING",
    database: "Trout DB",
    color: "text-green-400",
    bgColor: "from-green-900/20 to-green-950/40",
    borderColor: "border-green-500/50",
    glowColor: "rgba(74, 222, 128, 0.3)",
    warning: false,
  },
};

const ENVIRONMENTS: Record<string, Environment> = {
  "wry-trout-962": {
    name: "TROUT DB",
    database: "Shared Database",
    port: 0,
    color: "text-blue-400",
    bgColor: "from-blue-900/20 to-blue-950/40",
    borderColor: "border-blue-500/50",
    glowColor: "rgba(59, 130, 246, 0.3)",
    warning: false,
  },
};

export default function EnvironmentIndicator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [detectedPort, setDetectedPort] = useState<number | null>(null);
  const [convexUrl, setConvexUrl] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "error" | "loading">("loading");
  const [isMobile, setIsMobile] = useState(false);

  // Try to query something simple to verify connection
  const testQuery = useQuery(api.users.getUserGold);

  useEffect(() => {
    // Get Convex URL from environment
    const url = process.env.NEXT_PUBLIC_CONVEX_URL || "";
    setConvexUrl(url);

    // Detect port from window.location
    if (typeof window !== "undefined") {
      setDetectedPort(parseInt(window.location.port) || 80);

      // Detect mobile viewport
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
      setConnectionStatus("error");
    } else {
      setConnectionStatus("connected");
    }
  }, [testQuery]);

  // Extract deployment name from Convex URL
  const deploymentName = convexUrl.split("//")[1]?.split(".")[0] || "unknown";

  // Debug logging
  useEffect(() => {
    console.log("🔍 EnvironmentIndicator Detection:", {
      convexUrl,
      deploymentName,
      detectedPort,
      foundInConfig: !!ENVIRONMENTS[deploymentName]
    });
  }, [convexUrl, deploymentName, detectedPort]);

  // Determine environment based on port (both use same DB)
  const portEnv = detectedPort && PORT_ENVIRONMENTS[detectedPort];
  const environment: Environment = portEnv
    ? { ...portEnv, port: detectedPort }
    : {
        name: "UNKNOWN",
        database: "Unknown DB",
        port: detectedPort || 3000,
        color: "text-yellow-400",
        bgColor: "from-yellow-900/20 to-yellow-950/40",
        borderColor: "border-yellow-500/50",
        glowColor: "rgba(250, 182, 23, 0.3)",
        warning: true,
      };

  // Mobile: Compact badge always visible, tap to expand full details
  // Desktop: Condensed pill, tap to expand
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
      {/* Mobile: Compact Badge (Always Visible) */}
      {isMobile ? (
        <>
          {/* Compact Badge */}
          <button
            data-env-indicator
            onClick={() => setIsExpanded(!isExpanded)}
            className={`fixed top-2 right-2 z-[9999] flex items-center gap-1.5 px-2.5 py-1.5 backdrop-blur-md ${environment.borderColor} border-2 transition-all duration-200 active:scale-95`}
            style={{
              background: `linear-gradient(135deg, ${environment.bgColor})`,
              boxShadow: `0 0 12px ${environment.glowColor}`,
              touchAction: 'manipulation',
            }}
            aria-label={`${environment.name} environment - Tap for details`}
          >
            {/* Status Dot */}
            <div className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' :
              connectionStatus === 'loading' ? 'bg-yellow-400' :
              'bg-red-400'
            } animate-pulse`} />

            {/* Environment Initial */}
            <div className={`text-xs font-bold ${environment.color} font-mono`}>
              {environment.name[0]}
            </div>

            {/* Port */}
            <div className="text-[10px] text-gray-400 font-mono">
              :{detectedPort || environment.port}
            </div>

            {/* Warning icon for production */}
            {environment.warning && (
              <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}

            {/* Expand icon */}
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>

          {/* Expanded Details Panel (Mobile) */}
          {isExpanded && (
            <div
              data-env-indicator
              className={`fixed top-14 right-2 z-[9998] w-[280px] backdrop-blur-md ${environment.borderColor} border-2 transition-all duration-200`}
              style={{
                background: `linear-gradient(135deg, ${environment.bgColor})`,
                boxShadow: `0 4px 20px ${environment.glowColor}, inset 0 0 20px ${environment.glowColor}`,
                maxWidth: 'calc(100vw - 16px)',
              }}
            >
              {/* Hazard Stripes */}
              {environment.warning && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    background: `repeating-linear-gradient(45deg, transparent, transparent 8px, ${environment.glowColor} 8px, ${environment.glowColor} 16px)`,
                  }}
                />
              )}

              {/* Content */}
              <div className="relative z-10 p-3 space-y-2">
                {/* Environment Name */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Mode:</div>
                  <div className={`text-sm font-bold ${environment.color} font-mono`}>
                    {environment.name}
                  </div>
                </div>

                {/* Database */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Database:</div>
                  <div className={`text-sm font-bold ${environment.color} font-mono`}>
                    {environment.database}
                  </div>
                </div>

                {/* Port */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Port:</div>
                  <div className={`text-sm font-bold ${environment.color} font-mono`}>
                    {detectedPort || environment.port}
                  </div>
                </div>

                {/* Connection Status */}
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

                {/* Warning Banner */}
                {environment.warning && (
                  <div className="mt-2 pt-2 border-t border-red-500/30">
                    <div className="text-xs text-red-400 font-bold uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      LIVE DATABASE
                    </div>
                  </div>
                )}

                {/* Deployment ID */}
                <div className="pt-1">
                  <div className="text-[10px] text-gray-500 font-mono truncate">
                    {deploymentName}
                  </div>
                </div>
              </div>

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2" style={{ borderColor: environment.glowColor }} />
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2" style={{ borderColor: environment.glowColor }} />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2" style={{ borderColor: environment.glowColor }} />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2" style={{ borderColor: environment.glowColor }} />
            </div>
          )}
        </>
      ) : (
        /* Desktop: Condensed Pill with Expand */
        <div
          className="fixed top-4 right-4 z-[9999] transition-all duration-300"
          style={{ width: isExpanded ? "280px" : "auto" }}
        >
          <div
            className={`relative overflow-hidden backdrop-blur-md ${environment.borderColor} border-2 transition-all duration-300`}
            style={{
              background: `linear-gradient(135deg, ${environment.bgColor})`,
              boxShadow: `0 0 20px ${environment.glowColor}, inset 0 0 20px ${environment.glowColor}`,
            }}
          >
            {/* Hazard Stripes */}
            {environment.warning && isExpanded && (
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  background: `repeating-linear-gradient(45deg, transparent, transparent 8px, ${environment.glowColor} 8px, ${environment.glowColor} 16px)`,
                }}
              />
            )}

            {/* Scan Line Animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div
                className="absolute left-0 right-0 h-[2px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${environment.glowColor}, transparent)`,
                  animation: "scan-line 3s linear infinite",
                }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10 p-3">
              {!isExpanded ? (
                /* Condensed View */
                <button
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  aria-label="Expand environment details"
                >
                  {/* Status Dot */}
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-400' :
                    connectionStatus === 'loading' ? 'bg-yellow-400' :
                    'bg-red-400'
                  } animate-pulse`} />

                  {/* Environment Name */}
                  <div className={`text-sm font-bold ${environment.color} font-mono`}>
                    {environment.name}
                  </div>

                  {/* Warning icon */}
                  {environment.warning && (
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ) : (
                /* Expanded View */
                <div className="space-y-2">
                  {/* Header with Collapse Button */}
                  <div className="flex items-center justify-between">
                    <div className={`text-xs uppercase tracking-wider font-bold ${environment.color}`}>
                      ENVIRONMENT
                    </div>
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

                  {/* Environment Name */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Mode:</div>
                    <div className={`text-sm font-bold ${environment.color} font-mono`}>
                      {environment.name}
                    </div>
                  </div>

                  {/* Database */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Database:</div>
                    <div className={`text-sm font-bold ${environment.color} font-mono`}>
                      {environment.database}
                    </div>
                  </div>

                  {/* Port */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Port:</div>
                    <div className={`text-sm font-bold ${environment.color} font-mono`}>
                      {detectedPort || environment.port}
                    </div>
                  </div>

                  {/* Connection Status */}
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

                  {/* Warning Banner */}
                  {environment.warning && (
                    <div className="mt-2 pt-2 border-t border-red-500/30">
                      <div className="text-xs text-red-400 font-bold uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        LIVE DATABASE
                      </div>
                    </div>
                  )}

                  {/* Deployment ID */}
                  <div className="pt-1">
                    <div className="text-[10px] text-gray-500 font-mono">
                      {deploymentName}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2" style={{ borderColor: environment.glowColor }} />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2" style={{ borderColor: environment.glowColor }} />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2" style={{ borderColor: environment.glowColor }} />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2" style={{ borderColor: environment.glowColor }} />
          </div>
        </div>
      )}
    </>
  );
}
