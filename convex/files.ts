import { action, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generate an upload URL for file storage
 * This allows clients to upload files directly to Convex storage
 */
export const generateUploadUrl = action(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

/**
 * Get a public URL for a stored file
 * This returns a URL that can be used directly in <img> tags
 */
export const getFileUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
