// Admin functions for data migration
// CAUTION: These are powerful functions that can read/write all data

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all tables in the database
export const listTables = query({
  args: {},
  handler: async (ctx) => {
    // Get all table names by iterating through the schema
    const tables: string[] = [];

    // Use the internal API to get table names
    const allTables = await ctx.db.system.query("_tables" as any).collect();
    return allTables.map((t: any) => t.name);
  },
});

// Get all documents from a specific table
export const getAllDocuments = query({
  args: { tableName: v.string() },
  handler: async (ctx, { tableName }) => {
    try {
      // @ts-ignore - Dynamic table access
      const documents = await ctx.db.query(tableName).collect();
      return documents;
    } catch (error) {
      console.error(`Error reading table ${tableName}:`, error);
      throw new Error(`Failed to read table ${tableName}: ${error}`);
    }
  },
});

// Import documents into a table
export const importDocuments = mutation({
  args: {
    tableName: v.string(),
    documents: v.array(v.any()),
    replace: v.boolean(),
  },
  handler: async (ctx, { tableName, documents, replace }) => {
    try {
      if (replace) {
        // Delete all existing documents
        // @ts-ignore - Dynamic table access
        const existing = await ctx.db.query(tableName).collect();
        for (const doc of existing) {
          await ctx.db.delete(doc._id);
        }
        console.log(`Deleted ${existing.length} existing documents from ${tableName}`);
      }

      // Insert new documents
      let insertedCount = 0;
      for (const doc of documents) {
        // Remove _id and _creationTime as they'll be regenerated
        const { _id, _creationTime, ...docData } = doc;

        // @ts-ignore - Dynamic table access
        await ctx.db.insert(tableName, docData);
        insertedCount++;
      }

      console.log(`Inserted ${insertedCount} documents into ${tableName}`);
      return { success: true, inserted: insertedCount };
    } catch (error) {
      console.error(`Error importing to table ${tableName}:`, error);
      throw new Error(`Failed to import to table ${tableName}: ${error}`);
    }
  },
});
