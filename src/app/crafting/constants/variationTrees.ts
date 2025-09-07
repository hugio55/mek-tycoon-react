import { VariationTrees } from '../types';

export const VARIATION_TREES: VariationTrees = {
  heads: {
    "Accordion": {
      styles: ["Clean", "Gatling", "Drill"],
      variations: {
        "Clean": ["Recon", "Mesh", "Mint", "Wires"],
        "Gatling": ["Hacker", "Terminator", "Taser", "Nuke"],
        "Drill": ["Drill", "Lazer", "Silicon", "Electrik"]
      }
    },
    "Rolleiflex": {
      styles: ["Brain", "Gummy", "Journalist", "XV", "Confused", "Cage"],
      variations: {
        "Brain": ["Hacker", "Boss", "Business", "Classic"],
        "Gummy": ["Bubblegum", "Cotton Candy", "Cream", "Milk"],
        "Journalist": ["Projectionist", "Snapshot", "Silent Film"],
        "XV": ["Royal", "Sterling", "Gold", "24K"],
        "Confused": ["???", "desufnoC", "Dazed Piggy"],
        "Cage": ["Kevlar", "Mesh", "Wires", "Exposed"]
      }
    },
    "Turret": {
      styles: ["Defense", "Assault", "Tactical"],
      variations: {
        "Defense": ["Boss", "Big Brother", "Recon"],
        "Assault": ["Obliterator", "The Ram", "Nuke"],
        "Tactical": ["Hacker", "Nightstalker", "Tron"]
      }
    },
    "Polaroid": {
      styles: ["Instant", "Vintage", "Modern"],
      variations: {
        "Instant": ["Snapshot", "Cream", "Milk"],
        "Vintage": ["1960's", "Classic", "Ornament"],
        "Modern": ["Neon Flamingo", "Acrylic", "Plastik"]
      }
    },
    "Security": {
      styles: ["Surveillance", "Protection", "Alert"],
      variations: {
        "Surveillance": ["Big Brother", "Nightstalker", "Exposed"],
        "Protection": ["Kevlar", "Plate", "Sterling"],
        "Alert": ["Crimson", "Nuke", "Taser"]
      }
    },
    "35mm": {
      styles: ["Professional", "Artistic", "Documentary"],
      variations: {
        "Professional": ["Business", "Boss", "Sterling"],
        "Artistic": ["Stained Glass", "Quilt", "Dualtone"],
        "Documentary": ["Projectionist", "Silent Film", "Classic"]
      }
    },
    "Flashbulb": {
      styles: ["Bright", "Burst", "Flash", "Glow", "Spark", "Illuminate"],
      variations: {
        "Bright": ["Sun", "Lightning", "Neon Flamingo"],
        "Burst": ["Nuke", "Magma", "Crimson"],
        "Flash": ["Snapshot", "Electrik", "Lazer"],
        "Glow": ["Gold", "Cream", "Milk"],
        "Spark": ["Taser", "Wires", "Silicon"],
        "Illuminate": ["Heatmap", "Exposed", "Sterling"]
      }
    },
    "8mm": {
      styles: ["Film", "Vintage", "Reel", "Motion", "Classic", "Cinema"],
      variations: {
        "Film": ["Silent Film", "Projectionist", "1960's"],
        "Vintage": ["Classic", "Ornament", "Ross"],
        "Reel": ["Disco", "Discomania", "Arcade"],
        "Motion": ["Tron", "Lightning", "Electrik"],
        "Classic": ["Mahogany", "Ivory", "Porcelain"],
        "Cinema": ["Mars Attacks", "The Lethal Dimension", "Obliterator"]
      }
    },
    "Reels": {
      styles: ["Cinema", "Motion", "Classic", "Show", "Theater", "Production"],
      variations: {
        "Cinema": ["Silent Film", "Projectionist", "Classic"],
        "Motion": ["Tron", "Electrik", "Lightning"],
        "Classic": ["1960's", "Disco", "Ross"],
        "Show": ["Arcade", "Nyan", "Nyan Ultimate"],
        "Theater": ["Royal", "Ornament", "Sterling"],
        "Production": ["Business", "Boss", "Professional"]
      }
    },
    "Projector": {
      styles: ["Theater", "Show", "Display", "Screen", "Beam", "Cast"],
      variations: {
        "Theater": ["Projectionist", "Silent Film", "Classic"],
        "Show": ["Disco", "Discomania", "Arcade"],
        "Display": ["Heatmap", "Exposed", "Lightning"],
        "Screen": ["Snapshot", "Mint", "Clean"],
        "Beam": ["Lazer", "Taser", "Nuke"],
        "Cast": ["Magma", "Crimson", "Sun"]
      }
    }
  },
  bodies: {
    "Cartoon": {
      styles: ["Animated", "Comic", "Toon", "Fun", "Playful", "Whimsical"],
      variations: {
        "Animated": ["Cartoon", "Cartoonichrome", "Happymeal"],
        "Comic": ["Smurf", "Jolly Rancher", "Peppermint"],
        "Toon": ["Noob", "Mugged", "Tickle"],
        "Fun": ["Blush", "Tangerine", "Sky"],
        "Playful": ["Spaghetti", "Nuggets", "Couch"],
        "Whimsical": ["Cousin Itt", "Dr.", "James"]
      }
    },
    "Irons": {
      styles: ["Metal", "Forged", "Cast", "Heavy", "Industrial", "Solid"],
      variations: {
        "Metal": ["Iron", "Chrome", "Chrome Ultimate"],
        "Forged": ["Damascus", "Carbon", "Mercury"],
        "Cast": ["Granite", "Stone", "Marble"],
        "Heavy": ["Grate", "Tiles", "Cubes"],
        "Industrial": ["Shipped", "007", "Bag"],
        "Solid": ["Matte", "Black", "White"]
      }
    },
    "Luxury": {
      styles: ["Premium", "Elite", "Royal", "Elegant", "Noble", "Refined"],
      variations: {
        "Premium": ["Luxury", "Luxury Ultimate", "Gatsby"],
        "Elite": ["Gatsby Ultimate", "Majesty", "Lord"],
        "Royal": ["Princess", "Victoria", "Sir"],
        "Elegant": ["Pearl", "Rose", "Prom"],
        "Noble": ["Seabiscuit", "Heart", "Soul"],
        "Refined": ["Rug", "Tarpie", "Plush", "Plush Ultimate"]
      }
    },
    "Stone": {
      styles: ["Rock", "Mineral", "Carved", "Rough", "Polished", "Natural"],
      variations: {
        "Rock": ["Stone", "Granite", "Marble"],
        "Mineral": ["Crystal Camo", "Crystal Clear", "Obsidian"],
        "Carved": ["Carving", "Carving Ultimate", "Aztec"],
        "Rough": ["Rust", "Sand", "Giger"],
        "Polished": ["Pearl", "Radiance", "Seafoam"],
        "Natural": ["Forest", "Ocean", "Maple"]
      }
    },
    "Bob Ross": {
      styles: ["Paint", "Art", "Nature", "Canvas", "Brush", "Landscape"],
      variations: {
        "Paint": ["Oil", "Matte", "Blush"],
        "Art": ["Inner Rainbow", "Tie Dye", "Stars"],
        "Nature": ["Forest", "Ocean", "Maple"],
        "Canvas": ["Waves", "Sunset", "Sky"],
        "Brush": ["Highlights", "Tat", "Sticky"],
        "Landscape": ["Arctic", "Journey", "Rose"]
      }
    }
  },
  traits: {
    "Wings": {
      styles: ["Flight", "Mythical", "Combat", "Aerial", "Soar", "Glide"],
      variations: {
        "Flight": ["Wings", "Wings Ultimate", "Firebird"],
        "Mythical": ["Phoenix", "Peacock", "Peacock Ultimate"],
        "Combat": ["Hawk", "Crow", "Vampire"],
        "Aerial": ["Butterfly", "Moth", "Bumble Bird"],
        "Soar": ["Rainbow Morpho", "Angler", "Albino"],
        "Glide": ["Film", "Light", "Drip"]
      }
    },
    "Weapons": {
      styles: ["Ranged", "Heavy", "Special", "Tactical", "Ultimate", "Combat"],
      variations: {
        "Ranged": ["Blasters", "Golden Guns", "Golden Guns Ultimate"],
        "Heavy": ["Cannon", "Cannon Ultimate", "Ultimate Weaponry"],
        "Special": ["Tactical", "Saw", "Scissors"],
        "Tactical": ["Night Vision", "Hammerheat", "Pylons"],
        "Ultimate": ["Ultimate Instruments", "Stolen", "Nuclear"],
        "Combat": ["Shark", "Hydra", "LV-426"]
      }
    },
    "Laser": {
      styles: ["Beam", "Pulse", "Ray", "Focus", "Energy", "Light"],
      variations: {
        "Beam": ["Light", "Spectrum", "Holographic"],
        "Pulse": ["Drip", "Pop", "Splatter"],
        "Ray": ["LV-426", "Deep Space", "Near Space"],
        "Focus": ["Linkinator 3000", "Test Track", "Satellite"],
        "Energy": ["Nuclear", "Molten Core", "Heliotropium"],
        "Light": ["Technicolor", "Black & White", "Whiteout"]
      }
    },
    "Instruments": {
      styles: ["Music", "Sound", "Audio", "Rhythm", "Melody", "Harmony"],
      variations: {
        "Music": ["Ultimate Instruments", "Oompah", "R&B"],
        "Sound": ["Boombox", "Bonebox", "Microphone"],
        "Audio": ["101.1 FM", "Broadcast", "Screamo"],
        "Rhythm": ["Pop", "Black Parade", "2001"],
        "Melody": ["Hefner", "Palace", "Pawn Shop"],
        "Harmony": ["Ring Blue", "Ring Green", "Ring Red"]
      }
    },
    "Turret": {
      styles: ["Defense", "Guard", "Protect", "Watch", "Secure", "Alert"],
      variations: {
        "Defense": ["Contractor", "Icon", "Jeff"],
        "Guard": ["Who", "Stock", "Stolen"],
        "Protect": ["Kevlar", "Concrete", "Carbonite"],
        "Watch": ["Paparazzi", "Lumberjack", "Just Wren"],
        "Secure": ["Iced", "Foil", "Chromium"],
        "Alert": ["Fourzin", "Purplex", "Sap"]
      }
    },
    "Drill": {
      styles: ["Pierce", "Bore", "Excavate", "Mine", "Dig", "Penetrate"],
      variations: {
        "Pierce": ["Pyrex", "Silver", "King Tut"],
        "Bore": ["Earth", "Luna", "Mini Me"],
        "Excavate": ["Gone", "Vanished", "Nothing"],
        "Mine": ["None", "Nil", "Null"],
        "Dig": ["Bling", "Vampire", "Film"],
        "Penetrate": ["Drip", "Stock", "Splatter"]
      }
    }
  }
};