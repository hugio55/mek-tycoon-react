// Seeded pseudo-random number generator to ensure consistent values between server and client
// This prevents hydration errors when generating "random" positions for visual elements

export class SeededRandom {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  // Linear congruential generator (LCG) - produces deterministic pseudo-random numbers
  private next(): number {
    // Using common LCG constants (same as glibc)
    this.seed = (this.seed * 1103515245 + 12345) % 2147483648;
    return this.seed / 2147483648;
  }

  // Get a random number between 0 and 1
  random(): number {
    return this.next();
  }

  // Get a random number between min and max
  range(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  // Get a random integer between min and max (inclusive)
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  // Get a random boolean with optional probability
  boolean(probability: number = 0.5): boolean {
    return this.random() < probability;
  }
}

// Create a singleton instance for global use
export const globalRandom = new SeededRandom(42); // Use a fixed seed for consistency

// Helper to create a seeded random from a string
export function createSeededRandomFromString(seedStr: string): SeededRandom {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = ((seed << 5) - seed) + seedStr.charCodeAt(i);
    seed = seed & seed;
  }
  return new SeededRandom(Math.abs(seed));
}