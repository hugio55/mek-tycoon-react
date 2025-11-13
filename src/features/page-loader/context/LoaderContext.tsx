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
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LoaderContext = createContext<LoaderContextValue | null>(null);

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  // Detect environment and check appropriate loader setting
  const isBypassed = typeof window !== 'undefined' && (() => {
    const hostname = window.location.hostname;

    // Consider it localhost if it's:
    // - localhost or 127.0.0.1
    // - Any local IP address (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const isLocalhost = hostname === 'localhost' ||
                       hostname === '127.0.0.1' ||
                       hostname.includes('localhost') ||
                       hostname.startsWith('192.168.') ||
                       hostname.startsWith('10.') ||
                       /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

    // Check environment-specific setting
    const settingKey = isLocalhost ? 'disablePageLoaderLocalhost' : 'disablePageLoaderProduction';
    return localStorage.getItem(settingKey) === 'true';
  })();

  const [queries, setQueries] = useState<Map<string, QueryState>>(new Map());
  const [isWalletLoaded, setWalletLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(!isBypassed); // Start with false if bypassed
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

      // Only log first query registration
      if (newMap.size === 1) {
        console.log(`[PAGE LOADER] Query tracking started`);
      }
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

      // Only log when all queries complete
      const loadedCount = Array.from(newMap.values()).filter((q) => q.isLoaded).length;
      if (loadedCount === newMap.size) {
        console.log(`[PAGE LOADER] All queries loaded (${loadedCount}/${newMap.size})`);
      }

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
    isLoading,
    setIsLoading,
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
