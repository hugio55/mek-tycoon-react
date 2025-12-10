/**
 * Profanity Filter for Corporation Names and Mek Names
 *
 * This filter checks names against a blocklist of inappropriate words.
 * Used for both frontend validation (real-time feedback) and backend validation (server-side check).
 */

// Blocklist of inappropriate words (lowercase for case-insensitive matching)
// This list includes common profanity, slurs, and inappropriate terms
const PROFANITY_BLOCKLIST: string[] = [
  // Common profanity
  'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'crap', 'piss', 'dick', 'cock',
  'pussy', 'cunt', 'whore', 'slut', 'fag', 'faggot', 'nigger', 'nigga', 'retard',
  'retarded', 'kike', 'spic', 'chink', 'gook', 'wetback', 'beaner', 'cracker',
  'honky', 'dyke', 'tranny', 'shemale',

  // Variations and common bypasses
  'fck', 'fuk', 'fuq', 'f*ck', 'f**k', 'sh*t', 'b*tch', 'a$$', 'a**',
  'phuck', 'phuk', 'fvck', 'fcuk', 'biatch', 'biotch',

  // Sexual terms
  'porn', 'xxx', 'sex', 'anal', 'blowjob', 'handjob', 'dildo', 'vibrator',
  'orgasm', 'masturbat', 'jerkoff', 'cumshot', 'creampie', 'gangbang',

  // Offensive combinations
  'dumbass', 'jackass', 'asshole', 'asswipe', 'dickhead', 'shithead',
  'fuckface', 'motherfucker', 'cocksucker', 'bullshit', 'horseshit',

  // Hate speech related
  'nazi', 'hitler', 'kkk', 'holocaust',

  // Drug references (optional - can be removed if too restrictive)
  'cocaine', 'heroin', 'meth',
];

// Words that are blocked only as exact matches (not substrings)
// These might appear as legitimate parts of other words
const EXACT_MATCH_BLOCKLIST: string[] = [
  'ass', 'cum', 'sex', 'gay', 'nut', 'hoe', 'ho',
];

/**
 * Check if a name contains profanity
 * @param name - The name to check
 * @returns Object with isClean boolean and reason if not clean
 */
export function checkProfanity(name: string): { isClean: boolean; reason?: string } {
  if (!name || typeof name !== 'string') {
    return { isClean: true };
  }

  const normalizedName = name.toLowerCase().trim();

  // Remove common character substitutions for bypass detection
  const deobfuscatedName = normalizedName
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i')
    .replace(/\|/g, 'i')
    .replace(/\+/g, 't');

  // Check for exact match blocklist (word boundaries)
  const words = normalizedName.split(/[\s\-_.,!?]+/);
  for (const word of words) {
    if (EXACT_MATCH_BLOCKLIST.includes(word)) {
      return {
        isClean: false,
        reason: 'Name contains inappropriate language'
      };
    }
  }

  // Check for substring matches in main blocklist
  for (const badWord of PROFANITY_BLOCKLIST) {
    if (normalizedName.includes(badWord) || deobfuscatedName.includes(badWord)) {
      return {
        isClean: false,
        reason: 'Name contains inappropriate language'
      };
    }
  }

  return { isClean: true };
}

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

  // Profanity check
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

  // Profanity check
  const profanityResult = checkProfanity(trimmedName);
  if (!profanityResult.isClean) {
    return { isValid: false, error: profanityResult.reason };
  }

  return { isValid: true };
}
