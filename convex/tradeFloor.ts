import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import mekRarityMaster from "./mekRarityMaster.json";

// Build sourceKey to variation lookup from master data (source of truth)
const sourceKeyToVariations = new Map<string, { head: string; body: string; trait: string }>();
(mekRarityMaster as any[]).forEach((mek) => {
  if (mek.sourceKey && mek.head && mek.body && mek.trait) {
    // Normalize key: uppercase, remove suffix
    const normalizedKey = mek.sourceKey.toUpperCase().replace(/-[A-Z]$/i, "");
    sourceKeyToVariations.set(normalizedKey, {
      head: mek.head,
      body: mek.body,
      trait: mek.trait,
    });
  }
});

// Helper: Get variation names from sourceKey (source of truth)
function getVariationsFromSourceKey(sourceKey?: string): { head?: string; body?: string; trait?: string } {
  if (!sourceKey) return {};
  const normalizedKey = sourceKey.toUpperCase().replace(/-[A-Z]$/i, "");
  const data = sourceKeyToVariations.get(normalizedKey);
  return data || {};
}

// Helper: Compute which desired variations a Mek matches
// Uses sourceKey lookup as the source of truth (database variation fields may be stale)
function computeMatchedVariations(
  mek: { sourceKey?: string; headVariation?: string; bodyVariation?: string; itemVariation?: string },
  desiredVariations: { variationName: string; variationType: string }[]
): string[] {
  const matches: string[] = [];

  // Get variation names from sourceKey (source of truth)
  const fromSourceKey = getVariationsFromSourceKey(mek.sourceKey);

  // Use sourceKey data if available, fallback to database fields
  const headName = fromSourceKey.head || mek.headVariation;
  const bodyName = fromSourceKey.body || mek.bodyVariation;
  const traitName = fromSourceKey.trait || mek.itemVariation;

  for (const desired of desiredVariations) {
    const desiredNameLower = desired.variationName.toLowerCase().trim();

    // Check all three variation fields
    const headLower = headName?.toLowerCase().trim();
    const bodyLower = bodyName?.toLowerCase().trim();
    const traitLower = traitName?.toLowerCase().trim();

    if (headLower === desiredNameLower || bodyLower === desiredNameLower || traitLower === desiredNameLower) {
      matches.push(desired.variationName);
    }
  }
  return matches;
}

// =============================================================================
// QUERIES
// =============================================================================

// Get active listing count for a user (for 5-max validation)
export const getActiveListingCount = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("tradeListings")
      .withIndex("by_owner_status", (q) =>
        q.eq("ownerStakeAddress", args.stakeAddress).eq("status", "active")
      )
      .collect();
    return listings.length;
  },
});

// Get user's own listings with offer counts (total and new/unseen)
export const getMyListings = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("tradeListings")
      .withIndex("by_owner_status", (q) =>
        q.eq("ownerStakeAddress", args.stakeAddress).eq("status", "active")
      )
      .collect();

    // Get offer counts for each listing (total and new)
    const listingsWithCounts = await Promise.all(
      listings.map(async (listing) => {
        const offers = await ctx.db
          .query("tradeOffers")
          .withIndex("by_listing_status", (q) =>
            q.eq("listingId", listing._id).eq("status", "pending")
          )
          .collect();

        // Count new offers (created after lastViewedOffersAt)
        const lastViewed = listing.lastViewedOffersAt || 0;
        const newOfferCount = offers.filter(o => o.createdAt > lastViewed).length;

        return {
          ...listing,
          pendingOfferCount: offers.length,
          newOfferCount, // New/unseen offers
        };
      })
    );

    return listingsWithCounts;
  },
});

// Get user's pending offers on other listings
export const getMyOffers = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const offers = await ctx.db
      .query("tradeOffers")
      .withIndex("by_offerer_status", (q) =>
        q.eq("offererStakeAddress", args.stakeAddress).eq("status", "pending")
      )
      .collect();

    // Enrich with listing data
    const enrichedOffers = await Promise.all(
      offers.map(async (offer) => {
        const listing = await ctx.db.get(offer.listingId);
        return {
          ...offer,
          listing: listing
            ? {
                _id: listing._id,
                ownerStakeAddress: listing.ownerStakeAddress,
                ownerCorpName: listing.ownerCorpName,
                listedMekAssetId: listing.listedMekAssetId,
                listedMekSourceKey: listing.listedMekSourceKey,
                listedMekAssetName: listing.listedMekAssetName,
                desiredVariations: listing.desiredVariations,
                status: listing.status,
              }
            : null,
        };
      })
    );

    return enrichedOffers;
  },
});

