'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { getMediaUrl } from "@/lib/media-url";

// Mock wallet data for demo mode
const DEMO_WALLET_ADDRESS = 'stake1demo_test_wallet_for_ui_testing_only';

// Phase II: Meks no longer have inherent gold rates - gold comes from Job Slots
const DEMO_MEKS = [
  {
    assetId: 'demo_mek_1',
    policyId: 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3',
    assetName: 'Mekanism179',
    imageUrl: getMediaUrl('/mek-images/150px/ki1-jg2-cd2.webp'),
    rarityRank: 1916,
    headVariation: 'Reels',
    bodyVariation: 'Tux',
    itemVariation: 'Cannon',
  },
  {
    assetId: 'demo_mek_2',
    policyId: 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3',
    assetName: 'Mekanism2922',
    imageUrl: getMediaUrl('/mek-images/150px/bc6-cb1-of2.webp'),
    rarityRank: 554,
    headVariation: 'Turret',
    bodyVariation: 'Robot',
    itemVariation: 'Broadcast',
  },
  {
    assetId: 'demo_mek_3',
    policyId: 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3',
    assetName: 'Mekanism3972',
    imageUrl: getMediaUrl('/mek-images/150px/jx1-bf3-eh1.webp'),
    rarityRank: 1215,
    headVariation: 'Rolleiflex',
    bodyVariation: 'Head',
    itemVariation: 'Mini Me',
  },
  {
    assetId: 'demo_mek_4',
    policyId: 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3',
    assetName: 'Mekanism795',
    imageUrl: getMediaUrl('/mek-images/150px/jx2-jg2-nm1.webp'),
    rarityRank: 1265,
    headVariation: 'Reels',
    bodyVariation: 'Head',
    itemVariation: 'Nothing',
  },
  {
    assetId: 'demo_mek_5',
    policyId: 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3',
    assetName: 'Mekanism2685',
    imageUrl: getMediaUrl('/mek-images/150px/bc5-ee1-ap1.webp'),
    rarityRank: 1753,
    headVariation: 'Security',
    bodyVariation: 'Robot',
    itemVariation: 'Wings',
  },
];

// Phase II: Gold balance is on users table, income comes from Job Slots
const DEMO_GOLD_DATA = {
  walletAddress: DEMO_WALLET_ADDRESS,
  companyName: 'Demo Industries',
  isBlockchainVerified: true,
  ownedMeks: DEMO_MEKS,
  gold: 1250.75, // Current spendable balance (was accumulatedGold)
  createdAt: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
  lastActiveTime: Date.now() - (5 * 60 * 1000), // 5 minutes ago
};

interface DemoWalletContextType {
  isDemo: boolean;
  walletAddress: string | null;
  isConnected: boolean;
  goldData: typeof DEMO_GOLD_DATA | null;
  meks: typeof DEMO_MEKS;
}

const DemoWalletContext = createContext<DemoWalletContextType | null>(null);

export function DemoWalletProvider({ children }: { children: ReactNode }) {
  const value: DemoWalletContextType = {
    isDemo: true,
    walletAddress: DEMO_WALLET_ADDRESS,
    isConnected: true,
    goldData: DEMO_GOLD_DATA,
    meks: DEMO_MEKS,
  };

  return (
    <DemoWalletContext.Provider value={value}>
      {children}
    </DemoWalletContext.Provider>
  );
}

export function useDemoWallet() {
  const context = useContext(DemoWalletContext);
  if (!context) {
    throw new Error('useDemoWallet must be used within DemoWalletProvider');
  }
  return context;
}

// Hook to check if we're in demo mode
export function useIsDemoMode() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === 'true';
}
