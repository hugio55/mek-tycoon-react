'use client'

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getMekDataByNumber, getMekImageUrl, parseMekNumber } from "@/lib/mekNumberToVariation";
import { getVariationInfoFromFullKey } from "@/lib/variationNameLookup";
import BlockchainVerificationPanel from "@/components/BlockchainVerificationPanel";
import { walletRateLimiter, rateLimitedCall } from "@/lib/rateLimiter";
import HolographicButton from "@/components/ui/SciFiButtons/HolographicButton";
import { ensureBech32StakeAddress } from "@/lib/cardanoAddressConverter";
// MekLevelUpgrade component removed - using inline upgrade UI from demo
import GoldLeaderboard from "@/components/GoldLeaderboard";
import { CompanyNameModal } from "@/components/CompanyNameModal";
import { calculateCurrentGold } from "@/convex/lib/goldCalculations";

// Animated Number Component
function AnimatedNumber({ value, decimals = 1 }: { value: number; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const duration = 500; // milliseconds
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * eased;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
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
  }, [value]);

  return <>{displayValue.toFixed(decimals)}</>;
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

export default function MekRateLoggingPage() {
  // Background stars
  const [backgroundStars, setBackgroundStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number, twinkle: boolean}>>([]);

  // Satellites for background animation
  const [satellites, setSatellites] = useState<Array<{
    id: number,
    startX: string,
    startY: string,
    endX: string,
    endY: string,
    delay: string,
    duration: string,
    color: 'yellow' | 'white'
  }>>([]);

  // Wallet state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>(''); // Track detailed connection progress
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [paymentAddress, setPaymentAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isAutoReconnecting, setIsAutoReconnecting] = useState(true); // Start with auto-reconnecting state
  const connectionLockRef = useRef<boolean>(false); // Prevent multiple simultaneous connections

  // Mek assets
  const [ownedMeks, setOwnedMeks] = useState<MekAsset[]>([]);
  const [loadingMeks, setLoadingMeks] = useState(false);
  const [selectedMek, setSelectedMek] = useState<MekAsset | null>(null);
  const [sortType, setSortType] = useState<'rate' | 'level'>('rate'); // Sort by rate or level
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [goldTextStyle, setGoldTextStyle] = useState<number>(1); // Default to spaced style
  const [mekNumberStyle, setMekNumberStyle] = useState<number>(0); // Mek number display style
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  // Level bar style locked to Bar Indicators (option 5)

  // Company name states
  const [showCompanyNameModal, setShowCompanyNameModal] = useState(false);
  const [companyNameModalMode, setCompanyNameModalMode] = useState<'initial' | 'edit'>('initial');
  const [searchTerm, setSearchTerm] = useState(''); // Search functionality

  // Blockchain verification state
  const [showVerificationPanel, setShowVerificationPanel] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [isSignatureVerified, setIsSignatureVerified] = useState(false);
  const [isProcessingSignature, setIsProcessingSignature] = useState(false);
  const [isVerifyingBlockchain, setIsVerifyingBlockchain] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);


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

  // Convex mutations
  const initializeGoldMining = useMutation(api.goldMining.initializeGoldMining);
  const initializeWithBlockfrost = useAction(api.goldMining.initializeWithBlockfrost);
  const updateGoldCheckpoint = useMutation(api.goldMining.updateGoldCheckpoint);
  const updateLastActive = useMutation(api.goldMining.updateLastActive);
  const upgradeMek = useMutation(api.mekLeveling.upgradeMekLevel);
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

  // LOG: Query data updates
  useEffect(() => {
    if (goldMiningData) {
      console.log('[QUERY] goldMiningData updated:', {
        accumulatedGold: goldMiningData.accumulatedGold,
        lastSnapshotTime: goldMiningData.lastSnapshotTime,
        totalGoldPerHour: goldMiningData.totalGoldPerHour,
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

  // Query Mek levels for the wallet
  const mekLevels = useQuery(api.mekLeveling.getMekLevels,
    walletAddress ? { walletAddress } : "skip"
  );

  // Blockchain verification hooks
  const generateNonce = useMutation(api.walletAuthentication.generateNonce);
  const verifySignature = useAction(api.walletAuthentication.verifySignature);
  const createGoldCheckpoint = useAction(api.goldCheckpointingActions.createGoldCheckpoint);
  const fetchOnChainRates = useAction(api.smartContractArchitecture.fetchOnChainRates);
  // Multi-wallet aggregation removed - one wallet per account

  // CSS transition handles smooth counting animation (no JS animation needed)

  // Update gold display when goldMiningData changes
  useEffect(() => {
    if (goldMiningData) {
      setCurrentGold(goldMiningData.currentGold);

      if (initialLoadRef.current) {
        initialLoadRef.current = false; // Mark initial load as complete
      }

      // Check if we need to refresh rates with level boosts
      // This happens when the stored totalGoldPerHour doesn't match what it should be with boosts
      if (mekLevels && mekLevels.length > 0 && goldMiningData.ownedMeks) {
        const expectedTotalWithBoosts = goldMiningData.ownedMeks.reduce((sum, mek) => {
          const levelData = mekLevels.find(l => l.assetId === mek.assetId);
          const boost = levelData?.currentBoostAmount || 0;
          // The stored goldPerHour might already include boost if we just upgraded
          // But on page reload it might not, so we need to check
          const baseRate = mek.goldPerHour - boost; // Try to extract base rate
          const effectiveRate = Math.max(mek.goldPerHour, baseRate + boost);
          return sum + effectiveRate;
        }, 0);

        // If there's a significant mismatch, we need to reinitialize
        if (Math.abs(expectedTotalWithBoosts - goldMiningData.totalGoldPerHour) > 1) {
          console.log('[Level Boost Check] Rate mismatch detected on page load:', {
            storedTotal: goldMiningData.totalGoldPerHour,
            expectedWithBoosts: expectedTotalWithBoosts,
            difference: expectedTotalWithBoosts - goldMiningData.totalGoldPerHour,
            mekLevels: mekLevels.length
          });
          // The level sync effect will handle updating the rates
        }
      }

      setGoldPerHour(goldMiningData.totalGoldPerHour);

      // Initialize cumulative gold (matching userStats.ts logic)
      const now = Date.now();

      // Start with stored cumulative gold
      let baseCumulativeGold = goldMiningData.totalCumulativeGold || 0;

      // If totalCumulativeGold isn't set yet, estimate from accumulated gold + spent gold
      if (!goldMiningData.totalCumulativeGold) {
        baseCumulativeGold = (goldMiningData.accumulatedGold || 0) + (goldMiningData.totalGoldSpentOnUpgrades || 0);
      }

      // Add real-time earnings since last checkpoint (only if verified)
      if (goldMiningData.isBlockchainVerified === true) {
        const lastUpdateTime = goldMiningData.lastSnapshotTime || goldMiningData.updatedAt || goldMiningData.createdAt;
        const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
        const goldSinceLastUpdate = goldMiningData.totalGoldPerHour * hoursSinceLastUpdate;
        setCumulativeGold(baseCumulativeGold + goldSinceLastUpdate);
      } else {
        setCumulativeGold(baseCumulativeGold);
      }
    }
  }, [goldMiningData, mekLevels]);

  // Query to check backend authentication status
  // CRITICAL: Only check auth AFTER connection is complete to avoid interfering with connection process
  const authStatus = useQuery(api.walletAuthentication.checkAuthentication,
    (walletAddress && walletConnected && !isConnecting)
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

  // Restore wallet connection from localStorage on mount
  useEffect(() => {
    const restoreWalletConnection = async () => {
      // Guard against SSR - only run in browser
      if (typeof window === 'undefined') {
        return;
      }

      try {
        const savedWalletData = localStorage.getItem('mek_wallet_session');
        if (!savedWalletData) {
          setIsAutoReconnecting(false);
          return;
        }

        const { walletName, stakeAddress, paymentAddress, timestamp, cachedMeks } = JSON.parse(savedWalletData);

        // Immediately display cached Meks for instant load
        if (cachedMeks && cachedMeks.length > 0) {
          console.log('[Session Restore] Loading', cachedMeks.length, 'cached Meks for instant display');
          setOwnedMeks(cachedMeks);
        }

        // Check if session is still valid (within 24 hours)
        const sessionAge = Date.now() - timestamp;
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (sessionAge > twentyFourHours) {
          console.log('[Session Restore] Session expired (>24 hours)');
          localStorage.removeItem('mek_wallet_session');
          setIsAutoReconnecting(false);
          return;
        }

        console.log('[Session Restore] Found saved wallet session:', walletName);
        console.log('[Session Restore] Session age:', Math.round(sessionAge / 1000 / 60), 'minutes');

        // Check if wallet extension is still available
        if (!window.cardano || !window.cardano[walletName.toLowerCase()]) {
          console.log('[Session Restore] Wallet extension not available');
          localStorage.removeItem('mek_wallet_session');
          setIsAutoReconnecting(false);
          return;
        }

        console.log('[Session Restore] Reconnecting wallet silently...');

        // Enable wallet silently
        const api = await window.cardano[walletName.toLowerCase()].enable();

        setWalletConnected(true);
        setWalletAddress(stakeAddress);
        setPaymentAddress(paymentAddress);
        setWalletType(walletName.toLowerCase());
        setIsSignatureVerified(true);

        // Only show loading if we don't have cached Meks
        const hasCachedMeks = cachedMeks && cachedMeks.length > 0;
        if (!hasCachedMeks) {
          setLoadingMeks(true);
        }

        console.log('[Session Restore] Wallet reconnected successfully');

        // Initialize with Blockfrost (server will handle existing data in background)
        const initResult = await initializeWithBlockfrost({
          walletAddress: paymentAddress || stakeAddress,
          stakeAddress,
          walletType: walletName.toLowerCase(),
          paymentAddresses: [paymentAddress].filter(Boolean) // Pass payment addresses for fallback
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
        localStorage.removeItem('mek_wallet_session');
        setIsAutoReconnecting(false);
      }
    };

    restoreWalletConnection();
  }, []);

  // Watch authentication status and clear session if expired
  useEffect(() => {
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
  }, [authStatus, walletConnected, isSignatureVerified, isConnecting]);

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
    };

    if (sortDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [sortDropdownOpen]);

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
      const savedWalletData = localStorage.getItem('mek_wallet_session');
      if (savedWalletData) {
        const sessionData = JSON.parse(savedWalletData);
        sessionData.cachedMeks = ownedMeks;
        localStorage.setItem('mek_wallet_session', JSON.stringify(sessionData));
        console.log('[Session Cache] Updated cached Meks:', ownedMeks.length);
      }
    }
  }, [ownedMeks, walletConnected]);

  // Sync level and boost data from goldMiningData and mekLevels into ownedMeks
  useEffect(() => {
    if (goldMiningData?.ownedMeks && ownedMeks.length > 0) {
      console.log('[Level Sync] Syncing level data from goldMiningData and mekLevels');
      console.log('[Level Sync] mekLevels data:', mekLevels?.length || 0, 'levels loaded');
      console.log('[Level Sync] goldMiningData.totalGoldPerHour:', goldMiningData.totalGoldPerHour);
      console.log('[Level Sync] Current ownedMeks rates:', ownedMeks.map(m => ({
        assetId: m.assetId.slice(-8),
        goldPerHour: m.goldPerHour,
        level: m.currentLevel
      })));

      // Create a map of goldMiningData meks for quick lookup
      const goldMiningMekMap = new Map(
        goldMiningData.ownedMeks.map(mek => [mek.assetId, mek])
      );

      // Create a map of mekLevels for quick lookup
      const mekLevelMap = new Map(
        (mekLevels || []).map(level => [level.assetId, level])
      );

      // Update ownedMeks with level and boost data
      const updatedMeks = ownedMeks.map(mek => {
        const goldMiningMek = goldMiningMekMap.get(mek.assetId);
        const mekLevel = mekLevelMap.get(mek.assetId);

        // Use level from mekLevels if available, otherwise default to 1
        const currentLevel = mekLevel?.currentLevel || 1;
        const levelBoostAmount = mekLevel?.currentBoostAmount || 0;

        // Calculate the base rate (without boost)
        const baseRate = goldMiningMek?.baseGoldPerHour ||
                         goldMiningMek?.goldPerHour ||
                         mek.goldPerHour - (mek.levelBoostAmount || 0);

        // Calculate effective gold per hour (base + boost)
        const effectiveGoldPerHour = baseRate + levelBoostAmount;

        if (goldMiningMek) {
          return {
            ...mek,
            baseGoldPerHour: baseRate,
            levelBoostAmount: levelBoostAmount,
            currentLevel: currentLevel,
            goldPerHour: effectiveGoldPerHour, // Update the main rate to include boost
          };
        }
        return {
          ...mek,
          currentLevel: currentLevel,
          levelBoostAmount: levelBoostAmount,
          baseGoldPerHour: mek.goldPerHour - levelBoostAmount, // Calculate base from current rate
          goldPerHour: mek.goldPerHour + levelBoostAmount, // Ensure boost is applied
        };
      });

      // Only update if there are actual changes
      const hasChanges = updatedMeks.some((mek, idx) =>
        mek.levelBoostAmount !== ownedMeks[idx].levelBoostAmount ||
        mek.currentLevel !== ownedMeks[idx].currentLevel ||
        mek.baseGoldPerHour !== ownedMeks[idx].baseGoldPerHour ||
        mek.goldPerHour !== ownedMeks[idx].goldPerHour // Also check if effective rate changed
      );

      if (hasChanges) {
        console.log('[Level Sync] Found level changes, updating meks with levels:',
          updatedMeks.map(m => ({
            assetId: m.assetId,
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
    }
  }, [goldMiningData?.ownedMeks, mekLevels]); // Include mekLevels in dependencies

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

  // Generate background stars and satellites on mount
  useEffect(() => {
    // Guard against SSR
    if (typeof window === 'undefined') {
      return;
    }

    const generatedBackgroundStars = [...Array(200)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.4,
      twinkle: Math.random() > 0.5,
    }));
    setBackgroundStars(generatedBackgroundStars);

    // Generate satellites (yellow and white moving dots) with random paths
    const generatedSatellites = [...Array(8)].map((_, i) => {
      const edge = Math.floor(Math.random() * 4);
      let startX: string, startY: string, endX: string, endY: string;

      if (edge === 0) {
        startX = `${-15 - Math.random() * 10}%`;
        startY = `${Math.random() * 100}%`;
        endX = `${115 + Math.random() * 10}%`;
        endY = `${Math.random() * 100}%`;
      } else if (edge === 1) {
        startX = `${115 + Math.random() * 10}%`;
        startY = `${Math.random() * 100}%`;
        endX = `${-15 - Math.random() * 10}%`;
        endY = `${Math.random() * 100}%`;
      } else if (edge === 2) {
        startX = `${Math.random() * 100}%`;
        startY = `${-15 - Math.random() * 10}%`;
        endX = `${Math.random() * 100}%`;
        endY = `${115 + Math.random() * 10}%`;
      } else {
        startX = `${Math.random() * 100}%`;
        startY = `${115 + Math.random() * 10}%`;
        endX = `${Math.random() * 100}%`;
        endY = `${-15 - Math.random() * 10}%`;
      }

      return {
        id: i,
        startX,
        startY,
        endX,
        endY,
        delay: `${Math.random() * 10}s`,
        duration: `${30 + Math.random() * 20}s`,
        color: (i % 2 === 0 ? 'yellow' : 'white') as 'yellow' | 'white'
      };
    });
    setSatellites(generatedSatellites);

    // Check for available wallets
    detectAvailableWallets();

    // Auto-reconnect if previously connected (session persistence)
    setTimeout(async () => {
      // Guard against SSR
      if (typeof window === 'undefined') {
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

          // Automatically reconnect to the wallet
          await connectWallet(wallet);
        }
      }
      // Always set auto-reconnecting to false after attempt
      setIsAutoReconnecting(false);
    }, 1500); // Wait for cardano object to be available
  }, []);

  // Detect available Cardano wallets
  const detectAvailableWallets = () => {
    const wallets: WalletInfo[] = [];

    if (typeof window !== 'undefined' && window.cardano) {
      // Check for each wallet type
      const walletNames = ['nami', 'eternl', 'flint', 'yoroi', 'typhon', 'gerowallet', 'nufi'];

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

    setAvailableWallets(wallets);
  };

  // Connect wallet with signature verification
  const connectWallet = async (wallet: WalletInfo) => {
    // Prevent multiple simultaneous connection attempts
    if (connectionLockRef.current) {
      console.log('[Wallet Connect] Connection already in progress - ignoring duplicate request');
      return;
    }

    console.log('[Wallet Connect] Starting connection to', wallet.name);
    connectionLockRef.current = true;
    setIsConnecting(true);
    setConnectionStatus('Initializing wallet connection...');
    setWalletError(null);

    try {
      // Use rate limiter for wallet connection
      const connectResult = await rateLimitedCall(
        wallet.name,
        walletRateLimiter,
        async () => {
          console.log('[Wallet Connect] Calling wallet.api.enable()...');

          // Enable wallet with 30 second timeout
          const api = await Promise.race([
            wallet.api.enable(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Wallet connection timeout after 30 seconds')), 30000)
            )
          ]) as any;

          // Get stake addresses (used for NFT ownership)
          const stakeAddresses = await api.getRewardAddresses();

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

          // Generate nonce for signature verification - REQUIRED
          let signatureVerified = false;
          try {
            console.log('[Wallet Connect] Generating nonce for signature...');
            const nonceResult = await generateNonce({
              stakeAddress,
              walletName: wallet.name
            });
            console.log('[Wallet Connect] Nonce generated successfully');

            // Get a payment address for signing (signData doesn't work with stake addresses directly)
            console.log('[Wallet Connect] Getting payment addresses...');
            const usedAddresses = await api.getUsedAddresses();
            const paymentAddress = usedAddresses[0];
            console.log('[Wallet Connect] Payment address retrieved');

            // Request signature from wallet with 60 second timeout - MANDATORY (using payment address)
            console.log('[Wallet Connect] Requesting signature from user...');
            setConnectionStatus('Awaiting signature from wallet...');
            const signature = await Promise.race([
              api.signData(
                paymentAddress,
                Buffer.from(nonceResult.message).toString('hex')
              ),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Signature request timeout or cancelled after 60 seconds')), 60000)
              )
            ]) as any;
            console.log('[Wallet Connect] Signature received');
            setConnectionStatus('Signature received! Verifying...');

            // Verify signature - MUST SUCCEED
            const verificationResult = await verifySignature({
              stakeAddress,
              nonce: nonceResult.nonce,
              signature: signature.signature || signature,
              walletName: wallet.name
            });

            if (!verificationResult.success) {
              throw new Error(verificationResult.error || 'Signature verification failed');
            }

            signatureVerified = true;
            setIsSignatureVerified(true);

            // Show toast notification immediately after signature
            setToast({
              message: '✓ Signature received! Starting verification...',
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

            setWalletError(errorMsg);
            setIsSignatureVerified(false);
            setIsConnecting(false);
            setConnectionStatus('');
            console.log('[Wallet Connect] isConnecting reset to false after signature error');

            // STOP HERE - Do not proceed without valid signature
            throw sigError; // Re-throw to be caught by outer catch
          }

          return { api, stakeAddress };
        },
        (retryAfter, reason) => {
          setWalletError(`Rate limited: ${reason}. Retry in ${Math.ceil(retryAfter / 1000)}s`);
        }
      );

      // Check if rate limited
      if (!connectResult) {
        console.log('[Wallet Connect] Rate limited - resetting state');
        setIsConnecting(false);
        setConnectionStatus('');
        setWalletError('Rate limited. Please wait a moment and try again.');
        return;
      }

      console.log('[Wallet Connect] Connection result received:', !!connectResult);

      const { api, stakeAddress } = connectResult;

      // Also get payment addresses as backup
      const paymentAddresses = await api.getUsedAddresses();
      console.log('Payment addresses:', paymentAddresses);

      if (!stakeAddress) {
        throw new Error("Could not get stake address from wallet");
      }

      // Store the first payment address for blockchain verification
      const primaryPaymentAddress = paymentAddresses[0];
      setPaymentAddress(primaryPaymentAddress);
      console.log('Stored payment address for verification:', primaryPaymentAddress?.substring(0, 20) + '...');

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
        const utxos = await api.getUtxos();
        meks = await parseMeksFromUtxos(utxos, stakeAddress, []);
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
              itemVariation: mek.itemGroup
            }))
          });
        }
      } finally {
        setLoadingMeks(false);
      }

      // Save wallet session to localStorage for 24-hour persistence (including Meks cache)
      const sessionData = {
        walletName: wallet.name,
        stakeAddress,
        paymentAddress: primaryPaymentAddress,
        timestamp: Date.now(),
        cachedMeks: meks
      };
      localStorage.setItem('mek_wallet_session', JSON.stringify(sessionData));
      console.log('[Session Save] Wallet session saved to localStorage with', meks.length, 'cached Meks');

      // Set state
      setWalletAddress(stakeAddress);
      setWalletType(wallet.name.toLowerCase());
      setWalletConnected(true);
      setOwnedMeks(meks);

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
    // Update last active time before disconnecting
    if (walletAddress) {
      await updateLastActive({
        walletAddress
      });
    }

    // Clear state
    setWalletConnected(false);
    setWalletAddress(null);
    setWalletType(null);
    setOwnedMeks([]);
    setCurrentGold(0);
    setGoldPerHour(0);

    // Clear localStorage
    localStorage.removeItem('goldMiningWallet');
    localStorage.removeItem('goldMiningWalletType');
    localStorage.removeItem('mek_wallet_session');
    console.log('[Session Clear] Wallet session cleared from localStorage');

    // Clear intervals
    if (goldIntervalRef.current) {
      clearInterval(goldIntervalRef.current);
    }
    if (checkpointIntervalRef.current) {
      clearInterval(checkpointIntervalRef.current);
    }
  };

  // Start gold counter - 30 FPS update rate for smooth animation
  // CRITICAL: Only accumulate gold if wallet is VERIFIED
  useEffect(() => {
    if (walletConnected && goldMiningData) {
      // VERIFICATION CHECK: Only animate gold if verified
      const isVerified = goldMiningData.isVerified === true;

      if (!isVerified) {
        // Not verified - freeze gold at current accumulated amount
        console.log('[Gold Animation] Wallet NOT VERIFIED - freezing gold at', goldMiningData.accumulatedGold);
        setCurrentGold(goldMiningData.accumulatedGold || 0);
        return; // Don't start animation loop
      }

      console.log('[Gold Animation] Wallet VERIFIED - starting gold accumulation');

      // CSS-based animation: Update once per second, let CSS handle smooth transitions
      const updateGold = () => {
        if (goldMiningData) {
          // Use shared calculation utility
          const calculatedGold = calculateCurrentGold({
            accumulatedGold: goldMiningData.accumulatedGold || 0,
            goldPerHour: goldMiningData.totalGoldPerHour,
            lastSnapshotTime: goldMiningData.lastSnapshotTime || goldMiningData.updatedAt || goldMiningData.createdAt,
            isVerified: true
          });

          // Update state once per second - CSS transition handles smooth animation
          setCurrentGold(calculatedGold);

          // Also update cumulative gold in real-time
          const baseCumulativeGold = goldMiningData.totalCumulativeGold || (goldMiningData.accumulatedGold || 0);
          const goldSinceLastUpdate = calculatedGold - (goldMiningData.accumulatedGold || 0);

          // Only add ongoing earnings to cumulative if verified
          if (goldMiningData.isBlockchainVerified === true) {
            const calculatedCumulativeGold = baseCumulativeGold + goldSinceLastUpdate;
            setCumulativeGold(calculatedCumulativeGold);
          } else {
            setCumulativeGold(baseCumulativeGold);
          }
        }
      };

      // Update 60 times per second (~16.67ms) - CSS handles smooth animation
      const animationInterval = setInterval(updateGold, 16.67);

      // Initial update
      updateGold();

      // Update last active time every 5 minutes (only if verified)
      checkpointIntervalRef.current = setInterval(async () => {
        if (walletAddress && isVerified) {
          await updateGoldCheckpoint({
            walletAddress
          });
        }
      }, 5 * 60 * 1000);

      return () => {
        clearInterval(animationInterval);
        if (checkpointIntervalRef.current) clearInterval(checkpointIntervalRef.current);
      };
    }
  }, [walletConnected, goldMiningData, walletAddress]);

  // Save on page unload
  useEffect(() => {
    // Guard against SSR
    if (typeof window === 'undefined') {
      return;
    }

    const handleUnload = async () => {
      if (walletAddress) {
        await updateLastActive({
          walletAddress
        });
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [walletAddress, currentGold]);

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
    <div className="fixed inset-0 overflow-hidden bg-black touch-manipulation">
      {/* Deep space background */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />

      {/* Night sky stars */}
      <div className="fixed inset-0">
        {backgroundStars.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full pointer-events-none"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: star.twinkle ? 'starTwinkle 3s ease-in-out infinite' : 'none',
              animationDelay: star.twinkle ? `${Math.random() * 3}s` : '0s',
              boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, ${star.opacity * 0.5})`
            }}
          />
        ))}

        {/* Satellites moving diagonally across screen */}
        {satellites.map((satellite) => {
          const translateX = satellite.startX === '-5%' ? 'calc(110vw)' : 'calc(-110vw)';
          const translateY = satellite.startY === '-5%' ? 'calc(110vh)' : 'calc(-110vh)';

          return (
            <div
              key={satellite.id}
              className={`absolute w-[3px] h-[3px] rounded-full pointer-events-none ${
                satellite.color === 'yellow' ? 'bg-yellow-400' : 'bg-white'
              }`}
              style={{
                left: satellite.startX,
                top: satellite.startY,
                '--translate-x': translateX,
                '--translate-y': translateY,
                animation: `satelliteMove ${satellite.duration} linear infinite`,
                animationDelay: satellite.delay,
                boxShadow: satellite.color === 'yellow'
                  ? '0 0 6px rgba(250, 182, 23, 0.8), 0 0 12px rgba(250, 182, 23, 0.4)'
                  : '0 0 4px rgba(255, 255, 255, 0.8)',
              } as React.CSSProperties}
            />
          );
        })}
      </div>

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

      {/* Connection Status Overlay */}
      {isConnecting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="relative max-w-md w-full mx-4">
            {/* Corner brackets */}
            <div className="absolute -top-4 -left-4 w-12 h-12 border-l-2 border-t-2 border-yellow-500/50" />
            <div className="absolute -top-4 -right-4 w-12 h-12 border-r-2 border-t-2 border-yellow-500/50" />
            <div className="absolute -bottom-4 -left-4 w-12 h-12 border-l-2 border-b-2 border-yellow-500/50" />
            <div className="absolute -bottom-4 -right-4 w-12 h-12 border-r-2 border-b-2 border-yellow-500/50" />

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
                <p className="text-yellow-400/80 text-center font-mono text-sm">
                  {connectionStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Mobile-optimized padding and overflow */}
      <div className="relative z-10 h-screen overflow-auto p-4 md:p-6 lg:p-8 mobile-scroll">
        {isAutoReconnecting ? (
          // Loading spinner while auto-reconnecting
          <div className="flex flex-col items-center justify-center h-full min-h-[100vh]">
            <div className="relative">
              {/* Spinning border */}
              <div className="w-24 sm:w-32 h-24 sm:h-32 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />

              {/* Center glow */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 sm:w-16 h-12 sm:h-16 bg-yellow-500/10 rounded-full animate-pulse"
                     style={{ boxShadow: '0 0 40px rgba(250, 182, 23, 0.4)' }} />
              </div>
            </div>

            <p className="mt-6 sm:mt-8 text-yellow-500 font-['Orbitron'] uppercase tracking-wider animate-pulse text-sm sm:text-base text-center px-4">
              Initializing Mek Employment Operation
            </p>
            <p className="mt-2 text-gray-500 font-mono text-xs sm:text-sm uppercase text-center px-4">
              Detecting Wallet Connection...
            </p>
          </div>
        ) : !walletConnected ? (
          // Wallet Connection Screen - Mobile-optimized
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-2rem)] md:h-full py-8 md:py-0">
            {/* Main connection card with corner brackets */}
            <div className="relative max-w-2xl w-full px-2 sm:px-4 md:px-0">
              {/* Corner brackets */}
              <div className="absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2 border-yellow-500/50" />
              <div className="absolute -top-2 -right-2 w-8 h-8 border-r-2 border-t-2 border-yellow-500/50" />
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-l-2 border-b-2 border-yellow-500/50" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-2 border-b-2 border-yellow-500/50" />

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
                  <p className="text-gray-500 text-sm uppercase tracking-widest font-mono">
                    System Online • Awaiting Authorization
                  </p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent mb-8" />

                <p className="text-gray-400 mb-8 text-center font-mono text-sm">
                  Connect your Cardano wallet to initialize gold extraction protocols
                </p>

                {availableWallets.length > 0 ? (
                  <div className={availableWallets.length === 1 ? "flex justify-center" : "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"}>
                    {availableWallets.map(wallet => (
                      <button
                        key={wallet.name}
                        onClick={() => connectWallet(wallet)}
                        disabled={isConnecting}
                        className={`group relative bg-black/30 border border-yellow-500/20 text-yellow-500 px-4 py-3 sm:px-6 sm:py-4 transition-all hover:bg-yellow-500/5 hover:border-yellow-500/40 active:bg-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider sm:tracking-widest font-['Orbitron'] font-bold backdrop-blur-sm overflow-hidden min-h-[48px] touch-manipulation ${availableWallets.length === 1 ? 'w-64' : ''}`}
                      >
                        {/* Hover glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-yellow-500/40" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-yellow-500/40" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-yellow-500/40" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-yellow-500/40" />

                        <span className="relative z-10">{wallet.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center bg-black/30 border border-red-500/20 p-6 backdrop-blur-sm">
                    <p className="text-red-500 mb-4 font-['Orbitron'] uppercase tracking-wider font-bold">No Cardano wallets detected</p>
                    <p className="text-gray-400 text-sm font-mono">
                      Please install Nami, Eternl, Flint, or another supported wallet
                    </p>
                  </div>
                )}

                {walletError && (
                  <div className="mt-6 p-4 bg-red-900/10 border border-red-500/30 text-red-400 text-sm font-mono backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      {walletError}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Leaderboard below connection card */}
            <div className="mt-8 flex justify-center">
              <GoldLeaderboard />
            </div>
          </div>
        ) : (
          // Gold Mining Dashboard
          <div className="max-w-7xl mx-auto relative px-4 sm:px-8">
            {/* Wallet dropdown and company name in top left corner */}
            <div className="absolute top-0 left-0 z-20 flex items-center gap-3">
              <div className="relative wallet-dropdown">
                <button
                  onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                  className="flex items-center gap-2 bg-black/60 border border-yellow-500/30 px-3 sm:px-4 py-2.5 sm:py-2 backdrop-blur-sm hover:bg-black/70 hover:border-yellow-500/50 transition-all min-h-[44px] sm:min-h-0 touch-manipulation"
                >
                  <span className="text-yellow-400 font-bold text-xs sm:text-sm font-sans uppercase">
                    {ownedMeks.length} MEKS
                  </span>
                  <span className="text-yellow-400 text-xs">▼</span>
                </button>

                {walletDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 sm:w-64 bg-black/95 sm:bg-black/90 border border-yellow-500/30 backdrop-blur-md rounded-sm shadow-lg">
                    {/* Corporation name and wallet address */}
                    <div className="px-4 py-3 border-b border-yellow-500/20 space-y-2">
                      {/* Corporation name */}
                      {companyNameData?.companyName ? (
                        <div
                          className="text-yellow-400 font-bold text-sm cursor-pointer hover:text-yellow-300 transition-colors"
                          onClick={() => {
                            setCompanyNameModalMode('edit');
                            setShowCompanyNameModal(true);
                            setWalletDropdownOpen(false);
                          }}
                          title="Click to edit corporation name"
                        >
                          {companyNameData.companyName}
                          <span className="ml-1 text-xs opacity-60">✏️</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setCompanyNameModalMode('initial');
                            setShowCompanyNameModal(true);
                            setWalletDropdownOpen(false);
                          }}
                          className="text-yellow-400/60 text-sm italic hover:text-yellow-400 transition-colors"
                        >
                          + Set corporation name
                        </button>
                      )}

                      {/* Wallet address */}
                      <div className="text-gray-400 font-mono text-xs">
                        {walletAddress?.slice(0, 12)}...{walletAddress?.slice(-8)}
                      </div>
                    </div>

                    {/* Cumulative Gold Display */}
                    <div className="px-4 py-3 border-b border-yellow-500/20">
                      <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Cumulative Gold</div>
                      <div className="text-yellow-400 font-bold text-lg font-mono">
                        {cumulativeGold.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    </div>

                    {/* Buttons */}
                    <button
                      onClick={async () => {
                        setWalletDropdownOpen(false);
                        console.log('=== MANUAL WALLET RESCAN ===');
                        try {
                          const walletName = localStorage.getItem('goldMiningWalletType');
                          const walletApi = window.cardano?.[walletName];

                          if (walletApi) {
                            const api = await walletApi.enable();
                            const utxos = await api.getUtxos();
                            const meks = await parseMeksFromUtxos(utxos, walletAddress || '', []);

                            if (meks.length > 0) {
                              setOwnedMeks(meks);
                              const totalGoldPerHour = meks.reduce((sum, mek) => sum + mek.goldPerHour, 0);
                              setGoldPerHour(totalGoldPerHour);
                            }
                          }
                        } catch (error) {
                          console.error('Rescan error:', error);
                        }
                      }}
                      className="w-full px-4 py-3 text-left bg-transparent border-b border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10 active:bg-yellow-500/20 transition-all uppercase tracking-wider text-xs font-['Orbitron'] font-bold min-h-[44px] touch-manipulation"
                    >
                      RESCAN WALLET
                    </button>

                    <button
                      onClick={() => {
                        setWalletDropdownOpen(false);
                        disconnectWallet();
                      }}
                      className="w-full px-4 py-3 text-left bg-transparent text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-all uppercase tracking-wider text-xs font-['Orbitron'] font-bold min-h-[44px] touch-manipulation"
                    >
                      DISCONNECT
                    </button>
                  </div>
                )}
              </div>

              {/* Corporation name display */}
              {companyNameData?.companyName && (
                <div
                  className="cursor-pointer hover:text-white/90 transition-colors flex items-center gap-2"
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

            {/* Gold text style dropdown - hidden since we're using fixed style */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20 hidden">
              <select
                value={goldTextStyle}
                onChange={(e) => setGoldTextStyle(Number(e.target.value))}
                className="bg-black/60 border border-yellow-500/30 text-yellow-400 px-3 py-2 text-xs font-['Orbitron'] uppercase tracking-wider focus:outline-none focus:border-yellow-500/50 backdrop-blur-sm"
              >
                <option value="0">Style 1: Bold Number</option>
                <option value="1">Style 2: Spaced</option>
                <option value="2">Style 3: Highlighted</option>
                <option value="3">Style 4: Minimal</option>
                <option value="4">Style 5: Classic</option>
              </select>
            </div>

            {/* Logo in top right corner */}
            <div className="absolute right-0 z-20" style={{ top: '-20px' }}>
              <img
                src="/random-images/OE logo.png"
                alt="OE Logo"
                className="h-10 sm:h-16 w-auto opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>

            {/* Information text floating in the night sky - moved up 140px total */}
            <div className="text-center mb-[50px] px-4 pt-8 sm:pt-[10px]">
              <p className="max-w-xl mx-auto mb-8">
                <span className="text-xs sm:text-sm font-mono text-gray-400">
                  <span className="font-bold">This website is for testing a core mechanic of a future Over Exposed product.</span> Each Mekanism has an upgradeable income that feeds your corporation. Level up, accumulate gold and top the chart. Please share bugs and feedback{' '}
                  <a
                    href="https://discord.gg/kHkvnPbfmm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-400 hover:text-yellow-300 underline transition-colors"
                  >
                    here
                  </a>.
                </span>
              </p>
            </div>

            {/* Combined Card - Stacked Layout */}
            <div className="mb-8 flex justify-center px-4" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
              <div className="relative w-full">
                {/* Outer corner brackets for unified card */}
                <div className="absolute -top-3 -left-3 w-8 h-8 border-l-2 border-t-2 border-yellow-500/50" />
                <div className="absolute -top-3 -right-3 w-8 h-8 border-r-2 border-t-2 border-yellow-500/50" />
                <div className="absolute -bottom-3 -left-3 w-8 h-8 border-l-2 border-b-2 border-yellow-500/50" />
                <div className="absolute -bottom-3 -right-3 w-8 h-8 border-r-2 border-b-2 border-yellow-500/50" />

                <div className="bg-black/10 border-2 border-yellow-500/30 backdrop-blur-xl relative overflow-hidden">
                    {/* Top section - Total Gold */}
                    <div className="p-4 sm:p-6 md:p-8 relative">
                      {/* Grid pattern overlay */}
                      <div
                        className="absolute inset-0 opacity-5"
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
                            <span className="text-xs text-orange-400 font-mono uppercase">Paused</span>
                          </>
                        )}
                      </div>

                      {/* Total Gold label */}
                      <div className="text-gray-400 text-sm uppercase tracking-widest font-mono mb-2 relative text-center">
                        TOTAL GOLD
                      </div>

                      {/* Gold amount - Responsive text size */}
                      <div
                        className="text-4xl sm:text-5xl md:text-6xl font-black text-yellow-500 mb-3 tabular-nums font-mono relative text-center"
                        style={{
                          textShadow: '0 0 15px rgba(250, 182, 23, 0.6)',
                          fontSize: 'clamp(2rem, 8vw, 3.75rem)'
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
                            <span className="text-yellow-500/60 font-light uppercase tracking-[0.2em] sm:tracking-[0.3em]">GOLD/HR</span>
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

                      {/* Mek count and verification in one line */}
                      <div className="flex items-center justify-center gap-4 text-xs font-mono">
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
                    <div className="p-4 flex justify-center">
                      <GoldLeaderboard currentWallet={walletAddress || undefined} />
                    </div>
                </div>
              </div>
            </div>

            {/* Verify on Blockchain Button */}
            <div className="mb-12">
              {!verificationStatus?.verified && (
                <div className="mt-[69px]">
                  <div className="w-full max-w-xs mx-auto relative">
                    <div className="relative">
                      <HolographicButton
                        text={isVerifyingBlockchain ? "VERIFYING ON BLOCKCHAIN..." : isProcessingSignature ? "VERIFYING..." : "Blockchain Verify"}
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

                    <p className="text-gray-400 text-sm text-center mt-[22px] font-mono">
                      For an added layer of security, please verify on blockchain to begin.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Controls Row - Search bar and Sort button */}
            <div className={`flex gap-3 items-center justify-between mb-3 sm:mb-4 ${
              ownedMeks.length === 1 ? 'max-w-md mx-auto' :
              ownedMeks.length === 2 ? 'max-w-3xl mx-auto' :
              ownedMeks.length === 3 ? 'max-w-5xl mx-auto' :
              'max-w-7xl mx-auto'
            }`}>
              {/* Search Bar - Minimalist Tech Style */}
              <div className="max-w-lg relative">
                <div className="text-xs text-gray-500 mb-1 px-1">
                  Search by Mek # or variation (e.g., bumblebee, seafoam)
                </div>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-5 py-3 bg-white/5 border-b-2 border-white/20 text-white placeholder-white/30 focus:border-white/40 focus:bg-white/10 focus:outline-none backdrop-blur-sm min-h-[48px] transition-all duration-500 ease-out"
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

              {/* Sort Dropdown - Minimalist Tech Style - Hidden when 2 or fewer meks */}
              {ownedMeks.length > 2 && (
                <div className="relative sort-dropdown-container">
                  <button
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                    className="relative px-5 py-3 bg-white/5 border-b-2 border-white/20 text-white hover:border-white/40 hover:bg-white/10 focus:outline-none backdrop-blur-sm min-h-[48px] transition-all duration-500 ease-out group"
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
                      className="absolute right-0 mt-1 z-50 min-w-[140px] bg-black/90 backdrop-blur-xl border border-white/20 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          setSortType('rate');
                          setSortDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs uppercase tracking-wider hover:bg-white/10 transition-colors duration-200"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                          fontWeight: sortType === 'rate' ? '400' : '300',
                          color: sortType === 'rate' ? 'white' : 'rgba(255,255,255,0.6)'
                        }}
                      >
                        Rate
                      </button>
                      <button
                        onClick={() => {
                          setSortType('level');
                          setSortDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs uppercase tracking-wider hover:bg-white/10 transition-colors duration-200"
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

            {/* Blockchain Verification Panel - Hidden, but keep component for functionality */}
            <div className="mb-6 hidden">
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
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto'
            }`}>
              {[...ownedMeks]
                .filter(mek => {
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
                    // Sort by level (rarityRank - lower rank = higher level)
                    const aRank = a.rarityRank || 9999;
                    const bRank = b.rarityRank || 9999;
                    return aRank - bRank;  // Best rank (lowest number) first
                  }
                })
                .map(mek => {
                const maxGoldRate = Math.max(...ownedMeks.map(m => m.goldPerHour));
                const relativeRate = (mek.goldPerHour / maxGoldRate) * 100;

                return (
                  <div
                    key={mek.assetId}
                    className="group relative cursor-pointer touch-manipulation"
                    onClick={() => setSelectedMek(mek)}
                  >
                    <div
                      className="bg-black/10 border sm:border-2 backdrop-blur-xl transition-all relative overflow-hidden group-hover:bg-black/20"
                      style={{
                        borderColor: (() => {
                          const level = mek.currentLevel || 1;
                          const colors = [
                            '#CCCCCC', // Level 1: light gray
                            '#80FF80', // Level 2: medium light green
                            '#00FF00', // Level 3: saturated green
                            '#32CD32', // Level 4: green
                            '#4169E1', // Level 5: blue
                            '#9370DB', // Level 6: light purple
                            '#6A0DAD', // Level 7: dark purple
                            '#FFA500', // Level 8: orange
                            '#FF6B00', // Level 9: saturated orange
                            '#FF0000', // Level 10: red
                          ];
                          return `${colors[level - 1] || '#FFFFFF'}80`; // 80 = 50% opacity in hex
                        })()
                      }}
                    >
                      {/* Subtle grid overlay */}
                      <div
                        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none"
                        style={{
                          backgroundImage: `
                            repeating-linear-gradient(0deg, transparent, transparent 9px, #FAB617 9px, #FAB617 10px),
                            repeating-linear-gradient(90deg, transparent, transparent 9px, #FAB617 9px, #FAB617 10px)
                          `
                        }}
                      />

                      {/* Image container with border */}
                      <div className="aspect-square bg-black/30 overflow-hidden relative border border-yellow-500/20">
                        {mek.mekNumber ? (
                          <img
                            src={getMekImageUrl(mek.mekNumber, '1000px')}
                            alt={mek.assetName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : mek.imageUrl ? (
                          <img
                            src={mek.imageUrl}
                            alt={mek.assetName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 font-mono text-xs">
                            NO IMAGE
                          </div>
                        )}
                      </div>

                      {/* HOLOGRAPHIC STACK LAYOUT - Exact copy from demo */}
                      <div className="w-full relative">
                        {/* Holographic background effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 via-purple-500/5 to-yellow-500/5 blur-xl" />

                        <div className="relative space-y-2 p-3 bg-black/80 backdrop-blur-sm">
                          {/* Layer 1: Mek Identity */}
                          <div className="relative group">
                            <div
                              className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 backdrop-blur-md border rounded-lg p-2"
                              style={{
                                borderColor: (() => {
                                  const level = mek.currentLevel || 1;
                                  const colors = [
                                    '#CCCCCC', // Level 1: light gray
                                    '#80FF80', // Level 2: medium light green
                                    '#00FF00', // Level 3: saturated green
                                    '#32CD32', // Level 4: green
                                    '#4169E1', // Level 5: blue
                                    '#9370DB', // Level 6: light purple
                                    '#6A0DAD', // Level 7: dark purple
                                    '#FFA500', // Level 8: orange
                                    '#FF6B00', // Level 9: saturated orange
                                    '#FF0000', // Level 10: red
                                  ];
                                  return `${colors[level - 1] || '#FFFFFF'}4D`; // 4D = 30% opacity in hex
                                })()
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-[10px] text-yellow-400 uppercase tracking-wider mb-0.5">Mechanism Unit</div>
                                  {/* Mek Number - color matches level */}
                                  <div className="text-xl font-medium leading-tight" style={{
                                    color: (() => {
                                      const level = mek.currentLevel || 1;
                                      const colors = [
                                        '#CCCCCC', // Level 1: light gray
                                        '#80FF80', // Level 2: medium light green
                                        '#00FF00', // Level 3: saturated green
                                        '#32CD32', // Level 4: green
                                        '#4169E1', // Level 5: blue
                                        '#9370DB', // Level 6: light purple
                                        '#6A0DAD', // Level 7: dark purple
                                        '#FFA500', // Level 8: orange
                                        '#FF6B00', // Level 9: saturated orange
                                        '#FF0000', // Level 10: red
                                      ];
                                      return colors[level - 1] || '#FFFFFF';
                                    })(),
                                    fontFamily: 'Orbitron, monospace',
                                    letterSpacing: '0.05em',
                                    opacity: 0.7
                                  }}>
                                    MEK #{mek.mekNumber ? mek.mekNumber.toString().padStart(4, '0') : '????'}
                                  </div>
                                  {/* Rank display */}
                                  {mek.rarityRank && (
                                    <div className="text-sm text-gray-300 uppercase tracking-wider mt-0.5" style={{
                                      fontFamily: 'monospace',
                                      opacity: 0.85
                                    }}>
                                      Rank: {mek.rarityRank}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] text-yellow-400 uppercase tracking-wider mb-0.5">Level</div>
                                  <div className={`text-2xl font-black leading-tight`} style={{
                                    color: (() => {
                                      const level = mek.currentLevel || 1;
                                      const colors = [
                                        '#CCCCCC', // Level 1: light gray
                                        '#80FF80', // Level 2: medium light green
                                        '#00FF00', // Level 3: saturated green
                                        '#32CD32', // Level 4: green
                                        '#4169E1', // Level 5: blue
                                        '#9370DB', // Level 6: light purple
                                        '#6A0DAD', // Level 7: dark purple
                                        '#FFA500', // Level 8: orange
                                        '#FF6B00', // Level 9: saturated orange
                                        '#FF0000', // Level 10: red
                                      ];
                                      return colors[level - 1] || '#FFFFFF';
                                    })()
                                  }}>
                                    {mek.currentLevel || 1}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Level Progress Bar */}
                          <div className="relative">
                            <div className="bg-black/60 backdrop-blur-md border border-gray-700/50 rounded-lg p-2">
                              {/* Bar Indicators - Locked Style */}
                              <div className="flex justify-between gap-1.5 h-8">
                                {Array.from({ length: 10 }, (_, i) => {
                                  const level = i + 1;
                                  const currentLevel = animatedMekValues[mek.assetId]?.level || mek.currentLevel || 1;
                                  const isActive = level <= currentLevel;
                                  const colors = ['#CCCCCC', '#80FF80', '#00FF00', '#32CD32', '#4169E1', '#9370DB', '#6A0DAD', '#FFA500', '#FF6B00', '#FF0000'];
                                  const currentLevelColor = colors[currentLevel - 1] || '#FFFFFF';

                                  return (
                                    <div
                                      key={level}
                                      className="flex-1 transition-all duration-500 relative overflow-hidden rounded-sm"
                                      style={{
                                        backgroundColor: isActive ? currentLevelColor : '#1a1a1a',
                                        border: isActive ? `1px solid ${currentLevelColor}` : '1px solid #333',
                                        boxShadow: isActive ? `0 0 12px ${currentLevelColor}80, inset 0 -4px 8px rgba(0,0,0,0.4)` : 'inset 0 2px 4px rgba(0,0,0,0.8)',
                                        opacity: isActive ? 1 : 0.3
                                      }}
                                    >
                                      {/* Animated fill effect */}
                                      {isActive && (
                                        <div
                                          className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                                          style={{
                                            height: '100%',
                                            background: `linear-gradient(to top, ${currentLevelColor}, ${currentLevelColor}80 50%, transparent)`,
                                            animation: 'pulse 2s ease-in-out infinite'
                                          }}
                                        />
                                      )}
                                      {/* Highlight stripe */}
                                      {isActive && (
                                        <div
                                          className="absolute top-0 left-0 right-0 h-1/4"
                                          style={{
                                            background: `linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)`
                                          }}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Layer 2: Gold Production */}
                          <div className="relative group">
                            <div className="relative bg-gradient-to-r from-black/60 via-yellow-950/30 to-black/60 backdrop-blur-md border border-yellow-500/30 rounded-lg p-3">
                              <div className="text-[10px] text-yellow-400 uppercase tracking-wider mb-2">Income Rate</div>
                              <div className="flex flex-col gap-1">
                                {/* Base rate */}
                                <div className="flex items-center gap-3">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-[11px] text-gray-500">BASE:</span>
                                    <span className="text-xl font-bold text-yellow-400">{(mek.baseGoldPerHour || mek.goldPerHour).toFixed(1)}</span>
                                    <span className="text-xs text-gray-400">gold/hr</span>
                                  </div>
                                </div>

                                {/* Bonus rate - always shown */}
                                <div className="flex items-center gap-3">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-[11px] text-gray-500">BONUS:</span>
                                    {(animatedMekValues[mek.assetId]?.bonusRate || mek.levelBoostAmount) && (animatedMekValues[mek.assetId]?.bonusRate || mek.levelBoostAmount) > 0 ? (
                                      <>
                                        <span className={`text-xl font-bold text-green-400 transition-all duration-700 ${upgradingMeks.has(mek.assetId) ? 'scale-110' : ''}`}>
                                          +<AnimatedNumber value={animatedMekValues[mek.assetId]?.bonusRate || mek.levelBoostAmount || 0} decimals={1} />
                                        </span>
                                        <span className="text-xs text-gray-400">gold/hr</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-xl font-bold text-gray-600">+0.0</span>
                                        <span className="text-xs text-gray-400">gold/hr</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Separator with glow - always shown */}
                                <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent my-1" />

                                {/* Total - always shown */}
                                <div className="flex items-baseline gap-2">
                                  <span className="text-[11px] text-gray-500">TOTAL:</span>
                                  <span className="text-2xl font-black text-white" style={{
                                    textShadow: '0 0 15px rgba(250, 182, 23, 0.8)'
                                  }}>
                                    <AnimatedNumber value={animatedMekValues[mek.assetId]?.goldRate || ((mek.baseGoldPerHour || mek.goldPerHour) + (mek.levelBoostAmount || 0))} decimals={1} />
                                  </span>
                                  <span className="text-sm text-yellow-400 font-bold">gold/hr</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Layer 4: Upgrade Interface - EXACT COPY FROM DEMO */}
                          {walletAddress && mek.currentLevel < 10 ? (
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />

                              <div className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 backdrop-blur-md border border-green-500/30 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-[10px] text-green-400 uppercase tracking-wider">Upgrade Cost</div>
                                    <div className={`text-xl font-bold ${
                                      (() => {
                                        const UPGRADE_COSTS = [0, 0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];
                                        const currentLevel = mek.currentLevel || 1;
                                        const cost = currentLevel < 10 ? UPGRADE_COSTS[currentLevel + 1] : 0;
                                        return currentGold >= cost ? 'text-yellow-400' : 'text-red-500';
                                      })()
                                    }`}>
                                      {(() => {
                                        // Calculate upgrade cost inline
                                        const UPGRADE_COSTS = [0, 0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];
                                        const currentLevel = mek.currentLevel || 1;
                                        const cost = currentLevel < 10 ? UPGRADE_COSTS[currentLevel + 1] : 0;
                                        return cost.toLocaleString();
                                      })()} gold
                                    </div>
                                    <div className="text-xs text-green-400 mt-1 transition-all duration-500">
                                      Bonus: +{(() => {
                                        const currentLevel = animatedMekValues[mek.assetId]?.level || mek.currentLevel || 1;
                                        const nextLevel = currentLevel + 1;
                                        const baseRate = mek.baseGoldPerHour || mek.goldPerHour;

                                        // Calculate total bonus percentage at next level
                                        let nextLevelPercent = 0;
                                        for (let i = 2; i <= nextLevel; i++) {
                                          nextLevelPercent += 5 + (i - 1) * 5; // 10, 15, 20, 25...
                                        }

                                        const nextLevelBonus = baseRate * (nextLevelPercent / 100);
                                        return nextLevelBonus.toFixed(1);
                                      })()} g/hr
                                    </div>
                                  </div>
                                  <button
                                    onClick={async (e) => {
                                      // Prevent event bubbling to card click
                                      e.stopPropagation();

                                      // Handle upgrade logic
                                      const UPGRADE_COSTS = [0, 0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];
                                      const currentLevel = mek.currentLevel || 1;
                                      const upgradeCost = currentLevel < 10 ? UPGRADE_COSTS[currentLevel + 1] : 0;
                                      const canAfford = currentGold >= upgradeCost;

                                      if (!canAfford || currentLevel >= 10) return;

                                      // Add to upgrading set for animation
                                      setUpgradingMeks(prev => new Set([...prev, mek.assetId]));

                                      // Trigger gold spent animation
                                      const animationId = `${mek.assetId}-${Date.now()}`;
                                      setGoldSpentAnimations(prev => [...prev, { id: animationId, amount: upgradeCost }]);

                                      // Remove animation after 2 seconds
                                      setTimeout(() => {
                                        setGoldSpentAnimations(prev => prev.filter(a => a.id !== animationId));
                                      }, 2000);

                                      // Animate the Mek values immediately
                                      const newLevel = currentLevel + 1;
                                      const baseRate = mek.baseGoldPerHour || mek.goldPerHour;

                                      // Calculate cumulative bonus percentage for new level
                                      let newBonusPercent = 0;
                                      for (let i = 2; i <= newLevel; i++) {
                                        newBonusPercent += 5 + (i - 1) * 5; // 10, 15, 20, 25...
                                      }

                                      const newBonusRate = baseRate * (newBonusPercent / 100);
                                      const newTotalRate = baseRate + newBonusRate;

                                      // Start animating values
                                      setAnimatedMekValues(prev => ({
                                        ...prev,
                                        [mek.assetId]: {
                                          level: newLevel,
                                          goldRate: newTotalRate,
                                          bonusRate: newBonusRate
                                        }
                                      }));

                                      try {
                                        // LOG: Before mutation call
                                        console.log('[UPGRADE] Before mutation call:', {
                                          currentGold,
                                          upgradeCost,
                                          expectedRemaining: currentGold - upgradeCost,
                                          timestamp: new Date().toISOString()
                                        });

                                        // Call the upgrade mutation
                                        const result = await upgradeMek({
                                          walletAddress,
                                          assetId: mek.assetId,
                                          mekNumber: mek.mekNumber,
                                        });

                                        // LOG: Mutation result
                                        console.log('[UPGRADE] Mutation result:', {
                                          result,
                                          timestamp: new Date().toISOString()
                                        });

                                        // CRITICAL FIX: Don't manually update currentGold state!
                                        // The animation loop (line 1268) overwrites any manual setState calls
                                        // within 33ms. Instead, let the query refresh naturally and the animation
                                        // loop will pick up the new goldMiningData.accumulatedGold value.
                                        console.log('[UPGRADE] Waiting for query to refresh with deducted gold:', {
                                          expectedGold: result.remainingGold,
                                          currentGold,
                                          costDeducted: upgradeCost,
                                          timestamp: new Date().toISOString()
                                        });

                                        // Refresh will happen automatically via Convex reactivity
                                        console.log('[UPGRADE] Mek upgraded successfully');

                                        // Remove from upgrading set after success
                                        setTimeout(() => {
                                          setUpgradingMeks(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(mek.assetId);
                                            return newSet;
                                          });
                                          // Clear animated values after data refreshes
                                          setAnimatedMekValues(prev => {
                                            const newValues = { ...prev };
                                            delete newValues[mek.assetId];
                                            return newValues;
                                          });
                                        }, 1000);
                                      } catch (error) {
                                        console.error('Upgrade failed:', error);
                                        // Remove from upgrading set on error
                                        setUpgradingMeks(prev => {
                                          const newSet = new Set(prev);
                                          newSet.delete(mek.assetId);
                                          return newSet;
                                        });
                                        // Clear animated values on error
                                        setAnimatedMekValues(prev => {
                                          const newValues = { ...prev };
                                          delete newValues[mek.assetId];
                                          return newValues;
                                        });
                                      }
                                    }}
                                    disabled={(() => {
                                      const UPGRADE_COSTS = [0, 0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];
                                      const currentLevel = mek.currentLevel || 1;
                                      const upgradeCost = currentLevel < 10 ? UPGRADE_COSTS[currentLevel + 1] : 0;
                                      return currentGold < upgradeCost;
                                    })()}
                                    className={`
                                      px-4 py-2 rounded-lg font-bold uppercase tracking-wide transition-all duration-200 text-sm
                                      ${(() => {
                                        const UPGRADE_COSTS = [0, 0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];
                                        const currentLevel = mek.currentLevel || 1;
                                        const upgradeCost = currentLevel < 10 ? UPGRADE_COSTS[currentLevel + 1] : 0;
                                        const canAfford = currentGold >= upgradeCost;

                                        return canAfford
                                          ? 'bg-gradient-to-r from-green-500/20 to-green-400/20 border-2 border-green-400 text-green-400 hover:from-green-500/30 hover:to-green-400/30 hover:scale-105'
                                          : 'bg-gray-800/40 border border-gray-700 text-gray-500 cursor-not-allowed opacity-50';
                                      })()}
                                    `}
                                  >
                                    UPGRADE
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : walletAddress && mek.currentLevel >= 10 ? (
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-yellow-400/30 to-yellow-500/20 blur-xl animate-pulse" />
                              <div className="relative bg-gradient-to-r from-yellow-500/10 via-yellow-400/20 to-yellow-500/10 backdrop-blur-md border-2 border-yellow-400 rounded-lg p-4 text-center">
                                <div className="text-3xl font-black text-yellow-400 uppercase tracking-wider">
                                  MAXIMUM
                                </div>
                                <div className="text-sm text-gray-300">Optimization Complete</div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {ownedMeks.length === 0 && loadingMeks && (
              <div className="text-center mt-8 sm:mt-12 px-4">
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
              <div className="text-center mt-8 sm:mt-12 px-4">
                <div className="inline-block bg-black/20 border border-yellow-500/20 px-6 sm:px-8 py-5 sm:py-6 backdrop-blur-sm rounded-sm">
                  <p className="text-gray-500 font-mono uppercase tracking-wider text-sm sm:text-base">
                    No Meks detected in wallet
                  </p>
                  <p className="text-gray-600 text-xs sm:text-sm mt-2 font-mono">
                    Acquire Meks to begin gold extraction
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox for selected Mek - Clean Detail View */}
      {selectedMek && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedMek(null)}
        >
          <div
            className="relative w-full max-w-5xl bg-black/80 backdrop-blur-xl border border-yellow-500/40 p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedMek(null)}
              className="absolute top-4 right-4 text-yellow-500 hover:text-yellow-300 text-3xl font-bold z-10 transition-colors"
            >
              ×
            </button>

            <div className="flex flex-col items-center">
              {/* Large Mek Image - Nearly full screen */}
              <div className="relative w-full max-w-3xl mb-6">
                <div className="relative aspect-square bg-black overflow-hidden">
                  {selectedMek.mekNumber ? (
                    <img
                      src={getMekImageUrl(selectedMek.mekNumber, '1000px')}
                      alt={selectedMek.assetName}
                      className="w-full h-full object-contain"
                    />
                  ) : selectedMek.imageUrl ? (
                    <img
                      src={selectedMek.imageUrl}
                      alt={selectedMek.assetName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-mono">
                      NO IMAGE
                    </div>
                  )}
                </div>
              </div>

              {/* Mek Info Below */}
              <div className="w-full max-w-3xl space-y-4">
                {/* Mek Name and Rank */}
                <div className="text-center">
                  <h2 className="text-3xl font-black text-yellow-500 uppercase tracking-wider font-['Orbitron'] mb-2">
                    {selectedMek.assetName}
                  </h2>
                  <p className="text-gray-400 font-mono text-lg">
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
    </div>
  )
}