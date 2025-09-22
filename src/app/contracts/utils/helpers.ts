export const formatGoldAmount = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toLocaleString();
};

export const formatCountdown = (endTime: number): string => {
  const now = Date.now();
  const diff = endTime - now;
  
  if (diff <= 0) return "Expired";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

export const getRewardColor = (dropChance: number): string => {
  if (dropChance >= 75) return "text-green-400";
  if (dropChance >= 50) return "text-blue-400";
  if (dropChance >= 25) return "text-purple-400";
  if (dropChance >= 10) return "text-yellow-400";
  return "text-orange-400";
};

export const generateSampleMeks = (count: number) => {
  // Use the real variations from the system
  const variations = [
    "taser", "log", "kevlar", "nuke", "exposed", "shamrock", "classic", "lightning",
    "corroded", "bark", "aqua", "crimson", "bumblebee", "camo", "hacker",
    "disco", "electrik", "gold", "acid", "derelict", "chrome", "cyan", "frost",
    "lava", "moss", "neon", "obsidian", "pearl", "ruby", "sand", "steel", "toxic"
  ];

  const styles = [
    "Warrior", "Guardian", "Technician", "Mystic", "Ranger", "Berserker",
    "Sage", "Assassin", "Paladin", "Architect"
  ];

  // Available mek image codes (sample from actual files)
  const mekImageCodes = [
    "111-111-111", "222-222-222", "333-333-333", "444-444-444", "555-555-555",
    "666-666-666", "777-777-777", "888-888-888", "999-999-999", "000-000-000",
    "aa1-aa1-cd1", "aa1-aa3-hn1", "aa1-aa4-gk1", "bc2-dm1-ap1", "bc2-dm1-as3",
    "dp2-bf4-il2", "dp2-bf4-nm1", "hb1-gn1-hn1", "hb1-gn2-ji1", "hb1-gn2-nm1"
  ];

  // Generate unique mek numbers first to avoid duplicates
  const usedNumbers = new Set<number>();
  const getMekNumber = () => {
    let num;
    do {
      num = Math.floor(Math.random() * 10000) + 1;
    } while (usedNumbers.has(num));
    usedNumbers.add(num);
    return num;
  };

  // Common matching traits that appear in missions
  const matchingTraits = ["taser", "log", "kevlar", "nuke", "classic", "lightning", "corroded", "bark"];

  // Non-matching traits for diversity
  const nonMatchingTraits = variations.filter(v => !matchingTraits.includes(v));

  return Array.from({ length: count }, (_, i) => {
    // Generate a unique mek number
    const mekNumber = getMekNumber();

    let traits;

    // Controlled distribution of matches:
    // First 16 meks have specific match patterns
    if (i === 0) {
      // 1 mek with all 3 matches
      traits = [
        matchingTraits[0],
        matchingTraits[1],
        matchingTraits[2]
      ];
    } else if (i >= 1 && i <= 2) {
      // 2 meks with 2 matches
      const matchTraits = [...matchingTraits].sort(() => Math.random() - 0.5);
      traits = [
        matchTraits[0],
        matchTraits[1],
        nonMatchingTraits[Math.floor(Math.random() * nonMatchingTraits.length)]
      ];
    } else if (i >= 3 && i <= 5) {
      // 3 meks with 1 match
      traits = [
        matchingTraits[Math.floor(Math.random() * matchingTraits.length)],
        nonMatchingTraits[Math.floor(Math.random() * nonMatchingTraits.length)],
        nonMatchingTraits[Math.floor(Math.random() * nonMatchingTraits.length)]
      ];
    } else if (i >= 6 && i <= 15) {
      // 10 meks with no matches
      traits = [
        nonMatchingTraits[Math.floor(Math.random() * nonMatchingTraits.length)],
        nonMatchingTraits[Math.floor(Math.random() * nonMatchingTraits.length)],
        nonMatchingTraits[Math.floor(Math.random() * nonMatchingTraits.length)]
      ];
    } else {
      // Rest of meks (after first 16) - mostly no matches with occasional single match
      const hasMatch = Math.random() < 0.05; // 5% chance of having a match
      if (hasMatch) {
        traits = [
          matchingTraits[Math.floor(Math.random() * matchingTraits.length)],
          nonMatchingTraits[Math.floor(Math.random() * nonMatchingTraits.length)],
          nonMatchingTraits[Math.floor(Math.random() * nonMatchingTraits.length)]
        ];
      } else {
        traits = [
          nonMatchingTraits[Math.floor(Math.random() * nonMatchingTraits.length)],
          nonMatchingTraits[Math.floor(Math.random() * nonMatchingTraits.length)],
          nonMatchingTraits[Math.floor(Math.random() * nonMatchingTraits.length)]
        ];
      }
    }

    // Shuffle traits array to randomize position
    traits = traits.sort(() => Math.random() - 0.5);

    const styleIndex = Math.floor(Math.random() * styles.length);
    const imageCode = mekImageCodes[i % mekImageCodes.length];

    return {
      id: `mek-${i}-${mekNumber}`, // Include both index and number for guaranteed uniqueness
      name: `Mek #${mekNumber}`,
      style: styles[styleIndex],
      image: `/mek-images/150px/${imageCode}.webp`,
      traits: traits,
      power: 50 + Math.floor(Math.random() * 50),
      level: Math.floor(Math.random() * 50) + 1,
      rarity: Math.random() < 0.05 ? "legendary" : Math.random() < 0.15 ? "rare" : Math.random() < 0.4 ? "uncommon" : "common",
    };
  });
};