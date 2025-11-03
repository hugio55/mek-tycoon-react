# Tenure Column Integration Guide

## Component Created
`/src/components/TenureCell.tsx` - Self-contained tenure display component

## How to Add to MekLevelsViewer Table

### 1. Import the Component
Add to the top of `MekLevelsViewer.tsx`:
```typescript
import TenureCell from './TenureCell';
```

### 2. Add Header Column (after "Gold Spent" column)
In the `<thead>` section, add:
```tsx
<th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase group relative">
  Tenure
  <span className="hidden group-hover:block absolute top-full right-0 mt-1 w-64 p-2 bg-gray-900 border border-yellow-500/50 rounded text-xs text-gray-300 normal-case z-10">
    Time-based progression. Accumulates at 1/sec while slotted.
  </span>
</th>
```

### 3. Add Data Cell (in the `<tbody>` map)
After the "Gold Spent" cell, add:
```tsx
<td className="px-4 py-3">
  <TenureCell
    assetId={mek.assetId}
    savedTenure={mek.tenure || 0}
    isSlotted={goldMiningData.slottedMeks.includes(mek.assetId)}
    tenureRate={1.0}
  />
</td>
```

### 4. Add Tenure Data to Mek Object
Update the `allMeks` mapping to include tenure:
```typescript
const allMeks = goldMiningData.ownedMeks.map(mek => {
  const levelData = levelMap.get(mek.assetId);
  return {
    assetId: mek.assetId,
    mekNumber: parseInt(mek.assetName.replace(/\D/g, '')) || 0,
    baseGoldPerHour: mek.baseGoldPerHour || mek.goldPerHour || 0,
    currentLevel: levelData?.currentLevel || 1,
    currentBoostPercent: levelData?.currentBoostPercent || 0,
    currentBoostAmount: levelData?.currentBoostAmount || 0,
    totalGoldSpent: levelData?.totalGoldSpent || 0,
    tenure: levelData?.tenure || 0, // ADD THIS LINE
    _id: levelData?._id || mek.assetId,
  };
});
```

## Visual States

### Active (Slotted & Accumulating)
- Green text (`text-green-400`)
- Shows live counting tenure value (updates every second)
- Displays rate: `+1.0/sec`
- Spinning refresh icon: 🔄

### Frozen (Unslotted)
- Gray text (`text-gray-400`)
- Shows saved tenure value (static)
- Displays "(frozen)" label
- Ice cube icon: 🧊

### Not Started
- Dimmed gray text (`text-gray-600`)
- Shows "0 tenure"
- Displays "(not started)" in italics
- No icon

## Responsive Behavior
- **Desktop**: Full text display with labels
- **Tablet**: Abbreviated labels (`sm:inline` hidden)
- **Mobile**: Only numbers visible, labels hidden

## Styling Notes
- Uses monospace font for numbers (industrial aesthetic)
- Yellow accents for active state match site theme
- Hover tooltip on header provides context
- Right-aligned to match numeric columns
- Compact vertical spacing for table rows

## Database Requirements
The component expects:
- `mek.tenure` field in level data (number)
- Slotted status from `goldMiningData.slottedMeks` array
- Real-time updates handled by React state + intervals
