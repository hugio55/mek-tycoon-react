# Mek Profile Page - Wireframe Layout Options

## Option 1: Hero-Centered Layout

### Desktop Layout (1024px+)
```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER/NAV                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│    ┌──────────────────┐     ┌───────────────────────────────┐  │
│    │                  │     │  Level: 25                     │  │
│    │   LARGE MEK      │     │  ════════════░░░░░  75%        │  │
│    │   IMAGE          │     │                                 │  │
│    │   (400x400)      │     │  Gold Production:              │  │
│    │                  │     │  • Current: 1250/hr            │  │
│    │                  │     │  • Base: 1000/hr               │  │
│    └──────────────────┘     │  • Bonus: +250/hr              │  │
│                              │  • Total: 1250/hr              │  │
│    Mek #4521                 │                                 │  │
│    MekTech Corp              │  Cumulative Gold:              │  │
│    Employee: "Rusty"         │  • Corporation: 450,000g       │  │
│                              │  • Lifetime: 2,300,000g        │  │
│                              │                                 │  │
│                              │  Status: Active Employee ✓     │  │
│                              │  Rank: #1,243                  │  │
│                              └───────────────────────────────┘  │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                  THREE VARIATION CARDS (ROW)                     │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ [Head Img]   │  │ [Body Img]   │  │ [Trait Img]  │         │
│  │              │  │              │  │              │         │
│  │ "Bumblebee"  │  │ "Rust"       │  │ "Welding"    │         │
│  │              │  │              │  │              │         │
│  │ 45 of 4000   │  │ 89 of 2500   │  │ 12 of 1500   │         │
│  │              │  │              │  │              │         │
│  │ Base: 500    │  │ Base: 300    │  │ Base: 150    │         │
│  │ Bonus: +50   │  │ Bonus: +30   │  │ Bonus: +15   │         │
│  │ Total: 550   │  │ Total: 330   │  │ Total: 165   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                      ABILITIES SECTION                           │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │                    TALENT TREE / NODE MAP                   │ │
│  │                                                             │ │
│  │                      [Visual nodes here]                    │ │
│  │                                                             │ │
│  │                                                             │ │
│  │                                                             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px)
```
┌─────────────────┐
│   HEADER/NAV    │
├─────────────────┤
│                 │
│  ┌───────────┐  │
│  │   LARGE   │  │
│  │    MEK    │  │
│  │   IMAGE   │  │
│  └───────────┘  │
│                 │
│   Mek #4521     │
│   MekTech Corp  │
│   "Rusty"       │
│                 │
├─────────────────┤
│  Level: 25      │
│  ═════░░░ 75%   │
├─────────────────┤
│ Gold Production │
│ • Current: 1250 │
│ • Base: 1000    │
│ • Bonus: +250   │
│ • Total: 1250   │
│                 │
│ Cumulative Gold │
│ • Corp: 450k    │
│ • Life: 2.3M    │
│                 │
│ Status: Active✓ │
│ Rank: #1,243    │
├─────────────────┤
│ VARIATION CARDS │
│ (STACKED)       │
│                 │
│ ┌─────────────┐ │
│ │ [Head Img]  │ │
│ │ "Bumblebee" │ │
│ │ 45 of 4000  │ │
│ │ Essence:    │ │
│ │ Base: 500   │ │
│ │ Bonus: +50  │ │
│ │ Total: 550  │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │ [Body Img]  │ │
│ │ "Rust"      │ │
│ │ 89 of 2500  │ │
│ │ (etc...)    │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │ [Trait Img] │ │
│ │ "Welding"   │ │
│ │ (etc...)    │ │
│ └─────────────┘ │
│                 │
├─────────────────┤
│ ABILITIES       │
│ ┌─────────────┐ │
│ │ TALENT TREE │ │
│ │   (Tall)    │ │
│ │             │ │
│ └─────────────┘ │
└─────────────────┘
```

### Pros:
- **Clear focal point**: Large Mek image immediately draws attention
- **Logical info hierarchy**: Hero → Stats → Variations → Abilities
- **Good use of horizontal space** on desktop
- **Clean mobile transformation**: Natural vertical stacking

### Cons:
- Variation cards pushed below fold on desktop
- Stats panel might feel cramped next to large hero image
- Abilities section is last (requires scrolling on both desktop and mobile)

---

## Option 2: Dashboard-Style Grid Layout

### Desktop Layout (1024px+)
```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER/NAV                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────┐  ┌────────────────────────────────────────┐ │
│  │               │  │  Mek #4521 - MekTech Corp              │ │
│  │   MEK IMAGE   │  │  Employee: "Rusty"                     │ │
│  │   (300x300)   │  │                                         │ │
│  │               │  │  Level: 25  ════════░░░ 75%            │ │
│  │               │  │                                         │ │
│  └───────────────┘  │  Status: Active ✓  |  Rank: #1,243    │ │
│                      └────────────────────────────────────────┘ │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ HEAD         │  │ BODY         │  │ TRAIT        │         │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │         │
│  │ │ [Image]  │ │  │ │ [Image]  │ │  │ │ [Image]  │ │         │
│  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │         │
│  │ "Bumblebee"  │  │ "Rust"       │  │ "Welding"    │         │
│  │ 45 of 4000   │  │ 89 of 2500   │  │ 12 of 1500   │         │
│  │              │  │              │  │              │         │
│  │ Base: 500    │  │ Base: 300    │  │ Base: 150    │         │
│  │ Bonus: +50   │  │ Bonus: +30   │  │ Bonus: +15   │         │
│  │ Total: 550   │  │ Total: 330   │  │ Total: 165   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
├──────────────────────────┬──────────────────────────────────────┤
│                          │                                       │
│  GOLD PRODUCTION         │      ABILITIES SECTION                │
│                          │                                       │
│  Current: 1250/hr        │  ┌──────────────────────────────┐   │
│  Base: 1000/hr           │  │                              │   │
│  Bonus: +250/hr          │  │      TALENT TREE / NODES     │   │
│  Total: 1250/hr          │  │                              │   │
│                          │  │                              │   │
│  CUMULATIVE GOLD         │  │                              │   │
│                          │  │                              │   │
│  Corporation: 450,000g   │  │                              │   │
│  Lifetime: 2,300,000g    │  └──────────────────────────────┘   │
│                          │                                       │
└──────────────────────────┴──────────────────────────────────────┘
```

### Mobile Layout (< 768px)
```
┌─────────────────┐
│   HEADER/NAV    │
├─────────────────┤
│  ┌───────────┐  │
│  │MEK IMAGE  │  │
│  │ (200x200) │  │
│  └───────────┘  │
│                 │
│ Mek #4521       │
│ MekTech Corp    │
│ "Rusty"         │
│                 │
│ Level 25        │
│ ════░░░ 75%     │
│                 │
│ Active ✓        │
│ Rank: #1,243    │
├─────────────────┤
│ HEAD VARIATION  │
│ ┌─────────────┐ │
│ │  [Image]    │ │
│ │ "Bumblebee" │ │
│ │ 45 of 4000  │ │
│ │ Base: 500   │ │
│ │ Bonus: +50  │ │
│ │ Total: 550  │ │
│ └─────────────┘ │
├─────────────────┤
│ BODY VARIATION  │
│ ┌─────────────┐ │
│ │  [Image]    │ │
│ │ "Rust"      │ │
│ │ (etc...)    │ │
│ └─────────────┘ │
├─────────────────┤
│ TRAIT VARIATION │
│ ┌─────────────┐ │
│ │  [Image]    │ │
│ │ "Welding"   │ │
│ │ (etc...)    │ │
│ └─────────────┘ │
├─────────────────┤
│ GOLD PRODUCTION │
│ Current: 1250   │
│ Base: 1000      │
│ Bonus: +250     │
│ Total: 1250     │
│                 │
│ CUMULATIVE      │
│ Corp: 450k      │
│ Life: 2.3M      │
├─────────────────┤
│ ABILITIES       │
│ ┌─────────────┐ │
│ │TALENT TREE  │ │
│ │             │ │
│ └─────────────┘ │
└─────────────────┘
```

### Pros:
- **Variation cards prominently featured** in middle section
- **Efficient use of space**: Grid layout maximizes screen real estate
- **Good balance**: Hero info + variations + stats + abilities all visible
- **Abilities section visible** without scrolling on desktop

### Cons:
- More complex responsive transformation
- Gold stats and abilities competing for attention at bottom
- Slightly smaller Mek hero image to fit layout
- Mobile becomes quite long with stacked elements

---

## Option 3: Sidebar Layout (Information-Dense)

### Desktop Layout (1024px+)
```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER/NAV                               │
├────────────────────┬────────────────────────────────────────────┤
│                    │                                             │
│  SIDEBAR           │         MAIN CONTENT AREA                  │
│                    │                                             │
│  ┌──────────────┐ │  ┌────────────────────────────────────────┐│
│  │              │ │  │  THREE VARIATION CARDS (HORIZONTAL)    ││
│  │  MEK IMAGE   │ │  │                                         ││
│  │  (250x250)   │ │  │  ┌──────┐  ┌──────┐  ┌──────┐         ││
│  │              │ │  │  │ HEAD │  │ BODY │  │TRAIT │         ││
│  └──────────────┘ │  │  │[Img] │  │[Img] │  │[Img] │         ││
│                    │  │  │      │  │      │  │      │         ││
│  Mek #4521         │  │  │"Bum" │  │"Rust"│  │"Weld"│         ││
│  MekTech Corp      │  │  │45/400│  │89/250│  │12/150│         ││
│  "Rusty"           │  │  │      │  │      │  │      │         ││
│                    │  │  │B:500 │  │B:300 │  │B:150 │         ││
│  Level: 25         │  │  │+50   │  │+30   │  │+15   │         ││
│  ════════░░░ 75%   │  │  │=550  │  │=330  │  │=165  │         ││
│                    │  │  └──────┘  └──────┘  └──────┘         ││
│  GOLD PRODUCTION   │  └────────────────────────────────────────┘│
│  Current: 1250/hr  │                                             │
│  Base: 1000/hr     │  ┌────────────────────────────────────────┐│
│  Bonus: +250/hr    │  │                                         ││
│  Total: 1250/hr    │  │         ABILITIES SECTION              ││
│                    │  │                                         ││
│  CUMULATIVE GOLD   │  │    ┌────────────────────────────┐      ││
│  Corp: 450,000g    │  │    │                            │      ││
│  Life: 2,300,000g  │  │    │     TALENT TREE / NODES    │      ││
│                    │  │    │                            │      ││
│  Status: Active ✓  │  │    │                            │      ││
│  Rank: #1,243      │  │    │                            │      ││
│                    │  │    │                            │      ││
└────────────────────┘  │    └────────────────────────────┘      ││
                        │                                         ││
                        └────────────────────────────────────────┘│
                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px)
