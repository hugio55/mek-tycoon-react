import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";

config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function checkPhaseCards() {
  console.log("Querying phase cards from database...\n");

  const cards = await client.query(api.phaseCards.getAllPhaseCards);

  console.log(`Found ${cards.length} phase cards:\n`);

  cards.forEach((card, index) => {
    console.log(`${index + 1}. ${card.header || card.title}`);
    console.log(`   Order: ${card.order}`);
    console.log(`   Locked: ${card.locked}`);
    console.log(`   Description length: ${card.description?.length || 0} chars`);
    console.log();
  });
}

checkPhaseCards().catch(console.error);
