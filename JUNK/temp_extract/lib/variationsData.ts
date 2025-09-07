export const headVariations = [
  "Vintage TV", "Security Camera", "Retro TV", "Radar", "PC Monitor", "Old TV", "Modern TV",
  "Mic Head", "Megaphone", "Futuristic Visor", "Flat TV", "Film Camera", "Cube TV",
  "Cassette Player", "Calculator", "Boombox", "Arcade Machine", "3D Glasses", "Headphones",
  "Laser Eyes", "Robot Eyes", "Cyclops Eye", "Heart Eyes", "Star Eyes", "X Eyes",
  "Hypno Eyes", "Diamond Eyes", "Angry Eyes", "Sleepy Eyes", "Happy Eyes", "Confused",
  "Cool Shades", "Alien Eyes", "Pixel Eyes", "Money Eyes", "Fire Eyes", "Ice Eyes",
  "Lightning Eyes", "Nature Eyes", "Galaxy Eyes", "Rainbow Eyes", "Clock Eyes", "Target Eyes",
  "Question Mark", "Exclamation", "Light Bulb", "Brain", "Crystal Ball", "Dice Head",
  "Mirror Face", "Disco Ball", "Hologram", "Neon Sign", "LED Panel", "Plasma Globe",
  "Lava Lamp", "Snow Globe", "Fishbowl", "Terrarium", "Ant Farm", "Compass",
  "Gauge Cluster", "Radar Screen", "Oscilloscope", "Seismograph", "Turntable", "Mixing Board",
  "Synthesizer", "Drum Machine", "Guitar Amp", "Speaker", "Subwoofer", "Vinyl Record",
  "CD Player", "MP3 Player", "Radio", "Walkie Talkie", "Satellite Dish", "Antenna",
  "Telescope", "Microscope", "Periscope", "Binoculars", "Magnifying Glass", "VR Headset",
  "AR Glasses", "Night Vision", "Thermal Vision", "X-Ray Vision", "Sonar", "Lidar",
  "GPS Unit", "Drone Camera", "Security Cam", "Webcam", "Action Cam", "Instant Camera",
  "Digital Camera", "Video Camera", "Film Projector", "Slide Projector", "Overhead Projector",
  "Laser Projector", "Holographic Projector", "Smart Display", "Tablet Screen", "Phone Screen"
];

export const bodyVariations = [
  "Standard Torso", "Muscular Build", "Slim Frame", "Bulky Armor", "Sleek Design", "Angular Body",
  "Rounded Form", "Geometric Shape", "Organic Flow", "Crystal Structure", "Metal Plating", "Carbon Fiber",
  "Wooden Frame", "Stone Body", "Glass Casing", "Plastic Shell", "Rubber Coating", "Leather Wrap",
  "Fabric Cover", "Mesh Design", "Chain Mail", "Scale Armor", "Plate Armor", "Riot Gear",
  "Space Suit", "Diving Suit", "Hazmat Suit", "Racing Suit", "Combat Armor", "Stealth Suit",
  "Power Armor", "Mech Suit", "Nano Suit", "Bio Suit", "Energy Shield", "Force Field",
  "Holographic Body", "Pixelated Form", "Wireframe", "Low Poly", "High Tech", "Retro Future",
  "Steam Punk", "Cyber Punk", "Bio Punk", "Solar Punk", "Diesel Punk", "Atom Punk",
  "Art Deco", "Brutalist", "Minimalist", "Maximalist", "Baroque", "Gothic",
  "Industrial", "Organic", "Crystalline", "Liquid Metal", "Sand Form", "Ice Structure",
  "Fire Body", "Electric Core", "Plasma Form", "Shadow Body", "Light Form", "Void Shell",
  "Nature Grown", "Coral Build", "Mushroom Body", "Tree Bark", "Rock Formation", "Crystal Growth",
  "Metal Skeleton", "Bone Structure", "Exoskeleton", "Endoskeleton", "Hybrid Frame", "Modular Design",
  "Transforming Body", "Adaptive Form", "Reactive Armor", "Smart Material", "Memory Metal", "Living Metal",
  "Bio Mechanical", "Synthetic Skin", "Artificial Muscle", "Hydraulic System", "Pneumatic Build", "Magnetic Core",
  "Quantum Structure", "Dimensional Form", "Time Shifted", "Phase Shifting", "Reality Warped", "Glitched Body",
  "Corrupted Data", "Pure Energy", "Solid Light", "Hard Light", "Soft Light", "Dark Matter",
  "Anti Matter", "Strange Matter", "Exotic Matter", "Smart Matter", "Grey Goo", "Utility Fog",
  "Swarm Body", "Hive Structure", "Colony Form", "Network Node", "Cloud Computing", "Edge Device"
];

