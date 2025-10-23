# Home Page - Show Only Slotted Mek Variations

## Problem
The triangle currently shows ALL owned Mek variations. It should only show variations from SLOTTED Meks (those generating essence).

## Changes Needed in src/app/home/page.tsx

### 1. Update `ownedVariationNames` (around line 154-183)

**REPLACE:**
```typescript
  // Extract owned variation names from FULL source keys using the complete lookup
  const ownedVariationNames = useMemo(() => {
    const variationSet = new Set<string>();

    ownedMeks.forEach((mek: any) => {
      const sourceKey = mek.sourceKey || mek.sourceKeyBase;
      // Fallback to individual variation fields if sourceKey not available
      const fallback = {
        head: mek.headVariation,
        body: mek.bodyVariation,
        trait: mek.itemVariation
      };

      // Use the complete lookup to get actual variation names
      const variations = getVariationInfoFromFullKey(sourceKey, fallback);

      // Add all three variation names (head, body, trait)
      if (variations.head.name && variations.head.name !== 'Unknown') {
        variationSet.add(variations.head.name.toUpperCase());
      }
      if (variations.body.name && variations.body.name !== 'Unknown') {
        variationSet.add(variations.body.name.toUpperCase());
      }
      if (variations.trait.name && variations.trait.name !== 'Unknown') {
        variationSet.add(variations.trait.name.toUpperCase());
      }
    });

    return variationSet;
  }, [ownedMeks]);
```

**WITH:**
```typescript
  // Extract variation names from SLOTTED Meks only (only slotted Meks generate essence)
  const ownedVariationNames = useMemo(() => {
    const variationSet = new Set<string>();

    // Get only slotted Meks (those actively generating essence)
    const slottedMeks = essenceState?.slots?.filter((slot: any) => slot.mekAssetId) || [];

    slottedMeks.forEach((slot: any) => {
      // Slot data already has variation names directly
      if (slot.headVariationName) {
        variationSet.add(slot.headVariationName.toUpperCase());
      }
      if (slot.bodyVariationName) {
        variationSet.add(slot.bodyVariationName.toUpperCase());
      }
      if (slot.itemVariationName) {
        variationSet.add(slot.itemVariationName.toUpperCase());
      }
    });

    return variationSet;
  }, [essenceState]);
```

### 2. Update `getOwnedCount` (around line 189-214)

**REPLACE:**
```typescript
  // Count how many of each specific variation the user owns using full key lookup
  const getOwnedCount = (variationName: string, variationType: string) => {
    let count = 0;
    const normalizedName = variationName.toUpperCase();

    ownedMeks.forEach((mek: any) => {
      const sourceKey = mek.sourceKey || mek.sourceKeyBase;
      const fallback = {
        head: mek.headVariation,
        body: mek.bodyVariation,
        trait: mek.itemVariation
      };

      const variations = getVariationInfoFromFullKey(sourceKey, fallback);

      // Check if this Mek has the variation we're looking for
      if (variationType === 'head' && variations.head.name.toUpperCase() === normalizedName) {
        count++;
      } else if (variationType === 'body' && variations.body.name.toUpperCase() === normalizedName) {
        count++;
      } else if (variationType === 'trait' && variations.trait.name.toUpperCase() === normalizedName) {
        count++;
      }
    });

    return count;
  };
```

**WITH:**
```typescript
  // Count how many slotted Meks have this variation
  const getOwnedCount = (variationName: string, variationType: string) => {
    let count = 0;
    const normalizedName = variationName.toUpperCase();

    // Only count from slotted Meks
    const slottedMeks = essenceState?.slots?.filter((slot: any) => slot.mekAssetId) || [];

    slottedMeks.forEach((slot: any) => {
      // Check if this slot has the variation we're looking for
      if (variationType === 'head' && slot.headVariationName?.toUpperCase() === normalizedName) {
        count++;
      } else if (variationType === 'body' && slot.bodyVariationName?.toUpperCase() === normalizedName) {
        count++;
      } else if (variationType === 'trait' && slot.itemVariationName?.toUpperCase() === normalizedName) {
        count++;
      }
    });

    return count;
  };
```

