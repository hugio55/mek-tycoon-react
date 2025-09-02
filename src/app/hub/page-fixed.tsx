"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import { GAME_CONSTANTS } from "@/lib/constants";
import UsernameModal from "@/components/UsernameModal";

export default function HubPage() {
  
  const [liveGold, setLiveGold] = useState(0);
  const [totalGold, setTotalGold] = useState(0);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [goldPerSecond, setGoldPerSecond] = useState(0);
  const [lastGoldFetch, setLastGoldFetch] = useState(Date.now());
  const [cachedGoldData, setCachedGoldData] = useState<{goldPerHour: number; goldPerSecond: number} | null>(null);
  const [stars, setStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number, twinkle: boolean}>>([]);
  const [currentEmployeePage, setCurrentEmployeePage] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | 'all'>('7d');
  const [chartMode, setChartMode] = useState<'total' | 'rate'>('total');
  const [showSlotBuffsModal, setShowSlotBuffsModal] = useState(false);
  
  // Chart data generation based on period
  const generateChartData = () => {
    if (chartPeriod === '7d') {
      // Smoother line with daily variations - exactly 7 dots
      return {
        points: "0,75 16,72 33,70 50,65 67,68 83,63 100,58",
        dots: [[0, 75], [16, 72], [33, 70], [50, 65], [67, 68], [83, 63], [100, 58]]
      };
    } else if (chartPeriod === '30d') {
      // More volatile line with bigger jumps - exactly 30 dots
      return {
        points: "0,85 3,78 7,82 10,70 13,74 17,65 20,55 23,72 27,88 30,75 33,92 37,68 40,85 43,72 47,95 50,82 53,65 57,78 60,91 63,73 67,58 70,85 73,77 77,89 80,65 83,78 87,82 90,74 93,86 97,79 100,75",
        dots: [[0, 85], [3, 78], [7, 82], [10, 70], [13, 74], [17, 65], [20, 55], [23, 72], [27, 88], [30, 75], [33, 92], [37, 68], [40, 85], [43, 72], [47, 95], [50, 82], [53, 65], [57, 78], [60, 91], [63, 73], [67, 58], [70, 85], [73, 77], [77, 89], [80, 65], [83, 78], [87, 82], [90, 74], [93, 86], [97, 79], [100, 75]]
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
            setCachedGoldData(goldData);
            setGoldPerSecond(goldData.goldPerSecond);
            setLiveGold(goldData.pendingGold);
            setLastGoldFetch(Date.now());
          } catch (error) {
            console.error("Failed to fetch initial gold data:", error);
            // Set default values
            setGoldPerSecond(50 / 3600); // 50 gold per hour default
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
      }));
    });
  }, [getOrCreateUser, getInitialGold]);
  
  // Check if user has set display name
  useEffect(() => {
    if (getUserDisplayName && walletAddress && walletAddress !== "demo_wallet_123") {
      if (!getUserDisplayName.displayNameSet) {
        setShowUsernameModal(true);
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
  
  // Animate live gold counter with smooth visual updates
  useEffect(() => {
    if (goldPerSecond > 0) {
      // Update visually every 100ms for smooth animation
      const interval = setInterval(() => {
        setLiveGold(prev => {
          const maxGold = (cachedGoldData?.goldPerHour || GAME_CONSTANTS.DEFAULT_GOLD_RATE) * GAME_CONSTANTS.MAX_GOLD_CAP_HOURS; // 72 hour cap
          // Add 1/10th of a second's worth of gold for smooth visual effect
          const increment = goldPerSecond / 10;
          return Math.min(prev + increment, maxGold);
        });
      }, 100); // Update visually every 100ms for smooth counting
      return () => clearInterval(interval);
    }
  }, [goldPerSecond, cachedGoldData]);
  
  const collectAllGold = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!userId) return;
    
    const goldToCollect = Math.floor(liveGold);
    
    // Animate counting up
    animateGoldCount(totalGold, totalGold + goldToCollect, (value) => {
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
      setTotalGold(Math.floor(result.totalGold));
      setLiveGold(0);
      
      // Show popup with collected gold and XP
      showGoldPopup(Math.floor(result.collected), result.xpGained || 0, result.leveledUp || false, result.currentLevel || 1);
    } catch (error) {
      console.error("Failed to collect gold:", error);
      // Still show popup with estimated amount on error
      showGoldPopup(goldToCollect, 0, false, 1);
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
      <div className="min-h-screen bg-black flex items-center justify-center">
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-2xl animate-pulse">
          Initializing user...
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
    <div className="min-h-screen bg-black text-white overflow-hidden relative z-10">
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
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: star.twinkle ? `starTwinkle ${2 + star.size}s ease-in-out infinite` : 'none',
              animationDelay: star.twinkle ? `${star.opacity * 2}s` : '0s',
            }}
          />
        ))}
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
            padding: '20px'
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
              <div 
                style={{ 
                  fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
                  fontSize: '40px',
                  fontWeight: 500,
                  color: '#fab617',
                  letterSpacing: '-0.02em',
                  textShadow: '0 0 10px rgba(250, 182, 23, 0.5)',
                  lineHeight: '1'
                }}
              >
                {Math.floor(totalGold).toLocaleString()}
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
                  {Object.values(userProfile?.totalEssence || {}).reduce((a, b) => a + b, 0).toFixed(1)}
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
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-gray-900/50 rounded border-l-4 border-purple-500 hover:bg-gray-800/70 transition-all">
                <div className="text-lg font-bold text-purple-400">0</div>
                <div className="text-xs text-gray-400">Prestige</div>
              </div>
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
                className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded transition-all duration-200 border border-gray-600"
              >
                See All Meks
              </Link>
              <button
                onClick={collectAllGold}
                className="px-3 py-1.5 text-sm bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-semibold rounded transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Collect All
              </button>
            </div>
            </div>
          </div>
          
          {/* Employee data */}
          {(() => {
            const employees = [
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
            ];
            
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
                        : "border-2 border-yellow-500 bg-transparent text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
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
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold" style={{
                fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
                letterSpacing: '0.1em',
                color: '#fab617',
                textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
              }}>Growth</h3>
              <div className="flex gap-2 justify-center mt-3">
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
                      <circle key={i} cx={x} cy={y} r="3" fill="#fab617" stroke="#000" strokeWidth="0.5" vectorEffect="non-scaling-stroke"/>
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
              
              {/* Time Period Buttons */}
              <div className="flex justify-center gap-2 mt-4">
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
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Essence at a Glance Section */}
        <div className="mb-6 p-5 rounded-lg bg-gray-800/50 border border-gray-700">
          <h3 className="text-lg font-bold text-center mb-4" style={{
            fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
            letterSpacing: '0.1em',
            color: '#fab617',
            textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
          }}>Essence at a Glance</h3>
          
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {(() => {
                const essenceTypes = [
                  { name: "Stone", current: 8.75, color: "#8B8B8B" },
                  { name: "Disco", current: 7.43, color: "#B452CD" },
                  { name: "Paul", current: 6.82, color: "#4169E1" },
                  { name: "Cartoon", current: 5.91, color: "#FF69B4" },
                  { name: "Candy", current: 5.34, color: "#FF6B6B" },
                  { name: "Tiles", current: 4.67, color: "#CD853F" },
                  { name: "Moss", current: 4.12, color: "#90EE90" },
                  { name: "Bullish", current: 3.78, color: "#FFB347" },
                  { name: "Journalist", current: 3.25, color: "#D3D3D3" },
                  { name: "Laser", current: 2.89, color: "#00CED1" },
                  { name: "Flashbulb", current: 2.41, color: "#F0E68C" },
                  { name: "Accordion", current: 2.03, color: "#DDA0DD" },
                  { name: "Turret", current: 1.87, color: "#2F4F4F" },
                  { name: "Drill", current: 1.72, color: "#CD853F" },
                  { name: "Security", current: 1.65, color: "#000080" },
                ];
                
                return essenceTypes.map(essence => {
                  return (
                    <div
                      key={essence.name}
                      className="transition-all cursor-pointer hover:scale-110 flex items-center justify-center relative"
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: essence.color,
                        boxShadow: `0 0 10px ${essence.color}40`,
                        opacity: 0.7 + (essence.current / 10) * 0.3,
                      }}
                    >
                      <span className="text-white text-xs font-bold drop-shadow-lg">
                        {Math.floor(essence.current)}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
            
            {/* Global Essence Rate */}
            <div className="text-center mt-4 pt-3 border-t border-gray-700/50">
              <div className="text-lg font-bold text-green-400">0.115/day</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Global Essence Rate</div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity Card */
        <div className="mb-6 p-5 rounded-lg bg-gray-800/50 border border-gray-700">
          <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <div>• Collected 247 gold from Mek #1234</div>
            <div>• Listed Disco Head (C-Rank) on Auction House for 1,200g</div>
            <div>• Purchased 2x Pearls Essence for 500g</div>
            <div>• Hired Mentor #2468 for 24 hours</div>
          </div>
          <div className="text-center mt-4">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors border border-gray-600">
              See More History
            </button>
          </div>
        </div>{/* End Recent Activity */}
      
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