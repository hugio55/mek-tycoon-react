'use client';

import { useEffect, useState } from 'react';
import EssenceDistributionLightbox from '@/components/EssenceDistributionLightbox';
import MekLevelsViewer from '@/components/MekLevelsViewer';
import ActivityLogViewer from '@/components/ActivityLogViewer';
import EssenceBalancesViewer from '@/components/EssenceBalancesViewer';
import EssenceBuffManagement from '@/components/EssenceBuffManagement';

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

  // Get wallet address from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('walletAddress') || localStorage.getItem('stakeAddress') || '';
    setWalletAddress(stored);
    console.log('[GlobalLightboxHandler] Wallet address from localStorage:', stored);
  }, []);

  useEffect(() => {
    console.log('[GlobalLightboxHandler] Attaching openLightbox event listener');

    const handleOpenLightbox = (event: CustomEvent) => {
      console.log('[GlobalLightboxHandler] Received openLightbox event!', event);
      const lightboxId = event.detail?.lightboxId;
      console.log('[GlobalLightboxHandler] Lightbox ID:', lightboxId);

      switch (lightboxId) {
        case 'essence-distribution':
          console.log('[GlobalLightboxHandler] Opening Essence Distribution lightbox');
          setShowEssenceLightbox(true);
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
    <>
      {/* Essence Distribution Lightbox */}
      {showEssenceLightbox && (
        <>
          {console.log('[GlobalLightboxHandler] Rendering EssenceDistributionLightbox with walletAddress:', walletAddress || 'demo_wallet_123')}
          <EssenceDistributionLightbox
            isOpen={true}
            onClose={() => {
              console.log('[GlobalLightboxHandler] Closing EssenceDistributionLightbox');
              setShowEssenceLightbox(false);
            }}
            walletAddress={walletAddress || 'demo_wallet_123'}
          />
        </>
      )}

      {/* Mek Levels Lightbox */}
      {showMekLevels && (
        <MekLevelsViewer onClose={() => setShowMekLevels(false)} />
      )}

      {/* Activity Log Lightbox */}
      {showActivityLog && (
        <ActivityLogViewer onClose={() => setShowActivityLog(false)} />
      )}

      {/* Essence Balances Lightbox */}
      {showEssenceBalances && (
        <EssenceBalancesViewer onClose={() => setShowEssenceBalances(false)} />
      )}

      {/* Essence Buffs Lightbox */}
      {showEssenceBuffs && (
        <EssenceBuffManagement onClose={() => setShowEssenceBuffs(false)} />
      )}
    </>
  );
}
