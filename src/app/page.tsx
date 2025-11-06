'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useAction, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getMekDataByNumber, getMekImageUrl, parseMekNumber } from "@/lib/mekNumberToVariation";
import { getVariationInfoFromFullKey } from "@/lib/variationNameLookup";
import BlockchainVerificationPanel from "@/components/BlockchainVerificationPanel";
import HolographicButton from "@/components/ui/IndustrialButtons/HolographicButton";
import { ensureBech32StakeAddress } from "@/lib/cardanoAddressConverter";
import { hexToBech32 } from "@/lib/cardano-addresses";
// MekLevelUpgrade component removed - using inline upgrade UI from demo
import GoldLeaderboard from "@/components/GoldLeaderboard";
import { CompanyNameModal } from "@/components/CompanyNameModal";
import { calculateCurrentGold } from "@/convex/lib/goldCalculations";
import {
  saveWalletSession,
  restoreWalletSession,
  clearWalletSession,
  getCachedMeks,
  updateCachedMeks,
  generateSessionId,
} from "@/lib/walletSessionManager";
import { useSecureWalletConnection } from '@/hooks/useSecureWalletConnection';
import { generateSecureNonce, verifySignatureWithRetry, saveSessionSecurely } from '@/lib/secureWalletConnection';
import { VirtualMekGrid } from "@/components/VirtualMekGrid";
import { AnimatedNumber as AnimatedNumberComponent } from "@/components/MekCard/AnimatedNumber";
import { MekCard } from "@/components/MekCard";
import { AnimatedMekValues } from "@/components/MekCard/types";
import AirdropClaimBanner from "@/components/AirdropClaimBanner";
import NMKRClaimButton from "@/components/NMKRClaimButton";
import { useActivityTracking } from '@/hooks/useActivityTracking';
import MechanismGridLightbox from "@/components/MechanismGridLightbox";
import MeksTriangleLightbox from "@/components/MeksTriangleLightbox";
import { COMPLETE_VARIATION_RARITY } from "@/lib/completeVariationRarity";

// Animated Number Component with smooth counting animation
function AnimatedNumber({ value, decimals = 1, threshold = 0.01 }: { value: number; decimals?: number; threshold?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number | null>(null);
  const startValueRef = useRef(value);

  useEffect(() => {
    const startValue = startValueRef.current;
    const endValue = value;
    const difference = Math.abs(endValue - startValue);

    // Skip animation if change is below threshold (prevents jitter)
    if (difference < threshold) {
      setDisplayValue(endValue);
      startValueRef.current = endValue;
      return;
    }

    const duration = 400; // Faster animation for smoother upgrade experience
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * eased;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - update start value for next animation
        startValueRef.current = endValue;
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, threshold]); // Removed displayValue from dependencies to prevent infinite loop

  // Format with commas if no decimals, otherwise show decimals
  return decimals === 0
    ? <>{Math.floor(displayValue).toLocaleString('en-US')}</>
    : <>{displayValue.toFixed(decimals)}</>;
}

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

      // Check if expiring soon (less than 1 hour)
      setIsExpiringSoon(remaining < 60 * 60 * 1000);

      // Format time remaining
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className={`font-mono text-base sm:text-lg ${isExpiringSoon ? 'text-orange-400' : 'text-green-400'}`}>
      {timeRemaining}
    </div>
  );
}

// Simple function to create Pool.pm URL without MeshSDK
function createPoolPmUrl(policyId: string, assetName: string): string {
  // Pool.pm accepts policy ID and asset name directly
  return `https://pool.pm/${policyId}.${assetName}`;
}

// Mek Policy ID for the collection
const MEK_POLICY_ID = "ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3";

// Extend Window interface for Cardano wallets
declare global {
  interface Window {
    cardano?: any;
  }
}

interface WalletInfo {
  name: string;
  icon: string;
  version: string;
  api: any;
}

interface MekAsset {
  assetId: string;
  policyId: string;
  assetName: string;
  imageUrl?: string;
  goldPerHour: number;
  baseGoldPerHour?: number; // Original rate from rarity
  levelBoostAmount?: number; // Boost amount from level
  currentLevel?: number; // Current level 1-10
  rarityRank?: number;
  mekNumber: number;
  headGroup?: string;
  bodyGroup?: string;
  itemGroup?: string;
  sourceKey?: string;
}

interface VerificationStatus {
  verified: boolean;
  isVerified?: boolean; // Alternate field name for compatibility
  status?: 'verified' | 'pending' | 'failed';
  source?: 'database' | 'blockchain' | 'manual';
  lastVerified?: number;
  error?: string;
}

// Demo wallet mock data
const DEMO_MEKS: MekAsset[] = [
  {
    assetId: 'demo_mek_179',
    policyId: MEK_POLICY_ID,
    assetName: 'Mekanism179',
    imageUrl: '/mek-images/150px/ki1-jg2-cd2.webp',
    goldPerHour: 7.74,
    baseGoldPerHour: 6.45,
    levelBoostAmount: 1.29,
    currentLevel: 3,
    rarityRank: 1916,
    mekNumber: 179,
    sourceKey: 'ki1-jg2-cd2',
  },
  {
    assetId: 'demo_mek_2922',
    policyId: MEK_POLICY_ID,
    assetName: 'Mekanism2922',
    imageUrl: '/mek-images/150px/bc6-cb1-of2.webp',
    goldPerHour: 30.53,
    baseGoldPerHour: 21.81,
    levelBoostAmount: 8.72,
    currentLevel: 5,
    rarityRank: 554,
    mekNumber: 2922,
    sourceKey: 'bc6-cb1-of2',
  },
  {
    assetId: 'demo_mek_3972',
    policyId: MEK_POLICY_ID,
    assetName: 'Mekanism3972',
    imageUrl: '/mek-images/150px/jx1-bf3-eh1.webp',
    goldPerHour: 13.28,
    baseGoldPerHour: 12.07,
    levelBoostAmount: 1.21,
    currentLevel: 2,
    rarityRank: 1215,
    mekNumber: 3972,
    sourceKey: 'jx1-bf3-eh1',
  },
  {
    assetId: 'demo_mek_795',
    policyId: MEK_POLICY_ID,
    assetName: 'Mekanism795',
    imageUrl: '/mek-images/150px/jx2-jg2-nm1.webp',
    goldPerHour: 11.55,
    baseGoldPerHour: 11.55,
    levelBoostAmount: 0,
    currentLevel: 1,
    rarityRank: 1265,
    mekNumber: 795,
    sourceKey: 'jx2-jg2-nm1',
  },
  {
    assetId: 'demo_mek_2685',
    policyId: MEK_POLICY_ID,
    assetName: 'Mekanism2685',
    imageUrl: '/mek-images/150px/bc5-ee1-ap1.webp',
    goldPerHour: 7.46,
    baseGoldPerHour: 7.46,
    levelBoostAmount: 0,
    currentLevel: 1,
    rarityRank: 1753,
    mekNumber: 2685,
    sourceKey: 'bc5-ee1-ap1',
  },
];

