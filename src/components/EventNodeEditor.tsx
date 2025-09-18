'use client';

import React, { useState, useEffect } from 'react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import mekRarityMaster from '../../convex/mekRarityMaster.json';
import { calculateChipRewardsForEvent, MODIFIER_COLORS, TIER_COLORS } from '@/lib/chipRewardCalculator';
import { DeploymentStatus, ValidationResult } from '@/types/deployedNodeData';

interface EventNode {
  eventNumber: number;
  name: string;
  goldReward: number;
  xpReward: number;
  image?: string; // Path to the event image
  variationBuffs?: string[]; // 4 variation buffs for this event
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
  const [itemSearchTerms, setItemSearchTerms] = useState<{ [key: number]: string }>({});
  const [showItemSearch, setShowItemSearch] = useState<{ [key: number]: boolean }>({});
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [currentConfigId, setCurrentConfigId] = useState<Id<"eventNodeConfigs"> | null>(null);
  const [currentConfigName, setCurrentConfigName] = useState<string>('');
  const [saveName, setSaveName] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
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
  const [eventImagesFolder, setEventImagesFolder] = useState<string>('/event-images/450px webp');

  // Deployment state
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    isDeploying: false,
  });
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Variation buff assignment state with type and count tracking
  interface VariationBuffInfo {
    name: string;
    type: 'head' | 'body' | 'trait';
    count: number;
  }
  const [variationBuffs, setVariationBuffs] = useState<{[eventNumber: number]: VariationBuffInfo[]}>({});
  const [buffAssignmentMethod, setBuffAssignmentMethod] = useState<'tiered' | 'balanced' | 'random'>('tiered');
  const [showBuffPreview, setShowBuffPreview] = useState(false);

  // Global ranges for all 200 events
  const [globalRanges, setGlobalRanges] = useState({
    minGold: 100,
    maxGold: 10000,
    goldRounding: 'none' as 'none' | '5' | '10',
    minXP: 10,
    maxXP: 1000,
    xpRounding: 'none' as 'none' | '5' | '10'
  });

  // Initialize eventsData before using it in queries
  const [eventsData, setEventsData] = useState<EventNode[]>(() => {
    // Initialize with 200 events (20 per chapter × 10 chapters)
    const initialData: EventNode[] = [];
    for (let i = 1; i <= 200; i++) {
      initialData.push({
        eventNumber: i,
        name: `Event ${i}`,
        goldReward: 100,
        xpReward: 10,
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
  const validateDeploymentData = useQuery(
    api.deployedNodeData.validateDeploymentData,
    showDeploymentModal ? { eventData: JSON.stringify(eventsData) } : "skip"
  );
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
          setEventsData(loadedData.events);
        }
        if (loadedData.globalRanges) {
          setGlobalRanges(loadedData.globalRanges);
        }
        if (loadedData.eventImagesFolder) {
          setEventImagesFolder(loadedData.eventImagesFolder);
        }
      } catch (error) {
        console.error('Failed to parse configuration data:', error);
      }
    }
  }, [selectedConfig]);

  // Update validation result when deployment data is validated
  useEffect(() => {
    if (validateDeploymentData) {
      setValidationResult(validateDeploymentData);
    }
  }, [validateDeploymentData]);

  // Auto-load last used configuration on mount
  useEffect(() => {
    // Try to load the last used config from localStorage
    const lastConfigId = localStorage.getItem('lastEventNodeConfigId');
    const lastConfigName = localStorage.getItem('lastEventNodeConfigName');

    if (lastConfigId && lastConfigName && !currentConfigId) {
      setCurrentConfigId(lastConfigId as Id<"eventNodeConfigs">);
      setCurrentConfigName(lastConfigName);
    } else if (!currentConfigId && savedConfigs && savedConfigs.length > 0) {
      // If no last config but there are saved configs, load the most recent one
      const mostRecent = savedConfigs.reduce((latest, current) => {
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

  // Apply rounding based on setting
  const applyRounding = (value: number, rounding: 'none' | '5' | '10'): number => {
    switch (rounding) {
      case '5':
        // Round to nearest 5
        return Math.round(value / 5) * 5;
      case '10':
        // Round to nearest 10
        return Math.round(value / 10) * 10;
      default:
        return Math.round(value);
    }
  };

  // Apply linear distribution to all 200 events
  const applyGlobalRanges = () => {
    const goldStep = (globalRanges.maxGold - globalRanges.minGold) / 199;
    const xpStep = (globalRanges.maxXP - globalRanges.minXP) / 199;

    const newEventsData = eventsData.map((event, index) => ({
      ...event,
      goldReward: applyRounding(globalRanges.minGold + (goldStep * index), globalRanges.goldRounding),
      xpReward: applyRounding(globalRanges.minXP + (xpStep * index), globalRanges.xpRounding)
    }));

    setEventsData(newEventsData);
  };

  // Apply bulk names to all events
  const applyBulkNames = () => {
    const names = bulkNames.split(',').map(name => name.trim());
    if (names.length === 0) return;

    const newEventsData = eventsData.map((event, index) => ({
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
    const newEventsData = eventsData.map((event, index) => {
      // Replace spaces with %20 for URL compatibility
      const encodedFolder = eventImagesFolder.replace(/ /g, '%20');
      const imagePath = `${encodedFolder}/${event.eventNumber}.webp`;
      console.log(`Event ${event.eventNumber}: ${imagePath}`);
      return {
        ...event,
        image: imagePath
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

  // Toggle chapter expansion
  const toggleChapter = (chapter: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapter)) {
      newExpanded.delete(chapter);
    } else {
      newExpanded.add(chapter);
    }
    setExpandedChapters(newExpanded);
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
        data: JSON.stringify({ events: eventsData, globalRanges, eventImagesFolder }),
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
        data: JSON.stringify({ events: eventsData, globalRanges, eventImagesFolder }),
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
    if (!validationResult?.isValid) {
      alert('Please fix validation errors before deploying');
      return;
    }

    setDeploymentStatus({ isDeploying: true });

    try {
      // Add chip rewards to each event before deployment
      const eventsWithChips = eventsData.map(event => ({
        ...event,
        chipRewards: calculateChipRewardsForEvent(event.eventNumber).rewards
      }));

      const result = await deployEventNodes({
        configurationId: currentConfigId || undefined,
        configurationName: currentConfigName || undefined,
        eventData: JSON.stringify(eventsWithChips),
        notes: `Deployed from ${currentConfigName || 'Unsaved Configuration'}`,
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
        setShowDeploymentModal(false);
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

  // Generate variation buffs for all events using tiered system
  const generateVariationBuffs = () => {
    // Track variations by type with their counts
    const headVariations: Map<string, number> = new Map();
    const bodyVariations: Map<string, number> = new Map();
    const traitVariations: Map<string, number> = new Map();

    // Count all variations in the collection
    (mekRarityMaster as MekData[]).forEach(mek => {
      if (!BOSS_VARIATIONS.heads.has(mek.head)) {
        headVariations.set(mek.head, (headVariations.get(mek.head) || 0) + 1);
      }
      if (!BOSS_VARIATIONS.bodies.has(mek.body)) {
        bodyVariations.set(mek.body, (bodyVariations.get(mek.body) || 0) + 1);
      }
      if (!BOSS_VARIATIONS.traits.has(mek.trait)) {
        traitVariations.set(mek.trait, (traitVariations.get(mek.trait) || 0) + 1);
      }
    });

    // Convert to sorted arrays - SORTED BY RARITY (least common first)
    const sortedHeads = Array.from(headVariations.entries()).sort((a, b) => a[1] - b[1]);
    const sortedBodies = Array.from(bodyVariations.entries()).sort((a, b) => a[1] - b[1]);
    const sortedTraits = Array.from(traitVariations.entries()).sort((a, b) => a[1] - b[1]);

    const newBuffs: {[eventNumber: number]: VariationBuffInfo[]} = {};
    const usedCombinations = new Set<string>();

    // Generate buffs for each event
    for (let eventNum = 1; eventNum <= 200; eventNum++) {
      const chapter = Math.ceil(eventNum / 20);
      const eventInChapter = ((eventNum - 1) % 20) + 1;
      const overallProgress = ((eventNum - 1) / 199); // 0 to 1 overall

      let selectedBuffs: VariationBuffInfo[] = [];
      let attempts = 0;

      do {
        selectedBuffs = [];
        const usedNames = new Set<string>();

        // ENSURE we get one of each type first (head, body, trait)
        const types: ('head' | 'body' | 'trait')[] = ['head', 'body', 'trait'];

        // Shuffle types for randomness
        for (let i = types.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [types[i], types[j]] = [types[j], types[i]];
        }

        // Pick one of each type for the first 3 slots
        for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
          const type = types[slotIndex];
          let sourceArray: [string, number][];

          if (type === 'head') sourceArray = sortedHeads;
          else if (type === 'body') sourceArray = sortedBodies;
          else sourceArray = sortedTraits;

          let rarityIndex: number;

          if (slotIndex === 0) {
            // FIRST SLOT: Guarantee at least one relatively rare variation
            // Early events get moderately rare (15-40% range of rarity)
            // Late events get very rare (0-20% range of rarity)
            const maxRarePercent = 0.4 - (overallProgress * 0.35); // 40% -> 5%
            const minRarePercent = 0.15 - (overallProgress * 0.14); // 15% -> 1%

            rarityIndex = Math.floor(
              sourceArray.length * (minRarePercent + Math.random() * (maxRarePercent - minRarePercent))
            );
          } else {
            // SLOTS 2-3: Mix of common and uncommon
            // Early events: mostly common (50-90% range)
            // Late events: more varied (20-70% range)
            const minPercent = 0.5 - (overallProgress * 0.3); // 50% -> 20%
            const maxPercent = 0.9 - (overallProgress * 0.2); // 90% -> 70%

            rarityIndex = Math.floor(
              sourceArray.length * (minPercent + Math.random() * (maxPercent - minPercent))
            );
          }

          const [name, count] = sourceArray[rarityIndex];

          if (!usedNames.has(name)) {
            usedNames.add(name);
            selectedBuffs.push({ name, type, count });
          }
        }

        // For the 4th slot: wildcard with full range possibility
        const fourthType = Math.random() < 0.4 ? 'head' : (Math.random() < 0.7 ? 'body' : 'trait');
        let sourceArray: [string, number][];

        if (fourthType === 'head') sourceArray = sortedHeads;
        else if (fourthType === 'body') sourceArray = sortedBodies;
        else sourceArray = sortedTraits;

        // 4th slot can be anything, but bias toward middle rarities
        let rarityIndex: number;
        const roll = Math.random();

        if (roll < 0.1 + overallProgress * 0.2) {
          // Very rare (0-15% range) - more likely in later events
          rarityIndex = Math.floor(Math.random() * sourceArray.length * 0.15);
        } else if (roll < 0.5) {
          // Middle rarity (30-70% range)
          rarityIndex = Math.floor(sourceArray.length * (0.3 + Math.random() * 0.4));
        } else {
          // Common (60-100% range)
          rarityIndex = Math.floor(sourceArray.length * (0.6 + Math.random() * 0.4));
        }

        const [name, count] = sourceArray[rarityIndex];

        if (!usedNames.has(name)) {
          selectedBuffs.push({ name, type: fourthType, count });
        }

        // Sort for consistent comparison
        const combinationKey = selectedBuffs.map(b => b.name).sort().join('|');

        // Check for uniqueness
        if (!usedCombinations.has(combinationKey) && selectedBuffs.length === 4) {
          usedCombinations.add(combinationKey);
          break;
        }

        attempts++;
      } while (attempts < 100); // Safety limit

      // Store just the names for the event data (backward compatibility)
      const buffNames = selectedBuffs.map(b => b.name);

      // Update events with the variation buff names
      const newEvents = [...eventsData];
      if (newEvents[eventNum - 1]) {
        newEvents[eventNum - 1].variationBuffs = buffNames;
      }
      setEventsData(newEvents);

      // Store full info for display
      newBuffs[eventNum] = selectedBuffs;
    }

    setVariationBuffs(newBuffs);
    console.log('Generated variation buffs for all 200 events');
  };

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
      const rangeData = typedMekData.filter(mek => mek.rank >= start && mek.rank <= end);
      chapterMeks.push(...rangeData);
    });

    // Create sets of variations that appear in this chapter
    const chapterHeads = new Set<string>();
    const chapterBodies = new Set<string>();
    const chapterTraits = new Set<string>();

    chapterMeks.forEach(mek => {
      chapterHeads.add(mek.head);
      chapterBodies.add(mek.body);
      chapterTraits.add(mek.trait);
    });

    // Now count ALL variations across the entire 4000 mek collection
    const globalHeadCounts: Record<string, number> = {};
    const globalBodyCounts: Record<string, number> = {};
    const globalTraitCounts: Record<string, number> = {};

    typedMekData.forEach(mek => {
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
    const eligibleMissingVariations = allMissingVariations.filter(v => {
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
    const updatedEvents = chapterEvents.map((event, index) => {
      const essenceRanks = ROUND_ROBIN_TABLE[index];
      const essenceRewards = essenceRanks.map(rank => {
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
    updatedEvents.forEach((event, index) => {
      newEventsData[startIndex + index] = event;
    });

    setEventsData(newEventsData);

    console.log(`Chapter ${chapterNumber}: Found ${allMissingVariations.length} variations NOT in chapter (${missingHeads.length} heads, ${missingBodies.length} bodies, ${missingTraits.length} traits)`);
    console.log(`After filtering boss variations: ${eligibleMissingVariations.length} eligible variations`);
  };

  // Calculate total rewards
  const totalGold = eventsData.reduce((sum, event) => sum + event.goldReward, 0);
  const totalXP = eventsData.reduce((sum, event) => sum + event.xpReward, 0);

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-gray-800/30 rounded-lg p-4">
        <h4 className="text-sm font-bold text-purple-500/80 mb-3">Event Node Configuration (All 200 Events)</h4>

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
            <button
              onClick={() => setShowDeploymentModal(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm transition-colors font-semibold"
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

        {/* Bulk Name Entry */}
        <div className="mb-4 bg-black/30 rounded p-3">
          <h5 className="text-purple-400 text-sm font-bold mb-2">Bulk Event Names (200 names, comma-separated)</h5>
          <textarea
            value={bulkNames}
            onChange={(e) => setBulkNames(e.target.value)}
            placeholder="Event 1 name, Event 2 name, Event 3 name, ..."
            className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 rounded text-sm text-gray-300 h-24 resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-400">
              {bulkNames.split(',').filter(n => n.trim()).length}/200 names entered
            </span>
            <button
              onClick={applyBulkNames}
              className="px-4 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs transition-colors"
            >
              Apply Names to All Events
            </button>
          </div>
        </div>

        {/* Global Range Controls */}
        <div className="mb-4 bg-black/30 rounded p-3">
          <h5 className="text-purple-400 text-sm font-bold mb-3">Global Reward Ranges (Events 1-200)</h5>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-yellow-400 text-xs">Gold Range</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={globalRanges.minGold}
                  onChange={(e) => setGlobalRanges({...globalRanges, minGold: Number(e.target.value)})}
                  className="w-24 px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-xs text-yellow-400"
                  placeholder="Min"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  value={globalRanges.maxGold}
                  onChange={(e) => setGlobalRanges({...globalRanges, maxGold: Number(e.target.value)})}
                  className="w-24 px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-xs text-yellow-400"
                  placeholder="Max"
                />
              </div>
              <select
                value={globalRanges.goldRounding}
                onChange={(e) => setGlobalRanges({...globalRanges, goldRounding: e.target.value as any})}
                className="w-full px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-xs text-yellow-400"
              >
                <option value="none">No Rounding</option>
                <option value="5">Round to 0 or 5</option>
                <option value="10">Round to 10s</option>
              </select>
            </div>

            <div>
              <label className="text-blue-400 text-xs">XP Range</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={globalRanges.minXP}
                  onChange={(e) => setGlobalRanges({...globalRanges, minXP: Number(e.target.value)})}
                  className="w-24 px-2 py-1 bg-black/50 border border-blue-400/30 rounded text-xs text-blue-400"
                  placeholder="Min"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  value={globalRanges.maxXP}
                  onChange={(e) => setGlobalRanges({...globalRanges, maxXP: Number(e.target.value)})}
                  className="w-24 px-2 py-1 bg-black/50 border border-blue-400/30 rounded text-xs text-blue-400"
                  placeholder="Max"
                />
              </div>
              <select
                value={globalRanges.xpRounding}
                onChange={(e) => setGlobalRanges({...globalRanges, xpRounding: e.target.value as any})}
                className="w-full px-2 py-1 bg-black/50 border border-blue-400/30 rounded text-xs text-blue-400"
              >
                <option value="none">No Rounding</option>
                <option value="5">Round to 0 or 5</option>
                <option value="10">Round to 10s</option>
              </select>
            </div>
          </div>
          <button
            onClick={applyGlobalRanges}
            className="px-4 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs transition-colors"
          >
            Apply to All Events
          </button>
        </div>

        {/* Variation Buff Assignment System */}
        <div className="mb-4 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded p-3">
          <h5 className="text-yellow-400 text-sm font-bold mb-2 flex items-center gap-2">
            <span>⚔️</span> Variation Buff Assignment
          </h5>

          <div className="text-xs text-gray-400 mb-3">
            Assign 4 variation buffs to each event. Uses a tiered rarity system with increasing difficulty.
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-400">Assignment Method</label>
              <select
                value={buffAssignmentMethod}
                onChange={(e) => setBuffAssignmentMethod(e.target.value as any)}
                className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-sm text-gray-300"
              >
                <option value="tiered">Tiered Rarity (Recommended)</option>
                <option value="balanced">Balanced Distribution</option>
                <option value="random">Pure Random</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={generateVariationBuffs}
                className="w-full px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-black font-semibold rounded text-sm transition-colors"
              >
                Generate All Buffs
              </button>
            </div>
          </div>

          {/* Preview toggle */}
          <button
            onClick={() => setShowBuffPreview(!showBuffPreview)}
            className="text-xs text-yellow-400 hover:text-yellow-300 underline"
          >
            {showBuffPreview ? 'Hide' : 'Show'} Preview
          </button>

          {/* Preview section */}
          {showBuffPreview && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto bg-black/30 rounded p-2">
              <div className="text-xs text-gray-500 mb-2">Sample Events:</div>
              {[1, 10, 20, 40, 60, 100, 140, 180, 200].map(eventNum => {
                const buffs = variationBuffs[eventNum] || [];
                return (
                  <div key={eventNum} className="flex items-center gap-2 text-xs">
                    <span className="text-yellow-400 w-12">E{eventNum}:</span>
                    {buffs.length > 0 ? (
                      <div className="flex gap-1">
                        {buffs.map((buff, idx) => (
                          <span
                            key={idx}
                            className="px-1 py-0.5 bg-black/50 border rounded text-[10px]"
                            style={{
                              borderColor: buff.type === 'head' ? '#3B82F6' : buff.type === 'body' ? '#FBBF24' : '#10B981',
                              color: buff.type === 'head' ? '#93BBFC' : buff.type === 'body' ? '#FDE68A' : '#6EE7B7'
                            }}
                          >
                            {buff.name} ({buff.count}) {buff.type.charAt(0).toUpperCase()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">Not generated</span>
                    )}
                  </div>
                );
              })}
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
              placeholder="e.g., /event-images/450px webp"
              className="flex-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded text-sm text-gray-300 font-mono"
              title="Web-relative path from public folder (e.g., /event-images)"
            />
            <button
              onClick={batchAssignImages}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded text-sm font-semibold transition-all"
            >
              Assign All Images (1-200)
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            <span className="text-purple-300">ℹ️ Note:</span> Expects files named 1.webp, 2.webp, ... 200.webp in the specified folder
          </div>
        </div>

        {/* Events by Chapter (Collapsible) */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(chapter => {
            const chapterEvents = eventsData.slice((chapter - 1) * 20, chapter * 20);
            const chapterGold = chapterEvents.reduce((sum, e) => sum + e.goldReward, 0);
            const chapterXP = chapterEvents.reduce((sum, e) => sum + e.xpReward, 0);
            const isExpanded = expandedChapters.has(chapter);

            return (
              <div key={chapter} className="bg-black/30 rounded border border-purple-500/20">
                <div
                  onClick={() => toggleChapter(chapter)}
                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-purple-500/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-purple-400 font-bold text-sm">
                      Chapter {chapter}
                    </span>
                    <span className="text-gray-400 text-xs">
                      (Events {(chapter - 1) * 20 + 1}-{chapter * 20})
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        calculateEssenceDistribution(chapter);
                      }}
                      className="px-2 py-0.5 bg-purple-600/50 hover:bg-purple-600 text-white rounded text-xs transition-colors"
                    >
                      Calculate Essences
                    </button>
                    <span className="text-yellow-400 text-xs">{chapterGold.toLocaleString()}G</span>
                    <span className="text-blue-400 text-xs">{chapterXP.toLocaleString()}XP</span>
                    <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3 border-t border-purple-500/20">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Reorder events to be column-by-column instead of row-by-row */}
                      {[...Array(10)].map((_, rowIndex) => {
                        const leftIndex = rowIndex;
                        const rightIndex = rowIndex + 10;
                        const leftEvent = chapterEvents[leftIndex];
                        const rightEvent = chapterEvents[rightIndex];

                        return (
                          <React.Fragment key={rowIndex}>
                            {/* Left column event */}
                            {leftEvent && (
                              <div className="bg-black/50 border border-purple-500/10 rounded p-2 flex gap-2">
                                {/* Circular Thumbnail - Clickable */}
                                <img
                                  src={leftEvent.image || `/event-images/${leftEvent.eventNumber}.webp`}
                                  alt={`Event ${leftEvent.eventNumber}`}
                                  className="w-[52px] h-[52px] rounded-full object-cover border border-purple-500/30 flex-shrink-0 cursor-pointer hover:border-purple-400"
                                  onClick={() => setPreviewImage(leftEvent.eventNumber)}
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.style.display = 'none';
                                    const placeholder = img.nextElementSibling as HTMLElement;
                                    if (placeholder) placeholder.style.display = 'flex';
                                  }}
                                />
                                <div
                                  className="w-[52px] h-[52px] rounded-full bg-purple-500/20 border border-purple-500/30 flex-shrink-0 items-center justify-center text-xs text-purple-400 hidden cursor-pointer hover:border-purple-400"
                                  style={{ display: 'none' }}
                                  onClick={() => setPreviewImage(leftEvent.eventNumber)}
                                >
                                  {leftEvent.eventNumber}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-purple-400/60 text-xs">#{leftEvent.eventNumber}</span>
                                    <input
                                      type="text"
                                      value={leftEvent.name}
                                      onChange={(e) => updateEventName((chapter - 1) * 20 + leftIndex, e.target.value)}
                                      className="flex-1 px-1 py-0.5 bg-black/30 border border-purple-500/20 rounded text-xs text-gray-300"
                                      placeholder="Event name..."
                                    />
                                  </div>

                                  <div className="flex gap-3 mb-1">
                                    <input
                                      type="text"
                                      value={leftEvent.goldReward.toLocaleString()}
                                      onChange={(e) => updateEventRewards((chapter - 1) * 20 + leftIndex, Number(e.target.value.replace(/,/g, '')), leftEvent.xpReward)}
                                      className="w-20 px-1 py-0.5 bg-black/30 border border-yellow-400/20 rounded text-xs text-yellow-400"
                                    />
                                    <input
                                      type="text"
                                      value={leftEvent.xpReward.toLocaleString()}
                                      onChange={(e) => updateEventRewards((chapter - 1) * 20 + leftIndex, leftEvent.goldReward, Number(e.target.value.replace(/,/g, '')))}
                                      className="w-20 px-1 py-0.5 bg-black/30 border border-blue-400/20 rounded text-xs text-blue-400"
                                    />
                                  </div>

                                  {/* Event Image Path Display */}
                                  <div className="mb-1 px-1 py-0.5 bg-black/30 border border-purple-500/20 rounded">
                                    <span className="text-[10px] text-purple-400/60">
                                      {leftEvent.image ? `✓ ${leftEvent.image.split('/').pop()}` : '⚠️ No image assigned'}
                                    </span>
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
                                          {chipData.rewards.map((reward, idx) => (
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
                                          const fullBuffs = variationBuffs[(chapter - 1) * 20 + leftIndex + 1];
                                          if (fullBuffs && fullBuffs.length > 0) {
                                            return fullBuffs.map((buff, i) => (
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
                                            return leftEvent.variationBuffs.map((buff, i) => (
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
                                      {leftEvent.essenceRewards.map((e, i) => (
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
                                            onClick={() => removeCustomReward((chapter - 1) * 20 + leftIndex, r.id)}
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
                                      setShowAddRewardModal((chapter - 1) * 20 + leftIndex);
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
                                {/* Circular Thumbnail - Clickable */}
                                <img
                                  src={rightEvent.image || `/event-images/${rightEvent.eventNumber}.webp`}
                                  alt={`Event ${rightEvent.eventNumber}`}
                                  className="w-[52px] h-[52px] rounded-full object-cover border border-purple-500/30 flex-shrink-0 cursor-pointer hover:border-purple-400"
                                  onClick={() => setPreviewImage(rightEvent.eventNumber)}
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.style.display = 'none';
                                    const placeholder = img.nextElementSibling as HTMLElement;
                                    if (placeholder) placeholder.style.display = 'flex';
                                  }}
                                />
                                <div
                                  className="w-[52px] h-[52px] rounded-full bg-purple-500/20 border border-purple-500/30 flex-shrink-0 items-center justify-center text-xs text-purple-400 hidden cursor-pointer hover:border-purple-400"
                                  style={{ display: 'none' }}
                                  onClick={() => setPreviewImage(rightEvent.eventNumber)}
                                >
                                  {rightEvent.eventNumber}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-purple-400/60 text-xs">#{rightEvent.eventNumber}</span>
                                    <input
                                      type="text"
                                      value={rightEvent.name}
                                      onChange={(e) => updateEventName((chapter - 1) * 20 + rightIndex, e.target.value)}
                                      className="flex-1 px-1 py-0.5 bg-black/30 border border-purple-500/20 rounded text-xs text-gray-300"
                                      placeholder="Event name..."
                                    />
                                  </div>

                                  <div className="flex gap-3 mb-1">
                                    <input
                                      type="text"
                                      value={rightEvent.goldReward.toLocaleString()}
                                      onChange={(e) => updateEventRewards((chapter - 1) * 20 + rightIndex, Number(e.target.value.replace(/,/g, '')), rightEvent.xpReward)}
                                      className="w-20 px-1 py-0.5 bg-black/30 border border-yellow-400/20 rounded text-xs text-yellow-400"
                                    />
                                    <input
                                      type="text"
                                      value={rightEvent.xpReward.toLocaleString()}
                                      onChange={(e) => updateEventRewards((chapter - 1) * 20 + rightIndex, rightEvent.goldReward, Number(e.target.value.replace(/,/g, '')))}
                                      className="w-20 px-1 py-0.5 bg-black/30 border border-blue-400/20 rounded text-xs text-blue-400"
                                    />
                                  </div>

                                  {/* Event Image Path Display */}
                                  <div className="mb-1 px-1 py-0.5 bg-black/30 border border-purple-500/20 rounded">
                                    <span className="text-[10px] text-purple-400/60">
                                      {rightEvent.image ? `✓ ${rightEvent.image.split('/').pop()}` : '⚠️ No image assigned'}
                                    </span>
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
                                          {chipData.rewards.map((reward, idx) => (
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
                                          const fullBuffs = variationBuffs[(chapter - 1) * 20 + rightIndex + 1];
                                          if (fullBuffs && fullBuffs.length > 0) {
                                            return fullBuffs.map((buff, i) => (
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
                                            return rightEvent.variationBuffs.map((buff, i) => (
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
                                      {rightEvent.essenceRewards.map((e, i) => (
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
                                            onClick={() => removeCustomReward((chapter - 1) * 20 + rightIndex, r.id)}
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
                                      setShowAddRewardModal((chapter - 1) * 20 + rightIndex);
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
                )}
              </div>
            );
          })}
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          style={{ position: 'fixed', top: 0, left: 0 }}
          onClick={() => setPreviewImage(null)}
        >
          <div className="bg-gray-900 border border-purple-500/50 rounded-lg p-4 m-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={eventsData[previewImage - 1]?.image || `/event-images/${previewImage}.webp`}
              alt={`Event ${previewImage}`}
              className="max-w-[600px] max-h-[600px] object-contain rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/event-images/placeholder.webp';
              }}
            />
            <div className="text-center mt-3">
              <div className="text-purple-400 font-bold">Event {previewImage}</div>
              <div className="text-gray-400 text-sm">{eventsData[previewImage - 1]?.name || `Event ${previewImage}`}</div>
            </div>
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

      {/* Deployment Modal */}
      {showDeploymentModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          style={{ position: 'fixed', top: 0, left: 0 }}
          onClick={() => !deploymentStatus.isDeploying && setShowDeploymentModal(false)}
        >
          <div
            className="bg-gray-900 border-2 border-orange-500/50 rounded-lg p-6 m-4 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
              🚀 Deploy Event Configuration to Story Climb
            </h2>

            {/* Configuration Info */}
            <div className="bg-black/50 border border-orange-500/20 rounded p-4 mb-4">
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-400">Configuration: </span>
                  <span className="text-orange-300 font-semibold">
                    {currentConfigName || 'Unsaved Configuration'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Total Events: </span>
                  <span className="text-white font-semibold">{eventsData.length}</span>
                </div>
                <div>
                  <span className="text-gray-400">Total Gold: </span>
                  <span className="text-yellow-400 font-semibold">{totalGold.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Total XP: </span>
                  <span className="text-blue-400 font-semibold">{totalXP.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Validation Results */}
            {validationResult && (
              <div className="mb-4 space-y-3">
                {/* Errors */}
                {validationResult.errors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                    <h4 className="text-red-400 font-semibold mb-2">❌ Errors (Must Fix)</h4>
                    <ul className="text-sm text-red-300 space-y-1">
                      {validationResult.errors.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                    <h4 className="text-yellow-400 font-semibold mb-2">⚠️ Warnings</h4>
                    <ul className="text-sm text-yellow-300 space-y-1">
                      {validationResult.warnings.map((warning, i) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Success */}
                {validationResult.isValid && validationResult.warnings.length === 0 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                    <h4 className="text-green-400 font-semibold mb-2">✅ Ready to Deploy</h4>
                    <p className="text-sm text-green-300">
                      All validation checks passed. Your configuration is ready to deploy.
                    </p>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-black/30 border border-gray-600 rounded p-3">
                  <h4 className="text-gray-300 font-semibold mb-2">📊 Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Events with custom names: </span>
                      <span className={validationResult.summary.hasAllEventNames ? "text-green-400" : "text-yellow-400"}>
                        {validationResult.summary.hasAllEventNames ? "✅ All" : "⚠️ Some missing"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Events with rewards: </span>
                      <span className={validationResult.summary.hasAllRewards ? "text-green-400" : "text-yellow-400"}>
                        {validationResult.summary.hasAllRewards ? "✅ All" : "⚠️ Some missing"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Deployments */}
            {deploymentHistory && deploymentHistory.length > 0 && (
              <div className="mb-4 bg-black/30 border border-gray-600 rounded p-3">
                <h4 className="text-gray-300 font-semibold mb-2">📜 Recent Deployments</h4>
                <div className="space-y-1 text-xs">
                  {deploymentHistory.map((deployment) => (
                    <div key={deployment._id} className="flex justify-between text-gray-400">
                      <span>v{deployment.version} - {deployment.configurationName || 'Unknown'}</span>
                      <span>{new Date(deployment.deployedAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deployment Warning */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded p-4 mb-4">
              <p className="text-sm text-orange-300">
                <strong>⚠️ Important:</strong> Deploying will immediately update the Story Climb page for all players.
                The previous configuration will be archived and can be rolled back if needed.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDeployment}
                disabled={deploymentStatus.isDeploying || !validationResult?.isValid}
                className={`flex-1 px-6 py-3 rounded font-semibold transition-colors ${
                  deploymentStatus.isDeploying || !validationResult?.isValid
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-500 text-white'
                }`}
              >
                {deploymentStatus.isDeploying ? '⏳ Deploying...' : '🚀 Deploy Now'}
              </button>
              <button
                onClick={() => setShowDeploymentModal(false)}
                disabled={deploymentStatus.isDeploying}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Deployment Status */}
            {deploymentStatus.lastDeployment && (
              <div className={`mt-4 p-3 rounded ${
                deploymentStatus.lastDeployment.success
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <p className={`text-sm ${
                  deploymentStatus.lastDeployment.success ? 'text-green-300' : 'text-red-300'
                }`}>
                  {deploymentStatus.lastDeployment.message}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}