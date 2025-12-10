/**
 * Profanity Filter for Corporation Names and Mek Names (Backend Version)
 *
 * Server-side validation to prevent inappropriate names.
 * Mirrors the frontend filter in src/lib/profanityFilter.ts
 */

// Blocklist of inappropriate words (lowercase for case-insensitive matching)
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

  // Drug references
  'cocaine', 'heroin', 'meth',
];

// Words that are blocked only as exact matches (not substrings)
const EXACT_MATCH_BLOCKLIST: string[] = [
  'ass', 'cum', 'sex', 'gay', 'nut', 'hoe', 'ho',
];

/**
 * Check if a name contains profanity
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
