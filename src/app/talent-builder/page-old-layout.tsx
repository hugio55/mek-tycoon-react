"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
      x: snapPosition(x || 400),
      y: snapPosition(y || 300),
      tier: tier || 1,
      desc: 'Node description',
      xp: 100
    };
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode.id);
  };

  const deleteNode = (nodeId: string) => {
    // Prevent deleting any START or CORE nodes
    if (nodeId === 'start' || nodeId.startsWith('start-') || nodeId.startsWith('core-')) {
      alert("Cannot delete core nodes!");
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
    e.stopPropagation(); // Prevent canvas from also handling this event
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Calculate the offset from the mouse position to the node position
    // Account for zoom and pan
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
    // Subtract the offset to keep the mouse at the same position relative to the node
    const mouseX = (e.clientX - rect.left - panOffset.x) / zoom;
    const mouseY = (e.clientY - rect.top - panOffset.y) / zoom;
    
    const newX = snapPosition(mouseX - dragState.offsetX);
    const newY = snapPosition(mouseY - dragState.offsetY);
    
    updateNode(dragState.nodeId, { x: newX, y: newY });
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
    <div className="min-h-screen p-5 relative z-10">
      <div className="flex gap-4">
        {/* Left Column - Controls and Editor */}
        <div className="w-1/3">
          <div className="mb-4 p-4 rounded-lg bg-gray-900 border border-yellow-400">
            {/* Mode Toggle */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-yellow-400">
                {builderMode === 'circutree' ? 'CiruTree Builder' : 'Mek Template Builder'}
              </h1>
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => {
                    setBuilderMode('circutree');
                    // Load CiruTree data
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
                    // Clear or load template
                    if (!selectedTemplateId) {
                      // Create 3 core nodes for the 3 paths
                      setNodes([
                        {
                          id: 'core-gold',
                          name: 'Gold Path',
                          x: 250, // Will snap to 250 (240+10)
                          y: 110, // Will snap to 110 (100+10)
                          tier: 0,
                          desc: 'Focus on gold generation and economy',
                          xp: 0,
                          nodeType: 'passive',
                        },
                        {
                          id: 'core-essence',
                          name: 'Essence Path',
                          x: 410, // Will snap to 410 (400+10)
                          y: 110, // Will snap to 110 (100+10)
                          tier: 0,
                          desc: 'Master essence collection and crafting',
                          xp: 0,
                          nodeType: 'special',
                        },
                        {
                          id: 'core-lootder',
                          name: 'Lootder Path',
                          x: 570, // Will snap to 570 (560+10)
                          y: 110, // Will snap to 110 (100+10)
                          tier: 0,
                          desc: 'Maximize loot drops and rare finds',
                          xp: 0,
                          nodeType: 'passive',
                        }
                      ]);
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
        
        {/* Save Status */}
        {saveStatus && (
          <div className="absolute top-4 right-40 px-3 py-1 bg-green-600 text-white rounded text-sm animate-pulse">
            {saveStatus}
          </div>
        )}
        
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Circutree-specific buttons */}
          {builderMode === 'circutree' && (
            <div className="flex gap-2">
              <button
                onClick={() => saveToLocalStorage(true)}
                className="px-3 py-1.5 text-sm rounded bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                Save
              </button>
              <button
                onClick={loadFromLocalStorage}
                className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Load
              </button>
              <button
                onClick={startNewTree}
                className="px-3 py-1.5 text-sm rounded bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              >
                New Tree
              </button>
            </div>
          )}
          
          {/* Mode buttons */}
          <div className="flex gap-1 bg-gray-800 p-1 rounded">
            <button
              onClick={() => setMode('select')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                mode === 'select' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Select
            </button>
            <button
              onClick={() => setMode('add')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                mode === 'add' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Add
            </button>
            <button
              onClick={() => {
                setMode('connect');
                setConnectFrom(null);
              }}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                mode === 'connect' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Connect
            </button>
          </div>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-1 text-sm rounded transition-colors ${
              showGrid ? 'bg-gray-600' : 'bg-gray-700'
            } hover:bg-gray-600 text-white`}
          >
            Grid: {showGrid ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`px-2 py-1 text-sm rounded transition-colors ${
              snapToGrid ? 'bg-gray-600' : 'bg-gray-700'
            } hover:bg-gray-600 text-white`}
          >
            Snap: {snapToGrid ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={clearAll}
            className="px-2 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Clear
          </button>
          {builderMode === 'mek' && (
            <>
              <button
                onClick={() => setShowTemplateManager(true)}
                className="px-2 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                Templates
              </button>
              <button
                onClick={async () => {
                  if (!templateName) {
                    const name = prompt('Enter template name:');
                    if (!name) return;
                    setTemplateName(name);
                    setTemplateDescription(prompt('Enter template description:') || '');
                  }
                  
                  try {
                    if (selectedTemplateId) {
                      // Update existing
                      await updateTemplate({
                        templateId: selectedTemplateId,
                        nodes,
                        connections,
                        description: templateDescription || undefined,
                      });
                      setSaveStatus('Template updated!');
                    } else if (templateName) {
                      // Create new
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
                className="px-2 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                {selectedTemplateId ? 'Update' : 'Save'}
              </button>
            </>
          )}
          <button
            onClick={() => setAutoSave(!autoSave)}
            className={`px-2 py-1 text-sm rounded transition-colors ${
              autoSave ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
            } text-white`}
          >
            Auto: {autoSave ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={exportTree}
            className="px-2 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
          >
            Export
          </button>
          <label className="px-2 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors cursor-pointer">
            Import
            <input type="file" accept=".json" onChange={importTree} className="hidden" />
          </label>
        </div>

        {/* Mode Status Display */}
        <div className="text-yellow-400 text-sm font-medium">
          Mode: <span className="text-white">{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
          {mode === 'connect' && connectFrom && <span className="ml-2 text-green-400">→ Click target node</span>}
          {mode === 'add' && <span className="ml-2 text-green-400">→ Click to place node</span>}
          {mode === 'select' && <span className="ml-2 text-blue-400">→ Click & drag to pan, click node to select</span>}
          </div>
        </div>

        {/* Node Editor */}
        {!selectedNode && nodes.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-gray-800 border border-gray-600 text-center text-gray-400">
            Click on a node to edit its properties
          </div>
        )}
        {selectedNode && (
          <div className="mb-4 p-4 rounded-lg bg-gray-900 border-2 border-yellow-400 shadow-lg">
          <h3 className="text-xl font-bold text-yellow-400 mb-3">Edit Node</h3>
          {nodes.filter(n => n.id === selectedNode).map(node => (
            <div key={node.id} className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={node.name}
                  onChange={(e) => updateNode(node.id, { name: e.target.value })}
                  className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tier</label>
                <input
                  type="number"
                  value={node.tier}
                  onChange={(e) => updateNode(node.id, { tier: parseInt(e.target.value) })}
                  className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">XP Cost</label>
                <input
                  type="number"
                  value={node.xp}
                  onChange={(e) => updateNode(node.id, { xp: parseInt(e.target.value) })}
                  className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Position</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={node.x}
                    onChange={(e) => updateNode(node.id, { x: parseInt(e.target.value) })}
                    className="w-1/2 px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    value={node.y}
                    onChange={(e) => updateNode(node.id, { y: parseInt(e.target.value) })}
                    className="w-1/2 px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                    placeholder="Y"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={node.desc}
                  onChange={(e) => updateNode(node.id, { desc: e.target.value })}
                  className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                  rows={2}
                />
              </div>
              
              {/* Mek-specific properties */}
              {builderMode === 'mek' && (
                <>
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Node Type</label>
                    <select
                      value={node.nodeType || 'stat'}
                      onChange={(e) => updateNode(node.id, { 
                        nodeType: e.target.value as TalentNode['nodeType'] 
                      })}
                      className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                    >
                      <option value="stat">Stat Bonus</option>
                      <option value="ability">Ability</option>
                      <option value="passive">Passive</option>
                      <option value="special">Special</option>
                    </select>
                  </div>
                  
                  {node.nodeType === 'stat' && (
                    <div className="col-span-2 space-y-2 p-2 bg-gray-800 rounded">
                      <div className="text-xs text-gray-400">Stat Bonuses</div>
                      <div className="grid grid-cols-2 gap-2">
                        {['health', 'attack', 'defense', 'speed', 'critChance', 'critDamage'].map(stat => (
                          <div key={stat} className="flex items-center gap-2">
                            <label className="text-xs flex-1 capitalize">{stat}:</label>
                            <input
                              type="number"
                              value={node.statBonus?.[stat as keyof typeof node.statBonus] || 0}
                              onChange={(e) => updateNode(node.id, {
                                statBonus: {
                                  ...node.statBonus,
                                  [stat]: parseInt(e.target.value) || 0
                                }
                              })}
                              className="w-16 px-1 py-0.5 bg-gray-700 text-white rounded text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {node.nodeType === 'ability' && (
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Ability ID</label>
                      <input
                        type="text"
                        value={node.abilityId || ''}
                        onChange={(e) => updateNode(node.id, { abilityId: e.target.value })}
                        placeholder="e.g., berserker-mode"
                        className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                      />
                    </div>
                  )}
                  
                  {node.nodeType === 'passive' && (
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Passive Effect</label>
                      <input
                        type="text"
                        value={node.passiveEffect || ''}
                        onChange={(e) => updateNode(node.id, { passiveEffect: e.target.value })}
                        placeholder="e.g., +10% damage reduction"
                        className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                      />
                    </div>
                  )}
                </>
              )}
              
              {/* Variation Selector - only show in CiruTree mode */}
              {builderMode === 'circutree' && (
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Variation (Attribute)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={variationSearch}
                    onChange={(e) => {
                      setVariationSearch(e.target.value);
                      setShowVariationPicker(true);
                    }}
                    onFocus={() => setShowVariationPicker(true)}
                    placeholder={node.variation || "Search for variation (e.g. 'bumb' for Bumblebee)"}
                    className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                  />
                  {node.variation && (
                    <div className="text-xs text-yellow-400 mt-1">
                      Current: {node.variation} ({node.variationType}) - {allVariations.find(v => v.name === node.variation)?.xp || 0} XP
                    </div>
                  )}
                  
                  {/* Autocomplete Dropdown */}
                  {showVariationPicker && variationSearch && (
                    <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg max-h-60 overflow-y-auto">
                      {filteredVariations.length > 0 ? (
                        filteredVariations.slice(0, 10).map(variation => (
                          <div
                            key={`${variation.type}-${variation.name}`}
                            onClick={() => {
                              updateNode(node.id, {
                                variation: variation.name,
                                variationType: variation.type,
                                xp: variation.xp,
                                name: variation.name,
                                desc: `${variation.type.charAt(0).toUpperCase() + variation.type.slice(1)} variation - ${variation.copies} copies in existence`
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
                              <div className="text-right">
                                <span className="text-yellow-400 text-sm">{variation.xp.toLocaleString()} XP</span>
                                <span className="text-gray-500 text-xs ml-2">{variation.copies} copies</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500">No variations found</div>
                      )}
                      {filteredVariations.length > 10 && (
                        <div className="px-3 py-2 text-gray-500 text-sm border-t border-gray-700">
                          ...and {filteredVariations.length - 10} more results
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Quick Clear Button */}
                {node.variation && (
                  <button
                    onClick={() => {
                      updateNode(node.id, {
                        variation: undefined,
                        variationType: undefined,
                        name: 'New Node',
                        desc: 'Node description'
                      });
                    }}
                    className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    Clear Variation
                  </button>
                )}
              </div>
              )}
              
              {/* Image URL for future use */}
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Image URL (Optional)</label>
                <input
                  type="text"
                  value={node.imageUrl || ''}
                  onChange={(e) => updateNode(node.id, { imageUrl: e.target.value })}
                  placeholder="Will be used instead of text when available"
                  className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                />
              </div>
              
              <div className="col-span-2 flex gap-2">
                <button
                  onClick={() => deleteNode(node.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Delete Node
                </button>
                <button
                  onClick={() => {
                    setShowVariationPicker(false);
                    setVariationSearch("");
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  Close Search
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Right Column - Canvas */}
      <div className="flex-1">
        {/* Zoom Controls */}
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-2 bg-gray-900 bg-opacity-90 p-2 rounded">
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
        
        {/* Instructions */}
        <div className="absolute bottom-2 left-2 z-20 text-xs text-gray-400 bg-gray-900 bg-opacity-90 p-2 rounded">
          Click & drag to pan • Scroll to zoom
        </div>
        
        <div 
          ref={canvasRef}
          className="relative overflow-hidden border-2 border-yellow-400 rounded-lg bg-gray-950" 
          style={{ width: '100%', height: '70vh' }}
          onWheel={handleWheel}>
        <div 
          className={`relative ${
            mode === 'add' ? 'cursor-crosshair' :
            mode === 'connect' ? 'cursor-pointer' :
            'cursor-grab active:cursor-grabbing'
          }`}
          style={{ width: '100%', height: '100%', touchAction: 'none' }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Canvas Content - Apply transforms here */}
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
        
        {/* Center Marker */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: '1500px',
            top: '1500px',
            transform: 'translate(-50%, -50%)',
            zIndex: 5
          }}
        >
          {/* Crosshair */}
          <div className="relative">
            {/* Horizontal line */}
            <div
              className="absolute"
              style={{
                width: '60px',
                height: '2px',
                background: 'rgba(255, 0, 0, 0.5)',
                left: '-30px',
                top: '-1px'
              }}
            />
            {/* Vertical line */}
            <div
              className="absolute"
              style={{
                width: '2px',
                height: '60px',
                background: 'rgba(255, 0, 0, 0.5)',
                left: '-1px',
                top: '-30px'
              }}
            />
            {/* Center dot */}
            <div
              className="absolute"
              style={{
                width: '8px',
                height: '8px',
                background: 'rgba(255, 0, 0, 0.7)',
                borderRadius: '50%',
                left: '-4px',
                top: '-4px',
                border: '2px solid rgba(255, 255, 255, 0.5)'
              }}
            />
            {/* Label */}
            <div
              className="absolute text-xs font-bold"
              style={{
                color: 'rgba(255, 0, 0, 0.7)',
                left: '10px',
                top: '10px',
                whiteSpace: 'nowrap'
              }}
            >
              CENTER (1500, 1500)
            </div>
          </div>
        </div>

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
                left: `${fromNode.x + 12.5}px`,
                top: `${fromNode.y + 12.5}px`,
                transform: `rotate(${angle}deg)`,
                transformOrigin: '0 50%',
                background: '#ffcc00',
                zIndex: 1
              }}
              onClick={() => deleteConnection(index)}
              title="Click to delete connection"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const isStart = node.id === 'start' || node.id.startsWith('start-');
          const isSelected = selectedNode === node.id;
          const isConnecting = connectFrom === node.id;
          
          return (
          <div
            key={node.id}
            className={`talent-node absolute flex items-center justify-center cursor-move transition-all duration-200`}
            style={{
              width: isStart ? '40px' : '25px',
              height: isStart ? '40px' : '25px',
              left: `${node.x}px`,
              top: `${node.y}px`,
              background: isStart 
                ? 'radial-gradient(circle, #00ff88 0%, #00cc66 100%)'
                : 'radial-gradient(circle, #ffcc00 0%, #ff9900 100%)',
              border: isSelected 
                ? '3px solid #ffffff' 
                : isConnecting 
                ? '3px solid #00ff00'
                : isStart 
                ? '3px solid #00ff88' 
                : '3px solid #ffd700',
              borderRadius: '50%',
              zIndex: isSelected ? 20 : isStart ? 15 : 10,
              boxShadow: isSelected 
                ? '0 0 30px rgba(255, 255, 255, 0.8), 0 0 15px rgba(255, 255, 255, 0.6)' 
                : isStart 
                ? '0 0 20px rgba(0, 255, 136, 0.8)' 
                : isConnecting
                ? '0 0 20px rgba(0, 255, 0, 0.8)'
                : 'none',
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
              <div className="text-center pointer-events-none" style={{ fontSize: '0.5rem', fontWeight: 'bold', color: '#000' }}>
                {node.variation ? node.variation.substring(0, 3).toUpperCase() : node.name.substring(0, 3)}
              </div>
            )}
          </div>
          );
        })}
          </div>
        </div>
        </div>
      </div>
    </div>

      {/* Variations Reference Panel */}
      <div className="mt-4 p-4 rounded-lg bg-gray-900 border border-yellow-400">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">All Variations (291 Total)</h3>
        <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          <div>
            <h4 className="text-sm font-bold text-yellow-300 mb-2">Heads (102)</h4>
            <div className="space-y-1 text-xs">
              {allVariations.filter(v => v.type === 'head').slice(0, 20).map(v => (
                <div key={v.name} className="flex justify-between text-gray-400">
                  <span>{v.name}</span>
                  <span className="text-yellow-500">{v.xp.toLocaleString()}</span>
                </div>
              ))}
              <div className="text-gray-600">...and {102 - 20} more</div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-yellow-300 mb-2">Bodies (112)</h4>
            <div className="space-y-1 text-xs">
              {allVariations.filter(v => v.type === 'body').slice(0, 20).map(v => (
                <div key={v.name} className="flex justify-between text-gray-400">
                  <span>{v.name}</span>
                  <span className="text-yellow-500">{v.xp.toLocaleString()}</span>
                </div>
              ))}
              <div className="text-gray-600">...and {112 - 20} more</div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-yellow-300 mb-2">Traits (77)</h4>
            <div className="space-y-1 text-xs">
              {allVariations.filter(v => v.type === 'trait').slice(0, 20).map(v => (
                <div key={v.name} className="flex justify-between text-gray-400">
                  <span>{v.name}</span>
                  <span className="text-yellow-500">{v.xp.toLocaleString()}</span>
                </div>
              ))}
              <div className="text-gray-600">...and {77 - 20} more</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Template Manager Modal */}
      {showTemplateManager && builderMode === 'mek' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Template Manager</h2>
            
            <div className="mb-4">
              <button
                onClick={async () => {
                  try {
                    await createDefaultTemplates();
                    alert('Default templates created!');
                  } catch (e) {
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Create Default Templates
              </button>
            </div>
            
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
                          setTemplateDescription(template.description);
                          setShowTemplateManager(false);
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