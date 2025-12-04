/**
 * Sync Phase Cards from Trout (dev) to Sturgeon (production)
 * Run with: node scripts/sync-phases.js
 */

const { ConvexHttpClient } = require('convex/browser');

// Import API - need to use relative path since we're in scripts folder
const api = require('../convex/_generated/api').api;

const TROUT_URL = 'https://wry-trout-962.convex.cloud';
const STURGEON_URL = 'https://fabulous-sturgeon-691.convex.cloud';

async function syncPhaseCards() {
  // Connect to both databases
  const trout = new ConvexHttpClient(TROUT_URL);
  const sturgeon = new ConvexHttpClient(STURGEON_URL);

  console.log('=== Phase Card Sync: Trout -> Sturgeon ===\n');

  // Get all phase cards from Trout (dev)
  console.log('Fetching phase cards from Trout (dev)...');
  const troutPhases = await trout.query(api.phaseCards.getAllPhaseCards);
  console.log(`Found ${troutPhases.length} phases in Trout\n`);

  // Get all phase cards from Sturgeon (prod)
  console.log('Fetching phase cards from Sturgeon (production)...');
  const sturgeonPhases = await sturgeon.query(api.phaseCards.getAllPhaseCards);
  console.log(`Found ${sturgeonPhases.length} phases in Sturgeon\n`);

  // Print comparison
  console.log('=== COMPARISON ===\n');

  console.log('TROUT (dev - source):');
  troutPhases.forEach((p) => {
    const desc = p.description ? p.description.substring(0, 60) : '(none)';
    console.log(`  Order ${p.order}: "${p.title}" | locked: ${p.locked} | desc: ${desc}...`);
  });

  console.log('\nSTURGEON (prod - target):');
  sturgeonPhases.forEach((p) => {
    const desc = p.description ? p.description.substring(0, 60) : '(none)';
    console.log(`  Order ${p.order}: "${p.title}" | locked: ${p.locked} | desc: ${desc}...`);
  });

  // Match by order and sync
  console.log('\n=== SYNCING ===\n');

  for (const troutPhase of troutPhases) {
    const matchingSturgeonPhase = sturgeonPhases.find(s => s.order === troutPhase.order);

    if (!matchingSturgeonPhase) {
      console.log(`Creating new phase with order ${troutPhase.order} on Sturgeon...`);
      await sturgeon.mutation(api.phaseCards.createPhaseCard, {
        header: troutPhase.header,
        subtitle: troutPhase.subtitle,
        title: troutPhase.title,
        description: troutPhase.description,
        fullDescription: troutPhase.fullDescription,
        imageUrl: troutPhase.imageUrl,
        locked: troutPhase.locked,
        order: troutPhase.order,
      });
      console.log(`  Created!`);
    } else {
      // Check if anything is different
      const isDifferent =
        matchingSturgeonPhase.title !== troutPhase.title ||
        matchingSturgeonPhase.description !== troutPhase.description ||
        matchingSturgeonPhase.fullDescription !== troutPhase.fullDescription ||
        matchingSturgeonPhase.locked !== troutPhase.locked ||
        matchingSturgeonPhase.header !== troutPhase.header ||
        matchingSturgeonPhase.subtitle !== troutPhase.subtitle ||
        matchingSturgeonPhase.imageUrl !== troutPhase.imageUrl;

      if (isDifferent) {
        console.log(`Updating phase order ${troutPhase.order} on Sturgeon...`);
        await sturgeon.mutation(api.phaseCards.updatePhaseCard, {
          id: matchingSturgeonPhase._id,
          header: troutPhase.header,
          subtitle: troutPhase.subtitle,
          title: troutPhase.title,
          description: troutPhase.description,
          fullDescription: troutPhase.fullDescription,
          imageUrl: troutPhase.imageUrl,
          locked: troutPhase.locked,
        });
        console.log(`  Updated!`);
      } else {
        console.log(`Phase order ${troutPhase.order} already in sync`);
      }
    }
  }

  console.log('\n=== SYNC COMPLETE ===');
}

syncPhaseCards().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
