import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Store save metadata in the database
export const createSave = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    filesCount: v.number(),
    sizeInBytes: v.number(),
  },
  async handler(ctx, args) {
    const saveId = await ctx.db.insert("saves", {
      name: args.name,
      description: args.description,
      filesCount: args.filesCount,
      sizeInBytes: args.sizeInBytes,
      createdAt: Date.now(),
    });
    
    return saveId;
  },
});

export const listSaves = query({
  args: {},
  async handler(ctx) {
    const saves = await ctx.db
      .query("saves")
      .order("desc")
      .collect();
    
    return saves.map(save => ({
      ...save,
      formattedDate: new Date(save.createdAt).toLocaleString(),
      formattedSize: formatBytes(save.sizeInBytes),
    }));
  },
});

export const deleteSave = mutation({
  args: {
    saveId: v.id("saves"),
  },
  async handler(ctx, args) {
    await ctx.db.delete(args.saveId);
    return { success: true };
  },
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}