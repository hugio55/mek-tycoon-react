"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";

export default function HubPage() {
  const [liveGold, setLiveGold] = useState(2847.00);
  const [totalGold, setTotalGold] = useState(15420);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  
  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
  useEffect(() => {
    const initUser = async () => {
      const user = await getOrCreateUser({ 
        walletAddress: "demo_wallet_123" 
      });
      if (user) {
        setUserId(user._id as Id<"users">);
        setTotalGold(user.gold);
      }
    };
    initUser();
  }, [getOrCreateUser]);
  
  // Get user profile with real-time updates
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );
  
  // Simulate live gold counter
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveGold(prev => prev + 0.01);
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  const collectAllGold = (e: React.MouseEvent<HTMLButtonElement>) => {
    const goldToCollect = Math.floor(liveGold);
    
    // Animate counting up
    animateGoldCount(totalGold, totalGold + goldToCollect, (value) => {
      setTotalGold(value);
    });
    
    setLiveGold(0);
    
    // Add animation to button
    const button = e.currentTarget;
    button.classList.add('collecting');
    setTimeout(() => {
      button.classList.remove('collecting');
    }, 500);
    
    // Create gold popup animation
    showGoldPopup(goldToCollect);
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
  
  const showGoldPopup = (amount: number) => {
    // Create popup element
    const popup = document.createElement('div');
    popup.className = 'gold-popup';
    popup.textContent = `+${amount} Gold Collected!`;
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
      font-size: 24px;
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
  
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-2xl animate-pulse">
          Loading Hub...
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-white overflow-hidden">
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
      `}</style>
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Yellow gradient orbs from sides */}
        <div 
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 0% 50%, rgba(250, 182, 23, 0.15) 0%, transparent 40%),
              radial-gradient(ellipse at 100% 50%, rgba(250, 182, 23, 0.15) 0%, transparent 40%)
            `
          }}
        />
        
        {/* Static Stars */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 10}%`,
              fontSize: '12px',
              color: '#fab617',
              opacity: 0.6
            }}
          >
            {i % 2 === 0 ? '✦' : '✧'}
          </div>
        ))}
        
        {/* Fine Stars */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`fine-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: '8px',
              color: '#999',
              opacity: 0.7
            }}
          >
            ·
          </div>
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
          {/* Cosmic Debris Background */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Large floating particles */}
            {[...Array(8)].map((_, i) => (
              <div
                key={`debris-${i}`}
                className="absolute opacity-20"
                style={{
                  left: `${15 + i * 11}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  width: `${3 + (i % 2) * 2}px`,
                  height: `${3 + (i % 2) * 2}px`,
                  background: i % 2 === 0 ? '#fab617' : '#00ff88',
                  borderRadius: '50%',
                  animation: `float ${8 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
            {/* Small particles */}
            {[...Array(15)].map((_, i) => (
              <div
                key={`particle-${i}`}
                className="absolute opacity-30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: '1px',
                  height: '1px',
                  background: '#fab617',
                  borderRadius: '50%',
                  animation: `twinkle ${3 + Math.random() * 2}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            ))}
          </div>
          
          {/* Green inner border */}
          <div 
            className="absolute inset-[2px] rounded-xl pointer-events-none"
            style={{
              border: '1px solid #00ff88',
              opacity: 0.5
            }}
          />
          
          <div className="relative flex items-center justify-between px-4">
            {/* Total Gold Display */}
            <div className="text-left">
              <div 
                style={{ 
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                  fontSize: '32px',
                  fontWeight: 300,
                  color: '#fab617',
                  letterSpacing: '0.02em',
                  textShadow: '0 0 10px rgba(250, 182, 23, 0.5)',
                  lineHeight: '1'
                }}
              >
                {totalGold.toLocaleString()}
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
            
            {/* Hub Title */}
            <div className="text-center flex-1">
              <h1 
                style={{
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                  fontSize: '42px',
                  fontWeight: 700,
                  color: '#fab617',
                  letterSpacing: '0.1em',
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
            
            {/* Live Earnings */}
            <div className="text-right">
              <div 
                style={{ 
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                  fontSize: '28px',
                  fontWeight: 300,
                  color: '#00ff88',
                  letterSpacing: '0.02em',
                  textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
                  lineHeight: '1'
                }}
              >
                {liveGold.toFixed(2)}
              </div>
              <div 
                style={{
                  color: '#00ff88',
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
              <div className="p-3 bg-gray-900/50 rounded border-l-4 border-yellow-500 hover:bg-gray-800/70 transition-all cursor-pointer">
                <div className="text-lg font-bold text-yellow-400">50/hr</div>
                <div className="text-xs text-gray-400">Gold Rate</div>
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
              Active Employees
            </h3>
            <button
              onClick={collectAllGold}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded hover:from-yellow-400 hover:to-yellow-300 transition-all"
            >
              Collect All
            </button>
          </div>
          
          {/* Mek Employee */}
          <div className="mb-3 p-4 bg-gray-900/50 rounded-lg border-l-4 border-yellow-500 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                🤖
              </div>
              <div>
                <div className="font-semibold">Mek #1234 - Level 5</div>
                <div className="text-sm text-gray-400">
                  <span className="text-yellow-400 font-semibold">Rate: 15.5/hr</span> | 
                  Gold: 968/968 (72h cap)
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full" style={{width: '100%'}} />
                </div>
              </div>
            </div>
            <button 
              onClick={(e) => {
                // Collect individual mek gold
                const mekGold = 968;
                
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
                
                // Show popup
                showGoldPopup(mekGold);
              }}
              className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400 transition-colors"
            >
              Collect
            </button>
          </div>
          
          {/* Empty Slot */}
          <div className="mb-3 p-4 bg-gradient-to-r from-yellow-500/10 to-gray-900/10 rounded-lg border-l-4 border-yellow-500 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border-2 border-yellow-500 border-dashed rounded-full flex items-center justify-center text-2xl text-yellow-500 hover:bg-yellow-500/20 cursor-pointer transition-colors">
                +
              </div>
              <div>
                <div className="font-semibold text-yellow-400">Empty Slot Available</div>
                <div className="text-sm text-gray-400">Assign a Mek to start earning gold and essence</div>
              </div>
            </div>
            <button className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400 transition-colors animate-pulse">
              Assign Mek
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
          <Link href="/marketplace" className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-yellow-500 transition-all text-center">
            <div className="text-2xl mb-2">🏪</div>
            <div className="font-semibold">Marketplace</div>
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