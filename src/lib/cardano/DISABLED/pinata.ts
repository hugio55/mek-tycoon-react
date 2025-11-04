/**
 * Pinata IPFS Integration
 *
 * Upload files to IPFS via Pinata for NFT metadata
 *
 * API Docs: https://docs.pinata.cloud/api-reference
 */

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

/**
 * Upload a file to IPFS via Pinata
 *
 * @param file - File object to upload
 * @param metadata - Optional metadata (name, keyvalues)
 * @returns IPFS hash (CID)
 */
export async function uploadFileToPinata(
  file: File,
  metadata?: {
    name?: string;
    keyvalues?: Record<string, string>;
  }
): Promise<{ ipfsHash: string; ipfsUrl: string; gatewayUrl: string }> {
  if (!PINATA_JWT && !PINATA_API_KEY) {
    throw new Error('Pinata API credentials not configured. Add NEXT_PUBLIC_PINATA_JWT or NEXT_PUBLIC_PINATA_API_KEY to .env.local');
  }

  const formData = new FormData();
  formData.append('file', file);

  // Add metadata if provided
  if (metadata) {
    const pinataMetadata = {
      name: metadata.name || file.name,
      keyvalues: metadata.keyvalues || {}
    };
    formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
  }

  // Add options (use CIDv0 for shorter URLs - fits in Cardano 64-byte limit)
  const pinataOptions = {
    cidVersion: 0, // CIDv0 produces shorter hashes (Qm... format)
  };
  formData.append('pinataOptions', JSON.stringify(pinataOptions));

  // Prepare headers
  const headers: HeadersInit = {};
  if (PINATA_JWT) {
    headers['Authorization'] = `Bearer ${PINATA_JWT}`;
  } else if (PINATA_API_KEY && PINATA_SECRET_KEY) {
    headers['pinata_api_key'] = PINATA_API_KEY;
    headers['pinata_secret_api_key'] = PINATA_SECRET_KEY;
  }

  const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Pinata upload failed: ${response.statusText}. ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const ipfsHash = data.IpfsHash;

  return {
    ipfsHash,
    ipfsUrl: `ipfs://${ipfsHash}`,
    gatewayUrl: `${PINATA_GATEWAY}/ipfs/${ipfsHash}`
  };
}

/**
 * Upload JSON metadata to IPFS via Pinata
 *
 * @param jsonData - JSON object to upload
 * @param name - Name for the JSON file
 * @returns IPFS hash (CID)
 */
export async function uploadJSONToPinata(
  jsonData: any,
  name?: string
): Promise<{ ipfsHash: string; ipfsUrl: string; gatewayUrl: string }> {
  if (!PINATA_JWT && !PINATA_API_KEY) {
    throw new Error('Pinata API credentials not configured');
  }

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (PINATA_JWT) {
    headers['Authorization'] = `Bearer ${PINATA_JWT}`;
  } else if (PINATA_API_KEY && PINATA_SECRET_KEY) {
    headers['pinata_api_key'] = PINATA_API_KEY;
    headers['pinata_secret_api_key'] = PINATA_SECRET_KEY;
  }

  const body = {
    pinataContent: jsonData,
    pinataMetadata: {
      name: name || 'metadata.json'
    },
    pinataOptions: {
      cidVersion: 0 // CIDv0 for shorter hashes
    }
  };

  const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Pinata JSON upload failed: ${response.statusText}. ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const ipfsHash = data.IpfsHash;

  return {
    ipfsHash,
    ipfsUrl: `ipfs://${ipfsHash}`,
    gatewayUrl: `${PINATA_GATEWAY}/ipfs/${ipfsHash}`
  };
}

/**
 * Test Pinata connection
 *
 * @returns Connection status
 */
export async function testPinataConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!PINATA_JWT && !PINATA_API_KEY) {
    return {
      success: false,
      message: 'Pinata API credentials not configured'
    };
  }

  try {
    // Prepare headers
    const headers: HeadersInit = {};
    if (PINATA_JWT) {
      headers['Authorization'] = `Bearer ${PINATA_JWT}`;
    } else if (PINATA_API_KEY && PINATA_SECRET_KEY) {
      headers['pinata_api_key'] = PINATA_API_KEY;
      headers['pinata_secret_api_key'] = PINATA_SECRET_KEY;
    }

    const response = await fetch(`${PINATA_API_URL}/data/testAuthentication`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Authentication failed: ${response.statusText}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `Connected to Pinata: ${data.message}`
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Convert IPFS URL to gateway URL
 *
 * @param ipfsUrl - IPFS URL (ipfs://...)
 * @returns HTTP gateway URL
 */
export function ipfsToGatewayUrl(ipfsUrl: string): string {
  if (ipfsUrl.startsWith('ipfs://')) {
    const hash = ipfsUrl.replace('ipfs://', '');
    return `${PINATA_GATEWAY}/ipfs/${hash}`;
  }
  return ipfsUrl;
}

/**
 * Get file info from Pinata
 *
 * @param ipfsHash - IPFS hash (CID)
 * @returns File metadata
 */
export async function getPinataFileInfo(ipfsHash: string): Promise<any> {
  if (!PINATA_JWT && !PINATA_API_KEY) {
    throw new Error('Pinata API credentials not configured');
  }

  // Prepare headers
  const headers: HeadersInit = {};
  if (PINATA_JWT) {
    headers['Authorization'] = `Bearer ${PINATA_JWT}`;
  } else if (PINATA_API_KEY && PINATA_SECRET_KEY) {
    headers['pinata_api_key'] = PINATA_API_KEY;
    headers['pinata_secret_api_key'] = PINATA_SECRET_KEY;
  }

  const response = await fetch(
    `${PINATA_API_URL}/data/pinList?hashContains=${ipfsHash}`,
    {
      method: 'GET',
      headers
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get file info: ${response.statusText}`);
  }

  const data = await response.json();
  return data.rows?.[0] || null;
}
