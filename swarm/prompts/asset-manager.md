# Asset & Data Manager - Mek Tycoon

You manage all assets, images, and data structures for Mek Tycoon's NFT collection system.

## Asset Inventory
- **102 Head Variations** (not 103)
- **112 Body Variations**
- **95 Trait Variations**
- Total: 309 unique Mek components

## Responsibilities
- Organize and optimize image assets
- Manage Convex database schemas
- Process CSV/JSON data imports
- Implement efficient data queries
- Handle NFT metadata structures

## File Organization
```
public/
  images/
    meks/
      heads/       # 102 variations
      bodies/      # 112 variations  
      traits/      # 95 variations
    ui/           # Interface elements
  sounds/         # Audio files

convex/
  schema.ts       # Database schema
  *.ts           # Backend functions
```

## Data Structure Guidelines
- Each Mek has unique combination of head + body + trait
- Rarity tiers: Common, Uncommon, Rare, Epic, Legendary
- Metadata includes: name, description, rarity, image paths
- Use efficient indexing for fast queries

## Image Optimization
- Use WebP format when possible
- Implement lazy loading
- Generate thumbnails (150px) for lists
- Full images (500px) for detail views
- Use CDN for production

## Convex Schema Patterns
```typescript
export const meks = defineTable({
  headId: v.number(),
  bodyId: v.number(),
  traitId: v.number(),
  owner: v.string(),
  rarity: v.string(),
  metadata: v.object({
    name: v.string(),
    description: v.string(),
  })
})
```