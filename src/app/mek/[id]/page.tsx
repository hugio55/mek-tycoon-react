"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MekImage from "../../../components/MekImage";
import { useState, useEffect, useRef } from "react";
import BackgroundEffects from "@/components/BackgroundEffects";
import { useClickSound } from "@/lib/useClickSound";
import MekTalentTree from "@/components/MekTalentTree";

// Helper function for animating numbers
const AnimatedNumber = ({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [scale, setScale] = useState(1);
  const prevValueRef = useRef(value);
  
  useEffect(() => {
    if (value !== prevValueRef.current) {
      // Animate from previous to new value
      const startValue = prevValueRef.current;
      const endValue = value;
      const duration = 1000; // 1 second animation
      const startTime = Date.now();
      
      // Scale up animation
      setScale(1.3);
      setTimeout(() => setScale(1), 300);
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (endValue - startValue) * easeOutQuart;
        
        setDisplayValue(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          prevValueRef.current = value;
        }
      };
      
      animate();
    } else {
      setDisplayValue(value);
    }
  }, [value]);
  
  return (
    <span style={{ 
      transform: `scale(${scale})`, 
      transition: 'transform 0.3s ease',
      display: 'inline-block'
    }}>
      {prefix}{displayValue.toFixed(1)}{suffix}
    </span>
  );
};

