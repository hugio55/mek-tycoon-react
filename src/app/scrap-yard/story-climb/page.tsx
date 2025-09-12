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
  const [eventImages, setEventImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 }); // For panning the tree
  const [isPanning, setIsPanning] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [zoom, setZoom] = useState(1);
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
  
  // Function to get a random event image for event nodes
  const getEventImage = useCallback((nodeId: string): string => {
    // Use node ID to deterministically select an event image
    let hash = 0;
    for (let i = 0; i < nodeId.length; i++) {
      hash = ((hash << 5) - hash) + nodeId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    // There are 154 event images (blank resize.webp and blank resize_2.webp through blank resize_154.webp)
    const totalEventImages = 154;
    const index = Math.abs(hash) % totalEventImages;
    
    // Return the correct filename
    if (index === 0) {
      return 'blank resize.webp';
    } else {
      return `blank resize_${index + 1}.webp`;
    }
  }, []);

  // Load images for nodes and wait for them to load
  useEffect(() => {
    if (!treeData) return;
    
    const loadImages = async () => {
      const imageMap = new Map<string, HTMLImageElement>();
      const eventImageMap = new Map<string, HTMLImageElement>();
      const promises: Promise<void>[] = [];
      
      for (const node of treeData.nodes) {
        if (node.storyNodeType === 'final_boss') {
          // Use rainbow.jpg for final boss
          const img = new Image();
          const promise = new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Still resolve on error to not block
          });
          img.src = '/random-images/rainbow.jpg';
          imageMap.set(node.id, img);
          promises.push(promise);
        } else if (node.storyNodeType === 'normal' || node.storyNodeType === 'boss') {
          // Load mek images for normal and boss nodes
          const imageName = getNodeImage(node.id);
          const img = new Image();
          const promise = new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Still resolve on error to not block
          });
          img.src = `/mek-images/150px/${imageName}`;
          imageMap.set(node.id, img);
          promises.push(promise);
        } else if (node.storyNodeType === 'event') {
          // Load event images for event nodes
          const eventImageName = getEventImage(node.id);
          const img = new Image();
          const promise = new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Still resolve on error to not block
          });
          // Note: The path needs to match the actual folder structure with spaces encoded
          img.src = `/event-images/450px webp/${eventImageName.replace(/ /g, '%20')}`;
          eventImageMap.set(node.id, img);
          promises.push(promise);
        }
      }
      
      setNodeImages(imageMap);
      setEventImages(eventImageMap);
      await Promise.all(promises);
      setImagesLoaded(true);
    };
    
    loadImages();
  }, [treeData, getNodeImage, getEventImage]);

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
    // Adjust positions for event/boss nodes - they need to be centered
    const nodes = treeData.nodes.map(node => {
      const adjustedNode = { ...node };
      
      // Event and boss nodes need position adjustment to center them
      // Slightly less offset to move them toward upper-left
      if (node.storyNodeType === 'event') {
        // Event nodes: a bit less offset for upper-left positioning, plus 5px upward
        adjustedNode.x = node.x + 25; // Reduced from 30
        adjustedNode.y = node.y + 20; // Reduced by 5px more for upward shift
      } else if (node.storyNodeType === 'boss') {
        // Boss nodes: shifted 5px to the right
        adjustedNode.x = node.x + 40; // Increased by 5px for rightward shift
        adjustedNode.y = node.y + 35;
      } else if (node.storyNodeType === 'final_boss') {
        // Final boss: center it like START node (needs more rightward shift)
        adjustedNode.x = node.x + 75; // Increased to center like START
        adjustedNode.y = node.y + 20; // Move 40px higher up (reduced from 60)
      }
      // Normal nodes don't need adjustment
      
      return adjustedNode;
    });
    // Calculate bounds INCLUDING node sizes
    let actualMinX = Infinity, actualMaxX = -Infinity;
    let actualMinY = Infinity, actualMaxY = -Infinity;
    
    // Calculate the actual bounds including node sizes
    nodes.forEach(node => {
      let nodeSize = 26; // normal nodes 5% larger
      if (node.id === 'start') nodeSize = 44; // 10% bigger
      else if (node.storyNodeType === 'event') nodeSize = 66; // 10% bigger
      else if (node.storyNodeType === 'boss') nodeSize = 90; // 12% bigger (was 88)
      else if (node.storyNodeType === 'final_boss') nodeSize = 150; // 50% bigger total
      
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
    
    // Calculate scale based on tree width, but we'll adjust positioning for centering
    const padding = 30; // Slightly more padding for safety
    const scaleX = (canvas.width - padding * 2) / treeWidth; // Scale based on node centers, not full width
    const scale = scaleX * 0.85; // Slightly larger scale to make tree bigger
    
    // Calculate total tree height when scaled
    const scaledTreeHeight = treeHeight * scale;
    
    // Transform function - position tree for viewport
    const transform = (x: number, y: number) => {
      const scaledX = (x - minX) * scale;
      const scaledY = (y - minY) * scale;
      
      // Center the START node horizontally in the canvas
      let offsetX;
      if (startNode) {
        // Calculate where the start node would be after scaling
        const startScaledX = (startNode.x - minX) * scale;
        // Center it by placing it at canvas.width / 2
        // Add a manual adjustment to compensate for visual centering
        const centerAdjustment = -15; // Shift 5px right from previous position
        offsetX = (canvas.width / 2) - startScaledX + centerAdjustment;
        
        // Debug logging (only log once per render cycle)
        if (Math.random() > 0.99) {
          console.log("START centering debug:", {
            canvasWidth: canvas.width,
            canvasCenter: canvas.width / 2,
            startNodeX: startNode.x,
            minX: minX,
            startScaledX: startScaledX,
            offsetX: offsetX,
            centerAdjustment: centerAdjustment,
            finalStartX: startScaledX + offsetX
          });
        }
      } else {
        // Fallback to centering the whole tree if no start node
        const leftOverflow = (minX - actualMinX) * scale;
        offsetX = padding + leftOverflow;
      }
      
      // Position the start node near the bottom of the canvas
      let offsetY;
      if (startNode) {
        // Always position based on start node
        const startScaledY = (startNode.y - minY) * scale;
        // Put start node at 85% down the canvas (lower position)
        offsetY = canvas.height * 0.85 - startScaledY + viewportOffset;
      } else {
        // Fallback if no start node
        offsetY = canvas.height - scaledTreeHeight + viewportOffset - padding;
      }
      
      return {
        x: scaledX + offsetX + panOffset.x,
        y: scaledY + offsetY + panOffset.y
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
      
      // Set node sizes - make all nodes bigger
      let nodeSize = 26; // normal nodes 5% larger (was 25)
      let fillColor = 'transparent'; // No fill for normal nodes
      let strokeColor = '#6b7280'; // gray for unavailable
      let strokeWidth = 2; // thin stroke
      
      if (node.id === 'start') {
        nodeSize = 44; // start node - 10% bigger (was 40)
        fillColor = '#10b981'; // green
        strokeColor = '#10b981';
        strokeWidth = 3;
      } else if (node.storyNodeType === 'event') {
        nodeSize = 66; // Event nodes - 10% bigger (was 60)
        fillColor = '#8b5cf6'; // purple
        strokeColor = '#6b7280'; // Will be updated after isAvailable is calculated
        strokeWidth = 2;
      } else if (node.storyNodeType === 'boss') {
        nodeSize = 90; // Boss nodes - 12% bigger (was 80, then 88, now +2%)
        fillColor = 'transparent'; // Will use custom rendering
        strokeColor = '#6b7280'; // Will be updated after isAvailable is calculated
        strokeWidth = 2;
      } else if (node.storyNodeType === 'final_boss') {
        nodeSize = 150; // Final boss - 50% bigger total (was 100, then 125, now 150)
        fillColor = 'transparent'; // Will use custom rendering
        strokeColor = '#6b7280'; // Will be updated after isAvailable is calculated
        strokeWidth = 2;
      }
      
      // Check if node is available (connected to a completed node)
      // Start node should never be "available" - it's the starting point
      // Only allow upward progression (target node must have lower Y value than completed nodes)
      const isAvailable = node.id !== 'start' && !isCompleted && treeData.connections.some(conn => {
        const otherNodeId = conn.from === node.id ? conn.to : (conn.to === node.id ? conn.from : null);
        if (!otherNodeId || !completedNodes.has(otherNodeId)) return false;
        
        // Find the Y value of the connected completed node
        const connectedNode = nodes.find(n => n.id === otherNodeId);
        if (!connectedNode) return false;
        
        // Only allow progression if target node is higher on screen (lower Y value)
        return node.y < connectedNode.y;
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
        
        // Draw event image if available
        if (eventImages.has(node.id)) {
          const img = eventImages.get(node.id)!;
          if (img.complete) {
            ctx.save();
            // Clip to circular shape
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, nodeSize - 3, 0, Math.PI * 2); // Slightly smaller to leave room for border
            ctx.clip();
            
            // Draw the event image centered and cropped (not squashed)
            // Use the image at its full height, center-cropped into circle
            const imgAspect = img.width / img.height;
            const circleSize = (nodeSize - 3) * 2;
            
            // Calculate source dimensions to maintain aspect ratio
            let srcWidth = img.width;
            let srcHeight = img.height;
            let srcX = 0;
            let srcY = 0;
            
            // If image is wider than tall, crop the sides
            if (imgAspect > 1) {
              srcWidth = img.height; // Make it square by using height
              srcX = (img.width - srcWidth) / 2; // Center horizontally
            } else if (imgAspect < 1) {
              // If image is taller than wide, crop top/bottom
              srcHeight = img.width; // Make it square by using width
              srcY = (img.height - srcHeight) / 2; // Center vertically
            }
            
            // Draw the image cropped and centered
            ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight,
                         pos.x - nodeSize + 3, pos.y - nodeSize + 3, circleSize, circleSize);
            
            // Add overlay effects based on state
            if (!isCompleted && !isAvailable) {
              // Darken unavailable nodes
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.arc(pos.x, pos.y, nodeSize - 3, 0, Math.PI * 2);
              ctx.fill();
            } else if (isCompleted) {
              // Green tint for completed
              ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
              ctx.arc(pos.x, pos.y, nodeSize - 3, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }
        }
        
        // Draw border
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeSize, 0, Math.PI * 2);
        ctx.stroke();
      } else if (node.storyNodeType === 'boss') {
        // DESIGN OPTION 1: Holographic Energy Shield
        const halfSize = nodeSize;
        const time = Date.now() / 1000;
        
        // Draw dark metallic base
        ctx.fillStyle = 'rgba(10, 10, 20, 0.9)';
        ctx.fillRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
        
        // Draw energy field layers
        for (let i = 3; i >= 0; i--) {
          const offset = i * 3;
          const alpha = 0.15 - (i * 0.03);
          
          // Animated energy field
          ctx.save();
          ctx.strokeStyle = isCompleted ? `rgba(16, 185, 129, ${alpha})` : 
                           isAvailable ? `rgba(239, 68, 68, ${alpha + Math.sin(time * 2) * 0.1})` : 
                           `rgba(107, 114, 128, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([10, 5]);
          ctx.lineDashOffset = time * 10;
          ctx.strokeRect(pos.x - halfSize - offset, pos.y - halfSize - offset, 
                        (halfSize + offset) * 2, (halfSize + offset) * 2);
          ctx.restore();
        }
        
        // Draw corner energy nodes
        const corners = [
          { x: pos.x - halfSize, y: pos.y - halfSize },
          { x: pos.x + halfSize, y: pos.y - halfSize },
          { x: pos.x + halfSize, y: pos.y + halfSize },
          { x: pos.x - halfSize, y: pos.y + halfSize }
        ];
        
        corners.forEach((corner, i) => {
          const pulse = Math.sin(time * 3 + i) * 0.5 + 0.5;
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = isCompleted ? 'rgba(16, 185, 129, 0.8)' :
                           isAvailable ? `rgba(239, 68, 68, ${0.5 + pulse * 0.5})` :
                           'rgba(107, 114, 128, 0.3)';
          ctx.fillStyle = isCompleted ? '#10b981' :
                         isAvailable ? '#ef4444' :
                         '#6b7280';
          ctx.beginPath();
          ctx.arc(corner.x, corner.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        
        // Draw tech pattern overlay
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = isCompleted ? '#10b981' : isAvailable ? '#ef4444' : '#6b7280';
        ctx.lineWidth = 0.5;
        
        // Circuit-like patterns
        for (let i = 0; i < 3; i++) {
          const y = pos.y - halfSize + (halfSize * 2 / 3) * (i + 0.5);
          ctx.beginPath();
          ctx.moveTo(pos.x - halfSize + 10, y);
          ctx.lineTo(pos.x + halfSize - 10, y);
          ctx.stroke();
        }
        ctx.restore();
        
        // Inner border with energy glow
        ctx.save();
        if (isAvailable) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
        }
        ctx.strokeStyle = isCompleted ? '#10b981' :
                         isAvailable ? '#ef4444' :
                         '#4b5563';
        ctx.lineWidth = isAvailable ? 2 : 1;
        ctx.strokeRect(pos.x - halfSize + 5, pos.y - halfSize + 5, 
                      halfSize * 2 - 10, halfSize * 2 - 10);
        ctx.restore();
        
        // Draw boss mech image
        if (nodeImages.has(node.id)) {
          const img = nodeImages.get(node.id)!;
          if (img.complete) {
            ctx.save();
            // Clip to inner rectangle
            ctx.beginPath();
            ctx.rect(pos.x - halfSize + 10, pos.y - halfSize + 10, 
                    halfSize * 2 - 20, halfSize * 2 - 20);
            ctx.clip();
            
            // Draw image
            ctx.globalAlpha = isCompleted ? 1 : isAvailable ? 0.9 : 0.4;
            ctx.drawImage(img, pos.x - halfSize + 10, pos.y - halfSize + 10, 
                         halfSize * 2 - 20, halfSize * 2 - 20);
            
            // Add color overlay
            if (isCompleted) {
              ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
              ctx.fillRect(pos.x - halfSize + 10, pos.y - halfSize + 10, 
                          halfSize * 2 - 20, halfSize * 2 - 20);
            } else if (!isAvailable) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
              ctx.fillRect(pos.x - halfSize + 10, pos.y - halfSize + 10, 
                          halfSize * 2 - 20, halfSize * 2 - 20);
            }
            ctx.restore();
          }
        }
        
      } else if (node.storyNodeType === 'final_boss') {
        // Epic Final Boss with Electrical Effects
        const halfSize = nodeSize;
        const time = Date.now() / 1000;
        
        // Draw dark metallic base (similar to mini-boss)
        ctx.fillStyle = 'rgba(10, 10, 20, 0.95)';
        ctx.fillRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
        
        // Draw multiple energy field layers (more intense than mini-boss)
        for (let i = 5; i >= 0; i--) {
          const offset = i * 4;
          const alpha = 0.2 - (i * 0.03);
          
          // Animated energy field with electrical effect
          ctx.save();
          ctx.strokeStyle = isCompleted ? `rgba(16, 185, 129, ${alpha})` : 
                           isAvailable ? `rgba(250, 182, 23, ${alpha + Math.sin(time * 3) * 0.15})` : 
                           `rgba(107, 114, 128, ${alpha})`;
          ctx.lineWidth = 2 - (i * 0.2);
          ctx.setLineDash([15, 8]);
          ctx.lineDashOffset = time * 15;
          ctx.strokeRect(pos.x - halfSize - offset, pos.y - halfSize - offset, 
                        (halfSize + offset) * 2, (halfSize + offset) * 2);
          ctx.restore();
        }
        
        // Draw electrical arcs from corners
        ctx.save();
        ctx.strokeStyle = isCompleted ? 'rgba(16, 185, 129, 0.6)' :
                         isAvailable ? 'rgba(250, 182, 23, 0.8)' :
                         'rgba(107, 114, 128, 0.3)';
        ctx.lineWidth = 2;
        ctx.globalAlpha = Math.random() > 0.3 ? 1 : 0; // Flickering effect
        
        // Random electrical arcs
        for (let i = 0; i < 4; i++) {
          if (Math.random() > 0.5) {
            ctx.beginPath();
            const startAngle = (i * Math.PI / 2) + time;
            const startX = pos.x + Math.cos(startAngle) * halfSize * 1.2;
            const startY = pos.y + Math.sin(startAngle) * halfSize * 1.2;
            
            // Create jagged lightning path
            ctx.moveTo(startX, startY);
            const steps = 5;
            for (let j = 1; j <= steps; j++) {
              const progress = j / steps;
              const endX = pos.x + (startX - pos.x) * (1 - progress);
              const endY = pos.y + (startY - pos.y) * (1 - progress);
              const offsetX = (Math.random() - 0.5) * 20;
              const offsetY = (Math.random() - 0.5) * 20;
              ctx.lineTo(endX + offsetX, endY + offsetY);
            }
            ctx.stroke();
          }
        }
        ctx.restore();
        
        // Draw corner energy nodes (larger and more intense than mini-boss)
        const corners = [
          { x: pos.x - halfSize, y: pos.y - halfSize },
          { x: pos.x + halfSize, y: pos.y - halfSize },
          { x: pos.x + halfSize, y: pos.y + halfSize },
          { x: pos.x - halfSize, y: pos.y + halfSize }
        ];
        
        corners.forEach((corner, i) => {
          const pulse = Math.sin(time * 4 + i) * 0.5 + 0.5;
          ctx.save();
          ctx.shadowBlur = 20;
          ctx.shadowColor = isCompleted ? 'rgba(16, 185, 129, 1)' :
                           isAvailable ? `rgba(250, 182, 23, ${0.7 + pulse * 0.3})` :
                           'rgba(107, 114, 128, 0.4)';
          ctx.fillStyle = isCompleted ? '#10b981' :
                         isAvailable ? '#fab617' :
                         '#6b7280';
          ctx.beginPath();
          ctx.arc(corner.x, corner.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        
        // Draw tech pattern overlay (more complex than mini-boss)
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = isCompleted ? '#10b981' : isAvailable ? '#fab617' : '#6b7280';
        ctx.lineWidth = 1;
        
        // Circuit patterns
        for (let i = 0; i < 5; i++) {
          const y = pos.y - halfSize + (halfSize * 2 / 5) * (i + 0.5);
          ctx.beginPath();
          ctx.moveTo(pos.x - halfSize + 15, y);
          ctx.lineTo(pos.x + halfSize - 15, y);
          ctx.stroke();
          
          // Add vertical connections
          if (i < 4) {
            const x = pos.x - halfSize * 0.5 + Math.random() * halfSize;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + (halfSize * 2 / 5));
            ctx.stroke();
          }
        }
        ctx.restore();
        
        // Draw final boss image (rainbow.jpg)
        if (nodeImages.has(node.id)) {
          const img = nodeImages.get(node.id)!;
          if (img.complete) {
            ctx.save();
            // Clip to inner rectangle
            ctx.beginPath();
            ctx.rect(pos.x - halfSize + 15, pos.y - halfSize + 15, 
                    halfSize * 2 - 30, halfSize * 2 - 30);
            ctx.clip();
            
            // Draw image
            ctx.globalAlpha = isCompleted ? 1 : isAvailable ? 0.95 : 0.3;
            ctx.drawImage(img, pos.x - halfSize + 15, pos.y - halfSize + 15, 
                         halfSize * 2 - 30, halfSize * 2 - 30);
            
            // Add color overlay
            if (isCompleted) {
              ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
              ctx.fillRect(pos.x - halfSize + 15, pos.y - halfSize + 15, 
                          halfSize * 2 - 30, halfSize * 2 - 30);
            } else if (!isAvailable) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.fillRect(pos.x - halfSize + 15, pos.y - halfSize + 15, 
                          halfSize * 2 - 30, halfSize * 2 - 30);
            }
            ctx.restore();
          }
        }
        
        // Inner border with intense glow
        ctx.save();
        if (isAvailable) {
          ctx.shadowBlur = 25;
          ctx.shadowColor = 'rgba(250, 182, 23, 0.8)';
        } else if (isCompleted) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = 'rgba(16, 185, 129, 0.7)';
        }
        ctx.strokeStyle = isCompleted ? '#10b981' :
                         isAvailable ? '#fab617' :
                         '#4b5563';
        ctx.lineWidth = isAvailable ? 3 : 2;
        ctx.strokeRect(pos.x - halfSize + 8, pos.y - halfSize + 8, 
                      halfSize * 2 - 16, halfSize * 2 - 16);
        ctx.restore();
        
      } else {
        // All others are squares (normal, boss, final boss, start)
        const halfSize = nodeSize;
        
        // Draw background only for non-normal nodes (including START node)
        if (node.storyNodeType !== 'normal' || node.id === 'start') {
          ctx.fillStyle = fillColor;
          ctx.fillRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
        }
        
        // Draw mechanism image for normal nodes (but NOT the start node)
        if (node.storyNodeType === 'normal' && node.id !== 'start' && nodeImages.has(node.id)) {
          const img = nodeImages.get(node.id)!;
          if (img.complete) {
            ctx.save();
            // Draw dark circular frame for mechanism nodes
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, halfSize, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
            ctx.fill();
            // Green border for completed nodes, dark border for others
            ctx.strokeStyle = isCompleted ? 'rgba(16, 185, 129, 0.8)' : 'rgba(60, 60, 80, 0.6)';
            ctx.lineWidth = isCompleted ? 2 : 1;
            ctx.stroke();
            
            // Clip to circular shape (slightly smaller for frame effect)
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, halfSize - 2, 0, Math.PI * 2);
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
            
            // Add green glow effect for completed mechanism nodes
            if (isCompleted) {
              ctx.save();
              ctx.shadowBlur = 10;
              ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, halfSize - 2, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.restore();
            }
            ctx.restore();
          }
        } else if ((node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss') && nodeImages.has(node.id)) {
          // Draw mechanism image for boss nodes with special framing
          const img = nodeImages.get(node.id)!;
          if (img.complete) {
            ctx.save();
            
            if (node.storyNodeType === 'boss') {
              // Boss: Draw image in center with tech frame
              const imageSize = halfSize * 1.2;
              
              // Create hexagonal clip for boss image
              ctx.beginPath();
              ctx.rect(pos.x - imageSize/2, pos.y - imageSize/2, imageSize, imageSize);
              ctx.clip();
              
              // Draw image
              ctx.globalAlpha = isCompleted ? 1 : isAvailable ? 0.9 : 0.4;
              ctx.drawImage(img, pos.x - imageSize/2, pos.y - imageSize/2, imageSize, imageSize);
              
              // Overlay effects
              if (!isCompleted && !isAvailable) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(pos.x - imageSize/2, pos.y - imageSize/2, imageSize, imageSize);
              } else if (isCompleted) {
                ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
                ctx.fillRect(pos.x - imageSize/2, pos.y - imageSize/2, imageSize, imageSize);
              } else if (isAvailable) {
                // Red tint for available boss
                ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
                ctx.fillRect(pos.x - imageSize/2, pos.y - imageSize/2, imageSize, imageSize);
              }
              
            } else if (node.storyNodeType === 'final_boss') {
              // Final Boss: Draw image with hexagonal mask
              const imageSize = halfSize * 0.7;
              
              // Create hexagonal clip
              ctx.beginPath();
              for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                const x = pos.x + Math.cos(angle) * imageSize;
                const y = pos.y + Math.sin(angle) * imageSize;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.closePath();
              ctx.clip();
              
              // Draw image
              ctx.globalAlpha = isCompleted ? 1 : isAvailable ? 0.95 : 0.3;
              ctx.drawImage(img, pos.x - imageSize, pos.y - imageSize, imageSize * 2, imageSize * 2);
              
              // Overlay effects
              if (!isCompleted && !isAvailable) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(pos.x - imageSize, pos.y - imageSize, imageSize * 2, imageSize * 2);
              } else if (isCompleted) {
                ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
                ctx.fillRect(pos.x - imageSize, pos.y - imageSize, imageSize * 2, imageSize * 2);
              } else if (isAvailable) {
                // Gold tint for available final boss
                ctx.fillStyle = 'rgba(250, 182, 23, 0.2)';
                ctx.fillRect(pos.x - imageSize, pos.y - imageSize, imageSize * 2, imageSize * 2);
              }
            }
            
            ctx.restore();
          }
        }
        
        // Draw border only for non-boss special nodes
        if ((node.storyNodeType !== 'normal' && node.storyNodeType !== 'boss' && node.storyNodeType !== 'final_boss') || node.id === 'start') {
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
        // Make START text much larger and position it inside the node
        ctx.font = 'bold 18px Orbitron';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('START', pos.x, pos.y);
        // Reset font for other nodes
        ctx.font = 'bold 10px Orbitron';
      } else if (node.storyNodeType === 'boss') {
        // Position text below the boss node
        ctx.font = 'bold 12px Orbitron';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('MINI BOSS', pos.x, pos.y + 90 + 20); // nodeSize + spacing
      } else if (node.storyNodeType === 'final_boss') {
        // Position text below the final boss node
        ctx.font = 'bold 14px Orbitron';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('FINAL BOSS', pos.x, pos.y + 150 + 25); // nodeSize + spacing
      } else if (node.storyNodeType === 'event') {
        ctx.fillText('EVENT', pos.x, pos.y);
      } else {
        // Normal nodes - show number if available
        const nodeNumber = node.label.match(/\d+/) || [''];
        ctx.fillText(nodeNumber[0], pos.x, pos.y);
      }
    });
    
    console.log("Canvas render complete");
  }, [treeData, canvasSize, viewportOffset, completedNodes, nodeImages, eventImages, imagesLoaded, panOffset, zoom]);

  // Handle mouse events for panning
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsMouseDown(true);
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setPanStart({ x: e.clientX, y: e.clientY });
    setHasDragged(false);
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDown) return;
    
    // Check if mouse moved enough to start panning (5 pixel threshold)
    const distance = Math.sqrt(
      Math.pow(e.clientX - mouseDownPos.x, 2) + 
      Math.pow(e.clientY - mouseDownPos.y, 2)
    );
    
    if (distance > 5) {
      setHasDragged(true);
      if (!isPanning) {
        setIsPanning(true);
      }
    }
    
    if (!isPanning) return;
    
    // Only allow vertical panning (no horizontal movement)
    const deltaY = e.clientY - panStart.y;
    
    setPanOffset(prev => {
      const newY = prev.y + deltaY;
      // For now, allow free scrolling. We can add limits later if needed
      // Scrolling down (positive Y) moves the tree up, scrolling up (negative Y) moves tree down
      return {
        x: 0, // Always keep X at 0 - no horizontal panning
        y: newY
      };
    });
    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isMouseDown, isPanning, mouseDownPos, panStart, treeData]);
  
  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    setIsPanning(false);
    // Don't clear hasDragged here - let click handler check it first
    // It will be cleared on next mousedown
  }, []);
  
  const handleMouseWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate world position before zoom
    const worldX = (mouseX - panOffset.x) / zoom;
    const worldY = (mouseY - panOffset.y) / zoom;
    
    // Apply zoom
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(3, zoom * delta));
    
    // Calculate new pan to keep mouse position fixed
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;
    
    setZoom(newZoom);
    setPanOffset({ 
      x: newPanX, 
      y: newPanY
    });
  }, [zoom, panOffset]);
  
  // Handle canvas click for node selection
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    console.log("Click handler called, hasDragged:", hasDragged);
    
    // Don't process clicks if we dragged
    if (hasDragged) {
      console.log("Click ignored due to dragging");
      return;
    }
    
    if (!canvasRef.current || !treeData) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Apply same position adjustments as in draw function
    const nodes = treeData.nodes.map(node => {
      const adjustedNode = { ...node };
      
      if (node.storyNodeType === 'event') {
        adjustedNode.x = node.x + 25; // Reduced for upper-left positioning
        adjustedNode.y = node.y + 20; // 5px more upward than other nodes
      } else if (node.storyNodeType === 'boss') {
        adjustedNode.x = node.x + 40; // Shifted 5px to the right  
        adjustedNode.y = node.y + 35;
      } else if (node.storyNodeType === 'final_boss') {
        adjustedNode.x = node.x + 75; // Center like START node
        adjustedNode.y = node.y + 20; // Move 40px higher up
      }
      
      return adjustedNode;
    });
    
    // Calculate bounds INCLUDING node sizes (same as draw function)
    let actualMinX = Infinity, actualMaxX = -Infinity;
    let actualMinY = Infinity, actualMaxY = -Infinity;
    
    nodes.forEach(node => {
      let nodeSize = 26; // normal nodes 5% larger
      if (node.id === 'start') nodeSize = 44; // 10% bigger
      else if (node.storyNodeType === 'event') nodeSize = 66; // 10% bigger
      else if (node.storyNodeType === 'boss') nodeSize = 90; // 12% bigger (was 88)
      else if (node.storyNodeType === 'final_boss') nodeSize = 150; // 50% bigger total
      
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
    
    const padding = 30;
    const scaleX = (canvas.width - padding * 2) / treeWidth;
    const scale = scaleX * 0.85; // Match the render function scale
    const scaledTreeHeight = treeHeight * scale;
    
    const startNodeInClick = nodes.find(n => n.id === 'start'); // Find start node first
    
    const transform = (nodeX: number, nodeY: number) => {
      const scaledX = (nodeX - minX) * scale;
      const scaledY = (nodeY - minY) * scale;
      
      // Use the same offset calculation as the draw function
      let offsetX;
      if (startNodeInClick) {
        const startScaledX = (startNodeInClick.x - minX) * scale;
        const centerAdjustment = -15; // Match the render function offset
        offsetX = (canvas.width / 2) - startScaledX + centerAdjustment;
      } else {
        const leftOverflow = (minX - actualMinX) * scale;
        const padding = 30;
        offsetX = padding + leftOverflow;
      }
      
      // Position the start node near the bottom of the canvas
      let offsetY;
      if (startNodeInClick) {
        const startScaledY = (startNodeInClick.y - minY) * scale;
        offsetY = canvas.height * 0.85 - startScaledY + viewportOffset;
      } else {
        offsetY = canvas.height - scaledTreeHeight + viewportOffset - padding;
      }
      
      return {
        x: scaledX + offsetX + panOffset.x,
        y: scaledY + offsetY + panOffset.y
      };
    };
    
    // Check if click is on any node
    for (const node of nodes) {
      const pos = transform(node.x, node.y);
      
      let nodeSize = 26; // normal nodes - MUST match render function
      if (node.id === 'start') nodeSize = 44;
      else if (node.storyNodeType === 'event') nodeSize = 66;
      else if (node.storyNodeType === 'boss') nodeSize = 90;
      else if (node.storyNodeType === 'final_boss') nodeSize = 150;
      
      let inBounds = false;
      if (node.storyNodeType === 'event' || node.storyNodeType === 'normal') {
        // Circle hit detection for events and normal mechanism nodes
        const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
        inBounds = distance <= nodeSize;
      } else {
        // Square hit detection for boss/final_boss/start - nodeSize is already the half-size
        inBounds = Math.abs(x - pos.x) <= nodeSize && Math.abs(y - pos.y) <= nodeSize;
      }
      
      if (inBounds) {
        // Don't allow selecting or clicking the start node
        if (node.id === 'start') {
          break;
        }
        
        // Debug: Check what connections exist for this node
        const nodeConnections = treeData.connections.filter(conn => 
          conn.from === node.id || conn.to === node.id
        );
        console.log(`Connections for ${node.id}:`, nodeConnections.length, nodeConnections);
        
        // Check if this node is adjacent to a completed node and allows upward progression
        const isAdjacent = treeData.connections.some(conn => {
          let connectedNodeId = null;
          if (conn.from === node.id) {
            connectedNodeId = conn.to;
          } else if (conn.to === node.id) {
            connectedNodeId = conn.from;
          }
          
          console.log(`Checking connection: from=${conn.from}, to=${conn.to}, connectedNodeId=${connectedNodeId}`);
          
          if (!connectedNodeId) {
            console.log('No connected node ID found');
            return false;
          }
          
          if (!completedNodes.has(connectedNodeId)) {
            console.log(`Connected node ${connectedNodeId} is not completed`);
            return false;
          }
          
          // Find the connected completed node
          const connectedNode = nodes.find(n => n.id === connectedNodeId);
          if (!connectedNode) {
            console.log(`Connected node ${connectedNodeId} not found in nodes array`);
            return false;
          }
          
          console.log(`Adjacency check for ${node.id}: connected to ${connectedNodeId}, node.y=${node.y}, connectedNode.y=${connectedNode.y}`);
          
          // Only allow upward progression (lower Y values = further up the tree)
          // Players can unlock nodes that are higher up (have lower Y values)
          return node.y < connectedNode.y;
        });
        
        // Only allow clicking if node is adjacent to a completed node
        if (!completedNodes.has(node.id) && isAdjacent) {
          setSelectedNode(node);
          const newCompleted = new Set(completedNodes);
          newCompleted.add(node.id);
          setCompletedNodes(newCompleted);
          
          // Auto-scroll to keep progressing nodes visible
          // Find the highest completed node
          let highestY = Infinity;
          newCompleted.forEach(nodeId => {
            const n = nodes.find(n => n.id === nodeId);
            if (n && n.y < highestY) {
              highestY = n.y;
            }
          });
          
          // Calculate if we need to scroll
          const highestPos = transform(0, highestY);
          if (highestPos.y < canvas.height * 0.25) {
            // Scroll up to keep the highest node in the lower third
            const scrollAmount = canvas.height * 0.5 - highestPos.y;
            setViewportOffset(prev => Math.max(0, prev + scrollAmount));
          }
        } else if (completedNodes.has(node.id)) {
          // Allow uncompleting nodes (for testing)
          const newCompleted = new Set(completedNodes);
          newCompleted.delete(node.id);
          setCompletedNodes(newCompleted);
        }
        break;
      }
    }
  }, [treeData, viewportOffset, completedNodes, canvasSize, hasDragged, panOffset, zoom]);

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
      let nodeSize = 26; // normal nodes 5% larger
      if (node.id === 'start') nodeSize = 44; // 10% bigger
      else if (node.storyNodeType === 'event') nodeSize = 66; // 10% bigger
      else if (node.storyNodeType === 'boss') nodeSize = 90; // 12% bigger (was 88)
      else if (node.storyNodeType === 'final_boss') nodeSize = 150; // 50% bigger total
      
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
    
    const padding = 30;
    const scaleX = (canvasSize.width - padding * 2) / treeWidth;
    const scale = scaleX * 0.75;
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
              className="relative rounded-lg" 
              style={{ 
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`,
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
                className={`absolute inset-0 ${isPanning ? 'cursor-grabbing' : 'cursor-pointer'}`}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleMouseWheel}
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