### 3. Update `variationBreakdown` (around line 281-334)

**REPLACE:**
```typescript
  // Get detailed variation breakdown using full key lookup
  const variationBreakdown = useMemo(() => {
    const breakdown: { [key: string]: { name: string; type: string; count: number }[] } = {
      head: [],
      body: [],
      trait: []
    };

    ownedMeks.forEach((mek: any) => {
      const sourceKey = mek.sourceKey || mek.sourceKeyBase;
      const fallback = {
        head: mek.headVariation,
        body: mek.bodyVariation,
        trait: mek.itemVariation
      };

      const variations = getVariationInfoFromFullKey(sourceKey, fallback);

      // Count head variation
      if (variations.head.name !== 'Unknown') {
        const existing = breakdown.head.find(v => v.name === variations.head.name);
        if (existing) {
          existing.count++;
        } else {
          breakdown.head.push({ name: variations.head.name, type: 'head', count: 1 });
        }
      }

      // Count body variation
      if (variations.body.name !== 'Unknown') {
        const existing = breakdown.body.find(v => v.name === variations.body.name);
        if (existing) {
          existing.count++;
        } else {
          breakdown.body.push({ name: variations.body.name, type: 'body', count: 1 });
        }
      }

      // Count trait variation
      if (variations.trait.name !== 'Unknown') {
        const existing = breakdown.trait.find(v => v.name === variations.trait.name);
        if (existing) {
          existing.count++;
        } else {
          breakdown.trait.push({ name: variations.trait.name, type: 'trait', count: 1 });
        }
      }
    });

    // Sort each type by count descending
    Object.keys(breakdown).forEach(type => {
      breakdown[type].sort((a, b) => b.count - a.count);
    });

    return breakdown;
  }, [ownedMeks]);
```

**WITH:**
```typescript
  // Get detailed variation breakdown for SLOTTED Meks only
  const variationBreakdown = useMemo(() => {
    const breakdown: { [key: string]: { name: string; type: string; count: number }[] } = {
      head: [],
      body: [],
      trait: []
    };

    // Only count slotted Meks
    const slottedMeks = essenceState?.slots?.filter((slot: any) => slot.mekAssetId) || [];

    slottedMeks.forEach((slot: any) => {
      // Count head variation
      if (slot.headVariationName) {
        const existing = breakdown.head.find(v => v.name === slot.headVariationName);
        if (existing) {
          existing.count++;
        } else {
          breakdown.head.push({ name: slot.headVariationName, type: 'head', count: 1 });
        }
      }

      // Count body variation
      if (slot.bodyVariationName) {
        const existing = breakdown.body.find(v => v.name === slot.bodyVariationName);
        if (existing) {
          existing.count++;
        } else {
          breakdown.body.push({ name: slot.bodyVariationName, type: 'body', count: 1 });
        }
      }

      // Count trait variation
      if (slot.itemVariationName) {
        const existing = breakdown.trait.find(v => v.name === slot.itemVariationName);
        if (existing) {
          existing.count++;
        } else {
          breakdown.trait.push({ name: slot.itemVariationName, type: 'trait', count: 1 });
        }
      }
    });

    // Sort each type by count descending
    Object.keys(breakdown).forEach(type => {
      breakdown[type].sort((a, b) => b.count - a.count);
    });

    return breakdown;
  }, [essenceState]);
```

### 4. Update Debug Panel Title (around line 322)

**REPLACE:**
```typescript
            📊 Owned Variations ({ownedMeks.length} Meks × 3 = {ownedMeks.length * 3} total variations)
```

**WITH:**
```typescript
            📊 Active Variations ({(essenceState?.slots?.filter((s: any) => s.mekAssetId) || []).length} Slotted Meks)
```

### 5. Update Description Text (around line 325-326)

**REPLACE:**
```typescript
            Showing specific variation names extracted from Mek source keys using the complete rarity master data.
            Triangle sprites will light up for variations you own.
```

**WITH:**
```typescript
            Showing variations from SLOTTED Meks only (those generating essence).
            Triangle sprites light up for variations in your active slots.
```

## Result
After these changes, the triangle will only show sprites for variations that are in slotted Meks, not all owned Meks.
