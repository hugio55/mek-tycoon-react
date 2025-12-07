"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import MekImage from "@/components/MekImage";
import Link from "next/link";

type LeaderboardCategory = 'gold' | 'meks' | 'essence' | 'topMeks' | 'achievements';
type TopMeksSortBy = 'goldTotal' | 'goldPerHour' | 'essenceTotal' | 'essencePerHour';
type GoldViewType = 'total' | 'perHour';
type EssenceViewType = 'total' | 'perHour';

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  username?: string;
  value: number;
  metadata?: {
    level?: number;
    essenceBreakdown?: any;
    mekDetails?: {
      total: number;
      legendary: number;
      epic: number;
      rare: number;
      uncommon: number;
      common: number;
      topMekAssetId?: string;
      topMekLevel?: number;
    };
    goldPerHour?: number;
    essencePerHour?: number;
    achievementScore?: number;
    topMek?: {
      assetId: string;
      assetName: string;
      level: number;
      goldRate: number;
      essenceRate?: number;
      totalGold?: number;
      totalEssence?: number;
    };
  };
}

export default function LeaderboardPage() {
  const [currentWallet, setCurrentWallet] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>('achievements');
  const [topMeksSortBy, setTopMeksSortBy] = useState<TopMeksSortBy>('goldPerHour');
  const [goldView, setGoldView] = useState<GoldViewType>('total');
  const [essenceView, setEssenceView] = useState<EssenceViewType>('total');
  const [showGoldSubmenu, setShowGoldSubmenu] = useState(false);
  const [showEssenceSubmenu, setShowEssenceSubmenu] = useState(false);

  useEffect(() => {
    const stakeAddress = localStorage.getItem('stakeAddress');
    const paymentAddress = localStorage.getItem('walletAddress');
    const addressToUse = stakeAddress || paymentAddress || null;
    setCurrentWallet(addressToUse);
  }, []);

  // DISABLED SERVER QUERIES - Using mock data for now
  const leaderboardData = null; // Disabled
  const currentUser = null; // Disabled
  const userRank = null; // Disabled
  const topAchievementData = null; // Disabled
  const topGoldData = null; // Disabled
  
  // Mock data generators
  const generateMockMekName = (index: number) => {
    const prefixes = ["Cyber", "Neon", "Quantum", "Plasma", "Chrome", "Flux", "Volt", "Nova", "Echo", "Zenith"];
    const suffixes = ["Strike", "Blade", "Core", "Prime", "Alpha", "Omega", "Nexus", "Pulse", "Storm", "Vortex"];
    return `${prefixes[index % prefixes.length]} ${suffixes[Math.floor(index / prefixes.length) % suffixes.length]}`;
  };
  
  const generateMockUsername = (index: number) => {
    const names = [
      "MekMaster2024", "CryptoKing", "DiamondHands", "NeonRider", "QuantumLeap",
      "PlasmaStorm", "ChromeLegend", "VoltageHero", "NovaHunter", "EchoWarrior",
      "ZenithPrime", "FluxCommander", "AlphaTycoon", "OmegaCollector", "NexusBaron",
      "PulseKnight", "StormBreaker", "VortexLord", "CyberSamurai", "NeonPhoenix",
      "QuantumAce", "PlasmaRanger", "ChromeGuardian", "VoltMaster", "NovaKing",
      "EchoChampion", "ZenithElite", "FluxEmperor", "AlphaRaider", "OmegaTitan"
    ];
    return names[index % names.length] + (index >= names.length ? `_${Math.floor(index / names.length)}` : "");
  };
  
  // Generate mock leaderboard data based on category
  const generateMockLeaderboardData = (category: LeaderboardCategory, count: number = 50): LeaderboardEntry[] => {
    const entries: LeaderboardEntry[] = [];
    
    for (let i = 0; i < count; i++) {
      const walletSuffix = Math.random().toString(36).substring(2, 6);
      const entry: LeaderboardEntry = {
        rank: i + 1,
        walletAddress: `0x${i.toString(16).padStart(4, '0')}...${walletSuffix}`,
        username: generateMockUsername(i),
        value: 0,
        metadata: {}
      };
      
      switch (category) {
        case 'gold':
          const goldAmount = Math.floor((1000000 - i * 15000) * (1 + Math.random() * 0.3));
          entry.value = goldAmount;
          entry.metadata = {
            level: Math.max(1, 100 - i * 2),
            goldPerHour: Math.floor(goldAmount * 0.05),
            mekDetails: { total: Math.max(1, 50 - i) }
          };
          break;
          
        case 'meks':
          const mekCount = Math.max(1, 100 - i * 2) + Math.floor(Math.random() * 10);
          entry.value = mekCount;
          entry.metadata = {
            level: Math.max(1, 80 - i),
            mekDetails: {
              total: mekCount,
              legendary: Math.max(0, Math.floor(mekCount * 0.05)),
              epic: Math.max(0, Math.floor(mekCount * 0.10)),
              rare: Math.max(0, Math.floor(mekCount * 0.15)),
              uncommon: Math.max(0, Math.floor(mekCount * 0.25)),
              common: Math.max(0, Math.floor(mekCount * 0.45)),
              topMekAssetId: `MEK#${1000 + i}`,
              topMekLevel: Math.max(1, 50 - i)
            }
          };
          break;
          
        case 'essence':
          const essenceAmount = Math.floor((500000 - i * 8000) * (1 + Math.random() * 0.2));
          entry.value = essenceAmount;
          entry.metadata = {
            level: Math.max(1, 90 - i * 2),
            essencePerHour: Math.floor(essenceAmount * 0.03),
            essenceBreakdown: {
              stone: Math.floor(essenceAmount * 0.15),
              disco: Math.floor(essenceAmount * 0.10),
              paul: Math.floor(essenceAmount * 0.08),
              cartoon: Math.floor(essenceAmount * 0.12),
              candy: Math.floor(essenceAmount * 0.09),
              tiles: Math.floor(essenceAmount * 0.07),
              moss: Math.floor(essenceAmount * 0.06),
              bullish: Math.floor(essenceAmount * 0.08),
              journalist: Math.floor(essenceAmount * 0.05),
              laser: Math.floor(essenceAmount * 0.04),
              flashbulb: Math.floor(essenceAmount * 0.04),
              accordion: Math.floor(essenceAmount * 0.04),
              turret: Math.floor(essenceAmount * 0.03),
              drill: Math.floor(essenceAmount * 0.03),
              security: Math.floor(essenceAmount * 0.02)
            }
          };
          break;
          
        case 'topMeks':
          const goldRate = Math.floor((10000 - i * 150) * (1 + Math.random() * 0.25));
          entry.value = goldRate;
          entry.metadata = {
            topMek: {
              assetId: `MEK#${2000 + i}`,
              assetName: generateMockMekName(i),
              level: Math.max(1, 100 - i * 2),
              goldRate: goldRate,
              essenceRate: Math.floor(goldRate * 0.15),
              totalGold: goldRate * 1000,
              totalEssence: Math.floor(goldRate * 150)
            }
          };
          break;
          
        case 'achievements':
          const achievementScore = Math.floor((10000 - i * 180) * (1 + Math.random() * 0.15));
          entry.value = achievementScore;
          entry.metadata = {
            achievementScore: achievementScore,
            level: Math.max(1, 95 - i * 2),
            mekDetails: { total: Math.max(1, 60 - i) }
          };
          break;
      }
      
      entries.push(entry);
    }
    
    return entries;
  };
  
  // Use mock data instead of server data
  const mockLeaderboardData = generateMockLeaderboardData(selectedCategory);
  const mockTopAchievements = generateMockLeaderboardData('achievements', 3);
  const mockUserRank = Math.floor(Math.random() * 50) + 1;
  
  // Mock current user data
  const mockCurrentUser = {
    _id: 'mock_user_id',
    walletAddress: currentWallet,
    username: "YourUsername",
    gold: 50000,
    level: 25
  };

  // Use mock data for display
  const podiumData = mockTopAchievements;
  const displayLeaderboardData = mockLeaderboardData;
  const topData = mockTopAchievements;

  const formatNumber = (num: number | string | undefined) => {
    // Convert to number and handle invalid values
    const value = typeof num === 'number' ? num : Number(num) || 0;
    
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    if (rank <= 10) return '#E5E4E2';
    return '#6B7280';
  };

  const getRankIcon = (rank: number) => {
    return '';
  };

  const getCategoryData = () => {
    switch (selectedCategory) {
      case 'gold':
        return {
          columns: goldView === 'total' ? ['Player', 'Total Gold'] : ['Player', 'Gold/hr'],
          renderRow: (entry: LeaderboardEntry) => 
            goldView === 'total' 
              ? [formatNumber(entry.value)]
              : [`${formatNumber(entry.value)}/hr`],
          showHighestMek: false
        };
      case 'meks':
        return {
          columns: ['Player', 'Mek Count'],
          renderRow: (entry: LeaderboardEntry) => [
            entry.value
          ],
          showHighestMek: true
        };
      case 'essence':
        return {
          columns: essenceView === 'total' ? ['Player', 'Total Essence'] : ['Player', 'Essence/hr'],
          renderRow: (entry: LeaderboardEntry) => 
            essenceView === 'total' 
              ? [formatNumber(entry.value)]
              : [`${formatNumber(entry.metadata?.essencePerHour || entry.value)}/hr`],
          showHighestMek: false
        };
      case 'topMeks':
        return {
          columns: ['Mek', 'Total Gold', 'Gold/hr', 'Total Essence', 'Essence/hr'],
          renderRow: (entry: LeaderboardEntry) => [
            formatNumber(entry.metadata?.topMek?.totalGold || 0),
            `${entry.metadata?.topMek?.goldRate?.toFixed(1) || '0'}/hr`,
            formatNumber(entry.metadata?.topMek?.totalEssence || 0),
            `${entry.metadata?.topMek?.essenceRate?.toFixed(1) || '0'}/hr`
          ],
          clickableColumns: [1, 2, 3, 4], // indices of clickable columns
          sortValues: ['goldTotal', 'goldPerHour', 'essenceTotal', 'essencePerHour'],
          isMekList: true,
          showHighestMek: false
        };
      case 'achievements':
        return {
          columns: ['Player', 'Achievement Points'],
          renderRow: (entry: LeaderboardEntry) => [
            null, // Player cell handled separately
            formatNumber(entry.value)
          ],
          showHighestMek: false,
          playerColIndex: 0
        };
      default:
        return { columns: [], renderRow: () => [], showHighestMek: false };
    }
  };

  const currentCategoryData = getCategoryData();
  const isUserInTop10 = false; // Always false for mock data

  return (
    <div className="text-white py-8 min-h-screen relative">
      
      {/* Epic Title */}
      <div className="text-center mb-12">
        <h1 
          style={{
            fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
            fontSize: '48px',
            fontWeight: 900,
            color: '#fab617',
            letterSpacing: '0.15em',
            textShadow: '0 0 20px rgba(250, 182, 23, 0.6)',
          }}
        >
          LEADERBOARD
        </h1>
      </div>

      {/* Top 3 Podium - Compact with Large Square Images */}
      <div className="mb-8 max-w-6xl mx-auto">
        <div className="flex items-end justify-center gap-12">
          {/* 2nd Place - Left */}
          {podiumData?.[1] && (
            <div className="flex flex-col items-center" style={{ zIndex: 20 }}>
              <div className="text-3xl font-thin text-gray-300 mb-2">2</div>
              <div className="relative mb-3">
                <div 
                  className="w-32 h-32 rounded-lg overflow-hidden bg-gray-900 border-2 border-silver-400 cursor-pointer transition-all duration-300 hover:scale-105 hover:brightness-110" 
                  style={{ borderColor: '#C0C0C0', boxShadow: '0 4px 20px rgba(192, 192, 192, 0.4)' }}
                  onClick={() => {}}
                >
                  <MekImage
                    src={undefined}
                    assetId={"0000"}
                    size={128}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div 
                className="relative overflow-hidden"
                style={{ 
                  width: '128px',
                  background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
                  backdropFilter: 'blur(12px)',
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                  border: '2px solid',
                  borderImage: 'linear-gradient(135deg, #C0C0C0 0%, #808080 50%, #C0C0C0 100%) 1',
                  boxShadow: '0 4px 20px rgba(192, 192, 192, 0.3), inset 0 0 20px rgba(192, 192, 192, 0.1)',
                  padding: '12px',
                }}
              >
                {/* Metal texture overlay */}
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    background: `repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 10px,
                      rgba(192, 192, 192, 0.1) 10px,
                      rgba(192, 192, 192, 0.1) 11px
                    )`,
                  }}
                />
                
                {/* Rank badge */}
                <div 
                  className="absolute -top-1 -right-1 w-8 h-8 flex items-center justify-center rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
                    boxShadow: '0 0 10px rgba(192, 192, 192, 0.5)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#000',
                  }}
                >
                  2
                </div>
                
                <div 
                  className="relative text-base font-bold truncate cursor-pointer transition-all duration-300 hover:text-silver-300"
                  onClick={() => {}}
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    letterSpacing: '0.05em',
                    color: '#C0C0C0',
                    textShadow: '0 0 10px rgba(192, 192, 192, 0.5)',
                  }}
                >
                  {podiumData[1].username || 'Player 2'}
                </div>
                <div 
                  className="text-2xl font-bold mt-1"
                  style={{
                    background: 'linear-gradient(135deg, #C0C0C0 0%, #E5E5E5 50%, #C0C0C0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 20px rgba(192, 192, 192, 0.6)',
                    filter: 'drop-shadow(0 0 8px rgba(192, 192, 192, 0.4))',
                  }}
                >
                  {formatNumber(podiumData[1].value)}
                </div>
                <div 
                  className="text-xs uppercase tracking-wider mt-1"
                  style={{
                    color: '#808080',
                    letterSpacing: '0.1em',
                    fontWeight: '500',
                  }}
                >
                  Achievement Points
                </div>
              </div>
            </div>
          )}

          {/* 1st Place - Center, Elevated with Effects */}
          {podiumData?.[0] && (
            <div className="flex flex-col items-center transform translate-y-[-20px]" style={{ zIndex: 10 }}>
              <div className="text-4xl font-thin text-yellow-400 mb-2">1</div>
              <div className="relative mb-3">
                {/* Container for all effects and image - uses explicit size */}
                <div className="relative w-40 h-40">
                  {/* Sun flare effect behind the image */}
                  <div 
                    className="absolute pointer-events-none"
                    style={{
                      width: '120px',
                      height: '120px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: -2,
                    }}
                  >
                    {/* Horizontal flare */}
                    <div 
                      className="absolute"
                      style={{
                        width: '200px',
                        height: '2px',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 230, 0, 0.8) 20%, rgba(255, 215, 0, 1) 50%, rgba(255, 230, 0, 0.8) 80%, transparent 100%)',
                        boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
                        filter: 'blur(2px)',
                      }}
                    />
                    {/* Vertical flare */}
                    <div 
                      className="absolute"
                      style={{
                        width: '2px',
                        height: '200px',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'linear-gradient(180deg, transparent 0%, rgba(255, 230, 0, 0.8) 20%, rgba(255, 215, 0, 1) 50%, rgba(255, 230, 0, 0.8) 80%, transparent 100%)',
                        boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
                        filter: 'blur(2px)',
                      }}
                    />
                    {/* Diagonal flares */}
                    <div 
                      className="absolute"
                      style={{
                        width: '150px',
                        height: '1px',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%) rotate(45deg)',
                        background: 'linear-gradient(90deg, transparent 10%, rgba(255, 200, 0, 0.6) 30%, rgba(255, 215, 0, 0.8) 50%, rgba(255, 200, 0, 0.6) 70%, transparent 90%)',
                        filter: 'blur(1px)',
                      }}
                    />
                    <div 
                      className="absolute"
                      style={{
                        width: '150px',
                        height: '1px',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                        background: 'linear-gradient(90deg, transparent 10%, rgba(255, 200, 0, 0.6) 30%, rgba(255, 215, 0, 0.8) 50%, rgba(255, 200, 0, 0.6) 70%, transparent 90%)',
                        filter: 'blur(1px)',
                      }}
                    />
                  </div>

                  {/* Particles radiating from the border of the image */}
                  <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: -1 }}>
                    {[...Array(20)].map((_, i) => {
                      const angle = (i * 360 / 20) * Math.PI / 180;
                      const radius = 78; // Start just at the edge of the 160px image
                      const startX = 80 + Math.cos(angle) * radius;
                      const startY = 80 + Math.sin(angle) * radius;
                      const delay = Math.random() * 3;
                      const duration = 2 + Math.random() * 2;
                      
                      return (
                        <div
                          key={`border-particle-${i}`}
                          className="absolute"
                          style={{
                            width: '4px',
                            height: '4px',
                            left: `${startX}px`,
                            top: `${startY}px`,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(255, 230, 0, 1) 0%, rgba(255, 180, 0, 0.8) 50%, transparent 100%)',
                            boxShadow: '0 0 8px rgba(255, 230, 0, 1), 0 0 15px rgba(255, 180, 0, 0.8)',
                            transform: 'translate(-50%, -50%)',
                            animation: `radialParticle${i} ${duration}s ease-out infinite`,
                            animationDelay: `${delay}s`,
                          }}
                        />
                      );
                    })}
                  </div>
                  
                  {/* The Mek Image with reduced glow */}
                  <div 
                    className="absolute inset-0 rounded-lg overflow-hidden bg-gray-900 cursor-pointer transition-all duration-300 hover:scale-105 hover:brightness-110" 
                    onClick={() => {}}
                    style={{ 
                      borderWidth: '3px',
                      borderStyle: 'solid',
                      borderImage: 'linear-gradient(45deg, #FFD700, #FFA500, #FFD700, #FFA500, #FFD700) 1',
                      boxShadow: `
                        0 0 20px rgba(255, 215, 0, 0.7),
                        0 0 40px rgba(255, 215, 0, 0.5),
                        inset 0 0 15px rgba(255, 215, 0, 0.15)
                      `,
                      animation: '',
                      zIndex: 1 
                    }}>
                    <MekImage
                      src={undefined}
                      assetId={"0000"}
                      size={160}
                      className="w-full h-full object-cover"
                    />
                    {/* Inner glow overlay */}
                    <div className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle at center, transparent 40%, rgba(255, 215, 0, 0.1) 70%, rgba(255, 215, 0, 0.2) 100%)',
                      }}
                    />
                  </div>
                </div>
              </div>
              <div 
                className="relative overflow-hidden mt-2"
                style={{ 
                  width: '160px',
                  background: 'linear-gradient(135deg, rgba(40, 35, 20, 0.95) 0%, rgba(20, 15, 10, 0.95) 100%)',
                  backdropFilter: 'blur(12px)',
                  clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
                  border: '2px solid',
                  borderImage: 'linear-gradient(45deg, #FFD700, #FFA500, #FFD700, #FFA500, #FFD700) 1',
                  boxShadow: '0 0 30px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.15)',
                  padding: '14px',
                  animation: 'goldPulse 3s ease-in-out infinite',
                }}
              >
                {/* Hazard stripes overlay */}
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    background: `repeating-linear-gradient(
                      -45deg,
                      transparent,
                      transparent 8px,
                      #FFD700 8px,
                      #FFD700 16px
                    )`,
                  }}
                />
                
                {/* Scan line effect */}
                <div 
                  className="absolute inset-0 pointer-events-none overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, transparent 0%, rgba(255, 215, 0, 0.1) 50%, transparent 100%)',
                    height: '40px',
                    animation: 'scanline 4s linear infinite',
                  }}
                />
                
                {/* Crown icon */}
                <div 
                  className="absolute -top-2 -right-2 w-10 h-10 flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle, #FFD700 0%, #FFA500 100%)',
                    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                    boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
                    filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))',
                  }}
                />
                
                <div 
                  className="relative text-lg font-bold truncate cursor-pointer transition-all duration-300 hover:scale-105"
                  onClick={() => {}}
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 20px rgba(255, 215, 0, 0.6)',
                    filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))',
                  }}
                >
                  {podiumData[0].username || 'Player 1'}
                </div>
                <div 
                  className="text-3xl font-bold mt-1 relative"
                  style={{
                    fontFamily: "'Rajdhani', monospace",
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FFD700 50%, #FFA500 75%, #FFD700 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    backgroundSize: '200% 100%',
                    animation: 'goldShimmer 3s linear infinite',
                    filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.6))',
                  }}
                >
                  {formatNumber(podiumData[0].value)}
                </div>
                <div 
                  className="text-xs uppercase tracking-wider mt-1"
                  style={{
                    color: '#FFA500',
                    letterSpacing: '0.15em',
                    fontWeight: '600',
                    textShadow: '0 0 8px rgba(255, 165, 0, 0.5)',
                  }}
                >
                  Achievement Points
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place - Right */}
          {podiumData?.[2] && (
            <div className="flex flex-col items-center" style={{ zIndex: 20 }}>
              <div className="text-3xl font-thin text-orange-600 mb-2">3</div>
              <div className="relative mb-3">
                <div 
                  className="w-32 h-32 rounded-lg overflow-hidden bg-gray-900 border-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:brightness-110" 
                  style={{ borderColor: '#CD7F32', boxShadow: '0 4px 20px rgba(205, 127, 50, 0.4)' }}
                  onClick={() => {}}
                >
                  <MekImage
                    src={undefined}
                    assetId={"0000"}
                    size={128}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div 
                className="relative overflow-hidden"
                style={{ 
                  width: '128px',
                  background: 'linear-gradient(135deg, rgba(35, 25, 20, 0.95) 0%, rgba(20, 15, 10, 0.95) 100%)',
                  backdropFilter: 'blur(12px)',
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                  border: '2px solid',
                  borderImage: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 50%, #CD7F32 100%) 1',
                  boxShadow: '0 4px 20px rgba(205, 127, 50, 0.3), inset 0 0 20px rgba(205, 127, 50, 0.1)',
                  padding: '12px',
                }}
              >
                {/* Rust texture overlay */}
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at 20% 30%, rgba(205, 127, 50, 0.3) 0%, transparent 40%),
                                radial-gradient(ellipse at 70% 60%, rgba(139, 69, 19, 0.2) 0%, transparent 40%),
                                radial-gradient(ellipse at 40% 80%, rgba(205, 127, 50, 0.2) 0%, transparent 40%)`,
                  }}
                />
                
                {/* Rank badge */}
                <div 
                  className="absolute -top-1 -right-1 w-8 h-8 flex items-center justify-center rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
                    boxShadow: '0 0 10px rgba(205, 127, 50, 0.5)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#FFF',
                  }}
                >
                  3
                </div>
                
                <div 
                  className="relative text-base font-bold truncate cursor-pointer transition-all duration-300 hover:text-orange-400"
                  onClick={() => {}}
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    letterSpacing: '0.05em',
                    color: '#CD7F32',
                    textShadow: '0 0 10px rgba(205, 127, 50, 0.5)',
                  }}
                >
                  {podiumData[2].username || 'Player 3'}
                </div>
                <div 
                  className="text-2xl font-bold mt-1"
                  style={{
                    background: 'linear-gradient(135deg, #CD7F32 0%, #DDA860 50%, #CD7F32 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 20px rgba(205, 127, 50, 0.6)',
                    filter: 'drop-shadow(0 0 8px rgba(205, 127, 50, 0.4))',
                  }}
                >
                  {formatNumber(podiumData[2].value)}
                </div>
                <div 
                  className="text-xs uppercase tracking-wider mt-1"
                  style={{
                    color: '#8B4513',
                    letterSpacing: '0.1em',
                    fontWeight: '500',
                  }}
                >
                  Achievement Points
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs - Sci-Fi Industrial Style */}
      <div className="flex gap-2 mb-8 justify-center flex-wrap px-4" onClick={(e) => e.preventDefault()}>
        {/* Achievement Points - Primary Button */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setSelectedCategory('achievements');
            setShowGoldSubmenu(false);
            setShowEssenceSubmenu(false);
          }}
          className={`relative group ${
            selectedCategory === 'achievements' ? 'z-20' : 'z-10'
          }`}
          style={{
            perspective: '1000px'
          }}
        >
          <div className={`
            relative px-3 py-1.5 font-semibold uppercase tracking-wide text-xs
            transition-all duration-300 transform
            ${selectedCategory === 'achievements' 
              ? 'mek-button-primary scale-105' 
              : 'mek-button-secondary hover:scale-105'
            }
          `}
          style={{
            clipPath: selectedCategory === 'achievements' 
              ? 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)' 
              : 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)',
            background: selectedCategory === 'achievements'
              ? 'linear-gradient(135deg, #fab617 0%, #ffd700 50%, #fab617 100%)'
              : 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(20, 20, 20, 0.8) 100%)',
            boxShadow: selectedCategory === 'achievements'
              ? '0 0 30px rgba(250, 182, 23, 0.6), inset 0 0 20px rgba(255, 215, 0, 0.3)'
              : '0 0 15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            border: selectedCategory === 'achievements'
              ? '2px solid #ffd700'
              : '1px solid rgba(250, 182, 23, 0.3)',
          }}
          >
            {selectedCategory === 'achievements' && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 animate-shimmer"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                    width: '200%',
                  }}
                />
              </div>
            )}
            <span className={`relative ${
              selectedCategory === 'achievements' 
                ? 'text-black' 
                : 'text-yellow-400 group-hover:text-yellow-300'
            }`}
            style={{
              textShadow: selectedCategory === 'achievements'
                ? '0 0 10px rgba(0, 0, 0, 0.3)'
                : '0 0 10px rgba(250, 182, 23, 0.5)',
              fontSize: '0.675rem',
            }}
            >
              Achievement Points
            </span>
            {selectedCategory === 'achievements' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"
                style={{
                  boxShadow: '0 0 10px rgba(74, 222, 128, 0.8)',
                }}
              />
            )}
          </div>
        </div>
        
        {/* Total Gold with Dropdown */}
        <div className="relative group">
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              setSelectedCategory('gold');
              setShowGoldSubmenu(!showGoldSubmenu);
              setShowEssenceSubmenu(false);
            }}
            className={`
              relative px-3 py-1.5 font-semibold uppercase tracking-wide text-xs
              transition-all duration-300 transform
              ${selectedCategory === 'gold' 
                ? 'mek-button-primary scale-105' 
                : 'mek-button-secondary hover:scale-105'
              }
            `}
            style={{
              clipPath: selectedCategory === 'gold' 
                ? 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)' 
                : 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)',
              background: selectedCategory === 'gold'
                ? 'linear-gradient(135deg, #fab617 0%, #ffd700 50%, #fab617 100%)'
                : 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(20, 20, 20, 0.8) 100%)',
              boxShadow: selectedCategory === 'gold'
                ? '0 0 30px rgba(250, 182, 23, 0.6), inset 0 0 20px rgba(255, 215, 0, 0.3)'
                : '0 0 15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              border: selectedCategory === 'gold'
                ? '2px solid #ffd700'
                : '1px solid rgba(250, 182, 23, 0.3)',
            }}
          >
            {selectedCategory === 'gold' && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 animate-shimmer"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                    width: '200%',
                  }}
                />
              </div>
            )}
            <span className={`relative ${
              selectedCategory === 'gold' 
                ? 'text-black' 
                : 'text-yellow-400 group-hover:text-yellow-300'
            }`}
            style={{
              textShadow: selectedCategory === 'gold'
                ? '0 0 10px rgba(0, 0, 0, 0.3)'
                : '0 0 10px rgba(250, 182, 23, 0.5)',
              fontSize: '0.675rem',
            }}
            >
              {selectedCategory === 'gold' ? (goldView === 'total' ? 'Total Gold' : 'Gold/hr') : 'Total Gold'} 
              {selectedCategory === 'gold' && (
                <span className="ml-2 inline-block transition-transform duration-200"
                  style={{ transform: showGoldSubmenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >▼</span>
              )}
            </span>
          </div>
          {showGoldSubmenu && selectedCategory === 'gold' && (
            <div className="absolute top-full mt-2 left-0 mek-card-industrial mek-border-sharp-gold rounded-lg overflow-hidden z-30"
              style={{
                minWidth: '150px',
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setGoldView('total');
                  setShowGoldSubmenu(false);
                }}
                className={`block w-full px-4 py-3 text-left transition-all font-medium uppercase tracking-wider text-sm ${
                  goldView === 'total' 
                    ? 'bg-yellow-400/20 text-yellow-400 mek-text-shadow' 
                    : 'text-gray-400 hover:bg-yellow-400/10 hover:text-yellow-300'
                }`}
              >
                Total
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setGoldView('perHour');
                  setShowGoldSubmenu(false);
                }}
                className={`block w-full px-4 py-3 text-left transition-all font-medium uppercase tracking-wider text-sm ${
                  goldView === 'perHour' 
                    ? 'bg-yellow-400/20 text-yellow-400 mek-text-shadow' 
                    : 'text-gray-400 hover:bg-yellow-400/10 hover:text-yellow-300'
                }`}
              >
                Gold/hr
              </div>
            </div>
          )}
        </div>
        
        {/* Total Essence with Dropdown */}
        <div className="relative group">
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              setSelectedCategory('essence');
              setShowEssenceSubmenu(!showEssenceSubmenu);
              setShowGoldSubmenu(false);
            }}
            className={`
              relative px-3 py-1.5 font-semibold uppercase tracking-wide text-xs
              transition-all duration-300 transform
              ${selectedCategory === 'essence' 
                ? 'mek-button-primary scale-105' 
                : 'mek-button-secondary hover:scale-105'
              }
            `}
            style={{
              clipPath: selectedCategory === 'essence' 
                ? 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)' 
                : 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)',
              background: selectedCategory === 'essence'
                ? 'linear-gradient(135deg, #fab617 0%, #ffd700 50%, #fab617 100%)'
                : 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(20, 20, 20, 0.8) 100%)',
              boxShadow: selectedCategory === 'essence'
                ? '0 0 30px rgba(250, 182, 23, 0.6), inset 0 0 20px rgba(255, 215, 0, 0.3)'
                : '0 0 15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              border: selectedCategory === 'essence'
                ? '2px solid #ffd700'
                : '1px solid rgba(250, 182, 23, 0.3)',
            }}
          >
            {selectedCategory === 'essence' && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 animate-shimmer"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                    width: '200%',
                  }}
                />
              </div>
            )}
            <span className={`relative ${
              selectedCategory === 'essence' 
                ? 'text-black' 
                : 'text-yellow-400 group-hover:text-yellow-300'
            }`}
            style={{
              textShadow: selectedCategory === 'essence'
                ? '0 0 10px rgba(0, 0, 0, 0.3)'
                : '0 0 10px rgba(250, 182, 23, 0.5)',
              fontSize: '0.675rem',
            }}
            >
              {selectedCategory === 'essence' ? (essenceView === 'total' ? 'Total Essence' : 'Essence/hr') : 'Total Essence'} 
              {selectedCategory === 'essence' && (
                <span className="ml-2 inline-block transition-transform duration-200"
                  style={{ transform: showEssenceSubmenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >▼</span>
              )}
            </span>
          </div>
          {showEssenceSubmenu && selectedCategory === 'essence' && (
            <div className="absolute top-full mt-2 left-0 mek-card-industrial mek-border-sharp-gold rounded-lg overflow-hidden z-30"
              style={{
                minWidth: '150px',
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setEssenceView('total');
                  setShowEssenceSubmenu(false);
                }}
                className={`block w-full px-4 py-3 text-left transition-all font-medium uppercase tracking-wider text-sm ${
                  essenceView === 'total' 
                    ? 'bg-yellow-400/20 text-yellow-400 mek-text-shadow' 
                    : 'text-gray-400 hover:bg-yellow-400/10 hover:text-yellow-300'
                }`}
              >
                Total
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setEssenceView('perHour');
                  setShowEssenceSubmenu(false);
                }}
                className={`block w-full px-4 py-3 text-left transition-all font-medium uppercase tracking-wider text-sm ${
                  essenceView === 'perHour' 
                    ? 'bg-yellow-400/20 text-yellow-400 mek-text-shadow' 
                    : 'text-gray-400 hover:bg-yellow-400/10 hover:text-yellow-300'
                }`}
              >
                Essence/hr
              </div>
            </div>
          )}
        </div>
        
        {/* Mek Count Button */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setSelectedCategory('meks');
            setShowGoldSubmenu(false);
            setShowEssenceSubmenu(false);
          }}
          className={`relative group ${
            selectedCategory === 'meks' ? 'z-20' : 'z-10'
          }`}
        >
          <div className={`
            relative px-3 py-1.5 font-semibold uppercase tracking-wide text-xs
            transition-all duration-300 transform
            ${selectedCategory === 'meks' 
              ? 'mek-button-primary scale-105' 
              : 'mek-button-secondary hover:scale-105'
            }
          `}
          style={{
            clipPath: selectedCategory === 'meks' 
              ? 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)' 
              : 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)',
            background: selectedCategory === 'meks'
              ? 'linear-gradient(135deg, #fab617 0%, #ffd700 50%, #fab617 100%)'
              : 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(20, 20, 20, 0.8) 100%)',
            boxShadow: selectedCategory === 'meks'
              ? '0 0 30px rgba(250, 182, 23, 0.6), inset 0 0 20px rgba(255, 215, 0, 0.3)'
              : '0 0 15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            border: selectedCategory === 'meks'
              ? '2px solid #ffd700'
              : '1px solid rgba(250, 182, 23, 0.3)',
          }}
          >
            {selectedCategory === 'meks' && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 animate-shimmer"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                    width: '200%',
                  }}
                />
              </div>
            )}
            <span className={`relative ${
              selectedCategory === 'meks' 
                ? 'text-black' 
                : 'text-yellow-400 group-hover:text-yellow-300'
            }`}
            style={{
              textShadow: selectedCategory === 'meks'
                ? '0 0 10px rgba(0, 0, 0, 0.3)'
                : '0 0 10px rgba(250, 182, 23, 0.5)',
              fontSize: '0.675rem',
            }}
            >
              Mek Count
            </span>
          </div>
        </div>
        
        {/* Top Meks Button */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setSelectedCategory('topMeks');
            setShowGoldSubmenu(false);
            setShowEssenceSubmenu(false);
          }}
          className={`relative group ${
            selectedCategory === 'topMeks' ? 'z-20' : 'z-10'
          }`}
        >
          <div className={`
            relative px-3 py-1.5 font-semibold uppercase tracking-wide text-xs
            transition-all duration-300 transform
            ${selectedCategory === 'topMeks' 
              ? 'mek-button-primary scale-105' 
              : 'mek-button-secondary hover:scale-105'
            }
          `}
          style={{
            clipPath: selectedCategory === 'topMeks' 
              ? 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)' 
              : 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)',
            background: selectedCategory === 'topMeks'
              ? 'linear-gradient(135deg, #fab617 0%, #ffd700 50%, #fab617 100%)'
              : 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(20, 20, 20, 0.8) 100%)',
            boxShadow: selectedCategory === 'topMeks'
              ? '0 0 30px rgba(250, 182, 23, 0.6), inset 0 0 20px rgba(255, 215, 0, 0.3)'
              : '0 0 15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            border: selectedCategory === 'topMeks'
              ? '2px solid #ffd700'
              : '1px solid rgba(250, 182, 23, 0.3)',
          }}
          >
            {selectedCategory === 'topMeks' && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 animate-shimmer"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                    width: '200%',
                  }}
                />
              </div>
            )}
            <span className={`relative ${
              selectedCategory === 'topMeks' 
                ? 'text-black' 
                : 'text-yellow-400 group-hover:text-yellow-300'
            }`}
            style={{
              textShadow: selectedCategory === 'topMeks'
                ? '0 0 10px rgba(0, 0, 0, 0.3)'
                : '0 0 10px rgba(250, 182, 23, 0.5)',
              fontSize: '0.675rem',
            }}
            >
              Top Meks
            </span>
          </div>
        </div>
      </div>

      {/* Top 10 Table */}
      <div className="max-w-5xl mx-auto">
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(40, 40, 40, 0.5) 0%, rgba(30, 30, 30, 0.5) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 204, 0, 0.2)',
          }}
        >
          <table className="w-full">
            <thead>
              <tr className="text-sm" style={{ borderBottom: '1px solid rgba(255, 204, 0, 0.3)' }}>
                <th className="text-left p-4 text-yellow-400 font-medium w-16">Rank</th>
                {currentCategoryData.columns?.map((col, i) => {
                  const isClickable = selectedCategory === 'topMeks' && currentCategoryData.clickableColumns?.includes(i);
                  const clickableIndex = currentCategoryData.clickableColumns?.indexOf(i);
                  const sortValue = isClickable && clickableIndex !== undefined ? currentCategoryData.sortValues?.[clickableIndex] : null;
                  const isActive = sortValue === topMeksSortBy;
                  
                  return (
                    <th 
                      key={i} 
                      className={`p-4 font-medium ${
                        i === 0 || (selectedCategory === 'achievements' && i === 1) ? 'text-left' : 'text-center'
                      } ${
                        isClickable ? 'cursor-pointer hover:text-yellow-300 hover:underline transition-all' : ''
                      } ${
                        isActive ? 'text-yellow-300 underline' : 'text-yellow-400'
                      }`}
                      onClick={isClickable && sortValue ? () => setTopMeksSortBy(sortValue as TopMeksSortBy) : undefined}
                    >
                      <div className={`flex items-center ${i === 0 ? 'justify-start' : 'justify-center'} gap-1`}>
                        {col}
                        {isClickable && (
                          <span className={`text-xs transition-transform ${isActive ? 'rotate-0' : '-rotate-90'}`}>
                            ▼
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayLeaderboardData?.slice(0, 10).map((entry, index) => {
                const isCurrentUser = entry.walletAddress === currentWallet;
                
                return (
                  <tr
                    key={index}
                    className="transition-all duration-200 hover:bg-white/5"
                    style={{
                      background: isCurrentUser ? 'rgba(250, 182, 23, 0.1)' : 'transparent',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    }}
                  >
                    <td className="p-4 w-16">
                      <div className="flex items-center gap-1">
                        <span className="font-bold" style={{ color: getRankColor(entry.rank) }}>
                          {entry.rank}
                        </span>
                        {entry.rank <= 3 && <span className="text-sm">{getRankIcon(entry.rank)}</span>}
                      </div>
                    </td>
                    {selectedCategory === 'achievements' ? (
                      <>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800">
                              <MekImage
                                src={undefined}
                                assetId={"0000"}
                                size={40}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className={`font-medium ${isCurrentUser ? 'text-yellow-400' : 'text-white'}`}>
                                {entry.username || 'Anonymous'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {entry.walletAddress?.slice(0, 6)}...
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center text-gray-300">
                          {formatNumber(entry.value)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4">
                          {currentCategoryData.isMekList ? (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded overflow-hidden bg-gray-800">
                                <MekImage
                                  src={undefined}
                                  assetId={entry.metadata?.topMek?.assetId || "0000"}
                                  size={40}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className={`font-medium ${isCurrentUser ? 'text-yellow-400' : 'text-white'}`}>
                                  {entry.metadata?.topMek?.assetName || 'Unknown Mek'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Level {entry.metadata?.topMek?.level || 1}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                                <MekImage
                                  src={undefined}
                                  assetId={currentCategoryData.showHighestMek && entry.metadata?.mekDetails?.topMekAssetId ? 
                                    entry.metadata.mekDetails.topMekAssetId : "0000"}
                                  size={40}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className={`font-medium ${isCurrentUser ? 'text-yellow-400' : 'text-white'}`}>
                                  {entry.username || 'Anonymous'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {entry.walletAddress?.slice(0, 6)}...
                                </span>
                              </div>
                            </div>
                          )}
                        </td>
                        {currentCategoryData.renderRow && currentCategoryData.renderRow(entry).map((value, i) => (
                          value !== null && (
                            <td key={i} className="p-4 text-center text-gray-300">
                              {value}
                            </td>
                          )
                        ))}
                      </>
                    )}
                  </tr>
                );
              })}
              
              {/* Show 11th row as user's position if not in top 10 */}
              {!isUserInTop10 && mockUserRank && mockUserRank > 10 && mockCurrentUser && displayLeaderboardData && displayLeaderboardData.length >= 10 && (
                <>
                  {/* Separator row */}
                  <tr>
                    <td colSpan={currentCategoryData.columns.length + 1} className="p-2">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex-1 h-px bg-gray-700"></div>
                        <span className="text-xs text-gray-500 px-2">Your Rank</span>
                        <div className="flex-1 h-px bg-gray-700"></div>
                      </div>
                    </td>
                  </tr>
                  {/* User's rank row */}
                  <tr
                    className="transition-all duration-200"
                    style={{
                      background: 'rgba(250, 182, 23, 0.15)',
                      border: '1px solid rgba(250, 182, 23, 0.3)',
                    }}
                  >
                    <td className="p-4 w-16">
                      <span className="font-bold text-yellow-400">
                        {mockUserRank}
                      </span>
                    </td>
                    {selectedCategory === 'achievements' ? (
                      <>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800">
                              <MekImage
                                src={undefined}
                                assetId={"0000"}
                                size={40}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-yellow-400">
                                {mockCurrentUser.username || 'You'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {mockCurrentUser.walletAddress?.slice(0, 6)}...
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center text-gray-300">
                          {(() => {
                            // Mock user data
                            const userEntry = null;
                            return userEntry ? formatNumber(userEntry.value) : '0';
                          })()}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800">
                              <MekImage
                                src={undefined}
                                assetId={"0000"}
                                size={40}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-yellow-400">
                                {mockCurrentUser.username || 'You'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {mockCurrentUser.walletAddress?.slice(0, 6)}...
                              </span>
                            </div>
                          </div>
                        </td>
                        {/* Show actual user data if available */}
                        {(() => {
                          // Mock user data
                          const userEntry = null;
                          if (userEntry && currentCategoryData.renderRow) {
                            return currentCategoryData.renderRow(userEntry).map((value, i) => (
                              value !== null && (
                                <td key={i} className="p-4 text-center text-gray-300">
                                  {value}
                                </td>
                              )
                            ));
                          }
                          return (
                            <td colSpan={currentCategoryData.columns.length - 1} className="p-4 text-center text-gray-400">
                              Loading your stats...
                            </td>
                          );
                        })()}
                      </>
                    )}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}