/**
 * Profanity Filter for Corporation Names and Mek Names (Backend Version)
 *
 * Server-side validation to prevent inappropriate names.
 * Mirrors the frontend filter in src/lib/profanityFilter.ts
 *
 * Enhanced with:
 * - Comprehensive leetspeak detection (based on research from pc.net/resources/leet_sheet)
 * - Spacing trick detection ("f u c k" → "fuck")
 * - Only allows standard keyboard characters (a-z, 0-9, spaces)
 */

// Blocklist of inappropriate words (lowercase for case-insensitive matching)
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

  // Drug references
  'cocaine', 'heroin', 'meth', 'crack',
];

// Words that are blocked only as exact matches (not substrings)
const EXACT_MATCH_BLOCKLIST: string[] = [
  'ass', 'cum', 'sex', 'gay', 'nut', 'hoe', 'ho', 'fuk', 'suk', 'fuc',
];

/**
 * Check if a name contains only allowed characters (a-z, A-Z, 0-9, spaces)
 * This blocks Unicode homoglyphs and special characters
 */
function hasOnlyAllowedCharacters(name: string): boolean {
  return /^[a-zA-Z0-9\s]+$/.test(name);
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
 * Check if a name contains profanity
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

  const normalizedName = trimmedName.toLowerCase();

  // STEP 2: Create multiple versions for comprehensive checking
  // Version 1: Just lowercase
  // Version 2: Leetspeak deobfuscated
  // Version 3: Spaces removed (catches "f u c k")
  // Version 4: Both leetspeak AND spaces removed
  const deobfuscatedName = deobfuscateLeetspeak(normalizedName);
  const spacelessName = removeSpacingTricks(normalizedName);
  const deobfuscatedSpaceless = deobfuscateLeetspeak(spacelessName);

  // STEP 3: Check for exact match blocklist (word boundaries)
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

  // STEP 4: Check for substring matches in main blocklist
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
