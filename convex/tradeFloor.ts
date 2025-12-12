import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper: Compute which desired variations a Mek matches
// Checks all three variation fields regardless of claimed type (more robust against bad data)
function computeMatchedVariations(
  mek: { headVariation?: string; bodyVariation?: string; itemVariation?: string; assetName?: string },
  desiredVariations: { variationName: string; variationType: string }[],
  debug = false
): string[] {
  const matches: string[] = [];
  for (const desired of desiredVariations) {
    const desiredNameLower = desired.variationName.toLowerCase().trim();

    // Check all three variation fields - matches if any field contains the variation name
    const headLower = mek.headVariation?.toLowerCase().trim();
    const bodyLower = mek.bodyVariation?.toLowerCase().trim();
    const itemLower = mek.itemVariation?.toLowerCase().trim();

    const hasHead = headLower === desiredNameLower;
    const hasBody = bodyLower === desiredNameLower;
    const hasTrait = itemLower === desiredNameLower;

    if (debug) {
      console.log("[TRADE-MATCH-DETAIL]", {
        mek: mek.assetName,
        looking_for: desiredNameLower,
        mek_head: headLower,
        mek_body: bodyLower,
        mek_item: itemLower,
        hasHead,
        hasBody,
        hasTrait,
      });
    }

    if (hasHead || hasBody || hasTrait) {
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

    // Debug logging
    console.log("[TRADE-MATCH] viewerStakeAddress:", args.viewerStakeAddress);
    console.log("[TRADE-MATCH] viewerMeks count:", viewerMeks.length);
    console.log("[TRADE-MATCH] desiredVariations:", listing.desiredVariations);

    // Log first 3 Meks for debugging
    viewerMeks.slice(0, 3).forEach((mek, i) => {
      console.log(`[TRADE-MATCH] Mek ${i}:`, {
        assetName: mek.assetName,
        head: mek.headVariation,
        body: mek.bodyVariation,
        item: mek.itemVariation,
      });
    });

    // Filter to those that match at least one desired variation
    const matchingMeks = viewerMeks
      .map((mek, index) => {
        // Debug first 3 Meks in detail
        const matchedVariations = computeMatchedVariations(mek, listing.desiredVariations, index < 3);
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

    // Build the auto-message content
    // Format Mek image paths for display
    const offeredMekKey = offeredMek?.sourceKey?.replace(/-[A-Z]$/i, "").toLowerCase() || "";
    const listedMekKey = listedMek?.sourceKey?.replace(/-[A-Z]$/i, "").toLowerCase() || "";

    const messageContent = `🔄 Trade Discussion

📦 Offered Mek:
${offeredMek?.assetName || "Unknown Mek"} (from ${offerer?.corporationName || "Unknown Corp"})
[Image: /mek-images/150px/${offeredMekKey}.webp]

↔️ for ↔️

📦 Listed Mek:
${listedMek?.assetName || "Unknown Mek"} (from ${lister?.corporationName || "Unknown Corp"})
[Image: /mek-images/150px/${listedMekKey}.webp]

---
⚠️ Safe Trading Reminder: If a trade were to take place, we highly encourage using a safe system such as Trading Tent: https://app.tradingtent.io/connect-wallet`;

    // Insert the message
    await ctx.db.insert("messages", {
      conversationId,
      senderId: args.listerStakeAddress,
      recipientId: args.offererStakeAddress,
      content: messageContent,
      status: "sent",
      createdAt: now,
      isDeleted: false,
    });

    // Update conversation last message
    await ctx.db.patch(conversationId, {
      lastMessageAt: now,
      lastMessagePreview: "[Trade Discussion]",
      lastMessageSender: args.listerStakeAddress,
    });

    // Create/update unread count for recipient
    const existingUnread = await ctx.db
      .query("messageUnreadCounts")
      .withIndex("by_wallet_conversation", (q) =>
        q.eq("walletAddress", args.offererStakeAddress).eq("conversationId", conversationId)
      )
      .first();

    if (existingUnread) {
      await ctx.db.patch(existingUnread._id, {
        count: existingUnread.count + 1,
      });
    } else {
      await ctx.db.insert("messageUnreadCounts", {
        walletAddress: args.offererStakeAddress,
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