export default function MekRateLoggingPage() {
  // Convex client for direct queries
  const convex = useConvex();

  // Demo mode detection
  const [isDemoMode, setIsDemoMode] = useState(false);
  // Force no wallet mode for UI tweaking
  const [forceNoWallet, setForceNoWallet] = useState(false);
  // Wallet card design variation selector (1, 2, 3, 4, or 5) - LOCKED TO 5: Docking Port C
  const walletCardVariation = 5;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsDemoMode(params.get('demo') === 'true');
      setForceNoWallet(params.get('forceNoWallet') === 'true');
    }
  }, []);

  // Wallet state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>(''); // Track detailed connection progress
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [paymentAddress, setPaymentAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletInstructions, setWalletInstructions] = useState<string | null>(null); // Separate state for instructions modal
  const [urlCopied, setUrlCopied] = useState(false); // Track clipboard copy status
  const [showConnectionStatus, setShowConnectionStatus] = useState(false); // Control connection status modal
  const [isAutoReconnecting, setIsAutoReconnecting] = useState(true); // Start with auto-reconnecting state
  const [isWebViewMode, setIsWebViewMode] = useState(false); // Track if we're in a wallet's WebView
  const [webViewWalletName, setWebViewWalletName] = useState<string | null>(null); // Store the wallet name
  const connectionLockRef = useRef<boolean>(false); // Prevent multiple simultaneous connections
  const walletApiRef = useRef<any>(null); // Store wallet API reference for event listeners
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null); // Track polling interval for cancellation

  // Mek assets
  const [ownedMeks, setOwnedMeks] = useState<MekAsset[]>([]);
  const [loadingMeks, setLoadingMeks] = useState(false);
  const [selectedMek, setSelectedMek] = useState<MekAsset | null>(null);
  const [sortType, setSortType] = useState<'rate' | 'level'>('rate'); // Sort by rate or level
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [walletFilter, setWalletFilter] = useState<string | null>(null); // Filter by wallet address
  const [walletFilterDropdownOpen, setWalletFilterDropdownOpen] = useState(false);
  const [goldTextStyle, setGoldTextStyle] = useState<number>(1); // Default to spaced style
  const [mekNumberStyle, setMekNumberStyle] = useState<number>(0); // Mek number display style
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false); // Disconnect loading state
  // Level bar style locked to Bar Indicators (option 5)

  // Company name states
  const [showCompanyNameModal, setShowCompanyNameModal] = useState(false);
  const [companyNameModalMode, setCompanyNameModalMode] = useState<'initial' | 'edit'>('initial');
  const [showMechanismGridLightbox, setShowMechanismGridLightbox] = useState(false);
  const [showMeksTriangle, setShowMeksTriangle] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Search functionality

  // Add Wallet modal states
  const [addWalletModalOpen, setAddWalletModalOpen] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletNickname, setNewWalletNickname] = useState('');
  const [addWalletStep, setAddWalletStep] = useState<'input' | 'name-merger' | 'verify' | 'signing'>('input');

  // Edit wallet nickname states
  const [editingWalletAddress, setEditingWalletAddress] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState('');
  const [addWalletNonce, setAddWalletNonce] = useState<string | null>(null);
  const [addWalletMessage, setAddWalletMessage] = useState<string | null>(null);
  const [isAddingWallet, setIsAddingWallet] = useState(false); // Flag to prevent auto-disconnect during wallet addition

  // Corporation name merger states
  const [currentCorpName, setCurrentCorpName] = useState<string | null>(null);
  const [incomingCorpName, setIncomingCorpName] = useState<string | null>(null);
  const [selectedCorpNameOption, setSelectedCorpNameOption] = useState<'current' | 'incoming' | 'new'>('current');
  const [newCorpName, setNewCorpName] = useState('');

  // Blockchain verification state
  const [showVerificationPanel, setShowVerificationPanel] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isSignatureVerified, setIsSignatureVerified] = useState(false);
  const [isProcessingSignature, setIsProcessingSignature] = useState(false);
  const [isVerifyingBlockchain, setIsVerifyingBlockchain] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);

  // Secure wallet connection hook
  const {
    connectWallet: connectWalletSecure,
    connectionState,
    isConnecting: isSecureConnecting,
    error: secureConnectionError
  } = useSecureWalletConnection({
    maxRetries: 2,
    onConnectionSuccess: async (session) => {
      console.log('[Secure Connection] Wallet connected successfully');
      setWalletAddress(session.walletAddress);
      // Save to localStorage so other components can access it
      localStorage.setItem('stakeAddress', session.walletAddress);
      setWalletType(session.walletType);
      setIsConnecting(false);
      setWalletConnected(true);
    },
    onConnectionError: (error) => {
      console.error('[Secure Connection] Connection failed:', error);
      setWalletError(error.message);
      setIsConnecting(false);
    }
  });

  // Gold tracking
  const [currentGold, setCurrentGold] = useState(0);
  const [cumulativeGold, setCumulativeGold] = useState(0);
  const [goldPerHour, setGoldPerHour] = useState(0);
  const goldIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkpointIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [refreshGold, setRefreshGold] = useState(0); // Trigger to refresh gold after upgrade
  const initialLoadRef = useRef(true); // Track initial page load

  // Animation states for upgrade feedback
  const [goldSpentAnimations, setGoldSpentAnimations] = useState<{id: string, amount: number}[]>([]);
  const [upgradingMeks, setUpgradingMeks] = useState<Set<string>>(new Set());
  const [animatedMekValues, setAnimatedMekValues] = useState<{[key: string]: {
    level: number,
    goldRate: number,
    bonusRate: number
  }}>({});

  // Track recently upgraded Meks to prevent instant re-sorting
  const [recentlyUpgradedMeks, setRecentlyUpgradedMeks] = useState<{[assetId: string]: {
    originalIndex: number,
    upgradeTime: number,
    mouseLeft: boolean,
    moveTimerId?: NodeJS.Timeout
  }}>({});

  // Convex mutations and queries
  const initializeGoldMining = useMutation(api.goldMining.initializeGoldMining);
  const initializeWithBlockfrost = useAction(api.goldMining.initializeWithBlockfrost);
  const updateGoldCheckpoint = useMutation(api.goldMining.updateGoldCheckpoint);
  const updateLastActive = useMutation(api.goldMining.updateLastActive);
  const upgradeMek = useMutation(api.mekLeveling.upgradeMekLevel);
  const addWalletToGroup = useAction(api.walletGroups.addWalletToGroup); // Changed to action for signature verification
  const removeWalletFromGroup = useMutation(api.walletGroups.removeWalletFromGroup);
  const setWalletNickname = useMutation(api.walletGroups.setWalletNickname);
  const getWalletCompanyName = useQuery(api.walletGroups.getWalletCompanyName, newWalletAddress.trim() ? { walletAddress: newWalletAddress.trim() } : "skip");
  const updateGroupCompanyName = useMutation(api.walletGroups.updateGroupCompanyName);
  const generateNonce = useMutation(api.walletAuthentication.generateNonce);
  const verifySignature = useAction(api.walletAuthentication.verifySignature);
  const revokeAuthentication = useMutation(api.walletAuthentication.revokeAuthentication);
  const checkAuth = useQuery(
    api.walletAuthentication.checkAuthentication,
    (walletAddress && !walletAddress.includes('demo') && walletType !== 'Demo') ? { stakeAddress: walletAddress } : "skip"
  );
  const calculateGoldRates = useQuery(api.goldMining.calculateGoldRates,
    ownedMeks.length > 0 ? {
      meks: ownedMeks
        .filter(m => m.assetId) // Filter out any meks without assetId
        .map(m => ({ assetId: m.assetId, rarityRank: m.rarityRank || m.mekNumber }))
    } : "skip"
  );

  // Get gold mining data
  const goldMiningData = useQuery(api.goldMining.getGoldMiningData,
    walletAddress ? { walletAddress } : "skip"
  );

  // Get all Meks from all wallets in the corporation
  const groupMeks = useQuery(api.goldMining.getGroupMeks,
    walletAddress ? { walletAddress } : "skip"
  );

  // Get wallet group for displaying in dropdown
  const walletGroup = useQuery(
    api.walletGroups.getMyGroupWallets,
    walletAddress ? { walletAddress } : "skip"
  );

  // Get aggregated corporation stats (cumulative gold from ALL wallets)
  const corporationStats = useQuery(
    api.goldMining.getCorporationStats,
    walletAddress ? { walletAddress } : "skip"
  );

  // Track genuine user activity (clicks, scrolls, keyboard, mouse movement)
  // Only updates lastActiveTime when user is actually interacting with the page
  useActivityTracking({
    walletAddress,
    enabled: walletConnected && !isDemoMode,
    debounceMs: 30000 // Update database max once per 30 seconds
  });

  // LOG: ownedMeks state changes (CRITICAL FOR DEBUGGING WALLET SWITCH BUG)
  useEffect(() => {
    console.log('[STATE CHANGE] ownedMeks updated:', {
      count: ownedMeks.length,
      firstMek: ownedMeks[0]?.assetName,
      assetIds: ownedMeks.slice(0, 3).map(m => m.assetId),
      timestamp: new Date().toISOString(),
      stack: new Error().stack?.split('\n').slice(2, 5).join('\n') // Show call stack
    });
  }, [ownedMeks]);

  // LOG: Query data updates
  useEffect(() => {
    if (goldMiningData) {
      console.log('[QUERY] goldMiningData updated:', {
        walletAddress: goldMiningData.walletAddress?.slice(0, 12) + '...',
        accumulatedGold: goldMiningData.accumulatedGold,
        lastSnapshotTime: goldMiningData.lastSnapshotTime,
        totalGoldPerHour: goldMiningData.totalGoldPerHour,
        ownedMeksCount: goldMiningData.ownedMeks?.length,
        firstMek: goldMiningData.ownedMeks?.[0]?.assetName,
        updatedAt: goldMiningData.updatedAt,
        timestamp: new Date().toISOString()
      });
    }
  }, [goldMiningData]);

  // Get user stats including cumulative gold
  const userStats = useQuery(
    api.userStats.getUserStats,
    walletAddress ? { walletAddress } : "skip"
  );

  // Query Mek levels for the wallet (includes all wallets in corporation)
  const mekLevels = useQuery(api.mekLeveling.getGroupMekLevels,
    walletAddress ? { walletAddress } : "skip"
  );

  // Blockchain verification hooks (generateNonce and verifySignature declared above)
  const createGoldCheckpoint = useAction(api.goldCheckpointingActions.createGoldCheckpoint);
  const fetchOnChainRates = useAction(api.smartContractArchitecture.fetchOnChainRates);
  // Multi-wallet aggregation removed - one wallet per account

  // Memoize expected total with boosts to prevent recalculation on every render
  const expectedTotalWithBoosts = useMemo(() => {
    if (!mekLevels || mekLevels.length === 0 || !goldMiningData?.ownedMeks) {
      return 0;
    }

    return goldMiningData.ownedMeks.reduce((sum, mek) => {
      const levelData = mekLevels.find(l => l.assetId === mek.assetId);
      const boost = levelData?.currentBoostAmount || 0;
      const baseRate = mek.goldPerHour - boost;
      const effectiveRate = Math.max(mek.goldPerHour, baseRate + boost);
      return sum + effectiveRate;
    }, 0);
  }, [goldMiningData?.ownedMeks, mekLevels]);

  // Memoize cumulative gold calculation - USES CORPORATION STATS to aggregate ALL wallets
  const calculatedCumulativeGold = useMemo(() => {
    // Use corporation stats if available (aggregates all wallets in the corporation)
    if (corporationStats) {
      return corporationStats.totalCumulativeGold;
    }

    // Fallback to single wallet calculation if corporation stats not loaded yet
    if (!goldMiningData) return 0;

    const now = Date.now();
    let baseCumulativeGold = goldMiningData.totalCumulativeGold || 0;

    if (!goldMiningData.totalCumulativeGold) {
      baseCumulativeGold = (goldMiningData.accumulatedGold || 0) + (goldMiningData.totalGoldSpentOnUpgrades || 0);
    }

    if (goldMiningData.isBlockchainVerified === true) {
      const lastUpdateTime = goldMiningData.lastSnapshotTime || goldMiningData.updatedAt || goldMiningData.createdAt;
      const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
      const goldSinceLastUpdate = goldMiningData.totalGoldPerHour * hoursSinceLastUpdate;
      return baseCumulativeGold + goldSinceLastUpdate;
    }

    return baseCumulativeGold;
  }, [corporationStats, goldMiningData]);

  // Update gold display when goldMiningData changes - optimized to prevent unnecessary re-renders
  useEffect(() => {
    if (goldMiningData) {
      setCurrentGold(goldMiningData.currentGold);

      if (initialLoadRef.current) {
        initialLoadRef.current = false;
      }

      // Check for boost mismatch (now using memoized value)
      if (expectedTotalWithBoosts > 0 && Math.abs(expectedTotalWithBoosts - goldMiningData.totalGoldPerHour) > 1) {
        console.log('[Level Boost Check] Rate mismatch detected on page load:', {
          storedTotal: goldMiningData.totalGoldPerHour,
          expectedWithBoosts: expectedTotalWithBoosts,
          difference: expectedTotalWithBoosts - goldMiningData.totalGoldPerHour,
          mekLevels: mekLevels?.length || 0
        });
      }

      setGoldPerHour(goldMiningData.totalGoldPerHour);
      setCumulativeGold(calculatedCumulativeGold);
    }
  }, [goldMiningData, expectedTotalWithBoosts, calculatedCumulativeGold, mekLevels]);

  // Query to check backend authentication status
  // CRITICAL: Only check auth AFTER connection is complete to avoid interfering with connection process
  // Skip for demo wallets
  const authStatus = useQuery(api.walletAuthentication.checkAuthentication,
    (walletAddress && walletConnected && !isConnecting && !walletAddress.includes('demo') && walletType !== 'Demo')
      ? { stakeAddress: walletAddress }
      : 'skip'
  );

  // Query company name for current wallet
  const companyNameData = useQuery(api.goldMining.getCompanyName,
    walletAddress ? { walletAddress } : 'skip'
  );

  // Show company name modal when wallet connects without a company name
  useEffect(() => {
    if (walletConnected && walletAddress && companyNameData !== undefined) {
      if (!companyNameData?.hasCompanyName) {
        setShowCompanyNameModal(true);
        setCompanyNameModalMode('initial');
      }
    }
  }, [walletConnected, walletAddress, companyNameData]);

  // Auto-connect to wallet if in WebView (before localStorage restore)
  useEffect(() => {
    const autoConnectWebView = async () => {
      console.log('[WebView Auto-Connect] Effect running...');

      // Guard against SSR
      if (typeof window === 'undefined') {
        console.log('[WebView Auto-Connect] Skipping - SSR');
        return;
      }

      // Skip in forceNoWallet mode
      if (forceNoWallet) {
        console.log('[WebView Auto-Connect] Skipping - forceNoWallet mode');
        return;
      }

      // Skip if already connected
      if (walletConnected) {
        console.log('[WebView Auto-Connect] Skipping - already connected');
        return;
      }

      console.log('[WebView Auto-Connect] Checking for WebView...');
      console.log('[WebView Auto-Connect] User Agent:', navigator.userAgent);
      console.log('[WebView Auto-Connect] window.cardano:', window.cardano ? Object.keys(window.cardano) : 'undefined');

      // Check if we're in a wallet's WebView
      const { detectWebViewWallet, getWalletDisplayName } = await import('@/lib/walletDetection');
      const webViewCheck = detectWebViewWallet();

      console.log('[WebView Auto-Connect] Detection result:', webViewCheck);

      if (webViewCheck.isWebView && webViewCheck.walletType) {
        console.log('[WebView Auto-Connect] Detected WebView for wallet:', webViewCheck.walletType);

        const displayName = getWalletDisplayName(webViewCheck.walletType);

        // Set WebView mode flags
        setIsWebViewMode(true);
        setWebViewWalletName(displayName);
        setConnectionStatus(`Connecting to ${displayName}...`);
        setShowConnectionStatus(true);
        setIsConnecting(true);

        try {
          // Get the wallet API from window.cardano
          const walletKey = webViewCheck.walletType;
          const cardanoWallet = (window.cardano as any)?.[walletKey];

          if (!cardanoWallet) {
            // Wait a moment for wallet to inject
            console.log('[WebView Auto-Connect] Wallet API not ready, waiting...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          const finalCardanoWallet = (window.cardano as any)?.[walletKey];

          if (finalCardanoWallet) {
            // Auto-connect to this wallet
            const walletInfo: WalletInfo = {
              name: webViewCheck.walletType.charAt(0).toUpperCase() + webViewCheck.walletType.slice(1),
              icon: `/wallet-icons/${webViewCheck.walletType}.png`,
              version: finalCardanoWallet.apiVersion || 'unknown',
              api: finalCardanoWallet,
            };

            console.log('[WebView Auto-Connect] Auto-connecting to WebView wallet:', walletInfo.name);
            await connectWallet(walletInfo);
          } else {
            console.warn('[WebView Auto-Connect] Wallet API not available after wait');
            setIsConnecting(false);
            setConnectionStatus('');
            setShowConnectionStatus(false);
          }
        } catch (error) {
          console.error('[WebView Auto-Connect] Failed:', error);
          setWalletError(`Failed to auto-connect to ${webViewCheck.walletType}`);
          setIsConnecting(false);
          setConnectionStatus('');
          setShowConnectionStatus(false);
        }
      }
    };

    autoConnectWebView();
  }, [forceNoWallet, walletConnected]);

  // Restore wallet connection from localStorage on mount
  useEffect(() => {
    const restoreWalletConnection = async () => {
      console.log('[Session Restore] === EFFECT TRIGGERED ===');
      console.log('[Session Restore] walletConnected:', walletConnected);
      console.log('[Session Restore] isConnecting:', isConnecting);

      // Guard against SSR - only run in browser
      if (typeof window === 'undefined') {
        console.log('[Session Restore] SSR detected - skipping');
        return;
      }

      // CRITICAL: Skip if already connecting (prevents overwriting new connection)
      if (isConnecting) {
        console.log('[Session Restore] ⚠️ Connection in progress - SKIPPING restoration to prevent override');
        return;
      }

      // Skip if already connected (prevents re-restoration loops)
      if (walletConnected) {
        console.log('[Session Restore] Already connected - skipping restoration');
        return;
      }

      // Skip auto-reconnect if forceNoWallet mode is enabled
      if (forceNoWallet) {
        console.log('[Session Restore] forceNoWallet mode - skipping');
        setIsAutoReconnecting(false);
        return;
      }

      try {
        console.log('[Session Restore] Attempting to restore session...');
        // Try new session format first (with decryption)
        const session = await restoreWalletSession();
        if (!session) {
          console.log('[Session Restore] No session found');
          setIsAutoReconnecting(false);
          return;
        }

        console.log('[Session Restore] Found valid session:', {
          walletName: session.walletName,
          stakeAddress: session.stakeAddress?.slice(0, 12) + '...',
          platform: session.platform,
          age: Math.floor((Date.now() - session.createdAt) / 1000 / 60) + ' minutes',
        });

        // Load cached Meks immediately for instant display
        // CRITICAL: Pass wallet address to validate cached Meks belong to this wallet
        const cachedMeks = getCachedMeks(session.stakeAddress);
        if (cachedMeks && cachedMeks.length > 0) {
          console.log('[Session Restore] Loading', cachedMeks.length, 'cached Meks for instant display');
          console.log('[Session Restore] First cached Mek:', cachedMeks[0]?.assetName);
          setOwnedMeks(cachedMeks);
        } else {
          console.log('[Session Restore] No cached Meks found or mismatched wallet');
        }

        // Validate session with Convex authentication
        // Set wallet address temporarily to trigger checkAuth query
        setWalletAddress(session.stakeAddress);

        // Wait a moment for checkAuth to execute
        await new Promise(resolve => setTimeout(resolve, 100));

        // Note: checkAuth query will be checked in the next render cycle
        // For now, we proceed with wallet reconnection optimistically

        // Check if wallet extension is still available
        // On hard refresh, wallet might not be loaded yet - wait up to 3 seconds
        const walletKey = session.walletName.toLowerCase();
        let walletAvailable = false;
        let retries = 0;
        const maxRetries = 6; // 6 retries = 3 seconds

        while (retries < maxRetries && !walletAvailable) {
          if (window.cardano && window.cardano[walletKey]) {
            walletAvailable = true;
            console.log('[Session Restore] Wallet extension found:', walletKey);
            break;
          }

          console.log(`[Session Restore] Waiting for wallet extension... (attempt ${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 500));
          retries++;
        }

        if (!walletAvailable) {
          console.log('[Session Restore] Wallet extension not available after waiting:', walletKey);
          clearWalletSession();
          setWalletAddress(null);
          setIsAutoReconnecting(false);
          return;
        }

        console.log('[Session Restore] Reconnecting wallet silently...');

        // Enable wallet silently
        const api = await window.cardano[walletKey].enable();

        setWalletConnected(true);
        // Use paymentAddress if available, otherwise fallback to stake address
        setPaymentAddress(session.paymentAddress || session.stakeAddress);
        setWalletType(walletKey);
        setIsSignatureVerified(true);

        // Only show loading if we don't have cached Meks
        const hasCachedMeks = cachedMeks && cachedMeks.length > 0;
        if (!hasCachedMeks) {
          setLoadingMeks(true);
        }

        console.log('[Session Restore] Wallet reconnected successfully');

        // Initialize with Blockfrost (server will handle existing data in background)
        const initResult = await initializeWithBlockfrost({
          walletAddress: session.stakeAddress, // Always use stake address as primary identifier
          stakeAddress: session.stakeAddress,
          walletType: walletKey,
          paymentAddresses: session.paymentAddress ? [session.paymentAddress] : []
        });

        if (initResult.success) {
          console.log(`[Session Restore] Loaded ${initResult.mekCount} Meks`);

          // Set ownedMeks from the result to display in UI
          const meks = initResult.meks || [];
          setOwnedMeks(meks);
          console.log('[Session Restore] Set ownedMeks state with', meks.length, 'Meks');
        }

        setLoadingMeks(false);
        setIsAutoReconnecting(false);

      } catch (error) {
        console.error('[Session Restore] Failed to restore session:', error);
        clearWalletSession();
        setWalletAddress(null);
        setIsAutoReconnecting(false);
      }
    };

    restoreWalletConnection();
  }, [forceNoWallet]);

  // Watch authentication status and clear session if expired
  useEffect(() => {
    // Skip auth check if we're currently auto-reconnecting from session restore
    if (isAutoReconnecting) {
      console.log('[Auth Check] Skipping check during session restore');
      return;
    }

    // Skip auth check for demo wallets
    if (walletAddress?.includes('demo') || walletType === 'Demo') {
      console.log('[Auth Check] Skipping auth check for demo wallet');
      return;
    }

    if (!walletConnected || !walletAddress || !checkAuth) {
      return;
    }

    console.log('[Auth Check] Authentication status:', checkAuth);

    // If authentication check shows not authenticated, clear session
    if (checkAuth.authenticated === false) {
      console.warn('[Auth Check] Session expired or invalid - clearing wallet connection');
      setToast({
        message: 'Your session has expired. Please reconnect your wallet.',
        type: 'info',
      });

      // Disconnect wallet
      setWalletConnected(false);
      setWalletAddress(null);
      setWalletType(null);
      setOwnedMeks([]);
      setIsSignatureVerified(false);
      clearWalletSession();
    } else if (checkAuth.authenticated === true) {
      console.log('[Auth Check] Session valid, expires at:', new Date(checkAuth.expiresAt || 0).toISOString());
    }
  }, [checkAuth?.authenticated, checkAuth?.expiresAt, walletConnected, walletAddress, walletType, isAutoReconnecting]);

  // Original useEffect continues below
  useEffect(() => {
    // Skip auth check for demo wallets
    if (walletAddress?.includes('demo') || walletType === 'Demo') {
      return;
    }

    // Only check auth if we're connected, verified, NOT currently connecting, AND not auto-reconnecting
    if (authStatus && walletConnected && isSignatureVerified && !isConnecting && !isAutoReconnecting) {
      if (!authStatus.authenticated) {
        console.log('[Auth Status] Backend authentication expired - clearing signature verification');
        console.log('[Auth Status] This will trigger signature prompt on next connection');

        // Clear the session
        localStorage.removeItem('mek_wallet_session');

        // Clear signature verification to trigger the prompt
        setIsSignatureVerified(false);
      } else {
        console.log('[Auth Status] Backend authentication valid - session persists');
      }
    }
  }, [authStatus, walletConnected, isSignatureVerified, isConnecting, walletAddress, walletType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    // Guard against SSR
    if (typeof document === 'undefined') {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.sort-dropdown-container')) {
        setSortDropdownOpen(false);
      }
      if (!target.closest('.wallet-filter-dropdown-container')) {
        setWalletFilterDropdownOpen(false);
      }
    };

    if (sortDropdownOpen || walletFilterDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [sortDropdownOpen, walletFilterDropdownOpen]);

  // Restore and sync verification status from goldMiningData
  useEffect(() => {
    if (goldMiningData && walletConnected) {
      // Sync verification status with database (reactive to changes)
      if (goldMiningData.isVerified && (!verificationStatus || !verificationStatus.verified)) {
        console.log('[Verification Status] Restoring verified status from database');
        setVerificationStatus({
          verified: true,
          source: 'database',
          lastVerified: goldMiningData.lastVerificationTime || Date.now()
        });
      } else if (!goldMiningData.isVerified && verificationStatus?.verified) {
        console.log('[Verification Status] Detected unverified status - clearing verification');
        setVerificationStatus(null);
      }
    }
  }, [goldMiningData?.isVerified, walletConnected]);

  // Update cached Meks in localStorage whenever they change
  useEffect(() => {
    if (walletConnected && ownedMeks.length > 0) {
      updateCachedMeks(ownedMeks);
    }
  }, [ownedMeks, walletConnected]);

  // Sync level and boost data from goldMiningData and mekLevels into ownedMeks
  // CRITICAL: This also syncs new Meks added to goldMining.ownedMeks (e.g., from Blockfrost verification)
  // UPDATED: Now uses groupMeks to show ALL Meks from ALL wallets in the corporation
  // Debounced to prevent excessive recalculations on rapid data changes
  useEffect(() => {
    // Use groupMeks if available (includes all wallets in corporation)
    const mekSource = groupMeks?.meks || goldMiningData?.ownedMeks;

    if (!mekSource) {
      return;
    }

    // CRITICAL FIX: If ownedMeks is empty BUT we have Meks from group, populate from database
    if (ownedMeks.length === 0 && mekSource.length > 0) {
      console.log('[Level Sync] INITIAL SYNC: Populating ownedMeks from group:', mekSource.length, 'Meks');
      setOwnedMeks(mekSource as MekAsset[]);
      return;
    }

    // Debounce the sync operation by 150ms to batch rapid updates
    const syncTimeout = setTimeout(() => {
      console.log('[Level Sync] Syncing level data from group/goldMiningData and mekLevels');
      console.log('[Level Sync] Database has', mekSource.length, 'Meks');
      console.log('[Level Sync] UI state has', ownedMeks.length, 'Meks');
      console.log('[Level Sync] mekLevels data:', mekLevels?.length || 0, 'levels loaded');
      console.log('[Level Sync] goldMiningData.totalGoldPerHour:', goldMiningData?.totalGoldPerHour);

      // Create a map of source meks for quick lookup
      const sourceMekMap = new Map(
        mekSource.map(mek => [mek.assetId, mek])
      );

      // Create a map of existing ownedMeks for quick lookup
      const existingMekMap = new Map(
        ownedMeks.map(mek => [mek.assetId, mek])
      );

      // Create a map of mekLevels for quick lookup
      const mekLevelMap = new Map(
        (mekLevels || []).map(level => [level.assetId, level])
      );

      // CRITICAL FIX: Build full Mek list from source (group or goldMiningData), not just update existing ones
      // This ensures new Meks added to the database appear in the UI
      const updatedMeks = mekSource.map(dbMek => {
        const existingMek = existingMekMap.get(dbMek.assetId);
        const mekLevel = mekLevelMap.get(dbMek.assetId);

        // Use level from mekLevels if available, otherwise default to 1
        const currentLevel = mekLevel?.currentLevel || dbMek.currentLevel || 1;
        const levelBoostAmount = mekLevel?.currentBoostAmount || dbMek.levelBoostAmount || 0;

        // Calculate the base rate (without boost)
        const baseRate = dbMek.baseGoldPerHour || dbMek.goldPerHour - levelBoostAmount;

        // Calculate effective gold per hour (base + boost)
        const effectiveGoldPerHour = baseRate + levelBoostAmount;

        // Merge existing UI state (like animations, selections) with database state
        return {
          ...(existingMek || {}), // Preserve any UI-only fields
          ...dbMek, // Use database as source of truth
          baseGoldPerHour: baseRate,
          levelBoostAmount: levelBoostAmount,
          currentLevel: currentLevel,
          goldPerHour: effectiveGoldPerHour,
        } as MekAsset;
      });

      // Detect if there are changes (count changed OR any properties changed)
      const hasCountChange = updatedMeks.length !== ownedMeks.length;
      const hasPropertyChanges = !hasCountChange && updatedMeks.some((mek, idx) => {
        const existingMek = ownedMeks[idx];
        return (
          mek.levelBoostAmount !== existingMek?.levelBoostAmount ||
          mek.currentLevel !== existingMek?.currentLevel ||
          mek.baseGoldPerHour !== existingMek?.baseGoldPerHour ||
          mek.goldPerHour !== existingMek?.goldPerHour
        );
      });

      if (hasCountChange || hasPropertyChanges) {
        if (hasCountChange) {
          console.log('[Level Sync] 🔄 MEK COUNT CHANGED:', ownedMeks.length, '→', updatedMeks.length);
          console.log('[Level Sync] Added', updatedMeks.length - ownedMeks.length, 'new Meks from database');
        }
        console.log('[Level Sync] Found changes, updating meks:',
          updatedMeks.slice(0, 3).map(m => ({
            assetId: m.assetId.slice(-8),
            level: m.currentLevel,
            baseRate: m.baseGoldPerHour,
            boost: m.levelBoostAmount,
            effectiveRate: m.goldPerHour
          })));
        setOwnedMeks(updatedMeks);

        // Also update the total gold per hour
        const newTotalRate = updatedMeks.reduce((sum, mek) => sum + mek.goldPerHour, 0);
        setGoldPerHour(newTotalRate);
      }
    }, 150); // 150ms debounce delay

    // Cleanup: cancel pending sync if dependencies change again
    return () => clearTimeout(syncTimeout);
  }, [groupMeks?.meks, goldMiningData?.ownedMeks, mekLevels]); // Include groupMeks, goldMiningData, and mekLevels in dependencies

  // Close dropdown when clicking outside
  useEffect(() => {
    // Guard against SSR
    if (typeof document === 'undefined') {
      return;
    }

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

  // Show company name modal if wallet is connected but no company name is set
  useEffect(() => {
    if (walletConnected && companyNameData && !companyNameData.hasCompanyName) {
      setCompanyNameModalMode('initial');
      setShowCompanyNameModal(true);
    }
  }, [walletConnected, companyNameData]);

  // Lightbox events now handled by GlobalLightboxHandler in layout.tsx

  // Sync wallet address to localStorage whenever it changes (for other components to access)
  useEffect(() => {
    if (walletAddress && walletAddress !== 'null' && !walletAddress.includes('demo')) {
      console.log('[Wallet Sync] Saving wallet to localStorage:', walletAddress?.slice(0, 15) + '...');
      localStorage.setItem('stakeAddress', walletAddress);
    } else if (!walletAddress) {
      console.log('[Wallet Sync] No wallet to save');
    }
  }, [walletAddress]);

  // Listen for mechanism-grid lightbox open events from navigation buttons
  useEffect(() => {
    const handleOpenLightbox = (event: CustomEvent) => {
      const lightboxId = event.detail?.lightboxId;
      if (lightboxId === 'mechanism-grid') {
        console.log('[Page] Opening Mechanism Grid lightbox from navigation button');
        setShowMechanismGridLightbox(true);
      }
    };

    window.addEventListener('openLightbox', handleOpenLightbox as EventListener);
    return () => {
      window.removeEventListener('openLightbox', handleOpenLightbox as EventListener);
    };
  }, []);

  // Initialize app on mount
  useEffect(() => {
    // Guard against SSR
    if (typeof window === 'undefined') {
      return;
    }

    // DEMO MODE: Initialize with demo data and skip wallet detection
    if (isDemoMode) {
      console.log('[DEMO MODE] Initializing with mock data...');
      setWalletConnected(true);
      setWalletAddress('stake1demo_test_wallet');
      setWalletType('Demo');
      setOwnedMeks(DEMO_MEKS);
      setIsAutoReconnecting(false);
      // Start with 30,000 gold for testing leveling
      setCurrentGold(30000);
      // Auto-complete blockchain verification in demo mode
      setIsSignatureVerified(true);
      setIsVerifyingBlockchain(false);
      setVerificationStatus({ isVerified: true, status: 'verified' });
      setShowVerificationPanel(false); // Hide verification panel
      return; // Skip wallet detection and auto-reconnect
    }

    // Check for available wallets immediately
    detectAvailableWallets();

    // Re-check after delays to catch slow-loading wallet extensions
    // Eternl often loads slower than other wallets
    const walletDetectionRetries = [
      setTimeout(() => detectAvailableWallets(), 500),   // 0.5s
      setTimeout(() => detectAvailableWallets(), 1000),  // 1s
      setTimeout(() => detectAvailableWallets(), 2000),  // 2s
    ];

    // Failsafe: Always turn off auto-reconnecting after max 5 seconds
    const failsafeTimeout = setTimeout(() => {
      console.log('[Auto-Reconnect] Failsafe timeout - turning off loading screen');
      setIsAutoReconnecting(false);
    }, 5000);

    // Auto-reconnect if previously connected (session persistence)
    setTimeout(async () => {
      try {
        // Guard against SSR
        if (typeof window === 'undefined') {
          setIsAutoReconnecting(false);
          clearTimeout(failsafeTimeout);
          return;
        }

        const savedWallet = localStorage.getItem('goldMiningWallet');
        const savedWalletType = localStorage.getItem('goldMiningWalletType');

        if (savedWallet && savedWalletType && window.cardano && window.cardano[savedWalletType]) {
          console.log('Auto-reconnecting to', savedWalletType, 'wallet...');

          const walletApi = window.cardano[savedWalletType];
          if (walletApi) {
            const wallet: WalletInfo = {
              name: savedWalletType.charAt(0).toUpperCase() + savedWalletType.slice(1),
              icon: `/wallet-icons/${savedWalletType}.png`,
              version: walletApi.apiVersion || '0.1.0',
              api: walletApi
            };

            // Automatically reconnect to the wallet (with timeout protection)
            await connectWallet(wallet);
          }
        }
      } catch (error) {
        console.error('[Auto-Reconnect] Error during auto-reconnect:', error);
      } finally {
        // Always set auto-reconnecting to false after attempt
        setIsAutoReconnecting(false);
        clearTimeout(failsafeTimeout);
      }
    }, 1500); // Wait for cardano object to be available

    // Cleanup function
    return () => {
      clearTimeout(failsafeTimeout);
      walletDetectionRetries.forEach(timeout => clearTimeout(timeout));
    };
  }, [isDemoMode]);

  // DEMO MODE: Continuous gold accumulation (optimized with throttling)
  useEffect(() => {
    if (!isDemoMode) return;

    // Calculate total gold per hour from demo Meks (70.56 total)
    const totalGoldPerHour = DEMO_MEKS.reduce((sum, mek) => sum + mek.goldPerHour, 0);
    const goldPerSecond = totalGoldPerHour / 3600;

    let lastTimestamp = performance.now();
    let lastStateUpdate = performance.now();
    let accumulatedGold = 0;
    let animationFrameId: number;

    const accumulateGold = (timestamp: number) => {
      const deltaTime = (timestamp - lastTimestamp) / 1000; // Convert to seconds
      lastTimestamp = timestamp;

      // Accumulate gold every frame for accuracy
      accumulatedGold += goldPerSecond * deltaTime;

      // But only update state every 100ms to prevent excessive re-renders (10 FPS instead of 60 FPS)
      if (timestamp - lastStateUpdate >= 100) {
        setCurrentGold(prev => prev + accumulatedGold);
        accumulatedGold = 0; // Reset accumulator after state update
        lastStateUpdate = timestamp;
      }

      animationFrameId = requestAnimationFrame(accumulateGold);
    };

    // Start accumulation
    animationFrameId = requestAnimationFrame(accumulateGold);

    // Cleanup on unmount or when demo mode changes
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isDemoMode]);

  // Listen for wallet account changes (CIP-30 experimental API)
  useEffect(() => {
    // Only set up listener if wallet is connected and we have an API reference
    if (!walletConnected || !walletApiRef.current) {
      return;
    }

    const handleAccountChange = () => {
      console.log('[Wallet Account Change] Detected account switch in wallet extension');

      // SECURITY: If user is adding a wallet, allow the switch without disconnecting
      // They need to switch to the new wallet to sign the ownership proof
      if (isAddingWallet) {
        console.log('[Wallet Account Change] User is adding wallet - allowing switch without disconnect');
        setToast({
          message: 'ℹ️ Wallet switched - sign with the new wallet to verify ownership',
          type: 'info'
        });
        return; // Don't disconnect
      }

      // Normal case: unexpected wallet change, disconnect for security
      setToast({
        message: '⚠️ Wallet account changed - disconnecting for security',
        type: 'info'
      });

      // Auto-disconnect after brief delay to allow user to see notification
      setTimeout(() => {
        disconnectWallet();
      }, 2000);
    };

    // Delay listener setup to avoid false positives during initial connection
    // Wait 3 seconds after wallet connects before monitoring for account changes
    const setupDelay = setTimeout(() => {
      // Try to set up the account change listener
      // CIP-30 wallets may have experimental.on() method
      try {
        const api = walletApiRef.current;

        if (api && api.experimental && typeof api.experimental.on === 'function') {
          console.log('[Wallet Account Change] Setting up account change listener (after delay)');
          api.experimental.on('accountChange', handleAccountChange);
        } else {
          console.log('[Wallet Account Change] Wallet does not support account change events');
        }
      } catch (error) {
        console.warn('[Wallet Account Change] Failed to set up listener:', error);
      }
    }, 3000);

    // Cleanup function
    return () => {
      clearTimeout(setupDelay);
      try {
        const api = walletApiRef.current;
        if (api && api.experimental && typeof api.experimental.off === 'function') {
          console.log('[Wallet Account Change] Removing account change listener');
          api.experimental.off('accountChange', handleAccountChange);
        }
      } catch (error) {
        console.warn('[Wallet Account Change] Failed to remove listener:', error);
      }
    };
  }, [walletConnected, walletAddress, isAddingWallet]); // Added isAddingWallet to ensure handleAccountChange has latest flag value

  // Detect available Cardano wallets
  const detectAvailableWallets = () => {
    const wallets: WalletInfo[] = [];

    // Check if on mobile
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      navigator.userAgent.toLowerCase()
    );

    if (isMobile) {
      // On mobile, show all major wallets as they use deep links
      const mobileWallets = [
        { name: 'Eternl', icon: '/wallet-icons/eternl.png' },
        { name: 'Flint', icon: '/wallet-icons/flint.png' },
        { name: 'Yoroi', icon: '/wallet-icons/yoroi.png' },
        { name: 'Vespr', icon: '/wallet-icons/vespr.png' },
        { name: 'Typhon', icon: '/wallet-icons/typhon.png' },
        { name: 'NuFi', icon: '/wallet-icons/nufi.png' },
        { name: 'Lace', icon: '/wallet-icons/lace.png' },
      ];

      mobileWallets.forEach(wallet => {
        wallets.push({
          name: wallet.name,
          icon: wallet.icon,
          version: 'mobile',
          api: null // Mobile wallets use deep links, not direct API
        });
      });

      console.log('[WALLET DETECTION] Mobile device detected, showing all wallet options');
    } else if (typeof window !== 'undefined' && window.cardano) {
      // Desktop: Check for browser extensions
      const walletNames = ['lace', 'nami', 'eternl', 'flint', 'yoroi', 'typhon', 'gerowallet', 'nufi', 'vespr'];

      walletNames.forEach(name => {
        if (window.cardano[name]) {
          wallets.push({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            icon: `/wallet-icons/${name}.png`,
            version: window.cardano[name].apiVersion || '0.1.0',
            api: window.cardano[name]
          });
        }
      });
    }

    console.log('[WALLET DETECTION]', {
      timestamp: new Date().toISOString(),
      walletsFound: wallets.length,
      walletNames: wallets.map(w => w.name),
      platform: isMobile ? 'mobile' : 'desktop',
      cardanoObject: typeof window !== 'undefined' && window.cardano ? Object.keys(window.cardano) : []
    });

    // Only update if the wallet list actually changed to prevent unnecessary re-renders
    setAvailableWallets(prevWallets => {
      const hasChanged = prevWallets.length !== wallets.length ||
                        prevWallets.some((w, i) => w.name !== wallets[i]?.name);
      return hasChanged ? wallets : prevWallets;
    });
  };

  // Cancel connection attempt
  const cancelConnection = () => {
    console.log('[Wallet Connect] User cancelled connection');

    // Stop polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Reset state
    setIsConnecting(false);
    setConnectionStatus('');
    setShowConnectionStatus(false); // Hide connection status modal
    connectionLockRef.current = false;

    // Don't set error - just close silently
  };

  // Connect wallet with signature verification
  const connectWallet = async (wallet: WalletInfo) => {
    // Prevent multiple simultaneous connection attempts
    if (connectionLockRef.current) {
      console.log('[Wallet Connect] Connection already in progress - ignoring duplicate request');
      return;
    }

    console.log('[Wallet Connect] === STARTING CONNECTION TO', wallet.name, '===');
    console.log('[Wallet Connect] Current state BEFORE clearing:');
    console.log('[Wallet Connect]   - walletAddress:', walletAddress);
    console.log('[Wallet Connect]   - ownedMeks count:', ownedMeks.length);
    console.log('[Wallet Connect]   - currentGold:', currentGold);
    console.log('[Wallet Connect]   - walletConnected:', walletConnected);

    // CRITICAL: Clear old session data before connecting new wallet
    console.log('[Wallet Connect] Step 1: Clearing localStorage...');
    clearWalletSession();
    console.log('[Wallet Connect] Step 2: Clearing React state...');
    setWalletAddress(null);
    setPaymentAddress(null);
    setWalletConnected(false);
    setWalletType(null);
    setOwnedMeks([]);
    setSelectedMek(null);
    setIsSignatureVerified(false);
    setCurrentGold(0);
    setCumulativeGold(0);
    setGoldPerHour(0);
    setVerificationStatus(null);
    console.log('[Wallet Connect] All old data cleared');

    connectionLockRef.current = true;
    setIsConnecting(true);
    setConnectionStatus('Initializing wallet connection...');
    setWalletError(null);

    try {
      // Check if this is a mobile wallet (api is null for mobile)
      if (wallet.api === null) {
        console.log('[Wallet Connect - Mobile] 📱 Mobile wallet detected:', wallet.name);

        const walletName = wallet.name.toLowerCase();

        // FIRST: Check if we're already in a wallet WebView
        const { isWalletWebView } = await import('@/lib/mobileWalletSupport');
        const webViewCheck = isWalletWebView();

        if (webViewCheck.isWebView) {
          console.log('[Wallet Connect - Mobile] 🌐 WebView detected! Attempting direct connection...');
          setConnectionStatus('You are in a wallet WebView - connecting directly...');

          // We're in a WebView, window.cardano should be available
          const walletKey = walletName === 'eternl' ? 'eternl' : walletName;

          if (!window.cardano || !(window.cardano as any)[walletKey]) {
            // WebView detected but API not available yet - wait briefly
            console.log('[Wallet Connect - Mobile] ⏳ WebView detected but API not ready, waiting...');
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          if (window.cardano && (window.cardano as any)[walletKey]) {
            console.log('[Wallet Connect - Mobile] ✅ Direct WebView connection available!');
            // Skip deep-link flow, proceed directly to wallet.enable()
            const walletApi = (window.cardano as any)[walletKey];
            wallet.api = walletApi; // Update wallet object with the API
            // Fall through to the desktop connection flow below
          } else {
            // WebView detected but wallet API still not available
            const errorMsg = `WebView detected but ${wallet.name} API not available. Please try again.`;
            console.error('[Wallet Connect - Mobile] ❌', errorMsg);
            setWalletError(errorMsg);
            connectionLockRef.current = false;
            setIsConnecting(false);
            setConnectionStatus('');
            setShowConnectionStatus(false);
            return;
          }
        } else {
          // Not in WebView - need to use deep-link or instructions
          console.log('[Wallet Connect - Mobile] 📱 Regular mobile browser detected');

          // Only Flint and Vespr support deep links reliably
          const supportsDeepLink = wallet.name === 'Flint' || wallet.name === 'Vespr';

          if (!supportsDeepLink) {
            // Show instructions modal for wallets without deep link support
            console.log('[Wallet Connect - Mobile] 📋 Showing DApp browser instructions for:', wallet.name);

            // Create instructions based on wallet
            let instructions = '';
            if (wallet.name === 'Eternl') {
              instructions = `To connect with ${wallet.name}:\n\n` +
                `1. Tap "Copy URL" button below\n` +
                `2. Open your ${wallet.name} app\n` +
                `3. Tap the "DApps" tab (bottom right corner)\n` +
                `4. Paste the copied URL in the address field\n` +
                `5. Tap Submit/Go\n` +
                `6. Connect your wallet normally`;
            } else {
              instructions = `To connect with ${wallet.name}:\n\n` +
                `1. Tap "Copy URL" button below\n` +
                `2. Open your ${wallet.name} app\n` +
                `3. Find the DApp browser or Browse tab\n` +
                `4. Paste the URL: mek.overexposed.io\n` +
                `5. Connect your wallet normally`;
            }

            setWalletInstructions(instructions); // Show instructions modal instead of error

            connectionLockRef.current = false;
            setIsConnecting(false);
            setConnectionStatus('');
            setShowConnectionStatus(false);
            return;
          }

          // For Flint and Vespr: Try to open wallet app via deep link
          console.log('[Wallet Connect - Mobile] 🔗 Attempting deep link for:', wallet.name);
        }

        // Only execute deep-link flow if not in WebView
        if (!webViewCheck.isWebView) {
          const { openMobileWallet } = await import('@/lib/mobileWalletSupport');

          // IMPORTANT: Mobile wallets need a publicly accessible URL
          // Localhost URLs don't work because the wallet app can't reach your computer
          let dappUrl = window.location.origin + window.location.pathname;

          // If on localhost, use production URL for mobile wallet connections
          if (dappUrl.includes('localhost') || dappUrl.includes('127.0.0.1')) {
            dappUrl = 'https://mek.overexposed.io';
            console.log('[Wallet Connect - Mobile] 🔄 Localhost detected, using production URL:', dappUrl);
          }

          try {
            setConnectionStatus('Opening wallet app...');
            setShowConnectionStatus(true); // Show dismissible modal
            console.log('[Wallet Connect - Mobile] 🔗 Opening deep link for:', walletName, 'URL:', dappUrl);

          // Open the wallet app
          await openMobileWallet(walletName as any, dappUrl, 5000);

          console.log('[Wallet Connect - Mobile] ✓ Deep link opened successfully');
          setConnectionStatus('Waiting for wallet to return...');

          setToast({
            message: `Opening ${wallet.name}... Please approve the connection in the wallet app.`,
            type: 'info'
          });

          // Wait for wallet to inject window.cardano API when user returns
          console.log('[Wallet Connect - Mobile] 🔄 Starting to poll for window.cardano API injection...');
          setConnectionStatus('Please approve in wallet app, then return here...');

          // Poll for window.cardano with the wallet's API
          const maxAttempts = 120; // 60 seconds total (500ms intervals) - increased for mobile
          let attempts = 0;
          const walletKey = walletName === 'eternl' ? 'eternl' : walletName;

          // Track visibility changes
          let userReturnedToApp = false;
          const visibilityHandler = () => {
            const isVisible = !document.hidden;
            console.log('[Wallet Connect - Mobile] 👁️ Visibility changed:', {
              isVisible,
              timestamp: new Date().toISOString()
            });

            if (isVisible && !userReturnedToApp) {
              userReturnedToApp = true;
              console.log('[Wallet Connect - Mobile] ✓ User returned to dApp from wallet');
              setConnectionStatus('Checking for wallet connection...');
            }
          };

          document.addEventListener('visibilitychange', visibilityHandler);

          const pollForWallet = async (): Promise<any> => {
            return new Promise((resolve, reject) => {
              const pollInterval = setInterval(() => {
                attempts++;

                // Store interval in ref for cancellation
                pollingIntervalRef.current = pollInterval;

                // Log every 4 attempts (every 2 seconds)
                if (attempts % 4 === 0) {
                  console.log('[Wallet Connect - Mobile] 🔍 Polling status:', {
                    attempt: `${attempts}/${maxAttempts}`,
                    elapsed: `${(attempts * 0.5).toFixed(1)}s`,
                    walletKey,
                    isVisible: !document.hidden,
                    userReturned: userReturnedToApp,
                    cardanoExists: !!(window.cardano),
                    walletAPIExists: !!(window.cardano && (window.cardano as any)[walletKey])
                  });
                }

                // Check if wallet API is now available
                if (typeof window !== 'undefined' && window.cardano && (window.cardano as any)[walletKey]) {
                  clearInterval(pollInterval);
                  pollingIntervalRef.current = null;
                  document.removeEventListener('visibilitychange', visibilityHandler);
                  console.log('[Wallet Connect - Mobile] ✅ Found wallet API!', {
                    walletName,
                    attempts,
                    timeElapsed: `${(attempts * 0.5).toFixed(1)}s`,
                    apiVersion: (window.cardano as any)[walletKey]?.apiVersion
                  });
                  resolve((window.cardano as any)[walletKey]);
                  return;
                }

                // Timeout after max attempts
                if (attempts >= maxAttempts) {
                  clearInterval(pollInterval);
                  pollingIntervalRef.current = null;
                  document.removeEventListener('visibilitychange', visibilityHandler);
                  console.error('[Wallet Connect - Mobile] ❌ Timeout waiting for wallet API:', {
                    walletName,
                    maxAttempts,
                    userReturned: userReturnedToApp,
                    cardanoExists: !!(window.cardano)
                  });
                  reject(new Error(`Timeout waiting for ${wallet.name} to inject API. Please try again.`));
                }
              }, 500);
            });
          };

          try {
            // Wait for wallet API to become available
            const walletApi = await pollForWallet();
            console.log('[Wallet Connect - Mobile] 🔌 Wallet API detected, updating wallet object...');

            // CRITICAL FIX: Update wallet object with injected API
            wallet.api = walletApi;
            wallet.version = walletApi.apiVersion || '1.0.0';

            console.log('[Wallet Connect - Mobile] ⚡ Updated wallet object:', {
              name: wallet.name,
              version: wallet.version,
              hasAPI: !!wallet.api
            });

            // CRITICAL FIX: Don't duplicate logic - fall through to desktop flow
            // The desktop flow handles: enable(), stake address, signature, Mek extraction, session save
            console.log('[Wallet Connect - Mobile] ➡️ Proceeding to desktop flow for full connection...');

          } catch (pollError: any) {
            console.error('[Wallet Connect - Mobile] ❌ Error during wallet API polling:', {
              error: pollError.message,
              stack: pollError.stack,
              walletName
            });
            setWalletError(pollError.message || `Failed to connect to ${wallet.name} after approval`);
            setToast({
              message: pollError.message || `Failed to complete ${wallet.name} connection`,
              type: 'error'
            });
            connectionLockRef.current = false;
            setIsConnecting(false);
            setConnectionStatus('');
            setShowConnectionStatus(false); // Hide connection status modal
            return;
          }

          // NOTE: We DON'T return here - we fall through to the desktop flow below

          } catch (deepLinkError: any) {
          console.log('[Wallet Connect - Mobile] 📋 Deep link failed - showing instructions instead');

          // Don't show error - show helpful instructions instead
          const instructions = wallet.name === 'Flint' || wallet.name === 'Vespr'
            ? `Could not open ${wallet.name} app. Please make sure it's installed on your device.\n\n` +
              `Alternative method:\n` +
              `1. Tap "Copy URL" button below\n` +
              `2. Open your ${wallet.name} app\n` +
              `3. Use the built-in browser\n` +
              `4. Paste the URL: mek.overexposed.io`
            : `To connect with ${wallet.name}:\n\n` +
              `1. Tap "Copy URL" button below\n` +
              `2. Open your ${wallet.name} app\n` +
              `3. Find the DApp browser or Browse tab\n` +
              `4. Paste the URL: mek.overexposed.io\n` +
              `5. Connect your wallet normally`;

          setWalletInstructions(instructions);
          setToast({
            message: `${wallet.name} not installed. Please install it from the App Store.`,
            type: 'error'
          });
          connectionLockRef.current = false;
          setIsConnecting(false);
          setConnectionStatus('');
          setShowConnectionStatus(false); // Hide connection status modal
          return;
          }
        }
      }

      // Desktop wallet flow (has wallet.api)
      // Direct wallet connection (rate limiting handled by backend)
      console.log('[Wallet Connect] Calling wallet.api.enable()...');

      // Enable wallet with 30 second timeout
      const walletApi = await Promise.race([
        wallet.api.enable(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Wallet connection timeout after 30 seconds')), 30000)
        )
      ]) as any;

      // Get stake addresses (used for NFT ownership)
      const stakeAddresses = await walletApi.getRewardAddresses();

          if (!stakeAddresses || stakeAddresses.length === 0) {
            throw new Error("No stake addresses found in wallet");
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
          console.log('[Wallet Connect] Stake address converted:', stakeAddressRaw.substring(0, 20), '->', stakeAddress.substring(0, 20));

          // Check if already authenticated - skip signature if valid session exists
          console.log('[Reconnect Flow] Step 1: Checking existing authentication...');
          console.log('[Reconnect Flow] Stake address to check:', stakeAddress);
          console.log('[Reconnect Flow] Current time:', new Date().toISOString());
          let existingAuth = null;

          try {
            // Check if Convex client is available
            // Note: 'api' here refers to Convex API (imported at top), not wallet API
            if (!convex) {
              console.warn('[Reconnect Flow] Convex client not initialized, skipping auth check');
            } else {
              const authCheckStartTime = Date.now();
              existingAuth = await convex.query(api.walletAuthentication.checkAuthentication, {
                stakeAddress
              });
              const authCheckEndTime = Date.now();
              console.log('[Reconnect Flow] Step 2: Auth check complete in', authCheckEndTime - authCheckStartTime, 'ms');
              console.log('[Reconnect Flow] Step 2: Found auth result:', JSON.stringify(existingAuth, null, 2));
            }
          } catch (authCheckError) {
            console.error('[Reconnect Flow] ERROR checking authentication:', authCheckError);
            // Continue without existing auth - will request signature
          }

          let signatureVerified = false;
          let verifiedNonce = ''; // Store nonce for session management

          if (existingAuth && existingAuth.authenticated) {
            console.log('[Reconnect Flow] ✓✓✓ PROBLEM: Valid session found - skipping signature request ✓✓✓');
            console.log('[Reconnect Flow] Session details:');
            console.log('[Reconnect Flow]   - Authenticated:', existingAuth.authenticated);
            console.log('[Reconnect Flow]   - Expires at:', new Date(existingAuth.expiresAt || 0).toISOString());
            console.log('[Reconnect Flow]   - Wallet name:', existingAuth.walletName);
            console.log('[Reconnect Flow]   - Session ID:', existingAuth.sessionId);
            console.log('[Reconnect Flow]   - Is legacy:', existingAuth.legacy);
            console.log('[Reconnect Flow] THIS IS WHY SIGNATURE IS BEING SKIPPED!');
            signatureVerified = true;
            setIsSignatureVerified(true);
            setConnectionStatus('Valid session found - connecting...');
          } else {
            console.log('[Reconnect Flow] ✓✓✓ CORRECT: No valid session - requesting signature... ✓✓✓');
            console.log('[Reconnect Flow] Auth result:', existingAuth);
            // Generate nonce for signature verification - REQUIRED
            try {
              console.log('[Wallet Connect] Generating secure nonce...');

              // Get a payment address for signing (signData requires bech32 format, not hex)
              // Try multiple methods since new/unused wallets may not have "used" addresses
              console.log('[🔑ADDR] Fetching addresses from wallet...');

              let addressHex: string | null = null;
              let addressSource = '';

              // Method 1: Try getUsedAddresses() first (addresses with transaction history)
              try {
                const usedAddressesHex = await walletApi.getUsedAddresses();
                if (usedAddressesHex && usedAddressesHex.length > 0) {
                  addressHex = usedAddressesHex[0];
                  addressSource = 'used addresses';
                  console.log('[🔑ADDR] Found address via getUsedAddresses()');
                  console.log('[🔑ADDR] Total used addresses:', usedAddressesHex.length);
                } else {
                  console.log('[🔑ADDR] No used addresses found - trying unused addresses...');
                }
              } catch (err) {
                console.log('[🔑ADDR] getUsedAddresses() failed:', err);
              }

              // Method 2: Try getUnusedAddresses() (addresses generated but not yet used on-chain)
              if (!addressHex) {
                try {
                  const unusedAddressesHex = await walletApi.getUnusedAddresses();
                  if (unusedAddressesHex && unusedAddressesHex.length > 0) {
                    addressHex = unusedAddressesHex[0];
                    addressSource = 'unused addresses';
                    console.log('[🔑ADDR] Found address via getUnusedAddresses()');
                    console.log('[🔑ADDR] Total unused addresses:', unusedAddressesHex.length);
                  } else {
                    console.log('[🔑ADDR] No unused addresses found - trying change address...');
                  }
                } catch (err) {
                  console.log('[🔑ADDR] getUnusedAddresses() failed:', err);
                }
              }

              // Method 3: Fall back to getChangeAddress() (always available, current receiving address)
              if (!addressHex) {
                try {
                  addressHex = await walletApi.getChangeAddress();
                  addressSource = 'change address';
                  console.log('[🔑ADDR] Found address via getChangeAddress()');
                } catch (err) {
                  console.log('[🔑ADDR] getChangeAddress() failed:', err);
                }
              }

              // Final check - if still no address, throw error
              if (!addressHex) {
                throw new Error('Unable to retrieve any address from wallet. Please ensure your wallet is properly initialized and has at least one account.');
              }

              console.log('[🔑ADDR] Successfully retrieved address from:', addressSource);
              console.log('[🔑ADDR] Raw address (CBOR hex):', addressHex.substring(0, 40) + '...');

              // Convert from CBOR hex to bech32 format (CIP-30 requirement for signData)
              const paymentAddress = hexToBech32(addressHex);
              console.log('[🔑ADDR] Converted to bech32:', paymentAddress.substring(0, 20) + '...');
              console.log('[🔑ADDR] Network:', paymentAddress.startsWith('addr1') ? 'mainnet' : 'testnet');

              // Use secure nonce generation
              const nonceResult = await generateSecureNonce({
                stakeAddress,
                walletName: wallet.name,
                generateNonceMutation: generateNonce,
                updateState: (update) => {
                  if (update.originVerified) {
                    console.log('[Secure Connect] Origin validated');
                  }
                  if (update.nonceGenerated) {
                    console.log('[Secure Connect] Secure nonce generated');
                  }
                }
              });
              verifiedNonce = nonceResult.nonce; // Save nonce
              console.log('[Wallet Connect] Secure nonce generated successfully');

            // Request signature from wallet with 60 second timeout - MANDATORY (using payment address)
            console.log('[Wallet Connect] Requesting signature from user...');
            console.log('[🔑SIGN] Address parameter:', paymentAddress.substring(0, 30) + '...');
            console.log('[🔑SIGN] Message hex:', Buffer.from(nonceResult.message).toString('hex').substring(0, 60) + '...');
            console.log('[🔑SIGN] Calling walletApi.signData()...');
            setConnectionStatus('Awaiting signature from wallet...');
            const signature = await Promise.race([
              walletApi.signData(
                paymentAddress,
                Buffer.from(nonceResult.message).toString('hex')
              ),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Signature request timeout or cancelled after 60 seconds')), 60000)
              )
            ]) as any;
            console.log('[Wallet Connect] Signature received');
            setConnectionStatus('Signature received! Verifying...');

            // Verify signature with retry logic - MUST SUCCEED
            const verificationResult = await verifySignatureWithRetry({
              stakeAddress,
              walletName: wallet.name,
              signature: signature.signature || signature,
              nonce: nonceResult.nonce,
              verifySignatureAction: verifySignature,
              generateNonceMutation: generateNonce,
              signDataFunction: async (addr, payload) => {
                const sig = await walletApi.signData(paymentAddress, payload);
                return sig.signature || sig;
              },
              updateState: (update) => {
                if (update.signatureVerified) {
                  console.log('[Secure Connect] Signature verified');
                }
                if (update.retryAttempt) {
                  console.log('[Secure Connect] Retry attempt:', update.retryAttempt);
                  setConnectionStatus(`Retrying verification (${update.retryAttempt}/2)...`);
                }
              },
              maxRetries: 2
            });

            if (!verificationResult.success || !verificationResult.verified) {
              throw new Error(verificationResult.error || 'Signature verification failed');
            }

            signatureVerified = true;
            setIsSignatureVerified(true);

            // Show toast notification immediately after signature
            setToast({
              message: '✓ Signature verified securely! Connecting...',
              type: 'info'
            });
            setIsProcessingSignature(true);
          } catch (sigError: any) {
            console.error('[Wallet Connect] Signature verification failed:', sigError);
            console.error('[Wallet Connect] Error details:', sigError);

            // Determine if this was a timeout or user cancellation
            const isTimeout = sigError.message?.includes('timeout');
            const isCancelled = sigError.message?.toLowerCase().includes('cancel') ||
                               sigError.message?.toLowerCase().includes('denied') ||
                               sigError.code === 2; // CIP-30 error code for user rejection

            let errorMsg = 'Authentication failed';
            if (isTimeout) {
              errorMsg = 'Signature request timed out. Please try again.';
            } else if (isCancelled) {
              errorMsg = 'Signature request was cancelled. Please approve the signature to connect.';
            } else {
              errorMsg = `Authentication failed: ${sigError.message || 'Please approve the signature request'}`;
            }

            // Set error but keep wallet available for retry
            setWalletError(errorMsg);
            setIsSignatureVerified(false);
            setIsConnecting(false);
            setConnectionStatus('');
            console.log('[Wallet Connect] isConnecting reset to false after signature error');
            console.log('[WALLET ERROR STATE]', {
              timestamp: new Date().toISOString(),
              errorMsg,
              availableWalletsCount: availableWallets.length,
              walletConnected,
              isConnecting: false,
              message: 'Error occurred but availableWallets should remain populated for retry'
            });

            // Release lock to allow retry
            connectionLockRef.current = false;

            // STOP HERE - Do not proceed without valid signature
            // Don't throw - just return to allow user to retry with same UI
            return;
          }
          } // End of signature request else block

        console.log('[Wallet Connect] Connection successful');
        const nonce = verifiedNonce;

      // Also get payment addresses as backup (try multiple methods)
      console.log('[Wallet Connect] Retrieving payment address...');
      let paymentAddressHex: string | null = null;

      try {
        const usedAddressesHex = await walletApi.getUsedAddresses();
        if (usedAddressesHex && usedAddressesHex.length > 0) {
          paymentAddressHex = usedAddressesHex[0];
          console.log('[Wallet Connect] Found payment address via getUsedAddresses()');
        }
      } catch (err) {
        console.log('[Wallet Connect] getUsedAddresses() failed:', err);
      }

      if (!paymentAddressHex) {
        try {
          const unusedAddressesHex = await walletApi.getUnusedAddresses();
          if (unusedAddressesHex && unusedAddressesHex.length > 0) {
            paymentAddressHex = unusedAddressesHex[0];
            console.log('[Wallet Connect] Found payment address via getUnusedAddresses()');
          }
        } catch (err) {
          console.log('[Wallet Connect] getUnusedAddresses() failed:', err);
        }
      }

      if (!paymentAddressHex) {
        try {
          paymentAddressHex = await walletApi.getChangeAddress();
          console.log('[Wallet Connect] Found payment address via getChangeAddress()');
        } catch (err) {
          console.log('[Wallet Connect] getChangeAddress() failed:', err);
        }
      }

      if (!stakeAddress) {
        throw new Error("Could not get stake address from wallet");
      }

      // Convert payment address from hex to bech32 and store for blockchain verification
      let primaryPaymentAddress = '';
      if (!paymentAddressHex) {
        console.warn('[Wallet Connect] No payment addresses found in wallet');
        setPaymentAddress('');
      } else {
        primaryPaymentAddress = hexToBech32(paymentAddressHex);
        setPaymentAddress(primaryPaymentAddress);
        console.log('[Wallet Connect] Stored payment address for verification:', primaryPaymentAddress.substring(0, 20) + '...');
      }

      // Server-side NFT fetching with Blockfrost
      console.log('Fetching NFTs from blockchain via Blockfrost...');
      setConnectionStatus('Loading your Meks from blockchain...');
      setLoadingMeks(true);

      let meks: any[] = [];

      try {
        // Initialize with Blockfrost (server-side validation)
        const initResult = await initializeWithBlockfrost({
          walletAddress: stakeAddress,
          stakeAddress,
          walletType: wallet.name.toLowerCase(),
          paymentAddresses: paymentAddresses // Pass payment addresses for fallback
        });

        if (initResult.success) {
          console.log(`Successfully fetched ${initResult.mekCount} Meks from blockchain`);

          // Server has already initialized, meks will be fetched via useQuery
          meks = initResult.meks || [];
        } else {
          throw new Error(initResult.error || 'Failed to fetch NFTs from blockchain');
        }
      } catch (blockfrostError: any) {
        console.error('Blockfrost initialization failed:', blockfrostError);

        // Fallback to client-side parsing (less secure but works offline)
        console.log('Falling back to client-side NFT parsing...');

        try {
          // Check network ID before attempting to fetch UTXOs
          const networkId = await walletApi.getNetworkId();
          console.log('[Wallet Network Check] Network ID:', networkId);

          // Network ID 0 = testnet/preprod, Network ID 1 = mainnet
          if (networkId === 0) {
            throw new Error('TESTNET_WALLET_DETECTED');
          }

          const utxos = await walletApi.getUtxos();
          meks = await parseMeksFromUtxos(utxos, stakeAddress, []);
        } catch (utxoError: any) {
          // Check if this is a testnet wallet error
          if (utxoError.message === 'TESTNET_WALLET_DETECTED') {
            setWalletError('You cannot connect with a pre-production or testnet wallet. Please use a mainnet wallet.');
            setIsConnecting(false);
            setConnectionStatus('');
            setShowConnectionStatus(false);
            connectionLockRef.current = false;
            console.error('[Wallet Connect] Testnet wallet rejected');
            return;
          }

          // Re-throw other errors
          throw utxoError;
        }
        setOwnedMeks(meks);

        // Initialize with client-parsed meks
        if (meks.length > 0) {
          await initializeGoldMining({
            walletAddress: stakeAddress,
            walletType: wallet.name.toLowerCase(),
            paymentAddresses: paymentAddresses, // Pass payment addresses for Blockfrost fallback
            ownedMeks: meks.map(mek => ({
              assetId: mek.assetId,
              policyId: mek.policyId,
              assetName: mek.assetName,
              imageUrl: mek.imageUrl,
              goldPerHour: mek.goldPerHour,
              rarityRank: mek.rarityRank,
              headVariation: mek.headGroup,
              bodyVariation: mek.bodyGroup,
              itemVariation: mek.itemGroup,
              sourceKey: mek.sourceKey
            }))
          });
        }
      } finally {
        setLoadingMeks(false);
      }

      // Save wallet session using secure session manager (with async encryption)
      const sessionId = generateSessionId();
      console.log('[TRACE-CALL-SAVE] About to call saveSessionSecurely with:', {
        walletAddress: stakeAddress?.slice(0, 12) + '...',
        stakeAddress: stakeAddress?.slice(0, 12) + '...',
        paymentAddress: paymentAddress?.slice(0, 12) + '...',
        walletName: wallet.name,
        hasNonce: !!(nonce || ''),
        hasSessionId: !!sessionId,
        walletAddressIsUndefined: stakeAddress === undefined,
        stakeAddressIsUndefined: stakeAddress === undefined,
        paymentAddressIsUndefined: paymentAddress === undefined,
        timestamp: new Date().toISOString()
      });
      await saveSessionSecurely({
        walletAddress: stakeAddress,
        stakeAddress,
        walletName: wallet.name,
        sessionId,
        nonce: nonce || '', // Use nonce from verification
        paymentAddress: paymentAddress,
        cachedMeks: meks,
        updateState: (update) => {
          if (update.sessionEncrypted) {
            console.log('[Session Save] Session encrypted securely');
          }
        }
      });
      console.log('[Session Save] Encrypted wallet session saved with', meks.length, 'cached Meks, security validated');

      // Set state
      console.log('[Wallet Connect] === SETTING NEW WALLET STATE ===');
      console.log('[Wallet Connect] New stakeAddress:', stakeAddress);
      console.log('[Wallet Connect] New Meks count:', meks.length);
      console.log('[Wallet Connect] First Mek:', meks[0]?.assetName);

      setWalletAddress(stakeAddress);
      // Save to localStorage so other components can access it
      localStorage.setItem('stakeAddress', stakeAddress);
      console.log('[Wallet Connect] ✓ setWalletAddress called and saved to localStorage');

      setWalletType(wallet.name.toLowerCase());
      console.log('[Wallet Connect] ✓ setWalletType called');

      setWalletConnected(true);
      console.log('[Wallet Connect] ✓ setWalletConnected called');

      setOwnedMeks(meks);
      console.log('[Wallet Connect] ✓ setOwnedMeks called with', meks.length, 'Meks');

      // Store wallet API reference for event listeners
      walletApiRef.current = api;

      console.log('[Wallet Connect] === NEW WALLET STATE SET COMPLETE ===');

    } catch (error: any) {
      console.error('[Wallet Connect] Wallet connection error:', error);
      console.error('[Wallet Connect] Error stack:', error.stack);

      // Don't override error if it was already set (e.g., from signature error)
      if (!walletError) {
        const errorMsg = error.message || "Failed to connect wallet";
        setWalletError(errorMsg);
      }
    } finally {
      console.log('[Wallet Connect] Finally block - resetting isConnecting to false');
      setIsConnecting(false);
      setConnectionStatus('');
      connectionLockRef.current = false; // Release the connection lock
      console.log('[Wallet Connect] Connection attempt completed, lock released');
    }
  };

  // Parse Meks from wallet UTXOs
  const parseMeksFromUtxos = async (utxos: any[], walletAddress: string, directAssets?: any[]): Promise<MekAsset[]> => {
    const meks: MekAsset[] = [];
    const foundMekNumbers = new Set<number>(); // Track which Meks we've already found to avoid duplicates

    console.log('Parsing UTXOs:', utxos?.length || 0, 'UTXOs found');
    console.log('Direct assets:', directAssets?.length || 0, 'assets found');
    console.log('Looking for policy ID:', MEK_POLICY_ID);

    // Helper function to extract Mek names from hex strings
    const extractMeksFromHex = (hexString: string): string[] => {
      const mekNames: string[] = [];

      console.log('Extracting Meks from hex, length:', hexString.length);

      // Look for the policy ID in the hex (case-insensitive)
      const lowerHex = hexString.toLowerCase();
      const lowerPolicyId = MEK_POLICY_ID.toLowerCase();
      const policyIndex = lowerHex.indexOf(lowerPolicyId);
      console.log('Policy ID found at index:', policyIndex);

      if (policyIndex === -1) {
        console.log('Policy ID not found in hex');
        return mekNames;
      }

      // Look for all occurrences of "4d656b616e69736d" which is "Mekanism" in hex
      let searchString = hexString.toLowerCase();
      let currentIndex = 0;

      while (currentIndex < searchString.length) {
        const mekIndex = searchString.indexOf('4d656b616e69736d', currentIndex);
        if (mekIndex === -1) break;

        // Extract up to 30 characters after "Mekanism" for the number part
        let nameHex = searchString.substring(mekIndex, Math.min(mekIndex + 60, searchString.length));
        let decodedName = '';

        // Decode the hex to string
        for (let i = 0; i < nameHex.length; i += 2) {
          const hexByte = nameHex.substr(i, 2);
          const byte = parseInt(hexByte, 16);

          // Only add printable ASCII characters
          if (byte >= 32 && byte <= 126) {
            decodedName += String.fromCharCode(byte);
          } else if (decodedName.length > 8) {
            // We've got "Mekanism" plus some digits, stop at non-printable
            break;
          }
        }

        // Clean up the name - remove trailing non-digits
        const cleanMatch = decodedName.match(/^(Mekanism\d+)/);
        if (cleanMatch) {
          const cleanName = cleanMatch[1];
          if (!mekNames.includes(cleanName)) {
            mekNames.push(cleanName);
            console.log('Found Mek:', cleanName);
          }
        }

        // Move past this occurrence
        currentIndex = mekIndex + 16;
      }

      console.log('Total Meks found:', mekNames.length);
      return mekNames;
    };

    // First, check direct assets if available
    if (directAssets && directAssets.length > 0) {
      for (const asset of directAssets) {
        const assetId = asset.unit || asset.assetId || asset.policyId + (asset.assetName || '');

        if (assetId && assetId.includes(MEK_POLICY_ID)) {
          console.log('Found Mek in direct assets!', assetId);

          // Extract asset name
          const assetNameHex = assetId.replace(MEK_POLICY_ID, '');
          let assetName = '';

          try {
            // Try hex decoding
            for (let i = 0; i < assetNameHex.length; i += 2) {
              const hexByte = assetNameHex.substr(i, 2);
              const charCode = parseInt(hexByte, 16);
              if (charCode > 31 && charCode < 127) {
                assetName += String.fromCharCode(charCode);
              }
            }
          } catch (e) {
            assetName = `Mek${Math.floor(Math.random() * 4000) + 1}`;
          }

          // Extract Mek number
          const mekNumber = parseMekNumber(assetName);
          if (!mekNumber) {
            console.log('Could not parse Mek number from:', assetName);
            continue;
          }

          // Check for duplicates
          if (foundMekNumbers.has(mekNumber)) {
            console.log('Mek already added:', mekNumber);
            continue;
          }

          // Get the actual Mek data
          const mekData = getMekDataByNumber(mekNumber);
          if (!mekData) {
            console.log('No data found for Mek number:', mekNumber);
            continue;
          }

          foundMekNumbers.add(mekNumber);
          const goldPerHour = mekData.goldPerHour;
          const imageUrl = getMekImageUrl(mekNumber);

          meks.push({
            assetId: assetId,
            policyId: MEK_POLICY_ID,
            assetName: assetName || `Mek #${mekNumber}`,
            imageUrl: imageUrl,
            goldPerHour: Math.round(goldPerHour * 100) / 100,
            rarityRank: mekData.finalRank,
            mekNumber: mekNumber,
            headGroup: mekData.headGroup,
            bodyGroup: mekData.bodyGroup,
            itemGroup: mekData.itemGroup,
            sourceKey: mekData.sourceKey
          });
        }
      }
    }

    try {
      // Parse each UTXO to find NFTs with matching policy ID
      for (const utxo of utxos) {
        // Cardano UTXOs come as hex strings that need to be decoded
        // The amount field contains the multi-asset structure
        let assets: any[] = [];

        // Try different UTXO formats (different wallet standards)
        if (typeof utxo === 'string') {
          // CIP-30 wallets return hex strings - extract Meks from hex
          const foundMeks = extractMeksFromHex(utxo);

          for (const mekName of foundMeks) {
            // Extract number from Mekanism name
            const mekNumber = parseMekNumber(mekName);
            if (!mekNumber) {
              console.log('Could not extract number from:', mekName);
              continue;
            }

            // Check if we already have this Mek
            if (foundMekNumbers.has(mekNumber)) {
              console.log('Mek already added:', mekNumber);
              continue;
            }

            // Get the actual Mek data from our mapping
            const mekData = getMekDataByNumber(mekNumber);
            if (!mekData) {
              console.log('No data found for Mek number:', mekNumber);
              // Skip this Mek if we don't have data for it
              continue;
            }

            foundMekNumbers.add(mekNumber);
            const goldPerHour = mekData.goldPerHour;
            const imageUrl = getMekImageUrl(mekNumber);

            const newMek = {
              assetId: `${MEK_POLICY_ID}${mekName}`,
              policyId: MEK_POLICY_ID,
              assetName: `Mek #${mekNumber}`,
              imageUrl: imageUrl,
              goldPerHour: Math.round(goldPerHour * 100) / 100,
              rarityRank: mekData.finalRank,
              mekNumber: mekNumber,
              headGroup: mekData.headGroup,
              bodyGroup: mekData.bodyGroup,
              itemGroup: mekData.itemGroup,
              sourceKey: mekData.sourceKey
            };

            meks.push(newMek);
            console.log('Added Mek to collection:', newMek.assetName, 'Gold/hr:', newMek.goldPerHour);
          }
          continue;
        } else if (utxo.amount) {
          // CIP-30 standard format
          if (Array.isArray(utxo.amount)) {
            assets = utxo.amount;
          } else if (typeof utxo.amount === 'object') {
            // Convert object format to array
            assets = Object.entries(utxo.amount).map(([unit, quantity]) => ({
              unit,
              quantity: typeof quantity === 'string' ? parseInt(quantity) : quantity
            }));
          }
        }

        console.log('Assets in UTXO:', assets);

        // Check each asset
        for (const asset of assets) {
          const assetUnit = asset.unit || asset.assetId || '';

          // Check if this asset matches our policy ID
          if (assetUnit.includes(MEK_POLICY_ID)) {
            console.log('Found Mek NFT!', assetUnit);

            // Extract asset name from unit (policy ID + asset name hex)
            const assetNameHex = assetUnit.replace(MEK_POLICY_ID, '');

            // Convert hex to string for asset name
            let assetName = "";
            try {
              // Convert hex to readable string
              for (let i = 0; i < assetNameHex.length; i += 2) {
                const hexByte = assetNameHex.substr(i, 2);
                const charCode = parseInt(hexByte, 16);
                if (charCode > 31 && charCode < 127) {
                  assetName += String.fromCharCode(charCode);
                }
              }
            } catch (e) {
              console.error('Error parsing asset name:', e);
              assetName = `Mek${Math.floor(Math.random() * 4000) + 1}`;
            }

            console.log('Parsed asset name:', assetName);

            // Try to extract Mek number
            const mekNumber = parseMekNumber(assetName);
            if (!mekNumber) {
              console.log('Could not parse Mek number from asset:', assetName);
              continue;
            }

            // Check for duplicates
            if (foundMekNumbers.has(mekNumber)) {
              console.log('Mek already added:', mekNumber);
              continue;
            }

            // Get the actual Mek data
            const mekData = getMekDataByNumber(mekNumber);
            if (!mekData) {
              console.log('No data found for Mek number:', mekNumber);
              continue;
            }

            foundMekNumbers.add(mekNumber);
            const goldPerHour = mekData.goldPerHour;
            const imageUrl = getMekImageUrl(mekNumber);
            const finalAssetName = assetName || `Mek #${mekNumber}`;

            meks.push({
              assetId: assetUnit,
              policyId: MEK_POLICY_ID,
              assetName: finalAssetName,
              imageUrl: imageUrl,
              goldPerHour: Math.round(goldPerHour * 100) / 100,
              rarityRank: mekData.finalRank,
              mekNumber: mekNumber,
              headGroup: mekData.headGroup,
              bodyGroup: mekData.bodyGroup,
              itemGroup: mekData.itemGroup,
              sourceKey: mekData.sourceKey
            });

            console.log('Added Mek:', finalAssetName, 'Rank:', mekData.finalRank, 'Gold/hr:', goldPerHour);
          }
        }
      }

      console.log(`Found ${meks.length} Meks in wallet`);

      // If no Meks found, let's check if we're missing something
      if (meks.length === 0) {
        console.log('No Meks found. Checking UTXO structure...');
        if (utxos && utxos.length > 0) {
          console.log('Sample UTXO:', JSON.stringify(utxos[0], null, 2));
        }

        console.warn('No Meks detected in wallet!');
        console.log('Make sure your wallet contains Mek NFTs with policy ID:', MEK_POLICY_ID);
      }
    } catch (error) {
      console.error('Error parsing UTXOs:', error);

      // If we can't parse UTXOs, check if we have a test wallet and provide mock data
      if (walletAddress.includes("test") || walletAddress.includes("demo")) {
        return [
          {
            assetId: "mek_demo_001",
            policyId: MEK_POLICY_ID,
            assetName: "Demo Mek #001",
            imageUrl: "/mek-images/150px/bc2-dm1-ap1.webp",
            goldPerHour: 50,
            rarityRank: 245,
            headVariation: "bc2",
            bodyVariation: "dm1",
            itemVariation: "ap1"
          },
          {
            assetId: "mek_demo_002",
            policyId: MEK_POLICY_ID,
            assetName: "Demo Mek #002",
            imageUrl: "/mek-images/150px/hh1-dh1-ji2.webp",
            goldPerHour: 75,
            rarityRank: 89,
            headVariation: "hh1",
            bodyVariation: "dh1",
            itemVariation: "ji2"
          }
        ];
      }
    }

    return meks;
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    console.log('[Disconnect Flow] === STARTING DISCONNECT ===');
    console.log('[Disconnect Flow] Current wallet:', walletAddress);
    console.log('[Disconnect Flow] Current Meks count:', ownedMeks.length);

    // Set loading state to show user feedback
    setIsDisconnecting(true);

    // Update last active time before disconnecting
    if (walletAddress) {
      console.log('[Disconnect Flow] Step 1: Updating last active time...');
      await updateLastActive({
        walletAddress
      });

      // CRITICAL: Revoke authentication session in Convex
      // This ensures signature is required on next connection
      console.log('[Disconnect Flow] Step 2: Calling revokeAuthentication mutation...');
      console.log('[Disconnect Flow] Stake address for revocation:', walletAddress);
      try {
        const revokeStartTime = Date.now();
        const revokeResult = await revokeAuthentication({
          stakeAddress: walletAddress
        });
        const revokeEndTime = Date.now();
        console.log('[Disconnect Flow] Step 2: Revocation complete in', revokeEndTime - revokeStartTime, 'ms');
        console.log('[Disconnect Flow] Revocation result:', revokeResult);
      } catch (error) {
        console.error('[Disconnect Flow] ERROR revoking session:', error);
        // Continue with disconnect even if revocation fails
      }
    }

    // CRITICAL: Clear state FIRST
    console.log('[Disconnect Flow] Step 3: Clearing React state...');
    setWalletConnected(false);
    setWalletAddress(null);
    setWalletType(null);
    setOwnedMeks([]);
    setCurrentGold(0);
    setGoldPerHour(0);
    setCumulativeGold(0);
    setIsSignatureVerified(false);
    walletApiRef.current = null; // Clear wallet API reference
    console.log('[Disconnect Flow] Step 3: React state cleared');

    // CRITICAL: Clear session storage (this clears localStorage)
    console.log('[Disconnect Flow] Step 4: Clearing localStorage...');
    clearWalletSession();
    console.log('[Disconnect Flow] Step 4: localStorage cleared');

    // Clear intervals
    if (goldIntervalRef.current) {
      clearInterval(goldIntervalRef.current);
    }
    if (checkpointIntervalRef.current) {
      clearInterval(checkpointIntervalRef.current);
    }

    console.log('[Disconnect Flow] === DISCONNECT COMPLETE ===');

    // CRITICAL: Force page reload to clear wallet extension's cached API
    // This ensures signature is required on next connection
    console.log('[Disconnect Flow] Step 5: Reloading page to clear wallet cache...');

    // Add small delay to ensure Convex mutation propagates
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('[Disconnect Flow] Step 5: Page reload starting NOW...');
    window.location.reload();
  };

  // STEP 1: Check for corporation name conflict before proceeding
  const handleRequestWalletVerification = async () => {
    if (!walletAddress || !newWalletAddress.trim()) {
      alert('Please enter a valid wallet address');
      return;
    }

    // Validate wallet address format
    if (!newWalletAddress.startsWith('stake1') && !newWalletAddress.startsWith('stake_test1')) {
      alert('Please enter a valid Cardano stake address (starts with stake1 or stake_test1)');
      return;
    }

    // FAIL-SAFE: Check if trying to add the currently connected wallet
    if (newWalletAddress.trim() === walletAddress) {
      alert('⚠️ Cannot add wallet: This is the wallet you are currently connected with.\n\nYou cannot add a wallet to itself.');
      return;
    }

    // FAIL-SAFE: Check if wallet is already in the current group
    if (walletGroup && walletGroup.length > 0) {
      const alreadyInGroup = walletGroup.some(w => w.walletAddress === newWalletAddress.trim());
      if (alreadyInGroup) {
        alert('⚠️ Cannot add wallet: This wallet is already part of your corporation.');
        return;
      }
    }

    try {
      // CRITICAL: Set flag to prevent auto-disconnect when user switches wallets
      setIsAddingWallet(true);

      // Check if incoming wallet has a company name
      const incomingName = getWalletCompanyName || null;

      // Get current wallet's company name
      const currentName = goldMiningData?.companyName || null;

      // If both wallets have names, show merger modal
      if (currentName && incomingName) {
        console.log('[AddWallet] Both wallets have company names, showing merger modal');
        setCurrentCorpName(currentName);
        setIncomingCorpName(incomingName);
        setSelectedCorpNameOption('current');
        setNewCorpName('');
        setAddWalletStep('name-merger');
        return; // Don't generate nonce yet, wait for name selection
      }

      // If no conflict, proceed directly to verification
      await proceedToVerification();

    } catch (error: any) {
      console.error('[AddWallet] Failed to check company names:', error);
      alert(`Failed to process request: ${error.message}`);
      setAddWalletStep('input');
      setIsAddingWallet(false); // Clear flag on error
    }
  };

  // Helper function to generate nonce and proceed to verification step
  const proceedToVerification = async () => {
    try {
      setAddWalletStep('verify');
      console.log('[AddWallet] Generating nonce for new wallet:', newWalletAddress);

      const result = await generateNonce({
        stakeAddress: newWalletAddress.trim(),
        walletName: 'Additional Wallet',
        deviceId: `add-wallet-${Date.now()}`,
        origin: window.location.origin,
      });

      setAddWalletNonce(result.nonce);
      setAddWalletMessage(result.message);

      console.log('[AddWallet] Nonce generated:', result.nonce);
    } catch (error: any) {
      console.error('[AddWallet] Failed to generate nonce:', error);
      alert(`Failed to generate verification nonce: ${error.message}`);
      setAddWalletStep('input');
      setIsAddingWallet(false); // Clear flag on error
    }
  };

  // STEP 2: Request signature from NEW wallet
  const handleSignWithNewWallet = async () => {
    if (!addWalletNonce || !addWalletMessage || !newWalletAddress) {
      alert('Missing verification data. Please try again.');
      setAddWalletStep('input');
      return;
    }

    try {
      setAddWalletStep('signing');
      console.log('[AddWallet] Requesting signature from new wallet...');

      // Request wallet connection and signature from the NEW wallet
      // The user needs to switch to or connect the wallet they want to add
      const cardano = (window as any).cardano;
      if (!cardano) {
        throw new Error('No Cardano wallet detected. Please install a wallet extension.');
      }

      // Show available wallets
      const wallets = [];
      if (cardano.nami) wallets.push('nami');
      if (cardano.eternl) wallets.push('eternl');
      if (cardano.flint) wallets.push('flint');

      if (wallets.length === 0) {
        throw new Error('No supported wallet found. Please install Nami, Eternl, or Flint.');
      }

      // SIMPLIFIED APPROACH: Use whatever wallet the user has active
      // The backend signature verification will ensure it matches the claimed address
      let walletApi;
      let connectedWalletName = null;

      // Try to connect to any available wallet
      for (const walletName of wallets) {
        try {
          console.log(`[AddWallet] Attempting to connect to ${walletName}...`);
          walletApi = await cardano[walletName].enable();

          if (walletApi) {
            connectedWalletName = walletName;
            console.log(`[AddWallet] ✓ Connected to ${walletName}`);

            // Get the stake address from this wallet to show user
            const rewardAddressesHex = await walletApi.getRewardAddresses();
            console.log(`[AddWallet] Wallet reward addresses (hex):`, rewardAddressesHex);

            // Note: We don't verify the address matches here because:
            // 1. getRewardAddresses() returns hex format, not bech32
            // 2. Backend signature verification will catch any mismatch
            // 3. This is more user-friendly (no confusing hex/bech32 conversion errors)

            break;
          }
        } catch (err) {
          console.warn(`[AddWallet] Could not connect to ${walletName}:`, err);
        }
      }

      if (!walletApi) {
        throw new Error(`Could not connect to any wallet. Please make sure:\n1. You have a Cardano wallet installed (Nami, Eternl, or Flint)\n2. You've switched to the wallet containing address: ${newWalletAddress.substring(0, 20)}...`);
      }

      console.log(`[AddWallet] Using ${connectedWalletName} for signature. If this is the wrong wallet, the signature will fail and you can try again.`);

      // Get payment address from connected wallet (signData requires payment address, not stake address)
      // Try multiple methods since new/unused wallets may not have "used" addresses
      console.log('[🔑ADDR] Getting payment address from connected wallet...');

      let addressHex: string | null = null;

      // Try getUsedAddresses first
      try {
        const usedAddressesHex = await walletApi.getUsedAddresses();
        if (usedAddressesHex && usedAddressesHex.length > 0) {
          addressHex = usedAddressesHex[0];
          console.log('[🔑ADDR] Found address via getUsedAddresses()');
        }
      } catch (err) {
        console.log('[🔑ADDR] getUsedAddresses() failed:', err);
      }

      // Try getUnusedAddresses if needed
      if (!addressHex) {
        try {
          const unusedAddressesHex = await walletApi.getUnusedAddresses();
          if (unusedAddressesHex && unusedAddressesHex.length > 0) {
            addressHex = unusedAddressesHex[0];
            console.log('[🔑ADDR] Found address via getUnusedAddresses()');
          }
        } catch (err) {
          console.log('[🔑ADDR] getUnusedAddresses() failed:', err);
        }
      }

      // Fall back to getChangeAddress
      if (!addressHex) {
        try {
          addressHex = await walletApi.getChangeAddress();
          console.log('[🔑ADDR] Found address via getChangeAddress()');
        } catch (err) {
          console.log('[🔑ADDR] getChangeAddress() failed:', err);
        }
      }

      if (!addressHex) {
        throw new Error('No addresses found in connected wallet. Please ensure your wallet is properly initialized.');
      }

      const paymentAddressForSigning = hexToBech32(addressHex);
      console.log('[🔑ADDR] Payment address for signing:', paymentAddressForSigning.substring(0, 30) + '...');

      // Request signature using payment address (NOT stake address)
      const messageHex = Buffer.from(addWalletMessage).toString('hex');
      console.log('[🔑SIGN] Requesting signature for adding wallet...');
      const signature = await walletApi.signData(paymentAddressForSigning, messageHex);

      console.log('[AddWallet] Signature received, verifying...');

      // STEP 3: Submit to backend with signature
      const result = await addWalletToGroup({
        existingWalletInGroup: walletAddress,
        newWalletAddress: newWalletAddress.trim(),
        signature: signature.signature,
        nonce: addWalletNonce,
        nickname: newWalletNickname.trim() || undefined,
      });

      // STEP 4: Update corporation name if a selection was made
      if (result.success && result.groupId && (currentCorpName || incomingCorpName)) {
        let finalCorpName = '';

        if (selectedCorpNameOption === 'current') {
          finalCorpName = currentCorpName || '';
        } else if (selectedCorpNameOption === 'incoming') {
          finalCorpName = incomingCorpName || '';
        } else if (selectedCorpNameOption === 'new') {
          finalCorpName = newCorpName.trim();
        }

        if (finalCorpName) {
          console.log('[AddWallet] Updating group corporation name to:', finalCorpName);
          await updateGroupCompanyName({
            groupId: result.groupId,
            companyName: finalCorpName,
          });
        }
      }

      // Success!
      setNewWalletAddress('');
      setNewWalletNickname('');
      setAddWalletNonce(null);
      setAddWalletMessage(null);
      setCurrentCorpName(null);
      setIncomingCorpName(null);
      setSelectedCorpNameOption('current');
      setNewCorpName('');
      setAddWalletStep('input');
      setAddWalletModalOpen(false);
      setIsAddingWallet(false); // Clear flag - wallet addition complete
      alert('Wallet added successfully and verified!');

    } catch (error: any) {
      console.error('[AddWallet] Failed to sign or add wallet:', error);
      alert(`Failed to add wallet: ${error.message}`);
      setAddWalletStep('verify');
      setIsAddingWallet(false); // Clear flag on error
    }
  };

  // Reset add wallet flow
  const handleCancelAddWallet = () => {
    setNewWalletAddress('');
    setNewWalletNickname('');
    setAddWalletNonce(null);
    setAddWalletMessage(null);
    setAddWalletStep('input');
    setAddWalletModalOpen(false);
    setIsAddingWallet(false); // Clear flag when canceling
  };

  // Handler for removing a wallet from the corporation
  const handleRemoveWallet = async (walletToRemove: string) => {
    if (!walletGroup || walletGroup.length < 2) {
      alert('Cannot remove the only wallet in the corporation');
      return;
    }

    const confirmed = confirm(
      `Remove wallet ${walletToRemove.slice(0, 12)}...${walletToRemove.slice(-8)} from corporation?\n\n` +
      'This wallet will revert to standalone mode with its own independent stats.'
    );

    if (!confirmed) return;

    try {
      await removeWalletFromGroup({
        walletAddress: walletToRemove,
      });

      alert('Wallet removed successfully!');

      // Reset filter if it was set to the removed wallet
      if (walletFilter === walletToRemove) {
        setWalletFilter(null);
      }
    } catch (error: any) {
      alert(`Error removing wallet: ${error.message}`);
    }
  };

  // Handler for editing wallet nickname
  const handleSaveNickname = async (walletAddress: string, newNickname: string) => {
    try {
      await setWalletNickname({
        walletAddress,
        nickname: newNickname.trim() || undefined,
      });
      setEditingWalletAddress(null);
      setEditingNickname('');
    } catch (error: any) {
      alert(`Error updating nickname: ${error.message}`);
    }
  };

  // Use ref to track latest goldMiningData without restarting animation loop
  const goldMiningDataRef = useRef(goldMiningData);
  useEffect(() => {
    goldMiningDataRef.current = goldMiningData;
  }, [goldMiningData]);

  // Start gold counter - 60 FPS update rate for smooth animation using requestAnimationFrame
  // CRITICAL: Only accumulate gold if wallet is VERIFIED
  // OPTIMIZED: Animation loop doesn't restart when goldMiningData updates
  useEffect(() => {
    console.log('[Gold Animation] Effect triggered:', {
      walletConnected,
      hasGoldMiningData: !!goldMiningData,
      isVerified: goldMiningData?.isVerified,
      totalGoldPerHour: goldMiningData?.totalGoldPerHour
    });

    if (!walletConnected || !goldMiningData) {
      console.log('[Gold Animation] Early return - walletConnected:', walletConnected, 'goldMiningData:', !!goldMiningData);
      return;
    }

    // VERIFICATION CHECK: Only animate gold if verified
    const isVerified = goldMiningData.isVerified === true;

    if (!isVerified) {
      // Not verified - freeze gold at current accumulated amount
      console.log('[Gold Animation] Wallet NOT VERIFIED - freezing gold at', goldMiningData.accumulatedGold);
      setCurrentGold(goldMiningData.accumulatedGold || 0);
      return; // Don't start animation loop
    }

    console.log('[Gold Animation] ✅ STARTING ANIMATION LOOP - Wallet VERIFIED', {
      totalGoldPerHour: goldMiningData.totalGoldPerHour,
      accumulatedGold: goldMiningData.accumulatedGold
    });

    let animationFrameId: number;
    let lastUpdateTime = Date.now();
    let lastStateUpdateTime = Date.now();

    // Smooth gold accumulation using requestAnimationFrame for perfect 60 FPS
    const animateGold = () => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTime;
      const timeSinceLastStateUpdate = now - lastStateUpdateTime;

      // Get latest data from ref (doesn't cause re-render)
      const latestData = goldMiningDataRef.current;

      // Calculate gold every frame, but only update state every 33ms for smooth 30 FPS
      if (latestData && timeSinceLastStateUpdate >= 33) {
        // Use shared calculation utility
        const calculatedGold = calculateCurrentGold({
          accumulatedGold: latestData.accumulatedGold || 0,
          goldPerHour: latestData.totalGoldPerHour,
          lastSnapshotTime: latestData.lastSnapshotTime || latestData.updatedAt || latestData.createdAt,
          isVerified: true
        });

        // Update state - throttled to 30 FPS for smooth animation
        setCurrentGold(calculatedGold);

        // Also update cumulative gold in real-time
        const baseCumulativeGold = latestData.totalCumulativeGold || (latestData.accumulatedGold || 0);
        const goldSinceLastUpdate = calculatedGold - (latestData.accumulatedGold || 0);

        // Only add ongoing earnings to cumulative if verified
        if (latestData.isBlockchainVerified === true) {
          const calculatedCumulativeGold = baseCumulativeGold + goldSinceLastUpdate;
          setCumulativeGold(calculatedCumulativeGold);
        } else {
          setCumulativeGold(baseCumulativeGold);
        }

        lastStateUpdateTime = now;
      }

      lastUpdateTime = now;
      animationFrameId = requestAnimationFrame(animateGold);
    };

    // Start animation loop (only restarts when wallet connection changes, not on every data update)
    animationFrameId = requestAnimationFrame(animateGold);

    // Update last active time every 5 minutes (only if verified)
    checkpointIntervalRef.current = setInterval(async () => {
      if (walletAddress && isVerified) {
        await updateGoldCheckpoint({
          walletAddress
        });
      }
    }, 5 * 60 * 1000);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (checkpointIntervalRef.current) clearInterval(checkpointIntervalRef.current);
    };
  }, [walletConnected, walletAddress, goldMiningData?.isVerified]); // Added isVerified to restart when verification status changes


  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
      setIsProcessingSignature(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="fixed inset-0 overflow-hidden touch-manipulation">
      {/* Industrial grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(250, 182, 23, 0.1) 49px, rgba(250, 182, 23, 0.1) 50px),
            repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(250, 182, 23, 0.1) 49px, rgba(250, 182, 23, 0.1) 50px)
          `
        }}
      />

      {/* Connection Status Modal - Dismissible */}
      {isConnecting && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={cancelConnection}
        >
          <div
            className="relative max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Corner brackets - hidden on mobile */}
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
        </div>
      )}

      {/* Main Content - Mobile-optimized padding and overflow */}
      <div className="relative z-10 h-screen overflow-auto p-4 pb-24 md:p-6 lg:p-8 mobile-scroll">
        {!walletConnected || forceNoWallet ? (
          // Wallet Connection Screen - Mobile-optimized
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-2rem)] md:h-full py-8 md:py-0">
            {/* Main connection card with corner brackets */}
            <div className="relative max-w-[600px] w-full px-2 sm:px-4 md:px-0">
              {/* Corner brackets - hidden on mobile */}
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

                {/* Title with glow */}
                <h1
                  className="text-3xl sm:text-4xl md:text-5xl font-black text-yellow-500 mb-2 uppercase tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] text-center font-['Orbitron']"
                  style={{
                    textShadow: '0 0 20px rgba(250, 182, 23, 0.5), 0 0 40px rgba(250, 182, 23, 0.3)'
                  }}
                >
                  MEK EMPLOYMENT
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

                {/* WebView Mode: Show connecting message */}
                {isWebViewMode ? (
                  <div className="relative text-center bg-black/30 border border-yellow-500/30 p-8 backdrop-blur-sm overflow-hidden">
                    <div className="relative mx-auto w-24 h-24 mb-6">
                      <div className="absolute inset-0 border-2 border-yellow-500/20 rounded-full" />
                      <div className="absolute inset-0 border-2 border-transparent border-t-yellow-500 border-r-yellow-500 rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-full animate-pulse" style={{ boxShadow: '0 0 30px rgba(250, 182, 23, 0.4)' }} />
                      </div>
                    </div>
                    <div className="relative space-y-3 font-mono">
                      <div className="flex items-center justify-center gap-2 text-yellow-500">
                        <span className="text-yellow-500/50">{'>>>'}</span>
                        <p className="uppercase tracking-wider text-sm font-['Orbitron'] font-bold">
                          Connecting to {webViewWalletName}
                        </p>
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent my-4" />
                      <div className="px-4 space-y-2">
                        <p className="text-gray-400 text-sm leading-relaxed font-mono">
                          Detected wallet WebView. Auto-connecting...
                        </p>
                        <p className="text-gray-500 text-xs italic font-sans">
                          Please approve the connection request in your wallet.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : availableWallets.length > 0 ? (
                  <>
                    <p className="text-gray-400 mb-8 text-center font-mono text-sm">
                      Connect your Cardano wallet to initialize gold extraction protocols
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
                  <>
                    {/* VARIATION 1: Terminal Standby */}
                    {walletCardVariation === 1 && (
                      <div className="relative text-center bg-black/30 border border-yellow-500/30 p-8 backdrop-blur-sm overflow-hidden">
                        <div
                          className="absolute inset-0 opacity-5"
                          style={{
                            backgroundImage: `linear-gradient(rgba(250, 182, 23, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(250, 182, 23, 0.1) 1px, transparent 1px)`,
                            backgroundSize: '20px 20px'
                          }}
                        />
                        <div className="relative mx-auto w-24 h-24 mb-6">
                          <div className="absolute inset-0 border-2 border-yellow-500/20 rounded-full" />
                          <div className="absolute inset-0 border-2 border-transparent border-t-yellow-500 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-yellow-500/20 rounded-full animate-pulse" style={{ boxShadow: '0 0 30px rgba(250, 182, 23, 0.4)' }} />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                          </div>
                        </div>
                        <div className="relative space-y-3 font-mono">
                          <div className="flex items-center justify-center gap-2 text-yellow-500">
                            <span className="text-yellow-500/50">{'>>>'}</span>
                            <p className="uppercase tracking-wider text-sm font-['Orbitron'] font-bold">Wallet Interface Not Detected</p>
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent my-4" />
                          <div className="px-4 space-y-2">
                            <p className="text-gray-400 text-sm leading-relaxed font-mono">Please install your Mek-holding Cardano wallet on this device then refresh this page.</p>
                            <p className="text-gray-500 text-xs italic font-sans">They will appear here.</p>
                          </div>
                          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-500 uppercase tracking-wider">
                            <div className="w-1.5 h-1.5 bg-yellow-500/50 rounded-full" />
                            <span>Nami • Eternl • Flint • Supported</span>
                            <div className="w-1.5 h-1.5 bg-yellow-500/50 rounded-full" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VARIATION 2: Equipment Checkout */}
                    {walletCardVariation === 2 && (
                      <div className="relative bg-black/30 border-l-4 border-l-yellow-500/50 border-r border-t border-b border-yellow-500/20 backdrop-blur-sm overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 opacity-30" style={{ backgroundImage: `repeating-linear-gradient(45deg, #000 0px, #000 10px, #fab617 10px, #fab617 20px)` }} />
                        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(circle at 20% 30%, rgba(250, 182, 23, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(250, 182, 23, 0.1) 0%, transparent 50%)` }} />
                        <div className="relative p-8 space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                              <span className="text-yellow-500 font-['Orbitron'] uppercase text-xs tracking-widest font-bold">Pending Installation</span>
                            </div>
                          </div>
                          <div className="border-2 border-dashed border-yellow-500/30 p-6 bg-black/20">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-12 h-12 border-2 border-yellow-500/40 bg-black/30 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-yellow-500/60" />
                              </div>
                              <div className="flex-1 space-y-3">
                                <div>
                                  <p className="text-xs uppercase tracking-wider text-gray-500 font-mono mb-1">Required Equipment</p>
                                  <p className="text-yellow-500 font-['Orbitron'] uppercase tracking-wide font-bold text-lg">Cardano Wallet Interface</p>
                                </div>
                                <div className="h-px bg-gradient-to-r from-yellow-500/20 to-transparent" />
                                <div className="space-y-2">
                                  <p className="text-gray-400 text-sm font-mono leading-relaxed">Please install your Mek-holding Cardano wallet on this device then refresh this page.</p>
                                  <p className="text-gray-500 text-xs italic font-sans">They will appear here.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2">
                            <span className="text-xs uppercase tracking-wider text-gray-600 font-mono">Compatible:</span>
                            {['Nami', 'Eternl', 'Flint', 'Others'].map(wallet => (
                              <span key={wallet} className="text-xs bg-black/40 border border-yellow-500/20 px-2 py-1 text-gray-400 font-mono uppercase tracking-wider">{wallet}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VARIATION 3: Docking Port A - Hexagonal Design */}
                    {walletCardVariation === 3 && (
                      <div className="relative text-center bg-black/30 border border-yellow-500/30 p-8 backdrop-blur-sm overflow-hidden">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg 45deg, rgba(250, 182, 23, 0.3) 45deg 46deg, transparent 46deg 90deg)` }} />
                        <div className="relative mx-auto w-32 h-32 mb-6 flex items-center justify-center">
                          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s', clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' }}>
                            <div className="w-full h-full border-2 border-yellow-500/30" style={{ clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' }} />
                          </div>
                          <div className="relative w-20 h-20 bg-black/50 border-2 border-yellow-500/50 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' }}>
                            <div className="w-8 h-8 bg-yellow-500/20 animate-pulse" style={{ clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)', boxShadow: '0 0 20px rgba(250, 182, 23, 0.4)' }} />
                          </div>
                          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                            <div key={angle} className="absolute w-2 h-2 bg-yellow-500/60 rounded-full" style={{ transform: `rotate(${angle}deg) translateY(-56px)`, animation: `pulse 2s ease-in-out ${i * 0.2}s infinite` }} />
                          ))}
                        </div>
                        <div className="relative space-y-3">
                          <p className="text-yellow-500 font-['Orbitron'] uppercase tracking-wider text-sm font-bold">Wallet Connection Required</p>
                          <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
                          <div className="px-4 space-y-2">
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

                    {/* VARIATION 4: Docking Port B - Orbital Scanner */}
                    {walletCardVariation === 4 && (
                      <div className="relative text-center bg-black/30 border border-yellow-500/30 p-8 backdrop-blur-sm overflow-hidden">
                        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(circle at center, rgba(250, 182, 23, 0.1) 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />
                        <div className="relative mx-auto w-28 h-28 mb-6">
                          {/* Static frame */}
                          <div className="absolute inset-0 border-2 border-yellow-500/20 rounded-full" />
                          <div className="absolute inset-0 border border-yellow-500/10 rounded-full"
                               style={{ clipPath: 'polygon(0 0, 100% 0, 100% 2px, 0 2px)' }} />

                          {/* Orbiting particles - outer orbit */}
                          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '6s' }}>
                            <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 -mt-1 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(250,182,23,0.8)]" />
                          </div>

                          {/* Middle orbit */}
                          <div className="absolute inset-4 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
                            <div className="absolute top-0 left-1/2 w-1.5 h-1.5 -ml-0.5 -mt-0.5 bg-yellow-500/80 rounded-full shadow-[0_0_6px_rgba(250,182,23,0.6)]" />
                          </div>

                          {/* Inner orbit */}
                          <div className="absolute inset-8 animate-spin" style={{ animationDuration: '3s' }}>
                            <div className="absolute top-0 left-1/2 w-1 h-1 -ml-0.5 -mt-0.5 bg-yellow-500/60 rounded-full shadow-[0_0_4px_rgba(250,182,23,0.4)]" />
                          </div>

                          {/* Center hub */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-yellow-500/40 rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
                          </div>
                        </div>
                        <div className="relative space-y-3">
                          <p className="text-yellow-500 font-['Orbitron'] uppercase tracking-wider text-sm font-bold">Wallet Connection Required</p>
                          <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
                          <div className="px-4 space-y-2">
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

                    {/* VARIATION 5: Docking Port C - Targeting Reticle */}
                    {walletCardVariation === 5 && (
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

                    {/* Skip to blockchain verification button */}
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => {
                          console.log('[Skip Mode] Bypassing wallet connection...');
                          // Set up demo wallet state
                          setWalletConnected(true);
                          setWalletAddress('stake1_demo_test_wallet_for_verification');
                          setWalletType('Demo');
                          setIsAutoReconnecting(false);
                          setIsSignatureVerified(false); // Keep signature verification false to show verification panel
                          setShowVerificationPanel(true);
                        }}
                        className="group relative bg-black/20 border border-gray-500/30 text-gray-400 px-6 py-2 transition-all hover:bg-gray-500/10 hover:border-gray-400/50 hover:text-gray-300 uppercase tracking-wider font-['Orbitron'] text-sm backdrop-blur-sm overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <span className="relative z-10">Skip (Demo Mode)</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Wallet Instructions Modal - DApp Browser Setup (separate from errors) */}
                {walletInstructions && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setWalletInstructions(null)}
                  >
                    {/* Modal content */}
                    <div
                      className="relative bg-gray-900 border-2 border-yellow-500/50 p-4 max-w-sm w-full shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-yellow-500" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-yellow-500" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-yellow-500" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-yellow-500" />

                      {/* Close button */}
                      <button
                        onClick={() => setWalletInstructions(null)}
                        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors border border-yellow-500/30 hover:border-yellow-500/60"
                        aria-label="Close"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Header */}
                      <div className="mb-3 pr-7">
                        <h3 className="text-yellow-500 font-['Orbitron'] uppercase tracking-wider text-base font-bold">
                          Connection Instructions
                        </h3>
                        <div className="h-px bg-gradient-to-r from-yellow-500/50 to-transparent mt-1.5" />
                      </div>

                      {/* Instructions */}
                      <div className="text-gray-300 text-xs leading-relaxed whitespace-pre-line font-mono">
                        {walletInstructions}
                      </div>

                      {/* Copy URL Button */}
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText('mek.overexposed.io');
                            setUrlCopied(true);
                            setTimeout(() => setUrlCopied(false), 2000);
                          } catch (err) {
                            console.error('Failed to copy URL:', err);
                          }
                        }}
                        className="mt-3 w-full px-4 py-2 border-2 border-yellow-500/50 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 font-['Orbitron'] uppercase tracking-wider text-xs transition-all relative overflow-hidden"
                      >
                        <span className={`transition-opacity ${urlCopied ? 'opacity-0' : 'opacity-100'}`}>
                          📋 Copy URL to Clipboard
                        </span>
                        <span className={`absolute inset-0 flex items-center justify-center transition-opacity ${urlCopied ? 'opacity-100' : 'opacity-0'}`}>
                          ✓ Copied!
                        </span>
                      </button>

                      {/* Fallback: Manual copy */}
                      <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                        <code className="text-yellow-500 font-mono text-xs select-all block text-center">
                          mek.overexposed.io
                        </code>
                        <p className="text-[10px] text-yellow-500/60 text-center mt-0.5">
                          Or long-press to copy manually
                        </p>
                      </div>

                      {/* Bottom close button */}
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={() => setWalletInstructions(null)}
                          className="px-5 py-1.5 border-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 font-['Orbitron'] uppercase tracking-wider text-xs transition-all"
                        >
                          Got It
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wallet Error Display - Inline error text only (NOT a modal) */}
                {walletError && (
                  <div className="mt-6 p-4 bg-red-900/10 border border-red-500/30 text-red-400 text-sm font-mono backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span>{walletError}</span>
                    </div>
                  </div>
                )}

                {/* Security Status Indicators - shown during connection */}
                {isConnecting && connectionState && (
                  <div className="mt-6 p-4 bg-black/40 border border-yellow-500/20 backdrop-blur-sm">
                    <div className="text-xs text-gray-400 mb-3 font-mono uppercase tracking-wider">
                      Security Status
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${connectionState.originVerified ? 'bg-green-400' : 'bg-gray-600'}`} />
                        <span className={connectionState.originVerified ? 'text-green-400' : 'text-gray-500'}>
                          Origin Validated
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${connectionState.nonceGenerated ? 'bg-green-400' : 'bg-gray-600'}`} />
                        <span className={connectionState.nonceGenerated ? 'text-green-400' : 'text-gray-500'}>
                          Secure Nonce Generated
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${connectionState.signatureVerified ? 'bg-green-400' : 'bg-gray-600'}`} />
                        <span className={connectionState.signatureVerified ? 'text-green-400' : 'text-gray-500'}>
                          Signature Verified
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${connectionState.sessionEncrypted ? 'bg-green-400' : 'bg-gray-600'}`} />
                        <span className={connectionState.sessionEncrypted ? 'text-green-400' : 'text-gray-500'}>
                          Session Encrypted
                        </span>
                      </div>
                      {connectionState.retryAttempt > 0 && (
                        <div className="flex items-center gap-3 text-xs mt-3 pt-3 border-t border-yellow-500/20">
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                          <span className="text-yellow-400">
                            Retry Attempt {connectionState.retryAttempt}/{connectionState.maxRetries}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Leaderboard below connection card */}
            <div className="mt-8 flex justify-center w-full">
              <GoldLeaderboard showMoreButton={true} />
            </div>
          </div>
        ) : (
          // Gold Mining Dashboard
          <div className="max-w-7xl mx-auto relative px-4 sm:px-8">
            {/* Wallet dropdown and company name in top left corner */}
            <div className="absolute top-0 left-0 z-20 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <div className="relative wallet-dropdown">
                <button
                  onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                  className="flex items-center gap-2 bg-black/60 border border-yellow-500/30 px-3 sm:px-4 py-2.5 sm:py-2 backdrop-blur-sm hover:bg-black/70 hover:border-yellow-500/50 transition-all min-h-[44px] sm:min-h-0 touch-manipulation"
                >
                  <span className="text-yellow-400 font-bold text-base sm:text-lg font-sans uppercase">
                    {ownedMeks.length} MEKS
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
                        <AnimatedNumber value={cumulativeGold} decimals={0} threshold={0.5} />
                      </div>
                    </div>

                    {/* 3. Session expiration timer */}
                    {checkAuth?.expiresAt && (
                      <div className="px-4 py-4 border-b border-yellow-500/20">
                        <div className="text-gray-500 text-base sm:text-lg uppercase tracking-wider mb-1">
                          Session Expires
                        </div>
                        <SessionTimer expiresAt={checkAuth.expiresAt} />
                      </div>
                    )}

                    {/* 4. Disconnect Button */}
                    <button
                      onClick={async () => {
                        // DO NOT close dropdown first - let page reload handle cleanup
                        // Closing dropdown synchronously can cause race condition where
                        // the button unmounts before async disconnect completes
                        await disconnectWallet();
                      }}
                      disabled={isDisconnecting}
                      className={`w-full px-4 py-4 text-left transition-all uppercase tracking-wider text-base sm:text-base font-['Orbitron'] font-bold min-h-[48px] touch-manipulation ${
                        isDisconnecting
                          ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                          : 'bg-transparent text-red-400 hover:bg-red-500/10 active:bg-red-500/20'
                      }`}
                    >
                      {isDisconnecting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          DISCONNECTING...
                        </span>
                      ) : (
                        'DISCONNECT'
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Corporation name display - hidden on mobile (already in dropdown) */}
              {companyNameData?.companyName && (
                <div
                  className="hidden sm:flex cursor-pointer hover:text-white/90 transition-colors items-center gap-2 touch-manipulation"
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
            <div className="absolute right-0 z-20" style={{ top: '-20px' }}>
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

            {/* Information text floating in the night sky - moved up 140px total on desktop, down 80px on mobile */}
            <div className="text-center mb-[50px] px-4 pt-[60px] sm:pt-[50px]">
              <p className="max-w-xl mx-auto mb-8">
                <span className="text-xs sm:text-sm font-mono text-gray-400">
                  <span className="font-bold">This website is for testing a core mechanic of a future Over Exposed product. It is <span className="teal-glow-pulse">not</span> an actual game and it offers no rewards.</span>
                  <br /><br />
                  <span className="text-white font-bold" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.4)' }}>How it works:</span> each Mekanism has an upgradeable income that feeds your corporation. Level up, accumulate gold and top the chart. Please share bugs and feedback{' '}
                  <a
                    href="https://discord.gg/kHkvnPbfmm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-400 hover:text-yellow-300 underline transition-colors"
                  >
                    here
                  </a>.{!verificationStatus?.verified && <> You must initiate your company by verifying on the blockchain. <span className="text-white font-bold" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.4)' }}>Click the initiate button below to begin.</span></>}
                </span>
              </p>
            </div>

            {/* Verify on Blockchain Button */}
            <div className="mb-12">
              {!verificationStatus?.verified && (
                <div className="mt-[34px] sm:mt-[44px]">
                  <div className="w-full max-w-xs mx-auto relative">
                    <div className="relative">
                      <HolographicButton
                        text={isVerifyingBlockchain ? "VERIFYING ON BLOCKFROST..." : isProcessingSignature ? "VERIFYING..." : "Initiate"}
                        onClick={() => {
                          if (!isProcessingSignature && !isVerifyingBlockchain) {
                            const verifyButton = document.querySelector('[data-verify-blockchain]');
                            if (verifyButton) {
                              (verifyButton as HTMLElement).click();
                            }
                          }
                        }}
                        isActive={!isProcessingSignature && !isVerifyingBlockchain}
                        variant="yellow"
                        alwaysOn={true}
                        disabled={isProcessingSignature || isVerifyingBlockchain}
                        className="w-full [&>div]:h-full [&>div>div]:h-full [&>div>div]:!py-3 [&>div>div]:!px-6 [&_span]:!text-base [&_span]:!tracking-[0.15em]"
                      />
                      {isVerifyingBlockchain && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-3">
                          <div className="relative w-5 h-5">
                            <div className="absolute inset-0 border-3 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                            <div className="absolute inset-0 border-3 border-transparent border-b-yellow-400 rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* AIRDROP CLAIM BANNER - Show if eligible and campaign is active */}
            <div className="max-w-[600px] mx-auto mb-6 px-4 sm:px-0">
              <AirdropClaimBanner userId={null} walletAddress={walletAddress} />
            </div>

            {/* Combined Card - Stacked Layout */}
            <div style={{ marginBottom: '25px' }} className="flex justify-center px-0 sm:px-4 w-full max-w-full sm:max-w-[600px] mx-auto">
              <div className="relative w-full">
                {/* Outer corner brackets for unified card - hidden on mobile */}
                <div className="hidden sm:block absolute -top-3 -left-3 w-8 h-8 border-l-2 border-t-2 border-yellow-500/50" />
                <div className="hidden sm:block absolute -top-3 -right-3 w-8 h-8 border-r-2 border-t-2 border-yellow-500/50" />
                <div className="hidden sm:block absolute -bottom-3 -left-3 w-8 h-8 border-l-2 border-b-2 border-yellow-500/50" />
                <div className="hidden sm:block absolute -bottom-3 -right-3 w-8 h-8 border-r-2 border-b-2 border-yellow-500/50" />

                <div className="bg-black/90 border-2 border-yellow-500/30 backdrop-blur-md relative overflow-hidden" style={{ transform: 'translate3d(0,0,0)' }}>
                    {/* Top section - Total Gold */}
                    <div className="p-3 sm:p-4 md:p-5 relative">
                      {/* Gradient background */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `radial-gradient(ellipse at center, rgba(250, 182, 23, 0.03) 0%, rgba(0, 0, 0, 0) 70%)`
                        }}
                      />

                      {/* Grid pattern overlay */}
                      <div
                        className="absolute inset-0 opacity-[0.07]"
                        style={{
                          backgroundImage: `
                            repeating-linear-gradient(0deg, transparent, transparent 19px, #FAB617 19px, #FAB617 20px),
                            repeating-linear-gradient(90deg, transparent, transparent 19px, #FAB617 19px, #FAB617 20px)
                          `
                        }}
                      />

                      {/* Status indicator */}
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        {verificationStatus?.verified ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                            <span className="text-xs text-gray-500 font-mono uppercase">Active</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                            <span className="text-xs text-orange-400 font-mono uppercase">Waiting for initiation</span>
                          </>
                        )}
                      </div>

                      {/* Net Gold label */}
                      <div className="text-gray-400 text-sm uppercase tracking-widest font-mono mb-2 relative text-center">
                        NET GOLD
                      </div>

                      {/* Gold amount - Responsive text size */}
                      <div
                        className="text-4xl sm:text-5xl md:text-6xl font-black text-yellow-500 mb-3 tabular-nums font-mono relative text-center"
                        style={{
                          textShadow: '0 0 15px rgba(250, 182, 23, 0.6)',
                          fontSize: 'clamp(1.75rem, 5vw, 2.75rem)'
                        }}
                      >
                        <div className="relative">
                          <span
                            className="tabular-nums inline-block"
                            style={{
                              transition: 'all 0.016s linear'
                            }}
                          >
                            {Math.floor(currentGold).toLocaleString('en-US')}
                          </span>
                          <span
                            className="text-3xl sm:text-4xl md:text-5xl opacity-70 inline-block"
                            style={{
                              fontSize: '0.525em',
                              transition: 'all 0.016s linear'
                            }}
                          >
                            .{((currentGold % 1) * 1000).toFixed(0).padStart(3, '0')}
                          </span>
                          {/* Gold spent animations */}
                          {goldSpentAnimations.map(animation => (
                            <div
                              key={animation.id}
                              className="absolute -top-12 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl font-bold text-red-500 pointer-events-none whitespace-nowrap"
                              style={{
                                animation: 'floatUpFade 2s ease-out forwards',
                                textShadow: '0 0 10px rgba(239, 68, 68, 0.8)'
                              }}
                            >
                              -{animation.amount.toLocaleString()}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Gold per hour label - with style variations */}
                      <div className="mb-3 text-center">
                        {goldTextStyle === 0 && (
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                            <span className="text-yellow-400 font-black font-mono text-xl sm:text-2xl">{goldPerHour.toFixed(0)}</span>
                            <span className="text-gray-400 font-normal text-xs sm:text-sm uppercase tracking-wider">gold per hour</span>
                          </div>
                        )}
                        {goldTextStyle === 1 && (
                          <div className="text-base sm:text-lg flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3">
                            <span className="text-white font-bold font-mono tracking-wider">{goldPerHour.toFixed(2)}</span>
                            <span className="text-yellow-500/60 font-light uppercase tracking-wide">GOLD/HR</span>
                          </div>
                        )}
                        {goldTextStyle === 2 && (
                          <div className="inline-block bg-yellow-500/20 px-2 sm:px-3 py-1 border border-yellow-500/30 rounded-sm">
                            <span className="text-yellow-400 font-black text-lg sm:text-xl">{goldPerHour.toFixed(1)}</span>
                            <span className="text-yellow-500/80 text-[10px] sm:text-xs uppercase ml-1 sm:ml-2">gold per hour</span>
                          </div>
                        )}
                        {goldTextStyle === 3 && (
                          <div className="text-gray-400 font-mono text-xs sm:text-sm">
                            <span className="text-yellow-400 text-lg sm:text-xl font-bold">{goldPerHour.toFixed(2)}</span> per hour
                          </div>
                        )}
                        {goldTextStyle === 4 && (
                          <div className="font-['Orbitron'] uppercase">
                            <span className="text-yellow-500 text-xl sm:text-2xl font-black">{goldPerHour.toFixed(0)}</span>
                            <span className="text-gray-500 text-[10px] sm:text-xs tracking-widest block mt-0.5 sm:mt-1">GOLD PER HOUR</span>
                          </div>
                        )}
                      </div>

                      {/* Mek count and verification - single column on mobile, one line on desktop */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs font-mono">
                        <div className="text-gray-500">
                          Rate across all {ownedMeks.length} Meks
                        </div>
                        {verificationStatus?.verified && (
                          <div className="inline-flex items-center gap-1 text-green-500">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs">verified via Blockfrost</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />

                    {/* Bottom section - Leaderboard */}
                    <div className="sm:p-4 flex justify-center">
                      <GoldLeaderboard currentWallet={walletAddress || undefined} showMoreButton={true} />
                    </div>
                </div>
              </div>
            </div>

            {/* Controls Row - Search bar, Wallet Filter, and Sort button - Hidden when no meks */}
            {ownedMeks.length > 0 && (
              <div className={`mt-6 flex gap-3 items-end justify-between mb-3 sm:mb-4 sm:items-center ${
                ownedMeks.length === 1 ? 'max-w-md mx-auto' :
                ownedMeks.length === 2 ? 'max-w-3xl mx-auto' :
                ownedMeks.length === 3 ? 'max-w-5xl mx-auto' :
                'max-w-7xl mx-auto'
              }`}>
              {/* Search Bar - Minimalist Tech Style - Hidden when no meks */}
              {ownedMeks.length > 0 && (
                <div className="max-w-lg relative">
                  <div className="text-gray-500 mb-1 px-1 whitespace-nowrap text-xs">
                    Search by Mek # or variation (e.g., bumblebee)
                  </div>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 sm:px-5 py-2 sm:py-3 bg-white/5 border-b-2 border-white/20 text-white placeholder-white/30 focus:border-white/40 focus:bg-white/10 focus:outline-none backdrop-blur-sm min-h-[48px] sm:min-h-0 transition-all duration-500 ease-out text-sm sm:text-base"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                        fontWeight: '300',
                        letterSpacing: '0.02em'
                      }}
                    />
                    <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-white/60 to-transparent w-0 group-focus-within:w-full transition-all duration-700 ease-out" />
                    {!searchTerm ? (
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    ) : (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xl w-5 h-5 flex items-center justify-center transition-colors duration-200"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 items-end">
                {/* Wallet Filter Dropdown - Only shown when more than one wallet in corporation */}
                {groupMeks && groupMeks.wallets && groupMeks.wallets.length > 1 && walletGroup && (
                  <div className="relative wallet-filter-dropdown-container">
                    <div className="text-gray-500 mb-1 px-1 whitespace-nowrap text-xs">
                      Wallet Selection
                    </div>
                    <button
                      onClick={() => setWalletFilterDropdownOpen(!walletFilterDropdownOpen)}
                      className="relative px-3 sm:px-5 py-2 sm:py-3 bg-white/5 border-b-2 border-white/20 text-white hover:border-white/40 hover:bg-white/10 focus:outline-none backdrop-blur-sm min-h-[48px] sm:min-h-0 transition-all duration-500 ease-out group text-sm sm:text-base"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                        fontWeight: '300',
                        letterSpacing: '0.02em'
                      }}
                    >
                      <span>
                        {walletFilter
                          ? (walletGroup.find(w => w.walletAddress === walletFilter)?.nickname || `${walletFilter.slice(0, 10)}...`)
                          : 'All Wallets'}
                      </span>
                      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-white/60 to-transparent w-0 group-hover:w-full transition-all duration-700 ease-out" />
                    </button>

                    {walletFilterDropdownOpen && (
                      <div
                        className="absolute right-0 mt-1 z-50 min-w-[180px] bg-black/90 backdrop-blur-md border border-white/20 overflow-hidden"
                        style={{ willChange: 'opacity, transform', transform: 'translate3d(0,0,0)' }}
                      >
                        <button
                          onClick={() => {
                            setWalletFilter(null);
                            setWalletFilterDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 sm:py-2.5 text-left text-xs uppercase tracking-wider hover:bg-white/10 transition-colors duration-200 min-h-[48px] sm:min-h-0 touch-manipulation"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                            fontWeight: !walletFilter ? '400' : '300',
                            color: !walletFilter ? 'white' : 'rgba(255,255,255,0.6)'
                          }}
                        >
                          All Wallets
                        </button>
                        {walletGroup.map(wallet => (
                          <button
                            key={wallet.walletAddress}
                            onClick={() => {
                              setWalletFilter(wallet.walletAddress);
                              setWalletFilterDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 sm:py-2.5 text-left text-xs uppercase tracking-wider hover:bg-white/10 transition-colors duration-200 min-h-[48px] sm:min-h-0 touch-manipulation"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                              fontWeight: walletFilter === wallet.walletAddress ? '400' : '300',
                              color: walletFilter === wallet.walletAddress ? 'white' : 'rgba(255,255,255,0.6)'
                            }}
                          >
                            {wallet.nickname || `${wallet.walletAddress.slice(0, 12)}...${wallet.walletAddress.slice(-8)}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sort Dropdown - Minimalist Tech Style - Hidden when 2 or fewer meks */}
                {ownedMeks.length > 2 && (
                  <div className="relative sort-dropdown-container">
                    <button
                      onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                      className="relative px-3 sm:px-5 py-2 sm:py-3 bg-white/5 border-b-2 border-white/20 text-white hover:border-white/40 hover:bg-white/10 focus:outline-none backdrop-blur-sm min-h-[48px] sm:min-h-0 transition-all duration-500 ease-out group text-sm sm:text-base"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                        fontWeight: '300',
                        letterSpacing: '0.02em'
                      }}
                    >
                      <span>Sort</span>
                      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-white/60 to-transparent w-0 group-hover:w-full transition-all duration-700 ease-out" />
                    </button>

                    {sortDropdownOpen && (
                      <div
                        className="absolute right-0 mt-1 z-50 min-w-[140px] bg-black/90 backdrop-blur-md border border-white/20 overflow-hidden"
                        style={{ willChange: 'opacity, transform', transform: 'translate3d(0,0,0)' }}
                      >
                        <button
                          onClick={() => {
                            setSortType('rate');
                            setSortDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 sm:py-2.5 text-left text-xs uppercase tracking-wider hover:bg-white/10 transition-colors duration-200 min-h-[48px] sm:min-h-0 touch-manipulation"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                            fontWeight: sortType === 'rate' ? '400' : '300',
                            color: sortType === 'rate' ? 'white' : 'rgba(255,255,255,0.6)'
                          }}
                        >
                          Gold/hr
                        </button>
                        <button
                          onClick={() => {
                            setSortType('level');
                            setSortDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 sm:py-2.5 text-left text-xs uppercase tracking-wider hover:bg-white/10 transition-colors duration-200 min-h-[48px] sm:min-h-0 touch-manipulation"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                            fontWeight: sortType === 'level' ? '400' : '300',
                            color: sortType === 'level' ? 'white' : 'rgba(255,255,255,0.6)'
                          }}
                        >
                          Level
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              </div>
            )}

            {/* Blockchain Verification Panel - Hidden, but keep component for functionality */}
            <div className="hidden">
              <BlockchainVerificationPanel
                  walletAddress={walletAddress}
                  paymentAddress={paymentAddress}
                  meks={ownedMeks}
                  isProcessingSignature={isProcessingSignature}
                  onVerificationStart={() => setIsVerifyingBlockchain(true)}
                  onVerificationEnd={() => setIsVerifyingBlockchain(false)}
                  onVerificationComplete={(status) => {
                    console.log('[Verification Complete] Status:', status);
                    setVerificationStatus(status);

                    // If verified, fetch on-chain rates AND trigger gold animation restart
                    if (status.verified && ownedMeks.length > 0) {
                      console.log('[Verification Complete] ✓ VERIFIED - Gold accumulation will now resume');

                      fetchOnChainRates({
                        mekAssets: ownedMeks.map(m => ({
                          assetId: m.assetId,
                          mekNumber: m.mekNumber,
                          headVariation: m.headGroup,
                          bodyVariation: m.bodyGroup,
                          itemVariation: m.itemGroup,
                          rarityTier: undefined
                        }))
                      }).then(result => {
                        if (result.success) {
                          console.log('On-chain rates fetched:', result.rates);
                        }
                      });

                      // Force re-fetch of goldMiningData to get updated verification status
                      // The query will automatically re-run and trigger the gold animation useEffect
                    } else {
                      console.log('[Verification Complete] ✗ NOT VERIFIED - Gold remains frozen');
                    }
                  }}
                />
            </div>

            {/* Meks Grid - 4 columns wide */}
            <div className={`grid gap-6 ${
              ownedMeks.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
              ownedMeks.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto' :
              ownedMeks.length === 3 ? 'grid-cols-1 sm:grid-cols-3 max-w-5xl mx-auto' :
              'grid-cols-1 sm:grid-cols-2 breakpoint-3col:grid-cols-3 breakpoint-4col:grid-cols-4 max-w-7xl mx-auto'
            }`}>
              {(() => {
                // Filter and sort meks
                const filteredAndSorted = [...ownedMeks]
                  .filter(mek => {
                    // Filter by wallet if walletFilter is set
                    if (walletFilter && (mek as any).sourceWallet !== walletFilter) return false;

                    // Filter by search term
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();

                    // Check Mek number
                    if (mek.mekNumber && mek.mekNumber.toString().includes(term)) return true;
                    if (mek.assetName.toLowerCase().includes(term)) return true;

                    // Check variation names if sourceKey exists
                    if (mek.sourceKey) {
                      const variations = getVariationInfoFromFullKey(mek.sourceKey);
                      if (variations.head.name.toLowerCase().includes(term)) return true;
                      if (variations.body.name.toLowerCase().includes(term)) return true;
                      if (variations.trait.name.toLowerCase().includes(term)) return true;
                    }

                    // Check head, body, item groups directly
                    if (mek.headGroup?.toLowerCase().includes(term)) return true;
                    if (mek.bodyGroup?.toLowerCase().includes(term)) return true;
                    if (mek.itemGroup?.toLowerCase().includes(term)) return true;

                    return false;
                  })
                  .sort((a, b) => {
                    if (sortType === 'rate') {
                      return b.goldPerHour - a.goldPerHour;  // Highest rate first
                    } else {
                      // Sort by current upgrade level (highest level first)
                      const aLevel = a.currentLevel || 1;
                      const bLevel = b.currentLevel || 1;

                      if (bLevel !== aLevel) {
                        return bLevel - aLevel;  // Highest level first
                      }

                      // Secondary sort: when levels are equal, sort by gold/hr (highest first)
                      return b.goldPerHour - a.goldPerHour;
                    }
                  });

                // Apply position locking for recently upgraded meks (until mouse leaves + 2 seconds)
                const finalOrder = [...filteredAndSorted];

                Object.entries(recentlyUpgradedMeks).forEach(([assetId, { originalIndex, mouseLeft }]) => {
                  // Keep in original position until mouse has left AND 2-second delay has passed
                  if (!mouseLeft) {
                    // Find where this mek is currently in the sorted list
                    const currentIndex = finalOrder.findIndex(m => m.assetId === assetId);

                    if (currentIndex !== -1 && currentIndex !== originalIndex && originalIndex < finalOrder.length) {
                      // Move it back to its original position
                      const [mek] = finalOrder.splice(currentIndex, 1);
                      finalOrder.splice(originalIndex, 0, mek);
                    }
                  }
                });

                return finalOrder.map((mek, currentIndex) => {
                  const isRecentlyUpgraded = mek.assetId in recentlyUpgradedMeks;
                  const isMoving = isRecentlyUpgraded && recentlyUpgradedMeks[mek.assetId].mouseLeft;

                  const handleMouseLeave = () => {
                    if (isRecentlyUpgraded && !recentlyUpgradedMeks[mek.assetId].mouseLeft) {
                      // Start 2-second countdown when mouse leaves
                      const timerId = setTimeout(() => {
                        setRecentlyUpgradedMeks(prev => {
                          const newState = { ...prev };
                          delete newState[mek.assetId];
                          return newState;
                        });
                      }, 2000);

                      setRecentlyUpgradedMeks(prev => ({
                        ...prev,
                        [mek.assetId]: {
                          ...prev[mek.assetId],
                          mouseLeft: true,
                          moveTimerId: timerId
                        }
                      }));
                    }
                  };

                  return (
                    <div
                      key={mek.assetId}
                      className="mek-card-wrapper"
                      onMouseLeave={handleMouseLeave}
                      style={{
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: isMoving ? 0.9 : 1,
                        transform: isMoving ? 'scale(0.97)' : 'scale(1)'
                      }}
                    >
                      <MekCard
                        mek={mek}
                        getMekImageUrl={getMekImageUrl}
                        currentGold={currentGold}
                        walletAddress={walletAddress}
                        animatedValues={animatedMekValues[mek.assetId]}
                        upgradingMeks={upgradingMeks}
                        onClick={() => setSelectedMek(mek)}
                        index={currentIndex}
                        onGoldSpentAnimation={(animationId, amount) => {
                          setGoldSpentAnimations(prev => [...prev, { id: animationId, amount }]);
                          setTimeout(() => {
                            setGoldSpentAnimations(prev => prev.filter(a => a.id !== animationId));
                          }, 2000);
                        }}
                        onUpgrade={async (mek, upgradeCost, newLevel, newBonusRate, newTotalRate) => {
                      // Record current position to prevent instant re-sorting
                      setRecentlyUpgradedMeks(prev => ({
                        ...prev,
                        [mek.assetId]: {
                          originalIndex: currentIndex,
                          upgradeTime: Date.now(),
                          mouseLeft: false
                        }
                      }));

                      setUpgradingMeks(prev => new Set([...prev, mek.assetId]));

                      setAnimatedMekValues(prev => ({
                        ...prev,
                        [mek.assetId]: {
                          level: newLevel,
                          goldRate: newTotalRate,
                          bonusRate: newBonusRate
                        }
                      }));

                      try {
                        console.log('[UPGRADE] Before mutation call:', {
                          currentGold,
                          upgradeCost,
                          expectedRemaining: currentGold - upgradeCost,
                          timestamp: new Date().toISOString()
                        });

                        const result = await upgradeMek({
                          walletAddress,
                          assetId: mek.assetId,
                          mekNumber: mek.mekNumber,
                        });

                        console.log('[UPGRADE] Mutation result:', {
                          result,
                          timestamp: new Date().toISOString()
                        });

                        console.log('[UPGRADE] Waiting for query to refresh with deducted gold:', {
                          expectedGold: result.remainingGold,
                          currentGold,
                          costDeducted: upgradeCost,
                          timestamp: new Date().toISOString()
                        });

                        console.log('[UPGRADE] Mek upgraded successfully');

                        setTimeout(() => {
                          setUpgradingMeks(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(mek.assetId);
                            return newSet;
                          });
                          setAnimatedMekValues(prev => {
                            const newValues = { ...prev };
                            delete newValues[mek.assetId];
                            return newValues;
                          });
                        }, 1000);
                      } catch (error) {
                        console.error('Upgrade failed:', error);
                        setUpgradingMeks(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(mek.assetId);
                          return newSet;
                        });
                        setAnimatedMekValues(prev => {
                          const newValues = { ...prev };
                          delete newValues[mek.assetId];
                          return newValues;
                        });
                      }
                    }}
                  />
                    </div>
                  );
                });
              })()}
            </div>

            {ownedMeks.length === 0 && loadingMeks && (
              <div className="text-center mt-0 px-4">
                <div className="inline-block bg-black/20 border border-yellow-500/30 px-8 sm:px-12 py-8 sm:py-10 backdrop-blur-sm rounded-sm">
                  <div className="relative mb-6 flex justify-center">
                    {/* Large Spinning border */}
                    <div className="w-24 sm:w-32 h-24 sm:h-32 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />

                    {/* Center glow */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 sm:w-16 h-12 sm:h-16 bg-yellow-500/10 rounded-full animate-pulse"
                           style={{ boxShadow: '0 0 40px rgba(250, 182, 23, 0.5)' }} />
                    </div>
                  </div>

                  <p className="text-yellow-500 font-mono uppercase tracking-wider text-base sm:text-lg animate-pulse">
                    Connecting Mekanisms
                  </p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-2 font-mono">
                    Establishing blockchain link...
                  </p>
                </div>
              </div>
            )}

            {ownedMeks.length === 0 && !loadingMeks && (
              <div className="text-center mt-0 mb-16 sm:mb-24 px-4">
                <div className="inline-block bg-black/20 border border-yellow-500/20 px-6 sm:px-8 py-5 sm:py-6 backdrop-blur-sm rounded-sm">
                  <p className="text-gray-500 font-mono uppercase tracking-wider text-sm sm:text-base">
                    No Meks detected in wallet
                  </p>
                  <p className="text-gray-600 text-xs sm:text-sm mt-2 font-mono">
                    Acquire Meks to begin gold extraction
                  </p>
                  <a
                    href="https://www.jpg.store/collection/overexposedmekanism"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all rounded font-mono uppercase tracking-wider text-xs sm:text-sm"
                  >
                    Aftermarket Mekanisms →
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox for selected Mek - Clean Detail View */}
      {selectedMek && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          style={{ willChange: 'backdrop-filter' }}
          onClick={() => setSelectedMek(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-black/80 backdrop-blur-md border border-yellow-500/40 p-6 sm:p-8 flex flex-col max-h-[95vh]"
            style={{ transform: 'translate3d(0,0,0)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedMek(null)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-yellow-500 hover:text-yellow-300 text-3xl font-bold z-10 transition-colors"
            >
              ×
            </button>

            <div className="flex flex-col items-center flex-1 min-h-0">
              {/* Large Mek Image - Scales to fit */}
              <div className="relative w-full flex items-center justify-center mb-4 flex-shrink">
                {selectedMek.mekNumber ? (
                  <img
                    src={getMekImageUrl(selectedMek.mekNumber, '1000px')}
                    alt={selectedMek.assetName}
                    className="max-w-full max-h-[50vh] w-auto h-auto object-contain"
                  />
                ) : selectedMek.imageUrl ? (
                  <img
                    src={selectedMek.imageUrl}
                    alt={selectedMek.assetName}
                    className="max-w-full max-h-[50vh] w-auto h-auto object-contain"
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center text-gray-600 font-mono">
                    NO IMAGE
                  </div>
                )}
              </div>

              {/* Mek Info Below - Flexible shrink */}
              <div className="w-full space-y-2 sm:space-y-4 flex-shrink-0">
                {/* Mek Name and Rank */}
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-black text-yellow-500 uppercase tracking-wider font-['Orbitron'] mb-1 sm:mb-2">
                    {selectedMek.assetName}
                  </h2>
                  <p className="text-gray-400 font-mono text-base sm:text-lg">
                    RANK {selectedMek.rarityRank || '???'}
                  </p>
                </div>

                {/* Variations Table */}
                <div className="bg-black/50">
                  <table className="w-4/5 mx-auto">
                    <tbody>
                      {(() => {
                        if (!selectedMek.sourceKey) return null;
                        const variations = getVariationInfoFromFullKey(selectedMek.sourceKey);

                        return (
                          <>
                            <tr className="border-b border-gray-800">
                              <td className="py-3 pr-4 text-gray-500 font-mono uppercase text-xs tracking-wider">
                                HEAD
                              </td>
                              <td className="py-3 text-right font-bold text-sm" style={{ color: variations.head.color }}>
                                {variations.head.name}
                              </td>
                              <td className="py-3 pl-3 text-right font-mono text-lg font-normal w-16" style={{ color: variations.head.color }}>
                                {variations.head.count > 0 ? `×${variations.head.count}` : ''}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-800">
                              <td className="py-3 pr-4 text-gray-500 font-mono uppercase text-xs tracking-wider">
                                BODY
                              </td>
                              <td className="py-3 text-right font-bold text-sm" style={{ color: variations.body.color }}>
                                {variations.body.name}
                              </td>
                              <td className="py-3 pl-3 text-right font-mono text-lg font-normal" style={{ color: variations.body.color }}>
                                {variations.body.count > 0 ? `×${variations.body.count}` : ''}
                              </td>
                            </tr>
                            {/* Trait Variation */}
                            <tr>
                              <td className="py-3 pr-4 text-gray-500 font-mono uppercase text-xs tracking-wider">
                                TRAIT
                              </td>
                              <td className="py-3 text-right font-bold text-sm" style={{ color: variations.trait.color }}>
                                {variations.trait.name}
                              </td>
                              <td className="py-3 pl-3 text-right font-mono text-lg font-normal" style={{ color: variations.trait.color }}>
                                {variations.trait.count > 0 ? `×${variations.trait.count}` : ''}
                              </td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification - Minimal Flat Style */}
      {toast && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="animate-fade-in-scale">
            <div className={`flex items-center gap-4 px-8 py-4 bg-black/95 border shadow-2xl min-w-[350px] ${
              toast.type === 'success' ? 'border-green-500/40 text-green-400' :
              toast.type === 'error' ? 'border-red-500/40 text-red-400' :
              'border-yellow-500/40 text-yellow-400'
            }`}>
              <div className="relative w-8 h-8 flex-shrink-0">
                {toast.type === 'success' && (
                  <>
                    <div className="absolute inset-0 border-2 border-green-500/30 rounded-full" />
                    <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
                {toast.type === 'error' && (
                  <>
                    <div className="absolute inset-0 border-2 border-red-500/30 rounded-full" />
                    <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
                {toast.type === 'info' && (
                  <>
                    <div className="absolute inset-0 border-2 border-yellow-500/30 rounded-full" />
                    <div className="absolute inset-0 border-2 border-transparent border-t-yellow-500 rounded-full animate-spin" />
                  </>
                )}
              </div>
              <p className="font-mono text-lg tracking-wide">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add animations and mobile optimizations */}
      <style jsx>{`
        /* Prevent overscroll and bounce on iOS */
        :global(html) {
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
        }

        :global(body) {
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
          -webkit-overflow-scrolling: touch;
        }

        /* Smooth scrolling for mobile */
        :global(.mobile-scroll) {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        /* Prevent text selection on buttons */
        :global(.touch-manipulation) {
          -webkit-user-select: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        /* Optimize animations for mobile */
        @media (max-width: 640px) {
          :global(.animate-pulse) {
            animation-duration: 2.5s;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          :global(*) {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        @keyframes starTwinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes scanlines {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(100%);
          }
        }

        @keyframes satelliteMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(var(--translate-x), var(--translate-y));
          }
        }

        @keyframes slideInRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeInScale {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes floatUpFade {
          0% {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(-40px);
            opacity: 0;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(250, 182, 23, 0.3), 0 0 40px rgba(250, 182, 23, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(250, 182, 23, 0.6), 0 0 60px rgba(250, 182, 23, 0.4);
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        /* New animations for sci-fi styles */
        @keyframes scan-slow {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }

        :global(.animate-scan-slow) {
          animation: scan-slow 4s linear infinite;
        }

        /* Shimmer animation removed for cleaner industrial look */
        /* Original shimmer code preserved below for future use:
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        :global(.animate-shimmer) {
          animation: shimmer 3s linear infinite;
        } */

        @keyframes hologram-sweep {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(400%) skewX(-12deg); }
        }

        :global(.animate-hologram-sweep) {
          animation: hologram-sweep 3s ease-in-out infinite;
        }

        :global(.matrix-rain) {
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            rgba(34, 197, 94, 0.03) 2px,
            transparent 4px
          );
          animation: matrix-flow 1s linear infinite;
        }

        @keyframes matrix-flow {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }

        @keyframes mek-scan-line {
          0% { top: -2px; }
          100% { top: 100%; }
        }

        @keyframes plasma-border {
          0% { border-image-source: linear-gradient(45deg, #8b5cf6, #ec4899, #8b5cf6); }
          50% { border-image-source: linear-gradient(45deg, #ec4899, #8b5cf6, #ec4899); }
          100% { border-image-source: linear-gradient(45deg, #8b5cf6, #ec4899, #8b5cf6); }
        }

        @keyframes energy-flow {
          0% { background-position: 0 0; }
          100% { background-position: 4px 0; }
        }

        @keyframes crystal-shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        @keyframes data-flow {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        :global(.animate-data-flow) {
          animation: data-flow 2s ease-in-out infinite;
        }

        @keyframes quantum-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes quantum-float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-10px) translateX(5px); }
          50% { transform: translateY(5px) translateX(-5px); }
          75% { transform: translateY(-5px) translateX(10px); }
        }

        :global(.animate-quantum-float) {
          animation: quantum-float 6s ease-in-out infinite;
        }

        @keyframes quantum-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        :global(.animate-gradient-shift) {
          background-size: 200% auto;
          animation: gradient-shift 3s linear infinite;
        }

        :global(.bg-repeating-linear-gradient) {
          background-image: repeating-linear-gradient(
            var(--tw-gradient-angle),
            var(--tw-gradient-from),
            var(--tw-gradient-from) var(--tw-gradient-from-position),
            var(--tw-gradient-to) var(--tw-gradient-to-position)
          );
        }
      `}</style>

      {/* Company Name Modal */}
      {walletAddress && (
        <CompanyNameModal
          isOpen={showCompanyNameModal}
          onClose={() => setShowCompanyNameModal(false)}
          walletAddress={walletAddress}
          mode={companyNameModalMode}
          onSuccess={(companyName) => {
            console.log('Company name set successfully:', companyName);
            // The query will automatically refetch and update the UI
          }}
        />
      )}

      {/* Essence Distribution Lightbox - now handled by GlobalLightboxHandler in layout.tsx */}

      {/* Mechanism Grid Lightbox */}
      {showMechanismGridLightbox && (
        <MechanismGridLightbox
          ownedMeks={ownedMeks}
          currentGold={currentGold}
          walletAddress={walletAddress}
          getMekImageUrl={getMekImageUrl}
          animatedMekValues={animatedMekValues}
          upgradingMeks={upgradingMeks}
          onClose={() => setShowMechanismGridLightbox(false)}
          onMekClick={(mek) => setSelectedMek(mek)}
          onUpgrade={async (mek, upgradeCost, newLevel, newBonusRate, newTotalRate) => {
            setUpgradingMeks(prev => new Set([...prev, mek.assetId]));

            setAnimatedMekValues(prev => ({
              ...prev,
              [mek.assetId]: {
                level: newLevel,
                goldRate: newTotalRate,
                bonusRate: newBonusRate
              }
            }));

            try {
              const result = await upgradeMek({
                walletAddress: walletAddress!,
                assetId: mek.assetId,
                mekNumber: mek.mekNumber,
              });

              setTimeout(() => {
                setUpgradingMeks(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(mek.assetId);
                  return newSet;
                });
                setAnimatedMekValues(prev => {
                  const newValues = { ...prev };
                  delete newValues[mek.assetId];
                  return newValues;
                });
              }, 1000);
            } catch (error) {
              console.error('Upgrade failed:', error);
              setUpgradingMeks(prev => {
                const newSet = new Set(prev);
                newSet.delete(mek.assetId);
                return newSet;
              });
              setAnimatedMekValues(prev => {
                const newValues = { ...prev };
                delete newValues[mek.assetId];
                return newValues;
              });
            }
          }}
          onGoldSpentAnimation={(animationId, amount) => {
            setGoldSpentAnimations(prev => [...prev, { id: animationId, amount }]);
            setTimeout(() => {
              setGoldSpentAnimations(prev => prev.filter(a => a.id !== animationId));
            }, 2000);
          }}
        />
      )}

      {/* Meks Triangle Lightbox */}
      {showMeksTriangle && <MeksTriangleLightbox onClose={() => setShowMeksTriangle(false)} ownedMeks={ownedMeks} />}

      {/* Add Wallet Modal - Multi-Step with Signature Verification */}
      {addWalletModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-black border-2 border-yellow-400 rounded shadow-[0_0_50px_rgba(250,182,23,0.4)] p-6 max-w-md w-full mx-4">
            <h2 className="text-yellow-400 text-xl font-bold uppercase tracking-wider mb-4 whitespace-nowrap">
              Add Wallet to Corporation
              {addWalletStep !== 'input' && (
                <span className="text-xs text-yellow-400/50 ml-2">
                  (Step {addWalletStep === 'name-merger' ? '2' : addWalletStep === 'verify' ? '3' : '4'}/{currentCorpName && incomingCorpName ? '4' : '3'})
                </span>
              )}
            </h2>

            {/* STEP 1: Input wallet details */}
            {addWalletStep === 'input' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-yellow-400/70 text-xs uppercase tracking-wider mb-2">
                    Wallet Address (Stake Address)
                  </label>
                  <input
                    type="text"
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    placeholder="stake1u..."
                    className="w-full px-3 py-2 bg-black/50 border border-yellow-400/30 rounded text-white text-sm font-mono focus:outline-none focus:border-yellow-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">Enter the stake address of the wallet you want to add</p>
                </div>

                <div>
                  <label className="block text-yellow-400/70 text-xs uppercase tracking-wider mb-2">
                    Nickname (Optional)
                  </label>
                  <input
                    type="text"
                    value={newWalletNickname}
                    onChange={(e) => setNewWalletNickname(e.target.value)}
                    placeholder="e.g., Mining Wallet, Trading Wallet"
                    className="w-full px-3 py-2 bg-black/50 border border-yellow-400/30 rounded text-white text-sm focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCancelAddWallet}
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 border border-gray-500 text-white text-xs font-semibold uppercase tracking-wider rounded px-4 py-2 hover:from-gray-700 hover:to-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestWalletVerification}
                    className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 border border-yellow-500 text-white text-xs font-semibold uppercase tracking-wider rounded px-4 py-2 hover:from-yellow-700 hover:to-yellow-800 hover:shadow-[0_4px_15px_rgba(250,182,23,0.4)] transition-all"
                  >
                    Next: Verify →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Corporation Name Merger (only shown if both wallets have names) */}
            {addWalletStep === 'name-merger' && (
              <div className="space-y-4">
                <div className="bg-black/40 border border-yellow-400/30 rounded p-4">
                  <p className="text-yellow-400 text-sm font-bold uppercase tracking-wider mb-2">🏢 Choose Merged Corporation Name</p>
                  <p className="text-gray-400 text-xs">
                    Both wallets have corporation names. Select which name to use:
                  </p>
                </div>

                {/* Option 1: Keep current corporation name */}
                <div
                  onClick={() => setSelectedCorpNameOption('current')}
                  className={`border rounded p-3 cursor-pointer transition-all ${
                    selectedCorpNameOption === 'current'
                      ? 'border-yellow-400 bg-yellow-400/5 shadow-[0_0_10px_rgba(250,182,23,0.2)]'
                      : 'border-gray-700 bg-black/30 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 border flex items-center justify-center ${
                      selectedCorpNameOption === 'current' ? 'border-yellow-400 bg-yellow-400/20' : 'border-gray-600 bg-black/50'
                    }`}>
                      {selectedCorpNameOption === 'current' && <div className="w-2 h-2 bg-yellow-400" />}
                    </div>
                    <p className="text-white/90 font-semibold text-xs uppercase tracking-wider">Keep Current Name</p>
                  </div>
                  <p className="text-yellow-400 font-mono text-sm ml-6">{currentCorpName}</p>
                </div>

                {/* Option 2: Use incoming wallet's corporation name */}
                <div
                  onClick={() => setSelectedCorpNameOption('incoming')}
                  className={`border rounded p-3 cursor-pointer transition-all ${
                    selectedCorpNameOption === 'incoming'
                      ? 'border-yellow-400 bg-yellow-400/5 shadow-[0_0_10px_rgba(250,182,23,0.2)]'
                      : 'border-gray-700 bg-black/30 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 border flex items-center justify-center ${
                      selectedCorpNameOption === 'incoming' ? 'border-yellow-400 bg-yellow-400/20' : 'border-gray-600 bg-black/50'
                    }`}>
                      {selectedCorpNameOption === 'incoming' && <div className="w-2 h-2 bg-yellow-400" />}
                    </div>
                    <p className="text-white/90 font-semibold text-xs uppercase tracking-wider">Use Incoming Name</p>
                  </div>
                  <p className="text-yellow-400 font-mono text-sm ml-6">{incomingCorpName}</p>
                </div>

                {/* Option 3: Create new name */}
                <div
                  onClick={() => setSelectedCorpNameOption('new')}
                  className={`border rounded p-3 cursor-pointer transition-all ${
                    selectedCorpNameOption === 'new'
                      ? 'border-yellow-400 bg-yellow-400/5 shadow-[0_0_10px_rgba(250,182,23,0.2)]'
                      : 'border-gray-700 bg-black/30 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 border flex items-center justify-center ${
                      selectedCorpNameOption === 'new' ? 'border-yellow-400 bg-yellow-400/20' : 'border-gray-600 bg-black/50'
                    }`}>
                      {selectedCorpNameOption === 'new' && <div className="w-2 h-2 bg-yellow-400" />}
                    </div>
                    <p className="text-white/90 font-semibold text-xs uppercase tracking-wider">Create New Name</p>
                  </div>
                  {selectedCorpNameOption === 'new' && (
                    <input
                      type="text"
                      value={newCorpName}
                      onChange={(e) => setNewCorpName(e.target.value)}
                      placeholder="Enter new corporation name..."
                      className="w-full px-3 py-2 bg-black/70 border border-yellow-400/30 text-white text-sm focus:outline-none focus:border-yellow-400 mt-2"
                      autoFocus
                    />
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCancelAddWallet}
                    className="flex-1 bg-black/50 border border-gray-600 text-gray-300 text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-black/70 hover:border-gray-500 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      // Validate if "new" is selected
                      if (selectedCorpNameOption === 'new' && !newCorpName.trim()) {
                        alert('Please enter a new corporation name');
                        return;
                      }
                      // Proceed to verification
                      await proceedToVerification();
                    }}
                    className="flex-1 bg-yellow-500/20 border border-yellow-400 text-yellow-400 text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-yellow-500/30 hover:shadow-[0_0_15px_rgba(250,182,23,0.3)] transition-all"
                  >
                    Continue to Verify →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Verification instructions */}
            {addWalletStep === 'verify' && (
              <div className="space-y-4">
                <div className="bg-black/40 border border-yellow-400/30 rounded p-4">
                  <p className="text-yellow-400 text-sm font-bold uppercase tracking-wider mb-2">🔐 Ownership Verification Required</p>
                  <p className="text-gray-400 text-xs mb-3">
                    Prove wallet ownership by signing a message to prevent unauthorized claims.
                  </p>
                  <div className="bg-black/60 border border-gray-700 rounded p-2 mb-3">
                    <p className="text-xs text-gray-400 font-mono break-all">{newWalletAddress}</p>
                  </div>
                  <div className="bg-black/30 border border-gray-700 rounded p-3 mb-2">
                    <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">📝 Instructions:</p>
                    <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                      <li><strong className="text-white">IMPORTANT:</strong> Switch your wallet extension to the address shown above</li>
                      <li>Ensure you're on the correct wallet before proceeding</li>
                      <li>Click "Sign & Verify" to receive a signature prompt</li>
                      <li>Approve the signature request in your wallet popup</li>
                    </ol>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 mb-2">
                    <p className="text-yellow-400 text-xs">
                      ⚠️ <strong>Wrong wallet signature will fail verification.</strong> Confirm address match above.
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    ✓ Switching wallets during this process won't disconnect you
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCancelAddWallet}
                    className="flex-1 bg-black/50 border border-gray-600 text-gray-300 text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-black/70 hover:border-gray-500 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignWithNewWallet}
                    className="flex-1 bg-yellow-500/20 border border-yellow-400 text-yellow-400 text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-yellow-500/30 hover:shadow-[0_0_15px_rgba(250,182,23,0.3)] transition-all"
                  >
                    Sign & Verify ✓
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 (or 3 if no name merger): Signing in progress */}
            {addWalletStep === 'signing' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mb-4"></div>
                  <p className="text-yellow-400 text-sm font-semibold">Verifying Signature...</p>
                  <p className="text-gray-400 text-xs mt-2">Please wait while we verify your wallet ownership</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
