/**
 * Test script for gold invariant fix
 * Run this after starting the dev server to test the fix
 */

// Import the calculation functions to test them
const { calculateGoldIncrease, validateGoldInvariant } = require('./convex/lib/goldCalculations.ts');

// Test cases
const testCases = [
  {
    name: "Uninitialized cumulative (most common case)",
    record: {
      accumulatedGold: 10000,
      totalCumulativeGold: 0, // UNINITIALIZED
      totalGoldSpentOnUpgrades: 0,
      createdAt: Date.now(),
      totalGoldPerHour: 100
    },
    goldToAdd: 5000,
    expectedAccumulated: 15000,
    expectedCumulative: 15000
  },
  {
    name: "Initialized cumulative, no spending",
    record: {
      accumulatedGold: 10000,
      totalCumulativeGold: 10000,
      totalGoldSpentOnUpgrades: 0,
      createdAt: Date.now(),
      totalGoldPerHour: 100
    },
    goldToAdd: 5000,
    expectedAccumulated: 15000,
    expectedCumulative: 15000
  },
  {
    name: "With previous spending",
    record: {
      accumulatedGold: 10000,
      totalCumulativeGold: 15000, // Had 15k total, spent 5k, left with 10k
      totalGoldSpentOnUpgrades: 5000,
      createdAt: Date.now(),
      totalGoldPerHour: 100
    },
    goldToAdd: 3000,
    expectedAccumulated: 13000,
    expectedCumulative: 18000 // 15000 + 3000
  },
  {
    name: "Near gold cap (48k + 5k = 53k, capped at 50k)",
    record: {
      accumulatedGold: 48000,
      totalCumulativeGold: 48000,
      totalGoldSpentOnUpgrades: 0,
      createdAt: Date.now(),
      totalGoldPerHour: 100
    },
    goldToAdd: 5000,
    expectedAccumulated: 50000, // CAPPED
    expectedCumulative: 53000 // NOT CAPPED - tracks all-time gold
  },
  {
    name: "Uninitialized with spending (edge case)",
    record: {
      accumulatedGold: 8000,
      totalCumulativeGold: 0, // UNINITIALIZED
      totalGoldSpentOnUpgrades: 2000, // User spent gold before cumulative was tracked
      createdAt: Date.now(),
      totalGoldPerHour: 100
    },
    goldToAdd: 1000,
    expectedAccumulated: 9000,
    expectedCumulative: 11000 // (8000 + 2000) + 1000
  }
];

console.log("=".repeat(80));
console.log("GOLD INVARIANT FIX - TEST SUITE");
console.log("=".repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: ${test.name}`);
  console.log("-".repeat(80));
  console.log("Input:", JSON.stringify(test.record, null, 2));
  console.log(`Adding: ${test.goldToAdd} gold`);

  try {
    const result = calculateGoldIncrease(test.record, test.goldToAdd);

    console.log("Result:", JSON.stringify(result, null, 2));
    console.log(`Expected: accumulated=${test.expectedAccumulated}, cumulative=${test.expectedCumulative}`);

    // Validate the result
    const isAccumulatedCorrect = result.newAccumulatedGold === test.expectedAccumulated;
    const isCumulativeCorrect = result.newTotalCumulativeGold === test.expectedCumulative;

    // Check invariant
    const finalRecord = {
      ...test.record,
      accumulatedGold: result.newAccumulatedGold,
      totalCumulativeGold: result.newTotalCumulativeGold
    };

    let invariantValid = false;
    try {
      validateGoldInvariant(finalRecord);
      invariantValid = true;
    } catch (error) {
      console.error("❌ INVARIANT VIOLATION:", error.message);
    }

    if (isAccumulatedCorrect && isCumulativeCorrect && invariantValid) {
      console.log("✅ PASS");
      passed++;
    } else {
      console.log("❌ FAIL");
      if (!isAccumulatedCorrect) console.log(`  - Accumulated: expected ${test.expectedAccumulated}, got ${result.newAccumulatedGold}`);
      if (!isCumulativeCorrect) console.log(`  - Cumulative: expected ${test.expectedCumulative}, got ${result.newTotalCumulativeGold}`);
      if (!invariantValid) console.log(`  - Invariant check failed`);
      failed++;
    }
  } catch (error) {
    console.log("❌ ERROR:", error.message);
    failed++;
  }
});

console.log("\n" + "=".repeat(80));
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log("=".repeat(80));

if (failed === 0) {
  console.log("✅ All tests passed! The fix is working correctly.");
} else {
  console.log("❌ Some tests failed. Please review the implementation.");
  process.exit(1);
}
