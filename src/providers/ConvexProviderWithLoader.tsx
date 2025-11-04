'use client';

import React, { useEffect, useRef, ReactNode } from 'react';
import {
  ConvexProvider,
  ConvexReactClient,
  useQuery as convexUseQuery,
  usePaginatedQuery as convexUsePaginatedQuery,
  useMutation as convexUseMutation,
} from 'convex/react';
import type { FunctionReference, OptionalRestArgs } from 'convex/server';
import { useLoaderContext } from '@/features/page-loader';

// Extended options that include our custom skipLoader flag
interface QueryOptions {
  skipLoader?: boolean;
}

// Track query IDs globally to ensure uniqueness
let queryIdCounter = 0;

// Custom useQuery hook that auto-tracks queries
function useQueryWithTracking<Query extends FunctionReference<'query'>>(
  query: Query,
  ...args: OptionalRestArgs<Query>
): any {
  const loaderContext = useLoaderContext();
  const queryIdRef = useRef<string | null>(null);
  const hasRegisteredRef = useRef(false);
  const wasUndefinedRef = useRef(true);

  // Check if last arg is our options object with skipLoader
  const lastArg = args[args.length - 1];
  const skipLoader = typeof lastArg === 'object' && lastArg !== null && 'skipLoader' in lastArg
    ? (lastArg as any).skipLoader
    : false;

  // Remove skipLoader from args before passing to Convex
  const convexArgs = skipLoader && typeof lastArg === 'object' && lastArg !== null
    ? args.slice(0, -1)
    : args;

  // Generate unique query ID on first render
  if (!queryIdRef.current) {
    queryIdCounter++;
    const queryName = query._meta?.name || 'unknown';
    queryIdRef.current = `${queryName}-${queryIdCounter}`;
  }

  const queryId = queryIdRef.current;

  // Register query on mount (if not skipping loader)
  useEffect(() => {
    if (!skipLoader && !hasRegisteredRef.current && loaderContext) {
      loaderContext.registerQuery(queryId);
      hasRegisteredRef.current = true;
    }
  }, [queryId, skipLoader, loaderContext]);

  // Call original Convex useQuery
  const result = convexUseQuery(query, ...(convexArgs as any));

  // Mark query as loaded when result becomes available
  useEffect(() => {
    if (!skipLoader && loaderContext && wasUndefinedRef.current && result !== undefined) {
      loaderContext.markQueryLoaded(queryId);
      wasUndefinedRef.current = false;
    }
  }, [result, queryId, skipLoader, loaderContext]);

  return result;
}

// Custom usePaginatedQuery hook that auto-tracks queries
function usePaginatedQueryWithTracking<Query extends FunctionReference<'query'>>(
  query: Query,
  args: any,
  options?: any
): any {
  const loaderContext = useLoaderContext();
  const queryIdRef = useRef<string | null>(null);
  const hasRegisteredRef = useRef(false);
  const wasUndefinedRef = useRef(true);

  // Check for skipLoader in options
  const skipLoader = options?.skipLoader || false;

  // Remove skipLoader from options before passing to Convex
  const convexOptions = options ? { ...options } : {};
  delete convexOptions.skipLoader;

  // Generate unique query ID on first render
  if (!queryIdRef.current) {
    queryIdCounter++;
    const queryName = query._meta?.name || 'unknown';
    queryIdRef.current = `${queryName}-paginated-${queryIdCounter}`;
  }

  const queryId = queryIdRef.current;

  // Register query on mount (if not skipping loader)
  useEffect(() => {
    if (!skipLoader && !hasRegisteredRef.current && loaderContext) {
      loaderContext.registerQuery(queryId);
      hasRegisteredRef.current = true;
    }
  }, [queryId, skipLoader, loaderContext]);

  // Call original Convex usePaginatedQuery
  const result = convexUsePaginatedQuery(query, args, convexOptions);

  // Mark query as loaded when results become available
  useEffect(() => {
    if (!skipLoader && loaderContext && wasUndefinedRef.current && result.results !== undefined) {
      loaderContext.markQueryLoaded(queryId);
      wasUndefinedRef.current = false;
    }
  }, [result.results, queryId, skipLoader, loaderContext]);

  return result;
}

// Export our custom hooks to replace Convex's default exports
export {
  useQueryWithTracking as useQuery,
  usePaginatedQueryWithTracking as usePaginatedQuery,
  convexUseMutation as useMutation  // Pass-through for mutations (no tracking needed)
};

// ConvexProvider wrapper that provides the client
interface ConvexProviderWithLoaderProps {
  client: ConvexReactClient;
  children: ReactNode;
}

export function ConvexProviderWithLoader({ client, children }: ConvexProviderWithLoaderProps) {
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
