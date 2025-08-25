"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import MekImage from "../../../components/MekImage";
import { useState, useEffect } from "react";
import BackgroundEffects from "@/components/BackgroundEffects";

export default function MekProfilePage() {
  const params = useParams();
  const mekId = params.id as string;
  
  const mek = useQuery(api.meks.getMekByAssetId, { assetId: mekId });
  const [isEmployed, setIsEmployed] = useState(false);
  const [currentGoldForOwner, setCurrentGoldForOwner] = useState(12847.582);
  const [allTimeGold, setAllTimeGold] = useState(458392.891);
  
  // Example gold rate: 20 gold/hour = 0.00556 gold/second
  const goldPerSecond = 20 / 3600;
  
  useEffect(() => {
    if (mek) {
      setIsEmployed(mek.isEmployee || false);
    }
  }, [mek]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGoldForOwner(prev => prev + goldPerSecond);
      setAllTimeGold(prev => prev + goldPerSecond);
    }, 100); // Update every 100ms for smooth counting
    return () => clearInterval(interval);
  }, []);
  
  const equipmentSlots = [
    { id: "weapon", name: "Plasma Rifle MK-III", itemImage: "/item-images/item_001.png", filled: true },
    { id: "armor", name: "Titanium Plating", itemImage: "/item-images/item_002.png", filled: true },
    { id: "accessory", name: null, itemImage: null, filled: false }
  ];
  
  const talentNodes = [
    { id: 1, name: "Gold Rush", level: 1, unlocked: true, buff: "+2.5 gold/hr" },
    { id: 2, name: "Efficient Worker", level: 2, unlocked: true, buff: "+5% gold rate" },
    { id: 3, name: "Banker", level: 3, unlocked: true, buff: "+1% bank interest" },
    { id: 4, name: "Essence Master", level: 4, unlocked: true, buff: "+1.4 global essence" },
    { id: 5, name: "Speed Demon", level: 5, unlocked: false, buff: "+15% craft speed" }
  ];
  
  const activeBuffs = talentNodes.filter(node => node.unlocked);
  
  if (!mek) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-mono text-yellow-400 mb-2">LOADING</div>
          <div className="w-48 h-1 bg-gray-800 mx-auto">
            <div className="h-full bg-yellow-400 animate-pulse" style={{ width: "60%" }}></div>
          </div>
        </div>
      </div>
    );
  }
  
  const getRarityColor = (tier: string | undefined) => {
    switch(tier) {
      case "Legendary": return "text-orange-400";
      case "Epic": return "text-purple-400";
      case "Rare": return "text-blue-400";
      case "Uncommon": return "text-green-400";
      default: return "text-gray-400";
    }
  };
  
  const isOwner = true; // You'd check if current user owns this mek
  
  return (
    <div className="min-h-screen bg-black text-white">
      <BackgroundEffects />
      
      {/* Minimal Header */}
      <div className="border-b border-gray-900">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/profile" className="text-gray-500 hover:text-yellow-400 transition-colors text-sm font-mono">
              ← BACK
            </Link>
            <div className="text-xs font-mono text-gray-600">
              MEK PROFILE / {mek.assetId}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Top Section */}
        <div className="grid grid-cols-12 gap-6 mb-12">
          
          {/* Left Panel - Stats & Modifiers */}
          <div className="col-span-3 space-y-4">
            {/* Designation & Details */}
            <div className="relative border border-gray-800/50 bg-gray-950/30 backdrop-blur-[2px] p-4 overflow-hidden glass-panel">
              {/* Subtle texture overlay */}
              <div className="absolute inset-0 opacity-[0.015]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg%3E%3Cpath d='M0 50 L100 50' stroke='white' stroke-width='0.5' opacity='0.3'/%3E%3Cpath d='M20 0 L20 100' stroke='white' stroke-width='0.3' opacity='0.2'/%3E%3Cpath d='M60 0 L60 100' stroke='white' stroke-width='0.3' opacity='0.2'/%3E%3Cpath d='M0 20 L100 20' stroke='white' stroke-width='0.3' opacity='0.2'/%3E%3Cpath d='M0 80 L100 80' stroke='white' stroke-width='0.3' opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '100px 100px'
              }} />
              <div className="relative text-xs font-mono text-gray-500 mb-1">DESIGNATION</div>
              <div className="text-lg font-bold text-yellow-400 mb-4">
                {mek.assetName || `MEK-${mek.assetId}`}
              </div>
            </div>
            
            <div className="relative border border-gray-800/50 bg-gray-950/30 backdrop-blur-[2px] p-4 overflow-hidden">
              <div className="text-xs font-mono text-gray-500 mb-1">RANK</div>
              <div className="text-2xl font-bold text-white">
                {mek.rarityRank || "N/A"}
              </div>
            </div>
            
            <div className="relative border border-gray-800/50 bg-gray-950/30 backdrop-blur-[2px] p-4 overflow-hidden">
              <div className="text-xs font-mono text-gray-500 mb-1">OPERATOR</div>
              <div className="text-xs font-mono text-gray-400 break-all">
                {mek.owner ? `${mek.owner.slice(0, 8)}...${mek.owner.slice(-6)}` : "UNASSIGNED"}
              </div>
            </div>
            
            {/* Employment Status */}
            <div className="relative border border-gray-800/50 bg-gray-950/30 backdrop-blur-[2px] p-4 overflow-hidden">
              {/* Subtle texture overlay */}
              <div className="absolute inset-0 opacity-[0.015]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg%3E%3Cpath d='M10 10 L90 90' stroke='white' stroke-width='0.2' opacity='0.3'/%3E%3Cpath d='M90 10 L10 90' stroke='white' stroke-width='0.2' opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '100px 100px'
              }} />
              <div className="text-xs font-mono text-gray-500 mb-2">EMPLOYMENT</div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${isEmployed ? 'text-green-400' : 'text-gray-500'}`}>
                  {isEmployed ? 'ACTIVE' : 'IDLE'}
                </span>
                {isOwner && (
                  <button
                    onClick={() => setIsEmployed(!isEmployed)}
                    className={`
                      relative w-12 h-6 rounded-full transition-colors duration-200
                      ${isEmployed ? 'bg-green-500/30' : 'bg-gray-800'}
                    `}
                  >
                    <div className={`
                      absolute top-1 w-4 h-4 rounded-full transition-transform duration-200
                      ${isEmployed 
                        ? 'translate-x-7 bg-green-400' 
                        : 'translate-x-1 bg-gray-600'
                      }
                    `} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Active Modifiers */}
            <div className="relative border border-gray-800/50 bg-gray-950/30 backdrop-blur-[2px] p-4 overflow-hidden">
              {/* Subtle texture overlay */}
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg%3E%3Ccircle cx='60' cy='60' r='30' fill='none' stroke='white' stroke-width='0.3' opacity='0.2'/%3E%3Ccircle cx='20' cy='20' r='10' fill='none' stroke='white' stroke-width='0.2' opacity='0.15'/%3E%3Ccircle cx='100' cy='100' r='10' fill='none' stroke='white' stroke-width='0.2' opacity='0.15'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '120px 120px'
              }} />
              <div className="text-xs font-mono text-gray-500 mb-3">ACTIVE MODIFIERS</div>
              <div className="space-y-2">
                {activeBuffs.map((buff, index) => (
                  <div key={index} className="text-xs">
                    <span className="text-green-400 font-mono">{buff.buff}</span>
                  </div>
                ))}
                {activeBuffs.length === 0 && (
                  <div className="text-xs text-gray-600 italic">NO ACTIVE MODIFIERS</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Center - Mek Display with Nebula Effect */}
          <div className="col-span-6">
            <div className="relative">
              {/* Nebula Glow Effect */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  {/* Animated nebula layers */}
                  <div className="absolute w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 animate-pulse">
                    <div className="absolute inset-0 bg-gradient-radial from-purple-600/10 via-blue-600/5 to-transparent rounded-full blur-3xl" />
                  </div>
                  <div className="absolute w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '0.5s' }}>
                    <div className="absolute inset-0 bg-gradient-radial from-cyan-500/10 via-purple-500/5 to-transparent rounded-full blur-2xl" />
                  </div>
                  <div className="absolute w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}>
                    <div className="absolute inset-0 bg-gradient-radial from-yellow-500/10 via-orange-500/5 to-transparent rounded-full blur-xl" />
                  </div>
                </div>
              </div>
              
              
              {/* Level Badge - Bottom Right */}
              <div className="absolute bottom-4 right-4 z-10">
                <div className="bg-black/80 border border-yellow-400/30 px-3 py-1">
                  <span className="text-xs font-mono text-gray-500">LVL </span>
                  <span className="text-lg font-bold text-yellow-400">{mek.level || 1}</span>
                </div>
              </div>
              
              {/* Mek Image */}
              <div className="relative border border-gray-800/50 bg-gradient-to-b from-gray-950/40 to-black/40 backdrop-blur-[2px] p-8 overflow-hidden">
                {/* Very subtle scratch texture */}
                <div className="absolute inset-0 opacity-[0.008]" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg%3E%3Cpath d='M20 20 L180 180' stroke='white' stroke-width='0.08' opacity='0.3'/%3E%3Cpath d='M180 20 L20 180' stroke='white' stroke-width='0.08' opacity='0.25'/%3E%3Cpath d='M100 0 L100 200' stroke='white' stroke-width='0.05' opacity='0.2'/%3E%3Cpath d='M0 100 L200 100' stroke='white' stroke-width='0.05' opacity='0.2'/%3E%3Cpath d='M50 0 L50 200' stroke='white' stroke-width='0.03' opacity='0.15'/%3E%3Cpath d='M150 0 L150 200' stroke='white' stroke-width='0.03' opacity='0.15'/%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '200px 200px'
                }} />
                <MekImage
                  src={mek.iconUrl}
                  headVariation={mek.headVariation}
                  bodyVariation={mek.bodyVariation}
                  assetId={mek.assetId}
                  size={500}
                  className="w-full aspect-square relative z-10"
                />
              </div>
            </div>
            
            {/* Equipment Slots - Grid Below Mek */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {equipmentSlots.map((slot, index) => (
                <div key={slot.id} className="relative">
                  <div className={`
                    border bg-gray-950/50 backdrop-blur-[2px] p-3 transition-all
                    ${slot.filled 
                      ? "border-yellow-400/30" 
                      : "border-gray-800/50 border-dashed"
                    }
                  `}>
                    {/* Item Display Area */}
                    <div className="aspect-square bg-black/30 border border-gray-800/30 mb-2 p-2">
                      {slot.filled && slot.itemImage ? (
                        <img 
                          src={slot.itemImage}
                          alt={slot.name || ''}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/item-images/placeholder.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-2xl text-gray-700">+</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Item Name Below */}
                    <div className="text-center">
                      {slot.filled && slot.name ? (
                        <div className="text-xs font-mono text-yellow-400 truncate">
                          {slot.name}
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-gray-600">
                          EMPTY
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Panel - Gold Stats */}
          <div className="col-span-3 space-y-4">
            <div className="relative border border-gray-800/50 bg-gray-950/30 backdrop-blur-[2px] p-4 overflow-hidden glass-panel">
              {/* Subtle texture overlay */}
              <div className="absolute inset-0 opacity-[0.015]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg%3E%3Cpath d='M0 30 L100 30' stroke='white' stroke-width='0.3' opacity='0.2'/%3E%3Cpath d='M0 70 L100 70' stroke='white' stroke-width='0.3' opacity='0.2'/%3E%3Cpath d='M30 0 L30 100' stroke='white' stroke-width='0.2' opacity='0.15'/%3E%3Cpath d='M70 0 L70 100' stroke='white' stroke-width='0.2' opacity='0.15'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '100px 100px'
              }} />
              <div className="text-xs font-mono text-gray-500 mb-2">GOLD GENERATION</div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-600">BASE</div>
                  <div className="text-lg font-mono text-gray-400">20.0/hr</div>
                </div>
                <div className="h-px bg-gray-800"></div>
                <div>
                  <div className="text-xs text-green-400">EFFECTIVE</div>
                  <div className="text-xl font-mono font-bold text-green-400">23.5/hr</div>
                </div>
              </div>
            </div>
            
            <div className="relative border border-gray-800/50 bg-gray-950/30 backdrop-blur-[2px] p-4 overflow-hidden">
              {/* Subtle texture overlay */}
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg%3E%3Cpath d='M5 5 L75 75' stroke='white' stroke-width='0.15' opacity='0.2'/%3E%3Cpath d='M75 5 L5 75' stroke='white' stroke-width='0.15' opacity='0.15'/%3E%3Cpath d='M40 0 L40 80' stroke='white' stroke-width='0.1' opacity='0.1'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '80px 80px'
              }} />
              <div className="text-xs font-mono text-gray-500 mb-2">GOLD PRODUCED</div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-600">CURRENT OWNER</div>
                  <div className="text-lg font-mono text-yellow-400">
                    {Math.floor(currentGoldForOwner).toLocaleString('en-US')}
                    <span className="text-sm text-yellow-400/70">.</span>
                    <span className="text-sm text-yellow-400/70">
                      {(currentGoldForOwner % 1).toFixed(3).substring(2)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">ALL TIME</div>
                  <div className="text-lg font-mono text-yellow-500">
                    {Math.floor(allTimeGold).toLocaleString('en-US')}
                    <span className="text-sm text-yellow-500/70">.</span>
                    <span className="text-sm text-yellow-500/70">
                      {(allTimeGold % 1).toFixed(3).substring(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative border border-gray-800/50 bg-gray-950/30 backdrop-blur-[2px] p-4 overflow-hidden">
              {/* Subtle texture overlay */}
              <div className="absolute inset-0 opacity-[0.018]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='150' height='150' xmlns='http://www.w3.org/2000/svg'%3E%3Cg%3E%3Cpath d='M0 0 L150 150' stroke='white' stroke-width='0.1' opacity='0.2'/%3E%3Cpath d='M0 50 L100 150' stroke='white' stroke-width='0.1' opacity='0.15'/%3E%3Cpath d='M50 0 L150 100' stroke='white' stroke-width='0.1' opacity='0.15'/%3E%3Ccircle cx='75' cy='75' r='40' fill='none' stroke='white' stroke-width='0.1' opacity='0.1'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '150px 150px'
              }} />
              <div className="text-xs font-mono text-gray-500 mb-2">STATISTICS</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">BATTLES</span>
                  <span className="text-gray-400 font-mono">{mek.wins || 0}W / {mek.losses || 0}L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">WIN RATE</span>
                  <span className="text-gray-400 font-mono">
                    {mek.wins && mek.losses 
                      ? `${((mek.wins / (mek.wins + mek.losses)) * 100).toFixed(1)}%`
                      : "N/A"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">POWER</span>
                  <span className="text-gray-400 font-mono">{mek.powerScore || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add nebula animation styles */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1) translate(-50%, -50%);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1) translate(-50%, -50%);
          }
        }
        
        @keyframes glassSheen {
          0% {
            transform: translateX(-200%) translateY(-200%) rotate(45deg);
          }
          100% {
            transform: translateX(200%) translateY(200%) rotate(45deg);
          }
        }
        
        .animate-pulse {
          animation: pulse 4s ease-in-out infinite;
        }
        
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
        
        .glass-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(255, 255, 255, 0.02) 45%,
            rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0.02) 55%,
            transparent 60%
          );
          animation: glassSheen 15s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}