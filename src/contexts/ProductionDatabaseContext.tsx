'use client';

/**
 * Production Database Context
 *
 * This context ALWAYS uses Sturgeon (production) database.
 * Designed specifically for the NFT admin section where all data
 * is inherently production data (real sales, real whitelists, real eligibility).
 *
 * Safety Features:
 * - Read-only mode by default
 * - Mutations require explicit enablement
 * - All mutations should be wrapped with confirmation dialogs
 *
 * Database: fabulous-sturgeon-691 (Production)
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ConvexReactClient } from 'convex/react';
import { sturgeonClient } from '@/lib/sturgeonClient';

interface ProductionDatabaseContextValue {
  /** The Sturgeon (production) client - always production */
  client: ConvexReactClient | null;

  /** Whether the client is ready to use */
  isReady: boolean;

  /** Whether mutations are currently allowed */
  mutationsEnabled: boolean;

  /** Enable mutations (requires confirmation in UI) */
  enableMutations: () => void;

  /** Disable mutations (return to read-only mode) */
  disableMutations: () => void;

  /** Check if mutations are allowed before executing */
  canMutate: () => boolean;

  /** Execute a mutation with safety check */
  safeMutation: <T>(
    mutationFn: () => Promise<T>,
    options?: { skipConfirmation?: boolean }
  ) => Promise<T | null>;
}

const ProductionDatabaseContext = createContext<ProductionDatabaseContextValue | null>(null);

interface ProductionDatabaseProviderProps {
  children: ReactNode;
  /** Start with mutations enabled (default: false for safety) */
  defaultMutationsEnabled?: boolean;
}

export function ProductionDatabaseProvider({
  children,
  defaultMutationsEnabled = false
}: ProductionDatabaseProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [mutationsEnabled, setMutationsEnabled] = useState(defaultMutationsEnabled);

  useEffect(() => {
    setMounted(true);
  }, []);

  const enableMutations = useCallback(() => {
    setMutationsEnabled(true);
    console.log('[PRODUCTION DB] Mutations ENABLED - Be careful!');
  }, []);

  const disableMutations = useCallback(() => {
    setMutationsEnabled(false);
    console.log('[PRODUCTION DB] Mutations DISABLED - Read-only mode');
  }, []);

  const canMutate = useCallback(() => {
    return mutationsEnabled;
  }, [mutationsEnabled]);

  const safeMutation = useCallback(async <T,>(
    mutationFn: () => Promise<T>,
    options?: { skipConfirmation?: boolean }
  ): Promise<T | null> => {
    if (!mutationsEnabled) {
      console.warn('[PRODUCTION DB] Mutation blocked - mutations not enabled');
      return null;
    }

    try {
      return await mutationFn();
    } catch (error) {
      console.error('[PRODUCTION DB] Mutation failed:', error);
      throw error;
    }
  }, [mutationsEnabled]);

  const value: ProductionDatabaseContextValue = {
    client: mounted ? sturgeonClient : null,
    isReady: mounted && sturgeonClient !== null,
    mutationsEnabled,
    enableMutations,
    disableMutations,
    canMutate,
    safeMutation,
  };

  return (
    <ProductionDatabaseContext.Provider value={value}>
      {children}
    </ProductionDatabaseContext.Provider>
  );
}

/**
 * Hook to access the production database context
 */
export function useProductionDatabase() {
  const context = useContext(ProductionDatabaseContext);
  if (!context) {
    throw new Error('useProductionDatabase must be used within ProductionDatabaseProvider');
  }
  return context;
}

/**
 * Custom hook to run a query against production database
 * Similar to useQuery but works with the production client
 */
export function useProductionQuery<T>(
  queryFn: (client: ConvexReactClient) => Promise<T>,
  deps: React.DependencyList = []
): { data: T | undefined; isLoading: boolean; error: Error | null } {
  const { client, isReady } = useProductionDatabase();
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isReady || !client) {
      setIsLoading(true);
      return;
    }

    let cancelled = false;

    const runQuery = async () => {
      try {
        setIsLoading(true);
        const result = await queryFn(client);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          console.error('[PRODUCTION QUERY] Error:', err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    runQuery();

    // Poll for updates every 3 seconds (since we can't use reactive useQuery)
    const interval = setInterval(runQuery, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, isReady, ...deps]);

  return { data, isLoading, error };
}

/**
 * Custom hook to create a mutation function for production database
 */
export function useProductionMutation<TArgs, TResult>(
  mutationApi: any
): {
  mutate: (args: TArgs) => Promise<TResult | null>;
  isAllowed: boolean;
} {
  const { client, canMutate, mutationsEnabled } = useProductionDatabase();

  const mutate = useCallback(async (args: TArgs): Promise<TResult | null> => {
    if (!client) {
      console.error('[PRODUCTION MUTATION] Client not ready');
      return null;
    }

    if (!canMutate()) {
      console.warn('[PRODUCTION MUTATION] Mutations not enabled - action blocked');
      alert('Mutations are disabled. Enable mutations first to make changes to production data.');
      return null;
    }

    try {
      return await client.mutation(mutationApi, args);
    } catch (error) {
      console.error('[PRODUCTION MUTATION] Failed:', error);
      throw error;
    }
  }, [client, canMutate, mutationApi]);

  return {
    mutate,
    isAllowed: mutationsEnabled,
  };
}
