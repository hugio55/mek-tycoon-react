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

type EssenceRequirement = {
  attribute: string; // e.g., 'Bumblebee', 'Taser', etc.
  amount: number;
};

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
  // CiruTree-specific fields
  goldCost?: number;
  essences?: EssenceRequirement[];
  ingredients?: string[];
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
  const [showEssencePicker, setShowEssencePicker] = useState(false);
  const [essenceSearch, setEssenceSearch] = useState("");
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [autoSave, setAutoSave] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
  const [showCiruTreeLoader, setShowCiruTreeLoader] = useState(false);
  const [savedCiruTrees, setSavedCiruTrees] = useState<{name: string, data: any, isActive?: boolean}[]>([]);
  
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
        
        // Auto-align to start node
        const startNode = loadedNodes.find((n: TalentNode) => n.id === 'start');
        if (startNode && canvasRef.current) {
          const canvasRect = canvasRef.current.getBoundingClientRect();
          setPanOffset({ 
            x: canvasRect.width / 2 - startNode.x, 
            y: canvasRect.height / 2 - startNode.y 
          });
          setZoom(1);
        }
        
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
  
  // Track changes for unsaved warning
  useEffect(() => {
    if (nodes.length > 0 || connections.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, connections]);
  
  // Add beforeunload event listener for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && builderMode === 'circutree') {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, builderMode]);
  
  const saveToLocalStorage = async (showStatus = true) => {
    try {
      // Get a name for this save
      const saveName = prompt('Enter a name for this CiruTree save (leave blank for timestamp)') || 
                      new Date().toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });
      if (!saveName) return false;
      
      // Load existing saves
      const existingSaves = JSON.parse(localStorage.getItem('ciruTreeSaves') || '[]');
      
      // Check if this name already exists
      const existingIndex = existingSaves.findIndex((s: any) => s.name === saveName);
      
      const saveData = {
        name: saveName,
        data: { nodes, connections, savedAt: Date.now() },
        isActive: false
      };
      
      if (existingIndex >= 0) {
        // Update existing save
        existingSaves[existingIndex] = saveData;
      } else {
        // Add new save
        existingSaves.push(saveData);
      }
      
      // Save back to localStorage
      localStorage.setItem('ciruTreeSaves', JSON.stringify(existingSaves));
      
      // Also save as the current working tree
      localStorage.setItem('talentTreeData', JSON.stringify(saveData.data));
      setHasUnsavedChanges(false);
      
      if (showStatus) {
        setSaveStatus("Saved as: " + saveName);
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
      name: name || '',
      x: snapPosition(x || 800),
      y: snapPosition(y || 400),
      tier: tier || 1,
      desc: '',
      xp: 0,
      goldCost: 0,
      essences: [],
      ingredients: []
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
    // Allow dragging in both select and add modes
    if (mode === 'connect') return;
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
      
      addNode('', x, y, 1);
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
              <button onClick={() => setShowCiruTreeLoader(true)} className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white">
                Load
              </button>
              <button onClick={startNewTree} className="px-3 py-1 text-sm rounded bg-purple-600 hover:bg-purple-700 text-white">
                New Tree
              </button>
            </>
          )}
          
          {builderMode === 'mek' && (
            <>
              <button 
                onClick={async () => {
                  if (!templateName) {
                    const name = prompt('Enter template name:');
                    if (!name) return;
                    setTemplateName(name);
                  }
                  
                  try {
                    if (selectedTemplateId) {
                      await updateTemplate({
                        templateId: selectedTemplateId,
                        nodes,
                        connections,
                      });
                      setSaveStatus('Template updated!');
                    } else if (templateName) {
                      const id = await createTemplate({
                        name: templateName,
                        description: templateDescription || 'Custom Mek template',
                        category: 'custom',
                        nodes,
                        connections,
                      });
                      setSelectedTemplateId(id);
                      setSaveStatus('Template created!');
                    }
                    setTimeout(() => setSaveStatus(''), 3000);
                  } catch (e: unknown) {
                    alert(getErrorMessage(e));
                  }
                }}
                className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700 text-white"
              >
                Save Template
              </button>
              <button onClick={() => setShowTemplateManager(true)} className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white">
                Load Template
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
        style={{ top: '200px' }}
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
              
              const isFromStart = fromNode.id === 'start' || fromNode.id.startsWith('start-');
              const isToStart = toNode.id === 'start' || toNode.id.startsWith('start-');
              const fromOffset = isFromStart ? 25 : 15;
              const toOffset = isToStart ? 25 : 15;
              
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
                    left: `${fromNode.x + fromOffset}px`,
                    top: `${fromNode.y + fromOffset}px`,
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
                <React.Fragment key={node.id}>
                  <div
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
                {/* Node name label */}
                {node.name && (
                  <div 
                    className="absolute pointer-events-none text-xs text-white font-medium"
                    style={{
                      left: `${node.x + (isStart ? 25 : 15)}px`,
                      top: `${node.y + (isStart ? 55 : 35)}px`,
                      transform: 'translateX(-50%)',
                      width: '100px',
                      textAlign: 'center',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)'
                    }}
                  >
                    {node.name}
                  </div>
                )}
              </React.Fragment>
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
        <div className="fixed left-4 bottom-4 z-30 bg-gray-900/95 backdrop-blur p-4 rounded-lg border border-yellow-400/50 w-96 max-h-[60vh] overflow-y-auto">
          <h3 className="text-lg font-bold text-yellow-400 mb-3">Edit Node</h3>
          {nodes.filter(n => n.id === selectedNode).map(node => (
            <div key={node.id} className="space-y-3">
              {/* Name with Autocomplete */}
              <div className="relative">
                <label className="text-xs text-gray-400">Attribute</label>
                <input
                  type="text"
                  value={node.name}
                  onChange={(e) => {
                    updateNode(node.id, { name: e.target.value });
                    if (builderMode === 'circutree') {
                      setVariationSearch(e.target.value);
                      setShowVariationPicker(true);
                    }
                  }}
                  onFocus={(e) => {
                    if (builderMode === 'circutree') {
                      e.target.select();
                      setShowVariationPicker(true);
                    }
                  }}
                  placeholder="Type to search attributes..."
                  className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                />
                
                {/* Autocomplete dropdown for CiruTree mode */}
                {builderMode === 'circutree' && showVariationPicker && variationSearch && (
                  <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg max-h-40 overflow-y-auto">
                    {filteredVariations.length > 0 ? (
                      filteredVariations.slice(0, 10).map(variation => (
                        <div
                          key={`${variation.type}-${variation.name}`}
                          onClick={() => {
                            updateNode(node.id, {
                              name: variation.name,
                              variation: variation.name,
                              variationType: variation.type,
                              goldCost: variation.xp * 10,
                              imageUrl: `/variation-images/${variation.name.toLowerCase().replace(/ /g, '-')}.png`
                            });
                            setVariationSearch("");
                            setShowVariationPicker(false);
                          }}
                          className="px-3 py-2 hover:bg-gray-800 cursor-pointer border-b border-gray-700 last:border-b-0"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-white font-medium">{variation.name}</span>
                              <span className="ml-2 text-xs text-gray-400">({variation.type})</span>
                            </div>
                            <span className="text-xs text-gray-500">{variation.copies} copies</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500">No attributes found</div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Tier</label>
                  <input
                    type="number"
                    value={node.tier}
                    onChange={(e) => updateNode(node.id, { tier: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Position</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={node.x}
                      onChange={(e) => updateNode(node.id, { x: parseInt(e.target.value) })}
                      className="w-1/2 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                      placeholder="X"
                    />
                    <input
                      type="number"
                      value={node.y}
                      onChange={(e) => updateNode(node.id, { y: parseInt(e.target.value) })}
                      className="w-1/2 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                      placeholder="Y"
                    />
                  </div>
                </div>
              </div>
              
              {/* CiruTree specific fields */}
              {builderMode === 'circutree' && (
                <>
                  {/* Gold Cost */}
                  <div>
                    <label className="text-xs text-gray-400">Gold Cost</label>
                    <input
                      type="number"
                      value={node.goldCost || 0}
                      onChange={(e) => updateNode(node.id, { goldCost: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                    />
                  </div>
                  
                  {/* Essence Requirements */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Essence Requirements</label>
                    <div className="space-y-2">
                      {(node.essences || []).map((essence, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={essence.attribute}
                            onChange={(e) => {
                              const newEssences = [...(node.essences || [])];
                              newEssences[index].attribute = e.target.value;
                              updateNode(node.id, { essences: newEssences });
                              setEssenceSearch(e.target.value);
                              setShowEssencePicker(true);
                            }}
                            onFocus={(e) => {
                              e.target.select();
                              setEssenceSearch(e.target.value);
                              setShowEssencePicker(true);
                            }}
                            placeholder="Type attribute..."
                            className="flex-1 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                          />
                          <input
                            type="number"
                            value={essence.amount}
                            onChange={(e) => {
                              const newEssences = [...(node.essences || [])];
                              newEssences[index].amount = parseInt(e.target.value) || 0;
                              updateNode(node.id, { essences: newEssences });
                            }}
                            className="w-20 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                            min="1"
                          />
                          <button
                            onClick={() => {
                              const newEssences = [...(node.essences || [])];
                              newEssences.splice(index, 1);
                              updateNode(node.id, { essences: newEssences });
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      
                      {/* Essence autocomplete */}
                      {showEssencePicker && essenceSearch && (
                        <div className="relative">
                          <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg max-h-32 overflow-y-auto">
                            {filteredVariations.filter(v => v.name.toLowerCase().includes(essenceSearch.toLowerCase())).slice(0, 5).map(variation => (
                              <div
                                key={`${variation.type}-${variation.name}`}
                                onClick={() => {
                                  const essences = node.essences || [];
                                  const lastIndex = essences.length - 1;
                                  if (lastIndex >= 0) {
                                    essences[lastIndex].attribute = variation.name;
                                    updateNode(node.id, { essences });
                                  }
                                  setEssenceSearch("");
                                  setShowEssencePicker(false);
                                }}
                                className="px-3 py-1 hover:bg-gray-800 cursor-pointer text-sm"
                              >
                                {variation.name} Essence
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          const newEssences = [...(node.essences || []), { attribute: '', amount: 1 }];
                          updateNode(node.id, { essences: newEssences });
                        }}
                        className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        + Add Essence
                      </button>
                    </div>
                  </div>
                  
                  {/* Ingredients */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Ingredients</label>
                    <div className="space-y-2">
                      {(node.ingredients || []).map((ingredient, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={ingredient}
                            onChange={(e) => {
                              const newIngredients = [...(node.ingredients || [])];
                              newIngredients[index] = e.target.value;
                              updateNode(node.id, { ingredients: newIngredients });
                            }}
                            placeholder="e.g., Ancient Rune"
                            className="flex-1 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                          />
                          <button
                            onClick={() => {
                              const newIngredients = [...(node.ingredients || [])];
                              newIngredients.splice(index, 1);
                              updateNode(node.id, { ingredients: newIngredients });
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newIngredients = [...(node.ingredients || []), ''];
                          updateNode(node.id, { ingredients: newIngredients });
                        }}
                        className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        + Add Ingredient
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              {/* Mek specific fields */}
              {builderMode === 'mek' && (
                <div>
                  <label className="text-xs text-gray-400">XP Cost</label>
                  <input
                    type="number"
                    value={node.xp}
                    onChange={(e) => updateNode(node.id, { xp: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  />
                </div>
              )}
              
              <button
                onClick={() => {
                  deleteNode(node.id);
                  setShowVariationPicker(false);
                  setShowEssencePicker(false);
                }}
                className="w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                disabled={node.id === 'start'}
              >
                Delete Node
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* CiruTree Load Modal */}
      {showCiruTreeLoader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Load CiruTree</h2>
            
            <div className="flex-1 overflow-y-auto">
              {(() => {
                const saves = JSON.parse(localStorage.getItem('ciruTreeSaves') || '[]');
                if (saves.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-400">
                      No saved CiruTrees found. Create and save a tree first!
                    </div>
                  );
                }
                
                return (
                  <div className="grid grid-cols-2 gap-4">
                    {saves.map((save: any, index: number) => (
                      <div
                        key={index}
                        className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all"
                      >
                        <h3 className="font-bold text-yellow-400 mb-2">{save.name}</h3>
                        <div className="text-sm text-gray-400 mb-3">
                          Nodes: {save.data.nodes?.length || 0} | 
                          Connections: {save.data.connections?.length || 0}
                        </div>
                        {save.isActive && (
                          <div className="text-xs text-green-400 mb-2">✓ Currently Active on Website</div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setNodes(save.data.nodes || []);
                              setConnections(save.data.connections || []);
                              localStorage.setItem('talentTreeData', JSON.stringify(save.data));
                              
                              // Auto-align to start node
                              const startNode = save.data.nodes?.find((n: any) => n.id === 'start');
                              if (startNode && canvasRef.current) {
                                const canvasRect = canvasRef.current.getBoundingClientRect();
                                setPanOffset({
                                  x: canvasRect.width / 2 - startNode.x,
                                  y: canvasRect.height / 2 - startNode.y
                                });
                                setZoom(1);
                              }
                              
                              setShowCiruTreeLoader(false);
                              setSaveStatus('Loaded: ' + save.name);
                              setTimeout(() => setSaveStatus(''), 2000);
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => {
                              const saves = JSON.parse(localStorage.getItem('ciruTreeSaves') || '[]');
                              // Set all to inactive
                              saves.forEach((s: any) => s.isActive = false);
                              // Set this one to active
                              saves[index].isActive = true;
                              localStorage.setItem('ciruTreeSaves', JSON.stringify(saves));
                              // Also save to the public location
                              localStorage.setItem('publicTalentTree', JSON.stringify(save.data));
                              // Update the file that the website reads
                              setSaveStatus('Set as active website tree');
                              setTimeout(() => setSaveStatus(''), 2000);
                              setShowCiruTreeLoader(false);
                            }}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                          >
                            Set as Active
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this saved tree?')) {
                                const saves = JSON.parse(localStorage.getItem('ciruTreeSaves') || '[]');
                                saves.splice(index, 1);
                                localStorage.setItem('ciruTreeSaves', JSON.stringify(saves));
                                setShowCiruTreeLoader(false);
                                setTimeout(() => setShowCiruTreeLoader(true), 100);
                              }
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            
            <button
              onClick={() => setShowCiruTreeLoader(false)}
              className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Mek Template Load Modal */}
      {showTemplateManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Mek Template Manager</h2>
            
            {!templates && (
              <button
                onClick={async () => {
                  await createDefaultTemplates();
                  setShowTemplateManager(false);
                  setTimeout(() => setShowTemplateManager(true), 100);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded mb-4"
              >
                Create Default Templates
              </button>
            )}
            
            <div className="flex-1 overflow-y-auto">
              {templates && templates.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {templates.map((template: Template) => (
                    <div
                      key={template._id}
                      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all"
                    >
                      <h3 className="font-bold text-yellow-400 mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                      <div className="text-xs text-gray-500 mb-3">
                        Nodes: {template.nodes.length} | Connections: {template.connections.length}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setNodes(template.nodes);
                            setConnections(template.connections);
                            setSelectedTemplateId(template._id);
                            setTemplateName(template.name);
                            setTemplateDescription(template.description || '');
                            
                            // Auto-align to start node
                            const startNode = template.nodes.find((n: any) => n.id === 'start');
                            if (startNode && canvasRef.current) {
                              const canvasRect = canvasRef.current.getBoundingClientRect();
                              setPanOffset({
                                x: canvasRect.width / 2 - startNode.x,
                                y: canvasRect.height / 2 - startNode.y
                              });
                              setZoom(1);
                            }
                            
                            setShowTemplateManager(false);
                            setSaveStatus('Loaded: ' + template.name);
                            setTimeout(() => setSaveStatus(''), 2000);
                          }}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                        >
                          Load
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Delete this template?')) {
                              await deleteTemplate({ templateId: template._id });
                              setShowTemplateManager(false);
                              setTimeout(() => setShowTemplateManager(true), 100);
                            }
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No templates found. Create default templates or build your own!
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowTemplateManager(false)}
              className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}