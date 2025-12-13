'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ensureBech32StakeAddress } from '@/lib/cardanoAddressConverter';
import { getMediaUrl } from '@/lib/media-url';
import { sturgeonClient, sturgeonHttpClient } from '@/lib/sturgeonClient';
import CubeSpinner from '@/components/loaders/CubeSpinner';

interface NMKRPayLightboxProps {
  walletAddress: string | null;
  onClose: () => void;
  // Optional: If not provided, auto-selects first active campaign with available NFTs
  campaignId?: Id<"commemorativeCampaigns">;
  // Preview mode props - for admin lightbox preview
  previewMode?: boolean;
  previewState?: LightboxState;
  previewCorporationName?: string;
  previewErrorMessage?: string;
}

type LightboxState = 'loading_campaign' | 'no_campaign' | 'address_entry' | 'checking_eligibility' | 'ineligible' | 'already_claimed' | 'corporation_verified' | 'creating' | 'reserved' | 'wallet_verification' | 'payment' | 'payment_window_closed' | 'processing' | 'success' | 'error' | 'timeout' | 'cancel_confirmation';

// Export types for preview mode
export type { LightboxState as NMKRPayState };

// Mock data for preview mode
const MOCK_WALLETS_NMKR = [
  { name: 'Eternl', icon: '/wallet-icons/eternl.png', api: {} },
  { name: 'Nami', icon: '/wallet-icons/nami.png', api: {} },
  { name: 'Flint', icon: '/wallet-icons/flint.png', api: {} },
  { name: 'Vespr', icon: '/wallet-icons/vespr.png', api: {} },
];

const MOCK_NFT_DETAILS = {
  name: 'Lab Rat #42',
  editionNumber: 42,
  imageUrl: '/random-images/Lab%20Rat.jpg',
  soldAt: Date.now() - 86400000, // 1 day ago
};

const MOCK_ELIGIBILITY_INELIGIBLE = {
  hasActiveReservation: false,
  alreadyClaimed: false,
  eligible: false,
  reason: 'You need to have created a corporation during Phase I to be eligible for this campaign.',
};

const MOCK_ELIGIBILITY_ALREADY_CLAIMED = {
  hasActiveReservation: false,
  alreadyClaimed: true,
  eligible: false,
  claimedNFTDetails: MOCK_NFT_DETAILS,
};

const MOCK_RESERVATION = {
  _id: 'mock-reservation-id' as Id<"commemorativeNFTInventory">,
  nft: {
    name: 'Lab Rat #7',
    editionNumber: 7,
    paymentUrl: 'https://nmkr.io/pay/mock',
    imageUrl: '/random-images/Lab%20Rat.jpg',
  },
  expiresAt: Date.now() + 600000, // 10 minutes from now
};

