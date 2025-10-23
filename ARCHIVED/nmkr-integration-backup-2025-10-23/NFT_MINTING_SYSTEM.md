# NFT Minting System for Story Climb Events

## Overview
This system manages event-based NFT creation for Story Climb nodes, allowing users to mint commemorative NFTs upon completing story challenges. Each event offers three difficulty-based variations with unique artwork and variable supply quantities.

## Event Structure

### Event Groups
Each Story Climb event node can trigger an NFT minting opportunity. Events are grouped logically by:
- Event number (unique identifier shared across all variations)
- Theme/Story element (e.g., "Microphone Challenge", "Skull Trial", "Crystal Quest")
- Set of 3 difficulty variations

### Difficulty Variations
Every event offers 3 NFT variations based on completion difficulty:

1. **Easy (Base Variation)**
   - Naming: `[Event Name]` (e.g., "Microphone")
   - Visual Theme: Standard/Basic appearance
   - Default Quantity: 100 NFTs (adjustable)
   - Rarity: Common

2. **Medium (Intensified Variation)**
   - Naming: `[Event Name] Intensifies` (e.g., "Microphone Intensifies")
   - Visual Theme: Enhanced effects (e.g., fire, energy, glow)
   - Default Quantity: 50 NFTs (adjustable)
   - Rarity: Uncommon

3. **Hard (Ultimate Variation)**
   - Naming: `[Event Name] Blisteringly Amazing` (e.g., "Microphone Blisteringly Amazing")
   - Visual Theme: Premium effects (e.g., diamond, holographic, rainbow)
   - Default Quantity: 10 NFTs (adjustable)
   - Rarity: Rare

## Naming Convention

### Pattern
```
Base Name: "[Theme]"
Medium:    "[Theme] Intensifies"
Hard:      "[Theme] Blisteringly Amazing"
```

### Examples
- Grey Skull / Grey Skull Intensifies / Grey Skull Blisteringly Amazing
- Fire Skull / Fire Skull Intensifies / Fire Skull Blisteringly Amazing
- Diamond Skull / Diamond Skull Intensifies / Diamond Skull Blisteringly Amazing
- Microphone / Microphone Intensifies / Microphone Blisteringly Amazing
- Crystal / Crystal Intensifies / Crystal Blisteringly Amazing

## Metadata Structure

### Required Fields
Each NFT variation must include:

1. **Event Number** (Shared across all 3 variations)
   - Type: Integer
   - Purpose: Links all variations to the same story event
   - Example: Event #42

2. **Difficulty Level** (Unique per variation)
   - Type: String
   - Values: "Easy" | "Medium" | "Hard"
   - Purpose: Distinguishes variation within event group

3. **NFT Name** (Unique per variation)
   - Type: String
   - Format: Follows naming convention above
   - Purpose: Display name and identification

4. **Supply Quantity** (Unique per variation)
   - Type: Integer
   - Purpose: Total mintable count for this variation
   - Adjustable per event

### Optional Metadata
- Event description
- Story context
- Unlock requirements
- Achievement bonuses
- Artist credits
- Mint date/time
- Cardano policy ID

### Example Metadata Object
```json
{
  "eventNumber": 42,
  "eventName": "Microphone Challenge",
  "difficulty": "Medium",
  "nftName": "Microphone Intensifies",
  "supplyQuantity": 50,
  "description": "Awarded for completing the Microphone Challenge on Medium difficulty",
  "visualTheme": "Fire effects with energy glow",
  "policyId": "...",
  "artist": "Mek Tycoon Studios"
}
```

## Art Upload Requirements

### Main NFT Art

#### File Format
- **Primary**: GIF (animated recommended)
- **Fallback**: PNG, JPG, WEBP (static)
- **Video**: MP4 (for complex animations)

#### Resolution Specifications
- **Minimum**: 1000x1000 px
- **Recommended**: 2000x2000 px
- **Maximum**: 4000x4000 px
- **Aspect Ratio**: 1:1 (square)

#### File Size Limits
- GIF: Max 10 MB
- PNG/JPG: Max 5 MB
- MP4: Max 20 MB

#### Quality Guidelines
- Use transparent backgrounds where applicable
- Maintain consistent art style across variations
- Ensure animations loop smoothly (for GIFs)
- Optimize for IPFS storage

### Thumbnail Images

#### File Format
- PNG or JPG (static only)

#### Resolution Specifications
- **Standard**: 500x500 px
- **Small**: 150x150 px
- **Aspect Ratio**: 1:1 (square)

#### Purpose
- Marketplace listings
- Gallery views
- Quick previews
- Mobile displays

### Sub-Assets (Optional)

#### Types
- Background layers
- Character elements
- Effect overlays
- Animation frames
- Alternative colorways

#### Organization
- Stored separately for compositing
- Named with clear identifiers
- Grouped by event/variation

## Upload Interface Design

### Required Form Fields

1. **Event Configuration**
   - Event Number (integer input)
   - Event Name (text input)
   - Event Description (textarea)

2. **Variation Settings (Repeat for each difficulty)**
   - Difficulty Level (dropdown: Easy/Medium/Hard)
   - NFT Name (text input with pattern validation)
   - Supply Quantity (integer input, adjustable)

