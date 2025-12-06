import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";

// Load environment variables from .env.local
config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function updatePhaseII() {
  // Get all phase cards
  const cards = await client.query(api.phaseCards.getAllPhaseCards);

  console.log("All phase cards:");
  cards.forEach((card: any) => {
    console.log(`  - ${card.title} (order: ${card.order})`);
  });

  // Find Phase II by title
  const phaseII = cards.find((card: any) => card.title?.includes("Phase II") || card.header?.includes("Phase II"));

  if (!phaseII) {
    console.error("Phase II not found!");
    return;
  }

  console.log("\nFound Phase II:", phaseII);

  // Update with new description
  const newDescription = "Phase II tackles ~40% of all the feature sets in Mek Tycoon. This is a substantial amount of work and could likely be the lengthiest phase to develop. Although Phase II comprises of mostly support features, it will be a fun mini game in its own right. Unlike Phase I which lasted over a month, Phase II beta will be split into 1-week sessions. They will be spaced out to allow for fixing of bugs between sessions. Be sure to click \"Join Beta\" above to learn more about how to participate in this ground floor era.";

  await client.mutation(api.phaseCards.updatePhaseCard, {
    id: phaseII._id,
    description: newDescription
  });

  console.log("✓ Phase II description updated successfully!");
}

updatePhaseII().catch(console.error);
