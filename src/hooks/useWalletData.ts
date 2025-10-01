'use client';

import { useContext } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
// @ts-ignore - Context might not exist yet
import { DemoWalletContext } from '@/contexts/DemoWalletContext';

/**
 * Universal hook that returns wallet data in both demo and production mode
 * Automatically detects demo mode and returns mock data
 */
export function useWalletData(walletAddress?: string | null) {
  // Try to get demo context (will be null if not in demo mode)
  const demoContext = useContext(DemoWalletContext as any);

  // Real data query (only runs if not in demo mode)
  const realGoldData = useQuery(
    api.goldMining.getGoldMiningData,
    !demoContext && walletAddress ? { walletAddress } : 'skip'
  );

  // Return demo data if in demo mode, otherwise real data
  if (demoContext) {
    return {
      isDemo: true,
      isLoading: false,
      data: demoContext.goldData,
      meks: demoContext.meks,
      walletAddress: demoContext.walletAddress,
    };
  }

  return {
    isDemo: false,
    isLoading: realGoldData === undefined,
    data: realGoldData,
    meks: realGoldData?.ownedMeks || [],
    walletAddress: walletAddress,
  };
}