3. **Art Uploads (Per variation)**
   - Main Art File (file upload with drag-drop)
   - Thumbnail (500px) (file upload)
   - Small Thumbnail (150px) (optional file upload or auto-generate)
   - Sub-Assets (multi-file upload, optional)

### Tooltips and Help Text

#### Format Tooltips
- **Main Art**: "Upload GIF (animated), PNG, JPG, or MP4. Square format. Max 10MB for GIF."
- **Thumbnail**: "500x500px PNG or JPG. Used for marketplace listings. Auto-generated if not provided."
- **Small Thumbnail**: "150x150px PNG or JPG. Auto-generated from main thumbnail if not provided."

#### Resolution Tooltips
- "Minimum 1000x1000px, recommended 2000x2000px for best quality"
- "Files will be stored on IPFS and served via CDN"
- "Animations should loop smoothly for GIFs"

#### Naming Tooltips
- Easy: "Base name only (e.g., 'Microphone')"
- Medium: "Add 'Intensifies' suffix (e.g., 'Microphone Intensifies')"
- Hard: "Add 'Blisteringly Amazing' suffix (e.g., 'Microphone Blisteringly Amazing')"

## Workflow

### Admin Process

1. **Create Event Group**
   - Define event number and name
   - Set story context and description

2. **Configure Variations**
   - Set quantities for each difficulty (Easy/Medium/Hard)
   - Apply naming convention automatically
   - Customize metadata as needed

3. **Upload Artwork**
   - Upload main art for each variation
   - Upload or auto-generate thumbnails
   - Add sub-assets if applicable

4. **Review and Validate**
   - Preview all three variations
   - Verify metadata accuracy
   - Check file formats and sizes

5. **Mint to NMKR**
   - Generate NMKR project payload
   - Submit to NMKR API
   - Configure pricing (if applicable)
   - Set distribution rules

6. **Activate Event**
   - Link to story climb node
   - Set unlock conditions
   - Enable minting for eligible users

### User Experience

1. **Complete Story Event**
   - User completes story climb node
   - Difficulty level determined by performance

2. **Eligibility Check**
   - System verifies completion
   - Checks available supply for difficulty tier

3. **Minting Opportunity**
   - User sees available NFT variation
   - Preview shows artwork and metadata
   - Minting interface presented

4. **Claim NFT**
   - User confirms claim
   - Transaction processed via NMKR
   - NFT minted to user's wallet

## Integration with NMKR

### API Requirements
- NMKR project creation endpoint
- Bulk NFT upload capability
- Metadata formatting (CIP-25 standard)
- Transaction callback webhooks

### Data Mapping
```
Event → NMKR Project
Variations → NFT Collection within Project
Quantity → Token count per asset
Metadata → CIP-25 formatted JSON
```

### Distribution Options
- Direct mint (user-initiated)
- Airdrop (admin-initiated)
- Reserved allocation (claim period)

## Database Schema

### Events Table
```typescript
{
  eventId: string,           // Unique identifier
  eventNumber: number,       // Display number
  eventName: string,         // Theme name
  description: string,       // Story context
  storyNodeId: string,       // Link to story climb
  isActive: boolean,         // Minting enabled
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### NFT Variations Table
```typescript
{
  variationId: string,       // Unique identifier
  eventId: string,           // Foreign key to event
  difficulty: "Easy" | "Medium" | "Hard",
  nftName: string,           // Display name
  supplyTotal: number,       // Max mintable
  supplyMinted: number,      // Current count
  mainArtUrl: string,        // IPFS/CDN URL
  thumbnailUrl: string,      // Preview image
  metadata: object,          // Full CIP-25 data
  nmkrProjectId: string,     // NMKR reference
  nmkrAssetId: string,       // NMKR asset reference
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### User Claims Table
```typescript
{
  claimId: string,           // Unique identifier
  userId: string,            // User reference
  variationId: string,       // NFT variation claimed
  walletAddress: string,     // Receiving address
  transactionHash: string,   // Blockchain tx
  claimedAt: timestamp,
  status: "pending" | "completed" | "failed"
}
```

## Admin Interface Components

### Event List View
- Table of all events
- Filter by active/inactive
- Sort by event number
- Quick stats (total minted, remaining)

### Event Editor
- Event details form
- Three-panel variation editor (Easy/Medium/Hard)
- Live preview pane
- Metadata inspector

### Art Upload Manager
- Drag-and-drop upload zones
- Image preview with zoom
- Format/size validation
- Batch upload for multiple variations

### Distribution Dashboard
- Real-time mint tracking
- Supply remaining indicators
- User claim history
- Transaction logs

## Future Enhancements

### Potential Features
- Dynamic pricing based on rarity
- Secondary market integration
- NFT bundling (collect all 3 variations)
- Achievement badges for collectors
- Generative art variations
- Limited-time minting windows
- Community voting on themes
- Cross-event collection bonuses

### Technical Improvements
- Auto-thumbnail generation
- Image optimization pipeline
- IPFS pinning service
- CDN integration
- Metadata validation tools
- Template system for metadata
- Bulk import via CSV
- Analytics and reporting

---

## Notes
- All quantities are adjustable per event
- Naming convention is enforced but can be customized
- Art specifications serve as guidelines; actual requirements may vary
- NMKR integration details subject to API capabilities
- System designed to scale to hundreds of events
