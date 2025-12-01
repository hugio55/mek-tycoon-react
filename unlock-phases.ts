import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";

config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function unlockPhases() {
  const cards = await client.query(api.phaseCards.getAllPhaseCards);

  const phaseIII = cards.find(card => card.title === "Phase III");
  const phaseIV = cards.find(card => card.title === "Phase IV");

  if (phaseIII) {
    await client.mutation(api.phaseCards.updatePhaseCard, {
      id: phaseIII._id,
      locked: false
    });
    console.log("✓ Phase III unlocked");
  }

  if (phaseIV) {
    await client.mutation(api.phaseCards.updatePhaseCard, {
      id: phaseIV._id,
      locked: false
    });
    console.log("✓ Phase IV unlocked");
  }

  console.log("\nDone! Phase III and Phase IV are now clickable.");
}

unlockPhases().catch(console.error);
