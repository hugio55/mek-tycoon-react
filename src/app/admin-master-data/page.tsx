'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import * as Switch from '@radix-ui/react-switch';
import MasterRangeSystem from '@/components/MasterRangeSystem';
import GameDataLightbox from '@/components/GameDataLightbox';
import StoryClimbConfig from '@/components/StoryClimbConfig';
import DifficultyAdminConfig from '@/components/DifficultyAdminConfig';
import BuffCategoriesAdmin from '@/components/BuffCategoriesAdmin';
import BuffCategoriesV2Admin from '@/components/BuffCategoriesV2Admin';
import MekBaseConfig from '@/components/MekBaseConfig';
import MekTalentTreeConfig from '@/components/MekTalentTreeConfig';
import MekDetailViewer from '@/components/MekDetailViewer';
import GoldBackupAdmin from '@/components/GoldBackupAdmin';
import WalletManagementAdmin from '@/components/WalletManagementAdmin';
import NftPurchasePlanner from '@/components/NftPurchasePlanner';
import VariationSearchTable from '@/components/VariationSearchTable';
import CommemorativeToken1Admin from '@/components/CommemorativeToken1Admin';
import SourceKeyMigrationAdmin from '@/components/SourceKeyMigrationAdmin';
import WhitelistManagerAdmin from '@/components/WhitelistManagerAdmin';
import NMKRJSONGenerator from '@/components/admin/nft/NMKRJSONGenerator';
import CampaignManager from '@/components/admin/campaign/CampaignManager';
import EssenceMarketAdmin from '@/components/EssenceMarketAdmin';
import OverlayEditor from '@/components/OverlayEditor';
import CometLoader from '@/components/loaders/CometLoader';
import TriangleKaleidoscope from '@/components/loaders/TriangleKaleidoscope';
import PreLoader from '@/components/loaders/PreLoader';
import AnimatedBorderButton from '@/components/loaders/AnimatedBorderButton';
import ProModeToggle from '@/components/controls/ProModeToggle';
import PowerSwitch from '@/components/controls/PowerSwitch';
import PowerSwitchToggle from '@/components/controls/PowerSwitchToggle';
import NebulaCheckbox from '@/components/controls/NebulaCheckbox';
import PowerButtonSwitch from '@/components/controls/PowerButtonSwitch';
import ColorToggleSwitch from '@/components/controls/ColorToggleSwitch';
import DottedToggleSwitch from '@/components/controls/DottedToggleSwitch';
import MechanicalToggle from '@/components/controls/MechanicalToggle';
import GlowToggle from '@/components/controls/GlowToggle';
import GlassButton from '@/components/controls/GlassButton';
import GlassButtonSharp from '@/components/controls/GlassButtonSharp';
import IsometricSocialButton from '@/components/controls/IsometricSocialButton';
import RadialSwitch from '@/components/RadialSwitch';
import CloseButton from '@/components/controls/CloseButton';
import DiscordButton from '@/components/controls/DiscordButton';
import GeneratingLoader from '@/components/loaders/GeneratingLoader';
import TextSwitch from '@/components/controls/TextSwitch';
import HoverTooltip from '@/components/controls/HoverTooltip';
import FillTextButton from '@/components/controls/FillTextButton';
import FloatingLabelInput from '@/components/controls/FloatingLabelInput';
import IndustrialFlipCard from '@/components/controls/IndustrialFlipCard';
import ClaudeManagerAdmin from '@/components/ClaudeManagerAdmin';
import { VARIATIONS_BY_TYPE } from '@/lib/completeVariationRarity';
import { variationsData } from '@/lib/variationsData';
import { getVariationTrueRank, VARIATION_MEK_RANKS } from '@/lib/variationRarityMekRanks';

// Helper function to format tenure as time duration
function formatTenureDuration(tenure: number, tenurePerSecond: number): string {
  if (tenure === 0) return '0 seconds';

  const totalSeconds = tenure / tenurePerSecond;
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0 && days === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

  return parts.join(' ') || '0 seconds';
}

// Story Climb Mechanics subsections
const STORY_CLIMB_SUBSECTIONS = [
  { id: 'difficulty-subsystem', name: 'Difficulty System', icon: '⚔️' },
  { id: 'duration-subsystem', name: 'Duration Configuration', icon: '⏱️' },
  { id: 'normal-mek-distribution', name: 'Normal Mek Distribution', icon: '🤖' },
  { id: 'chapter-rarity', name: 'Chapter Rarity Distribution', icon: '📊' },
  { id: 'mek-slots', name: 'Mek Slots Configuration', icon: '📋' },
  { id: 'node-fee', name: 'Node Fee Configuration', icon: '💰' },
  { id: 'event-node', name: 'Event Node Configuration', icon: '✨' },
  { id: 'nft-planning', name: 'NFT Purchase Planning', icon: '💎' },
  { id: 'boss-rewards', name: 'Mini Boss & Final Boss Rewards', icon: '🏆' },
  { id: 'normal-rewards', name: 'Normal Mek Node Rewards', icon: '🎁' }
];


// Data system definitions
const DATA_SYSTEMS = [
  { id: 'mek-systems', name: 'Mek Systems', icon: '⚙️', implemented: true },
  { id: 'mech-power-chips', name: 'Mech Power Chips', icon: '⚡', implemented: false },
  { id: 'universal-chips', name: 'Universal Power Chips', icon: '🔮', implemented: true },
  { id: 'buff-categories', name: 'Buff Categories', icon: '✨', implemented: true },
  { id: 'buff-categories-v2', name: 'Buff Categories V2', icon: '⚡', implemented: true },
  { id: 'story-climb-mechanics', name: 'Story Climb Mechanics', icon: '🏔️', implemented: false },
  { id: 'daily-recipes', name: 'Daily Recipes (Universal Chips)', icon: '📖', implemented: false },
  { id: 'salvage-materials', name: 'Salvage Materials', icon: '🔧', implemented: false },
  { id: 'circuitry-costs', name: 'Circuitry', icon: '💰', implemented: false },
  { id: 'mech-chip-recipes', name: 'Mech Chip Crafting Recipes', icon: '🔨', implemented: false },
  { id: 'single-missions', name: 'Single Missions Formulation', icon: '🎯', implemented: false },
  { id: 'global-game-data', name: 'Global Game Data', icon: '🌐', implemented: true },
  { id: 'market-system', name: 'Market', icon: '🏪', implemented: true },
  { id: 'offers-system', name: 'Offers System', icon: '💬', implemented: true },
  { id: 'variations', name: 'Variations', icon: '🎨', implemented: false },
  { id: 'slots-system', name: 'Slots', icon: '📦', implemented: true },
  { id: 'gold-backup-system', name: 'Gold Backup System', icon: '💾', implemented: true },
  { id: 'wallet-management', name: 'Player Management', icon: '👥', implemented: true },
  { id: 'sourcekey-migration', name: 'SourceKey Migration', icon: '🔧', implemented: true },
  { id: 'claude-manager', name: 'Claude Manager', icon: '🤖', implemented: true },
  { id: 'notification-system', name: 'Notification System', icon: '🔔', implemented: false },
  { id: 'nft-admin', name: 'NFT', icon: '🎨', implemented: true },
  { id: 'overlay-editor', name: 'Overlay Editor', icon: '🎯', implemented: true },
  { id: 'navigation-preview', name: 'Navigation', icon: '🧭', implemented: true },
  { id: 'components', name: 'Components', icon: '🧩', implemented: true }
];

