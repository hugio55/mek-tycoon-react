"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import { GAME_CONSTANTS } from "@/lib/constants";
import UsernameModal from "@/components/UsernameModal";

export default function Hub2Page() {
  
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
  const [employees, setEmployees] = useState([
    { id: 1234, level: 5, rate: 15.5, gold: 968, maxGold: 968, progress: 100, buffed: false, hourCap: '72h' },
    { id: 3691, level: 7, rate: 22.8, gold: 1644, maxGold: 1644, progress: 100, buffed: true, hourCap: '96h' },
    { id: 9052, level: 6, rate: 18.7, gold: 1346, maxGold: 1346, progress: 100, buffed: false, hourCap: '72h' },
    { id: 7231, level: 2, rate: 9.5, gold: 684, maxGold: 684, progress: 100, buffed: true, hourCap: '120h' },
    { id: 5612, level: 8, rate: 25.3, gold: 1820, maxGold: 1820, progress: 100, buffed: false, hourCap: '72h' },
    { id: 2468, level: 3, rate: 12.2, gold: 523, maxGold: 878, progress: 60, buffed: false, hourCap: '72h' },
    { id: 1847, level: 4, rate: 14.1, gold: 340, maxGold: 1015, progress: 33, buffed: true, hourCap: '96h' },
    { id: 4089, level: 3, rate: 11.8, gold: 425, maxGold: 850, progress: 50, buffed: false, hourCap: '72h' },
    { id: null, level: 0, rate: 0, gold: 0, maxGold: 0, progress: 0, buffed: false, hourCap: '72h' },
  ]);
  
  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const getInitialGold = useMutation(api.goldTrackingOptimized.getInitialGoldData);
  const getUserDisplayName = useQuery(api.usernames.getUserDisplayName, 
    walletAddress ? { walletAddress } : "skip"
  );
  
  useEffect(() => {
    const initUser = async () => {
      try {
        const storedWallet = localStorage.getItem('walletAddress') || localStorage.getItem('stakeAddress') || "demo_wallet_123";
        setWalletAddress(storedWallet);
        
        const user = await getOrCreateUser({ 
          walletAddress: storedWallet 
        });
        if (user) {
          setUserId(user._id as Id<"users">);
          setTotalGold(user.gold);
          
          try {
            const goldData = await getInitialGold({ userId: user._id as Id<"users"> });
            setCachedGoldData(goldData);
            setGoldPerSecond(goldData.goldPerSecond);
            setLiveGold(goldData.pendingGold);
            setLastGoldFetch(Date.now());
          } catch (error) {
            console.error("Failed to fetch initial gold data:", error);
            setGoldPerSecond(50 / 3600);
            setLiveGold(0);
          }
        }
      } catch (error) {
        console.error("Hub: Error initializing user:", error);
        setInitError(String(error));
      }
    };
    initUser();
    
    // Generate stars for background
    setStars(prevStars => {
      if (prevStars.length > 0) return prevStars;
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
      // Handle if getUserDisplayName is an object with displayNameSet property
      if (typeof getUserDisplayName === 'object' && getUserDisplayName.displayName) {
        setDisplayName(getUserDisplayName.displayName || null);
      } else if (typeof getUserDisplayName === 'string') {
        setDisplayName(getUserDisplayName);
      }
    }
  }, [getUserDisplayName, walletAddress]);
  
  // Get user profile with real-time updates
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId && walletAddress ? { walletAddress } : "skip"
  );
  
  const liveGoldData = useQuery(
    api.goldTracking.getLiveGoldCounter,
    userId ? { userId } : "skip"
  );
  
  const collectGold = useMutation(api.goldTracking.collectGold);
  const setGoldRate = useMutation(api.updateGoldRate.setGoldRate);
  
  // Animate live gold counter
  useEffect(() => {
    if (goldPerSecond > 0) {
      const interval = setInterval(() => {
        setLiveGold(prev => {
          const maxGold = (cachedGoldData?.goldPerHour || GAME_CONSTANTS.DEFAULT_GOLD_RATE) * GAME_CONSTANTS.MAX_GOLD_CAP_HOURS;
          const increment = goldPerSecond / 10;
          return Math.min(prev + increment, maxGold);
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [goldPerSecond, cachedGoldData]);
  
  const collectAllGold = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!userId) return;
    
    const goldToCollect = Math.floor(liveGold);
    
    animateGoldCount(totalGold, totalGold + goldToCollect, (value) => {
      setTotalGold(value);
    });
    
    const button = e.currentTarget;
    button.classList.add('collecting');
    setTimeout(() => {
      button.classList.remove('collecting');
    }, 500);
    
    try {
      const result = await collectGold({ userId });
      setTotalGold(Math.floor(result.totalGold));
      setLiveGold(0);
      showGoldPopup(Math.floor(result.collected), result.xpGained || 0, result.leveledUp || false, result.currentLevel || 1);
    } catch (error) {
      console.error("Failed to collect gold:", error);
      showGoldPopup(goldToCollect, 0, false, 1);
    }
  };
  
  const animateGoldCount = (start: number, end: number, callback: (value: number) => void) => {
    const duration = 1000;
    const startTime = Date.now();
    const difference = end - start;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + difference * easeOutQuart);
      
      callback(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        callback(end);
      }
    };
    
    requestAnimationFrame(animate);
  };
  
  const showGoldPopup = (amount: number, xpGained: number = 0, leveledUp: boolean = false, currentLevel: number = 1) => {
    const popup = document.createElement('div');
    popup.className = 'gold-popup';
    
    if (xpGained === 0 && amount > 0) {
      xpGained = Math.floor(amount / 10);
    }
    
    let content = `<div style="text-align: center;">`;
    content += `<div style="font-size: 24px; margin-bottom: 8px;">+${amount} Gold Collected!</div>`;
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
    
    setTimeout(() => {
      popup.remove();
    }, 1500);
  };
  
  // Grid helper to apply industrial glass style to sections
  const renderSection = (content: React.ReactNode, noPadding: boolean = false) => {
    return (
      <div 
        className="relative rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(250, 182, 23, 0.02) 0%, rgba(250, 182, 23, 0.05) 50%, rgba(250, 182, 23, 0.02) 100%)',
          backdropFilter: 'blur(6px)',
          boxShadow: 'inset 0 0 40px rgba(250, 182, 23, 0.03)',
          transform: 'scale(0.95)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 20% 30%, rgba(250, 182, 23, 0.08) 0%, transparent 30%)',
          mixBlendMode: 'screen',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          border: '1px solid rgba(250, 182, 23, 0.2)',
          borderRadius: '8px',
          boxShadow: 'inset 0 0 0 1px rgba(250, 182, 23, 0.1)',
        }} />
        <div className={`relative z-10 ${!noPadding ? 'p-4' : ''}`}>
          {content}
        </div>
      </div>
    );
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
        {/* Yellow gradient orbs from sides */}
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
        
        {/* Hub Title Section with Industrial Glass Styling */}
        <div className="mb-6">
          {renderSection(
            <>
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
              
              <div className="relative flex items-center justify-center px-4 py-5">
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
                    HUB 2
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
                    Industrial Glass Edition
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
                  </div>
                </div>
                
                {/* Live Gold Display - Right side */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-right">
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
            </>,
            true
          )}
        </div>
        
        {/* Unified Stats Section with Industrial Glass */}
        <div className="mb-6">
          {renderSection(
            <>
              {/* Economy Status */}
              <div className="mb-4">
                <h3 className="text-xs text-yellow-400 uppercase tracking-wider mb-2 font-semibold">
                  Economy Status
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all">
                    <div className="text-lg font-bold text-yellow-400">
                      {((cachedGoldData?.goldPerHour || liveGoldData?.rate) || GAME_CONSTANTS.DEFAULT_GOLD_RATE).toFixed(1)}/hr
                    </div>
                    <div className="text-xs text-gray-400">Gold Rate</div>
                  </div>
                  <div className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all">
                    <div className="text-lg font-bold text-yellow-400">
                      {Object.values(userProfile.totalEssence).reduce((a, b) => a + b, 0).toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400">Total Essence</div>
                  </div>
                  <div className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all">
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
            </>
          )}
        </div>
        
        {/* Two Column Layout - Active Employees and Gold Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Active Employees Card - Left Column */}
          <div>
            {renderSection(
              <>
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
                      className="px-3 py-1 text-xs rounded transition-colors bg-gray-700/50 text-gray-400 hover:bg-gray-700 border border-gray-600/50"
                    >
                      Collect All
                    </button>
                  </div>
                </div>
                
                {/* Employee list */}
                {employees.slice(0, 5).map((emp, idx) => {
                  if (emp.id === null) {
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
                    <div key={emp.id} className="mb-2 p-2 bg-gray-900/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">Mek #{emp.id}</span>
                            <span className="text-xs px-2 py-0.5 bg-gray-700 rounded">Lvl {emp.level}</span>
                            {emp.buffed && <span className="text-xs px-2 py-0.5 bg-green-600/20 text-green-400 rounded">Buffed</span>}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {emp.rate.toFixed(1)} g/hr • Cap: {emp.hourCap}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-yellow-400">{emp.gold}</div>
                          <div className="text-xs text-gray-400">/{emp.maxGold}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Pagination */}
                <div className="flex justify-center mt-3 gap-2">
                  <button
                    onClick={() => setCurrentEmployeePage(0)}
                    className="px-2 py-1 text-xs bg-gray-700/50 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                  >
                    Page 1
                  </button>
                  <button
                    onClick={() => setCurrentEmployeePage(1)}
                    className="px-2 py-1 text-xs bg-gray-700/50 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                  >
                    Page 2
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Gold Stats - Right Column */}
          <div>
            {renderSection(
              <>
                <h3 className="text-lg font-bold mb-4" style={{
                  fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
                  letterSpacing: '0.1em',
                  color: '#fab617',
                  textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
                }}>
                  Gold Statistics
                </h3>
                
                <div className="space-y-3">
                  <div className="p-3 bg-gray-900/30 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Gold Cap</span>
                      <span className="text-sm font-bold text-yellow-400">
                        {((cachedGoldData?.goldPerHour || GAME_CONSTANTS.DEFAULT_GOLD_RATE) * GAME_CONSTANTS.MAX_GOLD_CAP_HOURS).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-900/30 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Time to Cap</span>
                      <span className="text-sm font-bold text-yellow-400">
                        {GAME_CONSTANTS.MAX_GOLD_CAP_HOURS}h
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-900/30 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Total Collected</span>
                      <span className="text-sm font-bold text-yellow-400">
                        {(totalGold * 1.5).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={collectAllGold}
                    className="w-full mt-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded transition-all text-lg"
                    style={{
                      fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
                      letterSpacing: '0.1em',
                      boxShadow: '0 0 20px rgba(250, 182, 23, 0.4)'
                    }}
                  >
                    COLLECT {Math.floor(liveGold)} GOLD
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Profile', href: '/profile', icon: '👤' },
            { label: 'Crafting', href: '/crafting', icon: '🔨' },
            { label: 'Shop', href: '/shop', icon: '🛒' },
            { label: 'Leaderboard', href: '/leaderboard', icon: '🏆' },
          ].map((action) => (
            <Link key={action.label} href={action.href}>
              {renderSection(
                <div className="text-center py-2">
                  <div className="text-2xl mb-1">{action.icon}</div>
                  <div className="text-xs text-gray-400">{action.label}</div>
                </div>
              )}
            </Link>
          ))}
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