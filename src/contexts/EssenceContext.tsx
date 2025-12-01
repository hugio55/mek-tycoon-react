'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Type for the essence state returned by the query
interface EssenceBalance {
  _id: string;
  variationId: number;
  variationName: string;
  variationType: 'head' | 'body' | 'item';
  accumulatedAmount: number;
  lastUpdated: string;
}

interface PlayerEssenceState {
  balances: EssenceBalance[];
  essenceRates: Record<number, number>; // variationId → rate per day
  caps: Record<number, number>; // variationId → cap
  lastCalculationTime: number; // Timestamp of backend calculation
}

interface EssenceContextValue {
  playerEssenceState: PlayerEssenceState | null | undefined;
  isLoading: boolean;
}

// Create context with default values
const EssenceContext = createContext<EssenceContextValue | undefined>(undefined);

interface EssenceProviderProps {
  children: ReactNode;
  walletAddress: string | null;
}

/**
 * EssenceProvider - Single source of truth for essence data
 *
 * This provider makes ONE query to the backend and shares the data with all consumers.
 * This guarantees that all components (Distribution Lightbox, Admin Balances, etc.)
 * always see the exact same snapshot and stay perfectly synchronized.
 *
 * Pattern matches the gold system which works flawlessly.
 */
export function EssenceProvider({ children, walletAddress }: EssenceProviderProps) {
  // SINGLE useQuery - all consumers share this data
  const playerEssenceState = useQuery(
    api.essence.getPlayerEssenceState,
    walletAddress ? { walletAddress } : "skip"
  );

  const value: EssenceContextValue = {
    playerEssenceState,
    isLoading: playerEssenceState === undefined && walletAddress !== null
  };

  return (
    <EssenceContext.Provider value={value}>
      {children}
    </EssenceContext.Provider>
  );
}

/**
 * useEssence - Hook to consume essence context
 *
 * Use this hook in any component that needs essence data.
 * All components using this hook will receive the same data from the shared context.
 */
export function useEssence(): EssenceContextValue {
  const context = useContext(EssenceContext);

  if (context === undefined) {
    throw new Error('useEssence must be used within an EssenceProvider');
  }

  return context;
}
