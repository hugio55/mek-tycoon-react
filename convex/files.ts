import { action } from "./_generated/server";

/**
 * Generate an upload URL for file storage
 * This allows clients to upload files directly to Convex storage
 */
export const generateUploadUrl = action(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});