```
┌─────────────────┐
│   HEADER/NAV    │
├─────────────────┤
│  ┌───────────┐  │
│  │MEK IMAGE  │  │
│  │ (180x180) │  │
│  └───────────┘  │
│                 │
│ Mek #4521       │
│ MekTech Corp    │
│ "Rusty"         │
│                 │
│ Lvl 25 ═══░ 75% │
│                 │
│ Active ✓        │
│ Rank: #1,243    │
│                 │
│ Gold Production │
│ Current: 1250   │
│ Base: 1000      │
│ Bonus: +250     │
│ Total: 1250     │
│                 │
│ Cumulative      │
│ Corp: 450k      │
│ Life: 2.3M      │
├─────────────────┤
│ VARIATIONS      │
│                 │
│ ┌─────────────┐ │
│ │HEAD: "Bum"  │ │
│ │[Image]      │ │
│ │45/4000      │ │
│ │B:500 +50    │ │
│ │Total: 550   │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │BODY: "Rust" │ │
│ │[Image]      │ │
│ │(etc...)     │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │TRAIT:"Weld" │ │
│ │[Image]      │ │
│ │(etc...)     │ │
│ └─────────────┘ │
├─────────────────┤
│ ABILITIES       │
│ ┌─────────────┐ │
│ │TALENT TREE  │ │
│ │             │ │
│ │             │ │
│ └─────────────┘ │
└─────────────────┘
```

### Pros:
- **All key stats in one sidebar**: Easy to scan basic info
- **Variation cards front and center** in main content area
- **Abilities get maximum width** for complex node visualization
- **Clean information architecture**: Identity/stats separate from variations/abilities

### Cons:
- Sidebar layout less common for profile pages
- Smaller Mek image to fit in sidebar
- On mobile, stats come before variations (potentially wrong hierarchy)
- More dramatic responsive transformation required

---

## Recommendation Summary

**For most users, Option 2 (Dashboard-Style Grid) is likely best:**
- Variation cards are prominently featured (they contain the most detailed info)
- Efficient use of space on desktop
- Good balance of all elements
- Abilities section visible without scrolling

**Option 1 is best if:**
- You want the Mek hero image to be the absolute star of the page
- You prefer simpler responsive transformations
- You don't mind scrolling to see variations

**Option 3 is best if:**
- You want quick access to all stats in one place (sidebar)
- Abilities section needs maximum horizontal space
- You prefer information-dense layouts

All three options maintain clear information hierarchy and work well on both desktop and mobile devices.
