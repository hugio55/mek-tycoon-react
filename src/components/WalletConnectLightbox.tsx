'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import CubeSpinner from '@/components/loaders/CubeSpinner';
import { getMediaUrl } from '@/lib/media-url';

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

  // Mek counting animation states
  const [quickMekCount, setQuickMekCount] = useState<number | null>(null);
  const [finalMekCount, setFinalMekCount] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(0);
  const [isCountingUp, setIsCountingUp] = useState(false);
  const [showFinalFlourish, setShowFinalFlourish] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<'connecting' | 'counting' | 'loading' | 'animating' | 'complete'>('connecting');
  const animationActiveRef = useRef<boolean>(false); // Track if animation should continue

  // Signature help states - show extended instructions after 10 seconds
  const [isAwaitingSignature, setIsAwaitingSignature] = useState(false);
  const [showSignatureHelp, setShowSignatureHelp] = useState(false);
  const signatureHelpTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // PHASE II: Convex mutation to create/link corporation (stake-address-only)
  const connectCorporationMutation = useMutation(api.corporationAuth.connectCorporation);

  // Blockfrost NFT verification action (server-side) - Phase II: uses blockfrostNftFetcher
  const fetchNFTsAction = useAction(api.blockfrostNftFetcher.fetchNFTsByStakeAddress);

  // Quick Mek count action (fast lookup without metadata)
  const quickMekCountAction = useAction(api.blockfrostNftFetcher.quickMekCount);

  // Mutation to sync Mek ownership to database after Blockfrost fetch
  const syncMeksOwnershipMutation = useMutation(api.corporationAuth.syncMeksOwnership);

  // Mount/unmount for portal rendering
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      // Clear previous errors and states when lightbox opens
      setWalletError(null);
      setConnectionStatus('');
      setQuickMekCount(null);
      setFinalMekCount(null);
      setDisplayCount(0);
      setIsCountingUp(false);
      setShowFinalFlourish(false);
      setLoadingPhase('connecting');
      setIsAwaitingSignature(false);
      setShowSignatureHelp(false);

      console.log('[🔐RECONNECT] WalletConnectLightbox opened - checking disconnect nonce...');
      const nonceCheck = localStorage.getItem('mek_disconnect_nonce');
      console.log('[🔐RECONNECT] Nonce status at lightbox open:', nonceCheck ? `✅ FOUND: ${nonceCheck.slice(0, 8)}...` : '❌ NOT FOUND');

      document.body.style.overflow = 'hidden';
      detectAvailableWallets();
    } else {
      document.body.style.overflow = '';
      setIsConnecting(false);
      setWalletError(null);
      // Stop any running animation
      animationActiveRef.current = false;
      // Clear signature help timeout on close
      if (signatureHelpTimeoutRef.current) {
        clearTimeout(signatureHelpTimeoutRef.current);
        signatureHelpTimeoutRef.current = null;
      }
    }

    return () => {
      document.body.style.overflow = '';
      animationActiveRef.current = false;
      if (signatureHelpTimeoutRef.current) {
        clearTimeout(signatureHelpTimeoutRef.current);
        signatureHelpTimeoutRef.current = null;
      }
    };
  }, [isOpen]);

  // Easing function: ease-out-cubic - starts fast, slows dramatically at end for impact
  const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

  // Animate count from 1 to final number with FIXED duration and easing
  // Returns Promise that resolves when animation + flourish complete
  const startCountingAnimation = useCallback((targetCount: number): Promise<void> => {
    return new Promise((resolve) => {
      if (targetCount <= 0) {
        setDisplayCount(0);
        setShowFinalFlourish(true);
        setLoadingPhase('complete');
        setTimeout(() => {
          setShowFinalFlourish(false);
          resolve();
        }, 1000);
        return;
      }

      console.log('[🔢COUNT] Starting eased counting animation to', targetCount);
      animationActiveRef.current = true;
      setIsCountingUp(true);
      setDisplayCount(1);
      setLoadingPhase('animating');

      // FIXED duration regardless of count - animation should always feel consistent
      // Small counts (1-5): slightly shorter so it doesn't drag
      // Normal counts: 1.5 seconds
      const baseDuration = targetCount <= 5 ? 800 : 1500;
      const startTime = Date.now();

      const animate = () => {
        // Check if animation was cancelled (lightbox closed)
        if (!animationActiveRef.current) {
          console.log('[🔢COUNT] Animation cancelled');
          resolve();
          return;
        }

        const elapsed = Date.now() - startTime;
        const linearProgress = Math.min(elapsed / baseDuration, 1);

        // Apply easing - starts fast, slows dramatically at the end
        const easedProgress = easeOutCubic(linearProgress);

        // Calculate current display count (1 to targetCount)
        const currentCount = Math.max(1, Math.round(1 + (targetCount - 1) * easedProgress));
        setDisplayCount(currentCount);

        if (linearProgress < 1) {
          // Continue animation
          requestAnimationFrame(animate);
        } else {
          // Animation complete - ensure we show exact final count
          setDisplayCount(targetCount);
          setIsCountingUp(false);
          setShowFinalFlourish(true);
          setLoadingPhase('complete');
          animationActiveRef.current = false;
          console.log('[🔢COUNT] Animation complete! Final count:', targetCount);

          // Show flourish for 1.5 seconds then resolve
          setTimeout(() => {
            setShowFinalFlourish(false);
            resolve();
          }, 1500);
        }
      };

      // Start the animation loop
      requestAnimationFrame(animate);
    });
  }, []);

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

      // STEP 1: Get wallet addresses FIRST (needed to determine if signature is required)
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

      // STEP 2: Check if signature is required
      // Signature is required if:
      // 1. User manually disconnected (disconnect nonce exists) - security for shared computers
      // 2. New user / no saved session for this stake address - prevents spam accounts
      console.log('[🔐SECURITY] Checking if signature verification is required...');
      const disconnectNonce = localStorage.getItem('mek_disconnect_nonce');
      const savedSession = await restoreWalletSession();
      const hasMatchingSession = savedSession && savedSession.stakeAddress === stakeAddress;

      console.log('[🔐SECURITY] Disconnect nonce:', disconnectNonce ? `FOUND: ${disconnectNonce.slice(0, 8)}...` : '❌ NOT FOUND');
      console.log('[🔐SECURITY] Saved session:', savedSession ? `FOUND for ${savedSession.stakeAddress.slice(0, 12)}...` : '❌ NOT FOUND');
      console.log('[🔐SECURITY] Session matches current wallet:', hasMatchingSession ? '✅ YES' : '❌ NO');

      // Require signature if: disconnect nonce exists OR no matching saved session
      const requireSignature = !!disconnectNonce || !hasMatchingSession;
      console.log('[🔐SECURITY] Signature required:', requireSignature ? '✅ YES' : '❌ NO (trusted session)');

      // Track if signature verification passed (for database update)
      let signatureVerified = false;

      if (requireSignature) {
        const reason = disconnectNonce ? 'manual disconnect detected' : 'new user or different wallet';
        console.log('[🔐SIGNATURE] ✅ Requiring signature verification -', reason);
        console.log('[🔐SIGNATURE] Wallet:', wallet.name);
        setConnectionStatus('Verifying wallet ownership...');

        // Generate challenge message
        const nonce = disconnectNonce || crypto.randomUUID();
        const challengeMessage = `Mek Tycoon Wallet Verification\n\nNonce: ${nonce}\nTimestamp: ${Date.now()}\n\nSign this message to verify you own this wallet.`;
        console.log('[🔐SIGNATURE] Challenge message generated');

        try {
          // Check if wallet supports signData (CIP-8)
          if (!api.signData) {
            console.error('[🔐SIGNATURE] Wallet does not support signData() method');
            throw new Error(`${wallet.name} does not support message signing (CIP-8). Please use Eternl, Nami, or another CIP-8 compatible wallet.`);
          }

          // Get payment addresses for signing
          // NOTE: Different wallets return addresses in different formats:
          // - Eternl/Nami: Often return hex-encoded addresses
          // - LACE/Vespr: May return bech32 (addr1...) directly
          const usedAddresses = await api.getUsedAddresses();
          console.log(`[🔐SIGNATURE] ${wallet.name} returned ${usedAddresses?.length || 0} addresses`);

          if (!usedAddresses || usedAddresses.length === 0) {
            throw new Error('No payment addresses found in wallet. Please ensure your wallet has at least one address.');
          }

          const rawAddress = usedAddresses[0];
          const isAlreadyBech32 = rawAddress.startsWith('addr1') || rawAddress.startsWith('addr_test');
          console.log(`[🔐SIGNATURE] Address format from ${wallet.name}:`, isAlreadyBech32 ? 'bech32' : 'hex');

          // Prepare both address formats - some wallets need bech32, others accept hex
          let bech32Address = rawAddress;
          let hexAddress = rawAddress;

          if (isAlreadyBech32) {
            // Already bech32 - try to get hex version for fallback
            console.log('[🔐SIGNATURE] Using bech32 address directly:', rawAddress.substring(0, 20) + '...');
          } else {
            // Convert hex to bech32
            try {
              const CSL = await import('@emurgo/cardano-serialization-lib-browser');
              const address = CSL.Address.from_bytes(Buffer.from(rawAddress, 'hex'));
              bech32Address = address.to_bech32();
              console.log('[🔐SIGNATURE] Converted hex to bech32:', bech32Address.substring(0, 20) + '...');
            } catch (conversionError) {
              console.warn('[🔐SIGNATURE] Address conversion failed, will try hex format:', conversionError);
              bech32Address = rawAddress; // Use raw as fallback
            }
          }

          // All wallets use hex-encoded UTF-8 message per CIP-8
          const encoder = new TextEncoder();
          const messageBytes = encoder.encode(challengeMessage);
          const messagePayload = Array.from(messageBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

          // Set up signature waiting state with delayed help message
          setIsAwaitingSignature(true);
          setShowSignatureHelp(false);

          // After 10 seconds, show extended help if still waiting
          signatureHelpTimeoutRef.current = setTimeout(() => {
            setShowSignatureHelp(true);
            console.log('[🔐SIGNATURE] Showing extended help - user may not see the popup');
          }, 10000);

          // Try signing with bech32 first (most compatible), fall back to hex if needed
          let signResult: any = null;
          let lastError: any = null;

          // Attempt 1: bech32 address (preferred)
          console.log(`[🔐SIGNATURE] Attempting signData with ${wallet.name} using bech32 format...`);
          try {
            signResult = await api.signData(bech32Address, messagePayload);
            console.log('[🔐SIGNATURE] ✅ Signature successful with bech32 format');
          } catch (bech32Error: any) {
            lastError = bech32Error;
            console.warn(`[🔐SIGNATURE] bech32 format failed for ${wallet.name}:`, bech32Error?.message || bech32Error);

            // Check if this is a user rejection (don't retry)
            const isRejection = bech32Error?.message?.toLowerCase().includes('declined') ||
                                bech32Error?.message?.toLowerCase().includes('cancelled') ||
                                bech32Error?.message?.toLowerCase().includes('canceled') ||
                                bech32Error?.message?.toLowerCase().includes('reject');

            if (!isRejection && !isAlreadyBech32 && hexAddress !== bech32Address) {
              // Attempt 2: hex address (fallback for some wallets)
              console.log(`[🔐SIGNATURE] Retrying signData with ${wallet.name} using hex format...`);
              try {
                signResult = await api.signData(hexAddress, messagePayload);
                console.log('[🔐SIGNATURE] ✅ Signature successful with hex format');
              } catch (hexError: any) {
                console.error(`[🔐SIGNATURE] hex format also failed for ${wallet.name}:`, hexError?.message || hexError);
                lastError = hexError; // Keep the more recent error
              }
            }
          }

          // Clear the help timeout
          if (signatureHelpTimeoutRef.current) {
            clearTimeout(signatureHelpTimeoutRef.current);
            signatureHelpTimeoutRef.current = null;
          }
          setIsAwaitingSignature(false);
          setShowSignatureHelp(false);

          if (!signResult) {
            // Signature failed - throw the last error
            throw lastError || new Error('Signature failed');
          }

          console.log('[🔐SIGNATURE] Signature received successfully!');
          setConnectionStatus('Wallet verified!');
          signatureVerified = true; // Mark as verified for database update

          // Signature succeeded - user proved they own the wallet
          // CRITICAL: Clear nonce IMMEDIATELY after successful signature
          if (disconnectNonce) {
            localStorage.removeItem('mek_disconnect_nonce');
            console.log('[🔐SIGNATURE] Cleared disconnect nonce after successful signature');
          }
        } catch (signError: any) {
          // Clear the help timeout on error
          if (signatureHelpTimeoutRef.current) {
            clearTimeout(signatureHelpTimeoutRef.current);
            signatureHelpTimeoutRef.current = null;
          }
          setIsAwaitingSignature(false);
          setShowSignatureHelp(false);

          console.error('[🔐SIGNATURE] Signature verification failed:', signError);
          console.error('[🔐SIGNATURE] Error details:', {
            wallet: wallet.name,
            name: signError?.name,
            message: signError?.message,
            code: signError?.code,
            info: signError?.info
          });

          // Categorize error for user-friendly message
          const errorMsg = signError?.message?.toLowerCase() || '';

          // User declined/cancelled
          if (errorMsg.includes('declined') || errorMsg.includes('cancelled') ||
              errorMsg.includes('canceled') || errorMsg.includes('reject')) {
            throw new Error('Signature cancelled. Please click your wallet again and sign the message when prompted.');
          }

          // CIP-8 not supported
          if (errorMsg.includes('not supported') || errorMsg.includes('not implemented')) {
            throw new Error(`${wallet.name} may not fully support message signing. Try using Eternl or Nami wallet instead.`);
          }

          // Address format error
          if (errorMsg.includes('address') || errorMsg.includes('invalid')) {
            throw new Error(`${wallet.name} had trouble with the address format. Please try disconnecting and reconnecting your wallet.`);
          }

          // Generic error with wallet name
          throw new Error(`${wallet.name} verification failed: ${signError?.message || 'Unknown error'}. Please try again or use a different wallet.`);
        }
      } else {
        console.log('[🔐SECURITY] ✅ Trusted session found - skipping signature verification');
        console.log('[🔐SECURITY] Session stake address matches current wallet');
        // Trusted sessions were verified when originally created
        signatureVerified = true;
      }

      // PHASE 1: Quick count - get Mek count immediately
      console.log('[WalletConnect] Phase 1: Getting quick Mek count...');
      setLoadingPhase('counting');

      // OPTIMISTIC UI: Show last known Mek count immediately while scanning
      const lastKnownCount = localStorage.getItem(`mek_count_${stakeAddress}`);
      if (lastKnownCount) {
        const count = parseInt(lastKnownCount, 10);
        if (count > 0) {
          setQuickMekCount(count);
          setConnectionStatus(`Verifying ${count} Mek${count !== 1 ? 's' : ''}...`);
          console.log(`[WalletConnect] Optimistic UI: Showing last known count of ${count} Meks`);
        } else {
          setConnectionStatus('Scanning blockchain for Meks...');
        }
      } else {
        setConnectionStatus('Scanning blockchain for Meks...');
      }

      let detectedMekCount = 0;

      try {
        const quickCountResult = await quickMekCountAction({ stakeAddress });
        if (quickCountResult.success && quickCountResult.count > 0) {
          detectedMekCount = quickCountResult.count;
          setQuickMekCount(detectedMekCount);
          setConnectionStatus(`Found ${detectedMekCount} Mek${detectedMekCount !== 1 ? 's' : ''} on blockchain!`);
          console.log(`[WalletConnect] Quick count: ${detectedMekCount} Meks`);
          // Update cached count
          localStorage.setItem(`mek_count_${stakeAddress}`, detectedMekCount.toString());
        } else if (quickCountResult.count === 0) {
          setQuickMekCount(null);
          setConnectionStatus('No Meks found in wallet');
          console.log('[WalletConnect] Quick count: 0 Meks');
          localStorage.removeItem(`mek_count_${stakeAddress}`);
        }
      } catch (quickCountError: any) {
        console.warn('[WalletConnect] Quick count failed, continuing...', quickCountError);
      }

      // PHASE 2 & 3: Run animation and full data load IN PARALLEL
      // This saves ~2 seconds by overlapping the animation with data fetching
      console.log('[WalletConnect] Phase 2: Loading full Mek data (parallel with animation)...');

      let meks: any[] = [];

      if (detectedMekCount > 0) {
        // Start animation IMMEDIATELY - don't wait for full load
        setConnectionStatus('');
        console.log('[WalletConnect] Starting animation and data load in PARALLEL');

        // Create both promises but don't await them individually
        const animationPromise = startCountingAnimation(detectedMekCount);

        const dataLoadPromise = (async () => {
          try {
            console.log('[WalletConnect] Calling Convex Blockfrost action (parallel)...');
            const initResult = await fetchNFTsAction({
              stakeAddress: stakeAddress,
            });

            if (initResult.success) {
              console.log(`[WalletConnect] Data load complete: ${initResult.meks.length} Meks`);
              meks = initResult.meks || [];
              setFinalMekCount(initResult.meks.length || 0);
              return { success: true, meks };
            } else {
              console.error('[WalletConnect] Blockfrost initialization failed:', initResult.error);
              return { success: false, error: initResult.error };
            }
          } catch (blockfrostError: any) {
            console.error('[WalletConnect] Blockfrost action error:', blockfrostError);
            return { success: false, error: blockfrostError.message };
          }
        })();

        // Wait for BOTH to complete - animation masks the loading time!
        const [, dataResult] = await Promise.all([animationPromise, dataLoadPromise]);
        console.log('[WalletConnect] Both animation and data load complete');

        if (!dataResult.success) {
          console.log('[WalletConnect] Data load failed but continuing - corporation can still be created');
        }
      } else {
        // No Meks detected - just do the data load without animation
        setLoadingPhase('loading');
        setConnectionStatus('Loading your Meks from blockchain...');

        try {
          console.log('[WalletConnect] Calling Convex Blockfrost action (no animation)...');
          const initResult = await fetchNFTsAction({
            stakeAddress: stakeAddress,
          });

          if (initResult.success) {
            console.log(`[WalletConnect] Successfully fetched ${initResult.meks.length} Meks from blockchain`);
            meks = initResult.meks || [];
            setFinalMekCount(initResult.meks.length || 0);
          } else {
            console.error('[WalletConnect] Blockfrost initialization failed:', initResult.error);
          }
        } catch (blockfrostError: any) {
          console.error('[WalletConnect] Blockfrost action error:', blockfrostError);
          console.log('[WalletConnect] Continuing without Mek verification - check Blockfrost API');
        }
      }

      // PHASE II: Sync Mek ownership to database if any Meks were found
      if (meks.length > 0) {
        console.log('[WalletConnect] Syncing', meks.length, 'Meks to database...');
        setConnectionStatus('Syncing Meks...');
        try {
          const syncResult = await syncMeksOwnershipMutation({
            stakeAddress: stakeAddress,
            verifiedMeks: meks.map((m: any) => ({
              assetId: m.assetId,
              assetName: m.assetName,
              mekNumber: m.mekNumber,
            })),
          });
          console.log('[WalletConnect] Mek sync complete:', syncResult);
        } catch (syncError) {
          console.warn('[WalletConnect] Could not sync Meks:', syncError);
          // Non-fatal - continue with connection
        }
      }

      // PHASE II: Create/link corporation using stake address ONLY
      // Stake address is the sole identifier - no payment address stored
      setLoadingPhase('connecting');
      setConnectionStatus('Linking corporation...');
      let isNewCorporation = false;
      try {
        const corpResult = await connectCorporationMutation({
          stakeAddress: stakeAddress,
          walletType: wallet.name.toLowerCase(),
          signatureVerified: signatureVerified, // Pass verification status to backend
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

      // Note: Disconnect nonce is now cleared immediately after successful signature (above)
      // This prevents requiring re-signing if later connection steps fail

      // Store wallet type and Mek count for reconnection
      if (typeof window !== 'undefined') {
        localStorage.setItem('goldMiningWallet', stakeAddress);
        localStorage.setItem('goldMiningWalletType', wallet.name.toLowerCase());
        // Store Mek count for optimistic UI on next connection
        if (meks.length > 0) {
          localStorage.setItem(`mek_count_${stakeAddress}`, meks.length.toString());
        }
      }

      setConnectionStatus('Connection successful!');

      // Dispatch custom event for new corporation BEFORE calling onConnected
      // This ensures the modal shows immediately on the connecting tab
      if (isNewCorporation) {
        console.log('[WalletConnect] Dispatching newCorporationCreated event');
        window.dispatchEvent(new CustomEvent('newCorporationCreated', {
          detail: { address: stakeAddress, isNew: true }
        }));
      }

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
      // Auto-clear error after 5 seconds so user doesn't feel stuck
      setTimeout(() => {
        setWalletError(null);
      }, 5000);
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
            {/* Show cube spinner when not in counting animation phase */}
            {loadingPhase !== 'animating' && loadingPhase !== 'complete' && (
              <div className="flex justify-center mb-6">
                <CubeSpinner size={40} color="cyan" speed="slow" />
              </div>
            )}

            {/* Counting animation display */}
            {(loadingPhase === 'animating' || loadingPhase === 'complete') && (
              <div className="flex flex-col items-center mb-6">
                {/* Large animated counter */}
                <div
                  className={`relative transition-all duration-300 ${
                    showFinalFlourish ? 'scale-110' : isCountingUp ? 'scale-100' : 'scale-100'
                  }`}
                >
                  {/* Glow effect on final flourish */}
                  {showFinalFlourish && (
                    <>
                      {/* Outer glow pulse */}
                      <div
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{
                          background: 'radial-gradient(circle, rgba(250, 182, 23, 0.4) 0%, transparent 70%)',
                          transform: 'scale(2)',
                          animationDuration: '1s',
                        }}
                      />
                      {/* Inner glow */}
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'radial-gradient(circle, rgba(250, 182, 23, 0.3) 0%, transparent 60%)',
                          transform: 'scale(1.5)',
                          filter: 'blur(10px)',
                        }}
                      />
                    </>
                  )}

                  {/* The count number */}
                  <div
                    className={`relative text-6xl sm:text-7xl font-bold transition-all duration-200 ${
                      showFinalFlourish
                        ? 'text-yellow-400'
                        : isCountingUp
                        ? 'text-yellow-500/90'
                        : 'text-white'
                    }`}
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      textShadow: showFinalFlourish
                        ? '0 0 30px rgba(250, 182, 23, 0.8), 0 0 60px rgba(250, 182, 23, 0.5), 0 0 90px rgba(250, 182, 23, 0.3)'
                        : isCountingUp
                        ? '0 0 15px rgba(250, 182, 23, 0.4)'
                        : 'none',
                    }}
                  >
                    {displayCount}
                  </div>
                </div>

                {/* Label under the count */}
                <p
                  className={`mt-3 text-lg font-light tracking-wider transition-all duration-300 ${
                    showFinalFlourish ? 'text-yellow-400/90' : 'text-white/60'
                  }`}
                >
                  {displayCount === 1 ? 'Mek' : 'Meks'}
                  {showFinalFlourish && ' Loaded!'}
                </p>

                {/* Sparkle effects on completion */}
                {showFinalFlourish && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
                        style={{
                          left: `${20 + Math.random() * 60}%`,
                          top: `${20 + Math.random() * 60}%`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '1.5s',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Status text - elegant typography */}
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-4 text-center">
              {loadingPhase === 'connecting' && 'Connecting...'}
              {loadingPhase === 'counting' && 'Scanning Blockchain...'}
              {loadingPhase === 'loading' && (quickMekCount !== null ? `Loading ${quickMekCount} Meks...` : 'Loading...')}
              {loadingPhase === 'animating' && 'Loading Complete!'}
              {loadingPhase === 'complete' && (showFinalFlourish ? 'Ready!' : 'Finalizing...')}
            </h2>

            {connectionStatus && loadingPhase !== 'animating' && loadingPhase !== 'complete' && (
              <p className="text-white/60 text-center text-sm sm:text-base mb-6 font-light tracking-wide">
                {connectionStatus}
              </p>
            )}

            {/* Extended signature help - fades in after 10 seconds of waiting */}
            {isAwaitingSignature && showSignatureHelp && (
              <div
                className="mb-6 p-4 rounded-xl text-center transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 200, 220, 0.08), rgba(0, 200, 220, 0.03))',
                  border: '1px solid rgba(0, 200, 220, 0.2)',
                }}
              >
                <p className="text-cyan-400/90 text-sm font-medium mb-2">
                  Can't find the signature window?
                </p>
                <p className="text-white/60 text-xs leading-relaxed">
                  Look for a small floating popup window from your wallet extension.
                  It may have appeared behind other windows or minimized to your taskbar/dock.
                </p>
                <p className="text-white/40 text-xs mt-2 leading-relaxed">
                  Clicking the wallet extension might not show this popup. You need to find the window that automatically opened.
                </p>
              </div>
            )}

            {/* Quick count badge - shows detected count before full load */}
            {quickMekCount !== null && loadingPhase === 'loading' && (
              <div className="flex justify-center mb-4">
                <div
                  className="px-4 py-2 rounded-full text-sm font-medium"
                  style={{
                    background: 'linear-gradient(135deg, rgba(250, 182, 23, 0.2), rgba(250, 182, 23, 0.1))',
                    border: '1px solid rgba(250, 182, 23, 0.3)',
                    color: 'rgba(250, 182, 23, 0.9)',
                  }}
                >
                  {quickMekCount} Mek{quickMekCount !== 1 ? 's' : ''} detected
                </div>
              </div>
            )}

            {/* Cancel button - glass style */}
            {loadingPhase !== 'complete' && (
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
            )}
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
                          backgroundImage: `url('${getMediaUrl('/random-images/honey-png1.webp')}')`,
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
                {/* 3D Cube indicator */}
                <div className="flex justify-center mb-6">
                  <CubeSpinner size={40} color="cyan" speed="slow" />
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
