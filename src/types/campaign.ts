/**
 * Campaign and NFT Inventory Type Definitions
 *
 * Defines core types for NFT campaign management, inventory tracking,
 * and reservation systems.
 */

import { Id } from "@/convex/_generated/dataModel";

// NFT Status States
export type NFTStatus = "available" | "reserved" | "sold";

// Campaign Status States
export type CampaignStatus = "active" | "inactive";

// NFT Inventory Item
export interface NFTInventoryItem {
  _id: Id<"commemorativeNFTInventory">;
  nftUid: string;
  nftNumber: number;
  name: string;
  status: NFTStatus;
  projectId: string;
  paymentUrl: string;
  imageUrl?: string;
  createdAt: number;
  campaignId?: Id<"commemorativeCampaigns">;
}

// Campaign Definition
export interface Campaign {
  _id: Id<"commemorativeCampaigns">;
  name: string;
  description: string;
  nmkrProjectId: string;
  status: CampaignStatus;
  maxNFTs: number;
  totalNFTs: number;
  availableNFTs: number;
  reservedNFTs: number;
  soldNFTs: number;
  createdAt: number;
  updatedAt: number;
  startDate?: number;
  endDate?: number;
}

// Campaign with Statistics
export interface CampaignWithStats extends Campaign {
  stats: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
  };
}

// CSV Import Result
export interface CSVImportResult {
  success: boolean;
  created: number;
  skipped: number;
  errors?: string[];
}

// NFT Entry for Manual Input
export interface NFTEntry {
  nftUid: string;
  nftNumber: number;
  name: string;
}

// NFT Reservation
export interface NFTReservation {
  _id: Id<"commemorativeNFTReservations">;
  nftInventoryId: Id<"commemorativeNFTInventory">;
  nftUid: string;
  nftNumber: number;
  reservedBy: string;
  reservedAt: number;
  expiresAt: number;
  status: "active" | "expired" | "completed" | "cancelled";
}
