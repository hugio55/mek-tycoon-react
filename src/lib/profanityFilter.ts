/**
 * Profanity Filter for Corporation Names and Mek Names
 *
 * This filter checks names against a blocklist of inappropriate words.
 * Used for both frontend validation (real-time feedback) and backend validation (server-side check).
 *
 * Enhanced with:
 * - Comprehensive leetspeak detection (based on research from pc.net/resources/leet_sheet)
 * - Spacing trick detection ("f u c k" → "fuck")
 * - Only allows standard keyboard characters (a-z, 0-9, spaces)
 * - Reserved names to prevent impersonation
 * - Violence/terrorism term blocking
 * - Repeating character limits
 * - Protected name patterns (Wren)
 */

// ═══════════════════════════════════════════════════════════════════════════
// RESERVED NAMES - Prevent impersonation of staff/official accounts
// ═══════════════════════════════════════════════════════════════════════════

// These are blocked as exact matches OR as part of the name (case insensitive)
const RESERVED_NAMES: string[] = [
  // Staff/Authority
  'admin', 'administrator', 'moderator', 'mod', 'support',
  'developer', 'dev', 'staff', 'team',
  'official', 'verified',
  'founder', 'owner', 'ceo',

  // Brand protection
  'mektycoon', 'mek tycoon',
  'overexposed',

  // System terms
  'system', 'bot', 'server',
];

// ═══════════════════════════════════════════════════════════════════════════
// PROTECTED NAMES - Special protection (blocked unless truly in middle of word)
// ═══════════════════════════════════════════════════════════════════════════

const PROTECTED_NAMES: string[] = [
  'wren',
];

// ═══════════════════════════════════════════════════════════════════════════
// PROFANITY BLOCKLIST - Substring matches
// ═══════════════════════════════════════════════════════════════════════════

const PROFANITY_BLOCKLIST: string[] = [
  // Common profanity
  'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'crap', 'piss', 'dick', 'cock',
  'pussy', 'cunt', 'whore', 'slut', 'fag', 'faggot', 'nigger', 'nigga', 'retard',
  'retarded', 'kike', 'spic', 'chink', 'gook', 'wetback', 'beaner', 'cracker',
  'honky', 'dyke', 'tranny', 'shemale',

  // Variations and common bypasses (these catch leetspeak AFTER deobfuscation)
  'fck', 'fuk', 'fuq', 'phuck', 'phuk', 'fvck', 'fcuk', 'biatch', 'biotch',
  'azz', 'a55', 'azs', 'btch', 'b1tch', 'cnt', 'dck', 'sht', 'shtty',
  'pnis', 'pnus', 'pen1s', 'vag', 'tits', 'titty', 'titties', 'boob', 'boobs',

  // Sexual terms
  'porn', 'xxx', 'anal', 'blowjob', 'handjob', 'dildo', 'vibrator',
  'orgasm', 'masturbat', 'jerkoff', 'cumshot', 'creampie', 'gangbang',
  'hentai', 'bdsm', 'fetish', 'erotic', 'nude', 'naked', 'horny',

  // Offensive combinations
  'dumbass', 'jackass', 'asshole', 'asswipe', 'dickhead', 'shithead',
  'fuckface', 'motherfucker', 'cocksucker', 'bullshit', 'horseshit',
  'dipshit', 'nutjob', 'twat', 'wanker', 'tosser', 'bellend',

  // Hate speech related
  'nazi', 'hitler', 'kkk', 'holocaust', 'genocide',

  // Historical figures/dictators
  'stalin', 'mussolini', 'bin laden', 'binladen',

  // Terrorism/Violence
  'isis', 'isil', 'taliban', 'alqaeda', 'al qaeda', 'jihad', 'jihadist',
  'terrorist', 'terrorism',

  // School violence references
  'columbine', 'school shoot', 'schoolshoot', 'mass shoot', 'massshoot',
  'sandy hook', 'sandyhook', 'parkland',

  // Drug references
  'cocaine', 'heroin', 'meth', 'crack',
];

