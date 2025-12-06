/**
 * sturgeonClient - SIMPLIFIED FOR SINGLE DATABASE
 *
 * Previously this created a separate ConvexReactClient for the Sturgeon (production)
 * database. Now that we use a single database, this just exports the main client
 * for backwards compatibility with components that still import sturgeonClient.
 *
 * The main NEXT_PUBLIC_CONVEX_URL now points to Sturgeon (fabulous-sturgeon-691),
 * so window.convex IS the Sturgeon client.
 */

import { ConvexReactClient } from 'convex/react';

// For backwards compatibility, sturgeonClient references the main Convex client
// which now points to Sturgeon via NEXT_PUBLIC_CONVEX_URL in .env.local
export const sturgeonClient: ConvexReactClient | null =
  typeof window !== 'undefined' ? window.convex : null;

// Log status in development
if (process.env.NODE_ENV === 'development') {
  console.log('[STURGEON CLIENT] Single database mode - using main Convex client');
}
