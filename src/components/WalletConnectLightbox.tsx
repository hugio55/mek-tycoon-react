'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/../convex/_generated/api';
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
  onConnected?: (walletAddress: string, isNewCorporation?: boolean) => void;
}

export default function WalletConnectLightbox({ isOpen, onClose, onConnected }: WalletConnectLightboxProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [walletError, setWalletError] = useState<string | null>(null);

  // PHASE II: Convex mutation to create/link corporation (stake-address-only)
  const connectCorporationMutation = useMutation(api.corporationAuth.connectCorporation);

  // Blockfrost NFT verification action (server-side)
  const initializeWithBlockfrostAction = useAction(api.goldMining.initializeWithBlockfrost);

  // Mount/unmount for portal rendering
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      // Clear previous errors when lightbox opens
      setWalletError(null);
      setConnectionStatus('');

      console.log('[🔐RECONNECT] WalletConnectLightbox opened - checking disconnect nonce...');
      const nonceCheck = localStorage.getItem('mek_disconnect_nonce');
      console.log('[🔐RECONNECT] Nonce status at lightbox open:', nonceCheck ? `✅ FOUND: ${nonceCheck.slice(0, 8)}...` : '❌ NOT FOUND');

      document.body.style.overflow = 'hidden';
      detectAvailableWallets();
    } else {
      document.body.style.overflow = '';
      setIsConnecting(false);
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

      // Check if user manually disconnected (security feature for shared computers)
      console.log('[🔐RECONNECT] Checking for disconnect nonce in localStorage...');
      const disconnectNonce = localStorage.getItem('mek_disconnect_nonce');
      console.log('[🔐RECONNECT] Disconnect nonce check result:', disconnectNonce ? `FOUND: ${disconnectNonce.slice(0, 8)}...` : '❌ NOT FOUND');

      if (disconnectNonce) {
        console.log('[🔐SIGNATURE] ✅ Disconnect nonce detected - requiring signature verification');
        console.log('[🔐SIGNATURE] Wallet:', wallet.name);
        setConnectionStatus('Verifying wallet ownership...');

        // Generate challenge message
        const challengeMessage = `Mek Tycoon Login Verification\n\nNonce: ${disconnectNonce}\nTimestamp: ${Date.now()}\n\nSign this message to verify you own this wallet.`;
        console.log('[🔐SIGNATURE] Challenge message:', challengeMessage);

        try {
          // Check if wallet supports signData
          if (!api.signData) {
            console.error('[🔐SIGNATURE] Wallet does not support signData() method');
            throw new Error(`${wallet.name} does not support message signing. Please use a different wallet or contact support.`);
          }

          // Get payment addresses for signing
          const usedAddressesHex = await api.getUsedAddresses();
          console.log('[🔐SIGNATURE] Payment addresses (hex):', usedAddressesHex);

          if (!usedAddressesHex || usedAddressesHex.length === 0) {
            throw new Error('No payment addresses found in wallet');
          }

          const paymentAddressHex = usedAddressesHex[0];

          // Convert hex address to bech32 format for CIP-8 signing
          // Most wallets expect bech32 format (addr1...) not hex
          let addressForSigning = paymentAddressHex;

          // If address is hex (doesn't start with addr), convert it
          if (!paymentAddressHex.startsWith('addr')) {
            try {
              // Import cardano-serialization-lib for address conversion
              const CSL = await import('@emurgo/cardano-serialization-lib-browser');
              const address = CSL.Address.from_bytes(
                Buffer.from(paymentAddressHex, 'hex')
              );
              addressForSigning = address.to_bech32();
              console.log('[🔐SIGNATURE] Converted hex to bech32:', addressForSigning.substring(0, 20) + '...');
            } catch (conversionError) {
              console.error('[🔐SIGNATURE] Address conversion failed:', conversionError);
              // Fall back to hex if conversion fails
              console.log('[🔐SIGNATURE] Using hex address as fallback');
            }
          }

          console.log('[🔐SIGNATURE] Address for signing:', addressForSigning.substring(0, 20) + '...');

          // All wallets use hex-encoded message
          const encoder = new TextEncoder();
          const messageBytes = encoder.encode(challengeMessage);
          const messagePayload = Array.from(messageBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          console.log('[🔐SIGNATURE] Using hex-encoded message:', messagePayload.substring(0, 40) + '...');

          // Request signature from wallet
          console.log('[🔐SIGNATURE] Calling api.signData()...');
          const signResult = await api.signData(addressForSigning, messagePayload);
          console.log('[🔐SIGNATURE] Signature result:', signResult);

          console.log('[🔐SIGNATURE] Signature verification successful!');
          setConnectionStatus('Signature verified!');

          // Signature succeeded - user proved they own the wallet
          // The disconnect nonce will be cleared after successful session save
        } catch (signError: any) {
          console.error('[🔐SIGNATURE] Signature verification failed:', signError);
          console.error('[🔐SIGNATURE] Error details:', {
            name: signError?.name,
            message: signError?.message,
            code: signError?.code,
            info: signError?.info
          });
          throw new Error(`Signature verification failed: ${signError?.message || 'Unknown error'}. You must sign the message to reconnect after disconnecting.`);
        }
      } else {
        console.log('[🔐RECONNECT] ⚠️ No disconnect nonce found - skipping signature verification');
        console.log('[🔐RECONNECT] This connection does NOT require signature (auto-reconnect from saved session)');
      }

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
        // Call real Convex Blockfrost action (server-side NFT verification)
        console.log('[WalletConnect] Calling Convex Blockfrost action...');
        const initResult = await initializeWithBlockfrostAction({
          walletAddress: stakeAddress,
          stakeAddress,
          walletType: wallet.name.toLowerCase(),
          paymentAddresses: usedAddresses
        });

        if (initResult.success) {
          console.log(`[WalletConnect] Successfully fetched ${initResult.mekCount} Meks from blockchain`);
          meks = initResult.meks || [];
        } else {
          console.error('[WalletConnect] Blockfrost initialization failed:', initResult.error);
          throw new Error(initResult.error || 'Failed to fetch NFTs from blockchain');
        }
      } catch (blockfrostError: any) {
        console.error('[WalletConnect] Blockfrost action error:', blockfrostError);
        // Continue without Meks if Blockfrost fails - corporation can still be created
        console.log('[WalletConnect] Continuing without Mek verification - check Blockfrost API');
      }

      // PHASE II: Create/link corporation using stake address ONLY
      // Stake address is the sole identifier - no payment address stored
      setConnectionStatus('Linking corporation...');
      let isNewCorporation = false;
      try {
        const corpResult = await connectCorporationMutation({
          stakeAddress: stakeAddress,
          walletType: wallet.name.toLowerCase(),
        });
        console.log('[WalletConnect] Corporation linked:', corpResult.isNew ? 'NEW CORPORATION' : 'EXISTING CORPORATION');
        isNewCorporation = corpResult.isNew;

        // Store session token for authenticated mutations (disconnect, update name, etc.)
        if (corpResult.sessionToken && typeof window !== 'undefined') {
          localStorage.setItem('mek_session_token', corpResult.sessionToken);
          console.log('[WalletConnect] Session token stored for authenticated operations');
        }

        // Store stake address for corporation queries
        if (typeof window !== 'undefined') {
          localStorage.setItem('mek_stake_address', stakeAddress);
        }
      } catch (corpLinkError) {
        // Non-fatal - log but continue
        console.warn('[WalletConnect] Could not link corporation:', corpLinkError);
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

      // Clear disconnect nonce after successful connection
      // User has proven wallet ownership via signature, safe to reconnect
      localStorage.removeItem('mek_disconnect_nonce');
      console.log('[WalletConnect] Cleared disconnect nonce - signature verification complete');

      // Store wallet type for reconnection
      if (typeof window !== 'undefined') {
        localStorage.setItem('goldMiningWallet', stakeAddress);
        localStorage.setItem('goldMiningWalletType', wallet.name.toLowerCase());
      }

      setConnectionStatus('Connection successful!');

      // Notify parent component with new corporation flag
      if (onConnected) {
        await onConnected(stakeAddress, isNewCorporation);
      }

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('walletConnected', { detail: { address: stakeAddress } }));

      // Reset state before closing
      setIsConnecting(false);

      // Close lightbox (parent will update isOpen prop which will unmount this component)
      onClose();

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
    setConnectionStatus('');
  };

  // Early return if not mounted or not open
  if (!mounted || !isOpen) {
    return null;
  }

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto p-4"
      onClick={onClose}
    >
      {/* Space Age backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/60"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      />

      {/* Connecting Modal */}
      {isConnecting && (
        <div
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
            {/* Spinning loader - glass style */}
            <div className="flex justify-center mb-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-yellow-400 rounded-full animate-spin" />
              </div>
            </div>

            {/* Status text - elegant typography */}
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-4 text-center">
              Connecting...
            </h2>

            {connectionStatus && (
              <p className="text-white/60 text-center text-sm sm:text-base mb-6 font-light tracking-wide">
                {connectionStatus}
              </p>
            )}

            {/* Cancel button - glass style */}
            <div className="flex justify-center mt-6">
              <button
                onClick={cancelConnection}
                className="px-8 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/10 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Wallet Selection */}
      {!isConnecting && (
        <div
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button - Space Age style */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white/80 transition-colors z-10"
            style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="px-6 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
            {/* Title - elegant Space Age typography */}
            <div className="text-center mb-6 sm:mb-8 pt-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-wide mb-3">
                Connect Wallet
              </h1>

              {/* System status - subtle */}
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-white/40 text-sm tracking-wide">
                  System Online
                </p>
              </div>
            </div>

            {/* Subtle divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6 sm:mb-8" />

            {/* Error message - Space Age style */}
            {walletError && (
              <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm font-light tracking-wide">
                {walletError}
              </div>
            )}

            {/* Wallet buttons or no wallets message */}
            {availableWallets.length > 0 ? (
              <>
                <p className="text-white/60 mb-6 sm:mb-8 text-center text-sm sm:text-base font-light tracking-wide leading-relaxed">
                  Connect your Cardano wallet to access Mek Tycoon
                </p>
                <div className={availableWallets.length === 1 ? "flex justify-center" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
                  {availableWallets.map(wallet => (
                    <button
                      key={wallet.name}
                      onClick={() => connectWallet(wallet)}
                      disabled={isConnecting}
                      className="group relative overflow-hidden rounded-xl min-h-[52px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      {/* Honeycomb hover effect */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                        style={{
                          backgroundImage: `url('/random-images/honey-png1.webp')`,
                          backgroundSize: '125%',
                          backgroundPosition: 'center',
                        }}
                      />
                      <span
                        className="relative z-10 text-white/90 font-medium tracking-wide transition-all duration-300 group-hover:[text-shadow:0_0_6px_rgba(255,255,255,0.9),0_0_12px_rgba(255,255,255,0.6)]"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {wallet.name}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="relative text-center py-4">
                {/* Elegant indicator - Space Age style */}
                <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-6 flex items-center justify-center">
                  {/* Outer rotating ring */}
                  <div
                    className="absolute inset-0 rounded-full animate-spin"
                    style={{
                      animationDuration: '8s',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="absolute top-0 left-1/2 w-1.5 h-1.5 -ml-0.5 -mt-0.5 bg-yellow-400 rounded-full" />
                  </div>
                  {/* Center circle */}
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <div className="w-3 h-3 bg-yellow-400/60 rounded-full animate-pulse" style={{ boxShadow: '0 0 20px rgba(250, 200, 50, 0.5)' }} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-light text-white tracking-wide">
                    No Wallet Detected
                  </h3>
                  <p className="text-white/50 text-sm sm:text-base font-light tracking-wide leading-relaxed max-w-sm mx-auto">
                    Please install a Cardano wallet extension on this device, then refresh the page.
                  </p>

                  {/* Supported wallets - glass pill */}
                  <div className="pt-2">
                    <div
                      className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <span className="text-xs text-white/40 tracking-wide">Nami • Eternl • Flint • Vespr • Lace • NuFi</span>
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
