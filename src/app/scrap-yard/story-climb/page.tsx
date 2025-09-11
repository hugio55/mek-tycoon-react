"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import mekImagesList from './mek-images.json';

interface StoryNode {
  id: string;
  label: string;
  storyNodeType: "normal" | "boss" | "event" | "final_boss";
  x: number;
  y: number;
}

interface Connection {
  from: string;
  to: string;
}

export default function StoryClimbPage() {
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set(['start'])); // Start is always completed
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 900 }); // 2:3 aspect ratio
  const [viewportOffset, setViewportOffset] = useState(0); // For scrolling the tree - 0 means showing bottom of tree
  const [mounted, setMounted] = useState(false);
  const [nodeImages, setNodeImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Load the V1 story tree (primary) or Test 5 as fallback
  const storyTrees = useQuery(api.storyTrees.getAllStoryTrees);
  const v1Tree = storyTrees?.find(tree => tree.name === "V1");
  const test5Tree = storyTrees?.find(tree => tree.name === "test 5");
  
  const treeData = v1Tree || test5Tree; // Use V1 if available, otherwise fall back to Test 5
  
  // Debug logging
  useEffect(() => {
    console.log("Story trees from database:", storyTrees);
    console.log("V1 tree:", v1Tree);
    console.log("Test 5 tree:", test5Tree);
    console.log("Selected tree data:", treeData);
    if (treeData) {
      console.log("Number of nodes:", treeData.nodes?.length);
      console.log("Number of connections:", treeData.connections?.length);
      console.log("First few nodes:", treeData.nodes?.slice(0, 3));
    }
  }, [storyTrees, v1Tree, test5Tree, treeData]);

  // Function to get a deterministic image for each node
  const getNodeImage = useCallback((nodeId: string): string => {
    // Use node ID to deterministically select an image
    let hash = 0;
    for (let i = 0; i < nodeId.length; i++) {
      hash = ((hash << 5) - hash) + nodeId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % mekImagesList.length;
    return mekImagesList[index];
  }, []);

  // Load images for nodes and wait for them to load
  useEffect(() => {
    if (!treeData) return;
    
    const loadImages = async () => {
      const imageMap = new Map<string, HTMLImageElement>();
      const promises: Promise<void>[] = [];
      
      for (const node of treeData.nodes) {
        // Only load images for normal, boss, and final_boss nodes
        if (node.storyNodeType === 'normal' || node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss') {
          const imageName = getNodeImage(node.id);
          const img = new Image();
          const promise = new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Still resolve on error to not block
          });
          img.src = `/mek-images/150px/${imageName}`;
          imageMap.set(node.id, img);
          promises.push(promise);
        }
      }
      
      setNodeImages(imageMap);
      await Promise.all(promises);
      setImagesLoaded(true);
    };
    
    loadImages();
  }, [treeData, getNodeImage]);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate canvas size
  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = Math.floor(width * 1.5); // 2:3 aspect ratio
        console.log("Canvas size updated:", { width, height });
        setCanvasSize({ width, height });
      }
    };
    
    updateSize(); // Call immediately
    setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [mounted]);

  // Auto-scroll logic - only scroll when highest node crosses above lower third threshold
  useEffect(() => {
    if (!treeData || !canvasRef.current || canvasSize.width === 0) return;
    
    const nodes = treeData.nodes;
    const completedNodesList = nodes.filter(n => completedNodes.has(n.id));
    
    
    if (completedNodesList.length > 0) {
      // Find the highest completed node (lowest Y value = highest up the tree)
      const highestNode = completedNodesList.reduce((highest, node) => 
        node.y < highest.y ? node : highest
      );
      
      // Calculate tree bounds and scaling
      const minX = Math.min(...nodes.map(n => n.x));
      const maxX = Math.max(...nodes.map(n => n.x));
      const minY = Math.min(...nodes.map(n => n.y));
      const maxY = Math.max(...nodes.map(n => n.y));
      
      const treeWidth = maxX - minX;
      const treeHeight = maxY - minY;
      const padding = 40;
      const scaleX = (canvasSize.width - padding * 2) / treeWidth;
      const scale = scaleX * 0.9;
      const scaledTreeHeight = treeHeight * scale;
      
      // Calculate where the highest node WOULD appear on canvas with NO scrolling
      const scaledNodeY = (highestNode.y - minY) * scale;
      const nodeScreenYWithoutScroll = canvasSize.height - scaledTreeHeight - padding + scaledNodeY;
      
      // Define the threshold line at lower third of canvas (67% from top)
      const thresholdY = canvasSize.height * 0.67;
      
      
      // Only scroll if the highest node has risen ABOVE the threshold line (when unscrolled)
      if (nodeScreenYWithoutScroll < thresholdY) {
        // Calculate how much we need to scroll to keep the node at the threshold
        const scrollNeeded = thresholdY - nodeScreenYWithoutScroll;
        
        // Ensure we don't scroll past the bounds
        const maxPossibleOffset = Math.max(0, scaledTreeHeight - canvasSize.height + padding * 2);
        const targetOffset = Math.min(scrollNeeded, maxPossibleOffset);
        
        
        // Smooth scroll to the target position
        setViewportOffset(targetOffset);
      }
    }
  }, [treeData, completedNodes, canvasSize]); // Only depend on actual changes, not viewport

  // Draw the tree on canvas
  useEffect(() => {
    console.log("Canvas draw effect:", {
      hasCanvas: !!canvasRef.current,
      hasTreeData: !!treeData,
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height,
      imagesLoaded: imagesLoaded
    });
    
    // Don't require images to be loaded - render without them if needed
    if (!canvasRef.current || !treeData || canvasSize.width === 0) {
      console.log("Canvas draw skipped - missing core requirements");
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Find bounds of all nodes
    const nodes = treeData.nodes;
    // Calculate bounds INCLUDING node sizes
    let actualMinX = Infinity, actualMaxX = -Infinity;
    let actualMinY = Infinity, actualMaxY = -Infinity;
    
    // Calculate the actual bounds including node sizes
    nodes.forEach(node => {
      let nodeSize = 25; // normal nodes
      if (node.id === 'start') nodeSize = 40;
      else if (node.storyNodeType === 'event') nodeSize = 60;
      else if (node.storyNodeType === 'boss') nodeSize = 80;
      else if (node.storyNodeType === 'final_boss') nodeSize = 100;
      
      actualMinX = Math.min(actualMinX, node.x - nodeSize);
      actualMaxX = Math.max(actualMaxX, node.x + nodeSize);
      actualMinY = Math.min(actualMinY, node.y - nodeSize);
      actualMaxY = Math.max(actualMaxY, node.y + nodeSize);
    });
    
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y));
    
    // Find the start node position
    const startNode = nodes.find(n => n.id === 'start');
    if (startNode) {
      console.log("Start node position:", { x: startNode.x, y: startNode.y });
      console.log("Tree bounds:", { minX, maxX, minY, maxY });
      console.log("Actual bounds with node sizes:", { actualMinX, actualMaxX, actualMinY, actualMaxY });
    }
    
    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;
    const actualTreeWidth = actualMaxX - actualMinX;
    
    // Calculate scale to fit width INCLUDING node sizes
    const padding = 60; // Increased padding to ensure nodes don't clip
    const scaleX = (canvas.width - padding * 2) / actualTreeWidth;
    const scale = scaleX * 0.85; // Reduced scale factor to ensure everything fits
    
    // Calculate total tree height when scaled
    const scaledTreeHeight = treeHeight * scale;
    
    // Transform function - position tree for viewport
    const transform = (x: number, y: number) => {
      const scaledX = (x - minX) * scale;
      const scaledY = (y - minY) * scale;
      
      // Center the tree horizontally accounting for node sizes
      let offsetX = (canvas.width - treeWidth * scale) / 2;
      
      // Position the start node near the bottom of the canvas
      let offsetY;
      if (startNode) {
        // Always position based on start node
        const startScaledY = (startNode.y - minY) * scale;
        // Put start node at 75% down the canvas (more room for the node and START label)
        offsetY = canvas.height * 0.75 - startScaledY + viewportOffset;
      } else {
        // Fallback if no start node
        offsetY = canvas.height - scaledTreeHeight + viewportOffset - padding;
      }
      
      return {
        x: scaledX + offsetX,
        y: scaledY + offsetY
      };
    };
    
    // Only draw nodes and connections that are visible in viewport
    const isInViewport = (y: number) => {
      return y >= -100 && y <= canvas.height + 100;
    };
    
    // First pass: draw connections
    treeData.connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      
      if (fromNode && toNode) {
        const from = transform(fromNode.x, fromNode.y);
        const to = transform(toNode.x, toNode.y);
        
        // Only draw if at least one end is visible
        if (isInViewport(from.y) || isInViewport(to.y)) {
          // Check connection status
          const fromCompleted = completedNodes.has(fromNode.id);
          const toCompleted = completedNodes.has(toNode.id);
          const isAvailablePath = (fromCompleted && !toCompleted) || (toCompleted && !fromCompleted);
          
          ctx.save();
          if (isAvailablePath) {
            // Glowing connection to available nodes
            const glowIntensity = 0.5 + Math.sin(Date.now() / 500) * 0.3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(250, 182, 23, ${glowIntensity})`;
            ctx.strokeStyle = '#fab617';
            ctx.lineWidth = 3;
          } else if (fromCompleted && toCompleted) {
            // Completed connection - green with subtle glow
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
          } else {
            // Unavailable connection
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#4b5563';
            ctx.lineWidth = 1;
          }
          
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    });
    
    // Second pass: draw nodes
    console.log(`Drawing ${nodes.length} nodes`);
    nodes.forEach((node, index) => {
      // Transform node position
      let pos = transform(node.x, node.y);
      
      // Log START node position specifically
      if (node.id === 'start') {
        console.log(`START node transformed position: (${pos.x}, ${pos.y}), canvas height: ${canvas.height}`);
      }
      
      // Skip nodes outside viewport
      if (!isInViewport(pos.y)) {
        if (index < 5 || node.id === 'start') console.log(`Node ${node.id} skipped - outside viewport at y=${pos.y}`);
        return;
      }
      
      if (index < 5 || node.id === 'start') console.log(`Drawing node ${node.id} at (${pos.x}, ${pos.y})`)
      
      // Check if node is completed
      const isCompleted = completedNodes.has(node.id);
      
      // Set node sizes to match talent builder exactly
      let nodeSize = 25; // normal nodes
      let fillColor = 'transparent'; // No fill for normal nodes
      let strokeColor = '#6b7280'; // gray for unavailable
      let strokeWidth = 2; // thin stroke
      
      if (node.id === 'start') {
        nodeSize = 40; // start node
        fillColor = '#10b981'; // green
        strokeColor = '#10b981';
        strokeWidth = 3;
      } else if (node.storyNodeType === 'event') {
        nodeSize = 60; // MUCH bigger circles to match builder
        fillColor = '#8b5cf6'; // purple
        strokeColor = '#6b7280'; // Will be updated after isAvailable is calculated
        strokeWidth = 2;
      } else if (node.storyNodeType === 'boss') {
        nodeSize = 80; // MUCH larger squares to match builder
        fillColor = '#ef4444'; // red
        strokeColor = '#6b7280'; // Will be updated after isAvailable is calculated
        strokeWidth = 2;
      } else if (node.storyNodeType === 'final_boss') {
        nodeSize = 100; // EXTRA large square to match builder
        fillColor = '#fab617'; // gold
        strokeColor = '#6b7280'; // Will be updated after isAvailable is calculated
        strokeWidth = 2;
      }
      
      // Check if node is available (connected to a completed node)
      // Start node should never be "available" - it's the starting point
      const isAvailable = node.id !== 'start' && !isCompleted && treeData.connections.some(conn => {
        const otherNodeId = conn.from === node.id ? conn.to : (conn.to === node.id ? conn.from : null);
        return otherNodeId && completedNodes.has(otherNodeId);
      });
      
      // Update stroke color and width based on availability for non-mechanism nodes
      if (node.id !== 'start' && node.storyNodeType !== 'normal') {
        strokeColor = isCompleted ? '#10b981' : (isAvailable ? '#fab617' : '#6b7280');
        strokeWidth = isAvailable ? 3 : 2;
        if (node.storyNodeType === 'final_boss' && isAvailable) {
          strokeWidth = 4; // Thicker stroke for final boss
        }
      }
      
      // Draw glow for available or completed nodes (not for mechanism nodes)
      if ((isAvailable || isCompleted) && node.storyNodeType !== 'normal' && node.id !== 'start') {
        ctx.save();
        if (isAvailable) {
          const glowIntensity = 0.5 + Math.sin(Date.now() / 500) * 0.3;
          ctx.shadowBlur = 20;
          ctx.shadowColor = `rgba(250, 182, 23, ${glowIntensity})`;
        } else if (isCompleted) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
        }
        
        // Draw glow shape
        if (node.storyNodeType === 'event') {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, nodeSize, 0, Math.PI * 2);
          ctx.fillStyle = 'transparent';
          ctx.strokeStyle = isCompleted ? '#10b981' : '#fab617';
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        } else {
          ctx.strokeStyle = isCompleted ? '#10b981' : '#fab617';
          ctx.lineWidth = strokeWidth;
          ctx.strokeRect(pos.x - nodeSize, pos.y - nodeSize, nodeSize * 2, nodeSize * 2);
        }
        ctx.restore();
      }
      
      // Draw minimal shadow
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      
      // Draw node shape based on type
      if (node.storyNodeType === 'event') {
        // Events are circles (matching builder)
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      } else {
        // All others are squares (normal, boss, final boss, start)
        const halfSize = nodeSize;
        
        // Draw background only for non-normal nodes
        if (node.storyNodeType !== 'normal') {
          ctx.fillStyle = fillColor;
          ctx.fillRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
        }
        
        // Draw mechanism image for normal nodes (but NOT the start node)
        if (node.storyNodeType === 'normal' && node.id !== 'start' && nodeImages.has(node.id)) {
          const img = nodeImages.get(node.id)!;
          if (img.complete) {
            ctx.save();
            // Clip to square shape
            ctx.beginPath();
            ctx.rect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
            ctx.clip();
            
            // Draw image at full opacity always
            ctx.drawImage(img, pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
            
            // Draw darkening overlay for unavailable/non-completed nodes
            if (!isCompleted && !isAvailable) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.fillRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
            }
            // Draw green overlay for completed nodes
            else if (isCompleted) {
              ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
              ctx.fillRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
            }
            ctx.restore();
          }
        } else if ((node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss') && nodeImages.has(node.id)) {
          // Draw mechanism image for boss nodes too
          const img = nodeImages.get(node.id)!;
          if (img.complete) {
            ctx.save();
            const padding = 8;
            ctx.beginPath();
            ctx.rect(pos.x - halfSize + padding, pos.y - halfSize + padding, halfSize * 2 - padding * 2, halfSize * 2 - padding * 2);
            ctx.clip();
            
            // Draw image at full opacity
            ctx.drawImage(img, pos.x - halfSize + padding, pos.y - halfSize + padding, halfSize * 2 - padding * 2, halfSize * 2 - padding * 2);
            
            // Draw darkening overlay for unavailable nodes
            if (!isCompleted && !isAvailable) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.fillRect(pos.x - halfSize + padding, pos.y - halfSize + padding, halfSize * 2 - padding * 2, halfSize * 2 - padding * 2);
            }
            // Draw green overlay for completed nodes
            else if (isCompleted) {
              ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
              ctx.fillRect(pos.x - halfSize + padding, pos.y - halfSize + padding, halfSize * 2 - padding * 2, halfSize * 2 - padding * 2);
            }
            ctx.restore();
          }
        }
        
        // Draw border (but NOT for normal/mechanism nodes)
        if (node.storyNodeType !== 'normal') {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.strokeRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
        }
      }
      
      // Draw checkmark for completed nodes (only for event/boss nodes, not mechanisms)
      if (isCompleted && node.id !== 'start' && node.storyNodeType !== 'normal') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pos.x - nodeSize/4, pos.y);
        ctx.lineTo(pos.x - nodeSize/8, pos.y + nodeSize/4);
        ctx.lineTo(pos.x + nodeSize/4, pos.y - nodeSize/4);
        ctx.stroke();
      }
      
      // Draw node label
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (node.id === 'start') {
        ctx.fillText('START', pos.x, pos.y + nodeSize + 15);
      } else if (node.storyNodeType === 'boss') {
        ctx.fillText('BOSS', pos.x, pos.y);
      } else if (node.storyNodeType === 'final_boss') {
        ctx.fillStyle = '#000000';
        ctx.fillText('WREN', pos.x, pos.y);
      } else if (node.storyNodeType === 'event') {
        ctx.fillText('EVENT', pos.x, pos.y);
      } else {
        // Normal nodes - show number if available
        const nodeNumber = node.label.match(/\d+/) || [''];
        ctx.fillText(nodeNumber[0], pos.x, pos.y);
      }
    });
    
    console.log("Canvas render complete");
  }, [treeData, canvasSize, viewportOffset, completedNodes, nodeImages, imagesLoaded]);

  // Handle canvas click
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !treeData) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const nodes = treeData.nodes;
    
    // Calculate bounds INCLUDING node sizes (same as draw function)
    let actualMinX = Infinity, actualMaxX = -Infinity;
    let actualMinY = Infinity, actualMaxY = -Infinity;
    
    nodes.forEach(node => {
      let nodeSize = 25;
      if (node.id === 'start') nodeSize = 40;
      else if (node.storyNodeType === 'event') nodeSize = 60;
      else if (node.storyNodeType === 'boss') nodeSize = 80;
      else if (node.storyNodeType === 'final_boss') nodeSize = 100;
      
      actualMinX = Math.min(actualMinX, node.x - nodeSize);
      actualMaxX = Math.max(actualMaxX, node.x + nodeSize);
      actualMinY = Math.min(actualMinY, node.y - nodeSize);
      actualMaxY = Math.max(actualMaxY, node.y + nodeSize);
    });
    
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y));
    
    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;
    const actualTreeWidth = actualMaxX - actualMinX;
    
    const padding = 60;
    const scaleX = (canvas.width - padding * 2) / actualTreeWidth;
    const scale = scaleX * 0.85;
    const scaledTreeHeight = treeHeight * scale;
    
    const transform = (nodeX: number, nodeY: number) => {
      const scaledX = (nodeX - minX) * scale;
      const scaledY = (nodeY - minY) * scale;
      
      // Use the same offset calculation as the draw function
      let offsetX = (canvas.width - treeWidth * scale) / 2;
      
      // Position the start node near the bottom of the canvas
      let offsetY;
      const startNode = nodes.find(n => n.id === 'start');
      if (startNode) {
        const startScaledY = (startNode.y - minY) * scale;
        offsetY = canvas.height * 0.75 - startScaledY + viewportOffset;
      } else {
        offsetY = canvas.height - scaledTreeHeight + viewportOffset - padding;
      }
      
      return {
        x: scaledX + offsetX,
        y: scaledY + offsetY
      };
    };
    
    // Check if click is on any node
    for (const node of nodes) {
      const pos = transform(node.x, node.y);
      
      let nodeSize = 25; // normal nodes
      if (node.id === 'start') nodeSize = 40;
      else if (node.storyNodeType === 'event') nodeSize = 60; // Much bigger
      else if (node.storyNodeType === 'boss') nodeSize = 80; // Much larger
      else if (node.storyNodeType === 'final_boss') nodeSize = 100; // Extra large
      
      let inBounds = false;
      if (node.storyNodeType === 'event') {
        // Circle hit detection
        const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
        inBounds = distance <= nodeSize;
      } else {
        // Square hit detection - nodeSize is already the half-size
        inBounds = Math.abs(x - pos.x) <= nodeSize && Math.abs(y - pos.y) <= nodeSize;
      }
      
      if (inBounds) {
        // Don't allow selecting or clicking the start node
        if (node.id === 'start') {
          break;
        }
        
        setSelectedNode(node);
        
        // Toggle completion on click (for testing)
        if (!completedNodes.has(node.id)) {
          const newCompleted = new Set(completedNodes);
          newCompleted.add(node.id);
          setCompletedNodes(newCompleted);
        } else {
          // Allow uncompleting nodes
          const newCompleted = new Set(completedNodes);
          newCompleted.delete(node.id);
          setCompletedNodes(newCompleted);
        }
        break;
      }
    }
  }, [treeData, viewportOffset, completedNodes, canvasSize]);

  // Handle mouse wheel scrolling with proper isolation
  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!treeData || !canvasRef.current) return;
    
    // Prevent page scroll when over canvas
    event.preventDefault();
    event.stopPropagation();
    
    // Calculate max scroll based on tree size
    const nodes = treeData.nodes;
    
    // Calculate bounds INCLUDING node sizes
    let actualMinX = Infinity, actualMaxX = -Infinity;
    let actualMinY = Infinity, actualMaxY = -Infinity;
    
    nodes.forEach(node => {
      let nodeSize = 25;
      if (node.id === 'start') nodeSize = 40;
      else if (node.storyNodeType === 'event') nodeSize = 60;
      else if (node.storyNodeType === 'boss') nodeSize = 80;
      else if (node.storyNodeType === 'final_boss') nodeSize = 100;
      
      actualMinX = Math.min(actualMinX, node.x - nodeSize);
      actualMaxX = Math.max(actualMaxX, node.x + nodeSize);
      actualMinY = Math.min(actualMinY, node.y - nodeSize);
      actualMaxY = Math.max(actualMaxY, node.y + nodeSize);
    });
    
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y));
    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;
    const actualTreeWidth = actualMaxX - actualMinX;
    
    const padding = 60;
    const scaleX = (canvasSize.width - padding * 2) / actualTreeWidth;
    const scale = scaleX * 0.85;
    const scaledTreeHeight = treeHeight * scale;
    
    const maxPossibleOffset = Math.max(0, scaledTreeHeight - canvasSize.height + padding * 2);
    
    // Scroll with mouse wheel (inverted so scrolling down moves tree up)
    const scrollSpeed = 50;
    const newOffset = Math.max(0, Math.min(maxPossibleOffset, viewportOffset - event.deltaY * scrollSpeed / 100));
    setViewportOffset(newOffset);
  }, [treeData, viewportOffset, canvasSize]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Loading Story Mode...</div>
      </div>
    );
  }

  // Check if no tree data is available
  if (!treeData || !treeData.nodes || treeData.nodes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-500 text-xl mb-4">No Story Tree Data Found</div>
          <div className="text-gray-400">
            <p>Looking for "V1" or "test 5" story trees...</p>
            <p className="mt-2">Available trees: {storyTrees?.map(t => t.name).join(", ") || "None"}</p>
            <p className="mt-4 text-sm">Please create a story tree in the admin panel first.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-sm border-b-2 border-yellow-500/50 p-4 mb-6">
        <h1 className="text-2xl font-bold text-yellow-500 text-center font-orbitron tracking-wider">
          STORY MODE - CHAPTER 1
        </h1>
      </div>

      {/* Main Content - Normal width container */}
      <div className="max-w-[900px] mx-auto px-5">
        {/* Two Column Layout */}
        <div className="flex gap-4">
          {/* Left Column - Tree Canvas */}
          <div ref={containerRef} className="flex-1">
            {/* Canvas Container with Style Q background */}
            <div 
              className="relative rounded-lg overflow-hidden" 
              style={{ 
                aspectRatio: '2/3',
                background: 'rgba(255, 255, 255, 0.005)',
                backdropFilter: 'blur(1px)',
                border: '1px solid rgba(255, 255, 255, 0.015)',
                boxShadow: '0 0 25px rgba(0, 0, 0, 0.3) inset',
                touchAction: 'none'  // Prevent touch scrolling
              }}
              onWheel={handleWheel}
              onWheelCapture={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {/* Canvas */}
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="absolute inset-0 cursor-pointer"
                onClick={handleCanvasClick}
                style={{ imageRendering: 'crisp-edges' }}
              />
              
              {/* Fade gradient only at top */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black via-black/90 to-transparent pointer-events-none z-10" />
              
              {/* Corner decorations */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-yellow-500/50" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-yellow-500/50" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-yellow-500/50" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-yellow-500/50" />
            </div>
          </div>

          {/* Right Column - Details Pane */}
          <div className="w-[300px]">
            {/* Single frame for details */}
            <div className="bg-black/80 border-2 border-yellow-500/30 rounded-lg p-4 h-full overflow-y-auto">
                <h2 className="text-lg font-bold text-yellow-500 mb-3 font-orbitron tracking-wider">
                  MISSION DETAILS
                </h2>
                
                {/* Progress Counter */}
                <div className="mb-4 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <span className="text-xs text-gray-400 uppercase">Progress</span>
                  <p className="text-yellow-500 font-bold">
                    {completedNodes.size} / {treeData?.nodes.length || 0} Nodes
                  </p>
                </div>
                
                {selectedNode ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wider">Node ID</span>
                      <p className="text-white font-bold">{selectedNode.id}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wider">Status</span>
                      <p className={`font-bold ${completedNodes.has(selectedNode.id) ? 'text-green-500' : 'text-gray-400'}`}>
                        {completedNodes.has(selectedNode.id) ? '✓ COMPLETED' : 'INCOMPLETE'}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wider">Type</span>
                      <p className="text-yellow-500 font-bold capitalize">
                        {selectedNode.storyNodeType.replace('_', ' ')}
                      </p>
                    </div>
                    
                    {selectedNode.storyNodeType === 'boss' && (
                      <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded">
                        <p className="text-red-400 font-bold text-xs">⚠️ BOSS ENCOUNTER</p>
                        <p className="text-gray-300 text-xs mt-1">
                          Prepare for battle!
                        </p>
                      </div>
                    )}
                    
                    {selectedNode.storyNodeType === 'final_boss' && (
                      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
                        <p className="text-yellow-400 font-bold text-xs">🔥 FINAL BOSS</p>
                        <p className="text-gray-300 text-xs mt-1">
                          The ultimate challenge!
                        </p>
                      </div>
                    )}
                    
                    {selectedNode.storyNodeType === 'event' && (
                      <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded">
                        <p className="text-purple-400 font-bold text-xs">⚡ SPECIAL EVENT</p>
                        <p className="text-gray-300 text-xs mt-1">
                          Special rewards await!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">Click on a node to view details</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}