# Custom Slots System - Comprehensive Documentation

**Purpose:** This document tracks the evolving custom slots system built using the Overlay Editor. This is distinct from the existing essence slot system - custom slots allow creating visual slot layouts with zones and mechanics defined through the overlay editor.

**Status:** Active Development
**Created:** 2025-11-02
**Last Updated:** 2025-11-02

---

## System Overview

The custom slots system allows:
1. **Visual slot design** via the Overlay Editor (`/admin`)
2. **Zone-based positioning** for Mek thumbnails and UI elements
3. **Complex buff mechanics** when Meks are equipped to slots
4. **Flexible slot configurations** saved to database as overlays

---

## Display Zone Types

Zones in the overlay editor define what content appears in specific areas of a slot.

### Current Zone Types (Display Dropdown Options)

#### 1. **Slotted Mek PFP**
- **Purpose:** Shows the profile picture (thumbnail) of the Mek placed in this slot
- **Behavior:**
  - When slot is empty: Shows placeholder or empty state
  - When Mek is slotted: Displays Mek image from `/mek-images/150px/[sourceKey].webp`
- **Use Case:** Primary Mek display area in custom slots
- **Implementation:** Uses `Display Zone` type, renders slotted Mek image at defined position
- **Added:** 2025-11-02

#### 2. **Display Zone** (Generic)
- **Purpose:** Generic display area (existing functionality)
- **Current Use:** Shows Mek images based on positioning data
- **May be deprecated:** Once specific types like "Slotted Mek PFP" are added

---

## Slot Mechanics (To Be Defined)

### Buff System
- **Status:** Not yet implemented
- **Concept:** When a Mek is equipped to a custom slot, it receives buffs based on:
  - Slot type/rarity
  - Mek variations (head/body/trait combinations)
  - Slot upgrade level
  - Other factors TBD

### Slot Upgrades
- **Status:** Not yet defined
- **Concept:** Players can upgrade custom slots to:
  - Increase buff effectiveness
  - Unlock additional zones
  - Add visual enhancements
  - Other mechanics TBD

---

## Technical Implementation

### Database Schema

**Table:** `overlays`
- Stores slot designs created in the overlay editor
- Each slot has:
  - `imageKey`: Unique identifier (e.g., "slot test 1")
  - `imagePath`: Path to base slot image (e.g., `/slots/test 1.png`)
  - `imageWidth`, `imageHeight`: Original image dimensions
  - `zones`: Array of zone definitions

**Zone Object Structure:**
```typescript
{
  id: string,               // Unique zone ID
  mode: "zone" | "sprite",  // Zone vs sprite positioning
  type: string,             // "Display Zone", "Slotted Mek PFP", etc.
  x: number,                // Position (top-left corner)
  y: number,
  width: number,            // Dimensions
  height: number,
  label: string,            // Display label
  metadata: any             // Additional zone-specific data
}
```

### Rendering

**Component:** `src/app/home/page.tsx`
- Custom slots render above existing essence slots
- Uses scaling math to maintain zone positioning across different display sizes
- Scale factor: `displayedWidth / originalImageWidth`
- All positions/dimensions scaled by this factor

**Key Logic:**
```typescript
const displayScale = customSlotSize.width / customSlotOverlayData.imageWidth;
const scaledX = zone.x * displayScale;
const scaledY = zone.y * displayScale;
```

### Overlay Editor

**Location:** `/admin` page
- **Project Management:** Save/load slot designs
- **Zone Creation:** Draw rectangular zones on slot images
- **Zone Configuration:** Set zone type, positioning, metadata
- **Export:** Saves to Convex `overlays` table

---

## Planned Features (To Be Added)

### Additional Zone Types (Future)
- Buff indicator zones
- Stat display zones
- Action button zones (equip/unequip)
- Animation/effect zones
- Multiple Mek display zones (for combo slots?)

### Slot Categories
- **Status:** Not yet defined
- Examples might include:
  - Mining slots (gold generation buffs)
  - Combat slots (battle stat buffs)
  - Crafting slots (variation bonuses)
  - Special slots (unique mechanics)

### Rarity/Unlock System
- Some slots may require unlocking
- Rarity tiers affecting buff strength
- Unlock costs (gold, essence, achievements?)

---

## Open Questions

1. **Buff Calculation:** How are buff values calculated when a Mek is slotted?
2. **Slot Limits:** How many custom slots can a player have active?
3. **Swap Mechanics:** Can players freely swap Meks between custom slots?
4. **Slot Persistence:** Do custom slot designs persist per-player or globally?
5. **Visual Feedback:** How do we show buffs are active (glow effects, stat display)?

---

## Implementation Status

### ✅ Completed
- [x] Basic overlay editor with zone creation
- [x] Save/load overlay designs to database
- [x] Render custom slot on home page
- [x] Scale zone positioning correctly
- [x] Display slotted Mek image in designated zone
- [x] Added "Slotted Mek PFP" zone type concept

### 🔄 In Progress
- [ ] Add "Slotted Mek PFP" to overlay editor dropdown
- [ ] Define buff mechanics
- [ ] Implement slot upgrade system

### 📋 Planned
- [ ] Multiple zone type options in dropdown
- [ ] Slot categorization system
- [ ] Buff calculation and display
- [ ] Player-specific slot configurations
- [ ] Admin tools for slot management

---

## Related Documents

- **ESSENCE_SLOT_BOOST_MECHANICS.md** - Existing essence slot upgrade system (separate from custom slots)
- **SLOTTED_MEKS_CHANGES.md** - Original essence slot implementation
- **ESSENCE_ACCUMULATION_SYSTEM.md** - Account-wide variation upgrades

---

## Development Log

### 2025-11-02: Initial System Setup
- Created custom slot rendering on home page
- Implemented proper zone scaling mathematics
- User requested "Slotted Mek PFP" zone type addition
- Created this documentation file to track evolving requirements

---

*This document will be continuously updated as the custom slots system evolves. All new requirements, mechanics, and changes should be logged here.*
