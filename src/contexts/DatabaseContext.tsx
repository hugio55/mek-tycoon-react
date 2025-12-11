'use client';

/**
 * DatabaseContext - DUAL DATABASE MODE with Smart Environment Detection
 *
 * Detects which databases are available based on environment URLs:
 * - On localhost: CONVEX_URL = Trout, STURGEON_URL = Sturgeon (both available)
 * - On Vercel: CONVEX_URL = Sturgeon, STURGEON_URL = undefined (Sturgeon only)
 *
 * Used by Player Management to toggle between staging and production views.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexHttpClient } from 'convex/browser';
import { sturgeonClient } from '@/lib/sturgeonClient';

type DatabaseType = 'trout' | 'sturgeon';

interface DatabaseContextValue {
  // Currently selected database
  selectedDatabase: DatabaseType;
  setSelectedDatabase: (db: DatabaseType) => void;

  // The active client based on selection
  client: ConvexReactClient | null;

  // Mutation controls
  canMutate: () => boolean;
  productionMutationsEnabled: boolean;
  setProductionMutationsEnabled: (enabled: boolean) => void;

  // Environment detection - which databases are available
  hasTrout: boolean;
  hasSturgeon: boolean;
  hasDualDatabase: boolean;

  // Database labels for UI
  troutLabel: string;
  sturgeonLabel: string;

  // HTTP clients for direct queries (useful for some components)
  troutHttpClient: ConvexHttpClient | null;
  sturgeonHttpClient: ConvexHttpClient | null;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [productionMutationsEnabled, setProductionMutationsEnabled] = useState(false);

  // Environment URLs
  const mainUrl = process.env.NEXT_PUBLIC_CONVEX_URL || '';
  const secondaryUrl = process.env.NEXT_PUBLIC_STURGEON_URL || '';

  // Detect which database the main URL points to
  const mainIsSturgeon = mainUrl.includes('sturgeon');
  const mainIsTrout = mainUrl.includes('trout');

  // Determine what's available
  // Trout is available if: main URL is Trout, OR secondary URL contains Trout
  const hasTrout = mainIsTrout || secondaryUrl.includes('trout');
  // Sturgeon is available if: main URL is Sturgeon, OR secondary URL contains Sturgeon
  const hasSturgeon = mainIsSturgeon || secondaryUrl.includes('sturgeon');
  const hasDualDatabase = hasTrout && hasSturgeon;

  // Default to Trout if available (safer), otherwise Sturgeon
  const defaultDatabase: DatabaseType = hasTrout ? 'trout' : 'sturgeon';
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseType>(defaultDatabase);

  // Create HTTP clients for both databases (if available)
  const [troutHttpClient] = useState<ConvexHttpClient | null>(() => {
    if (mainIsTrout) return new ConvexHttpClient(mainUrl);
    if (secondaryUrl.includes('trout')) return new ConvexHttpClient(secondaryUrl);
    return null;
  });

  const [sturgeonHttpClient] = useState<ConvexHttpClient | null>(() => {
    if (mainIsSturgeon) return new ConvexHttpClient(mainUrl);
    if (secondaryUrl.includes('sturgeon')) return new ConvexHttpClient(secondaryUrl);
    return null;
  });

  // Database labels for UI
  const troutDeployment = mainIsTrout
    ? mainUrl.split('//')[1]?.split('.')[0] || 'trout'
    : secondaryUrl.includes('trout')
      ? secondaryUrl.split('//')[1]?.split('.')[0] || 'trout'
      : 'not-configured';

  const sturgeonDeployment = mainIsSturgeon
    ? mainUrl.split('//')[1]?.split('.')[0] || 'sturgeon'
    : secondaryUrl.includes('sturgeon')
      ? secondaryUrl.split('//')[1]?.split('.')[0] || 'sturgeon'
      : 'not-configured';

  const troutLabel = `Staging (${troutDeployment})`;
  const sturgeonLabel = `Production (${sturgeonDeployment})`;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent selecting unavailable database
  useEffect(() => {
    if (selectedDatabase === 'trout' && !hasTrout) {
      setSelectedDatabase('sturgeon');
    }
    if (selectedDatabase === 'sturgeon' && !hasSturgeon) {
      setSelectedDatabase('trout');
    }
  }, [selectedDatabase, hasTrout, hasSturgeon]);

  const getClient = (): ConvexReactClient | null => {
    if (!mounted) {
      console.log('[🎮DATABASE-CTX] Not mounted yet, returning null client');
      return null;
    }

    if (selectedDatabase === 'sturgeon') {
      // If main URL is Sturgeon, use window.convex
      // Otherwise use sturgeonClient (from secondary URL)
      const client = mainIsSturgeon ? (window as any).convex : sturgeonClient;
      console.log('[🎮DATABASE-CTX] Returning Sturgeon client:', {
        hasClient: !!client,
        mainIsSturgeon,
        hasSturgeonClient: !!sturgeonClient
      });
      return client;
    } else {
      // If main URL is Trout, use window.convex
      // Otherwise we'd need a troutClient (but this case shouldn't happen in practice)
      const client = mainIsTrout ? (window as any).convex : null;
      console.log('[🎮DATABASE-CTX] Returning Trout client:', { hasClient: !!client, mainIsTrout });
      return client;
    }
  };

  const canMutate = () => {
    // Trout (staging) = always allowed
    if (selectedDatabase === 'trout') return true;
    // Sturgeon (production) = only if explicitly enabled
    return productionMutationsEnabled;
  };

  const value: DatabaseContextValue = {
    selectedDatabase,
    setSelectedDatabase,
    client: getClient(),
    canMutate,
    productionMutationsEnabled,
    setProductionMutationsEnabled,
    hasTrout,
    hasSturgeon,
    hasDualDatabase,
    troutLabel,
    sturgeonLabel,
    troutHttpClient,
    sturgeonHttpClient,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseContext() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within DatabaseProvider');
  }
  return context;
}

/**
 * Custom hook to replace useQuery that respects database selection
 * Usage: const data = useDatabaseQuery(api.table.functionName, args);
 */
