// Verification Service - Compare wallet-reported vs blockchain-verified NFTs
// Separated from fetching and snapshot logic for single responsibility

import { ParsedMek } from "./nftFetchingService";

// Verification result types
export interface VerificationResult {
  verified: boolean;
  walletReportedCount: number;
  blockchainVerifiedCount: number;
  falsePositives: ParsedMek[]; // Claimed but not on blockchain
  missingMeks: ParsedMek[]; // On blockchain but not reported
  verifiedMeks: ParsedMek[]; // The source of truth
  discrepancyDetails?: DiscrepancyDetails;
}

export interface DiscrepancyDetails {
  falsePositiveIds: string[];
  missingMekIds: string[];
  summary: string;
}

// Input for verification
export interface WalletReportedMek {
  assetId: string;
  assetName: string;
  mekNumber: number;
}

// Verify NFT ownership by comparing wallet-reported vs blockchain-verified
export function verifyNFTOwnership(
  walletReportedMeks: WalletReportedMek[],
  blockchainMeks: ParsedMek[]
): VerificationResult {
  console.log('[VerificationService] Comparing wallet-reported vs blockchain MEKs');
  console.log('[VerificationService] Wallet reported:', walletReportedMeks.length);
  console.log('[VerificationService] Blockchain verified:', blockchainMeks.length);

  // Create sets for efficient comparison
  const walletMekIds = new Set(walletReportedMeks.map(m => m.assetId));
  const blockchainMekIds = new Set(blockchainMeks.map(m => m.assetId));

  // Find false positives (wallet claims ownership but not on blockchain)
  const falsePositives = walletReportedMeks.filter(
    m => !blockchainMekIds.has(m.assetId)
  );

  // Find missing Meks (on blockchain but not reported by wallet)
  const missingMeks = blockchainMeks.filter(
    m => !walletMekIds.has(m.assetId)
  );

  // Verification passes only if no discrepancies
  const verified = falsePositives.length === 0 && missingMeks.length === 0;

  console.log('[VerificationService] False positives (claimed but not on blockchain):', falsePositives.length);
  console.log('[VerificationService] Missing MEKs (on blockchain but not reported):', missingMeks.length);
  console.log('[VerificationService] Verification result:', verified ? 'VERIFIED' : 'FAILED');

  // Build detailed discrepancy info if verification failed
  let discrepancyDetails: DiscrepancyDetails | undefined;
  if (!verified) {
    discrepancyDetails = {
      falsePositiveIds: falsePositives.map(m => m.assetId),
      missingMekIds: missingMeks.map(m => m.assetId),
      summary: buildDiscrepancySummary(falsePositives.length, missingMeks.length)
    };
  }

  return {
    verified,
    walletReportedCount: walletReportedMeks.length,
    blockchainVerifiedCount: blockchainMeks.length,
    falsePositives,
    missingMeks,
    verifiedMeks: blockchainMeks, // Blockchain is source of truth
    discrepancyDetails
  };
}

// Build user-friendly summary of discrepancies
function buildDiscrepancySummary(falsePositiveCount: number, missingMekCount: number): string {
  const parts: string[] = [];

  if (falsePositiveCount > 0) {
    parts.push(`${falsePositiveCount} NFT(s) claimed by wallet but not found on blockchain`);
  }

  if (missingMekCount > 0) {
    parts.push(`${missingMekCount} NFT(s) on blockchain but not reported by wallet`);
  }

  if (parts.length === 0) {
    return 'Unknown verification error';
  }

  return parts.join('; ');
}

// Calculate verification confidence score (0-100)
export function calculateVerificationConfidence(result: VerificationResult): number {
  if (result.verified) {
    return 100;
  }

  // Calculate how close we are to verification
  const totalReported = result.walletReportedCount;
  const totalBlockchain = result.blockchainVerifiedCount;
  const discrepancies = result.falsePositives.length + result.missingMeks.length;

  if (totalReported === 0 && totalBlockchain === 0) {
    return 0; // No NFTs at all
  }

  const maxCount = Math.max(totalReported, totalBlockchain);
  const matchingCount = maxCount - discrepancies;

  return Math.round((matchingCount / maxCount) * 100);
}
