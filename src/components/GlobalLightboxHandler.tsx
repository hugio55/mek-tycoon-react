'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import EssenceDistributionLightbox from '@/components/EssenceDistributionLightbox';
import ActivityLogViewer from '@/components/ActivityLogViewer';
import EssenceBalancesViewer from '@/components/EssenceBalancesViewer';
import BuffManagement from '@/components/BuffManagement';
import MechanismGridLightbox from '@/components/MechanismGridLightbox';
import MeksTriangleLightbox from '@/components/MeksTriangleLightbox';
import BetaSignupLightbox from '@/components/BetaSignupLightbox';
import { restoreWalletSession } from '@/lib/walletSessionManager';
import { EssenceProvider } from '@/contexts/EssenceContext';
import { getMekDataByNumber } from '@/lib/mekNumberToVariation';
import { getMediaUrl } from '@/lib/media-url';
import MekDetailsSpaceAge from '@/components/MekDetailsSpaceAge';

// Extended Mek type for details lightbox (matches userData.ownedMeks shape)
interface MekData {
  assetId: string;
  assetName?: string;
  mekNumber?: number;
  sourceKey?: string;
  imageUrl?: string;
  iconUrl?: string;
  rarityRank?: number;
  currentLevel?: number;
  mekLevel?: number;
  customName?: string;
  accumulatedGoldForCorp?: number;
  accumulatedGoldAllTime?: number;
}

/**
 * Global handler for navigation button lightbox events
 * Listens for custom 'openLightbox' events from NavigationBar and opens the appropriate lightbox
 */