export function useDatabaseQuery<T>(
  query: any,
  args?: any
): T | undefined {
  const { client } = useDatabaseContext();
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!client) return;

    let cancelled = false;

    const runQuery = async () => {
      try {
        const result = await client.query(query, args || {});
        if (!cancelled) {
          setData(result as T);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          console.error('[DatabaseQuery] Error:', err);
        }
      }
    };

    runQuery();

    // Re-run query every 2 seconds for reactivity (Convex would normally handle this)
    const interval = setInterval(runQuery, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [client, query, JSON.stringify(args)]);

  if (error) throw error;
  return data;
}

/**
 * Custom hook to replace useMutation that respects database selection
 * Usage: const mutate = useDatabaseMutation(api.table.functionName);
 */
export function useDatabaseMutation(mutation: any) {
  const { client, canMutate } = useDatabaseContext();

  return async (args: any) => {
    if (!client) {
      throw new Error('Client not initialized');
    }

    if (!canMutate()) {
      throw new Error('Mutations disabled in READ ONLY mode');
    }

    return await client.mutation(mutation, args);
  };
}

/**
 * Custom hook to run actions that respect database selection
 * Usage: const runAction = useDatabaseAction(api.table.functionName);
 */
export function useDatabaseAction(action: any) {
  const { client, canMutate } = useDatabaseContext();

  return async (args: any) => {
    if (!client) {
      throw new Error('Client not initialized');
    }

    if (!canMutate()) {
      throw new Error('Actions disabled in READ ONLY mode');
    }

    return await client.action(action, args);
  };
}

// ============================================================================
// PRODUCTION-ONLY CLAIM CHECKING
// ============================================================================
//
// IMPORTANT FOR FUTURE CLAUDE SESSIONS:
// This hook ALWAYS queries Production (Sturgeon) for claim status, regardless
// of which database the admin is currently viewing. This is intentional because:
// - Claims only happen on the live site (Production)
// - We need a single source of truth for "has this wallet ever claimed"
// - Even when viewing Staging players, claim status should reflect Production
// ============================================================================

/**
 * Hook to check claim status from Production database
 *
 * ALWAYS queries Production (Sturgeon) regardless of admin database selection.
 * Use this for the "Claimed Token" column in Player Management.
 */
export function useProductionClaimStatus(
  campaignId: string | null,
  stakeAddresses: string[]
) {
  const { sturgeonHttpClient } = useDatabaseContext();
  const [claimStatus, setClaimStatus] = useState<Record<string, { hasMinted: boolean; mintedAt?: number; nftNumber?: number }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sturgeonHttpClient || !campaignId || stakeAddresses.length === 0) {
      setClaimStatus({});
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchClaimStatus = async () => {
      try {
        // Wrap in Promise.resolve to ensure async errors are caught
        const result = await Promise.resolve(
          sturgeonHttpClient.query(
            "campaignMints:batchCheckMintStatus" as any,
            { campaignId, stakeAddresses }
          )
        ).catch((queryErr) => {
          // Silently handle query errors (function may not exist in production yet)
          console.warn("[useProductionClaimStatus] Query failed (function may not be deployed to production):", queryErr?.message || queryErr);
          return {};
        });

        if (!cancelled) {
          setClaimStatus(result || {});
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          // Non-fatal - just log and continue with empty status
          console.warn("[useProductionClaimStatus] Error (non-fatal):", err?.message || err);
          setClaimStatus({});
          setError(null); // Don't show error to user - this is optional functionality
          setLoading(false);
        }
      }
    };

    fetchClaimStatus();

    // Refresh every 30 seconds (claims don't change often)
    const interval = setInterval(fetchClaimStatus, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sturgeonHttpClient, campaignId, JSON.stringify(stakeAddresses)]);

  return { claimStatus, loading, error };
}
