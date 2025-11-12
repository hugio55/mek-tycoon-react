'use client';

import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// Debug control configuration storage key (for backward compatibility and migration)
const STORAGE_KEY = 'mek-landing-debug-config';
const MIGRATION_FLAG = 'mek-landing-debug-migrated';

// Default values matching landing page
const DEFAULT_CONFIG = {
  starScale: 1,
  starSpeed: 3,
  starFrequency: 200,
  // Layer 1 Twinkling
  twinkleAmount: 0,
  twinkleSpeed: 1.0,
  twinkleSpeedRandomness: 50,
  sizeRandomness: 50,
  starScale2: 1,
  starSpeed2: 10,
  starFrequency2: 100,
  lineLength2: 2,
  // Layer 2 Twinkling
  twinkleAmount2: 0,
  twinkleSpeed2: 1.0,
  twinkleSpeedRandomness2: 50,
  sizeRandomness2: 50,
  starScale3: 1,
  starSpeed3: 10,
  starFrequency3: 100,
  lineLength3: 2,
  spawnDelay3: 50,
  // Layer 3 Twinkling
  twinkleAmount3: 0,
  twinkleSpeed3: 1.0,
  twinkleSpeedRandomness3: 50,
  sizeRandomness3: 50,
  // Background Stars
  bgStarCount: 800,
  bgStarMinBrightness: 0.1,
  bgStarMaxBrightness: 0.4,
  bgStarTwinkleSpeed: 0.5,
  bgStarTwinkleSpeedRandomness: 50,
  bgStarTwinkleAmount: 30,
  bgStarSizeRandomness: 50,
  starFadePosition: 60,
  starFadeFeatherSize: 200,
  logoSize: 600,
  logoYPosition: 0, // Now percentage offset from center (-50 to +50)
  selectedFont: 'Orbitron',
  descriptionFontSize: 18,
  descriptionText: 'A futuristic idle tycoon game featuring collectible Mek NFTs. Build your empire through resource management, strategic crafting, and automated gold generation.',
  descriptionXOffset: 0,
  descriptionYOffset: 0,
  bgYPosition: 0,
  motionBlurEnabled: true,
  blurIntensity: 50,
  descriptionColor: 'text-yellow-400/90',
  phaseHeaderFont: 'Orbitron',
  phaseHeaderFontSize: 48,
  phaseHeaderColor: 'text-white/70',
  phaseDescriptionFont: 'Arial',
  phaseDescriptionFontSize: 16,
  soundLabelFont: 'Orbitron',
  soundLabelSize: 16,
  soundLabelColor: 'text-yellow-400/90',
  soundLabelVerticalOffset: 0,
  soundLabelHorizontalOffset: 0,
  motionBlurEnabled2: false,
  blurIntensity2: 50,
  powerButtonScale: 1,
  powerButtonVerticalOffset: 0,
  powerButtonHorizontalOffset: 0,
  powerButtonGlowEnabled: true,
  speakerIconStyle: 'minimal' as 'minimal' | 'geometric' | 'bars' | 'hologram' | 'pulse',
  // PhaseCarousel Controls
  phaseImageDarkening: 30,
  phaseBlurAmount: 20,
  phaseBlurAmountSelected: 5,
  phaseColumnHeight: 288,
  phaseFadePosition: 50,
  phaseImage1: '',
  phaseImage2: '',
  phaseImage3: '',
  phaseImage4: '',
  phaseImageBlendMode: 'normal' as 'normal' | 'screen' | 'lighten' | 'lighter',
  phaseHoverDarkeningIntensity: 90,
  phaseIdleBackdropBlur: 0,
  phaseImageIdleOpacity: 100,
  phaseColumnYOffset: 0,
  // Description glass card controls
  descriptionCardBlur: 40,
  descriptionCardDarkness: 40,
  descriptionCardBorder: true,
  // Audio Consent Lightbox controls
  logoFadeDuration: 1000,
  lightboxBackdropDarkness: 95,
  audioToggleSize: 96,
  audioToggleScale: 1.0,
  toggleTextGap: 16,
  proceedButtonSize: 1.0,
  descriptionVerticalPosition: 0,
  toggleGroupVerticalPosition: 0,
  proceedButtonVerticalPosition: 0,
  // Join Beta Button controls
  joinBetaFont: 'Orbitron',
  joinBetaFontSize: 32,
  joinBetaColor: 'text-white',
  joinBetaHorizontalOffset: 0,
  joinBetaVerticalOffset: 0,
  // Audio Lightbox Description controls
  audioLightboxDescriptionFont: 'Arial',
  audioLightboxDescriptionFontSize: 18,
  audioLightboxDescriptionColor: 'text-white/70',
  // Active tab
  activeTab: 'layer1' as string,
};

type ConfigType = typeof DEFAULT_CONFIG;

