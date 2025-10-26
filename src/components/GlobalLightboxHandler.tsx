'use client';

import { useEffect, useState } from 'react';
import EssenceDistributionLightbox from '@/components/EssenceDistributionLightbox';
import MekLevelsViewer from '@/components/MekLevelsViewer';
import ActivityLogViewer from '@/components/ActivityLogViewer';
import EssenceBalancesViewer from '@/components/EssenceBalancesViewer';
import BuffManagement from '@/components/BuffManagement';
import MechanismGridLightbox from '@/components/MechanismGridLightbox';
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
  const [walletAddress, setWalletAddress] = useState<string>('');

  // Get wallet address from encrypted session on mount
  useEffect(() => {
    const loadWallet = async () => {
      const session = await restoreWalletSession();
      const stored = session?.stakeAddress || '';
      setWalletAddress(stored);
      console.log('[GlobalLightboxHandler] Wallet address from session:', stored ? stored.slice(0, 15) + '...' : 'none');
    };
    loadWallet();
  }, []);

  useEffect(() => {
    console.log('[GlobalLightboxHandler] Attaching openLightbox event listener');

    const handleOpenLightbox = (event: CustomEvent) => {
      console.log('[GlobalLightboxHandler] Received openLightbox event!', event);
      const lightboxId = event.detail?.lightboxId;
      const eventWalletAddress = event.detail?.walletAddress;
      console.log('[GlobalLightboxHandler] Lightbox ID:', lightboxId);
      console.log('[GlobalLightboxHandler] Wallet from event:', eventWalletAddress);

      switch (lightboxId) {
        case 'essence-distribution':
          console.log('[GlobalLightboxHandler] Opening Essence Distribution lightbox');
          // Use wallet from event detail if provided, otherwise restore from encrypted session
          (async () => {
            let currentWallet = eventWalletAddress;
            if (!currentWallet || currentWallet === 'demo_wallet_123') {
              const session = await restoreWalletSession();
              currentWallet = session?.stakeAddress || 'demo_wallet_123';
            }
            console.log('[GlobalLightboxHandler] Using wallet address:', currentWallet ? currentWallet.slice(0, 15) + '...' : 'demo');
            setWalletAddress(currentWallet);
            setShowEssenceLightbox(true);
          })();
          break;
        case 'mek-levels':
          console.log('[GlobalLightboxHandler] Opening Mek Levels lightbox');
          setShowMekLevels(true);
          break;
        case 'activity-log':
          console.log('[GlobalLightboxHandler] Opening Activity Log lightbox');
          setShowActivityLog(true);
          break;
        case 'essence-balances':
          console.log('[GlobalLightboxHandler] Opening Essence Balances lightbox');
          setShowEssenceBalances(true);
          break;
        case 'essence-buffs':
          console.log('[GlobalLightboxHandler] Opening Essence Buffs lightbox');
          setShowEssenceBuffs(true);
          break;
        default:
          console.warn('[GlobalLightboxHandler] Unknown lightbox ID:', lightboxId);
      }
    };

    window.addEventListener('openLightbox', handleOpenLightbox as EventListener);
    return () => {
      console.log('[GlobalLightboxHandler] Removing openLightbox event listener');
      window.removeEventListener('openLightbox', handleOpenLightbox as EventListener);
    };
  }, []);

  return (
    <EssenceProvider walletAddress={walletAddress || null}>
      {/* Essence Distribution Lightbox */}
      {showEssenceLightbox && (
        <>
          {console.log('[GlobalLightboxHandler] Rendering EssenceDistributionLightbox (using shared context)')}
          <EssenceDistributionLightbox
            isOpen={true}
            onClose={() => {
              console.log('[GlobalLightboxHandler] Closing EssenceDistributionLightbox');
              setShowEssenceLightbox(false);
            }}
          />
        </>
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
    </EssenceProvider>
  );
}
