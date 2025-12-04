import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// CONSTANTS - Upload Limits
// ============================================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_FILES_PER_MESSAGE = 3;
const MAX_UPLOADS_PER_DAY = 50;
const MAX_BYTES_PER_DAY = 100 * 1024 * 1024; // 100MB per day
const MIN_UPLOAD_INTERVAL_MS = 2000; // 2 seconds between uploads (burst limit)

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

function sanitizeFilename(filename: string): string {
  // Remove path components and dangerous characters
  return filename
    .split(/[\\/]/).pop() || "file" // Get just the filename
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars
    .slice(0, 100); // Limit length
}

// ============================================================================
// QUERIES
// ============================================================================

// Get upload quota status for a user
export const getUploadQuota = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const today = getTodayDateString();

    const quota = await ctx.db
      .query("messageUploadQuotas")
      .withIndex("by_wallet_date", (q) =>
        q.eq("walletAddress", args.walletAddress).eq("date", today)
      )
      .first();

    return {
      uploadsToday: quota?.uploadCount ?? 0,
      bytesToday: quota?.totalBytes ?? 0,
      maxUploadsPerDay: MAX_UPLOADS_PER_DAY,
      maxBytesPerDay: MAX_BYTES_PER_DAY,
      maxFileSize: MAX_FILE_SIZE,
      maxFilesPerMessage: MAX_FILES_PER_MESSAGE,
      remainingUploads: MAX_UPLOADS_PER_DAY - (quota?.uploadCount ?? 0),
      remainingBytes: MAX_BYTES_PER_DAY - (quota?.totalBytes ?? 0),
      canUpload: (quota?.uploadCount ?? 0) < MAX_UPLOADS_PER_DAY &&
                 (quota?.totalBytes ?? 0) < MAX_BYTES_PER_DAY,
    };
  },
});

// Generate upload URL for client-side upload
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// Validate and record a file upload (called after upload completes)
export const validateUpload = mutation({
  args: {
    walletAddress: v.string(),
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const today = getTodayDateString();

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(args.mimeType)) {
      // Delete the uploaded file
      await ctx.storage.delete(args.storageId);
      throw new Error(
        `Invalid file type: ${args.mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
      );
    }

    // Validate file size
    if (args.size > MAX_FILE_SIZE) {
      await ctx.storage.delete(args.storageId);
      throw new Error(
        `File too large: ${(args.size / 1024 / 1024).toFixed(2)}MB. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Check daily quota
    const quota = await ctx.db
      .query("messageUploadQuotas")
      .withIndex("by_wallet_date", (q) =>
        q.eq("walletAddress", args.walletAddress).eq("date", today)
      )
      .first();

    if (quota) {
      // Check daily upload count
      if (quota.uploadCount >= MAX_UPLOADS_PER_DAY) {
        await ctx.storage.delete(args.storageId);
        throw new Error(
          `Daily upload limit reached (${MAX_UPLOADS_PER_DAY} files). Try again tomorrow.`
        );
      }

      // Check daily byte limit
      if (quota.totalBytes + args.size > MAX_BYTES_PER_DAY) {
        await ctx.storage.delete(args.storageId);
        throw new Error(
          `Daily upload size limit reached. Try again tomorrow.`
        );
      }

      // Check burst rate limit
      if (now - quota.lastUploadAt < MIN_UPLOAD_INTERVAL_MS) {
        await ctx.storage.delete(args.storageId);
        const waitTimeSeconds = Math.ceil((MIN_UPLOAD_INTERVAL_MS - (now - quota.lastUploadAt)) / 1000);
        throw new Error(
          `Please wait ${waitTimeSeconds} second${waitTimeSeconds > 1 ? 's' : ''} before uploading again.`
        );
      }

      // Update quota
      await ctx.db.patch(quota._id, {
        uploadCount: quota.uploadCount + 1,
        totalBytes: quota.totalBytes + args.size,
        lastUploadAt: now,
      });
    } else {
      // Create new quota record
      await ctx.db.insert("messageUploadQuotas", {
        walletAddress: args.walletAddress,
        date: today,
        uploadCount: 1,
        totalBytes: args.size,
        lastUploadAt: now,
      });
    }

    // Get the URL for the uploaded file
    const url = await ctx.storage.getUrl(args.storageId);

    return {
      success: true,
      storageId: args.storageId,
      filename: sanitizeFilename(args.filename),
      mimeType: args.mimeType,
      size: args.size,
      url,
    };
  },
});

// Delete an uploaded file (before sending message)
export const deleteUpload = mutation({
  args: {
    storageId: v.id("_storage"),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Delete from storage
    await ctx.storage.delete(args.storageId);

    // Note: We don't decrement the quota - uploads still count even if deleted
    // This prevents gaming the system by uploading and deleting repeatedly

    return { success: true };
  },
});

// Get URL for a storage ID (for displaying attachments)
export const getAttachmentUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Get URLs for multiple storage IDs
export const getAttachmentUrls = query({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, args) => {
    const urls = await Promise.all(
      args.storageIds.map(async (id) => ({
        storageId: id,
        url: await ctx.storage.getUrl(id),
      }))
    );
    return urls;
  },
});