export const traitVariations = [
  "Speed Boost", "Strength Plus", "Defense Up", "Agility Enhanced", "Intelligence Boost", "Wisdom Increase",
  "Charisma Buff", "Luck Improved", "Stealth Mode", "Camouflage", "Invisibility", "Phase Shift",
  "Teleportation", "Time Slow", "Time Stop", "Time Rewind", "Future Sight", "Past Vision",
  "Mind Reading", "Telepathy", "Telekinesis", "Pyrokinesis", "Cryokinesis", "Electrokinesis",
  "Hydrokinesis", "Aerokinesis", "Geokinesis", "Photokinesis", "Umbrakinesis", "Chronokinesis",
  "Healing Factor", "Regeneration", "Immortality", "Resurrection", "Life Drain", "Energy Absorb",
  "Power Mimic", "Shape Shift", "Size Change", "Density Control", "Gravity Control", "Magnetic Control",
  "Weather Control", "Plant Control", "Animal Control", "Tech Control", "Mind Control", "Emotion Control",
  "Reality Warp", "Dimension Jump", "Portal Creation", "Force Field", "Energy Shield", "Reflect Damage",
  "Counter Attack", "Critical Hit", "Multi Strike", "Area Effect", "Chain Reaction", "Combo Master",
  "Dodge Master", "Block Master", "Parry Master", "Weapon Master", "Martial Artist", "Berserker",
  "Tank Mode", "Glass Cannon", "Support Role", "Healer Type", "Buffer Class", "Debuffer Style",
  "Summoner", "Necromancer", "Elementalist", "Technomancer", "Biomancer", "Psychic",
  "Oracle", "Prophet", "Sage", "Scholar", "Scientist", "Engineer",
  "Hacker", "Pilot", "Driver", "Navigator", "Tracker", "Hunter",
  "Gatherer", "Crafter", "Builder", "Destroyer", "Creator", "Innovator"
];

export function getAllVariations() {
  const variations = [];
  
  // Add heads with type and xp
  headVariations.forEach((name, index) => {
    variations.push({
      name,
      type: 'head',
      xp: 100 + (index * 50)
    });
  });
  
  // Add bodies with type and xp
  bodyVariations.forEach((name, index) => {
    variations.push({
      name,
      type: 'body',
      xp: 150 + (index * 50)
    });
  });
  
  // Add traits with type and xp
  traitVariations.forEach((name, index) => {
    variations.push({
      name,
      type: 'trait',
      xp: 200 + (index * 50)
    });
  });
  
  return variations;
}

export function getVariationsByType(type: 'heads' | 'bodies' | 'traits') {
  const variations = getAllVariations();
  return variations[type] || [];
}

export function getRandomVariation(type: 'heads' | 'bodies' | 'traits') {
  const variations = getVariationsByType(type);
  return variations[Math.floor(Math.random() * variations.length)];
}

export function searchVariations(query: string, type?: 'heads' | 'bodies' | 'traits') {
  const allVariations = getAllVariations();
  const searchLower = query.toLowerCase();
  
  if (type) {
    return allVariations[type].filter(v => v.toLowerCase().includes(searchLower));
  }
  
  return {
    heads: allVariations.heads.filter(v => v.toLowerCase().includes(searchLower)),
    bodies: allVariations.bodies.filter(v => v.toLowerCase().includes(searchLower)),
    traits: allVariations.traits.filter(v => v.toLowerCase().includes(searchLower))
  };
}