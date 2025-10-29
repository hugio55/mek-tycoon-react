// Verify migration completed correctly
import { query } from "./_generated/server";

export const verifyVariationMigration = query({
  args: {},
  handler: async (ctx) => {
    const variations = await ctx.db.query("variationsReference").collect();

    // Check critical variations
    const checks = [
      { name: "Ace of Spades Ultimate", expectedId: 1, expectedType: "head" },
      { name: "Burnt Ultimate", expectedId: 2, expectedType: "body" },
      { name: "Golden Guns Ultimate", expectedId: 13, expectedType: "item" },
      { name: "Iced", expectedId: 94, expectedType: "item" },
      { name: "Lightning", expectedId: 260, expectedType: "head" },
      { name: "Nothing", expectedId: 288, expectedType: "item" },
    ];

    const results = checks.map(check => {
      const variation = variations.find(v => v.name === check.name);
      return {
        name: check.name,
        expectedId: check.expectedId,
        actualId: variation?.variationId,
        expectedType: check.expectedType,
        actualType: variation?.type,
        idMatch: variation?.variationId === check.expectedId,
        typeMatch: variation?.type === check.expectedType,
        pass: variation?.variationId === check.expectedId && variation?.type === check.expectedType
      };
    });

    const allPass = results.every(r => r.pass);

    return {
      totalVariations: variations.length,
      expectedTotal: 288,
      countMatch: variations.length === 288,
      sampleChecks: results,
      allChecksPass: allPass,
      status: allPass && variations.length === 288 ? "✅ MIGRATION SUCCESSFUL" : "❌ MIGRATION HAS ISSUES"
    };
  }
});