export default function GlobalLightboxHandler() {
  const [showEssenceLightbox, setShowEssenceLightbox] = useState(false);
  const [showMekGrid, setShowMekGrid] = useState(false);
  const [selectedMek, setSelectedMek] = useState<MekData | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showEssenceBalances, setShowEssenceBalances] = useState(false);
  const [showEssenceBuffs, setShowEssenceBuffs] = useState(false);
  const [showMeksTriangle, setShowMeksTriangle] = useState(false);
  const [showBetaSignup, setShowBetaSignup] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');

  // Get owned Meks data for triangle lightbox
  // Phase II: Use userData.getUserData instead of goldMining
  const userData = useQuery(
    api.userData.getUserData,
    walletAddress ? { walletAddress } : "skip"
  );

  // Get wallet address from encrypted session on mount
  useEffect(() => {
    const loadWallet = async () => {
      const session = await restoreWalletSession();
      const stored = session?.stakeAddress || '';
      setWalletAddress(stored);
    };
    loadWallet();
  }, []);

  useEffect(() => {
    const handleOpenLightbox = (event: CustomEvent) => {
      const lightboxId = event.detail?.lightboxId;
      const eventWalletAddress = event.detail?.walletAddress;

      switch (lightboxId) {
        case 'essence-distribution':
          // Use wallet from event detail if provided, otherwise restore from encrypted session
          (async () => {
            let currentWallet = eventWalletAddress;
            if (!currentWallet) {
              const session = await restoreWalletSession();
              currentWallet = session?.stakeAddress || '';
            }
            setWalletAddress(currentWallet);
            setShowEssenceLightbox(true);
          })();
          break;
        case 'mek-levels':
          // Show Mek grid instead of old MekLevelsViewer
          (async () => {
            let currentWallet = eventWalletAddress;
            if (!currentWallet) {
              const session = await restoreWalletSession();
              currentWallet = session?.stakeAddress || '';
            }
            setWalletAddress(currentWallet);
            setShowMekGrid(true);
          })();
          break;
        case 'activity-log':
          setShowActivityLog(true);
          break;
        case 'essence-balances':
          setShowEssenceBalances(true);
          break;
        case 'essence-buffs':
          setShowEssenceBuffs(true);
          break;
        case 'variation-triangle':
        case 'meks-triangle':
          // Ensure we have wallet address for querying owned Meks
          (async () => {
            let currentWallet = eventWalletAddress;
            if (!currentWallet) {
              const session = await restoreWalletSession();
              currentWallet = session?.stakeAddress || '';
            }
            setWalletAddress(currentWallet);
            setShowMeksTriangle(true);
          })();
          break;
        case 'beta-signup':
          setShowBetaSignup(true);
          break;
        default:
          console.warn('[GlobalLightboxHandler] Unknown lightbox ID:', lightboxId);
      }
    };

    window.addEventListener('openLightbox', handleOpenLightbox as EventListener);
    return () => {
      window.removeEventListener('openLightbox', handleOpenLightbox as EventListener);
    };
  }, []);

  return (
    <EssenceProvider walletAddress={walletAddress || null}>
      {/* Essence Distribution Lightbox */}
      {showEssenceLightbox && (
        <EssenceDistributionLightbox
          isOpen={true}
          onClose={() => setShowEssenceLightbox(false)}
        />
      )}

      {/* Mek Grid Lightbox */}
      {showMekGrid && userData && (
        <MechanismGridLightbox
          ownedMeks={(userData.ownedMeks || []) as unknown as MekData[]}
          currentGold={userData.gold || 0}
          walletAddress={walletAddress}
          getMekImageUrl={(mekNumber: number, size?: '150px' | '500px' | '1000px') => {
            const mekData = getMekDataByNumber(mekNumber);
            if (mekData?.sourceKey) {
              const cleanKey = mekData.sourceKey.replace(/-[A-Z]$/, '').toLowerCase();
              return getMediaUrl(`/mek-images/${size || '150px'}/${cleanKey}.webp`);
            }
            return getMediaUrl(`/mek-images/${size || '150px'}/placeholder.webp`);
          }}
          animatedMekValues={{}}
          upgradingMeks={new Set()}
          onClose={() => setShowMekGrid(false)}
          onMekClick={(mek) => {
            setSelectedMek(mek);
            setShowMekGrid(false); // Close grid when selecting a Mek
          }}
        />
      )}

      {/* Mek Details Space Age Lightbox */}
      {selectedMek && (
        <MekDetailsSpaceAge
          isOpen={true}
          onClose={() => setSelectedMek(null)}
          mek={selectedMek}
          corporationName={userData?.corporationName || 'Unknown Corp'}
        />
      )}

      {/* Mek Grid - No Meks State */}
      {showMekGrid && userData && userData.ownedMeks?.length === 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowMekGrid(false)} />
          <div className="relative bg-black/95 border-2 border-yellow-500/50 rounded-lg p-8 max-w-md">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">No Meks Found</h2>
            <p className="text-gray-400 mb-6">Connect your wallet and verify ownership to see your Meks here.</p>
            <button
              onClick={() => setShowMekGrid(false)}
              className="px-6 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Activity Log Lightbox */}
      {showActivityLog && (
        <ActivityLogViewer
          walletAddress={walletAddress}
          onClose={() => setShowActivityLog(false)}
        />
      )}

      {/* Essence Balances Lightbox */}
      {showEssenceBalances && (
        <EssenceBalancesViewer
          onClose={() => setShowEssenceBalances(false)}
        />
      )}

      {/* Essence Buffs Lightbox */}
      {showEssenceBuffs && (
        <BuffManagement
          walletAddress={walletAddress}
          onClose={() => setShowEssenceBuffs(false)}
        />
      )}

      {/* Meks Triangle Lightbox */}
      {showMeksTriangle && userData && (
        <MeksTriangleLightbox
          onClose={() => setShowMeksTriangle(false)}
          ownedMeks={(userData.ownedMeks || []) as any}
        />
      )}

      {/* Beta Signup Lightbox */}
      {showBetaSignup && (
        <BetaSignupLightbox
          isVisible={true}
          onClose={() => setShowBetaSignup(false)}
        />
      )}
    </EssenceProvider>
  );
}
