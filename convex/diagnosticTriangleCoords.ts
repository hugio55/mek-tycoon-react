import { query } from "./_generated/server";
import { v } from "convex/values";

// Diagnostic: Analyze triangle overlay sprite coordinates by type
export const analyzeTriangleCoordinates = query({
  args: {},
  handler: async (ctx) => {
    // First, list all available overlays to help find the right key
    const allOverlays = await ctx.db.query("overlays").collect();

    if (allOverlays.length === 0) {
      return { error: "No overlays found in database" };
    }

    // Try to find triangle overlay by looking for one with many sprites
    const overlay = allOverlays.find((o: any) => {
      const spriteCount = o.zones?.filter((z: any) => z.mode === "sprite").length || 0;
      return spriteCount > 50; // Triangle should have ~100+ sprites
    }) || allOverlays[0]; // Fallback to first overlay

    if (!overlay) {
      return {
        error: "Triangle overlay not found",
        availableKeys: allOverlays.map((o: any) => o.imageKey)
      };
    }

    const sprites = overlay.zones.filter((z: any) => z.mode === "sprite");

    // Separate by type
    const heads = sprites.filter((s: any) => s.metadata?.variationType === "head");
    const bodies = sprites.filter((s: any) => s.metadata?.variationType === "body");
    const traits = sprites.filter((s: any) =>
      s.metadata?.variationType === "trait" || s.metadata?.variationType === "item"
    );

    // Calculate statistics for each type
    const calculateStats = (sprites: any[], label: string) => {
      if (sprites.length === 0) return { label, count: 0 };

      const xCoords = sprites.map((s: any) => s.x);
      const yCoords = sprites.map((s: any) => s.y);
      const scales = sprites.map((s: any) => s.metadata?.spriteScale || 1);

      return {
        label,
        count: sprites.length,
        x: {
          min: Math.min(...xCoords),
          max: Math.max(...xCoords),
          avg: xCoords.reduce((a, b) => a + b, 0) / xCoords.length,
        },
        y: {
          min: Math.min(...yCoords),
          max: Math.max(...yCoords),
          avg: yCoords.reduce((a, b) => a + b, 0) / yCoords.length,
        },
        scale: {
          min: Math.min(...scales),
          max: Math.max(...scales),
          avg: scales.reduce((a, b) => a + b, 0) / scales.length,
        },
        samples: sprites.slice(0, 5).map((s: any) => ({
          name: s.label || s.metadata?.variationName,
          x: s.x,
          y: s.y,
          scale: s.metadata?.spriteScale || 1,
        })),
      };
    };

    return {
      overlayKey: overlay.imageKey,
      imagePath: overlay.imagePath,
      imageWidth: overlay.imageWidth,
      imageHeight: overlay.imageHeight,
      totalSprites: sprites.length,
      heads: calculateStats(heads, "Heads"),
      bodies: calculateStats(bodies, "Bodies"),
      traits: calculateStats(traits, "Traits"),
    };
  },
});
