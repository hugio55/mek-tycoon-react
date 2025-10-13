/*
 * VARIATION 2: HOLOGRAPHIC HUD INTERFACE
 * ======================================
 *
 * DESIGN PHILOSOPHY:
 * - Inspired by sci-fi holographic displays and advanced HUD systems
 * - Translucent cyan/blue elements with glowing edges
 * - Floating information panels with depth and parallax
 * - Scan lines and holographic shimmer effects throughout
 * - Smooth animations and transitions for futuristic feel
 * - Mix of sharp geometry with soft glows
 *
 * KEY VISUAL ELEMENTS:
 * - Canvas: Dark with cyan grid lines and scan line animations
 * - Node connections: Glowing cyan paths with particle effects
 * - Mission cards: Translucent with holographic borders
 * - UI panels: Floating glass panels with depth shadows
 * - Typography: Clean sans-serif with cyan accent glows
 * - Interactive states: Holographic shimmer on hover
 *
 * COLOR PALETTE:
 * - Primary: #22d3ee (Cyan)
 * - Secondary: #8b5cf6 (Purple)
 * - Accent: #3b82f6 (Blue)
 * - Background: Deep black with cyan grid overlay
 */

"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import StoryMissionCard from '@/components/StoryMissionCard';
import { StyleK } from '@/components/ui/ShowcaseCards';
import MekRecruitmentModalV4 from '@/app/contracts/components/MekRecruitmentModalV4';
import { generateSampleMeks } from '@/app/contracts/utils/helpers';
import { leastRareMechanisms } from './least-rare-mechanisms';
import { createSeededRandomFromString } from '@/lib/seeded-random';
import { calculateChipRewardsForEvent } from '@/lib/chipRewardCalculator';
import { DifficultyLevel, DifficultyConfig, calculateRewards, calculateMekSlots } from '@/lib/difficultyModifiers';
import { StoryModeTitleCard } from '@/components/StoryModeTitleCards';
import '@/styles/story-title-cards.css';
import SuccessMeterV2 from '@/components/SuccessMeterV2';
import HolographicButton from '@/components/ui/SciFiButtons/HolographicButton';
import { createPortal } from 'react-dom';
import MissionCountdown from '@/components/MissionCountdown';
import CancelMissionLightbox from '@/components/CancelMissionLightbox';
import MintNFTLightbox from '@/components/MintNFTLightbox';
import ContractSlots, { ContractSlot } from '@/components/ContractSlots';


interface StoryNode {
  id: string;
  label: string;
  storyNodeType: "normal" | "boss" | "event" | "final_boss";
  x: number;
  y: number;
  challenger?: boolean;
}

interface Connection {
  from: string;
  to: string;
}

interface ExtendedStoryNode extends StoryNode {
  level?: number;
  nodeType?: 'normal' | 'boss' | 'elite' | 'event' | 'final_boss';
  title?: string;
}

