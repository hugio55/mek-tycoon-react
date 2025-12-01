import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";

config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function updatePhase4() {
  const cards = await client.query(api.phaseCards.getAllPhaseCards);

  const phaseIV = cards.find(card => card.order === 3); // Phase IV has order 3

  if (!phaseIV) {
    console.error("Phase IV not found!");
    return;
  }

  console.log("Found Phase IV:", phaseIV.title);
  console.log("Current description:", phaseIV.description || "none");

  const newDescription = `Strength in numbers! With the release of this phase, players (Corporations) can band together to create Federations. Being part of one of these entities comes with a slew of perks, challenges, and gameplay.

Federations can be formed by players who qualify, but can be joined by all. With up to 10 Corporations per Federation, there will be plenty of competition on the global leaderboards.

This phase will also include the community-requested features that have made it through the ranks over the course of P1-3. That said, Mek Tycoon does not stop here at Phase 4 - there are plenty of additions to come after this release. From upgradable gallery businesses to exoplanet mining operations, the universe of this idle game will feel anything but idle.`;

  await client.mutation(api.phaseCards.updatePhaseCard, {
    id: phaseIV._id,
    description: newDescription
  });

  console.log("\n✓ Phase IV description updated!");
}

updatePhase4().catch(console.error);
