'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Mock wallet data for demo mode
const DEMO_WALLET_ADDRESS = 'stake1demo_test_wallet_for_ui_testing_only';

const DEMO_MEKS = [
  {
    assetId: 'demo_mek_1',
    policyId: 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3',
    assetName: 'Mekanism179',
    imageUrl: '/mek-images/150px/ki1-jg2-cd2.webp',
    goldPerHour: 6.45,
    rarityRank: 1916,
    headVariation: 'Reels',
    bodyVariation: 'Tux',
    itemVariation: 'Cannon',
    baseGoldPerHour: 6.45,
    currentLevel: 3,
    levelBoostPercent: 20,
    levelBoostAmount: 1.29,
    effectiveGoldPerHour: 7.74,
  },
  {
    assetId: 'demo_mek_2',
    policyId: 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3',
    assetName: 'Mekanism2922',
    imageUrl: '/mek-images/150px/bc6-cb1-of2.webp',
    goldPerHour: 21.81,
    rarityRank: 554,
    headVariation: 'Turret',
    bodyVariation: 'Robot',
    itemVariation: 'Broadcast',
    baseGoldPerHour: 21.81,
    currentLevel: 5,
    levelBoostPercent: 40,
    levelBoostAmount: 8.72,
    effectiveGoldPerHour: 30.53,
  },
  {
    assetId: 'demo_mek_3',
    policyId: 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3',
    assetName: 'Mekanism3972',
    imageUrl: '/mek-images/150px/jx1-bf3-eh1.webp',
    goldPerHour: 12.07,
    rarityRank: 1215,
    headVariation: 'Rolleiflex',
    bodyVariation: 'Head',
    itemVariation: 'Mini Me',
    baseGoldPerHour: 12.07,
    currentLevel: 2,
    levelBoostPercent: 10,
    levelBoostAmount: 1.21,
    effectiveGoldPerHour: 13.28,
  },
  {
    assetId: 'demo_mek_4',
    policyId: 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3',
    assetName: 'Mekanism795',
    imageUrl: '/mek-images/150px/jx2-jg2-nm1.webp',
    goldPerHour: 11.55,
    rarityRank: 1265,
    headVariation: 'Reels',
    bodyVariation: 'Head',
    itemVariation: 'Nothing',
    baseGoldPerHour: 11.55,
    currentLevel: 1,
    levelBoostPercent: 0,
    levelBoostAmount: 0,
    effectiveGoldPerHour: 11.55,
  },
  {
    assetId: 'demo_mek_5',
    policyId: 'ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e3',
    assetName: 'Mekanism2685',
    imageUrl: '/mek-images/150px/bc5-ee1-ap1.webp',
    goldPerHour: 7.46,
    rarityRank: 1753,
    headVariation: 'Security',
    bodyVariation: 'Robot',
    itemVariation: 'Wings',
    baseGoldPerHour: 7.46,
    currentLevel: 1,
    levelBoostPercent: 0,
    levelBoostAmount: 0,
    effectiveGoldPerHour: 7.46,
  },
];

const DEMO_GOLD_DATA = {
  walletAddress: DEMO_WALLET_ADDRESS,
  companyName: 'Demo Industries',
  isBlockchainVerified: true,
  ownedMeks: DEMO_MEKS,
  totalGoldPerHour: 70.56,
  baseGoldPerHour: 59.34,
  boostGoldPerHour: 11.22,
  accumulatedGold: 1250.75,
  totalCumulativeGold: 8943.22,
  totalGoldSpentOnUpgrades: 500.0,
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
