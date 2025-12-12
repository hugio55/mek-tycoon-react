/**
 * MEK IDENTIFIER TYPES AND HELPERS
 * =================================
 *
 * UPDATED: December 2025 - mekNumber field added to meks table
 *
 * The meks table now has a dedicated `mekNumber` field (1-4000) that should
 * be used for all lookups. Use the `by_mek_number` index.
 *
 * IDENTIFIER TYPES:
 *
 * 1. mekNumber (NEW - PREFERRED): Integer 1-4000
 *    Stored in: meks.mekNumber field
 *    Use for: All database lookups via by_mek_number index
 *    Example: 2191
 *
 * 2. assetId (LEGACY - AVOID): May be short OR long format
 *    Short format: "1", "42", "2191" (just the number as string)
 *    Long format: Full Blockfrost unit (80+ chars)
 *    Problem: Format inconsistent, don't rely on it
 *
 * 3. BLOCKFROST assetId (unit): Full blockchain identifier
 *    Format: policyId (56 chars) + hex-encoded asset name
 *    Example: "ffa56051fda3d106a96f09c3d209d4bf24a117406fb813fb8b4548e34d656b616e69736d31393137"
 *    Use for: Blockchain verification only, NOT database lookups
 *
 * THE FIX: Always use mekNumber for database lookups:
 *   const mek = await ctx.db.query("meks")
 *     .withIndex("by_mek_number", q => q.eq("mekNumber", 2191))
 *     .first();
 */

// =============================================================================
// TYPE ALIASES (for documentation - both are strings at runtime)
// =============================================================================

/**
 * Database Mek ID - just the mek number as a string
 * Valid range: "1" to "4000"
 * Used for: All database queries on meks table
 */
export type DatabaseMekId = string;

/**
 * Blockfrost Asset ID (unit) - full blockchain identifier
 * Format: 56-char policy ID + variable-length hex asset name
 * Length: 80-150+ characters
 * Used for: Blockchain verification, wallet matching
 */
export type BlockfrostAssetId = string;

/**
 * Mek number - the actual NFT number (1-4000)
 * This is the source of truth - both ID formats derive from this
 */
export type MekNumber = number;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validates that a string is a valid database mek ID (number 1-4000)
 */
export function isValidDatabaseMekId(id: string): boolean {
  const num = parseInt(id, 10);
  return !isNaN(num) && num >= 1 && num <= 4000 && id === num.toString();
}

/**
 * Validates that a number is a valid mek number (1-4000)
 */
export function isValidMekNumber(num: number): boolean {
  return Number.isInteger(num) && num >= 1 && num <= 4000;
}

/**
 * Checks if a string looks like a Blockfrost asset ID (long hex string)
 * Note: This is a heuristic, not a guarantee
 */
export function looksLikeBlockfrostAssetId(id: string): boolean {
  return id.length > 50 && /^[a-f0-9]+$/i.test(id);
}

// =============================================================================
// CONVERSION HELPERS
// =============================================================================

/**
 * Convert mek number to database asset ID
 * This is the SAFE way to create an ID for database queries
 */
export function mekNumberToDatabaseId(mekNumber: number): DatabaseMekId {
  if (!isValidMekNumber(mekNumber)) {
    throw new Error(`Invalid mek number: ${mekNumber} (must be 1-4000)`);
  }
  return mekNumber.toString();
}

/**
 * Convert database asset ID to mek number
 */
export function databaseIdToMekNumber(databaseId: DatabaseMekId): MekNumber {
  const num = parseInt(databaseId, 10);
  if (!isValidMekNumber(num)) {
    throw new Error(`Invalid database mek ID: ${databaseId} (must be 1-4000)`);
  }
  return num;
}

/**
 * WARNING HELPER: Logs a warning if you're about to use the wrong ID format
 * Call this before database queries when you have a Blockfrost-sourced ID
 */
export function warnIfBlockfrostId(id: string, context: string): void {
  if (looksLikeBlockfrostAssetId(id)) {
    console.warn(
      `[MEK-ID-WARNING] ${context}: Received Blockfrost-style ID (${id.length} chars). ` +
      `Database expects mek number (1-4 chars). Did you mean to use mekNumber.toString()?`
    );
  }
}

// =============================================================================
// DOCUMENTATION
// =============================================================================

/**
 * QUICK REFERENCE - How to do database lookups from Blockfrost data:
 *
 * // You have a ParsedMek from Blockfrost with:
 * // - assetId: "ffa56051...4d656b616e69736d31393137" (WRONG for DB)
 * // - mekNumber: 1917 (USE THIS)
 *
 * // CORRECT:
 * const dbId = mekNumberToDatabaseId(parsedMek.mekNumber); // "1917"
 * const mek = await ctx.db.query("meks")
 *   .withIndex("by_asset_id", q => q.eq("assetId", dbId))
 *   .first();
 *
 * // OR simply:
 * const mek = await ctx.db.query("meks")
 *   .withIndex("by_asset_id", q => q.eq("assetId", parsedMek.mekNumber.toString()))
 *   .first();
 */
