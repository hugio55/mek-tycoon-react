'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { sturgeonClient } from '@/lib/sturgeonClient';

type DatabaseType = 'trout' | 'sturgeon';

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
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseType>('trout');
  const [productionMutationsEnabled, setProductionMutationsEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getClient = () => {
    if (!mounted) return null;
    return selectedDatabase === 'sturgeon' ? sturgeonClient : window.convex;
  };

  const canMutate = () => {
    if (selectedDatabase === 'trout') return true;
    return productionMutationsEnabled;
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