// Simple hash function to generate consistent values from node IDs
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Format gold amounts for display
function formatGoldAmount(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${amount.toLocaleString()}`;
  return amount.toLocaleString();
}

export default function StoryClimbPage() {
  // Check for preview mode from URL params
  const [previewMode, setPreviewMode] = useState(false);
  const [previewSeed, setPreviewSeed] = useState('1');
  const [previewChapter, setPreviewChapter] = useState(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('preview');
      const seed = params.get('seed');
      const chapter = params.get('chapter');

      if (mode === 'true') {
        setPreviewMode(true);
        setPreviewSeed(seed || '1');
        setPreviewChapter(parseInt(chapter || '1'));
        // Start at normal zoom to see nodes properly
        setZoom(1);
        setViewportOffset(0); // Start at top to see START node
      }
    }
  }, []);

  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set(['start'])); // Start is always completed
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 762 }); // Canvas height set to 762px
  const [viewportOffset, setViewportOffset] = useState(0); // Start at top since START node is now 450px from top
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
  const [showJumpButton, setShowJumpButton] = useState(true);
  const [isJumping, setIsJumping] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showCancelLightbox, setShowCancelLightbox] = useState(false);
  const [pendingCancelNodeId, setPendingCancelNodeId] = useState<string | null>(null);
  const [showMintLightbox, setShowMintLightbox] = useState(false);
  const [deployingNodes, setDeployingNodes] = useState<Set<string>>(new Set());

  // Active missions and duration config queries (moved up to avoid hoisting issues)
  const activeMissions = useQuery(api.activeMissions.getActiveMissions);
  const startMission = useMutation(api.activeMissions.startMission);
  const cancelMission = useMutation(api.activeMissions.cancelMission);
  const completeMission = useMutation(api.activeMissions.completeMission);
  const forceCleanupMissions = useMutation(api.activeMissions.forceCleanupMissions);
  const activeDurationConfig = useQuery(api.durationConfigs.getActiveDurationConfig);

  // Story tree queries (moved up to avoid hoisting issues)
  const storyTrees = useQuery(api.storyTrees.getAllStoryTrees);
  const v2Tree = storyTrees?.find(tree => tree.name === "V2");
  const v1Tree = storyTrees?.find(tree => tree.name === "V1");
  const test5Tree = storyTrees?.find(tree => tree.name === "test 5");
  const treeData = v2Tree || v1Tree || test5Tree; // Use V2 if available, otherwise V1, then Test 5

  // Helper function to calculate duration based on node position and type
  const calculateNodeDuration = useCallback((node: StoryNode, nodeType: string) => {
    if (!activeDurationConfig || !treeData) return 15; // default fallback

    const config = (activeDurationConfig as any)[nodeType];
    if (!config || !config.min || !config.max) return 15;

    // Convert duration object to minutes
    const durationToMinutes = (dur: any) => {
      return (dur.days || 0) * 24 * 60 +
             (dur.hours || 0) * 60 +
             (dur.minutes || 0);
    };

    const minMinutes = durationToMinutes(config.min);
    const maxMinutes = durationToMinutes(config.max);

    // Find all nodes of the same type
    const sameTypeNodes = treeData.nodes.filter(n => {
      if (nodeType === 'challenger') {
        return n.storyNodeType === 'normal' && (n as any).challenger === true;
      }
      if (nodeType === 'normal') {
        return n.storyNodeType === 'normal' && !(n as any).challenger;
      }
      return n.storyNodeType === nodeType.replace('miniboss', 'boss').replace('finalboss', 'final_boss');
    });

    if (sameTypeNodes.length === 0) return minMinutes;

    // Sort by Y position (higher Y = lower on screen = earlier in progression)
    const sortedNodes = [...sameTypeNodes].sort((a, b) => b.y - a.y);

    // Find this node's position in the progression
    const nodeIndex = sortedNodes.findIndex(n => n.id === node.id);
    if (nodeIndex === -1) return minMinutes;

    // Calculate progression (0 = bottom/start, 1 = top/end)
    const progression = nodeIndex / Math.max(1, sortedNodes.length - 1);

    // Apply curve (default 1.5 for exponential growth)
    const curve = config.curve || 1.5;
    const curvedProgression = Math.pow(progression, curve);

    // Interpolate between min and max
    const duration = minMinutes + (maxMinutes - minMinutes) * curvedProgression;

    // Round to nearest 5 minutes
    return Math.round(duration / 5) * 5;
  }, [activeDurationConfig, treeData]);

  // Helper to get node rewards based on type
  // Placeholder for getNodeRewards - will be defined later after getEventDataForNode

  // Helper to get contract fee based on node type
  const getNodeContractFee = useCallback((node: ExtendedStoryNode) => {
    // Will use getNodeRewards once it's defined
    // For now, return a default fee
    const baseGold = node.storyNodeType === 'final_boss' ? 200000 :
                    node.storyNodeType === 'boss' ? 100000 :
                    node.storyNodeType === 'event' ? 75000 : 30000;
    return Math.floor(baseGold * 0.1); // 10% of gold reward as fee
  }, []);
  const [hoveredNode, setHoveredNode] = useState<StoryNode | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoverEffectStyle, setHoverEffectStyle] = useState(0); // Add missing hover effect style
  const [challengerFrameStyle, setChallengerFrameStyle] = useState<'spikes' | 'lightning' | 'sawblade' | 'flames' | 'crystals'>('spikes'); // For Challenger frame options
  // Challenger effect locked to Phase Shift (quantum2)
  const [debugMode, setDebugMode] = useState(true); // Debug mode to allow clicking any node - defaulting to true
  const [debugPanelMinimized, setDebugPanelMinimized] = useState(true); // State to minimize debug panel - starts minimized
  const [lockDifficultyPanelMinimized, setLockDifficultyPanelMinimized] = useState(true); // State for lock difficulty panel
  // Success Meter Card Layout - how title, bar, and status are combined
  const [successMeterCardLayout, setSuccessMeterCardLayout] = useState<1 | 2 | 3 | 4 | 5>(1); // 1 = current design (unchanged)
  const colorScheme = 'circuit' as const; // Locked to Holographic Circuit

  // Mission Statistics Tracking
  const [missionStats, setMissionStats] = useState({
    totalGold: 0,
    totalExperience: 0,
    easyCompleted: 0,
    mediumCompleted: 0,
    hardCompleted: 0
  });
  const [missionStatsLayout, setMissionStatsLayout] = useState<1 | 2 | 3 | 4 | 5>(1); // Layout variations for mission stats card

  // Test Panel Controls for Success Meter
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testSuccessRate, setTestSuccessRate] = useState(50);
  const [animationTick, setAnimationTick] = useState(0); // Minimal state for animation redraws
  const animationIdRef = useRef<number | null>(null); // Track animation ID for cleanup
  const [showMekModal, setShowMekModal] = useState<string | null>(null);
  const [selectedMekSlot, setSelectedMekSlot] = useState<{ missionId: string; slotIndex: number } | null>(null);
  const [selectedMeks, setSelectedMeks] = useState<Record<string, any[]>>({});
  const [nodeFadeStates, setNodeFadeStates] = useState<Map<string, number>>(new Map()); // Track fade animation for each node
  const [inactiveNodeTooltip, setInactiveNodeTooltip] = useState<{ x: number; y: number; visible: boolean; fading: boolean }>({ x: 0, y: 0, visible: false, fading: false });
  const [isHoveringDeployButton, setIsHoveringDeployButton] = useState(false);
  const [showDeployTooltip, setShowDeployTooltip] = useState(false);
  const [flashingMekSlots, setFlashingMekSlots] = useState(false);
  const [flashingFees, setFlashingFees] = useState(false);
  const [deployValidationErrors, setDeployValidationErrors] = useState<string[]>([]);
  const [showDeployValidationPopup, setShowDeployValidationPopup] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Contract Slots State
  const [contractSlots, setContractSlots] = useState<ContractSlot[]>([
    { id: 1, status: 'available' },
    { id: 2, status: 'locked', unlockChapter: 2 },
    { id: 3, status: 'locked', unlockChapter: 3 },
    { id: 4, status: 'locked', unlockChapter: 5 },
    { id: 5, status: 'locked', unlockChapter: 7 }
  ]);
  const [contractSlotColor, setContractSlotColor] = useState<'cyan' | 'purple' | 'gold' | 'emerald' | 'crimson'>('cyan');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [missionGlowStyle, setMissionGlowStyle] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Update current time for countdown displays
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  // Sync contract slots with active missions
  useEffect(() => {
    if (activeMissions) {
      console.log('Syncing contract slots with active missions:', activeMissions);
      setContractSlots(prev => {
        const updated = [...prev];

        // First, clear any slots that no longer have active missions
        updated.forEach(slot => {
          if (slot.status === 'active' && slot.nodeId) {
            const mission = activeMissions.find(m => m.nodeId === slot.nodeId);
            if (!mission) {
              slot.status = 'available';
              slot.nodeId = undefined;
              slot.startTime = undefined;
              slot.duration = undefined;
            }
          }
        });

        // Then, add or update active missions in slots
        activeMissions.forEach(mission => {
          // Check if this mission is already in a slot
          const existingSlot = updated.find(s => s.nodeId === mission.nodeId);
          if (existingSlot) {
            // Update existing slot with latest mission data
            existingSlot.status = 'active';
            existingSlot.nodeName = mission.nodeName || `Mek #${Math.floor(Math.random() * 9000) + 1000}`;
            existingSlot.startTime = mission.startTime;
            existingSlot.duration = mission.duration;
          } else {
            // Find first available slot for new mission
            const availableSlot = updated.find(s => s.status === 'available');
            if (availableSlot) {
              availableSlot.status = 'active';
              availableSlot.nodeId = mission.nodeId;
              availableSlot.nodeName = mission.nodeName || `Mek #${Math.floor(Math.random() * 9000) + 1000}`;
              availableSlot.startTime = mission.startTime;
              availableSlot.duration = mission.duration;
            }
          }
        });

        console.log('Updated contract slots:', updated);
        return updated;
      });
    }
  }, [activeMissions]);

  // Handle contract slot click - will be defined after handleNodeDeploy
  const handleContractSlotClick = useCallback((slot: ContractSlot) => {
    if (slot.status === 'available' && selectedNode) {
      // Start a mission in this slot
      const nodeToStart = selectedNode as ExtendedStoryNode;

      // Check if mission is already active
      if (activeMissions?.some(m => m.nodeId === nodeToStart.id)) {
        console.log('Mission already active for this node');
        return;
      }

      // Get duration based on node type and position
      let minutes = 15; // default
      const isChallenger = (nodeToStart as any).challenger === true;

      if (nodeToStart.storyNodeType === 'final_boss') {
        minutes = calculateNodeDuration(nodeToStart, 'finalboss');
      } else if (nodeToStart.storyNodeType === 'boss') {
        minutes = calculateNodeDuration(nodeToStart, 'miniboss');
      } else if (nodeToStart.storyNodeType === 'event') {
        minutes = calculateNodeDuration(nodeToStart, 'event');
      } else if (isChallenger) {
        minutes = calculateNodeDuration(nodeToStart, 'challenger');
      } else {
        minutes = calculateNodeDuration(nodeToStart, 'normal');
      }

      const durationMs = minutes * 60 * 1000;

      // Update contract slot to active
      setContractSlots(prev => prev.map(s =>
        s.id === slot.id
          ? { ...s, status: 'active' as const, nodeId: nodeToStart.id, startTime: Date.now(), duration: durationMs }
          : s
      ));

      // Start the actual mission - will be defined below
      // Note: handleNodeDeploy will be called after it's defined
    } else if (slot.status === 'active' && slot.nodeId) {
      // Show cancel lightbox for this slot's mission
      setPendingCancelNodeId(slot.nodeId);
      setShowCancelLightbox(true);
    }
  }, [selectedNode, activeDurationConfig, activeMissions, calculateNodeDuration]);

  // Difficulty system state
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
  // Locked to Crossed Out style
  const [completedDifficulties, setCompletedDifficulties] = useState<Record<string, Set<DifficultyLevel>>>({});
  const goldFrameStyle = 5; // Locked to Classical Laurel Wreath
  const difficultyConfigs = useQuery(api.difficultyConfigs.getAll);
  const currentDifficultyConfig = difficultyConfigs?.find(c => c.difficulty === selectedDifficulty) as DifficultyConfig | undefined;

  // Story trees already moved up to avoid hoisting issues

  // Parse deployed event nodes for direct access
  const [parsedConfig, setParsedConfig] = useState<any>(null);

  const [previewNodes, setPreviewNodes] = useState<StoryNode[] | null>(null);
  const [previewConnections, setPreviewConnections] = useState<Connection[] | null>(null);

  // Don't generate preview data - we'll use actual database trees
  useEffect(() => {
    if (previewMode) {
      // In preview mode, we just use the actual database trees (V2, V1, or test5)
      // The treeData will be set from the database queries below
      console.log('Preview mode active - using database tree data');
    }
  }, [previewMode]);

  // Tree data already declared above to avoid hoisting issues

  // Determine which chapter to load (currently fixed to Chapter 1)
  const currentChapter = previewMode ? previewChapter : 1;

  // Fetch deployed event data - OPTIMIZED new schema (~90% bandwidth reduction)
  // Uses per-chapter storage instead of giant JSON blob
  const activeDeployment = useQuery(api.storyClimbOptimized.getChapterData, {
    chapter: currentChapter
  });
  const attributeRarity = useQuery(api.attributeRarity.getAttributeRarity);
  const [deployedEventNodes, setDeployedEventNodes] = useState<Map<string, any>>(new Map());
  const [deployedNormalNodes, setDeployedNormalNodes] = useState<any[]>([]);
  const [deployedChallengerNodes, setDeployedChallengerNodes] = useState<any[]>([]);
  const [deployedMiniBossNodes, setDeployedMiniBossNodes] = useState<any[]>([]);
  const [deployedFinalBossNodes, setDeployedFinalBossNodes] = useState<any[]>([]);

  // Create mapping of event node IDs to their position in the tree
  const [eventNodePositionMap, setEventNodePositionMap] = useState<Map<string, number>>(new Map());

  // Process deployed event data into a Map for easy lookups
  useEffect(() => {
    // Check if there's any deployment at all
    if (!activeDeployment) {
      console.log('❌ NO ACTIVE DEPLOYMENT FOUND');
      console.log('📝 To fix this:');
      console.log('   1. Go to Admin Master Data page (/admin-master-data)');
      console.log('   2. Open "Story Climb Mechanics" section');
      console.log('   3. Configure event names and rewards');
      console.log('   4. Click "Deploy to Story Climb"');
      return;
    }

    console.log('🔍 DEPLOYMENT PIPELINE DEBUG:', {
      hasActiveDeployment: !!activeDeployment,
      deploymentId: activeDeployment?.deploymentId,
      version: activeDeployment?.version,
      eventNodesCount: activeDeployment?.eventNodes ?
        (typeof activeDeployment.eventNodes === 'string' ?
          JSON.parse(activeDeployment.eventNodes).length :
          activeDeployment.eventNodes.length) : 0
    });

    // Load event nodes
    if (activeDeployment?.eventNodes) {
      try {
        const eventData = typeof activeDeployment.eventNodes === 'string'
          ? JSON.parse(activeDeployment.eventNodes)
          : activeDeployment.eventNodes;
        console.log('📦 Parsed event data:', eventData.length, 'events');

        // Log first few events to see their structure
        if (eventData.length > 0) {
          console.log('Sample events:', eventData.slice(0, 3).map((e: any) => ({
            eventNumber: e.eventNumber,
            name: e.name,
            goldReward: e.goldReward,
            xpReward: e.xpReward
          })));
        }

        const nodeMap = new Map();

        eventData.forEach((event: any) => {
          // Map by global event number (1-200)
          const eventNumber = event.eventNumber || event.globalEventNumber;
          if (eventNumber) {
            // Calculate which chapter and local event number
            const chapter = Math.ceil(eventNumber / 20);
            const localEventNumber = ((eventNumber - 1) % 20) + 1;

            // Calculate chip rewards for this event
            const calculatedRewards = calculateChipRewardsForEvent(eventNumber);
            // Ensure chipRewards is an array (use rewards property if it's an object)
            const chipRewards = Array.isArray(calculatedRewards)
              ? calculatedRewards
              : (calculatedRewards?.rewards || []);

            // Store both by event number and potential node IDs
            // Map imageReference to image for consistency
            const eventData = {
              ...event,
              chapter,
              localEventNumber,
              chipRewards,
              globalEventNumber: eventNumber,
              // Ensure 'image' field exists for compatibility - handle various field names
              image: event.image || event.imageReference || event.imagePath || `/event-images/450px%20webp/${eventNumber}.webp`
            };

            // IMPORTANT: Use global event number as primary key to avoid collisions
            // Don't use "E1" for all chapters - that causes overwrites!

            // Primary keys using global event number (unique across all chapters)
            nodeMap.set(`event_${eventNumber}`, eventData);
            nodeMap.set(eventNumber.toString(), eventData);
            nodeMap.set(eventNumber, eventData);

            // Chapter-specific keys that won't collide
            nodeMap.set(`ch${chapter}_E${localEventNumber}`, eventData); // "ch1_E1", "ch10_E1" are different
            nodeMap.set(`E${chapter}_${localEventNumber}`, eventData); // "E1_1", "E10_1" are different

            // Node ID formats
            nodeMap.set(`ch${chapter}_node_event_${localEventNumber}`, eventData);
            nodeMap.set(`ch${chapter}_e${localEventNumber}`, eventData);
            nodeMap.set(`node_event_${eventNumber}`, eventData);
            nodeMap.set(`event_node_${eventNumber}`, eventData);

            // Only for Chapter 1, use simple "E1" format (no collision)
            if (chapter === 1) {
              nodeMap.set(`E${localEventNumber}`, eventData); // "E1" only for Chapter 1
              nodeMap.set(`Event ${localEventNumber}`, eventData); // "Event 1" only for Chapter 1
              nodeMap.set(localEventNumber.toString(), eventData);
              nodeMap.set(localEventNumber, eventData);
            }

            // Log what we're storing (first event only to check Genesis buffs)
            if (localEventNumber === 1) {
              console.log(`📦 Storing Ch${chapter} Event ${localEventNumber}:`, {
                hasGenesisBuffs: !!eventData.genesisBuffs,
                genesisBuffsPreview: eventData.genesisBuffs ? {
                  easy: eventData.genesisBuffs.easy?.length || 0,
                  medium: eventData.genesisBuffs.medium?.length || 0,
                  hard: eventData.genesisBuffs.hard?.length || 0
                } : 'none'
              });
            }
          }
        });

        setDeployedEventNodes(nodeMap);
        console.log('Loaded deployed event data:', nodeMap.size, 'events');
        // console.log('Map keys:', Array.from(nodeMap.keys()));

        // Also set parsedConfig for compatibility with existing code
        setParsedConfig({ events: eventData });
      } catch (error) {
        console.error('Failed to parse deployed event data:', error);
      }
    } else {
      console.log('⚠️ No event nodes in active deployment');
    }

    // Load normal nodes (already parsed from the query)
    if (activeDeployment?.normalNodes) {
      setDeployedNormalNodes(activeDeployment.normalNodes);
      console.log('Loaded normal nodes:', activeDeployment.normalNodes.length);
    } else {
      setDeployedNormalNodes([]);
      console.log('No normal nodes found in deployment');
    }

    // Load challenger nodes (already parsed from the query)
    if (activeDeployment?.challengerNodes) {
      setDeployedChallengerNodes(activeDeployment.challengerNodes);
      console.log('Loaded challenger nodes:', activeDeployment.challengerNodes.length);
    } else {
      setDeployedChallengerNodes([]);
      console.log('No challenger nodes found in deployment');
    }

    // Load mini-boss nodes (already parsed from the query)
    if (activeDeployment?.miniBossNodes) {
      setDeployedMiniBossNodes(activeDeployment.miniBossNodes);
      console.log('Loaded mini-boss nodes:', activeDeployment.miniBossNodes.length);
    } else {
      setDeployedMiniBossNodes([]);
      console.log('No mini-boss nodes found in deployment');
    }

    // Load final boss nodes (already parsed from the query)
    if (activeDeployment?.finalBossNodes) {
      setDeployedFinalBossNodes(activeDeployment.finalBossNodes);
      console.log('Loaded final boss nodes:', activeDeployment.finalBossNodes.length);
    } else {
      setDeployedFinalBossNodes([]);
      console.log('No final boss nodes found in deployment');
    }

    if (!activeDeployment) {
      console.log('No active deployment found');
    }
  }, [activeDeployment]);

  // Helper to get deployed mek data for a node
  const getDeployedMekForNode = useCallback((node: StoryNode) => {
    // First, let's see what the actual node ID looks like
    // console.log('Raw node ID:', node.id, 'Node type:', node.storyNodeType);

    // If no deployment data, return early
    if (!deployedNormalNodes.length && !deployedChallengerNodes.length &&
        !deployedMiniBossNodes.length && !deployedFinalBossNodes.length) {
      return null;
    }

    // Parse chapter from node ID (e.g., "ch1_node_..." -> chapter 1)
    const chapterMatch = node.id?.match(/ch(\d+)/);
    const chapter = chapterMatch ? parseInt(chapterMatch[1]) : 1;

    // FIXED: Better indexing algorithm that ensures unique indices for each node
    // Use both X and Y positions plus the unique node ID hash for variety
    const nodeHash = hashCode(node.id);

    // Combine X, Y positions and hash for better distribution
    // X position provides horizontal variation (different paths)
    // Y position provides vertical variation (progression through tree)
    // Hash ensures uniqueness even for nodes at same position
    const xFactor = Math.floor(node.x / 10); // Use X position for variety
    const yFactor = Math.floor((6000 - node.y) / 30); // Use Y for progression

    // Create index with better distribution - hash has more weight
    // This ensures each unique node ID gets a unique index
    let nodeIndex: number;
    nodeIndex = Math.abs((nodeHash * 13 + xFactor * 7 + yFactor * 3) % 350);

    // Debug logging
    // console.log('Parsed node data:', {
    //   nodeId: node.id,
    //   nodeType: node.storyNodeType,
    //   chapter,
    //   nodeX: node.x,
    //   nodeY: node.y,
    //   xFactor,
    //   yFactor,
    //   nodeHash,
    //   nodeIndex,
    //   normalNodesCount: deployedNormalNodes.length,
    //   challengerNodesCount: deployedChallengerNodes.length,
    //   miniBossCount: deployedMiniBossNodes.length,
    //   finalBossCount: deployedFinalBossNodes.length,
    // });

    switch (node.storyNodeType) {
      case 'normal':
        // Check if this is a challenger node
        const isChallenger = (node as any).challenger === true;

        if (isChallenger) {
          // Look in challenger nodes (40 per chapter)
          const challengerMeksForChapter = deployedChallengerNodes.filter(m => m.chapter === chapter);
          // console.log(`Found ${challengerMeksForChapter.length} challenger meks for chapter ${chapter}`);

          // Adjust index for challenger nodes (0-39) with better distribution
          const challengerIndex = Math.abs((nodeHash * 11 + xFactor * 5 + yFactor * 2) % 40);
          // console.log('Looking for challenger at calculated index:', challengerIndex);

          // Sort by nodeIndex to ensure consistent ordering
          const sortedChallengerMeks = challengerMeksForChapter.sort((a, b) => a.nodeIndex - b.nodeIndex);

          // Use the calculated index to select from available meks
          if (sortedChallengerMeks.length > 0) {
            const selectedIndex = challengerIndex % sortedChallengerMeks.length;
            const selectedMek = sortedChallengerMeks[selectedIndex];
            // console.log('Selected challenger mek at position:', selectedIndex, selectedMek);
            return selectedMek;
          }
        } else {
          // Look in normal nodes
          const normalMeksForChapter = deployedNormalNodes.filter(m => m.chapter === chapter);
          // console.log(`Found ${normalMeksForChapter.length} normal meks for chapter ${chapter}`);
          // console.log('Looking for normal node at calculated index:', nodeIndex);

          // Sort by nodeIndex to ensure consistent ordering
          const sortedNormalMeks = normalMeksForChapter.sort((a, b) => a.nodeIndex - b.nodeIndex);

          // Use the calculated nodeIndex to select from available meks
          // This ensures each node gets a consistent, unique mek
          if (sortedNormalMeks.length > 0) {
            // IMPORTANT: Each normal node should get a unique Mek
            // Since we have exactly 350 normal Meks deployed for 350 normal nodes,
            // the nodeIndex should directly map to a unique Mek
            if (nodeIndex < sortedNormalMeks.length) {
              const selectedMek = sortedNormalMeks[nodeIndex];
              // console.log('Selected normal mek at position:', nodeIndex, selectedMek);
              return selectedMek;
            } else {
              // Fallback: if somehow we have more nodes than Meks, use modulo
              // This should not happen in normal operation
              console.warn(`Warning: Node index ${nodeIndex} exceeds available meks (${sortedNormalMeks.length})`);
              const selectedIndex = nodeIndex % sortedNormalMeks.length;
              const selectedMek = sortedNormalMeks[selectedIndex];
              return selectedMek;
            }
          }
        }
        // console.log('No meks found for this chapter!');
        break;
      case 'challenger':
        const challengerMeksForChapter = deployedChallengerNodes.filter(m => m.chapter === chapter);
        // Adjust index for challenger nodes (0-39) with better distribution
        const challengerIdx = Math.abs((nodeHash * 11 + xFactor * 5 + yFactor * 2) % 40);
        const challengerMek = challengerMeksForChapter.find(m => m.nodeIndex === challengerIdx);
        if (challengerMek) return challengerMek;
        // Fallback
        if (challengerMeksForChapter.length > 0) {
          return challengerMeksForChapter[challengerIdx % challengerMeksForChapter.length];
        }
        break;
      case 'boss':
        const miniBossMeksForChapter = deployedMiniBossNodes.filter(m => m.chapter === chapter);

        // Adjust index for mini-boss nodes (0-8, 9 per chapter) with better distribution
        const bossIndex = Math.abs((nodeHash * 7 + xFactor * 3 + yFactor) % 9);

        // Sort by nodeIndex to ensure consistent ordering
        const sortedMiniBossMeks = miniBossMeksForChapter.sort((a, b) => a.nodeIndex - b.nodeIndex);

        // Use the calculated index to select from available meks
        if (sortedMiniBossMeks.length > 0) {
          const selectedIndex = bossIndex % sortedMiniBossMeks.length;
          const selectedMek = sortedMiniBossMeks[selectedIndex];
          return selectedMek;
        }
        break;
      case 'final_boss':

        const finalBossMekForChapter = deployedFinalBossNodes.find(m => m.chapter === chapter);
        if (finalBossMekForChapter) {
          return finalBossMekForChapter;
        }
        break;
    }
    return null;
  }, [deployedNormalNodes, deployedChallengerNodes, deployedMiniBossNodes, deployedFinalBossNodes]);

  // Helper function to calculate essence probabilities using attribute rarity
  const calculateEssenceProbabilities = useCallback((head: string, body: string, trait: string) => {
    if (!attributeRarity || !attributeRarity.heads || !attributeRarity.bodies || !attributeRarity.traits) {
      // Return default probabilities if no rarity data
      return {
        headChance: 33,
        bodyChance: 34,
        traitChance: 33,
      };
    }

    const headData = attributeRarity.heads[head];
    const bodyData = attributeRarity.bodies[body];
    const traitData = attributeRarity.traits[trait];

    if (!headData || !bodyData || !traitData) {
      // Return default if any attribute is missing
      return {
        headChance: 33,
        bodyChance: 34,
        traitChance: 33,
      };
    }

    // Calculate proportional weights (more common items have higher drop chance)
    // The drop rate is proportional to how common the variation is
    const headWeight = headData.count;
    const bodyWeight = bodyData.count;
    const traitWeight = traitData.count;

    // Normalize to percentages that sum to 100%
    const totalWeight = headWeight + bodyWeight + traitWeight;

    let headChance = Math.round((headWeight / totalWeight) * 100);
    let bodyChance = Math.round((bodyWeight / totalWeight) * 100);
    let traitChance = Math.round((traitWeight / totalWeight) * 100);

    // Ensure they sum to exactly 100%
    const currentTotal = headChance + bodyChance + traitChance;
    if (currentTotal !== 100) {
      const diff = 100 - currentTotal;
      if (headChance >= bodyChance && headChance >= traitChance) {
        headChance += diff;
      } else if (bodyChance >= traitChance) {
        bodyChance += diff;
      } else {
        traitChance += diff;
      }
    }

    return {
      headChance,
      bodyChance,
      traitChance,
      headCount: headData.count,
      bodyCount: bodyData.count,
      traitCount: traitData.count,
    };
  }, [attributeRarity]);

  // Helper to get event data for a node
  const getEventDataForNode = useCallback((node: StoryNode) => {
    if (node.storyNodeType !== 'event') return null;

    // Disable debug logging to stop spam
    const DEBUG = false;

    // First, try direct label match (most likely for event nodes)
    if (node.label && node.label !== 'Node' && deployedEventNodes.has(node.label)) {
      const eventData = deployedEventNodes.get(node.label);
      console.log('✅ DIRECT LABEL MATCH:', node.label, eventData);
      return eventData;
    }

    // Special handling when label is generic "Node"
    // Use position mapping to find the correct event
    if (node.label === 'Node' && node.storyNodeType === 'event') {
      // Use the position map to find which global event number this node represents
      const globalEventNumber = eventNodePositionMap.get(node.id);
      if (globalEventNumber) {
        // Calculate local event number within chapter (1-20)
        const localEventNumber = ((globalEventNumber - 1) % 20) + 1;
        const chapter = Math.ceil(globalEventNumber / 20);

        if (DEBUG) {
          console.log(`📍 Node position: Chapter ${chapter}, Event ${localEventNumber} (Global: ${globalEventNumber})`);
        }

        // Try to find the deployed event data for this position
        // Prioritize unique keys to avoid chapter collisions
        const possibleKeys = [
          // Global event number keys (most unique, no collisions)
          globalEventNumber.toString(), // "1", "181", etc.
          globalEventNumber, // 1, 181, etc. (number)
          `event_${globalEventNumber}`, // event_1, event_181, etc.

          // Chapter-specific keys (also unique)
          `ch${chapter}_E${localEventNumber}`, // ch1_E1, ch10_E1 (unique)
          `E${chapter}_${localEventNumber}`, // E1_1, E10_1 (unique)

          // Simple keys ONLY for Chapter 1 (to avoid collisions)
          ...(chapter === 1 ? [
            `E${localEventNumber}`, // E1, E2, etc.
            `Event ${localEventNumber}`, // Event 1, Event 2, etc.
            localEventNumber.toString(), // "1", "2", etc.
            localEventNumber, // 1, 2, etc. (number)
          ] : [])
        ];

        for (const key of possibleKeys) {
          if (deployedEventNodes.has(key)) {
            const eventData = deployedEventNodes.get(key);

            // Log what we found to debug the mismatch (only once per unique event)
            if (!window.debuggedEvents) window.debuggedEvents = new Set();
            if (!window.debuggedEvents.has(node.id)) {
              window.debuggedEvents.add(node.id);
              console.log('✅ FOUND MATCH using position-based key:', key);
              console.log('Event data retrieved:', {
                key,
                name: eventData?.name,
                globalEventNumber: eventData?.globalEventNumber,
                eventNumber: eventData?.eventNumber,
                chapter: eventData?.chapter,
                localEventNumber: eventData?.localEventNumber
              });
            }

            return eventData;
          }
        }

        console.log('⚠️ No match found for event position:', globalEventNumber);
        console.log('Available keys sample:', Array.from(deployedEventNodes.keys()).slice(0, 10));
      } else {
        console.log('⚠️ No position mapping for node:', node.id);
      }
    }

    // Extract chapter from node ID (e.g., "ch1_node_..." -> 1)
    const chapterMatch = node.id?.match(/ch(\d+)/);
    const chapter = chapterMatch ? parseInt(chapterMatch[1]) : 1;

    // Extract local event number from label (e.g., "E1" -> 1, "E20" -> 20)
    const labelMatch = node.label?.match(/E(\d+)/);
    const localEventNumber = labelMatch ? parseInt(labelMatch[1]) : null;

    if (localEventNumber) {
      // Calculate global event number (1-20 for ch1, 21-40 for ch2, etc.)
      const globalEventNumber = (chapter - 1) * 20 + localEventNumber;

      // Try various ID formats to find the matching event
      // The deployed data uses these keys based on the setDeployedEventNodes logic:
      // - `event_${globalEventNumber}`
      // - `E${localEventNumber}`
      // - `E${chapter}_${localEventNumber}`
      // - `${globalEventNumber}`
      // - globalEventNumber (as number)
      const possibleIds = [
        node.label, // "E1", "E2", etc. - direct label match
        `E${localEventNumber}`, // Local event format (most likely to match)
        `${globalEventNumber}`, // Global event number as string
        globalEventNumber, // Global event number as number
        `event_${globalEventNumber}`, // Prefixed format
        `E${chapter}_${localEventNumber}`, // Chapter-specific format
      ];

      if (DEBUG) {
        console.log('📊 Calculated event numbers:', {
          nodeId: node.id,
          label: node.label,
          chapter,
          localEventNumber,
          globalEventNumber,
          tryingIds: possibleIds
        });
      }

      for (const id of possibleIds) {
        if (id !== null && id !== undefined && deployedEventNodes.has(id)) {
          const eventData = deployedEventNodes.get(id);
          if (DEBUG) {
            console.log('✅ MATCH FOUND with ID:', id, {
              name: eventData?.name,
              goldReward: eventData?.goldReward,
              xpReward: eventData?.xpReward
            });
          }
          return eventData;
        }
      }
    }

    // Fallback: try node properties directly
    const fallbackIds = [node.id, node.label];
    for (const id of fallbackIds) {
      if (id && deployedEventNodes.has(id)) {
        const eventData = deployedEventNodes.get(id);
        if (DEBUG) {
          console.log('✅ FALLBACK MATCH with ID:', id, {
            name: eventData?.name
          });
        }
        return eventData;
      }
    }

    if (DEBUG) {
      console.log('❌ NO MATCH FOUND for event node:', {
        nodeId: node.id,
        label: node.label,
        hasDeployedData: deployedEventNodes.size > 0
      });
    }
    return null;
  }, [deployedEventNodes, eventNodePositionMap]);

  // Helper function to generate rewards based on node type and level
  const getNodeRewards = useCallback((node: ExtendedStoryNode) => {
    // For event nodes, calculate chip rewards
    if (node.storyNodeType === 'event') {
      const eventData = getEventDataForNode(node);

      if (eventData?.chipRewards && Array.isArray(eventData.chipRewards)) {
        // Use deployed chip rewards if available
        return eventData.chipRewards.map((chip: any) => ({
          name: `T${chip.tier} ${chip.modifier} Power Chip`,
          quantity: 1,
          chance: chip.probability
        }));
      }

      // If no deployed data, calculate chip rewards based on event position
      // Parse chapter and event number from node ID
      const chapterMatch = node.id?.match(/ch(\d+)/);
      const chapter = chapterMatch ? parseInt(chapterMatch[1]) : 1;

      // Count event nodes to determine this event's position
      let eventNumber = 1;
      if (node.label) {
        const labelMatch = node.label.match(/E(\d+)/);
        if (labelMatch) {
          eventNumber = parseInt(labelMatch[1]);
        }
      }

      // Calculate global event number (events 1-200)
      const globalEventNumber = (chapter - 1) * 20 + eventNumber;
      console.log('Calculating chip rewards for event:', { chapter, eventNumber, globalEventNumber });

      // Import and use the chip calculator
      const { calculateChipRewardsForEvent } = require('@/lib/chipRewardCalculator');
      const chipData = calculateChipRewardsForEvent(globalEventNumber);
      console.log('Calculated chip data:', chipData);

      return chipData.rewards.map((chip: any) => ({
        name: `T${chip.tier} ${chip.modifier} Power Chip`,
        quantity: 1,
        chance: chip.probability
      }));
    }

    // Get deployed mek to determine rewards
    const deployedMek = getDeployedMekForNode(node);

    // If we have deployed mek data with essence types, use those
    if (deployedMek && deployedMek.head && deployedMek.body && deployedMek.trait) {
      // Calculate dynamic essence drop probabilities based on actual rarity
      const probabilities = calculateEssenceProbabilities(
        deployedMek.head,
        deployedMek.body,
        deployedMek.trait
      );

      const essenceRewards = [
        {
          name: `${deployedMek.head} Essence`,
          quantity: deployedMek.essenceReward || 1,
          chance: probabilities.headChance
        },
        {
          name: `${deployedMek.body} Essence`,
          quantity: deployedMek.essenceReward || 1,
          chance: probabilities.bodyChance
        },
        {
          name: `${deployedMek.trait} Essence`,
          quantity: deployedMek.essenceReward || 1,
          chance: probabilities.traitChance
        }
      ];

      // Sort by chance (highest to lowest) for better display
      essenceRewards.sort((a, b) => b.chance - a.chance);

      console.log('Using deployed mek essence rewards with dynamic probabilities:', {
        head: deployedMek.head,
        body: deployedMek.body,
        trait: deployedMek.trait,
        essenceReward: deployedMek.essenceReward,
        probabilities,
        totalDropChance: essenceRewards.reduce((sum, r) => sum + r.chance, 0),
        rewards: essenceRewards
      });

      return essenceRewards;
    }

    // Fallback to generic rewards if no deployed data
    const rank = deployedMek?.rank || 2000;
    let rewardTier: 'legendary' | 'rare' | 'uncommon' | 'common';
    if (rank <= 100) rewardTier = 'legendary';
    else if (rank <= 500) rewardTier = 'rare';
    else if (rank <= 2000) rewardTier = 'uncommon';
    else rewardTier = 'common';

    const rewardsByTier = {
      legendary: [
        { name: "Legendary Essence", quantity: 3, chance: 45 },
        { name: "Epic Essence", quantity: 2, chance: 30 },
        { name: "Rare Essence", quantity: 1, chance: 15 }
      ],
      rare: [
        { name: "Rare Essence", quantity: 3, chance: 45 },
        { name: "Uncommon Essence", quantity: 2, chance: 30 },
        { name: "Common Essence", quantity: 1, chance: 15 }
      ],
      uncommon: [
        { name: "Uncommon Essence", quantity: 2, chance: 45 },
        { name: "Common Essence", quantity: 2, chance: 30 },
        { name: "Basic Essence", quantity: 1, chance: 15 }
      ],
      common: [
        { name: "Common Essence", quantity: 2, chance: 45 },
        { name: "Basic Essence", quantity: 1.5, chance: 30 },
        { name: "Starter Essence", quantity: 1, chance: 15 }
      ]
    };

    const baseRewards = rewardsByTier[rewardTier];

    // Adjust rewards based on node type
    if (node.storyNodeType === 'final_boss') {
      return baseRewards.map(r => ({
        ...r,
        quantity: (r.quantity || 1) * 3,
        chance: Math.min(100, r.chance * 1.5)
      }));
    } else if (node.storyNodeType === 'boss') {
      return baseRewards.map(r => ({
        ...r,
        quantity: (r.quantity || 1) * 2,
        chance: Math.min(100, r.chance * 1.2)
      }));
    } else if (node.storyNodeType === 'event') {
      return baseRewards.slice(0, 4); // Only first 4 rewards for events
    }

    return baseRewards;
  }, [getEventDataForNode]);

  // Update getNodeContractFee to use getNodeRewards
  const getNodeContractFeeWithRewards = useCallback((node: ExtendedStoryNode) => {
    const rewards = getNodeRewards(node);
    return Math.floor(rewards.gold * 0.1); // 10% of gold reward as fee
  }, [getNodeRewards]);

  // Genesis Token definitions (matching EventNodeEditor)
  const GENESIS_TOKENS = {
    rainbow: { name: 'Rainbow Genesis', rarity: 'legendary', quantity: 54, buffPercent: 25, color: '#A855F7', image: '/genesis-art/rainbow-genesis.png' },
    pink: { name: 'Pink Genesis', rarity: 'epic', quantity: 88, buffPercent: 20, color: '#EC4899', image: '/genesis-art/pink-genesis.png' },
    green: { name: 'Green Genesis', rarity: 'rare', quantity: 207, buffPercent: 15, color: '#10B981', image: '/genesis-art/green-genesis.png' },
    red: { name: 'Red Genesis', rarity: 'uncommon', quantity: 318, buffPercent: 10, color: '#EF4444', image: '/genesis-art/red-genesis.png' },
    teal: { name: 'Teal Genesis', rarity: 'common', quantity: 333, buffPercent: 5, color: '#14B8A6', image: '/genesis-art/teal-genesis.png' }
  } as const;

  // Helper function to get Genesis buffs from deployed event
  const getNodeVariationBuffs = useCallback((node: ExtendedStoryNode) => {
    // For event nodes, check for Genesis buffs
    if (node.storyNodeType === 'event') {
      const eventData = getEventDataForNode(node);

      // Check for admin-assigned Genesis buffs
      if (eventData?.genesisBuffs) {
        const difficultyLevel = selectedDifficulty || 'medium';
        const genesisColors = eventData.genesisBuffs[difficultyLevel];

        if (genesisColors && Array.isArray(genesisColors) && genesisColors.length > 0) {
          return genesisColors.map((color: string) => {
            const token = GENESIS_TOKENS[color as keyof typeof GENESIS_TOKENS];
            return {
              id: `genesis-${color}`,
              name: token.name,
              bonus: `+${token.buffPercent}%`,
              color: token.color,
              rarity: token.rarity,
              image: token.image
            };
          });
        }
      }

      // Fallback: Return empty array if no Genesis buffs configured
      return [];
    }

    // For mek nodes, get the deployed mek's traits
    const deployedMek = getDeployedMekForNode(node);
    if (deployedMek && deployedMek.head && deployedMek.body && deployedMek.trait) {
      // Return the three traits from the deployed mek
      return [
        { id: 'head', name: deployedMek.head, bonus: '+10%' },
        { id: 'body', name: deployedMek.body, bonus: '+10%' },
        { id: 'trait', name: deployedMek.trait, bonus: '+10%' }
      ];
    }

    // Fallback for nodes without deployed data
    const fallbackTraits = [
      { id: 'default1', name: 'STANDARD', bonus: '+5%' },
      { id: 'default2', name: 'BASIC', bonus: '+5%' },
      { id: 'default3', name: 'COMMON', bonus: '+5%' }
    ];

    // Use node ID to deterministically select number of traits
    let hash = 0;
    for (let i = 0; i < node.id.length; i++) {
      hash = ((hash << 5) - hash) + node.id.charCodeAt(i);
      hash = hash & hash;
    }

    const randomChoice = Math.abs(hash) % 3;
    // Return 3 or 8 traits based on deterministic "randomness"
    const buffCount = randomChoice === 0 ? 3 : 8;

    // Return the appropriate number of fallback traits
    const selectedBuffs = [];
    for (let i = 0; i < Math.min(buffCount, fallbackTraits.length); i++) {
      selectedBuffs.push(fallbackTraits[i]);
    }

    return selectedBuffs;
  }, [getDeployedMekForNode, getEventDataForNode, calculateEssenceProbabilities, selectedDifficulty]);
  
  // Helper function to get available slots for a node (for testing)
  const getNodeAvailableSlots = useCallback((node: ExtendedStoryNode) => {
    // Use node ID to deterministically select available slots
    let hash = 0;
    for (let i = 0; i < node.id.length; i++) {
      hash = ((hash << 5) - hash) + node.id.charCodeAt(i);
      hash = hash & hash;
    }

    // For testing: randomly assign 1, 4, or 8 available slots
    const slotOptions = [1, 4, 8];
    const slotIndex = Math.abs(hash >> 8) % slotOptions.length;
    return slotOptions[slotIndex];
  }, []);

  // Helper function to handle node deployment
  const handleNodeDeploy = useCallback(async (node: ExtendedStoryNode, skipValidation?: boolean) => {
    // Check if already deploying this node (prevent double-clicks)
    if (deployingNodes.has(node.id)) {
      console.log('Already deploying this node');
      return;
    }

    // Check if mission is already active
    const activeMission = activeMissions?.find(m => m.nodeId === node.id);
    if (activeMission) {
      console.log('Mission already active for this node');
      return;
    }

    // Validation: Check for meks and funds
    if (!skipValidation) {
      const errors: string[] = [];
      const selectedMeksForNode = selectedMeks[node.id] || [];
      const hasMeks = selectedMeksForNode.filter(Boolean).length > 0;

      if (!hasMeks) {
        errors.push('No meks attached');
        // Flash mek slots
        setFlashingMekSlots(true);
        setTimeout(() => setFlashingMekSlots(false), 2000);
      }

      // Get contract fee
      const contractFee = getNodeContractFeeWithRewards(node);
      // For now, we'll assume the user has enough funds since we can't check their balance yet
      // This will be updated when we have access to user's gold balance
      const userGold = 1000000; // Placeholder - replace with actual user gold
      const userEssence = 10; // Placeholder - replace with actual user essence

      if (userGold < contractFee) {
        const goldNeeded = contractFee - userGold;
        errors.push(`Low gold (need ${goldNeeded.toLocaleString()} more)`);
        // Flash fees
        setFlashingFees(true);
        setTimeout(() => setFlashingFees(false), 2000);
      }

      // Check for essence if required (example check)
      const essenceRequired = node.storyNodeType === 'boss' ? 0.5 : 0;
      if (essenceRequired > 0 && userEssence < essenceRequired) {
        const essenceNeeded = essenceRequired - userEssence;
        errors.push(`Low essence (need ${essenceNeeded.toFixed(1)} more)`);
        setFlashingFees(true);
        setTimeout(() => setFlashingFees(false), 2000);
      }

      if (errors.length > 0) {
        setDeployValidationErrors(errors);
        setShowDeployValidationPopup(true);
        return;
      }
    }

    // Mark as deploying
    setDeployingNodes(prev => new Set([...prev, node.id]));

    // Get duration based on node type and position
    let minutes = 15; // default
    const isChallenger = (node as any).challenger === true;

    if (node.storyNodeType === 'final_boss') {
      minutes = calculateNodeDuration(node, 'finalboss');
    } else if (node.storyNodeType === 'boss') {
      minutes = calculateNodeDuration(node, 'miniboss');
    } else if (node.storyNodeType === 'event') {
      minutes = calculateNodeDuration(node, 'event');
    } else if (isChallenger) {
      minutes = calculateNodeDuration(node, 'challenger');
    } else {
      minutes = calculateNodeDuration(node, 'normal');
    }

    const durationMs = minutes * 60 * 1000;

    // Calculate rewards
    const rewards = getNodeRewards(node);
    const contractFee = getNodeContractFeeWithRewards(node);

    try {
      // Start the mission in the database
      await startMission({
        nodeId: node.id,
        nodeType: node.storyNodeType || 'normal',
        nodeName: node.label || `Node ${node.id}`,
        duration: durationMs,
        contractFee: contractFee,
        expectedRewards: {
          gold: rewards.gold,
          essence: rewards.essence > 0 ? rewards.essence : undefined,
          chipT1: rewards.chipT1 > 0 ? rewards.chipT1 : undefined,
          special: rewards.special > 0 ? rewards.special : undefined,
        },
        selectedMeks: (selectedMeks[node.id] || []).filter(Boolean).map(mek => ({
          id: mek.id,
          name: mek.name,
          rank: mek.rank || mek.rarity === 'legendary' ? 1 :
                mek.rarity === 'epic' ? 2 :
                mek.rarity === 'rare' ? 3 :
                mek.rarity === 'uncommon' ? 4 : 5,
          matchedTraits: mek.matchedTraits || []
        })),
        difficulty: selectedDifficulty,
      });

      console.log(`Mission started for node ${node.id}`);
      // Close the node panel after successful deployment
      setSelectedNode(null);
    } catch (error: any) {
      console.error('Failed to start mission:', error);
      // Show user-friendly error message
      if (error.message?.includes('already active')) {
        alert('A mission is already active for this node. Please wait for it to complete.');
      } else {
        alert('Failed to start mission. Please try again.');
      }
    } finally {
      // Remove from deploying set
      setDeployingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(node.id);
        return newSet;
      });
    }
  }, [completedNodes, activeMissions, activeDurationConfig, selectedMeks, selectedDifficulty, startMission, deployingNodes]);

  // Handle contract slot click - view or abort active contracts only
  const handleContractSlotClickNew = useCallback(async (slot: ContractSlot, action?: 'view' | 'abort') => {
    // Only handle actions for active slots
    if (slot.status === 'active' && slot.nodeId) {
      if (action === 'view') {
        // Find and select the node in the tree
        const node = treeData?.nodes?.find(n => n.id === slot.nodeId);
        if (node) {
          setSelectedNode(node as ExtendedStoryNode);
          // Optionally scroll to the node
          // You could add auto-scroll logic here
        }
      } else if (action === 'abort') {
        // Show cancel/abort lightbox for this slot's mission
        setPendingCancelNodeId(slot.nodeId);
        setShowCancelLightbox(true);
      }
    }
    // Available slots now show their own message popup in the ContractSlots component
  }, [treeData]);

  // Handle mek slot click - opens the recruitment modal
  const handleMekSlotClick = useCallback((slotIndex: number) => {
    const nodeId = selectedNode?.id;
    if (nodeId) {
      setShowMekModal(nodeId);
      setSelectedMekSlot({ missionId: nodeId, slotIndex });
    }
  }, [selectedNode]);

  // Handle mek selection from modal
  const handleMekSelection = useCallback((mek: any, matchedTraits: any[], hasMatch: boolean) => {
    if (selectedMekSlot) {
      const { missionId, slotIndex } = selectedMekSlot;
      const meksForMission = selectedMeks[missionId] || [];
      const updatedMeks = [...meksForMission];
      // Store the mek with matched traits for success calculation
      updatedMeks[slotIndex] = { ...mek, matchedTraits };
      setSelectedMeks({ ...selectedMeks, [missionId]: updatedMeks });
    }
    setShowMekModal(null);
    setSelectedMekSlot(null);
  }, [selectedMekSlot, selectedMeks]);

  // Handle mek removal from slot
  const handleMekRemove = useCallback((slotIndex: number) => {
    const nodeId = selectedNode?.id;
    if (nodeId) {
      const meksForMission = selectedMeks[nodeId] || [];
      const updatedMeks = [...meksForMission];
      updatedMeks[slotIndex] = undefined;
      setSelectedMeks({ ...selectedMeks, [nodeId]: updatedMeks });
    }
  }, [selectedNode, selectedMeks]);

  // Calculate success chance based on selected meks and matched traits
  const calculateSuccessChance = useCallback((nodeId: string, baseChance: number, variationBuffs: any[]) => {
    const meksForMission = selectedMeks[nodeId] || [];
    let totalChance = baseChance;

    // Each mek with matched traits adds bonus to success chance
    meksForMission.forEach(mek => {
      if (mek?.matchedTraits?.length > 0) {
        // Each matched trait adds 10% to success chance
        totalChance += mek.matchedTraits.length * 10;
      }
    });

    // Cap at 95% max success chance
    return Math.min(95, totalChance);
  }, [selectedMeks]);
  
  // Helper function to get a deterministic mek image for each node
  const getMekImage = useCallback((nodeOrId: string | StoryNode, isForDetails: boolean = false): string => {
    // In preview mode, return a simple placeholder
    if (previewMode) {
      return '/mek-images/150px/000-000-000.webp';
    }

    // Get the node object
    const node = typeof nodeOrId === 'string'
      ? treeData?.nodes?.find(n => n.id === nodeOrId)
      : nodeOrId;
    if (!node) {
      return '';
    }

    // Get the deployed mek data for this node
    const deployedMek = getDeployedMekForNode(node);

    if (deployedMek) {
      if (deployedMek.sourceKey) {
        // Process the sourceKey to match the actual filename format:
        // 1. Convert to lowercase
        // 2. Remove any trailing -B suffix
        let processedKey = deployedMek.sourceKey.toLowerCase();
        if (processedKey.endsWith('-b')) {
          processedKey = processedKey.slice(0, -2);
        }
        const filename = `${processedKey}.webp`;

        // Return appropriate size based on usage
        if (isForDetails) {
          return `/mek-images/500px/${filename}`;
        } else {
          return `/mek-images/150px/${filename}`;
        }
      }
    }

    // Fallback for nodes without deployed mek data (e.g., boss nodes without specific mek assignment)
    // Use a simple deterministic fallback based on node ID
    const nodeId = typeof nodeOrId === 'string' ? nodeOrId : nodeOrId.id;
    const fallbackIndex = Math.abs(hashCode(nodeId)) % leastRareMechanisms.length;
    const fallbackFilename = leastRareMechanisms[fallbackIndex];

    if (isForDetails) {
      return `/mek-images/500px/${fallbackFilename}`;
    } else {
      return `/mek-images/150px/${fallbackFilename}`;
    }
  }, [treeData, previewMode, getDeployedMekForNode, leastRareMechanisms, deployedNormalNodes, deployedChallengerNodes, deployedMiniBossNodes, deployedFinalBossNodes]); // Include all deployment data dependencies
  
  // Debug logging and create event node position mapping
  useEffect(() => {
    console.log("Story trees from database:", storyTrees);
    console.log("V1 tree:", v1Tree);
    console.log("V2 tree:", v2Tree);
    console.log("Test 5 tree:", test5Tree);
    console.log("Selected tree data:", treeData);
    if (treeData) {
      console.log("Number of nodes:", treeData.nodes?.length);
      console.log("Number of connections:", treeData.connections?.length);
      console.log("Node types breakdown:", {
        normal: treeData.nodes?.filter(n => n.storyNodeType === 'normal').length,
        event: treeData.nodes?.filter(n => n.storyNodeType === 'event').length,
        boss: treeData.nodes?.filter(n => n.storyNodeType === 'boss').length,
        final_boss: treeData.nodes?.filter(n => n.storyNodeType === 'final_boss').length,
        challenger: treeData.nodes?.filter(n => n.challenger).length
      });
      console.log("First few nodes:", treeData.nodes?.slice(0, 10));

      // Create event node position mapping
      const eventNodes = treeData.nodes?.filter((n: any) => n.storyNodeType === 'event');
      if (eventNodes && eventNodes.length > 0) {
        console.log("🎯 Event nodes in tree - Sample IDs:", eventNodes.slice(0, 10).map((n: any) => ({
          id: n.id,
          label: n.label,
        })));

        // Sort event nodes by chapter first, then by position within chapter
        // Extract chapter from node ID to ensure correct ordering
        const sortedEventNodes = [...eventNodes].sort((a, b) => {
          // Extract chapter numbers from node IDs
          const chapterA = parseInt(a.id?.match(/ch(\d+)/)?.[1] || '1');
          const chapterB = parseInt(b.id?.match(/ch(\d+)/)?.[1] || '1');

          // First sort by chapter (1 before 2, etc.)
          if (chapterA !== chapterB) {
            return chapterA - chapterB;
          }

          // Within same chapter, sort by Y position (higher Y = lower on screen = earlier in tree)
          // In a skill tree, START is at bottom (high Y), END is at top (low Y)
          if (Math.abs(a.y - b.y) > 10) { // If Y values differ significantly
            return b.y - a.y; // Higher Y first (bottom of tree)
          }

          // If Y is similar (same row), sort by X position (left to right)
          return a.x - b.x;
        });

        // Create position map - events are numbered globally (1-200)
        // but we need to track them per chapter for proper mapping
        const posMap = new Map<string, number>();
        let currentChapter = 0;
        let eventInChapter = 0;

        sortedEventNodes.forEach((node, index) => {
          // Extract chapter from node ID
          const nodeChapter = parseInt(node.id?.match(/ch(\d+)/)?.[1] || '1');

          // Reset counter when entering new chapter
          if (nodeChapter !== currentChapter) {
            currentChapter = nodeChapter;
            eventInChapter = 0;
          }

          eventInChapter++;

          // Calculate global event number: (chapter-1) * 20 + eventInChapter
          const globalEventNumber = (currentChapter - 1) * 20 + eventInChapter;

          posMap.set(node.id, globalEventNumber);

          // Only log first few events per chapter to avoid spam
          if (eventInChapter <= 3 || eventInChapter === 20) {
            console.log(`Event position mapping: ${node.id} -> Chapter ${currentChapter}, Event ${eventInChapter} (Global: ${globalEventNumber})`);
          }
        });

        setEventNodePositionMap(posMap);
      }
    }
    console.log("Preview mode:", previewMode);
  }, [storyTrees, v1Tree, v2Tree, test5Tree, treeData, previewMode]);

  // Function to get a deterministic image for each node (fallback)
  const getNodeImage = useCallback((nodeId: string): string => {
    // This is a fallback for non-mechanism nodes
    // Just return a default image path
    return '/mek-images/150px/000-000-000.webp';
  }, []);
  
  // Function to get a random event image for event nodes
  const getEventImage = useCallback((nodeId: string): string => {
    // Use node ID to deterministically select an event image
    let hash = 0;
    for (let i = 0; i < nodeId.length; i++) {
      hash = ((hash << 5) - hash) + nodeId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    // There are 200 event images numbered 1.webp through 200.webp
    const totalEventImages = 200;
    const index = Math.abs(hash) % totalEventImages;

    // Return the correct filename (1-indexed)
    return `${index + 1}.webp`;
  }, []);

  // Load images for nodes and wait for them to load
  useEffect(() => {
    // Skip image loading in preview mode
    if (!treeData || previewMode) return;

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
          const imageName = getMekImage(node, false); // Pass full node object
          const img = new Image();
          const promise = new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Still resolve on error to not block
          });
          img.src = imageName; // Already has the full path from getMekImage
          imageMap.set(node.id, img);
          promises.push(promise);
        } else if (node.storyNodeType === 'event') {
          // Load event images for event nodes
          const eventData = getEventDataForNode(node);

          const img = new Image();
          const promise = new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Still resolve on error to not block
          });

          // Use deployed event image if available, otherwise use random
          if (eventData?.image) {
            // Ensure the path is properly formatted
            let imagePath = eventData.image;

            // Handle paths with spaces - they should already be URL-encoded from deployment
            // but ensure consistency
            if (imagePath.includes(' ') && !imagePath.includes('%20')) {
              imagePath = imagePath.replace(/ /g, '%20');
            }

            img.src = imagePath;
          } else {
            const eventImageName = getEventImage(node.id);
            const fallbackPath = `/event-images/450px%20webp/${eventImageName.replace(/ /g, '%20')}`;
            img.src = fallbackPath;
          }

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
    // Remove callback dependencies that cause loops - use stable dependencies instead
  }, [treeData?.nodes?.length, previewMode, getMekImage, getEventDataForNode]);

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
        const width = container.clientWidth - 20; // Reduce width by 20px to move right edge left
        const height = Math.max(300, Math.floor(width * 0.6)); // Much shorter canvas, roughly 60% of width
        // console.log("Canvas size updated:", { width, height });
        setCanvasSize({ width, height });
      }
    };
    
    updateSize(); // Call immediately
    setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [mounted]);

  // Auto-scroll removed - users can now freely scroll up and down as they wish

  // Draw the tree on canvas
  useEffect(() => {
    // console.log("Canvas draw effect:", {
    //   hasCanvas: !!canvasRef.current,
    //   hasTreeData: !!treeData,
    //   canvasWidth: canvasSize.width,
    //   canvasHeight: canvasSize.height,
    //   imagesLoaded: imagesLoaded
    // });
    
    // Don't require images to be loaded - render without them if needed
    if (!canvasRef.current || !treeData || !treeData.nodes || canvasSize.width === 0) {
      // console.log("Canvas draw skipped - missing core requirements");
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
    // MUST match the actual rendering sizes exactly (lines 565-590)
    nodes.forEach(node => {
      let nodeSize = 31.5; // normal nodes (5% larger)
      if (node.id === 'start') nodeSize = 75; // start node - MUST match line 571
      else if (node.storyNodeType === 'event') nodeSize = 67; // 12% bigger
      else if (node.storyNodeType === 'boss') nodeSize = 90; // boss nodes - MUST match line 581
      else if (node.storyNodeType === 'final_boss') nodeSize = 130; // final boss
      
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
      // console.log("Start node position:", { x: startNode.x, y: startNode.y });
      // console.log("Tree bounds:", { minX, maxX, minY, maxY });
      // console.log("Actual bounds with node sizes:", { actualMinX, actualMaxX, actualMinY, actualMaxY });
    }
    
    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;
    const actualTreeWidth = actualMaxX - actualMinX;
    
    // Calculate scale based on tree width, but we'll adjust positioning for centering
    const padding = 30; // Slightly more padding for safety
    const scaleX = (canvas.width - padding * 2) / treeWidth; // Scale based on node centers, not full width
    const scale = previewMode
      ? Math.min(
          (canvas.width - 100) / treeWidth,
          (canvas.height - 100) / treeHeight
        ) * 0.15  // Much smaller scale for preview to fit all nodes
      : scaleX * 0.77; // Original scale for normal mode
    
    // Calculate total tree height when scaled
    const scaledTreeHeight = treeHeight * scale;
    
    // Transform function - position tree for viewport
    const transform = (x: number, y: number) => {
      // Use the same scaling for both preview and normal modes
      const scaledX = (x - minX) * scale;
      const scaledY = (y - minY) * scale;

      // Center the START node horizontally in the canvas
      let offsetX;
      if (startNode) {
        // Calculate where the start node would be after scaling
        const startScaledX = (startNode.x - minX) * scale;
        // Center it by placing it at canvas.width / 2
        // Add a manual adjustment to compensate for visual centering
        const centerAdjustment = -55; // Shift LEFT another 10px to fit in canvas
        offsetX = (canvas.width / 2) - startScaledX + centerAdjustment;

        // Debug logging (only log once per render cycle)
        if (Math.random() > 0.99) {
          // console.log("START centering debug:", {
          //   canvasWidth: canvas.width,
          //   canvasCenter: canvas.width / 2,
          //   startNodeX: startNode.x,
          //   minX: minX,
          //   startScaledX: startScaledX,
          //   offsetX: offsetX,
          //   centerAdjustment: centerAdjustment,
          //   finalStartX: startScaledX + offsetX
          // });
        }
      } else {
        // Fallback to centering the whole tree if no start node
        const leftOverflow = (minX - actualMinX) * scale;
        offsetX = padding + leftOverflow;
      }
      
      // Position the start node near the bottom of the canvas
      let offsetY;
      if (previewMode) {
        // In preview mode, fit the whole tree in view
        const treeScale = Math.min(
          (canvas.width - 100) / treeWidth,
          (canvas.height - 100) / treeHeight
        ) * 0.8;
        offsetY = canvas.height - 50;
      } else if (startNode) {
        // Always position based on start node
        const startScaledY = (startNode.y - minY) * scale;
        // Put start node 740px from the top of the canvas
        // The circle should be positioned for visibility
        offsetY = 740 - startScaledY + viewportOffset; // Position at 740px from top (450 + 290)
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
        let from = transform(fromNode.x, fromNode.y);
        let to = transform(toNode.x, toNode.y);
        
        // Move all non-start nodes up by 45 pixels to match node positions
        if (fromNode.id !== 'start') {
          from.y -= 45;
        }
        if (toNode.id !== 'start') {
          to.y -= 45;
        }
        
        // Adjust connection points for event nodes since they're offset
        if (fromNode.storyNodeType === 'event') {
          from.x -= 7;
          from.y -= 3;
        }
        if (toNode.storyNodeType === 'event') {
          to.x -= 7;
          to.y -= 3;
        }
        
        // Only draw if at least one end is visible
        if (isInViewport(from.y) || isInViewport(to.y)) {
          // Check connection status
          const fromCompleted = completedNodes.has(fromNode.id);
          const toCompleted = completedNodes.has(toNode.id);
          const isAvailablePath = (fromCompleted && !toCompleted) || (toCompleted && !fromCompleted);
          
          ctx.save();
          if (isAvailablePath) {
            // Glowing connection to available nodes with smooth animation
            const connectionTime = Date.now() / 500;
            const rawConnectionGlow = Math.sin(connectionTime);
            const easedConnectionGlow = rawConnectionGlow < 0 ? -Math.pow(-rawConnectionGlow, 1.4) : Math.pow(rawConnectionGlow, 1.4);
            const glowIntensity = 0.5 + easedConnectionGlow * 0.25;

            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(250, 182, 23, ${glowIntensity})`;
            ctx.strokeStyle = '#fab617';
            ctx.lineWidth = 4; // Increased by 1
          } else if (fromCompleted && toCompleted) {
            // Completed connection - green with subtle glow
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3; // Increased by 1
          } else {
            // Unavailable connection
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#4b5563';
            ctx.lineWidth = 2; // Increased by 1
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
    // console.log(`Drawing ${nodes.length} nodes`);
    nodes.forEach((node, index) => {
      // Transform node position
      let pos = transform(node.x, node.y);
      
      // Move all non-start nodes up by 45 pixels
      if (node.id !== 'start') {
        pos.y -= 45;
      }
      
      // Special positioning for event nodes - move 7px left and 3px up
      if (node.storyNodeType === 'event') {
        pos.x -= 7;
        pos.y -= 3;
      }
      
      // REMOVED - Don't move nodes from their saved positions
      // The spacing is handled by moving the entire tree down
      
      // Log START node position specifically
      if (node.id === 'start') {
        // console.log(`START node transformed position: (${pos.x}, ${pos.y}), canvas height: ${canvas.height}`);
      }
      
      // Skip nodes outside viewport
      if (!isInViewport(pos.y)) {
        if (index < 5 || node.id === 'start') console.log(`Node ${node.id} skipped - outside viewport at y=${pos.y}`);
        return;
      }
      
      // if (index < 5 || node.id === 'start') console.log(`Drawing node ${node.id} at (${pos.x}, ${pos.y})`)
      
      // Check if node is completed
      const isCompleted = completedNodes.has(node.id);
      
      // Set node sizes - make all nodes bigger
      let nodeSize = 31.5; // normal nodes (5% larger) (was 28)
      let fillColor = 'transparent'; // No fill for normal nodes
      let strokeColor = '#6b7280'; // gray for unavailable
      let strokeWidth = 2; // thin stroke
      
      if (node.id === 'start') {
        nodeSize = 75; // start node - 25% bigger for hemisphere effect
        fillColor = '#fab617'; // yellow
        strokeColor = '#000000';
        strokeWidth = 3;
      } else if (node.storyNodeType === 'event') {
        nodeSize = 67; // Event nodes - 12% bigger (was 60)
        fillColor = '#2e1f3e'; // Very dark, desaturated purple (will be updated if available)
        strokeColor = '#6b7280'; // Will be updated after isAvailable is calculated
        strokeWidth = 2;
      } else if (node.storyNodeType === 'boss') {
        nodeSize = 90; // Boss nodes - 12% bigger (was 80, then 88, now +2%)
        fillColor = 'transparent'; // Will use custom rendering
        strokeColor = '#6b7280'; // Will be updated after isAvailable is calculated
        strokeWidth = 2;
      } else if (node.storyNodeType === 'final_boss') {
        nodeSize = 130; // Final boss - 30% bigger (was 100)
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
      
      // Check if this is the selected node
      const isSelected = selectedNode && selectedNode.id === node.id;

      // Update stroke color and width based on availability for non-mechanism nodes
      if (node.id !== 'start' && node.storyNodeType !== 'normal') {
        // White ring for available nodes, yellow for selected, green for completed
        strokeColor = isCompleted ? '#10b981' : (isSelected ? '#fab617' : (isAvailable ? '#ffffff' : '#6b7280'));
        strokeWidth = isSelected ? 4 : (isAvailable ? 3 : 2);
        if (node.storyNodeType === 'final_boss' && isAvailable) {
          strokeWidth = isSelected ? 5 : 4; // Thicker stroke for final boss
        }
        // Update event node fill color based on availability
        if (node.storyNodeType === 'event') {
          fillColor = isAvailable ? '#8b5cf6' : '#2e1f3e'; // Lighter purple when available, very dark desaturated when not
        }
      }
      
      // Draw subtle glow for available nodes (all types)
      if (isAvailable && node.id !== 'start') {
        // Enhanced glow for hovered node - fixed to compare IDs properly
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        
        // Debug logging for hover detection
        if (node.id === 'node-1' || node.id === 'node-2' || node.id === 'node-3') {
          if (hoveredNode) {
            console.log(`Node ${node.id}: hoveredNode.id=${hoveredNode.id}, isHovered=${isHovered}`);
          }
        }

        // Check if this is the selected node
        const isNodeSelected = selectedNode && selectedNode.id === node.id;

        // Apply strong pulsating glow for selected node
        if (isNodeSelected) {
          ctx.save();

          // Check if this is a challenger node for special red electric effect
          const isChallenger = node.challenger === true && node.storyNodeType === 'normal';

          if (isChallenger) {
            // RED ELECTRIC EFFECT for selected challenger nodes
            const time = Date.now() / 200; // Faster animation for electric feel
            const rawPulse = Math.sin(time * 2); // Double speed for more intense flashing
            const electricPulse = Math.random() > 0.7 ? 1 : rawPulse; // Random flicker effect
            const pulseIntensity = 0.8 + electricPulse * 0.2; // Higher base intensity when selected

            // Electric red gradient with random flickering
            const gradient = ctx.createRadialGradient(pos.x, pos.y, nodeSize, pos.x, pos.y, nodeSize + 40);
            gradient.addColorStop(0, `rgba(255, 0, 0, ${pulseIntensity})`);
            gradient.addColorStop(0.3, `rgba(255, 50, 50, ${pulseIntensity * 0.9})`);
            gradient.addColorStop(0.6, `rgba(200, 0, 0, ${pulseIntensity * 0.6})`);
            gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

            // Multiple electric rings with random offsets (more intense when selected)
            for (let i = 0; i < 4; i++) {
              ctx.beginPath();
              const randomOffset = Math.random() * 4;
              ctx.arc(pos.x, pos.y, nodeSize + 12 + i * 6 + randomOffset, 0, Math.PI * 2);
              ctx.strokeStyle = gradient;
              ctx.lineWidth = 3 + Math.random() * 2;
              ctx.globalAlpha = electricPulse * (1 - i * 0.2);
              ctx.stroke();
            }

            // Electric lightning bolts radiating outward (more bolts when selected)
            ctx.strokeStyle = `rgba(255, 100, 100, ${pulseIntensity})`;
            ctx.lineWidth = 2;
            ctx.globalAlpha = electricPulse * 0.9;

            for (let i = 0; i < 12; i++) {
              if (Math.random() > 0.2) { // More frequent bolts when selected
                const angle = (i / 12) * Math.PI * 2 + time * 0.1;
                const innerRadius = nodeSize + 5;
                const outerRadius = nodeSize + 25 + Math.random() * 15;

                ctx.beginPath();
                ctx.moveTo(pos.x + Math.cos(angle) * innerRadius, pos.y + Math.sin(angle) * innerRadius);

                // Jagged lightning path
                const steps = 4;
                for (let j = 1; j <= steps; j++) {
                  const progress = j / steps;
                  const radius = innerRadius + (outerRadius - innerRadius) * progress;
                  const offsetAngle = angle + (Math.random() - 0.5) * 0.4;
                  ctx.lineTo(pos.x + Math.cos(offsetAngle) * radius, pos.y + Math.sin(offsetAngle) * radius);
                }
                ctx.stroke();
              }
            }
          } else {
            // Normal yellow glow for non-challenger selected nodes
            const time = Date.now() / 400;
            const rawPulse = Math.sin(time);
            const easedPulse = rawPulse < 0 ? -Math.pow(-rawPulse, 1.5) : Math.pow(rawPulse, 1.5);
            const pulseIntensity = 0.7 + easedPulse * 0.25;

            if (node.storyNodeType === 'event' || node.storyNodeType === 'normal') {
              const gradient = ctx.createRadialGradient(pos.x, pos.y, nodeSize, pos.x, pos.y, nodeSize + 35);
              gradient.addColorStop(0, `rgba(250, 182, 23, ${pulseIntensity * 0.9})`);
              gradient.addColorStop(0.3, `rgba(250, 182, 23, ${pulseIntensity * 0.6})`);
              gradient.addColorStop(0.6, `rgba(250, 182, 23, ${pulseIntensity * 0.3})`);
              gradient.addColorStop(1, `rgba(250, 182, 23, 0)`);

              for (let i = 2; i >= 0; i--) {
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, nodeSize + i * 8 + easedPulse * 2, 0, Math.PI * 2);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2 + (2 - i);
                ctx.globalAlpha = 0.8 - i * 0.2;
                ctx.stroke();
              }
            } else {
              // Square glow for boss nodes
              const gradient = ctx.createRadialGradient(pos.x, pos.y, nodeSize, pos.x, pos.y, nodeSize + 35);
              gradient.addColorStop(0, `rgba(250, 182, 23, ${pulseIntensity * 0.9})`);
              gradient.addColorStop(0.3, `rgba(250, 182, 23, ${pulseIntensity * 0.6})`);
              gradient.addColorStop(0.6, `rgba(250, 182, 23, ${pulseIntensity * 0.3})`);
              gradient.addColorStop(1, `rgba(250, 182, 23, 0)`);

              for (let i = 2; i >= 0; i--) {
                const offset = i * 8 + easedPulse * 2;
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2 + (2 - i);
                ctx.globalAlpha = 0.8 - i * 0.2;
                ctx.strokeRect(pos.x - nodeSize - offset, pos.y - nodeSize - offset, (nodeSize + offset) * 2, (nodeSize + offset) * 2);
              }
            }
          }

          ctx.globalAlpha = 1;
          ctx.restore();
        } else if (isHovered) {
          // Enhanced hover glow for available nodes
          ctx.save();

          // Check if this is a challenger node for special effects
          const isChallenger = node.challenger === true && node.storyNodeType === 'normal';

          if (isChallenger) {
            // Special RED ELECTRIC FLASHING effect for challenger nodes
            const time = Date.now() / 200; // Faster animation for electric feel
            const rawPulse = Math.sin(time * 2); // Double speed for more intense flashing
            const electricPulse = Math.random() > 0.7 ? 1 : rawPulse; // Random flicker effect
            const pulseIntensity = 0.7 + electricPulse * 0.3;

            // Electric red gradient with random flickering
            const gradient = ctx.createRadialGradient(pos.x, pos.y, nodeSize, pos.x, pos.y, nodeSize + 35);
            gradient.addColorStop(0, `rgba(255, 0, 0, ${pulseIntensity})`);
            gradient.addColorStop(0.3, `rgba(255, 50, 50, ${pulseIntensity * 0.8})`);
            gradient.addColorStop(0.6, `rgba(200, 0, 0, ${pulseIntensity * 0.5})`);
            gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

            // Multiple electric rings with random offsets
            for (let i = 0; i < 3; i++) {
              ctx.beginPath();
              const randomOffset = Math.random() * 3;
              ctx.arc(pos.x, pos.y, nodeSize + 10 + i * 5 + randomOffset, 0, Math.PI * 2);
              ctx.strokeStyle = gradient;
              ctx.lineWidth = 2 + Math.random() * 2;
              ctx.globalAlpha = electricPulse * (0.9 - i * 0.2);
              ctx.stroke();
            }

            // Electric lightning bolts radiating outward
            ctx.strokeStyle = `rgba(255, 100, 100, ${pulseIntensity})`;
            ctx.lineWidth = 1;
            ctx.globalAlpha = electricPulse * 0.8;

            for (let i = 0; i < 8; i++) {
              if (Math.random() > 0.3) { // Random bolts appear/disappear
                const angle = (i / 8) * Math.PI * 2 + time * 0.1;
                const innerRadius = nodeSize + 5;
                const outerRadius = nodeSize + 20 + Math.random() * 10;

                ctx.beginPath();
                ctx.moveTo(pos.x + Math.cos(angle) * innerRadius, pos.y + Math.sin(angle) * innerRadius);

                // Jagged lightning path
                const steps = 3;
                for (let j = 1; j <= steps; j++) {
                  const progress = j / steps;
                  const radius = innerRadius + (outerRadius - innerRadius) * progress;
                  const offsetAngle = angle + (Math.random() - 0.5) * 0.3;
                  ctx.lineTo(pos.x + Math.cos(offsetAngle) * radius, pos.y + Math.sin(offsetAngle) * radius);
                }
                ctx.stroke();
              }
            }
          } else {
            // Normal hover effect for non-challenger nodes
            const time = Date.now() / 500;
            const rawPulse = Math.sin(time);
            const easedPulse = rawPulse < 0 ? -Math.pow(-rawPulse, 1.4) : Math.pow(rawPulse, 1.4);
            const pulseIntensity = 0.6 + easedPulse * 0.3;

            if (node.storyNodeType === 'event' || node.storyNodeType === 'normal') {
              // Circular glow for normal/event nodes
              const gradient = ctx.createRadialGradient(pos.x, pos.y, nodeSize, pos.x, pos.y, nodeSize + 25);
              gradient.addColorStop(0, `rgba(255, 255, 255, ${pulseIntensity * 0.8})`);
              gradient.addColorStop(0.3, `rgba(147, 197, 253, ${pulseIntensity * 0.5})`);
              gradient.addColorStop(0.6, `rgba(147, 197, 253, ${pulseIntensity * 0.3})`);
              gradient.addColorStop(1, `rgba(147, 197, 253, 0)`);

              ctx.beginPath();
              ctx.arc(pos.x, pos.y, nodeSize + 10 + easedPulse * 3, 0, Math.PI * 2);
              ctx.strokeStyle = gradient;
              ctx.lineWidth = 3;
              ctx.stroke();
            } else {
              // Square glow for boss nodes
              const offset = 10 + easedPulse * 3;
              ctx.shadowBlur = 20 + easedPulse * 10;
              ctx.shadowColor = `rgba(147, 197, 253, ${pulseIntensity})`;
              ctx.strokeStyle = `rgba(255, 255, 255, ${pulseIntensity * 0.8})`;
              ctx.lineWidth = 2;
              ctx.strokeRect(pos.x - nodeSize - offset, pos.y - nodeSize - offset, (nodeSize + offset) * 2, (nodeSize + offset) * 2);
            }
          }

          ctx.restore();
        } // Close isHovered block

        // Base glow for available nodes (subtle white glow, stronger yellow for selected)
        ctx.save();
        const isSelectedGlow = selectedNode && selectedNode.id === node.id;

        // Smoother animation for base glow
        const glowTime = Date.now() / (isSelectedGlow ? 400 : 1000);
        const rawGlow = Math.sin(glowTime);
        const easedGlow = rawGlow < 0 ? -Math.pow(-rawGlow, 1.3) : Math.pow(rawGlow, 1.3);
        const baseGlowIntensity = isSelectedGlow ? 0.4 + easedGlow * 0.25 : 0.15 + easedGlow * 0.04;

        ctx.shadowBlur = isSelectedGlow ? 35 : 20;
        ctx.shadowColor = isSelectedGlow ? `rgba(250, 182, 23, ${baseGlowIntensity})` : `rgba(255, 255, 255, ${baseGlowIntensity})`;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw shape for white backglow
        if (node.storyNodeType === 'event' || node.storyNodeType === 'normal') {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, nodeSize - 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(pos.x - nodeSize + 5, pos.y - nodeSize + 5, (nodeSize - 5) * 2, (nodeSize - 5) * 2);
        }
        ctx.restore();
        
        // Additional glow layer (yellow for selected, subtle white for others)
        ctx.save();
        const isNodeSelectedGlow = selectedNode && selectedNode.id === node.id;

        // Smooth animation for additional glow
        const additionalGlowTime = Date.now() / (isNodeSelectedGlow ? 400 : 1000);
        const rawAdditionalGlow = Math.sin(additionalGlowTime);
        const easedAdditionalGlow = rawAdditionalGlow < 0 ? -Math.pow(-rawAdditionalGlow, 1.4) : Math.pow(rawAdditionalGlow, 1.4);
        const glowIntensity = isNodeSelectedGlow ? 0.5 + easedAdditionalGlow * 0.25 : 0.2 + easedAdditionalGlow * 0.08;

        ctx.shadowBlur = isNodeSelectedGlow ? 25 : 10;
        ctx.shadowColor = isNodeSelectedGlow ? `rgba(250, 182, 23, ${glowIntensity})` : `rgba(255, 255, 255, ${glowIntensity * 0.5})`;
        
        // Draw shape for glow
        if (node.storyNodeType === 'event') {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, nodeSize, 0, Math.PI * 2);
          ctx.strokeStyle = 'transparent';
          ctx.stroke();
        } else if (node.storyNodeType === 'normal') {
          const isChallenger = (node as any).challenger === true;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, nodeSize, 0, Math.PI * 2);
          // Enhanced glow for Challenger nodes
          if (isChallenger) {
            ctx.shadowColor = `rgba(255, 100, 50, ${glowIntensity * 1.5})`;
            ctx.shadowBlur = 25;
          }
          ctx.strokeStyle = 'transparent';
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'transparent';
          ctx.strokeRect(pos.x - nodeSize, pos.y - nodeSize, nodeSize * 2, nodeSize * 2);
        }
        ctx.restore();
      } else if ((isAvailable || isCompleted) && node.storyNodeType !== 'normal' && node.id !== 'start') {
        ctx.save();
        const isNodeSelectedHere = selectedNode && selectedNode.id === node.id;
        if (isAvailable) {
          if (isNodeSelectedHere) {
            const selectedTime = Date.now() / 400;
            const rawSelectedGlow = Math.sin(selectedTime);
            const easedSelectedGlow = rawSelectedGlow < 0 ? -Math.pow(-rawSelectedGlow, 1.3) : Math.pow(rawSelectedGlow, 1.3);
            const glowIntensity = 0.6 + easedSelectedGlow * 0.35;
            ctx.shadowBlur = 30;
            ctx.shadowColor = `rgba(250, 182, 23, ${glowIntensity})`;
          } else {
            const subtleTime = Date.now() / 800;
            const rawSubtleGlow = Math.sin(subtleTime);
            const easedSubtleGlow = rawSubtleGlow < 0 ? -Math.pow(-rawSubtleGlow, 1.2) : Math.pow(rawSubtleGlow, 1.2);
            const glowIntensity = 0.3 + easedSubtleGlow * 0.15;
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(255, 255, 255, ${glowIntensity})`;
          }
        } else if (isCompleted) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
        }
        
        // Draw glow shape
        if (node.storyNodeType === 'event') {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, nodeSize, 0, Math.PI * 2);
          ctx.fillStyle = 'transparent';
          const isNodeSelectedStroke = selectedNode && selectedNode.id === node.id;
          ctx.strokeStyle = isCompleted ? '#10b981' : (isNodeSelectedStroke ? '#fab617' : '#ffffff');
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        } else {
          const isNodeSelectedStroke = selectedNode && selectedNode.id === node.id;
          ctx.strokeStyle = isCompleted ? '#10b981' : (isNodeSelectedStroke ? '#fab617' : '#ffffff');
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
        if (node.storyNodeType === 'event') {
          // Log only for first few events to avoid spam
          const eventNum = parseInt(node.label?.replace('E', '') || '0');
          if (eventNum <= 3) {
            console.log('🎨 Rendering event node:', {
              nodeId: node.id,
              nodeLabel: node.label,
              hasImage: eventImages.has(node.id),
              eventImagesSize: eventImages.size
            });
          }
        }

        if (eventImages.has(node.id)) {
          const img = eventImages.get(node.id)!;
          if (img.complete && img.naturalWidth > 0) {
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
              // Darken unavailable nodes - with fade effect on hover
              const fadeAmount = nodeFadeStates.get(node.id) || 0;
              const opacity = 0.8 * (1 - fadeAmount); // Fade from 0.8 to 0
              ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
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
        
        // Draw border with adjusted colors for availability
        const isEventSelected = selectedNode && selectedNode.id === node.id;
        ctx.strokeStyle = isCompleted ? '#10b981' :
                         (isEventSelected ? '#fab617' : (isAvailable ? '#ffffff' : '#3f3f46')); // White for available, yellow for selected
        ctx.lineWidth = isAvailable ? 2 : 1; // Thinner when not available
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
                           isAvailable ? `rgba(250, 182, 23, ${0.5 + pulse * 0.5})` : // Yellow glow for available
                           'rgba(107, 114, 128, 0.3)';
          ctx.fillStyle = isCompleted ? '#10b981' :
                         isAvailable ? '#fab617' :
                         '#6b7280';
          ctx.beginPath();
          ctx.arc(corner.x, corner.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        
        // Draw tech pattern overlay
        ctx.save();
        ctx.globalAlpha = 0.2;
        const isBossNodeSelected = selectedNode && selectedNode.id === node.id;
        ctx.strokeStyle = isCompleted ? '#10b981' : (isBossNodeSelected ? '#fab617' : (isAvailable ? '#ffffff' : '#6b7280'));
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
          ctx.shadowColor = 'rgba(250, 182, 23, 0.6)'; // Yellow shadow for available
        }
        ctx.strokeStyle = isCompleted ? '#10b981' :
                         isAvailable ? '#fab617' :
                         '#4b5563';
        ctx.lineWidth = isAvailable ? 2 : 1;
        ctx.strokeRect(pos.x - halfSize + 5, pos.y - halfSize + 5, 
                      halfSize * 2 - 10, halfSize * 2 - 10);
        ctx.restore();
        
        // Draw boss mech image
        if (nodeImages.has(node.id)) {
          const img = nodeImages.get(node.id)!;
          if (img.complete && img.naturalWidth > 0) {
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
              const fadeAmount = nodeFadeStates.get(node.id) || 0;
              const opacity = 0.7 * (1 - fadeAmount);
              ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
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
        const isFinalBossSelected = selectedNode && selectedNode.id === node.id;
        ctx.strokeStyle = isCompleted ? '#10b981' : (isFinalBossSelected ? '#fab617' : (isAvailable ? '#ffffff' : '#6b7280'));
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
          if (img.complete && img.naturalWidth > 0) {
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
              const fadeAmount = nodeFadeStates.get(node.id) || 0;
              const opacity = 0.8 * (1 - fadeAmount);
              ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
              ctx.fillRect(pos.x - halfSize + 15, pos.y - halfSize + 15, 
                          halfSize * 2 - 30, halfSize * 2 - 30);
            }
            ctx.restore();
          }
        }
        
        // Inner border with intense glow
        ctx.save();
        const isFinalBossNodeSelected = selectedNode && selectedNode.id === node.id;
        if (isAvailable) {
          ctx.shadowBlur = isFinalBossNodeSelected ? 35 : 25;
          ctx.shadowColor = isFinalBossNodeSelected ? 'rgba(250, 182, 23, 0.9)' : 'rgba(255, 255, 255, 0.8)';
        } else if (isCompleted) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = 'rgba(16, 185, 129, 0.7)';
        }
        ctx.strokeStyle = isCompleted ? '#10b981' :
                         (isFinalBossNodeSelected ? '#fab617' : (isAvailable ? '#ffffff' : '#4b5563'));
        ctx.lineWidth = isAvailable ? 3 : 2;
        ctx.strokeRect(pos.x - halfSize + 8, pos.y - halfSize + 8, 
                      halfSize * 2 - 16, halfSize * 2 - 16);
        ctx.restore();
        
      } else if (node.id === 'start') {
        // Draw special full circle start node
        ctx.save();

        const circleRadius = nodeSize; // 25% larger size

        // Draw full circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, circleRadius, 0, Math.PI * 2);
        ctx.closePath();
        
        // Industrial gradient fill with radial effect
        const gradient = ctx.createRadialGradient(pos.x, pos.y - circleRadius/3, 0, pos.x, pos.y, circleRadius);
        gradient.addColorStop(0, '#fbbf24');
        gradient.addColorStop(0.3, '#fab617');
        gradient.addColorStop(0.7, '#f59e0b');
        gradient.addColorStop(1, '#d97706');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add industrial metallic overlay
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, circleRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Add metallic sheen effect
        const sheenGradient = ctx.createLinearGradient(pos.x - circleRadius, pos.y - circleRadius, pos.x + circleRadius, pos.y);
        sheenGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        sheenGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.15)');
        sheenGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
        sheenGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
        sheenGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sheenGradient;
        ctx.fillRect(pos.x - circleRadius, pos.y - circleRadius, circleRadius * 2, circleRadius * 2);
        
        // Add improved industrial pattern
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.lineWidth = 1;
        
        // Concentric circles
        for (let r = 15; r < circleRadius; r += 15) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Radial lines (full circle)
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(pos.x + Math.cos(angle) * circleRadius, pos.y + Math.sin(angle) * circleRadius);
          ctx.stroke();
        }
        
        // Add subtle dots at intersections
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (let r = 30; r < circleRadius; r += 30) {
          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
            ctx.beginPath();
            ctx.arc(pos.x + Math.cos(angle) * r, pos.y + Math.sin(angle) * r, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
        
        // Black border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, circleRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
      } else {
        // All others are squares (normal, boss, final boss)
        const halfSize = nodeSize;
        
        // Draw background only for non-normal nodes
        if (node.storyNodeType !== 'normal') {
          ctx.fillStyle = fillColor;
          ctx.fillRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
        }
        
        // Draw mechanism image for normal nodes (but NOT the start node)
        if (node.storyNodeType === 'normal' && node.id !== 'start' && nodeImages.has(node.id)) {
          const img = nodeImages.get(node.id)!;
          if (img.complete && img.naturalWidth > 0) { // Check image is loaded and not broken
            ctx.save();
            // Draw circular frame for mechanism nodes
            const isChallenger = (node as any).challenger === true;
            
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, halfSize, 0, Math.PI * 2);
            
            // Background color - darker for Challenger nodes
            if (isChallenger) {
              ctx.fillStyle = 'rgba(40, 15, 15, 0.9)'; // Dark red/brown background
            } else {
              ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
            }
            ctx.fill();
            
            // Border styling with Challenger-specific colors
            let borderColor;
            let borderWidth;
            
            if (isChallenger) {
              // Challenger nodes: style-specific colors with pulsing effect
              const challengerPulse = 0.6 + Math.sin(Date.now() / 400) * 0.4;
              if (isCompleted) {
                borderColor = `rgba(16, 185, 129, ${challengerPulse})`; // Still green when completed
                borderWidth = 3;
              } else if (isAvailable) {
                const isChallengerSelected = selectedNode && selectedNode.id === node.id;
                borderColor = isChallengerSelected ? `rgba(250, 182, 23, ${challengerPulse})` : `rgba(255, 50, 50, ${challengerPulse})`; // Yellow if selected, red if available
                borderWidth = 3;
              } else {
                borderColor = `rgba(140, 40, 40, ${challengerPulse * 0.7})`; // Darker red pulse
                borderWidth = 2;
              }
            } else {
              // Normal node colors
              const isNormalSelected = selectedNode && selectedNode.id === node.id;
              borderColor = isCompleted ? 'rgba(16, 185, 129, 0.8)' :
                           (isNormalSelected ? 'rgba(250, 182, 23, 0.9)' : (isAvailable ? 'rgba(255, 255, 255, 0.9)' : 'rgba(60, 60, 80, 0.6)'));
              borderWidth = isCompleted ? 2 : isAvailable ? 2 : 1;
            }
            
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = borderWidth;
            ctx.stroke();
            
            // Add extra glow effect for Challenger nodes
            if (isChallenger && (isAvailable || isCompleted)) {
              ctx.save();
              const glowIntensity = 0.4 + Math.sin(Date.now() / 350) * 0.3;
              ctx.shadowBlur = 25;
              
              // Glow color based on completion
              if (isCompleted) {
                ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
              } else {
                ctx.shadowColor = 'rgba(255, 50, 50, 0.8)'; // Red glow for available challenger
              }
              
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, halfSize + 5, 0, Math.PI * 2);
              ctx.strokeStyle = 'transparent';
              ctx.stroke();
              ctx.restore();
            }


            
            // Add Challenger frame effects BEFORE clipping (so they appear behind the node)
            if (isChallenger) {  // Show frame for ALL challenger nodes, including completed ones
              ctx.save();
              const pulseTime = Date.now() / 500;
              const nodeOffset = hashCode(node.id) % 1000;

              // Draw special frame based on selected style
              switch (challengerFrameStyle) {
                case 'spikes':
                  // Draw jagged spikes around the circle - bigger and bolder
                  const spikeCount = 20; // Slightly fewer for bigger individual spikes
                  const baseAlpha = 0.9;
                  const animOffset = nodeOffset * 0.001; // Use node-specific offset for desync

                  // Single path for all spikes for better performance
                  ctx.save();

                  // Add glow for available state or green tint for completed
                  if (isCompleted) {
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
                    ctx.fillStyle = `rgba(40, 120, 40, ${baseAlpha * 0.8})`; // Green-tinted spikes for completed
                    ctx.strokeStyle = `rgba(16, 185, 129, ${0.6})`; // Green stroke for completed
                  } else if (isAvailable) {
                    ctx.shadowBlur = 12;
                    ctx.shadowColor = 'rgba(255, 50, 50, 0.6)';
                    ctx.fillStyle = `rgba(180, 40, 40, ${baseAlpha})`; // Brighter red when available
                    ctx.strokeStyle = `rgba(255, 50, 50, ${0.8})`; // Red glow stroke
                  } else {
                    ctx.fillStyle = `rgba(120, 35, 35, ${baseAlpha * 0.7})`; // Original muted red
                    ctx.strokeStyle = `rgba(100, 20, 20, ${0.6})`; // Very dark, subtle stroke
                  }
                  ctx.lineWidth = 2.5; // Bolder stroke

                  ctx.beginPath();
                  for (let i = 0; i < spikeCount; i++) {
                    const angle = (i / spikeCount) * Math.PI * 2;
                    const innerRadius = halfSize;
                    // Bigger spikes - 5-7 pixels out with more pronounced animation
                    const outerRadius = halfSize + 6 + Math.sin(pulseTime + i * 0.3 + animOffset) * 1.5;

                    // Create triangular spikes with wider angle for bolder look
                    const angleWidth = 0.05; // Wider spikes
                    const x1 = pos.x + Math.cos(angle - angleWidth) * innerRadius;
                    const y1 = pos.y + Math.sin(angle - angleWidth) * innerRadius;
                    const x2 = pos.x + Math.cos(angle) * outerRadius;
                    const y2 = pos.y + Math.sin(angle) * outerRadius;
                    const x3 = pos.x + Math.cos(angle + angleWidth) * innerRadius;
                    const y3 = pos.y + Math.sin(angle + angleWidth) * innerRadius;
                    
                    if (i === 0) {
                      ctx.moveTo(x1, y1);
                    } else {
                      ctx.lineTo(x1, y1);
                    }
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x3, y3);
                  }
                  ctx.closePath();
                  ctx.fill();
                  ctx.stroke();
                  ctx.restore();
                  break;
                  
                case 'lightning':
                  // Draw electric arcs around the circle
                  ctx.strokeStyle = `rgba(100, 200, 255, ${0.6 + Math.sin(pulseTime) * 0.4})`;
                  ctx.lineWidth = 1.5;
                  const arcCount = 8;
                  for (let i = 0; i < arcCount; i++) {
                    const startAngle = (i / arcCount) * Math.PI * 2 + pulseTime * 0.002;
                    const endAngle = startAngle + Math.PI / 6;
                    const radius = halfSize + 5;
                    ctx.beginPath();
                    const steps = 5;
                    for (let j = 0; j <= steps; j++) {
                      const t = j / steps;
                      const angle = startAngle + (endAngle - startAngle) * t;
                      const jitter = Math.random() * 4 - 2;
                      const r = radius + jitter;
                      const x = pos.x + Math.cos(angle) * r;
                      const y = pos.y + Math.sin(angle) * r;
                      if (j === 0) ctx.moveTo(x, y);
                      else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                  }
                  break;
                  
                case 'sawblade':
                  // Draw rotating sawblade teeth
                  ctx.fillStyle = `rgba(200, 200, 200, ${0.5 + Math.sin(pulseTime) * 0.2})`;
                  const teeth = 24;
                  const rotation = pulseTime * 0.002;
                  ctx.beginPath();
                  for (let i = 0; i < teeth; i++) {
                    const angle = (i / teeth) * Math.PI * 2 + rotation;
                    const nextAngle = ((i + 1) / teeth) * Math.PI * 2 + rotation;
                    const innerRadius = halfSize;
                    const outerRadius = halfSize + (i % 2 === 0 ? 8 : 4);
                    const x1 = pos.x + Math.cos(angle) * innerRadius;
                    const y1 = pos.y + Math.sin(angle) * innerRadius;
                    const x2 = pos.x + Math.cos(angle) * outerRadius;
                    const y2 = pos.y + Math.sin(angle) * outerRadius;
                    const x3 = pos.x + Math.cos(nextAngle) * outerRadius;
                    const y3 = pos.y + Math.sin(nextAngle) * outerRadius;
                    const x4 = pos.x + Math.cos(nextAngle) * innerRadius;
                    const y4 = pos.y + Math.sin(nextAngle) * innerRadius;
                    if (i === 0) ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x3, y3);
                    ctx.lineTo(x4, y4);
                  }
                  ctx.closePath();
                  ctx.fill();
                  break;
                  
                case 'flames':
                  // Draw animated flames around the circle
                  const flameCount = 12;
                  for (let i = 0; i < flameCount; i++) {
                    const angle = (i / flameCount) * Math.PI * 2;
                    const flameHeight = 12 + Math.sin(pulseTime + i * 0.5) * 4;
                    const baseX = pos.x + Math.cos(angle) * halfSize;
                    const baseY = pos.y + Math.sin(angle) * halfSize;
                    const tipX = pos.x + Math.cos(angle) * (halfSize + flameHeight);
                    const tipY = pos.y + Math.sin(angle) * (halfSize + flameHeight);
                    
                    // Gradient for flame
                    const gradient = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
                    gradient.addColorStop(0, `rgba(255, 100, 0, ${0.8})`);  
                    gradient.addColorStop(0.5, `rgba(255, 200, 0, ${0.6})`);
                    gradient.addColorStop(1, `rgba(255, 255, 100, ${0.2})`);
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.moveTo(baseX, baseY);
                    const controlX1 = baseX + Math.cos(angle - 0.2) * flameHeight * 0.3;
                    const controlY1 = baseY + Math.sin(angle - 0.2) * flameHeight * 0.3;
                    const controlX2 = baseX + Math.cos(angle + 0.2) * flameHeight * 0.3;
                    const controlY2 = baseY + Math.sin(angle + 0.2) * flameHeight * 0.3;
                    ctx.quadraticCurveTo(controlX1, controlY1, tipX, tipY);
                    ctx.quadraticCurveTo(controlX2, controlY2, baseX, baseY);
                    ctx.fill();
                  }
                  break;
                  
                case 'crystals':
                  // Draw crystalline shards around the circle
                  ctx.fillStyle = `rgba(150, 50, 255, ${0.4 + Math.sin(pulseTime) * 0.2})`;
                  ctx.strokeStyle = `rgba(200, 100, 255, ${0.7})`;
                  ctx.lineWidth = 1;
                  const crystalCount = 8;
                  for (let i = 0; i < crystalCount; i++) {
                    const angle = (i / crystalCount) * Math.PI * 2 + Math.sin(pulseTime * 0.001 + i) * 0.1;
                    const innerRadius = halfSize;
                    const outerRadius = halfSize + 10 + Math.sin(pulseTime * 0.002 + i * 2) * 2;
                    const width = 4;
                    
                    const baseX = pos.x + Math.cos(angle) * innerRadius;
                    const baseY = pos.y + Math.sin(angle) * innerRadius;
                    const tipX = pos.x + Math.cos(angle) * outerRadius;
                    const tipY = pos.y + Math.sin(angle) * outerRadius;
                    const leftX = baseX + Math.cos(angle + Math.PI/2) * width;
                    const leftY = baseY + Math.sin(angle + Math.PI/2) * width;
                    const rightX = baseX + Math.cos(angle - Math.PI/2) * width;
                    const rightY = baseY + Math.sin(angle - Math.PI/2) * width;
                    
                    ctx.beginPath();
                    ctx.moveTo(leftX, leftY);
                    ctx.lineTo(tipX, tipY);
                    ctx.lineTo(rightX, rightY);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                  }
                  break;
              }
              
              ctx.restore();
            }
            
            // Clip to circular shape (slightly smaller for frame effect)
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, halfSize - 2, 0, Math.PI * 2);
            ctx.clip();
            
            // Hover effect removed - no zoom or animation
            const isHovered = false; // Disabled per user request
            if (false) {
              ctx.save();
              // Scale effect on hover - DISABLED
              const hoverScale = 1.0; // No scale
              const scaledSize = halfSize * hoverScale;
              // Brightness effect
              ctx.filter = 'brightness(1.2) contrast(1.1)';
              ctx.drawImage(img, pos.x - scaledSize, pos.y - scaledSize, scaledSize * 2, scaledSize * 2);
              ctx.filter = 'none';
              ctx.restore();
            } else if (isChallenger && !isCompleted) {
              // Apply selected challenger effect
              ctx.save();
              
              // Create unique offset for each node based on its ID
              let nodeHash = 0;
              for (let i = 0; i < node.id.length; i++) {
                nodeHash = ((nodeHash << 5) - nodeHash) + node.id.charCodeAt(i);
              }
              const nodeOffset = (Math.abs(nodeHash) % 1000) / 100; // Unique offset 0-10
              const time = Date.now() + nodeOffset * 1000; // Add node-specific time offset
              
              // Always use Phase Shift effect for challengers // Phase Shift effect
                  // Draw base blurred image
                  ctx.filter = 'blur(2px) brightness(0.7) contrast(1.2)';
                  ctx.drawImage(img, pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
                  ctx.filter = 'none';
                  
                  // Phasing layers - image shifts between dimensions
                  ctx.globalCompositeOperation = 'screen';
                  const phaseCount = 4;
                  
                  for (let p = 0; p < phaseCount; p++) {
                    const phaseTime = time * 0.0006 + p * Math.PI * 0.5 + nodeOffset;
                    const phaseAlpha = (Math.sin(phaseTime) + 1) * 0.35;
                    const phaseX = Math.sin(phaseTime * 1.7) * 8;
                    const phaseY = Math.cos(phaseTime * 1.3) * 8;
                    
                    ctx.globalAlpha = phaseAlpha;
                    
                    // Draw phase-shifted copies with color tints
                    ctx.save();
                    if (p % 2 === 0) {
                      ctx.filter = 'hue-rotate(180deg)';
                    } else {
                      ctx.filter = 'hue-rotate(-60deg)';
                    }
                    ctx.drawImage(
                      img,
                      pos.x - halfSize + phaseX,
                      pos.y - halfSize + phaseY,
                      halfSize * 2, halfSize * 2
                    );
                    ctx.restore();
                  }
                  
                  // Quantum interference pattern
                  ctx.globalCompositeOperation = 'overlay';
                  ctx.globalAlpha = 0.3;
                  const interferenceTime = time * 0.0008;
                  
                  for (let x = 0; x < halfSize * 2; x += 4) {
                    for (let y = 0; y < halfSize * 2; y += 4) {
                      const dist1 = Math.sqrt(Math.pow(x - halfSize * 0.3, 2) + Math.pow(y - halfSize * 0.3, 2));
                      const dist2 = Math.sqrt(Math.pow(x - halfSize * 1.7, 2) + Math.pow(y - halfSize * 1.7, 2));
                      const interference = Math.sin(dist1 * 0.1 - interferenceTime) * Math.sin(dist2 * 0.1 + interferenceTime);
                      
                      if (interference > 0.5) {
                        const brightness = interference * 255;
                        ctx.fillStyle = `rgba(0, ${brightness}, ${brightness}, 0.5)`;
                        ctx.fillRect(pos.x - halfSize + x, pos.y - halfSize + y, 4, 4);
                      }
                    }
                  }
              
              ctx.globalAlpha = 1;
              ctx.globalCompositeOperation = 'source-over';
              ctx.restore();
            } else {
              // Draw image at full opacity always
              ctx.drawImage(img, pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
            }
            
            // Draw darkening overlay for unavailable/non-completed nodes
            if (!isCompleted && !isAvailable) {
              const fadeAmount = nodeFadeStates.get(node.id) || 0;
              const opacity = 0.8 * (1 - fadeAmount);
              ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
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
                const fadeAmount = nodeFadeStates.get(node.id) || 0;
                const opacity = 0.7 * (1 - fadeAmount);
                ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
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
                const fadeAmount = nodeFadeStates.get(node.id) || 0;
                const opacity = 0.8 * (1 - fadeAmount);
                ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
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
      
      // Draw checkmark for all completed nodes (including mechanisms)
      if (isCompleted && node.id !== 'start') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pos.x - nodeSize/4, pos.y);
        ctx.lineTo(pos.x - nodeSize/8, pos.y + nodeSize/4);
        ctx.lineTo(pos.x + nodeSize/4, pos.y - nodeSize/4);
        ctx.stroke();
      }

      // Draw GOLD FRAME for nodes with all difficulties completed
      const nodeDifficulties = completedDifficulties[node.id];
      const allDifficultyCompleted = nodeDifficulties &&
        nodeDifficulties.has('easy') &&
        nodeDifficulties.has('medium') &&
        nodeDifficulties.has('hard');

      if (allDifficultyCompleted && node.id !== 'start') {
        ctx.save();

        // Determine if node is circular (events and normal nodes are circles in the canvas)
        const isCircular = node.storyNodeType === 'event' || node.storyNodeType === 'normal';

        // Use actual node size for tight hugging frames
        const baseSize = node.storyNodeType === 'event' ? nodeSize :
                        node.storyNodeType === 'boss' ? halfSize :
                        node.storyNodeType === 'final_boss' ? halfSize :
                        node.storyNodeType === 'normal' ? nodeSize :
                        halfSize;

        // Style 1: Wavy Golden Aura
        if (goldFrameStyle === 1) {
          const time = Date.now() * 0.002;

          // Create wavy golden border that replaces the normal stroke
          ctx.lineWidth = 6;
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';

          // Create gradient
          const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, baseSize);
          gradient.addColorStop(0.7, '#ffed4e');
          gradient.addColorStop(0.85, '#ffd700');
          gradient.addColorStop(1, '#ffed4e');
          ctx.strokeStyle = gradient;

          if (isCircular) {
            // Draw wavy circle
            ctx.beginPath();
            const points = 32;
            for (let i = 0; i <= points; i++) {
              const angle = (i / points) * Math.PI * 2;
              const waveAmount = Math.sin(angle * 4 + time) * 3;
              const radius = baseSize + 2 + waveAmount;
              const x = pos.x + Math.cos(angle) * radius;
              const y = pos.y + Math.sin(angle) * radius;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
          } else {
            // Draw wavy square
            ctx.beginPath();
            const corners = [
              { x: -baseSize, y: -baseSize },
              { x: baseSize, y: -baseSize },
              { x: baseSize, y: baseSize },
              { x: -baseSize, y: baseSize }
            ];

            corners.forEach((corner, i) => {
              const next = corners[(i + 1) % 4];
              const steps = 8;
              for (let j = 0; j <= steps; j++) {
                const t = j / steps;
                const wave = Math.sin((t + i + time) * Math.PI * 2) * 3;
                const x = pos.x + corner.x + (next.x - corner.x) * t;
                const y = pos.y + corner.y + (next.y - corner.y) * t;

                // Add wave perpendicular to the edge
                const perpX = i % 2 === 0 ? 0 : wave;
                const perpY = i % 2 === 0 ? wave : 0;

                if (i === 0 && j === 0) ctx.moveTo(x + perpX, y + perpY);
                else ctx.lineTo(x + perpX, y + perpY);
              }
            });
            ctx.closePath();
            ctx.stroke();
          }
        }

        // Style 2: Spiked Sun Burst
        else if (goldFrameStyle === 2) {
          const time = Date.now() * 0.001;

          // Draw sun burst spikes
          ctx.strokeStyle = '#ffd700';
          ctx.fillStyle = '#ffd700';
          ctx.shadowBlur = 20;
          ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';

          if (isCircular) {
            // Draw spiky sun-like border
            const spikes = 16;
            ctx.beginPath();
            for (let i = 0; i <= spikes * 2; i++) {
              const angle = (i / (spikes * 2)) * Math.PI * 2;
              const isSpike = i % 2 === 0;
              const radius = isSpike ? baseSize + 8 + Math.sin(time * 2) * 2 : baseSize;
              const x = pos.x + Math.cos(angle) * radius;
              const y = pos.y + Math.sin(angle) * radius;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.globalAlpha = 0.3;
            ctx.fill();
            ctx.globalAlpha = 1;
          } else {
            // Draw crystalline edges for squares
            ctx.lineWidth = 4;
            const inset = 2;

            // Draw main frame with crystal cuts
            ctx.beginPath();
            const cutSize = 8;

            // Top edge with cuts
            ctx.moveTo(pos.x - baseSize + cutSize, pos.y - baseSize - inset);
            ctx.lineTo(pos.x + baseSize - cutSize, pos.y - baseSize - inset);
            ctx.lineTo(pos.x + baseSize + inset, pos.y - baseSize + cutSize);

            // Right edge
            ctx.lineTo(pos.x + baseSize + inset, pos.y + baseSize - cutSize);
            ctx.lineTo(pos.x + baseSize - cutSize, pos.y + baseSize + inset);

            // Bottom edge
            ctx.lineTo(pos.x - baseSize + cutSize, pos.y + baseSize + inset);
            ctx.lineTo(pos.x - baseSize - inset, pos.y + baseSize - cutSize);

            // Left edge
            ctx.lineTo(pos.x - baseSize - inset, pos.y - baseSize + cutSize);
            ctx.closePath();

            ctx.stroke();
            ctx.globalAlpha = 0.2;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        // Style 3: Flowing Liquid Gold
        else if (goldFrameStyle === 3) {
          const time = Date.now() * 0.0015;

          // Create flowing liquid effect
          const gradient = ctx.createLinearGradient(
            pos.x - baseSize, pos.y - baseSize,
            pos.x + baseSize, pos.y + baseSize
          );
          const shift = (Math.sin(time) + 1) / 2;
          gradient.addColorStop(0, '#ffed4e');
          gradient.addColorStop(0.3 + shift * 0.2, '#ffd700');
          gradient.addColorStop(0.7 - shift * 0.2, '#ffb347');
          gradient.addColorStop(1, '#ffed4e');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 5;
          ctx.shadowBlur = 12;
          ctx.shadowColor = 'rgba(255, 215, 0, 0.7)';

          if (isCircular) {
            // Draw flowing circle with drips
            ctx.beginPath();
            const points = 48;
            for (let i = 0; i <= points; i++) {
              const angle = (i / points) * Math.PI * 2;
              const flow = Math.sin(angle * 3 + time * 2) * 2;
              const drip = Math.max(0, Math.sin(angle * 8 + time * 3) * 3);
              const radius = baseSize + 1 + flow + drip;
              const x = pos.x + Math.cos(angle) * radius;
              const y = pos.y + Math.sin(angle) * radius;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
          } else {
            // Draw melting square
            ctx.beginPath();
            const melt = Math.sin(time) * 2;

            // Top edge (straight)
            ctx.moveTo(pos.x - baseSize, pos.y - baseSize);
            ctx.lineTo(pos.x + baseSize, pos.y - baseSize);

            // Right edge with drips
            for (let i = 0; i <= 8; i++) {
              const t = i / 8;
              const drip = Math.max(0, Math.sin(t * Math.PI * 3 + time * 2) * 4);
              ctx.lineTo(pos.x + baseSize + drip, pos.y - baseSize + t * baseSize * 2);
            }

            // Bottom edge with waves
            for (let i = 8; i >= 0; i--) {
              const t = i / 8;
              const wave = Math.sin(t * Math.PI * 2 + time) * 3;
              ctx.lineTo(pos.x + baseSize - t * baseSize * 2, pos.y + baseSize + wave + melt);
            }

            // Left edge
            ctx.lineTo(pos.x - baseSize, pos.y - baseSize);
            ctx.stroke();
          }
        }

        // Style 4: Celestial Ring
        else if (goldFrameStyle === 4) {
          const time = Date.now() * 0.001;

          // Create gradient for celestial effect
          const gradient = ctx.createRadialGradient(pos.x, pos.y, baseSize - 5, pos.x, pos.y, baseSize + 5);
          gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
          gradient.addColorStop(0.3, '#ffd700');
          gradient.addColorStop(0.5, '#ffed4e');
          gradient.addColorStop(0.7, '#ffd700');
          gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 4;
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ffd700';

          if (isCircular) {
            // Draw orbital ring with star-like points
            ctx.beginPath();
            const points = 24;
            for (let i = 0; i <= points; i++) {
              const angle = (i / points) * Math.PI * 2;
              const isPoint = i % 3 === 0;
              const pointOffset = isPoint ? Math.sin(time * 3 + i) * 2 + 3 : 0;
              const radius = baseSize + 2 + pointOffset;
              const x = pos.x + Math.cos(angle) * radius;
              const y = pos.y + Math.sin(angle) * radius;

              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();

            // Add small orbiting stars
            ctx.fillStyle = '#ffed4e';
            ctx.shadowBlur = 10;
            const starCount = 6;
            for (let i = 0; i < starCount; i++) {
              const angle = (i / starCount) * Math.PI * 2 + time * 2;
              const starX = pos.x + Math.cos(angle) * (baseSize + 8);
              const starY = pos.y + Math.sin(angle) * (baseSize + 8);

              ctx.save();
              ctx.translate(starX, starY);
              ctx.rotate(time * 3 + i);

              // Draw 4-pointed star
              ctx.beginPath();
              ctx.moveTo(0, -3);
              ctx.lineTo(1, 0);
              ctx.lineTo(0, 3);
              ctx.lineTo(-1, 0);
              ctx.closePath();
              ctx.fill();

              ctx.restore();
            }
          } else {
            // Square version with corner stars
            const halfSize = baseSize + 2;

            // Draw enchanted square frame
            ctx.beginPath();
            // Top edge with wave
            for (let i = 0; i <= 10; i++) {
              const t = i / 10;
              const wave = Math.sin(t * Math.PI * 2 + time * 3) * 2;
              const x = pos.x - halfSize + (t * halfSize * 2);
              const y = pos.y - halfSize + wave;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            // Right edge
            for (let i = 0; i <= 10; i++) {
              const t = i / 10;
              const wave = Math.sin(t * Math.PI * 2 + time * 3 + Math.PI/2) * 2;
              const x = pos.x + halfSize + wave;
              const y = pos.y - halfSize + (t * halfSize * 2);
              ctx.lineTo(x, y);
            }
            // Bottom edge
            for (let i = 10; i >= 0; i--) {
              const t = i / 10;
              const wave = Math.sin(t * Math.PI * 2 + time * 3 + Math.PI) * 2;
              const x = pos.x - halfSize + (t * halfSize * 2);
              const y = pos.y + halfSize + wave;
              ctx.lineTo(x, y);
            }
            // Left edge
            for (let i = 10; i >= 0; i--) {
              const t = i / 10;
              const wave = Math.sin(t * Math.PI * 2 + time * 3 + Math.PI*1.5) * 2;
              const x = pos.x - halfSize + wave;
              const y = pos.y - halfSize + (t * halfSize * 2);
              ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();

            // Add corner stars
            ctx.fillStyle = '#ffed4e';
            const corners = [
              { x: pos.x - halfSize - 5, y: pos.y - halfSize - 5 },
              { x: pos.x + halfSize + 5, y: pos.y - halfSize - 5 },
              { x: pos.x + halfSize + 5, y: pos.y + halfSize + 5 },
              { x: pos.x - halfSize - 5, y: pos.y + halfSize + 5 }
            ];

            corners.forEach((corner, i) => {
              ctx.save();
              ctx.translate(corner.x, corner.y);
              ctx.rotate(time * 4 + i * Math.PI/2);

              // Draw star burst
              ctx.beginPath();
              for (let j = 0; j < 4; j++) {
                const angle = (j / 4) * Math.PI * 2;
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * 4, Math.sin(angle) * 4);
              }
              ctx.stroke();

              ctx.restore();
            });
          }
        }

        // Style 5: Classical Laurel Wreath
        else if (goldFrameStyle === 5) {
          // Classical laurel wreath design
          ctx.strokeStyle = '#b8860b';
          ctx.fillStyle = '#ffd700';
          ctx.lineWidth = 3;
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';

          if (isCircular) {
            // Draw laurel wreath circle
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, baseSize + 1, 0, Math.PI * 2);
            ctx.stroke();

            // Draw laurel leaves around the circle
            const leafCount = 16;
            for (let i = 0; i < leafCount; i++) {
              const angle = (i / leafCount) * Math.PI * 2;
              const leafRadius = baseSize + 5;
              const leafX = pos.x + Math.cos(angle) * leafRadius;
              const leafY = pos.y + Math.sin(angle) * leafRadius;

              ctx.save();
              ctx.translate(leafX, leafY);
              ctx.rotate(angle + Math.PI / 2);

              // Draw laurel leaf
              ctx.beginPath();
              ctx.ellipse(0, 0, 2, 5, 0, 0, Math.PI * 2);
              ctx.fill();

              // Add leaf detail line
              ctx.strokeStyle = '#8b6914';
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(0, -5);
              ctx.lineTo(0, 5);
              ctx.stroke();

              ctx.restore();
            }

            // Inner decorative ring
            ctx.strokeStyle = '#cdaa3d';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, baseSize - 3, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            // Square frame with laurel corners
            ctx.strokeRect(pos.x - baseSize - 1, pos.y - baseSize - 1,
                         (baseSize + 1) * 2, (baseSize + 1) * 2);

            // Draw laurel branches at corners
            const corners = [
              { x: pos.x - baseSize, y: pos.y - baseSize, angle: -Math.PI/4 },
              { x: pos.x + baseSize, y: pos.y - baseSize, angle: Math.PI/4 },
              { x: pos.x + baseSize, y: pos.y + baseSize, angle: 3*Math.PI/4 },
              { x: pos.x - baseSize, y: pos.y + baseSize, angle: -3*Math.PI/4 }
            ];

            corners.forEach(corner => {
              ctx.save();
              ctx.translate(corner.x, corner.y);
              ctx.rotate(corner.angle);

              // Draw laurel branch
              for (let i = 0; i < 3; i++) {
                const leafX = i * 3;
                ctx.beginPath();
                ctx.ellipse(leafX, 0, 1.5, 3, 0, 0, Math.PI * 2);
                ctx.fill();
              }

              ctx.restore();
            });

            // Inner frame
            ctx.strokeStyle = '#cdaa3d';
            ctx.lineWidth = 1;
            ctx.strokeRect(pos.x - baseSize + 3, pos.y - baseSize + 3,
                         (baseSize - 3) * 2, (baseSize - 3) * 2);
          }
        }

        ctx.restore();
      }

      // Draw node label
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (node.id === 'start') {
        // START text INSIDE the hemisphere with better design
        ctx.save();
        
        // Create text with gradient effect
        ctx.font = 'bold 28px Tahoma';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add strong black outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText('START', pos.x, pos.y);

        // White text with glow
        ctx.shadowColor = 'rgba(250, 182, 23, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('START', pos.x, pos.y);
        
        ctx.restore();
        // Reset font for other nodes
        ctx.font = 'bold 10px Orbitron';
      } else if (node.storyNodeType === 'boss') {
        // Draw text INSIDE the boss square at the bottom
        ctx.save();
        
        // Draw at bottom inside the square with dark background card
        ctx.save();
        // Draw dark background rectangle for text
        const textWidth = 70;
        const textHeight = 20;
        const textY = pos.y + nodeSize - 20;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(pos.x - textWidth/2, textY - textHeight/2, textWidth, textHeight);

        // Draw text on top of background
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = isCompleted ? '#10b981' : isAvailable ? '#ef4444' : '#9ca3af';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MINI BOSS', pos.x, textY);
        ctx.restore();
      } else if (node.storyNodeType === 'final_boss') {
        // Draw text INSIDE the final boss square at the bottom with dark background
        ctx.save();

        // Draw dark background rectangle for both text lines
        const textWidth = 140;
        const textHeight = 45;
        const textCenterY = pos.y + nodeSize - 25;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(pos.x - textWidth/2, textCenterY - textHeight/2, textWidth, textHeight);

        // Draw main title
        ctx.font = 'bold 16px Impact';
        ctx.fillStyle = isCompleted ? '#10b981' : isAvailable ? '#fab617' : '#9ca3af'; // Yellow text for available mini-boss
        ctx.textAlign = 'center';
        ctx.fillText('FINAL BOSS', pos.x, pos.y + nodeSize - 35);

        // Draw subtitle
        ctx.font = 'bold 12px Verdana';
        ctx.fillStyle = isCompleted ? '#ffffff' : isAvailable ? '#10b981' : '#6b7280';
        ctx.fillText('THE APEX MECHANISM', pos.x, pos.y + nodeSize - 15);
        ctx.restore();
      } else if (node.storyNodeType === 'event') {
        // Draw EVENT text inside the node with curved text along bottom inner edge
        ctx.save();

        // Get the event name from deployed data
        const eventData = getEventDataForNode(node);
        let eventTitle = '';

        if (eventData?.name && eventData.name !== 'EVENT NODE') {
          // Use deployed event name
          eventTitle = eventData.name;
        } else {
          // Better fallback: use event number from label
          const eventNumMatch = node.label?.match(/E(\d+)/);
          if (eventNumMatch) {
            const localEventNum = eventNumMatch[1];
            // Extract chapter from node ID
            const chapterMatch = node.id?.match(/ch(\d+)/);
            const chapter = chapterMatch ? parseInt(chapterMatch[1]) : 1;
            const globalEventNumber = (chapter - 1) * 20 + parseInt(localEventNum);

            // Use a more descriptive default name
            eventTitle = `Event ${globalEventNumber}`;

            console.log('📝 Using fallback event title:', eventTitle, 'for node:', node.label);
          } else {
            // Last resort fallback
            eventTitle = 'Event';
          }
        }
        
        // Draw curved text INSIDE the circle along the bottom with background
        ctx.font = '500 11px Verdana'; // Lighter weight for better readability
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Calculate text arc parameters
        const textRadius = nodeSize - 12; // Inside the circle, with padding from edge
        const arcText = eventTitle.toUpperCase();
        const letterSpacing = 0.16; // More spacing between letters for better readability
        const totalArc = letterSpacing * (arcText.length - 1);
        const startAngle = Math.PI / 2 + totalArc / 2; // Start from bottom, centered
        
        // Draw background arc for event title
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, textRadius, startAngle - totalArc - 0.1, startAngle + 0.1);
        ctx.stroke();
        ctx.restore();
        
        // Draw each letter curved along the bottom inside of the circle
        ctx.fillStyle = isCompleted ? '#ffffff' : isAvailable ? '#ffffff' : '#9ca3af'; // Keep title white when available
        for (let i = 0; i < arcText.length; i++) {
          const angle = startAngle - (i * letterSpacing);
          const charX = pos.x + Math.cos(angle) * textRadius;
          const charY = pos.y + Math.sin(angle) * textRadius;
          
          ctx.save();
          ctx.translate(charX, charY);
          ctx.rotate(angle - Math.PI / 2); // Rotate to follow the curve
          ctx.fillText(arcText[i], 0, 0);
          ctx.restore();
        }
        
        // Draw "EVENT" curved at the top of the circle with background
        ctx.font = 'bold 11px Trebuchet MS';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add semi-transparent background for EVENT text
        const eventText = 'EVENT';
        const topRadius = nodeSize - 10; // EVENT text positioned away from rim
        const topLetterSpacing = 0.15;
        const topTotalArc = topLetterSpacing * (eventText.length - 1);
        const topStartAngle = -Math.PI / 2 - topTotalArc / 2;
        
        // Draw background arc for EVENT text
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, topRadius, topStartAngle - 0.1, topStartAngle + topTotalArc + 0.1);
        ctx.stroke();
        ctx.restore();
        
        // Draw EVENT text
        ctx.fillStyle = '#8b5cf6';
        for (let i = 0; i < eventText.length; i++) {
          const angle = topStartAngle + (i * topLetterSpacing);
          const charX = pos.x + Math.cos(angle) * topRadius;
          const charY = pos.y + Math.sin(angle) * topRadius;

          ctx.save();
          ctx.translate(charX, charY);
          ctx.rotate(angle + Math.PI / 2);
          ctx.fillText(eventText[i], 0, 0);
          ctx.restore();
        }
        ctx.restore(); // Restore the context saved at the beginning of event node drawing
      } else {
        // Normal nodes - show number if available
        const nodeNumber = node.label.match(/\d+/) || [''];
        ctx.fillText(nodeNumber[0], pos.x, pos.y);
      }

      // Draw countdown timer overlay on active mission nodes
      const activeMission = activeMissions?.find(m => m.nodeId === node.id);
      if (activeMission) {
        const now = Date.now();
        const endTime = activeMission.startTime + activeMission.duration;
        const remainingMs = Math.max(0, endTime - now);

        if (remainingMs > 0) {
          // Calculate time components
          const totalSeconds = Math.floor(remainingMs / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;

          // Format time string
          let timeString = '';
          if (hours > 0) {
            timeString = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          } else {
            timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }

          // Draw blue glow around the node to indicate active mission
          ctx.save();
          const pulseAmount = Math.sin(Date.now() / 400) * 0.3 + 0.7;
          const baseColor = remainingMs < 60000 ? [239, 68, 68] : [6, 182, 212]; // RGB values

          // Style 1: Soft Radial Glow (subtle, diffuse)
          if (missionGlowStyle === 1) {
            ctx.shadowBlur = 40;
            ctx.shadowColor = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${pulseAmount * 0.6})`;
            ctx.strokeStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${pulseAmount * 0.3})`;
            ctx.lineWidth = 2;

            if (node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss') {
              ctx.strokeRect(pos.x - nodeSize - 2, pos.y - nodeSize - 2, (nodeSize + 2) * 2, (nodeSize + 2) * 2);
            } else {
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, nodeSize + 2, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          // Style 2: Double Halo (two gentle rings)
          else if (missionGlowStyle === 2) {
            ctx.shadowBlur = 30;
            ctx.strokeStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${pulseAmount * 0.4})`;
            ctx.lineWidth = 1.5;

            if (node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss') {
              ctx.shadowColor = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 0.5)`;
              ctx.strokeRect(pos.x - nodeSize - 3, pos.y - nodeSize - 3, (nodeSize + 3) * 2, (nodeSize + 3) * 2);
              ctx.strokeRect(pos.x - nodeSize - 6, pos.y - nodeSize - 6, (nodeSize + 6) * 2, (nodeSize + 6) * 2);
            } else {
              ctx.shadowColor = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 0.5)`;
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, nodeSize + 3, 0, Math.PI * 2);
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, nodeSize + 6, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          // Style 3: Ethereal Aura (very soft, wide glow)
          else if (missionGlowStyle === 3) {
            ctx.shadowBlur = 50;
            ctx.shadowColor = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${pulseAmount * 0.5})`;
            ctx.strokeStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${pulseAmount * 0.2})`;
            ctx.lineWidth = 1;

            if (node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss') {
              ctx.strokeRect(pos.x - nodeSize - 1, pos.y - nodeSize - 1, (nodeSize + 1) * 2, (nodeSize + 1) * 2);
            } else {
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, nodeSize + 1, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          // Style 4: Gentle Pulse (single ring, medium intensity)
          else if (missionGlowStyle === 4) {
            ctx.shadowBlur = 35;
            ctx.shadowColor = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${pulseAmount * 0.7})`;
            ctx.strokeStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${pulseAmount * 0.5})`;
            ctx.lineWidth = 2.5;

            if (node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss') {
              ctx.strokeRect(pos.x - nodeSize - 4, pos.y - nodeSize - 4, (nodeSize + 4) * 2, (nodeSize + 4) * 2);
            } else {
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, nodeSize + 4, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          // Style 5: Shimmer Edge (tight, bright edge glow)
          else if (missionGlowStyle === 5) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${pulseAmount * 0.9})`;
            ctx.strokeStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${pulseAmount * 0.7})`;
            ctx.lineWidth = 3;

            if (node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss') {
              ctx.strokeRect(pos.x - nodeSize, pos.y - nodeSize, nodeSize * 2, nodeSize * 2);
            } else {
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, nodeSize, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          ctx.restore();

          ctx.save();

          // First, darken the entire node area
          let overlaySize = nodeSize;
          if (node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss') {
            // Square overlay for boss nodes
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(pos.x - overlaySize, pos.y - overlaySize, overlaySize * 2, overlaySize * 2);
          } else if (node.id === 'start') {
            // Special case for start node
            overlaySize = 75;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, overlaySize, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fill();
          } else {
            // Circular overlay for normal and event nodes
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, overlaySize, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fill();
          }

          // Draw countdown timer in center of node
          ctx.shadowBlur = 10;
          ctx.shadowColor = remainingMs < 60000 ? `rgba(239, 68, 68, ${pulseAmount})` : `rgba(6, 182, 212, ${pulseAmount})`;

          // Draw time string with larger font
          ctx.font = 'bold 16px Orbitron';
          ctx.fillStyle = remainingMs < 60000 ? '#ef4444' : '#06b6d4';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(timeString, pos.x, pos.y);

          // Draw a circular progress indicator
          const progress = (currentTime - activeMission.startTime) / activeMission.duration;
          ctx.strokeStyle = remainingMs < 60000 ? `rgba(239, 68, 68, ${pulseAmount})` : `rgba(6, 182, 212, ${pulseAmount})`;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.shadowBlur = 5;

          // Draw progress arc
          const arcRadius = overlaySize - 5;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, arcRadius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress), false);
          ctx.stroke();

          ctx.restore();
        }
      }
    });
    
    // console.log("Canvas render complete");
  }, [treeData, canvasSize, viewportOffset, completedNodes, nodeImages, eventImages, imagesLoaded, panOffset, zoom, hoveredNode, animationTick, challengerFrameStyle, getEventDataForNode, activeMissions, currentTime, missionGlowStyle]);

  // Separate effect for jump button visibility to avoid infinite loop
  useEffect(() => {
    if (treeData && treeData.nodes) {
      const startNode = treeData.nodes.find(n => n.id === 'start');
      if (startNode) {
        // Show button when scrolled up (positive viewportOffset) or down significantly from start
        // or when panned away from center
        const isScrolledAway = viewportOffset > 50 || viewportOffset < -600 || Math.abs(panOffset.y) > 100 || Math.abs(panOffset.x) > 100;
        setShowJumpButton(isScrolledAway);
      }
    }
  }, [treeData, viewportOffset, panOffset.y, panOffset.x]);

  // Check if there are any challenger nodes that need animation
  const hasChallenger = useMemo(() => {
    return treeData?.nodes?.some(node =>
      node.challenger === true && node.storyNodeType === 'normal'
    ) || false;
  }, [treeData]);

  // Animation loop for continuous hover effects and challenger glitch
  useEffect(() => {
    // Skip animation in preview mode to prevent performance issues
    if (previewMode) return;

    // Clear any existing animation
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    let lastTime = 0;
    const targetFPS = 30;
    const frameDelay = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      // Throttle to target FPS
      if (currentTime - lastTime < frameDelay) {
        animationIdRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTime = currentTime;

      // Update fade states for inactive nodes
      setNodeFadeStates(prev => {
        const newStates = new Map(prev);
        let hasChanges = false;

        // Hide tooltip when not hovering over an inactive node
        if (!hoveredNode || completedNodes.has(hoveredNode.id)) {
          setInactiveNodeTooltip(prevTooltip => {
            if (prevTooltip.visible && !prevTooltip.fading) {
              // Start fade out animation
              setTimeout(() => {
                setInactiveNodeTooltip(prev => ({ ...prev, visible: false, fading: false }));
              }, 200); // Match animation duration
              return { ...prevTooltip, fading: true };
            }
            return prevTooltip;
          });
        }

        // Update or add fade state for hovered node if it's inactive
        if (hoveredNode && !completedNodes.has(hoveredNode.id)) {
          const isAvailable = treeData?.connections.some(conn => {
            let connectedNodeId = null;
            if (conn.from === hoveredNode.id) {
              connectedNodeId = conn.to;
            } else if (conn.to === hoveredNode.id) {
              connectedNodeId = conn.from;
            }
            if (!connectedNodeId || !completedNodes.has(connectedNodeId)) return false;
            const connectedNode = treeData.nodes?.find(n => n.id === connectedNodeId);
            if (!connectedNode) return false;
            return hoveredNode.y < connectedNode.y;
          });

          if (!isAvailable) {
            const currentFade = newStates.get(hoveredNode.id) || 0;
            const targetFade = 1;
            const newFade = Math.min(currentFade + 0.0625, targetFade); // 25% faster fade in (was 0.05, now 0.0625)
            if (newFade !== currentFade) {
              newStates.set(hoveredNode.id, newFade);
              hasChanges = true;
            }
          }
        }

        // Fade out all other nodes
        for (const [nodeId, fadeValue] of newStates) {
          if (!hoveredNode || hoveredNode.id !== nodeId) {
            const newFade = Math.max(fadeValue - 0.0375, 0); // 25% slower fade out (was 0.05, now 0.0375)
            if (newFade > 0) {
              newStates.set(nodeId, newFade);
              hasChanges = true;
            } else {
              newStates.delete(nodeId);
              hasChanges = true;
            }
          }
        }

        return hasChanges ? newStates : prev;
      });

      // Animate for hover effects OR if there are challenger nodes OR if we have fade animations
      if (hoveredNode || hasChallenger || nodeFadeStates.size > 0) {
        // Force a redraw by updating animation tick
        setAnimationTick(prev => prev + 1);
        animationIdRef.current = requestAnimationFrame(animate);
      } else {
        animationIdRef.current = null;
      }
    };

    // Start animation if needed
    if ((hoveredNode && (hoverEffectStyle === 4 || hoverEffectStyle === 1 || hoverEffectStyle === 3)) || hasChallenger || nodeFadeStates.size > 0) {
      animationIdRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, [hoveredNode, treeData, hoverEffectStyle, previewMode, nodeFadeStates, completedNodes, hasChallenger]);

  // Handle mouse events for panning
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsMouseDown(true);
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setPanStart({ x: e.clientX, y: e.clientY });
    setHasDragged(false);
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Store mouse position for tooltip - only update if changed significantly
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;
      // Only update if mouse moved more than 5 pixels to prevent re-render loops
      setMousePosition(prev => {
        if (Math.abs(prev.x - newX) > 5 || Math.abs(prev.y - newY) > 5) {
          return { x: newX, y: newY };
        }
        return prev;
      });
    }

    // Handle hover detection when not dragging
    if (!isMouseDown && canvasRef.current && treeData) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      // Scale mouse coordinates to match canvas internal resolution
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      // Apply same position adjustments as in draw function
      const nodes = (treeData.nodes || []).map(node => {
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
        let nodeSize = 31.5; // normal nodes (5% larger) - must match render exactly
        if (node.id === 'start') nodeSize = 75; // MUST match actual render size (line 571)
        else if (node.storyNodeType === 'event') nodeSize = 67; // 12% bigger
        else if (node.storyNodeType === 'boss') nodeSize = 90; // MUST match actual render size (line 581)
        else if (node.storyNodeType === 'final_boss') nodeSize = 130; // MUST match actual render size (line 586)

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
      const treeScaleX = (canvas.width - padding * 2) / treeWidth;
      const scale = treeScaleX * 0.77; // Match the render function scale EXACTLY (was 0.85, should be 0.77)
      const scaledTreeHeight = treeHeight * scale;

      const startNodeInHover = nodes.find(n => n.id === 'start'); // Find start node first

      const transform = (nodeX: number, nodeY: number) => {
        const scaledX = (nodeX - minX) * scale;
        const scaledY = (nodeY - minY) * scale;

        // Use the same offset calculation as the draw function
        let offsetX;
        if (startNodeInHover) {
          const startScaledX = (startNodeInHover.x - minX) * scale;
          const centerAdjustment = -55; // Match the render function offset - MUST MATCH EXACTLY
          offsetX = (canvas.width / 2) - startScaledX + centerAdjustment;
        } else {
          const leftOverflow = (minX - actualMinX) * scale;
          const padding = 30;
          offsetX = padding + leftOverflow;
        }

        // Position the start node near the bottom of the canvas
        let offsetY;
        if (startNodeInHover) {
          const startScaledY = (startNodeInHover.y - minY) * scale;
          // Must match the draw function's offsetY calculation exactly
          offsetY = 740 - startScaledY + viewportOffset;
        } else {
          offsetY = canvas.height - scaledTreeHeight + viewportOffset - padding;
        }

        return {
          x: scaledX + offsetX + panOffset.x,
          y: scaledY + offsetY + panOffset.y
        };
      };

      // Check if hover is on any node (including inactive ones for fade effect)
      let foundHoverNode = null;

      // Debug logging only when hovering (removed to prevent console spam)

      for (const node of nodes) {
        // Skip start node
        if (node.id === 'start') continue;

        // Allow hovering over ALL nodes (including inactive) for fade effect
        // We'll handle the interaction differently based on node availability

        // Process hover detection for this node
        {
          let pos = transform(node.x, node.y);

          // Apply the EXACT same position adjustments as in the render function
          // Move all non-start nodes up by 45 pixels
          if (node.id !== 'start') {
            pos.y -= 45;
          }

          // Special positioning for event nodes - move 7px left and 3px up
          if (node.storyNodeType === 'event') {
            pos.x -= 7;
            pos.y -= 3;
          }

          let nodeSize = 31.5; // normal nodes (5% larger) - MUST match render function exactly
          if (node.id === 'start') nodeSize = 75;
          else if (node.storyNodeType === 'event') nodeSize = 67;
          else if (node.storyNodeType === 'boss') nodeSize = 90;
          else if (node.storyNodeType === 'final_boss') nodeSize = 130;

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
            console.log('Found node in bounds:', node.id,
              'Position:', pos,
              'Node size:', nodeSize,
              'Mouse:', { x, y },
              'Distance from center:', node.storyNodeType === 'event' || node.storyNodeType === 'normal'
                ? Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2))
                : `x: ${Math.abs(x - pos.x)}, y: ${Math.abs(y - pos.y)}`
            );
            foundHoverNode = node;
            break;
          }
        }
      }

      if (foundHoverNode !== hoveredNode) {
        console.log('Hover changed to:', foundHoverNode?.id || 'none', 'Available nodes checked:', nodes.filter(n => completedNodes.has(n.id) || n.id === 'start').map(n => n.id));
      }
      // Always set hoveredNode for animation purposes
      setHoveredNode(foundHoverNode);
    }

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
      
      // Find the final boss node to set scroll limit
      const finalBossNode = treeData?.nodes?.find(n => n.storyNodeType === 'final_boss');
      if (finalBossNode && canvasRef.current && treeData?.nodes) {
        const canvas = canvasRef.current;
        const nodes = treeData.nodes;
        const minY = Math.min(...nodes.map(n => n.y));
        const maxY = Math.max(...nodes.map(n => n.y));
        
        // Simply allow scrolling the full height of the tree plus extra room
        // This ensures we can always see the final boss at the top
        const treeHeight = maxY - minY;
        const scale = 0.77; // Current scale factor
        const scaledTreeHeight = treeHeight * scale;
        
        // Allow scrolling up by the full scaled tree height plus some extra
        // This guarantees the final boss can reach the top of the viewport
        const maxScroll = scaledTreeHeight + 10000; // Increased scroll limit to ensure final boss is reachable
        
        const limitedY = Math.min(newY, maxScroll);
        
        // Allow scrolling closer to the actual bottom
        // This ensures consistent behavior between wheel scrolling and panning
        return {
          x: 0, // Always keep X at 0 - no horizontal panning
          y: limitedY // Allow free panning in both directions
        };
      }
      
      return {
        x: 0,
        y: newY
      };
    });
    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isMouseDown, isPanning, mouseDownPos, panStart, treeData, completedNodes, viewportOffset, panOffset, hoveredNode, previewMode, debugMode]);
  
  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    setIsPanning(false);
    // Don't clear hasDragged here - let click handler check it first
    // It will be cleared on next mousedown
  }, []);
  
  const handleMouseWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    // Do nothing - CSS handles scroll prevention, user wants click-and-drag only
  }, []);
  
  // Helper function to check if a node is available to play
  const isNodeAvailable = useCallback((node: StoryNode | null) => {
    if (!node || !treeData) return false;
    if (node.id === 'start') return false;
    if (debugMode) return true; // In debug mode, all nodes are available
    if (completedNodes.has(node.id)) return true; // Already completed nodes can be replayed
    
    // Check if this node is adjacent to a completed node and allows upward progression
    return treeData.connections.some(conn => {
      let connectedNodeId = null;
      if (conn.from === node.id) {
        connectedNodeId = conn.to;
      } else if (conn.to === node.id) {
        connectedNodeId = conn.from;
      }
      
      if (!connectedNodeId || !completedNodes.has(connectedNodeId)) {
        return false;
      }
      
      // Find the connected completed node
      const connectedNode = treeData.nodes?.find(n => n.id === connectedNodeId);
      if (!connectedNode) return false;
      
      // Only allow upward progression (lower Y values = further up the tree)
      return node.y < connectedNode.y;
    });
  }, [treeData, completedNodes, debugMode]);
  
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
    // Scale mouse coordinates to match canvas internal resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    // Apply same position adjustments as in draw function
    const nodes = (treeData.nodes || []).map(node => {
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
      let nodeSize = 31.5; // normal nodes (5% larger) - must match render exactly
      if (node.id === 'start') nodeSize = 75; // MUST match actual render size (line 571)
      else if (node.storyNodeType === 'event') nodeSize = 67; // 12% bigger
      else if (node.storyNodeType === 'boss') nodeSize = 90; // MUST match actual render size (line 581)
      else if (node.storyNodeType === 'final_boss') nodeSize = 130; // MUST match actual render size (line 586)
      
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
    const treeScaleX = (canvas.width - padding * 2) / treeWidth;
    const scale = treeScaleX * 0.77; // Match the render function scale EXACTLY (was 0.85, should be 0.77)
    const scaledTreeHeight = treeHeight * scale;
    
    const startNodeInClick = nodes.find(n => n.id === 'start'); // Find start node first
    
    const transform = (nodeX: number, nodeY: number) => {
      const scaledX = (nodeX - minX) * scale;
      const scaledY = (nodeY - minY) * scale;
      
      // Use the same offset calculation as the draw function
      let offsetX;
      if (startNodeInClick) {
        const startScaledX = (startNodeInClick.x - minX) * scale;
        const centerAdjustment = -55; // Match the render function offset - MUST MATCH EXACTLY
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
        // Must match the draw function's offsetY calculation exactly
        offsetY = 740 - startScaledY + viewportOffset;
      } else {
        offsetY = canvas.height - scaledTreeHeight + viewportOffset - padding;
      }
      
      return {
        x: scaledX + offsetX + panOffset.x,
        y: scaledY + offsetY + panOffset.y
      };
    };
    
    // Check if click is on any node
    let foundHoverNode = null;
    for (const node of nodes) {
      let pos = transform(node.x, node.y);

      // Apply the EXACT same position adjustments as in the render function
      // Move all non-start nodes up by 45 pixels
      if (node.id !== 'start') {
        pos.y -= 45;
      }

      // Special positioning for event nodes - move 7px left and 3px up
      if (node.storyNodeType === 'event') {
        pos.x -= 7;
        pos.y -= 3;
      }

      let nodeSize = 31.5; // normal nodes (5% larger) - MUST match render function exactly
      if (node.id === 'start') nodeSize = 75;
      else if (node.storyNodeType === 'event') nodeSize = 67;
      else if (node.storyNodeType === 'boss') nodeSize = 90;
      else if (node.storyNodeType === 'final_boss') nodeSize = 130;
      
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
        
        // In preview mode or debug mode, allow clicking any node
        if (previewMode || debugMode) {
          setHoveredNode(null);
          setSelectedNode(node);
          console.log(`${debugMode ? 'Debug' : 'Preview'} mode - selected node:`, node);
          foundHoverNode = node;
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
          setHoveredNode(null); // Clear hover state when selecting a node
          setSelectedNode(node);
          setInactiveNodeTooltip({ x: 0, y: 0, visible: false, fading: false }); // Hide tooltip
          foundHoverNode = node;
          // Don't auto-complete the node anymore - let user click Complete button
          // Auto-scroll removed - camera stays where user positioned it
        } else if (completedNodes.has(node.id)) {
          // Allow uncompleting nodes (for testing)
          const newCompleted = new Set(completedNodes);
          newCompleted.delete(node.id);
          setCompletedNodes(newCompleted);
          setInactiveNodeTooltip({ x: 0, y: 0, visible: false, fading: false }); // Hide tooltip
          foundHoverNode = node;
        } else if (!completedNodes.has(node.id) && !isAdjacent) {
          // Show tooltip for inactive nodes
          const rect = canvas.getBoundingClientRect();
          const tooltipWidth = 200; // Approximate width of tooltip
          const tooltipHeight = 40; // Approximate height of tooltip
          const padding = 10; // Padding from edges

          let tooltipX = event.clientX - rect.left;
          let tooltipY = event.clientY - rect.top - 40; // Default position above click

          // Adjust X position if tooltip would go off left edge
          if (tooltipX - tooltipWidth/2 < padding) {
            tooltipX = tooltipWidth/2 + padding;
          }
          // Adjust X position if tooltip would go off right edge
          else if (tooltipX + tooltipWidth/2 > rect.width - padding) {
            tooltipX = rect.width - tooltipWidth/2 - padding;
          }

          // Adjust Y position if tooltip would go off top edge
          if (tooltipY < padding) {
            // Position below the click instead
            tooltipY = event.clientY - rect.top + 40;
          }
          // Adjust Y position if tooltip would go off bottom edge
          if (tooltipY + tooltipHeight > rect.height - padding) {
            tooltipY = rect.height - tooltipHeight - padding;
          }

          setInactiveNodeTooltip({
            x: tooltipX,
            y: tooltipY,
            visible: true,
            fading: false
          });
          foundHoverNode = node;
          // Don't auto-hide - tooltip stays until mouse moves away
        }
        break;
      }
    }

    // If we've checked all nodes and didn't find any match, deselect the current node
    // This happens when clicking on empty space
    if (!foundHoverNode) {
      console.log('Clicked on empty space - deselecting node');
      setSelectedNode(null);
      setHoveredNode(null);
      setInactiveNodeTooltip({ x: 0, y: 0, visible: false, fading: false });
    }
  }, [treeData, viewportOffset, completedNodes, canvasSize, hasDragged, panOffset, zoom, previewMode, debugMode]);

  // Handle mouse wheel - do nothing, let CSS handle scroll prevention
  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    // Do nothing - CSS properties handle scroll prevention, user wants click-and-drag only
  }, []);

  // Show loading only briefly on initial mount
  if (!mounted && !previewMode) {
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
    <div className="min-h-screen relative">
      {/* VARIATION 2: Holographic Background with Cyan Grid */}
      <div className="fixed inset-0 bg-black -z-10">
        {/* Animated holographic grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(34, 211, 238, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
        {/* Radial glow from center */}
        <div className="absolute inset-0 bg-gradient-radial from-cyan-500/10 via-transparent to-transparent" />
        {/* Scan line effect */}
        <div className="absolute inset-0 animate-scan pointer-events-none" style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(34, 211, 238, 0.1) 50%, transparent 100%)',
          height: '100px'
        }} />
        {/* Purple accent gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
      </div>

      {/* CSS for flashing animations + Holographic effects */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flash-red {
          0%, 100% { border-color: rgba(239, 68, 68, 0.5); box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }
          50% { border-color: rgba(239, 68, 68, 1); box-shadow: 0 0 20px rgba(239, 68, 68, 0.8); }
        }
        @keyframes flash-yellow {
          0%, 100% { border-color: rgba(245, 158, 11, 0.5); box-shadow: 0 0 10px rgba(245, 158, 11, 0.5); }
          50% { border-color: rgba(245, 158, 11, 1); box-shadow: 0 0 20px rgba(245, 158, 11, 0.8); }
        }
        .flash-red {
          animation: flash-red 0.5s ease-in-out 3;
        }
        .flash-yellow {
          animation: flash-yellow 0.5s ease-in-out 3;
        }

        /* VARIATION 2: Holographic glow for interactive elements */
        .holographic-glow:hover {
          box-shadow: 0 0 30px rgba(34, 211, 238, 0.6), inset 0 0 20px rgba(34, 211, 238, 0.1);
          border-color: #22d3ee !important;
        }

        /* Holographic shimmer animation */
        .holographic-shimmer {
          position: relative;
          overflow: hidden;
        }
        .holographic-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(34, 211, 238, 0.3) 50%, transparent 70%);
          transform: translateX(-100%);
          animation: holographic-shimmer-anim 3s ease-in-out infinite;
        }
        @keyframes holographic-shimmer-anim {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}} />
      {/* Story Mode Title Card with Style Selector */}
      <StoryModeTitleCard
        chapter={previewMode ? `CHAPTER ${previewChapter}` : "CHAPTER 1"}
        colorScheme={colorScheme}
      />

      {/* Contract Slots Bar - Wrapped in same container as main content */}
      <div className="max-w-[1600px] mx-auto pl-5 pb-2 relative z-50">
        <ContractSlots
          slots={contractSlots}
          onSlotClick={handleContractSlotClickNew}
          fillColorStyle={contractSlotColor}
        />
      </div>

      {/* Debug: Cancel Contracts Panel - Left side */}
      <div className="fixed left-4 top-64 z-50 bg-black/80 backdrop-blur-md border border-cyan-400/40 rounded-xl p-3 shadow-2xl holographic-shimmer">
        <div className="text-cyan-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Debug: Cancel Contracts
        </div>

        {activeMissions && activeMissions.length > 0 ? (
          <div className="space-y-2">
            {activeMissions.map((mission: any) => (
              <div key={mission._id} className="flex items-center gap-2 text-xs">
                <button
                  onClick={async () => {
                    try {
                      await cancelMission({ nodeId: mission.nodeId });
                      console.log('Cancelled mission:', mission.nodeId);
                    } catch (error) {
                      console.error('Failed to cancel mission:', error);
                    }
                  }}
                  className="bg-red-600/20 backdrop-blur-sm border border-cyan-400/40 text-cyan-300 px-2 py-1 rounded-lg hover:bg-cyan-400/20 hover:border-cyan-400 transition-all duration-300 holographic-glow"
                >
                  Cancel
                </button>
                <span className="text-gray-400 truncate max-w-[150px]">
                  {mission.nodeName || mission.nodeId}
                </span>
              </div>
            ))}

            {/* Cancel All Button */}
            <button
              onClick={async () => {
                try {
                  for (const mission of activeMissions) {
                    await cancelMission({ nodeId: mission.nodeId });
                  }
                  console.log('Cancelled all missions');
                } catch (error) {
                  console.error('Failed to cancel all missions:', error);
                }
              }}
              className="w-full mt-2 bg-red-600/30 border border-red-500 text-red-300 px-2 py-1 rounded hover:bg-red-600/40 hover:border-red-300 transition-colors font-bold text-xs"
            >
              CANCEL ALL
            </button>
          </div>
        ) : (
          <div className="text-gray-500 text-xs">No active contracts</div>
        )}

        {/* Force Cleanup Button - Always visible */}
        <div className="mt-3 pt-3 border-t border-red-500/30">
          <button
            onClick={async () => {
              try {
                const result = await forceCleanupMissions();
                console.log('Force cleanup result:', result);
                alert(`Cleaned up ${result.cleanedCount} stuck missions`);
              } catch (error) {
                console.error('Failed to force cleanup:', error);
                alert('Failed to cleanup stuck missions');
              }
            }}
            className="w-full bg-orange-600/30 border border-orange-500 text-orange-300 px-2 py-1 rounded hover:bg-orange-600/40 hover:border-orange-300 transition-colors font-bold text-xs"
          >
            🔧 FORCE CLEANUP STUCK
          </button>
          <div className="text-[10px] text-gray-500 mt-1 text-center">
            Clears all stuck missions from DB
          </div>
        </div>
      </div>

      {/* Debug Panel - Collapsible */}
      <div className="fixed bottom-4 right-4 z-50">
        {debugPanelMinimized ? (
          // Minimized state - just a small button
          <button
            onClick={() => setDebugPanelMinimized(false)}
            className="bg-black/95 border-2 border-yellow-500 px-3 py-2 rounded-lg hover:bg-yellow-500/20 transition-colors flex items-center gap-2"
            title="Expand Debug Panel"
          >
            <span className="text-yellow-500 font-bold">🔧</span>
            <span className="text-yellow-500 text-xs font-bold">Debug</span>
            <span className="text-yellow-500 text-sm">▶</span>
          </button>
        ) : (
          // Expanded state - full debug panel
          <div className="bg-black/95 border-2 border-yellow-500 p-4 rounded-lg max-w-md max-h-96 overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-yellow-500 font-bold">🔧 Debug Panel</h3>
              <button
                onClick={() => setDebugPanelMinimized(true)}
                className="text-yellow-500 hover:text-yellow-400 text-lg font-bold px-2"
                title="Minimize Debug Panel"
              >
                −
              </button>
            </div>
            <div className="text-xs text-gray-300 space-y-2">
              <div className="border-b border-gray-700 pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-purple-400 font-semibold">Mode:</label>
                  <button
                    onClick={() => setDebugMode(!debugMode)}
                    className={`px-3 py-1 rounded-md text-xs font-orbitron uppercase tracking-wider transition-all duration-200 ${
                      debugMode
                        ? 'bg-purple-500/20 border border-purple-500/60 text-purple-400 hover:bg-purple-500/30'
                        : 'bg-gray-700/50 border border-gray-600 text-gray-400 hover:bg-gray-600/50'
                    }`}
                  >
                    {debugMode ? '🐛 Debug: Click Any' : '🎮 Normal Mode'}
                  </button>
                </div>
              </div>
              <div className="border-b border-gray-700 pb-2">
                <div className="text-green-400">Deployment Status:</div>
                <div>Normal Nodes: {deployedNormalNodes.length}</div>
                <div>Challenger Nodes: {deployedChallengerNodes.length}</div>
                <div>Mini-Boss Nodes: {deployedMiniBossNodes.length}</div>
                <div>Final Boss Nodes: {deployedFinalBossNodes.length}</div>
              </div>
              <div className="border-b border-gray-700 pb-2">
                <div className="text-cyan-400 font-semibold mb-1">Contract Slot Colors:</div>
                <select
                  value={contractSlotColor}
                  onChange={(e) => setContractSlotColor(e.target.value as any)}
                  className="w-full bg-black/50 border border-gray-600 text-gray-300 px-2 py-1 rounded text-xs"
                >
                  <option value="cyan">Cyan Glow</option>
                  <option value="purple">Purple Glow</option>
                  <option value="gold">Gold Glow</option>
                  <option value="emerald">Emerald Glow</option>
                  <option value="crimson">Crimson Glow</option>
                </select>
              </div>
              <div className="border-b border-gray-700 pb-2">
                <div className="text-cyan-400 font-semibold mb-1">Mission Node Glow:</div>
                <select
                  value={missionGlowStyle}
                  onChange={(e) => setMissionGlowStyle(parseInt(e.target.value) as any)}
                  className="w-full bg-black/50 border border-gray-600 text-gray-300 px-2 py-1 rounded text-xs"
                >
                  <option value="1">Soft Radial Glow</option>
                  <option value="2">Double Halo</option>
                  <option value="3">Ethereal Aura</option>
                  <option value="4">Gentle Pulse</option>
                  <option value="5">Shimmer Edge</option>
                </select>
              </div>
              {selectedNode && (
                <div className="border-b border-gray-700 pb-2">
                  <div className="text-yellow-400 font-semibold">Selected Node:</div>
                  <div>ID: {selectedNode.id}</div>
                  <div>Type: {selectedNode.storyNodeType}</div>
                  <div>Challenger: {(selectedNode as any).challenger ? 'Yes' : 'No'}</div>
                  {(() => {
                    const deployedMek = getDeployedMekForNode(selectedNode);
                    if (deployedMek) {
                      return (
                        <>
                          <div className="text-green-400 mt-1">✓ Found Deployed Mek:</div>
                          <div className="pl-2">
                            <div>Asset ID: #{deployedMek.assetId}</div>
                            <div>Rank: {deployedMek.rank}</div>
                            <div>Gold: {deployedMek.goldReward?.toLocaleString()}</div>
                            <div>XP: {deployedMek.xpReward?.toLocaleString()}</div>
                          </div>
                        </>
                      );
                    }
                    return <div className="text-red-400 mt-1">❌ No mek found for this node</div>;
                  })()}
                </div>
              )}
              {!selectedNode && (
                <div className="text-gray-500 italic">Click a node to see debug info</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Debug: Lock Difficulty Panel - Collapsible */}
      {selectedNode && (
        <div className="fixed bottom-4 right-80 z-50">
          {lockDifficultyPanelMinimized ? (
            // Minimized state
            <button
              onClick={() => setLockDifficultyPanelMinimized(false)}
              className="bg-black/95 border-2 border-red-500 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2"
              title="Expand Lock Difficulty Panel"
            >
              <span className="text-red-500 font-bold">🔒</span>
              <span className="text-red-500 text-xs font-bold">Lock Debug</span>
              <span className="text-red-500 text-sm">▶</span>
            </button>
          ) : (
            // Expanded state
            <div className="bg-black/95 border-2 border-red-500/50 p-3 rounded-lg w-56">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-red-400 font-bold">Debug: Lock Difficulty</label>
                <button
                  onClick={() => setLockDifficultyPanelMinimized(true)}
                  className="text-red-500 hover:text-red-300 transition-colors"
                  title="Minimize"
                >
                  <span className="text-sm font-bold">◀</span>
                </button>
              </div>

              <button
                onClick={() => {
                  if (selectedNode && selectedDifficulty) {
                    setCompletedDifficulties(prev => ({
                      ...prev,
                      [selectedNode.id]: new Set([...(prev[selectedNode.id] || []), selectedDifficulty])
                    }));
                  }
                }}
                className="w-full bg-red-600/20 border border-red-500/50 text-red-400 px-2 py-1 rounded text-xs hover:bg-red-600/30 hover:border-red-400 transition-colors mb-2"
              >
                Lock {selectedDifficulty?.toUpperCase()} on Current Node
              </button>

              <button
                onClick={() => {
                  if (selectedNode) {
                    setCompletedDifficulties(prev => ({
                      ...prev,
                      [selectedNode.id]: new Set(['easy', 'medium', 'hard'])
                    }));
                  }
                }}
                className="w-full bg-yellow-600/20 border border-yellow-500/50 text-yellow-400 px-2 py-1 rounded text-xs hover:bg-yellow-600/30 hover:border-yellow-400 transition-colors"
              >
                Complete ALL Difficulties (Gold Frame)
              </button>
              <p className="text-[10px] text-gray-500 mt-1">
                (Test gold frame on current node)
              </p>
            </div>
          )}
        </div>
      )}


      {/* Main Content - Wider container for better layout */}
      <div className="max-w-[1600px] mx-auto pl-5 pt-5 relative z-10">
        {/* Two Column Layout - adjusted to reduce gap */}
        <div className="flex gap-2">
          {/* Left Column - Tree Canvas - fixed width */}
          <div ref={containerRef} className="flex-shrink-0 overflow-hidden" style={{ width: '503px' }}>
            {/* Canvas Container - VARIATION 2: Holographic Glass Panel */}
            <div
              className="relative rounded-2xl holographic-shimmer"
              style={{
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`,
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                backdropFilter: 'blur(8px) saturate(150%)',
                border: '2px solid rgba(34, 211, 238, 0.3)',
                boxShadow: '0 0 40px rgba(34, 211, 238, 0.2) inset, 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 60px rgba(34, 211, 238, 0.15)',
                touchAction: 'none',
                overscrollBehavior: 'none'
              }}
              onWheel={handleWheel}
            >
              {/* Canvas */}
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className={`${isPanning ? 'cursor-grabbing' : 'cursor-pointer'}`}
                style={{ display: 'block' }}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleMouseWheel}
                style={{ imageRendering: 'crisp-edges' }}
              />

              {/* Inactive Node Tooltip - Subtle Industrial Style */}
              {inactiveNodeTooltip.visible && (
                <div
                  className="absolute z-50 bg-black/90 border border-yellow-500/60 px-3 py-1.5 pointer-events-none"
                  style={{
                    left: `${inactiveNodeTooltip.x}px`,
                    top: `${inactiveNodeTooltip.y}px`,
                    boxShadow: '0 2px 8px rgba(250, 182, 23, 0.2)',
                    animation: inactiveNodeTooltip.fading
                      ? 'tooltipFadeOut 0.2s ease-out forwards'
                      : 'tooltipSlideIn 0.15s ease-out forwards'
                  }}
                >
                  <div className="text-yellow-500/90 text-xs font-medium tracking-wide">
                    Prerequisites not completed
                  </div>
                  {/* Subtle yellow accent line at bottom */}
                  <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
                </div>
              )}

              {/* CSS for tooltip animations */}
              <style>{`
                @keyframes tooltipSlideIn {
                  0% {
                    opacity: 0;
                    transform: translateX(-50%) translateY(8px);
                  }
                  100% {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                  }
                }

                @keyframes tooltipFadeOut {
                  0% {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                  }
                  100% {
                    opacity: 0;
                    transform: translateX(-50%) translateY(0);
                  }
                }
              `}</style>

              {/* Fade gradient with blur at top */}
              <div className="absolute inset-x-0 top-0 h-60 pointer-events-none z-10">
                {/* Progressive blur layers - reduced by 25% and moved higher */}
                <div className="absolute inset-x-0 top-0 h-12 backdrop-blur-md" />
                <div className="absolute inset-x-0 top-0 h-20 backdrop-blur-sm" />
                <div className="absolute inset-x-0 top-0 h-28 backdrop-blur-[3px]" />
                <div className="absolute inset-x-0 top-0 h-36 backdrop-blur-[2px]" />
                <div className="absolute inset-x-0 top-0 h-44 backdrop-blur-[1px]" />
                {/* Gradient overlay - back to original size */}
                <div className="absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-black/85 via-black/75 to-transparent" />
              </div>
              
              
              {/* Hover Tooltip - REMOVED per user request */}
              {false && (
                <div
                  className="absolute z-40 bg-gray-900/95 border-2 border-yellow-500/50 rounded-lg p-3 pointer-events-none"
                  style={{
                    left: `${Math.min(mousePosition.x + 10, canvasSize.width - 250)}px`,
                    top: `${Math.min(mousePosition.y + 10, canvasSize.height - 150)}px`,
                    minWidth: '200px'
                  }}
                >
                  <div className="text-sm">
                    <div className="font-bold text-yellow-400 mb-2">
                      {hoveredNode.label || hoveredNode.id}
                      <span className="text-gray-400 ml-1 text-xs">
                        (Y: {hoveredNode.y.toFixed(0)})
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Money:</span>
                        <span className="text-green-400 font-bold">
                          💰 {(() => {
                            // Try to get actual values from parsed config
                            if (parsedConfig && hoveredNode.storyNodeType === 'event') {
                              // Find matching event data
                              const eventData = parsedConfig.events?.find((e: any) => {
                                // Match by various criteria
                                return e.nodeId === hoveredNode.id ||
                                       e.id === hoveredNode.id ||
                                       (e.name && hoveredNode.label?.includes(e.name));
                              });
                              if (eventData?.gold !== undefined) {
                                return eventData.gold.toLocaleString();
                              }
                            }

                            // Fallback to calculated values
                            const maxY = treeData?.nodes?.reduce((max, n) => Math.max(max, n.y), 0) || 850;
                            const minY = treeData?.nodes?.reduce((min, n) => Math.min(min, n.y), 850) || 0;
                            const progression = 1 - ((hoveredNode.y - minY) / (maxY - minY));

                            const baseMoney = hoveredNode.storyNodeType === 'final_boss' ? 1000000 :
                                             hoveredNode.storyNodeType === 'boss' ? 500000 :
                                             hoveredNode.storyNodeType === 'event' ? 300000 :
                                             hoveredNode.challenger ? 250000 : 150000;

                            const scaledMoney = Math.floor(baseMoney * (1 + progression * 2));
                            return scaledMoney.toLocaleString();
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">XP:</span>
                        <span className="text-blue-400 font-bold">
                          ⭐ {(() => {
                            // Try to get actual values from parsed config
                            if (parsedConfig && hoveredNode.storyNodeType === 'event') {
                              // Find matching event data
                              const eventData = parsedConfig.events?.find((e: any) => {
                                return e.nodeId === hoveredNode.id ||
                                       e.id === hoveredNode.id ||
                                       (e.name && hoveredNode.label?.includes(e.name));
                              });
                              if (eventData?.xp !== undefined) {
                                return eventData.xp.toLocaleString();
                              }
                            }

                            // Fallback to calculated values
                            const maxY = treeData?.nodes?.reduce((max, n) => Math.max(max, n.y), 0) || 850;
                            const minY = treeData?.nodes?.reduce((min, n) => Math.min(min, n.y), 850) || 0;
                            const progression = 1 - ((hoveredNode.y - minY) / (maxY - minY));

                            const baseXP = hoveredNode.storyNodeType === 'final_boss' ? 20000 :
                                          hoveredNode.storyNodeType === 'boss' ? 10000 :
                                          hoveredNode.storyNodeType === 'event' ? 7500 :
                                          hoveredNode.challenger ? 5000 : 3000;

                            const scaledXP = Math.floor(baseXP * (1 + progression * 1.5));
                            return scaledXP.toLocaleString();
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-purple-400 font-bold">
                          {hoveredNode.storyNodeType === 'final_boss' ? '👑 Final Boss' :
                           hoveredNode.storyNodeType === 'boss' ? '💀 Boss' :
                           hoveredNode.storyNodeType === 'event' ? '❓ Event' :
                           hoveredNode.challenger ? '⚔️ Challenger' : '🔷 Normal'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Progression:</span>
                        <span className="text-yellow-400">
                          {(() => {
                            const maxY = treeData?.nodes?.reduce((max, n) => Math.max(max, n.y), 0) || 850;
                            const minY = treeData?.nodes?.reduce((min, n) => Math.min(min, n.y), 850) || 0;
                            const progression = 1 - ((hoveredNode.y - minY) / (maxY - minY));
                            return `${(progression * 100).toFixed(1)}%`;
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Power Chip Rewards */}
                    {parsedConfig && hoveredNode.storyNodeType === 'event' && (() => {
                      const eventData = parsedConfig.events?.find((e: any) => {
                        return e.nodeId === hoveredNode.id ||
                               e.id === hoveredNode.id ||
                               (e.name && hoveredNode.label?.includes(e.name));
                      });
                      if (eventData?.chips && eventData.chips.length > 0) {
                        return (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <div className="text-xs text-gray-400 mb-1">Power Chips:</div>
                            {eventData.chips.map((chip: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="text-gray-300">{chip.type || chip.name}</span>
                                <span className="text-cyan-400">
                                  {chip.quantity || 1}x {chip.rarity || ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {hoveredNode.id && (
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <div className="text-xs text-gray-400">Node ID: {hoveredNode.id}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Mode Indicator */}
              {previewMode && (
                <div className="absolute top-4 left-4 z-30 bg-yellow-900/80 border border-yellow-500/50 rounded px-3 py-1">
                  <div className="text-yellow-400 font-bold text-xs uppercase tracking-wider">Preview Mode</div>
                  <div className="text-yellow-300 text-xs">Chapter {previewChapter} | Seed: {previewSeed}</div>
                </div>
              )}

              {/* Corner decorations */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-yellow-500/50 rounded-tl" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-yellow-500/50 rounded-tr" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-yellow-500/50 rounded-br" />
            </div>
            
            {/* Jump to Start Button */}
            {showJumpButton && !isJumping && (
              <button
                onClick={() => {
                  setIsJumping(true);
                  // Smooth animation to return to start position
                  const startOffset = viewportOffset;
                  const startPanY = panOffset.y;
                  const targetOffset = -250; // Original start position
                  const targetPanY = 0;
                  const duration = 800; // 800ms animation
                  const startTime = Date.now();
                  
                  const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    // Ease-in-out curve
                    const eased = progress < 0.5 
                      ? 2 * progress * progress 
                      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                    
                    setViewportOffset(startOffset + (targetOffset - startOffset) * eased);
                    setPanOffset({ x: 0, y: startPanY + (targetPanY - startPanY) * eased });
                    
                    if (progress < 1) {
                      requestAnimationFrame(animate);
                    } else {
                      setIsJumping(false);
                    }
                  };
                  
                  requestAnimationFrame(animate);
                }}
                className="absolute px-3 py-1.5 bg-black/90 border border-yellow-500/60 rounded text-yellow-500 text-xs font-orbitron uppercase tracking-wider hover:bg-yellow-500/20 hover:border-yellow-500 transition-all duration-200 flex items-center gap-1.5 z-50 cursor-pointer backdrop-blur-sm shadow-lg"
                style={{
                  top: '34px',
                  left: 'calc(50% - 150px)',
                  transform: 'translateX(-50%)',
                  animation: 'fadeIn 0.3s ease-out forwards',
                }}
              >
                <span style={{ position: 'relative', top: '2px' }}>Jump Down</span>
                <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="animate-bounce" style={{ position: 'relative', top: '4px' }}>
                  <path d="M6 2L6 9M6 9L3 6M6 9L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            
            {/* Easter Egg Text - shows when scrolled down below start */}
            {viewportOffset < -300 && (
              <div className="absolute -bottom-48 left-1/2 transform -translate-x-1/2 w-96 text-center text-gray-600 text-xs font-mono tracking-wide opacity-50"
                style={{
                  animation: 'fadeIn 1s ease-out forwards',
                }}>
                <p className="mb-2">// SYSTEM BREACH DETECTED //</p>
                <p className="mb-4 text-gray-700">Unauthorized access to restricted memory sector 0x7F3A9</p>
                <p className="text-gray-800 italic">
                  "The mechanisms remember what we have forgotten. 
                  Deep beneath the surface, where the roots of the tree 
                  extend into the void, lies the first protocol - 
                  the one that started it all. Some say it still whispers 
                  in binary, waiting for someone brave enough to decode 
                  its forgotten purpose."
                </p>
                <p className="mt-4 text-gray-600">// END TRANSMISSION //</p>
              </div>
            )}

            {/* Mission Statistics Card - Below Node Tree - NOW CONTAINS SUCCESS METER & DEPLOY */}
            {missionStatsLayout === 1 && (
              /* Layout 1: Success Meter, Mission Status, Deploy */
              <div className={`mt-4 border-2 rounded-lg shadow-2xl overflow-hidden relative ${
                selectedNode ? 'border-yellow-500/50' : 'border-gray-700/30'
              }`}
                   style={{
                     width: '503px',
                     background: selectedNode
                       ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.02) 100%)'
                       : 'linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.02) 50%, rgba(255, 255, 255, 0.01) 100%)'
                   }}>
                <div className="p-4">
                  {/* FULL WIDTH - Success Meter */}
                  {currentDifficultyConfig && selectedNode ? (
                    <div className="mb-4">
                      <SuccessMeterV2
                        successRate={
                          showTestPanel ? testSuccessRate :
                          completedNodes.has(selectedNode.id) ? 100 :
                          isNodeAvailable(selectedNode) ?
                            calculateSuccessChance(
                              selectedNode.id,
                              65,
                              getNodeVariationBuffs(selectedNode as ExtendedStoryNode)
                            ) : 0
                        }
                        greenLine={currentDifficultyConfig?.successGreenLine || 50}
                        baseRewards={{
                          gold: (() => {
                            let baseGold = 0;
                            if (selectedNode.storyNodeType === 'event') {
                              const eventData = getEventDataForNode(selectedNode);
                              if (eventData?.goldReward) {
                                baseGold = eventData.goldReward;
                              } else {
                                const labelMatch = selectedNode.label?.match(/E(\d+)/);
                                const eventNum = labelMatch ? parseInt(labelMatch[1]) : 1;
                                baseGold = 100 + (eventNum - 1) * 50;
                              }
                            } else {
                              const deployedMek = getDeployedMekForNode(selectedNode);
                              if (deployedMek && deployedMek.goldReward !== undefined && deployedMek.goldReward !== null) {
                                baseGold = Number(deployedMek.goldReward);
                              } else {
                                baseGold = selectedNode.storyNodeType === 'final_boss' ? 1000000 :
                                          selectedNode.storyNodeType === 'boss' ? 500000 :
                                          selectedNode.storyNodeType === 'normal' ? 150000 : 250000;
                              }
                            }
                            return Math.round(baseGold * currentDifficultyConfig.goldMultiplier);
                          })(),
                          xp: (() => {
                            let baseXP = 0;
                            if (selectedNode.storyNodeType === 'event') {
                              const eventData = getEventDataForNode(selectedNode);
                              if (eventData?.xpReward) {
                                baseXP = eventData.xpReward;
                              } else {
                                const labelMatch = selectedNode.label?.match(/E(\d+)/);
                                const eventNum = labelMatch ? parseInt(labelMatch[1]) : 1;
                                baseXP = 10 + (eventNum - 1) * 10;
                              }
                            } else {
                              const deployedMek = getDeployedMekForNode(selectedNode);
                              if (deployedMek?.xpReward) {
                                baseXP = deployedMek.xpReward;
                              } else if (deployedMek?.rank) {
                                const rankFactor = (4000 - deployedMek.rank) / 4000;
                                if (selectedNode.storyNodeType === 'normal') {
                                  baseXP = Math.round(50 + rankFactor * 450);
                                } else if (selectedNode.storyNodeType === 'boss') {
                                  baseXP = Math.round(500 + rankFactor * 1500);
                                } else if (selectedNode.storyNodeType === 'final_boss') {
                                  baseXP = Math.round(2000 + rankFactor * 3000);
                                } else {
                                  baseXP = 5000;
                                }
                              } else {
                                baseXP = selectedNode.storyNodeType === 'final_boss' ? 20000 :
                                        selectedNode.storyNodeType === 'boss' ? 10000 :
                                        selectedNode.storyNodeType === 'normal' ? 3000 : 5000;
                              }
                            }
                            return Math.round(baseXP * currentDifficultyConfig.xpMultiplier);
                          })()
                        }}
                        difficultyConfig={{
                          goldMultiplier: currentDifficultyConfig?.goldMultiplier || 1,
                          xpMultiplier: currentDifficultyConfig?.xpMultiplier || 1,
                          essenceAmountMultiplier: currentDifficultyConfig?.essenceAmountMultiplier || 1,
                          overshootBonusRate: currentDifficultyConfig?.overshootBonusRate || 1,
                          maxOvershootBonus: currentDifficultyConfig?.maxOvershootBonus || 50
                        }}
                        showTitle={true}
                        barHeight={56}
                        className=""
                      />
                    </div>
                  ) : selectedNode ? (
                    // Fallback when no difficulty config but node is selected
                    <div className="mb-4">
                      <SuccessMeterV2
                        successRate={
                          showTestPanel ? testSuccessRate :
                          completedNodes.has(selectedNode.id) ? 100 :
                          isNodeAvailable(selectedNode) ?
                            calculateSuccessChance(
                              selectedNode.id,
                              65,
                              getNodeVariationBuffs(selectedNode as ExtendedStoryNode)
                            ) : 0
                        }
                        greenLine={50}
                        baseRewards={{
                          gold: 250000,
                          xp: 5000
                        }}
                        difficultyConfig={{
                          goldMultiplier: 1,
                          xpMultiplier: 1,
                          essenceAmountMultiplier: 1,
                          overshootBonusRate: 1,
                          maxOvershootBonus: 50
                        }}
                        showTitle={true}
                        barHeight={56}
                        className=""
                      />
                    </div>
                  ) : (
                    // Show empty/placeholder meter when no node is selected
                    <div className="mb-4 opacity-30">
                      {/* Custom placeholder SUCCESS METER display */}
                      <div className="relative">
                        {/* Title */}
                        <div className="relative mb-6" style={{ transform: 'scale(1)', transformOrigin: 'center top' }}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-96 h-1 bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
                          </div>
                          <div className="relative text-center">
                            <h2 className="text-3xl font-black uppercase tracking-[0.3em] whitespace-nowrap text-gray-600"
                                style={{
                                  fontFamily: 'Orbitron, monospace',
                                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))'
                                }}>
                              SUCCESS METER
                            </h2>
                          </div>
                        </div>

                        {/* Bar container */}
                        <div className="relative bg-black/90 border-2 border-gray-700/50 shadow-2xl overflow-hidden">
                          <div className="relative z-10">
                            {/* Progress bar area */}
                            <div className="relative" style={{ height: '56px' }}>
                              <div className="absolute inset-0 bg-gray-900/40"></div>
                              {/* Empty bar with no progress */}
                              <div className="absolute top-0 left-0 h-full bg-gray-800/30" style={{ width: '0%' }}></div>
                            </div>

                            {/* Status section with dashes */}
                            <div className="bg-gradient-to-b from-gray-700/10 to-transparent px-4 py-3 flex items-center justify-between">
                              <div className="text-left">
                                <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">MISSION STATUS</div>
                                <div className="font-bold font-['Orbitron'] uppercase text-xl text-gray-600">
                                  ----------
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600">OVERSHOOT</div>
                                <div className="text-2xl font-bold text-gray-600" style={{ fontFamily: 'Roboto Mono, monospace' }}>
                                  ---%
                                </div>
                              </div>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>

                            {/* Rewards section with dashes */}
                            <div className="px-4 py-3 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs uppercase font-bold text-gray-600">Gold:</span>
                                <span className="text-sm font-bold tabular-nums text-gray-600">---</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs uppercase font-bold text-gray-600">XP:</span>
                                <span className="text-sm font-bold tabular-nums text-gray-600">---</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ASYMMETRIC FOCUS DESIGN - Hero Deploy with Supporting Resources */}
                  {selectedNode ? (
                    <div className="flex gap-3 items-stretch">
                      {/* LEFT - Resource Grid */}
                      <div className="flex-1">
                        <div className="bg-gray-900/50 border border-yellow-500/20 rounded-sm h-full p-3">
                        <div className="text-xs text-gray-400 uppercase tracking-[0.2em] mb-2 text-center font-bold">
                          CONTRACT FEES
                        </div>

                        <div className="space-y-1.5">
                          {/* Row 1: Gold */}
                          <div className={`bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-yellow-500/5 border ${flashingFees ? 'flash-red border-red-500' : 'border-yellow-500/30'} rounded-sm overflow-hidden`}>
                            <div className="flex h-7">
                              <div className="bg-black/30 px-2 flex items-center justify-start w-16">
                                <span className="text-sm text-yellow-400 uppercase font-black">GOLD</span>
                              </div>
                              <div className="border-l-2 border-gray-700 flex-1 px-2 flex items-center justify-end">
                                <span className="text-yellow-400 font-black text-base">
                                  {formatGoldAmount(
                                    (() => {
                                      const baseFee = selectedNode.storyNodeType === 'final_boss' ? 200000 :
                                                     selectedNode.storyNodeType === 'boss' ? 100000 :
                                                     selectedNode.storyNodeType === 'event' ? 75000 :
                                                     selectedNode.storyNodeType === 'normal' ? 30000 : 50000;
                                      return currentDifficultyConfig ?
                                        Math.round(baseFee * currentDifficultyConfig.deploymentFeeMultiplier) : baseFee;
                                    })()
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Row 2: Essence */}
                          <div className={`bg-gray-800/40 border ${flashingFees ? 'flash-red border-red-500' : 'border-purple-500/30'} rounded-sm overflow-hidden`}>
                            <div className="flex h-7">
                              <div className="bg-black/30 px-2 flex items-center justify-start w-16">
                                <span className="text-[10px] text-gray-400 uppercase font-bold">ESSENCE</span>
                              </div>
                              <div className="border-l-2 border-gray-700 flex-1 px-2 flex items-center justify-start">
                                <span className="text-purple-400 font-bold text-[11px]">Ace of Spades Ultimate</span>
                              </div>
                              <div className="border-l-2 border-gray-700 px-2 flex items-center justify-center w-16">
                                <span className="text-purple-300 font-bold text-xs">1.5</span>
                              </div>
                            </div>
                          </div>

                          {/* Row 3: Chip */}
                          <div className={`bg-gray-800/40 border ${flashingFees ? 'flash-red border-red-500' : 'border-cyan-500/30'} rounded-sm overflow-hidden`}>
                            <div className="flex h-7">
                              <div className="bg-black/30 px-2 flex items-center justify-start w-16">
                                <span className="text-[10px] text-gray-400 uppercase font-bold">CHIP</span>
                              </div>
                              <div className="border-l-2 border-gray-700 flex-1 px-2 flex items-center justify-start">
                                <span className="text-cyan-400 font-bold text-[11px]">Bowling</span>
                              </div>
                              <div className="border-l-2 border-gray-700 px-2 flex items-center justify-center w-16">
                                <span className="text-cyan-300 font-bold text-xs">A-Mod</span>
                              </div>
                            </div>
                          </div>

                          {/* Row 4: Special */}
                          <div className={`bg-gray-800/40 border ${flashingFees ? 'flash-red border-red-500' : 'border-green-500/30'} rounded-sm overflow-hidden`}>
                            <div className="flex h-7">
                              <div className="bg-black/30 px-2 flex items-center justify-start w-16">
                                <span className="text-[10px] text-gray-400 uppercase font-bold">SPECIAL</span>
                              </div>
                              <div className="border-l-2 border-gray-700 flex-1 px-2 flex items-center justify-start">
                                <span className="text-green-400 font-bold text-[11px]">DMT Canister</span>
                              </div>
                              <div className="border-l-2 border-gray-700 px-2 flex items-center justify-center w-16">
                                <span className="text-green-300 font-bold text-xs">1</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT - Duration and Deploy/Cancel Button */}
                    <div className="w-32 h-full flex flex-col gap-1">
                      {/* Check if there's an active mission for this node */}
                      {(() => {
                        const activeMission = activeMissions?.find(m => m.nodeId === selectedNode.id);
                        const isActive = !!activeMission;

                        return (
                          <>
                            {/* Mission Duration or Countdown Timer - extended height */}
                            <div className="relative overflow-hidden rounded-sm" style={{ height: 'calc(55% + 12px)' }}>
                              {isActive ? (
                                // Show countdown timer when mission is active
                                <>
                                  {/* Animated background gradient - cyan theme for active */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-black via-cyan-950/30 to-black" />

                                  {/* Scan line effect - cyan */}
                                  <div className="absolute inset-0 opacity-20"
                                    style={{
                                      backgroundImage: 'linear-gradient(0deg, transparent 50%, rgba(6, 182, 212, 0.3) 50%)',
                                      backgroundSize: '100% 4px',
                                      animation: 'scan 4s linear infinite'
                                    }}
                                  />

                                  {/* Border glow - cyan */}
                                  <div className="absolute inset-0 border border-cyan-500/30"
                                    style={{ boxShadow: 'inset 0 0 20px rgba(6, 182, 212, 0.2)' }}
                                  />

                                  {/* Countdown Content */}
                                  <div className="relative h-full flex items-center justify-center px-2 py-2">
                                    <MissionCountdown
                                      endTime={activeMission.startTime + activeMission.duration}
                                      onComplete={async () => {
                                        // Complete the mission when timer expires
                                        await completeMission({ nodeId: selectedNode.id });
                                        // Mark node as completed
                                        if (!completedNodes.has(selectedNode.id)) {
                                          const newCompleted = new Set(completedNodes);
                                          newCompleted.add(selectedNode.id);
                                          setCompletedNodes(newCompleted);
                                        }
                                      }}
                                    />
                                  </div>
                                </>
                              ) : (
                                // Show duration when mission is not active
                                <>
                                  {/* Animated background gradient */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />

                                  {/* Scan line effect */}
                                  <div className="absolute inset-0 opacity-20"
                                    style={{
                                      backgroundImage: 'linear-gradient(0deg, transparent 50%, rgba(250, 182, 23, 0.3) 50%)',
                                      backgroundSize: '100% 4px',
                                      animation: 'scan 8s linear infinite'
                                    }}
                                  />

                                  {/* Hexagonal pattern overlay */}
                                  <div className="absolute inset-0 opacity-10"
                                    style={{
                                      backgroundImage: `
                                        linear-gradient(30deg, transparent 29%, rgba(250, 182, 23, 0.5) 30%, transparent 31%),
                                        linear-gradient(150deg, transparent 29%, rgba(250, 182, 23, 0.5) 30%, transparent 31%),
                                        linear-gradient(270deg, transparent 29%, rgba(250, 182, 23, 0.5) 30%, transparent 31%)
                                      `,
                                      backgroundSize: '20px 35px'
                                    }}
                                  />

                                  {/* Border glow */}
                                  <div className="absolute inset-0 border border-yellow-500/30"
                                    style={{ boxShadow: 'inset 0 0 20px rgba(250, 182, 23, 0.1)' }}
                                  />

                                  {/* Content */}
                                  <div className="relative h-full flex flex-col items-center justify-center px-2 py-2">
                                    <div className="text-xs text-gray-400 uppercase tracking-[0.2em] text-center font-bold">Duration</div>
                                    <div className="text-center mt-1">
                                      <span className="text-yellow-400 font-black text-2xl"
                                        style={{
                                          fontFamily: 'Roboto Mono, monospace',
                                          textShadow: '0 0 20px rgba(250, 182, 23, 0.6), 0 0 40px rgba(250, 182, 23, 0.3)'
                                        }}>
                                        {(() => {
                                          // Calculate duration based on node position
                                          const isChallenger = (selectedNode as any).challenger === true;
                                          let minutes = 15; // default

                                          if (selectedNode.storyNodeType === 'final_boss') {
                                            minutes = calculateNodeDuration(selectedNode, 'finalboss');
                                          } else if (selectedNode.storyNodeType === 'boss') {
                                            minutes = calculateNodeDuration(selectedNode, 'miniboss');
                                          } else if (selectedNode.storyNodeType === 'event') {
                                            minutes = calculateNodeDuration(selectedNode, 'event');
                                          } else if (isChallenger) {
                                            minutes = calculateNodeDuration(selectedNode, 'challenger');
                                          } else {
                                            minutes = calculateNodeDuration(selectedNode, 'normal');
                                          }

                                          // Format duration display
                                          if (minutes < 60) {
                                            return `${minutes}m`;
                                          } else if (minutes < 1440) { // Less than 24 hours
                                            const hours = Math.floor(minutes / 60);
                                            const mins = minutes % 60;
                                            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                                          } else { // Days
                                            const days = Math.floor(minutes / 1440);
                                            const hours = Math.floor((minutes % 1440) / 60);
                                            return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
                                          }
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Deploy or Cancel Button - fills remaining space to align with bottom */}
                            <div
                              className="flex-1 mt-[17px]"
                              onMouseEnter={() => {
                                if (!isActive && (!selectedMeks[selectedNode.id] || selectedMeks[selectedNode.id].length === 0)) {
                                  setIsHoveringDeployButton(true);
                                  setShowDeployTooltip(true);
                                  setFlashingMekSlots(true);
                                }
                              }}
                              onMouseLeave={() => {
                                setIsHoveringDeployButton(false);
                                setShowDeployTooltip(false);
                                setFlashingMekSlots(false);
                              }}
                              onMouseMove={(e) => {
                                if (!isActive && (!selectedMeks[selectedNode.id] || selectedMeks[selectedNode.id].length === 0)) {
                                  setMousePos({ x: e.clientX, y: e.clientY });
                                }
                              }}
                            >
                              <div className="w-full h-full relative">
                                <HolographicButton
                                  text={deployingNodes.has(selectedNode.id) ? "DEPLOYING..." : isActive ? "CANCEL" : "DEPLOY"}
                                  onClick={() => {
                                    if (deployingNodes.has(selectedNode.id)) {
                                      return; // Prevent clicks while deploying
                                    }
                                    if (isActive) {
                                      // Show cancel confirmation lightbox
                                      setPendingCancelNodeId(selectedNode.id);
                                      setShowCancelLightbox(true);
                                    } else {
                                      handleNodeDeploy(selectedNode as ExtendedStoryNode, false);
                                      setCompletedDifficulties(prev => ({
                                        ...prev,
                                        [selectedNode.id]: new Set([...(prev[selectedNode.id] || []), selectedDifficulty])
                                      }));
                                    }
                                  }}
                                  isActive={isActive || (selectedMeks[selectedNode.id] && selectedMeks[selectedNode.id].length > 0)}
                                  variant={deployingNodes.has(selectedNode.id) || isActive || (selectedMeks[selectedNode.id] && selectedMeks[selectedNode.id].filter(Boolean).length > 0) ? "yellow" : "gray"}
                                  alwaysOn={true}  // Always show particles
                                  disabled={deployingNodes.has(selectedNode.id) || (!isActive && (!selectedMeks[selectedNode.id] || selectedMeks[selectedNode.id].length === 0))}
                                  className="w-full h-full [&>div]:h-full [&>div>div]:h-full [&>div>div]:!py-3 [&>div>div]:!px-3 [&>div]:cursor-pointer [&_span]:!text-lg [&_span]:!tracking-[0.25em]"
                                />
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  // Show placeholder when no node is selected
                  <div className="opacity-30">
                    <div className="flex gap-3 items-stretch">
                      {/* LEFT - Resource Grid */}
                      <div className="flex-1">
                        <div className="bg-black/80 border border-gray-700/20 rounded-sm h-full p-3">
                          <div className="text-xs text-gray-600 uppercase tracking-[0.2em] mb-2 text-center font-bold">
                            CONTRACT FEES
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2 bg-black/20 border border-gray-700/30 rounded-sm p-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">GOLD</span>
                                <span className="text-gray-600 font-black text-lg">---</span>
                              </div>
                            </div>
                            <div className="bg-black/20 border border-gray-700/30 rounded-sm p-1.5">
                              <div className="text-[9px] text-gray-600 uppercase">ACE ESSENCE</div>
                              <div className="text-gray-600 font-bold text-sm">--</div>
                            </div>
                            <div className="bg-black/20 border border-gray-700/30 rounded-sm p-1.5">
                              <div className="text-[9px] text-gray-600 uppercase">BOWLING CHIP</div>
                              <div className="text-gray-600 font-bold text-sm">--</div>
                            </div>
                            <div className="col-span-2 bg-black/20 border border-gray-700/30 rounded-sm p-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-gray-600 uppercase">SPECIAL</span>
                                <span className="text-gray-600 font-bold text-sm">---</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* RIGHT - Deploy Button (disabled) */}
                      <div className="flex-shrink-0">
                        <div className="w-32 h-[140px]">
                          <button disabled className="w-full h-full relative overflow-hidden bg-gray-900/40 border-2 border-gray-800 cursor-not-allowed opacity-50 rounded-sm">
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                              <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
                                <path d="M5 12L5 19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V12"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      fill="none"
                                      fillOpacity="0"
                                      className="text-gray-700" />
                                <path d="M12 7V17M7 10L12 7L17 10"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      className="text-gray-700" />
                              </svg>
                              <div>
                                <div className="font-black text-base tracking-[0.3em] uppercase text-gray-700">
                                  DEPLOY
                                </div>
                                <div className="text-[9px] tracking-[0.2em] uppercase mt-0.5 text-gray-800">
                                  SELECT NODE
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                  {/* Tooltip for inactive deploy button */}
                  {showDeployTooltip && typeof window !== 'undefined' && createPortal(
                    <div
                      className="fixed pointer-events-none"
                      style={{
                        left: `${Math.min(Math.max(mousePos.x, 150), window.innerWidth - 150)}px`,
                        top: `${mousePos.y - 60}px`,
                        transform: 'translateX(-50%)',
                        zIndex: 99999,
                      }}
                    >
                      <div className="bg-black/95 border border-yellow-400/50 px-3 py-2 rounded shadow-xl">
                        <div className="text-sm text-yellow-400 whitespace-nowrap">
                          Please enlist at least one mechanism
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              </div>
            )}

            {false && missionStatsLayout === 2 && (
              /* Layout 2: Compact Rows */
              <div className="mt-4 bg-black/90 border-2 border-yellow-500/50 rounded-lg shadow-2xl"
                   style={{ width: '503px' }}>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-yellow-500 font-black uppercase tracking-[0.2em] text-xs"
                        style={{ fontFamily: 'Orbitron, monospace' }}>
                      MISSION STATISTICS
                    </h3>
                    <div className="text-gray-500 text-xs">
                      Total: <span className="text-yellow-500 font-bold">
                        {missionStats.easyCompleted + missionStats.mediumCompleted + missionStats.hardCompleted}
                      </span> Contracts
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-black/50 px-3 py-2 rounded border border-yellow-500/20">
                      <span className="text-gray-400 text-xs uppercase">Gold</span>
                      <span className="text-yellow-400 font-bold">{missionStats.totalGold.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between bg-black/50 px-3 py-2 rounded border border-blue-500/20">
                      <span className="text-gray-400 text-xs uppercase">Experience</span>
                      <span className="text-blue-400 font-bold">{missionStats.totalExperience.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-4 bg-black/50 px-3 py-2 rounded border border-gray-500/20">
                      <div className="flex-1 text-center">
                        <span className="text-green-400 font-bold text-lg">{missionStats.easyCompleted}</span>
                        <div className="text-gray-500 text-xs">Easy</div>
                      </div>
                      <div className="flex-1 text-center border-x border-gray-700">
                        <span className="text-yellow-400 font-bold text-lg">{missionStats.mediumCompleted}</span>
                        <div className="text-gray-500 text-xs">Medium</div>
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-red-400 font-bold text-lg">{missionStats.hardCompleted}</span>
                        <div className="text-gray-500 text-xs">Hard</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {false && missionStatsLayout === 3 && (
              /* Layout 3: Vertical Stack */
              <div className="mt-4 bg-gradient-to-b from-black to-gray-950 border-2 border-yellow-500/50 rounded-lg shadow-2xl"
                   style={{ width: '503px' }}>
                <div className="text-center py-3 border-b border-yellow-500/30">
                  <h3 className="text-yellow-500 font-black uppercase tracking-[0.3em] text-sm"
                      style={{ fontFamily: 'Orbitron, monospace' }}>
                    MISSION STATISTICS
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="text-center py-3 bg-yellow-900/10 rounded-lg border border-yellow-500/30">
                    <div className="text-gray-400 text-xs uppercase mb-1">Total Gold</div>
                    <div className="text-yellow-400 text-3xl font-black">{missionStats.totalGold.toLocaleString()}</div>
                  </div>
                  <div className="text-center py-3 bg-blue-900/10 rounded-lg border border-blue-500/30">
                    <div className="text-gray-400 text-xs uppercase mb-1">Experience</div>
                    <div className="text-blue-400 text-3xl font-black">{missionStats.totalExperience.toLocaleString()}</div>
                  </div>
                  <div className="flex justify-around py-3 bg-black/50 rounded-lg border border-gray-500/30">
                    <div className="text-center">
                      <div className="text-green-400 text-2xl font-black">{missionStats.easyCompleted}</div>
                      <div className="text-gray-500 text-xs uppercase">Easy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-400 text-2xl font-black">{missionStats.mediumCompleted}</div>
                      <div className="text-gray-500 text-xs uppercase">Medium</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-400 text-2xl font-black">{missionStats.hardCompleted}</div>
                      <div className="text-gray-500 text-xs uppercase">Hard</div>
                    </div>
                  </div>
                  <div className="text-center text-gray-400 text-xs pt-2">
                    TOTAL COMPLETED: <span className="text-yellow-500 font-bold">
                      {missionStats.easyCompleted + missionStats.mediumCompleted + missionStats.hardCompleted}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {false && missionStatsLayout === 4 && (
              /* Layout 4: Minimalist Bar */
              <div className="mt-4 bg-black/80 border border-yellow-500/30 rounded shadow-xl"
                   style={{ width: '503px' }}>
                <div className="px-4 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <h3 className="text-yellow-500 font-bold text-xs uppercase tracking-wider">Mission Stats</h3>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-yellow-400">💰 {missionStats.totalGold.toLocaleString()}</span>
                        <span className="text-blue-400">⚡ {missionStats.totalExperience.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-400">E: {missionStats.easyCompleted}</span>
                      <span className="text-yellow-400">M: {missionStats.mediumCompleted}</span>
                      <span className="text-red-400">H: {missionStats.hardCompleted}</span>
                      <span className="text-gray-400 ml-2">
                        [{missionStats.easyCompleted + missionStats.mediumCompleted + missionStats.hardCompleted} Total]
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {false && missionStatsLayout === 5 && (
              /* Layout 5: Side-by-Side Cards */
              <div className="mt-4 flex gap-3" style={{ width: '503px' }}>
                <div className="flex-1 bg-black/90 border-2 border-yellow-500/50 rounded-lg p-3">
                  <h4 className="text-yellow-500 font-bold text-xs uppercase mb-3">Resources</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="text-gray-500 text-xs">Gold</div>
                      <div className="text-yellow-400 text-xl font-bold">{missionStats.totalGold.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Experience</div>
                      <div className="text-blue-400 text-xl font-bold">{missionStats.totalExperience.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-black/90 border-2 border-purple-500/50 rounded-lg p-3">
                  <h4 className="text-purple-500 font-bold text-xs uppercase mb-3">Contracts</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-green-400 text-xs">Easy</span>
                      <span className="text-green-400 font-bold">{missionStats.easyCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-400 text-xs">Medium</span>
                      <span className="text-yellow-400 font-bold">{missionStats.mediumCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-400 text-xs">Hard</span>
                      <span className="text-red-400 font-bold">{missionStats.hardCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-purple-500/20">
                      <span className="text-gray-400 text-xs">Total</span>
                      <span className="text-purple-400 font-bold">
                        {missionStats.easyCompleted + missionStats.mediumCompleted + missionStats.hardCompleted}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column - Mission Card Details */}
          <div className="flex-grow pr-5">
            {/* Show card for selected node */}
            {selectedNode ? (
              <StoryMissionCard
                isEventNode={selectedNode.storyNodeType === 'event'}
                successPercentage={showTestPanel ? testSuccessRate :
                              completedNodes.has(selectedNode.id) ? 100 :
                              isNodeAvailable(selectedNode) ?
                                calculateSuccessChance(
                                  selectedNode.id,
                                  65,
                                  getNodeVariationBuffs(selectedNode as ExtendedStoryNode)
                                ) : 0}
                title={(() => {
                  if (selectedNode.storyNodeType === 'event') {
                    const eventData = getEventDataForNode(selectedNode);
                    // Use deployed name if available, otherwise show a better default
                    if (eventData?.name && eventData.name !== 'EVENT NODE') {
                      return eventData.name;
                    }
                    // Extract event number from label or ID for a better fallback
                    const eventNum = selectedNode.label?.match(/\d+/)?.[0] ||
                                    selectedNode.id?.match(/\d+/)?.[0];
                    return eventNum ? `Event ${eventNum}` : `Event ${selectedNode.label || selectedNode.id}`;
                  }
                  // For non-event nodes, use the MEK name as title
                  const deployedMek = getDeployedMekForNode(selectedNode);
                  if (deployedMek?.assetId) {
                    return `MEK #${deployedMek.assetId}`;
                  }
                  return `Mission`;
                })()}
                mekImage={(() => {
                  if (selectedNode.storyNodeType === 'event') {
                    const eventData = getEventDataForNode(selectedNode);
                    // For events, we now pass images through eventImages prop instead
                    // Return a fallback for backward compatibility
                    const eventImageName = getEventImage(selectedNode.id);
                    return `/event-images/450px webp/${eventImageName.replace(/ /g, '%20')}`;
                  }
                  return getMekImage(selectedNode.id, true);
                })()}
                eventImages={(() => {
                  if (selectedNode.storyNodeType === 'event') {
                    const eventData = getEventDataForNode(selectedNode);
                    // Return the 3-image object if available
                    if (eventData?.images) {
                      return eventData.images;
                    }
                  }
                  return undefined;
                })()}
                mekName={(() => {
                  if (selectedNode.storyNodeType === 'event') {
                    const eventData = getEventDataForNode(selectedNode);
                    return eventData?.name || `Event ${selectedNode.label || selectedNode.id}`;
                  }
                  // Get deployed mek for non-event nodes
                  const deployedMek = getDeployedMekForNode(selectedNode);
                  if (deployedMek?.assetId) {
                    return `MEK #${deployedMek.assetId}`;
                  }
                  // Fallback - just show MISSION without the confusing node ID
                  return `MISSION`;
                })()}
                mekRank={(() => {
                  if (selectedNode.storyNodeType === 'event') return undefined;
                  // Use actual deployed mek rank
                  const deployedMek = getDeployedMekForNode(selectedNode);
                  if (deployedMek?.rank) {
                    return deployedMek.rank;
                  }
                  // Fallback ranks
                  return selectedNode.storyNodeType === 'final_boss' ? 100 :
                         selectedNode.storyNodeType === 'boss' ? 75 : 34;
                })()}
                primaryReward={(() => {
                  let baseGold = 0;
                  if (selectedNode.storyNodeType === 'event') {
                    const eventData = getEventDataForNode(selectedNode);
                    if (eventData?.goldReward) {
                      baseGold = eventData.goldReward;
                    } else {
                      const labelMatch = selectedNode.label?.match(/E(\d+)/);
                      const eventNum = labelMatch ? parseInt(labelMatch[1]) : 1;
                      baseGold = 100 + (eventNum - 1) * 50;
                    }
                  } else {
                    const deployedMek = getDeployedMekForNode(selectedNode);
                    console.log('Deployed mek data for gold reward:', {
                      hasDeployedMek: !!deployedMek,
                      goldReward: deployedMek?.goldReward,
                      typeOfGoldReward: typeof deployedMek?.goldReward,
                      fullMek: deployedMek
                    });
                    if (deployedMek && deployedMek.goldReward !== undefined && deployedMek.goldReward !== null) {
                      baseGold = Number(deployedMek.goldReward);
                      console.log('Using deployed gold reward:', baseGold);
                    } else {
                      baseGold = selectedNode.storyNodeType === 'final_boss' ? 1000000 :
                                selectedNode.storyNodeType === 'boss' ? 500000 :
                                selectedNode.storyNodeType === 'normal' ? 150000 : 250000;
                      console.log('Using fallback gold reward:', baseGold);
                    }
                  }
                  // Apply difficulty multiplier
                  return currentDifficultyConfig ?
                    Math.round(baseGold * currentDifficultyConfig.goldMultiplier) : baseGold;
                })()}
                experience={(() => {
                  let baseXP = 0;
                  if (selectedNode.storyNodeType === 'event') {
                    const eventData = getEventDataForNode(selectedNode);
                    if (eventData?.xpReward) {
                      baseXP = eventData.xpReward;
                    } else {
                      const labelMatch = selectedNode.label?.match(/E(\d+)/);
                      const eventNum = labelMatch ? parseInt(labelMatch[1]) : 1;
                      baseXP = 10 + (eventNum - 1) * 10;
                    }
                  } else {
                    const deployedMek = getDeployedMekForNode(selectedNode);
                    if (deployedMek?.xpReward) {
                      baseXP = deployedMek.xpReward;
                    } else if (deployedMek?.rank) {
                      // Calculate XP based on rank if xpReward is missing
                      // Using similar logic to deployedNodeData.ts
                      const rankFactor = (4000 - deployedMek.rank) / 4000; // 0 to 1, higher is better
                      if (selectedNode.storyNodeType === 'normal') {
                        baseXP = Math.round(50 + rankFactor * 450); // 50-500 XP range for normal
                      } else if (selectedNode.storyNodeType === 'boss') {
                        baseXP = Math.round(500 + rankFactor * 1500); // 500-2000 XP for boss
                      } else if (selectedNode.storyNodeType === 'final_boss') {
                        baseXP = Math.round(2000 + rankFactor * 3000); // 2000-5000 XP for final boss
                      } else {
                        baseXP = 5000; // Default challenger
                      }
                      console.log('Calculated XP from rank:', { rank: deployedMek.rank, baseXP });
                    } else {
                      baseXP = selectedNode.storyNodeType === 'final_boss' ? 20000 :
                              selectedNode.storyNodeType === 'boss' ? 10000 :
                              selectedNode.storyNodeType === 'normal' ? 3000 : 5000;
                    }
                  }
                  // Apply difficulty multiplier
                  return currentDifficultyConfig ?
                    Math.round(baseXP * currentDifficultyConfig.xpMultiplier) : baseXP;
                })()}
                potentialRewards={getNodeRewards(selectedNode as ExtendedStoryNode)}
                variationBuffs={getNodeVariationBuffs(selectedNode as ExtendedStoryNode)}
                successChance={showTestPanel ? testSuccessRate :
                              completedNodes.has(selectedNode.id) ? 100 :
                              isNodeAvailable(selectedNode) ?
                                calculateSuccessChance(
                                  selectedNode.id,
                                  65,
                                  getNodeVariationBuffs(selectedNode as ExtendedStoryNode)
                                ) : 0}
                deploymentFee={(() => {
                  const baseFee = selectedNode.storyNodeType === 'final_boss' ? 200000 :
                                 selectedNode.storyNodeType === 'boss' ? 100000 :
                                 selectedNode.storyNodeType === 'event' ? 75000 :
                                 selectedNode.storyNodeType === 'normal' ? 30000 : 50000;
                  return currentDifficultyConfig ?
                    Math.round(baseFee * currentDifficultyConfig.deploymentFeeMultiplier) : baseFee;
                })()}
                availableSlots={currentDifficultyConfig ? calculateMekSlots(currentDifficultyConfig, selectedNode.id) : getNodeAvailableSlots(selectedNode as ExtendedStoryNode)}
                selectedMeks={selectedMeks[selectedNode.id] || []}
                onDeploy={() => {
                  handleNodeDeploy(selectedNode as ExtendedStoryNode, false);
                  // Mark the current difficulty as completed
                  setCompletedDifficulties(prev => ({
                    ...prev,
                    [selectedNode.id]: new Set([...(prev[selectedNode.id] || []), selectedDifficulty])
                  }));
                }}
                onMekSlotClick={handleMekSlotClick}
                onMekRemove={handleMekRemove}
                scale={0.95}
                isLocked={debugMode ? false : (!isNodeAvailable(selectedNode) && !completedNodes.has(selectedNode.id))}
                currentDifficulty={selectedDifficulty}
                onDifficultyChange={setSelectedDifficulty}
                showDifficultySelector={true}
                difficultyConfig={currentDifficultyConfig}
                lockedStyle={1}
                completedDifficulties={completedDifficulties[selectedNode.id] || new Set()}
                onDifficultyComplete={(difficulty: DifficultyLevel) => {
                  setCompletedDifficulties(prev => ({
                    ...prev,
                    [selectedNode.id]: new Set([...(prev[selectedNode.id] || []), difficulty])
                  }));
                }}
                mekContributions={selectedMeks[selectedNode.id]?.map((mek: any, idx: number) => ({
                  mekId: mek.id || `mek-${idx}`,
                  name: mek.name || `MEK ${idx + 1}`,
                  rank: mek.rank || 1000,
                  contribution: 10 // Base contribution per Mek
                }))}
                variationBuffLayoutStyle={2} // Locked to Classic Grid
                successMeterCardLayout={successMeterCardLayout}
                flashingMekSlots={flashingMekSlots}
              />
            ) : (
              // No node selected - show empty state with darkened card
              <div className="opacity-30">
                <StoryMissionCard
                  title="----------"
                  mekImage=""
                  mekName="----------"
                  mekRank={null}
                  goldReward={0}
                  xpReward={0}
                  potentialRewards={[]}
                  variationBuffs={[]}
                  successChance={0}
                  deploymentFee={0}
                  availableSlots={0}
                  selectedMeks={[]}
                  onDeploy={() => {}}
                  onMekSlotClick={() => {}}
                  onMekRemove={() => {}}
                  scale={0.95}
                  isLocked={false}
                  isEmpty={true}
                  currentDifficulty={'medium'}
                  onDifficultyChange={() => {}}
                  showDifficultySelector={false}
                  difficultyConfig={null}
                  lockedStyle={1}
                  completedDifficulties={new Set()}
                  onDifficultyComplete={() => {}}
                  mekContributions={[]}
                  variationBuffLayoutStyle={2}
                  successMeterCardLayout={successMeterCardLayout}
                />
              </div>
            )}

            {/* Complete button - outside the card for easy removal later */}
            {selectedNode && isNodeAvailable(selectedNode) && !completedNodes.has(selectedNode.id) && (
              <div className="mt-4 px-4">
                <button
                  onClick={() => {
                    const newCompleted = new Set(completedNodes);
                    newCompleted.add(selectedNode.id);
                    setCompletedNodes(newCompleted);
                    setSelectedNode(null); // Clear selection after completing
                  }}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold uppercase tracking-wider transition-colors duration-200 border-2 border-green-400/50"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 100%, 10px 100%)' }}
                >
                  Complete Mission
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mek Recruitment Modal */}
      <MekRecruitmentModalV4
        showMekModal={showMekModal}
        selectedMekSlot={selectedMekSlot}
        onClose={() => {
          setShowMekModal(null);
          setSelectedMekSlot(null);
        }}
        onMekSelection={handleMekSelection}
        mekCount={40}
        mekCardStyle={1}
        traitCircleStyle={1}
        mekFrameStyle={1}
        difficultyConfig={currentDifficultyConfig}
      />

      {/* Floating Success Meter Test Panel - Bottom Left */}
      <div className="fixed bottom-4 left-4 z-[9999]">
        {/* Toggle Button */}
        {!showTestPanel && (
          <button
            onClick={() => setShowTestPanel(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2 transition-all border-2 border-purple-400"
          >
            <span className="text-lg">🧪</span>
            <span className="text-sm font-bold">Test Success</span>
          </button>
        )}

        {/* Test Panel */}
        {showTestPanel && (
          <div className="bg-black border-2 border-purple-500 rounded-lg p-4 shadow-2xl w-80">
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                🧪 Success Meter Test
              </span>
              <button
                onClick={() => setShowTestPanel(false)}
                className="text-gray-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Current Value */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl font-bold text-yellow-400">{testSuccessRate}%</span>
              <div className="flex-1 text-xs text-gray-300">
                Test success meter position
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max="100"
              value={testSuccessRate}
              onChange={(e) => setTestSuccessRate(Number(e.target.value))}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer mb-3"
            />

            {/* Quick Jump Buttons */}
            <div className="grid grid-cols-4 gap-1 text-xs">
              <button
                onClick={() => setTestSuccessRate(0)}
                className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-white"
              >
                0%
              </button>
              <button
                onClick={() => setTestSuccessRate(30)}
                className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-white"
              >
                30%
              </button>
              <button
                onClick={() => setTestSuccessRate(70)}
                className="px-2 py-1 bg-green-700 rounded hover:bg-green-600 text-white font-bold"
              >
                GL
              </button>
              <button
                onClick={() => setTestSuccessRate(100)}
                className="px-2 py-1 bg-yellow-700 rounded hover:bg-yellow-600 text-white"
              >
                100%
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Mission Confirmation Lightbox */}
      <CancelMissionLightbox
        isOpen={showCancelLightbox}
        onClose={() => {
          setShowCancelLightbox(false);
          setPendingCancelNodeId(null);
        }}
        onConfirm={async () => {
          if (pendingCancelNodeId) {
            try {
              await cancelMission({ nodeId: pendingCancelNodeId });
              console.log(`Mission cancelled for node ${pendingCancelNodeId}`);
            } catch (error) {
              console.error('Failed to cancel mission:', error);
            }
          }
          setShowCancelLightbox(false);
          setPendingCancelNodeId(null);
        }}
        contractFee={(() => {
          if (pendingCancelNodeId && selectedNode?.id === pendingCancelNodeId) {
            return getNodeContractFee(selectedNode as ExtendedStoryNode);
          }
          return 0;
        })()}
      />

      {/* Mint NFT Lightbox */}
      <MintNFTLightbox
        isOpen={showMintLightbox}
        onClose={() => setShowMintLightbox(false)}
        onConfirm={() => {
          console.log('Proceeding to mint NFT...');
          setShowMintLightbox(false);
          // TODO: Add actual minting logic here
        }}
        eventId="1"
        difficulty="easy"
        eventName="Chapter 1 - Event 1"
        nftPrice={50}
      />

      {/* Debug Button - Fixed position on right side */}
      <button
        onClick={() => setShowMintLightbox(true)}
        className="fixed right-4 top-[200px] z-[9998] bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 font-bold py-2 px-4 rounded hover:bg-yellow-500/30 transition-all uppercase tracking-wider"
        style={{ fontFamily: 'Orbitron, monospace' }}
        title="Debug: Open Mint NFT Lightbox"
      >
        🎨 Mint
      </button>

      {/* Deploy Validation Popup */}
      {showDeployValidationPopup && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={() => setShowDeployValidationPopup(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Popup */}
          <div
            className="relative bg-black/95 border-2 border-red-500/50 rounded-lg p-6 max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 0 50px rgba(239, 68, 68, 0.3)',
            }}
          >
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-red-400 text-center mb-4 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, monospace' }}>
              Cannot Deploy Mission
            </h2>

            {/* Error Messages */}
            <div className="bg-red-900/20 border border-red-500/30 rounded p-4 mb-6">
              <ul className="space-y-2">
                {deployValidationErrors.map((error, index) => (
                  <li key={index} className="text-red-400 flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* OK Button */}
            <button
              onClick={() => setShowDeployValidationPopup(false)}
              className="w-full bg-red-500/20 border-2 border-red-500 text-red-400 font-bold py-3 px-6 rounded hover:bg-red-500/30 transition-colors uppercase tracking-wider"
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}