"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { getAllVariations } from "../../lib/variationsData";

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

interface Template {
  _id: string;
  name: string;
  description?: string;
  nodes: TalentNode[];
  connections: Connection[];
}

type TalentNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  tier: number;
  desc: string;
  xp: number;
  variation?: string;
  variationType?: 'head' | 'body' | 'trait';
  imageUrl?: string;
  // Mek-specific fields
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

export default function TalentBuilderPage() {
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
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [variationSearch, setVariationSearch] = useState("");
  const [showVariationPicker, setShowVariationPicker] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [autoSave, setAutoSave] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // New state for Mek template mode
  const [builderMode, setBuilderMode] = useState<'circutree' | 'mek'>('circutree');
  const [selectedTemplateId, setSelectedTemplateId] = useState<Id<"mekTreeTemplates"> | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  
  // Convex queries and mutations
  const templates = useQuery(api.mekTreeTemplates.getAllTemplates);
  const createTemplate = useMutation(api.mekTreeTemplates.createTemplate);
  const updateTemplate = useMutation(api.mekTreeTemplates.updateTemplate);
  const deleteTemplate = useMutation(api.mekTreeTemplates.deleteTemplate);
  const createDefaultTemplates = useMutation(api.mekTreeTemplates.createDefaultTemplates);
  
  // Prevent page scroll when over canvas - more robust approach
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    // Add wheel listener directly to the canvas element
    canvas.addEventListener('wheel', preventScroll, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', preventScroll);
    };
  }, []);
  
  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('talentTreeData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const loadedNodes = parsed.nodes || [];
        
        // Ensure the START node exists
        const hasStart = loadedNodes.some((n: TalentNode) => n.id === 'start');
        
        if (!hasStart) {
          loadedNodes.push({
            id: 'start',
            name: 'START',
            x: 1500,
            y: 1500,
            tier: 0,
            desc: 'The beginning of your journey',
            xp: 0
          });
        }
        
        setNodes(loadedNodes);
        setConnections(parsed.connections || []);
        setSaveStatus("Loaded from browser");
        setTimeout(() => setSaveStatus(""), 3000);
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    } else {
      // Create single start node at center of map
      const startNodes: TalentNode[] = [
        {
          id: 'start',
          name: 'START',
          x: 1500,
          y: 1500,
          tier: 0,
          desc: 'The beginning of your journey',
          xp: 0
        }
      ];
      setNodes(startNodes);
      // Center view on start node
      if (canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        setPanOffset({ 
          x: canvasRect.width / 2 - 1500, 
          y: canvasRect.height / 2 - 1500 
        });
      }
    }
  }, []);
  
  // Auto-save to localStorage
  useEffect(() => {
    if (!autoSave) return;
    if (nodes.length === 0 && connections.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      saveToLocalStorage(false); // Don't show status for auto-save
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [nodes, connections, autoSave]);
  
  const saveToLocalStorage = async (showStatus = true) => {
    try {
      const data = { nodes, connections, savedAt: Date.now() };
      localStorage.setItem('talentTreeData', JSON.stringify(data));
      
      if (showStatus) {
        setSaveStatus("Saved");
        setTimeout(() => setSaveStatus(""), 2000);
      }
      return true;
    } catch (e) {
      console.error('Failed to save:', e);
      if (showStatus) {
        setSaveStatus("Save failed");
        setTimeout(() => setSaveStatus(""), 3000);
      }
      return false;
    }
  };
  
  const loadFromLocalStorage = () => {
    const savedData = localStorage.getItem('talentTreeData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setNodes(parsed.nodes || []);
        setConnections(parsed.connections || []);
        setSaveStatus("Loaded");
        setTimeout(() => setSaveStatus(""), 2000);
        
        // Center view on start node if exists
        if (parsed.nodes && parsed.nodes.length > 0) {
          const startNode = parsed.nodes.find((n: TalentNode) => n.id === 'start') || parsed.nodes[0];
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
        return true;
      } catch (e) {
        console.error('Failed to load:', e);
        setSaveStatus("Load failed");
        setTimeout(() => setSaveStatus(""), 3000);
        return false;
      }
    } else {
      setSaveStatus("No saved tree found");
      setTimeout(() => setSaveStatus(""), 3000);
      return false;
    }
  };
  
  const startNewTree = () => {
    if (confirm('Start a new tree? This will clear the current tree.')) {
      // Create single start node at center
      const startNodes: TalentNode[] = [
        {
          id: 'start',
          name: 'START',
          x: 1500,
          y: 1500,
          tier: 0,
          desc: 'The beginning of your journey',
          xp: 0
        }
      ];
      setNodes(startNodes);
      setConnections([]);
      // Center view on start node
      if (canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        setPanOffset({ 
          x: canvasRect.width / 2 - 1500, 
          y: canvasRect.height / 2 - 1500 
        });
      }
      setSaveStatus("New tree created");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };
  
  const allVariations = getAllVariations();
  const filteredVariations = variationSearch
    ? allVariations.filter(v => 
        v.name.toLowerCase().includes(variationSearch.toLowerCase())
      )
    : allVariations;

  const GRID_SIZE = 20;

  const snapPosition = (value: number): number => {
    if (!snapToGrid) return value;
    // Snap to grid dots: first dot is at GRID_SIZE/2 (10), then every GRID_SIZE (20) after
    // So dots are at: 10, 30, 50, 70, 90, 110, 130, 150, etc.
    const offset = GRID_SIZE / 2; // 10
    return Math.round((value - offset) / GRID_SIZE) * GRID_SIZE + offset;
  };

  const addNode = (name?: string, x?: number, y?: number, tier?: number) => {
    const newNode: TalentNode = {
      id: `node-${Date.now()}`,
      name: name || 'New Node',
      x: snapPosition(x || 800),
      y: snapPosition(y || 400),
      tier: tier || 1,
      desc: 'Node description',
      xp: 50
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
    e.preventDefault();
    
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
    } else if (mode === 'select' || mode === 'add') {
      // Allow selection in both select and add modes
      setSelectedNode(selectedNode === nodeId ? null : nodeId);
    }
  };

  const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
    if (mode !== 'select') return;
    e.stopPropagation();
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
    // Handle panning
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
    
    // Handle node dragging
    if (!dragState.isDragging || !dragState.nodeId) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Calculate new position accounting for pan and zoom
    const worldX = (e.clientX - rect.left - panOffset.x) / zoom - dragState.offsetX;
    const worldY = (e.clientY - rect.top - panOffset.y) / zoom - dragState.offsetY;
    
    updateNode(dragState.nodeId, {
      x: snapPosition(worldX),
      y: snapPosition(worldY)
    });
  };

  const handleMouseUp = () => {
    setDragState({ isDragging: false, nodeId: null, offsetX: 0, offsetY: 0 });
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Check if clicking on a node (nodes have the talent-node class)
    const isNodeClick = target.closest('.talent-node');
    
    if (isNodeClick) return; // Let node handle its own click
    
    // If in add mode, add a node at clicked position
    if (mode === 'add') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Calculate position accounting for pan and zoom
      const x = (e.clientX - rect.left - panOffset.x) / zoom;
      const y = (e.clientY - rect.top - panOffset.y) / zoom;
      
      addNode('New Node', x, y, 1);
      return;
    }
    
    // Start panning if in select mode
    if (mode === 'select') {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Prevent all default scroll behavior
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
      e.nativeEvent.preventDefault();
    }
    
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
    
    return false;
  };

  const deleteConnection = (index: number) => {
    setConnections(connections.filter((_, i) => i !== index));
  };

  const exportTree = () => {
    const data = {
      nodes,
      connections
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'talent-tree.json';
    a.click();
  };

  const importTree = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setNodes(data.nodes || []);
        setConnections(data.connections || []);
      } catch (error) {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    if (confirm('Clear all nodes and connections? This will also clear the saved tree.')) {
      setNodes([]);
      setConnections([]);
      setSelectedNode(null);
      localStorage.removeItem('talentTreeData');
      setSaveStatus("Cleared");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
      {/* Top Control Panel */}
      <div className="fixed top-[120px] left-0 right-0 z-20 bg-gray-900/95 backdrop-blur-sm border-b border-yellow-400/30">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-yellow-400">
              {builderMode === 'circutree' ? 'CiruTree Builder' : 'Mek Template Builder'}
            </h1>
            
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => {
                  setBuilderMode('circutree');
                  const savedData = localStorage.getItem('talentTreeData');
                  if (savedData) {
                    const parsed = JSON.parse(savedData);
                    setNodes(parsed.nodes || []);
                    setConnections(parsed.connections || []);
                  }
                }}
                className={`px-3 py-1 rounded transition-all ${
                  builderMode === 'circutree' 
                    ? 'bg-yellow-400 text-black font-bold' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                CiruTree
              </button>
              <button
                onClick={() => {
                  setBuilderMode('mek');
                  if (!selectedTemplateId) {
                    setNodes([{
                      id: 'start',
                      name: 'Core',
                      x: 1500,
                      y: 1500,
                      tier: 0,
                      desc: 'Mek core systems',
                      xp: 0,
                      nodeType: 'special',
                    }]);
                    setConnections([]);
                  }
                }}
                className={`px-3 py-1 rounded transition-all ${
                  builderMode === 'mek' 
                    ? 'bg-purple-500 text-white font-bold' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Mek Template
              </button>
            </div>
          </div>
          
          {/* Center Status */}
          <div className="flex items-center gap-4">
            <div className="text-yellow-400 text-sm font-medium">
              Mode: <span className="text-white">{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
              {mode === 'connect' && connectFrom && <span className="ml-2 text-green-400">→ Click target node</span>}
              {mode === 'add' && <span className="ml-2 text-green-400">→ Click to place node</span>}
              {mode === 'select' && <span className="ml-2 text-blue-400">→ Click & drag to pan, click node to select</span>}
            </div>
            {saveStatus && (
              <div className="px-3 py-1 bg-green-600 text-white rounded text-sm animate-pulse">
                {saveStatus}
              </div>
            )}
          </div>
          
          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2 py-1 text-sm rounded ${showGrid ? 'bg-gray-600' : 'bg-gray-700'} hover:bg-gray-600 text-white`}
            >
              Grid: {showGrid ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`px-2 py-1 text-sm rounded ${snapToGrid ? 'bg-gray-600' : 'bg-gray-700'} hover:bg-gray-600 text-white`}
            >
              Snap: {snapToGrid ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`px-2 py-1 text-sm rounded ${autoSave ? 'bg-green-600' : 'bg-gray-600'} hover:bg-gray-700 text-white`}
            >
              Auto: {autoSave ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        
        {/* Secondary Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-800">
          {/* File Operations */}
          {builderMode === 'circutree' && (
            <>
              <button onClick={() => saveToLocalStorage(true)} className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700 text-white">
                Save
              </button>
              <button onClick={loadFromLocalStorage} className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white">
                Load
              </button>
              <button onClick={startNewTree} className="px-3 py-1 text-sm rounded bg-purple-600 hover:bg-purple-700 text-white">
                New Tree
              </button>
            </>
          )}
          
          {/* Mode Selector */}
          <div className="flex gap-1 bg-gray-800 p-1 rounded ml-4">
            <button
              onClick={() => setMode('select')}
              className={`px-3 py-1 text-sm rounded ${mode === 'select' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              Select
            </button>
            <button
              onClick={() => setMode('add')}
              className={`px-3 py-1 text-sm rounded ${mode === 'add' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              Add
            </button>
            <button
              onClick={() => { setMode('connect'); setConnectFrom(null); }}
              className={`px-3 py-1 text-sm rounded ${mode === 'connect' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              Connect
            </button>
          </div>
          
          <button onClick={clearAll} className="px-2 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded ml-4">
            Clear
          </button>
          
          <button onClick={exportTree} className="px-2 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded ml-auto">
            Export
          </button>
          
          <label className="px-2 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded cursor-pointer">
            Import
            <input type="file" accept=".json" onChange={importTree} className="hidden" />
          </label>
        </div>
      </div>
      
      {/* Canvas - Full Screen */}
      <div 
        ref={canvasRef}
        className="fixed inset-0 bg-gray-950"
        style={{ paddingTop: '200px' }}
        onWheel={handleWheel}
      >
        <div 
          className={`relative w-full h-full ${
            mode === 'add' ? 'cursor-crosshair' :
            mode === 'connect' ? 'cursor-pointer' :
            'cursor-grab active:cursor-grabbing'
          }`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Canvas Content */}
          <div 
            className="canvas-content absolute"
            style={{ 
              width: '3000px', 
              height: '3000px',
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: dragState.isDragging || isPanning ? 'none' : 'transform 0.1s'
            }}
          >
            {/* Grid */}
            {showGrid && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.2 }}>
                <defs>
                  <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                    <circle cx={GRID_SIZE/2} cy={GRID_SIZE/2} r="1" fill="white"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            )}
            
            {/* Connections */}
            {connections.map((conn, index) => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              
              if (!fromNode || !toNode) return null;
              
              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * 180 / Math.PI;
              
              return (
                <div
                  key={index}
                  className="absolute cursor-pointer hover:bg-red-500"
                  style={{
                    width: `${length}px`,
                    height: '3px',
                    left: `${fromNode.x + 15}px`,
                    top: `${fromNode.y + 15}px`,
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: '0 50%',
                    background: connectFrom === conn.from || connectFrom === conn.to ? '#fbbf24' : '#666',
                    zIndex: 1
                  }}
                  onClick={() => deleteConnection(index)}
                />
              );
            })}
            
            {/* Nodes */}
            {nodes.map(node => {
              const isSelected = selectedNode === node.id;
              const isConnecting = connectFrom === node.id;
              const isStart = node.id === 'start' || node.id.startsWith('start-');
              
              return (
                <div
                  key={node.id}
                  className={`talent-node absolute flex items-center justify-center cursor-move transition-all duration-200`}
                  style={{
                    width: isStart ? '50px' : '30px',
                    height: isStart ? '50px' : '30px',
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    background: isStart 
                      ? 'radial-gradient(circle, #00ff88, #00cc66)'
                      : node.nodeType === 'stat' ? '#3b82f6'
                      : node.nodeType === 'ability' ? '#a855f7'
                      : node.nodeType === 'passive' ? '#f97316'
                      : node.nodeType === 'special' ? '#ef4444'
                      : '#6b7280',
                    border: `3px solid ${
                      isSelected ? '#fbbf24' : isConnecting ? '#10b981' : 'transparent'
                    }`,
                    borderRadius: '50%',
                    boxShadow: isSelected ? '0 0 20px rgba(251, 191, 36, 0.5)' : 
                              isConnecting ? '0 0 20px rgba(16, 185, 129, 0.5)' :
                              isStart ? '0 0 15px rgba(0, 255, 136, 0.5)' : 'none',
                    zIndex: isSelected ? 20 : 10,
                    transform: isSelected ? 'scale(1.2)' : 'scale(1)'
                  }}
                  onClick={(e) => handleNodeClick(node.id, e)}
                  onMouseDown={(e) => handleMouseDown(node.id, e)}
                  onDoubleClick={() => setEditingNode(node.id)}
                >
                  {node.imageUrl ? (
                    <img 
                      src={node.imageUrl} 
                      alt={node.name}
                      className="w-full h-full object-cover rounded-full pointer-events-none"
                    />
                  ) : (
                    <div className="text-xs font-bold text-white pointer-events-none">
                      {node.tier}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-gray-900/90 p-2 rounded">
          <button onClick={() => setZoom(Math.min(3, zoom * 1.2))} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
            +
          </button>
          <div className="text-center text-xs text-yellow-400">{Math.round(zoom * 100)}%</div>
          <button onClick={() => setZoom(Math.max(0.2, zoom * 0.8))} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
            -
          </button>
          <button onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs">
            Reset
          </button>
        </div>
      </div>
      
      {/* Node Properties Panel - Floating */}
      {selectedNode && (
        <div className="fixed left-4 bottom-4 z-30 bg-gray-900/95 backdrop-blur p-4 rounded-lg border border-yellow-400/50 w-96 max-h-[50vh] overflow-y-auto">
          <h3 className="text-lg font-bold text-yellow-400 mb-3">Edit Node</h3>
          {nodes.filter(n => n.id === selectedNode).map(node => (
            <div key={node.id} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Name</label>
                  <input
                    type="text"
                    value={node.name}
                    onChange={(e) => updateNode(node.id, { name: e.target.value })}
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Tier</label>
                  <input
                    type="number"
                    value={node.tier}
                    onChange={(e) => updateNode(node.id, { tier: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-400">Description</label>
                <textarea
                  value={node.desc}
                  onChange={(e) => updateNode(node.id, { desc: e.target.value })}
                  className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400">XP Cost</label>
                  <input
                    type="number"
                    value={node.xp}
                    onChange={(e) => updateNode(node.id, { xp: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">X Pos</label>
                  <input
                    type="number"
                    value={node.x}
                    onChange={(e) => updateNode(node.id, { x: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Y Pos</label>
                  <input
                    type="number"
                    value={node.y}
                    onChange={(e) => updateNode(node.id, { y: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  />
                </div>
              </div>
              
              <button
                onClick={() => deleteNode(node.id)}
                className="w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                disabled={node.id === 'start'}
              >
                Delete Node
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}