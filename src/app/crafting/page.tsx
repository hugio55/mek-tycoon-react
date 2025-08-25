"use client";

import { useState } from "react";
import BackgroundEffects from "@/components/BackgroundEffects";

type Category = 'main' | 'group' | 'style' | 'variation';
type ComponentType = 'heads' | 'bodies' | 'traits';

// Complete data from CSV - 102 heads, 112 bodies, 95 traits
const HEADS_VARIATIONS = [
  "1960's", "24K", "???", "Ace of Spades", "Ace of Spades Ultimate", "Acid", "Acrylic", "Aqua", "Arcade", "Aztec",
  "Baby", "Ballerina", "Bark", "Big Brother", "Bone Daddy", "Boss", "Bowling", "Bubblegum", "Bumblebee", "Business",
  "Butane", "Cadillac", "Camo", "China", "Classic", "Coin", "Corroded", "Cotton Candy", "Cream", "Crimson",
  "Dazed Piggy", "Derelict", "Disco", "Discomania", "Dragonfly", "Drill", "Dualtone", "Electrik", "Ellie Mesh", "Exposed",
  "Flaked", "Frost King", "Gold", "Grass", "Hacker", "Hades", "Hal", "Heatmap", "Ivory", "Kevlar",
  "Lazer", "Lich", "Lightning", "Liquid Lavender", "Log", "Mac & Cheese", "Magma", "Mahogany", "Mars Attacks", "Mesh",
  "Milk", "Mint", "Neon Flamingo", "Nightstalker", "Nuke", "Nyan", "Nyan Ultimate", "Obliterator", "Ol' Faithful", "Ornament",
  "Paul", "Paul Ultimate", "Pie", "Pizza", "Plastik", "Plate", "Polished", "Porcelain", "Projectionist", "Quilt",
  "Recon", "Ross", "Royal", "Rust", "Sahara", "Shamrock", "Silent Film", "Silicon", "Sleet", "Snapshot",
  "Snow", "Stained Glass", "Sterling", "Sun", "Taser", "Terminator", "The Lethal Dimension", "The Ram", "Tron", "Whiskey",
  "Wires", "desufnoC"
];

const BODIES_VARIATIONS = [
  "007", "Abominable", "Arctic", "Aztec", "Bag", "Black", "Blood", "Blush", "Bone", "Burnt",
  "Burnt Ultimate", "Carbon", "Cartoon", "Cartoonichrome", "Carving", "Carving Ultimate", "Cheetah", "Chrome", "Chrome Ultimate", "Couch",
  "Cousin Itt", "Crystal Camo", "Crystal Clear", "Cubes", "Damascus", "Denim", "Doom", "Dr.", "Eyes", "Forest",
  "Frost Cage", "Frostbit", "Frosted", "Fury", "Gatsby", "Gatsby Ultimate", "Giger", "Goblin", "Granite", "Grate",
  "Happymeal", "Heart", "Heatwave", "Heatwave Ultimate", "Highlights", "Inner Rainbow", "Iron", "James", "Jolly Rancher", "Journey",
  "Leeloo", "Lizard", "Lord", "Luxury", "Luxury Ultimate", "Majesty", "Maple", "Maps", "Marble", "Matte",
  "Maze", "Meat", "Mercury", "Mugged", "Noob", "Nuggets", "OE Dark", "OE Light", "Obsidian", "Ocean",
  "Oil", "Ooze", "Pearl", "Peppermint", "Plush", "Plush Ultimate", "Poker", "Prickles", "Princess", "Prom",
  "Radiance", "Rattler", "Rose", "Rug", "Rust", "Sand", "Seabiscuit", "Seafoam", "Shipped", "Sir",
  "Sky", "Smurf", "Soul", "Spaghetti", "Stars", "Steam", "Sticky", "Stone", "Sunset", "Tangerine",
  "Tarpie", "Tat", "Tickle", "Tie Dye", "Tiles", "Trapped", "Vapor", "Victoria", "Waves", "White",
  "X Ray", "X Ray Ultimate"
];