// Get all offers on a specific listing (for the listing owner)
export const getListingOffers = query({
  args: {
    listingId: v.id("tradeListings"),
    ownerStakeAddress: v.string(), // For auth check
  },
  handler: async (ctx, args) => {
    // Verify ownership
    const listing = await ctx.db.get(args.listingId);
    if (!listing || listing.ownerStakeAddress !== args.ownerStakeAddress) {
      return [];
    }

    const offers = await ctx.db
      .query("tradeOffers")
      .withIndex("by_listing_status", (q) =>
        q.eq("listingId", args.listingId).eq("status", "pending")
      )
      .collect();

    return offers;
  },
});

// Get user's Meks that match a listing's desired variations
export const getMatchingMeksForListing = query({
  args: {
    listingId: v.id("tradeListings"),
    viewerStakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing || listing.status !== "active") {
      return [];
    }

    // Get viewer's Meks
    const viewerMeks = await ctx.db
      .query("meks")
      .withIndex("by_owner_stake", (q) =>
        q.eq("ownerStakeAddress", args.viewerStakeAddress)
      )
      .collect();

    // Filter to those that match at least one desired variation
    const matchingMeks = viewerMeks
      .map((mek) => {
        const matchedVariations = computeMatchedVariations(mek, listing.desiredVariations);
        return {
          ...mek,
          matchedVariations,
          matchCount: matchedVariations.length,
        };
      })
      .filter((mek) => mek.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount);

    console.log("[TRADE-MATCH] matchingMeks count:", matchingMeks.length);
    return matchingMeks;
  },
});

