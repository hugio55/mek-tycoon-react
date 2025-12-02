'use client';

import { useState, lazy, Suspense, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, ConvexProvider } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { restoreWalletSession } from '@/lib/walletSessionManager';
import { sturgeonClient } from '@/lib/sturgeonClient';
import StorageMonitoringDashboard from '@/components/StorageMonitoringDashboard';
import SystemMonitoringDashboard from '@/components/SystemMonitoringDashboard';
import ProductionLaunchCleaner from '@/components/ProductionLaunchCleaner';
import WalletSnapshotDebug from '@/components/WalletSnapshotDebug';
import MekLevelsViewer from '@/components/MekLevelsViewer';
import ActivityLogViewer from '@/components/ActivityLogViewer';
import SnapshotHealthDashboard from '@/components/SnapshotHealthDashboard';
import DuplicateWalletDetector from '@/components/DuplicateWalletDetector';
import EssenceBalancesViewer from '@/components/EssenceBalancesViewer';
import BuffManagement from '@/components/BuffManagement';
import BetaSignupsViewer from '@/components/BetaSignupsViewer';
import VariationSpreadViewer from '@/components/VariationSpreadViewer';
import ResetTimelineChecker from '@/components/ResetTimelineChecker';
import { EssenceProvider } from '@/contexts/EssenceContext';
import { DatabaseProvider, useDatabaseContext } from '@/contexts/DatabaseContext';

// Lazy load heavy components
const SnapshotHistoryViewer = lazy(() => import('@/components/SnapshotHistoryViewer'));

type SubMenu = 'wallet-list' | 'storage-monitoring' | 'snapshot-history' | 'snapshot-health' | 'duplicate-detection' | 'production-launch-cleaner' | 'gold-repair' | 'variation-spread' | 'beta-signups' | 'reset-timeline';
type SnapshotHealthTab = 'health' | 'logging';

