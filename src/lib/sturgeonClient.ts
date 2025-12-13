/**
 * Sturgeon (Production) Database Clients
 *
 * Database: fabulous-sturgeon-691 (Production)
 * Contains: Real user data, 36+ active players
 *
 * Two clients are available:
 * 1. sturgeonClient (ConvexReactClient) - For React hooks and subscriptions
 * 2. sturgeonHttpClient (ConvexHttpClient) - For direct mutations/queries outside React context
 *
 * Use sturgeonHttpClient for:
 * - NFT reservations from localhost (to avoid Trout/Sturgeon mismatch)
 * - Any mutation that needs to go to production from localhost
 *
 * Use sturgeonClient for:
 * - React hooks (useQuery with production data)
 * - Admin panel monitoring
 */

import { ConvexReactClient } from "convex/react";
import { ConvexHttpClient } from "convex/browser";

// Verify Sturgeon URL is configured
const sturgeonUrl = process.env.NEXT_PUBLIC_STURGEON_URL;
console.log('[🎮STURGEON-CLIENT] Initializing with URL:', sturgeonUrl ? 'configured' : 'MISSING');

// React client for hooks and subscriptions (null if not configured)
export const sturgeonClient = sturgeonUrl
  ? new ConvexReactClient(sturgeonUrl)
  : null;

// HTTP client for direct mutations/queries (null if not configured)
// This is safe to call outside React context and doesn't require WebSocket
export const sturgeonHttpClient = sturgeonUrl
  ? new ConvexHttpClient(sturgeonUrl)
  : null;

if (sturgeonClient) {
  console.log('[🎮STURGEON-CLIENT] React client created successfully');
} else {
  console.warn('[🎮STURGEON-CLIENT] React client is NULL - NEXT_PUBLIC_STURGEON_URL not set');
}

if (sturgeonHttpClient) {
  console.log('[🎮STURGEON-CLIENT] HTTP client created successfully');
}

// Silent initialization - logs removed to reduce console noise
// Enable DEBUG_STURGEON in console to see status: window.DEBUG_STURGEON = true
