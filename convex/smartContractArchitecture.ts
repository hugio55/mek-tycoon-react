

import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Smart Contract Architecture for On-Chain Rate Calculations
 *
 * This module defines the architecture for moving gold mining rates
 * from client-side calculations to trustless on-chain smart contracts.
 *
 * In production, these would be Plutus validators on Cardano.
 */

// Smart contract parameter structure (would be stored on-chain)
interface ContractParams {
  baseRate: number;
  rarityMultipliers: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
    genesis: number;
  };
  variationBonuses: Map<string, number>;
  globalMultiplier: number;
  maxAccumulation: number;
  checkpointInterval: number;
}

// Plutus validator pseudocode structure
const PLUTUS_VALIDATOR_TEMPLATE = `
-- Mek Gold Mining Rate Calculator Validator
-- This validator calculates gold rates based on NFT attributes

{-# INLINABLE mkGoldRateValidator #-}
mkGoldRateValidator :: ContractParams -> MekNFT -> ScriptContext -> Bool
mkGoldRateValidator params nft ctx =
  let
    -- Verify NFT ownership
    ownerVerified = verifyNFTOwner nft (txInfoInputs (scriptContextTxInfo ctx))

    -- Calculate base rate from NFT attributes
    baseRate = calculateBaseRate (mekHead nft) (mekBody nft) (mekTrait nft)

    -- Apply rarity multiplier
    rarityMultiplier = getRarityMultiplier params (mekRarity nft)

    -- Apply variation bonuses
    variationBonus = getVariationBonus params (mekVariations nft)

    -- Calculate final rate
    finalRate = baseRate * rarityMultiplier * variationBonus * globalMultiplier params

    -- Ensure rate is within bounds
    rateValid = finalRate > 0 && finalRate <= maxRate params

  in
    ownerVerified && rateValid

-- Helper function to calculate dynamic rates based on network state
calculateDynamicRate :: NetworkState -> MekNFT -> Integer
calculateDynamicRate state nft =
  let
    totalStaked = getTotalStakedMeks state
    mekRarity = calculateRarity nft
    marketPrice = getFloorPrice MEK_POLICY_ID state

    -- Dynamic rate based on:
    -- 1. Scarcity (fewer staked = higher rates)
    -- 2. Rarity (rarer NFTs = higher rates)
    -- 3. Market value (higher floor = higher rates)
    scarcityMultiplier = max 1 (10000 / totalStaked)
    priceMultiplier = marketPrice / BASE_PRICE

  in
    BASE_RATE * mekRarity * scarcityMultiplier * priceMultiplier
`;

// Store contract parameters (simulated - would be on-chain)
export const storeContractParams = mutation({
  args: {
    baseRate: v.number(),
    rarityMultipliers: v.object({
      common: v.number(),
      uncommon: v.number(),
      rare: v.number(),
      epic: v.number(),
      legendary: v.number(),
      genesis: v.number(),
    }),
    globalMultiplier: v.number(),
    maxAccumulation: v.number(),
    checkpointInterval: v.number(),
    updatedBy: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // In production, this would submit a transaction to update on-chain params
    // For now, store in database with audit trail

    // Log the parameter change
    await ctx.db.insert("auditLogs", {
      type: "contractParamUpdate",
      timestamp: Date.now(),
      createdAt: Date.now(),
      changedBy: args.updatedBy,
      reason: args.reason,
      oldRate: 0, // Would fetch previous
      newRate: args.baseRate,
    });

    return {
      success: true,
      message: "Contract parameters updated (simulated)",
      params: args,
      validator: PLUTUS_VALIDATOR_TEMPLATE,
    };
  },
});

