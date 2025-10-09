'use client';

import { useState, useEffect, useMemo } from 'react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import MasterRangeSystem from '@/components/MasterRangeSystem';
import GameDataLightbox from '@/components/GameDataLightbox';
import StoryClimbConfig from '@/components/StoryClimbConfig';
import DifficultyAdminConfig from '@/components/DifficultyAdminConfig';
import BuffCategoriesAdmin from '@/components/BuffCategoriesAdmin';
import MekBaseConfig from '@/components/MekBaseConfig';
import MekTalentTreeConfig from '@/components/MekTalentTreeConfig';
import MekDetailViewer from '@/components/MekDetailViewer';
import MekRateExperiment from '@/components/MekRateExperiment';
import MekRateAdmin from '@/components/MekRateAdmin';
import GoldBackupAdmin from '@/components/GoldBackupAdmin';
import WalletManagementAdmin from '@/components/WalletManagementAdmin';
import NftPurchasePlanner from '@/components/NftPurchasePlanner';
import { ALL_VARIATIONS } from '@/lib/variationsReferenceData';
import { variationsData } from '@/lib/variationsData';
import { getVariationTrueRank, VARIATION_MEK_RANKS } from '@/lib/variationRarityMekRanks';

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
  { id: 'story-climb-mechanics', name: 'Story Climb Mechanics', icon: '🏔️', implemented: false },
  { id: 'daily-recipes', name: 'Daily Recipes (Universal Chips)', icon: '📖', implemented: false },
  { id: 'salvage-materials', name: 'Salvage Materials', icon: '🔧', implemented: false },
  { id: 'circuitry-costs', name: 'Circuitry Crafting Costs', icon: '💰', implemented: false },
  { id: 'mech-chip-recipes', name: 'Mech Chip Crafting Recipes', icon: '🔨', implemented: false },
  { id: 'single-missions', name: 'Single Missions Formulation', icon: '🎯', implemented: false },
  { id: 'global-game-data', name: 'Global Game Data', icon: '🌐', implemented: true },
  { id: 'shop-system', name: 'Shop System', icon: '🛒', implemented: true },
  { id: 'offers-system', name: 'Offers System', icon: '💬', implemented: true },
  { id: 'variations', name: 'Variations', icon: '🎨', implemented: false },
  { id: 'mek-rate-experiment', name: 'Mek Rate Experiment', icon: '💎', implemented: true },
  { id: 'gold-backup-system', name: 'Gold Backup System', icon: '💾', implemented: true },
  { id: 'wallet-management', name: 'Wallet Management', icon: '👛', implemented: true },
  { id: 'bot-testing', name: 'Bot Testing System', icon: '🤖', implemented: true },
  { id: 'notification-system', name: 'Notification System', icon: '🔔', implemented: false }
];

