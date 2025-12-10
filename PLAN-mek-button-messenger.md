# MEK Button Messenger System - Implementation Plan

## Overview
Add a "MEK" button to the messaging compose area that allows users to share verified Mek ownership in chat. When a Mek is shared this way, it proves the sender owns that Mek (vs just uploading a random image).

---

## Key Requirements

### 1. MEK Button in Compose Area
- Located next to the existing "+" attachment button
- Opens a Mek selector lightbox when clicked

### 2. Mek Selector Lightbox
- Shows grid of all Meks owned by the user
- Search/filter functionality (auto-filters as you type):
  - By Mek number (assetId)
  - By custom name (if named)
  - By variation name (head, body, trait) - e.g., "Bumblebee"
- Click a Mek to attach it to the message

### 3. Verified Mek Messages
- Visually distinct from regular image uploads
- Shows "Verified Mekanism" indicator
- Different border/styling to indicate ownership proof
- Clickable to open detail view

### 4. Mek Detail Lightbox (Reusable)
- Shows when clicking a Mek image in chat
- Displays:
  - Large Mek image
  - Mek number (#1234)
  - Rank (e.g., #156 of 3333)
  - Head variation + rarity count (e.g., "Bumblebee - 12 exist")
  - Body variation + rarity count
  - Trait variation + rarity count
- **Reusable**: Same component used in Listings tab and Messenger

---

## Implementation Phases

### Phase 1: Mek Detail Lightbox (Reusable Component)
**File**: `src/components/MekDetailLightbox.tsx`

**Why first**: This component is needed by both the messenger and listings page, so building it first allows reuse.

**Props**:
```typescript
interface MekDetailLightboxProps {
  mek: {
    assetId: string;
    sourceKey: string;
    headVariation: string;
    bodyVariation: string;
    traitVariation: string;
    name?: string;
    rank?: number;
  };
  isOpen: boolean;
  onClose: () => void;
}
```

**Features**:
- Portal-based modal (renders at document.body)
- Large Mek image (500px version)
- Mek number display
- Rank display (if available)
- Three variation rows with:
  - Variation name
  - Rarity count from COMPLETE_VARIATION_RARITY data
- Glass/industrial styling matching existing lightboxes
- Click outside or X to close

**Data Source for Rarity**:
- Use `COMPLETE_VARIATION_RARITY` from `/src/lib/completeVariationRarity.ts`
- Lookup by variation name to get `count` field

---

### Phase 2: Mek Selector Lightbox
**File**: `src/components/MekSelectorLightbox.tsx`

**Props**:
```typescript
interface MekSelectorLightboxProps {
  walletAddress: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mek: SelectedMek) => void;
}

interface SelectedMek {
  assetId: string;
  sourceKey: string;
  headVariation: string;
  bodyVariation: string;
  traitVariation: string;
  name?: string;
}
```

**Features**:
- Query user's owned Meks from database
- Search input at top with auto-filter
- Grid layout (responsive, ~4-6 columns)
- Each Mek shows:
  - Thumbnail image (150px)
  - Mek number
  - Name (if exists)
- Click selects and closes lightbox

**Search Logic**:
Filter Meks where ANY of these match the search query:
- `assetId` contains query
- `name` contains query (case-insensitive)
- `headVariation` contains query
- `bodyVariation` contains query
- `traitVariation` contains query

**Query Needed**:
- Existing: `api.meks.getOwnedMeks` or similar
- May need to add variation names to the meks table or join with variation data

---

### Phase 3: Backend - Mek Attachment Support
**File**: `convex/schema.ts` and `convex/messaging.ts`

**Schema Changes**:
Add to messages table (or create separate attachment type):
```typescript
// In messages, add optional mekAttachment field
mekAttachment: v.optional(v.object({
  assetId: v.string(),
  sourceKey: v.string(),
  headVariation: v.string(),
  bodyVariation: v.string(),
  traitVariation: v.string(),
  name: v.optional(v.string()),
  // Snapshot of ownership at send time
  verifiedOwner: v.string(), // wallet address
  verifiedAt: v.number(), // timestamp
})),
```

**New/Modified Mutations**:
- `sendMessageWithMek`: Verify ownership, then send message with mekAttachment
  - Query meks table to confirm sender owns this assetId
  - If verified, attach mek data to message
  - Store snapshot of mek details (in case mek is later sold/transferred)

**Verification Logic**:
```typescript
// In sendMessageWithMek mutation:
const mek = await ctx.db
  .query("meks")
  .withIndex("by_asset_id", q => q.eq("assetId", args.mekAssetId))
  .first();

if (!mek || mek.owner !== args.senderWallet) {
  throw new Error("You don't own this Mek");
}

// Proceed to create message with verified mekAttachment
```

---

### Phase 4: Integrate MEK Button into MessagingSystem
**File**: `src/components/MessagingSystem.tsx`

**Changes**:
1. Add state: `const [showMekSelector, setShowMekSelector] = useState(false);`

2. Add MEK button next to attachment button:
```tsx
<button
  onClick={() => setShowMekSelector(true)}
  className="px-2 py-1 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30"
>
  MEK
</button>
```

3. Add MekSelectorLightbox component at bottom of file

4. Handle selection:
```tsx
const handleMekSelect = async (mek: SelectedMek) => {
  setShowMekSelector(false);
  // Send message with mek attachment
  await sendMessageWithMek({
    conversationId: selectedConversationId,
    senderWallet: walletAddress,
    mekAssetId: mek.assetId,
    content: "", // Optional text can be added
  });
};
```

---

### Phase 5: Display Mek Messages in Chat
**File**: `src/components/MessagingSystem.tsx`

**In message rendering**:
```tsx
{msg.mekAttachment && (
  <div className="mt-2">
    <button
      onClick={() => setDetailLightboxMek(msg.mekAttachment)}
      className="block border-2 border-yellow-500/50 rounded-lg overflow-hidden hover:border-yellow-400 transition-colors"
    >
      <img
        src={`/mek-images/150px/${cleanSourceKey(msg.mekAttachment.sourceKey)}.webp`}
        alt={`Mek #${msg.mekAttachment.assetId}`}
        className="w-[150px] h-[150px] object-cover"
      />
    </button>
    <div className="flex items-center gap-1 mt-1 text-xs text-yellow-400">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
      </svg>
      <span>Verified Mekanism</span>
    </div>
  </div>
)}
```

**Styling Distinction from Regular Images**:
- Yellow/gold border (ownership verification color)
- "Verified Mekanism" badge with checkmark
- Different hover effect
- Optional: subtle glow effect

---

### Phase 6: Add MekDetailLightbox to Message View
**File**: `src/components/MessagingSystem.tsx`

**Add state**:
```tsx
const [detailLightboxMek, setDetailLightboxMek] = useState<MekAttachment | null>(null);
```

**Add component**:
```tsx
{detailLightboxMek && (
  <MekDetailLightbox
    mek={detailLightboxMek}
    isOpen={!!detailLightboxMek}
    onClose={() => setDetailLightboxMek(null)}
  />
)}
```

---

## Data Requirements

### Meks Table Fields Needed
Current fields (verify these exist):
- `assetId` - Unique identifier
- `owner` - Wallet address of current owner
- `sourceKey` - For image path (e.g., "AA1-BC2-DE3")
- `name` - Optional custom name

**May need to add or query**:
- `headVariation` - Name of head variation
- `bodyVariation` - Name of body variation
- `traitVariation` - Name of trait variation
- `rank` - Rarity rank (1-3333)

If variations aren't stored directly, we can:
1. Parse from sourceKey using variation mapping
2. Or add these fields to meks table

### Variation Rarity Data
Already exists in: `/src/lib/completeVariationRarity.ts`
- `COMPLETE_VARIATION_RARITY` array has all 291 variations
- Each has: id, name, type, sourceKey, count, percentage, tier, rank

---

## File Summary

### New Files
1. `src/components/MekDetailLightbox.tsx` - Reusable Mek detail view
2. `src/components/MekSelectorLightbox.tsx` - Mek picker for messaging

### Modified Files
1. `convex/schema.ts` - Add mekAttachment to messages
2. `convex/messaging.ts` - Add sendMessageWithMek mutation
3. `src/components/MessagingSystem.tsx` - Add MEK button and display logic

### Potentially Modified
1. Listings page - Replace existing lightbox with MekDetailLightbox

---

## Visual Mockup (Text Description)

### MEK Button Location
```
[+] [MEK] [____Type a message..._____] [>]
 ^    ^                                  ^
 |    |                                  Send
 |    New MEK button (yellow styling)
 Existing attachment button
