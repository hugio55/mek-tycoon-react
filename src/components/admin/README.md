# NFT Campaign Management - Modular Component Architecture

## Overview

This directory contains a modular, production-quality architecture for managing NFT campaigns and inventory. The system is designed following clean architecture principles with proper separation of concerns, strong typing, and reusable components.

## Architecture

### Component Structure

```
src/components/admin/
├── campaign/
│   ├── CampaignManager.tsx       # Main orchestrator for campaign CRUD
│   ├── CampaignSelector.tsx      # Dropdown selector with stats display
│   └── CampaignStats.tsx         # (Future) Detailed statistics component
└── nft-inventory/
    ├── CSVImportZone.tsx         # Drag-drop CSV import with validation
    ├── ManualNFTEntry.tsx        # Single NFT manual entry form
    └── NFTInventoryTable.tsx     # Inventory display with filtering

src/types/
└── campaign.ts                   # TypeScript interfaces and types

convex/
└── campaigns.ts                  # Backend functions for campaign management
```

## Components

### Campaign Components

#### CampaignManager
**Purpose:** Create, update, delete, and list campaigns

**Props:**
- `selectedCampaignId?: string` - Currently selected campaign ID
- `onCampaignCreated?: (id: string) => void` - Callback when campaign created
- `onCampaignUpdated?: () => void` - Callback when campaign updated
- `onError?: (error: string) => void` - Error handler

**Features:**
- Create new campaigns with form validation
- Toggle campaign active/inactive status
- Delete campaigns with confirmation
- Display all campaigns with statistics
- Visual indication of selected campaign

**Usage:**
```tsx
<CampaignManager
  selectedCampaignId={campaignId}
  onCampaignCreated={(id) => setSelectedCampaign(id)}
  onCampaignUpdated={() => refetch()}
  onError={(err) => showError(err)}
/>
```

#### CampaignSelector
**Purpose:** Select active campaign from dropdown with quick stats

**Props:**
- `campaigns: Campaign[]` - Array of available campaigns
- `selectedCampaignId?: string` - Currently selected campaign ID
- `onSelect: (id?: string) => void` - Selection handler
- `disabled?: boolean` - Disable selector

**Features:**
- Dropdown with all campaigns
- Color-coded status badges (active/inactive)
- Quick stats display (total/available/reserved/sold)
- Empty state handling

**Usage:**
```tsx
<CampaignSelector
  campaigns={campaigns}
  selectedCampaignId={campaignId}
  onSelect={setSelectedCampaign}
/>
```

### NFT Inventory Components

#### CSVImportZone
**Purpose:** Bulk import NFTs from NMKR Studio CSV export

**Props:**
- `campaignId?: string` - Campaign to import into
- `onImportComplete?: (result) => void` - Success callback
- `onError?: (error: string) => void` - Error handler
- `disabled?: boolean` - Disable import (when no campaign selected)

**Features:**
- Drag-and-drop CSV file upload
- Manual paste CSV content
- Parse NMKR CSV format (UID, name, number, state)
- Upload progress indication
- Automatic filtering (only "free" status NFTs)
- Clear/reset functionality

**CSV Format Expected:**
```csv
Uid,Tokenname,Displayname,State
10aec295-d9e2-47e3-9c04-e56e2df92ad5,Lab Rat #1,Lab Rat #1,free
```

**Usage:**
```tsx
<CSVImportZone
  campaignId={selectedCampaign}
  onImportComplete={(result) => console.log(`Imported ${result.created}`)}
  onError={(err) => showError(err)}
  disabled={!selectedCampaign}
/>
```

#### ManualNFTEntry
**Purpose:** Add individual NFTs manually

**Props:**
- `campaignId?: string` - Campaign to add NFT to
- `onAddComplete?: (nft) => void` - Success callback
- `onError?: (error: string) => void` - Error handler
- `disabled?: boolean` - Disable form

**Features:**
- Form validation (required fields, number validation)
- Clear/reset functionality
- Helpful field descriptions
- Status indication

**Usage:**
```tsx
<ManualNFTEntry
  campaignId={selectedCampaign}
  onAddComplete={(nft) => console.log(`Added ${nft.name}`)}
  onError={(err) => showError(err)}
  disabled={!selectedCampaign}
/>
```

#### NFTInventoryTable
**Purpose:** Display and manage NFT inventory

**Props:**
- `campaignId?: string` - Campaign to display inventory for
- `onRefresh?: () => void` - Refresh callback
- `onError?: (error: string) => void` - Error handler

**Features:**
- Statistics dashboard (total/available/reserved/sold)
- Filter by status (all/available/reserved/sold)
- Sortable table display
- Clear all inventory (with confirmation)
- Empty state handling
- Status badges with color coding

**Usage:**
```tsx
<NFTInventoryTable
  campaignId={selectedCampaign}
  onRefresh={() => refetch()}
  onError={(err) => showError(err)}
/>
```

## Backend Functions

### Convex API (`convex/campaigns.ts`)

#### Mutations

**createCampaign**
```typescript
Args: {
  name: string
  description: string
  nmkrProjectId: string
  maxNFTs: number
  status?: "active" | "inactive"
  startDate?: number
  endDate?: number
}
Returns: { success: boolean, campaignId: Id }
```

