import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new chip definition
export const createChipDefinition = mutation({
  args: {
    name: v.string(),
    imageUrl: v.optional(v.string()),
    rankScaling: v.record(v.string(), v.object({
      buffMultiplier: v.number(),
      rollChances: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const chipId = await ctx.db.insert("chipDefinitions", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return chipId;
  },
});

// Update an existing chip definition
export const updateChipDefinition = mutation({
  args: {
    id: v.id("chipDefinitions"),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    rankScaling: v.optional(v.record(v.string(), v.object({
      buffMultiplier: v.number(),
      rollChances: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a chip definition
export const deleteChipDefinition = mutation({
  args: {
    id: v.id("chipDefinitions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get all chip definitions (auto-populates if empty)
export const getAllChipDefinitions = query({
  args: {},
  handler: async (ctx) => {
    let chips = await ctx.db.query("chipDefinitions").collect();
    
    // If no chips exist, return empty array (use initializeChips mutation to populate)
    // We can't mutate in a query, so the admin page will need to call initializeChips
    return chips;
  },
});

// Initialize chips if database is empty (called once)
export const initializeChips = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if chips already exist
    const existingChips = await ctx.db.query("chipDefinitions").collect();
    if (existingChips.length > 0) {
      return { message: "Chips already initialized", count: existingChips.length };
    }

    // All 307 chip names
    const chipNames = [
      "007", "101.1 FM", "1960's", "2001", "24K", "Abominable", "Ace of Spades Ultimate", "Ace of Spades",
      "Acid", "Acrylic", "Albino", "Angler", "Aqua", "Arcade", "Arctic", "Aztec",
      "Baby", "Bag", "Ballerina", "Bark", "Big Brother", "Black & White", "Black Parade", "Black",
      "Blasters", "Bling", "Blood", "Blush", "Bone Daddy", "Bone", "Bonebox", "Boombox",
      "Boss", "Bowling", "Broadcast", "Bubblegum", "Bumble Bird", "Bumblebee", "Burnt Ultimate", "Burnt",
      "Business", "Butane", "Butterfly", "Cadillac", "Camo", "Cannon Ultimate", "Cannon", "Carbon",
      "Carbonite", "Cartoon", "Cartoonichrome", "Carving Ultimate", "Carving", "Cheetah", "China", "Chrome Ultimate",
      "Chrome", "Chromium", "Classic", "Coin", "Concrete", "Contractor", "Corroded", "Cotton Candy",
      "Couch", "Cousin Itt", "Cream", "Crimson", "Crow", "Crystal Camo", "Crystal Clear", "Cubes",
      "Damascus", "Dazed Piggy", "Deep Space", "Denim", "Derelict", "desufnoC", "Disco", "Discomania",
      "Doom", "Dr.", "Dragonfly", "Drill", "Drip", "Dualtone", "Earth", "Electrik",
      "Ellie Mesh", "Exposed", "Eyes", "Film", "Firebird", "Flaked", "Foil", "Forest",
      "Fourzin", "Frost Cage", "Frost King", "Frostbit", "Frosted", "Fury", "Gatsby Ultimate", "Gatsby",
      "Giger", "Goblin", "Gold", "Golden Guns Ultimate", "Golden Guns", "Gone", "Granite", "Grass",
      "Grate", "Hacker", "Hades", "Hal", "Hammerheat", "Happymeal", "Hawk", "Heart",
      "Heatmap", "Heatwave Ultimate", "Heatwave", "Hefner", "Heliotropium", "Highlights", "Holographic", "Hydra",
      "Iced", "Icon", "Inner Rainbow", "Iron", "Ivory", "James", "Jeff", "Jolly Rancher",
      "Journey", "Just Wren", "Kevlar", "King Tut", "Lazer", "Leeloo", "Lich", "Light",
      "Lightning", "Linkinator 3000", "Liquid Lavender", "Lizard", "Log", "Lord", "Lumberjack", "Luna",
      "Luxury Ultimate", "Luxury", "LV-426", "Mac & Cheese", "Magma", "Mahogany", "Majesty", "Maple",
      "Maps", "Marble", "Mars Attacks", "Matte", "Maze", "Meat", "Mercury", "Mesh",
      "Microphone", "Milk", "Mini Me", "Mint", "Molten Core", "Moth", "Mugged", "Near Space",
      "Neon Flamingo", "Night Vision", "Nightstalker", "Nil", "None", "Noob", "Nothing", "Nuclear",
      "Nuggets", "Nuke", "Null", "Nyan Ultimate", "Nyan", "Obliterator", "Obsidian", "Ocean",
      "OE Dark", "OE Light", "Oil", "Ol' Faithful", "Oompah", "Ooze", "Ornament", "Palace",
      "Paparazzi", "Paul Ultimate", "Paul", "Pawn Shop", "Peacock Ultimate", "Peacock", "Pearl", "Peppermint",
      "Phoenix", "Pie", "Pizza", "Plastik", "Plate", "Plush Ultimate", "Plush", "Poker",
      "Polished", "Pop", "Porcelain", "Prickles", "Princess", "Projectionist", "Prom", "Purplex",
      "Pylons", "Pyrex", "QQQ", "Quilt", "R&B", "Radiance", "Rainbow Morpho", "Rattler",
      "Recon", "Ring Blue", "Ring Green", "Ring Red", "Rose", "Ross", "Royal", "Rug",
      "Rust", "Sahara", "Sand", "Sap", "Satellite", "Saw", "Scissors", "Screamo",
      "Seabiscuit", "Seafoam", "Shamrock", "Shark", "Shipped", "Silent Film", "Silicon", "Silver",
      "Sir", "Sky", "Sleet", "Smurf", "Snapshot", "Snow", "Soul", "Spaghetti",
      "Spectrum", "Splatter", "Stained Glass", "Stars", "Steam", "Sterling", "Sticky", "Stock",
      "Stolen", "Stone", "Sun", "Sunset", "Tactical", "Tangerine", "Tarpie", "Taser",
      "Tat", "Technicolor", "Terminator", "Test Track", "The Lethal Dimension", "The Ram", "Tickle", "Tie Dye",
      "Tiles", "Trapped", "Tron", "Ultimate Instruments", "Ultimate Weaponry", "Vampire", "Vanished", "Vapor",
      "Victoria", "Waves", "Whiskey", "White", "Whiteout", "Who", "Wings Ultimate", "Wings",
      "Wires", "X Ray Ultimate", "X Ray"
    ];

    // Rank scaling multipliers (only ranks matter for chips)
    const rankScaling = {
      "D": { buffMultiplier: 0.5, rollChances: 1 },
      "C": { buffMultiplier: 0.7, rollChances: 1 },
      "B": { buffMultiplier: 0.85, rollChances: 2 },
      "A": { buffMultiplier: 1.0, rollChances: 2 },
      "S": { buffMultiplier: 1.2, rollChances: 3 },
      "SS": { buffMultiplier: 1.4, rollChances: 3 },
      "SSS": { buffMultiplier: 1.6, rollChances: 4 },
      "X": { buffMultiplier: 2.0, rollChances: 4 },
      "XX": { buffMultiplier: 2.5, rollChances: 5 },
      "XXX": { buffMultiplier: 3.0, rollChances: 6 },
    };

    // Insert all chip definitions
    let insertedCount = 0;
    for (const name of chipNames) {
      // Sanitize filename for Windows compatibility
      const sanitizedFilename = name
        .replace(/\?/g, "Q")
        .replace(/\//g, "-")
        .replace(/\\/g, "-")
        .replace(/:/g, "-")
        .replace(/\*/g, "x")
        .replace(/"/g, "'")
        .replace(/</g, "(")
        .replace(/>/g, ")")
        .replace(/\|/g, "-");
      
      await ctx.db.insert("chipDefinitions", {
        name: name,
        imageUrl: `/chip-images/mek-chips/${sanitizedFilename}.webp`,
        rankScaling,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      insertedCount++;
    }

    return { message: "Chips initialized successfully", count: insertedCount };
  },
});


// Create a chip instance for a user (when they craft/obtain a chip)
export const createChipInstance = mutation({
  args: {
    userId: v.id("users"),
    chipDefinitionId: v.id("chipDefinitions"),
    rank: v.string(), // D, C, B, A, S, SS, SSS, X, XX, XXX
    rolledBuffs: v.array(v.object({
      buffType: v.string(),
      value: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const instanceId = await ctx.db.insert("chipInstances", {
      ...args,
      equipped: false,
      equippedToMek: undefined,
      createdAt: Date.now(),
    });
    return instanceId;
  },
});

// Equip a chip to a Mek
export const equipChip = mutation({
  args: {
    chipInstanceId: v.id("chipInstances"),
    mekId: v.id("meks"),
    slot: v.number(), // Slot number (1-3 for example)
  },
  handler: async (ctx, args) => {
    // First, unequip any chip currently in this slot
    const existingChips = await ctx.db
      .query("chipInstances")
      .filter((q) => 
        q.and(
          q.eq(q.field("equippedToMek"), args.mekId),
          q.eq(q.field("equipmentSlot"), args.slot)
        )
      )
      .collect();
    
    for (const chip of existingChips) {
      await ctx.db.patch(chip._id, {
        equipped: false,
        equippedToMek: undefined,
        equipmentSlot: undefined,
      });
    }
    
    // Now equip the new chip
    await ctx.db.patch(args.chipInstanceId, {
      equipped: true,
      equippedToMek: args.mekId,
      equipmentSlot: args.slot,
    });
  },
});

// Unequip a chip
export const unequipChip = mutation({
  args: {
    chipInstanceId: v.id("chipInstances"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chipInstanceId, {
      equipped: false,
      equippedToMek: undefined,
      equipmentSlot: undefined,
    });
  },
});

// Get all chips owned by a user
export const getUserChips = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const chips = await ctx.db
      .query("chipInstances")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    // Fetch the definitions for each chip
    const chipsWithDefinitions = await Promise.all(
      chips.map(async (chip) => {
        const definition = await ctx.db.get(chip.chipDefinitionId);
        return {
          ...chip,
          definition,
        };
      })
    );
    
    return chipsWithDefinitions;
  },
});

// Get chips equipped to a specific Mek
export const getMekChips = query({
  args: {
    mekId: v.id("meks"),
  },
  handler: async (ctx, args) => {
    const chips = await ctx.db
      .query("chipInstances")
      .filter((q) => q.eq(q.field("equippedToMek"), args.mekId))
      .collect();
    
    // Fetch the definitions for each chip
    const chipsWithDefinitions = await Promise.all(
      chips.map(async (chip) => {
        const definition = await ctx.db.get(chip.chipDefinitionId);
        return {
          ...chip,
          definition,
        };
      })
    );
    
    return chipsWithDefinitions.sort((a, b) => 
      (a.equipmentSlot || 0) - (b.equipmentSlot || 0)
    );
  },
});

// Destroy/sell a chip instance
export const destroyChip = mutation({
  args: {
    chipInstanceId: v.id("chipInstances"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.chipInstanceId);
  },
});


// Get a single chip definition by ID
export const getChipDefinition = query({
  args: {
    id: v.id("chipDefinitions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});