const TRAITS_VARIATIONS = [
  "101.1 FM", "2001", "Albino", "Angler", "Black & White", "Black Parade", "Blasters", "Bling", "Bonebox", "Boombox",
  "Broadcast", "Bumble Bird", "Butterfly", "Cannon", "Cannon Ultimate", "Carbonite", "Chromium", "Concrete", "Contractor", "Crow",
  "Deep Space", "Drip", "Earth", "Film", "Firebird", "Foil", "Fourzin", "Golden Guns", "Golden Guns Ultimate", "Gone",
  "Hammerheat", "Hawk", "Hefner", "Heliotropium", "Holographic", "Hydra", "Iced", "Icon", "Jeff", "Just Wren",
  "King Tut", "LV-426", "Light", "Linkinator 3000", "Lumberjack", "Luna", "Microphone", "Mini Me", "Molten Core", "Moth",
  "Near Space", "Night Vision", "Nil", "None", "Nothing", "Nuclear", "Null", "Oompah", "Palace", "Paparazzi",
  "Pawn Shop", "Peacock", "Peacock Ultimate", "Phoenix", "Pop", "Purplex", "Pylons", "Pyrex", "R&B", "Rainbow Morpho",
  "Ring Blue", "Ring Green", "Ring Red", "Sap", "Satellite", "Saw", "Scissors", "Screamo", "Shark", "Silver",
  "Spectrum", "Splatter", "Stock", "Stolen", "Tactical", "Technicolor", "Test Track", "Ultimate Instruments", "Ultimate Weaponry", "Vampire",
  "Vanished", "Whiteout", "Who", "Wings", "Wings Ultimate"
];

