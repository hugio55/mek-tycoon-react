'use client';

import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import EssenceDistributionLightbox from '@/components/EssenceDistributionLightbox';
import MekLevelsViewer from '@/components/MekLevelsViewer';
import ActivityLogViewer from '@/components/ActivityLogViewer';
import EssenceBalancesViewer from '@/components/EssenceBalancesViewer';
import BuffManagement from '@/components/BuffManagement';
import MechanismGridLightbox from '@/components/MechanismGridLightbox';
import MeksTriangleLightbox from '@/components/MeksTriangleLightbox';
import BetaSignupLightbox from '@/components/BetaSignupLightbox';
import { restoreWalletSession } from '@/lib/walletSessionManager';
import { EssenceProvider } from '@/contexts/EssenceContext';

/**
 * Global handler for navigation button lightbox events
 * Listens for custom 'openLightbox' events from NavigationBar and opens the appropriate lightbox
 */
export default function GlobalLightboxHandler() {
  const [showEssenceLightbox, setShowEssenceLightbox] = useState(false);
  const [showMekLevels, setShowMekLevels] = useState(false);
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
          setShowMekLevels(true);
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

      {/* Mek Levels Lightbox */}
      {showMekLevels && (
        <MekLevelsViewer
          walletAddress={walletAddress}
          onClose={() => setShowMekLevels(false)}
        />
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
