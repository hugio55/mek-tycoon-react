"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { restoreWalletSession, clearWalletSession } from "@/lib/walletSessionManager";
import { CompanyNameModal } from "@/components/CompanyNameModal";

// Session Timer Component - Shows countdown to session expiration
function SessionTimer({ expiresAt }: { expiresAt: number }) {
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

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      if (hours > 0) {
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
    <div className={`font-mono text-lg ${isExpiringSoon ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
      {timeRemaining}
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
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [showCompanyNameModal, setShowCompanyNameModal] = useState(false);
  const [companyNameModalMode, setCompanyNameModalMode] = useState<'initial' | 'edit'>('initial');

  // Get wallet address from encrypted session storage
  useEffect(() => {
    const checkWalletAddress = async () => {
      try {
        const session = await restoreWalletSession();

        if (session) {
          const address = session.stakeAddress || session.walletAddress;
          setWalletAddress(address);
          setSessionExpiresAt(session.expiresAt || null);
        } else {
          setWalletAddress(null);
          setSessionExpiresAt(null);
        }
      } catch (error) {
        console.error('[UnifiedHeader] Error restoring session:', error);
        setWalletAddress(null);
        setSessionExpiresAt(null);
      }
    };

    checkWalletAddress();
    window.addEventListener('storage', checkWalletAddress);
    const interval = setInterval(checkWalletAddress, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener('storage', checkWalletAddress);
      clearInterval(interval);
    };
  }, []);

  // Get company name for current wallet
  const companyNameData = useQuery(
    api.goldMining.getCompanyName,
    walletAddress ? { walletAddress } : "skip"
  );

  // Get gold mining data
  const goldMiningData = useQuery(
    api.goldMining.getGoldMiningData,
    walletAddress ? { walletAddress } : "skip"
  );

  // Get owned Meks count
  const ownedMeksCount = goldMiningData?.ownedMeks?.length || 0;
  const cumulativeGold = goldMiningData?.totalCumulativeGold || 0;

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
    if (window.confirm('Are you sure you want to disconnect your wallet?')) {
      await clearWalletSession();
      setWalletAddress(null);
      setSessionExpiresAt(null);
      setWalletDropdownOpen(false);
      window.location.reload();
    }
  };

  // Determine if demo mode
  const isDemoMode = !walletAddress || walletAddress === 'demo_wallet_123';

  return (
    <>
      {/* Wallet dropdown and company name in top left corner */}
      <div className="absolute top-4 md:top-6 lg:top-8 left-4 md:left-6 lg:left-8 z-20 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
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

              {/* 3. Session expiration timer */}
              {sessionExpiresAt && (
                <div className="px-4 py-4 border-b border-yellow-500/20">
                  <div className="text-gray-500 text-base sm:text-lg uppercase tracking-wider mb-1">
                    Session Expires
                  </div>
                  <SessionTimer expiresAt={sessionExpiresAt} />
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

              {/* 5. Disconnect button */}
              {walletAddress && !isDemoMode && (
                <div className="px-4 py-4">
                  <button
                    onClick={handleDisconnect}
                    className="w-full px-4 py-2 bg-red-600/20 border border-red-500/50 rounded text-red-400 hover:bg-red-600/30 transition-colors text-sm font-bold"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              )}

              {/* 6. Demo Mode Indicator (if applicable) */}
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

      {/* Logo in top right corner */}
      <div className="absolute right-4 md:right-6 lg:right-8 z-20 top-[-4px] md:top-[4px] lg:top-[12px]">
        <a
          href="https://overexposed.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/random-images/OE logo.png"
            alt="OE Logo"
            className="h-10 sm:h-16 w-auto opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
          />
        </a>
      </div>

      {/* Company Name Modal */}
      {showCompanyNameModal && walletAddress && (
        <CompanyNameModal
          isOpen={showCompanyNameModal}
          onClose={() => setShowCompanyNameModal(false)}
          walletAddress={walletAddress}
          mode={companyNameModalMode}
          currentName={companyNameData?.companyName}
        />
      )}
    </>
  );
}
