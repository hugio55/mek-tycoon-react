/**
 * NFT Metadata Builder (CIP-25 + CIP-27 Compliant)
 *
 * Creates properly formatted metadata for Cardano NFTs
 *
 * References:
 * - CIP-25 (NFT Metadata): https://cips.cardano.org/cips/cip25/
 * - CIP-27 (Royalties): https://cips.cardano.org/cips/cip27/
 * - Metadata limits: https://docs.cardano.org/explore-cardano/cardano-architecture/transaction-metadata/
 */

/**
 * Build metadata for Event NFTs (Story Climb)
 *
 * @param policyId - Minting policy ID
 * @param assetName - Hex-encoded asset name
 * @param params - NFT parameters
 * @returns CIP-25 compliant metadata
 */
export function buildEventNFTMetadata(
  policyId: string,
  assetName: string,
  params: {
    eventNumber: number;
    eventName: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    displayName: string; // e.g., "E1: Skull Basher"
    imageUrl: string; // IPFS or HTTPS URL
    description?: string;
    maxSupply: number;
    mintNumber: number; // Which # out of maxSupply
    priceAda: number;
    walletAddress: string;
    contractNodeId?: string;
  }
) {
  const network = process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'preprod';
  const royaltyAddress = network === 'mainnet'
    ? process.env.NEXT_PUBLIC_ROYALTY_ADDRESS_MAINNET
    : process.env.NEXT_PUBLIC_ROYALTY_ADDRESS_TESTNET;
  const royaltyRate = process.env.NEXT_PUBLIC_ROYALTY_RATE || '0.05';

  return {
    "721": {
      [policyId]: {
        [assetName]: {
          // Required CIP-25 fields
          "name": params.displayName,
          "image": params.imageUrl,
          "mediaType": inferMediaType(params.imageUrl),

          // CIP-27 Royalty fields
          "royalty_addr": royaltyAddress,
          "royalty_rate": royaltyRate,

          // Event metadata
          "description": params.description || `Awarded for completing Event ${params.eventNumber} on ${params.difficulty} difficulty in Mek Tycoon Story Climb mode`,
          "eventNumber": params.eventNumber,
          "eventName": params.eventName,
          "difficulty": params.difficulty,
          "variation": getDifficultyVariation(params.difficulty),
          "maxSupply": params.maxSupply,
          "mintNumber": params.mintNumber,
          "serialNumber": `#${params.mintNumber}/${params.maxSupply}`,

          // Provenance
          "priceAda": params.priceAda,
          "mintedBy": params.walletAddress,
          "mintTimestamp": Date.now(),
          "contractCompleted": params.contractNodeId,

          // Marketplace tags
          "tags": [
            "Mek Tycoon",
            "Story Climb",
            `Event ${params.eventNumber}`,
            params.difficulty,
            params.eventName
          ],

          // Project info
          "project": "Mek Tycoon",
          "category": "Event NFT",
          "website": "https://mek.overexposed.io"
        }
      }
    }
  };
}

/**
 * Build metadata for Collectibles (one-off art)
 *
 * @param policyId - Minting policy ID
 * @param assetName - Hex-encoded asset name
 * @param params - NFT parameters
 * @returns CIP-25 compliant metadata
 */
export function buildCollectibleMetadata(
  policyId: string,
  assetName: string,
  params: {
    name: string;
    description: string;
    imageUrl: string;
    artist?: string;
    edition?: string; // e.g., "1 of 1" or "42 of 100"
    recipient?: string;
    occasion?: string;
    attributes?: Record<string, any>;
    walletAddress: string;
  }
) {
  const network = process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'preprod';
  const royaltyAddress = network === 'mainnet'
    ? process.env.NEXT_PUBLIC_ROYALTY_ADDRESS_MAINNET
    : process.env.NEXT_PUBLIC_ROYALTY_ADDRESS_TESTNET;
  const royaltyRate = process.env.NEXT_PUBLIC_ROYALTY_RATE || '0.05';

  const metadata: any = {
    "721": {
      [policyId]: {
        [assetName]: {
          // Required CIP-25 fields
          "name": params.name,
          "image": params.imageUrl,
          "mediaType": inferMediaType(params.imageUrl),
          "description": params.description,

          // CIP-27 Royalty fields
          "royalty_addr": royaltyAddress,
          "royalty_rate": royaltyRate,

          // Optional fields
          "artist": params.artist || "Mek Tycoon Studios",
          "edition": params.edition,
          "recipient": params.recipient,
          "occasion": params.occasion,

          // Provenance
          "mintedBy": params.walletAddress,
          "mintTimestamp": Date.now(),

          // Project info
          "project": "Mek Tycoon",
          "category": "Collectible",
          "website": "https://mek.overexposed.io"
        }
      }
    }
  };

  // Add custom attributes if provided
  if (params.attributes) {
    metadata["721"][policyId][assetName] = {
      ...metadata["721"][policyId][assetName],
      ...params.attributes
    };
  }

  return metadata;
}

/**
 * Build metadata for Test NFTs (Phase 1 testing)
 *
 * Simplified metadata for quick testing
 * Note: Cardano metadata only supports strings, numbers, and arrays
 */
export function buildTestNFTMetadata(
  policyId: string,
  assetName: string,
  params: {
    name: string;
    description: string;
    imageUrl: string;
    walletAddress: string;
  }
) {
  const network = process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'preprod';

  return {
    "721": {
      [policyId]: {
        [assetName]: {
          "name": params.name,
          "image": params.imageUrl,
          "description": params.description
        }
      }
    }
  };
}

