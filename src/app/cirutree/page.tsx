"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackgroundEffects from "@/components/BackgroundEffects";

type TalentNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  tier: number;
  desc: string;
  xp: number;
  unlocked?: boolean;
  variation?: string;
  variationType?: 'head' | 'body' | 'trait';
  imageUrl?: string;
};

type Connection = {
  from: string;
  to: string;
};

interface TalentData {
  nodes: TalentNode[];
  connections: Connection[];
}

// Default talent tree data (fallback if user tree is not loaded)
const defaultTalentData = {
  nodes: [
    // Main START node
    { id: 'start', name: 'START', x: 800, y: 60, tier: 0, desc: 'The beginning of your journey', xp: 0, unlocked: true },
    
    // Three sub-start nodes connected to main START
    { id: 'heads', name: 'HEADS', x: 500, y: 180, tier: 1, desc: 'Head variations and abilities', xp: 0, unlocked: false },
    { id: 'bodies', name: 'BODIES', x: 800, y: 180, tier: 1, desc: 'Body variations and abilities', xp: 0, unlocked: false },
    { id: 'traits', name: 'TRAITS', x: 1100, y: 180, tier: 1, desc: 'Trait variations and abilities', xp: 0, unlocked: false },
    
    // Second tier (examples connected to sub-nodes)
    { id: 'taser', name: 'Taser', x: 400, y: 300, tier: 2, desc: 'Stuns enemies for 2 seconds on critical hit', xp: 100 },
    { id: 'log', name: 'Log', x: 600, y: 300, tier: 2, desc: 'Records all combat data for analysis', xp: 104 },
    
    // Second tier
    { id: 'neon-flamingo', name: 'Neon\nFlamingo', x: 300, y: 460, tier: 2, desc: 'Adds neon visual effects to abilities', xp: 150 },
    { id: 'nuke', name: 'Nuke', x: 700, y: 460, tier: 2, desc: 'Ultimate ability: Massive area damage', xp: 200 },
    { id: 'mahogany', name: 'Mahogany', x: 1100, y: 460, tier: 2, desc: 'Increases armor durability by 25%', xp: 175 },
    { id: 'kevlar', name: 'Kevlar', x: 1300, y: 460, tier: 2, desc: 'Reduces physical damage by 15%', xp: 180 },
    
    // Third tier
    { id: 'hacker', name: 'Hacker', x: 400, y: 660, tier: 3, desc: 'Disable enemy shields and tech', xp: 250 },
    { id: 'exposed', name: 'Exposed', x: 700, y: 660, tier: 3, desc: 'Reveal enemy weak points', xp: 225 },
    { id: 'flaked', name: 'Flaked', x: 1000, y: 660, tier: 3, desc: 'Enemies take damage over time from your attacks', xp: 200 },
    { id: 'milk', name: 'Milk', x: 1300, y: 660, tier: 3, desc: 'Regenerate 5% health per second', xp: 275 },
    
    // Fourth tier
    { id: 'ace-of-spades', name: 'Ace of\nSpades', x: 400, y: 860, tier: 4, desc: 'Critical hits deal 3x damage', xp: 350 },
    { id: 'lightning', name: 'Lightning', x: 700, y: 860, tier: 4, desc: 'Chain lightning between enemies', xp: 325 },
    { id: 'china', name: 'China', x: 1300, y: 860, tier: 4, desc: 'Fragile but powerful glass cannon build', xp: 300 },
    
    // Fifth tier
    { id: 'bubblegum', name: 'Bubblegum', x: 700, y: 1060, tier: 5, desc: 'Enemies stick to surfaces when hit', xp: 400 }
  ] as TalentNode[],
  connections: [
    // Main START connects to three sub-nodes
    { from: 'start', to: 'heads' },
    { from: 'start', to: 'bodies' },
    { from: 'start', to: 'traits' },
    
    // Heads branch
    { from: 'heads', to: 'taser' },
    { from: 'heads', to: 'log' },
    { from: 'taser', to: 'neon-flamingo' },
    { from: 'taser', to: 'nuke' },
    { from: 'log', to: 'nuke' },
    { from: 'log', to: 'mahogany' },
    { from: 'log', to: 'kevlar' },
    { from: 'neon-flamingo', to: 'hacker' },
    { from: 'nuke', to: 'hacker' },
    { from: 'nuke', to: 'exposed' },
    { from: 'nuke', to: 'flaked' },
    { from: 'mahogany', to: 'flaked' },
    { from: 'mahogany', to: 'milk' },
    { from: 'kevlar', to: 'milk' },
    { from: 'milk', to: 'china' },
    { from: 'hacker', to: 'ace-of-spades' },
    { from: 'exposed', to: 'lightning' },
    { from: 'exposed', to: 'ace-of-spades' },
    { from: 'flaked', to: 'lightning' },
    { from: 'lightning', to: 'bubblegum' },
    { from: 'ace-of-spades', to: 'bubblegum' }
  ] as Connection[]
};

