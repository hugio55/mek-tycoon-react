'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  saveWalletSession,
  restoreWalletSession,
  clearWalletSession,
  generateSessionId,
} from '@/lib/walletSessionManager';
import { ensureBech32StakeAddress } from '@/lib/cardanoAddressConverter';

interface WalletInfo {
  name: string;
  icon: string;
  version?: string;
  api?: any;
}

interface WalletConnectLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (walletAddress: string) => void;
}

export default function WalletConnectLightbox({ isOpen, onClose, onConnected }: WalletConnectLightboxProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSuccessful, setConnectionSuccessful] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Mount/unmount for portal rendering
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      detectAvailableWallets();
      // Reset success state when opening
      setConnectionSuccessful(false);
    } else {
      document.body.style.overflow = '';
      // Reset states when closing
      setIsConnecting(false);
      setConnectionSuccessful(false);
      setWalletError(null);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Detect available Cardano wallets
  const detectAvailableWallets = () => {
    if (typeof window === 'undefined' || !window.cardano) {
      setAvailableWallets([]);
      return;
    }

    const cardano = window.cardano;
    const wallets: WalletInfo[] = [];

    // List of known wallets to check for
    const knownWallets = [
      { name: 'Nami', icon: '/wallet-icons/nami.png' },
      { name: 'Eternl', icon: '/wallet-icons/eternl.png' },
      { name: 'Flint', icon: '/wallet-icons/flint.png' },
      { name: 'Yoroi', icon: '/wallet-icons/yoroi.png' },
      { name: 'Vespr', icon: '/wallet-icons/vespr.png' },
      { name: 'Typhon', icon: '/wallet-icons/typhon.png' },
      { name: 'NuFi', icon: '/wallet-icons/nufi.png' },
      { name: 'Lace', icon: '/wallet-icons/lace.png' },
    ];

    // Check each known wallet
    knownWallets.forEach(wallet => {
      const name = wallet.name.toLowerCase();
      if (cardano[name]) {
        wallets.push({
          icon: wallet.icon,
          name: wallet.name,
          version: cardano[name].apiVersion || '0.1.0',
          api: cardano[name]
        });
      }
    });

    // Also check for any other wallets
    Object.keys(cardano).forEach(name => {
      if (name !== 'isEnabled' && !wallets.find(w => w.name.toLowerCase() === name)) {
        wallets.push({
          icon: `/wallet-icons/${name}.png`,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          version: cardano[name].apiVersion || '0.1.0',
          api: cardano[name]
        });
      }
    });

    console.log('[WalletConnect] Detected wallets:', wallets.map(w => w.name));
    setAvailableWallets(wallets);
  };

  // Connect to selected wallet
  const connectWallet = async (wallet: WalletInfo) => {
    setIsConnecting(true);
    setConnectionStatus('Initializing connection...');
    setWalletError(null);

    try {
      // Enable the wallet API
      setConnectionStatus(`Connecting to ${wallet.name}...`);
      console.log('[WalletConnect] Calling wallet.api.enable()...');

      const api = await Promise.race([
        wallet.api.enable(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Wallet connection timeout after 30 seconds')), 30000)
        )
      ]) as any;

      // Get wallet addresses
      setConnectionStatus('Retrieving wallet addresses...');
      const stakeAddresses = await api.getRewardAddresses();

      if (!stakeAddresses || stakeAddresses.length === 0) {
        throw new Error('No stake addresses found in wallet');
      }

      const stakeAddressRaw = stakeAddresses[0];

      // Validate stake address format
      const isBech32 = stakeAddressRaw.startsWith('stake1');
      const isHex = /^[0-9a-fA-F]{56,60}$/.test(stakeAddressRaw);

      if (!isBech32 && !isHex) {
        console.error('Invalid stake address format:', stakeAddressRaw);
        throw new Error(`Invalid stake address format. Expected bech32 (stake1...) or hex (56-60 chars), got: ${stakeAddressRaw.substring(0, 20)}...`);
      }

      // Convert to bech32 format if it's in hex
      const stakeAddress = ensureBech32StakeAddress(stakeAddressRaw);
      console.log('[WalletConnect] Stake address:', {
        wallet: wallet.name,
        raw: stakeAddressRaw.substring(0, 20) + '...',
        converted: stakeAddress.substring(0, 20) + '...',
      });

      // Get payment addresses
      const usedAddresses = await api.getUsedAddresses();
      const paymentAddress = usedAddresses?.[0];

      if (!stakeAddress) {
        throw new Error('Could not retrieve stake address from wallet');
      }

      // Fetch NFTs from blockchain via Blockfrost
      console.log('[WalletConnect] Fetching NFTs from blockchain...');
      setConnectionStatus('Loading your Meks from blockchain...');

      let meks: any[] = [];

      try {
        // Import the initialization function
        const { initializeWithBlockfrost } = await import('@/lib/blockfrostInit');

        const initResult = await initializeWithBlockfrost({
          walletAddress: stakeAddress,
          stakeAddress,
          walletType: wallet.name.toLowerCase(),
          paymentAddresses: usedAddresses
        });

        if (initResult.success) {
          console.log(`[WalletConnect] Successfully fetched ${initResult.mekCount} Meks from blockchain`);
          meks = initResult.meks || [];
        } else {
          // Check if this is the expected stub response
          const isStubResponse = initResult.error === 'Blockfrost integration not implemented';

          if (isStubResponse) {
            console.log('[WalletConnect] NFT fetching disabled - continuing without Meks');
          } else {
            throw new Error(initResult.error || 'Failed to fetch NFTs from blockchain');
          }
        }
      } catch (blockfrostError: any) {
        // Only log actual errors, not expected stub responses
        if (blockfrostError.message !== 'Blockfrost integration not implemented') {
          console.error('[WalletConnect] Blockfrost initialization failed:', blockfrostError);
        }

        // Client-side parsing fallback removed - not available in staging
        console.log('[WalletConnect] No fallback available - continuing without Meks');
      }

      // Save session
      setConnectionStatus('Saving session...');
      await saveWalletSession({
        walletName: wallet.name,
        stakeAddress: stakeAddress,
        paymentAddress: paymentAddress,
        nonce: crypto.randomUUID(),
        sessionId: generateSessionId(),
      });

      // Store wallet type for reconnection
      if (typeof window !== 'undefined') {
        localStorage.setItem('goldMiningWallet', stakeAddress);
        localStorage.setItem('goldMiningWalletType', wallet.name.toLowerCase());
      }

      setConnectionStatus('Connection successful!');

      // Notify parent component
      if (onConnected) {
        await onConnected(stakeAddress);
      }

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('walletConnected', { detail: { address: stakeAddress } }));

      // Close lightbox FIRST, before any other state changes
      onClose();

      // Then mark as successful (for cleanup)
      setConnectionSuccessful(true);
      setIsConnecting(false);

    } catch (error: any) {
      console.error('[WalletConnect] Connection error:', error);
      setWalletError(error.message || 'Failed to connect to wallet');
      setIsConnecting(false);
      setConnectionStatus('');
    } finally {
      // Always reset connecting state
      setIsConnecting(false);
    }
  };

  // Cancel connection
  const cancelConnection = () => {
    setIsConnecting(false);
    setConnectionSuccessful(false);
    setConnectionStatus('');
  };

  // Early return if not mounted, not open, or connection successful
  if (!mounted || !isOpen || connectionSuccessful) {
    return null;
  }

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Connecting Modal */}
      {isConnecting && !connectionSuccessful && (
        <div
          className="relative max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Corner brackets */}
          <div className="hidden sm:block absolute -top-4 -left-4 w-12 h-12 border-l-2 border-t-2 border-yellow-500/50" />
          <div className="hidden sm:block absolute -top-4 -right-4 w-12 h-12 border-r-2 border-t-2 border-yellow-500/50" />
          <div className="hidden sm:block absolute -bottom-4 -left-4 w-12 h-12 border-l-2 border-b-2 border-yellow-500/50" />
          <div className="hidden sm:block absolute -bottom-4 -right-4 w-12 h-12 border-r-2 border-b-2 border-yellow-500/50" />

          <div className="bg-black/40 border-2 border-yellow-500/30 p-8 backdrop-blur-md">
            {/* Spinning loader */}
            <div className="flex justify-center mb-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-yellow-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-yellow-500 rounded-full animate-spin" />
              </div>
            </div>

            {/* Status text */}
            <h2 className="text-2xl font-black text-yellow-500 mb-4 uppercase tracking-widest text-center font-['Orbitron']">
              CONNECTING...
            </h2>

            {connectionStatus && (
              <p className="text-yellow-400/80 text-center font-mono text-sm mb-6">
                {connectionStatus}
              </p>
            )}

            {/* Cancel button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={cancelConnection}
                className="group relative bg-black/30 border border-yellow-500/30 text-yellow-500 px-6 py-2 transition-all hover:bg-yellow-500/10 hover:border-yellow-500/50 active:bg-yellow-500/20 uppercase tracking-wider font-['Orbitron'] font-bold"
              >
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-yellow-500/60" />
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-yellow-500/60" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-yellow-500/60" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-yellow-500/60" />
                <span className="relative z-10">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Wallet Selection */}
      {!isConnecting && !connectionSuccessful && (
        <div
          className="relative max-w-[600px] w-full px-2 sm:px-4 md:px-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Corner brackets */}
          <div className="hidden sm:block absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2 border-yellow-500/50" />
          <div className="hidden sm:block absolute -top-2 -right-2 w-8 h-8 border-r-2 border-t-2 border-yellow-500/50" />
          <div className="hidden sm:block absolute -bottom-2 -left-2 w-8 h-8 border-l-2 border-b-2 border-yellow-500/50" />
          <div className="hidden sm:block absolute -bottom-2 -right-2 w-8 h-8 border-r-2 border-b-2 border-yellow-500/50" />

          <div className="bg-black/20 border border-yellow-500/20 p-6 sm:p-8 md:p-12 backdrop-blur-md relative overflow-hidden">
            {/* Scan line effect */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `linear-gradient(0deg, transparent 50%, rgba(250, 182, 23, 0.03) 50%)`,
                backgroundSize: '100% 4px',
                animation: 'scanlines 8s linear infinite'
              }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors border border-yellow-500/30 hover:border-yellow-500/60 z-10"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title with glow */}
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-black text-yellow-500 mb-2 uppercase tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] text-center font-['Orbitron']"
              style={{
                textShadow: '0 0 20px rgba(250, 182, 23, 0.5), 0 0 40px rgba(250, 182, 23, 0.3)'
              }}
            >
              CONNECT WALLET
            </h1>

            {/* System status */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-gray-500 uppercase tracking-widest font-mono whitespace-nowrap" style={{
                fontSize: 'clamp(0.5rem, 2.5vw, 0.875rem)'
              }}>
                System Online • Awaiting Authorization
              </p>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent mb-8" />

            {/* Error message */}
            {walletError && (
              <div className="mb-6 p-4 border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-mono">
                {walletError}
              </div>
            )}

            {/* Wallet buttons or no wallets message */}
            {availableWallets.length > 0 ? (
              <>
                <p className="text-gray-400 mb-8 text-center font-mono text-sm">
                  Connect your Cardano wallet to access Mek Tycoon
                </p>
                <div className={availableWallets.length === 1 ? "flex justify-center" : "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"}>
                  {availableWallets.map(wallet => (
                    <button
                      key={wallet.name}
                      onClick={() => connectWallet(wallet)}
                      disabled={isConnecting}
                      className={`group relative bg-black/30 border border-yellow-500/20 text-yellow-500 px-4 py-3 sm:px-6 sm:py-4 transition-all hover:bg-yellow-500/5 hover:border-yellow-500/40 active:bg-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider sm:tracking-widest font-['Orbitron'] font-bold backdrop-blur-sm overflow-hidden min-h-[48px] touch-manipulation ${availableWallets.length === 1 ? 'w-64' : ''}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-yellow-500/40" />
                      <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-yellow-500/40" />
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-yellow-500/40" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-yellow-500/40" />
                      <span className="relative z-10">{wallet.name}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="relative text-center bg-black/30 p-4 sm:p-8 backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-yellow-500/20" />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-yellow-500/20" />
                </div>
                <div className="relative mx-auto w-28 h-28 mb-6 flex items-center justify-center">
                  {/* Crosshair */}
                  <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
                  <div className="absolute h-full w-0.5 bg-gradient-to-b from-transparent via-yellow-500/40 to-transparent" />
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-yellow-500/60" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-yellow-500/60" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-yellow-500/60" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-yellow-500/60" />
                  {/* Rotating outer ring */}
                  <div className="absolute inset-0 border-2 border-yellow-500/20 rounded-full animate-spin" style={{ animationDuration: '8s' }}>
                    <div className="absolute top-0 left-1/2 w-1 h-1 -ml-0.5 -mt-0.5 bg-yellow-500 rounded-full" />
                    <div className="absolute right-0 top-1/2 w-1 h-1 -mr-0.5 -mt-0.5 bg-yellow-500 rounded-full" />
                  </div>
                  {/* Center indicator */}
                  <div className="relative w-12 h-12 border-2 border-yellow-500/50 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 bg-yellow-500/20 rounded-full animate-pulse" style={{ boxShadow: '0 0 20px rgba(250, 182, 23, 0.4)' }}>
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative space-y-3">
                  <p className="text-yellow-500 font-['Orbitron'] uppercase tracking-wider text-sm font-bold">Wallet Connection Required</p>
                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
                  <div className="px-1 sm:px-4 space-y-2">
                    <p className="text-gray-400 font-mono leading-relaxed" style={{ fontSize: 'clamp(0.65rem, 2vw, 0.875rem)' }}>
                      Please install your Mek-holding Cardano wallet on this device then refresh this page.
                    </p>
                    <p className="text-gray-500 text-xs italic font-sans">They will appear here.</p>
                  </div>
                  <div className="pt-3">
                    <div className="inline-flex flex-wrap items-center justify-center gap-1 bg-black/40 border border-yellow-500/20 px-3 py-2">
                      <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">Nami • Eternl • Flint • Yoroi • Typhon • Gero • NuFi</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
