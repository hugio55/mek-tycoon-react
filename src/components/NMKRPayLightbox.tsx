'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ensureBech32StakeAddress } from '@/lib/cardanoAddressConverter';
import { getMediaUrl } from '@/lib/media-url';

interface NMKRPayLightboxProps {
  walletAddress: string | null;
  onClose: () => void;
  // Optional: If not provided, auto-selects first active campaign with available NFTs
  campaignId?: Id<"commemorativeCampaigns">;
}

type LightboxState = 'loading_campaign' | 'no_campaign' | 'address_entry' | 'checking_eligibility' | 'ineligible' | 'already_claimed' | 'corporation_verified' | 'creating' | 'reserved' | 'wallet_verification' | 'payment' | 'payment_window_closed' | 'processing' | 'success' | 'error' | 'timeout';

export default function NMKRPayLightbox({ walletAddress, onClose, campaignId: propCampaignId }: NMKRPayLightboxProps) {
  const [mounted, setMounted] = useState(false);
  // ALWAYS check eligibility when wallet is provided - never skip to 'creating'
  const [state, setState] = useState<LightboxState>(propCampaignId ? (walletAddress ? 'checking_eligibility' : 'address_entry') : 'loading_campaign');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [reservationId, setReservationId] = useState<Id<"commemorativeNFTInventory"> | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [manualAddress, setManualAddress] = useState<string>('');
  const [addressError, setAddressError] = useState<string>('');
  const [storedEligibility, setStoredEligibility] = useState<{ hasActiveReservation?: boolean; alreadyClaimed?: boolean; eligible?: boolean; reason?: string; corporationName?: string; claimedNFTDetails?: { name: string; editionNumber: number; imageUrl?: string; soldAt?: number } } | null>(null);
  const [activeCampaignId, setActiveCampaignId] = useState<Id<"commemorativeCampaigns"> | null>(propCampaignId || null);
  const [corporationName, setCorporationName] = useState<string | null>(null);

  // Wallet verification state
  const [availableWallets, setAvailableWallets] = useState<Array<{ name: string; icon: string; api: any }>>([]);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [walletVerificationError, setWalletVerificationError] = useState<string | null>(null);
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);
  const [isRequestingSignature, setIsRequestingSignature] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkCopyFailed, setLinkCopyFailed] = useState(false);
  const [isResumingFromMobile, setIsResumingFromMobile] = useState(false);
  const [resumeValidating, setResumeValidating] = useState(false);
  const [isVerifyingClosedWindowPayment, setIsVerifyingClosedWindowPayment] = useState(false);
  const [isCreatingMobileReservation, setIsCreatingMobileReservation] = useState(false);

  // Backend verification state (cryptographic proof of wallet ownership)
  const [backendVerificationStatus, setBackendVerificationStatus] = useState<'idle' | 'generating_nonce' | 'awaiting_signature' | 'verifying' | 'success' | 'failed'>('idle');
  const [verificationNonce, setVerificationNonce] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  const hasInitiatedTimeoutRelease = useRef(false);

  const effectiveWalletAddress = walletAddress || manualAddress;

  // Query for active campaigns (only if no campaignId prop provided)
  const activeCampaigns = useQuery(
    api.campaigns.getActiveCampaigns,
    !propCampaignId ? {} : "skip"
  );

  // Auto-select first active campaign with available NFTs
  // CRITICAL: Only run this effect ONCE on initial load, not on every campaign update
  const [hasInitializedCampaign, setHasInitializedCampaign] = useState(false);

  useEffect(() => {
    if (propCampaignId) {
      setActiveCampaignId(propCampaignId);
      return;
    }

    // CRITICAL: Don't override state if we're resuming from mobile
    // The resume flow already set the campaign ID and state
    if (isResumingFromMobile) {
      console.log('[CAMPAIGN] Skipping campaign selection - resuming from mobile');
      setHasInitializedCampaign(true);
      return;
    }

    // Only run campaign selection logic once on initial load
    if (hasInitializedCampaign) return;

    if (activeCampaigns === undefined) return; // Still loading

    if (!activeCampaigns || activeCampaigns.length === 0) {
      console.log('[CAMPAIGN] No active campaigns found');
      setState('no_campaign');
      setHasInitializedCampaign(true);
      return;
    }

    // Find first campaign with available NFTs
    const campaignWithNFTs = activeCampaigns.find(c => c.availableNFTs > 0);
    if (campaignWithNFTs) {
      console.log('[CAMPAIGN] Auto-selected campaign:', campaignWithNFTs.name, campaignWithNFTs._id);
      setActiveCampaignId(campaignWithNFTs._id);
      // ALWAYS check eligibility first, even with pre-populated wallet
      // This ensures campaign eligibility snapshot is enforced
      setState(walletAddress ? 'checking_eligibility' : 'address_entry');
      setHasInitializedCampaign(true);
    } else {
      // All campaigns are sold out
      console.log('[CAMPAIGN] All campaigns sold out');
      setErrorMessage('All NFTs have been claimed. Check back later for new campaigns!');
      setState('error');
      setHasInitializedCampaign(true);
    }
  }, [activeCampaigns, propCampaignId, walletAddress, hasInitializedCampaign, isResumingFromMobile]);

  // Campaign-aware mutations
  const createReservation = useMutation(api.commemorativeNFTReservationsCampaign.createCampaignReservation);
  const releaseReservation = useMutation(api.commemorativeNFTReservationsCampaign.releaseCampaignReservation);
  const markPaymentWindowOpened = useMutation(api.commemorativeNFTReservationsCampaign.markPaymentWindowOpened);
  const markPaymentWindowClosed = useMutation(api.commemorativeNFTReservationsCampaign.markPaymentWindowClosed);

  // Query active reservation (campaign-aware)
  const activeReservation = useQuery(
    api.commemorativeNFTReservationsCampaign.getActiveCampaignReservation,
    reservationId && effectiveWalletAddress && activeCampaignId
      ? { campaignId: activeCampaignId, walletAddress: effectiveWalletAddress }
      : "skip"
  );

  // Debug logging for activeReservation query
  useEffect(() => {
    if (state === 'reserved') {
      console.log('[🔨RESERVE] State is "reserved", activeReservation query status:', {
        reservationId,
        effectiveWalletAddress,
        activeCampaignId,
        querySkipped: !(reservationId && effectiveWalletAddress && activeCampaignId),
        activeReservation: activeReservation ? 'POPULATED ✓' : 'undefined (still loading...)',
      });
    }
  }, [state, activeReservation, reservationId, effectiveWalletAddress, activeCampaignId]);

  // Query for payment completion - checks if THIS SPECIFIC reservation was paid
  // Uses reservation ID (not wallet) to prevent false positives from previous claims
  // Also runs during 'payment' state for active polling while NMKR window is open
  // ENHANCED: Now passes walletAddress for additional detection paths (claims table, webhooks table)
  const reservationPaymentStatus = useQuery(
    api.commemorativeNFTClaims.checkReservationPaid,
    (state === 'payment' || state === 'processing' || state === 'payment_window_closed') && reservationId
      ? { reservationId, walletAddress: effectiveWalletAddress || undefined }
      : "skip"
  );

  // Query for eligibility checking (per-campaign)
  const eligibility = useQuery(
    api.nftEligibility.checkCampaignEligibility,
    state === 'checking_eligibility' && effectiveWalletAddress && activeCampaignId
      ? { walletAddress: effectiveWalletAddress, campaignId: activeCampaignId }
      : "skip"
  );

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Detect and handle mobile resume from URL parameters
  // This allows mobile users to continue their session in wallet browser
  // Compatible with: iOS Safari 11+, Chrome Mobile, Firefox Mobile, Samsung Internet
  useEffect(() => {
    if (!mounted) return;

    // URLSearchParams is supported in all modern browsers (iOS 11+, Android 5+)
    const params = new URLSearchParams(window.location.search);
    const isResume = params.get('claimResume') === 'true';

    if (isResume) {
      const rid = params.get('rid');
      const addr = params.get('addr');
      const cid = params.get('cid');

      // Validate all required params exist and are non-empty
      if (rid && rid.length > 0 && addr && addr.length > 0 && cid && cid.length > 0) {
        console.log('[🔐RESUME] Mobile resume detected from URL:', {
          rid: rid.substring(0, 10) + '...',
          addr: addr.substring(0, 20) + '...',
          cid: cid.substring(0, 10) + '...'
        });

        setIsResumingFromMobile(true);
        setResumeValidating(true);

        // Set state from URL params to resume session
        setReservationId(rid as Id<"commemorativeNFTInventory">);
        setManualAddress(addr);
        setActiveCampaignId(cid as Id<"commemorativeCampaigns">);

        // Skip directly to reserved state - the activeReservation query will validate
        setState('reserved');

        // Clean up URL (remove query params for cleaner display)
        // history.replaceState is supported in all modern browsers
        try {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        } catch (historyError) {
          // Some browsers restrict history manipulation in certain contexts
          console.warn('[🔐RESUME] Could not clean URL:', historyError);
        }

        console.log('[🔐RESUME] Session restored, validating reservation...');
      } else {
        console.warn('[🔐RESUME] Incomplete or invalid resume params, starting fresh');
        // Clean up malformed URL
        try {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        } catch (e) { /* ignore */ }
      }
    }
  }, [mounted]);

  // Handle mobile resume validation - watch for query to populate
  // Uses reactive approach instead of fixed timeout for better reliability
  useEffect(() => {
    if (!isResumingFromMobile || !resumeValidating || !mounted) return;

    // If activeReservation populated, resume is successful - go directly to wallet verification
    if (activeReservation) {
      console.log('[🔐RESUME] ✅ Reservation validated, going directly to wallet verification');
      setIsResumingFromMobile(false);
      setResumeValidating(false);

      // Detect available wallets and transition to wallet_verification
      detectWalletsAndMobile();
      setState('wallet_verification');
      return;
    }

    // Set a maximum wait time (5 seconds for slow connections)
    const timeout = setTimeout(() => {
      if (!activeReservation) {
        console.log('[🔐RESUME] Reservation invalid or expired after 5s - resetting');
        setIsResumingFromMobile(false);
        setResumeValidating(false);
        setErrorMessage('Your reservation has expired or is invalid. Please start again.');
        setState('address_entry');
        setReservationId(null);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isResumingFromMobile, resumeValidating, activeReservation, mounted]);

  const validateCardanoAddress = (address: string): boolean => {
    if (!address) return false;
    const isMainnet = address.startsWith('addr1');
    const isTestnet = address.startsWith('addr_test1');
    const isStakeAddress = address.startsWith('stake1') || address.startsWith('stake_test1');
    const validLength = address.length >= 50 && address.length <= 150;
    return (isMainnet || isTestnet || isStakeAddress) && validLength;
  };

  const handleAddressSubmit = () => {
    const trimmedAddress = manualAddress.trim();
    if (!validateCardanoAddress(trimmedAddress)) {
      setAddressError('Please enter a valid Cardano stake address (starts with stake1 or stake_test1)');
      return;
    }
    console.log('[ELIGIBILITY] Checking eligibility for:', trimmedAddress);
    setAddressError('');
    setState('checking_eligibility');
  };

  // Handle eligibility check result
  useEffect(() => {
    if (state !== 'checking_eligibility' || !eligibility) return;

    console.log('[ELIGIBILITY] Result:', eligibility);
    setStoredEligibility(eligibility);

    if (eligibility.alreadyClaimed) {
      console.log('[ELIGIBILITY] User already claimed');
      setState('already_claimed');
      return;
    }

    if (eligibility.eligible) {
      console.log('[ELIGIBILITY] User is eligible, corporation:', eligibility.corporationName);
      // Store corporation name and show verification screen
      setCorporationName(eligibility.corporationName || null);
      setState('corporation_verified');
    } else {
      console.log('[ELIGIBILITY] User is not eligible:', eligibility.reason);
      setState('ineligible');
    }
  }, [state, eligibility]);

  // Create reservation using campaign system
  useEffect(() => {
    if (!mounted || state !== 'creating' || !effectiveWalletAddress || !activeCampaignId) return;

    const createNewReservation = async () => {
      console.log('[🔨RESERVE] Creating campaign reservation for:', effectiveWalletAddress, 'campaign:', activeCampaignId);

      try {
        const result = await createReservation({
          campaignId: activeCampaignId,
          walletAddress: effectiveWalletAddress
        });

        if (!result.success) {
          console.error('[🔨RESERVE] Failed to create reservation:', result.error);
          setErrorMessage(result.message || result.error || 'Failed to reserve NFT');
          setState('error');
          return;
        }

        console.log('[🔨RESERVE] ✓ Reservation created successfully:', result.reservation);
        console.log('[🔨RESERVE] Setting reservationId:', result.reservation._id);
        // Campaign system uses inventory ID as reservation ID
        setReservationId(result.reservation._id as Id<"commemorativeNFTInventory">);
        console.log('[🔨RESERVE] Transitioning state from "creating" → "reserved"');
        setState('reserved');
        console.log('[🔨RESERVE] State transition complete, waiting for activeReservation query to populate...');
      } catch (error) {
        console.error('[🔨RESERVE] Error creating reservation:', error);
        setErrorMessage('Failed to create reservation');
        setState('error');
      }
    };

    createNewReservation();
  }, [mounted, state, effectiveWalletAddress, activeCampaignId, createReservation]);

  // Auto-create reservation for mobile users in wallet_verification state
  // On mobile, we need the reservation BEFORE showing Copy Link (for resume URL)
  // On desktop, reservation is created AFTER wallet verification signature
  useEffect(() => {
    // Only run if: in wallet_verification, mobile detected, no reservation yet, not already creating
    if (state !== 'wallet_verification' || !isMobileBrowser || reservationId || isCreatingMobileReservation) {
      return;
    }

    // Need wallet address and campaign to create reservation
    if (!effectiveWalletAddress || !activeCampaignId) {
      return;
    }

    console.log('[📱MOBILE] Auto-creating reservation for mobile user before Copy Link');
    setIsCreatingMobileReservation(true);

    createReservation({
      campaignId: activeCampaignId,
      walletAddress: effectiveWalletAddress
    }).then(result => {
      if (result.success && result.reservation) {
        console.log('[📱MOBILE] ✓ Reservation created:', result.reservation._id);
        setReservationId(result.reservation._id as Id<"commemorativeNFTInventory">);
      } else {
        console.error('[📱MOBILE] Failed to create reservation:', result.error);
        setErrorMessage(result.message || result.error || 'Failed to reserve NFT');
        setState('error');
      }
      setIsCreatingMobileReservation(false);
    }).catch(error => {
      console.error('[📱MOBILE] Error creating reservation:', error);
      setErrorMessage('Failed to create reservation');
      setState('error');
      setIsCreatingMobileReservation(false);
    });
  }, [state, isMobileBrowser, reservationId, isCreatingMobileReservation, effectiveWalletAddress, activeCampaignId, createReservation]);

  // Detect available wallets and check if mobile browser
  const detectWalletsAndMobile = () => {
    // Check if window.cardano exists (might take a moment for extensions to inject)
    const hasCardano = typeof window !== 'undefined' && window.cardano;

    console.log('[🔐WALLET-DETECT] Starting detection, window.cardano exists:', !!hasCardano);
    if (hasCardano) {
      console.log('[🔐WALLET-DETECT] window.cardano keys:', Object.keys(window.cardano));
    }

    if (!hasCardano) {
      console.log('[🔐WALLET-DETECT] No window.cardano - checking if mobile or extensions not loaded yet');
      // On desktop, extensions might not have injected yet - try again after short delay
      setTimeout(() => {
        const retryCardano = typeof window !== 'undefined' && window.cardano;
        if (retryCardano) {
          console.log('[🔐WALLET-DETECT] Retry successful - extensions loaded after delay');
          doWalletDetection();
        } else {
          console.log('[🔐WALLET-DETECT] Still no window.cardano after retry - assuming mobile');
          setIsMobileBrowser(true);
          setAvailableWallets([]);
        }
      }, 500);
      return;
    }

    doWalletDetection();
  };

  // Actual wallet detection logic (extracted for retry use)
  const doWalletDetection = () => {
    const cardano = window.cardano;
    if (!cardano) {
      setIsMobileBrowser(true);
      setAvailableWallets([]);
      return;
    }

    setIsMobileBrowser(false);
    const wallets: Array<{ name: string; icon: string; api: any }> = [];

    // List of known wallets to check for
    const knownWallets = [
      { name: 'Nami', icon: '/wallet-icons/nami.png' },
      { name: 'Eternl', icon: '/wallet-icons/eternl.png' },
      { name: 'Flint', icon: '/wallet-icons/flint.png' },
      { name: 'Vespr', icon: '/wallet-icons/vespr.png' },
      { name: 'Typhon', icon: '/wallet-icons/typhon.png' },
      { name: 'NuFi', icon: '/wallet-icons/nufi.png' },
      { name: 'Lace', icon: '/wallet-icons/lace.png' },
      { name: 'Yoroi', icon: '/wallet-icons/yoroi.png' },
    ];

    knownWallets.forEach(wallet => {
      const name = wallet.name.toLowerCase();
      console.log(`[🔐WALLET-DETECT] Checking for ${wallet.name} (${name}):`, !!cardano[name]);
      if (cardano[name]) {
        wallets.push({
          icon: wallet.icon,
          name: wallet.name,
          api: cardano[name]
        });
      }
    });

    console.log('[🔐WALLET-DETECT] Final detected wallets:', wallets.map(w => w.name));
    setAvailableWallets(wallets);
  };

  // Handle "Open Payment Window" click - open payment directly
  // Wallet verification already happened before reservation was created
  const handleOpenPayment = async () => {
    if (!activeReservation || !reservationId) return;

    console.log('[PAY] User clicked Open Payment Window - opening payment directly (already verified)');
    await openNMKRPayment();
  };

  // Actually open the NMKR payment window (called after verification succeeds)
  const openNMKRPayment = async () => {
    if (!activeReservation || !reservationId) return;

    console.log('[PAY] Opening payment window...');

    try {
      await markPaymentWindowOpened({ reservationId });

      const paymentUrl = activeReservation.nft?.paymentUrl;
      console.log('[PAY] Payment URL:', paymentUrl);

      if (!paymentUrl) {
        setErrorMessage('Payment URL not found. Please contact support.');
        setState('error');
        return;
      }

      const popup = window.open(
        paymentUrl,
        'NMKR Payment',
        'width=500,height=800,left=100,top=100'
      );

      if (!popup) {
        console.log('[PAY] Popup blocked - waiting for user to allow and retry');
        setErrorMessage('Popup blocked. Please allow popups for this site, then click "Open Payment Window" again.');
        setState('reserved'); // Go back to reserved state
        return;
      }

      setPaymentWindow(popup);
      setState('payment');
      setErrorMessage('');
    } catch (error) {
      console.error('[PAY] Error opening payment:', error);
      setErrorMessage('Failed to open payment window');
      setState('error');
    }
  };

  // Connect to a wallet and verify stake address matches
  const connectAndVerifyWallet = async (wallet: { name: string; icon: string; api: any }) => {
    setIsConnectingWallet(true);
    setWalletVerificationError(null);
    // Reset backend verification state for fresh attempt
    setBackendVerificationStatus('idle');
    setVerificationNonce(null);
    setVerificationMessage(null);

    try {
      console.log(`[🔐VERIFY] Connecting to ${wallet.name}...`);

      // Enable the wallet
      const api = await Promise.race([
        wallet.api.enable(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Wallet connection timeout after 30 seconds')), 30000)
        )
      ]) as any;

      // Get stake addresses from connected wallet
      console.log('[🔐VERIFY] Getting stake addresses...');
      const stakeAddresses = await api.getRewardAddresses();

      if (!stakeAddresses || stakeAddresses.length === 0) {
        throw new Error('No stake addresses found in wallet');
      }

      const walletStakeRaw = stakeAddresses[0];
      console.log('[🔐VERIFY] Wallet stake address (raw):', walletStakeRaw);

      // Convert to bech32 if needed
      let walletStakeAddress = walletStakeRaw;
      if (!walletStakeRaw.startsWith('stake')) {
        // It's hex, convert to bech32
        try {
          walletStakeAddress = ensureBech32StakeAddress(walletStakeRaw);
          console.log('[🔐VERIFY] Converted to bech32:', walletStakeAddress);
        } catch (convErr) {
          console.error('[🔐VERIFY] Conversion failed, using raw:', convErr);
        }
      }

      // Compare with entered stake address
      const enteredStake = effectiveWalletAddress;
      console.log('[🔐VERIFY] Comparing addresses:');
      console.log('  Entered:', enteredStake);
      console.log('  Wallet:', walletStakeAddress);

      if (walletStakeAddress.toLowerCase() !== enteredStake.toLowerCase()) {
        console.error('[🔐VERIFY] ❌ MISMATCH - wallet does not match entered stake address');
        setWalletVerificationError(`The wallet you connected doesn't match the stake address you entered. Please connect the wallet for ${corporationName || 'your corporation'}.`);
        setIsConnectingWallet(false);
        return;
      }

      console.log('[🔐CLAIM-VERIFY] ✅ MATCH - addresses match, starting backend verification...');
      setIsConnectingWallet(false);
      setBackendVerificationStatus('generating_nonce');

      try {
        // ============================================
        // STEP 1: Generate nonce from backend
        // ============================================
        console.log('[🔐NONCE] Requesting nonce from backend...');
        const nonceResponse = await fetch('/api/wallet/generate-nonce', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stakeAddress: walletStakeAddress,
            walletName: wallet.name.toLowerCase()
          })
        });

        if (!nonceResponse.ok) {
          const errorData = await nonceResponse.json().catch(() => ({}));
          console.error('[🔐NONCE] ❌ Backend nonce generation failed:', errorData);

          // Handle specific error cases
          if (nonceResponse.status === 429) {
            throw new Error('Too many verification attempts. Please wait a few minutes and try again.');
          }
          throw new Error(errorData.error || 'Failed to generate verification challenge');
        }

        const { nonce, message } = await nonceResponse.json();
        console.log('[🔐NONCE] ✅ Received nonce:', nonce?.substring(0, 20) + '...');

        setVerificationNonce(nonce);
        setVerificationMessage(message);

        // ============================================
        // STEP 2: Request user signature on backend message
        // ============================================
        setBackendVerificationStatus('awaiting_signature');
        setIsRequestingSignature(true);

        // Convert backend message to hex (CIP-30 requires hex-encoded message)
        const messageHex = Array.from(new TextEncoder().encode(message))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // Get address for signing (use first used address)
        const usedAddresses = await api.getUsedAddresses();
        const signingAddress = usedAddresses[0];

        if (!signingAddress) {
          throw new Error('No signing address available. Please ensure your wallet has been used.');
        }

        console.log('[🔐SIG] Requesting user signature on backend message...');
        const signatureResult = await api.signData(signingAddress, messageHex);

        console.log('[🔐SIG] ✅ Signature received from wallet');
        setIsRequestingSignature(false);

        // ============================================
        // STEP 3: Send signature to backend for verification
        // ============================================
        setBackendVerificationStatus('verifying');
        console.log('[🔐BACKEND] Sending signature to backend for cryptographic verification...');

        const verifyResponse = await fetch('/api/wallet/verify-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stakeAddress: walletStakeAddress,
            nonce,
            signature: signatureResult.signature || signatureResult,
            key: signatureResult.key || undefined,
            walletName: wallet.name.toLowerCase()
          })
        });

        const verifyResult = await verifyResponse.json();
        console.log('[🔐BACKEND] Verification result:', verifyResult);

        // ============================================
        // STEP 4: Only proceed if backend confirms with FULL cryptographic verification
        // ============================================
        // SECURITY: For NFT claims, we require full Ed25519 verification
        // Reject if warning indicates simplified/relaxed verification was used
        if (verifyResult.warning) {
          console.warn('[🔐CLAIM-VERIFY] ⚠️ WEAK VERIFICATION WARNING:', verifyResult.warning);
          console.error('[🔐CLAIM-VERIFY] ❌ Rejecting weak verification for NFT claim security');
          setBackendVerificationStatus('failed');
          setWalletVerificationError('Your wallet\'s signature could not be fully verified. Please try a different wallet (Eternl, Nami, or Flint recommended).');
          return;
        }

        if (verifyResult.success && verifyResult.verified) {
          console.log('[🔐CLAIM-VERIFY] ✅ BACKEND VERIFIED (full cryptographic verification) - proceeding to reservation');
          setBackendVerificationStatus('success');

          // Clear verification state
          setVerificationNonce(null);
          setVerificationMessage(null);

          // Proceed to create reservation (wallet ownership now proven)
          // The reservation will be tied to this verified wallet
          setState('creating');
        } else {
          console.error('[🔐CLAIM-VERIFY] ❌ BACKEND REJECTED:', verifyResult.error);
          setBackendVerificationStatus('failed');

          // Provide user-friendly error message
          let errorMsg = 'Signature verification failed. Please try again.';
          if (verifyResult.error?.includes('rate limit') || verifyResult.error?.includes('Too many')) {
            errorMsg = 'Too many verification attempts. Please wait a few minutes and try again.';
          } else if (verifyResult.error?.includes('expired')) {
            errorMsg = 'Verification challenge expired. Please try again.';
          } else if (verifyResult.error?.includes('locked')) {
            errorMsg = 'Account temporarily locked due to failed attempts. Please wait an hour.';
          }

          setWalletVerificationError(errorMsg);
        }

      } catch (signError: any) {
        console.error('[🔐CLAIM-VERIFY] Verification failed:', signError);
        setIsRequestingSignature(false);
        setBackendVerificationStatus('failed');

        // Handle user rejection vs error
        const errorMsg = signError.message?.toLowerCase() || '';
        if (errorMsg.includes('declined') ||
            errorMsg.includes('rejected') ||
            errorMsg.includes('cancel') ||
            errorMsg.includes('user') ||
            errorMsg.includes('denied')) {
          setWalletVerificationError('Signature request was declined. Please sign to verify wallet ownership.');
        } else if (errorMsg.includes('not supported') || errorMsg.includes('signdata')) {
          setWalletVerificationError('Your wallet doesn\'t support message signing. Please try a different wallet.');
        } else if (errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
          setWalletVerificationError('Too many verification attempts. Please wait a few minutes and try again.');
        } else {
          setWalletVerificationError(signError.message || 'Verification failed. Please try again.');
        }
      }

    } catch (error: any) {
      console.error('[🔐VERIFY] Error:', error);
      setWalletVerificationError(error.message || 'Failed to connect wallet');
      setIsConnectingWallet(false);
      setIsRequestingSignature(false);
    }
  };

  // Copy resume URL to clipboard (preserves session state for mobile wallet browser)
  // Compatible with: iOS Safari 13.4+, Chrome 66+, Firefox 63+, Samsung Internet 12+
  // Fallback for older browsers using execCommand
  const copyLinkToClipboard = async () => {
    // Validate we have all required data before building URL
    if (!reservationId || !effectiveWalletAddress || !activeCampaignId) {
      console.error('[🔐RESUME] Cannot copy link - missing required data');
      setLinkCopyFailed(true);
      setTimeout(() => setLinkCopyFailed(false), 3000);
      return;
    }

    // Build resume URL with session state so mobile users don't lose progress
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      claimResume: 'true',
      rid: reservationId,
      addr: effectiveWalletAddress,
      cid: activeCampaignId,
    });
    const resumeUrl = `${baseUrl}?${params.toString()}`;

    try {
      // Try modern Clipboard API first (requires HTTPS or localhost)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(resumeUrl);
        console.log('[🔐RESUME] Mobile resume link copied via Clipboard API');
      } else {
        // Fallback for older browsers or HTTP contexts
        // Create temporary textarea, copy, then remove
        const textArea = document.createElement('textarea');
        textArea.value = resumeUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error('execCommand copy failed');
        }
        console.log('[🔐RESUME] Mobile resume link copied via execCommand fallback');
      }

      // Show "Copied!" feedback
      setLinkCopied(true);
      setLinkCopyFailed(false);
      setTimeout(() => setLinkCopied(false), 2500);

    } catch (err) {
      console.error('[🔐RESUME] Failed to copy link:', err);
      // Show error feedback to user
      setLinkCopyFailed(true);
      setLinkCopied(false);
      setTimeout(() => setLinkCopyFailed(false), 3000);
    }
  };

  // Monitor payment window closure
  useEffect(() => {
    if (!paymentWindow || state !== 'payment') return;

    const checkInterval = setInterval(async () => {
      if (paymentWindow.closed && reservationId) {
        clearInterval(checkInterval);
        console.log('[PAY] Payment window closed - showing options immediately');
        await markPaymentWindowClosed({ reservationId });
        // Go directly to payment_window_closed state without auto-verification
        // User can choose to verify payment manually via "I paid - check again" button
        setState('payment_window_closed');
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [paymentWindow, state, reservationId, markPaymentWindowClosed]);

  // When payment window closes, verify payment for a few seconds before showing manual options
  useEffect(() => {
    if (state !== 'payment_window_closed' || !isVerifyingClosedWindowPayment) return;

    console.log('[PAY] Starting closed-window payment verification (8 second timeout)');

    // Give the payment 8 seconds to be detected, then show manual options
    const timeout = setTimeout(() => {
      console.log('[PAY] Payment verification timeout - showing manual options');
      setIsVerifyingClosedWindowPayment(false);
    }, 8000);

    return () => clearTimeout(timeout);
  }, [state, isVerifyingClosedWindowPayment]);

  // Force re-render for countdown timer
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(tick => tick + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Check for payment completion (works during payment, processing, AND after window closes)
  // Now uses reservation-specific check to prevent false positives from previous claims
  // Active polling during 'payment' state allows auto-detection without closing NMKR window
  useEffect(() => {
    if ((state !== 'payment' && state !== 'processing' && state !== 'payment_window_closed') || !reservationPaymentStatus) return;

    // Debug logging to help track payment detection
    console.log('[🔍PAYMENT-CHECK] State:', state, 'Status:', {
      isPaid: reservationPaymentStatus.isPaid,
      hasClaim: !!reservationPaymentStatus.claim,
      nftStatus: reservationPaymentStatus.nftStatus,
    });

    if (reservationPaymentStatus.isPaid && reservationPaymentStatus.claim) {
      console.log('[VERIFY] ✅ THIS RESERVATION was paid! Claim:', reservationPaymentStatus.claim);
      // Close the payment window if still open
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
      setState('success');
    }
  }, [state, reservationPaymentStatus, paymentWindow]);

  // Auto-release when timer expires
  useEffect(() => {
    if (!activeReservation || state === 'success' || state === 'error' || state === 'timeout') return;
    if (hasInitiatedTimeoutRelease.current) return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const isExpired = activeReservation.expiresAt && now >= activeReservation.expiresAt;

      if (isExpired && !hasInitiatedTimeoutRelease.current) {
        const shouldAutoRelease = (state === 'reserved' || state === 'payment');

        console.log('[TIMER] Timer expired!', { shouldAutoRelease, state });

        if (shouldAutoRelease && reservationId) {
          console.log('[TIMER] Initiating instant timeout release');
          hasInitiatedTimeoutRelease.current = true;
          clearInterval(intervalId);

          if (paymentWindow && !paymentWindow.closed) {
            console.log('[AUTO-RELEASE] Closing payment window due to timeout');
            paymentWindow.close();
          }

          setState('timeout');

          releaseReservation({ reservationId, reason: 'expired' })
            .then(() => console.log('[TIMER] Release successful'))
            .catch((err) => console.error('[TIMER] Release failed:', err));
        }
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [activeReservation, state, reservationId, releaseReservation, paymentWindow]);

  // Close payment window on unmount
  useEffect(() => {
    return () => {
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
    };
  }, [paymentWindow]);

  const attemptCancel = () => {
    // Terminal states - safe to close without warning
    if (state === 'success' || state === 'error' || state === 'timeout' || state === 'no_campaign') {
      onClose();
      return;
    }
    // Early states before user has committed - safe to close without warning
    if (state === 'loading_campaign' || state === 'address_entry' || state === 'checking_eligibility' || state === 'ineligible' || state === 'already_claimed') {
      onClose();
      return;
    }
    // All other states (user has invested effort) - show confirmation warning
    // This includes: corporation_verified, creating, reserved, wallet_verification, payment, processing, payment_window_closed
    setShowCancelConfirmation(true);
  };

  const handleConfirmCancel = async () => {
    setShowCancelConfirmation(false);
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close();
    }
    if (reservationId) {
      console.log('[RESERVE] User cancelled reservation');
      await releaseReservation({ reservationId, reason: 'cancelled' });
    }
    onClose();
  };

  const handleCancelCancel = () => {
    setShowCancelConfirmation(false);
  };

  if (!mounted) return null;

  const renderContent = () => {
    switch (state) {
      case 'loading_campaign':
        return (
          <div className="text-center py-8 sm:py-12">
            <div className="mb-4 sm:mb-6">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-3">
              Loading Campaign...
            </h3>
          </div>
        );

      case 'no_campaign':
        return (
          <div className="text-center py-6 sm:py-8">
            <div className="mb-4 sm:mb-6">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-3">
              No Active Campaigns
            </h3>
            <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-4">
              There are no NFT campaigns available at this time.
            </p>
            <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed">
              Check back later for new opportunities!
            </p>
          </div>
        );

      case 'address_entry':
        return (
          <div className="text-center">
            <div className="mb-6 sm:mb-8 pt-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-3 whitespace-nowrap">
                Commemorative NFT
              </h2>
              <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed">
                Please enter the stake address of the wallet you used to create your corporation.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddressSubmit(); }} className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="stake-address" className="sr-only">Stake Address</label>
                <input
                  id="stake-address"
                  type="text"
                  value={manualAddress}
                  onChange={(e) => {
                    setManualAddress(e.target.value);
                    setAddressError('');
                  }}
                  placeholder="stake1..."
                  className={`w-full px-4 py-3 sm:py-4 text-base sm:text-lg bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-white/10 transition-all touch-manipulation ${
                    addressError ? 'border-red-500/50 focus:border-red-500/70' : 'border-white/10 focus:border-yellow-500/50'
                  }`}
                  style={{ minHeight: '48px', WebkitTapHighlightColor: 'transparent' }}
                  autoComplete="off"
                  autoFocus
                />
                {addressError && (
                  <p className="mt-3 text-sm sm:text-base text-red-400 font-semibold tracking-wide leading-relaxed">
                    {addressError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 touch-manipulation shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
                style={{ minHeight: '48px', WebkitTapHighlightColor: 'transparent', fontFamily: "'Inter', 'Arial', sans-serif" }}
              >
                Continue
              </button>
            </form>
          </div>
        );

      case 'checking_eligibility':
        return (
          <div className="text-center py-8 sm:py-12">
            <div className="mb-4 sm:mb-6">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-3">
              Checking Eligibility...
            </h3>
            <p className="text-sm sm:text-base text-white/60 font-light">
              Verifying your participation
            </p>
          </div>
        );

      case 'corporation_verified':
        return (
          <div className="text-center pt-2 sm:pt-4 pb-2">
            {/* Checkmark icon */}
            <div className="mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-400/50 flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h3 className="text-lg sm:text-xl text-white/60 font-light tracking-wide mb-4">
              Corporation Verified
            </h3>

            {/* Big glowing blue corporation name */}
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6"
              style={{
                fontFamily: "'Inter', 'Arial', sans-serif",
                color: '#22d3ee',
                textShadow: '0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.6), 0 0 60px rgba(34, 211, 238, 0.4)',
                letterSpacing: '-0.02em',
              }}
            >
              {corporationName || 'Your Corporation'}
            </h2>

            <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-8">
              Verify your wallet to reserve your commemorative NFT.
            </p>

            <button
              onClick={() => {
                // Detect available wallets before transitioning to verification
                detectWalletsAndMobile();
                setState('wallet_verification');
              }}
              className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold tracking-wider text-black bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-xl hover:from-cyan-300 hover:to-cyan-400 transition-all duration-300 touch-manipulation shadow-lg shadow-cyan-500/30 active:scale-[0.98]"
              style={{ minHeight: '48px', WebkitTapHighlightColor: 'transparent', fontFamily: "'Inter', 'Arial', sans-serif" }}
            >
              Continue to Claim
            </button>

            <button
              onClick={onClose}
              className="w-full mt-3 py-2 px-4 text-sm font-medium transition-all duration-200 hover:text-red-400"
              style={{ fontFamily: 'Inter, sans-serif', color: '#bae6fd', background: 'transparent', border: 'none', letterSpacing: '0.01em', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        );

      case 'ineligible':
        if (storedEligibility?.hasActiveReservation) {
          return (
            <div className="text-center py-6 sm:py-8">
              <div className="mb-4 sm:mb-6">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-3">
                Reservation In Progress
              </h3>
              <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-4">
                You already have an NFT reservation in progress.
              </p>
              <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-6">
                Please complete your payment in the NMKR window. If you cannot find it, please wait 20 minutes and try again.
              </p>
              <button
                onClick={onClose}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          );
        }

        return (
          <>
            <div className="text-center mb-6 sm:mb-8">
              <div className="mb-3">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-wide mb-3">
                Not Eligible
              </h2>
              <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed">
                {storedEligibility?.reason || 'You are not eligible to claim from this campaign.'}
              </p>
              <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mt-3">
                No worries - there will be more opportunities in the future!
              </p>

              {/* Discord support link */}
              <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-sm text-white/80 font-medium tracking-wide leading-relaxed text-center">
                    Think this is an error? Create a{' '}
                    <a
                      href="https://discord.com/channels/938648161810006119/938658145276919838"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#5865F2] hover:text-[#7289DA] underline underline-offset-2 transition-colors"
                    >
                      ticket
                    </a>
                    {' '}on Discord.
                </p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent('openLightbox', { detail: { lightboxId: 'beta-signup' } }));
                }}
                className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 touch-manipulation shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
                style={{ minHeight: '48px', WebkitTapHighlightColor: 'transparent', fontFamily: "'Inter', 'Arial', sans-serif" }}
              >
                Join Beta
              </button>
            </div>
          </>
        );

      case 'already_claimed':
        const claimedNFT = storedEligibility?.claimedNFTDetails;
        const mintDate = claimedNFT?.soldAt ? new Date(claimedNFT.soldAt) : null;
        const formattedDate = mintDate ? mintDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : null;
        const formattedTime = mintDate ? mintDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) : null;

        return (
          <div className="text-center py-4 sm:py-6">
            <div className="mb-4 sm:mb-6">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-4">
              Already Claimed
            </h3>

            {claimedNFT && (
              <div className="mb-6">
                {/* NFT Image - animated if it's a video/gif */}
                <div className="relative w-full max-w-[280px] mx-auto mb-4 rounded-2xl overflow-hidden bg-black/50 backdrop-blur-md border border-yellow-400/30 shadow-2xl shadow-yellow-500/20">
                  <img
                    src={claimedNFT.imageUrl?.startsWith('/') ? getMediaUrl(claimedNFT.imageUrl) : (claimedNFT.imageUrl || getMediaUrl("/random-images/Lab%20Rat.jpg"))}
                    alt={claimedNFT.name || "Your NFT"}
                    className="w-full h-auto"
                    onError={(e) => { e.currentTarget.src = getMediaUrl('/logo-big.png'); }}
                  />
                </div>

                {/* NFT Details Card */}
                <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-400/20 rounded-2xl backdrop-blur-md">
                  <h4 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Inter, sans-serif', color: '#fef3c7', letterSpacing: '-0.02em' }}>
                    {claimedNFT.name}
                  </h4>
                  {mintDate && (
                    <div className="text-sm text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span>Minted on </span>
                      <span className="text-yellow-300/80">{formattedDate}</span>
                      <span> at </span>
                      <span className="text-yellow-300/80">{formattedTime}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-4">
              Thank you for being part of the community!
            </p>
            <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-6">
              Stay tuned for future campaigns!
            </p>

            <button
              onClick={onClose}
              className="px-8 py-3 text-base font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 shadow-lg shadow-yellow-500/20"
              style={{ fontFamily: "'Inter', 'Arial', sans-serif" }}
            >
              Close
            </button>
          </div>
        );

      case 'creating':
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-yellow-400 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Reserving NFT...
              </h2>
              <p className="text-gray-400 mt-2">Finding next available NFT</p>
            </div>
          </div>
        );

      case 'reserved':
        if (!activeReservation) {
          console.log('[🔨RESERVE] Rendering "reserved" state but activeReservation is undefined - showing loading spinner');
          return (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {resumeValidating ? 'Restoring Your Session...' : 'Loading Reservation...'}
                </h2>
                <p className="text-white/60 text-sm">
                  {resumeValidating
                    ? 'Verifying your reservation is still valid'
                    : 'Please wait a moment'}
                </p>
              </div>
            </div>
          );
        }

        console.log('[🔨RESERVE] Rendering "reserved" state with activeReservation:', activeReservation.nftNumber);

        return (
          <div className="text-center">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Inter, sans-serif', color: '#e0f2fe', letterSpacing: '-0.01em' }}>
                Your NFT Reserved
              </h2>

              <div className="relative w-full max-w-[300px] mx-auto mb-4 rounded-2xl overflow-hidden bg-black/50 backdrop-blur-md border border-cyan-400/30 shadow-2xl shadow-cyan-500/20">
                <img
                  src={activeReservation.nft?.imageUrl?.startsWith('/') ? getMediaUrl(activeReservation.nft.imageUrl) : (activeReservation.nft?.imageUrl || getMediaUrl("/random-images/Lab%20Rat.jpg"))}
                  alt={activeReservation.nft?.name || "NFT"}
                  className="w-full h-auto"
                  onError={(e) => { e.currentTarget.src = getMediaUrl('/logo-big.png'); }}
                />
              </div>

              <div className="mb-4 p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-2xl backdrop-blur-md">
                <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Inter, sans-serif', color: '#e0f2fe', letterSpacing: '-0.02em' }}>
                  {activeReservation.nft?.name || "NFT"}
                </h3>
                <p style={{ fontFamily: 'Inter, sans-serif', color: '#bae6fd', fontSize: '0.875rem', lineHeight: '1.5', fontWeight: 400 }}>
                  You have reserved <span style={{ color: '#22d3ee', fontWeight: 600, textShadow: '0 0 10px rgba(34, 211, 238, 0.6), 0 0 20px rgba(34, 211, 238, 0.4)' }}>edition number {activeReservation.nftNumber}</span>. Click below to open the payment window and complete your purchase.
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', color: '#bae6fd', fontSize: '0.875rem', lineHeight: '1.5', fontWeight: 400, marginTop: '0.75rem' }}>
                  You have 20 minutes to complete this transaction. The fee for this commemorative token is <span style={{ color: '#22d3ee', fontWeight: 600 }}>10 ADA</span>.
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenPayment}
              className="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 hover:brightness-110"
              style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)', color: '#ffffff', boxShadow: '0 6px 24px rgba(6, 182, 212, 0.4)', border: 'none', letterSpacing: '0.02em' }}
            >
              Open Payment Window
            </button>

            <button
              onClick={attemptCancel}
              className="w-full mt-3 py-2 px-4 text-sm font-medium transition-all duration-200 hover:text-red-400"
              style={{ fontFamily: 'Inter, sans-serif', color: '#bae6fd', background: 'transparent', border: 'none', letterSpacing: '0.01em', cursor: 'pointer' }}
            >
              Cancel
            </button>

            {errorMessage && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-xl">
                <p className="text-sm text-yellow-300">{errorMessage}</p>
              </div>
            )}
          </div>
        );

      case 'wallet_verification':
        // Show connecting spinner if wallet connection in progress
        if (isConnectingWallet) {
          return (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-cyan-400 mb-2">Connecting Wallet...</h2>
                <p className="text-white/60 text-sm">Please approve the connection in your wallet</p>
              </div>
            </div>
          );
        }

        // Show nonce generation spinner
        if (backendVerificationStatus === 'generating_nonce') {
          return (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-cyan-400 mb-2">Generating Challenge...</h2>
                <p className="text-white/60 text-sm">Preparing secure verification</p>
              </div>
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <p className="text-sm text-cyan-300">
                  Creating cryptographic challenge for wallet verification
                </p>
              </div>
            </div>
          );
        }

        // Show signing spinner if requesting signature
        if (isRequestingSignature || backendVerificationStatus === 'awaiting_signature') {
          return (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-cyan-400 mb-2">Sign to Verify</h2>
                <p className="text-white/60 text-sm">Please sign the message in your wallet to prove ownership</p>
              </div>
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <p className="text-sm text-cyan-300">
                  Check your wallet extension for a signature request
                </p>
              </div>
            </div>
          );
        }

        // Show backend verification spinner
        if (backendVerificationStatus === 'verifying') {
          return (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-green-400 mb-2">Verifying Signature...</h2>
                <p className="text-white/60 text-sm">Cryptographically verifying wallet ownership</p>
              </div>
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <p className="text-sm text-green-300">
                  This ensures only the rightful owner can claim this NFT
                </p>
              </div>
            </div>
          );
        }

        // Mobile browser - no window.cardano available
        if (isMobileBrowser) {
          // Show loading while creating reservation for mobile
          if (isCreatingMobileReservation || !reservationId) {
            return (
              <div className="text-center py-6">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-400/50 flex items-center justify-center mb-4 animate-pulse">
                    <svg className="w-8 h-8 text-cyan-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Preparing Your Reservation...</h2>
                  <p className="text-sm text-white/60">Reserving your NFT for mobile verification</p>
                </div>
              </div>
            );
          }

          return (
            <div className="text-center py-6">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-400/50 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-4">Wallet Verification Required</h2>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-6">
                <p className="text-sm text-white/70 leading-relaxed mb-4">
                  Copy the link below and paste it into your mobile wallet's built-in browser.
                  <span className="block mt-2 text-cyan-400">Your progress will be saved - you'll continue right where you left off.</span>
                </p>
                <p className="text-sm text-white/70 leading-relaxed">
                  Note: this must be the wallet you used to create your Mek Tycoon corporation:{' '}
                  <span
                    className="font-bold"
                    style={{
                      color: '#22d3ee',
                      textShadow: '0 0 10px rgba(34, 211, 238, 0.6)',
                    }}
                  >
                    {corporationName || 'Your Corporation'}
                  </span>
                </p>
              </div>

              <button
                onClick={copyLinkToClipboard}
                className={`w-full py-3 px-6 text-base font-semibold tracking-wider rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                  linkCopied
                    ? 'bg-green-500 text-white shadow-green-500/30'
                    : linkCopyFailed
                    ? 'bg-red-500 text-white shadow-red-500/30'
                    : 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-black hover:from-cyan-300 hover:to-cyan-400 shadow-cyan-500/30'
                }`}
                style={{ fontFamily: "'Inter', 'Arial', sans-serif" }}
              >
                {linkCopied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied! Now paste in your wallet
                  </>
                ) : linkCopyFailed ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Copy failed - tap to retry
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>

              <button
                onClick={() => setState('reserved')}
                className="w-full mt-3 py-2 px-4 text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                Go Back
              </button>
            </div>
          );
        }

        // Desktop/WebView - show wallet picker
        return (
          <div className="text-center pt-4 pb-0">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-400/50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verify Wallet Ownership</h2>
              <p className="text-sm text-white/60 leading-relaxed">
                Connect the wallet for{' '}
                <span
                  className="font-bold"
                  style={{
                    color: '#22d3ee',
                    textShadow: '0 0 10px rgba(34, 211, 238, 0.6)',
                  }}
                >
                  {corporationName || 'your corporation'}
                </span>
              </p>
            </div>

            {/* Error message */}
            {walletVerificationError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-400">{walletVerificationError}</p>
              </div>
            )}

            {/* Wallet buttons */}
            {availableWallets.length > 0 ? (
              <div className={availableWallets.length === 1 ? "flex justify-center mb-2" : "grid grid-cols-2 gap-3 mb-2"}>
                {availableWallets.map(wallet => (
                  <button
                    key={wallet.name}
                    onClick={() => connectAndVerifyWallet(wallet)}
                    className={`group relative bg-black/30 border border-cyan-500/30 text-white px-4 py-3 rounded-xl transition-all hover:bg-cyan-500/10 hover:border-cyan-500/50 flex items-center justify-center overflow-hidden ${availableWallets.length === 1 ? 'min-w-[180px]' : ''}`}
                  >
                    {/* Honeycomb hover effect */}
                    <div
                      className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-[0.15] z-[1]"
                      style={{
                        backgroundImage: `url('${getMediaUrl('/random-images/honey-png-big.webp')}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '12px'
                      }}
                    />
                    {/* Icon positioned absolutely so it doesn't affect text centering */}
                    <img
                      src={wallet.icon}
                      alt=""
                      className="absolute left-3 w-5 h-5 rounded z-[2]"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span className="font-medium relative z-[2]">{wallet.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-sm text-yellow-400">
                  No Cardano wallets detected. Please install a wallet extension (Nami, Eternl, Flint, etc.)
                </p>
              </div>
            )}

            <button
              onClick={() => setState('corporation_verified')}
              className="w-full mt-4 py-2 px-4 text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Go Back
            </button>
          </div>
        );

      case 'payment':
        return (
          <div className="text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Complete Your Purchase
              </h2>
              <p className="text-gray-400 mb-2">Complete the payment in the NMKR window</p>
              <p className="text-white font-semibold text-sm">Close the NMKR window when your payment is complete.</p>
            </div>
            <button
              onClick={attemptCancel}
              className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200 border border-gray-600 hover:border-red-500/50 hover:bg-red-500/10"
              style={{ fontFamily: 'Inter, sans-serif', background: 'rgba(0, 0, 0, 0.3)', color: '#d1d5db' }}
            >
              Cancel Transaction
            </button>
          </div>
        );

      case 'payment_window_closed':
        // Show verification spinner if actively checking payment
        if (isVerifyingClosedWindowPayment) {
          return (
            <div className="text-center py-6">
              <div className="mb-6">
                <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-white mb-3">Verifying Payment...</h2>
                <p className="text-white/60 text-sm leading-relaxed">
                  Checking if your payment was successful
                </p>
              </div>

              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="relative">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-cyan-300 text-sm font-medium">Actively checking blockchain</span>
                </div>
                <p className="text-white/50 text-xs">
                  This usually takes just a few seconds...
                </p>
              </div>

              <button
                onClick={() => {
                  setIsVerifyingClosedWindowPayment(false);
                }}
                className="w-full py-2 px-4 text-sm font-medium text-white/50 hover:text-white/70 transition-colors"
              >
                Cancel verification
              </button>
            </div>
          );
        }

        // Show options when payment window is closed - friendly tone assuming they may have paid
        return (
          <div className="text-center py-6">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-400/50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Did you complete your payment?</h2>
              <p className="text-white/60 text-sm leading-relaxed">
                Click refresh below to check if your payment was received.
              </p>
            </div>

            <div className="space-y-3">
              {/* Primary action: Check if payment was made */}
              <button
                onClick={() => {
                  setIsVerifyingClosedWindowPayment(true);
                  // Will auto-clear after 8 seconds if no payment detected
                }}
                className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200"
                style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)', color: '#ffffff', boxShadow: '0 6px 24px rgba(6, 182, 212, 0.4)', border: 'none' }}
              >
                Refresh
              </button>

              {/* Secondary action: Go back to reservation screen to re-open payment */}
              <button
                onClick={() => setState('reserved')}
                className="w-full py-2 px-4 text-sm font-medium text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                Re-open Payment Window
              </button>

              {/* Tertiary action: Cancel the reservation entirely */}
              <button
                onClick={attemptCancel}
                className="w-full py-2 px-4 text-sm font-medium text-white/40 hover:text-white/60 transition-colors"
              >
                Cancel Reservation
              </button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center">
            {/* Space Age style header */}
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-3">
              Checking Payment...
            </h2>
            <p className="text-white/50 text-sm sm:text-base font-light tracking-wide mb-6">
              Waiting for blockchain confirmation
            </p>

            {/* Subtle pulsing indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="relative">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <div className="absolute inset-0 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-white/70 font-light tracking-wide">Actively checking for payment</span>
            </div>

            {/* Glass-style info box */}
            <div
              className="p-4 rounded-xl mb-8"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <p className="text-white/60 text-xs sm:text-sm font-light tracking-wide">
                This may take 1-2 minutes. Please don't close this window.
              </p>
            </div>

            {/* Glass-style cancel button */}
            <button
              onClick={attemptCancel}
              className="w-full px-8 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/10 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              Cancel Transaction
            </button>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="h-16 w-16 bg-green-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">&#10003;</span>
              </div>
              <h2 className="text-2xl font-bold text-green-400 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                NFT Claimed!
              </h2>
              <p className="text-gray-400">Your NFT has been successfully minted</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-bold uppercase tracking-wider"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              Close
            </button>
          </div>
        );

      case 'timeout':
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="h-16 w-16 bg-yellow-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Reservation Timed Out
              </h2>
              <p className="text-gray-300 mb-4 max-w-md mx-auto">
                We are sorry, the reservation has timed out. Please try again when you are ready.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors font-bold uppercase tracking-wider"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              Close
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="h-16 w-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">&#10007;</span>
              </div>
              <h2 className="text-2xl font-bold text-red-400 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Error
              </h2>
              <p className="text-gray-400 mb-4">{errorMessage}</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-bold uppercase tracking-wider"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              Close
            </button>
          </div>
        );
    }
  };

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto p-4"
        onClick={() => {
          // Always use attemptCancel - it handles showing warnings for all states appropriately
          attemptCancel();
        }}
      >
        <div
          className="fixed inset-0 bg-black/60"
          style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        />

        <div
          className={`relative w-full ${state === 'reserved' ? 'max-w-2xl' : 'max-w-md'} overflow-hidden rounded-2xl border border-white/10 transition-all duration-300`}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={attemptCancel}
            className="absolute top-4 right-4 text-white/50 hover:text-white/80 transition-colors z-10 touch-manipulation"
            style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent' }}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-5 md:px-10 md:pt-10 md:pb-6">
            {renderContent()}
          </div>
        </div>
      </div>

      {showCancelConfirmation && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={(e) => { e.stopPropagation(); handleCancelCancel(); }}
        >
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md" />
          <div
            className="relative w-full max-w-md bg-black/60 backdrop-blur-lg border-2 border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl p-6"
            style={{ boxShadow: '0 0 40px rgba(6, 182, 212, 0.3), 0 0 80px rgba(6, 182, 212, 0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-center mb-3" style={{ fontFamily: 'Inter, sans-serif', color: '#e0f2fe' }}>
              {reservationId ? 'Cancel Reservation?' : 'Cancel Claim?'}
            </h3>

            <p className="text-center mb-6" style={{ fontFamily: 'Inter, sans-serif', color: '#bae6fd', fontSize: '0.95rem', lineHeight: '1.6' }}>
              {reservationId ? (
                <>Are you sure you want to cancel? Doing so will not guarantee the <span style={{ color: '#22d3ee', fontWeight: 600, textShadow: '0 0 12px rgba(34, 211, 238, 0.8), 0 0 24px rgba(34, 211, 238, 0.5)' }}>same edition number</span>.</>
              ) : (
                <>Are you sure you want to cancel? You will lose your progress and have to start over.</>
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelCancel}
                className="flex-1 py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200"
                style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)', color: '#ffffff', boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)', border: 'none' }}
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200 border border-white/20 hover:bg-white/5"
                style={{ fontFamily: 'Inter, sans-serif', background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(modalContent, document.body);
}