// Browse listings - sorted by match count for the viewer
export const getBrowseListings = query({
  args: {
    viewerStakeAddress: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Get all active listings
    const listings = await ctx.db
      .query("tradeListings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Note: We no longer filter out viewer's own listings
    // They will be marked with isOwnListing flag instead

    // Filter out listings from inactive users (30+ days) and get offer counts
    const filteredListings = await Promise.all(
      listings.map(async (listing) => {
        const owner = await ctx.db
          .query("users")
          .withIndex("by_stake_address", (q) =>
            q.eq("stakeAddress", listing.ownerStakeAddress)
          )
          .first();

        // If owner not found or inactive for 30+ days, filter out
        if (!owner) return null;
        const lastLogin = owner.lastLogin || owner.createdAt || 0;
        if (now - lastLogin > THIRTY_DAYS_MS) return null;

        // Get offer count for this listing
        const offers = await ctx.db
          .query("tradeOffers")
          .withIndex("by_listing_status", (q) =>
            q.eq("listingId", listing._id).eq("status", "pending")
          )
          .collect();

        return {
          ...listing,
          offerCount: offers.length,
        };
      })
    );

    const activeListings = filteredListings.filter((l) => l !== null);

    // If viewer is logged in, compute match counts
    if (args.viewerStakeAddress) {
      const viewerMeks = await ctx.db
        .query("meks")
        .withIndex("by_owner_stake", (q) =>
          q.eq("ownerStakeAddress", args.viewerStakeAddress)
        )
        .collect();

      const listingsWithMatchCount = activeListings.map((listing) => {
        // Check if this is the viewer's own listing
        const isOwnListing = listing.ownerStakeAddress === args.viewerStakeAddress;

        // Only compute matches for listings that aren't the viewer's own
        let bestMatchCount = 0;
        if (!isOwnListing) {
          for (const mek of viewerMeks) {
            const matches = computeMatchedVariations(mek, listing.desiredVariations);
            if (matches.length > bestMatchCount) {
              bestMatchCount = matches.length;
            }
          }
        }
        return {
          ...listing,
          viewerMatchCount: bestMatchCount,
          isOwnListing,
        };
      });

      // Sort by match count descending, then by created date descending
      // Own listings go to the end regardless of match count
      listingsWithMatchCount.sort((a, b) => {
        // Own listings always at the bottom
        if (a.isOwnListing !== b.isOwnListing) {
          return a.isOwnListing ? 1 : -1;
        }
        if (b.viewerMatchCount !== a.viewerMatchCount) {
          return b.viewerMatchCount - a.viewerMatchCount;
        }
        return b.createdAt - a.createdAt;
      });

      return listingsWithMatchCount;
    }

    // For non-logged-in users, just return sorted by date
    return activeListings.sort((a, b) => b.createdAt - a.createdAt).map(l => ({
      ...l,
      isOwnListing: false,
    }));
  },
});

// Get a single listing by ID
export const getListing = query({
  args: {
    listingId: v.id("tradeListings"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.listingId);
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

// Create a new trade listing
export const createListing = mutation({
  args: {
    ownerStakeAddress: v.string(),
    mekAssetId: v.string(),
    desiredVariations: v.array(
      v.object({
        variationName: v.string(),
        variationType: v.union(v.literal("head"), v.literal("body"), v.literal("trait")),
        variationId: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Validate max 6 variations
    if (args.desiredVariations.length > 6) {
      throw new Error("Maximum 6 desired variations allowed");
    }
    if (args.desiredVariations.length === 0) {
      throw new Error("At least 1 desired variation required");
    }

    // Validate max 5 active listings
    const activeListings = await ctx.db
      .query("tradeListings")
      .withIndex("by_owner_status", (q) =>
        q.eq("ownerStakeAddress", args.ownerStakeAddress).eq("status", "active")
      )
      .collect();

    if (activeListings.length >= 5) {
      throw new Error("Maximum 5 active listings allowed. Cancel an existing listing first.");
    }

    // Validate user owns the Mek
    const mek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q) => q.eq("assetId", args.mekAssetId))
      .first();

    if (!mek || mek.ownerStakeAddress !== args.ownerStakeAddress) {
      throw new Error("You don't own this Mek");
    }

    // Check Mek isn't already listed
    const existingListing = await ctx.db
      .query("tradeListings")
      .withIndex("by_mek", (q) => q.eq("listedMekAssetId", args.mekAssetId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existingListing) {
      throw new Error("This Mek is already listed for trade");
    }

    // Get owner corp name for caching
    const owner = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q) =>
        q.eq("stakeAddress", args.ownerStakeAddress)
      )
      .first();

    const now = Date.now();
    const listingId = await ctx.db.insert("tradeListings", {
      ownerStakeAddress: args.ownerStakeAddress,
      listedMekAssetId: args.mekAssetId,
      desiredVariations: args.desiredVariations,
      status: "active",
      createdAt: now,
      updatedAt: now,
      listedMekSourceKey: mek.sourceKey || mek.sourceKeyBase,
      listedMekAssetName: mek.assetName,
      ownerCorpName: owner?.corporationName,
    });

    return listingId;
  },
});

// Cancel a listing and notify offerers
export const cancelListing = mutation({
  args: {
    listingId: v.id("tradeListings"),
    ownerStakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }
    if (listing.ownerStakeAddress !== args.ownerStakeAddress) {
      throw new Error("You don't own this listing");
    }
    if (listing.status !== "active") {
      throw new Error("Listing is not active");
    }

    // Update listing status
    await ctx.db.patch(args.listingId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    // Get all pending offers and mark them as listing_closed
    const offers = await ctx.db
      .query("tradeOffers")
      .withIndex("by_listing_status", (q) =>
        q.eq("listingId", args.listingId).eq("status", "pending")
      )
      .collect();

    // Update offers and create notifications
    for (const offer of offers) {
      await ctx.db.patch(offer._id, {
        status: "listing_closed",
        updatedAt: Date.now(),
      });

      // Find the offerer's user record for notification
      const offerer = await ctx.db
        .query("users")
        .withIndex("by_stake_address", (q) =>
          q.eq("stakeAddress", offer.offererStakeAddress)
        )
        .first();

      if (offerer) {
        // Create notification
        await ctx.db.insert("notifications", {
          userId: offerer._id,
          type: "TradeFloor",
          title: "Trade Offer Closed",
          subtitle: `Your offer on ${listing.listedMekAssetName || "a Mek"} is closed due to the owner delisting.`,
          linkTo: "/tradefloor",
          linkParams: { tab: "my-offers" },
          isRead: false,
          createdAt: Date.now(),
          sourceType: "trade_listing_closed",
          sourceId: args.listingId,
        });
      }
    }

    return true;
  },
});

// Submit an offer on a listing
export const submitOffer = mutation({
  args: {
    listingId: v.id("tradeListings"),
    offererStakeAddress: v.string(),
    offeredMekAssetIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate 1-3 Meks
    if (args.offeredMekAssetIds.length < 1 || args.offeredMekAssetIds.length > 3) {
      throw new Error("Must offer 1-3 Meks");
    }

    // Get the listing
    const listing = await ctx.db.get(args.listingId);
    if (!listing || listing.status !== "active") {
      throw new Error("Listing not found or not active");
    }

    // Cannot offer on own listing
    if (listing.ownerStakeAddress === args.offererStakeAddress) {
      throw new Error("Cannot offer on your own listing");
    }

    // Check for existing pending offer from this user on this listing
    const existingOffer = await ctx.db
      .query("tradeOffers")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .filter((q) =>
        q.and(
          q.eq(q.field("offererStakeAddress"), args.offererStakeAddress),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingOffer) {
      throw new Error("You already have a pending offer on this listing. Withdraw it first.");
    }

    // Validate user owns all offered Meks and build offered Meks array
    const offeredMeks: {
      assetId: string;
      sourceKey?: string;
      assetName?: string;
      matchedVariations: string[];
    }[] = [];

    for (const assetId of args.offeredMekAssetIds) {
      const mek = await ctx.db
        .query("meks")
        .withIndex("by_asset_id", (q) => q.eq("assetId", assetId))
        .first();

      if (!mek || mek.ownerStakeAddress !== args.offererStakeAddress) {
        throw new Error(`You don't own Mek ${assetId}`);
      }

      const matchedVariations = computeMatchedVariations(mek, listing.desiredVariations);

      offeredMeks.push({
        assetId: mek.assetId,
        sourceKey: mek.sourceKey || mek.sourceKeyBase,
        assetName: mek.assetName,
        matchedVariations,
      });
    }

    // Get offerer corp name
    const offerer = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q) =>
        q.eq("stakeAddress", args.offererStakeAddress)
      )
      .first();

    const now = Date.now();
    const offerId = await ctx.db.insert("tradeOffers", {
      listingId: args.listingId,
      offererStakeAddress: args.offererStakeAddress,
      offeredMeks,
      status: "pending",
      offererCorpName: offerer?.corporationName,
      createdAt: now,
      updatedAt: now,
    });

    // Create notification for listing owner about new offer
    const listingOwner = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q) =>
        q.eq("stakeAddress", listing.ownerStakeAddress)
      )
      .first();

    if (listingOwner) {
      // Check for existing unread TradeFloor notification to clump offers
      const existingNotification = await ctx.db
        .query("notifications")
        .withIndex("by_user_unread", (q) =>
          q.eq("userId", listingOwner._id).eq("isRead", false)
        )
        .filter((q) => q.eq(q.field("type"), "TradeFloor"))
        .filter((q) => q.eq(q.field("sourceType"), "trade_offers_clump"))
        .first();

      if (existingNotification) {
        // Update existing notification with new count
        const currentCount = (existingNotification.linkParams as { count?: number })?.count || 1;
        await ctx.db.patch(existingNotification._id, {
          title: `${currentCount + 1} New Trade Offers`,
          subtitle: "You have new offers on your trade listings",
          linkParams: { tab: "my-listings", count: currentCount + 1 },
          createdAt: now, // Bump to top
        });
      } else {
        // Create new notification
        await ctx.db.insert("notifications", {
          userId: listingOwner._id,
          type: "TradeFloor",
          title: "New Trade Offer",
          subtitle: `${offerer?.corporationName || "A player"} made an offer on ${listing.listedMekAssetName || "your Mek"}`,
          linkTo: "/tradefloor",
          linkParams: { tab: "my-listings", count: 1 },
          isRead: false,
          createdAt: now,
          sourceType: "trade_offers_clump",
          sourceId: listingOwner._id, // Use owner ID so clumping persists
        });
      }
    }

    return offerId;
  },
});

// Withdraw a pending offer
export const withdrawOffer = mutation({
  args: {
    offerId: v.id("tradeOffers"),
    offererStakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const offer = await ctx.db.get(args.offerId);
    if (!offer) {
      throw new Error("Offer not found");
    }
    if (offer.offererStakeAddress !== args.offererStakeAddress) {
      throw new Error("You don't own this offer");
    }
    if (offer.status !== "pending") {
      throw new Error("Offer is not pending");
    }

    await ctx.db.patch(args.offerId, {
      status: "withdrawn",
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Update listing's desired variations
export const updateListingVariations = mutation({
  args: {
    listingId: v.id("tradeListings"),
    ownerStakeAddress: v.string(),
    desiredVariations: v.array(
      v.object({
        variationName: v.string(),
        variationType: v.union(v.literal("head"), v.literal("body"), v.literal("trait")),
        variationId: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }
    if (listing.ownerStakeAddress !== args.ownerStakeAddress) {
      throw new Error("You don't own this listing");
    }
    if (listing.status !== "active") {
      throw new Error("Listing is not active");
    }

    // Validate 1-6 variations
    if (args.desiredVariations.length < 1 || args.desiredVariations.length > 6) {
      throw new Error("Must specify 1-6 desired variations");
    }

    await ctx.db.patch(args.listingId, {
      desiredVariations: args.desiredVariations,
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Mark offers as viewed (called when owner opens Trade Offers lightbox)
export const markOffersAsViewed = mutation({
  args: {
    listingId: v.id("tradeListings"),
    ownerStakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }
    if (listing.ownerStakeAddress !== args.ownerStakeAddress) {
      throw new Error("You don't own this listing");
    }

    await ctx.db.patch(args.listingId, {
      lastViewedOffersAt: Date.now(),
    });

    return true;
  },
});

// Start a trade conversation - creates conversation and auto-sends message with both Mek images
export const startTradeConversation = mutation({
  args: {
    listerStakeAddress: v.string(), // The listing owner (sender of the message)
    offererStakeAddress: v.string(), // The person who made the offer (recipient)
    listedMekAssetId: v.string(),
    offeredMekAssetId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get both Meks for image info
    const listedMek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q) => q.eq("assetId", args.listedMekAssetId))
      .first();

    const offeredMek = await ctx.db
      .query("meks")
      .withIndex("by_asset_id", (q) => q.eq("assetId", args.offeredMekAssetId))
      .first();

    // Get both users for corp names
    const lister = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q) =>
        q.eq("stakeAddress", args.listerStakeAddress)
      )
      .first();

    const offerer = await ctx.db
      .query("users")
      .withIndex("by_stake_address", (q) =>
        q.eq("stakeAddress", args.offererStakeAddress)
      )
      .first();

    // Check if conversation already exists
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) =>
        q.eq("participant1", args.listerStakeAddress)
      )
      .filter((q) => q.eq(q.field("participant2"), args.offererStakeAddress))
      .first();

    if (!conversation) {
      conversation = await ctx.db
        .query("conversations")
        .withIndex("by_participant1", (q) =>
          q.eq("participant1", args.offererStakeAddress)
        )
        .filter((q) => q.eq(q.field("participant2"), args.listerStakeAddress))
        .first();
    }

    const now = Date.now();

    // Create conversation if it doesn't exist
    let conversationId: Id<"conversations">;
    if (!conversation) {
      conversationId = await ctx.db.insert("conversations", {
        participant1: args.listerStakeAddress,
        participant2: args.offererStakeAddress,
        lastMessageAt: now,
        lastMessagePreview: "[Trade Discussion]",
        lastMessageSender: args.listerStakeAddress,
        createdAt: now,
      });
    } else {
      conversationId = conversation._id;
    }

    // Build verified Mek attachments for both parties
    // Message 1: FROM the lister showing their listed Mek
    const listedMekAttachment = listedMek ? {
      assetId: listedMek.assetId,
      assetName: listedMek.assetName,
      sourceKey: listedMek.sourceKey || "",
      sourceKeyBase: listedMek.sourceKeyBase,
      headVariation: listedMek.headVariation,
      bodyVariation: listedMek.bodyVariation,
      itemVariation: listedMek.itemVariation,
      customName: listedMek.customName,
      rarityRank: listedMek.rarityRank,
      gameRank: listedMek.gameRank,
      verifiedOwner: args.listerStakeAddress,
      verifiedAt: now,
    } : undefined;

    // Message 2: FROM the offerer showing their offered Mek
    const offeredMekAttachment = offeredMek ? {
      assetId: offeredMek.assetId,
      assetName: offeredMek.assetName,
      sourceKey: offeredMek.sourceKey || "",
      sourceKeyBase: offeredMek.sourceKeyBase,
      headVariation: offeredMek.headVariation,
      bodyVariation: offeredMek.bodyVariation,
      itemVariation: offeredMek.itemVariation,
      customName: offeredMek.customName,
      rarityRank: offeredMek.rarityRank,
      gameRank: offeredMek.gameRank,
      verifiedOwner: args.offererStakeAddress,
      verifiedAt: now + 1, // +1ms to ensure ordering
    } : undefined;

    // Insert Message 1: FROM lister with their listed Mek
    await ctx.db.insert("messages", {
      conversationId,
      senderId: args.listerStakeAddress,
      recipientId: args.offererStakeAddress,
      content: "",
      status: "sent",
      createdAt: now,
      isDeleted: false,
      mekAttachment: listedMekAttachment,
    });

    // Insert Message 2: FROM offerer with their offered Mek
    await ctx.db.insert("messages", {
      conversationId,
      senderId: args.offererStakeAddress,
      recipientId: args.listerStakeAddress,
      content: "",
      status: "sent",
      createdAt: now + 1,
      isDeleted: false,
      mekAttachment: offeredMekAttachment,
    });

    // Insert Message 3: System message (centered) with trading reminder
    await ctx.db.insert("messages", {
      conversationId,
      senderId: "system",
      recipientId: "system",
      content: "We encourage using third-party trading systems if a deal were to occur. Happy trading!",
      status: "sent",
      createdAt: now + 2,
      isDeleted: false,
      isSystemMessage: true,
    });

    // Update conversation last message
    await ctx.db.patch(conversationId, {
      lastMessageAt: now + 2,
      lastMessagePreview: "[Trade Discussion]",
      lastMessageSender: args.listerStakeAddress,
    });

    // Create/update unread count for offerer (receives message 1 from lister)
    const offererUnread = await ctx.db
      .query("messageUnreadCounts")
      .withIndex("by_wallet_conversation", (q) =>
        q.eq("walletAddress", args.offererStakeAddress).eq("conversationId", conversationId)
      )
      .first();

    if (offererUnread) {
      await ctx.db.patch(offererUnread._id, {
        count: offererUnread.count + 1,
      });
    } else {
      await ctx.db.insert("messageUnreadCounts", {
        walletAddress: args.offererStakeAddress,
        conversationId,
        count: 1,
      });
    }

    // Create/update unread count for lister (receives message 2 from offerer)
    const listerUnread = await ctx.db
      .query("messageUnreadCounts")
      .withIndex("by_wallet_conversation", (q) =>
        q.eq("walletAddress", args.listerStakeAddress).eq("conversationId", conversationId)
      )
      .first();

    if (listerUnread) {
      await ctx.db.patch(listerUnread._id, {
        count: listerUnread.count + 1,
      });
    } else {
      await ctx.db.insert("messageUnreadCounts", {
        walletAddress: args.listerStakeAddress,
        conversationId,
        count: 1,
      });
    }

    return conversationId;
  },
});

// Record a view on a listing (only when thumbnail is clicked to open lightbox)
// Deduplicates by stake address - each user can only count as 1 view per listing
export const recordListingView = mutation({
  args: {
    listingId: v.id("tradeListings"),
    viewerStakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) return { recorded: false, reason: "listing_not_found" };

    // Don't count views from the listing owner
    if (listing.ownerStakeAddress === args.viewerStakeAddress) {
      return { recorded: false, reason: "own_listing" };
    }

    // Check if this viewer already viewed this listing (dedupe)
    const currentViewers = listing.viewerAddresses || [];
    if (currentViewers.includes(args.viewerStakeAddress)) {
      return { recorded: false, reason: "already_viewed" };
    }

    // Record the new view
    const newViewCount = (listing.viewCount || 0) + 1;
    const newViewerAddresses = [...currentViewers, args.viewerStakeAddress];

    await ctx.db.patch(args.listingId, {
      viewCount: newViewCount,
      viewerAddresses: newViewerAddresses,
    });

    return { recorded: true, newViewCount };
  },
});

// DEBUG: Find all Meks with a specific body variation and check their ownership
export const debugFindMeksByBodyVariation = query({
  args: {
    bodyVariation: v.string(),
    compareStakeAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const meks = await ctx.db
      .query("meks")
      .withIndex("by_body", (q) => q.eq("bodyVariation", args.bodyVariation))
      .collect();

    console.log(`[DEBUG-SEAFOAM] Found ${meks.length} meks with body=${args.bodyVariation}`);
    if (args.compareStakeAddress) {
      console.log(`[DEBUG-SEAFOAM] Comparing against stake address: ${args.compareStakeAddress}`);
    }

    return meks.map((mek) => {
      const matches = args.compareStakeAddress
        ? mek.ownerStakeAddress === args.compareStakeAddress
        : null;
      return {
        assetName: mek.assetName,
        mekNumber: mek.mekNumber,
        ownerStakeAddress: mek.ownerStakeAddress || "NOT SET",
        owner: mek.owner || "NOT SET",
        headVariation: mek.headVariation,
        bodyVariation: mek.bodyVariation,
        itemVariation: mek.itemVariation,
        sourceKey: mek.sourceKey,
        MATCHES_YOUR_STAKE: matches,
      };
    });
  },
});

// DEBUG: Check what stake address a corporation is using
export const debugGetCorpStakeAddress = query({
  args: {
    corpName: v.string(),
  },
  handler: async (ctx, args) => {
    // Try partial match
    const users = await ctx.db
      .query("users")
      .collect();

    const matching = users.filter((u) =>
      u.corporationName?.toLowerCase().includes(args.corpName.toLowerCase())
    );

    console.log(`[DEBUG-CORP] Found ${matching.length} users matching "${args.corpName}"`);

    return matching.map((u) => ({
      corporationName: u.corporationName,
      stakeAddress: u.stakeAddress,
      stakeAddressShort: u.stakeAddress ? `${u.stakeAddress.substring(0, 20)}...${u.stakeAddress.substring(u.stakeAddress.length - 10)}` : "NOT SET",
    }));
  },
});

// DEBUG: Get all meks owned by a stake address (uses sourceKey lookup)
export const debugGetMeksByStakeAddress = query({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const meks = await ctx.db
      .query("meks")
      .withIndex("by_owner_stake", (q) => q.eq("ownerStakeAddress", args.stakeAddress))
      .collect();

    console.log(`[DEBUG-MEKS] Found ${meks.length} meks for stake ${args.stakeAddress.substring(0, 25)}...`);

    // Check if any have Seafoam - using sourceKey lookup!
    const seafoamMeks = meks.filter((m) => {
      const fromSourceKey = getVariationsFromSourceKey(m.sourceKey);
      const head = (fromSourceKey.head || m.headVariation)?.toLowerCase();
      const body = (fromSourceKey.body || m.bodyVariation)?.toLowerCase();
      const trait = (fromSourceKey.trait || m.itemVariation)?.toLowerCase();
      return head === "seafoam" || body === "seafoam" || trait === "seafoam";
    });
    console.log(`[DEBUG-MEKS] Of these, ${seafoamMeks.length} have Seafoam variation (using sourceKey lookup)`);

    return {
      totalCount: meks.length,
      seafoamCount: seafoamMeks.length,
      allVariations: meks.map((m) => {
        const fromSourceKey = getVariationsFromSourceKey(m.sourceKey);
        return {
          assetName: m.assetName,
          sourceKey: m.sourceKey,
          head: fromSourceKey.head || m.headVariation,
          body: fromSourceKey.body || m.bodyVariation,
          trait: fromSourceKey.trait || m.itemVariation,
        };
      }),
    };
  },
});

// DEBUG: Investigate meks table data consistency
export const debugMeksDataConsistency = query({
  args: {
    sampleSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.sampleSize || 100;
    const meks = await ctx.db.query("meks").take(limit);

    let matches = 0;
    let mismatches = 0;
    let noSourceKey = 0;
    let sourceKeyNotFound = 0;
    const mismatchDetails: any[] = [];
    const ownerCounts: Record<string, number> = {};

    for (const mek of meks) {
      if (!mek.sourceKey) {
        noSourceKey++;
        continue;
      }

      const fromSourceKey = getVariationsFromSourceKey(mek.sourceKey);
      if (!fromSourceKey.head && !fromSourceKey.body && !fromSourceKey.trait) {
        sourceKeyNotFound++;
        continue;
      }

      const headMatch = fromSourceKey.head?.toLowerCase() === mek.headVariation?.toLowerCase();
      const bodyMatch = fromSourceKey.body?.toLowerCase() === mek.bodyVariation?.toLowerCase();
      const traitMatch = fromSourceKey.trait?.toLowerCase() === mek.itemVariation?.toLowerCase();

      if (headMatch && bodyMatch && traitMatch) {
        matches++;
      } else {
        mismatches++;
        // Track which owners have mismatched meks
        const owner = mek.ownerStakeAddress || "unowned";
        ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;

        if (mismatchDetails.length < 20) {
          mismatchDetails.push({
            assetName: mek.assetName,
            mekNumber: mek.mekNumber,
            sourceKey: mek.sourceKey,
            ownerStakeAddress: mek.ownerStakeAddress,
            database: {
              head: mek.headVariation,
              body: mek.bodyVariation,
              trait: mek.itemVariation,
            },
            shouldBe: {
              head: fromSourceKey.head,
              body: fromSourceKey.body,
              trait: fromSourceKey.trait,
            },
            headMatch,
            bodyMatch,
            traitMatch,
          });
        }
      }
    }

    // Analyze naming pattern correlation
    const namingAnalysis = {
      mismatchesWithMekPrefix: 0,
      mismatchesWithMekanismPrefix: 0,
      correctWithMekPrefix: 0,
      correctWithMekanismPrefix: 0,
    };

    for (const mek of meks) {
      if (!mek.sourceKey) continue;
      const fromSourceKey = getVariationsFromSourceKey(mek.sourceKey);
      if (!fromSourceKey.head) continue;

      const isMatch = fromSourceKey.head?.toLowerCase() === mek.headVariation?.toLowerCase() &&
                      fromSourceKey.body?.toLowerCase() === mek.bodyVariation?.toLowerCase() &&
                      fromSourceKey.trait?.toLowerCase() === mek.itemVariation?.toLowerCase();

      const hasMekPrefix = mek.assetName?.startsWith("Mek #");
      const hasMekanismPrefix = mek.assetName?.startsWith("Mekanism #");

      if (isMatch) {
        if (hasMekPrefix) namingAnalysis.correctWithMekPrefix++;
        if (hasMekanismPrefix) namingAnalysis.correctWithMekanismPrefix++;
      } else {
        if (hasMekPrefix) namingAnalysis.mismatchesWithMekPrefix++;
        if (hasMekanismPrefix) namingAnalysis.mismatchesWithMekanismPrefix++;
      }
    }

    return {
      analyzed: meks.length,
      matches,
      mismatches,
      noSourceKey,
      sourceKeyNotFound,
      mismatchPercentage: ((mismatches / (matches + mismatches)) * 100).toFixed(1) + "%",
      mismatchesByOwner: ownerCounts,
      namingAnalysis,
      sampleMismatches: mismatchDetails.slice(0, 5),
    };
  },
});

// DEBUG: Find mek by exact variations
export const debugFindMekByVariations = query({
  args: {
    head: v.optional(v.string()),
    body: v.optional(v.string()),
    trait: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all meks and filter
    const allMeks = await ctx.db.query("meks").collect();

    const matches = allMeks.filter((m) => {
      if (args.head && m.headVariation?.toLowerCase() !== args.head.toLowerCase()) return false;
      if (args.body && m.bodyVariation?.toLowerCase() !== args.body.toLowerCase()) return false;
      if (args.trait && m.itemVariation?.toLowerCase() !== args.trait.toLowerCase()) return false;
      return true;
    });

    console.log(`[DEBUG-FIND] Found ${matches.length} meks matching head=${args.head}, body=${args.body}, trait=${args.trait}`);

    return matches.map((m) => ({
      assetName: m.assetName,
      mekNumber: m.mekNumber,
      head: m.headVariation,
      body: m.bodyVariation,
      trait: m.itemVariation,
      ownerStakeAddress: m.ownerStakeAddress || "NOT SET",
      sourceKey: m.sourceKey,
    }));
  },
});
