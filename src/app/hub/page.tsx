"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import { GAME_CONSTANTS } from "@/lib/constants";
import UsernameModal from "@/components/UsernameModal";
import { toastError, toastSuccess } from "@/lib/toast";

export default function HubPage() {

  const [liveGold, setLiveGold] = useState(0);
  const [totalGold, setTotalGold] = useState(0);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [goldPerSecond, setGoldPerSecond] = useState(0);
  const [lastGoldFetch, setLastGoldFetch] = useState(Date.now());
  const [cachedGoldData, setCachedGoldData] = useState<{goldPerHour: number; goldPerSecond: number} | null>(null);
  const [displayGold, setDisplayGold] = useState(0); // Visual display only, updated via ref
  const [optimisticTotalGold, setOptimisticTotalGold] = useState<number | null>(null); // Optimistic gold display
  const [isCollecting, setIsCollecting] = useState(false); // Collecting state
  const [stars, setStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number, twinkle: boolean, direction: string, speed: number, delay: number}>>([]);
  const [currentEmployeePage, setCurrentEmployeePage] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | 'all'>('7d');
  const [chartMode, setChartMode] = useState<'total' | 'rate'>('total');
  const [showSlotBuffsModal, setShowSlotBuffsModal] = useState(false);
  const [employees, setEmployees] = useState([
    // Full gold meks first (sorted by progress: 100)
    { id: 1234, level: 5, rate: 15.5, gold: 968, maxGold: 968, progress: 100, buffed: false, hourCap: '72h' },
    { id: 3691, level: 7, rate: 22.8, gold: 1644, maxGold: 1644, progress: 100, buffed: true, hourCap: '96h' },
    { id: 9052, level: 6, rate: 18.7, gold: 1346, maxGold: 1346, progress: 100, buffed: false, hourCap: '72h' },
    { id: 7231, level: 2, rate: 9.5, gold: 684, maxGold: 684, progress: 100, buffed: true, hourCap: '120h' },
    { id: 5612, level: 8, rate: 25.3, gold: 1820, maxGold: 1820, progress: 100, buffed: false, hourCap: '72h' },
    // Partial progress meks
    { id: 2468, level: 3, rate: 12.2, gold: 523, maxGold: 878, progress: 60, buffed: false, hourCap: '72h' },
    { id: 1847, level: 4, rate: 14.1, gold: 340, maxGold: 1015, progress: 33, buffed: true, hourCap: '96h' },
    { id: 4089, level: 3, rate: 11.8, gold: 425, maxGold: 850, progress: 50, buffed: false, hourCap: '72h' },
    { id: null, level: 0, rate: 0, gold: 0, maxGold: 0, progress: 0, buffed: false, hourCap: '72h' }, // Empty slot
  ]);
  
  // Chart data generation based on period
  const generateChartData = () => {
    if (chartPeriod === '7d') {
      // Smoother line with daily variations
      return {
        points: "0,75 14,72 28,70 42,65 56,68 70,63 84,60 100,58",
        dots: [[0, 75], [14, 72], [28, 70], [42, 65], [56, 68], [70, 63], [84, 60], [100, 58]]
      };
    } else if (chartPeriod === '30d') {
      // More volatile line with bigger jumps
      return {
        points: "0,85 16,78 32,82 48,70 64,74 80,65 100,55",
        dots: [[0, 85], [16, 78], [32, 82], [48, 70], [64, 74], [80, 65], [100, 55]]
      };
    } else {
      // All time - overall upward trend with some dips
      return {
        points: "0,90 20,85 40,80 60,70 80,60 100,45",
        dots: []
      };
    }
  };
  
  const chartData = generateChartData();
  
  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const getInitialGold = useMutation(api.goldTrackingOptimized.getInitialGoldData);
  const getUserDisplayName = useQuery(api.usernames.getUserDisplayName, 
    walletAddress ? { walletAddress } : "skip"
  );
  
  // Check blockchain verification status - MUST be declared before usage
  const verificationStatus = useQuery(
    api.goldMining.isWalletVerified,
    walletAddress && walletAddress !== "demo_wallet_123" ? { walletAddress } : "skip"
  );

  // DEBUGGING: Get goldMining data to check if level bonuses are present
  const goldMiningData = useQuery(
    api.goldMining.getGoldMiningData,
    walletAddress ? { walletAddress } : "skip"
  );

  useEffect(() => {
    const initUser = async () => {
      try {
        // Get wallet from localStorage or use demo
        const storedWallet = localStorage.getItem('walletAddress') || localStorage.getItem('stakeAddress') || "demo_wallet_123";
        setWalletAddress(storedWallet);

        const user = await getOrCreateUser({
          walletAddress: storedWallet
        });
        if (user) {
          setUserId(user._id as Id<"users">);
          setTotalGold(user.gold);

          // Fetch initial gold data once
          try {
            const goldData = await getInitialGold({ userId: user._id as Id<"users"> });

            console.log('[HUB INIT] ===================================');
            console.log('[HUB INIT] getInitialGold returned:', {
              timestamp: new Date().toISOString(),
              goldPerHour: goldData.goldPerHour,
              goldPerSecond: goldData.goldPerSecond,
              pendingGold: goldData.pendingGold,
              totalGold: goldData.totalGold
            });
            console.log('[HUB INIT] ⚠️ NOTE: This data comes from users.goldPerHour, NOT goldMining.totalGoldPerHour!');
            console.log('[HUB INIT] ===================================');

            setCachedGoldData(goldData);

            // DON'T set goldPerSecond yet - wait for verification check
            // setGoldPerSecond will be set by the verification useEffect
            setLiveGold(goldData.pendingGold);
            setLastGoldFetch(Date.now());
          } catch (error) {
            console.error("Failed to fetch initial gold data:", error);
            // Set default values
            setGoldPerSecond(0); // Start at 0 until verified
            setLiveGold(0);
          }
        }
      } catch (error) {
        console.error("Hub: Error initializing user:", error);
        setInitError(String(error));
      }
    };
    initUser();

    // Generate stars for background (moved to useEffect to avoid hydration issues)
    setStars(prevStars => {
      if (prevStars.length > 0) return prevStars; // Only generate once
      return [...Array(60)].map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 3 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkle: Math.random() > 0.5,
        direction: Math.random() > 0.5 ? 'horizontal' : 'vertical', // Random movement direction
        speed: Math.random() * 60 + 120, // Random speed between 120-180 seconds
        delay: Math.random() * 60, // Random delay up to 60 seconds
      }));
    });
  }, [getOrCreateUser, getInitialGold]);

  // DIAGNOSTIC LOGGING: Track goldMiningData changes
  useEffect(() => {
    if (!goldMiningData) return;

    console.log('[HUB SYNC] =================================');
    console.log('[HUB SYNC] goldMiningData received:', {
      timestamp: new Date().toISOString(),
      totalGoldPerHour: goldMiningData.totalGoldPerHour,
      baseGoldPerHour: goldMiningData.baseGoldPerHour,
      boostGoldPerHour: goldMiningData.boostGoldPerHour,
      mekCount: goldMiningData.ownedMeks?.length || 0
    });

    // Check if level boost data exists in ownedMeks array
    const meksWithBoosts = goldMiningData.ownedMeks?.filter(mek =>
      mek.levelBoostAmount && mek.levelBoostAmount > 0
    ) || [];

    console.log('[HUB SYNC] Meks with level bonuses:', meksWithBoosts.length);

    if (meksWithBoosts.length > 0) {
      console.log('[HUB SYNC] Level bonus details:',
        meksWithBoosts.map(mek => ({
          assetName: mek.assetName,
          level: mek.currentLevel,
          baseRate: mek.baseGoldPerHour || mek.goldPerHour,
          boostPercent: mek.levelBoostPercent,
          boostAmount: mek.levelBoostAmount,
          effectiveRate: mek.effectiveGoldPerHour
        }))
      );
    } else {
      console.warn('[HUB SYNC] ⚠️ NO LEVEL BONUSES FOUND in ownedMeks array!');
      console.log('[HUB SYNC] Raw ownedMeks data:', goldMiningData.ownedMeks?.map(mek => ({
        assetName: mek.assetName,
        goldPerHour: mek.goldPerHour,
        baseGoldPerHour: mek.baseGoldPerHour,
        currentLevel: mek.currentLevel,
        levelBoostAmount: mek.levelBoostAmount,
        effectiveGoldPerHour: mek.effectiveGoldPerHour
      })));
    }
    console.log('[HUB SYNC] =================================');
  }, [goldMiningData]);

  // CRITICAL: Enforce verification - control gold rate based on verification status
  useEffect(() => {
    if (!cachedGoldData) return; // Wait for gold data to load

    console.log('[HUB RATE] Setting gold rate from cachedGoldData:', {
      timestamp: new Date().toISOString(),
      goldPerSecond: cachedGoldData.goldPerSecond,
      goldPerHour: cachedGoldData.goldPerHour
    });

    // Demo wallet: always allow gold accumulation
    if (walletAddress === "demo_wallet_123") {
      console.log('[Hub] Demo wallet - enabling gold accumulation');
      setGoldPerSecond(cachedGoldData.goldPerSecond);
      return;
    }

    // Real wallet: check verification status
    if (walletAddress && verificationStatus) {
      if (verificationStatus.isVerified) {
        // User IS verified - enable gold accumulation
        console.log('[Hub] Wallet verified - enabling gold accumulation');
        setGoldPerSecond(cachedGoldData.goldPerSecond);
      } else {
        // User is NOT verified - freeze gold accumulation
        console.log('[Hub] Wallet NOT verified - freezing gold accumulation at 0');
        setGoldPerSecond(0);
      }
    } else if (walletAddress) {
      // Verification status not loaded yet - keep at 0
      console.log('[Hub] Waiting for verification status...');
      setGoldPerSecond(0);
    }
  }, [verificationStatus, cachedGoldData, walletAddress]);

  // Check if user has set display name
  useEffect(() => {
    if (getUserDisplayName && walletAddress && walletAddress !== "demo_wallet_123") {
      if (!getUserDisplayName.displayNameSet) {
        // TEMPORARILY DISABLED: Auto-show username modal
        // setShowUsernameModal(true);
      } else {
        setDisplayName(getUserDisplayName.displayName || null);
      }
    }
  }, [getUserDisplayName, walletAddress]);

  // Get user profile with real-time updates
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId && walletAddress ? { walletAddress } : "skip"
  );

  const liveGoldData = null; // Server polling disabled for bandwidth optimization
  
  const collectGold = useMutation(api.goldTracking.collectGold);
  const setGoldRate = useMutation(api.updateGoldRate.setGoldRate);
  
  
  // Update gold data when fetched (every 30 seconds)
  useEffect(() => {
    if (liveGoldData) {
      setTotalGold(Math.floor(liveGoldData.gold));
      setGoldPerSecond(liveGoldData.rate / 3600);
      setLiveGold(liveGoldData.pending);
      setLastGoldFetch(Date.now());
    }
  }, [liveGoldData]);
  
  // Animate live gold counter with smooth visual updates using direct DOM manipulation
  useEffect(() => {
    // ONLY animate if verified OR if using demo wallet
    const isVerified = verificationStatus?.isVerified || walletAddress === "demo_wallet_123";

    if (goldPerSecond > 0 && isVerified && liveGold !== null) {
      let lastTimestamp = performance.now();
      let animationFrameId: number;
      const goldDisplayElement = document.getElementById('live-gold-display');

      const animate = (timestamp: number) => {
        const deltaTime = (timestamp - lastTimestamp) / 1000; // Convert to seconds
        lastTimestamp = timestamp;

        const maxGold = (cachedGoldData?.goldPerHour || GAME_CONSTANTS.DEFAULT_GOLD_RATE) * GAME_CONSTANTS.MAX_GOLD_CAP_HOURS;
        const increment = goldPerSecond * deltaTime;

        setLiveGold(prev => {
          const newGold = Math.min(prev + increment, maxGold);

          // Update DOM directly for smooth visual updates
          if (goldDisplayElement) {
            goldDisplayElement.textContent = newGold.toFixed(2);
          }

          return newGold;
        });

        animationFrameId = requestAnimationFrame(animate);
      };

      animationFrameId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [goldPerSecond, cachedGoldData, verificationStatus, walletAddress]);
  
  const collectAllGold = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!userId || isCollecting) return;

    const goldToCollect = Math.floor(liveGold);
    if (goldToCollect === 0) return;

    // OPTIMISTIC UPDATE: Update UI immediately
    setIsCollecting(true);
    const expectedTotalGold = totalGold + goldToCollect;
    setOptimisticTotalGold(expectedTotalGold);
    setLiveGold(0); // Clear collected gold immediately

    // Animate counting up
    animateGoldCount(totalGold, expectedTotalGold, (value) => {
      setTotalGold(value);
    });

    // Add animation to button
    const button = e.currentTarget;
    button.classList.add('collecting');
    setTimeout(() => {
      button.classList.remove('collecting');
    }, 500);

    // Collect gold from server
    try {
      const result = await collectGold({ userId });

      // SUCCESS: Sync with real data
      setOptimisticTotalGold(null);
      setTotalGold(Math.floor(result.totalGold));

      // Show popup with collected gold and XP
      showGoldPopup(Math.floor(result.collected), result.xpGained || 0, result.leveledUp || false, result.currentLevel || 1);
    } catch (error) {
      console.error("Failed to collect gold:", error);

      // ROLLBACK: Restore previous state
      setOptimisticTotalGold(null);
      setTotalGold(totalGold);
      setLiveGold(goldToCollect);

      // Show error notification using toast
      toastError('Failed to collect gold. Please try again.');
    } finally {
      setIsCollecting(false);
    }
  };
  
  const animateGoldCount = (start: number, end: number, callback: (value: number) => void) => {
    const duration = 1000; // 1 second
    const startTime = Date.now();
    const difference = end - start;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + difference * easeOutQuart);
      
      callback(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        callback(end); // Ensure we end at exact value
      }
    };
    
    requestAnimationFrame(animate);
  };
  
  const showGoldPopup = (amount: number, xpGained: number = 0, leveledUp: boolean = false, currentLevel: number = 1) => {
    // Create popup element
    const popup = document.createElement('div');
    popup.className = 'gold-popup';
    
    // Calculate XP if not provided (fallback)
    if (xpGained === 0 && amount > 0) {
      xpGained = Math.floor(amount / 10);
    }
    
    // Build popup content
    let content = `<div style="text-align: center;">`;
    content += `<div style="font-size: 24px; margin-bottom: 8px;">+${amount} Gold Collected!</div>`;
    
    // Always show XP (even if calculated)
    content += `<div style="font-size: 18px; color: #a855f7;">+${xpGained} XP Gained!</div>`;
    
    if (leveledUp) {
      content += `<div style="font-size: 20px; color: #10b981; margin-top: 8px;">🎉 Level ${currentLevel}!</div>`;
    }
    
    content += `</div>`;
    popup.innerHTML = content;
    
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #ffcc00, #ffaa00);
      color: #000;
      padding: 20px 40px;
      border-radius: 10px;
      font-weight: bold;
      z-index: 9999;
      animation: goldPopup 1.5s ease-out forwards;
      box-shadow: 0 10px 40px rgba(255, 204, 0, 0.5);
    `;
    
    document.body.appendChild(popup);
    
    // Remove after animation
    setTimeout(() => {
      popup.remove();
    }, 1500);
  };
  

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-2xl mb-4">Error Loading Hub</div>
          <div className="text-gray-400">{initError}</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-yellow-400 text-2xl animate-pulse">
          Initializing user...
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-400 text-2xl animate-pulse mb-4">
            Loading Hub...
          </div>
          <div className="text-gray-500 text-sm">
            Connecting to game server...
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen text-white overflow-hidden relative">
      <style jsx>{`
        @keyframes collectGold {
          0% { transform: scale(1); }
          50% { transform: scale(1.2) rotate(5deg); box-shadow: 0 0 30px rgba(250, 182, 23, 0.8); }
          100% { transform: scale(1); }
        }
        .collecting {
          animation: collectGold 0.5s ease-in-out;
        }
        @keyframes pulsateGlow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(250, 182, 23, 0.6), 0 0 40px rgba(250, 182, 23, 0.3), inset 0 0 20px rgba(250, 182, 23, 0.1);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 30px rgba(250, 182, 23, 0.8), 0 0 60px rgba(250, 182, 23, 0.4), inset 0 0 30px rgba(250, 182, 23, 0.2);
            transform: scale(1.05);
          }
        }
        .pulsate-glow {
          animation: pulsateGlow 2s ease-in-out infinite;
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes drift {
          from { transform: translateX(-100px); }
          to { transform: translateX(calc(100vw + 100px)); }
        }
        @keyframes slowDriftHorizontal {
          from { transform: translateX(-20px); }
          to { transform: translateX(calc(100vw + 20px)); }
        }
        @keyframes slowDriftVertical {
          from { transform: translateY(-20px); }
          to { transform: translateY(calc(100vh + 20px)); }
        }
        @keyframes slowFloat {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, -15px) rotate(0.5deg); }
          50% { transform: translate(-5px, -25px) rotate(-0.3deg); }
          75% { transform: translate(-15px, -10px) rotate(0.2deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes goldPopup {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1) translateY(-50px);
          }
        }
      `}</style>
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Yellow gradient orbs from sides - offset vertically */}
        <div 
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 0% 30%, rgba(250, 182, 23, 0.15) 0%, transparent 40%),
              radial-gradient(ellipse at 100% 70%, rgba(250, 182, 23, 0.15) 0%, transparent 40%)
            `
          }}
        />
        
        {/* Dynamic Stars */}
        {stars.map((star) => {
          // Determine movement animation based on direction
          let movementAnimation = '';
          if (star.direction === 'horizontal') {
            movementAnimation = `slowDriftHorizontal ${star.speed}s linear infinite`;
          } else if (star.direction === 'vertical') {
            movementAnimation = `slowDriftVertical ${star.speed}s linear infinite`;
          } else {
            movementAnimation = `slowFloat ${star.speed}s ease-in-out infinite`;
          }
          
          // Combine twinkle and movement animations
          const animations = [
            movementAnimation,
            star.twinkle ? `starTwinkle ${2 + star.size}s ease-in-out infinite` : ''
          ].filter(Boolean).join(', ');
          
          return (
            <div
              key={star.id}
              className="absolute rounded-full bg-white"
              style={{
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animation: animations,
                animationDelay: `${star.delay}s, ${star.twinkle ? star.opacity * 2 : 0}s`,
              }}
            />
          );
        })}
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 py-6">
        
        {/* Hub Title Section */}
        <div
          className="relative mb-6 rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
            border: '2px solid #fab617',
            boxShadow: '0 0 20px rgba(250, 182, 23, 0.3)',
            padding: '20px',
            marginBottom: 'calc(1.5rem - 25px)'
          }}
        >
          {/* Green inner border */}
          <div 
            className="absolute inset-[2px] rounded-xl pointer-events-none"
            style={{
              border: '1px solid #00ff88',
              opacity: 0.5
            }}
          />
          
          {/* Drifting Asteroids */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={`asteroid-${i}`}
                className="absolute"
                style={{
                  left: `${-10 + i * 30}%`,
                  top: `${20 + (i % 2) * 40}%`,
                  width: '3px',
                  height: '3px',
                  background: '#666',
                  borderRadius: '50%',
                  opacity: 0.3,
                  animation: `drift ${20 + i * 5}s linear infinite`,
                  animationDelay: `${i * 2}s`
                }}
              />
            ))}
          </div>
          
          <div className="relative flex items-center justify-center px-4" style={{ minHeight: '60px' }}>
            {/* Total Gold Display - Absolute positioned */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col">
              <div className="gold-display-medium">
                {Math.floor(optimisticTotalGold ?? totalGold).toLocaleString()}
              </div>
              <div 
                style={{
                  color: '#fab617',
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                  textTransform: 'uppercase',
                  marginTop: '4px',
                  opacity: 0.8
                }}
              >
                Total Gold
              </div>
            </div>
            
            {/* Hub Title - Truly centered */}
            <div className="text-center flex flex-col items-center justify-center">
              <h1 
                style={{
                  fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
                  fontSize: '42px',
                  fontWeight: 900,
                  color: '#fab617',
                  letterSpacing: '0.15em',
                  textShadow: '0 0 20px rgba(250, 182, 23, 0.6)',
                  margin: 0,
                  lineHeight: '1'
                }}
              >
                HUB
              </h1>
              
              <p 
                style={{
                  fontSize: '10px',
                  color: '#999',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3em',
                  marginTop: '4px',
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace"
                }}
              >
                Your Tycoon at a Glance
              </p>
              
              {displayName && (
                <div 
                  style={{
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    fontSize: '14px',
                    color: '#00ff88',
                    letterSpacing: '0.05em',
                    marginTop: '8px',
                    marginBottom: '4px'
                  }}
                >
                  Welcome, {displayName}
                </div>
              )}
              
              {/* Account Controls */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setShowUsernameModal(true)}
                  className="px-4 py-1.5 text-xs text-gray-300 hover:text-white bg-gray-900/50 hover:bg-gray-800/60 rounded transition-all duration-200"
                  style={{
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    letterSpacing: '0.05em',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  Edit Name
                </button>
                {walletAddress && walletAddress !== "demo_wallet_123" ? (
                  <button
                    onClick={() => {
                      // Disconnect wallet
                      localStorage.removeItem('walletAddress');
                      localStorage.removeItem('stakeAddress');
                      window.location.href = '/';
                    }}
                    className="px-4 py-1.5 text-xs text-gray-400 hover:text-gray-300 bg-transparent hover:bg-gray-900/30 rounded transition-all duration-200"
                    style={{
                      fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      letterSpacing: '0.05em',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      // Go to home page to connect wallet
                      window.location.href = '/';
                    }}
                    className="px-4 py-1.5 text-xs text-gray-300 hover:text-white bg-gray-900/50 hover:bg-gray-800/60 rounded transition-all duration-200"
                    style={{
                      fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      letterSpacing: '0.05em',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
            
            {/* Live Earnings - Absolute positioned */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col text-right">
              <div
                id="live-gold-display"
                style={{
                  fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                  fontSize: '24px',
                  fontWeight: 200,
                  color: '#fab617',
                  letterSpacing: '1px',
                  lineHeight: '1',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {liveGold.toFixed(2)}
              </div>
              <div 
                style={{
                  color: '#fab617',
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                  textTransform: 'uppercase',
                  marginTop: '4px',
                  opacity: 0.8
                }}
              >
                Earnings to Collect
              </div>
            </div>
          </div>
        </div>

        {/* VERIFICATION WARNING - Only show if wallet exists but is NOT verified */}
        {verificationStatus && verificationStatus.exists && !verificationStatus.isVerified && (
          <div
            className="mb-6 p-6 rounded-xl border-4"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.25) 100%)',
              borderColor: '#ef4444',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.4), inset 0 0 20px rgba(239, 68, 68, 0.1)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="text-4xl"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.6))'
                }}
              >
                ⚠️
              </div>
              <div className="flex-1">
                <h3
                  className="text-xl font-bold mb-2"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    color: '#fef2f2',
                    textShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
                    letterSpacing: '0.05em'
                  }}
                >
                  BLOCKCHAIN VERIFICATION REQUIRED
                </h3>
                <p
                  className="text-base mb-4"
                  style={{
                    color: '#fecaca',
                    lineHeight: '1.6'
                  }}
                >
                  Your wallet is connected, but <strong>you must verify NFT ownership on the blockchain before you can start earning gold</strong>.
                  Without verification, your gold accumulation is paused at {Math.floor(liveGold)} gold.
                </p>
                <Link
                  href="/admin-master-data"
                  className="inline-block px-6 py-3 rounded-lg font-bold transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    fontFamily: "'Orbitron', sans-serif",
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                    textTransform: 'uppercase',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                  }}
                >
                  Verify NFT Ownership Now →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Unified Stats */}
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-yellow-500/30">
          {/* Economy Status */}
          <div className="mb-4">
            <h3 className="text-xs text-yellow-400 uppercase tracking-wider mb-2 font-semibold">
              Economy Status
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div 
                className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all cursor-pointer"
                onClick={async () => {
                  // Update to 8,743 g/hr for testing (~2.43 gold per second)
                  try {
                    const result = await setGoldRate({ 
                      walletAddress: "demo_wallet_123", 
                      goldPerHour: GAME_CONSTANTS.TEST_GOLD_RATE 
                    });
                    // Update local state immediately
                    setGoldPerSecond(result.goldPerSecond);
                    setCachedGoldData(prev => ({ ...prev, goldPerHour: GAME_CONSTANTS.TEST_GOLD_RATE, goldPerSecond: result.goldPerSecond }));
                  } catch (error) {
                    // Failed to update gold rate
                  }
                }}
              >
                <div className="text-lg font-bold text-yellow-400">{((cachedGoldData?.goldPerHour || liveGoldData?.rate) || GAME_CONSTANTS.DEFAULT_GOLD_RATE).toFixed(1)}/hr</div>
                <div className="text-xs text-gray-400">Gold Rate (Click for 8.7k)</div>
              </div>
              <div className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all">
                <div className="text-lg font-bold text-yellow-400">
                  {Object.values(userProfile.totalEssence).reduce((a, b) => a + b, 0).toFixed(1)}
                </div>
                <div className="text-xs text-gray-400">Total Essence</div>
              </div>
              <div className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all cursor-pointer">
                <div className="text-lg font-bold text-yellow-400">0.100/day</div>
                <div className="text-xs text-gray-400">Essence Rate</div>
              </div>
            </div>
          </div>
          
          {/* Activity & Progress */}
          <div className="pt-4 border-t border-gray-700/50">
            <h3 className="text-xs text-yellow-400 uppercase tracking-wider mb-2 font-semibold">
              Activity & Progress
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all">
                <div className="text-lg font-bold text-yellow-400">12</div>
                <div className="text-xs text-gray-400">AH Listings</div>
              </div>
              <div className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all">
                <div className="text-lg font-bold text-yellow-400">45,000</div>
                <div className="text-xs text-gray-400">Total XP</div>
              </div>
              <Link 
                href="/xp-allocation" 
                className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all cursor-pointer"
              >
                <div className="text-lg font-bold text-yellow-400">15,000</div>
                <div className="text-xs text-gray-400">Unspent XP</div>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Two Column Layout - Active Employees and Gold Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Active Employees Card - Left Column */}
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-center flex-1" style={{
                fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
                letterSpacing: '0.1em',
                color: '#fab617',
                textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
              }}>
                Active Employees
              </h3>
            <div className="flex gap-2 flex-wrap">
              <Link 
                href="/meks" 
                className="px-3 py-1 text-xs rounded transition-colors bg-gray-700/50 text-gray-400 hover:bg-gray-700 border border-gray-600/50"
              >
                See All Meks
              </Link>
              <button
                onClick={collectAllGold}
                disabled={isCollecting || liveGold === 0}
                className={`px-3 py-1 text-xs rounded transition-colors border border-gray-600/50 ${
                  isCollecting || liveGold === 0
                    ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {isCollecting ? 'Collecting...' : 'Collect All'}
              </button>
            </div>
          </div>
          
          {/* Employee data */}
          {(() => {
            
            const startIdx = currentEmployeePage * 5;
            const endIdx = Math.min(startIdx + 5, employees.length);
            const pageEmployees = employees.slice(startIdx, endIdx);
            
            return pageEmployees.map((emp, idx) => {
              if (emp.id === null) {
                // Empty slot
                return (
                  <div key={`empty-${idx}`} className="mb-2 p-1.5 bg-gradient-to-r from-yellow-500/10 to-gray-900/10 rounded-lg flex items-center justify-between" style={{ minHeight: '72px' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 border-2 border-yellow-500 border-dashed rounded-full flex items-center justify-center text-xl text-yellow-500 hover:bg-yellow-500/20 cursor-pointer transition-colors">
                        +
                      </div>
                      <div>
                        <div className="font-semibold text-yellow-400 text-sm">Empty Slot Available</div>
                        <div className="text-xs text-gray-400">Assign a Mek to start earning</div>
                      </div>
                    </div>
                    <button className="ml-3 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded transition-colors border border-gray-600 animate-pulse">
                      Assign
                    </button>
                  </div>
                );
              }
              
              return (
                <div key={emp.id} className="mb-2 p-1.5 bg-gray-900/50 rounded-lg flex items-center justify-between" style={{ minHeight: '72px' }}>
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className="w-12 h-12 bg-gray-700 rounded-md flex items-center justify-center overflow-hidden">
                      <img 
                        src="/mek-images/150px/000-000-000.webp" 
                        alt={`Mek #${emp.id}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling!.textContent = 'MEK';
                        }}
                      />
                      <span className="text-gray-400 text-xs hidden">MEK</span>
                    </div>
                    <div className="flex-1 mr-1">
                      <div className="font-medium text-sm">Mek #{emp.id} - Level {emp.level}</div>
                      <div className="text-xs space-y-0.5">
                        <div className="text-yellow-400 font-medium">Rate: {emp.rate}/hr</div>
                        <div className={emp.gold === emp.maxGold ? "text-red-400 font-medium" : "text-gray-400"}>
                          Gold: {emp.gold}/{emp.maxGold} 
                          <span className={emp.buffed ? "text-green-400" : "text-gray-400"}>({emp.hourCap} cap)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1 overflow-hidden mr-1" style={{boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'}}>
                        <div 
                          className="h-1.5 rounded-full transition-all relative" 
                          style={{
                            width: `${emp.progress}%`,
                            background: `linear-gradient(90deg, #fab617 0%, #ffd700 50%, #fab617 100%)`,
                            boxShadow: '0 0 10px rgba(250, 182, 23, 0.5)',
                          }}
                        >
                          <div 
                            className="absolute inset-0 opacity-50"
                            style={{
                              background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      // Collect individual mek gold
                      const mekGold = emp.gold;
                      
                      // Update the employee's gold to 0 and recalculate progress
                      setEmployees(prevEmployees => 
                        prevEmployees.map(employee => 
                          employee.id === emp.id 
                            ? { ...employee, gold: 0, progress: 0 }
                            : employee
                        )
                      );
                      
                      // Animate counting up
                      animateGoldCount(totalGold, totalGold + mekGold, (value) => {
                        setTotalGold(value);
                      });
                      
                      // Add animation to button
                      const button = e.currentTarget;
                      button.classList.add('collecting');
                      setTimeout(() => {
                        button.classList.remove('collecting');
                      }, 500);
                      
                      // Show popup with XP
                      const xpGained = Math.floor(mekGold / 10);
                      showGoldPopup(mekGold, xpGained, false, 1);
                    }}
                    className={`ml-1 px-3 py-1.5 text-sm font-medium rounded transition-all duration-200 ${
                      emp.gold === emp.maxGold 
                        ? "border-2 border-yellow-500 bg-transparent text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 pulsate-glow"
                        : emp.gold > 0
                        ? "border-2 border-yellow-500 bg-transparent text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
                        : "border border-gray-600 bg-transparent text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={emp.gold === 0}
                  >
                    Collect
                  </button>
                </div>
              );
            });
          })()}
          
          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button 
              onClick={() => setCurrentEmployeePage(Math.max(0, currentEmployeePage - 1))}
              disabled={currentEmployeePage === 0}
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600"
            >
              ← Previous
            </button>
            <div className="flex gap-2">
              {[0, 1].map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentEmployeePage(page)}
                  className={`w-8 h-8 rounded ${currentEmployeePage === page ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'} transition-colors`}
                >
                  {page + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentEmployeePage(Math.min(1, currentEmployeePage + 1))}
              disabled={currentEmployeePage === 1}
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600"
            >
              Next →
            </button>
          </div>
          
          <div className="text-center mt-4">
            <button 
              onClick={() => setShowSlotBuffsModal(true)}
              className="px-6 py-3 bg-transparent border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 rounded transition-all duration-200 font-semibold"
            >
              <span className="mr-2">+</span> Add Slot
            </button>
          </div>
          </div>
          
          {/* Gold Stats Card - Right Column */}
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 self-start">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-center mb-3" style={{
                fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
                letterSpacing: '0.1em',
                color: '#fab617',
                textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
              }}>Growth</h3>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setChartMode('total')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    chartMode === 'total' 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Total Gold
                </button>
                <button
                  onClick={() => setChartMode('rate')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    chartMode === 'rate' 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Gold/hr
                </button>
              </div>
            </div>
            
            {/* Gold History Chart */}
            <div className="mb-6">
              <div className="h-32 bg-gray-900/50 rounded-lg p-2 relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
                  <span>{Math.floor((totalGold + liveGold) * 1.33).toLocaleString()}</span>
                  <span>{Math.floor((totalGold + liveGold) * 0.67).toLocaleString()}</span>
                  <span>0</span>
                </div>
                
                {/* Chart area */}
                <div className="ml-12 h-full relative">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="0.5"/>
                    <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="0.5"/>
                    <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="0.5"/>
                    
                    {/* Dynamic line chart based on period */}
                    <polyline
                      points={chartData.points}
                      fill="none"
                      stroke="#fab617"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    
                    {/* Data points (dots) for 7d and 30d views */}
                    {chartData.dots.map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r="1.5" fill="#fab617" stroke="#000" strokeWidth="0.5" vectorEffect="non-scaling-stroke"/>
                    ))}
                    
                    <polyline
                      points={chartData.points}
                      fill="url(#goldGradient)"
                      fillOpacity="0.2"
                    />
                    
                    <defs>
                      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fab617" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#fab617" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* X-axis dates moved down */}
                  <div className="absolute -bottom-10 left-0 right-0 flex justify-between text-xs text-gray-500">
                    {chartPeriod === '7d' && (
                      <>
                        <span>Aug 20</span>
                        <span>Aug 22</span>
                        <span>Aug 24</span>
                        <span>Aug 26</span>
                        <span>Today</span>
                      </>
                    )}
                    {chartPeriod === '30d' && (
                      <>
                        <span>Jul 28</span>
                        <span>Aug 7</span>
                        <span>Aug 17</span>
                        <span>Today</span>
                      </>
                    )}
                    {chartPeriod === 'all' && (
                      <>
                        <span>Jan 2024</span>
                        <span>May 2024</span>
                        <span>Aug 2024</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Time Period Buttons - moved down to avoid overlapping x-axis */}
              <div className="flex justify-center gap-2 mt-12">
                <button
                  onClick={() => setChartPeriod('7d')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    chartPeriod === '7d' 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setChartPeriod('30d')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    chartPeriod === '30d' 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  30 Days
                </button>
                <button
                  onClick={() => setChartPeriod('all')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    chartPeriod === 'all' 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Base Mek Gold */}
              <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                <span className="text-gray-400 text-sm">Base Mek Gold/hr:</span>
                <span className="text-yellow-400 font-semibold">{Math.floor(goldPerSecond * 3600).toLocaleString()}</span>
              </div>
              
              {/* Bank Interest */}
              <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                <span className="text-gray-400 text-sm">Gold in Bank:</span>
                <span className="text-white">0</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                <span className="text-gray-400 text-sm">Bank Interest Rate:</span>
                <span className="text-green-400">0%</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                <span className="text-gray-400 text-sm">Gold/hr from Bank:</span>
                <span className="text-green-400">0</span>
              </div>
              
              {/* Talent Trees */}
              <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                <span className="text-gray-400 text-sm">Gold/hr from Talent Trees:</span>
                <span className="text-blue-400">0</span>
              </div>
              
              {/* Equipped Items */}
              <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                <span className="text-gray-400 text-sm">Gold/hr from Items:</span>
                <span className="text-purple-400">0</span>
              </div>
              
              {/* Grand Total Section */}
              <div className="mt-4 pt-4 border-t-2 border-yellow-500/50 text-center">
                <div className="text-gray-300 text-sm font-medium mb-2">Total Gold/hr</div>
                <div 
                  style={{ 
                    fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
                    fontSize: '32px',
                    fontWeight: 700,
                    color: '#fab617',
                    letterSpacing: '0.05em',
                    textShadow: '0 0 15px rgba(250, 182, 23, 0.6), 0 0 30px rgba(250, 182, 23, 0.3)',
                    lineHeight: '1',
                    background: 'linear-gradient(135deg, #fab617 0%, #ffd700 50%, #fab617 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {Math.floor(goldPerSecond * 3600).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Epic Production Rate</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity and Essence Overview - Two Column Layout */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Recent Activity - Left Column */}
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <h3 className="text-lg font-bold mb-4" style={{
              fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
              letterSpacing: '0.1em',
              color: '#fab617',
              textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
            }}>
              Recent Activity
            </h3>
            <div className="space-y-2">
              {/* Activity items with timestamps and gold amounts */}
              <div className="flex items-start gap-3 p-2 rounded bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 animate-pulse"></div>
                <div className="flex-1">
                  <div className="text-sm text-gray-200">Collected <span className="text-yellow-400 font-semibold">247g</span> from Mek #1234</div>
                  <div className="text-xs text-gray-500">2 minutes ago</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-2 rounded bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5"></div>
                <div className="flex-1">
                  <div className="text-sm text-gray-200">Listed <span className="text-green-400">Disco Head</span> for <span className="text-yellow-400 font-semibold">1,200g</span></div>
                  <div className="text-xs text-gray-500">15 minutes ago</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-2 rounded bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5"></div>
                <div className="flex-1">
                  <div className="text-sm text-gray-200">Purchased <span className="text-purple-400">2x Pearls</span> for <span className="text-yellow-400 font-semibold">500g</span></div>
                  <div className="text-xs text-gray-500">1 hour ago</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-2 rounded bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5"></div>
                <div className="flex-1">
                  <div className="text-sm text-gray-200">Hired <span className="text-blue-400">Mentor #2468</span> for 24 hours</div>
                  <div className="text-xs text-gray-500">2 hours ago</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-2 rounded bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5"></div>
                <div className="flex-1">
                  <div className="text-sm text-gray-200">Mek #5612 reached <span className="text-yellow-400">Level 8</span></div>
                  <div className="text-xs text-gray-500">3 hours ago</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-2 rounded bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5"></div>
                <div className="flex-1">
                  <div className="text-sm text-gray-200">Outbid on <span className="text-red-400">Camera Head</span></div>
                  <div className="text-xs text-gray-500">5 hours ago</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-700/50">
              <button className="w-full px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded transition-all duration-200 text-sm font-medium border border-gray-600">
                View Full History
              </button>
            </div>
          </div>
          
          {/* Essence at a Glance - Right Column */}
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <h3 className="text-lg font-bold mb-4" style={{
              fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
              letterSpacing: '0.1em',
              color: '#fab617',
              textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
            }}>
              Essence Collection
            </h3>
            
            {/* Top 10 Essence Grid */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[
                { name: 'Pearls', amount: 24, color: '#e0e7ff' },
                { name: 'Disco', amount: 18, color: '#fce7f3' },
                { name: 'Camera', amount: 15, color: '#dbeafe' },
                { name: 'Metal', amount: 12, color: '#e5e7eb' },
                { name: 'Crystal', amount: 10, color: '#f3e8ff' },
                { name: 'Flame', amount: 8, color: '#fef3c7' },
                { name: 'Ice', amount: 7, color: '#cffafe' },
                { name: 'Nature', amount: 5, color: '#d1fae5' },
                { name: 'Thunder', amount: 4, color: '#fef9c3' },
                { name: 'Shadow', amount: 2, color: '#f3f4f6' },
              ].map((essence, idx) => (
                <div 
                  key={idx}
                  className="relative group cursor-pointer"
                >
                  <div 
                    className="aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-200 hover:scale-110 border-2"
                    style={{
                      background: `linear-gradient(135deg, ${essence.color}20, ${essence.color}40)`,
                      borderColor: essence.color + '60',
                      boxShadow: `0 0 10px ${essence.color}30`
                    }}
                  >
                    <img 
                      src="/essence-vial.gif" 
                      alt={essence.name}
                      className="w-8 h-8 mb-1 mx-auto"
                    />
                    <div className="text-xs font-bold text-white">{essence.amount}</div>
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {essence.name} Essence
                  </div>
                </div>
              ))}
            </div>
            
            {/* Essence Stats */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center p-2 bg-gray-900/30 rounded">
                <span className="text-sm text-gray-400">Total Essence Types</span>
                <span className="text-sm font-bold text-yellow-400">27</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-900/30 rounded">
                <span className="text-sm text-gray-400">Total Essence Count</span>
                <span className="text-sm font-bold text-yellow-400">126</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-900/30 rounded">
                <span className="text-sm text-gray-400">Essence per Day</span>
                <span className="text-sm font-bold text-green-400">+0.100</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-900/30 rounded">
                <span className="text-sm text-gray-400">Next Essence In</span>
                <span className="text-sm font-bold text-blue-400">14h 23m</span>
              </div>
            </div>
            
            {/* Link to Essence Page */}
            <Link 
              href="/essence"
              className="block w-full px-4 py-3 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 hover:from-yellow-500/30 hover:to-yellow-600/30 text-yellow-400 rounded transition-all duration-200 text-center font-semibold border border-yellow-500/50 hover:border-yellow-500"
            >
              <span className="mr-2">✨</span>
              Manage Essence Collection
            </Link>
          </div>
        </div>
        
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/crafting" className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-yellow-500 transition-all text-center">
            <div className="text-2xl mb-2">🔨</div>
            <div className="font-semibold">Crafting</div>
          </Link>
          <Link href="/mek-assignment" className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-yellow-500 transition-all text-center">
            <div className="text-2xl mb-2">🎰</div>
            <div className="font-semibold">Assign Mek</div>
          </Link>
          <Link href="/inventory" className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-yellow-500 transition-all text-center">
            <div className="text-2xl mb-2">🎒</div>
            <div className="font-semibold">Inventory</div>
          </Link>
          <Link href="/meks" className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-yellow-500 transition-all text-center">
            <div className="text-2xl mb-2">🤖</div>
            <div className="font-semibold">My Meks</div>
          </Link>
        </div>
      </div>
      
      {/* Username Modal */}
      {showUsernameModal && walletAddress && (
        <UsernameModal
          isOpen={showUsernameModal}
          walletAddress={walletAddress}
          onClose={() => setShowUsernameModal(false)}
          onSuccess={(name) => {
            setDisplayName(name);
            setShowUsernameModal(false);
          }}
        />
      )}
      
    </div>
  );
}