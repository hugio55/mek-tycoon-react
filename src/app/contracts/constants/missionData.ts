// All variations are equal - they appear as grey outlines unless matched (then yellow)
// Ordered from least rare to most rare based on copy counts
export const successMultipliers = [
  { id: "vampire", name: "Vampire", image: "/variation-images/vampire.png", bonus: "+10%" },
  { id: "noob", name: "Noob", image: "/variation-images/noob.png", bonus: "+10%" },
  { id: "desufnoc", name: "desufnoC", image: "/variation-images/desufnoc.png", bonus: "+10%" },
  { id: "taser", name: "Taser", image: "/variation-images/taser.png", bonus: "+10%" },
  { id: "log", name: "Log", image: "/variation-images/log.png", bonus: "+10%" },
  { id: "kevlar", name: "Kevlar", image: "/variation-images/kevlar.png", bonus: "+10%" },
  { id: "nuke", name: "Nuke", image: "/variation-images/nuke.png", bonus: "+10%" },
  { id: "exposed", name: "Exposed", image: "/variation-images/exposed.png", bonus: "+10%" },
  { id: "shamrock", name: "Shamrock", image: "/variation-images/shamrock.png", bonus: "+10%" },
  { id: "classic", name: "Classic", image: "/variation-images/classic.png", bonus: "+10%" },
  { id: "lightning", name: "Lightning", image: "/variation-images/lightning.png", bonus: "+10%" },
  { id: "corroded", name: "Corroded", image: "/variation-images/corroded.png", bonus: "+10%" },
  { id: "bark", name: "Bark", image: "/variation-images/bark.png", bonus: "+10%" },
  { id: "aqua", name: "Aqua", image: "/variation-images/aqua.png", bonus: "+10%" },
  { id: "crimson", name: "Crimson", image: "/variation-images/crimson.png", bonus: "+10%" },
  { id: "bumblebee", name: "Bumblebee", image: "/variation-images/bumblebee.png", bonus: "+10%" },
  { id: "camo", name: "Camo", image: "/variation-images/camo.png", bonus: "+10%" },
  { id: "hacker", name: "Hacker", image: "/variation-images/hacker.png", bonus: "+10%" },
  { id: "disco", name: "Disco", image: "/variation-images/disco.png", bonus: "+10%" },
  { id: "electrik", name: "Electrik", image: "/variation-images/electrik.png", bonus: "+10%" },
  { id: "gold", name: "Gold", image: "/variation-images/gold.png", bonus: "+10%" },
  { id: "acid", name: "Acid", image: "/variation-images/acid.png", bonus: "+10%" },
  { id: "derelict", name: "Derelict", image: "/variation-images/derelict.png", bonus: "+10%" },
];

export const sampleRewardsWithRates = {
  common: [
    { name: "Basic Scrap", dropChance: 100, amount: "5-10" },
    { name: "Common Ore", dropChance: 75, amount: "3-5" },
    { name: "Energy Cell", dropChance: 50, amount: "1-3" },
  ],
  uncommon: [
    { name: "Rare Metal", dropChance: 30, amount: "1-2" },
    { name: "Circuit Board", dropChance: 25, amount: "1" },
  ],
  rare: [
    { name: "Quantum Core", dropChance: 10, amount: "1" },
    { name: "Plasma Crystal", dropChance: 5, amount: "1" },
  ],
  legendary: [
    { name: "Void Essence", dropChance: 1, amount: "1" },
  ],
};

export const missionAilments = {
  fire: { name: "Inferno", icon: "🔥", counters: ["water", "ice", "shield"] },
  poison: { name: "Toxic", icon: "☠️", counters: ["heal", "purify", "antidote"] },
  electric: { name: "Shock", icon: "⚡", counters: ["ground", "insulate", "rubber"] },
  freeze: { name: "Cryo", icon: "❄️", counters: ["fire", "heat", "thaw"] },
  psychic: { name: "Mind", icon: "🧠", counters: ["focus", "clarity", "will"] },
  void: { name: "Null", icon: "⚫", counters: ["light", "energy", "matter"] },
  radiation: { name: "Rad", icon: "☢️", counters: ["lead", "shield", "decontaminate"] },
  gravity: { name: "Grav", icon: "🌌", counters: ["anti-grav", "levitate", "repulse"] },
  temporal: { name: "Time", icon: "⏳", counters: ["stabilize", "anchor", "chronos"] },
};

export const missionWeaknesses = ["fire", "poison", "electric"];

export const variations = [
  "taser", "log", "kevlar", "nuke", "exposed", "shamrock", "classic", "lightning", 
  "corroded", "bark", "aqua", "crimson", "bumblebee", "camo", "hacker", 
  "disco", "electrik", "gold", "acid", "derelict"
];

export const styles = [
  "Warrior", "Guardian", "Technician", "Mystic", "Ranger", "Berserker", 
  "Sage", "Assassin", "Paladin", "Architect"
];

export const globalMissionTypes = [
  "Acid", "Radioactive", "Electromagnetic", "Plasma", "Quantum", "Temporal",
  "Dimensional", "Gravitational", "Viral", "Nano", "Crystal", "Shadow",
  "Solar", "Lunar", "Void", "Chaos", "Neural", "Frost", "Inferno", "Storm"
];

export const regularMissionTitles = [
  "Resource Extraction Alpha", "Perimeter Defense Omega", "Supply Run Delta",
  "Research Station Protection", "Artifact Recovery", "System Diagnostics",
  "Energy Core Stabilization", "Communications Relay Repair", "Scout Mission Theta",
  "Mining Operation Guard", "Transport Escort Service", "Laboratory Defense",
  "Power Grid Maintenance", "Security Patrol Epsilon", "Data Recovery Mission"
];