'use client';

import React, { useState, useEffect } from 'react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import mekRarityMaster from '../../convex/mekRarityMaster.json';
import { calculateChipRewardsForEvent, MODIFIER_COLORS, TIER_COLORS } from '@/lib/chipRewardCalculator';
import { DeploymentStatus } from '@/types/deployedNodeData';

// Genesis Token definitions - membership tokens with different rarities
const GENESIS_TOKENS = {
  rainbow: { name: 'Rainbow Genesis', rarity: 'legendary', quantity: 54, buffPercent: 25, color: '#A855F7', image: '/genesis-art/rainbow-genesis.png' },
  pink: { name: 'Pink Genesis', rarity: 'epic', quantity: 88, buffPercent: 20, color: '#EC4899', image: '/genesis-art/pink-genesis.png' },
  green: { name: 'Green Genesis', rarity: 'rare', quantity: 207, buffPercent: 15, color: '#10B981', image: '/genesis-art/green-genesis.png' },
  red: { name: 'Red Genesis', rarity: 'uncommon', quantity: 318, buffPercent: 10, color: '#EF4444', image: '/genesis-art/red-genesis.png' },
  teal: { name: 'Teal Genesis', rarity: 'common', quantity: 333, buffPercent: 5, color: '#14B8A6', image: '/genesis-art/teal-genesis.png' }
} as const;

type GenesisTokenColor = keyof typeof GENESIS_TOKENS;

// Essence types available in the game (based on Mek variations)
const ESSENCE_TYPES = [
  "Stone", "Disco", "Paul", "Cartoon", "Candy", "Tiles", "Moss", "Bullish",
  "Journalist", "Laser", "Flashbulb", "Accordion", "Turret", "Drill", "Security",
  "Camera", "Film", "Musical", "Construction", "Industrial", "Vintage", "Modern",
  "Retro", "Futuristic", "Organic", "Geometric", "Abstract", "Bumble Bee"
];

// Power chip types (will be expanded later as chip system develops)
const POWER_CHIP_TYPES = [
  "Universal Chip", "Head-Specific Chip", "Body-Specific Chip", "Trait-Specific Chip",
  "Tier 1 Chip", "Tier 2 Chip", "Tier 3 Chip", "Tier 4 Chip", "Tier 5 Chip"
];

interface EventNode {
  eventNumber: number;
  name: string;
  difficultyNames?: {
    easy: string;
    medium: string;
    hard: string;
  }; // Individual names for each difficulty
  goldReward: number;
  xpReward: number;
  images?: {
    easy: string;
    medium: string;
    hard: string;
  }; // 3 images per event (one for each difficulty)
  mekSlots?: {
    easy: number;
    medium: number;
    hard: number;
  };
  genesisBuffs?: {
    easy: GenesisTokenColor[];
    medium: GenesisTokenColor[];
    hard: GenesisTokenColor[];
  }; // Genesis tokens that provide buffs for each difficulty
  essenceRewards?: Array<{
    variation: string;
    abundanceRank: number; // 1-80, where 1 is least abundant
    count: number; // How many times this variation appears in the chapter
    type: 'head' | 'body' | 'trait';
  }>;
  customRewards?: Array<{
    id: string;
    name: string;
    type: 'frame' | 'canister' | 'gear' | 'other';
    description?: string;
  }>;
  items?: Array<{
    id: string;
    name: string;
    type: string;
    category?: string;
  }>;
  deploymentRequirements?: {
    easy: {
      goldFee: number;
      essences: Array<{type: string; amount: number}>;
      chip: string; // "N/A" or chip type
      special: string; // "N/A" or special requirement
      duration: number; // in seconds
    };
    medium: {
      goldFee: number;
      essences: Array<{type: string; amount: number}>;
      chip: string;
      special: string;
      duration: number;
    };
    hard: {
      goldFee: number;
      essences: Array<{type: string; amount: number}>;
      chip: string;
      special: string;
      duration: number;
    };
  };
}

interface MekData {
  rank: number;
  assetId: string;
  sourceKey: string;
  head: string;
  body: string;
  trait: string;
}

interface VariationCount {
  name: string;
  count: number;
  type: 'head' | 'body' | 'trait';
}

// Boss variations from ranks 1-10 that should not be available as event rewards
const BOSS_VARIATIONS = {
  heads: new Set([
    'Derelict', 'Obliterator', 'Ace of Spades Ultimate', 'Discomania',
    'Paul Ultimate', 'Frost King', 'Pie', 'Projectionist',
    'Ellie Mesh', 'Nyan Ultimate'
  ]),
  bodies: new Set([
    'Gatsby Ultimate', 'Luxury Ultimate', 'Plush Ultimate', 'X Ray Ultimate',
    'Burnt Ultimate', 'Frost Cage', 'Carving Ultimate', 'Cousin Itt',
    'Chrome Ultimate', 'Heatwave Ultimate'
  ]),
  traits: new Set([
    'Stolen', 'Golden Guns Ultimate', 'Linkinator 3000', 'Oompah',
    'Peacock Ultimate', 'None', 'Null', 'Nil', 'Gone', 'Vanished'
  ])
};