export default function AdminMasterDataPage() {
  const convex = useConvex();
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('mek-systems');
  const [storyClimbSubTab, setStoryClimbSubTab] = useState<string>('difficulty-subsystem');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showGameDataLightbox, setShowGameDataLightbox] = useState(false);
  const [menuHeaderCollapsed, setMenuHeaderCollapsed] = useState(true); // Default to collapsed
  const [systemStatusCollapsed, setSystemStatusCollapsed] = useState(false);
  const [masterRangeCollapsed, setMasterRangeCollapsed] = useState(true); // Default to collapsed

  // Save system state
  const [isSaving, setIsSaving] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [systemCompletion, setSystemCompletion] = useState<Record<string, 'incomplete' | 'in-progress' | 'complete'>>(() => {
    // Always use defaults during initial render to avoid hydration mismatch
    const initial: Record<string, 'incomplete' | 'in-progress' | 'complete'> = {};
    DATA_SYSTEMS.forEach(s => { initial[s.id] = s.implemented ? 'complete' : 'incomplete'; });
    return initial;
  });

  // Variation buff mutations
  const applyBuffsToVariations = useMutation(api.variationBuffs.applyBuffsToVariations);
  const saveBuffConfiguration = useMutation(api.variationBuffs.saveBuffConfiguration);
  const buffConfig = useQuery(api.variationBuffs.getBuffConfiguration);
  const variationBuffs = useQuery(api.variationBuffs.getVariationBuffs);

  // Duration configuration queries and mutations
  const saveDurationConfig = useMutation(api.durationConfigs.saveDurationConfig);
  const updateDurationConfig = useMutation(api.durationConfigs.updateDurationConfig);
  const deployDurationConfig = useMutation(api.durationConfigs.deployDurationConfig);
  const deleteDurationConfig = useMutation(api.durationConfigs.deleteDurationConfig);
  const durationConfigsList = useQuery(api.durationConfigs.listDurationConfigs);
  const activeDurationConfig = useQuery(api.durationConfigs.getActiveDurationConfig);
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

  // Menu Header UI State
  const [menuHeaderStyle, setMenuHeaderStyle] = useState('standard-balanced');

  // Load variations folder path from localStorage on mount
  useEffect(() => {
    const savedPath = localStorage.getItem('variationsImageFolder');
    if (savedPath) {
      setVariationsImageFolder(savedPath);
    }

    // Load menu header style
    const savedHeaderStyle = localStorage.getItem('menuHeaderStyle');
    if (savedHeaderStyle) {
      setMenuHeaderStyle(savedHeaderStyle);
    }
  }, []);

  // Save variations folder path when it changes
  const handleVariationsFolderChange = (path: string) => {
    setVariationsImageFolder(path);
    localStorage.setItem('variationsImageFolder', path);
  };

  // Save menu header style when it changes
  const handleMenuHeaderStyleChange = (style: string) => {
    console.log('Admin: Changing menu header style to:', style);
    setMenuHeaderStyle(style);
    localStorage.setItem('menuHeaderStyle', style);
    // Trigger a custom event to notify Navigation component
    window.dispatchEvent(new CustomEvent('menuHeaderStyleChanged', { detail: style }));
    console.log('Admin: Saved to localStorage and dispatched event');
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

  // Master Range Controls
  const [globalMultiplier, setGlobalMultiplier] = useState(1);
  const [minRange, setMinRange] = useState(1);
  const [maxRange, setMaxRange] = useState(100);
  const [scalingFactor, setScalingFactor] = useState(1.5);

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

  // Load system completion status from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem('systemImplementationStatus');
    if (saved) {
      try {
        setSystemCompletion(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved system status:', e);
      }
    }
  }, []); // Only run once on mount

  // Save system completion status to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('systemImplementationStatus', JSON.stringify(systemCompletion));
    }
  }, [systemCompletion]);

  // Visual Progress Calculation
  const implementedCount = Object.values(systemCompletion).filter(status => status === 'complete').length;
  const inProgressCount = Object.values(systemCompletion).filter(status => status === 'in-progress').length;
  const totalCount = DATA_SYSTEMS.length;
  const progressPercentage = (implementedCount / totalCount) * 100;

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

  const applyGlobalScaling = (baseValue: number, level: number = 1): number => {
    return Math.round(baseValue * globalMultiplier * Math.pow(scalingFactor, level - 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-500 mb-2 font-orbitron tracking-wider">
          MASTER DATA SYSTEMS
        </h1>
        <p className="text-gray-400 mb-4">Centralized procedural generation and game balance control</p>

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

        {/* Simple Systems Checklist */}
        <div className="bg-black/50 backdrop-blur border border-gray-700/50 rounded-lg p-4 mb-8">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSystemStatusCollapsed(!systemStatusCollapsed)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <span className="text-sm">{systemStatusCollapsed ? '▶' : '▼'}</span>
              </button>
              <h2 className="text-sm font-bold text-gray-400">System Implementation Status</h2>
            </div>
            <div className="text-xs text-gray-500">
              <span className="text-green-400">{implementedCount}</span>
              {inProgressCount > 0 && <span className="text-orange-400">/{inProgressCount}</span>}
              <span className="text-gray-500">/{totalCount}</span>
              <span className="ml-2 text-gray-600">(Complete{inProgressCount > 0 && '/In Progress'}/Total)</span>
            </div>
          </div>
          {!systemStatusCollapsed && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {DATA_SYSTEMS.map((system) => {
              const status = systemCompletion[system.id];
              const isComplete = status === 'complete';
              const isInProgress = status === 'in-progress';

              return (
                <div
                  key={system.id}
                  className={`flex items-center justify-between rounded px-3 py-2 transition-all ${
                    isComplete
                      ? 'bg-green-900/40 border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                      : isInProgress
                      ? 'bg-orange-900/30 border border-orange-500/50'
                      : 'bg-gray-900/30 border border-gray-700/30'
                  }`}
                >
                  <span
                    className={`text-xs cursor-pointer transition-colors ${
                      isComplete
                        ? 'text-green-300 font-semibold'
                        : isInProgress
                        ? 'text-orange-300'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                    onClick={() => {
                      if (system.id === 'global-game-data') {
                        setShowGameDataLightbox(true);
                      } else {
                        navigateToSection(system.id);
                      }
                    }}
                  >
                    {system.name}
                  </span>
                  <select
                    value={status}
                    onChange={(e) => setSystemCompletion(prev => ({
                      ...prev,
                      [system.id]: e.target.value as 'incomplete' | 'in-progress' | 'complete'
                    }))}
                    className={`text-xs px-2 py-1 rounded border bg-black/50 ${
                      isComplete
                        ? 'text-green-400 border-green-500/30 font-semibold'
                        : isInProgress
                        ? 'text-orange-400 border-orange-500/30'
                        : 'text-gray-400 border-gray-600/30'
                    }`}
                  >
                    <option value="incomplete">Incomplete</option>
                    <option value="in-progress">In Progress</option>
                    <option value="complete">Complete</option>
                  </select>
                </div>
              );
            })}
            </div>
          )}
        </div>

        {/* Menu Header UI Control System */}
        <div className="bg-black/50 backdrop-blur border-2 border-purple-500/30 rounded-lg mb-8">
          <button
            onClick={() => setMenuHeaderCollapsed(!menuHeaderCollapsed)}
            className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎨</span>
              <h3 className="text-lg font-bold text-yellow-400">Menu Header UI Styles</h3>
            </div>
            <span className="text-gray-400">{menuHeaderCollapsed ? '▶' : '▼'}</span>
          </button>
          {!menuHeaderCollapsed && (
            <div className="p-4 border-t border-gray-700/50">
              <p className="text-gray-400 mb-4">Configure logo size, spacing, and overall header layout style</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[
              {
                id: 'ultra-minimal',
                name: 'Ultra Minimal',
                description: 'Tiny logo, ultra-tight spacing, minimal header height',
                specs: 'Logo: 200x50px | Padding: 2px | Height: 60px'
              },
              {
                id: 'compact-professional',
                name: 'Compact Professional',
                description: 'Small logo with minimal spacing for space efficiency',
                specs: 'Logo: 250x65px | Padding: 3px | Height: 75px'
              },
              {
                id: 'standard-balanced',
                name: 'Standard Balanced',
                description: 'Current default size with balanced proportions',
                specs: 'Logo: 400x100px | Padding: 5px | Height: 110px'
              },
              {
                id: 'bold-statement',
                name: 'Bold Statement',
                description: 'Large logo with generous spacing for impact',
                specs: 'Logo: 500x125px | Padding: 8px | Height: 140px'
              },
              {
                id: 'cinematic-wide',
                name: 'Cinematic Wide',
                description: 'Extra large logo with spacious layout',
                specs: 'Logo: 600x150px | Padding: 10px | Height: 170px'
              },
              {
                id: 'dynamic-responsive',
                name: 'Dynamic Responsive',
                description: 'Adapts more dramatically to screen size changes',
                specs: 'Logo: Variable | Padding: Adaptive | Height: Responsive'
              },
              {
                id: 'logo-left-corner',
                name: 'Logo Left Corner',
                description: 'Logo positioned in upper left corner with menu items at top',
                specs: 'Logo: 250x65px | Position: Left | Menu: Top Bar'
              },
              {
                id: 'logo-left-small',
                name: 'Logo Left Small',
                description: 'Smaller logo in upper left with compact top navigation',
                specs: 'Logo: 200x50px | Position: Left | Compact Nav'
              },
              {
                id: 'logo-left-medium',
                name: 'Logo Left Medium',
                description: 'Medium logo in upper left with balanced navigation',
                specs: 'Logo: 280x70px | Position: Left | Balanced Nav'
              },
              {
                id: 'logo-left-large',
                name: 'Logo Left Large',
                description: 'Larger logo in upper left with spacious navigation',
                specs: 'Logo: 320x80px | Position: Left | Spacious Nav'
              }
            ].map((style) => (
              <div
                key={style.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  menuHeaderStyle === style.id
                    ? 'border-purple-400 bg-purple-900/30 shadow-[0_0_15px_rgba(147,51,234,0.3)]'
                    : 'border-gray-600 bg-gray-800/30 hover:border-purple-500/50 hover:bg-purple-900/20'
                }`}
                onClick={() => handleMenuHeaderStyleChange(style.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-bold text-sm ${
                    menuHeaderStyle === style.id ? 'text-purple-300' : 'text-gray-300'
                  }`}>
                    {style.name}
                  </h3>
                  {menuHeaderStyle === style.id && (
                    <div className="w-3 h-3 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(147,51,234,0.6)]"></div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-3">{style.description}</p>
                <div className="text-[10px] text-gray-500 font-mono bg-black/30 p-2 rounded">
                  {style.specs}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-purple-900/20 rounded border border-purple-500/20">
            <p className="text-sm text-purple-300">
              <strong>Current Style:</strong> {
                menuHeaderStyle === 'ultra-minimal' ? 'Ultra Minimal' :
                menuHeaderStyle === 'compact-professional' ? 'Compact Professional' :
                menuHeaderStyle === 'standard-balanced' ? 'Standard Balanced' :
                menuHeaderStyle === 'bold-statement' ? 'Bold Statement' :
                menuHeaderStyle === 'cinematic-wide' ? 'Cinematic Wide' :
                menuHeaderStyle === 'dynamic-responsive' ? 'Dynamic Responsive' :
                menuHeaderStyle === 'logo-left-corner' ? 'Logo Left Corner' :
                menuHeaderStyle === 'logo-left-small' ? 'Logo Left Small' :
                menuHeaderStyle === 'logo-left-medium' ? 'Logo Left Medium' :
                menuHeaderStyle === 'logo-left-large' ? 'Logo Left Large' :
                'Unknown'
              }
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Changes are applied immediately to the navigation header. Refresh the page to see the full effect.
            </p>
          </div>
            </div>
          )}
        </div>

        {/* Master Range Control System */}
        <div className="bg-black/50 backdrop-blur border-2 border-blue-500/30 rounded-lg mb-8">
          <button
            onClick={() => setMasterRangeCollapsed(!masterRangeCollapsed)}
            className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
          >
            <h2 className="text-xl font-bold text-blue-400">Master Range Controls</h2>
            <span className="text-gray-400">{masterRangeCollapsed ? '▶' : '▼'}</span>
          </button>
          {!masterRangeCollapsed && (
            <div className="p-6 pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">Global Multiplier</label>
                  <input
                    type="number"
                    value={globalMultiplier}
                    onChange={(e) => setGlobalMultiplier(parseFloat(e.target.value) || 1)}
                    step="0.1"
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-blue-500/30 rounded text-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">Min Range</label>
                  <input
                    type="number"
                    value={minRange}
                    onChange={(e) => setMinRange(parseInt(e.target.value) || 1)}
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-blue-500/30 rounded text-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">Max Range</label>
                  <input
                    type="number"
                    value={maxRange}
                    onChange={(e) => setMaxRange(parseInt(e.target.value) || 100)}
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-blue-500/30 rounded text-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">Scaling Factor</label>
                  <input
                    type="number"
                    value={scalingFactor}
                    onChange={(e) => setScalingFactor(parseFloat(e.target.value) || 1.5)}
                    step="0.1"
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-blue-500/30 rounded text-blue-400"
                  />
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-900/20 rounded border border-blue-500/20">
                <p className="text-sm text-blue-300">
                  Formula: <code className="bg-black/50 px-2 py-1 rounded">baseValue × {globalMultiplier} × {scalingFactor}^(level-1)</code>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Example: Base 10 at Level 5 = {applyGlobalScaling(10, 5)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation for All Systems */}
        <div className="bg-black/50 backdrop-blur border-2 border-yellow-500/30 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap gap-2">
            {DATA_SYSTEMS.map((system) => (
              <button
                key={system.id}
                onClick={() => {
                  setActiveTab(system.id);
                  // Reset story climb sub-tab to default when switching to Story Climb Mechanics
                  if (system.id === 'story-climb-mechanics') {
                    setStoryClimbSubTab('difficulty-subsystem');
                  }
                  // Reset wallet management sub-tab to default when switching to Wallet Management
                  if (system.id === 'wallet-management') {
                  }
                  // Auto-expand all subsections for this system
                  const subsections = {
                    'mek-systems': ['mek-base-config', 'mek-talent-tree', 'mek-detail-viewer'],
                    'story-climb-mechanics': ['difficulty-subsystem', 'duration-subsystem'],
                    'variations': ['variations-image-sync', 'variations-buff-assignment']
                  };
                  const sectionsToExpand = [system.id, ...(subsections[system.id as keyof typeof subsections] || [])];
                  setExpandedSections(new Set(sectionsToExpand));
                }}
                className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-semibold ${
                  activeTab === system.id
                    ? 'border-yellow-400 bg-yellow-900/30 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                    : 'border-gray-600 bg-gray-800/30 text-gray-400 hover:border-yellow-500/50 hover:bg-yellow-900/20'
                }`}
              >
                <span className="mr-2">{system.icon}</span>
                {system.name}
              </button>
            ))}
          </div>
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

          {/* Circuitry Crafting Costs */}
          {activeTab === 'circuitry-costs' && (
          <div id="section-circuitry-costs" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('circuitry-costs')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <h3 className="text-xl font-bold text-yellow-400">Circuitry Crafting Costs</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('circuitry-costs') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('circuitry-costs') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Resource costs for circuitry crafting</p>
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

          {/* Shop System */}
          {activeTab === 'shop-system' && (
          <div id="section-shop-system" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('shop-system')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛒</span>
                <h3 className="text-xl font-bold text-yellow-400">Shop System</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('shop-system') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('shop-system') && (
              <div className="p-4 border-t border-gray-700/50 space-y-4">
                <p className="text-gray-400 mb-4">Comprehensive shop management, pricing, and rarity systems</p>

                {/* Rarity Sorting System */}
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-purple-400 mb-3">Item Rarity Sorting System</h4>
                  <div className="space-y-3">
                    <div className="bg-black/30 rounded p-3">
                      <h5 className="text-yellow-300 font-semibold mb-2">Rarity Calculation Formula</h5>
                      <div className="font-mono text-[10px] text-gray-500 bg-black/50 p-2 rounded">
                        <div>rarityScore = baseRarity * categoryWeight * supplyFactor * demandMultiplier</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/30 rounded p-3">
                        <h5 className="text-green-400 font-semibold mb-1">Base Rarity Tiers</h5>
                        <div className="text-xs space-y-1 text-gray-400">
                          <div><span className="text-gray-300">Common:</span> 0-1000 score</div>
                          <div><span className="text-blue-300">Uncommon:</span> 1001-5000 score</div>
                          <div><span className="text-purple-300">Rare:</span> 5001-15000 score</div>
                          <div><span className="text-orange-300">Epic:</span> 15001-50000 score</div>
                          <div><span className="text-red-300">Legendary:</span> 50001+ score</div>
                        </div>
                      </div>

                      <div className="bg-black/30 rounded p-3">
                        <h5 className="text-blue-400 font-semibold mb-1">Sort Priority Factors</h5>
                        <div className="text-xs space-y-1 text-gray-400">
                          <div>1. Rarity score (primary)</div>
                          <div>2. Market demand (secondary)</div>
                          <div>3. Recent sales velocity</div>
                          <div>4. Price trend direction</div>
                          <div>5. Alphabetical (fallback)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shop Categories Configuration */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-blue-400 mb-3">Shop Categories & Filters</h4>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-gray-300 font-semibold">Main Categories</div>
                      <div className="text-gray-500 mt-1">• Meks<br/>• Chips<br/>• Materials<br/>• Blueprints</div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-gray-300 font-semibold">Sort Options</div>
                      <div className="text-gray-500 mt-1">• Rarity<br/>• Price ↑↓<br/>• Recent<br/>• Trending</div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-gray-300 font-semibold">Filters</div>
                      <div className="text-gray-500 mt-1">• Price Range<br/>• Rarity Tier<br/>• Seller<br/>• Time Listed</div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Pricing Model */}
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-green-400 mb-3">Dynamic Pricing Model</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Base Price Calculation:</span>
                      <span className="text-yellow-300 font-mono">rarityScore * 0.1 + minPrice</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Supply Adjustment:</span>
                      <span className="text-blue-300">±30% based on stock levels</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Demand Multiplier:</span>
                      <span className="text-purple-300">0.5x - 3.0x based on purchase rate</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Event Modifier:</span>
                      <span className="text-orange-300">Special sales, holidays, etc.</span>
                    </div>
                  </div>
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
                                ALL_VARIATIONS.heads.forEach((v, i) => {
                                  allVariationsData.push({
                                    ...v,
                                    category: 'head',
                                    rank: 0 // Will be assigned after sorting
                                  });
                                });

                                // Add all bodies
                                ALL_VARIATIONS.bodies.forEach((v, i) => {
                                  allVariationsData.push({
                                    ...v,
                                    category: 'body',
                                    rank: 0
                                  });
                                });

                                // Add all items
                                ALL_VARIATIONS.items.forEach((v, i) => {
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
                                const totalVariations = 309;
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
                                <div key={variation.name} className={`flex items-center justify-between px-2 py-1 rounded ${bgClass}`}>
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

          {/* Mek Rate Experiment */}
          {activeTab === 'mek-rate-experiment' && (
          <>
          <div id="section-mek-rate-experiment" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('mek-rate-experiment')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💎</span>
                <h3 className="text-xl font-bold text-yellow-400">Mek Rate Experiment</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('mek-rate-experiment') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('mek-rate-experiment') && (
              <div className="p-4 border-t border-gray-700/50">
                <MekRateExperiment />
              </div>
            )}
          </div>

          {/* NFT Rate Admin Control Panel */}
          <div id="section-mek-rate-admin" className="bg-black/50 backdrop-blur border-2 border-purple-500/30 rounded-lg shadow-lg shadow-black/50 mt-4">
            <button
              onClick={() => toggleSection('mek-rate-admin')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎛️</span>
                <h3 className="text-xl font-bold text-purple-400">NFT Rate Admin Control Panel</h3>
                <span className="px-2 py-1 bg-purple-600/30 text-purple-400 text-xs font-bold rounded">NEW</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('mek-rate-admin') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('mek-rate-admin') && (
              <div className="p-4 border-t border-gray-700/50">
                <MekRateAdmin />
              </div>
            )}
          </div>
          </>
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

          {/* Wallet Management */}
          {activeTab === 'wallet-management' && (
          <div id="section-wallet-management" className="bg-black/50 backdrop-blur border-2 border-blue-500/30 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4">
                <p className="text-gray-400 mb-4">
                  View and manage all connected wallets. Reset verification status for testing or permanently remove wallets from the system.
                </p>

                {/* Wallet Management Component with built-in tabs */}
                <WalletManagementAdmin />
              </div>
          </div>
          )}

          {/* Bot Testing System - DISABLED */}
          {activeTab === 'bot-testing' && (
            <div id="section-bot-testing" className="bg-black/50 backdrop-blur border-2 border-yellow-500/30 rounded-lg shadow-lg shadow-black/50">
              <div className="p-4">
                <p className="text-gray-400 mb-4">
                  Bot testing system has been disabled to reduce Blockfrost API usage.
                </p>
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

        </div>
      </div>

      {/* Game Data Lightbox */}
      <GameDataLightbox
        isOpen={showGameDataLightbox}
        onClose={() => setShowGameDataLightbox(false)}
      />
    </div>
  );
}