/**
 * Build metadata for Commemorative Tokens (Beta Tester Rewards)
 *
 * Creates sequential edition NFTs with royalties for jpg.store compatibility
 * Note: Only strings and numbers allowed (no booleans, no complex objects)
 *
 * @param policyId - Shared commemorative policy ID
 * @param assetName - Hex-encoded asset name
 * @param params - Token parameters
 * @returns CIP-25 + CIP-27 compliant metadata
 */
export function buildCommemorativeMetadata(
  policyId: string,
  assetName: string,
  params: {
    editionNumber: number;
    tokenType: string; // "phase_1_beta"
    displayName: string; // "Phase 1: I Was There"
    imageUrl: string; // IPFS URL
    walletAddress: string;
  }
) {
  const network = process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'preprod';
  const royaltyAddress = network === 'mainnet'
    ? process.env.NEXT_PUBLIC_ROYALTY_ADDRESS_MAINNET
    : process.env.NEXT_PUBLIC_ROYALTY_ADDRESS_TESTNET;
  const royaltyRate = process.env.NEXT_PUBLIC_ROYALTY_RATE || '0.05';

  return {
    "721": {
      [policyId]: {
        [assetName]: {
          // Required CIP-25 fields
          "name": `${params.displayName} #${params.editionNumber}`,
          "image": params.imageUrl,
          "mediaType": inferMediaType(params.imageUrl),

          // CIP-27 Royalty fields (required for jpg.store)
          "royalty_addr": royaltyAddress,
          "royalty_rate": royaltyRate,

          // Commemorative metadata
          "description": `Awarded to Phase 1 beta testers of Mek Tycoon. Edition ${params.editionNumber} of unlimited.`,
          "edition": params.editionNumber,
          "series": "Commemorative Tokens",
          "tokenType": params.tokenType,

          // Provenance
          "mintedBy": params.walletAddress,
          "mintTimestamp": Date.now(),

          // Marketplace tags (for jpg.store searchability)
          "tags": [
            "Mek Tycoon",
            "Commemorative",
            "Phase 1",
            "Beta Tester",
            `Edition ${params.editionNumber}`
          ],

          // Project info
          "project": "Mek Tycoon",
          "category": "Commemorative Token",
          "website": "https://mek.overexposed.io"
        }
      }
    }
  };
}

/**
 * Infer media type from URL
 */
function inferMediaType(url: string): string {
  const lower = url.toLowerCase();

  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.mp4')) return 'video/mp4';

  // Default to image/png for IPFS URLs without extension
  if (url.startsWith('ipfs://')) return 'image/png';

  return 'image/png';
}

/**
 * Get difficulty variation name
 */
function getDifficultyVariation(difficulty: string): string {
  switch (difficulty) {
    case 'Easy': return 'Base';
    case 'Medium': return 'Intensified';
    case 'Hard': return 'Ultimate';
    default: return 'Unknown';
  }
}

/**
 * Validate metadata size (max 16 KB per transaction)
 *
 * References:
 * - Metadata limits: https://docs.cardano.org/explore-cardano/cardano-architecture/transaction-metadata/
 */
export function validateMetadataSize(metadata: any): {
  valid: boolean;
  sizeBytes: number;
  maxSizeBytes: number;
  error?: string;
} {
  const jsonString = JSON.stringify(metadata);
  const sizeBytes = Buffer.byteLength(jsonString, 'utf8');
  const maxSizeBytes = 16 * 1024; // 16 KB

  if (sizeBytes > maxSizeBytes) {
    return {
      valid: false,
      sizeBytes,
      maxSizeBytes,
      error: `Metadata too large: ${sizeBytes} bytes (max ${maxSizeBytes} bytes). Consider reducing description or removing fields.`
    };
  }

  return {
    valid: true,
    sizeBytes,
    maxSizeBytes
  };
}

/**
 * Validate CIP-25 compliance
 *
 * Checks for required fields
 */
export function validateCIP25Metadata(metadata: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for 721 label
  if (!metadata["721"]) {
    errors.push('Missing required "721" label');
    return { valid: false, errors };
  }

  // Get first policy (should only be one)
  const policyIds = Object.keys(metadata["721"]);
  if (policyIds.length === 0) {
    errors.push('No policy ID found in metadata');
    return { valid: false, errors };
  }

  const policyId = policyIds[0];
  const assetNames = Object.keys(metadata["721"][policyId]);
  if (assetNames.length === 0) {
    errors.push('No asset name found in metadata');
    return { valid: false, errors };
  }

  const assetName = assetNames[0];
  const nftMetadata = metadata["721"][policyId][assetName];

  // Check required fields
  if (!nftMetadata.name) {
    errors.push('Missing required field: name');
  }

  if (!nftMetadata.image) {
    errors.push('Missing required field: image');
  }

  // Validate image URL
  if (nftMetadata.image) {
    if (!nftMetadata.image.startsWith('ipfs://') && !nftMetadata.image.startsWith('https://')) {
      errors.push('Image URL must start with ipfs:// or https://');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Example metadata for reference
 */
export const EXAMPLE_EVENT_NFT_METADATA = {
  "721": {
    "7a3b2c1234567890...": { // Policy ID
      "4531536b756c6c42617368657230343200": { // Asset name (hex)
        "name": "E1: Skull Basher",
        "image": "ipfs://QmXxxx...",
        "mediaType": "image/gif",
        "description": "Awarded for completing Event 1 on Easy difficulty",
        "royalty_addr": "addr_test1...",
        "royalty_rate": "0.05",
        "eventNumber": 1,
        "eventName": "Skull Challenge",
        "difficulty": "Easy",
        "maxSupply": 100,
        "mintNumber": 42,
        "priceAda": 10,
        "tags": ["Mek Tycoon", "Story Climb", "Event 1", "Easy"]
      }
    }
  }
};