export default function EventNodeEditor() {
  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastDeployedData, setLastDeployedData] = useState<string>('');

  // Calculate mek slots for an event using round-robin distribution
  const calculateEventMekSlots = (eventNumber: number): { easy: number; medium: number; hard: number } => {
    // Event numbers are 1-based
    const index = eventNumber - 1;
    const eventInChapter = ((eventNumber - 1) % 20) + 1; // 1-20 within each chapter

    // Easy mode (2-3 slots): alternate 2,3,2,3... but event 20 is always 3
    let easy: number;
    if (eventInChapter === 20) {
      easy = 3; // Event 20 always gets max
    } else {
      easy = 2 + (index % 2); // Alternates 2,3,2,3...
    }

    // Medium mode (4-6 slots): round robin 4,5,6,4,5,6... but event 20 is always 6
    let medium: number;
    if (eventInChapter === 20) {
      medium = 6; // Event 20 always gets max
    } else {
      medium = 4 + (index % 3); // Round robin 4,5,6,4,5,6...
    }

    // Hard mode (7-8 slots): alternate 7,8,7,8... but event 20 is always 8
    let hard: number;
    if (eventInChapter === 20) {
      hard = 8; // Event 20 always gets max
    } else {
      hard = 7 + (index % 2); // Alternates 7,8,7,8...
    }

    return { easy, medium, hard };
  };

  const [itemSearchTerms, setItemSearchTerms] = useState<{ [key: number]: string }>({});
  const [showItemSearch, setShowItemSearch] = useState<{ [key: number]: boolean }>({});
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [currentConfigId, setCurrentConfigId] = useState<Id<"eventNodeConfigs"> | null>(null);
  const [currentConfigName, setCurrentConfigName] = useState<string>('');
  const [saveName, setSaveName] = useState('');
  const [bulkNames, setBulkNames] = useState('');
  const [showLoadLightbox, setShowLoadLightbox] = useState(false);
  const [previewImage, setPreviewImage] = useState<number | null>(null);
  const [showAddRewardModal, setShowAddRewardModal] = useState<number | null>(null);
  const [newReward, setNewReward] = useState<{
    name: string;
    type: 'frame' | 'canister' | 'gear' | 'other';
    description: string;
  }>({ name: '', type: 'frame', description: '' });

  // Batch image assignment
  const [eventImagesFolder, setEventImagesFolder] = useState<string>('/event-nfts');

  // Deployment state
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    isDeploying: false,
  });

  // Selective deployment state
  const [deploymentChapter, setDeploymentChapter] = useState<number>(() => {
    return parseInt(localStorage.getItem('lastDeploymentChapter') || '1');
  });
  const [deploymentNodeTypes, setDeploymentNodeTypes] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('lastDeploymentNodeTypes');
    return saved ? new Set(JSON.parse(saved)) : new Set(['event', 'normal', 'mini_boss', 'challenger', 'final_boss']);
  });

  // Genesis buffs generation state (for green/yellow button)
  const [genesisBuffsGenerated, setGenesisBuffsGenerated] = useState(false);

  // Genesis buff assignment state
  const [genesisBuffs, setGenesisBuffs] = useState<{[eventNumber: number]: {easy: GenesisTokenColor[], medium: GenesisTokenColor[], hard: GenesisTokenColor[]}}>({});
  const [showBuffPreview, setShowBuffPreview] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<number>(1); // 1-10 = specific chapter

  // Variation buffs data (optional detailed buff info indexed by event number)
  const variationBuffs: {[eventNumber: number]: Array<{name: string, count: number, type: 'head' | 'body' | 'trait'}>} = {};

  // Global ranges for all 200 events (per difficulty)
  const [globalRanges, setGlobalRanges] = useState({
    easy: { minGold: 100, maxGold: 5000, minXP: 10, maxXP: 500 },
    medium: { minGold: 200, maxGold: 10000, minXP: 20, maxXP: 1000 },
    hard: { minGold: 400, maxGold: 20000, minXP: 40, maxXP: 2000 },
    rewardRounding: '100' as 'none' | '10' | '100' | '1000',
    showVisualization: false
  });

  // Deployment Fee configuration for all 200 events (per difficulty)
  const [deploymentFeeConfig, setDeploymentFeeConfig] = useState({
    easy: { minFee: 1000, maxFee: 50000 },
    medium: { minFee: 2000, maxFee: 100000 },
    hard: { minFee: 4000, maxFee: 200000 },
    interpolationType: 'linear' as 'linear' | 'exponential' | 'logarithmic',
    curveStrength: 1.5,
    feeRounding: '100' as 'none' | '10' | '100' | '1000',
    showVisualization: false
  });

  // Duration configuration for events (per difficulty)
  const [durationConfig, setDurationConfig] = useState({
    easy: { min: 300, max: 1800 }, // seconds (5 min to 30 min)
    medium: { min: 600, max: 3600 }, // seconds (10 min to 60 min)
    hard: { min: 1200, max: 7200 }, // seconds (20 min to 120 min)
    showVisualization: false
  });

  // Genesis success bonus percentages configuration
  const [genesisSuccessBonus, setGenesisSuccessBonus] = useState({
    purple: {
      easy: { min: 25, max: 50 },
      medium: { min: 28, max: 55 },
      hard: { min: 30, max: 60 }
    },
    red: {
      easy: { min: 20, max: 40 },
      medium: { min: 22, max: 45 },
      hard: { min: 25, max: 50 }
    },
    yellow: {
      easy: { min: 15, max: 30 },
      medium: { min: 17, max: 35 },
      hard: { min: 20, max: 40 }
    },
    green: {
      easy: { min: 10, max: 20 },
      medium: { min: 12, max: 25 },
      hard: { min: 15, max: 30 }
    },
    blue: {
      easy: { min: 5, max: 10 },
      medium: { min: 7, max: 15 },
      hard: { min: 10, max: 20 }
    },
    setBonus: {
      easy: { min: 10, max: 25 },
      medium: { min: 12, max: 30 },
      hard: { min: 15, max: 35 }
    },
    showVisualization: false
  });

  // Selected event for deployment requirements configuration
  const [selectedDeploymentEvent, setSelectedDeploymentEvent] = useState(1);

  // Initialize eventsData before using it in queries
  const [eventsData, setEventsData] = useState<EventNode[]>(() => {
    // Initialize with 200 events (20 per chapter × 10 chapters)
    const initialData: EventNode[] = [];
    for (let i = 1; i <= 200; i++) {
      const eventInChapter = ((i - 1) % 20) + 1; // 1-20 within each chapter
      const index = i - 1;

      // Calculate mek slots with round-robin distribution
      const mekSlots = {
        easy: eventInChapter === 20 ? 3 : 2 + (index % 2),
        medium: eventInChapter === 20 ? 6 : 4 + (index % 3),
        hard: eventInChapter === 20 ? 8 : 7 + (index % 2)
      };

      initialData.push({
        eventNumber: i,
        name: `Event ${i}`,
        goldReward: 100,
        xpReward: 10,
        mekSlots,
        items: []
      });
    }
    return initialData;
  });

  const saveConfiguration = useMutation(api.eventNodeRewards.saveConfiguration);
  const updateConfiguration = useMutation(api.eventNodeRewards.updateConfiguration);
  const deleteConfiguration = useMutation(api.eventNodeRewards.deleteConfiguration);
  const savedConfigs = useQuery(api.eventNodeRewards.getConfigurations);
  const selectedConfig = useQuery(
    api.eventNodeRewards.loadConfiguration,
    currentConfigId ? { configId: currentConfigId } : "skip"
  );

  // Deployment mutations and queries
  const deployEventNodes = useMutation(api.deployedNodeData.deployEventNodes);
  const deploymentHistory = useQuery(api.deployedNodeData.getDeploymentHistory, { limit: 5 });

  // Get search results for the active search
  const activeSearchTerm = activeSearchIndex !== null ? (itemSearchTerms[activeSearchIndex] || '') : '';
  const searchResults = useQuery(
    api.gameItemsSearch.searchGameItems,
    activeSearchTerm.length >= 2 ? { searchTerm: activeSearchTerm } : "skip"
  );

  // Load selected configuration
  useEffect(() => {
    if (selectedConfig?.data) {
      try {
        const loadedData = JSON.parse(selectedConfig.data);
        if (loadedData.events) {
          // Apply mek slots to loaded events (in case they don't have them)
          const eventsWithSlots = loadedData.events.map((event: EventNode) => ({
            ...event,
            mekSlots: event.mekSlots || calculateEventMekSlots(event.eventNumber)
          }));
          setEventsData(eventsWithSlots);

          // Reconstruct genesisBuffs state for display
          const reconstructedBuffs: {[eventNumber: number]: {easy: GenesisTokenColor[], medium: GenesisTokenColor[], hard: GenesisTokenColor[]}} = {};
          eventsWithSlots.forEach((event: EventNode) => {
            if (event.genesisBuffs) {
              reconstructedBuffs[event.eventNumber] = {
                easy: event.genesisBuffs.easy || [],
                medium: event.genesisBuffs.medium || [],
                hard: event.genesisBuffs.hard || []
              };
            }
          });
          setGenesisBuffs(reconstructedBuffs);
        }
        if (loadedData.globalRanges) {
          setGlobalRanges({
            easy: { minGold: 100, maxGold: 5000, minXP: 10, maxXP: 500, ...loadedData.globalRanges.easy },
            medium: { minGold: 200, maxGold: 10000, minXP: 20, maxXP: 1000, ...loadedData.globalRanges.medium },
            hard: { minGold: 400, maxGold: 20000, minXP: 40, maxXP: 2000, ...loadedData.globalRanges.hard },
            showVisualization: loadedData.globalRanges.showVisualization || false
          });
        }
        if (loadedData.eventImagesFolder) {
          setEventImagesFolder(loadedData.eventImagesFolder);
        }
        if (loadedData.deploymentFeeConfig) {
          setDeploymentFeeConfig({
            easy: { minFee: 1000, maxFee: 50000, ...loadedData.deploymentFeeConfig.easy },
            medium: { minFee: 2000, maxFee: 100000, ...loadedData.deploymentFeeConfig.medium },
            hard: { minFee: 4000, maxFee: 200000, ...loadedData.deploymentFeeConfig.hard },
            interpolationType: loadedData.deploymentFeeConfig.interpolationType || 'linear',
            curveStrength: loadedData.deploymentFeeConfig.curveStrength || 1.5,
            showVisualization: loadedData.deploymentFeeConfig.showVisualization || false
          });
        }
      } catch (error) {
        console.error('Failed to parse configuration data:', error);
      }
    }
  }, [selectedConfig]);

  // Auto-load last used configuration on mount
  useEffect(() => {
    // Try to load the last used config from localStorage
    const lastConfigId = localStorage.getItem('lastEventNodeConfigId');
    const lastConfigName = localStorage.getItem('lastEventNodeConfigName');

    if (lastConfigId && lastConfigName && !currentConfigId && savedConfigs) {
      // Validate that the stored config ID still exists in the database
      const configExists = savedConfigs.some((config: any) => config._id === lastConfigId);

      if (configExists) {
        setCurrentConfigId(lastConfigId as Id<"eventNodeConfigs">);
        setCurrentConfigName(lastConfigName);
      } else {
        // Config was deleted, clear localStorage and load most recent
        localStorage.removeItem('lastEventNodeConfigId');
        localStorage.removeItem('lastEventNodeConfigName');

        if (savedConfigs.length > 0) {
          const mostRecent = savedConfigs.reduce((latest: any, current: any) => {
            return !latest || current._creationTime > latest._creationTime ? current : latest;
          }, savedConfigs[0]);

          if (mostRecent) {
            setCurrentConfigId(mostRecent._id);
            setCurrentConfigName(mostRecent.name);
            localStorage.setItem('lastEventNodeConfigId', mostRecent._id);
            localStorage.setItem('lastEventNodeConfigName', mostRecent.name);
          }
        }
      }
    } else if (!currentConfigId && savedConfigs && savedConfigs.length > 0) {
      // If no last config but there are saved configs, load the most recent one
      const mostRecent = savedConfigs.reduce((latest: any, current: any) => {
        return !latest || current._creationTime > latest._creationTime ? current : latest;
      }, savedConfigs[0]);

      if (mostRecent) {
        setCurrentConfigId(mostRecent._id);
        setCurrentConfigName(mostRecent.name);
        localStorage.setItem('lastEventNodeConfigId', mostRecent._id);
        localStorage.setItem('lastEventNodeConfigName', mostRecent.name);
      }
    }
  }, [savedConfigs]);

  // Apply reward rounding (for gold and XP)
  const applyRewardRounding = (value: number): number => {
    switch (globalRanges.rewardRounding) {
      case '10':
        return Math.round(value / 10) * 10;
      case '100':
        return Math.round(value / 100) * 100;
      case '1000':
        return Math.round(value / 1000) * 1000;
      default:
        return Math.round(value);
    }
  };

  // Apply fee rounding
  const applyFeeRounding = (value: number): number => {
    switch (deploymentFeeConfig.feeRounding) {
      case '10':
        return Math.round(value / 10) * 10;
      case '100':
        return Math.round(value / 100) * 100;
      case '1000':
        return Math.round(value / 1000) * 1000;
      default:
        return Math.round(value);
    }
  };

  // Calculate gold for an event within the selected chapter
  const calculateChapterGold = (eventNumber: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): number => {
    const chapterStartEvent = (selectedChapter - 1) * 20 + 1;
    const chapterEndEvent = selectedChapter * 20;

    // Normalize position within the chapter (0 to 1)
    const normalizedPosition = (eventNumber - chapterStartEvent) / (chapterEndEvent - chapterStartEvent);

    const difficultyConfig = globalRanges[difficulty];
    const gold = difficultyConfig.minGold + (difficultyConfig.maxGold - difficultyConfig.minGold) * normalizedPosition;

    return applyRewardRounding(gold);
  };

  // Calculate XP for an event within the selected chapter
  const calculateChapterXP = (eventNumber: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): number => {
    const chapterStartEvent = (selectedChapter - 1) * 20 + 1;
    const chapterEndEvent = selectedChapter * 20;

    // Normalize position within the chapter (0 to 1)
    const normalizedPosition = (eventNumber - chapterStartEvent) / (chapterEndEvent - chapterStartEvent);

    const difficultyConfig = globalRanges[difficulty];
    const xp = difficultyConfig.minXP + (difficultyConfig.maxXP - difficultyConfig.minXP) * normalizedPosition;

    return applyRewardRounding(xp);
  };

  // Calculate deployment fee for an event based on its number and difficulty
  const calculateDeploymentFee = (eventNumber: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): number => {
    // Calculate position within the current chapter (20 events per chapter)
    const chapterStartEvent = (selectedChapter - 1) * 20 + 1;
    const chapterEndEvent = selectedChapter * 20;

    // Normalize position within the chapter (0 to 1)
    const normalizedPosition = (eventNumber - chapterStartEvent) / (chapterEndEvent - chapterStartEvent);

    let interpolatedValue: number;
    switch (deploymentFeeConfig.interpolationType) {
      case 'linear':
        interpolatedValue = normalizedPosition;
        break;
      case 'exponential':
        interpolatedValue = Math.pow(normalizedPosition, deploymentFeeConfig.curveStrength);
        break;
      case 'logarithmic':
        // Logarithmic curve (starts steep, flattens out)
        interpolatedValue = Math.log(1 + normalizedPosition * 9) / Math.log(10);
        break;
      default:
        interpolatedValue = normalizedPosition;
    }

    // Get difficulty-specific min/max
    const difficultyConfig = deploymentFeeConfig[difficulty];
    const fee = difficultyConfig.minFee +
      (difficultyConfig.maxFee - difficultyConfig.minFee) * interpolatedValue;

    // Apply fee rounding
    return applyFeeRounding(fee);
  };

  // Calculate duration for an event based on difficulty
  const calculateDuration = (eventNumber: number, difficulty: 'easy' | 'medium' | 'hard'): number => {
    const chapterStartEvent = (selectedChapter - 1) * 20 + 1;
    const chapterEndEvent = selectedChapter * 20;

    // Normalize position within the chapter (0 to 1)
    const normalizedPosition = (eventNumber - chapterStartEvent) / (chapterEndEvent - chapterStartEvent);

    const config = durationConfig[difficulty];
    const duration = config.min + (config.max - config.min) * normalizedPosition;

    return Math.round(duration);
  };

  // Helper to format duration in human-readable format
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Calculate Genesis success bonus percentage for a specific event and color
  const calculateGenesisBonus = (eventNumber: number, difficulty: 'easy' | 'medium' | 'hard', color: GenesisTokenColor | 'setBonus'): number => {
    const chapterStartEvent = (selectedChapter - 1) * 20 + 1;
    const chapterEndEvent = selectedChapter * 20;

    // Normalize position within the chapter (0 to 1)
    const normalizedPosition = (eventNumber - chapterStartEvent) / (chapterEndEvent - chapterStartEvent);

    const config = genesisSuccessBonus[color][difficulty];
    const bonus = config.min + (config.max - config.min) * normalizedPosition;

    return Math.round(bonus * 10) / 10; // Round to 1 decimal place
  };

  // Apply linear distribution to all 200 events (uses medium difficulty values)
  const applyGlobalRanges = () => {
    const goldStep = (globalRanges.medium.maxGold - globalRanges.medium.minGold) / 199;
    const xpStep = (globalRanges.medium.maxXP - globalRanges.medium.minXP) / 199;

    const newEventsData = eventsData.map((event: any, index: number) => ({
      ...event,
      goldReward: applyRewardRounding(globalRanges.medium.minGold + (goldStep * index)),
      xpReward: applyRewardRounding(globalRanges.medium.minXP + (xpStep * index))
    }));

    setEventsData(newEventsData);
  };

  // Apply bulk names to all events
  const applyBulkNames = () => {
    const names = bulkNames.split(',').map((name: any) => name.trim());
    if (names.length === 0) return;

    const newEventsData = eventsData.map((event: any, index: number) => ({
      ...event,
      name: names[index] || `Event ${index + 1}`
    }));

    setEventsData(newEventsData);
  };

  // Update event name
  const updateEventName = (eventIndex: number, name: string) => {
    const newEventsData = [...eventsData];
    newEventsData[eventIndex].name = name;
    setEventsData(newEventsData);
  };

  // Update individual event rewards
  const updateEventRewards = (eventIndex: number, gold: number, xp: number) => {
    const newEventsData = [...eventsData];
    newEventsData[eventIndex].goldReward = gold;
    newEventsData[eventIndex].xpReward = xp;
    setEventsData(newEventsData);
  };

  // Update event image
  const updateEventImage = (eventIndex: number, imagePath: string) => {
    const newEventsData = [...eventsData];
    newEventsData[eventIndex].image = imagePath;
    setEventsData(newEventsData);
  };

  // Batch assign images from folder
  const batchAssignImages = async () => {
    console.log('Starting batch assignment with folder:', eventImagesFolder);
    const newEventsData = eventsData.map((event: any, index: number) => {
      // Replace spaces with %20 for URL compatibility
      const encodedFolder = eventImagesFolder.replace(/ /g, '%20');

      // Generate paths for all 3 difficulties using e[number]-[E/M/H] naming
      const easyPath = `${encodedFolder}/e${event.eventNumber}-E.png`;
      const mediumPath = `${encodedFolder}/e${event.eventNumber}-M.png`;
      const hardPath = `${encodedFolder}/e${event.eventNumber}-H.png`;

      console.log(`Event ${event.eventNumber}: Easy=${easyPath}, Medium=${mediumPath}, Hard=${hardPath}`);

      return {
        ...event,
        images: {
          easy: easyPath,
          medium: mediumPath,
          hard: hardPath
        }
      };
    });
    setEventsData(newEventsData);
    console.log('Batch assignment complete, first 3 events:', newEventsData.slice(0, 3));

    // Auto-save the configuration if there's a current config
    if (currentConfigId) {
      try {
        await updateConfiguration({
          configId: currentConfigId,
          data: JSON.stringify({ events: newEventsData, globalRanges, eventImagesFolder }),
          timestamp: Date.now(),
        });
        alert(`Successfully assigned images and saved to "${currentConfigName}"!`);
      } catch (error) {
        console.error('Failed to auto-save after batch assignment:', error);
        alert(`Images assigned but auto-save failed. Please click "Update" to save manually.`);
      }
    } else {
      alert(`Successfully assigned images! Click "Update" or save as a new configuration to persist changes.`);
    }
  };

  // Add item to event
  const addItemToEvent = (eventIndex: number, item: any) => {
    const newEventsData = [...eventsData];
    if (!newEventsData[eventIndex].items) {
      newEventsData[eventIndex].items = [];
    }
    const exists = newEventsData[eventIndex].items?.some(
      i => i.id === item.id
    );
    if (!exists) {
      newEventsData[eventIndex].items?.push(item);
      setEventsData(newEventsData);
    }
    setItemSearchTerms(prev => ({ ...prev, [eventIndex]: '' }));
    setShowItemSearch(prev => ({ ...prev, [eventIndex]: false }));
  };

  // Remove item from event
  const removeItemFromEvent = (eventIndex: number, itemId: string) => {
    const newEventsData = [...eventsData];
    newEventsData[eventIndex].items =
      newEventsData[eventIndex].items?.filter(
        item => item.id !== itemId
      ) || [];
    setEventsData(newEventsData);
  };

  // Add custom reward to event
  const addCustomReward = (eventIndex: number) => {
    if (!newReward.name) {
      alert('Please enter a reward name');
      return;
    }

    const newEventsData = [...eventsData];
    if (!newEventsData[eventIndex].customRewards) {
      newEventsData[eventIndex].customRewards = [];
    }

    newEventsData[eventIndex].customRewards.push({
      id: `custom-${Date.now()}-${Math.random()}`,
      name: newReward.name,
      type: newReward.type,
      description: newReward.description || undefined
    });

    setEventsData(newEventsData);
    setShowAddRewardModal(null);
    setNewReward({ name: '', type: 'frame', description: '' });
  };

  // Remove custom reward from event
  const removeCustomReward = (eventIndex: number, rewardId: string) => {
    const newEventsData = [...eventsData];
    newEventsData[eventIndex].customRewards =
      newEventsData[eventIndex].customRewards?.filter(
        reward => reward.id !== rewardId
      ) || [];
    setEventsData(newEventsData);
  };

  // Save new configuration
  const handleSave = async () => {
    if (!saveName.trim()) {
      alert('Please enter a save name');
      return;
    }

    try {
      const result = await saveConfiguration({
        name: saveName,
        data: JSON.stringify({ events: eventsData, globalRanges, eventImagesFolder, deploymentFeeConfig }),
        timestamp: Date.now(),
      });
      alert('Event configuration saved successfully!');
      setSaveName('');
      // Set as current config after saving
      if (result && result._id) {
        setCurrentConfigId(result._id);
        setCurrentConfigName(saveName);
        // Save to localStorage for auto-load next time
        localStorage.setItem('lastEventNodeConfigId', result._id);
        localStorage.setItem('lastEventNodeConfigName', saveName);
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration');
    }
  };

  // Update existing configuration
  const handleUpdate = async () => {
    if (!currentConfigId) {
      alert('No configuration loaded to update');
      return;
    }

    try {
      await updateConfiguration({
        configId: currentConfigId,
        data: JSON.stringify({ events: eventsData, globalRanges, eventImagesFolder, deploymentFeeConfig }),
        timestamp: Date.now(),
      });
      alert('Configuration updated successfully!');
      // Ensure localStorage stays current
      localStorage.setItem('lastEventNodeConfigId', currentConfigId);
      localStorage.setItem('lastEventNodeConfigName', currentConfigName);
    } catch (error) {
      console.error('Failed to update configuration:', error);
      alert('Failed to update configuration');
    }
  };

  // Generate Genesis buffs for all events
  const generateGenesisBuffs = () => {
    // All 5 Genesis tokens are active on every event for all difficulties
    const allColors: GenesisTokenColor[] = ['rainbow', 'pink', 'green', 'red', 'teal'];
    const newEventsData = [...eventsData];

    for (let i = 0; i < newEventsData.length; i++) {
      const event = newEventsData[i];

      // All 5 Genesis tokens are assigned to every difficulty level
      const genesisBuffs: {
        easy: GenesisTokenColor[];
        medium: GenesisTokenColor[];
        hard: GenesisTokenColor[];
      } = {
        easy: [...allColors],    // All 5 tokens
        medium: [...allColors],  // All 5 tokens
        hard: [...allColors]     // All 5 tokens
      };

      newEventsData[i] = {
        ...event,
        genesisBuffs
      };
    }

    setEventsData(newEventsData);
    console.log('Generated Genesis buffs for all 200 events (all 5 tokens per difficulty)');
  };

  // Load configuration
  const handleLoadConfig = (configId: Id<"eventNodeConfigs">, configName: string) => {
    setCurrentConfigId(configId);
    setCurrentConfigName(configName);
    setShowLoadLightbox(false);
    // Save to localStorage for auto-load next time
    localStorage.setItem('lastEventNodeConfigId', configId);
    localStorage.setItem('lastEventNodeConfigName', configName);
  };

  // Handle deployment to Story Climb
  const handleDeployment = async () => {
    // Filter events by chapter and node types
    const chapterStart = (deploymentChapter - 1) * 20 + 1;
    const chapterEnd = deploymentChapter * 20;

    // DIAGNOSTIC: Check if eventsData has genesisBuffs before filtering
    const eventsWithGenesisBuffs = eventsData.filter((e: any) => e.genesisBuffs).length;
    console.log('🔍 DEPLOYMENT DIAGNOSTIC - Before filtering:', {
      totalEvents: eventsData.length,
      eventsWithGenesisBuffs,
      firstEventSample: eventsData[0]?.genesisBuffs || 'No genesisBuffs'
    });

    const filteredEvents = eventsData.filter((event: any) => {
      // Check if event is in selected chapter
      if (event.eventNumber < chapterStart || event.eventNumber > chapterEnd) {
        return false;
      }

      // For now, we're only filtering event nodes
      // (normal, mini_boss, etc. would be separate node types in the future)
      return deploymentNodeTypes.has('event');
    });

    // DIAGNOSTIC: Check if filteredEvents has genesisBuffs after filtering
    const filteredWithGenesisBuffs = filteredEvents.filter((e: any) => e.genesisBuffs).length;
    console.log('🔍 DEPLOYMENT DIAGNOSTIC - After filtering:', {
      filteredCount: filteredEvents.length,
      filteredWithGenesisBuffs,
      firstFilteredSample: filteredEvents[0]?.genesisBuffs || 'No genesisBuffs'
    });

    if (filteredEvents.length === 0) {
      alert('No nodes selected for deployment. Please select at least one node type.');
      return;
    }

    // Save deployment preferences
    localStorage.setItem('lastDeploymentChapter', deploymentChapter.toString());
    localStorage.setItem('lastDeploymentNodeTypes', JSON.stringify([...deploymentNodeTypes]));

    setDeploymentStatus({ isDeploying: true });

    try {
      // Add chip rewards to filtered events before deployment
      const eventsWithChips = filteredEvents.map((event: any) => ({
        ...event,
        chipRewards: calculateChipRewardsForEvent(event.eventNumber).rewards
      }));

      // DIAGNOSTIC: Check if genesisBuffs survived the chip mapping
      const chipsWithGenesisBuffs = eventsWithChips.filter((e: any) => e.genesisBuffs).length;
      console.log('🔍 DEPLOYMENT DIAGNOSTIC - After adding chips:', {
        eventsWithChipsCount: eventsWithChips.length,
        chipsWithGenesisBuffs,
        firstChipSample: eventsWithChips[0]?.genesisBuffs || 'No genesisBuffs',
        firstChipFullData: eventsWithChips[0]
      });

      const result = await deployEventNodes({
        configurationId: currentConfigId || undefined,
        configurationName: currentConfigName || undefined,
        eventData: JSON.stringify(eventsWithChips),
        notes: `Deployed Chapter ${deploymentChapter}, Node Types: ${[...deploymentNodeTypes].join(', ')} from ${currentConfigName || 'Unsaved Configuration'}`,
      });

      if (result.success) {
        setDeploymentStatus({
          isDeploying: false,
          lastDeployment: {
            timestamp: Date.now(),
            success: true,
            message: result.message,
            deploymentId: result.deploymentId,
          },
        });
        alert(`Success! ${result.message}`);
      } else {
        throw new Error(result.error || 'Unknown deployment error');
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      setDeploymentStatus({
        isDeploying: false,
        lastDeployment: {
          timestamp: Date.now(),
          success: false,
          message: error instanceof Error ? error.message : 'Deployment failed',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      alert(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Round-robin distribution table - Event 1 gets less rare, Event 20 gets most rare
  const ROUND_ROBIN_TABLE = [
    [20, 40, 60, 80], // Event 1 - less rare of the 80 least abundant
    [19, 39, 59, 79], // Event 2
    [18, 38, 58, 78], // Event 3
    [17, 37, 57, 77], // Event 4
    [16, 36, 56, 76], // Event 5
    [15, 35, 55, 75], // Event 6
    [14, 34, 54, 74], // Event 7
    [13, 33, 53, 73], // Event 8
    [12, 32, 52, 72], // Event 9
    [11, 31, 51, 71], // Event 10
    [10, 30, 50, 70], // Event 11
    [9, 29, 49, 69],  // Event 12
    [8, 28, 48, 68],  // Event 13
    [7, 27, 47, 67],  // Event 14
    [6, 26, 46, 66],  // Event 15
    [5, 25, 45, 65],  // Event 16
    [4, 24, 44, 64],  // Event 17
    [3, 23, 43, 63],  // Event 18
    [2, 22, 42, 62],  // Event 19
    [1, 21, 41, 61],  // Event 20 - most rare of the 80 least abundant
  ];


  // Calculate and distribute essence rewards for a chapter using variations NOT in chapter
  const calculateEssenceDistribution = (chapterNumber: number) => {
    const typedMekData = mekRarityMaster as MekData[];

    // Define chapter ranges
    const chapterRanges: Record<number, number[][]> = {
      1: [[3651, 4000], [461, 500], [92, 100], [10, 10]],
      2: [[3301, 3650], [421, 460], [83, 91], [9, 9]],
      3: [[2951, 3300], [381, 420], [74, 82], [8, 8]],
      4: [[2601, 2950], [341, 380], [65, 73], [7, 7]],
      5: [[2251, 2600], [301, 340], [56, 64], [6, 6]],
      6: [[1901, 2250], [261, 300], [47, 55], [5, 5]],
      7: [[1551, 1900], [221, 260], [38, 46], [4, 4]],
      8: [[1201, 1550], [181, 220], [29, 37], [3, 3]],
      9: [[851, 1200], [141, 180], [20, 28], [2, 2]],
      10: [[501, 850], [101, 140], [11, 19], [1, 1]],
    };

    // Get all meks for the selected chapter
    const ranges = chapterRanges[chapterNumber];
    const chapterMeks: MekData[] = [];

    ranges.forEach(([start, end]) => {
      const rangeData = typedMekData.filter((mek: any) => mek.rank >= start && mek.rank <= end);
      chapterMeks.push(...rangeData);
    });

    // Create sets of variations that appear in this chapter
    const chapterHeads = new Set<string>();
    const chapterBodies = new Set<string>();
    const chapterTraits = new Set<string>();

    chapterMeks.forEach((mek: any) => {
      chapterHeads.add(mek.head);
      chapterBodies.add(mek.body);
      chapterTraits.add(mek.trait);
    });

    // Now count ALL variations across the entire 4000 mek collection
    const globalHeadCounts: Record<string, number> = {};
    const globalBodyCounts: Record<string, number> = {};
    const globalTraitCounts: Record<string, number> = {};

    typedMekData.forEach((mek: any) => {
      globalHeadCounts[mek.head] = (globalHeadCounts[mek.head] || 0) + 1;
      globalBodyCounts[mek.body] = (globalBodyCounts[mek.body] || 0) + 1;
      globalTraitCounts[mek.trait] = (globalTraitCounts[mek.trait] || 0) + 1;
    });

    // Find variations NOT in this chapter
    const missingHeads: VariationCount[] = [];
    const missingBodies: VariationCount[] = [];
    const missingTraits: VariationCount[] = [];

    // Check all global variations and add those not in chapter
    Object.entries(globalHeadCounts).forEach(([name, count]) => {
      if (!chapterHeads.has(name)) {
        missingHeads.push({ name, count, type: 'head' });
      }
    });

    Object.entries(globalBodyCounts).forEach(([name, count]) => {
      if (!chapterBodies.has(name)) {
        missingBodies.push({ name, count, type: 'body' });
      }
    });

    Object.entries(globalTraitCounts).forEach(([name, count]) => {
      if (!chapterTraits.has(name)) {
        // Now including None, Nil, etc. - they'll be filtered as boss variations
        missingTraits.push({ name, count, type: 'trait' });
      }
    });

    // Combine all missing variations and sort by global rarity (least common first)
    const allMissingVariations = [
      ...missingHeads,
      ...missingBodies,
      ...missingTraits
    ].sort((a, b) => a.count - b.count); // Sort by count ascending (rarest first)

    // Filter out boss variations (from top 10 final bosses)
    const eligibleMissingVariations = allMissingVariations.filter((v: any) => {
      if (v.type === 'head' && BOSS_VARIATIONS.heads.has(v.name)) return false;
      if (v.type === 'body' && BOSS_VARIATIONS.bodies.has(v.name)) return false;
      if (v.type === 'trait' && BOSS_VARIATIONS.traits.has(v.name)) return false;
      return true;
    });

    // Take up to 80 of the rarest eligible missing variations
    const rarest80Missing = eligibleMissingVariations.slice(0, 80);

    const startIndex = (chapterNumber - 1) * 20;
    const chapterEvents = eventsData.slice(startIndex, startIndex + 20);

    // Apply the round-robin distribution
    const updatedEvents = chapterEvents.map((event: any, index: number) => {
      const essenceRanks = ROUND_ROBIN_TABLE[index];
      const essenceRewards = essenceRanks.map((rank: any) => {
        const variation = rarest80Missing[rank - 1];
        return variation ? {
          variation: variation.name,
          abundanceRank: rank,
          count: variation.count, // This is now the global count
          type: variation.type
        } : null;
      }).filter(Boolean) as EventNode['essenceRewards'];

      return {
        ...event,
        essenceRewards
      };
    });

    // Update the events data with the new essence rewards
    const newEventsData = [...eventsData];
    updatedEvents.forEach((event: any, index: number) => {
      newEventsData[startIndex + index] = event;
    });

    setEventsData(newEventsData);

    console.log(`Chapter ${chapterNumber}: Found ${allMissingVariations.length} variations NOT in chapter (${missingHeads.length} heads, ${missingBodies.length} bodies, ${missingTraits.length} traits)`);
    console.log(`After filtering boss variations: ${eligibleMissingVariations.length} eligible variations`);
  };

  // Calculate total rewards
  const totalGold = eventsData.reduce((sum: any, event: any) => sum + event.goldReward, 0);
  const totalXP = eventsData.reduce((sum: any, event: any) => sum + event.xpReward, 0);

  // Filter events by selected chapter
  const filteredEvents = eventsData.filter((event: any) => {
    const eventChapter = Math.ceil(event.eventNumber / 20);
    return eventChapter === selectedChapter;
  });

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-gray-800/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-purple-500/80">
            Event Node Configuration (Chapter {selectedChapter}, Events {(selectedChapter - 1) * 20 + 1}-{selectedChapter * 20})
          </h4>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Chapter:</label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(Number(e.target.value))}
              className="px-3 py-1 bg-black/50 border border-purple-500/30 rounded text-sm text-purple-300"
            >
              <option value={1}>Chapter 1 (1-20)</option>
              <option value={2}>Chapter 2 (21-40)</option>
              <option value={3}>Chapter 3 (41-60)</option>
              <option value={4}>Chapter 4 (61-80)</option>
              <option value={5}>Chapter 5 (81-100)</option>
              <option value={6}>Chapter 6 (101-120)</option>
              <option value={7}>Chapter 7 (121-140)</option>
              <option value={8}>Chapter 8 (141-160)</option>
              <option value={9}>Chapter 9 (161-180)</option>
              <option value={10}>Chapter 10 (181-200)</option>
            </select>
          </div>
        </div>

        {/* Save/Load/Update Controls */}
        <div className="mb-4 space-y-2">
          {currentConfigName && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded px-3 py-2 mb-2">
              <span className="text-xs text-purple-400">Current Config: </span>
              <span className="text-sm text-purple-300 font-semibold">{currentConfigName}</span>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="New configuration name..."
              className="flex-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded text-sm text-gray-300"
            />
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm transition-colors"
            >
              Save New
            </button>
            {currentConfigId && (
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
              >
                Update
              </button>
            )}
            <button
              onClick={() => setShowLoadLightbox(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm transition-colors"
            >
              Load
            </button>
          </div>

          {/* Selective Deployment */}
          <div className="flex items-center gap-4 flex-wrap bg-orange-900/20 border border-orange-500/30 rounded p-3">
            <div className="text-orange-400 text-sm font-semibold">Deploy:</div>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={deploymentNodeTypes.has('event')}
                onChange={(e) => {
                  const newTypes = new Set(deploymentNodeTypes);
                  if (e.target.checked) {
                    newTypes.add('event');
                  } else {
                    newTypes.delete('event');
                  }
                  setDeploymentNodeTypes(newTypes);
                }}
                className="w-4 h-4 accent-orange-500"
              />
              Event Nodes
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-not-allowed">
              <input
                type="checkbox"
                checked={deploymentNodeTypes.has('normal')}
                disabled
                className="w-4 h-4 accent-orange-500 opacity-50"
              />
              Normal Mek Nodes <span className="text-xs text-gray-500">(Coming Soon)</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-not-allowed">
              <input
                type="checkbox"
                checked={deploymentNodeTypes.has('mini_boss')}
                disabled
                className="w-4 h-4 accent-orange-500 opacity-50"
              />
              Mini Boss Nodes <span className="text-xs text-gray-500">(Coming Soon)</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-not-allowed">
              <input
                type="checkbox"
                checked={deploymentNodeTypes.has('challenger')}
                disabled
                className="w-4 h-4 accent-orange-500 opacity-50"
              />
              Challenger Nodes <span className="text-xs text-gray-500">(Coming Soon)</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-not-allowed">
              <input
                type="checkbox"
                checked={deploymentNodeTypes.has('final_boss')}
                disabled
                className="w-4 h-4 accent-orange-500 opacity-50"
              />
              Final Boss Nodes <span className="text-xs text-gray-500">(Coming Soon)</span>
            </label>
            <button
              onClick={handleDeployment}
              className="ml-auto px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm transition-colors font-semibold"
            >
              🚀 Deploy to Story Climb
            </button>
          </div>
        </div>

        {/* Load Lightbox */}
        {showLoadLightbox && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" style={{ position: 'fixed', top: 0, left: 0 }} onClick={() => setShowLoadLightbox(false)}>
            <div className="bg-gray-900 border border-purple-500/50 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-purple-400 mb-4">Load Configuration</h3>

              {savedConfigs && savedConfigs.length > 0 ? (
                <div className="space-y-2">
                  {savedConfigs.map((config) => (
                    <div
                      key={config._id}
                      className="flex items-center justify-between bg-black/50 border border-purple-500/20 rounded p-3 hover:bg-purple-500/10 transition-colors"
                    >
                      <div>
                        <div className="text-sm text-purple-300 font-semibold">{config.name}</div>
                        <div className="text-xs text-gray-400">
                          Saved: {new Date(config.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadConfig(config._id, config.name)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Delete "${config.name}"?`)) {
                              await deleteConfiguration({ configId: config._id });
                            }
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">No saved configurations</div>
              )}

              <button
                onClick={() => setShowLoadLightbox(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Event Names Section */}
        <div className="mb-4 bg-black/30 rounded p-3">
          <h5 className="text-purple-400 text-sm font-bold mb-3">Event Names for Chapter {selectedChapter}</h5>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredEvents.map((event: any, idx: number) => (
              <div key={event.eventNumber} className="bg-black/50 border border-purple-500/20 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-400 font-bold text-sm">E{event.eventNumber}:</span>
                  <input
                    type="text"
                    value={event.name}
                    onChange={(e) => {
                      const newEvents = [...eventsData];
                      const eventIndex = eventsData.findIndex((ev: any) => ev.eventNumber === event.eventNumber);
                      newEvents[eventIndex].name = e.target.value;
                      setEventsData(newEvents);
                    }}
                    placeholder="Parent name (e.g., Rust Protocol)"
                    className="flex-1 px-2 py-1 bg-black/50 border border-purple-400/30 rounded text-sm text-purple-300"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 ml-6">
                  <div>
                    <label className="text-[10px] text-green-400 uppercase">Easy</label>
                    <input
                      type="text"
                      value={event.difficultyNames?.easy || ''}
                      onChange={(e) => {
                        const newEvents = [...eventsData];
                        const eventIndex = eventsData.findIndex((ev: any) => ev.eventNumber === event.eventNumber);
                        if (!newEvents[eventIndex].difficultyNames) {
                          newEvents[eventIndex].difficultyNames = { easy: '', medium: '', hard: '' };
                        }
                        newEvents[eventIndex].difficultyNames!.easy = e.target.value;
                        setEventsData(newEvents);
                      }}
                      placeholder="e.g., Gooseneck"
                      className="w-full px-2 py-1 bg-black/50 border border-green-400/30 rounded text-xs text-green-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-yellow-400 uppercase">Medium</label>
                    <input
                      type="text"
                      value={event.difficultyNames?.medium || ''}
                      onChange={(e) => {
                        const newEvents = [...eventsData];
                        const eventIndex = eventsData.findIndex((ev: any) => ev.eventNumber === event.eventNumber);
                        if (!newEvents[eventIndex].difficultyNames) {
                          newEvents[eventIndex].difficultyNames = { easy: '', medium: '', hard: '' };
                        }
                        newEvents[eventIndex].difficultyNames!.medium = e.target.value;
                        setEventsData(newEvents);
                      }}
                      placeholder="e.g., Charm"
                      className="w-full px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-xs text-yellow-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-red-400 uppercase">Hard</label>
                    <input
                      type="text"
                      value={event.difficultyNames?.hard || ''}
                      onChange={(e) => {
                        const newEvents = [...eventsData];
                        const eventIndex = eventsData.findIndex((ev: any) => ev.eventNumber === event.eventNumber);
                        if (!newEvents[eventIndex].difficultyNames) {
                          newEvents[eventIndex].difficultyNames = { easy: '', medium: '', hard: '' };
                        }
                        newEvents[eventIndex].difficultyNames!.hard = e.target.value;
                        setEventsData(newEvents);
                      }}
                      placeholder="e.g., Government"
                      className="w-full px-2 py-1 bg-black/50 border border-red-400/30 rounded text-xs text-red-300"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chapter Reward Range Controls */}
        <div className="mb-4 bg-black/30 rounded p-3">
          <h5 className="text-purple-400 text-sm font-bold mb-3">Chapter {selectedChapter} Reward Ranges (Events {(selectedChapter - 1) * 20 + 1}-{selectedChapter * 20})</h5>

          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Easy Rewards */}
            <div className="bg-black/30 p-2 rounded border border-green-500/20">
              <label className="text-green-400 text-xs font-semibold block mb-2">Easy Rewards</label>
              <div className="space-y-2">
                <div>
                  <label className="text-yellow-400 text-[10px]">Gold Range</label>
                  <div className="flex gap-1 items-center">
                    <input
                      type="number"
                      value={globalRanges.easy.minGold}
                      onChange={(e) => setGlobalRanges({...globalRanges, easy: {...globalRanges.easy, minGold: Number(e.target.value)}})}
                      className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400"
                      placeholder="Min"
                    />
                    <span className="text-gray-500 text-[9px]">to</span>
                    <input
                      type="number"
                      value={globalRanges.easy.maxGold}
                      onChange={(e) => setGlobalRanges({...globalRanges, easy: {...globalRanges.easy, maxGold: Number(e.target.value)}})}
                      className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400"
                      placeholder="Max"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-blue-400 text-[10px]">XP Range</label>
                  <div className="flex gap-1 items-center">
                    <input
                      type="number"
                      value={globalRanges.easy.minXP}
                      onChange={(e) => setGlobalRanges({...globalRanges, easy: {...globalRanges.easy, minXP: Number(e.target.value)}})}
                      className="w-full px-1 py-1 bg-black/50 border border-blue-400/30 rounded text-[10px] text-blue-400"
                      placeholder="Min"
                    />
                    <span className="text-gray-500 text-[9px]">to</span>
                    <input
                      type="number"
                      value={globalRanges.easy.maxXP}
                      onChange={(e) => setGlobalRanges({...globalRanges, easy: {...globalRanges.easy, maxXP: Number(e.target.value)}})}
                      className="w-full px-1 py-1 bg-black/50 border border-blue-400/30 rounded text-[10px] text-blue-400"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Medium Rewards */}
            <div className="bg-black/30 p-2 rounded border border-yellow-500/20">
              <label className="text-yellow-400 text-xs font-semibold block mb-2">Medium Rewards</label>
              <div className="space-y-2">
                <div>
                  <label className="text-yellow-400 text-[10px]">Gold Range</label>
                  <div className="flex gap-1 items-center">
                    <input
                      type="number"
                      value={globalRanges.medium.minGold}
                      onChange={(e) => setGlobalRanges({...globalRanges, medium: {...globalRanges.medium, minGold: Number(e.target.value)}})}
                      className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400"
                      placeholder="Min"
                    />
                    <span className="text-gray-500 text-[9px]">to</span>
                    <input
                      type="number"
                      value={globalRanges.medium.maxGold}
                      onChange={(e) => setGlobalRanges({...globalRanges, medium: {...globalRanges.medium, maxGold: Number(e.target.value)}})}
                      className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400"
                      placeholder="Max"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-blue-400 text-[10px]">XP Range</label>
                  <div className="flex gap-1 items-center">
                    <input
                      type="number"
                      value={globalRanges.medium.minXP}
                      onChange={(e) => setGlobalRanges({...globalRanges, medium: {...globalRanges.medium, minXP: Number(e.target.value)}})}
                      className="w-full px-1 py-1 bg-black/50 border border-blue-400/30 rounded text-[10px] text-blue-400"
                      placeholder="Min"
                    />
                    <span className="text-gray-500 text-[9px]">to</span>
                    <input
                      type="number"
                      value={globalRanges.medium.maxXP}
                      onChange={(e) => setGlobalRanges({...globalRanges, medium: {...globalRanges.medium, maxXP: Number(e.target.value)}})}
                      className="w-full px-1 py-1 bg-black/50 border border-blue-400/30 rounded text-[10px] text-blue-400"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hard Rewards */}
            <div className="bg-black/30 p-2 rounded border border-red-500/20">
              <label className="text-red-400 text-xs font-semibold block mb-2">Hard Rewards</label>
              <div className="space-y-2">
                <div>
                  <label className="text-yellow-400 text-[10px]">Gold Range</label>
                  <div className="flex gap-1 items-center">
                    <input
                      type="number"
                      value={globalRanges.hard.minGold}
                      onChange={(e) => setGlobalRanges({...globalRanges, hard: {...globalRanges.hard, minGold: Number(e.target.value)}})}
                      className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400"
                      placeholder="Min"
                    />
                    <span className="text-gray-500 text-[9px]">to</span>
                    <input
                      type="number"
                      value={globalRanges.hard.maxGold}
                      onChange={(e) => setGlobalRanges({...globalRanges, hard: {...globalRanges.hard, maxGold: Number(e.target.value)}})}
                      className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400"
                      placeholder="Max"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-blue-400 text-[10px]">XP Range</label>
                  <div className="flex gap-1 items-center">
                    <input
                      type="number"
                      value={globalRanges.hard.minXP}
                      onChange={(e) => setGlobalRanges({...globalRanges, hard: {...globalRanges.hard, minXP: Number(e.target.value)}})}
                      className="w-full px-1 py-1 bg-black/50 border border-blue-400/30 rounded text-[10px] text-blue-400"
                      placeholder="Min"
                    />
                    <span className="text-gray-500 text-[9px]">to</span>
                    <input
                      type="number"
                      value={globalRanges.hard.maxXP}
                      onChange={(e) => setGlobalRanges({...globalRanges, hard: {...globalRanges.hard, maxXP: Number(e.target.value)}})}
                      className="w-full px-1 py-1 bg-black/50 border border-blue-400/30 rounded text-[10px] text-blue-400"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="text-purple-400 text-xs">Reward Rounding (gold & XP for all difficulties)</label>
            <select
              value={globalRanges.rewardRounding}
              onChange={(e) => setGlobalRanges({...globalRanges, rewardRounding: e.target.value as any})}
              className="w-full px-2 py-1 bg-black/50 border border-purple-400/30 rounded text-xs text-purple-400"
            >
              <option value="none">No Rounding</option>
              <option value="10">Round to 10</option>
              <option value="100">Round to 100</option>
              <option value="1000">Round to 1000</option>
            </select>
          </div>

          <button
            onClick={() => setGlobalRanges({...globalRanges, showVisualization: !globalRanges.showVisualization})}
            className="w-full px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-400 rounded text-xs transition-colors mb-3"
          >
            {globalRanges.showVisualization ? 'Hide' : 'Show'} Visualization
          </button>

          {globalRanges.showVisualization && (
            <div className="bg-black/30 border border-purple-500/20 rounded p-3">
              <div className="text-xs text-purple-400 font-semibold mb-2">Reward Distribution Preview</div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {(() => {
                  const chapterStartEvent = (selectedChapter - 1) * 20 + 1;
                  const chapterEndEvent = selectedChapter * 20;
                  const eventsToShow = Array.from(
                    { length: chapterEndEvent - chapterStartEvent + 1 },
                    (_, i) => chapterStartEvent + i
                  );

                  return eventsToShow.map((eventNum: any) => {
                    const gold = calculateChapterGold(eventNum);
                    const xp = calculateChapterXP(eventNum);
                    const goldPercentage = ((gold - globalRanges.minGold) / (globalRanges.maxGold - globalRanges.minGold)) * 100;
                    const xpPercentage = ((xp - globalRanges.minXP) / (globalRanges.maxXP - globalRanges.minXP)) * 100;

                    return (
                      <div key={eventNum} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-12 text-right">E{eventNum}:</span>
                          <div className="flex-1 bg-black/50 rounded-full h-3 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-300"
                              style={{ width: `${goldPercentage}%` }}
                            />
                          </div>
                          <span className="text-yellow-400 text-xs w-24 text-right">{gold.toLocaleString()}g</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-transparent w-12"></span>
                          <div className="flex-1 bg-black/50 rounded-full h-3 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                              style={{ width: `${xpPercentage}%` }}
                            />
                          </div>
                          <span className="text-blue-400 text-xs w-24 text-right">{xp.toLocaleString()} XP</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="mt-3 pt-3 border-t border-purple-500/20">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Chapter {selectedChapter} Avg Gold:</span>
                    <div className="text-yellow-400 font-semibold">
                      {(() => {
                        const chapterStartEvent = (selectedChapter - 1) * 20 + 1;
                        const chapterEndEvent = selectedChapter * 20;
                        const events = Array.from(
                          { length: chapterEndEvent - chapterStartEvent + 1 },
                          (_, i) => chapterStartEvent + i
                        );
                        const avg = Math.round(
                          events.map(calculateChapterGold).reduce((a: any, b: any) => a+b, 0) / events.length
                        );
                        return avg.toLocaleString();
                      })()}g
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Chapter {selectedChapter} Avg XP:</span>
                    <div className="text-blue-400 font-semibold">
                      {(() => {
                        const chapterStartEvent = (selectedChapter - 1) * 20 + 1;
                        const chapterEndEvent = selectedChapter * 20;
                        const events = Array.from(
                          { length: chapterEndEvent - chapterStartEvent + 1 },
                          (_, i) => chapterStartEvent + i
                        );
                        const avg = Math.round(
                          events.map(calculateChapterXP).reduce((a: any, b: any) => a+b, 0) / events.length
                        );
                        return avg.toLocaleString();
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Deployment Fee Configuration */}
        <div className="mb-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded p-3">
          <h5 className="text-green-400 text-sm font-bold mb-2 flex items-center gap-2">
            <span>💰</span> Deployment Fee Requirements
          </h5>
          <div className="text-xs text-gray-400 mb-3">
            Configure gold deployment fees for Chapter {selectedChapter} (Events {(selectedChapter - 1) * 20 + 1}-{selectedChapter * 20})
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Easy Fees */}
            <div className="bg-black/30 p-2 rounded border border-green-500/20">
              <label className="text-green-400 text-xs font-semibold block mb-2">Easy Fees</label>
              <div className="space-y-2">
                <div>
                  <label className="text-gray-500 text-[10px]">Min (Event 1)</label>
                  <input
                    type="number"
                    value={deploymentFeeConfig.easy.minFee}
                    onChange={(e) => setDeploymentFeeConfig({...deploymentFeeConfig, easy: {...deploymentFeeConfig.easy, minFee: Number(e.target.value)}})}
                    className="w-full px-2 py-1 bg-black/50 border border-green-400/30 rounded text-xs text-green-400"
                    placeholder="Min"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px]">Max (Event 20)</label>
                  <input
                    type="number"
                    value={deploymentFeeConfig.easy.maxFee}
                    onChange={(e) => setDeploymentFeeConfig({...deploymentFeeConfig, easy: {...deploymentFeeConfig.easy, maxFee: Number(e.target.value)}})}
                    className="w-full px-2 py-1 bg-black/50 border border-green-400/30 rounded text-xs text-green-400"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

            {/* Medium Fees */}
            <div className="bg-black/30 p-2 rounded border border-yellow-500/20">
              <label className="text-yellow-400 text-xs font-semibold block mb-2">Medium Fees</label>
              <div className="space-y-2">
                <div>
                  <label className="text-gray-500 text-[10px]">Min (Event 1)</label>
                  <input
                    type="number"
                    value={deploymentFeeConfig.medium.minFee}
                    onChange={(e) => setDeploymentFeeConfig({...deploymentFeeConfig, medium: {...deploymentFeeConfig.medium, minFee: Number(e.target.value)}})}
                    className="w-full px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-xs text-yellow-400"
                    placeholder="Min"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px]">Max (Event 20)</label>
                  <input
                    type="number"
                    value={deploymentFeeConfig.medium.maxFee}
                    onChange={(e) => setDeploymentFeeConfig({...deploymentFeeConfig, medium: {...deploymentFeeConfig.medium, maxFee: Number(e.target.value)}})}
                    className="w-full px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-xs text-yellow-400"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

            {/* Hard Fees */}
            <div className="bg-black/30 p-2 rounded border border-red-500/20">
              <label className="text-red-400 text-xs font-semibold block mb-2">Hard Fees</label>
              <div className="space-y-2">
                <div>
                  <label className="text-gray-500 text-[10px]">Min (Event 1)</label>
                  <input
                    type="number"
                    value={deploymentFeeConfig.hard.minFee}
                    onChange={(e) => setDeploymentFeeConfig({...deploymentFeeConfig, hard: {...deploymentFeeConfig.hard, minFee: Number(e.target.value)}})}
                    className="w-full px-2 py-1 bg-black/50 border border-red-400/30 rounded text-xs text-red-400"
                    placeholder="Min"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px]">Max (Event 20)</label>
                  <input
                    type="number"
                    value={deploymentFeeConfig.hard.maxFee}
                    onChange={(e) => setDeploymentFeeConfig({...deploymentFeeConfig, hard: {...deploymentFeeConfig.hard, maxFee: Number(e.target.value)}})}
                    className="w-full px-2 py-1 bg-black/50 border border-red-400/30 rounded text-xs text-red-400"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-green-400 text-xs">Interpolation Type</label>
              <select
                value={deploymentFeeConfig.interpolationType}
                onChange={(e) => setDeploymentFeeConfig({...deploymentFeeConfig, interpolationType: e.target.value as any})}
                className="w-full px-2 py-1 bg-black/50 border border-green-400/30 rounded text-xs text-green-400"
              >
                <option value="linear">Linear</option>
                <option value="exponential">Exponential</option>
                <option value="logarithmic">Logarithmic</option>
              </select>
            </div>
            <div>
              <label className="text-green-400 text-xs">Fee Rounding (all difficulties)</label>
              <select
                value={deploymentFeeConfig.feeRounding}
                onChange={(e) => setDeploymentFeeConfig({...deploymentFeeConfig, feeRounding: e.target.value as any})}
                className="w-full px-2 py-1 bg-black/50 border border-green-400/30 rounded text-xs text-green-400"
              >
                <option value="none">No Rounding</option>
                <option value="10">Round to 10</option>
                <option value="100">Round to 100</option>
                <option value="1000">Round to 1000</option>
              </select>
            </div>
          </div>

          {deploymentFeeConfig.interpolationType === 'exponential' && (
            <div className="mb-3">
              <label className="text-green-400 text-xs">Curve Strength</label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={deploymentFeeConfig.curveStrength}
                onChange={(e) => setDeploymentFeeConfig({...deploymentFeeConfig, curveStrength: Number(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Gentle (0.5)</span>
                <span className="text-green-400">{deploymentFeeConfig.curveStrength.toFixed(1)}</span>
                <span>Steep (3.0)</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setDeploymentFeeConfig({...deploymentFeeConfig, showVisualization: !deploymentFeeConfig.showVisualization})}
            className="w-full px-3 py-1 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-400 rounded text-xs transition-colors mb-3"
          >
            {deploymentFeeConfig.showVisualization ? 'Hide' : 'Show'} Visualization
          </button>

          {deploymentFeeConfig.showVisualization && (
            <div className="bg-black/30 border border-green-500/20 rounded p-3">
              <div className="text-xs text-green-400 font-semibold mb-2">Fee Distribution Preview</div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {(() => {
                  const chapterStartEvent = (selectedChapter - 1) * 20 + 1;
                  const chapterEndEvent = selectedChapter * 20;
                  const eventsToShow = Array.from(
                    { length: chapterEndEvent - chapterStartEvent + 1 },
                    (_, i) => chapterStartEvent + i
                  );

                  return eventsToShow.map((eventNum: any) => {
                    const fee = calculateDeploymentFee(eventNum);
                    const percentage = ((fee - deploymentFeeConfig.minFee) / (deploymentFeeConfig.maxFee - deploymentFeeConfig.minFee)) * 100;

                    return (
                      <div key={eventNum} className="flex items-center gap-2">
                        <span className="text-gray-500 w-12 text-right">E{eventNum}:</span>
                        <div className="flex-1 bg-black/50 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-green-400 text-xs w-20 text-right">{fee.toLocaleString()}g</span>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="mt-3 pt-3 border-t border-green-500/20">
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Chapter {selectedChapter} Avg:</span>
                    <div className="text-green-400 font-semibold">
                      {(() => {
                        const chapterStartEvent = (selectedChapter - 1) * 20 + 1;
                        const chapterEndEvent = selectedChapter * 20;
                        const events = Array.from(
                          { length: chapterEndEvent - chapterStartEvent + 1 },
                          (_, i) => chapterStartEvent + i
                        );
                        const avg = Math.round(
                          events.map(calculateDeploymentFee).reduce((a: any, b: any) => a+b, 0) / events.length
                        );
                        return avg.toLocaleString();
                      })()}g
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Event Duration Configuration */}
        <div className="mb-4 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded p-3">
          <h5 className="text-blue-400 text-sm font-bold mb-2 flex items-center gap-2">
            <span>⏱️</span> Event Duration Configuration
          </h5>
          <div className="text-xs text-gray-400 mb-3">
            Configure mission durations for Chapter {selectedChapter} (Events {(selectedChapter - 1) * 20 + 1}-{selectedChapter * 20}). Set min/max times per difficulty, then interpolate.
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Easy Duration */}
            <div className="bg-black/30 p-2 rounded border border-green-500/20">
              <label className="text-green-400 text-xs font-semibold block mb-2">Easy Duration</label>
              <div className="space-y-2">
                <div>
                  <label className="text-gray-500 text-[10px]">Min (Event 1)</label>
                  <input
                    type="number"
                    value={durationConfig.easy.min}
                    onChange={(e) => setDurationConfig({...durationConfig, easy: {...durationConfig.easy, min: Number(e.target.value)}})}
                    className="w-full px-2 py-1 bg-black/50 border border-green-400/30 rounded text-xs text-green-400"
                    placeholder="Seconds"
                  />
                  <div className="text-[9px] text-gray-500">{formatDuration(durationConfig.easy.min)}</div>
                </div>
                <div>
                  <label className="text-gray-500 text-[10px]">Max (Event 20)</label>
                  <input
                    type="number"
                    value={durationConfig.easy.max}
                    onChange={(e) => setDurationConfig({...durationConfig, easy: {...durationConfig.easy, max: Number(e.target.value)}})}
                    className="w-full px-2 py-1 bg-black/50 border border-green-400/30 rounded text-xs text-green-400"
                    placeholder="Seconds"
                  />
                  <div className="text-[9px] text-gray-500">{formatDuration(durationConfig.easy.max)}</div>
                </div>
              </div>
            </div>

            {/* Medium Duration */}
            <div className="bg-black/30 p-2 rounded border border-yellow-500/20">
              <label className="text-yellow-400 text-xs font-semibold block mb-2">Medium Duration</label>
              <div className="space-y-2">
                <div>
                  <label className="text-gray-500 text-[10px]">Min (Event 1)</label>
                  <input
                    type="number"
                    value={durationConfig.medium.min}
                    onChange={(e) => setDurationConfig({...durationConfig, medium: {...durationConfig.medium, min: Number(e.target.value)}})}
                    className="w-full px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-xs text-yellow-400"
                    placeholder="Seconds"
                  />
                  <div className="text-[9px] text-gray-500">{formatDuration(durationConfig.medium.min)}</div>
                </div>
                <div>
                  <label className="text-gray-500 text-[10px]">Max (Event 20)</label>
                  <input
                    type="number"
                    value={durationConfig.medium.max}
                    onChange={(e) => setDurationConfig({...durationConfig, medium: {...durationConfig.medium, max: Number(e.target.value)}})}
                    className="w-full px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-xs text-yellow-400"
                    placeholder="Seconds"
                  />
                  <div className="text-[9px] text-gray-500">{formatDuration(durationConfig.medium.max)}</div>
                </div>
              </div>
            </div>

            {/* Hard Duration */}
            <div className="bg-black/30 p-2 rounded border border-red-500/20">
              <label className="text-red-400 text-xs font-semibold block mb-2">Hard Duration</label>
              <div className="space-y-2">
                <div>
                  <label className="text-gray-500 text-[10px]">Min (Event 1)</label>
                  <input
                    type="number"
                    value={durationConfig.hard.min}
                    onChange={(e) => setDurationConfig({...durationConfig, hard: {...durationConfig.hard, min: Number(e.target.value)}})}
                    className="w-full px-2 py-1 bg-black/50 border border-red-400/30 rounded text-xs text-red-400"
                    placeholder="Seconds"
                  />
                  <div className="text-[9px] text-gray-500">{formatDuration(durationConfig.hard.min)}</div>
                </div>
                <div>
                  <label className="text-gray-500 text-[10px]">Max (Event 20)</label>
                  <input
                    type="number"
                    value={durationConfig.hard.max}
                    onChange={(e) => setDurationConfig({...durationConfig, hard: {...durationConfig.hard, max: Number(e.target.value)}})}
                    className="w-full px-2 py-1 bg-black/50 border border-red-400/30 rounded text-xs text-red-400"
                    placeholder="Seconds"
                  />
                  <div className="text-[9px] text-gray-500">{formatDuration(durationConfig.hard.max)}</div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setDurationConfig({...durationConfig, showVisualization: !durationConfig.showVisualization})}
            className="w-full px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-400 rounded text-xs transition-colors mb-3"
          >
            {durationConfig.showVisualization ? 'Hide' : 'Show'} Visualization
          </button>

          {durationConfig.showVisualization && (
            <div className="bg-black/30 border border-blue-500/20 rounded p-3">
              <div className="text-xs text-blue-400 font-semibold mb-2">Duration Distribution Preview</div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(() => {
                  const chapterStartEvent = (selectedChapter - 1) * 20 + 1;
                  const chapterEndEvent = selectedChapter * 20;
                  const eventsToShow = Array.from(
                    { length: chapterEndEvent - chapterStartEvent + 1 },
                    (_, i) => chapterStartEvent + i
                  );

                  return eventsToShow.map((eventNum: any) => {
                    const easyDur = calculateDuration(eventNum, 'easy');
                    const mediumDur = calculateDuration(eventNum, 'medium');
                    const hardDur = calculateDuration(eventNum, 'hard');

                    return (
                      <div key={eventNum} className="bg-black/20 p-2 rounded border border-blue-500/10">
                        <div className="text-gray-400 text-[10px] font-bold mb-1">Event {eventNum}</div>
                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                          <div className="text-green-400">
                            <span className="text-gray-500">E:</span> {formatDuration(easyDur)}
                          </div>
                          <div className="text-yellow-400">
                            <span className="text-gray-500">M:</span> {formatDuration(mediumDur)}
                          </div>
                          <div className="text-red-400">
                            <span className="text-gray-500">H:</span> {formatDuration(hardDur)}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="mt-3 pt-3 border-t border-blue-500/20">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Easy Avg:</span>
                    <div className="text-green-400 font-semibold">
                      {(() => {
                        const chapterStartEvent = (selectedChapter - 1) * 20 + 1;
                        const chapterEndEvent = selectedChapter * 20;
                        const events = Array.from(
                          { length: chapterEndEvent - chapterStartEvent + 1 },
                          (_, i) => chapterStartEvent + i
                        );
                        const avg = Math.round(
                          events.map((e: any) => calculateDuration(e, 'easy')).reduce((a: any, b: any) => a+b, 0) / events.length
                        );
                        return formatDuration(avg);
                      })()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Medium Avg:</span>
                    <div className="text-yellow-400 font-semibold">
                      {(() => {
                        const chapterStartEvent = (selectedChapter - 1) * 20 + 1;
                        const chapterEndEvent = selectedChapter * 20;
                        const events = Array.from(
                          { length: chapterEndEvent - chapterStartEvent + 1 },
                          (_, i) => chapterStartEvent + i
                        );
                        const avg = Math.round(
                          events.map((e: any) => calculateDuration(e, 'medium')).reduce((a: any, b: any) => a+b, 0) / events.length
                        );
                        return formatDuration(avg);
                      })()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Hard Avg:</span>
                    <div className="text-red-400 font-semibold">
                      {(() => {
                        const chapterStartEvent = (selectedChapter - 1) * 20 + 1;
                        const chapterEndEvent = selectedChapter * 20;
                        const events = Array.from(
                          { length: chapterEndEvent - chapterStartEvent + 1 },
                          (_, i) => chapterStartEvent + i
                        );
                        const avg = Math.round(
                          events.map((e: any) => calculateDuration(e, 'hard')).reduce((a: any, b: any) => a+b, 0) / events.length
                        );
                        return formatDuration(avg);
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Deployment Requirements Configuration */}
        <div className="mb-4 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded p-3">
          <h5 className="text-amber-400 text-sm font-bold mb-2 flex items-center gap-2">
            <span>📦</span> Deployment Requirements - Chapter {selectedChapter}
          </h5>
          <div className="text-xs text-gray-400 mb-3">
            Configure essence, chip, and special requirements for each event in this chapter.
          </div>

          {/* Event Selector Buttons */}
          <div className="mb-3 bg-black/30 border border-amber-500/20 rounded p-2">
            <div className="text-amber-300 text-[10px] font-semibold mb-2">Select Event:</div>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 20 }, (_, i) => {
                const eventNum = (selectedChapter - 1) * 20 + i + 1;
                const eventInChapter = i + 1;
                return (
                  <button
                    key={eventNum}
                    onClick={() => setSelectedDeploymentEvent(eventInChapter)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                      selectedDeploymentEvent === eventInChapter
                        ? 'bg-amber-500 text-black'
                        : 'bg-black/50 text-amber-400/60 hover:text-amber-400 hover:bg-black/70 border border-amber-500/20'
                    }`}
                  >
                    {eventInChapter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Event Configuration */}
          <div className="bg-black/30 border border-amber-500/20 rounded p-3">
            <div className="text-amber-300 text-xs font-bold mb-3">
              Event {selectedDeploymentEvent} Requirements
            </div>

            {/* Essence Requirements */}
            <div className="mb-3">
              <div className="text-amber-200 text-xs font-semibold mb-2">Essence Requirements</div>
              <div className="grid grid-cols-3 gap-2">
                {/* Easy */}
                <div className="bg-black/40 rounded p-2 border border-green-500/20">
                  <div className="text-green-400 text-[10px] font-bold mb-2">Easy</div>
                  <select className="w-full px-2 py-1 bg-black/50 border border-green-500/30 rounded text-[10px] text-gray-300 mb-2">
                    <option value="">Select Type...</option>
                    {ESSENCE_TYPES.map((type: any) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="text-[10px] text-gray-500 mb-1">Amount:</div>
                  <div className="flex gap-1">
                    <div className="flex-1 flex items-center bg-black/50 border border-green-500/30 rounded">
                      <button className="px-2 py-1 hover:bg-green-500/20 text-green-400 font-bold">-</button>
                      <input type="text" value="0" readOnly className="w-8 text-center bg-transparent text-green-400 text-[10px]" />
                      <button className="px-2 py-1 hover:bg-green-500/20 text-green-400 font-bold">+</button>
                    </div>
                    <div className="flex items-center bg-black/50 border border-green-500/30 rounded">
                      <button className="px-2 py-1 hover:bg-green-500/20 text-green-400">-</button>
                      <input type="text" value="0" readOnly className="w-6 text-center bg-transparent text-green-400 text-[10px]" />
                      <button className="px-2 py-1 hover:bg-green-500/20 text-green-400">+</button>
                    </div>
                  </div>
                </div>

                {/* Medium */}
                <div className="bg-black/40 rounded p-2 border border-yellow-500/20">
                  <div className="text-yellow-400 text-[10px] font-bold mb-2">Medium</div>
                  <select className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-[10px] text-gray-300 mb-2">
                    <option value="">Select Type...</option>
                    {ESSENCE_TYPES.map((type: any) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="text-[10px] text-gray-500 mb-1">Amount:</div>
                  <div className="flex gap-1">
                    <div className="flex-1 flex items-center bg-black/50 border border-yellow-500/30 rounded">
                      <button className="px-2 py-1 hover:bg-yellow-500/20 text-yellow-400 font-bold">-</button>
                      <input type="text" value="0" readOnly className="w-8 text-center bg-transparent text-yellow-400 text-[10px]" />
                      <button className="px-2 py-1 hover:bg-yellow-500/20 text-yellow-400 font-bold">+</button>
                    </div>
                    <div className="flex items-center bg-black/50 border border-yellow-500/30 rounded">
                      <button className="px-2 py-1 hover:bg-yellow-500/20 text-yellow-400">-</button>
                      <input type="text" value="0" readOnly className="w-6 text-center bg-transparent text-yellow-400 text-[10px]" />
                      <button className="px-2 py-1 hover:bg-yellow-500/20 text-yellow-400">+</button>
                    </div>
                  </div>
                </div>

                {/* Hard */}
                <div className="bg-black/40 rounded p-2 border border-red-500/20">
                  <div className="text-red-400 text-[10px] font-bold mb-2">Hard</div>
                  <select className="w-full px-2 py-1 bg-black/50 border border-red-500/30 rounded text-[10px] text-gray-300 mb-2">
                    <option value="">Select Type...</option>
                    {ESSENCE_TYPES.map((type: any) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="text-[10px] text-gray-500 mb-1">Amount:</div>
                  <div className="flex gap-1">
                    <div className="flex-1 flex items-center bg-black/50 border border-red-500/30 rounded">
                      <button className="px-2 py-1 hover:bg-red-500/20 text-red-400 font-bold">-</button>
                      <input type="text" value="0" readOnly className="w-8 text-center bg-transparent text-red-400 text-[10px]" />
                      <button className="px-2 py-1 hover:bg-red-500/20 text-red-400 font-bold">+</button>
                    </div>
                    <div className="flex items-center bg-black/50 border border-red-500/30 rounded">
                      <button className="px-2 py-1 hover:bg-red-500/20 text-red-400">-</button>
                      <input type="text" value="0" readOnly className="w-6 text-center bg-transparent text-red-400 text-[10px]" />
                      <button className="px-2 py-1 hover:bg-red-500/20 text-red-400">+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chip Requirements */}
            <div className="mb-3">
              <div className="text-amber-200 text-xs font-semibold mb-2">Power Chip Requirements</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-black/40 rounded p-2 border border-green-500/20">
                  <div className="text-green-400 text-[10px] font-bold mb-1">Easy</div>
                  <select className="w-full px-2 py-1 bg-black/50 border border-green-500/30 rounded text-[10px] text-gray-300">
                    <option value="N/A">N/A</option>
                    {POWER_CHIP_TYPES.map((type: any) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-black/40 rounded p-2 border border-yellow-500/20">
                  <div className="text-yellow-400 text-[10px] font-bold mb-1">Medium</div>
                  <select className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-[10px] text-gray-300">
                    <option value="N/A">N/A</option>
                    {POWER_CHIP_TYPES.map((type: any) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-black/40 rounded p-2 border border-red-500/20">
                  <div className="text-red-400 text-[10px] font-bold mb-1">Hard</div>
                  <select className="w-full px-2 py-1 bg-black/50 border border-red-500/30 rounded text-[10px] text-gray-300">
                    <option value="N/A">N/A</option>
                    {POWER_CHIP_TYPES.map((type: any) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Special Requirements */}
            <div>
              <div className="text-amber-200 text-xs font-semibold mb-2">Special Requirements</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-black/40 rounded p-2 border border-green-500/20">
                  <div className="text-green-400 text-[10px] font-bold mb-1">Easy</div>
                  <input type="text" placeholder="N/A" className="w-full px-2 py-1 bg-black/50 border border-green-500/30 rounded text-[10px] text-gray-300" />
                </div>
                <div className="bg-black/40 rounded p-2 border border-yellow-500/20">
                  <div className="text-yellow-400 text-[10px] font-bold mb-1">Medium</div>
                  <input type="text" placeholder="N/A" className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-[10px] text-gray-300" />
                </div>
                <div className="bg-black/40 rounded p-2 border border-red-500/20">
                  <div className="text-red-400 text-[10px] font-bold mb-1">Hard</div>
                  <input type="text" placeholder="N/A" className="w-full px-2 py-1 bg-black/50 border border-red-500/30 rounded text-[10px] text-gray-300" />
                </div>
              </div>
            </div>

            <div className="mt-3 text-[10px] text-gray-500 bg-black/30 rounded p-2 border border-amber-500/10">
              <span className="text-amber-400">ℹ️</span> Left arrows adjust whole numbers (1, 2, 3...), right arrows adjust decimals (0.1, 0.2, 0.3...)
            </div>
          </div>
        </div>

        {/* Genesis Success Bonus Configuration */}
        <div className="mb-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded p-3">
          <h5 className="text-purple-400 text-sm font-bold mb-2 flex items-center gap-2">
            <span>💎</span> Genesis Token Success Bonuses
          </h5>

          <div className="text-xs text-gray-400 mb-3">
            All 5 Genesis tokens are automatically active on every event. Configure the success bonus % each Genesis provides for Chapter {selectedChapter}. Set min/max for each difficulty level - percentages interpolate from Event 1 to Event 20.
          </div>

          <div className="grid grid-cols-1 gap-3 mb-3">
            {/* Rainbow/Purple Genesis */}
            <div className="bg-black/30 p-2 rounded border-2" style={{borderColor: '#A855F7'}}>
              <label className="text-purple-400 text-xs font-semibold block mb-2 flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#A855F7'}}></div>
                Rainbow (Most Rare)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-green-400 text-[10px]">Easy</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.purple.easy.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, purple: {...genesisSuccessBonus.purple, easy: {...genesisSuccessBonus.purple.easy, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-purple-400/30 rounded text-[10px] text-purple-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.purple.easy.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, purple: {...genesisSuccessBonus.purple, easy: {...genesisSuccessBonus.purple.easy, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-purple-400/30 rounded text-[10px] text-purple-400" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-yellow-400 text-[10px]">Medium</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.purple.medium.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, purple: {...genesisSuccessBonus.purple, medium: {...genesisSuccessBonus.purple.medium, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-purple-400/30 rounded text-[10px] text-purple-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.purple.medium.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, purple: {...genesisSuccessBonus.purple, medium: {...genesisSuccessBonus.purple.medium, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-purple-400/30 rounded text-[10px] text-purple-400" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-red-400 text-[10px]">Hard</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.purple.hard.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, purple: {...genesisSuccessBonus.purple, hard: {...genesisSuccessBonus.purple.hard, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-purple-400/30 rounded text-[10px] text-purple-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.purple.hard.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, purple: {...genesisSuccessBonus.purple, hard: {...genesisSuccessBonus.purple.hard, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-purple-400/30 rounded text-[10px] text-purple-400" placeholder="Max" />
                  </div>
                </div>
              </div>
            </div>

            {/* Red Genesis */}
            <div className="bg-black/30 p-2 rounded border-2" style={{borderColor: '#EF4444'}}>
              <label className="text-red-400 text-xs font-semibold block mb-2 flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#EF4444'}}></div>
                Red Genesis
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-green-400 text-[10px]">Easy</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.red.easy.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, red: {...genesisSuccessBonus.red, easy: {...genesisSuccessBonus.red.easy, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-red-400/30 rounded text-[10px] text-red-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.red.easy.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, red: {...genesisSuccessBonus.red, easy: {...genesisSuccessBonus.red.easy, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-red-400/30 rounded text-[10px] text-red-400" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-yellow-400 text-[10px]">Medium</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.red.medium.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, red: {...genesisSuccessBonus.red, medium: {...genesisSuccessBonus.red.medium, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-red-400/30 rounded text-[10px] text-red-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.red.medium.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, red: {...genesisSuccessBonus.red, medium: {...genesisSuccessBonus.red.medium, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-red-400/30 rounded text-[10px] text-red-400" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-red-400 text-[10px]">Hard</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.red.hard.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, red: {...genesisSuccessBonus.red, hard: {...genesisSuccessBonus.red.hard, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-red-400/30 rounded text-[10px] text-red-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.red.hard.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, red: {...genesisSuccessBonus.red, hard: {...genesisSuccessBonus.red.hard, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-red-400/30 rounded text-[10px] text-red-400" placeholder="Max" />
                  </div>
                </div>
              </div>
            </div>

            {/* Yellow Genesis */}
            <div className="bg-black/30 p-2 rounded border-2" style={{borderColor: '#FBBF24'}}>
              <label className="text-yellow-400 text-xs font-semibold block mb-2 flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#FBBF24'}}></div>
                Yellow Genesis
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-green-400 text-[10px]">Easy</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.yellow.easy.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, yellow: {...genesisSuccessBonus.yellow, easy: {...genesisSuccessBonus.yellow.easy, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.yellow.easy.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, yellow: {...genesisSuccessBonus.yellow, easy: {...genesisSuccessBonus.yellow.easy, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-yellow-400 text-[10px]">Medium</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.yellow.medium.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, yellow: {...genesisSuccessBonus.yellow, medium: {...genesisSuccessBonus.yellow.medium, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.yellow.medium.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, yellow: {...genesisSuccessBonus.yellow, medium: {...genesisSuccessBonus.yellow.medium, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-red-400 text-[10px]">Hard</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.yellow.hard.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, yellow: {...genesisSuccessBonus.yellow, hard: {...genesisSuccessBonus.yellow.hard, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.yellow.hard.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, yellow: {...genesisSuccessBonus.yellow, hard: {...genesisSuccessBonus.yellow.hard, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400" placeholder="Max" />
                  </div>
                </div>
              </div>
            </div>

            {/* Green Genesis */}
            <div className="bg-black/30 p-2 rounded border-2" style={{borderColor: '#10B981'}}>
              <label className="text-green-400 text-xs font-semibold block mb-2 flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#10B981'}}></div>
                Green Genesis
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-green-400 text-[10px]">Easy</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.green.easy.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, green: {...genesisSuccessBonus.green, easy: {...genesisSuccessBonus.green.easy, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-green-400/30 rounded text-[10px] text-green-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.green.easy.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, green: {...genesisSuccessBonus.green, easy: {...genesisSuccessBonus.green.easy, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-green-400/30 rounded text-[10px] text-green-400" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-yellow-400 text-[10px]">Medium</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.green.medium.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, green: {...genesisSuccessBonus.green, medium: {...genesisSuccessBonus.green.medium, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-green-400/30 rounded text-[10px] text-green-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.green.medium.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, green: {...genesisSuccessBonus.green, medium: {...genesisSuccessBonus.green.medium, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-green-400/30 rounded text-[10px] text-green-400" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-red-400 text-[10px]">Hard</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.green.hard.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, green: {...genesisSuccessBonus.green, hard: {...genesisSuccessBonus.green.hard, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-green-400/30 rounded text-[10px] text-green-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.green.hard.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, green: {...genesisSuccessBonus.green, hard: {...genesisSuccessBonus.green.hard, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-green-400/30 rounded text-[10px] text-green-400" placeholder="Max" />
                  </div>
                </div>
              </div>
            </div>

            {/* Blue Genesis */}
            <div className="bg-black/30 p-2 rounded border-2" style={{borderColor: '#3B82F6'}}>
              <label className="text-blue-400 text-xs font-semibold block mb-2 flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#3B82F6'}}></div>
                Blue Genesis (Least Rare)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-green-400 text-[10px]">Easy</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.blue.easy.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, blue: {...genesisSuccessBonus.blue, easy: {...genesisSuccessBonus.blue.easy, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-blue-400/30 rounded text-[10px] text-blue-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.blue.easy.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, blue: {...genesisSuccessBonus.blue, easy: {...genesisSuccessBonus.blue.easy, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-blue-400/30 rounded text-[10px] text-blue-400" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-yellow-400 text-[10px]">Medium</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.blue.medium.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, blue: {...genesisSuccessBonus.blue, medium: {...genesisSuccessBonus.blue.medium, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-blue-400/30 rounded text-[10px] text-blue-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.blue.medium.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, blue: {...genesisSuccessBonus.blue, medium: {...genesisSuccessBonus.blue.medium, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-blue-400/30 rounded text-[10px] text-blue-400" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-red-400 text-[10px]">Hard</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.blue.hard.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, blue: {...genesisSuccessBonus.blue, hard: {...genesisSuccessBonus.blue.hard, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-blue-400/30 rounded text-[10px] text-blue-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.blue.hard.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, blue: {...genesisSuccessBonus.blue, hard: {...genesisSuccessBonus.blue.hard, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-blue-400/30 rounded text-[10px] text-blue-400" placeholder="Max" />
                  </div>
                </div>
              </div>
            </div>

            {/* Set Bonus (All 5) */}
            <div className="bg-black/30 p-2 rounded border-2 border-yellow-500/50">
              <label className="text-yellow-300 text-xs font-semibold block mb-2 flex items-center gap-1">
                <span>✨</span>
                Set Bonus (Owning All 5)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-green-400 text-[10px]">Easy</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.setBonus.easy.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, setBonus: {...genesisSuccessBonus.setBonus, easy: {...genesisSuccessBonus.setBonus.easy, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.setBonus.easy.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, setBonus: {...genesisSuccessBonus.setBonus, easy: {...genesisSuccessBonus.setBonus.easy, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-yellow-400 text-[10px]">Medium</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.setBonus.medium.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, setBonus: {...genesisSuccessBonus.setBonus, medium: {...genesisSuccessBonus.setBonus.medium, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.setBonus.medium.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, setBonus: {...genesisSuccessBonus.setBonus, medium: {...genesisSuccessBonus.setBonus.medium, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-red-400 text-[10px]">Hard</label>
                  <div className="flex gap-1">
                    <input type="number" value={genesisSuccessBonus.setBonus.hard.min} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, setBonus: {...genesisSuccessBonus.setBonus, hard: {...genesisSuccessBonus.setBonus.hard, min: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400" placeholder="Min" />
                    <input type="number" value={genesisSuccessBonus.setBonus.hard.max} onChange={(e) => { setGenesisSuccessBonus({...genesisSuccessBonus, setBonus: {...genesisSuccessBonus.setBonus, hard: {...genesisSuccessBonus.setBonus.hard, max: Number(e.target.value)}}}); setGenesisBuffsGenerated(false); }} className="w-full px-1 py-1 bg-black/50 border border-yellow-400/30 rounded text-[10px] text-yellow-400" placeholder="Max" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              generateGenesisBuffs();
              setGenesisBuffsGenerated(true);
            }}
            className={`w-full px-3 py-2 ${genesisBuffsGenerated ? 'bg-green-600 hover:bg-green-500 border-green-500/50' : 'bg-yellow-600 hover:bg-yellow-500 border-yellow-500/50'} text-white rounded text-sm transition-colors font-semibold mb-2`}
            title="Generate Genesis token buffs for all 200 events"
          >
            {genesisBuffsGenerated ? '✅' : '⚡'} Generate Genesis Buffs for All Events
          </button>

          <button
            onClick={() => setGenesisSuccessBonus({...genesisSuccessBonus, showVisualization: !genesisSuccessBonus.showVisualization})}
            className="w-full px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-400 rounded text-xs transition-colors mb-3"
          >
            {genesisSuccessBonus.showVisualization ? 'Hide' : 'Show'} Visualization
          </button>

          {genesisSuccessBonus.showVisualization && (
            <div className="bg-black/30 border border-purple-500/20 rounded p-3">
              <div className="text-xs text-purple-400 font-semibold mb-2">Genesis Success Bonus % by Event</div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(() => {
                  const chapterStartEvent = (selectedChapter - 1) * 20 + 1;
                  const chapterEndEvent = selectedChapter * 20;
                  const eventsToShow = Array.from(
                    { length: chapterEndEvent - chapterStartEvent + 1 },
                    (_, i) => chapterStartEvent + i
                  );

                  return eventsToShow.map((eventNum: any) => {
                    return (
                      <div key={eventNum} className="bg-black/20 p-2 rounded border border-purple-500/10">
                        <div className="text-purple-300 text-xs font-bold mb-2">Event {eventNum}</div>
                        {/* Easy Difficulty */}
                        <div className="mb-2">
                          <div className="text-green-400 text-[9px] font-semibold mb-1">Easy:</div>
                          <div className="grid grid-cols-6 gap-1 text-[9px]">
                            <div className="text-purple-400 text-center"><div className="font-bold">{calculateGenesisBonus(eventNum, 'easy', 'purple')}%</div></div>
                            <div className="text-red-400 text-center"><div className="font-bold">{calculateGenesisBonus(eventNum, 'easy', 'red')}%</div></div>
                            <div className="text-yellow-400 text-center"><div className="font-bold">{calculateGenesisBonus(eventNum, 'easy', 'yellow')}%</div></div>
                            <div className="text-green-400 text-center"><div className="font-bold">{calculateGenesisBonus(eventNum, 'easy', 'green')}%</div></div>
                            <div className="text-blue-400 text-center"><div className="font-bold">{calculateGenesisBonus(eventNum, 'easy', 'blue')}%</div></div>
                            <div className="text-yellow-300 text-center border-l border-yellow-500/30"><div className="font-bold">+{calculateGenesisBonus(eventNum, 'easy', 'setBonus')}%</div></div>
                          </div>
                        </div>
                        {/* Medium Difficulty */}
                        <div className="mb-2">
                          <div className="text-yellow-400 text-[9px] font-semibold mb-1">Medium:</div>
                          <div className="grid grid-cols-6 gap-1 text-[9px]">
                            <div className="text-purple-400 text-center"><div className="font-bold">{calculateGenesisBonus(eventNum, 'medium', 'purple')}%</div></div>
                            <div className="text-red-400 text-center"><div className="font-bold">{calculateGenesisBonus(eventNum, 'medium', 'red')}%</div></div>
                            <div className="text-yellow-400 text-center"><div className="font-bold">{calculateGenesisBonus(eventNum, 'medium', 'yellow')}%</div></div>
                            <div className="text-green-400 text-center"><div className="font-bold">{calculateGenesisBonus(eventNum, 'medium', 'green')}%</div></div>
                            <div className="text-blue-400 text-center"><div className="font-bold">{calculateGenesisBonus(eventNum, 'medium', 'blue')}%</div></div>
                            <div className="text-yellow-300 text-center border-l border-yellow-500/30"><div className="font-bold">+{calculateGenesisBonus(eventNum, 'medium', 'setBonus')}%</div></div>
                          </div>
                        </div>
                        {/* Hard Difficulty */}
                        <div>
                          <div className="text-red-400 text-[9px] font-semibold mb-1">Hard:</div>
                          <div className="grid grid-cols-6 gap-1 text-[9px]">
                            <div className="text-purple-400 text-center"><div className="font-bold">{calculateGenesisBonus(eventNum, 'hard', 'purple')}%</div></div>
                            <div className="text-red-400 text-center"><div className="font-bold">{calculateGenesisBonus(eventNum, 'hard', 'red')}%</div></div>
                            <div className="text-yellow-400 text-center"><div className="font-bold">{calculateGenesisBonus(eventNum, 'hard', 'yellow')}%</div></div>
                            <div className="text-green-400 text-center"><div className="font-bold">{calculateGenesisBonus(eventNum, 'hard', 'green')}%</div></div>
                            <div className="text-blue-400 text-center"><div className="font-bold">{calculateGenesisBonus(eventNum, 'hard', 'blue')}%</div></div>
                            <div className="text-yellow-300 text-center border-l border-yellow-500/30"><div className="font-bold">+{calculateGenesisBonus(eventNum, 'hard', 'setBonus')}%</div></div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="mt-3 pt-3 border-t border-purple-500/20">
                <div className="text-xs text-gray-400">
                  <div className="font-semibold mb-1">How Bonuses Stack:</div>
                  <ul className="list-disc list-inside space-y-1 text-[10px] text-gray-500">
                    <li>Each Genesis token a player owns provides its individual bonus</li>
                    <li>Owning all 5 tokens adds the "Set Bonus" on top of the individual bonuses</li>
                    <li>All bonuses interpolate linearly from Event 1 to Event 20</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Batch Image Assignment */}
        <div className="mb-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded p-3">
          <h5 className="text-purple-400 text-sm font-bold mb-2 flex items-center gap-2">
            <span>📁</span> Event Images Folder Path
          </h5>
          <div className="flex gap-2">
            <input
              type="text"
              value={eventImagesFolder}
              onChange={(e) => setEventImagesFolder(e.target.value)}
              placeholder="e.g., /event-nfts"
              className="flex-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded text-sm text-gray-300 font-mono"
              title="Web-relative path from public folder (e.g., /event-images)"
            />
            <button
              onClick={batchAssignImages}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded text-sm font-semibold transition-all"
            >
              Assign all 60 NFT arts
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            <span className="text-purple-300">ℹ️ Note:</span> Expects files named e1-E.png, e1-M.png, e1-H.png (E=Easy, M=Medium, H=Hard) for each event
          </div>
        </div>

        {/* Events for Selected Chapter */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          <div className="p-3 bg-black/30 rounded border border-purple-500/20">
            <div className="grid grid-cols-2 gap-2">
              {/* Reorder events to be column-by-column instead of row-by-row */}
              {[...Array(10)].map((_: any, rowIndex: number) => {
                const leftIndex = rowIndex;
                const rightIndex = rowIndex + 10;
                const leftEvent = filteredEvents[leftIndex];
                const rightEvent = filteredEvents[rightIndex];

                return (
                  <React.Fragment key={rowIndex}>
                            {/* Left column event */}
                            {leftEvent && (
                              <div className="bg-black/50 border border-purple-500/10 rounded p-2 flex gap-2">
                                {/* 3 Rectangular Thumbnails for Easy/Medium/Hard */}
                                <div className="flex flex-col gap-1 flex-shrink-0">
                                  {/* Easy */}
                                  <div className="relative group">
                                    <img
                                      src={leftEvent.images?.easy || `/event-nfts/E${leftEvent.eventNumber}-E.png`}
                                      alt={`Event ${leftEvent.eventNumber} Easy`}
                                      className="w-[50px] h-[32px] rounded object-cover border border-green-500/30 cursor-pointer hover:border-green-400 transition-all"
                                      onClick={() => setPreviewImage(leftEvent.eventNumber)}
                                      onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        img.style.display = 'none';
                                      }}
                                    />
                                    <div className="absolute -top-1 -left-1 bg-green-500 text-black text-[8px] font-bold px-1 rounded pointer-events-none">E</div>
                                  </div>
                                  {/* Medium */}
                                  <div className="relative group">
                                    <img
                                      src={leftEvent.images?.medium || `/event-nfts/E${leftEvent.eventNumber}-M.png`}
                                      alt={`Event ${leftEvent.eventNumber} Medium`}
                                      className="w-[50px] h-[32px] rounded object-cover border border-yellow-500/30 cursor-pointer hover:border-yellow-400 transition-all"
                                      onClick={() => setPreviewImage(leftEvent.eventNumber)}
                                      onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        img.style.display = 'none';
                                      }}
                                    />
                                    <div className="absolute -top-1 -left-1 bg-yellow-500 text-black text-[8px] font-bold px-1 rounded pointer-events-none">M</div>
                                  </div>
                                  {/* Hard */}
                                  <div className="relative group">
                                    <img
                                      src={leftEvent.images?.hard || `/event-nfts/E${leftEvent.eventNumber}-H.png`}
                                      alt={`Event ${leftEvent.eventNumber} Hard`}
                                      className="w-[50px] h-[32px] rounded object-cover border border-red-500/30 cursor-pointer hover:border-red-400 transition-all"
                                      onClick={() => setPreviewImage(leftEvent.eventNumber)}
                                      onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        img.style.display = 'none';
                                      }}
                                    />
                                    <div className="absolute -top-1 -left-1 bg-red-500 text-black text-[8px] font-bold px-1 rounded pointer-events-none">H</div>
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-purple-400/60 text-xs">#{leftEvent.eventNumber}</span>
                                    <input
                                      type="text"
                                      value={leftEvent.name}
                                      onChange={(e) => updateEventName(eventsData.findIndex((ev: any) => ev.eventNumber === leftEvent.eventNumber), e.target.value)}
                                      className="flex-1 px-1 py-0.5 bg-black/30 border border-purple-500/20 rounded text-xs text-gray-300"
                                      placeholder="Event name..."
                                    />
                                  </div>

                                  <div className="flex gap-3 mb-1">
                                    <input
                                      type="text"
                                      value={leftEvent.goldReward.toLocaleString()}
                                      onChange={(e) => updateEventRewards(eventsData.findIndex((ev: any) => ev.eventNumber === leftEvent.eventNumber), Number(e.target.value.replace(/,/g, '')), leftEvent.xpReward)}
                                      className="w-20 px-1 py-0.5 bg-black/30 border border-yellow-400/20 rounded text-xs text-yellow-400"
                                    />
                                    <input
                                      type="text"
                                      value={leftEvent.xpReward.toLocaleString()}
                                      onChange={(e) => updateEventRewards(eventsData.findIndex((ev: any) => ev.eventNumber === leftEvent.eventNumber), leftEvent.goldReward, Number(e.target.value.replace(/,/g, '')))}
                                      className="w-20 px-1 py-0.5 bg-black/30 border border-blue-400/20 rounded text-xs text-blue-400"
                                    />
                                  </div>

                                  {/* Mek Slots Display */}
                                  {leftEvent.mekSlots && (
                                    <div className="mb-1 text-[10px] space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-green-400/70">Easy:</span>
                                        <span className="text-green-300">{leftEvent.mekSlots.easy} slots</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-yellow-400/70">Med:</span>
                                        <span className="text-yellow-300">{leftEvent.mekSlots.medium} slots</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-red-400/70">Hard:</span>
                                        <span className="text-red-300">{leftEvent.mekSlots.hard} slots</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Event Image Path Display */}
                                  <div className="mb-1 px-1 py-0.5 bg-black/30 border border-purple-500/20 rounded space-y-0.5">
                                    <div className="text-[9px] text-green-400/60">
                                      {leftEvent.images?.easy ? `✓ E: ${leftEvent.images.easy.split('/').pop()}` : '⚠️ Easy: No image'}
                                    </div>
                                    <div className="text-[9px] text-yellow-400/60">
                                      {leftEvent.images?.medium ? `✓ M: ${leftEvent.images.medium.split('/').pop()}` : '⚠️ Medium: No image'}
                                    </div>
                                    <div className="text-[9px] text-red-400/60">
                                      {leftEvent.images?.hard ? `✓ H: ${leftEvent.images.hard.split('/').pop()}` : '⚠️ Hard: No image'}
                                    </div>
                                  </div>

                                  {/* Chip Rewards */}
                                  {(() => {
                                    const chipData = calculateChipRewardsForEvent(leftEvent.eventNumber);
                                    return (
                                      <div className="mt-2 p-1 bg-black/20 rounded border border-purple-500/10">
                                        <div className="text-xs text-purple-400/60 mb-1">
                                          <span className="font-semibold">Power Chips</span>
                                          <span className="ml-1 text-[10px] text-purple-400/40">({chipData.distributionType})</span>
                                        </div>
                                        <div className="space-y-0.5">
                                          {chipData.rewards.map((reward: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between text-[10px]">
                                              <span className="text-gray-400">{reward.probability}%</span>
                                              <span className="font-mono">
                                                <span style={{ color: TIER_COLORS[reward.tier - 1] }}>T{reward.tier}</span>
                                                <span style={{ color: MODIFIER_COLORS[reward.modifier] }} className="ml-1 font-bold">
                                                  {reward.modifier}
                                                </span>
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {leftEvent.variationBuffs && leftEvent.variationBuffs.length > 0 && (
                                    <div className="text-xs text-yellow-400/80 mt-1">
                                      <div className="font-semibold">Variation Buffs:</div>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {(() => {
                                          // Get full buff info if available, otherwise just show names
                                          const fullBuffs = variationBuffs[leftEvent.eventNumber];
                                          if (fullBuffs && fullBuffs.length > 0) {
                                            return fullBuffs.map((buff: any, i: number) => (
                                              <span
                                                key={i}
                                                className="px-1 py-0.5 bg-black/50 border rounded text-[9px]"
                                                style={{
                                                  borderColor: buff.type === 'head' ? '#3B82F6' : buff.type === 'body' ? '#FBBF24' : '#10B981',
                                                  color: buff.type === 'head' ? '#93BBFC' : buff.type === 'body' ? '#FDE68A' : '#6EE7B7'
                                                }}
                                              >
                                                {buff.name} ({buff.count}) {buff.type === 'head' ? 'H' : buff.type === 'body' ? 'B' : 'T'}
                                              </span>
                                            ));
                                          } else {
                                            // Fallback to just names
                                            return leftEvent.variationBuffs.map((buff: any, i: number) => (
                                              <span key={i} className="px-1 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded text-[10px] text-yellow-300">
                                                {buff}
                                              </span>
                                            ));
                                          }
                                        })()}
                                      </div>
                                    </div>
                                  )}

                                  {leftEvent.essenceRewards && leftEvent.essenceRewards.length > 0 && (
                                    <div className="text-xs text-purple-400/80 mt-1">
                                      <div className="font-semibold">Essences:</div>
                                      {leftEvent.essenceRewards.map((e: any, i: number) => (
                                        <div key={i} className="ml-2">
                                          <span className={e.type === 'head' ? 'text-blue-400' : e.type === 'body' ? 'text-green-400' : 'text-purple-400'}>
                                            {e.variation} ({e.count})
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {leftEvent.customRewards && leftEvent.customRewards.length > 0 && (
                                    <div className="text-xs text-orange-400/80 mt-1">
                                      <div className="font-semibold">Custom Rewards:</div>
                                      {leftEvent.customRewards.map((r) => (
                                        <div key={r.id} className="ml-2 flex items-center gap-1">
                                          <span className="text-orange-400">
                                            [{r.type}] {r.name}
                                          </span>
                                          <button
                                            onClick={() => removeCustomReward(eventsData.findIndex((ev: any) => ev.eventNumber === leftEvent.eventNumber), r.id)}
                                            className="text-red-400 hover:text-red-300 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <button
                                    onClick={() => {
                                      setShowAddRewardModal(eventsData.findIndex((ev: any) => ev.eventNumber === leftEvent.eventNumber));
                                      setNewReward({ name: '', type: 'frame', description: '' });
                                    }}
                                    className="mt-1 px-2 py-0.5 bg-orange-600/30 hover:bg-orange-600/50 text-orange-400 rounded text-xs transition-colors"
                                  >
                                    + Add Reward
                                  </button>

                                  {leftEvent.items && leftEvent.items.length > 0 && (
                                    <div className="text-xs text-purple-300/60">
                                      +{leftEvent.items.length} item{leftEvent.items.length > 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Right column event */}
                            {rightEvent && (
                              <div className="bg-black/50 border border-purple-500/10 rounded p-2 flex gap-2">
                                {/* 3 Rectangular Thumbnails for Easy/Medium/Hard */}
                                <div className="flex flex-col gap-1 flex-shrink-0">
                                  {/* Easy */}
                                  <div className="relative group">
                                    <img
                                      src={rightEvent.images?.easy || `/event-nfts/E${rightEvent.eventNumber}-E.png`}
                                      alt={`Event ${rightEvent.eventNumber} Easy`}
                                      className="w-[50px] h-[32px] rounded object-cover border border-green-500/30 cursor-pointer hover:border-green-400 transition-all"
                                      onClick={() => setPreviewImage(rightEvent.eventNumber)}
                                      onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        img.style.display = 'none';
                                      }}
                                    />
                                    <div className="absolute -top-1 -left-1 bg-green-500 text-black text-[8px] font-bold px-1 rounded pointer-events-none">E</div>
                                  </div>
                                  {/* Medium */}
                                  <div className="relative group">
                                    <img
                                      src={rightEvent.images?.medium || `/event-nfts/E${rightEvent.eventNumber}-M.png`}
                                      alt={`Event ${rightEvent.eventNumber} Medium`}
                                      className="w-[50px] h-[32px] rounded object-cover border border-yellow-500/30 cursor-pointer hover:border-yellow-400 transition-all"
                                      onClick={() => setPreviewImage(rightEvent.eventNumber)}
                                      onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        img.style.display = 'none';
                                      }}
                                    />
                                    <div className="absolute -top-1 -left-1 bg-yellow-500 text-black text-[8px] font-bold px-1 rounded pointer-events-none">M</div>
                                  </div>
                                  {/* Hard */}
                                  <div className="relative group">
                                    <img
                                      src={rightEvent.images?.hard || `/event-nfts/E${rightEvent.eventNumber}-H.png`}
                                      alt={`Event ${rightEvent.eventNumber} Hard`}
                                      className="w-[50px] h-[32px] rounded object-cover border border-red-500/30 cursor-pointer hover:border-red-400 transition-all"
                                      onClick={() => setPreviewImage(rightEvent.eventNumber)}
                                      onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        img.style.display = 'none';
                                      }}
                                    />
                                    <div className="absolute -top-1 -left-1 bg-red-500 text-black text-[8px] font-bold px-1 rounded pointer-events-none">H</div>
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-purple-400/60 text-xs">#{rightEvent.eventNumber}</span>
                                    <input
                                      type="text"
                                      value={rightEvent.name}
                                      onChange={(e) => updateEventName(eventsData.findIndex((ev: any) => ev.eventNumber === rightEvent.eventNumber), e.target.value)}
                                      className="flex-1 px-1 py-0.5 bg-black/30 border border-purple-500/20 rounded text-xs text-gray-300"
                                      placeholder="Event name..."
                                    />
                                  </div>

                                  <div className="flex gap-3 mb-1">
                                    <input
                                      type="text"
                                      value={rightEvent.goldReward.toLocaleString()}
                                      onChange={(e) => updateEventRewards(eventsData.findIndex((ev: any) => ev.eventNumber === rightEvent.eventNumber), Number(e.target.value.replace(/,/g, '')), rightEvent.xpReward)}
                                      className="w-20 px-1 py-0.5 bg-black/30 border border-yellow-400/20 rounded text-xs text-yellow-400"
                                    />
                                    <input
                                      type="text"
                                      value={rightEvent.xpReward.toLocaleString()}
                                      onChange={(e) => updateEventRewards(eventsData.findIndex((ev: any) => ev.eventNumber === rightEvent.eventNumber), rightEvent.goldReward, Number(e.target.value.replace(/,/g, '')))}
                                      className="w-20 px-1 py-0.5 bg-black/30 border border-blue-400/20 rounded text-xs text-blue-400"
                                    />
                                  </div>

                                  {/* Mek Slots Display */}
                                  {rightEvent.mekSlots && (
                                    <div className="mb-1 text-[10px] space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-green-400/70">Easy:</span>
                                        <span className="text-green-300">{rightEvent.mekSlots.easy} slots</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-yellow-400/70">Med:</span>
                                        <span className="text-yellow-300">{rightEvent.mekSlots.medium} slots</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-red-400/70">Hard:</span>
                                        <span className="text-red-300">{rightEvent.mekSlots.hard} slots</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Event Image Path Display */}
                                  <div className="mb-1 px-1 py-0.5 bg-black/30 border border-purple-500/20 rounded space-y-0.5">
                                    <div className="text-[9px] text-green-400/60">
                                      {rightEvent.images?.easy ? `✓ E: ${rightEvent.images.easy.split('/').pop()}` : '⚠️ Easy: No image'}
                                    </div>
                                    <div className="text-[9px] text-yellow-400/60">
                                      {rightEvent.images?.medium ? `✓ M: ${rightEvent.images.medium.split('/').pop()}` : '⚠️ Medium: No image'}
                                    </div>
                                    <div className="text-[9px] text-red-400/60">
                                      {rightEvent.images?.hard ? `✓ H: ${rightEvent.images.hard.split('/').pop()}` : '⚠️ Hard: No image'}
                                    </div>
                                  </div>

                                  {/* Chip Rewards */}
                                  {(() => {
                                    const chipData = calculateChipRewardsForEvent(rightEvent.eventNumber);
                                    return (
                                      <div className="mt-2 p-1 bg-black/20 rounded border border-purple-500/10">
                                        <div className="text-xs text-purple-400/60 mb-1">
                                          <span className="font-semibold">Power Chips</span>
                                          <span className="ml-1 text-[10px] text-purple-400/40">({chipData.distributionType})</span>
                                        </div>
                                        <div className="space-y-0.5">
                                          {chipData.rewards.map((reward: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between text-[10px]">
                                              <span className="text-gray-400">{reward.probability}%</span>
                                              <span className="font-mono">
                                                <span style={{ color: TIER_COLORS[reward.tier - 1] }}>T{reward.tier}</span>
                                                <span style={{ color: MODIFIER_COLORS[reward.modifier] }} className="ml-1 font-bold">
                                                  {reward.modifier}
                                                </span>
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {rightEvent.variationBuffs && rightEvent.variationBuffs.length > 0 && (
                                    <div className="text-xs text-yellow-400/80 mt-1">
                                      <div className="font-semibold">Variation Buffs:</div>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {(() => {
                                          // Get full buff info if available, otherwise just show names
                                          const fullBuffs = variationBuffs[rightEvent.eventNumber];
                                          if (fullBuffs && fullBuffs.length > 0) {
                                            return fullBuffs.map((buff: any, i: number) => (
                                              <span
                                                key={i}
                                                className="px-1 py-0.5 bg-black/50 border rounded text-[9px]"
                                                style={{
                                                  borderColor: buff.type === 'head' ? '#3B82F6' : buff.type === 'body' ? '#FBBF24' : '#10B981',
                                                  color: buff.type === 'head' ? '#93BBFC' : buff.type === 'body' ? '#FDE68A' : '#6EE7B7'
                                                }}
                                              >
                                                {buff.name} ({buff.count}) {buff.type === 'head' ? 'H' : buff.type === 'body' ? 'B' : 'T'}
                                              </span>
                                            ));
                                          } else {
                                            // Fallback to just names
                                            return rightEvent.variationBuffs.map((buff: any, i: number) => (
                                              <span key={i} className="px-1 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded text-[10px] text-yellow-300">
                                                {buff}
                                              </span>
                                            ));
                                          }
                                        })()}
                                      </div>
                                    </div>
                                  )}

                                  {rightEvent.essenceRewards && rightEvent.essenceRewards.length > 0 && (
                                    <div className="text-xs text-purple-400/80 mt-1">
                                      <div className="font-semibold">Essences:</div>
                                      {rightEvent.essenceRewards.map((e: any, i: number) => (
                                        <div key={i} className="ml-2">
                                          <span className={e.type === 'head' ? 'text-blue-400' : e.type === 'body' ? 'text-green-400' : 'text-purple-400'}>
                                            {e.variation} ({e.count})
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {rightEvent.customRewards && rightEvent.customRewards.length > 0 && (
                                    <div className="text-xs text-orange-400/80 mt-1">
                                      <div className="font-semibold">Custom Rewards:</div>
                                      {rightEvent.customRewards.map((r) => (
                                        <div key={r.id} className="ml-2 flex items-center gap-1">
                                          <span className="text-orange-400">
                                            [{r.type}] {r.name}
                                          </span>
                                          <button
                                            onClick={() => removeCustomReward(eventsData.findIndex((ev: any) => ev.eventNumber === rightEvent.eventNumber), r.id)}
                                            className="text-red-400 hover:text-red-300 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <button
                                    onClick={() => {
                                      setShowAddRewardModal(eventsData.findIndex((ev: any) => ev.eventNumber === rightEvent.eventNumber));
                                      setNewReward({ name: '', type: 'frame', description: '' });
                                    }}
                                    className="mt-1 px-2 py-0.5 bg-orange-600/30 hover:bg-orange-600/50 text-orange-400 rounded text-xs transition-colors"
                                  >
                                    + Add Reward
                                  </button>

                                  {rightEvent.items && rightEvent.items.length > 0 && (
                                    <div className="text-xs text-purple-300/60">
                                      +{rightEvent.items.length} item{rightEvent.items.length > 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-purple-500/20 grid grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-purple-400/60">Total Gold (All 200): </span>
            <span className="text-yellow-400 font-bold">
              {totalGold.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-purple-400/60">Total XP (All 200): </span>
            <span className="text-blue-400 font-bold">
              {totalXP.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-purple-400/60">Total Events: </span>
            <span className="text-purple-400 font-bold">200</span>
          </div>
        </div>
      </div>

      {/* Image Preview Modal - Now shows all 3 difficulty images */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          style={{ position: 'fixed', top: 0, left: 0 }}
          onClick={() => setPreviewImage(null)}
        >
          <div className="bg-gray-900 border border-purple-500/50 rounded-lg p-6 m-4 max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-purple-400 font-bold text-xl">Event {previewImage}</div>
              <div className="text-gray-400 text-sm">{eventsData[previewImage - 1]?.name || `Event ${previewImage}`}</div>
            </div>

            {/* 3 Images Side by Side */}
            <div className="flex gap-4 justify-center">
              {/* Easy */}
              <div className="flex flex-col items-center">
                <div className="text-green-400 font-bold text-sm mb-2">EASY</div>
                <img
                  src={eventsData[previewImage - 1]?.images?.easy || `/event-nfts/E${previewImage}-E.png`}
                  alt={`Event ${previewImage} Easy`}
                  className="max-w-[350px] max-h-[350px] object-contain rounded border-2 border-green-500/30"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/event-images/placeholder.png';
                  }}
                />
              </div>

              {/* Medium */}
              <div className="flex flex-col items-center">
                <div className="text-yellow-400 font-bold text-sm mb-2">MEDIUM</div>
                <img
                  src={eventsData[previewImage - 1]?.images?.medium || `/event-nfts/E${previewImage}-M.png`}
                  alt={`Event ${previewImage} Medium`}
                  className="max-w-[350px] max-h-[350px] object-contain rounded border-2 border-yellow-500/30"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/event-images/placeholder.png';
                  }}
                />
              </div>

              {/* Hard */}
              <div className="flex flex-col items-center">
                <div className="text-red-400 font-bold text-sm mb-2">HARD</div>
                <img
                  src={eventsData[previewImage - 1]?.images?.hard || `/event-nfts/E${previewImage}-H.png`}
                  alt={`Event ${previewImage} Hard`}
                  className="max-w-[350px] max-h-[350px] object-contain rounded border-2 border-red-500/30"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/event-images/placeholder.png';
                  }}
                />
              </div>
            </div>

            <div className="text-center mt-4 text-xs text-gray-500">Click outside to close</div>
          </div>
        </div>
      )}

      {/* Add Custom Reward Modal */}
      {showAddRewardModal !== null && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          style={{ position: 'fixed', top: 0, left: 0 }}
          onClick={() => setShowAddRewardModal(null)}
        >
          <div className="bg-gray-900 border border-orange-500/50 rounded-lg p-6 m-4 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-orange-400 mb-4">
              Add Custom Reward to Event {showAddRewardModal + 1}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400">Reward Name*</label>
                <input
                  type="text"
                  value={newReward.name}
                  onChange={(e) => setNewReward({...newReward, name: e.target.value})}
                  placeholder="e.g., Golden Frame, Power Chip Mk II"
                  className="w-full px-3 py-2 bg-black/50 border border-orange-500/30 rounded text-sm text-gray-300"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">Reward Type</label>
                <select
                  value={newReward.type}
                  onChange={(e) => setNewReward({...newReward, type: e.target.value as any})}
                  className="w-full px-3 py-2 bg-black/50 border border-orange-500/30 rounded text-sm text-gray-300"
                >
                  <option value="frame">Frame</option>
                  <option value="canister">Canister (OE Signatures)</option>
                  <option value="gear">Gear (Power Chip, etc.)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400">Description (Optional)</label>
                <textarea
                  value={newReward.description}
                  onChange={(e) => setNewReward({...newReward, description: e.target.value})}
                  placeholder="Brief description of the reward..."
                  className="w-full px-3 py-2 bg-black/50 border border-orange-500/30 rounded text-sm text-gray-300 h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => addCustomReward(showAddRewardModal)}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm transition-colors"
              >
                Add Reward
              </button>
              <button
                onClick={() => setShowAddRewardModal(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
