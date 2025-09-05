"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackgroundEffects from "@/components/BackgroundEffects";
import { useClickSound } from "@/lib/useClickSound";

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
  const router = useRouter();
  const playClickSound = useClickSound();
  const [currentCategory, setCurrentCategory] = useState<Category>('main');
  const [selectedType, setSelectedType] = useState<ComponentType | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedFinal, setSelectedFinal] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecipe, setShowRecipe] = useState(false);
  const [isCrafting, setIsCrafting] = useState(false);
  const [craftSuccess, setCraftSuccess] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showCraftedPopup, setShowCraftedPopup] = useState(false);
  const [craftedItem, setCraftedItem] = useState<{name: string, type: ComponentType} | null>(null);
  const [showMekSelector, setShowMekSelector] = useState(false);
  
  // Mock function to check if user has recipes for a variation
  const hasRecipeForVariation = (variation: string): boolean => {
    // Mock data - in production this would check actual user inventory
    const availableRecipes = [
      'Accordion', 'Rolleiflex', 'Turret', 'Polaroid', 
      'Clean', 'Gatling', 'Drill', 'Brain', 'Gummy',
      'Defense', 'Assault', 'Tactical', 'Instant', 'Vintage',
      'Cartoon', 'Irons', 'Luxury', 'Stone',
      'Wings', 'Weapons', 'Laser', 'Instruments'
    ];
    return availableRecipes.includes(variation);
  };
  
  // Helper function to get the correct image path for a variation
  const getVariationImagePath = (variation: string): string => {
    // Map base variations to existing images
    const baseVariationMap: { [key: string]: string } = {
      // Heads base variations
      'Accordion': 'recon',
      'Rolleiflex': 'snapshot', 
      'Turret': 'terminator',
      'Polaroid': 'cream',
      'Security': 'nightstalker',
      '35mm': 'projectionist',
      'Flashbulb': 'lightning',
      '8mm': 'silent_film',
      'Reels': 'arcade',
      'Projector': 'heatmap',
      // Bodies base variations
      'Cartoon': 'cartoon',
      'Irons': 'iron',
      'Luxury': 'luxury',
      'Stone': 'stone',
      'Bob Ross': 'oil',
      // Traits base variations
      'Wings': 'wings',
      'Weapons': 'golden_guns',
      'Laser': 'light',
      'Instruments': 'microphone',
      'Turret': 'tactical',
      'Drill': 'drill',
      // Style variations
      'Clean': 'mint',
      'Gatling': 'hammerheat',
      'Brain': 'hacker',
      'Gummy': 'jolly_rancher',
      'Defense': 'kevlar',
      'Assault': 'nuke',
      'Tactical': 'tactical',
      'Instant': 'snapshot',
      'Vintage': 'classic',
      'Modern': 'neon_flamingo'
    };
    
    // Check if this is a base variation that needs mapping
    const mappedImage = baseVariationMap[variation];
    if (mappedImage) {
      return `/variation-images/${mappedImage}.png`;
    }
    
    // Otherwise process the variation name normally
    const processedName = variation.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/['']/g, '')
      .replace(/&/g, '_')
      .replace(/__+/g, '_')
      .replace(/\?\?\?/g, 'qqq')
      .replace(/\./g, '')
      .replace(/1960's/gi, '1960s')
      .replace(/dr\./gi, 'dr')
      .replace(/101\.1_fm/gi, '101.1_fm')
      .replace(/mac_&_cheese/gi, 'mac_&_cheese')
      .replace(/r&b/gi, 'r&b')
      .replace(/desufnoc/gi, 'desufnoc');
      
    return `/variation-images/${processedName}.png`;
  };

  const showCategory = (type: ComponentType) => {
    playClickSound();
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
    
    // Show crafted popup
    if (selectedFinal && selectedType) {
      setCraftedItem({ name: selectedFinal, type: selectedType });
      setShowCraftedPopup(true);
    }
  };
  
  const handleEquipClick = () => {
    setShowCraftedPopup(false);
    setShowMekSelector(true);
  };
  
  const handleMekSelect = (mekId: string) => {
    // Navigate to mek profile with equip state
    router.push(`/mek/${mekId}?equip=${selectedType}&item=${selectedFinal}`);
  };
  
  // Mock data for user's meks
  const userMeks = [
    { id: "1234", name: "Mek #1234", headSlot: "Gold", bodySlot: "Chrome", traitSlot: "Wings", headFilled: true, bodyFilled: true, traitFilled: false },
    { id: "2468", name: "Mek #2468", headSlot: null, bodySlot: "Iron", traitSlot: "Blasters", headFilled: false, bodyFilled: true, traitFilled: true },
    { id: "3691", name: "Mek #3691", headSlot: "Nuke", bodySlot: null, traitSlot: null, headFilled: true, bodyFilled: false, traitFilled: false },
    { id: "0013", name: "Mek #0013", headSlot: null, bodySlot: null, traitSlot: "Laser", headFilled: false, bodyFilled: false, traitFilled: true },
    { id: "5555", name: "Mek #5555", headSlot: "Mesh", bodySlot: "Luxury", traitSlot: null, headFilled: true, bodyFilled: true, traitFilled: false },
    { id: "7777", name: "Mek #7777", headSlot: null, bodySlot: null, traitSlot: null, headFilled: false, bodyFilled: false, traitFilled: false },
  ];

  const renderVariationGrid = (variations: string[], onSelect: (v: string) => void, showImages: boolean = true) => {
    const filtered = searchTerm 
      ? variations.filter(v => v.toLowerCase().includes(searchTerm.toLowerCase()))
      : variations;
    
    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {filtered.map(variation => {
            const hasRecipe = hasRecipeForVariation(variation);
            const isHovered = hoveredNode === variation;
            
            return (
              <div
                key={variation}
                onClick={(e) => {
                  if (hasRecipe) {
                    playClickSound();
                    onSelect(variation);
                  } else {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                onMouseEnter={() => {
                  setHoveredNode(variation);
                }}
                onMouseMove={(e) => {
                  if (!hasRecipe) {
                    setMousePos({ x: e.clientX, y: e.clientY });
                  }
                }}
                onMouseLeave={() => {
                  setHoveredNode(null);
                }}
                className={`group ${hasRecipe ? 'cursor-pointer' : 'cursor-not-allowed'} transform transition-all duration-300 ${hasRecipe ? 'hover:scale-105' : 'hover:scale-95'}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  opacity: hasRecipe ? 1 : 0.6,
                }}
              >
                {showImages && (
                  <div className="relative mb-3">
                    <div 
                      className={`w-32 h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 transition-all duration-300 bg-gradient-to-br ${hasRecipe ? 'from-gray-700 to-gray-800' : 'from-gray-800 to-gray-900'} ${hasRecipe ? 'group-hover:border-green-400' : ''}`}
                      style={{
                        borderColor: hasRecipe 
                          ? (isHovered ? 'rgba(34, 197, 94, 1)' : 'rgba(34, 197, 94, 0.4)') 
                          : 'rgba(107, 114, 128, 0.5)',
                        boxShadow: hasRecipe 
                          ? (isHovered 
                            ? '0 0 40px rgba(34, 197, 94, 0.8), 0 0 80px rgba(34, 197, 94, 0.4), inset 0 0 30px rgba(34, 197, 94, 0.3)' 
                            : '0 0 25px rgba(34, 197, 94, 0.4), 0 0 50px rgba(34, 197, 94, 0.2)')
                          : '0 4px 12px rgba(0, 0, 0, 0.3)',
                        filter: hasRecipe 
                          ? 'none' 
                          : (isHovered ? 'grayscale(70%) brightness(0.6)' : 'grayscale(70%)'),
                      }}
                    >
                      <img 
                        src={getVariationImagePath(variation)}
                        alt={variation}
                        className="w-full h-full object-cover"
                        style={{
                          filter: hasRecipe ? 'none' : 'brightness(0.7)',
                        }}
                        onError={(e) => {
                          // Hide image and show emoji fallback on error
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-5xl" style="filter: ${hasRecipe ? 'none' : 'brightness(0.5)'}">${
                              selectedType === 'heads' ? '📷' : selectedType === 'bodies' ? '🤖' : '⚡'
                            }</div>`;
                          }
                        }}
                      />
                    </div>
                    {hasRecipe && (
                      <>
                        {/* Base glow */}
                        <div 
                          className="absolute inset-0 rounded-full pointer-events-none"
                          style={{
                            background: 'radial-gradient(circle at center, transparent 60%, rgba(34, 197, 94, 0.2) 100%)',
                            animation: 'pulse 3s ease-in-out infinite',
                          }}
                        />
                        {/* Radiating particles from randomized edge positions */}
                        {isHovered && (
                          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: -1 }}>
                            {[...Array(24)].map((_, i) => {
                              // Randomize angle for each particle
                              const randomAngle = (Math.random() * 360) * Math.PI / 180;
                              const startX = 50 + 48 * Math.cos(randomAngle);
                              const startY = 50 + 48 * Math.sin(randomAngle);
                              // Randomize animation duration and delay
                              const duration = 2 + Math.random() * 2; // 2-4 seconds
                              const delay = Math.random() * 2; // 0-2 seconds delay
                              
                              return (
                                <div
                                  key={i}
                                  className="absolute w-1 h-1 bg-green-400/60 rounded-full"
                                  style={{
                                    left: `${startX}%`,
                                    top: `${startY}%`,
                                    '--angle': `${randomAngle * 180 / Math.PI}deg`,
                                    '--endX': `${Math.cos(randomAngle) * 100}px`,
                                    '--endY': `${Math.sin(randomAngle) * 100}px`,
                                    animation: `radiateFromEdge ${duration}s ease-out infinite`,
                                    animationDelay: `${delay}s`,
                                  } as React.CSSProperties}
                                />
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                <div className={`transition-all duration-300 ${hasRecipe ? 'text-gray-300 group-hover:text-yellow-400' : 'text-gray-600'}`}>
                  <div className="text-base font-bold uppercase tracking-wider" style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    letterSpacing: '0.08em',
                    textShadow: hasRecipe && isHovered ? '0 0 10px rgba(250, 204, 21, 0.3)' : 'none'
                  }}>
                    {variation}
                  </div>
                  {hasRecipe && (
                    <div className="text-xs mt-1 text-gray-500 group-hover:text-gray-400 transition-colors">
                      {variation === 'Accordion' || variation === 'Turret' ? 'CAMERA TYPE' :
                       variation === 'Cartoon' || variation === 'Luxury' ? 'BODY STYLE' :
                       variation === 'Wings' || variation === 'Weapons' ? 'TRAIT CLASS' :
                       'VARIATION'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Tooltip for unavailable nodes */}
        {hoveredNode && !hasRecipeForVariation(hoveredNode) && (
          <div 
            className="fixed pointer-events-none z-50 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm border border-red-500/50"
            style={{
              left: `${mousePos.x + 10}px`,
              top: `${mousePos.y - 30}px`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            }}
          >
            ❌ You do not own any recipes down this path
          </div>
        )}
      </>
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
                  background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.6) 0%, rgba(15, 15, 15, 0.6) 100%)',
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
            </div>
            <input
              type="text"
              placeholder="Search variations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none w-64"
            />
          </div>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold uppercase mb-2" style={{
              fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
              fontSize: '28px',
              fontWeight: 900,
              color: '#fab617',
              letterSpacing: '0.15em',
              textShadow: '0 0 20px rgba(250, 182, 23, 0.4)'
            }}>
              SELECT {selectedType?.toUpperCase()} VARIATION
            </h3>
            <div className="inline-block mx-auto mt-3 px-6 py-3 rounded-lg" style={{
              background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(18, 18, 18, 0.9) 100%)',
              border: '2px solid rgba(255, 204, 0, 0.2)',
              boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5), 0 4px 20px rgba(255, 204, 0, 0.1)',
            }}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-500">Path:</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={resetCrafting}
                    className="px-3 py-1 rounded bg-gray-800/50 border border-gray-700 hover:border-yellow-400 transition-all cursor-pointer" 
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#fab617',
                      textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
                    }}
                  >
                    {selectedType?.toUpperCase() || '?'}
                  </button>
                  <span className="text-gray-600 text-xl">→</span>
                  <span className="px-3 py-1 rounded bg-gray-800/30 border border-gray-700/50" style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'rgba(250, 182, 23, 0.5)'
                  }}>?</span>
                  <span className="text-gray-600 text-xl">→</span>
                  <span className="px-3 py-1 rounded bg-gray-800/20 border border-gray-700/30" style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'rgba(250, 182, 23, 0.3)'
                  }}>?</span>
                </div>
              </div>
            </div>
          </div>
          {renderVariationGrid(getBaseVariations(selectedType), selectVariation, true)}
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
            </div>
          </div>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold uppercase mb-2" style={{
              fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
              fontSize: '28px',
              fontWeight: 900,
              color: '#fab617',
              letterSpacing: '0.15em',
              textShadow: '0 0 20px rgba(250, 182, 23, 0.4)'
            }}>
              STYLE SELECTION
            </h3>
            <div className="inline-block mx-auto mt-3 px-6 py-3 rounded-lg" style={{
              background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(18, 18, 18, 0.9) 100%)',
              border: '2px solid rgba(255, 204, 0, 0.2)',
              boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5), 0 4px 20px rgba(255, 204, 0, 0.1)',
            }}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-500">Path:</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={resetCrafting}
                    className="px-3 py-1 rounded bg-gray-800/50 border border-gray-700 hover:border-yellow-400 transition-all cursor-pointer" 
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgba(250, 182, 23, 0.7)',
                      textShadow: '0 0 8px rgba(250, 182, 23, 0.2)'
                    }}
                  >
                    {selectedType?.toUpperCase()}
                  </button>
                  <span className="text-gray-600 text-xl">→</span>
                  <button 
                    onClick={() => {
                      setCurrentCategory('group');
                      setSelectedStyle(null);
                      setSelectedFinal(null);
                    }}
                    className="px-3 py-1 rounded bg-yellow-400/20 border border-yellow-400/50 hover:border-yellow-400 transition-all cursor-pointer" 
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#fab617',
                      textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
                    }}
                  >
                    {selectedVariation}
                  </button>
                  <span className="text-gray-600 text-xl">→</span>
                  <span className="px-3 py-1 rounded bg-gray-800/30 border border-gray-700/50" style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'rgba(250, 182, 23, 0.5)'
                  }}>?</span>
                  <span className="text-gray-600 text-xl">→</span>
                  <span className="px-3 py-1 rounded bg-gray-800/20 border border-gray-700/30" style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'rgba(250, 182, 23, 0.3)'
                  }}>?</span>
                </div>
              </div>
            </div>
          </div>
          {renderVariationGrid(getStyles(selectedType, selectedVariation), selectStyle, true)}
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
          </div>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold uppercase mb-2" style={{
              fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
              fontSize: '28px',
              fontWeight: 900,
              color: '#fab617',
              letterSpacing: '0.15em',
              textShadow: '0 0 20px rgba(250, 182, 23, 0.4)'
            }}>
              FINAL CONFIGURATION
            </h3>
            <div className="inline-block mx-auto mt-3 px-6 py-3 rounded-lg" style={{
              background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(18, 18, 18, 0.9) 100%)',
              border: '2px solid rgba(255, 204, 0, 0.2)',
              boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5), 0 4px 20px rgba(255, 204, 0, 0.1)',
            }}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-500">Path:</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={resetCrafting}
                    className="px-3 py-1 rounded bg-gray-800/50 border border-gray-700 hover:border-yellow-400 transition-all cursor-pointer" 
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgba(250, 182, 23, 0.6)',
                      textShadow: '0 0 6px rgba(250, 182, 23, 0.15)'
                    }}
                  >
                    {selectedType?.toUpperCase()}
                  </button>
                  <span className="text-gray-600 text-xl">→</span>
                  <button 
                    onClick={() => {
                      setCurrentCategory('group');
                      setSelectedStyle(null);
                      setSelectedFinal(null);
                    }}
                    className="px-3 py-1 rounded bg-yellow-400/20 border border-yellow-400/50 hover:border-yellow-400 transition-all cursor-pointer" 
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#fab617',
                      textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
                    }}
                  >
                    {selectedVariation}
                  </button>
                  <span className="text-gray-600 text-xl">→</span>
                  <button 
                    onClick={() => {
                      setCurrentCategory('style');
                      setSelectedFinal(null);
                    }}
                    className="px-3 py-1 rounded bg-yellow-400/15 border border-yellow-400/40 hover:border-yellow-400 transition-all cursor-pointer" 
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgba(250, 182, 23, 0.8)',
                      textShadow: '0 0 8px rgba(250, 182, 23, 0.2)'
                    }}
                  >
                    {selectedStyle}
                  </button>
                  <span className="text-gray-600 text-xl">→</span>
                  <span className="px-3 py-1 rounded bg-gray-800/30 border border-gray-700/50 animate-pulse" style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#fab617',
                    textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
                  }}>?</span>
                </div>
              </div>
            </div>
          </div>
          {renderVariationGrid(
            getFinalVariations(selectedType, selectedVariation, selectedStyle), 
            selectFinalVariation,
            true
          )}
        </>
      )}

      {/* Recipe Display - Redesigned */}
      {showRecipe && selectedFinal && selectedType && selectedVariation && selectedStyle && (
        <div className="relative">
          {/* Back Button */}
          <div className="mb-6">
            <button 
              onClick={goBack}
              className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-lg transition-all border border-gray-700 hover:border-yellow-500"
            >
              ← Back to Selection
            </button>
          </div>

          {/* Main Layout Container */}
          <div className="max-w-7xl mx-auto">
            {/* Header with Title and Collection Stats */}
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold text-yellow-400 mb-2">
                {selectedFinal} {selectedType === 'heads' ? 'Head' : selectedType === 'bodies' ? 'Body' : 'Trait'}
              </h1>
              <div className="text-lg text-gray-400">
                {selectedVariation} → {selectedStyle} → {selectedFinal}
              </div>
              
              {/* Collection Stats */}
              <div className="mt-4 flex justify-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">247</div>
                  <div className="text-sm text-gray-500">In Collection</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">2.4%</div>
                  <div className="text-sm text-gray-500">Of Total Supply</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">Rank B</div>
                  <div className="text-sm text-gray-500">Rarity Tier</div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center mb-6">
              
              {/* Left Panel - Item Details */}
              <div>
                <div 
                  className="p-6 rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.6) 0%, rgba(42, 42, 42, 0.6) 100%)',
                    border: '2px solid #6b7280',
                    boxShadow: '0 4px 20px rgba(107, 114, 128, 0.3)',
                  }}
                >
                  <h3 className="text-2xl font-bold text-yellow-400 mb-3">{selectedFinal} {selectedType === 'heads' ? 'Head' : selectedType === 'bodies' ? 'Body' : 'Trait'}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Your Meks with this slot:</span>
                      <Link 
                        href={`/profile?filter=${selectedFinal}`}
                        className="text-green-400 font-semibold hover:text-green-300 underline cursor-pointer"
                      >
                        3
                      </Link>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Slots filled:</span>
                      <span className="text-yellow-400 font-semibold">2/3</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Panel - Large Variation Image with Nebula */}
              <div className="relative flex items-center justify-center">
                {/* Spinning Underglow Effect */}
                <div 
                  className="absolute rounded-full"
                  style={{
                    width: '320px',
                    height: '320px',
                    background: `
                      conic-gradient(from 0deg at 50% 50%,
                        rgba(250, 182, 23, 0.4) 0deg,
                        rgba(236, 72, 153, 0.3) 60deg,
                        rgba(147, 51, 234, 0.3) 120deg,
                        rgba(59, 130, 246, 0.3) 180deg,
                        rgba(147, 51, 234, 0.3) 240deg,
                        rgba(236, 72, 153, 0.3) 300deg,
                        rgba(250, 182, 23, 0.4) 360deg
                      )`,
                    filter: 'blur(30px)',
                    animation: 'spinGlow 10s linear infinite',
                  }}
                />
                
                {/* Magic Sand Particles */}
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: '3px',
                      height: '3px',
                      background: `radial-gradient(circle, rgba(250, 182, 23, 1) 0%, rgba(250, 182, 23, 0) 70%)`,
                      animationName: 'magicParticle',
                      animationDuration: `${2 + Math.random() * 2}s`,
                      animationTimingFunction: 'ease-out',
                      animationIterationCount: 'infinite',
                      animationDelay: `${i * 0.1}s`,
                      left: '50%',
                      top: '50%',
                      '--angle': `${i * 18}deg`,
                      '--turbulence': `${Math.random() * 20 - 10}px`,
                    } as React.CSSProperties}
                  />
                ))}
                
                {/* Variation Image Container */}
                <div className="relative z-10 w-64 h-64">
                  <div className="w-full h-full bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-full border-4 border-yellow-400/50 shadow-2xl flex items-center justify-center overflow-hidden">
                    {selectedFinal ? (
                      <img 
                        src={`/variation-images/${selectedFinal.toLowerCase().replace(/['\s]/g, '_').replace(/_+/g, '_')}.png`}
                        alt={selectedFinal}
                        className="w-full h-full object-cover scale-110"
                        onError={(e) => {
                          // Fallback to emoji if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`text-6xl ${selectedFinal ? 'hidden' : ''}`}>
                      {selectedType === 'heads' ? '📷' : selectedType === 'bodies' ? '🤖' : '⚡'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Variation Details & Buffs */}
              <div>
                <div 
                  className="p-6 rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.6) 0%, rgba(42, 42, 42, 0.6) 100%)',
                    border: '2px solid #22c55e',
                    boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
                  }}
                >
                  <h3 className="text-xl font-bold text-yellow-400 mb-4">Variation Bonuses</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between pb-2 border-b border-gray-700">
                      <span className="text-gray-400">Bonus Gold Rate</span>
                      <span className="text-white font-semibold">+3.5/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bank Interest Rate</span>
                      <span className="text-green-400">+0.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">CiruTree Gold Discount</span>
                      <span className="text-green-400">-0.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Market Listing Fee</span>
                      <span className="text-green-400">-3%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipe Requirements - Full Width */}
            <div 
              className="p-6 rounded-lg mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.6) 0%, rgba(42, 42, 42, 0.6) 100%)',
                border: '2px solid #6b7280',
                boxShadow: '0 4px 20px rgba(107, 114, 128, 0.3)',
              }}
            >
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Recipe Requirements</h3>
              <div className="space-y-4">
                
                {/* Essence Item 1 - Highest Required (Full Bar Reference) */}
                <div className="relative">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                    <div className="flex-1 max-w-[calc(100%-120px)]">
                      <div className="text-sm font-medium text-white mb-2">Clean Essence</div>
                      <div className="relative h-6 bg-gray-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 relative overflow-hidden"
                          style={{ 
                            width: '100%',
                            boxShadow: '0 0 15px rgba(0, 255, 68, 0.6)',
                          }}
                        >
                          {/* Gleaming Animation - Clipped to green portion */}
                          <div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            style={{
                              animation: 'shimmer 2s linear infinite',
                              clipPath: 'inset(0 0 0 0)',
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">Current: 5</span>
                        <span className="text-xs font-semibold text-white">Required: 5</span>
                      </div>
                    </div>
                    <div className="text-green-500 text-xl">✓</div>
                  </div>
                </div>

                {/* Essence Item 2 - Relative Scale (60% of max) */}
                <div className="relative">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">💎</span>
                    </div>
                    <div className="flex-1 max-w-[calc(100%-60px)]">
                      <div className="text-sm font-medium text-white mb-2">Accordion Essence</div>
                      <div className="relative h-6 bg-gray-900 rounded-full overflow-hidden">
                        {/* Green portion */}
                        <div 
                          className="absolute left-0 h-full bg-green-500 overflow-hidden"
                          style={{ 
                            width: '30%',
                            boxShadow: '0 0 15px rgba(0, 255, 68, 0.6)',
                          }}
                        >
                          <div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            style={{
                              animation: 'shimmer 2s linear infinite',
                            }}
                          />
                        </div>
                        {/* Red portion with inner effect */}
                        <div 
                          className="absolute h-full overflow-hidden"
                          style={{
                            left: '30%',
                            width: '30%',
                            background: 'linear-gradient(90deg, rgba(255, 68, 0, 0.9) 0%, rgba(255, 100, 0, 1) 50%, rgba(255, 68, 0, 0.9) 100%)',
                            boxShadow: '0 0 25px rgba(255, 68, 0, 0.8), inset 0 0 10px rgba(255, 150, 0, 0.5)',
                            animation: 'pulsateStrong 1.2s ease-in-out infinite',
                          }}
                        >
                          <div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/20 to-transparent"
                            style={{
                              animation: 'redPulse 1.5s linear infinite',
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">Current: 1.5</span>
                        <span className="text-xs font-semibold text-white">Required: 3</span>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-black text-xs font-bold rounded-lg transition-all hover:shadow-lg">
                      BUY
                    </button>
                  </div>
                </div>

                {/* Essence Item 3 - Relative Scale (20% of max) */}
                <div className="relative">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">✨</span>
                    </div>
                    <div className="flex-1 max-w-[calc(100%-60px)]">
                      <div className="text-sm font-medium text-white mb-2">Mixed Essence</div>
                      <div className="relative h-6 bg-gray-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 relative overflow-hidden"
                          style={{ 
                            width: '20%',
                            boxShadow: '0 0 15px rgba(0, 255, 68, 0.6)',
                            clipPath: 'inset(0 0 0 0)',
                          }}
                        >
                          {/* Gleaming Animation - Clipped */}
                          <div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            style={{
                              animation: 'shimmer 2s linear infinite',
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">Current: 15</span>
                        <span className="text-xs font-semibold text-white">Required: 1</span>
                      </div>
                    </div>
                    <div className="text-green-500 text-xl">✓</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rarity Bias Graph - Bell Curve with Rank Labels */}
            <div 
              className="p-6 rounded-lg mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.6) 0%, rgba(42, 42, 42, 0.6) 100%)',
                border: '2px solid #8b5cf6',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="text-left flex-1">
                  <p className="text-xs text-gray-400 mb-1">This chart represents your chances to craft at different qualities</p>
                  <div className="text-md text-purple-400">Your Rarity Bias Rating</div>
                </div>
                <div 
                  className="text-4xl font-thin"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6347 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
                    fontFamily: 'Rajdhani, sans-serif',
                    letterSpacing: '0.05em',
                    fontWeight: '200',
                  }}
                >
                  245
                </div>
              </div>
              {/* Bar chart with percentages - from rarity-bias page */}
              <div className="flex items-end justify-center h-64 mb-8 px-4">
                {[
                  { percent: 2, height: 5.7, rank: 'D', color: '#999999' },
                  { percent: 5, height: 14.3, rank: 'C', color: '#87CEEB' },
                  { percent: 18, height: 51.4, rank: 'B', color: '#90EE90' },
                  { percent: 35, height: 100, rank: 'A', color: '#FFF700', active: true },
                  { percent: 22, height: 62.9, rank: 'S', color: '#FFB6C1' },
                  { percent: 10, height: 28.6, rank: 'SS', color: '#DA70D6' },
                  { percent: 5, height: 14.3, rank: 'SSS', color: '#9370DB' },
                  { percent: 2, height: 5.7, rank: 'X', color: '#FF8C00' },
                  { percent: 0.8, height: 2.3, rank: 'XX', color: '#FF6B6B' },
                  { percent: 0.2, height: 0.6, rank: 'XXX', color: '#DC143C' }
                ].map((item, i) => {
                  const maxHeight = 234;
                  const height = Math.max(5, (item.height / 100) * maxHeight);
                  
                  return (
                    <div
                      key={item.rank}
                      className="flex-1 mx-1 relative group transition-all duration-200 hover:brightness-125"
                      style={{
                        height: `${height}px`,
                        background: `linear-gradient(to top, ${item.color}88, ${item.color})`,
                        borderRadius: '4px 4px 0 0',
                        boxShadow: item.active ? `0 0 20px ${item.color}` : `0 0 8px ${item.color}55`
                      }}
                    >
                      <div 
                        className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-black/70 px-1 rounded whitespace-nowrap"
                        style={{ color: item.color }}
                      >
                        {item.percent}%
                      </div>
                      <div 
                        className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 font-bold text-sm"
                        style={{ color: item.color }}
                      >
                        {item.rank}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-300">You are most likely to craft an item in the <span className="text-yellow-400 font-bold">A quality tier</span></p>
              </div>
            </div>

            {/* Craft Button with Requirements Summary */}
            <div className="text-center">
              <div className="mb-4 p-4 bg-gray-900/50 rounded-lg inline-block">
                <div className="grid grid-cols-2 gap-8">
                  {/* Required Column */}
                  <div className="text-left">
                    <h4 className="text-sm text-gray-400 mb-3 font-semibold uppercase tracking-wider">Required</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🪙</span>
                        <span className="text-yellow-400 font-bold">2,500</span>
                        <span className="text-gray-400">Gold</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📦</span>
                        <span className="text-yellow-400 font-bold">5</span>
                        <span className="text-gray-400">Clean Essence</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⚡</span>
                        <span className="text-yellow-400 font-bold">3</span>
                        <span className="text-gray-400">Accordion Essence</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🔧</span>
                        <span className="text-yellow-400 font-bold">1</span>
                        <span className="text-gray-400">Mixed Essence</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rewards Column */}
                  <div className="text-left">
                    <h4 className="text-sm text-gray-400 mb-3 font-semibold uppercase tracking-wider">Rewards</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{selectedType === 'heads' ? '📷' : selectedType === 'bodies' ? '🤖' : '⚡'}</span>
                        <span className="text-green-400 font-bold">{selectedFinal}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-400">•</span>
                        <span className="text-purple-400">+150 XP</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400">•</span>
                        <span className="text-blue-400">+1 Mek Slot</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400">•</span>
                        <span className="text-yellow-400">Scrapyard Essence: +2%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
              {craftSuccess ? (
                <div className="text-2xl font-bold text-green-500 animate-pulse">
                  ✨ Crafting Successful! ✨
                </div>
              ) : (
                <button 
                  className={`btn-particles ${isCrafting ? 'disabled' : ''}`}
                  onClick={(e) => {
                    if (!isCrafting) {
                      handleCraft();
                      e.currentTarget.classList.add('clicked');
                      setTimeout(() => e.currentTarget.classList.remove('clicked'), 600);
                    }
                  }}
                  disabled={isCrafting}
                >
                  <div className="particles-bg"></div>
                  <span className="particles-text">{isCrafting ? 'CRAFTING...' : 'CRAFT'}</span>
                  <div className="particle-container">
                    {[...Array(30)].map((_, i) => (
                      <div
                        key={i}
                        className="particle"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          '--x': `${(Math.random() - 0.5) * 200}px`,
                          '--y': `${(Math.random() - 0.5) * 200}px`,
                          '--duration': `${3 + Math.random() * 3}s`,
                          animationDelay: `${Math.random() * 6}s`
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                </button>
              )}
              </div>
            </div>
          </div>

        </div>
      )}
      
      {/* Add animation keyframes */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05);
          }
        }
        
        
        @keyframes radiateFromEdge {
          0% {
            transform: translate(-50%, -50%);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--endX), var(--endY));
            opacity: 0;
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        
        @keyframes spinGlow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes magicParticle {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-150px) translateX(var(--turbulence)) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes pulsateStrong {
          0%, 100% {
            transform: scaleX(1);
            opacity: 0.9;
          }
          50% {
            transform: scaleX(1.05);
            opacity: 1;
          }
        }
        
        @keyframes redPulse {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
      
      {/* Crafted Item Popup */}
      {showCraftedPopup && craftedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCraftedPopup(false)}>
          <div 
            className="bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-yellow-400 rounded-2xl p-8 max-w-md transform animate-popIn"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 0 50px rgba(255, 204, 0, 0.3)',
              animation: 'popIn 0.3s ease-out'
            }}
          >
            <h2 className="text-3xl font-bold text-yellow-400 text-center mb-6">🎉 Congratulations! 🎉</h2>
            <div className="text-center mb-6">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-green-400 bg-gradient-to-br from-gray-700 to-gray-800"
                style={{
                  boxShadow: '0 0 30px rgba(34, 197, 94, 0.6)'
                }}
              >
                <img 
                  src={getVariationImagePath(craftedItem.name)}
                  alt={craftedItem.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-5xl">${
                        craftedItem.type === 'heads' ? '📷' : craftedItem.type === 'bodies' ? '🤖' : '⚡'
                      }</div>`;
                    }
                  }}
                />
              </div>
              <p className="text-xl text-white mb-2">You have crafted:</p>
              <p className="text-2xl font-bold text-green-400">{craftedItem.name}</p>
              <p className="text-sm text-gray-400 capitalize">{craftedItem.type.slice(0, -1)} Component</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleEquipClick}
                className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg transition-all hover:scale-105"
              >
                EQUIP
              </button>
              <button
                onClick={() => {
                  setShowCraftedPopup(false);
                  resetCrafting();
                }}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
              >
                CONTINUE CRAFTING
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mek Selection Grid */}
      {showMekSelector && craftedItem && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-yellow-400">Select a Mek to Equip {craftedItem.name}</h2>
                <button
                  onClick={() => {
                    setShowMekSelector(false);
                    resetCrafting();
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userMeks.map(mek => {
                  const slotAvailable = 
                    (craftedItem.type === 'heads' && !mek.headFilled) ||
                    (craftedItem.type === 'bodies' && !mek.bodyFilled) ||
                    (craftedItem.type === 'traits' && !mek.traitFilled);
                  
                  return (
                    <div
                      key={mek.id}
                      className="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl border-2 border-gray-600 overflow-hidden transition-all hover:border-yellow-400"
                      style={{
                        opacity: slotAvailable ? 1 : 0.7
                      }}
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold text-white">{mek.name}</h3>
                          <div className="text-xs text-gray-400">ID: {mek.id}</div>
                        </div>
                        
                        {/* Mek Image Placeholder */}
                        <div className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg mb-4 flex items-center justify-center">
                          <span className="text-6xl">🤖</span>
                        </div>
                        
                        {/* Equipment Slots */}
                        <div className="flex justify-around mb-4">
                          <div className="text-center">
                            <div className={`w-12 h-12 rounded-full border-2 ${mek.headFilled ? 'border-gray-600 bg-gray-700' : 'border-green-400'} flex items-center justify-center`}>
                              {mek.headFilled ? '📷' : '➕'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Head</div>
                          </div>
                          <div className="text-center">
                            <div className={`w-12 h-12 rounded-full border-2 ${mek.bodyFilled ? 'border-gray-600 bg-gray-700' : 'border-green-400'} flex items-center justify-center`}>
                              {mek.bodyFilled ? '🤖' : '➕'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Body</div>
                          </div>
                          <div className="text-center">
                            <div className={`w-12 h-12 rounded-full border-2 ${mek.traitFilled ? 'border-gray-600 bg-gray-700' : 'border-green-400'} flex items-center justify-center`}>
                              {mek.traitFilled ? '⚡' : '➕'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Trait</div>
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        {slotAvailable ? (
                          <button
                            onClick={() => handleMekSelect(mek.id)}
                            className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg transition-all hover:scale-105"
                          >
                            SELECT
                          </button>
                        ) : (
                          <div className="w-full px-4 py-3 bg-gray-700 text-gray-400 text-center rounded-lg">
                            {craftedItem.type.slice(0, -1)} Slot Filled
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes popIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}