'use client';

/**
 * DatabaseContext - SINGLE DATABASE MODE
 *
 * This context uses the single production database (Sturgeon) for all operations.
 * The interface is preserved for backwards compatibility with existing components.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';

// Single database type
type DatabaseType = 'sturgeon';

interface DatabaseContextValue {
  selectedDatabase: DatabaseType;
  setSelectedDatabase: (db: DatabaseType) => void;
  client: ConvexReactClient | null;
  canMutate: () => boolean;
  productionMutationsEnabled: boolean;
  setProductionMutationsEnabled: (enabled: boolean) => void;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  // Always 'sturgeon' now (single database)
  const [selectedDatabase] = useState<DatabaseType>('sturgeon');
  // Always enabled now (single database = full access)
  const [productionMutationsEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always use the main Convex client (now points to Sturgeon via .env.local)
  const getClient = () => {
    if (!mounted) return null;
    return window.convex;
  };

  // Always allow mutations (single database = no read-only mode needed)
  const canMutate = () => true;

  // No-op setters for backwards compatibility
  const setSelectedDatabase = () => {
    console.log('[DatabaseContext] Database selection is disabled - using single database (Sturgeon)');
  };

  const setProductionMutationsEnabled = () => {
    console.log('[DatabaseContext] Mutation toggle is disabled - always enabled in single database mode');
  };

  const value: DatabaseContextValue = {
    selectedDatabase,
    setSelectedDatabase,
    client: getClient(),
    canMutate,
    productionMutationsEnabled,
    setProductionMutationsEnabled,
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

    // Re-run query every 2 seconds for reactivity
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
  const { client } = useDatabaseContext();

  return async (args: any) => {
    if (!client) {
      throw new Error('Client not initialized');
    }

    return await client.mutation(mutation, args);
  };
}

/**
 * Custom hook to run actions that respect database selection
 * Usage: const runAction = useDatabaseAction(api.table.functionName);
 */
export function useDatabaseAction(action: any) {
  const { client } = useDatabaseContext();

  return async (args: any) => {
    if (!client) {
      throw new Error('Client not initialized');
    }

    return await client.action(action, args);
  };
}