export default function LandingDebugPage() {
  const [config, setConfig] = useState<ConfigType>(() => {
    console.log('[🔄SYNC] Initial state set to DEFAULT_CONFIG:', {
      logoSize: DEFAULT_CONFIG.logoSize,
      starScale: DEFAULT_CONFIG.starScale,
      bgStarCount: DEFAULT_CONFIG.bgStarCount,
      timestamp: new Date().toISOString()
    });
    return DEFAULT_CONFIG;
  });
  const [viewMode, setViewMode] = useState<'controls-only' | 'split-view'>('controls-only');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [selectedTypographyElement, setSelectedTypographyElement] = useState<'description' | 'phaseHeader' | 'phaseDescription' | 'soundLabel' | 'joinBeta' | 'audioLightboxDescription'>('description');
  const [migrationStatus, setMigrationStatus] = useState<'pending' | 'migrating' | 'complete' | 'none'>('pending');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserEditingRef = useRef(false); // Track if user is actively editing to prevent race conditions

  // NEW: Desktop/Mobile mode toggle
  const [activeMode, setActiveMode] = useState<'desktop' | 'mobile'>('desktop');

  // Convex hooks - UNIFIED table (must be declared before useEffect that uses them)
  const unifiedSettings = useQuery(api.landingDebugUnified.getUnifiedLandingDebugSettings);
  const updateUnifiedSettings = useMutation(api.landingDebugUnified.updateUnifiedLandingDebugSettings);
  const resetUnifiedSettings = useMutation(api.landingDebugUnified.resetUnifiedLandingDebugSettings);
  const migrateFromOld = useMutation(api.landingDebugUnified.migrateFromOldTables);
  const copyDesktopToMobile = useMutation(api.landingDebugUnified.copyDesktopToMobile);

  // Load correct config when switching between desktop/mobile modes
  // ONLY on mode switch, NOT on every database update (prevents race conditions)
  useEffect(() => {
    console.log('[🔄MODE-SWITCH] Effect triggered:', {
      hasUnifiedSettings: !!unifiedSettings,
      migrationStatus,
      activeMode,
      isUserEditing: isUserEditingRef.current
    });

    // Don't reload if user is actively editing (prevents slider jump bug)
    if (isUserEditingRef.current) {
      console.log('[🔄MODE-SWITCH] Skipping reload - user is editing');
      return;
    }

    if (unifiedSettings && migrationStatus === 'complete') {
      const modeConfig = activeMode === 'desktop' ? unifiedSettings.desktop : unifiedSettings.mobile;
      const mergedConfig: ConfigType = { ...DEFAULT_CONFIG, ...unifiedSettings.shared, ...modeConfig };
      console.log(`[🔄MODE-SWITCH] Loaded ${activeMode} config:`, {
        logoSize: mergedConfig.logoSize,
        descriptionFontSize: mergedConfig.descriptionFontSize,
        bgStarCount: mergedConfig.bgStarCount
      });
      setConfig(mergedConfig);
    }
  }, [activeMode, migrationStatus]); // Removed unifiedSettings from deps to prevent reload on every DB update

  // OLD: Keep old hooks for fallback during migration
  const oldDbSettings = useQuery(api.landingDebugSettings.getLandingDebugSettings);
  const rawDbData = useQuery(api.landingDebugSettings.getRawLandingDebugSettings);
  const oldUpdateSettings = useMutation(api.landingDebugSettings.updateLandingDebugSettings);
  const oldResetSettings = useMutation(api.landingDebugSettings.resetLandingDebugSettings);
  const oldCreateBackup = useMutation(api.landingDebugSettings.createBackup);

  // Use unified settings if available, fall back to old system
  const dbSettings = unifiedSettings
    ? { ...unifiedSettings.shared, ...(activeMode === 'desktop' ? unifiedSettings.desktop : unifiedSettings.mobile) }
    : oldDbSettings;
  const updateSettings = updateUnifiedSettings;
  const resetSettings = resetUnifiedSettings;
  const createBackup = oldCreateBackup; // Keep using old backup system for now

  // Phase card management
  const phaseCards = useQuery(api.phaseCards.getAllPhaseCards);
  const createPhaseCard = useMutation(api.phaseCards.createPhaseCard);
  const updatePhaseCard = useMutation(api.phaseCards.updatePhaseCard);
  const deletePhaseCard = useMutation(api.phaseCards.deletePhaseCard);
  const reorderPhaseCards = useMutation(api.phaseCards.reorderPhaseCards);
  const initializeDefaultPhaseCards = useMutation(api.phaseCards.initializeDefaultPhaseCards);

  const [editingPhaseId, setEditingPhaseId] = useState<Id<"phaseCards"> | null>(null);
  const [newPhaseForm, setNewPhaseForm] = useState<{
    header: string;
    subtitle: string;
    title: string;
    description: string;
    imageUrl: string;
    locked: boolean;
  }>({
    header: '',
    subtitle: '',
    title: '',
    description: '',
    imageUrl: '',
    locked: false,
  });

  // Phase text editor state
  const [selectedPhaseForEdit, setSelectedPhaseForEdit] = useState<Id<"phaseCards"> | null>(null);
  const [phaseEditForm, setPhaseEditForm] = useState<{
    header: string;
    subtitle: string;
    title: string;
    description: string;
    imageUrl: string;
  }>({
    header: '',
    subtitle: '',
    title: '',
    description: '',
    imageUrl: '',
  });

  // Audio Consent Lightbox Control (for landing page)
  const [audioConsentVisible, setAudioConsentVisible] = useState(false);

  // Function to trigger audio consent lightbox on landing page
  const triggerAudioConsentOnLandingPage = () => {
    // ALWAYS clear consent when showing the lightbox (so it appears on every refresh)
    localStorage.removeItem('mek-audio-consent');

    if (!audioConsentVisible) {
      // Show: trigger landing page to display lightbox
      localStorage.setItem('mek-debug-trigger', JSON.stringify({ action: 'show-audio-consent' }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'mek-debug-trigger' }));
    } else {
      // Hide: restore consent and trigger landing page
      localStorage.setItem('mek-audio-consent', JSON.stringify({ audioEnabled: false, timestamp: Date.now() }));
      localStorage.setItem('mek-debug-trigger', JSON.stringify({ action: 'hide-audio-consent' }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'mek-debug-trigger' }));
    }
    setAudioConsentVisible(!audioConsentVisible);

    // Also notify iframe if in split-view
    const iframe = document.querySelector('iframe[title="Landing Page Preview"]') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'mek-debug-trigger',
        action: !audioConsentVisible ? 'show-audio-consent' : 'hide-audio-consent'
      }, '*');
    }
  };

  // RECOVERY: Restore settings from localStorage backup
  const recoverFromLocalStorage = () => {
    const localStorageData = localStorage.getItem(STORAGE_KEY);

    if (!localStorageData) {
      alert('❌ No backup found in localStorage.\n\nYour custom settings may have been overwritten by the mobile debug page (which shared the same database table).\n\nThe mobile page now uses a separate table to prevent future conflicts.\n\nPlease check the console for [🔍DB-RAW] logs to see what\'s currently in the database.');
      return;
    }

    try {
      const parsed = JSON.parse(localStorageData);
      console.log('[🔄RECOVERY] Found localStorage backup:', {
        logoSize: parsed.logoSize,
        starScale: parsed.starScale,
        bgStarCount: parsed.bgStarCount,
        selectedFont: parsed.selectedFont,
        descriptionFontSize: parsed.descriptionFontSize,
      });

      if (confirm('✅ Found backup in localStorage!\n\nSample values:\n' +
        `- Logo Size: ${parsed.logoSize}\n` +
        `- Star Scale: ${parsed.starScale}\n` +
        `- BG Star Count: ${parsed.bgStarCount}\n` +
        `- Font: ${parsed.selectedFont}\n` +
        `- Description Size: ${parsed.descriptionFontSize}\n\n` +
        'Do you want to restore these settings to the database?')) {

        const mergedConfig: ConfigType = { ...DEFAULT_CONFIG, ...parsed };
        setSaveState('saving');
        updateSettings({ config: mergedConfig }).then(() => {
          console.log('[🔄RECOVERY] Successfully restored settings from localStorage');
          setConfig(mergedConfig);
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 2000);
          alert('✅ Settings restored successfully!\n\nYour custom settings have been recovered and saved to the database.');
        }).catch((err) => {
          console.error('[🔄RECOVERY] Failed to restore settings:', err);
          alert('❌ Failed to save restored settings to database.\n\nCheck console for error details.');
        });
      }
    } catch (e) {
      console.error('[🔄RECOVERY] Failed to parse localStorage backup:', e);
      alert('❌ Found backup but failed to parse it.\n\nCheck console for error details.');
    }
  };

  // Available fonts for testing
  const fonts = [
    'Orbitron',
    'Rajdhani',
    'Exo 2',
    'Electrolize',
    'Audiowide',
    'Michroma',
    'Saira',
    'Play',
    'Quantico',
    'Arial',
    'Helvetica',
    'Courier New',
    'Georgia',
    'Times New Roman'
  ];

  // Description text color options
  const colorOptions = [
    { name: 'White', class: 'text-white' },
    { name: 'Light Gray', class: 'text-gray-300' },
    { name: 'Medium Gray', class: 'text-gray-400' },
    { name: 'Dark Gray', class: 'text-gray-500' },
    { name: 'Yellow', class: 'text-yellow-400/90' }
  ];

  // ONE-TIME MIGRATION: Load config from localStorage and migrate to Convex
  useEffect(() => {
    console.log('[🔄SYNC] Migration effect triggered', {
      dbSettingsLoaded: !!dbSettings,
      migrationStatus,
      timestamp: new Date().toISOString()
    });

    if (!dbSettings) {
      console.log('[🔄SYNC] Waiting for database to load...');
      return; // Wait for database to load
    }

    console.log('[🔄SYNC] Database settings received:', {
      logoSize: dbSettings.logoSize,
      starScale: dbSettings.starScale,
      bgStarCount: dbSettings.bgStarCount,
      sampleKeys: Object.keys(dbSettings).slice(0, 10)
    });

    // Log raw database data with timestamps for diagnostics
    if (rawDbData) {
      console.log('[🔍DB-RAW] Raw database record:', {
        _id: rawDbData._id,
        _creationTime: new Date(rawDbData._creationTime).toISOString(),
        createdAt: new Date(rawDbData.createdAt).toISOString(),
        updatedAt: new Date(rawDbData.updatedAt).toISOString(),
        sampleValues: rawDbData.sampleValues,
        timeSinceUpdate: Math.round((Date.now() - rawDbData.updatedAt) / 1000) + ' seconds ago'
      });
    }

    const alreadyMigrated = localStorage.getItem(MIGRATION_FLAG) === 'true';
    const localStorageData = localStorage.getItem(STORAGE_KEY);

    console.log('[🔄SYNC] Migration check:', {
      alreadyMigrated,
      hasLocalStorageData: !!localStorageData,
      migrationStatus
    });

    if (alreadyMigrated || !localStorageData) {
      // No migration needed - merge database settings with defaults to ensure new properties exist
      const mergedConfig: ConfigType = { ...DEFAULT_CONFIG, ...dbSettings };
      console.log('[🔄SYNC] No migration needed, using DB settings:', {
        logoSize: mergedConfig.logoSize,
        starScale: mergedConfig.starScale,
        bgStarCount: mergedConfig.bgStarCount
      });

      // Only update config if it's different (deep comparison to prevent infinite loop)
      const configChanged = JSON.stringify(config) !== JSON.stringify(mergedConfig);
      if (configChanged) {
        console.log('[🔄SYNC] Config changed, updating state');
        setConfig(mergedConfig);
      }

      if (migrationStatus !== 'complete') {
        setMigrationStatus('complete');
      }
      return;
    }

    // Migration needed - localStorage has data but hasn't been migrated
    setMigrationStatus('migrating');
    console.log('[MIGRATION] Migrating localStorage settings to Convex database...');

    try {
      const parsed = JSON.parse(localStorageData);
      const mergedConfig: ConfigType = { ...DEFAULT_CONFIG, ...parsed };

      // Save to database - use UNIFIED table if available
      if (unifiedSettings) {
        // Save to correct section of unified table based on active mode
        const updateData = activeMode === 'desktop'
          ? { desktop: mergedConfig }
          : { mobile: mergedConfig };

        updateSettings(updateData).then(() => {
          console.log('[MIGRATION] Successfully migrated settings to UNIFIED database');
          localStorage.setItem(MIGRATION_FLAG, 'true');
          setConfig(mergedConfig);
          setMigrationStatus('complete');
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 2000);
        }).catch((err) => {
          console.error('[MIGRATION] Failed to migrate settings:', err);
        });
      } else {
        // Fallback to old system
        oldUpdateSettings({ config: mergedConfig }).then(() => {
          console.log('[MIGRATION] Successfully migrated settings to OLD database');
          localStorage.setItem(MIGRATION_FLAG, 'true');
          setConfig(mergedConfig);
          setMigrationStatus('complete');
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 2000);
        }).catch((err) => {
          console.error('[MIGRATION] Failed to migrate settings:', err);
          setMigrationStatus('complete');
          setConfig(mergedConfig); // Still use the merged config even if save failed
        });
      }
    } catch (e) {
      console.error('[MIGRATION] Failed to parse localStorage config:', e);
      // Merge with defaults even on error to ensure new properties exist
      const mergedConfig: ConfigType = { ...DEFAULT_CONFIG, ...dbSettings };
      setConfig(mergedConfig);
      setMigrationStatus('complete');
    }
  }, [dbSettings, updateSettings, migrationStatus]); // Removed 'config' to prevent race condition

  // Load settings from Convex when they change (updates from other tabs/sessions)
  useEffect(() => {
    console.log('[🔄SYNC] DB sync effect triggered', {
      dbSettingsLoaded: !!dbSettings,
      migrationStatus,
      isUserEditing: isUserEditingRef.current,
      timestamp: new Date().toISOString()
    });

    // Don't reload if user is actively editing (prevents slider jump bug)
    if (isUserEditingRef.current) {
      console.log('[🔄SYNC] Skipping reload - user is editing');
      return;
    }

    if (dbSettings && migrationStatus === 'complete') {
      // Merge with defaults to ensure new properties exist
      const mergedConfig: ConfigType = { ...DEFAULT_CONFIG, ...dbSettings };
      console.log('[🔄SYNC] Updating config from DB:', {
        logoSize: mergedConfig.logoSize,
        starScale: mergedConfig.starScale,
        bgStarCount: mergedConfig.bgStarCount
      });

      // Update config (removed JSON comparison to prevent stale closure issues)
      setConfig(mergedConfig);
    }
  }, [dbSettings, migrationStatus]); // Removed 'config' from deps to prevent race condition

  // Auto-save to Convex with debouncing (500ms delay)
  useEffect(() => {
    console.log('[💾SAVE] Auto-save effect triggered', {
      migrationStatus,
      configLogoSize: config.logoSize,
      configStarScale: config.starScale,
      configBgStarCount: config.bgStarCount,
      timestamp: new Date().toISOString()
    });

    if (migrationStatus !== 'complete') {
      console.log('[💾SAVE] Skipping save - migration not complete');
      return; // Don't save during migration
    }

    // Mark that user is editing (prevents mode-switch effect from overwriting changes)
    isUserEditingRef.current = true;
    console.log('[💾SAVE] User editing flag set to TRUE');

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    console.log('[💾SAVE] Scheduling save in 500ms...');

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      console.log('[💾SAVE] Executing save to database:', {
        logoSize: config.logoSize,
        starScale: config.starScale,
        bgStarCount: config.bgStarCount
      });
      setSaveState('saving');

      try {
        // STEP 1: Create backup BEFORE saving (prevents data loss)
        console.log('[💾BACKUP] Creating backup before save...');
        await createBackup({
          config,
          description: 'Auto-backup before save'
        });
        console.log('[💾BACKUP] Backup created successfully');

        // STEP 2: Save the new settings to correct section based on active mode
        if (unifiedSettings) {
          const updateData = activeMode === 'desktop'
            ? { desktop: config }
            : { mobile: config };
          await updateSettings(updateData);
          console.log(`[💾SAVE] Save successful to UNIFIED ${activeMode} section`);
        } else {
          await oldUpdateSettings({ config });
          console.log('[💾SAVE] Save successful to OLD table');
        }
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 1500);

        // Clear editing flag after save completes (allow mode-switch reloads again)
        setTimeout(() => {
          isUserEditingRef.current = false;
          console.log('[💾SAVE] User editing flag reset to FALSE (save complete)');
        }, 2000); // Wait 2s after save to ensure state is stable

        // Also dispatch events for real-time preview updates
        window.dispatchEvent(new Event('mek-landing-config-updated'));
        const iframe = document.querySelector('iframe[title="Landing Page Preview"]') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'mek-landing-config-updated' }, '*');
        }
      } catch (err) {
        console.error('[SAVE] Failed to save settings:', err);
        setSaveState('idle');
        // Reset editing flag on error too
        isUserEditingRef.current = false;
        console.log('[💾SAVE] User editing flag reset to FALSE (save error)');
      }
    }, 500); // 500ms debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [config, updateSettings, migrationStatus]);

  // Also keep localStorage updated for backward compatibility with landing page
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('mek-config-update'));
  }, [config]);

  // Helper function to convert Windows absolute paths to web-relative paths
  const convertToWebPath = (path: string): string => {
    // Remove quotes if present
    let cleanPath = path.trim().replace(/^["']|["']$/g, '');

    // If it's already a web path (starts with / or http), return as-is
    if (cleanPath.startsWith('/') || cleanPath.startsWith('http')) {
      return cleanPath;
    }

    // Convert Windows path to web path
    // Extract everything after "public\" or "public/"
    const publicIndex = cleanPath.toLowerCase().lastIndexOf('public\\');
    const publicIndexForward = cleanPath.toLowerCase().lastIndexOf('public/');

    if (publicIndex !== -1) {
      // Found "public\" - extract path after it and convert backslashes to forward slashes
      const webPath = '/' + cleanPath.substring(publicIndex + 7).replace(/\\/g, '/');
      return webPath;
    } else if (publicIndexForward !== -1) {
      // Found "public/" - extract path after it
      const webPath = '/' + cleanPath.substring(publicIndexForward + 7);
      return webPath;
    }

    // If no "public" found, return the original (might be relative path)
    return cleanPath;
  };

  const updateConfig = <K extends keyof ConfigType>(key: K, value: ConfigType[K]) => {
    console.log(`[🎚️CHANGE] updateConfig fired:`, {
      key,
      value,
      currentConfigValue: config[key],
      timestamp: performance.now(),
      flagBefore: isUserEditingRef.current
    });

    // Mark as user editing to prevent race conditions
    isUserEditingRef.current = true;

    // Auto-convert image paths for phase image fields
    if ((key === 'phaseImage1' || key === 'phaseImage2' || key === 'phaseImage3' || key === 'phaseImage4') && typeof value === 'string') {
      console.log(`[🎚️PRE-UPDATE] About to call setConfig for ${key} (image path)`);
      const convertedPath = convertToWebPath(value);
      setConfig(prev => {
        console.log(`[🎚️UPDATE] Setting config.${key} to:`, convertedPath);
        return { ...prev, [key]: convertedPath as ConfigType[K] };
      });
      console.log(`[🎚️POST-UPDATE] Called setConfig for ${key}`);
    } else {
      console.log(`[🎚️PRE-UPDATE] About to call setConfig for ${key}, value:`, value);
      setConfig(prev => {
        console.log(`[🎚️UPDATE] Setting config.${key} to:`, value);
        return { ...prev, [key]: value };
      });
      console.log(`[🎚️POST-UPDATE] Called setConfig for ${key}`);
    }

    // Debug log for phaseIdleBackdropBlur changes
    if (key === 'phaseIdleBackdropBlur') {
      console.log('[🔍BLUR] Slider changed in landing-debug:', value);
    }
  };

  // Handler to mark editing state
  const handleInputStart = () => {
    console.log('[🎚️START] Mouse/touch down - user started dragging', {
      timestamp: performance.now(),
      flagBefore: isUserEditingRef.current
    });
    isUserEditingRef.current = true;
  };

  const handleInputEnd = () => {
    console.log('[🎚️END] Mouse/touch up - user stopped dragging', {
      timestamp: performance.now(),
      flagBefore: isUserEditingRef.current
    });
    isUserEditingRef.current = false;
  };

  const setActiveTab = (tabId: string) => {
    setConfig(prev => ({ ...prev, activeTab: tabId }));
  };

  const resetToDefaults = async () => {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;

    setSaveState('saving');
    try {
      await resetSettings();
      setConfig(DEFAULT_CONFIG);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (err) {
      console.error('[RESET] Failed to reset settings:', err);
      setSaveState('idle');
    }
  };

  const handleSave = () => {
    // Settings are already auto-saving with debounce
    // This button just provides immediate visual feedback
    setSaveState('saving');

    // Force immediate save by calling mutation directly
    updateSettings({ config }).then(() => {
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);

      // Dispatch events for real-time updates
      window.dispatchEvent(new Event('mek-landing-config-updated'));
      const iframe = document.querySelector('iframe[title="Landing Page Preview"]') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'mek-landing-config-updated' }, '*');
      }
    }).catch((err) => {
      console.error('[SAVE] Failed to save settings:', err);
      setSaveState('idle');
    });
  };

  // Phase card management functions
  const handleCreatePhase = async () => {
    if (!newPhaseForm.title.trim()) return;

    const nextOrder = phaseCards ? phaseCards.length + 1 : 1;

    await createPhaseCard({
      header: newPhaseForm.header || undefined,
      subtitle: newPhaseForm.subtitle || undefined,
      title: newPhaseForm.title,
      description: newPhaseForm.description || undefined,
      imageUrl: newPhaseForm.imageUrl || undefined,
      locked: newPhaseForm.locked,
      order: nextOrder,
    });

    setNewPhaseForm({ header: '', subtitle: '', title: '', description: '', imageUrl: '', locked: false });
  };

  const handleUpdatePhase = async (id: Id<"phaseCards">, updates: { header?: string; title?: string; description?: string; imageUrl?: string; locked?: boolean }) => {
    await updatePhaseCard({ id, ...updates });
    setEditingPhaseId(null);
  };

  const handleDeletePhase = async (id: Id<"phaseCards">) => {
    if (!confirm('Are you sure you want to delete this phase card?')) return;
    await deletePhaseCard({ id });
  };

  const handleMovePhaseUp = async (id: Id<"phaseCards">, currentOrder: number) => {
    if (!phaseCards || currentOrder <= 1) return;

    const phaseToSwap = phaseCards.find(p => p.order === currentOrder - 1);
    if (!phaseToSwap) return;

    await reorderPhaseCards({
      cardOrders: [
        { id, order: currentOrder - 1 },
        { id: phaseToSwap._id, order: currentOrder },
      ],
    });
  };

  const handleMovePhaseDown = async (id: Id<"phaseCards">, currentOrder: number) => {
    if (!phaseCards || currentOrder >= phaseCards.length) return;

    const phaseToSwap = phaseCards.find(p => p.order === currentOrder + 1);
    if (!phaseToSwap) return;

    await reorderPhaseCards({
      cardOrders: [
        { id, order: currentOrder + 1 },
        { id: phaseToSwap._id, order: currentOrder },
      ],
    });
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('Initialize default phase cards? This only works if no cards exist yet.')) return;
    const result = await initializeDefaultPhaseCards();
    alert(result.message);
  };

  // Handle phase selection in text editor
  useEffect(() => {
    if (selectedPhaseForEdit && phaseCards) {
      const phase = phaseCards.find(p => p._id === selectedPhaseForEdit);
      if (phase) {
        setPhaseEditForm({
          header: phase.header || '',
          subtitle: phase.subtitle || '',
          title: phase.title,
          description: phase.description || '',
          imageUrl: phase.imageUrl || '',
        });
      }
    }
  }, [selectedPhaseForEdit, phaseCards]);

  const handleSavePhaseText = async () => {
    if (!selectedPhaseForEdit) return;

    await updatePhaseCard({
      id: selectedPhaseForEdit,
      header: phaseEditForm.header || undefined,
      subtitle: phaseEditForm.subtitle || undefined,
      title: phaseEditForm.title,
      description: phaseEditForm.description || undefined,
      imageUrl: phaseEditForm.imageUrl || undefined,
    });
  };

  // Missing function referenced in UI
  const handleSavePhase = async (id: Id<"phaseCards">) => {
    const headerInput = document.getElementById(`edit-header-${id}`) as HTMLInputElement;
    const titleInput = document.getElementById(`edit-title-${id}`) as HTMLInputElement;
    const descInput = document.getElementById(`edit-description-${id}`) as HTMLTextAreaElement;
    const imageUrlInput = document.getElementById(`edit-imageUrl-${id}`) as HTMLInputElement;
    const lockedInput = document.getElementById(`edit-locked-${id}`) as HTMLInputElement;

    if (titleInput) {
      await handleUpdatePhase(id, {
        header: headerInput?.value || undefined,
        title: titleInput.value,
        description: descInput?.value || undefined,
        imageUrl: imageUrlInput?.value || undefined,
        locked: lockedInput?.checked,
      });
    }
  };

  // Missing function referenced in UI
  const handleMovePhase = async (id: Id<"phaseCards">, direction: 'up' | 'down') => {
    const phase = phaseCards?.find(p => p._id === id);
    if (!phase) return;

    if (direction === 'up') {
      await handleMovePhaseUp(id, phase.order);
    } else {
      await handleMovePhaseDown(id, phase.order);
    }
  };

  // Tab categories
  const tabs = [
    { id: 'layer1', label: 'Layer 1' },
    { id: 'layer2', label: 'Layer 2' },
    { id: 'layer3', label: 'Layer 3' },
    { id: 'bgstars', label: 'BG Stars' },
    { id: 'logo', label: 'Logo' },
    { id: 'description', label: 'Description' },
    { id: 'phases', label: 'Phases' },
    { id: 'audio', label: 'Audio' },
    { id: 'motion', label: 'Motion Blur' },
    { id: 'power', label: 'Power Button' },
    { id: 'speaker', label: 'Speaker' },
    { id: 'other', label: 'Other' },
  ];

  // Loading state - wait for database to load before rendering
  if (!dbSettings || migrationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading debug controls...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${viewMode === 'split-view' ? 'flex' : 'bg-gray-900 p-3'}`}>
      <div
        className={viewMode === 'split-view' ? 'w-1/2 bg-gray-800 p-3 overflow-y-auto border-r border-gray-700' : 'max-w-5xl mx-auto'}
        style={{ zoom: 0.75 }}
      >
        {/* Desktop/Mobile Mode Toggle */}
        <div className="mb-4 p-4 bg-gray-800 border-2 border-yellow-500 rounded-lg">
          <h1 className="text-2xl font-bold text-yellow-400 text-center mb-3">
            {activeMode === 'desktop' ? '🖥️ DESKTOP MODE' : '📱 MOBILE MODE'}
          </h1>
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => setActiveMode('desktop')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                activeMode === 'desktop'
                  ? 'bg-blue-600 text-white border-2 border-blue-400'
                  : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
              }`}
            >
              🖥️ Desktop (≥1024px)
            </button>
            <button
              onClick={() => setActiveMode('mobile')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                activeMode === 'mobile'
                  ? 'bg-green-600 text-white border-2 border-green-400'
                  : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
              }`}
            >
              📱 Mobile (&lt;1024px)
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            All settings below will save to {activeMode === 'desktop' ? 'desktop' : 'mobile'} configuration
          </p>

          {/* Copy Desktop to Mobile Button */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <button
              onClick={async () => {
                if (!confirm('Copy all desktop settings to mobile? This will overwrite current mobile settings.')) {
                  return;
                }
                try {
                  const result = await copyDesktopToMobile();
                  if (result.success) {
                    alert(`✅ ${result.message}\nCopied ${result.copiedSettings} settings from desktop to mobile.`);
                    // If currently on mobile, reload to show new settings
                    if (activeMode === 'mobile') {
                      window.location.reload();
                    }
                  } else {
                    alert(`❌ ${result.message}`);
                  }
                } catch (err) {
                  console.error('Failed to copy desktop to mobile:', err);
                  alert('❌ Failed to copy settings. See console for details.');
                }
              }}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              📋 Copy Desktop Settings to Mobile
            </button>
            <p className="text-center text-xs text-gray-400 mt-1">
              Use this to sync mobile with desktop. Mobile will start identical to desktop, then you can adjust specific values.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-semibold text-gray-100">
              Landing Page Debug Controls
            </h1>
            {migrationStatus === 'migrating' && (
              <div className="px-2 py-1 bg-yellow-900/50 border border-yellow-700 rounded text-yellow-200 text-xs">
                Migrating to database...
              </div>
            )}
            {migrationStatus === 'complete' && saveState === 'idle' && (
              <div className="px-2 py-1 bg-green-900/30 border border-green-700/50 rounded text-green-300 text-xs">
                Auto-save enabled
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Settings now saved to database (survives code refactors). Auto-saves after 500ms of inactivity.
          </p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <a
              href="/landing"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs hover:bg-gray-600"
            >
              Open Landing Page
            </a>
            <button
              onClick={() => setViewMode(viewMode === 'controls-only' ? 'split-view' : 'controls-only')}
              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs hover:bg-gray-600"
            >
              {viewMode === 'controls-only' ? 'Show Preview' : 'Hide Preview'}
            </button>
            <button
              onClick={handleSave}
              disabled={saveState === 'saving'}
              className={`px-2 py-1 rounded text-xs ${
                saveState === 'saved'
                  ? 'bg-blue-900/50 border border-blue-700 text-blue-200'
                  : saveState === 'saving'
                  ? 'bg-gray-700 border border-gray-600 text-gray-500 cursor-wait'
                  : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {saveState === 'saved' ? 'Settings Saved' : saveState === 'saving' ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={resetToDefaults}
              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs hover:bg-gray-600"
            >
              Reset to Defaults
            </button>
            <button
              onClick={recoverFromLocalStorage}
              className="px-2 py-1 bg-yellow-700 border border-yellow-600 rounded text-yellow-100 text-xs hover:bg-yellow-600 font-semibold"
            >
              🔧 Recover from Backup
            </button>
            <button
              onClick={triggerAudioConsentOnLandingPage}
              className={`px-2 py-1 rounded text-xs ${
                audioConsentVisible
                  ? 'bg-green-900/50 border border-green-700 text-green-200'
                  : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {audioConsentVisible ? 'Hide Landing Audio Consent' : 'Show Landing Audio Consent'}
            </button>
          </div>
        </div>

        {/* TEST SLIDER - Debug slider responsiveness */}
        <div className="mb-4 p-4 bg-red-900/20 border-2 border-red-500 rounded">
          <h3 className="text-sm font-bold text-red-300 mb-2">🚨 DEBUG TEST SLIDER</h3>
          <p className="text-xs text-gray-300 mb-2">
            If this slider doesn't work, the issue is NOT in the effects. Check browser console for [🎚️] logs.
          </p>
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-300 whitespace-nowrap">Test Value:</label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={config.logoSize}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                console.log('[🚨TEST] Slider onChange fired! Value:', val);
                updateConfig('logoSize', val);
              }}
              onMouseDown={(e) => {
                console.log('[🚨TEST] Mouse DOWN on slider');
                handleInputStart();
              }}
              onMouseUp={(e) => {
                console.log('[🚨TEST] Mouse UP on slider');
                handleInputEnd();
              }}
              className="flex-1"
            />
            <span className="text-sm text-white font-mono w-12 text-center">{config.logoSize}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-700 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-t text-sm font-medium transition-colors ${
                config.activeTab === tab.id
                  ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Debug Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

          {/* Star Controls Section - Layer 1 */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Layer 1 Star Field
            </h2>
            {/* Star Scale */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Star Scale
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={config.starScale}
                onChange={(e) => updateConfig('starScale', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.starScale.toFixed(1)}x
              </div>
            </div>

            {/* Size Randomness */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Size Randomness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.sizeRandomness}
                onChange={(e) => updateConfig('sizeRandomness', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.sizeRandomness}%
              </div>
            </div>

            {/* Star Speed */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Star Speed
              </label>
              <input
                type="range"
                min="0.5"
                max="30"
                step="0.5"
                value={config.starSpeed}
                onChange={(e) => updateConfig('starSpeed', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.starSpeed.toFixed(1)}x
              </div>
            </div>

            {/* Star Density */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Star Density
              </label>
              <input
                type="range"
                min="50"
                max="1500"
                step="10"
                value={config.starFrequency}
                onChange={(e) => updateConfig('starFrequency', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.starFrequency} stars
              </div>
            </div>
          </div>

          {/* Layer 1 Twinkling Controls */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Layer 1 Twinkling
            </h2>

            {/* Twinkle Speed */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Twinkle Speed
              </label>
              <input
                type="range"
                min="0.1"
                max="30"
                step="0.1"
                value={config.twinkleSpeed}
                onChange={(e) => updateConfig('twinkleSpeed', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.twinkleSpeed.toFixed(1)}x
              </div>
            </div>

            {/* Twinkle Speed Randomness */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Twinkle Speed Randomness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.twinkleSpeedRandomness}
                onChange={(e) => updateConfig('twinkleSpeedRandomness', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.twinkleSpeedRandomness}%
              </div>
            </div>

            {/* Twinkle Amount */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Twinkle Amount (0 = off)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.twinkleAmount}
                onChange={(e) => updateConfig('twinkleAmount', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.twinkleAmount}%
              </div>
            </div>
          </div>

          {/* Star Controls Section - Layer 2 */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Layer 2 Star Field
            </h2>

            {/* Star Scale 2 */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Star Scale
              </label>
              <input
                type="range"
                min="0.3"
                max="3"
                step="0.1"
                value={config.starScale2}
                onChange={(e) => updateConfig('starScale2', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.starScale2.toFixed(1)}x
              </div>
            </div>

            {/* Star Speed 2 */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Star Speed
              </label>
              <input
                type="range"
                min="0.5"
                max="75"
                step="0.5"
                value={config.starSpeed2}
                onChange={(e) => updateConfig('starSpeed2', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.starSpeed2.toFixed(1)}x
              </div>
            </div>

            {/* Star Density 2 */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Star Density
              </label>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={config.starFrequency2}
                onChange={(e) => updateConfig('starFrequency2', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.starFrequency2} stars
              </div>
            </div>

            {/* Line Length 2 */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Line Length
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={config.lineLength2}
                onChange={(e) => updateConfig('lineLength2', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.lineLength2.toFixed(1)}x
              </div>
            </div>
          </div>

          {/* Layer 2 Twinkling Controls */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Layer 2 Twinkling
            </h2>

            {/* Twinkle Speed */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Twinkle Speed
              </label>
              <input
                type="range"
                min="0.1"
                max="30"
                step="0.1"
                value={config.twinkleSpeed2}
                onChange={(e) => updateConfig('twinkleSpeed2', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.twinkleSpeed2.toFixed(1)}x
              </div>
            </div>

            {/* Twinkle Speed Randomness */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Twinkle Speed Randomness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.twinkleSpeedRandomness2}
                onChange={(e) => updateConfig('twinkleSpeedRandomness2', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.twinkleSpeedRandomness2}%
              </div>
            </div>

            {/* Twinkle Amount */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Twinkle Amount (0 = off)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.twinkleAmount2}
                onChange={(e) => updateConfig('twinkleAmount2', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.twinkleAmount2}%
              </div>
            </div>
          </div>

          {/* Star Controls Section - Layer 3 */}
          <div className="bg-gray-800 border border-purple-500 rounded p-3">
            <h2 className="text-sm font-semibold text-purple-400 mb-2 pb-1 border-b border-purple-700">
              Layer 3 Star Field
            </h2>

            {/* Star Scale 3 */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Star Scale
              </label>
              <input
                type="range"
                min="0.3"
                max="3"
                step="0.1"
                value={config.starScale3}
                onChange={(e) => updateConfig('starScale3', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.starScale3.toFixed(1)}x
              </div>
            </div>

            {/* Star Speed 3 */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Star Speed
              </label>
              <input
                type="range"
                min="0.5"
                max="125"
                step="0.5"
                value={config.starSpeed3}
                onChange={(e) => updateConfig('starSpeed3', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.starSpeed3.toFixed(1)}x
              </div>
            </div>

            {/* Star Density 3 */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Star Density
              </label>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={config.starFrequency3}
                onChange={(e) => updateConfig('starFrequency3', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.starFrequency3} stars
              </div>
            </div>

            {/* Line Length 3 */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Line Length
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={config.lineLength3}
                onChange={(e) => updateConfig('lineLength3', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.lineLength3.toFixed(1)}x
              </div>
            </div>

            {/* Spawn Delay 3 */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Spawn Delay (time between stars)
              </label>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={config.spawnDelay3}
                onChange={(e) => updateConfig('spawnDelay3', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.spawnDelay3}ms
              </div>
            </div>
          </div>

          {/* Layer 3 Twinkling Controls */}
          <div className="bg-gray-800 border border-purple-500 rounded p-3">
            <h2 className="text-sm font-semibold text-purple-400 mb-2 pb-1 border-b border-purple-700">
              Layer 3 Twinkling
            </h2>

            {/* Twinkle Speed */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Twinkle Speed
              </label>
              <input
                type="range"
                min="0.1"
                max="30"
                step="0.1"
                value={config.twinkleSpeed3}
                onChange={(e) => updateConfig('twinkleSpeed3', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.twinkleSpeed3.toFixed(1)}x
              </div>
            </div>

            {/* Twinkle Speed Randomness */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Twinkle Speed Randomness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.twinkleSpeedRandomness3}
                onChange={(e) => updateConfig('twinkleSpeedRandomness3', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.twinkleSpeedRandomness3}%
              </div>
            </div>

            {/* Twinkle Amount */}
            <div className="mb-2">
              <label className="block text-xs text-purple-300 mb-1">
                Twinkle Amount (0 = off)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.twinkleAmount3}
                onChange={(e) => updateConfig('twinkleAmount3', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-purple-400 text-center mt-0.5">
                {config.twinkleAmount3}%
              </div>
            </div>
          </div>

          {/* Background Stars (Static) Controls */}
          <div className="bg-gray-800 border border-orange-500 rounded p-3">
            <h2 className="text-sm font-semibold text-orange-400 mb-2 pb-1 border-b border-orange-700">
              Background Stars (Static)
            </h2>

            {/* Star Count */}
            <div className="mb-2">
              <label className="block text-xs text-orange-300 mb-1">
                Number of Stars
              </label>
              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={config.bgStarCount}
                onChange={(e) => updateConfig('bgStarCount', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-orange-400 text-center mt-0.5">
                {config.bgStarCount} stars
              </div>
            </div>

            {/* Min Brightness */}
            <div className="mb-2">
              <label className="block text-xs text-orange-300 mb-1">
                Min Brightness
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.bgStarMinBrightness}
                onChange={(e) => updateConfig('bgStarMinBrightness', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-orange-400 text-center mt-0.5">
                {config.bgStarMinBrightness.toFixed(2)}
              </div>
            </div>

            {/* Max Brightness */}
            <div className="mb-2">
              <label className="block text-xs text-orange-300 mb-1">
                Max Brightness
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.bgStarMaxBrightness}
                onChange={(e) => updateConfig('bgStarMaxBrightness', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-orange-400 text-center mt-0.5">
                {config.bgStarMaxBrightness.toFixed(2)}
              </div>
            </div>

            {/* Twinkle Speed */}
            <div className="mb-2">
              <label className="block text-xs text-orange-300 mb-1">
                Twinkle Speed
              </label>
              <input
                type="range"
                min="0.1"
                max="30"
                step="0.1"
                value={config.bgStarTwinkleSpeed}
                onChange={(e) => updateConfig('bgStarTwinkleSpeed', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-orange-400 text-center mt-0.5">
                {config.bgStarTwinkleSpeed.toFixed(1)}x
              </div>
            </div>

            {/* Twinkle Speed Randomness */}
            <div className="mb-2">
              <label className="block text-xs text-orange-300 mb-1">
                Twinkle Speed Randomness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.bgStarTwinkleSpeedRandomness}
                onChange={(e) => updateConfig('bgStarTwinkleSpeedRandomness', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-orange-400 text-center mt-0.5">
                {config.bgStarTwinkleSpeedRandomness}%
              </div>
            </div>

            {/* Twinkle Amount */}
            <div className="mb-2">
              <label className="block text-xs text-orange-300 mb-1">
                Twinkle Amount (% of stars)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.bgStarTwinkleAmount}
                onChange={(e) => updateConfig('bgStarTwinkleAmount', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-orange-400 text-center mt-0.5">
                {config.bgStarTwinkleAmount}%
              </div>
            </div>

            {/* Size Randomness */}
            <div className="mb-2">
              <label className="block text-xs text-orange-300 mb-1">
                Size Randomness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.bgStarSizeRandomness}
                onChange={(e) => updateConfig('bgStarSizeRandomness', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-orange-400 text-center mt-0.5">
                {config.bgStarSizeRandomness}%
              </div>
            </div>

            {/* Star Fade Position */}
            <div className="mb-2">
              <label className="block text-xs text-orange-300 mb-1">
                Star Fade Position
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={config.starFadePosition}
                onChange={(e) => updateConfig('starFadePosition', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-orange-400 text-center mt-0.5">
                {config.starFadePosition}%
              </div>
            </div>

            {/* Star Fade Feather Size */}
            <div className="mb-2">
              <label className="block text-xs text-orange-300 mb-1">
                Star Fade Feather Size
              </label>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={config.starFadeFeatherSize}
                onChange={(e) => updateConfig('starFadeFeatherSize', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-orange-400 text-center mt-0.5">
                {config.starFadeFeatherSize}px
              </div>
            </div>
          </div>

          {/* Layout Controls Section */}
          {true && (
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Layout & Positioning
            </h2>

            {/* Logo Size */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Logo Size
              </label>
              <input
                type="range"
                min="200"
                max="1000"
                step="10"
                value={config.logoSize}
                onChange={(e) => updateConfig('logoSize', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.logoSize}px
              </div>
            </div>

            {/* Logo Y Position */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Logo Vertical Position (% from center)
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={config.logoYPosition}
                onChange={(e) => updateConfig('logoYPosition', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.logoYPosition > 0 ? '+' : ''}{config.logoYPosition}% from center
                {config.logoYPosition > 0 ? ' (higher)' : config.logoYPosition < 0 ? ' (lower)' : ' (centered)'}
              </div>
            </div>

            {/* Background Y Position */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Background Vertical Position
              </label>
              <input
                type="range"
                min="-200"
                max="100"
                step="1"
                value={config.bgYPosition}
                onChange={(e) => updateConfig('bgYPosition', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.bgYPosition}%
              </div>
            </div>
          </div>
          )}


          {/* Typography Controls Section */}
          {true && (
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Typography
            </h2>

            {/* Element Selector Dropdown */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Edit Element
              </label>
              <select
                value={selectedTypographyElement}
                onChange={(e) => setSelectedTypographyElement(e.target.value as 'description' | 'phaseHeader' | 'phaseDescription' | 'soundLabel' | 'joinBeta' | 'audioLightboxDescription')}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-gray-500"
              >
                <option value="description">Description Text</option>
                <option value="phaseHeader">Phase Header</option>
                <option value="phaseDescription">Phase Description</option>
                <option value="soundLabel">Sound Label</option>
                <option value="joinBeta">Join Beta</option>
                <option value="audioLightboxDescription">Audio Lightbox Description</option>
              </select>
            </div>

            {/* Font Family */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Font Family
              </label>
              <select
                value={
                  selectedTypographyElement === 'description' ? config.selectedFont :
                  selectedTypographyElement === 'phaseHeader' ? config.phaseHeaderFont :
                  selectedTypographyElement === 'phaseDescription' ? config.phaseDescriptionFont :
                  selectedTypographyElement === 'joinBeta' ? config.joinBetaFont :
                  selectedTypographyElement === 'audioLightboxDescription' ? config.audioLightboxDescriptionFont :
                  config.soundLabelFont
                }
                onChange={(e) => updateConfig(
                  selectedTypographyElement === 'description' ? 'selectedFont' :
                  selectedTypographyElement === 'phaseHeader' ? 'phaseHeaderFont' :
                  selectedTypographyElement === 'phaseDescription' ? 'phaseDescriptionFont' :
                  selectedTypographyElement === 'audioLightboxDescription' ? 'audioLightboxDescriptionFont' :
                  selectedTypographyElement === 'joinBeta' ? 'joinBetaFont' :
                  'soundLabelFont',
                  e.target.value
                )}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-gray-500"
                style={{
                  fontFamily: selectedTypographyElement === 'description' ? config.selectedFont :
                             selectedTypographyElement === 'phaseHeader' ? config.phaseHeaderFont :
                             selectedTypographyElement === 'phaseDescription' ? config.phaseDescriptionFont :
                             selectedTypographyElement === 'joinBeta' ? config.joinBetaFont :
                             config.soundLabelFont
                }}
              >
                {fonts.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Text (Description Only) */}
            {selectedTypographyElement === 'description' && (
              <div className="mb-2">
                <label className="block text-xs text-gray-300 mb-1">
                  Description Text
                </label>
                <textarea
                  value={config.descriptionText}
                  onChange={(e) => updateConfig('descriptionText', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-2 text-gray-200 text-xs focus:outline-none focus:border-gray-500 resize-none"
                  rows={4}
                  placeholder="Enter landing page description..."
                />
                <div className="text-xs text-gray-400 mt-1">
                  {config.descriptionText.length} characters
                </div>
              </div>
            )}

            {/* Font Size */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Font Size
              </label>
              <input
                type="range"
                min="10"
                max="72"
                step="1"
                value={
                  selectedTypographyElement === 'description' ? config.descriptionFontSize :
                  selectedTypographyElement === 'phaseHeader' ? config.phaseHeaderFontSize :
                  selectedTypographyElement === 'phaseDescription' ? config.phaseDescriptionFontSize :
                  selectedTypographyElement === 'joinBeta' ? config.joinBetaFontSize :
                  selectedTypographyElement === 'audioLightboxDescription' ? config.audioLightboxDescriptionFontSize :
                  config.soundLabelSize
                }
                onChange={(e) => updateConfig(
                  selectedTypographyElement === 'description' ? 'descriptionFontSize' :
                  selectedTypographyElement === 'phaseHeader' ? 'phaseHeaderFontSize' :
                  selectedTypographyElement === 'phaseDescription' ? 'phaseDescriptionFontSize' :
                  selectedTypographyElement === 'joinBeta' ? 'joinBetaFontSize' :
                  selectedTypographyElement === 'audioLightboxDescription' ? 'audioLightboxDescriptionFontSize' :
                  'soundLabelSize',
                  parseInt(e.target.value)
                )}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {selectedTypographyElement === 'description' ? config.descriptionFontSize :
                 selectedTypographyElement === 'phaseHeader' ? config.phaseHeaderFontSize :
                 selectedTypographyElement === 'phaseDescription' ? config.phaseDescriptionFontSize :
                 selectedTypographyElement === 'joinBeta' ? config.joinBetaFontSize :
                 selectedTypographyElement === 'audioLightboxDescription' ? config.audioLightboxDescriptionFontSize :
                 config.soundLabelSize}px
              </div>
            </div>

            {/* Color */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Color
              </label>
              <select
                value={
                  selectedTypographyElement === 'description' ? config.descriptionColor :
                  selectedTypographyElement === 'phaseHeader' ? config.phaseHeaderColor :
                  selectedTypographyElement === 'joinBeta' ? config.joinBetaColor :
                  selectedTypographyElement === 'audioLightboxDescription' ? config.audioLightboxDescriptionColor :
                  config.soundLabelColor
                }
                onChange={(e) => updateConfig(
                  selectedTypographyElement === 'description' ? 'descriptionColor' :
                  selectedTypographyElement === 'phaseHeader' ? 'phaseHeaderColor' :
                  selectedTypographyElement === 'joinBeta' ? 'joinBetaColor' :
                  selectedTypographyElement === 'audioLightboxDescription' ? 'audioLightboxDescriptionColor' :
                  'soundLabelColor',
                  e.target.value
                )}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-gray-500"
              >
                {colorOptions.map((color) => (
                  <option key={color.class} value={color.class}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Horizontal Offset (Description Only) */}
            {selectedTypographyElement === 'description' && (
              <>
                <div className="mb-2">
                  <label className="block text-xs text-gray-300 mb-1">
                    Horizontal Offset (X)
                  </label>
                  <input
                    type="range"
                    min="-500"
                    max="500"
                    step="5"
                    value={config.descriptionXOffset}
                    onChange={(e) => updateConfig('descriptionXOffset', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center mt-0.5">
                    {config.descriptionXOffset}px
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block text-xs text-gray-300 mb-1">
                    Vertical Offset (Y)
                  </label>
                  <input
                    type="range"
                    min="-500"
                    max="500"
                    step="5"
                    value={config.descriptionYOffset}
                    onChange={(e) => updateConfig('descriptionYOffset', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center mt-0.5">
                    {config.descriptionYOffset}px
                  </div>
                </div>
              </>
            )}

            {/* Vertical Offset (Sound Label Only) */}
            {selectedTypographyElement === 'soundLabel' && (
              <>
                <div className="mb-2">
                  <label className="block text-xs text-gray-300 mb-1">
                    Vertical Offset
                  </label>
                  <input
                    type="range"
                    min="-500"
                    max="500"
                    step="5"
                    value={config.soundLabelVerticalOffset}
                    onChange={(e) => updateConfig('soundLabelVerticalOffset', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center mt-0.5">
                    {config.soundLabelVerticalOffset}px
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block text-xs text-gray-300 mb-1">
                    Horizontal Offset
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={config.soundLabelHorizontalOffset}
                    onChange={(e) => updateConfig('soundLabelHorizontalOffset', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center mt-0.5">
                    {config.soundLabelHorizontalOffset}px
                  </div>
                </div>
              </>
            )}

            {/* Vertical and Horizontal Offset (Join Beta Only) */}
            {selectedTypographyElement === 'joinBeta' && (
              <>
                <div className="mb-2">
                  <label className="block text-xs text-gray-300 mb-1">
                    Vertical Offset
                  </label>
                  <input
                    type="range"
                    min="-500"
                    max="500"
                    step="5"
                    value={config.joinBetaVerticalOffset}
                    onChange={(e) => updateConfig('joinBetaVerticalOffset', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center mt-0.5">
                    {config.joinBetaVerticalOffset}px
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block text-xs text-gray-300 mb-1">
                    Horizontal Offset
                  </label>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="5"
                    value={config.joinBetaHorizontalOffset}
                    onChange={(e) => updateConfig('joinBetaHorizontalOffset', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center mt-0.5">
                    {config.joinBetaHorizontalOffset}px
                  </div>
                </div>
              </>
            )}

            {/* Preview Text */}
            <div className="mt-2 p-2 bg-gray-900 rounded border border-gray-700">
              <p className="text-[10px] text-gray-500 mb-1">Preview:</p>
              {selectedTypographyElement === 'description' ? (
                <p
                  className={config.descriptionColor}
                  style={{
                    fontFamily: config.selectedFont,
                    fontSize: `${config.descriptionFontSize}px`
                  }}
                >
                  {config.descriptionText}
                </p>
              ) : (
                <div className="flex justify-center">
                  <p
                    className={`${config.soundLabelColor} uppercase tracking-wider`}
                    style={{
                      fontFamily: config.soundLabelFont,
                      fontSize: `${config.soundLabelSize}px`
                    }}
                  >
                    soundwaves
                  </p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Phase Cards Management Section */}
          <div className="mt-4 bg-gray-800 border border-yellow-500 rounded p-4">
            <h2 className="text-lg font-semibold text-yellow-400 mb-3 pb-2 border-b border-yellow-500/30">
              Phase Cards Management
            </h2>

            <div className="mb-4">
              <button
                onClick={handleInitializeDefaults}
                className="px-3 py-2 bg-blue-700 border border-blue-600 rounded text-white text-sm hover:bg-blue-600"
              >
                Initialize Default Phase Cards
              </button>
            </div>

            {/* Phase Text Editor */}
            <div className="bg-gray-900 border border-gray-700 rounded p-3 mb-4">
              <h3 className="text-sm font-semibold text-gray-100 mb-2">Edit Phase Text</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Select Phase</label>
                  <select
                    value={selectedPhaseForEdit || ''}
                    onChange={(e) => setSelectedPhaseForEdit(e.target.value as Id<"phaseCards">)}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                  >
                    <option value="">Choose a phase...</option>
                    {phaseCards?.map((phase) => (
                      <option key={phase._id} value={phase._id}>
                        {phase.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPhaseForEdit && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Header (phase label when idle)</label>
                      <input
                        type="text"
                        value={phaseEditForm.header}
                        onChange={(e) => setPhaseEditForm(prev => ({ ...prev, header: e.target.value }))}
                        placeholder="e.g., Phase I"
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Subtitle (italic text above title)</label>
                      <input
                        type="text"
                        value={phaseEditForm.subtitle}
                        onChange={(e) => setPhaseEditForm(prev => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="e.g., The Beginning"
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Title (large cyan text)</label>
                      <input
                        type="text"
                        value={phaseEditForm.title}
                        onChange={(e) => setPhaseEditForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Initialization"
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Description (body text)</label>
                      <textarea
                        value={phaseEditForm.description}
                        onChange={(e) => setPhaseEditForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        placeholder="Description paragraph..."
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Image URL</label>
                      <input
                        type="text"
                        value={phaseEditForm.imageUrl}
                        onChange={(e) => setPhaseEditForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                        placeholder="e.g., /mek-images/50px/bi1-cb1-nm1.webp"
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                      />
                    </div>
                    <button
                      onClick={handleSavePhaseText}
                      className="w-full px-3 py-2 bg-green-700 border border-green-600 rounded text-white text-sm hover:bg-green-600"
                    >
                      Save Phase Text
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Add New Phase Card Form */}
            <div className="bg-gray-900 border border-gray-700 rounded p-3 mb-4">
              <h3 className="text-sm font-semibold text-gray-100 mb-2">Add New Phase Card</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Header (optional italic text)</label>
                  <input
                    type="text"
                    value={newPhaseForm.header}
                    onChange={(e) => setNewPhaseForm(prev => ({ ...prev, header: e.target.value }))}
                    placeholder="e.g., The Beginning"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={newPhaseForm.title}
                    onChange={(e) => setNewPhaseForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Foundation"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Description (optional)</label>
                  <textarea
                    value={newPhaseForm.description}
                    onChange={(e) => setNewPhaseForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Phase description..."
                    rows={2}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Image URL (optional)</label>
                  <input
                    type="text"
                    value={newPhaseForm.imageUrl}
                    onChange={(e) => setNewPhaseForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="e.g., /mek-images/50px/bi1-cb1-nm1.webp"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newPhaseLocked"
                    checked={newPhaseForm.locked}
                    onChange={(e) => setNewPhaseForm(prev => ({ ...prev, locked: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="newPhaseLocked" className="text-xs text-gray-300">
                    Locked (coming soon)
                  </label>
                </div>
                <button
                  onClick={handleCreatePhase}
                  disabled={!newPhaseForm.title.trim()}
                  className="w-full px-3 py-2 bg-green-700 border border-green-600 rounded text-white text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Phase Card
                </button>
              </div>
            </div>

            {/* Existing Phase Cards List */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-100 mb-2">Existing Phase Cards</h3>
              {!phaseCards ? (
                <div className="text-gray-400 text-sm">Loading phase cards...</div>
              ) : phaseCards.length === 0 ? (
                <div className="text-gray-400 text-sm">No phase cards yet. Add one above or initialize defaults.</div>
              ) : (
                phaseCards.map((phase) => (
                  <div key={phase._id} className="bg-gray-900 border border-gray-700 rounded p-3">
                    {editingPhaseId === phase._id ? (
                      // Edit mode
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Header (italic)</label>
                          <input
                            type="text"
                            defaultValue={phase.header || ''}
                            id={`edit-header-${phase._id}`}
                            placeholder="e.g., The Beginning"
                            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Title (large)</label>
                          <input
                            type="text"
                            defaultValue={phase.title}
                            id={`edit-title-${phase._id}`}
                            placeholder="e.g., Foundation"
                            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Description (body)</label>
                          <textarea
                            defaultValue={phase.description || ''}
                            id={`edit-description-${phase._id}`}
                            rows={2}
                            placeholder="Description paragraph..."
                            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Image URL</label>
                          <input
                            type="text"
                            defaultValue={phase.imageUrl || ''}
                            id={`edit-imageUrl-${phase._id}`}
                            placeholder="e.g., /mek-images/50px/bi1-cb1-nm1.webp"
                            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-sm focus:outline-none focus:border-gray-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`edit-locked-${phase._id}`}
                            defaultChecked={phase.locked}
                            className="rounded"
                          />
                          <label htmlFor={`edit-locked-${phase._id}`} className="text-xs text-gray-300">
                            Locked (coming soon)
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSavePhase(phase._id)}
                            className="flex-1 px-2 py-1 bg-green-700 border border-green-600 rounded text-white text-xs hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPhaseId(null)}
                            className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div>
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <h4 className="text-gray-100 text-sm font-semibold">{phase.title}</h4>
                            {phase.description && (
                              <p className="text-gray-400 text-xs mt-0.5">{phase.description}</p>
                            )}
                            {phase.locked && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 bg-yellow-900/30 border border-yellow-700/50 rounded text-yellow-400 text-[10px]">
                                Coming Soon
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => setEditingPhaseId(phase._id)}
                            className="px-2 py-1 bg-blue-700 border border-blue-600 rounded text-white text-xs hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleMovePhase(phase._id, 'up')}
                            disabled={phaseCards.indexOf(phase) === 0}
                            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ↑ Up
                          </button>
                          <button
                            onClick={() => handleMovePhase(phase._id, 'down')}
                            disabled={phaseCards.indexOf(phase) === phaseCards.length - 1}
                            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-xs hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ↓ Down
                          </button>
                          <button
                            onClick={() => handleDeletePhase(phase._id)}
                            className="px-2 py-1 bg-red-700 border border-red-600 rounded text-white text-xs hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sound Button Controls Section */}
          {true && (
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Sound Button Controls
            </h2>
            <p className="text-xs text-gray-400 mb-2">
              Fixed top-right corner • Horizontal layout
            </p>

            {/* Sound Button Scale */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Button Scale
              </label>
              <input
                type="range"
                min="0.3"
                max="1.5"
                step="0.05"
                value={config.powerButtonScale}
                onChange={(e) => updateConfig('powerButtonScale', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.powerButtonScale.toFixed(2)}x
              </div>
            </div>

            {/* Sound Button Vertical Offset */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Button Vertical Offset
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                step="10"
                value={config.powerButtonVerticalOffset}
                onChange={(e) => updateConfig('powerButtonVerticalOffset', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.powerButtonVerticalOffset}px
              </div>
            </div>

            {/* Sound Button Horizontal Offset */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Button Horizontal Offset
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={config.powerButtonHorizontalOffset}
                onChange={(e) => updateConfig('powerButtonHorizontalOffset', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.powerButtonHorizontalOffset}px
              </div>
            </div>

            {/* Flashing Glow Effect Toggle */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Flashing Glow Effect
              </label>
              <button
                onClick={() => updateConfig('powerButtonGlowEnabled', !config.powerButtonGlowEnabled)}
                className={`w-full px-2 py-1 text-xs rounded ${
                  config.powerButtonGlowEnabled
                    ? 'bg-blue-900/50 border border-blue-700 text-blue-200'
                    : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {config.powerButtonGlowEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
          )}

          {/* Audio Consent Lightbox Controls Section */}
          {true && (
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Audio Consent Lightbox Controls
            </h2>
            <p className="text-xs text-gray-400 mb-2">
              Controls for initial audio consent lightbox appearance
            </p>

            {/* Logo Fade Duration */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Logo Fade Duration
              </label>
              <input
                type="range"
                min="300"
                max="3000"
                step="100"
                value={config.logoFadeDuration}
                onChange={(e) => updateConfig('logoFadeDuration', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.logoFadeDuration}ms
              </div>
            </div>

            {/* Lightbox Backdrop Darkness */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Lightbox Backdrop Darkness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.lightboxBackdropDarkness}
                onChange={(e) => updateConfig('lightboxBackdropDarkness', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.lightboxBackdropDarkness}%
              </div>
            </div>

            {/* Audio Toggle Size */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Audio Toggle Size
              </label>
              <input
                type="range"
                min="60"
                max="140"
                step="4"
                value={config.audioToggleSize}
                onChange={(e) => updateConfig('audioToggleSize', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.audioToggleSize}px
              </div>
            </div>

            {/* Audio Toggle Scale */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Audio Toggle Scale
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={config.audioToggleScale}
                onChange={(e) => updateConfig('audioToggleScale', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.audioToggleScale.toFixed(1)}x
              </div>
            </div>

            {/* Toggle Text Gap */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Toggle Text Gap
              </label>
              <input
                type="range"
                min="0"
                max="48"
                step="2"
                value={config.toggleTextGap}
                onChange={(e) => updateConfig('toggleTextGap', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.toggleTextGap}px
              </div>
            </div>

            {/* Proceed Button Size */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Proceed Button Size
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={config.proceedButtonSize}
                onChange={(e) => updateConfig('proceedButtonSize', parseFloat(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.proceedButtonSize.toFixed(1)}x
              </div>
            </div>

            {/* Description Vertical Position */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Description Vertical Position
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={config.descriptionVerticalPosition}
                onChange={(e) => updateConfig('descriptionVerticalPosition', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.descriptionVerticalPosition}px
              </div>
            </div>

            {/* Toggle Group Vertical Position */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Toggle Group Vertical Position
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={config.toggleGroupVerticalPosition}
                onChange={(e) => updateConfig('toggleGroupVerticalPosition', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.toggleGroupVerticalPosition}px
              </div>
            </div>

            {/* Proceed Button Vertical Position */}
            <div className="mb-2">
              <label className="block text-xs text-gray-300 mb-1">
                Proceed Button Vertical Position
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={config.proceedButtonVerticalPosition}
                onChange={(e) => updateConfig('proceedButtonVerticalPosition', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center mt-0.5">
                {config.proceedButtonVerticalPosition}px
              </div>
            </div>
          </div>
          )}

          {/* Speaker Icon Style Section */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <h2 className="text-sm font-semibold text-gray-100 mb-2 pb-1 border-b border-gray-700">
              Speaker Icon Style
            </h2>
            <p className="text-xs text-gray-400 mb-2">
              Select the speaker/sound icon design
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateConfig('speakerIconStyle', 'minimal')}
                className={`px-3 py-2 text-xs rounded ${
                  config.speakerIconStyle === 'minimal'
                    ? 'bg-blue-900/50 border border-blue-700 text-blue-200'
                    : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Minimal Wave
              </button>
              <button
                onClick={() => updateConfig('speakerIconStyle', 'geometric')}
                className={`px-3 py-2 text-xs rounded ${
                  config.speakerIconStyle === 'geometric'
                    ? 'bg-blue-900/50 border border-blue-700 text-blue-200'
                    : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Geometric (Triple Chevron)
              </button>
              <button
                onClick={() => updateConfig('speakerIconStyle', 'bars')}
                className={`px-3 py-2 text-xs rounded ${
                  config.speakerIconStyle === 'bars'
                    ? 'bg-blue-900/50 border border-blue-700 text-blue-200'
                    : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Sound Bars
              </button>
              <button
                onClick={() => updateConfig('speakerIconStyle', 'hologram')}
                className={`px-3 py-2 text-xs rounded ${
                  config.speakerIconStyle === 'hologram'
                    ? 'bg-blue-900/50 border border-blue-700 text-blue-200'
                    : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Futuristic
              </button>
              <button
                onClick={() => updateConfig('speakerIconStyle', 'pulse')}
                className={`px-3 py-2 text-xs rounded ${
                  config.speakerIconStyle === 'pulse'
                    ? 'bg-blue-900/50 border border-blue-700 text-blue-200'
                    : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Pulse Ring
              </button>
            </div>
            <div className="text-xs text-gray-400 text-center mt-2">
              Current: {config.speakerIconStyle || 'geometric'}
            </div>
          </div>

          {/* PhaseCarousel Visual Controls Section */}
          <div className="bg-gray-800 border border-cyan-500 rounded p-3">
            <h2 className="text-sm font-semibold text-cyan-400 mb-2 pb-1 border-b border-cyan-700">
              Phase Carousel Visual Controls
            </h2>

            {/* Image Darkening */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Image Darkening (overlay)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.phaseImageDarkening}
                onChange={(e) => updateConfig('phaseImageDarkening', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseImageDarkening}% darkness
              </div>
            </div>

            {/* Blur Amount - Non-Selected Cards */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Blur Amount (non-selected cards)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={config.phaseBlurAmount}
                onChange={(e) => updateConfig('phaseBlurAmount', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseBlurAmount}px blur
              </div>
            </div>

            {/* Blur Amount - Selected Card */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Blur Amount (selected/center card)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={config.phaseBlurAmountSelected}
                onChange={(e) => updateConfig('phaseBlurAmountSelected', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseBlurAmountSelected}px blur
              </div>
            </div>

            {/* Column Height */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Card Height
              </label>
              <input
                type="range"
                min="200"
                max="800"
                step="8"
                value={config.phaseColumnHeight}
                onChange={(e) => updateConfig('phaseColumnHeight', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseColumnHeight}px
              </div>
            </div>

            {/* Opacity Fade Position */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Fade Start Position (vertical)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.phaseFadePosition}
                onChange={(e) => updateConfig('phaseFadePosition', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseFadePosition}% from top
              </div>
            </div>

            {/* Image Blend Mode */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Image Blend Mode
              </label>
              <div className="grid grid-cols-2 gap-1">
                {(['normal', 'screen', 'lighten', 'lighter'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateConfig('phaseImageBlendMode', mode)}
                    className={`px-2 py-1 text-xs rounded ${
                      config.phaseImageBlendMode === mode
                        ? 'bg-cyan-900/50 border border-cyan-700 text-cyan-200'
                        : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {mode === 'lighter' ? 'Add' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              <div className="text-xs text-cyan-400 text-center mt-1">
                Current: {config.phaseImageBlendMode === 'lighter' ? 'Add' : config.phaseImageBlendMode}
              </div>
            </div>

            {/* Hover Darkening Intensity */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Hover Darkening (gradient intensity)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.phaseHoverDarkeningIntensity}
                onChange={(e) => updateConfig('phaseHoverDarkeningIntensity', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseHoverDarkeningIntensity}% opacity
              </div>
            </div>

            {/* Idle Backdrop Blur */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Idle Backdrop Blur (background behind column)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={config.phaseIdleBackdropBlur}
                onChange={(e) => updateConfig('phaseIdleBackdropBlur', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseIdleBackdropBlur}px blur
              </div>
            </div>

            {/* Phase Image Idle Opacity */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Phase Image Idle Opacity
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.phaseImageIdleOpacity}
                onChange={(e) => updateConfig('phaseImageIdleOpacity', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseImageIdleOpacity}% opacity
              </div>
            </div>

            {/* Column Vertical Offset */}
            <div className="mb-2">
              <label className="block text-xs text-cyan-300 mb-1">
                Column Vertical Position
              </label>
              <input
                type="range"
                min="-5000"
                max="5000"
                step="50"
                value={config.phaseColumnYOffset}
                onChange={(e) => updateConfig('phaseColumnYOffset', parseInt(e.target.value))}
                onMouseDown={handleInputStart}
                onMouseUp={handleInputEnd}
                onTouchStart={handleInputStart}
                onTouchEnd={handleInputEnd}
                className="w-full"
              />
              <div className="text-xs text-cyan-400 text-center mt-0.5">
                {config.phaseColumnYOffset > 0 ? '+' : ''}{config.phaseColumnYOffset}px
              </div>
            </div>
          </div>

          {/* Phase Image URLs Section */}
          <div className="bg-gray-800 border border-cyan-500 rounded p-3">
            <h2 className="text-sm font-semibold text-cyan-400 mb-2 pb-1 border-b border-cyan-700">
              Phase Background Images
            </h2>
            <p className="text-xs text-cyan-300/70 mb-2">
              Paste Windows paths or URLs - auto-converts to web paths
            </p>

            {/* Phase I */}
            <div className="mb-3">
              <label className="block text-xs text-cyan-300 mb-1">
                Phase I Image URL
              </label>
              <input
                type="text"
                value={config.phaseImage1}
                onChange={(e) => updateConfig('phaseImage1', e.target.value)}
                placeholder="C:\Users\...\public\mek-images\1000px\image.webp"
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-cyan-500 mb-1"
              />
              {config.phaseImage1 && (
                <div className="mt-1 p-2 bg-gray-900 rounded border border-gray-700">
                  <p className="text-[10px] text-gray-500 mb-1">Preview:</p>
                  <div className="relative w-full h-20 bg-gray-950 rounded overflow-hidden">
                    <img
                      src={config.phaseImage1}
                      alt="Phase I preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const errorText = e.currentTarget.nextElementSibling as HTMLElement;
                        if (errorText) errorText.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-xs text-red-400 p-2">Failed to load image</div>
                  </div>
                  <p className="text-[10px] text-cyan-400 mt-1 break-all">{config.phaseImage1}</p>
                </div>
              )}
            </div>

            {/* Phase II */}
            <div className="mb-3">
              <label className="block text-xs text-cyan-300 mb-1">
                Phase II Image URL
              </label>
              <input
                type="text"
                value={config.phaseImage2}
                onChange={(e) => updateConfig('phaseImage2', e.target.value)}
                placeholder="C:\Users\...\public\mek-images\1000px\image.webp"
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-cyan-500 mb-1"
              />
              {config.phaseImage2 && (
                <div className="mt-1 p-2 bg-gray-900 rounded border border-gray-700">
                  <p className="text-[10px] text-gray-500 mb-1">Preview:</p>
                  <div className="relative w-full h-20 bg-gray-950 rounded overflow-hidden">
                    <img
                      src={config.phaseImage2}
                      alt="Phase II preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const errorText = e.currentTarget.nextElementSibling as HTMLElement;
                        if (errorText) errorText.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-xs text-red-400 p-2">Failed to load image</div>
                  </div>
                  <p className="text-[10px] text-cyan-400 mt-1 break-all">{config.phaseImage2}</p>
                </div>
              )}
            </div>

            {/* Phase III */}
            <div className="mb-3">
              <label className="block text-xs text-cyan-300 mb-1">
                Phase III Image URL
              </label>
              <input
                type="text"
                value={config.phaseImage3}
                onChange={(e) => updateConfig('phaseImage3', e.target.value)}
                placeholder="C:\Users\...\public\mek-images\1000px\image.webp"
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-cyan-500 mb-1"
              />
              {config.phaseImage3 && (
                <div className="mt-1 p-2 bg-gray-900 rounded border border-gray-700">
                  <p className="text-[10px] text-gray-500 mb-1">Preview:</p>
                  <div className="relative w-full h-20 bg-gray-950 rounded overflow-hidden">
                    <img
                      src={config.phaseImage3}
                      alt="Phase III preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const errorText = e.currentTarget.nextElementSibling as HTMLElement;
                        if (errorText) errorText.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-xs text-red-400 p-2">Failed to load image</div>
                  </div>
                  <p className="text-[10px] text-cyan-400 mt-1 break-all">{config.phaseImage3}</p>
                </div>
              )}
            </div>

            {/* Phase IV */}
            <div className="mb-3">
              <label className="block text-xs text-cyan-300 mb-1">
                Phase IV Image URL
              </label>
              <input
                type="text"
                value={config.phaseImage4}
                onChange={(e) => updateConfig('phaseImage4', e.target.value)}
                placeholder="C:\Users\...\public\mek-images\1000px\image.webp"
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:border-cyan-500 mb-1"
              />
              {config.phaseImage4 && (
                <div className="mt-1 p-2 bg-gray-900 rounded border border-gray-700">
                  <p className="text-[10px] text-gray-500 mb-1">Preview:</p>
                  <div className="relative w-full h-20 bg-gray-950 rounded overflow-hidden">
                    <img
                      src={config.phaseImage4}
                      alt="Phase IV preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const errorText = e.currentTarget.nextElementSibling as HTMLElement;
                        if (errorText) errorText.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-xs text-red-400 p-2">Failed to load image</div>
                  </div>
                  <p className="text-[10px] text-cyan-400 mt-1 break-all">{config.phaseImage4}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Live Preview Section (Split View Only) */}
      {viewMode === 'split-view' && (
        <div className="w-1/2 bg-gray-950 relative flex flex-col">
          <div className="bg-gray-800 border-b border-gray-700 p-2">
            <h2 className="text-gray-100 text-sm font-semibold">
              Live Preview
            </h2>
            <p className="text-gray-400 text-[10px] mt-0.5">
              Changes update in real-time via localStorage sync
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              src="/landing"
              className="w-full h-full border-0"
              title="Landing Page Preview"
            />
          </div>
        </div>
      )}

    </div>
  );
}