export default function TalentsPage() {
  const router = useRouter();
  const [talentData, setTalentData] = useState<TalentData>({ nodes: [], connections: [] });
  const [unlockedNodes, setUnlockedNodes] = useState<Set<string>>(new Set(['start']));
  const [xpReduction, setXpReduction] = useState(10); // 10% XP reduction buff example
  const [xpAvailable, setXpAvailable] = useState(1500);
  const [hoveredNode, setHoveredNode] = useState<TalentNode | null>(null);
  const [loadStatus, setLoadStatus] = useState<string>("");
  const [hoveredMilestone, setHoveredMilestone] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Prevent page scroll when over canvas
  useEffect(() => {
    const preventScroll = (e: WheelEvent) => {
      if (canvasRef.current && canvasRef.current.contains(e.target as Node)) {
        e.preventDefault();
        return false;
      }
    };
    
    window.addEventListener('wheel', preventScroll, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', preventScroll);
    };
  }, []);

  // Function to center view on a node
  const centerOnNode = (nodeId: string, nodes: TalentNode[]) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const centerX = canvasRect.width / 2;
      const centerY = canvasRect.height / 2;
      
      // Calculate offset to center the node
      setPanOffset({
        x: centerX - node.x,
        y: centerY - node.y
      });
    }
  };

  // Load user's talent tree - first from localStorage, then from file
  useEffect(() => {
    // First try localStorage
    const savedData = localStorage.getItem('talentTreeData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed && parsed.nodes && parsed.connections) {
          setTalentData(parsed);
          // Reset unlocked nodes to only the main START node
          const mainStartNode = parsed.nodes.find((n: TalentNode) => 
            n.id === 'start' && n.tier === 0
          );
          if (mainStartNode) {
            setUnlockedNodes(new Set(['start']));
            // Center on the START node
            setTimeout(() => centerOnNode('start', parsed.nodes), 100);
          } else {
            // Fallback to first tier 0 node
            const firstNode = parsed.nodes.find((n: TalentNode) => n.tier === 0);
            setUnlockedNodes(new Set([firstNode ? firstNode.id : 'start']));
            if (firstNode) {
              setTimeout(() => centerOnNode(firstNode.id, parsed.nodes), 100);
            }
          }
          setLoadStatus("Loaded from browser");
          setTimeout(() => setLoadStatus(""), 3000);
          return;
        }
      } catch (e) {
        console.error('Failed to parse localStorage data:', e);
      }
    }
    
    // Fall back to public JSON file
    fetch('/talent-tree.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.nodes && data.connections) {
          setTalentData(data);
          // Reset unlocked nodes to only the main START node
          const mainStartNode = data.nodes.find((n: TalentNode) => 
            n.id === 'start' && n.tier === 0
          );
          if (mainStartNode) {
            setUnlockedNodes(new Set(['start']));
            // Center on the START node
            setTimeout(() => centerOnNode('start', data.nodes), 100);
          } else {
            // Fallback to first tier 0 node
            const firstNode = data.nodes.find((n: TalentNode) => n.tier === 0);
            setUnlockedNodes(new Set([firstNode ? firstNode.id : 'start']));
            if (firstNode) {
              setTimeout(() => centerOnNode(firstNode.id, data.nodes), 100);
            }
          }
          setLoadStatus("Loaded from file");
          setTimeout(() => setLoadStatus(""), 3000);
        } else {
          // If no tree found, use default and center on it
          setTalentData(defaultTalentData);
          setUnlockedNodes(new Set(['start']));
          setTimeout(() => centerOnNode('start', defaultTalentData.nodes), 100);
          setLoadStatus("No talent tree found - create one in the builder!");
        }
      })
      .catch(err => {
        // Use default talent tree and center on it
        setTalentData(defaultTalentData);
        setUnlockedNodes(new Set(['start']));
        setTimeout(() => centerOnNode('start', defaultTalentData.nodes), 100);
        setLoadStatus("No talent tree found - create one in the builder!");
      });
  }, []);


  const hasUnlockedPrerequisite = (node: TalentNode): boolean => {
    // Check if any parent node is unlocked
    return talentData.connections.some(conn => 
      conn.to === node.id && unlockedNodes.has(conn.from)
    );
  };

  const canUnlockNode = (node: TalentNode): boolean => {
    if (unlockedNodes.has(node.id)) return false;
    
    // For tier 0 nodes (start nodes), they're always available if not already unlocked
    if (node.tier === 0) return true;
    
    // Node must have an unlocked parent
    if (!hasUnlockedPrerequisite(node)) return false;
    
    // Finally check if we have enough XP
    const reducedXp = Math.ceil(node.xp * (1 - xpReduction / 100));
    return xpAvailable >= reducedXp;
  };

  const unlockNode = (node: TalentNode) => {
    // Already unlocked
    if (unlockedNodes.has(node.id)) {
      return;
    }
    
    const reducedXp = Math.ceil(node.xp * (1 - xpReduction / 100));
    
    // Check prerequisites
    if (!hasUnlockedPrerequisite(node) && node.tier !== 0) {
      alert('You must unlock prerequisites first!');
      return;
    }
    
    // Check XP
    if (xpAvailable < reducedXp) {
      alert(`Not enough XP! You need ${reducedXp} XP but only have ${xpAvailable} XP.`);
      return;
    }

    const newUnlocked = new Set(unlockedNodes);
    newUnlocked.add(node.id);
    setUnlockedNodes(newUnlocked);
    setXpAvailable(xpAvailable - reducedXp);
  };

  const resetTree = () => {
    if (confirm('Reset all talent tree XP?')) {
      // Only unlock the main START node
      setUnlockedNodes(new Set(['start']));
      setXpAvailable(1500);
    }
  };

  const getMaxTier = (): number => {
    let maxTier = 1;
    unlockedNodes.forEach(nodeId => {
      const node = talentData.nodes.find(n => n.id === nodeId);
      if (node && node.tier > maxTier) {
        maxTier = node.tier;
      }
    });
    return maxTier;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Handle panning
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
    // Start panning if clicking on the canvas area
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
    
    // Get mouse position relative to canvas
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate world position before zoom
    const worldX = (mouseX - panOffset.x) / zoom;
    const worldY = (mouseY - panOffset.y) / zoom;
    
    // Apply zoom
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.2, Math.min(3, zoom * delta));
    
    // Calculate new pan to keep mouse position fixed
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;
    
    setZoom(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  // Calculate progress stats
  const totalNodes = talentData.nodes.length;
  const unlockedCount = unlockedNodes.size;
  const progressPercentage = totalNodes > 0 ? Math.round((unlockedCount / totalNodes) * 100) : 0;
  
  // Calculate path-specific progress
  const calculatePathProgress = (pathId: string) => {
    // Find all nodes connected to this path (recursively)
    const getPathNodes = (startId: string, visited = new Set<string>()): Set<string> => {
      if (visited.has(startId)) return visited;
      visited.add(startId);
      
      talentData.connections
        .filter(conn => conn.from === startId)
        .forEach(conn => getPathNodes(conn.to, visited));
      
      return visited;
    };
    
    const pathNodes = getPathNodes(pathId);
    pathNodes.delete('start'); // Remove start node from count
    pathNodes.delete(pathId); // Remove the path root itself
    
    const unlockedInPath = Array.from(pathNodes).filter(nodeId => 
      unlockedNodes.has(nodeId) && nodeId !== 'start' && nodeId !== pathId
    ).length;
    
    return {
      unlocked: unlockedInPath,
      total: pathNodes.size
    };
  };
  
  const headsProgress = calculatePathProgress('heads');
  const bodiesProgress = calculatePathProgress('bodies');
  const traitsProgress = calculatePathProgress('traits');
  
  return (
    <div className="text-white overflow-hidden relative" onMouseMove={handleMouseMove}>
      <BackgroundEffects />
      
      {/* Info Card with Title and Stats - Style M Ultra-thin dirty glass */}
      <div className="fixed left-1/2 transform -translate-x-1/2 z-30" style={{ top: '250px', width: '850px' }}>
        <div 
          className="relative rounded-lg p-4 overflow-visible group hover:border-yellow-400/20 transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.01)',
            backdropFilter: 'blur(2px)',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.3) inset',
          }}
        >
          {/* Style M glass effects */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              background: `
                conic-gradient(from 45deg at 30% 30%, transparent 0deg, rgba(250, 182, 23, 0.03) 90deg, transparent 180deg),
                conic-gradient(from 225deg at 70% 70%, transparent 0deg, rgba(147, 51, 234, 0.02) 90deg, transparent 180deg),
                radial-gradient(circle at 50% 50%, transparent 30%, rgba(255, 255, 255, 0.01) 70%, transparent 100%)`,
              filter: 'blur(4px)',
            }}
          />
          <div 
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E")`,
            }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: Title and Description */}
            <div>
              <h1 className="text-3xl font-bold text-yellow-400 uppercase tracking-wider mb-1"
                  style={{ textShadow: '0 0 20px rgba(255, 204, 0, 0.7)' }}>
                CircuTree
              </h1>
              <p className="text-gray-300 text-xs leading-relaxed">
                Unlock powerful abilities by spending gold and essence.
              </p>
            </div>
            
            {/* Right: Path Progress */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div 
                  className="text-yellow-400"
                  style={{ 
                    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                    fontSize: '24px',
                    fontWeight: 200,
                    letterSpacing: '1px',
                    lineHeight: '1',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >{progressPercentage}%</div>
                <div className="text-[10px] text-gray-400 uppercase">Total</div>
              </div>
              <div className="text-center">
                <div 
                  className="text-cyan-400"
                  style={{ 
                    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                    fontSize: '24px',
                    fontWeight: 200,
                    letterSpacing: '1px',
                    lineHeight: '1',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >{headsProgress.unlocked}/{headsProgress.total}</div>
                <div className="text-[10px] text-gray-400 uppercase">Heads</div>
              </div>
              <div className="text-center">
                <div 
                  className="text-purple-400"
                  style={{ 
                    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                    fontSize: '24px',
                    fontWeight: 200,
                    letterSpacing: '1px',
                    lineHeight: '1',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >{bodiesProgress.unlocked}/{bodiesProgress.total}</div>
                <div className="text-[10px] text-gray-400 uppercase">Bodies</div>
              </div>
              <div className="text-center">
                <div 
                  className="text-green-400"
                  style={{ 
                    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                    fontSize: '24px',
                    fontWeight: 200,
                    letterSpacing: '1px',
                    lineHeight: '1',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >{traitsProgress.unlocked}/{traitsProgress.total}</div>
                <div className="text-[10px] text-gray-400 uppercase">Traits</div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar with Milestones */}
          <div className="mt-4 relative overflow-visible">
            {/* Progress Bar Container */}
            <div className="relative h-8 overflow-visible">
              {/* Background Track */}
              <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-2 bg-gray-800 rounded-full shadow-inner" />
              
              {/* Progress Fill */}
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 h-2 bg-gradient-to-r from-yellow-500 via-yellow-400 to-amber-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(250,182,23,0.4)]"
                style={{ width: `${progressPercentage}%` }}
              />
              
              {/* Milestone Markers */}
              {[
                { position: 5, name: "First Steps", rewards: ["10,000 gold", "2 Acid Essence"] },
                { position: 12, name: "Apprentice", rewards: ["25,000 gold", "Silver Dragon Frame"] },
                { position: 18, name: "Pathfinder", rewards: ["1 Mek slot", "5 Fire Essence"] },
                { position: 27, name: "Journeyman", rewards: ["50,000 gold", "1 Ambassador Power Chip"] },
                { position: 35, name: "Adept", rewards: ["100,000 gold", "Golden Phoenix Frame"] },
                { position: 42, name: "Expert", rewards: ["2 Mek slots", "10 Lightning Essence"] },
                { position: 56, name: "Master", rewards: ["250,000 gold", "Legendary Core Module"] },
                { position: 68, name: "Grandmaster", rewards: ["500,000 gold", "3 Mek slots"] },
                { position: 78, name: "Sage", rewards: ["1,000,000 gold", "Ethereal Wings Frame"] },
                { position: 85, name: "Enlightened", rewards: ["5 Ambassador Power Chips", "Cosmic Essence x20"] },
                { position: 92, name: "Transcendent", rewards: ["10,000,000 gold", "Ultimate Mek Blueprint"] },
                { position: 98, name: "Legendary", rewards: ["Infinite Gold Generator", "Divine Spark"] }
              ].map((milestone, index) => {
                const isReached = progressPercentage >= milestone.position;
                const isHovered = hoveredMilestone === index;
                
                return (
                  <div
                    key={index}
                    className="absolute"
                    style={{ 
                      left: `${milestone.position}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: isHovered ? 60 : 40
                    }}
                    onMouseEnter={() => setHoveredMilestone(index)}
                    onMouseLeave={() => setHoveredMilestone(null)}
                  >
                    {/* Vertical Line */}
                    <div 
                      className={`absolute w-0.5 h-6 -top-3 left-1/2 transform -translate-x-1/2 transition-all duration-200 ${
                        isReached ? 'bg-yellow-400/60' : 'bg-gray-600/40'
                      }`}
                    />
                    
                    {/* Diamond Marker - Clickable */}
                    <div 
                      className={`relative w-4 h-4 rotate-45 border-2 cursor-pointer transition-all duration-200 ${
                        isReached 
                          ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-400 shadow-[0_0_8px_rgba(250,182,23,0.6)]' 
                          : 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 hover:border-gray-500 hover:from-gray-600 hover:to-gray-700'
                      }`}
                      onClick={() => {
                        // Navigate to achievements page with smooth scroll to specific achievement
                        router.push(`/achievements#${milestone.name.toLowerCase().replace(/\s+/g, '-')}`);
                      }}
                    >
                      {/* Inner glow for reached milestones */}
                      {isReached && (
                        <div className="absolute inset-0.5 bg-yellow-300/50 animate-pulse" />
                      )}
                    </div>
                    
                    {/* Tooltip - Below the bar */}
                    {isHovered && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-6 z-[100] pointer-events-none">
                        <div className="bg-gray-900/95 backdrop-blur border-2 border-yellow-400/60 rounded-lg p-3 shadow-2xl min-w-[200px] pointer-events-auto">
                          <div className="text-yellow-400 font-bold text-sm mb-2">{milestone.name}</div>
                          <ul className="text-gray-300 text-xs space-y-1">
                            {milestone.rewards.map((reward, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-yellow-400/70 mr-1.5">•</span>
                                <span>{reward}</span>
                              </li>
                            ))}
                          </ul>
                          {/* Arrow pointing up */}
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-gray-900/95" />
                            <div className="absolute top-[2px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-yellow-400/60" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Load Status */}
      {loadStatus && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-blue-600 text-white rounded text-sm z-50">
          {loadStatus}
        </div>
      )}
      
      {/* Canvas Container - Full screen from top */}
      <div className="fixed inset-0" style={{ zIndex: 5 }}>
        {/* Vignette effect overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.8) 90%, rgba(0,0,0,0.95) 100%)
            `,
            backdropFilter: 'blur(0.5px)',
            maskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)'
          }}
        />
        
        <div className="relative w-full h-full" style={{ paddingTop: '350px' }}>
          {/* Zoom Controls */}
          <div className="absolute top-[360px] right-4 z-20 flex flex-col gap-2 bg-gray-900/90 backdrop-blur p-2 rounded">
          <button
            onClick={() => setZoom(Math.min(3, zoom * 1.2))}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            +
          </button>
          <div className="text-center text-xs text-yellow-400">{Math.round(zoom * 100)}%</div>
          <button
            onClick={() => setZoom(Math.max(0.2, zoom * 0.8))}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            -
          </button>
          <button
            onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
          >
            Reset
          </button>
        </div>
        
        <div 
          ref={canvasRef}
          className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing" 
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Canvas content with pan and zoom transforms */}
          <div 
            className="absolute"
            style={{ 
              width: '1600px', 
              height: '1600px',
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isPanning ? 'none' : 'transform 0.1s',
              top: '-200px' // Allow nodes to be visible at the very top
            }}
          >
          {/* Render connections */}
          {talentData.connections.map(conn => {
            const fromNode = talentData.nodes.find(n => n.id === conn.from);
            const toNode = talentData.nodes.find(n => n.id === conn.to);
            
            if (!fromNode || !toNode) return null;
            
            // Calculate proper center offset based on node type
            const getNodeCenterOffset = (nodeId: string) => {
              if (nodeId === 'start') return 20; // 40px / 2
              if (nodeId === 'heads' || nodeId === 'bodies' || nodeId === 'traits') return 17.5; // 35px / 2
              return 15; // 30px / 2 for regular nodes
            };
            
            const fromOffset = getNodeCenterOffset(fromNode.id);
            const toOffset = getNodeCenterOffset(toNode.id);
            
            const fromX = fromNode.x + fromOffset;
            const fromY = fromNode.y + fromOffset;
            const toX = toNode.x + toOffset;
            const toY = toNode.y + toOffset;
            
            const dx = toX - fromX;
            const dy = toY - fromY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            const isActive = unlockedNodes.has(conn.from) && unlockedNodes.has(conn.to);
            
            return (
              <div
                key={`${conn.from}-${conn.to}`}
                className="absolute transition-all duration-300"
                style={{
                  width: `${length}px`,
                  height: '3px',
                  left: `${fromX}px`,
                  top: `${fromY}px`,
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: '0 50%',
                  background: isActive 
                    ? 'linear-gradient(90deg, #ffcc00, #ffd700)' 
                    : '#333',
                  boxShadow: isActive ? '0 0 10px rgba(255, 204, 0, 0.6)' : 'none',
                  zIndex: 1
                }}
              />
            );
          })}
          
          {/* Render nodes */}
          {talentData.nodes.map(node => {
            const isUnlocked = unlockedNodes.has(node.id);
            const isAvailable = canUnlockNode(node);
            const isRoot = node.id === 'start';
            const isSubStart = node.id === 'heads' || node.id === 'bodies' || node.id === 'traits';
            const isLocked = !isUnlocked && !isAvailable;
            
            return (
              <div
                key={node.id}
                className={`talent-node absolute flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  isAvailable && !isUnlocked ? 'animate-pulse' : ''
                }`}
                style={{
                  width: isRoot ? '40px' : isSubStart ? '35px' : '30px',
                  height: isRoot ? '40px' : isSubStart ? '35px' : '30px',
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  background: isUnlocked
                    ? isRoot 
                      ? 'radial-gradient(circle, #00ff88 0%, #00cc66 100%)'
                      : isSubStart
                      ? 'radial-gradient(circle, #ffcc00 0%, #ff9900 100%)'
                      : 'radial-gradient(circle, #ffcc00 0%, #ff9900 100%)'
                    : isLocked
                    ? 'radial-gradient(circle, #0a0a0a 0%, #050505 100%)'
                    : 'radial-gradient(circle, #2a2a2a 0%, #1a1a1a 100%)',
                  border: `3px solid ${
                    isUnlocked 
                      ? isRoot ? '#00ff88' : '#ffd700'
                      : isAvailable ? '#ffcc00' 
                      : '#222'
                  }`,
                  borderRadius: '50%',
                  boxShadow: isUnlocked 
                    ? isRoot 
                      ? '0 0 30px rgba(0, 255, 136, 0.8)'
                      : '0 0 25px rgba(255, 204, 0, 0.8)'
                    : isAvailable
                    ? '0 0 10px rgba(255, 204, 0, 0.3)'
                    : 'none',
                  transform: isRoot ? 'scale(1.3)' : isSubStart ? 'scale(1.15)' : 'scale(1)',
                  zIndex: isRoot ? 15 : 10,
                  opacity: isLocked ? 0.4 : 1
                }}
                onClick={() => !isRoot && unlockNode(node)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <div 
                  className="text-center pointer-events-none"
                  style={{
                    fontSize: isRoot ? '0.6rem' : '0.5rem',
                    fontWeight: 'bold',
                    color: isUnlocked ? '#000' : '#fff',
                    textShadow: isUnlocked ? 'none' : '1px 1px 2px rgba(0, 0, 0, 0.8)',
                    lineHeight: '1.1'
                  }}
                >
                  {(() => {
                    // Map variation names to image files
                    const variationImageMap: Record<string, string> = {
                      'Taser': '/100x100/aa1-aa1-cd1.jpg',
                      'Log': '/100x100/bc2-dm2-eh2.jpg',
                      'Neon Flamingo': '/100x100/dp2-bi2-Ji2.jpg',
                      'Nuke': '/100x100/hb1-gn1-hn1.jpg',
                      'Mahogany': '/100x100/111-111-111.jpg',
                      'Kevlar': '/100x100/222-222-222.jpg',
                      'Hacker': '/100x100/333-333-333.jpg',
                      'Exposed': '/100x100/444-444-444.jpg',
                      'Flaked': '/100x100/555-555-555.jpg',
                      'Milk': '/100x100/666-666-666.jpg',
                      'Ace of Spades': '/100x100/777-777-777.jpg',
                      'Lightning': '/100x100/888-888-888.jpg',
                      'China': '/100x100/999-999-999.jpg',
                      'Bubblegum': '/100x100/101-010-101.jpg'
                    };
                    
                    const imagePath = node.variation 
                      ? `/100x100/${node.variation.toLowerCase().replace(/ /g, '-')}.jpg`
                      : variationImageMap[node.name.replace('\n', ' ')] || null;
                    
                    if (imagePath) {
                      return (
                        <>
                          <img 
                            src={imagePath}
                            alt={node.name}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const textDiv = e.currentTarget.nextSibling as HTMLElement;
                              if (textDiv) textDiv.style.display = 'block';
                            }}
                          />
                          <div style={{ display: 'none' }}>
                            {node.name.split('\n').map((line, i) => (
                              <div key={i}>{line}</div>
                            ))}
                          </div>
                        </>
                      );
                    }
                    
                    return node.name.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ));
                  })()}
                </div>
              </div>
            );
          })}
          </div>
          
          {/* Tooltip - positioned within the canvas */}
          {hoveredNode && (
            <div
              className="absolute pointer-events-none z-[100] rounded-lg"
              style={{
                // Position near the hovered node
                left: `${hoveredNode.x * zoom + panOffset.x + 40}px`,
                top: `${hoveredNode.y * zoom + panOffset.y - 10}px`,
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(20, 20, 20, 0.95) 100%)',
                border: '2px solid #ffcc00',
                boxShadow: '0 0 30px rgba(255, 204, 0, 0.3)'
              }}
            >
              {(() => {
                const isUnlocked = unlockedNodes.has(hoveredNode.id);
                const isAvailable = canUnlockNode(hoveredNode);
                
                // Check if this node is connected to any unlocked node (next in line)
                const isNextInLine = talentData.connections.some(conn => {
                  // Check if this node is the 'to' and the 'from' is unlocked
                  if (conn.to === hoveredNode.id && unlockedNodes.has(conn.from)) {
                    return true;
                  }
                  // Also check reverse connections for bidirectional support
                  if (conn.from === hoveredNode.id && unlockedNodes.has(conn.to)) {
                    return true;
                  }
                  return false;
                });
                
                // Show full details if unlocked, available (can unlock now), or next in line
                const canSeeFullDetails = isUnlocked || isAvailable || isNextInLine;
                
                // For far future nodes, only show name
                if (!canSeeFullDetails) {
                  return (
                    <div className="px-4 py-2">
                      <div className="text-yellow-400 text-lg font-bold">
                        {hoveredNode.isSpell ? hoveredNode.spellType || hoveredNode.name : hoveredNode.name.replace('\\n', ' ')}
                      </div>
                      {hoveredNode.isSpell && (
                        <div className="text-purple-400 text-xs mt-1">Spell Node</div>
                      )}
                    </div>
                  );
                }
                
                // For unlocked, available, or next tier nodes, show full details
                return (
                  <div className="p-4" style={{ minWidth: '250px', maxWidth: '350px' }}>
                    <div className="text-yellow-400 text-lg font-bold mb-2">
                      {hoveredNode.isSpell ? hoveredNode.spellType || hoveredNode.name : hoveredNode.name.replace('\\n', ' ')}
                    </div>
                    
                    {hoveredNode.isSpell && (
                      <div className="text-purple-400 text-sm mb-2">✨ Spell Node</div>
                    )}
                    
                    {/* Cost Display */}
                    {hoveredNode.isSpell ? (
                      // Spell costs display
                      <div className="space-y-2 mb-2">
                        {hoveredNode.goldCost && hoveredNode.goldCost > 0 && (
                          <div className="text-center py-2" style={{ 
                            background: 'rgba(255, 204, 0, 0.1)',
                            border: '1px solid rgba(255, 204, 0, 0.3)',
                            borderRadius: '4px'
                          }}>
                            <div className="text-2xl font-bold text-yellow-400">
                              {hoveredNode.goldCost.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">GOLD COST</div>
                          </div>
                        )}
                        
                        {hoveredNode.essences && hoveredNode.essences.length > 0 && (
                          <div className="bg-gray-800/50 rounded p-2">
                            <div className="text-xs text-gray-400 mb-1">ESSENCE REQUIRED:</div>
                            {hoveredNode.essences.map((essence, idx) => (
                              <div key={idx} className="text-sm text-purple-300">
                                • {essence.amount}x {essence.attribute} Essence
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {hoveredNode.specialIngredient && (
                          <div className="bg-gray-800/50 rounded p-2">
                            <div className="text-xs text-gray-400 mb-1">SPECIAL INGREDIENT:</div>
                            <div className="text-sm text-blue-300">{hoveredNode.specialIngredient}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Regular XP cost display
                      hoveredNode.xp > 0 && (() => {
                        const reducedXp = Math.ceil(hoveredNode.xp * (1 - xpReduction / 100));
                        const canAfford = xpAvailable >= reducedXp;
                        
                        return (
                          <div className="text-center py-2 mb-2" style={{ 
                            background: canAfford ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: canAfford ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '4px'
                          }}>
                            <div className={`text-3xl font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                              {reducedXp.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">XP REQUIRED</div>
                            {xpReduction > 0 && (
                              <div className="text-xs text-gray-400 mt-1">
                                (reduced from {hoveredNode.xp.toLocaleString()})
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                    
                    <div className="text-gray-300 text-sm leading-relaxed mb-3">
                      {hoveredNode.desc}
                    </div>
                    
                    {/* Buffs/Effects section */}
                    <div className="border-t border-gray-700 pt-2">
                      <div className="text-xs text-gray-400 mb-1">
                        {hoveredNode.isSpell ? 'SPELL EFFECTS:' : 'BUFFS:'}
                      </div>
                      <div className="space-y-1">
                        {hoveredNode.isSpell ? (
                          <>
                            <div className="text-sm text-purple-400">• Instant cast</div>
                            <div className="text-sm text-purple-400">• Can be crafted once per day</div>
                            <div className="text-sm text-purple-400">• Tradeable after crafting</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm text-green-400">• +5% Attack Speed</div>
                            <div className="text-sm text-green-400">• +10% Critical Chance</div>
                            <div className="text-sm text-green-400">• +15% Energy Regen</div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {isUnlocked && (
                      <div className="mt-2 text-xs text-green-400 text-center">
                        ✓ UNLOCKED
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}