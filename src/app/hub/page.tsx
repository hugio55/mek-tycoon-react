"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import { GAME_CONSTANTS } from "@/lib/constants";

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
  
  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const getInitialGold = useMutation(api.goldTrackingOptimized.getInitialGoldData);
  
  useEffect(() => {
    const initUser = async () => {
      try {
        const user = await getOrCreateUser({ 
          walletAddress: "demo_wallet_123" 
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
  
  // Get user profile with real-time updates
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );
  
  // DISABLED: Server polling for gold status to save bandwidth
  // Only fetch gold status every 30 seconds instead of continuously
  const liveGoldData = null; // Disabled server polling
  /* const liveGoldData = useQuery(
    api.goldTrackingOptimized.getGoldStatus,
    userId && Date.now() - lastGoldFetch > 30000 ? { userId } : "skip"
  ); */
  
  // Update gold rate when user changes
  const updateGoldRate = useMutation(api.goldTracking.updateGoldRate);
  const collectGold = useMutation(api.goldTracking.collectGold);
  const setGoldRate = useMutation(api.updateGoldRate.setGoldRate);
  
  // DISABLED: Initialize gold rate on load to save bandwidth
  // useEffect(() => {
  //   if (userId) {
  //     updateGoldRate({ userId }).catch(console.error);
  //   }
  // }, [userId, updateGoldRate]);
  
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
  
  // Debug logging
  useEffect(() => {
  }, [userId, userProfile, initError]);

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
      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes goldPopup {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -60%) scale(1);
          }
        }
        
        .collecting {
          animation: collectPulse 0.5s ease-out;
        }
        
        @keyframes collectPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes goldFloat {
          0%, 100% {
            opacity: 0.4;
            transform: translateY(0px) scale(0.8);
          }
          50% {
            opacity: 1;
            transform: translateY(-3px) scale(1.2);
            box-shadow: 0 0 8px rgba(250, 182, 23, 0.6);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          33% {
            transform: translateY(-5px) translateX(2px);
          }
          66% {
            transform: translateY(3px) translateX(-2px);
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes drift {
          0% {
            transform: translateX(0) translateY(0);
          }
          100% {
            transform: translateX(calc(100vw + 20px)) translateY(-10px);
          }
        }
        
        @keyframes starTwinkle {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
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
                <div className="text-lg font-bold text-yellow-400">0</div>
                <div className="text-xs text-gray-400">Mek XP</div>
              </div>
              <div className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all">
                <div className="text-lg font-bold text-yellow-400">0</div>
                <div className="text-xs text-gray-400">Talent Tree XP</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Active Employees Card */}
        <div className="mb-6 p-5 rounded-lg bg-gray-800/50 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              🧪 XP ACTIVE 🧪 Active Employees <span className="text-sm text-gray-400">({currentEmployeePage * 5 + 1}-{Math.min((currentEmployeePage + 1) * 5, 9)} of 9)</span>
            </h3>
            <div className="flex gap-2 flex-wrap">
              <Link 
                href="/meks" 
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded hover:from-yellow-400 hover:to-yellow-300 transition-all"
              >
                See All Meks
              </Link>
              <button
                onClick={collectAllGold}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded hover:from-yellow-400 hover:to-yellow-300 transition-all"
              >
                Collect All
              </button>
            </div>
          </div>
          
          {/* Employee data */}
          {(() => {
            const employees = [
              { id: 1234, level: 5, rate: 15.5, gold: 968, maxGold: 968, progress: 100 },
              { id: 2468, level: 3, rate: 12.2, gold: 523, maxGold: 878, progress: 60 },
              { id: 3691, level: 7, rate: 22.8, gold: 1644, maxGold: 1644, progress: 100 },
              { id: 1847, level: 4, rate: 14.1, gold: 340, maxGold: 1015, progress: 33 },
              { id: 9052, level: 6, rate: 18.7, gold: 1346, maxGold: 1346, progress: 100 },
              { id: 7231, level: 2, rate: 9.5, gold: 684, maxGold: 684, progress: 100 },
              { id: 5612, level: 8, rate: 25.3, gold: 1820, maxGold: 1820, progress: 100 },
              { id: 4089, level: 3, rate: 11.8, gold: 425, maxGold: 850, progress: 50 },
              { id: null, level: 0, rate: 0, gold: 0, maxGold: 0, progress: 0 }, // Empty slot
            ];
            
            const startIdx = currentEmployeePage * 5;
            const endIdx = Math.min(startIdx + 5, employees.length);
            const pageEmployees = employees.slice(startIdx, endIdx);
            
            return pageEmployees.map((emp, idx) => {
              if (emp.id === null) {
                // Empty slot
                return (
                  <div key={`empty-${idx}`} className="mb-2 p-3 bg-gradient-to-r from-yellow-500/10 to-gray-900/10 rounded-lg border-l-4 border-yellow-500 flex items-center justify-between" style={{ minHeight: '68px' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border-2 border-yellow-500 border-dashed rounded-full flex items-center justify-center text-xl text-yellow-500 hover:bg-yellow-500/20 cursor-pointer transition-colors">
                        +
                      </div>
                      <div>
                        <div className="font-semibold text-yellow-400 text-sm">Empty Slot Available</div>
                        <div className="text-xs text-gray-400">Assign a Mek to start earning</div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 text-sm bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400 transition-colors animate-pulse">
                      Assign
                    </button>
                  </div>
                );
              }
              
              return (
                <div key={emp.id} className="mb-2 p-3 bg-gray-900/50 rounded-lg border-l-4 border-yellow-500 flex items-center justify-between" style={{ minHeight: '68px' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-md flex items-center justify-center">
                      <span className="text-gray-500 text-[9px]">MEK</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">Mek #{emp.id} - Level {emp.level}</div>
                      <div className="text-xs text-gray-400">
                        <span className="text-yellow-400 font-semibold">Rate: {emp.rate}/hr</span> | 
                        Gold: {emp.gold}/{emp.maxGold} (72h cap)
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1 overflow-hidden" style={{boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'}}>
                        <div 
                          className="h-2 rounded-full transition-all relative" 
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
                    className="px-3 py-1.5 text-sm bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400 transition-colors"
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
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <div className="flex gap-2">
              {[0, 1].map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentEmployeePage(page)}
                  className={`w-8 h-8 rounded ${currentEmployeePage === page ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600'} transition-colors`}
                >
                  {page + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentEmployeePage(Math.min(1, currentEmployeePage + 1))}
              disabled={currentEmployeePage === 1}
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
          
          <div className="text-center mt-4">
            <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
              <span className="mr-2">+</span> Add Slot
            </button>
          </div>
        </div>
        
        {/* Recent Activity Card */}
        <div className="mb-6 p-5 rounded-lg bg-gray-800/50 border border-gray-700">
          <h3 className="text-xl font-bold mb-4">
            Recent Activity
          </h3>
          <div className="space-y-2 text-sm text-gray-300">
            <div>• Collected 247 gold from Mek #1234</div>
            <div>• Listed Disco Head (C-Rank) on Auction House for 1,200g</div>
            <div>• Purchased 2x Pearls Essence for 500g</div>
            <div>• Hired Mentor #2468 for 24 hours</div>
          </div>
          <div className="text-center mt-4">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
              See More History
            </button>
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
      
    </div>
  );
}