// Words that are blocked only as exact matches (not substrings)
// These might appear as legitimate parts of other words
const EXACT_MATCH_BLOCKLIST: string[] = [
  'ass', 'cum', 'sex', 'gay', 'nut', 'hoe', 'ho', 'fuk', 'suk', 'fuc',
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a name contains only allowed characters (a-z, A-Z, 0-9, spaces)
 * This blocks Unicode homoglyphs and special characters
 */
function hasOnlyAllowedCharacters(name: string): boolean {
  return /^[a-zA-Z0-9\s]+$/.test(name);
}

/**
 * Check if name contains at least one letter (prevents "12345" style names)
 */
function hasAtLeastOneLetter(name: string): boolean {
  return /[a-zA-Z]/.test(name);
}

/**
 * Check for excessive repeating characters (e.g., "aaaaa" or "xxxxx")
 * Returns true if 4+ of the same character in a row
 */
function hasExcessiveRepeats(name: string): boolean {
  return /(.)\1{3,}/.test(name);
}

/**
 * Remove all spacing and separators for bypass detection
 * Catches tricks like "f u c k" or "f.u.c.k" or "f-u-c-k"
 */
function removeSpacingTricks(name: string): string {
  return name.replace(/[\s\-_.,!?*#~`'"():;\[\]{}|\\/<>]+/g, '');
}

/**
 * Apply comprehensive leetspeak deobfuscation
 * Based on research from pc.net/resources/leet_sheet and gamehouse.com/blog/leet-speak-cheat-sheet
 */
function deobfuscateLeetspeak(name: string): string {
  return name
    // Numbers → letters (most common substitutions)
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/2/g, 'z')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/6/g, 'g')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/9/g, 'g')
    // Symbols → letters (keyboard accessible)
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i')
    .replace(/\|/g, 'i')
    .replace(/\+/g, 't')
    .replace(/#/g, 'h')
    .replace(/</g, 'c')
    .replace(/\(/g, 'c')
    .replace(/\[/g, 'c')
    .replace(/\{/g, 'c')
    .replace(/\)/g, 'd')
    .replace(/\]/g, 'd')
    .replace(/\}/g, 'd')
    .replace(/\^/g, 'a')
    .replace(/~/g, 'n')
    .replace(/`/g, '')
    .replace(/'/g, '')
    .replace(/"/g, '')
    .replace(/\*/g, '');  // Remove asterisks (for f*ck, sh*t, etc.)
}

/**
 * Check if name contains a reserved name pattern
 */
function containsReservedName(name: string): { blocked: boolean; reason?: string } {
  const lowerName = name.toLowerCase();
  const spacelessLower = lowerName.replace(/\s+/g, '');

  for (const reserved of RESERVED_NAMES) {
    const spacelessReserved = reserved.replace(/\s+/g, '');

    // Check if the name contains the reserved word
    if (lowerName.includes(reserved) || spacelessLower.includes(spacelessReserved)) {
      return {
        blocked: true,
        reason: 'This name is reserved and cannot be used'
      };
    }
  }

  return { blocked: false };
}

/**
 * Check if name contains a protected name (like "Wren")
 * Blocks if the protected name appears at start, end, or as a standalone word
 * Allows if it's truly embedded in the middle of another word (rare)
 */
function containsProtectedName(name: string): { blocked: boolean; reason?: string } {
  const lowerName = name.toLowerCase();
  const words = lowerName.split(/\s+/);

  for (const protected_name of PROTECTED_NAMES) {
    // Check each word in the name
    for (const word of words) {
      // Exact match - blocked
      if (word === protected_name) {
        return {
          blocked: true,
          reason: 'This name is protected and cannot be used'
        };
      }

      // Starts with protected name - blocked (e.g., "WrenMaster")
      if (word.startsWith(protected_name)) {
        return {
          blocked: true,
          reason: 'This name is protected and cannot be used'
        };
      }

      // Ends with protected name - blocked (e.g., "CoolWren")
      if (word.endsWith(protected_name)) {
        return {
          blocked: true,
          reason: 'This name is protected and cannot be used'
        };
      }
    }

    // Also check the spaceless version
    const spacelessName = lowerName.replace(/\s+/g, '');
    if (spacelessName.startsWith(protected_name) ||
        spacelessName.endsWith(protected_name) ||
        spacelessName === protected_name) {
      return {
        blocked: true,
        reason: 'This name is protected and cannot be used'
      };
    }
  }

  return { blocked: false };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PROFANITY CHECK FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a name contains profanity
 * @param name - The name to check
 * @returns Object with isClean boolean and reason if not clean
 */
export function checkProfanity(name: string): { isClean: boolean; reason?: string } {
  if (!name || typeof name !== 'string') {
    return { isClean: true };
  }

  const trimmedName = name.trim();

  // STEP 1: Check for disallowed characters (blocks Unicode homoglyphs)
  if (!hasOnlyAllowedCharacters(trimmedName)) {
    return {
      isClean: false,
      reason: 'Name can only contain letters, numbers, and spaces'
    };
  }

  // STEP 2: Check for at least one letter (prevents "12345" style names)
  if (!hasAtLeastOneLetter(trimmedName)) {
    return {
      isClean: false,
      reason: 'Name must contain at least one letter'
    };
  }

  // STEP 3: Check for excessive repeating characters
  if (hasExcessiveRepeats(trimmedName)) {
    return {
      isClean: false,
      reason: 'Name cannot have more than 3 repeating characters in a row'
    };
  }

  // STEP 4: Check for reserved names (impersonation prevention)
  const reservedCheck = containsReservedName(trimmedName);
  if (reservedCheck.blocked) {
    return {
      isClean: false,
      reason: reservedCheck.reason
    };
  }

  // STEP 5: Check for protected names (like "Wren")
  const protectedCheck = containsProtectedName(trimmedName);
  if (protectedCheck.blocked) {
    return {
      isClean: false,
      reason: protectedCheck.reason
    };
  }

  const normalizedName = trimmedName.toLowerCase();

  // STEP 6: Create multiple versions for comprehensive checking
  // Version 1: Just lowercase
  // Version 2: Leetspeak deobfuscated
  // Version 3: Spaces removed (catches "f u c k")
  // Version 4: Both leetspeak AND spaces removed
  const deobfuscatedName = deobfuscateLeetspeak(normalizedName);
  const spacelessName = removeSpacingTricks(normalizedName);
  const deobfuscatedSpaceless = deobfuscateLeetspeak(spacelessName);

  // STEP 7: Check for exact match blocklist (word boundaries)
  // Check both original words and deobfuscated words
  const originalWords = normalizedName.split(/[\s\-_.,!?]+/);
  const deobfuscatedWords = deobfuscatedName.split(/[\s\-_.,!?]+/);
  const allWords = [...new Set([...originalWords, ...deobfuscatedWords])];

  for (const word of allWords) {
    if (EXACT_MATCH_BLOCKLIST.includes(word)) {
      return {
        isClean: false,
        reason: 'Name contains inappropriate language'
      };
    }
  }

  // STEP 8: Check for substring matches in main blocklist
  // Check ALL versions to catch various bypass attempts
  const versionsToCheck = [
    normalizedName,
    deobfuscatedName,
    spacelessName,
    deobfuscatedSpaceless
  ];

  for (const badWord of PROFANITY_BLOCKLIST) {
    for (const version of versionsToCheck) {
      if (version.includes(badWord)) {
        return {
          isClean: false,
          reason: 'Name contains inappropriate language'
        };
      }
    }
  }

  return { isClean: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate a corporation name (combines profanity check with other validations)
 * @param name - The corporation name to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateCorporationName(name: string): { isValid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Corporation name is required' };
  }

  const trimmedName = name.trim();

  // Length checks
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Corporation name must be at least 2 characters' };
  }

  if (trimmedName.length > 30) {
    return { isValid: false, error: 'Corporation name must be 30 characters or less' };
  }

  // Character validation (letters, numbers, spaces only)
  if (!/^[a-zA-Z0-9\s]+$/.test(trimmedName)) {
    return { isValid: false, error: 'Corporation name can only contain letters, numbers, and spaces' };
  }

  // Profanity check (includes all other checks)
  const profanityResult = checkProfanity(trimmedName);
  if (!profanityResult.isClean) {
    return { isValid: false, error: profanityResult.reason };
  }

  return { isValid: true };
}

/**
 * Validate a Mek name (similar to corporation but may have different rules)
 * @param name - The Mek name to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateMekName(name: string): { isValid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Mek name is required' };
  }

  const trimmedName = name.trim();

  // Length checks (Mek names might be shorter)
  if (trimmedName.length < 1) {
    return { isValid: false, error: 'Mek name must be at least 1 character' };
  }

  if (trimmedName.length > 20) {
    return { isValid: false, error: 'Mek name must be 20 characters or less' };
  }

  // Profanity check (includes all other checks)
  const profanityResult = checkProfanity(trimmedName);
  if (!profanityResult.isClean) {
    return { isValid: false, error: profanityResult.reason };
  }

  return { isValid: true };
}