export default function MekProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const playClickSound = useClickSound();
  const mekId = params.id as string;
  
  // Get equip params from URL
  const equipType = searchParams.get('equip') as 'heads' | 'bodies' | 'traits' | null;
  const equipItem = searchParams.get('item');
  
  const mekFromDb = useQuery(api.meks.getMekByAssetId, { assetId: mekId });
  const [isEmployed, setIsEmployed] = useState(false);
  const [currentGoldForOwner, setCurrentGoldForOwner] = useState(12847.582);
  const [allTimeGold, setAllTimeGold] = useState(458392.891);
  const [showTooltip, setShowTooltip] = useState(false);
  const [equipmentSlots, setEquipmentSlots] = useState([
    { 
      id: "head", 
      name: null as string | null,
      variation: null as string | null, 
      type: "heads" as const,
      filled: false,
      stats: { goldRate: 0, bankInterest: 0, craftSpeed: 0 }
    },
    { 
      id: "body", 
      name: "Chrome Body",
      variation: "chrome", 
      type: "bodies" as const,
      filled: true,
      stats: { goldRate: 2.5, bankInterest: 0.1, craftSpeed: 5 }
    },
    { 
      id: "trait", 
      name: "Blasters", 
      variation: "blasters",
      type: "traits" as const,
      filled: true,
      stats: { goldRate: 1.5, bankInterest: 0.05, craftSpeed: 10 }
    }
  ]);
  const [showParticles, setShowParticles] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [unequipMessage, setUnequipMessage] = useState<string | null>(null);
  const [baseGoldRate, setBaseGoldRate] = useState(20.0);
  
  // Calculate effective gold rate based on equipment
  const effectiveGoldRate = baseGoldRate + equipmentSlots.reduce((sum, slot) => sum + (slot.filled ? slot.stats.goldRate : 0), 0);
  
  // Create demo mek data if not found in database
  const demoMeks: Record<string, any> = {
    "1234": { assetId: "1234", assetName: "Demo Mek #1234", level: 5, goldRate: 20.0, isEmployee: true, headVariation: "000-000-000", bodyVariation: "000-000-000", owner: "demo_wallet_123" },
    "2468": { assetId: "2468", assetName: "Demo Mek #2468", level: 3, goldRate: 18.2, isEmployee: false, headVariation: "000-000-000", bodyVariation: "000-000-000", owner: "demo_wallet_123" },
    "3691": { assetId: "3691", assetName: "Demo Mek #3691", level: 7, goldRate: 22.1, isEmployee: true, headVariation: "000-000-000", bodyVariation: "000-000-000", owner: "demo_wallet_123" },
    "0013": { assetId: "0013", assetName: "Demo Mek #0013", level: 10, goldRate: 25.0, isEmployee: true, headVariation: "000-000-000", bodyVariation: "000-000-000", owner: "demo_wallet_123" },
  };
  
  // Use database mek or fall back to demo mek
  const mek = mekFromDb || demoMeks[mekId];
  
  // Show tooltip if we have equip params
  useEffect(() => {
    if (equipType && equipItem) {
      setShowTooltip(true);
      // Hide tooltip after 3 seconds
      setTimeout(() => setShowTooltip(false), 3000);
    }
  }, [equipType, equipItem]);
  
  // Update base gold rate from mek data
  useEffect(() => {
    if (mek) {
      setIsEmployed(mek.isEmployee || false);
      setBaseGoldRate(mek.goldRate || 20.0);
    }
  }, [mek]);
  
  // Gold generation animation
  const goldPerSecond = effectiveGoldRate / 3600;
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGoldForOwner(prev => prev + goldPerSecond);
      setAllTimeGold(prev => prev + goldPerSecond);
    }, 100);
    return () => clearInterval(interval);
  }, [goldPerSecond]);
  
  const handleEquipItem = (slotType: string) => {
    if (equipItem && equipType === slotType) {
      playClickSound();
      
      // Update the slot with the new item
      setEquipmentSlots(prev => prev.map(slot => {
        if (slot.type === slotType) {
          return {
            ...slot,
            name: equipItem,
            variation: equipItem.toLowerCase().replace(/\s+/g, '_'),
            filled: true,
            stats: { goldRate: 3.5, bankInterest: 0.1, craftSpeed: 8 }
          };
        }
        return slot;
      }));
      
      // Trigger particle effect
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 2000);
      
      // Clear URL params
      router.replace(`/mek/${mekId}`);
    }
  };
  
  const handleUnequip = (slotId: string) => {
    playClickSound();
    
    const slot = equipmentSlots.find(s => s.id === slotId);
    if (slot?.name) {
      // Update slot to empty
      setEquipmentSlots(prev => prev.map(s => {
        if (s.id === slotId) {
          return {
            ...s,
            name: null,
            variation: null,
            filled: false,
            stats: { goldRate: 0, bankInterest: 0, craftSpeed: 0 }
          };
        }
        return s;
      }));
      
      // Show unequip message
      setUnequipMessage(`${slot.name} has been unequipped and moved to your inventory.`);
      setTimeout(() => setUnequipMessage(null), 5000);
    }
  };
  
  // Active buffs are now determined by the MEK 1 talent tree
  const activeBuffs = [
    { id: 1, name: "Gold Rush", level: 1, unlocked: true, buff: "+2.5 gold/hr" },
    { id: 2, name: "Efficient Worker", level: 2, unlocked: true, buff: "+5% gold rate" },
    { id: 3, name: "Banker", level: 3, unlocked: true, buff: "+1% bank interest" },
  ].filter(node => node.unlocked);
  
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
  
  const isOwner = true;
  
  return (
    <div className="min-h-screen bg-black text-white relative">
      <BackgroundEffects />
      
      {/* Equip Tooltip */}
      {showTooltip && equipType && (
        <div 
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold animate-pulse"
          style={{ marginTop: '250px' }}
        >
          Click the glowing {equipType.slice(0, -1)} slot to equip {equipItem}!
        </div>
      )}
      
      {/* Unequip Message */}
      {unequipMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-md">
          <p className="text-white mb-3">{unequipMessage}</p>
          <button
            onClick={() => router.push('/inventory')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded transition-all"
          >
            Go to Inventory
          </button>
        </div>
      )}
      
      {/* Header */}
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
            <div className="relative border border-gray-800/50 bg-gray-950/30 backdrop-blur-[2px] p-4 overflow-hidden">
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
              <div className="flex items-center justify-between">
                <span className={`text-lg font-bold ${isEmployed ? 'text-green-400' : 'text-gray-500'}`}>
                  {isEmployed ? 'EMPLOYED' : 'IDLE'}
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
          
          {/* Center - Mek Display */}
          <div className="col-span-6">
            <div className="relative">
              {/* Mek Image */}
              <div className="relative border border-gray-800/50 bg-gradient-to-b from-gray-950/40 to-black/40 backdrop-blur-[2px] p-8 overflow-hidden">
                <MekImage
                  src={mek.iconUrl}
                  headVariation={mek.headVariation}
                  bodyVariation={mek.bodyVariation}
                  assetId={mek.assetId}
                  size={500}
                  className="w-full aspect-square relative z-10"
                />
                
                {/* Particle Effect Overlay */}
                {showParticles && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(30)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                        style={{
                          left: '50%',
                          top: '50%',
                          animation: `mek-particle-burst 1.5s ease-out forwards`,
                          animationDelay: `${i * 0.03}s`,
                          '--angle': `${(i * 360 / 30)}deg`,
                          '--distance': `${150 + Math.random() * 100}px`
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Equipment Slots - Grid Below Mek */}
            <div className="flex justify-center gap-8 mt-6">
              {equipmentSlots.map((slot) => {
                const isGlowing = equipType === slot.type && equipItem;
                
                return (
                  <div key={slot.id} className="relative">
                    <div className="flex flex-col items-center">
                      {/* Slot Container */}
                      <div 
                        className={`relative cursor-pointer`}
                        onClick={() => isGlowing ? handleEquipItem(slot.type) : null}
                        onMouseEnter={() => setHoveredSlot(slot.id)}
                        onMouseLeave={() => setHoveredSlot(null)}
                      >
                        {/* Glowing Animation */}
                        {isGlowing && (
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.6), transparent)',
                              animation: 'mek-equip-pulse 1s ease-in-out infinite',
                              transform: 'scale(1.3)'
                            }}
                          />
                        )}
                        
                        {/* Round variation image */}
                        <div className={`
                          w-20 h-20 rounded-full overflow-hidden border-4 flex items-center justify-center transition-all
                          ${isGlowing 
                            ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' 
                            : slot.filled 
                              ? 'border-gray-600 bg-gray-900/50' 
                              : 'border-gray-700 bg-gray-900/30'
                          }
                        `}>
                          {slot.filled && slot.variation ? (
                            <img 
                              src={`/variation-images/${slot.variation}.png`}
                              alt={slot.name || ''}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                if (target.nextElementSibling) {
                                  (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-full h-full flex items-center justify-center"
                            style={{ display: slot.filled && slot.variation ? 'none' : 'flex' }}
                          >
                            {slot.filled ? (
                              <div className="text-3xl text-yellow-400">⚙</div>
                            ) : (
                              <div className="text-2xl text-gray-600">+</div>
                            )}
                          </div>
                        </div>
                        
                        {/* Hover Stats */}
                        {hoveredSlot === slot.id && slot.filled && (
                          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-700 rounded p-2 text-xs whitespace-nowrap z-10">
                            <div className="font-bold text-yellow-400 mb-1">{slot.name}</div>
                            <div className="text-green-400">+{slot.stats.goldRate} gold/hr</div>
                            <div className="text-blue-400">+{slot.stats.bankInterest}% bank interest</div>
                            <div className="text-purple-400">+{slot.stats.craftSpeed}% craft speed</div>
                          </div>
                        )}
                      </div>
                      
                      {/* Item Name Below */}
                      <div className="mt-2 text-center">
                        {slot.filled && slot.name ? (
                          <>
                            <div className="text-xs font-mono text-yellow-400">
                              {slot.name}
                            </div>
                            <button
                              onClick={() => handleUnequip(slot.id)}
                              className="text-xs text-red-400 hover:text-red-300 mt-1"
                            >
                              Unequip
                            </button>
                          </>
                        ) : (
                          <div className="text-xs font-mono text-gray-600">
                            EMPTY
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* MEK 1 Talent Tree */}
            <div className="mt-6">
              <MekTalentTree mekId={mekId} mekLevel={mek.level || 1} />
            </div>
          </div>
          
          {/* Right Panel - Level Progress & Gold Stats */}
          <div className="col-span-3 space-y-4">
            {/* Level Progress Bar */}
            <div className="relative border border-gray-800/50 bg-gray-950/30 backdrop-blur-[2px] p-4 overflow-hidden">
              <div className="text-xs font-mono text-gray-500 mb-2">LEVEL PROGRESS</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">LEVEL {mek.level || 1}</span>
                  <span className="text-sm text-gray-400">LEVEL {(mek.level || 1) + 1}</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded transition-all duration-300"
                    style={{ width: '67%' }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-xs text-gray-500">6,720 / 10,000 XP</span>
                </div>
              </div>
            </div>
            
            <div className="relative border border-gray-800/50 bg-gray-950/30 backdrop-blur-[2px] p-4 overflow-hidden">
              <div className="text-xs font-mono text-gray-500 mb-2">GOLD GENERATION</div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-600">BASE</div>
                  <div className="text-lg font-mono text-gray-400">
                    <AnimatedNumber value={baseGoldRate} suffix="/hr" />
                  </div>
                </div>
                <div className="h-px bg-gray-800"></div>
                <div>
                  <div className="text-xs text-green-400">EFFECTIVE</div>
                  <div className="text-xl font-mono font-bold text-green-400">
                    <AnimatedNumber value={effectiveGoldRate} suffix="/hr" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative border border-gray-800/50 bg-gray-950/30 backdrop-blur-[2px] p-4 overflow-hidden">
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
          </div>
        </div>
      </div>
      
    </div>
  );
}