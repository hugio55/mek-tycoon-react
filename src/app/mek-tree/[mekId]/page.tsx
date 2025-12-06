"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import MekImage from "@/components/MekImage";
import BackgroundEffects from "@/components/BackgroundEffects";

// Helper function to safely get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

type TalentNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  tier: number;
  desc: string;
  xp: number;
  unlocked?: boolean;
  nodeType?: 'stat' | 'ability' | 'passive' | 'special';
  statBonus?: {
    health?: number;
    speed?: number;
    attack?: number;
    defense?: number;
    critChance?: number;
    critDamage?: number;
  };
  abilityId?: string;
  passiveEffect?: string;
};

type Connection = {
  from: string;
  to: string;
};

export default function MekTreePage() {
  const params = useParams();
  const mekId = params.mekId as Id<"meks">;
  
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [hoveredNode, setHoveredNode] = useState<TalentNode | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Get user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
  // Fetch Mek data
  const mek = useQuery(api.meks.getMekById, { mekId });
  
  // Fetch or create tree
  const getOrCreateMekTree = useMutation(api.mekTalentTrees.getOrCreateMekTree);
  const mekTree = useQuery(api.mekTalentTrees.getMekTree, { mekId });
  
  // Mutations
  const unlockNode = useMutation(api.mekTalentTrees.unlockNode);
  const resetTree = useMutation(api.mekTalentTrees.resetMekTree);
  const addXp = useMutation(api.mekTalentTrees.addMekXp);
  
  // Initialize user and tree
  useEffect(() => {
    const initUser = async () => {
      const stakeAddress = localStorage.getItem('stakeAddress');
      const paymentAddress = localStorage.getItem('walletAddress');
      const addressToUse = stakeAddress || paymentAddress || "demo_wallet_123";
      
      const user = await getOrCreateUser({ walletAddress: addressToUse });
      if (user) {
        setUserId(user._id as Id<"users">);
        
        // Create tree if it doesn't exist
        if (!mekTree && mek) {
          await getOrCreateMekTree({
            mekId,
            ownerId: user._id as Id<"users">
          });
        }
      }
    };
    initUser();
  }, [getOrCreateUser, getOrCreateMekTree, mekId, mek, mekTree]);
  
  // Center on start node when tree loads
  useEffect(() => {
    if (mekTree?.nodes) {
      const startNode = mekTree.nodes.find((n: any) => n.id === 'start');
      if (startNode && canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        setPanOffset({
          x: canvasRect.width / 2 - startNode.x,
          y: canvasRect.height / 2 - startNode.y - 100
        });
      }
    }
  }, [mekTree]);
  
  const hasUnlockedPrerequisite = (node: TalentNode): boolean => {
    if (!mekTree) return false;
    return mekTree.connections.some((conn: any) => 
      conn.to === node.id && mekTree.unlockedNodes.includes(conn.from)
    );
  };
  
  const canUnlockNode = (node: TalentNode): boolean => {
    if (!mekTree) return false;
    if (mekTree.unlockedNodes.includes(node.id)) return false;
    if (node.tier === 0) return true;
    if (!hasUnlockedPrerequisite(node)) return false;
    return mekTree.availableXp >= node.xp;
  };
  
  const handleUnlockNode = async (node: TalentNode) => {
    if (!mekTree) return;
    
    try {
      await unlockNode({
        treeId: mekTree._id,
        nodeId: node.id
      });
    } catch (error: unknown) {
      alert(getErrorMessage(error));
    }
  };
  
  const handleResetTree = async () => {
    if (!mekTree) return;
    if (!confirm('Reset all talent points? You will get all XP refunded.')) return;
    
    await resetTree({ treeId: mekTree._id });
  };
  
  const handleAddXp = async () => {
    if (!mekTree) return;
    // Demo: Add 100 XP
    await addXp({ treeId: mekTree._id, amount: 100 });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('talent-node') && !target.closest('.talent-node')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseUp = () => {
    setIsPanning(false);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - panOffset.x) / zoom;
    const worldY = (mouseY - panOffset.y) / zoom;
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(2, zoom * delta));
    
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;
    
    setZoom(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  };
  
  // Prevent scroll
  useEffect(() => {
    const preventScroll = (e: WheelEvent) => {
      if (canvasRef.current && canvasRef.current.contains(e.target as Node)) {
        e.preventDefault();
        return false;
      }
    };
    
    window.addEventListener('wheel', preventScroll, { passive: false });
    return () => window.removeEventListener('wheel', preventScroll);
  }, []);
  
  if (!mek || !mekTree) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading Mek Tree...</div>
          <div className="animate-spin w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-white overflow-hidden relative" onMouseMove={handleMouseMove}>
      <BackgroundEffects />
      
      {/* Header */}
      <div className="fixed left-0 right-0 z-20 bg-gray-950/90 backdrop-blur-sm border-b border-yellow-400/30" style={{ top: '120px' }}>
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all"
            >
              ← Back
            </Link>
            
            <Link
              href="/mek-talent-builder"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-all"
            >
              Edit Tree
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <MekImage
              headVariation={mek.headVariation}
              bodyVariation={mek.bodyVariation}
              size={40}
            />
            <h1 className="text-2xl font-bold text-yellow-400">
              {mek.assetName}'s Talent Tree
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-gray-400">Available XP</div>
              <div className="text-xl font-bold text-yellow-400">{mekTree.availableXp}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Spent XP</div>
              <div className="text-xl font-bold text-green-400">{mekTree.totalXpSpent}</div>
            </div>
            <button
              onClick={handleAddXp}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              +100 XP
            </button>
            <button
              onClick={handleResetTree}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      
      {/* Canvas */}
      <div className="fixed inset-0" style={{ zIndex: 10, paddingTop: '180px' }}>
        <div 
          ref={canvasRef}
          className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div 
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isPanning ? 'none' : 'transform 0.1s'
            }}
          >
            {/* Connections */}
            {mekTree.connections.map((conn: any) => {
              const fromNode = mekTree.nodes.find((n: any) => n.id === conn.from);
              const toNode = mekTree.nodes.find((n: any) => n.id === conn.to);
              
              if (!fromNode || !toNode) return null;
              
              const isActive = mekTree.unlockedNodes.includes(conn.from) && 
                              mekTree.unlockedNodes.includes(conn.to);
              
              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * 180 / Math.PI;
              
              return (
                <div
                  key={`${conn.from}-${conn.to}`}
                  className="absolute transition-all duration-300"
                  style={{
                    width: `${length}px`,
                    height: '3px',
                    left: `${fromNode.x + 20}px`,
                    top: `${fromNode.y + 20}px`,
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: '0 50%',
                    background: isActive 
                      ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                      : '#374151',
                    boxShadow: isActive ? '0 0 10px rgba(251, 191, 36, 0.5)' : 'none',
                    zIndex: 1
                  }}
                />
              );
            })}
            
            {/* Nodes */}
            {mekTree.nodes.map((node: any) => {
              const isUnlocked = mekTree.unlockedNodes.includes(node.id);
              const isAvailable = canUnlockNode(node);
              const isRoot = node.id === 'start';
              
              const nodeColor = 
                node.nodeType === 'stat' ? '#3b82f6' :
                node.nodeType === 'ability' ? '#a855f7' :
                node.nodeType === 'passive' ? '#f97316' :
                node.nodeType === 'special' ? '#ef4444' :
                '#6b7280';
              
              return (
                <div
                  key={node.id}
                  className={`talent-node absolute flex items-center justify-center transition-all duration-300 ${
                    isAvailable && !isUnlocked ? 'cursor-pointer animate-pulse' : 
                    isUnlocked ? 'cursor-default' : 'cursor-not-allowed'
                  }`}
                  style={{
                    width: isRoot ? '50px' : '40px',
                    height: isRoot ? '50px' : '40px',
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    background: isUnlocked
                      ? `radial-gradient(circle, ${nodeColor}, ${nodeColor}dd)`
                      : isAvailable
                      ? `radial-gradient(circle, #374151, #1f2937)`
                      : 'radial-gradient(circle, #111827, #030712)',
                    border: `3px solid ${
                      isUnlocked ? nodeColor : isAvailable ? '#6b7280' : '#1f2937'
                    }`,
                    borderRadius: '50%',
                    boxShadow: isUnlocked 
                      ? `0 0 20px ${nodeColor}66`
                      : isAvailable
                      ? '0 0 10px rgba(107, 114, 128, 0.3)'
                      : 'none',
                    opacity: !isUnlocked && !isAvailable ? 0.5 : 1,
                    zIndex: isRoot ? 15 : 10
                  }}
                  onClick={() => isAvailable && !isUnlocked && handleUnlockNode(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <div className="text-center pointer-events-none">
                    <div className="text-xs font-bold text-white">
                      {node.name.split(' ')[0]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Tooltip */}
          {hoveredNode && (
            <div
              className="absolute pointer-events-none z-50 bg-gray-900/95 backdrop-blur rounded-lg border border-yellow-400/50 p-4"
              style={{
                left: `${hoveredNode.x * zoom + panOffset.x + 50}px`,
                top: `${hoveredNode.y * zoom + panOffset.y}px`,
                minWidth: '250px'
              }}
            >
              <div className="text-yellow-400 font-bold mb-2">{hoveredNode.name}</div>
              <div className="text-gray-300 text-sm mb-3">{hoveredNode.desc}</div>
              
              {hoveredNode.xp > 0 && (
                <div className="text-center py-2 mb-2 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-green-400">{hoveredNode.xp}</div>
                  <div className="text-xs text-gray-400">XP Required</div>
                </div>
              )}
              
              {hoveredNode.nodeType === 'stat' && hoveredNode.statBonus && (
                <div className="space-y-1 text-sm">
                  <div className="text-gray-400 text-xs">STAT BONUSES:</div>
                  {Object.entries(hoveredNode.statBonus).map(([stat, value]) => 
                    value ? (
                      <div key={stat} className="text-green-400">
                        • +{value} {stat}
                      </div>
                    ) : null
                  )}
                </div>
              )}
              
              {hoveredNode.passiveEffect && (
                <div className="text-sm text-blue-400 mt-2">
                  {hoveredNode.passiveEffect}
                </div>
              )}
              
              {mekTree.unlockedNodes.includes(hoveredNode.id) && (
                <div className="text-center text-green-400 text-xs mt-2">
                  ✓ UNLOCKED
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Zoom controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 bg-gray-900/90 p-2 rounded">
          <button
            onClick={() => setZoom(Math.min(2, zoom * 1.2))}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
          >
            +
          </button>
          <div className="text-center text-xs text-yellow-400">{Math.round(zoom * 100)}%</div>
          <button
            onClick={() => setZoom(Math.max(0.3, zoom * 0.8))}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
          >
            -
          </button>
        </div>
      </div>
    </div>
  );
}