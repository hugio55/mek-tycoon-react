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

// Create read-only client for production monitoring (null if not configured)
export const sturgeonClient = sturgeonUrl
  ? new ConvexReactClient(sturgeonUrl)
  : null;

// Silent initialization - logs removed to reduce console noise
// Enable DEBUG_STURGEON in console to see status: window.DEBUG_STURGEON = true
