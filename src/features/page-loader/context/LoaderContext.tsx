'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { TIMING } from '../config/constants';
import type { QueryState } from '../types';

interface LoaderContextValue {
  queries: Map<string, QueryState>;
  registerQuery: (id: string) => void;
  markQueryLoaded: (id: string) => void;
  getLoadedCount: () => number;
  getTotalCount: () => number;
  isWalletLoaded: boolean;
  setWalletLoaded: (loaded: boolean) => void;
  startTime: number;
}

const LoaderContext = createContext<LoaderContextValue | null>(null);

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [queries, setQueries] = useState<Map<string, QueryState>>(new Map());
  const [isWalletLoaded, setWalletLoaded] = useState(false);
  const startTimeRef = useRef(Date.now());

  const registerQuery = useCallback((id: string) => {
    setQueries((prev) => {
      if (prev.has(id)) return prev;

      const newMap = new Map(prev);
      const queryState: QueryState = {
        id,
        isLoaded: false,
        startTime: Date.now(),
        timeout: null,
      };

      const timeoutId = setTimeout(() => {
        console.log(`[PAGE LOADER] Query timeout: ${id}`);
        markQueryLoaded(id);
      }, TIMING.QUERY_TIMEOUT);

      queryState.timeout = timeoutId;
      newMap.set(id, queryState);

      console.log(`[PAGE LOADER] Query registered: ${id} (total: ${newMap.size})`);
      return newMap;
    });
  }, []);

  const markQueryLoaded = useCallback((id: string) => {
    setQueries((prev) => {
      const query = prev.get(id);
      if (!query || query.isLoaded) return prev;

      if (query.timeout) {
        clearTimeout(query.timeout);
      }

      const newMap = new Map(prev);
      newMap.set(id, { ...query, isLoaded: true, timeout: null });

      const loadedCount = Array.from(newMap.values()).filter((q) => q.isLoaded).length;
      console.log(`[PAGE LOADER] Query loaded: ${id} (${loadedCount}/${newMap.size})`);

      return newMap;
    });
  }, []);

  const getLoadedCount = useCallback(() => {
    return Array.from(queries.values()).filter((q) => q.isLoaded).length;
  }, [queries]);

  const getTotalCount = useCallback(() => {
    return queries.size;
  }, [queries]);

  useEffect(() => {
    return () => {
      queries.forEach((query) => {
        if (query.timeout) {
          clearTimeout(query.timeout);
        }
      });
    };
  }, [queries]);

  const value: LoaderContextValue = {
    queries,
    registerQuery,
    markQueryLoaded,
    getLoadedCount,
    getTotalCount,
    isWalletLoaded,
    setWalletLoaded,
    startTime: startTimeRef.current,
  };

  return <LoaderContext.Provider value={value}>{children}</LoaderContext.Provider>;
}

export function useLoaderContext() {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error('useLoaderContext must be used within LoaderProvider');
  }
  return context;
}

export function useTrackedQuery<T>(queryResult: T | undefined, queryId: string): T | undefined {
  const { registerQuery, markQueryLoaded } = useLoaderContext();
  const hasRegistered = useRef(false);
  const wasUndefined = useRef(queryResult === undefined);

  useEffect(() => {
    if (!hasRegistered.current) {
      registerQuery(queryId);
      hasRegistered.current = true;
    }
  }, [queryId, registerQuery]);

  useEffect(() => {
    if (wasUndefined.current && queryResult !== undefined) {
      markQueryLoaded(queryId);
      wasUndefined.current = false;
    }
  }, [queryResult, queryId, markQueryLoaded]);

  return queryResult;
}
