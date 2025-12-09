"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { restoreWalletSession, clearWalletSession, extendSessionOnActivity, rememberDevice, isDeviceRemembered } from "@/lib/walletSessionManager";
import { CompanyNameModal } from "@/components/CompanyNameModal";
import WalletConnectLightbox from "@/components/WalletConnectLightbox";
import { getMediaUrl } from "@/lib/media-url";
import { NotificationBell } from "@/components/notifications";
import MessagingSystem from "@/components/MessagingSystem";

// Session Timer Component - Shows countdown to session expiration with "Remember this device" option
function SessionTimer({
  expiresAt,
  onRememberDevice,
  deviceRemembered
}: {
  expiresAt: number;
  onRememberDevice?: () => void;
  deviceRemembered?: boolean;
}) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        setTimeRemaining('Expired');
        setIsExpiringSoon(true);
        return;
      }

      // Check if expiring soon (less than 5 minutes)
      setIsExpiringSoon(remaining < 5 * 60 * 1000);

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="space-y-2">
      <div className={`font-mono text-lg ${isExpiringSoon ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
        {timeRemaining}
      </div>
      {/* Remember this device button */}
      {onRememberDevice && !deviceRemembered && (
        <button
          onClick={onRememberDevice}
          className="w-full px-3 py-1.5 text-xs bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 hover:border-yellow-500/50 text-yellow-400 rounded transition-all duration-200"
        >
          Remember this device
        </button>
      )}
      {deviceRemembered && (
        <div className="text-xs text-green-400/70 flex items-center gap-1">
          <span>✓</span> Device remembered
        </div>
      )}
    </div>
  );
}

/**
 * Unified Header Component
 *
 * This is the single source of truth for the site header.
 * Features:
 * - Top-left: Mek count dropdown showing company name, gold, wallet info
 * - Top-right: Company logo (OE logo)
 * - Responsive design with mobile optimizations
 *
 * Used on all pages except:
 * - /talent-builder (no header)
 * - / (welcome page - uses this same header inline)
 */
export default function UnifiedHeader() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [deviceRemembered, setDeviceRemembered] = useState(false);
  const [showCompanyNameModal, setShowCompanyNameModal] = useState(false);
  const [companyNameModalMode, setCompanyNameModalMode] = useState<'initial' | 'edit'>('initial');
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [showNameRequiredWarning, setShowNameRequiredWarning] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);

  // Handle "Remember this device" button click
  const handleRememberDevice = async () => {
    const newExpiry = await rememberDevice();
    if (newExpiry) {
      setSessionExpiresAt(newExpiry);
      setDeviceRemembered(true);
    }
  };

  // Get wallet address from encrypted session storage and extend session on activity
  useEffect(() => {
    // Check device remembered status on mount
    setDeviceRemembered(isDeviceRemembered());

    // Silent init - logging disabled to reduce console noise
    // Enable DEBUG_WALLET in console for debugging: window.DEBUG_WALLET = true
    let lastAddress: string | null = null;
    let lastExpires: number | null = null;
    let hasExtendedSession = false;

    const checkWalletAddress = async () => {
      try {
        const session = await restoreWalletSession();

        if (session) {
          const address = session.stakeAddress || session.walletAddress;
          const expiresAt = session.expiresAt || null;

          // Extend session on first check (page load) - only once per page load
          if (!hasExtendedSession) {
            hasExtendedSession = true;
            const extended = await extendSessionOnActivity();
            if (extended) {
              // Session was extended - re-read to get new expiry
              const updatedSession = await restoreWalletSession();
              if (updatedSession) {
                const updatedAddress = updatedSession.stakeAddress || updatedSession.walletAddress;
                setWalletAddress(updatedAddress);
                setSessionExpiresAt(updatedSession.expiresAt);
                return; // Exit early, we've updated everything
              }
            }
          }

          // Only update state if values actually changed
          // This prevents unnecessary re-renders and query re-executions
          setWalletAddress(prevAddress => {
            if (prevAddress !== address) {
              lastAddress = address;
              return address;
            }
            return prevAddress;
          });
          setSessionExpiresAt(prevExpires => {
            if (prevExpires !== expiresAt) {
              lastExpires = expiresAt;
              return expiresAt;
            }
            return prevExpires;
          });
        } else {
          // Only clear if not already cleared
          setWalletAddress(prev => prev !== null ? null : prev);
          setSessionExpiresAt(prev => prev !== null ? null : prev);
        }
      } catch (error) {
        console.error('[UnifiedHeader] Error restoring session:', error);
        setWalletAddress(prev => prev !== null ? null : prev);
        setSessionExpiresAt(prev => prev !== null ? null : prev);
      }
    };

    // Initial check and polling
    checkWalletAddress();
    const handleStorageChange = () => checkWalletAddress();
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(checkWalletAddress, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Listen for wallet connect event
  useEffect(() => {
    const handleOpenWalletConnect = () => {
      setShowWalletConnect(true);
    };

    window.addEventListener('openWalletConnect', handleOpenWalletConnect);
    return () => window.removeEventListener('openWalletConnect', handleOpenWalletConnect);
  }, []);

  // Listen for new corporation created event - ensures modal shows on the connecting tab
  // Skip on admin page to allow admin access without corporation name
  useEffect(() => {
    const handleNewCorporation = (event: CustomEvent) => {
      if (isAdminPage) return; // Don't show modal on admin page
      console.log('[UnifiedHeader] newCorporationCreated event received:', event.detail);
      // Immediately show the name modal when a new corporation is created
      setCompanyNameModalMode('initial');
      setShowCompanyNameModal(true);
    };

    window.addEventListener('newCorporationCreated', handleNewCorporation as EventListener);
    return () => window.removeEventListener('newCorporationCreated', handleNewCorporation as EventListener);
  }, [isAdminPage]);

  // Get company name for current wallet (Phase II: use corporationAuth)
  const companyNameData = useQuery(
    api.corporationAuth.getCompanyName,
    walletAddress ? { walletAddress } : "skip"
  );

  // Phase II: Get user data (replaces goldMining)
  const userData = useQuery(
    api.userData.getUserData,
    walletAddress ? { walletAddress } : "skip"
  );

  // Get user ID for notifications
  const userId = useQuery(
    api.notifications.getUserIdByWallet,
    walletAddress ? { walletAddress } : "skip"
  );

  // Get owned Meks count (Phase II: from userData)
  const ownedMeksCount = userData?.mekCount || 0;
  const cumulativeGold = userData?.gold || 0;

  // PHASE II: Mandatory corporation name enforcement
  // If logged in but no corporation name, go directly to the CompanyNameModal
  // Skip the intermediate "Corporation Name Required" modal
  // Exception: Admin page is exempt from this requirement
  useEffect(() => {
    // Skip enforcement on admin page - allows admin access without corporation
    if (isAdminPage) return;

    // Only check when we have a wallet address AND the query has completed
    if (walletAddress && companyNameData !== undefined && !companyNameData?.hasCompanyName) {
      console.log('[UnifiedHeader] ENFORCEMENT: Wallet connected but no corporation name - opening CompanyNameModal directly');
      setCompanyNameModalMode('initial');
      setShowCompanyNameModal(true);
    }
  }, [walletAddress, companyNameData, isAdminPage]);

  // Click outside handler for wallet dropdown
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.wallet-dropdown')) {
        setWalletDropdownOpen(false);
      }
    };

    if (walletDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [walletDropdownOpen]);

  // Handle disconnect
  const handleDisconnect = async () => {
    console.log('[🔓DISCONNECT] Disconnect button clicked');

    const confirmed = window.confirm(
      'Disconnect wallet?\n\n' +
      'This will log you out and you\'ll need to reconnect your wallet to access Mek Tycoon again.'
    );

    if (confirmed) {
      console.log('[🔓DISCONNECT] User confirmed disconnect');
      console.log('[🔓DISCONNECT] Calling clearWalletSession()...');

      // Clear session storage and invalidate session
      await clearWalletSession();

      console.log('[🔓DISCONNECT] Session cleared, checking localStorage for nonce...');
      const nonceCheck = localStorage.getItem('mek_disconnect_nonce');
      console.log('[🔓DISCONNECT] Nonce after clearWalletSession:', nonceCheck ? (nonceCheck.slice(0, 8) + '...') : 'NOT FOUND');

      setWalletAddress(null);
      setSessionExpiresAt(null);
      setWalletDropdownOpen(false);

      console.log('[🔓DISCONNECT] Reloading page...');
      // Reload to reset all state
      window.location.reload();
    }
  };

  // Determine if demo mode (no wallet connected)
  const isDemoMode = !walletAddress;

  return (
    <>
      {/* Wallet dropdown and company name in top left corner */}
      {/* Using fixed positioning to stay relative to viewport, independent of page content */}
      <div className="fixed top-4 md:top-6 lg:top-8 left-4 md:left-6 lg:left-8 z-[100] flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <div className="relative wallet-dropdown">
          <button
            onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
            className="flex items-center gap-2 bg-black/60 border border-yellow-500/30 px-3 sm:px-4 py-2.5 sm:py-2 backdrop-blur-sm hover:bg-black/70 hover:border-yellow-500/50 transition-all min-h-[44px] sm:min-h-0 touch-manipulation"
          >
            <span className="text-yellow-400 font-bold text-base sm:text-lg font-sans uppercase">
              {ownedMeksCount} MEKS
            </span>
            <span className="text-yellow-400 text-sm">▼</span>
          </button>

          {walletDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 sm:w-72 bg-black/95 sm:bg-black/90 border border-yellow-500/30 backdrop-blur-sm rounded-sm shadow-lg max-h-[80vh] overflow-y-auto scale-75 origin-top-left" style={{ willChange: 'opacity, transform' }}>
              {/* 1. Company name */}
              <div className="px-4 py-4 border-b border-yellow-500/20 touch-manipulation">
                {companyNameData?.companyName ? (
                  <div
                    className="text-yellow-400 font-bold text-xl sm:text-xl cursor-pointer hover:text-yellow-300 transition-colors min-h-[44px] flex items-center touch-manipulation"
                    onClick={() => {
                      setCompanyNameModalMode('edit');
                      setShowCompanyNameModal(true);
                      setWalletDropdownOpen(false);
                    }}
                    title="Click to edit company name"
                  >
                    {companyNameData.companyName}
                    <span className="ml-1 text-base opacity-60">✏️</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setCompanyNameModalMode('initial');
                      setShowCompanyNameModal(true);
                      setWalletDropdownOpen(false);
                    }}
                    className="text-yellow-400/60 text-xl sm:text-xl italic hover:text-yellow-400 transition-colors min-h-[44px] touch-manipulation"
                  >
                    + Set company name
                  </button>
                )}
              </div>

              {/* 2. Total Cumulative Gold */}
              <div className="px-4 py-4 border-b border-yellow-500/20">
                <div className="text-gray-400 text-base sm:text-base uppercase tracking-wider mb-1">Total Cumulative Gold</div>
                <div className="text-yellow-400 font-bold text-2xl sm:text-2xl font-mono">
                  {cumulativeGold.toLocaleString()}
                </div>
              </div>

              {/* 3. Session expiration timer with "Remember this device" option */}
              {sessionExpiresAt && (
                <div className="px-4 py-4 border-b border-yellow-500/20">
                  <div className="text-gray-500 text-base sm:text-lg uppercase tracking-wider mb-1">
                    Session Expires
                  </div>
                  <SessionTimer
                    expiresAt={sessionExpiresAt}
                    onRememberDevice={handleRememberDevice}
                    deviceRemembered={deviceRemembered}
                  />
                </div>
              )}

              {/* 4. Wallet Address (if connected) */}
              {walletAddress && !isDemoMode && (
                <div className="px-4 py-4 border-b border-yellow-500/20">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Wallet Address</div>
                  <div className="text-yellow-400/80 text-xs font-mono break-all">
                    {walletAddress}
                  </div>
                </div>
              )}

              {/* 5. Connect Wallet button (if not connected) */}
              {!walletAddress && (
                <div className="px-4 py-4 border-b border-yellow-500/20">
                  <button
                    onClick={() => {
                      setWalletDropdownOpen(false);
                      window.dispatchEvent(new Event('openWalletConnect'));
                    }}
                    className="w-full px-4 py-3 bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 border-2 border-yellow-500 rounded transition-colors font-['Orbitron'] uppercase tracking-wider text-sm font-bold min-h-[48px] touch-manipulation"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}

              {/* 6. Disconnect button */}
              {walletAddress && !isDemoMode && (
                <div className="px-4 py-4">
                  <button
                    onClick={handleDisconnect}
                    className="w-full px-4 py-2 bg-red-600/20 border border-red-500/50 rounded text-red-400 hover:bg-red-600/30 transition-colors text-sm font-bold min-h-[48px] touch-manipulation"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              )}

              {/* 7. Demo Mode Indicator (if applicable) */}
              {isDemoMode && (
                <div className="px-4 py-4">
                  <div className="text-gray-500 text-sm italic">
                    Demo Mode - Connect wallet for full features
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Corporation name display - hidden on mobile (already in dropdown) */}
        {companyNameData?.companyName && (
          <div
            className="hidden sm:flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity touch-manipulation"
            onClick={() => {
              setCompanyNameModalMode('edit');
              setShowCompanyNameModal(true);
            }}
            title="Click to edit corporation name"
          >
            <div className="flex flex-col">
              <span className="text-yellow-400 text-xs uppercase tracking-wider font-['Orbitron']">
                Corporation:
              </span>
              <span className="text-white text-base sm:text-lg font-['Orbitron'] font-bold tracking-wide">
                {companyNameData.companyName}
              </span>
            </div>
            <svg className="w-4 h-4 text-gray-400 hover:text-yellow-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        )}
      </div>

      {/* Top right corner: Notification Bell + Messages + OE Logo */}
      {/* Using fixed positioning to stay relative to viewport, independent of page content */}
      <div className="fixed right-4 md:right-6 lg:right-8 z-[100] top-[8px] md:top-[12px] lg:top-[16px] flex items-center gap-3">
        {/* Notification Bell - only show if user is logged in */}
        {userId && (
          <NotificationBell userId={userId} />
        )}

        {/* Messages/Comms Icon - only show if user is logged in */}
        {userId && (
          <button
            onClick={() => setShowMessaging(true)}
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-black/60 border border-yellow-500/30 hover:bg-black/70 hover:border-yellow-500/50 transition-all cursor-pointer"
            title="Messages"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        )}

        {/* OE Logo */}
        <a
          href="https://overexposed.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={getMediaUrl('/random-images/OE logo.png')}
            alt="OE Logo"
            className="h-10 sm:h-14 w-auto opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
          />
        </a>
      </div>

      {/* Company Name Modal - Not enforced on admin page */}
      {showCompanyNameModal && walletAddress && !isAdminPage && (
        <CompanyNameModal
          isOpen={showCompanyNameModal}
          onClose={() => setShowCompanyNameModal(false)}
          walletAddress={walletAddress}
          mode={companyNameModalMode}
          onCancel={() => {
            setShowCompanyNameModal(false);
            setShowNameRequiredWarning(true);
          }}
        />
      )}

      {/* Name Required Warning Modal - Not shown on admin page */}
      {showNameRequiredWarning && !isAdminPage && createPortal(
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80"
            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          />

          {/* Modal content */}
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-yellow-500/30"
            style={{
              background: 'rgba(20, 15, 10, 0.95)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(250, 182, 23, 0.1)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500/60" />

            <div className="px-6 pt-8 pb-6">
              {/* Warning icon */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-4">
                  <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-light text-white tracking-wide mb-2">
                  Corporation Name Required
                </h3>
                <p className="text-white/60 text-sm font-light leading-relaxed">
                  You must set a name for your corporation or disconnect your wallet to continue.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowNameRequiredWarning(false);
                    setCompanyNameModalMode('initial');
                    setShowCompanyNameModal(true);
                  }}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #fab617 0%, #d4a00f 100%)',
                    color: '#000',
                    boxShadow: '0 0 20px rgba(250, 182, 23, 0.3)',
                  }}
                >
                  Set Corporation Name
                </button>
                <button
                  onClick={async () => {
                    setShowNameRequiredWarning(false);
                    await clearWalletSession();
                    setWalletAddress(null);
                    setSessionExpiresAt(null);
                    window.location.reload();
                  }}
                  className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-red-500/20 active:scale-[0.98]"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'rgba(239, 68, 68, 0.9)',
                  }}
                >
                  Disconnect Wallet
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Wallet Connect Lightbox */}
      <WalletConnectLightbox
        isOpen={showWalletConnect}
        onClose={() => {
          setShowWalletConnect(false);
        }}
        onConnected={async (address, isNewCorporation) => {
          setWalletAddress(address);
          setShowWalletConnect(false);
          // Refresh session data
          const session = await restoreWalletSession();
          if (session) {
            setSessionExpiresAt(session.expiresAt || null);
          }
          // Auto-open company name modal for new corporations
          if (isNewCorporation) {
            console.log('[UnifiedHeader] New corporation detected - opening name modal');
            setCompanyNameModalMode('initial');
            setShowCompanyNameModal(true);
          }
        }}
      />

      {/* Messaging Lightbox */}
      {showMessaging && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowMessaging(false)}
        >
          {/* Backdrop - Click capture only, no darkening or blur */}
          <div className="fixed inset-0" />

          {/* Translucent Container - Liquid Glass Style */}
          <div
            className="relative w-full max-w-5xl h-[85vh] backdrop-blur-2xl rounded-xl border border-gray-600/50 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 bg-black/30">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-yellow-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  COMMUNICATIONS
                </h2>
              </div>
              {/* Animated X Close Button */}
              <button
                onClick={() => setShowMessaging(false)}
                className="group relative flex items-center gap-2 p-2 transition-all duration-300"
              >
                {/* X icon container */}
                <div className="relative w-8 h-8 flex items-center justify-center">
                  {/* First bar - rotates from 45deg to -45deg on hover */}
                  <span
                    className="absolute w-[3px] h-[24px] rounded-full bg-white/70 rotate-45 transition-all duration-300 ease-in group-hover:rotate-[-45deg] group-hover:bg-cyan-400 group-hover:shadow-[0_0_10px_#22d3ee]"
                  />
                  {/* Second bar - rotates from -45deg to 45deg on hover */}
                  <span
                    className="absolute w-[3px] h-[24px] rounded-full bg-white/70 -rotate-45 transition-all duration-300 ease-in group-hover:rotate-[45deg] group-hover:bg-cyan-400 group-hover:shadow-[0_0_10px_#22d3ee]"
                  />
                </div>
              </button>
            </div>

            {/* Content Area - Messaging System */}
            <div className="h-[calc(100%-64px)] overflow-hidden bg-transparent">
              {walletAddress && (
                <MessagingSystem
                  walletAddress={walletAddress}
                  companyName={companyNameData?.companyName}
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </>
  );
}
