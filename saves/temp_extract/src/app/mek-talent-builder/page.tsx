"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { getAllVariations } from "../../lib/variationsData";
import MekImage from "@/components/MekImage";
import BackgroundEffects from "@/components/BackgroundEffects";

interface MekData {
  _id: string;
  assetName: string;
  headVariation?: string;
  bodyVariation?: string;
  iconUrl?: string;
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

type DragState = {
  isDragging: boolean;
  nodeId: string | null;
  offsetX: number;
  offsetY: number;
};

export default function MekTalentBuilderPage() {
  // Core state
  const [nodes, setNodes] = useState<TalentNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [mode, setMode] = useState<'select' | 'add' | 'connect'>('select');
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    nodeId: null,
    offsetX: 0,
    offsetY: 0
  });
  
  // UI state
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [autoSave, setAutoSave] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Mek-specific state
  const [builderMode, setBuilderMode] = useState<'master' | 'mek'>('master');
  const [selectedMekId, setSelectedMekId] = useState<Id<"meks"> | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>("demo_wallet_123");
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showMekSelector, setShowMekSelector] = useState(false);
  const [currentTreeId, setCurrentTreeId] = useState<Id<"mekTalentTrees"> | null>(null);
  
  // Get user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
  // Fetch user's Meks
  const userMeks = useQuery(api.meks.getMeksPaginated, 
    userId ? { owner: walletAddress, page: 1, pageSize: 100 } : "skip"
  );
  
  // Fetch selected Mek's tree
  const mekTree = useQuery(api.mekTalentTrees.getMekTree, 
    selectedMekId ? { mekId: selectedMekId } : "skip"
  );
  
  // Mutations
  const getOrCreateMekTree = useMutation(api.mekTalentTrees.getOrCreateMekTree);
  const updateMekTree = useMutation(api.mekTalentTrees.updateMekTree);
  
  // Initialize user
  useEffect(() => {
    const stakeAddress = localStorage.getItem('stakeAddress');
    const paymentAddress = localStorage.getItem('walletAddress');
    const addressToUse = stakeAddress || paymentAddress || "demo_wallet_123";
    setWalletAddress(addressToUse);
    
    const initUser = async () => {
      const user = await getOrCreateUser({ walletAddress: addressToUse });
      if (user) {
        setUserId(user._id as Id<"users">);
      }
    };
    initUser();
  }, [getOrCreateUser]);
  
  // Load tree data based on mode
  useEffect(() => {
    if (builderMode === 'master') {
      // Load master tree from localStorage
      const savedData = localStorage.getItem('talentTreeData');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setNodes(parsed.nodes || []);
          setConnections(parsed.connections || []);
        } catch (e) {
          console.error('Failed to load master tree:', e);
          // Initialize with default master tree structure
          initializeMasterTree();
        }
      } else {
        initializeMasterTree();
      }
    } else if (builderMode === 'mek' && mekTree) {
      // Load Mek's tree from database
      setNodes(mekTree.nodes);
      setConnections(mekTree.connections);
      setCurrentTreeId(mekTree._id);
    }
  }, [builderMode, mekTree]);
  
  // Initialize master tree with default structure
  const initializeMasterTree = () => {
    const startNodes: TalentNode[] = [
      {
        id: 'start',
        name: 'MASTER',
        x: 400,
        y: 200,
        tier: 0,
        desc: 'Master circutree root',
        xp: 0,
        unlocked: true
      }
    ];
    
    const startConnections: Connection[] = [];
    
    setNodes(startNodes);
    setConnections(startConnections);
  };
  
  // Auto-save logic
  useEffect(() => {
    if (!autoSave) return;
    if (nodes.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      if (builderMode === 'master') {
        saveToLocalStorage();
      } else if (builderMode === 'mek' && currentTreeId) {
        saveToDatabase();
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [nodes, connections, autoSave, builderMode, currentTreeId]);
  
  const saveToLocalStorage = () => {
    try {
      const data = { nodes, connections, savedAt: Date.now() };
      localStorage.setItem('talentTreeData', JSON.stringify(data));
      setSaveStatus("Saved locally");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      console.error('Failed to save:', e);
      setSaveStatus("Save failed");
    }
  };
  
  const saveToDatabase = async () => {
    if (!currentTreeId) return;
    
    try {
      await updateMekTree({
        treeId: currentTreeId,
        nodes,
        connections
      });
      setSaveStatus("Saved to cloud");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      console.error('Failed to save to database:', e);
      setSaveStatus("Cloud save failed");
    }
  };
  
  // Handle Mek selection
  const selectMek = async (mekId: Id<"meks">) => {
    if (!userId) return;
    
    setSelectedMekId(mekId);
    setShowMekSelector(false);
    
    // Get or create tree for this Mek
    const tree = await getOrCreateMekTree({
      mekId,
      ownerId: userId
    });
    
    if (tree) {
      setNodes(tree.nodes);
      setConnections(tree.connections);
      setCurrentTreeId(tree._id);
    }
  };
  
  const loadMasterTree = () => {
    const savedData = localStorage.getItem('talentTreeData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed && parsed.nodes && parsed.connections) {
          setNodes(parsed.nodes || []);
          setConnections(parsed.connections || []);
          setSaveStatus("Loaded from browser");
          setTimeout(() => setSaveStatus(""), 3000);
          
          // Center on the start node if it exists
          const startNode = parsed.nodes.find((n: TalentNode) => n.id === 'start');
          if (startNode && canvasRef.current) {
            const canvasRect = canvasRef.current.getBoundingClientRect();
            const centerX = canvasRect.width / 2;
            const centerY = canvasRect.height / 2;
            
            setPanOffset({
              x: centerX - startNode.x,
              y: centerY - startNode.y
            });
          }
        }
      } catch (e) {
        console.error('Failed to load master tree:', e);
        setSaveStatus("Failed to load");
        setTimeout(() => setSaveStatus(""), 3000);
      }
    } else {
      setSaveStatus("No saved tree found");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };
  
  const GRID_SIZE = 20;
  const snapPosition = (value: number): number => {
    if (!snapToGrid) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };
  
  const addNode = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Place new node at the center of the current viewport
    const centerX = (rect.width / 2 - panOffset.x) / zoom;
    const centerY = (rect.height / 2 - panOffset.y) / zoom;
    
    const newNode: TalentNode = {
      id: `node-${Date.now()}`,
      name: 'New Node',
      x: snapPosition(centerX),
      y: snapPosition(centerY),
      tier: 1,
      desc: 'Node description',
      xp: 50,
      nodeType: 'stat'
    };
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode.id);
    setEditingNode(newNode.id);
  };
  
  const deleteNode = (nodeId: string) => {
    if (nodeId === 'start' || nodeId.startsWith('start-')) {
      alert("Cannot delete START nodes!");
      return;
    }
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNode === nodeId) setSelectedNode(null);
  };
  
  const updateNode = (nodeId: string, updates: Partial<TalentNode>) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  };
  
  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (mode === 'connect') {
      if (!connectFrom) {
        setConnectFrom(nodeId);
      } else if (connectFrom !== nodeId) {
        const exists = connections.some(
          c => (c.from === connectFrom && c.to === nodeId) || 
               (c.from === nodeId && c.to === connectFrom)
        );
        
        if (!exists) {
          setConnections([...connections, { from: connectFrom, to: nodeId }]);
        }
        setConnectFrom(null);
      }
    } else if (mode === 'select') {
      setSelectedNode(selectedNode === nodeId ? null : nodeId);
    }
  };
  
  const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
    if (mode !== 'select') return;
    e.stopPropagation();
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const nodeElement = e.currentTarget as HTMLElement;
    const rect = nodeElement.getBoundingClientRect();
    
    setDragState({
      isDragging: true,
      nodeId,
      offsetX: (e.clientX - rect.left) / zoom,
      offsetY: (e.clientY - rect.top) / zoom
    });
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
      return;
    }
    
    if (dragState.isDragging && dragState.nodeId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const worldX = (e.clientX - rect.left - panOffset.x) / zoom - dragState.offsetX;
      const worldY = (e.clientY - rect.top - panOffset.y) / zoom - dragState.offsetY;
      
      // Allow negative positions - no constraints
      updateNode(dragState.nodeId, {
        x: snapPosition(worldX),
        y: snapPosition(worldY)
      });
    }
  };
  
  const handleMouseUp = () => {
    setDragState({ isDragging: false, nodeId: null, offsetX: 0, offsetY: 0 });
    setIsPanning(false);
  };
  
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('talent-node') && !target.closest('.talent-node')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setSelectedNode(null);
    }
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
    const newZoom = Math.max(0.2, Math.min(3, zoom * delta));
    
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;
    
    setZoom(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  };
  
  // Prevent page scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
      return false;
    };
    
    canvas.addEventListener('wheel', preventScroll, { passive: false });
    return () => canvas.removeEventListener('wheel', preventScroll);
  }, []);
  
  return (
    <div className="text-white overflow-hidden relative" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <BackgroundEffects />
      
      {/* Header Bar */}
      <div className="fixed left-0 right-0 z-20 bg-gray-950/90 backdrop-blur-sm border-b border-yellow-400/30" style={{ top: '120px' }}>
        <div className="flex items-center justify-between px-6 py-3">
          {/* Mode Selector */}
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setBuilderMode('master')}
                className={`px-4 py-2 rounded transition-all ${
                  builderMode === 'master' 
                    ? 'bg-yellow-400 text-black font-bold' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Master Tree
              </button>
              <button
                onClick={() => {
                  setBuilderMode('mek');
                  if (!selectedMekId) setShowMekSelector(true);
                }}
                className={`px-4 py-2 rounded transition-all ${
                  builderMode === 'mek' 
                    ? 'bg-purple-500 text-white font-bold' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Mek Tree
              </button>
            </div>
            
            {builderMode === 'mek' && (
              <button
                onClick={() => setShowMekSelector(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-all"
              >
                {selectedMekId ? 'Change Mek' : 'Select Mek'}
              </button>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-yellow-400 uppercase tracking-wider">
            {builderMode === 'master' ? 'Master Tree Builder' : 'Mek Tree Builder'}
          </h1>
          
          {/* Tools */}
          <div className="flex items-center gap-4">
            {builderMode === 'master' && (
              <button
                onClick={loadMasterTree}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all"
              >
                Load
              </button>
            )}
            
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => { setMode('select'); setConnectFrom(null); }}
                className={`px-3 py-1 rounded ${mode === 'select' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
              >
                Select
              </button>
              <button
                onClick={() => { setMode('add'); setConnectFrom(null); }}
                className={`px-3 py-1 rounded ${mode === 'add' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
              >
                Add
              </button>
              <button
                onClick={() => setMode('connect')}
                className={`px-3 py-1 rounded ${mode === 'connect' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
              >
                Connect
              </button>
            </div>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Grid</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Snap</span>
            </label>
            
            {saveStatus && (
              <div className="px-3 py-1 bg-green-600/20 text-green-400 rounded text-sm">
                {saveStatus}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Canvas */}
      <div className="fixed inset-0" style={{ zIndex: 10, paddingTop: '180px' }}>
        <div 
          ref={canvasRef}
          className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
          onClick={() => {
            if (mode === 'add') {
              addNode();
            }
          }}
        >
          {/* Grid */}
          {showGrid && (
            <svg 
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: '0 0'
              }}
            >
              <defs>
                <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                  <circle cx={GRID_SIZE/2} cy={GRID_SIZE/2} r="1" fill="#333" />
                </pattern>
              </defs>
              <rect width="200%" height="200%" fill="url(#grid)" />
            </svg>
          )}
          
          {/* Tree content */}
          <div 
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
          >
            {/* Connections */}
            {connections.map(conn => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              
              if (!fromNode || !toNode) return null;
              
              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * 180 / Math.PI;
              
              return (
                <div
                  key={`${conn.from}-${conn.to}`}
                  className="absolute"
                  style={{
                    width: `${length}px`,
                    height: '2px',
                    left: `${fromNode.x + 15}px`,
                    top: `${fromNode.y + 15}px`,
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: '0 50%',
                    background: connectFrom === conn.from || connectFrom === conn.to
                      ? '#fbbf24' : '#666',
                    zIndex: 1
                  }}
                />
              );
            })}
            
            {/* Nodes */}
            {nodes.map(node => {
              const isSelected = selectedNode === node.id;
              const isConnecting = connectFrom === node.id;
              
              return (
                <div
                  key={node.id}
                  className="talent-node absolute"
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    zIndex: isSelected ? 20 : 10
                  }}
                  onClick={(e) => handleNodeClick(node.id, e)}
                  onMouseDown={(e) => handleMouseDown(node.id, e)}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      cursor-pointer transition-all
                      ${node.id === 'start' ? 'bg-green-500' : 
                        node.nodeType === 'stat' ? 'bg-blue-500' :
                        node.nodeType === 'ability' ? 'bg-purple-500' :
                        node.nodeType === 'passive' ? 'bg-orange-500' :
                        node.nodeType === 'special' ? 'bg-red-500' :
                        'bg-gray-600'}
                      ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black' : ''}
                      ${isConnecting ? 'ring-2 ring-green-400 animate-pulse' : ''}
                    `}
                  >
                    {node.tier}
                  </div>
                  <div className="text-center mt-1 text-xs text-white whitespace-nowrap">
                    {node.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Zoom controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 bg-gray-900/90 p-2 rounded">
          <button
            onClick={() => setZoom(Math.min(3, zoom * 1.2))}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
          >
            +
          </button>
          <div className="text-center text-xs text-yellow-400">{Math.round(zoom * 100)}%</div>
          <button
            onClick={() => setZoom(Math.max(0.2, zoom * 0.8))}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
          >
            -
          </button>
        </div>
      </div>
      
      {/* Node editor panel */}
      {selectedNode && (
        <div className="fixed left-4 top-48 z-30 bg-gray-900/95 backdrop-blur p-4 rounded-lg border border-gray-700 w-80">
          <h3 className="text-yellow-400 font-bold mb-3">Edit Node</h3>
          {(() => {
            const node = nodes.find(n => n.id === selectedNode);
            if (!node) return null;
            
            return (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400">Name</label>
                  <input
                    type="text"
                    value={node.name}
                    onChange={(e) => updateNode(node.id, { name: e.target.value })}
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-400">Description</label>
                  <textarea
                    value={node.desc}
                    onChange={(e) => updateNode(node.id, { desc: e.target.value })}
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded h-20"
                  />
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-400">Tier</label>
                    <input
                      type="number"
                      value={node.tier}
                      onChange={(e) => updateNode(node.id, { tier: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 bg-gray-800 text-white rounded"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label className="text-xs text-gray-400">XP Cost</label>
                    <input
                      type="number"
                      value={node.xp}
                      onChange={(e) => updateNode(node.id, { xp: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 bg-gray-800 text-white rounded"
                    />
                  </div>
                </div>
                
                {builderMode === 'mek' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400">Node Type</label>
                      <select
                        value={node.nodeType || 'stat'}
                        onChange={(e) => updateNode(node.id, { 
                          nodeType: e.target.value as TalentNode['nodeType'] 
                        })}
                        className="w-full px-2 py-1 bg-gray-800 text-white rounded"
                      >
                        <option value="stat">Stat Bonus</option>
                        <option value="ability">Ability</option>
                        <option value="passive">Passive</option>
                        <option value="special">Special</option>
                      </select>
                    </div>
                    
                    {node.nodeType === 'stat' && (
                      <div className="space-y-2 p-2 bg-gray-800 rounded">
                        <div className="text-xs text-gray-400">Stat Bonuses</div>
                        {['health', 'attack', 'defense', 'speed', 'critChance', 'critDamage'].map(stat => (
                          <div key={stat} className="flex items-center gap-2">
                            <label className="text-xs flex-1 capitalize">{stat}</label>
                            <input
                              type="number"
                              value={node.statBonus?.[stat as keyof typeof node.statBonus] || 0}
                              onChange={(e) => updateNode(node.id, {
                                statBonus: {
                                  ...node.statBonus,
                                  [stat]: parseInt(e.target.value) || 0
                                }
                              })}
                              className="w-20 px-2 py-1 bg-gray-700 text-white rounded text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                
                <button
                  onClick={() => deleteNode(node.id)}
                  className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-all"
                  disabled={node.id === 'start' || node.id.startsWith('start-')}
                >
                  Delete Node
                </button>
              </div>
            );
          })()}
        </div>
      )}
      
      {/* Mek Selector Modal */}
      {showMekSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Select a Mek</h2>
            
            {userMeks?.meks && userMeks.meks.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {userMeks.meks.map((mek: MekData) => (
                  <div
                    key={mek._id}
                    onClick={() => selectMek(mek._id)}
                    className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-all"
                  >
                    <MekImage
                      headVariation={mek.headVariation}
                      bodyVariation={mek.bodyVariation}
                      size={100}
                      className="mx-auto mb-2"
                    />
                    <div className="text-center">
                      <div className="font-bold">{mek.assetName}</div>
                      <div className="text-xs text-gray-400">
                        Level {mek.level || 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No Meks found. You need to own Meks to create individual trees.
              </div>
            )}
            
            <button
              onClick={() => setShowMekSelector(false)}
              className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}