// Simulate fetching rates from smart contract
export const fetchOnChainRates = action({
  args: {
    mekAssets: v.array(
      v.object({
        assetId: v.string(),
        mekNumber: v.optional(v.number()), // Optional because some old data might not have it
        headVariation: v.optional(v.string()),
        bodyVariation: v.optional(v.string()),
        itemVariation: v.optional(v.string()),
        rarityTier: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // In production, this would query the blockchain for current rates
    // For now, calculate rates based on our architecture

    // Filter out meks without mekNumber
    const validMeks = args.mekAssets.filter(m => m.mekNumber !== undefined);

    if (validMeks.length < args.mekAssets.length) {
      console.warn(`[fetchOnChainRates] Filtered out ${args.mekAssets.length - validMeks.length} meks without mekNumber`);
    }

    const rates = validMeks.map((mek) => {
      // Base rate calculation (would be on-chain)
      let baseRate = 10; // Base gold per hour

      // Apply head bonus
      if (mek.headVariation) {
        const headBonuses: Record<string, number> = {
          'cam': 1.5,  // Camera heads get 50% bonus
          'mus': 1.3,  // Musical heads get 30% bonus
          'mat': 1.2,  // Material heads get 20% bonus
        };
        const prefix = mek.headVariation.substring(0, 3).toLowerCase();
        baseRate *= headBonuses[prefix] || 1;
      }

      // Apply body bonus
      if (mek.bodyVariation) {
        const bodyBonuses: Record<string, number> = {
          'str': 1.4,  // Strong bodies get 40% bonus
          'spd': 1.3,  // Speed bodies get 30% bonus
          'def': 1.2,  // Defensive bodies get 20% bonus
        };
        const prefix = mek.bodyVariation.substring(0, 3).toLowerCase();
        baseRate *= bodyBonuses[prefix] || 1;
      }

      // Apply rarity multiplier
      const rarityMultipliers: Record<string, number> = {
        'common': 1,
        'uncommon': 1.5,
        'rare': 2,
        'epic': 3,
        'legendary': 5,
        'genesis': 10,
      };
      baseRate *= rarityMultipliers[mek.rarityTier || 'common'];

      // Apply dynamic adjustments (would come from oracle)
      const dynamicMultiplier = 1 + (Math.random() * 0.2 - 0.1); // ±10% variation
      baseRate *= dynamicMultiplier;

      return {
        assetId: mek.assetId,
        mekNumber: mek.mekNumber,
        baseRate: Math.floor(baseRate),
        contractCalculated: true,
        lastUpdate: Date.now(),
      };
    });

    return {
      success: true,
      rates,
      contractAddress: "addr1_mek_gold_mining_validator", // Simulated
      validatorHash: "abc123def456", // Simulated
      message: "Rates fetched from smart contract (simulated)",
    };
  },
});

// Governance proposal for rate changes
export const proposeRateChange = mutation({
  args: {
    proposer: v.string(),
    changeType: v.string(), // "baseRate", "multiplier", "bonus"
    oldValue: v.number(),
    newValue: v.number(),
    reason: v.string(),
    votingDeadline: v.number(),
  },
  handler: async (ctx, args) => {
    // In production, this would create an on-chain governance proposal
    // For now, log the proposal

    const proposalId = `proposal_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await ctx.db.insert("auditLogs", {
      type: "governanceProposal",
      timestamp: Date.now(),
      createdAt: Date.now(),
      changedBy: args.proposer,
      reason: args.reason,
      oldRate: args.oldValue,
      newRate: args.newValue,
    });

    return {
      success: true,
      proposalId,
      message: "Rate change proposal submitted (would be on-chain)",
      votingDeadline: args.votingDeadline,
      requiredVotes: 100, // Example threshold
    };
  },
});

// Oracle service for dynamic rate adjustments
export const updateRateOracle = action({
  args: {
    totalStakedMeks: v.number(),
    floorPrice: v.number(),
    averageLevel: v.number(),
    networkCongestion: v.number(),
  },
  handler: async (ctx, args) => {
    // Calculate dynamic adjustments based on network metrics
    const scarcityFactor = Math.max(1, 10000 / args.totalStakedMeks);
    const priceFactor = args.floorPrice / 100; // Normalize to base price
    const levelFactor = args.averageLevel / 10;
    const congestionPenalty = 1 - (args.networkCongestion * 0.1);

    const dynamicMultiplier = scarcityFactor * priceFactor * levelFactor * congestionPenalty;

    // In production, this would update an on-chain oracle
    return {
      success: true,
      dynamicMultiplier,
      factors: {
        scarcity: scarcityFactor,
        price: priceFactor,
        level: levelFactor,
        congestion: congestionPenalty,
      },
      timestamp: Date.now(),
      message: "Oracle updated with dynamic rate factors",
    };
  },
});

// Get current contract state
export const getContractState = query({
  args: {},
  handler: async (ctx) => {
    // In production, would query blockchain state
    return {
      contractAddress: "addr1_mek_gold_mining_validator",
      validatorHash: "abc123def456",
      currentParams: {
        baseRate: 10,
        maxAccumulation: 50000,
        checkpointInterval: 3600, // 1 hour
        lastUpdate: Date.now(),
      },
      totalStaked: 1234,
      totalRewardsDistributed: 5678900,
      activeValidators: 5,
      pendingProposals: 2,
    };
  },
});