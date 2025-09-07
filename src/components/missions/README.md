# Mission Components Library

A collection of reusable, modular components for displaying and managing missions in the Mek Tycoon game.

## Components

### MissionCard
The main mission card component that combines all sub-components into a complete mission display.

**Props:**
- `mission: Mission` - The mission data object
- `variation?: ElegantVariation` - Visual style variant (default: "industrial-v1")
- `onDeploy?: () => void` - Deploy button click handler
- `onMekSelect?: (missionId: string, slotIndex: number) => void` - Mek slot click handler
- `selectedMeks?: Mek[]` - Currently selected meks
- `matchedBonuses?: string[]` - List of matched bonus IDs
- `animatingSuccess?: number` - Animated success rate value
- `currentTime?: number` - Current timestamp for countdown calculations
- `className?: string` - Additional CSS classes

### MissionHeader
Displays mission title and countdown timer.

**Props:**
- `mission: Mission` - The mission data
- `currentTime?: number` - Current timestamp
- `variant?: "default" | "compact" | "expanded"` - Display variant
- `className?: string` - Additional CSS classes

### MissionRewards
Shows potential rewards with drop rates.

**Props:**
- `rewards: MissionReward[]` - Array of rewards
- `limit?: number` - Max rewards to display
- `variant?: "default" | "compact" | "detailed"` - Display variant
- `showDropRates?: boolean` - Show drop rate percentages
- `className?: string` - Additional CSS classes

### MekSlotGrid
Grid display for mek assignment slots.

**Props:**
- `mekSlots: number` - Number of available slots
- `selectedMeks?: Mek[]` - Currently assigned meks
- `missionId: string` - Mission identifier
- `onSlotClick?: (missionId: string, slotIndex: number) => void` - Slot click handler
- `hoveredSlot?: number | null` - Currently hovered slot index
- `setHoveredSlot?: (slot: number | null) => void` - Hover state setter
- `variant?: "default" | "compact" | "large" | "minimal"` - Display variant
- `maxSlots?: number` - Maximum slots to display (default: 6)
- `className?: string` - Additional CSS classes

### SuccessRateMeter
Visual progress bar showing mission success probability.

**Props:**
- `successRate: number` - Current success rate percentage
- `targetRate?: number` - Target/potential success rate
- `variant?: "default" | "compact" | "detailed" | "minimal"` - Display variant
- `showPercentage?: boolean` - Show percentage text
- `animated?: boolean` - Enable animations
- `className?: string` - Additional CSS classes

### DeploySection
Deploy button with fee display.

**Props:**
- `mission: Mission` - Mission data for fee calculation
- `onDeploy?: () => void` - Deploy click handler
- `disabled?: boolean` - Disable deploy button
- `variant?: "default" | "compact" | "expanded" | "inline"` - Display variant
- `className?: string` - Additional CSS classes

### WeaknessIndicators
Shows mission weaknesses/ailments with tooltips.

**Props:**
- `weaknesses: string[]` - Array of weakness IDs
- `hoveredAilment?: string | null` - Currently hovered ailment
- `setHoveredAilment?: (ailment: string | null) => void` - Hover state setter
- `matchedCount?: number` - Number of matched weaknesses
- `variant?: "default" | "compact" | "detailed"` - Display variant
- `showTooltip?: boolean` - Enable hover tooltips
- `className?: string` - Additional CSS classes

## Usage Example

```tsx
import { MissionCard } from "@/components/missions";
import type { Mission } from "@/app/contracts/types";

function MyPage() {
  const mission: Mission = {
    id: "mission-1",
    contractId: "contract-1",
    isGlobal: false,
    name: "Defense Grid Alpha",
    mekSlots: 4,
    goldReward: 5000,
    xpReward: 500,
    deployFee: 1000,
    deployFeeType: "gold",
    expiryHours: 2,
    endTime: Date.now() + 2 * 60 * 60 * 1000,
    rewards: [...],
    weaknesses: ["fire", "poison"],
    multipliers: [...],
    selectedMeks: []
  };

  return (
    <MissionCard 
      mission={mission}
      variation="industrial-v1"
      onDeploy={() => console.log("Deploy!")}
      onMekSelect={(missionId, slotIndex) => {
        console.log(`Select mek for slot ${slotIndex}`);
      }}
    />
  );
}
```

## Individual Component Usage

```tsx
import { 
  MissionHeader, 
  MissionRewards, 
  SuccessRateMeter 
} from "@/components/missions";

function CustomMissionDisplay() {
  return (
    <div className="space-y-4">
      <MissionHeader 
        mission={mission} 
        variant="expanded" 
      />
      
      <SuccessRateMeter 
        successRate={75} 
        variant="detailed" 
      />
      
      <MissionRewards 
        rewards={mission.rewards}
        variant="detailed"
        limit={5}
      />
    </div>
  );
}
```

## Custom Hook

The `useMissionState` hook provides complete mission state management:

```tsx
import { useMissionState } from "@/app/contracts/hooks/useMissionState";

function MissionsPage() {
  const {
    selectedMeks,
    createMission,
    selectMekForMission,
    deployMission,
    calculateSuccessRate
  } = useMissionState();

  // Use the hook methods to manage mission state
}
```

## Styling

All components use Tailwind CSS v3 with the project's dark theme:
- Primary accent: Yellow (#fab617)
- Background: Black/gray gradients
- Glass-morphism effects with backdrop blur
- Consistent border and shadow styles

## File Structure

```
src/
  components/
    missions/
      MissionCard.tsx
      MissionHeader.tsx
      MissionRewards.tsx
      MekSlotGrid.tsx
      SuccessRateMeter.tsx
      DeploySection.tsx
      WeaknessIndicators.tsx
      index.ts
  app/
    contracts/
      types/
        index.ts
      hooks/
        useMissionState.ts
      constants/
        missionData.ts
      utils/
        helpers.ts
```