**updateCampaign**
```typescript
Args: {
  campaignId: Id<"commemorativeCampaigns">
  name?: string
  description?: string
  status?: "active" | "inactive"
  maxNFTs?: number
  startDate?: number
  endDate?: number
}
Returns: { success: boolean }
```

**deleteCampaign**
```typescript
Args: {
  campaignId: Id<"commemorativeCampaigns">
}
Returns: { success: boolean }
```

**updateCampaignStats**
```typescript
Args: {
  campaignId: Id<"commemorativeCampaigns">
}
Returns: { success: boolean, stats: Stats }
```

#### Queries

**getAllCampaigns**
```typescript
Returns: Campaign[]
```

**getCampaignById**
```typescript
Args: { campaignId: Id<"commemorativeCampaigns"> }
Returns: Campaign | null
```

**getActiveCampaigns**
```typescript
Returns: Campaign[]
```

## Type Definitions

### Core Types (`src/types/campaign.ts`)

```typescript
type NFTStatus = "available" | "reserved" | "sold"
type CampaignStatus = "active" | "inactive"

interface Campaign {
  _id: Id<"commemorativeCampaigns">
  name: string
  description: string
  nmkrProjectId: string
  status: CampaignStatus
  maxNFTs: number
  totalNFTs: number
  availableNFTs: number
  reservedNFTs: number
  soldNFTs: number
  createdAt: number
  updatedAt: number
  startDate?: number
  endDate?: number
}

interface NFTInventoryItem {
  _id: Id<"commemorativeNFTInventory">
  nftUid: string
  nftNumber: number
  name: string
  status: NFTStatus
  projectId: string
  paymentUrl: string
  imageUrl?: string
  createdAt: number
  campaignId?: Id<"commemorativeCampaigns">
}
```

## Integration Example

See `/src/app/admin/test-nmkr/page.tsx` for complete integration example.

### Basic Integration

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

import CampaignManager from "@/components/admin/campaign/CampaignManager";
import CampaignSelector from "@/components/admin/campaign/CampaignSelector";
import CSVImportZone from "@/components/admin/nft-inventory/CSVImportZone";
import ManualNFTEntry from "@/components/admin/nft-inventory/ManualNFTEntry";
import NFTInventoryTable from "@/components/admin/nft-inventory/NFTInventoryTable";

export default function AdminPage() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>();
  const campaigns = useQuery(api.campaigns.getAllCampaigns);

  return (
    <div>
      <CampaignManager
        selectedCampaignId={selectedCampaignId}
        onCampaignCreated={setSelectedCampaignId}
      />

      <CampaignSelector
        campaigns={campaigns || []}
        selectedCampaignId={selectedCampaignId}
        onSelect={setSelectedCampaignId}
      />

      <CSVImportZone
        campaignId={selectedCampaignId}
        disabled={!selectedCampaignId}
      />

      <ManualNFTEntry
        campaignId={selectedCampaignId}
        disabled={!selectedCampaignId}
      />

      <NFTInventoryTable campaignId={selectedCampaignId} />
    </div>
  );
}
```

## Design Patterns

### Separation of Concerns
- **Components:** Pure UI logic, no direct database calls
- **Backend:** All database operations in Convex functions
- **Types:** Centralized TypeScript definitions

### Component Communication
- **Props:** Explicit prop interfaces with TypeScript
- **Callbacks:** onSuccess/onError pattern for async operations
- **State Management:** Parent component owns state, children notify via callbacks

### Error Handling
- All async operations wrapped in try-catch
- Errors propagated via `onError` callback
- User-friendly error messages

### Validation
- Form validation before submission
- Required field checking
- Number validation for numeric inputs
- CSV format validation

## Styling

All components use the industrial design system classes:
- `.mek-card-industrial` - Card containers
- `.mek-button-primary` - Primary action buttons
- `.mek-button-secondary` - Secondary action buttons
- Industrial color scheme (yellow-500 accents, black backgrounds)

## Future Enhancements

### Potential Additions
1. **CampaignStats Component** - Detailed analytics dashboard
2. **Batch Operations** - Bulk status updates for NFTs
3. **Export Functionality** - Export inventory to CSV
4. **Search/Filter** - Advanced filtering and search
5. **Audit Log** - Track all campaign and inventory changes
6. **Campaign Templates** - Reusable campaign configurations
7. **Image Preview** - Show NFT images in inventory table

### Integration Points
- Can be used in admin-master-data page
- Can be embedded in campaign-specific workflows
- Can integrate with payment/claiming systems
- Can be extended for multi-campaign operations

## Best Practices

### When Using These Components

1. **Always provide error handlers** - Handle errors gracefully at the parent level
2. **Disable components when no campaign selected** - Prevents invalid operations
3. **Provide feedback** - Use callbacks to show user feedback (toasts, logs, etc.)
4. **Validate data** - Components validate inputs, but verify data integrity at backend
5. **Test CSV format** - Ensure CSV exports from NMKR match expected format

### When Extending

1. **Follow TypeScript interfaces** - Don't break type contracts
2. **Maintain callback patterns** - Keep consistent error/success handling
3. **Use existing styles** - Stick with industrial design system
4. **Add prop validation** - Validate props at component boundaries
5. **Document new features** - Update this README with changes
