import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";

config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function updatePhase1() {
  const cards = await client.query(api.phaseCards.getAllPhaseCards);
  const phaseI = cards.find(card => card.order === 1 && card.title === "Foundation");

  if (!phaseI) {
    console.error("Phase I not found!");
    return;
  }

  const updatedDescription = `This phase introduced several of the essential systems of Mek Tycoon:

- Connecting a Cardano wallet
- Generating passive gold
- Upgrading Meks

We had roughly 40 beta testers who put these systems through their paces, pointing out any and all issues along the way.

The modest feature set in this phase is by design; it's imperative that these core mechanics are absolutely rock solid moving forward, since so much is built upon them. Think of this phase as "the foundation" for the intricate world that is Mek Tycoon.

If you are one of the 40 Phase I beta testers, here is a commemorative NFT which officially stamps your "absolute ground floor" involvement.`;

  await client.mutation(api.phaseCards.updatePhaseCard, {
    id: phaseI._id,
    description: updatedDescription
  });

  console.log("✓ Phase I description updated");
}

updatePhase1().catch(console.error);