export default function NMKRPayLightbox({
  walletAddress,
  onClose,
  campaignId: propCampaignId,
  previewMode = false,
  previewState,
  previewCorporationName = 'WrenCo Industries',
  previewErrorMessage = 'Something went wrong. Please try again.',
}: NMKRPayLightboxProps) {
  const [mounted, setMounted] = useState(false);
  // ALWAYS check eligibility when wallet is provided - never skip to 'creating'
  // In preview mode, use previewState directly
  const [state, setState] = useState<LightboxState>(
    previewMode && previewState ? previewState :
    (propCampaignId ? (walletAddress ? 'checking_eligibility' : 'address_entry') : 'loading_campaign')
  );
  const [errorMessage, setErrorMessage] = useState<string>(previewMode ? previewErrorMessage : '');
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [reservationId, setReservationId] = useState<Id<"commemorativeNFTInventory"> | null>(
    previewMode ? MOCK_RESERVATION._id : null
  );
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [manualAddress, setManualAddress] = useState<string>(previewMode ? 'stake1u8z4d32ythwc...' : '');
  const [addressError, setAddressError] = useState<string>('');
  const [storedEligibility, setStoredEligibility] = useState<{ hasActiveReservation?: boolean; alreadyClaimed?: boolean; eligible?: boolean; reason?: string; corporationName?: string; claimedNFTDetails?: { name: string; editionNumber: number; imageUrl?: string; soldAt?: number } } | null>(
    previewMode ? (previewState === 'ineligible' ? MOCK_ELIGIBILITY_INELIGIBLE :
      previewState === 'already_claimed' ? MOCK_ELIGIBILITY_ALREADY_CLAIMED : null) : null
  );
  const [activeCampaignId, setActiveCampaignId] = useState<Id<"commemorativeCampaigns"> | null>(propCampaignId || null);
  const [corporationName, setCorporationName] = useState<string | null>(previewMode ? previewCorporationName : null);

  // Wallet verification state - use mock wallets in preview mode
  const [availableWallets, setAvailableWallets] = useState<Array<{ name: string; icon: string; api: any }>>(
    previewMode ? MOCK_WALLETS_NMKR : []
  );
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

  // Countdown timer for reservation
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const effectiveWalletAddress = walletAddress || manualAddress;

  // Sync state when previewState changes in preview mode
  useEffect(() => {
    if (previewMode && previewState) {
      setState(previewState);
    }
  }, [previewMode, previewState]);

  // Countdown timer - previewExpiresAt initialized to 20 minutes for preview mode
  const [previewExpiresAt] = useState(() => Date.now() + 1200000);

  // ==========================================
  // DUAL-DATABASE FIX: Read NFT availability from PRODUCTION
  // ==========================================
  // On localhost with dual-database mode, the default Convex client points to Trout (dev).
  // NFT inventory/campaigns live in Sturgeon (production), so we need to query production
  // to show accurate availability. This prevents showing "available" for NFTs that are
  // actually sold in production (like Lab Rat #3 issue).
  //
  // Logic:
  // - If sturgeonHttpClient is available (dual-database mode on localhost), use it for reads
  // - If not (production site), use regular useQuery (which already points to production)
  // ==========================================

  // Determine if we should use production client for campaign queries
  // Skip production fetch if campaignId is already provided via props
  const shouldFetchProductionCampaigns = !!sturgeonHttpClient && !propCampaignId;

  // State for production campaigns (fetched via sturgeonHttpClient when available)
  const [productionCampaigns, setProductionCampaigns] = useState<any[] | null>(null);
  const [productionCampaignsLoading, setProductionCampaignsLoading] = useState(shouldFetchProductionCampaigns);
  const [productionCampaignsFailed, setProductionCampaignsFailed] = useState(false);

  // Fetch campaigns from production database when in dual-database mode
  useEffect(() => {
    // Skip if campaignId prop provided or no sturgeonHttpClient
    if (!shouldFetchProductionCampaigns) {
      setProductionCampaignsLoading(false);
      return;
    }

    // Track if effect is still active (for cleanup on unmount)
    let isActive = true;

    // Additional null check for TypeScript (already guaranteed by shouldFetchProductionCampaigns)
    if (!sturgeonHttpClient) return;

    console.log('[🎯NFT-PROD] Fetching campaigns from PRODUCTION database (Sturgeon)');
    setProductionCampaignsLoading(true);
    setProductionCampaignsFailed(false);

    // Use sturgeonHttpClient.query() directly for production reads
    sturgeonHttpClient.query(api.campaigns.getActiveCampaigns, {})
      .then((campaigns) => {
        if (!isActive) return; // Don't update state if unmounted
        console.log('[🎯NFT-PROD] Production campaigns fetched:', campaigns?.length || 0, 'campaigns');
        setProductionCampaigns(campaigns || []);
        setProductionCampaignsLoading(false);
      })
      .catch((error) => {
        if (!isActive) return; // Don't update state if unmounted
        console.error('[🎯NFT-PROD] Failed to fetch production campaigns, falling back to dev:', error);
        setProductionCampaignsLoading(false);
        setProductionCampaignsFailed(true); // Signal to use dev fallback
      });

    return () => { isActive = false; };
  }, [shouldFetchProductionCampaigns]);

  // Query for active campaigns from default client
  // Used when: (1) not in dual-database mode, OR (2) production fetch failed as fallback
  const devCampaigns = useQuery(
    api.campaigns.getActiveCampaigns,
    !propCampaignId && (!sturgeonHttpClient || productionCampaignsFailed) ? {} : "skip"
  );

  // Use production campaigns if available, otherwise fall back to dev
  // Priority: production success > dev fallback > undefined (loading)
  const activeCampaigns = (() => {
    // If not using production client, use dev directly
    if (!shouldFetchProductionCampaigns) return devCampaigns;
    // If production is still loading, return undefined
    if (productionCampaignsLoading) return undefined;
    // If production failed, use dev fallback
    if (productionCampaignsFailed) return devCampaigns;
    // Production succeeded, use production data
    return productionCampaigns;
  })();

  // Auto-select first active campaign with available NFTs
  // CRITICAL: Only run this effect ONCE on initial load, not on every campaign update
  const [hasInitializedCampaign, setHasInitializedCampaign] = useState(false);

  useEffect(() => {
    // Skip campaign selection in preview mode - use previewState directly
    if (previewMode) return;

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
  }, [activeCampaigns, propCampaignId, walletAddress, hasInitializedCampaign, isResumingFromMobile, previewMode]);

  // Campaign-aware mutations
  // CRITICAL FIX: Use sturgeonHttpClient.mutation() on localhost to ensure NFT reservations
  // go to PRODUCTION database. Without this, localhost would use Trout (dev) which
  // has stale inventory data and would assign already-sold NFTs.
  const fallbackCreateReservation = useMutation(api.commemorativeNFTReservationsCampaign.createCampaignReservation);
  const fallbackReleaseReservation = useMutation(api.commemorativeNFTReservationsCampaign.releaseCampaignReservation);
  const fallbackMarkPaymentWindowOpened = useMutation(api.commemorativeNFTReservationsCampaign.markPaymentWindowOpened);
  const fallbackMarkPaymentWindowClosed = useMutation(api.commemorativeNFTReservationsCampaign.markPaymentWindowClosed);

  // Wrapper functions that use sturgeonHttpClient when available (localhost), otherwise fallback (production)
  // IMPORTANT: Use sturgeonHttpClient (not sturgeonClient) for mutations because:
  // - sturgeonClient is ConvexReactClient which requires WebSocket connection
  // - sturgeonHttpClient is ConvexHttpClient which works with simple HTTP requests
  // - Using ConvexReactClient.mutation() outside provider context can hang indefinitely
  const createReservation = async (args: { campaignId: Id<"commemorativeCampaigns">; walletAddress: string }) => {
    if (sturgeonHttpClient) {
      console.log('[🎯NFT-PROD] Using sturgeonHttpClient for createReservation (localhost → production)');
      return await sturgeonHttpClient.mutation(api.commemorativeNFTReservationsCampaign.createCampaignReservation, args);
    }
    return await fallbackCreateReservation(args);
  };

  const releaseReservation = async (args: { reservationId: Id<"commemorativeNFTInventory"> | Id<"commemorativeNFTReservations">; reason?: "cancelled" | "expired" }) => {
    if (sturgeonHttpClient) {
      console.log('[🎯NFT-PROD] Using sturgeonHttpClient for releaseReservation (localhost → production)');
      return await sturgeonHttpClient.mutation(api.commemorativeNFTReservationsCampaign.releaseCampaignReservation, args);
    }
    return await fallbackReleaseReservation(args);
  };

  const markPaymentWindowOpened = async (args: { reservationId: Id<"commemorativeNFTInventory"> | Id<"commemorativeNFTReservations"> }) => {
    if (sturgeonHttpClient) {
      return await sturgeonHttpClient.mutation(api.commemorativeNFTReservationsCampaign.markPaymentWindowOpened, args);
    }
    return await fallbackMarkPaymentWindowOpened(args);
  };

  const markPaymentWindowClosed = async (args: { reservationId: Id<"commemorativeNFTInventory"> | Id<"commemorativeNFTReservations"> }) => {
    if (sturgeonHttpClient) {
      return await sturgeonHttpClient.mutation(api.commemorativeNFTReservationsCampaign.markPaymentWindowClosed, args);
    }
    return await fallbackMarkPaymentWindowClosed(args);
  };

  // Query active reservation (campaign-aware) - skip in preview mode
  // CRITICAL FIX: On localhost, use sturgeonHttpClient to query production since reservations are created there
  const fallbackActiveReservation = useQuery(
    api.commemorativeNFTReservationsCampaign.getActiveCampaignReservation,
    !sturgeonHttpClient && !previewMode && reservationId && effectiveWalletAddress && activeCampaignId
      ? { campaignId: activeCampaignId, walletAddress: effectiveWalletAddress }
      : "skip"
  );

  // State for production active reservation (when using sturgeonHttpClient)
  const [productionActiveReservation, setProductionActiveReservation] = useState<any>(null);

  // Fetch active reservation from production when sturgeonHttpClient is available
  useEffect(() => {
    if (!sturgeonHttpClient || previewMode || !reservationId || !effectiveWalletAddress || !activeCampaignId) {
      return;
    }

    let isActive = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const fetchReservation = async () => {
      try {
        if (!sturgeonHttpClient) return; // TypeScript guard
        const result = await sturgeonHttpClient.query(
          api.commemorativeNFTReservationsCampaign.getActiveCampaignReservation,
          { campaignId: activeCampaignId, walletAddress: effectiveWalletAddress }
        );
        if (isActive) {
          setProductionActiveReservation(result);
        }
      } catch (error) {
        console.error('[🎯NFT-PROD] Error fetching active reservation:', error);
      }
    };

    // Fetch immediately
    fetchReservation();

    // Poll every 2 seconds to keep data fresh (like useQuery would)
    pollInterval = setInterval(fetchReservation, 2000);

    return () => {
      isActive = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [reservationId, effectiveWalletAddress, activeCampaignId, previewMode]);

  // Use production reservation if available, otherwise fallback
  const activeReservation = sturgeonHttpClient ? productionActiveReservation : fallbackActiveReservation;

  // Debug logging for activeReservation query
  useEffect(() => {
    if (state === 'reserved') {
      console.log('[🔨RESERVE] State is "reserved", activeReservation query status:', {
        reservationId,
        effectiveWalletAddress,
        activeCampaignId,
        usingSturgeonHttpClient: !!sturgeonHttpClient,
        querySkipped: !(reservationId && effectiveWalletAddress && activeCampaignId),
        activeReservation: activeReservation ? 'POPULATED ✓' : 'undefined (still loading...)',
      });
    }
  }, [state, activeReservation, reservationId, effectiveWalletAddress, activeCampaignId]);

  // Countdown timer for reservation expiration
  useEffect(() => {
    // Only run timer when in reserved state
    if (state !== 'reserved') {
      setTimeRemaining(null);
      return;
    }

    // In preview mode, use a dynamically calculated expiration time
    // In real mode, use the reservation's actual expiresAt
    const expiresAt = previewMode ? previewExpiresAt : activeReservation?.expiresAt;

    if (!expiresAt) {
      setTimeRemaining(null);
      return;
    }

    // Calculate initial time remaining
    const calculateRemaining = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiresAt - now);
      return remaining;
    };

    setTimeRemaining(calculateRemaining());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeRemaining(remaining);

      // If time expired, clear interval
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state, activeReservation, previewMode, previewExpiresAt]);

  // Query for payment completion - checks if THIS SPECIFIC reservation was paid
  // Uses reservation ID (not wallet) to prevent false positives from previous claims
  // Also runs during 'payment' state for active polling while NMKR window is open
  // ENHANCED: Now passes walletAddress for additional detection paths (claims table, webhooks table)
  // CRITICAL FIX: On localhost, use sturgeonHttpClient since webhooks update production
  const fallbackPaymentStatus = useQuery(
    api.commemorativeNFTClaims.checkReservationPaid,
    !sturgeonHttpClient && !previewMode && (state === 'payment' || state === 'processing' || state === 'payment_window_closed') && reservationId
      ? { reservationId, walletAddress: effectiveWalletAddress || undefined }
      : "skip"
  );

  // State for production payment status (when using sturgeonHttpClient)
  const [productionPaymentStatus, setProductionPaymentStatus] = useState<any>(null);

  // Fetch payment status from production when sturgeonHttpClient is available
  useEffect(() => {
    const shouldPoll = sturgeonHttpClient && !previewMode &&
      (state === 'payment' || state === 'processing' || state === 'payment_window_closed') &&
      reservationId;

    if (!shouldPoll) {
      return;
    }

    let isActive = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const fetchPaymentStatus = async () => {
      try {
        if (!sturgeonHttpClient) return; // TypeScript guard
        const result = await sturgeonHttpClient.query(
          api.commemorativeNFTClaims.checkReservationPaid,
          { reservationId, walletAddress: effectiveWalletAddress || undefined }
        );
        if (isActive) {
          setProductionPaymentStatus(result);
        }
      } catch (error) {
        console.error('[🎯NFT-PROD] Error fetching payment status:', error);
      }
    };

    // Fetch immediately
    fetchPaymentStatus();

    // Poll every 2 seconds to detect payment quickly
    pollInterval = setInterval(fetchPaymentStatus, 2000);

    return () => {
      isActive = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [state, reservationId, effectiveWalletAddress, previewMode]);

  // Use production payment status if available, otherwise fallback
  const reservationPaymentStatus = sturgeonHttpClient ? productionPaymentStatus : fallbackPaymentStatus;

  // ==========================================
  // DUAL-DATABASE FIX: Check eligibility against PRODUCTION
  // ==========================================
  // Eligibility checks (already claimed, active reservation) must query production
  // to prevent users from claiming NFTs they already received in production.
  // ==========================================

  // Determine if we should use production client for eligibility
  const shouldFetchProductionEligibility = !!sturgeonHttpClient && state === 'checking_eligibility' && !!effectiveWalletAddress && !!activeCampaignId;

  // State for production eligibility (fetched via sturgeonHttpClient when available)
  const [productionEligibility, setProductionEligibility] = useState<any>(null);
  const [productionEligibilityLoading, setProductionEligibilityLoading] = useState(false);
  const [productionEligibilityFailed, setProductionEligibilityFailed] = useState(false);

  // Fetch eligibility from production database when in dual-database mode
  useEffect(() => {
    // Only fetch when conditions are met
    if (!shouldFetchProductionEligibility) {
      return;
    }

    // Track if effect is still active (for cleanup on unmount)
    let isActive = true;

    // Additional null check for TypeScript (already guaranteed by shouldFetchProductionEligibility)
    if (!sturgeonHttpClient) return;

    console.log('[🎯NFT-PROD] Checking eligibility against PRODUCTION database');
    setProductionEligibilityLoading(true);
    setProductionEligibility(null);
    setProductionEligibilityFailed(false);

    sturgeonHttpClient.query(api.nftEligibility.checkCampaignEligibility, {
      walletAddress: effectiveWalletAddress,
      campaignId: activeCampaignId
    })
      .then((result) => {
        if (!isActive) return; // Don't update state if unmounted
        console.log('[🎯NFT-PROD] Production eligibility result:', result);
        setProductionEligibility(result);
        setProductionEligibilityLoading(false);
      })
      .catch((error) => {
        if (!isActive) return; // Don't update state if unmounted
        console.error('[🎯NFT-PROD] Failed to check production eligibility, falling back to dev:', error);
        setProductionEligibilityLoading(false);
        setProductionEligibilityFailed(true); // Signal to use dev fallback
      });

    return () => { isActive = false; };
  }, [shouldFetchProductionEligibility, effectiveWalletAddress, activeCampaignId]);

  // Query for eligibility from default client
  // Used when: (1) not in dual-database mode, OR (2) production fetch failed as fallback
  const devEligibility = useQuery(
    api.nftEligibility.checkCampaignEligibility,
    state === 'checking_eligibility' && effectiveWalletAddress && activeCampaignId && (!sturgeonHttpClient || productionEligibilityFailed)
      ? { walletAddress: effectiveWalletAddress, campaignId: activeCampaignId }
      : "skip"
  );

  // Use production eligibility if available, otherwise fall back to dev
  // Priority: production success > dev fallback > undefined (loading)
  const eligibility = (() => {
    // If not using production client for eligibility, use dev directly
    if (!sturgeonHttpClient) return devEligibility;
    // If production is still loading, return undefined
    if (productionEligibilityLoading) return undefined;
    // If production failed, use dev fallback
    if (productionEligibilityFailed) return devEligibility;
    // Production succeeded, use production data
    return productionEligibility;
  })();

  useEffect(() => {
    setMounted(true);
    // Skip scroll locking in preview mode
    if (!previewMode) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (!previewMode) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [previewMode]);

  // Sync state when previewState changes in preview mode
  useEffect(() => {
    if (previewMode && previewState) {
      setState(previewState);
      // Update storedEligibility based on state
      if (previewState === 'ineligible') {
        setStoredEligibility(MOCK_ELIGIBILITY_INELIGIBLE);
      } else if (previewState === 'already_claimed') {
        setStoredEligibility(MOCK_ELIGIBILITY_ALREADY_CLAIMED);
      }
    }
  }, [previewMode, previewState]);

  // Detect and handle mobile resume from URL parameters
  // This allows mobile users to continue their session in wallet browser
  // Compatible with: iOS Safari 11+, Chrome Mobile, Firefox Mobile, Samsung Internet
  useEffect(() => {
    if (!mounted || previewMode) return;

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

  // Format milliseconds to MM:SS string (or "Expired" if 0)
  const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return 'Expired';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
          setErrorMessage(result.error || 'Failed to reserve NFT');
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
    // Guard: ensure component is mounted and all conditions are met
    if (!mounted || state !== 'wallet_verification' || !isMobileBrowser || reservationId || isCreatingMobileReservation) {
      return;
    }

    // Need wallet address and campaign to create reservation
    if (!effectiveWalletAddress || !activeCampaignId) {
      return;
    }

    // Track if effect is still active (for cleanup)
    let isActive = true;

    const createMobileReservation = async () => {
      console.log('[📱MOBILE] Auto-creating reservation for mobile user before Copy Link');
      setIsCreatingMobileReservation(true);

      try {
        const result = await createReservation({
          campaignId: activeCampaignId,
          walletAddress: effectiveWalletAddress
        });

        // Only update state if component is still mounted and effect is active
        if (!isActive) return;

        if (result.success && result.reservation) {
          console.log('[📱MOBILE] ✓ Reservation created:', result.reservation._id);
          setReservationId(result.reservation._id as Id<"commemorativeNFTInventory">);
        } else if (!result.success) {
          console.error('[📱MOBILE] Failed to create reservation:', result.error);
          setErrorMessage(result.error || 'Failed to reserve NFT');
          setState('error');
        }
        setIsCreatingMobileReservation(false);
      } catch (error) {
        // Only update state if component is still mounted and effect is active
        if (!isActive) return;

        console.error('[📱MOBILE] Error creating reservation:', error);
        setErrorMessage('Failed to create reservation');
        setState('error');
        setIsCreatingMobileReservation(false);
      }
    };

    createMobileReservation();

    // Cleanup function - prevent state updates if effect re-runs or component unmounts
    return () => {
      isActive = false;
    };
  }, [mounted, state, isMobileBrowser, reservationId, isCreatingMobileReservation, effectiveWalletAddress, activeCampaignId, createReservation]);

  // Detect available wallets and check if mobile browser
  const detectWalletsAndMobile = () => {
    // Check if window.cardano exists (might take a moment for extensions to inject)
    const hasCardano = typeof window !== 'undefined' && window.cardano;

    console.log('[🔐WALLET-DETECT] Starting detection, window.cardano exists:', !!hasCardano);
    if (hasCardano) {
      console.log('[🔐WALLET-DETECT] window.cardano keys:', Object.keys(window.cardano as object));
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

  // Monitor reservation expiration while cancel confirmation dialog is open
  // If time runs out, auto-close the dialog and transition to timeout state
  useEffect(() => {
    if (showCancelConfirmation && timeRemaining !== null && timeRemaining <= 0) {
      console.log('[🔨CANCEL] Reservation expired while cancel dialog was open - transitioning to timeout');
      setShowCancelConfirmation(false);
      setState('timeout');
    }
  }, [showCancelConfirmation, timeRemaining]);

  const handleCancelCancel = () => {
    setShowCancelConfirmation(false);
  };

  // Skip mounted check in preview mode - always render immediately
  if (!mounted && !previewMode) return null;

  const renderContent = () => {
    switch (state) {
      case 'loading_campaign':
        return (
          <div className="text-center py-8">
            <div className="mb-10 flex justify-center">
              <CubeSpinner color="cyan" size={44} />
            </div>
            <p className="text-white/60">Loading Campaign...</p>
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
                Please enter the stake address of the wallet you used to create your Phase I corporation.
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
          <div className="text-center py-8">
            <div className="mb-10 flex justify-center">
              <CubeSpinner color="cyan" size={44} />
            </div>
            <p className="text-white/60">Checking Eligibility...</p>
          </div>
        );

      case 'corporation_verified':
        return (
          <div className="text-center pt-2 sm:pt-4 pb-2">
            {/* Checkmark icon */}
            <div className="mb-4 sm:mb-6">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
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
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-wide mb-4">
                Not Eligible
              </h2>
              <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed">
                This commemorative NFT is reserved for Phase I beta participants.
              </p>
              <p className="text-sm sm:text-base text-cyan-400 font-semibold tracking-wide leading-relaxed mt-3">
                Great news — Phase II beta is launching soon. Join now and be part of the next chapter.
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent('openLightbox', { detail: { lightboxId: 'beta-signup' } }));
                }}
                className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold tracking-wider text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 touch-manipulation shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
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
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-4">
              Already Claimed
            </h3>

            {claimedNFT && (
              <div className="mb-6">
                {/* NFT Image */}
                <div className="relative w-full max-w-[280px] mx-auto mb-4 rounded-2xl overflow-hidden bg-black/50 backdrop-blur-md border border-white/10 shadow-2xl">
                  <img
                    src={claimedNFT.imageUrl?.startsWith('/') ? getMediaUrl(claimedNFT.imageUrl) : (claimedNFT.imageUrl || getMediaUrl("/random-images/Lab%20Rat.jpg"))}
                    alt={claimedNFT.name || "Your NFT"}
                    className="w-full h-auto"
                    onError={(e) => { e.currentTarget.src = getMediaUrl('/logo-big.png'); }}
                  />
                </div>

                {/* NFT Details Card - Space Age Style */}
                <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-400/20 rounded-2xl backdrop-blur-md">
                  <h4 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Inter, sans-serif', color: '#a5f3fc', letterSpacing: '-0.02em' }}>
                    {claimedNFT.name}
                  </h4>
                  {mintDate && (
                    <div className="text-sm text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span>Minted on </span>
                      <span className="text-cyan-300/80">{formattedDate}</span>
                      <span> at </span>
                      <span className="text-cyan-300/80">{formattedTime}</span>
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
            <div className="mb-6 flex justify-center">
              <CubeSpinner color="cyan" size={44} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-2">
              Reserving NFT
            </h2>
            <p className="text-sm sm:text-base text-white/60 font-light tracking-wide">
              Finding next available NFT
            </p>
          </div>
        );

      case 'reserved':
        // In preview mode, use mock reservation data
        const reservationData = previewMode ? MOCK_RESERVATION : activeReservation;

        if (!reservationData) {
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

        if (!previewMode) {
          console.log('[🔨RESERVE] Rendering "reserved" state with activeReservation:', activeReservation?.nftNumber);
        }

        return (
          <div className="text-center">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Inter, sans-serif', color: '#e0f2fe', letterSpacing: '-0.01em' }}>
                Your NFT Reserved
              </h2>

              <div className="relative w-full max-w-[300px] mx-auto mb-4 rounded-2xl overflow-hidden bg-black/50 backdrop-blur-md border border-cyan-400/30 shadow-2xl shadow-cyan-500/20">
                <img
                  src={reservationData.nft?.imageUrl?.startsWith('/') ? getMediaUrl(reservationData.nft.imageUrl) : (reservationData.nft?.imageUrl || getMediaUrl("/random-images/Lab%20Rat.jpg"))}
                  alt={reservationData.nft?.name || "NFT"}
                  className="w-full h-auto"
                  onError={(e) => { e.currentTarget.src = getMediaUrl('/logo-big.png'); }}
                />
              </div>

              <div className="mb-4 p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-2xl backdrop-blur-md">
                <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Inter, sans-serif', color: '#e0f2fe', letterSpacing: '-0.02em' }}>
                  {reservationData.nft?.name || "NFT"}
                </h3>
                <p style={{ fontFamily: 'Inter, sans-serif', color: '#bae6fd', fontSize: '0.875rem', lineHeight: '1.5', fontWeight: 400 }}>
                  You have reserved <span style={{ color: '#22d3ee', fontWeight: 600, textShadow: '0 0 10px rgba(34, 211, 238, 0.6), 0 0 20px rgba(34, 211, 238, 0.4)' }}>edition number {previewMode ? MOCK_RESERVATION.nft.editionNumber : (activeReservation as any)?.nftNumber}</span>. Click below to open the payment window and complete your purchase.
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', color: '#bae6fd', fontSize: '0.875rem', lineHeight: '1.5', fontWeight: 400, marginTop: '0.75rem' }}>
                  Time remaining: <span style={{ color: timeRemaining !== null && timeRemaining < 300000 ? '#f87171' : '#22d3ee', fontWeight: 600, fontFamily: 'monospace', fontSize: '1rem' }}>{timeRemaining !== null ? formatTimeRemaining(timeRemaining) : '--:--'}</span>. The fee for this commemorative token is <span style={{ color: '#22d3ee', fontWeight: 600 }}>10 ADA</span>.
                </p>
              </div>
            </div>

            <button
              onClick={() => !previewMode && handleOpenPayment()}
              className="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 hover:brightness-110"
              style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)', color: '#ffffff', boxShadow: '0 6px 24px rgba(6, 182, 212, 0.4)', border: 'none', letterSpacing: '0.02em' }}
            >
              Open Payment Window
            </button>

            <button
              onClick={() => !previewMode && attemptCancel()}
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
                onClick={() => setState('corporation_verified')}
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

            {/* Wallet buttons - Glass style with honeycomb hover */}
            {availableWallets.length > 0 ? (
              <div className={availableWallets.length === 1 ? "flex justify-center mb-2" : "grid grid-cols-2 gap-3 mb-2"}>
                {availableWallets.map(wallet => (
                  <button
                    key={wallet.name}
                    onClick={() => connectAndVerifyWallet(wallet)}
                    className={`group relative px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] hover:border-white/50 hover:brightness-125 flex items-center justify-center overflow-hidden ${availableWallets.length === 1 ? 'min-w-[180px]' : ''}`}
                    style={{
                      fontFamily: "'Play', sans-serif",
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                      color: '#e0e0e0',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                    }}
                  >
                    {/* Honeycomb hover effect */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg"
                      style={{
                        backgroundImage: `url('${getMediaUrl('/random-images/honey-png1.webp')}')`,
                        backgroundSize: '125%',
                        backgroundPosition: 'center'
                      }}
                    />
                    {/* Icon positioned absolutely so it doesn't affect text centering */}
                    <img
                      src={wallet.icon}
                      alt=""
                      className="absolute left-3 w-5 h-5 rounded z-[2]"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span className="relative z-10 transition-all duration-300 group-hover:[text-shadow:0_0_6px_rgba(255,255,255,0.9),0_0_12px_rgba(255,255,255,0.6)]">{wallet.name}</span>
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
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-4">
              Complete Your Purchase
            </h2>
            <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-2">
              Complete the payment in the NMKR window
            </p>
            <p className="text-sm sm:text-base text-cyan-400 font-semibold tracking-wide mb-6">
              Close the NMKR window when your payment is complete.
            </p>
            <button
              onClick={attemptCancel}
              className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200 border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 text-white/70 hover:text-red-400"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
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

        // Show options when payment window is closed
        return (
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-light text-white tracking-wide mb-4">
              We noticed you closed the NMKR window.
            </h2>
            <div className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-6 space-y-4">
              <p>
                If you are canceling your reservation, feel free to close this lightbox.
              </p>

              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.05))',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                }}
              >
                <p className="text-cyan-400 font-semibold">
                  If you made payment, please click the Refresh button below.
                </p>
              </div>

              <p>
                If you believe there was an error, please reach out to us on{' '}
                <a
                  href="https://discord.gg/KnqMF6Ayyc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                >
                  Discord
                </a>.
              </p>
            </div>

            <div className="space-y-2">
              {/* Secondary action: Go back to reservation screen to re-open payment */}
              <button
                onClick={() => setState('reserved')}
                className="w-full py-2 px-4 text-sm font-medium text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                Re-open Payment Window
              </button>

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

              {/* Tertiary action: Cancel the reservation entirely */}
              <button
                onClick={attemptCancel}
                className="w-full py-1 px-4 text-sm font-medium text-white/40 hover:text-white/60 transition-colors"
              >
                Cancel Reservation
              </button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center">
            {/* Cyan CubeSpinner at top */}
            <div className="mb-6 flex justify-center">
              <CubeSpinner color="cyan" size={44} />
            </div>

            {/* Space Age style header */}
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-3">
              Checking Payment
            </h2>
            <p className="text-white/50 text-sm sm:text-base font-light tracking-wide mb-6">
              Waiting for blockchain confirmation
            </p>

            {/* Glass-style info box */}
            <div
              className="p-4 rounded-xl mb-8"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <p className="text-white/60 text-xs sm:text-sm font-light tracking-wide">
                This may take 1-2 minutes. <span className="text-cyan-400 font-semibold">Please don't close this window.</span>
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
          <div className="text-center py-4">
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.6)) drop-shadow(0 0 16px rgba(34, 211, 238, 0.4))'
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-3">
              NFT Claimed!
            </h2>
            <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-2">
              Your NFT has been successfully minted
            </p>
            <p className="text-sm text-cyan-400 font-medium tracking-wide leading-relaxed mb-6">
              If you plan on playing this game for the long haul, we encourage you to keep it. 😊
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                color: '#ffffff',
                boxShadow: '0 6px 24px rgba(6, 182, 212, 0.4)',
                border: 'none'
              }}
            >
              Close
            </button>
          </div>
        );

      case 'timeout':
        return (
          <div className="text-center py-4">
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-4">
              Reservation Timed Out
            </h2>
            <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-2">
              We're sorry, the reservation has timed out.
            </p>
            <p className="text-sm sm:text-base text-cyan-400 font-medium tracking-wide leading-relaxed mb-6">
              Please try again when you are ready.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                color: '#ffffff',
                boxShadow: '0 6px 24px rgba(6, 182, 212, 0.4)',
                border: 'none'
              }}
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

      case 'cancel_confirmation':
        // Preview-only state to show the cancel confirmation dialog
        return (
          <div className="text-center py-4">
            <h3 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-3">
              Cancel Reservation?
            </h3>

            <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed mb-6">
              Are you sure you want to cancel? Doing so will not guarantee <span className="text-cyan-400 font-semibold">edition number {MOCK_RESERVATION.nft.editionNumber}</span>.
            </p>

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)',
                  border: 'none'
                }}
              >
                Go Back
              </button>
              <button
                className="flex-1 py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200 border border-white/20 hover:bg-white/5"
                style={{ fontFamily: 'Inter, sans-serif', background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}
              >
                Confirm Cancel
              </button>
            </div>
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
            <h3 className="text-2xl font-bold text-center mb-3" style={{ fontFamily: 'Inter, sans-serif', color: '#e0f2fe' }}>
              {reservationId ? 'Cancel Reservation?' : 'Cancel Claim?'}
            </h3>

            <p className="text-center mb-6" style={{ fontFamily: 'Inter, sans-serif', color: '#bae6fd', fontSize: '0.95rem', lineHeight: '1.6' }}>
              {reservationId ? (
                <>Are you sure you want to cancel? Doing so will not guarantee <span style={{ color: '#22d3ee', fontWeight: 600, textShadow: '0 0 12px rgba(34, 211, 238, 0.8), 0 0 24px rgba(34, 211, 238, 0.5)' }}>edition number {(activeReservation as any)?.nftNumber ?? 'this edition'}</span>.</>
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

  // In preview mode, render inline (no portal) with a container wrapper
  if (previewMode) {
    return (
      <div className={`relative w-full ${state === 'reserved' ? 'max-w-2xl' : 'max-w-md'} mx-auto`}>
        {/* Glass Card - no backdrop in preview mode */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
          }}
        >
          <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-5 md:px-10 md:pt-10 md:pb-6">
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  return createPortal(modalContent, document.body);
}
