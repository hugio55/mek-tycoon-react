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
  const [showSlotBuffsModal, setShowSlotBuffsModal] = useState(false);
  const [cardStyle, setCardStyle] = useState<CardStyle>('industrial');
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
      if (typeof getUserDisplayName === 'object' && getUserDisplayName.displayNameSet) {
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
  
  const liveGoldData = null;
  
  const collectGold = useMutation(api.goldTracking.collectGold);
  const setGoldRate = useMutation(api.updateGoldRate.setGoldRate);
  
  // Update gold data when fetched
  useEffect(() => {
    if (liveGoldData) {
      setTotalGold(Math.floor(liveGoldData.gold));
      setGoldPerSecond(liveGoldData.rate / 3600);
      setLiveGold(liveGoldData.pending);
      setLastGoldFetch(Date.now());
    }
  }, [liveGoldData]);
  
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
  
  // Helper function for consistent industrial card styling
  const renderIndustrialCard = (content: React.ReactNode, title?: string) => {
    return renderStyledCard(content, title);
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
    
    // Style 2: Sharp Edges
    if (cardStyle === 'sharp') {
      return (
        <div className="relative" style={{ transform: 'scale(0.95)', clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}>
          <div className="bg-black border-2 border-yellow-500" style={{ clipPath: 'inherit' }}>
            <div className="bg-gradient-to-br from-gray-900 to-black p-[2px]">
              <div className="bg-black">
                {title && <div className="px-4 py-2 border-b-2 border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-transparent">
                  <h3 className="text-xs uppercase tracking-[0.3em] text-yellow-400 font-bold" style={{ fontSize: '11px' }}>{title}</h3>
                </div>}
                <div className="relative">{content}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Style 3: Neon Glow
    if (cardStyle === 'neon') {
      return (
        <div className="relative rounded-xl" style={{ transform: 'scale(0.95)' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur-xl opacity-50 animate-pulse" />
          <div className="relative bg-black rounded-xl border border-cyan-500/50" style={{
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.5), inset 0 0 30px rgba(0, 255, 255, 0.1)'
          }}>
            {title && <div className="px-4 py-2 border-b border-cyan-500/30">
              <h3 className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold" style={{ fontSize: '11px', textShadow: '0 0 10px rgba(0, 255, 255, 0.8)' }}>{title}</h3>
            </div>}
            <div className="relative">{content}</div>
          </div>
        </div>
      );
    }
    
    // Style 4: Brutalist
    if (cardStyle === 'brutalist') {
      return (
        <div className="relative" style={{ transform: 'scale(0.95)' }}>
          <div className="absolute inset-0 bg-yellow-500 transform translate-x-2 translate-y-2" />
          <div className="relative bg-black border-4 border-white">
            {title && <div className="px-4 py-3 bg-white text-black">
              <h3 className="text-xs uppercase tracking-[0.3em] font-black" style={{ fontSize: '11px' }}>{title}</h3>
            </div>}
            <div className="relative">{content}</div>
          </div>
        </div>
      );
    }
    
    // Style 5: Pure Glass
    if (cardStyle === 'glass') {
      return (
        <div className="relative rounded-2xl" style={{ 
          transform: 'scale(0.95)',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div className="absolute inset-0 rounded-2xl" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)'
          }} />
          {title && <div className="px-4 py-2 border-b border-white/10">
            <h3 className="text-xs uppercase tracking-[0.3em] text-white/70" style={{ fontSize: '11px' }}>{title}</h3>
          </div>}
          <div className="relative">{content}</div>
        </div>
      );
    }
    
    // Style 6: Circuit Board
    if (cardStyle === 'circuit') {
      return (
        <div className="relative" style={{ transform: 'scale(0.95)' }}>
          <div className="bg-green-950 border border-green-500/50 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `repeating-linear-gradient(0deg, #00ff00 0px, transparent 1px, transparent 2px, #00ff00 3px),
                               repeating-linear-gradient(90deg, #00ff00 0px, transparent 1px, transparent 2px, #00ff00 3px)`,
              backgroundSize: '20px 20px'
            }} />
            {title && <div className="px-4 py-2 border-b border-green-500/30 bg-black/50 relative z-10">
              <h3 className="text-xs uppercase tracking-[0.3em] text-green-400 font-mono" style={{ fontSize: '11px' }}>{title}</h3>
            </div>}
            <div className="relative z-10">{content}</div>
          </div>
        </div>
      );
    }
    
    // Style 7: Hexagonal
    if (cardStyle === 'hex') {
      return (
        <div className="relative" style={{ 
          transform: 'scale(0.95)',
          clipPath: 'polygon(30px 0%, 100% 0%, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0% 100%, 0% 30px)'
        }}>
          <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-2 border-orange-500/50">
            {title && <div className="px-4 py-2 border-b-2 border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-transparent">
              <h3 className="text-xs uppercase tracking-[0.3em] text-orange-400" style={{ fontSize: '11px' }}>{title}</h3>
            </div>}
            <div className="relative">{content}</div>
          </div>
        </div>
      );
    }
    
    // Style 8: Gradient Flow
    if (cardStyle === 'gradient') {
      return (
        <div className="relative rounded-xl overflow-hidden" style={{ transform: 'scale(0.95)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 opacity-20" />
          <div className="relative backdrop-blur-sm border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            {title && <div className="px-4 py-2 border-b border-white/10 relative z-10">
              <h3 className="text-xs uppercase tracking-[0.3em] text-white/80" style={{ fontSize: '11px' }}>{title}</h3>
            </div>}
            <div className="relative z-10">{content}</div>
          </div>
        </div>
      );
    }
    
    // Style 9: Minimalist
    if (cardStyle === 'minimal') {
      return (
        <div className="relative" style={{ transform: 'scale(0.95)' }}>
          <div className="bg-white/5 border-l-4 border-yellow-500">
            {title && <div className="px-4 py-2">
              <h3 className="text-xs uppercase tracking-[0.3em] text-gray-400" style={{ fontSize: '11px' }}>{title}</h3>
            </div>}
            <div className="relative">{content}</div>
          </div>
        </div>
      );
    }
    
    // Style 10: Cyberpunk
    if (cardStyle === 'cyber') {
      return (
        <div className="relative" style={{ transform: 'scale(0.95)' }}>
          <div className="bg-black border-2 border-pink-500/50 relative" style={{
            boxShadow: '0 0 20px rgba(255, 0, 255, 0.3), inset 0 0 20px rgba(0, 255, 255, 0.1)'
          }}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />
            {title && <div className="px-4 py-2 border-b border-pink-500/30 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10">
              <h3 className="text-xs uppercase tracking-[0.3em] text-pink-400" style={{ fontSize: '11px', fontFamily: 'monospace' }}>{title}</h3>
            </div>}
            <div className="relative">{content}</div>
          </div>
        </div>
      );
    }
    
    return <div>{content}</div>;
  };
  
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
        <div 
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(250, 182, 23, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(250, 182, 23, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(250, 182, 23, 0.08) 0%, transparent 70%)
            `
          }}
        />
        
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 35px,
                rgba(250, 182, 23, 0.03) 35px,
                rgba(250, 182, 23, 0.03) 70px
              )
            `,
          }}
        />
        
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
      <div className="relative z-10 py-6" style={{ transform: 'scale(0.95)' }}>
        
        {/* Hub Title Section - Industrial Style */}
        <div className="mb-6">
          {renderIndustrialCard(
            <div className="relative flex items-center justify-center px-4 py-5" style={{ minHeight: '57px' }}>
              {/* Total Gold Display */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col">
                <div 
                  style={{ 
                    fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
                    fontSize: '38px',
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
                    fontSize: '10px',
                    letterSpacing: '0.2em',
                    fontFamily: "'Consolas', 'Monaco', monospace",
                    textTransform: 'uppercase',
                    marginTop: '3px',
                    opacity: 0.8
                  }}
                >
                  Total Gold
                </div>
              </div>
              
              {/* Hub Title - Centered */}
              <div className="text-center flex flex-col items-center justify-center">
                <h1 
                  style={{
                    fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
                    fontSize: '40px',
                    fontWeight: 900,
                    color: '#fab617',
                    letterSpacing: '0.15em',
                    textShadow: '0 0 30px rgba(250, 182, 23, 0.6)',
                    margin: 0,
                    lineHeight: '1'
                  }}
                >
                  COMMAND HUB
                </h1>
                
                <p 
                  style={{
                    fontSize: '9px',
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3em',
                    marginTop: '3px',
                    fontFamily: "'Consolas', 'Monaco', monospace"
                  }}
                >
                  Industrial Operations Center
                </p>
                
                {displayName && (
                  <div 
                    style={{
                      fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      fontSize: '13px',
                      color: '#00ff88',
                      letterSpacing: '0.05em',
                      marginTop: '6px',
                      marginBottom: '3px'
                    }}
                  >
                    Operator: {displayName}
                  </div>
                )}
                
                {/* Account Controls */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setShowUsernameModal(true)}
                    className="px-3 py-1 text-xs text-gray-300 hover:text-white bg-gray-900/50 hover:bg-gray-800/60 rounded transition-all duration-200"
                    style={{
                      fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      letterSpacing: '0.05em',
                      border: '1px solid rgba(250, 182, 23, 0.2)',
                      fontSize: '11px'
                    }}
                  >
                    Edit Name
                  </button>
                  {walletAddress && walletAddress !== "demo_wallet_123" ? (
                    <button
                      onClick={() => {
                        localStorage.removeItem('walletAddress');
                        localStorage.removeItem('stakeAddress');
                        window.location.href = '/';
                      }}
                      className="px-3 py-1 text-xs text-gray-400 hover:text-gray-300 bg-transparent hover:bg-gray-900/30 rounded transition-all duration-200"
                      style={{
                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                        letterSpacing: '0.05em',
                        border: '1px solid rgba(250, 182, 23, 0.1)',
                        fontSize: '11px'
                      }}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        window.location.href = '/';
                      }}
                      className="px-3 py-1 text-xs text-gray-300 hover:text-white bg-gray-900/50 hover:bg-gray-800/60 rounded transition-all duration-200"
                      style={{
                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                        letterSpacing: '0.05em',
                        border: '1px solid rgba(250, 182, 23, 0.2)',
                        fontSize: '11px'
                      }}
                    >
                      Connect Wallet
                    </button>
                  )}
                </div>
              </div>
              
              {/* Live Earnings */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col text-right">
                <div 
                  style={{ 
                    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                    fontSize: '23px',
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
                    fontSize: '10px',
                    letterSpacing: '0.2em',
                    fontFamily: "'Consolas', 'Monaco', monospace",
                    textTransform: 'uppercase',
                    marginTop: '3px',
                    opacity: 0.8
                  }}
                >
                  To Collect
                </div>
              </div>
            </div>,
            "COMMAND STATUS"
          )}
        </div>
        
        {/* Unified Stats - Industrial Style */}
        <div className="mb-6">
          {renderIndustrialCard(
            <div className="p-4">
              {/* Economy Status */}
              <div className="mb-4">
                <h3 className="text-xs text-yellow-400 uppercase tracking-[0.3em] mb-2 font-semibold" style={{ fontSize: '10px' }}>
                  Economy Status
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div 
                    className="p-2.5 bg-black/30 rounded border-l-4 border-yellow-500 hover:bg-black/40 transition-all cursor-pointer"
                    onClick={async () => {
                      try {
                        const result = await setGoldRate({ 
                          walletAddress: "demo_wallet_123", 
                          goldPerHour: GAME_CONSTANTS.TEST_GOLD_RATE 
                        });
                        setGoldPerSecond(result.goldPerSecond);
                        setCachedGoldData(prev => ({ ...prev, goldPerHour: GAME_CONSTANTS.TEST_GOLD_RATE, goldPerSecond: result.goldPerSecond }));
                      } catch (error) {}
                    }}
                  >
                    <div className="text-base font-bold text-yellow-400">{((cachedGoldData?.goldPerHour || liveGoldData?.rate) || GAME_CONSTANTS.DEFAULT_GOLD_RATE).toFixed(1)}/hr</div>
                    <div className="text-xs text-gray-400" style={{ fontSize: '10px' }}>Gold Rate (Click for 8.7k)</div>
                  </div>
                  <div className="p-2.5 bg-black/30 rounded border-l-4 border-yellow-500 hover:bg-black/40 transition-all">
                    <div className="text-base font-bold text-yellow-400">
                      {Object.values(userProfile.totalEssence).reduce((a, b) => a + b, 0).toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400" style={{ fontSize: '10px' }}>Total Essence</div>
                  </div>
                  <div className="p-2.5 bg-black/30 rounded border-l-4 border-yellow-500 hover:bg-black/40 transition-all cursor-pointer">
                    <div className="text-base font-bold text-yellow-400">0.100/day</div>
                    <div className="text-xs text-gray-400" style={{ fontSize: '10px' }}>Essence Rate</div>
                  </div>
                </div>
              </div>
              
              {/* Activity & Progress */}
              <div className="pt-3 border-t border-gray-700/30">
                <h3 className="text-xs text-yellow-400 uppercase tracking-[0.3em] mb-2 font-semibold" style={{ fontSize: '10px' }}>
                  Activity & Progress
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2.5 bg-black/30 rounded border-l-4 border-yellow-500 hover:bg-black/40 transition-all">
                    <div className="text-base font-bold text-yellow-400">12</div>
                    <div className="text-xs text-gray-400" style={{ fontSize: '10px' }}>AH Listings</div>
                  </div>
                  <div className="p-2.5 bg-black/30 rounded border-l-4 border-yellow-500 hover:bg-black/40 transition-all">
                    <div className="text-base font-bold text-yellow-400">45,000</div>
                    <div className="text-xs text-gray-400" style={{ fontSize: '10px' }}>Total XP</div>
                  </div>
                  <Link 
                    href="/xp-allocation" 
                    className="p-2.5 bg-black/30 rounded border-l-4 border-yellow-500 hover:bg-black/40 transition-all cursor-pointer"
                  >
                    <div className="text-base font-bold text-yellow-400">15,000</div>
                    <div className="text-xs text-gray-400" style={{ fontSize: '10px' }}>Unspent XP</div>
                  </Link>
                </div>
              </div>
            </div>,
            "OPERATIONS METRICS"
          )}
        </div>
        
        {/* Top Row: Gold Metrics and Essence Vault */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Gold Metrics Card */}
          <div>
            {renderIndustrialCard(
              <div className="p-3">
                <div className="mb-3">
                  <h3 className="text-base font-bold text-center mb-2" style={{
                    fontFamily: "'Orbitron', 'Bebas Neue', sans-serif",
                    letterSpacing: '0.1em',
                    color: '#fab617',
                    textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
                  }}>GROWTH ANALYTICS</h3>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setChartMode('total')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        chartMode === 'total' 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                          : 'bg-black/30 text-gray-400 hover:bg-black/40'
                      }`}
                      style={{ fontSize: '10px' }}
                    >
                      Total Gold
                    </button>
                    <button
                      onClick={() => setChartMode('rate')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        chartMode === 'rate' 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                          : 'bg-black/30 text-gray-400 hover:bg-black/40'
                      }`}
                      style={{ fontSize: '10px' }}
                    >
                      Gold/hr
                    </button>
                  </div>
                </div>
                
                {/* Gold History Chart */}
                <div className="mb-5">
                  <div className="h-28 bg-black/30 rounded-lg p-2 relative">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2" style={{ fontSize: '9px' }}>
                      <span>{Math.floor((totalGold + liveGold) * 1.33).toLocaleString()}</span>
                      <span>{Math.floor((totalGold + liveGold) * 0.67).toLocaleString()}</span>
                      <span>0</span>
                    </div>
                    
                    {/* Chart area */}
                    <div className="ml-10 h-full relative">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="0.5"/>
                        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="0.5"/>
                        <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="0.5"/>
                        
                        <polyline
                          points={chartData.points}
                          fill="none"
                          stroke="#fab617"
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                        />
                        
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
                      
                      {/* X-axis dates */}
                      <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs text-gray-500" style={{ fontSize: '9px' }}>
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
                  <div className="flex justify-center gap-2 mt-10">
                    <button
                      onClick={() => setChartPeriod('7d')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        chartPeriod === '7d' 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                          : 'bg-black/30 text-gray-400 hover:bg-black/40'
                      }`}
                      style={{ fontSize: '10px' }}
                    >
                      7 Days
                    </button>
                    <button
                      onClick={() => setChartPeriod('30d')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        chartPeriod === '30d' 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                          : 'bg-black/30 text-gray-400 hover:bg-black/40'
                      }`}
                      style={{ fontSize: '10px' }}
                    >
                      30 Days
                    </button>
                    <button
                      onClick={() => setChartPeriod('all')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        chartPeriod === 'all' 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                          : 'bg-black/30 text-gray-400 hover:bg-black/40'
                      }`}
                      style={{ fontSize: '10px' }}
                    >
                      All Time
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2.5">
                  {/* Gold Stats */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400 text-xs" style={{ fontSize: '11px' }}>Base Mek Gold/hr:</span>
                    <span className="text-yellow-400 font-semibold text-xs">{Math.floor(goldPerSecond * 3600).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400 text-xs" style={{ fontSize: '11px' }}>Gold in Bank:</span>
                    <span className="text-white text-xs">0</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400 text-xs" style={{ fontSize: '11px' }}>Bank Interest:</span>
                    <span className="text-green-400 text-xs">0%</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400 text-xs" style={{ fontSize: '11px' }}>Gold/hr from Bank:</span>
                    <span className="text-green-400 text-xs">0</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400 text-xs" style={{ fontSize: '11px' }}>Gold/hr from Trees:</span>
                    <span className="text-blue-400 text-xs">0</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400 text-xs" style={{ fontSize: '11px' }}>Gold/hr from Items:</span>
                    <span className="text-purple-400 text-xs">0</span>
                  </div>
                  
                  {/* Grand Total */}
                  <div className="mt-3 pt-3 border-t-2 border-yellow-500/50 text-center">
                    <div className="text-gray-300 text-xs font-medium mb-1" style={{ fontSize: '11px' }}>Total Gold/hr</div>
                    <div 
                      style={{ 
                        fontFamily: "'Orbitron', 'Bebas Neue', sans-serif",
                        fontSize: '28px',
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
                    <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider" style={{ fontSize: '9px' }}>Production Rate</div>
                  </div>
                </div>
              </div>,
              "GOLD METRICS"
            )}
          </div>
                    
                    return (
                      <div key={emp.id} className="mb-2 p-1.5 bg-black/30 rounded-lg flex items-center justify-between" style={{ minHeight: '65px' }}>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-11 h-11 bg-gray-700 rounded-md flex items-center justify-center overflow-hidden">
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
                            <div className="font-medium text-xs">Mek #{emp.id} - Level {emp.level}</div>
                            <div className="text-xs space-y-0.5">
                              <div className="text-yellow-400 font-medium" style={{ fontSize: '10px' }}>Rate: {emp.rate}/hr</div>
                              <div className={emp.gold === emp.maxGold ? "text-red-400 font-medium" : "text-gray-400"} style={{ fontSize: '10px' }}>
                                Gold: {emp.gold}/{emp.maxGold} 
                                <span className={emp.buffed ? "text-green-400" : "text-gray-400"}>({emp.hourCap} cap)</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1 mt-1 overflow-hidden mr-1" style={{boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'}}>
                              <div 
                                className="h-1 rounded-full transition-all relative" 
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
                            const mekGold = emp.gold;
                            
                            setEmployees(prevEmployees => 
                              prevEmployees.map(employee => 
                                employee.id === emp.id 
                                  ? { ...employee, gold: 0, progress: 0 }
                                  : employee
                              )
                            );
                            
                            animateGoldCount(totalGold, totalGold + mekGold, (value) => {
                              setTotalGold(value);
                            });
                            
                            const button = e.currentTarget;
                            button.classList.add('collecting');
                            setTimeout(() => {
                              button.classList.remove('collecting');
                            }, 500);
                            
                            const xpGained = Math.floor(mekGold / 10);
                            showGoldPopup(mekGold, xpGained, false, 1);
                          }}
                          className={`ml-1 px-2.5 py-1 text-xs font-medium rounded transition-all duration-200 ${
                            emp.gold === emp.maxGold 
                              ? "border-2 border-yellow-500 bg-transparent text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 pulsate-glow"
                              : emp.gold > 0
                              ? "border-2 border-yellow-500 bg-transparent text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
                              : "border border-gray-600 bg-transparent text-gray-500 cursor-not-allowed"
                          }`}
                          disabled={emp.gold === 0}
                          style={{ fontSize: '11px' }}
                        >
                          Collect
                        </button>
                      </div>
                    );
                  });
                })()}
                
                {/* Pagination */}
                <div className="flex justify-between items-center mt-3">
                  <button 
                    onClick={() => setCurrentEmployeePage(Math.max(0, currentEmployeePage - 1))}
                    disabled={currentEmployeePage === 0}
                    className="px-2.5 py-1 text-xs bg-black/30 hover:bg-black/40 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600"
                    style={{ fontSize: '10px' }}
                  >
                    ← Previous
                  </button>
                  <div className="flex gap-2">
                    {[0, 1].map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentEmployeePage(page)}
                        className={`w-7 h-7 rounded text-xs ${currentEmployeePage === page ? 'bg-yellow-500 text-black' : 'bg-black/30 hover:bg-black/40 text-white border border-gray-600'} transition-colors`}
                      >
                        {page + 1}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setCurrentEmployeePage(Math.min(1, currentEmployeePage + 1))}
                    disabled={currentEmployeePage === 1}
                    className="px-2.5 py-1 text-xs bg-black/30 hover:bg-black/40 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600"
                    style={{ fontSize: '10px' }}
                  >
                    Next →
                  </button>
                </div>
                
                <div className="text-center mt-3">
                  <button 
                    onClick={() => setShowSlotBuffsModal(true)}
                    className="px-5 py-2.5 bg-transparent border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 rounded transition-all duration-200 font-semibold text-xs"
                  >
                    <span className="mr-2">+</span> Add Slot
                  </button>
                </div>
              </div>,
              "ACTIVE MEKS"
            )}
          </div>
          
          {/* Essence Vault Card */}
          <div>
            {renderIndustrialCard(
              <div className="p-3">
                <h3 className="text-base font-bold mb-3" style={{
                  fontFamily: "'Orbitron', 'Bebas Neue', sans-serif",
                  letterSpacing: '0.1em',
                  color: '#fab617',
                  textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
                }}>
                  ESSENCE VAULT
                </h3>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setChartMode('total')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        chartMode === 'total' 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                          : 'bg-black/30 text-gray-400 hover:bg-black/40'
                      }`}
                      style={{ fontSize: '10px' }}
                    >
                      Total Gold
                    </button>
                    <button
                      onClick={() => setChartMode('rate')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        chartMode === 'rate' 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                          : 'bg-black/30 text-gray-400 hover:bg-black/40'
                      }`}
                      style={{ fontSize: '10px' }}
                    >
                      Gold/hr
                    </button>
                  </div>
                </div>
                
                {/* Gold History Chart */}
                <div className="mb-5">
                  <div className="h-28 bg-black/30 rounded-lg p-2 relative">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2" style={{ fontSize: '9px' }}>
                      <span>{Math.floor((totalGold + liveGold) * 1.33).toLocaleString()}</span>
                      <span>{Math.floor((totalGold + liveGold) * 0.67).toLocaleString()}</span>
                      <span>0</span>
                    </div>
                    
                    {/* Chart area */}
                    <div className="ml-10 h-full relative">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="0.5"/>
                        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="0.5"/>
                        <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="0.5"/>
                        
                        <polyline
                          points={chartData.points}
                          fill="none"
                          stroke="#fab617"
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                        />
                        
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
                      
                      {/* X-axis dates */}
                      <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs text-gray-500" style={{ fontSize: '9px' }}>
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
                  <div className="flex justify-center gap-2 mt-10">
                    <button
                      onClick={() => setChartPeriod('7d')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        chartPeriod === '7d' 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                          : 'bg-black/30 text-gray-400 hover:bg-black/40'
                      }`}
                      style={{ fontSize: '10px' }}
                    >
                      7 Days
                    </button>
                    <button
                      onClick={() => setChartPeriod('30d')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        chartPeriod === '30d' 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                          : 'bg-black/30 text-gray-400 hover:bg-black/40'
                      }`}
                      style={{ fontSize: '10px' }}
                    >
                      30 Days
                    </button>
                    <button
                      onClick={() => setChartPeriod('all')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        chartPeriod === 'all' 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                          : 'bg-black/30 text-gray-400 hover:bg-black/40'
                      }`}
                      style={{ fontSize: '10px' }}
                    >
                      All Time
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2.5">
                  {/* Gold Stats */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400 text-xs" style={{ fontSize: '11px' }}>Base Mek Gold/hr:</span>
                    <span className="text-yellow-400 font-semibold text-xs">{Math.floor(goldPerSecond * 3600).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400 text-xs" style={{ fontSize: '11px' }}>Gold in Bank:</span>
                    <span className="text-white text-xs">0</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400 text-xs" style={{ fontSize: '11px' }}>Bank Interest:</span>
                    <span className="text-green-400 text-xs">0%</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400 text-xs" style={{ fontSize: '11px' }}>Gold/hr from Bank:</span>
                    <span className="text-green-400 text-xs">0</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400 text-xs" style={{ fontSize: '11px' }}>Gold/hr from Trees:</span>
                    <span className="text-blue-400 text-xs">0</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400 text-xs" style={{ fontSize: '11px' }}>Gold/hr from Items:</span>
                    <span className="text-purple-400 text-xs">0</span>
                  </div>
                  
                  {/* Grand Total */}
                  <div className="mt-3 pt-3 border-t-2 border-yellow-500/50 text-center">
                    <div className="text-gray-300 text-xs font-medium mb-1" style={{ fontSize: '11px' }}>Total Gold/hr</div>
                    <div 
                      style={{ 
                        fontFamily: "'Orbitron', 'Bebas Neue', sans-serif",
                        fontSize: '28px',
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
                    <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider" style={{ fontSize: '9px' }}>Production Rate</div>
                  </div>
                </div>
              </div>,
              "GOLD METRICS"
            )}
          </div>
        </div>
        
        {/* Recent Activity and Essence Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Recent Activity */}
          <div>
            {renderIndustrialCard(
              <div className="p-3">
                <h3 className="text-base font-bold mb-3" style={{
                  fontFamily: "'Orbitron', 'Bebas Neue', sans-serif",
                  letterSpacing: '0.1em',
                  color: '#fab617',
                  textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
                }}>
                  ACTIVITY LOG
                </h3>
                <div className="space-y-2">
                  {[
                    { icon: '🟡', text: 'Collected 247g from Mek #1234', time: '2 minutes ago', color: 'yellow' },
                    { icon: '🟢', text: 'Listed Disco Head for 1,200g', time: '15 minutes ago', color: 'green' },
                    { icon: '🟣', text: 'Purchased 2x Pearls for 500g', time: '1 hour ago', color: 'purple' },
                    { icon: '🔵', text: 'Hired Mentor #2468 for 24 hours', time: '2 hours ago', color: 'blue' },
                    { icon: '🟡', text: 'Mek #5612 reached Level 8', time: '3 hours ago', color: 'yellow' },
                    { icon: '🔴', text: 'Outbid on Camera Head', time: '5 hours ago', color: 'red' },
                  ].map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-1.5 rounded bg-black/20 hover:bg-black/30 transition-colors">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                        activity.color === 'yellow' ? 'bg-yellow-400' :
                        activity.color === 'green' ? 'bg-green-400' :
                        activity.color === 'purple' ? 'bg-purple-400' :
                        activity.color === 'blue' ? 'bg-blue-400' :
                        'bg-red-400'
                      } ${activity.color === 'yellow' ? 'animate-pulse' : ''}`}></div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-200" style={{ fontSize: '11px' }}>{activity.text}</div>
                        <div className="text-xs text-gray-500" style={{ fontSize: '9px' }}>{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 pt-2.5 border-t border-gray-700/30">
                  <button className="w-full px-2.5 py-1.5 bg-black/30 hover:bg-black/40 text-gray-300 hover:text-white rounded transition-all duration-200 text-xs font-medium border border-gray-600" style={{ fontSize: '11px' }}>
                    View Full History
                  </button>
                </div>
              </div>,
              "RECENT ACTIVITY"
            )}
          </div>
          
          {/* Essence Collection */}
          <div>
            {renderIndustrialCard(
              <div className="p-3">
                <h3 className="text-base font-bold mb-3" style={{
                  fontFamily: "'Orbitron', 'Bebas Neue', sans-serif",
                  letterSpacing: '0.1em',
                  color: '#fab617',
                  textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
                }}>
                  ESSENCE VAULT
                </h3>
                
                {/* Essence Grid */}
                <div className="grid grid-cols-5 gap-1.5 mb-3">
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
                          className="w-7 h-7 mb-1 mx-auto"
                        />
                        <div className="text-xs font-bold text-white" style={{ fontSize: '10px' }}>{essence.amount}</div>
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50" style={{ fontSize: '9px' }}>
                        {essence.name} Essence
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Essence Stats */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between items-center p-1.5 bg-black/20 rounded">
                    <span className="text-xs text-gray-400" style={{ fontSize: '10px' }}>Total Essence Types</span>
                    <span className="text-xs font-bold text-yellow-400" style={{ fontSize: '11px' }}>27</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 bg-black/20 rounded">
                    <span className="text-xs text-gray-400" style={{ fontSize: '10px' }}>Total Essence Count</span>
                    <span className="text-xs font-bold text-yellow-400" style={{ fontSize: '11px' }}>126</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 bg-black/20 rounded">
                    <span className="text-xs text-gray-400" style={{ fontSize: '10px' }}>Essence per Day</span>
                    <span className="text-xs font-bold text-green-400" style={{ fontSize: '11px' }}>+0.100</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 bg-black/20 rounded">
                    <span className="text-xs text-gray-400" style={{ fontSize: '10px' }}>Next Essence In</span>
                    <span className="text-xs font-bold text-blue-400" style={{ fontSize: '11px' }}>14h 23m</span>
                  </div>
                </div>
                
                <Link 
                  href="/essence"
                  className="block w-full px-3 py-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 hover:from-yellow-500/30 hover:to-yellow-600/30 text-yellow-400 rounded transition-all duration-200 text-center font-semibold border border-yellow-500/50 hover:border-yellow-500 text-xs"
                >
                  <span className="mr-2">✨</span>
                  Manage Essence Collection
                </Link>
              </div>,
              "ESSENCE COLLECTION"
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/crafting', icon: '🔨', label: 'Crafting' },
            { href: '/mek-assignment', icon: '🎰', label: 'Assign Mek' },
            { href: '/inventory', icon: '🎒', label: 'Inventory' },
            { href: '/meks', icon: '🤖', label: 'My Meks' },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              {renderIndustrialCard(
                <div className="p-3 text-center hover:bg-black/20 transition-all">
                  <div className="text-xl mb-1.5">{action.icon}</div>
                  <div className="font-semibold text-xs" style={{ fontSize: '11px' }}>{action.label}</div>
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