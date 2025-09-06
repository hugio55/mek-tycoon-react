"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import { GAME_CONSTANTS } from "@/lib/constants";
import UsernameModal from "@/components/UsernameModal";

type CardStyle = 'industrial' | 'sharp' | 'neon' | 'brutalist' | 'glass' | 'circuit' | 'hex' | 'gradient' | 'minimal' | 'cyber';

export default function Hub3Page() {
  
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
  const [cardStyle, setCardStyle] = useState<CardStyle>('industrial');
  
  // Chart data generation
  const generateChartData = () => {
    if (chartPeriod === '7d') {
      return {
        points: "0,75 14,72 28,70 42,65 56,68 70,63 84,60 100,58",
        dots: [[0, 75], [14, 72], [28, 70], [42, 65], [56, 68], [70, 63], [84, 60], [100, 58]]
      };
    } else if (chartPeriod === '30d') {
      return {
        points: "0,85 16,78 32,82 48,70 64,74 80,65 100,55",
        dots: [[0, 85], [16, 78], [32, 82], [48, 70], [64, 74], [80, 65], [100, 55]]
      };
    } else {
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
  
  // Card style configurations
  const cardStyles = {
    'industrial': 'Industrial Glass',
    'sharp': 'Sharp Edges',
    'neon': 'Neon Glow',
    'brutalist': 'Brutalist',
    'glass': 'Pure Glass',
    'circuit': 'Circuit Board',
    'hex': 'Hexagonal',
    'gradient': 'Gradient Flow',
    'minimal': 'Minimalist',
    'cyber': 'Cyberpunk'
  };
  
  // Helper function to apply card styling based on selected style
  const renderStyledCard = (content: React.ReactNode, title?: string) => {
    // Style 1: Industrial Glass (original)
    if (cardStyle === 'industrial') {
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
          <div className="relative z-10">
            {title && <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(250, 182, 23, 0.15)' }}>
              <h3 className="text-xs uppercase tracking-[0.3em] text-gray-500" style={{ fontSize: '11px' }}>{title}</h3>
            </div>}
            {content}
          </div>
        </div>
      );
    }
    
    // Style 2: Sharp Edges with Double Border
    if (cardStyle === 'sharp') {
      return (
        <div 
          className="relative"
          style={{
            background: '#0a0a0a',
            border: '2px solid #333',
            outline: '1px solid #666',
            outlineOffset: '2px',
            clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
            transform: 'scale(0.95)',
          }}
        >
          {title && <div className="px-4 py-2 border-b border-gray-700">
            <h3 className="text-xs uppercase tracking-[0.3em] text-gray-400" style={{ fontSize: '11px' }}>{title}</h3>
          </div>}
          <div>{content}</div>
        </div>
      );
    }
    
    // Style 3: Neon Glow
    if (cardStyle === 'neon') {
      return (
        <div 
          className="relative rounded-none"
          style={{
            background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
            border: '1px solid #0ff',
            boxShadow: '0 0 20px #0ff, inset 0 0 20px rgba(0, 255, 255, 0.1)',
            transform: 'scale(0.95)',
          }}
        >
          {title && <div className="px-4 py-2" style={{ borderBottom: '1px solid #0ff' }}>
            <h3 className="text-xs uppercase tracking-[0.3em]" style={{ fontSize: '11px', color: '#0ff', textShadow: '0 0 10px #0ff' }}>{title}</h3>
          </div>}
          <div>{content}</div>
        </div>
      );
    }
    
    // Style 4: Brutalist
    if (cardStyle === 'brutalist') {
      return (
        <div 
          className="relative"
          style={{
            background: '#1a1a1a',
            border: '4px solid #fff',
            borderRadius: '0',
            boxShadow: '8px 8px 0 #000',
            transform: 'scale(0.95)',
          }}
        >
          {title && <div className="px-4 py-3 bg-white text-black">
            <h3 className="text-xs uppercase tracking-[0.3em] font-black" style={{ fontSize: '11px' }}>{title}</h3>
          </div>}
          <div>{content}</div>
        </div>
      );
    }
    
    // Style 5: Pure Glass
    if (cardStyle === 'glass') {
      return (
        <div 
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transform: 'scale(0.95)',
          }}
        >
          {title && <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-xs uppercase tracking-[0.3em] text-gray-400" style={{ fontSize: '11px' }}>{title}</h3>
          </div>}
          <div>{content}</div>
        </div>
      );
    }
    
    // Style 6: Circuit Board
    if (cardStyle === 'circuit') {
      return (
        <div 
          className="relative"
          style={{
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: '0',
            boxShadow: 'inset 0 0 0 2px #161b22',
            transform: 'scale(0.95)',
            position: 'relative',
          }}
        >
          <div className="absolute top-0 left-0 w-2 h-2 bg-green-400 rounded-full" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full" />
          <div className="absolute bottom-0 left-0 w-2 h-2 bg-blue-400 rounded-full" />
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-400 rounded-full" />
          {title && <div className="px-4 py-2 border-b border-gray-800">
            <h3 className="text-xs uppercase tracking-[0.3em] text-green-400" style={{ fontSize: '11px', fontFamily: 'monospace' }}>{title}</h3>
          </div>}
          <div>{content}</div>
        </div>
      );
    }
    
    // Style 7: Hexagonal
    if (cardStyle === 'hex') {
      return (
        <div 
          className="relative"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e, #0f0f1e)',
            clipPath: 'polygon(30px 0%, 100% 0%, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0% 100%, 0% 30px)',
            border: '2px solid #4a4a6e',
            transform: 'scale(0.95)',
          }}
        >
          {title && <div className="px-4 py-2 border-b border-gray-700">
            <h3 className="text-xs uppercase tracking-[0.3em] text-purple-400" style={{ fontSize: '11px' }}>{title}</h3>
          </div>}
          <div>{content}</div>
        </div>
      );
    }
    
    // Style 8: Gradient Flow
    if (cardStyle === 'gradient') {
      return (
        <div 
          className="relative rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            transform: 'scale(0.95)',
          }}
        >
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)',
          }} />
          {title && <div className="relative z-10 px-4 py-2 border-b border-white/20">
            <h3 className="text-xs uppercase tracking-[0.3em] text-white/80" style={{ fontSize: '11px' }}>{title}</h3>
          </div>}
          <div className="relative z-10">{content}</div>
        </div>
      );
    }
    
    // Style 9: Minimalist
    if (cardStyle === 'minimal') {
      return (
        <div 
          className="relative"
          style={{
            background: 'transparent',
            border: '1px solid #333',
            borderRadius: '0',
            transform: 'scale(0.95)',
          }}
        >
          {title && <div className="px-4 py-2">
            <h3 className="text-xs uppercase tracking-[0.3em] text-gray-500" style={{ fontSize: '11px' }}>{title}</h3>
          </div>}
          <div>{content}</div>
        </div>
      );
    }
    
    // Style 10: Cyberpunk
    if (cardStyle === 'cyber') {
      return (
        <div 
          className="relative"
          style={{
            background: 'linear-gradient(135deg, #ff006e, #8338ec, #3a86ff)',
            padding: '2px',
            transform: 'scale(0.95)',
          }}
        >
          <div style={{
            background: '#0a0a0a',
            height: '100%',
          }}>
            {title && <div className="px-4 py-2 border-b" style={{ borderColor: '#ff006e' }}>
              <h3 className="text-xs uppercase tracking-[0.3em]" style={{ fontSize: '11px', color: '#ff006e' }}>{title}</h3>
            </div>}
            <div>{content}</div>
          </div>
        </div>
      );
    }
    
    return <div>{content}</div>;
  };
  
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative z-10">
      {/* Style Dropdown Selector */}
      <div className="fixed top-4 right-4 z-50">
        <select
          value={cardStyle}
          onChange={(e) => setCardStyle(e.target.value as CardStyle)}
          className="px-4 py-2 bg-black/80 border border-gray-600 rounded-lg text-white text-sm cursor-pointer hover:bg-black/90 transition-all"
          style={{
            backdropFilter: 'blur(10px)',
            fontFamily: "'Inter', 'Segoe UI', sans-serif"
          }}
        >
          {Object.entries(cardStyles).map(([key, name]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 py-6 px-6">
        {/* Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          
          {/* Top Row: Gold Metrics + Essence Vault */}
          <div className="space-y-6">
            {/* Gold Metrics Card */}
            {renderStyledCard(
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="text-gray-400 text-sm mb-2">Total Gold</div>
                  <div className="text-4xl font-bold text-yellow-400" style={{
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    fontWeight: 500
                  }}>
                    {totalGold.toLocaleString()}
                  </div>
                </div>
                
                <div className="text-center mb-4">
                  <div className="text-gray-400 text-sm mb-2">Gold to Collect</div>
                  <div className="text-3xl text-green-400" style={{
                    fontFamily: "'Segoe UI', sans-serif",
                    fontWeight: 200
                  }}>
                    {Math.floor(liveGold).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    +{(goldPerSecond * 3600).toFixed(0)}/hour
                  </div>
                </div>
                
                <button 
                  onClick={collectAllGold}
                  className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded transition-all"
                >
                  COLLECT GOLD
                </button>
              </div>,
              'GOLD METRICS'
            )}
          </div>
          
          <div className="space-y-6">
            {/* Essence Vault Card */}
            {renderStyledCard(
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'Stone', value: 250, color: '#94a3b8' },
                    { name: 'Disco', value: 150, color: '#c084fc' },
                    { name: 'Paul', value: 100, color: '#fb923c' },
                    { name: 'Cartoon', value: 75, color: '#fbbf24' },
                  ].map((essence) => (
                    <div key={essence.name} className="text-center">
                      <div className="text-xs text-gray-400 mb-1">{essence.name}</div>
                      <div className="text-xl font-bold" style={{ color: essence.color }}>
                        {essence.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>,
              'ESSENCE VAULT'
            )}
          </div>
        </div>
        
        {/* Full Width: Active Meks */}
        <div className="max-w-7xl mx-auto mt-6">
          {renderStyledCard(
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((mek) => (
                  <div key={mek} className="bg-black/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg" />
                      <div>
                        <div className="text-sm font-semibold">Mek #{mek}</div>
                        <div className="text-xs text-gray-400">Level {10 + mek}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Generating: {50 * mek}/hour
                    </div>
                  </div>
                ))}
              </div>
            </div>,
            'ACTIVE MEKS'
          )}
        </div>
        
        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto mt-6">
          {/* Level Progress */}
          {renderStyledCard(
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Level {userProfile?.level || 1}</span>
                <span className="text-sm text-gray-400">{userProfile?.xp || 0} XP</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{ width: '45%' }}
                />
              </div>
            </div>,
            'PROGRESS'
          )}
          
          {/* Chart */}
          {renderStyledCard(
            <div className="p-4">
              <svg viewBox="0 0 100 100" className="w-full h-24">
                <polyline
                  points={chartData.points}
                  fill="none"
                  stroke="#fab617"
                  strokeWidth="2"
                />
                {chartData.dots.map((dot, i) => (
                  <circle key={i} cx={dot[0]} cy={dot[1]} r="3" fill="#fab617" />
                ))}
              </svg>
            </div>,
            'ANALYTICS'
          )}
          
          {/* Quick Stats */}
          {renderStyledCard(
            <div className="p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Rank</span>
                <span className="text-sm font-bold">#1,337</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Meks</span>
                <span className="text-sm font-bold">42</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Buffs</span>
                <span className="text-sm font-bold text-green-400">+25%</span>
              </div>
            </div>,
            'STATS'
          )}
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