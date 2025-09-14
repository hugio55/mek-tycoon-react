"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { getAllVariations } from "../../lib/variationsData";
import { Template, TalentNode, Connection, DragState, BuilderMode, EssenceRequirement } from "./types";
import { getErrorMessage } from "./utils";

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
  const [savedSpells, setSavedSpells] = useState<any[]>([]);
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
  const [builderMode, setBuilderMode] = useState<BuilderMode>('circutree');
  const [selectedTemplateId, setSelectedTemplateId] = useState<Id<"mekTreeTemplates"> | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showCiruTreeLoader, setShowCiruTreeLoader] = useState(false);
  const [storyChapter, setStoryChapter] = useState(1);
  const [storyNodeEditMode, setStoryNodeEditMode] = useState<'normal' | 'event' | 'boss' | 'final_boss'>('normal');
  const [savedCiruTrees, setSavedCiruTrees] = useState<{name: string, data: any, isActive?: boolean}[]>([]);
  const [savedStoryModes, setSavedStoryModes] = useState<{name: string, chapter: number, data: any}[]>([]);
  const [showStoryLoader, setShowStoryLoader] = useState(false);
  const [history, setHistory] = useState<{nodes: TalentNode[], connections: Connection[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [unconnectedNodes, setUnconnectedNodes] = useState<Set<string>>(new Set());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [currentSaveName, setCurrentSaveName] = useState<string | null>(null);
  const [showStorySaveDialog, setShowStorySaveDialog] = useState(false);
  const [storySaveName, setStorySaveName] = useState<string>("");
  
  // Convex queries and mutations
  const templates = useQuery(api.mekTreeTemplates.getAllTemplates);
  const createTemplate = useMutation(api.mekTreeTemplates.createTemplate);
  const updateTemplate = useMutation(api.mekTreeTemplates.updateTemplate);
  const deleteTemplate = useMutation(api.mekTreeTemplates.deleteTemplate);
  const createDefaultTemplates = useMutation(api.mekTreeTemplates.createDefaultTemplates);
  const saveStoryToDatabase = useMutation(api.storyTrees.saveStoryTree);
  
  // Load saved spells from localStorage
  useEffect(() => {
    try {
      const spells = localStorage.getItem('savedSpells');
      if (spells) {
        const parsed = JSON.parse(spells);
        setSavedSpells(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Failed to load saved spells:', error);
      setSavedSpells([]);
    }
  }, []);

  // Note: Wheel event is handled by onWheel prop on the canvas div
  // This prevents page scroll and enables zoom functionality
  
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
  }, [nodes.length, connections.length]);
  
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
  
  // Load saved story modes on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedStoryModes');
    if (saved) {
      setSavedStoryModes(JSON.parse(saved));
    }
  }, []);
  
  // History management
  const pushToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], connections: [...connections] });
    if (newHistory.length > 100) newHistory.shift(); // Keep max 100 history
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, connections, history, historyIndex]);
  
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setConnections(prevState.connections);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setConnections(nextState.connections);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);
  
  // Auto-set node type when selecting a node in story mode
  useEffect(() => {
    if (builderMode === 'story' && selectedNode) {
      const node = nodes.find(n => n.id === selectedNode);
      if (node && node.storyNodeType) {
        setStoryNodeEditMode(node.storyNodeType);
      }
    }
  }, [selectedNode, nodes, builderMode]);
  
  const saveToLocalStorage = async (saveName: string, isOverwrite: boolean = false) => {
    try {
      // Load existing saves
      const existingSaves = JSON.parse(localStorage.getItem('ciruTreeSaves') || '[]');
      
      const saveData = {
        name: saveName,
        data: { nodes, connections, savedAt: Date.now() },
        isActive: false
      };
      
      if (isOverwrite) {
        // Find and update existing save
        const existingIndex = existingSaves.findIndex((s: any) => s.name === saveName);
        if (existingIndex >= 0) {
          existingSaves[existingIndex] = saveData;
        } else {
          // If not found, add as new
          existingSaves.push(saveData);
        }
      } else {
        // Add new save
        existingSaves.push(saveData);
      }
      
      // Save back to localStorage
      localStorage.setItem('ciruTreeSaves', JSON.stringify(existingSaves));
      
      // Also save as the current working tree
      localStorage.setItem('talentTreeData', JSON.stringify(saveData.data));
      setHasUnsavedChanges(false);
      setCurrentSaveName(saveName);
      
      setSaveStatus("Saved as: " + saveName);
      setTimeout(() => setSaveStatus(""), 2000);
      return true;
    } catch (e) {
      console.error('Failed to save:', e);
      setSaveStatus("Save failed");
      setTimeout(() => setSaveStatus(""), 3000);
      return false;
    }
  };

  const handleSaveClick = () => {
    setShowSaveDialog(true);
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
        if (parsed?.nodes && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
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

  const generateStoryNodes = (algorithm: 'diamond' | 'organic' | 'wave') => {
    const nodeCountInput = document.getElementById('storyNodeCount') as HTMLInputElement;
    const maxWidthInput = document.getElementById('storyMaxWidth') as HTMLInputElement;
    
    const nodeCount = parseInt(nodeCountInput?.value || '50');
    const maxWidth = parseInt(maxWidthInput?.value || '5');
    
    const newNodes: TalentNode[] = [];
    const newConnections: Connection[] = [];
    
    // Calculate vertical spacing based on node count
    const verticalSpacing = 120;
    const horizontalSpacing = 150;
    const startX = 1500; // Center X position
    const startY = 2800; // Start from bottom (high Y value)
    
    // Generate nodes in levels from bottom to top
    const nodesPerLevel = Math.ceil(nodeCount / 20); // Roughly 20 levels
    const totalLevels = Math.ceil(nodeCount / nodesPerLevel);
    
    let nodeId = 0;
    const levelNodes: Map<number, TalentNode[]> = new Map();
    
    // Generate nodes level by level (bottom to top)
    for (let level = 0; level < totalLevels && nodeId < nodeCount; level++) {
      const levelNodeList: TalentNode[] = [];
      let nodesInThisLevel = nodesPerLevel;
      
      // Vary the width based on algorithm
      if (algorithm === 'diamond') {
        // Diamond shape: narrow at top and bottom, wide in middle
        const midLevel = totalLevels / 2;
        const distFromMid = Math.abs(level - midLevel) / midLevel;
        nodesInThisLevel = Math.max(1, Math.round(maxWidth * (1 - distFromMid * 0.7)));
      } else if (algorithm === 'wave') {
        // Wave pattern
        nodesInThisLevel = Math.max(1, Math.round(maxWidth * (0.5 + 0.5 * Math.sin(level * 0.5))));
      } else {
        // Organic: random variation
        nodesInThisLevel = Math.max(1, Math.min(maxWidth, Math.round(Math.random() * maxWidth) + 1));
      }
      
      nodesInThisLevel = Math.min(nodesInThisLevel, nodeCount - nodeId);
      
      // Calculate X positions for nodes in this level
      const levelWidth = (nodesInThisLevel - 1) * horizontalSpacing;
      const levelStartX = startX - levelWidth / 2;
      
      for (let i = 0; i < nodesInThisLevel && nodeId < nodeCount; i++) {
        const node: TalentNode = {
          id: `node_${nodeId}`,
          name: `Node ${nodeId + 1}`,
          x: levelStartX + (i * horizontalSpacing),
          y: startY - (level * verticalSpacing),
          tier: level,
          desc: `Story node at level ${level}`,
          xp: 0
        };
        
        newNodes.push(node);
        levelNodeList.push(node);
        nodeId++;
      }
      
      levelNodes.set(level, levelNodeList);
    }
    
    // Create connections between levels
    for (let level = 0; level < totalLevels - 1; level++) {
      const currentLevel = levelNodes.get(level) || [];
      const nextLevel = levelNodes.get(level + 1) || [];
      
      if (currentLevel.length === 0 || nextLevel.length === 0) continue;
      
      // Connect each node to 1-3 nodes in the next level
      currentLevel.forEach(node => {
        // Determine which nodes in next level to connect to
        const connections = algorithm === 'organic' 
          ? Math.min(nextLevel.length, Math.floor(Math.random() * 3) + 1)
          : Math.min(2, nextLevel.length);
        
        // Find closest nodes in next level
        const sortedByDistance = [...nextLevel].sort((a, b) => {
          const distA = Math.abs(a.x - node.x);
          const distB = Math.abs(b.x - node.x);
          return distA - distB;
        });
        
        for (let i = 0; i < connections; i++) {
          const targetNode = sortedByDistance[i];
          if (targetNode && !newConnections.some(c => 
            (c.from === node.id && c.to === targetNode.id) ||
            (c.from === targetNode.id && c.to === node.id)
          )) {
            newConnections.push({
              from: node.id,
              to: targetNode.id
            });
          }
        }
      });
    }
    
    // Replace existing nodes and connections
    setNodes(newNodes);
    setConnections(newConnections);
    
    // Center view on the middle of the tower
    if (canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const towerHeight = totalLevels * verticalSpacing;
      const centerY = startY - (towerHeight / 2);
      
      setPanOffset({ 
        x: canvasRect.width / 2 - startX,
        y: canvasRect.height / 2 - centerY
      });
    }
    
    setSaveStatus(`Generated ${nodeCount} story nodes`);
    setTimeout(() => setSaveStatus(""), 2000);
  };
  
  const allVariations = useMemo(() => getAllVariations(), []);
  const filteredVariations = useMemo(() => 
    variationSearch
      ? allVariations.filter(v => 
          v.name.toLowerCase().includes(variationSearch.toLowerCase())
        )
      : allVariations,
    [allVariations, variationSearch]
  );

  const GRID_SIZE = 20;

  const snapPosition = useCallback((value: number): number => {
    if (!snapToGrid) return value;
    // Snap to grid dots: first dot is at GRID_SIZE/2 (10), then every GRID_SIZE (20) after
    // So dots are at: 10, 30, 50, 70, 90, 110, 130, 150, etc.
    const offset = GRID_SIZE / 2; // 10
    return Math.round((value - offset) / GRID_SIZE) * GRID_SIZE + offset;
  }, [snapToGrid]);

  const addNodeWithoutSnap = (x: number, y: number) => {
    // Generate unique ID with timestamp and random component for story mode
    const uniqueId = builderMode === 'story' 
      ? `ch${storyChapter}_node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : `node-${Date.now()}`;
    
    const newNode: TalentNode = {
      id: uniqueId,
      name: '',
      x: x, // Use exact coordinates without snapping
      y: y, // Use exact coordinates without snapping
      tier: 1,
      desc: '',
      xp: 0,
      goldCost: 0,
      essences: [],
      ingredients: [],
      isSpell: false
    };
    
    // Add story mode specific fields if in story mode
    if (builderMode === 'story') {
      newNode.storyNodeType = storyNodeEditMode;
      newNode.goldReward = 100;
      newNode.essenceRewards = [{ type: 'Fire', amount: 1 }];
      if (storyNodeEditMode === 'event') {
        newNode.eventName = 'Event Name';
        newNode.otherRewards = [];
      } else if (storyNodeEditMode === 'boss') {
        newNode.bossMekId = '';
        newNode.otherRewards = [];
      } else if (storyNodeEditMode === 'final_boss') {
        newNode.bossMekId = 'WREN';
        newNode.otherRewards = [{ item: 'Epic Loot Box', quantity: 1 }];
        newNode.goldReward = 10000;
      }
    }
    
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode.id);
    setEditingNode(newNode.id);
    
    // Push to history after a short delay to allow state to update
    setTimeout(() => {
      pushToHistory();
    }, 0);
  };

  const addNode = (name?: string, x?: number, y?: number, tier?: number) => {
    // Generate unique ID with timestamp and random component for story mode
    const uniqueId = builderMode === 'story' 
      ? `ch${storyChapter}_node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : `node-${Date.now()}`;
    
    const newNode: TalentNode = {
      id: uniqueId,
      name: name || '',
      x: snapPosition(x || 800),
      y: snapPosition(y || 400),
      tier: tier || 1,
      desc: '',
      xp: 0,
      goldCost: 0,
      essences: [],
      ingredients: [],
      isSpell: false  // Default to variation node, user can change in properties
    };
    
    // Add story mode specific fields if in story mode
    if (builderMode === 'story') {
      newNode.storyNodeType = storyNodeEditMode;
      newNode.goldReward = 100;
      newNode.essenceRewards = [{ type: 'Fire', amount: 1 }];
      if (storyNodeEditMode === 'event') {
        newNode.eventName = 'Event Name';
        newNode.otherRewards = [];
      } else if (storyNodeEditMode === 'boss') {
        newNode.bossMekId = '';
        newNode.otherRewards = [];
      } else if (storyNodeEditMode === 'final_boss') {
        newNode.bossMekId = 'WREN';
        newNode.otherRewards = [{ item: 'Epic Loot Box', quantity: 1 }];
        newNode.goldReward = 10000;
      }
    }
    
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode.id);
    setEditingNode(newNode.id);
    
    // Push to history after a short delay to allow state to update
    setTimeout(() => pushToHistory(), 100);
  };

  const deleteNode = useCallback((nodeId: string) => {
    if (nodeId === 'start' || nodeId.startsWith('start-')) {
      alert("Cannot delete START nodes!");
      return;
    }
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    setSelectedNode(prev => prev === nodeId ? null : prev);
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<TalentNode>) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  }, []);
  
  // Keyboard event handlers - must be after deleteNode is defined
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't process hotkeys if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Delete selected node
      if (e.key === 'Delete' && selectedNode && !editingNode) {
        deleteNode(selectedNode);
        pushToHistory();
      }
      
      // Undo (Ctrl+Z)
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Redo (Ctrl+Shift+Z or Ctrl+Y)
      if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        redo();
      }
      
      // Mode hotkeys (adjusted order)
      if (e.key === '1') {
        e.preventDefault();
        setMode('select');
      }
      if (e.key === '2') {
        e.preventDefault();
        setMode('add');
      }
      if (e.key === '3') {
        e.preventDefault();
        setMode('connect');
        setConnectFrom(null);
      }
      
      // Story mode node type hotkeys
      if (builderMode === 'story') {
        if (e.key === 'q' || e.key === 'Q') {
          e.preventDefault();
          setStoryNodeEditMode('normal');
        }
        if (e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          setStoryNodeEditMode('event');
        }
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          setStoryNodeEditMode('boss');
        }
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          setStoryNodeEditMode('final_boss');
        }
        
        // Toggle challenger status with 'C' key
        if ((e.key === 'c' || e.key === 'C') && selectedNode) {
          e.preventDefault();
          const node = nodes.find(n => n.id === selectedNode);
          if (node && (node.storyNodeType === 'normal' || !node.storyNodeType)) {
            updateNode(selectedNode, { challenger: !node.challenger });
            setSaveStatus(`${node.challenger ? 'Removed' : 'Added'} challenger status`);
            setTimeout(() => setSaveStatus(""), 2000);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, editingNode, deleteNode, pushToHistory, undo, redo, builderMode, mode, nodes, updateNode]);

  const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (mode === 'connect') {
      if (!connectFrom) {
        setConnectFrom(nodeId);
      } else if (connectFrom !== nodeId) {
        setConnections(prev => {
          const exists = prev.some(
            c => (c.from === connectFrom && c.to === nodeId) || 
                 (c.from === nodeId && c.to === connectFrom)
          );
          
          if (!exists) {
            pushToHistory(); // Save state before connection
            return [...prev, { from: connectFrom, to: nodeId }];
          }
          return prev;
        });
        // Chain connection: set the target as the new source for next connection
        setConnectFrom(nodeId);
      }
    } else if (mode === 'select' || mode === 'add') {
      // Allow selection in both select and add modes
      setSelectedNode(prev => prev === nodeId ? null : nodeId);
    }
  }, [mode, connectFrom, pushToHistory]);

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
    // In story mode with bottom anchor, we need to handle Y differently
    const worldX = (e.clientX - rect.left - panOffset.x) / zoom - dragState.offsetX;
    let worldY = (e.clientY - rect.top - panOffset.y) / zoom - dragState.offsetY;
    
    // In story mode, the grid is anchored at the bottom, but dragging should still feel natural
    // No inversion needed - the calculation is already correct
    
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
    
    // Handle middle mouse button for panning in any mode
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    
    // Clear connection when clicking empty space in connect mode
    if (mode === 'connect' && e.button === 0) {
      setConnectFrom(null);
      return;
    }
    
    // If in add mode, add a node at clicked position
    if (mode === 'add' && e.button === 0) { // Left click only
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Calculate the exact click position in canvas coordinates
      const clickX = (e.clientX - rect.left - panOffset.x) / zoom;
      const clickY = (e.clientY - rect.top - panOffset.y) / zoom;
      
      // First snap the click position to grid if needed
      const snappedX = snapPosition(clickX);
      const snappedY = snapPosition(clickY);
      
      // Then subtract the node radius to center it on the snapped position
      let nodeRadius = 15; // Default for 30px node
      if (builderMode === 'story') {
        // Adjust for different story mode node sizes
        if (storyNodeEditMode === 'normal') nodeRadius = 20; // Half of 40px
        else if (storyNodeEditMode === 'event') nodeRadius = 40; // Half of 80px
        else if (storyNodeEditMode === 'boss') nodeRadius = 60; // Half of 120px
        else if (storyNodeEditMode === 'final_boss') nodeRadius = 80; // Half of 160px
      }
      
      const x = snappedX - nodeRadius;
      const y = snappedY - nodeRadius;
      
      // Pass the already-positioned coordinates, don't snap again
      addNodeWithoutSnap(x, y);
      return;
    }
    
    // Start panning if in select mode and left click
    if (mode === 'select' && e.button === 0) {
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

  const testConnections = () => {
    const connectedNodes = new Set<string>();
    
    // Add all nodes that have connections
    connections.forEach(conn => {
      connectedNodes.add(conn.from);
      connectedNodes.add(conn.to);
    });
    
    // Find nodes that have no connections
    const unconnected = new Set<string>();
    nodes.forEach(node => {
      if (!connectedNodes.has(node.id)) {
        unconnected.add(node.id);
      }
    });
    
    setUnconnectedNodes(unconnected);
    
    if (unconnected.size > 0) {
      setSaveStatus(`Found ${unconnected.size} unconnected node(s)`);
      setTimeout(() => setSaveStatus(""), 3000);
    } else {
      setSaveStatus("All nodes are connected!");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  const clearConnectionTest = () => {
    setUnconnectedNodes(new Set());
    setSaveStatus("Cleared connection test");
    setTimeout(() => setSaveStatus(""), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
      {/* Back to Site Button */}
      <div className="fixed top-4 left-4 z-30">
        <a 
          href="/hub"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-zinc-700 to-zinc-800 border border-zinc-600 hover:border-yellow-400/50 text-yellow-400 font-bold text-sm uppercase tracking-wider transition-all hover:scale-105 hover:shadow-[0_0_10px_rgba(250,182,23,0.3)]"
        >
          ← BACK TO SITE
        </a>
      </div>
      
      {/* Top Control Panel */}
      <div className="fixed top-[60px] left-0 right-0 z-20 bg-gray-900/95 backdrop-blur-sm border-b border-yellow-400/30">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-yellow-400">
              {builderMode === 'circutree' ? 'CiruTree Builder' : 
               builderMode === 'mek' ? 'Mek Template Builder' :
               'Story Mode Builder'}
            </h1>
            
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => {
                  setBuilderMode('circutree');
                  // Clear current nodes and start fresh
                  setNodes([]);
                  setConnections([]);
                  setPanOffset({ x: 0, y: 0 });
                  setZoom(1);
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
              <button
                onClick={() => {
                  setBuilderMode('story');
                  // Initialize with a single starting node at bottom center
                  const startNode = {
                    id: 'start',
                    name: 'Start',
                    x: 3000 - 25, // Center of grid at 3000px - half of 50px start node size
                    y: 5950 - 50, // Bottom of 6000px grid - start node size (50px)
                    tier: 0,
                    desc: 'Chapter Start',
                    xp: 0
                    // No storyNodeType for start node - it has its own special styling
                  };
                  setNodes([startNode]);
                  setConnections([]);
                  // Center the viewport on the start node
                  if (canvasRef.current) {
                    const canvasRect = canvasRef.current.getBoundingClientRect();
                    const viewportHeight = canvasRect.height;
                    // Show start node near bottom of viewport
                    setPanOffset({
                      x: -2850, // Center on runway (3000px - 150px viewport offset)
                      y: -(5900 - viewportHeight + 150)  // Show start node 150px from viewport bottom
                    });
                  } else {
                    // Fallback if canvas not ready
                    setPanOffset({ x: -2850, y: -5300 });
                  }
                  setZoom(1);
                }}
                className={`px-3 py-1 rounded transition-all ${
                  builderMode === 'story' 
                    ? 'bg-green-500 text-white font-bold' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Story Mode
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
              <button onClick={handleSaveClick} className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700 text-white">
                Save
              </button>
              <button onClick={() => setShowCiruTreeLoader(true)} className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white">
                Load
              </button>
              <button onClick={startNewTree} className="px-3 py-1 text-sm rounded bg-purple-600 hover:bg-purple-700 text-white">
                New Tree
              </button>
              <button 
                onClick={testConnections} 
                className="px-3 py-1 text-sm rounded bg-yellow-600 hover:bg-yellow-700 text-white"
                title="Test if all nodes have connections"
              >
                Test Connections
              </button>
              {unconnectedNodes.size > 0 && (
                <button 
                  onClick={clearConnectionTest} 
                  className="px-3 py-1 text-sm rounded bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Clear Test
                </button>
              )}
            </>
          )}
          
          {builderMode === 'mek' && (
            <>
              <button 
                onClick={async () => {
                  let name = templateName;
                  if (!name) {
                    name = prompt('Enter template name:');
                    if (!name) return;
                    setTemplateName(name);
                  }
                  
                  const description = templateDescription || prompt('Enter template description (optional):') || 'Custom Mek template';
                  if (description) setTemplateDescription(description);
                  
                  try {
                    // Clean nodes to only include fields valid for Mek templates
                    const cleanedNodes = nodes.map(node => ({
                      id: node.id,
                      name: node.name,
                      x: node.x,
                      y: node.y,
                      tier: node.tier,
                      desc: node.desc,
                      xp: node.xp,
                      ...(node.unlocked !== undefined && { unlocked: node.unlocked }),
                      ...(node.nodeType && { nodeType: node.nodeType }),
                      ...(node.statBonus && { statBonus: node.statBonus }),
                      ...(node.abilityId && { abilityId: node.abilityId }),
                      ...(node.passiveEffect && { passiveEffect: node.passiveEffect }),
                      ...(node.buffGrant && { buffGrant: node.buffGrant }),
                    }));
                    
                    if (selectedTemplateId) {
                      await updateTemplate({
                        templateId: selectedTemplateId,
                        nodes: cleanedNodes,
                        connections,
                      });
                      setSaveStatus('Template updated!');
                    } else {
                      const id = await createTemplate({
                        name: name,
                        description: description,
                        category: 'custom',
                        nodes: cleanedNodes,
                        connections,
                      });
                      setSelectedTemplateId(id);
                      setSaveStatus('Template created: ' + name);
                      // Refresh templates list
                      setShowTemplateManager(false);
                      setTimeout(() => setShowTemplateManager(true), 100);
                    }
                    setTimeout(() => setSaveStatus(''), 3000);
                  } catch (e: unknown) {
                    const errorMsg = getErrorMessage(e);
                    if (errorMsg.includes('already exists')) {
                      alert('A template with this name already exists. Please choose a different name.');
                    } else {
                      alert('Error saving template: ' + errorMsg);
                    }
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
          
          {builderMode === 'story' && (
            <div className="space-y-2">
              {/* Node Counters */}
              <div className="flex items-center gap-4 bg-gray-800/50 px-3 py-2 rounded">
                <span className="text-xs text-gray-400">Nodes:</span>
                <span className="text-xs text-blue-400">
                  Normal: {nodes.filter(n => n.id !== 'start' && (n.storyNodeType === 'normal' || !n.storyNodeType) && !n.challenger).length}
                </span>
                <span className="text-xs text-orange-400">
                  Challenger: {nodes.filter(n => n.id !== 'start' && (n.storyNodeType === 'normal' || !n.storyNodeType) && n.challenger).length}
                </span>
                <span className="text-xs text-purple-400">
                  Event: {nodes.filter(n => n.storyNodeType === 'event').length}
                </span>
                <span className="text-xs text-red-400">
                  Boss: {nodes.filter(n => n.storyNodeType === 'boss').length}
                </span>
                <span className="text-xs text-yellow-400">
                  Final Boss: {nodes.filter(n => n.storyNodeType === 'final_boss').length}
                </span>
                <span className="text-xs text-gray-300 ml-2 border-l border-gray-600 pl-2">
                  Total: {nodes.filter(n => n.id !== 'start').length}
                </span>
              </div>
              
              {/* First Row */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* Chapter Selector */}
                <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Chapter:</label>
                <select 
                  value={storyChapter}
                  onChange={(e) => setStoryChapter(Number(e.target.value))}
                  className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Chapter {i + 1}</option>
                  ))}
                </select>
              </div>
              
              {/* Node Type Selector */}
              <div className="flex items-center gap-2 ml-4">
                <label className="text-xs text-gray-400">Node Type:</label>
                <div className="flex gap-1 bg-gray-800 p-1 rounded">
                  <button
                    onClick={() => setStoryNodeEditMode('normal')}
                    className={`px-2 py-1 text-xs rounded ${
                      storyNodeEditMode === 'normal' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Normal (Mek)
                  </button>
                  <button
                    onClick={() => setStoryNodeEditMode('event')}
                    className={`px-2 py-1 text-xs rounded ${
                      storyNodeEditMode === 'event' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Event (2x)
                  </button>
                  <button
                    onClick={() => setStoryNodeEditMode('boss')}
                    className={`px-2 py-1 text-xs rounded ${
                      storyNodeEditMode === 'boss' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Boss (3x)
                  </button>
                  <button
                    onClick={() => setStoryNodeEditMode('final_boss')}
                    className={`px-2 py-1 text-xs rounded ${
                      storyNodeEditMode === 'final_boss' 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    FINAL (4x)
                  </button>
                </div>
              </div>
              
              
              {/* Save/Load Buttons */}
              <button 
                onClick={() => {
                  setStorySaveName(`Chapter ${storyChapter} Layout`);
                  setShowStorySaveDialog(true);
                }}
                className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700 text-white ml-4"
              >
                Save
              </button>
              
              <button 
                onClick={() => setShowStoryLoader(true)}
                className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white"
              >
                Load
              </button>
              
              {/* Clear Button */}
              <button 
                onClick={() => {
                  if (confirm(`Clear all nodes for Chapter ${storyChapter}?`)) {
                    setNodes([{
                      id: 'start',
                      name: 'Start',
                      x: 3000 - 25, // Center of grid at 3000px - half of 50px start node size
                      y: 5950 - 50, // Bottom of 6000px grid - start node size (50px)
                      tier: 0,
                      desc: `Chapter ${storyChapter} Start`,
                      xp: 0,
                      storyNodeType: 'normal'
                    }]);
                    setConnections([]);
                    setSaveStatus(`Chapter ${storyChapter} cleared`);
                    setTimeout(() => setSaveStatus(""), 2000);
                  }
                }}
                className="px-3 py-1 text-sm rounded bg-red-600 hover:bg-red-700 text-white"
              >
                Clear Chapter
              </button>
              </div>
              
              {/* Second Row */}
              <div className="flex items-center gap-4">
                {/* Node Counter */}
                <div className="flex items-center gap-3 bg-gray-800/50 px-3 py-1 rounded">
                  <span className="text-xs text-gray-400">Nodes:</span>
                  <div className="flex gap-2 text-xs">
                    <span className="text-blue-400">N: {nodes.filter(n => n.storyNodeType === 'normal').length}</span>
                    <span className="text-purple-400">E: {nodes.filter(n => n.storyNodeType === 'event').length}</span>
                    <span className="text-red-400">B: {nodes.filter(n => n.storyNodeType === 'boss').length}</span>
                    <span className="text-orange-400">F: {nodes.filter(n => n.storyNodeType === 'final_boss').length}</span>
                    <span className="text-yellow-400">Total: {nodes.filter(n => n.storyNodeType).length}</span>
                  </div>
                </div>
              </div>
            </div>
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
        className="fixed left-0 right-0 bottom-0 bg-gray-950"
        style={{ top: '200px' }}
      >
        <div 
          className={`relative w-full h-full ${
            isPanning ? 'cursor-grabbing' :
            mode === 'add' ? 'cursor-crosshair' :
            mode === 'connect' ? 'cursor-pointer' :
            'cursor-grab'
          }`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={(e) => {
            // Prevent context menu on middle click
            if (e.button === 1) {
              e.preventDefault();
              return false;
            }
          }}
          onAuxClick={(e) => {
            // Prevent default behavior for middle mouse button
            if (e.button === 1) {
              e.preventDefault();
              return false;
            }
          }}
        >
          {/* Canvas Content */}
          <div 
            className="canvas-content absolute"
            style={{ 
              width: '6000px',  // Doubled grid size for all modes
              height: '6000px', // Doubled grid size for all modes
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0', // Standard top-left origin for all modes
              transition: dragState.isDragging || isPanning ? 'none' : 'transform 0.1s'
            }}
          >
            {/* Grid */}
            {showGrid && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.25 }}>
                <defs>
                  <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                    <circle cx={GRID_SIZE/2} cy={GRID_SIZE/2} r="1" fill="white"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            )}
            
            {/* Story Mode Runway Guidelines */}
            {builderMode === 'story' && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Left guideline */}
                <div 
                  className="absolute h-full bg-yellow-500"
                  style={{ 
                    left: '2850px', // Center at 3000px - 150px (half of 300px width)
                    width: '2px',
                    opacity: 0.3
                  }}
                />
                {/* Right guideline */}
                <div 
                  className="absolute h-full bg-yellow-500"
                  style={{ 
                    left: '3150px', // Center at 3000px + 150px (half of 300px width)
                    width: '2px',
                    opacity: 0.3
                  }}
                />
                {/* Center line */}
                <div 
                  className="absolute h-full bg-yellow-500"
                  style={{ 
                    left: '3000px',
                    width: '1px',
                    opacity: 0.2
                  }}
                />
                {/* Bottom marker line */}
                <div 
                  className="absolute w-full bg-red-500"
                  style={{ 
                    bottom: '50px', // Mark where the start node should be
                    height: '2px',
                    opacity: 0.3
                  }}
                />
                {/* Runway label */}
                <div 
                  className="absolute text-yellow-500 text-sm font-bold"
                  style={{ 
                    left: '3010px',
                    top: '10px',
                    opacity: 0.5
                  }}
                >
                  STORY RUNWAY (300px)
                </div>
              </div>
            )}
            
            {/* Connections */}
            {connections.map((conn, index) => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              
              if (!fromNode || !toNode) return null;
              
              const isFromStart = fromNode.id === 'start' || fromNode.id.startsWith('start-');
              const isToStart = toNode.id === 'start' || toNode.id.startsWith('start-');
              
              // Calculate center points of nodes based on actual sizes
              let fromRadius = 15;
              let toRadius = 15;
              
              if (isFromStart) fromRadius = 25;
              else if (builderMode === 'story' && fromNode.storyNodeType) {
                if (fromNode.storyNodeType === 'normal') fromRadius = 20;
                else if (fromNode.storyNodeType === 'event') fromRadius = 40;
                else if (fromNode.storyNodeType === 'boss') fromRadius = 60;
                else if (fromNode.storyNodeType === 'final_boss') fromRadius = 80;
              }
              
              if (isToStart) toRadius = 25;
              else if (builderMode === 'story' && toNode.storyNodeType) {
                if (toNode.storyNodeType === 'normal') toRadius = 20;
                else if (toNode.storyNodeType === 'event') toRadius = 40;
                else if (toNode.storyNodeType === 'boss') toRadius = 60;
                else if (toNode.storyNodeType === 'final_boss') toRadius = 80;
              }
              
              const fromCenterX = fromNode.x + fromRadius;
              const fromCenterY = fromNode.y + fromRadius;
              const toCenterX = toNode.x + toRadius;
              const toCenterY = toNode.y + toRadius;
              
              const dx = toCenterX - fromCenterX;
              const dy = toCenterY - fromCenterY;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * 180 / Math.PI;
              
              return (
                <div
                  key={index}
                  className="absolute cursor-pointer hover:bg-red-500"
                  style={{
                    width: `${length}px`,
                    height: '3px',
                    left: `${fromCenterX}px`,
                    top: `${fromCenterY}px`,
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
              const isUnconnected = unconnectedNodes.has(node.id);
              
              // Determine size based on story node type
              let nodeSize = '30px';
              if (isStart) nodeSize = '50px';
              else if (builderMode === 'story' && node.storyNodeType) {
                if (node.storyNodeType === 'normal') nodeSize = '40px';
                else if (node.storyNodeType === 'event') nodeSize = '80px';
                else if (node.storyNodeType === 'boss') nodeSize = '120px';
                else if (node.storyNodeType === 'final_boss') nodeSize = '160px';
              }
              
              // Determine shape and color
              let borderRadius = '50%'; // Default circle
              let background = '#6b7280';
              
              if (isStart) {
                background = 'radial-gradient(circle, #00ff88, #00cc66)';
              } else if (builderMode === 'story' && node.storyNodeType) {
                if (node.storyNodeType === 'normal') {
                  borderRadius = '8px'; // Square for normal mek nodes
                  // Check if it's a challenger node
                  if (node.challenger) {
                    background = 'linear-gradient(135deg, #ff8c00, #ffa500)'; // Orange gradient for challenger
                  } else {
                    background = '#3b82f6'; // Blue for regular
                  }
                } else if (node.storyNodeType === 'event') {
                  borderRadius = '50%'; // Round for event nodes
                  background = 'linear-gradient(135deg, #a855f7, #c084fc)'; // Purple gradient
                } else if (node.storyNodeType === 'boss') {
                  borderRadius = '8px'; // Square for boss nodes
                  background = 'linear-gradient(135deg, #dc2626, #ef4444)'; // Red gradient
                } else if (node.storyNodeType === 'final_boss') {
                  borderRadius = '12px'; // Square for final boss
                  background = 'linear-gradient(135deg, #f97316, #fbbf24, #f97316)'; // Orange/Gold gradient
                }
              } else if (builderMode === 'story' && !node.storyNodeType) {
                // Default to normal node style if in story mode but no type set
                borderRadius = '8px';
                if (node.challenger) {
                  background = 'linear-gradient(135deg, #ff8c00, #ffa500)'; // Orange gradient for challenger
                } else {
                  background = '#3b82f6'; // Blue for regular
                }
              } else if (node.isSpell) {
                borderRadius = '4px';
                background = 'linear-gradient(135deg, #9333ea, #c084fc)';
              } else if (node.nodeType === 'stat') {
                background = '#3b82f6';
              } else if (node.nodeType === 'ability') {
                background = '#a855f7';
              } else if (node.nodeType === 'passive') {
                background = '#f97316';
              } else if (node.nodeType === 'special') {
                background = '#ef4444';
              }
              
              return (
                <div key={node.id}>
                  <div
                    className={`talent-node absolute flex items-center justify-center cursor-move transition-all duration-200`}
                  style={{
                    width: nodeSize,
                    height: nodeSize,
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    background,
                    border: `3px solid ${
                      isUnconnected ? '#ff0000' : isSelected ? '#fbbf24' : isConnecting ? '#10b981' : 'transparent'
                    }`,
                    animation: isUnconnected ? 'pulse-red 1.5s ease-in-out infinite' : 'none',
                    borderRadius,
                    boxShadow: isUnconnected ? '0 0 30px rgba(255, 0, 0, 0.8)' :
                              isSelected ? '0 0 20px rgba(251, 191, 36, 0.5)' : 
                              isConnecting ? '0 0 20px rgba(16, 185, 129, 0.5)' :
                              isStart ? '0 0 15px rgba(0, 255, 136, 0.5)' : 
                              node.storyNodeType === 'boss' ? '0 0 15px rgba(239, 68, 68, 0.5)' : 
                              node.storyNodeType === 'final_boss' ? '0 0 25px rgba(251, 191, 36, 0.8)' : 'none',
                    zIndex: isSelected ? 20 : 10,
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                  }}
                  onClick={(e) => handleNodeClick(node.id, e)}
                  onMouseDown={(e) => handleMouseDown(node.id, e)}
                  onDoubleClick={() => setEditingNode(node.id)}
                >
                  {node.imageUrl ? (
                    <img 
                      src={node.imageUrl} 
                      alt={node.name}
                      className={`w-full h-full object-cover pointer-events-none ${borderRadius === '50%' ? 'rounded-full' : 'rounded'}`}
                    />
                  ) : (
                    <div className="text-xs font-bold text-white pointer-events-none flex flex-col items-center justify-center">
                      {builderMode === 'story' && node.storyNodeType === 'final_boss' ? (
                        <span className="text-4xl">🔥</span>
                      ) : builderMode === 'story' && node.storyNodeType === 'boss' ? (
                        <span className="text-lg">👑</span>
                      ) : builderMode === 'story' && node.storyNodeType === 'event' ? (
                        <span className="text-base">❓</span>
                      ) : builderMode === 'story' && (node.storyNodeType === 'normal' || !node.storyNodeType) && node.challenger ? (
                        <span className="text-base">⚡</span>
                      ) : (
                        node.tier
                      )}
                    </div>
                  )}
                </div>
                {/* Node name label */}
                {node.name && (
                  <div 
                    className="absolute pointer-events-none text-xs text-white font-medium"
                    style={{
                      left: `${node.x + parseInt(nodeSize) / 2}px`,
                      top: `${node.y + parseInt(nodeSize) + 5}px`,
                      transform: 'translateX(-50%)',
                      width: '100px',
                      textAlign: 'center',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)'
                    }}
                  >
                    {node.name}
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
                      setShowEssencePicker(false); // Close other dropdowns
                    }
                  }}
                  onBlur={() => {
                    // Delay to allow clicking on dropdown items
                    setTimeout(() => setShowVariationPicker(false), 200);
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
                  <label className="text-xs text-gray-400">Completed Nodes to Get Here</label>
                  <input
                    type="number"
                    value={(() => {
                      // Calculate minimum nodes needed to reach this node
                      const visited = new Set<string>();
                      const queue = [{ nodeId: node.id, distance: 0 }];
                      let maxDistance = 0;
                      
                      // Find all paths from start node
                      const startNode = nodes.find(n => n.id === 'start');
                      if (!startNode) return 0;
                      
                      // Simple BFS to find shortest path from start
                      const getDistance = (targetId: string): number => {
                        const visited = new Set<string>();
                        const queue = [{ id: 'start', dist: 0 }];
                        
                        while (queue.length > 0) {
                          const { id, dist } = queue.shift()!;
                          if (id === targetId) return dist;
                          if (visited.has(id)) continue;
                          visited.add(id);
                          
                          connections
                            .filter(c => c.from === id)
                            .forEach(c => queue.push({ id: c.to, dist: dist + 1 }));
                        }
                        return 0;
                      };
                      
                      return getDistance(node.id);
                    })()}
                    readOnly
                    className="w-full px-2 py-1 bg-gray-700 text-gray-400 rounded text-sm cursor-not-allowed"
                    title="Auto-calculated based on connections from start node"
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
                  {/* Node Type Selector */}
                  <div>
                    <label className="text-xs text-gray-400">Node Type</label>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => updateNode(node.id, { isSpell: false })}
                        className={`flex-1 px-2 py-1 text-sm rounded ${
                          !node.isSpell ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Variation
                      </button>
                      <button
                        onClick={() => updateNode(node.id, { isSpell: true })}
                        className={`flex-1 px-2 py-1 text-sm rounded ${
                          node.isSpell ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Spell
                      </button>
                    </div>
                  </div>
                  
                  {/* Spell-specific fields */}
                  {node.isSpell ? (
                    <>
                      {/* Spell Selection from Saved Spells */}
                      <div>
                        <label className="text-xs text-gray-400">Select Spell</label>
                        <select
                          value={node.spellType || ''}
                          onChange={(e) => {
                            const spell = savedSpells.find(s => s.id === e.target.value);
                            if (spell) {
                              updateNode(node.id, {
                                spellType: spell.id,
                                name: spell.name,
                                desc: spell.description,
                                goldCost: spell.unlockPrice.gold,
                                xp: spell.unlockPrice.level
                              });
                            } else {
                              updateNode(node.id, { spellType: e.target.value });
                            }
                          }}
                          className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                        >
                          <option value="">Select a spell...</option>
                          {savedSpells.length > 0 ? (
                            savedSpells.map(spell => (
                              <option key={spell.id} value={spell.id}>
                                {spell.name} ({spell.rarity})
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="placeholder1">No saved spells - Create in Spell Designer</option>
                            </>
                          )}
                        </select>
                      </div>
                      
                      {/* Display Spell Info */}
                      {node.spellType && savedSpells.find(s => s.id === node.spellType) && (
                        <div className="p-2 bg-gray-800/50 rounded text-xs">
                          <div className="text-yellow-400 mb-1">Spell Details:</div>
                          {(() => {
                            const spell = savedSpells.find(s => s.id === node.spellType);
                            return spell ? (
                              <>
                                <div>Flux: {spell.fluxAmount}</div>
                                <div>Cooldown: {spell.cooldown}s</div>
                                <div>Range: {spell.range}</div>
                                {spell.essenceRequirements?.length > 0 && (
                                  <div className="mt-1">
                                    <span className="text-gray-400">Essences:</span>
                                    {spell.essenceRequirements.map((e: any, i: number) => (
                                      <span key={i} className="ml-1">
                                        {e.type} x{e.amount}{i < spell.essenceRequirements.length - 1 ? ',' : ''}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : null;
                          })()}
                        </div>
                      )}
                      
                      {/* Special Ingredient */}
                      <div>
                        <label className="text-xs text-gray-400">Special Ingredient</label>
                        <input
                          type="text"
                          value={node.specialIngredient || ''}
                          onChange={(e) => updateNode(node.id, { specialIngredient: e.target.value })}
                          placeholder="e.g., Dragon Scale"
                          className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                        />
                      </div>
                    </>
                  ) : null}
                  
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
                  
                  {/* Frame Rewards */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Frame Reward</label>
                    <select
                      value={node.frameReward || ''}
                      onChange={(e) => updateNode(node.id, { frameReward: e.target.value || undefined })}
                      className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                    >
                      <option value="">No Frame Reward</option>
                      <option value="bronze">Bronze Frame</option>
                      <option value="silver">Silver Frame</option>
                      <option value="gold">Gold Frame</option>
                      <option value="diamond">Diamond Frame</option>
                      <option value="plasma">Plasma Frame</option>
                      <option value="wren">Wren Prestige Frame</option>
                      <option value="custom1">Custom Frame 1</option>
                      <option value="custom2">Custom Frame 2</option>
                    </select>
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
              
              {/* Story Mode specific fields */}
              {builderMode === 'story' && (
                <>
                  {/* Node Type Display */}
                  <div>
                    <label className="text-xs text-gray-400">Node Type</label>
                    <div className="px-2 py-1 bg-gray-800 rounded text-sm text-white capitalize">
                      {node.storyNodeType || 'normal'} 
                      {node.storyNodeType === 'normal' && ' (Mek Battle)'}
                      {node.storyNodeType === 'event' && ' (2x Size)'}
                      {node.storyNodeType === 'boss' && ' (3x Size)'}
                      {node.storyNodeType === 'final_boss' && ' (6x Size - WREN)'}
                    </div>
                  </div>
                  
                  {/* Challenger checkbox - only show for normal (mechanism) nodes */}
                  {(node.storyNodeType === 'normal' || !node.storyNodeType) && (
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`challenger-${node.id}`}
                          checked={node.challenger || false}
                          onChange={(e) => updateNode(node.id, { challenger: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                        />
                        <label htmlFor={`challenger-${node.id}`} className="text-sm text-orange-400 cursor-pointer">
                          Challenger (Higher Rank)
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-6">Press 'C' to toggle</p>
                    </div>
                  )}
                  
                  {/* Gold Reward */}
                  <div>
                    <label className="text-xs text-gray-400">Gold Reward</label>
                    <input
                      type="number"
                      value={node.goldReward || 0}
                      onChange={(e) => updateNode(node.id, { goldReward: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                      placeholder="e.g., 100"
                    />
                  </div>
                  
                  {/* Essence Rewards */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Essence Rewards</label>
                    <div className="space-y-2">
                      {(node.essenceRewards || []).map((essence, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={essence.type}
                            onChange={(e) => {
                              const newRewards = [...(node.essenceRewards || [])];
                              newRewards[index] = { ...newRewards[index], type: e.target.value };
                              updateNode(node.id, { essenceRewards: newRewards });
                            }}
                            placeholder="Type (e.g., Fire)"
                            className="flex-1 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                          />
                          <input
                            type="number"
                            value={essence.amount}
                            onChange={(e) => {
                              const newRewards = [...(node.essenceRewards || [])];
                              newRewards[index] = { ...newRewards[index], amount: parseInt(e.target.value) };
                              updateNode(node.id, { essenceRewards: newRewards });
                            }}
                            placeholder="Amount"
                            className="w-20 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                          />
                          <button
                            onClick={() => {
                              const newRewards = [...(node.essenceRewards || [])];
                              newRewards.splice(index, 1);
                              updateNode(node.id, { essenceRewards: newRewards });
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newRewards = [...(node.essenceRewards || []), { type: '', amount: 1 }];
                          updateNode(node.id, { essenceRewards: newRewards });
                        }}
                        className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        + Add Essence Reward
                      </button>
                    </div>
                  </div>
                  
                  {/* Event-specific fields */}
                  {node.storyNodeType === 'event' && (
                    <>
                      <div>
                        <label className="text-xs text-gray-400">Event Name</label>
                        <input
                          type="text"
                          value={node.eventName || ''}
                          onChange={(e) => updateNode(node.id, { eventName: e.target.value })}
                          className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                          placeholder="e.g., Ancient Ruins"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Other Rewards</label>
                        <div className="space-y-2">
                          {(node.otherRewards || []).map((reward, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={reward.item}
                                onChange={(e) => {
                                  const newRewards = [...(node.otherRewards || [])];
                                  newRewards[index] = { ...newRewards[index], item: e.target.value };
                                  updateNode(node.id, { otherRewards: newRewards });
                                }}
                                className="flex-1 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                                placeholder="Item name"
                              />
                              <input
                                type="number"
                                value={reward.quantity}
                                onChange={(e) => {
                                  const newRewards = [...(node.otherRewards || [])];
                                  newRewards[index] = { ...newRewards[index], quantity: parseInt(e.target.value) || 1 };
                                  updateNode(node.id, { otherRewards: newRewards });
                                }}
                                className="w-20 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                                placeholder="Qty"
                                min="1"
                              />
                              <button
                                onClick={() => {
                                  const newRewards = [...(node.otherRewards || [])];
                                  newRewards.splice(index, 1);
                                  updateNode(node.id, { otherRewards: newRewards });
                                }}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newRewards = [...(node.otherRewards || []), { item: '', quantity: 1 }];
                              updateNode(node.id, { otherRewards: newRewards });
                            }}
                            className="w-full px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                          >
                            + Add Other Reward
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Boss-specific fields */}
                  {(node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss') && (
                    <>
                      <div>
                        <label className="text-xs text-gray-400">Boss Mek ID</label>
                        <input
                          type="text"
                          value={node.bossMekId || ''}
                          onChange={(e) => updateNode(node.id, { bossMekId: e.target.value })}
                          className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                          placeholder="e.g., MEK_001 or Wren"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Boss Rewards</label>
                        <textarea
                          value={node.otherRewards || ''}
                          onChange={(e) => updateNode(node.id, { otherRewards: e.target.value })}
                          className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm h-20"
                          placeholder="e.g., Frame: Legendary, Badge: Chapter Complete"
                        />
                      </div>
                    </>
                  )}
                </>
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
                              
                              setCurrentSaveName(save.name);
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-yellow-400">
                Mek Template Manager {templates && `(${templates.length} templates)`}
              </h2>
              <button
                onClick={() => {
                  setShowTemplateManager(false);
                  setTimeout(() => setShowTemplateManager(true), 50);
                }}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
              >
                🔄 Refresh
              </button>
            </div>
            
            {(!templates || templates.length === 0) && (
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
                        {template.category && <span className="ml-2 text-purple-400">({template.category})</span>}
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
      
      {/* Story Mode Load Modal */}
      {showStoryLoader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Load Story Mode Layout</h2>
            
            <div className="flex-1 overflow-y-auto">
              {savedStoryModes.length === 0 ? (
                <p className="text-gray-400">No saved story layouts found</p>
              ) : (
                <div className="space-y-2">
                  {savedStoryModes.map((save, index) => (
                    <div key={index} className="bg-gray-800 rounded p-4 hover:bg-gray-700 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-white">{save.name}</h3>
                          <p className="text-sm text-gray-400">Chapter {save.chapter}</p>
                          <p className="text-xs text-gray-500">
                            {save.data.nodes.length} nodes, {save.data.connections.length} connections
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setNodes(save.data.nodes);
                              setConnections(save.data.connections);
                              setStoryChapter(save.chapter);
                              if (save.data.gridHeight) setStoryGridHeight(save.data.gridHeight);
                              setShowStoryLoader(false);
                              setSaveStatus(`Loaded "${save.name}"`);
                              setTimeout(() => setSaveStatus(""), 2000);
                              pushToHistory();
                            }}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${save.name}"?`)) {
                                const saved = savedStoryModes.filter((_, i) => i !== index);
                                setSavedStoryModes(saved);
                                localStorage.setItem('savedStoryModes', JSON.stringify(saved));
                              }
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowStoryLoader(false)}
              className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Save Dialog Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">Save Tree</h2>
            
            {/* Check if we have existing saves */}
            {(() => {
              const existingSaves = JSON.parse(localStorage.getItem('ciruTreeSaves') || '[]');
              const hasSaves = existingSaves.length > 0;
              
              return (
                <div className="space-y-4">
                  {currentSaveName && (
                    <div className="mb-4 p-3 bg-gray-800 rounded">
                      <p className="text-sm text-gray-400">Current save: <span className="text-yellow-400">{currentSaveName}</span></p>
                    </div>
                  )}
                  
                  {hasSaves && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-2">Overwrite existing save:</h3>
                      <select
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-yellow-400 mb-2"
                        onChange={(e) => {
                          if (e.target.value) {
                            saveToLocalStorage(e.target.value, true);
                            setShowSaveDialog(false);
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="">Select a save to overwrite...</option>
                        {existingSaves.map((save: any) => (
                          <option key={save.name} value={save.name}>
                            {save.name}
                          </option>
                        ))}
                      </select>
                      
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-gray-900 text-gray-400">OR</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Save as new file:</h3>
                    <input
                      type="text"
                      placeholder="Enter save name..."
                      className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-yellow-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          saveToLocalStorage(e.currentTarget.value, false);
                          setShowSaveDialog(false);
                        }
                      }}
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">Press Enter to save or leave blank for timestamp</p>
                  </div>
                  
                  <div className="flex gap-2 justify-end mt-6">
                    <button
                      onClick={() => {
                        const timestamp = new Date().toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        });
                        saveToLocalStorage(timestamp, false);
                        setShowSaveDialog(false);
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                    >
                      Quick Save (Timestamp)
                    </button>
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      
      {/* Story Save Dialog Modal */}
      {showStorySaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-yellow-400/30">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">Save Story Mode - Chapter {storyChapter}</h2>
            
            {/* Get the most recent save name for this chapter */}
            {(() => {
              const recentSave = savedStoryModes
                .filter(s => s.chapter === storyChapter)
                .sort((a, b) => savedStoryModes.indexOf(b) - savedStoryModes.indexOf(a))[0];
              const currentSaveName = recentSave?.name || `Chapter ${storyChapter} Layout`;
              
              return (
                <div className="space-y-4">
                  {recentSave && (
                    <div className="p-3 bg-gray-800 rounded">
                      <p className="text-sm text-gray-400">Current save: <span className="text-white">{currentSaveName}</span></p>
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex gap-3">
                    {recentSave && (
                      <button
                        onClick={async () => {
                          // Update existing save
                          const saved = savedStoryModes.filter(s => s.name !== currentSaveName);
                          saved.push({
                            name: currentSaveName,
                            chapter: storyChapter,
                            data: { nodes, connections }
                          });
                          setSavedStoryModes(saved);
                          localStorage.setItem('savedStoryModes', JSON.stringify(saved));
                          
                          // Save to database
                          try {
                            const dbNodes = nodes.map(node => ({
                              id: node.id,
                              x: node.x,
                              y: node.y,
                              label: node.name || node.label || 'Node',
                              index: node.index,
                              storyNodeType: node.storyNodeType || 'normal',
                              challenger: node.challenger,
                              completed: node.completed,
                              available: node.available,
                              current: node.current
                            }));
                            
                            await saveStoryToDatabase({
                              name: currentSaveName,
                              chapter: storyChapter,
                              nodes: dbNodes,
                              connections: connections
                            });
                            setSaveStatus(`✅ Updated "${currentSaveName}"`);
                          } catch (dbError) {
                            console.error('Database save error:', dbError);
                            setSaveStatus(`⚠️ Updated locally (cloud backup failed)`);
                          }
                          
                          setShowStorySaveDialog(false);
                          setTimeout(() => setSaveStatus(""), 3000);
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                      >
                        Update
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        // Create new save with timestamp
                        const timestamp = new Date().toLocaleString('en-US', { 
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        const newName = `Chapter ${storyChapter} - ${timestamp}`;
                        const saved = [...savedStoryModes];
                        saved.push({
                          name: newName,
                          chapter: storyChapter,
                          data: { nodes, connections }
                        });
                        setSavedStoryModes(saved);
                        localStorage.setItem('savedStoryModes', JSON.stringify(saved));
                        
                        // Save to database
                        try {
                          const dbNodes = nodes.map(node => ({
                            id: node.id,
                            x: node.x,
                            y: node.y,
                            label: node.name || node.label || 'Node',
                            index: node.index,
                            storyNodeType: node.storyNodeType || 'normal',
                            challenger: node.challenger,
                            completed: node.completed,
                            available: node.available,
                            current: node.current
                          }));
                          
                          await saveStoryToDatabase({
                            name: newName,
                            chapter: storyChapter,
                            nodes: dbNodes,
                            connections: connections
                          });
                          setSaveStatus(`✅ Saved as "${newName}"`);
                        } catch (dbError) {
                          console.error('Database save error:', dbError);
                          setSaveStatus(`⚠️ Saved locally (cloud backup failed)`);
                        }
                        
                        setShowStorySaveDialog(false);
                        setTimeout(() => setSaveStatus(""), 3000);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
                    >
                      Make New Save
                    </button>
                    <button
                      onClick={() => setShowStorySaveDialog(false)}
                      className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      
      {/* CSS for pulsing red animation */}
      <style jsx>{`
        @keyframes pulse-red {
          0%, 100% {
            opacity: 1;
            filter: drop-shadow(0 0 20px rgba(255, 0, 0, 0.8));
          }
          50% {
            opacity: 0.7;
            filter: drop-shadow(0 0 40px rgba(255, 0, 0, 1));
          }
        }
      `}</style>
    </div>
  );
}