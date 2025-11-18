/**
 * Sturgeon (Production) Database - READ ONLY Client
 *
 * 🚨 CRITICAL SAFETY RULES:
 * - This client is for MONITORING ONLY
 * - NO mutations allowed (no useMutation)
 * - NO actions allowed (no useAction)
 * - ONLY queries (useQuery for reading data)
 * - Used in admin panels to view real production player data
 *
 * Database: fabulous-sturgeon-691 (Production)
 * Contains: Real user data, 36+ active players
 * Purpose: Read-only monitoring from localhost
 */

import { ConvexReactClient } from "convex/react";

// Verify Sturgeon URL is configured
const sturgeonUrl = process.env.NEXT_PUBLIC_STURGEON_URL;

if (!sturgeonUrl) {
  console.error('[STURGEON CLIENT] NEXT_PUBLIC_STURGEON_URL not configured in .env.local');
}

// Create read-only client for production monitoring
export const sturgeonClient = new ConvexReactClient(sturgeonUrl || '');

// Log client creation (only in development)
if (process.env.NODE_ENV === 'development' && sturgeonUrl) {
  console.log('[STURGEON CLIENT] Read-only client initialized for production monitoring');
  console.log('[STURGEON CLIENT] Database:', sturgeonUrl);
  console.log('[STURGEON CLIENT] ⚠️ READ ONLY MODE - No mutations allowed');
}
