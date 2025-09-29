"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import crypto from "crypto";

// Merkle tree implementation for gold accumulation proofs
class MerkleTree {
  private leaves: string[];
  private levels: string[][];

  constructor(data: string[]) {
    this.leaves = data.map(item => this.hash(item));
    this.levels = this.buildTree();
  }

  private hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private buildTree(): string[][] {
    const levels: string[][] = [this.leaves];

    while (levels[levels.length - 1].length > 1) {
      const currentLevel = levels[levels.length - 1];
      const nextLevel: string[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left;
        nextLevel.push(this.hash(left + right));
      }

      levels.push(nextLevel);
    }

    return levels;
  }

  getRoot(): string {
    return this.levels[this.levels.length - 1][0];
  }

  getProof(index: number): string[] {
    const proof: string[] = [];
    let currentIndex = index;

    for (let i = 0; i < this.levels.length - 1; i++) {
      const level = this.levels[i];
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < level.length) {
        proof.push(level[siblingIndex]);
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }
}

// Create a checkpoint for gold accumulation
export const createGoldCheckpoint = action({
  args: {
    walletAddress: v.string(),
    goldAmount: v.number(),
    mekData: v.array(v.object({
      assetId: v.string(),
      goldRate: v.number(),
      lastUpdate: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Create leaf data for merkle tree
      const leafData = [
        args.walletAddress,
        args.goldAmount.toString(),
        ...args.mekData.map(m => `${m.assetId}:${m.goldRate}:${m.lastUpdate}`)
      ];

      // Build merkle tree
      const tree = new MerkleTree(leafData);
      const merkleRoot = tree.getRoot();

      // Simulate blockchain interaction
      // In production, this would submit to a smart contract
      const blockHeight = Math.floor(Math.random() * 1000000) + 10000000;
      const txHash = crypto.randomBytes(32).toString('hex');

      // Store checkpoint in database
      const checkpointId = await ctx.runMutation(api.goldCheckpointing.storeCheckpoint, {
        walletAddress: args.walletAddress,
        goldAmount: args.goldAmount,
        merkleRoot,
        blockHeight,
        txHash,
        timestamp: Date.now(),
        mekCount: args.mekData.length,
        totalGoldRate: args.mekData.reduce((sum, m) => sum + m.goldRate, 0),
      });

      return {
        success: true,
        checkpointId,
        merkleRoot,
        blockHeight,
        txHash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to create checkpoint",
      };
    }
  },
});

// Verify a merkle proof
export const verifyMerkleProof = action({
  args: {
    leafData: v.string(),
    proof: v.array(v.string()),
    root: v.string(),
    index: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      const leafHash = crypto.createHash('sha256').update(args.leafData).digest('hex');
      let currentHash = leafHash;
      let currentIndex = args.index;

      for (const proofElement of args.proof) {
        const isRightNode = currentIndex % 2 === 1;
        const combinedHash = isRightNode
          ? proofElement + currentHash
          : currentHash + proofElement;

        currentHash = crypto.createHash('sha256').update(combinedHash).digest('hex');
        currentIndex = Math.floor(currentIndex / 2);
      }

      return {
        valid: currentHash === args.root,
        computedRoot: currentHash,
        expectedRoot: args.root,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || "Verification failed",
      };
    }
  },
});