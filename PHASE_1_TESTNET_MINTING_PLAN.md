# Phase 1: Testnet Setup & Basic Minting Flow

**Goal:** Get a working testnet minting system integrated into the "Test Minter" tab of NFT admin

**Duration:** Week 1 (5-7 days)

**Branch:** `custom-minting-system`

---

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Testnet Wallet Configuration](#testnet-wallet-configuration)
3. [Blockfrost API Setup](#blockfrost-api-setup)
4. [Minting Policy Generation](#minting-policy-generation)
5. [Basic Transaction Builder](#basic-transaction-builder)
6. [Admin UI Integration](#admin-ui-integration)
7. [Testing & Verification](#testing--verification)
8. [Resources & Documentation](#resources--documentation)

---

## Environment Setup

### Prerequisites Checklist
- [x] MeshSDK installed (already in package.json)
- [ ] Testnet wallet browser extension (Nami/Eternl/Flint)
- [ ] Blockfrost API account
- [ ] Environment variables configured

### Step 1.1: Install Additional Dependencies (if needed)

**Check current MeshSDK version:**
```bash
npm list @meshsdk/core @meshsdk/react
```

**Expected:** Already installed in your project

**If needed (shouldn't be):**
```bash
npm install @meshsdk/core @meshsdk/react
```

**Documentation:**
- MeshSDK Docs: https://meshjs.dev/
- Getting Started: https://meshjs.dev/guides/get-started

### Step 1.2: Environment Variables

**Create/Update `.env.local`:**
```env
# Existing variables...

# Cardano Network (testnet for Phase 1)
NEXT_PUBLIC_CARDANO_NETWORK=preprod

# Blockfrost API (testnet)
NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=preprod_YOUR_KEY_HERE
NEXT_PUBLIC_BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0

# Minting Policies (will generate in Step 4)
NEXT_PUBLIC_EVENT_POLICY_ID=
NEXT_PUBLIC_COLLECTIBLES_POLICY_ID=

# Royalty Configuration
NEXT_PUBLIC_ROYALTY_ADDRESS=addr_test1... # Your testnet wallet
NEXT_PUBLIC_ROYALTY_RATE=0.05
```

**Security Note:**
- `.env.local` is in `.gitignore` (don't commit API keys)
- Use different keys for testnet vs mainnet

---

## Testnet Wallet Configuration

### Step 2.1: Install Testnet Wallet Extension

**Recommended: Nami Wallet**
- Chrome Extension: https://chrome.google.com/webstore/detail/nami/lpfcbjknijpeeillifnkikgncikgfhdo
- Switch to Preprod testnet in settings

**Alternatives:**
- Eternl: https://eternl.io/
- Flint: https://flint-wallet.com/

**Documentation:**
- Cardano Testnets Overview: https://docs.cardano.org/cardano-testnet/overview/
- CIP-30 Wallet API: https://cips.cardano.org/cips/cip30/

### Step 2.2: Get Testnet ADA

**Preprod Faucet (Recommended):**
1. Go to: https://docs.cardano.org/cardano-testnet/tools/faucet/
2. Enter your testnet wallet address (starts with `addr_test1...`)
3. Receive 1000 tADA
4. Wait ~20 seconds for confirmation

**Alternative Faucets:**
- Testnets Faucet: https://testnets.cardano.org/en/testnets/cardano/tools/faucet/
- IOG Faucet: https://faucet.preview.world.dev.cardano.org/

**Verify Balance:**
- Check in wallet extension
- Or use Cardano Preprod Explorer: https://preprod.cardanoscan.io/

**Cooldown:** Most faucets have 24-hour cooldown per address

---

## Blockfrost API Setup

### Step 3.1: Create Blockfrost Account

**Sign up:**
1. Go to: https://blockfrost.io/
2. Create free account
3. Verify email

**Pricing (Free Tier):**
- 50,000 requests/day
- More than enough for development

**Documentation:**
- Blockfrost Docs: https://docs.blockfrost.io/
- API Reference: https://docs.blockfrost.io/api/

### Step 3.2: Generate API Keys

**Create Testnet Project:**
1. Dashboard → "Add Project"
2. Name: "Mek Tycoon Testnet"
3. Network: **Cardano Preprod**
4. Copy API key (starts with `preprod_...`)

**Create Mainnet Project (Future):**
1. Same process
2. Network: **Cardano Mainnet**
3. Keep separate from testnet

**Store Keys:**
```env
# .env.local
NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=preprod_a1b2c3d4e5f6...
```

### Step 3.3: Test API Connection

**Create test file:** `src/lib/blockfrost-test.ts`
```typescript
export async function testBlockfrostConnection() {
  const projectId = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID;
  const url = process.env.NEXT_PUBLIC_BLOCKFROST_URL;

  try {
    const response = await fetch(`${url}/health`, {
      headers: { 'project_id': projectId || '' }
    });

    if (response.ok) {
      console.log('✅ Blockfrost connection successful');
      return true;
    } else {
      console.error('❌ Blockfrost connection failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Blockfrost connection error:', error);
    return false;
  }
}
```

**Test in admin:**
```typescript
// In admin page useEffect
useEffect(() => {
  testBlockfrostConnection();
}, []);
```

**Expected Result:** "✅ Blockfrost connection successful" in console

---

## Minting Policy Generation

### Step 4.1: Understand Minting Policies

**What is a Minting Policy?**
- Defines WHO can mint and WHEN
- Creates a unique Policy ID (hash of the policy)
- Required for all Cardano NFTs

**Types:**
1. **Time-locked** - Can only mint before slot X
2. **Signature-based** - Requires specific key signature
3. **Combined** - Both time and signature (recommended)

**Documentation:**
- Native Scripts: https://docs.cardano.org/native-tokens/minting/
- CIP-25 (NFT Metadata): https://cips.cardano.org/cips/cip25/
- Policy Script Examples: https://developers.cardano.org/docs/native-tokens/minting/

### Step 4.2: Generate Policy Keys

**Create utility:** `src/lib/cardano/policyGenerator.ts`

```typescript
import { resolvePaymentKeyHash, resolvePlutusScriptAddress } from '@meshsdk/core';
import { CardanoSDK } from '@meshsdk/core-cst';

/**
 * Generate a minting policy script
 *
 * @param policyName - Name for this policy (e.g., "event-nfts", "collectibles")
 * @param expirySlot - Optional: Slot number after which minting is disabled
 * @returns Policy script and Policy ID
 *
 * References:
 * - Native Scripts: https://docs.cardano.org/native-tokens/minting/
 * - MeshSDK Policy Generation: https://meshjs.dev/apis/transaction/minting
 */
export async function generateMintingPolicy(
  policyName: string,
  expirySlot?: number
) {
  // TODO: Implementation in Step 4.3
  // This will use MeshSDK to generate native script
  return {
    policyId: '',
    policyScript: {},
    keyHash: ''
  };
}

/**
 * Get current slot number for time-locked policies
 *
 * References:
 * - Slot calculation: https://docs.cardano.org/explore-cardano/time/
 * - Blockfrost epochs: https://docs.blockfrost.io/#tag/Cardano-Epochs
 */
export async function getCurrentSlot(): Promise<number> {
  const url = process.env.NEXT_PUBLIC_BLOCKFROST_URL;
  const projectId = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID;

  const response = await fetch(`${url}/blocks/latest`, {
    headers: { 'project_id': projectId || '' }
  });

  const block = await response.json();
  return block.slot;
}

/**
 * Calculate slot number from date
 *
 * Preprod/Mainnet Params:
 * - Slot length: 1 second
 * - Epoch length: 432,000 slots (5 days)
 * - Shelley start: August 1, 2020 (mainnet)
 *
 * References:
 * - Time parameters: https://docs.cardano.org/explore-cardano/time/
 */
export function dateToSlot(date: Date, isMainnet: boolean = false): number {
  // Mainnet Shelley start: 1596491091 (Unix timestamp)
  // Preprod has different start time
  const shelleyStart = isMainnet ? 1596491091 : 1654041600; // Approximate
  const slotLength = 1; // 1 second per slot

  const unixTimestamp = Math.floor(date.getTime() / 1000);
  const elapsedSeconds = unixTimestamp - shelleyStart;
  const slot = Math.floor(elapsedSeconds / slotLength);

  return slot;
}
```

**Key Points:**
- Policy ID is deterministic (same inputs = same ID)
- Store policy scripts securely
- Time-locked policies prevent future minting (good for limited editions)

### Step 4.3: Create Test Policy Script

**Simple time-locked policy:**
```json
{
  "type": "all",
  "scripts": [
    {
      "type": "sig",
      "keyHash": "your_payment_key_hash_here"
    },
    {
      "type": "before",
      "slot": 99999999
    }
  ]
}
```

**What this means:**
- `"type": "all"` - ALL conditions must be met
- `"sig"` - Requires signature from specific key
- `"before"` - Only valid before slot 99999999

**Generate Policy ID:**
```typescript
// Will implement using MeshSDK's policy generation
// Policy ID = blake2b hash of the policy script
```

**Documentation:**
- Script structure: https://github.com/input-output-hk/cardano-node/blob/master/doc/reference/simple-scripts.md
- Policy ID calculation: https://cips.cardano.org/cips/cip14/

### Step 4.4: Store Policy Information

**Add to Convex schema:** `convex/schema.ts`
```typescript
mintingPolicies: defineTable({
  policyId: v.string(), // Unique policy ID
  policyName: v.string(), // "event-nfts" or "collectibles-{date}"
  policyScript: v.any(), // The native script JSON
  keyHash: v.string(), // Payment key hash
  expirySlot: v.optional(v.number()), // When policy expires
  network: v.union(v.literal("mainnet"), v.literal("preprod")),
  createdAt: v.number(),
  isActive: v.boolean()
})
```

**Create mutation:** `convex/mintingPolicies.ts`
```typescript
export const createPolicy = mutation({
  args: {
    policyId: v.string(),
    policyName: v.string(),
    policyScript: v.any(),
    keyHash: v.string(),
    expirySlot: v.optional(v.number()),
    network: v.union(v.literal("mainnet"), v.literal("preprod"))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("mintingPolicies", {
      ...args,
      createdAt: Date.now(),
      isActive: true
    });
  }
});
```

---

## Basic Transaction Builder

### Step 5.1: Understand Cardano Transactions

**Transaction Structure:**
```
Transaction {
  inputs: [...],      // UTXOs being spent
  outputs: [...],     // New UTXOs being created
  mint: {...},        // Assets being minted/burned
  metadata: {...},    // CIP-25 NFT metadata
  certificates: [],   // Staking certs (not needed)
  withdrawals: [],    // Staking rewards (not needed)
  fee: number,        // Transaction fee in lovelace
  ttl: number,        // Time to live (slot number)
  validity_start: number
}
```

**Documentation:**
- UTXO Model: https://docs.cardano.org/learn/cardano-architecture/#unspent-transaction-output-utxo
- Transaction Structure: https://docs.cardano.org/explore-cardano/cardano-architecture/transaction-structure/
- MeshSDK Transactions: https://meshjs.dev/apis/transaction

### Step 5.2: Calculate Transaction Costs

**Components:**
1. **Transaction Fee** - Based on tx size (~0.17 ADA typical)
2. **Min ADA** - Locked in NFT UTXO (~1.5-2 ADA)
3. **Mint Price** - What user pays for the NFT

**Fee Calculation:**
```typescript
/**
 * Calculate transaction fee
 *
 * Formula: a + b * size
 * - a = 0.155381 ADA (min fee)
 * - b = 0.000043946 ADA per byte
 *
 * References:
 * - Protocol parameters: https://docs.cardano.org/explore-cardano/protocol-parameters/
 * - Blockfrost params: https://docs.blockfrost.io/#tag/Cardano-Epochs/paths/~1epochs~1:number~1parameters/get
 */
export async function estimateFee(txSize: number): Promise<number> {
  const minFeeA = 155381; // microADA (0.155381 ADA)
  const minFeeB = 43.946; // microADA per byte

  const estimatedFee = minFeeA + (minFeeB * txSize);
  return Math.ceil(estimatedFee);
}

/**
 * Calculate min ADA for NFT UTXO
 *
 * Min UTXO = 1,000,000 + (metadata size * 4310)
 *
 * References:
 * - Min UTXO calc: https://docs.cardano.org/native-tokens/minimum-ada-value-requirement/
 */
export function calculateMinAda(metadataSize: number): number {
  const baseMinUtxo = 1000000; // 1 ADA in lovelace
  const sizeMultiplier = 4310;

  return baseMinUtxo + (metadataSize * sizeMultiplier);
}
```

### Step 5.3: Build Minting Transaction

**Create builder:** `src/lib/cardano/mintingTx.ts`

```typescript
import { Transaction, ForgeScript, AssetMetadata } from '@meshsdk/core';

/**
 * Build NFT minting transaction
 *
 * @param walletAddress - User's wallet address
 * @param policyId - Minting policy ID
 * @param policyScript - Policy script for signing
 * @param assetName - NFT asset name (hex encoded)
 * @param metadata - CIP-25 compliant metadata
 * @param mintPrice - Price user pays in lovelace
 *
 * References:
 * - MeshSDK Minting: https://meshjs.dev/apis/transaction/minting
 * - Asset naming: https://cips.cardano.org/cips/cip14/
 *
 * @returns Transaction object ready for signing
 */
export async function buildMintTransaction(
  walletAddress: string,
  policyId: string,
  policyScript: any,
  assetName: string,
  metadata: AssetMetadata,
  mintPrice: number
) {
  const tx = new Transaction({ initiator: wallet });

  // Add minting action
  tx.mintAsset(
    ForgeScript.fromNativeScript(policyScript),
    {
      assetName: assetName,
      assetQuantity: '1', // NFTs are always quantity 1
      metadata: metadata,
      label: '721', // CIP-25 metadata label
      recipient: walletAddress // Send to buyer
    }
  );

  // User pays mint price + fees
  // MeshSDK handles UTXO selection and change automatically

  return tx;
}

/**
 * Generate unique asset name
 *
 * Format: "E1_Skull_Basher_042"
 * - E1: Event number
 * - Skull_Basher: NFT name
 * - 042: Mint number (42/100)
 *
 * Must be hex-encoded for Cardano
 *
 * References:
 * - Asset naming: https://cips.cardano.org/cips/cip14/
 */
export function generateAssetName(
  eventNumber: number,
  nftName: string,
  mintNumber: number
): string {
  const sanitized = nftName.replace(/[^a-zA-Z0-9]/g, '_');
  const formatted = `E${eventNumber}_${sanitized}_${mintNumber.toString().padStart(3, '0')}`;

  // Convert to hex
  return Buffer.from(formatted, 'utf-8').toString('hex');
}
```

**Key Concepts:**
- Asset ID = `policyId` + `assetName` (hex)
- Each NFT must have unique asset name within policy
- MeshSDK handles UTXO selection automatically

**Documentation:**
- Asset naming: https://cips.cardano.org/cips/cip14/
- Minting process: https://developers.cardano.org/docs/native-tokens/minting-nfts/

### Step 5.4: Build Metadata (CIP-25)

**Create metadata builder:** `src/lib/cardano/metadata.ts`

```typescript
/**
 * Build CIP-25 compliant NFT metadata
 *
 * References:
 * - CIP-25 Standard: https://cips.cardano.org/cips/cip25/
 * - CIP-27 Royalties: https://cips.cardano.org/cips/cip27/
 */
export function buildEventNFTMetadata(
  eventNumber: number,
  eventName: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  displayName: string,
  imageUrl: string, // IPFS URL
  maxSupply: number,
  mintNumber: number,
  priceAda: number,
  walletAddress: string
) {
  return {
    "721": {
      [policyId]: {
        [assetName]: {
          // Required fields
          "name": displayName, // "E1: Skull Basher"
          "image": imageUrl, // "ipfs://Qm..."
          "mediaType": "image/gif",

          // Royalty info (CIP-27)
          "royalty_addr": process.env.NEXT_PUBLIC_ROYALTY_ADDRESS,
          "royalty_rate": process.env.NEXT_PUBLIC_ROYALTY_RATE,

          // Custom metadata
          "description": `Awarded for completing Event ${eventNumber} on ${difficulty} difficulty`,
          "eventNumber": eventNumber,
          "eventName": eventName,
          "difficulty": difficulty,
          "displayName": displayName,
          "maxSupply": maxSupply,
          "mintNumber": mintNumber,
          "priceAda": priceAda,
          "mintedBy": walletAddress,
          "mintTimestamp": Date.now(),

          // Optional: Tags for marketplace filtering
          "tags": ["Mek Tycoon", "Story Climb", difficulty, `Event ${eventNumber}`]
        }
      }
    }
  };
}

/**
 * Validate metadata size
 *
 * Max metadata size: 16 KB per transaction
 *
 * References:
 * - Metadata limits: https://docs.cardano.org/explore-cardano/cardano-architecture/transaction-metadata/
 */
export function validateMetadataSize(metadata: any): boolean {
  const jsonString = JSON.stringify(metadata);
  const sizeBytes = Buffer.byteLength(jsonString, 'utf8');
  const maxSize = 16 * 1024; // 16 KB

  if (sizeBytes > maxSize) {
    throw new Error(`Metadata too large: ${sizeBytes} bytes (max ${maxSize})`);
  }

  return true;
}
```

**CIP-25 Requirements:**
- ✅ `name` - Display name
- ✅ `image` - IPFS or HTTPS URL
- ✅ `mediaType` - MIME type
- ✅ Label `721` - NFT metadata standard

**Optional (Recommended):**
- `description` - NFT description
- `royalty_addr` - Royalty payment address (CIP-27)
- `royalty_rate` - Royalty percentage as decimal
- Custom fields - Any additional data

---

## Admin UI Integration

### Step 6.1: Existing Tab Structure

**Current NFT Admin Tabs (from screenshot):**
1. **Test Minter** (`simple-minter`) - ✅ Replace with custom
2. **Events** - Keep (already built)
3. **Purchases** - Keep
4. **Analytics** - Keep
5. **Commemorative** - Keep

### Step 6.2: Replace "Test Minter" Tab

**Create new component:** `src/components/admin/nft/CustomTestMinter.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

/**
 * Custom Testnet Minting Interface
 *
 * Phase 1: Simple test minting for development
 * Phase 2+: Production minting for collectibles
 */
export default function CustomTestMinter() {
  const [nftName, setNftName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [minting, setMinting] = useState(false);

  // Network indicator
  const network = process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'preprod';
  const isTestnet = network !== 'mainnet';

  const handleMint = async () => {
    setMinting(true);

    try {
      // Step 1: Upload image to IPFS (TODO: Phase 2)
      const imageUrl = 'ipfs://placeholder'; // Temporary

      // Step 2: Build metadata
      const metadata = {
        "721": {
          [policyId]: {
            [assetName]: {
              name: nftName,
              image: imageUrl,
              description: description,
              mediaType: "image/png"
            }
          }
        }
      };

      // Step 3: Build transaction
      const tx = await buildMintTransaction(
        walletAddress,
        policyId,
        policyScript,
        assetName,
        metadata,
        0 // Free for testing
      );

      // Step 4: Sign with wallet
      const signedTx = await tx.sign();

      // Step 5: Submit to blockchain
      const txHash = await signedTx.submit();

      // Step 6: Record in database
      await recordMint({
        txHash,
        nftName,
        walletAddress,
        network
      });

      alert(`✅ Minted! Tx: ${txHash}\nView: https://preprod.cardanoscan.io/transaction/${txHash}`);
    } catch (error) {
      console.error('Minting failed:', error);
      alert(`❌ Minting failed: ${error.message}`);
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Warning */}
      {isTestnet && (
        <div className="bg-yellow-500/10 border-2 border-yellow-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <div className="text-yellow-400 font-bold uppercase tracking-wider">
                TESTNET MODE
              </div>
              <div className="text-sm text-gray-400">
                Connected to {network}. Using test ADA. NFTs have no real value.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minting Form */}
      <div className="bg-black/50 border-2 border-yellow-500/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-yellow-400 mb-4 uppercase tracking-wider">
          Test NFT Minting
        </h3>

        <div className="space-y-4">
          {/* NFT Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider">
              NFT Name
            </label>
            <input
              type="text"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              placeholder="My Test NFT"
              className="w-full bg-black/70 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Test NFT for development"
              rows={3}
              className="w-full bg-black/70 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-500 focus:outline-none resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider">
              Image (PNG, JPG, GIF)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full bg-black/70 border border-yellow-500/30 rounded px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Mint Button */}
          <button
            onClick={handleMint}
            disabled={!nftName || !imageFile || minting}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          >
            {minting ? 'MINTING...' : 'MINT TEST NFT'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-black/30 border border-gray-700 rounded-lg p-4">
        <h4 className="text-sm text-gray-400 uppercase tracking-wider mb-2">
          Test Minting Instructions
        </h4>
        <ol className="text-sm text-gray-500 space-y-1 list-decimal list-inside">
          <li>Ensure you have testnet ADA in your wallet</li>
          <li>Connect your wallet (Nami/Eternl set to Preprod testnet)</li>
          <li>Enter NFT details and select an image</li>
          <li>Click "Mint Test NFT"</li>
          <li>Approve transaction in your wallet</li>
          <li>Wait ~20 seconds for confirmation</li>
          <li>NFT will appear in your wallet!</li>
        </ol>
      </div>
    </div>
  );
}
```

### Step 6.3: Update Admin Page

**File:** `src/app/admin-master-data/page.tsx`

**Replace import:**
```typescript
// OLD:
import SimpleNFTMinter from '@/components/admin/nft/SimpleNFTMinter';

// NEW:
import CustomTestMinter from '@/components/admin/nft/CustomTestMinter';
```

**Replace tab content:**
```typescript
// Find this line:
{nftSubTab === 'simple-minter' && <SimpleNFTMinter />}

// Replace with:
{nftSubTab === 'simple-minter' && <CustomTestMinter />}
```

**Rename tab label:**
```typescript
// Find:
<button onClick={() => setNftSubTab('simple-minter')}>
  Test Minter
</button>

// Update to:
<button onClick={() => setNftSubTab('simple-minter')}>
  Custom Test Minter (Testnet)
</button>
```

### Step 6.4: Hide NMKR Test Minter

**Archive old component:**
```bash
# Already done in our backup!
# File: ARCHIVED/nmkr-integration-backup-2025-10-23/SimpleNFTMinter.tsx
```

**Optional: Add toggle to switch between old/new:**
```typescript
const [useLegacyMinter, setUseLegacyMinter] = useState(false);

// In render:
{nftSubTab === 'simple-minter' && (
  <>
    <div className="mb-4">
      <button onClick={() => setUseLegacyMinter(!useLegacyMinter)}>
        {useLegacyMinter ? 'Use Custom Minter' : 'Use Legacy NMKR Minter'}
      </button>
    </div>
    {useLegacyMinter ? <SimpleNFTMinter /> : <CustomTestMinter />}
  </>
)}
```

---

## Testing & Verification

### Step 7.1: Connection Tests

**Test Blockfrost:**
```typescript
// In browser console
const test = await fetch('https://cardano-preprod.blockfrost.io/api/v0/health', {
  headers: { 'project_id': 'preprod_YOUR_KEY' }
});
console.log(await test.json());
// Expected: { is_healthy: true }
```

**Test Wallet:**
```typescript
// In CustomTestMinter component
useEffect(() => {
  const checkWallet = async () => {
    if (window.cardano) {
      const api = await window.cardano.nami.enable();
      const network = await api.getNetworkId();
      console.log('Network ID:', network); // 0 = preprod, 1 = mainnet
    }
  };
  checkWallet();
}, []);
```

### Step 7.2: First Test Mint

**Checklist:**
- [ ] Testnet wallet installed and funded (1000 tADA)
- [ ] Wallet connected to preprod network
- [ ] Blockfrost API key configured
- [ ] Environment variables set
- [ ] Dev server running (`npm run dev:all`)

**Steps:**
1. Go to Admin → NFT → Test Minter
2. Fill in:
   - Name: "Test NFT 001"
   - Description: "First custom mint test"
   - Image: Any test image
3. Click "Mint Test NFT"
4. Approve in wallet (should show ~2-3 tADA cost)
5. Wait for confirmation
6. Check wallet - NFT should appear!

**Verification:**
```
1. In Wallet: Should see NFT
2. On Explorer: https://preprod.cardanoscan.io/
   - Search your wallet address
   - See minting transaction
   - See NFT in assets
3. In Database: Check Convex dashboard
   - mintingPolicies table should have policy
   - Transaction recorded
```

### Step 7.3: Common Issues & Solutions

**Issue 1: "Insufficient ADA"**
- **Cause:** Not enough tADA in wallet
- **Solution:** Use faucet again, wait 24h cooldown

**Issue 2: "Network mismatch"**
- **Cause:** Wallet on wrong network
- **Solution:** Switch wallet to Preprod in settings

**Issue 3: "API key invalid"**
- **Cause:** Wrong Blockfrost key or network
- **Solution:** Verify `.env.local` has `preprod_` key

**Issue 4: "Transaction too large"**
- **Cause:** Metadata exceeds 16 KB
- **Solution:** Reduce description/metadata size

**Issue 5: "Policy ID mismatch"**
- **Cause:** Policy script changed
- **Solution:** Regenerate policy, update database

### Step 7.4: Validation Checklist

Before moving to Phase 2:

**Backend:**
- [ ] Blockfrost connection working
- [ ] Policy generation successful
- [ ] Policy stored in database
- [ ] Metadata builder working
- [ ] Transaction builder creates valid tx

**Frontend:**
- [ ] Test Minter UI renders correctly
- [ ] Wallet connection works
- [ ] Form validation works
- [ ] Minting flow completes
- [ ] Success/error messages display

**Blockchain:**
- [ ] Test mint successful on preprod
- [ ] NFT appears in wallet
- [ ] Transaction visible on explorer
- [ ] Metadata displays correctly
- [ ] Royalty info included

**Database:**
- [ ] Policy recorded in Convex
- [ ] Transaction hash stored
- [ ] Mint count tracked
- [ ] Supply tracking works

---

## Resources & Documentation

### Official Cardano Documentation
- **Cardano Docs**: https://docs.cardano.org/
- **Developer Portal**: https://developers.cardano.org/
- **Native Tokens**: https://docs.cardano.org/native-tokens/
- **Testnets**: https://docs.cardano.org/cardano-testnet/overview/

### CIPs (Cardano Improvement Proposals)
- **CIP-14** (Asset Names): https://cips.cardano.org/cips/cip14/
- **CIP-25** (NFT Metadata): https://cips.cardano.org/cips/cip25/
- **CIP-27** (Royalties): https://cips.cardano.org/cips/cip27/
- **CIP-30** (Wallet API): https://cips.cardano.org/cips/cip30/

### MeshSDK Documentation
- **Main Docs**: https://meshjs.dev/
- **Getting Started**: https://meshjs.dev/guides/get-started
- **Transactions**: https://meshjs.dev/apis/transaction
- **Minting**: https://meshjs.dev/apis/transaction/minting
- **Wallet Integration**: https://meshjs.dev/apis/wallets

### Blockfrost Documentation
- **Main Docs**: https://docs.blockfrost.io/
- **API Reference**: https://docs.blockfrost.io/api/
- **Cardano**: https://docs.blockfrost.io/#tag/Cardano-Blocks

### Explorers
- **Preprod**: https://preprod.cardanoscan.io/
- **Preview**: https://preview.cardanoscan.io/
- **Mainnet**: https://cardanoscan.io/

### Faucets
- **IOG Faucet**: https://docs.cardano.org/cardano-testnet/tools/faucet/
- **Testnets**: https://testnets.cardano.org/en/testnets/cardano/tools/faucet/

### Community Resources
- **Cardano Stack Exchange**: https://cardano.stackexchange.com/
- **Cardano Forum**: https://forum.cardano.org/
- **Discord**: Cardano Developers Discord
- **Reddit**: r/CardanoDevelopers

### Example Projects
- **Cardano Minting Example**: https://github.com/cardano-foundation/cardano-token-registry
- **MeshSDK Examples**: https://github.com/MeshJS/mesh/tree/main/apps/playground

---

## Phase 1 Success Criteria

**By end of Week 1, you should have:**

✅ **Environment:**
- Testnet wallet configured
- Blockfrost API working
- Environment variables set
- Dev server running

✅ **Backend:**
- Policy generation working
- Transaction builder functional
- Metadata builder compliant with CIP-25
- Database schema for policies

✅ **Frontend:**
- Custom Test Minter tab replacing NMKR
- Wallet connection working
- Minting form functional
- Success/error handling

✅ **Blockchain:**
- At least 1 successful testnet mint
- NFT visible in wallet
- Transaction on explorer
- Metadata displaying correctly

✅ **Documentation:**
- All code commented with references
- README updated
- Known issues documented
- Ready for Phase 2

---

## Next Steps: Phase 2 Preview

After Phase 1 is complete and tested:

**Phase 2 Goals:**
- IPFS integration for image hosting
- Metadata caching
- Better error handling
- Multi-wallet support
- Event NFT integration
- Supply tracking
- Price configuration

**Phase 3+ Goals:**
- Mainnet deployment
- Production minting
- On-demand event mints
- Collectibles admin tool
- Analytics dashboard

---

**Last Updated:** 2025-10-23
**Branch:** custom-minting-system
**Status:** Ready to implement