export default function AdminMasterDataPage() {
  const convex = useConvex();

  // Site settings for landing page toggle
  const siteSettings = useQuery(api.siteSettings.getSiteSettings);
  const toggleLandingPage = useMutation(api.siteSettings.toggleLandingPage);
  const toggleIgnoreLocalhostRule = useMutation(api.siteSettings.toggleIgnoreLocalhostRule);

  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  // Initialize with static value to avoid hydration mismatch
  // Load from localStorage after mount (client-side only)
  const [activeTab, setActiveTab] = useState<string>('wallet-management');
  const [storyClimbSubTab, setStoryClimbSubTab] = useState<string>('difficulty-subsystem');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showGameDataLightbox, setShowGameDataLightbox] = useState(false);
  const [minimizedTabs, setMinimizedTabs] = useState<Set<string>>(new Set());
  const [tabOrder, setTabOrder] = useState<string[]>(DATA_SYSTEMS.map(sys => sys.id));
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [systemCompletion, setSystemCompletion] = useState<Record<string, 'incomplete' | 'in-progress' | 'complete'>>({});

  // Save system state
  const [isSaving, setIsSaving] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Market configuration state
  const [marketConfig, setMarketConfig] = useState({
    durationCosts: {
      '1': 100,
      '3': 200,
      '7': 500,
      '14': 800,
      '30': 1500
    },
    baseListingFee: 2,
    minListingPrice: 1,
    minEssenceAmount: 0.1
  });

  // Variation buff mutations
  const applyBuffsToVariations = useMutation(api.variationBuffs.applyBuffsToVariations);
  const saveBuffConfiguration = useMutation(api.variationBuffs.saveBuffConfiguration);
  const buffConfig = useQuery(api.variationBuffs.getBuffConfiguration);
  const variationBuffs = useQuery(api.variationBuffs.getVariationBuffs);

  // Tenure configuration query
  const tenureBaseRateData = useQuery(api.tenureConfig.getBaseRate);
  const tenurePerSecond = tenureBaseRateData?.baseRate || 1.0;

  // Navigation Preview State (must be declared before useQuery that uses it)
  const [selectedNavigationOverlay, setSelectedNavigationOverlay] = useState<string>('');
  const [navigationScale, setNavigationScale] = useState<number>(1);
  const [navigationStatusMessage, setNavigationStatusMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Duration configuration queries and mutations
  const saveDurationConfig = useMutation(api.durationConfigs.saveDurationConfig);
  const updateDurationConfig = useMutation(api.durationConfigs.updateDurationConfig);
  const deployDurationConfig = useMutation(api.durationConfigs.deployDurationConfig);
  const deleteDurationConfig = useMutation(api.durationConfigs.deleteDurationConfig);
  const durationConfigsList = useQuery(api.durationConfigs.listDurationConfigs);
  const activeDurationConfig = useQuery(api.durationConfigs.getActiveDurationConfig);
  const allOverlays = useQuery(api.overlays.listOverlays);
  const selectedOverlayData = useQuery(
    api.overlays.getOverlay,
    selectedNavigationOverlay ? { imageKey: selectedNavigationOverlay } : "skip"
  );
  const saveNavigationConfig = useMutation(api.navigation.saveNavigationConfig);
  const deployNavigation = useMutation(api.navigation.deployNavigation);
  const deactivateNavigation = useMutation(api.navigation.deactivateNavigation);
  const navigationConfig = useQuery(api.navigation.getNavigationConfig);
  const activeNavigationConfig = useQuery(api.navigation.getActiveNavigationConfig);
  const [selectedConfigName, setSelectedConfigName] = useState<string>('');
  const [configNameInput, setConfigNameInput] = useState<string>('');
  const [durationConfigAutoLoaded, setDurationConfigAutoLoaded] = useState(false);

  // Variations System State
  const [variationsImageFolder, setVariationsImageFolder] = useState('');
  const [variationsSubSections, setVariationsSubSections] = useState<Set<string>>(new Set());
  const [buffPercentages, setBuffPercentages] = useState({
    minPercent: 5,
    maxPercent: 50,
    curveType: 'linear' as 'linear' | 'exponential' | 'logarithmic',
    curveFactor: 1.5
  });
  const [variationSearch, setVariationSearch] = useState('');
  const [selectedVariation, setSelectedVariation] = useState<{ name: string; rank: number; category: string } | null>(null);

  // Slots System State
  const [selectedSlotType, setSelectedSlotType] = useState<'basic' | 'advanced' | 'master'>('basic');
  const [slotsConfig, setSlotsConfig] = useState({
    basic: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    advanced: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    master: [0, 0, 0, 0, 0, 0, 0, 0, 0]
  });
  const [slotRoundingOption, setSlotRoundingOption] = useState<10 | 100 | 1000>(10);
  const [slotCurveFactor, setSlotCurveFactor] = useState<number>(1.0); // 1.0 = linear, >1 = exponential

  // Slot Configuration Save/Load State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [mounted, setMounted] = useState(false);

  // Component demo states
  const [mechanicalToggleChecked, setMechanicalToggleChecked] = useState(false);
  const [powerSwitchToggleChecked, setPowerSwitchToggleChecked] = useState(false);
  const [radialSwitchIndex, setRadialSwitchIndex] = useState(0);

  // Query saved slot configurations
  const savedConfigurations = useQuery(api.slotConfigurations.listSlotConfigurations);

  // Mutations for save/load/delete
  const saveConfiguration = useMutation(api.slotConfigurations.saveSlotConfiguration);
  const loadConfiguration = useMutation(api.slotConfigurations.loadSlotConfiguration);
  const deleteConfiguration = useMutation(api.slotConfigurations.deleteSlotConfiguration);

  // Page Loader Toggle State
  const [pageLoaderDisabled, setPageLoaderDisabled] = useState(false);
  const [loaderStatusMessage, setLoaderStatusMessage] = useState<{ type: 'success' | 'info', text: string } | null>(null);

  // Client-side mounting check for portal
  useEffect(() => {
    setMounted(true);

    // Load page loader preference from localStorage
    if (typeof window !== 'undefined') {
      const storedValue = localStorage.getItem('disablePageLoader');
      setPageLoaderDisabled(storedValue === 'true');
    }
  }, []);

  // Interpolate slot values between first and last
  const interpolateSlotValues = () => {
    const firstValue = slotsConfig[selectedSlotType][0];
    const lastValue = slotsConfig[selectedSlotType][8];

    const newValues = Array.from({ length: 9 }, (_, index) => {
      if (index === 0) return firstValue;
      if (index === 8) return lastValue;

      // Exponential interpolation based on curve factor
      const t = index / 8; // Progress from 0 to 1
      const curvedT = Math.pow(t, slotCurveFactor); // Apply exponential curve
      const interpolated = firstValue + (lastValue - firstValue) * curvedT;

      // Round to selected option
      const rounded = Math.round(interpolated / slotRoundingOption) * slotRoundingOption;
      return rounded;
    });

    setSlotsConfig(prev => ({
      ...prev,
      [selectedSlotType]: newValues
    }));
  };

  // Handle save configuration
  const handleSaveConfiguration = async () => {
    if (!saveName.trim()) {
      alert('Please enter a configuration name');
      return;
    }

    try {
      await saveConfiguration({
        name: saveName.trim(),
        basicSlot: slotsConfig.basic,
        advancedSlot: slotsConfig.advanced,
        masterSlot: slotsConfig.master,
        curveFactor: slotCurveFactor,
        roundingOption: slotRoundingOption,
      });

      setShowSaveModal(false);
      setSaveName('');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle load configuration
  const handleLoadConfiguration = async (configId: any) => {
    try {
      const config = savedConfigurations?.find(c => c._id === configId);
      if (!config) {
        alert('Configuration not found');
        return;
      }

      // Update local state with saved values
      setSlotsConfig({
        basic: config.basicSlot,
        advanced: config.advancedSlot,
        master: config.masterSlot,
      });
      setSlotCurveFactor(config.curveFactor);
      setSlotRoundingOption(config.roundingOption as 10 | 100 | 1000);

      // Mark as active in database
      await loadConfiguration({ configId });
    } catch (error) {
      console.error('Failed to load configuration:', error);
      alert(`Failed to load: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle delete configuration
  const handleDeleteConfiguration = async (configId: any, configName: string) => {
    if (!confirm(`Are you sure you want to delete "${configName}"?`)) {
      return;
    }

    try {
      await deleteConfiguration({ configId, setOtherActive: true });
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      alert(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Lock body scroll when save modal is open
  useEffect(() => {
    if (showSaveModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSaveModal]);

  // Create ordered DATA_SYSTEMS array based on saved order
  const orderedDataSystems = useMemo(() => {
    return tabOrder
      .map(id => DATA_SYSTEMS.find(sys => sys.id === id))
      .filter((sys): sys is typeof DATA_SYSTEMS[0] => sys !== undefined);
  }, [tabOrder]);

  // Update buff percentages from database when loaded
  useEffect(() => {
    if (buffConfig) {
      setBuffPercentages({
        minPercent: buffConfig.minPercent,
        maxPercent: buffConfig.maxPercent,
        curveType: buffConfig.curveType,
        curveFactor: buffConfig.curveFactor
      });
    }
  }, [buffConfig]);

  // Save active tab to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('admin-master-data-active-tab', activeTab);
    } catch (error) {
      console.error('Failed to save active tab to localStorage:', error);
    }
  }, [activeTab]);

  // Auto-load the most recent duration configuration
  useEffect(() => {
    const loadMostRecentConfig = async () => {
      if (!durationConfigAutoLoaded && durationConfigsList && durationConfigsList.length > 0 && convex) {
        // Find the most recent config (first in the list since they're sorted by creation time desc)
        const mostRecentConfig = durationConfigsList[0];

        try {
          const loadedConfig = await convex.query(api.durationConfigs.loadDurationConfig, {
            name: mostRecentConfig.name
          });

          if (loadedConfig) {
            setDurationSettings({
              normal: loadedConfig.normal,
              challenger: loadedConfig.challenger,
              miniboss: loadedConfig.miniboss,
              event: loadedConfig.event,
              finalboss: loadedConfig.finalboss,
            });
            setSelectedConfigName(mostRecentConfig.name);
            setConfigNameInput(mostRecentConfig.name);
            setDurationConfigAutoLoaded(true);
            console.log(`Auto-loaded duration configuration: ${mostRecentConfig.name}`);
          }
        } catch (error) {
          console.error('Failed to auto-load duration configuration:', error);
        }
      }
    };

    loadMostRecentConfig();
  }, [durationConfigsList, durationConfigAutoLoaded, convex]);


  // Load variations folder path and active tab from localStorage on mount
  useEffect(() => {
    // Load active tab (fixes hydration mismatch)
    const savedTab = localStorage.getItem('admin-master-data-active-tab');
    if (savedTab) {
      setActiveTab(savedTab);
    }

    const savedPath = localStorage.getItem('variationsImageFolder');
    if (savedPath) {
      setVariationsImageFolder(savedPath);
    }

    // Load minimized tabs
    const savedMinimized = localStorage.getItem('adminMinimizedTabs');
    if (savedMinimized) {
      try {
        const parsed = JSON.parse(savedMinimized);
        setMinimizedTabs(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse minimized tabs:', e);
      }
    }

    // Load tab order
    const savedOrder = localStorage.getItem('adminTabOrder');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        // Validate that all current tabs are in the saved order
        const currentTabIds = DATA_SYSTEMS.map(sys => sys.id);
        const validOrder = parsed.filter((id: string) => currentTabIds.includes(id));
        // Add any new tabs that weren't in the saved order
        const missingTabs = currentTabIds.filter(id => !validOrder.includes(id));
        setTabOrder([...validOrder, ...missingTabs]);
      } catch (e) {
        console.error('Failed to parse tab order:', e);
      }
    }
  }, []);

  // Save variations folder path when it changes
  const handleVariationsFolderChange = (path: string) => {
    setVariationsImageFolder(path);
    localStorage.setItem('variationsImageFolder', path);
  };

  // Minimize/Restore tab handlers
  const handleMinimizeTab = (tabId: string) => {
    const newMinimized = new Set(minimizedTabs);
    newMinimized.add(tabId);
    setMinimizedTabs(newMinimized);
    localStorage.setItem('adminMinimizedTabs', JSON.stringify(Array.from(newMinimized)));

    // If we're minimizing the active tab, switch to the first non-minimized tab
    if (activeTab === tabId) {
      const firstVisibleTab = orderedDataSystems.find(sys => !newMinimized.has(sys.id));
      if (firstVisibleTab) {
        setActiveTab(firstVisibleTab.id);
      }
    }
  };

  const handleRestoreTab = (tabId: string) => {
    const newMinimized = new Set(minimizedTabs);
    newMinimized.delete(tabId);
    setMinimizedTabs(newMinimized);
    localStorage.setItem('adminMinimizedTabs', JSON.stringify(Array.from(newMinimized)));

    // Switch to the restored tab
    setActiveTab(tabId);
  };

  // Drag-and-drop handlers for tab reordering
  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();

    if (!draggedTabId || draggedTabId === targetTabId) {
      setDraggedTabId(null);
      return;
    }

    const newOrder = [...tabOrder];
    const draggedIndex = newOrder.indexOf(draggedTabId);
    const targetIndex = newOrder.indexOf(targetTabId);

    // Remove dragged item and insert at new position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedTabId);

    setTabOrder(newOrder);
    localStorage.setItem('adminTabOrder', JSON.stringify(newOrder));
    setDraggedTabId(null);
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
  };

  // Navigation configuration handlers
  const handleSaveNavigationConfig = async () => {
    if (!selectedNavigationOverlay) {
      setNavigationStatusMessage({ type: 'error', text: 'Please select an overlay first' });
      setTimeout(() => setNavigationStatusMessage(null), 3000);
      return;
    }

    try {
      setNavigationStatusMessage({ type: 'info', text: 'Saving configuration...' });
      const result = await saveNavigationConfig({
        overlayImageKey: selectedNavigationOverlay,
        scale: navigationScale,
      });
      setNavigationStatusMessage({
        type: 'success',
        text: `Configuration ${result.action}! Click "Deploy to Site" to make it active.`
      });
      setTimeout(() => setNavigationStatusMessage(null), 5000);
    } catch (error) {
      console.error('Failed to save navigation config:', error);
      setNavigationStatusMessage({ type: 'error', text: 'Failed to save configuration' });
      setTimeout(() => setNavigationStatusMessage(null), 3000);
    }
  };

  const handleDeployNavigation = async () => {
    try {
      setNavigationStatusMessage({ type: 'info', text: 'Deploying navigation...' });
      const result = await deployNavigation({});
      setNavigationStatusMessage({ type: 'success', text: result.message });
      setTimeout(() => setNavigationStatusMessage(null), 5000);
    } catch (error: any) {
      console.error('Failed to deploy navigation:', error);
      setNavigationStatusMessage({
        type: 'error',
        text: error.message || 'Failed to deploy navigation'
      });
      setTimeout(() => setNavigationStatusMessage(null), 3000);
    }
  };

  const handleDeactivateNavigation = async () => {
    try {
      setNavigationStatusMessage({ type: 'info', text: 'Deactivating navigation...' });
      const result = await deactivateNavigation({});
      setNavigationStatusMessage({ type: 'success', text: result.message });
      setTimeout(() => setNavigationStatusMessage(null), 5000);
    } catch (error) {
      console.error('Failed to deactivate navigation:', error);
      setNavigationStatusMessage({ type: 'error', text: 'Failed to deactivate navigation' });
      setTimeout(() => setNavigationStatusMessage(null), 3000);
    }
  };

  // Handle creating a new save
  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: 'info', text: 'Creating save backup...' });

    try {
      const now = new Date();
      const saveName = `Save_${now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}_${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '')}`.replace(/[,\s]/g, '_');

      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName,
          description: `Automatic save on ${now.toLocaleString()}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: `Save created successfully! ${result.filesCount} files backed up.` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating save: ' + (error instanceof Error ? error.message : 'Unknown error') });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle git commit
  const handleCommit = async () => {
    setIsCommitting(true);
    setMessage({ type: 'info', text: 'Creating git commit...' });

    try {
      const response = await fetch('/api/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Save state: ${new Date().toLocaleString()}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: `Git commit created successfully! ${result.message}` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create git commit' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating commit: ' + (error instanceof Error ? error.message : 'Unknown error') });
    } finally {
      setIsCommitting(false);
    }
  };

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);


  // Duration Configuration State
  const [selectedNodeType, setSelectedNodeType] = useState<'normal' | 'challenger' | 'miniboss' | 'event' | 'finalboss'>('normal');
  const [durationSettings, setDurationSettings] = useState({
    normal: {
      min: { days: 0, hours: 0, minutes: 0, seconds: 30 },
      max: { days: 0, hours: 0, minutes: 5, seconds: 0 },
      curve: 1.5
    },
    challenger: {
      min: { days: 0, hours: 0, minutes: 3, seconds: 0 },
      max: { days: 0, hours: 0, minutes: 8, seconds: 0 },
      curve: 1.5
    },
    miniboss: {
      min: { days: 0, hours: 0, minutes: 5, seconds: 0 },
      max: { days: 0, hours: 0, minutes: 15, seconds: 0 },
      curve: 1.5
    },
    event: {
      min: { days: 0, hours: 0, minutes: 5, seconds: 0 },
      max: { days: 0, hours: 0, minutes: 50, seconds: 0 },
      curve: 1.5
    },
    finalboss: {
      min: { days: 0, hours: 0, minutes: 10, seconds: 0 },
      max: { days: 0, hours: 0, minutes: 30, seconds: 0 },
      curve: 1.5
    }
  });

  // Helper function to convert time components to total seconds
  const timeToSeconds = (time: { days: number, hours: number, minutes: number, seconds: number }): number => {
    return (time.days * 86400) + (time.hours * 3600) + (time.minutes * 60) + time.seconds;
  };

  // Helper function to format duration for display
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  };

  const toggleSection = (sectionId: string) => {
    // List of known subsection IDs
    const subsectionIds = [
      'mek-base-config',
      'mek-talent-tree',
      'mek-detail-viewer',
      'difficulty-subsystem',
      'duration-subsystem',
      'buff-categories-sub',
      'variations-image-sync',
      'variations-search',
      'variations-buff-assignment'
    ];

    const isSubsection = subsectionIds.includes(sectionId);

    if (isSubsection) {
      // For subsections, keep the parent section open and just toggle the subsection
      const newExpanded = new Set(expandedSections);
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }
      setExpandedSections(newExpanded);
    } else {
      // For main sections, only allow one open at a time
      const newExpanded = new Set<string>();
      if (!expandedSections.has(sectionId)) {
        newExpanded.add(sectionId);
        // Also close all subsections when closing a main section
      }
      setExpandedSections(newExpanded);
    }
  };

  const navigateToSection = (sectionId: string) => {
    // Only expand this section (close others)
    const newExpanded = new Set<string>();
    newExpanded.add(sectionId);
    setExpandedSections(newExpanded);

    // Scroll to section after a brief delay for expansion animation
    setTimeout(() => {
      const element = document.getElementById(`section-${sectionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSystemRightClick = (e: React.MouseEvent, systemId: string) => {
    e.preventDefault();
    // Cycle through states: incomplete -> in-progress -> complete -> incomplete
    setSystemCompletion(prev => {
      const current = prev[systemId];
      let next: 'incomplete' | 'in-progress' | 'complete' = 'incomplete';
      if (current === 'incomplete') next = 'in-progress';
      else if (current === 'in-progress') next = 'complete';
      else next = 'incomplete';
      return { ...prev, [systemId]: next };
    });
  };

  const handleTogglePageLoader = () => {
    const newValue = !pageLoaderDisabled;
    setPageLoaderDisabled(newValue);

    if (typeof window !== 'undefined') {
      localStorage.setItem('disablePageLoader', newValue.toString());
    }

    setLoaderStatusMessage({
      type: 'success',
      text: newValue
        ? 'Page loader DISABLED. Refresh the page to see the change.'
        : 'Page loader ENABLED. Refresh the page to see the change.'
    });

    // Clear message after 5 seconds
    setTimeout(() => {
      setLoaderStatusMessage(null);
    }, 5000);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-500 mb-2 font-orbitron tracking-wider">
          MASTER DATA SYSTEMS
        </h1>
        <p className="text-gray-400 mb-4">Centralized procedural generation and game balance control</p>

        {/* Landing Page Toggles - Compact */}
        <div className="mb-4 flex gap-4">
          {/* Main Landing Page Toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2">
            <span className="text-sm font-semibold text-gray-300">Landing Page</span>
            <Switch.Root
              checked={siteSettings?.landingPageEnabled ?? false}
              onCheckedChange={async (enabled) => {
                await toggleLandingPage({ enabled });
              }}
              className="w-11 h-6 bg-gray-700 rounded-full relative data-[state=checked]:bg-yellow-500 transition-colors"
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
            <span className={`text-xs font-bold ${siteSettings?.landingPageEnabled ? 'text-yellow-400' : 'text-gray-400'}`}>
              {siteSettings?.landingPageEnabled ? 'ON' : 'OFF'}
            </span>
          </div>

          {/* Ignore Localhost Rule Toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-900/50 border border-blue-700/50 rounded-lg px-4 py-2">
            <span className="text-sm font-semibold text-blue-300">Ignore Localhost Rule</span>
            <Switch.Root
              checked={siteSettings?.ignoreLocalhostRule ?? false}
              onCheckedChange={async (enabled) => {
                await toggleIgnoreLocalhostRule({ enabled });
              }}
              className="w-11 h-6 bg-gray-700 rounded-full relative data-[state=checked]:bg-blue-500 transition-colors"
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
            <span className={`text-xs font-bold ${siteSettings?.ignoreLocalhostRule ? 'text-blue-400' : 'text-gray-400'}`}>
              {siteSettings?.ignoreLocalhostRule ? 'ON' : 'OFF'}
            </span>
            <span className="text-xs text-gray-500">(force landing page on localhost)</span>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' ? 'bg-green-900/20 border-green-500 text-green-400' :
            message.type === 'error' ? 'bg-red-900/20 border-red-500 text-red-400' :
            'bg-blue-900/20 border-blue-500 text-blue-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Quick Save & Commit Buttons */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-yellow-400 mb-1">Quick Save & Commit</h2>
              <p className="text-xs text-gray-400">Create backups and git commits of your code</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  isSaving
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-600 hover:to-yellow-700 shadow-lg hover:shadow-yellow-500/30 hover:scale-105'
                }`}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⚙️</span>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    💾 <span>SAVE NOW</span>
                  </span>
                )}
              </button>

              <button
                onClick={handleCommit}
                disabled={isCommitting}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  isCommitting
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-green-500/30 hover:scale-105'
                }`}
              >
                {isCommitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⚙️</span>
                    Committing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    📝 <span>GIT COMMIT</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Page Loader Toggle - Radix UI Switch */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-2 mb-6 inline-flex items-center gap-3">
          <label htmlFor="page-loader-switch" className="text-sm font-bold text-blue-400 cursor-pointer">
            Page Loader
          </label>
          <Switch.Root
            id="page-loader-switch"
            checked={!pageLoaderDisabled}
            onCheckedChange={handleTogglePageLoader}
            className="w-11 h-6 bg-gray-700 rounded-full relative data-[state=checked]:bg-green-600 transition-colors"
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
          </Switch.Root>
          <span className={`text-xs font-bold ${pageLoaderDisabled ? 'text-red-400' : 'text-green-400'}`}>
            {pageLoaderDisabled ? 'OFF' : 'ON'}
          </span>
        </div>

        {/* Tab Navigation for All Systems */}
        <div className="bg-black/50 backdrop-blur border-2 border-yellow-500/30 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap gap-2">
            {orderedDataSystems.filter(system => !minimizedTabs.has(system.id)).map((system) => (
              <button
                key={system.id}
                draggable
                onDragStart={(e) => handleDragStart(e, system.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, system.id)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  setActiveTab(system.id);
                  // Reset story climb sub-tab to default when switching to Story Climb Mechanics
                  if (system.id === 'story-climb-mechanics') {
                    setStoryClimbSubTab('difficulty-subsystem');
                  }
                  // Reset player management sub-tab to default when switching to Player Management
                  if (system.id === 'wallet-management') {
                  }
                  // Auto-expand all subsections for this system
                  const subsections = {
                    'mek-systems': ['mek-base-config', 'mek-talent-tree', 'mek-detail-viewer'],
                    'story-climb-mechanics': ['difficulty-subsystem', 'duration-subsystem'],
                    'variations': ['variations-image-sync', 'variations-search', 'variations-buff-assignment']
                  };
                  const sectionsToExpand = [system.id, ...(subsections[system.id as keyof typeof subsections] || [])];
                  setExpandedSections(new Set(sectionsToExpand));
                }}
                className={`group relative px-4 py-2 rounded-lg border-2 transition-all text-sm font-semibold cursor-move ${
                  draggedTabId === system.id
                    ? 'opacity-50 scale-95'
                    : activeTab === system.id
                    ? 'border-yellow-400 bg-yellow-900/30 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                    : 'border-gray-600 bg-gray-800/30 text-gray-400 hover:border-yellow-500/50 hover:bg-yellow-900/20'
                }`}
              >
                <span className="mr-2">{system.icon}</span>
                {system.name}

                {/* Minimize button - appears on hover */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMinimizeTab(system.id);
                  }}
                  className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 rounded-full bg-gray-700 hover:bg-red-500 flex items-center justify-center text-[10px] text-white cursor-pointer"
                  title="Minimize tab"
                >
                  ×
                </span>
              </button>
            ))}
          </div>

          {/* Minimized Tabs Section */}
          {minimizedTabs.size > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Minimized:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {orderedDataSystems.filter(system => minimizedTabs.has(system.id)).map((system) => (
                  <button
                    key={system.id}
                    onClick={() => handleRestoreTab(system.id)}
                    className="group relative w-6 h-6 rounded-full bg-gray-800/50 border border-gray-600/50 hover:border-yellow-500/50 hover:bg-yellow-900/20 transition-all flex items-center justify-center"
                    title={`Restore: ${system.name}`}
                  >
                    <span className="text-xs opacity-60 group-hover:opacity-100">{system.icon}</span>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 border border-yellow-500/30 rounded text-xs text-yellow-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                      {system.name}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-yellow-500/30"></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Data Systems Sections */}
        <div className="space-y-4">
          {/* Mek Systems */}
          {activeTab === 'mek-systems' && (
          <div id="section-mek-systems" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
              <div className="p-4">
                <p className="text-gray-400 mb-4">Configure core Mek systems including talent trees and base success rates</p>

                {/* Mek Base Configuration Subsection */}
                <div className="mb-4 ml-6 bg-black/70 border border-yellow-500/20 rounded">
                  <button
                    onClick={() => toggleSection('mek-base-config')}
                    className="w-full p-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      <h4 className="text-sm font-semibold text-yellow-300">Mek Base Configuration</h4>
                      <span className="px-2 py-0.5 bg-green-600/30 text-green-400 text-xs font-bold rounded">ACTIVE</span>
                    </div>
                    <span className="text-gray-400 text-sm">{expandedSections.has('mek-base-config') ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.has('mek-base-config') && (
                    <div className="p-4 border-t border-yellow-500/20">
                      <MekBaseConfig />
                    </div>
                  )}
                </div>

                {/* Talent Tree Nodes Subsection */}
                <div className="mb-4 ml-6 bg-black/70 border border-yellow-500/20 rounded">
                  <button
                    onClick={() => toggleSection('mek-talent-tree')}
                    className="w-full p-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌳</span>
                      <h4 className="text-sm font-semibold text-yellow-300">MEC Talent Tree Nodes</h4>
                      <span className="px-2 py-0.5 bg-green-600/30 text-green-400 text-xs font-bold rounded">ACTIVE</span>
                    </div>
                    <span className="text-gray-400 text-sm">{expandedSections.has('mek-talent-tree') ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.has('mek-talent-tree') && (
                    <div className="p-4 border-t border-yellow-500/20">
                      <p className="text-sm text-gray-400 mb-4">
                        Configure talent tree node buff values across different rarity tiers.
                        Set progression curves for gold, essence, XP, and other buff categories.
                      </p>
                      <MekTalentTreeConfig />
                    </div>
                  )}
                </div>

                {/* Mek Detail Viewer Subsection */}
                <div className="mb-4 ml-6 bg-black/70 border border-yellow-500/20 rounded">
                  <button
                    onClick={() => toggleSection('mek-detail-viewer')}
                    className="w-full p-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔍</span>
                      <h4 className="text-sm font-semibold text-yellow-300">Mek Detail Viewer</h4>
                      <span className="px-2 py-0.5 bg-green-600/30 text-green-400 text-xs font-bold rounded">ACTIVE</span>
                    </div>
                    <span className="text-gray-400 text-sm">{expandedSections.has('mek-detail-viewer') ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.has('mek-detail-viewer') && (
                    <div className="p-4 border-t border-yellow-500/20">
                      <p className="text-sm text-gray-400 mb-4">
                        Look up any Mek by number or rank to view detailed statistics including base gold rate,
                        variations, base success rate, and talent tree configuration.
                      </p>
                      <MekDetailViewer />
                    </div>
                  )}
                </div>

                {/* Additional Mek Systems can be added here */}
              </div>
          </div>
          )}

          {/* Mech Power Chips */}
          {activeTab === 'mech-power-chips' && (
          <div id="section-mech-power-chips" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
              <div className="p-4">
                <p className="text-gray-400 mb-4">Mech chip stats and rarity configuration</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
          </div>
          )}

          {/* Universal Power Chips */}
          {activeTab === 'universal-chips' && (
          <div id="section-universal-chips" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('universal-chips')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔮</span>
                <h3 className="text-xl font-bold text-yellow-400">Universal Power Chips</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('universal-chips') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('universal-chips') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">
                  Universal chip buff generation system with master ranges for all buff categories.
                  <span className="text-green-400 ml-2">✓ Migrated from chip-builder page</span>
                </p>
                <MasterRangeSystem
                  onApplyRanges={() => {
                    console.log('Universal chip ranges applied');
                  }}
                />
              </div>
            )}
          </div>
          )}

          {/* Buff Categories */}
          {activeTab === 'buff-categories' && (
          <div id="section-buff-categories" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('buff-categories')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <h3 className="text-xl font-bold text-yellow-400">Buff Categories</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('buff-categories') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('buff-categories') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">
                  Manage buff categories for chips, mechanisms, and game systems. Configure success rate curves and tier-specific buffs.
                </p>
                <BuffCategoriesAdmin />
              </div>
            )}
          </div>
          )}

          {/* Buff Categories V2 */}
          {activeTab === 'buff-categories-v2' && (
          <div id="section-buff-categories-v2" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('buff-categories-v2')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <h3 className="text-xl font-bold text-yellow-400">Buff Categories V2</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('buff-categories-v2') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('buff-categories-v2') && (
              <div className="p-4 border-t border-gray-700/50">
                <BuffCategoriesV2Admin />
              </div>
            )}
          </div>
          )}

          {/* Story Climb Mechanics */}
          {activeTab === 'story-climb-mechanics' && (
          <div id="section-story-climb-mechanics" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4">
                <p className="text-gray-400 mb-4">
                  Unified system for story progression, events, mechanisms, bosses, and final bosses.
                  Controls how mechanisms are distributed across story nodes.
                </p>

                {/* Story Climb Sub-Tab Navigation */}
                <div className="bg-black/70 border-2 border-blue-500/30 rounded-lg p-3 mb-4">
                  <div className="flex flex-wrap gap-2">
                    {STORY_CLIMB_SUBSECTIONS.map((subsection) => (
                      <button
                        key={subsection.id}
                        onClick={() => setStoryClimbSubTab(subsection.id)}
                        className={`px-3 py-1.5 rounded-lg border-2 transition-all text-xs font-semibold ${
                          storyClimbSubTab === subsection.id
                            ? 'border-blue-400 bg-blue-900/30 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                            : 'border-gray-600 bg-gray-800/30 text-gray-400 hover:border-blue-500/50 hover:bg-blue-900/20'
                        }`}
                      >
                        <span className="mr-1.5">{subsection.icon}</span>
                        {subsection.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty System Configuration Sub-section */}
                {storyClimbSubTab === 'difficulty-subsystem' && (
                <div className="bg-black/70 border border-yellow-500/20 rounded p-4">
                      <p className="text-gray-400 text-sm mb-3">
                        Configure difficulty levels for missions: success thresholds, reward multipliers, and slot counts.
                        Controls how Easy, Medium, and Hard difficulties affect gameplay balance.
                      </p>
                      <DifficultyAdminConfig />
                </div>
                )}

                {/* Duration Configuration Sub-section */}
                {storyClimbSubTab === 'duration-subsystem' && (
                <div className="bg-black/70 border border-blue-500/20 rounded p-4">
                      <p className="text-gray-400 text-sm mb-4">
                        Set mission duration ranges for each node type. Durations ascend as you progress up the tree—shortest missions at the bottom, longest at the top.
                      </p>

                      {/* Node Type Selector */}
                      <div className="mb-6">
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Select Node Type</label>
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            { id: 'normal', name: 'Normal Mechs', icon: '🤖' },
                            { id: 'challenger', name: 'Challenger Mechs', icon: '⚔️' },
                            { id: 'miniboss', name: 'Mini Bosses', icon: '👹' },
                            { id: 'event', name: 'Events', icon: '✨' },
                            { id: 'finalboss', name: 'Final Bosses', icon: '🐲' }
                          ].map((type) => (
                            <button
                              key={type.id}
                              onClick={() => setSelectedNodeType(type.id as any)}
                              className={`p-3 rounded-lg border transition-all text-center ${
                                selectedNodeType === type.id
                                  ? 'border-blue-400 bg-blue-900/30 text-blue-300'
                                  : 'border-gray-600 bg-gray-800/30 text-gray-400 hover:border-blue-500/50'
                              }`}
                            >
                              <div className="text-2xl mb-1">{type.icon}</div>
                              <div className="text-xs font-semibold">{type.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Duration Settings for Selected Type */}
                      <div className="bg-black/30 rounded-lg p-4 border border-gray-700">
                        <h5 className="text-sm font-bold text-blue-300 mb-4">
                          {selectedNodeType === 'normal' && 'Normal Mechs Duration'}
                          {selectedNodeType === 'challenger' && 'Challenger Mechs Duration'}
                          {selectedNodeType === 'miniboss' && 'Mini Bosses Duration'}
                          {selectedNodeType === 'event' && 'Events Duration'}
                          {selectedNodeType === 'finalboss' && 'Final Bosses Duration'}
                        </h5>

                        <div className="space-y-4 mb-4">
                          {/* Min Duration */}
                          <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                              Minimum Duration <span className="text-[10px] normal-case">(Bottom of tree - earliest)</span>
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Days</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].min.days}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      min: {
                                        ...prev[selectedNodeType].min,
                                        days: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Hours</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].min.hours}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      min: {
                                        ...prev[selectedNodeType].min,
                                        hours: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  max="23"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Minutes</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].min.minutes}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      min: {
                                        ...prev[selectedNodeType].min,
                                        minutes: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  max="59"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Seconds</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].min.seconds}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      min: {
                                        ...prev[selectedNodeType].min,
                                        seconds: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  max="59"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Max Duration */}
                          <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                              Maximum Duration <span className="text-[10px] normal-case">(Top of tree - latest)</span>
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Days</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].max.days}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      max: {
                                        ...prev[selectedNodeType].max,
                                        days: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Hours</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].max.hours}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      max: {
                                        ...prev[selectedNodeType].max,
                                        hours: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  max="23"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Minutes</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].max.minutes}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      max: {
                                        ...prev[selectedNodeType].max,
                                        minutes: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  max="59"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Seconds</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].max.seconds}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      max: {
                                        ...prev[selectedNodeType].max,
                                        seconds: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  max="59"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Curve Adjustment Slider */}
                        <div className="mb-4">
                          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                            Interpolation Curve: {durationSettings[selectedNodeType].curve.toFixed(1)}
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={durationSettings[selectedNodeType].curve}
                            onChange={(e) => setDurationSettings(prev => ({
                              ...prev,
                              [selectedNodeType]: {
                                ...prev[selectedNodeType],
                                curve: parseFloat(e.target.value)
                              }
                            }))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                            <span>Linear (0.5)</span>
                            <span>Balanced (1.5)</span>
                            <span>Exponential (3.0)</span>
                          </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-blue-900/20 rounded p-3 border border-blue-500/20">
                          <p className="text-xs text-blue-300 mb-2">Duration Progression Preview:</p>
                          <div className="space-y-1">
                            {[0, 0.25, 0.5, 0.75, 1].map((progress) => {
                              const settings = durationSettings[selectedNodeType];
                              const minSeconds = timeToSeconds(settings.min);
                              const maxSeconds = timeToSeconds(settings.max);
                              const interpolated = Math.pow(progress, settings.curve);
                              const durationSeconds = Math.round(
                                minSeconds + (maxSeconds - minSeconds) * interpolated
                              );
                              return (
                                <div key={progress} className="flex justify-between text-[11px]">
                                  <span className="text-gray-400">
                                    {progress === 0 ? 'Bottom' : progress === 1 ? 'Top' : `${(progress * 100).toFixed(0)}% up`}:
                                  </span>
                                  <span className="text-blue-400 font-semibold">
                                    {formatDuration(durationSeconds)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Important Note */}
                        <div className="mt-4 p-3 bg-yellow-900/20 rounded border border-yellow-500/30">
                          <p className="text-[11px] text-yellow-400">
                            <strong>Important:</strong> Duration values ascend with tree progression. The first {selectedNodeType === 'event' ? 'event' : 'node'}
                            encountered will use the minimum duration, with subsequent ones progressively increasing toward the maximum based on their position in the tree.
                          </p>
                        </div>

                        {/* Configuration Management */}
                        <div className="mt-4 space-y-3">
                          {/* Config Name Input and Save/Update */}
                          <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                              Configuration Name
                            </label>
                            <div className="flex gap-2 mb-3">
                              <input
                                type="text"
                                value={configNameInput}
                                onChange={(e) => setConfigNameInput(e.target.value)}
                                placeholder="Enter configuration name..."
                                className="flex-1 px-3 py-2 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm placeholder-gray-500"
                              />
                              <button
                                onClick={async () => {
                                  if (!configNameInput.trim()) {
                                    alert('Please enter a configuration name');
                                    return;
                                  }
                                  try {
                                    await saveDurationConfig({
                                      name: configNameInput,
                                      normal: durationSettings.normal,
                                      challenger: durationSettings.challenger,
                                      miniboss: durationSettings.miniboss,
                                      event: durationSettings.event,
                                      finalboss: durationSettings.finalboss,
                                    });
                                    alert(`Configuration "${configNameInput}" saved successfully!`);
                                    setSelectedConfigName(configNameInput);
                                  } catch (error: any) {
                                    alert(error.message || 'Failed to save configuration');
                                  }
                                }}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={async () => {
                                  if (!configNameInput.trim()) {
                                    alert('Please enter a configuration name');
                                    return;
                                  }
                                  try {
                                    await updateDurationConfig({
                                      name: configNameInput,
                                      normal: durationSettings.normal,
                                      challenger: durationSettings.challenger,
                                      miniboss: durationSettings.miniboss,
                                      event: durationSettings.event,
                                      finalboss: durationSettings.finalboss,
                                    });
                                    alert(`Configuration "${configNameInput}" updated successfully!`);
                                  } catch (error: any) {
                                    alert(error.message || 'Failed to update configuration');
                                  }
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded transition-colors"
                              >
                                Update
                              </button>
                            </div>

                            {/* Load Configuration Dropdown */}
                            <div className="flex gap-2">
                              <select
                                value={selectedConfigName}
                                onChange={(e) => {
                                  setSelectedConfigName(e.target.value);
                                  setConfigNameInput(e.target.value);
                                }}
                                className="flex-1 px-3 py-2 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                              >
                                <option value="">Select a configuration to load...</option>
                                {durationConfigsList?.map(config => (
                                  <option key={config.name} value={config.name}>
                                    {config.name}
                                    {config.isActive && ' (Active)'}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={async () => {
                                  if (!selectedConfigName) {
                                    alert('Please select a configuration to load');
                                    return;
                                  }
                                  try {
                                    const loadedConfig = await convex.query(api.durationConfigs.loadDurationConfig, {
                                      name: selectedConfigName
                                    });
                                    if (loadedConfig) {
                                      setDurationSettings({
                                        normal: loadedConfig.normal,
                                        challenger: loadedConfig.challenger,
                                        miniboss: loadedConfig.miniboss,
                                        event: loadedConfig.event,
                                        finalboss: loadedConfig.finalboss,
                                      });
                                      setConfigNameInput(selectedConfigName);
                                      alert(`Configuration "${selectedConfigName}" loaded successfully!`);
                                    }
                                  } catch (error) {
                                    alert('Failed to load configuration');
                                  }
                                }}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded transition-colors"
                              >
                                Load
                              </button>
                              <button
                                onClick={async () => {
                                  if (!selectedConfigName) {
                                    alert('Please select a configuration to delete');
                                    return;
                                  }
                                  if (!confirm(`Are you sure you want to delete "${selectedConfigName}"?`)) {
                                    return;
                                  }
                                  try {
                                    await deleteDurationConfig({ name: selectedConfigName });
                                    alert(`Configuration "${selectedConfigName}" deleted successfully!`);
                                    setSelectedConfigName('');
                                    setConfigNameInput('');
                                  } catch (error: any) {
                                    alert(error.message || 'Failed to delete configuration');
                                  }
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Deploy Button */}
                          <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-lg p-4 border border-orange-500/50">
                            <h5 className="text-sm font-bold text-orange-300 mb-2">Deploy to Story Climb</h5>
                            <p className="text-xs text-gray-400 mb-3">
                              Push the currently loaded configuration to the Story Climb page. This will make it the active configuration for all players.
                            </p>
                            {activeDurationConfig && (
                              <p className="text-xs text-green-400 mb-3">
                                Currently deployed: <strong>{activeDurationConfig.name}</strong>
                              </p>
                            )}
                            <button
                              onClick={async () => {
                                if (!configNameInput.trim()) {
                                  alert('Please enter or load a configuration name first');
                                  return;
                                }
                                if (!confirm(`Deploy "${configNameInput}" to Story Climb? This will affect all active players.`)) {
                                  return;
                                }
                                try {
                                  // First save/update the configuration
                                  try {
                                    await updateDurationConfig({
                                      name: configNameInput,
                                      normal: durationSettings.normal,
                                      challenger: durationSettings.challenger,
                                      miniboss: durationSettings.miniboss,
                                      event: durationSettings.event,
                                      finalboss: durationSettings.finalboss,
                                    });
                                  } catch (e) {
                                    // If update fails, try save
                                    await saveDurationConfig({
                                      name: configNameInput,
                                      normal: durationSettings.normal,
                                      challenger: durationSettings.challenger,
                                      miniboss: durationSettings.miniboss,
                                      event: durationSettings.event,
                                      finalboss: durationSettings.finalboss,
                                    });
                                  }

                                  // Then deploy it
                                  await deployDurationConfig({ name: configNameInput });
                                  alert(`Configuration "${configNameInput}" deployed to Story Climb successfully!`);
                                } catch (error: any) {
                                  alert(error.message || 'Failed to deploy configuration');
                                }
                              }}
                              className="w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded transition-all shadow-lg hover:shadow-orange-500/30"
                            >
                              🚀 Deploy / Push to Story Climb
                            </button>
                          </div>
                        </div>
                      </div>
                </div>
                )}

                {/* NFT Purchase Planning */}
                {storyClimbSubTab === 'nft-planning' && (
                  <div className="bg-black/70 border border-gray-500/20 rounded p-4">
                    <NftPurchasePlanner />
                  </div>
                )}

                {/* Other Story Climb Subsections from StoryClimbConfig */}
                {(storyClimbSubTab === 'normal-mek-distribution' ||
                  storyClimbSubTab === 'chapter-rarity' ||
                  storyClimbSubTab === 'mek-slots' ||
                  storyClimbSubTab === 'node-fee' ||
                  storyClimbSubTab === 'event-node' ||
                  storyClimbSubTab === 'boss-rewards' ||
                  storyClimbSubTab === 'normal-rewards') && (
                  <div className="bg-black/70 border border-gray-500/20 rounded p-4">
                    <StoryClimbConfig
                      activeSection={storyClimbSubTab}
                      key={`${activeTab}-${storyClimbSubTab}`}
                    />
                  </div>
                )}
              </div>
          </div>
          )}

          {/* Daily Recipes */}
          {activeTab === 'daily-recipes' && (
          <div id="section-daily-recipes" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('daily-recipes')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📖</span>
                <h3 className="text-xl font-bold text-yellow-400">Daily Recipes (Universal Chips)</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('daily-recipes') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('daily-recipes') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Daily recipe rotation and requirements</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Salvage Materials */}
          {activeTab === 'salvage-materials' && (
          <div id="section-salvage-materials" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('salvage-materials')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔧</span>
                <h3 className="text-xl font-bold text-yellow-400">Salvage Materials</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('salvage-materials') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('salvage-materials') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Material types, rarity, and drop rates</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Circuitry */}
          {activeTab === 'circuitry-costs' && (
          <div id="section-circuitry-costs" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('circuitry-costs')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <h3 className="text-xl font-bold text-yellow-400">Circuitry</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('circuitry-costs') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('circuitry-costs') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Circuitry system configuration</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Mech Chip Crafting Recipes */}
          {activeTab === 'mech-chip-recipes' && (
          <div id="section-mech-chip-recipes" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('mech-chip-recipes')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔨</span>
                <h3 className="text-xl font-bold text-yellow-400">Mech Chip Crafting Recipes</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('mech-chip-recipes') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('mech-chip-recipes') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Recipe requirements and combinations</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Single Missions Formulation */}
          {activeTab === 'single-missions' && (
          <div id="section-single-missions" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('single-missions')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <h3 className="text-xl font-bold text-yellow-400">Single Missions Formulation</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('single-missions') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('single-missions') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Mission generation and reward balancing</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Market System */}
          {activeTab === 'market-system' && (
          <div id="section-market-system" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('market-system')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏪</span>
                <h3 className="text-xl font-bold text-yellow-400">Market</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('market-system') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('market-system') && (
              <div className="p-4 border-t border-gray-700/50 space-y-4">
                <p className="text-gray-400 mb-4">Essence marketplace configuration and listing fee management</p>

                {/* Listing Duration & Fees - Editable */}
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-yellow-400 mb-3">Listing Duration Options & Fees</h4>
                  <div className="grid grid-cols-5 gap-3">
                    {['1', '3', '7', '14', '30'].map((days) => (
                      <div key={days} className="bg-black/30 rounded p-3">
                        <div className="text-yellow-300 font-bold mb-2 text-center text-xs">
                          {days} DAY{days !== '1' ? 'S' : ''}
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={marketConfig.durationCosts[days as keyof typeof marketConfig.durationCosts]}
                            onChange={(e) => setMarketConfig(prev => ({
                              ...prev,
                              durationCosts: {
                                ...prev.durationCosts,
                                [days]: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-yellow-300 text-xs text-center font-mono focus:border-yellow-500 focus:outline-none"
                          />
                          <span className="text-gray-400 text-[10px]">g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-gray-400 bg-black/30 p-2 rounded">
                    <div className="text-yellow-400 font-semibold mb-1">Notes:</div>
                    <div>• Fees are deducted when listing is created</div>
                    <div>• Longer durations cost more but provide better visibility</div>
                    <div>• Expired listings are automatically removed</div>
                  </div>
                </div>

                {/* Market Configuration - Editable */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-blue-400 mb-3">Market Configuration</h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center bg-black/30 p-3 rounded">
                      <span className="text-gray-400">Base Listing Fee (%):</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={marketConfig.baseListingFee}
                          onChange={(e) => setMarketConfig(prev => ({
                            ...prev,
                            baseListingFee: parseFloat(e.target.value) || 0
                          }))}
                          className="w-20 bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-yellow-300 text-center font-mono focus:border-yellow-500 focus:outline-none"
                        />
                        <span className="text-yellow-300">%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-black/30 p-3 rounded">
                      <span className="text-gray-400">Min Listing Price:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={marketConfig.minListingPrice}
                          onChange={(e) => setMarketConfig(prev => ({
                            ...prev,
                            minListingPrice: parseInt(e.target.value) || 0
                          }))}
                          className="w-20 bg-black/50 border border-green-500/30 rounded px-2 py-1 text-green-300 text-center font-mono focus:border-green-500 focus:outline-none"
                        />
                        <span className="text-green-300">gold</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-black/30 p-3 rounded">
                      <span className="text-gray-400">Min Essence Amount:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={marketConfig.minEssenceAmount}
                          onChange={(e) => setMarketConfig(prev => ({
                            ...prev,
                            minEssenceAmount: parseFloat(e.target.value) || 0
                          }))}
                          className="w-20 bg-black/50 border border-blue-500/30 rounded px-2 py-1 text-blue-300 text-center font-mono focus:border-blue-500 focus:outline-none"
                        />
                        <span className="text-blue-300">essence</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Essence Market Management */}
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-purple-400 mb-3">Essence Market Management</h4>
                  <EssenceMarketAdmin />
                </div>
              </div>
            )}
          </div>
          )}

          {/* Offers System */}
          {activeTab === 'offers-system' && (
          <div id="section-offers-system" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('offers-system')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <h3 className="text-xl font-bold text-yellow-400">Offers System</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('offers-system') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('offers-system') && (
              <div className="p-4 border-t border-gray-700/50 space-y-4">
                <p className="text-gray-400 mb-4">Player-to-player offer negotiation and trade system</p>

                {/* Offer Window Criteria */}
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-orange-400 mb-3">Offer Window Interface</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h5 className="text-yellow-300 font-semibold text-xs">Required Fields</h5>
                      <div className="bg-black/30 rounded p-3 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Offer Amount:</span>
                          <span className="text-gray-300">Numeric input with validation</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Message (Optional):</span>
                          <span className="text-gray-300">140 char limit</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Expiration:</span>
                          <span className="text-gray-300">24h / 48h / 7d / 30d</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Bundle Items:</span>
                          <span className="text-gray-300">Multi-select up to 5</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="text-blue-300 font-semibold text-xs">Validation Rules</h5>
                      <div className="bg-black/30 rounded p-3 space-y-2 text-xs text-gray-400">
                        <div>✓ Min offer: 10% of listing price</div>
                        <div>✓ Max offer: 200% of listing price</div>
                        <div>✓ User must have sufficient funds</div>
                        <div>✓ Cannot offer on own items</div>
                        <div>✓ Max 3 active offers per item</div>
                        <div>✓ Cooldown: 5 min between offers</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Offer Status & Notifications */}
                <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-cyan-400 mb-3">Offer Management</h4>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-gray-300 font-semibold mb-1">Offer States</div>
                      <div className="space-y-1">
                        <div className="text-yellow-300">• Pending</div>
                        <div className="text-green-300">• Accepted</div>
                        <div className="text-red-300">• Rejected</div>
                        <div className="text-gray-500">• Expired</div>
                        <div className="text-blue-300">• Counter-offered</div>
                      </div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-gray-300 font-semibold mb-1">Notifications</div>
                      <div className="text-gray-500">
                        • New offer received<br/>
                        • Offer accepted/rejected<br/>
                        • Counter-offer made<br/>
                        • Offer expiring soon<br/>
                        • Outbid notification
                      </div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-gray-300 font-semibold mb-1">Quick Actions</div>
                      <div className="text-gray-500">
                        • Accept<br/>
                        • Reject<br/>
                        • Counter (±50%)<br/>
                        • Message buyer<br/>
                        • Block user
                      </div>
                    </div>
                  </div>
                </div>

                {/* Smart Pricing Suggestions */}
                <div className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-pink-400 mb-3">AI Offer Suggestions</h4>
                  <div className="text-xs space-y-2">
                    <div className="bg-black/30 rounded p-2">
                      <span className="text-gray-400">Fair Price Range:</span>
                      <span className="text-green-300 ml-2">Based on last 30 sales of similar items</span>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <span className="text-gray-400">Win Probability:</span>
                      <span className="text-yellow-300 ml-2">Calculate % chance seller accepts</span>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <span className="text-gray-400">Suggested Counter:</span>
                      <span className="text-blue-300 ml-2">AI-powered negotiation helper</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Variations */}
          {activeTab === 'variations' && (
          <div id="section-variations" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('variations')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎨</span>
                <h3 className="text-xl font-bold text-yellow-400">Variations</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('variations') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('variations') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Configure and manage Mek variations system</p>

                {/* Image Sync Configuration Subsection */}
                <div className="mb-4 bg-black/40 border border-purple-500/30 rounded-lg">
                  <button
                    onClick={() => toggleSection('variations-image-sync')}
                    className="w-full p-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🖼️</span>
                      <h4 className="text-md font-bold text-purple-400">Image Sync Configuration</h4>
                      <span className="px-2 py-0.5 bg-orange-600/30 text-orange-400 text-xs font-bold rounded">SETUP</span>
                    </div>
                    <span className="text-gray-400 text-sm">{expandedSections.has('variations-image-sync') ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.has('variations-image-sync') && (
                    <div className="p-4 border-t border-purple-500/20">
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
                            Folder Path
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={variationsImageFolder}
                              onChange={(e) => handleVariationsFolderChange(e.target.value)}
                              placeholder="e.g., C:\Assets\Mek-Variations or /public/images/variations"
                              className="flex-1 px-3 py-2 bg-black/50 border border-gray-600 rounded text-gray-300 placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                console.log('Browse for folder clicked');
                              }}
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-gray-300 transition-colors"
                            >
                              Browse
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Specify the folder containing variation images (heads, bodies, traits)
                          </p>
                        </div>

                        {variationsImageFolder && (
                          <div className="bg-black/30 rounded p-3 border border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-gray-400">Current Path:</span>
                              <span className="text-xs text-green-400">✓ Set</span>
                            </div>
                            <code className="text-xs text-yellow-300 break-all">{variationsImageFolder}</code>
                          </div>
                        )}

                        {/* Search Field */}
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
                            Search Variations
                          </label>
                          <input
                            type="text"
                            placeholder="Search by name, ID, or category..."
                            className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded text-gray-300 placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Variation Search & Browse Subsection */}
                <div className="mb-4 bg-black/40 border border-cyan-500/30 rounded-lg">
                  <button
                    onClick={() => toggleSection('variations-search')}
                    className="w-full p-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔍</span>
                      <h4 className="text-md font-bold text-cyan-400">Search & Browse All Variations</h4>
                      <span className="px-2 py-0.5 bg-green-600/30 text-green-400 text-xs font-bold rounded">288 VARIATIONS</span>
                    </div>
                    <span className="text-gray-400 text-sm">{expandedSections.has('variations-search') ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.has('variations-search') && (
                    <div className="p-4 border-t border-cyan-500/20">
                      <p className="text-sm text-gray-400 mb-4">
                        Search and filter all 291 variations by name, style, or group. Click on any style or group to filter results.
                      </p>
                      <VariationSearchTable />
                    </div>
                  )}
                </div>

                {/* Variation Buff Assignment Subsection */}
                <div className="mb-4 ml-6 bg-black/70 border border-yellow-500/20 rounded">
                  <button
                    onClick={() => toggleSection('variations-buff-assignment')}
                    className="w-full p-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💪</span>
                      <h4 className="text-sm font-semibold text-yellow-300">Variation Buff Percentages</h4>
                      <span className="px-2 py-0.5 bg-blue-600/30 text-blue-400 text-xs font-bold rounded">NEW</span>
                    </div>
                    <span className="text-gray-400 text-sm">{expandedSections.has('variations-buff-assignment') ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.has('variations-buff-assignment') && (
                    <div className="p-4 border-t border-yellow-500/20">
                      <p className="text-sm text-gray-400 mb-4">
                        Assign buff percentages to all 300+ variations based on rarity using min/max values with curve interpolation.
                      </p>

                      {/* Min/Max Configuration */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
                            Min Buff % (Common)
                          </label>
                          <input
                            type="number"
                            value={buffPercentages.minPercent}
                            onChange={(e) => setBuffPercentages(prev => ({ ...prev, minPercent: parseInt(e.target.value) || 5 }))}
                            min="0"
                            max="100"
                            className="w-full px-3 py-2 bg-gray-800 border border-yellow-500/30 rounded text-yellow-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
                            Max Buff % (Legendary)
                          </label>
                          <input
                            type="number"
                            value={buffPercentages.maxPercent}
                            onChange={(e) => setBuffPercentages(prev => ({ ...prev, maxPercent: parseInt(e.target.value) || 50 }))}
                            min="0"
                            max="100"
                            className="w-full px-3 py-2 bg-gray-800 border border-yellow-500/30 rounded text-yellow-400"
                          />
                        </div>
                      </div>

                      {/* Curve Type Selection */}
                      <div className="mb-4">
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                          Interpolation Curve
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['linear', 'exponential', 'logarithmic'].map((curve) => (
                            <button
                              key={curve}
                              onClick={() => setBuffPercentages(prev => ({ ...prev, curveType: curve as any }))}
                              className={`px-3 py-2 rounded border transition-all text-sm capitalize ${
                                buffPercentages.curveType === curve
                                  ? 'border-yellow-400 bg-yellow-900/30 text-yellow-300'
                                  : 'border-gray-600 bg-gray-800/30 text-gray-400 hover:border-yellow-500/50'
                              }`}
                            >
                              {curve}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Curve Factor (for exponential) */}
                      {buffPercentages.curveType === 'exponential' && (
                        <div className="mb-4">
                          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
                            Curve Factor
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="7"
                            step="0.1"
                            value={buffPercentages.curveFactor}
                            onChange={(e) => setBuffPercentages(prev => ({ ...prev, curveFactor: parseFloat(e.target.value) }))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Gentle (0.5)</span>
                            <span className="text-yellow-400">{buffPercentages.curveFactor.toFixed(1)}</span>
                            <span>Steep (7.0)</span>
                          </div>
                        </div>
                      )}

                      {/* Variation Search */}
                      <div className="bg-black/30 rounded p-4 border border-gray-700 mb-4">
                        <h5 className="text-sm font-bold text-cyan-300 mb-3">Search Specific Variation</h5>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={variationSearch}
                            onChange={(e) => setVariationSearch(e.target.value)}
                            placeholder="Search for a variation (e.g., Gold, Hacker, ???)..."
                            className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded text-gray-300 placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                          />

                          {/* Search Results */}
                          {variationSearch.length > 0 && (
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {(() => {
                                // Combine all variations and assign ranks based on rarity
                                const allVariationsData: any[] = [];

                                // Add all heads
                                VARIATIONS_BY_TYPE.heads.forEach((v, i) => {
                                  allVariationsData.push({
                                    ...v,
                                    category: 'head',
                                    rank: 0 // Will be assigned after sorting
                                  });
                                });

                                // Add all bodies
                                VARIATIONS_BY_TYPE.bodies.forEach((v, i) => {
                                  allVariationsData.push({
                                    ...v,
                                    category: 'body',
                                    rank: 0
                                  });
                                });

                                // Add all traits
                                VARIATIONS_BY_TYPE.traits.forEach((v, i) => {
                                  allVariationsData.push({
                                    ...v,
                                    category: 'item',
                                    rank: 0
                                  });
                                });

                                // Create a map of variation names to their copy counts and ranks
                                const copyCountMap: Record<string, number> = {};

                                // Add all heads with their copy counts
                                variationsData.heads.forEach((v, index) => {
                                  copyCountMap[v.name] = v.copies;
                                });

                                // Add bodies with their copy counts if available
                                if (variationsData.bodies) {
                                  variationsData.bodies.forEach((v) => {
                                    copyCountMap[v.name] = v.copies;
                                  });
                                }

                                // Add items with their copy counts if available
                                if (variationsData.items) {
                                  variationsData.items.forEach((v) => {
                                    copyCountMap[v.name] = v.copies;
                                  });
                                }

                                // Assign ranks based on copy count (fewer copies = lower rank = rarer)
                                allVariationsData.forEach((v) => {
                                  const copies = copyCountMap[v.name] || 50; // Default to 50 if not found
                                  // Invert: fewer copies = lower rank
                                  // 1 copy = rank ~1-10
                                  // 132 copies = rank ~300
                                  if (copies === 1) {
                                    v.rank = Math.floor(Math.random() * 10) + 1; // Rank 1-10 for 1-of-1s
                                  } else {
                                    v.rank = copies * 2.3; // Scale up for proper distribution
                                  }
                                });

                                // Sort by rank (lower rank = rarer)
                                allVariationsData.sort((a, b) => a.rank - b.rank);

                                const filtered = allVariationsData.filter(v =>
                                  v.name.toLowerCase().includes(variationSearch.toLowerCase())
                                ).slice(0, 10); // Show max 10 results

                                if (filtered.length === 0) {
                                  return (
                                    <div className="text-xs text-gray-500 italic px-2 py-1">
                                      No variations found matching "{variationSearch}"
                                    </div>
                                  );
                                }

                                return filtered.map((variation) => (
                                  <button
                                    key={`${variation.category}-${variation.name}`}
                                    onClick={() => {
                                      setSelectedVariation(variation);
                                      setVariationSearch('');
                                    }}
                                    className="w-full text-left px-2 py-1 bg-gray-800/30 hover:bg-gray-700/50 rounded transition-colors flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-gray-500 font-mono">#{variation.rank}</span>
                                      <span className="text-xs text-gray-300">{variation.name}</span>
                                      <span className="text-[10px] text-gray-500 uppercase">({variation.category})</span>
                                    </div>
                                  </button>
                                ));
                              })()}
                            </div>
                          )}

                          {/* Selected Variation Display */}
                          {selectedVariation && (
                            <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/50 rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h6 className="text-sm font-bold text-cyan-300">{selectedVariation.name}</h6>
                                  <span className="text-[10px] text-gray-400 uppercase">{selectedVariation.category} • Rank #{selectedVariation.rank}</span>
                                </div>
                                <button
                                  onClick={() => setSelectedVariation(null)}
                                  className="text-gray-500 hover:text-gray-300 text-xs"
                                >
                                  ✕
                                </button>
                              </div>

                              {(() => {
                                // Calculate buff percentage for selected variation
                                const totalVariations = 288;
                                const normalizedRank = selectedVariation.rank / totalVariations;
                                let interpolatedValue: number;

                                switch (buffPercentages.curveType) {
                                  case 'linear':
                                    interpolatedValue = normalizedRank;
                                    break;
                                  case 'exponential':
                                    interpolatedValue = Math.pow(normalizedRank, buffPercentages.curveFactor);
                                    break;
                                  case 'logarithmic':
                                    interpolatedValue = Math.log(1 + normalizedRank * 9) / Math.log(10);
                                    break;
                                  default:
                                    interpolatedValue = normalizedRank;
                                }

                                const buffPercent = Math.round(
                                  buffPercentages.minPercent +
                                  (buffPercentages.maxPercent - buffPercentages.minPercent) * interpolatedValue
                                );

                                // Determine rarity tier
                                let rarityTier = 'Common';
                                let tierColor = 'text-green-400';
                                if (buffPercent > 45) {
                                  rarityTier = 'Legendary';
                                  tierColor = 'text-red-400';
                                } else if (buffPercent > 35) {
                                  rarityTier = 'Epic';
                                  tierColor = 'text-orange-400';
                                } else if (buffPercent > 20) {
                                  rarityTier = 'Rare';
                                  tierColor = 'text-purple-400';
                                } else if (buffPercent > 10) {
                                  rarityTier = 'Uncommon';
                                  tierColor = 'text-blue-400';
                                }

                                return (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-400">Buff Percentage:</span>
                                      <span className={`text-2xl font-bold ${tierColor}`}>{buffPercent}%</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-xs text-gray-400">Rarity Tier:</span>
                                      <span className={`text-sm font-semibold ${tierColor}`}>{rarityTier}</span>
                                    </div>
                                    <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden mt-2">
                                      <div
                                        className={`h-full bg-gradient-to-r ${
                                          rarityTier === 'Legendary' ? 'from-red-600 to-red-400' :
                                          rarityTier === 'Epic' ? 'from-orange-600 to-orange-400' :
                                          rarityTier === 'Rare' ? 'from-purple-600 to-purple-400' :
                                          rarityTier === 'Uncommon' ? 'from-blue-600 to-blue-400' :
                                          'from-green-600 to-green-400'
                                        } transition-all duration-500`}
                                        style={{ width: `${(buffPercent / buffPercentages.maxPercent) * 100}%` }}
                                      />
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Live Sample Visualization */}
                      <div className="bg-black/30 rounded p-4 border border-gray-700 mb-4">
                        <h5 className="text-sm font-bold text-yellow-300 mb-3">
                          Complete Distribution (All {(() => {
                            let count = 0;
                            if (variationsData.heads) count += variationsData.heads.length;
                            if (variationsData.bodies) count += variationsData.bodies.length;
                            if (variationsData.traits) count += variationsData.traits.length;
                            return count;
                          })()} Variations)
                        </h5>
                        <div className="space-y-1 max-h-96 overflow-y-auto">
                          {(() => {
                            // Get ALL variations with their actual copy counts
                            const allVariationsWithCounts: any[] = [];

                            // Add all heads from variationsData
                            if (variationsData.heads) {
                              variationsData.heads.forEach(v => {
                                allVariationsWithCounts.push({
                                  name: v.name,
                                  copies: v.copies,
                                  category: 'head'
                                });
                              });
                            }

                            // Add all bodies from variationsData
                            if (variationsData.bodies) {
                              variationsData.bodies.forEach(v => {
                                allVariationsWithCounts.push({
                                  name: v.name,
                                  copies: v.copies,
                                  category: 'body'
                                });
                              });
                            }

                            // Add all traits (items) from variationsData
                            if (variationsData.traits) {
                              variationsData.traits.forEach(v => {
                                allVariationsWithCounts.push({
                                  name: v.name,
                                  copies: v.copies,
                                  category: 'trait'
                                });
                              });
                            }

                            // Sort primarily by copies (ascending = rarest first)
                            // For 1-of-1s, use Mek rank for tiebreaking
                            const sampleVariations = allVariationsWithCounts.sort((a, b) => {
                              if (a.copies !== b.copies) {
                                return a.copies - b.copies;
                              }
                              // For same copy count (especially 1-of-1s), use Mek rank if available
                              const aRank = getVariationTrueRank(a.name);
                              const bRank = getVariationTrueRank(b.name);
                              return aRank - bRank;
                            });

                            // Sort by copies (fewer = rarer = should appear first)
                            sampleVariations.sort((a, b) => a.copies - b.copies);

                            // Calculate rank based on copies and Mek ranks for tiebreaking
                            const variationsWithRanks = sampleVariations.map((v) => {
                              // Use the true rank function if available in our mapping
                              const trueRank = getVariationTrueRank(v.name);

                              // If not in mapping, calculate based on copies
                              const rank = trueRank !== 100 ? trueRank : (
                                v.copies === 1 ? 10 : // Unknown 1-of-1s get rank 10
                                20 + (v.copies * 2)    // Others get calculated rank
                              );

                              return { ...v, rank };
                            });

                            // Sort variations by rank for proper ordering
                            variationsWithRanks.sort((a, b) => a.rank - b.rank);

                            // Re-assign sequential ranks from 1 to N
                            variationsWithRanks.forEach((v, index) => {
                              v.rank = index + 1;
                            });

                            const totalVariations = variationsWithRanks.length;

                            return variationsWithRanks.map((variation) => {
                              // INVERTED: Lower rank (rarer) = HIGHER percentage
                              // Normalize rank: 0 = rarest, 1 = most common
                              const normalizedRank = (variation.rank - 1) / (totalVariations - 1);

                              // INVERT the interpolation
                              let interpolatedValue: number;

                              switch (buffPercentages.curveType) {
                                case 'linear':
                                  interpolatedValue = 1 - normalizedRank; // INVERTED
                                  break;
                                case 'exponential':
                                  interpolatedValue = 1 - Math.pow(normalizedRank, buffPercentages.curveFactor); // INVERTED
                                  break;
                                case 'logarithmic':
                                  interpolatedValue = 1 - (Math.log(1 + normalizedRank * 9) / Math.log(10)); // INVERTED
                                  break;
                                default:
                                  interpolatedValue = 1 - normalizedRank; // INVERTED
                              }

                              const buffPercent = Math.round(
                                buffPercentages.minPercent +
                                (buffPercentages.maxPercent - buffPercentages.minPercent) * interpolatedValue
                              );

                              // Determine color based on buff percentage
                              let colorClass = 'text-gray-400';
                              let bgClass = 'bg-gray-800/20';
                              if (buffPercent <= 10) {
                                colorClass = 'text-green-400';
                                bgClass = 'bg-green-900/20';
                              } else if (buffPercent <= 20) {
                                colorClass = 'text-blue-400';
                                bgClass = 'bg-blue-900/20';
                              } else if (buffPercent <= 35) {
                                colorClass = 'text-purple-400';
                                bgClass = 'bg-purple-900/20';
                              } else if (buffPercent <= 45) {
                                colorClass = 'text-orange-400';
                                bgClass = 'bg-orange-900/20';
                              } else {
                                colorClass = 'text-red-400';
                                bgClass = 'bg-red-900/20';
                              }

                              return (
                                <div key={`${variation.category}-${variation.name}`} className={`flex items-center justify-between px-2 py-1 rounded ${bgClass}`}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-500 font-mono">#{Math.round(variation.rank)}</span>
                                    <span className="text-xs text-gray-300">{variation.name}</span>
                                    <span className="text-[9px] text-gray-600">
                                      ({variation.copies} {variation.copies === 1 ? 'copy' : 'copies'})
                                      {variation.category && <span className="text-gray-700"> • {variation.category}</span>}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 bg-black/30 rounded-full h-2 overflow-hidden">
                                      <div
                                        className={`h-full ${bgClass.replace('/20', '/60')} transition-all duration-300`}
                                        style={{ width: `${(buffPercent / buffPercentages.maxPercent) * 100}%` }}
                                      />
                                    </div>
                                    <span className={`text-xs font-bold ${colorClass} w-10 text-right`}>{buffPercent}%</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="bg-black/30 rounded p-4 border border-gray-700">
                        <h5 className="text-sm font-bold text-yellow-300 mb-3">Rarity Distribution Preview</h5>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Common (70% of variations):</span>
                            <span className="text-green-400">{buffPercentages.minPercent}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Uncommon (20%):</span>
                            <span className="text-blue-400">
                              {Math.round(buffPercentages.minPercent + (buffPercentages.maxPercent - buffPercentages.minPercent) * 0.25)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Rare (7%):</span>
                            <span className="text-purple-400">
                              {Math.round(buffPercentages.minPercent + (buffPercentages.maxPercent - buffPercentages.minPercent) * 0.5)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Epic (2.5%):</span>
                            <span className="text-orange-400">
                              {Math.round(buffPercentages.minPercent + (buffPercentages.maxPercent - buffPercentages.minPercent) * 0.75)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Legendary (0.5%):</span>
                            <span className="text-red-400">{buffPercentages.maxPercent}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Apply Button */}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={async () => {
                            console.log('Applying buff percentages:', buffPercentages);

                            // Save configuration
                            await saveBuffConfiguration({
                              minPercent: buffPercentages.minPercent,
                              maxPercent: buffPercentages.maxPercent,
                              curveType: buffPercentages.curveType,
                              curveFactor: buffPercentages.curveFactor
                            });

                            // Apply to all variations
                            const result = await applyBuffsToVariations({
                              minPercent: buffPercentages.minPercent,
                              maxPercent: buffPercentages.maxPercent,
                              curveType: buffPercentages.curveType,
                              curveFactor: buffPercentages.curveFactor
                            });

                            console.log('Applied buffs to variations:', result);
                          }}
                          className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded transition-colors"
                        >
                          Apply to All Variations
                        </button>
                        <button
                          onClick={() => {
                            console.log('Variation buffs:', variationBuffs);
                          }}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-gray-300 transition-colors"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Placeholder for future features */}
                <div className="bg-gray-800/20 rounded p-4 border border-gray-700/30">
                  <p className="text-sm text-gray-500">Additional variation features will be added here...</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Slots System */}
          {activeTab === 'slots-system' && (
          <div id="section-slots-system" className="bg-black/50 backdrop-blur border-2 border-yellow-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('slots-system')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <h3 className="text-xl font-bold text-yellow-400">Slots System</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('slots-system') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('slots-system') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Configure tenure requirements for slot leveling across all slot types</p>

                {/* Slot Type Selector - Button Group */}
                <div className="mb-6">
                  <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                    Slot Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedSlotType('basic')}
                      className={`flex-1 px-4 py-3 font-bold uppercase tracking-wider transition-all ${
                        selectedSlotType === 'basic'
                          ? 'bg-green-500/30 border-2 border-green-500 text-green-400'
                          : 'bg-black/50 border-2 border-gray-600/50 text-gray-400 hover:border-green-500/50'
                      }`}
                    >
                      Basic
                    </button>
                    <button
                      onClick={() => setSelectedSlotType('advanced')}
                      className={`flex-1 px-4 py-3 font-bold uppercase tracking-wider transition-all ${
                        selectedSlotType === 'advanced'
                          ? 'bg-blue-500/30 border-2 border-blue-500 text-blue-400'
                          : 'bg-black/50 border-2 border-gray-600/50 text-gray-400 hover:border-blue-500/50'
                      }`}
                    >
                      Advanced
                    </button>
                    <button
                      onClick={() => setSelectedSlotType('master')}
                      className={`flex-1 px-4 py-3 font-bold uppercase tracking-wider transition-all ${
                        selectedSlotType === 'master'
                          ? 'bg-purple-500/30 border-2 border-purple-500 text-purple-400'
                          : 'bg-black/50 border-2 border-gray-600/50 text-gray-400 hover:border-purple-500/50'
                      }`}
                    >
                      Master
                    </button>
                  </div>
                </div>

                {/* Save Configuration Button */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="w-full px-4 py-3 bg-green-500/20 border-2 border-green-500/50 rounded text-green-400 font-bold uppercase tracking-wider hover:bg-green-500/30 hover:border-green-500 transition-all"
                  >
                    💾 Save Configuration
                  </button>
                </div>

                {/* Interpolation Controls */}
                <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <h5 className="text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider">Auto-Fill Tool</h5>
                  <p className="text-xs text-gray-400 mb-3">Enter values in Level 1→2 and Level 9→10, then click Interpolate to auto-fill middle values</p>

                  <div className="space-y-4">
                    {/* Curve Factor Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">
                          Curve (Exponential Growth)
                        </label>
                        <span className="text-sm font-bold text-yellow-300">
                          {slotCurveFactor.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={slotCurveFactor}
                        onChange={(e) => setSlotCurveFactor(parseFloat(e.target.value))}
                        className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Slower Growth (0.5)</span>
                        <span>Linear (1.0)</span>
                        <span>Faster Growth (3.0)</span>
                      </div>
                    </div>

                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                          Rounding
                        </label>
                        <select
                          value={slotRoundingOption}
                          onChange={(e) => setSlotRoundingOption(Number(e.target.value) as 10 | 100 | 1000)}
                          className="w-full px-3 py-2 bg-black/50 border border-yellow-500/50 rounded text-yellow-300 focus:border-yellow-500 focus:outline-none"
                        >
                          <option value={10}>Tens</option>
                          <option value={100}>Hundreds</option>
                          <option value={1000}>Thousands</option>
                        </select>
                      </div>

                      <button
                        onClick={interpolateSlotValues}
                        className="px-6 py-2 bg-yellow-500/20 border-2 border-yellow-500/50 rounded text-yellow-400 font-bold uppercase tracking-wider hover:bg-yellow-500/30 hover:border-yellow-500 transition-all"
                      >
                        Interpolate
                      </button>
                    </div>
                  </div>
                </div>

                {/* Leveling Requirements Grid */}
                <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-yellow-400 mb-4 uppercase tracking-wider">
                    {selectedSlotType.charAt(0).toUpperCase() + selectedSlotType.slice(1)} Slot Leveling Requirements
                  </h4>
                  <p className="text-xs text-gray-400 mb-4">Tenure cost required to upgrade each level</p>

                  <div className="grid grid-cols-3 gap-4">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                      <div key={index} className="bg-black/50 border border-gray-600/50 rounded p-3">
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                          Level {index + 1} → {index + 2}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={slotsConfig[selectedSlotType][index] === 0 ? '' : slotsConfig[selectedSlotType][index].toLocaleString()}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/,/g, '');

                            if (rawValue === '') {
                              setSlotsConfig(prev => ({
                                ...prev,
                                [selectedSlotType]: prev[selectedSlotType].map((val, i) =>
                                  i === index ? 0 : val
                                )
                              }));
                              return;
                            }

                            if (!/^\d+$/.test(rawValue)) {
                              return;
                            }

                            const numValue = parseInt(rawValue, 10);
                            if (!isNaN(numValue)) {
                              setSlotsConfig(prev => ({
                                ...prev,
                                [selectedSlotType]: prev[selectedSlotType].map((val, i) =>
                                  i === index ? numValue : val
                                )
                              }));
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          onBlur={() => {
                            const firstValue = slotsConfig[selectedSlotType][0];
                            const lastValue = slotsConfig[selectedSlotType][8];

                            if (firstValue > 0 && lastValue > 0) {
                              interpolateSlotValues();
                            }
                          }}
                          className="w-full px-3 py-2 bg-black/50 border border-yellow-500/50 rounded text-yellow-300 text-center font-bold focus:border-yellow-500 focus:outline-none"
                        />
                        <p className="text-xs text-yellow-400 mt-1 text-center font-semibold">
                          {slotsConfig[selectedSlotType][index].toLocaleString()} tenure
                        </p>
                        <p className="text-xs text-gray-500 text-center">
                          {formatTenureDuration(slotsConfig[selectedSlotType][index], tenurePerSecond)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Summary Display */}
                  <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded p-4">
                    <h5 className="text-sm font-bold text-yellow-400 mb-2 uppercase tracking-wider">Total Tenure Required</h5>
                    <p className="text-xs text-gray-400 mb-2">To reach Level 10 from Level 1 (assumes Mek slotted entire time)</p>
                    <div className="text-2xl font-bold text-yellow-300 text-center">
                      {slotsConfig[selectedSlotType].reduce((sum, val) => sum + val, 0).toLocaleString()} Tenure
                    </div>
                    <div className="text-lg font-bold text-blue-400 text-center mt-2">
                      {formatTenureDuration(slotsConfig[selectedSlotType].reduce((sum, val) => sum + val, 0), tenurePerSecond)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Gold Backup System */}
          {activeTab === 'gold-backup-system' && (
          <div id="section-gold-backup-system" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('gold-backup-system')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💾</span>
                <h3 className="text-xl font-bold text-yellow-400">Gold Backup System</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('gold-backup-system') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('gold-backup-system') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">
                  Comprehensive disaster recovery system for user gold states. Create manual backups, automatic daily snapshots, and restore from any point in time.
                </p>
                <GoldBackupAdmin />
              </div>
            )}
          </div>
          )}

          {/* Player Management */}
          {activeTab === 'wallet-management' && (
          <div id="section-wallet-management" className="bg-black/50 backdrop-blur border-2 border-blue-500/30 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4">
                <p className="text-gray-400 mb-4">
                  View and manage all connected players. Reset verification status for testing or permanently remove players from the system.
                </p>

                {/* Player Management Component with built-in tabs */}
                <WalletManagementAdmin />
              </div>
          </div>
          )}

          {/* SourceKey Migration */}
          {activeTab === 'sourcekey-migration' && (
          <div id="section-sourcekey-migration" className="bg-black/50 backdrop-blur border-2 border-yellow-500/30 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4">
                <p className="text-gray-400 mb-4">
                  Fix missing sourceKey fields in goldMining records. This enables Mek images to load correctly in the selector.
                </p>

                <SourceKeyMigrationAdmin />
              </div>
          </div>
          )}

          {/* Claude Manager */}
          {activeTab === 'claude-manager' && (
          <div id="section-claude-manager" className="bg-black/50 backdrop-blur border-2 border-purple-500/30 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4">
                <p className="text-gray-400 mb-4">
                  View and manage Claude Code agents, slash commands, and markdown documents. See both project-specific and computer-wide Claude files.
                </p>

                <ClaudeManagerAdmin />
              </div>
          </div>
          )}

          {/* Notification System */}
          {activeTab === 'notification-system' && (
          <div id="section-notification-system" className="bg-black/50 backdrop-blur border-2 border-orange-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('notification-system')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔔</span>
                <h3 className="text-xl font-bold text-yellow-400">Notification System</h3>
                <span className="px-2 py-1 bg-gray-600/30 text-gray-400 text-xs font-bold rounded">NOT IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('notification-system') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('notification-system') && (
              <div className="p-4 border-t border-gray-700/50">
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-6 text-center">
                  <div className="text-6xl mb-4">🔔</div>
                  <h4 className="text-lg font-semibold text-orange-400 mb-2">Notification System</h4>
                  <p className="text-sm text-gray-400">
                    Coming soon: In-game notifications, alerts, and messaging system configuration
                  </p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* NFT Admin */}
          {activeTab === 'nft-admin' && (
          <div id="section-nft-admin" className="bg-black/50 backdrop-blur border-2 border-purple-500/30 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4">
                <p className="text-gray-400 mb-4">
                  Manage NFT campaigns, eligibility, and distribution for commemorative tokens and event-based NFTs.
                </p>

                {/* NFT Sub-Tabs */}
                <NFTAdminTabs />
              </div>
          </div>
          )}

          {/* Overlay Editor */}
          {activeTab === 'overlay-editor' && (
          <div id="section-overlay-editor" className="bg-black/50 backdrop-blur border-2 border-yellow-500/30 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4">
                <p className="text-gray-400 mb-4">
                  Create and edit interactive zones and sprite positions on game images.
                </p>

                <OverlayEditor />
              </div>
          </div>
          )}

          {/* Navigation Preview */}
          {activeTab === 'navigation-preview' && (
          <div id="section-navigation-preview" className="bg-black/50 backdrop-blur border-2 border-blue-500/30 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4 space-y-6">
                <p className="text-gray-400 mb-4">
                  Preview and test navigation overlays with interactive zones. Select a saved overlay from the Overlay Editor to display it as a sticky navigation bar.
                </p>

                {/* Controls */}
                <div className="space-y-4">
                  {/* Overlay Selector */}
                  <div>
                    <label className="mek-label-uppercase block mb-2">Select Navigation Overlay</label>
                    <select
                      value={selectedNavigationOverlay}
                      onChange={(e) => setSelectedNavigationOverlay(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-blue-500/50 rounded text-white"
                    >
                      <option value="">-- Select an overlay --</option>
                      {allOverlays?.map((overlay) => (
                        <option key={overlay._id} value={overlay.imageKey}>
                          {overlay.imageKey} ({overlay.zones.length} zones)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Scale Slider */}
                  {selectedNavigationOverlay && selectedOverlayData && (
                    <div>
                      <label className="mek-label-uppercase block mb-2">
                        Navigation Scale: {Math.round(navigationScale * 100)}%
                      </label>
                      <div className="flex gap-4 items-center">
                        <input
                          type="range"
                          min="0.05"
                          max="1"
                          step="0.01"
                          value={navigationScale}
                          onChange={(e) => setNavigationScale(parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <button
                          onClick={() => setNavigationScale(1)}
                          className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded text-blue-400 hover:bg-blue-500/30 text-sm"
                        >
                          Reset
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Original size: {selectedOverlayData.imageWidth} × {selectedOverlayData.imageHeight}px
                        <br />
                        Scaled size: {Math.round(selectedOverlayData.imageWidth * navigationScale)} × {Math.round(selectedOverlayData.imageHeight * navigationScale)}px
                      </div>
                    </div>
                  )}

                  {/* Save and Deploy Buttons */}
                  {selectedNavigationOverlay && selectedOverlayData && (
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveNavigationConfig}
                        className="flex-1 px-4 py-3 bg-blue-600/20 border-2 border-blue-500/50 rounded text-blue-400 font-bold hover:bg-blue-600/30 transition-colors"
                      >
                        💾 Save Configuration
                      </button>
                      <button
                        onClick={handleDeployNavigation}
                        disabled={!navigationConfig}
                        className="flex-1 px-4 py-3 bg-green-600/20 border-2 border-green-500/50 rounded text-green-400 font-bold hover:bg-green-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🚀 Deploy to Site
                      </button>
                      {activeNavigationConfig && (
                        <button
                          onClick={handleDeactivateNavigation}
                          className="px-4 py-3 bg-red-600/20 border-2 border-red-500/50 rounded text-red-400 font-bold hover:bg-red-600/30 transition-colors"
                        >
                          ⏸️ Deactivate
                        </button>
                      )}
                    </div>
                  )}

                  {/* Status Message */}
                  {navigationStatusMessage && (
                    <div className={`p-3 rounded border-2 ${
                      navigationStatusMessage.type === 'success' ? 'bg-green-900/30 border-green-500/50 text-green-400' :
                      navigationStatusMessage.type === 'error' ? 'bg-red-900/30 border-red-500/50 text-red-400' :
                      'bg-blue-900/30 border-blue-500/50 text-blue-400'
                    }`}>
                      {navigationStatusMessage.text}
                    </div>
                  )}

                  {/* Deployment Status Indicator */}
                  {activeNavigationConfig && (
                    <div className="bg-green-900/20 border-2 border-green-500/50 rounded p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <div className="font-bold text-green-400">Navigation Active</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Overlay: {activeNavigationConfig.overlayImageKey} •
                            Scale: {Math.round(activeNavigationConfig.scale * 100)}% •
                            Deployed: {new Date(activeNavigationConfig.deployedAt || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {navigationConfig && !activeNavigationConfig && (
                    <div className="bg-yellow-900/20 border-2 border-yellow-500/50 rounded p-3 text-yellow-400 text-sm">
                      ℹ️ Configuration saved but not deployed. Click "Deploy to Site" to make it active.
                    </div>
                  )}
                </div>

                {/* Preview Area */}
                {selectedNavigationOverlay && selectedOverlayData ? (
                  <div className="space-y-4">
                    <div className="mek-label-uppercase text-blue-400">Sticky Navigation Preview</div>

                    {/* Sticky Navigation Container */}
                    <div
                      className="relative border-2 border-blue-500/50 rounded bg-black/80"
                      style={{
                        position: 'sticky',
                        top: '20px',
                        zIndex: 100
                      }}
                    >
                      {/* Base Image */}
                      <div
                        className="relative"
                        style={{
                          width: selectedOverlayData.imageWidth * navigationScale,
                          height: selectedOverlayData.imageHeight * navigationScale,
                        }}
                      >
                        <img
                          src={selectedOverlayData.imagePath}
                          alt="Navigation Backplate"
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'block',
                          }}
                        />

                        {/* Render Zones */}
                        {selectedOverlayData.zones
                          .filter((zone: any) => zone.mode === "zone")
                          .map((zone: any) => (
                            <div
                              key={zone.id}
                              style={{
                                position: 'absolute',
                                left: zone.x * navigationScale,
                                top: zone.y * navigationScale,
                                width: (zone.width || 0) * navigationScale,
                                height: (zone.height || 0) * navigationScale,
                                border: '2px solid rgba(59, 130, 246, 0.5)',
                                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                cursor: 'pointer',
                              }}
                              className="hover:bg-blue-500/30 transition-colors"
                              title={zone.label || zone.type}
                            >
                              <div className="text-xs text-blue-400 font-bold p-1 bg-black/50">
                                {zone.label || zone.type}
                              </div>
                            </div>
                          ))}

                        {/* Render Sprites */}
                        {selectedOverlayData.zones
                          .filter((zone: any) => zone.mode === "sprite")
                          .map((sprite: any) => {
                            const spriteScaleValue = sprite.metadata?.spriteScale || 1;
                            return (
                              <div
                                key={sprite.id}
                                style={{
                                  position: 'absolute',
                                  left: sprite.x * navigationScale,
                                  top: sprite.y * navigationScale,
                                  transform: `scale(${spriteScaleValue * navigationScale})`,
                                  transformOrigin: 'top left',
                                  border: '1px solid rgba(250, 182, 23, 0.3)',
                                  pointerEvents: 'none',
                                }}
                              >
                                {sprite.overlayImage && (
                                  <img src={sprite.overlayImage} alt={sprite.label} style={{ display: 'block' }} />
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Zone List */}
                    <div className="bg-black/50 border border-blue-500/30 rounded p-4">
                      <h4 className="mek-label-uppercase text-blue-400 mb-3">
                        Interactive Zones ({selectedOverlayData.zones.filter((z: any) => z.mode === "zone").length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedOverlayData.zones
                          .filter((zone: any) => zone.mode === "zone")
                          .map((zone: any) => (
                            <div
                              key={zone.id}
                              className="p-3 bg-black/50 border border-blue-500/30 rounded"
                            >
                              <div className="text-sm font-bold text-blue-400">
                                {zone.label || zone.type}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Position: ({Math.round(zone.x * navigationScale)}, {Math.round(zone.y * navigationScale)})
                                <br />
                                Size: {Math.round((zone.width || 0) * navigationScale)} × {Math.round((zone.height || 0) * navigationScale)}px
                                <br />
                                Type: {zone.type}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Scroll Test Area */}
                    <div className="bg-black/30 border border-gray-700 rounded p-4">
                      <div className="mek-label-uppercase text-gray-400 mb-2">Scroll Test Area</div>
                      <div className="text-sm text-gray-500 space-y-2">
                        <p>Scroll down to see the sticky navigation stay at the top of the page.</p>
                        {Array.from({ length: 20 }).map((_, i) => (
                          <p key={i}>Test content line {i + 1}...</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12 border border-gray-700 rounded">
                    Select an overlay from the dropdown above to preview it as a sticky navigation bar.
                  </div>
                )}
              </div>
          </div>
          )}

          {/* Components */}
          {activeTab === 'components' && (
          <div id="section-components" className="mek-card-industrial mek-border-sharp-gold rounded-lg shadow-lg shadow-black/50">
            <div className="p-6 space-y-8">
                <p className="text-zinc-300 mb-6">
                  Transformed UI components from external libraries (CodePen, shadcn, v0.dev) converted to Mek Tycoon's industrial design system using expert transformation documents.
                </p>

                {/* Component Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                  {/* Comet Loader */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Comet Loader
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Loader
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <CometLoader />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Gold & Lime</div>
                    </div>
                  </div>

                  {/* Triangle Kaleidoscope */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Triangle Kaleidoscope
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Loader
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black rounded-lg flex items-center justify-center min-h-[400px] overflow-hidden">
                      <div className="w-full h-[400px]">
                        <TriangleKaleidoscope />
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Pug/SCSS/Compass</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript</div>
                      <div><span className="text-zinc-500">Features:</span> Polygon clip-path, screen blend mode</div>
                    </div>
                  </div>

                  {/* PreLoader */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        PreLoader
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Loader
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="relative bg-black rounded-lg flex items-center justify-center min-h-[300px] overflow-hidden" style={{ transform: 'translateZ(0)' }}>
                      <div className="w-full h-[300px]">
                        <PreLoader />
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> HTML/CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS</div>
                      <div><span className="text-zinc-500">Features:</span> Ripple animation, SVG logo, backdrop blur</div>
                    </div>
                  </div>

                  {/* Animated Border Button */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Animated Border Button
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Button
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <AnimatedBorderButton>
                        Click Me
                      </AnimatedBorderButton>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External HTML/CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Blue → Gold (#fab617)</div>
                      <div><span className="text-zinc-500">Features:</span> Sequential border animations with staggered delays</div>
                    </div>
                  </div>

                  {/* Industrial Flip Card */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Industrial Flip Card
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Card
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <IndustrialFlipCard
                        title="TACTICAL"
                        badge="ELITE"
                        footer="UNIT READY"
                        icon="⚙️"
                        backText="HOVER ME"
                      />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External React/styled-components</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind + CSS</div>
                      <div><span className="text-zinc-500">Colors:</span> Yellow/gold theme with glass-morphism</div>
                      <div><span className="text-zinc-500">Features:</span> 3D flip animation, rotating border glow, blur circles, scan line effect</div>
                    </div>
                  </div>

                  {/* Discord Button */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Discord Button
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Button
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <DiscordButton />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External React/styled-components</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Indigo gradient with glass-morphism</div>
                      <div><span className="text-zinc-500">Features:</span> Backdrop blur, hover animations, Discord icon, social button</div>
                    </div>
                  </div>

                  {/* Generating Loader */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Generating Loader
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Loader
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <GeneratingLoader />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External styled-components</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS Modules</div>
                      <div><span className="text-zinc-500">Colors:</span> Purple/pink gradient ring with white text</div>
                      <div><span className="text-zinc-500">Features:</span> Rotating gradient ring, letter-by-letter animation, staggered delays</div>
                    </div>
                  </div>

                  {/* Text Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Text Switch
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <TextSwitch />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External styled-components</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Dark background with yellow (#ffb500) checked state</div>
                      <div><span className="text-zinc-500">Features:</span> Text label transitions, sliding thumb, opacity/transform animations</div>
                    </div>
                  </div>

                  {/* Hover Tooltip */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Hover Tooltip
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <HoverTooltip />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External styled-components</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> White with pink border (#ffe4e4)</div>
                      <div><span className="text-zinc-500">Features:</span> Hover reveal, animated lines, pulse background, diagonal line transform</div>
                    </div>
                  </div>

                  {/* Fill Text Button */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Fill Text Button
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Button
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <FillTextButton />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External styled-components</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind + inline styles</div>
                      <div><span className="text-zinc-500">Colors:</span> Green (#37FF8B) fill with stroke outline</div>
                      <div><span className="text-zinc-500">Features:</span> Text stroke effect, left-to-right fill animation, drop-shadow glow, webkit-text-stroke</div>
                    </div>
                  </div>

                  {/* Floating Label Input */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Floating Label Input
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Input
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <FloatingLabelInput />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External styled-components</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind + CSS Modules</div>
                      <div><span className="text-zinc-500">Colors:</span> Blue (#5264AE) focus state with gray border</div>
                      <div><span className="text-zinc-500">Features:</span> Material Design floating label, center-expand bar animation, highlight flash, peer utility</div>
                    </div>
                  </div>

                  {/* Pro Mode Toggle */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Pro Mode Toggle
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <ProModeToggle />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> Safety guard, 3D transforms, hazard stripes</div>
                    </div>
                  </div>

                  {/* Power Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Power Switch
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <PowerSwitch />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> 3D lever, rotating halves, glowing indicator</div>
                    </div>
                  </div>

                  {/* Nebula Checkbox */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Nebula Checkbox
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <NebulaCheckbox />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External CSS (Uiverse)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> Square→Star transform, nebula glow, sparkles</div>
                    </div>
                  </div>

                  {/* Power Button Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Power Button Switch
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <PowerButtonSwitch enableVibration={true} />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External CSS (by @oguzyagizkara)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> Sliding button, icon transitions, haptic feedback</div>
                    </div>
                  </div>

                  {/* Color Toggle Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Color Toggle Switch
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex flex-col items-center justify-center gap-3 min-h-[300px] text-[2em]">
                      <ColorToggleSwitch color="red" />
                      <ColorToggleSwitch color="yellow" />
                      <ColorToggleSwitch color="blue" />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External CSS (SCSS)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> 3D ball, radial gradients, 3 color variants</div>
                    </div>
                  </div>

                  {/* Dotted Toggle Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Dotted Toggle Switch
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-[#e8e1d6] rounded-lg p-8 flex flex-col items-center justify-center gap-2 min-h-[300px] text-[3em]">
                      <DottedToggleSwitch />
                      <DottedToggleSwitch checked={true} />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> 12-dot grip pattern, 3D shadows, beige theme</div>
                    </div>
                  </div>

                  {/* Mechanical Toggle Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Mechanical Toggle
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="relative rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
                      {/* Industrial textured background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900"></div>
                      <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(250, 182, 23, 0.1) 2px, rgba(250, 182, 23, 0.1) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(250, 182, 23, 0.1) 2px, rgba(250, 182, 23, 0.1) 4px)'
                      }}></div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(250,182,23,0.05),transparent_50%)]"></div>

                      {/* Toggle component with relative positioning */}
                      <div className="relative z-10">
                        <MechanicalToggle
                          checked={mechanicalToggleChecked}
                          onChange={setMechanicalToggleChecked}
                        />
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External HTML/CSS (SCSS)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS Module</div>
                      <div><span className="text-zinc-500">Features:</span> Red knob rotation, metallic handle, gray→green base, gold accents</div>
                    </div>
                  </div>

                  {/* Power Switch Toggle */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Power Switch Toggle
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview - Interactive toggle */}
                    <div className="bg-black/60 rounded-lg p-8">
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-xs text-zinc-500 uppercase tracking-wider">Click to Toggle</div>
                        <PowerSwitchToggle
                          checked={powerSwitchToggleChecked}
                          onChange={setPowerSwitchToggleChecked}
                        />
                        <div className="text-xs text-yellow-400">
                          Status: {powerSwitchToggleChecked ? 'ON (Glowing)' : 'OFF (Dim)'}
                        </div>
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External HTML/CSS/SVG</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind v3</div>
                      <div><span className="text-zinc-500">Features:</span> Click animation, line bounce, circle rotation (partial→full), radial glow when ON</div>
                      <div><span className="text-zinc-500">Colors:</span> White → Gold (#fab617)</div>
                    </div>
                  </div>

                  {/* Glow Toggle */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Glow Toggle
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]">
                      <div style={{ transform: 'scale(0.3)' }}>
                        <GlowToggle />
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External HTML/CSS (exact transplant)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS</div>
                      <div><span className="text-zinc-500">Features:</span> Sliding cyan/gray gradient track, ||| thumb with cyan radial glow when ON, gray background when OFF, 3s demo animation on load</div>
                    </div>
                  </div>

                  {/* Radial Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Radial Switch
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="relative rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px] overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
                      <RadialSwitch
                        options={['off', 'on']}
                        defaultIndex={radialSwitchIndex}
                        onChange={(index) => setRadialSwitchIndex(index)}
                      />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Pug/SASS (CodePen)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS</div>
                      <div><span className="text-zinc-500">Features:</span> Circular rotating switch, gradient ring, animated handle</div>
                    </div>
                  </div>

                  {/* Glass Button */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Glass Button
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div
                      className="rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]"
                      style={{
                        background: 'repeating-linear-gradient(45deg, #27272a 0px, #27272a 20px, #fab617 20px, #fab617 40px)'
                      }}
                    >
                      <GlassButton
                        text="Generate"
                        onClick={() => console.log('Glass button clicked')}
                      />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External HTML/CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS</div>
                      <div><span className="text-zinc-500">Features:</span> Glassmorphism with backdrop blur, rotating conic gradient border (hover: -75deg → -125deg), linear gradient shine on ::after, 3D rotation on active, shadow glow effect</div>
                    </div>
                  </div>

                  {/* Glass Button Sharp */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Glass Button Sharp
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div
                      className="rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]"
                      style={{
                        background: 'repeating-linear-gradient(45deg, #27272a 0px, #27272a 20px, #fab617 20px, #fab617 40px)'
                      }}
                    >
                      <GlassButtonSharp
                        text="Generate"
                        onClick={() => console.log('Glass button sharp clicked')}
                      />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External HTML/CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS</div>
                      <div><span className="text-zinc-500">Features:</span> Sharp edges (border-radius: 0), glassmorphism with backdrop blur, rotating conic gradient border, linear gradient shine, 3D rotation on active</div>
                    </div>
                  </div>

                  {/* Isometric Social Button */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Isometric Social Button
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div
                      className="rounded-lg p-8 flex flex-wrap items-center justify-center gap-4 min-h-[400px]"
                      style={{
                        background: 'repeating-linear-gradient(45deg, #1e293b 0px, #1e293b 20px, #0f172a 20px, #0f172a 40px)'
                      }}
                    >
                      <IsometricSocialButton
                        iconClass="fab fa-facebook"
                        label="Facebook"
                        onClick={() => console.log('Facebook clicked')}
                        mekImage="/mek-images/500px/ht2-bi1-lg2.webp"
                      />
                      <IsometricSocialButton
                        iconClass="fab fa-twitter"
                        label="Twitter"
                        onClick={() => console.log('Twitter clicked')}
                        mekImage="/mek-images/500px/cl3-jg1-nm1.webp"
                      />
                      <IsometricSocialButton
                        iconClass="fab fa-instagram"
                        label="Instagram"
                        onClick={() => console.log('Instagram clicked')}
                        mekImage="/mek-images/500px/ki3-cb1-ji1.webp"
                      />
                      <IsometricSocialButton
                        iconClass="fab fa-youtube"
                        label="Youtube"
                        onClick={() => console.log('Youtube clicked')}
                        mekImage="/mek-images/500px/ed3-dc1-il1.webp"
                      />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Pug/SCSS (exact transplant)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS</div>
                      <div><span className="text-zinc-500">Features:</span> 3D isometric transform (perspective 1000px, rotate -30deg, skew 25deg), ::before creates left cube face (skewY -45deg), ::after creates bottom face (skewX -45deg), hover lifts button with translate(20px, -20px) and extends shadow from -20px to -50px</div>
                      <div><span className="text-zinc-500">Note:</span> Preserves original typos: "dislpay" (display) and "scewY" (skewY) in CSS</div>
                    </div>
                  </div>

                  {/* Close Button */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Close Button
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div
                      className="rounded-lg p-8 flex items-center justify-center min-h-[300px]"
                      style={{
                        background: '#1E272D'
                      }}
                    >
                      <CloseButton onClick={() => console.log('Close button clicked')} />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> HTML/SCSS (exact CSS transplant)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS</div>
                      <div><span className="text-zinc-500">Features:</span> X made from two 4px × 50px bars rotated 45deg/-45deg, hover rotates bars in opposite direction (-45deg/45deg), color changes from soft orange (#F4A259) to tomato red (#F25C66), "close" label fades in (opacity 0→1), all transitions 300ms ease-in</div>
                    </div>
                  </div>

                </div>
              </div>
          </div>
          )}

        </div>
      </div>

      {/* Game Data Lightbox */}
      <GameDataLightbox
        isOpen={showGameDataLightbox}
        onClose={() => setShowGameDataLightbox(false)}
      />

      {/* Slot Configuration Save Modal */}
      {mounted && showSaveModal && createPortal(
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="bg-black/90 border-2 border-green-500/50 rounded-lg p-6 max-w-md w-full mx-4 shadow-lg shadow-green-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-green-400 mb-4 uppercase tracking-wider">Save Slot Configuration</h3>
            <p className="text-sm text-gray-400 mb-4">
              This will save all 3 slot types (Basic, Advanced, Master) together.
            </p>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter configuration name..."
              className="w-full px-4 py-3 bg-black/60 border-2 border-yellow-500/50 rounded text-yellow-300 mb-6 focus:border-yellow-500 focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && saveName.trim()) {
                  handleSaveConfiguration();
                } else if (e.key === 'Escape') {
                  setShowSaveModal(false);
                }
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveConfiguration}
                disabled={!saveName.trim()}
                className="flex-1 px-4 py-3 bg-green-500/20 border-2 border-green-500/50 text-green-400 font-bold uppercase tracking-wider rounded hover:bg-green-500/30 hover:border-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💾 Save
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-3 bg-gray-600/20 border-2 border-gray-500/50 text-gray-400 font-bold uppercase tracking-wider rounded hover:bg-gray-600/30 hover:border-gray-500 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// NFT Admin Sub-Tabs Component
function NFTAdminTabs() {
  const [nftSubTab, setNftSubTab] = useState<'commemorative' | 'whitelist-manager' | 'json-generator' | 'campaigns'>('json-generator');

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b-2 border-yellow-500/30 pb-2">
        <button
          onClick={() => setNftSubTab('commemorative')}
          className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
            nftSubTab === 'commemorative'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
              : 'bg-black/50 text-gray-400 hover:text-yellow-400 border border-yellow-500/30'
          }`}
        >
          🏆 Commemorative
        </button>
        <button
          onClick={() => setNftSubTab('whitelist-manager')}
          className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
            nftSubTab === 'whitelist-manager'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
              : 'bg-black/50 text-gray-400 hover:text-yellow-400 border border-yellow-500/30'
          }`}
        >
          📋 Whitelist Manager
        </button>
        <button
          onClick={() => setNftSubTab('json-generator')}
          className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
            nftSubTab === 'json-generator'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
              : 'bg-black/50 text-gray-400 hover:text-yellow-400 border border-yellow-500/30'
          }`}
        >
          📦 JSON System
        </button>
        <button
          onClick={() => setNftSubTab('campaigns')}
          className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
            nftSubTab === 'campaigns'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
              : 'bg-black/50 text-gray-400 hover:text-yellow-400 border border-yellow-500/30'
          }`}
        >
          🎯 Campaigns
        </button>
      </div>

      {/* Tab Content */}
      {nftSubTab === 'commemorative' && <CommemorativeToken1Admin />}
      {nftSubTab === 'whitelist-manager' && <WhitelistManagerAdmin />}
      {nftSubTab === 'json-generator' && <NMKRJSONGenerator />}
      {nftSubTab === 'campaigns' && <CampaignManager />}
    </div>
  );
}