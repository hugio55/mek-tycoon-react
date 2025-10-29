# NMKR JSON Metadata Generator - User Guide

**Created:** January 2025
**Location:** Admin Panel → NFT → JSON System tab
**Purpose:** Generate bulk .metadata JSON files for NMKR Studio drag-and-drop upload

---

## What This Tool Does

The JSON Generator creates multiple .metadata JSON files that work with NMKR Studio's bulk upload system. This allows you to:

1. **Upload 1 artwork file** (e.g., bronze.png)
2. **Upload N .metadata files** (Bronze Token #1.metadata, #2.metadata, etc.)
3. **NMKR creates N NFTs** all pointing to the same IPFS image hash with unique metadata

**Result:** You can create 5, 35, 100+ NFTs with identical artwork but unique edition numbers in seconds.

---

## How to Access

1. Navigate to `http://localhost:3200/admin-master-data`
2. Click the **NFT** tab in the left sidebar
3. Click the **📦 JSON System** button at the top

---

## Step-by-Step Usage

### Step 1: Fill Out the Form

**Basic Configuration (Left Column):**

- **Collection Name:** "Beta Commemorative" (or your collection name)
- **Token Base Name:** "Bronze Token" (will become "Bronze Token #1", "#2", etc.)
- **Number of NFTs:** 5 (for testing), 35/100/150 (for production)
- **Phase Number:** 1, 2, 3, etc.
- **Tier:** Select Bronze, Silver, or Gold

**Advanced Configuration (Right Column):**

- **Description Template:** Auto-filled based on tier/phase, but you can customize
- **Image IPFS Hash:** Leave empty! NMKR will fill this after you upload artwork
- **Artist:** "Wren Ellis" (default)
- **Company:** "Over Exposed" (default)
- **Game:** "Mek Tycoon" (default)

### Step 2: Preview Metadata

Click **"👁️ Preview Token #1"** to:

- See how the first NFT metadata will look
- View wallet-style card preview
- Inspect the full JSON structure
- Verify all fields are correct

### Step 3: Download ZIP

Click **"💾 Download N Metadata Files (ZIP)"** to:

- Generate all N .metadata files
- Download as `BronzeTokenBronze_metadata.zip`
- Extract ZIP to a folder on your computer

### Step 4: Upload to NMKR Studio

1. Go to NMKR Studio (https://studio.nmkr.io/)
2. Create or open your project
3. **Upload artwork first:**
   - Upload your bronze.png (or silver.png, gold.png, etc.)
   - NMKR uploads to IPFS and gets hash
4. **Upload metadata files:**
   - Drag and drop all .metadata files from extracted ZIP
   - NMKR matches files and links them to the artwork
5. **Configure pricing, whitelist, and launch!**

---

## Generated Metadata Structure

Each .metadata file contains:

```json
{
  "name": "Bronze Token #1",
  "description": "Exclusive Bronze commemorative NFT...",
  "image": "ipfs://[PLACEHOLDER - NMKR will populate after image upload]",
  "mediaType": "image/png",
  "Collection": "Beta Commemorative",
  "Game": "Mek Tycoon",
  "Artist": "Wren Ellis",
  "Company": "Over Exposed",
  "Phase": 1,
  "Tier": "Bronze",
  "Edition": 1,
  "Series": "Commemorative Tokens",
  "tags": ["Mek Tycoon", "Beta Commemorative", "Phase 1", "Bronze", "Edition 1"],
  "project": "Mek Tycoon",
  "category": "Commemorative Token",
  "website": "https://mek.overexposed.io"
}
```

**CIP-25 Compliance:** NMKR automatically wraps this in the proper `{ "721": { policyId: { assetName: {...} } } }` structure.

---

## Use Cases

### Use Case 1: Phase 1 Bronze (35 NFTs)

**Settings:**
- Collection Name: "Beta Commemorative"
- Token Base Name: "Bronze Token"
- Number of NFTs: 35
- Phase: 1
- Tier: Bronze

**Result:** 35 files named "Bronze Token #1.metadata" through "Bronze Token #35.metadata"

### Use Case 2: Phase 2 Silver (100 NFTs)

**Settings:**
- Collection Name: "Beta Commemorative"
- Token Base Name: "Silver Token"
- Number of NFTs: 100
- Phase: 2
- Tier: Silver

**Result:** 100 files named "Silver Token #1.metadata" through "Silver Token #100.metadata"

### Use Case 3: Testing (5 NFTs)

**Settings:**
- Collection Name: "Beta Commemorative"
- Token Base Name: "Test Token"
- Number of NFTs: 5
- Phase: 1
- Tier: Bronze

**Result:** 5 files for quick testing before creating 35+ production files

---

## Important Notes

### About IPFS Image Hash

**Do NOT fill this field manually.**

**Workflow:**
1. Upload artwork to NMKR first
2. NMKR uploads to IPFS and gets hash (e.g., QmXxxx...)
3. When you upload .metadata files, NMKR links them to the artwork
4. NMKR populates the `image` field automatically

**Why leave it as placeholder?**
- You don't have the IPFS hash until after uploading to NMKR
- NMKR's system handles the linking automatically
- Trying to pre-fill it will cause confusion

### About Policy IDs

The metadata does NOT include a policy ID. NMKR handles this:

- **Phase 1:** NMKR generates new policy ID
- **Phase 2+:** You select "Use existing policy" and paste Phase 1's policy ID
- All phases share same policy ID = one unified collection on-chain

See `NMKR_SETUP_GUIDE.md` for complete multi-phase workflow.

### File Naming Convention

NMKR expects files named: `[Token Base Name] #N.metadata`

**Correct:**
- `Bronze Token #1.metadata`
- `Bronze Token #2.metadata`
- `Silver Token #1.metadata`

**Incorrect:**
- `BronzeToken1.metadata` (missing space, missing #)
- `Bronze_Token_#1.metadata` (underscores)
- `Bronze Token 1.metadata` (missing #)

The generator uses the correct format automatically.

---

## Troubleshooting

### Problem: ZIP Download Not Working

**Solution:** Check browser console for errors. Ensure jszip package is installed:
```bash
npm install jszip @types/jszip
```

### Problem: Preview Shows Wrong Data

**Solution:**
- Check form inputs for typos
- Refresh page and try again
- Tier dropdown affects description auto-generation

### Problem: NMKR Won't Accept .metadata Files

**Solution:**
- Verify files end with `.metadata` (not `.metadata.json`)
- Extract ZIP completely before uploading
- Upload artwork BEFORE uploading metadata
- Check NMKR project is in "preprod" or "mainnet" mode matching your intent

### Problem: Wrong File Count

**Solution:**
- Check "Number of NFTs" field
- Download creates exactly N files (if you set 35, you get 35 files)
- Extract ZIP to verify count

---

## Technical Details

### Files Created by This Tool

1. **`src/lib/nmkr/metadataGenerator.ts`** - Core generation logic
   - `generateNMKRMetadataFiles()` - Main function
   - `validateMetadataParams()` - Form validation
   - `getDefaultDescription()` - Auto-fill descriptions

2. **`src/components/admin/nft/NMKRJSONGenerator.tsx`** - UI component
   - Form inputs with validation
   - Preview system
   - ZIP download using jszip library

3. **Integration:** Added as 7th tab to NFT admin panel in `admin-master-data/page.tsx`

### CIP-25 Compliance

The generated metadata follows **CIP-25** (Cardano NFT Metadata Standard):

- `name` (required) - NFT display name
- `image` (required) - IPFS or HTTPS URL
- `mediaType` (recommended) - MIME type (image/png, image/gif, etc.)
- `description` (recommended) - NFT description
- Custom fields allowed (Collection, Phase, Tier, etc.)

**Reference:** https://cips.cardano.org/cip/CIP-25

### JSZip Library

**Package:** `jszip` (https://www.npmjs.com/package/jszip)
**Purpose:** Create ZIP files in-browser without server processing
**Usage:** Bundles all .metadata files into downloadable ZIP

---

## Integration with Existing Systems

### Works With:

- **NMKR Studio** - Primary use case
- **Commemorative Token System** - Generates metadata matching existing structure
- **Multi-Phase Releases** - Same format for Bronze, Silver, Gold phases
- **Whitelist System** - Metadata compatible with whitelisted minting

### Does NOT Replace:

- ❌ NMKR Studio (still needed for minting)
- ❌ Policy ID generation (NMKR handles this)
- ❌ IPFS uploads (NMKR handles this)
- ❌ Payment processing (NMKR Pay widget)

This tool **complements** NMKR by making metadata creation instant instead of manual.

---

## Example Workflow: Phase 1 Launch

**Goal:** Create 35 Bronze NFTs for Phase 1 beta testers

**Steps:**

1. **Generate Metadata:**
   - Go to Admin Panel → NFT → JSON System
   - Collection: "Beta Commemorative"
   - Token Base Name: "Phase 1 Bronze Token"
   - Number of NFTs: 35
   - Phase: 1, Tier: Bronze
   - Click Download → get ZIP with 35 .metadata files

2. **Create NMKR Project:**
   - Go to NMKR Studio (preprod testnet)
   - Create new project: "Beta Commemorative - Phase 1 (Bronze)"
   - Upload bronze.png artwork

3. **Upload Metadata:**
   - Extract ZIP to folder
   - Drag and drop all 35 .metadata files into NMKR
   - NMKR links them to bronze.png

4. **Configure & Launch:**
   - Set pricing: 10 tADA
   - Add 35 whitelist addresses
   - Launch project
   - **SAVE POLICY ID** for Phase 2 reuse!

5. **Phase 2 Next Month:**
   - Repeat with 100 Silver Token metadata files
   - In NMKR: "Use existing policy" → paste Phase 1 policy ID
   - All 135 NFTs (35 bronze + 100 silver) share same policy = one collection

---

## Future Enhancements (Potential)

**Possible improvements:**

1. **Template Library** - Save/load metadata templates for reuse
2. **Pinata Integration** - Upload artwork to IPFS directly from tool
3. **Batch Variations** - Generate multiple tiers (Bronze + Silver + Gold) in one ZIP
4. **Custom Fields** - Add user-defined metadata fields
5. **Preview All** - See previews for all N tokens, not just #1
6. **Export CSV** - Export metadata as spreadsheet for record-keeping

**These are not implemented yet, but could be added in future sessions.**

---

## Support & Resources

**Documentation:**
- This guide: `NMKR_JSON_GENERATOR_GUIDE.md`
- NMKR setup: `NMKR_SETUP_GUIDE.md`
- CIP-25 standard: https://cips.cardano.org/cip/CIP-25
- NMKR docs: https://docs.nmkr.io/

**Questions:**
- Check NMKR setup guide first
- Review CIP-25 standard for metadata questions
- Test with 5 NFTs before generating 35+

---

**Last Updated:** January 2025
**Status:** ✅ Fully implemented and ready for production use