```

### Mek Selector Lightbox
```
+------------------------------------------+
|  Select a Mekanism                    X  |
+------------------------------------------+
|  [Search by name, number, variation...]  |
+------------------------------------------+
|  +------+  +------+  +------+  +------+  |
|  | IMG  |  | IMG  |  | IMG  |  | IMG  |  |
|  | #123 |  | #456 |  | #789 |  | #012 |  |
|  +------+  +------+  +------+  +------+  |
|  +------+  +------+  +------+  +------+  |
|  | IMG  |  | IMG  |  | IMG  |  | IMG  |  |
|  | #345 |  | #678 |  | #901 |  | #234 |  |
|  +------+  +------+  +------+  +------+  |
+------------------------------------------+
```

### Verified Mek in Chat
```
+------------------+
|    [MEK IMAGE]   |  <- Yellow border
|                  |
+------------------+
  ✓ Verified Mekanism
```

### Mek Detail Lightbox (on click)
```
+----------------------------------------+
|                                     X  |
|         +------------------+           |
|         |                  |           |
|         |   [LARGE MEK]    |           |
|         |     500px        |           |
|         |                  |           |
|         +------------------+           |
|                                        |
|         Mekanism #1234                 |
|         Rank #156 of 3333              |
|                                        |
|  Head:  Bumblebee         (12 exist)   |
|  Body:  Chrome            (45 exist)   |
|  Trait: Disco Ball        (8 exist)    |
|                                        |
+----------------------------------------+
```

---

## Implementation Order

1. **Phase 1**: MekDetailLightbox (reusable component)
2. **Phase 2**: MekSelectorLightbox (picker UI)
3. **Phase 3**: Backend changes (schema + mutation)
4. **Phase 4**: MEK button in compose area
5. **Phase 5**: Display verified Meks in chat
6. **Phase 6**: Wire up detail lightbox on click

---

## Research Findings

### Database Schema (Already Has Everything!)
The `meks` table already has all required fields:
- `assetId` - Unique identifier
- `customName` - Player-assigned name (optional)
- `headVariation`, `bodyVariation`, `itemVariation` - Variation names
- `rarityRank`, `gameRank` - Ranking data
- `sourceKey`, `sourceKeyBase` - For image paths
- `ownerStakeAddress` - Owner identification for verification
- Indexes exist for efficient querying

### Existing Component: MekDetailsSpaceAge.tsx
**GREAT NEWS**: There's already a `MekDetailsSpaceAge` component that we can reuse!
- Located at: `src/components/MekDetailsSpaceAge.tsx`
- Already shows: Large Mek image, variations with counts, Space Age styling
- Uses `getVariationInfoFromFullKey()` to parse variation data
- Portal-based modal with backdrop blur
- Props: `isOpen`, `onClose`, `mek`, `corporationName`

**Plan Update**: We can directly use `MekDetailsSpaceAge` for the detail lightbox when clicking a Mek in chat. No need to create a new component!

---

## Questions to Confirm

1. **Message content**: When sending a Mek, should users also be able to include text, or is it Mek-only?

2. **Multiple Meks**: Can a user send multiple Meks in one message, or one at a time?
