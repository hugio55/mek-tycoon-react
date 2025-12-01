import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";

config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function initializePhases() {
  console.log("Initializing phase cards...\n");

  // Initialize default phase cards
  const result = await client.mutation(api.phaseCards.initializeDefaultPhaseCards);
  console.log("Initialization result:", result);

  // Now update Phase I and Phase II with correct content
  const cards = await client.query(api.phaseCards.getAllPhaseCards);

  const phaseI = cards.find(card => card.title === "Phase I");
  const phaseII = cards.find(card => card.title === "Phase II");

  if (phaseI) {
    const phaseIDescription = `This phase introduced several of the essential systems of Mek Tycoon:

- Connecting a Cardano wallet
- Generating passive gold
- Upgrading Meks

We had roughly 40 beta testers who put these systems through their paces, pointing out any and all issues along the way.

The modest feature set in this phase is by design; it's imperative that these core mechanics are absolutely rock solid moving forward, since so much is built upon them. Think of this phase as "the foundation" for the intricate world that is Mek Tycoon.`;

    await client.mutation(api.phaseCards.updatePhaseCard, {
      id: phaseI._id,
      header: "Phase I",
      subtitle: "Phase I",
      title: "Foundation",
      description: phaseIDescription,
      imageUrl: "/mek-images/500px/ki1-cb1-nm1.webp",
      locked: false
    });
    console.log("✓ Phase I updated");
  }

  if (phaseII) {
    const phaseIIDescription = `This phase introduces management and player-to-player mechanics:

- NFT Minting integration via NMKR
- The "Market"
- Mek Profiles
- Slots system
- Corporation hub
- Skins
- And more

Phase II tackles ~40% of all the feature sets in Mek Tycoon. This is a substantial amount of work and could likely be the lengthiest phase to develop. Although Phase II comprises of mostly support features, it will be a fun mini game in its own right. Unlike Phase I which lasted over a month, Phase II beta will be split into 1-week sessions. They will be spaced out to allow for fixing of bugs between sessions. Be sure to click "Join Beta" above to learn more about how to participate in this ground floor era.`;

    await client.mutation(api.phaseCards.updatePhaseCard, {
      id: phaseII._id,
      header: "Phase II",
      subtitle: "Phase II",
      title: "Ecosystem",
      description: phaseIIDescription,
      imageUrl: "/mek-images/500px/ed1-cx1-nm1.webp",
      locked: false
    });
    console.log("✓ Phase II updated");
  }

  console.log("\n✓ All phases initialized and updated!");
}

initializePhases().catch(console.error);
