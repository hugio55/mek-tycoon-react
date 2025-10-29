import { query } from "./_generated/server";

/**
 * Diagnostic query to examine sprite positioning data
 * Checks for differences between head/body/trait sprites
 */
export const diagnosticSpritePositions = query({
  args: {},
  handler: async (ctx) => {
    const overlayData = await ctx.db
      .query("overlays")
      .filter((q) => q.eq(q.field("imageKey"), "triangle-overlay"))
      .first();

    if (!overlayData) {
      return { error: "No triangle overlay found" };
    }

    const sprites = overlayData.zones.filter((z: any) => z.mode === "sprite");

    // Group sprites by type
    const headSprites = sprites.filter((s: any) => s.metadata?.variationType === "head");
    const bodySprites = sprites.filter((s: any) => s.metadata?.variationType === "body");
    const traitSprites = sprites.filter((s: any) => s.metadata?.variationType === "trait");

    // Calculate average positions and scales
    const calcStats = (spritesList: any[]) => {
      if (spritesList.length === 0) return null;

      const avgX = spritesList.reduce((sum, s) => sum + s.x, 0) / spritesList.length;
      const avgY = spritesList.reduce((sum, s) => sum + s.y, 0) / spritesList.length;
      const avgScale = spritesList.reduce((sum, s) => sum + (s.metadata?.spriteScale || 1), 0) / spritesList.length;

      const minX = Math.min(...spritesList.map(s => s.x));
      const maxX = Math.max(...spritesList.map(s => s.x));
      const minY = Math.min(...spritesList.map(s => s.y));
      const maxY = Math.max(...spritesList.map(s => s.y));

      return {
        count: spritesList.length,
        avgX: Math.round(avgX),
        avgY: Math.round(avgY),
        avgScale: avgScale.toFixed(3),
        xRange: `${Math.round(minX)}-${Math.round(maxX)}`,
        yRange: `${Math.round(minY)}-${Math.round(maxY)}`,
      };
    };

    // Sample a few sprites from each type for detailed inspection
    const sampleSprites = (spritesList: any[], count: number = 3) => {
      return spritesList.slice(0, count).map(s => ({
        name: s.metadata?.variationName || s.label,
        x: Math.round(s.x),
        y: Math.round(s.y),
        scale: s.metadata?.spriteScale || 1,
        imageWidth: s.metadata?.imageWidth,
        imageHeight: s.metadata?.imageHeight,
      }));
    };

    return {
      overlayDimensions: {
        width: overlayData.imageWidth,
        height: overlayData.imageHeight,
      },
      heads: {
        stats: calcStats(headSprites),
        samples: sampleSprites(headSprites),
      },
      bodies: {
        stats: calcStats(bodySprites),
        samples: sampleSprites(bodySprites),
      },
      traits: {
        stats: calcStats(traitSprites),
        samples: sampleSprites(traitSprites),
      },
      totalSprites: sprites.length,
    };
  },
});
