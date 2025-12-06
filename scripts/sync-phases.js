/**
 * ============================================================
 * DEPRECATED - DO NOT USE
 * ============================================================
 * This script was used to sync Phase Cards from Trout (dev) to Sturgeon (production)
 * when we had two separate databases.
 *
 * As of December 2025, we use a UNIFIED SINGLE DATABASE (Sturgeon).
 * There is no longer a separate dev database to sync from.
 *
 * This file is kept for historical reference only.
 * ============================================================
 */

console.error('ERROR: This script is DEPRECATED.');
console.error('');
console.error('As of December 2025, Mek Tycoon uses a UNIFIED database (Sturgeon).');
console.error('There is no separate Trout (dev) database to sync from.');
console.error('');
console.error('All changes to the /convex folder are automatically synced to production');
console.error('when running npm run dev:all or npx convex dev.');
console.error('');
process.exit(1);

/*
 * ORIGINAL CODE (commented out for reference):
 *
 * const { ConvexHttpClient } = require('convex/browser');
 * const api = require('../convex/_generated/api').api;
 *
 * const TROUT_URL = 'https://wry-trout-962.convex.cloud';  // DEPRECATED
 * const STURGEON_URL = 'https://fabulous-sturgeon-691.convex.cloud';
 *
 * async function syncPhaseCards() {
 *   const trout = new ConvexHttpClient(TROUT_URL);
 *   const sturgeon = new ConvexHttpClient(STURGEON_URL);
 *   // ... sync logic ...
 * }
 */