// Variation tree structure - each variation has styles, and each style has final variations
const VARIATION_TREES = {
  heads: {
    // Camera variations
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

// Get all base variations for a component type
const getBaseVariations = (type: ComponentType) => {
  return Object.keys(VARIATION_TREES[type] || {});
};

// Get styles for a selected variation
const getStyles = (type: ComponentType, variation: string) => {
  return VARIATION_TREES[type]?.[variation]?.styles || ["Clean", "Gatling", "Drill"];
};

// Get final variations for a selected style
const getFinalVariations = (type: ComponentType, variation: string, style: string) => {
  return VARIATION_TREES[type]?.[variation]?.variations?.[style] || 
    // Fallback to showing some variations from the main list
    (type === 'heads' ? HEADS_VARIATIONS.slice(0, 12) :
     type === 'bodies' ? BODIES_VARIATIONS.slice(0, 12) :
     TRAITS_VARIATIONS.slice(0, 12));
};

export default function CraftingPage() {
  const [currentCategory, setCurrentCategory] = useState<Category>('main');
  const [selectedType, setSelectedType] = useState<ComponentType | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedFinal, setSelectedFinal] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecipe, setShowRecipe] = useState(false);
  const [isCrafting, setIsCrafting] = useState(false);
  const [craftSuccess, setCraftSuccess] = useState(false);

  const showCategory = (type: ComponentType) => {
    setSelectedType(type);
    setCurrentCategory('group');
    setSearchTerm('');
  };

  const selectVariation = (variation: string) => {
    setSelectedVariation(variation);
    setCurrentCategory('style');
  };

  const selectStyle = (style: string) => {
    setSelectedStyle(style);
    setCurrentCategory('variation');
  };

  const selectFinalVariation = (final: string) => {
    setSelectedFinal(final);
    setShowRecipe(true);
  };

  const resetCrafting = () => {
    setCurrentCategory('main');
    setSelectedType(null);
    setSelectedVariation(null);
    setSelectedStyle(null);
    setSelectedFinal(null);
    setSearchTerm('');
    setShowRecipe(false);
    setCraftSuccess(false);
    setIsCrafting(false);
  };

  const goBack = () => {
    if (showRecipe) {
      setShowRecipe(false);
      setSelectedFinal(null);
    } else if (currentCategory === 'variation') {
      setCurrentCategory('style');
      setSelectedFinal(null);
    } else if (currentCategory === 'style') {
      setCurrentCategory('group');
      setSelectedStyle(null);
    } else if (currentCategory === 'group') {
      setCurrentCategory('main');
      setSelectedVariation(null);
      setSelectedType(null);
    }
  };

  const handleCraft = async () => {
    setIsCrafting(true);
    // Simulate crafting process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsCrafting(false);
    setCraftSuccess(true);
    
    // Reset after showing success
    setTimeout(() => {
      resetCrafting();
    }, 3000);
  };

  const renderVariationGrid = (variations: string[], onSelect: (v: string) => void) => {
    const filtered = searchTerm 
      ? variations.filter(v => v.toLowerCase().includes(searchTerm.toLowerCase()))
      : variations;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {filtered.map(variation => (
          <div
            key={variation}
            onClick={() => onSelect(variation)}
            className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(42, 42, 42, 0.9) 0%, rgba(31, 31, 31, 0.9) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 204, 0, 0.2)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid rgba(255, 204, 0, 0.8)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 204, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid rgba(255, 204, 0, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="text-lg font-medium text-gray-300 group-hover:text-yellow-400 transition-colors duration-300">
              {variation}
            </div>
          </div>
        ))}
      </div>
    );
  };


  return (
    <div className="text-white py-8 min-h-screen relative">
      <BackgroundEffects />
      {/* Main Category Selection */}
      {currentCategory === 'main' && !showRecipe && (
        <>
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Crafting Station</h1>
          <p className="text-gray-400 mb-8">Forge legendary components for your Mek collection</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { 
                type: 'heads' as ComponentType, 
                icon: '📷', 
                name: 'Heads', 
                desc: 'Vision & Perception Systems',
                count: HEADS_VARIATIONS.length
              },
              { 
                type: 'bodies' as ComponentType, 
                icon: '🤖', 
                name: 'Bodies', 
                desc: 'Core Chassis & Armor',
                count: BODIES_VARIATIONS.length
              },
              { 
                type: 'traits' as ComponentType, 
                icon: '⚡', 
                name: 'Traits', 
                desc: 'Special Abilities & Enhancements',
                count: TRAITS_VARIATIONS.length
              }
            ].map(category => (
              <div
                key={category.type}
                onClick={() => showCategory(category.type)}
                className="group cursor-pointer transform transition-all duration-500 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid rgba(255, 204, 0, 0.3)',
                  borderRadius: '20px',
                  padding: '40px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = '2px solid rgba(255, 204, 0, 0.8)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(255, 204, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = '2px solid rgba(255, 204, 0, 0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="text-6xl mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300">
                  {category.icon}
                </div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-2 relative z-10">{category.name}</h3>
                <p className="text-gray-500 text-sm mb-3 relative z-10">{category.desc}</p>
                <div className="text-xs text-gray-600 relative z-10">{category.count} variations available</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Variation Selection (Base variations like Accordion, Rolleiflex, etc.) */}
      {currentCategory === 'group' && selectedType && !showRecipe && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={goBack}
                className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-lg transition-all border border-gray-700 hover:border-yellow-500"
              >
                ← Back
              </button>
              <h2 className="text-3xl font-bold text-yellow-400">
                Select {selectedType === 'heads' ? 'Head' : selectedType === 'bodies' ? 'Body' : 'Trait'} Variation
              </h2>
            </div>
            <input
              type="text"
              placeholder="Search variations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none w-64"
            />
          </div>
          <p className="text-gray-400 text-center mb-6">
            Choose a base variation to customize
          </p>
          {renderVariationGrid(getBaseVariations(selectedType), selectVariation)}
        </>
      )}

      {/* Style Selection (Clean, Gatling, Drill, etc.) */}
      {currentCategory === 'style' && selectedVariation && selectedType && !showRecipe && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={goBack}
                className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-lg transition-all border border-gray-700 hover:border-yellow-500"
              >
                ← Back
              </button>
              <h2 className="text-3xl font-bold text-yellow-400">Select Style</h2>
            </div>
          </div>
          <p className="text-gray-400 text-center mb-6">
            Choose a style for <span className="text-yellow-400">{selectedVariation}</span>
          </p>
          {renderVariationGrid(getStyles(selectedType, selectedVariation), selectStyle)}
        </>
      )}

      {/* Final Variation Selection */}
      {currentCategory === 'variation' && selectedStyle && selectedVariation && selectedType && !showRecipe && (
        <>
          <div className="flex items-center mb-6">
            <button 
              onClick={goBack}
              className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-lg transition-all border border-gray-700 hover:border-yellow-500 mr-4"
            >
              ← Back
            </button>
            <h2 className="text-3xl font-bold text-yellow-400">Select Final Variation</h2>
          </div>
          <p className="text-gray-400 text-center mb-6">
            Choose final variation for <span className="text-yellow-400">{selectedVariation} - {selectedStyle}</span>
          </p>
          {renderVariationGrid(
            getFinalVariations(selectedType, selectedVariation, selectedStyle), 
            selectFinalVariation
          )}
        </>
      )}

      {/* Recipe Display */}
      {showRecipe && selectedFinal && selectedType && selectedVariation && selectedStyle && (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-4">
            <button 
              onClick={goBack}
              className="px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 rounded text-sm transition-all border border-gray-700 hover:border-yellow-500 mr-3"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold text-yellow-400">Crafting Recipe</h2>
          </div>

          {/* Recipe Card - More Compact */}
          <div 
            className="rounded-lg p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 204, 0, 0.3)'
            }}
          >
            {/* Recipe Header - Condensed */}
            <div className="flex items-center mb-4 pb-3 border-b border-gray-800">
              <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center mr-4">
                <span className="text-gray-600 text-xs">IMAGE</span>
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white">
                  {selectedFinal} {selectedType === 'heads' ? 'Head' : selectedType === 'bodies' ? 'Body' : 'Trait'}
                </h1>
                <div className="text-sm text-yellow-400">
                  {selectedVariation} → {selectedStyle} → {selectedFinal}
                </div>
              </div>
            </div>

            {/* Essence Requirements - Compact */}
            <div className="space-y-2 mb-4">
              <h3 className="text-sm font-semibold text-yellow-400 mb-2">Required Essences</h3>
              
              {/* Essence Items - More Compact */}
              <div className="flex items-center p-2 rounded bg-gray-800/30 border border-gray-700">
                <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center mr-3">
                  <span className="text-gray-600 text-xs">IMG</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{selectedVariation} Essence</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-3 bg-gray-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full"
                        style={{
                          width: '25%',
                          background: 'linear-gradient(90deg, #00cc44 0%, #00cc44 25%, #ff8800 25%, #ff8800 50%, #333333 50%)'
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">1.25/5</span>
                  </div>
                </div>
                <button className="ml-3 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-black text-xs font-semibold rounded transition-colors">
                  Buy
                </button>
              </div>

              <div className="flex items-center p-2 rounded bg-gray-800/30 border border-gray-700">
                <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center mr-3">
                  <span className="text-gray-600 text-xs">IMG</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{selectedStyle} Essence</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-3 bg-gray-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500"
                        style={{ width: '60%' }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">3/5</span>
                  </div>
                </div>
                <div className="ml-3 text-green-500 text-sm">✓</div>
              </div>

              <div className="flex items-center p-2 rounded bg-gray-800/30 border border-gray-700">
                <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center mr-3">
                  <span className="text-gray-600 text-xs">IMG</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Mixed Essence</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-3 bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-full" />
                    </div>
                    <span className="text-xs text-gray-400">15/5</span>
                  </div>
                </div>
                <div className="ml-3 text-green-500 text-sm">✓</div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex justify-around text-center mb-4 py-2 border-y border-gray-800">
              <div>
                <div className="text-xs text-gray-400">Success</div>
                <div className="text-sm font-semibold text-green-400">95%</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Rank</div>
                <div className="text-sm font-semibold text-yellow-400">B</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Gold/hr</div>
                <div className="text-sm font-semibold text-yellow-400">+3.5</div>
              </div>
            </div>

            {/* Craft Button */}
            <div className="text-center">
              {craftSuccess ? (
                <div className="text-lg font-bold text-green-500 animate-pulse">
                  ✨ Crafting Successful! ✨
                </div>
              ) : (
                <button
                  onClick={handleCraft}
                  disabled={isCrafting}
                  className={`
                    w-full px-8 py-2.5 rounded font-bold transition-all transform
                    ${isCrafting 
                      ? 'bg-gray-600 cursor-not-allowed animate-pulse' 
                      : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black shadow-lg'
                    }
                  `}
                >
                  {isCrafting ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⚙️</span>
                      Crafting...
                    </span>
                  ) : (
                    'Start Crafting'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}