function WalletManagementAdminContent() {
  // Get database context
  const {
    selectedDatabase,
    setSelectedDatabase,
    client,
    canMutate,
    productionMutationsEnabled,
    setProductionMutationsEnabled
  } = useDatabaseContext();

  const getClient = () => client;
  // Restore wallet session for authentication
  const [stakeAddress, setStakeAddress] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      const session = await restoreWalletSession();
      if (session?.stakeAddress) {
        setStakeAddress(session.stakeAddress);
        console.log('[Player Management] Wallet session restored:', session.stakeAddress.slice(0, 12) + '...');
      }
    };
    loadSession();
  }, []);

  // Mount effect for portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  //Database selection comes from context now
  const [walletsData, setWalletsData] = useState<any>(null);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);

  // Production mutation confirmation
  const [confirmationText, setConfirmationText] = useState('');
  const [showConfirmationPrompt, setShowConfirmationPrompt] = useState(false);

  // BANDWIDTH OPTIMIZATION: Only load wallets when user clicks "Load Wallets" button
  const [walletsLoaded, setWalletsLoaded] = useState(false);
  const [showOnlyWrenCo, setShowOnlyWrenCo] = useState(false);

  // Load wallets from selected database
  useEffect(() => {
    if (!walletsLoaded) {
      setWalletsData(null);
      return;
    }

    // Auto-switch to Trout if Sturgeon selected but not configured
    if (selectedDatabase === 'sturgeon' && !sturgeonClient) {
      console.warn('[Player Management] Sturgeon not configured, switching to Trout');
      setSelectedDatabase('trout');
      return;
    }

    setIsLoadingWallets(true);
    const client = selectedDatabase === 'sturgeon' ? sturgeonClient : window.convex;

    if (!client) {
      console.error('[Player Management] Convex client not initialized');
      setIsLoadingWallets(false);
      return;
    }

    client.query(api.adminVerificationReset.getAllWallets)
      .then((data: any) => {
        setWalletsData(data);
        setIsLoadingWallets(false);
      })
      .catch((error: Error) => {
        console.error(`[Player Management] Error loading from ${selectedDatabase}:`, error);
        setIsLoadingWallets(false);
      });
  }, [walletsLoaded, selectedDatabase]);

  const wallets = walletsData;

  // Batch check claim status for all wallets
  const stakeAddresses = wallets?.map((w: any) => w.walletAddress) || [];
  const claimStatusData = useQuery(
    api.nftEligibility.batchCheckClaimStatus,
    walletsLoaded && stakeAddresses.length > 0 ? { stakeAddresses } : "skip"
  );

  // CRITICAL FIX: Replace useMutation hooks with direct client calls
  // This ensures mutations respect the selectedDatabase state
  const resetVerification = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.adminVerificationReset.resetVerificationStatus, args);
  };

  const deleteWallet = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.adminVerificationReset.deleteWallet, args);
  };

  const mergeDuplicates = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.adminVerificationReset.mergeDuplicateWallets, args);
  };

  const autoMergeAll = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.adminVerificationReset.autoMergeDuplicates, args);
  };

  const manualMergeBySuffix = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.manualWalletMerge.manualMergeWalletsBySuffix, args);
  };

  const triggerSnapshot = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.action(api.goldMiningSnapshot.triggerSnapshot, args);
  };

  const manualSetMeks = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.fixWalletSnapshot.manualSetMekOwnership, args);
  };

  const updateWalletGold = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.adminVerificationReset.updateWalletGold, args);
  };

  const resetAllGoldToZero = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.adminVerificationReset.resetAllGoldToZero, args);
  };

  const fixCumulativeGold = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.adminVerificationReset.fixCumulativeGold, args);
  };

  const reconstructCumulativeFromSnapshots = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.adminVerificationReset.reconstructCumulativeFromSnapshots, args);
  };

  const reconstructCumulativeGoldExact = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.adminVerificationReset.reconstructCumulativeGoldExact, args);
  };

  const cleanupDuplicates = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.finalDuplicateCleanup.removeAllNonStakeWallets, args);
  };

  const resetAllMekLevels = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.mekLeveling.resetAllMekLevels, args);
  };

  const findCorruptedGoldRecords = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.diagnosticCorruptedGold.findCorruptedGoldRecords, args);
  };

  const fixCorruptedCumulativeGold = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.fixCorruptedGold.fixCorruptedCumulativeGold, args);
  };

  const resetAllProgress = async (args: any) => {
    if (!canMutate()) throw new Error('Mutations disabled in READ ONLY mode');
    const client = getClient();
    if (!client) throw new Error('Client not initialized');
    return await client.mutation(api.adminResetAllProgress.resetAllProgress, args);
  };

  const [activeSubmenu, setActiveSubmenu] = useState<SubMenu>('wallet-list');
  const [snapshotHealthTab, setSnapshotHealthTab] = useState<SnapshotHealthTab>('health');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [suffixToMerge, setSuffixToMerge] = useState('fe6012f1');
  const [isRunningSnapshot, setIsRunningSnapshot] = useState(false);
  const [editingGold, setEditingGold] = useState<{ walletAddress: string; value: string } | null>(null);
  const [viewingMekLevels, setViewingMekLevels] = useState<string | null>(null);
  const [viewingEssence, setViewingEssence] = useState<string | null>(null);
  const [viewingBuffs, setViewingBuffs] = useState<string | null>(null);
  const [viewingActivityLog, setViewingActivityLog] = useState<string | null>(null);
  const [diagnosticWallet, setDiagnosticWallet] = useState<string | null>(null);
  const [goldDiagnosticResults, setGoldDiagnosticResults] = useState<any>(null);
  const [goldFixResults, setGoldFixResults] = useState<any>(null);
  const [isRunningGoldRepair, setIsRunningGoldRepair] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [hoveredDropdown, setHoveredDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ bottom: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Drag-to-scroll state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });

  // Diagnostic query to check boost sync
  const boostDiagnostic = useQuery(
    api.diagnosticMekBoosts.compareMekDataSources,
    diagnosticWallet ? { walletAddress: diagnosticWallet } : 'skip'
  );

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if clicking on non-interactive elements
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'A' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a')
    ) {
      return;
    }

    setIsDragging(true);
    setStartPos({ x: e.pageX, y: e.pageY });
    if (scrollContainerRef.current) {
      setScrollPos({
        left: scrollContainerRef.current.scrollLeft,
        top: scrollContainerRef.current.scrollTop,
      });
    }
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;

    const dx = e.pageX - startPos.x;
    const dy = e.pageY - startPos.y;

    scrollContainerRef.current.scrollLeft = scrollPos.left - dx;
    scrollContainerRef.current.scrollTop = scrollPos.top - dy;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleResetVerification = async (walletAddress: string) => {
    if (!confirm(`Reset verification for wallet ${walletAddress.substring(0, 20)}...?`)) return;

    try {
      const result = await resetVerification({ walletAddress });
      setStatusMessage({ type: 'success', message: result.message });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to reset verification' });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleDeleteWallet = async (walletAddress: string) => {
    if (!confirm(`⚠️ DELETE wallet ${walletAddress.substring(0, 20)}...? This cannot be undone!`)) return;
    if (!confirm(`Are you ABSOLUTELY SURE? This will permanently delete all data for this wallet.`)) return;

    try {
      const result = await deleteWallet({ walletAddress });
      setStatusMessage({ type: 'success', message: result.message });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to delete wallet' });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleMergeDuplicates = async (walletAddress: string) => {
    if (!confirm(`Merge duplicate records for ${walletAddress.substring(0, 20)}...? This will keep the best record and delete others.`)) return;

    try {
      const result = await mergeDuplicates({ walletAddress });
      setStatusMessage({ type: 'success', message: result.message });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to merge duplicates' });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleMergeAllDuplicates = async () => {
    if (!confirm(`Merge ALL duplicate wallet records? This will automatically keep the best record for each wallet.`)) return;

    setIsMerging(true);
    try {
      const result = await autoMergeAll({});
      setStatusMessage({
        type: 'success',
        message: `Merged ${result.totalMerged} duplicate record(s) across ${result.walletsProcessed} wallet(s)`
      });
      setTimeout(() => setStatusMessage(null), 7000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to merge duplicates' });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsMerging(false);
    }
  };

  const handleFixCumulativeGold = async (walletAddress: string) => {
    try {
      const result = await fixCumulativeGold({ walletAddress });
      setStatusMessage({ type: 'success', message: result.message });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to fix cumulative gold' });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleReconstructFromSnapshots = async (walletAddress: string) => {
    try {
      const result = await reconstructCumulativeFromSnapshots({ walletAddress });
      setStatusMessage({ type: 'success', message: result.message });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to reconstruct cumulative gold from snapshots' });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleReconstructExact = async (walletAddress: string) => {
    if (!confirm(`Run 100% accurate cumulative gold reconstruction for ${walletAddress.substring(0, 20)}...?\n\nThis will:\n- Analyze ALL snapshots chronologically\n- Track rate changes from every upgrade\n- Build complete timeline\n- Verify against snapshot data\n\nFull timeline will be logged to console.`)) return;

    try {
      const result = await reconstructCumulativeGoldExact({ walletAddress });

      // Show detailed results in status message
      const details = `
Reconstructed Cumulative: ${result.reconstructedCumulative?.toFixed(2) || 'N/A'}
Total Gold Earned: ${result.totalGoldEarned?.toFixed(2) || 'N/A'}
Total Gold Spent: ${result.totalGoldSpent?.toFixed(2) || 'N/A'}
Current Spendable: ${result.currentSpendable?.toFixed(2) || 'N/A'}
Invariant: ${result.invariantValid ? '✓ VALID' : '✗ VIOLATED'}

Check console for full timeline.
      `.trim();

      setStatusMessage({
        type: result.invariantValid ? 'success' : 'error',
        message: result.message + '\n\n' + details
      });

      // Also log timeline to console
      if (result.timeline) {
        console.log('\n========== RECONSTRUCTION TIMELINE ==========');
        console.log(result.timeline.join('\n'));
        console.log('============================================\n');
      }

      setTimeout(() => setStatusMessage(null), 15000); // Longer display time for detailed results
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to reconstruct: ' + String(error) });
      setTimeout(() => setStatusMessage(null), 8000);
    }
  };

  const handleResetAllGold = async (walletAddress: string) => {
    if (!confirm(`⚠️ RESET ALL GOLD TO ZERO for wallet ${walletAddress.substring(0, 20)}...?`)) return;
    if (!confirm(`Are you ABSOLUTELY SURE? This will zero out:\n- Spendable Gold\n- Cumulative Gold\n- Gold Spent on Upgrades\n\nThis cannot be undone!`)) return;

    try {
      const result = await resetAllGoldToZero({ walletAddress });
      setStatusMessage({ type: 'success', message: result.message });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to reset gold' });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleResetMekLevels = async (walletAddress: string) => {
    if (!confirm(`Reset ALL Mek levels to Level 1 for wallet ${walletAddress.substring(0, 20)}...?`)) return;
    if (!confirm(`Are you SURE? This will reset all Mek levels and remove all level bonuses.`)) return;

    try {
      const result = await resetAllMekLevels({ walletAddress });
      setStatusMessage({ type: 'success', message: result.message });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to reset Mek levels' });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleManualMergeBySuffix = async () => {
    if (!confirm(`Merge all wallet records ending with "${suffixToMerge}"?`)) return;

    setIsMerging(true);
    try {
      const result = await manualMergeBySuffix({ suffix: suffixToMerge });
      if (result.success) {
        setStatusMessage({
          type: 'success',
          message: result.message + ` (${result.totalGold} gold, ${result.goldPerHour} gold/hr)`
        });
      } else {
        setStatusMessage({
          type: 'error',
          message: result.message
        });
      }
      setTimeout(() => setStatusMessage(null), 7000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to merge by suffix' });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsMerging(false);
    }
  };

  const handleRunSnapshot = async () => {
    if (!confirm('Run 6-hour blockchain snapshot NOW? This will query Blockfrost for all active wallets.')) return;

    setIsRunningSnapshot(true);
    setStatusMessage({
      type: 'success',
      message: 'Snapshot starting... This may take a minute.'
    });

    console.log('[WalletManagementAdmin] 🚀 Starting snapshot at:', new Date().toISOString());

    try {
      console.log('[WalletManagementAdmin] ⏳ Calling triggerSnapshot action...');
      const result = await triggerSnapshot({});
      console.log('[WalletManagementAdmin] ✅ Snapshot action completed:', {
        totalMiners: result.totalMiners,
        updatedCount: result.updatedCount,
        skippedCount: result.skippedCount,
        errorCount: result.errorCount,
        timestamp: new Date().toISOString()
      });

      setStatusMessage({
        type: 'success',
        message: `Snapshot complete! Updated ${result.updatedCount}/${result.totalMiners} wallets (${result.skippedCount} skipped, ${result.errorCount} errors)`
      });
      setTimeout(() => setStatusMessage(null), 10000);
    } catch (error) {
      console.error('[WalletManagementAdmin] ❌ Snapshot failed:', error);
      setStatusMessage({ type: 'error', message: 'Snapshot failed - check console' });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsRunningSnapshot(false);
      console.log('[WalletManagementAdmin] 🏁 Snapshot process finished');
    }
  };

  const handleSingleWalletSnapshot = async (walletAddress: string) => {
    if (!confirm(`Run blockchain snapshot for wallet ${walletAddress.substring(0, 20)}...?\n\nThis will query Blockfrost and update Mek ownership data.`)) return;

    setIsRunningSnapshot(true);
    setStatusMessage({
      type: 'success',
      message: `Snapshot starting for ${walletAddress.substring(0, 20)}... Check console for debug logs.`
    });

    try {
      // The triggerSnapshot action will process all wallets, but we can filter the logs by watching console
      console.log(`[Admin] Triggering snapshot - watch for wallet: ${walletAddress}`);
      const result = await triggerSnapshot({});
      setStatusMessage({
        type: 'success',
        message: `Snapshot complete! Check console for detailed logs. Updated ${result.updatedCount} wallets total.`
      });
      setTimeout(() => setStatusMessage(null), 10000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Snapshot failed - check console' });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsRunningSnapshot(false);
    }
  };

  const handleGoldDiagnostic = async () => {
    setIsRunningGoldRepair(true);
    try {
      const results = await findCorruptedGoldRecords({});
      setGoldDiagnosticResults(results);
      setStatusMessage({
        type: results.corruptedCount > 0 ? 'error' : 'success',
        message: `Scan complete: ${results.corruptedCount} corrupted records found out of ${results.totalRecords} total`
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error: any) {
      setStatusMessage({ type: 'error', message: 'Diagnostic failed: ' + error.message });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsRunningGoldRepair(false);
    }
  };

  const handleGoldFix = async () => {
    if (!confirm('Are you sure you want to fix all corrupted gold records? This will update the database.')) {
      return;
    }

    setIsRunningGoldRepair(true);
    try {
      const results = await fixCorruptedCumulativeGold({});
      setGoldFixResults(results);
      setStatusMessage({
        type: 'success',
        message: `Fixed ${results.fixedCount} records out of ${results.totalRecords} total`
      });
      setTimeout(() => setStatusMessage(null), 5000);
      // Re-run diagnostic to confirm fix
      const newDiagnostic = await findCorruptedGoldRecords({});
      setGoldDiagnosticResults(newDiagnostic);
    } catch (error: any) {
      setStatusMessage({ type: 'error', message: 'Fix failed: ' + error.message });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsRunningGoldRepair(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Display individual wallets (1 wallet = 1 corp)
  const walletDisplay = useMemo(() => {
    if (!wallets) return [];

    // First, filter by WrenCo (user's wallet) if that filter is active
    let filtered = wallets;
    if (showOnlyWrenCo && stakeAddress) {
      filtered = wallets.filter(wallet => wallet.walletAddress === stakeAddress);
    }

    // Then, filter by search term
    filtered = filtered.filter(wallet =>
      wallet.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.walletType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wallet.companyName && wallet.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Create display items - each wallet is its own item
    const displayItems: Array<{
      type: 'wallet';
      wallets: typeof filtered;
    }> = [];

    // Add each wallet as individual item
    filtered.forEach(wallet => {
      displayItems.push({
        type: 'wallet',
        wallets: [wallet],
      });
    });

    // Sort display items (each item is a single wallet now)
    if (sortColumn) {
      displayItems.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        const aData = a.wallets[0];
        const bData = b.wallets[0];

        switch (sortColumn) {
          case 'wallet':
            aVal = aData.walletAddress;
            bVal = bData.walletAddress;
            break;
          case 'companyName':
            aVal = aData.companyName || '';
            bVal = bData.companyName || '';
            break;
          case 'type':
            aVal = aData.walletType || '';
            bVal = bData.walletType || '';
            break;
          case 'verified':
            aVal = aData.isVerified ? 1 : 0;
            bVal = bData.isVerified ? 1 : 0;
            break;
          case 'meks':
            aVal = aData.mekCount;
            bVal = bData.mekCount;
            break;
          case 'goldPerHour':
            aVal = aData.totalGoldPerHour;
            bVal = bData.totalGoldPerHour;
            break;
          case 'currentGold':
            aVal = aData.currentGold;
            bVal = bData.currentGold;
            break;
          case 'cumulativeGold':
            aVal = aData.totalCumulativeGold || 0;
            bVal = bData.totalCumulativeGold || 0;
            break;
          case 'goldSpent':
            aVal = aData.totalGoldSpentOnUpgrades || 0;
            bVal = bData.totalGoldSpentOnUpgrades || 0;
            break;
          case 'firstConnected':
            aVal = aData.createdAt || 0;
            bVal = bData.createdAt || 0;
            break;
          case 'lastUpdate':
            aVal = aData.lastSnapshotTime || aData.updatedAt || 0;
            bVal = bData.lastSnapshotTime || bData.updatedAt || 0;
            break;
          case 'lastActive':
            aVal = aData.lastActiveTime || 0;
            bVal = bData.lastActiveTime || 0;
            break;
          default:
            return 0;
        }

        if (typeof aVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        } else {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
      });
    }

    return displayItems;
  }, [wallets, searchTerm, sortColumn, sortDirection, showOnlyWrenCo, stakeAddress]);

  // For backwards compatibility, keep filteredWallets for count
  const filteredWallets = useMemo(() => {
    if (!wallets) return [];
    return wallets.filter(wallet =>
      wallet.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.walletType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wallet.companyName && wallet.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [wallets, searchTerm]);

  const verifiedCount = useMemo(() => {
    if (!wallets) return 0;
    return wallets.filter(w => w.isVerified).length;
  }, [wallets]);

  // BANDWIDTH OPTIMIZATION: Don't show loading spinner when intentionally skipping query
  // Only show loading when walletsLoaded is true but data hasn't arrived yet
  if (walletsLoaded && !wallets) {
    return (
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <div className="text-gray-400">Loading wallet data...</div>
      </div>
    );
  }

  return (
    <DatabaseProvider>
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveSubmenu('wallet-list')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeSubmenu === 'wallet-list'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          👛 Wallet List
        </button>
        <button
          onClick={() => setActiveSubmenu('storage-monitoring')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeSubmenu === 'storage-monitoring'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          💾 Storage Monitoring
        </button>
        <button
          onClick={() => setActiveSubmenu('snapshot-history')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeSubmenu === 'snapshot-history'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          📸 Snapshot History
        </button>
        <button
          onClick={() => setActiveSubmenu('snapshot-health')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeSubmenu === 'snapshot-health'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          📊 Convex Logging
        </button>

        <button
          onClick={() => setActiveSubmenu('duplicate-detection')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeSubmenu === 'duplicate-detection'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          🚨 Duplicate Detection
        </button>

        <button
          onClick={() => setActiveSubmenu('production-launch-cleaner')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeSubmenu === 'production-launch-cleaner'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          🧹 Production Launch Cleaner
        </button>

        <button
          onClick={() => setActiveSubmenu('gold-repair')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeSubmenu === 'gold-repair'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          🔧 Gold Repair
        </button>

        <button
          onClick={() => setActiveSubmenu('variation-spread')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeSubmenu === 'variation-spread'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          📊 Variation Spread
        </button>

        <button
          onClick={() => setActiveSubmenu('beta-signups')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeSubmenu === 'beta-signups'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          🎮 Beta Signups
        </button>

        <button
          onClick={() => setActiveSubmenu('reset-timeline')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeSubmenu === 'reset-timeline'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          🕐 Reset Timeline
        </button>
      </div>

      {activeSubmenu === 'storage-monitoring' ? (
        <StorageMonitoringDashboard />
      ) : activeSubmenu === 'snapshot-history' ? (
        <Suspense fallback={<div className="p-8 bg-gray-900/50 rounded-lg border border-gray-700 text-center"><div className="text-gray-400">Loading snapshot history...</div></div>}>
          <SnapshotHistoryViewer />
        </Suspense>
      ) : activeSubmenu === 'snapshot-health' ? (
        <div className="space-y-4">
          {/* Sub-tabs for Snapshot Health */}
          <div className="flex gap-2 border-b border-gray-700">
            <button
              onClick={() => setSnapshotHealthTab('health')}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                snapshotHealthTab === 'health'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              📊 Snapshot Health System
            </button>
            <button
              onClick={() => setSnapshotHealthTab('logging')}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                snapshotHealthTab === 'logging'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              📋 Overall Logging System
            </button>
          </div>

          {/* Render sub-tab content */}
          {snapshotHealthTab === 'health' ? (
            <SnapshotHealthDashboard />
          ) : (
            <SystemMonitoringDashboard stakeAddress={stakeAddress} />
          )}
        </div>
      ) : activeSubmenu === 'duplicate-detection' ? (
        <DuplicateWalletDetector />
      ) : activeSubmenu === 'production-launch-cleaner' ? (
        <ProductionLaunchCleaner />
      ) : activeSubmenu === 'gold-repair' ? (
        <div className="space-y-6">
          {/* Gold Repair Tool */}
          <div className="bg-gray-900/50 rounded-lg border border-yellow-500/30 p-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Gold Repair Tool</h2>
            <p className="text-gray-300 mb-6">
              Scan and repair corrupted cumulative gold values. The gold invariant requires:
              <span className="text-yellow-400 font-mono block mt-2">totalCumulativeGold ≥ accumulatedGold + totalSpent</span>
            </p>

            {/* Diagnostic Section */}
            <div className="bg-gray-800/50 border border-blue-500/30 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">1. Diagnostic Scan</h3>
              <p className="text-gray-300 mb-4">
                Scan all gold mining records to find any with corrupted cumulative gold values.
              </p>
              <button
                onClick={handleGoldDiagnostic}
                disabled={isRunningGoldRepair}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunningGoldRepair ? 'Scanning...' : 'Run Diagnostic'}
              </button>

              {goldDiagnosticResults && (
                <div className="mt-6 p-4 bg-gray-900 rounded border border-yellow-500/20">
                  <h4 className="text-lg font-bold mb-2">Diagnostic Results:</h4>
                  <div className="space-y-2 text-sm">
                    <p>Total Records: <span className="text-yellow-500">{goldDiagnosticResults.totalRecords}</span></p>
                    <p>Corrupted Records: <span className={goldDiagnosticResults.corruptedCount > 0 ? "text-red-500" : "text-green-500"}>
                      {goldDiagnosticResults.corruptedCount}
                    </span></p>

                    {goldDiagnosticResults.corruptedCount > 0 && (
                      <div className="mt-4">
                        <h5 className="font-bold mb-2">Corrupted Wallets:</h5>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {goldDiagnosticResults.corruptedRecords.map((record: any, idx: number) => (
                            <div key={idx} className="bg-gray-800 p-2 rounded text-xs">
                              <p><span className="text-gray-400">Wallet:</span> {record.wallet}</p>
                              <p><span className="text-gray-400">Accumulated:</span> {record.accumulated.toFixed(2)}</p>
                              <p><span className="text-gray-400">Cumulative:</span> {record.cumulative.toFixed(2)}</p>
                              <p><span className="text-gray-400">Spent:</span> {record.spent.toFixed(2)}</p>
                              <p><span className="text-red-400">Deficit:</span> {record.deficit.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Fix Section */}
            <div className="bg-gray-800/50 border border-yellow-500/30 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">2. Repair Corrupted Records</h3>
              <p className="text-gray-300 mb-4">
                Fix all corrupted records by setting totalCumulativeGold = accumulatedGold + totalSpent.
                This ensures the gold invariant is maintained.
              </p>
              <button
                onClick={handleGoldFix}
                disabled={isRunningGoldRepair || (goldDiagnosticResults && goldDiagnosticResults.corruptedCount === 0)}
                className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunningGoldRepair ? 'Fixing...' : 'Fix Corrupted Records'}
              </button>

              {goldFixResults && (
                <div className="mt-6 p-4 bg-gray-900 rounded border border-green-500/20">
                  <h4 className="text-lg font-bold mb-2 text-green-500">Fix Results:</h4>
                  <div className="space-y-2 text-sm">
                    <p>Total Records: <span className="text-yellow-500">{goldFixResults.totalRecords}</span></p>
                    <p>Fixed Records: <span className="text-green-500">{goldFixResults.fixedCount}</span></p>

                    {goldFixResults.fixedCount > 0 && (
                      <div className="mt-4">
                        <h5 className="font-bold mb-2">Fixed Wallets:</h5>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {goldFixResults.fixedWallets.map((record: any, idx: number) => (
                            <div key={idx} className="bg-gray-800 p-2 rounded text-xs">
                              <p><span className="text-gray-400">Wallet:</span> {record.wallet}</p>
                              <p><span className="text-gray-400">Old Cumulative:</span> {record.oldCumulative.toFixed(2)}</p>
                              <p><span className="text-green-400">New Cumulative:</span> {record.newCumulative.toFixed(2)}</p>
                              <p><span className="text-yellow-400">Deficit Fixed:</span> +{record.deficit.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="bg-gray-800/50 border border-blue-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">What This Does</h3>
              <div className="text-gray-300 space-y-2 text-sm">
                <p>
                  <strong>The Gold Invariant:</strong> totalCumulativeGold ≥ accumulatedGold + totalSpent
                </p>
                <p>
                  This invariant ensures that the total gold ever earned is always greater than or equal to
                  the sum of current gold plus gold spent on upgrades.
                </p>
                <p className="mt-4">
                  <strong>Why it breaks:</strong> Database initialization bugs, incomplete migrations, or
                  manual database edits can cause cumulative gold to be less than it should be.
                </p>
                <p className="mt-4">
                  <strong>How the fix works:</strong> Sets totalCumulativeGold to the minimum valid value
                  (accumulatedGold + totalSpent) for any corrupted records. This prevents errors while
                  preserving the integrity of gold tracking.
                </p>
                <p className="mt-4 text-yellow-500">
                  <strong>Note:</strong> The auto-fix in calculateGoldIncrease() will now prevent new
                  corruption, but existing corrupted records need to be repaired using this tool.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : activeSubmenu === 'variation-spread' ? (
        <VariationSpreadViewer />
      ) : activeSubmenu === 'beta-signups' ? (
        <BetaSignupsViewer />
      ) : activeSubmenu === 'reset-timeline' ? (
        <ResetTimelineChecker />
      ) : (
        <>
          {/* Database Selection Warning Banner */}
          {selectedDatabase === 'sturgeon' && !productionMutationsEnabled && (
            <div className="mb-4 p-4 bg-red-900/30 border-2 border-red-500/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-red-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    VIEWING PRODUCTION DATA - READ ONLY MODE
                  </h4>
                  <p className="text-sm text-red-300 mt-1">
                    You are viewing real production player data from Sturgeon database. All mutation buttons are disabled.
                  </p>
                </div>
                <button
                  onClick={() => setShowConfirmationPrompt(true)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 border border-orange-500 rounded-lg text-white font-bold transition-colors whitespace-nowrap"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  🔓 Enable Mutations
                </button>
              </div>
            </div>
          )}

          {/* Production Mutations Enabled Warning */}
          {selectedDatabase === 'sturgeon' && productionMutationsEnabled && (
            <div className="mb-4 p-4 bg-red-600/50 border-4 border-red-500 rounded-lg animate-pulse">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🔥</span>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-red-100" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    ⚠️ DANGER: PRODUCTION MUTATIONS ENABLED ⚠️
                  </h4>
                  <p className="text-sm text-red-200 mt-1 font-bold">
                    You can now modify REAL PRODUCTION DATA. All changes affect live players immediately. Use extreme caution!
                  </p>
                </div>
                <button
                  onClick={() => {
                    setProductionMutationsEnabled(false);
                    setConfirmationText('');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white font-bold transition-colors whitespace-nowrap"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  🔒 Disable Mutations
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Prompt Modal */}
          {showConfirmationPrompt && mounted && createPortal(
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999]">
              <div className="bg-gray-900 border-4 border-red-500 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-2xl font-bold text-red-400 mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  ⚠️ ENABLE PRODUCTION MUTATIONS?
                </h3>
                <div className="space-y-4 text-sm text-gray-300 mb-6">
                  <p className="font-bold text-red-300">
                    You are about to enable mutations on the PRODUCTION database (Sturgeon).
                  </p>
                  <p>This will allow you to:</p>
                  <ul className="list-disc list-inside space-y-1 text-red-200">
                    <li>Delete real player accounts</li>
                    <li>Modify gold balances for live users</li>
                    <li>Reset player progress</li>
                    <li>Make irreversible changes to production data</li>
                  </ul>
                  <p className="font-bold text-yellow-300">
                    All changes affect REAL PLAYERS immediately!
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-bold text-red-400 mb-2">
                    Type "ENABLE MUTATIONS" to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border-2 border-red-500 rounded-lg text-white focus:outline-none focus:border-red-400"
                    placeholder="ENABLE MUTATIONS"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmationPrompt(false);
                      setConfirmationText('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (confirmationText === 'ENABLE MUTATIONS') {
                        setProductionMutationsEnabled(true);
                        setShowConfirmationPrompt(false);
                        setConfirmationText('');
                      }
                    }}
                    disabled={confirmationText !== 'ENABLE MUTATIONS'}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 border border-red-500 rounded-lg text-white font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Enable Mutations
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  Player Management
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {walletsLoaded && wallets ? (
                    <>{wallets.length} connected wallets • {verifiedCount} verified</>
                  ) : (
                    <>Click "Load Wallets" to view player data</>
                  )}
                </p>
              </div>

              {/* Database Selector */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg">
                <span className="text-sm text-gray-400">Database:</span>
                <select
                  value={selectedDatabase}
                  onChange={(e) => {
                    setSelectedDatabase(e.target.value as 'trout' | 'sturgeon');
                    setWalletsLoaded(false); // Reset to require reload
                  }}
                  className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  <option
                    value="sturgeon"
                    className="bg-gray-800"
                    disabled={!sturgeonClient}
                  >
                    🔴 Sturgeon (Production - READ ONLY){!sturgeonClient ? ' - Not Configured' : ''}
                  </option>
                  <option value="trout" className="bg-gray-800">🔹 Trout (Development)</option>
                </select>
                {!sturgeonClient && (
                  <span className="text-xs text-gray-500" title="Add NEXT_PUBLIC_STURGEON_URL to .env.local to enable production monitoring">
                    ⓘ
                  </span>
                )}
              </div>
            </div>

        <div className="flex items-center gap-3">
          {/* Load/Refresh Wallets Button */}
          <button
            onClick={() => {
              setWalletsLoaded(true);
              setShowOnlyWrenCo(false);
            }}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 border border-yellow-500 rounded-lg text-white font-semibold transition-colors flex items-center gap-2"
          >
            {walletsLoaded ? '🔄 Refresh' : '📥 Load Wallets'}
          </button>
          {/* Load WrenCo Button */}
          <button
            onClick={() => {
              setWalletsLoaded(true);
              setShowOnlyWrenCo(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-lg text-white font-semibold transition-colors flex items-center gap-2"
          >
            👤 Load WrenCo
          </button>

          {/* Export CSV Button */}
          {walletsLoaded && wallets && wallets.length > 0 && (
            <button
              onClick={() => {
                // Generate CSV content
                const headers = ['Company Name', 'Stake Address', 'Meks', 'Cumulative Gold', 'Gold Per Hour', 'Gold Spent', 'First Connected'];
                const rows = wallets.map((w: any) => [
                  w.companyName || 'Unnamed',
                  w.walletAddress,
                  String(w.mekCount || 0),
                  (w.totalCumulativeGold || 0).toFixed(2),
                  (w.totalGoldPerHour || 0).toFixed(2),
                  (w.totalGoldSpentOnUpgrades || 0).toFixed(2),
                  w.createdAt ? new Date(w.createdAt).toLocaleDateString() : 'Unknown'
                ]);

                const csvContent = [
                  headers.join(','),
                  ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
                ].join('\n');

                // Create and trigger download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const timestamp = new Date().toISOString().slice(0, 10);
                link.download = `mek-players-${selectedDatabase}-${timestamp}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 border border-green-500 rounded-lg text-white font-semibold transition-colors flex items-center gap-2"
            >
              📥 Export CSV
            </button>
          )}

          <input
            type="text"
            placeholder="Search wallets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
          />
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-lg border-2 ${
            statusMessage.type === 'success'
              ? 'bg-green-900/20 border-green-500 text-green-200'
              : 'bg-red-900/20 border-red-500 text-red-200'
          }`}
        >
          {statusMessage.message}
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-auto"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: isDragging ? 'none' : 'auto',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <table className="w-full bg-gray-900/50 rounded-lg border border-gray-700">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/50">
              <th
                onClick={() => handleSort('wallet')}
                className="px-2 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors"
              >
                Wallet {sortColumn === 'wallet' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('companyName')}
                className="px-2 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors"
              >
                Company Name {sortColumn === 'companyName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              <th
                onClick={() => handleSort('verified')}
                className="px-2 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors"
              >
                Verified {sortColumn === 'verified' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('meks')}
                className="px-2 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors"
              >
                MEKs {sortColumn === 'meks' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('goldPerHour')}
                className="px-2 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors"
              >
                Gold/hr {sortColumn === 'goldPerHour' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('currentGold')}
                className="px-2 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors"
              >
                Current Gold {sortColumn === 'currentGold' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('cumulativeGold')}
                className="px-2 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors"
              >
                Cumulative Gold {sortColumn === 'cumulativeGold' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('goldSpent')}
                className="px-2 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors"
              >
                Gold Spent {sortColumn === 'goldSpent' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Claimed Token
              </th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Claim Date
              </th>
              <th
                onClick={() => handleSort('firstConnected')}
                className="px-2 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors"
              >
                First Connected {sortColumn === 'firstConnected' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('lastUpdate')}
                className="px-2 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors"
              >
                Last Update {sortColumn === 'lastUpdate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('lastActive')}
                className="px-2 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors"
              >
                Last Active {sortColumn === 'lastActive' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('type')}
                className="px-2 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors"
              >
                Type {sortColumn === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {!walletsLoaded ? (
              <tr>
                <td colSpan={15} className="px-4 py-8 text-center">
                  <div className="text-gray-400">
                    <p className="text-lg mb-2">Wallet data not loaded</p>
                    <p className="text-sm text-gray-500">Click "Load Wallets" button above to view player data</p>
                  </div>
                </td>
              </tr>
            ) : walletDisplay.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'No wallets match your search' : 'No wallets connected yet'}
                </td>
              </tr>
            ) : (
              walletDisplay.map((item) => {
                // Each item is a single wallet (1 wallet = 1 corp)
                const wallet = item.wallets[0];
                  return (
                    <tr key={wallet._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-2 py-2">
                        <div className="font-mono text-sm text-gray-300">
                          <div className="mb-1">
                            {wallet.walletAddress.substring(0, 12)}...{wallet.walletAddress.substring(wallet.walletAddress.length - 8)}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(wallet.walletAddress);
                              setStatusMessage({ type: 'success', message: 'Wallet address copied!' });
                              setTimeout(() => setStatusMessage(null), 2000);
                            }}
                            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors inline-block"
                            title="Copy wallet address"
                          >
                            📋 Copy
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        {wallet.companyName ? (
                          <span className="text-sm font-semibold text-yellow-400">{wallet.companyName}</span>
                        ) : (
                          <span className="text-sm text-gray-600 italic">No name</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="relative">
                          <button
                            className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 rounded transition-colors whitespace-nowrap"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const position = {
                                bottom: window.innerHeight - rect.top, // Position above button
                                left: rect.right - 220 // 220px is dropdown width
                              };
                              console.log('[DROPDOWN] Mounted:', mounted, 'Position:', position, 'Wallet:', wallet.walletAddress.slice(0, 12));
                              setDropdownPosition(position);
                              setHoveredDropdown(wallet.walletAddress);
                            }}
                            onMouseLeave={(e) => {
                              // Only close if mouse is not moving to dropdown
                              const relatedTarget = e.relatedTarget as HTMLElement;
                              if (!relatedTarget || !relatedTarget.closest('[data-dropdown]')) {
                                console.log('[DROPDOWN] Closing dropdown');
                                setHoveredDropdown(null);
                                setDropdownPosition(null);
                              }
                            }}
                          >
                            Actions ▼
                          </button>

                          {mounted && hoveredDropdown === wallet.walletAddress && dropdownPosition && (() => {
                            console.log('[DROPDOWN] Rendering portal for:', wallet.walletAddress.slice(0, 12));
                            return createPortal(
                            <div
                              data-dropdown="true"
                              className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-[9999] w-[220px] py-1"
                              style={{
                                bottom: `${dropdownPosition.bottom}px`,
                                left: `${dropdownPosition.left}px`,
                              }}
                              onMouseEnter={() => setHoveredDropdown(wallet.walletAddress)}
                              onMouseLeave={() => {
                                setHoveredDropdown(null);
                                setDropdownPosition(null);
                              }}
                            >
                              {selectedDatabase === 'sturgeon' && !productionMutationsEnabled && (
                                <div className="px-3 py-2 text-xs text-red-400 bg-red-900/30 border-b border-red-700">
                                  🔒 READ ONLY MODE - Mutations Disabled
                                </div>
                              )}
                              {selectedDatabase === 'sturgeon' && productionMutationsEnabled && (
                                <div className="px-3 py-2 text-xs text-orange-300 bg-red-600/50 border-b border-red-500 font-bold animate-pulse">
                                  ⚠️ PRODUCTION MUTATIONS ENABLED
                                </div>
                              )}
                              <button
                                onClick={() => { if (selectedDatabase !== 'sturgeon' || productionMutationsEnabled) { handleDeleteWallet(wallet.walletAddress); setHoveredDropdown(null); setDropdownPosition(null); } }}
                                disabled={selectedDatabase === 'sturgeon' && !productionMutationsEnabled}
                                className="w-full px-3 py-2 text-sm text-left bg-transparent hover:bg-red-900/50 text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title={(selectedDatabase === 'sturgeon' && !productionMutationsEnabled) ? '🔒 Disabled in READ ONLY mode' : 'Delete wallet permanently'}
                              >
                                Delete
                              </button>
                              <div className="border-t border-gray-700 my-1"></div>
                              <button
                                onClick={() => { if (selectedDatabase !== 'sturgeon' || productionMutationsEnabled) { handleResetAllGold(wallet.walletAddress); setHoveredDropdown(null); setDropdownPosition(null); } }}
                                disabled={selectedDatabase === 'sturgeon' && !productionMutationsEnabled}
                                className="w-full px-3 py-2 text-sm text-left bg-transparent hover:bg-purple-900/50 text-purple-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title={(selectedDatabase === 'sturgeon' && !productionMutationsEnabled) ? '🔒 Disabled in READ ONLY mode' : 'Reset all gold (spendable + cumulative) to zero'}
                              >
                                Reset All Gold
                              </button>
                              <button
                                onClick={() => { if (selectedDatabase !== 'sturgeon' || productionMutationsEnabled) { handleResetMekLevels(wallet.walletAddress); setHoveredDropdown(null); setDropdownPosition(null); } }}
                                disabled={selectedDatabase === 'sturgeon' && !productionMutationsEnabled}
                                className="w-full px-3 py-2 text-sm text-left bg-transparent hover:bg-yellow-900/50 text-yellow-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title={(selectedDatabase === 'sturgeon' && !productionMutationsEnabled) ? '🔒 Disabled in READ ONLY mode' : 'Reset all Mek levels to Level 1'}
                              >
                                Reset Levels
                              </button>
                              <button
                                onClick={() => { if (selectedDatabase !== 'sturgeon' || productionMutationsEnabled) { handleReconstructExact(wallet.walletAddress); setHoveredDropdown(null); setDropdownPosition(null); } }}
                                disabled={selectedDatabase === 'sturgeon' && !productionMutationsEnabled}
                                className="w-full px-3 py-2 text-sm text-left bg-transparent hover:bg-cyan-900/50 text-cyan-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title={(selectedDatabase === 'sturgeon' && !productionMutationsEnabled) ? '🔒 Disabled in READ ONLY mode' : '100% ACCURATE reconstruction using snapshot history + upgrade tracking with minute-by-minute timeline'}
                              >
                                🎯 Exact Recon.
                              </button>
                              {wallet.totalCumulativeGold < wallet.currentGold && (
                                <>
                                  <button
                                    onClick={() => { if (selectedDatabase !== 'sturgeon' || productionMutationsEnabled) { handleReconstructFromSnapshots(wallet.walletAddress); setHoveredDropdown(null); setDropdownPosition(null); } }}
                                    disabled={selectedDatabase === 'sturgeon'}
                                    className="w-full px-3 py-2 text-sm text-left bg-transparent hover:bg-blue-900/50 text-blue-400 transition-colors animate-pulse disabled:opacity-30 disabled:cursor-not-allowed"
                                    title={(selectedDatabase === 'sturgeon' && !productionMutationsEnabled) ? '🔒 Disabled in READ ONLY mode' : 'Reconstruct from Snapshots'}
                                  >
                                    📸 Reconstruct
                                  </button>
                                  <button
                                    onClick={() => { if (selectedDatabase !== 'sturgeon' || productionMutationsEnabled) { handleFixCumulativeGold(wallet.walletAddress); setHoveredDropdown(null); setDropdownPosition(null); } }}
                                    disabled={selectedDatabase === 'sturgeon'}
                                    className="w-full px-3 py-2 text-sm text-left bg-transparent hover:bg-green-900/50 text-green-400 transition-colors animate-pulse disabled:opacity-30 disabled:cursor-not-allowed"
                                    title={(selectedDatabase === 'sturgeon' && !productionMutationsEnabled) ? '🔒 Disabled in READ ONLY mode' : 'Fix corrupted cumulative gold (cumulative cannot be less than current!)'}
                                  >
                                    🔧 Fix Cumul.
                                  </button>
                                </>
                              )}
                              {wallet.totalGoldPerHour === 0 && wallet.walletAddress.endsWith('fe6012f1') && (
                                <button
                                  onClick={() => { if (selectedDatabase !== 'sturgeon' || productionMutationsEnabled) { manualSetMeks({ walletAddress: wallet.walletAddress, mekCount: 45, totalGoldPerHour: 176.56 }); setHoveredDropdown(null); setDropdownPosition(null); } }}
                                  disabled={selectedDatabase === 'sturgeon'}
                                  className="w-full px-3 py-2 text-sm text-left bg-transparent hover:bg-green-900/50 text-green-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title={(selectedDatabase === 'sturgeon' && !productionMutationsEnabled) ? '🔒 Disabled in READ ONLY mode' : 'Manually fix MEK ownership'}
                                >
                                  Fix MEKs
                                </button>
                              )}
                              {wallet.isVerified && (
                                <button
                                  onClick={() => { if (selectedDatabase !== 'sturgeon' || productionMutationsEnabled) { handleResetVerification(wallet.walletAddress); setHoveredDropdown(null); setDropdownPosition(null); } }}
                                  disabled={selectedDatabase === 'sturgeon'}
                                  className="w-full px-3 py-2 text-sm text-left bg-transparent hover:bg-orange-900/50 text-orange-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title={(selectedDatabase === 'sturgeon' && !productionMutationsEnabled) ? '🔒 Disabled in READ ONLY mode' : 'Reset verification (for testing)'}
                                >
                                  Reset Verify
                                </button>
                              )}
                              <button
                                onClick={() => { if (selectedDatabase !== 'sturgeon' || productionMutationsEnabled) { handleSingleWalletSnapshot(wallet.walletAddress); setHoveredDropdown(null); setDropdownPosition(null); } }}
                                disabled={isRunningSnapshot || (selectedDatabase === 'sturgeon' && !productionMutationsEnabled)}
                                className="w-full px-3 py-2 text-sm text-left bg-transparent hover:bg-indigo-900/50 text-indigo-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title={(selectedDatabase === 'sturgeon' && !productionMutationsEnabled) ? '🔒 Disabled in READ ONLY mode' : 'Run blockchain snapshot for this wallet (with debug logging)'}
                              >
                                📸 Snapshot
                              </button>
                              <button
                                onClick={() => { setDiagnosticWallet(wallet.walletAddress); setHoveredDropdown(null); setDropdownPosition(null); }}
                                className="w-full px-3 py-2 text-sm text-left bg-transparent hover:bg-purple-900/50 text-purple-400 transition-colors"
                                title="Diagnose boost sync issues - compare ownedMeks vs mekLevels"
                              >
                                🔍 Boost Sync
                              </button>
                              <button
                                onClick={() => { setViewingActivityLog(wallet.walletAddress); setHoveredDropdown(null); setDropdownPosition(null); }}
                                className="w-full px-3 py-2 text-sm text-left bg-transparent hover:bg-green-900/50 text-green-400 transition-colors"
                                title="View activity log (upgrades, connections, etc.)"
                              >
                                📋 Activity
                              </button>
                              <button
                                onClick={() => { setViewingBuffs(wallet.walletAddress); setHoveredDropdown(null); setDropdownPosition(null); }}
                                disabled={selectedDatabase === 'sturgeon' && !productionMutationsEnabled}
                                className="w-full px-3 py-2 text-sm text-left bg-transparent hover:bg-yellow-900/50 text-yellow-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title={(selectedDatabase === 'sturgeon' && !productionMutationsEnabled) ? '🔒 Disabled in READ ONLY mode' : 'Manage essence buffs (generation rate & max cap)'}
                              >
                                ⚡ Buffs
                              </button>
                              <button
                                onClick={() => { setViewingEssence(wallet.walletAddress); setHoveredDropdown(null); setDropdownPosition(null); }}
                                className="w-full px-3 py-2 text-sm text-left bg-transparent hover:bg-cyan-900/50 text-cyan-400 transition-colors"
                                title="View essence balances for this wallet"
                              >
                                View Essence
                              </button>
                              <button
                                onClick={() => { setViewingMekLevels(wallet.walletAddress); setHoveredDropdown(null); setDropdownPosition(null); }}
                                className="w-full px-3 py-2 text-sm text-left bg-transparent hover:bg-blue-900/50 text-blue-400 transition-colors"
                                title="View all Mek levels for this wallet"
                              >
                                View Levels
                              </button>
                            </div>,
                            document.body
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        {wallet.isVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-700">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-700">
                            ✗ Not Verified
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <span className="text-sm font-semibold text-yellow-400">{wallet.mekCount}</span>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <span className="text-sm text-gray-300">{wallet.totalGoldPerHour.toFixed(2)}</span>
                      </td>
                      <td className="px-2 py-2 text-right">
                        {editingGold?.walletAddress === wallet.walletAddress ? (
                          <input
                            type="number"
                            value={editingGold.value}
                            onChange={(e) => setEditingGold({ ...editingGold, value: e.target.value })}
                            onBlur={async () => {
                              const newGold = parseInt(editingGold.value);
                              if (!isNaN(newGold) && newGold >= 0) {
                                try {
                                  const result = await updateWalletGold({
                                    walletAddress: wallet.walletAddress,
                                    newGoldAmount: newGold,
                                  });
                                  setStatusMessage({ type: 'success', message: result.message });
                                  setTimeout(() => setStatusMessage(null), 3000);
                                } catch (error) {
                                  setStatusMessage({ type: 'error', message: 'Failed to update gold' });
                                  setTimeout(() => setStatusMessage(null), 3000);
                                }
                              }
                              setEditingGold(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              } else if (e.key === 'Escape') {
                                setEditingGold(null);
                              }
                            }}
                            className="px-2 py-1 text-sm bg-gray-800 border border-yellow-500 rounded text-yellow-400 font-semibold w-24 text-right"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="text-sm font-semibold text-yellow-400 cursor-pointer hover:bg-yellow-900/20 px-2 py-1 rounded transition-colors"
                            onClick={() => setEditingGold({ walletAddress: wallet.walletAddress, value: wallet.currentGold.toString() })}
                            title="Click to edit gold amount"
                          >
                            {wallet.currentGold.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <span className="text-sm font-semibold text-yellow-400">
                          {(wallet.totalCumulativeGold || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <span className="text-sm font-semibold text-red-400">
                          {(wallet.totalGoldSpentOnUpgrades || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        {(() => {
                          const claimStatus = claimStatusData?.[wallet.walletAddress];
                          const hasClaimed = claimStatus?.claimed || false;
                          return hasClaimed ? (
                            <span className="inline-block bg-green-600/20 text-green-400 border border-green-500/30 px-2.5 py-0.5 rounded text-xs font-bold">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-block bg-gray-700/20 text-gray-400 border border-gray-600/30 px-2.5 py-0.5 rounded text-xs">
                              No
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-2 py-2">
                        {(() => {
                          const claimStatus = claimStatusData?.[wallet.walletAddress];
                          const claimDate = claimStatus?.claimedAt;
                          return claimDate ? (
                            <div className="text-xs text-gray-300">
                              <div>{new Date(claimDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              <div className="text-gray-500">{new Date(claimDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
                            </div>
                          ) : (
                            <span className="text-gray-600 italic text-xs">—</span>
                          );
                        })()}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className="text-xs text-gray-400">
                          {wallet.createdAt ? new Date(wallet.createdAt).toLocaleString() : 'N/A'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className="text-xs text-gray-400">
                          {wallet.lastSnapshotTime
                            ? new Date(wallet.lastSnapshotTime).toLocaleString()
                            : wallet.updatedAt
                            ? new Date(wallet.updatedAt).toLocaleString()
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className="text-xs text-gray-400">{wallet.lastActiveDisplay}</span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-sm text-gray-400 capitalize">{wallet.walletType}</span>
                      </td>
                    </tr>
                  );
              })
            )}
          </tbody>
        </table>
      </div>

          <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Admin Actions</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• <strong>Edit Gold</strong>: Click on any gold amount to manually set it (useful for testing leveling system)</li>
              <li>• <strong>Run Snapshot</strong>: Manually triggers the 6-hour blockchain snapshot (queries Blockfrost for all active wallets and updates gold rates)</li>
              <li>• <strong>Merge by Suffix</strong>: Merges wallet records ending with the same suffix (e.g., different address formats of the same wallet)</li>
              <li>• <strong>Merge All Duplicates</strong>: Merges exact duplicate wallet address records in the database</li>
              <li>• <strong>Reset Verify</strong>: Marks wallet as unverified (for testing the verification flow)</li>
              <li>• <strong>Reset Levels</strong>: Resets all Mek levels to Level 1 and removes all level bonuses (useful for testing the leveling system)</li>
              <li>• <strong>Reset All Gold</strong>: Zeros out spendable gold, cumulative gold, and gold spent on upgrades (nuclear option - bypasses normal protections)</li>
              <li>• <strong>Delete</strong>: Permanently removes wallet from the system (cannot be undone)</li>
              <li>• Verification status controls whether gold accumulates for the wallet</li>
              <li>• Duplicate records are automatically hidden in this view (only best record shown per user)</li>
              <li>• Automated cron jobs: 6-hour blockchain snapshots, 4 AM UTC duplicate merging, 6-hour gold backups</li>
            </ul>
          </div>
        </>
      )}

      {viewingMekLevels && (
        <MekLevelsViewer
          walletAddress={viewingMekLevels}
          client={client}
          selectedDatabase={selectedDatabase}
          onClose={() => setViewingMekLevels(null)}
        />
      )}

      {viewingEssence && (
        <EssenceProvider walletAddress={viewingEssence}>
          <EssenceBalancesViewer
            client={client}
            selectedDatabase={selectedDatabase}
            onClose={() => setViewingEssence(null)}
          />
        </EssenceProvider>
      )}

      {viewingBuffs && (
        <BuffManagement
          walletAddress={viewingBuffs}
          client={client}
          selectedDatabase={selectedDatabase}
          onClose={() => setViewingBuffs(null)}
        />
      )}

      {viewingActivityLog && (
        <ActivityLogViewer
          walletAddress={viewingActivityLog}
          client={client}
          selectedDatabase={selectedDatabase}
          onClose={() => setViewingActivityLog(null)}
        />
      )}

      {/* Boost Sync Diagnostic Modal */}
      {diagnosticWallet && boostDiagnostic && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-purple-500/50 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-500/30 bg-purple-900/20">
              <div>
                <h2 className="text-xl font-bold text-purple-400">Boost Sync Diagnostic</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Comparing ownedMeks (UI data) vs mekLevels (source of truth)
                </p>
              </div>
              <button
                onClick={() => setDiagnosticWallet(null)}
                className="text-gray-400 hover:text-white text-2xl font-bold px-3"
              >
                ×
              </button>
            </div>

            {/* Summary Stats */}
            {!('error' in boostDiagnostic) && (
              <div className="p-4 bg-gray-800/50 border-b border-purple-500/20">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                    <div className="text-xs text-gray-500 uppercase">Total Meks</div>
                    <div className="text-2xl font-bold text-white">{boostDiagnostic.totalMeks}</div>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                    <div className="text-xs text-gray-500 uppercase">Upgraded Meks</div>
                    <div className="text-2xl font-bold text-yellow-400">{boostDiagnostic.upgradedMeks}</div>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                    <div className="text-xs text-gray-500 uppercase">Boosts in UI</div>
                    <div className={`text-2xl font-bold ${
                      boostDiagnostic.boostsShowingInUI === boostDiagnostic.upgradedMeks
                        ? 'text-green-400'
                        : 'text-red-400 animate-pulse'
                    }`}>
                      {boostDiagnostic.boostsShowingInUI}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                    <div className="text-xs text-gray-500 uppercase">Out of Sync</div>
                    <div className={`text-2xl font-bold ${
                      boostDiagnostic.outOfSync === 0 ? 'text-green-400' : 'text-red-400 animate-pulse'
                    }`}>
                      {boostDiagnostic.outOfSync}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                    <div className="text-xs text-gray-500 uppercase">mekLevels Records</div>
                    <div className="text-2xl font-bold text-blue-400">{boostDiagnostic.mekLevelsRecords}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {'error' in boostDiagnostic && (
              <div className="p-4 bg-red-900/20 border border-red-500/30 m-4 rounded">
                <p className="text-red-400">{boostDiagnostic.error}</p>
              </div>
            )}

            {/* Mek Comparison Table */}
            {!('error' in boostDiagnostic) && (
              <div className="flex-1 overflow-auto p-4">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-800 border-b border-purple-500/30">
                    <tr>
                      <th className="text-left p-2 text-purple-400">Mek</th>
                      <th className="text-center p-2 text-blue-400">Level</th>
                      <th className="text-center p-2 text-green-400">goldPerHour<br/>(should be total)</th>
                      <th className="text-center p-2 text-green-400">Base g/hr</th>
                      <th className="text-center p-2 text-yellow-400">Boost g/hr</th>
                      <th className="text-center p-2 text-purple-400">Calculated Boost</th>
                      <th className="text-center p-2 text-red-400">UI Shows Boost?</th>
                      <th className="text-center p-2 text-gray-400">In Sync?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boostDiagnostic.comparison.map((mek, index) => (
                      <tr
                        key={index}
                        className={`border-b border-gray-800 ${
                          !mek.inSync ? 'bg-red-900/20' : mek.hasBoost ? 'bg-yellow-900/10' : ''
                        }`}
                      >
                        <td className="p-2 font-mono text-xs">
                          <div className="font-bold text-white">{mek.assetName}</div>
                          <div className="text-gray-500 text-[10px]">{mek.assetId}</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-400">Owned: {mek.ownedMeks_currentLevel || 1}</span>
                            <span className={`text-xs font-bold ${
                              mek.mekLevels_currentLevel && mek.mekLevels_currentLevel > 1 ? 'text-yellow-400' : 'text-gray-500'
                            }`}>
                              Actual: {mek.mekLevels_currentLevel || 1}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="text-sm font-bold text-white">
                            {mek.ownedMeks_goldPerHour?.toFixed(1) || 'N/A'}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            (effective: {mek.ownedMeks_effectiveGoldPerHour?.toFixed(1) || 'N/A'})
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-400">
                              {mek.ownedMeks_baseGoldPerHour?.toFixed(1) || 'N/A'}
                            </span>
                            <span className="text-xs font-bold text-blue-400">
                              {mek.mekLevels_baseGoldPerHour?.toFixed(1) || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-400">
                              {mek.ownedMeks_levelBoostAmount?.toFixed(1) || '0.0'}
                            </span>
                            <span className="text-xs font-bold text-yellow-400">
                              {mek.mekLevels_currentBoostAmount?.toFixed(1) || '0.0'}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <span className={`text-sm font-bold ${
                            mek.calculatedBoost > 0 ? 'text-green-400' : 'text-gray-500'
                          }`}>
                            {mek.calculatedBoost > 0 ? '+' : ''}{mek.calculatedBoost.toFixed(1)}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          {mek.boostShowsInUI ? (
                            <span className="text-green-400 font-bold">✓ YES</span>
                          ) : mek.hasBoost ? (
                            <span className="text-red-400 font-bold animate-pulse">✗ NO</span>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {mek.inSync ? (
                            <span className="text-green-400">✓</span>
                          ) : (
                            <span className="text-red-400 font-bold">✗</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Actions */}
            <div className="p-4 border-t border-purple-500/30 bg-gray-800/50 flex justify-between items-center">
              <div className="text-xs text-gray-400">
                {!('error' in boostDiagnostic) && (
                  <span>
                    Wallet: <span className="font-mono text-purple-400">{boostDiagnostic.walletAddress.substring(0, 20)}...</span>
                  </span>
                )}
              </div>
              <button
                onClick={() => setDiagnosticWallet(null)}
                className="px-4 py-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-400 border border-purple-700 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DatabaseProvider>
  );
}

export default function WalletManagementAdmin() {
  return (
    <DatabaseProvider>
      <WalletManagementAdminContent />
    </DatabaseProvider>
  );
}