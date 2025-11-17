import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";

config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function listPhases() {
  const cards = await client.query(api.phaseCards.getAllPhaseCards);

  console.log(`Found ${cards.length} phase cards:\n`);

  cards.forEach((card) => {
    console.log(`Title: "${card.title}"`);
    console.log(`  Order: ${card.order}`);
    console.log(`  Locked: ${card.locked}`);
    console.log(`  Header: ${card.header || 'none'}`);
    console.log();
  });
}

listPhases().catch(console.error);
